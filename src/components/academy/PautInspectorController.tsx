import React, { useState, useEffect, useRef } from 'react';
import { Language, EducationalDefect } from '../../types';
import { EDUCATIONAL_DEFECTS } from '../../data/inscoData';
import { recordSimulationAttempt } from '../../utils/simulationHistoryStore';
import {
  renderModernPautSectorialScan,
  WeldGrooveType,
} from '../../utils/pautWeldOverlayRenderer';
import { 
  Sliders, 
  Activity, 
  Crosshair, 
  Layers, 
  Cpu, 
  Info,
  CheckCircle2, 
  XCircle, 
  ClipboardCheck
} from 'lucide-react';

interface PautInspectorControllerProps {
  language: Language;
}

export const PautInspectorController: React.FC<PautInspectorControllerProps> = ({ language }) => {
  const isAr = language === 'ar';

  // --- Core Equipment Controls Requested by User ---
  // 1. Beam Angle slider (0 to 90 degrees)
  const [beamAngleDeg, setBeamAngleDeg] = useState<number>(55); // 0 - 90°

  // 2. Focal Law Settings
  const [focalDepthMm, setFocalDepthMm] = useState<number>(20); // 5 to 50 mm
  const [apertureElements, setApertureElements] = useState<16 | 32 | 64>(32); // 16, 32, 64 active elements
  const [elementPitchMm, setElementPitchMm] = useState<number>(0.6); // 0.5, 0.6, 1.0 mm
  const [focusingMode, setFocusingMode] = useState<'depth' | 'soundpath'>('depth');

  // 3. Virtual Gain Control
  const [gainDb, setGainDb] = useState<number>(44.0); // 0 to 80 dB

  // 4. Defect Selection from simulated UT defect data
  const [selectedDefectId, setSelectedDefectId] = useState<string>('crack');
  const currentDefect = EDUCATIONAL_DEFECTS.find(d => d.id === selectedDefectId) || EDUCATIONAL_DEFECTS[1]; // default crack

  // Probe Position (Standoff from weld centerline)
  const [standoffMm, setStandoffMm] = useState<number>(34); // mm

  // Weld Geometry Overlay inside PAUT S-Scan Graduation
  const [isWeldOverlayVisible, setIsWeldOverlayVisible] = useState<boolean>(true);
  const [showSkipMirror, setShowSkipMirror] = useState<boolean>(true);
  const [weldGrooveType, setWeldGrooveType] = useState<WeldGrooveType>('single_v');
  const [bevelAngleDeg, setBevelAngleDeg] = useState<number>(30);

  // UI state
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [showFocalBeamRay, setShowFocalBeamRay] = useState<boolean>(true);
  const [traineeVerdict, setTraineeVerdict] = useState<'ACCEPT' | 'REJECT'>('REJECT');
  const [historySavedToast, setHistorySavedToast] = useState<string | null>(null);

  // Canvas references
  const aScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sScanCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Plate thickness constant
  const plateThicknessMm = 25; // 25mm plate

  // --- Physics & Acoustic Signal Response Calculation ---
  // Calculate delay law for array elements based on beam angle and focal depth
  const rad = (beamAngleDeg * Math.PI) / 180;
  const soundVelocitySteel = 3240; // Shear wave in steel (m/s) for angle beam, 5920 for 0°
  const waveVelocity = beamAngleDeg === 0 ? 5920 : 3240;

  // Calculate Element Delays (Focal Law) in nanoseconds
  const elementDelaysNs: number[] = [];
  const halfAperture = (apertureElements - 1) / 2;
  const focalDistanceM = focalDepthMm / 1000;

  for (let i = 0; i < apertureElements; i++) {
    const xPosM = (i - halfAperture) * (elementPitchMm / 1000);
    // Steering delay + Focusing delay
    const steeringDelay = (xPosM * Math.sin(rad)) / waveVelocity;
    const focusDelay = (Math.pow(xPosM, 2) * Math.pow(Math.cos(rad), 2)) / (2 * focalDistanceM * waveVelocity);
    const totalDelaySec = steeringDelay + focusDelay;
    elementDelaysNs.push(Math.max(0, Math.round(totalDelaySec * 1e9)));
  }

  const maxDelayNs = Math.max(...elementDelaysNs, 1);

  // Physical defect position models inside test piece
  interface DefectAcousticModel {
    nominalDepthMm: number;
    specularAngleDeg: number; // Angle of maximum reflection
    angularToleranceDeg: number; // Width of specular reflection lobe
    baseEchoAmplitudePct: number;
    isPlanar: boolean;
    frequencySensitivity: number;
  }

  const defectAcousticModels: Record<string, DefectAcousticModel> = {
    crack: {
      nominalDepthMm: 22.0, // Near root
      specularAngleDeg: 55.0, // Orthogonal to crack face
      angularToleranceDeg: 7.0, // Narrow planar reflection
      baseEchoAmplitudePct: 88,
      isPlanar: true,
      frequencySensitivity: 1.2
    },
    lack_of_fusion: {
      nominalDepthMm: 14.0, // Along 30° bevel face
      specularAngleDeg: 60.0, // Orthogonal to 30° slope (90 - 30 = 60°)
      angularToleranceDeg: 5.0, // Highly directional specular reflection
      baseEchoAmplitudePct: 82,
      isPlanar: true,
      frequencySensitivity: 1.1
    },
    porosity: {
      nominalDepthMm: 12.0, // Mid-wall
      specularAngleDeg: 45.0, // Spherical voids scatter across all angles
      angularToleranceDeg: 35.0, // Wide omnidirectional lobe
      baseEchoAmplitudePct: 45,
      isPlanar: false,
      frequencySensitivity: 0.8
    },
    slag: {
      nominalDepthMm: 15.0, // Pass boundary
      specularAngleDeg: 50.0,
      angularToleranceDeg: 18.0, // Broad diffuse reflection
      baseEchoAmplitudePct: 52,
      isPlanar: false,
      frequencySensitivity: 0.9
    },
    undercut: {
      nominalDepthMm: 3.0, // Near top surface weld toe
      specularAngleDeg: 70.0,
      angularToleranceDeg: 12.0,
      baseEchoAmplitudePct: 60,
      isPlanar: false,
      frequencySensitivity: 1.0
    }
  };

  const defectModel = defectAcousticModels[currentDefect.id] || defectAcousticModels.crack;

  // Angular difference between current beam angle and defect specular angle
  const angleDelta = Math.abs(beamAngleDeg - defectModel.specularAngleDeg);

  // Focal law gain boost factor: maximum when focal depth matches defect depth
  const depthDiff = Math.abs(focalDepthMm - defectModel.nominalDepthMm);
  const focalGainFactor = Math.max(0.6, 1.2 - (depthDiff / 30) * 0.5);

  // Aperture resolution boost (64 elements focus sharper than 16 elements)
  const apertureBoost = apertureElements === 64 ? 1.15 : apertureElements === 32 ? 1.0 : 0.85;

  // Angular reflection attenuation (Gaussian beam profile)
  const angularResponse = Math.exp(-Math.pow(angleDelta / defectModel.angularToleranceDeg, 2));

  // Calculated sound path to defect
  const calculatedSoundPathMm = beamAngleDeg === 0 
    ? defectModel.nominalDepthMm 
    : defectModel.nominalDepthMm / Math.max(0.1, Math.cos(rad));

  // Calculated surface distance from probe index to defect
  const calculatedSurfaceDistMm = beamAngleDeg === 0 
    ? 0 
    : defectModel.nominalDepthMm * Math.tan(rad);

  // Final Signal Response Amplitude (% FSH)
  const gainMultiplier = Math.pow(10, (gainDb - 40) / 20);
  const rawSignalAmplitude = defectModel.baseEchoAmplitudePct * angularResponse * focalGainFactor * apertureBoost * gainMultiplier;
  const signalAmplitudePct = Math.min(100, Math.round(rawSignalAmplitude));

  // Gate A Alarm: Triggered if signal crosses threshold (default 50% FSH)
  const gateAThresholdPct = 50;
  const isAlarmTriggered = signalAmplitudePct >= gateAThresholdPct;

  // Signal-to-Noise Ratio (SNR dB)
  const baselineNoisePct = 4 + (gainDb > 50 ? (gainDb - 50) * 0.4 : 0);
  const snrDb = signalAmplitudePct > 0 
    ? Math.max(0, Math.round(20 * Math.log10(Math.max(1, signalAmplitudePct) / baselineNoisePct))) 
    : 0;

  // ASME Code Evaluation
  const isAsmeReject = currentDefect.severity === 'Critical' 
    ? signalAmplitudePct >= 20 // Zero tolerance for cracks/lack of fusion > 20% DAC
    : signalAmplitudePct >= 50; // Higher threshold for volumetric inclusions

  // --------------------------------------------------------------------------
  // S-Scan Sectorial Sweep Canvas (0 to 90 degrees) with Weld Bevel Overlay
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isFrozen) return;
    const canvas = sScanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flawSnapRole =
      currentDefect.id === 'lack_of_fusion'
        ? ('bevel_wall' as const)
        : currentDefect.id === 'undercut'
        ? ('cap_toe' as const)
        : ('none' as const);

    const flawOffsetMm =
      currentDefect.id === 'crack'
        ? 0.6
        : currentDefect.id === 'porosity'
        ? 1.5
        : currentDefect.id === 'slag'
        ? 2.4
        : 5.5;

    renderModernPautSectorialScan(ctx, {
      width: canvas.width,
      height: canvas.height,
      plateThicknessMm,
      probeIndexOffsetMm: standoffMm,
      minAngleDeg: 0,
      maxAngleDeg: 90,
      selectedAngleDeg: beamAngleDeg,
      apertureElements,
      focalDepthMm,
      gainDb,
      isTcgCalibrated: true,
      scanLawMode: 'sectorial',
      specimenGeometry: 'flat',
      isWeldOverlayVisible,
      showSkipMirror,
      bevelConfig: {
        grooveType: weldGrooveType,
        bevelAngleDeg,
        rootGapMm: 2.0,
        rootFaceMm: 2.0,
        hazWidthMm: 2.6,
        capReinforcementMm: 1.6,
      },
      flaw: {
        id: currentDefect.id,
        label: currentDefect.id.toUpperCase(),
        depthMm: defectModel.nominalDepthMm,
        heightMm: defectModel.isPlanar ? 3.2 : 2.0,
        offsetFromCenterTowardsProbeMm: flawOffsetMm,
        isPlanar: defectModel.isPlanar,
        snapToBevelRole: flawSnapRole,
        baseIntensity: Math.max(0.22, signalAmplitudePct / 95),
      },
      showFocalBeamCone: showFocalBeamRay,
      showSizingCaliper: false,
      isAr,
    });
  }, [
    beamAngleDeg,
    focalDepthMm,
    apertureElements,
    gainDb,
    standoffMm,
    isWeldOverlayVisible,
    showSkipMirror,
    weldGrooveType,
    bevelAngleDeg,
    isFrozen,
    isAr,
    currentDefect.id,
    defectModel.nominalDepthMm,
    defectModel.isPlanar,
    signalAmplitudePct,
    showFocalBeamRay,
  ]);

  // --------------------------------------------------------------------------
  // A-Scan Waveform Display Canvas
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = aScanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Graticule grid (10 divisions)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // 80% FSH line
      if (i === 2) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.strokeStyle = '#1e293b';
      }
    }

    for (let j = 0; j <= 10; j++) {
      const x = (width / 10) * j;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Gate A (Cyan / Red if triggered)
    const gateStartPx = width * 0.35;
    const gateEndPx = width * 0.75;
    const gateY = height - (gateAThresholdPct / 100) * height;

    ctx.strokeStyle = isAlarmTriggered ? '#ef4444' : '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gateStartPx, gateY);
    ctx.lineTo(gateEndPx, gateY);
    ctx.stroke();

    ctx.fillStyle = isAlarmTriggered ? '#ef4444' : '#06b6d4';
    ctx.font = '10px monospace';
    ctx.fillText('GATE A (50%)', gateStartPx + 4, gateY - 6);

    // Generate A-Scan Trace
    ctx.strokeStyle = isAlarmTriggered ? '#f43f5e' : '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const baselineY = height - 4;
    const maxTimeBaseMm = 60; // 60 mm sound path range
    const defectPeakPositionPx = (calculatedSoundPathMm / maxTimeBaseMm) * width;

    for (let x = 0; x < width; x++) {
      let y = baselineY;

      // Initial Bang near x = 0
      if (x < width * 0.08) {
        y -= (height * 0.7) * Math.exp(-Math.pow(x / (width * 0.02), 2));
      }

      // Defect Reflection Echo
      if (signalAmplitudePct > 0) {
        const dist = Math.abs(x - defectPeakPositionPx);
        if (dist < width * 0.07) {
          const bell = Math.exp(-Math.pow(dist / (width * 0.02), 2));
          const rfOsc = Math.abs(Math.sin((dist / (width * 0.012)) * Math.PI * 3));
          const echoHeightPx = (signalAmplitudePct / 100) * (height - 20);
          y -= echoHeightPx * bell * rfOsc;
        }
      }

      // Electronic baseline grass noise
      const grass = (Math.random() - 0.5) * baselineNoisePct * 1.5;
      y += grass;

      if (x === 0) ctx.moveTo(x, Math.max(8, y));
      else ctx.lineTo(x, Math.max(8, y));
    }

    ctx.stroke();

    // A-Scan Overlay HUD
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`BEAM: ${beamAngleDeg}° | GAIN: ${gainDb.toFixed(1)} dB`, 8, 14);

    if (signalAmplitudePct > 0) {
      ctx.fillStyle = isAlarmTriggered ? '#f43f5e' : '#10b981';
      ctx.fillText(`ECHO: ${signalAmplitudePct}% FSH`, width - 110, 14);
    }
  }, [
    beamAngleDeg,
    gainDb,
    signalAmplitudePct,
    calculatedSoundPathMm,
    isAlarmTriggered,
    baselineNoisePct
  ]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-6 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>PAUT INSPECTOR CONTROLLER · REAL-TIME PHASED ARRAY SYSTEM</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isAr ? 'وحدة التحكم بمفتش المصفوفات الطورية (PAUT Inspector Controller)' : 'Interactive PAUT Inspector Controller & Focal Law Engine'}
          </h3>
        </div>

        {/* Code Status Indicator */}
        <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-2 ${
          isAsmeReject
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {isAsmeReject ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>ASME STATUS: {isAsmeReject ? 'REJECT' : 'ACCEPT'}</span>
        </div>
      </div>

      {/* Simulated Defect Target Selector Strip */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>{isAr ? 'اختر عيب اللحام المستهدف للمحاكاة (Simulated UT Defect):' : 'Select Target Defect from Simulated UT Database:'}</span>
          <span className="text-cyan-400">{currentDefect.bestDetectionMethods.join(' · ')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {EDUCATIONAL_DEFECTS.map((defect) => {
            const isSelected = selectedDefectId === defect.id;
            return (
              <button
                key={defect.id}
                type="button"
                onClick={() => setSelectedDefectId(defect.id)}
                className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-slate-500">UT-{defect.id.slice(0, 4).toUpperCase()}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      defect.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {defect.severity}
                    </span>
                  </div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {defect.name[language]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual Screen Inspection Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sectorial S-Scan & A-Scan Displays */}
        <div className="lg:col-span-8 space-y-4">
          {/* S-Scan Sectorial Display (0-90°) with Multi-Leg Weld Geometry Overlay */}
          <div className="rounded-2xl border-2 border-slate-700 bg-black p-4 relative shadow-2xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-white font-bold">SECTORIAL S-SCAN (0° - 90°)</span>
                <span className="text-cyan-400 font-bold">| BEAM: {beamAngleDeg}°</span>
                <span className="text-amber-300 hidden sm:inline">· X0={standoffMm}mm</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsWeldOverlayVisible(!isWeldOverlayVisible)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition border cursor-pointer whitespace-nowrap shrink-0 ${
                    isWeldOverlayVisible
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {isAr ? 'شكل اللحام' : 'Weld Bevel'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSkipMirror(!showSkipMirror)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition border cursor-pointer whitespace-nowrap shrink-0 ${
                    showSkipMirror
                      ? 'bg-sky-500/25 text-sky-300 border-sky-500/50 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {isAr ? 'انعكاس 1T/2T' : '1T/2T Mirror'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFocalBeamRay(!showFocalBeamRay)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition border cursor-pointer whitespace-nowrap shrink-0 ${
                    showFocalBeamRay
                      ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Focal Beam
                </button>
                <button
                  type="button"
                  onClick={() => setIsFrozen(!isFrozen)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition border cursor-pointer whitespace-nowrap shrink-0 ${
                    isFrozen
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isFrozen ? 'FROZEN' : 'FREEZE'}
                </button>
              </div>
            </div>

            {isWeldOverlayVisible && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 whitespace-nowrap shrink-0">
                    {isAr ? 'هندسة اللحام داخل التدريج:' : 'Weld Profile in Graduation:'}
                  </span>
                  {(
                    [
                      { id: 'single_v', ar: 'V مفردة', en: 'Single-V' },
                      { id: 'double_v', ar: 'X مزدوجة', en: 'Double-V' },
                      { id: 'j_groove', ar: 'U / J أنابيب', en: 'U/J-Groove' },
                    ] as const
                  ).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setWeldGrooveType(g.id)}
                      className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                        weldGrooveType === g.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isAr ? g.ar : g.en}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 tabular-nums">
                  <span className="text-slate-400 whitespace-nowrap shrink-0">
                    {isAr ? 'زاوية الشطف:' : 'Bevel:'}
                  </span>
                  {[25, 30, 37.5].map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setBevelAngleDeg(ang)}
                      className={`px-1.5 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                        bevelAngleDeg === ang
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {ang}°
                    </button>
                  ))}
                </div>
              </div>
            )}

            <canvas
              ref={sScanCanvasRef}
              width={680}
              height={340}
              className="w-full h-64 sm:h-80 rounded-xl bg-slate-950 border border-slate-800 select-none cursor-crosshair"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-1 px-1 tabular-nums">
              <span>0° (Vertical Normal Z)</span>
              <span>45° (Shear Root)</span>
              <span>60° (30° Bevel Normal)</span>
              <span>70° (Leg 2 Cap/Bevel)</span>
              <span>90° (Surface Index X)</span>
            </div>
          </div>

          {/* Synchronized A-Scan Trace */}
          <div className="rounded-xl border border-slate-800 bg-black p-4 relative shadow-md">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800 mb-2">
              <span className="text-white font-bold">SYNCHRONIZED A-SCAN ECHO @ {beamAngleDeg}°</span>
              <span className="text-slate-400">Time-of-Flight (TOF)</span>
            </div>

            <canvas
              ref={aScanCanvasRef}
              width={640}
              height={160}
              className="w-full h-36 rounded-lg bg-slate-950 border border-slate-800 select-none"
            />
          </div>

          {/* Real-time Acoustic Readouts HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[11px]">{isAr ? 'سعة الإشارة (FSH):' : 'Signal Amplitude:'}</div>
              <div className={`text-xl font-black mt-0.5 ${isAlarmTriggered ? 'text-rose-400' : 'text-cyan-400'}`}>
                {signalAmplitudePct}%
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[11px]">{isAr ? 'المسار الصوتي (S):' : 'Sound Path (S):'}</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                {calculatedSoundPathMm.toFixed(1)} mm
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[11px]">{isAr ? 'العمق الحقيقي (True Depth):' : 'True Depth (D):'}</div>
              <div className="text-xl font-black text-slate-200 mt-0.5">
                {defectModel.nominalDepthMm.toFixed(1)} mm
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[11px]">{isAr ? 'نسبة الإشارة للضوضاء (SNR):' : 'Signal-to-Noise:'}</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                {snrDb} dB
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sliders & Phased Array Hardware Control Center */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5 text-xs font-mono">
            {/* 1. BEAM ANGLE SLIDER (0 - 90 DEGREES) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'زاوية الشعاع (Beam Angle):' : 'Beam Angle Slider (0 - 90°):'}</span>
                </span>
                <span className="text-base font-black text-cyan-400">{beamAngleDeg}°</span>
              </div>

              <input
                type="range"
                min="0"
                max="90"
                step="1"
                aria-label={isAr ? 'زاوية الشعاع (Beam Angle)' : 'Beam Angle'}
                value={beamAngleDeg}
                onChange={(e) => setBeamAngleDeg(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[0, 45, 60, 70].map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => setBeamAngleDeg(angle)}
                    className={`py-1 rounded text-center transition cursor-pointer border tabular-nums ${
                      beamAngleDeg === angle
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {angle}°
                  </button>
                ))}
              </div>

              {/* Probe Index Standoff X0 Slider (Positions Weld Inside Angular Graduation) */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-slate-300 text-[11px] mb-1 tabular-nums">
                  <span>{isAr ? 'بعد المجس عن مركز اللحام (X0):' : 'Probe Index Offset (X0):'}</span>
                  <span className="text-amber-400 font-bold">{standoffMm} mm</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="58"
                  step="1"
                  aria-label={isAr ? 'بعد المجس عن مركز اللحام X0' : 'Probe Index Offset X0'}
                  value={standoffMm}
                  onChange={(e) => setStandoffMm(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. FOCAL LAW SETTINGS */}
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'إعدادات قانون التركيز (Focal Law):' : 'Focal Law Settings:'}</span>
                </span>
                <span className="text-amber-400">{focalDepthMm} mm</span>
              </div>

              {/* Focal Depth Slider */}
              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>{isAr ? 'عمق التركيز البؤري (Focal Depth):' : 'Focal Depth (mm):'}</span>
                  <span>{focalDepthMm} mm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  aria-label={isAr ? 'عمق التركيز البؤري (Focal Depth)' : 'Focal Depth'}
                  value={focalDepthMm}
                  onChange={(e) => setFocalDepthMm(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Aperture Elements Selector */}
              <div>
                <div className="text-slate-400 text-[11px] mb-1">
                  {isAr ? 'عدد عناصر المصفوفة الفعالة (Active Aperture):' : 'Active Array Elements:'}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {([16, 32, 64] as const).map((elem) => (
                    <button
                      key={elem}
                      type="button"
                      onClick={() => setApertureElements(elem)}
                      className={`py-1 rounded border transition cursor-pointer ${
                        apertureElements === elem
                          ? 'bg-amber-600 text-white border-amber-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {elem} Elements
                    </button>
                  ))}
                </div>
              </div>

              {/* Delay Profile Bar-Graph */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
                  <span>ELEMENT TIME DELAY LAW (ns)</span>
                  <span>MAX: {maxDelayNs} ns</span>
                </div>
                <div className="h-8 bg-slate-900 rounded flex items-end gap-0.5 p-1 overflow-hidden">
                  {elementDelaysNs.slice(0, 32).map((ns, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-amber-400/80 rounded-t"
                      style={{ height: `${Math.max(10, (ns / maxDelayNs) * 100)}%` }}
                      title={`Element ${idx + 1}: ${ns} ns`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 3. VIRTUAL GAIN CONTROL */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'التحكم الافتراضي بالكسب (Virtual Gain):' : 'Virtual Gain Control (dB):'}</span>
                </span>
                <span className="text-base font-black text-emerald-400">{gainDb.toFixed(1)} dB</span>
              </div>

              <input
                type="range"
                min="0"
                max="80"
                step="0.5"
                aria-label={isAr ? 'التحكم بالكسب الافتراضي (Virtual Gain)' : 'Virtual System Gain'}
                value={gainDb}
                onChange={(e) => setGainDb(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-4 gap-1 pt-1">
                {[-6, -1, 1, 6].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setGainDb((prev) => Math.min(80, Math.max(0, prev + step)))}
                    className="py-1 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {step > 0 ? `+${step} dB` : `${step} dB`}
                  </button>
                ))}
              </div>
            </div>

            {/* Metallurgical Defect Evaluation Notes & Simulation History Logger */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'طبيعة العيب المستهدف:' : 'Target Discontinuity Nature:'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {currentDefect.nature[language]}
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                  <span>{isAr ? 'كود القبول المرجعي: ' : 'Standard Code: '}</span>
                  <strong className="text-cyan-300">{currentDefect.acceptanceCriteriaCode}</strong>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-300 font-bold">
                  {isAr ? 'تقييم المتدرب وتسجيل المحاولة:' : 'Trainee Disposition & Log Attempt:'}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTraineeVerdict('ACCEPT')}
                    className={`py-1.5 rounded-lg border font-bold text-[11px] transition cursor-pointer ${
                      traineeVerdict === 'ACCEPT'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ACCEPT
                  </button>
                  <button
                    type="button"
                    onClick={() => setTraineeVerdict('REJECT')}
                    className={`py-1.5 rounded-lg border font-bold text-[11px] transition cursor-pointer ${
                      traineeVerdict === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    REJECT
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const actualVerdict: 'ACCEPT' | 'REJECT' = isAsmeReject ? 'REJECT' : 'ACCEPT';
                    const isCorrect = traineeVerdict === actualVerdict;
                    const attemptStatus = isCorrect ? 'PASS' : 'FAIL';
                    const pautAccuracyPct = Math.min(
                      100,
                      (isCorrect ? 60 : 15) +
                        Math.round(angularResponse * 25) +
                        Math.round(Math.max(0, 1 - depthDiff / 30) * 15)
                    );
                    const rec = recordSimulationAttempt({
                      simulatorId: 'paut_controller',
                      targetSubTab: 'paut_controller',
                      simulatorTitle: {
                        ar: 'وحدة تحكم مفتش المصفوفات الطورية (PAUT Controller)',
                        en: 'PAUT Inspector Controller',
                      },
                      ndtMethod: 'PAUT',
                      defectTypes: [
                        {
                          id: currentDefect.id,
                          ar: currentDefect.name.ar,
                          en: currentDefect.name.en,
                        },
                      ],
                      status: attemptStatus,
                      codeVerdict: actualVerdict,
                      traineeVerdict,
                      codeStandard: currentDefect.acceptanceCriteriaCode,
                      scorePct: pautAccuracyPct,
                      measuredDepthMm: defectModel.nominalDepthMm,
                      notes: {
                        ar: `زاوية الشعاع ${beamAngleDeg}° · عمق بؤري ${focalDepthMm}مم · سعة الصدى ${signalAmplitudePct}% FSH`,
                        en: `Beam ${beamAngleDeg}° · Focal depth ${focalDepthMm}mm · Echo ${signalAmplitudePct}% FSH`,
                      },
                    });
                    setHistorySavedToast(
                      isAr
                        ? `تم حفظ المحاولة في سجل المحاكاة (${rec.status} · +${rec.xpEarned} XP)`
                        : `Attempt saved to Simulation History (${rec.status} · +${rec.xpEarned} XP)`
                    );
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? 'تسجيل المحاولة في سجل المحاكاة' : 'Record Attempt to Simulation History'}
                  </span>
                </button>

                {historySavedToast && (
                  <div className="text-[10.5px] text-emerald-300 font-semibold text-center">
                    {historySavedToast}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
