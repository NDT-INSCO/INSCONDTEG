import React, { useMemo } from 'react';
import {
  Sliders,
  Activity,
  Compass,
  Magnet,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Box,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';

export interface DigitalLabSideSettingsPanelProps {
  language: Language;
  activeBlockType: 'iiw_v1' | 'step_wedge' | 'angle_weld' | 'mt_yoke';
  // UT Technical Variables
  transducerFreqMHz: number;
  onChangeFreqMHz: (freq: number) => void;
  refractionAngleDeg: number;
  onChangeRefractionAngleDeg: (deg: number) => void;
  crystalDiameterMm: number;
  onChangeCrystalDiameterMm: (mm: number) => void;
  plateThicknessMm: number;
  onChangePlateThicknessMm: (mm: number) => void;
  probeStandoffMm: number;
  onChangeProbeStandoffMm: (mm: number) => void;
  // MT Technical Variables
  magneticFieldKaM: number;
  onChangeMagneticFieldKaM: (kaM: number) => void;
  yokePoleSpacingMm: number;
  onChangeYokePoleSpacingMm: (mm: number) => void;
  mtCurrentMode: 'AC' | 'HWDC';
  onChangeMtCurrentMode: (mode: 'AC' | 'HWDC') => void;
  crackAngleDeg: number;
  onChangeCrackAngleDeg: (deg: number) => void;
  // 3D Scene Display Toggles
  xraySpecimenMode: boolean;
  onToggleXraySpecimen: () => void;
  showDefectWireframes: boolean;
  onToggleDefectWireframes: () => void;
  onResetDefaults: () => void;
}

export const DigitalLabSideSettingsPanel: React.FC<DigitalLabSideSettingsPanelProps> = ({
  language,
  activeBlockType,
  transducerFreqMHz,
  onChangeFreqMHz,
  refractionAngleDeg,
  onChangeRefractionAngleDeg,
  crystalDiameterMm,
  onChangeCrystalDiameterMm,
  plateThicknessMm,
  onChangePlateThicknessMm,
  probeStandoffMm,
  onChangeProbeStandoffMm,
  magneticFieldKaM,
  onChangeMagneticFieldKaM,
  yokePoleSpacingMm,
  onChangeYokePoleSpacingMm,
  mtCurrentMode,
  onChangeMtCurrentMode,
  crackAngleDeg,
  onChangeCrackAngleDeg,
  xraySpecimenMode,
  onToggleXraySpecimen,
  showDefectWireframes,
  onToggleDefectWireframes,
  onResetDefaults,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  // Live Derived Acoustic & Magnetic Physics for Immediate Feedback
  const derivedMetrics = useMemo(() => {
    const waveVelMs = refractionAngleDeg === 0 ? 5920 : 3240;
    const wavelengthMm = Number((waveVelMs / (transducerFreqMHz * 1000)).toFixed(2));
    const nearFieldMm = Number(
      ((crystalDiameterMm * crystalDiameterMm * transducerFreqMHz) / (4 * (waveVelMs / 1000))).toFixed(1)
    );
    const sinSpread = Math.min(0.95, (0.514 * wavelengthMm) / crystalDiameterMm);
    const beamSpread6dBDeg = Number(((Math.asin(sinSpread) * 180) / Math.PI * 2).toFixed(1));

    const rad = (refractionAngleDeg * Math.PI) / 180;
    const halfSkipMm =
      refractionAngleDeg === 0 ? 0 : Number((plateThicknessMm * Math.tan(rad)).toFixed(1));
    const fullSkipMm = Number((halfSkipMm * 2).toFixed(1));

    const gaussEquivalent = Math.round(magneticFieldKaM * 12.56);
    const fieldInAsmeWindow = magneticFieldKaM >= 2.4 && magneticFieldKaM <= 4.8;
    const fieldStatus =
      magneticFieldKaM < 2.4
        ? 'LOW'
        : magneticFieldKaM <= 4.8
        ? 'OPTIMAL'
        : 'EXCESS';

    return {
      wavelengthMm,
      nearFieldMm,
      beamSpread6dBDeg,
      halfSkipMm,
      fullSkipMm,
      gaussEquivalent,
      fieldInAsmeWindow,
      fieldStatus,
    };
  }, [
    transducerFreqMHz,
    refractionAngleDeg,
    crystalDiameterMm,
    plateThicknessMm,
    magneticFieldKaM,
  ]);

  const panelBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#0b1028] border-[#1e2756] text-slate-100';
  const groupBg = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-[#070a1a] border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <aside
      data-testid="digital-lab-side-settings-panel"
      aria-label={
        isAr
          ? 'لوحة الإعدادات الجانبية للمتغيرات التقنية والمشاهد ثلاثية الأبعاد'
          : 'Digital Lab Technical Variables & 3D Scene Side Settings Panel'
      }
      className={`rounded-3xl border p-5 space-y-5 shadow-xl tabular-nums ${panelBg}`}
    >
      {/* Header & Instant Reset */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-700/30">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAr ? 'لوحة الإعدادات الجانبية · تحديث 3D فوري' : 'Side Settings · Real-Time 3D Sync'}
            </span>
          </div>
          <h3 className="text-base font-black mt-1">
            {isAr
              ? 'ضبط المتغيرات التقنية للمختبر الرقمي'
              : 'Digital Lab Technical Variables'}
          </h3>
        </div>

        <button
          type="button"
          data-testid="side-panel-reset-btn"
          onClick={onResetDefaults}
          className="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:border-cyan-400 text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isAr ? 'افتراضي' : 'Reset'}</span>
        </button>
      </div>

      {/* SECTION 1: ULTRASONIC TRANSDUCER FREQUENCY (f) */}
      <div className={`rounded-2xl border p-4 space-y-3 ${groupBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-sky-400">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? '01. تردد المجس الصوتي (Frequency f)' : '01. Transducer Frequency (f)'}</span>
          </div>
          <span
            data-testid="side-panel-freq-value"
            className="text-xs font-mono font-black text-sky-300"
          >
            {transducerFreqMHz.toFixed(2)} MHz
          </span>
        </div>

        <input
          type="range"
          data-testid="side-panel-freq-slider"
          aria-label={isAr ? 'التردد بالميجاهرتز' : 'Transducer Frequency MHz'}
          min={1.0}
          max={10.0}
          step={0.25}
          value={transducerFreqMHz}
          onChange={(e) => onChangeFreqMHz(Number(e.target.value))}
          className="w-full accent-sky-500 cursor-pointer"
        />

        {/* Standard Piezo Frequency Presets */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1.0, 2.25, 4.0, 5.0, 10.0].map((fVal) => (
            <button
              key={fVal}
              type="button"
              onClick={() => onChangeFreqMHz(fVal)}
              className={`py-1 rounded-lg border text-[11px] font-mono font-bold transition cursor-pointer ${
                Math.abs(transducerFreqMHz - fVal) < 0.05
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-black'
                  : 'border-slate-700/70 text-slate-400 hover:text-white hover:border-sky-400'
              }`}
            >
              {fVal}M
            </button>
          ))}
        </div>

        {/*Crystal Diameter D */}
        <div className="pt-1">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className={mutedText}>
              {isAr ? 'قطر البلورة الكهروضغطية (ØD)' : 'Crystal Diameter (ØD)'}
            </span>
            <span className="font-mono text-sky-300">{crystalDiameterMm} mm</span>
          </div>
          <input
            type="range"
            aria-label={isAr ? 'قطر البلورة بالمليمتر' : 'Crystal Diameter mm'}
            min={6}
            max={24}
            step={1}
            value={crystalDiameterMm}
            onChange={(e) => onChangeCrystalDiameterMm(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Live Acoustic Readout Strip */}
        <div className={`pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono ${mutedText}`}>
          <span>λ = {derivedMetrics.wavelengthMm} mm</span>
          <span aria-hidden="true">·</span>
          <span>N = {derivedMetrics.nearFieldMm} mm</span>
          <span aria-hidden="true">·</span>
          <span>-6dB = {derivedMetrics.beamSpread6dBDeg}°</span>
        </div>
      </div>

      {/* SECTION 2: REFRACTION ANGLE (θ) & SPECIMEN GEOMETRY */}
      <div className={`rounded-2xl border p-4 space-y-3 ${groupBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400">
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAr ? '02. زاوية الانكسار (Refraction Angle θ)' : '02. Refraction Angle (θ)'}
            </span>
          </div>
          <span
            data-testid="side-panel-angle-value"
            className="text-xs font-mono font-black text-cyan-300"
          >
            {refractionAngleDeg}°
          </span>
        </div>

        <input
          type="range"
          data-testid="side-panel-angle-slider"
          aria-label={isAr ? 'زاوية الانكسار بالدرجات' : 'Refraction Angle Degrees'}
          min={0}
          max={75}
          step={1}
          value={refractionAngleDeg}
          onChange={(e) => onChangeRefractionAngleDeg(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer"
        />

        <div className="grid grid-cols-4 gap-1.5">
          {[0, 45, 60, 70].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => onChangeRefractionAngleDeg(deg)}
              className={`py-1 rounded-lg border text-xs font-mono font-bold transition cursor-pointer ${
                refractionAngleDeg === deg
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                  : 'border-slate-700/70 text-slate-400 hover:text-white hover:border-cyan-400'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>

        {/* Specimen Plate Thickness & Standoff */}
        <div className="pt-1 space-y-2.5">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className={mutedText}>
                {isAr ? 'سُمك العينة ثلاثية الأبعاد (Thickness t)' : '3D Specimen Thickness (t)'}
              </span>
              <span className="font-mono text-cyan-300">{plateThicknessMm} mm</span>
            </div>
            <input
              type="range"
              aria-label={isAr ? 'سُمك العينة بالمليمتر' : '3D Specimen Thickness mm'}
              min={10}
              max={36}
              step={1}
              value={plateThicknessMm}
              onChange={(e) => onChangePlateThicknessMm(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {activeBlockType === 'angle_weld' && (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className={mutedText}>
                  {isAr ? 'إزاحة المجس عن اللحام (Standoff X)' : 'Probe Standoff (X)'}
                </span>
                <span className="font-mono text-cyan-300">{probeStandoffMm} mm</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'إزاحة المجس على العينة' : '3D Probe Standoff mm'}
                min={16}
                max={75}
                step={1}
                value={probeStandoffMm}
                onChange={(e) => onChangeProbeStandoffMm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className={`pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono ${mutedText}`}>
          <span>½ Skip = {derivedMetrics.halfSkipMm} mm</span>
          <span aria-hidden="true">·</span>
          <span>1 Skip = {derivedMetrics.fullSkipMm} mm</span>
        </div>
      </div>

      {/* SECTION 3: MAGNETIC FIELD STRENGTH (H) & YOKE FLUX PARAMETERS */}
      <div className={`rounded-2xl border p-4 space-y-3 ${groupBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
            <Magnet className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAr
                ? '03. قوة المجال المغناطيسي (Field Strength H)'
                : '03. MT Field Strength (H)'}
            </span>
          </div>
          <span
            data-testid="side-panel-mag-value"
            className="text-xs font-mono font-black text-amber-300"
          >
            {magneticFieldKaM.toFixed(1)} kA/m
          </span>
        </div>

        <input
          type="range"
          data-testid="side-panel-mag-slider"
          aria-label={isAr ? 'قوة المجال المغناطيسي بالكيلو أمبير لكل متر' : 'Magnetic Field Strength kA/m'}
          min={0}
          max={6.5}
          step={0.2}
          value={magneticFieldKaM}
          onChange={(e) => onChangeMagneticFieldKaM(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />

        {/* AC vs HWDC Excitation Mode */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeMtCurrentMode('AC')}
            className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              mtCurrentMode === 'AC'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'border-slate-700/70 text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'تيار متردد AC (سطحي)' : 'AC (Surface Flux)'}
          </button>
          <button
            type="button"
            onClick={() => onChangeMtCurrentMode('HWDC')}
            className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              mtCurrentMode === 'HWDC'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'border-slate-700/70 text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'نبضي HWDC (تحت سطحي)' : 'HWDC (Subsurface)'}
          </button>
        </div>

        {/* Yoke Pole Spacing & Crack Orientation */}
        <div className="space-y-2.5 pt-1">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className={mutedText}>
                {isAr ? 'تباعد قطبي الشوكة (Pole Spacing)' : 'Yoke Pole Spacing'}
              </span>
              <span className="font-mono text-amber-300">{yokePoleSpacingMm} mm</span>
            </div>
            <input
              type="range"
              aria-label={isAr ? 'تباعد قطبي الشوكة المغناطيسية' : 'Yoke Pole Spacing mm'}
              min={75}
              max={200}
              step={5}
              value={yokePoleSpacingMm}
              onChange={(e) => onChangeYokePoleSpacingMm(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className={mutedText}>
                {isAr ? 'زاوية تقاطع الشرخ مع الفيض' : 'Crack-to-Flux Angle'}
              </span>
              <span className="font-mono text-amber-300">{crackAngleDeg}°</span>
            </div>
            <input
              type="range"
              aria-label={isAr ? 'زاوية تقاطع الشرخ مع الفيض' : 'Crack-to-Flux Angle deg'}
              min={0}
              max={90}
              step={5}
              value={crackAngleDeg}
              onChange={(e) => onChangeCrackAngleDeg(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Explicit Non-Hue-Only ASME T-764 Field Status */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <span className={mutedText}>B ≈ {derivedMetrics.gaussEquivalent} Gauss</span>
          {derivedMetrics.fieldStatus === 'OPTIMAL' ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'ضمن نطاق ASME (2.4–4.8)' : 'ASME T-764 Optimal'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {derivedMetrics.fieldStatus === 'LOW'
                  ? isAr
                    ? 'مجال ضعيف (< 2.4 kA/m)'
                    : 'Weak Field (< 2.4 kA/m)'
                  : isAr
                  ? 'تشبع مفرط (> 4.8 kA/m)'
                  : 'Excess Saturation (> 4.8)'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* SECTION 4: 3D VIEWPORT VISUALIZATION LAYERS */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onToggleXraySpecimen}
          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            xraySpecimenMode
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'border-slate-700/70 text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'شفافية العينة 3D' : '3D X-Ray'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleDefectWireframes}
          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            showDefectWireframes
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'border-slate-700/70 text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'إسقاط العيوب 3D' : '3D Wireframes'}</span>
        </button>
      </div>
    </aside>
  );
};
