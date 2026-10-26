import { getCompletedModules, getCompletedTopics, getQuizResults } from './curriculumProgress';
import { db, auth } from '../firebase/config';
import { collection, addDoc, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export type LeaderboardTimeframe = 'all_time' | 'monthly' | 'weekly';
export type LeaderboardSortMetric = 'xp' | 'study_hours' | 'quiz_accuracy' | 'completed_modules';
export type StudentTier = 'Master' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

export interface StudentPerformer {
  id: string;
  name: string;
  nameAr: string;
  avatarUrl?: string;
  companyOrOrg: string;
  country: string;
  countryFlag: string;
  titleEn: string;
  titleAr: string;
  disciplineId: string;
  disciplineTitleEn: string;
  disciplineTitleAr: string;
  studyHours: number;
  weeklyStudyHours: number;
  monthlyStudyHours: number;
  completedModules: number;
  completedTopics: number;
  quizzesTaken: number;
  quizAccuracy: number; // percentage 0-100
  quizAverageScore: number;
  streakDays: number;
  tier: StudentTier;
  badges: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    icon: string;
    color: string;
  }>;
  recentActivity: {
    actionAr: string;
    actionEn: string;
    timestamp: string;
  };
  xp: number;
  isCurrentUser?: boolean;
}

export interface StudySessionLog {
  id: string;
  date: string;
  durationMinutes: number;
  topicOrDiscipline: string;
  sessionType: 'focus_timer' | 'reading' | 'quiz_prep' | 'virtual_lab';
}

const LOCAL_STUDENT_PROFILE_KEY = 'insco_student_profile_v1';
const LOCAL_STUDY_SESSIONS_KEY = 'insco_academy_study_sessions_v1';
const LOCAL_LEADERBOARD_STORAGE_KEY = 'insco_knowledge_leaderboard_v2';

// Realistic cohort of active NDT & Inspection students/engineers across the region
const INITIAL_COHORT: StudentPerformer[] = [
  {
    id: 'perf_1',
    name: 'Eng. Tareq Al-Ghamdi',
    nameAr: 'م. طارق الغامدي',
    companyOrOrg: 'Saudi Aramco Qualified Contractor',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    titleEn: 'Senior NDT Level III & Advanced UT Lead',
    titleAr: 'أخصائي فحص مستوى ثالث وقائد PAUT/TOFD',
    disciplineId: 'ndt_advanced',
    disciplineTitleEn: 'Advanced NDT (PAUT / TOFD / TFM)',
    disciplineTitleAr: 'الفحص بالموجات فوق الصوتية المتقدمة',
    studyHours: 78.5,
    weeklyStudyHours: 8.5,
    monthlyStudyHours: 32.0,
    completedModules: 24,
    completedTopics: 86,
    quizzesTaken: 38,
    quizAccuracy: 96.5,
    quizAverageScore: 97,
    streakDays: 19,
    tier: 'Master',
    badges: [
      { id: 'b1', titleAr: 'خبير PAUT معتمد', titleEn: 'PAUT Master', icon: 'zap', color: 'amber' },
      { id: 'b2', titleAr: 'ماراثون 50 ساعة', titleEn: '50h Marathon', icon: 'flame', color: 'orange' },
      { id: 'b3', titleAr: 'درجة كاملة في الكود', titleEn: 'Perfect Code Score', icon: 'award', color: 'emerald' },
      { id: 'b4', titleAr: 'سلسلة 14 يوماً', titleEn: '14-Day Streak', icon: 'sparkles', color: 'purple' }
    ],
    recentActivity: {
      actionAr: 'أكمل معايرة كتلة IIW V1 وحصل على 98% في اختبار ASME Sec V',
      actionEn: 'Completed IIW V1 block calibration & scored 98% in ASME Sec V exam',
      timestamp: '15m ago'
    },
    xp: 4850
  },
  {
    id: 'perf_2',
    name: 'Eng. Sarah Mansour',
    nameAr: 'م. سارة منصور',
    companyOrOrg: 'ADNOC Refining & Petrochemicals',
    country: 'United Arab Emirates',
    countryFlag: '🇦🇪',
    titleEn: 'API 510/570 Authorized Inspector',
    titleAr: 'مفتش أوعية ضغط وأنابيب معتمد API 510/570',
    disciplineId: 'api_inspection',
    disciplineTitleEn: 'API Plant & Pressure Vessel Inspection',
    disciplineTitleAr: 'تفتيش المنشآت النفطية وأوعية الضغط',
    studyHours: 64.0,
    weeklyStudyHours: 9.0,
    monthlyStudyHours: 29.5,
    completedModules: 21,
    completedTopics: 74,
    quizzesTaken: 32,
    quizAccuracy: 94.2,
    quizAverageScore: 95,
    streakDays: 14,
    tier: 'Master',
    badges: [
      { id: 'b5', titleAr: 'مفتش API نخبوي', titleEn: 'Elite API Inspector', icon: 'shield-check', color: 'cyan' },
      { id: 'b6', titleAr: 'محلل تلفيات المعادن', titleEn: 'Damage Analyst', icon: 'activity', color: 'rose' },
      { id: 'b7', titleAr: 'دقة اختبار 95%+', titleEn: '95%+ Accuracy', icon: 'award', color: 'amber' }
    ],
    recentActivity: {
      actionAr: 'أنجزت مراجعة آليات التآكل والتصدع الهيدروجيني API 571',
      actionEn: 'Mastered API 571 Damage Mechanisms module',
      timestamp: '1h ago'
    },
    xp: 4320
  },
  {
    id: 'perf_3',
    name: 'Eng. Ahmed El-Sayed',
    nameAr: 'م. أحمد السيد',
    companyOrOrg: 'Petrojet / Eni Offshore Projects',
    country: 'Egypt',
    countryFlag: '🇪🇬',
    titleEn: 'PWHT Specialist & Metallurgical QA',
    titleAr: 'مهندس معالجة حرارية وجودة ميتالورجيا',
    disciplineId: 'pwht_metallurgy',
    disciplineTitleEn: 'PWHT & Heat Treatment Engineering',
    disciplineTitleAr: 'المعالجة الحرارية وهندسة اللحام',
    studyHours: 52.5,
    weeklyStudyHours: 6.5,
    monthlyStudyHours: 24.0,
    completedModules: 19,
    completedTopics: 62,
    quizzesTaken: 28,
    quizAccuracy: 92.0,
    quizAverageScore: 93,
    streakDays: 11,
    tier: 'Diamond',
    badges: [
      { id: 'b8', titleAr: 'خبير منحنيات P91', titleEn: 'P91 Curve Pro', icon: 'flame', color: 'orange' },
      { id: 'b9', titleAr: 'متحري الصلابة Brinell', titleEn: 'Hardness Specialist', icon: 'layers', color: 'indigo' }
    ],
    recentActivity: {
      actionAr: 'حقق 100% في محاكي منحنيات التسخين والتبريد P-No. 15E',
      actionEn: 'Scored 100% on P-No. 15E soak & heating thermal cycle',
      timestamp: '3h ago'
    },
    xp: 3790
  },
  {
    id: 'perf_4',
    name: 'Insp. Khalid Al-Otaibi',
    nameAr: 'الفاحص خالد العتيبي',
    companyOrOrg: 'SABIC Petrochemicals Plant',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    titleEn: 'CSWIP 3.1 Certified Welding Inspector',
    titleAr: 'مفتش لحام معتمد CSWIP 3.1 & AWS CWI',
    disciplineId: 'welding_inspection',
    disciplineTitleEn: 'Welding Inspection & Quality Control',
    disciplineTitleAr: 'تفتيش اللحام ومراقبة الجودة',
    studyHours: 46.0,
    weeklyStudyHours: 5.0,
    monthlyStudyHours: 19.5,
    completedModules: 17,
    completedTopics: 58,
    quizzesTaken: 25,
    quizAccuracy: 91.5,
    quizAverageScore: 92,
    streakDays: 8,
    tier: 'Diamond',
    badges: [
      { id: 'b10', titleAr: 'كاشف عيوب اللحام', titleEn: 'Flaw Hunter', icon: 'search', color: 'sky' },
      { id: 'b11', titleAr: 'محقق معايير ASME IX', titleEn: 'ASME IX Verifier', icon: 'file-text', color: 'emerald' }
    ],
    recentActivity: {
      actionAr: 'أكمل تمرين تقييم عيوب عدم الانصهار والشقوق الجذرية',
      actionEn: 'Completed lack of fusion & root crack defect assessment',
      timestamp: '5h ago'
    },
    xp: 3410
  },
  {
    id: 'perf_5',
    name: 'Eng. Fatima Al-Zahra',
    nameAr: 'م. فاطمة الزهراء',
    companyOrOrg: 'Sonatrach Gas Processing Infrastructure',
    country: 'Algeria',
    countryFlag: '🇩🇿',
    titleEn: 'Corrosion & AMPP Coating Specialist',
    titleAr: 'أخصائية التآكل والطلاءات الصناعية AMPP CIP',
    disciplineId: 'coating_corrosion',
    disciplineTitleEn: 'Corrosion Monitoring & Protective Coatings',
    disciplineTitleAr: 'مكافحة التآكل والطلاءات الوقائية',
    studyHours: 41.0,
    weeklyStudyHours: 7.0,
    monthlyStudyHours: 21.0,
    completedModules: 16,
    completedTopics: 52,
    quizzesTaken: 22,
    quizAccuracy: 93.0,
    quizAverageScore: 94,
    streakDays: 12,
    tier: 'Platinum',
    badges: [
      { id: 'b12', titleAr: 'مفتش طلاء CIP Level 2', titleEn: 'CIP Level 2', icon: 'shield', color: 'amber' },
      { id: 'b13', titleAr: 'باحث متفوق', titleEn: 'Top Scholar', icon: 'award', color: 'blue' }
    ],
    recentActivity: {
      actionAr: 'أجرت جلسة دراسة مركزة 45 دقيقة حول معيار NACE SP0188',
      actionEn: 'Logged 45 min focus session on NACE SP0188 holiday testing',
      timestamp: '8h ago'
    },
    xp: 3260
  },
  {
    id: 'perf_6',
    name: 'Insp. Omar Al-Kuwaiti',
    nameAr: 'الفاحص عمر الكويتي',
    companyOrOrg: 'Kuwait Oil Company (KOC)',
    country: 'Kuwait',
    countryFlag: '🇰🇼',
    titleEn: 'Conventional NDT Level II (RT/UT/MT/PT)',
    titleAr: 'فاحص NDT مستوى ثانٍ (أشعة وموجات وجسيمات)',
    disciplineId: 'conventional_ndt',
    disciplineTitleEn: 'Conventional NDT Methods',
    disciplineTitleAr: 'طرق الفحص غير الإتلافي التقليدية',
    studyHours: 35.5,
    weeklyStudyHours: 4.5,
    monthlyStudyHours: 16.0,
    completedModules: 14,
    completedTopics: 45,
    quizzesTaken: 20,
    quizAccuracy: 88.5,
    quizAverageScore: 89,
    streakDays: 6,
    tier: 'Platinum',
    badges: [
      { id: 'b14', titleAr: 'فاحص أشعة سينية RT', titleEn: 'Radiography Pro', icon: 'zap', color: 'yellow' }
    ],
    recentActivity: {
      actionAr: 'سجل 92% في اختبار حسابات الكثافة الإشعاعية IQI',
      actionEn: 'Scored 92% on radiographic density & IQI selection test',
      timestamp: '1d ago'
    },
    xp: 2790
  },
  {
    id: 'perf_7',
    name: 'Eng. Zaid Al-Bahrani',
    nameAr: 'م. زيد البحراني',
    companyOrOrg: 'BAPCO Energies Modernization',
    country: 'Bahrain',
    countryFlag: '🇧🇭',
    titleEn: 'Pipeline Integrity & Storage Tank Inspector',
    titleAr: 'مهندس سلامة خطوط الأنابيب وخزانات API 653',
    disciplineId: 'api_inspection',
    disciplineTitleEn: 'API Plant & Pressure Vessel Inspection',
    disciplineTitleAr: 'تفتيش المنشآت النفطية وأوعية الضغط',
    studyHours: 29.0,
    weeklyStudyHours: 3.5,
    monthlyStudyHours: 14.0,
    completedModules: 11,
    completedTopics: 38,
    quizzesTaken: 16,
    quizAccuracy: 87.0,
    quizAverageScore: 88,
    streakDays: 5,
    tier: 'Gold',
    badges: [
      { id: 'b15', titleAr: 'مدقق خزانات API 653', titleEn: 'API 653 Auditor', icon: 'shield-check', color: 'emerald' }
    ],
    recentActivity: {
      actionAr: 'أكمل دراسة حساب الحد الأدنى لسماكة قاع الخزانات',
      actionEn: 'Completed bottom plate minimum thickness calculation module',
      timestamp: '1d ago'
    },
    xp: 2280
  },
  {
    id: 'perf_8',
    name: 'Insp. Sultan Al-Harthy',
    nameAr: 'الفاحص سلطان الحارثي',
    companyOrOrg: 'Petroleum Development Oman (PDO)',
    country: 'Oman',
    countryFlag: '🇴🇲',
    titleEn: 'NDT Trainee & Welding Inspector',
    titleAr: 'متدرب فحص غير إتلافي وتفتيش وصلات اللحام',
    disciplineId: 'conventional_ndt',
    disciplineTitleEn: 'Conventional NDT Methods',
    disciplineTitleAr: 'طرق الفحص غير الإتلافي التقليدية',
    studyHours: 22.5,
    weeklyStudyHours: 5.5,
    monthlyStudyHours: 12.0,
    completedModules: 9,
    completedTopics: 31,
    quizzesTaken: 14,
    quizAccuracy: 86.0,
    quizAverageScore: 87,
    streakDays: 4,
    tier: 'Gold',
    badges: [
      { id: 'b16', titleAr: 'بداية نشطة', titleEn: 'Fast Starter', icon: 'sparkles', color: 'amber' }
    ],
    recentActivity: {
      actionAr: 'حضر محاكاة الفحص بالجسيمات المغناطيسية MT في المختبر ثلاثي الأبعاد',
      actionEn: 'Tested magnetic yoke calibration in 3D Virtual Lab',
      timestamp: '2d ago'
    },
    xp: 1840
  }
];

// Helper to determine tier from XP
export function calculateTier(xp: number): StudentTier {
  if (xp >= 4000) return 'Master';
  if (xp >= 3200) return 'Diamond';
  if (xp >= 2500) return 'Platinum';
  if (xp >= 1800) return 'Gold';
  if (xp >= 1000) return 'Silver';
  return 'Bronze';
}

const LESSON_QUIZ_RECORDS_STORAGE_KEY = 'insco_lesson_quiz_records_v1';
const LESSON_QUIZ_XP_TOTAL_STORAGE_KEY = 'insco_lesson_quiz_xp_total_v1';

// Helper to calculate XP
export function calculateXp(stats: {
  studyHours: number;
  completedModules: number;
  completedTopics: number;
  quizzesTaken: number;
  quizAccuracy: number;
  bonusQuizXp?: number;
}): number {
  const hoursXp = Math.round(stats.studyHours * 25);
  const modulesXp = stats.completedModules * 50;
  const topicsXp = stats.completedTopics * 10;
  const quizXp = stats.quizzesTaken * 25;
  const accuracyBonus = Math.round((stats.quizAccuracy / 100) * 300);
  const bonusQuizXp = Math.max(0, Math.round(stats.bonusQuizXp ?? 0));
  return hoursXp + modulesXp + topicsXp + quizXp + accuracyBonus + bonusQuizXp;
}

// Get or initialize current student profile
export function getCurrentStudentProfile(): StudentPerformer {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENT_PROFILE_KEY);
    const completedModulesMap = getCompletedModules();
    const completedModules = Object.keys(completedModulesMap).filter(k => completedModulesMap[k]);
    const completedTopicsMap = getCompletedTopics();
    let totalTopics = 0;
    Object.values(completedTopicsMap).forEach(arr => { totalTopics += arr.length; });

    const quizResults = getQuizResults();
    const combinedScores: Record<string, number> = {};
    Object.entries(quizResults).forEach(([k, q]) => {
      combinedScores[`module:${k}`] = typeof q.score === 'number' ? q.score : 0;
    });

    let storedBonusQuizXp = 0;
    try {
      const rawBonusXp = localStorage.getItem(LESSON_QUIZ_XP_TOTAL_STORAGE_KEY);
      if (rawBonusXp) {
        const parsedXp = Number(rawBonusXp);
        if (Number.isFinite(parsedXp) && parsedXp > 0) {
          storedBonusQuizXp = Math.round(parsedXp);
        }
      }
      const rawLessonRecords = localStorage.getItem(LESSON_QUIZ_RECORDS_STORAGE_KEY);
      if (rawLessonRecords) {
        const parsedRecords = JSON.parse(rawLessonRecords) as Record<
          string,
          { bestScorePct?: number; moduleId?: string; sourceKind?: string }
        >;
        Object.entries(parsedRecords).forEach(([packId, rec]) => {
          const scoreVal = typeof rec?.bestScorePct === 'number' ? rec.bestScorePct : 0;
          if (rec?.sourceKind === 'curriculum_module' && rec.moduleId) {
            combinedScores[`module:${rec.moduleId}`] = Math.max(
              combinedScores[`module:${rec.moduleId}`] ?? 0,
              scoreVal
            );
          } else {
            combinedScores[packId] = scoreVal;
          }
        });
      }
    } catch {
      // Ignore malformed quiz storage in restricted sandboxes
    }

    const scoreValues = Object.values(combinedScores);
    const quizzesTaken = scoreValues.length;
    const avgScore = quizzesTaken > 0
      ? Math.round(scoreValues.reduce((acc, s) => acc + s, 0) / quizzesTaken)
      : 0;

    const studySessions = getStudySessions();
    const totalMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const studyHours = Number((totalMinutes / 60).toFixed(1));

    // Calculate weekly study hours
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyMinutes = studySessions
      .filter(s => new Date(s.date).getTime() > oneWeekAgo)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    const weeklyStudyHours = Number((weeklyMinutes / 60).toFixed(1));

    // Calculate monthly study hours
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthlyMinutes = studySessions
      .filter(s => new Date(s.date).getTime() > oneMonthAgo)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    const monthlyStudyHours = Number((monthlyMinutes / 60).toFixed(1));

    let base: Partial<StudentPerformer> = {};
    if (raw) {
      base = JSON.parse(raw);
    }

    const effectiveQuizzesTaken = Math.max(quizzesTaken, (base.quizzesTaken || 0));
    const effectiveQuizAccuracy = avgScore > 0 ? avgScore : (base.quizAccuracy || 88);

    const calculatedXp = calculateXp({
      studyHours: Math.max(studyHours, (base.studyHours || 0)),
      completedModules: Math.max(completedModules.length, (base.completedModules || 0)),
      completedTopics: Math.max(totalTopics, (base.completedTopics || 0)),
      quizzesTaken: effectiveQuizzesTaken,
      quizAccuracy: effectiveQuizAccuracy,
      bonusQuizXp: storedBonusQuizXp,
    });

    const userProfile: StudentPerformer = {
      id: 'current_student_user',
      name: base.name || 'INSCO Inspection Candidate (You)',
      nameAr: base.nameAr || 'المتدرب / المهندس الفاحص (أنت)',
      companyOrOrg: base.companyOrOrg || 'Industrial Inspection & Non-Destructive Testing',
      country: base.country || 'Saudi Arabia',
      countryFlag: base.countryFlag || '🇸🇦',
      titleEn: base.titleEn || 'NDT Quality Candidate & Student',
      titleAr: base.titleAr || 'مرشح فحص الجودة وتأهيل NDT',
      disciplineId: base.disciplineId || 'conventional_ndt',
      disciplineTitleEn: base.disciplineTitleEn || 'Conventional & Advanced NDT',
      disciplineTitleAr: base.disciplineTitleAr || 'الفحوصات الهندسية التقليدية والمتقدمة',
      studyHours: Math.max(studyHours, (base.studyHours || 0)),
      weeklyStudyHours: Math.max(weeklyStudyHours, (base.weeklyStudyHours || 0)),
      monthlyStudyHours: Math.max(monthlyStudyHours, (base.monthlyStudyHours || 0)),
      completedModules: Math.max(completedModules.length, (base.completedModules || 0)),
      completedTopics: Math.max(totalTopics, (base.completedTopics || 0)),
      quizzesTaken: effectiveQuizzesTaken,
      quizAccuracy: effectiveQuizAccuracy,
      quizAverageScore: avgScore > 0 ? avgScore : (base.quizAverageScore || 88),
      streakDays: Math.max(1, base.streakDays || 1),
      tier: calculateTier(calculatedXp),
      badges: base.badges && base.badges.length > 0 ? base.badges : [
        { id: 'usr_b1', titleAr: 'طالب الأكاديمية النشط', titleEn: 'Active Academy Student', icon: 'book-open', color: 'emerald' },
        { id: 'usr_b2', titleAr: 'مستكشف المعايير الدولية', titleEn: 'Standards Explorer', icon: 'shield', color: 'cyan' }
      ],
      recentActivity: base.recentActivity || {
        actionAr: 'نشط الآن في منصة الأكاديمية ويدرس المناهج التفاعلية',
        actionEn: 'Active in Academy curriculum & studying interactive modules',
        timestamp: 'Just now'
      },
      xp: calculatedXp,
      isCurrentUser: true
    };

    return userProfile;
  } catch (err) {
    console.warn('Error reading student profile:', err);
    return {
      id: 'current_student_user',
      name: 'Inspection Candidate (You)',
      nameAr: 'المهندس الفاحص (أنت)',
      companyOrOrg: 'Industrial Inspection Division',
      country: 'Saudi Arabia',
      countryFlag: '🇸🇦',
      titleEn: 'NDT Trainee',
      titleAr: 'متدرب فحص هندسي',
      disciplineId: 'conventional_ndt',
      disciplineTitleEn: 'Conventional NDT',
      disciplineTitleAr: 'الفحص التقليدي',
      studyHours: 8.5,
      weeklyStudyHours: 3.5,
      monthlyStudyHours: 8.5,
      completedModules: 4,
      completedTopics: 14,
      quizzesTaken: 5,
      quizAccuracy: 90,
      quizAverageScore: 90,
      streakDays: 3,
      tier: 'Gold',
      badges: [{ id: 'b_init', titleAr: 'انطلاقة واعدة', titleEn: 'Promising Start', icon: 'sparkles', color: 'amber' }],
      recentActivity: { actionAr: 'تفاعل مع المواد التعليمية', actionEn: 'Interacted with study materials', timestamp: 'Just now' },
      xp: 1540,
      isCurrentUser: true
    };
  }
}

function safeDispatchEvent(name: string, detail?: any) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const eventCtor = (window as any).CustomEvent || globalThis.CustomEvent;
      if (eventCtor) {
        window.dispatchEvent(new eventCtor(name, { detail }));
      }
    }
  } catch {
    // Graceful fallback for headless/JSDOM environments
  }
}

export function updateStudentProfile(updates: Partial<StudentPerformer>): StudentPerformer {
  const current = getCurrentStudentProfile();
  const merged = { ...current, ...updates, isCurrentUser: true };
  try {
    localStorage.setItem(LOCAL_STUDENT_PROFILE_KEY, JSON.stringify(merged));
    safeDispatchEvent('insco_leaderboard_updated');
  } catch (err) {
    console.error('Failed to update student profile:', err);
  }
  return merged;
}

// Study sessions logging
export function getStudySessions(): StudySessionLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STUDY_SESSIONS_KEY);
    if (!raw) {
      // Seed with initial realistic study sessions for the user so it's not totally empty
      const initial: StudySessionLog[] = [
        { id: 'sess_1', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), durationMinutes: 45, topicOrDiscipline: 'Ultrasonic Pulse Echo & IIW Block', sessionType: 'virtual_lab' },
        { id: 'sess_2', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), durationMinutes: 60, topicOrDiscipline: 'ASME Section V Article 4 Calibration', sessionType: 'reading' },
        { id: 'sess_3', date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), durationMinutes: 30, topicOrDiscipline: 'API 510 In-Service Vessel Exam', sessionType: 'quiz_prep' },
        { id: 'sess_4', date: new Date().toISOString(), durationMinutes: 25, topicOrDiscipline: 'PWHT Thermal Soak Parameters', sessionType: 'focus_timer' }
      ];
      localStorage.setItem(LOCAL_STUDY_SESSIONS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logStudySession(session: Omit<StudySessionLog, 'id'>): { totalMinutes: number; totalHours: number } {
  try {
    const sessions = getStudySessions();
    const newSession: StudySessionLog = {
      ...session,
      id: 'sess_' + Date.now().toString(36)
    };
    sessions.unshift(newSession);
    localStorage.setItem(LOCAL_STUDY_SESSIONS_KEY, JSON.stringify(sessions));

    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));

    // Update profile
    const current = getCurrentStudentProfile();
    updateStudentProfile({
      studyHours: totalHours,
      weeklyStudyHours: Number((current.weeklyStudyHours + session.durationMinutes / 60).toFixed(1)),
      monthlyStudyHours: Number((current.monthlyStudyHours + session.durationMinutes / 60).toFixed(1)),
      streakDays: current.streakDays + 1
    });

    safeDispatchEvent('insco_study_session_updated', newSession);
    safeDispatchEvent('insco_leaderboard_updated');

    return { totalMinutes, totalHours };
  } catch (err) {
    console.error('Error logging study session:', err);
    return { totalMinutes: 0, totalHours: 0 };
  }
}

// Get all performers combined (Cohort + Current User) sorted by selected metric and timeframe
export function getKnowledgeLeaderboard(options?: {
  timeframe?: LeaderboardTimeframe;
  disciplineId?: string;
  sortMetric?: LeaderboardSortMetric;
}): {
  rankedPerformers: StudentPerformer[];
  currentUserRank: number;
  currentUser: StudentPerformer;
  totalStudentsCount: number;
} {
  const timeframe = options?.timeframe || 'all_time';
  const disciplineId = options?.disciplineId || 'ALL';
  const sortMetric = options?.sortMetric || 'xp';

  const currentUser = getCurrentStudentProfile();

  // Load cohort from local storage if custom additions exist
  let cohort = INITIAL_COHORT;
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_STORAGE_KEY);
    if (raw) {
      cohort = JSON.parse(raw);
    }
  } catch {
    cohort = INITIAL_COHORT;
  }

  // Combine cohort and current user (ensure no duplicates)
  const allList: StudentPerformer[] = [
    currentUser,
    ...cohort.filter(c => c.id !== currentUser.id)
  ];

  // Filter by discipline if specified
  let filtered = allList;
  if (disciplineId && disciplineId !== 'ALL') {
    filtered = allList.filter(p => p.disciplineId === disciplineId || p.isCurrentUser);
  }

  // Sort based on metric and timeframe
  const sorted = [...filtered].sort((a, b) => {
    if (sortMetric === 'study_hours') {
      const hoursA = timeframe === 'weekly' ? a.weeklyStudyHours : timeframe === 'monthly' ? a.monthlyStudyHours : a.studyHours;
      const hoursB = timeframe === 'weekly' ? b.weeklyStudyHours : timeframe === 'monthly' ? b.monthlyStudyHours : b.studyHours;
      return hoursB - hoursA;
    }
    if (sortMetric === 'quiz_accuracy') {
      return b.quizAccuracy - a.quizAccuracy;
    }
    if (sortMetric === 'completed_modules') {
      return b.completedModules - a.completedModules;
    }
    // Default XP
    if (timeframe === 'weekly') {
      return (b.weeklyStudyHours * 40 + b.quizAccuracy) - (a.weeklyStudyHours * 40 + a.quizAccuracy);
    }
    if (timeframe === 'monthly') {
      return (b.monthlyStudyHours * 35 + b.quizAccuracy * 2) - (a.monthlyStudyHours * 35 + a.quizAccuracy * 2);
    }
    return b.xp - a.xp;
  });

  const currentUserRank = sorted.findIndex(p => p.isCurrentUser) + 1;

  return {
    rankedPerformers: sorted,
    currentUserRank: currentUserRank > 0 ? currentUserRank : sorted.length,
    currentUser,
    totalStudentsCount: sorted.length
  };
}
