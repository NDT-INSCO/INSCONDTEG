import React from 'react';
import { BriefcaseBusiness, Building2, GraduationCap, ChevronLeft, ChevronRight, Users, Network } from 'lucide-react';
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
  onOpenCommunity?: () => void;
}

/**
 * The permanent indicator at the very top of every screen across the four portals.
 */
export const PortalSwitchBar: React.FC<PortalSwitchBarProps> = ({
  language,
  portal,
  trail = [],
  onSwitchPortal,
  onOpenCommunity,
}) => {
  const isAr = language === 'ar';
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const steps = trail.filter(step => Boolean(step.label));

  const door = (
    id: PortalId,
    labelAr: string,
    labelEn: string,
    shortAr: string,
    shortEn: string,
    Icon: typeof Building2
  ) => {
    const isCurrent = portal === id;
    const activeStyle =
      id === 'company'
        ? 'bg-sky-300 text-slate-950 shadow-sm'
        : id === 'client'
          ? 'bg-emerald-300 text-slate-950 shadow-sm'
          : id === 'network'
            ? 'bg-violet-300 text-slate-950 shadow-sm'
            : 'bg-amber-500 text-slate-950 shadow-sm';
    return (
      <button
        type="button"
        onClick={() => {
          if (!isCurrent) onSwitchPortal(id);
        }}
        aria-current={isCurrent ? 'page' : undefined}
        className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] sm:px-2.5 font-bold transition cursor-pointer whitespace-nowrap ${
          isCurrent ? activeStyle : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="hidden size-3.5 shrink-0 sm:block" aria-hidden="true" />
        <span className="hidden sm:inline">{isAr ? labelAr : labelEn}</span>
        <span className="sm:hidden">{isAr ? shortAr : shortEn}</span>
      </button>
    );
  };

  return (
    <div
      className={`portal-switch-strip border-b text-[11px] ${
        portal === 'network'
          ? 'border-violet-500/30 bg-[#0a0a18]'
          : portal === 'academy'
            ? 'border-amber-500/20 bg-[#0b0c1c]'
            : portal === 'client'
              ? 'border-emerald-500/25 bg-slate-950'
              : 'border-slate-800 bg-slate-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:flex-nowrap">
          <span className="hidden md:inline text-[10px] font-mono uppercase tracking-wider text-slate-300 whitespace-nowrap">
            {isAr ? 'المسار الحالي' : 'Current path'}
          </span>
          <div
            role="group"
            aria-label={
              isAr
                ? 'تبديل المسار بين بوابة الشركة وبوابة العملاء والأكاديمية والشبكة الهندسية'
                : 'Switch between Company, Client, Academy and Engineering Network portals'
            }
            className="flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-0.5"
          >
            {door('company', 'بوابة الشركة', 'Company portal', 'الشركة', 'Company', Building2)}
            {door('client', 'بوابة العملاء', 'Client portal', 'العملاء', 'Clients', BriefcaseBusiness)}
            {door('academy', 'أكاديمية إنسكو', 'INSCO Academy', 'الأكاديمية', 'Academy', GraduationCap)}
            {door('network', 'الشبكة الهندسية', 'Engineering Network', 'الشبكة', 'Network', Network)}
          </div>
          {onOpenCommunity && portal !== 'network' && (
            <button
              type="button"
              onClick={onOpenCommunity}
              className="inline-flex items-center gap-1 rounded-md border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3 h-3" aria-hidden="true" />
              <span>{isAr ? 'مجتمع INSCO' : 'INSCO Community'}</span>
            </button>
          )}
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
