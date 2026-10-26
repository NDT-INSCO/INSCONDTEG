import { CurriculumLevel } from '../../../types';

/**
 * Level 1 — supervised technician stage for the conventional NDT discipline.
 *
 * Inserted between the academic foundations and the Level 2 professional stage
 * so the NDE-Ed course lessons have a real curriculum module to open, and so the
 * "Level 1" level referenced by those lessons actually exists.
 *
 * Every module is written to be measurable: an action verb in the outcome, a
 * named practical exercise, a pass condition, and an explicit limits note.
 */
export const conventionalNdtLevel1: CurriculumLevel = {
  levelId: 'level1',
  tierCategory: 'level1',
  nameAr: 'المستوى الأول المهني (Level I Technician — تحت الإشراف)',
  nameEn: 'Level 1 Professional Stage (Technician under Supervision)',
  academicStageAr: 'التدريب التقني المنهجي على طرق الفحص الخمس مع إشراف مباشر من المستوى الثاني/الثالث',
  academicStageEn: 'Structured technician training across the five conventional methods under direct Level II/III supervision',
  targetRoleAr: 'تنفيذ الفحص وفق الإجراء المكتوب، وتسجيل النتائج، دون تقييم نهائي أو توقيع قبول',
  targetRoleEn: 'Perform examinations to the written procedure and record results, without final evaluation or acceptance signature',
  prerequisitesAr: 'إتمام المرحلة الأكاديمية أو ما يعادلها، وإحاطة بفيزياء الطريقة، وتدريب سلامة معتمد',
  prerequisitesEn: 'Academic foundations (or equivalent), method physics awareness, and documented safety induction',
  trainingHours: 160,
  experienceMonths: 3,
  internationalCerts: ['ASNT Level I (SNT-TC-1A)', 'ISO 9712 Level 1'],
  applicableCodes: ['ASME Sec V', 'ISO 9712', 'AWS D1.1 (VT/MT/PT/UT)', 'API 1104 (RT/UT)'],
  responsibilitiesAr: [
    'تحضير السطح والأدوات والمواد الاستهلاكية قبل الفحص والتحقق من صلاحيتها',
    'ضبط الجهاز على كتلة المعايرة أو المرجع المعتمد وتسجيل قراءات المعايرة',
    'تنفيذ نمط المسح المحدد في الإجراء وتغطية 100% من المنطقة المطلوبة',
    'تسجيل المؤشرات وإحداثياتها وأبعادها دون إصدار قرار قبول أو رفض',
    'إبلاغ المستوى الثاني فوراً بأي مؤشر غير متوقع أو خلل في الجهاز',
    'الالتزام بحدود الصلاحية: لا تفسير نهائي، لا توقيع تقرير قبول، لا تعديل إجراء'
  ],
  responsibilitiesEn: [
    'Prepare surfaces, equipment, and consumables and verify their validity before examination',
    'Set up the instrument on the approved calibration block or reference and record calibration readings',
    'Execute the scan pattern defined by the procedure and cover 100% of the required area',
    'Record indications with coordinates and dimensions without issuing an accept/reject decision',
    'Report any unexpected indication or equipment fault to the Level II immediately',
    'Respect competence limits: no final interpretation, no acceptance signature, no procedure revision'
  ],
  modules: [
    {
      id: 'mod_c_vt',
      titleAr: 'الوحدة VT-1: الفحص البصري — الإدراك والإضاءة وتوثيق اللحام',
      titleEn: 'Module VT-1: Visual Testing — Perception, Illumination and Weld Records',
      duration: '24 ساعة (12 نظري + 12 عملي)',
      topicsAr: [
        'فيزياء الإبصار: حدة التباين، التكيّف، والعمى المؤقت للرؤية المركزية',
        'الإضاءة: شدة الإضاءة على السطح (lux)، اتجاه مصدر الضوء، وتجنب الانبهار',
        'الأدوات: المرايا، المناظير، المسابر المرنة (borescope)، وكاميرات الفحص',
        'قياس هندسة اللحام: ارتفاع التاج، القضم، Hi-Lo، زاوية إصبع اللحام',
        'التوثيق: رقم الإجراء، الأداة، الإضاءة، الموقع، والصور المرجعية'
      ],
      topicsEn: [
        'Visual physiology: contrast sensitivity, dark adaptation, and temporary central vision loss',
        'Illumination: surface illuminance (lux), light direction, and glare avoidance',
        'Access tools: mirrors, magnifiers, flexible borescopes, and inspection cameras',
        'Weld geometry measurement: cap height, undercut, Hi-Lo, weld toe angle',
        'Records: procedure number, instrument, illumination, location, and reference photographs'
      ],
      learningOutcomesAr: [
        'يضبط الإضاءة السطحية عند 500 lux على الأقل ويسجل القيمة في التقرير',
        'يقيس Hi-Lo وارتفاع التاج والقضم بدقة ±0.5 mm باستخدام مقياس مناسب',
        'يميز بين مؤشر حقيقي وانعكاس ضوئي أو بقايا تنظيف في ثلاث عينات',
        'يسجل نتيجة فحص واحدة كاملة دون إصدار قرار قبول أو رفض'
      ],
      learningOutcomesEn: [
        'Set surface illumination to at least 500 lux and record the measured value',
        'Measure Hi-Lo, cap height and undercut within ±0.5 mm using an appropriate gauge',
        'Distinguish a true indication from a light reflection or cleaning residue in three samples',
        'Complete one full examination record without issuing an accept or reject decision'
      ],
      quizId: 'vt-records-q1'
    },
    {
      id: 'mod_c_pt',
      titleAr: 'الوحدة PT-1: السائل النافذ — التنظيف والتطبيق والتطوير',
      titleEn: 'Module PT-1: Penetrant Testing — Cleaning, Application and Development',
      duration: '28 ساعة (12 نظري + 16 عملي)',
      topicsAr: [
        'التنظيف المسبق: إزالة الزيوت والصدأ وأثر اللحام وفتح العيوب السطحية',
        'التطبيق: الغمر، الرش، والفرشاة؛ زمن التشبع وزمن التصريف',
        'الإزالة: المسح الرطب والجاف وحدود الإفراط في الإزالة',
        'المطوّر: الجاف والرطب والذاتي؛ سماكة الطبقة وزمن التطوير',
        'السلامة: التهوية، معدات الحماية الفردية، وإدارة النفايات',
        'الحدود: لا يكشف العيوب المغلقة أو تحت السطحية أو في الأسطح المسامية'
      ],
      topicsEn: [
        'Pre-cleaning: remove oils, scale, weld spatter and open surface-breaking discontinuities',
        'Application: dip, spray and brush; dwell time and drain time',
        'Removal: wet and dry wipe, and the boundary of over-removal',
        'Developer: dry, wet and self-developing; coating thickness and development time',
        'Safety: ventilation, personal protective equipment, and waste handling',
        'Limits: cannot detect closed, subsurface, or porous-surface indications'
      ],
      learningOutcomesAr: [
        'ينفذ دورة penetrant كاملة على عينة لحام مع تسجيل كل زمن في ورقة العمل',
        'يحدد أثر الإزالة المفرطة ويعيد الفحص بعد إعادة التنظيف',
        'يميز مؤشراً خطياً من مؤشر مسامي ويقيس طوله',
        'يشرح سبب عدم صلاحية PT للألومنيوم المصبوب المسامي'
      ],
      learningOutcomesEn: [
        'Run a complete penetrant cycle on a weld sample with every dwell time recorded',
        'Identify over-removal and repeat the examination after re-cleaning',
        'Distinguish a linear from a rounded indication and measure its length',
        'Explain why PT is unsuitable for porous cast aluminium'
      ],
      quizId: 'pt-principles-q1'
    },
    {
      id: 'mod_c_mt',
      titleAr: 'الوحدة MT-1: الجسيمات المغناطيسية — التمغنط والتطبيق والتفسير',
      titleEn: 'Module MT-1: Magnetic Particle Testing — Magnetisation, Application and Interpretation',
      duration: '28 ساعة (12 نظري + 16 عملي)',
      topicsAr: [
        'المغناطيسية الحديدية ومنحنى التخلفية ونقطة التشبع',
        'التمغنط: المغناطيس الكهربائي، الخيط المرن، والملفات؛ اتجاه المجال مقابل اتجاه العيب',
        'قاعدة L/D واختيار شدة التيار (DC ≈ 1440 A لكل 25 mm، AC ≈ 1100 A لكل 25 mm)',
        'الجسيمات: الجافة والرطبة، والفلوري مقابل المرئي، والتباين',
        'إزالة التمغنط والتنظيف بعد الفحص',
        'الحدود: لا يعمل على الأوستنيتي أو الألومنيوم أو النحاس'
      ],
      topicsEn: [
        'Ferromagnetism, the hysteresis loop, and saturation',
        'Magnetisation: electromagnet, flexible cable, and coils; field direction versus flaw orientation',
        'L/D rule and current selection (DC ≈ 1440 A per 25 mm, AC ≈ 1100 A per 25 mm)',
        'Particles: dry and wet, fluorescent versus visible, and contrast',
        'Demagnetisation and post-examination cleaning',
        'Limits: does not work on austenitic stainless steel, aluminium, or copper alloys'
      ],
      learningOutcomesAr: [
        'يحسب شدة التيار المطلوبة لعينة قطرها 25 mm باستخدام قاعدة L/D',
        'يختار اتجاه التمغنط المناسب لعيب عرضي وآخر طولي',
        'يفسر مؤشراً خطياً حاداً ويحدد احتمال كونه شرخاً',
        'يزيل التمغنط ويقيس المغناطيسية المتبقية قبل التسليم'
      ],
      learningOutcomesEn: [
        'Calculate the required current for a 25 mm sample using the L/D rule',
        'Select the correct magnetisation direction for a transverse and a longitudinal flaw',
        'Interpret a sharp linear indication and state whether it is likely a crack',
        'Demagnetise and measure residual magnetism before hand-over'
      ],
      quizId: 'mt-principles-q1'
    },
    {
      id: 'mod_c_ut',
      titleAr: 'الوحدة UT-1: الموجات فوق الصوتية — المسابر والمعايرة والمسح',
      titleEn: 'Module UT-1: Ultrasonic Testing — Probes, Calibration and Scanning',
      duration: '40 ساعة (16 نظري + 24 عملي)',
      topicsAr: [
        'المسابر: التردد، الحجم، زاوية الإسفين، ونوع الموجة',
        'الاقتران: الجل، اللزوجة، وفقد الاقتران على الأسطح الخشنة',
        'المعايرة: كتلة V1/V2، معايرة المدى، معايرة الحساسية، ومنحنى DAC',
        'المسح: المسح الخطي والشفري، سرعة المسح، وتداخل الخطوات',
        'قياس السماكة: سرعة الصوت، الصفر، والانحراف',
        'الحدود: لا يكشف العيوب غير الملتصقة جيداً، ويتأثر بهندسة السطح'
      ],
      topicsEn: [
        'Probes: frequency, crystal size, wedge angle, and wave mode',
        'Coupling: gel viscosity and coupling loss on rough surfaces',
        'Calibration: V1/V2 blocks, range calibration, sensitivity calibration, and DAC',
        'Scanning: linear and raster scan, scan speed, and step overlap',
        'Thickness measurement: velocity, zero offset, and drift',
        'Limits: poor detection of tight non-bonded flaws and sensitivity to surface geometry'
      ],
      learningOutcomesAr: [
        'يعاير المدى على كتلة V1 بحيث تظهر انعكاسات السماكات المعروفة في مواقعها',
        'ينشئ منحنى DAC من ثلاث نقاط مرجعية ويسجل المكاسب',
        'يمسح 100% من خط لحام بزاوية 60° بخطوات لا تتجاوز نصف عرض الحزمة',
        'يقيس سماكة عشر نقاط ويعيد القياس عند وجود شك في الاقتران'
      ],
      learningOutcomesEn: [
        'Calibrate range on a V1 block so known thickness echoes appear at their correct positions',
        'Build a DAC curve from three reference points and record the gain values',
        'Scan 100% of a weld line at 60° with steps no greater than half the beam width',
        'Measure thickness at ten points and repeat when coupling is suspect'
      ],
      quizId: 'ut-calibration-q1'
    },
    {
      id: 'mod_c_rt',
      titleAr: 'الوحدة RT-1: التصوير الإشعاعي — التعريض والفيلم وجودة الصورة',
      titleEn: 'Module RT-1: Radiographic Testing — Exposure, Film and Image Quality',
      duration: '40 ساعة (16 نظري + 24 عملي)',
      topicsAr: [
        'مصادر الإشعاع: أنابيب X، Ir-192، Co-60، Se-75 وطاقاتها العملية',
        'التعريض: شدة المصدر، المسافة، الزمن، وقانون التربيع العكسي',
        'الفيلم الرقمي والتصوير المحسوب (CR) وقياس الكثافة البصرية',
        'جودة الصورة: IQI، حساسية السلك، والحدة الأساسية',
        'التظليل الهندسي: مصدر صغير، مسافة كافية، وتقليل التكبير',
        'السلامة: المراقبة الإشعاعية، الحواجز، والجرعات المسموحة'
      ],
      topicsEn: [
        'Radiation sources: X-ray tubes, Ir-192, Co-60, Se-75, and their practical energies',
        'Exposure: source output, distance, time, and the inverse-square law',
        'Film radiography, computed radiography (CR), and optical density measurement',
        'Image quality: IQI wire sensitivity and basic spatial resolution',
        'Geometric unsharpness: small source, sufficient distance, minimal magnification',
        'Safety: radiation monitoring, barriers, and dose limits'
      ],
      learningOutcomesAr: [
        'يحسب زمن التعريض باستخدام قانون التربيع العكسي ونشاط المصدر',
        'يقيس الكثافة البصرية ويحقق النطاق المطلوب للفيلم',
        'يختار IQI المناسب ويسجل الحساسية المحققة',
        'يحدد مصدر عدم وضوح هندسي في صورة ويقترح تصحيحاً'
      ],
      learningOutcomesEn: [
        'Calculate exposure time from the inverse-square law and source activity',
        'Measure optical density and confirm it is within the required film range',
        'Select the correct IQI and record the achieved sensitivity',
        'Identify a source of geometric unsharpness in a radiograph and propose a correction'
      ],
      quizId: 'rt-imaging-q1'
    }
  ],
  keyFormulas: [
    { nameAr: 'قاعدة L/D لشدة تيار MT', nameEn: 'MT current from L/D rule', formula: 'I ≈ (L/D) × 25 mm equivalent', noteAr: 'تطبيق تقريبي للأسطح الممغنطة بالخيط المرن', noteEn: 'Approximation for flexible-cable magnetisation' },
    { nameAr: 'قانون التربيع العكسي للإشعاع', nameEn: 'Inverse-square exposure law', formula: 't₂ = t₁ × (D₂/D₁)²', noteAr: 'لنفس كثافة الفيلم والفيلم المستخدم', noteEn: 'For the same film density and film type' },
    { nameAr: 'المنطقة القريبة', nameEn: 'Near-field length', formula: 'N = D² / (4λ)', noteAr: 'D قطر البلورة و λ الطول الموجي', noteEn: 'D crystal diameter, λ wavelength' }
  ],
  practicalSkillsChecklist: [
    { id: 'l1-vt', skillAr: 'قياس هندسة لحام كاملة وتسجيلها', skillEn: 'Measure and record complete weld geometry', codeStandard: 'ISO 17637', importance: 'required' },
    { id: 'l1-pt', skillAr: 'تنفيذ دورة PT كاملة على عينة مرجعية', skillEn: 'Execute a full PT cycle on a reference sample', codeStandard: 'ISO 3452-1', importance: 'required' },
    { id: 'l1-mt', skillAr: 'تمغنط وإزالة تمغنط عينة مع تسجيل L/D', skillEn: 'Magnetise and demagnetise a sample with L/D recorded', codeStandard: 'ISO 9934-1', importance: 'required' },
    { id: 'l1-ut', skillAr: 'معايرة المدى والحساسية على كتلة V1', skillEn: 'Range and sensitivity calibration on a V1 block', codeStandard: 'ISO 16811', importance: 'required' },
    { id: 'l1-rt', skillAr: 'تعريض فيلم وتقييم جودة الصورة بـ IQI', skillEn: 'Expose a film and evaluate image quality with an IQI', codeStandard: 'ISO 17636-1', importance: 'required' },
    { id: 'l1-limits', skillAr: 'شرح حدود المستوى الأول وحدود كل طريقة', skillEn: 'Explain Level 1 competence limits and each method limit', codeStandard: 'ISO 9712', importance: 'required' }
  ],
  referenceTextbooks: [
    { title: 'NDE-Ed — Physics and NDT Techniques (Iowa State CNDE)', standardOrPublisher: 'nde-ed.org', year: '2026' },
    { title: 'ASME Boiler & Pressure Vessel Code, Section V', standardOrPublisher: 'ASME', year: '2025' }
  ]
};
