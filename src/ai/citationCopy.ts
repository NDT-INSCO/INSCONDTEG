/**
 * What the citation list is allowed to say.
 *
 * The tutor can cite two different things, and the difference is the whole point:
 * reviewed course bytes, or the site's own academy material. A single heading for both
 * would turn an unreviewed passage into an approved reference by layout alone, so the
 * wording lives here — one function, tested — instead of being written inline next to a
 * `map()` where it is easy to lose.
 */
import type { TutorMeta } from './contract.js';

export type CitationSource = NonNullable<TutorMeta['source']>;

export interface CitationCopy {
  heading: string;
  note: string;
  /** `academy` is rendered in warning colour; `reviewed` stays neutral. */
  tone: 'reviewed' | 'academy';
}

export function citationCopy(source: CitationSource | undefined, isAr: boolean): CitationCopy {
  if (source === 'academy') {
    return {
      heading: isAr ? 'مقاطع من مادة الأكاديمية — غير مُراجَعة' : 'Passages from the academy corpus — NOT reviewed',
      note: isAr
        ? 'هذه المقاطع من مادة الموقع التعليمية ولم تُراجَع للتدريس. الإجابة استرشادية للتعلّم، ولا تُعد مرجعاً معتمداً ولا شهادة.'
        : 'These passages are the site’s own study material and were not reviewed for teaching. The answer is learning guidance — not an approved reference or a certificate.',
      tone: 'academy',
    };
  }
  return {
    heading: isAr ? 'المقاطع المسترجعة من المصادر المراجَعة' : 'Retrieved reviewed passages',
    note: isAr
      ? 'مادة دراسة ذاتية غير معتمدة. القرارات الفنية تُبنى على نسخة الكود المرخصة في العقد.'
      : 'Self-study material, not accredited. Technical decisions follow the licensed contract code.',
    tone: 'reviewed',
  };
}
