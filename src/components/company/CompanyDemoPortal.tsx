import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, FlaskConical, Gauge, ScanLine, Thermometer, Layers3 } from 'lucide-react';
import { Language } from '../../types';
import { CtaButton } from '../ui/CtaButton';
import { CompanyHero } from './CompanyHero';
import type { CompanyDemoAnchor } from '../../utils/companyRoutes';
import { AdvancedMotionVisualizerSection } from './AdvancedMotionVisualizerSection';
import { PwhtCycleSimulator } from './PwhtCycleSimulator';
import { RadiographicFilmViewer } from './RadiographicFilmViewer';
import { CompanyUltrasonicLabSection } from './CompanyUltrasonicLabSection';

interface CompanyDemoPortalProps {
  language: Language;
  anchor?: CompanyDemoAnchor;
  onBack: () => void;
  onRequestQuote: () => void;
  onOpenAcademy: (tab?: string) => void;
}

const DEMOS = [
  {
    key: 'hologram',
    icon: Layers3,
    ar: { title: 'المشهد الميداني ثلاثي الأبعاد', line: 'كيف نقرأ هندسة الأصل قبل اختيار زاوية الفحص.' },
    en: { title: '3D field inspection scene', line: 'How we read asset geometry before choosing a scan angle.' },
  },
  {
    key: 'pwht',
    icon: Thermometer,
    ar: { title: 'محاكي دورة المعالجة الحرارية', line: 'تسخين ومكوث وتبريد مضبوط على 65 kW لكل وحدة.' },
    en: { title: 'PWHT cycle simulator', line: 'Ramp, soak and cooling control on a 65 kW unit.' },
  },
  {
    key: 'rt',
    icon: ScanLine,
    ar: { title: 'عارض أفلام التصوير الإشعاعي', line: 'كيف نحكم على الكثافة والعيب في الصورة.' },
    en: { title: 'Radiographic film lightbox', line: 'How density and defects are judged on film.' },
  },
  {
    key: 'ut',
    icon: Gauge,
    ar: { title: 'معمل UT / PAUT', line: 'معايرة، بوابات A-Scan و S-Scan، وقراءة الإشارة.' },
    en: { title: 'UT / PAUT lab', line: 'Calibration, A-Scan and S-Scan gates, signal reading.' },
  },
] as const;

/**
 * Technical demonstrations, moved off the corporate landing page.
 *
 * Nothing was rewritten: the same four components the homepage used to render
 * between the services and the certifications are mounted here, in the same
 * order, so a buyer who wants proof still gets the full interactive tour — but
 * no longer before they have seen the accreditations and the track record.
 */
export const CompanyDemoPortal: React.FC<CompanyDemoPortalProps> = ({
  language,
  anchor,
  onBack,
  onRequestQuote,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const [showcase, setShowcase] = useState(anchor === 'inspection-showcase');
  useEffect(() => {
    if (anchor === 'inspection-showcase') setShowcase(true);
  }, [anchor]);

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
                ? 'هذه هي نفس الأجهزة والمنهجيات المستخدمة في الميدان: محاكاة دورة حرارية، عارض أفلام إشعاعية، ومعمل موجات فوق صوتية ومصفوفات طورية. للتعمّق التدريبي، تنتقل كل أداة إلى معملها الكامل داخل الأكاديمية.'
                : 'The same instruments and methods used in the field: a thermal cycle simulator, a radiographic film lightbox, and an ultrasonic / phased-array lab. Each tool links to its full training lab inside the academy.'}
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

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DEMOS.map(demo => {
              const Icon = demo.icon;
              const copy = isAr ? demo.ar : demo.en;
              return (
                <div key={demo.key} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <div className="mt-2 text-sm font-bold text-white">{copy.title}</div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{copy.line}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <details
        id="inspection-showcase"
        open={showcase}
        onToggle={event => setShowcase(event.currentTarget.open)}
        className="border-b border-slate-800 bg-slate-950"
      >
        <summary className="mx-auto max-w-7xl cursor-pointer px-4 py-5 font-bold text-cyan-300 focus-visible:outline focus-visible:outline-2 sm:px-6">
          {isAr ? 'افتح المشهد الثلاثي وأدوات التحكم' : 'Open 3D showcase and controls'}
        </summary>
        {showcase && <CompanyHero language={language} headingLevel="h2" onNavigateToAcademy={() => onOpenAcademy()} onNavigateToSection={onRequestQuote} />}
      </details>
      <AdvancedMotionVisualizerSection language={language} />
      <PwhtCycleSimulator language={language} />
      <RadiographicFilmViewer language={language} onOpenFullRtLab={() => onOpenAcademy('rt_lab')} />
      <CompanyUltrasonicLabSection language={language} onNavigateToAcademy={tab => onOpenAcademy(tab)} />

      <section className="py-12 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white">
              {isAr ? 'جاهز تناقش نطاق مشروعك؟' : 'Ready to scope your project?'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'فريق العمليات يرد على طلبات التسعير في أقل من 4 ساعات عمل.'
                : 'Technical operations answer quote requests in under 4 working hours.'}
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
