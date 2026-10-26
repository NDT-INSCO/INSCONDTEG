import React, { Suspense, useState } from 'react';
import { Language } from '../../types';
const InteractiveInspectionHologram = React.lazy(() =>
  import('./InteractiveInspectionHologram').then(module => ({ default: module.InteractiveInspectionHologram }))
);
import { 
  Sparkles, 
  Activity, 
  Layers, 
  Maximize2, 
  ShieldCheck, 
  Sliders, 
  Zap, 
  Eye, 
  Flame 
} from 'lucide-react';

interface AdvancedMotionVisualizerSectionProps {
  language: Language;
}

export const AdvancedMotionVisualizerSection: React.FC<AdvancedMotionVisualizerSectionProps> = ({ language }) => {
  const isAr = language === 'ar';
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<number | null>(null);

  const galleryItems = [
    {
      title: { ar: 'الفحص الميداني بالموجات فوق الصوتية (UT)', en: 'Ultrasonic Field Inspection (UT)' },
      subtitle: { ar: 'فحص خطوط الأنابيب بمحطات الطاقة العملاقة', en: 'Pipeline Inspection in Power Stations' },
      src: '/src/assets/images/hero_ndt_inspection_1792692322245.jpg',
      code: 'ASME Sec. V Art. 4',
      badge: 'UT / PAUT',
      equipment: 'Olympus 5.0 MHz · Krautkramer USM 35X'
    },
    {
      title: { ar: 'أسطول المعالجة الحرارية بعد اللحام (PWHT)', en: 'Post-Weld Heat Treatment Fleet (PWHT)' },
      subtitle: { ar: '16 وحدة أوتوماتيكية مبرمجة 65 kW بالقاهرة', en: '16 Fully-Owned 65 kW Automated Units' },
      src: '/src/assets/images/pwht_heat_treatment_1792692336668.jpg',
      code: 'AWS D10.10 & ASME B31.3',
      badge: '750°C SOAK',
      equipment: 'Cooperheat / Stork 65 kW Programmed System'
    },
    {
      title: { ar: 'التصوير الإشعاعي الصناعي بجاما (RT)', en: 'Industrial Radiography Gamma Testing (RT)' },
      subtitle: { ar: 'ترخيص رسمي من هيئة الرقابة النووية (ENRRA)', en: 'ENRRA Licensed Radiation Practices' },
      src: '/src/assets/images/radiography_gamma_scan_1792692355717.jpg',
      code: 'ENRRA LS.0112 · ISO 17636',
      badge: 'Ir-192 / Se-75',
      equipment: 'Sentinel 880 Delta / Spec 150 Projectors'
    },
    {
      title: { ar: 'المصفوفات الطورية وكشف العيوب (PAUT)', en: 'Phased Array Flaw Imaging (PAUT)' },
      subtitle: { ar: 'مسح قطاعي متقدم S-Scan للشروخ ونقص الانصهار', en: 'Sectorial S-Scan Weld Root Integrity' },
      src: '/src/assets/images/paut_flaw_detector_1792692369481.jpg',
      code: 'ASME Sec. V Art. 4 App.',
      badge: 'Multi-Angle 35°-70°',
      equipment: 'Olympus OmniScan X3 64:128PR'
    },
  ];

  return (
    <section id="hologram-lab" className="py-16 border-b border-slate-800 bg-slate-950 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'تقنيات الجرافيكس ثلاثية الأبعاد والمحاكاة الميدانية' : '3D Interactive Holographic & Field Graphics Lab'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr
              ? 'معرض الصور الميدانية والمحاكي الهولوغرافي التفاعلي'
              : 'Interactive 3D Holographic Scanner & Photorealistic Gallery'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isAr
              ? 'تجمع إنسكو بين أحدث معدات الفحص الميدانية العالمية (Olympus وKrautkramer وSentinel) والبيئة الرقمية التفاعلية لمحاكاة انتشار الموجات والأشعة واكتشاف العيوب بدقة متناهية.'
              : 'Experience the convergence of world-class field testing instrumentation (Olympus, Krautkramer, Sentinel) with real-time 3D simulation and ultrasonic waveform diagnostics.'}
          </p>
        </div>

        {/* 1. Interactive 3D Holographic Pipeline Weld Scanner */}
        <div className="mb-14">
          <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />}>
            <InteractiveInspectionHologram language={language} />
          </Suspense>
        </div>

        {/* 2. Photorealistic Field Engineering Gallery */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'معرض التوثيق الفوتوغرافي لعمليات الفحص والمعالجة' : 'High-Fidelity Engineering Field Operations Gallery'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'لقطات واقعية عالية الدقة للمعدات والمهندسين وأعمال التفتيش بالمواقع الحية' : 'Photorealistic visual documentation of fleet assets and certified engineering inspections'}
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              4 {isAr ? 'أصول رئيسية' : 'Key Assets'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedGalleryImg(idx)}
                className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 transition duration-300 cursor-pointer shadow-lg flex flex-col justify-between"
              >
                {/* Image Viewport */}
                <div className="relative h-52 overflow-hidden bg-slate-950">
                  <img
                    src={item.src}
                    alt={item.title[language]}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Top Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold">
                      {item.badge}
                    </span>
                    <span className="p-1 rounded bg-slate-950/85 text-slate-300">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Caption Strip */}
                <div className="p-4 space-y-2">
                  <div className="text-[11px] font-mono text-cyan-400">
                    {item.code}
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                    {item.title[language]}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.subtitle[language]}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 truncate">
                    {item.equipment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for full image inspection */}
        {selectedGalleryImg !== null && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedGalleryImg(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-cyan-400">{galleryItems[selectedGalleryImg].code}</span>
                  <h3 className="text-lg font-bold text-white">
                    {galleryItems[selectedGalleryImg].title[language]}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGalleryImg(null)}
                  className="px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  {isAr ? 'إغلاق ✕' : 'Close ✕'}
                </button>
              </div>

              <div className="rounded-xl overflow-hidden max-h-[60vh] bg-slate-950 flex items-center justify-center">
                <img
                  src={galleryItems[selectedGalleryImg].src}
                  alt={galleryItems[selectedGalleryImg].title[language]}
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                <span>{galleryItems[selectedGalleryImg].equipment}</span>
                <span className="text-cyan-400">{isAr ? 'شركة إنسكو الدولية' : 'INSCO Industrial NDT'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
