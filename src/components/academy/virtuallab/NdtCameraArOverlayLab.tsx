import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Download,
  Pause,
  Play,
  FlipHorizontal,
  Crosshair,
  Radio,
  Activity,
  Ruler,
  RotateCcw,
  Award,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Layers,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt, SimulationNdtMethod } from '../../../utils/simulationHistoryStore';
import { RtExposureTechniqueMode, getAsmeMaxUgMm } from '../../../data/rtTechniquesPhysics';
import { ArCompleteRtCodeSimulator } from './ArCompleteRtCodeSimulator';

export type NdtArOverlayDiscipline = 'rt_exposure' | 'ut_skip_beam' | 'vt_mt_gauge';
export type CameraStreamState = 'idle' | 'requesting' | 'active' | 'error' | 'calibration_feed';

export interface NdtCameraArOverlayLabProps {
  language: Language;
  initialOverlayDiscipline?: NdtArOverlayDiscipline;
  initialRtTechnique?: RtExposureTechniqueMode;
  initialPipeOdMm?: number;
  initialWallMm?: number;
  initialSfdMm?: number;
  initialFocalSpotMm?: number;
  initialAxialOffsetMm?: number;
}

interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

function selectAsmeIqiDesignation(wallMm: number): string {
  if (wallMm <= 6.4) return 'ASME 1A (#5 · 0.13 mm)';
  if (wallMm <= 9.5) return 'ASME 1B (#6 · 0.16 mm)';
  if (wallMm <= 12.7) return 'ASME 1B (#7 · 0.20 mm)';
  if (wallMm <= 19.0) return 'ASME 1B (#8 · 0.25 mm)';
  if (wallMm <= 25.4) return 'ASME 1B (#9 · 0.32 mm)';
  return 'ASME 1B (#10 · 0.40 mm)';
}

export const NdtCameraArOverlayLab: React.FC<NdtCameraArOverlayLabProps> = ({
  language,
  initialOverlayDiscipline = 'rt_exposure',
  initialRtTechnique = 'panoramic',
  initialPipeOdMm = 219.1,
  initialWallMm = 9.5,
  initialSfdMm = 450,
  initialFocalSpotMm = 3.0,
  initialAxialOffsetMm = 95,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  // MediaDevices & Video Stream Refs/State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageSvgRef = useRef<SVGSVGElement | null>(null);

  const [streamState, setStreamState] = useState<CameraStreamState>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<VideoDeviceOption[]>([]);
  const [activeResolution, setActiveResolution] = useState<{ w: number; h: number }>({
    w: 1280,
    h: 720,
  });
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  // Toggle into the Complete AR RT Techniques, 18 Film Defects & All-Codes Acceptance Simulator
  const [showCompleteRtCodes, setShowCompleteRtCodes] = useState<boolean>(false);

  // NDT Technical Overlay Mode & Synced Parameters
  const [overlayDiscipline, setOverlayDiscipline] =
    useState<NdtArOverlayDiscipline>(initialOverlayDiscipline);
  const [rtTechnique, setRtTechnique] = useState<RtExposureTechniqueMode>(initialRtTechnique);
  const [pipeOdMm, setPipeOdMm] = useState<number>(initialPipeOdMm);
  const [wallMm, setWallMm] = useState<number>(initialWallMm);
  const [sfdMm, setSfdMm] = useState<number>(initialSfdMm);
  const [focalSpotMm, setFocalSpotMm] = useState<number>(initialFocalSpotMm);
  const [axialOffsetMm, setAxialOffsetMm] = useState<number>(initialAxialOffsetMm);

  // UT Angle-Beam Specific Parameters
  const [utRefractedAngleDeg, setUtRefractedAngleDeg] = useState<45 | 60 | 70>(60);
  const [utProbeStandOffRatio, setUtProbeStandOffRatio] = useState<number>(1.0); // 1.0 = Half-skip (root), 2.0 = Full-skip (cap)

  // VT / MT Specific Parameters
  const [vtMeasuredCapMm, setVtMeasuredCapMm] = useState<number>(2.4);
  const [mtYokeSpacingMm, setMtYokeSpacingMm] = useState<number>(110);
  const [mtOrientationDeg, setMtOrientationDeg] = useState<0 | 90>(0);

  // Spatial HUD Alignment Controls (ViewBox 1280 x 720)
  const [anchorX, setAnchorX] = useState<number>(640);
  const [anchorY, setAnchorY] = useState<number>(380);
  const [overlayScalePct, setOverlayScalePct] = useState<number>(100);
  const [overlayRotationDeg, setOverlayRotationDeg] = useState<number>(0);
  const [hudOpacityPct, setHudOpacityPct] = useState<number>(92);
  const [showGridReticle, setShowGridReticle] = useState<boolean>(true);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState<boolean>(false);

  // Annotated Field Snapshot & XP Logging
  const [capturedSnapshotUrl, setCapturedSnapshotUrl] = useState<string | null>(null);
  const [loggedXpBanner, setLoggedXpBanner] = useState<{
    xpEarned: number;
    methodLabel: string;
  } | null>(null);

  // Sync incoming RT props when parent workbench changes parameters
  useEffect(() => {
    setRtTechnique(initialRtTechnique);
  }, [initialRtTechnique]);

  useEffect(() => {
    setPipeOdMm(initialPipeOdMm);
  }, [initialPipeOdMm]);

  useEffect(() => {
    setWallMm(initialWallMm);
  }, [initialWallMm]);

  useEffect(() => {
    setSfdMm(initialSfdMm);
  }, [initialSfdMm]);

  useEffect(() => {
    setFocalSpotMm(initialFocalSpotMm);
  }, [initialFocalSpotMm]);

  useEffect(() => {
    setAxialOffsetMm(initialAxialOffsetMm);
  }, [initialAxialOffsetMm]);

  // Stop active MediaStream tracks cleanly
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
    };
  }, [stopMediaTracks]);

  const refreshVideoDevices = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.enumerateDevices !== 'function'
    ) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label:
            d.label ||
            (isAr ? `كاميرا الفحص #${idx + 1}` : `Inspection Camera #${idx + 1}`),
        }));
      setVideoDevices(cams);
    } catch {
      // Enumeration optional
    }
  }, [isAr]);

  const startLiveCamera = useCallback(
    async (overrideFacing?: 'environment' | 'user', overrideDeviceId?: string) => {
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
            ? 'واجهة برمجة تطبيقات الوسائط (MediaDevices.getUserMedia) غير مدعومة في هذا المتصفح أو السياق غير الآمن. يمكنك تفعيل وضع لوحة المعاينة التجريبية بالأسفل لاختبار التراكب الهندسي.'
            : 'Web MediaDevices API (navigator.mediaDevices.getUserMedia) is unavailable in this browser context. You can enable the Calibration Backdrop mode below to test all NDT AR overlays.'
        );
        return;
      }

      stopMediaTracks();
      setStreamState('requesting');

      const targetFacing = overrideFacing ?? facingMode;
      const targetDevice = overrideDeviceId !== undefined ? overrideDeviceId : selectedDeviceId;

      const videoConstraints: MediaTrackConstraints = targetDevice
        ? {
            deviceId: { exact: targetDevice },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = mediaStream;
        const primaryTrack = mediaStream.getVideoTracks()[0];
        if (primaryTrack) {
          const settings = primaryTrack.getSettings ? primaryTrack.getSettings() : {};
          if (settings.width && settings.height) {
            setActiveResolution({ w: settings.width, h: settings.height });
          }
          setActiveCameraLabel(
            primaryTrack.label ||
              (targetFacing === 'environment'
                ? isAr
                  ? 'الكاميرا الخلفية (بيئة العمل)'
                  : 'Rear Environment Camera'
                : isAr
                ? 'الكاميرا الأمامية'
                : 'Front Camera')
          );
        }

        setStreamState('active');
        await refreshVideoDevices();

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch {
            // AutoPlay handled by muted attribute
          }
        }
      } catch (err: unknown) {
        const errName = err instanceof Error ? err.name : 'CameraError';
        setStreamState('error');
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraErrorMsg(
            isAr
              ? 'تم رفض إذن الوصول إلى الكاميرا. يرجى السماح بصلاحية الكاميرا في المتصفح ثم الضغط على إعادة المحاولة، أو استخدام وضع المعاينة التجريبية.'
              : 'Camera permission was denied. Please grant camera access in your browser and click Retry, or launch the Calibration Backdrop.'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setCameraErrorMsg(
            isAr
              ? 'لم يتم العثور على كاميرا متصلة بهذا الجهاز. يمكنك تشغيل وضع لوحة المعاينة التجريبية لتجربة عناصر تراكب NDT كاملة.'
              : 'No physical camera device was detected on this machine. Launch the Calibration Backdrop below to interact with all NDT AR overlays.'
          );
        } else {
          setCameraErrorMsg(
            isAr
              ? `تعذّر فتح بث الكاميرا (${errName}). تأكد من عدم انشغال الكاميرا بتطبيق آخر أو استخدم وضع المعاينة التجريبية.`
              : `Unable to initialize camera stream (${errName}). Verify no other app is locking the camera or use the Calibration Backdrop.`
          );
        }
      }
    },
    [facingMode, isAr, refreshVideoDevices, selectedDeviceId, stopMediaTracks]
  );

  // Ensure <video> attaches streamRef whenever videoRef mounts in 'active' state
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
    setIsFrozen(false);
    setStreamState('idle');
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

  const handleSwitchFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    setIsMirrored(nextFacing === 'user');
    if (streamState === 'active') {
      void startLiveCamera(nextFacing, '');
    }
  };

  const handleResetHudAlignment = () => {
    setAnchorX(640);
    setAnchorY(380);
    setOverlayScalePct(100);
    setOverlayRotationDeg(0);
    setHudOpacityPct(92);
  };

  // Pointer drag on SVG viewBox (1280 x 720) to position NDT overlay over real-world weld
  const updateAnchorFromPointer = (clientX: number, clientY: number) => {
    if (!stageSvgRef.current) return;
    const rect = stageSvgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const normX = Math.max(120, Math.min(1160, ((clientX - rect.left) / rect.width) * 1280));
    const normY = Math.max(110, Math.min(620, ((clientY - rect.top) / rect.height) * 720));
    setAnchorX(Math.round(normX));
    setAnchorY(Math.round(normY));
  };

  // Physics Calculations for Active NDT Overlay
  const rtHudPhysics = useMemo(() => {
    const effectiveSfd =
      rtTechnique === 'panoramic' ? Math.max(25, Math.round(pipeOdMm / 2)) : sfdMm;
    const objToFilm =
      rtTechnique === 'elliptical' ? pipeOdMm + 2 : wallMm + 2;
    const rayDist =
      rtTechnique === 'elliptical'
        ? Math.sqrt(effectiveSfd * effectiveSfd + axialOffsetMm * axialOffsetMm)
        : effectiveSfd;
    const sod = Math.max(15, rayDist - objToFilm);
    const ugMm = Number(((focalSpotMm * objToFilm) / sod).toFixed(3));
    const maxUgMm = getAsmeMaxUgMm(rtTechnique === 'elliptical' ? wallMm * 2 : wallMm);
    const passesUg = ugMm <= maxUgMm;
    const tiltDeg =
      rtTechnique === 'elliptical'
        ? Number(((Math.atan2(axialOffsetMm, effectiveSfd) * 180) / Math.PI).toFixed(1))
        : 0;
    const iqiLabel = selectAsmeIqiDesignation(wallMm);
    return {
      effectiveSfd,
      sod: Math.round(sod),
      ugMm,
      maxUgMm,
      passesUg,
      tiltDeg,
      iqiLabel,
    };
  }, [rtTechnique, pipeOdMm, wallMm, sfdMm, focalSpotMm, axialOffsetMm]);

  const utHudPhysics = useMemo(() => {
    const rad = (utRefractedAngleDeg * Math.PI) / 180;
    const halfSkipMm = Number((wallMm * Math.tan(rad)).toFixed(1));
    const fullSkipMm = Number((2 * wallMm * Math.tan(rad)).toFixed(1));
    const surfaceDistMm = Number((halfSkipMm * utProbeStandOffRatio).toFixed(1));
    const soundPathMm = Number(((wallMm / Math.cos(rad)) * utProbeStandOffRatio).toFixed(1));
    const rawDepth = wallMm * utProbeStandOffRatio;
    const reflectorDepthMm = Number(
      (utProbeStandOffRatio <= 1
        ? rawDepth
        : Math.max(0, 2 * wallMm - rawDepth)
      ).toFixed(1)
    );
    const echoFshPct = Math.round(
      Math.max(
        28,
        Math.min(
          96,
          92 - Math.abs(utProbeStandOffRatio - Math.round(utProbeStandOffRatio)) * 75
        )
      )
    );
    return {
      halfSkipMm,
      fullSkipMm,
      surfaceDistMm,
      soundPathMm,
      reflectorDepthMm,
      echoFshPct,
    };
  }, [wallMm, utRefractedAngleDeg, utProbeStandOffRatio]);

  const vtMtHudPhysics = useMemo(() => {
    // ASME B31.3 max weld reinforcement cap height rule
    const maxCapAllowedMm = wallMm <= 6.4 ? 1.5 : wallMm <= 12.7 ? 3.0 : 4.0;
    const capPasses = vtMeasuredCapMm <= maxCapAllowedMm;
    const yokeValid = mtYokeSpacingMm >= 75 && mtYokeSpacingMm <= 150;
    return {
      maxCapAllowedMm,
      capPasses,
      yokeValid,
    };
  }, [wallMm, vtMeasuredCapMm, mtYokeSpacingMm]);

  // Capture Annotated Snapshot (Composite Video Frame + Technical Vector HUD onto Canvas) & Log XP
  const handleCaptureAnnotatedSnapshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Draw Live Camera Video Frame or Calibration Steel Weld Backdrop
      if (
        streamState === 'active' &&
        videoRef.current &&
        videoRef.current.readyState >= 2
      ) {
        ctx.save();
        if (isMirrored) {
          ctx.translate(1280, 0);
          ctx.scale(-1, 1);
        }
        try {
          ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
        } catch {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 1280, 720);
        }
        ctx.restore();
      } else {
        // Steel pipe weld backdrop
        const grad = ctx.createLinearGradient(0, 0, 0, 720);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e293b');
        grad.addColorStop(1, '#090d16');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Simulated metallic weld seam band
        ctx.fillStyle = '#334155';
        ctx.fillRect(140, anchorY - 90, 1000, 180);
        ctx.fillStyle = '#475569';
        ctx.fillRect(140, anchorY - 18, 1000, 36);
      }

      // 2. Draw Technical Crosshair & Measurement Stamp onto Snapshot
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(120, anchorY);
      ctx.lineTo(1160, anchorY);
      ctx.moveTo(anchorX, 90);
      ctx.lineTo(anchorX, 630);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(anchorX - 180, anchorY - 100, 360, 200);

      // 3. Draw Bottom Scrim & Inspection Metadata Stamp
      ctx.fillStyle = 'rgba(2, 6, 23, 0.86)';
      ctx.fillRect(0, 636, 1280, 84);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px monospace';

      const summaryLine =
        overlayDiscipline === 'rt_exposure'
          ? `INSCO NDT AR · RT (${rtTechnique.toUpperCase()}) · OD ${pipeOdMm}mm · t ${wallMm}mm · SFD ${rtHudPhysics.effectiveSfd}mm · Ug ${rtHudPhysics.ugMm}mm`
          : overlayDiscipline === 'ut_skip_beam'
          ? `INSCO NDT AR · UT ${utRefractedAngleDeg}° · t ${wallMm}mm · 1/2 Skip ${utHudPhysics.halfSkipMm}mm · SP ${utHudPhysics.soundPathMm}mm · Depth ${utHudPhysics.reflectorDepthMm}mm`
          : `INSCO NDT AR · VT/MT · Cap ${vtMeasuredCapMm}mm (Max ${vtMtHudPhysics.maxCapAllowedMm}mm) · Yoke ${mtYokeSpacingMm}mm @ ${mtOrientationDeg}°`;

      ctx.fillText(summaryLine, 28, 672);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px monospace';
      ctx.fillText(
        `Captured: ${new Date().toISOString()} · Anchor (${anchorX}, ${anchorY}) · Scale ${overlayScalePct}%`,
        28,
        702
      );

      try {
        const url = canvas.toDataURL('image/png');
        setCapturedSnapshotUrl(url);
      } catch {
        setCapturedSnapshotUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      }
    }

    // Record XP in Simulation History Store
    const ndtMethod: SimulationNdtMethod =
      overlayDiscipline === 'rt_exposure'
        ? 'RT'
        : overlayDiscipline === 'ut_skip_beam'
        ? 'UT'
        : 'MT';

    const passesCode =
      overlayDiscipline === 'rt_exposure'
        ? rtHudPhysics.passesUg
        : overlayDiscipline === 'ut_skip_beam'
        ? true
        : vtMtHudPhysics.capPasses && vtMtHudPhysics.yokeValid;

    const record = recordSimulationAttempt({
      simulatorId: `ndt_ar_camera_${overlayDiscipline}`,
      targetSubTab: 'sim_labs_ar',
      simulatorTitle: {
        ar: 'تراكب الكاميرا الميداني لعناصر NDT (Media AR HUD)',
        en: 'Live Camera NDT Technical AR Overlay',
      },
      ndtMethod,
      defectTypes: [
        {
          id: overlayDiscipline,
          ar:
            overlayDiscipline === 'rt_exposure'
              ? `معايرة تصوير إشعاعي (${rtTechnique})`
              : overlayDiscipline === 'ut_skip_beam'
              ? `توقيع مسار الموجات ${utRefractedAngleDeg}°`
              : 'فحص بصري وجسيمات مغناطيسية',
          en:
            overlayDiscipline === 'rt_exposure'
              ? `RT Exposure Alignment (${rtTechnique})`
              : overlayDiscipline === 'ut_skip_beam'
              ? `UT ${utRefractedAngleDeg}° Skip Plotting`
              : 'VT Cap Gauge & MT Yoke Alignment',
        },
      ],
      status: passesCode ? 'PASS' : 'FAIL',
      codeVerdict: passesCode ? 'ACCEPT' : 'REJECT',
      traineeVerdict: passesCode ? 'ACCEPT' : 'REJECT',
      codeStandard:
        overlayDiscipline === 'rt_exposure'
          ? 'ASME Sec V Art. 2'
          : overlayDiscipline === 'ut_skip_beam'
          ? 'ASME Sec V Art. 4'
          : 'ASME B31.3 / Art. 7',
      scorePct: passesCode ? 95 : 76,
    });

    setLoggedXpBanner({
      xpEarned: record.xpEarned,
      methodLabel: ndtMethod,
    });
  };

  const shellBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const cardBg = isLight
    ? 'bg-slate-50 border-slate-200/90 text-slate-900'
    : 'bg-slate-950/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const scaleFactor = overlayScalePct / 100;
  const hudOpacity = Number((hudOpacityPct / 100).toFixed(2));
  const isLiveOrCalib = streamState === 'active' || streamState === 'calibration_feed';

  if (showCompleteRtCodes) {
    return (
      <section data-testid="ndt-camera-ar-overlay-lab" className="space-y-4">
        <ArCompleteRtCodeSimulator
          language={language}
          onBackToQuickAr={() => setShowCompleteRtCodes(false)}
        />
      </section>
    );
  }

  return (
    <section
      data-testid="ndt-camera-ar-overlay-lab"
      className={`rounded-2xl border p-5 sm:p-7 space-y-6 ${shellBg}`}
      aria-label={
        isAr
          ? 'مختبر تراكب الكاميرا الميداني لعناصر الفحص غير التدميري NDT'
          : 'NDT Live Camera Technical AR Overlay Lab'
      }
    >
      {/* Top Header & Discipline Overlay Mode Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/25">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-500 mb-1.5">
            <Camera className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'واجهة برمجة تطبيقات الوسائط · MediaDevices Web API'
                : 'MediaDevices Web API · Live Camera HUD'}
            </span>
            <span aria-hidden="true">·</span>
            <span>ASME Sec V Field Alignment</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            {isAr
              ? 'مختبر الكاميرا وتراكب عناصر NDT التقنية على البيئة الحقيقية'
              : 'Live Camera NDT Technical Overlay Lab (Real-Environment AR)'}
          </h3>
          <p className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${mutedText}`}>
            {isAr
              ? 'وجّه كاميرا جهازك نحو وصلة اللحام أو الماسورة الحقيقية لإسقاط مخروط الأشعة ومحددات IQI (في RT)، أو مسار القفزة النصفي والكامل ½S / 1S (في UT)، أو محددات التاج والفك المغناطيسي (في VT/MT) مباشرة فوق المشهد الحي.'
              : 'Point your device camera at a real pipe or weld joint to project RT beam cones & IQI markers, UT half/full skip paths, or VT/MT gauges directly onto your live environment.'}
          </p>
        </div>

        {/* Primary Camera Power Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="launch-ar-complete-rt-codes-btn"
            onClick={() => {
              stopMediaTracks();
              setStreamState('idle');
              setShowCompleteRtCodes(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>
              {isAr
                ? 'محاكي AR الشامل لتكنيكات وعيوب وأكواد RT'
                : 'Full AR RT Techniques, Defects & All Codes'}
            </span>
          </button>

          {streamState !== 'active' ? (
            <button
              type="button"
              data-testid="start-ndt-camera-btn"
              onClick={() => void startLiveCamera()}
              disabled={streamState === 'requesting'}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>
                {streamState === 'requesting'
                  ? isAr
                    ? 'جاري طلب إذن الكاميرا...'
                    : 'Requesting Camera...'
                  : isAr
                  ? 'تشغيل الكاميرا الحية'
                  : 'Start Live Camera'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="stop-ndt-camera-btn"
              onClick={handleStopCamera}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              <CameraOff className="w-4 h-4" />
              <span>{isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="toggle-calibration-backdrop-btn"
            onClick={() => {
              if (streamState === 'calibration_feed') {
                setStreamState('idle');
              } else {
                stopMediaTracks();
                setCameraErrorMsg('');
                setStreamState('calibration_feed');
              }
            }}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              streamState === 'calibration_feed'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-amber-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {isAr ? 'وضع لوحة المعاينة التجريبية' : 'Calibration Backdrop Mode'}
            </span>
          </button>
        </div>
      </div>

      {/* Discipline Overlay Segmented Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          data-testid="ar-mode-rt"
          onClick={() => setOverlayDiscipline('rt_exposure')}
          className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
            overlayDiscipline === 'rt_exposure'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
              : isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-400'
              : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>01 · RT RADIATION & IQI HUD</span>
          </div>
          <div className="text-sm font-black mt-1">
            {isAr
              ? 'تراكب التصوير الإشعاعي (Panorama · Ellipse · Street)'
              : 'RT Exposure Cone, SFD & IQI Overlay'}
          </div>
        </button>

        <button
          type="button"
          data-testid="ar-mode-ut"
          onClick={() => setOverlayDiscipline('ut_skip_beam')}
          className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
            overlayDiscipline === 'ut_skip_beam'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
              : isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-cyan-400'
              : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>02 · UT / PAUT SKIP & A-SCAN HUD</span>
          </div>
          <div className="text-sm font-black mt-1">
            {isAr
              ? 'تراكب مسار الموجات فوق الصوتية (½ Skip · Full Skip)'
              : 'UT Angle-Beam Skip Ruler & Live A-Scan'}
          </div>
        </button>

        <button
          type="button"
          data-testid="ar-mode-vt-mt"
          onClick={() => setOverlayDiscipline('vt_mt_gauge')}
          className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
            overlayDiscipline === 'vt_mt_gauge'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
              : isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-amber-400'
              : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <Ruler className="w-3.5 h-3.5 shrink-0" />
            <span>03 · VT WELD GAUGE & MT YOKE HUD</span>
          </div>
          <div className="text-sm font-black mt-1">
            {isAr
              ? 'تراكب مقاس تاج اللحام وخطوط الفيض المغناطيسي'
              : 'VT Crown Reinforcement & MT Yoke Flux'}
          </div>
        </button>
      </div>

      {/* Camera Permission / Device Error Callout */}
      {streamState === 'error' && cameraErrorMsg && (
        <div
          role="alert"
          data-testid="camera-error-alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{cameraErrorMsg}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void startLiveCamera()}
              className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry Camera'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCameraErrorMsg('');
                setStreamState('calibration_feed');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'تفعيل لوحة المعاينة' : 'Use Calibration Feed'}
            </button>
          </div>
        </div>
      )}

      {/* Two-Zone Educational Sandbox Layout: Left/Top 65% Camera AR Stage, Right/Bottom 35% Technical Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ZONE 1: Interactive Live Video + SVG Technical NDT AR Viewport (8 cols on XL) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-950 aspect-video select-none shadow-lg">
            {/* Underlying Real <video> Stream via MediaDevices API */}
            <video
              ref={videoRef}
              data-testid="ndt-ar-live-video"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                const vid = e.currentTarget;
                if (vid.videoWidth && vid.videoHeight) {
                  setActiveResolution({ w: vid.videoWidth, h: vid.videoHeight });
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                streamState === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${isMirrored ? '-scale-x-100' : ''}`}
            />

            {/* Realistic Metallic Pipe & Butt-Weld Calibration Backdrop when in Calibration Mode or Idle */}
            {streamState !== 'active' && (
              <svg
                viewBox="0 0 1280 720"
                className="absolute inset-0 w-full h-full object-cover"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="arPipeSteelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="28%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#64748b" />
                    <stop offset="72%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>
                  <linearGradient id="arWeldBeadGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>
                <rect width="1280" height="720" fill="#060913" />
                {/* Steel Pipe Cylinder Body */}
                <rect x="80" y="210" width="1120" height="340" rx="18" fill="url(#arPipeSteelGrad)" opacity={streamState === 'calibration_feed' ? 0.95 : 0.35} />
                {/* Circumferential / Longitudinal Butt Weld Seam */}
                <rect x="614" y="210" width="52" height="340" fill="url(#arWeldBeadGrad)" opacity={streamState === 'calibration_feed' ? 0.9 : 0.3} />
                {/* Subtle weld ripple chevrons */}
                {Array.from({ length: 14 }).map((_, idx) => (
                  <path
                    key={idx}
                    d={`M 616 ${225 + idx * 23} Q 640 ${216 + idx * 23} 664 ${225 + idx * 23}`}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    opacity={streamState === 'calibration_feed' ? 0.55 : 0.15}
                  />
                ))}
              </svg>
            )}

            {/* Interactive SVG Technical NDT Overlay Layer (Always Crisp Vector @ 1280x720) */}
            <svg
              ref={stageSvgRef}
              data-testid="ndt-ar-svg-overlay"
              viewBox="0 0 1280 720"
              onPointerDown={(e) => {
                if (!isLiveOrCalib) return;
                setIsDraggingAnchor(true);
                updateAnchorFromPointer(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!isDraggingAnchor || !isLiveOrCalib) return;
                updateAnchorFromPointer(e.clientX, e.clientY);
              }}
              onPointerUp={() => setIsDraggingAnchor(false)}
              onPointerLeave={() => setIsDraggingAnchor(false)}
              className={`relative z-10 w-full h-full ${
                isLiveOrCalib ? 'cursor-crosshair' : 'pointer-events-none opacity-45'
              }`}
            >
              {/* Optional Millimeter & Framing Reticle Grid */}
              {showGridReticle && (
                <g opacity={hudOpacity * 0.45} stroke="#38bdf8" strokeWidth="1">
                  <line x1="80" y1="360" x2="1200" y2="360" strokeDasharray="8 8" />
                  <line x1="640" y1="60" x2="640" y2="640" strokeDasharray="8 8" />
                  {/* Corner Viewfinder Brackets */}
                  <path d="M 48 96 L 48 48 L 96 48" fill="none" strokeWidth="3" />
                  <path d="M 1184 48 L 1232 48 L 1232 96" fill="none" strokeWidth="3" />
                  <path d="M 48 624 L 48 672 L 96 672" fill="none" strokeWidth="3" />
                  <path d="M 1184 672 L 1232 672 L 1232 624" fill="none" strokeWidth="3" />
                </g>
              )}

              {/* Transformed NDT Technical Overlay Anchored at (anchorX, anchorY) */}
              <g
                opacity={hudOpacity}
                transform={`translate(${anchorX}, ${anchorY}) rotate(${overlayRotationDeg}) scale(${scaleFactor})`}
              >
                {/* MODE 1: RT RADIATION CONE, PIPE OD, SFD & ASME IQI OVERLAY */}
                {overlayDiscipline === 'rt_exposure' && (
                  <g data-testid="ar-svg-rt-group">
                    {rtTechnique === 'panoramic' ? (
                      <>
                        {/* 360° Panoramic Circumferential Pipe Ring & Spider Center */}
                        <circle
                          cx="0"
                          cy="0"
                          r="175"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="3.5"
                          strokeDasharray="12 6"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="152"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        {/* Radial 360° Gamma Rays */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          const x2 = Math.round(Math.cos(rad) * 172);
                          const y2 = Math.round(Math.sin(rad) * 172);
                          return (
                            <line
                              key={deg}
                              x1="0"
                              y1="0"
                              x2={x2}
                              y2={y2}
                              stroke="#f59e0b"
                              strokeWidth="1.8"
                              strokeDasharray="5 5"
                            />
                          );
                        })}
                        {/* Central Isotope Focal Spot */}
                        <circle cx="0" cy="0" r="12" fill="#f59e0b" stroke="#020617" strokeWidth="3" />
                        <text
                          x="0"
                          y="-22"
                          textAnchor="middle"
                          fill="#fef08a"
                          fontSize="15"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          PANORAMA 360° · SFD = {rtHudPhysics.effectiveSfd} mm
                        </text>
                      </>
                    ) : rtTechnique === 'elliptical' ? (
                      <>
                        {/* DWDI Elliptical Offset Source & Tilted Beam Cone */}
                        <ellipse
                          cx="0"
                          cy="40"
                          rx="165"
                          ry="58"
                          fill="rgba(6, 182, 212, 0.10)"
                          stroke="#22d3ee"
                          strokeWidth="3"
                        />
                        {/* Offset Source Position */}
                        <line
                          x1="-130"
                          y1="-185"
                          x2="-160"
                          y2="40"
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                        />
                        <line
                          x1="-130"
                          y1="-185"
                          x2="160"
                          y2="40"
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                        />
                        <line
                          x1="-130"
                          y1="-185"
                          x2="0"
                          y2="40"
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="-130"
                          cy="-185"
                          r="11"
                          fill="#fbbf24"
                          stroke="#020617"
                          strokeWidth="3"
                        />
                        <text
                          x="-130"
                          y="-205"
                          textAnchor="middle"
                          fill="#fde68a"
                          fontSize="14"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          DWDI ELLIPSE · Offset L={axialOffsetMm}mm (θ={rtHudPhysics.tiltDeg}°)
                        </text>
                      </>
                    ) : (
                      <>
                        {/* 0° Perpendicular Straight / Street Beam Cone */}
                        <polygon
                          points="0,-200 -210,75 210,75"
                          fill="rgba(16, 185, 129, 0.09)"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeDasharray="8 5"
                        />
                        <line x1="0" y1="-200" x2="0" y2="95" stroke="#fbbf24" strokeWidth="3" />
                        <circle
                          cx="0"
                          cy="-200"
                          r="11"
                          fill="#10b981"
                          stroke="#020617"
                          strokeWidth="3"
                        />
                        <rect
                          x="-220"
                          y="75"
                          width="440"
                          height="18"
                          rx="4"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="-220"
                          textAnchor="middle"
                          fill="#6ee7b7"
                          fontSize="14"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          0° STRAIGHT (STREET) · SFD = {rtHudPhysics.effectiveSfd} mm
                        </text>
                      </>
                    )}

                    {/* ASME Wire IQI Placement Box & Lead 'B' Marker */}
                    <g transform="translate(125, -35)">
                      <rect
                        x="0"
                        y="0"
                        width="116"
                        height="54"
                        rx="6"
                        fill="rgba(2, 6, 23, 0.82)"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      {[16, 30, 44, 58, 72, 86].map((wx, idx) => (
                        <line
                          key={wx}
                          x1={wx}
                          y1="10"
                          x2={wx}
                          y2="34"
                          stroke="#e2e8f0"
                          strokeWidth={1 + idx * 0.35}
                        />
                      ))}
                      <text
                        x="58"
                        y="47"
                        textAnchor="middle"
                        fill="#6ee7b7"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {rtHudPhysics.iqiLabel}
                      </text>
                    </g>

                    {/* Lead Backscatter 'B' Symbol */}
                    <g transform="translate(-210, -35)">
                      <rect
                        x="0"
                        y="0"
                        width="44"
                        height="44"
                        rx="6"
                        fill="rgba(2, 6, 23, 0.85)"
                        stroke="#fbbf24"
                        strokeWidth="2"
                      />
                      <text
                        x="22"
                        y="30"
                        textAnchor="middle"
                        fill="#fbbf24"
                        fontSize="24"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        B
                      </text>
                    </g>

                    {/* Center Reticle Target */}
                    <circle cx="0" cy="0" r="6" fill="none" stroke="#ffffff" strokeWidth="2" />
                  </g>
                )}

                {/* MODE 2: UT / PAUT ANGLE-BEAM SKIP RULER & LIVE MINI A-SCAN OVERLAY */}
                {overlayDiscipline === 'ut_skip_beam' && (
                  <g data-testid="ar-svg-ut-group">
                    {/* Weld Centerline & V-Bevel Reference */}
                    <line
                      x1="0"
                      y1="-140"
                      x2="0"
                      y2="140"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      strokeDasharray="7 5"
                    />
                    <polygon
                      points="-26,-45 26,-45 6,45 -6,45"
                      fill="rgba(251, 191, 36, 0.16)"
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                    {/* Specimen Top & Root Wall Lines */}
                    <line x1="-340" y1="-45" x2="340" y2="-45" stroke="#38bdf8" strokeWidth="2.5" />
                    <line
                      x1="-340"
                      y1="45"
                      x2="340"
                      y2="45"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="10 5"
                    />

                    {/* Calibrated Half-Skip (½S) & Full-Skip (1S) Standoff Ticks */}
                    <g transform="translate(0, -45)">
                      <line x1="120" y1="-16" x2="120" y2="8" stroke="#22d3ee" strokeWidth="2.5" />
                      <text
                        x="120"
                        y="-22"
                        textAnchor="middle"
                        fill="#22d3ee"
                        fontSize="13"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ½S = {utHudPhysics.halfSkipMm} mm
                      </text>

                      <line x1="240" y1="-16" x2="240" y2="8" stroke="#a78bfa" strokeWidth="2.5" />
                      <text
                        x="240"
                        y="-22"
                        textAnchor="middle"
                        fill="#c4b5fd"
                        fontSize="13"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        1S = {utHudPhysics.fullSkipMm} mm
                      </text>
                    </g>

                    {/* Dynamic Angle-Beam Probe Wedge & Refracted Ray Path */}
                    {(() => {
                      const probeX = Math.round(120 * utProbeStandOffRatio);
                      return (
                        <g>
                          {/* Probe Housing */}
                          <rect
                            x={probeX - 24}
                            y={-82}
                            width="48"
                            height="37"
                            rx="5"
                            fill="#0284c7"
                            stroke="#e0f2fe"
                            strokeWidth="2"
                          />
                          <text
                            x={probeX}
                            y={-59}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="13"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {utRefractedAngleDeg}°
                          </text>

                          {/* Leg 1 & Leg 2 Shear Wave Path */}
                          <polyline
                            points={`${probeX},-45 ${probeX - 120},45 ${probeX - 240},-45`}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3.5"
                          />
                          {/* Target Reflector Circle on Weld Zone */}
                          <circle
                            cx="0"
                            cy={utProbeStandOffRatio <= 1.4 ? 42 : -38}
                            r="10"
                            fill="rgba(244, 63, 94, 0.35)"
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                          />
                        </g>
                      );
                    })()}

                    {/* Live Miniature A-Scan HUD Inset */}
                    <g transform="translate(-330, -195)">
                      <rect
                        x="0"
                        y="0"
                        width="235"
                        height="112"
                        rx="8"
                        fill="rgba(2, 6, 23, 0.88)"
                        stroke="#22d3ee"
                        strokeWidth="2"
                      />
                      {/* Gate A Bar */}
                      <line x1="78" y1="36" x2="165" y2="36" stroke="#f43f5e" strokeWidth="3" />
                      {/* Simulated RF/Rectified Echo Spike */}
                      <polyline
                        points={`12,94 65,94 95,92 112,${94 - Math.round(utHudPhysics.echoFshPct * 0.72)} 128,92 175,94 222,94`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />
                      <text
                        x="12"
                        y="20"
                        fill="#67e8f9"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        LIVE A-SCAN · FSH {utHudPhysics.echoFshPct}%
                      </text>
                      <text x="12" y="106" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                        SP:{utHudPhysics.soundPathMm}mm · SD:{utHudPhysics.surfaceDistMm}mm · D:{utHudPhysics.reflectorDepthMm}mm
                      </text>
                    </g>
                  </g>
                )}

                {/* MODE 3: VT WELD CROWN GAUGE & MT MAGNETIC YOKE OVERLAY */}
                {overlayDiscipline === 'vt_mt_gauge' && (
                  <g data-testid="ar-svg-vt-mt-group">
                    {/* MT Magnetic Yoke Poles & Flux Lines */}
                    <g transform={`rotate(${mtOrientationDeg})`}>
                      {/* Magnetic Flux Ellipses */}
                      {[-55, -28, 0, 28, 55].map((fy) => (
                        <path
                          key={fy}
                          d={`M -165 0 Q 0 ${fy * 2.2} 165 0`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.8"
                          strokeDasharray="6 5"
                        />
                      ))}
                      {/* Left & Right Yoke Legs */}
                      <rect
                        x="-190"
                        y="-26"
                        width="44"
                        height="52"
                        rx="6"
                        fill="#dc2626"
                        stroke="#fef2f2"
                        strokeWidth="2"
                      />
                      <rect
                        x="146"
                        y="-26"
                        width="44"
                        height="52"
                        rx="6"
                        fill="#2563eb"
                        stroke="#eff6ff"
                        strokeWidth="2"
                      />
                      <text
                        x="-168"
                        y="6"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="15"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        N
                      </text>
                      <text
                        x="168"
                        y="6"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="15"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        S
                      </text>
                    </g>

                    {/* VT Weld Crown & Cap Reinforcement Vernier */}
                    <g transform="translate(0, 105)">
                      <rect
                        x="-185"
                        y="-28"
                        width="370"
                        height="68"
                        rx="8"
                        fill="rgba(2, 6, 23, 0.86)"
                        stroke={vtMtHudPhysics.capPasses ? '#10b981' : '#f43f5e'}
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="-6"
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="13"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        VT CAP GAUGE: {vtMeasuredCapMm.toFixed(1)} mm / ASME MAX {vtMtHudPhysics.maxCapAllowedMm.toFixed(1)} mm
                      </text>
                      <text
                        x="0"
                        y="20"
                        textAnchor="middle"
                        fill={vtMtHudPhysics.capPasses ? '#6ee7b7' : '#fda4af'}
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        MT YOKE POLE SPACING: {mtYokeSpacingMm} mm ({mtOrientationDeg}°) · ≥ 1000 LUX
                      </text>
                    </g>
                  </g>
                )}
              </g>
            </svg>

            {/* Idle / Ready Overlay Prompt (Measured Contrast Scrim) */}
            {streamState === 'idle' && (
              <div className="absolute inset-0 z-20 bg-slate-950/75 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-white max-w-md">
                  {isAr
                    ? 'شغّل الكاميرا الحية لتراكب عناصر الفحص الهندسي مباشرة على بيئتك'
                    : 'Activate Live Camera to Overlay Technical NDT Guides on Your Workspace'}
                </h4>
                <p className="text-xs text-slate-300 max-w-lg mt-1.5 leading-relaxed">
                  {isAr
                    ? 'تتم معالجة بث الكاميرا محلياً بالكامل داخل متصفحك عبر MediaDevices API دون إرسال أي بيانات خارج جهازك.'
                    : 'Camera frames are processed 100% locally in your browser via Web MediaDevices API with zero external uploads.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => void startLiveCamera()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isAr ? 'تشغيل الكاميرا الآن' : 'Enable Camera Feed'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStreamState('calibration_feed')}
                    className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-900/90 hover:border-amber-400 text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    {isAr ? 'تجربة على لوحة معاينة افتراضية' : 'Preview on Calibration Pipe'}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Live Telemetry Scrim Bar (WCAG AA Contrast over Live Video) */}
            {isLiveOrCalib && (
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent px-4 pt-8 pb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-200 tabular-nums pointer-events-none">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-emerald-400 font-bold">
                    {streamState === 'active'
                      ? isFrozen
                        ? isAr
                          ? 'إطار مثبّت'
                          : 'FROZEN FRAME'
                        : activeCameraLabel || (isAr ? 'بث كاميرا حي' : 'LIVE CAMERA')
                      : isAr
                      ? 'لوحة معاينة قياسية'
                      : 'CALIBRATION PIPE'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activeResolution.w}×{activeResolution.h}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    XY({anchorX},{anchorY})
                  </span>
                </div>

                <div className="text-amber-300 font-bold">
                  {overlayDiscipline === 'rt_exposure'
                    ? `Ug = ${rtHudPhysics.ugMm} / ${rtHudPhysics.maxUgMm} mm (${
                        rtHudPhysics.passesUg ? 'ASME PASS' : 'EXCEEDS Ug'
                      })`
                    : overlayDiscipline === 'ut_skip_beam'
                    ? `½S = ${utHudPhysics.halfSkipMm} mm · 1S = ${utHudPhysics.fullSkipMm} mm`
                    : `Cap ${vtMeasuredCapMm.toFixed(1)} mm (${
                        vtMtHudPhysics.capPasses ? 'ACCEPT' : 'EXCESS CAP'
                      })`}
                </div>
              </div>
            )}
          </div>

          {/* Media Stream Action Toolbar Below Viewport */}
          <div className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-2.5 ${cardBg}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSwitchFacingMode}
                className="px-3 py-2 rounded-lg border border-slate-600/50 text-xs font-bold hover:border-cyan-400 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  {facingMode === 'environment'
                    ? isAr
                      ? 'الكاميرا: الخلفية (تبديل)'
                      : 'Lens: Rear (Switch)'
                    : isAr
                    ? 'الكاميرا: الأمامية (تبديل)'
                    : 'Lens: Front (Switch)'}
                </span>
              </button>

              {videoDevices.length > 1 && (
                <select
                  aria-label={isAr ? 'اختيار جهاز الكاميرا' : 'Select Camera Device'}
                  value={selectedDeviceId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedDeviceId(nextId);
                    if (streamState === 'active') {
                      void startLiveCamera(facingMode, nextId);
                    }
                  }}
                  className="px-2.5 py-2 rounded-lg border border-slate-600/50 bg-transparent text-xs font-mono"
                >
                  <option value="">
                    {isAr ? 'اختيار تلقائي للعدسة' : 'Auto Select Lens'}
                  </option>
                  {videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId} className="bg-slate-900 text-white">
                      {dev.label}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleToggleFreeze}
                disabled={streamState !== 'active'}
                className="px-3 py-2 rounded-lg border border-slate-600/50 disabled:opacity-45 text-xs font-bold hover:border-amber-400 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                {isFrozen ? (
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>
                  {isFrozen
                    ? isAr
                      ? 'استئناف البث'
                      : 'Resume Stream'
                    : isAr
                    ? 'تثبيت الإطار'
                    : 'Freeze Frame'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMirrored((m) => !m)}
                className="px-3 py-2 rounded-lg border border-slate-600/50 text-xs font-bold hover:border-cyan-400 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? 'عكس أفقي' : 'Mirror'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGridReticle((g) => !g)}
                className="px-3 py-2 rounded-lg border border-slate-600/50 text-xs font-bold hover:border-cyan-400 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'شبكة المحاذاة' : 'Reticle Grid'}</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="capture-ar-snapshot-btn"
              onClick={handleCaptureAnnotatedSnapshot}
              disabled={!isLiveOrCalib}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-45 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? 'التقاط صورة موثقة وحفظ (+XP)'
                  : 'Capture Annotated Snapshot (+XP)'}
              </span>
            </button>
          </div>

          {/* Captured Annotated Field Report Preview & Download */}
          {(capturedSnapshotUrl || loggedXpBanner) && (
            <div
              data-testid="captured-ar-snapshot-panel"
              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}
            >
              <div className="flex items-center gap-3">
                {capturedSnapshotUrl && (
                  <img
                    src={capturedSnapshotUrl}
                    alt={isAr ? 'لقطة الفحص الموثقة بالتراكب' : 'Annotated NDT AR Snapshot'}
                    referrerPolicy="no-referrer"
                    className="w-28 h-16 rounded-lg object-cover border border-emerald-500/50 shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {isAr
                        ? 'تم توثيق لقطة التراكب الميداني وتسجيل التجربة بنجاح'
                        : 'Annotated AR Field Snapshot Captured & Logged'}
                    </span>
                  </div>
                  {loggedXpBanner && (
                    <div className={`text-xs mt-1 tabular-nums ${mutedText}`}>
                      <Award className="w-3.5 h-3.5 inline text-amber-500 me-1" />
                      {isAr
                        ? `تمت إضافة +${loggedXpBanner.xpEarned} XP إلى سجل معامل المحاكاة (${loggedXpBanner.methodLabel})`
                        : `+${loggedXpBanner.xpEarned} XP recorded in Simulation Lab History (${loggedXpBanner.methodLabel})`}
                    </div>
                  )}
                </div>
              </div>

              {capturedSnapshotUrl && (
                <a
                  href={capturedSnapshotUrl}
                  download={`insco-ndt-ar-${overlayDiscipline}.png`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تنزيل صورة الفحص PNG' : 'Download PNG Report'}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ZONE 2: Dynamic Technical NDT Variables & HUD Calibration Deck (4 cols on XL) */}
        <div className={`xl:col-span-4 rounded-2xl border p-5 space-y-5 tabular-nums ${cardBg}`}>
          <div className="flex items-center justify-between border-b border-slate-700/25 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-black">
                {isAr
                  ? 'لوحة معايرة التراكب والمتغيرات التقنية'
                  : 'AR Overlay & Technical Variables'}
              </h4>
            </div>
            <button
              type="button"
              onClick={handleResetHudAlignment}
              className="text-xs font-bold text-cyan-500 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'توسيط' : 'Center'}</span>
            </button>
          </div>

          {/* Specimen Wall Thickness (Shared across RT, UT, VT) */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{isAr ? 'سُمك الجدار (Wall Thickness t)' : 'Wall Thickness (t)'}</span>
                <span className="font-mono text-emerald-500">{wallMm} mm</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'سُمك الجدار بالمليمتر' : 'Wall Thickness in mm'}
                min={3}
                max={32}
                step={0.5}
                value={wallMm}
                onChange={(e) => setWallMm(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Discipline-Specific Technical Controls */}
            {overlayDiscipline === 'rt_exposure' && (
              <>
                <div>
                  <div className="text-xs font-bold mb-1.5">
                    {isAr ? 'تقنية التصوير المتراكبة' : 'Overlay RT Technique'}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'panoramic', label: 'Panorama' },
                        { id: 'elliptical', label: 'Ellipse' },
                        { id: 'straight', label: 'Street 0°' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRtTechnique(item.id)}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          rtTechnique === item.id
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                            : 'border-slate-600/40 hover:border-emerald-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{isAr ? 'القطر الخارجي (Pipe OD)' : 'Pipe OD'}</span>
                    <span className="font-mono text-amber-500">{pipeOdMm} mm</span>
                  </div>
                  <input
                    type="range"
                    aria-label={isAr ? 'القطر الخارجي للماسورة' : 'Pipe Outer Diameter'}
                    min={33.4}
                    max={610}
                    step={0.5}
                    value={pipeOdMm}
                    onChange={(e) => setPipeOdMm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {rtTechnique !== 'panoramic' && (
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{isAr ? 'المسافة البؤرية (SFD)' : 'Source-to-Film (SFD)'}</span>
                      <span className="font-mono text-cyan-500">{sfdMm} mm</span>
                    </div>
                    <input
                      type="range"
                      aria-label="SFD"
                      min={150}
                      max={900}
                      step={10}
                      value={sfdMm}
                      onChange={(e) => setSfdMm(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                )}

                {rtTechnique === 'elliptical' && (
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{isAr ? 'الإزاحة المحورية (Offset L)' : 'Axial Offset (L)'}</span>
                      <span className="font-mono text-cyan-500">{axialOffsetMm} mm</span>
                    </div>
                    <input
                      type="range"
                      aria-label="Axial Offset L"
                      min={30}
                      max={280}
                      step={5}
                      value={axialOffsetMm}
                      onChange={(e) => setAxialOffsetMm(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                )}
              </>
            )}

            {overlayDiscipline === 'ut_skip_beam' && (
              <>
                <div>
                  <div className="text-xs font-bold mb-1.5">
                    {isAr ? 'زاوية انكسار المجس (Probe Angle)' : 'Refracted Probe Angle'}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([45, 60, 70] as const).map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setUtRefractedAngleDeg(deg)}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          utRefractedAngleDeg === deg
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                            : 'border-slate-600/40 hover:border-cyan-400'
                        }`}
                      >
                        {deg}° Shear
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>
                      {isAr ? 'موقع البروب على السطح (Skip Ratio)' : 'Surface Probe Standoff'}
                    </span>
                    <span className="font-mono text-cyan-500">
                      {utProbeStandOffRatio.toFixed(2)} × ½S ({utHudPhysics.surfaceDistMm} mm)
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="UT Probe Standoff"
                    min={0.5}
                    max={2.2}
                    step={0.05}
                    value={utProbeStandOffRatio}
                    onChange={(e) => setUtProbeStandOffRatio(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {overlayDiscipline === 'vt_mt_gauge' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>
                      {isAr ? 'ارتفاع تاج اللحام المقاس (Weld Cap)' : 'Measured Weld Cap'}
                    </span>
                    <span className="font-mono text-amber-500">{vtMeasuredCapMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Measured Weld Cap Height"
                    min={0.5}
                    max={6.0}
                    step={0.1}
                    value={vtMeasuredCapMm}
                    onChange={(e) => setVtMeasuredCapMm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>
                      {isAr ? 'تباعد قطبي الفك المغناطيسي (Yoke Spacing)' : 'MT Yoke Pole Spacing'}
                    </span>
                    <span className="font-mono text-amber-500">{mtYokeSpacingMm} mm</span>
                  </div>
                  <input
                    type="range"
                    aria-label="MT Yoke Pole Spacing"
                    min={50}
                    max={200}
                    step={5}
                    value={mtYokeSpacingMm}
                    onChange={(e) => setMtYokeSpacingMm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {([0, 90] as const).map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setMtOrientationDeg(ang)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        mtOrientationDeg === ang
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'border-slate-600/40 hover:border-amber-400'
                      }`}
                    >
                      {ang === 0
                        ? isAr
                          ? 'وضع طولي 0°'
                          : '0° Longitudinal'
                        : isAr
                        ? 'وضع متعامد 90°'
                        : '90° Transverse'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Spatial AR Alignment Sliders (Scale, Rotation, Opacity) */}
          <div className="pt-4 border-t border-slate-700/25 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-400">
              {isAr
                ? 'اسحب فوق شاشة الكاميرا لتحريك المركز أو اضبط القياس:'
                : 'Drag directly on camera feed or fine-tune HUD geometry:'}
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{isAr ? 'مقياس رسم التراكب (Scale)' : 'Overlay Scale'}</span>
                <span className="font-mono">{overlayScalePct}%</span>
              </div>
              <input
                type="range"
                aria-label="AR Overlay Scale"
                min={55}
                max={150}
                step={5}
                value={overlayScalePct}
                onChange={(e) => setOverlayScalePct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{isAr ? 'زاوية دوران التراكب (Rotation)' : 'Overlay Rotation'}</span>
                <span className="font-mono">{overlayRotationDeg}°</span>
              </div>
              <input
                type="range"
                aria-label="AR Overlay Rotation"
                min={-45}
                max={45}
                step={1}
                value={overlayRotationDeg}
                onChange={(e) => setOverlayRotationDeg(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{isAr ? 'شفافية طبقة NDT (HUD Opacity)' : 'HUD Layer Opacity'}</span>
                <span className="font-mono">{hudOpacityPct}%</span>
              </div>
              <input
                type="range"
                aria-label="HUD Opacity"
                min={35}
                max={100}
                step={5}
                value={hudOpacityPct}
                onChange={(e) => setHudOpacityPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
