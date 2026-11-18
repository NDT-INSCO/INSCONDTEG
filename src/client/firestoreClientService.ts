import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
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
  type ClientAccount,
  type ClientApprovalStatus,
  type ClientRequest,
  type ClientRequestStatus,
  type CompanyInspectionReport,
  type CompanyRecord,
  type NdtReportMethod,
  type ReportStatus,
  type ReportVerdict,
  type RequestUrgency,
  type TechnicalDataPayload,
} from './types';

export function isVerifiedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified &&
      user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
  );
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

export async function saveClientRegistration(
  user: User,
  input: {
    fullName: string;
    phone: string;
    organizationName: string;
    requestedCompanyCode?: string;
    sector?: string;
  },
  existingAccount: ClientAccount | null
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `client_accounts/${user.uid}`;
  const docRef = doc(db, 'client_accounts', user.uid);
  const reqCode = sanitizeUpperCode(input.requestedCompanyCode ?? '');

  try {
    if (!existingAccount) {
      await setDoc(docRef, {
        uid: user.uid,
        fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
        email: clampStr(user.email || 'client@insco.local', 160),
        phone: clampStr(input.phone, 40),
        organizationName: clampStr(input.organizationName, 160),
        requestedCompanyCode: reqCode,
        assignedCompanyId: '',
        assignedCompanyCode: '',
        role: isVerifiedAdminUser(user) ? 'admin' : 'client',
        approvalStatus: isVerifiedAdminUser(user) ? 'approved' : 'pending',
        sector: clampStr(input.sector, 80),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
        phone: clampStr(input.phone, 40),
        organizationName: clampStr(input.organizationName, 160),
        requestedCompanyCode: reqCode,
        sector: clampStr(input.sector, 80),
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
  adminUid: string,
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
    assignedClientUid: clampStr(input.assignedClientUid, 128),
    legacySinceYear: clampStr(input.legacySinceYear, 16),
    reportsCount: 0,
    createdByUid: adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(companyRef, payload);
  batch.set(codeRef, {
    companyCode,
    companyId: companyRef.id,
    createdByUid: adminUid,
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
