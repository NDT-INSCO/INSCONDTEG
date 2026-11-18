import React from 'react';
import {
  Award,
  BookOpen,
  Compass,
  Download,
  GraduationCap,
  Layers,
  Sparkles,
  Trophy,
  Wrench,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  academySectionLabel,
  type AcademyRoute,
  type AcademySectionId,
} from '../../utils/portalRoutes';

interface AcademyNavItem {
  id: 'hub' | 'disciplines' | AcademySectionId;
  ar: string;
  en: string;
  hash: string;
  icon: typeof Compass;
}

const ACADEMY_NAV: AcademyNavItem[] = [
  { id: 'hub', ar: 'رئيسية الأكاديمية', en: 'Academy home', hash: '#academy', icon: GraduationCap },
  { id: 'disciplines', ar: 'التخصصات الثمانية', en: 'Eight disciplines', hash: '#academy/disciplines', icon: Layers },
  { id: 'choose', ar: academySectionLabel('choose', 'ar'), en: academySectionLabel('choose', 'en'), hash: '#academy/choose', icon: Compass },
  { id: 'learn', ar: academySectionLabel('learn', 'ar'), en: academySectionLabel('learn', 'en'), hash: '#academy/learn', icon: BookOpen },
  { id: 'practice', ar: academySectionLabel('practice', 'ar'), en: academySectionLabel('practice', 'en'), hash: '#academy/practice', icon: Wrench },
  { id: 'test', ar: academySectionLabel('test', 'ar'), en: academySectionLabel('test', 'en'), hash: '#academy/test', icon: Award },
  { id: 'progress', ar: academySectionLabel('progress', 'ar'), en: academySectionLabel('progress', 'en'), hash: '#academy/progress', icon: Trophy },
  { id: 'mentor', ar: academySectionLabel('mentor', 'ar'), en: academySectionLabel('mentor', 'en'), hash: '#academy/mentor', icon: Sparkles },
];

/** Which nav entry is current for a given academy route. */
export function activeAcademyNavId(route: AcademyRoute): AcademyNavItem['id'] {
  if (route.page === 'hub') return 'hub';
  if (route.page === 'disciplines') return 'disciplines';
  // A discipline page is still part of the discipline branch of the academy.
  if (route.page === 'discipline') return 'disciplines';
  return route.section;
}

interface AcademyHeaderProps {
  language: Language;
  route: AcademyRoute;
  /** Navigate to another academy address (`#academy/…`). */
  onOpenHash: (hash: string) => void;
  /** Leave the academy for the corporate profile. */
  onOpenCompany: () => void;
}

/**
 * The academy door: identity, its own navigation, and the way back.
 *
 * This block is *not* code-split on purpose. It is what proves, on the very
 * first paint after a click, that the visitor has changed portal — the library
 * behind it can still be loading.
 *
 * The academy used to be mounted inside the corporate frame: the company
 * navigation, the RFQ button and the corporate footer all stayed on screen while
 * a learner was studying, which is exactly the "everything floats together"
 * feeling the reorganisation had to remove. From here on the academy names its
 * own sections and keeps the company vocabulary out of the learning path.
 */
export const AcademyHeader: React.FC<AcademyHeaderProps> = ({
  language,
  route,
  onOpenHash,
  onOpenCompany,
}) => {
  const isAr = language === 'ar';
  const current = activeAcademyNavId(route);

  // The syllabus generator needs the whole curriculum, so it is fetched on the
  // click instead of riding along in the shell payload.
  const handleSyllabus = () => {
    void import('../../utils/trainingSyllabusGenerator').then(module => {
      module.downloadTrainingSyllabus(language);
    });
  };

  return (
    <div className="border-b border-amber-500/20 bg-gradient-to-b from-[#12142c] to-[#080914]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <GraduationCap className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                {isAr ? 'بوابة الأكاديمية · مسار المتدرّب' : 'Academy portal · learner path'}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
                {isAr
                  ? 'أكاديمية إنسكو الهندسية للفحص غير الإتلافي'
                  : 'INSCO Non-Destructive Testing Academy'}
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {isAr
                  ? 'مسار مستقل للمهندسين والمتدرّبين: اختر تخصصك، تعلّم وحداته، تدرّب في المعامل، اختبر نفسك، ثم تابع إنجازك في إفادة تعلّم ذاتي غير معتمدة.'
                  : 'An independent path for engineers and trainees: pick a discipline, study its modules, practise in the labs, test yourself, then track a non-accredited self-study statement.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyllabus}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>{isAr ? 'تحميل المنهج التدريبي' : 'Download syllabus'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCompany}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer whitespace-nowrap"
            >
              <span>{isAr ? 'العودة إلى ملف وخدمات الشركة' : 'Back to the corporate profile'}</span>
            </button>
          </div>
        </div>

        <nav
          aria-label={isAr ? 'تنقل الأكاديمية' : 'Academy navigation'}
          className="flex flex-wrap items-center gap-1.5"
        >
          {ACADEMY_NAV.map(item => {
            const Icon = item.icon;
            const isCurrent = item.id === current;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenHash(item.hash)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 bg-[#10132b] border border-[#212752] hover:border-amber-400/40 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-950' : 'text-amber-400'}`}
                  aria-hidden="true"
                />
                <span>{isAr ? item.ar : item.en}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

interface AcademyPageHeaderProps {
  /** Small uppercase line above the page title. */
  eyebrow: string;
  title: string;
  description?: string;
  /** Optional right-hand actions. */
  actions?: React.ReactNode;
}

/** The heading every academy page opens with, so all pages share one rhythm. */
export const AcademyPageHeader: React.FC<AcademyPageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
}) => (
  <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
    <div className="space-y-1.5 max-w-3xl">
      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">{eyebrow}</div>
      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{title}</h2>
      {description && (
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

interface AcademyFooterProps {
  language: Language;
  onOpenHash: (hash: string) => void;
  onOpenCompany: () => void;
}

/**
 * The academy footer — deliberately not the corporate one.
 *
 * A learner at the end of a page gets the six sections, the discipline shelf and
 * an explicit "non-accredited" line; a buyer gets the compliance dossier. The
 * two never share a footer, which is the simplest way to stop the pages drifting
 * into each other.
 */
export const AcademyFooter: React.FC<AcademyFooterProps> = ({
  language,
  onOpenHash,
  onOpenCompany,
}) => {
  const isAr = language === 'ar';
  return (
    <footer className="mt-2 border-t border-[#21264c] bg-[#080914] py-6 text-[11px] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
            <GraduationCap className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>{isAr ? 'أكاديمية إنسكو الهندسية' : 'INSCO Engineering Academy'}</span>
          </div>
          <p className="max-w-xl leading-relaxed">
            {isAr
              ? 'مادة تدريبية وإفادة تعلّم ذاتي غير معتمدة. الشهادات المهنية تصدر من جهات الاعتماد (ASNT / ISO 9712) وليست من الأكاديمية.'
              : 'Training material and a non-accredited self-study statement. Professional certificates are issued by the certification bodies (ASNT / ISO 9712), not by the academy.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ACADEMY_NAV.filter(item => item.id !== 'hub').map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenHash(item.hash)}
              className="rounded-md border border-[#212752] bg-[#10132b] px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-amber-400/40 transition cursor-pointer"
            >
              {isAr ? item.ar : item.en}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenCompany}
            className="rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-slate-700 transition cursor-pointer"
          >
            {isAr ? 'بوابة الشركة' : 'Company portal'}
          </button>
        </div>
      </div>
    </footer>
  );
};
