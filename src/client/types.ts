export type ClientAccountRole = 'client' | 'engineer' | 'admin';
export type ClientApprovalStatus = 'pending' | 'approved' | 'suspended';
export type ClientAuthMethod = 'google' | 'email' | 'phone';

export interface ClientAccount {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  organizationName: string;
  requestedCompanyCode?: string;
  assignedCompanyId?: string;
  assignedCompanyCode?: string;
  role: ClientAccountRole;
  approvalStatus: ClientApprovalStatus;
  sector?: string;
  authMethod?: ClientAuthMethod;
  // Personal Details
  jobTitle?: string;
  nationalId?: string;
  secondaryPhone?: string;
  personalAddress?: string;
  // Company Details
  organizationNameEn?: string;
  commercialRegNo?: string;
  taxCardNo?: string;
  companyPhone?: string;
  companyEmail?: string;
  website?: string;
  companyAddress?: string;
  cityGovernorate?: string;
  activeScope?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClientRegistrationDraftInput {
  fullName: string;
  personalEmail?: string;
  phone: string;
  jobTitle?: string;
  nationalId?: string;
  secondaryPhone?: string;
  personalAddress?: string;
  organizationName: string;
  organizationNameEn?: string;
  sector?: string;
  commercialRegNo?: string;
  taxCardNo?: string;
  companyPhone?: string;
  companyEmail?: string;
  website?: string;
  companyAddress?: string;
  cityGovernorate?: string;
  activeScope?: string;
  requestedCompanyCode?: string;
  autoCreateCompanyWorkspace?: boolean;
}

export type RequestUrgency = 'standard' | 'priority' | 'emergency_24h';
export type ClientRequestStatus =
  | 'new'
  | 'under_review'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export interface ClientRequest {
  id: string;
  requestCode: string;
  submittedByUid: string;
  submittedByEmail: string;
  companyName: string;
  companyCode?: string;
  contactName: string;
  phone: string;
  serviceMethods: string[];
  projectLocation: string;
  urgency: RequestUrgency;
  scopeSummary: string;
  status: ClientRequestStatus;
  adminNotes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ArchiveCategory = 'active_testing' | 'legacy_archive' | 'new_onboarding';

export interface CompanyRecord {
  id: string;
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
  assignedClientUid: string;
  legacySinceYear?: string;
  reportsCount: number;
  siteLat?: number;
  siteLng?: number;
  geofenceRadiusMeters?: number;
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type EmployeeOnlineStatus = 'on_site' | 'off_duty' | 'in_transit' | 'alert';
export type AttendanceEventType = 'check_in' | 'check_out';
export type GeofenceStatus = 'inside_geofence' | 'outside_geofence';
export type VerificationMethod = 'face_gps' | 'gps_only' | 'manual_override';

export interface CompanyEmployee {
  id: string;
  companyId: string;
  companyCode: string;
  ownerUid: string;
  workerUid?: string;
  fullName: string;
  roleTitle: string;
  badgeCode: string;
  phone?: string;
  faceEnrolled: boolean;
  faceDigest?: string;
  lastLat?: number;
  lastLng?: number;
  lastSeenAt?: string;
  onlineStatus: EmployeeOnlineStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttendanceLog {
  id: string;
  companyId: string;
  companyCode: string;
  ownerUid: string;
  employeeId: string;
  employeeName: string;
  workerUid: string;
  eventType: AttendanceEventType;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  distanceFromSiteMeters: number;
  geofenceRadiusMeters: number;
  geofenceStatus: GeofenceStatus;
  faceVerified: boolean;
  faceSnapshotHash?: string;
  verificationMethod: VerificationMethod;
  deviceLabel?: string;
  notes?: string;
  timestampIso: string;
  createdAt?: unknown;
}

export type CommunityAvailabilityStatus =
  | 'active_field'
  | 'open_to_work'
  | 'hiring'
  | 'offering_services';

export interface CommunityWorkspaceProfile {
  uid: string;
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
  followersCount?: number;
  endorsementsCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CommunityPostType =
  | 'technical_case'
  | 'job_tender'
  | 'discussion'
  | 'equipment_review'
  | 'announcement';

export type CommunityNdtMethod =
  | 'GENERAL'
  | 'RT'
  | 'UT'
  | 'PAUT'
  | 'MT'
  | 'PT'
  | 'VT'
  | 'PWHT'
  | 'AR';

export type CommunityReactionType = 'like' | 'insightful' | 'verified' | 'celebrate';

export interface CommunityPost {
  id: string;
  authorUid: string;
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
  likesCount: number;
  commentsCount: number;
  visibility: 'public' | 'members_only';
  aiModerationStatus: 'approved' | 'flagged';
  isPinnedAnnouncement: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityPostComment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorHeadline?: string;
  body: string;
  isAiAssisted: boolean;
  createdAt?: unknown;
}

export interface CommunityPostReaction {
  postId: string;
  uid: string;
  reactionType: CommunityReactionType;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityConnection {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  status: 'connected' | 'pending';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CommunityOpportunityType = 'job' | 'tender' | 'equipment';

export interface CommunityOpportunity {
  id: string;
  authorUid: string;
  authorName: string;
  authorOrg: string;
  companyCode?: string;
  opportunityType: CommunityOpportunityType;
  title: string;
  location: string;
  methods: string[];
  requirements: string;
  status: 'open' | 'closed';
  visibility: 'public';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type NdtReportMethod =
  | 'RT'
  | 'UT'
  | 'PAUT'
  | 'MT'
  | 'PT'
  | 'VT'
  | 'PMI'
  | 'PWHT'
  | 'HYDRO'
  | 'CUSTOM';

export type ReportVerdict = 'ACCEPT' | 'REJECT' | 'HOLD' | 'REVIEW';
export type ReportStatus = 'draft' | 'issued' | 'archived';

export interface ReportCustomFieldRow {
  label: string;
  value: string;
  unit?: string;
}

export interface TechnicalDataPayload {
  [key: string]: string | number | boolean | ReportCustomFieldRow[] | undefined;
  customFields?: ReportCustomFieldRow[];
}

export interface CompanyInspectionReport {
  id: string;
  companyId: string;
  companyCode: string;
  assignedClientUid: string;
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
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** Strict blueprint validation constants synced with firebase-blueprint.json & firestore.rules */
export const BLUEPRINT_LIMITS = {
  COMPANY_CODE_REGEX: /^[A-Z0-9-]+$/,
  REPORT_NUMBER_REGEX: /^[A-Z0-9-/]+$/,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  COMPANY_CODE_MIN: 3,
  COMPANY_CODE_MAX: 32,
  REPORT_NUMBER_MIN: 3,
  REPORT_NUMBER_MAX: 64,
  NAME_MAX: 180,
  SHORT_NAME_MAX: 120,
  SCOPE_MAX: 1500,
  REQUEST_SCOPE_MAX: 2000,
  NOTES_MAX: 2000,
  ADMIN_NOTES_MAX: 1000,
  MAX_METHODS_PER_REQUEST: 12,
  MAX_TECH_FIELDS: 30,
  MIN_GEOFENCE_RADIUS_M: 50,
  MAX_GEOFENCE_RADIUS_M: 50_000,
  COMMUNITY_POST_TITLE_MAX: 180,
  COMMUNITY_POST_BODY_MAX: 3000,
  COMMUNITY_COMMENT_MAX: 1500,
  COMMUNITY_SNIPPET_MAX: 600,
  COMMUNITY_AI_SUMMARY_MAX: 800,
  COMMUNITY_HEADLINE_MAX: 160,
  COMMUNITY_CERTS_MAX: 240,
  COMMUNITY_MAX_TAGS: 6,
} as const;

export function sanitizeUpperCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, BLUEPRINT_LIMITS.COMPANY_CODE_MAX);
}

export function sanitizeReportNumber(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-/]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, BLUEPRINT_LIMITS.REPORT_NUMBER_MAX);
}

export function generateNextCompanyCode(
  existingCodes: readonly string[],
  prefix = 'INS-CO'
): string {
  const cleanPrefix = sanitizeUpperCode(prefix) || 'INS-CO';
  const existingSet = new Set(existingCodes.map(c => c.trim().toUpperCase()));
  let maxSeq = 100;
  const seqPattern = new RegExp(`^${cleanPrefix}-(\\d+)$`);
  for (const code of existingSet) {
    const match = code.match(seqPattern);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }
  let candidateNum = maxSeq + 1;
  while (existingSet.has(`${cleanPrefix}-${String(candidateNum).padStart(4, '0')}`)) {
    candidateNum += 1;
  }
  return `${cleanPrefix}-${String(candidateNum).padStart(4, '0')}`;
}

export function generateNextReportNumber(
  companyCode: string,
  method: NdtReportMethod,
  existingNumbers: readonly string[]
): string {
  const cleanCo = sanitizeUpperCode(companyCode) || 'INS-CO';
  const year = new Date().getFullYear();
  const base = `${cleanCo}-${method}-${year}`;
  const existingSet = new Set(existingNumbers.map(n => n.trim().toUpperCase()));
  let seq = existingNumbers.length + 1;
  while (existingSet.has(`${base}-${String(seq).padStart(3, '0')}`)) {
    seq += 1;
  }
  return `${base}-${String(seq).padStart(3, '0')}`.slice(0, BLUEPRINT_LIMITS.REPORT_NUMBER_MAX);
}

export function generateRequestCode(): string {
  const year = new Date().getFullYear();
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `REQ-${year}-${stamp}${rand}`.slice(0, 32);
}

export function clampStr(val: string | undefined, max: number): string {
  return (val ?? '').trim().slice(0, max);
}

export function generateNextBadgeCode(
  existingBadges: readonly string[],
  prefix = 'EMP'
): string {
  const cleanPrefix = sanitizeUpperCode(prefix) || 'EMP';
  const existingSet = new Set(existingBadges.map(b => b.trim().toUpperCase()));
  let maxSeq = 100;
  const pattern = new RegExp(`^${cleanPrefix}-(\\d+)$`);
  for (const badge of existingSet) {
    const match = badge.match(pattern);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxSeq) maxSeq = parsed;
    }
  }
  let next = maxSeq + 1;
  while (existingSet.has(`${cleanPrefix}-${String(next).padStart(3, '0')}`)) {
    next += 1;
  }
  return `${cleanPrefix}-${String(next).padStart(3, '0')}`;
}
