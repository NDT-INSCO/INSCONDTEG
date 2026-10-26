import { NDTMethod, EducationalDefect, QuizQuestion, StandardEntry } from '../types';

/**
 * Core educational data for the academy hub.
 *
 * Content is written in both Arabic and English. Severity uses the Critical /
 * Major / Minor convention shared with acceptance standards; defect natures and
 * causes are kept short enough to fit the compact cards.
 */

export const NDT_METHODS: NDTMethod[] = [
  {
    id: 'vt',
    code: 'VT',
    name: { ar: 'الفحص البصري', en: 'Visual Testing (VT)' },
    description: { ar: 'فحص بصري مباشر أو غير مباشر للأسطح واللحامات', en: 'Direct or remote visual examination of surfaces and welds' },
    category: 'conventional',
    standards: 'ASME Sec V Art. 9 · ISO 17637',
  },
  {
    id: 'pt',
    code: 'PT',
    name: { ar: 'السائل النافذ', en: 'Liquid Penetrant (PT)' },
    description: { ar: 'كشف العيوب السطحية المفتوحة في المواد غير المسامية', en: 'Detect surface-breaking flaws in non-porous materials' },
    category: 'conventional',
    standards: 'ASME Sec V Art. 6 · ISO 3452',
  },
  {
    id: 'mt',
    code: 'MT',
    name: { ar: 'الجسيمات المغناطيسية', en: 'Magnetic Particle (MT)' },
    description: { ar: 'كشف العيوب السطحية وتحت السطحية في المواد الحديدية', en: 'Detect surface and near-surface flaws in ferromagnetic materials' },
    category: 'conventional',
    standards: 'ASME Sec V Art. 7 · ISO 9934',
  },
  {
    id: 'ut',
    code: 'UT',
    name: { ar: 'الموجات فوق الصوتية', en: 'Ultrasonic Testing (UT)' },
    description: { ar: 'فحص داخلي بالموجات الصوتية عالية التردد', en: 'Internal examination with high-frequency sound waves' },
    category: 'conventional',
    standards: 'ASME Sec V Art. 4/5 · ISO 17640',
  },
  {
    id: 'rt',
    code: 'RT',
    name: { ar: 'التصوير الإشعاعي', en: 'Radiographic Testing (RT)' },
    description: { ar: 'تصوير داخلي بالأشعة السينية أو الجاماوية', en: 'Internal imaging with X-rays or gamma radiation' },
    category: 'conventional',
    standards: 'ASME Sec V Art. 2 · ISO 17636',
  },
  {
    id: 'et',
    code: 'ET',
    name: { ar: 'التيارات الدوامية', en: 'Eddy Current (ET)' },
    description: { ar: 'فحص بالحث الكهرومغناطيسي للأسطح الموصلة', en: 'Electromagnetic induction testing of conductive surfaces' },
    category: 'advanced',
    standards: 'ASME Sec V Art. 8 · ISO 15548',
  },
  {
    id: 'paut',
    code: 'PAUT',
    name: { ar: 'المصفوفة الطورية', en: 'Phased Array (PAUT)' },
    description: { ar: 'موجات فوق صوتية متقدمة بتوجيه إلكتروني للحزمة', en: 'Advanced UT with electronic beam steering' },
    category: 'advanced',
    standards: 'ASME Sec V Art. 4 · ISO 13588',
  },
  {
    id: 'tofd',
    code: 'TOFD',
    name: { ar: 'فرق زمن الحيود', en: 'Time-of-Flight Diffraction (TOFD)' },
    description: { ar: 'قياس ارتفاع العيب من إشارات حيود الأطراف', en: 'Flaw height sizing from tip diffraction signals' },
    category: 'advanced',
    standards: 'ASME Sec V Art. 4 · ISO 10863',
  },
];

export const EDUCATIONAL_DEFECTS: EducationalDefect[] = [
  {
    id: 'porosity',
    name: { ar: 'المسامية', en: 'Porosity' },
    nature: { ar: 'فجوات غازية كروية موزعة أو متجمعة', en: 'Spherical gas voids, scattered or clustered' },
    cause: { ar: 'رطوبة أو تلوث الغاز الواقي أو صرف غاز غير كافٍ', en: 'Moisture or contamination in shielding gas, or poor gas flow' },
    bestDetectionMethods: ['RT', 'UT', 'PT'],
    acceptanceCriteriaCode: 'ASME Sec VIII Div 1, UW-51 · ISO 5817 level B',
    severity: 'Major',
    description: { ar: 'فقاعات غاز محاصرة في معدن اللحام', en: 'Gas pockets trapped in weld metal' },
    method: 'rt',
  },
  {
    id: 'crack',
    name: { ar: 'الشرخ', en: 'Crack' },
    nature: { ar: 'عيب مستوٍ حاد الطرف يمتد في المعدن', en: 'Planar, sharp-tipped discontinuity propagating through the metal' },
    cause: { ar: 'إجهادات تبريد أو هيدروجين أو تصدع إجهادي', en: 'Cooling stress, hydrogen embrittlement or stress cracking' },
    bestDetectionMethods: ['MT', 'PT', 'UT', 'RT'],
    acceptanceCriteriaCode: 'ASME Sec VIII Div 1, UW-52 — غير مقبول',
    severity: 'Critical',
    description: { ar: 'انكسار في المعدن أو في منطقة اللحام', en: 'Fracture in the metal or heat-affected zone' },
    method: 'mt',
  },
  {
    id: 'slag',
    name: { ar: 'الخبث المحبوس', en: 'Slag Inclusion' },
    nature: { ar: 'مادة غير معدنية حبيبية أو طولية داخل المعدن', en: 'Non-metallic, elongated or granular material trapped in the weld' },
    cause: { ar: 'تنظيف غير كافٍ بين تمريرات اللحام', en: 'Insufficient cleaning between weld passes' },
    bestDetectionMethods: ['RT', 'UT'],
    acceptanceCriteriaCode: 'ASME Sec VIII Div 1, UW-51 · ISO 5817 level C',
    severity: 'Major',
    description: { ar: 'شوائب خبث محبوسة في معدن اللحام', en: 'Trapped slag impurities in the weld metal' },
    method: 'ut',
  },
  {
    id: 'undercut',
    name: { ar: 'القضم (التهدّل)', en: 'Undercut' },
    nature: { ar: 'أخدود على جانب اللحام يقلل سمك المعدن الأصل', en: 'Groove at the weld toe reducing base-metal thickness' },
    cause: { ar: 'تيار لحام مرتفع أو زاوية قطب غير مناسبة', en: 'Excessive current or incorrect electrode angle' },
    bestDetectionMethods: ['VT', 'PT', 'MT'],
    acceptanceCriteriaCode: 'ASME Sec VIII Div 1, UW-35 · ISO 5817 level B',
    severity: 'Minor',
    description: { ar: 'أخدود في المعدن الأساسي على حافة اللحام', en: 'Groove in the base metal at the weld toe' },
    method: 'vt',
  },
  {
    id: 'lack_of_fusion',
    name: { ar: 'عدم الانصهار', en: 'Lack of Fusion' },
    nature: { ar: 'فصل مستوٍ بين معدن اللحام والمعدن الأساسي أو تمريرة سابقة', en: 'Planar separation between weld metal and base metal or a previous pass' },
    cause: { ar: 'سرعة لحام عالية أو طاقة حرارة منخفضة', en: 'High travel speed or insufficient heat input' },
    bestDetectionMethods: ['UT', 'RT', 'PAUT'],
    acceptanceCriteriaCode: 'ASME Sec VIII Div 1, UW-51 — غير مقبول',
    severity: 'Critical',
    description: { ar: 'عدم التصاق كافٍ بين اللحام والمعدن الأساسي', en: 'Insufficient bonding between weld and base metal' },
    method: 'ut',
  },
];

export const STANDARDS_LIBRARY: StandardEntry[] = [
  {
    id: 'asme_v',
    code: 'ASME Sec V',
    titleAr: 'قسم الفحص غير الإتلافي',
    titleEn: 'Section V — Non-Destructive Examination',
    scope: 'متطلبات طرق الفحص غير الإتلافي والكالبرة والتأهيل لكل طرق NDT المستخدمة في أوعية الضغط.',
    publisher: 'ASME',
    description: { ar: 'متطلبات الفحص غير الإتلافي', en: 'NDE requirements' },
    title: { ar: 'قسم الفحص', en: 'Section V - NDE' },
  },
  {
    id: 'asme_ix',
    code: 'ASME Sec IX',
    titleAr: 'تأهيل اللحام والإجراءات',
    titleEn: 'Welding, Brazing and Fusing Qualifications',
    scope: 'تأهيل اللحّامين ومشغلي اللحام وإجراءات اللحام (WPS/PQR) التي يعتمد عليها الفحص.',
    publisher: 'ASME',
    description: { ar: 'تأهيل اللحّامين والإجراءات', en: 'Welder and procedure qualifications' },
    title: { ar: 'تأهيل اللحام', en: 'Welding Qualifications' },
  },
  {
    id: 'api_570',
    code: 'API 570',
    titleAr: 'فحص أنظمة الأنابيب في الخدمة',
    titleEn: 'Piping Inspection Code',
    scope: 'فحص وصيانة وتعديل وترميم أنظمة الأنابيب تحت الضغط في الخدمة، مع فترات الفحص.',
    publisher: 'API',
    description: { ar: 'فحص وصيانة الأنابيب في الخدمة', en: 'In-service piping inspection and maintenance' },
    title: { ar: 'فحص الأنابيب', en: 'Piping Inspection' },
  },
];

export const SAMPLE_QUIZZES: QuizQuestion[] = [
  {
    id: 'q1',
    question: { ar: 'ما الطريقة المناسبة لكشف شرخ سطحي مفتوح في قطعة ألومنيوم؟', en: 'Which method is suitable for an open surface crack in aluminium?' },
    options: [
      { ar: 'MT', en: 'MT' },
      { ar: 'PT', en: 'PT' },
      { ar: 'RT', en: 'RT' },
    ],
    correctAnswer: 1,
    correctIndex: 1,
    explanation: { ar: 'الألومنيوم غير مغناطيسي؛ PT يكشف العيوب السطحية المفتوحة في المواد غير المسامية.', en: 'Aluminium is non-magnetic; PT detects open surface flaws in non-porous materials.' },
    discipline: 'conventional_ndt',
    difficulty: 'easy',
  },
  {
    id: 'q2',
    question: { ar: 'ما معادلة سرعة الموجة؟', en: 'What is the wave speed equation?' },
    options: [
      { ar: 'v = f × λ', en: 'v = f × λ' },
      { ar: 'v = f / λ', en: 'v = f / λ' },
      { ar: 'v = λ / f', en: 'v = λ / f' },
    ],
    correctAnswer: 0,
    correctIndex: 0,
    explanation: { ar: 'السرعة = التردد × الطول الموجي.', en: 'Speed = frequency × wavelength.' },
    discipline: 'conventional_ndt',
    difficulty: 'easy',
  },
];
