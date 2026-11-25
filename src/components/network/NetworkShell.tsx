import React from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  LayoutList,
  MessageSquare,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  NETWORK_SECTIONS,
  networkSectionLabel,
  networkSectionShort,
  type NetworkSectionId,
} from '../../utils/portalRoutes';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';

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

interface NetworkHeaderProps {
  language: Language;
  section: NetworkSectionId;
  onOpenSection: (section: NetworkSectionId) => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

/** The network's own navigation — one bounded grid, never a scrolling strip. */
export const NetworkHeader: React.FC<NetworkHeaderProps> = ({
  language,
  section,
  onOpenSection,
  unreadNotifications = 0,
  unreadMessages = 0,
}) => {
  const isAr = language === 'ar';
  const { isLight, toggleTheme } = useTheme();
  const s = networkSurface(isLight);

  return (
    <header data-testid="network-header" className={s.header}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-violet-400">
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">INSCO ENGINEERING NETWORK</span>
            </div>
            <h1 className={`mt-1 truncate text-xl font-black tracking-tight sm:text-2xl ${s.heading}`}>
              {isAr
                ? 'الشبكة الهندسية — المجتمع المهني المتخصص'
                : 'INSCO Engineering Network — Professional Community'}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              data-testid="network-theme-toggle"
              title={isAr ? 'تبديل المظهر الفاتح / الداكن' : 'Toggle Light / Dark mode'}
              className={s.buttonSecondary}
            >
              {isLight ? (
                <Moon className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden="true" />
              ) : (
                <Sun className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
              )}
              <span>{isLight ? (isAr ? 'الوضع الداكن' : 'Dark') : (isAr ? 'الوضع الفاتح' : 'Light')}</span>
            </button>

            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              {isAr ? 'منصة حية بالكامل' : 'Full Live Network'}
            </span>
          </div>
        </div>

        <nav
          aria-label={isAr ? 'أقسام الشبكة الهندسية' : 'Engineering Network sections'}
          className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-12"
        >
          {NETWORK_SECTIONS.map(id => {
            const Icon = NETWORK_ICON[id];
            const isCurrent = id === section;
            const badgeCount =
              id === 'notifications' ? unreadNotifications : id === 'messages' ? unreadMessages : 0;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenSection(id)}
                aria-current={isCurrent ? 'page' : undefined}
                title={networkSectionLabel(id, isAr ? 'ar' : 'en')}
                data-testid={`network-nav-${id}`}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center transition cursor-pointer xl:flex-row xl:gap-1.5 ${
                  isCurrent ? s.navActive : s.navInactive
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isCurrent
                      ? isLight
                        ? 'text-white'
                        : 'text-slate-950'
                      : 'text-violet-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="w-full text-[10px] font-bold leading-tight xl:text-[11px]">
                  <span className="xl:hidden">{networkSectionShort(id, isAr ? 'ar' : 'en')}</span>
                  <span className="hidden xl:inline">{networkSectionLabel(id, isAr ? 'ar' : 'en')}</span>
                </span>
                {badgeCount > 0 ? (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
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
 */
export const NetworkFooter: React.FC<NetworkFooterProps> = ({
  language,
  onOpenCompany,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  return (
    <footer className={s.footer}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className={`flex min-w-0 items-center gap-1.5 text-xs font-bold ${s.heading}`}>
            <Users className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
            <span className="truncate">{isAr ? 'شبكة إنسكو الهندسية' : 'INSCO Engineering Network'}</span>
          </div>
          <p className="max-w-xl leading-relaxed">
            {isAr
              ? 'شبكة مهنية متخصصة في الفحص غير الإتلافي والمعالجة الحرارية والجودة — لا تُعرض فيها شهادات كموثّقة قبل مراجعتها من الإدارة، ولا تُنشر نتائج الأكاديمية دون موافقة صاحبها.'
              : 'A professional network for NDT, PWHT and quality engineering — certificates are never shown as verified before admin review, and academy progress is shared only with member consent.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAcademy}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 transition cursor-pointer hover:border-amber-400"
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'الأكاديمية' : 'Academy'}
          </button>
          <button
            type="button"
            onClick={onOpenCompany}
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-400 transition cursor-pointer hover:border-cyan-400"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'بوابة الشركة' : 'Company portal'}
          </button>
        </div>
      </div>
    </footer>
  );
};
