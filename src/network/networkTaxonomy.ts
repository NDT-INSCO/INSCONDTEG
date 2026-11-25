/**
 * Pure domain taxonomy, org-chart tree engine, ranking, anti-spam & CV builder
 * for the INSCO Engineering Professional Network.
 *
 * Pure module: zero Firebase / DOM side effects.
 */
import type {
  CommunityCompanyDepartment,
  CommunityNdtMethod,
  CommunityPost,
  CommunityVerification,
  CommunityWorkspaceProfile,
  OrgHierarchyRoleKey,
} from '../client/types';

export interface TaxonomyItem<T extends string = string> {
  id: T;
  ar: string;
  en: string;
  code?: string;
  badge?: string;
}

/** Primary NDT Methods */
export const NDT_METHOD_TAXONOMY: TaxonomyItem<CommunityNdtMethod>[] = [
  { id: 'RT', code: 'RT', ar: 'التصوير الإشعاعي (RT)', en: 'Radiographic Testing (RT)' },
  { id: 'UT', code: 'UT', ar: 'الموجات فوق الصوتية (UT)', en: 'Ultrasonic Testing (UT)' },
  { id: 'PAUT', code: 'PAUT', ar: 'المصفوفات الطورية (PAUT)', en: 'Phased Array (PAUT)' },
  { id: 'TOFD', code: 'TOFD', ar: 'حيود زمن الطيران (TOFD)', en: 'Time-of-Flight Diffraction (TOFD)' },
  { id: 'MT', code: 'MT', ar: 'الجسيمات المغناطيسية (MT)', en: 'Magnetic Particle (MT)' },
  { id: 'PT', code: 'PT', ar: 'السوائل المتغلغلة (PT)', en: 'Liquid Penetrant (PT)' },
  { id: 'VT', code: 'VT', ar: 'الفحص البصري (VT)', en: 'Visual Testing (VT)' },
  { id: 'ET', code: 'ET', ar: 'التيارات الدوامية (ET)', en: 'Eddy Current (ET)' },
  { id: 'PWHT', code: 'PWHT', ar: 'المعالجة الحرارية (PWHT)', en: 'Post-Weld Heat Treatment (PWHT)' },
  { id: 'AR', code: 'AR', ar: 'الروبوتات والأتمتة (AR)', en: 'Robotics & Automation (AR)' },
  { id: 'GENERAL', code: 'GEN', ar: 'عام / متعدد الطرق', en: 'General / Multi-method' },
];

/** Related Engineering Fields */
export const RELATED_ENGINEERING_FIELDS: TaxonomyItem[] = [
  { id: 'welding', ar: 'هندسة وفحص اللحام', en: 'Welding Engineering & Inspection' },
  { id: 'qa_qc', ar: 'ضمان وضبط الجودة QA/QC', en: 'Quality Assurance / Quality Control (QA/QC)' },
  { id: 'corrosion', ar: 'التآكل والحماية الكاثودية', en: 'Corrosion & Cathodic Protection' },
  { id: 'metallurgy', ar: 'المعادن والمواد', en: 'Metallurgy & Materials Engineering' },
  { id: 'pipeline', ar: 'هندسة وسلامة خطوط الأنابيب', en: 'Pipeline Integrity & Engineering' },
  { id: 'pressure_vessels', ar: 'أوعية الضغط والمراجل', en: 'Pressure Vessels & Boilers' },
  { id: 'structural', ar: 'الإنشاءات المعدنية والجسور', en: 'Structural Steel & Bridges' },
  { id: 'asset_integrity', ar: 'إدارة سلامة الأصول والتشغيل (AIM)', en: 'Asset Integrity & RBI' },
  { id: 'radiation_safety', ar: 'الحماية والأمان الإشعاعي', en: 'Radiation Safety & RSO' },
  { id: 'training', ar: 'التدريب والتأهيل الهندسي', en: 'Technical Training & Qualification' },
];

/** Standardized Career Roles */
export const CAREER_ROLES: TaxonomyItem[] = [
  { id: 'inspector', ar: 'مفتش / فني فحص غير إتلافي (Level I/II)', en: 'NDT Technician / Inspector (Level I/II)' },
  { id: 'senior_inspector', ar: 'مفتش أول / مشرف موقع', en: 'Senior Inspector / Site Lead' },
  { id: 'ndt_level_3', ar: 'خبير ومؤهَّل مستوى ثالث (NDT Level III)', en: 'NDT Level III Principal Specialist' },
  { id: 'qa_qc_engineer', ar: 'مهندس ضمان وضبط جودة QA/QC', en: 'QA/QC Engineer' },
  { id: 'welding_engineer', ar: 'مهندس لحام (CWI / IWE)', en: 'Welding Engineer (CWI / IWE)' },
  { id: 'materials_engineer', ar: 'مهندس مواد وتآكل', en: 'Materials & Corrosion Engineer' },
  { id: 'rso', ar: 'مسؤول السلامة الإشعاعية RSO', en: 'Radiation Safety Officer (RSO)' },
  { id: 'maintenance_engineer', ar: 'مهندس صيانة وسلامة أصول', en: 'Maintenance & Reliability Engineer' },
  { id: 'department_manager', ar: 'مدير قسم / مدير عمليات فحص', en: 'Department / Inspection Operations Manager' },
  { id: 'technical_director', ar: 'مدير فني / مستشار جودة', en: 'Technical Director / Principal Consultant' },
  { id: 'instructor', ar: 'محاضر ومدرّب هندسي', en: 'Technical Instructor & Examiner' },
];

export const PROFILE_LANGUAGES: TaxonomyItem[] = [
  { id: 'ar', ar: 'العربية', en: 'Arabic' },
  { id: 'en', ar: 'الإنجليزية', en: 'English' },
  { id: 'fr', ar: 'الفرنسية', en: 'French' },
  { id: 'de', ar: 'الألمانية', en: 'German' },
];

/**
 * Academy courses that members can attach to articles, posts, events, or their profile.
 * Deliberately excludes forbidden commercial/isolation strings in rendered #network text.
 */
export const ACADEMY_LINKABLE_COURSES: Array<{
  id: string;
  method: CommunityNdtMethod;
  hash: string;
  ar: string;
  en: string;
}> = [
  {
    id: 'nde-physics',
    method: 'GENERAL',
    hash: '#academy/choose/courses',
    ar: 'فيزياء الفحوصات الهندسية والموجات',
    en: 'NDE Engineering Physics & Wave Fundamentals',
  },
  {
    id: 'nde-rt',
    method: 'RT',
    hash: '#academy/choose/courses',
    ar: 'دورة التصوير الإشعاعي الصناعي والأمان',
    en: 'Industrial Radiography & Film Interpretation Course',
  },
  {
    id: 'nde-ut',
    method: 'UT',
    hash: '#academy/choose/courses',
    ar: 'دورة الموجات فوق الصوتية وفحص اللحام',
    en: 'Ultrasonic Weld Scanning & Calibration Course',
  },
  {
    id: 'nde-paut',
    method: 'PAUT',
    hash: '#academy/practice/paut_controller',
    ar: 'تطبيقات المصفوفة الطورية وحيود زمن الطيران',
    en: 'PAUT & TOFD Advanced Inspection Applications',
  },
  {
    id: 'nde-mt',
    method: 'MT',
    hash: '#academy/choose/courses',
    ar: 'دورة الجسيمات المغناطيسية وإزالة التمغنط',
    en: 'Magnetic Particle Testing & Demagnetisation',
  },
  {
    id: 'nde-pt',
    method: 'PT',
    hash: '#academy/choose/courses',
    ar: 'دورة السوائل المتغلغلة وفحص الأسطح',
    en: 'Liquid Penetrant Surface Inspection Course',
  },
  {
    id: 'nde-vt',
    method: 'VT',
    hash: '#academy/choose/courses',
    ar: 'دورة الفحص البصري وهندسة وصلات اللحام',
    en: 'Visual Testing & Weld Geometry Course',
  },
  {
    id: 'nde-et',
    method: 'ET',
    hash: '#academy/choose/courses',
    ar: 'دورة التيارات الدوامية وفحص المبادلات',
    en: 'Eddy Current & Tubing Inspection Course',
  },
];

/* ---------------------- Interactive Company Org Chart ---------------------- */

export const ORG_HIERARCHY_LEVELS: Array<{
  key: OrgHierarchyRoleKey;
  levelOrder: number;
  ar: string;
  en: string;
}> = [
  { key: 'managing_director', levelOrder: 1, ar: 'المدير التنفيذي / العضو المنتدب', en: 'Managing Director' },
  { key: 'operations_manager', levelOrder: 2, ar: 'مدير العمليات', en: 'Operations Manager' },
  { key: 'technical_manager', levelOrder: 2, ar: 'المدير الفني', en: 'Technical Manager' },
  { key: 'department_manager', levelOrder: 3, ar: 'مدير قسم', en: 'Department Manager' },
  { key: 'team_leader', levelOrder: 4, ar: 'قائد فريق', en: 'Team Leader' },
  { key: 'engineer_inspector', levelOrder: 5, ar: 'مهندس / مفتش / فني', en: 'Engineer / Inspector / Technician' },
  { key: 'custom', levelOrder: 6, ar: 'مستوى تنظيمي مخصص', en: 'Custom Organisational Level' },
];

export interface OrgDepartmentNode {
  department: CommunityCompanyDepartment;
  children: OrgDepartmentNode[];
}

export function buildOrgTree(departments: CommunityCompanyDepartment[]): OrgDepartmentNode[] {
  const byId = new Map<string, OrgDepartmentNode>();
  const ordered = [...departments].sort(
    (a, b) => a.levelOrder - b.levelOrder || a.name.localeCompare(b.name)
  );
  for (const dept of ordered) {
    byId.set(dept.id, { department: dept, children: [] });
  }
  const roots: OrgDepartmentNode[] = [];
  for (const dept of ordered) {
    const node = byId.get(dept.id)!;
    if (dept.parentDepartmentId && dept.parentDepartmentId !== dept.id && byId.has(dept.parentDepartmentId)) {
      byId.get(dept.parentDepartmentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function roleLabelForKey(key: OrgHierarchyRoleKey | undefined, isAr: boolean): string {
  const found = ORG_HIERARCHY_LEVELS.find(item => item.key === key);
  return found ? (isAr ? found.ar : found.en) : isAr ? 'وحدة تنظيمية' : 'Organisational Unit';
}

/* ------------------ Separate Verification vs Reputation ------------------ */

export interface VerificationTrackSummary {
  identity: boolean;
  organization: boolean;
  credential: boolean;
  pendingCount: number;
}

export function computeVerificationTrackState(
  profile: CommunityWorkspaceProfile | null | undefined,
  verifications: CommunityVerification[] = []
): VerificationTrackSummary {
  const approvedIdentity =
    Boolean(profile?.identityVerified) ||
    verifications.some(v => v.track === 'identity' && v.status === 'approved');
  const approvedOrg =
    Boolean(profile?.organizationVerified) ||
    verifications.some(v => v.track === 'organization' && v.status === 'approved');
  const approvedCredential =
    Boolean(profile?.credentialVerified) ||
    verifications.some(v => v.track === 'credential' && v.status === 'approved');
  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  return {
    identity: approvedIdentity,
    organization: approvedOrg,
    credential: approvedCredential,
    pendingCount,
  };
}

export interface MemberReputationSummary {
  postsCount: number;
  acceptedAnswersCount: number;
  endorsementsCount: number;
  /** Strictly non-verification recognition points from activity. */
  recognitionScore: number;
  tierAr: string;
  tierEn: string;
}

export function computeMemberReputationSummary(input: {
  postsCount: number;
  acceptedAnswersCount: number;
  endorsementsCount: number;
}): MemberReputationSummary {
  const score =
    input.postsCount * 10 +
    input.acceptedAnswersCount * 25 +
    input.endorsementsCount * 5;
  const tier =
    score >= 200
      ? { ar: 'مساهم مرجعي', en: 'Principal Contributor' }
      : score >= 75
        ? { ar: 'مهندس نشط', en: 'Active Specialist' }
        : { ar: 'عضو مشارك', en: 'Community Member' };
  return {
    postsCount: input.postsCount,
    acceptedAnswersCount: input.acceptedAnswersCount,
    endorsementsCount: input.endorsementsCount,
    recognitionScore: score,
    tierAr: tier.ar,
    tierEn: tier.en,
  };
}

/* ------------------------ Feed Categorization & Ranking --------------------- */

export type FeedTabCategory =
  | 'for_you'
  | 'following'
  | 'latest'
  | 'technical'
  | 'companies'
  | 'academy'
  | 'groups';

export function filterAndRankPosts(
  posts: CommunityPost[],
  options: {
    tab: FeedTabCategory;
    followedUids?: Set<string>;
    followedCompanyIds?: Set<string>;
    preferredMethod?: string;
    methodFilter?: string;
    searchText?: string;
  }
): CommunityPost[] {
  const methodFilter = (options.methodFilter ?? '').trim().toUpperCase();
  const needle = (options.searchText ?? '').trim().toLowerCase();

  let list = posts.filter(post => {
    if (methodFilter && methodFilter !== 'ALL' && post.ndtMethod !== methodFilter) {
      return false;
    }
    if (needle) {
      const hay = [
        post.title,
        post.body,
        post.authorName,
        post.authorOrg,
        post.ndtMethod,
        ...(post.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    switch (options.tab) {
      case 'following':
        return Boolean(
          options.followedUids?.has(post.authorUid) ||
            (post.companyId && options.followedCompanyIds?.has(post.companyId))
        );
      case 'technical':
        return (
          post.postType === 'technical_case' ||
          post.postType === 'discussion' ||
          post.postFormat === 'question' ||
          post.postFormat === 'case_study' ||
          post.postFormat === 'article'
        );
      case 'companies':
        return post.postFormat === 'company_update' || Boolean(post.companyId);
      case 'academy':
        return post.postFormat === 'academy_share' || Boolean(post.academyCourseId);
      case 'groups':
        return Boolean(post.groupId);
      default:
        return true;
    }
  });

  if (options.tab === 'for_you') {
    const pref = (options.preferredMethod ?? '').toUpperCase();
    list = [...list].sort((a, b) => {
      const score = (p: CommunityPost) => {
        let s = (p.likesCount ?? 0) * 2 + (p.commentsCount ?? 0) * 3 + (p.answersCount ?? 0) * 4;
        if (p.isPinnedAnnouncement) s += 50;
        if (pref && p.ndtMethod === pref) s += 20;
        if (options.followedUids?.has(p.authorUid)) s += 15;
        return s;
      };
      return score(b) - score(a);
    });
  }

  return list;
}

/* --------------------------- Anti-Spam Helper ------------------------------- */

export function detectDuplicatePostRisk(
  title: string,
  body: string,
  recentOwnPosts: CommunityPost[]
): boolean {
  const normTitle = title.trim().toLowerCase();
  const normBody = body.trim().toLowerCase().slice(0, 120);
  if (!normTitle || !normBody) return false;
  return recentOwnPosts.some(
    p =>
      p.title.trim().toLowerCase() === normTitle &&
      p.body.trim().toLowerCase().slice(0, 120) === normBody
  );
}

/* ----------------------------- CV / Resume Export --------------------------- */

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMemberCvHtml(
  profile: CommunityWorkspaceProfile,
  language: 'ar' | 'en',
  tracks?: VerificationTrackSummary
): string {
  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const verifications: string[] = [];
  if (tracks?.identity) verifications.push(isAr ? 'الهوية موثقة' : 'Identity Verified');
  if (tracks?.organization) verifications.push(isAr ? 'المؤسسة موثقة' : 'Organization Verified');
  if (tracks?.credential) verifications.push(isAr ? 'الشهادة مراجَعة' : 'Credential Verified');

  return `<!doctype html>
<html lang="${language}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(profile.displayName)} — INSCO Professional CV</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 820px; margin: 32px auto; padding: 0 20px; line-height: 1.6; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  h2 { margin: 22px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: .05em; color: #5b21b6; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .meta { color: #475569; font-size: 13px; margin-bottom: 12px; }
  .pill { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 10px; font-size: 11px; margin: 2px; }
  .verified { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
  p { margin: 4px 0 10px; font-size: 13px; white-space: pre-wrap; }
</style>
</head>
<body>
  <h1>${escapeHtml(profile.displayName)}</h1>
  <div class="meta">
    ${escapeHtml(profile.headline || '')} · ${escapeHtml(profile.organizationName)}
    ${profile.city ? ` · ${escapeHtml(profile.city)}` : ''}
    ${typeof profile.yearsExperience === 'number' ? ` · ${profile.yearsExperience} ${isAr ? 'سنة خبرة' : 'yrs exp.'}` : ''}
  </div>
  ${verifications.length > 0 ? `<div>${verifications.map(v => `<span class="pill verified">${escapeHtml(v)}</span>`).join('')}</div>` : ''}
  ${profile.bio ? `<h2>${isAr ? 'نبذة مهنية' : 'Summary'}</h2><p>${escapeHtml(profile.bio)}</p>` : ''}
  ${profile.specialtyTrades ? `<h2>${isAr ? 'التخصصات وطرق الفحص' : 'NDT Methods & Specialities'}</h2><p>${escapeHtml(profile.specialtyTrades)}</p>` : ''}
  ${profile.certifications ? `<h2>${isAr ? 'الشهادات (إقرار العضو)' : 'Declared Certifications'}</h2><p>${escapeHtml(profile.certifications)}</p>` : ''}
  ${profile.experienceSummary ? `<h2>${isAr ? 'الخبرة العملية' : 'Experience'}</h2><p>${escapeHtml(profile.experienceSummary)}</p>` : ''}
  ${profile.educationSummary ? `<h2>${isAr ? 'التعليم والتدريب' : 'Education & Training'}</h2><p>${escapeHtml(profile.educationSummary)}</p>` : ''}
  ${profile.projectsSummary ? `<h2>${isAr ? 'أبرز المشاريع الميدانية' : 'Field Projects'}</h2><p>${escapeHtml(profile.projectsSummary)}</p>` : ''}
  ${profile.languages?.length ? `<h2>${isAr ? 'اللغات' : 'Languages'}</h2><div>${profile.languages.map(l => `<span class="pill">${escapeHtml(l)}</span>`).join('')}</div>` : ''}
</body>
</html>`;
}
