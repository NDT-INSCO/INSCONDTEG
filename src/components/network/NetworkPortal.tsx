import React, { Suspense, lazy, useCallback, useState } from 'react';
import type { Language } from '../../types';
import type { NetworkSectionId } from '../../utils/portalRoutes';
import { NetworkFooter, NetworkHeader } from './NetworkShell';
import {
  NetworkArticles,
  NetworkCompanies,
  NetworkEvents,
  NetworkMessages,
  NetworkNotifications,
  NetworkSearch,
  NetworkVerify,
} from './NetworkSections';
import { SiteAccountActions, type AccountPanelRequest } from '../account/SiteAccountActions';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';

/**
 * Live sections stay in distinct chunks. Prototype sections do not import
 * the account data service or write records.
 */
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

export interface NetworkPortalProps {
  language: Language;
  section: NetworkSectionId;
  /** A post / profile handle / job id — reserved for the day real records exist. */
  entryId?: string;
  onOpenSection: (section: NetworkSectionId, entryId?: string) => void;
  onOpenCompany: () => void;
  onOpenAcademy: () => void;
  /** Account settings are private, separate from the public professional card. */
  onOpenPrivateProfile?: () => void;
}

const LoadingSection: React.FC<{ language: Language }> = ({ language }) => (
  <p role="status" className="p-4 text-[11px] text-slate-400">
    {language === 'ar' ? 'جارٍ تحميل بيانات حسابك…' : 'Loading your account data…'}
  </p>
);

/**
 * The fourth portal, as a shell around one section.
 *
 * The network owns its header, its footer and its background so a visitor can
 * never mistake a member's feed for the INSCO brochure, or an academy lesson.
 * The feed, professional card and member directory use the unified account.
 * The remaining sections are labelled prototypes.
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
  const account = useOptionalSiteAccount();
  const openSection = useCallback(
    (next: NetworkSectionId) => onOpenSection(next),
    [onOpenSection]
  );

  const [panelRequest, setPanelRequest] = useState<AccountPanelRequest | null>(null);
  const requestPanel = useCallback((panel: AccountPanelRequest['panel']) => {
    setPanelRequest(current => ({ panel, nonce: (current?.nonce ?? 0) + 1 }));
  }, []);
  const openAccount = useCallback(() => requestPanel('signin'), [requestPanel]);
  /** The card form asks for `signin` or, for an unconfirmed email, `account`. */
  const openAccountPanel = useCallback(
    (panel: AccountPanelRequest['panel']) => requestPanel(panel),
    [requestPanel]
  );

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
              />
            </Suspense>
          </div>
        );
      case 'profile':
        return (
          <div data-testid="network-section-profile">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkProfileSection language={language} onOpenAccount={openAccountPanel} />
            </Suspense>
          </div>
        );
      case 'people':
        /* `#network/people/<uid>` is one member's public page; the bare section is
           the directory. Same section, two honest screens. */
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
                onOpenMember={uid => onOpenSection('people', uid)}
              />
            </Suspense>
          </div>
        );
      case 'groups':
        /* `#network/groups/<id>` is one group; the bare section is the list. */
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
                onOpenGroup={groupId => onOpenSection('groups', groupId)}
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
        return <NetworkArticles language={language} onOpenAcademy={onOpenAcademy} />;
      case 'events':
        return <NetworkEvents language={language} />;
      case 'companies':
        return <NetworkCompanies language={language} onOpenCompany={onOpenCompany} />;
      case 'messages':
        return <NetworkMessages language={language} />;
      case 'notifications':
        return <NetworkNotifications language={language} />;
      case 'search':
        return <NetworkSearch language={language} onOpenSection={openSection} />;
      case 'verify':
        return <NetworkVerify language={language} onOpenSection={openSection} />;
      default:
        return (
          <div data-testid="network-section-feed">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkFeedSection
                language={language}
                onOpenAccount={openAccountPanel}
                onOpenProfile={() => openSection('profile')}
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
      data-prototype={
        section === 'feed' ||
        section === 'profile' ||
        section === 'people' ||
        section === 'jobs' ||
        section === 'groups'
          ? 'partial'
          : 'true'
      }
      {...(entryId ? { 'data-entry-id': entryId } : {})}
      className="min-h-screen bg-[#07070f] text-slate-200"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <NetworkHeader language={language} section={section} onOpenSection={openSection} />
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
        {body}
      </main>
      <NetworkFooter language={language} onOpenCompany={onOpenCompany} onOpenAcademy={onOpenAcademy} />
    </div>
  );
};

export default NetworkPortal;
