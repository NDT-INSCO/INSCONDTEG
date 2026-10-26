import React, { useState } from 'react';
import { Language } from '../../../types';
import { UtFlawDetectorDevice } from './UtFlawDetectorDevice';
import { PautOmniScanDevice } from './PautOmniScanDevice';
import { ComprehensiveWeldUtSimulator } from './ComprehensiveWeldUtSimulator';
import { DacCalibrationBuilder } from './DacCalibrationBuilder';
import { V1V2CalibrationLab } from './V1V2CalibrationLab';
import { BeamConeAndDefectExplorer } from './BeamConeAndDefectExplorer';
import { WorkshopTrainingResultsPanel } from './WorkshopTrainingResultsPanel';
import { VirtualLab } from '../VirtualLab';
import {
  Activity,
  Atom,
  Cpu,
  BookOpen,
  Award,
  CheckCircle2,
  Compass,
  Eye,
  Ruler,
  TrendingDown,
} from 'lucide-react';

interface NdtVirtualLabWorkbenchProps {
  language: Language;
}

export const NdtVirtualLabWorkbench: React.FC<NdtVirtualLabWorkbenchProps> = ({ language }) => {
  const isAr = language === 'ar';

  const [activeLabMode, setActiveLabMode] = useState<
    | 'weld_ray_tracing'
    | 'v1_v2_calibration'
    | 'virtual_3d_lab'
    | 'dac_builder'
    | 'ut_conventional'
    | 'paut_phased_array'
    | 'beam_cone_defects'
  >('weld_ray_tracing');
  const [activeTheoryTab, setActiveTheoryTab] = useState<'acoustics' | 'calibration' | 'acceptance'>('acoustics');
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  const missions = [
    {
      id: 'm1',
      title: { ar: 'معايرة السرعة وصفر الويدج على بلوك IIW V1', en: 'Calibrate Velocity & Wedge Zero on IIW V1' },
      desc: { ar: 'اضبط سرعة الموجات القصية (3240 m/s) وصفر المجس وبناء منحنى DAC / TCG.', en: 'Set 3240 m/s shear velocity, probe zero delay, and 3-point DAC/TCG.' },
    },
    {
      id: 'm_dac',
      title: { ar: 'إنشاء منحنى DAC خطوة بخطوة ودراسة تأثير سماكة العينة', en: 'Build Step-by-Step ASME DAC & Simulate Thickness Loss' },
      desc: { ar: 'سجّل نقاط 1/4T و 1/2T و 3/4T، وراقب توهين الإشارة المرتدة وحدود ASME مع تغير السماكة.', en: 'Capture 1/4T, 1/2T, 3/4T SDH echoes, observe thickness attenuation, and verify ASME App. 12.' },
    },
    {
      id: 'm_cone',
      title: { ar: 'استكشاف كوم الأشعة 3D وجميع العيوب الـ 16 بأشكالها', en: 'Explore 3D Beam Cone & All 16 Weld Defect Shapes' },
      desc: { ar: 'افحص المجال القريب NF ومخروط -6dB/-20dB وتفاعل الموجات مع الشروخ والتورق والمسامات.', en: 'Inspect Fresnel zone NF, -6dB/-20dB cones, and wave scattering across all 16 defect shapes.' },
    },
    {
      id: 'm3',
      title: { ar: 'تشغيل جهازي UT و PAUT الواقعيين بجانب طاولة العمل', en: 'Operate Realistic UT & PAUT Hardware + Worktables' },
      desc: { ar: 'اسحب البروب على العينة بجانب الجهاز وسجّل تقييمك في لوحة النتائج التدريبية بالأسفل.', en: 'Drag the probe on the live worktable beside the hardware and log graded inspections below.' },
    },
  ];

  const handleToggleMission = (mId: string) => {
    setCompletedMissions((prev) =>
      prev.includes(mId) ? prev.filter((id) => id !== mId) : [...prev, mId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Workshop Mode Switcher */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-cyan-400 mb-2">
              {isAr ? 'ورشة UT و PAUT العملية الشاملة للتدريب الهندسي' : 'Complete UT & PAUT Hands-On Engineering Workshop'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr ? 'ورشة أجهزة الموجات فوق الصوتية والمصفوفات الطورية (UT & PAUT)' : 'Ultrasonic (UT) & Phased Array (PAUT) Master Workshop'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              {isAr
                ? 'تصميم واقعي لأجهزة الفحص (USM 35X UT & OmniScan X3 PAUT) مدمجة بجانب محاكيات العمل الحية، مع مجسم ثلاثي الأبعاد لكوم الأشعة (3D Beam Cone) وموسوعة كافة الـ 16 عيباً وسجل النتائج التدريبية بالأسفل.'
                : 'Authentic hardware designs (USM 35X UT & OmniScan X3 PAUT) merged side-by-side with live specimen worktables, 3D Beam Cone visualizer, complete 16-defect atlas, and live training scorecard underneath.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveLabMode('weld_ray_tracing')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'weld_ray_tracing'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{isAr ? 'الورشة الشاملة (فلات وكيرف + كالبريشن + كود)' : 'Master Weld UT/PAUT Workshop'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLabMode('ut_conventional')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'ut_conventional'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isAr ? 'جهاز UT المستقل (USM 35X + محاكي العمل)' : 'Standalone UT Console'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLabMode('paut_phased_array')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'paut_phased_array'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{isAr ? 'جهاز PAUT المستقل (OmniScan + محاكي العمل)' : 'Standalone PAUT Console'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLabMode('beam_cone_defects')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'beam_cone_defects'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isAr ? 'كوم الأشعة 3D وموسوعة الـ 16 عيباً' : '3D Beam Cone & All 16 Defects'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLabMode('v1_v2_calibration')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'v1_v2_calibration'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>{isAr ? 'بلوكات V1 & V2 3D واستارت تشيك الكود' : '3D V1 & V2 Blocks + Start-Check'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLabMode('virtual_3d_lab')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'virtual_3d_lab'
                  ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Atom className="w-4 h-4" />
              <span>{isAr ? 'مختبر 3D NDT الشامل (+ مخطط D3)' : '3D NDT Lab (+ V1/V2 & D3)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLabMode('dac_builder')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                activeLabMode === 'dac_builder'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>{isAr ? 'مختبر منحنى المعايرة DAC (ASME)' : 'ASME DAC Curve Builder'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Practical Workshop Missions */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'مهام التدريب العملي بالورشة (اضغط لتحديد المهمة المكتملة):' : 'Guided Workshop Training Tasks:'}</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 tabular-nums">
            {completedMissions.length} / {missions.length} {isAr ? 'مكتمل' : 'Completed'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {missions.map((m) => {
            const isDone = completedMissions.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => handleToggleMission(m.id)}
                className={`p-3 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-1 rounded mt-0.5 ${isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className={`text-xs font-bold leading-tight ${isDone ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {m.title[language]}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{m.desc[language]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Simulator Viewport */}
      {activeLabMode === 'weld_ray_tracing' ? (
        <ComprehensiveWeldUtSimulator language={language} />
      ) : activeLabMode === 'v1_v2_calibration' ? (
        <V1V2CalibrationLab
          language={language}
          onCompleteAndProceedToWeld={() => setActiveLabMode('weld_ray_tracing')}
        />
      ) : activeLabMode === 'virtual_3d_lab' ? (
        <VirtualLab language={language} />
      ) : activeLabMode === 'dac_builder' ? (
        <DacCalibrationBuilder language={language} />
      ) : activeLabMode === 'ut_conventional' ? (
        <UtFlawDetectorDevice language={language} />
      ) : activeLabMode === 'paut_phased_array' ? (
        <PautOmniScanDevice language={language} />
      ) : (
        <BeamConeAndDefectExplorer
          language={language}
          onSelectDefectForLiveSim={() => setActiveLabMode('weld_ray_tracing')}
        />
      )}

      {/* Live Training Results & Competency Scorecard Directly Underneath the Workshop */}
      <WorkshopTrainingResultsPanel
        language={language}
        completedMissionCount={completedMissions.length}
        totalMissionCount={missions.length}
      />

      {/* Acoustic Physics, Calibration & Code Equations Reference */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {isAr ? 'المرجع الهندسي لمعادلات الفحص والكالبريشن وتصحيح الكيرف' : 'Acoustic Physics, Curvature Math & Code Sizing Reference'}
            </h3>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTheoryTab('acoustics')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeTheoryTab === 'acoustics' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'معادلات الفلات والكيرف' : 'Flat & Curved Math'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTheoryTab('calibration')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeTheoryTab === 'calibration' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'أسس الكالبريشن' : 'Calibration'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTheoryTab('acceptance')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeTheoryTab === 'acceptance' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'تقييم العيوب والأكواد' : 'Flaw Sizing & Codes'}
            </button>
          </div>
        </div>

        {activeTheoryTab === 'acoustics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-cyan-400 font-bold">1. قانون سنيل للانكسار (Snell’s Law):</div>
              <div className="text-white text-sm font-bold bg-slate-900 p-2 rounded border border-slate-800 text-center">
                sin(θ₁) / c₁ = sin(θ₂) / c₂
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {isAr
                  ? 'يحكم انكسار الموجة الطولية من الويدج البلاستيكي إلى موجة قصية مستعرضة (3240 m/s) داخل الفولاذ.'
                  : 'Governs refraction from Perspex wedge longitudinal wave into 3240 m/s shear wave in steel.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-1.5">
              <div className="text-purple-300 font-bold">
                {isAr ? '2. المجال القريب (Near Field N):' : '2. Fresnel Near Field (N):'}
              </div>
              <div className="text-white text-sm font-bold bg-slate-900 p-2 rounded border border-slate-800 text-center">
                N = D²·f / (4·V) = D² / (4·λ)
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {isAr
                  ? 'منطقة التداخل الموجي البناء والهدام قبل نقطة التركيز الطبيعية Y₀⁺؛ يُخصم منها المكافئ داخل الويدج N_eff = N - Lw·(Vw/Vm).'
                  : 'Fresnel constructive/destructive interference zone prior to natural focus Y0+; effective specimen NF subtracts wedge travel.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-amber-400 font-bold">3. حسابات العينة الفلات (Flat Plate Trig):</div>
              <div className="text-white text-sm font-bold bg-slate-900 p-2 rounded border border-slate-800 text-center">
                D = S·cos(θ) | Skip = 2·t·tan(θ)
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {isAr
                  ? 'حساب العمق الحقيقي ومسافة القفزة الكاملة على الألواح المستوية في المسار الأول والثاني.'
                  : 'Direct depth and full-skip calculation on flat butt-welded plates.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-emerald-400 font-bold">4. معادلة العينة الكيرف (Curved Pipe OD):</div>
              <div className="text-white text-sm font-bold bg-slate-900 p-2 rounded border border-slate-800 text-center">
                D = Rₒ - √(Rₒ² + S² - 2·Rₒ·S·cosθ)
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {isAr
                  ? 'معادلة تصحيح الانحناء عند فحص الأنابيب وأوعية الضغط لحساب العمق القطري الحقيقي بدقة.'
                  : 'Exact radial depth equation accounting for outer pipe radius Ro curvature.'}
              </p>
            </div>
          </div>
        )}

        {activeTheoryTab === 'calibration' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-cyan-400 font-bold">معايرة جهاز UT التقليدي (IIW V1 / ASME Basic):</div>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                <li>معايرة السرعة (Velocity) والصفر (Zero Delay) باستخدام قوس R100 وارتداده المضاعف R200.</li>
                <li>التحقق من نقطة الخروج (Beam Index) والزاوية الفعلية عبر ثقب Ø1.5 مم SDH.</li>
                <li>رسم منحنى DAC من 3 ثقوب مرجعية (1/4T, 1/2T, 3/4T) وتحديد عتبة التسجيل (20% DAC).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold">معايرة جهاز PAUT المصفوفات الطورية (ASME Sec V Art. 4):</div>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                <li>معايرة تأخير الويدج (Wedge Delay) لكافة زوايا المسح القطاعي (مثلاً 35° إلى 75°).</li>
                <li>موازنة الحساسية الزاوية (ACG) لتعطي جميع الزوايا نفس السعة لثقب قياسي واحد.</li>
                <li>موازنة الكسب الزمني (TCG) لتوحيد سعة الصدى عند مختلف الأعماق إلى 80% FSH.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTheoryTab === 'acceptance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-cyan-400 font-bold">طرق تحجيم أبعاد العيوب (-6 dB Drop & Tip Diffraction):</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr
                  ? 'يُقاس طول العيب الممتد (ΔL) بتحريك المجس موازياً لخط اللحام حتى تنخفض قمة الصدى بمقدار النصف (-6 dB). أما ارتفاع العيب خلال السمك (Δh) فيُقاس بدقة عبر حيود القمة العلوية والسفلية (Tip Diffraction) على شاشة S-Scan.'
                  : 'Length ΔL is measured via -6 dB drop along the weld axis; through-wall height Δh is sized using upper/lower crack tip diffraction cursors on PAUT S-Scan.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold">قواعد القبول والرفض (ASME Sec VIII UW-51 & AWS D1.1):</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr
                  ? 'تُرفض جميع العيوب المستوية (الشروخ، نقص الانصهار، نقص التغلغل) أياً كان طولها أو سعتها. أما العيوب الحجمية كالخبث فتُقبل إذا لم يتجاوز طولها 6 مم (لسمك حتى 19 مم) أو ثلث السمك (1/3 t) للألواح الأسمك.'
                  : 'All planar discontinuities (cracks, LOF, LOP) are strictly rejected. Volumetric inclusions are acceptable if length stays within 6mm or t/3 per ASME UW-51.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
