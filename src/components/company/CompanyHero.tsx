import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { COMPANY_MEDIA } from '../../data/companyMedia';
import { publicUrl } from '../../utils/publicUrl';
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

class VisualBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

type VisualMode = 'banner3d' | 'hologram' | 'photo';

interface CompanyHeroProps {
  language: Language;
  landing?: boolean;
  headingLevel?: 'h1' | 'h2';
  onNavigateToAcademy: () => void;
  onNavigateToClient?: () => void;
  onNavigateToSection: (sectionId: string) => void;
  /** Opens the technical demonstrations page (`#demo`). */
  onOpenDemo?: () => void;
}

export const CompanyHero: React.FC<CompanyHeroProps> = ({
  language,
  landing = false,
  headingLevel: Heading = 'h1',
  onNavigateToAcademy,
  onNavigateToClient,
  onNavigateToSection,
  onOpenDemo,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const sectionRef = useRef<HTMLElement>(null);
  const [activeVisualMode, setActiveVisualMode] = useState<VisualMode>('banner3d');
  const [banner3dMode, setBanner3dMode] = useState<HeroBanner3dMode>('ut');
  const [cameraPreset, setCameraPreset] = useState<HeroBannerCameraPreset>('overview');
  const [reduceMotion, setReduceMotion] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [loadScene, setLoadScene] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [inspectedPart, setInspectedPart] = useState<InspectedBannerPart | null>(null);

  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      setReduceMotion(Boolean(motion?.matches));
      if (motion?.matches && landing) {
        setLoadScene(false);
        setSceneReady(false);
      }
    };
    motion?.addEventListener?.('change', syncMotion);
    return () => motion?.removeEventListener?.('change', syncMotion);
  }, [landing]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!landing || !section || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    const syncVisibility = () => setPageVisible(!document.hidden);
    observer.observe(section);
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [landing]);

  // Paint the old hero layout immediately; request WebGL only as a visible enhancement.
  useEffect(() => {
    if (!landing || !inView || !pageVisible || reduceMotion || loadScene || activeVisualMode !== 'banner3d' || !window.WebGL2RenderingContext) return;
    const start = () => setLoadScene(true);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 300);
    return () => window.clearTimeout(id);
  }, [landing, inView, pageVisible, reduceMotion, loadScene, activeVisualMode]);

  const selectVisualMode = (mode: VisualMode) => {
    if (mode !== activeVisualMode) {
      setSceneReady(false);
      setInspectedPart(null);
    }
    setActiveVisualMode(mode);
    // An explicit choice can load the still, interactive scene in reduced motion.
    if (landing && mode === 'banner3d' && window.WebGL2RenderingContext) setLoadScene(true);
  };
  const sceneVisible = inView && pageVisible;
  const orbiting = !reduceMotion && autoOrbit;
  const show3d = !landing || (loadScene && (sceneVisible || sceneReady));
  const isStaticPoster = landing && !sceneReady;
  const usePoster = landing && (activeVisualMode === 'photo' || (activeVisualMode === 'banner3d' && !sceneReady));
  const heroImagePath = COMPANY_MEDIA.heroInspection;

  const modeMeta: Record<HeroBanner3dMode, { labelAr: string; labelEn: string; specAr: string; specEn: string }> = {
    ut: {
      labelAr: 'موجات PAUT',
      labelEn: 'PAUT Ultrasonic',
      specAr: '5.0 MHz · 60° · 64 عنصرًا',
      specEn: '5.0 MHz · 60° · 64 elements',
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
      specAr: 'دورة توضيحية · تسخين ومكوث وتبريد',
      specEn: 'Illustrative ramp, soak and cooling cycle',
    },
  };

  const presetLabels: { id: HeroBannerCameraPreset; ar: string; en: string }[] = [
    { id: 'overview', ar: 'بانوراما', en: 'Overview' },
    { id: 'weld_focus', ar: 'درزة اللحام', en: 'Weld Root' },
    { id: 'orbital_rig', ar: 'الماسح المداري', en: 'Scanner Rig' },
  ];

  return (
    <section
      ref={sectionRef}
      data-testid={landing ? 'corporate-landing-hero' : 'company-hero-banner'}
      data-preserve-dark="true"
      aria-labelledby={landing ? 'corporate-hero-title' : undefined}
      className={`relative isolate overflow-hidden bg-slate-950 text-white border-b border-slate-800 ${landing ? 'corporate-hero' : ''}`}
    >
      {/* A single full-width background, bounded by this section. */}
      {landing && activeVisualMode !== 'hologram' && (
        <picture data-testid="corporate-hero-poster" aria-hidden="true" className={`corporate-hero-poster ${usePoster ? '' : 'invisible'}`}>
          <source type="image/webp" srcSet={`${publicUrl('images/insco-field-inspection-720.webp')} 720w, ${publicUrl('images/insco-field-inspection-1200.webp')} 1200w`} sizes="100vw" />
          <img src={heroImagePath} width={1376} height={768} fetchPriority="high" decoding="async" alt="" />
        </picture>
      )}
      {activeVisualMode === 'banner3d' ? (
        <div className="absolute inset-0 z-0" data-testid={landing ? 'corporate-hero-backdrop' : undefined}>
          {show3d && (
            <div className={`absolute inset-0 ${isStaticPoster ? 'invisible' : ''}`}>
              <VisualBoundary>
                <Suspense fallback={null}>
                  <InscoHero3dBanner
                    language={language}
                    mode={banner3dMode}
                    cameraPreset={cameraPreset}
                    autoOrbit={orbiting}
                    landing={landing}
                    paused={landing ? !orbiting : reduceMotion}
                    suspended={landing && !sceneVisible}
                    onReadyChange={landing ? setSceneReady : undefined}
                    onInspectedPartChange={setInspectedPart}
                  />
                </Suspense>
              </VisualBoundary>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-cyan-950/25 via-slate-950 to-slate-950 pointer-events-none" />
      )}

      {/* Calibrated Directional Contrast Scrim (preserves WCAG AA legibility over 3D scene) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-[1] pointer-events-none ${isAr ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} ${
          usePoster
            ? 'from-slate-950/98 via-slate-950/86 to-slate-950/74'
            : 'from-slate-950/95 via-slate-950/70 to-slate-950/20'
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 z-[1] pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"
      />

      {/* Foreground Semantic Content & Interactive 3D Showcase */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none ${landing ? 'py-6 sm:py-8 lg:pb-10' : 'pt-8 pb-12'}`}>
        {/* Document reference and corporate metadata strip */}
        <div className={`flex flex-wrap gap-3 mb-6 pointer-events-auto ${landing ? 'flex-col items-start' : 'items-center justify-between'}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300 font-mono">
            <bdi className="text-cyan-400 font-semibold">{INSCO_COMPANY_DATA.docRef}</bdi>
            <bdi>{INSCO_COMPANY_DATA.revision}</bdi>
            <span>{isAr ? 'س.ت: ' : 'CR: '}<bdi>{INSCO_COMPANY_DATA.commercialRegistrationNo}</bdi></span>
            <span>{isAr ? 'رقم الجهة في الملف: ' : 'Body ID in dossier: '}<bdi dir="ltr">{INSCO_COMPANY_DATA.egacCabNo}</bdi></span>
            <span>{isAr ? 'سجل NDT العالمي: ' : 'ndt.org ID: '}<bdi>{INSCO_COMPANY_DATA.ndtOrgId}</bdi></span>
          </div>

          {/* Visual Mode Switcher */}
          <div role="group" aria-label={isAr ? 'وضع عرض البانر' : 'Banner view'} className="flex max-w-full flex-wrap items-center gap-1 p-1 bg-slate-900/95 border border-slate-700/80 rounded-lg">
            <button
              type="button"
              onClick={() => selectVisualMode('banner3d')}
              aria-pressed={activeVisualMode === 'banner3d'}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeVisualMode === 'banner3d'
                  ? 'bg-sky-300 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'بانر 3D حي' : '3D Banner'}</span>
            </button>
            <button
              type="button"
              onClick={() => selectVisualMode('hologram')}
              aria-pressed={activeVisualMode === 'hologram'}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeVisualMode === 'hologram'
                  ? 'bg-sky-300 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'محاكي A-Scan' : 'A-Scan Lab'}</span>
            </button>
            <button
              type="button"
              onClick={() => selectVisualMode('photo')}
              aria-pressed={activeVisualMode === 'photo'}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeVisualMode === 'photo'
                  ? 'bg-sky-300 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'المشهد الميداني' : 'Field View'}</span>
            </button>
          </div>
        </div>

        {/* Hero Main Grid */}
        <div className={`grid grid-cols-1 items-stretch ${landing ? 'min-[880px]:grid-cols-2 gap-6 sm:gap-8' : 'lg:grid-cols-2 gap-8'}`}>
          {/* Narrative & Primary Actions Column */}
          <div className={`min-w-0 flex flex-col justify-center ${landing ? 'gap-4 lg:gap-5' : 'gap-6 pointer-events-auto'}`}>
            <div className="space-y-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                {INSCO_COMPANY_DATA.slogan[language]}
              </span>
              <Heading id={landing ? 'corporate-hero-title' : undefined} className={`font-black text-white tracking-tight leading-tight text-balance ${landing ? 'text-[clamp(1.65rem,3.4vw,3rem)]' : 'text-3xl sm:text-4xl lg:text-5xl'}`}>
                {INSCO_COMPANY_DATA.name[language]}
              </Heading>
              <p className={`text-slate-200 font-medium ${landing ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
                {INSCO_COMPANY_DATA.subSlogan[language]}
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {landing
                ? (isAr
                  ? 'خدمات الفحص غير الإتلافي والمعالجة الحرارية بعد اللحام وخدمات اللحام للمشروعات الصناعية. يُحدد نطاق التنفيذ وتوافر المعدات مع الفريق الفني.'
                  : 'Non-destructive testing, post-weld heat treatment and welding services for industrial projects. Confirm the scope and equipment availability with our technical team.')
                : (isAr ? 'مشهد محاكاة للتعلّم. القيم المعروضة توضيحية ولا تصلح لإعدادات تشغيل أو نتائج فحص.' : 'An illustrative learning scene. Displayed values are not operating settings or inspection results.')}
            </p>

            {/* Primary & Portal Navigation Actions */}
            <div className={`pointer-events-auto ${landing ? 'corporate-hero-actions' : 'flex flex-wrap items-center gap-3 pt-1'}`}>
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
                  <span>{isAr ? 'شاهد العرض الفني' : 'Technical demo'}</span>
                </button>
              )}

              {onNavigateToClient && (
                <button
                  type="button"
                  onClick={onNavigateToClient}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-500/40 bg-emerald-950/75 text-emerald-300 hover:bg-emerald-900/70 hover:text-emerald-200 font-semibold text-sm transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BriefcaseBusiness className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'بوابة العملاء والملفات' : 'Clients & dossiers'}</span>
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

            {landing && (
              <div className="border-t border-slate-700/65 pt-3 text-xs leading-relaxed text-slate-300">
                <p className="font-mono text-sky-300">{isAr ? 'من ملف الشركة' : 'From the company dossier'}</p>
                <p className="mt-1">{isAr
                  ? `تأسست إنسكو عام ${INSCO_COMPANY_DATA.establishedYear}. المشهد والقيم للتوضيح فقط، وليست إعدادات تشغيل أو نتائج فحص.`
                  : `INSCO was established in ${INSCO_COMPANY_DATA.establishedYear}. The scene and values are illustrative, not operating settings or inspection results.`}</p>
              </div>
            )}
          </div>

          {/* Right / End Column: Unobstructed 3D Stage OR Alternate Visual Mode */}
          <div className={`min-w-0 flex flex-col justify-between ${landing ? 'min-h-48 min-[880px]:min-h-[26rem]' : 'min-h-[340px] lg:min-h-[450px]'}`}>
            {activeVisualMode === 'banner3d' ? (
              <>
                {/* Minimal Top Spec Bar (No floating side panels over the 3D subject) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/88 border border-slate-700/80">
                    {isStaticPoster
                      ? (isAr ? 'مشهد توضيحي ثابت' : 'Static illustrative scene')
                      : inspectedPart
                      ? isAr
                        ? inspectedPart.titleAr
                        : inspectedPart.titleEn
                      : isAr
                        ? 'اسحب للتدوير · المس للفحص'
                        : 'Drag to orbit · Tap to inspect'}
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/88 border border-cyan-500/35 text-cyan-300">
                    <bdi>{isAr ? modeMeta[banner3dMode].specAr : modeMeta[banner3dMode].specEn}</bdi>
                  </div>
                </div>

                {/* Open Unobstructed Center Window directly onto the Three.js 3D Scene */}
                <div className={`flex-1 ${landing ? 'min-h-14 sm:min-h-24 min-[880px]:min-h-40' : 'min-h-[210px]'}`} aria-hidden="true" />

                {/* Sleek Collapsible Bottom Control Dock (Zero Center Occlusion) */}
                <div
                  data-testid="hero-3d-control-dock"
                  className="pointer-events-auto flex flex-col items-center gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setDockCollapsed(prev => !prev)}
                    aria-expanded={!dockCollapsed}
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
                      <div role="group" aria-label={isAr ? 'طريقة الفحص' : 'Inspection technique'} className="flex max-w-full flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        {(['ut', 'rt', 'pwht'] as HeroBanner3dMode[]).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setBanner3dMode(m)}
                            aria-pressed={banner3dMode === m}
                            disabled={isStaticPoster}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 disabled:cursor-default ${
                              banner3dMode === m
                                ? m === 'ut'
                                  ? 'bg-sky-300 text-slate-950'
                                  : m === 'rt'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-rose-300 text-slate-950'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {isAr ? modeMeta[m].labelAr : modeMeta[m].labelEn}
                          </button>
                        ))}
                      </div>

                      {/* Camera Presets */}
                      <div role="group" aria-label={isAr ? 'زاوية الكاميرا' : 'Camera preset'} className="flex max-w-full flex-wrap items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" aria-hidden="true" />
                        {presetLabels.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setCameraPreset(p.id)}
                            aria-pressed={cameraPreset === p.id}
                            disabled={isStaticPoster}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 disabled:cursor-default ${
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
                        aria-pressed={landing ? undefined : orbiting}
                        disabled={reduceMotion || isStaticPoster}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 cursor-pointer whitespace-nowrap shrink-0 disabled:cursor-default"
                      >
                        {orbiting && !isStaticPoster ? (
                          <Pause className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        )}
                        <span>{reduceMotion
                          ? (isAr ? 'تقليل الحركة' : 'Reduced motion')
                          : isStaticPoster ? (isAr ? 'عرض ثابت' : 'Still view')
                          : landing
                            ? (orbiting ? (isAr ? 'أوقف الحركة' : 'Pause motion') : (isAr ? 'شغّل الحركة' : 'Play motion'))
                            : orbiting ? (isAr ? 'دوران نشط' : 'Orbiting') : (isAr ? 'متوقف' : 'Paused')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : activeVisualMode === 'hologram' ? (
              <div className="pointer-events-auto rounded-2xl overflow-hidden">
                <Suspense fallback={<div className="h-[420px] rounded-2xl border border-slate-800 bg-slate-900/90" />}>
                  <InteractiveInspectionHologram
                    language={language}
                    compact={landing}
                    suspendMotion={landing && (!sceneVisible || reduceMotion)}
                  />
                </Suspense>
              </div>
            ) : landing ? (
              <p className="self-start mt-auto rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-slate-200">
                {isAr ? 'صورة توضيحية لعملية فحص ميداني' : 'Illustrative field inspection scene'}
              </p>
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
                    {isAr ? 'مشهد توضيحي لعملية فحص' : 'Illustrative inspection scene'}
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/30 text-sky-300">
                    INSCO · DEMO
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
                    onClick={() => selectVisualMode('banner3d')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-800/60 rounded-md transition cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'عرض 3D' : 'Open 3D'}
                  </button>
                </div>
              </div>
            )}

            {/* Keep the compact trust row without implying current credentials. */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-200 pointer-events-auto">
              {[
                { icon: ShieldCheck, href: '#certifications', ar: 'ملف الشهادات', en: 'Certificate records', demoAr: 'ملف الشهادات', demoEn: 'Certificate records' },
                { icon: Award, href: '#vault', ar: 'ملف التأهيل', en: 'Vendor dossier', demoAr: 'المحاكاة', demoEn: 'Illustrative controls' },
                { icon: Zap, href: '#services', ar: 'استكشف خدماتنا', en: 'Explore our services', demoAr: 'عرض تدريبي', demoEn: 'Training demo' },
              ].map(({ icon: Icon, href, ar, en, demoAr, demoEn }) => {
                const badge = 'p-2.5 rounded-lg bg-slate-900/90 border border-slate-800';
                const icon = <Icon className="w-4 h-4 text-cyan-400 mx-auto mb-1" aria-hidden="true" />;
                return landing ? (
                  <a key={href} href={href} className={`${badge} hover:border-cyan-500/60`}>{icon}{isAr ? ar : en}</a>
                ) : (
                  <div key={href} className={badge}>{icon}{isAr ? demoAr : demoEn}</div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4-Column Key Metrics Strip */}
        <div data-testid={landing ? 'corporate-hero-metrics' : undefined} className={`grid grid-cols-2 md:grid-cols-4 pointer-events-auto ${landing ? 'mt-7 gap-2 sm:gap-3' : 'mt-10 gap-4'}`}>
          {INSCO_COMPANY_DATA.metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`min-w-0 rounded-lg border border-slate-800 bg-slate-900/88 hover:border-cyan-500/40 transition ${landing ? 'p-3 sm:p-4' : 'p-5'}`}
            >
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tabular-nums">
                <bdi dir="ltr">{metric.value}</bdi>
              </div>
              <div className={`mt-1 font-semibold text-slate-100 ${landing ? 'text-[13px] leading-snug' : 'text-sm'}`}>
                {metric.label[language]}
              </div>
              <div className={`mt-0.5 text-slate-400 ${landing ? 'text-[11px]' : 'text-xs'}`}>
                {metric.subLabel[language]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
