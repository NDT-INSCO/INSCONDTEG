import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  LayoutList,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { Language } from '../../types';
import type { NetworkSectionId } from '../../utils/portalRoutes';
import type {
  CommunityCompany,
  CommunityEmail,
  CommunityEvent,
  CommunityNotification,
  CommunityPost,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { NetworkFooter, NetworkHeader } from './NetworkShell';
import { SiteAccountActions, type AccountPanelRequest } from '../account/SiteAccountActions';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { VerificationTrackBadges } from './NetworkBadges';

const NetworkProfileSection = lazy(() =>
  import('./NetworkProfileSection').then(module => ({ default: module.NetworkProfileSection }))
);
const NetworkFeedSection = lazy(() =>
  import('./NetworkFeedSection').then(module => ({ default: module.NetworkFeedSection }))
);
const NetworkJobsSection = lazy(() =>
  import('./NetworkJobsSection').then(module => ({ default: module.NetworkJobsSection }))
);
const NetworkDirectorySection = lazy(() =>
  import('./NetworkDirectorySection').then(module => ({ default: module.NetworkDirectorySection }))
);
const NetworkMemberProfile = lazy(() =>
  import('./NetworkMemberProfile').then(module => ({ default: module.NetworkMemberProfile }))
);
const NetworkGroupsSection = lazy(() =>
  import('./NetworkGroupsSection').then(module => ({ default: module.NetworkGroupsSection }))
);
const NetworkGroupPage = lazy(() =>
  import('./NetworkGroupPage').then(module => ({ default: module.NetworkGroupPage }))
);
const NetworkArticlesSection = lazy(() =>
  import('./NetworkArticlesSection').then(module => ({ default: module.NetworkArticlesSection }))
);
const NetworkEventsSection = lazy(() =>
  import('./NetworkEventsSection').then(module => ({ default: module.NetworkEventsSection }))
);
const NetworkCompaniesSection = lazy(() =>
  import('./NetworkCompaniesSection').then(module => ({ default: module.NetworkCompaniesSection }))
);
const NetworkMessagesSection = lazy(() =>
  import('./NetworkMessagesSection').then(module => ({ default: module.NetworkMessagesSection }))
);
const NetworkNotificationsSection = lazy(() =>
  import('./NetworkNotificationsSection').then(module => ({ default: module.NetworkNotificationsSection }))
);
const NetworkSearchSection = lazy(() =>
  import('./NetworkSearchSection').then(module => ({ default: module.NetworkSearchSection }))
);
const NetworkVerifySection = lazy(() =>
  import('./NetworkVerifySection').then(module => ({ default: module.NetworkVerifySection }))
);

export interface NetworkPortalProps {
  language: Language;
  section: NetworkSectionId;
  entryId?: string;
  onOpenSection: (section: NetworkSectionId, entryId?: string) => void;
  onOpenCompany: () => void;
  onOpenAcademy: () => void;
  onOpenPrivateProfile?: () => void;
}

const LoadingSection: React.FC<{ language: Language }> = ({ language }) => (
  <p role="status" className="p-4 text-[11px] text-slate-400">
    {language === 'ar' ? 'جارٍ تحميل بيانات الشبكة…' : 'Loading network section…'}
  </p>
);

/**
 * The fourth portal — full-stack INSCO Engineering Network.
 * All 12 sections run live on Firestore with Light & Dark mode, contextual rails,
 * and mobile quick navigation bar.
 */
export const NetworkPortal: React.FC<NetworkPortalProps> = ({
  language,
  section,
  entryId,
  onOpenSection,
  onOpenCompany,
  onOpenAcademy,
  onOpenPrivateProfile,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();
  const uid = account?.user?.uid ?? null;
  const serviceReady = account?.available ?? false;

  const openSection = useCallback(
    (next: NetworkSectionId, nextEntryId?: string) => onOpenSection(next, nextEntryId),
    [onOpenSection]
  );

  const [panelRequest, setPanelRequest] = useState<AccountPanelRequest | null>(null);
  const requestPanel = useCallback((panel: AccountPanelRequest['panel']) => {
    setPanelRequest(current => ({ panel, nonce: (current?.nonce ?? 0) + 1 }));
  }, []);
  const openAccount = useCallback(() => requestPanel('signin'), [requestPanel]);
  const openAccountPanel = useCallback(
    (panel: AccountPanelRequest['panel']) => requestPanel(panel),
    [requestPanel]
  );

  // Live rail telemetry & unread counters
  const [myCard, setMyCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [myEmails, setMyEmails] = useState<CommunityEmail[]>([]);
  const [topPosts, setTopPosts] = useState<CommunityPost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CommunityEvent[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<CommunityCompany[]>([]);

  useEffect(() => {
    if (!serviceReady) return;
    let active = true;
    const unsubs: Array<() => void> = [];

    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeCommunityPosts(
          false,
          list => {
            if (active) setTopPosts(list.slice(0, 4));
          },
          () => {}
        )
      );
      if (uid) {
        unsubs.push(
          api.subscribeMyCommunityWorkspace(
            uid,
            next => {
              if (active) setMyCard(next);
            },
            () => {}
          )
        );
      }
    });

    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeCommunityEvents(
          list => {
            if (active) setUpcomingEvents(list.filter(e => e.status === 'upcoming').slice(0, 3));
          },
          () => {}
        )
      );
      unsubs.push(
        api.subscribeCommunityCompanies(
          list => {
            if (active) setFeaturedCompanies(list.slice(0, 4));
          },
          () => {}
        )
      );
      if (uid) {
        unsubs.push(
          api.subscribeMyNotifications(
            uid,
            list => {
              if (active) setNotifications(list);
            },
            () => {}
          )
        );
        if (typeof api.subscribeMyEmails === 'function') {
          unsubs.push(
            api.subscribeMyEmails(
              uid,
              list => {
                if (active) setMyEmails(list);
              },
              () => {}
            )
          );
        }
      }
    });

    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [serviceReady, uid]);

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadInboxEmails = uid
    ? myEmails.filter(e => e.recipientUid === uid && e.recipientFolder === 'inbox' && !e.recipientRead).length
    : 0;
  const unreadMessages =
    notifications.filter(n => !n.isRead && n.category === 'message').length + unreadInboxEmails;

  const body = (() => {
    switch (section) {
      case 'feed':
        return (
          <div data-testid="network-section-feed">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkFeedSection
                language={language}
                onOpenAccount={openAccountPanel}
                onOpenProfile={() => openSection('profile')}
                onOpenAcademy={onOpenAcademy}
              />
            </Suspense>
          </div>
        );
      case 'profile':
        return (
          <div data-testid="network-section-profile">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkProfileSection
                language={language}
                onOpenAccount={openAccountPanel}
                onOpenPublicPage={myUid => openSection('people', myUid)}
                onOpenMessages={target => openSection('messages', target)}
                onOpenVerify={() => openSection('verify')}
              />
            </Suspense>
          </div>
        );
      case 'people':
        if (entryId) {
          return (
            <div data-testid="network-section-member">
              <Suspense fallback={<LoadingSection language={language} />}>
                <NetworkMemberProfile
                  uid={entryId}
                  language={language}
                  onOpenAccount={openAccountPanel}
                  onOpenProfile={() => openSection('profile')}
                  onOpenDirectory={() => openSection('people')}
                  onOpenMember={memberUid => openSection('people', memberUid)}
                  onOpenMessage={targetUid => openSection('messages', targetUid)}
                  onOpenEmail={targetUid => openSection('messages', targetUid ? `mail:${targetUid}` : 'mail')}
                  onOpenVerify={() => openSection('verify')}
                  onOpenAcademy={onOpenAcademy}
                  onOpenCompany={onOpenCompany}
                />
              </Suspense>
            </div>
          );
        }
        return (
          <div data-testid="network-section-people">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkDirectorySection
                language={language}
                onOpenAccount={openAccount}
                onOpenProfile={() => openSection('profile')}
                onOpenMember={memberUid => openSection('people', memberUid)}
                onOpenMessage={memberUid => openSection('messages', memberUid)}
                onOpenEmail={memberUid => openSection('messages', `mail:${memberUid}`)}
              />
            </Suspense>
          </div>
        );
      case 'groups':
        if (entryId) {
          return (
            <div data-testid="network-section-group">
              <Suspense fallback={<LoadingSection language={language} />}>
                <NetworkGroupPage
                  groupId={entryId}
                  language={language}
                  onOpenAccount={openAccountPanel}
                  onOpenProfile={() => openSection('profile')}
                  onBack={() => openSection('groups')}
                />
              </Suspense>
            </div>
          );
        }
        return (
          <div data-testid="network-section-groups">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkGroupsSection
                language={language}
                onOpenAccount={openAccountPanel}
                onOpenProfile={() => openSection('profile')}
                onOpenGroup={groupId => openSection('groups', groupId)}
              />
            </Suspense>
          </div>
        );
      case 'jobs':
        return (
          <div data-testid="network-section-jobs">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkJobsSection
                language={language}
                onOpenAccount={openAccountPanel}
                onOpenProfile={() => openSection('profile')}
              />
            </Suspense>
          </div>
        );
      case 'articles':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkArticlesSection
              language={language}
              onOpenAccount={openAccountPanel}
              onOpenProfile={() => openSection('profile')}
              onOpenAcademy={onOpenAcademy}
            />
          </Suspense>
        );
      case 'events':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkEventsSection
              language={language}
              onOpenAccount={openAccountPanel}
              onOpenProfile={() => openSection('profile')}
              onOpenAcademy={onOpenAcademy}
            />
          </Suspense>
        );
      case 'companies':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkCompaniesSection
              language={language}
              selectedCompanyId={entryId}
              onOpenAccount={openAccountPanel}
              onOpenProfile={() => openSection('profile')}
              onOpenCompanyPortal={onOpenCompany}
              onSelectCompany={cid => openSection('companies', cid)}
            />
          </Suspense>
        );
      case 'messages':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkMessagesSection
              language={language}
              initialTargetUid={entryId}
              onOpenAccount={openAccountPanel}
              onOpenProfile={() => openSection('profile')}
              onOpenMember={memberUid => openSection('people', memberUid)}
            />
          </Suspense>
        );
      case 'notifications':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkNotificationsSection
              language={language}
              onOpenAccount={openAccountPanel}
              onOpenSection={openSection}
            />
          </Suspense>
        );
      case 'search':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkSearchSection language={language} onOpenSection={openSection} />
          </Suspense>
        );
      case 'verify':
        return (
          <Suspense fallback={<LoadingSection language={language} />}>
            <NetworkVerifySection
              language={language}
              onOpenAccount={openAccountPanel}
              onOpenProfile={() => openSection('profile')}
            />
          </Suspense>
        );
      default:
        return (
          <div data-testid="network-section-feed">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkFeedSection
                language={language}
                onOpenAccount={openAccountPanel}
                onOpenProfile={() => openSection('profile')}
                onOpenAcademy={onOpenAcademy}
              />
            </Suspense>
          </div>
        );
    }
  })();

  return (
    <div
      data-portal="network"
      data-section={section}
      {...(entryId ? { 'data-entry-id': entryId } : {})}
      className={`min-h-screen pb-16 md:pb-0 ${s.shell}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <NetworkHeader
        language={language}
        section={section}
        onOpenSection={next => openSection(next)}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />

      {account && onOpenPrivateProfile && (
        <div id="network-account-bar" className="mx-auto max-w-7xl">
          <SiteAccountActions
            language={language}
            onOpenProfile={onOpenPrivateProfile}
            requestPanel={panelRequest}
          />
        </div>
      )}

      <main
        key={account?.user ? `account:${account.user.uid}` : 'guest'}
        id="insco-main"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6"
      >
        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_240px]">
          {/* Start contextual rail */}
          <aside className="hidden min-w-0 space-y-3 lg:block">
            <div className={`${s.card} space-y-2 p-3`}>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/15 text-xs font-bold text-violet-400">
                  {myCard ? myCard.displayName.charAt(0) : <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-bold ${s.heading}`}>
                    {myCard ? myCard.displayName : isAr ? 'زائر الشبكة' : 'Network Guest'}
                  </p>
                  <p className={`truncate text-[10px] ${s.subtext}`}>
                    {myCard ? myCard.headline || myCard.organizationName : isAr ? 'سجّل الدخول لإكمال بطاقتك' : 'Sign in to publish your card'}
                  </p>
                </div>
              </div>
              {myCard ? <VerificationTrackBadges profile={myCard} language={language} isLight={isLight} /> : null}
              <button
                type="button"
                onClick={() => openSection('profile')}
                className={`${s.buttonSecondary} w-full justify-center`}
              >
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {myCard ? (isAr ? 'تحديث ملفي' : 'Edit my profile') : (isAr ? 'إنشاء بطاقة' : 'Create card')}
              </button>
              {myCard && uid ? (
                <button
                  type="button"
                  onClick={() => openSection('people', uid)}
                  className={`${s.buttonSecondary} w-full justify-center`}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                  {isAr ? 'صفحتي (وضع فيسبوك)' : 'My personal page'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => openSection('messages', 'mail')}
                className={`${s.buttonSecondary} w-full justify-center`}
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                {isAr ? 'الماسنجر والبريد' : 'Messenger & Mail'}
              </button>
              <button
                type="button"
                onClick={() => openSection('verify')}
                className={`${s.buttonSecondary} w-full justify-center`}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                {isAr ? 'بوابة التوثيق' : 'Verification hub'}
              </button>
            </div>

            <div className={`${s.card} space-y-2 p-3`}>
              <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                {isAr ? 'ربط الأكاديمية' : 'INSCO Academy'}
              </h3>
              <p className={`text-[10px] leading-relaxed ${s.subtext}`}>
                {isAr
                  ? 'اربط دورات الأكاديمية بمقالاتك، واعرض إنجازك في ملفك عند رغبتك.'
                  : 'Attach Academy courses to articles or opt-in to display your achievements.'}
              </p>
              <button
                type="button"
                onClick={onOpenAcademy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-400 cursor-pointer hover:border-amber-400"
              >
                <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {isAr ? 'الانتقال للأكاديمية' : 'Open Academy'}
              </button>
            </div>
          </aside>

          {/* Main Active Section */}
          <div className="min-w-0">{body}</div>

          {/* End contextual discovery rail */}
          <aside className="hidden min-w-0 space-y-3 xl:block">
            <div className={`${s.card} space-y-2 p-3`}>
              <h3 className={`text-xs font-bold ${s.heading}`}>
                {isAr ? 'أحدث النقاشات' : 'Latest discussions'}
              </h3>
              {topPosts.length === 0 ? (
                <p className={`text-[10px] ${s.subtext}`}>
                  {isAr ? 'ستظهر أحدث المنشورات هنا.' : 'Recent technical posts appear here.'}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {topPosts.map(p => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => openSection('feed', p.id)}
                        className={`${s.subCard} w-full p-2 text-start cursor-pointer hover:border-violet-400`}
                      >
                        <p className={`line-clamp-2 text-[11px] font-bold ${s.heading}`}>{p.title}</p>
                        <p className={`mt-0.5 text-[9px] ${s.subtext}`}>{p.authorName} · {p.ndtMethod}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${s.card} space-y-2 p-3`}>
              <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                {isAr ? 'فعاليات قادمة' : 'Upcoming events'}
              </h3>
              {upcomingEvents.length === 0 ? (
                <p className={`text-[10px] ${s.subtext}`}>
                  {isAr ? 'لا توجد فعاليات قادمة بعد.' : 'No upcoming events yet.'}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {upcomingEvents.map(ev => (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={() => openSection('events', ev.id)}
                        className={`${s.subCard} w-full p-2 text-start cursor-pointer hover:border-violet-400`}
                      >
                        <p className={`truncate text-[11px] font-bold ${s.heading}`}>{ev.title}</p>
                        <p className={`text-[9px] ${s.subtext}`}>{ev.dateIso}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${s.card} space-y-2 p-3`}>
              <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                {isAr ? 'مؤسسات هندسية' : 'Engineering Companies'}
              </h3>
              {featuredCompanies.length === 0 ? (
                <p className={`text-[10px] ${s.subtext}`}>
                  {isAr ? 'أنشئ صفحة مؤسستك في قسم المؤسسات.' : 'Register an organisation in Companies.'}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {featuredCompanies.map(c => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openSection('companies', c.id)}
                        className={`${s.subCard} w-full p-2 text-start cursor-pointer hover:border-violet-400`}
                      >
                        <p className={`truncate text-[11px] font-bold ${s.heading}`}>{isAr && c.nameAr ? c.nameAr : c.name}</p>
                        <p className={`truncate text-[9px] ${s.subtext}`}>{c.industry}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Quick Bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t px-1 py-1.5 md:hidden ${
          isLight ? 'border-slate-200 bg-white/95 text-slate-700' : 'border-[#232345] bg-[#0a0a18]/95 text-slate-300'
        }`}
      >
        {(
          [
            { id: 'feed', icon: LayoutList, ar: 'المنشورات', en: 'Feed' },
            { id: 'search', icon: Search, ar: 'البحث', en: 'Search' },
            { id: 'messages', icon: MessageSquare, ar: 'الرسائل', en: 'DMs' },
            { id: 'notifications', icon: Bell, ar: 'التنبيهات', en: 'Alerts' },
            { id: 'profile', icon: UserRound, ar: 'ملفي', en: 'Profile' },
          ] as const
        ).map(item => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openSection(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded py-1 text-[9px] font-bold cursor-pointer ${
                active ? 'text-violet-500' : ''
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? item.ar : item.en}</span>
            </button>
          );
        })}
      </div>

      <NetworkFooter language={language} onOpenCompany={onOpenCompany} onOpenAcademy={onOpenAcademy} />
    </div>
  );
};

export default NetworkPortal;
