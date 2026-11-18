import React from 'react';
import { Building2, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language } from '../types';
import type { PortalId } from '../utils/portalRoutes';

export interface PortalTrailStep {
  label: string;
  onClick?: () => void;
}

interface PortalSwitchBarProps {
  language: Language;
  /** Which portal the visitor is standing in right now. */
  portal: PortalId;
  /** Portal › section › page, from the left (RTL) or right (LTR). */
  trail?: PortalTrailStep[];
  onSwitchPortal: (portal: PortalId) => void;
}

/**
 * The permanent indicator at the very top of every screen.
 *
 * Before this bar the two portals were only distinguishable by a button buried
 * in the navigation; a reader who followed an academy link could not tell which
 * side of the company they were on. The bar names the current portal, offers the
 * other one in a single click, and repeats where the reader is in the hierarchy.
 * It sits *above* the header so it never competes with the page navigation.
 */
export const PortalSwitchBar: React.FC<PortalSwitchBarProps> = ({
  language,
  portal,
  trail = [],
  onSwitchPortal,
}) => {
  const isAr = language === 'ar';
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const steps = trail.filter(step => Boolean(step.label));

  const door = (
    id: PortalId,
    labelAr: string,
    labelEn: string,
    Icon: typeof Building2
  ) => {
    const isCurrent = portal === id;
    return (
      <button
        type="button"
        onClick={() => {
          if (!isCurrent) onSwitchPortal(id);
        }}
        aria-current={isCurrent ? 'page' : undefined}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
          isCurrent
            ? id === 'company'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-amber-500 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{isAr ? labelAr : labelEn}</span>
        <span className="sm:hidden">{isAr ? (id === 'company' ? 'الشركة' : 'الأكاديمية') : id === 'company' ? 'Company' : 'Academy'}</span>
      </button>
    );
  };

  return (
    <div
      className={`border-b text-[11px] ${
        portal === 'academy'
          ? 'border-amber-500/20 bg-[#0b0c1c]'
          : 'border-slate-800 bg-slate-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden md:inline text-[10px] font-mono uppercase tracking-wider text-slate-500 whitespace-nowrap">
            {isAr ? 'المسار الحالي' : 'Current path'}
          </span>
          <div
            role="group"
            aria-label={isAr ? 'تبديل المسار بين بوابة الشركة والأكاديمية' : 'Switch between the company and the academy'}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-0.5"
          >
            {door('company', 'بوابة الشركة', 'Company portal', Building2)}
            {door('academy', 'أكاديمية إنسكو', 'INSCO Academy', GraduationCap)}
          </div>
        </div>

        {steps.length > 0 && (
          <nav
            aria-label={isAr ? 'مسار التنقل داخل البوابة' : 'Breadcrumb'}
            className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 min-w-0 truncate"
          >
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const content = (
                <span className={isLast ? 'text-slate-200 font-semibold truncate' : 'truncate'}>
                  {step.label}
                </span>
              );
              return (
                <React.Fragment key={`${step.label}-${index}`}>
                  {index > 0 && <Chevron className="w-3 h-3 shrink-0 text-slate-600" aria-hidden="true" />}
                  {step.onClick && !isLast ? (
                    <button
                      type="button"
                      onClick={step.onClick}
                      className="hover:text-cyan-300 transition cursor-pointer truncate"
                    >
                      {content}
                    </button>
                  ) : (
                    content
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};
