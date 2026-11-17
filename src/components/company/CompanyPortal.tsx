import React from 'react';
import { Language } from '../../types';
import { CompanyHero } from './CompanyHero';
import { CompanyServicesSection } from './CompanyServicesSection';
import { CompanyProjectCostEstimator } from './CompanyProjectCostEstimator';
import { CompanyFleetInspector } from './CompanyFleetInspector';
import { CompanyCertificationsSection } from './CompanyCertificationsSection';
import { CompanyStandardsMatrix } from './CompanyStandardsMatrix';
import { CompanyProjectsSection } from './CompanyProjectsSection';
import { CompanyTestimonialsSection } from './CompanyTestimonialsSection';
import { CompanyAcademyHighlight } from './CompanyAcademyHighlight';
import { CompanyVendorVaultSection } from './CompanyVendorVaultSection';
import { CompanyContactSection } from './CompanyContactSection';
import { CompanyQuickActionsSection } from './CompanyQuickActionsSection';

interface CompanyPortalProps {
  language: Language;
  onNavigateToAcademy: (initialSubTab?: any) => void;
  /** Opens the technical demonstrations page (`#demo`). */
  onOpenDemo?: () => void;
}

/**
 * The corporate landing page, ordered as a buyer's decision, not as a feature list:
 *
 *   1 who we are  → 2 what we do → 3 are we qualified → 4 can we deliver
 *   → 5 have we done it → 6 vendor dossier → 7 ask for a quote
 *
 * The interactive labs used to sit between step 2 and step 3 and pushed the
 * accreditations to the tenth screen. They now live in `CompanyDemoPortal`
 * (`#demo`), unchanged, with a link from the services section and the footer.
 * Nothing was deleted: the estimator moved into the RFQ section as an optional
 * first step, and the old 14-chip jump strip is replaced by the header menu and
 * the mobile drawer.
 */
export const CompanyPortal: React.FC<CompanyPortalProps> = ({
  language,
  onNavigateToAcademy,
  onOpenDemo,
}) => {
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isAr = language === 'ar';

  return (
    <div id="top" className="space-y-0">
      {/* 1. Who we are, what we do, and the one action we want. */}
      <CompanyHero
        language={language}
        onNavigateToAcademy={() => onNavigateToAcademy()}
        onNavigateToSection={scrollToSection}
        onOpenDemo={onOpenDemo}
      />

      {/* 2. What we do: the four service families and the 12 methods. */}
      <CompanyServicesSection
        language={language}
        onNavigateToAcademyModule={(subTab) => onNavigateToAcademy(subTab)}
        onOpenDemo={onOpenDemo}
      />

      {/* 3. Are we qualified? Accreditations first, then the code matrix. */}
      <CompanyCertificationsSection language={language} />
      <CompanyStandardsMatrix language={language} />

      {/* 4. Can we deliver? Owned fleet, calibration and regional coverage. */}
      <CompanyFleetInspector language={language} />

      {/* 5. Have we done it? Projects, then attributable client statements. */}
      <CompanyProjectsSection language={language} />
      <CompanyTestimonialsSection language={language} />

      {/* 6. Vendor dossier and evidence annexes. */}
      <CompanyVendorVaultSection language={language} />

      {/* Bridge for engineers who arrived through the corporate door. */}
      <CompanyAcademyHighlight
        language={language}
        onNavigateToAcademy={(subTab) => onNavigateToAcademy(subTab)}
      />

      {/* 7. Ask for a quote. The estimator is an optional first step, not a section. */}
      <CompanyContactSection
        language={language}
        topSlot={
          <div>
            {/* Express quotation only — the syllabus lives in the academy now. */}
            <div className="mb-8 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden border-y sm:border border-slate-800">
              <CompanyQuickActionsSection language={language} mode="quote" onRequestQuote={() => scrollToSection('rfq')} />
            </div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  {isAr ? 'خطوة اختيارية قبل الإرسال' : 'Optional step before sending'}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {isAr ? 'قدّر نطاق العمل واحتياج التحرك' : 'Estimate scope and mobilisation'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                {isAr
                  ? 'أرقام تقديرية للتحضير فقط؛ عرض السعر الرسمي يصدر من قطاع العمليات الفنية.'
                  : 'Indicative planning figures only; the official quote is issued by technical operations.'}
              </p>
            </div>
            <CompanyProjectCostEstimator language={language} onTransferToRfq={() => scrollToSection('rfq')} />
          </div>
        }
      />
    </div>
  );
};
