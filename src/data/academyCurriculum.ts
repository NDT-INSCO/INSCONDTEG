import { EngineeringDiscipline } from '../types';
import { conventionalNdtDiscipline } from './curriculum/disciplines/conventionalNdt';

export const ENGINEERING_DISCIPLINES: EngineeringDiscipline[] = [
  conventionalNdtDiscipline,
  {
    id: 'ndt_advanced',
    titleAr: 'الفحص المتقدم (Advanced NDT)',
    titleEn: 'Advanced NDT (ET, PAUT, TOFD, AE, LT)',
    category: 'ndt_advanced',
    badgeColor: 'cyan',
    overviewAr: 'تقنيات الفحص المتقدمة التي تعتمد على إشارات إلكترونية ومعالجة رقمية.',
    overviewEn: 'Advanced inspection techniques relying on electronic signals and digital processing.',
    keyTechniques: ['ET', 'PAUT', 'TOFD', 'AE', 'LT'],
    globalAccreditations: ['ASNT SNT-TC-1A', 'ISO 9712'],
    targetIndustries: ['Power Generation', 'Oil & Gas', 'Aerospace'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'المستوى الأول',
        nameEn: 'Level 1',
        academicStageAr: 'أساسيات الفحص المتقدم',
        academicStageEn: 'Advanced NDT Fundamentals',
        targetRoleAr: 'تنفيذ الفحص تحت إشراف',
        targetRoleEn: 'Perform testing under supervision',
        prerequisitesAr: 'إتمام المرحلة الأكاديمية',
        prerequisitesEn: 'Academic stage completion',
        trainingHours: 40,
        experienceMonths: 3,
        internationalCerts: ['ASNT Level I'],
        applicableCodes: ['ASME Sec V'],
        responsibilitiesAr: ['تنفيذ الفحص وتسجيل النتائج', 'ضبط إعدادات الحزمة والمسح وفق الإجراء المعتمد'],
        responsibilitiesEn: ['Perform testing and record results', 'Set beam and scan parameters to the approved procedure'],
        modules: [
          {
            id: 'mod_adv_ut',
            titleAr: 'وحدة PAUT/TOFD: التوجيه الإلكتروني وتحديد الأبعاد بالحيود',
            titleEn: 'Module PAUT/TOFD: Electronic Beam Steering and Diffraction Sizing',
            duration: '32 ساعة (12 نظري + 20 عملي)',
            topicsAr: [
              'بنية المسبار المصفوفي: العناصر، الميل، والتأخير الزمني لكل عنصر (Focal Laws)',
              'التوجيه الإلكتروني والتركيز: حساب زاوية الحزمة وعمق البؤرة',
              'المعايرة على كتل ASTM/ISO المخصصة للمصفوفة والتحقق من التغطية',
              'TOFD: هندسة الإرسال والاستقبال، إشارات الرأس والطرف السفلي والعلوي',
              'قياس ارتفاع العيب: المسافة الزمنية بين إشارات الأطراف وحدود الدقة',
              'الحدود: حساسية TOFD للعيوب القريبة من السطح، وتأثر PAUT بجودة الاقتران'
            ],
            topicsEn: [
              'Array probe anatomy: elements, pitch, and per-element focal laws',
              'Electronic steering and focusing: beam angle and focal depth calculation',
              'Calibration on dedicated ASTM/ISO array blocks and coverage verification',
              'TOFD: transmitter-receiver geometry and lateral, back-wall and tip diffracted signals',
              'Flaw height sizing from tip signal time separation and its accuracy limits',
              'Limits: TOFD near-surface dead zone, and PAUT sensitivity to coupling quality'
            ],
            learningOutcomesAr: [
              'يبرمج قانون تركيز لحزمة 55° على عمق 30 mm ويؤكد التغطية على كتلة معايرة',
              'يفسر صورة S-scan ويحدد مؤشراً طرفياً',
              'يقيس ارتفاع عيب بـ TOFD ويقدّر الخطأ من زمن النبضة',
              'يكتب بيان حدود للطريقة قبل تسليم النتائج'
            ],
            learningOutcomesEn: [
              'Program a 55° focal law at 30 mm depth and confirm coverage on a calibration block',
              'Interpret an S-scan image and identify a tip diffraction indication',
              'Size a flaw height with TOFD and estimate error from pulse duration',
              'Write a method-limits statement before delivering results'
            ],
            quizId: 'ut-advanced-q1'
          },
          {
            id: 'mod_adv_et',
            titleAr: 'وحدة ET: التيارات الدوامية للأسطح والأنابيب',
            titleEn: 'Module ET: Eddy Current Testing of Surfaces and Tubing',
            duration: '32 ساعة (12 نظري + 20 عملي)',
            topicsAr: [
              'الحث الكهرومغناطيسي وعمق الاختراق ومعادلة δ',
              'المسابر المطلقة والتفاضلية وملفات bobbin وpancake',
              'المستوي الممانعي وقراءة الطور وتقدير العمق',
              'مراجع المعايرة والترشيح والترددات المتعددة',
              'كشف الشروخ السطحية وفحص الأنابيب وقياس الموصلية',
              'حدود ET: المواد الموصلة فقط، النفاذية، رفع الملف، الإشارات الهندسية'
            ],
            topicsEn: [
              'Electromagnetic induction, depth of penetration and the δ equation',
              'Absolute, differential, bobbin and pancake coils',
              'The impedance plane, phase reading and depth estimation',
              'Reference calibration, filtering and multiple frequencies',
              'Surface crack detection, tube inspection and conductivity measurement',
              'ET limits: conductive materials only, permeability, lift-off, geometric signals'
            ],
            learningOutcomesAr: [
              'يحسب عمق الاختراق ويختار التردد المناسب لتطبيق محدد',
              'يعاير مسباراً على عيب مرجعي ويقرأ إشارة على المستوي الممانعي',
              'يمسح سطحاً باتجاهين ويكشف شرخاً سطحياً موضعياً',
              'يفصل إشارة دعم أنبوب عن إشارة عيب بتردد أو طور مختلف',
              'يكتب بيان حدود ET قبل تسليم أي نتيجة'
            ],
            learningOutcomesEn: [
              'Calculate depth of penetration and select a suitable frequency for a given application',
              'Calibrate a probe on a reference flaw and read the impedance-plane signal',
              'Scan a surface in two directions and detect a local surface crack',
              'Separate a tube support signal from a flaw using another frequency or phase',
              'Write an ET limits statement before delivering any result'
            ],
            quizId: 'et-principles-q1'
          }
        ]
      }
    ]
  },
  {
    id: 'welding_inspection',
    titleAr: 'فحص اللحام (Welding Inspection)',
    titleEn: 'Welding Inspection',
    category: 'welding',
    badgeColor: 'orange',
    overviewAr: 'فحص عمليات اللحام وضمان جودة الوصلات.',
    overviewEn: 'Welding inspection and joint quality assurance.',
    keyTechniques: ['VT Weld', 'WPS/PQR', 'Heat Input'],
    globalAccreditations: ['AWS CWI', 'CSWIP'],
    targetIndustries: ['Construction', 'Pipelines', 'Shipbuilding'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'مفتش لحام أول',
        nameEn: 'Welding Inspector Level 1',
        academicStageAr: 'أساسيات فحص اللحام',
        academicStageEn: 'Welding inspection fundamentals',
        targetRoleAr: 'فحص الوصلات اللحامية',
        targetRoleEn: 'Inspect welded joints',
        prerequisitesAr: 'خبرة في اللحام',
        prerequisitesEn: 'Welding experience',
        trainingHours: 60,
        experienceMonths: 6,
        internationalCerts: ['AWS CWI'],
        applicableCodes: ['AWS D1.1', 'ASME IX'],
        responsibilitiesAr: ['فحص بصري وتوثيق اللحامات وفق WPS المعتمد', 'مراجعة سجلات تأهيل اللحامين WPQ وفحص أبعاد الوصلات'],
        responsibilitiesEn: ['Visual inspection and weld documentation per approved WPS', 'Verify welder qualifications (WPQ) and joint fit-up tolerances'],
        modules: [
          {
            id: 'mod_weld_1',
            titleAr: 'الوحدة WELD-1: مراجعة إجراءات اللحام WPS/PQR وحساب الدخل الحراري',
            titleEn: 'Module WELD-1: WPS/PQR Qualification & Heat Input Control',
            duration: '30 ساعة (15 نظري + 15 عملي)',
            topicsAr: [
              'المتغيرات الأساسية وغير الأساسية والتكميلية وفق كود ASME Section IX',
              'حساب الدخل الحراري (Heat Input = V × I × 60 / 1000 S) وتأثيره على منطقة التأثر الحراري HAZ',
              'التحقق من شهادات تأهيل اللحامين (WPQ) ونطاق السماكات والأوضاع المعتمدة (1G–6G)',
              'ضبط التسخين المسبق (Preheat) ودرجة الحرارة البينية (Interpass Temperature)'
            ],
            topicsEn: [
              'Essential, non-essential, and supplementary variables per ASME Section IX',
              'Heat input calculation (HI = V × I × 60 / 1000 S) and metallurgical impact on HAZ',
              'Auditing Welder Performance Qualifications (WPQ) thickness and position ranges (1G–6G)',
              'Monitoring preheat and maximum interpass temperature limits'
            ],
            learningOutcomesAr: [
              'يدقق مطابقة المتغيرات الميدانية لبنود إجراء اللحام WPS قبل وأثناء اللحام',
              'يحسب الدخل الحراري الفعلي لكل تمريرة ويتحقق من عدم تجاوز الحدود الميتالورجية'
            ],
            learningOutcomesEn: [
              'Audit field welding parameters against approved WPS limits before and during welding',
              'Compute pass-by-pass heat input and enforce metallurgical toughness limits'
            ],
            quizId: 'weld-wps-q1'
          },
          {
            id: 'mod_weld_2',
            titleAr: 'الوحدة WELD-2: تفتيش عيوب الوصلات الملحومة ومعايير قبول AWS D1.1',
            titleEn: 'Module WELD-2: Weld Joint Discontinuities & AWS D1.1 Acceptance',
            duration: '30 ساعة (12 نظري + 18 عملي)',
            topicsAr: [
              'فحص التجهيز قبل اللحام: زاوية الشطف، فتحة الجذر، وعدم المحاذاة (Hi-Lo)',
              'تصنيف عيوب اللحام: المسامية، نقص الانصهار، شوائب الخبث، القضم، والشروخ',
              'معايير القبول البصري والبعدي وفق AWS D1.1 Table 6.1 و ISO 5817',
              'إعداد تقارير عدم المطابقة (NCR) ومتابعة إجراءات الإصلاح وإعادة الفحص'
            ],
            topicsEn: [
              'Pre-weld fit-up verification: bevel angle, root opening, root face, and Hi-Lo misalignment',
              'Classification of weld discontinuities: porosity, LOF, slag, undercut, and cracks',
              'Visual and dimensional acceptance criteria per AWS D1.1 Table 6.1 and ISO 5817',
              'Issuing Non-Conformance Reports (NCR) and supervising weld repair procedures'
            ],
            learningOutcomesAr: [
              'يقيم عيوب اللحام السطحية والهندسية ويصدر حكم القبول أو الرفض وفق AWS D1.1',
              'يوثق خريطة اللحام (Weld Map) ويربط كل وصلة برقم اللحام وتقارير NDT'
            ],
            learningOutcomesEn: [
              'Evaluate surface and geometric weld flaws against AWS D1.1 acceptance tables',
              'Maintain traceable weld maps linking joints, welder stamps, and NDE reports'
            ],
            quizId: 'weld-aws-q2'
          }
        ]
      }
    ]
  },
  {
    id: 'pwht_metallurgy',
    titleAr: 'المعالجة الحرارية وعلم المعادن (PWHT/Metallurgy)',
    titleEn: 'PWHT & Metallurgy',
    category: 'pwht',
    badgeColor: 'red',
    overviewAr: 'المعالجة بعد اللحام وعلم المعادن والبنية المجهرية.',
    overviewEn: 'Post-weld heat treatment and metallurgy.',
    keyTechniques: ['PWHT', 'Hardness', 'PMI'],
    globalAccreditations: ['ASNT Level II/III'],
    targetIndustries: ['Refineries', 'Power Plants'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'تقني معالجة حرارية',
        nameEn: 'PWHT Technician',
        academicStageAr: 'أساسيات المعالجة الحرارية',
        academicStageEn: 'PWHT fundamentals',
        targetRoleAr: 'تنفيذ ومراقبة دورات PWHT',
        targetRoleEn: 'Execute and monitor PWHT cycles',
        prerequisitesAr: 'معرفة بعلم المعادن',
        prerequisitesEn: 'Metallurgy knowledge',
        trainingHours: 40,
        experienceMonths: 3,
        internationalCerts: [],
        applicableCodes: ['ASME VIII', 'ASME B31.3', 'AWS D1.1'],
        responsibilitiesAr: ['مراقبة الترموكبلات والمنحنيات الحرارية', 'توثيق مخططات التسخين والنقع والتبريد واجتياز فحص الصلادة'],
        responsibilitiesEn: ['Monitor thermocouples and thermal charts', 'Document heating, soak, and cooling records and verify hardness'],
        modules: [
          {
            id: 'mod_pwht_1',
            titleAr: 'الوحدة PWHT-1: دورات إزالة الإجهادات المتبقية وفق ASME B31.3 & VIII',
            titleEn: 'Module PWHT-1: Thermal Stress Relief Cycles per ASME B31.3 & VIII',
            duration: '20 ساعة (10 نظري + 10 عملي)',
            topicsAr: [
              'الأهداف الميتالورجية لـ PWHT: إزالة الإجهادات المتبقية وتطبيع المارتنسيت الهش في HAZ',
              'تصنيف المواد حسب P-Numbers (P-No. 1، P-No. 4/5A، وسبائك الزحف P91 / P-No. 15E)',
              'حساب معدلات التسخين والتبريد القصوى فوق 315°C/400°C وزمن النقع حسب السماكة',
              'تثبيت المزدوجات الحرارية (Thermocouples Type K) باللحام التفريغي السعوي وعرض نطاق التسخين'
            ],
            topicsEn: [
              'Metallurgical objectives of PWHT: residual stress relief and tempering brittle HAZ martensite',
              'ASME P-Number groupings (P-No. 1 carbon steel, P-No. 4/5A Cr-Mo, P-No. 15E Grade 91)',
              'Computing maximum heating/cooling rates and soak holding times per wall thickness',
              'Capacitive-discharge thermocouple attachment and heated band / gradient width rules'
            ],
            learningOutcomesAr: [
              'يبرمج دورة PWHT كاملة شاملة معدل التسخين وحرارة وزمن النقع ومعدل التبريد',
              'يراجع مخطط المسجل الحراري (Chart Recorder) ويتحقق من عدم حدوث صدمة حرارية'
            ],
            learningOutcomesEn: [
              'Program a complete code-compliant PWHT cycle for carbon and Cr-Mo alloy steels',
              'Audit multi-channel temperature recorder charts for soak uniformity and ramp compliance'
            ],
            quizId: 'pwht-cycle-q1'
          },
          {
            id: 'mod_pwht_2',
            titleAr: 'الوحدة PWHT-2: فحص الصلادة الميداني (Brinell/Vickers) ومطابقة السبائك PMI',
            titleEn: 'Module PWHT-2: Field Hardness Testing & Positive Material Identification (PMI)',
            duration: '20 ساعة (8 نظري + 12 عملي)',
            topicsAr: [
              'حدود الصلادة القصوى بعد PWHT للوقاية من التشقق الهيدروجيني وخدمة الغاز الحامضي NACE MR0175 (≤ 22 HRC / 248 HV)',
              'اختبارات الصلادة المحمولة (UCI & Leeb Rebound) وتحضير سطح القياس في المعدن الأساسي والـ HAZ واللحام',
              'التحقق الإيجابي من هوية السبائك (PMI) بتقنية XRF و OES لمنع خلط مواسير الكربون بالكروم-موليبدينوم'
            ],
            topicsEn: [
              'Post-PWHT hardness limits for sour service H2S SSC prevention per NACE MR0175 / ISO 15156 (≤ 22 HRC / 248 HV)',
              'Portable UCI and rebound hardness testing across base metal, HAZ, and weld metal',
              'Positive Material Identification (XRF & OES PMI) preventing alloy mix-ups in refinery piping'
            ],
            learningOutcomesAr: [
              'يجري فحص صلادة بعد PWHT ويقيم النتائج مقابل حدود ASME B31.3 و NACE',
              'يميز عناصر السبائك الحرجة (Cr, Mo, V, Ni) باستخدام جهاز PMI الميداني'
            ],
            learningOutcomesEn: [
              'Execute post-PWHT hardness surveys and evaluate readings against ASME B31.3 and NACE limits',
              'Verify critical alloying elements (Cr, Mo, V, Ni) using portable XRF/OES analyzers'
            ],
            quizId: 'pwht-hardness-q2'
          }
        ]
      }
    ]
  },
  {
    id: 'api_inspection',
    titleAr: 'فحص API والأنابيب',
    titleEn: 'API & Piping Inspection',
    category: 'api',
    badgeColor: 'emerald',
    overviewAr: 'فحص المعدات والأنابيب وفق أكواد API.',
    overviewEn: 'Equipment and piping inspection per API codes.',
    keyTechniques: ['API 510', 'API 570', 'API 653'],
    globalAccreditations: ['API 510', 'API 570', 'API 653'],
    targetIndustries: ['Refineries', 'Chemical Plants'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'مفتش أنابيب ومعدات ثابتة',
        nameEn: 'Piping & Static Equipment Inspector',
        academicStageAr: 'أساسيات فحص الأنابيب والأوعية في الخدمة',
        academicStageEn: 'In-service piping and vessel inspection basics',
        targetRoleAr: 'فحص الأنابيب والأوعية وحساب معدل التآكل والعمر المتبقي',
        targetRoleEn: 'Inspect piping/vessels and calculate corrosion rate & remaining life',
        prerequisitesAr: 'خبرة هندسية',
        prerequisitesEn: 'Engineering experience',
        trainingHours: 80,
        experienceMonths: 12,
        internationalCerts: ['API 570', 'API 510'],
        applicableCodes: ['API 570', 'API 510', 'API 571', 'API 574'],
        responsibilitiesAr: ['فحص دوري وتقييم السماكات المتبقية', 'تحديد فترات التفتيش القصوى وآليات التلف API 571'],
        responsibilitiesEn: ['Periodic inspection and minimum thickness evaluation', 'Establish inspection intervals and identify API 571 damage mechanisms'],
        modules: [
          {
            id: 'mod_api_1',
            titleAr: 'الوحدة API-1: حسابات معدل التآكل والعمر المتبقي وفترات الفحص (API 510/570)',
            titleEn: 'Module API-1: Corrosion Rate, Remaining Life & Inspection Intervals',
            duration: '40 ساعة (20 نظري + 20 تطبيقات حسابية)',
            topicsAr: [
              'حساب السماكة الدنيا المطلوبة للضغط الداخلي وفق معادلة بارلو ومعادلات ASME Sec VIII (t_min = PR / (SE - 0.6P))',
              'حساب معدل التآكل قصير المدى (ST) وطويل المدى (LT) عند نقاط مراقبة الحالة CMLs',
              'حساب العمر المتبقي (Remaining Life = (t_actual - t_min) / CR) وتحديد نصف العمر المتبقي لفترة الفحص',
              'تصنيف فئات أنظمة الأنابيب (Class 1, 2, 3) وفق API 570 وحدود فترات الفحص القصوى'
            ],
            topicsEn: [
              'Minimum required wall thickness calculations per Barlow & ASME VIII formulas (t_min = PR / (SE - 0.6P))',
              'Short-term (ST) vs Long-term (LT) corrosion rate computation at Condition Monitoring Locations (CMLs)',
              'Remaining life formula: RL = (t_actual - t_min) / CR and half-life inspection interval rules',
              'API 570 piping classes (Class 1, 2, 3) and maximum UT/visual inspection intervals'
            ],
            learningOutcomesAr: [
              'يحسب t_min والعمر المتبقي وموعد التفتيش القادم لأوعية الضغط وخطوط الأنابيب',
              'يحدد مواضع القياس الحرجة CMLs ومناطق الحقن والوصلات الميتة (Deadlegs)'
            ],
            learningOutcomesEn: [
              'Compute t_min, corrosion rate, remaining life, and next due inspection dates accurately',
              'Select critical CMLs including injection points, mixing tees, and stagnant deadlegs'
            ],
            quizId: 'api-remaining-life-q1'
          },
          {
            id: 'mod_api_2',
            titleAr: 'الوحدة API-2: آليات تلف المصافي API 571 وتقييم الخزانات API 653',
            titleEn: 'Module API-2: API 571 Refinery Damage Mechanisms & API 653 Tanks',
            duration: '40 ساعة (24 نظري + 16 دراسات حالة)',
            topicsAr: [
              'التآكل تحت العزل الحراري (CUI): نطاقات الحرارة الحرجة (10°C إلى 175°C للفولاذ الكربوني) وطرق الكشف',
              'تشققات التآكل الإجهادي الكلوريدي (Cl-SCC) في الفولاذ الأوستنيتي والتقصف الهيدروجيني عالي الحرارة (HTHA)',
              'فحص قيعان الخزانات البترولية وفق API 653 بتقنية تسرب الفيض المغناطيسي (MFL) واختبار صندوق التفريغ (Vacuum Box)'
            ],
            topicsEn: [
              'Corrosion Under Insulation (CUI): Critical temperature windows and RT/PEC screening methods',
              'Chloride Stress Corrosion Cracking (Cl-SCC) in 300-series SS and High-Temperature Hydrogen Attack (HTHA)',
              'API 653 storage tank floor MFL scanning and Vacuum Box seam leak testing'
            ],
            learningOutcomesAr: [
              'يشخص آلية التلف المتوقعة حسب بيئة التشغيل ودرجة الحرارة ونوع السبيكة ويختار تقنية NDT الملائمة',
              'يطبق متطلبات API 653 لفحص وإصلاح قيعان وجدران الخزانات الأرضية'
            ],
            learningOutcomesEn: [
              'Match operating environment and metallurgy to probable API 571 damage mechanisms and NDE methods',
              'Apply API 653 floor minimum thickness and vacuum-box leak testing requirements'
            ],
            quizId: 'api-damage-q2'
          }
        ]
      }
    ]
  },
  {
    id: 'coating_corrosion',
    titleAr: 'الدهانات والتآكل (Coating/Corrosion)',
    titleEn: 'Coating & Corrosion',
    category: 'coating',
    badgeColor: 'yellow',
    overviewAr: 'فحص الطلاءات وآليات التآكل.',
    overviewEn: 'Coating inspection and corrosion mechanisms.',
    keyTechniques: ['Coating Inspection', 'Corrosion Mapping'],
    globalAccreditations: ['AMPP CIP'],
    targetIndustries: ['Marine', 'Offshore', 'Infrastructure'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'مفتش دهانات معتمد',
        nameEn: 'Coating Inspector',
        academicStageAr: 'أساسيات فحص الدهانات وتحضير الأسطح',
        academicStageEn: 'Coating inspection & surface prep basics',
        targetRoleAr: 'فحص الظروف المناخية وتحضير السطح وجودة الطلاءات',
        targetRoleEn: 'Inspect ambient conditions, surface profile, and coating quality',
        prerequisitesAr: 'خبرة سطحية',
        prerequisitesEn: 'Surface experience',
        trainingHours: 40,
        experienceMonths: 3,
        internationalCerts: ['AMPP CIP Level 1'],
        applicableCodes: ['SSPC-PA 2', 'ISO 8501-1', 'ASTM D4417', 'NACE SP0188'],
        responsibilitiesAr: ['فحص نقطة الندى ونظافة السطح وخشونة السفع وسماكة الفيلم الجاف DFT'],
        responsibilitiesEn: ['Verify dew point spread, blast cleanliness, anchor profile, and Dry Film Thickness (DFT)'],
        modules: [
          {
            id: 'mod_coat_1',
            titleAr: 'الوحدة COAT-1: الظروف المناخية، نقطة الندى، وتقييم السفع الرملي ISO 8501-1',
            titleEn: 'Module COAT-1: Dew Point Psychrometrics & ISO 8501-1 Surface Preparation',
            duration: '20 ساعة (10 نظري + 10 عملي)',
            topicsAr: [
              'قياس الرطوبة النسبية وحرارة السطح المعدني ونقطة الندى (شرط ارتفاع حرارة المعدن ≥ 3°C فوق نقطة الندى)',
              'درجات السفع الكاشط القياسية ISO 8501-1 (Sa 1، Sa 2، Sa 2½، Sa 3) ومقارنتها بمواصفات SSPC/NACE',
              'قياس خشونة السطح (Surface Anchor Profile) بشريط Testex Replica Tape وفق ASTM D4417 وفحص الأملاح الذائبة Bresle'
            ],
            topicsEn: [
              'Psychrometric checks: relative humidity, substrate temperature, and the ≥ 3°C (5°F) above dew point rule',
              'ISO 8501-1 abrasive blast cleanliness grades (Sa 1, Sa 2, Sa 2½, Sa 3) and SSPC equivalents',
              'Anchor profile measurement via Testex replica tape (ASTM D4417) and Bresle soluble salt testing'
            ],
            learningOutcomesAr: [
              'يحسم قرار السماح بالسفع أو الطلاء بناءً على قراءات نقطة الندى والرطوبة والأملاح',
              'يقيم درجة نظافة السطح وخشونته بدقة قبل تطبيق البرايمر'
            ],
            learningOutcomesEn: [
              'Authorize or halt blasting/coating operations based on dew point delta and salt contamination',
              'Verify blast cleanliness grade and surface profile height prior to primer application'
            ],
            quizId: 'coat-prep-q1'
          },
          {
            id: 'mod_coat_2',
            titleAr: 'الوحدة COAT-2: قياس السماكة الجافة SSPC-PA 2 وفحص الثقوب الكهربائية (Holiday Test)',
            titleEn: 'Module COAT-2: Dry Film Thickness (SSPC-PA 2) & Holiday Pinhole Testing',
            duration: '20 ساعة (8 نظري + 12 عملي)',
            topicsAr: [
              'قياس السماكة الرطبة (WFT) وحساب السماكة الجافة المتوقعة من نسبة المواد الصلبة بالحجم (DFT = WFT × %VS)',
              'معايرة وتطبيق قاعدة القياس SSPC-PA 2 لتقييم قراءات السماكة الجافة (Spot & Area Measurements)',
              'كشف الثقوب الدقيقة والعيوب العازلة (Holiday Detection) بالإسفنجة الرطبة منخفضة الجهد والشرارة عالية الجهد وفق NACE SP0188'
            ],
            topicsEn: [
              'Wet Film Thickness (WFT) gauging and predicting DFT from Volume Solids (DFT = WFT × %VS)',
              'Calibration on smooth/shim standards and SSPC-PA 2 spot and area acceptance rules',
              'Low-voltage wet sponge vs high-voltage spark holiday testing per NACE SP0188'
            ],
            learningOutcomesAr: [
              'يطبق بروتوكول SSPC-PA 2 لقبول أو رفض سماكة نظام الطلاء الواقي',
              'يختار جهد اختبار الشرارة الآمن دون إتلاف طبقة الإيبوكسي أو التبطين الداخلي'
            ],
            learningOutcomesEn: [
              'Apply SSPC-PA 2 statistical spot/area rules to accept or reject protective coating systems',
              'Select correct NACE SP0188 test voltages to detect pinholes without dielectric burn-through'
            ],
            quizId: 'coat-dft-q2'
          }
        ]
      }
    ]
  },
  {
    id: 'qa_qc',
    titleAr: 'ضمان الجودة وضبط الجودة (QA/QC)',
    titleEn: 'Quality Assurance & Quality Control',
    category: 'quality',
    badgeColor: 'violet',
    overviewAr: 'أنظمة الجودة والتفتيش والتوثيق الفني.',
    overviewEn: 'Quality systems, inspection and technical traceability.',
    keyTechniques: ['ITP', 'NCR', 'Documentation'],
    globalAccreditations: ['ISO 9001', 'ISO 17025'],
    targetIndustries: ['All Industries'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'مهندس / تقني ضمان وضبط جودة',
        nameEn: 'QA/QC Inspector & Coordinator',
        academicStageAr: 'أساسيات أنظمة الجودة وخطط الفحص والاختبار',
        academicStageEn: 'Quality management systems & ITP control',
        targetRoleAr: 'إعداد ومتابعة ITP وتوثيق الجودة ومعالجة حالات عدم المطابقة',
        targetRoleEn: 'Manage ITP hold/witness points, material traceability, and NCR closure',
        prerequisitesAr: 'خلفية هندسية',
        prerequisitesEn: 'Engineering background',
        trainingHours: 30,
        experienceMonths: 3,
        internationalCerts: ['ISO 9001 Lead Auditor', 'ISO/IEC 17025'],
        applicableCodes: ['ISO 9001', 'ISO/IEC 17025', 'EN 10204'],
        responsibilitiesAr: ['إعداد ITP ومراجعة شهادات المواد MTRs وتوثيق النتائج النهائية'],
        responsibilitiesEn: ['Prepare ITPs, verify EN 10204 3.1/3.2 MTRs, and compile final quality dossiers'],
        modules: [
          {
            id: 'mod_qaqc_1',
            titleAr: 'الوحدة QAQC-1: خطط الفحص والاختبار (ITP) ونقاط التوقف والشهادة المادية EN 10204',
            titleEn: 'Module QAQC-1: Inspection & Test Plans (ITP) & EN 10204 Material Certificates',
            duration: '15 ساعة (9 نظري + 6 تطبيقي)',
            topicsAr: [
              'التمييز الصارم بين نقاط التوقف الإلزامية (Hold Point - H)، نقاط المشاهدة (Witness - W)، والمراجعة المستندية (Review - R)',
              'تدقيق شهادات اختبار المواد (MTR) والفرق بين شهادة EN 10204 Type 3.1 و Type 3.2 المعتمدة من طرف ثالث',
              'تتبع أرقام الصبات الحرارية (Heat Numbers) من شهادة المصنع وحتى موقع اللحام الميداني'
            ],
            topicsEn: [
              'Governing distinction between Hold Points (H), Witness Points (W), Surveillance (S), and Document Review (R)',
              'Auditing Mill Test Reports (MTRs): EN 10204 Type 3.1 vs third-party endorsed Type 3.2 certificates',
              'Full heat-number traceability from raw plate/pipe receiving through final weld map sign-off'
            ],
            learningOutcomesAr: [
              'يدير إشعارات الفحص (RFI) ويمنع تجاوز أي نقطة توقف (Hold Point) دون حضور وتوقيع الجهة المعنية',
              'يدقق التركيب الكيميائي والخواص الميكانيكية في شهادات المواد EN 10204'
            ],
            learningOutcomesEn: [
              'Enforce ITP Hold and Witness notifications via formal RFIs without unauthorized bypass',
              'Verify chemical and mechanical compliance on EN 10204 3.1/3.2 material test certificates'
            ],
            quizId: 'qaqc-itp-q1'
          },
          {
            id: 'mod_qaqc_2',
            titleAr: 'الوحدة QAQC-2: إدارة عدم المطابقة (NCR/CAPA) واعتماد المختبرات ISO/IEC 17025',
            titleEn: 'Module QAQC-2: NCR / Root-Cause CAPA & ISO/IEC 17025 Lab Competence',
            duration: '15 ساعة (8 نظري + 7 دراسات حالة)',
            topicsAr: [
              'دورة حياة تقرير عدم المطابقة (NCR): العزل، تحليل السبب الجذري (5 Whys / Fishbone)، والإجراء التصحيحي والوقائي CAPA',
              'متطلبات ISO/IEC 17025 لمختبرات الفحص والمعايرة: سلسلة الإسناد القياسي (Metrological Traceability) والارتياب في القياس',
              'تجميع ملف التسليم النهائي للمشروع (Final Manufacturing / Turnover Data Book - MDR)'
            ],
            topicsEn: [
              'NCR lifecycle: quarantine, Root Cause Analysis (5 Whys / Ishikawa), disposition, and CAPA verification',
              'ISO/IEC 17025 laboratory accreditation: calibration traceability and measurement uncertainty',
              'Compiling auditable Final Manufacturing Data Records (MDR) and hydrostatic test packages'
            ],
            learningOutcomesAr: [
              'يصيغ تقرير عدم مطابقة موثق بالأدلة ويقيم فعالية الإجراء التصحيحي لمنع التكرار',
              'يتحقق من سريان شهادات معايرة أجهزة NDT وإسنادها المتري وفق ISO/IEC 17025'
            ],
            learningOutcomesEn: [
              'Draft evidence-backed NCRs and verify root-cause corrective actions prevent recurrence',
              'Audit NDT equipment calibration certificates for ISO/IEC 17025 metrological traceability'
            ],
            quizId: 'qaqc-ncr-q2'
          }
        ]
      }
    ]
  },
  {
    id: 'asset_integrity_rope',
    titleAr: 'سلامة الأصول والتفتيش (Asset Integrity)',
    titleEn: 'Asset Integrity & Rope Access',
    category: 'integrity',
    badgeColor: 'teal',
    overviewAr: 'إدارة سلامة الأصول والتفتيش بالحبال.',
    overviewEn: 'Asset integrity management and rope access inspection.',
    keyTechniques: ['RBI', 'FFS', 'Rope Access'],
    globalAccreditations: ['API 580', 'IRATA'],
    targetIndustries: ['Offshore', 'Construction', 'Utilities'],
    levels: [
      {
        levelId: 'level1',
        tierCategory: 'professional',
        nameAr: 'مهندس / تقني سلامة أصول ووصول بالحبال',
        nameEn: 'Asset Integrity & Rope Access Specialist',
        academicStageAr: 'التفتيش المبني على المخاطر والصلاحية للخدمة والوصول بالحبال',
        academicStageEn: 'Risk-Based Inspection, Fitness-for-Service & IRATA Rope Access',
        targetRoleAr: 'فحص وتقييم سلامة المنشآت العالية والبحرية وإدارة مخاطر التدهور',
        targetRoleEn: 'Assess asset risk matrices, FFS dispositions, and execute two-rope NDT access',
        prerequisitesAr: 'تأهيل NDT',
        prerequisitesEn: 'NDT qualification',
        trainingHours: 60,
        experienceMonths: 6,
        internationalCerts: ['IRATA Level 1', 'API 580 RBI'],
        applicableCodes: ['API 580', 'API 581', 'API 579-1 / ASME FFS-1', 'IRATA ICOP'],
        responsibilitiesAr: ['تقييم مصفوفة المخاطر RBI وتنفيذ مهام الفحص بالحبال بنظام الحبلين المستقلين'],
        responsibilitiesEn: ['Evaluate PoF/CoF risk matrices and perform twin-rope NDT inspections per IRATA ICOP'],
        modules: [
          {
            id: 'mod_integrity_1',
            titleAr: 'الوحدة INT-1: التفتيش المبني على المخاطر (API 580 RBI) وتقييم الصلاحية للخدمة FFS',
            titleEn: 'Module INT-1: Risk-Based Inspection (API 580) & Fitness-for-Service (API 579)',
            duration: '30 ساعة (18 نظري + 12 دراسات حالة)',
            topicsAr: [
              'معادلة المخاطر الأساسية في API 580: الخطر = احتمالية الانهيار (PoF) × عواقب الانهيار (CoF)',
              'توجيه موارد NDT نحو الـ 20% من المعدات التي تمثل 80% من مخاطر المنشأة عبر مصفوفة المخاطر (5×5 Risk Matrix)',
              'مستويات تقييم الصلاحية للخدمة وفق API 579-1 / ASME FFS-1 (المستوى 1 المحافظ، المستوى 2 الهندسي، المستوى 3 العناصر المحدودة FEA)'
            ],
            topicsEn: [
              'Core API 580 risk definition: Risk = Probability of Failure (PoF) × Consequence of Failure (CoF)',
              'Prioritizing NDE scopes on high-risk assets using 5×5 Risk Matrices and damage degradation rates',
              'API 579-1 / ASME FFS-1 assessment tiers: Level 1 screening, Level 2 detailed calculation, Level 3 FEA'
            ],
            learningOutcomesAr: [
              'يصنف المعدات على مصفوفة المخاطر ويحدد أولوية وطريقة التفتيش القادم لتخفيض احتمالية الفشل PoF',
              'يميز متى يُحال عيب موضعي لتقييم الصلاحية للخدمة API 579 بدلاً من الإيقاف الفوري'
            ],
            learningOutcomesEn: [
              'Rank static assets on an API 580 risk matrix and optimize NDE techniques to mitigate PoF',
              'Determine appropriate API 579-1 FFS assessment levels for local metal loss or weld flaws'
            ],
            quizId: 'integrity-rbi-q1'
          },
          {
            id: 'mod_integrity_2',
            titleAr: 'الوحدة INT-2: الوصول الصناعي بالحبال لإجراء الفحوصات اللاإتلافية وفق مدونة IRATA ICOP',
            titleEn: 'Module INT-2: Industrial Rope Access for NDT per IRATA ICOP',
            duration: '30 ساعة (10 نظري + 20 تدريب ميداني)',
            topicsAr: [
              'مبدأ الحماية المزدوجة المستقلة (Two-Rope Principle): حبل العمل (Working Line) وحبل الأمان الاحتياطي (Backup Safety Line)',
              'دور ومؤهلات مشرف السلامة IRATA Level 3 وخطة الإنقاذ الفورية وتقييم مخاطر سقوط معدات الفحص (Dropped Objects)',
              'فحص صلاحية الأربطة والحبال وأجهزة الكبح وتأمين أجهزة UT/PAUT/MT أثناء التعليق على الأبراج والمنصات البحرية'
            ],
            topicsEn: [
              'IRATA ICOP twin-rope redundancy principle: independent anchored Working Line and Backup Line',
              'Mandatory IRATA Level 3 on-site supervision, rescue pre-rigging, and tool-lanyard drop prevention',
              'Pre-use inspection of harnesses, descenders, and backup devices when carrying UT/PAUT/MT kits aloft'
            ],
            learningOutcomesAr: [
              'يطبق اشتراطات الحبلين المستقلين وتأمين أجهزة الفحص ضد السقوط في المنشآت المرتفعة',
              'يتحقق من اكتمال تصريح العمل وخطة الإنقاذ وإشراف المستوى الثالث IRATA قبل بدء التعليق'
            ],
            learningOutcomesEn: [
              'Enforce independent twin-rope anchorage and dropped-object tethering for elevated NDE hardware',
              'Verify IRATA Level 3 supervision, rescue readiness, and pre-use gear checks before ascent'
            ],
            quizId: 'integrity-irata-q2'
          }
        ]
      }
    ]
  }
];

export interface WorkshopLab {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const WORKSHOP_LABS: WorkshopLab[] = [
  { id: 'ut_lab', titleAr: 'مختبر UT', titleEn: 'UT Lab', descriptionAr: 'محاكاة A-scan', descriptionEn: 'A-scan simulation' },
  { id: 'pt_mt_darkroom', titleAr: 'غرفة PT/MT المظلمة', titleEn: 'PT/MT Darkroom', descriptionAr: 'محاكاة فحص السطح', descriptionEn: 'Surface inspection simulation' },
  { id: 'rt_illuminator', titleAr: 'مصدر RT', titleEn: 'RT Source', descriptionAr: 'محاكاة التصوير الإشعاعي', descriptionEn: 'Radiography simulation' },
  { id: 'weld_inspector_gauge', titleAr: 'مقاييس اللحام', titleEn: 'Weld Gauges', descriptionAr: 'أدوات قياس الوصلة', descriptionEn: 'Joint measurement tools' },
  { id: 'api_vessel_life', titleAr: 'عمر الوعاء', titleEn: 'Vessel Life', descriptionAr: 'حسابات API', descriptionEn: 'API calculations' },
];