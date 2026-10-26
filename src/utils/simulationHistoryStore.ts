import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AcademyTab } from '../academyTabs';

export type SimulationAttemptStatus = 'PASS' | 'FAIL';

export type SimulationNdtMethod =
  | 'UT'
  | 'PAUT'
  | 'DAC'
  | 'RT'
  | 'MT'
  | 'PT'
  | 'VT'
  | 'MULTI';

export interface SimulationDefectEntry {
  id: string;
  ar: string;
  en: string;
}

export interface SimulationHistoryRecord {
  id: string;
  timestamp: string;
  simulatorId: string;
  targetSubTab: AcademyTab;
  simulatorTitle: { ar: string; en: string };
  ndtMethod: SimulationNdtMethod;
  defectTypes: SimulationDefectEntry[];
  status: SimulationAttemptStatus;
  accuracyPct: number;
  xpEarned: number;
  codeVerdict?: 'ACCEPT' | 'REJECT';
  traineeVerdict?: 'ACCEPT' | 'REJECT';
  codeStandard?: string;
  scorePct?: number;
  actualDepthMm?: number;
  measuredDepthMm?: number;
  actualLengthMm?: number;
  measuredLengthMm?: number;
  notes?: { ar: string; en: string };
}

export interface RecordSimulationAttemptInput {
  timestamp?: string;
  simulatorId: string;
  targetSubTab?: AcademyTab;
  simulatorTitle: { ar: string; en: string };
  ndtMethod: SimulationNdtMethod;
  defectTypes: SimulationDefectEntry[];
  status: SimulationAttemptStatus;
  codeVerdict?: 'ACCEPT' | 'REJECT';
  traineeVerdict?: 'ACCEPT' | 'REJECT';
  codeStandard?: string;
  scorePct?: number;
  actualDepthMm?: number;
  measuredDepthMm?: number;
  actualLengthMm?: number;
  measuredLengthMm?: number;
  notes?: { ar: string; en: string };
}

export interface SimulationXpMilestone {
  level: number;
  minXp: number;
  title: { ar: string; en: string };
}

export interface SimulationMilestoneProgress {
  level: number;
  title: { ar: string; en: string };
  currentTierMinXp: number;
  nextTierXp: number;
  xpIntoTier: number;
  xpNeededForNext: number;
  tierProgressPct: number;
}

export interface SimulationLevelUpEventDetail {
  id: string;
  previousLevel: number;
  newLevel: number;
  levelTitle: { ar: string; en: string };
  xpEarned: number;
  totalXp: number;
  nextTierXp: number;
  timestamp: string;
}

export const SIMULATION_XP_MILESTONES: readonly SimulationXpMilestone[] = [
  {
    level: 1,
    minXp: 0,
    title: {
      ar: 'متدرب فحص غير إتلافي',
      en: 'NDT Trainee',
    },
  },
  {
    level: 2,
    minXp: 100,
    title: {
      ar: 'مشغل فحص — المستوى الأول',
      en: 'NDT Level I Operator',
    },
  },
  {
    level: 3,
    minXp: 250,
    title: {
      ar: 'مفتش معتمد — المستوى الثاني',
      en: 'NDT Level II Inspector',
    },
  },
  {
    level: 4,
    minXp: 500,
    title: {
      ar: 'محلل عيوب متقدم (PAUT / DAC)',
      en: 'Senior PAUT & DAC Analyst',
    },
  },
  {
    level: 5,
    minXp: 850,
    title: {
      ar: 'أخصائي أكواد الفحص الدولية',
      en: 'Lead Code Specialist',
    },
  },
  {
    level: 6,
    minXp: 1300,
    title: {
      ar: 'كبير مفتشي الفحص — المستوى الثالث',
      en: 'Principal NDT Level III Master',
    },
  },
] as const;

const PRESTIGE_STEP_XP = 500;

export const SIMULATION_HISTORY_STORAGE_KEY = 'insco_academy_simulation_history_v1';
const SIMULATION_HISTORY_EVENT = 'insco-simulation-history-updated';
export const SIMULATION_LEVEL_UP_EVENT = 'insco-simulation-level-up';
const MAX_SIMULATION_HISTORY_ITEMS = 200;

export function resolveDetectionAccuracyPct(input: {
  status: SimulationAttemptStatus;
  scorePct?: number;
  codeVerdict?: 'ACCEPT' | 'REJECT';
  traineeVerdict?: 'ACCEPT' | 'REJECT';
  actualDepthMm?: number;
  measuredDepthMm?: number;
  actualLengthMm?: number;
  measuredLengthMm?: number;
}): number {
  if (typeof input.scorePct === 'number' && Number.isFinite(input.scorePct)) {
    return Math.max(0, Math.min(100, Math.round(input.scorePct)));
  }

  const hasDepthSizing =
    typeof input.actualDepthMm === 'number' &&
    Number.isFinite(input.actualDepthMm) &&
    typeof input.measuredDepthMm === 'number' &&
    Number.isFinite(input.measuredDepthMm);

  const hasLengthSizing =
    typeof input.actualLengthMm === 'number' &&
    Number.isFinite(input.actualLengthMm) &&
    typeof input.measuredLengthMm === 'number' &&
    Number.isFinite(input.measuredLengthMm);

  if (hasDepthSizing || hasLengthSizing) {
    const verdictMatches =
      input.codeVerdict && input.traineeVerdict
        ? input.codeVerdict === input.traineeVerdict
        : input.status === 'PASS';
    const verdictPts = verdictMatches ? 50 : 10;

    const depthErr = hasDepthSizing
      ? Math.abs((input.measuredDepthMm as number) - (input.actualDepthMm as number))
      : 1.0;
    const lenErr = hasLengthSizing
      ? Math.abs((input.measuredLengthMm as number) - (input.actualLengthMm as number))
      : 1.5;

    const depthPts = Math.max(0, Math.round(25 * Math.max(0, 1 - depthErr / 6)));
    const lenPts = Math.max(0, Math.round(25 * Math.max(0, 1 - lenErr / 8)));
    return Math.max(0, Math.min(100, verdictPts + depthPts + lenPts));
  }

  return input.status === 'PASS' ? 88 : 38;
}

export function calculateSimulationAttemptXp(params: {
  status: SimulationAttemptStatus;
  accuracyPct: number;
  defectCount?: number;
  isBlindChallenge?: boolean;
}): number {
  const clampedAccuracy = Math.max(0, Math.min(100, Math.round(params.accuracyPct)));
  const extraDefects = Math.min(3, Math.max(0, (params.defectCount ?? 1) - 1));
  const multiDefectBonus = extraDefects * 15;
  const blindBonus = params.isBlindChallenge ? 20 : 0;

  if (params.status === 'PASS') {
    return 40 + Math.round(clampedAccuracy * 0.6) + multiDefectBonus + blindBonus;
  }

  return Math.max(15, Math.round(clampedAccuracy * 0.45)) + Math.round(multiDefectBonus * 0.5);
}

export function getSimulationMilestoneProgress(totalXp: number): SimulationMilestoneProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const topDefined = SIMULATION_XP_MILESTONES[SIMULATION_XP_MILESTONES.length - 1];

  if (safeXp >= topDefined.minXp) {
    const extraLevels = Math.floor((safeXp - topDefined.minXp) / PRESTIGE_STEP_XP);
    const level = topDefined.level + extraLevels;
    const currentTierMinXp = topDefined.minXp + extraLevels * PRESTIGE_STEP_XP;
    const nextTierXp = currentTierMinXp + PRESTIGE_STEP_XP;
    const xpIntoTier = safeXp - currentTierMinXp;
    const xpNeededForNext = nextTierXp - safeXp;
    const tierProgressPct = Math.min(
      100,
      Math.max(0, Math.round((xpIntoTier / PRESTIGE_STEP_XP) * 100))
    );

    return {
      level,
      title:
        extraLevels > 0
          ? {
              ar: `${topDefined.title.ar} (+${extraLevels})`,
              en: `${topDefined.title.en} (+${extraLevels})`,
            }
          : topDefined.title,
      currentTierMinXp,
      nextTierXp,
      xpIntoTier,
      xpNeededForNext,
      tierProgressPct,
    };
  }

  let currentIdx = 0;
  for (let i = 0; i < SIMULATION_XP_MILESTONES.length; i++) {
    if (safeXp >= SIMULATION_XP_MILESTONES[i].minXp) {
      currentIdx = i;
    } else {
      break;
    }
  }

  const currentMilestone = SIMULATION_XP_MILESTONES[currentIdx];
  const nextMilestone = SIMULATION_XP_MILESTONES[currentIdx + 1];
  const currentTierMinXp = currentMilestone.minXp;
  const nextTierXp = nextMilestone.minXp;
  const span = Math.max(1, nextTierXp - currentTierMinXp);
  const xpIntoTier = safeXp - currentTierMinXp;
  const xpNeededForNext = Math.max(0, nextTierXp - safeXp);
  const tierProgressPct = Math.min(100, Math.max(0, Math.round((xpIntoTier / span) * 100)));

  return {
    level: currentMilestone.level,
    title: currentMilestone.title,
    currentTierMinXp,
    nextTierXp,
    xpIntoTier,
    xpNeededForNext,
    tierProgressPct,
  };
}

function isValidStatus(value: unknown): value is SimulationAttemptStatus {
  return value === 'PASS' || value === 'FAIL';
}

function isValidDefectEntry(item: unknown): item is SimulationDefectEntry {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.ar === 'string' &&
    typeof candidate.en === 'string'
  );
}

function sanitizeRecord(raw: unknown): SimulationHistoryRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) return null;
  if (typeof r.timestamp !== 'string' || Number.isNaN(Date.parse(r.timestamp))) return null;
  if (!isValidStatus(r.status)) return null;
  if (!Array.isArray(r.defectTypes) || r.defectTypes.length === 0) return null;

  const validDefects = r.defectTypes.filter(isValidDefectEntry);
  if (validDefects.length === 0) return null;

  const simTitleObj =
    r.simulatorTitle && typeof r.simulatorTitle === 'object'
      ? (r.simulatorTitle as Record<string, unknown>)
      : {};

  const simulatorId = typeof r.simulatorId === 'string' ? r.simulatorId : 'weld_simulator';
  const codeVerdict =
    r.codeVerdict === 'ACCEPT' || r.codeVerdict === 'REJECT' ? r.codeVerdict : undefined;
  const traineeVerdict =
    r.traineeVerdict === 'ACCEPT' || r.traineeVerdict === 'REJECT'
      ? r.traineeVerdict
      : undefined;
  const scorePct =
    typeof r.scorePct === 'number' && Number.isFinite(r.scorePct) ? r.scorePct : undefined;
  const actualDepthMm =
    typeof r.actualDepthMm === 'number' && Number.isFinite(r.actualDepthMm)
      ? r.actualDepthMm
      : undefined;
  const measuredDepthMm =
    typeof r.measuredDepthMm === 'number' && Number.isFinite(r.measuredDepthMm)
      ? r.measuredDepthMm
      : undefined;
  const actualLengthMm =
    typeof r.actualLengthMm === 'number' && Number.isFinite(r.actualLengthMm)
      ? r.actualLengthMm
      : undefined;
  const measuredLengthMm =
    typeof r.measuredLengthMm === 'number' && Number.isFinite(r.measuredLengthMm)
      ? r.measuredLengthMm
      : undefined;

  const accuracyPct =
    typeof r.accuracyPct === 'number' && Number.isFinite(r.accuracyPct)
      ? Math.max(0, Math.min(100, Math.round(r.accuracyPct)))
      : resolveDetectionAccuracyPct({
          status: r.status,
          scorePct,
          codeVerdict,
          traineeVerdict,
          actualDepthMm,
          measuredDepthMm,
          actualLengthMm,
          measuredLengthMm,
        });

  const xpEarned =
    typeof r.xpEarned === 'number' && Number.isFinite(r.xpEarned) && r.xpEarned >= 0
      ? Math.round(r.xpEarned)
      : calculateSimulationAttemptXp({
          status: r.status,
          accuracyPct,
          defectCount: validDefects.length,
          isBlindChallenge: simulatorId === 'blind_drill',
        });

  return {
    id: r.id,
    timestamp: r.timestamp,
    simulatorId,
    targetSubTab:
      typeof r.targetSubTab === 'string' ? (r.targetSubTab as AcademyTab) : 'weld_simulator',
    simulatorTitle: {
      ar: typeof simTitleObj.ar === 'string' ? simTitleObj.ar : 'محاكي الفحص غير الإتلافي',
      en: typeof simTitleObj.en === 'string' ? simTitleObj.en : 'NDT Inspection Simulator',
    },
    ndtMethod:
      typeof r.ndtMethod === 'string' ? (r.ndtMethod as SimulationNdtMethod) : 'UT',
    defectTypes: validDefects,
    status: r.status,
    accuracyPct,
    xpEarned,
    codeVerdict,
    traineeVerdict,
    codeStandard: typeof r.codeStandard === 'string' ? r.codeStandard : undefined,
    scorePct,
    actualDepthMm,
    measuredDepthMm,
    actualLengthMm,
    measuredLengthMm,
    notes:
      r.notes &&
      typeof r.notes === 'object' &&
      typeof (r.notes as Record<string, unknown>).ar === 'string' &&
      typeof (r.notes as Record<string, unknown>).en === 'string'
        ? {
            ar: (r.notes as { ar: string; en: string }).ar,
            en: (r.notes as { ar: string; en: string }).en,
          }
        : undefined,
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Ignore storage access errors in restricted iframe/private modes
  }
  return null;
}

function notifySimulationHistoryUpdated(): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(SIMULATION_HISTORY_EVENT));
    }
  } catch {
    // Ignore dispatch errors
  }
}

function notifySimulationLevelUp(detail: SimulationLevelUpEventDetail): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(SIMULATION_LEVEL_UP_EVENT, { detail }));
    }
  } catch {
    // Ignore dispatch errors
  }
}

export function getSimulationHistory(): SimulationHistoryRecord[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(SIMULATION_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seenIds = new Set<string>();
    const cleaned: SimulationHistoryRecord[] = [];
    for (const item of parsed) {
      const valid = sanitizeRecord(item);
      if (valid && !seenIds.has(valid.id)) {
        seenIds.add(valid.id);
        cleaned.push(valid);
      }
    }

    cleaned.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    return cleaned.slice(0, MAX_SIMULATION_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function persistHistory(records: SimulationHistoryRecord[]): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      SIMULATION_HISTORY_STORAGE_KEY,
      JSON.stringify(records.slice(0, MAX_SIMULATION_HISTORY_ITEMS))
    );
    notifySimulationHistoryUpdated();
  } catch {
    // Ignore quota or private-mode write errors
  }
}

export function recordSimulationAttempt(
  input: RecordSimulationAttemptInput
): SimulationHistoryRecord {
  const timestamp =
    input.timestamp && !Number.isNaN(Date.parse(input.timestamp))
      ? input.timestamp
      : new Date().toISOString();

  const normalizedDefects =
    input.defectTypes.length > 0
      ? input.defectTypes
      : [
          {
            id: 'unspecified_indication',
            ar: 'مؤشر فحص غير محدد',
            en: 'Unspecified NDT Indication',
          },
        ];

  const normalizedScorePct =
    typeof input.scorePct === 'number' && Number.isFinite(input.scorePct)
      ? Math.max(0, Math.min(100, Math.round(input.scorePct)))
      : undefined;

  const accuracyPct = resolveDetectionAccuracyPct({
    status: input.status,
    scorePct: normalizedScorePct,
    codeVerdict: input.codeVerdict,
    traineeVerdict: input.traineeVerdict,
    actualDepthMm: input.actualDepthMm,
    measuredDepthMm: input.measuredDepthMm,
    actualLengthMm: input.actualLengthMm,
    measuredLengthMm: input.measuredLengthMm,
  });

  const xpEarned = calculateSimulationAttemptXp({
    status: input.status,
    accuracyPct,
    defectCount: normalizedDefects.length,
    isBlindChallenge: input.simulatorId === 'blind_drill',
  });

  const record: SimulationHistoryRecord = {
    id: `sim-hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    simulatorId: input.simulatorId,
    targetSubTab: input.targetSubTab ?? 'weld_simulator',
    simulatorTitle: input.simulatorTitle,
    ndtMethod: input.ndtMethod,
    defectTypes: normalizedDefects,
    status: input.status,
    accuracyPct,
    xpEarned,
    codeVerdict: input.codeVerdict,
    traineeVerdict: input.traineeVerdict,
    codeStandard: input.codeStandard,
    scorePct: normalizedScorePct,
    actualDepthMm:
      typeof input.actualDepthMm === 'number'
        ? Number(input.actualDepthMm.toFixed(1))
        : undefined,
    measuredDepthMm:
      typeof input.measuredDepthMm === 'number'
        ? Number(input.measuredDepthMm.toFixed(1))
        : undefined,
    actualLengthMm:
      typeof input.actualLengthMm === 'number'
        ? Number(input.actualLengthMm.toFixed(1))
        : undefined,
    measuredLengthMm:
      typeof input.measuredLengthMm === 'number'
        ? Number(input.measuredLengthMm.toFixed(1))
        : undefined,
    notes: input.notes,
  };

  const existing = getSimulationHistory();
  const previousStats = computeSimulationHistoryStats(existing);

  const updated = [record, ...existing].slice(0, MAX_SIMULATION_HISTORY_ITEMS);
  persistHistory(updated);

  const updatedStats = computeSimulationHistoryStats(updated);
  if (updatedStats.level > previousStats.level) {
    notifySimulationLevelUp({
      id: `lvl-up-${record.id}`,
      previousLevel: previousStats.level,
      newLevel: updatedStats.level,
      levelTitle: updatedStats.levelTitle,
      xpEarned: record.xpEarned,
      totalXp: updatedStats.totalXp,
      nextTierXp: updatedStats.nextTierXp,
      timestamp: record.timestamp,
    });
  }

  return record;
}

export function deleteSimulationAttempt(id: string): void {
  const existing = getSimulationHistory();
  const filtered = existing.filter((item) => item.id !== id);
  persistHistory(filtered);
}

export function clearSimulationHistory(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(SIMULATION_HISTORY_STORAGE_KEY);
    notifySimulationHistoryUpdated();
  } catch {
    // Ignore storage removal errors
  }
}

export function subscribeSimulationHistory(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = () => callback();
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SIMULATION_HISTORY_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(SIMULATION_HISTORY_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(SIMULATION_HISTORY_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

export function subscribeSimulationLevelUp(
  callback: (detail: SimulationLevelUpEventDetail) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const custom = event as CustomEvent<SimulationLevelUpEventDetail>;
    if (custom.detail && typeof custom.detail.newLevel === 'number') {
      callback(custom.detail);
    }
  };

  window.addEventListener(SIMULATION_LEVEL_UP_EVENT, handler);
  return () => {
    window.removeEventListener(SIMULATION_LEVEL_UP_EVENT, handler);
  };
}

export interface SimulationHistoryStats {
  totalAttempts: number;
  passCount: number;
  failCount: number;
  passRatePct: number;
  uniqueDefectCount: number;
  totalXp: number;
  averageAccuracyPct: number;
  level: number;
  levelTitle: { ar: string; en: string };
  currentTierMinXp: number;
  nextTierXp: number;
  xpIntoTier: number;
  xpNeededForNext: number;
  tierProgressPct: number;
}

export function computeSimulationHistoryStats(
  attempts: SimulationHistoryRecord[]
): SimulationHistoryStats {
  const totalAttempts = attempts.length;
  const passCount = attempts.filter((a) => a.status === 'PASS').length;
  const failCount = totalAttempts - passCount;
  const passRatePct = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

  const uniqueDefects = new Set<string>();
  let totalXp = 0;
  let accuracySum = 0;

  for (const attempt of attempts) {
    totalXp += attempt.xpEarned;
    accuracySum += attempt.accuracyPct;
    for (const d of attempt.defectTypes) {
      uniqueDefects.add(d.id);
    }
  }

  const averageAccuracyPct =
    totalAttempts > 0 ? Math.round(accuracySum / totalAttempts) : 0;
  const milestone = getSimulationMilestoneProgress(totalXp);

  return {
    totalAttempts,
    passCount,
    failCount,
    passRatePct,
    uniqueDefectCount: uniqueDefects.size,
    totalXp,
    averageAccuracyPct,
    level: milestone.level,
    levelTitle: milestone.title,
    currentTierMinXp: milestone.currentTierMinXp,
    nextTierXp: milestone.nextTierXp,
    xpIntoTier: milestone.xpIntoTier,
    xpNeededForNext: milestone.xpNeededForNext,
    tierProgressPct: milestone.tierProgressPct,
  };
}

export function useSimulationHistory() {
  const [attempts, setAttempts] = useState<SimulationHistoryRecord[]>(() =>
    getSimulationHistory()
  );

  useEffect(() => {
    setAttempts(getSimulationHistory());
    return subscribeSimulationHistory(() => {
      setAttempts(getSimulationHistory());
    });
  }, []);

  const stats = useMemo(() => computeSimulationHistoryStats(attempts), [attempts]);

  const recordAttempt = useCallback((input: RecordSimulationAttemptInput) => {
    return recordSimulationAttempt(input);
  }, []);

  const deleteAttempt = useCallback((id: string) => {
    deleteSimulationAttempt(id);
  }, []);

  const clearHistory = useCallback(() => {
    clearSimulationHistory();
  }, []);

  return {
    attempts,
    stats,
    recordAttempt,
    deleteAttempt,
    clearHistory,
  };
}

export function useSimulationLevelUp(autoDismissMs = 6500) {
  const [levelUp, setLevelUp] = useState<SimulationLevelUpEventDetail | null>(null);

  useEffect(() => {
    return subscribeSimulationLevelUp((detail) => {
      setLevelUp(detail);
    });
  }, []);

  useEffect(() => {
    if (!levelUp || autoDismissMs <= 0) return;
    const timer = setTimeout(() => {
      setLevelUp(null);
    }, autoDismissMs);
    (timer as unknown as { unref?: () => void })?.unref?.();
    return () => clearTimeout(timer);
  }, [levelUp, autoDismissMs]);

  const dismissLevelUp = useCallback(() => {
    setLevelUp(null);
  }, []);

  return {
    levelUp,
    dismissLevelUp,
  };
}
