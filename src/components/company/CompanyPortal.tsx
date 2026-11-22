import React from 'react';
import {
  Activity, ArrowLeft, ArrowRight, ClipboardCheck, Factory, Gauge,
  Layers3, Radio, ScanLine, ShieldCheck, Thermometer,
} from 'lucide-react';
import type { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { publicUrl } from '../../utils/publicUrl';
import { CtaButton, ctaClassName } from '../ui/CtaButton';
import { SectionHeading } from '../ui/SectionHeading';
import { CompanyAnnouncement } from './CompanyAnnouncement';
import { CompanyHero } from './CompanyHero';

const CORE_METHODS = [
  { id: 'ut', code: 'UT', icon: Activity, ar: 'فحص المواد واللحامات بالموجات فوق الصوتية.', en: 'Examine materials and welds with ultrasound.' },
  { id: 'rt', code: 'RT', icon: Radio, ar: 'فحص داخلي بالتصوير وفق نطاق العمل والترخيص المطلوب.', en: 'Internal imaging, subject to scope and licensing.' },
  { id: 'mt', code: 'MT', icon: Layers3, ar: 'الكشف عن العيوب السطحية في المواد القابلة للمغنطة.', en: 'Find surface discontinuities in ferromagnetic materials.' },
  { id: 'pt', code: 'PT', icon: ScanLine, ar: 'إظهار العيوب المفتوحة على السطح.', en: 'Reveal discontinuities open to the surface.' },
  { id: 'vt', code: 'VT', icon: ClipboardCheck, ar: 'مراجعة حالة السطح والأبعاد ومظهر اللحامات.', en: 'Review surface condition, dimensions and weld profile.' },
] as const;

const CORE_SERVICES = [
  ...CORE_METHODS.flatMap(({ id, ...card }) => {
    const method = INSCO_COMPANY_DATA.ndtMethods.find(item => item.id === id);
    return method ? [{ ...card, title: method.name, href: `#services/ndt/${id}` }] : [];
  }),
  {
    code: 'PWHT', icon: Thermometer, href: '#services/pwht',
    title: { ar: 'المعالجة الحرارية بعد اللحام', en: 'Post-weld heat treatment' },
    ar: 'معالجة حرارية وفق نطاق المشروع، مع توثيق دورة المعالجة.',
    en: 'Project-scoped heat treatment with documented cycles.',
  },
];

export function CompanyPortal({ language, onNavigateToSection, onOpenDemo, onNavigateToClient, onNavigateToAcademy }: {
  language: Language;
  onNavigateToSection?: (section: string) => void;
  onOpenDemo?: () => void;
  onNavigateToClient?: () => void;
  onNavigateToAcademy: () => void;
}) {
  const isAr = language === 'ar';
  const Next = isAr ? ArrowLeft : ArrowRight;
  // Do not put representative/demo facilities or client files on the landing page.
  const publishedProjects = INSCO_COMPANY_DATA.facilities.filter(item => item.status === 'verified_public').slice(0, 3);

  return (
    <div id="top" className="corporate-home">
      <CompanyHero
        landing
        language={language}
        onNavigateToAcademy={onNavigateToAcademy}
        onNavigateToSection={onNavigateToSection ?? (section => { window.location.hash = section; })}
        onOpenDemo={onOpenDemo ?? (() => { window.location.hash = 'demo'; })}
        onNavigateToClient={onNavigateToClient ?? (() => { window.location.hash = 'client/overview'; })}
      />

      <CompanyAnnouncement language={language} />
      <section className="corporate-band corporate-overview" aria-labelledby="corporate-overview-title">
        <div className="corporate-wrap corporate-paired">
          <SectionHeading id="corporate-overview-title" eyebrow={isAr ? '01 / عن الشركة' : '01 / About INSCO'}
            title={isAr ? 'من نطاق الفحص إلى التقرير الفني' : 'From inspection scope to technical report'}
            description={isAr
              ? 'إنسكو شركة للخدمات والمقاولات. نطاق أعمالنا يشمل الفحص الصناعي والمعالجة الحرارية وخدمات اللحام ودعم الجودة.'
              : 'INSCO provides industrial inspection, heat treatment, welding services and quality support. Review the scope and documentation with our technical team.'} />
          <div className="corporate-facts">
            <p className="corporate-label">{isAr ? 'القطاعات في ملف الشركة' : 'Industries in the company profile'}</p>
            <ul>
              <li>{isAr ? 'الطاقة ومحطات التوليد' : 'Power & generation'}</li>
              <li>{isAr ? 'البترول والغاز' : 'Oil & gas'}</li>
              <li>{isAr ? 'المشروعات والإنشاءات الصناعية' : 'Industrial construction'}</li>
            </ul>
            <div className="corporate-related">
              <a href="#about">{isAr ? 'عن إنسكو والقطاعات' : 'About INSCO & industries'} <Next className="size-3.5" aria-hidden="true" /></a>
              <a href="#certifications">{isAr ? 'الجودة والشهادات' : 'Quality & certifications'}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="corporate-band corporate-services" aria-labelledby="corporate-services-title">
        <div className="corporate-wrap">
          <div className="corporate-section-head">
            <SectionHeading id="corporate-services-title" eyebrow={isAr ? '02 / نطاق العمل' : '02 / Scope of work'}
              title={isAr ? 'الخدمات الفنية الأساسية' : 'Core technical services'}
              description={isAr ? 'ابدأ بالطريقة المناسبة. راجع التفاصيل وتوافر الخدمة مع الفريق الفني.' : 'Start with the method you need. Confirm scope and availability with the technical team.'} />
            <a className="corporate-link" href="#services">{isAr ? 'دليل الخدمات الكامل' : 'Full services catalogue'} <Next className="size-4" aria-hidden="true" /></a>
          </div>
          <ul className="corporate-card-grid" aria-label={isAr ? 'الخدمات الأساسية' : 'Core services'}>
            {CORE_SERVICES.map(({ code, title, icon: Icon, href, ...description }) => (
              <li key={code}>
                <a href={href} className="corporate-service-card">
                  <span className="corporate-card-mark"><Icon className="size-5" aria-hidden="true" /> <bdi>{code}</bdi></span>
                  <h3>{title[language]}</h3>
                  <p>{description[language]}</p>
                  <span className="corporate-card-link">{isAr ? 'تفاصيل الخدمة' : 'Service details'} <Next className="size-3.5" aria-hidden="true" /></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="corporate-band" aria-labelledby="corporate-equipment-title">
        <div className="corporate-wrap corporate-paired items-center">
          <div className="min-w-0">
            <SectionHeading id="corporate-equipment-title" eyebrow={isAr ? '03 / الإمكانيات' : '03 / Capabilities'}
              title={isAr ? 'المعدات وسجل المعايرة' : 'Equipment & calibration records'}
              description={isAr
                ? 'راجع معدات الموجات فوق الصوتية والمعالجة الحرارية والقياس في سجل الشركة. توافر الجهاز وصلاحية المعايرة يتأكدوا بالوثائق وقت تحديد نطاق العمل.'
                : 'Review ultrasound, heat treatment and measurement equipment in the company register. Confirm instrument availability and current calibration evidence for your scope.'} />
            <dl className="corporate-features">
              <div><dt><Gauge className="size-4" aria-hidden="true" />{isAr ? 'أجهزة UT / PAUT' : 'UT / PAUT instruments'}</dt><dd>{isAr ? 'فحص اللحامات والمواد بالموجات فوق الصوتية.' : 'Ultrasonic examination of welds and materials.'}</dd></div>
              <div><dt><Thermometer className="size-4" aria-hidden="true" />{isAr ? 'وحدات PWHT' : 'PWHT units'}</dt><dd>{isAr ? 'التحكم في دورة المعالجة الحرارية وتوثيقها.' : 'Heat treatment cycle control and documentation.'}</dd></div>
            </dl>
            <div className="corporate-actions">
              <CtaButton href="#fleet-inspector" variant="brand">{isAr ? 'افتح سجل المعدات' : 'Open equipment register'} <Next className="size-4" aria-hidden="true" /></CtaButton>
              <a href="#demo" className="corporate-link">{isAr ? 'شاهد العرض الفني' : 'See demonstrations'}</a>
            </div>
          </div>
          <figure className="corporate-secondary-media">
            <img src={publicUrl('images/insco-equipment-640.webp')} alt={isAr ? 'مثال توضيحي لجهاز فحص بالموجات فوق الصوتية' : 'Illustrative ultrasonic testing instrument'} width={640} height={478} loading="lazy" decoding="async" />
            <figcaption>{isAr ? 'صورة توضيحية، وليست إثباتًا لصلاحية جهاز بعينه.' : 'Illustrative image; not a calibration record for a specific instrument.'}</figcaption>
          </figure>
        </div>
      </section>

      <section className="corporate-band corporate-services" aria-labelledby="corporate-projects-title">
        <div className="corporate-wrap">
          <div className="corporate-section-head">
            <SectionHeading id="corporate-projects-title" eyebrow={isAr ? '04 / خبرة الشركة' : '04 / Experience'}
              title={isAr ? 'المشروعات وسابقة الأعمال' : 'Projects & experience'}
              description={isAr ? 'مختارات من سجل الأعمال المنشور في ملف الشركة، وليست قائمة عملاء أو عقود لحظية.' : 'Selected records from the company profile, not a live client or contract list.'} />
            <a className="corporate-link" href="#projects">{isAr ? 'استعرض سابقة الأعمال' : 'View the track record'} <Next className="size-4" aria-hidden="true" /></a>
          </div>
          {publishedProjects.length > 0 ? (
            <ul className="corporate-card-grid">
              {publishedProjects.map(item => (
                <li key={item.name.en} className="corporate-record">
                  <Factory className="size-5" aria-hidden="true" />
                  <h3>{item.name[language]}</h3>
                  <p>{item.scope[language]}</p>
                  <small>{item.location[language]}</small>
                </li>
              ))}
            </ul>
          ) : <p className="corporate-empty">{isAr ? 'لا توجد مختارات موثقة للنشر الآن.' : 'No project highlights are documented for publication yet.'}</p>}
          <a href={`${INSCO_COMPANY_DATA.pdfBrochureUrl}#page=12`} target="_blank" rel="noopener noreferrer" className="corporate-link mt-5 me-5">{isAr ? 'المصدر: صفحة المشروعات في ملف الشركة (PDF)' : 'Source: company dossier project record (PDF)'}</a>
          <a href="#vault" className="corporate-link mt-5"><ShieldCheck className="size-4" aria-hidden="true" />{isAr ? 'ملف تأهيل المورد' : 'Vendor qualification dossier'}</a>
        </div>
      </section>

      <section id="academy-preview" className="corporate-band" aria-labelledby="corporate-academy-title">
        <div className="corporate-wrap corporate-paired items-center">
          <SectionHeading id="corporate-academy-title" eyebrow={isAr ? '05 / مسار التعلّم' : '05 / Learning path'}
            title={isAr ? 'أكاديمية إنسكو الهندسية' : 'INSCO Engineering Academy'}
            description={isAr ? 'مسارات ودروس وكتب رقمية ومعامل وتقييمات تدريبية، في بوابة مستقلة عن خدمات الشركة.' : 'Learning paths, lessons, digital books, labs and practice assessments in a separate academy portal.'} />
          <div className="corporate-facts">
            <p className="corporate-label">{isAr ? 'اختار مسارك. اتدرّب. تابع تقدّمك.' : 'Choose a path. Practise. Track your progress.'}</p>
            <CtaButton variant="brand" onClick={onNavigateToAcademy}>{isAr ? 'ادخل الأكاديمية' : 'Enter the academy'} <Next className="size-4" aria-hidden="true" /></CtaButton>
          </div>
        </div>
      </section>

      <section className="corporate-band corporate-contact-band" data-preserve-dark="true" aria-labelledby="corporate-contact-title">
        <div className="corporate-wrap">
          <SectionHeading id="corporate-contact-title" eyebrow={isAr ? '06 / الخطوة التالية' : '06 / Next step'}
            title={isAr ? 'خلّينا نناقش نطاق مشروعك' : 'Let’s discuss your project scope'}
            description={isAr ? 'اختار الخدمة أو تواصل مباشرةً مع الفريق الفني لمراجعة متطلبات المشروع.' : 'Choose a service or get in touch with the technical team to discuss your requirements.'} />
          <div className="corporate-actions">
            <CtaButton href="#rfq" variant="brand">{isAr ? 'اطلب عرض سعر' : 'Request a quote'} <Next className="size-4" aria-hidden="true" /></CtaButton>
            <CtaButton href="#contact" variant="secondary">{isAr ? 'تواصل مع الفريق الفني' : 'Contact the technical team'}</CtaButton>
            <button type="button" className={ctaClassName('ghost')} onClick={onNavigateToAcademy}>{isAr ? 'استكشف الأكاديمية' : 'Explore the Academy'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
