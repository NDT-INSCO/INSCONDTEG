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

export type CommunityMessagePolicy = 'everyone' | 'connections' | 'none';

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
  connectionsCount?: number;
  endorsementsCount?: number;
  /** Storage URL or an HTTPS link the member pasted; rules require https. */
  photoURL?: string;
  bannerURL?: string;
  /** Their own LinkedIn profile; the rules accept LinkedIn hosts only. */
  linkedInUrl?: string;
  /** Absence means public — see NETWORK_PROFILE_VISIBILITY. */
  profileVisibility?: 'public' | 'members';
  /**
   * Declared skills, comma-separated ids from `NETWORK_SKILLS` (max 20).
   * One string on purpose: `firestore.rules` can then prove the whole field.
   */
  skills?: string;
  professionalRole?: string;
  relatedFields?: string[];
  languages?: string[];
  experienceSummary?: string;
  educationSummary?: string;
  projectsSummary?: string;
  shareAcademyProgress?: boolean;
  messagePolicy?: CommunityMessagePolicy;
  /** Admin-only verification tracks — strictly independent. */
  identityVerified?: boolean;
  organizationVerified?: boolean;
  credentialVerified?: boolean;
  verifiedOrganizationId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CommunityPostType =
  | 'technical_case'
  | 'job_tender'
  | 'discussion'
  | 'equipment_review'
  | 'announcement';

export type CommunityPostFormat =
  | 'standard'
  | 'question'
  | 'case_study'
  | 'poll'
  | 'article'
  | 'academy_share'
  | 'company_update'
  | 'event_share';

export type CommunityNdtMethod =
  | 'GENERAL'
  | 'RT'
  | 'UT'
  | 'PAUT'
  | 'TOFD'
  | 'MT'
  | 'PT'
  | 'VT'
  | 'ET'
  | 'PWHT'
  | 'AR';

export type CommunityReactionType = 'like' | 'insightful' | 'verified' | 'celebrate';

export interface CommunityReactionsBreakdown {
  like?: number;
  insightful?: number;
  verified?: number;
  celebrate?: number;
}

export interface CommunityPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorHeadline?: string;
  authorOrg: string;
  authorCompanyCode?: string;
  postType: CommunityPostType;
  categoryTag?: 'general' | 'article' | 'question' | 'case_study' | 'media' | 'poll' | 'job' | 'company_update' | 'academy' | 'event';
  postFormat?: CommunityPostFormat;
  ndtMethod: CommunityNdtMethod;
  title: string;
  body: string;
  tags?: string[];
  technicalSnippet?: string;
  aiSummary?: string;
  isAiAssisted?: boolean;
  aiGenerated?: boolean;
  pollOptions?: string[];
  mediaUrl?: string;
  documentUrl?: string;
  linkUrl?: string;
  attachmentLabel?: string;
  externalLink?: string;
  academyCourseId?: string;
  academyCourseTitle?: string;
  academyLessonTitle?: string;
  companyId?: string;
  companyName?: string;
  eventId?: string;
  groupId?: string;
  likesCount: number;
  commentsCount: number;
  answersCount?: number;
  acceptedAnswerId?: string;
  isSolved?: boolean;
  reactionsBreakdown?: CommunityReactionsBreakdown;
  visibility: 'public' | 'members_only';
  aiModerationStatus: 'approved' | 'flagged';
  isPinnedAnnouncement: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityPostAnswer {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorHeadline?: string;
  body: string;
  references?: string;
  academyCourseId?: string;
  upvotesCount: number;
  isAccepted: boolean;
  expertReviewed: boolean;
  reviewerUid?: string;
  reviewerName?: string;
  isAiAssisted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityPollVote {
  id: string;
  postId: string;
  uid: string;
  optionIndex: number;
  createdAt?: unknown;
}

export type CommunityGroupJoinPolicy = 'open' | 'request' | 'invite';
export type CommunityGroupPostPolicy = 'members' | 'owners';
export type CommunityGroupMemberStatus = 'pending' | 'approved' | 'rejected';

/**
 * A group the members run themselves: the owner picks how people join and who may
 * post, and `firestore.rules` enforces both choices.
 */
export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  ownerUid: string;
  ownerName: string;
  joinPolicy: CommunityGroupJoinPolicy;
  postPolicy: CommunityGroupPostPolicy;
  coverURL?: string;
  discipline?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** One row per (group, member); the document id is `groupId_uid`. */
export interface CommunityGroupMember {
  id: string;
  groupId: string;
  uid: string;
  displayName: string;
  role: 'owner' | 'member';
  status: CommunityGroupMemberStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** A post inside one group. It never enters the public network feed. */
export interface CommunityGroupPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorHeadline?: string;
  title?: string;
  body: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityGroupResource {
  id: string;
  groupId: string;
  authorUid: string;
  authorName: string;
  kind: 'document' | 'announcement' | 'event';
  title: string;
  description: string;
  url?: string;
  eventDateIso?: string;
  createdAt?: unknown;
}

/**
 * One confirmed member vouching for one skill on another member's card.
 * The id is deterministic (`toUid_skillId_fromUid`), so a second endorsement of
 * the same skill by the same member cannot exist — it is a set, not a counter.
 */
export interface CommunityEndorsement {
  id: string;
  toUid: string;
  skillId: string;
  fromUid: string;
  fromName: string;
  createdAt?: unknown;
}

/** Written words about a colleague — one per pair, editable by its author. */
export interface CommunityRecommendation {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  relation: string;
  body: string;
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
  parentCommentId?: string;
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
export type CommunityEmploymentType = 'full_time' | 'part_time' | 'contract' | 'shutdown' | 'freelance' | 'internship' | 'training' | 'project_based';
export type CommunityExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead';

export interface CommunityOpportunity {
  id: string;
  authorUid: string;
  authorName: string;
  authorOrg: string;
  companyCode?: string;
  companyId?: string;
  opportunityType: CommunityOpportunityType;
  employmentType?: CommunityEmploymentType;
  experienceLevel?: CommunityExperienceLevel;
  salaryRange?: string;
  applicationsCount?: number;
  title: string;
  location: string;
  methods: string[];
  requirements: string;
  status: 'open' | 'closed';
  visibility: 'public';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CommunityJobApplicationStatus = 'submitted' | 'shortlisted' | 'contacted' | 'rejected';

export interface CommunityJobApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  employerUid: string;
  applicantUid: string;
  applicantName: string;
  applicantHeadline?: string;
  applicantOrg?: string;
  coverNote: string;
  cvSummary?: string;
  status: CommunityJobApplicationStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityCompany {
  id: string;
  ownerUid: string;
  name: string;
  nameAr?: string;
  industry: string;
  description: string;
  headquarters?: string;
  branches?: string;
  website?: string;
  contactEmail?: string;
  services: string[];
  specializations: string[];
  projectsSummary?: string;
  logoURL?: string;
  coverURL?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  followersCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type OrgHierarchyRoleKey =
  | 'managing_director'
  | 'operations_manager'
  | 'technical_manager'
  | 'department_manager'
  | 'team_leader'
  | 'engineer_inspector'
  | 'custom';

export interface CommunityCompanyDepartment {
  id: string;
  companyId: string;
  name: string;
  parentDepartmentId?: string;
  levelOrder: number;
  roleTitle: string;
  roleKey?: OrgHierarchyRoleKey;
  managerUid?: string;
  managerName?: string;
  services?: string[];
  specialties?: string[];
  activeProjects?: string[];
  overview?: string;
  teamMembersCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityCompanyAffiliation {
  id: string;
  companyId: string;
  companyName: string;
  departmentId?: string;
  departmentName?: string;
  employeeUid: string;
  employeeName: string;
  roleTitle: string;
  invitedByUid: string;
  status: 'invited' | 'accepted' | 'declined' | 'removed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CommunityEventKind = 'conference' | 'webinar' | 'workshop' | 'seminar' | 'training' | 'career_fair' | 'networking';

export interface CommunityEvent {
  id: string;
  organizerUid: string;
  organizerName: string;
  organizerOrg: string;
  companyId?: string;
  eventType: CommunityEventKind;
  title: string;
  description: string;
  speakers?: string[];
  dateIso: string;
  venueOrLink: string;
  capacity: number;
  attendeesCount: number;
  academyCourseId?: string;
  postEventResources?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityEventRegistration {
  id: string;
  eventId: string;
  uid: string;
  displayName: string;
  status: 'registered' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityFollow {
  id: string;
  followerUid: string;
  targetType: 'member' | 'company';
  targetId: string;
  targetName: string;
  createdAt?: unknown;
}

export interface CommunityBookmark {
  id: string;
  uid: string;
  postId: string;
  postTitle: string;
  createdAt?: unknown;
}

export interface CommunityMessageThread {
  id: string;
  participantUids: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastSenderUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityDirectMessage {
  id: string;
  threadId: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  body: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt?: unknown;
}

export type CommunityEmailCategory =
  | 'general'
  | 'technical_inquiry'
  | 'inspection_coordination'
  | 'job_inquiry'
  | 'academy';

export type CommunityEmailPriority = 'normal' | 'urgent';

export interface CommunityEmail {
  id: string;
  participantUids: string[];
  senderUid: string;
  senderName: string;
  senderOrg?: string;
  recipientUid: string;
  recipientName: string;
  subject: string;
  category: CommunityEmailCategory;
  priority: CommunityEmailPriority;
  body: string;
  attachmentUrl?: string;
  replyToEmailId?: string;
  recipientRead: boolean;
  senderStarred: boolean;
  recipientStarred: boolean;
  senderFolder: 'sent' | 'archive';
  recipientFolder: 'inbox' | 'archive';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityBlock {
  id: string;
  blockerUid: string;
  blockedUid: string;
  reason?: string;
  createdAt?: unknown;
}

export type CommunityNotificationCategory =
  | 'connection'
  | 'comment'
  | 'reaction'
  | 'group'
  | 'job'
  | 'message'
  | 'academy'
  | 'verification'
  | 'event';

export interface CommunityNotification {
  id: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
  category: CommunityNotificationCategory;
  title: string;
  body: string;
  linkSection?: string;
  linkEntryId?: string;
  isRead: boolean;
  createdAt?: unknown;
}

export interface CommunityNotificationPrefs {
  uid: string;
  connections: boolean;
  comments: boolean;
  groups: boolean;
  jobs: boolean;
  messages: boolean;
  events: boolean;
  academy: boolean;
  weeklyDigest: boolean;
  updatedAt?: unknown;
}

export type VerificationTrack = 'identity' | 'organization' | 'credential';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface CommunityVerification {
  id: string;
  uid: string;
  memberName: string;
  track: VerificationTrack;
  subjectTitle: string;
  issuerOrCompany: string;
  evidenceNote: string;
  evidenceUrl?: string;
  companyId?: string;
  status: VerificationStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityReport {
  id: string;
  reporterUid: string;
  reporterName: string;
  targetType: 'post' | 'comment' | 'answer' | 'company' | 'job' | 'user' | 'message';
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed' | 'action_taken';
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
