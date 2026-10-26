import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Maximize2, 
  Sliders, 
  RotateCcw,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { Language } from '../../../types';

interface UtAScanDisplayProps {
  language: Language;
  // Calibration / Instrument controls
  velocity: number; // m/s (e.g. 5920)
  range: number;    // mm (e.g. 100 or 250)
  gain: number;     // dB (e.g. 42)
  zeroDelay: number; // microseconds
  gateStartMm: number;
  gateWidthMm: number;
  gateThresholdPercent: number;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  // Physical reflectors currently in front of beam
  primaryEchoDistanceMm: number; // calculated sound path
  secondaryEchoDistanceMm?: number;
  reflectorType: 'backwall' | 'arc_100' | 'sdh' | 'weld_defect' | 'step';
  // Callbacks for live tuning
  onGainChange: (gain: number) => void;
  onVelocityChange: (vel: number) => void;
  onZeroDelayChange: (zero: number) => void;
  onGateStartChange: (start: number) => void;
  onGateThresholdChange: (thresh: number) => void;
  onAuto80Gain?: () => void;
}

export const UtAScanDisplay: React.FC<UtAScanDisplayProps> = ({
  language,
  velocity,
  range,
  gain,
  zeroDelay,
  gateStartMm,
  gateWidthMm,
  gateThresholdPercent,
  isFrozen,
  onToggleFreeze,
  primaryEchoDistanceMm,
  secondaryEchoDistanceMm,
  reflectorType,
  onGainChange,
  onVelocityChange,
  onZeroDelayChange,
  onGateStartChange,
  onGateThresholdChange,
  onAuto80Gain
}) => {
  const isAr = language === 'ar';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showDacCurve, setShowDacCurve] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isAlarmTriggeredRef = useRef<boolean>(false);

  // Calculate primary echo amplitude (% of Full Screen Height - FSH)
  // Baseline amplitude modulated by Gain and distance attenuation
  const calculatedAmplitudePercent = useMemo(() => {
    if (primaryEchoDistanceMm <= 0) return 0;
    // Base reflection coefficient
    let baseRefl = 0.8;
    if (reflectorType === 'arc_100') baseRefl = 0.95;
    if (reflectorType === 'sdh') baseRefl = 0.35; // 1.5mm SDH has smaller reflection cross section
    if (reflectorType === 'weld_defect') baseRefl = 0.65;

    // Attenuation with distance (approx 0.03 dB/mm)
    const distAttenDb = primaryEchoDistanceMm * 0.025;
    // Total dB relative to reference
    const netDb = (gain - 40) - distAttenDb;
    const factor = Math.pow(10, netDb / 20);
    const amp = baseRefl * 60 * factor;
    return Math.max(0, Math.min(110, amp));
  }, [primaryEchoDistanceMm, gain, reflectorType]);

  // Is echo inside Gate A and crossing threshold?
  const isGateAlarming = useMemo(() => {
    const gateEndMm = gateStartMm + gateWidthMm;
    const isInsideGate = primaryEchoDistanceMm >= gateStartMm && primaryEchoDistanceMm <= gateEndMm;
    return isInsideGate && calculatedAmplitudePercent >= gateThresholdPercent;
  }, [primaryEchoDistanceMm, gateStartMm, gateWidthMm, calculatedAmplitudePercent, gateThresholdPercent]);

  // Beep alarm with Web Audio API
  useEffect(() => {
    if (isGateAlarming && !isMuted) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz beep
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  }, [isGateAlarming, isMuted]);

  // Render Real-time A-Scan Oscilloscope Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let time = 0;

    const render = () => {
      if (!isFrozen) {
        time += 0.05;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Dark industrial CRT background
      ctx.fillStyle = '#050c14';
      ctx.fillRect(0, 0, w, h);

      // Grid / Graticule parameters (10 vertical divisions, 5 horizontal divisions)
      const paddingLeft = 35;
      const paddingBottom = 25;
      const paddingTop = 15;
      const paddingRight = 15;

      const plotW = w - paddingLeft - paddingRight;
      const plotH = h - paddingTop - paddingBottom;

      // Draw Grid Lines (10% intervals)
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = paddingLeft + (i / 10) * plotW;
        ctx.strokeStyle = i === 0 || i === 10 ? '#1e3a5f' : '#0e243d';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, paddingTop + plotH);
        ctx.stroke();

        // X scale ticks & labels (Sound Path mm)
        if (i % 2 === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          const distLabel = ((i / 10) * range).toFixed(0);
          ctx.fillText(`${distLabel}`, x, h - 8);
        }
      }

      for (let j = 0; j <= 5; j++) {
        const y = paddingTop + (j / 5) * plotH;
        ctx.strokeStyle = j === 0 || j === 5 ? '#1e3a5f' : '#0e243d';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + plotW, y);
        ctx.stroke();

        // Y scale ticks & labels (% FSH)
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        const percentLabel = 100 - j * 20;
        ctx.fillText(`${percentLabel}%`, paddingLeft - 5, y + 3);
      }
      ctx.setLineDash([]); // reset

      // Baseline reference zero line
      const baselineY = paddingTop + plotH;
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, baselineY);
      ctx.lineTo(paddingLeft + plotW, baselineY);
      ctx.stroke();

      // Draw Optional ASME DAC (Distance Amplitude Correction) Curve
      if (showDacCurve) {
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let xPx = 0; xPx <= plotW; xPx += 4) {
          const xDist = (xPx / plotW) * range;
          if (xDist < 10) continue;
          // DAC drops by 6dB per doubling of distance after near field
          const dacDbDrop = 20 * Math.log10(xDist / 50);
          const dacAmpPercent = Math.max(10, 80 * Math.pow(10, -dacDbDrop / 20));
          const yPx = baselineY - (dacAmpPercent / 100) * plotH;
          if (xPx === 0) ctx.moveTo(paddingLeft + xPx, yPx);
          else ctx.lineTo(paddingLeft + xPx, yPx);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Label DAC
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('ASME DAC (100% REF)', paddingLeft + plotW - 60, paddingTop + 20);
      }

      // Draw Gate A (Red / Green horizontal threshold line + boundary markers)
      const gateStartX = paddingLeft + (gateStartMm / range) * plotW;
      const gateEndX = paddingLeft + ((gateStartMm + gateWidthMm) / range) * plotW;
      const gateY = baselineY - (gateThresholdPercent / 100) * plotH;

      ctx.strokeStyle = isGateAlarming ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Start vertical leg
      ctx.moveTo(gateStartX, gateY - 6);
      ctx.lineTo(gateStartX, gateY + 6);
      // Horizontal threshold bar
      ctx.moveTo(gateStartX, gateY);
      ctx.lineTo(gateEndX, gateY);
      // End vertical leg
      ctx.moveTo(gateEndX, gateY - 6);
      ctx.lineTo(gateEndX, gateY + 6);
      ctx.stroke();

      // Gate Label
      ctx.fillStyle = isGateAlarming ? '#ef4444' : '#22c55e';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`GATE A: ${calculatedAmplitudePercent.toFixed(1)}%`, gateStartX + 4, gateY - 8);

      // -------------------------------------------------------------
      // Dynamic A-Scan Waveform Generation
      // RF Full-Wave rectified signal with Gaussian envelop pulse
      // -------------------------------------------------------------
      ctx.beginPath();
      ctx.moveTo(paddingLeft, baselineY);

      // Map millimeter distance to waveform amplitude
      const getSignalAmplitude = (distMm: number) => {
        let amp = 0;

        // 1. Initial Pulse (IP) near 0 mm
        const ipWidth = range * 0.035;
        const ipDiff = distMm - 0;
        if (Math.abs(ipDiff) < ipWidth) {
          amp += 95 * Math.exp(-Math.pow(ipDiff / (ipWidth * 0.35), 2));
        }

        // 2. Primary Echo
        if (primaryEchoDistanceMm > 0) {
          const echoW = range * 0.03;
          const diff = distMm - primaryEchoDistanceMm;
          if (Math.abs(diff) < echoW * 2) {
            const envelope = calculatedAmplitudePercent * Math.exp(-Math.pow(diff / (echoW * 0.4), 2));
            // Add high frequency oscillation within the pulse
            const carrier = Math.abs(Math.cos((diff / echoW) * Math.PI * 4));
            amp += envelope * (0.8 + 0.2 * carrier);
          }
        }

        // 3. Secondary Echo / Multiple Backwall Reflection
        if (secondaryEchoDistanceMm && secondaryEchoDistanceMm > 0) {
          const echoW = range * 0.035;
          const diff = distMm - secondaryEchoDistanceMm;
          if (Math.abs(diff) < echoW * 2) {
            const secAmp = calculatedAmplitudePercent * 0.45;
            const envelope = secAmp * Math.exp(-Math.pow(diff / (echoW * 0.4), 2));
            const carrier = Math.abs(Math.cos((diff / echoW) * Math.PI * 4));
            amp += envelope * (0.8 + 0.2 * carrier);
          }
        }

        // 4. Baseline grass / electronic thermal noise
        const noise = (Math.sin(distMm * 15 + time) * 0.5 + 0.5) * (gain > 50 ? 5 : 2);
        amp += noise;

        return Math.min(105, amp);
      };

      // Draw the waveform line
      const stepPx = 1.5;
      for (let px = 0; px <= plotW; px += stepPx) {
        const xDist = (px / plotW) * range;
        const amp = getSignalAmplitude(xDist);
        const y = baselineY - (amp / 100) * plotH;
        ctx.lineTo(paddingLeft + px, y);
      }

      // Fill beneath waveform with glowing gradient
      const fillGradient = ctx.createLinearGradient(0, paddingTop, 0, baselineY);
      fillGradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      fillGradient.addColorStop(1, 'rgba(14, 165, 233, 0.04)');
      ctx.fillStyle = fillGradient;
      ctx.lineTo(paddingLeft + plotW, baselineY);
      ctx.closePath();
      ctx.fill();

      // Trace sharp bright cyan waveform outline
      ctx.beginPath();
      for (let px = 0; px <= plotW; px += stepPx) {
        const xDist = (px / plotW) * range;
        const amp = getSignalAmplitude(xDist);
        const y = baselineY - (amp / 100) * plotH;
        if (px === 0) ctx.moveTo(paddingLeft + px, y);
        else ctx.lineTo(paddingLeft + px, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Screen Header / Status Badges on Canvas
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`RANGE: ${range.toFixed(0)} mm`, paddingLeft + 10, paddingTop + 15);
      ctx.fillText(`VEL: ${velocity.toFixed(0)} m/s`, paddingLeft + 110, paddingTop + 15);
      ctx.fillText(`GAIN: ${gain.toFixed(1)} dB`, paddingLeft + 220, paddingTop + 15);
      ctx.fillText(`ZERO: ${zeroDelay.toFixed(2)} µs`, paddingLeft + 320, paddingTop + 15);

      if (isFrozen) {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('[HOLD / FROZEN]', paddingLeft + plotW - 110, paddingTop + 15);
      }

      if (!isFrozen) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    isFrozen,
    range,
    velocity,
    gain,
    zeroDelay,
    gateStartMm,
    gateWidthMm,
    gateThresholdPercent,
    primaryEchoDistanceMm,
    secondaryEchoDistanceMm,
    calculatedAmplitudePercent,
    isGateAlarming,
    showDacCurve
  ]);

  return (
    <div className="bg-[#0b1026] p-4 rounded-2xl border border-[#1e293b] space-y-4 shadow-xl">
      {/* Top Header & Readout Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isAr ? 'شاشة كاشف العيوب الرقمي (Digital A-Scan)' : 'Digital Flaw Detector A-Scan'}</span>
              {isGateAlarming && (
                <span className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  <ShieldAlert className="w-3 h-3" />
                  {isAr ? 'إنذار: كشف إشارة' : 'ALARM'}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">EPOCH / USM Standard Calibration Interface</p>
          </div>
        </div>

        {/* Action Controls: Freeze, Audio, DAC */}
        <div className="flex items-center gap-2">
          {/* DAC Toggle */}
          <button
            onClick={() => setShowDacCurve(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              showDacCurve
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            DAC Curve
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              !isMuted 
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isMuted ? 'تفعيل صوت الإنذار' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Freeze Button */}
          <button
            onClick={onToggleFreeze}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              isFrozen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {isFrozen ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isFrozen ? (isAr ? 'استئناف' : 'Unfreeze') : (isAr ? 'تجميد' : 'Freeze')}</span>
          </button>

          {/* Auto 80% FSH Gain */}
          {onAuto80Gain && (
            <button
              onClick={onAuto80Gain}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition cursor-pointer"
              title={isAr ? 'ضبط تلقائي للكسب عند 80% FSH' : 'Auto 80% FSH'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto 80%</span>
            </button>
          )}
        </div>
      </div>

      {/* Main A-Scan Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[320px] bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <canvas
          ref={canvasRef}
          width={640}
          height={340}
          className="w-full h-full object-fill"
        />
      </div>

      {/* Live Digital Measurement Readout Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-[#070a1a] p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {isAr ? 'مسار الصوت Sound Path (S)' : 'Sound Path (S)'}
          </span>
          <span className="text-base font-black text-sky-400 font-mono">
            {primaryEchoDistanceMm > 0 ? `${primaryEchoDistanceMm.toFixed(1)} mm` : '---'}
          </span>
        </div>

        <div className="bg-[#070a1a] p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {isAr ? 'السعة Amplitude (%FSH)' : 'Amplitude (%FSH)'}
          </span>
          <span className={`text-base font-black font-mono ${calculatedAmplitudePercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {calculatedAmplitudePercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-[#070a1a] p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {isAr ? 'الكسب الكلي (Gain)' : 'Receiver Gain'}
          </span>
          <span className="text-base font-black text-white font-mono">
            {gain.toFixed(1)} dB
          </span>
        </div>

        <div className="bg-[#070a1a] p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {isAr ? 'سرعة الصوت المعايرة (Vel)' : 'Calibrated Velocity'}
          </span>
          <span className="text-base font-black text-emerald-400 font-mono">
            {velocity} m/s
          </span>
        </div>
      </div>

      {/* Instrument Calibration Control Panel */}
      <div className="bg-[#070a1a] p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            {isAr ? 'أدوات معايرة الجهاز (Gain, Velocity, Gate)' : 'Instrument Calibration Controls'}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          {/* Gain Controls with quick +/- buttons */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{isAr ? 'حساسية الكسب (Gain):' : 'Gain (dB):'}</span>
              <span className="font-bold text-amber-400 font-mono">{gain.toFixed(1)} dB</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onGainChange(Math.max(10, gain - 6))}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
              >
                -6dB
              </button>
              <button
                onClick={() => onGainChange(Math.max(10, gain - 1))}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
              >
                -1dB
              </button>
              <input
                type="range"
                min={10}
                max={90}
                step={0.5}
                value={gain}
                onChange={e => onGainChange(parseFloat(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <button
                onClick={() => onGainChange(Math.min(90, gain + 1))}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
              >
                +1dB
              </button>
              <button
                onClick={() => onGainChange(Math.min(90, gain + 6))}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
              >
                +6dB
              </button>
            </div>
          </div>

          {/* Velocity Control */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{isAr ? 'سرعة الصوت (Velocity):' : 'Sound Velocity:'}</span>
              <span className="font-bold text-emerald-400 font-mono">{velocity} m/s</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2000}
                max={7000}
                step={10}
                value={velocity}
                onChange={e => onVelocityChange(parseInt(e.target.value, 10))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <button
                onClick={() => onVelocityChange(5920)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-emerald-300 cursor-pointer"
                title="Steel Longitudinal"
              >
                5920
              </button>
              <button
                onClick={() => onVelocityChange(3240)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-sky-300 cursor-pointer"
                title="Steel Shear"
              >
                3240
              </button>
            </div>
          </div>

          {/* Gate A Start Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{isAr ? 'بداية البوابة Gate A Start:' : 'Gate A Start:'}</span>
              <span className="font-bold text-sky-400 font-mono">{gateStartMm.toFixed(0)} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={range - 20}
              step={1}
              value={gateStartMm}
              onChange={e => onGateStartChange(parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Gate Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{isAr ? 'عتبة البوابة Gate Threshold:' : 'Gate Threshold:'}</span>
              <span className="font-bold text-rose-400 font-mono">{gateThresholdPercent}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              step={5}
              value={gateThresholdPercent}
              onChange={e => onGateThresholdChange(parseInt(e.target.value, 10))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
