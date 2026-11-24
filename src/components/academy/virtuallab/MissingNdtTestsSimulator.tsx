import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  Compass,
  Droplets,
  Flame,
  Gauge,
  Layers,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  MISSING_NDT_CODE_SCENARIOS,
  MISSING_NDT_METHODS,
  MissingNdtCodeScenario,
  MissingNdtEvaluationResult,
  MissingNdtMethodId,
  evaluateMissingNdtMethod,
} from '../../../data/missingNdtTestsEngine';

export interface MissingNdtTestsSimulatorProps {
  language: Language;
  initialMethodId?: MissingNdtMethodId;
  initialScenarioId?: string;
}

function getMethodIcon(methodId: MissingNdtMethodId) {
  switch (methodId) {
    case 'et_rft':
      return <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'lt_hydro':
      return <Droplets className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'tofd':
      return <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'mfl_api_ffs':
      return <Gauge className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'coating_holiday':
      return <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'pmi_hardness':
      return <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
}

function getDefaultParams(methodId: MissingNdtMethodId): Record<string, number> {
  const meta = MISSING_NDT_METHODS.find((m) => m.id === methodId) ?? MISSING_NDT_METHODS[0];
  const map: Record<string, number> = {};
  for (const p of meta.params) {
    map[p.key] = p.defaultValue;
  }
  return map;
}

const MissingNdtVisualizer: React.FC<{
  methodId: MissingNdtMethodId;
  evaluation: MissingNdtEvaluationResult;
  isAr: boolean;
}> = ({ methodId, evaluation, isAr }) => {
  const v = evaluation.visualData;

  if (methodId === 'et_rft') {
    const phaseDeg = Number(v.phaseDeg ?? 110);
    const ampV = Number(v.amplitudeV ?? 2.4);
    const skinDepthMm = Number(v.skinDepthMm ?? 1.2);
    const wallLossPct = Number(v.wallLossPct ?? 18);
    const isOd = Boolean(v.isOd);

    const cx = 160;
    const cy = 118;
    const rad = ((phaseDeg - 90) * Math.PI) / 180;
    const reach = Math.min(82, 18 + ampV * 7.5);
    const dx = Math.cos(rad) * reach;
    const dy = -Math.sin(rad) * reach;

    const wallRatio = Math.min(1, skinDepthMm / 1.65);

    return (
      <svg
        viewBox="0 0 560 236"
        data-testid="missing-ndt-svg-et_rft"
        className="w-full h-auto rounded-xl bg-[#050a18] border border-slate-800"
        role="img"
        aria-label={isAr ? 'مخطط ليساجو للتيارات الدوامية' : 'Eddy Current Lissajous Impedance Plane'}
      >
        {/* Lissajous Grid */}
        <rect x="16" y="14" width="288" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <line x1="160" y1="22" x2="160" y2="214" stroke="#1e293b" strokeDasharray="3 3" />
        <line x1="26" y1="118" x2="294" y2="118" stroke="#1e293b" strokeDasharray="3 3" />
        <circle cx={cx} cy={cy} r="44" fill="none" stroke="#0f172a" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="78" fill="none" stroke="#0f172a" strokeWidth="1" />

        {/* Reference ASME Calibration Phase Zones */}
        <line x1={cx} y1={cy} x2={cx + 58} y2={cy - 44} stroke="#38bdf8" strokeOpacity="0.35" strokeDasharray="4 3" />
        <text x={cx + 62} y={cy - 46} fill="#38bdf8" fontSize="9" fontFamily="monospace">
          ID 40°
        </text>
        <line x1={cx} y1={cy} x2={cx - 56} y2={cy - 42} stroke="#fbbf24" strokeOpacity="0.35" strokeDasharray="4 3" />
        <text x={cx - 94} y={cy - 44} fill="#fbbf24" fontSize="9" fontFamily="monospace">
          OD 125°
        </text>

        {/* Figure-8 Differential Lissajous Vector Loop */}
        <path
          d={`M ${cx} ${cy} Q ${cx + dx * 0.65 - dy * 0.25} ${cy + dy * 0.65 + dx * 0.25} ${cx + dx} ${cy + dy} T ${cx} ${cy} Q ${cx - dx * 0.55 + dy * 0.22} ${cy - dy * 0.55 - dx * 0.22} ${cx - dx * 0.85} ${cy - dy * 0.85} T ${cx} ${cy}`}
          fill="none"
          stroke={wallLossPct >= 40 ? '#fb7185' : isOd ? '#fbbf24' : '#22d3ee'}
          strokeWidth="2.6"
        />
        <circle
          cx={cx + dx}
          cy={cy + dy}
          r="4"
          fill={wallLossPct >= 40 ? '#fb7185' : '#22d3ee'}
        />
        <text x="26" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          XY IMPEDANCE PLANE · θ={phaseDeg}° · Vpp={ampV.toFixed(1)}V
        </text>

        {/* Right Panel: Skin Depth Tube Wall Cross Section */}
        <rect x="320" y="14" width="224" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="334" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          TUBE WALL PENETRATION (1.65mm)
        </text>
        <rect x="342" y="54" width="180" height="72" rx="4" fill="#0f172a" stroke="#334155" />
        {/* Skin depth shaded penetration from ID bottom upward */}
        <rect
          x="342"
          y={54 + 72 * (1 - wallRatio)}
          width="180"
          height={72 * wallRatio}
          fill="#06b6d4"
          fillOpacity="0.22"
        />
        {/* Defect Pit */}
        {isOd ? (
          <path
            d={`M 420 54 L 444 54 L 432 ${54 + Math.min(68, (wallLossPct / 100) * 72)} Z`}
            fill="#fb7185"
          />
        ) : (
          <path
            d={`M 420 126 L 444 126 L 432 ${126 - Math.min(68, (wallLossPct / 100) * 72)} Z`}
            fill="#fb7185"
          />
        )}
        <text x="342" y="148" fill="#38bdf8" fontSize="10" fontFamily="monospace">
          δ = {skinDepthMm.toFixed(2)} mm ({Math.round(wallRatio * 100)}% wall)
        </text>
        <text
          x="342"
          y="168"
          fill={wallLossPct >= 40 ? '#fb7185' : '#34d399'}
          fontSize="10"
          fontFamily="monospace"
        >
          Loss: {wallLossPct}% {isOd ? 'OD' : 'ID'} · TEMA Limit: 40%
        </text>
        <text x="342" y="192" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
          Fill Factor: {String(v.fillFactorPct ?? 84)}% · f = {String(v.frequencyKhz ?? 120)} kHz
        </text>
      </svg>
    );
  }

  if (methodId === 'lt_hydro') {
    const ratio = Number(v.appliedRatioPct ?? 150);
    const drop = Number(v.dropPctHr ?? 0.2);
    const vacuumKpa = Number(v.vacuumKpa ?? 28);
    const testBar = Number(v.testPressureBar ?? 60);

    const chartPeakY = Math.max(36, 178 - (ratio / 180) * 135);
    const chartEndY = Math.min(188, chartPeakY + drop * 18);
    const ug99Y = 178 - (130 / 180) * 135;
    const b313Y = 178 - (150 / 180) * 135;
    const vacPct = Math.min(1, Math.max(0, vacuumKpa / 45));

    return (
      <svg
        viewBox="0 0 560 236"
        data-testid="missing-ndt-svg-lt_hydro"
        className="w-full h-auto rounded-xl bg-[#050a18] border border-slate-800"
        role="img"
        aria-label={isAr ? 'مخطط مسجل الضغط الهيدروستاتيكي وصندوق التفريغ' : 'Hydrostatic Strip Chart & Vacuum Box Gauge'}
      >
        {/* Left: Pressure-Time Strip Chart */}
        <rect x="16" y="14" width="320" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="28" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          PRESSURE-TIME CHART · {testBar} bar ({ratio}% MAWP)
        </text>
        <line x1="34" y1={ug99Y} x2="322" y2={ug99Y} stroke="#fbbf24" strokeOpacity="0.45" strokeDasharray="4 3" />
        <text x="242" y={ug99Y - 4} fill="#fbbf24" fontSize="8.5" fontFamily="monospace">
          UG-99 130%
        </text>
        <line x1="34" y1={b313Y} x2="322" y2={b313Y} stroke="#34d399" strokeOpacity="0.45" strokeDasharray="4 3" />
        <text x="242" y={b313Y - 4} fill="#34d399" fontSize="8.5" fontFamily="monospace">
          B31.3 150%
        </text>
        <polyline
          fill="none"
          stroke={drop > 0.3 || ratio < 130 ? '#fb7185' : '#22d3ee'}
          strokeWidth="3"
          points={`36,184 92,110 135,${chartPeakY} 280,${chartEndY} 316,184`}
        />
        <text x="36" y="205" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
          Ramp → Hold Decay: {drop.toFixed(1)}%/hr → Depressurize
        </text>

        {/* Right: Vacuum Box Differential Gauge */}
        <rect x="350" y="14" width="194" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="364" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          VACUUM BOX ΔP
        </text>
        {/* Gauge Bar */}
        <rect x="372" y="68" width="150" height="22" rx="6" fill="#0f172a" stroke="#334155" />
        {/* Target green window 20-35 kPa */}
        <rect
          x={372 + (20 / 45) * 150}
          y="64"
          width={((35 - 20) / 45) * 150}
          height="30"
          fill="#10b981"
          fillOpacity="0.18"
          stroke="#10b981"
          strokeOpacity="0.45"
        />
        <rect
          x="372"
          y="68"
          width={150 * vacPct}
          height="22"
          rx="6"
          fill={vacuumKpa < 20 ? '#fb7185' : '#22d3ee'}
          fillOpacity="0.85"
        />
        <text x="372" y="122" fill="#e2e8f0" fontSize="13" fontWeight="bold" fontFamily="monospace">
          {vacuumKpa} kPa ({(vacuumKpa * 0.145).toFixed(1)} psi)
        </text>
        <text
          x="372"
          y="148"
          fill={drop > 0.4 ? '#fb7185' : '#34d399'}
          fontSize="10"
          fontFamily="monospace"
        >
          {drop > 0.4 ? 'SOAP BUBBLES DETECTED' : 'ZERO BUBBLE SEAL PASS'}
        </text>
        <text x="372" y="182" fill="#64748b" fontSize="9" fontFamily="monospace">
          ASME Art.10 / API 653 ≥20 kPa
        </text>
      </svg>
    );
  }

  if (methodId === 'tofd') {
    const T = Number(v.thicknessMm ?? 30);
    const pcs = Number(v.pcsMm ?? 64);
    const d1 = Number(v.d1 ?? 11);
    const d2 = Number(v.d2 ?? 13.5);
    const deadZone = Number(v.deadZoneMm ?? 2.8);
    const isSurf = Boolean(v.isSurfaceBreaking);

    const wallH = 148;
    const y0 = 44;
    const tip1Y = y0 + (d1 / T) * wallH;
    const tip2Y = y0 + (d2 / T) * wallH;
    const dzH = Math.min(wallH * 0.4, (deadZone / T) * wallH);

    return (
      <svg
        viewBox="0 0 560 236"
        data-testid="missing-ndt-svg-tofd"
        className="w-full h-auto rounded-xl bg-[#050a18] border border-slate-800"
        role="img"
        aria-label={isAr ? 'مقطع الحيد TOFD ومسح B-Scan' : 'TOFD Ray Geometry & B-Scan Waterfall'}
      >
        {/* Left: Tx/Rx Cross Section */}
        <rect x="16" y="14" width="276" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="28" y="31" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          TOFD GEOMETRY · T={T}mm · PCS={pcs}mm
        </text>
        <rect x="44" y={y0} width="220" height={wallH} fill="#0f172a" stroke="#334155" />
        {/* Dead zone band */}
        <rect x="44" y={y0} width="220" height={dzH} fill="#fbbf24" fillOpacity="0.14" />
        {/* Probes */}
        <rect x="64" y={y0 - 11} width="26" height="11" rx="2" fill="#22d3ee" />
        <rect x="218" y={y0 - 11} width="26" height="11" rx="2" fill="#22d3ee" />
        <text x="72" y={y0 - 3} fill="#020617" fontSize="8" fontWeight="bold" fontFamily="monospace">
          Tx
        </text>
        <text x="226" y={y0 - 3} fill="#020617" fontSize="8" fontWeight="bold" fontFamily="monospace">
          Rx
        </text>

        {/* Lateral wave */}
        <line
          x1="77"
          y1={y0 + 1}
          x2="231"
          y2={y0 + 1}
          stroke={isSurf ? '#fb7185' : '#38bdf8'}
          strokeWidth="2"
          strokeDasharray={isSurf ? '4 4' : undefined}
        />
        {/* Tip diffraction rays */}
        <polyline
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1.5"
          points={`77,${y0} 154,${tip1Y} 231,${y0}`}
        />
        <polyline
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.5"
          points={`77,${y0} 154,${tip2Y} 231,${y0}`}
        />
        {/* Crack segment */}
        <line
          x1="154"
          y1={tip1Y}
          x2="154"
          y2={tip2Y}
          stroke="#fb7185"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <text x="44" y="210" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
          d₁={d1.toFixed(1)}mm · d₂={d2.toFixed(1)}mm · DeadZone={deadZone}mm
        </text>

        {/* Right: B-Scan Grayscale Waterfall */}
        <rect x="306" y="14" width="238" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="318" y="31" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          ENCODED B-SCAN (180° PHASE SHIFT)
        </text>
        <rect x="322" y={y0} width="206" height={wallH} fill="#334155" fillOpacity="0.45" />
        {/* Lateral Wave */}
        <line
          x1="322"
          y1={y0 + 8}
          x2="528"
          y2={y0 + 8}
          stroke="#f8fafc"
          strokeWidth="3"
          strokeDasharray={isSurf ? '6 16' : undefined}
        />
        {/* Upper & lower hyperbolic tip arcs */}
        <path
          d={`M 365 ${tip1Y + 8} Q 425 ${tip1Y - 8} 485 ${tip1Y + 8}`}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
        />
        <path
          d={`M 365 ${tip2Y + 8} Q 425 ${tip2Y - 8} 485 ${tip2Y + 8}`}
          fill="none"
          stroke="#020617"
          strokeWidth="3.5"
        />
        <path
          d={`M 365 ${tip2Y + 11} Q 425 ${tip2Y - 5} 485 ${tip2Y + 11}`}
          fill="none"
          stroke="#f8fafc"
          strokeWidth="2"
        />
        {/* Backwall echo */}
        <line x1="322" y1={y0 + wallH - 6} x2="528" y2={y0 + wallH - 6} stroke="#020617" strokeWidth="4" />
        <text x="322" y="210" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
          t_LW={String(v.tLwUs)}µs · Δt={(Number(v.t2Us) - Number(v.t1Us)).toFixed(2)}µs
        </text>
      </svg>
    );
  }

  if (methodId === 'mfl_api_ffs') {
    const tMin = Number(v.tMin ?? 6.5);
    const tActual = Number(v.tActual ?? 8.6);
    const rl = Number(v.remainingLifeYr ?? 8.4);
    const loss = Number(v.mflLossPct ?? 25);
    const rsf = Number(v.rsf ?? 0.94);

    // Build 8x4 MFL plate scan grid
    const cells: Array<{ x: number; y: number; val: number }> = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        const dist = Math.hypot(c - 4.5, r - 1.5);
        const val = Math.max(5, Math.round(loss * Math.exp(-dist * 0.55)));
        cells.push({ x: 30 + c * 30, y: 52 + r * 30, val });
      }
    }

    const maxScaleT = Math.max(tMin * 1.6, tActual * 1.2, 12);
    const tMinY = 178 - (tMin / maxScaleT) * 124;
    const tActY = 178 - (tActual / maxScaleT) * 124;

    return (
      <svg
        viewBox="0 0 560 236"
        data-testid="missing-ndt-svg-mfl_api_ffs"
        className="w-full h-auto rounded-xl bg-[#050a18] border border-slate-800"
        role="img"
        aria-label={isAr ? 'خريطة الماسح المغناطيسي MFL ومنحنى العمر المتبقي' : 'MFL Floor C-Scan & Remaining Life Curve'}
      >
        <rect x="16" y="14" width="268" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="28" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          MFL FLOOR C-SCAN · PEAK {loss}%
        </text>
        {cells.map((cell, idx) => {
          const fill =
            cell.val >= 60 ? '#e11d48' : cell.val >= 35 ? '#f59e0b' : cell.val >= 20 ? '#0284c7' : '#0f766e';
          return (
            <rect
              key={idx}
              x={cell.x}
              y={cell.y}
              width="27"
              height="27"
              rx="3"
              fill={fill}
              fillOpacity={0.25 + (cell.val / 100) * 0.7}
              stroke="#0f172a"
            />
          );
        })}
        <text x="28" y="200" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
          API 579 RSF = {rsf.toFixed(2)} (Min 0.90)
        </text>

        {/* Right: Thickness Depletion Curve */}
        <rect x="298" y="14" width="246" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="310" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          REMAINING LIFE (API 510/570)
        </text>
        <line x1="316" y1={tMinY} x2="528" y2={tMinY} stroke="#fb7185" strokeDasharray="4 3" />
        <text x="458" y={tMinY - 4} fill="#fb7185" fontSize="8.5" fontFamily="monospace">
          t_min {tMin}mm
        </text>
        <line
          x1="316"
          y1={tActY}
          x2={tActual <= tMin ? 330 : 495}
          y2={tMinY}
          stroke={tActual < tMin ? '#fb7185' : '#22d3ee'}
          strokeWidth="2.8"
        />
        <circle cx="316" cy={tActY} r="4.5" fill="#22d3ee" />
        <text x="314" y="200" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
          t_act={tActual.toFixed(1)}mm · RL={rl} yr
        </text>
      </svg>
    );
  }

  if (methodId === 'coating_holiday') {
    const steelT = Number(v.steelTempC ?? 26);
    const dewT = Number(v.dewPointC ?? 17.5);
    const deltaT = Number(v.deltaT ?? 8.5);
    const dft = Number(v.dftUm ?? 260);
    const volt = Number(v.holidayVoltageV ?? 4031);
    const coatH = Math.min(72, Math.max(18, (dft / 500) * 72));

    return (
      <svg
        viewBox="0 0 560 236"
        data-testid="missing-ndt-svg-coating_holiday"
        className="w-full h-auto rounded-xl bg-[#050a18] border border-slate-800"
        role="img"
        aria-label={isAr ? 'مقطع فحص الطلاء الجاف ونقطة الندى واختبار الهوليداي' : 'Coating Cross-Section, Dew Point & Holiday Spark Test'}
      >
        <rect x="16" y="14" width="290" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="28" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          SSPC-PA 2 DFT & NACE HOLIDAY SPARK
        </text>
        {/* Steel substrate with blast peaks */}
        <path
          d="M 32 146 L 48 139 L 64 146 L 80 139 L 96 146 L 112 139 L 128 146 L 144 139 L 160 146 L 176 139 L 192 146 L 208 139 L 224 146 L 240 139 L 256 146 L 272 139 L 288 146 L 288 186 L 32 186 Z"
          fill="#475569"
        />
        {/* Coating layer */}
        <rect
          x="32"
          y={142 - coatH}
          width="256"
          height={coatH}
          fill="#0ea5e9"
          fillOpacity="0.65"
          stroke="#38bdf8"
        />
        {/* Brass Holiday Wand */}
        <line x1="152" y1="54" x2="178" y2={140 - coatH} stroke="#fbbf24" strokeWidth="4" />
        <text x="32" y="206" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
          DFT={dft}µm · Spark={volt}V DC · Sa 2½
        </text>

        {/* Right: Psychrometric Dew Spread */}
        <rect x="320" y="14" width="224" height="208" rx="10" fill="#071124" stroke="#1e293b" />
        <text x="332" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
          DEW POINT MARGIN (ΔT ≥ 3°C)
        </text>
        <text x="336" y="76" fill="#38bdf8" fontSize="11" fontFamily="monospace">
          Steel Temp: {steelT.toFixed(1)}°C
        </text>
        <text x="336" y="98" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
          Dew Point : {dewT.toFixed(1)}°C
        </text>
        <rect x="336" y="116" width="190" height="20" rx="5" fill="#0f172a" stroke="#334155" />
        <rect
          x="336"
          y="116"
          width={Math.min(190, Math.max(8, (deltaT / 15) * 190))}
          height="20"
          rx="5"
          fill={deltaT < 3 ? '#fb7185' : '#10b981'}
        />
        <text
          x="336"
          y="162"
          fill={deltaT < 3 ? '#fb7185' : '#34d399'}
          fontSize="12"
          fontWeight="bold"
          fontFamily="monospace"
        >
          ΔT = {deltaT.toFixed(1)}°C {deltaT < 3 ? '— CONDENSATION!' : '— DRY PASS'}
        </text>
        <text x="336" y="190" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
          RH={String(v.rh)}% · Bresle={String(v.saltMgM2)} mg/m²
        </text>
      </svg>
    );
  }

  // PMI & Hardness Visualizer
  const cr = Number(v.cr ?? 2.25);
  const mo = Number(v.mo ?? 1.0);
  const hv = Number(v.hv ?? 218);
  const alloy = String(v.detectedAlloy ?? 'P22');
  const crBarH = Math.min(115, Math.max(8, (cr / 20) * 115));
  const moBarH = Math.min(115, Math.max(4, (mo / 3.5) * 115));
  const naceY = 180 - ((248 - 140) / 230) * 124;
  const hazY = Math.max(46, Math.min(182, 180 - ((hv - 140) / 230) * 124));
  const bmY = Math.max(66, Math.min(182, hazY + 26));

  return (
    <svg
      viewBox="0 0 560 236"
      data-testid="missing-ndt-svg-pmi_hardness"
      className="w-full h-auto rounded-xl bg-[#050a18] border border-slate-800"
      role="img"
      aria-label={isAr ? 'طيف أشعة XRF ومنحنى صلادة منطقة HAZ' : 'XRF Energy Spectrum & HAZ Hardness Profile'}
    >
      <rect x="16" y="14" width="260" height="208" rx="10" fill="#071124" stroke="#1e293b" />
      <text x="28" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
        XRF SPECTRUM (keV) · {alloy}
      </text>
      {/* Cr K-alpha peak */}
      <rect x="64" y={178 - crBarH} width="26" height={crBarH} rx="3" fill="#22d3ee" />
      <text x="58" y="196" fill="#22d3ee" fontSize="9" fontFamily="monospace">
        Cr {cr.toFixed(1)}%
      </text>
      {/* Fe K-alpha base peak */}
      <rect x="130" y="72" width="26" height="106" rx="3" fill="#475569" />
      <text x="128" y="196" fill="#94a3b8" fontSize="9" fontFamily="monospace">
        Fe Bal
      </text>
      {/* Mo K-alpha peak */}
      <rect x="196" y={178 - moBarH} width="26" height={moBarH} rx="3" fill="#fbbf24" />
      <text x="190" y="196" fill="#fbbf24" fontSize="9" fontFamily="monospace">
        Mo {mo.toFixed(2)}%
      </text>

      {/* Right: Weld Zone Hardness Profile */}
      <rect x="290" y="14" width="254" height="208" rx="10" fill="#071124" stroke="#1e293b" />
      <text x="302" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
        BM → HAZ → WM HARDNESS PROFILE
      </text>
      <line x1="306" y1={naceY} x2="530" y2={naceY} stroke="#fb7185" strokeDasharray="4 3" />
      <text x="448" y={naceY - 4} fill="#fb7185" fontSize="8.5" fontFamily="monospace">
        NACE 248 HV
      </text>
      <polyline
        fill="none"
        stroke={hv > 248 ? '#fb7185' : '#34d399'}
        strokeWidth="2.8"
        points={`318,${bmY} 368,${hazY} 418,${(hazY + bmY) / 2} 468,${hazY} 518,${bmY}`}
      />
      <circle cx="368" cy={hazY} r="4.5" fill={hv > 248 ? '#fb7185' : '#22d3ee'} />
      <circle cx="468" cy={hazY} r="4.5" fill={hv > 248 ? '#fb7185' : '#22d3ee'} />
      <text x="306" y="204" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
        Peak HAZ={hv} HV · CE={String(v.ce)}
      </text>
    </svg>
  );
};

export const MissingNdtTestsSimulator: React.FC<MissingNdtTestsSimulatorProps> = ({
  language,
  initialMethodId = 'et_rft',
  initialScenarioId,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  const [selectedMethodId, setSelectedMethodId] = useState<MissingNdtMethodId>(initialMethodId);
  const [paramsByMethod, setParamsByMethod] = useState<Record<MissingNdtMethodId, Record<string, number>>>(() => ({
    et_rft: getDefaultParams('et_rft'),
    lt_hydro: getDefaultParams('lt_hydro'),
    tofd: getDefaultParams('tofd'),
    mfl_api_ffs: getDefaultParams('mfl_api_ffs'),
    coating_holiday: getDefaultParams('coating_holiday'),
    pmi_hardness: getDefaultParams('pmi_hardness'),
  }));
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(initialScenarioId ?? null);
  const [traineeDisposition, setTraineeDisposition] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [xpBanner, setXpBanner] = useState<{
    correct: boolean;
    xpEarned: number;
    codeOutcome: string;
  } | null>(null);

  useEffect(() => {
    setSelectedMethodId(initialMethodId);
  }, [initialMethodId]);

  useEffect(() => {
    if (!initialScenarioId) return;
    const scenario = MISSING_NDT_CODE_SCENARIOS.find((s) => s.id === initialScenarioId);
    if (scenario) {
      setSelectedMethodId(scenario.methodId);
      setParamsByMethod((prev) => ({
        ...prev,
        [scenario.methodId]: { ...scenario.params },
      }));
      setActiveScenarioId(scenario.id);
    }
  }, [initialScenarioId]);

  const activeMeta = useMemo(
    () => MISSING_NDT_METHODS.find((m) => m.id === selectedMethodId) ?? MISSING_NDT_METHODS[0],
    [selectedMethodId]
  );

  const activeParams = paramsByMethod[selectedMethodId];

  const evaluation = useMemo(
    () => evaluateMissingNdtMethod(selectedMethodId, activeParams),
    [selectedMethodId, activeParams]
  );

  const methodScenarios = useMemo(
    () => MISSING_NDT_CODE_SCENARIOS.filter((s) => s.methodId === selectedMethodId),
    [selectedMethodId]
  );

  const activeScenario = useMemo(
    () => methodScenarios.find((s) => s.id === activeScenarioId) ?? null,
    [methodScenarios, activeScenarioId]
  );

  const handleLoadScenario = (scenario: MissingNdtCodeScenario) => {
    setSelectedMethodId(scenario.methodId);
    setParamsByMethod((prev) => ({
      ...prev,
      [scenario.methodId]: { ...scenario.params },
    }));
    setActiveScenarioId(scenario.id);
    setXpBanner(null);
  };

  const handleParamChange = (key: string, value: number) => {
    setParamsByMethod((prev) => ({
      ...prev,
      [selectedMethodId]: {
        ...prev[selectedMethodId],
        [key]: value,
      },
    }));
    setActiveScenarioId(null);
    setXpBanner(null);
  };

  const handleResetMethod = () => {
    setParamsByMethod((prev) => ({
      ...prev,
      [selectedMethodId]: getDefaultParams(selectedMethodId),
    }));
    setActiveScenarioId(null);
    setXpBanner(null);
  };

  const handleLogInspectionAttempt = () => {
    const codeVerdict: 'ACCEPT' | 'REJECT' =
      evaluation.overallStatus === 'reject' ? 'REJECT' : 'ACCEPT';
    const isMatch = traineeDisposition === codeVerdict;
    const scorePct = isMatch
      ? Math.round(78 + (evaluation.passCount / evaluation.clauses.length) * 22)
      : 42;

    const record = recordSimulationAttempt({
      simulatorId: `missing_ndt_${selectedMethodId}`,
      targetSubTab: 'sim_labs_rt',
      simulatorTitle: {
        ar: activeMeta.titleAr,
        en: activeMeta.titleEn,
      },
      ndtMethod: 'MULTI',
      defectTypes: [
        {
          id: activeScenario?.id ?? `${selectedMethodId}_custom`,
          ar: activeScenario?.titleAr ?? activeMeta.titleAr,
          en: activeScenario?.titleEn ?? activeMeta.titleEn,
        },
      ],
      status: isMatch ? 'PASS' : 'FAIL',
      codeVerdict,
      traineeVerdict: traineeDisposition,
      codeStandard: activeMeta.codesCovered.join(' · '),
      scorePct,
      notes: {
        ar: evaluation.summaryAr,
        en: evaluation.summaryEn,
      },
    });

    setXpBanner({
      correct: isMatch,
      xpEarned: record.xpEarned,
      codeOutcome: codeVerdict,
    });
  };

  const shellClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-950 border-slate-800 text-slate-100';
  const cardClass = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-900/75 border-slate-800 text-slate-100';

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="missing-ndt-tests-simulator"
      className={`rounded-2xl border p-4 sm:p-6 space-y-6 ${shellClass}`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isAr
                ? 'استوديو الاختبارات العملية التكميلية وسيناريوهات جميع الأكواد (30 بنداً دولياً)'
                : 'Complete Field NDT Simulators & Multi-Code Scenarios Suite (30 Code Clauses)'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            {isAr
              ? 'محاكيات ET/RFT · اختبار الضغط والتسريب LT · TOFD · MFL/API/FFS · الطلاء والندى · PMI والصلادة'
              : 'ET/RFT · Leak & Hydro (LT) · TOFD · MFL/API/FFS · Coating & Holiday · PMI & Hardness'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            {isAr
              ? 'تشمل جميع طرق الاختبار المكملة لورشة UT و PAUT و RT و VT/MT/PT/PWHT مع محاكاة فيزيائية لحظية ومصفوفة قبول شاملة لـ 30 بند كود دولي.'
              : 'Interactive physics-driven test benches for every remaining NDT & integrity inspection method, calibrated live against 30 international code clauses.'}
          </p>
        </div>

        <button
          type="button"
          data-testid="missing-ndt-reset-btn"
          onClick={handleResetMethod}
          className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center gap-2 self-start lg:self-auto"
        >
          <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'إعادة ضبط المعايرة' : 'Reset Calibration'}</span>
        </button>
      </div>

      {/* 6 Missing NDT Discipline Selector Grid */}
      <div
        role="tablist"
        aria-label={isAr ? 'اختيار محاكي الفحص المفقود' : 'Select Missing NDT Test Simulator'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
      >
        {MISSING_NDT_METHODS.map((m) => {
          const isActive = m.id === selectedMethodId;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`missing-ndt-tab-${m.id}`}
              onClick={() => {
                setSelectedMethodId(m.id);
                setActiveScenarioId(null);
                setXpBanner(null);
              }}
              className={`p-3 rounded-xl border text-start transition cursor-pointer flex items-start gap-3 ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-sm'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'
                }`}
              >
                {getMethodIcon(m.id)}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="text-[10px] font-mono font-black tracking-wider text-amber-400">
                  {m.shortCode}
                </div>
                <div className="text-xs font-bold leading-snug">
                  {isAr ? m.titleAr : m.titleEn}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  {m.codesCovered.join(' · ')}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Curated Code Scenarios Bar */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
            <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isAr
                ? `سيناريوهات الأكواد التطبيقية لمحاكي ${activeMeta.shortCode} (اضغط لتحميل الحالة):`
                : `Code Test Scenarios for ${activeMeta.shortCode} (Click to load):`}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {methodScenarios.length} {isAr ? 'سيناريوهات معيارية' : 'Code Scenarios'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {methodScenarios.map((sc) => {
            const isLoaded = sc.id === activeScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                data-testid={`missing-ndt-scenario-${sc.id}`}
                onClick={() => handleLoadScenario(sc)}
                className={`p-3 rounded-xl border text-start transition cursor-pointer space-y-1.5 ${
                  isLoaded
                    ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-800 hover:border-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {sc.codeBadge}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                      sc.expectedOutcome === 'pass'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {sc.expectedOutcome === 'pass'
                      ? isAr
                        ? 'مقبول'
                        : 'PASS'
                      : isAr
                      ? 'مرفوض'
                      : 'REJECT'}
                  </span>
                </div>
                <div className="text-xs font-bold leading-snug">
                  {isAr ? sc.titleAr : sc.titleEn}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {isAr ? sc.summaryAr : sc.summaryEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Interactive SVG Canvas + Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-3">
          <MissingNdtVisualizer
            methodId={selectedMethodId}
            evaluation={evaluation}
            isAr={isAr}
          />

          {/* 4 Live Telemetry Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {evaluation.metrics.map((metric) => {
              const toneClass =
                metric.tone === 'rose'
                  ? 'text-rose-400 border-rose-500/30'
                  : metric.tone === 'emerald'
                  ? 'text-emerald-400 border-emerald-500/30'
                  : metric.tone === 'amber'
                  ? 'text-amber-300 border-amber-500/30'
                  : metric.tone === 'violet'
                  ? 'text-violet-300 border-violet-500/30'
                  : 'text-cyan-300 border-cyan-500/30';
              return (
                <div
                  key={metric.id}
                  data-testid={`missing-ndt-metric-${metric.id}`}
                  className={`rounded-xl border p-2.5 bg-slate-950 ${toneClass}`}
                >
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {isAr ? metric.labelAr : metric.labelEn}
                  </div>
                  <div className="mt-1 text-sm font-mono font-black tabular-nums">
                    {metric.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] font-mono text-cyan-300 text-center">
            {isAr ? evaluation.physicsFormulaAr : evaluation.physicsFormulaEn}
          </div>
        </div>

        {/* Continuous Parameter Sliders + Overall Disposition + Log XP */}
        <div className={`lg:col-span-5 rounded-xl border p-4 space-y-4 ${cardClass}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <Sliders className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? 'ضبط متغيرات الفحص والمعايرة' : 'Calibration & Field Parameters'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {evaluation.passCount}/5 {isAr ? 'مطابق' : 'Pass'}
            </span>
          </div>

          <div className="space-y-3">
            {activeMeta.params.map((spec) => {
              const currentVal = activeParams[spec.key] ?? spec.defaultValue;
              return (
                <div key={spec.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <label htmlFor={`param-${selectedMethodId}-${spec.key}`} className="font-semibold">
                      {isAr ? spec.labelAr : spec.labelEn}
                    </label>
                    <span className="font-mono font-bold text-cyan-400 tabular-nums">
                      {currentVal} {spec.unit}
                    </span>
                  </div>
                  <input
                    id={`param-${selectedMethodId}-${spec.key}`}
                    data-testid={`missing-ndt-slider-${spec.key}`}
                    type="range"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={currentVal}
                    onChange={(e) => handleParamChange(spec.key, Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Live Code Verdict Summary */}
          <div
            data-testid="missing-ndt-overall-verdict"
            data-status={evaluation.overallStatus}
            className={`rounded-xl border p-3 space-y-1 text-xs ${
              evaluation.overallStatus === 'pass'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : evaluation.overallStatus === 'warn'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-black">
              {evaluation.overallStatus === 'pass' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : evaluation.overallStatus === 'warn' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {evaluation.overallStatus === 'pass'
                  ? isAr
                    ? 'حكم الأكواد الشامل: مقبول (5/5)'
                    : 'Overall Code Disposition: ACCEPT'
                  : evaluation.overallStatus === 'warn'
                  ? isAr
                    ? 'حكم الأكواد الشامل: تحذير معايرة / متابعة'
                    : 'Overall Code Disposition: WARNING / MONITOR'
                  : isAr
                  ? `حكم الأكواد الشامل: مرفوض (${evaluation.rejectCount} مخالفة)`
                  : `Overall Code Disposition: REJECT (${evaluation.rejectCount} Violations)`}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isAr ? evaluation.summaryAr : evaluation.summaryEn}
            </p>
          </div>

          {/* Trainee Decision & Log XP */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2.5">
            <div className="text-[11px] font-mono font-bold text-slate-300">
              {isAr ? 'قرار المفتش التدريبي وتوثيق النتيجة:' : 'Trainee Inspection Verdict & XP Log:'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="missing-ndt-verdict-accept"
                onClick={() => setTraineeDisposition('ACCEPT')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  traineeDisposition === 'ACCEPT'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {isAr ? 'قبول (ACCEPT)' : 'ACCEPT'}
              </button>
              <button
                type="button"
                data-testid="missing-ndt-verdict-reject"
                onClick={() => setTraineeDisposition('REJECT')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  traineeDisposition === 'REJECT'
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {isAr ? 'رفض / إصلاح (REJECT)' : 'REJECT'}
              </button>
            </div>
            <button
              type="button"
              data-testid="missing-ndt-log-xp-btn"
              onClick={handleLogInspectionAttempt}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? 'تسجيل نتيجة الفحص واحتساب XP' : 'Submit Inspection & Earn XP'}
              </span>
            </button>

            {xpBanner && (
              <div
                data-testid="missing-ndt-xp-banner"
                className={`rounded-lg border p-2 text-xs font-bold flex items-center justify-between gap-2 ${
                  xpBanner.correct
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                }`}
              >
                <span>
                  {xpBanner.correct
                    ? isAr
                      ? `تقييم مطابق لحكم الكود (${xpBanner.codeOutcome})`
                      : `Matched Code Verdict (${xpBanner.codeOutcome})`
                    : isAr
                    ? `خالف قرارك حكم الكود (${xpBanner.codeOutcome})`
                    : `Mismatch vs Code Verdict (${xpBanner.codeOutcome})`}
                </span>
                <span className="font-mono font-black text-amber-300 tabular-nums">
                  +{xpBanner.xpEarned} XP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live 5-Code Acceptance Clauses Matrix */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {isAr
              ? `مصفوفة تقييم الأكواد الدولية الحية (${activeMeta.codesCovered.join(' · ')})`
              : `Live 5-Standard Acceptance Matrix (${activeMeta.codesCovered.join(' · ')})`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {evaluation.clauses.map((clause) => {
            const statusTone =
              clause.status === 'pass'
                ? 'border-emerald-500/35 bg-emerald-950/15'
                : clause.status === 'warn'
                ? 'border-amber-500/35 bg-amber-950/15'
                : 'border-rose-500/40 bg-rose-950/20';

            return (
              <div
                key={clause.codeId}
                data-testid={`missing-ndt-clause-${clause.codeId}`}
                data-clause-status={clause.status}
                className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 ${statusTone}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-black text-cyan-300">
                      {clause.standard}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                        clause.status === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : clause.status === 'warn'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/25 text-rose-300'
                      }`}
                    >
                      {clause.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{clause.clause}</div>
                  <div className="text-xs font-bold leading-snug">
                    {isAr ? clause.titleAr : clause.titleEn}
                  </div>
                </div>

                <div className="space-y-1 text-[11px] border-t border-slate-800/70 pt-2">
                  <div className="text-slate-400">
                    <strong className="text-slate-300">{isAr ? 'الحد: ' : 'Limit: '}</strong>
                    {isAr ? clause.limitAr : clause.limitEn}
                  </div>
                  <div className="text-cyan-300 font-mono">
                    <strong>{isAr ? 'القياس: ' : 'Meas: '}</strong>
                    {isAr ? clause.measuredAr : clause.measuredEn}
                  </div>
                  <p className="text-slate-300 leading-snug pt-0.5">
                    {isAr ? clause.reasonAr : clause.reasonEn}
                  </p>
                  {clause.status !== 'pass' && (
                    <p className="text-amber-300 leading-snug pt-0.5">
                      <strong>{isAr ? 'الإجراء: ' : 'Fix: '}</strong>
                      {isAr ? clause.remediationAr : clause.remediationEn}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
