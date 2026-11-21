import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { COMPANY_DETAILS, type CompanyDetailId } from '../../utils/companyRoutes';
import type { ClientSectionId } from '../../utils/portalRoutes';
import type { ServiceFamilyId } from '../../utils/serviceFamilies';
import { AccountPrivacyNotice } from '../account/AccountPrivacyNotice';
import { CtaButton } from '../ui/CtaButton';
import { CompanyAnchor } from './CompanyAnchor';
import { SectionHeading } from '../ui/SectionHeading';

const Services = React.lazy(() => import('./CompanyServicesSection').then(m => ({ default: m.CompanyServicesSection })));
const Equipment = React.lazy(() => import('./CompanyFleetInspector').then(m => ({ default: m.CompanyFleetInspector })));
const Certifications = React.lazy(() => import('./CompanyCertificationsSection').then(m => ({ default: m.CompanyCertificationsSection })));
const Standards = React.lazy(() => import('./CompanyStandardsMatrix').then(m => ({ default: m.CompanyStandardsMatrix })));
const Projects = React.lazy(() => import('./CompanyProjectsSection').then(m => ({ default: m.CompanyProjectsSection })));
const Testimonials = React.lazy(() => import('./CompanyTestimonialsSection').then(m => ({ default: m.CompanyTestimonialsSection })));
const Dossier = React.lazy(() => import('./CompanyVendorVaultSection').then(m => ({ default: m.CompanyVendorVaultSection })));
const FieldTools = React.lazy(() => import('./CompanyFieldTools').then(m => ({ default: m.CompanyFieldTools })));
const Quote = React.lazy(() => import('./CompanyQuotePage').then(m => ({ default: m.CompanyQuotePage })));

const COPY: Record<CompanyDetailId, { ar: string; en: string; next?: CompanyDetailId }> = {
  about: { ar: 'تعرّف على نشاط إنسكو والقطاعات التي يغطيها سجل الشركة.', en: 'Get to know INSCO and the sectors in the company profile.', next: 'services' },
  services: { ar: 'قارن طرق الفحص والمعالجة الحرارية والخدمات المساندة ثم افتح تفاصيل الخدمة المناسبة.', en: 'Compare inspection, heat treatment and related services before choosing a scope.', next: 'equipment' },
  equipment: { ar: 'راجع مواصفات الأجهزة وسجل المعايرة. اسألنا عن توافر المعدة لمشروعك.', en: 'Review instrument capabilities and calibration records, then ask about availability for your scope.', next: 'projects' },
  quality: { ar: 'راجع نطاق الوثائق والمراجع الفنية، واطلب نسخة سارية عند التأهيل.', en: 'Review the documented scope and technical references. Ask for current copies for qualification.', next: 'dossier' },
  projects: { ar: 'اطّلع على نطاق الأعمال في ملف الشركة وافصل السجلات المنشورة عن الأمثلة التوضيحية.', en: 'See the scope in the company profile and distinguish published records from examples.', next: 'quote' },
  dossier: { ar: 'ملف الشركة والملاحق المستخدمة في تأهيل الموردين.', en: 'The company profile and annexes for vendor qualification.', next: 'quote' },
  quote: { ar: 'ناقش نطاق العمل مع الفريق الفني أو أرسل طلبًا إذا كانت قناة الاستلام متاحة.', en: 'Discuss your scope with the technical team or send a request when online intake is available.' },
  field: { ar: 'روابط ملفات الفحص وأدوات الحضور تبعًا لصلاحيات بوابة العملاء، وليست سجلاً عامًا للعميل.', en: 'Inspector shortcuts and attendance tools use the client portal’s existing permissions.' },
  privacy: { ar: 'ما الذي يحفظه حساب إنسكو الموحّد ومن يستطيع فتح الملف الخاص.', en: 'What the INSCO account stores and who can access the private profile.' },
};

const SECTORS = {
  ar: ['الطاقة ومحطات التوليد', 'البترول والغاز', 'الإنشاءات والمشروعات الصناعية'],
  en: ['Power & generation', 'Oil & gas', 'Industrial construction'],
};

interface Props {
  language: Language;
  detail: CompanyDetailId;
  anchor: string;
  quoteService?: string;
  onOpen: (anchor?: string) => void;
  onOpenService: (family: ServiceFamilyId) => void;
  onOpenDemo: () => void;
  onOpenClient: (section: ClientSectionId) => void;
  onOpenDossier: (id: string) => void;
  onOpenAcademy: (tab?: string) => void;
}

export function CompanyDestination({
  language, detail, anchor, quoteService, onOpen, onOpenService, onOpenDemo,
  onOpenClient, onOpenDossier, onOpenAcademy,
}: Props) {
  const isAr = language === 'ar';
  const title = COMPANY_DETAILS[detail][language];
  const next = COPY[detail].next;
  const Back = isAr ? ArrowRight : ArrowLeft;
  const Forward = isAr ? ArrowLeft : ArrowRight;
  const target = anchor === COMPANY_DETAILS[detail].hash || /^(contact|vendor|capabilities)$/.test(anchor) ? undefined : anchor;

  return (
    <div data-company-detail={detail}>
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <CtaButton variant="ghost" size="sm" onClick={() => onOpen()}>
            <Back className="size-4 shrink-0" aria-hidden="true" />
            {isAr ? 'رئيسية الشركة' : 'Company home'}
          </CtaButton>
          <SectionHeading as="h1" className="mt-3" eyebrow={isAr ? 'شركة إنسكو' : 'INSCO Corporate'} title={title} description={COPY[detail][language]} />
        </div>
      </div>
      {detail === 'about' && (
        <section className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6" id="about">
          <h2 className="text-xl font-bold text-white">{INSCO_COMPANY_DATA.name[language]}</h2>
          <p className="max-w-prose text-slate-300">{INSCO_COMPANY_DATA.tagline[language]}</p>
          <div id="industries" className="space-y-3">
            <h2 className="text-xl font-bold text-white">{isAr ? 'القطاعات' : 'Industries'}</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {SECTORS[language].map(sector => <li key={sector} className="rounded-xl border border-slate-700 px-4 py-3">{sector}</li>)}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <CtaButton href={INSCO_COMPANY_DATA.pdfBrochureUrl} external variant="secondary">{isAr ? 'ملف الشركة (PDF)' : 'Company profile (PDF)'}</CtaButton>
            <CtaButton variant="ghost" onClick={() => onOpen('certifications')}>{isAr ? 'الجودة والشهادات' : 'Quality & certifications'}</CtaButton>
          </div>
        </section>
      )}
      {detail === 'services' && <Services language={language} onNavigateToAcademyModule={onOpenAcademy} onOpenService={onOpenService} onOpenDemo={onOpenDemo} />}
      {detail === 'equipment' && <Equipment language={language} />}
      {detail === 'quality' && <><Certifications language={language} /><Standards language={language} /></>}
      {detail === 'projects' && <><Projects language={language} /><Testimonials language={language} /></>}
      {detail === 'dossier' && <Dossier language={language} />}
      {detail === 'quote' && <Quote language={language} anchor={anchor} quoteService={quoteService} />}
      {detail === 'field' && <FieldTools language={language} onOpenClient={onOpenClient} onOpenDossier={onOpenDossier} />}
      {detail === 'privacy' && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <AccountPrivacyNotice language={language} />
          <CtaButton className="mt-5" variant="secondary" onClick={() => onOpenClient('register')}>
            {isAr ? 'ملف الحساب الخاص' : 'Private account profile'}
          </CtaButton>
        </div>
      )}
      {next && (
        <nav aria-label={isAr ? 'الخطوة التالية' : 'Next step'} className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-7 sm:px-6">
          <CtaButton onClick={() => onOpen(COMPANY_DETAILS[next].hash)}>
            {COMPANY_DETAILS[next][language]} <Forward className="size-4 shrink-0" aria-hidden="true" />
          </CtaButton>
          {next !== 'quote' && <CtaButton variant="secondary" onClick={() => onOpen('rfq')}>{isAr ? 'اطلب عرض سعر' : 'Request a quote'}</CtaButton>}
        </nav>
      )}
      <CompanyAnchor id={target} />
    </div>
  );
}
