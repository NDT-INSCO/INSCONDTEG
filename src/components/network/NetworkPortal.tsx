import React from 'react';
import type { Language } from '../../types';
import type { NetworkSectionId } from '../../utils/portalRoutes';
import { NetworkFooter, NetworkHeader } from './NetworkShell';
import {
  NetworkArticles,
  NetworkCompanies,
  NetworkEvents,
  NetworkFeed,
  NetworkGroups,
  NetworkJobs,
  NetworkMessages,
  NetworkNotifications,
  NetworkPeople,
  NetworkProfile,
  NetworkSearch,
  NetworkVerify,
} from './NetworkSections';

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
 * The fourth portal, as a shell around one section.
 *
 * The network owns its header, its footer and its background so a visitor can
 * never mistake a member's feed for the INSCO brochure, or an academy lesson.
 */
export const NetworkPortal: React.FC<NetworkPortalProps> = ({
  language,
  section,
  entryId,
  onOpenSection,
  onOpenCompany,
  onOpenAcademy,
}) => {
  const openSection = (next: NetworkSectionId) => onOpenSection(next);

  const body = (() => {
    switch (section) {
      case 'feed':
        return <NetworkFeed language={language} onOpenSection={openSection} />;
      case 'profile':
        return <NetworkProfile language={language} onOpenSection={openSection} />;
      case 'groups':
        return <NetworkGroups language={language} />;
      case 'people':
        return <NetworkPeople language={language} />;
      case 'jobs':
        return <NetworkJobs language={language} onOpenCompany={onOpenCompany} />;
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
        return <NetworkFeed language={language} onOpenSection={openSection} />;
    }
  })();

  return (
    <div
      data-portal="network"
      data-section={section}
      data-prototype="true"
      {...(entryId ? { 'data-entry-id': entryId } : {})}
      className="min-h-screen bg-[#07070f] text-slate-200"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <NetworkHeader language={language} section={section} onOpenSection={openSection} />
      <main id="insco-main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-4 sm:px-6">{body}</main>
      <NetworkFooter language={language} onOpenCompany={onOpenCompany} onOpenAcademy={onOpenAcademy} />
    </div>
  );
};

export default NetworkPortal;
