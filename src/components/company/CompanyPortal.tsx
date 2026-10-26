import React from 'react';
import { Language } from '../../types';
import { CompanyHero } from './CompanyHero';
import { CompanyServicesSection } from './CompanyServicesSection';
import { CompanyFleetInspector } from './CompanyFleetInspector';
import { AdvancedMotionVisualizerSection } from './AdvancedMotionVisualizerSection';
import { PwhtCycleSimulator } from './PwhtCycleSimulator';
import { RadiographicFilmViewer } from './RadiographicFilmViewer';
import { CompanyUltrasonicLabSection } from './CompanyUltrasonicLabSection';
import { CompanyCertificationsSection } from './CompanyCertificationsSection';
import { CompanyStandardsMatrix } from './CompanyStandardsMatrix';
import { CompanyProjectsSection } from './CompanyProjectsSection';
import { CompanyTestimonialsSection } from './CompanyTestimonialsSection';
import { CompanyAcademyHighlight } from './CompanyAcademyHighlight';
import { CompanyVendorVaultSection } from './CompanyVendorVaultSection';
import { CompanyContactSection } from './CompanyContactSection';

interface CompanyPortalProps {
  language: Language;
  onNavigateToAcademy: (initialSubTab?: any) => void;
}

export const CompanyPortal: React.FC<CompanyPortalProps> = ({
  language,
  onNavigateToAcademy,
}) => {
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isAr = language === 'ar';

  const quickNav = [
    { id: 'services', label: isAr ? 'الخدمات' : 'Services' },
    { id: 'fleet-inspector', label: isAr ? 'الأسطول (48+)' : 'Fleet' },
    { id: 'hologram-lab', label: isAr ? 'مختبر 3D' : '3D Lab' },
    { id: 'pwht-simulator', label: isAr ? 'محاكي PWHT' : 'PWHT Sim' },
    { id: 'radiography-viewer', label: isAr ? 'أفلام RT' : 'RT Lightbox' },
    { id: 'ultrasonic-lab', label: isAr ? 'أجهزة UT/PAUT' : 'UT/PAUT Lab' },
    { id: 'certifications', label: isAr ? 'شهادات ISO' : 'ISO Certs' },
    { id: 'standards-matrix', label: isAr ? 'الأكواد الهندسية' : 'Codes' },
    { id: 'projects', label: isAr ? 'سابقة الأعمال' : 'Projects' },
    { id: 'testimonials', label: isAr ? 'آراء العملاء' : 'Testimonials' },
    { id: 'vault', label: isAr ? 'البروشور PDF' : 'Brochure' },
    { id: 'rfq', label: isAr ? 'طلب تسعير' : 'RFQ' },
  ];

  return (
    <div className="space-y-0">
      {/* Mobile Sticky Quick Jump Strip */}
      <div className="xl:hidden sticky top-[57px] z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/80 px-4 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {quickNav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-mono text-slate-300 hover:text-cyan-400 whitespace-nowrap cursor-pointer transition"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. Hero Section based on Brochure Pages 1 & 2 */}
      <CompanyHero
        language={language}
        onNavigateToAcademy={() => onNavigateToAcademy()}
        onNavigateToSection={scrollToSection}
      />

      {/* 2. 12 NDT Inspection Methods & 16-Unit PWHT Fleet */}
      <CompanyServicesSection
        language={language}
        onNavigateToAcademyModule={(subTab) => onNavigateToAcademy(subTab)}
      />

      {/* 2b. Traceable Equipment & Calibrated Instrument Fleet (48+ Units) */}
      <CompanyFleetInspector language={language} />

      {/* 3. Interactive 3D Hologram & Animated Motion Graphics Lab */}
      <AdvancedMotionVisualizerSection language={language} />

      {/* 3b. Live 6-Channel PWHT Heat Treatment Cycle Simulator (65 kW Fleet) */}
      <PwhtCycleSimulator language={language} />

      {/* 3c. Digital Radiograph Lightbox & Flaw Interpretation Lab (RT Film) */}
      <RadiographicFilmViewer language={language} />

      {/* 3d. Interactive Digital Ultrasonic (UT) & Phased Array (PAUT) Flaw Detector Lab */}
      <CompanyUltrasonicLabSection
        language={language}
        onNavigateToAcademy={onNavigateToAcademy}
      />

      {/* 4. Accreditations: Triple ISO, IRCA Lead Auditor, ENRRA License, 5 Reasons */}
      <CompanyCertificationsSection language={language} />

      {/* 4b. International Codes & Standards Matrix (ASME, API, AWS, ISO) */}
      <CompanyStandardsMatrix language={language} />

      {/* 5. Academy Highlight within Corporate Layout */}
      <CompanyAcademyHighlight
        language={language}
        onNavigateToAcademy={(subTab) => onNavigateToAcademy(subTab)}
      />

      {/* 6. Proven Track Record & Major Power Facilities */}
      <CompanyProjectsSection language={language} />

      {/* 7. Attributable Client Testimonials & Success Stories (Framer Motion) */}
      <CompanyTestimonialsSection language={language} />

      {/* 8. Vendor Vault: 50-Page PDF Brochure & Evidence Annexes A-E */}
      <CompanyVendorVaultSection language={language} />

      {/* 9. Direct Dispatch, 24/7 Operations & Interactive RFQ */}
      <CompanyContactSection language={language} />
    </div>
  );
};
