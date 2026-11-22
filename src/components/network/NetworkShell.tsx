import React from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  FastForward,
  GraduationCap,
  LayoutList,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  MessageSquare,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  NETWORK_SECTIONS,
  networkSectionLabel,
  networkSectionShort,
  type NetworkSectionId,
} from '../../utils/portalRoutes';

export const NETWORK_ICON: Record<NetworkSectionId, typeof Users> = {
  feed: LayoutList,
  profile: UserRound,
  groups: Users,
  people: UserRound,
  jobs: Briefcase,
  articles: BookOpen,
  events: CalendarDays,
  companies: Building2,
  messages: MessageSquare,
  notifications: Bell,
  search: Search,
  verify: ShieldCheck,
};

/**
 * The prototype ribbon.
 *
 * The addendum forbids presenting demo content as real members or jobs, so the
 * banner is part of the shell (not something a page can forget to render) and
 * every card that carries template data also carries its own badge.
 */
export const NetworkPrototypeBanner: React.FC<{ language: Language; compact?: boolean }> = ({
  language,
  compact = false,
}) => {
  const isAr = language === 'ar';
  return (
    <div
      data-testid="network-prototype-banner"
      role="note"
      className={`flex min-w-0 items-start gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-3 py-2 text-[11px] leading-relaxed text-violet-200 ${
        compact ? '' : 'sm:text-xs'
      }`}
    >
      <FastForward className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
      <span className="min-w-0">
        {isAr
          ? 'حسابك وملفك المهني والمنشورات والتعليقات والإعجاب ودليل الأعضاء والفرص المهنية تعمل الآن على حساب إنسكو الحقيقي. المجموعات والرسائل والإشعارات والتحقق المهني ما زالت تصوراً تصميمياً، وكل إجراء كتابة فيها معطّل بوضوح.'
          : 'Your account, professional card, posts, comments, likes, the member directory and the jobs board now run on the real INSCO account. Groups, messages, notifications and verification are still a design prototype, and their write actions stay visibly disabled.'}
      </span>
    </div>
  );
};

interface NetworkHeaderProps {
  language: Language;
  section: NetworkSectionId;
  onOpenSection: (section: NetworkSectionId) => void;
}

/** The network's own navigation — one bounded grid, never a scrolling strip. */
export const NetworkHeader: React.FC<NetworkHeaderProps> = ({ language, section, onOpenSection }) => {
  const isAr = language === 'ar';
  return (
    <header
      data-testid="network-header"
      className="border-b border-violet-500/20 bg-[#0a0a18]"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-violet-300">
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {isAr ? 'INSCO ENGINEERING NETWORK' : 'INSCO ENGINEERING NETWORK'}
              </span>
            </div>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
              {isAr ? 'الشبكة الهندسية — المجتمع المهني' : 'Engineering Network — the professional community'}
            </h1>
          </div>
          <span className="shrink-0 rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-violet-200">
            {isAr ? 'جزئياً مفعّل' : 'Partly live'}
          </span>
        </div>

        <nav
          aria-label={isAr ? 'أقسام الشبكة الهندسية' : 'Engineering Network sections'}
          className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-12"
        >
          {NETWORK_SECTIONS.map(id => {
            const Icon = NETWORK_ICON[id];
            const isCurrent = id === section;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenSection(id)}
                aria-current={isCurrent ? 'page' : undefined}
                title={networkSectionLabel(id, isAr ? 'ar' : 'en')}
                data-testid={`network-nav-${id}`}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center transition cursor-pointer xl:flex-row xl:gap-1.5 ${
                  isCurrent
                    ? 'bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20'
                    : 'border border-[#232345] bg-[#101028] text-slate-300 hover:border-violet-400/50 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-slate-950' : 'text-violet-300'}`}
                  aria-hidden="true"
                />
                <span className="w-full text-[10px] font-bold leading-tight xl:text-[11px]">
                  <span className="xl:hidden">{networkSectionShort(id, isAr ? 'ar' : 'en')}</span>
                  <span className="hidden xl:inline">{networkSectionLabel(id, isAr ? 'ar' : 'en')}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-3">
          <NetworkPrototypeBanner language={language} compact />
        </div>
      </div>
    </header>
  );
};

interface NetworkFooterProps {
  language: Language;
  onOpenCompany: () => void;
  onOpenAcademy: () => void;
}

/**
 * The network footer — deliberately its own.
 *
 * A member at the end of a page gets the community rules and the two doors back
 * to the company profile and the academy; a buyer never sees this footer.
 */
export const NetworkFooter: React.FC<NetworkFooterProps> = ({ language, onOpenCompany, onOpenAcademy }) => {
  const isAr = language === 'ar';
  return (
    <footer className="mt-4 border-t border-[#232345] bg-[#08080f] py-6 text-[11px] text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-200">
            <Users className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            <span className="truncate">{isAr ? 'شبكة إنسكو الهندسية' : 'INSCO Engineering Network'}</span>
          </div>
          <p className="max-w-xl leading-relaxed">
            {isAr
              ? 'شبكة مهنية متخصصة في الفحص غير الإتلافي والمعالجة الحرارية والجودة — لا تُعرض فيها شهادات كموثّقة قبل التحقق منها، ولا تُنشر نتائج تقييمات الأكاديمية دون موافقة صاحبها.'
              : 'A professional network for NDT, PWHT and quality engineering — certificates are never shown as verified before they are checked, and academy results are never published without the member’s consent.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAcademy}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-400"
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'الأكاديمية' : 'Academy'}
          </button>
          <button
            type="button"
            onClick={onOpenCompany}
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition cursor-pointer hover:border-cyan-400"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'بوابة الشركة' : 'Company portal'}
          </button>
        </div>
      </div>
    </footer>
  );
};
