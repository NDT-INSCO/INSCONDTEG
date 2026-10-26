import { NDE_ED_COURSES } from './index';

/**
 * Technical review register.
 *
 * The academy ships courses whose subject structure follows nde-ed.org, but the
 * text is original INSCO work. That does not make a course technically verified.
 * This register records, per course, who is *required* to review it and what has
 * actually been signed.
 *
 * Invariants enforced by `validateReviewEntry` and by tests:
 *  - `pending`  → no reviewer, no date, no checksum.
 *  - `assigned` → a reviewer and an assignment date, still no checksum.
 *  - `reviewed` → reviewer + date + the 64-hex content checksum of the signed build.
 *
 * The register deliberately contains no invented names.
 */

export type ReviewStage = 'pending' | 'assigned' | 'reviewed';

export interface CourseReviewEntry {
  courseId: string;
  stage: ReviewStage;
  /** Role required to sign the technical content, not a person. */
  technicalRole: string;
  /** Safety reviewer required for methods with a physical hazard. */
  safetyRole?: string;
  /** Arabic-language editorial check. */
  editorRole: string;
  reviewer?: string;
  safetyReviewer?: string;
  assignedOn?: string;
  reviewedAt?: string;
  /** SHA-256 of the signed content, taken from public/edb/index.json. */
  checksum?: string;
}

const ROLES: Record<string, { technicalRole: string; safetyRole?: string }> = {
  'nde-physics': { technicalRole: 'NDT Level III — cross-method physics' },
  'nde-vt': { technicalRole: 'VT Level III' },
  'nde-pt': { technicalRole: 'PT Level III', safetyRole: 'Chemical safety / ventilation' },
  'nde-mt': { technicalRole: 'MT Level III', safetyRole: 'Electrical and magnetic field safety' },
  'nde-ut': { technicalRole: 'UT Level III' },
  'nde-rt': { technicalRole: 'RT Level III', safetyRole: 'Radiation protection' },
  'nde-et': { technicalRole: 'ET Level III' },
};

export const NDE_ED_REVIEW_REGISTER: CourseReviewEntry[] = NDE_ED_COURSES.map(course => {
  const roles = ROLES[course.id] || { technicalRole: `${course.code} Level III` };
  return {
    courseId: course.id,
    stage: 'pending',
    technicalRole: roles.technicalRole,
    safetyRole: roles.safetyRole,
    editorRole: 'Arabic technical editor',
  };
});

export const REVIEW_STAGE_LABEL: Record<ReviewStage, { ar: string; en: string }> = {
  pending: { ar: 'مراجعة فنية معلّقة', en: 'Technical review pending' },
  assigned: { ar: 'مُعيَّن — بانتظار التوقيع', en: 'Assigned — awaiting signature' },
  reviewed: { ar: 'راجعها المستوى الثالث', en: 'Level III reviewed' },
};

const CHECKSUM = /^[a-f0-9]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateReviewEntry(entry: CourseReviewEntry): string[] {
  const errors: string[] = [];
  if (!entry.courseId) errors.push('courseId is required');
  if (!entry.technicalRole || !entry.editorRole) errors.push('roles must be named for every course');

  if (entry.stage === 'pending') {
    if (entry.reviewer || entry.safetyReviewer || entry.reviewedAt || entry.checksum) {
      errors.push('a pending review cannot carry a reviewer, date or checksum');
    }
  }

  if (entry.stage === 'assigned') {
    if (!entry.reviewer) errors.push('an assigned review needs a reviewer');
    if (!entry.assignedOn || !ISO_DATE.test(entry.assignedOn)) errors.push('an assigned review needs an ISO assignment date');
    if (entry.checksum) errors.push('an assigned review cannot carry a checksum before signature');
  }

  if (entry.stage === 'reviewed') {
    if (!entry.reviewer) errors.push('a reviewed course needs a named reviewer');
    if (!entry.reviewedAt || !ISO_DATE.test(entry.reviewedAt)) errors.push('a reviewed course needs an ISO review date');
    if (!entry.checksum || !CHECKSUM.test(entry.checksum)) errors.push('a reviewed course needs the signed 64-hex checksum');
    if (entry.safetyRole && !entry.safetyReviewer) errors.push('a course with a safety role needs a safety reviewer');
  }

  return errors;
}

export function reviewFor(courseId: string): CourseReviewEntry | undefined {
  return NDE_ED_REVIEW_REGISTER.find(entry => entry.courseId === courseId);
}

export function reviewSummary() {
  const total = NDE_ED_REVIEW_REGISTER.length;
  const reviewed = NDE_ED_REVIEW_REGISTER.filter(entry => entry.stage === 'reviewed').length;
  const assigned = NDE_ED_REVIEW_REGISTER.filter(entry => entry.stage === 'assigned').length;
  return {
    total,
    reviewed,
    assigned,
    pending: total - reviewed - assigned,
    /** UI wording is derived from data, never hard-coded to "reviewed". */
    label: reviewed === total
      ? { ar: 'كل المقررات راجعها المستوى الثالث', en: 'All courses Level III reviewed' }
      : { ar: `${reviewed}/${total} مقرراً تمت مراجعته`, en: `${reviewed}/${total} courses reviewed` },
  };
}

/** Checksum of a signed build, read from the generated EDB index when available. */
export function checksumForCourse(index: { books?: { id: string; checksum?: string }[] } | null, courseId: string): string | undefined {
  if (!index || !Array.isArray(index.books)) return undefined;
  return index.books.find(book => book.id === `edb-course-${courseId}`)?.checksum;
}
