import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Play,
  RotateCcw,
  FastForward,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import {
  RtSourceSpec,
  RtTechniqueSpec,
  RtWeldSpecimen,
  GeometricUnsharpnessResult,
  RadiationSafetyResult,
  AsmeIqiWireSelection,
} from '../../../data/rtSimulationData';

export type ExposureState = 'idle' | 'exposing' | 'source_out_done' | 'retracted_safe';

export interface RtSetupAndExposureStageProps {
  language: Language;
  source: RtSourceSpec;
  technique: RtTechniqueSpec;
  specimen: RtWeldSpecimen;
  sfdMm: number;
  activityCi: number;
  kv: number;
  ma: number;
  targetExposureSeconds: number;
  elapsedExposureSeconds: number;
  exposureState: ExposureState;
  hasCollimator: boolean;
  hasBarricade: boolean;
  hasSurveyMeterOn: boolean;
  hasLeadScreens: boolean;
  hasBackscatterB: boolean;
  iqiPlacement: 'source_side' | 'film_side';
  ugResult: GeometricUnsharpnessResult;
  safetyResult: RadiationSafetyResult;
  iqiSelection: AsmeIqiWireSelection;
  onStartExposure: () => void;
  onInstantFinishExposure: () => void;
  onRetractAndSurvey: () => void;
  onResetExposure: () => void;
  onProceedToDarkroom: () => void;
}

export const RtSetupAndExposureStage: React.FC<RtSetupAndExposureStageProps> = ({
  language,
  source,
  technique,
  specimen,
  sfdMm,
  activityCi,
  kv,
  ma,
  targetExposureSeconds,
  elapsedExposureSeconds,
  exposureState,
  hasCollimator,
  hasBarricade,
  hasSurveyMeterOn,
  hasLeadScreens,
  hasBackscatterB,
  iqiPlacement,
  ugResult,
  safetyResult,
  iqiSelection,
  onStartExposure,
  onInstantFinishExposure,
  onRetractAndSurvey,
  onResetExposure,
  onProceedToDarkroom,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const isGamma = source.category === 'gamma';

  const progressRatio =
    targetExposureSeconds > 0
      ? Math.min(1, elapsedExposureSeconds / targetExposureSeconds)
      : 0;
  const isBeamActive = exposureState === 'exposing' || exposureState === 'source_out_done';

  // Map SFD (250..1000 mm) to visual source Y coordinate in SVG (72..170)
  const clampedSfd = Math.min(1000, Math.max(250, sfdMm));
  const sourceY = 178 - ((clampedSfd - 250) / 750) * 96;
  const weldCenterX = technique.isEllipticalOffset ? 450 : 420;
  const sourceX = technique.isEllipticalOffset ? 375 : 420;
  const specimenTopY = 238;
  const cassetteY = technique.geometryKind === 'pipe' && technique.wallsPenetrated === 2 ? 314 : 272;

  // Live simulated Survey Meter reading (mR/hr at operator console behind barricade)
  const liveSurveyMeterMrHr = (() => {
    if (!hasSurveyMeterOn) return 0;
    if (exposureState === 'idle' || exposureState === 'retracted_safe') {
      return isGamma ? 0.18 : 0.02;
    }
    const baseField = hasBarricade ? 1.4 : 48.5;
    return Number((hasCollimator ? baseField : baseField * 6.5).toFixed(2));
  })();

  const preflightWarnings: string[] = [];
  if (!hasBarricade) {
    preflightWarnings.push(
      isAr
        ? `تحذير أمان إشعاعي: لم يتم نصب الحاجز التحذيري على مسافة ${safetyResult.barricadeRadius2mRhrMeters} متر (حد 2 mR/hr).`
        : `Radiation Safety Warning: 2 mR/hr barricade (${safetyResult.barricadeRadius2mRhrMeters} m) is not erected.`
    );
  }
  if (!hasSurveyMeterOn) {
    preflightWarnings.push(
      isAr
        ? 'تحذير أمان: جهاز المسح الإشعاعي (Survey Meter) مغلق قبل بدء التعريض.'
        : 'Safety Warning: Radiation Survey Meter is turned OFF prior to exposure.'
    );
  }
  if (!ugResult.passesAsmeUg) {
    preflightWarnings.push(
      isAr
        ? `تنبيه هندسي: عدم الوضوح الهندسي Ug = ${ugResult.ugMm} مم يتجاوز حد ASME (${ugResult.maxAllowedUgMm} مم)؛ يُنصح برفع SFD إلى ≥ ${ugResult.minimumRecommendedSfdMm} مم.`
        : `ASME T-274 Alert: Ug (${ugResult.ugMm} mm) exceeds ${ugResult.maxAllowedUgMm} mm limit; increase SFD to ≥ ${ugResult.minimumRecommendedSfdMm} mm.`
    );
  }

  const cardSurface = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${cardSurface}`}>
      {/* Top Status & Live Dosimetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className={`flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums ${mutedText}`}>
            <span>{source.shortCode}</span>
            <span aria-hidden="true">·</span>
            <span>{technique.shortCode}</span>
            <span aria-hidden="true">·</span>
            <span>SFD {sfdMm} mm</span>
            <span aria-hidden="true">·</span>
            <span>Ug {ugResult.ugMm} mm</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold mt-1">
            {isAr
              ? 'مخطط إعداد موقع التصوير وتتبع الحزمة الإشعاعية والأمان'
              : 'Live Field Setup, Beam Geometry & Radiation Safety Workbench'}
          </h3>
        </div>

        {/* Live Survey Meter Readout */}
        <div
          data-testid="rt-survey-meter-readout"
          className={`rounded-xl border px-3.5 py-2 flex items-center gap-3 font-mono text-xs tabular-nums ${
            !hasSurveyMeterOn
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : liveSurveyMeterMrHr > 2.0
                ? 'border-rose-500/60 bg-rose-500/15 text-rose-700 dark:text-rose-200'
                : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <Radio className="w-4 h-4 shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] opacity-80">
              {isAr ? 'قراءة جهاز المسح الإشعاعي (Survey Meter)' : 'Survey Meter @ Operator'}
            </div>
            <div className="font-bold text-sm">
              {!hasSurveyMeterOn
                ? isAr
                  ? 'مغلق (OFF)'
                  : 'METER OFF'
                : `${liveSurveyMeterMrHr} mR/hr · ${
                    liveSurveyMeterMrHr <= 2.0
                      ? isAr
                        ? 'ضمن الحد الآمن'
                        : 'SAFE (< 2 mR/hr)'
                      : isAr
                        ? 'تجاوز حد الحاجز!'
                        : 'HIGH DOSE ALERT!'
                  }`}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Technical SVG Cross-Section Diagram (Zero Inline Styles) */}
      <div className="rounded-xl border border-slate-800 bg-[#070b16] overflow-hidden">
        <svg
          viewBox="0 0 820 365"
          role="img"
          aria-label={
            isAr
              ? 'مخطط إعداد التصوير الإشعاعي بالجاما والأشعة السينية'
              : 'Gamma and X-Ray Radiographic Setup Diagram'
          }
          className="w-full h-auto block select-none"
        >
          <defs>
            <linearGradient id="rtBeamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.52" />
              <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="rtSteelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>

          {/* Subtle Blueprint Grid */}
          <rect x="0" y="0" width="820" height="365" fill="#070b16" />
          {[60, 120, 180, 240, 300].map(gy => (
            <line
              key={`gy-${gy}`}
              x1="0"
              y1={gy}
              x2="820"
              y2={gy}
              stroke="#1e293b"
              strokeWidth="0.7"
              strokeDasharray="3 5"
            />
          ))}

          {/* Safety Barricade Perimeter Posts (Left & Right) */}
          {hasBarricade && (
            <g>
              <line
                x1="54"
                y1="38"
                x2="54"
                y2="336"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <rect x="18" y="42" width="118" height="24" rx="5" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
              <text x="77" y="58" textAnchor="middle" fill="#fde68a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                2 mR/hr @ {safetyResult.barricadeRadius2mRhrMeters}m
              </text>

              <line
                x1="766"
                y1="38"
                x2="766"
                y2="336"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <circle
                cx="766"
                cy="52"
                r="8"
                fill={isBeamActive ? '#ef4444' : '#334155'}
                stroke="#fca5a5"
                strokeWidth="1.2"
              />
              <text x="748" y="56" textAnchor="end" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
                {isBeamActive ? 'STROBE ON' : 'STANDBY'}
              </text>
            </g>
          )}

          {/* GAMMA CAMERA + CRANK CABLE + GUIDE TUBE vs X-RAY TUBE HEAD */}
          {isGamma ? (
            <g>
              {/* Operator Crank-Out Reel on Safe Left Side */}
              <circle cx="95" cy="285" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <line x1="95" y1="285" x2="108" y2="274" stroke="#38bdf8" strokeWidth="2.5" />
              <text x="95" y="318" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                Crank Reel
              </text>

              {/* Teleflex Drive Cable to Shielded Projector */}
              <path
                d="M 113 285 C 145 285, 155 245, 182 245"
                fill="none"
                stroke="#475569"
                strokeWidth="3.5"
              />

              {/* Sentinel 880 Depleted Uranium Projector Camera */}
              <rect
                x="182"
                y="222"
                width="68"
                height="44"
                rx="10"
                fill="#ca8a04"
                stroke="#fef08a"
                strokeWidth="1.6"
              />
              <rect x="196" y="214" width="40" height="8" rx="3" fill="#334155" />
              <text x="216" y="242" textAnchor="middle" fill="#090d16" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                {source.shortCode}
              </text>
              <text x="216" y="255" textAnchor="middle" fill="#090d16" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                {activityCi} Ci
              </text>

              {/* Flexible Guide Tube from Projector up to Exposure Head Position */}
              <path
                d={`M 250 244 C 305 244, 305 ${sourceY}, ${sourceX} ${sourceY}`}
                fill="none"
                stroke="#eab308"
                strokeWidth="4"
              />

              {/* Tungsten 4-HVL Collimator Snout */}
              {hasCollimator && (
                <polygon
                  points={`${sourceX - 18},${sourceY - 10} ${sourceX + 18},${sourceY - 10} ${sourceX + 26},${sourceY + 14} ${sourceX - 26},${sourceY + 14}`}
                  fill="#1e293b"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
              )}

              {/* Source Capsule Position (Inside Shield vs Cranked Out to Snout) */}
              <circle
                cx={isBeamActive ? sourceX : 216}
                cy={isBeamActive ? sourceY + 2 : 244}
                r="6.5"
                fill={isBeamActive ? '#ef4444' : '#22c55e'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          ) : (
            <g>
              {/* X-Ray Control Console on Safe Left Side */}
              <rect x="78" y="248" width="76" height="52" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.6" />
              <text x="116" y="267" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                X-RAY CTRL
              </text>
              <text x="116" y="282" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
                {kv}kV · {ma}mA
              </text>
              <path
                d={`M 154 272 C 235 272, 260 ${sourceY - 8}, ${sourceX - 38} ${sourceY - 8}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
              />

              {/* Industrial X-Ray Tube Housing */}
              <rect
                x={sourceX - 38}
                y={sourceY - 22}
                width="76"
                height="30"
                rx="7"
                fill="#1e293b"
                stroke="#38bdf8"
                strokeWidth="1.8"
              />
              {hasCollimator && (
                <polygon
                  points={`${sourceX - 16},${sourceY + 8} ${sourceX + 16},${sourceY + 8} ${sourceX + 24},${sourceY + 20} ${sourceX - 24},${sourceY + 20}`}
                  fill="#0f172a"
                  stroke="#94a3b8"
                  strokeWidth="1.4"
                />
              )}
              <circle
                cx={sourceX}
                cy={sourceY + 4}
                r="5.5"
                fill={isBeamActive ? '#38bdf8' : '#475569'}
                stroke="#f8fafc"
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* ACTIVE RADIATION CONE & UNSHARPNESS PENUMBRA RAYS */}
          {isBeamActive && (
            <polygon
              points={`${sourceX},${sourceY + 6} ${weldCenterX - 125},${cassetteY + 8} ${weldCenterX + 125},${cassetteY + 8}`}
              fill="url(#rtBeamGrad)"
            />
          )}

          {/* Geometric Unsharpness (Ug) Edge Ray Lines */}
          <line
            x1={sourceX - source.focalSpotMm * 2}
            y1={sourceY + 6}
            x2={weldCenterX - 85}
            y2={cassetteY}
            stroke="#f59e0b"
            strokeWidth="0.9"
            strokeDasharray="4 3"
            opacity="0.7"
          />
          <line
            x1={sourceX + source.focalSpotMm * 2}
            y1={sourceY + 6}
            x2={weldCenterX + 85}
            y2={cassetteY}
            stroke="#f59e0b"
            strokeWidth="0.9"
            strokeDasharray="4 3"
            opacity="0.7"
          />

          {/* SFD Dimension Callout Line */}
          <line x1="600" y1={sourceY + 4} x2="600" y2={cassetteY} stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="593" y1={sourceY + 4} x2="607" y2={sourceY + 4} stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="593" y1={cassetteY} x2="607" y2={cassetteY} stroke="#38bdf8" strokeWidth="1.2" />
          <text x="612" y={(sourceY + cassetteY) / 2 + 4} fill="#7dd3fc" fontSize="10" fontFamily="monospace">
            SFD = {sfdMm} mm
          </text>

          {/* SPECIMEN GEOMETRY: FLAT PLATE vs PIPE CROSS-SECTION */}
          {technique.geometryKind === 'plate' ? (
            <g>
              {/* Left & Right Steel Plates */}
              <rect x={weldCenterX - 115} y={specimenTopY} width="103" height="24" fill="url(#rtSteelGrad)" stroke="#94a3b8" strokeWidth="1" />
              <rect x={weldCenterX + 12} y={specimenTopY} width="103" height="24" fill="url(#rtSteelGrad)" stroke="#94a3b8" strokeWidth="1" />
              {/* V-Groove Weld Crown + Root */}
              <polygon
                points={`${weldCenterX - 14},${specimenTopY - 3} ${weldCenterX + 14},${specimenTopY - 3} ${weldCenterX + 6},${specimenTopY + 26} ${weldCenterX - 6},${specimenTopY + 26}`}
                fill="#94a3b8"
                stroke="#e2e8f0"
                strokeWidth="1.1"
              />
            </g>
          ) : (
            <g>
              {/* Pipe Outer & Inner Ring Cross-Section */}
              <ellipse
                cx={weldCenterX}
                cy="274"
                rx="88"
                ry="36"
                fill="none"
                stroke="#64748b"
                strokeWidth="12"
              />
              {/* Top & Bottom Girth Weld Crowns */}
              <rect x={weldCenterX - 10} y="231" width="20" height="14" rx="4" fill="#cbd5e1" />
              <rect x={weldCenterX - 10} y="303" width="20" height="14" rx="4" fill="#cbd5e1" />
              {technique.id === 'swsi_panoramic' && (
                <text x={weldCenterX} y="278" textAnchor="middle" fill="#fde68a" fontSize="9.5" fontFamily="monospace">
                  360° Internal SWSI
                </text>
              )}
            </g>
          )}

          {/* IQI PENETRAMETER PACK (Source-side or Film-side) */}
          <g>
            <rect
              x={weldCenterX + 34}
              y={iqiPlacement === 'source_side' ? specimenTopY - 6 : cassetteY - 6}
              width="28"
              height="5"
              rx="1.5"
              fill="#38bdf8"
            />
            <text
              x={weldCenterX + 48}
              y={iqiPlacement === 'source_side' ? specimenTopY - 10 : cassetteY - 9}
              textAnchor="middle"
              fill="#7dd3fc"
              fontSize="8.5"
              fontFamily="monospace"
            >
              IQI {iqiSelection.setId} {iqiPlacement === 'film_side' ? '(F)' : ''}
            </text>
          </g>

          {/* FLEXIBLE FILM CASSETTE + LEAD INTENSIFYING SCREENS + BACKSCATTER "B" */}
          <g>
            {hasLeadScreens && (
              <rect
                x={weldCenterX - 122}
                y={cassetteY - 2}
                width="244"
                height="13"
                rx="2"
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
              />
            )}
            <rect
              x={weldCenterX - 120}
              y={cassetteY}
              width="240"
              height="9"
              rx="2"
              fill="#0ea5e9"
              stroke="#bae6fd"
              strokeWidth="1"
            />
            <text
              x={weldCenterX}
              y={cassetteY + 23}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9.5"
              fontFamily="monospace"
            >
              Film Cassette ({specimen.weldTag}) {hasLeadScreens ? '· Pb Screens 0.125/0.25mm' : '· NO Pb Screens'}
            </text>

            {/* Lead Letter "B" on back of cassette */}
            {hasBackscatterB && (
              <g>
                <rect x={weldCenterX - 112} y={cassetteY + 11} width="16" height="14" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                <text x={weldCenterX - 104} y={cassetteY + 21} textAnchor="middle" fill="#fde68a" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                  B
                </text>
              </g>
            )}
          </g>

          {/* Exposure Progress Bar Drawn Directly inside SVG */}
          <g>
            <rect x="210" y="16" width="400" height="14" rx="7" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect
              x="212"
              y="18"
              width={Math.max(0, Math.round(396 * progressRatio))}
              height="10"
              rx="5"
              fill={exposureState === 'retracted_safe' ? '#10b981' : '#f59e0b'}
            />
            <text x="410" y="26.5" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
              {isAr ? 'التعريض:' : 'Exposure:'} {elapsedExposureSeconds}s / {targetExposureSeconds}s ({Math.round(progressRatio * 100)}%)
            </text>
          </g>
        </svg>
      </div>

      {/* Preflight Safety & Code Alerts */}
      {preflightWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-1.5 text-xs">
          {preflightWarnings.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Exposure Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {exposureState === 'idle' && (
            <button
              type="button"
              data-testid="rt-start-exposure-btn"
              onClick={onStartExposure}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>
                {isGamma
                  ? isAr
                    ? 'دفع مصدر الجاما وبدء التصوير (Crank Out)'
                    : 'Crank Out Isotope & Expose'
                  : isAr
                    ? 'تشغيل الجهد العالي وبدء التصوير (X-Ray ON)'
                    : 'Energize X-Ray Tube & Expose'}
              </span>
            </button>
          )}

          {exposureState === 'exposing' && (
            <button
              type="button"
              data-testid="rt-instant-finish-btn"
              onClick={onInstantFinishExposure}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap"
            >
              <FastForward className="w-4 h-4" aria-hidden="true" />
              <span>
                {isAr ? 'إتمام زمن التعريض فوراً' : 'Complete Exposure Timer Instantly'}
              </span>
            </button>
          )}

          {exposureState === 'source_out_done' && (
            <button
              type="button"
              data-testid="rt-retract-survey-btn"
              onClick={onRetractAndSurvey}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>
                {isGamma
                  ? isAr
                    ? 'سحب المصدر للكاميرا وتأكيد الأمان بالمسح الإشعاعي'
                    : 'Retract Source & Confirm Safe Survey (0.18 mR/hr)'
                  : isAr
                    ? 'فصل الجهد العالي وتأكيد انعدام الإشعاع'
                    : 'De-Energize HV & Confirm Zero Radiation'}
              </span>
            </button>
          )}

          {exposureState !== 'idle' && (
            <button
              type="button"
              onClick={onResetExposure}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إعادة لقطة جديدة' : 'Reset Shot'}</span>
            </button>
          )}
        </div>

        {exposureState === 'retracted_safe' && (
          <button
            type="button"
            data-testid="rt-proceed-darkroom-btn"
            onClick={onProceedToDarkroom}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>
              {isAr
                ? 'نقل الكاسيت للغرفة المظلمة والتحميض'
                : 'Transfer Cassette to Darkroom & QC'}
            </span>
            {isAr ? (
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}

        {exposureState === 'source_out_done' && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>
              {isAr
                ? 'يجب سحب المصدر وتأكيد المسح الإشعاعي قبل الاقتراب من العينة!'
                : 'Retract source and verify survey meter before approaching weld!'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
