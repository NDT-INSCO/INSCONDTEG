import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExtendedWeldFlawId } from '../data/utWeldDefectsCatalog';

export type DiscoveredDefectSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';
export type DiscoveredLabMethod = 'UT 3D' | 'PAUT 3D' | 'MT 3D';

export interface DefectSizingMetrics {
  calculatedDepthMm: number;
  calculatedLengthMm: number;
  heightMm?: number;
  transverseWidthMm?: number;
  soundPathMm?: number;
  sizingMethod?: string;
}

export interface Defect3DWireframeSpec {
  id: string;
  codeSymbol: string;
  label: { ar: string; en: string };
  severity: DiscoveredDefectSeverity;
  morphology: 'Planar' | 'Volumetric' | 'Surface';
  /** Transverse offset from weld centerline (mm, -25..+25) */
  xMm: number;
  /** Longitudinal position along 100 mm weld seam (mm, 0..100; 50 = mid-specimen) */
  yMm: number;
  /** Exact calculated depth below top surface Z (mm) */
  calculatedDepthMm: number;
  /** Exact calculated longitudinal flaw length L along weld axis (mm) */
  calculatedLengthMm: number;
  /** Through-wall flaw height Δh (mm) */
  heightMm: number;
  /** Transverse flaw width Δw (mm) */
  transverseWidthMm: number;
  /** Orientation skew angle in degrees (used for surface cracks in MT) */
  orientationDeg?: number;
  /** True when currently intersected by the live 3D beam / active probe */
  isLiveActive?: boolean;
}

export interface DiscoveredDefectEntry {
  id: string;
  defectKey: string;
  catalogDefectId?: ExtendedWeldFlawId;
  codeSymbol: string;
  type: { ar: string; en: string };
  morphology: 'Planar' | 'Volumetric' | 'Surface';
  method: DiscoveredLabMethod;
  sourceLab: { ar: string; en: string };
  location: {
    zone: { ar: string; en: string };
    xMm: number;
    yMm: number;
    depthZMm: number;
    soundPathOrAngle: string;
  };
  sizing?: DefectSizingMetrics;
  severity: DiscoveredDefectSeverity;
  peakSignalPct: number;
  hitCount: number;
  discoveredAt: string;
  lastUpdatedAt: string;
}

export interface LogDiscoveredDefectInput {
  /** Dedup key combining lab + defect + coordinate zone so sweeping probe updates peak without spamming rows */
  defectKey: string;
  catalogDefectId?: ExtendedWeldFlawId;
  codeSymbol: string;
  type: { ar: string; en: string };
  morphology: 'Planar' | 'Volumetric' | 'Surface';
  method: DiscoveredLabMethod;
  sourceLab: { ar: string; en: string };
  location: {
    zone: { ar: string; en: string };
    xMm: number;
    yMm: number;
    depthZMm: number;
    soundPathOrAngle: string;
  };
  sizing?: DefectSizingMetrics;
  severity: DiscoveredDefectSeverity;
  peakSignalPct: number;
  discoveredAt?: string;
}

const STORAGE_KEY = 'insco_3d_lab_discovered_defects_v1';
const UPDATE_EVENT = 'insco:3d-discovered-defects-updated';
const MAX_ENTRIES = 50;

export function deriveDefectSeverity(
  category: 'Planar' | 'Volumetric' | 'Surface',
  defectId?: string
): DiscoveredDefectSeverity {
  if (category === 'Planar' || category === 'Surface') {
    return 'Critical';
  }
  if (
    defectId === 'slag_inclusion' ||
    defectId === 'porosity_cluster' ||
    defectId === 'undercut_toe' ||
    defectId === 'root_concavity' ||
    defectId === 'base_lamination'
  ) {
    return 'High';
  }
  if (defectId === 'tungsten_inclusion' || defectId === 'wagon_tracks') {
    return 'Moderate';
  }
  return 'Low';
}

export function readDiscoveredDefects(): DiscoveredDefectEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DiscoveredDefectEntry[]) : [];
  } catch {
    return [];
  }
}

function persistAndBroadcast(entries: DiscoveredDefectEntry[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: entries }));
    }
  } catch {
    // Ignore storage quota / sandbox issues
  }
}

let defectIdSequence = 0;

/**
 * Automatically logs a newly discovered defect during 3D inspection, or updates peak signal & hit count
 * if the same defect coordinate was already discovered in the current log.
 * Returns `{ entry, isNewDiscovery }`.
 */
export function logDiscoveredDefect(input: LogDiscoveredDefectInput): {
  entry: DiscoveredDefectEntry;
  isNewDiscovery: boolean;
} {
  const existing = readDiscoveredDefects();
  const nowIso = input.discoveredAt ?? new Date().toISOString();
  const matchIdx = existing.findIndex((item) => item.defectKey === input.defectKey);

  if (matchIdx >= 0) {
    const prev = existing[matchIdx];
    const updated: DiscoveredDefectEntry = {
      ...prev,
      location: input.location,
      sizing: input.sizing ?? prev.sizing,
      peakSignalPct: Math.max(prev.peakSignalPct, Number(input.peakSignalPct.toFixed(1))),
      hitCount: prev.hitCount + 1,
      lastUpdatedAt: nowIso,
    };
    const nextList = [...existing];
    nextList[matchIdx] = updated;
    persistAndBroadcast(nextList);
    return { entry: updated, isNewDiscovery: false };
  }

  defectIdSequence = (defectIdSequence + 1) % 10000;
  const created: DiscoveredDefectEntry = {
    id: `3D-DEF-${Date.now().toString(36).toUpperCase()}-${defectIdSequence.toString().padStart(3, '0')}`,
    defectKey: input.defectKey,
    catalogDefectId: input.catalogDefectId,
    codeSymbol: input.codeSymbol,
    type: input.type,
    morphology: input.morphology,
    method: input.method,
    sourceLab: input.sourceLab,
    location: input.location,
    sizing: input.sizing,
    severity: input.severity,
    peakSignalPct: Number(input.peakSignalPct.toFixed(1)),
    hitCount: 1,
    discoveredAt: nowIso,
    lastUpdatedAt: nowIso,
  };

  const nextList = [created, ...existing].slice(0, MAX_ENTRIES);
  persistAndBroadcast(nextList);
  return { entry: created, isNewDiscovery: true };
}

export function entryTo3DWireframeSpec(
  entry: DiscoveredDefectEntry,
  isLiveActive = false
): Defect3DWireframeSpec {
  const defaultLength =
    entry.method === 'MT 3D'
      ? 24.0
      : entry.morphology === 'Planar'
      ? 14.0
      : 10.0;
  const defaultHeight =
    entry.method === 'MT 3D'
      ? 1.5
      : entry.morphology === 'Planar'
      ? 3.8
      : 2.8;
  const defaultWidth = entry.morphology === 'Volumetric' ? 2.8 : 2.0;

  return {
    id: entry.id,
    codeSymbol: entry.codeSymbol,
    label: entry.type,
    severity: entry.severity,
    morphology: entry.morphology,
    xMm: entry.location.xMm,
    yMm: entry.location.yMm,
    calculatedDepthMm: Number(
      (entry.sizing?.calculatedDepthMm ?? entry.location.depthZMm).toFixed(1)
    ),
    calculatedLengthMm: Number(
      (entry.sizing?.calculatedLengthMm ?? defaultLength).toFixed(1)
    ),
    heightMm: Number((entry.sizing?.heightMm ?? defaultHeight).toFixed(1)),
    transverseWidthMm: Number(
      (entry.sizing?.transverseWidthMm ?? defaultWidth).toFixed(1)
    ),
    isLiveActive,
  };
}

export function removeDiscoveredDefect(id: string): void {
  const filtered = readDiscoveredDefects().filter((item) => item.id !== id);
  persistAndBroadcast(filtered);
}

export function clearDiscoveredDefects(): void {
  persistAndBroadcast([]);
}

export function useDiscoveredDefectsLog() {
  const [entries, setEntries] = useState<DiscoveredDefectEntry[]>(() => readDiscoveredDefects());

  useEffect(() => {
    const refresh = () => setEntries(readDiscoveredDefects());
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const summary = useMemo(() => {
    let critical = 0;
    let high = 0;
    let moderateOrLow = 0;
    let maxSignalPct = 0;

    for (const item of entries) {
      if (item.severity === 'Critical') critical += 1;
      else if (item.severity === 'High') high += 1;
      else moderateOrLow += 1;
      if (item.peakSignalPct > maxSignalPct) maxSignalPct = item.peakSignalPct;
    }

    return {
      total: entries.length,
      critical,
      high,
      moderateOrLow,
      maxSignalPct,
    };
  }, [entries]);

  const handleRemove = useCallback((id: string) => removeDiscoveredDefect(id), []);
  const handleClear = useCallback(() => clearDiscoveredDefects(), []);

  return {
    entries,
    summary,
    removeEntry: handleRemove,
    clearAll: handleClear,
  };
}
