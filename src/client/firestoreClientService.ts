import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ConfirmationResult,
  type IdTokenResult,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
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
  type CommunityAvailabilityStatus,
  type CommunityConnection,
  type CommunityNdtMethod,
  type CommunityOpportunity,
  type CommunityOpportunityType,
  type CommunityPost,
  type CommunityPostComment,
  type CommunityPostReaction,
  type CommunityPostType,
  type CommunityReactionType,
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

export function normalizePhoneDigits(value: string): string {
  // Accept Arabic and Eastern Arabic numerals in contact/OTP phone inputs.
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) & 0xf));
}

export function normalizeE164Phone(raw: string): string {
  const trimmed = normalizePhoneDigits(raw).trim().replace(/[\s\-()]/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  // Egyptian mobile shorthand e.g. 010xxxxxxxx -> +2010xxxxxxxx
  if (/^01[0125]\d{8}$/.test(trimmed)) return `+2${trimmed}`;
  return `+${trimmed}`;
}

function firebaseErrorCode(err: unknown): string | undefined {
  return (err as { code?: string } | null)?.code;
}

export function formatFirebaseAuthError(err: unknown, language: 'ar' | 'en'): string {
  const isAr = language === 'ar';
  switch (firebaseErrorCode(err)) {
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return isAr
        ? 'طريقة الدخول هذه غير مفعّلة. استخدم طريقة أخرى أو تواصل مع دعم إنسكو.'
        : 'This sign-in method is not enabled. Use another method or contact INSCO support.';
    case 'auth/app-not-authorized':
    case 'auth/configuration-not-found':
      return isAr
        ? 'خدمة إنشاء الحساب غير مهيّأة على هذا الموقع. تواصل مع دعم إنسكو.'
        : 'Account registration is not configured for this website. Contact INSCO support.';
    case 'auth/unauthorized-domain':
      return isAr
        ? 'عنوان الموقع الحالي غير معتمد لتسجيل الدخول. افتح بوابة إنسكو من رابطها الرسمي أو تواصل مع الدعم.'
        : 'This website address is not authorized for sign-in. Open the official INSCO site or contact support.';
    case 'auth/email-already-in-use':
      return isAr
        ? 'هذا البريد مسجّل بالفعل. اختر «تسجيل الدخول»، أو استخدم «نسيت كلمة المرور؟».'
        : 'This email is already registered. Sign in or use “Forgot password?”.';
    case 'auth/account-exists-with-different-credential':
      return isAr
        ? 'استخدم طريقة تسجيل الدخول التي أنشأت بها الحساب أول مرة.'
        : 'Use the sign-in method you originally used to create your account.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
      return isAr
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يمكنك طلب رابط لإعادة تعيين كلمة المرور.'
        : 'Incorrect email or password. You can request a password reset link.';
    case 'auth/invalid-email':
      return isAr ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return isAr
        ? 'كلمة المرور لا تستوفي شروط الحساب. اختر كلمة مرور أطول تجمع بين الأحرف والأرقام والرموز.'
        : 'The password does not meet the account requirements. Use a longer password with letters, numbers and symbols.';
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
      return isAr
        ? 'انتهت صلاحية الجلسة. سجّل الخروج ثم ادخل مرة أخرى.'
        : 'Your session has expired. Sign out and sign in again.';
    case 'auth/user-disabled':
      return isAr ? 'الحساب غير متاح. تواصل مع دعم إنسكو.' : 'This account is unavailable. Contact INSCO support.';
    case 'auth/invalid-phone-number':
      return isAr
        ? 'صيغة رقم الهاتف غير صحيحة. اكتبه بالصيغة الدولية مثل +2010XXXXXXXX.'
        : 'Invalid phone number format. Use international format, e.g. +2010XXXXXXXX.';
    case 'auth/invalid-verification-code':
    case 'auth/code-expired':
      return isAr
        ? 'رمز التحقق غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً.'
        : 'Invalid or expired SMS verification code. Request a new code.';
    case 'auth/billing-not-enabled':
      return isAr
        ? 'رسائل التحقق غير متاحة حالياً. استخدم البريد الإلكتروني أو حساب Google.'
        : 'SMS verification is currently unavailable. Use email or Google sign-in.';
    case 'auth/too-many-requests':
      return isAr
        ? 'محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.'
        : 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return isAr
        ? 'تعذّر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت وحاول مرة أخرى.'
        : 'Could not reach the sign-in service. Check your connection and try again.';
    case 'auth/web-storage-unsupported':
      return isAr
        ? 'المتصفح يمنع حفظ جلسة الدخول. اسمح بتخزين بيانات الموقع أو جرّب متصفحاً آخر.'
        : 'The browser blocked session storage. Allow site storage or try another browser.';
    case 'auth/popup-blocked':
      return isAr
        ? 'المتصفح حظر نافذة دخول Google. اسمح بالنوافذ المنبثقة ثم حاول مجدداً.'
        : 'The browser blocked Google sign-in. Allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return isAr
        ? 'أُغلقت نافذة تسجيل الدخول بحساب Google قبل الإتمام.'
        : 'The Google sign-in window was closed before completing.';
    default:
      return isAr
        ? 'تعذّر إتمام العملية. حاول مرة أخرى، أو تواصل مع دعم إنسكو إذا استمرت المشكلة.'
        : 'Could not complete the operation. Try again or contact INSCO support if it persists.';
  }
}

async function prepareClientSession(rememberMe: boolean) {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  } catch {
    throw Object.assign(new Error('Could not set browser session persistence'), { code: 'auth/web-storage-unsupported' });
  }
  return auth;
}

export async function signInClientPortalWithGoogle(rememberMe?: boolean): Promise<User> {
  // The corporate QR entry point shares this helper and has no session toggle.
  const clientAuth = rememberMe === undefined ? auth : await prepareClientSession(rememberMe);
  if (!clientAuth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(clientAuth, provider);
  return cred.user;
}

export async function signUpClientPortalWithEmail(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<User> {
  const clientAuth = await prepareClientSession(rememberMe);
  // Account creation signs the user in. Email delivery and saving the draft
  // must report their own outcomes rather than treating it as a failed signup.
  const cred = await createUserWithEmailAndPassword(clientAuth, email.trim(), password);
  return cred.user;
}

export async function signInClientPortalWithEmail(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<User> {
  const clientAuth = await prepareClientSession(rememberMe);
  const cred = await signInWithEmailAndPassword(clientAuth, email.trim(), password);
  return cred.user;
}

export async function confirmClientPortalVerification(user: User, refresh = false): Promise<boolean> {
  if (refresh) await user.reload();
  if (!isVerifiedPortalUser(user)) return false;

  // Firestore authorizes using ID token claims, not the mutable User object.
  const isVerifiedToken = ({ claims, signInProvider }: IdTokenResult) =>
    claims.email_verified === true || (
      signInProvider === 'phone' && typeof claims.phone_number === 'string' && claims.phone_number.length >= 5
    );
  if (!refresh && isVerifiedToken(await user.getIdTokenResult())) return true;
  return isVerifiedToken(await user.getIdTokenResult(true));
}

export async function resendClientVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function sendClientPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err) {
    // Give the same response for unknown or disabled accounts, even if the
    // Firebase project has not enabled email enumeration protection.
    if (!['auth/user-not-found', 'auth/user-disabled'].includes(firebaseErrorCode(err) ?? '')) throw err;
  }
}

export async function sendClientPhoneOtp(
  rawPhone: string,
  recaptchaContainerId: string,
  rememberMe: boolean
): Promise<ConfirmationResult> {
  const e164Phone = normalizeE164Phone(rawPhone);
  if (!/^\+[1-9]\d{7,14}$/.test(e164Phone)) {
    throw Object.assign(new Error('Invalid phone number'), { code: 'auth/invalid-phone-number' });
  }
  const clientAuth = await prepareClientSession(rememberMe);
  const verifier = new RecaptchaVerifier(clientAuth, recaptchaContainerId, {
    size: 'invisible',
  });
  try {
    return await signInWithPhoneNumber(clientAuth, e164Phone, verifier);
  } finally {
    try {
      verifier.clear();
    } catch {
      // Ignore cleanup error
    }
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
  return onAuthStateChanged(auth, callback);
}

export function isPortalFirestoreReady(): boolean {
  return Boolean(isFirebaseConfigured && db && auth);
}

/* -------------------------------------------------------------------------- */
/* 1. Client Registration & Accounts                                          */
/* -------------------------------------------------------------------------- */

const PENDING_REG_DRAFT_KEY_PREFIX = 'insco_pending_client_reg_v1_';

// Persist only profile fields. Never serialize form credentials or tokens.
function pickRegistrationDraft(value: unknown): ClientRegistrationDraftInput | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const { fullName, phone, organizationName } = source;
  if (typeof fullName !== 'string' || typeof phone !== 'string' || typeof organizationName !== 'string') return null;
  const draft: ClientRegistrationDraftInput = { fullName, phone, organizationName };
  const optionalFields = [
    'personalEmail', 'jobTitle', 'nationalId', 'secondaryPhone', 'personalAddress',
    'organizationNameEn', 'sector', 'commercialRegNo', 'taxCardNo', 'companyPhone',
    'companyEmail', 'website', 'companyAddress', 'cityGovernorate', 'activeScope', 'requestedCompanyCode',
  ] as const;
  for (const field of optionalFields) {
    const val = source[field];
    if (typeof val === 'string') draft[field] = val;
  }
  if (typeof source.autoCreateCompanyWorkspace === 'boolean') {
    draft.autoCreateCompanyWorkspace = source.autoCreateCompanyWorkspace;
  }
  return draft;
}

export function savePendingRegistrationDraft(uid: string, draft: ClientRegistrationDraftInput): boolean {
  try {
    const safeDraft = pickRegistrationDraft(draft);
    if (!safeDraft) return false;
    localStorage.setItem(`${PENDING_REG_DRAFT_KEY_PREFIX}${uid}`, JSON.stringify(safeDraft));
    return true;
  } catch {
    return false;
  }
}

export function loadPendingRegistrationDraft(uid: string): ClientRegistrationDraftInput | null {
  try {
    const raw = localStorage.getItem(`${PENDING_REG_DRAFT_KEY_PREFIX}${uid}`);
    return raw ? pickRegistrationDraft(JSON.parse(raw)) : null;
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

export type ClientProfileSaveResult = 'created' | 'updated' | 'existing';

export function formatClientProfileError(err: unknown, language: 'ar' | 'en'): string {
  const isAr = language === 'ar';
  switch (firebaseErrorCode(err)) {
    case 'unauthenticated':
      return isAr ? 'سجّل الدخول مرة أخرى ثم أعد المحاولة.' : 'Sign in again and retry.';
    case 'permission-denied':
      return isAr
        ? 'قاعدة البيانات رفضت العملية. تأكّد من تفعيل حسابك، وتواصل مع دعم إنسكو إذا استمرت المشكلة.'
        : 'The database denied the operation. Check that your account is verified or contact INSCO support.';
    case 'unavailable':
    case 'deadline-exceeded':
      return isAr
        ? 'تعذّر الاتصال بقاعدة البيانات. تحقق من الإنترنت ثم أعد المحاولة.'
        : 'Could not reach the database. Check your internet connection and retry.';
    default:
      return isAr ? 'تعذّر إتمام العملية. أعد المحاولة.' : 'Could not complete the operation. Try again.';
  }
}

function requireCurrentClient(user: User): void {
  if (auth?.currentUser?.uid !== user.uid) {
    throw Object.assign(new Error('Client session changed'), { code: 'unauthenticated' });
  }
}

export async function saveClientRegistration(
  user: User,
  input: ClientRegistrationDraftInput,
  { createOnly = false } = {}
): Promise<ClientProfileSaveResult> {
  if (!db) throw new Error('Firestore not initialized');
  requireCurrentClient(user);
  const docRef = doc(db, 'client_accounts', user.uid);
  const reqCode = sanitizeUpperCode(input.requestedCompanyCode ?? '');
  const resolvedEmail = clampStr(input.personalEmail, 160) || clampStr(user.email ?? undefined, 160)
    || `${user.uid.slice(0, 12)}@phone.insco.local`;
  const resolvedPhone = clampStr(input.phone, 40) || clampStr(user.phoneNumber ?? undefined, 40);

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

  // Use the server record, not a possibly stale snapshot, to decide between
  // create and update. Automatic onboarding must not overwrite any existing
  // profile, including one saved in another tab during the verification flow.
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(docRef);
    requireCurrentClient(user);
    if (snapshot.exists()) {
      if (createOnly) return 'existing';
      transaction.update(docRef, { ...extendedFields, updatedAt: serverTimestamp() });
      return 'updated';
    }
    const isAdmin = isVerifiedAdminUser(user);
    transaction.set(docRef, {
      uid: user.uid,
      ...extendedFields,
      authMethod: detectUserAuthMethod(user),
      assignedCompanyId: '',
      assignedCompanyCode: '',
      role: isAdmin ? 'admin' : 'client',
      approvalStatus: isAdmin ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return 'created';
  });
}

export async function createInitialCompanyFromRegistration(
  user: User,
  draft: ClientRegistrationDraftInput
): Promise<CompanyRecord> {
  requireCurrentClient(user);
  return createCompanyWithUniqueCode(user.uid, {
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
  return onSnapshot(
    doc(db, 'client_accounts', uid),
    { includeMetadataChanges: true },
    snap => {
      if (snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
      onData(snap.exists() ? (snap.data() as ClientAccount) : null);
    },
    onError
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
    : query(collection(db, 'client_requests'), where('submittedByUid', '==', uid));

  return onSnapshot(
    q,
    snap => {
      const requests = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ClientRequest, 'id'>),
      }));
      if (!isAdmin) requests.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
      onData(requests);
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
    companyCode?: string;
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
  const companyRef = doc(collection(db, 'companies'));
  // The private archive cannot list everyone else's codes. Derive a code
  // for self-service onboarding from the unique document ID instead.
  const companyCode = sanitizeUpperCode(input.companyCode ?? `INS-CO-${companyRef.id}`);
  if (
    companyCode.length < BLUEPRINT_LIMITS.COMPANY_CODE_MIN ||
    !BLUEPRINT_LIMITS.COMPANY_CODE_REGEX.test(companyCode)
  ) {
    throw new Error('Invalid company code format');
  }

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
    headline?: string;
    certifications?: string;
    yearsExperience?: number;
    availabilityStatus?: CommunityAvailabilityStatus;
  },
  existing: CommunityWorkspaceProfile | null
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_workspaces/${user.uid}`;
  const docRef = doc(db, 'community_workspaces', user.uid);

  const sharedFields = {
    displayName: clampStr(input.displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    organizationName: clampStr(input.organizationName, 160),
    sector: clampStr(input.sector, 100),
    city: clampStr(input.city, 100),
    companyCode: sanitizeUpperCode(input.companyCode ?? ''),
    specialtyTrades: clampStr(input.specialtyTrades, 300),
    bio: clampStr(input.bio, 600),
    companiesManaged: Math.max(0, Math.min(10_000, Math.round(input.companiesManaged))),
    isPublished: Boolean(input.isPublished),
    ...(input.headline !== undefined && {
      headline: clampStr(input.headline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX),
    }),
    ...(input.certifications !== undefined && {
      certifications: clampStr(input.certifications, BLUEPRINT_LIMITS.COMMUNITY_CERTS_MAX),
    }),
    ...(typeof input.yearsExperience === 'number' &&
      Number.isFinite(input.yearsExperience) && {
        yearsExperience: Math.max(0, Math.min(70, Math.round(input.yearsExperience))),
      }),
    ...(input.availabilityStatus !== undefined && {
      availabilityStatus: input.availabilityStatus,
    }),
    updatedAt: serverTimestamp(),
  };

  try {
    if (!existing) {
      await setDoc(docRef, {
        uid: user.uid,
        ...sharedFields,
        followersCount: 0,
        endorsementsCount: 0,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, sharedFields);
    }
  } catch (err) {
    handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function endorseMemberWorkspace(targetUid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_workspaces/${targetUid}`;
  try {
    await updateDoc(doc(db, 'community_workspaces', targetUid), {
      endorsementsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
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

/* -------------------------------------------------------------------------- */
/* 8. INSCO Community Social Feed, Comments, Reactions & Opportunities        */
/* -------------------------------------------------------------------------- */

export async function createCommunityPost(
  user: User,
  input: {
    authorName: string;
    authorHeadline?: string;
    authorOrg: string;
    authorCompanyCode?: string;
    postType: CommunityPostType;
    ndtMethod: CommunityNdtMethod;
    title: string;
    body: string;
    tags?: string[];
    technicalSnippet?: string;
    aiSummary?: string;
    visibility?: 'public' | 'members_only';
    isPinnedAnnouncement?: boolean;
  }
): Promise<CommunityPost> {
  if (!db) throw new Error('Firestore not initialized');
  const postRef = doc(collection(db, 'community_posts'));
  const path = `community_posts/${postRef.id}`;

  const cleanTags = (input.tags ?? [])
    .map(t => clampStr(t.replace(/^#/, ''), 32))
    .filter(Boolean)
    .slice(0, BLUEPRINT_LIMITS.COMMUNITY_MAX_TAGS);

  const allowPinned = isVerifiedAdminUser(user) && Boolean(input.isPinnedAnnouncement);

  const payload: Omit<CommunityPost, 'id'> = {
    authorUid: user.uid,
    authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    ...(input.authorHeadline && {
      authorHeadline: clampStr(input.authorHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX),
    }),
    authorOrg: clampStr(input.authorOrg, 160),
    ...(input.authorCompanyCode && {
      authorCompanyCode: sanitizeUpperCode(input.authorCompanyCode),
    }),
    postType: input.postType,
    ndtMethod: input.ndtMethod,
    title: clampStr(input.title, BLUEPRINT_LIMITS.COMMUNITY_POST_TITLE_MAX),
    body: clampStr(input.body, BLUEPRINT_LIMITS.COMMUNITY_POST_BODY_MAX),
    ...(cleanTags.length > 0 && { tags: cleanTags }),
    ...(input.technicalSnippet && {
      technicalSnippet: clampStr(input.technicalSnippet, BLUEPRINT_LIMITS.COMMUNITY_SNIPPET_MAX),
    }),
    ...(input.aiSummary && {
      aiSummary: clampStr(input.aiSummary, BLUEPRINT_LIMITS.COMMUNITY_AI_SUMMARY_MAX),
    }),
    likesCount: 0,
    commentsCount: 0,
    visibility: input.visibility ?? 'public',
    aiModerationStatus: 'approved',
    isPinnedAnnouncement: allowPinned,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(postRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  return { id: postRef.id, ...payload };
}

export async function updateCommunityPostModeration(
  postId: string,
  updates: {
    aiModerationStatus?: 'approved' | 'flagged';
    isPinnedAnnouncement?: boolean;
    aiSummary?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_posts/${postId}`;
  try {
    await updateDoc(doc(db, 'community_posts', postId), {
      ...(updates.aiModerationStatus !== undefined && {
        aiModerationStatus: updates.aiModerationStatus,
      }),
      ...(updates.isPinnedAnnouncement !== undefined && {
        isPinnedAnnouncement: updates.isPinnedAnnouncement,
      }),
      ...(updates.aiSummary !== undefined && {
        aiSummary: clampStr(updates.aiSummary, BLUEPRINT_LIMITS.COMMUNITY_AI_SUMMARY_MAX),
      }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'community_posts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

function createdAtMs(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function subscribeCommunityPosts(
  isAdmin: boolean,
  onData: (posts: CommunityPost[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_posts';
  const q = isAdmin
    ? query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(60))
    : query(collection(db, 'community_posts'), where('visibility', '==', 'public'), limit(60));

  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CommunityPost, 'id'>),
      }));
      list.sort((a, b) => {
        if (a.isPinnedAnnouncement !== b.isPinnedAnnouncement) {
          return a.isPinnedAnnouncement ? -1 : 1;
        }
        return createdAtMs(b.createdAt) - createdAtMs(a.createdAt);
      });
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

export async function setCommunityPostReaction(
  user: User,
  postId: string,
  reactionType: CommunityReactionType,
  existingReaction: CommunityPostReaction | null
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_posts/${postId}/reactions/${user.uid}`;
  const postRef = doc(db, 'community_posts', postId);
  const reactRef = doc(db, 'community_posts', postId, 'reactions', user.uid);
  const batch = writeBatch(db);

  if (existingReaction && existingReaction.reactionType === reactionType) {
    batch.delete(reactRef);
    batch.update(postRef, {
      likesCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } else if (existingReaction) {
    batch.update(reactRef, {
      reactionType,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(reactRef, {
      postId,
      uid: user.uid,
      reactionType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(postRef, {
      likesCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribePostReactions(
  postId: string,
  onData: (reactions: CommunityPostReaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_posts/${postId}/reactions`;
  return onSnapshot(
    collection(db, 'community_posts', postId, 'reactions'),
    snap => {
      onData(snap.docs.map(d => d.data() as CommunityPostReaction));
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

export async function addCommunityPostComment(
  user: User,
  postId: string,
  input: {
    authorName: string;
    authorHeadline?: string;
    body: string;
    isAiAssisted?: boolean;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const commentRef = doc(collection(db, 'community_posts', postId, 'comments'));
  const path = `community_posts/${postId}/comments/${commentRef.id}`;
  const batch = writeBatch(db);

  batch.set(commentRef, {
    postId,
    authorUid: user.uid,
    authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    ...(input.authorHeadline && {
      authorHeadline: clampStr(input.authorHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX),
    }),
    body: clampStr(input.body, BLUEPRINT_LIMITS.COMMUNITY_COMMENT_MAX),
    isAiAssisted: Boolean(input.isAiAssisted),
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'community_posts', postId), {
    commentsCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribePostComments(
  postId: string,
  onData: (comments: CommunityPostComment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_posts/${postId}/comments`;
  return onSnapshot(
    query(collection(db, 'community_posts', postId, 'comments'), orderBy('createdAt', 'asc')),
    snap => {
      onData(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<CommunityPostComment, 'id'>),
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

export async function connectWithCommunityMember(
  user: User,
  fromName: string,
  target: { uid: string; displayName: string }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  if (user.uid === target.uid) return;
  const connId = `${user.uid}_${target.uid}`;
  const path = `community_connections/${connId}`;
  try {
    await setDoc(doc(db, 'community_connections', connId), {
      fromUid: user.uid,
      toUid: target.uid,
      fromName: clampStr(fromName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
      toName: clampStr(target.displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
      status: 'connected',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeMyConnections(
  uid: string,
  onData: (connections: CommunityConnection[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_connections';
  const q = query(collection(db, 'community_connections'), where('fromUid', '==', uid));
  return onSnapshot(
    q,
    snap => {
      onData(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<CommunityConnection, 'id'>),
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

export async function createCommunityOpportunity(
  user: User,
  input: {
    authorName: string;
    authorOrg: string;
    companyCode?: string;
    opportunityType: CommunityOpportunityType;
    title: string;
    location: string;
    methods: string[];
    requirements: string;
  }
): Promise<CommunityOpportunity> {
  if (!db) throw new Error('Firestore not initialized');
  const oppRef = doc(collection(db, 'community_opportunities'));
  const path = `community_opportunities/${oppRef.id}`;
  const cleanMethods = input.methods
    .map(m => clampStr(m, 32))
    .filter(Boolean)
    .slice(0, 8);
  const methods = cleanMethods.length > 0 ? cleanMethods : ['GENERAL'];

  const payload: Omit<CommunityOpportunity, 'id'> = {
    authorUid: user.uid,
    authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    authorOrg: clampStr(input.authorOrg, 160),
    ...(input.companyCode && { companyCode: sanitizeUpperCode(input.companyCode) }),
    opportunityType: input.opportunityType,
    title: clampStr(input.title, 180),
    location: clampStr(input.location, 140),
    methods,
    requirements: clampStr(input.requirements, 1500),
    status: 'open',
    visibility: 'public',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(oppRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  return { id: oppRef.id, ...payload };
}

export async function updateCommunityOpportunityStatus(
  opportunityId: string,
  status: 'open' | 'closed'
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_opportunities/${opportunityId}`;
  try {
    await updateDoc(doc(db, 'community_opportunities', opportunityId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCommunityOpportunities(
  onData: (opportunities: CommunityOpportunity[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_opportunities';
  const q = query(
    collection(db, 'community_opportunities'),
    where('visibility', '==', 'public'),
    limit(40)
  );
  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CommunityOpportunity, 'id'>),
      }));
      list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
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


