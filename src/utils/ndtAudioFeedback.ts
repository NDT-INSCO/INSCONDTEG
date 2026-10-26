import { useCallback, useEffect, useState } from 'react';

export type DefectAudioSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface NdtAudioPreferences {
  enabled: boolean;
  volume: number; // 0.0 .. 1.0
}

const AUDIO_STORAGE_KEY = 'insco_ndt_audio_prefs_v1';
const AUDIO_SYNC_EVENT = 'insco:ndt-audio-prefs-changed';

const DEFAULT_PREFS: NdtAudioPreferences = {
  enabled: true,
  volume: 0.65,
};

let sharedAudioCtx: AudioContext | null = null;
let lastClickAtMs = 0;
let lastScanTickAtMs = 0;
let lastPingAtMs = 0;

export function readNdtAudioPreferences(): NdtAudioPreferences {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_PREFS };
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<NdtAudioPreferences>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_PREFS.enabled,
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_PREFS.volume,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writeNdtAudioPreferences(next: Partial<NdtAudioPreferences>): NdtAudioPreferences {
  const merged: NdtAudioPreferences = {
    ...readNdtAudioPreferences(),
    ...next,
  };
  merged.volume = Math.min(1, Math.max(0, merged.volume));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(merged));
    }
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUDIO_SYNC_EVENT, { detail: merged }));
    }
  } catch {
    // Ignore storage errors in private browsing or test sandboxes
  }
  return merged;
}

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxCtor) return null;

  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtxCtor();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Subtle tactile rotary-encoder / hardware keypad click when calibrating gain, velocity, delay, or gates.
 */
export function playCalibrationClick(): boolean {
  const prefs = readNdtAudioPreferences();
  if (!prefs.enabled || prefs.volume <= 0) return false;

  const nowMs = Date.now();
  if (nowMs - lastClickAtMs < 35) return false;
  lastClickAtMs = nowMs;

  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1280, t0);
    osc.frequency.exponentialRampToValueAtTime(520, t0 + 0.022);

    const peakGain = 0.055 * prefs.volume;
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.linearRampToValueAtTime(peakGain, t0 + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.024);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.026);
    return true;
  } catch {
    return false;
  }
}

/**
 * Soft couplant / encoder position tick while sliding an ultrasonic transducer across a specimen.
 */
export function playProbeScanTick(): boolean {
  const prefs = readNdtAudioPreferences();
  if (!prefs.enabled || prefs.volume <= 0) return false;

  const nowMs = Date.now();
  if (nowMs - lastScanTickAtMs < 75) return false;
  lastScanTickAtMs = nowMs;

  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, t0);
    osc.frequency.exponentialRampToValueAtTime(340, t0 + 0.014);

    const peakGain = 0.03 * prefs.volume;
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.linearRampToValueAtTime(peakGain, t0 + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.016);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.018);
    return true;
  } catch {
    return false;
  }
}

/**
 * Harmonic two-tone calibration confirmation chime when a reference echo (80% FSH), BIP, or stage passes.
 */
export function playCalibrationSuccessPing(): boolean {
  const prefs = readNdtAudioPreferences();
  if (!prefs.enabled || prefs.volume <= 0) return false;

  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    const t0 = ctx.currentTime;
    const notes = [880, 1318.5]; // A5 -> E6 clean fifth interval
    notes.forEach((freq, idx) => {
      const start = t0 + idx * 0.065;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      const peakGain = 0.08 * prefs.volume;
      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ultrasonic Gate Alarm / Defect Detection acoustic sonar ping.
 * Critical planar flaws emit a crisp dual-pulse alert; volumetric/moderate flaws emit a single resonant ping.
 */
export function playDefectDetectedPing(severity: DefectAudioSeverity = 'High'): boolean {
  const prefs = readNdtAudioPreferences();
  if (!prefs.enabled || prefs.volume <= 0) return false;

  const nowMs = Date.now();
  if (nowMs - lastPingAtMs < 180) return false;
  lastPingAtMs = nowMs;

  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    const t0 = ctx.currentTime;
    const pulses =
      severity === 'Critical'
        ? [
            { freq: 1174.66, offset: 0, dur: 0.11 }, // D6
            { freq: 1567.98, offset: 0.095, dur: 0.15 }, // G6
          ]
        : severity === 'High'
        ? [{ freq: 1046.5, offset: 0, dur: 0.16 }] // C6
        : [{ freq: 783.99, offset: 0, dur: 0.14 }]; // G5

    for (const p of pulses) {
      const start = t0 + p.offset;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = severity === 'Critical' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(p.freq, start);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 0.96, start + p.dur);

      const peakGain = (severity === 'Critical' ? 0.105 : 0.085) * prefs.volume;
      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + p.dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + p.dur + 0.01);
    }
    return true;
  } catch {
    return false;
  }
}

export function useNdtAudioFeedback() {
  const [prefs, setPrefs] = useState<NdtAudioPreferences>(() => readNdtAudioPreferences());

  useEffect(() => {
    const sync = () => setPrefs(readNdtAudioPreferences());
    window.addEventListener(AUDIO_SYNC_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUDIO_SYNC_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleEnabled = useCallback(() => {
    const next = writeNdtAudioPreferences({ enabled: !readNdtAudioPreferences().enabled });
    setPrefs(next);
    if (next.enabled) {
      playCalibrationClick();
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const next = writeNdtAudioPreferences({ volume, enabled: volume > 0 });
    setPrefs(next);
  }, []);

  return {
    audioEnabled: prefs.enabled,
    audioVolume: prefs.volume,
    toggleAudioEnabled: toggleEnabled,
    setAudioVolume: setVolume,
    playCalibrationClick,
    playProbeScanTick,
    playCalibrationSuccessPing,
    playDefectDetectedPing,
  };
}

export function resetNdtAudioCooldowns(): void {
  lastClickAtMs = 0;
  lastScanTickAtMs = 0;
  lastPingAtMs = 0;
}

