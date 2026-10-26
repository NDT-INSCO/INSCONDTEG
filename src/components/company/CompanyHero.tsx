import React, { Suspense, useState } from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { FileText, ArrowRight, ArrowLeft, ShieldCheck, Zap, Award, Layers, Sparkles, Activity, Eye } from 'lucide-react';
// three.js is ~1 MB. It powers a decorative 3D hologram, so it must not sit in
// the first payload of a page that mostly serves text.
const InteractiveInspectionHologram = React.lazy(() =>
  import('./InteractiveInspectionHologram').then(module => ({ default: module.InteractiveInspectionHologram }))
);

interface CompanyHeroProps {
  language: Language;
  onNavigateToAcademy: () => void;
  onNavigateToSection: (sectionId: string) => void;
}

export const CompanyHero: React.FC<CompanyHeroProps> = ({
  language,
  onNavigateToAcademy,
  onNavigateToSection,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const [activeVisualMode, setActiveVisualMode] = useState<'photo' | '3d'>('photo');

  const heroImagePath = '/src/assets/images/hero_ndt_inspection_1792692322245.jpg';

  return (
    <section className="relative overflow-hidden pt-8 pb-16 border-b border-slate-800">
      {/* Background subtle radial gradient */}
      <div className="absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Document reference and corporate metadata strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-6 font-mono">
          <span className="text-cyan-400 font-semibold">{INSCO_COMPANY_DATA.docRef}</span>
          <span aria-hidden="true">·</span>
          <span>{INSCO_COMPANY_DATA.revision}</span>
          <span aria-hidden="true">·</span>
          <span>{isAr ? 'س.ت: ' + INSCO_COMPANY_DATA.commercialRegistrationNo : 'CR: ' + INSCO_COMPANY_DATA.commercialRegistrationNo}</span>
          <span aria-hidden="true">·</span>
          <span>{isAr ? 'اعتماد إيجاك: ' + INSCO_COMPANY_DATA.egacCabNo : 'EGAC CAB: ' + INSCO_COMPANY_DATA.egacCabNo}</span>
          <span aria-hidden="true">·</span>
          <span>{isAr ? 'سجل NDT العالمي: ' + INSCO_COMPANY_DATA.ndtOrgId : 'ndt.org ID: ' + INSCO_COMPANY_DATA.ndtOrgId}</span>
        </div>

        {/* Hero Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                {INSCO_COMPANY_DATA.slogan[language]}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight text-balance">
                {INSCO_COMPANY_DATA.name[language]}
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 font-medium">
                {INSCO_COMPANY_DATA.subSlogan[language]}
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              {INSCO_COMPANY_DATA.tagline[language]}.{' '}
              {isAr
                ? 'شريك معتمد لكبرى المشروعات القومية والصناعية ومحطات الطاقة في الشرق الأوسط وأفريقيا منذ عام 2010، بأسطول متكامل وشهادات جودة ثلاثية معتمدة.'
                : 'A certified partner to leading mega-projects, industrial plants, and power stations across the Middle East and Africa since 2010, backed by an owned automated fleet and triple ISO accreditations.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-sm"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">
                  {isAr ? 'تحميل ملف الشركة الرسمي (PDF)' : 'Download Profile Brochure (PDF)'}
                </span>
              </a>

              <button
                type="button"
                onClick={onNavigateToAcademy}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-sm border border-slate-700 transition cursor-pointer"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">
                  {isAr ? 'بوابة أكاديمية إنسكو الهندسية' : 'Enter INSCO Engineering Academy'}
                </span>
                <ArrowIcon className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToSection('rfq')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 font-medium text-sm transition cursor-pointer"
              >
                <span>{isAr ? 'طلب عرض سعر واعتماد مورد' : 'Request RFQ & Pre-qual'}</span>
              </button>
            </div>

            {/* Executive Quote Block */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-mono">
                {isAr ? 'بيان الإدارة التنفيذية' : 'Executive Statement'}
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                "{INSCO_COMPANY_DATA.quote.text[language]}"
              </blockquote>
              <div className="mt-1 text-xs font-semibold text-cyan-400">
                {INSCO_COMPANY_DATA.quote.author[language]}
              </div>
            </div>
          </div>

          {/* Right column: High-Tech Visual Showcase (Cinematic Photo with HUD + 3D Scanner Toggle) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Visual Mode Selector Tabs */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة التفتيش الميداني الذكي' : 'Smart Field Inspection Visual'}</span>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveVisualMode('photo')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    activeVisualMode === 'photo'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isAr ? 'المشهد الميداني' : 'Field View'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVisualMode('3d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    activeVisualMode === '3d'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isAr ? 'محاكي 3D تفاعلي' : '3D Scanner'}</span>
                </button>
              </div>
            </div>

            {/* Display Viewport */}
            {activeVisualMode === 'photo' ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group shadow-2xl">
                <img
                  src={heroImagePath}
                  alt={isAr ? 'فحص اللحام غير الإتلافي بمحطات الطاقة' : 'Non-destructive weld testing in power plant'}
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover transition duration-700 group-hover:scale-105"
                />

                {/* Gradient Scrim */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

                {/* Animated Laser Grid & Coordinate Scan Line */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent opacity-75 animate-pulse absolute top-1/3 shadow-[0_0_15px_#22d3ee]" />
                </div>

                {/* High-Tech HUD Overlay Elements */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-cyan-300 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-cyan-500/30">
                    {isAr ? 'محطة البرلس 4800 MW · وحدة 4' : 'Burullus CCPP 4800 MW · Unit 4'}
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-emerald-400">
                    ASME SEC. V ART. 4 · PASS
                  </div>
                </div>

                {/* Bottom Telemetry HUD */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">
                        {isAr ? 'فحص بالموجات فوق الصوتية (UT)' : 'Ultrasonic Flaw Inspection (UT)'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Probe: Olympus 5.0 MHz 60° · Krautkramer USM 35X
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveVisualMode('3d')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded-md transition cursor-pointer"
                  >
                    {isAr ? 'تشغيل 3D' : 'Open 3D'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden">
                <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />}>
                  <InteractiveInspectionHologram language={language} />
                </Suspense>
              </div>
            )}

            {/* Fast Trust Indicators below visual */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-300 font-sans">Triple ISO 2028</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <Award className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-300 font-sans">IRCA Auditor</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-300 font-sans">ENRRA Licensed</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Key Metrics Strip */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
          {INSCO_COMPANY_DATA.metrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-5 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition"
            >
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tabular-nums">
                {metric.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-200">
                {metric.label[language]}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                {metric.subLabel[language]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
