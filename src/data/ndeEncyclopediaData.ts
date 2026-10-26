export interface SyllabusChapter {
  id: string;
  chapterNumber: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr: string;
  badgeEn: string;
  articleIds: string[];
}

export interface EncyclopediaArticle {
  id: string;
  category: 'introduction' | 'physics_science' | 'methods_encyclopedia' | 'materials_processes' | 'radiation_safety';
  categoryTitleAr: string;
  categoryTitleEn: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  badge: string;
  readTimeMin: number;
  tags: string[];
  sections: {
    headingAr: string;
    headingEn: string;
    contentAr: string;
    contentEn: string;
    keyPointsAr?: string[];
    keyPointsEn?: string[];
    formula?: string;
  }[];
  practicalInspectionTipsAr: string[];
  practicalInspectionTipsEn: string[];
  applicableCodes: string[];
}

export const SYLLABUS_CHAPTERS: SyllabusChapter[] = [
  {
    id: 'chap-1',
    chapterNumber: 1,
    titleAr: 'الباب الأول: الأسس العامة وفلسفة التقييم غير الإتلافي',
    titleEn: 'Chapter 1: Fundamentals & Scope of NDT / NDE',
    descriptionAr: 'المفاهيم التأسيسية للاختبار والتقييم، الفرق الجوهري بين الانقطاع والعيب، ومصفوفة اختيار الطريقة المثلى.',
    descriptionEn: 'Foundations of NDT/NDE, discontinuity vs defect, code criteria, and method selection matrix.',
    badgeAr: 'التأسيس والمفاهيم',
    badgeEn: 'Scope & Intro',
    articleIds: ['intro-ndt-fundamentals']
  },
  {
    id: 'chap-2',
    chapterNumber: 2,
    titleAr: 'الباب الثاني: العلوم والفيزياء التأسيسية لـ NDT',
    titleEn: 'Chapter 2: Physics & Foundational Sciences',
    descriptionAr: 'الكهرومغناطيسية، ميكانيكا الموجات الصوتية وقانون سنيل، فيزياء الإشعاع وتوليد الأشعة، البصريات والضوء، والخاصية الشعرية.',
    descriptionEn: 'Electromagnetism, acoustic wave mechanics, radiation physics, optics, and capillary surface tension.',
    badgeAr: 'الفيزياء والرياضيات',
    badgeEn: 'Physics & Foundations',
    articleIds: [
      'sci-electricity-magnetism',
      'sci-wave-mechanics-acoustics',
      'sci-radiation-physics-decay',
      'sci-light-optics-vision',
      'sci-capillary-action-surface-tension'
    ]
  },
  {
    id: 'chap-3',
    chapterNumber: 3,
    titleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية (6 طرق)',
    titleEn: 'Chapter 3: Primary NDT Inspection Methods',
    descriptionAr: 'الموسوعات المتكاملة للفحص البصري VT، السوائل النافذة PT، الجسيمات المغناطيسية MT، الموجات فوق الصوتية UT، التصوير الإشعاعي RT، والتيارات الدوامية ET.',
    descriptionEn: 'Comprehensive handbooks for VT, PT, MT, UT, RT, and ET.',
    badgeAr: 'طرق الفحص الستة',
    badgeEn: 'Core Methods',
    articleIds: [
      'method-vt-comprehensive',
      'method-pt-comprehensive',
      'method-mt-comprehensive',
      'method-ut-comprehensive',
      'method-rt-comprehensive',
      'method-et-comprehensive'
    ]
  },
  {
    id: 'chap-4',
    chapterNumber: 4,
    titleAr: 'الباب الرابع: التقنيات الحديثة والمتقدمة (PAUT, TOFD, AE, LT, MFL)',
    titleEn: 'Chapter 4: Advanced & Specialized NDT Technologies',
    descriptionAr: 'مصفوفات الموجات الطورية، حيود زمن الرحلة للشقوق، الانبعاث الصوتي تحت الإجهاد، اختبارات التسرب، وتشتت الفيض المغناطيسي.',
    descriptionEn: 'Phased Array UT, TOFD crack sizing, Acoustic Emission, Leak Testing, and MFL inspection.',
    badgeAr: 'التقنيات المتقدمة',
    badgeEn: 'Advanced NDT',
    articleIds: ['method-advanced-ndt']
  },
  {
    id: 'chap-5',
    chapterNumber: 5,
    titleAr: 'الباب الخامس: علم المواد وهندسة التصنيع وتشكيل العيوب',
    titleEn: 'Chapter 5: Materials Science, Metallurgy & Flaw Formation',
    descriptionAr: 'البنى البلورية ومخطط Fe-C، عيوب السباكة والدرفلة، أطلس عيوب اللحام الشامل، وآليات التلف أثناء الخدمة طبقاً لمواصفة API 571.',
    descriptionEn: 'Crystal structures, Fe-C phase diagram, casting and wrought flaws, weld defects, and API 571 in-service damage.',
    badgeAr: 'المعادن والتصنيع',
    badgeEn: 'Materials & Metallurgy',
    articleIds: [
      'mat-crystal-phases-iron-carbon',
      'mat-casting-forging-discontinuities',
      'mat-welding-discontinuities-catalog',
      'mat-damage-mechanisms'
    ]
  },
  {
    id: 'chap-6',
    chapterNumber: 6,
    titleAr: 'الباب السادس: السلامة والوقاية الإشعاعية الصناعية المتقدمة',
    titleEn: 'Chapter 6: Industrial Radiation Safety & ALARA',
    descriptionAr: 'مبادئ ALARA، حسابات التدريع وطبقة نصف القيمة HVL، حدود الجرعات السنوية، والبروتوكول المعياري لطوارئ انحشار المصادر المشعة.',
    descriptionEn: 'ALARA principles, shielding and HVL calculations, annual dose limits, and emergency source recovery procedures.',
    badgeAr: 'السلامة الإشعاعية',
    badgeEn: 'Radiation Protection',
    articleIds: ['rad-safety-alara-protection']
  }
];

export const ARTICLE_CHAPTER_MAP: Record<string, { chapterNumber: number; lessonNumber: string; chapterTitleAr: string; chapterTitleEn: string }> = {
  'intro-ndt-fundamentals': {
    chapterNumber: 1,
    lessonNumber: '1.1',
    chapterTitleAr: 'الباب الأول: الأسس العامة وفلسفة التقييم غير الإتلافي',
    chapterTitleEn: 'Chapter 1: Fundamentals & Scope of NDT'
  },
  'sci-electricity-magnetism': {
    chapterNumber: 2,
    lessonNumber: '2.1',
    chapterTitleAr: 'الباب الثاني: العلوم والفيزياء التأسيسية لـ NDT',
    chapterTitleEn: 'Chapter 2: Physics & Foundational Sciences'
  },
  'sci-wave-mechanics-acoustics': {
    chapterNumber: 2,
    lessonNumber: '2.2',
    chapterTitleAr: 'الباب الثاني: العلوم والفيزياء التأسيسية لـ NDT',
    chapterTitleEn: 'Chapter 2: Physics & Foundational Sciences'
  },
  'sci-radiation-physics-decay': {
    chapterNumber: 2,
    lessonNumber: '2.3',
    chapterTitleAr: 'الباب الثاني: العلوم والفيزياء التأسيسية لـ NDT',
    chapterTitleEn: 'Chapter 2: Physics & Foundational Sciences'
  },
  'sci-light-optics-vision': {
    chapterNumber: 2,
    lessonNumber: '2.4',
    chapterTitleAr: 'الباب الثاني: العلوم والفيزياء التأسيسية لـ NDT',
    chapterTitleEn: 'Chapter 2: Physics & Foundational Sciences'
  },
  'sci-capillary-action-surface-tension': {
    chapterNumber: 2,
    lessonNumber: '2.5',
    chapterTitleAr: 'الباب الثاني: العلوم والفيزياء التأسيسية لـ NDT',
    chapterTitleEn: 'Chapter 2: Physics & Foundational Sciences'
  },
  'method-vt-comprehensive': {
    chapterNumber: 3,
    lessonNumber: '3.1',
    chapterTitleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية',
    chapterTitleEn: 'Chapter 3: Primary NDT Inspection Methods'
  },
  'method-pt-comprehensive': {
    chapterNumber: 3,
    lessonNumber: '3.2',
    chapterTitleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية',
    chapterTitleEn: 'Chapter 3: Primary NDT Inspection Methods'
  },
  'method-mt-comprehensive': {
    chapterNumber: 3,
    lessonNumber: '3.3',
    chapterTitleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية',
    chapterTitleEn: 'Chapter 3: Primary NDT Inspection Methods'
  },
  'method-ut-comprehensive': {
    chapterNumber: 3,
    lessonNumber: '3.4',
    chapterTitleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية',
    chapterTitleEn: 'Chapter 3: Primary NDT Inspection Methods'
  },
  'method-rt-comprehensive': {
    chapterNumber: 3,
    lessonNumber: '3.5',
    chapterTitleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية',
    chapterTitleEn: 'Chapter 3: Primary NDT Inspection Methods'
  },
  'method-et-comprehensive': {
    chapterNumber: 3,
    lessonNumber: '3.6',
    chapterTitleAr: 'الباب الثالث: طرق الفحص غير الإتلافي الأساسية',
    chapterTitleEn: 'Chapter 3: Primary NDT Inspection Methods'
  },
  'method-advanced-ndt': {
    chapterNumber: 4,
    lessonNumber: '4.1',
    chapterTitleAr: 'الباب الرابع: التقنيات الحديثة والمتقدمة',
    chapterTitleEn: 'Chapter 4: Advanced & Specialized NDT Technologies'
  },
  'mat-crystal-phases-iron-carbon': {
    chapterNumber: 5,
    lessonNumber: '5.1',
    chapterTitleAr: 'الباب الخامس: علم المواد وهندسة التصنيع وتشكيل العيوب',
    chapterTitleEn: 'Chapter 5: Materials Science, Metallurgy & Flaw Formation'
  },
  'mat-casting-forging-discontinuities': {
    chapterNumber: 5,
    lessonNumber: '5.2',
    chapterTitleAr: 'الباب الخامس: علم المواد وهندسة التصنيع وتشكيل العيوب',
    chapterTitleEn: 'Chapter 5: Materials Science, Metallurgy & Flaw Formation'
  },
  'mat-welding-discontinuities-catalog': {
    chapterNumber: 5,
    lessonNumber: '5.3',
    chapterTitleAr: 'الباب الخامس: علم المواد وهندسة التصنيع وتشكيل العيوب',
    chapterTitleEn: 'Chapter 5: Materials Science, Metallurgy & Flaw Formation'
  },
  'mat-damage-mechanisms': {
    chapterNumber: 5,
    lessonNumber: '5.4',
    chapterTitleAr: 'الباب الخامس: علم المواد وهندسة التصنيع وتشكيل العيوب',
    chapterTitleEn: 'Chapter 5: Materials Science, Metallurgy & Flaw Formation'
  },
  'rad-safety-alara-protection': {
    chapterNumber: 6,
    lessonNumber: '6.1',
    chapterTitleAr: 'الباب السادس: السلامة والوقاية الإشعاعية الصناعية المتقدمة',
    chapterTitleEn: 'Chapter 6: Industrial Radiation Safety & ALARA'
  }
};

export interface DefectProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  origin: 'Inherent (Casting/Ingot)' | 'Processing (Forging/Rolling)' | 'Welding' | 'In-Service Degradation';
  originAr: string;
  criticality: 'Critical (Rejection Mandatory)' | 'Major' | 'Minor / Acceptable within limits';
  criticalityAr: string;
  morphologyAr: string;
  morphologyEn: string;
  rootCausesAr: string[];
  rootCausesEn: string[];
  detectionMatrix: {
    method: 'VT' | 'PT' | 'MT' | 'UT' | 'RT' | 'ET';
    detectability: 'High' | 'Moderate' | 'Low' | 'Not Applicable';
    detectabilityAr: 'عالية جداً' | 'متوسطة' | 'منخفضة' | 'غير قابلة للتطبيق';
    descriptionAr: string;
    descriptionEn: string;
  }[];
  asmeAwsAcceptanceCriteriaAr: string;
  asmeAwsAcceptanceCriteriaEn: string;
  preventionMethodAr: string;
  preventionMethodEn: string;
}

export interface NdtFormula {
  id: string;
  nameAr: string;
  nameEn: string;
  method: 'UT' | 'RT' | 'ET' | 'WELD' | 'GENERAL';
  formulaLatex: string;
  descriptionAr: string;
  descriptionEn: string;
  variables: {
    symbol: string;
    nameAr: string;
    nameEn: string;
    unit: string;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
  }[];
  calculate: (inputs: Record<string, number>) => {
    result: number;
    unit: string;
    formattedAr: string;
    formattedEn: string;
    explanationAr: string;
    explanationEn: string;
  };
}

export const ENCYCLOPEDIA_ARTICLES: EncyclopediaArticle[] = [
  // ==================== 0. INTRODUCTION & PHILOSOPHY OF NDT ====================
  {
    id: 'intro-ndt-fundamentals',
    category: 'introduction',
    categoryTitleAr: 'مقدمة وفلسفة وتاريخ الاختبارات غير الإتلافية',
    categoryTitleEn: 'Introduction & Philosophy of NDT',
    titleAr: 'مدخل شامل لعلم وفلسفة الاختبارات غير الإتلافية (NDT / NDE / NDI)',
    titleEn: 'Comprehensive Introduction to NDT, NDE & Structural Integrity',
    summaryAr: 'المفاهيم التأسيسية للاختبار والتقييم غير الإتلافي، الفرق بين الانقطاع والعيب، دور الفحص في منع الكوارث وتمديد العمر الافتراضي ومصفوفة اختيار الطريقة.',
    summaryEn: 'Foundational concepts of NDT/NDE, distinguishing discontinuity vs defect, disaster prevention, asset life extension, and method selection matrix.',
    badge: 'Introduction & Scope',
    readTimeMin: 12,
    tags: ['NDT Intro', 'Quality Control', 'Asset Integrity', 'Safety', 'Method Selection'],
    sections: [
      {
        headingAr: 'تعريف علم الاختبارات غير الإتلافية ومستوياته الثلاثة',
        headingEn: 'Definition and the Three Tiers: NDT, NDI, NDE',
        contentAr: 'الاختبارات غير الإتلافية (Nondestructive Testing - NDT) هي مجموعة من التقنيات الهندسية والفيزيائية المستخدمة لفحص واختبار المواد والوصلات والمكونات دون إحداث أي تغيير دائم أو تدمير في خواصها أو صلاحيتها للخدمة المستمرة.\nيتدرج العلم في ثلاثة مستويات:\n1. الاختبار (NDT - Testing): تطبيق الإجراء الفيزيائي للحصول على إشارات ودلالات (Indications).\n2. الفحص والتفتيش (NDI - Inspection): مقارنة الدلالات المسجلة بحدود ومعايير الكود لتحديد مدى قبولها أو رفضها.\n3. التقييم الهندسي الشامل (NDE - Evaluation): قياس حجم العيب ومكانه بدقة واستخدام ميكانيكا الكسر لتقييم العمر المتبقي وصلاحية المكون للخدمة (Fitness-for-Service FFS).',
        contentEn: 'Nondestructive Testing (NDT) encompasses physical techniques to examine materials and components without impairing their future usefulness.\nThree progressive tiers exist:\n1. NDT (Testing): Applying the physical technique to produce indications.\n2. NDI (Inspection): Comparing indications against code acceptance standards to decide pass/fail.\n3. NDE (Evaluation): Sizing flaw geometry and using fracture mechanics to evaluate fitness-for-service and remaining operational lifespan.',
        keyPointsAr: [
          'الانقطاع (Discontinuity): أي تغير أو انقطاع في التركيب الفيزيائي أو المورفولوجي للمعدن.',
          'الدلالة (Indication): استجابة جهاز الفحص (صدى صوتي، تغير ألوان، ظل داكن على الفيلم) التي تتطلب فحصاً لمعرفة سببها.',
          'العيب (Defect): انقطاع يتجاوز حجمه أو خطورته حدود القبول المسموح بها في كود الإنشاء (ASME / AWS / API)، مما يستوجب الرفض والإصلاح.'
        ],
        keyPointsEn: [
          'Discontinuity: Any interruption in typical physical or metallurgical structure.',
          'Indication: A physical response or signal recorded by an NDT method requiring analysis.',
          'Defect: A discontinuity exceeding rejection limits of the governing engineering code, mandating repair or replacement.'
        ]
      },
      {
        headingAr: 'مصفوفة اختيار طريقة الفحص المثلى (Method Selection Matrix)',
        headingEn: 'Method Selection Decision Matrix',
        contentAr: 'لا توجد طريقة NDT واحدة قادرة على كشف كل العيوب في كل المواد؛ اختيار الطريقة يحكمه موقع العيب وطبيعة المادة:\n- الشروخ السطحية المفتوحة في أي مادة مصمتة غير مسامية: السوائل النافذة (PT).\n- الشروخ السطحية وتحت السطحية في الفولاذ الكربوني الحديدي: الجسيمات المغناطيسية (MT).\n- العيوب السطحية من خلال الدهان أو في أنابيب المبادلات الحرارية: التيارات الدوامية (ET).\n- العيوب الحجمية الداخلية (مسامية، خبث، نقص اختراق) وتوثيق الفيلم الدائم: التصوير الإشعاعي (RT).\n- العيوب المستوية الشديدة الخطورة (شروخ، نقص انصهار) مع تحديد العمق والحجم ثلاثي الأبعاد: الموجات فوق الصوتية (UT / PAUT / TOFD).',
        contentEn: 'No single NDT method inspects every flaw in every material; method selection depends on flaw depth, orientation, and material properties:\n- Surface breaking flaws in nonporous materials: Liquid Penetrant (PT).\n- Surface and near-subsurface flaws in ferromagnetic steel: Magnetic Particle (MT).\n- Surface flaws through paint or heat exchanger tubing: Eddy Current (ET).\n- Internal volumetric voids with permanent record: Radiography (RT).\n- Planar cracks/fusion defects with 3D sizing: Ultrasonic Testing (UT / PAUT / TOFD).',
        keyPointsAr: [
          'الجمع بين طريقتين مكملتين (Complementary Methods) هو المعيار الهندسي في المشاريع الحرجة (مثل VT + MT للسطح مع PAUT + TOFD للحجم).',
          'التكلفة، توفر الوصول من جهة واحدة أو جهتين، ومخاطر السلامة الإشعاعية تحكم قرار اختيار الطريقة.'
        ],
        keyPointsEn: [
          'Combining complementary methods (e.g., surface MT + volumetric PAUT/TOFD) is standard practice for high-integrity components.',
          'Access constraints, single-side vs dual-side requirements, and radiation safety heavily influence method selection.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'راجع دائماً إجراء الفحص المعتمد (Written Procedure) المعتمد من قبل Level III قبل بدء التفتيش في الموقع.',
      'افصل بين خطوة كشف الدلالة (Detection) وخطوة تفسيرها (Interpretation) وخطوة تقييمها وقبولها (Evaluation) لتجنب الانحياز المبكر.'
    ],
    practicalInspectionTipsEn: [
      'Always verify you are working to an approved Level III procedure specific to the contract code edition.',
      'Maintain rigorous separation between detection, interpretation, and code evaluation to avoid premature diagnostic bias.'
    ],
    applicableCodes: ['ASNT SNT-TC-1A', 'ISO 9712', 'ASME Sec V', 'API 577']
  },

  // ==================== 1. PHYSICS & SCIENCE OF NDT ====================
  {
    id: 'sci-electricity-magnetism',
    category: 'physics_science',
    categoryTitleAr: 'فيزياء وعلوم الاختبارات غير الإتلافية',
    categoryTitleEn: 'Physics & Science of NDT',
    titleAr: 'الكهرباء والمغناطيسية وحلقة التخلفية المغناطيسية (B-H Curve)',
    titleEn: 'Electricity, Magnetism & The Magnetic Hysteresis Loop (B-H Curve)',
    summaryAr: 'الأساس الفيزيائي لاختبارات الجسيمات المغناطيسية MT والتيارات الدوامية ET، وسلوك النطاقات المغناطيسية وتشبع الفيرومغناطيسية.',
    summaryEn: 'The foundational physics behind Magnetic Particle (MT) and Eddy Current (ET) testing, domain theory, and ferromagnetic saturation.',
    badge: 'Physics Foundation',
    readTimeMin: 12,
    tags: ['Magnetism', 'MT', 'ET', 'Hysteresis', 'Permeability', 'Flux Leakage'],
    sections: [
      {
        headingAr: 'المجالات المغناطيسية ونظرية النطاقات (Domain Theory)',
        headingEn: 'Magnetic Fields and Domain Theory',
        contentAr: 'تتميز المواد الفيرومغناطيسية (كالحديد والكوبالت والنيكل ومعظم سبائك الصلب الكربوني) بوجود نطاقات مغناطيسية مجهرية (Magnetic Domains). في الحالة غير الممغنطة، تكون اتجاهات العزوم المغناطيسية لهذه النطاقات عشوائية مما يجعل المحصلة الكلية للمجال صفراً. عند تطبيق مجال مغناطيسي خارجي (H)، تصطف هذه النطاقات في اتجاه المجال الخارجي وتندمج جدرانها (Bloch Walls)، مما يولد فيضاً مغناطيسياً داخلياً كثيفاً (B).',
        contentEn: 'Ferromagnetic materials (iron, cobalt, nickel, and carbon steels) consist of microscopic magnetic domains. In an unmagnetized state, their moments point randomly, canceling net magnetization. When an external field (H) is applied, domains rotate into alignment and expand, creating high internal magnetic flux density (B).',
        keyPointsAr: [
          'النفاذية المغناطيسية (μ = B / H) هي مقياس سهولة تدفق الخطوط المغناطيسية داخل المادة.',
          'الصلب عالي الكربون يمتلك نفاذية أقل وقوة قسرية (Coercive force) أعلى مقارنة بالحديد النقي.',
          'فوق درجة حرارة كوري (Curie Temperature ≈ 770°C للصلب)، تفقد المادة خاصيتها الفيرومغناطيسية وتتحول لبارامغناطيسية.'
        ],
        keyPointsEn: [
          'Magnetic permeability (μ = B / H) indicates how easily flux lines penetrate a material.',
          'High carbon steel has lower permeability and higher coercive force than soft iron.',
          'Above Curie temperature (~770°C for steel), ferromagnetism is completely lost.'
        ]
      },
      {
        headingAr: 'منحنى التخلفية المغناطيسية (Hysteresis Loop)',
        headingEn: 'The Magnetic Hysteresis Loop',
        contentAr: 'يمثل منحنى B-H العلاقة بين شدة المجال المطبق H وكثافة الفيض المغناطيسي الناتج B. عند زيادة H يصل المنحنى إلى نقطة التشبع المغناطيسي (Saturation). عند خفض H إلى الصفر، يتبقى جزء من المغناطيسية يسمى المغناطيسية المتبقية (Residual Magnetism أو Retentivity Br). ولإلغاء هذا الفيض يلزم تطبيق مجال عكسي يعادل القوة القسرية (Coercive Force Hc).',
        contentEn: 'The B-H loop graphs induced flux density B against applied magnetizing force H. As H increases, the material reaches saturation. When H drops to zero, residual magnetism (Br) remains. Applying a reversed field equal to the coercive force (Hc) is required to reduce net flux to zero.',
        formula: 'B = \\mu \\cdot H = \\mu_0 (H + M)',
        keyPointsAr: [
          'المواد ذات القوة القسرية العالية تتطلب جهداً كبيراً في إزالة المغنطة (Demagnetization).',
          'تسرب الفيض المغناطيسي (Magnetic Flux Leakage) عند الشروخ يحدث لأن هواء الشرخ يمتلك نفاذية مغناطيسية أقل بكثير من المعدن.'
        ],
        keyPointsEn: [
          'High coercivity steels require substantial demagnetization energy.',
          'Magnetic flux leakage occurs at cracks because air has drastically lower permeability than the surrounding metal.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'استخدم دائماً مؤشر اتجاه المجال (Pie Gauge أو QQI Shims) للتأكد من وصول كثافة الفيض للحد الأدنى (30 إلى 60 Gauss) واتجاهه المتعامد مع الشروخ المتوقعة.',
      'في الفحص بالمغنطة المتناوبة (AC Yoke)، يتركز الفيض في السطح (Skin Effect) مما يمنحه حساسية قصوى للشروخ السطحية الدقيقة وقدرة رفع 4.5 كجم (10 lbs).',
      'في الفحص بالتيار المستمر (DC / HWAC)، يخترق الفيض تحت السطح حتى 6 مم، ويتطلب فحص رفع للأذرع 18 كجم (40 lbs).'
    ],
    practicalInspectionTipsEn: [
      'Always verify field adequacy and orientation using QQI shims or a Pie Gauge (target 30-60 Gauss perpendicular to anticipated flaw).',
      'AC Yokes concentrate flux on the outer surface (skin effect), yielding superior sensitivity for tight surface cracks (requires 10 lb dead-weight lift).',
      'DC / HWAC achieves subsurface penetration up to 6mm, requiring an 18 kg (40 lb) dead-weight lift test.'
    ],
    applicableCodes: ['ASME Sec V Art. 7', 'ASTM E1444', 'ASTM E709', 'ISO 9934-1']
  },
  {
    id: 'sci-wave-mechanics-acoustics',
    category: 'physics_science',
    categoryTitleAr: 'فيزياء وعلوم الاختبارات غير الإتلافية',
    categoryTitleEn: 'Physics & Science of NDT',
    titleAr: 'ميكانيكا الموجات الصوتية وقوانين الانكسار والانعكاس (Snell’s Law)',
    titleEn: 'Acoustic Wave Mechanics, Impedance & Refraction (Snell’s Law)',
    summaryAr: 'السلوك الفيزيائي للموجات فوق الصوتية UT، أنماط الموجات (طولية، قصية، رايلي)، الممانعة الصوتية وقانون سنيل لتحويل الأنماط.',
    summaryEn: 'Physics of ultrasonic waves, longitudinal vs shear vs surface modes, acoustic impedance, and Snell’s Law for mode conversion.',
    badge: 'Acoustics & UT',
    readTimeMin: 14,
    tags: ['Acoustics', 'Ultrasonics', 'UT', 'PAUT', 'Snell Law', 'Impedance'],
    sections: [
      {
        headingAr: 'أنماط الموجات الصوتية وسرعاتها في المواد',
        headingEn: 'Wave Modes and Velocities',
        contentAr: 'الموجات فوق الصوتية هي موجات ميكانيكية تتطلب وسطاً مادياً للانتشار بتردد أعلى من 20 كيلوهرتز (وعادة بين 0.5 و15 ميجاهرتز في NDT). تنتشر الموجات بأنماط رئيسية:\n1. الموجات الطولية (Longitudinal / Compression): تهتز الجزيئات موازية لاتجاه انتشار الموجة، وتنتشر في المواد الصلبة والسوائل والغازات. سرعتها في الفولاذ الكربوني ≈ 5920 م/ث.\n2. الموجات القصية أو العرضية (Shear / Transverse): تهتز الجزيئات عمودياً على اتجاه الانتشار، وتنتشر فقط في المواد الصلبة لأن السوائل لا تتحمل إجهادات القص. سرعتها في الفولاذ ≈ 3240 م/ث (حوالي نصف السرعة الطولية).\n3. موجات رايلي السطحية (Rayleigh Waves): تنتشر على السطح بعمق يعادل طول موجي واحد λ، سرعتها ≈ 2980 م/ث في الفولاذ.\n4. موجات لامب (Lamb Waves): موجات صفائحية تنتشر في الألواح الرقيقة التي يقل سمكها عن بضعة أطوال موجية.',
        contentEn: 'Ultrasonic waves are mechanical vibrations propagating above 20 kHz (typically 0.5-15 MHz in NDT). Primary wave modes:\n1. Longitudinal waves: Particle motion is parallel to wave direction; travels in solids, liquids, and gases (~5920 m/s in steel).\n2. Shear (transverse) waves: Particle motion is perpendicular to wave direction; travels only in solids (~3240 m/s in steel).\n3. Rayleigh (surface) waves: Confined to within 1 wavelength of the surface (~2980 m/s in steel).\n4. Lamb waves: Plate waves propagating in thin geometries.',
        formula: '\\lambda = \\frac{v}{f}',
        keyPointsAr: [
          'الطول الموجي λ هو المسافة بين قمتين متتاليتين؛ أصغر عيب يمكن كشفه نظرياً يساوي λ/2.',
          'التردد العالي (مثل 5 أو 10 MHz) يعطي طول موجي أقصر وقدرة تمييز (Resolution) أعلى، ولكنه يعاني من توهين أكبر في المواد ذات الحبيبات الكبيرة.'
        ],
        keyPointsEn: [
          'Wavelength λ is distance between wave peaks; theoretical smallest detectable flaw size is approximately λ/2.',
          'Higher frequencies yield shorter wavelengths and superior resolution, but suffer greater attenuation in coarse-grained materials.'
        ]
      },
      {
        headingAr: 'الممانعة الصوتية (Acoustic Impedance) والانعكاس',
        headingEn: 'Acoustic Impedance and Reflection',
        contentAr: 'الممانعة الصوتية Z هي حاصل ضرب كثافة المادة في سرعة الصوت داخلها (Z = ρ · v). عندما تقابل الموجة حداً فاصلاً بين وسطين مختلفين في الممانعة (Z1 وZ2)، ينعكس جزء وينفذ الآخر. الفارق الهائل بين ممانعة الفولاذ (Z ≈ 45 × 10^6 kg/m²s) والهواء (Z ≈ 400 kg/m²s) يؤدي إلى انعكاس ما يقارب 100% من الطاقة الصوتية، ولهذا السبب يلزم استخدام وسيط اقتران (Couplant) كالجِل أو الزيت لإلغاء الهواء بين المسبار والقطعة.',
        contentEn: 'Acoustic impedance Z is the product of density and acoustic velocity (Z = ρ · v). At an interface between two media, the reflection coefficient R depends on the impedance mismatch. The vast mismatch between steel (Z ~45 MRayls) and air (Z ~0.0004 MRayls) causes ~100% sound reflection, requiring liquid couplant to transmit sound.',
        formula: 'R = \\left( \\frac{Z_2 - Z_1}{Z_2 + Z_1} \\right)^2, \\quad T = \\frac{4 Z_1 Z_2}{(Z_1 + Z_2)^2}',
        keyPointsAr: [
          'الشرخ الهوائي داخل المعدن يمثل عاكساً تاماً (100% Reflection) بسبب التفاوت الهائل في الممانعة.',
          'معامل النفاذ T يوضح نسبة الطاقة العابرة عبر الحد الفاصل.'
        ],
        keyPointsEn: [
          'An air-filled crack inside steel acts as a near-perfect 100% acoustic reflector.',
          'Transmission coefficient T represents sound energy transferred across the boundary.'
        ]
      },
      {
        headingAr: 'قانون سنيل والانكسار والزوايا الحرجة (Snell’s Law)',
        headingEn: 'Snell’s Law and Critical Angles',
        contentAr: 'عندما تسقط موجة صوتية بزاوية مائلة على واجهة بين وسطين، ينكسر الصوت وتتغير زاويته طبقاً لنسبة السرعات. الزاوية الحرجة الأولى هي زاوية السقوط التي تنكسر عندها الموجة الطولية بزاوية 90° (مما يترك فقط موجات قصية في القطعة). والزاوية الحرجة الثانية هي زاوية السقوط التي تنكسر عندها الموجة القصية بزاوية 90° (مما يحولها لموجات رايلي سطحية). فحص اللحام بزوايا (45°، 60°، 70°) يُصمم في الإسفين البلاستيكي (Lucite/Perspex) بحيث يقع بين الزاويتين الحرجتين الأولى والثانية لضمان إنتاج موجة قصية نقية فقط دون تشويش من موجات طولية.',
        contentEn: 'When sound strikes an interface at an oblique angle, refraction and mode conversion occur per Snell’s Law. First critical angle is when refracted longitudinal wave reaches 90° (leaving only shear waves in the steel). Second critical angle is when shear wave reaches 90° (converting to Rayleigh surface waves). Angle beam wedges (45°, 60°, 70°) are engineered between the 1st and 2nd critical angles to generate pure shear waves.',
        formula: '\\frac{\\sin \\theta_1}{v_1} = \\frac{\\sin \\theta_2}{v_2}',
        keyPointsAr: [
          'الزاوية الحرجة الأولى لإسفين البليكسيجلاس على الفولاذ ≈ 27.5°.',
          'الزاوية الحرجة الثانية لإسفين البليكسيجلاس على الفولاذ ≈ 57.5°.'
        ],
        keyPointsEn: [
          'First critical angle for acrylic on carbon steel is ~27.5°.',
          'Second critical angle for acrylic on carbon steel is ~57.5°.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'احسب مسافة الحقل القريب (Near Field N = D²·f / 4v) وتذكر أن التقييم الكمي لحجم العيب لا يمكن الاعتماد عليه داخل الحقل القريب بسبب التذبذبات الشديدة في ضغط الصوت.',
      'افصل دائماً صدى جذر اللحام الهندسي (Root Geometry Echo) عن صدى نقص الاختراق (Lack of Penetration) بحساب مسار الصوت والمسافة السطحية بدقة.'
    ],
    practicalInspectionTipsEn: [
      'Calculate near field distance (N = D²f / 4v); quantitative amplitude evaluation is unreliable inside the near zone due to sound pressure fluctuations.',
      'Differentiate geometrical root echoes from lack of penetration by rigorously calculating sound path and surface projection distance.'
    ],
    applicableCodes: ['ASME Sec V Art. 4', 'AWS D1.1 Clause 8', 'ISO 17640', 'API 1104 Sec 9']
  },
  {
    id: 'sci-radiation-physics-decay',
    category: 'physics_science',
    categoryTitleAr: 'فيزياء وعلوم الاختبارات غير الإتلافية',
    categoryTitleEn: 'Physics & Science of NDT',
    titleAr: 'فيزياء الإشعاع وتوليد الأشعة السينية والنظائر المشعة (X-Ray & Gamma)',
    titleEn: 'Radiation Physics, X-Ray Generation & Radioisotopes (Gamma)',
    summaryAr: 'طبيعة الأشعة الكهرومغناطيسية المؤينة، أنبوب الأشعة السينية، طاقة وتلاشي النظائر (Ir-192, Co-60, Se-75)، وقوانين التوهين والتربيع العكسي.',
    summaryEn: 'Physics of ionizing electromagnetic radiation, X-ray generation, gamma isotope decay, Beer-Lambert attenuation, and the Inverse Square Law.',
    badge: 'Radiation Physics',
    readTimeMin: 15,
    tags: ['Radiography', 'RT', 'X-Ray', 'Gamma', 'Inverse Square Law', 'Safety'],
    sections: [
      {
        headingAr: 'توليد الأشعة السينية (X-Ray Generation)',
        headingEn: 'X-Ray Generation Mechanics',
        contentAr: 'تتولد الأشعة السينية عند اصطدام إلكترونات عالية السرعة منبعثة من مهبط مسخن (Cathode) بمصعد من مادة ذات عدد ذري مرتفع كالتنجستن (Tungsten Anode). ينتج عن هذا الاصطدام نوعان من الإشعاع:\n1. إشعاع الكبح (Bremsstrahlung / Braking Radiation): ينتج عند تباطؤ الإلكترونات بالقرب من نواة ذرة التنجستن، ويشكل الطيف المستمر للأشعة السينية (Continuous Spectrum).\n2. الإشعاع المميز (Characteristic Radiation): ينتج عند اقتلاع إلكترون من المدارات الداخلية (مثل K-Shell) وهبوط إلكترون من مدار أعلى لشغل الفراغ، مما يطلق فوتوناً بطاقة محددة تميز عنصر الهدف.',
        contentEn: 'X-rays are generated when high-energy electrons accelerated from a heated cathode filament bombard a refractory tungsten anode. Two radiation types emerge:\n1. Bremsstrahlung (Continuous spectrum): Generated as incoming electrons are decelerated by the electric field of tungsten nuclei.\n2. Characteristic X-rays: Produced when an incoming electron ejects an inner-shell electron (K-shell), and an outer electron drops in, emitting a photon of precise elemental energy.',
        keyPointsAr: [
          'جهد الأنبوب بالكيلوفولت (kVp) يتحكم في طاقة وقدرة اختراق الأشعة (Radiation Quality).',
          'تيار الأنبوب بالميلي أمبير وزمن التعريض (mA · s) يتحكمان في كمية وكثافة الفوتونات المنبعثة (Radiation Quantity).'
        ],
        keyPointsEn: [
          'Tube voltage (kVp) dictates photon energy and penetrating power (Radiation Quality).',
          'Tube current and exposure time (mAs) control photon flux and beam intensity (Radiation Quantity).'
        ]
      },
      {
        headingAr: 'النظائر المشعة الصناعية وخصائصها (Gamma Ray Isotopes)',
        headingEn: 'Industrial Radioisotopes and Properties',
        contentAr: 'تنتج أشعة جاما عن التحلل التلقائي لنواة ذرات النظائر المشعة غير المستقرة. النظائر الأكثر استخداماً في الفحص الصناعي:\n1. إيريديوم 192 (Ir-192): عمر النصف 73.8 يوماً، طاقة الفوتونات 0.31 - 0.61 MeV، مثالي لسمك الفولاذ بين 12 و65 مم. ثابت الجرعة RHM = 0.48 R/h عند متر لكل كوري.\n2. كوبالت 60 (Co-60): عمر النصف 5.27 سنة، طاقة فوتونات عالية جداً (1.17 و1.33 MeV)، يستخدم للأجزاء السميكة جداً من 50 إلى 200 مم. ثابت الجرعة RHM = 1.30 R/h.\n3. سيلينيوم 75 (Se-75): عمر النصف 119.8 يوماً، طاقة منخفضة إلى متوسطة (0.066 - 0.40 MeV)، ممتاز للأنابيب الرقيقة والصلب الأوستنيتي من 4 إلى 30 مم.',
        contentEn: 'Gamma rays are emitted from unstable atomic nuclei undergoing radioactive decay. Core industrial isotopes:\n1. Iridium-192 (Ir-192): Half-life 73.8 days; photon energy 0.31-0.61 MeV; steel range 12-65mm; RHM = 0.48 R/h at 1m per Ci.\n2. Cobalt-60 (Co-60): Half-life 5.27 years; high energy 1.17 & 1.33 MeV; steel range 50-200mm; RHM = 1.30 R/h.\n3. Selenium-75 (Se-75): Half-life 119.8 days; soft-to-medium energy 0.066-0.40 MeV; ideal for thin-wall piping 4-30mm.',
        formula: 'A_t = A_0 \\cdot e^{-\\lambda t} = A_0 \\cdot (0.5)^{t / T_{1/2}}',
        keyPointsAr: [
          'النشاط الإشعاعي يقاس بالكوري (Curie Ci) أو البيكرل (Becquerel Bq حيث 1 Ci = 3.7 × 10^10 Bq).',
          'عمر النصف T1/2 هو الزمن اللازم لتناقص النشاط الإشعاعي إلى النصف.'
        ],
        keyPointsEn: [
          'Activity is measured in Curies (Ci) or Becquerels (Bq, 1 Ci = 37 GBq).',
          'Half-life T1/2 is the elapsed time for source activity to decay by 50%.'
        ]
      },
      {
        headingAr: 'قوانين التوهين والتربيع العكسي وعدم الحدة الهندسية',
        headingEn: 'Attenuation Laws, Inverse Square & Geometric Unsharpness',
        contentAr: 'تخضع شدة الإشعاع لقانون بير-لامبرت (Beer-Lambert Law) حيث تتناقص الشدة أسياً مع السمك، وقيمة النصف (HVL) هي سمك المادة الذي يقلل شدة الإشعاع إلى النصف (HVL للفولاذ مع الإيريديوم-192 ≈ 12.5 مم). وقانون التربيع العكسي ينص على أن شدة الإشعاع تتناسب عكسياً مع مربع المسافة من المصدر.\nكما تحسب عدم الحدة الهندسية (Geometric Unsharpness Ug) من حاصل ضرب حجم البؤرة F في المسافة بين الجسم والفيلم d مقسوماً على مسافة المصدر من الجسم D.',
        contentEn: 'Radiation intensity attenuates exponentially per Beer-Lambert law. Half-Value Layer (HVL) is the absorber thickness reducing intensity by 50% (~12.5 mm steel for Ir-192). The Inverse Square Law states intensity drops inversely with distance squared. Geometric unsharpness Ug governs boundary penumbra blur.',
        formula: 'I = I_0 \\cdot e^{-\\mu x}, \\quad \\frac{I_1}{I_2} = \\frac{d_2^2}{d_1^2}, \\quad U_g = \\frac{F \\cdot d}{D}',
        keyPointsAr: [
          'قيمة العُشر (TVL) هي السمك اللازم لتخفيض الإشعاع إلى 10% (TVL = 3.32 × HVL).',
          'الحد الأقصى المسموح لعدم الحدة الهندسية Ug في ASME Sec V هو 0.51 مم للسمك أقل من 50 مم.'
        ],
        keyPointsEn: [
          'Tenth-Value Layer (TVL) reduces radiation to 10% (TVL = 3.32 × HVL).',
          'ASME Sec V limits maximum geometric unsharpness Ug to 0.51mm (0.020 in) for thickness under 50mm.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'طبق قاعدة الأمان الذهبية: الزمن (Time)، المسافة (Distance)، التدريع (Shielding) لتقليل الجرعة الإشعاعية التراكمية طبقاً لمبدأ ALARA.',
      'تأكد من استخدام سلك مؤشر جودة الصورة (IQI Wire) المناسب للسمك، وظهور السلك المطلوب بكثافة بصرية بين 1.8 و4.0 على الفيلم طبقاً لـ ASME Sec V Art. 2.'
    ],
    practicalInspectionTipsEn: [
      'Enforce the radiation safety triad: Time, Distance, and Shielding to keep personal exposure As Low As Reasonably Achievable (ALARA).',
      'Verify designated essential IQI wire is visible and radiographic film optical density is within 1.8 to 4.0 per ASME Sec V Art. 2.'
    ],
    applicableCodes: ['ASME Sec V Art. 2', 'ISO 17636-1/2', 'AWS D1.1 Clause 8', '10 CFR Part 34']
  },
  {
    id: 'sci-light-optics-vision',
    category: 'physics_science',
    categoryTitleAr: 'فيزياء وعلوم الاختبارات غير الإتلافية',
    categoryTitleEn: 'Physics & Science of NDT',
    titleAr: 'فيزياء الضوء والبصريات وحدّة الإبصار في الفحص البصري VT',
    titleEn: 'Light, Optical Physics & Visual Acuity in Visual Testing (VT)',
    summaryAr: 'مستويات الإضاءة المطلوبة (لوكس وشمعة/قدم)، الإضاءة المائلة لكشف الشروخ، حدة الإبصار Snellen وJaeger، واختبار عمى الألوان.',
    summaryEn: 'Required illuminance levels (Lux and Foot-candles), grazing angle lighting, visual acuity (Jaeger J1/J2), and Ishihara color testing.',
    badge: 'Light & Optics',
    readTimeMin: 10,
    tags: ['Visual Testing', 'VT', 'Lighting', 'Lux', 'Vision Acuity', 'Jaeger'],
    sections: [
      {
        headingAr: 'القياس الضوئي والإضاءة الدنيا في موقع الفحص',
        headingEn: 'Photometry and Minimum Illuminance Standards',
        contentAr: 'يعتمد الفحص البصري الهندسي على جودة الإضاءة وخط النظر. وحدة شدة الإضاءة هي اللوكس (Lux) أو الشمعة-قدم (Foot-candle حيث 1 fc ≈ 10.76 Lux). تشترط المواصفات القياسية (ASME Section V Art. 9 وAWS D1.1) ألا تقل شدة الإضاءة على السطح المفحوص عن 1000 لوكس (100 foot-candles) للفحوص الدقيقة والحرجة، وتسمح بحد أدنى 500 لوكس للفحوصات العامة. يجب معايرة مقياس شدة الضوء (Light Meter) سنوياً على الأقل.',
        contentEn: 'Visual testing depends on lighting quality and line of sight. Illuminance is measured in Lux or Foot-candles (1 fc ~10.76 Lux). ASME Sec V Art. 9 and AWS D1.1 require minimum 1000 Lux (100 fc) on the inspection surface for critical evaluation, and minimum 500 Lux for general work. Light meters require annual calibration.',
        keyPointsAr: [
          'زاوية النظر: يجب ألا تقل زاوية رؤية المفتش عن السطح عن 30 درجة.',
          'مسافة الفحص: يجب ألا تزيد مسافة العين عن السطح المفحوص عن 600 مم (24 بوصة).',
          'الإضاءة المائلة (Grazing Angle Lighting): تسليط الضوء بزاوية حادة (5° إلى 25°) يبرز التضاريس والخدوش والشروخ الدقيقة بفضل الظلال المتكونة.'
        ],
        keyPointsEn: [
          'Viewing angle must not be less than 30° to the examination surface.',
          'Maximum viewing distance must not exceed 600 mm (24 inches).',
          'Glancing / oblique lighting (5° to 25°) reveals tight cracks by creating distinct shadow relief.'
        ]
      },
      {
        headingAr: 'متطلبات حدة الإبصار والتأهيل الطبي للمفتشين',
        headingEn: 'Visual Acuity and Medical Qualification',
        contentAr: 'تشترط معايير ASNT SNT-TC-1A وISO 9712 اجتياز مفتش الاختبارات غير الإتلافية لاختبارات سنوية لحدة الإبصار القريب (Near Vision Acuity) باستخدام لوحة جاجر (Jaeger J1 أو J2 على مسافة لا تقل عن 12 بوصة) أو مكافئاتها بنظارة أو بدونها. كما تشترط فحص تمييز الألوان (Color Contrast & Discrimination) كل 3 إلى 5 سنوات باستخدام لوحات إيشيهارا (Ishihara 24/38 Plates) لضمان القدرة على تمييز صبغات PT ومؤشرات MT.',
        contentEn: 'ASNT SNT-TC-1A and ISO 9712 mandate annual near-vision examination with Jaeger J1 or J2 text at >=12 inches (with or without corrective lenses). Color differentiation must be retested every 3-5 years using Ishihara pseudo-isochromatic plates to verify ability to distinguish dye penetrant indications.',
        keyPointsAr: [
          'يجب إعادة فحص الإبصار فوراً إذا شعر المفتش بأي تغير في الرؤية.',
          'المناظير البصرية (Borescopes, Fiberscopes, Videoscopes) تستخدم للفحص غير المباشر (Remote Visual Inspection - RVI) للمناطق المعزولة داخل التوربينات والمبادلات.'
        ],
        keyPointsEn: [
          'Vision must be retested immediately if the inspector experiences vision changes.',
          'Rigid and flexible borescopes / videoscopes provide Remote Visual Inspection (RVI) for heat exchanger tubes and turbine internals.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'استخدم أدوات قياس محددة ومعايرة: مقياس كامبريدج (Cambridge Gage)، ومقياس فرق المحاذاة (Hi-Lo Gage) لقياس نقص المحاذاة وارتفاع غطاء اللحام وعمق الحفر السفلي (Undercut).',
      'لا تحكم بالعين المجردة أبداً على عيب شكلي؛ استخدم المقياس وسجل القيمة بالمليمتر وراجع معيار القبول المحدد في الكود.'
    ],
    practicalInspectionTipsEn: [
      'Use calibrated mechanical gauges: Cambridge Weld Gauge and Hi-Lo Gauge to measure weld reinforcement, misalignment, and undercut depth.',
      'Never estimate defect dimensions by unassisted eye; measure in millimeters and evaluate against the governing code criteria.'
    ],
    applicableCodes: ['ASME Sec V Art. 9', 'AWS D1.1 Clause 8', 'ISO 17637', 'SNT-TC-1A / ISO 9712']
  },
  {
    id: 'sci-capillary-action-surface-tension',
    category: 'physics_science',
    categoryTitleAr: 'فيزياء وعلوم الاختبارات غير الإتلافية',
    categoryTitleEn: 'Physics & Science of NDT',
    titleAr: 'الخاصية الشعرية والتوتر السطحي في اختبار السوائل النافذة PT',
    titleEn: 'Capillary Action, Surface Tension & Contact Angle in Penetrant Testing (PT)',
    summaryAr: 'القوى الفيزيائية الحاكمة لاختراق السوائل النافذة في الشروخ السطحية، زاوية التلامس، معادلة واشبورن، ودور المظهر في سحب السائل.',
    summaryEn: 'Physics governing liquid penetrant entry into surface flaws, wetting phenomena, contact angle, Washburn’s equation, and developer blotting.',
    badge: 'Fluid Dynamics & PT',
    readTimeMin: 11,
    tags: ['PT', 'Capillary Action', 'Surface Tension', 'Wetting', 'Contact Angle', 'AMS 2644'],
    sections: [
      {
        headingAr: 'البلل وزاوية التلامس (Wetting and Contact Angle)',
        headingEn: 'Wetting Ability and Contact Angle',
        contentAr: 'تعتمد طريقة السائل النافذ PT كلياً على قدرة السائل على بلل السطح والدخول في الشقوق الدقيقة المفتوحة على السطح بفعل الخاصية الشعرية (Capillary Action). زاوية التلامس θ هي الزاوية المقاسة بين سطح السائل وسطح المعدن. لكي يعتبر السائل مبللاً ممتازاً، يجب أن تكون زاوية التلامس حادة جداً وتفضل أن تقترب من الصفر (θ < 10°). التوتر السطحي المنخفض للسائل مع طاقة سطحية عالية للمعدن النظيف يسمحان للسائل بالزحف والدخول في شروخ مجهرية يقل عرضها عن 1 ميكرومتر.',
        contentEn: 'Liquid Penetrant Testing relies on a fluid’s capability to wet a solid surface and enter micro-flaws via capillary action. Contact angle θ between liquid and solid determines wetting; optimal penetrants feature contact angles approaching zero (θ < 10°). Low liquid surface tension combined with high solid surface energy enables penetrant to enter cracks narrower than 1 micron.',
        formula: '\\Delta P = \\frac{2 \\gamma \\cos \\theta}{r}, \\quad l^2 = \\frac{\\gamma \\cdot r \\cdot t \\cdot \\cos \\theta}{2 \\eta}',
        keyPointsAr: [
          'معادلة واشبورن (Washburn Equation) توضح أن عمق دخول السائل l يتناسب طردياً مع التوتر السطحي γ ونصف قطر الفتحة r وزمن المكوث t، وعكسياً مع اللزوجة η.',
          'اللزوجة العالية تبطئ دخول السائل، ولذلك تتطلب الشروخ الدقيقة جداً زمناً أطول للمكوث (Dwell Time).'
        ],
        keyPointsEn: [
          'Washburn’s equation demonstrates penetration depth l increases with surface tension γ, flaw width r, and dwell time t, and decreases with viscosity η.',
          'Higher viscosity slows capillary penetration, necessitating longer dwell times for tight defects.'
        ]
      },
      {
        headingAr: 'آلية عمل المظهر (Developer Blotting Action)',
        headingEn: 'Developer Blotting Action and Indication Bleed-Out',
        contentAr: 'بعد إزالة السائل النافذ الزائد من على السطح وتجفيف القطعة، يطبق المظهر (Developer). يعمل المظهر كوسط مسامي ذي مساحات بينية دقيقة تمارس قوة شعرية عكسية تسحب السائل النافذ المحتجز داخل الشرخ إلى السطح (Blotting Effect). انتشار السائل داخل المظهر يضاعف العرض الظاهري للدلالة (Bleed-out)، مما يحول شرخاً مجهرياً غير مرئي عرضه 1 ميكرومتر إلى دلالة مرئية واضحة بعرض 1 إلى 2 مم.',
        contentEn: 'After excess penetrant removal and drying, developer is applied. The developer particles form a fine porous matrix exerting reverse capillary suction, drawing entrapped penetrant out of the defect (blotting effect). The resulting lateral bleed-out magnifies a 1-micron crack into a visible 1-2 mm indication.',
        keyPointsAr: [
          'المظهر غير المائي (Form d / Form e Nonaqueous) هو الأكثر حساسية لأن المذيب يتبخر تاركاً طبقة مسامية نشطة جداً.',
          'الطبقة السميكة جداً من المظهر تخفي الدلالات الدقيقة وتمنع ظهورها؛ يجب أن يكون الرش خفيفاً ومتجانساً كطبقة ضبابية بيضاء شفافة.'
        ],
        keyPointsEn: [
          'Nonaqueous solvent developers (Form d / e) offer maximum sensitivity as evaporating solvent leaves an exceptionally active capillary blotting layer.',
          'Excessively heavy developer masks faint indications; application should be a light, translucent uniform dusting.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'التنظيف المسبق هو أهم خطوة: الصدأ، الزيوت، الكربون، أو آثار التجليخ المسدودة تمنع السائل من دخول الشرخ وتعطي نتيجة سلبية كاذبة.',
      'في الفحص الفلوري (Type I)، تحقق دائماً من شدة الضوء الأسود UV-A: يجب ألا تقل عن 1000 µW/cm² عند مسافة 15 بوصة (38 سم)، مع إظلام للمكان يقل فيه الضوء الأبيض عن 20 لوكس.'
    ],
    practicalInspectionTipsEn: [
      'Pre-cleaning is paramount: grease, paint, scale, and smeared metal prevent penetrant entry, causing false-negative evaluations.',
      'In fluorescent testing (Type I), ensure UV-A blacklight intensity >=1000 µW/cm² at 15 inches with ambient white light kept under 20 Lux.'
    ],
    applicableCodes: ['ASME Sec V Art. 6', 'ASTM E1417', 'ASTM E165', 'ISO 3452-1', 'AMS 2644']
  },

  // ==================== 2. METHODS ENCYCLOPEDIA ====================
  {
    id: 'method-vt-comprehensive',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'الموسوعة الشاملة للفحص البصري والهندسي المباشر وغير المباشر (VT & RVI)',
    titleEn: 'Comprehensive Visual Testing (VT) & Remote Visual Inspection (RVI)',
    summaryAr: 'التقنية الأساسية الأولى في NDT: فحص الأبعاد، قراءة المحاذاة، استخدام المناظير الصلبة والمرنة (Borescopes)، وفحص الوصلات طبقا لـ AWS D1.1 وASME.',
    summaryEn: 'The primary foundation of all NDT: dimensional verification, alignment gauges, rigid/flexible borescopes, and weld acceptance per AWS D1.1 and ASME.',
    badge: 'VT Methodology',
    readTimeMin: 14,
    tags: ['VT', 'RVI', 'Borescopes', 'Welding Inspection', 'Cambridge Gauge'],
    sections: [
      {
        headingAr: 'الفحص المباشر وغير المباشر (Direct vs Remote Visual Inspection)',
        headingEn: 'Direct Visual vs Remote Visual Inspection (RVI)',
        contentAr: 'يقسم الفحص البصري إلى نوعين رئيسيين:\n1. الفحص البصري المباشر (Direct VT): يتم عندما يكون خط الرؤية متاحاً للعين بزاوية لا تقل عن 30° ومسافة لا تزيد عن 600 مم (24 بوصة).\n2. الفحص البصري غير المباشر (Remote Visual Inspection - RVI): يطبق عندما تكون الأجزاء الداخلية محصورة أو خطرة (كالريش الداخلية لتوربينات الغاز، أنابيب المبادلات الحرارية، والأوعية المغلقة). تُستخدم أدوات متقدمة تشمل:\n - المناظير الصلبة (Rigid Borescopes): عدسات زجاجية تنقل صورة عالية الدقة للأنابيب المستقيمة.\n - المناظير المرنة (Fiberscopes): ألياف بصرية كوارتزية تسمح بالتوجيه عبر المسارات المنحنية.\n - مناظير الفيديو الرقمية (Videoscopes): كاميرات دقيقة مع مستشعر CCD/CMOS وإضاءة LED وتوجيه رباعي المحاور مع قياس ثلاثي الأبعاد بالليزر (Phase Dot 3D Measurement).',
        contentEn: 'VT is categorized into two modalities:\n1. Direct Visual Inspection: Conducted when line of sight is unobstructed within 600mm (24 in) and >=30° viewing angle.\n2. Remote Visual Inspection (RVI): Deployed for inaccessible internals (gas turbine blading, boiler tubes, reactors) utilizing:\n - Rigid Borescopes: High-resolution optical train for straight cavities.\n - Fiberscopes: Flexible quartz fiber-optic bundles for tortuous conduits.\n - Videoscopes: Tip-mounted CCD/CMOS micro-sensors with articulating steering and laser 3D defect sizing.',
        keyPointsAr: [
          'يجب معايرة مقياس شدة الضوء للتأكد من توفر 1000 لوكس كحد أدنى.',
          'التقاط الصور الرقمية يجب أن يتضمن مقياس مرجعي معروف الأبعاد لتحديد الحجم الحقيقي للدلالة.'
        ],
        keyPointsEn: [
          'Calibrate photometer to ensure >=1000 Lux on inspection surfaces.',
          'Digital image capture must include calibrated optical scaling reference.'
        ]
      },
      {
        headingAr: 'أدوات القياس الميكانيكية ومعايير هندسة الوصلة',
        headingEn: 'Mechanical Gauging & Joint Geometry Criteria',
        contentAr: 'يتطلب الفحص البصري أدوات متخصصة لمعايرة أبعاد الوصلات:\n- مقياس كامبريدج (Cambridge Weld Gauge): يقاس به زاوية الشطفة، ارتفاع غطاء اللحام، عمق الحفر السفلي (Undercut)، وحجم لحام الزاوية (Fillet Weld Throat).\n- مقياس فرق المحاذاة (Hi-Lo Gauge): يقاس به الفارق في المحاذاة الداخلية بين أنبوبين قبل اللحام وبعده، وفجوة الجذر (Root Gap).\n- محددات التباين والعدسات المكبرة (Magnifiers 2x-10x): لكشف الشروخ الشعرية والخدوش السطحية.',
        contentEn: 'Mechanical gauges quantify weld profile metrics:\n- Cambridge Weld Gauge: Measures bevel prep angle, reinforcement height, undercut depth, and fillet throat.\n- Hi-Lo Gauge: Quantifies internal/external pipe wall offset and root gap spacing.\n- Optical comparators and 2x-10x magnifiers: Resolve micro-cracking and root crevices.',
        keyPointsAr: [
          'ASME B31.3 يمنع أي شرخ أو نقص انصهار أو نقص اختراق في الخدمة الدورية الشديدة (Severe Cyclic).',
          'الحفر السفلي (Undercut) المسموح به في AWS D1.1 للهياكل المحملة استاتيكياً لا يتجاوز 1 مم للسمك حتى 25 مم.'
        ],
        keyPointsEn: [
          'ASME B31.3 specifies zero allowable tolerance for cracks, LOF, or LOP in severe cyclic piping.',
          'AWS D1.1 restricts undercut depth to <=1mm for statically loaded structures up to 25mm thickness.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'نظف سطح اللحام بفرشاة سلكية من الخبث وطرطشة اللحام (Weld Spatter) قبل الحكم على المظهر؛ الطرطشة قد تعطي انطباعاً خادعاً بوجود عيوب.',
      'سجل قياسات الحفر السفلي ومحاذاة Hi-Lo في تقرير الفحص بالأرقام الملموسة وليس بكلمات وصفية عامة مثل "مقبول" أو "لحام جيد".'
    ],
    practicalInspectionTipsEn: [
      'Mechanically wire-brush interpass slag and spatter prior to visual acceptance; spatter can mask critical toe cracking.',
      'Record Hi-Lo and undercut metrics in quantitative millimeters rather than generic subjective statements.'
    ],
    applicableCodes: ['ASME Sec V Art. 9', 'AWS D1.1 Clause 8', 'ISO 17637', 'API 1104 Sec 9']
  },
  {
    id: 'method-pt-comprehensive',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'الموسوعة الشاملة لاختبار السوائل النافذة PT والتصنيف الدولي AMS 2644',
    titleEn: 'Comprehensive Liquid Penetrant Testing (PT) & AMS 2644 Standard',
    summaryAr: 'الكشف عن الشروخ السطحية المفتوحة: مقارنة السائل الفلوري والملون، الطرق الأربعة A وB وC وD، أشكال المظهر ومستويات الحساسية.',
    summaryEn: 'Surface-breaking flaw detection: Fluorescent vs Visible, Methods A through D, developer forms, sensitivity levels, and dwell parameters.',
    badge: 'PT Methodology',
    readTimeMin: 15,
    tags: ['PT', 'AMS 2644', 'Fluorescent', 'Solvent Removable', 'Water Washable'],
    sections: [
      {
        headingAr: 'تصنيف أنظمة السوائل النافذة طبقاً للمواصفة القياسية AMS 2644',
        headingEn: 'AMS 2644 / ASTM E1417 System Classifications',
        contentAr: 'تصنف السوائل النافذة هندسياً طبقاً لمواصفة الفضاء AMS 2644 إلى:\n1. النوع (Type):\n - Type I: سائل نافذ فلوري (Fluorescent) يفحص تحت الضوء فوق البنفسجي UV-A (365 nm)، وهو الأعلى حساسية عالمياً.\n - Type II: سائل نافذ ملون مرئي (Visible / Red Dye) يفحص تحت الضوء الأبيض الطبيعي.\n2. طريقة إزالة السائل الزائد (Method):\n - Method A: قابل للغسل بالماء مباشرة (Water Washable) يحتوي على مستحلب مدمج.\n - Method B: ما بعد الاستحلاب الزيتي (Post-Emulsified Lipophilic).\n - Method C: قابل للإزالة بالمذيبات العضوية (Solvent Removable) وهو الأكثر شيوعاً في الفحوصات الميدانية.\n - Method D: ما بعد الاستحلاب المائي (Post-Emulsified Hydrophilic).\n3. مستويات الحساسية للفلوري (Sensitivity Levels):\n - Level 1/2: حساسية منخفضة جداً.\n - Level 1: حساسية منخفضة.\n - Level 2: حساسية متوسطة.\n - Level 3: حساسية عالية.\n - Level 4: حساسية فائقة (Ultra-High) لأجزاء التوربينات الجوية وتطبيقات الفضاء.',
        contentEn: 'AMS 2644 categorizes penetrant systems:\n1. Type:\n - Type I: Fluorescent penetrant inspected under UV-A (365 nm); benchmark sensitivity.\n - Type II: Visible dye inspected under white light (>=1000 Lux).\n2. Removal Method:\n - Method A: Water-washable (built-in emulsifier).\n - Method B: Post-emulsified lipophilic.\n - Method C: Solvent removable (standard field inspection kit).\n - Method D: Post-emulsified hydrophilic.\n3. Fluorescent Sensitivity Levels: Level 1/2 (Ultra-low) up to Level 4 (Ultra-high for aerospace blading).',
        keyPointsAr: [
          'أشكال المظهر (Developer Forms): Form a (بودرة جافة)، Form b (قابل للذوبان بالماء)، Form c (معلق مائي)، Form d (غير مائي للملون والفلوري)، Form e (غير مائي للصبغة المرئية).',
          'درجة حرارة الفحص المعتمدة: بين 4°C و52°C (40°F إلى 125°F).'
        ],
        keyPointsEn: [
          'Developer Forms: Form a (Dry powder), b (Water soluble), c (Water suspendible), d/e (Nonaqueous solvent suspension).\nStandard temperature window: 4°C to 52°C (40°F to 125°F).'
        ]
      },
      {
        headingAr: 'الخطوات الست الإلزامية لتنفيذ اختبار PT',
        headingEn: 'The Six Mandatory Steps of PT Processing',
        contentAr: '1. التنظيف المسبق والتجفيف (Pre-cleaning & Drying): إزالة الزيوت والشحوم بالتنظيف بالمذيب ثم الانتظار حتى يجف السطح تماماً.\n2. تطبيق السائل النافذ (Penetrant Application): غمر، رش أو طلاء مع الالتزام بزمن المكوث (Dwell Time عادة بين 10 و30 دقيقة طبقاً للكود والمادة).\n3. إزالة السائل الزائد (Removal of Excess Penetrant): في الطريقة C، يُمسح الفائض بقماش نظيف وجاف أولاً، ثم بقماش مبلل قليلاً بالمذيب (يحظر رش المذيب مباشرة على السطح لمنع غسل السائل من داخل الشروخ).\n4. التجفيف (Drying): تجفيف طبيعي أو بهواء دافئ مضغوط بضغط منخفض.\n5. تطبيق المظهر (Developer Application): رش طبقة رقيقة ضبابية متجانسة وزمن مكوث للمظهر يعادل نصف زمن مكوث النافذ على الأقل (10 دقائق كحد أدنى).\n6. الفحص والتنظيف البعدي (Inspection & Post-cleaning): تقييم الدلالات فوراً ومتابعة الانتشار (Bleed-out)، ثم إزالة بقايا المظهر والنافذ لمنع تآكل المعدن.',
        contentEn: '1. Pre-cleaning & Drying: Degreasing and solvent purging of flaw throats.\n2. Penetrant Application: Spray, brush, or immerse; enforce procedure dwell time (10-30 mins).\n3. Excess Penetrant Removal: In Method C, wipe with dry lint-free cloth, followed by solvent-dampened rag. Never spray solvent directly onto workpiece.\n4. Drying: Evaporate residual surface moisture.\n5. Developer Application: Apply light, uniform translucent veil; observe minimum developer dwell.\n6. Inspection & Post-cleaning: Real-time bleed-out monitoring, followed by removal of chemical residue.',
        keyPointsAr: [
          'رش المذيب مباشرة على السطح بعد النافذ يعد خطأ جسيماً يؤدي لغسل الشرخ وفقدان العيب.',
          'الضوء الأسود UV-A: شدة >= 1000 µW/cm² مع ضوء محيطي أبيض يقل عن 20 لوكس.'
        ],
        keyPointsEn: [
          'Spraying solvent directly onto the test surface flushes penetrant out of cracks, causing catastrophic false-negatives.',
          'UV-A intensity must exceed 1000 µW/cm² at 15 inches with ambient white light < 20 Lux.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'تجنب تجليخ السطح المفرط بقرص خشن قبل PT؛ التجليخ يشوه الحواف المعدنية ويسد فتحات الشروخ (Metal Smearing) مما يمنع دخول النافذ، ويفضل الحت الكيميائي (Etching) إذا لزم الأمر.',
      'في الفحص الفلوري، انتظر دقيقتين على الأقل في الغرفة المظلمة لتتكيف عيناك مع الظلام قبل فحص القطعة.'
    ],
    practicalInspectionTipsEn: [
      'Aggressive grinding causes metal smearing across defect orifices; chemical etching is required if smearing is suspected.',
      'Allow minimum 2-minute dark adaptation in the inspection booth before evaluating fluorescent indications.'
    ],
    applicableCodes: ['ASME Sec V Art. 6', 'ASTM E1417', 'ASTM E165', 'ISO 3452', 'AMS 2644']
  },
  {
    id: 'method-mt-comprehensive',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'الموسوعة الشاملة لاختبار الجسيمات المغناطيسية MT والمغنطة المزدوجة',
    titleEn: 'Comprehensive Magnetic Particle Testing (MT) & Magnetization Techniques',
    summaryAr: 'الكشف عن الشروخ السطحية وتحت السطحية في المواد الحديدية: الحقل الدائري والطولي، التيار المتناوب AC والمستمر DC، أدوات القياس، وإزالة المغنطة.',
    summaryEn: 'Surface and subsurface flaw detection in ferromagnetic steels: Circular vs longitudinal fields, AC vs DC, field indicators (QQI), and demagnetization.',
    badge: 'MT Methodology',
    readTimeMin: 16,
    tags: ['MT', 'Magnetic Particle', 'Yoke', 'AC vs DC', 'QQI', 'Demagnetization'],
    sections: [
      {
        headingAr: 'أنماط المغنطة واتجاهات خطوط الفيض (Circular vs Longitudinal Fields)',
        headingEn: 'Magnetization Modes: Circular and Longitudinal Fields',
        contentAr: 'شرط كشف العيب في MT هو أن تقطع خطوط الفيض المغناطيسي مستوى الشرخ بزاوية تقترب من 90° (على الأقل بين 45° و90°).\n1. المغنطة الدائرية (Circular Magnetization): تدور خطوط الفيض المغناطيسي في مسارات دائرية مغلقة داخل القطعة دون تكوين أقطاب خارجية. تُولد باستخدام:\n - إمرار التيار المباشر (Head Shot) بين ملامسين.\n - الموصل المركزي (Central Conductor): إمرار شريط نحاسي في تجويف الأنبوب لفحص السطحين الداخلي والخارجي دون حرق السطح.\n - الأقطاب الموضعية (Prods).\n2. المغنطة الطولية (Longitudinal Magnetization): تسير خطوط الفيض موازية للمحور الطولي للقطعة وتخرج لتشكل أقطاباً شمالية وجنوبية. تُولد باستخدام:\n - الملف المغناطيسي (Coil / Cable Wrap).\n - الذراع الكهرومغناطيسي (Electromagnetic Yoke).',
        contentEn: 'Flaw detection requires magnetic flux lines to intersect the flaw plane at 45° to 90°:\n1. Circular Magnetization: Flux forms concentric loops inside the conductor without external poles. Generated via:\n - Direct contact head shot.\n - Central Conductor: Copper bar through hollow bores to test ID/OD without arc strikes.\n - Portable contact prods.\n2. Longitudinal Magnetization: Flux runs parallel to the axis with distinct North and South poles. Generated via:\n - Encircling coils or cable wraps.\n - Electromagnetic AC/DC yokes.',
        keyPointsAr: [
          'يجب مغنطة كل منطقة في اتجاهين متعامدين (على الأقل بزاوية 90°) لضمان كشف الشروخ الطولية والعرضية.',
          'التيار المتناوب (AC) ممتاز للسطح بفضل التأثير الجلدي؛ بينما التيار المقوم نصف موجة (HWAC) والتيار المستمر (DC) يخترقان حتى عمق 6 مم تحت السطح.'
        ],
        keyPointsEn: [
          'Every component must be magnetized in two orthogonal directions (90° offset) to detect all crack orientations.',
          'AC concentrates on the outer skin; Half-Wave Rectified AC (HWAC) and DC provide deep subsurface penetration up to 6mm.'
        ]
      },
      {
        headingAr: 'التحقق من كفاية المجال وإزالة المغنطة (Field Adequacy & Demagnetization)',
        headingEn: 'Field Verification & Demagnetization Protocol',
        contentAr: '1. التحقق من كفاية المجال المغناطيسي:\n - رقائق QQI (Quantitative Quality Indicators): رقائق معدنية رقيقة تحتوي على عيوب اصطناعية تلصق على القطعة للتحقق من شدة واتجاه المجال.\n - مقياس الكعكة (Pie Gauge): قرص نحاسي مقسم لـ 8 قطاعات حديدية يوضع على السطح.\n - مقياس تدرج المجال المغناطيسي (Hall-Effect Tangential Field Meter): يقيس شدة المجال بالجاوس (المطلوب 30 إلى 60 Gauss).\n2. إزالة المغنطة (Demagnetization):\nتصبح إزالة المغنطة إلزامية عند لحام القطعة لاحقاً لمنع ظاهرة انحراف القوس الكهربي (Arc Blow)، أو في الأجزاء الدوارة والمحامل لمنع التصاق برادة الحديد وتلف المحامل. يتم تطبيق مجال متناوب متناقص تدريجياً بسحب القطعة ببطء من داخل ملف AC نشط حتى مسافة مترين على الأقل.',
        contentEn: '1. Field Adequacy Verification:\n - QQI Shims: Miniature foils with artificial flaws taped to the surface under active field.\n - Pie Gauge: 8-pie segmented copper-faced flux indicator.\n - Hall-effect Gaussmeter: Verifies 30 to 60 Gauss tangential field strength.\n2. Demagnetization:\nMandatory prior to subsequent welding to prevent magnetic arc blow, or on rotating machinery to prevent metallic wear debris adhesion. Achieved by subjecting the component to a reversing, decaying AC field (withdrawing through an AC coil >=2 meters).',
        keyPointsAr: [
          'الحد الأقصى للمغناطيسية المتبقية بعد إزالة المغنطة عادة يقل عن 3 Gauss طبقاً لمعظم المواصفات.',
          'اختبار رفع الوزن للذراع (Yoke Lift Test): 4.5 كجم (10 lbs) للتيار المتناوب AC، و18 كجم (40 lbs) للتيار المستمر DC.'
        ],
        keyPointsEn: [
          'Residual magnetism after demagnetization must typically fall below 3 Gauss per API and ASME.',
          'Yoke dead-weight lift requirement: 4.5 kg (10 lbs) for AC, and 18 kg (40 lbs) for DC.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'تجنب حدوث شرر كهربي (Arc Strikes) عند استخدام الأقطاب (Prods) على الأنابيب عالية الضغط لأن الشرر يخلق بقع تصلد موضعية تؤدي لتشقق سريع.',
      'في فحص الوصلات الملحومة بالذراع AC Yoke، حرك الذراع بزاوية 45° في الاتجاه الأول ثم بزاوية -45° في الاتجاه الثاني لضمان تغطية شروخ الجذر وأصابع اللحام المتعامدة.'
    ],
    practicalInspectionTipsEn: [
      'Avoid prod arc strikes on pressure piping; copper contamination and localized quenching create micro-martensitic crack sites.',
      'Orient AC yokes at +45° and -45° across the weld axis to reliably intersect both longitudinal and transverse toe cracks.'
    ],
    applicableCodes: ['ASME Sec V Art. 7', 'ASTM E1444', 'ASTM E709', 'API 1104', 'ISO 9934']
  },
  {
    id: 'method-ut-comprehensive',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'الموسوعة الشاملة لاختبار الموجات فوق الصوتية UT ومعايرة A-Scan وDAC وDGS',
    titleEn: 'Comprehensive Ultrasonic Testing (UT): Calibration, DAC Curves & DGS Sizing',
    summaryAr: 'الفحص بالموجات فوق الصوتية التقليدية والمتقدمة: المحولات الكهروضغطية، قوالب المعايرة IIW V1/V2، منحنيات DAC وTCG وDGS، وقياس سمك الجدران.',
    summaryEn: 'Ultrasonic testing fundamentals: Piezoelectric crystals, IIW V1/V2 calibration blocks, DAC/TCG/DGS sizing methodologies, and precision thickness gauging.',
    badge: 'UT Methodology',
    readTimeMin: 18,
    tags: ['UT', 'Ultrasonics', 'A-Scan', 'DAC', 'DGS', 'Calibration Blocks'],
    sections: [
      {
        headingAr: 'المحولات الكهروضغطية وبنية المسبار (Piezoelectric Transducers)',
        headingEn: 'Piezoelectric Effect and Transducer Construction',
        contentAr: 'تعتمد مسابر UT على خاصية الكهروإجهادية (Piezoelectricity) في بلورات تيتانات زركونات الرصاص (PZT) أو المركبات البلورية (Piezocomposites). عند تطبيق نبضة جهد كهربي عالي التردد تتمدد البلورة وتنكمش لتولد موجات صوتية؛ وعند عودة الصدى المرتد من العيب تنضغط البلورة مولدة إشارة كهربية ميكروية تظهر على شاشة A-Scan كارتفاع في سعة الإشارة (Amplitude).\nتتكون وحدة المسبار من:\n1. العنصر الفعال (Active Element) بقطر D وتردد رنيني f.\n2. مادة التخميد الخلفية (Backing Material): تمنع تذبذب البلورة الحر للحصول على نبضة قصيرة ذات قدرة تمييز عالية (Resolution).\n3. طبقة التوافق الأمامية (Matching Layer): تحسن انتقال الطاقة الصوتية بين البلورة والوسط الخارجي.',
        contentEn: 'UT probes operate via the piezoelectric effect using Lead Zirconate Titanate (PZT) or 1-3 piezocomposites. High-voltage electrical pulses cause cyclic crystal expansion, transmitting sound; returning echo pressure generates micro-voltages displayed as A-scan amplitude peaks.\nProbe assembly components:\n1. Active element with diameter D and resonant frequency f.\n2. Backing material to damp crystal ringing, generating short pulses for high near-surface resolution.\n3. Acoustic matching layer optimizing impedance transfer into couplants.',
        formula: 'f_0 = \\frac{v}{2 \\cdot t_{crystal}}',
        keyPointsAr: [
          'سمك البلورة يساوي نصف الطول الموجي للصوت داخل مادة البلورة (t = v / 2f).',
          'المسابر المزدوجة (Dual Element / TR): تحتوي على بلورتين منفصلتين (إحداهما مرسلة والأخرى مستقبلة) مفصولتين بحاجز صوتي، وهي الخيار الأفضل لقياس السمك وكشف التآكل تحت السطحي القريب دون منطقة ميتة (Dead Zone).'
        ],
        keyPointsEn: [
          'Crystal thickness equals half acoustic wavelength within the piezoelectric material (t = v / 2f).',
          'Dual element (TR) probes house separate transmit and receive elements isolated by an acoustic barrier, eliminating dead zones for near-surface corrosion.'
        ]
      },
      {
        headingAr: 'معايرة الأجهزة وقوالب المعايرة القياسية (IIW V1 & V2 Blocks)',
        headingEn: 'Instrument Standardization & IIW Calibration Blocks',
        contentAr: 'تتم معايرة جهاز UT قبل أي فحص على ثلاثة محاور:\n1. معايرة مدى السرعة وتأخير المسبار (Velocity & Zero Delay): لضبط دقة قياس المسافة والسمك.\n2. تعيين نقطة خروج الحزمة (Probe Index Point) وزاوية الانكسار الفعلية للمسبار الزاوي باستخدام قوس نصف القطر 100 مم في قالب IIW Type 1 (V1) أو قوس 25/50 مم في قالب IIW Type 2 (V2).\n3. معايرة الحساسية ومنحنى تصحيح السعة مع المسافة (DAC - Distance Amplitude Correction):\nتنخفض سعة الصدى مع زيادة مسافة انتشار الصوت بفعل التوهين وتشتت الحزمة. يُرسم منحنى DAC بتسجيل قمم الصدى القادمة من ثقوب حفر جانبية متطابقة (Side-Drilled Holes - SDH) على أعماق مختلفة (مثلاً 1/4T, 1/2T, 3/4T) لربط سعة العيب بنسبة مئوية من المنحنى المرجعي (مثلاً 100% DAC أو 50% DAC).',
        contentEn: 'UT instruments require three-axis standardization:\n1. Sound velocity & zero delay calibration for precise digital distance readout.\n2. Beam index point & actual refracted angle verification using the 100mm radius on IIW Type 1 (V1) or 25/50mm radius on IIW Type 2 (V2) blocks.\n3. Sensitivity calibration via Distance Amplitude Correction (DAC):\nSound amplitude attenuates and spreads with distance. A DAC curve connects echo peaks from identical Side-Drilled Holes (SDH) at 1/4T, 1/2T, and 3/4T depths, establishing a distance-compensated evaluation reference.',
        keyPointsAr: [
          'منحنى TCG (Time Corrected Gain) هو المكافئ الإلكتروني لـ DAC، حيث يتم رفع تكبير الجهاز تدريجياً مع الزمن لتظهر كل العيوب المرجعية بنفس الارتفاع على الشاشة (مثلاً 80% FSH).',
          'طريقة DGS / AVG الألمانية: تربط سعة الصدى بمخطط نظري مكافئ لعاكس قرصي مستوٍ (Flat Bottom Hole - FBH) دون الحاجة لرسم DAC يدوياً.'
        ],
        keyPointsEn: [
          'Time Corrected Gain (TCG) electronically amplifies deep signals, displaying equal-sized reference reflectors at uniform screen height (e.g., 80% FSH).',
          'The DGS/AVG diagram correlates flaw amplitude directly to an Equivalent Flat-Bottomed Hole (FBH) disk diameter without physical multi-hole calibration.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'احسب مسار تخطي الحزمة (Skip Distance = 2 · t · tan θ) ومسار الصوت لكل رجل (Leg 1 & Leg 2) قبل فحص اللحام لمعرفة مكان سقوط الحزمة في الشطفة بدقة.',
      'استخدم تقنية هبوط الـ 6 ديسيبل (-6 dB Drop Technique) لتعيين أطراف ونهايات العيوب ذات الامتداد الخطي الأكبر من عرض الحزمة.'
    ],
    practicalInspectionTipsEn: [
      'Calculate surface skip distance (2 · t · tan θ) and leg sound paths prior to weld scanning to map beam coverage against weld bevels.',
      'Deploy the -6 dB amplitude drop method to establish physical termination boundaries of extended planar flaws exceeding beam width.'
    ],
    applicableCodes: ['ASME Sec V Art. 4', 'AWS D1.1 Clause 8', 'ISO 17640', 'API 1104 Sec 9']
  },
  {
    id: 'method-rt-comprehensive',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'الموسوعة الشاملة للتصوير الإشعاعي الصناعي RT وتفسير الأفلام والرقمي',
    titleEn: 'Comprehensive Radiographic Testing (RT): Film Interpretation & Digital DR',
    summaryAr: 'التصوير بالأشعة السينية وأشعة جاما، تكوين الصورة، الكثافة الضوئية، مؤشرات جودة الصورة IQI، التصوير الرقمي CR وDDA، وقراءة عيوب اللحام.',
    summaryEn: 'X-ray and gamma radiography: Image formation, film optical density, IQI penetrameters, digital phosphor plates (CR) and flat panels (DDA), and weld film reading.',
    badge: 'RT Methodology',
    readTimeMin: 18,
    tags: ['RT', 'Radiography', 'Film Reading', 'IQI', 'Digital Radiography', 'CR/DDA'],
    sections: [
      {
        headingAr: 'تكوين الصورة والكثافة الضوئية (Optical Density & Screens)',
        headingEn: 'Radiographic Film Formation & Optical Density',
        contentAr: 'يسجل فيلم الأشعة الفارق في امتصاص الإشعاع عبر المادة:\n1. بنية الفيلم الإشعاعي: قاعدة بوليستر مرنة مطلية على الوجهين بمستحلب حساس يحتوي على حبيبات هاليد الفضة (Silver Halide). عند سقوط الفوتونات تتكون صورة كامنة (Latent Image) تظهر بالتحميض الكيميائي.\n2. الكثافة الضوئية (Optical Density - D): تعبر عن درجة سواد الفيلم وتقاس بمقياس الكثافة (Densitometer):\n D = log10 (I0 / It)\nحيث تشترط ASME Sec V أن تقع الكثافة على اللحام بين 1.8 و4.0 لأشعة X-Ray، وبين 2.0 و4.0 لأشعة جاما Gamma Ray.\n3. رقائق الرصاص المقوية (Lead Screens): توضع رقائق رصاصية (Front Screen 0.125 mm وBack Screen 0.125-0.25 mm) ملامسة للفيلم. تمتص الرقائق الإشعاع المشتت منخفض الطاقة وتطلق إلكترونات كهروضوئية ثانوية تضاعف سرعة الفيلم وتباين الصورة.',
        contentEn: 'Radiographic film maps differential attenuation:\n1. Film structure: Polyester base double-coated with silver halide emulsion forming latent images resolved during chemical development.\n2. Optical Density D = log10(I0/It): ASME Sec V mandates transmitted film density between 1.8 and 4.0 for X-ray, and 2.0 to 4.0 for gamma sources.\n3. Lead Intensifying Screens: 0.125mm front and back lead foils absorb soft scatter and emit secondary photoelectrons, sharpening contrast and reducing exposure time.',
        formula: 'D = \\log_{10}\\left(\\frac{I_0}{I_t}\\right)',
        keyPointsAr: [
          'التباين الإشعاعي (Radiographic Contrast) يعتمد على تدرج الفيلم وفرق الامتصاص بين العيب والمعدن السليم.',
          'الرقائق الرصاصية الخلفية توضع خلفها شفرة حرف B رصاصية للتأكد من عدم وجود إشعاع خلفي مشتت (Backscatter) على الفيلم.'
        ],
        keyPointsEn: [
          'Radiographic contrast relies on film gradient and differential absorption between defect void and sound parent metal.',
          'A lead letter "B" mounted on film holder backs confirms absence of fogging backscatter.'
        ]
      },
      {
        headingAr: 'مؤشرات جودة الصورة (IQI / Penetrameters) والتصوير الرقمي',
        headingEn: 'Image Quality Indicators (IQI) and Digital Modalities',
        contentAr: '1. مؤشرات جودة الصورة (IQI):\n - نوع الأسلاك (Wire Type per ASTM E747 / ISO 19232-1): مجموعة من 6 أسلاك بأقطار متدرجة موضوعة داخل غلاف بلاستيكي. يشترط الكود ظهور "السلك الأساسي" (Essential Wire) عبر منطقة اللحام بكثافة موثقة لإثبات حساسية الصورة (غالباً 2%).\n - نوع الثقوب (Hole Type per ASTM E1025): صفيحة معدنية بسمك 2% من سمك العينة بها ثلاثة ثقوب (1T, 2T, 4T).\n2. التصوير الإشعاعي الرقمي الحديث:\n - الأشعة المحوسبة (Computed Radiography - CR): استخدام ألواح فوسفورية قابلة لإعادة الاستخدام تخزن الطاقة ثم تمسح بماسح ليزري رقمي.\n - مصفوفات الكواشف الرقمية المباشرة (Direct Digital Radiography - DDA / Flat Panel Detectors): تحويل فوتونات الأشعة مباشرة إلى إشارات رقمية فورية دون حاجة للتحميض الكيميائي مع قدرة ديناميكية عالية (16-bit Gray Scale).',
        contentEn: '1. Image Quality Indicators (IQI):\n - Wire IQIs (ASTM E747 / ISO 19232-1): Encapsulated graded wires. Acceptance mandates the "Essential Wire" be clearly discernible across the weld (typically 2% sensitivity).\n - Hole-type plaques (ASTM E1025): 2% thickness plates with 1T, 2T, 4T calibrated apertures.\n2. Digital Radiography Modalities:\n - Computed Radiography (CR): Photostimulable phosphor plates scanned via laser digitizer.\n - Direct Digital Arrays (DDA): Solid-state flat panel detectors providing instant, high-dynamic-range (16-bit) radioscopic image acquisition without chemistry.',
        keyPointsAr: [
          'ظهور السلك المطلوب على الفيلم لا يثبت خلو الوصلة من الشروخ؛ بل يثبت فقط أن جودة التصوير وحساسيته مستوفية لمعايير الكود.',
          'التحول الرقمي لـ DDA يلغي استهلاك أفلام الفضة ومواد التحميض الكيميائية الخطرة ويوفر أرشيفاً رقمياً مشفراً طبقاً لمعيار DICONDE.'
        ],
        keyPointsEn: [
          'Visible essential IQI wire certifies imaging technique quality, not total absence of discontinuities.',
          'Digital DDA systems eliminate silver halide film and toxic chemistry, archiving inspections under the DICONDE open medical/NDT standard.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'تأكد من وضع حرف "B" الرصاصي خلف كل كاسيت فيلم؛ إذا ظهر ظل فاتح للحرف B على الفيلم المحمض، فإن الفيلم مرفوض بسبب التشتت الخلفي (Backscatter) ويجب إعادة التصوير مع تدريع رصاصي إضافي.',
      'افحص عيوب اللحام على شاشة فحص الأفلام المضيئة (Film Illuminator / Viewer) بشدة إضاءة معتمدة ومعايرة تكفي لاختراق الكثافة البصرية للفيلم.'
    ],
    practicalInspectionTipsEn: [
      'Verify a lead "B" letter is taped to the back of every cassette; if a light "B" image appears on the developed radiograph, backscatter invalidates the exposure.',
      'Interpret films using variable high-intensity viewers calibrated to penetrate optical densities up to 4.0.'
    ],
    applicableCodes: ['ASME Sec V Art. 2', 'ASTM E1742', 'ISO 17636-1/2', 'AWS D1.1', 'API 1104']
  },
  {
    id: 'method-et-comprehensive',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'الموسوعة الشاملة لاختبار التيارات الدوامية ET ومستوى الممانعة المركبة',
    titleEn: 'Comprehensive Eddy Current Testing (ET) & Impedance Plane Analysis',
    summaryAr: 'الحث الكهرومغناطيسي، التأثير الجلدي، عمق الاختراق القياسي، مستوى الممانعة (R وXL)، مسابر الأنابيب الداخلية (Bobbin Probes)، وفرز السبائك.',
    summaryEn: 'Electromagnetic induction, skin effect, standard depth of penetration, impedance plane display, heat exchanger tube bobbin probes, and alloy sorting.',
    badge: 'ET Methodology',
    readTimeMin: 15,
    tags: ['ET', 'Eddy Current', 'Impedance Plane', 'Skin Effect', 'Tubing Inspection', 'Conductivity'],
    sections: [
      {
        headingAr: 'الحث الكهرومغناطيسي والتأثير الجلدي (Skin Effect)',
        headingEn: 'Electromagnetic Induction and Skin Effect',
        contentAr: 'عند إمرار تيار متناوب في ملف اختبار، يتولد مجال مغناطيسي أولي متغير. عند تقريب الملف من مادة موصلة للكهرباء، يولد هذا المجال تيارات كهربية دائرية مقفلة داخل المادة تسمى التيارات الدوامية (Eddy Currents) طبقاً لقانون فاراداي. تولد هذه التيارات مجالاً مغناطيسياً ثانوياً يعاكس المجال الأصلي طبقاً لقانون لينز، مما يغير ممانعة الملف الكلية (Impedance Z).\nبفعل التأثير الجلدي (Skin Effect)، تتركز التيارات الدوامية بأعلى كثافة على السطح الخارجي المقابل للملف وتتناقص أسياً مع العمق. عمق الاختراق القياسي (Standard Depth of Penetration - δ) هو العمق الذي تنخفض عنده كثافة التيارات إلى 37% (1/e) من قيمتها السطحية.',
        contentEn: 'Alternating current through an inspection coil establishes a primary alternating magnetic field. In proximity to a conductive specimen, this field induces closed circular loops of eddy currents per Faraday’s Law. These currents generate a secondary opposing magnetic field per Lenz’s Law, altering coil impedance Z.\nDue to the skin effect, eddy currents concentrate at the outer boundary and decay exponentially into the depth. The Standard Depth of Penetration δ is where current density drops to 37% (1/e) of its surface magnitude.',
        formula: '\\delta = 50 \\cdot \\sqrt{\\frac{\\rho}{f \\cdot \\mu_r}} \\quad (\\text{mm})',
        keyPointsAr: [
          'زيادة تردد الاختبار f تقلل عمق الاختراق، وتزيد الحساسية للشروخ السطحية المجهرية.',
          'العمق الفعال للكشف (Effective Depth) يصل إلى 3 أضعاف عمق الاختراق القياسي (3δ) حيث تنخفض التيارات إلى 5%.'
        ],
        keyPointsEn: [
          'Higher test frequency f compresses currents nearer the surface, enhancing sensitivity for micro-cracks while reducing depth reach.',
          'Effective inspection depth reaches 3δ, where current density drops to 5%.'
        ]
      },
      {
        headingAr: 'مستوى الممانعة المركبة ومسابر فحص الأنابيب (Impedance Plane & Bobbin Probes)',
        headingEn: 'Impedance Plane Analysis and Tubing Examination',
        contentAr: '1. شاشة مستوى الممانعة (Impedance Plane Display):\nتُمثل الممانعة كمتجه له مركبتان: المقاومة الكهربية R على المحور الأفقي، والمفاعلة الحثية XL على المحور الرأسي. يتيح هذا التمثيل فصل المتغيرات:\n - حركة الرفع (Lift-off): تغير المسافة بين المسبار والسطح تظهر كمتجه بزاوية محددة يتم ضبطها أفقياً على الشاشة.\n - الشروخ والتآكل: تظهر كإشارات ذات زاوية طور (Phase Angle) ترتبط مباشرة بعمق العيب في جدار القطعة.\n - تغيرات التوصيلية والنفاذية: تمكن من فرز السبائك والتحقق من المعالجة الحرارية.\n2. فحص أنابيب المبادلات الحرارية بمسابر Bobbin:\nيتم دفع مسابر أسطوانية داخل أنابيب المبادلات الحرارية وتوليد ترددات متعددة متزامنة (Multi-frequency ET) للكشف عن التآكل الخارجي والتنقر وتآكل صفائح الدعم (Baffle Cut).',
        contentEn: '1. Impedance Plane Display:\nPlots resistance R (horizontal) vs inductive reactance XL (vertical). Allows vector separation of variables:\n - Lift-off: Coil-to-specimen spacing rotated to horizontal axis.\n - Flaws and wall thinning: Produce distinct phase angle trajectories directly correlating with depth percentage.\n - Electrical conductivity variations: Used for alloy sorting and heat-treat verification.\n2. Tubing Bobbin Probe Inspection:\nInternal bobbin coils driven at multiple simultaneous frequencies detect OD/ID corrosion pitting, baffle plate wear, and cracking in steam generator and heat exchanger tubing.',
        keyPointsAr: [
          'ET يمكنها فحص الشروخ السطحية من خلال الطلاء والدهان بسماكة تصل إلى 2 مم دون الحاجة لإزالته.',
          'تقتصر طريقة ET على المواد الموصلة للكهرباء فقط؛ ولا تصلح للعوازل كالبلاستيك والسيراميك.'
        ],
        keyPointsEn: [
          'ET detects tight cracks through nonconductive paint coatings up to 2mm thick without paint stripping.',
          'ET is restricted exclusively to electrical conductors; insulators (plastics, ceramics) cannot be tested.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'استخدم كتلة المعايرة ذات الشقوق المحفورة بالشرارة (EDM Notches) بنفس السبيكة لضبط زاوية دوران الطور وموازنة الجهاز قبل بدء الفحص.',
      'في فحص الأنابيب، تأكد من سرعة سحب المسبار الثابتة (بين 0.3 و0.9 م/ث) للحفاظ على معايرة زمن الاستجابة والإشارات.'
    ],
    practicalInspectionTipsEn: [
      'Standardize on reference blocks with EDM notches manufactured from identical alloy metallurgy to establish phase rotation.',
      'Maintain steady bobbin pull speed (0.3-0.9 m/s) to ensure repeatable instrument phase-plane response.'
    ],
    applicableCodes: ['ASME Sec V Art. 8', 'ASTM E243', 'ASTM E426', 'ISO 15549']
  },
  {
    id: 'method-advanced-ndt',
    category: 'methods_encyclopedia',
    categoryTitleAr: 'الموسوعة التخصصية لطرق الفحص الـ 12',
    categoryTitleEn: '12 NDT Methods Comprehensive Encyclopedia',
    titleAr: 'التقنيات المتقدمة: مصفوفات الموجات PAUT، حيود زمن الرحلة TOFD، الانبعاث الصوتي AE واختبار التسرب LT',
    titleEn: 'Advanced NDT: Phased Array (PAUT), TOFD, Acoustic Emission (AE) & Leak Testing (LT)',
    summaryAr: 'طرق الفحص المتقدمة والحديثة: قوانين التركيز لمصفوفات PAUT، قياس ارتفاع الشروخ الدقيق بـ TOFD، مراقبة سلامة المنشآت بـ AE، وحساسية اختبارات التسرب.',
    summaryEn: 'Cutting-edge advanced NDT: PAUT electronic focal laws, TOFD diffraction tip sizing, AE passive structural monitoring, and precision mass spec Leak Testing.',
    badge: 'Advanced NDT',
    readTimeMin: 18,
    tags: ['PAUT', 'TOFD', 'Acoustic Emission', 'Leak Testing', 'MFL', 'Advanced NDT'],
    sections: [
      {
        headingAr: 'الموجات فوق الصوتية متعددة المصفوفات (Phased Array UT - PAUT)',
        headingEn: 'Phased Array Ultrasonic Testing (PAUT)',
        contentAr: 'تستخدم تقنية PAUT مسابر تحتوي على عدد من العناصر الكهروضغطية المستقلة (عادة 16، 32، 64 أو 128 عنصراً). يتم إطلاق النبضات بتأخيرات زمنية مبرمجة بدقة النانوثانية تسمى قوانين التركيز (Focal Laws).\nالمزايا الهندسية لـ PAUT:\n- المسح القطاعي (Sectorial / S-Scan): تحريك زاوية الحزمة الصوتية إلكترونياً (مثلاً من 40° إلى 70°) من موضع ثابت دون تحريك المسبار ذهاباً وإياباً.\n- المسح الخطي الإلكتروني (Electronic / E-Scan): تحريك الحزمة على طول المسبار لزيادة سرعة التفتيش.\n- التركيز البؤري الديناميكي (Dynamic Depth Focusing): تركيز طاقة الصوت على أعماق متعددة للحصول على قدرة تمييز غير مسبوقة.\n- تسجيل البيانات الرقمية الكاملة (A-Scan, B-Scan, C-Scan, S-Scan) مع تشفير الموضع (Encoder) للتحقق وإعادة الفحص.',
        contentEn: 'PAUT utilizes multi-element transducers (16 to 128 elements) triggered with nanosecond delay profiles termed Focal Laws.\nCore PAUT engineering capabilities:\n- Sectorial Scanning (S-Scan): Sweeping sound beam angles (e.g., 40° to 70°) electronically from a fixed probe position.\n- Electronic Linear Scanning (E-Scan): Multiplexing active apertures along the array for rapid coverage.\n- Dynamic Depth Focusing (DDF): Focusing energy across multiple depths simultaneously.\n- Full raw data encoding (A, B, C, S-Scans) synchronized with mechanical encoders for auditable record preservation.',
        keyPointsAr: [
          'تسمح تقنية PAUT بتصميم خطة مسح (Scan Plan) هندسية مسبقة تحاكي شطفة اللحام وتضمن تغطية 100% لحجم الوصلة دون مناطق ميتة.',
          'تعتبر بديلاً معتمداً في كود ASME Sec VIII Code Case 2235 للتصوير الإشعاعي RT في أوعية الضغط السميكة دون مخاطر السلامة الإشعاعية.'
        ],
        keyPointsEn: [
          'Enables Ray-Tracing scan plans modeling exact bevel geometries to guarantee 100% volumetric coverage without shadows.',
          'Approved per ASME Code Case 2235 as a code-compliant alternative to RT for heavy pressure vessels without radiation risks.'
        ]
      },
      {
        headingAr: 'تقنية حيود زمن الرحلة (Time-of-Flight Diffraction - TOFD)',
        headingEn: 'Time-of-Flight Diffraction (TOFD)',
        contentAr: 'تعتمد تقنية TOFD على فيزياء حيود الموجات الصوتية (Diffraction) بدلاً من الانعكاس المرآوي. يُوضع مسباران بزاوية متقابلة على جانبي اللحام (مسبار إرسال ومسبار استقبال Transmitter-Receiver):\n1. الموجة الجانبية (Lateral Wave): تسير تحت السطح العلوي مباشرة وتحدد بداية السمك.\n2. إشارات حيود أطراف العيب (Tip Diffracted Signals): عندما تصطدم الحزمة الصوتية العريضة بأطراف الشرخ العلوية والسفلية، تعمل أطراف الشرخ كمصادر نقطية تشع موجات حيود كروية.\n3. صدى الجدار الخلفي (Backwall Echo): يحدد الحد السفلي للسمك.\nمن خلال قياس الفارق الزمني الدقيق بين إشارة الطرف العلوي والطرف السفلي، يُحسب ارتفاع الشرخ (Flaw Height) وعمقه بدقة مليمترية متناهية (تصل إلى ±0.5 مم) بصرف النظر عن زاوية ميل الشرخ أو خشونته.',
        contentEn: 'TOFD relies on acoustic edge diffraction rather than specular reflection. Two opposing probes operate in pitch-catch across the weld:\n1. Lateral Wave: Propagates just beneath the scanning surface.\n2. Tip Diffracted Signals: Upper and lower crack tips act as cylindrical secondary emitters upon acoustic wave arrival.\n3. Backwall Echo: Establishes bottom boundary baseline.\nBy calculating exact arrival time differentials between upper and lower tip signals, crack vertical height and depth are sized with sub-millimeter precision (+/-0.5mm) independent of flaw orientation.',
        formula: 'd = \\sqrt{ \\left(\\frac{v \\cdot t}{2}\\right)^2 - s^2 }',
        keyPointsAr: [
          'أدق طريقة NDT عالمياً لقياس ارتفاع العيوب الرأسية لحسابات تقييم الصلاحية الهندسية للخدمة (Fitness-for-Service FFS).',
          'المنطقة الميتة القريبة من السطح (Dead Zone) لـ TOFD تُغطى دائماً بواسطة فحص تكميلي سطحي (كـ PAUT أو MT).'
        ],
        keyPointsEn: [
          'World-standard benchmark for flaw height sizing required by fitness-for-service (API 579 / BS 7910) assessments.',
          'Near-surface and backwall dead zones inherent to TOFD require complementary coverage via surface methods or high-angle PAUT.'
        ]
      },
      {
        headingAr: 'الانبعاث الصوتي AE واختبارات التسرب LT وفحص القيعان MFL',
        headingEn: 'Acoustic Emission (AE), Leak Testing (LT) & MFL',
        contentAr: '1. الانبعاث الصوتي (Acoustic Emission - AE):\nطريقة مراقبة سلبية (Passive Monitoring) تستمع للموجات المرنة الصادرة تلقائياً عند نمو الشروخ أو تسرب السوائل أو التشوه اللدن تحت الحمل. ظاهرة كايزر (Kaiser Effect): لا يصدر المنشأ انبعاثات جديدة إلا بعد تجاوز أقصى حمل تعرض له تاريخياً.\n2. اختبارات التسرب (Leak Testing - LT):\nتحديد مسارات التسرب في الأنظمة المضغوطة والأوعية. تتراوح من اختبار الفقاعات (Bubble Leak) بحساسية 10^-4 std cc/s، إلى اختبار مطياف كتلة الهيليوم (Helium Mass Spectrometer) بحساسية فائقة تصل إلى 10^-10 std cc/s.\n3. فحص تسرب الفيض المغناطيسي لقيعان الخزانات (MFL Floor Scanners):\nمغنطة قيعان خزانات النفط (API 653) بمغناطيس قوي وكشف التآكل والتنقر السفلي والعلوي بواسطة حساسات هول المدمجة.',
        contentEn: '1. Acoustic Emission (AE): Passive monitoring listening to elastic transient bursts from growing cracks or leaks under stress. Governed by Kaiser and Felicity effects.\n2. Leak Testing (LT): Quantifies boundary fluid containment from bubble emission (10^-4 std cc/s) down to Helium mass spectrometry (10^-10 std cc/s).\n3. Magnetic Flux Leakage (MFL): High-speed motorized scanners saturating storage tank bottom plates (API 653) to detect underside soil-side pitting.',
        keyPointsAr: [
          'AE تراقب المنشأ ككل أثناء اختبار الضغط الهيدروستاتيكي وتحدد موقع الشروخ النشطة لحظياً.',
          'MFL تفحص 100% من مساحة قيعان الخزانات الكبرى بسرعة فائقة وتحدد أماكن فقد السمك المتبقي.'
        ],
        keyPointsEn: [
          'AE provides real-time full-vessel surveillance during hydrostatic proof testing, locating active flaw growth.',
          'MFL maps 100% of large atmospheric tank floor plates, locating sub-surface soil-side corrosion.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'عند الجمع بين PAUT وTOFD، استخدم مسار فحص مشترك مع مشفر موحد (Single-pass dual-technology encoded scan) لدمج بيانات الحجم والعمق في ملف تقرير رقمي واحد.',
      'في اختبارات التسرب بالهيليوم، طبق غاز الهيليوم من الأعلى إلى الأسفل لأن غاز الهيليوم أخف من الهواء ويصعد للأعلى مما قد يعطي قراءات خاطئة.'
    ],
    practicalInspectionTipsEn: [
      'Couple PAUT and TOFD on a single encoded crawler frame to simultaneously acquire volumetric characterization and precision tip sizing.',
      'In helium leak testing, apply tracer gas starting from high elevation down, as buoyant helium floats upward causing false indications.'
    ],
    applicableCodes: ['ASME Sec V Art. 4, 10, 11, 12', 'API 579', 'API 653', 'ISO 13588', 'ISO 10863']
  },

  // ==================== 3. MATERIALS & MANUFACTURING PROCESSES ====================
  {
    id: 'mat-crystal-phases-iron-carbon',
    category: 'materials_processes',
    categoryTitleAr: 'علم المواد وعمليات التصنيع وتشكيل العيوب',
    categoryTitleEn: 'Materials & Manufacturing Processes',
    titleAr: 'علم المعادن، البنى البلورية ومخطط طور الحديد والكربون (Fe-C Diagram)',
    titleEn: 'Physical Metallurgy, Crystal Structures & Iron-Carbon Phase Diagram',
    summaryAr: 'الشبكات البلورية (BCC, FCC)، تحولات الفريت والأوستنيت والبيرليت والمارتنسيت، والمنطقة المتأثرة بالحرارة (HAZ) أثناء اللحام.',
    summaryEn: 'Crystal lattices (BCC, FCC), phase transformations (ferrite, austenite, pearlite, martensite), and heat-affected zone (HAZ) metallurgy.',
    badge: 'Metallurgy Science',
    readTimeMin: 14,
    tags: ['Metallurgy', 'Iron-Carbon', 'Martensite', 'HAZ', 'Phase Diagram', 'Hardness'],
    sections: [
      {
        headingAr: 'البنى البلورية وتحولات الحديد النقية',
        headingEn: 'Crystal Lattices and Allotropic Transformations',
        contentAr: 'يمتلك الحديد خاصية التآصل (Allotropy) حيث يغير بنيته البلورية مع تغير درجة الحرارة:\n1. حديد ألفا (Alpha Ferrite - α): شبكة مكعبة ممركزة الجسم (BCC)، مستقرة حتى 912°C، ذائبية الكربون فيها منخفضة جداً (أقصاها 0.022%)، وتمتاز بليونة عالية ومغناطيسية حديدية قوية.\n2. حديد جاما أو الأوستنيت (Gamma Austenite - γ): شبكة مكعبة ممركزة الأوجه (FCC)، مستقرة بين 912°C و1394°C، ذائبية الكربون فيها عالية (حتى 2.14%)، وتكون غير مغناطيسية (Non-magnetic).\n3. حديد دلتا (Delta Ferrite - δ): شبكة BCC مستقرة بين 1394°C ودرجة الانصهار 1538°C.',
        contentEn: 'Pure iron is allotropic, transforming crystal structure with temperature:\n1. Alpha Ferrite (BCC): Stable up to 912°C; carbon solubility very low (max 0.022%); ductile and ferromagnetic.\n2. Gamma Austenite (FCC): Stable 912-1394°C; high carbon solubility (up to 2.14%); non-magnetic.\n3. Delta Ferrite (BCC): Stable 1394-1538°C (melting point).',
        keyPointsAr: [
          'الصلب الأوستنيتي المقاوم للصدأ (مثل 304 و316) يحتفظ ببنية FCC في درجة حرارة الغرفة بفضل النيكل، ولهذا لا يمكن فحصه بجهاز MT المغناطيسي.',
          'الصلب الفيريتي والمارتنسيتي يمتلك بنية مغناطيسية ويصلح تماماً لفحص MT.'
        ],
        keyPointsEn: [
          'Austenitic stainless steels (304, 316) retain FCC structure at room temperature due to nickel, rendering them non-magnetic and uninspectable with MT.',
          'Ferritic and martensitic steels are strongly ferromagnetic and readily tested with MT.'
        ]
      },
      {
        headingAr: 'تحول المارتنسيت والشروخ الباردة في المنطقة المتأثرة بالحرارة (HAZ)',
        headingEn: 'Martensitic Transformation and HAZ Cold Cracking',
        contentAr: 'عند تبريد الأوستنيت ببطء يتحول إلى فريت وبيرليت متوازن. أما إذا كان معدل التبريد سريعاً جداً (Quenching)، ينحبس الكربون داخل الشبكة البلورية ويحدث تشوه قصي سريع ينتج عنه طور المارتنسيت (Martensite - BCT). يمتاز المارتنسيت بصلادة وقوة فائقتين ولكن بمتانة كسر متدنية للغاية وهشاشة عالية. في اللحام، تتعرض المنطقة الملاصقة لخط الانصهار (Coarse-Grained HAZ) لدرجات حرارة تزيد عن 1100°C، مما يسبب نمو حبيبي كبير؛ وإذا كان التبريد سريعاً يتشكل المارتنسيت الهش مما يهيئ المعدن لحدوث الشروخ الهيدروجينية الباردة (HICC).',
        contentEn: 'Slow cooling allows austenite to transform into equilibrium ferrite and pearlite. Rapid cooling (quenching) traps carbon, forcing a shear transformation into hard, brittle Body-Centered Tetragonal (BCT) martensite. In welding, the coarse-grained HAZ reaches >1100°C; rapid cooling transforms this zone into martensite, drastically increasing susceptibility to Hydrogen-Induced Cold Cracking (HICC).',
        keyPointsAr: [
          'المكافئ الكربوني (Carbon Equivalent CE) يحدد قابلية الصلب للتصلد؛ فإذا زاد CE عن 0.40%، يصبح التسخين المسبق (Preheat) إلزامياً.',
          'المعالجة الحرارية بعد اللحام (PWHT) تخفف الإجهادات المتبقية وتكسر بنية المارتنسيت الهشة محولة إياها إلى مارتنسيت مهدأ (Tempered Martensite) عالي المتانة.'
        ],
        keyPointsEn: [
          'Carbon Equivalent (CE) quantifies steel hardenability; CE >0.40% generally mandates preheat.',
          'Post-Weld Heat Treatment (PWHT) relieves residual stresses and tempers brittle martensite into tough tempered structures.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'عند فحص أجزاء اللحام عالية الكربون أو السبائكية، ركز فحصك على خط صهر اللحام والمنطقة المتأثرة بالحرارة (HAZ) حيث تتركز الشروخ الطولية وتحت التغطية (Underbead Cracks).',
      'تذكر أن الشروخ الباردة بفعل الهيدروجين قد تتأخر في الظهور حتى 24 إلى 48 ساعة بعد اكتمال اللحام؛ تنص المواصفات على إجراء الفحص النهائي بعد انقضاء زمن الانتظار المحدد.'
    ],
    practicalInspectionTipsEn: [
      'Focus inspection along the fusion boundary and HAZ in high-strength steels where underbead hydrogen cracking typically initiates.',
      'Hydrogen cold cracks can experience delayed incubation up to 24-48 hours post-welding; codes require final NDT inspection after the designated delay window.'
    ],
    applicableCodes: ['ASME Sec IX', 'AWS D1.1 Annex H', 'API 577', 'ISO 15614-1']
  },
  {
    id: 'mat-casting-forging-discontinuities',
    category: 'materials_processes',
    categoryTitleAr: 'علم المواد وعمليات التصنيع وتشكيل العيوب',
    categoryTitleEn: 'Materials & Manufacturing Processes',
    titleAr: 'عيوب وانقطاعات السباكة والدرفلة والطرق (Casting & Wrought Flaws)',
    titleEn: 'Manufacturing Discontinuities: Ingot, Casting, Rolling & Forging',
    summaryAr: 'العيوب التأسيسية: فجوات الانكماش، الخبث، الانفصال البارد، المسامية، التورق (Laminations)، طيات الطرق (Forging Laps) وتصدعات التشكيل.',
    summaryEn: 'Inherent and primary processing flaws: shrinkage cavities, cold shuts, porosity, ingot pipe, laminations, forging bursts, and seams.',
    badge: 'Manufacturing Flaws',
    readTimeMin: 13,
    tags: ['Casting', 'Forging', 'Laminations', 'Shrinkage', 'Bursts', 'Defects'],
    sections: [
      {
        headingAr: 'عيوب وانقطاعات السباكة والصب (Casting Discontinuities)',
        headingEn: 'Casting and Foundry Discontinuities',
        contentAr: 'تنشأ عيوب السباكة أثناء تجمد المعدن المنصهر داخل القالب:\n1. فجوات الانكماش (Shrinkage Cavities): تحدث بسبب تقلص حجم المعدن عند التحول من الحالة السائلة للصلبة ونقص التغذية من المصاعد (Risers). تظهر في RT كظلال داكنة متفرعة تشبه الأشجار أو خطوط مسننة.\n2. الفجوات الغازية والمسامية (Gas Holes & Porosity): تنشأ من حبس الغازات داخل المصهور، وتكون كروية أو بيضاوية ملساء الجدران، وتكشف بوضوح في RT وUT.\n3. الانفصال البارد (Cold Shut): يحدث عندما يلتقي تياران من المعدن المنصهر دون اندماج حراري كامل بسبب برودة أحدهما، ويظهر في السطح كأخدود أو خط مستمر.\n4. التمزق الحار (Hot Tear): شروخ متعرجة تنشأ عند درجات حرارة قريبة من التجمد بسبب إعاقة القالب لانكماش المعدن.',
        contentEn: 'Casting flaws arise during mold filling and solidification:\n1. Shrinkage cavities: Caused by volumetric contraction during phase change without riser feeding; visible in RT as jagged dendritic branch voids.\n2. Gas porosity: Trapped gases creating smooth-walled spherical or elongated voids, readily detected by RT and UT.\n3. Cold shuts: Formed when two metal streams fail to fuse due to insufficient temperature, appearing as distinct surface crevices.\n4. Hot tears: Jagged, ragged ruptures occurring near solidus due to mechanical mold restraint against thermal contraction.',
        keyPointsAr: [
          'السباكة تمتاز بحبيبات خشنة، مما يسبب تشتتاً صوتياً عالياً وتوهيناً يجعل فحص UT بزوايا عالية صعباً، ويفضل استخدام مسابر مزدوجة (TR) بتردد منخفض (1 إلى 2 MHz).',
          'العيوب السطحية كالتمزق الحار والانفصال البارد تكشف بكفاءة فائقة بواسطة MT أو PT.'
        ],
        keyPointsEn: [
          'Coarse grain structure in cast metals causes severe ultrasonic scattering, favoring lower frequencies (1-2 MHz) and dual-element (TR) probes.',
          'Surface breaking casting defects (hot tears, cold shuts) are rapidly identified with MT or PT.'
        ]
      },
      {
        headingAr: 'عيوب عمليات الدرفلة والتشكيل والطرق (Wrought Discontinuities)',
        headingEn: 'Wrought, Rolling and Forging Discontinuities',
        contentAr: 'عند تشكيل قوالب الصب بالدرفلة أو الطرق لتصنيع الألواح والمواسير والمطروقات:\n1. التورق الصفيحي (Laminations): ينشأ عند تسطيح فجوات الانكماش والخبث الأصلي للسبائك أثناء الدرفلة لتصبح انفصالات مستوية موازية لأسطح الألواح. تكشف بسهولة باستخدام UT بالموجات الطولية (0° Straight Beam).\n2. طيات الطرق (Forging Laps): تتكون عند انثناء أو انطباق جزء من المعدن الساخن فوق بعضه دون اندماج، وتكون مائلة على السطح وتكشف بـ MT وPT.\n3. تصدعات الطرق الداخلية (Forging Bursts): شروخ وتمزقات داخلية تنشأ في قلب القطعة المطروقة نتيجة الطرق عند درجات حرارة غير مناسبة، وتكشف بحساسية قصوى بواسطة UT.',
        contentEn: 'During mechanical deformation into plates, pipes, and forgings:\n1. Laminations: Ingot piping or inclusions flattened into planar separations parallel to plate surfaces; easily mapped with 0° straight beam UT.\n2. Forging Laps: Folds of metal pressed into the workpiece without welding together, entering the surface at an angle; found with MT/PT.\n3. Forging Bursts: Internal ruptures inside thick forgings from excessive stress or incorrect forging temperatures; readily located with straight beam UT.',
        keyPointsAr: [
          'قبل لحام حواف الألواح السميكة، يجب إجراء فحص UT بالمسبار المستقيم (0°) لشريط بعرض 50 مم على الحافة للتأكد من خلوها من التورق الذي قد يسبب تمزقاً صفيحياً (Lamellar Tearing).',
          'التورق الموازي لسطح اللوحة لا يمكن كشفه بواسطة RT لأن شعاع الأشعة يكون عمودياً عليه.'
        ],
        keyPointsEn: [
          'Prior to welding bevels on heavy plate, a 50mm strip must be scanned with 0° UT to exclude laminations that could trigger lamellar tearing.',
          'Laminations parallel to plate surfaces cannot be detected by RT because the radiation beam passes perpendicular to the flaw plane.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'في فحص الألواح بـ UT المستقيم، راقب انخفاض صدى الجدار الخلفي (Backwall Echo Loss) بالتزامن مع ظهور صدى العيب للتأكد من عمق وامتداد التورق.',
      'في المطروقات الدائرية (Shafts)، افحص محورياً وشعاعياً لضمان كشف كل من الشروخ الطولية والتمزقات المركزية.'
    ],
    practicalInspectionTipsEn: [
      'In straight-beam plate UT, correlate the emergence of an intermediate flaw echo with backwall signal attenuation to size laminations.',
      'On cylindrical shafts, scan both axially and radially to detect transverse forging bursts and longitudinal seams.'
    ],
    applicableCodes: ['ASME Sec V Art. 4 & 5', 'ASTM A435', 'ASTM A578', 'ISO 10893-9']
  },
  {
    id: 'mat-welding-discontinuities-catalog',
    category: 'materials_processes',
    categoryTitleAr: 'علم المواد وعمليات التصنيع وتشكيل العيوب',
    categoryTitleEn: 'Materials & Manufacturing Processes',
    titleAr: 'موسوعة عيوب اللحام الشاملة: الآليات والتصنيف ومعايير القبول',
    titleEn: 'Comprehensive Welding Discontinuities: Formation, Detection & Acceptance',
    summaryAr: 'الدليل الهندسي الكامل لعيوب اللحام: نقص الاختراق، نقص الانصهار، الخبث، مسامية الأنابيب، الحفر السفلي، الشروخ، والتمزق الصفيحي.',
    summaryEn: 'Complete engineering catalog of weld flaws: LOP, LOF, slag, wormhole porosity, undercut, transverse/longitudinal cracks, and lamellar tearing.',
    badge: 'Welding Defects',
    readTimeMin: 16,
    tags: ['Welding', 'Weld Defects', 'ASME Sec VIII', 'AWS D1.1', 'LOP', 'LOF', 'Undercut'],
    sections: [
      {
        headingAr: 'العيوب المستوية الخطرة (Planar Discontinuities)',
        headingEn: 'Planar / Linear Flaws (Cracks, LOF, LOP)',
        contentAr: 'تعتبر العيوب المستوية هي الأخطر على سلامة المنشآت الهندسية لأنها تعمل كمراكز لتركيز الإجهادات (Stress Concentrators) مما يؤدي إلى الانهيار المفاجئ بالكسر الهش أو الكلال:\n1. شروخ اللحام (Weld Cracks): سواء كانت طولية، عرضية، شروخ الفوهة (Crater Cracks)، أو شروخ تحت الغطاء (Underbead Cracks). مرفوضة رفضاً باتاً في جميع الأكواد الهندسية أياً كان حجمها.\n2. نقص الانصهار (Lack of Fusion - LOF): عدم حدوث التحام وتداخل بين معدن اللحام ومعدن الأساس، أو بين طبقات اللحام المتجاورة. يمتاز بجدران مستوية رقيقة يصعب كشفها بـ RT إذا لم يكن الشعاع موازياً للشطفة، ولكنه يكشف بحساسية مطلقة بواسطة UT وPAUT الزاوي.\n3. نقص الاختراق (Lack of Penetration - LOP): فشل معدن اللحام في الوصول إلى جذر الوصلة وصهر حواف الجذر بالكامل. يظهر في RT كخط داكن مستقيم ذي حواف حادة في مركز اللحام.',
        contentEn: 'Planar flaws act as severe stress risers, precipitating catastrophic brittle fracture or fatigue propagation:\n1. Cracks (longitudinal, transverse, crater, toe, underbead): Universally rejected across all major fabrication codes regardless of length.\n2. Lack of Fusion (LOF): Absence of metallurgical bond between weld and base metal, or between passes. Features tight planar boundaries; poorly oriented for RT unless beam matches bevel angle, but exceptionally detectable by angle beam UT/PAUT.\n3. Lack of Penetration (LOP): Incomplete fusion through joint root thickness; shows on RT as a sharp, straight dark line running through the weld center.',
        keyPointsAr: [
          'الشروخ ونقص الانصهار تسمى "عيوب خطية حادة" ولا يسمح بأي تفاوت فيها في ASME B31.3 للمشاريع النفطية الحرجة.',
          'توجيه مسبار PAUT بزاوية متطابقة مع شطفة التحضير (Bevel Angle) يضمن أقصى انعكاس من نقص انصهار جانب الشطفة (Side-wall LOF).'
        ],
        keyPointsEn: [
          'Cracks and lack of fusion are planar flaws with zero tolerance under severe cyclic service (ASME B31.3).',
          'Aligning PAUT beam angles to coincide with the joint bevel angle delivers maximum specular reflection from side-wall LOF.'
        ]
      },
      {
        headingAr: 'العيوب الحجمية والهندسية (Volumetric & Geometric Flaws)',
        headingEn: 'Volumetric and Geometrical Weld Flaws',
        contentAr: '1. شمولات الخبث (Slag Inclusions): بقايا مادة التدفق (Flux) المحبوسة في اللحامات المنجزة بطرق SMAW أو FCAW أو SAW. تظهر بأشكال متعرجة وغير منتظمة، وتسمح الأكواد بحدود معينة منها طبقاً لسمك الوصلة.\n2. شمولات التنجستن (Tungsten Inclusions): جزيئات متناثرة من قطب التنجستن في لحام TIG/GTAW نتيجة التلامس المباشر مع المصهور. تظهر في RT كبقع بيضاء شديدة النصوع لأن كثافة التنجستن (19.3 g/cm³) أعلى بكثير من الفولاذ (7.8 g/cm³).\n3. الحفر السفلي (Undercut): أخدود محفور في معدن الأساس عند حافة اللحام (Toe). يحدد عمقه المسموح عادة بـ 1 مم أو 10% من السمك أيهما أقل.\n4. عدم المحاذاة (Hi-Lo / Misalignment): اختلاف في استواء سطحي الأنبوبين أو اللوحين قبل اللحام، ويقاس بمقياس Hi-Lo.',
        contentEn: '1. Slag inclusions: Nonmetallic solid flux residue entrapped in SMAW, FCAW, or SAW welds; irregular, jagged geometry; permitted within length limits per code.\n2. Tungsten inclusions: Particles from tungsten electrode contacting molten puddle in GTAW/TIG; shows as brilliant white spots on RT because tungsten density (19.3 g/cm³) exceeds steel (7.8 g/cm³).\n3. Undercut: Groove melted into base metal adjacent to weld toe; allowable depth typically limited to <=1mm or 10% of nominal thickness.\n4. Hi-Lo misalignment: Offset between adjoining pipe or plate surfaces; measured with dedicated Hi-Lo gauge.',
        keyPointsAr: [
          'المسامية المتجمعة (Cluster Porosity) ومسامية الأنابيب المتعرجة (Wormhole Porosity) تنشأ من تلوث الرطوبة أو الرياح العاتية التي تبدد غاز الحماية.',
          'ارتفاع غطاء اللحام (Weld Reinforcement / Cap Height) المقبول عادة بين 1.5 و3.5 مم طبقاً للسمك لمنع حدوث تركيز إجهادات عند أصابع اللحام.'
        ],
        keyPointsEn: [
          'Cluster and piping porosity stem from damp electrodes, joint contamination, or wind blowing away shielding gas.',
          'Weld cap reinforcement is strictly governed (typically 1.5-3.5 mm depending on thickness) to limit stress concentrations at weld toes.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'استخدم تقنية الفحص بالموجات فوق الصوتية المتقدمة PAUT وTOFD معاً لتغطية الوصلة: TOFD لقياس عمق وارتفاع الشروخ بدقة، وPAUT لتوصيف نوع العيب ومكانه.',
      'عند تصوير RT، ميز دائماً بين دلالات الخبث (حواف متموجة غير حادة) ودلالات شروخ الجذر (خطوط دقيقة متعرجة حادة الأطراف).'
    ],
    practicalInspectionTipsEn: [
      'Deploy complementary PAUT and TOFD: TOFD provides unparalleled depth and sizing accuracy, while PAUT characterizes flaw orientation and nature.',
      'On radiographs, distinguish rounded irregular slag from sharp jagged root cracks by edge sharpness and branching characteristics.'
    ],
    applicableCodes: ['ASME Sec VIII Div 1 App. 4 & 12', 'AWS D1.1 Table 8.1', 'API 1104 Sec 9', 'ISO 5817']
  },
  {
    id: 'mat-damage-mechanisms',
    category: 'materials_processes',
    categoryTitleAr: 'علم المواد وعمليات التصنيع وتشكيل العيوب',
    categoryTitleEn: 'Materials & Manufacturing Processes',
    titleAr: 'آليات التلف والتدهور أثناء الخدمة في المنشآت النفطية والصناعية (API 571)',
    titleEn: 'In-Service Damage Mechanisms in Refining & Petrochemicals (API 571)',
    summaryAr: 'شروخ التآكل الإجهادي SCC، الهجوم الهيدروجيني HTHA، التآكل تحت العزل CUI، كلال الاهتزازات، التآكل النفاث، وزحف المعادن Creep.',
    summaryEn: 'Stress Corrosion Cracking (SCC), High Temperature Hydrogen Attack (HTHA), Corrosion Under Insulation (CUI), vibration fatigue, and creep rupture.',
    badge: 'API 571 Mechanisms',
    readTimeMin: 16,
    tags: ['API 571', 'Damage Mechanisms', 'SCC', 'HTHA', 'CUI', 'Creep', 'Fatigue'],
    sections: [
      {
        headingAr: 'الشروخ البيئية والإجهادية (Environmental Cracking: SCC & HIC)',
        headingEn: 'Environmental Assisted Cracking: SCC and HIC',
        contentAr: 'تحدث آليات التلف البيئي نتيجة التفاعل المشترك بين الإجهادات الميكانيكية والبيئات الكيميائية الأكالة:\n1. التشقق التآكلي الإجهادي (Stress Corrosion Cracking - SCC):\nيتطلب ثلاثة عناصر متزامنة: معدن حساس، إجهاد شد متبقي أو تشغيلي، وبيئة محددة (مثل الكلوريدات للصلب الأوستنيتي المقاوم للصدأ، أو الأمين/الكاوستك للصلب الكربوني). تمتاز الشروخ بتفرعات شجرية دقيقة مجهرية تنمو عبر الحبيبات (Transgranular) أو بين الحبيبات (Intergranular).\n2. التشقق الناجم عن الهيدروجين (Hydrogen-Induced Cracking - HIC):\nفي بيئات كبريتيد الهيدروجين الرطب (Wet H2S / Sour Service)، تتغلغل ذرات الهيدروجين الذرية داخل الفولاذ وتتجمع عند شمولات المنجنيز وتجاويف التورق لتشكل جزيئات H2 الغازية بضغوط هائلة تسبب انتفاخات هيدروجينية (Hydrogen Blisters) وشروخاً متدرجة الخطوات (Stepwise Cracking).',
        contentEn: 'Environmental degradation requires synergy between tensile stress, susceptible metallurgy, and corrosive chemistry:\n1. Stress Corrosion Cracking (SCC): Requires susceptible alloy, tensile stress, and specific electrolyte (chlorides for 300-series stainless, amine/caustic for carbon steel). Characterized by multi-branched transgranular or intergranular crack networks.\n2. Hydrogen Induced Cracking (HIC): In wet H2S (sour service), atomic hydrogen diffuses into steel, recombining at planar inclusions into high-pressure molecular gas, generating blisters and stepwise cracking.',
        keyPointsAr: [
          'فحص PAUT المتقدم بموجات طولية عالية التردد يكشف تفرعات SCC وتدرجات HIC بكفاءة فائقة.',
          'تطبيق التسخين لإزالة الإجهادات بعد اللحام (PWHT) يقلل إجهادات الشد المتبقية إلى ما دون العتبة الحرجة لحدوث SCC.'
        ],
        keyPointsEn: [
          'High-frequency longitudinal PAUT maps planar HIC stepwise laminations and SCC branching.',
          'PWHT stress-relieving reduces tensile residual stresses below the critical threshold required to drive SCC.'
        ]
      },
      {
        headingAr: 'التآكل تحت العزل (CUI) والزحف عالي الحرارة (Creep)',
        headingEn: 'Corrosion Under Insulation (CUI) and High Temperature Creep',
        contentAr: '1. التآكل تحت العزل (CUI - Corrosion Under Insulation):\nأحد أخطر أسباب الحوادث في المصافي؛ ينشأ عند تسرب مياه الأمطار أو مياه الإطفاء تحت العوازل الحرارية للأنابيب والأوعية العاملة بين -4°C و175°C، مما يسبب تآكلاً موضعياً حاداً وتنقر تحت الغطاء دون ظهور علامات خارجية. يُفحص باستخدام الأشعة الرقمية العابرة (Profile RT)، أو الموجات الموجهة طويلة المدى (LRUT / GWT)، أو التيارات الدوامية النبضية (PEC) من فوق العازل دون إزالته.\n2. الزحف والتمزق الإجهادي (Creep & Stress Rupture):\nتشوه لدن بطيء وتدريجي يحدث للمعدن المعرض لإجهاد ميكانيكي مستمر عند درجات حرارة مرتفعة تزيد عن 40% من درجة الانصهار المطلقة للمعدن (أعلى من 400°C للصلب الكربوني). يبدأ بتكون فجوات مجهرية دقيقة عند حدود الحبيبات (Cavities) تندمج لتشكل شروخاً دقيقة ثم انهياراً مفاجئاً.',
        contentEn: '1. Corrosion Under Insulation (CUI): Concealed aggressive loss on carbon and low-alloy steel operating between -4°C and 175°C beneath damp insulation. Inspected non-invasively via Pulsed Eddy Current (PEC), Profile Radiography, and Guided Wave UT (LRUT).\n2. Creep: Time-dependent permanent deformation under sustained stress above homologous temperature (>0.4 Tm, ~400°C for steel). Microscopic grain boundary void coalescence leads to micro-fissuring and rupture.',
        keyPointsAr: [
          'تقنية التيارات الدوامية النبضية (PEC) تقيس متوسط السمك المتبقي لجدار الأنبوب من فوق طبقة العازل وغلاف الألمنيوم الواقي.',
          'فحص الزحف في أنابيب الأفران يتطلب قياس التمدد القطري (Diametral Creep Strain) ونسخ البنية السطحية المجهرية (In-situ Metallographic Replication).'
        ],
        keyPointsEn: [
          'Pulsed Eddy Current (PEC) determines remaining wall thickness through insulation and weather jacketing without stripping.',
          'Creep surveillance on furnace tubes relies on laser diametral swelling checks and in-situ replica metallography.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'حدد أولويات فحص CUI في المناطق الأكثر عرضة للرطوبة: الأكواع السفلية، مخارج السقالات، المناطق الملاصقة للدعامات، ونهايات التغطية العازلة.',
      'في فحص الشروخ الإجهادية SCC، استخدم فحص التيارات الدوامية ET أو الفحص المغناطيسي الفلوري الرطب WFMET كطرق أولية فائقة الحساسية.'
    ],
    practicalInspectionTipsEn: [
      'Prioritize CUI screening at moisture traps: pipe hangers, insulation termination caps, low-point deadlegs, and penetration fittings.',
      'Deploy wet fluorescent MT or high-frequency surface ET as primary screening tools for tight SCC networks.'
    ],
    applicableCodes: ['API 571', 'API 570', 'API 510', 'API 580 / 581']
  },

  // ==================== 4. RADIATION SAFETY & HEALTH PHYSICS ====================
  {
    id: 'rad-safety-alara-protection',
    category: 'radiation_safety',
    categoryTitleAr: 'السلامة الإشعاعية والفيزياء الصحية',
    categoryTitleEn: 'Radiation Safety & Health Physics',
    titleAr: 'السلامة الإشعاعية الصناعية: مبادئ ALARA، الجرعات وحدود الطوارئ',
    titleEn: 'Industrial Radiation Protection: ALARA, Dosimetry & Emergency Protocol',
    summaryAr: 'المبادئ الأساسية للوقاية من الإشعاع، وحدات القياس (Sievert, Gray, Roentgen)، أجهزة المسح الإشعاعي وإجراءات الطوارئ عند انحشار المصدر.',
    summaryEn: 'Core radiation safety, ALARA guidelines, exposure limits (Sievert, Rem), survey instrumentation, and emergency source recovery procedures.',
    badge: 'Radiation Safety',
    readTimeMin: 15,
    tags: ['Radiation Safety', 'ALARA', 'Dosimetry', 'Gamma', 'Emergency', 'Collimators'],
    sections: [
      {
        headingAr: 'المبادئ الثلاثة للوقاية الإشعاعية ومبدأ ALARA',
        headingEn: 'The Three Golden Rules and ALARA',
        contentAr: 'يهدف مبدأ ALARA (As Low As Reasonably Achievable) إلى تقليل التعرض الإشعاعي إلى أدنى حد ممكن عملياً واقتصادياً. ويعتمد على ثلاثة محاور رئيسية:\n1. الزمن (Time): يتناسب التعرض الإشعاعي التراكمي طردياً مع زمن التواجد في الحقل الإشعاعي. تقليل زمن العمل يعني تقليل الجرعة.\n2. المسافة (Distance): العامل الأكثر فاعلية؛ طبقاً لقانون التربيع العكسي، مضاعفة المسافة من المصدر إلى الضعف تخفض شدة الإشعاع إلى الربع (1/4)، ومضاعفتها عشر مرات تخفض الإشعاع إلى 1/100.\n3. التدريع (Shielding): استخدام مواد كثيفة ذات عدد ذري مرتفع كالرصاص (Lead) أو اليورانيوم المستنفد (Depleted Uranium) أو التنجستن لامتصاص الإشعاع. استخدام الموجهات الرصاصية (Collimators) يخفض مستويات الإشعاع بنسبة تزيد عن 95% في الاتجاهات غير المستهدفة.',
        contentEn: 'ALARA (As Low As Reasonably Achievable) dictates minimizing exposure through three cardinal controls:\n1. Time: Accumulated dose is directly proportional to exposure duration. Minimize working time.\n2. Distance: The most potent control; per Inverse Square Law, doubling distance cuts dose rate to 1/4th; tenfold distance cuts it to 1/100th.\n3. Shielding: High-density, high-Z absorbers (lead, tungsten, depleted uranium) attenuate photons. Collimators slash unwanted scatter by >95%.',
        formula: 'Dose = \\text{Dose Rate} \\times \\text{Time}, \\quad I_2 = I_1 \\cdot \\left(\\frac{d_1}{d_2}\\right)^2',
        keyPointsAr: [
          'الحد السنوي الأقصى للجرعة المهنية للعاملين بالإشعاع هو 20 ملي سيفرت (20 mSv/year) طبقاً لـ ICRP والوكالة الدولية للطاقة الذرية IAEA.',
          'الحد الأقصى للجمهور العام هو 1 ملي سيفرت في السنة (1 mSv/year).'
        ],
        keyPointsEn: [
          'Maximum occupational annual dose limit for radiographers is 20 mSv/year per ICRP and IAEA guidelines.',
          'Annual dose limit for the general public is 1 mSv/year.'
        ]
      },
      {
        headingAr: 'أجهزة قياس الإشعاع والجرعات الشخصية (Dosimetry)',
        headingEn: 'Radiation Survey Meters and Personal Dosimeters',
        contentAr: '1. أجهزة المسح الإشعاعي (Survey Meters): كاشفات غازية من نوع جيجر-مولر (Geiger-Müller GM) أو غرف التأين (Ion Chambers) لقياس معدل الجرعة الموضعية بوحدات µSv/h أو mR/h. يجب فحصها ومعايرتها دورياً.\n2. أجهزة قياس الجرعات الشخصية التراكمية:\n - مقياس الجرعة الرقمي الإلكتروني (PED / EPD): يعطي قراءة فورية للجرعة التراكمية ومعدل الجرعة مع إنذار صوتي عند تجاوز الحدود.\n - شارات التلألؤ الحراري (TLD) أو الضوئي (OSL): شارات سلبية ترسل شهرياً للمختبر المعتمد لتوثيق السجل الإشعاعي القانوني للمفتش.',
        contentEn: '1. Survey Meters: Geiger-Müller (GM) counters and ion chambers measuring instant dose rates (µSv/h or mR/h); requires daily battery verification and periodic calibration.\n2. Personal Dosimeters:\n - Personal Electronic Dosimeters (PED): Direct-reading active monitors with programmable audible rate/dose alarms.\n - TLD / OSL badges: Passive legal dosimeters processed periodically by accredited labs to document lifetime occupational dose.',
        keyPointsAr: [
          'يجب تطويق منطقة الفحص بشريط تحذيري عند نقطة يتساوى عندها معدل الإشعاع مع 20 µSv/h (أو 2.5 µSv/h لحدود الجمهور العام).',
          'وضع لافتات تحذيرية باللغتين العربية والإنجليزية مع شعار الخطر الإشعاعي ثلاثي الشفرات (Trefoil Symbol).'
        ],
        keyPointsEn: [
          'Establish barricaded controlled boundaries where the dose rate does not exceed 20 µSv/h (or 2.5 µSv/h for public boundary).',
          'Post illuminated warning signs and radioactive trefoil symbols at all perimeter access points.'
        ]
      }
    ],
    practicalInspectionTipsAr: [
      'قبل فتح كاميرا الإشعاع أو تشغيل أنبوب الأشعة، قِس دائماً الإشعاع حول الكاميرا بمقياس المسح للتأكد من أن المصدر في وضع الأمان المغلق.',
      'في حالة انحشار المصدر (Source Hang-up): لا تتصرف بمفردك أو تقترب من المصدر بالأيدي المجردة؛ أخلِ المكان فوراً، وسع حدود الطوق الأمني، وأبلغ مسؤول الوقاية الإشعاعية (RSO) لتنفيذ خطة الطوارئ المعتمدة.'
    ],
    practicalInspectionTipsEn: [
      'Prior to handling radiography cameras, measure perimeter dose rate with a calibrated survey meter to confirm source is fully shielded and locked.',
      'In a source hang-up emergency: Never attempt manual recovery; immediately retreat, expand physical barricade perimeter, and notify the designated Radiation Safety Officer (RSO).'
    ],
    applicableCodes: ['10 CFR Part 20 & 34', 'IAEA SSG-11', 'ISO 3999', 'ASME Sec V Art. 2']
  }
];

export const NDT_DEFECT_ATLAS: DefectProfile[] = [
  {
    id: 'defect-lack-of-fusion',
    nameAr: 'نقص الانصهار (Lack of Fusion - LOF)',
    nameEn: 'Lack of Fusion (LOF)',
    origin: 'Welding',
    originAr: 'أثناء اللحام (عمليات التصنيع)',
    criticality: 'Critical (Rejection Mandatory)',
    criticalityAr: 'حرج جداً (مرفوض قطعياً)',
    morphologyAr: 'انفصال مستوي ثنائي الأبعاد ذو أطراف حادة وضيق جداً، يمتد بمحاذاة شطفة الوصلة أو بين مسارات اللحام المتجاورة.',
    morphologyEn: 'Tight two-dimensional planar separation with sharp tips running parallel to joint bevel or between weld passes.',
    rootCausesAr: [
      'طاقة قوس منخفضة جداً (مدخل حرارة غير كافٍ لصهر جدار الشطفة).',
      'سرعة حركة اللحام أسرع من اللازم، مما يسمح للبركة بالتقدم فوق معدن بارد.',
      'توجيه خاطئ لقطب اللحام أو عدم إزالة طبقة الأكسيد أو الخبث بين المسارات.'
    ],
    rootCausesEn: [
      'Insufficient heat input to melt base metal bevel face.',
      'Excessive travel speed allowing weld pool to roll ahead of arc.',
      'Incorrect electrode angle or failure to grind interpass slag/oxides.'
    ],
    detectionMatrix: [
      {
        method: 'UT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يكشف بحساسية قصوى بالمسبار الزاوي (Angle Beam) عند توجيه الحزمة بزاوية متعامدة مع شطفة التحضير، ويعطي صدى حاداً ذا سعة عالية.',
        descriptionEn: 'Superior sensitivity with angle beam UT when beam angle strikes perpendicular to the weld bevel face.'
      },
      {
        method: 'RT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'يصعب كشفه إذا لم يكن شعاع الإشعاع موازياً تماماً لمستوى الانفصال، حيث يظهر كخط رفيع داكن ذي حافة حادة واحدة.',
        descriptionEn: 'Difficult to detect unless radiation beam is aligned within ~5° of the flaw plane; appears as a fine, sharp dark line.'
      },
      {
        method: 'VT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'لا يرى بالعين إلا إذا كان مفتوحاً على السطح الخارجي عند أصابع اللحام أو غطاء الوصلة.',
        descriptionEn: 'Visible only if breaking out to the weld cap toe or root surface.'
      },
      {
        method: 'PT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'ممتاز للشروخ ونقص الانصهار السطحي عند شطفة الجذر أو الغطاء بعد إزالة الخبث.',
        descriptionEn: 'High detectability if discontinuity is open to an accessible surface.'
      },
      {
        method: 'MT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'حساسية مطلقة لنقص الانصهار السطحي وتحت السطحي القريب في المواد الفيرومغناطيسية.',
        descriptionEn: 'Highly sensitive for surface and near-subsurface fusion defects in ferromagnetic steels.'
      },
      {
        method: 'ET',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'يكشف الشقوق السطحية ونقص الانصهار عند أصابع اللحام في المواد الموصلة حتى عمق 3-5 مم.',
        descriptionEn: 'Effective for surface-breaking weld toe fusion defects in conductive alloys.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'مرفوض كلياً في ASME Sec VIII Div 1 (UW-51), ASME B31.3 (Severe Cyclic & Normal), وAWS D1.1 أياً كان طوله.',
    asmeAwsAcceptanceCriteriaEn: 'Zero tolerance: completely rejectable under ASME Sec VIII UW-51, ASME B31.3 Table 341.3.2, and AWS D1.1.',
    preventionMethodAr: 'زيادة تيار اللحام، تقليل سرعة الحركة، المحافظة على زاوية قطب سليمة، والتنظيف الجيد بين الطبقات بالتجليخ.',
    preventionMethodEn: 'Increase amperage, optimize travel speed, ensure proper electrode oscillation, and thoroughly grind interpass surfaces.'
  },
  {
    id: 'defect-lack-of-penetration',
    nameAr: 'نقص الاختراق في الجذر (Lack of Root Penetration - LOP)',
    nameEn: 'Lack of Penetration (LOP)',
    origin: 'Welding',
    originAr: 'أثناء اللحام في منطقة الجذر',
    criticality: 'Critical (Rejection Mandatory)',
    criticalityAr: 'حرج جداً (مرفوض قطعياً)',
    morphologyAr: 'فجوة طولية مستقيمة في مركز جذر اللحام تمتد بطول الوصلة وتنتج عن عدم انصهار وجه الجذر (Root Face).',
    morphologyEn: 'Straight longitudinal linear void located precisely at weld root center, leaving unfused root faces.',
    rootCausesAr: [
      'فجوة جذر ضيقة جداً (Root Gap too small).',
      'وجه جذر عريض أكثر من اللازم (Root Face / Land too thick).',
      'تيار لحام منخفض جداً في مسار الجذر (Root Pass).',
      'قطب لحام كبير القطر لا يصل لعمق الجذر.'
    ],
    rootCausesEn: [
      'Root gap too narrow for electrode access.',
      'Root face/land excessively thick.',
      'Insufficient welding current during root pass deposition.',
      'Electrode diameter too large for the joint preparation.'
    ],
    detectionMatrix: [
      {
        method: 'RT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يكشف بوضوح تام كخط داكن ومستقيم ذي حواف حادة متوازية في منتصف اللحام على طول الجذر.',
        descriptionEn: 'Readily identified as a sharp, straight dark linear indication centered in the weld root.'
      },
      {
        method: 'UT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يعطي صدى ذا سعة عالية جداً عند مسح الجذر بالمسبار الزاوي، ويثبت مكانه عند عمق الجذر الاسمي.',
        descriptionEn: 'High amplitude corner reflection at root depth; easily mapped with angle beam UT/PAUT.'
      },
      {
        method: 'VT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يكشف بالعين المجردة أو بالمنظار من داخل الأنبوب كأخدود مرئي غير مصهور في الجذر.',
        descriptionEn: 'Easily observed from inside open-bore piping using direct visual or borescope inspection.'
      },
      {
        method: 'PT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يكشف بوضوح إذا كان سطح الجذر متاحاً للتطبيق والتنظيف.',
        descriptionEn: 'Immediately detected if the root side is accessible for penetrant processing.'
      },
      {
        method: 'MT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يكشف على سطح الجذر، وفي بعض الحالات الرقيقة من السطح المقابل باستخدام HWAC/DC.',
        descriptionEn: 'Excellent on accessible root; occasionally detectable from cap side in thin walls using HWAC.'
      },
      {
        method: 'ET',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'مطبق من داخل الأنابيب ذات القطر الصغير بمسابر داخلية (Bobbin Probes).',
        descriptionEn: 'Useful from ID using internal rotating or bobbin probes.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'مرفوض كلياً في معظم أوعية الضغط والمواسير الحرجة؛ تسمح API 1104 بطول تراكمي محدد (مثلاً 25 مم لكل 300 مم لحام) في خطوط الأنابيب العامة.',
    asmeAwsAcceptanceCriteriaEn: 'Zero allowance under ASME Sec VIII & B31.3; API 1104 permits up to 25mm aggregate in 300mm length for cross-country pipelines.',
    preventionMethodAr: 'ضبط فجوة الجذر بدقة (2.5 إلى 3.2 مم)، ترقيق وجه الجذر (1.5 مم)، وضمان وصول قطب اللحام لعمق الجذر مع تيار ملائم.',
    preventionMethodEn: 'Ensure adequate root gap (2.5-3.2 mm), correct root face height (~1.5 mm), and proper root pass amperage.'
  },
  {
    id: 'defect-thermal-fatigue-cracks',
    nameAr: 'شروخ الكلال الحراري والميكانيكي (Fatigue Cracking)',
    nameEn: 'Mechanical & Thermal Fatigue Cracks',
    origin: 'In-Service Degradation',
    originAr: 'أثناء الخدمة والتشغيل الدوري',
    criticality: 'Critical (Rejection Mandatory)',
    criticalityAr: 'حرج جداً (مرفوض قطعياً)',
    morphologyAr: 'شروخ دقيقة تبدأ من السطح عند نقاط تركيز الإجهاد (أصابع اللحام، التآكل، الثقوب) وتنتشر عمودياً على اتجاه الإجهادات المتكررة.',
    morphologyEn: 'Fine, tight cracks initiating at surface stress concentrators and propagating perpendicular to cyclic principal tensile stress.',
    rootCausesAr: [
      'أحمال ميكانيكية متذبذبة ومتكررة تتجاوز حد الكلال (Endurance Limit).',
      'دورات تسخين وتبريد سريعة متكررة تسبب تمدداً وانكماشاً حرارياً مقيداً.',
      'وجود عيوب هندسية كالحفر السفلي أو شروخ تصنيعية عملت كبادئ للشرخ.'
    ],
    rootCausesEn: [
      'Repetitive cyclic loading exceeding structural fatigue threshold.',
      'Cyclic thermal transients generating restrained expansion and contraction.',
      'Pre-existing geometrical notches (undercut, excess weld toe angle) serving as initiation sites.'
    ],
    detectionMatrix: [
      {
        method: 'MT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'الطريقة الأفضل عالمياً للشروخ السطحية في الفولاذ الكربوني باستخدام التيار المتناوب AC والمساحيق المضيئة.',
        descriptionEn: 'Benchmark method for ferromagnetic materials using AC yoke and fluorescent wet magnetic particles.'
      },
      {
        method: 'PT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'ممتازة للسبائك غير المغناطيسية (ستانلس ستيل، ألومنيوم، إنكونيل) باستخدام النوع الفلوري Type I.',
        descriptionEn: 'Superior for non-magnetic alloys (austenitic stainless, nickel alloys) using Type I fluorescent penetrant.'
      },
      {
        method: 'ET',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'قادرة على كشف شروخ الكلال السطحية حتى من خلال طبقات الطلاء والدهان بسماكة تصل إلى 2 مم دون الحاجة لإزالته.',
        descriptionEn: 'Can detect tight surface fatigue cracks through non-conductive paint coatings up to 2mm thick without paint stripping.'
      },
      {
        method: 'UT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'ضرورية لتحديد عمق الشرخ داخل الجدار (Depth Sizing) باستخدام تقنيات TOFD وPAUT.',
        descriptionEn: 'Crucial for determining crack propagation depth and remaining wall ligament using TOFD and PAUT.'
      },
      {
        method: 'RT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'ضعيفة جداً لأن شروخ الكلال ضيقة ومحكمة (Tight) ولا تظهر إلا إذا كانت عميقة جداً وبمحاذاة تامة مع حزمة الأشعة.',
        descriptionEn: 'Low probability of detection due to tight crack closure unless beam orientation matches crack plane exactly.'
      },
      {
        method: 'VT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'ممكنة عند استخدام عدسات مكبرة (5x إلى 10x) وإضاءة مائلة مساعدة بعد تنظيف السطح.',
        descriptionEn: 'Detects macro-cracks with high magnification and angled lighting after rigorous cleaning.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'مرفوض كلياً تحت جميع ظروف التشغيل؛ يتطلب تقييم صلاحية الخدمة (FFS per API 579) أو الاستبدال الفوري.',
    asmeAwsAcceptanceCriteriaEn: 'Zero tolerance under any code; requires engineering fitness-for-service assessment (API 579) or repair/replacement.',
    preventionMethodAr: 'تنعيم أصابع اللحام بالتجليخ (Toe Grinding / TIG Dressing) لتقليل تركيز الإجهاد، وعزل الاهتزازات الميكانيكية.',
    preventionMethodEn: 'Weld toe profile grinding / TIG dressing to eliminate stress risers, vibration dampening, and cyclic thermal control.'
  },
  {
    id: 'defect-porosity-wormhole',
    nameAr: 'المسامية ومسامية الأنابيب المتعرجة (Porosity & Wormholes)',
    nameEn: 'Porosity & Wormhole Porosity',
    origin: 'Welding',
    originAr: 'أثناء اللحام (حبس الغازات)',
    criticality: 'Minor / Acceptable within limits',
    criticalityAr: 'ثانوي (مقبول ضمن حدود هندسية محددة)',
    morphologyAr: 'تجاويف كروية أو أسطوانية ناعمة الجدران محبوسة في باطن اللحام تنشأ عن انحباس الغازات المنبعثة أثناء التجمد.',
    morphologyEn: 'Smooth-walled spherical or cylindrical voids entrapped within solidifying weld metal from evolving gases.',
    rootCausesAr: [
      'رطوبة على أقطاب اللحام أو داخل بودرة الفلكس.',
      'رياح شديدة تشتت غاز الحماية (Shielding Gas) في لحام MIG أو TIG.',
      'وجود زيوت، صدأ، دهان، أو رطوبة على أسطح شطفة اللحام قبل البدء.'
    ],
    rootCausesEn: [
      'Moisture on welding electrodes or submerged arc flux.',
      'Wind drafts blowing away shielding gas in GMAW or GTAW processes.',
      'Contaminants (oil, rust, paint, grease) on joint preparation faces.'
    ],
    detectionMatrix: [
      {
        method: 'RT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'الطريقة المثالية لكشف المسامية؛ تظهر كبقع دائرية داكنة ذات حدود ناعمة محددة بوضوح على الفيلم أو الكاشف الرقمي.',
        descriptionEn: 'Benchmark method; appears as distinct, well-defined dark rounded spots on radiographs.'
      },
      {
        method: 'UT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'تعطي أصداء صغيرة نسبياً ذات سعة متذبذبة لأن الأسطح الكروية تشتت الصوت في جميع الاتجاهات دون انعكاس مرآوي قوي.',
        descriptionEn: 'Moderate amplitude echoes; spherical geometry scatters ultrasound omnidirectionally.'
      },
      {
        method: 'VT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'تكشف فقط إذا وصلت المسامية إلى غطاء اللحام السطحي (Surface Porosity).',
        descriptionEn: 'Detects only surface-breaking pinholes on the weld cap.'
      },
      {
        method: 'PT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'تكشف بحساسية فائقة المسامية والفتحات الميكروية المفتوحة على السطح وتظهر كنقاط دائرية متوهجة.',
        descriptionEn: 'Highly sensitive for pinholes breaking out to accessible surfaces.'
      },
      {
        method: 'MT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'ضعيفة للمسامية العميقة؛ تكشف فقط المسام المفتوحة على السطح مباشرة.',
        descriptionEn: 'Poor for internal porosity; resolves only surface-breaking pores.'
      },
      {
        method: 'ET',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'غير مخصصة للمسامية الحجمية العميقة.',
        descriptionEn: 'Not recommended for buried volumetric gas voids.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'تسمح ASME Sec VIII وAWS D1.1 بمسامية متفرقة بأقطار تقل عن 1/4 السمك وبحد أقصى 4 مم، مع شروط للمسافات التراكمية.',
    asmeAwsAcceptanceCriteriaEn: 'ASME Sec VIII App. 4 charts allow isolated spherical porosity under 1/4 thickness (max 4mm); piping codes regulate cluster spacing.',
    preventionMethodAr: 'تجفيف أقطاب اللحام في الأفران المعتمدة، تنظيف الشطفة حتى اللمعان المعدني، وتوفير حواجز واقية من الرياح.',
    preventionMethodEn: 'Bake low-hydrogen electrodes in holding ovens, grind joint prep to bright metal, and install wind shelters.'
  },
  {
    id: 'defect-slag-inclusions',
    nameAr: 'شمولات الخبث غير المعدني (Slag Inclusions)',
    nameEn: 'Non-Metallic Slag Inclusions',
    origin: 'Welding',
    originAr: 'أثناء اللحام (عمليات اللحام بالقوس المغطى)',
    criticality: 'Major',
    criticalityAr: 'رئيسي (يسمح بحدود طولية محددة)',
    morphologyAr: 'مركبات أكسيدية وغير معدنية محتجزة في باطن اللحام ذات حواف متموجة أو غير منتظمة بين مسارات اللحام المتجاورة.',
    morphologyEn: 'Nonmetallic solid oxides and flux residues entrapped within weld metal, featuring irregular or jagged boundaries.',
    rootCausesAr: [
      'عدم إزالة الخبث بالشاكوش والفرشاة والتجليخ بين مسارات اللحام المتتالية.',
      'تذبذب تيار اللحام أو زاوية سلك اللحام غير المناسبة مما يؤدي لسبق الخبث لحمام المصهور.',
      'وجود شطفات ضيقة جداً ذات زوايا حادة يصعب تنظيفها.'
    ],
    rootCausesEn: [
      'Inadequate deslagging and wire brushing between successive weld passes.',
      'Incorrect electrode angle allowing molten slag to run ahead of the arc.',
      'Narrow joint bevel groove preventing complete slag clearing.'
    ],
    detectionMatrix: [
      {
        method: 'RT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'تظهر كدلالات داكنة متموجة غير منتظمة الحواف تتبع عادة خط مسارات اللحام.',
        descriptionEn: 'Appears as elongated dark indications with irregular, wavy boundaries parallel to weld passes.'
      },
      {
        method: 'UT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'تعطي أصداء متعددة القمم (Multi-peaked signals) عند تحريك المسبار بسبب خشونة أسطح الخبث.',
        descriptionEn: 'Produces jagged, multi-peaked echoes as probe traverses across rough irregular slag interfaces.'
      },
      {
        method: 'VT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'لا تكشف الخبث الداخلي المدفون تحت السطح.',
        descriptionEn: 'Cannot detect internal subsurface slag.'
      },
      {
        method: 'PT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'تكشف الخبث المفتوح على السطح فقط بعد إزالة التدفق الخارجي.',
        descriptionEn: 'Detects surface-exposed slag cavities.'
      },
      {
        method: 'MT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'تكشف الخبث القريب من السطح حتى عمق 2-3 مم بتيار HWAC.',
        descriptionEn: 'Detects near-surface slag using HWAC.'
      },
      {
        method: 'ET',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'غير مخصصة لكشف الخبث في اللحامات الفولاذية.',
        descriptionEn: 'Not suited for weld slag detection.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'تحدد ASME Sec VIII وAWS D1.1 طول الخبث المسموح به كدالة في سمك الجدار (مثلاً طول فردي لا يتجاوز 6 مم للسمك حتى 19 مم).',
    asmeAwsAcceptanceCriteriaEn: 'Governed by length charts in ASME UW-51 and AWS D1.1 (isolated slag <= 6mm for thicknesses up to 19mm).',
    preventionMethodAr: 'التنظيف والتجليخ الميكانيكي الدقيق للخبث بين كل مسار وآخر، والتحكم في زاوية وحركة القطب.',
    preventionMethodEn: 'Rigorous interpass deslagging with chipping hammer and power grinder, plus optimal electrode progression.'
  },
  {
    id: 'defect-undercut-groove',
    nameAr: 'الحفر السفلي عند أصابع اللحام (Undercut)',
    nameEn: 'Weld Toe Undercut',
    origin: 'Welding',
    originAr: 'أثناء اللحام (أصابع وغطاء اللحام)',
    criticality: 'Major',
    criticalityAr: 'رئيسي (محدد بعمق وأطوال دقيقة في الكود)',
    morphologyAr: 'أخدود أو حفرة ميكانيكية انصهرت في معدن الأساس بمحاذاة أصابع اللحام (Toe) دون أن تملأ بمعدن اللحام.',
    morphologyEn: 'A sharp groove or notch melted into base metal adjacent to the weld toe and left unfilled by weld puddle.',
    rootCausesAr: [
      'تيار لحام مرتفع جداً (Amperage too high).',
      'جهد القوس الكهربي عالي جداً (Arc length too long).',
      'سرعة حركة اللحام مفرطة أو توجيه خاطئ للقطب نحو حافة الشطفة دون وقوف كافٍ عند الأطراف (Dwell Time).'
    ],
    rootCausesEn: [
      'Excessive welding current (amperage too high).',
      'Excessive arc voltage / arc length too long.',
      'Excessive travel speed or improper weaving dwell at joint edges.'
    ],
    detectionMatrix: [
      {
        method: 'VT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'الطريقة الأساسية للكشف والقياس؛ يُقاس عمقه بدقة باستخدام مقياس كامبريدج أو مقياس الحفر الميكانيكي.',
        descriptionEn: 'Primary inspection method; depth is measured directly using Cambridge gauge or dial pit gauge.'
      },
      {
        method: 'PT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يظهر كخط متصل ملون أو فلوري بمحاذاة حافة اللحام.',
        descriptionEn: 'Shows as a distinct continuous linear indication running along the weld toe.'
      },
      {
        method: 'MT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'تتجمع الجسيمات المغناطيسية بكثافة داخل أخدود الحفر السفلي بفضل تسرب الفيض.',
        descriptionEn: 'Magnetic particles gather densely in the undercut notch due to localized flux leakage.'
      },
      {
        method: 'RT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'يظهر كشريط داكن عريض نوعاً ما ذي حافة خارجية غير حادة بمحاذاة خط اللحام.',
        descriptionEn: 'Appears on radiographs as an irregular dark band along the outer weld edge boundary.'
      },
      {
        method: 'UT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'يكشف بالمسبار الزاوي كصدى سطحي يقع عند موضع أصابع اللحام في الرجل الأولى أو الثانية.',
        descriptionEn: 'Identified by angle beam shear wave as a surface toe echo.'
      },
      {
        method: 'ET',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'يكشف الأخدود بدقة ويفصل بين عمق الحفر السفلي والشروخ السطحية المرافقة.',
        descriptionEn: 'Resolves notch depth and distinguishes undercut from toe fatigue cracking.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'تشترط AWS D1.1 ألا يتجاوز عمق الحفر 1 مم للسمك حتى 25 مم، وبحد أقصى 1.6 مم للألواح الأسمك؛ وASME B31.3 يمنع تجاوزه 1 مم أو 10% من السمك.',
    asmeAwsAcceptanceCriteriaEn: 'AWS D1.1 limits depth to <= 1mm for t <= 25mm (max 1.6mm for thicker plate); ASME B31.3 restricts to <= 1mm or 10% of nominal wall.',
    preventionMethodAr: 'خفض تيار اللحام، تقليل طول القوس الكهربي، تهدئة سرعة الحركة، والوقوف عند حواف المسار لملء الحفر.',
    preventionMethodEn: 'Reduce welding amperage, shorten arc length, moderate travel speed, and increase weaving dwell at groove edges.'
  },
  {
    id: 'defect-lamellar-tearing',
    nameAr: 'التمزق الصفيحي في الألواح السميكة (Lamellar Tearing)',
    nameEn: 'Lamellar Tearing in Heavy Plate',
    origin: 'Welding',
    originAr: 'أثناء اللحام (إجهادات الانكماش عبر السمك Z-Direction)',
    criticality: 'Critical (Rejection Mandatory)',
    criticalityAr: 'حرج جداً (مرفوض قطعياً)',
    morphologyAr: 'تمزقات وانفصالات مدرجة تشبه السلالم (Terraced / Stepped Cracks) تنمو موازية لأسطح الألواح المدرفلة أسفل خط اللحام مباشرة.',
    morphologyEn: 'Stepped, terraced subterranean ruptures propagating parallel to plate rolling direction beneath high-restraint T- and corner welds.',
    rootCausesAr: [
      'إجهادات شد وانكماش عالية جداً في اتجاه سمك اللوحة (Through-Thickness / Z-Direction).',
      'وجود شمولات غير معدنية مفلطحة من كبريتيدات المنجنيز وسيليكات الألومنيوم موازية لسطح الدرفلة.',
      'تصميم وصلات زاوية (T-Joints / Corner Joints) ذات تقييد عالي وألواح سميكة (>25 مم).'
    ],
    rootCausesEn: [
      'High through-thickness (Z-direction) tensile contraction shrinkage stresses.',
      'Elongated planar non-metallic inclusions (manganese sulfides, silicates) from rolling.',
      'Highly restrained full-penetration T- and corner joint geometries on heavy plate (>25mm).'
    ],
    detectionMatrix: [
      {
        method: 'UT',
        detectability: 'High',
        detectabilityAr: 'عالية جداً',
        descriptionAr: 'الطريقة الأساسية لكشف التمزق الصفيحي المدفون تحت اللحام بالموجات الطولية المستقيمة (0°) والمسابر الزاوية.',
        descriptionEn: 'Primary inspection method; straight-beam (0°) and angle-beam UT detect stepped subsurface tears.'
      },
      {
        method: 'VT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'لا يرى إلا إذا امتد التمزق وخرج إلى حافة اللوحة المكشوفة.',
        descriptionEn: 'Invisible unless tearing propagates to plate exterior edges.'
      },
      {
        method: 'PT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'تكشف التمزقات الواصلة إلى حواف اللوحة الجانبية.',
        descriptionEn: 'Detects tears emerging onto edge surfaces.'
      },
      {
        method: 'MT',
        detectability: 'Moderate',
        detectabilityAr: 'متوسطة',
        descriptionAr: 'تكشف التمزقات عند حواف الألواح المكشوفة.',
        descriptionEn: 'Detects edge-breaking lamellar indications.'
      },
      {
        method: 'RT',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'ضعيفة جداً لأن اتجاه التمزقات الموازي لسطح اللوحة يكون متعامداً مع شعاع الأشعة.',
        descriptionEn: 'Low detectability because tearing plane is perpendicular to radiation beam.'
      },
      {
        method: 'ET',
        detectability: 'Low',
        detectabilityAr: 'منخفضة',
        descriptionAr: 'غير مخصصة لكشف التمزق الصفيحي العميق.',
        descriptionEn: 'Not applicable for deep lamellar tearing.'
      }
    ],
    asmeAwsAcceptanceCriteriaAr: 'مرفوض كلياً؛ يعتبر عيباً إنشائياً مدمراً يستلزم إزالة اللحام ومعدن الأساس المتضرر واستبداله أو إعادة تصميمه.',
    asmeAwsAcceptanceCriteriaEn: 'Zero tolerance under AWS D1.1 and ASME; constitutes severe structural failure requiring excavation and redesign.',
    preventionMethodAr: 'استخدام فولاذ عالي المطيلية في اتجاه السمك (Z-Grade Steel per ASTM A770)، وتعديل تصميم الوصلة لتوزيع إجهادات الانكماش.',
    preventionMethodEn: 'Specify through-thickness ductile steel (Z-quality per ASTM A770), buttering layers, and joint redesign to relieve Z-strain.'
  }
];

export const NDT_INTERACTIVE_FORMULAS: NdtFormula[] = [
  {
    id: 'formula-ut-near-field',
    nameAr: 'حساب مسافة الحقل القريب للمسبار فوق الصوتي (Near Field - N)',
    nameEn: 'Ultrasonic Transducer Near Field Distance (N)',
    method: 'UT',
    formulaLatex: 'N = \\frac{D^2 - \\lambda^2}{4\\lambda} \\approx \\frac{D^2 \\cdot f}{4 \\cdot v}',
    descriptionAr: 'تحسب مسافة الحقل القريب (منطقة فرينل) التي تتذبذب فيها سعة ضغط الصوت بشدة، حيث لا يجوز الاعتماد على سعة الصدى لتقدير حجم العيوب داخل هذه المنطقة.',
    descriptionEn: 'Calculates the Fresnel near-field distance where acoustic pressure oscillates heavily; flaw sizing by amplitude is invalid inside this zone.',
    variables: [
      { symbol: 'D', nameAr: 'قطر الكريستالة الفعال', nameEn: 'Transducer Element Diameter', unit: 'mm', defaultValue: 12.7, min: 3, max: 50, step: 0.5 },
      { symbol: 'f', nameAr: 'التردد الاسمي للمسبار', nameEn: 'Probe Frequency', unit: 'MHz', defaultValue: 4.0, min: 0.5, max: 20, step: 0.5 },
      { symbol: 'v', nameAr: 'سرعة الصوت في المادة', nameEn: 'Acoustic Sound Velocity', unit: 'm/s', defaultValue: 5920, min: 1000, max: 7000, step: 10 }
    ],
    calculate: (inputs) => {
      const D = inputs.D; // mm
      const f = inputs.f * 1e6; // Hz
      const v = inputs.v * 1000; // mm/s
      const lambda = v / f; // mm
      const N = (D * D) / (4 * lambda);
      return {
        result: parseFloat(N.toFixed(2)),
        unit: 'mm',
        formattedAr: `مسافة الحقل القريب (N) = ${N.toFixed(1)} مم (الطول الموجي λ = ${lambda.toFixed(2)} مم)`,
        formattedEn: `Near Field (N) = ${N.toFixed(1)} mm (Wavelength λ = ${lambda.toFixed(2)} mm)`,
        explanationAr: `حتى مسافة ${N.toFixed(1)} مم من وجه المسبار تقع منطقة الحقل القريب (Fresnel Zone). أي عيوب تقع بعد هذه المسافة تقع في الحقل البعيد (Fraunhofer Zone) حيث يتناقص الضغط بانتظام مع المسافة ويمكن تطبيق منحنيات DAC وDGS بدقة.`,
        explanationEn: `Up to ${N.toFixed(1)} mm from probe face is the near field (Fresnel zone). Flaws beyond this boundary reside in the far field (Fraunhofer zone) where sound decays smoothly and DAC/DGS sizing is valid.`
      };
    }
  },
  {
    id: 'formula-snells-law',
    nameAr: 'قانون سنيل للانكسار وحساب زوايا مسابر الفحص (Snell’s Law)',
    nameEn: 'Snell’s Law & Refracted Angle Calculator',
    method: 'UT',
    formulaLatex: '\\frac{\\sin \\theta_1}{v_1} = \\frac{\\sin \\theta_2}{v_2} \\implies \\theta_2 = \\arcsin\\left( \\frac{v_2}{v_1} \\cdot \\sin \\theta_1 \\right)',
    descriptionAr: 'حساب زاوية انكسار الموجة القصية أو الطولية داخل المعدن بمعرفة زاوية ميل الإسفين وسرعات الصوت في الوسطين.',
    descriptionEn: 'Calculates the refracted wave angle inside steel given the wedge incident angle and material velocities.',
    variables: [
      { symbol: 'theta1', nameAr: 'زاوية السقوط في الإسفين', nameEn: 'Incident Angle in Wedge', unit: 'deg', defaultValue: 38.0, min: 0, max: 80, step: 0.5 },
      { symbol: 'v1', nameAr: 'سرعة الصوت في الإسفين (Lucite)', nameEn: 'Wedge Velocity (Lucite)', unit: 'm/s', defaultValue: 2730, min: 2000, max: 3500, step: 10 },
      { symbol: 'v2', nameAr: 'سرعة الصوت القصية في المعدن', nameEn: 'Refracted Velocity (Steel Shear)', unit: 'm/s', defaultValue: 3240, min: 2500, max: 6500, step: 10 }
    ],
    calculate: (inputs) => {
      const theta1Rad = (inputs.theta1 * Math.PI) / 180;
      const sinTheta2 = (inputs.v2 / inputs.v1) * Math.sin(theta1Rad);
      if (sinTheta2 > 1.0) {
        return {
          result: 90,
          unit: 'deg (Total Reflection)',
          formattedAr: `تجاوزت الزاوية الحرجة (انعكاس كلي داخل الإسفين)`,
          formattedEn: `Beyond critical angle (Total internal reflection)`,
          explanationAr: `زاوية السقوط ${inputs.theta1}° تجاوزت الزاوية الحرجة لهذا النمط من الموجات، وبالتالي لن ينفذ الصوت إلى داخل القطعة.`,
          explanationEn: `Incident angle ${inputs.theta1}° exceeds the critical angle for this velocity pairing; no refraction occurs.`
        };
      }
      const theta2Rad = Math.asin(sinTheta2);
      const theta2Deg = (theta2Rad * 180) / Math.PI;
      return {
        result: parseFloat(theta2Deg.toFixed(1)),
        unit: 'deg',
        formattedAr: `زاوية الانكسار في المعدن (θ₂) = ${theta2Deg.toFixed(1)}°`,
        formattedEn: `Refracted Angle (θ₂) = ${theta2Deg.toFixed(1)}°`,
        explanationAr: `زاوية انكسار الصوت الناتجة داخل المعدن هي ${theta2Deg.toFixed(1)}°. وهي زاوية المسح الفعلية التي يجب ضبط جهاز الـ UT عليها.`,
        explanationEn: `The actual refracted inspection angle inside the steel is ${theta2Deg.toFixed(1)}°. Configure instrument calibration angle to this value.`
      };
    }
  },
  {
    id: 'formula-acoustic-beam-divergence',
    nameAr: 'حساب زاوية تشتت الحزمة الصوتية (Beam Spread Angle - θ)',
    nameEn: 'Ultrasonic Beam Divergence Angle (θ)',
    method: 'UT',
    formulaLatex: '\\sin \\theta_0 = 1.22 \\cdot \\frac{\\lambda}{D}, \\quad \\sin \\theta_{-6\\text{dB}} = 0.51 \\cdot \\frac{\\lambda}{D}',
    descriptionAr: 'حساب زاوية تشتت وانفراج الحزمة الصوتية في الحقل البعيد لتحديد مدى تغطية العيوب وتجنب الانعكاسات الكاذبة من جدران القطعة.',
    descriptionEn: 'Calculates the Fraunhofer beam spread half-angle to evaluate inspection coverage and avoid sidewall reflections.',
    variables: [
      { symbol: 'D', nameAr: 'قطر الكريستالة الفعال', nameEn: 'Crystal Diameter', unit: 'mm', defaultValue: 12.7, min: 3, max: 35, step: 0.5 },
      { symbol: 'f', nameAr: 'تردد المسبار', nameEn: 'Probe Frequency', unit: 'MHz', defaultValue: 4.0, min: 0.5, max: 15, step: 0.5 },
      { symbol: 'v', nameAr: 'سرعة الصوت في المادة', nameEn: 'Sound Velocity', unit: 'm/s', defaultValue: 5920, min: 1000, max: 7000, step: 10 }
    ],
    calculate: (inputs) => {
      const D = inputs.D;
      const lambda = (inputs.v * 1000) / (inputs.f * 1e6); // mm
      const sinEdge = (1.22 * lambda) / D;
      const sin6dB = (0.51 * lambda) / D;
      const degEdge = sinEdge <= 1.0 ? (Math.asin(sinEdge) * 180) / Math.PI : 90;
      const deg6dB = sin6dB <= 1.0 ? (Math.asin(sin6dB) * 180) / Math.PI : 90;
      return {
        result: parseFloat(deg6dB.toFixed(1)),
        unit: 'deg',
        formattedAr: `زاوية انفراج الحزمة عند -6dB = ${deg6dB.toFixed(1)}° (إلى الحافة = ${degEdge.toFixed(1)}°)`,
        formattedEn: `Beam Spread (-6dB) = ${deg6dB.toFixed(1)}° (Zero-edge = ${degEdge.toFixed(1)}°)`,
        explanationAr: `تنفرج الحزمة الصوتية بزاوية نصف انفراج ${deg6dB.toFixed(1)}° عند انخفاض سعة الإشارة إلى النصف (-6 dB). القطر الأكبر والتردد الأعلى يقللان الانفراج ويجعلان الحزمة أكثر تركيزاً.`,
        explanationEn: `The acoustic beam diverges with a half-angle of ${deg6dB.toFixed(1)}° at -6dB drop. Larger crystal diameter and higher frequency minimize beam spread.`
      };
    }
  },
  {
    id: 'formula-inverse-square-law',
    nameAr: 'قانون التربيع العكسي للإشعاع وحساب زمن التعريض والمسافة',
    nameEn: 'Inverse Square Law for Radiation & Exposure Time',
    method: 'RT',
    formulaLatex: '\\frac{I_1}{I_2} = \\frac{d_2^2}{d_1^2} \\implies T_2 = T_1 \\cdot \\left(\\frac{d_2}{d_1}\\right)^2',
    descriptionAr: 'حساب زمن التعريض الجديد أو معدل الجرعة الإشعاعية عند تغيير مسافة المصدر عن الفيلم (SFD) أو حساب المسافة الآمنة للطوق.',
    descriptionEn: 'Calculates adjusted exposure time or radiation intensity when Source-to-Film Distance (SFD) changes.',
    variables: [
      { symbol: 't1', nameAr: 'زمن التعريض الأولي', nameEn: 'Initial Exposure Time', unit: 'min', defaultValue: 3.0, min: 0.1, max: 60, step: 0.1 },
      { symbol: 'd1', nameAr: 'المسافة الأولية (SFD 1)', nameEn: 'Initial Distance (SFD 1)', unit: 'cm', defaultValue: 50.0, min: 10, max: 300, step: 5 },
      { symbol: 'd2', nameAr: 'المسافة الجديدة (SFD 2)', nameEn: 'Target Distance (SFD 2)', unit: 'cm', defaultValue: 70.0, min: 10, max: 300, step: 5 }
    ],
    calculate: (inputs) => {
      const t1 = inputs.t1;
      const d1 = inputs.d1;
      const d2 = inputs.d2;
      const t2 = t1 * Math.pow(d2 / d1, 2);
      return {
        result: parseFloat(t2.toFixed(2)),
        unit: 'min',
        formattedAr: `زمن التعريض الجديد (T₂) = ${t2.toFixed(2)} دقيقة (${(t2 * 60).toFixed(0)} ثانية)`,
        formattedEn: `New Exposure Time (T₂) = ${t2.toFixed(2)} min (${(t2 * 60).toFixed(0)} sec)`,
        explanationAr: `بزيادة المسافة من ${d1} سم إلى ${d2} سم، زاد زمن التعريض المطلوب للحصول على نفس الكثافة البصرية على الفيلم بمقدار ${(t2 / t1).toFixed(2)} ضعفاً.`,
        explanationEn: `Increasing distance from ${d1} cm to ${d2} cm requires exposure time to scale by ${(t2 / t1).toFixed(2)}x to maintain identical film density.`
      };
    }
  },
  {
    id: 'formula-radiation-attenuation-hvl',
    nameAr: 'توهين الإشعاع وحساب سمك النصف (Half-Value Layer - HVL)',
    nameEn: 'Radiation Attenuation & Half-Value Layer (HVL)',
    method: 'RT',
    formulaLatex: 'I = I_0 \\cdot e^{-\\mu x} = I_0 \\cdot (0.5)^{\\frac{x}{HVL}}',
    descriptionAr: 'حساب الشدة الإشعاعية المتبقية بعد المرور في درع واقٍ أو جدار معدني، وتحديد عدد طبقات HVL المطلوبة للسلامة.',
    descriptionEn: 'Calculates residual radiation intensity penetrating an absorber and counts required HVL shielding layers.',
    variables: [
      { symbol: 'I0', nameAr: 'الشدة الإشعاعية الابتدائية', nameEn: 'Initial Intensity (I₀)', unit: 'µSv/h', defaultValue: 1000.0, min: 1, max: 100000, step: 10 },
      { symbol: 'x', nameAr: 'سمك الدرع أو الجدار', nameEn: 'Shield Thickness (x)', unit: 'mm', defaultValue: 37.5, min: 1, max: 200, step: 0.5 },
      { symbol: 'hvl', nameAr: 'سمك النصف للمادة (HVL)', nameEn: 'Half-Value Layer (HVL)', unit: 'mm', defaultValue: 12.5, min: 1, max: 50, step: 0.5 }
    ],
    calculate: (inputs) => {
      const I0 = inputs.I0;
      const x = inputs.x;
      const hvl = inputs.hvl;
      const n = x / hvl;
      const I = I0 * Math.pow(0.5, n);
      return {
        result: parseFloat(I.toFixed(2)),
        unit: 'µSv/h',
        formattedAr: `الشدة النافذة (I) = ${I.toFixed(1)} µSv/h (عدد طبقات النصف = ${n.toFixed(2)} HVL)`,
        formattedEn: `Transmitted Intensity (I) = ${I.toFixed(1)} µSv/h (${n.toFixed(2)} HVLs)`,
        explanationAr: `سمك ${x} مم يمثل ${n.toFixed(1)} طبقات نصف، مما يخفض الإشعاع بنسبة ${(100 - (I / I0) * 100).toFixed(1)}% من الشدة الأصلية.`,
        explanationEn: `Thickness of ${x} mm provides ${n.toFixed(1)} HVLs, blocking ${(100 - (I / I0) * 100).toFixed(1)}% of original radiation.`
      };
    }
  },
  {
    id: 'formula-geometric-unsharpness',
    nameAr: 'حساب عدم الحدة الهندسية في التصوير الإشعاعي (Geometric Unsharpness Ug)',
    nameEn: 'Geometric Unsharpness Calculator (Ug)',
    method: 'RT',
    formulaLatex: 'U_g = \\frac{F \\cdot d}{D}',
    descriptionAr: 'حساب ضبابية حواف الصورة الناتجة عن حجم البؤرة المشعة ومقارنتها بالحد الأقصى المسموح في كود ASME Sec V.',
    descriptionEn: 'Calculates penumbra blurring based on focal spot size and validates against ASME Sec V limits.',
    variables: [
      { symbol: 'F', nameAr: 'حجم البؤرة الفعالة للمصدر', nameEn: 'Effective Focal Spot Size', unit: 'mm', defaultValue: 3.0, min: 0.5, max: 8, step: 0.1 },
      { symbol: 'd', nameAr: 'المسافة من العيب إلى الفيلم (OFD)', nameEn: 'Object-to-Film Distance (d)', unit: 'mm', defaultValue: 25.0, min: 2, max: 150, step: 1 },
      { symbol: 'D', nameAr: 'المسافة من المصدر إلى العيب (SOD)', nameEn: 'Source-to-Object Distance (D)', unit: 'mm', defaultValue: 475.0, min: 50, max: 1500, step: 10 }
    ],
    calculate: (inputs) => {
      const F = inputs.F;
      const d = inputs.d;
      const D = inputs.D;
      const Ug = (F * d) / D;
      const asmeLimit = 0.51; // mm for wall <= 50mm
      const passes = Ug <= asmeLimit;
      return {
        result: parseFloat(Ug.toFixed(3)),
        unit: 'mm',
        formattedAr: `عدم الحدة (Ug) = ${Ug.toFixed(3)} مم [${passes ? 'مقبول طبقاً لـ ASME' : 'مرفوض - يتجاوز الحد'}]`,
        formattedEn: `Unsharpness (Ug) = ${Ug.toFixed(3)} mm [${passes ? 'PASS per ASME' : 'FAIL - Exceeds limit'}]`,
        explanationAr: `حد ASME Sec V لعدم الحدة الهندسية للسمك حتى 50 مم هو 0.51 مم (0.020 بوصة). القيمة المحسوبة ${Ug.toFixed(3)} مم تعتبر ${passes ? 'مقبولة وتضمن جودة صورة حادة' : 'مرفوضة ويلزم زيادة مسافة المصدر D'}.`,
        explanationEn: `ASME Sec V Article 2 limits Ug to 0.51 mm (0.020 in) for thickness <= 50mm. Computed Ug of ${Ug.toFixed(3)} mm is ${passes ? 'acceptable and sharp' : 'unacceptable; increase Source-to-Object Distance (SOD)'}.`
      };
    }
  },
  {
    id: 'formula-eddy-current-depth',
    nameAr: 'عمق الاختراق القياسي للتيارات الدوامية (Standard Depth of Penetration - δ)',
    nameEn: 'Eddy Current Standard Depth of Penetration (δ)',
    method: 'ET',
    formulaLatex: '\\delta = \\frac{1}{\\sqrt{\\pi \\cdot f \\cdot \\mu \\cdot \\sigma}} \\approx 50 \\cdot \\sqrt{\\frac{\\rho}{f \\cdot \\mu_r}}',
    descriptionAr: 'حساب العمق الذي تنخفض عنده كثافة التيارات الدوامية إلى 37% بفعل التأثير الجلدي (Skin Effect)، لتحديد التردد المناسب.',
    descriptionEn: 'Calculates the depth where eddy current density drops to 37% (1/e) due to the skin effect.',
    variables: [
      { symbol: 'f', nameAr: 'تردد الاختبار', nameEn: 'Test Frequency', unit: 'kHz', defaultValue: 100.0, min: 1, max: 2000, step: 5 },
      { symbol: 'rho', nameAr: 'المقاومة الكهربية للمعدن', nameEn: 'Resistivity (ρ)', unit: 'µΩ·cm', defaultValue: 2.82, min: 1.5, max: 120, step: 0.1 },
      { symbol: 'mur', nameAr: 'النفاذية المغناطيسية النسبية', nameEn: 'Relative Permeability (μr)', unit: 'ratio', defaultValue: 1.0, min: 1, max: 500, step: 1 }
    ],
    calculate: (inputs) => {
      const fKhz = inputs.f;
      const rho = inputs.rho;
      const mur = inputs.mur;
      const delta = 50 * Math.sqrt(rho / (fKhz * mur));
      const effectiveDepth = 3 * delta;
      return {
        result: parseFloat(delta.toFixed(2)),
        unit: 'mm',
        formattedAr: `عمق الاختراق القياسي (δ) = ${delta.toFixed(2)} مم (العمق الفعال 3δ = ${effectiveDepth.toFixed(1)} مم)`,
        formattedEn: `Standard Depth (δ) = ${delta.toFixed(2)} mm (Effective Depth 3δ = ${effectiveDepth.toFixed(1)} mm)`,
        explanationAr: `عند عمق ${delta.toFixed(2)} مم، تنخفض التيارات الدوامية إلى 37% من قيمتها السطحية. العمق الفعال للكشف (3δ) يصل إلى ${effectiveDepth.toFixed(1)} مم حيث تنخفض التيارات إلى 5%.`,
        explanationEn: `At depth ${delta.toFixed(2)} mm, current density drops to 37% of surface value. Effective penetration depth (3δ) reaches ${effectiveDepth.toFixed(1)} mm (5% density threshold).`
      };
    }
  },
  {
    id: 'formula-welding-heat-input',
    nameAr: 'حساب مدخل الحرارة وطاقة القوس في اللحام (Welding Heat Input)',
    nameEn: 'Welding Heat Input & Arc Energy Calculator',
    method: 'WELD',
    formulaLatex: 'H = \\frac{V \\cdot I \\cdot 60}{1000 \\cdot S} \\cdot \\eta',
    descriptionAr: 'حساب كمية الطاقة الحرارية المدخلة لكل وحدة طول من وصلة اللحام للتحكم في بنية المنطقة المتأثرة بالحرارة HAZ والصلادة.',
    descriptionEn: 'Calculates electrical thermal energy input per millimeter of weld bead to regulate cooling rate, microstructure and HAZ hardness.',
    variables: [
      { symbol: 'V', nameAr: 'جهد القوس الكهربي', nameEn: 'Arc Voltage (V)', unit: 'Volts', defaultValue: 24.0, min: 10, max: 45, step: 0.5 },
      { symbol: 'I', nameAr: 'تيار اللحام', nameEn: 'Welding Current (I)', unit: 'Amps', defaultValue: 160.0, min: 40, max: 500, step: 5 },
      { symbol: 'S', nameAr: 'سرعة حركة اللحام', nameEn: 'Travel Speed (S)', unit: 'mm/min', defaultValue: 180.0, min: 30, max: 1000, step: 10 },
      { symbol: 'eta', nameAr: 'كفاءة العملية الحرارية (η)', nameEn: 'Process Thermal Efficiency (η)', unit: 'ratio', defaultValue: 0.8, min: 0.5, max: 1.0, step: 0.05 }
    ],
    calculate: (inputs) => {
      const V = inputs.V;
      const I = inputs.I;
      const S = inputs.S;
      const eta = inputs.eta;
      const arcEnergy = (V * I * 60) / (1000 * S);
      const heatInput = arcEnergy * eta;
      return {
        result: parseFloat(heatInput.toFixed(2)),
        unit: 'kJ/mm',
        formattedAr: `مدخل الحرارة (Heat Input) = ${heatInput.toFixed(2)} kJ/mm (طاقة القوس = ${arcEnergy.toFixed(2)} kJ/mm)`,
        formattedEn: `Heat Input = ${heatInput.toFixed(2)} kJ/mm (Arc Energy = ${arcEnergy.toFixed(2)} kJ/mm)`,
        explanationAr: `مدخل الحرارة ${heatInput.toFixed(2)} kJ/mm يحكم معدل تبريد الوصلة. المدخل المنخفض جداً (<0.8) يسبب تبريداً سريعاً وتصلداً (شروخ باردة)، بينما المدخل المرتفع جداً (>2.5) يسبب نمواً حبيبياً وانخفاضاً في متانة الصدم (Impact Toughness).`,
        explanationEn: `Heat input of ${heatInput.toFixed(2)} kJ/mm dictates cooling rate. Excessively low heat input (<0.8 kJ/mm) risks martensitic embrittlement, while excessive heat input (>2.5 kJ/mm) promotes grain coarsening and degrades impact toughness.`
      };
    }
  }
];
