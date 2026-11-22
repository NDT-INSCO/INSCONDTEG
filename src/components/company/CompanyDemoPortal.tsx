import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, FlaskConical, Gauge, ScanLine, Thermometer, Layers3 } from 'lucide-react';
import { Language } from '../../types';
import { CtaButton } from '../ui/CtaButton';
import type { CompanyDemoAnchor } from '../../utils/companyRoutes';

const CompanyHero = React.lazy(() => import('./CompanyHero').then(module => ({ default: module.CompanyHero })));
const Hologram = React.lazy(() => import('./AdvancedMotionVisualizerSection').then(module => ({ default: module.AdvancedMotionVisualizerSection })));
const Pwht = React.lazy(() => import('./PwhtCycleSimulator').then(module => ({ default: module.PwhtCycleSimulator })));
const Films = React.lazy(() => import('./RadiographicFilmViewer').then(module => ({ default: module.RadiographicFilmViewer })));
const Ultrasonic = React.lazy(() => import('./CompanyUltrasonicLabSection').then(module => ({ default: module.CompanyUltrasonicLabSection })));

interface CompanyDemoPortalProps {
  language: Language;
  anchor?: CompanyDemoAnchor;
  onBack: () => void;
  onRequestQuote: () => void;
  onOpenAcademy: (tab?: string) => void;
}

const DEMOS = [
  {
    key: 'inspection-showcase',
    icon: Layers3,
    ar: { title: 'المشهد الثلاثي وأدوات التحكم', line: 'استكشف المشهد والأوضاع والكاميرا.' },
    en: { title: '3D showcase and controls', line: 'Explore the scene, modes and camera controls.' },
  },
  {
    key: 'hologram-lab',
    icon: Layers3,
    ar: { title: 'معرض الصور والهولوغرام', line: 'تصفّح المشاهد التوضيحية وجرب نموذج الإشارة.' },
    en: { title: 'Gallery and hologram', line: 'Browse illustrative scenes and explore a signal model.' },
  },
  {
    key: 'pwht-simulator',
    icon: Thermometer,
    ar: { title: 'محاكي دورة المعالجة الحرارية', line: 'تسخين ومكوث وتبريد مضبوط على 65 kW لكل وحدة.' },
    en: { title: 'PWHT cycle simulator', line: 'Ramp, soak and cooling control on a 65 kW unit.' },
  },
  {
    key: 'radiography-viewer',
    icon: ScanLine,
    ar: { title: 'عارض أفلام التصوير الإشعاعي', line: 'كيف نحكم على الكثافة والعيب في الصورة.' },
    en: { title: 'Radiographic film lightbox', line: 'How density and defects are judged on film.' },
  },
  {
    key: 'ultrasonic-lab',
    icon: Gauge,
    ar: { title: 'معمل UT / PAUT', line: 'معايرة، بوابات A-Scan و S-Scan، وقراءة الإشارة.' },
    en: { title: 'UT / PAUT lab', line: 'Calibration, A-Scan and S-Scan gates, signal reading.' },
  },
] as const;

/** The hash remains reachable while closed; the module loads only when opened. */
function DemoPanel({ id, open, onToggle, label, language, children }: {
  id: CompanyDemoAnchor; open: boolean; onToggle: () => void; label: string; language: Language; children: React.ReactNode;
}) {
  return (
    <details id={id} open={open} className="border-b border-slate-800 bg-slate-950">
      <summary className="mx-auto max-w-7xl cursor-pointer px-4 py-5 font-bold text-cyan-300 focus-visible:outline focus-visible:outline-2 sm:px-6"
        onClick={event => { event.preventDefault(); onToggle(); }}>
        {label}
      </summary>
      {open && <React.Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-4 pb-5 text-sm text-slate-300">{language === 'ar' ? 'جارٍ تحميل العرض…' : 'Loading demonstration…'}</p>}>
        {children}
      </React.Suspense>}
    </details>
  );
}

export const CompanyDemoPortal: React.FC<CompanyDemoPortalProps> = ({
  language,
  anchor,
  onBack,
  onRequestQuote,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  // Only one live lab at a time. The card also opens a manually closed panel
  // when its deep link already matches the current fragment.
  const [openDemo, setOpenDemo] = useState(anchor);
  useEffect(() => setOpenDemo(anchor), [anchor]);
  const lab: Record<CompanyDemoAnchor, React.ReactNode> = {
    'inspection-showcase': <CompanyHero language={language} headingLevel="h2" onNavigateToAcademy={() => onOpenAcademy()} onNavigateToSection={onRequestQuote} />,
    'hologram-lab': <Hologram language={language} />,
    'pwht-simulator': <Pwht language={language} />,
    'radiography-viewer': <Films language={language} onOpenFullRtLab={() => onOpenAcademy('rt_lab')} />,
    'ultrasonic-lab': <Ultrasonic language={language} onNavigateToAcademy={tab => onOpenAcademy(tab)} />,
  };

  return (
    <div className="space-y-0">
      <section id="top" className="pt-10 pb-12 border-b border-slate-800 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-cyan-950/25 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition cursor-pointer mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5 ltr:hidden" />
            <ArrowRight className="w-3.5 h-3.5 rtl:hidden" />
            {isAr ? 'العودة إلى بوابة الشركة' : 'Back to the corporate portal'}
          </button>

          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
              {isAr ? 'العرض الفني التفاعلي' : 'Technical Demonstrations'}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr ? 'أدوات تعرض كيف نقرأ الإشارة ونحكم على العيب' : 'See how we read the signal and judge the defect'}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'اختر عرضًا لتحميله. المحاكاة والصور أمثلة تعليمية، وليست نتائج فحص أو إعدادات تشغيل. المعامل الكاملة موجودة في الأكاديمية.'
                : 'Choose a demonstration to load it. These simulations and illustrations are not inspection results or operating settings. Full training labs are available in the academy.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <CtaButton variant="primary" onClick={onRequestQuote}>
                {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
              </CtaButton>
              <CtaButton variant="secondary" onClick={() => onOpenAcademy('rt_lab')}>
                <FlaskConical className="w-4 h-4" />
                {isAr ? 'المعامل الكاملة في الأكاديمية' : 'Full labs in the academy'}
                <ArrowIcon className="w-3.5 h-3.5" />
              </CtaButton>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {DEMOS.map(demo => {
              const Icon = demo.icon;
              const copy = isAr ? demo.ar : demo.en;
              return (
                <a key={demo.key} href={`#demo/${demo.key}`} onClick={event => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpenDemo(demo.key);
                }} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-sky-400">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <div className="mt-2 text-sm font-bold text-white">{copy.title}</div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{copy.line}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {DEMOS.map(demo => (
        <DemoPanel
          key={demo.key}
          id={demo.key}
          open={openDemo === demo.key}
          onToggle={() => setOpenDemo(current => current === demo.key ? undefined : demo.key)}
          label={(isAr ? demo.ar : demo.en).title}
          language={language}
        >
          {lab[demo.key]}
        </DemoPanel>
      ))}

      <section className="py-12 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white">
              {isAr ? 'جاهز تناقش نطاق مشروعك؟' : 'Ready to scope your project?'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'تواصل مع الفريق الفني لمراجعة نطاق العمل والتوافر.'
                : 'Ask the technical team about scope and availability.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRequestQuote}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer"
            >
              {isAr ? 'طلب عرض سعر' : 'Request a quote'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              {isAr ? 'بوابة الشركة' : 'Corporate portal'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
