/**
 * Calibration / licence validity for the equipment register.
 *
 * Why this exists: the fleet cards used to paint a green "verified" tick from a
 * hard-coded string, so a unit whose calibration ended in October 2026 still
 * advertised itself as valid in November 2026 — in front of procurement and QA
 * auditors. The colour has to be derived from the date, not written next to it.
 *
 * Precision: the register only holds month-level dates today (`2026-10` means
 * "valid through the end of October 2026"). Day-level dates are accepted
 * unchanged (`2026-10-31`), so certificates can be tightened one record at a
 * time without changing the API.
 */

export type CalibrationState = 'valid' | 'expiring' | 'expired' | 'unknown';

/** Days before expiry at which a record starts warning (amber). */
export const EXPIRING_WINDOW_DAYS = 60;

const MONTH = /^(\d{4})-(\d{2})$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Last moment the record is still valid, in UTC.
 * Month-only input expands to the final day of that month — we never assume an
 * earlier day, because under-claiming validity is the safe direction.
 */
export function validityEnd(validUntil: string | null | undefined): Date | null {
  if (!validUntil) return null;
  const month = MONTH.exec(validUntil);
  if (month) {
    const year = Number(month[1]);
    const monthIndex = Number(month[2]);
    if (monthIndex < 1 || monthIndex > 12) return null;
    return new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59)); // day 0 = last day of monthIndex-1
  }
  const day = DAY.exec(validUntil);
  if (day) {
    const date = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]), 23, 59, 59));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function calibrationState(
  validUntil: string | null | undefined,
  now: Date = new Date(),
  warningDays: number = EXPIRING_WINDOW_DAYS,
): CalibrationState {
  const end = validityEnd(validUntil);
  if (!end) return 'unknown';
  const remainingMs = end.getTime() - now.getTime();
  if (remainingMs < 0) return 'expired';
  if (remainingMs <= warningDays * 24 * 60 * 60 * 1000) return 'expiring';
  return 'valid';
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Human date for the register: month precision stays month precision. */
export function formatValidity(
  validUntil: string | null | undefined,
  language: 'ar' | 'en',
): string {
  if (!validUntil) return language === 'ar' ? 'غير محددة' : 'Not stated';
  const month = MONTH.exec(validUntil);
  if (month) {
    const name = (language === 'ar' ? MONTHS_AR : MONTHS_EN)[Number(month[2]) - 1] ?? month[2];
    return `${name} ${month[1]}`;
  }
  const day = DAY.exec(validUntil);
  if (day) {
    const name = (language === 'ar' ? MONTHS_AR : MONTHS_EN)[Number(day[2]) - 1] ?? day[2];
    return language === 'ar' ? `${Number(day[3])} ${name} ${day[1]}` : `${Number(day[3])} ${name} ${day[1]}`;
  }
  return validUntil;
}

export function calibrationLabel(state: CalibrationState, language: 'ar' | 'en'): string {
  switch (state) {
    case 'valid':
      return language === 'ar' ? 'معايرة سارية' : 'Calibration valid';
    case 'expiring':
      return language === 'ar' ? `تنتهي خلال ${EXPIRING_WINDOW_DAYS} يومًا` : `Expires within ${EXPIRING_WINDOW_DAYS} days`;
    case 'expired':
      return language === 'ar' ? 'المعايرة منتهية' : 'Calibration expired';
    default:
      return language === 'ar' ? 'الصلاحية غير منشورة' : 'Validity not published';
  }
}

/** Tailwind classes per state — green only ever means "provably in date". */
export function calibrationTone(state: CalibrationState): {
  badge: string;
  card: string;
  icon: string;
} {
  switch (state) {
    case 'valid':
      return {
        badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        card: 'border-emerald-500/40',
        icon: 'text-emerald-400',
      };
    case 'expiring':
      return {
        badge: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
        card: 'border-amber-500/40',
        icon: 'text-amber-300',
      };
    case 'expired':
      return {
        badge: 'bg-red-500/10 border-red-500/40 text-red-300',
        card: 'border-red-500/50',
        icon: 'text-red-400',
      };
    default:
      return {
        badge: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
        card: 'border-slate-700',
        icon: 'text-slate-400',
      };
  }
}
