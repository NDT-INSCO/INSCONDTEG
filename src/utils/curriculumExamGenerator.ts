import { Language } from '../types';
import { ENGINEERING_DISCIPLINES } from '../data/academyCurriculum';

export type ExamCertificationLevel = 'level1' | 'level2' | 'both';
export type ExamMethod = 'all' | 'UT' | 'RT' | 'MT' | 'PT' | 'VT';
export type ExamMode = 'timed' | 'study';
export type ExamDifficultyLevel = 'training' | 'standard' | 'strict_proctored' | 'speed_challenge';

export interface ExamDifficultyConfig {
  id: ExamDifficultyLevel;
  nameAr: string;
  nameEn: string;
  secondsPerQuestion: number;
  descriptionAr: string;
  descriptionEn: string;
  allowPause: boolean;
}

export const EXAM_DIFFICULTY_TIERS: Record<ExamDifficultyLevel, ExamDifficultyConfig> = {
  training: {
    id: 'training',
    nameAr: 'تدريبي مريح (Training / Relaxed)',
    nameEn: 'Training / Relaxed Pace (120s/Q)',
    secondsPerQuestion: 120,
    descriptionAr: '120 ثانية لكل سؤال - وتيرة هادئة تتيح تحليل المعادلات والفقرات الكودية ومراجعة النظريات.',
    descriptionEn: '120 seconds/question - generous buffer to analyze formulas, clauses, and underlying physics.',
    allowPause: true
  },
  standard: {
    id: 'standard',
    nameAr: 'معياري كودي (Standard ASNT / ISO)',
    nameEn: 'Standard ASNT / ISO Benchmark (90s/Q)',
    secondsPerQuestion: 90,
    descriptionAr: '90 ثانية لكل سؤال - المعيار الرسمي المعتمد في اختبارات ASNT SNT-TC-1A و ISO 9712.',
    descriptionEn: '90 seconds/question - standard accredited benchmark used in ASNT and ISO 9712 exams.',
    allowPause: true
  },
  strict_proctored: {
    id: 'strict_proctored',
    nameAr: 'رسمي مشدد مع مراقب (Strict Proctored Prometric)',
    nameEn: 'Strict Proctored / Prometric (60s/Q)',
    secondsPerQuestion: 60,
    descriptionAr: '60 ثانية لكل سؤال - بيئة اختبار حقيقية محوسبة تحاكي مراكز الاختبارات الدولية دون إمكانية إيقاف مؤقت.',
    descriptionEn: '60 seconds/question - authentic computer-based testing pace under strict proctored rules without pause.',
    allowPause: false
  },
  speed_challenge: {
    id: 'speed_challenge',
    nameAr: 'تحدي السرعة الميدانية (Field Shutdown Crunch)',
    nameEn: 'Rapid Field Shutdown Challenge (45s/Q)',
    secondsPerQuestion: 45,
    descriptionAr: '45 ثانية لكل سؤال - محاكاة لضغوط العمل الميداني في إيقافات المصافي وتقييم العيوب الفوري.',
    descriptionEn: '45 seconds/question - high-pressure turnaround simulation demanding rapid decision-making.',
    allowPause: false
  }
};

export interface ExamQuestion {
  id: string;
  level: 'level1' | 'level2';
  method: 'UT' | 'RT' | 'MT' | 'PT' | 'VT' | 'General';
  sourceModuleId: string;
  sourceModuleName: { ar: string; en: string };
  codeReference: string;
  category: 'principles_physics' | 'calibration_equipment' | 'inspection_procedure' | 'flaw_sizing_evaluation' | 'acceptance_criteria' | 'duties_responsibility';
  question: { ar: string; en: string };
  options: { ar: string[]; en: string[] };
  correctIndex: number;
  explanation: { ar: string; en: string };
  needsSmeReview?: boolean;
  reviewStatus?: 'draft' | 'needs_sme_review' | 'approved';
  reviewNote?: { ar: string; en: string };
}

export interface GeneratedExam {
  examId: string;
  generatedAt: string;
  targetLevel: ExamCertificationLevel;
  targetMethod: ExamMethod;
  difficulty: ExamDifficultyLevel;
  mode: ExamMode;
  secondsPerQuestion: number;
  timeLimitSeconds: number;
  passingThresholdPct: number;
  questions: ExamQuestion[];
  sourceModulesSummary: {
    id: string;
    nameAr: string;
    nameEn: string;
    level: string;
    questionCount: number;
  }[];
}

export interface ExamResultSummary {
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  scorePct: number;
  passingThresholdPct: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  allocatedTimeSeconds: number;
  averageSecondsPerQuestion: number;
  pacingEvaluation: {
    grade: 'optimal' | 'moderate' | 'rushed' | 'overtime';
    labelAr: string;
    labelEn: string;
    feedbackAr: string;
    feedbackEn: string;
  };
  difficulty: ExamDifficultyLevel;
  methodBreakdown: Record<string, { total: number; correct: number; pct: number }>;
  levelBreakdown: Record<string, { total: number; correct: number; pct: number }>;
  categoryBreakdown: Record<string, { total: number; correct: number; pct: number }>;
  flaggedIndices: number[];
  userAnswers: Record<number, number>;
  recommendedModules: {
    moduleId: string;
    nameAr: string;
    nameEn: string;
    reasonAr: string;
    reasonEn: string;
  }[];
}

// -----------------------------------------------------------------------------
// Comprehensive Master Question Pool Grounded in Curriculum Modules & Codes
// -----------------------------------------------------------------------------
const MASTER_CURRICULUM_QUESTIONS: ExamQuestion[] = [
  // ===========================================================================
  // LEVEL 1: ULTRASONIC TESTING (UT)
  // ===========================================================================
  {
    id: 'l1_ut_01',
    level: 'level1',
    method: 'UT',
    sourceModuleId: 'mod_c_ut',
    sourceModuleName: { ar: 'الوحدة UT-1: أساسيات الموجات فوق الصوتية والمعايرة', en: 'Module UT-1: Ultrasonic Fundamentals & Calibration' },
    codeReference: 'ASTM E1316 / SNT-TC-1A Level 1 UT',
    category: 'principles_physics',
    question: {
      ar: 'ما هي السرعة الصوتية التقريبية للموجات الطولية (Longitudinal Waves) في الصلب الكربوني عند درجة حرارة الغرفة؟',
      en: 'What is the approximate longitudinal acoustic wave velocity in carbon steel at ambient temperature?'
    },
    options: {
      ar: ['5920 متر/ثانية (5.92 مم/ميكروثانية)', '3240 متر/ثانية (3.24 مم/ميكروثانية)', '1480 متر/ثانية (1.48 مم/ميكروثانية)', '6400 متر/ثانية (6.40 مم/ميكروثانية)'],
      en: ['5920 m/s (5.92 mm/µs)', '3240 m/s (3.24 mm/µs)', '1480 m/s (1.48 mm/µs)', '6400 m/s (6.40 mm/µs)']
    },
    correctIndex: 0,
    explanation: {
      ar: 'تبلغ سرعة الموجات الطولية في الفولاذ الكربوني حوالي 5920 م/ث (أو 0.233 بوصة/ميكروثانية)، بينما سرعة موجات القص المستعرضة هي 3240 م/ث.',
      en: 'Longitudinal wave velocity in standard carbon steel is approximately 5920 m/s (0.233 in/µs), whereas transverse shear wave velocity is roughly 3240 m/s.'
    }
  },
  {
    id: 'l1_ut_02',
    level: 'level1',
    method: 'UT',
    sourceModuleId: 'mod_c_ut',
    sourceModuleName: { ar: 'الوحدة UT-1: أساسيات الموجات فوق الصوتية والمعايرة', en: 'Module UT-1: Ultrasonic Fundamentals & Calibration' },
    codeReference: 'ASME Section V Art. 4 T-434.1',
    category: 'calibration_equipment',
    question: {
      ar: 'على قالب المعايرة القياسي V1 (IIW Type 1 Block)، ما هو نصف القطر المستخدم لمعايرة المدى ونقطة خروج المسبار (Index Point)؟',
      en: 'On the standard V1 (IIW Type 1) calibration block, what radius curved surface is used to calibrate range and verify probe index point?'
    },
    options: {
      ar: ['نصف قطر 100 مم', 'نصف قطر 25 مم', 'نصف قطر 50 مم', 'نصف قطر 200 مم'],
      en: ['100 mm radius curve', '25 mm radius curve', '50 mm radius curve', '200 mm radius curve']
    },
    correctIndex: 0,
    explanation: {
      ar: 'يتميز قالب IIW V1 بقوس نصف قطره 100 مم يعكس صدى رئيسياً عند 100 مم، ويستخدم لتحديد نقطة انبعاث الحزمة وزمن تأخير الإسفين بدقة.',
      en: 'The IIW V1 block features a 100 mm radius cylindrical quadrant reflecting an echo at exactly 100 mm, used to zero probe delay and locate the probe beam index point.'
    }
  },
  {
    id: 'l1_ut_03',
    level: 'level1',
    method: 'UT',
    sourceModuleId: 'mod_c_ut',
    sourceModuleName: { ar: 'الوحدة UT-1: أساسيات الموجات فوق الصوتية والمعايرة', en: 'Module UT-1: Ultrasonic Fundamentals & Calibration' },
    codeReference: 'ASNT SNT-TC-1A Scope of Level 1',
    category: 'duties_responsibility',
    question: {
      ar: 'وفقاً لـ ASNT SNT-TC-1A، ما هي حدود صلاحية فني المستوى الأول (Level 1 Technician) في الفحص بالموجات فوق الصوتية؟',
      en: 'According to ASNT SNT-TC-1A, what is the authoritative scope of a certified Level 1 UT technician?'
    },
    options: {
      ar: [
        'معايرة الجهاز وتنفيذ الفحص وتسجيل القياسات وفق إجراء مكتوب وتحت إشراف، دون إصدار قرار قبول أو رفض نهائي',
        'صياغة إجراءات الفحص واعتماد تقارير القبول والرفض الرسمية أمام العميل مباشرة',
        'تعديل كود القبول والرفض وتحديد نسبة العيوب المسموح بها حسب تقديره الفني',
        'تدريب وتأهيل فنيي المستوى الثاني واعتماد شهاداتهم'
      ],
      en: [
        'Calibrate instruments, conduct tests, and record readings per written procedure under supervision, without final pass/reject disposition',
        'Draft examination procedures and independently sign official client acceptance reports',
        'Alter contract acceptance codes and modify defect tolerances at personal discretion',
        'Train and qualify Level II personnel and sign their central credentials'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'تنص توصيات SNT-TC-1A على أن فني المستوى الأول مؤهل لإجراء المعايرة المحددة وتنفيذ الفحص وتسجيل النتائج فقط، بينما يتطلب تفسير وتقييم العيوب وتوقيع التقارير مستوى ثانياً على الأقل.',
      en: 'SNT-TC-1A specifies Level 1 technicians perform specific calibrations and tests under supervision and document results, while final flaw interpretation and report endorsement require Level 2 certification.'
    }
  },
  {
    id: 'l1_ut_04',
    level: 'level1',
    method: 'UT',
    sourceModuleId: 'mod_c_acad_1',
    sourceModuleName: { ar: 'الوحدة الأكاديمية 1: فيزياء الموجات الصوتية وقانون سنيل', en: 'Academic Module 1: Acoustic Physics & Snell’s Law' },
    codeReference: 'ASME Sec V Art. 4 Mandatory App.',
    category: 'principles_physics',
    question: {
      ar: 'ماذا تسمى ظاهرة تحول جزء من طاقة الموجة الطولية الساقطة بزاوية مائلة على السطح الفاصل إلى موجة قص مستعرضة؟',
      en: 'What phenomenon describes the conversion of incident longitudinal wave energy at an oblique boundary into transverse shear wave energy?'
    },
    options: {
      ar: ['التحويل النمطي (Mode Conversion)', 'التشتت الحيودي (Diffraction Scattering)', 'التخميد الكهروإجهادي (Piezoelectric Damping)', 'الرنين التوافقي (Harmonic Resonance)'],
      en: ['Mode Conversion', 'Diffraction Scattering', 'Piezoelectric Damping', 'Harmonic Resonance']
    },
    correctIndex: 0,
    explanation: {
      ar: 'عندما تسقط موجة صوتية بزاوية مائلة على حد فاصل بين وسطين مختلفي الكثافة والسرعة، يحدث تحويل نمطي (Mode Conversion) تنشأ عنه موجات طولية ومستعرضة منعكسة ومنكسرة.',
      en: 'When acoustic waves strike a boundary between media of differing acoustic impedances at an oblique angle, Mode Conversion generates both longitudinal and shear components.'
    }
  },

  // ===========================================================================
  // LEVEL 1: RADIOGRAPHIC TESTING (RT)
  // ===========================================================================
  {
    id: 'l1_rt_01',
    level: 'level1',
    method: 'RT',
    sourceModuleId: 'mod_c_rt',
    sourceModuleName: { ar: 'الوحدة RT-1: التصوير الإشعاعي والسلامة الإشعاعية', en: 'Module RT-1: Radiographic Testing & Radiation Safety' },
    codeReference: 'IAEA SSG-11 / 10 CFR 20 Radiation Safety',
    category: 'principles_physics',
    question: {
      ar: 'إذا كانت شدة الإشعاع المقاسة على مسافة 2 متر من مصدر إشعاعي هي 100 mR/h، فما هي الشدة عند مسافة 4 أمتار طبقاً لقانون التربيع العكسي؟',
      en: 'If radiation intensity measured at 2 meters from a radioactive source is 100 mR/h, what is the intensity at 4 meters per Inverse Square Law?'
    },
    options: {
      ar: ['25 mR/h (تنخفض إلى الربع)', '50 mR/h (تنخفض إلى النصف)', '12.5 mR/h (تنخفض إلى الثمن)', '200 mR/h (تتضاعف مرتين)'],
      en: ['25 mR/h (drops to one-quarter)', '50 mR/h (drops by half)', '12.5 mR/h (drops to one-eighth)', '200 mR/h (doubles)']
    },
    correctIndex: 0,
    explanation: {
      ar: 'وفق قانون التربيع العكسي (I1 × d1² = I2 × d2²)، عند مضاعفة المسافة من 2م إلى 4م، تنخفض الشدة بمقدار 2² = 4 أضعاف: 100 / 4 = 25 mR/h.',
      en: 'By the Inverse Square Law (I1 × d1² = I2 × d2²), doubling the distance from 2m to 4m reduces intensity by a factor of 2² = 4, yielding 100 / 4 = 25 mR/h.'
    }
  },
  {
    id: 'l1_rt_02',
    level: 'level1',
    method: 'RT',
    sourceModuleId: 'mod_c_rt',
    sourceModuleName: { ar: 'الوحدة RT-1: التصوير الإشعاعي والسلامة الإشعاعية', en: 'Module RT-1: Radiographic Testing & Radiation Safety' },
    codeReference: 'ASME Section V Art. 2 T-277.1',
    category: 'inspection_procedure',
    question: {
      ar: 'أين يجب وضع مؤشر جودة الصورة السلكي (Wire IQI) طبقاً لكود ASME Section V Article 2 كقاعدة عامة؟',
      en: 'Where should the wire image quality indicator (Wire IQI) generally be placed per ASME Section V Article 2?'
    },
    options: {
      ar: [
        'على جانب المصدر (Source Side) مع توجيه الأسلاك عمودياً على محور اللحام',
        'على جانب الفيلم (Film Side) أسفل شريط الرصاص الواقي دائماً',
        'داخل علبة الفيلم بين شاشتي الرصاص الأمامية والخلفية',
        'في أي مكان عشوائي على سطح العينة دون اشتراط اتجاه معين'
      ],
      en: [
        'On the source side with wires oriented perpendicular to the weld axis',
        'On the film side underneath the backing lead sheet at all times',
        'Inside the film cassette between front and rear lead screens',
        'Any random location on the component surface with no directional requirement'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'يشترط ASME Sec V Art. 2 وضع الـ IQI على جانب المصدر (Source Side) موجهاً عمودياً على خط اللحام، ولا يُسمح بوضعه على جانب الفيلم إلا في حال تعذر الوصول لجانب المصدر مع وضع حرف F الرصاصي.',
      en: 'ASME Sec V Art. 2 mandates placing the IQI on the source side with wires perpendicular to the weld seam. Film-side placement is only permitted when source side is inaccessible, accompanied by a lead letter F.'
    }
  },
  {
    id: 'l1_rt_03',
    level: 'level1',
    method: 'RT',
    sourceModuleId: 'mod_c_rt',
    sourceModuleName: { ar: 'الوحدة RT-1: التصوير الإشعاعي والسلامة الإشعاعية', en: 'Module RT-1: Radiographic Testing & Radiation Safety' },
    codeReference: 'ASME Section V Art. 2 T-284',
    category: 'calibration_equipment',
    question: {
      ar: 'ما هو الغرض من وضع حرف الرصاص "B" خلف كاسيت الفيلم أثناء التصوير الإشعاعي؟',
      en: 'What is the purpose of placing a lead letter "B" behind the film cassette during radiographic exposure?'
    },
    options: {
      ar: [
        'التحقق من عدم وجود إشعاع خلفي متشتت (Backscatter Radiation) قد يضبب الفيلم',
        'قياس الكثافة البصرية الأساسية لمعدن الأساس',
        'تحديد اتجاه سريان المائع داخل الأنبوب',
        'تحديد نوع النظير المشع المستخدم تلقائياً'
      ],
      en: [
        'To verify absence of excessive backscatter radiation fogging the radiograph',
        'To measure base metal radiographic optical density',
        'To indicate fluid flow direction inside the pipe spool',
        'To automatically identify the radioisotope energy spectrum'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'إذا ظهر خيال الحرف B الخفيف (Light image of B) على خلفية الفيلم بعد التحميض، فهذا دليل على وصول إشعاع مرتد من الخلف يستوجب إعادة التصوير مع تدريع إضافي.',
      en: 'If a light image of the lead letter "B" appears on the darker radiograph background, excessive backscatter radiation reached the film, invalidating the exposure.'
    }
  },

  // ===========================================================================
  // LEVEL 1: MAGNETIC PARTICLE TESTING (MT)
  // ===========================================================================
  {
    id: 'l1_mt_01',
    level: 'level1',
    method: 'MT',
    sourceModuleId: 'mod_c_mt',
    sourceModuleName: { ar: 'الوحدة MT-1: فحص الجسيمات المغناطيسية', en: 'Module MT-1: Magnetic Particle Testing' },
    codeReference: 'ASME Section V Art. 7 T-762 / ASTM E709',
    category: 'calibration_equipment',
    question: {
      ar: 'ما هي قوة الرفع الميكانيكية (Lifting Power) الدنيا المطلوبة للشوكة الكهرومغناطيسية بالتيار المتردد (AC Yoke) عند أقصى تباعد قطبي؟',
      en: 'What is the minimum lifting power required for an AC electromagnetic yoke at maximum pole spacing per ASME Section V Article 7?'
    },
    options: {
      ar: ['10 رطل (4.5 كجم)', '40 رطل (18.1 كجم)', '20 رطل (9.1 كجم)', '5 رطل (2.3 كجم)'],
      en: ['10 lb (4.5 kg)', '40 lb (18.1 kg)', '20 lb (9.1 kg)', '5 lb (2.3 kg)']
    },
    correctIndex: 0,
    explanation: {
      ar: 'يشترط كود ASME Sec V Art. 7 فحص قدرة رفع الـ AC Yoke بوزن معاير لا يقل عن 10 أرطال (4.5 كجم) عند تباعد الأقطاب المستخدم، بينما شوكة التيار المستمر DC تتطلب 40 رطلاً (18.1 كجم).',
      en: 'ASME Section V Art. 7 mandates that an AC electromagnetic yoke must lift at least 10 lb (4.5 kg) at maximum operating pole spacing, whereas a DC yoke must lift 40 lb (18.1 kg).'
    }
  },
  {
    id: 'l1_mt_02',
    level: 'level1',
    method: 'MT',
    sourceModuleId: 'mod_c_mt',
    sourceModuleName: { ar: 'الوحدة MT-1: فحص الجسيمات المغناطيسية', en: 'Module MT-1: Magnetic Particle Testing' },
    codeReference: 'ASTM E709 / ISO 9934-1',
    category: 'inspection_procedure',
    question: {
      ar: 'لكشف العيوب السطحية في جميع الاتجاهات بواسطة الشوكة الكهرومغناطيسية (Yoke)، كم شوط فحص يلزم لكل موقع؟',
      en: 'To reliably detect surface discontinuities in all orientations using an electromagnetic yoke, how many inspection passes are required at each location?'
    },
    options: {
      ar: [
        'شوطان متعامدان بزاوية 90 درجة تقريباً لتغطية خطوط الفيض المغناطيسي في الاتجاهين',
        'شوط واحد طولي فقط يكفي إذا كانت شدة التيار عالية',
        'أربعة أشواط دائرية متتالية بزاوية 45 درجة',
        'شوط سطحي وشوط عكسي من الجهة المقابلة للمعدن فقط'
      ],
      en: [
        'Two perpendicular passes (~90 degrees) to orient magnetic flux across all flaw directions',
        'A single longitudinal pass is sufficient if amperage is high',
        'Four consecutive circular passes at 45 degree increments',
        'One front pass and one opposite-side back pass only'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'تظهر مؤشرات الجسيمات المغناطيسية فقط عندما تقطع خطوط الفيض العيب بزاوية قائمة تقريباً، لذا يجب إجراء فحصين متعامدين (90°) لضمان كشف الشروخ الطولية والعرضية.',
      en: 'Magnetic flux leakage is maximized when flux lines cross discontinuities perpendicularly. Therefore, codes mandate two mutually perpendicular examinations (~90°) per area.'
    }
  },

  // ===========================================================================
  // LEVEL 1: LIQUID PENETRANT TESTING (PT)
  // ===========================================================================
  {
    id: 'l1_pt_01',
    level: 'level1',
    method: 'PT',
    sourceModuleId: 'mod_c_pt',
    sourceModuleName: { ar: 'الوحدة PT-1: فحص السائل النافذ ومراقبة التغلغل', en: 'Module PT-1: Penetrant Testing & Dwell Control' },
    codeReference: 'ASME Section V Art. 6 T-652 / ASTM E165',
    category: 'inspection_procedure',
    question: {
      ar: 'ما هو نطاق درجة الحرارة المعتمد لسطح قطعة الاختبار وسائل التغلغل وفق ASME Section V Article 6 دون الحاجة لمعايرة إضافية؟',
      en: 'What is the standard qualified temperature range for component surface and penetrant materials per ASME Section V Article 6 without special qualification?'
    },
    options: {
      ar: ['من 50°F إلى 125°F (من 10°C إلى 52°C)', 'من 32°F إلى 100°F (من 0°C إلى 38°C)', 'من 70°F إلى 150°F (من 21°C إلى 65°C)', 'من 0°F إلى 200°F (من -18°C إلى 93°C)'],
      en: ['50°F to 125°F (10°C to 52°C)', '32°F to 100°F (0°C to 38°C)', '70°F to 150°F (21°C to 65°C)', '0°F to 200°F (-18°C to 93°C)']
    },
    correctIndex: 0,
    explanation: {
      ar: 'ينص ASME Section V Art. 6 على أن الفحص القياسي يتم بين 50°F و 125°F (10°C إلى 52°C). وإذا تجاوزت الحرارة هذا النطاق، يجب تأهيل الإجراء بمقارنة شريحة ألمنيوم متشققة (Comparator Block).',
      en: 'ASME Section V Art. 6 specifies standard penetrant examination temperatures between 50°F and 125°F (10°C to 52°C). Operations outside this range require comparator block qualification.'
    }
  },
  {
    id: 'l1_pt_02',
    level: 'level1',
    method: 'PT',
    sourceModuleId: 'mod_c_pt',
    sourceModuleName: { ar: 'الوحدة PT-1: فحص السائل النافذ ومراقبة التغلغل', en: 'Module PT-1: Penetrant Testing & Dwell Control' },
    codeReference: 'ASME Section V Art. 6 T-673.3',
    category: 'inspection_procedure',
    question: {
      ar: 'عند إزالة سائل التغلغل الزائد القابل للإزالة بالمذيب (Method C)، كيف يجب مسح السطح؟',
      en: 'When removing excess solvent-removable penetrant (Method C), how must the surface be wiped?'
    },
    options: {
      ar: [
        'مسح السطح أولاً بقطعة قماش جافة ونظيفة، ثم بقطعة قماش مبللة بالمذيب بشكل خفيف دون رش المذيب مباشرة على القطعة',
        'رش المذيب السائل بضغط عالٍ مباشرة على وصلة اللحام لإذابة السائل النافذ سريعاً',
        'غسل السطح بتيار ماء ساخن عند 60 درجة مئوية',
        'فرك السطح بفرشاة سلكية خشنة لإزالة كل أثر للصبغة'
      ],
      en: [
        'Wipe first with clean dry cloth, then with a cloth lightly moistened with solvent—never spraying solvent directly on the surface',
        'Spray liquid solvent at high pressure directly onto the weld seam to flush penetrant quickly',
        'Wash surface with high-velocity hot water rinse at 60°C',
        'Scrub the surface with a stiff wire wheel to strip all residual dye'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'يُحظر تماماً رش المذيب مباشرة على سطح الفحص لأنه يؤدي إلى غسيل مفرط (Over-washing) واستخلاص السائل النافذ من داخل الشروخ والعيوب الدقيقة.',
      en: 'Flushing or spraying solvent directly onto the test surface is strictly forbidden because it washes penetrant out of shallow discontinuities, masking defects.'
    }
  },

  // ===========================================================================
  // LEVEL 1: VISUAL TESTING (VT)
  // ===========================================================================
  {
    id: 'l1_vt_01',
    level: 'level1',
    method: 'VT',
    sourceModuleId: 'mod_c_vt',
    sourceModuleName: { ar: 'الوحدة VT-1: الفحص البصري والإضاءة وتوثيق اللحام', en: 'Module VT-1: Visual Testing & Weld Geometry' },
    codeReference: 'ASME Section V Art. 9 T-952 / ISO 17637',
    category: 'inspection_procedure',
    question: {
      ar: 'ما هي شدة الإضاءة الدنيا (Illumination) المطلوبة على سطح الفحص البصري المباشر وفق ASME Section V Article 9؟',
      en: 'What is the minimum surface illumination required for direct visual examination per ASME Section V Article 9?'
    },
    options: {
      ar: ['1000 لوكس (100 foot-candles)', '500 لوكس (50 foot-candles)', '250 لوكس (25 foot-candles)', '1500 لوكس (150 foot-candles)'],
      en: ['1000 lux (100 foot-candles)', '500 lux (50 foot-candles)', '250 lux (25 foot-candles)', '1500 lux (150 foot-candles)']
    },
    correctIndex: 0,
    explanation: {
      ar: 'يشترط ASME Section V Art. 9 توفير إضاءة لا تقل عن 1000 lux (100 foot-candles) على السطح المفحوص، ويتم التحقق منها بمقياس لوكس معاير قبل وأثناء الفحص.',
      en: 'ASME Section V Art. 9 mandates a minimum illumination of 1000 lux (100 fc) on the inspection surface, verified using a calibrated light meter.'
    }
  },
  {
    id: 'l1_vt_02',
    level: 'level1',
    method: 'VT',
    sourceModuleId: 'mod_c_vt',
    sourceModuleName: { ar: 'الوحدة VT-1: الفحص البصري والإضاءة وتوثيق اللحام', en: 'Module VT-1: Visual Testing & Weld Geometry' },
    codeReference: 'ASME Section V Art. 9 T-952',
    category: 'inspection_procedure',
    question: {
      ar: 'في الفحص البصري المباشر (Direct Visual Examination)، ما هي أقصى مسافة وأصغر زاوية نظر مسموح بها للعين بالنسبة للسطح المفحوص؟',
      en: 'In direct visual examination per ASME Sec V Art. 9, what are the maximum viewing distance and minimum viewing angle?'
    },
    options: {
      ar: [
        'مسافة لا تزيد عن 24 بوصة (600 مم) وزاوية لا تقل عن 30 درجة مع السطح',
        'مسافة لا تزيد عن 36 بوصة (900 مم) وزاوية لا تقل عن 45 درجة مع السطح',
        'مسافة لا تزيد عن 12 بوصة (300 مم) وزاوية قائمة 90 درجة حصراً',
        'مسافة لا تزيد عن 48 بوصة (1200 مم) بدون اشتراط زاوية محددة'
      ],
      en: [
        'Distance not exceeding 24 inches (600 mm) at an angle not less than 30 degrees to the surface',
        'Distance not exceeding 36 inches (900 mm) at an angle not less than 45 degrees to the surface',
        'Distance not exceeding 12 inches (300 mm) strictly at 90 degrees',
        'Distance not exceeding 48 inches (1200 mm) with no angular restriction'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'يشترط كود ASME Sec V Art. 9 أن تكون عين الفاحص على مسافة لا تتجاوز 24 بوصة (600 مم) من سطح الفحص وبزاوية لا تقل عن 30 درجة بالنسبة لمستوي السطح.',
      en: 'ASME Sec V Art. 9 defines direct visual inspection as placing the inspector eye within 24 inches (600 mm) of the surface at an angle not less than 30 degrees.'
    }
  },

  // ===========================================================================
  // LEVEL 2: ULTRASONIC TESTING (UT) - FLAW SIZING & CODES
  // ===========================================================================
  {
    id: 'l2_ut_01',
    level: 'level2',
    method: 'UT',
    sourceModuleId: 'mod_c2_1',
    sourceModuleName: { ar: 'الوحدة 1: تحليل وتفسير مؤشرات العيوب ومعايرة الأجهزة', en: 'Module 1: Flaw Sizing, DAC Curves & Interpretation' },
    codeReference: 'ASME Section V Art. 4 Mandatory App. I',
    category: 'calibration_equipment',
    question: {
      ar: 'عند بناء منحنى تصحيح السعة مع المسافة (DAC Curve) على بلوك ASME الأساسي ذو الثقوب الجانبية (SDH)، ما هي وظيفة المنحنى الأساسية؟',
      en: 'When establishing a Distance-Amplitude Correction (DAC) curve on an ASME basic block with side-drilled holes, what is its primary engineering purpose?'
    },
    options: {
      ar: [
        'تعويض التوهين الهندسي وتشتت الحزمة الصوتية عبر المسار الصوتي لمقارنة أحجام العيوب على أعماق مختلفة',
        'زيادة تردد المسبار الصوتي تلقائياً كلما زاد سمك المعدن',
        'تحويل الموجة المستعرضة إلى موجة طولية داخل المعدن المفحوص',
        'قياس سرعة انتشار الصوت بدقة خالية من الأخطاء'
      ],
      en: [
        'Compensate for attenuation and beam spread across sound path to evaluate equal reflector sizes at varying depths',
        'Automatically raise probe frequency as component thickness increases',
        'Convert transverse shear waves to longitudinal waves inside the test specimen',
        'Measure acoustic propagation velocity with zero experimental bias'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'يعوض منحنى DAC التوهين الصوتي وتشتت الحزمة في المجال البعيد، مما يتيح تقييم سعة الإشارة الناتجة عن عيب معين بالنسبة لمرجع قياسي عند أي عمق.',
      en: 'A DAC curve equalizes echo amplitude variations caused by material attenuation and beam spreading, allowing standardized flaw evaluation regardless of depth.'
    }
  },
  {
    id: 'l2_ut_02',
    level: 'level2',
    method: 'UT',
    sourceModuleId: 'mod_c2_1',
    sourceModuleName: { ar: 'الوحدة 1: تحليل وتفسير مؤشرات العيوب ومعايرة الأجهزة', en: 'Module 1: Flaw Sizing, DAC Curves & Interpretation' },
    codeReference: 'BS EN ISO 16826 / ASME Sec V Art. 4',
    category: 'flaw_sizing_evaluation',
    question: {
      ar: 'في تحديد طول العيوب المستوية (Planar Flaws) بتقنية هبوط الـ 6 ديسيبل (6dB Drop Technique)، متى يتم تسجيل حافتي العيب؟',
      en: 'In sizing planar flaw length via the 6dB Drop technique, when are the two boundary edges of the discontinuity recorded?'
    },
    options: {
      ar: [
        'عندما تهبط سعة الصدى إلى 50% من أقصى سعة مسجلة عند تحريك المسبار على جانبي العيب',
        'عندما تتلاشى إشارة الصدى بالكامل داخل خط الضوضاء الخلفية (Grass noise)',
        'عندما تتضاعف سعة الصدى وتصل إلى 100% من ارتفاع الشاشة الكامل',
        'عندما ترتفع الإشارة بمقدار 6 dB فوق مستوى الـ DAC الأساسي'
      ],
      en: [
        'When echo amplitude drops to 50% (-6dB) of peak amplitude as probe traverses past flaw extremities',
        'When the echo signal completely disappears into basegrass noise',
        'When echo amplitude doubles and saturates 100% full screen height',
        'When the signal rises 6dB above the baseline DAC reference'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'تقنية هبوط الـ 6 dB تعتمد على أن نصف طاقة الحزمة الصوتية تسقط خارج طرف العيب عند هبوط الإشارة إلى 50% (-6dB)، مما يحدد أطراف العيب المستوي بدقة.',
      en: 'The 6dB drop method assumes the center of the beam is positioned over the physical edge of a planar reflector when the echo drops by half (-6dB / 50% FSH).'
    }
  },
  {
    id: 'l2_ut_03',
    level: 'level2',
    method: 'UT',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'ASME Section VIII Div 1 Mandatory App. 12',
    category: 'acceptance_criteria',
    needsSmeReview: true,
    reviewStatus: 'needs_sme_review',
    reviewNote: {
      ar: 'سؤال يعتمد على معيار قبول/كود؛ يجب التحقق من الإصدار والنطاق والبند قبل النشر أو الاستخدام كتقييم معتمد.',
      en: 'Code/acceptance question; verify edition, scope, and clause before publication or authoritative assessment use.'
    },
    question: {
      ar: 'وفق كود ASME Section VIII Div 1 Appendix 12 للفحص بالموجات فوق الصوتية، ما هو معيار الرفض للمؤشرات الخطية ذات السعة التي تتجاوز مستوى المرجع (100% DAC)؟',
      en: 'Under ASME Section VIII Div 1 Appendix 12 for Ultrasonic Examination, what is the rejection criterion for linear indications exceeding 100% DAC?'
    },
    options: {
      ar: [
        'تُرفض أي مؤشرات شروخ أو نقص تغلغل أو نقص اندماج خطي بغض النظر عن طولها',
        'تُقبل جميع الشروخ إذا كان طولها أقل من 19 مم (0.75 بوصة)',
        'تُقبل المؤشرات الخطية إذا لم يتجاوز ارتفاع الصدى 120% من الشاشة',
        'يُسمح بنقص التغلغل حتى 25% من سمك الجدار في جميع الظروف'
      ],
      en: [
        'All cracks, lack of penetration, and lack of fusion are strictly rejectable regardless of length',
        'All cracks are acceptable provided their length is less than 19 mm (0.75 in)',
        'Linear indications are acceptable if echo amplitude remains under 120% FSH',
        'Lack of penetration is permitted up to 25% of nominal wall thickness under all conditions'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'يحظر ASME Section VIII Div 1 Appendix 12 وجود أي شروخ (Cracks) أو نقص تغلغل (Lack of Penetration) أو نقص اندماج (Lack of Fusion) أياً كان طولها، وتعتبر عيوباً مرفوضة حتماً.',
      en: 'ASME Section VIII Div 1 Appendix 12 explicitly classifies all cracks, lack of penetration, and lack of fusion as unconditionally rejectable regardless of measured length.'
    }
  },

  // ===========================================================================
  // LEVEL 2: RADIOGRAPHIC TESTING (RT) - FILM INTERPRETATION & DENSITY
  // ===========================================================================
  {
    id: 'l2_rt_01',
    level: 'level2',
    method: 'RT',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'ASME Section V Art. 2 T-282.1',
    category: 'inspection_procedure',
    question: {
      ar: 'ما هو المدى المسموح به للكثافة الضوئية (Transmitted Optical Density) عبر جسم اللحام عند التصوير بأشعة جاما وفق ASME Section V Article 2؟',
      en: 'What is the acceptable transmitted optical density range through weld area for gamma radiography per ASME Section V Article 2?'
    },
    options: {
      ar: ['من 2.0 إلى 4.0', 'من 1.5 إلى 3.0', 'من 1.0 إلى 2.5', 'من 2.5 إلى 5.0'],
      en: ['2.0 to 4.0', '1.5 to 3.0', '1.0 to 2.5', '2.5 to 5.0']
    },
    correctIndex: 0,
    explanation: {
      ar: 'يشترط ASME Section V Art. 2 أن تكون الكثافة البصرية بين 1.8 و 4.0 لأشعة إكس، وبين 2.0 و 4.0 لأشعة جاما عند فحص الفيلم بمفرده (Single Film Viewing).',
      en: 'ASME Section V Art. 2 mandates optical density between 1.8 and 4.0 for X-radiographs, and 2.0 to 4.0 for gamma radiographs during single-film viewing.'
    }
  },
  {
    id: 'l2_rt_02',
    level: 'level2',
    method: 'RT',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'API 1104 Section 9 / ASME B31.3',
    category: 'flaw_sizing_evaluation',
    question: {
      ar: 'على فيلم أشعة لحام، ظهر مؤشر داكن ومستقيم ذو حواف غير منتظمة ويقع موازياً لخط منتصف اللحام على طول الجذر. ما هو العيب المرجح؟',
      en: 'On a weld radiograph, a dark, straight linear indication with irregular edges appears parallel to the weld centerline along the root. What is the most probable defect?'
    },
    options: {
      ar: [
        'نقص تغلغل في الجذر (Incomplete Root Penetration)',
        'تداخل معدن التنجستن (Tungsten Inclusion)',
        'قضم خارجي في التاج (External Undercut)',
        'مسامية كروية مبعثرة (Scattered Porosity)'
      ],
      en: [
        'Incomplete Root Penetration (Inadequate Penetration)',
        'Tungsten Inclusion',
        'External Crown Undercut',
        'Scattered Spherical Porosity'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'نقص التغلغل يظهر كخط داكن ومستقيم ومستمر أو متقطع على طول مركز جذر اللحام ناتج عن عدم انصهار حافتي الجذر معاً، بينما التنجستن يظهر أبيض ساطعاً.',
      en: 'Incomplete penetration manifests as a continuous or intermittent dark straight line along the root center due to unfused root faces. Tungsten appears bright white due to high density.'
    }
  },
  {
    id: 'l2_rt_03',
    level: 'level2',
    method: 'RT',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'ASME Section VIII Div 1 UW-51',
    category: 'acceptance_criteria',
    needsSmeReview: true,
    reviewStatus: 'needs_sme_review',
    reviewNote: {
      ar: 'سؤال يعتمد على معيار قبول/كود؛ يجب التحقق من الإصدار والنطاق والبند قبل النشر أو الاستخدام كتقييم معتمد.',
      en: 'Code/acceptance question; verify edition, scope, and clause before publication or authoritative assessment use.'
    },
    question: {
      ar: 'طبقاً لـ ASME Section VIII Div 1 الفقرة UW-51 للتصوير الإشعاعي الكامل (100% RT)، ما هو الحد الأقصى المسموح به لطول خبث اللحام المتطاول (Elongated Slag) لسماكة جدار t = 24 مم؟',
      en: 'Under ASME Section VIII Div 1 UW-51 for full radiography, what is the maximum permissible length of an elongated slag inclusion for wall thickness t = 24 mm?'
    },
    options: {
      ar: ['8 مم (t/3)', '6 مم (t/4)', '12 مم (t/2)', '24 مم (t بالكامل)'],
      en: ['8 mm (t/3)', '6 mm (t/4)', '12 mm (t/2)', '24 mm (equal to t)']
    },
    correctIndex: 0,
    explanation: {
      ar: 'تنص UW-51 على أن أقصى طول مسموح به للمؤشرات الخطية المحتوية على خبث هو t/3 للسماكات بين 19 مم و 57 مم، وبالتالي 24 / 3 = 8 مم.',
      en: 'Per ASME VIII UW-51, maximum allowable length for elongated slag inclusions in welds with 19 mm < t ≤ 57 mm is 1/3 t. Here, 24 / 3 = 8 mm.'
    }
  },

  // ===========================================================================
  // LEVEL 2: MULTI-CODE ACCEPTANCE & EVALUATION (ASME, API, AWS, ISO)
  // ===========================================================================
  {
    id: 'l2_code_01',
    level: 'level2',
    method: 'General',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'ASME B31.3 Table 341.3.2',
    category: 'acceptance_criteria',
    needsSmeReview: true,
    reviewStatus: 'needs_sme_review',
    reviewNote: {
      ar: 'سؤال يعتمد على معيار قبول/كود؛ يجب التحقق من الإصدار والنطاق والبند قبل النشر أو الاستخدام كتقييم معتمد.',
      en: 'Code/acceptance question; verify edition, scope, and clause before publication or authoritative assessment use.'
    },
    question: {
      ar: 'في كود أنابيب العمليات البترولية ASME B31.3 (Normal Fluid Service)، ما هو حد القبول المسموح به لعيوب الشروخ (Cracks)؟',
      en: 'In petroleum process piping code ASME B31.3 (Normal Fluid Service), what is the acceptance limit for crack indications?'
    },
    options: {
      ar: [
        'صفر - غير مسموح بوجود أي شروخ إطلاقاً (Zero tolerance)',
        'مسموح بالشروخ السطحية حتى طول 3 مم',
        'مسموح بالشروخ الداخلية إذا كان عمقها أقل من 10% من سمك الجدار',
        'مسموح بالشروخ في منطقة التأثر الحراري فقط حتى 6 مم'
      ],
      en: [
        'Zero - No cracks are permitted under any circumstances (Zero tolerance)',
        'Surface cracks are acceptable up to 3 mm in length',
        'Internal cracks are acceptable if depth is less than 10% of nominal wall thickness',
        'HAZ cracks are permitted up to 6 mm length'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'يشترط جدول 341.3.2 في ASME B31.3 عدم وجود أي شروخ (Zero Tolerance) في جميع أنواع الخدمات (العادية والحرجة والسامة).',
      en: 'ASME B31.3 Table 341.3.2 strictly enforces zero tolerance for cracks across all service categories (Normal, Severe Cyclic, and Category M Fluid Service).'
    }
  },
  {
    id: 'l2_code_02',
    level: 'level2',
    method: 'General',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'API 1104 Section 9.3',
    category: 'acceptance_criteria',
    needsSmeReview: true,
    reviewStatus: 'needs_sme_review',
    reviewNote: {
      ar: 'سؤال يعتمد على معيار قبول/كود؛ يجب التحقق من الإصدار والنطاق والبند قبل النشر أو الاستخدام كتقييم معتمد.',
      en: 'Code/acceptance question; verify edition, scope, and clause before publication or authoritative assessment use.'
    },
    question: {
      ar: 'في كود خطوط الأنابيب البترولية API 1104، ما هو الحد الأقصى المسموح به لنقص التغلغل بسبب عدم المحاذاة (IPD - Inadequate Penetration due to High-Low) في طول لحام مستمر قدره 300 مم (12 بوصة)؟',
      en: 'In cross-country pipeline code API 1104, what is the maximum aggregate length of Inadequate Penetration due to High-Low (IPD) allowed in any continuous 300 mm (12 in) weld length?'
    },
    options: {
      ar: ['50 مم (2 بوصة)', '25 مم (1 بوصة)', '75 مم (3 بوصات)', 'غير مسموح به إطلاقاً'],
      en: ['50 mm (2 inches)', '25 mm (1 inch)', '75 mm (3 inches)', 'Strictly prohibited']
    },
    correctIndex: 0,
    explanation: {
      ar: 'يسمح API 1104 الفقرة 9.3.2 بعيب IPD بأقصى طول مجمع قدره 50 مم (2 بوصة) في أي 300 مم (12 بوصة) من طول اللحام المستمر.',
      en: 'API 1104 Clause 9.3.2 permits IPD with a maximum aggregate length of 50 mm (2.0 in) in any continuous 300 mm (12 in) weld length.'
    }
  },
  {
    id: 'l2_code_03',
    level: 'level2',
    method: 'General',
    sourceModuleId: 'mod_c2_2',
    sourceModuleName: { ar: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية', en: 'Module 2: International Acceptance Standards & Reporting' },
    codeReference: 'AWS D1.1 Table 6.1 (Visual Inspection)',
    category: 'acceptance_criteria',
    needsSmeReview: true,
    reviewStatus: 'needs_sme_review',
    reviewNote: {
      ar: 'سؤال يعتمد على معيار قبول/كود؛ يجب التحقق من الإصدار والنطاق والبند قبل النشر أو الاستخدام كتقييم معتمد.',
      en: 'Code/acceptance question; verify edition, scope, and clause before publication or authoritative assessment use.'
    },
    question: {
      ar: 'في كود اللحام الإنشائي AWS D1.1 (Structural Welding Code - Steel)، ما هو الحد الأقصى المسموح به لعمق القضم (Undercut) في الوصلات الخاضعة لأحمال ديناميكية دورية (Cyclically Loaded Connections) عندما يكون سمك المعدن الأساسي t ≥ 25 مم؟',
      en: 'In AWS D1.1 Structural Welding Code, what is the maximum permitted undercut depth for cyclically loaded nontubular connections when base metal thickness t ≥ 25 mm?'
    },
    options: {
      ar: ['1.0 مم (0.04 بوصة)', '0.5 مم (0.02 بوصة)', '2.0 مم (0.08 بوصة)', 'غير مسموح بأي قضم إطلاقاً'],
      en: ['1.0 mm (0.04 in)', '0.5 mm (0.02 in)', '2.0 mm (0.08 in)', 'Undercut is completely prohibited']
    },
    correctIndex: 0,
    explanation: {
      ar: 'وفق جدول 6.1 في AWS D1.1 للوصلات الدورية ذات السماكات t ≥ 25 مم، لا يجوز أن يتجاوز عمق القضم 1.0 مم (1/32 بوصة)، ولا يزيد عن 0.5 مم للسماكات الأقل.',
      en: 'AWS D1.1 Table 6.1 mandates that undercut depth shall not exceed 1 mm (0.04 in) for materials t ≥ 25 mm, and 0.5 mm for thinner cyclically loaded structural joints.'
    }
  },
  {
    id: 'l2_duty_01',
    level: 'level2',
    method: 'General',
    sourceModuleId: 'mod_c2_1',
    sourceModuleName: { ar: 'الوحدة 1: تحليل وتفسير مؤشرات العيوب ومعايرة الأجهزة', en: 'Module 1: Flaw Sizing, DAC Curves & Interpretation' },
    codeReference: 'ASNT SNT-TC-1A / ISO 9712 Clause 5.3',
    category: 'duties_responsibility',
    question: {
      ar: 'ما هي المسؤولية الحصرية التي يمتلكها مفتش المستوى الثاني (Level 2 Inspector) ولا يمتلكها فني المستوى الأول (Level 1)؟',
      en: 'What exclusive technical authority does an NDT Level 2 Inspector possess that a Level 1 technician does not?'
    },
    options: {
      ar: [
        'تفسير وتقييم نتائج الفحص وإصدار قرار القبول أو الرفض وصياغة تعليمات الفحص وتوقيع التقارير الرسمية',
        'تنظيف السطح وتطبيق سائل التغلغل وتشغيل مفتاح تشغيل الجهاز فقط',
        'تحديد رواتب الفنيين واعتماد ميزانية الشركة للمعدات الرأسمالية',
        'إصدار شهادات اعتماد المستوى الثالث الدولية'
      ],
      en: [
        'Interpret and evaluate test results, issue accept/reject dispositions, draft work instructions, and endorse official reports',
        'Only clean surfaces, apply penetrant spray, and switch instrument power on/off',
        'Set technician compensation and approve corporate capital equipment budgets',
        'Issue central Level III certification credentials'
      ]
    },
    correctIndex: 0,
    explanation: {
      ar: 'مفتش المستوى الثاني مؤهل حصرياً لتقييم المؤشرات وفق الأكواد التعاقدية، وإصدار قرار القبول/الرفض النهائي، وصياغة تعليمات الفحص وتوقيع التقارير المعتمدة.',
      en: 'NDT Level II certified personnel hold exclusive authority to interpret indications against contract acceptance codes, determine pass/fail dispositions, and endorse test reports.'
    }
  }
];

// -----------------------------------------------------------------------------
// Helper to extract and format curriculum source modules
// -----------------------------------------------------------------------------
export function getCurriculumSourceModules() {
  const result: { id: string; nameAr: string; nameEn: string; level: 'level1' | 'level2' | 'academic'; discipline: string }[] = [];

  ENGINEERING_DISCIPLINES.forEach((disc) => {
    disc.levels.forEach((lvl) => {
      lvl.modules.forEach((mod) => {
        result.push({
          id: mod.id,
          nameAr: mod.titleAr,
          nameEn: mod.titleEn,
          level: (lvl.levelId === 'level1' ? 'level1' : lvl.levelId === 'level2' ? 'level2' : 'academic') as any,
          discipline: disc.id
        });
      });
    });
  });

  return result;
}

// -----------------------------------------------------------------------------
// Build Filtered Master Question Pool
// -----------------------------------------------------------------------------
export function buildExamQuestionPool(
  targetLevel: ExamCertificationLevel,
  targetMethod: ExamMethod,
  includeNeedsSmeReview = false
): ExamQuestion[] {
  return MASTER_CURRICULUM_QUESTIONS.filter((q) => {
    if (!includeNeedsSmeReview && (q.needsSmeReview || q.reviewStatus === 'needs_sme_review')) {
      return false;
    }
    // Level filter
    if (targetLevel !== 'both' && q.level !== targetLevel) {
      return false;
    }
    // Method filter
    if (targetMethod !== 'all' && q.method !== 'General' && q.method !== targetMethod) {
      return false;
    }
    return true;
  });
}

// -----------------------------------------------------------------------------
// Fisher-Yates In-Place Shuffle with Optional Seed-Like Predictability
// -----------------------------------------------------------------------------
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// -----------------------------------------------------------------------------
// Randomized Question Generator (shuffles questions & option positions)
// -----------------------------------------------------------------------------
export function generateRandomizedCertificationExam(config: {
  level: ExamCertificationLevel;
  method: ExamMethod;
  questionCount: number;
  mode: ExamMode;
  difficulty?: ExamDifficultyLevel;
  customSecondsPerQuestion?: number;
  includeNeedsSmeReview?: boolean;
}): GeneratedExam {
  const pool = buildExamQuestionPool(config.level, config.method, config.includeNeedsSmeReview === true);
  
  if (pool.length === 0) {
    throw new Error('No curriculum questions found matching the selected filters');
  }

  // Shuffle master questions
  const shuffledPool = shuffleArray(pool);
  const selectedQuestions = shuffledPool.slice(0, Math.min(config.questionCount, shuffledPool.length));

  // Also randomize the 4 options of each selected question while tracking correct answer
  const randomizedQuestions: ExamQuestion[] = selectedQuestions.map((origQ, qIdx) => {
    const indices = [0, 1, 2, 3];
    const shuffledIndices = shuffleArray(indices);
    const newCorrectIndex = shuffledIndices.indexOf(origQ.correctIndex);

    const newOptionsAr = shuffledIndices.map(i => origQ.options.ar[i]);
    const newOptionsEn = shuffledIndices.map(i => origQ.options.en[i]);

    return {
      ...origQ,
      id: `${origQ.id}_rand_${qIdx + 1}`,
      options: {
        ar: newOptionsAr,
        en: newOptionsEn
      },
      correctIndex: newCorrectIndex
    };
  });

  // Calculate allocated time limit configurable by difficulty level
  const difficulty = config.difficulty || 'standard';
  const tierConfig = EXAM_DIFFICULTY_TIERS[difficulty] || EXAM_DIFFICULTY_TIERS.standard;
  const secondsPerQuestion = config.customSecondsPerQuestion && config.customSecondsPerQuestion > 0
    ? config.customSecondsPerQuestion
    : tierConfig.secondsPerQuestion;

  const timeLimitSeconds = config.mode === 'timed' ? randomizedQuestions.length * secondsPerQuestion : 0;

  // Passing threshold: 70% for standard Level 1 / single method, 80% for Level 2 composite
  const passingThresholdPct = config.level === 'level2' || config.level === 'both' ? 80 : 70;

  // Summarize curriculum modules contributing to this exam
  const moduleCounts: Record<string, number> = {};
  randomizedQuestions.forEach(q => {
    moduleCounts[q.sourceModuleId] = (moduleCounts[q.sourceModuleId] || 0) + 1;
  });

  const sourceModulesSummary = Object.entries(moduleCounts).map(([modId, count]) => {
    const sample = randomizedQuestions.find(q => q.sourceModuleId === modId)!;
    return {
      id: modId,
      nameAr: sample.sourceModuleName.ar,
      nameEn: sample.sourceModuleName.en,
      level: sample.level,
      questionCount: count
    };
  });

  return {
    examId: `insco_exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    generatedAt: new Date().toISOString(),
    targetLevel: config.level,
    targetMethod: config.method,
    difficulty,
    mode: config.mode,
    secondsPerQuestion,
    timeLimitSeconds,
    passingThresholdPct,
    questions: randomizedQuestions,
    sourceModulesSummary
  };
}

// -----------------------------------------------------------------------------
// Evaluate Candidate Submission & Provide Diagnostic Curriculum Recommendations
// -----------------------------------------------------------------------------
export function evaluateExamSubmission(
  exam: GeneratedExam,
  userAnswers: Record<number, number>,
  timeSpentSeconds: number,
  flaggedIndices: number[] = []
): ExamResultSummary {
  const totalQuestions = exam.questions.length;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const methodBreakdown: Record<string, { total: number; correct: number; pct: number }> = {};
  const levelBreakdown: Record<string, { total: number; correct: number; pct: number }> = {};
  const categoryBreakdown: Record<string, { total: number; correct: number; pct: number }> = {};

  const missedModulesMap: Record<string, { nameAr: string; nameEn: string; count: number }> = {};

  exam.questions.forEach((q, idx) => {
    const chosen = userAnswers[idx];
    const isAnswered = chosen !== undefined && chosen !== null;
    const isCorrect = isAnswered && chosen === q.correctIndex;

    // Method breakdown tally
    const mKey = q.method;
    if (!methodBreakdown[mKey]) methodBreakdown[mKey] = { total: 0, correct: 0, pct: 0 };
    methodBreakdown[mKey].total += 1;
    if (isCorrect) methodBreakdown[mKey].correct += 1;

    // Level breakdown tally
    const lKey = q.level === 'level1' ? 'Level I' : 'Level II';
    if (!levelBreakdown[lKey]) levelBreakdown[lKey] = { total: 0, correct: 0, pct: 0 };
    levelBreakdown[lKey].total += 1;
    if (isCorrect) levelBreakdown[lKey].correct += 1;

    // Category breakdown tally
    const cKey = q.category;
    if (!categoryBreakdown[cKey]) categoryBreakdown[cKey] = { total: 0, correct: 0, pct: 0 };
    categoryBreakdown[cKey].total += 1;
    if (isCorrect) categoryBreakdown[cKey].correct += 1;

    if (!isAnswered) {
      unansweredCount += 1;
      if (!missedModulesMap[q.sourceModuleId]) {
        missedModulesMap[q.sourceModuleId] = { nameAr: q.sourceModuleName.ar, nameEn: q.sourceModuleName.en, count: 0 };
      }
      missedModulesMap[q.sourceModuleId].count += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
      if (!missedModulesMap[q.sourceModuleId]) {
        missedModulesMap[q.sourceModuleId] = { nameAr: q.sourceModuleName.ar, nameEn: q.sourceModuleName.en, count: 0 };
      }
      missedModulesMap[q.sourceModuleId].count += 1;
    }
  });

  // Calculate percentages
  Object.keys(methodBreakdown).forEach(k => {
    const item = methodBreakdown[k];
    item.pct = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
  });
  Object.keys(levelBreakdown).forEach(k => {
    const item = levelBreakdown[k];
    item.pct = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
  });
  Object.keys(categoryBreakdown).forEach(k => {
    const item = categoryBreakdown[k];
    item.pct = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
  });

  const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = scorePct >= exam.passingThresholdPct;

  // Real-world pacing analytics
  const allocatedTimeSeconds = exam.timeLimitSeconds > 0
    ? exam.timeLimitSeconds
    : totalQuestions * (exam.secondsPerQuestion || 90);
  const averageSecondsPerQuestion = totalQuestions > 0
    ? Math.round(timeSpentSeconds / totalQuestions)
    : 0;

  let pacingGrade: 'optimal' | 'moderate' | 'rushed' | 'overtime' = 'optimal';
  let pacingLabelAr = 'إدارة وقت مثالية (Optimal Pacing)';
  let pacingLabelEn = 'Optimal Pacing Performance';
  let pacingFeedbackAr = `أنجزت الاختبار بمعدل ${averageSecondsPerQuestion} ثانية/سؤال مع إدارة وقت متوازنة.`;
  let pacingFeedbackEn = `Completed at ${averageSecondsPerQuestion}s/question with disciplined exam time budgeting.`;

  if (exam.timeLimitSeconds > 0 && timeSpentSeconds >= exam.timeLimitSeconds) {
    pacingGrade = 'overtime';
    pacingLabelAr = 'انتهاء كامل الوقت المخصص (Time Cap Reached)';
    pacingLabelEn = 'Time Cap Reached';
    pacingFeedbackAr = 'تم استهلاك كامل الوقت المتاح حتى آخر ثانية؛ يُوصى بزيادة سرعة القراءة والحل.';
    pacingFeedbackEn = 'The examination timer expired; focus on rapid question scanning and formula recall.';
  } else if (exam.timeLimitSeconds > 0 && timeSpentSeconds <= allocatedTimeSeconds * 0.45) {
    pacingGrade = 'rushed';
    pacingLabelAr = 'حل فائق السرعة (Rapid / Accelerated Pace)';
    pacingLabelEn = 'Accelerated Speed Pace';
    pacingFeedbackAr = `أنهيت الأسئلة في أقل من نصف الوقت المتاح (${averageSecondsPerQuestion} ثانية/سؤال). تأكد من دقة مراجعة الأكواد.`;
    pacingFeedbackEn = `Finished in under half the allotted time (${averageSecondsPerQuestion}s/question). Double-check code clause details.`;
  } else if (exam.timeLimitSeconds > 0 && timeSpentSeconds > allocatedTimeSeconds * 0.85) {
    pacingGrade = 'moderate';
    pacingLabelAr = 'إنجاز في الدقائق الأخيرة (Final Buffer Finish)';
    pacingLabelEn = 'Final Buffer Completion';
    pacingFeedbackAr = 'تم تسليم الاختبار في الدقائق الأخيرة من الوقت المحدد.';
    pacingFeedbackEn = 'Completed within the final allotted time buffer.';
  }

  // Recommended modules for further study based on missed questions
  const recommendedModules = Object.entries(missedModulesMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([modId, info]) => ({
      moduleId: modId,
      nameAr: info.nameAr,
      nameEn: info.nameEn,
      reasonAr: `تم تسجيل ${info.count} إجابة بحاجة لمراجعة في هذه الوحدة المنهجية.`,
      reasonEn: `${info.count} questions in this syllabus module require review.`
    }));

  return {
    totalQuestions,
    answeredQuestions: totalQuestions - unansweredCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    scorePct,
    passingThresholdPct: exam.passingThresholdPct,
    isPassed,
    timeSpentSeconds,
    allocatedTimeSeconds,
    averageSecondsPerQuestion,
    pacingEvaluation: {
      grade: pacingGrade,
      labelAr: pacingLabelAr,
      labelEn: pacingLabelEn,
      feedbackAr: pacingFeedbackAr,
      feedbackEn: pacingFeedbackEn
    },
    difficulty: exam.difficulty || 'standard',
    methodBreakdown,
    levelBreakdown,
    categoryBreakdown,
    flaggedIndices,
    userAnswers,
    recommendedModules
  };
}
