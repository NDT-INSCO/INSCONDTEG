import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  auth,
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
  testConnection,
} from '../firebase/config';
import {
  BLUEPRINT_LIMITS,
  clampStr,
  generateNextCompanyCode,
  generateRequestCode,
  sanitizeReportNumber,
  sanitizeUpperCode,
  type ArchiveCategory,
  type AttendanceEventType,
  type AttendanceLog,
  type ClientAccount,
  type ClientApprovalStatus,
  type ClientAuthMethod,
  type ClientRegistrationDraftInput,
  type ClientRequest,
  type ClientRequestStatus,
  type CommunityWorkspaceProfile,
  type CompanyEmployee,
  type CompanyInspectionReport,
  type CompanyRecord,
  type EmployeeOnlineStatus,
  type NdtReportMethod,
  type ReportStatus,
  type ReportVerdict,
  type RequestUrgency,
  type TechnicalDataPayload,
  type VerificationMethod,
} from './types';
import { evaluateGeofence, resolveSiteCoordinates } from './geofencing';

export function isVerifiedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified &&
      user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
  );
}

export function isVerifiedPortalUser(user: User | null): boolean {
  if (!user) return false;
  if (user.emailVerified) return true;
  return Boolean(
    user.phoneNumber &&
      user.providerData?.some(p => p.providerId === 'phone')
  );
}

export function detectUserAuthMethod(user: User | null): ClientAuthMethod {
  const providers = user?.providerData?.map(p => p.providerId) ?? [];
  if (providers.includes('phone')) return 'phone';
  if (providers.includes('password')) return 'email';
  return 'google';
}

export function normalizeE164Phone(raw: string): string {
  const trimmed = raw.trim().replace(/[\s\-()]/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  // Egyptian mobile shorthand e.g. 010xxxxxxxx -> +2010xxxxxxxx
  if (/^01[0125]\d{8}$/.test(trimmed)) return `+2${trimmed}`;
  return `+${trimmed}`;
}

export function formatFirebaseAuthError(err: unknown, language: 'ar' | 'en'): string {
  const isAr = language === 'ar';
  const code = (err as { code?: string })?.code ?? '';
  const message = err instanceof Error ? err.message : String(err);

  if (code === 'auth/operation-not-allowed') {
    return isAr
      ? 'هذه الطريقة غير مفعّلة بعد في لوحة تحكم Firebase (Authentication → Sign-in method). يمكنك الدخول بحساب Google أو تفعيل Email/Phone من Firebase Console.'
      : 'This sign-in provider is not yet enabled in Firebase Console (Authentication → Sign-in method). Enable it in Console or use Google Sign-In.';
  }
  if (code === 'auth/email-already-in-use') {
    return isAr
      ? 'هذا البريد الإلكتروني مسجل بالفعل. بدّل إلى تبويب "تسجيل الدخول" للدخول لحسابك.'
      : 'This email is already registered. Switch to Sign In mode to log into your account.';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
    return isAr
      ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
      : 'Invalid email or password.';
  }
  if (code === 'auth/weak-password') {
    return isAr
      ? 'كلمة المرور ضعيفة — يرجى استخدام 6 أحرف أو أرقام على الأقل.'
      : 'Password is too weak — please use at least 6 characters.';
  }
  if (code === 'auth/invalid-phone-number') {
    return isAr
      ? 'صيغة رقم الهاتف غير صحيحة. يرجى كتابته بالصيغة الدولية مثل +2010XXXXXXXX.'
      : 'Invalid phone number format. Use international format e.g. +2010XXXXXXXX.';
  }
  if (code === 'auth/invalid-verification-code' || code === 'auth/code-expired') {
    return isAr
      ? 'رمز التحقق SMS غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً.'
      : 'Invalid or expired SMS verification code. Please request a new code.';
  }
  if (code === 'auth/billing-not-enabled') {
    return isAr
      ? 'إرسال رسائل SMS الهاتفية يتطلب تفعيل خطة Blaze أو إضافة أرقام اختبار في Firebase Console → Authentication → Phone.'
      : 'SMS phone verification requires Firebase Blaze billing or configured test phone numbers in Firebase Console.';
  }
  if (code === 'auth/too-many-requests') {
    return isAr
      ? 'تم إرسال محاولات كثيرة مؤخراً. يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.'
      : 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return isAr
      ? 'تم إغلاق نافذة تسجيل الدخول بحساب Google قبل الإتمام.'
      : 'Google sign-in popup was closed before completing.';
  }
  return message;
}

export async function signInClientPortalWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signUpClientPortalWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 120) });
  }
  try {
    await sendEmailVerification(cred.user);
  } catch (verifyErr) {
    console.warn('Could not dispatch email verification immediately:', verifyErr);
  }
  return cred.user;
}

export async function signInClientPortalWithEmail(
  email: string,
  password: string
): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function resendClientVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function sendClientPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

export async function sendClientPhoneOtp(
  rawPhone: string,
  recaptchaContainerId: string
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const e164Phone = normalizeE164Phone(rawPhone);
  if (e164Phone.length < 8) {
    throw new Error('Please enter a valid international phone number (e.g. +2010XXXXXXXX).');
  }
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: 'invisible',
  });
  try {
    return await signInWithPhoneNumber(auth, e164Phone, verifier);
  } catch (err) {
    try {
      verifier.clear();
    } catch {
      // Ignore cleanup error
    }
    throw err;
  }
}

export async function signOutClientPortal(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function observeClientPortalAuth(
  callback: (user: User | null) => void
): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  void testConnection();
  return onAuthStateChanged(auth, callback);
}

export function isPortalFirestoreReady(): boolean {
  return Boolean(isFirebaseConfigured && db && auth);
}

/* -------------------------------------------------------------------------- */
/* 1. Client Registration & Accounts                                          */
/* -------------------------------------------------------------------------- */

const PENDING_REG_DRAFT_KEY_PREFIX = 'insco_pending_client_reg_v1_';

export function savePendingRegistrationDraft(
  uid: string,
  draft: ClientRegistrationDraftInput
): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${PENDING_REG_DRAFT_KEY_PREFIX}${uid}`, JSON.stringify(draft));
    }
  } catch {
    // Ignore storage failures
  }
}

export function loadPendingRegistrationDraft(uid: string): ClientRegistrationDraftInput | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`${PENDING_REG_DRAFT_KEY_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as ClientRegistrationDraftInput;
  } catch {
    return null;
  }
}

export function clearPendingRegistrationDraft(uid: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${PENDING_REG_DRAFT_KEY_PREFIX}${uid}`);
    }
  } catch {
    // Ignore storage failures
  }
}

export async function saveClientRegistration(
  user: User,
  input: ClientRegistrationDraftInput,
  existingAccount: ClientAccount | null
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `client_accounts/${user.uid}`;
  const docRef = doc(db, 'client_accounts', user.uid);
  const reqCode = sanitizeUpperCode(input.requestedCompanyCode ?? '');
  const resolvedEmail = clampStr(
    input.personalEmail || user.email || `${user.uid.slice(0, 12)}@phone.insco.local`,
    160
  );
  const resolvedPhone = clampStr(input.phone || user.phoneNumber || '', 40);
  const authMethod = existingAccount?.authMethod ?? detectUserAuthMethod(user);

  const extendedFields = {
    fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    email: resolvedEmail,
    phone: resolvedPhone,
    organizationName: clampStr(input.organizationName, 160),
    requestedCompanyCode: reqCode,
    sector: clampStr(input.sector, 80),
    jobTitle: clampStr(input.jobTitle, 120),
    nationalId: clampStr(input.nationalId, 40),
    secondaryPhone: clampStr(input.secondaryPhone, 40),
    personalAddress: clampStr(input.personalAddress, 240),
    organizationNameEn: clampStr(input.organizationNameEn, 180),
    commercialRegNo: clampStr(input.commercialRegNo, 64),
    taxCardNo: clampStr(input.taxCardNo, 64),
    companyPhone: clampStr(input.companyPhone, 40),
    companyEmail: clampStr(input.companyEmail, 160),
    website: clampStr(input.website, 200),
    companyAddress: clampStr(input.companyAddress, 240),
    cityGovernorate: clampStr(input.cityGovernorate, 100),
    activeScope: clampStr(input.activeScope, 1000),
  };

  try {
    if (!existingAccount) {
      await setDoc(docRef, {
        uid: user.uid,
        ...extendedFields,
        authMethod,
        assignedCompanyId: '',
        assignedCompanyCode: '',
        role: isVerifiedAdminUser(user) ? 'admin' : 'client',
        approvalStatus: isVerifiedAdminUser(user) ? 'approved' : 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        ...extendedFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(
      err,
      existingAccount ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function createInitialCompanyFromRegistration(
  user: User,
  draft: ClientRegistrationDraftInput,
  existingCompanies: readonly CompanyRecord[] = []
): Promise<CompanyRecord> {
  const code =
    sanitizeUpperCode(draft.requestedCompanyCode ?? '') ||
    generateNextCompanyCode(existingCompanies.map(c => c.companyCode));

  return createCompanyWithUniqueCode(user.uid, {
    companyCode: code,
    nameAr: draft.organizationName.trim(),
    nameEn: (draft.organizationNameEn || draft.organizationName).trim(),
    archiveCategory: 'new_onboarding',
    hasActiveTestingDossier: true,
    sector: draft.sector?.trim() || 'Industrial & Contracting',
    commercialRegNo: draft.commercialRegNo?.trim(),
    contactPerson: draft.fullName.trim(),
    contactEmail: (draft.companyEmail || draft.personalEmail || user.email || '').trim(),
    contactPhone: (draft.companyPhone || draft.phone || user.phoneNumber || '').trim(),
    projectLocation: (draft.cityGovernorate || draft.companyAddress || '').trim(),
    activeScope: draft.activeScope?.trim(),
    legacySinceYear: String(new Date().getFullYear()),
    assignedClientUid: user.uid,
  });
}

export function subscribeMyClientAccount(
  uid: string,
  onData: (account: ClientAccount | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData(null);
    return () => {};
  }
  const path = `client_accounts/${uid}`;
  return onSnapshot(
    doc(db, 'client_accounts', uid),
    snap => {
      onData(snap.exists() ? (snap.data() as ClientAccount) : null);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAllClientAccounts(
  onData: (accounts: ClientAccount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'client_accounts';
  const q = query(collection(db, 'client_accounts'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    snap => {
      onData(snap.docs.map(d => d.data() as ClientAccount));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function adminApproveAndLinkClientAccount(params: {
  clientUid: string;
  approvalStatus: ClientApprovalStatus;
  company: CompanyRecord | null;
}): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `client_accounts/${params.clientUid}`;
  const batch = writeBatch(db);

  batch.update(doc(db, 'client_accounts', params.clientUid), {
    approvalStatus: params.approvalStatus,
    assignedCompanyId: params.company?.id ?? '',
    assignedCompanyCode: params.company?.companyCode ?? '',
    updatedAt: serverTimestamp(),
  });

  if (params.company) {
    batch.update(doc(db, 'companies', params.company.id), {
      assignedClientUid: params.clientUid,
      updatedAt: serverTimestamp(),
    });
    // Sync existing reports inside this company so client list queries see them
    const reportsSnap = await getDocs(
      collection(db, 'companies', params.company.id, 'reports')
    );
    for (const rDoc of reportsSnap.docs) {
      batch.update(rDoc.ref, {
        assignedClientUid: params.clientUid,
        updatedAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* -------------------------------------------------------------------------- */
/* 2. Client Requests Intake                                                  */
/* -------------------------------------------------------------------------- */

export async function createClientRequest(
  user: User,
  input: {
    companyName: string;
    companyCode?: string;
    contactName: string;
    phone: string;
    serviceMethods: string[];
    projectLocation: string;
    urgency: RequestUrgency;
    scopeSummary: string;
  }
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const path = 'client_requests';
  const requestCode = generateRequestCode();
  const cleanMethods = input.serviceMethods
    .map(m => clampStr(m, 32))
    .filter(Boolean)
    .slice(0, BLUEPRINT_LIMITS.MAX_METHODS_PER_REQUEST);

  try {
    await addDoc(collection(db, 'client_requests'), {
      requestCode,
      submittedByUid: user.uid,
      submittedByEmail: clampStr(user.email || 'client@insco.local', 160),
      companyName: clampStr(input.companyName, 160),
      companyCode: sanitizeUpperCode(input.companyCode ?? ''),
      contactName: clampStr(input.contactName, 120),
      phone: clampStr(input.phone, 40),
      serviceMethods: cleanMethods.length > 0 ? cleanMethods : ['NDT'],
      projectLocation: clampStr(input.projectLocation, 180),
      urgency: input.urgency,
      scopeSummary: clampStr(input.scopeSummary, BLUEPRINT_LIMITS.REQUEST_SCOPE_MAX),
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return requestCode;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function adminUpdateClientRequest(
  requestId: string,
  updates: {
    status: ClientRequestStatus;
    adminNotes?: string;
    companyCode?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `client_requests/${requestId}`;
  try {
    await updateDoc(doc(db, 'client_requests', requestId), {
      status: updates.status,
      adminNotes: clampStr(updates.adminNotes, BLUEPRINT_LIMITS.ADMIN_NOTES_MAX),
      companyCode: sanitizeUpperCode(updates.companyCode ?? ''),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeClientRequests(
  uid: string,
  isAdmin: boolean,
  onData: (requests: ClientRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'client_requests';
  const q = isAdmin
    ? query(collection(db, 'client_requests'), orderBy('createdAt', 'desc'))
    : query(
        collection(db, 'client_requests'),
        where('submittedByUid', '==', uid),
        orderBy('createdAt', 'desc')
      );

  return onSnapshot(
    q,
    snap => {
      onData(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<ClientRequest, 'id'>),
        }))
      );
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Companies Archive (Unique Company Code + Active Testing Flag)           */
/* -------------------------------------------------------------------------- */

export async function createCompanyWithUniqueCode(
  creatorUid: string,
  input: {
    companyCode: string;
    nameAr: string;
    nameEn: string;
    archiveCategory: ArchiveCategory;
    hasActiveTestingDossier: boolean;
    sector: string;
    commercialRegNo?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    projectLocation?: string;
    activeScope?: string;
    legacySinceYear?: string;
    assignedClientUid?: string;
    siteLat?: number;
    siteLng?: number;
    geofenceRadiusMeters?: number;
  }
): Promise<CompanyRecord> {
  if (!db) throw new Error('Firestore not initialized');
  const companyCode = sanitizeUpperCode(input.companyCode);
  if (
    companyCode.length < BLUEPRINT_LIMITS.COMPANY_CODE_MIN ||
    !BLUEPRINT_LIMITS.COMPANY_CODE_REGEX.test(companyCode)
  ) {
    throw new Error('Invalid company code format');
  }

  const companyRef = doc(collection(db, 'companies'));
  const codeRef = doc(db, 'company_codes', companyCode);
  const path = `companies/${companyRef.id}`;

  const siteCoords = resolveSiteCoordinates({
    siteLat: input.siteLat,
    siteLng: input.siteLng,
    geofenceRadiusMeters: input.geofenceRadiusMeters,
    projectLocation: input.projectLocation,
  });

  const payload = {
    companyCode,
    nameAr: clampStr(input.nameAr, BLUEPRINT_LIMITS.NAME_MAX),
    nameEn: clampStr(input.nameEn, BLUEPRINT_LIMITS.NAME_MAX),
    archiveCategory: input.archiveCategory,
    hasActiveTestingDossier: input.hasActiveTestingDossier,
    sector: clampStr(input.sector, 100),
    commercialRegNo: clampStr(input.commercialRegNo, 64),
    contactPerson: clampStr(input.contactPerson, 120),
    contactEmail: clampStr(input.contactEmail, 160),
    contactPhone: clampStr(input.contactPhone, 40),
    projectLocation: clampStr(input.projectLocation, 180),
    activeScope: clampStr(input.activeScope, BLUEPRINT_LIMITS.SCOPE_MAX),
    assignedClientUid: clampStr(input.assignedClientUid ?? creatorUid, 128),
    legacySinceYear: clampStr(input.legacySinceYear, 16),
    reportsCount: 0,
    siteLat: siteCoords.lat,
    siteLng: siteCoords.lng,
    geofenceRadiusMeters: siteCoords.geofenceRadiusMeters,
    createdByUid: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(companyRef, payload);
  batch.set(codeRef, {
    companyCode,
    companyId: companyRef.id,
    createdByUid: creatorUid,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  return {
    id: companyRef.id,
    ...payload,
  };
}

export async function updateCompanyRecord(
  companyId: string,
  updates: Partial<
    Pick<
      CompanyRecord,
      | 'nameAr'
      | 'nameEn'
      | 'archiveCategory'
      | 'hasActiveTestingDossier'
      | 'sector'
      | 'commercialRegNo'
      | 'contactPerson'
      | 'contactEmail'
      | 'contactPhone'
      | 'projectLocation'
      | 'activeScope'
      | 'legacySinceYear'
      | 'siteLat'
      | 'siteLng'
      | 'geofenceRadiusMeters'
    >
  >
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `companies/${companyId}`;
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      ...(updates.nameAr !== undefined && { nameAr: clampStr(updates.nameAr, 180) }),
      ...(updates.nameEn !== undefined && { nameEn: clampStr(updates.nameEn, 180) }),
      ...(updates.archiveCategory !== undefined && { archiveCategory: updates.archiveCategory }),
      ...(updates.hasActiveTestingDossier !== undefined && {
        hasActiveTestingDossier: updates.hasActiveTestingDossier,
      }),
      ...(updates.sector !== undefined && { sector: clampStr(updates.sector, 100) }),
      ...(updates.commercialRegNo !== undefined && {
        commercialRegNo: clampStr(updates.commercialRegNo, 64),
      }),
      ...(updates.contactPerson !== undefined && {
        contactPerson: clampStr(updates.contactPerson, 120),
      }),
      ...(updates.contactEmail !== undefined && {
        contactEmail: clampStr(updates.contactEmail, 160),
      }),
      ...(updates.contactPhone !== undefined && {
        contactPhone: clampStr(updates.contactPhone, 40),
      }),
      ...(updates.projectLocation !== undefined && {
        projectLocation: clampStr(updates.projectLocation, 180),
      }),
      ...(updates.activeScope !== undefined && {
        activeScope: clampStr(updates.activeScope, BLUEPRINT_LIMITS.SCOPE_MAX),
      }),
      ...(updates.legacySinceYear !== undefined && {
        legacySinceYear: clampStr(updates.legacySinceYear, 16),
      }),
      ...(typeof updates.siteLat === 'number' && Number.isFinite(updates.siteLat) && {
        siteLat: Math.max(-90, Math.min(90, updates.siteLat)),
      }),
      ...(typeof updates.siteLng === 'number' && Number.isFinite(updates.siteLng) && {
        siteLng: Math.max(-180, Math.min(180, updates.siteLng)),
      }),
      ...(typeof updates.geofenceRadiusMeters === 'number' &&
        Number.isFinite(updates.geofenceRadiusMeters) && {
          geofenceRadiusMeters: Math.max(
            BLUEPRINT_LIMITS.MIN_GEOFENCE_RADIUS_M,
            Math.min(BLUEPRINT_LIMITS.MAX_GEOFENCE_RADIUS_M, Math.round(updates.geofenceRadiusMeters))
          ),
        }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCompanies(
  uid: string,
  isAdmin: boolean,
  onData: (companies: CompanyRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'companies';
  const q = isAdmin
    ? query(collection(db, 'companies'), orderBy('companyCode', 'asc'))
    : query(collection(db, 'companies'), where('assignedClientUid', '==', uid));

  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CompanyRecord, 'id'>),
      }));
      list.sort((a, b) => a.companyCode.localeCompare(b.companyCode));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Dedicated Company File / Dossier: Inspection Reports                    */
/* -------------------------------------------------------------------------- */

function sanitizeTechnicalData(raw: TechnicalDataPayload): TechnicalDataPayload {
  const result: TechnicalDataPayload = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (count >= BLUEPRINT_LIMITS.MAX_TECH_FIELDS) break;
    if (v === undefined || v === null || v === '') continue;
    if (k === 'customFields' && Array.isArray(v)) {
      result.customFields = v
        .filter(r => r && typeof r.label === 'string' && r.label.trim().length > 0)
        .slice(0, 15)
        .map(r => ({
          label: clampStr(r.label, 80),
          value: clampStr(String(r.value ?? ''), 160),
          unit: clampStr(r.unit ?? '', 24),
        }));
      count += 1;
    } else if (typeof v === 'string') {
      result[clampStr(k, 64)] = clampStr(v, 300);
      count += 1;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      result[clampStr(k, 64)] = v;
      count += 1;
    }
  }
  return result;
}

export async function createCompanyReport(
  adminUid: string,
  company: CompanyRecord,
  input: {
    reportNumber: string;
    templateKey: string;
    method: NdtReportMethod;
    isLegacyArchive: boolean;
    projectName: string;
    clientPoNumber?: string;
    componentOrJointId: string;
    materialSpec?: string;
    thicknessMm?: string;
    codeStandard: string;
    inspectorName: string;
    inspectionDate: string;
    verdict: ReportVerdict;
    status: ReportStatus;
    technicalData: TechnicalDataPayload;
    notes?: string;
  }
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const reportRef = doc(collection(db, 'companies', company.id, 'reports'));
  const path = `companies/${company.id}/reports/${reportRef.id}`;
  const cleanNumber = sanitizeReportNumber(input.reportNumber);

  const batch = writeBatch(db);
  batch.set(reportRef, {
    companyId: company.id,
    companyCode: company.companyCode,
    assignedClientUid: company.assignedClientUid || '',
    reportNumber: cleanNumber,
    templateKey: clampStr(input.templateKey, 64) || 'custom_template_v1',
    method: input.method,
    isLegacyArchive: input.isLegacyArchive,
    projectName: clampStr(input.projectName, 180),
    clientPoNumber: clampStr(input.clientPoNumber, 80),
    componentOrJointId: clampStr(input.componentOrJointId, 160),
    materialSpec: clampStr(input.materialSpec, 100),
    thicknessMm: clampStr(input.thicknessMm, 40),
    codeStandard: clampStr(input.codeStandard, 120),
    inspectorName: clampStr(input.inspectorName, 120),
    inspectionDate: clampStr(input.inspectionDate, 20),
    verdict: input.verdict,
    status: input.status,
    technicalData: sanitizeTechnicalData(input.technicalData),
    notes: clampStr(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
    createdByUid: adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'companies', company.id), {
    reportsCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return reportRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateCompanyReportStatus(
  companyId: string,
  reportId: string,
  updates: {
    status: ReportStatus;
    verdict: ReportVerdict;
    notes?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `companies/${companyId}/reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'companies', companyId, 'reports', reportId), {
      status: updates.status,
      verdict: updates.verdict,
      ...(updates.notes !== undefined && {
        notes: clampStr(updates.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCompanyReport(
  companyId: string,
  reportId: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `companies/${companyId}/reports/${reportId}`;
  const batch = writeBatch(db);
  batch.delete(doc(db, 'companies', companyId, 'reports', reportId));
  batch.update(doc(db, 'companies', companyId), {
    reportsCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeCompanyReports(
  companyId: string,
  uid: string,
  isAdmin: boolean,
  onData: (reports: CompanyInspectionReport[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `companies/${companyId}/reports`;
  const q = isAdmin
    ? query(collection(db, 'companies', companyId, 'reports'), orderBy('inspectionDate', 'desc'))
    : query(
        collection(db, 'companies', companyId, 'reports'),
        where('assignedClientUid', '==', uid)
      );

  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CompanyInspectionReport, 'id'>),
      }));
      list.sort((a, b) =>
        (b.inspectionDate || '').localeCompare(a.inspectionDate || '')
      );
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Optional Admin Initial Archive Starter                                  */
/* -------------------------------------------------------------------------- */

export async function initializeStarterCompaniesArchive(
  adminUid: string,
  existingCompanies: readonly CompanyRecord[]
): Promise<number> {
  if (existingCompanies.length > 0) return 0;

  const starterDefinitions = [
    {
      code: generateNextCompanyCode([]),
      nameAr: 'سيمنس للطاقة - مشروع محطة كهرباء البرلس 4800 ميجاوات',
      nameEn: 'Siemens Energy — Burullus 4800 MW Power Plant',
      archiveCategory: 'active_testing' as ArchiveCategory,
      hasActiveTestingDossier: true,
      sector: 'Power Generation & Energy',
      commercialRegNo: 'CR-EG-4800-SM',
      contactPerson: 'QA/QC Lead Engineer',
      contactEmail: 'qa-burullus@client.example',
      contactPhone: '+20 100 000 0101',
      projectLocation: 'Kafr El-Sheikh / Burullus, Egypt',
      activeScope: 'HP/LP Steam Piping PAUT, Gamma RT, 65kW PWHT Cycles & Hardness Testing',
      legacySinceYear: '2017',
    },
    {
      code: 'INS-CO-0102',
      nameAr: 'أوراسكوم للإنشاءات - قطاع البنية الصناعية والطاقة',
      nameEn: 'Orascom Construction — Industrial & Power Division',
      archiveCategory: 'active_testing' as ArchiveCategory,
      hasActiveTestingDossier: true,
      sector: 'EPC & Heavy Contracting',
      commercialRegNo: 'CR-EG-2204-OR',
      contactPerson: 'Senior Welding & NDT Coordinator',
      contactEmail: 'ndt-coord@client.example',
      contactPhone: '+20 100 000 0102',
      projectLocation: 'New Administrative Capital & Suez, Egypt',
      activeScope: 'Structural & Process Piping UT/RT, MT/PT Surface Inspection & Hydrostatic Witness',
      legacySinceYear: '2015',
    },
    {
      code: 'INS-CO-0103',
      nameAr: 'بترومسيلة للاستكشاف والإنتاج - أرشيف عقود سابقة',
      nameEn: 'PetroMasila Exploration & Production — Legacy Archive',
      archiveCategory: 'legacy_archive' as ArchiveCategory,
      hasActiveTestingDossier: false,
      sector: 'Oil & Gas Upstream',
      commercialRegNo: 'CR-YE-1409-PM',
      contactPerson: 'Field Integrity Department',
      contactEmail: 'integrity@client.example',
      contactPhone: '+967 00 000 103',
      projectLocation: 'Hadhramaut Sector 14, Yemen',
      activeScope: 'Archived RT/UT Tank & Pipeline Inspection Dossiers & PWHT Charts (2014–2019)',
      legacySinceYear: '2014',
    },
  ];

  let created = 0;
  for (const item of starterDefinitions) {
    const company = await createCompanyWithUniqueCode(adminUid, {
      companyCode: item.code,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      archiveCategory: item.archiveCategory,
      hasActiveTestingDossier: item.hasActiveTestingDossier,
      sector: item.sector,
      commercialRegNo: item.commercialRegNo,
      contactPerson: item.contactPerson,
      contactEmail: item.contactEmail,
      contactPhone: item.contactPhone,
      projectLocation: item.projectLocation,
      activeScope: item.activeScope,
      legacySinceYear: item.legacySinceYear,
      assignedClientUid: '',
    });

    if (item.hasActiveTestingDossier) {
      await createCompanyReport(adminUid, company, {
        reportNumber: `${company.companyCode}-RT-2026-001`,
        templateKey: 'rt_weld_v1',
        method: 'RT',
        isLegacyArchive: true,
        projectName: item.nameEn,
        clientPoNumber: 'PO-2025-8841',
        componentOrJointId: 'LINE-MS-104-W12',
        materialSpec: 'ASTM A335 P91',
        thicknessMm: '32',
        codeStandard: 'ASME B31.1 / Sec V Art. 2',
        inspectorName: 'INSCO NDT Level III Lead',
        inspectionDate: '2026-01-15',
        verdict: 'ACCEPT',
        status: 'archived',
        technicalData: {
          radiationSource: 'Ir-192',
          sourceActivityCi: '44',
          sfdMm: '650',
          technique: 'DWSI',
          filmClass: 'AGFA D7',
          iqiType: 'ASTM 1C',
          filmDensity: '2.65',
          discontinuityNotes: 'No rejectable indications observed.',
        },
        notes: 'Legacy archived dossier baseline record.',
      });
    }
    created += 1;
  }

  return created;
}

/* -------------------------------------------------------------------------- */
/* 6. Workforce Management, Live Map Coordinates & Attendance Timeline        */
/* -------------------------------------------------------------------------- */

export async function createCompanyEmployee(
  actorUid: string,
  company: CompanyRecord,
  input: {
    fullName: string;
    roleTitle: string;
    badgeCode: string;
    phone?: string;
    workerUid?: string;
    faceEnrolled?: boolean;
    faceDigest?: string;
    lastLat?: number;
    lastLng?: number;
  }
): Promise<CompanyEmployee> {
  if (!db) throw new Error('Firestore not initialized');
  const empRef = doc(collection(db, 'companies', company.id, 'employees'));
  const path = `companies/${company.id}/employees/${empRef.id}`;
  const cleanBadge = sanitizeUpperCode(input.badgeCode) || 'EMP-101';
  const ownerUid = company.assignedClientUid || actorUid;

  const payload: Omit<CompanyEmployee, 'id'> = {
    companyId: company.id,
    companyCode: company.companyCode,
    ownerUid,
    workerUid: clampStr(input.workerUid, 128),
    fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    roleTitle: clampStr(input.roleTitle, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    badgeCode: cleanBadge.slice(0, 40),
    phone: clampStr(input.phone, 40),
    faceEnrolled: Boolean(input.faceEnrolled),
    faceDigest: clampStr(input.faceDigest, 128),
    ...(typeof input.lastLat === 'number' && Number.isFinite(input.lastLat) && {
      lastLat: input.lastLat,
    }),
    ...(typeof input.lastLng === 'number' && Number.isFinite(input.lastLng) && {
      lastLng: input.lastLng,
    }),
    lastSeenAt: new Date().toISOString(),
    onlineStatus: 'off_duty',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(empRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  return {
    id: empRef.id,
    ...payload,
  };
}

export async function updateEmployeeLiveLocation(
  companyId: string,
  employeeId: string,
  coords: {
    lat: number;
    lng: number;
    onlineStatus?: EmployeeOnlineStatus;
    faceEnrolled?: boolean;
    faceDigest?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `companies/${companyId}/employees/${employeeId}`;
  try {
    await updateDoc(doc(db, 'companies', companyId, 'employees', employeeId), {
      lastLat: Math.max(-90, Math.min(90, coords.lat)),
      lastLng: Math.max(-180, Math.min(180, coords.lng)),
      lastSeenAt: new Date().toISOString(),
      ...(coords.onlineStatus !== undefined && { onlineStatus: coords.onlineStatus }),
      ...(coords.faceEnrolled !== undefined && { faceEnrolled: coords.faceEnrolled }),
      ...(coords.faceDigest !== undefined && { faceDigest: clampStr(coords.faceDigest, 128) }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCompanyEmployees(
  companyId: string,
  uid: string,
  isAdmin: boolean,
  onData: (employees: CompanyEmployee[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `companies/${companyId}/employees`;
  const q = isAdmin
    ? query(collection(db, 'companies', companyId, 'employees'), orderBy('badgeCode', 'asc'))
    : query(
        collection(db, 'companies', companyId, 'employees'),
        where('ownerUid', '==', uid)
      );

  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CompanyEmployee, 'id'>),
      }));
      list.sort((a, b) => a.badgeCode.localeCompare(b.badgeCode));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function recordEmployeeAttendance(params: {
  actorUid: string;
  company: CompanyRecord;
  employee: CompanyEmployee;
  eventType: AttendanceEventType;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  faceVerified: boolean;
  faceSnapshotHash?: string;
  verificationMethod: VerificationMethod;
  deviceLabel?: string;
  notes?: string;
}): Promise<AttendanceLog> {
  if (!db) throw new Error('Firestore not initialized');
  const logRef = doc(collection(db, 'companies', params.company.id, 'attendance'));
  const path = `companies/${params.company.id}/attendance/${logRef.id}`;

  const site = resolveSiteCoordinates(params.company);
  const evaluation = evaluateGeofence({
    workerLat: params.lat,
    workerLng: params.lng,
    siteLat: site.lat,
    siteLng: site.lng,
    radiusMeters: site.geofenceRadiusMeters,
  });

  const timestampIso = new Date().toISOString();
  const nextStatus: EmployeeOnlineStatus =
    evaluation.status === 'outside_geofence' && params.eventType === 'check_in'
      ? 'alert'
      : params.eventType === 'check_in'
        ? 'on_site'
        : 'off_duty';

  const logPayload: Omit<AttendanceLog, 'id'> = {
    companyId: params.company.id,
    companyCode: params.company.companyCode,
    ownerUid: params.company.assignedClientUid || params.actorUid,
    employeeId: params.employee.id,
    employeeName: clampStr(params.employee.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    workerUid: params.actorUid,
    eventType: params.eventType,
    lat: Math.max(-90, Math.min(90, params.lat)),
    lng: Math.max(-180, Math.min(180, params.lng)),
    ...(typeof params.accuracyMeters === 'number' &&
      Number.isFinite(params.accuracyMeters) && {
        accuracyMeters: Math.max(0, Math.min(50_000, Math.round(params.accuracyMeters))),
      }),
    distanceFromSiteMeters: evaluation.distanceMeters,
    geofenceRadiusMeters: evaluation.radiusMeters,
    geofenceStatus: evaluation.status,
    faceVerified: Boolean(params.faceVerified),
    ...(params.faceSnapshotHash && {
      faceSnapshotHash: clampStr(params.faceSnapshotHash, 128),
    }),
    verificationMethod: params.verificationMethod,
    ...(params.deviceLabel && { deviceLabel: clampStr(params.deviceLabel, 120) }),
    ...(params.notes && { notes: clampStr(params.notes, 500) }),
    timestampIso,
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(logRef, logPayload);
  batch.update(doc(db, 'companies', params.company.id, 'employees', params.employee.id), {
    lastLat: logPayload.lat,
    lastLng: logPayload.lng,
    lastSeenAt: timestampIso,
    onlineStatus: nextStatus,
    ...(params.faceVerified &&
      params.faceSnapshotHash && {
        faceEnrolled: true,
        faceDigest: clampStr(params.faceSnapshotHash, 128),
      }),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  return {
    id: logRef.id,
    ...logPayload,
  };
}

export function subscribeCompanyAttendance(
  companyId: string,
  uid: string,
  isAdmin: boolean,
  onData: (logs: AttendanceLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `companies/${companyId}/attendance`;
  const q = isAdmin
    ? query(collection(db, 'companies', companyId, 'attendance'), orderBy('timestampIso', 'desc'))
    : query(
        collection(db, 'companies', companyId, 'attendance'),
        where('ownerUid', '==', uid)
      );

  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<AttendanceLog, 'id'>),
      }));
      list.sort((a, b) => (b.timestampIso || '').localeCompare(a.timestampIso || ''));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Multi-User Community Workspace Directory (PII-Free)                     */
/* -------------------------------------------------------------------------- */

export async function upsertCommunityWorkspace(
  user: User,
  input: {
    displayName: string;
    organizationName: string;
    sector: string;
    city?: string;
    companyCode?: string;
    specialtyTrades?: string;
    bio?: string;
    companiesManaged: number;
    isPublished: boolean;
  },
  existing: CommunityWorkspaceProfile | null
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_workspaces/${user.uid}`;
  const docRef = doc(db, 'community_workspaces', user.uid);

  try {
    if (!existing) {
      await setDoc(docRef, {
        uid: user.uid,
        displayName: clampStr(input.displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
        organizationName: clampStr(input.organizationName, 160),
        sector: clampStr(input.sector, 100),
        city: clampStr(input.city, 100),
        companyCode: sanitizeUpperCode(input.companyCode ?? ''),
        specialtyTrades: clampStr(input.specialtyTrades, 300),
        bio: clampStr(input.bio, 600),
        companiesManaged: Math.max(0, Math.min(10_000, Math.round(input.companiesManaged))),
        isPublished: Boolean(input.isPublished),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        displayName: clampStr(input.displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
        organizationName: clampStr(input.organizationName, 160),
        sector: clampStr(input.sector, 100),
        city: clampStr(input.city, 100),
        companyCode: sanitizeUpperCode(input.companyCode ?? ''),
        specialtyTrades: clampStr(input.specialtyTrades, 300),
        bio: clampStr(input.bio, 600),
        companiesManaged: Math.max(0, Math.min(10_000, Math.round(input.companiesManaged))),
        isPublished: Boolean(input.isPublished),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export function subscribeMyCommunityWorkspace(
  uid: string,
  onData: (profile: CommunityWorkspaceProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData(null);
    return () => {};
  }
  const path = `community_workspaces/${uid}`;
  return onSnapshot(
    doc(db, 'community_workspaces', uid),
    snap => {
      onData(snap.exists() ? (snap.data() as CommunityWorkspaceProfile) : null);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeCommunityWorkspaces(
  isAdmin: boolean,
  onData: (profiles: CommunityWorkspaceProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_workspaces';
  const q = isAdmin
    ? query(collection(db, 'community_workspaces'), orderBy('updatedAt', 'desc'))
    : query(collection(db, 'community_workspaces'), where('isPublished', '==', true));

  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => d.data() as CommunityWorkspaceProfile);
      list.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

