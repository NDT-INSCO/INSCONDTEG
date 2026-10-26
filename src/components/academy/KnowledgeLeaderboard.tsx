import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Search, 
  Filter, 
  Sparkles, 
  Zap, 
  User, 
  Building2, 
  Globe, 
  BookOpen, 
  Sliders, 
  ArrowUpRight, 
  Layers, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  PlusCircle, 
  X,
  Volume2,
  VolumeX,
  Share2,
  Check
} from 'lucide-react';
import { Language } from '../../types';
import { 
  getKnowledgeLeaderboard, 
  getCurrentStudentProfile, 
  updateStudentProfile, 
  logStudySession, 
  StudentPerformer, 
  LeaderboardTimeframe, 
  LeaderboardSortMetric, 
  StudentTier,
  StudySessionLog 
} from '../../utils/knowledgeLeaderboardService';

interface KnowledgeLeaderboardProps {
  language: Language;
  onLaunchQuiz?: (disciplineId?: string, levelId?: string) => void;
  onNavigateToDiscipline?: (disciplineId: string) => void;
  onNavigateToCurriculum?: () => void;
}

export const KnowledgeLeaderboard: React.FC<KnowledgeLeaderboardProps> = ({
  language,
  onLaunchQuiz,
  onNavigateToDiscipline,
  onNavigateToCurriculum
}) => {
  const isAr = language === 'ar';

  // Filters & State
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all_time');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [sortMetric, setSortMetric] = useState<LeaderboardSortMetric>('xp');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformer | null>(null);

  // Focus Timer Modal & State
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState<boolean>(false);
  const [timerDurationMinutes, setTimerDurationMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [studyTopic, setStudyTopic] = useState<string>('Ultrasonic Testing & Calibration Review');
  const [audioAmbientEnabled, setAudioAmbientEnabled] = useState<boolean>(false);

  // Manual Log Study Hours Modal
  const [isManualLogOpen, setIsManualLogOpen] = useState<boolean>(false);
  const [manualHours, setManualHours] = useState<number>(1.5);
  const [manualTopic, setManualTopic] = useState<string>('ASME Section V Article 4 Non-Destructive Examination');
  const [manualSessionType, setManualSessionType] = useState<StudySessionLog['sessionType']>('reading');
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Edit Name Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('');

  // Data reload trigger
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Listen to updates from curriculum progress or study logging
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('insco_leaderboard_updated', handleUpdate);
    window.addEventListener('insco_progress_updated', handleUpdate);
    window.addEventListener('insco_topic_progress_updated', handleUpdate);
    window.addEventListener('insco_study_session_updated', handleUpdate);
    return () => {
      window.removeEventListener('insco_leaderboard_updated', handleUpdate);
      window.removeEventListener('insco_progress_updated', handleUpdate);
      window.removeEventListener('insco_topic_progress_updated', handleUpdate);
      window.removeEventListener('insco_study_session_updated', handleUpdate);
    };
  }, []);

  // Fetch data
  const { rankedPerformers, currentUserRank, currentUser, totalStudentsCount } = useMemo(() => {
    return getKnowledgeLeaderboard({
      timeframe,
      disciplineId: disciplineFilter,
      sortMetric
    });
  }, [timeframe, disciplineFilter, sortMetric, refreshKey]);

  // Apply search query
  const displayedPerformers = useMemo(() => {
    if (!searchQuery.trim()) return rankedPerformers;
    const q = searchQuery.toLowerCase().trim();
    return rankedPerformers.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.nameAr.includes(q) ||
      p.companyOrOrg.toLowerCase().includes(q) ||
      p.disciplineTitleEn.toLowerCase().includes(q) ||
      p.disciplineTitleAr.includes(q)
    );
  }, [rankedPerformers, searchQuery]);

  // Focus Timer Tick effect
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && secondsRemaining === 0) {
      setIsTimerRunning(false);
      // Log session
      logStudySession({
        date: new Date().toISOString(),
        durationMinutes: timerDurationMinutes,
        topicOrDiscipline: studyTopic,
        sessionType: 'focus_timer'
      });
      setLogSuccessMessage(
        isAr 
          ? `تهانينا! أكملت بنجاح جلسة دراسة مركزة مدتها ${timerDurationMinutes} دقيقة وأُضيفت إلى رصيدك!` 
          : `Congratulations! Completed ${timerDurationMinutes}-minute focus session and added to your active study hours!`
      );
      setTimeout(() => setLogSuccessMessage(null), 6000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining, timerDurationMinutes, studyTopic, isAr]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = (minutes: number = timerDurationMinutes) => {
    setIsTimerRunning(false);
    setTimerDurationMinutes(minutes);
    setSecondsRemaining(minutes * 60);
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateStudentProfile({
        name: editName.trim(),
        nameAr: editName.trim(),
        companyOrOrg: editCompany.trim() || currentUser.companyOrOrg
      });
    }
    setIsEditProfileOpen(false);
  };

  const handleManualLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualHours <= 0) return;
    const minutes = Math.round(manualHours * 60);
    logStudySession({
      date: new Date().toISOString(),
      durationMinutes: minutes,
      topicOrDiscipline: manualTopic,
      sessionType: manualSessionType
    });
    setIsManualLogOpen(false);
    setLogSuccessMessage(
      isAr 
        ? `تم تسجيل ${manualHours} ساعة دراسة نشطة بنجاح في سجل متصدري الأكاديمية!` 
        : `Successfully logged ${manualHours} active study hours to your leaderboard profile!`
    );
    setTimeout(() => setLogSuccessMessage(null), 5000);
  };

  // Helper for tier badges
  const getTierColor = (tier: StudentTier) => {
    switch (tier) {
      case 'Master':
        return 'from-amber-400 to-amber-600 text-amber-950 border-amber-300 shadow-amber-500/20';
      case 'Diamond':
        return 'from-cyan-400 to-blue-600 text-cyan-950 border-cyan-300 shadow-cyan-500/20';
      case 'Platinum':
        return 'from-slate-200 to-slate-400 text-slate-900 border-slate-200 shadow-slate-500/20';
      case 'Gold':
        return 'from-yellow-400 to-amber-500 text-amber-950 border-yellow-300';
      case 'Silver':
        return 'from-slate-300 to-slate-400 text-slate-900 border-slate-300';
      case 'Bronze':
      default:
        return 'from-amber-700 to-orange-800 text-white border-amber-600';
    }
  };

  // Top 3 Podium
  const top1 = rankedPerformers[0];
  const top2 = rankedPerformers[1];
  const top3 = rankedPerformers[2];

  // Progress to next rank
  const nextRankUser = currentUserRank > 1 ? rankedPerformers[currentUserRank - 2] : null;
  const xpDifference = nextRankUser ? Math.max(10, nextRankUser.xp - currentUser.xp) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Alert */}
      {logSuccessMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{logSuccessMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0f2b] via-[#121942] to-[#0a0d24] border border-amber-500/30 p-6 sm:p-8 md:p-10 shadow-2xl">
        {/* Ambient glow backgrounds */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'منصة التنافس الأكاديمي ولوحة المعرفة' : 'Knowledge & Competency Leaderboard'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {isAr ? 'لوحة متصدري المعرفة وساعات الدراسة النشطة' : 'Educational Academy Knowledge Leaderboard'}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {isAr 
                ? 'تتبع تقدمك الدراسي، دقة اختبارات الكفاءة الهندسية، وساعات المذاكرة المركزة. تنافس بنزاهة مع نخبة مهندسي وفاحصي الفحوصات غير الإتلافية ومفتشي الجودة في المنطقة.'
                : 'Track student curriculum progress, qualification quiz accuracy, and active focus study hours. Engage in healthy competition with top NDT inspectors, API auditors, and welding specialists.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5 bg-[#080c1f]/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'ساعات المذاكرة موثقة بالدقيقة' : 'Study hours verified live'}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-[#080c1f]/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'تقييم شامل وفق معايير ASNT/API' : 'Evaluated against ASNT/API'}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-[#080c1f]/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{isAr ? 'تحديث مستمر لنقاط الخبرة XP' : 'Dynamic XP calculation'}</span>
              </span>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => {
                setIsFocusTimerOpen(true);
                handleResetTimer(25);
              }}
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-102 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isAr ? 'بدء مؤقت دراسة مركزة (Pomodoro)' : 'Start Focus Study Session'}</span>
            </button>

            <button
              onClick={() => setIsManualLogOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#141a3d] hover:bg-[#1b2352] text-amber-300 border border-amber-500/40 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تسجيل ساعات دراسة ذاتية / كودية' : 'Log Self-Study Hours'}</span>
            </button>

            {onLaunchQuiz && (
              <button
                onClick={() => onLaunchQuiz()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0e1430] hover:bg-[#161f4a] text-cyan-300 border border-cyan-500/30 font-bold text-xs transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'خوض اختبار كفاءة لرفع الترتيب' : 'Take Quiz to Boost Rank'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current User Spotlight Pinned Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d1338] via-[#141d4f] to-[#0d1338] border-2 border-cyan-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* User Meta */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-400 flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-cyan-300">
                {currentUser.name.charAt(0)}
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 shadow">
                #{currentUserRank}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-white">{isAr ? currentUser.nameAr : currentUser.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r ${getTierColor(currentUser.tier)}`}>
                  {currentUser.tier}
                </span>
                <button
                  onClick={() => {
                    setEditName(currentUser.name);
                    setEditCompany(currentUser.companyOrOrg);
                    setIsEditProfileOpen(true);
                  }}
                  className="text-xs text-slate-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {isAr ? 'تعديل البيانات' : 'Edit profile'}
                </button>
              </div>

              <p className="text-slate-400 text-xs flex items-center gap-2">
                <span>{isAr ? currentUser.titleAr : currentUser.titleEn}</span>
                <span>•</span>
                <span className="text-cyan-300 font-medium">{currentUser.companyOrOrg}</span>
              </p>

              <div className="text-xs text-amber-300 flex items-center gap-1 font-mono tabular-nums">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {nextRankUser 
                    ? (isAr 
                        ? `يفصلك ${xpDifference} نقطة XP عن المركز #${currentUserRank - 1} (${nextRankUser.name})` 
                        : `${xpDifference} XP needed to reach Rank #${currentUserRank - 1} (${nextRankUser.name})`)
                    : (isAr ? 'أنت في المركز الأول على مستوى الأكاديمية!' : 'You are currently leading at Rank #1!')}
                </span>
              </div>

              {currentUser.badges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {currentUser.badges.slice(0, 3).map((badge, bIdx) => (
                    <React.Fragment key={badge.id}>
                      {bIdx > 0 && <span aria-hidden="true" className="text-slate-500">·</span>}
                      <span className="font-medium text-slate-200">
                        {isAr ? badge.titleAr : badge.titleEn}
                      </span>
                    </React.Fragment>
                  ))}
                  {currentUser.recentActivity && (
                    <>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="text-cyan-300">
                        {isAr ? currentUser.recentActivity.actionAr : currentUser.recentActivity.actionEn}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Metrics Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {/* Active Study Hours */}
            <div className="bg-[#090d24] border border-cyan-500/20 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-cyan-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? 'ساعات المذاكرة' : 'Study Hours'}</span>
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {currentUser.studyHours} <span className="text-xs text-cyan-400 font-normal">{isAr ? 'س' : 'hrs'}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {currentUser.weeklyStudyHours} {isAr ? 'ساعة هذا الأسبوع' : 'hrs this week'}
              </div>
            </div>

            {/* Quiz Performance */}
            <div className="bg-[#090d24] border border-emerald-500/20 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-emerald-300">
                <Award className="w-3.5 h-3.5" />
                <span>{isAr ? 'دقة الاختبارات' : 'Quiz Accuracy'}</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {currentUser.quizAccuracy}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {currentUser.quizzesTaken} {isAr ? 'اختباراً منجزاً' : 'quizzes completed'}
              </div>
            </div>

            {/* Modules Completed */}
            <div className="bg-[#090d24] border border-amber-500/20 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-amber-300">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isAr ? 'المقررات المكتملة' : 'Modules Done'}</span>
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {currentUser.completedModules}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {currentUser.completedTopics} {isAr ? 'موضوعاً متقناً' : 'topics mastered'}
              </div>
            </div>

            {/* Composite XP */}
            <div className="bg-[#090d24] border border-purple-500/20 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-purple-300">
                <Flame className="w-3.5 h-3.5" />
                <span>{isAr ? 'نقاط التنافس XP' : 'Total XP'}</span>
              </div>
              <div className="text-2xl font-black text-purple-300 mt-1">
                {currentUser.xp.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {currentUser.streakDays} {isAr ? 'أيام متتالية' : 'day streak'} 🔥
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
        {/* Rank 2 (Silver) */}
        {top2 && (
          <div 
            onClick={() => setSelectedStudent(top2)}
            className="order-2 md:order-1 rounded-3xl bg-gradient-to-b from-[#13193e] to-[#0a0d24] border-2 border-slate-400/40 p-6 shadow-xl relative hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 flex items-center justify-center font-black text-lg shadow-lg border border-white">
              2
            </div>

            <div className="text-center mt-3 space-y-2">
              <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-slate-600 to-slate-400 p-1 flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-full bg-[#0d122e] flex items-center justify-center text-white font-bold text-xl">
                  {top2.name.charAt(0)}
                </div>
              </div>

              <div>
                <span className="text-xs">{top2.countryFlag}</span>
                <h4 className="text-lg font-black text-white group-hover:text-slate-200 transition">
                  {isAr ? top2.nameAr : top2.name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">{isAr ? top2.titleAr : top2.titleEn}</p>
              </div>

              <div className="inline-block px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-400/10 text-slate-300 border border-slate-400/30">
                {top2.xp.toLocaleString()} XP
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800 text-slate-300">
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'ساعات المذاكرة' : 'Study Time'}</div>
                  <div className="font-bold text-cyan-300">{top2.studyHours}h</div>
                </div>
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الدقة' : 'Accuracy'}</div>
                  <div className="font-bold text-emerald-400">{top2.quizAccuracy}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold - Elevated Champion) */}
        {top1 && (
          <div 
            onClick={() => setSelectedStudent(top1)}
            className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-[#1c2254] via-[#141a42] to-[#0a0d24] border-2 border-amber-400 p-7 shadow-2xl shadow-amber-500/20 relative md:-translate-y-4 hover:border-amber-300 transition-all cursor-pointer group"
          >
            {/* Crown Badge */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 text-slate-950 flex flex-col items-center justify-center font-black shadow-xl shadow-amber-500/50 border-2 border-white animate-pulse">
                <Trophy className="w-6 h-6 fill-current text-slate-950" />
              </div>
            </div>

            <div className="text-center mt-5 space-y-2">
              <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {isAr ? 'متصدر الأكاديمية' : 'Grand Champion'}
              </div>

              <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-tr from-amber-400 to-yellow-200 p-1 flex items-center justify-center shadow-xl">
                <div className="w-full h-full rounded-full bg-[#0d122e] flex items-center justify-center text-amber-300 font-black text-2xl">
                  {top1.name.charAt(0)}
                </div>
              </div>

              <div>
                <span className="text-sm">{top1.countryFlag}</span>
                <h4 className="text-xl font-black text-white group-hover:text-amber-300 transition">
                  {isAr ? top1.nameAr : top1.name}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1">{isAr ? top1.titleAr : top1.titleEn}</p>
                <p className="text-[11px] text-cyan-300 font-medium">{top1.companyOrOrg}</p>
              </div>

              <div className="inline-block px-4 py-1.5 rounded-2xl text-sm font-mono font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
                {top1.xp.toLocaleString()} XP
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-4 border-t border-slate-700/80 text-slate-300">
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'ساعات' : 'Hours'}</div>
                  <div className="font-bold text-cyan-300">{top1.studyHours}h</div>
                </div>
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الدقة' : 'Accuracy'}</div>
                  <div className="font-bold text-emerald-400">{top1.quizAccuracy}%</div>
                </div>
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'المقررات' : 'Modules'}</div>
                  <div className="font-bold text-amber-300">{top1.completedModules}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top3 && (
          <div 
            onClick={() => setSelectedStudent(top3)}
            className="order-3 rounded-3xl bg-gradient-to-b from-[#13193e] to-[#0a0d24] border-2 border-amber-700/40 p-6 shadow-xl relative hover:border-amber-600 transition-all cursor-pointer group"
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-700 to-orange-800 text-white flex items-center justify-center font-black text-lg shadow-lg border border-amber-500">
              3
            </div>

            <div className="text-center mt-3 space-y-2">
              <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-amber-800 to-orange-600 p-1 flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-full bg-[#0d122e] flex items-center justify-center text-white font-bold text-xl">
                  {top3.name.charAt(0)}
                </div>
              </div>

              <div>
                <span className="text-xs">{top3.countryFlag}</span>
                <h4 className="text-lg font-black text-white group-hover:text-amber-400 transition">
                  {isAr ? top3.nameAr : top3.name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">{isAr ? top3.titleAr : top3.titleEn}</p>
              </div>

              <div className="inline-block px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-700/20 text-amber-300 border border-amber-700/30">
                {top3.xp.toLocaleString()} XP
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800 text-slate-300">
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'ساعات المذاكرة' : 'Study Time'}</div>
                  <div className="font-bold text-cyan-300">{top3.studyHours}h</div>
                </div>
                <div className="bg-[#0b0e27] p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الدقة' : 'Accuracy'}</div>
                  <div className="font-bold text-emerald-400">{top3.quizAccuracy}%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Filtering Toolbar */}
      <div className="bg-[#0d1230] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#070b1f] p-1 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setTimeframe('all_time')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeframe === 'all_time'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'التاريخ الكلي' : 'All-Time'}
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeframe === 'monthly'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'هذا الشهر' : 'This Month'}
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeframe === 'weekly'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'هذا الأسبوع' : 'This Week'}
            </button>
          </div>

          {/* Metric Sort Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1 font-mono">
              <Sliders className="w-3.5 h-3.5" />
              <span>{isAr ? 'الترتيب بحسب:' : 'Sort by:'}</span>
            </span>

            <button
              onClick={() => setSortMetric('xp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                sortMetric === 'xp'
                  ? 'bg-[#1b2352] text-amber-300 border border-amber-400/50 shadow'
                  : 'bg-[#090d24] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {isAr ? 'مجموع نقاط XP' : 'Total XP'}
            </button>
            <button
              onClick={() => setSortMetric('study_hours')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                sortMetric === 'study_hours'
                  ? 'bg-[#1b2352] text-cyan-300 border border-cyan-400/50 shadow'
                  : 'bg-[#090d24] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {isAr ? 'ساعات المذاكرة النشطة' : 'Active Study Hours'}
            </button>
            <button
              onClick={() => setSortMetric('quiz_accuracy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                sortMetric === 'quiz_accuracy'
                  ? 'bg-[#1b2352] text-emerald-300 border border-emerald-400/50 shadow'
                  : 'bg-[#090d24] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {isAr ? 'دقة الاختبارات' : 'Quiz Accuracy'}
            </button>
            <button
              onClick={() => setSortMetric('completed_modules')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                sortMetric === 'completed_modules'
                  ? 'bg-[#1b2352] text-purple-300 border border-purple-400/50 shadow'
                  : 'bg-[#090d24] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {isAr ? 'المقررات المكتملة' : 'Modules Completed'}
            </button>
          </div>
        </div>

        {/* Secondary Filters: Discipline & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="bg-[#070b1f] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none w-full sm:w-auto"
            >
              <option value="ALL">{isAr ? 'جميع المجالات الهندسية (All Disciplines)' : 'All Engineering Disciplines'}</option>
              <option value="conventional_ndt">{isAr ? 'الفحص التقليدي NDT (UT/RT/MT/PT/VT)' : 'Conventional NDT'}</option>
              <option value="ndt_advanced">{isAr ? 'الفحص بالموجات المتقدمة (PAUT / TOFD)' : 'Advanced NDT (PAUT/TOFD)'}</option>
              <option value="api_inspection">{isAr ? 'تفتيش المنشآت النفطية (API 510/570/653)' : 'API Plant Inspection'}</option>
              <option value="welding_inspection">{isAr ? 'تفتيش اللحام ومراقبة الجودة (CSWIP/AWS)' : 'Welding Inspection'}</option>
              <option value="pwht_metallurgy">{isAr ? 'المعالجة الحرارية وعلم المعادن (PWHT)' : 'PWHT & Metallurgy'}</option>
              <option value="coating_corrosion">{isAr ? 'الطلاءات ومكافحة التآكل (AMPP / NACE)' : 'Corrosion & Coatings'}</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث باسم الفاحص، الشركة، أو التخصص...' : 'Search inspector, company, discipline...'}
              className={`w-full bg-[#070b1f] border border-slate-700 rounded-xl py-2 text-white text-xs placeholder-slate-500 focus:border-amber-400 focus:outline-none ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-[#0c102a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="p-4 bg-[#11173d] border-b border-slate-800 grid grid-cols-12 text-xs font-mono text-slate-400 font-bold items-center">
          <div className="col-span-1 text-center">{isAr ? '#' : 'Rank'}</div>
          <div className="col-span-4 sm:col-span-4">{isAr ? 'المتدرب / المهندس الفاحص' : 'Student / Candidate'}</div>
          <div className="hidden sm:block sm:col-span-2">{isAr ? 'التخصص والمستوى' : 'Discipline'}</div>
          <div className="col-span-2 text-center">{isAr ? 'ساعات المذاكرة' : 'Study Time'}</div>
          <div className="col-span-2 text-center">{isAr ? 'دقة الاختبار' : 'Quiz Rate'}</div>
          <div className="col-span-3 sm:col-span-1 text-center">{isAr ? 'النقاط XP' : 'Total XP'}</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-800/60">
          {displayedPerformers.map((student, idx) => {
            const isSelf = student.isCurrentUser;
            const rankNumber = idx + 1;

            return (
              <div 
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`p-4 grid grid-cols-12 items-center text-xs transition cursor-pointer group ${
                  isSelf 
                    ? 'bg-cyan-950/30 hover:bg-cyan-950/50 border-s-4 border-cyan-400' 
                    : 'hover:bg-[#121842]'
                }`}
              >
                {/* Rank Badge */}
                <div className="col-span-1 text-center">
                  {rankNumber === 1 ? (
                    <Trophy className="w-5 h-5 text-amber-400 mx-auto" />
                  ) : rankNumber === 2 ? (
                    <Medal className="w-5 h-5 text-slate-300 mx-auto" />
                  ) : rankNumber === 3 ? (
                    <Medal className="w-5 h-5 text-amber-700 mx-auto" />
                  ) : (
                    <span className="font-mono font-bold text-slate-400">#{rankNumber}</span>
                  )}
                </div>

                {/* Candidate Info */}
                <div className="col-span-4 sm:col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow ${
                    isSelf 
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white border border-cyan-300' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}>
                    {student.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white group-hover:text-amber-300 transition truncate">
                        {isAr ? student.nameAr : student.name}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-400 text-slate-950">
                          {isAr ? 'أنت' : 'YOU'}
                        </span>
                      )}
                      <span className="text-[10px]">{student.countryFlag}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {student.companyOrOrg}
                    </div>
                  </div>
                </div>

                {/* Discipline (Hidden on mobile) */}
                <div className="hidden sm:block sm:col-span-2">
                  <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#070b1f] text-slate-300 border border-slate-700/60 truncate max-w-full">
                    {isAr ? student.disciplineTitleAr : student.disciplineTitleEn}
                  </span>
                </div>

                {/* Active Study Hours */}
                <div className="col-span-2 text-center">
                  <div className="font-mono font-black text-cyan-300 text-sm">
                    {timeframe === 'weekly' ? student.weeklyStudyHours : timeframe === 'monthly' ? student.monthlyStudyHours : student.studyHours}
                    <span className="text-[10px] text-slate-400 font-normal ms-0.5">{isAr ? 'س' : 'h'}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {student.completedModules} {isAr ? 'مقررات' : 'mods'}
                  </div>
                </div>

                {/* Quiz Accuracy */}
                <div className="col-span-2 text-center">
                  <div className="inline-block px-2.5 py-1 rounded-xl font-mono font-black text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                    {student.quizAccuracy}%
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {student.quizzesTaken} {isAr ? 'اختبار' : 'tests'}
                  </div>
                </div>

                {/* Total XP Points */}
                <div className="col-span-3 sm:col-span-1 text-center">
                  <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                    {student.xp.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}

          {displayedPerformers.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-slate-300 text-sm">
                {isAr ? 'لم يتم العثور على متدربين مطابقين لمعايير البحث' : 'No students found matching your search criteria.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDisciplineFilter('ALL');
                }}
                className="text-xs text-amber-400 hover:underline"
              >
                {isAr ? 'إعادة تعيين الفلاتر' : 'Reset search & filters'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Peer Activity Ticker */}
      <div className="bg-[#0b0f29] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold shrink-0">
          <Flame className="w-4 h-4 fill-current" />
          <span>{isAr ? 'نبض نشاط المتدربين المباشر:' : 'Live Peer Activity Feed:'}</span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto w-full text-slate-300 font-mono text-[11px]">
          {rankedPerformers.slice(0, 3).map((p) => (
            <div key={p.id} className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span className="text-amber-300 font-bold">{p.name}:</span>
              <span>{isAr ? p.recentActivity.actionAr : p.recentActivity.actionEn}</span>
              <span className="text-slate-500 text-[10px]">({p.recentActivity.timestamp})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Timer Modal (Pomodoro Station) */}
      {isFocusTimerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1438] border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setIsFocusTimerOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? 'محطة الدراسة المركزة الموثقة' : 'Focus Study Station'}</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                {isAr ? 'مؤقت التركيز واحتساب ساعات المذاكرة' : 'Active Focus Study Timer'}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr 
                  ? 'يتم احتساب الدقائق المنجزة تلقائياً وإضافتها لساعات المذاكرة ونقاط XP في لوحة المتصدرين.' 
                  : 'Elapsed focus minutes are logged automatically to your verified study hours and leaderboard XP.'}
              </p>
            </div>

            {/* Timer Dial Display */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48 rounded-full border-4 border-slate-700 flex items-center justify-center bg-[#080c24] shadow-inner">
                <div className="text-center">
                  <div className="text-5xl font-mono font-black text-white tracking-wider">
                    {String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:
                    {String(secondsRemaining % 60).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-amber-400 font-mono mt-1 font-bold">
                    {isTimerRunning ? (isAr ? 'جلسة جارية...' : 'Session in progress...') : (isAr ? 'جاهز للبدء' : 'Ready')}
                  </div>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-2 mt-4">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    disabled={isTimerRunning}
                    onClick={() => handleResetTimer(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      timerDurationMinutes === mins && !isTimerRunning
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-[#141b44] text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {mins} {isAr ? 'د' : 'min'}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                {isAr ? 'موضوع الجلسة / المعيار قيد المذاكرة:' : 'Study Topic / Standard under review:'}
              </label>
              <input
                type="text"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                placeholder={isAr ? 'مثال: ASME Sec V Art 4 أو PAUT Calibration' : 'e.g. ASME Sec V Art 4 or API 570'}
                className="w-full bg-[#080c24] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Timer Actions */}
            <div className="flex items-center gap-3">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartTimer}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isAr ? 'بدء الجلسة' : 'Start Focus'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseTimer}
                  className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                </button>
              )}

              <button
                onClick={() => handleResetTimer()}
                className="px-4 py-3 rounded-2xl bg-[#141b44] hover:bg-[#1a2357] text-slate-300 border border-slate-700 cursor-pointer"
                title={isAr ? 'إعادة ضبط' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Study Hours Logger Modal */}
      {isManualLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form 
            onSubmit={handleManualLogSubmit}
            className="bg-[#0e1438] border-2 border-cyan-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsManualLogOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'سجل الساعات الذاتية' : 'Self-Study Logger'}</span>
              </div>
              <h3 className="text-xl font-black text-white">
                {isAr ? 'تسجيل ساعات مذاكرة خارجية / ميدانية' : 'Log Offline / Code Study Hours'}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr 
                  ? 'سجل ساعات قراءة الأكواد الهندسية (ASME, API, AWS) أو التدريب العملي لرفع ترتيبك.' 
                  : 'Log hours spent reading standards (ASME, API, AWS) or practicing in field/lab to boost your rank.'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isAr ? 'عدد الساعات قيد التسجيل:' : 'Number of Hours:'}
                </label>
                <input
                  type="number"
                  min="0.25"
                  max="12"
                  step="0.25"
                  value={manualHours}
                  onChange={(e) => setManualHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#080c24] border border-slate-700 rounded-xl px-4 py-2 text-white font-mono font-bold focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isAr ? 'نوع النشاط:' : 'Activity Type:'}
                </label>
                <select
                  value={manualSessionType}
                  onChange={(e) => setManualSessionType(e.target.value as any)}
                  className="w-full bg-[#080c24] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="reading">{isAr ? 'قراءة معايير ومواصفات (ASME / API / ISO)' : 'Reading Standards & Codes'}</option>
                  <option value="virtual_lab">{isAr ? 'تجارب المعمل والمحاكاة الافتراضية' : 'Virtual Lab & Simulation Practice'}</option>
                  <option value="quiz_prep">{isAr ? 'حل بنوك أسئلة ومراجعة اختبارات' : 'Quiz Question Bank Review'}</option>
                  <option value="focus_timer">{isAr ? 'دراسة تقنية مركزة' : 'Deep Technical Focus'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isAr ? 'تفاصيل المنهج / الكود:' : 'Topic / Standard Details:'}
                </label>
                <input
                  type="text"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  placeholder={isAr ? 'مثال: API 570 Piping Inspection Handbook' : 'e.g. ASME Sec V Art 4'}
                  className="w-full bg-[#080c24] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 cursor-pointer"
            >
              {isAr ? 'اعتماد وإضافة الساعات' : 'Confirm & Log Study Hours'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1438] border-2 border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {isAr ? 'تحديث بيانات المتدرب / الفاحص' : 'Edit Candidate Profile'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isAr ? 'الاسم الظاهر في لوحة المتصدرين:' : 'Display Name:'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#080c24] border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                  placeholder="e.g. Eng. Khalid Al-Mutairi"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isAr ? 'جهة العمل / الشركة أو التخصص:' : 'Company / Organization / Sector:'}
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full bg-[#080c24] border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                  placeholder="e.g. Industrial Inspection Division"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer"
            >
              {isAr ? 'حفظ البيانات' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Student Profile Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1438] border-2 border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg border border-white">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{isAr ? selectedStudent.nameAr : selectedStudent.name}</h3>
                  <span className="text-sm">{selectedStudent.countryFlag}</span>
                </div>
                <p className="text-xs text-amber-300 font-medium">{isAr ? selectedStudent.titleAr : selectedStudent.titleEn}</p>
                <p className="text-[11px] text-slate-400">{selectedStudent.companyOrOrg}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#080c24] p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{isAr ? 'ساعات المذاكرة' : 'Study Time'}</div>
                <div className="text-lg font-black text-cyan-300 mt-1">{selectedStudent.studyHours}h</div>
              </div>
              <div className="bg-[#080c24] p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{isAr ? 'دقة الاختبارات' : 'Accuracy'}</div>
                <div className="text-lg font-black text-emerald-400 mt-1">{selectedStudent.quizAccuracy}%</div>
              </div>
              <div className="bg-[#080c24] p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{isAr ? 'مقررات مكتملة' : 'Modules Done'}</div>
                <div className="text-lg font-black text-amber-300 mt-1">{selectedStudent.completedModules}</div>
              </div>
              <div className="bg-[#080c24] p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{isAr ? 'الترتيب العام' : 'Rank Tier'}</div>
                <div className="text-lg font-black text-purple-300 mt-1">{selectedStudent.tier}</div>
              </div>
            </div>

            {/* Earned Badges Showcase */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'الأوسمة والاعتمادات المحققة في الأكاديمية:' : 'Earned Badges & Honors:'}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.badges.map((b) => (
                  <span 
                    key={b.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#141b47] text-amber-200 border border-amber-500/30"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? b.titleAr : b.titleEn}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#080c24] p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">{isAr ? 'آخر إنجاز مسجل:' : 'Latest Verified Milestone:'}</div>
              <p className="text-xs text-white">
                {isAr ? selectedStudent.recentActivity.actionAr : selectedStudent.recentActivity.actionEn}
              </p>
            </div>

            {onLaunchQuiz && (
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  onLaunchQuiz(selectedStudent.disciplineId);
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{isAr ? `تحدي مجال ${selectedStudent.disciplineTitleAr}` : `Launch Quiz in ${selectedStudent.disciplineTitleEn}`}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
