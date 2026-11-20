import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  Eye,
  Flame,
  FlipHorizontal,
  Layers,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  WORKSHOP_AR4D_BRANCHES,
  WorkshopAr4dBranchId,
  computeWorkshop4dTelemetry,
} from '../../../data/workshopAr4dBranchesData';
import { ArBackdropMode, WorkshopAr4dThreeScene } from './WorkshopAr4dThreeScene';

export interface WorkshopAr4dAllBranchesLabProps {
  language: Language;
  initialBranchId?: WorkshopAr4dBranchId;
  onBackToQuickAr?: () => void;
}

type StreamState = 'idle' | 'requesting' | 'active' | 'error';

function renderBranchIcon(id: WorkshopAr4dBranchId) {
  switch (id) {
    case 'ut_paut':
      return <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'rt_gamma_xray':
      return <Radio className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'vt_pt_mt_surface':
      return <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'et_mfl_tubing':
      return <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'pwht_metallurgy':
      return <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'welding_hydro':
      return <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'api_coating_corrosion':
      return <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'asset_integrity_irata':
      return <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
}

export const WorkshopAr4dAllBranchesLab: React.FC<WorkshopAr4dAllBranchesLabProps> = ({
  language,
  initialBranchId = 'ut_paut',
  onBackToQuickAr,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  const [selectedBranchId, setSelectedBranchId] = useState<WorkshopAr4dBranchId>(initialBranchId);
  const activeBranch = useMemo(
    () => WORKSHOP_AR4D_BRANCHES.find((b) => b.id === selectedBranchId) ?? WORKSHOP_AR4D_BRANCHES[0],
    [selectedBranchId]
  );

  // Calibrated branch variables initialized per branch defaults
  const [param1, setParam1] = useState<number>(activeBranch.param1Default);
  const [param2, setParam2] = useState<number>(activeBranch.param2Default);

  useEffect(() => {
    setSelectedBranchId(initialBranchId);
  }, [initialBranchId]);

  useEffect(() => {
    setParam1(activeBranch.param1Default);
    setParam2(activeBranch.param2Default);
  }, [activeBranch]);

  // 4D Timeline & Playback State
  const [timePct, setTimePct] = useState<number>(42);
  const [isPlaying4d, setIsPlaying4d] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2>(1);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(true);

  // AR Backdrop & Camera MediaDevices API
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [backdropMode, setBackdropMode] = useState<ArBackdropMode>('pipe');
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');

  // Spatial AR Alignment
  const [arScalePct, setArScalePct] = useState<number>(100);
  const [arRotationDeg, setArRotationDeg] = useState<number>(0);

  // Snapshot & XP Log
  const [capturedSnapshotUrl, setCapturedSnapshotUrl] = useState<string | null>(null);
  const [loggedXpBanner, setLoggedXpBanner] = useState<{
    xpEarned: number;
    codeVerdict: string;
  } | null>(null);

  // 4D timeline auto-advance timer (respects prefers-reduced-motion)
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
          // Ignore track stop errors
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
            ? 'كاميرا الويب (MediaDevices API) غير متاحة في هذا السياق. يمكنك المتابعة باستخدام لوحة الأنبوب المعايرة أو استوديو 3D.'
            : 'Web MediaDevices API is unavailable in this browser context. Continue with Calibration Pipe AR or 3D Studio backdrop.'
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
        const primary = stream.getVideoTracks()[0];
        setActiveCameraLabel(
          primary?.label || (isAr ? 'كاميرا الفحص الميداني الحية' : 'Live Field Inspection Cam')
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
            ? `تعذّر فتح الكاميرا (${errName}). تم إبقاء لوحة المعايرة AR مفعّلة لاختبار جميع الفروع بـ 4D.`
            : `Unable to start camera (${errName}). Calibration Pipe AR remains active across all 8 4D branches.`
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
  const telemetry = useMemo(
    () => computeWorkshop4dTelemetry(activeBranch, timeProgress01, param1, param2),
    [activeBranch, timeProgress01, param1, param2]
  );

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
          // Keep deep obsidian fill
        }
      }

      // Draw WebGL 3D+4D frame if mounted canvas exists
      const webglCanvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="workshop-ar4d-three-canvas"] canvas'
      );
      if (webglCanvas) {
        try {
          ctx.drawImage(webglCanvas, 0, 0, 1280, 720);
        } catch {
          // Ignore canvas taint if any
        }
      }

      // Metadata inspection footer stamp
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
      ctx.fillRect(0, 636, 1280, 84);
      ctx.fillStyle = activeBranch.accentHex;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `INSCO AR+4D · ${activeBranch.shortCode} · t=${Math.round(timePct)}% · ${telemetry.metric1Value} · ${telemetry.metric2Value}`,
        28,
        672
      );
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px monospace';
      ctx.fillText(
        `${activeBranch.standardRef} · ${telemetry.codePass ? 'PASS' : 'ADJUST'} · ${new Date().toISOString()}`,
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
      simulatorId: `ar4d_${activeBranch.id}`,
      targetSubTab: 'sim_labs_ar',
      simulatorTitle: {
        ar: `محاكي AR + 4D: ${activeBranch.titleAr}`,
        en: `AR + 4D Workshop: ${activeBranch.titleEn}`,
      },
      ndtMethod: activeBranch.ndtMethod,
      defectTypes: [
        {
          id: `${activeBranch.id}_phase_${telemetry.phaseIndex}`,
          ar: telemetry.activePhaseLabelAr,
          en: telemetry.activePhaseLabelEn,
        },
      ],
      status: telemetry.codePass ? 'PASS' : 'FAIL',
      codeVerdict: telemetry.codePass ? 'ACCEPT' : 'REJECT',
      traineeVerdict: telemetry.codePass ? 'ACCEPT' : 'REJECT',
      codeStandard: activeBranch.standardRef,
      scorePct: telemetry.codePass ? 96 : 78,
    });

    setLoggedXpBanner({
      xpEarned: record.xpEarned,
      codeVerdict: isAr ? telemetry.codeVerdictAr : telemetry.codeVerdictEn,
    });
  };

  const shellClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const subCardClass = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <section
      data-testid="workshop-ar4d-all-branches-lab"
      className={`rounded-2xl border p-4 sm:p-6 space-y-5 ${shellClass}`}
      aria-label={
        isAr
          ? 'منظومة محاكيات الورشة AR + 4D لجميع فروع العمل الهندسية الثمانية'
          : 'All-8 Work Branches AR + 4D Workshop Simulators'
      }
    >
      {/* Top Header & AR Backdrop Mode Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-700/30 pb-4">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-500 mb-1">
            <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isAr
                ? 'محاكاة 4D زمنية + واقع معزز ثلاثي الأبعاد (WebGL + MediaDevices)'
                : '4D Temporal Physics + Live Camera WebGL AR Suite'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            {isAr
              ? 'جميع محاكيات الورشة لكل فروع العمل بالواقع المعزز والـ 4D (8 فروع)'
              : 'All Workshop Simulators Across All 8 Branches (AR + 4D)'}
          </h3>
          <p className={`mt-1 text-xs sm:text-sm leading-relaxed ${mutedText}`}>
            {isAr
              ? 'تصفّح تطور الفحص عبر الزمن (t = 0% → 100%) مع تراكب 3D شفاف فوق بث الكاميرا الحية أو عينة الأنبوب لكافة فروع الفحص واللحام والمعالجة الحرارية والسلامة.'
              : 'Scrub chronological 4D inspection physics (t = 0% → 100%) with transparent WebGL 3D overlays locked onto live camera feeds across all 8 INSCO disciplines.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onBackToQuickAr && (
            <button
              type="button"
              data-testid="ar4d-back-to-quick-btn"
              onClick={() => {
                stopMediaTracks();
                onBackToQuickAr();
              }}
              className={`min-w-0 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-cyan-400'
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'العودة للتراكب السريع' : 'Back to Quick AR'}</span>
            </button>
          )}

          {streamState !== 'active' ? (
            <button
              type="button"
              data-testid="ar4d-start-camera-btn"
              onClick={() => void startLiveCamera()}
              disabled={streamState === 'requesting'}
              className="min-w-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {streamState === 'requesting'
                  ? isAr
                    ? 'جاري تفعيل الكاميرا...'
                    : 'Requesting Cam...'
                  : isAr
                  ? 'تشغيل الكاميرا AR'
                  : 'Start AR Camera'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="ar4d-stop-camera-btn"
              onClick={handleStopCamera}
              className="min-w-0 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <CameraOff className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="ar4d-backdrop-pipe-btn"
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
            <span>{isAr ? 'خلفية الأنبوب AR' : 'Calibration Pipe'}</span>
          </button>

          <button
            type="button"
            data-testid="ar4d-backdrop-studio-btn"
            onClick={() => {
              if (streamState === 'active') handleStopCamera();
              setBackdropMode('studio3d');
            }}
            className={`min-w-0 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              backdropMode === 'studio3d' && streamState !== 'active'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                : isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-400'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'استوديو 3D مظلم' : '3D Dark Studio'}</span>
          </button>
        </div>
      </div>

      {/* Camera error alert banner */}
      {streamState === 'error' && cameraErrorMsg && (
        <div
          role="alert"
          data-testid="ar4d-camera-error"
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

      {/* ALL 8 INSCO WORK BRANCHES SELECTOR GRID */}
      <div
        data-testid="ar4d-branch-selector-grid"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 min-w-0"
      >
        {WORKSHOP_AR4D_BRANCHES.map((branch) => {
          const isActive = branch.id === activeBranch.id;
          return (
            <button
              key={branch.id}
              type="button"
              data-testid={`ar4d-branch-${branch.id}`}
              onClick={() => {
                setSelectedBranchId(branch.id);
                setTimePct(22);
              }}
              className={`min-w-0 p-3 rounded-xl border text-start transition cursor-pointer flex flex-col gap-1 ${
                isActive
                  ? `${branch.badgeClass} shadow-sm font-black`
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-cyan-400'
                  : 'bg-slate-950/85 border-slate-800 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 min-w-0">
                  {renderBranchIcon(branch.id)}
                  <span>{branch.orderLabel} · {branch.shortCode}</span>
                </span>
              </div>
              <div className="text-xs font-bold leading-snug">
                {isAr ? branch.titleAr : branch.titleEn}
              </div>
            </button>
          );
        })}
      </div>

      {/* TWO-ZONE SANDBOX: Spatial AR+4D Viewport (Left/Top) + Telemetry & Parameters (Right/Bottom) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ZONE 1: Live AR Camera Video + Three.js 3D/4D Transparent WebGL Viewport + Collapsible 4D Dock */}
        <div className="xl:col-span-8 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-[#050a18] aspect-video min-h-[340px] shadow-xl">
            {/* Layer 1: Underlying Real Live Camera Stream */}
            <video
              ref={videoRef}
              data-testid="ar4d-live-video"
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                streamState === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${isMirrored ? '-scale-x-100' : ''}`}
            />

            {/* Layer 1B: Metallic Calibration Pipe Backdrop when not streaming live camera */}
            {streamState !== 'active' && backdropMode === 'pipe' && (
              <svg
                viewBox="0 0 1280 720"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="ar4dSteelPipeBg" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#ar4dSteelPipeBg)"
                  opacity="0.72"
                />
                <rect
                  x="612"
                  y="195"
                  width="56"
                  height="330"
                  fill="#475569"
                  opacity="0.58"
                />
              </svg>
            )}

            {/* Layer 2: Real Three.js 3D + 4D Alpha-Composited Engine */}
            <div className="absolute inset-0 z-10">
              <WorkshopAr4dThreeScene
                language={language}
                branchId={activeBranch.id}
                timeProgress01={timeProgress01}
                param1={param1}
                param2={param2}
                accentHex={activeBranch.accentHex}
                backdropMode={streamState === 'active' ? 'camera' : backdropMode}
                arScalePct={arScalePct}
                arRotationDeg={arRotationDeg}
                telemetry={telemetry}
              />
            </div>

            {/* Minimal Top HUD Strip (No backdrop-blur over WebGL, no animate-pulse dots) */}
            <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-100 flex items-center gap-2 pointer-events-auto">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeBranch.accentHex }}
                />
                <span className="font-bold">{activeBranch.shortCode}</span>
                <span className="text-slate-400">·</span>
                <span className="text-cyan-300">{activeBranch.standardRef}</span>
                {streamState === 'active' && activeCameraLabel && (
                  <>
                    <span className="text-slate-400">·</span>
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
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-cyan-400 cursor-pointer flex items-center gap-1"
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
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-cyan-400 cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'تبديل العدسة' : 'Lens'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMirrored((m) => !m)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-cyan-400 cursor-pointer flex items-center gap-1"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'عكس' : 'Flip'}</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  data-testid="ar4d-dock-toggle"
                  onClick={() => setIsDockExpanded((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs font-bold text-cyan-300 hover:border-cyan-400 cursor-pointer flex items-center gap-1"
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
                data-testid="ar4d-bottom-dock"
                className="absolute bottom-3 inset-x-3 z-20 rounded-xl bg-slate-950/92 border border-slate-700/90 p-3 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="ar4d-play-toggle"
                      onClick={() => setIsPlaying4d((p) => !p)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {isPlaying4d ? (
                        <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isPlaying4d
                          ? isAr
                            ? 'إيقاف 4D'
                            : 'Pause 4D'
                          : isAr
                          ? 'تشغيل 4D'
                          : 'Play 4D'}
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
                    <span className="text-cyan-400">({Math.round(timePct)}%)</span>
                  </div>
                </div>

                {/* Continuous 4D Timeline Scrubber */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">t₀</span>
                  <input
                    type="range"
                    data-testid="ar4d-timeline-scrubber"
                    aria-label={isAr ? 'شريط الزمن 4D' : '4D Timeline Scrubber'}
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(timePct)}
                    onChange={(e) => {
                      setIsPlaying4d(false);
                      setTimePct(Number(e.target.value));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">100%</span>
                </div>

                {/* 4 Clickable Chronological 4D Milestones */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {activeBranch.phases.map((phase, idx) => {
                    const isActiveMilestone = telemetry.phaseIndex === idx;
                    return (
                      <button
                        key={phase.progressPct}
                        type="button"
                        data-testid={`ar4d-phase-btn-${idx}`}
                        onClick={() => {
                          setIsPlaying4d(false);
                          setTimePct(phase.progressPct);
                        }}
                        className={`min-w-0 px-2 py-1.5 rounded-lg border text-start text-[11px] font-mono transition cursor-pointer ${
                          isActiveMilestone
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold">
                          t={phase.progressPct}% · {isAr ? phase.labelAr : phase.labelEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Snapshot Preview Card (When captured) */}
          {capturedSnapshotUrl && (
            <div
              data-testid="ar4d-snapshot-preview"
              className={`rounded-xl border p-4 flex flex-col sm:flex-row items-center gap-4 ${subCardClass}`}
            >
              <img
                src={capturedSnapshotUrl}
                alt={isAr ? 'لقطة التوثيق الميدانية AR + 4D' : 'Annotated AR + 4D snapshot'}
                className="w-full sm:w-52 rounded-lg border border-slate-700 object-cover aspect-video"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="text-sm font-black text-emerald-400">
                  {isAr
                    ? 'تم حفظ لقطة AR+4D الموثقة هندسياً بنجاح'
                    : 'Annotated AR+4D Field Snapshot Captured'}
                </div>
                <p className={`text-xs ${mutedText}`}>
                  {isAr ? activeBranch.equipmentAr : activeBranch.equipmentEn} · {activeBranch.standardRef}
                </p>
                <a
                  href={capturedSnapshotUrl}
                  download={`insco-ar4d-${activeBranch.id}.png`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'تنزيل صورة التوثيق PNG' : 'Download Inspection PNG'}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ZONE 2: Live Physics Telemetry, Parameters & Code Compliance Verdict */}
        <div className="xl:col-span-4 space-y-4">
          {/* Active Branch Equipment Card */}
          <div className={`rounded-2xl border p-4 space-y-3 ${subCardClass}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-cyan-400">{activeBranch.standardRef}</div>
                <h4 className="text-base font-black leading-snug mt-0.5">
                  {isAr ? activeBranch.titleAr : activeBranch.titleEn}
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>
                  {isAr ? activeBranch.subtitleAr : activeBranch.subtitleEn}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-300">
              {isAr ? activeBranch.equipmentAr : activeBranch.equipmentEn}
            </div>

            {/* Live 4D Code Telemetry Readouts */}
            <div data-testid="ar4d-telemetry-cards" className="grid grid-cols-1 gap-2">
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  {isAr ? telemetry.metric1LabelAr : telemetry.metric1LabelEn}
                </span>
                <span className="text-sm font-mono font-black text-cyan-300 tabular-nums">
                  {telemetry.metric1Value}
                </span>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  {isAr ? telemetry.metric2LabelAr : telemetry.metric2LabelEn}
                </span>
                <span className="text-sm font-mono font-black text-amber-300 tabular-nums">
                  {telemetry.metric2Value}
                </span>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  {isAr ? telemetry.metric3LabelAr : telemetry.metric3LabelEn}
                </span>
                <span className="text-sm font-mono font-black text-emerald-300 tabular-nums">
                  {telemetry.metric3Value}
                </span>
              </div>
            </div>

            {/* Code Pass / Reject Verdict Banner */}
            <div
              data-testid="ar4d-code-verdict"
              className={`rounded-xl border p-3 flex items-center gap-2 text-xs font-bold ${
                telemetry.codePass
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {telemetry.codePass ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{isAr ? telemetry.codeVerdictAr : telemetry.codeVerdictEn}</span>
            </div>
          </div>

          {/* Continuous Engineering Variables & Spatial AR Controls */}
          <div className={`rounded-2xl border p-4 space-y-3.5 ${subCardClass}`}>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <Sliders className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? 'ضبط المتغيرات الهندسية ومحاذات AR' : 'Engineering Variables & AR Alignment'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{isAr ? activeBranch.param1LabelAr : activeBranch.param1LabelEn}</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {param1} {activeBranch.param1Unit}
                </span>
              </div>
              <input
                type="range"
                data-testid="ar4d-param1-slider"
                aria-label={isAr ? activeBranch.param1LabelAr : activeBranch.param1LabelEn}
                min={activeBranch.param1Min}
                max={activeBranch.param1Max}
                step={activeBranch.param1Step}
                value={param1}
                onChange={(e) => setParam1(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{isAr ? activeBranch.param2LabelAr : activeBranch.param2LabelEn}</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  {param2} {activeBranch.param2Unit}
                </span>
              </div>
              <input
                type="range"
                data-testid="ar4d-param2-slider"
                aria-label={isAr ? activeBranch.param2LabelAr : activeBranch.param2LabelEn}
                min={activeBranch.param2Min}
                max={activeBranch.param2Max}
                step={activeBranch.param2Step}
                value={param2}
                onChange={(e) => setParam2(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/70">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>{isAr ? 'حجم تراكب AR' : 'AR Scale'}</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{arScalePct}%</span>
                </div>
                <input
                  type="range"
                  aria-label={isAr ? 'حجم تراكب AR' : 'AR Scale'}
                  min={65}
                  max={135}
                  step={5}
                  value={arScalePct}
                  onChange={(e) => setArScalePct(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>{isAr ? 'دوران الأفق AR' : 'AR Yaw'}</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{arRotationDeg}°</span>
                </div>
                <input
                  type="range"
                  aria-label={isAr ? 'دوران الأفق AR' : 'AR Yaw'}
                  min={-45}
                  max={45}
                  step={3}
                  value={arRotationDeg}
                  onChange={(e) => setArRotationDeg(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              data-testid="ar4d-record-xp-btn"
              onClick={handleCaptureSnapshotAndXp}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? 'التقاط لقطة AR+4D وتوثيق الفحص (+XP)'
                  : 'Capture AR+4D Snapshot & Log XP'}
              </span>
            </button>

            {loggedXpBanner && (
              <div
                data-testid="ar4d-xp-logged-banner"
                className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-2.5 text-xs font-bold text-emerald-300 flex items-center justify-between gap-2"
              >
                <span>{loggedXpBanner.codeVerdict}</span>
                <span className="font-mono font-black text-amber-300 tabular-nums">
                  +{loggedXpBanner.xpEarned} XP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
