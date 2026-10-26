import { useCallback, useEffect, useState } from 'react';
import { ENGINEERING_DISCIPLINES } from '../data/academyCurriculum';

export const USER_COURSE_PROGRESS_STORAGE_KEY = 'insco_user_course_progress_v1';
const LEGACY_COMPLETED_MODULES_KEY = 'insco_academy_completed_modules';

export interface NdtCourseModuleDescriptor {
  moduleId: string;
  disciplineId: string;
  disciplineTitleAr: string;
  disciplineTitleEn: string;
  levelIdx: number;
  levelId: string;
  levelNameAr: string;
  levelNameEn: string;
  titleAr: string;
  titleEn: string;
  duration: string;
}

export interface UserModuleProgressProfile {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  primaryDisciplineId: string;
  completedModuleIds: string[];
  updatedAt: string;
  isBuiltInCohort?: boolean;
}

export interface UserCourseProgressState {
  version: 1;
  activeUserId: string;
  users: UserModuleProgressProfile[];
}

export interface DisciplineCompletionStat {
  disciplineId: string;
  titleAr: string;
  titleEn: string;
  completed: number;
  total: number;
  percent: number;
}

export interface UserProgressSummary {
  userId: string;
  completedCount: number;
  totalCount: number;
  percent: number;
  byDiscipline: DisciplineCompletionStat[];
  nextRecommendedModule: NdtCourseModuleDescriptor | null;
}

const ALL_NDT_MODULES: NdtCourseModuleDescriptor[] = (() => {
  const list: NdtCourseModuleDescriptor[] = [];
  for (const disc of ENGINEERING_DISCIPLINES) {
    disc.levels.forEach((lvl, lIdx) => {
      for (const mod of lvl.modules) {
        list.push({
          moduleId: mod.id,
          disciplineId: disc.id,
          disciplineTitleAr: disc.titleAr,
          disciplineTitleEn: disc.titleEn,
          levelIdx: lIdx,
          levelId: lvl.levelId,
          levelNameAr: lvl.nameAr,
          levelNameEn: lvl.nameEn,
          titleAr: mod.titleAr,
          titleEn: mod.titleEn,
          duration: mod.duration,
        });
      }
    });
  }
  return list;
})();

const VALID_MODULE_IDS = new Set<string>(ALL_NDT_MODULES.map((m) => m.moduleId));

export function getAllNdtCourseModules(): NdtCourseModuleDescriptor[] {
  return ALL_NDT_MODULES;
}

function sanitizeModuleIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of input) {
    if (typeof item === 'string' && VALID_MODULE_IDS.has(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function readLegacyCompletedModuleIds(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LEGACY_COMPLETED_MODULES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    return sanitizeModuleIds(
      Object.entries(parsed)
        .filter(([, done]) => Boolean(done))
        .map(([id]) => id)
    );
  } catch {
    return [];
  }
}

function writeLegacyCompletedModulesMap(moduleIds: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const nextMap: Record<string, boolean> = {};
    for (const id of sanitizeModuleIds(moduleIds)) {
      nextMap[id] = true;
    }
    localStorage.setItem(LEGACY_COMPLETED_MODULES_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
}

function safeDispatchProgressEvents(detail?: unknown): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const EventCtor = window.CustomEvent || globalThis.CustomEvent;
      if (EventCtor) {
        window.dispatchEvent(new EventCtor('insco_user_progress_updated', { detail }));
        window.dispatchEvent(new EventCtor('insco_progress_updated', { detail }));
      }
    }
  } catch {
    // Safe no-op in non-DOM test contexts
  }
}

function createDefaultUsers(initialCurrentModules: string[]): UserModuleProgressProfile[] {
  const nowIso = '2026-10-26T00:00:00.000Z';
  return [
    {
      id: 'current_student_user',
      nameEn: 'INSCO Trainee (You)',
      nameAr: 'المتدرب الفاحص (أنت)',
      roleEn: 'NDT Qualification Candidate',
      roleAr: 'مرشح تأهيل الفحص غير الإتلافي NDT',
      primaryDisciplineId: 'conventional_ndt',
      completedModuleIds: sanitizeModuleIds(initialCurrentModules),
      updatedAt: nowIso,
      isBuiltInCohort: true,
    },
    {
      id: 'trainee_tareq',
      nameEn: 'Eng. Tareq Al-Ghamdi',
      nameAr: 'م. طارق الغامدي',
      roleEn: 'Senior NDT Level III & PAUT Lead',
      roleAr: 'أخصائي فحص مستوى ثالث وقائد PAUT/UT',
      primaryDisciplineId: 'ndt_advanced',
      completedModuleIds: sanitizeModuleIds([
        'mod_c_acad_1',
        'mod_c_acad_2',
        'mod_c_acad_vt',
        'mod_c_vt',
        'mod_c_pt',
        'mod_c_mt',
        'mod_c_ut',
        'mod_c_rt',
        'mod_c2_1',
        'mod_c2_2',
        'mod_c3_1',
        'mod_c3_2',
        'mod_adv_ut',
        'mod_adv_et',
        'mod_weld_1',
        'mod_weld_2',
        'mod_api_1',
        'mod_qaqc_1',
      ]),
      updatedAt: nowIso,
      isBuiltInCohort: true,
    },
    {
      id: 'trainee_sarah',
      nameEn: 'Eng. Sarah Mansour',
      nameAr: 'م. سارة منصور',
      roleEn: 'API 510/570 & RT Inspector',
      roleAr: 'مفتشة أوعية ضغط وتصوير إشعاعي API/RT',
      primaryDisciplineId: 'api_inspection',
      completedModuleIds: sanitizeModuleIds([
        'mod_c_acad_1',
        'mod_c_acad_2',
        'mod_c_vt',
        'mod_c_pt',
        'mod_c_rt',
        'mod_c2_1',
        'mod_c2_2',
        'mod_api_1',
        'mod_api_2',
        'mod_pwht_1',
        'mod_integrity_1',
      ]),
      updatedAt: nowIso,
      isBuiltInCohort: true,
    },
    {
      id: 'trainee_omar',
      nameEn: 'Insp. Omar Al-Kuwaiti',
      nameAr: 'الفاحص عمر الكويتي',
      roleEn: 'Conventional NDT Level II (VT/PT/MT/UT)',
      roleAr: 'فاحص NDT مستوى ثانٍ (بصري وموجات وجسيمات)',
      primaryDisciplineId: 'conventional_ndt',
      completedModuleIds: sanitizeModuleIds([
        'mod_c_acad_1',
        'mod_c_vt',
        'mod_c_pt',
        'mod_c_mt',
        'mod_c_ut',
        'mod_c_rt',
      ]),
      updatedAt: nowIso,
      isBuiltInCohort: true,
    },
  ];
}

export function readUserCourseProgress(): UserCourseProgressState {
  const legacyActiveModules = readLegacyCompletedModuleIds();
  try {
    if (typeof localStorage === 'undefined') {
      const defaults = createDefaultUsers(legacyActiveModules);
      return { version: 1, activeUserId: defaults[0].id, users: defaults };
    }

    const raw = localStorage.getItem(USER_COURSE_PROGRESS_STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultUsers(legacyActiveModules);
      return { version: 1, activeUserId: defaults[0].id, users: defaults };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      const defaults = createDefaultUsers(legacyActiveModules);
      return { version: 1, activeUserId: defaults[0].id, users: defaults };
    }

    const data = parsed as Partial<UserCourseProgressState>;
    const rawUsers = Array.isArray(data.users) ? data.users : [];
    const seenUserIds = new Set<string>();
    const validUsers: UserModuleProgressProfile[] = [];

    for (const item of rawUsers) {
      if (!item || typeof item !== 'object') continue;
      const u = item as Partial<UserModuleProgressProfile>;
      const id = typeof u.id === 'string' && u.id.trim() ? u.id.trim() : '';
      if (!id || seenUserIds.has(id)) continue;
      seenUserIds.add(id);

      const fallbackName = id;
      const nameEn = typeof u.nameEn === 'string' && u.nameEn.trim() ? u.nameEn.trim() : fallbackName;
      const nameAr = typeof u.nameAr === 'string' && u.nameAr.trim() ? u.nameAr.trim() : nameEn;
      const roleEn = typeof u.roleEn === 'string' && u.roleEn.trim() ? u.roleEn.trim() : 'NDT Trainee';
      const roleAr = typeof u.roleAr === 'string' && u.roleAr.trim() ? u.roleAr.trim() : roleEn;
      const primaryDisciplineId =
        typeof u.primaryDisciplineId === 'string' &&
        ENGINEERING_DISCIPLINES.some((d) => d.id === u.primaryDisciplineId)
          ? u.primaryDisciplineId
          : 'conventional_ndt';

      validUsers.push({
        id,
        nameEn,
        nameAr,
        roleEn,
        roleAr,
        primaryDisciplineId,
        completedModuleIds: sanitizeModuleIds(u.completedModuleIds),
        updatedAt: typeof u.updatedAt === 'string' ? u.updatedAt : '',
        isBuiltInCohort: Boolean(u.isBuiltInCohort),
      });
    }

    if (validUsers.length === 0) {
      const defaults = createDefaultUsers(legacyActiveModules);
      return { version: 1, activeUserId: defaults[0].id, users: defaults };
    }

    const activeUserId =
      typeof data.activeUserId === 'string' && validUsers.some((u) => u.id === data.activeUserId)
        ? data.activeUserId
        : validUsers[0].id;

    return {
      version: 1,
      activeUserId,
      users: validUsers,
    };
  } catch {
    const defaults = createDefaultUsers(legacyActiveModules);
    return { version: 1, activeUserId: defaults[0].id, users: defaults };
  }
}

function writeUserCourseProgress(state: UserCourseProgressState): UserCourseProgressState {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_COURSE_PROGRESS_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage unavailability
  }
  return state;
}

/**
 * Called by curriculumProgress.ts when markModuleCompleted / unmarkModuleCompleted runs
 * so the active user's localStorage record stays synchronized without circular logic.
 */
export function syncActiveUserModuleCompletion(
  moduleId: string,
  completed: boolean
): UserCourseProgressState {
  const current = readUserCourseProgress();
  if (!VALID_MODULE_IDS.has(moduleId)) return current;

  const nowIso = new Date().toISOString();
  const nextUsers = current.users.map((user) => {
    if (user.id !== current.activeUserId) return user;
    const set = new Set(user.completedModuleIds);
    if (completed) {
      set.add(moduleId);
    } else {
      set.delete(moduleId);
    }
    return {
      ...user,
      completedModuleIds: Array.from(set),
      updatedAt: nowIso,
    };
  });

  const nextState: UserCourseProgressState = {
    version: 1,
    activeUserId: current.activeUserId,
    users: nextUsers,
  };
  writeUserCourseProgress(nextState);
  return nextState;
}

export function setUserModuleCompleted(
  moduleId: string,
  completed: boolean,
  targetUserId?: string
): UserCourseProgressState {
  const current = readUserCourseProgress();
  if (!VALID_MODULE_IDS.has(moduleId)) return current;

  const resolvedUserId = targetUserId || current.activeUserId;
  const nowIso = new Date().toISOString();

  const nextUsers = current.users.map((user) => {
    if (user.id !== resolvedUserId) return user;
    const set = new Set(user.completedModuleIds);
    if (completed) {
      set.add(moduleId);
    } else {
      set.delete(moduleId);
    }
    return {
      ...user,
      completedModuleIds: Array.from(set),
      updatedAt: nowIso,
    };
  });

  const nextState: UserCourseProgressState = {
    version: 1,
    activeUserId: current.activeUserId,
    users: nextUsers,
  };

  writeUserCourseProgress(nextState);

  if (resolvedUserId === nextState.activeUserId) {
    const activeUser = nextUsers.find((u) => u.id === nextState.activeUserId);
    if (activeUser) {
      writeLegacyCompletedModulesMap(activeUser.completedModuleIds);
    }
  }

  safeDispatchProgressEvents({ userId: resolvedUserId, moduleId, completed });
  return nextState;
}

export function toggleUserModuleCompleted(
  moduleId: string,
  targetUserId?: string
): { state: UserCourseProgressState; completed: boolean } {
  const current = readUserCourseProgress();
  const resolvedUserId = targetUserId || current.activeUserId;
  const user = current.users.find((u) => u.id === resolvedUserId);
  const currentlyCompleted = user ? user.completedModuleIds.includes(moduleId) : false;
  const nextCompleted = !currentlyCompleted;
  const nextState = setUserModuleCompleted(moduleId, nextCompleted, resolvedUserId);
  return { state: nextState, completed: nextCompleted };
}

export function setActiveProgressUser(userId: string): UserCourseProgressState {
  const current = readUserCourseProgress();
  const target = current.users.find((u) => u.id === userId);
  if (!target) return current;

  // Preserve any legacy completions recorded on the outgoing active user before switching
  const legacyIds = readLegacyCompletedModuleIds();
  const mergedUsers = current.users.map((u) => {
    if (u.id !== current.activeUserId) return u;
    const merged = sanitizeModuleIds([...u.completedModuleIds, ...legacyIds]);
    return { ...u, completedModuleIds: merged };
  });

  const resolvedTarget = mergedUsers.find((u) => u.id === userId) || target;
  const nextState: UserCourseProgressState = {
    version: 1,
    activeUserId: resolvedTarget.id,
    users: mergedUsers,
  };

  writeUserCourseProgress(nextState);
  writeLegacyCompletedModulesMap(resolvedTarget.completedModuleIds);
  safeDispatchProgressEvents({ activeUserId: resolvedTarget.id });
  return nextState;
}

export interface AddProgressUserInput {
  name: string;
  nameAr?: string;
  role?: string;
  roleAr?: string;
  primaryDisciplineId?: string;
  initialCompletedModuleIds?: string[];
  makeActive?: boolean;
}

export function addProgressUser(input: AddProgressUserInput): UserCourseProgressState {
  const trimmedName = input.name.trim();
  if (!trimmedName) return readUserCourseProgress();

  const current = readUserCourseProgress();
  const disc =
    ENGINEERING_DISCIPLINES.find((d) => d.id === input.primaryDisciplineId) ||
    ENGINEERING_DISCIPLINES[0];

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  const uniqueId = `user_${slug || 'trainee'}_${Date.now().toString(36)}`;

  const roleEn = input.role?.trim() || `${disc.titleEn} Trainee`;
  const roleAr = input.roleAr?.trim() || input.role?.trim() || `متدرب ${disc.titleAr}`;

  const newUser: UserModuleProgressProfile = {
    id: uniqueId,
    nameEn: trimmedName,
    nameAr: input.nameAr?.trim() || trimmedName,
    roleEn,
    roleAr,
    primaryDisciplineId: disc.id,
    completedModuleIds: sanitizeModuleIds(input.initialCompletedModuleIds || []),
    updatedAt: new Date().toISOString(),
    isBuiltInCohort: false,
  };

  const makeActive = input.makeActive ?? true;
  const nextActiveUserId = makeActive ? newUser.id : current.activeUserId;

  const nextState: UserCourseProgressState = {
    version: 1,
    activeUserId: nextActiveUserId,
    users: [newUser, ...current.users],
  };

  writeUserCourseProgress(nextState);
  if (makeActive) {
    writeLegacyCompletedModulesMap(newUser.completedModuleIds);
  }
  safeDispatchProgressEvents({ addedUserId: newUser.id, activeUserId: nextActiveUserId });
  return nextState;
}

export function removeProgressUser(userId: string): UserCourseProgressState {
  const current = readUserCourseProgress();
  if (current.users.length <= 1) return current;

  const remaining = current.users.filter((u) => u.id !== userId);
  if (remaining.length === 0 || remaining.length === current.users.length) return current;

  const nextActiveUserId =
    current.activeUserId === userId ? remaining[0].id : current.activeUserId;
  const nextState: UserCourseProgressState = {
    version: 1,
    activeUserId: nextActiveUserId,
    users: remaining,
  };

  writeUserCourseProgress(nextState);
  if (current.activeUserId === userId) {
    writeLegacyCompletedModulesMap(remaining[0].completedModuleIds);
  }
  safeDispatchProgressEvents({ removedUserId: userId, activeUserId: nextActiveUserId });
  return nextState;
}

export function resetUserModuleProgress(userId?: string): UserCourseProgressState {
  const current = readUserCourseProgress();
  const resolvedId = userId || current.activeUserId;
  const nowIso = new Date().toISOString();

  const nextUsers = current.users.map((u) =>
    u.id === resolvedId ? { ...u, completedModuleIds: [], updatedAt: nowIso } : u
  );

  const nextState: UserCourseProgressState = {
    version: 1,
    activeUserId: current.activeUserId,
    users: nextUsers,
  };

  writeUserCourseProgress(nextState);
  if (resolvedId === nextState.activeUserId) {
    writeLegacyCompletedModulesMap([]);
  }
  safeDispatchProgressEvents({ resetUserId: resolvedId });
  return nextState;
}

export function getUserProgressSummary(user: UserModuleProgressProfile): UserProgressSummary {
  const completedSet = new Set(sanitizeModuleIds(user.completedModuleIds));
  const totalCount = ALL_NDT_MODULES.length;
  const completedCount = ALL_NDT_MODULES.filter((m) => completedSet.has(m.moduleId)).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const byDiscipline: DisciplineCompletionStat[] = ENGINEERING_DISCIPLINES.map((disc) => {
    const discModules = ALL_NDT_MODULES.filter((m) => m.disciplineId === disc.id);
    const done = discModules.filter((m) => completedSet.has(m.moduleId)).length;
    const total = discModules.length;
    return {
      disciplineId: disc.id,
      titleAr: disc.titleAr,
      titleEn: disc.titleEn,
      completed: done,
      total,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  // Prioritize incomplete module in user's primary discipline first, then overall
  const nextInPrimary = ALL_NDT_MODULES.find(
    (m) => m.disciplineId === user.primaryDisciplineId && !completedSet.has(m.moduleId)
  );
  const nextAny = ALL_NDT_MODULES.find((m) => !completedSet.has(m.moduleId));

  return {
    userId: user.id,
    completedCount,
    totalCount,
    percent,
    byDiscipline,
    nextRecommendedModule: nextInPrimary || nextAny || null,
  };
}

export function useUserCourseProgress() {
  const [state, setState] = useState<UserCourseProgressState>(() => readUserCourseProgress());

  const refresh = useCallback(() => {
    setState(readUserCourseProgress());
  }, []);

  useEffect(() => {
    window.addEventListener('insco_user_progress_updated', refresh);
    window.addEventListener('insco_progress_updated', refresh);
    window.addEventListener('insco_quiz_completed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('insco_user_progress_updated', refresh);
      window.removeEventListener('insco_progress_updated', refresh);
      window.removeEventListener('insco_quiz_completed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const activeUser =
    state.users.find((u) => u.id === state.activeUserId) || state.users[0];

  const userSummaries = state.users.map((u) => ({
    user: u,
    summary: getUserProgressSummary(u),
    isActive: u.id === activeUser.id,
  }));

  const activeSummary =
    userSummaries.find((item) => item.isActive)?.summary ||
    getUserProgressSummary(activeUser);

  return {
    state,
    activeUser,
    activeSummary,
    userSummaries,
    allModules: ALL_NDT_MODULES,
    refresh,
  };
}
