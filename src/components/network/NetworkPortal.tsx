import React, { Suspense, lazy, useCallback, useState } from 'react';
import type { Language } from '../../types';
import type { NetworkSectionId } from '../../utils/portalRoutes';
import { NetworkFooter, NetworkHeader } from './NetworkShell';
import {
  NetworkArticles,
  NetworkCompanies,
  NetworkEvents,
  NetworkGroups,
  NetworkMessages,
  NetworkNotifications,
  NetworkSearch,
  NetworkVerify,
} from './NetworkSections';
import { SiteAccountActions, type AccountPanelRequest } from '../account/SiteAccountActions';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';

/**
 * The two sections that read and write real account data stay in their own
 * chunks: a visitor who only opens the feed should not download the Firebase
 * client, and the prototype sections must never pull it in by accident.
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

export interface NetworkPortalProps {
  language: Language;
  section: NetworkSectionId;
  /** A post / profile handle / job id — reserved for the day real records exist. */
  entryId?: string;
  onOpenSection: (section: NetworkSectionId, entryId?: string) => void;
  onOpenCompany: () => void;
  onOpenAcademy: () => void;
}

/**
 * The account bar needs the site-wide session. Rendered where no provider exists
 * (a bare portal render in a test, a future embedded card) it simply disappears
 * instead of throwing — a missing session is not an error worth a white screen.
 */
const NetworkAccountBar: React.FC<{
  language: Language;
  onOpenProfile: () => void;
  requestPanel: AccountPanelRequest | null;
}> = ({ language, onOpenProfile, requestPanel }) => {
  const account = useOptionalSiteAccount();
  if (!account) return null;
  return (
    <SiteAccountActions
      language={language}
      onOpenProfile={onOpenProfile}
      requestPanel={requestPanel}
    />
  );
};

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
 * The professional card and the member directory are live on the unified
 * account; everything else is still a labelled prototype.
 */
export const NetworkPortal: React.FC<NetworkPortalProps> = ({
  language,
  section,
  entryId,
  onOpenSection,
  onOpenCompany,
  onOpenAcademy,
}) => {
  const openSection = useCallback(
    (next: NetworkSectionId) => onOpenSection(next),
    [onOpenSection]
  );

  const [panelRequest, setPanelRequest] = useState<AccountPanelRequest | null>(null);
  const requestPanel = useCallback((panel: AccountPanelRequest['panel']) => {
    setPanelRequest({ panel, nonce: Date.now() });
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
        return (
          <div data-testid="network-section-people">
            <Suspense fallback={<LoadingSection language={language} />}>
              <NetworkDirectorySection
                language={language}
                onOpenAccount={openAccount}
                onOpenProfile={() => openSection('profile')}
              />
            </Suspense>
          </div>
        );
      case 'groups':
        return <NetworkGroups language={language} />;
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
        section === 'feed' || section === 'profile' || section === 'people' || section === 'jobs'
          ? 'partial'
          : 'true'
      }
      {...(entryId ? { 'data-entry-id': entryId } : {})}
      className="min-h-screen bg-[#07070f] text-slate-200"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <NetworkHeader language={language} section={section} onOpenSection={openSection} />
      <div id="network-account-bar" className="mx-auto max-w-7xl">
        <NetworkAccountBar
          language={language}
          onOpenProfile={() => openSection('profile')}
          requestPanel={panelRequest}
        />
      </div>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">{body}</main>
      <NetworkFooter language={language} onOpenCompany={onOpenCompany} onOpenAcademy={onOpenAcademy} />
    </div>
  );
};

export default NetworkPortal;
