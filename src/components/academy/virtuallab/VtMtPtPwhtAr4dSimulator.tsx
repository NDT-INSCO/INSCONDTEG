import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Droplets,
  Eye,
  Flame,
  FlipHorizontal,
  Layers,
  Magnet,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  XCircle,
} from 'lucide-react';
import type { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  AR4D_VT_MT_PT_PWHT_DISCIPLINES,
  Ar4dInspectorDisciplineId,
  CodeVerdictLevel,
  MtMethodMode,
  MtSimInput,
  PtAlloyGroup,
  PtSimInput,
  PtSystemType,
  PWHT_PNUMBER_SPECS,
  PwhtPNumber,
  PwhtSimInput,
  VtSimInput,
  WeldJointType,
  computeMt4dTelemetry,
  computePt4dTelemetry,
  computePwht4dTelemetry,
  computePwhtCycleDerivatives,
  computeVt4dTelemetry,
} from '../../../data/ar4dVtMtPtPwhtEngine';
import {
  VtMtPtPwhtAr4dThreeScene,
  VtMtPtPwhtBackdropMode,
} from './VtMtPtPwhtAr4dThreeScene';

export interface VtMtPtPwhtAr4dSimulatorProps {
  language: Language;
  initialDiscipline?: Ar4dInspectorDisciplineId;
  onBackToQuickAr?: () => void;
}

type StreamState = 'idle' | 'requesting' | 'active' | 'error';

const DEFAULT_VT_INPUT: VtSimInput = {
  jointType: 'butt_pipe',
  wallThicknessMm: 14,
  illuminationLux: 1250,
  viewingDistanceMm: 380,
  viewingAngleDeg: 55,
  capReinforcementMm: 2.2,
  undercutDepthMm: 0.35,
  hiLoMismatchMm: 1.0,
  discontinuityLengthMm: 10,
  hasSurfaceCrackOrPin: false,
};

const DEFAULT_MT_INPUT: MtSimInput = {
  mode: 'ac_yoke',
  wallThicknessMm: 18,
  poleSpacingMm: 115,
  yokeLiftKg: 5.4,
  uvaIntensityUwCm2: 1450,
  ambientLightLux: 12,
  twoDirectionScan: true,
  residualGauss: 1.8,
  morphology: 'rounded',
  indicationSizeMm: 1.2,
  alignedCount: 1,
};

const DEFAULT_PT_INPUT: PtSimInput = {
  systemType: 'type1_fluorescent_method_d',
  alloyGroup: 'austenitic_ss_nickel',
  wallThicknessMm: 12,
  surfaceTempC: 26,
  dwellTimeMin: 15,
  developerEvalMin: 18,
  lightLevel: 1550,
  ambientDarkLux: 11,
  halogenSulfurPpm: 85,
  morphology: 'rounded',
  indicationSizeMm: 1.2,
  alignedCount: 1,
};

const DEFAULT_PWHT_INPUT: PwhtSimInput = {
  pNumber: 'P4',
  pipeOdMm: 273,
  wallThicknessMm: 22,
  weldWidthMm: 18,
  targetSoakC: 690,
  soakHoldMin: 75,
  rampRateCPerHr: 165,
  coolRateCPerHr: 185,
  tcSpreadDeltaC: 14,
  sourServiceNace: true,
};

function renderDisciplineIcon(id: Ar4dInspectorDisciplineId) {
  switch (id) {
    case 'vt':
      return <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'mt':
      return <Magnet className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'pt':
      return <Droplets className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'pwht':
      return <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
}

function renderVerdictBadge(verdict: CodeVerdictLevel, label: string) {
  if (verdict === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  if (verdict === 'warn') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[11px] font-bold">
      <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export const VtMtPtPwhtAr4dSimulator: React.FC<VtMtPtPwhtAr4dSimulatorProps> = ({
  language,
  initialDiscipline = 'vt',
  onBackToQuickAr,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  const [selectedDiscipline, setSelectedDiscipline] =
    useState<Ar4dInspectorDisciplineId>(initialDiscipline);

  useEffect(() => {
    setSelectedDiscipline(initialDiscipline);
  }, [initialDiscipline]);

  const activeMeta = useMemo(
    () =>
      AR4D_VT_MT_PT_PWHT_DISCIPLINES.find((d) => d.id === selectedDiscipline) ??
      AR4D_VT_MT_PT_PWHT_DISCIPLINES[0],
    [selectedDiscipline]
  );

  // Per-discipline calibrated parameter states
  const [vtInput, setVtInput] = useState<VtSimInput>(DEFAULT_VT_INPUT);
  const [mtInput, setMtInput] = useState<MtSimInput>(DEFAULT_MT_INPUT);
  const [ptInput, setPtInput] = useState<PtSimInput>(DEFAULT_PT_INPUT);
  const [pwhtInput, setPwhtInput] = useState<PwhtSimInput>(DEFAULT_PWHT_INPUT);

  // 4D Timeline & Playback Controls
  const [timePct, setTimePct] = useState<number>(48);
  const [isPlaying4d, setIsPlaying4d] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2>(1);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(true);

  // AR Backdrop & Camera MediaDevices State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [backdropMode, setBackdropMode] = useState<VtMtPtPwhtBackdropMode>('pipe');
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');

  // Spatial AR Alignment
  const [arScalePct, setArScalePct] = useState<number>(100);
  const [arRotationDeg, setArRotationDeg] = useState<number>(0);

  // Snapshot & XP Banner
  const [capturedSnapshotUrl, setCapturedSnapshotUrl] = useState<string | null>(null);
  const [loggedXpBanner, setLoggedXpBanner] = useState<{
    xpEarned: number;
    verdictLabel: string;
  } | null>(null);

  // 4D Timeline Ticker (prefers-reduced-motion aware & unref safe for node test exit)
  useEffect(() => {
    if (!isPlaying4d) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = setInterval(() => {
      setTimePct((prev) => {
        const next = prev + 0.9 * playbackSpeed;
        return next > 100 ? 0 : Number(next.toFixed(1));
      });
    }, 90);
    timer.unref?.();

    return () => clearInterval(timer);
  }, [isPlaying4d, playbackSpeed]);

  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track cleanup errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMediaTracks();
    };
  }, [stopMediaTracks]);

  const startLiveCamera = useCallback(
    async (overrideFacing?: 'environment' | 'user') => {
      setCameraErrorMsg('');
      setIsFrozen(false);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setStreamState('error');
        setCameraErrorMsg(
          isAr
            ? 'كاميرا الويب (MediaDevices API) غير متاحة هنا؛ تم تفعيل لوحة العينة المعايرة لمحاكاة 3D و 4D.'
            : 'Web MediaDevices API is unavailable; continuing with Calibration Specimen AR backdrop.'
        );
        return;
      }

      stopMediaTracks();
      setStreamState('requesting');
      const targetFacing = overrideFacing ?? facingMode;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const primaryTrack = stream.getVideoTracks()[0];
        setActiveCameraLabel(
          primaryTrack?.label || (isAr ? 'كاميرا الفحص الميداني AR' : 'Live Field Inspection Camera')
        );
        setStreamState('active');
        setBackdropMode('camera');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        const errName = err instanceof Error ? err.name : 'CameraError';
        setStreamState('error');
        setBackdropMode('pipe');
        setCameraErrorMsg(
          isAr
            ? `تعذّر الوصول للكاميرا (${errName}). يمكن مواصلة المحاكاة ثلاثية ورباعية الأبعاد على عينة اللحام المعايرة.`
            : `Unable to open camera (${errName}). Continuing with 3D/4D Calibration Weld Specimen.`
        );
      }
    },
    [facingMode, isAr, stopMediaTracks]
  );

  useEffect(() => {
    if (streamState === 'active' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [streamState]);

  const handleStopCamera = () => {
    stopMediaTracks();
    setStreamState('idle');
    setIsFrozen(false);
    if (backdropMode === 'camera') {
      setBackdropMode('pipe');
    }
  };

  const handleToggleLens = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setIsMirrored(nextFacing === 'user');
    if (streamState === 'active') {
      void startLiveCamera(nextFacing);
    }
  };

  const handleToggleFreeze = () => {
    if (!videoRef.current || streamState !== 'active') return;
    if (isFrozen) {
      videoRef.current.play().catch(() => {});
      setIsFrozen(false);
    } else {
      videoRef.current.pause();
      setIsFrozen(true);
    }
  };

  const timeProgress01 = timePct / 100;
  const telemetry = useMemo(() => {
    switch (selectedDiscipline) {
      case 'vt':
        return computeVt4dTelemetry(vtInput, timeProgress01);
      case 'mt':
        return computeMt4dTelemetry(mtInput, timeProgress01);
      case 'pt':
        return computePt4dTelemetry(ptInput, timeProgress01);
      case 'pwht':
        return computePwht4dTelemetry(pwhtInput, timeProgress01);
    }
  }, [selectedDiscipline, vtInput, mtInput, ptInput, pwhtInput, timeProgress01]);

  const pwhtDerivatives = useMemo(() => computePwhtCycleDerivatives(pwhtInput), [pwhtInput]);

  const handleApplyCompliantPreset = () => {
    if (selectedDiscipline === 'vt') setVtInput(DEFAULT_VT_INPUT);
    if (selectedDiscipline === 'mt') setMtInput(DEFAULT_MT_INPUT);
    if (selectedDiscipline === 'pt') setPtInput(DEFAULT_PT_INPUT);
    if (selectedDiscipline === 'pwht') setPwhtInput(DEFAULT_PWHT_INPUT);
  };

  const handleInjectCodeViolationPreset = () => {
    if (selectedDiscipline === 'vt') {
      setVtInput({
        ...DEFAULT_VT_INPUT,
        illuminationLux: 650,
        undercutDepthMm: 0.95,
        hiLoMismatchMm: 2.2,
      });
    } else if (selectedDiscipline === 'mt') {
      setMtInput({
        ...DEFAULT_MT_INPUT,
        yokeLiftKg: 3.6,
        residualGauss: 5.2,
        morphology: 'linear',
        indicationSizeMm: 2.8,
      });
    } else if (selectedDiscipline === 'pt') {
      setPtInput({
        ...DEFAULT_PT_INPUT,
        alloyGroup: 'austenitic_ss_nickel',
        surfaceTempC: 56,
        halogenSulfurPpm: 420,
        morphology: 'linear',
        indicationSizeMm: 2.6,
      });
    } else {
      setPwhtInput({
        ...DEFAULT_PWHT_INPUT,
        pNumber: 'P4',
        targetSoakC: 615,
        rampRateCPerHr: 280,
        tcSpreadDeltaC: 36,
        sourServiceNace: true,
      });
    }
  };

  const handleCaptureSnapshotAndXp = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#050a18';
      ctx.fillRect(0, 0, 1280, 720);

      if (streamState === 'active' && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
        } catch {
          // Keep background fill
        }
      }

      const webglCanvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="vtmtptpwht-ar4d-three-canvas"] canvas'
      );
      if (webglCanvas) {
        try {
          ctx.drawImage(webglCanvas, 0, 0, 1280, 720);
        } catch {
          // Ignore canvas taint
        }
      }

      ctx.fillStyle = 'rgba(2, 6, 23, 0.90)';
      ctx.fillRect(0, 636, 1280, 84);
      ctx.fillStyle = activeMeta.accentHex;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `INSCO AR+3D+4D · ${activeMeta.shortCode} · t=${Math.round(timePct)}% · ${telemetry.metric1Value} · ${telemetry.metric2Value}`,
        28,
        672
      );
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px monospace';
      const passCount = telemetry.codeReviews.filter((r) => r.verdict === 'pass').length;
      ctx.fillText(
        `Codes Verified: ${passCount}/5 PASS · ${telemetry.overallPass ? 'ACCEPT' : 'REVIEW/REJECT'} · ${new Date().toISOString()}`,
        28,
        702
      );

      try {
        setCapturedSnapshotUrl(canvas.toDataURL('image/png'));
      } catch {
        setCapturedSnapshotUrl(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
      }
    } else {
      setCapturedSnapshotUrl(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      );
    }

    const record = recordSimulationAttempt({
      simulatorId: `ar4d_codes_${activeMeta.id}`,
      targetSubTab: 'sim_labs_ar',
      simulatorTitle: {
        ar: `محاكي AR+3D+4D ومراجعة الأكواد: ${activeMeta.titleAr}`,
        en: `AR+3D+4D Multi-Code Studio: ${activeMeta.titleEn}`,
      },
      ndtMethod: activeMeta.ndtMethod,
      defectTypes: [
        {
          id: `${activeMeta.id}_phase_${telemetry.phaseIndex}`,
          ar: telemetry.activePhaseLabelAr,
          en: telemetry.activePhaseLabelEn,
        },
      ],
      status: telemetry.overallPass ? 'PASS' : 'FAIL',
      codeVerdict: telemetry.overallPass ? 'ACCEPT' : 'REJECT',
      traineeVerdict: telemetry.overallPass ? 'ACCEPT' : 'REJECT',
      codeStandard: telemetry.codeReviews.map((c) => c.codeName).join(' · '),
      scorePct: telemetry.overallPass ? 98 : 76,
    });

    setLoggedXpBanner({
      xpEarned: record.xpEarned,
      verdictLabel: isAr ? telemetry.overallVerdictAr : telemetry.overallVerdictEn,
    });
  };

  const passCount = telemetry.codeReviews.filter((r) => r.verdict === 'pass').length;
  const rejectCount = telemetry.codeReviews.filter((r) => r.verdict === 'reject').length;

  const shellClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const subCardClass = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <section
      data-testid="vtmtptpwht-ar4d-simulator"
      className={`rounded-2xl border p-4 sm:p-6 space-y-5 ${shellClass}`}
      aria-label={
        isAr
          ? 'استوديو الواقع المعزز 3D و 4D لفحوصات VT و MT و PT والمعالجة الحرارية PWHT مع مراجعة الأكواد'
          : 'VT, MT, PT & PWHT 3D/4D Augmented Reality & Multi-Code Simulator'
      }
    >
      {/* Top Header & Camera Backdrop Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-700/30 pb-4">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-400 mb-1">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isAr
                ? 'استوديو 3D + 4D والواقع المعزز · مراجعة 20 بند كود دولي'
                : 'AR + Three.js 3D + 4D Timeline · 20 Live International Code Clauses'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            {isAr
              ? 'محاكيات الواقع المعزز 3D/4D: VT · MT · PT · المعالجة الحرارية PWHT + مراجعة الأكواد'
              : 'AR + 3D + 4D Simulators: VT · MT · PT · PWHT with Live Multi-Code Review'}
          </h3>
          <p className={`mt-1 text-xs sm:text-sm leading-relaxed ${mutedText}`}>
            {isAr
              ? 'شغّل الكاميرا الحية أو عينة اللحام 3D، اسحب شريط الزمن 4D عبر مراحل الفحص أو الدورة الحرارية، وعدّل المتغيرات لمراقبة تقييم جميع الأكواد (ASME · AWS · API · ASTM · ISO · NACE) لحظياً.'
              : 'Overlay interactive 3D/4D instrumentation atop live camera or calibrated weld specimens, scrub the 4D process timeline, and tune parameters with live 5-code acceptance matrices per discipline.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onBackToQuickAr && (
            <button
              type="button"
              data-testid="vtmtptpwht-back-btn"
              onClick={() => {
                stopMediaTracks();
                onBackToQuickAr();
              }}
              className={`min-w-0 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-sky-400'
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'العودة' : 'Back'}</span>
            </button>
          )}

          {streamState !== 'active' ? (
            <button
              type="button"
              data-testid="vtmtptpwht-start-camera-btn"
              onClick={() => void startLiveCamera()}
              disabled={streamState === 'requesting'}
              className="min-w-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {streamState === 'requesting'
                  ? isAr
                    ? 'جاري فتح الكاميرا...'
                    : 'Requesting Cam...'
                  : isAr
                    ? 'تشغيل الكاميرا AR'
                    : 'Start AR Camera'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="vtmtptpwht-stop-camera-btn"
              onClick={handleStopCamera}
              className="min-w-0 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <CameraOff className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="vtmtptpwht-backdrop-pipe-btn"
            onClick={() => {
              if (streamState === 'active') handleStopCamera();
              setBackdropMode('pipe');
            }}
            className={`min-w-0 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              backdropMode === 'pipe' && streamState !== 'active'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-amber-400'
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'عينة اللحام AR' : 'Weld Specimen'}</span>
          </button>

          <button
            type="button"
            data-testid="vtmtptpwht-backdrop-studio-btn"
            onClick={() => {
              if (streamState === 'active') handleStopCamera();
              setBackdropMode('studio3d');
            }}
            className={`min-w-0 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              backdropMode === 'studio3d' && streamState !== 'active'
                ? 'bg-sky-400 text-slate-950 border-sky-300 font-black'
                : isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-sky-400'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'استوديو 3D مظلم' : '3D Dark Studio'}</span>
          </button>
        </div>
      </div>

      {/* Camera fallback error alert */}
      {streamState === 'error' && cameraErrorMsg && (
        <div
          role="alert"
          data-testid="vtmtptpwht-camera-error"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-300"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>{cameraErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => void startLiveCamera()}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* 4 DISCIPLINES SELECTOR GRID: VT · MT · PT · PWHT */}
      <div
        data-testid="vtmtptpwht-discipline-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 min-w-0"
      >
        {AR4D_VT_MT_PT_PWHT_DISCIPLINES.map((disc) => {
          const isActive = disc.id === activeMeta.id;
          return (
            <button
              key={disc.id}
              type="button"
              data-testid={`vtmtptpwht-tab-${disc.id}`}
              onClick={() => {
                setSelectedDiscipline(disc.id);
                setTimePct(38);
                setLoggedXpBanner(null);
              }}
              className={`min-w-0 p-3 rounded-xl border text-start transition cursor-pointer flex flex-col gap-1 ${
                isActive
                  ? 'bg-sky-500/15 border-sky-400 text-sky-200 shadow-sm font-black'
                  : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-sky-400'
                    : 'bg-slate-950/85 border-slate-800 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 min-w-0">
                  {renderDisciplineIcon(disc.id)}
                  <span>
                    {disc.orderLabel} · {disc.shortCode}
                  </span>
                </span>
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: disc.accentHex }}
                />
              </div>
              <div className="text-xs font-bold leading-snug">
                {isAr ? disc.titleAr : disc.titleEn}
              </div>
            </button>
          );
        })}
      </div>

      {/* TWO-ZONE INTERACTIVE WORKBENCH: AR+3D+4D VIEWPORT + TELEMETRY & CONTROLS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ZONE 1: Spatial AR Video + Three.js 3D+4D Viewport + Collapsible 4D Dock */}
        <div className="xl:col-span-7 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-[#050a18] aspect-video min-h-[340px] shadow-xl">
            <video
              ref={videoRef}
              data-testid="vtmtptpwht-live-video"
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                streamState === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${isMirrored ? '-scale-x-100' : ''}`}
            />

            {streamState !== 'active' && backdropMode === 'pipe' && (
              <svg
                viewBox="0 0 1280 720"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="vtmtptpwhtSteelSpecimen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#090d16" />
                    <stop offset="30%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#334155" />
                    <stop offset="70%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#060913" />
                  </linearGradient>
                </defs>
                <rect width="1280" height="720" fill="#060913" />
                <rect
                  x="70"
                  y="195"
                  width="1140"
                  height="330"
                  rx="22"
                  fill="url(#vtmtptpwhtSteelSpecimen)"
                  opacity="0.72"
                />
                <rect x="612" y="195" width="56" height="330" fill="#475569" opacity="0.58" />
              </svg>
            )}

            <div className="absolute inset-0 z-10">
              <VtMtPtPwhtAr4dThreeScene
                language={language}
                disciplineId={activeMeta.id}
                telemetry={telemetry}
                accentHex={activeMeta.accentHex}
                backdropMode={streamState === 'active' ? 'camera' : backdropMode}
                arScalePct={arScalePct}
                arRotationDeg={arRotationDeg}
                pwhtTargetC={pwhtInput.targetSoakC}
                vtCapMm={vtInput.capReinforcementMm}
                mtTwoWay={mtInput.twoDirectionScan}
              />
            </div>

            {/* Minimal Top HUD Bar (Explicit Icons + Text, No Backdrop Blur over WebGL) */}
            <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-100 flex flex-wrap items-center gap-2 pointer-events-auto">
                <span className="font-bold text-sky-300">{activeMeta.shortCode}</span>
                <span className="text-slate-500">·</span>
                {telemetry.overallPass ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{passCount}/5 PASS</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
                    <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {passCount}/5 PASS · {rejectCount} REJECT
                    </span>
                  </span>
                )}
                {streamState === 'active' && activeCameraLabel && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-300">{activeCameraLabel}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {streamState === 'active' && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleFreeze}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-sky-400 cursor-pointer flex items-center gap-1"
                    >
                      {isFrozen ? (
                        <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>{isFrozen ? (isAr ? 'استئناف' : 'Resume') : isAr ? 'تجميد' : 'Freeze'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleLens}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-sky-400 cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'تبديل العدسة' : 'Lens'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMirrored((m) => !m)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-sky-400 cursor-pointer flex items-center gap-1"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'عكس' : 'Flip'}</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  data-testid="vtmtptpwht-dock-toggle"
                  onClick={() => setIsDockExpanded((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-sky-300 hover:border-sky-400 cursor-pointer flex items-center gap-1"
                >
                  {isDockExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {isDockExpanded
                      ? isAr
                        ? 'إخفاء شريط 4D'
                        : 'Hide 4D Dock'
                      : isAr
                        ? 'إظهار شريط 4D'
                        : 'Show 4D Dock'}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Collapsible 4D Time-Dimension Dock */}
            {isDockExpanded && (
              <div
                data-testid="vtmtptpwht-bottom-dock"
                className="absolute bottom-3 inset-x-3 z-20 rounded-xl bg-slate-950/92 border border-slate-700/90 p-3 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="vtmtptpwht-play-btn"
                      onClick={() => setIsPlaying4d((p) => !p)}
                      className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {isPlaying4d ? (
                        <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isPlaying4d ? (isAr ? 'إيقاف 4D' : 'Pause 4D') : isAr ? 'تشغيل 4D' : 'Play 4D'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
                      {([0.5, 1, 2] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-2 py-1 rounded cursor-pointer ${
                            playbackSpeed === spd
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                    {isAr ? 'الطور الزمني 4D:' : '4D Phase:'}{' '}
                    <span className="text-amber-400">
                      {isAr ? telemetry.activePhaseLabelAr : telemetry.activePhaseLabelEn}
                    </span>{' '}
                    <span className="text-sky-400">({Math.round(timePct)}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">t₀</span>
                  <input
                    type="range"
                    data-testid="vtmtptpwht-timeline-scrubber"
                    aria-label={isAr ? 'شريط الزمن 4D' : '4D Timeline Scrubber'}
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(timePct)}
                    onChange={(e) => {
                      setIsPlaying4d(false);
                      setTimePct(Number(e.target.value));
                    }}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">100%</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {activeMeta.phases.map((phase, idx) => {
                    const isActiveMilestone = telemetry.phaseIndex === idx;
                    return (
                      <button
                        key={phase.progressPct}
                        type="button"
                        data-testid={`vtmtptpwht-phase-btn-${idx}`}
                        onClick={() => {
                          setIsPlaying4d(false);
                          setTimePct(phase.progressPct);
                        }}
                        className={`min-w-0 px-2 py-1.5 rounded-lg border text-start text-[11px] font-mono transition cursor-pointer ${
                          isActiveMilestone
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                            : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px] text-amber-400">{phase.progressPct}%</div>
                        <div className="leading-tight font-sans">
                          {isAr ? phase.labelAr : phase.labelEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Spatial AR Alignment + Active Equipment Strip */}
          <div className={`rounded-xl border p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 ${subCardClass}`}>
            <label className="text-xs font-mono space-y-1">
              <div className="flex items-center justify-between tabular-nums">
                <span className={mutedText}>{isAr ? 'تكبير التراكب AR:' : 'AR 3D Scale:'}</span>
                <span className="font-bold text-sky-400">{arScalePct}%</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'حجم التراكب AR' : 'AR 3D Scale'}
                min={60}
                max={150}
                step={5}
                value={arScalePct}
                onChange={(e) => setArScalePct(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </label>

            <label className="text-xs font-mono space-y-1">
              <div className="flex items-center justify-between tabular-nums">
                <span className={mutedText}>{isAr ? 'دوران المجسم (Yaw):' : '3D Specimen Yaw:'}</span>
                <span className="font-bold text-amber-400">{arRotationDeg}°</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'دوران المجسم AR' : 'AR 3D Rotation'}
                min={-180}
                max={180}
                step={5}
                value={arRotationDeg}
                onChange={(e) => setArRotationDeg(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* ZONE 2: Live 4D Telemetry Metrics & Tailored Engineering Parameters */}
        <div className="xl:col-span-5 space-y-4">
          <div
            data-testid="vtmtptpwht-telemetry-cards"
            className={`rounded-2xl border p-4 space-y-3 ${subCardClass}`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/30 pb-2">
              <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'القياسات الحية 4D' : 'Live 4D Engineering Readout'}</span>
              </span>
              {telemetry.overallPass ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? telemetry.overallVerdictAr : telemetry.overallVerdictEn}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? telemetry.overallVerdictAr : telemetry.overallVerdictEn}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? telemetry.metric1LabelAr : telemetry.metric1LabelEn}
                </div>
                <div className="text-sm font-black text-sky-300 mt-0.5 tabular-nums">
                  {telemetry.metric1Value}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? telemetry.metric2LabelAr : telemetry.metric2LabelEn}
                </div>
                <div className="text-sm font-black text-amber-300 mt-0.5 tabular-nums">
                  {telemetry.metric2Value}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? telemetry.metric3LabelAr : telemetry.metric3LabelEn}
                </div>
                <div className="text-sm font-black text-emerald-300 mt-0.5 tabular-nums">
                  {telemetry.metric3Value}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? telemetry.metric4LabelAr : telemetry.metric4LabelEn}
                </div>
                <div className="text-sm font-black text-purple-300 mt-0.5 tabular-nums">
                  {telemetry.metric4Value}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-2.5 text-[11px] leading-relaxed text-slate-300">
              <strong className="text-amber-300">
                {isAr ? 'معدات الفحص 3D:' : '3D Instrumentation:'}
              </strong>{' '}
              {isAr ? activeMeta.equipmentAr : activeMeta.equipmentEn}
            </div>
          </div>

          {/* DISCIPLINE-SPECIFIC PARAMETER PANEL */}
          <div className={`rounded-2xl border p-4 space-y-3 ${subCardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono font-bold text-amber-400">
                {isAr ? 'معايرة متغيرات الكود والفيزياء' : 'Code & Physics Parameter Deck'}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="vtmtptpwht-preset-pass"
                  onClick={handleApplyCompliantPreset}
                  className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-bold cursor-pointer hover:bg-emerald-500/30"
                >
                  {isAr ? 'ضبط مطابق' : 'Preset PASS'}
                </button>
                <button
                  type="button"
                  data-testid="vtmtptpwht-preset-fault"
                  onClick={handleInjectCodeViolationPreset}
                  className="px-2 py-1 rounded-md bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[11px] font-bold cursor-pointer hover:bg-rose-500/30"
                >
                  {isAr ? 'محاكاة مخالفة كود' : 'Inject Fault'}
                </button>
              </div>
            </div>

            {/* ---- VT CONTROLS ---- */}
            {selectedDiscipline === 'vt' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className={mutedText}>{isAr ? 'نوع الوصلة:' : 'Weld Joint:'}</span>
                    <select
                      data-testid="vt-joint-select"
                      value={vtInput.jointType}
                      onChange={(e) =>
                        setVtInput((prev) => ({
                          ...prev,
                          jointType: e.target.value as WeldJointType,
                        }))
                      }
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100"
                    >
                      <option value="butt_pipe">Butt Pipe (Girth)</option>
                      <option value="butt_plate">Butt Plate (Structural)</option>
                      <option value="fillet_tee">Fillet Tee Joint</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="vt-crack-checkbox"
                      checked={vtInput.hasSurfaceCrackOrPin}
                      onChange={(e) =>
                        setVtInput((prev) => ({
                          ...prev,
                          hasSurfaceCrackOrPin: e.target.checked,
                        }))
                      }
                      className="accent-rose-500"
                    />
                    <span className="text-rose-300 font-bold">
                      {isAr ? 'شرخ أو ثقب سطحي' : 'Crack / Pinhole'}
                    </span>
                  </label>
                </div>

                <label className="block space-y-1">
                  <div className="flex justify-between tabular-nums">
                    <span className={mutedText}>{isAr ? 'شدة الإضاءة (Lux):' : 'Illumination (Lux):'}</span>
                    <span className="font-bold text-sky-400">{vtInput.illuminationLux} Lux</span>
                  </div>
                  <input
                    type="range"
                    data-testid="vt-lux-slider"
                    min={400}
                    max={2000}
                    step={50}
                    value={vtInput.illuminationLux}
                    onChange={(e) =>
                      setVtInput((prev) => ({ ...prev, illuminationLux: Number(e.target.value) }))
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex justify-between tabular-nums">
                    <span className={mutedText}>{isAr ? 'ارتفاع تاج اللحام (mm):' : 'Cap Height (mm):'}</span>
                    <span className="font-bold text-amber-400">{vtInput.capReinforcementMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    data-testid="vt-cap-slider"
                    min={0.5}
                    max={6.0}
                    step={0.1}
                    value={vtInput.capReinforcementMm}
                    onChange={(e) =>
                      setVtInput((prev) => ({ ...prev, capReinforcementMm: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'العضة Undercut:' : 'Undercut:'}</span>
                      <span className="font-bold text-rose-400">{vtInput.undercutDepthMm.toFixed(2)}mm</span>
                    </div>
                    <input
                      type="range"
                      data-testid="vt-undercut-slider"
                      min={0}
                      max={1.5}
                      step={0.05}
                      value={vtInput.undercutDepthMm}
                      onChange={(e) =>
                        setVtInput((prev) => ({ ...prev, undercutDepthMm: Number(e.target.value) }))
                      }
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>Hi-Lo (mm):</span>
                      <span className="font-bold text-emerald-400">{vtInput.hiLoMismatchMm.toFixed(1)}mm</span>
                    </div>
                    <input
                      type="range"
                      data-testid="vt-hilo-slider"
                      min={0}
                      max={4.0}
                      step={0.1}
                      value={vtInput.hiLoMismatchMm}
                      onChange={(e) =>
                        setVtInput((prev) => ({ ...prev, hiLoMismatchMm: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ---- MT CONTROLS ---- */}
            {selectedDiscipline === 'mt' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className={mutedText}>{isAr ? 'تقنية المغنطة:' : 'MT Technique:'}</span>
                    <select
                      data-testid="mt-mode-select"
                      value={mtInput.mode}
                      onChange={(e) => {
                        const mode = e.target.value as MtMethodMode;
                        setMtInput((prev) => ({
                          ...prev,
                          mode,
                          yokeLiftKg: mode === 'dc_yoke' ? 19.2 : 5.4,
                        }));
                      }}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100"
                    >
                      <option value="ac_yoke">AC Electromagnetic Yoke</option>
                      <option value="dc_yoke">DC / Permanent Yoke</option>
                      <option value="prod">Direct Prod Contact</option>
                      <option value="coil">Circumferential Coil</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className={mutedText}>{isAr ? 'شكل الدلالة:' : 'Morphology:'}</span>
                    <select
                      data-testid="mt-morphology-select"
                      value={mtInput.morphology}
                      onChange={(e) =>
                        setMtInput((prev) => ({
                          ...prev,
                          morphology: e.target.value as 'linear' | 'rounded',
                        }))
                      }
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100"
                    >
                      <option value="rounded">{isAr ? 'دائرية Rounded' : 'Rounded'}</option>
                      <option value="linear">{isAr ? 'خطية Linear' : 'Linear'}</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'وزن الرفع (kg):' : 'Lift Weight:'}</span>
                      <span className="font-bold text-pink-400">{mtInput.yokeLiftKg.toFixed(1)} kg</span>
                    </div>
                    <input
                      type="range"
                      data-testid="mt-lift-slider"
                      min={2.5}
                      max={24}
                      step={0.3}
                      value={mtInput.yokeLiftKg}
                      onChange={(e) =>
                        setMtInput((prev) => ({ ...prev, yokeLiftKg: Number(e.target.value) }))
                      }
                      className="w-full accent-pink-400 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'المتبقي (Gauss):' : 'Residual G:'}</span>
                      <span className="font-bold text-amber-400">{mtInput.residualGauss.toFixed(1)} G</span>
                    </div>
                    <input
                      type="range"
                      data-testid="mt-gauss-slider"
                      min={0}
                      max={10}
                      step={0.2}
                      value={mtInput.residualGauss}
                      onChange={(e) =>
                        setMtInput((prev) => ({ ...prev, residualGauss: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'حجم الدلالة (mm):' : 'Indication Size:'}</span>
                      <span className="font-bold text-sky-400">{mtInput.indicationSizeMm.toFixed(1)}mm</span>
                    </div>
                    <input
                      type="range"
                      data-testid="mt-size-slider"
                      min={0.5}
                      max={8}
                      step={0.1}
                      value={mtInput.indicationSizeMm}
                      onChange={(e) =>
                        setMtInput((prev) => ({ ...prev, indicationSizeMm: Number(e.target.value) }))
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center gap-2 pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="mt-twoway-checkbox"
                      checked={mtInput.twoDirectionScan}
                      onChange={(e) =>
                        setMtInput((prev) => ({ ...prev, twoDirectionScan: e.target.checked }))
                      }
                      className="accent-pink-500"
                    />
                    <span className="text-slate-200">
                      {isAr ? 'مسح متعامد 0° و 90°' : '0° + 90° 2-Way Scan'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ---- PT CONTROLS ---- */}
            {selectedDiscipline === 'pt' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className={mutedText}>{isAr ? 'نظام السائل النافذ:' : 'PT System:'}</span>
                    <select
                      data-testid="pt-system-select"
                      value={ptInput.systemType}
                      onChange={(e) => {
                        const sys = e.target.value as PtSystemType;
                        setPtInput((prev) => ({
                          ...prev,
                          systemType: sys,
                          lightLevel: sys === 'type2_visible_solvent_c' ? 1200 : 1550,
                        }));
                      }}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100"
                    >
                      <option value="type1_fluorescent_method_d">Type I Fluorescent (Method D)</option>
                      <option value="type1_water_method_a">Type I Water-Washable (Method A)</option>
                      <option value="type2_visible_solvent_c">Type II Visible Red Dye (Method C)</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className={mutedText}>{isAr ? 'نوع المعدن:' : 'Base Alloy:'}</span>
                    <select
                      data-testid="pt-alloy-select"
                      value={ptInput.alloyGroup}
                      onChange={(e) =>
                        setPtInput((prev) => ({
                          ...prev,
                          alloyGroup: e.target.value as PtAlloyGroup,
                        }))
                      }
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100"
                    >
                      <option value="austenitic_ss_nickel">Austenitic SS / Nickel Alloy</option>
                      <option value="carbon_steel">Carbon / Low-Alloy Steel</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'حرارة السطح:' : 'Metal Temp:'}</span>
                      <span className="font-bold text-purple-300">{ptInput.surfaceTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      data-testid="pt-temp-slider"
                      min={5}
                      max={65}
                      step={1}
                      value={ptInput.surfaceTempC}
                      onChange={(e) =>
                        setPtInput((prev) => ({ ...prev, surfaceTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'هالوجين/كبريت SS:' : 'Halogens ppm:'}</span>
                      <span className="font-bold text-amber-400">{ptInput.halogenSulfurPpm} ppm</span>
                    </div>
                    <input
                      type="range"
                      data-testid="pt-halogen-slider"
                      min={10}
                      max={600}
                      step={10}
                      value={ptInput.halogenSulfurPpm}
                      onChange={(e) =>
                        setPtInput((prev) => ({ ...prev, halogenSulfurPpm: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'زمن التغلغل Dwell:' : 'Dwell (min):'}</span>
                      <span className="font-bold text-sky-400">{ptInput.dwellTimeMin} min</span>
                    </div>
                    <input
                      type="range"
                      data-testid="pt-dwell-slider"
                      min={3}
                      max={35}
                      step={1}
                      value={ptInput.dwellTimeMin}
                      onChange={(e) =>
                        setPtInput((prev) => ({ ...prev, dwellTimeMin: Number(e.target.value) }))
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'طول الدلالة:' : 'Bleed Size:'}</span>
                      <span className="font-bold text-rose-400">{ptInput.indicationSizeMm.toFixed(1)}mm</span>
                    </div>
                    <input
                      type="range"
                      data-testid="pt-size-slider"
                      min={0.5}
                      max={8}
                      step={0.1}
                      value={ptInput.indicationSizeMm}
                      onChange={(e) =>
                        setPtInput((prev) => ({ ...prev, indicationSizeMm: Number(e.target.value) }))
                      }
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ---- PWHT CONTROLS ---- */}
            {selectedDiscipline === 'pwht' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className={mutedText}>{isAr ? 'مجموعة المعدن P-No:' : 'P-Number Group:'}</span>
                    <select
                      data-testid="pwht-pnumber-select"
                      value={pwhtInput.pNumber}
                      onChange={(e) => {
                        const pNum = e.target.value as PwhtPNumber;
                        const spec = PWHT_PNUMBER_SPECS[pNum];
                        setPwhtInput((prev) => ({
                          ...prev,
                          pNumber: pNum,
                          targetSoakC: Math.round((spec.minSoakC + spec.maxSoakC) / 2),
                        }));
                      }}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100"
                    >
                      {(Object.keys(PWHT_PNUMBER_SPECS) as PwhtPNumber[]).map((key) => (
                        <option key={key} value={key}>
                          {isAr ? PWHT_PNUMBER_SPECS[key].labelAr : PWHT_PNUMBER_SPECS[key].labelEn}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-2 pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="pwht-nace-checkbox"
                      checked={pwhtInput.sourServiceNace}
                      onChange={(e) =>
                        setPwhtInput((prev) => ({ ...prev, sourServiceNace: e.target.checked }))
                      }
                      className="accent-rose-500"
                    />
                    <span className="text-rose-300 font-bold">
                      {isAr ? 'خدمة H₂S (NACE ≤248 HV)' : 'NACE H₂S (≤248 HV)'}
                    </span>
                  </label>
                </div>

                <label className="block space-y-1">
                  <div className="flex justify-between tabular-nums">
                    <span className={mutedText}>{isAr ? 'حرارة النقع المستهدفة:' : 'Soak Temp (°C):'}</span>
                    <span className="font-bold text-rose-400">
                      {pwhtInput.targetSoakC}°C (Allowed: {pwhtDerivatives.pSpec.minSoakC}–
                      {pwhtDerivatives.pSpec.maxSoakC}°C)
                    </span>
                  </div>
                  <input
                    type="range"
                    data-testid="pwht-soak-slider"
                    min={540}
                    max={790}
                    step={5}
                    value={pwhtInput.targetSoakC}
                    onChange={(e) =>
                      setPwhtInput((prev) => ({ ...prev, targetSoakC: Number(e.target.value) }))
                    }
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'معدل الصعود °C/hr:' : 'Ramp °C/hr:'}</span>
                      <span className="font-bold text-amber-400">
                        {pwhtInput.rampRateCPerHr} (≤{pwhtDerivatives.maxAllowedRampRate})
                      </span>
                    </div>
                    <input
                      type="range"
                      data-testid="pwht-ramp-slider"
                      min={60}
                      max={320}
                      step={5}
                      value={pwhtInput.rampRateCPerHr}
                      onChange={(e) =>
                        setPwhtInput((prev) => ({ ...prev, rampRateCPerHr: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between tabular-nums">
                      <span className={mutedText}>{isAr ? 'تباين القنوات ΔT:' : 'TC Spread ΔT:'}</span>
                      <span className="font-bold text-sky-400">{pwhtInput.tcSpreadDeltaC}°C</span>
                    </div>
                    <input
                      type="range"
                      data-testid="pwht-delta-slider"
                      min={4}
                      max={45}
                      step={1}
                      value={pwhtInput.tcSpreadDeltaC}
                      onChange={(e) =>
                        setPwhtInput((prev) => ({ ...prev, tcSpreadDeltaC: Number(e.target.value) }))
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <div className="flex justify-between tabular-nums">
                    <span className={mutedText}>{isAr ? 'زمن النقع (دقيقة):' : 'Soak Hold (min):'}</span>
                    <span className="font-bold text-emerald-400">
                      {pwhtInput.soakHoldMin}m (Min: {pwhtDerivatives.minRequiredHoldMin}m)
                    </span>
                  </div>
                  <input
                    type="range"
                    data-testid="pwht-hold-slider"
                    min={15}
                    max={180}
                    step={5}
                    value={pwhtInput.soakHoldMin}
                    onChange={(e) =>
                      setPwhtInput((prev) => ({ ...prev, soakHoldMin: Number(e.target.value) }))
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Snapshot + XP Button */}
            <button
              type="button"
              data-testid="vtmtptpwht-capture-xp-btn"
              onClick={handleCaptureSnapshotAndXp}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? 'توثيق لقطة AR+3D+4D واعتماد سجل التدريب (XP)'
                  : 'Capture AR+3D+4D Snapshot & Log XP'}
              </span>
            </button>

            {loggedXpBanner && (
              <div
                data-testid="vtmtptpwht-xp-banner"
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center justify-between gap-2 text-xs text-emerald-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{loggedXpBanner.verdictLabel}</span>
                </div>
                <span className="font-mono font-black text-emerald-300 tabular-nums">
                  +{loggedXpBanner.xpEarned} XP
                </span>
              </div>
            )}

            {capturedSnapshotUrl && (
              <div
                data-testid="vtmtptpwht-snapshot-preview"
                className="rounded-xl border border-slate-700/80 p-2.5 space-y-2 bg-slate-950/60"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span>{isAr ? 'معاينة التقرير المصوّر:' : 'Captured AR+3D+4D Frame:'}</span>
                  <a
                    href={capturedSnapshotUrl}
                    download={`insco-ar4d-${activeMeta.id}.png`}
                    className="inline-flex items-center gap-1 text-sky-400 hover:underline font-bold"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'تحميل PNG' : 'Download PNG'}</span>
                  </a>
                </div>
                <img
                  src={capturedSnapshotUrl}
                  alt="AR 3D 4D inspection snapshot"
                  className="w-full rounded-lg border border-slate-800 object-cover max-h-36"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIVE MULTI-CODE ACCEPTANCE REVIEW BOARD (ALL 5 CODES FOR SELECTED DISCIPLINE) */}
      <div
        data-testid="vtmtptpwht-codes-review-board"
        className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${subCardClass}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/30 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
            <h4 className="text-sm sm:text-base font-black">
              {isAr
                ? `مصفوفة مراجعة جميع الأكواد الهندسية لتخصص (${activeMeta.shortCode})`
                : `Live Multi-Code Acceptance Matrix (${activeMeta.shortCode})`}
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
            {passCount} / {telemetry.codeReviews.length}{' '}
            {isAr ? 'كود مطابق' : 'Codes Compliant'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {telemetry.codeReviews.map((item) => (
            <article
              key={item.codeId}
              data-testid={`code-review-${item.codeId}`}
              className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between gap-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-black text-white">{item.codeName}</div>
                    <div className="text-[11px] font-mono text-sky-400">{item.clauseRef}</div>
                  </div>
                </div>

                <div>
                  {renderVerdictBadge(
                    item.verdict,
                    isAr ? item.verdictLabelAr : item.verdictLabelEn
                  )}
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  <span className="text-slate-400 font-bold">
                    {isAr ? 'الشرط: ' : 'Limit: '}
                  </span>
                  {isAr ? item.requirementAr : item.requirementEn}
                </div>

                <div className="text-[11px] font-mono text-amber-300 bg-slate-950/90 rounded px-2 py-1 border border-slate-800">
                  {isAr ? item.measuredSummaryAr : item.measuredSummaryEn}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 leading-relaxed">
                {isAr ? item.remediationAr : item.remediationEn}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
