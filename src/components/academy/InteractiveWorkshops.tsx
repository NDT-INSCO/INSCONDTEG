import React, { useState, useEffect } from 'react';
import { Atom, Camera, Clock, Film, Radio, Wrench } from 'lucide-react';
import { Language } from '../../types';
import { useTheme } from '../../utils/themeStore';
import { NdtVirtualLabWorkbench } from './virtuallab/NdtVirtualLabWorkbench';
import { NdtCameraArOverlayLab } from './virtuallab/NdtCameraArOverlayLab';
import { ArCompleteRtCodeSimulator } from './virtuallab/ArCompleteRtCodeSimulator';
import { SimulationLabsRtTechniquesWorkbench } from './SimulationLabsRtTechniquesWorkbench';
import { GeRadiographicExposureTimeApp } from './virtuallab/GeRadiographicExposureTimeApp';
import { WorkshopTrainingResultsPanel } from './virtuallab/WorkshopTrainingResultsPanel';
import { VirtualLab } from './VirtualLab';
import { DriveSimulatorRunner } from './DriveSimulatorRunner';

export type SimulationLabsSectionId =
  | 'rt_panorama_ellipse_street'
  | 'ar_rt_all_codes'
  | 'ge_exposure_time'
  | 'ar_camera_overlay'
  | 'digital_3d_lab'
  | 'ndt_workbench';

interface InteractiveWorkshopsProps {
  language: Language;
  initialLabSection?: SimulationLabsSectionId;
  onOpenFullRtLab?: () => void;
}

export const InteractiveWorkshops: React.FC<InteractiveWorkshopsProps> = ({
  language,
  initialLabSection = 'rt_panorama_ellipse_street',
  onOpenFullRtLab,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const [activeSection, setActiveSection] = useState<SimulationLabsSectionId>(initialLabSection);

  useEffect(() => {
    setActiveSection(initialLabSection);
  }, [initialLabSection]);

  return (
    <div className="space-y-6" data-testid="academy-simulation-labs-section">
      {/* Simulation Labs Top Switcher Bar */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900/95 border-slate-800 text-slate-100'
        }`}
      >
        <div>
          <div className="text-xs font-mono text-emerald-500">
            {isAr ? 'قسم معامل المحاكاة — أكاديمية إنسكو' : 'INSCO Academy — Simulation Labs'}
          </div>
          <h3 className="text-lg sm:text-xl font-black mt-0.5">
            {isAr
              ? 'معامل المحاكاة الهندسية التفاعلية (Simulation Labs)'
              : 'Interactive Engineering Simulation Labs'}
          </h3>
        </div>

        {/*
          Six labs, each with a long name. As a free-flowing row of single-line
          buttons they grew past the card on a phone and pushed their icons out of
          the page. A bounded grid keeps every cell — and every icon — inside.
        */}
        <div
          data-testid="sim-labs-switcher"
          className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
        >
          <button
            type="button"
            data-testid="switch-ar-rt-all-codes"
            onClick={() => setActiveSection('ar_rt_all_codes')}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold leading-tight transition cursor-pointer sm:text-xs ${
              activeSection === 'ar_rt_all_codes'
                ? 'bg-teal-400 text-slate-950 border-teal-300 font-black shadow-sm'
                : isLight
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-teal-500'
                : 'bg-slate-950 border-slate-800 text-teal-300 hover:border-teal-400'
            }`}
          >
            <Film className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {isAr
                ? 'الواقع المعزز الشامل لتكنيكات وعيوب وأكواد RT'
                : 'Complete AR RT Techniques, Defects & All Codes'}
            </span>
          </button>

          <button
            type="button"
            data-testid="switch-rt-panorama-ellipse-street"
            onClick={() => setActiveSection('rt_panorama_ellipse_street')}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold leading-tight transition cursor-pointer sm:text-xs ${
              activeSection === 'rt_panorama_ellipse_street'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                : isLight
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-emerald-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-400'
            }`}
          >
            <Radio className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {isAr
                ? 'محاكاة (Panorama · Ellipse · Street) والمتغيرات الديناميكية'
                : 'Panorama · Ellipse · Street Dynamic Simulator'}
            </span>
          </button>

          <button
            type="button"
            data-testid="switch-ge-exposure-time"
            onClick={() => setActiveSection('ge_exposure_time')}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold leading-tight transition cursor-pointer sm:text-xs ${
              activeSection === 'ge_exposure_time'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                : isLight
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-amber-300 hover:border-amber-400'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {isAr
                ? 'حاسبة وقت التعريض GE Exposure Time (أفلام Agfa و ASME)'
                : 'GE Radiographic Exposure Time App (Agfa & ASME)'}
            </span>
          </button>

          <button
            type="button"
            data-testid="switch-ar-camera-overlay"
            onClick={() => setActiveSection('ar_camera_overlay')}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold leading-tight transition cursor-pointer sm:text-xs ${
              activeSection === 'ar_camera_overlay'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                : isLight
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-cyan-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-400'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {isAr
                ? 'استخدام الكاميرا وتراكب عناصر NDT الحية'
                : 'Live Camera NDT Overlay (Media API)'}
            </span>
          </button>

          <button
            type="button"
            data-testid="switch-digital-3d-lab"
            onClick={() => setActiveSection('digital_3d_lab')}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold leading-tight transition cursor-pointer sm:text-xs ${
              activeSection === 'digital_3d_lab'
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow-sm'
                : isLight
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-sky-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-400'
            }`}
          >
            <Atom className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {isAr
                ? 'المختبر الرقمي ثلاثي الأبعاد ولوحة المتغيرات (3D Lab)'
                : '3D Digital Lab & Side Settings'}
            </span>
          </button>

          <button
            type="button"
            data-testid="switch-ndt-master-workbench"
            onClick={() => setActiveSection('ndt_workbench')}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold leading-tight transition cursor-pointer sm:text-xs ${
              activeSection === 'ndt_workbench'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                : isLight
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-400'
            }`}
          >
            <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {isAr
                ? 'معامل الورش الشاملة وأجهزة (UT · PAUT · RT · 3D)'
                : 'Master NDT Hardware Labs (UT · PAUT · RT · 3D)'}
            </span>
          </button>
        </div>
      </div>

      {activeSection === 'rt_panorama_ellipse_street' ? (
        <div className="space-y-8">
          <SimulationLabsRtTechniquesWorkbench
            language={language}
            onOpenFullRtLab={onOpenFullRtLab}
          />
          <WorkshopTrainingResultsPanel language={language} />
        </div>
      ) : activeSection === 'ar_rt_all_codes' ? (
        <div className="space-y-8">
          <ArCompleteRtCodeSimulator language={language} />
          <WorkshopTrainingResultsPanel language={language} />
        </div>
      ) : activeSection === 'ar_camera_overlay' ? (
        <div className="space-y-8">
          <NdtCameraArOverlayLab language={language} />
          <WorkshopTrainingResultsPanel language={language} />
        </div>
      ) : activeSection === 'ge_exposure_time' ? (
        <div className="space-y-8">
          <GeRadiographicExposureTimeApp
            language={language}
            onApplyTimeToLab={onOpenFullRtLab}
          />
          <WorkshopTrainingResultsPanel language={language} />
        </div>
      ) : activeSection === 'digital_3d_lab' ? (
        <VirtualLab language={language} />
      ) : (
        <NdtVirtualLabWorkbench language={language} />
      )}

      <DriveSimulatorRunner
        language={language}
        onSelectLabSection={setActiveSection}
        onOpenFullRtLab={onOpenFullRtLab}
      />
    </div>
  );
};