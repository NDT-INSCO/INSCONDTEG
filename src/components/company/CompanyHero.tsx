import React, { Suspense, useState } from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { COMPANY_MEDIA } from '../../data/companyMedia';
import type {
  HeroBanner3dMode,
  HeroBannerCameraPreset,
  InspectedBannerPart,
} from './InscoHero3dBanner';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Award,
  Layers,
  Activity,
  Eye,
  BriefcaseBusiness,
  Box,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Camera,
} from 'lucide-react';

// three.js (~1 MB) stays code-split cleanly out of the critical text payload.
const InscoHero3dBanner = React.lazy(() =>
  import('./InscoHero3dBanner').then(module => ({ default: module.InscoHero3dBanner }))
);

const InteractiveInspectionHologram = React.lazy(() =>
  import('./InteractiveInspectionHologram').then(module => ({ default: module.InteractiveInspectionHologram }))
);

interface CompanyHeroProps {
  language: Language;
  onNavigateToAcademy: () => void;
  onNavigateToClient?: () => void;
  onNavigateToSection: (sectionId: string) => void;
  /** Opens the technical demonstrations page (`#demo`). */
  onOpenDemo?: () => void;
}

export const CompanyHero: React.FC<CompanyHeroProps> = ({
  language,
  onNavigateToAcademy,
  onNavigateToClient,
  onNavigateToSection,
  onOpenDemo,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeVisualMode, setActiveVisualMode] = useState<'banner3d' | 'hologram' | 'photo'>('banner3d');
  const [banner3dMode, setBanner3dMode] = useState<HeroBanner3dMode>('ut');
  const [cameraPreset, setCameraPreset] = useState<HeroBannerCameraPreset>('overview');
  const [autoOrbit, setAutoOrbit] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [inspectedPart, setInspectedPart] = useState<InspectedBannerPart | null>(null);

  const heroImagePath = COMPANY_MEDIA.heroInspection;

  const modeMeta: Record<HeroBanner3dMode, { labelAr: string; labelEn: string; specAr: string; specEn: string }> = {
    ut: {
      labelAr: 'موجات PAUT',
      labelEn: 'PAUT Ultrasonic',
      specAr: '5.0 MHz · زاوية 60° · مصفوفة 64 عنصر',
      specEn: '5.0 MHz · 60° Shear · 64-Element Array',
    },
    rt: {
      labelAr: 'أشعة جاما RT',
      labelEn: 'Gamma RT',
      specAr: 'Ir-192 / Se-75 · مسح محيطي متكامل',
      specEn: 'Ir-192 / Se-75 · Panoramic Girth Weld',
    },
    pwht: {
      labelAr: 'معالجة PWHT',
      labelEn: 'PWHT 65 kW',
      specAr: 'أسطول 16 وحدة · تسخين 760°C مبرمج',
      specEn: '16-Unit Fleet · 760°C Programmed Soak',
    },
  };

  const presetLabels: { id: HeroBannerCameraPreset; ar: string; en: string }[] = [
    { id: 'overview', ar: 'بانوراما', en: 'Overview' },
    { id: 'weld_focus', ar: 'درزة اللحام', en: 'Weld Root' },
    { id: 'orbital_rig', ar: 'الماسح المداري', en: 'Scanner Rig' },
  ];

  return (
    <section
      data-testid="company-hero-banner"
      data-preserve-dark="true"
      className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800"
    >
      {/* Full-Width Interactive 3D WebGL Banner Layer */}
      {activeVisualMode === 'banner3d' ? (
        <div className="absolute inset-0 z-0">
          <Suspense
            fallback={
              <div className="w-full h-full bg-radial-[circle_at_70%_40%,_var(--tw-gradient-stops)] from-cyan-950/35 via-slate-950 to-slate-950" />
            }
          >
            <InscoHero3dBanner
              language={language}
              mode={banner3dMode}
              cameraPreset={cameraPreset}
              autoOrbit={autoOrbit}
              onInspectedPartChange={setInspectedPart}
            />
          </Suspense>
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-cyan-950/25 via-slate-950 to-slate-950 pointer-events-none" />
      )}

      {/* Calibrated Directional Contrast Scrim (preserves WCAG AA legibility over 3D scene) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-[1] pointer-events-none ${
          isAr
            ? 'bg-gradient-to-l from-slate-950/95 via-slate-950/72 to-slate-950/20'
            : 'bg-gradient-to-r from-slate-950/95 via-slate-950/72 to-slate-950/20'
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 z-[1] pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"
      />

      {/* Foreground Semantic Content & Interactive 3D Showcase */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 pointer-events-none">
        {/* Document reference and corporate metadata strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pointer-events-auto">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
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

          {/* Visual Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/95 border border-slate-700/80 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveVisualMode('banner3d')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeVisualMode === 'banner3d'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'بانر 3D حي' : '3D Banner'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveVisualMode('hologram')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeVisualMode === 'hologram'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'محاكي A-Scan' : 'A-Scan Lab'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveVisualMode('photo')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeVisualMode === 'photo'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'المشهد الميداني' : 'Field View'}</span>
            </button>
          </div>
        </div>

        {/* Hero Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Narrative & Primary Actions Column */}
          <div className="lg:col-span-6 space-y-6 pointer-events-auto flex flex-col justify-center">
            <div className="space-y-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                {INSCO_COMPANY_DATA.slogan[language]}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight text-balance">
                {INSCO_COMPANY_DATA.name[language]}
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 font-medium">
                {INSCO_COMPANY_DATA.subSlogan[language]}
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {INSCO_COMPANY_DATA.tagline[language]}.{' '}
              {isAr
                ? 'شريك معتمد لكبرى المشروعات القومية والصناعية ومحطات الطاقة في الشرق الأوسط وأفريقيا منذ عام 2010، بأسطول متكامل وشهادات جودة ثلاثية معتمدة.'
                : 'A certified partner to leading mega-projects, industrial plants, and power stations across the Middle East and Africa since 2010, backed by an owned automated fleet and triple ISO accreditations.'}
            </p>

            {/* Primary & Portal Navigation Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigateToSection('rfq')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'اطلب عرض سعر' : 'Request a quote'}</span>
                <ArrowIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              <a
                href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-700 hover:border-cyan-500/60 bg-slate-900/90 text-slate-100 hover:text-white font-medium text-sm transition whitespace-nowrap shrink-0"
              >
                <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'ملف الشركة (PDF)' : 'Company profile (PDF)'}</span>
              </a>

              {onOpenDemo && (
                <button
                  type="button"
                  onClick={onOpenDemo}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-cyan-300 hover:text-cyan-200 hover:bg-slate-900/80 font-medium text-sm transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'شاهد العرض الفني' : 'See the demonstrations'}</span>
                </button>
              )}

              {onNavigateToClient && (
                <button
                  type="button"
                  onClick={onNavigateToClient}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-500/40 bg-emerald-950/75 text-emerald-300 hover:bg-emerald-900/70 hover:text-emerald-200 font-semibold text-sm transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BriefcaseBusiness className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'بوابة العملاء والملفات' : 'Client & Dossier Portal'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onNavigateToAcademy}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 font-medium text-sm transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'أكاديمية إنسكو' : 'INSCO Academy'}</span>
                <ArrowIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>
            </div>

            {/* Executive Quote Block */}
            <div className="pt-3 border-t border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-mono">
                {isAr ? 'بيان الإدارة التنفيذية' : 'Executive Statement'}
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                "{INSCO_COMPANY_DATA.quote.text[language]}"
              </blockquote>
              <div className="mt-1 text-xs font-semibold text-cyan-400">
                {INSCO_COMPANY_DATA.quote.author[language]}
              </div>
            </div>
          </div>

          {/* Right / End Column: Unobstructed 3D Stage OR Alternate Visual Mode */}
          <div className="lg:col-span-6 flex flex-col justify-between min-h-[340px] lg:min-h-[450px]">
            {activeVisualMode === 'banner3d' ? (
              <>
                {/* Minimal Top Spec Bar (No floating side panels over the 3D subject) */}
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/88 border border-slate-700/80">
                    {inspectedPart
                      ? isAr
                        ? inspectedPart.titleAr
                        : inspectedPart.titleEn
                      : isAr
                        ? 'اسحب للتدوير · انقر/مرر لفحص المكونات'
                        : 'Drag to Orbit · Inspect 30" Weld & Crawler'}
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/88 border border-cyan-500/35 text-cyan-300">
                    {isAr ? modeMeta[banner3dMode].specAr : modeMeta[banner3dMode].specEn}
                  </div>
                </div>

                {/* Open Unobstructed Center Window directly onto the Three.js 3D Scene */}
                <div className="flex-1 min-h-[210px]" aria-hidden="true" />

                {/* Sleek Collapsible Bottom Control Dock (Zero Center Occlusion) */}
                <div
                  data-testid="hero-3d-control-dock"
                  className="pointer-events-auto flex flex-col items-center gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setDockCollapsed(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-slate-900/95 border border-b-0 border-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer"
                  >
                    {dockCollapsed ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAr ? 'إظهار أدوات 3D' : 'Show 3D Controls'}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAr ? 'إخفاء أدوات التحكم' : 'Hide Controls'}</span>
                      </>
                    )}
                  </button>

                  {!dockCollapsed && (
                    <div className="w-full rounded-xl bg-slate-950/92 border border-slate-700/85 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xl">
                      {/* Inspection Technique Mode Tabs */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        {(['ut', 'rt', 'pwht'] as HeroBanner3dMode[]).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setBanner3dMode(m)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                              banner3dMode === m
                                ? m === 'ut'
                                  ? 'bg-cyan-600 text-white'
                                  : m === 'rt'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-rose-600 text-white'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {isAr ? modeMeta[m].labelAr : modeMeta[m].labelEn}
                          </button>
                        ))}
                      </div>

                      {/* Camera Presets */}
                      <div className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" aria-hidden="true" />
                        {presetLabels.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setCameraPreset(p.id)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                              cameraPreset === p.id
                                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isAr ? p.ar : p.en}
                          </button>
                        ))}
                      </div>

                      {/* Auto-Orbit Toggle */}
                      <button
                        type="button"
                        onClick={() => setAutoOrbit(prev => !prev)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {autoOrbit ? (
                          <Pause className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        )}
                        <span>{autoOrbit ? (isAr ? 'دوران نشط' : 'Orbiting') : isAr ? 'متوقف' : 'Paused'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : activeVisualMode === 'hologram' ? (
              <div className="pointer-events-auto rounded-2xl overflow-hidden">
                <Suspense fallback={<div className="h-[420px] rounded-2xl border border-slate-800 bg-slate-900/90" />}>
                  <InteractiveInspectionHologram language={language} />
                </Suspense>
              </div>
            ) : (
              <div className="pointer-events-auto relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group shadow-2xl">
                <img
                  src={heroImagePath}
                  alt={isAr ? 'فحص اللحام غير الإتلافي بمحطات الطاقة' : 'Non-destructive weld testing in power plant'}
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-cyan-300 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/30">
                    {isAr ? 'محطة البرلس 4800 MW · وحدة 4' : 'Burullus CCPP 4800 MW · Unit 4'}
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/30 text-emerald-400">
                    ASME SEC. V ART. 4 · PASS
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Activity className="w-4 h-4" aria-hidden="true" />
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
                    onClick={() => setActiveVisualMode('banner3d')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-800/60 rounded-md transition cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'عرض 3D' : 'Open 3D'}
                  </button>
                </div>
              </div>
            )}

            {/* Compact Trust Strip */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono pointer-events-auto">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto mb-1" aria-hidden="true" />
                <span className="text-[11px] text-slate-200 font-sans">Triple ISO 2028</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <Award className="w-4 h-4 text-cyan-400 mx-auto mb-1" aria-hidden="true" />
                <span className="text-[11px] text-slate-200 font-sans">IRCA Auditor</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" aria-hidden="true" />
                <span className="text-[11px] text-slate-200 font-sans">ENRRA Licensed</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Key Metrics Strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto">
          {INSCO_COMPANY_DATA.metrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-5 rounded-lg border border-slate-800 bg-slate-900/88 hover:border-cyan-500/40 transition"
            >
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tabular-nums">
                {metric.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-100">
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
