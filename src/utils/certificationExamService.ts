import { Language } from '../types';
import { getCompletedModules, getQuizResults } from './curriculumProgress';

export interface ExamPrerequisites {
  trainingHours: number;
  experienceMonths: number;
  visionAcuity: { ar: string; en: string };
  minimumEducation: { ar: string; en: string };
  applicableCodes: string[];
  recommendedModules: string[];
}

export interface OfficialExam {
  id: string;
  code: string;
  title: { ar: string; en: string };
  accreditationBody: 'ASNT SNT-TC-1A' | 'ISO 9712' | 'API ICP' | 'CSWIP / AWS';
  level: 'level1' | 'level2' | 'level3' | 'inspector';
  method: 'UT' | 'RT' | 'MT/PT/VT' | 'PAUT/TOFD' | 'Welding' | 'API 570/510';
  feeUSD: number;
  examFormat: {
    generalQuestions: number;
    specificQuestions: number;
    practicalSamples: number;
    durationMinutes: number;
    passingScorePercent: number;
  };
  upcomingDates: { id: string; date: string; session: string; seatsLeft: number }[];
  centers: { id: string; nameAr: string; nameEn: string; country: string }[];
  prerequisites: ExamPrerequisites;
  scopeSummary: { ar: string; en: string };
}

export interface ExamRegistration {
  registrationId: string;
  examId: string;
  candidateName: string;
  candidateEmail: string;
  nationalIdOrPassport: string;
  phone: string;
  companyOrUniversity: string;
  examDate: string;
  examCenter: string;
  examFormatMode: 'in_person_center' | 'remote_proctored';
  status: 'Confirmed' | 'Pending Review' | 'Completed';
  createdAt: string;
  admissionNumber: string;
  visionAttestationConfirmed: boolean;
  codeOfEthicsAgreed: boolean;
}

export interface MockExamQuestion {
  id: string;
  examId: string;
  section: 'general' | 'specific' | 'practical';
  domain: string;
  codeReference?: string;
  question: { ar: string; en: string };
  options: { ar: string[]; en: string[] };
  correctAnswer: number;
  explanation: { ar: string; en: string };
}

const REGISTRATIONS_STORAGE_KEY = 'insco_exam_registrations_v1';

// Curated Global Testing Centers
export const EXAM_CENTERS = [
  { id: 'cairo_tc', nameAr: 'مركز القاهرة المعتمد للاختبارات الهندسية (المعادي - القاهرة)', nameEn: 'Cairo Authorized NDT Examination Center (Maadi, Egypt)', country: 'Egypt' },
  { id: 'khobar_tc', nameAr: 'مركز تدريب وتأهيل الخبر الصناعي (المنطقة الشرقية)', nameEn: 'Al-Khobar Industrial Assessment Center (Eastern Province)', country: 'Saudi Arabia' },
  { id: 'dubai_tc', nameAr: 'معهد دبي للجودة وسلامة الأصول (الواحة الصناعية)', nameEn: 'Dubai Quality & Asset Integrity Institute', country: 'UAE' },
  { id: 'doha_tc', nameAr: 'مركز الدوحة الدولي للفحص الهندسي وتأهيل الكوادر', nameEn: 'Doha International Inspection & Certification Center', country: 'Qatar' },
  { id: 'houston_tc', nameAr: 'مركز هيوستن المعتمد لـ ASNT و API (تكساس)', nameEn: 'Houston ASNT & API Testing Center (Texas)', country: 'USA' },
  { id: 'aberdeen_tc', nameAr: 'معهد أبردين لتقنيات الفحص البحري CSWIP (اسكتلندا)', nameEn: 'Aberdeen Offshore Testing Institute (Scotland)', country: 'UK' },
];

export const OFFICIAL_EXAMS: OfficialExam[] = [
  {
    id: 'asnt_ut_lvl1',
    code: 'ASNT-UT-L1',
    title: {
      ar: 'شهادة مشغل فحص الموجات فوق الصوتية المستوى الأول (ASNT SNT-TC-1A Level I UT)',
      en: 'ASNT SNT-TC-1A Ultrasonic Testing Operator (Level I UT)'
    },
    accreditationBody: 'ASNT SNT-TC-1A',
    level: 'level1',
    method: 'UT',
    feeUSD: 350,
    examFormat: {
      generalQuestions: 40,
      specificQuestions: 30,
      practicalSamples: 2,
      durationMinutes: 120,
      passingScorePercent: 70
    },
    upcomingDates: [
      { id: 'd1', date: '2026-11-15', session: 'Morning (09:00 AM)', seatsLeft: 8 },
      { id: 'd2', date: '2026-12-05', session: 'Morning (09:00 AM)', seatsLeft: 12 },
      { id: 'd3', date: '2027-01-20', session: 'Afternoon (01:00 PM)', seatsLeft: 15 }
    ],
    centers: EXAM_CENTERS,
    prerequisites: {
      trainingHours: 40,
      experienceMonths: 3,
      visionAcuity: {
        ar: 'حدة إبصار قريبة تفحص بحسب Jaeger 1 عند مسافة لا تقل عن 12 بوصة مع أو بدون نظارة طبية، وتمييز الألوان.',
        en: 'Near vision acuity Jaeger J-1 at 12 inches minimum (corrected or uncorrected) and color contrast discrimination.'
      },
      minimumEducation: {
        ar: 'شهادة ثانوية عامة أو دبلوم صناعي تقني',
        en: 'High school diploma or technical vocational certificate'
      },
      applicableCodes: ['ASME Section V Art. 4 & 5', 'ASTM E1316', 'SNT-TC-1A Para 6.3'],
      recommendedModules: ['mod_c_acad_1', 'mod_c_lvl1_1']
    },
    scopeSummary: {
      ar: 'معايرة أجهزة UT A-Scan، واستخدام قوالب المعايرة القياسية V1/V2، وقياس السمك بدقة، والكشف عن الانقطاعات تحت السطحية وفق الإجراء المعتمد.',
      en: 'Calibrate UT A-Scan flaw detectors using V1/V2 blocks, execute digital thickness measurements, and screen subsurface reflectors per written instructions.'
    }
  },
  {
    id: 'asnt_lvl2_combo',
    code: 'ASNT-NDT-L2',
    title: {
      ar: 'مفتش أول فحص غير إتلافي المستوى الثاني (ASNT Level II UT / RT / MT / PT Sizing & Evaluation)',
      en: 'ASNT SNT-TC-1A Senior NDT Inspector Level II (Volumetric & Surface Methods)'
    },
    accreditationBody: 'ASNT SNT-TC-1A',
    level: 'level2',
    method: 'UT',
    feeUSD: 520,
    examFormat: {
      generalQuestions: 40,
      specificQuestions: 30,
      practicalSamples: 3,
      durationMinutes: 150,
      passingScorePercent: 80
    },
    upcomingDates: [
      { id: 'd4', date: '2026-11-22', session: 'Morning (09:00 AM)', seatsLeft: 6 },
      { id: 'd5', date: '2026-12-18', session: 'Morning (09:00 AM)', seatsLeft: 9 },
      { id: 'd6', date: '2027-02-10', session: 'Afternoon (01:00 PM)', seatsLeft: 14 }
    ],
    centers: EXAM_CENTERS,
    prerequisites: {
      trainingHours: 80,
      experienceMonths: 12,
      visionAcuity: {
        ar: 'فحص حدة النظر Jaeger 1 سنوي، وفحص التمييز بين درجات الرمادي وتدرج الألوان الفلورية (Ishihara).',
        en: 'Annual Jaeger J-1 near vision acuity test and Ishihara 24-plate color contrast verification.'
      },
      minimumEducation: {
        ar: 'دبلوم تقني سنتين أو بكالوريوس هندسة / فيزياء مع خبرة موثقة',
        en: 'Associate technical degree or B.Sc. Engineering/Physics with certified logbook'
      },
      applicableCodes: ['ASME Section V Art. 4', 'ASME Section VIII Div 1 App. 12', 'ASME B31.3 Table 341.3.2', 'API 1104 Sec. 9'],
      recommendedModules: ['mod_c_lvl2_1', 'mod_c_lvl2_2', 'mod_c_acad_1']
    },
    scopeSummary: {
      ar: 'رسم منحنيات DAC و TCG، وتوصيف وتحديد عمق وطول وارتفاع العيوب، وتطبيق معايير القبول والرفض الكودية، واعتماد تقارير الفحص.',
      en: 'Construct Distance-Amplitude Correction (DAC/TCG), calculate flaw depth & length, evaluate indications against codes, and sign off official test reports.'
    }
  },
  {
    id: 'iso9712_lvl2',
    code: 'ISO-9712-L2',
    title: {
      ar: 'شهادة الاعتماد الأوروبي والدولي الموحد (ISO 9712 / EN ISO 9712 Level 2 Sector Welds)',
      en: 'ISO 9712 Central Certification Level 2 (Welds, Castings & Wrought Products)'
    },
    accreditationBody: 'ISO 9712',
    level: 'level2',
    method: 'UT',
    feeUSD: 680,
    examFormat: {
      generalQuestions: 40,
      specificQuestions: 30,
      practicalSamples: 3,
      durationMinutes: 180,
      passingScorePercent: 70
    },
    upcomingDates: [
      { id: 'd7', date: '2026-11-28', session: 'Full Day (09:00 AM)', seatsLeft: 5 },
      { id: 'd8', date: '2026-12-20', session: 'Full Day (09:00 AM)', seatsLeft: 7 },
      { id: 'd9', date: '2027-02-15', session: 'Full Day (09:00 AM)', seatsLeft: 10 }
    ],
    centers: EXAM_CENTERS,
    prerequisites: {
      trainingHours: 80,
      experienceMonths: 9,
      visionAcuity: {
        ar: 'شهادة فحص نظر طبية حديثة صادرة من طبيب عيون معتمد تثبت حدة إبصار Jaeger 1 وتمييز الألوان.',
        en: 'Certified ophthalmologist medical certificate confirming Jaeger 1 acuity and shades of grey discrimination.'
      },
      minimumEducation: {
        ar: 'مؤهل صناعي أو هندسي معترف به دولياً',
        en: 'Internationally accredited technical diploma or engineering degree'
      },
      applicableCodes: ['ISO 9712', 'ISO 17640 (UT Welds)', 'ISO 11666 (UT Acceptance Levels)', 'ISO 5817'],
      recommendedModules: ['mod_c_lvl2_1', 'mod_c_lvl2_2']
    },
    scopeSummary: {
      ar: 'شهادة مركزية مستقلة تمنح حاملها أهلية العمل في مشروعات الضغط الأوروبية (PED) والمنشآت النووية وتوربينات الرياح.',
      en: 'Independent centralized third-party credential recognized worldwide under Pressure Equipment Directive (PED 2014/68/EU).'
    }
  },
  {
    id: 'api_570_piping',
    code: 'API-570-ICP',
    title: {
      ar: 'مفتش أنظمة أنابيب الضغط البترولية المعتمد (API 570 Piping Inspector Certification)',
      en: 'API 570 Authorized Piping Inspector (Individual Certification Program)'
    },
    accreditationBody: 'API ICP',
    level: 'inspector',
    method: 'API 570/510',
    feeUSD: 950,
    examFormat: {
      generalQuestions: 50,
      specificQuestions: 50,
      practicalSamples: 0,
      durationMinutes: 240,
      passingScorePercent: 75
    },
    upcomingDates: [
      { id: 'd10', date: '2026-12-10', session: 'Computer Based Testing (Prometric/Center)', seatsLeft: 10 },
      { id: 'd11', date: '2027-04-08', session: 'Computer Based Testing (Prometric/Center)', seatsLeft: 20 }
    ],
    centers: EXAM_CENTERS,
    prerequisites: {
      trainingHours: 60,
      experienceMonths: 24,
      visionAcuity: {
        ar: 'فحص إبصار معتمد سنوي لقراءة أدوات القياس والمخططات الهندسية بدقة.',
        en: 'Documented near-vision acuity examination for reading isometric drawings and precision gauges.'
      },
      minimumEducation: {
        ar: 'بكالوريوس هندسة مع خبرة سنة واحدة، أو دبلوم سنتين مع سنتين خبرة، أو ثانوية مع 3 سنوات في المصافي.',
        en: 'B.Sc. Engineering with 1 year experience, or 2-year diploma with 2 years, or high school with 3 years in petrochem.'
      },
      applicableCodes: ['API 570', 'API 571 (Damage Mechanisms)', 'API 574', 'API 577', 'API 578', 'ASME B31.3', 'ASME Sec V & IX'],
      recommendedModules: ['mod_api_1', 'mod_api_2']
    },
    scopeSummary: {
      ar: 'حساب معدلات التآكل، تحديد السمك الأدنى المطلوب t_min، تقييم آليات التلف (CUI، التآكل الميكانيكي، الهيدروجيني)، واعتماد صلاحية الأنابيب.',
      en: 'Calculate short/long term corrosion rates, evaluate remaining service life, analyze CUI damage mechanisms, and authorize repair procedures.'
    }
  },
  {
    id: 'cswip_weld_31',
    code: 'CSWIP-WELD-3.1',
    title: {
      ar: 'مفتش لحام هندسي دولي معتمد (CSWIP 3.1 Certified Welding Inspector / AWS CWI)',
      en: 'CSWIP 3.1 / AWS CWI Certified Welding Inspector (Level 2 Multi-Code)'
    },
    accreditationBody: 'CSWIP / AWS',
    level: 'inspector',
    method: 'Welding',
    feeUSD: 850,
    examFormat: {
      generalQuestions: 40,
      specificQuestions: 30,
      practicalSamples: 2,
      durationMinutes: 180,
      passingScorePercent: 70
    },
    upcomingDates: [
      { id: 'd12', date: '2026-11-30', session: 'Theory + Practical Welds', seatsLeft: 4 },
      { id: 'd13', date: '2027-01-25', session: 'Theory + Practical Welds', seatsLeft: 8 }
    ],
    centers: EXAM_CENTERS,
    prerequisites: {
      trainingHours: 60,
      experienceMonths: 24,
      visionAcuity: {
        ar: 'فحص حدة بصر Jaeger 1 واختبار Ishihara للألوان معتمد رسمياً.',
        en: 'Certified Jaeger 1 acuity and Ishihara color test.'
      },
      minimumEducation: {
        ar: 'مؤهل هندسي أو فني مع سنتين خبرة في مراقبة جودة اللحام وتأهيل WPS/PQR.',
        en: 'Engineering diploma with 2 years logged welding QA/QC and WPS/PQR experience.'
      },
      applicableCodes: ['ASME Section IX', 'AWS D1.1', 'ISO 5817 Quality Levels', 'BS EN 15614'],
      recommendedModules: ['mod_weld_1', 'mod_weld_2']
    },
    scopeSummary: {
      ar: 'تأهيل ومراجعة إجراءات اللحام WPS/PQR، مراقبة حرارة التسخين المسبق والحرارة بين الباصات، فحص الوصلات بمقاييس كامبريدج، واعتماد تقارير الفحص البصري.',
      en: 'Verify WPS/PQR qualifications, monitor preheat and interpass temperatures, audit macro-etches, and inspect weld profiles with Cambridge gauges.'
    }
  }
];

// -----------------------------------------------------------------------------
// Comprehensive Bilingual Mock Exam Question Bank (General, Specific, Practical)
// -----------------------------------------------------------------------------
export const MOCK_EXAM_QUESTIONS: MockExamQuestion[] = [
  // PART A: GENERAL EXAMINATION (PHYSICS, PRINCIPLES, SAFETY)
  {
    id: 'mock_gen_1',
    examId: 'asnt_ut_lvl1',
    section: 'general',
    domain: 'Acoustic Wave Physics',
    codeReference: 'ASTM E1316 / SNT-TC-1A General UT',
    question: {
      ar: 'إذا انتقلت موجة فوق صوتية طولية من وسط البلكسيجلاس (السرعة = 2730 m/s) إلى الصلب الكربوني (السرعة = 5920 m/s)، ما هو التغير الذي يحدث في زاوية الانكسار وفق قانون سنيل؟',
      en: 'When a longitudinal ultrasonic wave enters carbon steel (velocity = 5920 m/s) from a Perspex wedge (velocity = 2730 m/s), how does the refracted angle behave according to Snell’s Law?'
    },
    options: {
      ar: [
        'تنكسر الموجة مقتربة من العمود المقام على السطح الفاصل',
        'تنكسر الموجة مبتعدة عن العمود المقام على السطح الفاصل بزاوية أكبر من زاوية السقوط',
        'تنعكس الموجة بالكامل دون أي انكسار مهما كانت زاوية السقوط',
        'تبقى زاوية الانكسار مساوية تماماً لزاوية السقوط لأن التردد ثابت'
      ],
      en: [
        'The refracted wave bends towards the normal to the interface',
        'The refracted wave bends away from the normal at an angle greater than the incident angle',
        'The wave completely reflects without refraction regardless of incident angle',
        'The refracted angle remains identical to the incident angle because frequency is constant'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'وفق قانون سنيل (sin θ1 / v1 = sin θ2 / v2)، بما أن سرعة الصوت في الصلب (v2) أكبر من سرعته في البلكسيجلاس (v1)، فإن جيب زاوية الانكسار sin θ2 سيكون أكبر من sin θ1، وبالتالي تنكسر الموجة مبتعدة عن العمود المقام.',
      en: 'By Snell’s Law (sin θ1 / v1 = sin θ2 / v2), since velocity in steel (v2) is significantly higher than in Perspex (v1), the refracted wave bends away from the normal interface.'
    }
  },
  {
    id: 'mock_gen_2',
    examId: 'asnt_ut_lvl1',
    section: 'general',
    domain: 'Near Field Physics',
    codeReference: 'ASME Section V Art. 4 Mandatory App.',
    question: {
      ar: 'ما هو تأثير زيادة تردد مسبار الفحص بالموجات فوق الصوتية من 2.25 MHz إلى 5.0 MHz (مع ثبات قطر المسبار) على طول المنطقة القريبة (Fresnel Zone N)؟',
      en: 'What is the effect of increasing ultrasonic probe frequency from 2.25 MHz to 5.0 MHz (keeping element diameter constant) on the Near Field Length (Fresnel Zone N)?'
    },
    options: {
      ar: [
        'يتناقص طول المنطقة القريبة إلى النصف',
        'يزداد طول المنطقة القريبة بنسبة تزيد عن الضعف',
        'لا يتأثر طول المنطقة القريبة لأنها تعتمد فقط على مساحة الكريستالة',
        'تختفي المنطقة القريبة تماماً وتتحول الموجة مباشرة إلى المجال البعيد'
      ],
      en: [
        'The near field length decreases by half',
        'The near field length more than doubles in length',
        'Near field length is unaffected because it depends only on crystal area',
        'The near field disappears entirely, transitioning directly into the far field'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'معادلة المنطقة القريبة هي N = D² / (4λ) = D² × f / (4v). بما أن التردد f في البسط، فإن مضاعفة التردد تؤدي إلى مضاعفة طول المنطقة القريبة N، مما يبعد نقطة التركيز الطبيعي داخل المادة.',
      en: 'The near-field equation is N = D² / (4λ) = (D² × f) / (4v). Since frequency is in the numerator, doubling frequency directly doubles the near-field length.'
    }
  },
  {
    id: 'mock_gen_3',
    examId: 'asnt_lvl2_combo',
    section: 'general',
    domain: 'Radiation Safety & Beer-Lambert Law',
    codeReference: 'IAEA SSG-11 / 10 CFR 20',
    question: {
      ar: 'في فحص التصوير الإشعاعي (RT)، إذا كانت قيمة طبقة نصف القيمة (Half-Value Layer HVL) للرصاص مع مصدر الإيريديوم-192 تساوي 4.8 مم، فكم سمك الرصاص المطلوب لخفض شدة الإشعاع إلى 12.5% من شدته الأصلية؟',
      en: 'In Radiographic Testing (RT), if the Half-Value Layer (HVL) of lead for an Iridium-192 source is 4.8 mm, what thickness of lead shielding is required to attenuate beam intensity down to 12.5% of its initial value?'
    },
    options: {
      ar: [
        '4.8 مم (طبقة واحدة HVL)',
        '9.6 مم (طبقتان HVL)',
        '14.4 مم (ثلاث طبقات HVL)',
        '19.2 مم (أربع طبقات HVL)'
      ],
      en: [
        '4.8 mm (1 HVL)',
        '9.6 mm (2 HVLs)',
        '14.4 mm (3 HVLs)',
        '19.2 mm (4 HVLs)'
      ]
    },
    correctAnswer: 2,
    explanation: {
      ar: 'كل طبقة HVL تخفض الشدة إلى النصف (50%). بعد طبقتين تنخفض إلى 25%، وبعد 3 طبقات تنخفض إلى 12.5% (1/2³ = 1/8 = 12.5%). إذن السمك المطلوب = 3 × 4.8 = 14.4 مم.',
      en: 'Each HVL reduces intensity by half: 1 HVL = 50%, 2 HVLs = 25%, 3 HVLs = 12.5% (1/2³). Required thickness = 3 × 4.8 mm = 14.4 mm.'
    }
  },
  {
    id: 'mock_gen_4',
    examId: 'asnt_lvl2_combo',
    section: 'general',
    domain: 'Magnetic Particle Flux Leakage',
    codeReference: 'ASTM E709 / ASME Sec V Art. 7',
    question: {
      ar: 'ما هي الزاوية المثلى بين اتجاه المجال المغناطيسي واتجاه الشق السطحي للحصول على أقصى تسرب للفيض المغناطيسي (Maximum Flux Leakage) وأوضح دلالة؟',
      en: 'What is the optimal angle between the applied magnetic field direction and a surface crack orientation to produce maximum flux leakage and optimal indication contrast?'
    },
    options: {
      ar: [
        '0 درجة (المجال موازٍ تماماً للشق)',
        '45 درجة فقط',
        '90 درجة (المجال عمودي تماماً على اتجاه الشق)',
        '180 درجة بعكس اتجاه خطوط المجال'
      ],
      en: [
        '0 degrees (field strictly parallel to crack orientation)',
        '45 degrees only',
        '90 degrees (magnetic field perpendicular to crack)',
        '180 degrees antiparallel'
      ]
    },
    correctAnswer: 2,
    explanation: {
      ar: 'الفيض المغناطيسي يواجه أقصى ممانعة مغناطيسية عندما يقطع الشق خطوط المجال بزاوية 90 درجة، مما يجبر الخطوط على القفز عبر الهواء مكونة قطبين شمالي وجنوبي يجذبان حبيبات الحديد بكثافة عالية.',
      en: 'Maximum magnetic flux leakage occurs when the discontinuity interrupts the flux lines at 90 degrees (perpendicular), creating strong magnetic poles that attract particles.'
    }
  },

  // PART B: SPECIFIC EXAMINATION (CODES, ACCEPTANCE CRITERIA, ASME, API)
  {
    id: 'mock_spec_1',
    examId: 'asnt_lvl2_combo',
    section: 'specific',
    domain: 'ASME Section V Calibration',
    codeReference: 'ASME Section V Art. 4 Para T-434.2.1',
    question: {
      ar: 'وفق كود ASME Section V Article 4، ما هو عمق وقطر ثقوب الحفر الجانبية (Side-Drilled Holes SDH) المستخدمة لإنشاء منحنى DAC الأساسي لسمك لحام 25 مم؟',
      en: 'Per ASME Section V Article 4, what are the standard calibration reflector positions in basic calibration blocks for a 25 mm weld thickness?'
    },
    options: {
      ar: [
        'ثقب واحد فقط عند منتصف السمك T/2',
        'ثلاثة ثقوب عند ربع السمك T/4، ومنتصف السمك T/2، وثلاثة أرباع السمك 3T/4',
        'ثقب سطحي عند 1 مم وثقب سفلي عند 24 مم',
        'حز خارجي بزاوية 45 درجة فقط'
      ],
      en: [
        'A single center-hole at T/2 only',
        'Three side-drilled holes positioned at T/4, T/2, and 3T/4 thickness locations',
        'Surface notch at 1 mm and bottom notch at 24 mm',
        '45-degree angle V-notch only'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'يشترط كود ASME Section V Article 4 أن يحتوي قالب المعايرة القياسي على ثلاثة ثقوب حفر جانبية على أعماق T/4 و T/2 و 3T/4 لرسم منحنى تصحيح المسافة والاتساع (DAC) عبر كامل عمق العينة.',
      en: 'ASME Section V Article 4 specifies three side-drilled holes at 1/4T, 1/2T, and 3/4T depths in basic calibration blocks to establish a Distance-Amplitude Correction (DAC) curve across wall thickness.'
    }
  },
  {
    id: 'mock_spec_2',
    examId: 'api_570_piping',
    section: 'specific',
    domain: 'API 570 Remaining Life',
    codeReference: 'API 570 Section 7.1.1',
    question: {
      ar: 'أنبوب نفط قطره الاسمي 8 بوصة، كان سمكه الأصلي 8.2 مم في عام 2016، وأظهر فحص UT في عام 2026 أن السمك المتبقي 6.2 مم. إذا كان السمك الأدنى المطلوب كودياً t_min هو 3.8 مم، فما هو العمر المتبقي الاسمي للأنبوب؟',
      en: 'An 8-inch process piping had a baseline wall thickness of 8.2 mm in 2016. In 2026, UT recorded thickness is 6.2 mm. If minimum required thickness t_min is 3.8 mm, what is the nominal remaining service life?'
    },
    options: {
      ar: [
        '6 سنوات',
        '12 سنة',
        '18 سنة',
        '24 سنة'
      ],
      en: [
        '6 years',
        '12 years',
        '18 years',
        '24 years'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'معدل التآكل السنوي CR = (8.2 - 6.2) / 10 = 0.2 mm/year. العمر المتبقي = (t_actual - t_min) / CR = (6.2 - 3.8) / 0.2 = 2.4 / 0.2 = 12 سنة.',
      en: 'Corrosion Rate CR = (8.2 - 6.2) / 10 years = 0.2 mm/year. Remaining Life = (t_actual - t_min) / CR = (6.2 - 3.8) / 0.2 = 2.4 / 0.2 = 12 years.'
    }
  },
  {
    id: 'mock_spec_3',
    examId: 'cswip_weld_31',
    section: 'specific',
    domain: 'ASME B31.3 Weld Acceptance',
    codeReference: 'ASME B31.3 Table 341.3.2',
    question: {
      ar: 'في فحص وصلة لحام أنبوب وفق ASME B31.3 للخدمة العادية (Normal Fluid Service)، ما هو أقصى عمق مسموح به للانخفاض الجانبي (Undercut) إذا كان سمك الجدار 12 مم؟',
      en: 'Under ASME B31.3 Table 341.3.2 for Normal Fluid Service, what is the maximum permissible undercut depth for a 12 mm nominal wall thickness pipe?'
    },
    options: {
      ar: [
        '0 مم (ممنوع تماماً)',
        '1 مم أو T/4 أيهما أقل (بحد أقصى 1 مم)',
        '2.5 مم',
        '3 مم بشرط ألا يتجاوز طوله 50 مم'
      ],
      en: [
        '0 mm (Zero tolerance)',
        '1 mm (1/32 in) or T/4 whichever is less (max 1 mm)',
        '2.5 mm',
        '3 mm provided total length is under 50 mm'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'في الجدول 341.3.2 من ASME B31.3، الحد الأقصى للانخفاض الجانبي (Undercut) في الخدمة العادية هو أصغر القيمتين: 1 مم أو T/4 (هنا 12/4 = 3 مم، فالأصغر هو 1 مم).',
      en: 'Under ASME B31.3 Table 341.3.2 Symbol I, undercut depth must not exceed the lesser of 1 mm (1/32 in) or T/4.'
    }
  },

  // PART C: PRACTICAL INTERPRETATION SCENARIOS
  {
    id: 'mock_prac_1',
    examId: 'asnt_lvl2_combo',
    section: 'practical',
    domain: 'Ultrasonic Flaw Sizing & DAC Evaluation',
    codeReference: 'ASME Section V Art. 4 App. B',
    question: {
      ar: 'أثناء فحص لحام بسمك 30 مم بمسبار زاوية 60° وتردد 4 MHz، ظهرت إشارة عيب بسعة بلغت 120% من منحنى الـ DAC الأساسي، مع امتداد أفقي أثناء مسح المسبار لمسافة 18 مم قبل أن تهبط الإشارة دون 50% DAC. كيف يتم تصنيف هذا العيب وفق كود ASME Section VIII Div 1؟',
      en: 'During 60-degree angle beam UT inspection of a 30 mm butt weld, an indication reaches 120% DAC amplitude and travels laterally for 18 mm before dropping below 50% DAC. How is this evaluated under ASME Section VIII Div 1 App. 12?'
    },
    options: {
      ar: [
        'مقبول لأنه عيب نقطي لا يتجاوز سمك الجدار',
        'مرفوض كلياً لأن سعته تجاوزت 100% DAC وتجاوز طوله حد القبول المسموح (6 مم)',
        'مقبول دون الحاجة لإصلاح إذا لم يظهر في الفحص البصري الخارجي',
        'يعتبر عيباً وهمياً ناتجاً عن هندسة جذر اللحام'
      ],
      en: [
        'Acceptable because it represents a point reflector shorter than wall thickness',
        'Rejectable because its amplitude exceeds 100% DAC and length exceeds allowable code limit (6 mm for T ≤ 19 mm)',
        'Acceptable without repair if not visible on external visual inspection',
        'Considered an acoustic geometric artifact from root profile'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'وفق ASME Section VIII Div 1 Appendix 12، أي دلالة تتجاوز منحنى الـ 100% DAC ويتجاوز طولها الحدود المسموحة (لسمك 30 مم الحد هو 1/3 T = 10 مم، بينما العيب هنا 18 مم) تعتبر مرفوضة فوراً وتستوجب الحفر والإصلاح.',
      en: 'Under ASME Section VIII Div 1 App. 12, indications exceeding reference DAC level with length greater than code limits (10 mm for 30 mm thickness; measured is 18 mm) are strictly rejectable.'
    }
  },
  {
    id: 'mock_prac_2',
    examId: 'cswip_weld_31',
    section: 'practical',
    domain: 'Weld Gauge Measurement & Hi-Lo',
    codeReference: 'AWS D1.1 Clause 6 / Cambridge Gauge',
    question: {
      ar: 'باستخدام مقياس كامبريدج (Cambridge Gauge)، تم قياس عدم الاستواء الداخلي (Internal Hi-Lo Misalignment) على وصلة أنبوب ضغط، فوجد أنه 2.5 مم، بينما يحدد إجراء اللحام WPS حداً أقصى قدره 1.5 مم. ما هو الإجراء الإلزامي لمفتش اللحام؟',
      en: 'Using a Cambridge gauge, internal Hi-Lo misalignment is measured at 2.5 mm on a high-pressure pipe joint, whereas the approved WPS limits root Hi-Lo to 1.5 mm. What is the mandatory action for the certified welding inspector?'
    },
    options: {
      ar: [
        'السماح باللحام مع زيادة شدة التيار في الباص الأول لتعويض الفارق',
        'إصدار تقرير عدم مطابقة (NCR) ورفض تجميع الوصلة (Fit-up Rejection) وإعادة ضبط الاستقامة قبل البدء باللحام',
        'اعتماد الوصلة والتوصية بزيادة سمك التعزيز الخارجي Cap لاحقاً',
        'إلغاء فحص الـ Hi-Lo والاعتماد على فحص RT بعد انتهاء اللحام'
      ],
      en: [
        'Allow welding with elevated root pass amperage to compensate for misalignment',
        'Issue a Non-Conformance Report (NCR), reject the fit-up, and mandate re-alignment before root welding begins',
        'Approve fit-up and recommend increasing outer weld cap reinforcement height later',
        'Omit Hi-Lo measurement and rely solely on post-weld Radiography'
      ]
    },
    correctAnswer: 1,
    explanation: {
      ar: 'عدم الاستواء الداخلي الزائد عن حدود WPS يؤدي حتماً إلى نقص الانصهار في الجذر (Lack of Root Fusion) أو شقوق الإجهاد. التفتيش قبل اللحام (Fit-up Stage) هو نقطة توقف إلزامية (Hold Point) تتطلب رفض الوصلة وتصحيحها فوراً.',
      en: 'Excessive internal misalignment is a major root cause of lack of fusion and severe stress concentrations. Fit-up inspection is a critical quality hold point requiring rejection before welding commences.'
    }
  }
];

// -----------------------------------------------------------------------------
// Service Functions & Local Storage Management
// -----------------------------------------------------------------------------

export function getOfficialExams(): OfficialExam[] {
  return OFFICIAL_EXAMS;
}

export function getExamRegistrations(): ExamRegistration[] {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerForExam(registrationData: Omit<ExamRegistration, 'registrationId' | 'createdAt' | 'admissionNumber' | 'status'>): ExamRegistration {
  const registrations = getExamRegistrations();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const admissionNumber = `INSCO-ADM-${year}-${randomSuffix}`;
  const registrationId = `reg_${Date.now()}_${randomSuffix}`;

  const newRecord: ExamRegistration = {
    ...registrationData,
    registrationId,
    admissionNumber,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  registrations.push(newRecord);
  try {
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
    window.dispatchEvent(new CustomEvent('insco_exam_registered', { detail: newRecord }));
  } catch (err) {
    console.error('Failed to save exam registration:', err);
  }

  return newRecord;
}

export function cancelExamRegistration(registrationId: string): boolean {
  try {
    const current = getExamRegistrations();
    const filtered = current.filter(r => r.registrationId !== registrationId);
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('insco_exam_registration_cancelled', { detail: { registrationId } }));
    return true;
  } catch {
    return false;
  }
}

export interface CandidateEligibilityReport {
  examId: string;
  isEligible: boolean;
  trainingHoursLogged: number;
  trainingHoursRequired: number;
  experienceMonthsLogged: number;
  experienceMonthsRequired: number;
  completedPrerequisiteModulesCount: number;
  totalPrerequisiteModulesCount: number;
  averageQuizScore: number;
  missingItems: { ar: string; en: string }[];
}

export function checkCandidateEligibility(exam: OfficialExam): CandidateEligibilityReport {
  const completedMap = getCompletedModules();
  const quizResults = getQuizResults();

  // Check how many recommended modules were finished
  const totalRecommended = exam.prerequisites.recommendedModules.length || 1;
  const completedPrereqs = exam.prerequisites.recommendedModules.filter(modId => Boolean(completedMap[modId])).length;

  // Compute average quiz accuracy across taken quizzes
  const quizEntries = Object.values(quizResults);
  const averageQuizScore = quizEntries.length > 0
    ? Math.round(quizEntries.reduce((acc, q) => acc + (q.score || 0), 0) / quizEntries.length)
    : 0;

  // Logged training hours estimation (approx 35 hours per completed module)
  const trainingHoursLogged = Object.keys(completedMap).length * 35;
  const trainingHoursRequired = exam.prerequisites.trainingHours;

  const missingItems: { ar: string; en: string }[] = [];

  if (trainingHoursLogged < trainingHoursRequired) {
    missingItems.push({
      ar: `يلزم إتمام ${trainingHoursRequired - trainingHoursLogged} ساعة إضافية من دراسة الوحدات والمحاكيات`,
      en: `Need ${trainingHoursRequired - trainingHoursLogged} more study hours in modules & simulators`
    });
  }

  if (completedPrereqs < totalRecommended) {
    missingItems.push({
      ar: `يتبقى إتمام ${totalRecommended - completedPrereqs} وحدة كودية أساسية موصى بها لهذا الاختبار`,
      en: `Complete remaining ${totalRecommended - completedPrereqs} mandatory code modules for this exam`
    });
  }

  const isEligible = completedPrereqs > 0 || trainingHoursLogged >= trainingHoursRequired;

  return {
    examId: exam.id,
    isEligible,
    trainingHoursLogged,
    trainingHoursRequired,
    experienceMonthsLogged: Math.round(trainingHoursLogged / 30),
    experienceMonthsRequired: exam.prerequisites.experienceMonths,
    completedPrerequisiteModulesCount: completedPrereqs,
    totalPrerequisiteModulesCount: totalRecommended,
    averageQuizScore,
    missingItems
  };
}

export function getMockExamQuestions(examId?: string, section?: 'general' | 'specific' | 'practical'): MockExamQuestion[] {
  let list = MOCK_EXAM_QUESTIONS;
  if (examId) {
    // If exact exam questions exist, filter, otherwise include cross-compatible questions
    const matching = list.filter(q => q.examId === examId);
    if (matching.length >= 2) list = matching;
  }
  if (section) {
    list = list.filter(q => q.section === section);
  }
  return list;
}
