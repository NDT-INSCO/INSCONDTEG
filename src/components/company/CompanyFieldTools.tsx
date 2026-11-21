import type { Language } from '../../types';
import type { ClientSectionId } from '../../utils/portalRoutes';
import { CompanyQrQuickAccessSection } from './CompanyQrQuickAccessSection';
import { CompanyAttendanceTimelineSection } from './CompanyAttendanceTimelineSection';

export function CompanyFieldTools({ language, onOpenClient, onOpenDossier }: {
  language: Language;
  onOpenClient: (section: ClientSectionId) => void;
  onOpenDossier: (id: string) => void;
}) {
  return (
    <>
      <CompanyQrQuickAccessSection
        language={language}
        onOpenCompanyDossier={onOpenDossier}
        onOpenClientArchive={() => onOpenClient('companies')}
      />
      <CompanyAttendanceTimelineSection
        language={language}
        onOpenTimeClockPortal={() => onOpenClient('timeclock')}
        onOpenCompaniesPortal={() => onOpenClient('companies')}
      />
    </>
  );
}
