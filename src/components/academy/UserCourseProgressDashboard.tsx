import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  RotateCcw,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import {
  addProgressUser,
  removeProgressUser,
  resetUserModuleProgress,
  setActiveProgressUser,
  toggleUserModuleCompleted,
  useUserCourseProgress,
} from '../../utils/userCourseProgressStore';

interface UserCourseProgressDashboardProps {
  language: Language;
  onNavigateToModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
}

export const UserCourseProgressDashboard: React.FC<UserCourseProgressDashboardProps> = ({
  language,
  onNavigateToModule,
}) => {
  const isAr = language === 'ar';
  const { activeUser, userSummaries, allModules } = useUserCourseProgress();

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserDisciplineId, setNewUserDisciplineId] = useState(ENGINEERING_DISCIPLINES[0].id);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('all');

  const cohortAveragePct = useMemo(() => {
    if (userSummaries.length === 0) return 0;
    const sum = userSummaries.reduce((acc, item) => acc + item.summary.percent, 0);
    return Math.round(sum / userSummaries.length);
  }, [userSummaries]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUserName.trim();
    if (!trimmed) return;
    addProgressUser({
      name: trimmed,
      nameAr: trimmed,
      role: newUserRole.trim() || undefined,
      roleAr: newUserRole.trim() || undefined,
      primaryDisciplineId: newUserDisciplineId,
      makeActive: true,
    });
    setNewUserName('');
    setNewUserRole('');
    setIsAddFormOpen(false);
  };

  const filteredDrawerModules = useMemo(() => {
    if (selectedDisciplineFilter === 'all') return allModules;
    return allModules.filter((m) => m.disciplineId === selectedDisciplineFilter);
  }, [allModules, selectedDisciplineFilter]);

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="academy-user-progress-dashboard"
      aria-label={
        isAr
          ? 'لوحة تتبع تقدم المتدربين في وحدات دورات NDT'
          : 'Academy User NDT Course Progress Dashboard'
      }
      className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-6 space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#202752]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-cyan-300">
              {isAr ? 'سجل إتمام وحدات المتدربين (محفوظ محلياً)' : 'Per-User NDT Course Progress (Saved Locally)'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {userSummaries.length} {isAr ? 'متدربين مسجلين' : 'registered users'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {allModules.length} {isAr ? 'وحدة تدريبية معتمدة' : 'NDT course modules'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">
              {isAr ? `متوسط الإنجاز ${cohortAveragePct}%` : `Cohort avg ${cohortAveragePct}%`}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {isAr
              ? 'متابعة إتمام وحدات دورات NDT لكل متدرب'
              : 'NDT Course Module Completion by User'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="text-xs text-slate-300 tabular-nums px-3 py-2 rounded-lg border border-[#252e5c] bg-[#0b0d1e]">
            <span className="text-slate-400">
              {isAr ? 'المتدرب النشط: ' : 'Active user: '}
            </span>
            <strong className="text-amber-300 font-semibold">
              {isAr ? activeUser.nameAr : activeUser.nameEn}
            </strong>
          </div>

          <button
            type="button"
            data-testid="toggle-add-user-form"
            onClick={() => setIsAddFormOpen((prev) => !prev)}
            className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة متدرب جديد' : 'Add User'}</span>
          </button>
        </div>
      </div>

      {/* Inline Add Trainee Form */}
      {isAddFormOpen && (
        <form
          onSubmit={handleCreateUser}
          data-testid="add-progress-user-form"
          className="rounded-xl border border-[#2c3668] bg-[#0b0d1e] p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-4 space-y-1">
            <label
              htmlFor="new-trainee-name"
              className="block text-xs font-medium text-slate-300"
            >
              {isAr ? 'اسم المتدرب / المفتش' : 'Trainee / Inspector Name'}
            </label>
            <input
              id="new-trainee-name"
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder={isAr ? 'مثال: م. مازن القحطاني' : 'e.g., Eng. Mazen Al-Qahtani'}
              className="w-full rounded-lg border border-[#2b3463] bg-[#10132b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label
              htmlFor="new-trainee-role"
              className="block text-xs font-medium text-slate-300"
            >
              {isAr ? 'المسمى الوظيفي (اختياري)' : 'Role / Level (optional)'}
            </label>
            <input
              id="new-trainee-role"
              type="text"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              placeholder={isAr ? 'مثال: فني UT مستوى ثانٍ' : 'e.g., UT Level II Technician'}
              className="w-full rounded-lg border border-[#2b3463] bg-[#10132b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label
              htmlFor="new-trainee-discipline"
              className="block text-xs font-medium text-slate-300"
            >
              {isAr ? 'المسار الأساسي' : 'Primary NDT Track'}
            </label>
            <select
              id="new-trainee-discipline"
              value={newUserDisciplineId}
              onChange={(e) => setNewUserDisciplineId(e.target.value)}
              className="w-full rounded-lg border border-[#2b3463] bg-[#10132b] px-2.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {ENGINEERING_DISCIPLINES.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {isAr ? disc.titleAr : disc.titleEn}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              data-testid="submit-new-user-btn"
              className="flex-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-2.5 py-2 rounded-lg border border-[#303966] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {/* Per-User Progress Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {userSummaries.map(({ user, summary, isActive }) => {
          const isDrawerOpen = expandedUserId === user.id;
          const displayName = isAr ? user.nameAr : user.nameEn;
          const displayRole = isAr ? user.roleAr : user.roleEn;
          const barFillClass =
            summary.percent >= 100
              ? 'fill-emerald-400'
              : summary.percent >= 50
                ? 'fill-cyan-400'
                : 'fill-amber-400';

          const activeDisciplines = summary.byDiscipline.filter((d) => d.completed > 0);
          const completedSet = new Set(user.completedModuleIds);

          return (
            <div
              key={user.id}
              data-testid={`user-progress-card-${user.id}`}
              className={`rounded-xl border p-4 space-y-3 transition-colors ${
                isActive
                  ? 'border-amber-400/70 bg-[#14193a]'
                  : 'border-[#232b54] bg-[#0b0d1e]'
              }`}
            >
              {/* User Identity & Completion Readout */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{displayName}</h4>
                    {isActive && (
                      <span className="text-[11px] font-semibold text-amber-300">
                        {isAr ? '· نشط' : '· Active'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{displayRole}</p>
                </div>

                <div className="text-end shrink-0 tabular-nums">
                  <div
                    data-testid={`user-progress-percent-${user.id}`}
                    className="text-sm font-black font-mono text-white"
                  >
                    {summary.percent}%
                  </div>
                  <div
                    data-testid={`user-progress-count-${user.id}`}
                    className="text-[11px] font-mono text-slate-400"
                  >
                    {summary.completedCount}/{summary.totalCount}{' '}
                    {isAr ? 'وحدة' : 'modules'}
                  </div>
                </div>
              </div>

              {/* Per-User Progress Bar (Pure SVG + WAI-ARIA, zero inline styles) */}
              <div
                role="progressbar"
                data-testid={`user-progress-bar-${user.id}`}
                aria-label={
                  isAr
                    ? `نسبة تقدم ${displayName}: ${summary.percent}% (${summary.completedCount} من ${summary.totalCount})`
                    : `${displayName} course progress: ${summary.percent}% (${summary.completedCount} of ${summary.totalCount} modules)`
                }
                aria-valuenow={summary.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 w-full rounded-full bg-[#070914] border border-[#222a52] overflow-hidden"
              >
                <svg
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  className="w-full h-full block"
                >
                  <rect
                    x={isAr ? 100 - summary.percent : 0}
                    y={0}
                    width={summary.percent}
                    height={8}
                    className={`${barFillClass} transition-all duration-300`}
                  />
                </svg>
              </div>

              {/* Compact Discipline Breakdown & User Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="text-[11px] text-slate-400 tabular-nums truncate max-w-full">
                  {activeDisciplines.length > 0 ? (
                    <span>
                      {activeDisciplines
                        .slice(0, 3)
                        .map((d) => `${(isAr ? d.titleAr : d.titleEn).split(' ')[0]} ${d.completed}/${d.total}`)
                        .join(' · ')}
                    </span>
                  ) : (
                    <span>
                      {isAr
                        ? 'لم يتم تأشير أي وحدة بعد'
                        : 'No completed NDT modules yet'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <button
                      type="button"
                      data-testid={`switch-user-${user.id}`}
                      onClick={() => setActiveProgressUser(user.id)}
                      className="px-2.5 py-1 rounded-md border border-[#2e386b] bg-[#10132b] hover:border-amber-400 text-[11px] font-semibold text-slate-200 hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>{isAr ? 'تفعيل' : 'Set Active'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid={`manage-user-modules-${user.id}`}
                    onClick={() =>
                      setExpandedUserId((prev) => (prev === user.id ? null : user.id))
                    }
                    className="px-2.5 py-1 rounded-md border border-[#2e386b] bg-[#10132b] hover:border-cyan-400 text-[11px] font-semibold text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>{isAr ? 'وحدات المتدرب' : 'Modules'}</span>
                    {isDrawerOpen ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {!user.isBuiltInCohort && userSummaries.length > 1 && (
                    <button
                      type="button"
                      data-testid={`remove-user-${user.id}`}
                      aria-label={isAr ? `حذف ${displayName}` : `Remove ${displayName}`}
                      onClick={() => removeProgressUser(user.id)}
                      className="p-1 rounded-md border border-[#2e386b] text-slate-400 hover:text-rose-400 hover:border-rose-400/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable NDT Course Module Checklist for this User */}
              {isDrawerOpen && (
                <div
                  data-testid={`user-module-drawer-${user.id}`}
                  className="pt-3 mt-2 border-t border-[#232b54] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select
                      aria-label={isAr ? 'تصفية حسب التخصص' : 'Filter by discipline'}
                      value={selectedDisciplineFilter}
                      onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                      className="rounded-md border border-[#2b3463] bg-[#070914] px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="all">
                        {isAr
                          ? `جميع وحدات NDT (${allModules.length})`
                          : `All NDT Modules (${allModules.length})`}
                      </option>
                      {ENGINEERING_DISCIPLINES.map((disc) => (
                        <option key={disc.id} value={disc.id}>
                          {isAr ? disc.titleAr : disc.titleEn}
                        </option>
                      ))}
                    </select>

                    {summary.completedCount > 0 && (
                      <button
                        type="button"
                        data-testid={`reset-user-progress-${user.id}`}
                        onClick={() => resetUserModuleProgress(user.id)}
                        className="px-2 py-1 rounded-md border border-[#2e386b] text-[11px] text-slate-400 hover:text-rose-300 hover:border-rose-400/50 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {filteredDrawerModules.map((mod) => {
                      const done = completedSet.has(mod.moduleId);
                      return (
                        <div
                          key={mod.moduleId}
                          className={`rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2 text-xs transition-colors ${
                            done
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                              : 'border-[#1f264c] bg-[#080a18] text-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            data-testid={`drawer-toggle-${user.id}-${mod.moduleId}`}
                            onClick={() => toggleUserModuleCompleted(mod.moduleId, user.id)}
                            className="flex items-start gap-2 text-start flex-1 min-w-0 cursor-pointer"
                          >
                            {done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            )}
                            <span className="line-clamp-1">
                              {isAr ? mod.titleAr : mod.titleEn}
                            </span>
                          </button>

                          {onNavigateToModule && (
                            <button
                              type="button"
                              aria-label={
                                isAr
                                  ? `فتح ${mod.titleAr}`
                                  : `Open ${mod.titleEn}`
                              }
                              onClick={() => {
                                if (!isActive) {
                                  setActiveProgressUser(user.id);
                                }
                                onNavigateToModule(mod.disciplineId, mod.levelIdx, mod.moduleId);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-300 shrink-0 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default UserCourseProgressDashboard;
