import { ENGINEERING_DISCIPLINES } from './academyCurriculum';
import { NdeEdCourse, NdeEdLesson } from './ndeEd';
import { KnowledgeLesson } from './academyKnowledge';

export type LessonQuizSourceKind = 'curriculum_module' | 'nde_ed_lesson' | 'knowledge_lesson';

export interface BilingualQuizText {
  ar: string;
  en: string;
}

export interface LessonQuizQuestion {
  id: string;
  question: BilingualQuizText;
  options: BilingualQuizText[];
  correctIndex: number;
  explanation: BilingualQuizText;
  codeReference: string;
}

export interface LessonQuizPack {
  packId: string;
  sourceKind: LessonQuizSourceKind;
  disciplineId: string;
  levelId: string;
  moduleId: string;
  title: BilingualQuizText;
  subtitle: BilingualQuizText;
  passThresholdPct: number;
  maxXpReward: number;
  questions: LessonQuizQuestion[];
}

const bt = (ar: string, en: string): BilingualQuizText => ({ ar, en });

const MODULE_QUESTIONS_BANK: Record<string, LessonQuizQuestion[]> = {
  mod_c_acad_1: [
    {
      id: 'q_acad1_1',
      codeReference: 'ASME Sec V Art. 1 / ISO 9712',
      question: bt(
        'ما الفرق الجوهري بين الانقطاع (Discontinuity) والعيب المرفوض (Defect) في هندسة الفحص غير الإتلافي؟',
        'What is the fundamental distinction between a discontinuity and a defect in NDT engineering?'
      ),
      options: [
        bt('كل انقطاع يُعد عيباً يستوجب الإزالة فوراً بغض النظر عن حجمه', 'Every discontinuity is automatically a rejectable defect regardless of size'),
        bt('العيب هو انقطاع يتجاوز حدود القبول المنصوص عليها في الكود التعاقدي المطبق', 'A defect is a discontinuity whose size, shape, or density exceeds applicable code acceptance limits'),
        bt('الانقطاع يظهر فقط على السطح بينما العيب داخلي دائماً', 'A discontinuity is strictly surface-breaking whereas a defect is internal'),
        bt('لا يوجد فرق هندسي بين المصطلحين في مواصفات ASME', 'There is no technical difference between the two terms in ASME codes'),
      ],
      correctIndex: 1,
      explanation: bt(
        'وفقاً لمصطلحات ASTM E1316 و ASME Sec V، الانقطاع هو أي تغير في تجانس المادة، ولا يتحول إلى عيب (Defect) مرفوض إلا إذا تجاوز معايير القبول في كود التصنيع مثل ASME VIII أو B31.3.',
        'Per ASTM E1316 and ASME Sec V terminology, an indication from a discontinuity only becomes a rejectable defect when evaluated as exceeding the referencing construction code acceptance criteria.'
      ),
    },
    {
      id: 'q_acad1_2',
      codeReference: 'ASNT SNT-TC-1A / ISO 9712',
      question: bt(
        'في معادلة انتشار الموجات الصوتية والكهرومغناطيسية (λ = v / f)، ماذا يحدث للطول الموجي عند مضاعفة التردد في نفس المعدن؟',
        'In the wave propagation equation (λ = v / f), what happens to wavelength when frequency is doubled in the same material?'
      ),
      options: [
        bt('ينخفض الطول الموجي إلى النصف وتزداد حساسية كشف العيوب الصغيرة', 'Wavelength halves, increasing sensitivity to smaller discontinuities'),
        bt('يتضاعف الطول الموجي ويقل التوهين الصوتي', 'Wavelength doubles and attenuation decreases'),
        bt('تتضاعف سرعة الصوت داخل الفولاذ الكربوني', 'Acoustic velocity doubles inside carbon steel'),
        bt('يبقى الطول الموجي ثابتاً ولا يتأثر بالتردد', 'Wavelength remains unchanged regardless of frequency'),
      ],
      correctIndex: 0,
      explanation: bt(
        'بما أن سرعة الصوت (v) خاصية مرتبطة بالمادة ونمط الموجة، فإن مضاعفة التردد (f) تقلل الطول الموجي (λ) إلى النصف مما يحسن القدرة التفصيلية والحساسية مع زيادة التوهين.',
        'Because acoustic velocity (v) is governed by material elasticity and density, doubling frequency (f) halves wavelength (λ), improving axial resolution and small-flaw sensitivity at the cost of higher attenuation.'
      ),
    },
    {
      id: 'q_acad1_3',
      codeReference: 'ISO/IEC 17025 / ASME Sec V',
      question: bt(
        'عند تسجيل قراءات سماكة متقاربة جداً (12.40، 12.41، 12.40 مم) على جهاز لم تتم معايرة سرعة الصوت فيه، كيف تُوصَف هذه النتيجة؟',
        'When recording tightly grouped thickness readings (12.40, 12.41, 12.40 mm) on an instrument with uncalibrated velocity, how is the result characterized?'
      ),
      options: [
        bt('دقة عالية وتكرارية منخفضة', 'High accuracy and low repeatability'),
        bt('تكرارية عالية مع احتمال وجود خطأ منتظم (انحياز في الدقة)', 'High repeatability with potential systematic bias (inaccuracy)'),
        bt('نتيجة معتمدة طالما ظهرت منزلتان عشريتان على الشاشة', 'Certified accurate because two decimal places are displayed'),
        bt('خطأ عشوائي ناتج عن خشونة السطح فقط', 'Purely random scatter caused by surface roughness'),
      ],
      correctIndex: 1,
      explanation: bt(
        'تقارب القراءات يثبت التكرارية (Repeatability) فقط، أما الدقة (Accuracy) فتتطلب معايرة الجهاز على كتلة مرجعية من نفس المعدن لإزالة الانحياز المنتظم.',
        'Close grouping demonstrates repeatability (precision), whereas accuracy requires calibration against a traceable reference block of matching acoustic velocity to eliminate systematic bias.'
      ),
    },
  ],

  mod_c_acad_2: [
    {
      id: 'q_acad2_1',
      codeReference: 'IAEA SSG-11 / Radiation Safety',
      question: bt(
        'طبقاً لقانون التربيع العكسي في الوقاية الإشعاعية، إذا تضاعفت المسافة بين الفاحص ومصدر أشعة جاما إلى 3 أضعاف، فكم تصبح شدة الإشعاع؟',
        'According to the inverse-square law in radiation protection, if the distance from a gamma source triples, the dose rate becomes:'
      ),
      options: [
        bt('ثلث القيمة الأصلية (1/3)', 'One-third (1/3) of the initial dose rate'),
        bt('تُسع القيمة الأصلية (1/9)', 'One-ninth (1/9) of the initial dose rate'),
        bt('نصف القيمة الأصلية (1/2)', 'One-half (1/2) of the initial dose rate'),
        bt('ستة أضعاف القيمة الأصلية', 'Six times the initial dose rate'),
      ],
      correctIndex: 1,
      explanation: bt(
        'تتناسب شدة الإشعاع عكسياً مع مربع المسافة (I₂ / I₁ = d₁² / d₂²)، لذا عند مضاعفة المسافة 3 مرات تنخفض الجرعة إلى 1 / 3² = 1/9.',
        'Intensity follows I₂ / I₁ = (d₁ / d₂)². Tripling distance reduces exposure rate to 1 / 3² = 1/9 of the original intensity—making distance the fastest field protection control.'
      ),
    },
    {
      id: 'q_acad2_2',
      codeReference: 'ASNT SNT-TC-1A / ISO 9712',
      question: bt(
        'أي جهة تمنح التفويض الرسمي النهائي للفاحص للتوقيع على تقارير القبول والرفض في نظام ASNT SNT-TC-1A؟',
        'Under ASNT SNT-TC-1A, who holds final responsibility for authorizing an inspector to sign NDT reports?'
      ),
      options: [
        bt('صاحب العمل (الشركة الموظِّفة) استناداً إلى الممارسة المكتوبة المعتمدة من المستوى الثالث', 'The employer, acting under a Written Practice approved by an NDT Level III'),
        bt('مركز التدريب النظري وحده بمجرد حضور الساعات', 'The classroom training provider upon attendance completion alone'),
        bt('مصنّع جهاز الفحص بالموجات فوق الصوتية', 'The ultrasonic flaw detector equipment manufacturer'),
        bt('المتدرب نفسه بعد قراءة الكود', 'The trainee via self-declaration'),
      ],
      correctIndex: 0,
      explanation: bt(
        'في نظام SNT-TC-1A، الشهادة والتفويض يصدران من صاحب العمل وفق الممارسة المكتوبة (Written Practice) للشركة بعد استيفاء التدريب والخبرة والامتحانات وفحص النظر.',
        'SNT-TC-1A is an employer-based certification practice: the employer certifies and authorizes personnel in accordance with its Level III-approved Written Practice.'
      ),
    },
    {
      id: 'q_acad2_3',
      codeReference: 'HSE / Confined Space NDT',
      question: bt(
        'ما الخطر الرئيسي عند استخدام بخاخات السوائل المخترقة أو الجسيمات المغناطيسية المعلقة داخل خزان مغلق ضيق التهوية؟',
        'What is the primary hazard when spraying solvent-based PT/MT aerosols inside a poorly ventilated vessel?'
      ),
      options: [
        bt('زيادة مغناطيسية جدار الخزان تلقائياً', 'Spontaneous magnetization of the tank shell'),
        bt('تجمع أبخرة قابلة للاشتعال وإزاحة الأكسجين وتأثر الجهاز التنفسي', 'Flammable vapor accumulation, oxygen displacement, and respiratory toxicity'),
        bt('انخفاض تردد المسبار الكهرومغناطيسي', 'Reduction of eddy current probe frequency'),
        bt('تحول الفولاذ الكربوني إلى أوستنيتي', 'Phase transformation of carbon steel into austenite'),
      ],
      correctIndex: 1,
      explanation: bt(
        'تحتوي عبوات الرش الهيدروكربونية على مذيبات متطايرة وغازات دافعة قابلة للاشتعال؛ يلزم تصريح دخول حيز مغلق وقياس الغازات وتهوية قسرية.',
        'Hydrocarbon carrier solvents and aerosol propellants create explosive atmospheres (LEL hazard) and inhalation risks, requiring confined-space gas monitoring and forced ventilation.'
      ),
    },
  ],

  mod_c_acad_vt: [
    {
      id: 'q_acadvt_1',
      codeReference: 'ASME Sec V Art. 9',
      question: bt(
        'ما الحد الأدنى لشدة الإضاءة المطلوبة للفحص البصري العام والفحص البصري الدقيق للتفاصيل الصغيرة وفق ASME Section V Article 9؟',
        'What minimum light intensity is required for general vs. close/fine visual examination per ASME Section V Article 9?'
      ),
      options: [
        bt('100 لوكس للعام و 250 لوكس للدقيق', '100 lux general and 250 lux fine examination'),
        bt('500 لوكس للعام و 1000 لوكس (100 fc) للفحص المباشر الدقيق', '500 lux general and 1000 lux (100 fc) for direct fine examination'),
        bt('50 لوكس لجميع أنواع الفحص البصري', '50 lux for all visual examinations'),
        bt('لا يشترط الكود قياس شدة الإضاءة', 'ASME Section V does not specify illumination levels'),
      ],
      correctIndex: 1,
      explanation: bt(
        'يشترط ASME Sec V Art. 9 حد أدنى 1000 lux (100 fc) للفحص البصري المباشر لكشف الانقطاعات الدقيقة على السطح مع التحقق السنوي من حدة إبصار الفاحص (Jaeger J-1).',
        'ASME Section V Article 9 mandates at least 1000 lux (100 fc) on the examination surface for direct visual inspection, alongside annual Jaeger J-1 near-vision verification.'
      ),
    },
    {
      id: 'q_acadvt_2',
      codeReference: 'ASME Sec V Art. 9 (T-952)',
      question: bt(
        'ما شروط المسافة وزاوية الرؤية المعتمدة في الفحص البصري المباشر (Direct VT)؟',
        'What eye-to-surface distance and viewing angle define Direct Visual Testing (Direct VT) per ASME Section V?'
      ),
      options: [
        bt('مسافة لا تتجاوز 600 مم (24 بوصة) وزاوية رؤية لا تقل عن 30 درجة مع السطح', 'Eye within 600 mm (24 in.) and viewing angle not less than 30° to the surface'),
        bt('مسافة 3 أمتار وزاوية 5 درجات', 'Distance up to 3 meters at a 5° grazing angle'),
        bt('استخدام كاميرا درون فقط بدون قيود مسافة', 'Remote drone camera inspection without qualification'),
        bt('مسافة لا تقل عن 1500 مم وبزاوية عمودية 90 درجة حصراً', 'Minimum 1500 mm distance at strictly 90°'),
      ],
      correctIndex: 0,
      explanation: bt(
        'الفحص المباشر يتطلب مسار رؤية غير منقطع ضمن 600 مم (24 in.) وبزاوية لا تقل عن 30° لضمان التمييز البصري الكافي للتفاصيل السطحية.',
        'Direct visual examination per T-952 requires unobstructed line-of-sight within 24 in. (600 mm) and an angle not less than 30° to the surface being examined.'
      ),
    },
    {
      id: 'q_acadvt_3',
      codeReference: 'AWS D1.1 / ISO 17637',
      question: bt(
        'أي أداة قياس هندسية تُستخدم لقياس عمق النحر الجانبي (Undercut) وارتفاع تقوية اللحام وعدم المحاذاة (Hi-Lo) بدقة؟',
        'Which inspection tool measures weld undercut depth, cap reinforcement height, and linear misalignment (Hi-Lo)?'
      ),
      options: [
        bt('محدد اللحام المتعدد (Bridge Cam / V-WAC Gauge) المعاير', 'Calibrated Bridge Cam / V-WAC weld inspection gauge'),
        bt('قلم تحديد الحرارة (Tempilstick)', 'Thermal melt crayon (Tempilstick)'),
        bt('مؤشر جودة الصورة السلكي (Wire IQI)', 'Radiographic wire penetrameter (IQI)'),
        bt('مقياس التدفق المغناطيسي (Pie Gauge)', 'Magnetic field indicator (Pie Gauge)'),
      ],
      correctIndex: 0,
      explanation: bt(
        'محددات اللحام الميكانيكية (Bridge Cam و V-WAC و Hi-Lo) هي الأدوات القياسية لتوثيق أبعاد درزة اللحام ومقارنتها بحدود القبول الكودية.',
        'Calibrated Bridge Cam, V-WAC, and Hi-Lo gauges provide direct dimensional readings of undercut, crown height, throat thickness, and fit-up alignment.'
      ),
    },
  ],

  mod_c_vt: [
    {
      id: 'q_cvt_1',
      codeReference: 'ISO 17637 / ASME B31.3',
      question: bt(
        'في فحص جذر أنبوب ضغط عالٍ قبل إغلاق الوصلة، أي عيب بصري يُعد حرجاً ويُرفض في معظم خدمات التعب والضغط الدوري؟',
        'During root-pass visual inspection of high-pressure piping, which discontinuity is critical under cyclic service?'
      ),
      options: [
        bt('عدم تغلغل الجذر (Incomplete Root Penetration) وعدم الانصهار على حافة الجذر', 'Incomplete root penetration and lack of root fusion'),
        bt('تموجات منتظمة ناعمة على وجه الدرزة', 'Smooth uniform ripples across the weld face'),
        bt('تغير لوني طفيف خارج منطقة اللحام بـ 100 مم', 'Slight mill-scale tint 100 mm away from the weld'),
        bt('وجود رقم تعريف اللحام مكتوباً بماركر منخفض الكلوريد', 'Low-chloride marker weld ID stencil'),
      ],
      correctIndex: 0,
      explanation: bt(
        'نقص التغلغل وعدم الانصهار في الجذر يعملان كمُركِّز إجهاد حاد (Sharp Notch) يقلل المقطع الفعال ويطلق شروخ الكلال والتآكل.',
        'Incomplete penetration and root lack of fusion create sharp planar stress risers at the bore, severely degrading fatigue life and pressure integrity.'
      ),
    },
    {
      id: 'q_cvt_2',
      codeReference: 'ASME Sec V Art. 9',
      question: bt(
        'عند استخدام منظار صناعي مرن (Video Borescope) لفحص أنبوب مبادل حراري داخلياً، كيف يتم إثبات كفاءة نظام الرؤية عن بعد؟',
        'When using a remote video borescope inside heat-exchanger tubing, how must system resolution be demonstrated?'
      ),
      options: [
        bt('إثبات قدرة المنظار على تمييز خطوط أو حروف مرجعية مكافئة للفحص المباشر تحت نفس ظروف الإضاءة', 'Demonstrating equivalence on a resolution target/fine line standard under test illumination'),
        bt('الاعتماد على دقة شاشة الهاتف المحمول فقط', 'Relying solely on monitor pixel count specifications'),
        bt('زيادة ضغط الماء داخل الأنبوب أثناء التصوير', 'Pressurizing the tube to hydrotest pressure during viewing'),
        bt('لا يلزم التحقق طالما الكاميرا رقمية', 'No demonstration is required for digital sensors'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يشترط ASME Sec V Art. 9 أن يثبت الفحص البصري عن بعد (Remote VT) قدرة تمييز تكافئ الفحص المباشر على بطاقة دقة أو سلك مرجعي.',
        'ASME Sec V Art. 9 requires remote visual systems to be qualified by demonstrating resolution capability at least equivalent to direct visual observation.'
      ),
    },
    {
      id: 'q_cvt_3',
      codeReference: 'AWS D1.1 Clause 8',
      question: bt(
        'متى يجب إجراء الفحص البصري النهائي لوصلات الفولاذ عالي المقاومة المعرض للتشقق الهيدروجيني المتأخر؟',
        'When should final acceptance visual inspection be performed on high-strength steels susceptible to delayed hydrogen cracking?'
      ),
      options: [
        bt('فوراً والدرزة عند 300°C قبل أن تبرد', 'Immediately while the weld is still above 300°C'),
        bt('بعد تبريد الوصلة إلى حرارة الغرفة وانقضاء فترة التأخير المنصوص عليها في الكود (مثل 48 ساعة)', 'After cooling to ambient and completing the code-mandated delay period (e.g., 24–48 hours)'),
        bt('قبل إزالة الخبث السطحي للحفاظ على طبقة الحماية', 'Before slag removal so flux remains intact'),
        bt('بعد طلاء الوصلة بطبقة إيبوكسي سميكة', 'After applying high-build epoxy primer'),
      ],
      correctIndex: 1,
      explanation: bt(
        'التشقق المستحث بالهيدروجين (HIC / Cold Cracking) يحدث بعد التبريد وتجمع الهيدروجين المنتشر، لذا تلزم فترة انتظار قبل الفحص النهائي.',
        'Hydrogen-induced cold cracking initiates after cooling to ambient as diffusible hydrogen migrates to high-stress HAZ regions; codes mandate a hold time prior to final VT/NDT.'
      ),
    },
  ],

  mod_c_pt: [
    {
      id: 'q_cpt_1',
      codeReference: 'ASME Sec V Art. 6 / ASTM E165',
      question: bt(
        'ما الشرط الأساسي لنجاح الفحص بالسوائل المخترقة (Liquid Penetrant Testing - PT) في كشف عيب ما؟',
        'What is the absolute physical prerequisite for Liquid Penetrant Testing (PT) to detect a discontinuity?'
      ),
      options: [
        bt('أن تكون المادة قادرة على التمغنط بشدة عالية', 'The test material must be strongly ferromagnetic'),
        bt('أن يكون الانقطاع مفتوحاً إلى السطح ونظيفاً وجافاً من الملوثات والزيوت', 'The discontinuity must be open to the surface and free of oil, water, or scale'),
        bt('أن يكون العيب في منتصف السماكة على عمق 15 مم', 'The flaw must lie mid-wall at least 15 mm below the surface'),
        bt('أن تزيد درجة حرارة السطح عن 120°C', 'Surface temperature must exceed 120°C'),
      ],
      correctIndex: 1,
      explanation: bt(
        'يعمل PT بخاصية الأنابيب الشعرية (Capillary Action)؛ فإذا كان العيب تحت السطح أو مسدوداً بالدهان أو الزيت أو الطحن البلاستيكي فلن يدخله السائل المخترق.',
        'PT relies on capillary action drawing penetrant into surface-breaking cavities; subsurface flaws or openings smeared shut by heavy grinding/contaminants cannot be detected.'
      ),
    },
    {
      id: 'q_cpt_2',
      codeReference: 'ASME Sec V Art. 6 (T-652)',
      question: bt(
        'ما نطاق درجة حرارة السطح القياسي المعتمد لتطبيق السوائل المخترقة دون تأهيل خاص على كتلة مقارنة حرارية؟',
        'What is the standard surface temperature range for PT without special comparator-block qualification per ASME Sec V Art. 6?'
      ),
      options: [
        bt('من 5°C إلى 52°C (40°F إلى 125°F)', '5°C to 52°C (40°F to 125°F)'),
        bt('من -20°C إلى 150°C', '-20°C to 150°C'),
        bt('من 60°C إلى 200°C', '60°C to 200°C'),
        bt('فقط عند 25°C بالضبط', 'Strictly 25°C ± 1°C'),
      ],
      correctIndex: 0,
      explanation: bt(
        'خارج النطاق 5°C–52°C تتغير لزوجة المخترق أو تتبخر مركباته المتطايرة بسرعة، مما يستلزم تأهيل الإجراء على كتلة ألومنيوم مشققة (Quenched Block).',
        'Outside 5°C–52°C (40°F–125°F), penetrant viscosity degrades or volatile constituents flash off; ASME T-653 requires procedure qualification using a comparator block.'
      ),
    },
    {
      id: 'q_cpt_3',
      codeReference: 'ASME Sec V Art. 6',
      question: bt(
        'عند فحص الفولاذ المقاوم للصدأ الأوستنيتي (Austenitic Stainless Steel) أو التيتانيوم، ما القيد الكيميائي الإلزامي لمواد الفحص؟',
        'When performing PT on austenitic stainless steel or titanium alloys, what chemical control is mandatory for penetrant materials?'
      ),
      options: [
        bt('شهادة دفعة تثبت انخفاض محتوى الهالوجينات (الكلور والفلور) والكبريت لمنع التشقق الإجهادي التآكلي', 'Batch certification verifying restricted halogens (Cl + F) and sulfur content to prevent SCC'),
        bt('إضافة حمض الهيدروكلوريك لتنشيط السطح', 'Adding hydrochloric acid etchant to boost contrast'),
        bt('استخدام مطور مائي مالح لسرعة الجفاف', 'Using saline wet developer for rapid drying'),
        bt('تسخين القطعة بشعلة أسيتيلين مباشرة', 'Direct oxy-acetylene flame drying'),
      ],
      correctIndex: 0,
      explanation: bt(
        'الكلوريدات والكبريت يسببان التشقق التآكلي الإجهادي (Chloride Stress Corrosion Cracking) في الستانلس ستيل، لذا تشترط الأكواد شهادات تحليل لكل تشغيلة.',
        'Residual halogens and sulfur induce intergranular corrosion and chloride stress-corrosion cracking in austenitic alloys; ASME Sec V Art. 6 mandates batch contaminant certification.'
      ),
    },
  ],

  mod_c_mt: [
    {
      id: 'q_cmt_1',
      codeReference: 'ASME Sec V Art. 7 / ASTM E709',
      question: bt(
        'متى يعطي الفحص بالجسيمات المغناطيسية (MT) أقوى تسرب تدفق مغناطيسي (Flux Leakage) وأوضح مؤشر للشق؟',
        'When does Magnetic Particle Testing (MT) generate maximum magnetic flux leakage and clearest indication visibility?'
      ),
      options: [
        bt('عندما يكون اتجاه الشق موازياً تماماً لخطوط المجال المغناطيسي (0 درجة)', 'When the crack is strictly parallel (0°) to magnetic flux lines'),
        bt('عندما يتعامد اتجاه الشق (90 درجة تقريباً) مع خطوط المجال المغناطيسي', 'When the crack is oriented perpendicular (~90°) to magnetic flux lines'),
        bt('عندما تكون القطعة من الألومنيوم أو النحاس النقي', 'When inspecting non-magnetic aluminum or copper'),
        bt('بعد إيقاف التيار ومسح الجسيمات بقطعة قماش جافة', 'After wiping particles off prior to evaluation'),
      ],
      correctIndex: 1,
      explanation: bt(
        'أعلى تسرب للتدفق المغناطيسي يحدث عندما يقطع الانقطاع خطوط المجال بزاوية 90°؛ لذلك يشترط الكود فحص كل منطقة في اتجاهين متعامدين متراكبين.',
        'Flux leakage peaks when a discontinuity intercepts flux lines at 90° and drops sharply below 45°; therefore ASME Sec V Art. 7 mandates two perpendicular magnetizing orientations.'
      ),
    },
    {
      id: 'q_cmt_2',
      codeReference: 'ASME Sec V Art. 7 (T-762)',
      question: bt(
        'ما الحد الأدنى لقوة الرفع (Dead-Weight Lifting Power) المطلوب لمعايرة نير كهرومغناطيسي متردد (AC Electromagnetic Yoke)؟',
        'What minimum dead-weight lifting power is required to verify an AC electromagnetic yoke at maximum pole spacing per ASME Sec V Art. 7?'
      ),
      options: [
        bt('4.5 كجم (10 أرطال)', '4.5 kg (10 lb)'),
        bt('18.1 كجم (40 رطلاً)', '18.1 kg (40 lb)'),
        bt('1.0 كجم (2.2 رطل)', '1.0 kg (2.2 lb)'),
        bt('50 كجم (110 أرطال)', '50 kg (110 lb)'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يتطلب ASME Sec V Art. 7 قدرة رفع لا تقل عن 4.5 kg (10 lb) للنير المتردد AC، و 18.1 kg (40 lb) للنير المستمر أو الدائم DC عند أقصى تباعد للأقطاب.',
        'ASME T-762 requires AC yokes to lift at least 10 lb (4.5 kg) and DC/permanent yokes at least 40 lb (18.1 kg) at the maximum pole spacing used.'
      ),
    },
    {
      id: 'q_cmt_3',
      codeReference: 'ASME Sec V Art. 7',
      question: bt(
        'لماذا يُفضل التيار المتردد (AC) مع الجسيمات الفلورية الرطبة عند البحث عن شروخ الكلال السطحية الدقيقة أثناء الخدمة؟',
        'Why is AC magnetization with wet fluorescent particles preferred for detecting tight in-service surface fatigue cracks?'
      ),
      options: [
        bt('لأن ظاهرة القشرة (Skin Effect) تركز التدفق على السطح مع حركية عالية للجسيمات الدقيقة تحت الأشعة فوق البنفسجية UV-A', 'Skin effect concentrates flux right at the surface while AC vibration enhances fine particle mobility under UV-A'),
        bt('لأن التيار المتردد يخترق سماكة 50 مم للكشف عن المسامية العميقة', 'Because AC penetrates 50 mm deep to reveal mid-wall porosity'),
        bt('لأنه لا يتطلب تنظيف السطح أو التحقق من شدة UV-A', 'Because it eliminates surface cleaning and UV-A radiometer checks'),
        bt('لأنه يعمل بكفاءة على الفولاذ الأوستنيتي 316L', 'Because it magnetizes non-magnetic 316L stainless steel'),
      ],
      correctIndex: 0,
      explanation: bt(
        'التيار المتردد يتركز على الطبقة السطحية بفضل Skin Effect ويمنح الجسيمات اهتزازاً يساعدها على التجمع فوق الشقوق الضيقة جداً، مع تباين بصري فائق للفلورسنت (≥ 1000 µW/cm² UV-A).',
        'AC skin effect concentrates flux density at the surface and agitates suspended fine fluorescent particles into tight crack mouths, inspected at ≥ 1000 µW/cm² UV-A intensity.'
      ),
    },
  ],

  mod_c_ut: [
    {
      id: 'q_cut_1',
      codeReference: 'ASME Sec V Art. 4 / Snell Law',
      question: bt(
        'عند فحص لحام تناكبي بمسبار زاوية 60° (موجة قصية Shear Wave) على صفيحة سمكها 20 مم، كم تساوي مسافة القفزة الكاملة (Full Skip Distance)؟',
        'Inspecting a 20 mm butt weld with a 60° shear-wave probe, what is the theoretical Full Skip Surface Distance?'
      ),
      options: [
        bt('نحو 69.3 مم (2 × T × tan 60°)', 'Approximately 69.3 mm (2 × T × tan 60°)'),
        bt('نحو 34.6 مم (T × tan 60°)', 'Approximately 34.6 mm (T × tan 60°)'),
        bt('نحو 40.0 مم (2 × T)', 'Approximately 40.0 mm (2 × T)'),
        bt('نحو 23.1 مم (T / cos 30°)', 'Approximately 23.1 mm (T / cos 30°)'),
      ],
      correctIndex: 0,
      explanation: bt(
        'نصف القفزة (Half Skip) = T × tan(60°) = 20 × 1.732 = 34.64 mm، وبالتالي القفزة الكاملة للوصول إلى أعلى الجذر/الوجه بعد الانعكاس = 2 × 34.64 = 69.28 mm.',
        'Half-skip distance is T × tan(θ) = 20 × 1.732 = 34.64 mm; Full Skip (V-path surface projection) is 2 × T × tan(60°) ≈ 69.3 mm.'
      ),
    },
    {
      id: 'q_cut_2',
      codeReference: 'ASME Sec V Art. 4',
      question: bt(
        'ما الغرض الهندسي من إنشاء منحنى تصحيح المسافة والسعة (DAC Curve) على كتلة المعايرة الأساسية في الفحص بالموجات فوق الصوتية؟',
        'What is the primary engineering purpose of constructing a Distance-Amplitude Correction (DAC) curve on the basic calibration block?'
      ),
      options: [
        bt('تعويض التشتت والتوهين الصوتي مع زيادة المسار بحيث تعطي عواكس متماثلة الحجم مرجع تقييم موحد عند أعماق مختلفة', 'Compensating for beam spread and attenuation so identical reflectors are evaluated against an equal sensitivity baseline across depth'),
        bt('تغيير تردد البلورة الكهرضغطية تلقائياً أثناء المسح', 'Automatically changing piezoelectric crystal frequency during scanning'),
        bt('إلغاء الحاجة إلى سائل الاقتران (Couplant) على الأسطح الخشنة', 'Eliminating the need for ultrasonic couplant on rough surfaces'),
        bt('تحويل الموجات القصية إلى موجات سطحية Rayleigh', 'Converting shear waves into Rayleigh surface waves'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تنخفض سعة صدى العاكس المرجعي (مثل ثقب جانبي SDH) كلما زاد المسار الصوتي بسبب انتشار الحزمة والتوهين؛ يرسم DAC المرجع القياسي للتقييم عبر كامل السماكة.',
        'Echo amplitude from equal-size side-drilled holes drops with sound path due to beam divergence and material attenuation; DAC normalizes reference sensitivity across the full range.'
      ),
    },
    {
      id: 'q_cut_3',
      codeReference: 'IIW V1 / ISO 2400 Calibration',
      question: bt(
        'لماذا يجب التحقق دورياً من نقطة خروج الشعاع (Beam Index Point - BIP) وزاوية الانكسار الفعلية للمسبار الزاوي على كتلة V1/V2؟',
        'Why must Beam Index Point (BIP) and actual refracted angle be verified periodically on an IIW V1/V2 block?'
      ),
      options: [
        bt('لأن تآكل الحذاء البلاستيكي (Wedge Wear) يزيح نقطة الخروج ويغير زاوية الانكسار مما يؤدي لخطأ مباشر في تحديد موقع وعمق العيب', 'Because acrylic wedge wear shifts the exit point and alters refracted angle, causing direct flaw-plotting errors in depth and projection'),
        bt('لأن كتلة V1 تشحن بطارية الجهاز لاسلكياً', 'Because the V1 block recharges the flaw detector'),
        bt('لزيادة سرعة الصوت داخل معدن اللحام بنسبة 20%', 'To increase shear velocity in weld metal by 20%'),
        bt('لإزالة المغناطيسية المتبقية من المسبار', 'To demagnetize the piezoelectric transducer'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تآكل قاعدة الحذاء البلاستيكي بالاحتكاك أثناء المسح يغير هندسة الانكسار؛ أي خطأ بمقدار درجتين يسبب إزاحة ملموسة في حساب العمق (S·cosθ) والمسافة السطحية (S·sinθ) في المسار الثاني.',
        'Friction wear on the plastic wedge shifts the index point and changes wedge angle; even a 2° error misplaces root vs. toe indications on the second leg, leading to wrong repair excavations.'
      ),
    },
  ],

  mod_c_rt: [
    {
      id: 'q_crt_1',
      codeReference: 'ASME Sec V Art. 2 (T-274)',
      question: bt(
        'كيف تُحسب اللاتحديدية الهندسية (Geometric Unsharpness Ug) في التصوير الإشعاعي الصناعي، وكيف نقللها؟',
        'How is radiographic Geometric Unsharpness (Ug) calculated, and how is image sharpness improved?'
      ),
      options: [
        bt('Ug = F × d / D؛ وتقل بتصغير حجم البؤرة (F) وتقريب الفيلم للعينة (d) وزيادة مسافة المصدر (D)', 'Ug = F × d / D; reduced by smaller focal spot (F), closer film-to-object contact (d), and larger source-to-object distance (D)'),
        bt('Ug = D / (F × d)؛ وتقل بتقريب المصدر قدر الإمكان من السطح', 'Ug = D / (F × d); improved by placing the source right on the weld'),
        bt('لا تعتمد Ug على أبعاد المصدر بل على حرارة أحواض التحميض فقط', 'Ug depends solely on darkroom developer temperature'),
        bt('تقل Ug بزيادة سماكة الرصاص الخلفي إلى 25 مم', 'Ug is reduced by using a 25 mm rear lead plate'),
      ],
      correctIndex: 0,
      explanation: bt(
        'اللاتحديدية الهندسية Ug = F·d / D تحدد ضبابية حواف الصورة؛ وضع الفيلم ملاصقاً للقطعة واختيار مسافة مصدر إلى قطعة كافية يبقي Ug ضمن حدود ASME T-274.2.',
        'Geometric penumbra Ug = F·d / D governs edge sharpness. Minimizing object-to-film distance (d) and maintaining adequate source-to-object distance (D) satisfies ASME Sec V T-274.2.'
      ),
    },
    {
      id: 'q_crt_2',
      codeReference: 'ASME Sec V Art. 2 (T-282)',
      question: bt(
        'ما نطاق الكثافة الضوئية (Optical Density H&D) المقبول للفيلم المحمض باستخدام مصدر أشعة جاما (Ir-192) وفق ASME Section V؟',
        'What transmitted optical density range is acceptable for gamma-ray (Ir-192) weld radiographs per ASME Section V Article 2?'
      ),
      options: [
        bt('من 2.0 إلى 4.0 في منطقة اللحام ومؤشر جودة الصورة IQI', '2.0 to 4.0 across the area of interest and IQI'),
        bt('من 0.3 إلى 0.9 فقط', '0.3 to 0.9 only'),
        bt('أعلى من 5.5 دائماً بدون جهاز إضاءة خاص', 'Always above 5.5 on a standard viewer'),
        bt('من 1.0 إلى 1.4 حصراً لأشعة جاما', '1.0 to 1.4 exclusively for gamma sources'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يشترط ASME T-282.1 كثافة لا تقل عن 1.8 للأشعة السينية X-ray و 2.0 لأشعة جاما Gamma-ray وبحد أقصى 4.0 لضمان تباين الفيلم وحساسية رؤية السلك الأساسي.',
        'ASME T-282.1 mandates minimum transmitted density of 1.8 for X-ray and 2.0 for gamma radiography, up to 4.0 max, ensuring film gradient stays in the high-contrast region.'
      ),
    },
    {
      id: 'q_crt_3',
      codeReference: 'ASME Sec V Art. 2',
      question: bt(
        'ماذا يدل ظهور صورة حرف الرصاص "B" فاتحة (Light Image) على خلفية أغمق في الفيلم الإشعاعي؟',
        'What does a light image of the lead letter "B" on a darker radiograph background indicate per ASME Section V?'
      ),
      options: [
        bt('وجود إشعاع مرتد مفرط (Excessive Backscatter) يجعل الفيلم مرفوضاً ما لم تُعالج الحماية الخلفية', 'Excessive backscatter radiation reaching the film—requiring rejection unless dark/absent'),
        bt('أن حساسية مؤشر جودة الصورة IQI ممتازة ومعتمدة', 'Optimal IQI contrast sensitivity achieved'),
        bt('أن الفيلم وُضع من جانب المصدر (Source Side)', 'Confirmation of source-side IQI placement'),
        bt('أن زمن التثبيت في الغرفة المظلمة مثالي', 'Confirmation of proper fixer wash time'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يُثبّت حرف B الرصاصي خلف حافظة الفيلم؛ إذا ظهرت صورته فاتحة فهذا يعني أن إشعاعاً مرتداً من الجدران أو الأرضية اخترق ظهر الكاسيت وشوّه التباين.',
        'A lead "B" placed on the back of each film holder monitors backscatter; a light "B" image on a darker background proves excessive backscatter radiation, rendering the radiograph unacceptable.'
      ),
    },
  ],

  mod_c2_1: [
    {
      id: 'q_c21_1',
      codeReference: 'ASME VIII Div. 1 UW-51 / B31.3',
      question: bt(
        'عند تفسير فيلم إشعاعي أو فحص UT مستوى ثانٍ وفق ASME VIII Div. 1 (UW-51)، ما حكم وجود شق (Crack) أو عدم انصهار (Lack of Fusion) مهما كان طوله؟',
        'When evaluating welds to ASME Section VIII Div. 1 UW-51, what is the disposition of any crack, lack of fusion, or incomplete penetration?'
      ),
      options: [
        bt('مقبول إذا كان طوله أقل من 6 مم', 'Acceptable provided length is under 6 mm'),
        bt('مرفوض قطعياً أياً كان طوله لأنه عيب مستوٍ حاد الأطراف', 'Unacceptable (Reject) regardless of length due to planar stress concentration'),
        bt('يُقبل بشرط زيادة كثافة الفيلم إلى 3.5', 'Acceptable if film density exceeds 3.5'),
        bt('يُترك لتقدير اللحام دون توثيق', 'Left to welder discretion without NCR'),
      ],
      correctIndex: 1,
      explanation: bt(
        'الأكواد الإنشائية مثل ASME VIII UW-51 و B31.3 ترفض أي شق أو عدم انصهار أو نقص تغلغل في الفحص الكامل بغض النظر عن الطول، بينما تُقيّم المسامية وخبث اللحام وفق حدود الطول والسماكة.',
        'Under ASME VIII UW-51 full radiography/UT acceptance criteria, planar discontinuities (cracks, lack of fusion, incomplete penetration) are unacceptable regardless of length.'
      ),
    },
    {
      id: 'q_c21_2',
      codeReference: 'ASME Sec V / Artifact vs Flaw',
      question: bt(
        'كيف يميز فاحص المستوى الثاني بين المؤشر الكاذب/الهندسي (Non-Relevant / Geometric Indication) ومؤشر العيب الحقيقي في وصلة أنبوب؟',
        'How does a Level II inspector distinguish a geometric root contour echo from a true root crack in pipe weld UT?'
      ),
      options: [
        bt('برسم المقطع الهندسي وحساب المسافة السطحية والعمق بدقة ومقارنتها بعرض الجذر والفحص من الجانبين مع المسح الدوراني', 'Plotting exact surface projection & depth against weld prep geometry, scanning from both sides, and observing echo envelope behavior'),
        bt('بخفض الكسب (Gain) بمقدار 20 dB حتى تختفي كل الإشارات من الشاشة', 'Dropping instrument gain by 20 dB until the screen is blank'),
        bt('بتجاهل أي إشارة تقع في الثلث السفلي من السماكة', 'Ignoring all echoes originating in the bottom third of wall thickness'),
        bt('باعتماد أول صدى يظهر دون قياس المسافة من خط المنتصف', 'Recording the first echo without measuring probe-to-centerline standoff'),
      ],
      correctIndex: 0,
      explanation: bt(
        'التمييز الهندسي الدقيق يتطلب قياس مسافة المسبار من خط محور اللحام وتوقيع المسار الصوتي على رسم بمقياس 1:1 والفحص من الجهتين للتمييز بين خرزة الجذر العكسية وشق طرف الجذر.',
        'Accurate discrimination plots horizontal projection (S·sinθ) from the weld centerline on a 1:1 cross-section and cross-verifies from the opposite side along with skewed/rotational facet response.'
      ),
    },
    {
      id: 'q_c21_3',
      codeReference: 'ASME Sec V Art. 1 (T-150)',
      question: bt(
        'ما مسؤولية فاحص المستوى الثاني (NDT Level II) تجاه كتابة تعليمات الفحص الميدانية (Written Instruction)؟',
        'What authority does an ISO 9712 / SNT-TC-1A Level II hold regarding written NDT instructions?'
      ),
      options: [
        bt('إعداد تعليمات عمل تفصيلية للعاملين بالمستوى الأول ضمن نطاق الإجراء المعتمد من المستوى الثالث، وتقييم النتائج وفق الكود', 'Preparing technique-specific work instructions for Level I personnel within an approved procedure and interpreting/evaluating results to code'),
        bt('تعديل حدود القبول في الكود الدولي دون الرجوع للهندسة', 'Waiving ASME code acceptance criteria unilaterally'),
        bt('اعتماد الممارسة المكتوبة العليا للشركة بدلاً من المستوى الثالث', 'Approving the corporate Written Practice in place of Level III'),
        bt('الاكتفاء بتحريك المسبار دون صلاحية تفسير الإشارات', 'Operating probes only, with zero authority to interpret indications'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يُخوّل المستوى الثاني بضبط ومعايرة المعدات، وتفسير وتقييم النتائج وفق الأكواد المطبقة، وصياغة تعليمات الفحص التنفيذية ضمن الإجراء العام المعتمد من المستوى الثالث.',
        'Level II personnel calibrate equipment, interpret and evaluate results against applicable codes, and prepare specific NDT instructions derived from Level III-approved procedures.'
      ),
    },
  ],

  mod_c2_2: [
    {
      id: 'q_c22_1',
      codeReference: 'ASME Sec V Art. 4 (6 dB Drop)',
      question: bt(
        'كيف تُطبق طريقة خفض 6 ديسيبل (6 dB Drop / Half-Amplitude Technique) لتقدير طول العيب الطولي في الفحص بالموجات فوق الصوتية؟',
        'How is the 6 dB drop (half-amplitude) sizing technique applied to measure the length of an elongated reflector?'
      ),
      options: [
        bt('تعظيم إشارة العيب ثم تحريك المسبار موازياً للحام في الاتجاهين حتى تنخفض السعة إلى النصف (-6 dB) وقياس المسافة بين مركزي المسبار', 'Maximize peak echo, scan parallel to the weld in both directions until amplitude drops by half (-6 dB), and measure center-to-center probe travel'),
        bt('رفع الكسب 6 dB وتسجيل عرض الشاشة الكلي', 'Add 6 dB gain and record the full timebase range'),
        bt('قياس المسافة بين أول قفزة وثاني قفزة عمودياً على اللحام', 'Measure half-skip to full-skip distance perpendicular to the weld'),
        bt('قراءة ارتفاع الصدى كنسبة مئوية وضربها في السماكة', 'Multiply %FSH directly by plate thickness'),
      ],
      correctIndex: 0,
      explanation: bt(
        'عند حافة العيب الممتد يقع نصف عرض الحزمة الصوتية على العاكس ونصفها خارجه فتنخفض السعة إلى 50% (-6 dB)؛ تُقاس المسافة بين نقطتي الانخفاض لتحديد طول العيب الممتد.',
        'When the transducer centerline crosses the extremity of a flaw larger than the beam width, half the beam intercepts the reflector, dropping echo height by 50% (-6 dB).'
      ),
    },
    {
      id: 'q_c22_2',
      codeReference: 'ISO 9712 / Inspection Reporting',
      question: bt(
        'أي عنصر مما يلي يُبطل حجية تقرير الفحص غير الإتلافي عند التدقيق الفني لو لم يُذكر بدقة؟',
        'Which omission invalidates the traceability of a formal NDT inspection report during quality auditing?'
      ),
      options: [
        bt('رقم الإجراء المعتمد وإصداره، الأرقام التسلسلية للأجهزة وكتل المعايرة، تحديد الوصلة ونقطة الصفر المرجعية (Datum)', 'Approved procedure number/revision, calibrated equipment & block serial IDs, weld ID, and zero datum reference'),
        bt('لون خوذة السلامة الخاصة بالفاحص', 'Color of the inspector hard hat'),
        bt('اسم شركة الشحن الناقلة لكتلة المعايرة قبل خمس سنوات', 'Historical freight carrier of the calibration block'),
        bt('عدد صفحات كتالوج المصنّع التجاري', 'Page count of the vendor sales brochure'),
      ],
      correctIndex: 0,
      explanation: bt(
        'التتبع الكامل (Traceability) يشترط ربط النتيجة برقم الإجراء، الكود المرجعي، معايرة الجهاز، هوية الوصلة، ونقطة القياس المرجعية (0 Datum & Clockwise Direction) لإمكانية إعادة الفحص والتحقق قبل الحفر للإصلاح.',
        'Auditability and accurate repair excavation depend on complete traceability: procedure/code edition, valid equipment/block calibration IDs, weld map ID, and unmistakable datum coordinates.'
      ),
    },
    {
      id: 'q_c22_3',
      codeReference: 'Complementary NDT Strategy',
      question: bt(
        'لماذا يوصى بالجمع بين طريقة سطحية (MT أو PT) وطريقة حجمية (UT أو RT) في الوصلات الحرجة عالية السماكة؟',
        'Why do critical pressure-vessel codes pair a surface method (MT/PT) with a volumetric method (UT/RT) on thick-wall joints?'
      ),
      options: [
        bt('لأن UT يعاني من منطقة ميتة قريبة من السطح وRT ضعيف الحساسية للشروخ السطحية الضيقة المائلة، بينما MT/PT عالية الحساسية للسطح ولا تكشف الحجم الداخلي', 'UT has near-surface dead zones and RT can miss tight misoriented surface cracks, whereas MT/PT excel at surface-breaking flaws but cannot inspect internal volume'),
        bt('لمضاعفة تكلفة الفحص دون سبب فيزيائي', 'Solely to duplicate paperwork without physical benefit'),
        bt('لأن MT تزيل الخبث الداخلي قبل التصوير الإشعاعي', 'Because MT removes internal slag inclusions prior to radiography'),
        bt('لأن PT تقيس السماكة المتبقية بدقة 0.01 مم', 'Because PT measures remaining wall thickness to 0.01 mm'),
      ],
      correctIndex: 0,
      explanation: bt(
        'لكل طريقة حدود فيزيائية؛ الجمع بين MT/PT للسطح و UT/RT للحجم يغلق مناطق العمى الهندسية ويحقق أعلى احتمالية كشف (POD) عبر كامل المقطع.',
        'Every NDT method has physical blind spots: pairing surface (MT/PT) with volumetric (UT/RT) eliminates near-surface dead zones and orientation blind spots across the entire weld cross-section.'
      ),
    },
  ],

  mod_c3_1: [
    {
      id: 'q_c31_1',
      codeReference: 'ASME Sec V Art. 1 (T-150)',
      question: bt(
        'متى يلزم إجراء عرض عملي لتأهيل إجراء الفحص (Procedure Qualification Demonstration) أمام مفتش الكود المفوض (AI)؟',
        'Under ASME Section V Article 1, when must a written NDT procedure undergo formal demonstration to the Authorized Inspector (AI)?'
      ),
      options: [
        bt('عندما ينص القسم المرجعي للكود على ذلك أو عند تعديل متغير أساسي (Essential Variable) خارج النطاق المؤهل', 'When required by the referencing code section or whenever an Essential Variable is changed outside its qualified range'),
        bt('فقط عند تغيير خط الطباعة أو شعار الشركة في ترويسة الإجراء', 'Whenever the document font or company logo header is updated'),
        bt('عند استبدال كابل طاقة خارجي بنفس المواصفات', 'When swapping an identical AC power cord'),
        bt('لا يلزم أي إثبات عملي للإجراءات المكتوبة في ASME', 'ASME Section V never requires practical procedure demonstration'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يميز ASME Sec V بين المتغيرات الأساسية (Essential Variables) وغير الأساسية؛ أي تغيير في متغير أساسي يؤثر على حساسية الفحص يستوجب إعادة تأهيل الإجراء عملياً على عينة مرجعية.',
        'ASME Section V classifies Essential vs. Nonessential Variables in each article table; changing an Essential Variable invalidates prior qualification and mandates re-demonstration.'
      ),
    },
    {
      id: 'q_c31_2',
      codeReference: 'MIL-HDBK-1823A / POD Statistics',
      question: bt(
        'في منحنيات احتمالية الكشف (Probability of Detection - POD)، ماذا يمثل المعامل الإحصائي (a90/95)؟',
        'In NDT reliability engineering (POD curves), what does the metric a90/95 represent?'
      ),
      options: [
        bt('حجم العيب الذي يُكتشف باحتمالية 90% وبمستوى ثقة إحصائية 95%', 'The flaw size detected with 90% probability at a 95% lower confidence bound'),
        bt('نسبة الفاحصين الحاصلين على 95% في الامتحان النظري', 'Percentage of inspectors scoring 95% on written multiple-choice tests'),
        bt('أقصى سماكة جدار تقبل الفحص عند 90°C', 'Maximum inspectable wall thickness at 90°C'),
        bt('زاوية انكسار الشعاع بين 90 و 95 درجة', 'Refracted beam angle between 90° and 95°'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يُعد a90/95 المعيار الهندسي الحاسم في تقييم صلاحية الخدمة وميكانيكا الكسر لتحديد أصغر عيب يمكن الاعتماد على الإجراء في عدم تفويته.',
        'a90/95 defines the minimum flaw size detectable 90% of the time with 95% statistical confidence—serving as the critical flaw input for fracture-mechanics Fitness-For-Service assessments.'
      ),
    },
    {
      id: 'q_c31_3',
      codeReference: 'ASNT SNT-TC-1A / ISO 9712',
      question: bt(
        'عند صياغة الممارسة المكتوبة (Written Practice) للشركة، أي بند يجب أن يحدده المستوى الثالث بوضوح لتجنب تعارض المصالح؟',
        'When drafting an employer Written Practice, what safeguard must the NDT Level III establish for certification examinations?'
      ),
      options: [
        bt('فصل التدريب عن إدارة الامتحانات وحماية سرية بنوك الأسئلة والعينات العملية الموثقة بعيوب معروفة', 'Segregating training from exam administration, securing question banks, and maintaining blinded flawed practical specimens'),
        bt('السماح للمرشح بتصحيح ورقته العملية بنفسه', 'Allowing candidates to self-grade practical flaw maps'),
        bt('إلغاء فحص تمييز الألوان لطريقة السوائل المخترقة الملونة', 'Waiving color-contrast vision checks for visible dye PT'),
        bt('منح شهادة دائمة مدى الحياة دون تجديد دوري', 'Issuing lifetime certifications without 5-year recertification'),
      ],
      correctIndex: 0,
      explanation: bt(
        'سلامة التأهيل تتطلب سرية الأسئلة، وتوثيق خرائط العيوب المرجعية للعينات العملية (Master Flaw Key)، والتحقق الدوري من الإبصار، والتجديد كل 5 سنوات.',
        'Defensible qualification schemes enforce exam security, blinded practical test pieces with documented master flaw keys, annual vision tests, and structured recertification intervals.'
      ),
    },
  ],

  mod_c3_2: [
    {
      id: 'q_c32_1',
      codeReference: 'ISO/IEC 17020 / Audit Governance',
      question: bt(
        'أثناء تدقيق فني، تبيّن أن فاحصاً استخدم كتلة معايرة منتهية الصلاحية لفحص 18 وصلة أنبوب غاز. ما الإجراء التصحيحي الصحيح للمستوى الثالث؟',
        'During an audit, a Level III discovers 18 gas-line welds were inspected using an out-of-calibration reference block. What is the mandatory action?'
      ),
      options: [
        bt('فتح عدم مطابقة (NCR)، حجر التقارير المتأثرة، التحقق الفوري من حالة الكتلة لتقييم الأثر، وإعادة فحص الوصلات بمعدات معايرة صالحة عند الشك', 'Open an NCR, quarantine affected reports, evaluate impact by checking the block against master standards, and re-inspect affected welds if validity cannot be proven'),
        bt('تمديد تاريخ شهادة المعايرة يدوياً بالقلم وإغلاق الملف', 'Backdate the calibration sticker manually and close the file'),
        bt('إعادة فحص وصلة واحدة فقط وافتراض سلامة الباقي دون توثيق', 'Re-test one weld informally without documenting impact'),
        bt('تجاهل الملاحظة طالما لم ينفجر الخط في اختبار الضغط المائي', 'Ignore the finding if hydrotest passed'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تتطلب ISO/IEC 17020 و ISO 9001 تقييم صلاحية نتائج الفحوصات السابقة (Impact Assessment on Previous Results) كلما ثَبُت خروج أداة قياس عن المعايرة، مع إعادة الفحص الرسمي عند عدم ثبوت الدقة.',
        'ISO/IEC 17020 and ISO 9001 require formal impact evaluation on all prior inspections performed with out-of-tolerance equipment, quarantining deliverables and re-examining suspect joints.'
      ),
    },
    {
      id: 'q_c32_2',
      codeReference: 'NDT Method Selection Matrix',
      question: bt(
        'ما الاستراتيجية الأمثل لفحص لحام فولاذ أوستنيتي مقاوم للصدأ سمكه 30 مم ذي بنية حبيبية خشنة يسبب تشتتاً عالياً للموجات القصية التقليدية؟',
        'Which inspection strategy best addresses coarse-grained 30 mm austenitic stainless steel welds that severely scatter conventional shear-wave UT?'
      ),
      options: [
        bt('استخدام مسابر مصفوفة طورية منخفضة التردد ذات موجات طولية منكسرة ثنائية العناصر (TRL / Dual Matrix PAUT) مع إجراء مؤهل على عينة مماثلة وبمساندة RT/PT', 'Low-frequency Transmit-Receive Longitudinal (TRL) Phased Array qualified on a representative austenitic mockup, complemented by RT and low-halogen PT'),
        bt('استخدام الفحص بالجسيمات المغناطيسية الجافة MT بتيار مستمر', 'Dry-powder DC Magnetic Particle Testing'),
        bt('استخدام مسبار موجة قصية 10 MHz لزيادة التوهين', '10 MHz conventional shear-wave single-crystal UT'),
        bt('الاكتفاء بالفحص البصري الخارجي للغطاء فقط', 'External cap visual inspection only'),
      ],
      correctIndex: 0,
      explanation: bt(
        'الموجات الطولية المنكسرة بصفيفات الإرسال والاستقبال المنفصلة (TRL PAUT) تقلل الضوضاء الحبيبية والتشوه الاتجاهي في معدن اللحام الأوستنيتي مقارنة بالموجات القصية، ولا يعمل MT لأن الأوستنيت غير مغناطيسي.',
        'Coarse dendritic austenitic grains skew and scatter shear waves (and are non-magnetic, ruling out MT); low-frequency TRL Phased Array qualified on representative mockups plus PT/RT is code best practice.'
      ),
    },
    {
      id: 'q_c32_3',
      codeReference: 'API 579-1 / ASME FFS-1',
      question: bt(
        'عند طلب الهندسة مدخلات تقييم الملاءمة للخدمة (Fitness-For-Service FFS) لشق مكتشف في وعاء ضغط، ما البيانات الحرجة المطلوبة من المستوى الثالث؟',
        'When engineering requests NDT inputs for an API 579-1 / ASME FFS-1 fracture assessment of a vessel crack, what data is critical?'
      ),
      options: [
        bt('ارتفاع العيب عبر السماكة (Through-Wall Height)، الطول، العمق من السطح الأقرب، الاتجاه، وهامش خطأ القياس (Sizing Uncertainty)', 'Through-wall height, length, ligament depth to nearest surface, orientation relative to principal stress, and sizing uncertainty bound'),
        bt('سعة الإشارة كنسبة مئوية فقط (%FSH) دون أبعاد بالمليمتر', 'Peak echo %FSH alone without dimensional sizing'),
        bt('وقت بداية ونهاية استراحة فريق الفحص', 'Inspector shift break schedule'),
        bt('تقدير تكلفة الطلاء الخارجي للوعاء', 'Exterior paint color specification'),
      ],
      correctIndex: 0,
      explanation: bt(
        'حسابات ميكانيكا الكسر في API 579 تعتمد على ارتفاع العيب في اتجاه السماكة والرباط المعدني المتبقي (Remaining Ligament) مع إضافة عدم يقين القياس للجانب الآمن، وليس على سعة الصدى وحدها.',
        'Fracture mechanics in API 579-1 requires conservative through-wall flaw height, length, remaining ligament, and upper-bound sizing uncertainty—echo amplitude (%FSH) does not correlate directly to crack height.'
      ),
    },
  ],

  mod_adv_ut: [
    {
      id: 'q_advut_1',
      codeReference: 'ASME Sec V Art. 4 Mandatory Appendix V',
      question: bt(
        'كيف يقوم نظام المصفوفة الطورية (PAUT) بتوجيه الحزمة الصوتية إلكترونياً بزاوية 40° إلى 70° (S-Scan) دون تحريك الحذاء ميكانيكياً؟',
        'How does a Phased Array (PAUT) system electronically sweep a beam from 40° to 70° (S-Scan) through a single wedge?'
      ),
      options: [
        bt('بتطبيق قوانين تأخير زمني محسوبة (Focal Laws) على مجموعة نشطة من العناصر الكهرضغطية لتشكيل جبهة موجة متداخلة بنّاءة بالزاوية والعمق المطلوبين', 'By applying calculated microsecond delay laws (Focal Laws) across an active element aperture so wavelets interfere constructively at each target angle and focal depth'),
        bt('بتحريك محرك كهربائي صغير داخل المسبار لتدوير بلورة واحدة', 'By spinning a mechanical servo motor inside the probe housing'),
        bt('بتبديل سائل الاقتران بين الزيت والماء لكل زاوية', 'By alternating couplant viscosity between angles'),
        bt('برفع الجهد الكهربائي من 50V إلى 500V تدريجياً فقط', 'Solely by stepping pulser voltage from 50 V to 500 V'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يعتمد مبدأ هويجنز في PAUT على إطلاق نبضات بتأخيرات زمنية نانوثانية دقيقة لكل عنصر في الفتحة النشطة (Aperture)، مما يوجه الحزمة ويركزها إلكترونياً.',
        'Huygens constructive interference of individually delayed piezo-elements steers and focuses the ultrasonic wavefront across multiple angles in real time.'
      ),
    },
    {
      id: 'q_advut_2',
      codeReference: 'ASME Sec V Art. 4 Appendix III (TOFD)',
      question: bt(
        'في تقنية حيود زمن الرحلة (TOFD)، على ماذا يعتمد قياس الارتفاع الفعلي للعيب الداخلي بدقة عالية؟',
        'In Time-of-Flight Diffraction (TOFD), what physical measurement determines internal flaw through-wall height?'
      ),
      options: [
        bt('فرق زمن الوصول (Δt) بين إشارتي الحيود من الطرف العلوي والطرف السفلي للعيب بالنسبة للموجة الجانبية (Lateral Wave) وصدى الجدار الخلفي', 'Arrival-time separation (Δt) between upper and lower crack-tip diffracted signals referenced against the lateral wave and back-wall echo'),
        bt('شدة سعة الانعكاس المرآوي (%FSH) وحدها كما في النبض والصدى التقليدي', 'Specular echo amplitude (%FSH) alone relative to a DAC curve'),
        bt('لون البكسل الأحمر في شاشة المسح القطاعي', 'Color palette saturation on an A-scan'),
        bt('مقاومة الملف الكهربائي للمسبار', 'Probe coil electrical impedance'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تتميز TOFD بأن دقة قياس أبعاد العيب تعتمد على زمن وصول موجات الحيود من حافتي العيب العلوية والسفلية مع انقلاب الطور (Phase Inversion)، وليس على سعة الانعكاس المتأثرة بميل العيب.',
        'TOFD sizes flaws purely from transit-time geometry and phase inversion between upper and lower tip-diffracted wavelets—making height sizing largely independent of flaw orientation amplitude.'
      ),
    },
    {
      id: 'q_advut_3',
      codeReference: 'ASME Sec V Art. 4 (TCG & Dead Zone)',
      question: bt(
        'ما القيد الفيزيائي الأبرز لتقنية TOFD المنفردة والذي يدفع الأكواد لدمجها مع PAUT في مسح اللحامات؟',
        'What key physical limitation of standalone TOFD motivates combining TOFD + PAUT on heavy-wall welds?'
      ),
      options: [
        bt('وجود منطقة عمياء قريبة من سطح المسح تحت الموجة الجانبية (Lateral Wave Dead Zone) وأخرى قرب الجدار الخلفي يغطيها PAUT بكفاءة', 'Near-surface lateral-wave dead zone (~3–5 mm) and back-wall dead zone, which multi-group PAUT covers reliably'),
        bt('عدم قدرة TOFD على العمل على الفولاذ الكربوني إطلاقاً', 'Inability of TOFD longitudinal waves to propagate in carbon steel'),
        bt('عدم إمكانية حفظ بيانات المسح المشفرة رقمياً', 'Inability to record encoded B-scan data files'),
        bt('أن TOFD تكشف المسامية السطحية فقط ولا ترى الشقوق الداخلية', 'TOFD only detects surface pinholes and misses embedded cracks'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تغطي نبضة الموجة الجانبية في TOFD أول بضعة مليمترات تحت السطح؛ لذا يجمع المسح المتزامن بين دقة قياس TOFD في قلب اللحام وتغطية PAUT لحواف الغطاء والجذر.',
        'Finite pulse ring-down of the TOFD lateral wave masks indications within ~3–5 mm of the OD surface; pairing encoded PAUT + TOFD delivers full-volume coverage and superior sizing.'
      ),
    },
  ],

  mod_adv_et: [
    {
      id: 'q_advet_1',
      codeReference: 'ASME Sec V Art. 8 / Eddy Current',
      question: bt(
        'وفقا لمعادلة عمق الاختراق القياسي للتيارات الدوامية δ = 1 / √(π · f · μ · σ)، كيف نزيد عمق اختراق التيار في أنبوب مبادل حراري غير مغناطيسي؟',
        'According to the standard depth of penetration formula δ = 1 / √(π·f·μ·σ), how do you increase eddy-current penetration depth in non-ferromagnetic tubing?'
      ),
      options: [
        bt('بخفض تردد الإثارة الكهربائي (f)', 'Decrease the excitation frequency (f)'),
        bt('بمضاعفة التردد الكهربائي أربع مرات', 'Quadruple the excitation frequency (f)'),
        bt('بزيادة المسافة الهوائية بين المسبار والسطح (Lift-off)', 'Increase probe-to-surface lift-off gap'),
        bt('باستخدام أنبوب مصنوع من البلاستيك العازل', 'Switch to electrically insulating PVC tubing'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يتناسب عمق الاختراق القياسي (δ) عكسياً مع الجذر التربيعي للتردد؛ خفض التردد يزيد الاختراق لكشف التآكل الخارجي للأنبوب بينما التردد العالي يحسّن حساسية الشقوق السطحية.',
        'Standard depth of penetration varies inversely with √f: lowering test frequency penetrates deeper into tube walls, whereas higher frequencies concentrate eddy currents near the ID surface.'
      ),
    },
    {
      id: 'q_advet_2',
      codeReference: 'ASME Sec V Art. 8 Appendix II',
      question: bt(
        'في فحص أنابيب المبادلات الحرارية بمسبار بوبين (Bobbin Coil)، كيف يتم التخلص من الإشارة القوية لصفيحة الدعم المعدنية (Support Baffle Plate) لكشف تآكل تحتها؟',
        'During bobbin-coil heat-exchanger tube inspection, how is a carbon-steel support-plate signal suppressed to reveal underlying tube wall loss?'
      ),
      options: [
        bt('باستخدام مزج ترددين (Dual-Frequency Mixing) يطرح استجابة صفيحة الدعم عند تردد منخفض من التردد الأساسي على مستوي الممانعة', 'Dual-frequency mixing (prime + low auxiliary frequency) calibrated on a reference support ring to subtract the baffle signal vector on the impedance plane'),
        bt('بكسر صفيحة الدعم قبل الفحص', 'Mechanically cutting out the tube support baffle'),
        bt('بإغلاق عرض الطور والاعتماد على الصوت فقط', 'Disabling phase analysis and reading DC resistance'),
        bt('بملء الأنبوب بسائل مخترق أحمر', 'Filling the tube bundle with visible red dye penetrant'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تقنية المزج متعدد الترددات (Multi-Frequency Mix) توازن طور وسعة إشارة حلقة الدعم المرجعية وتلغيها لإظهار زاوية طور النقر أو الشقوق الواقعة تحت منطقة الدعم.',
        'Multi-frequency mixing rotates and scales an auxiliary low-frequency channel to cancel the support-plate impedance vector, exposing hidden under-baffle pitting or fretting wear.'
      ),
    },
    {
      id: 'q_advet_3',
      codeReference: 'ASTM E243 / Impedance Plane',
      question: bt(
        'ما الظاهرة المعروفة بـ Lift-Off في فحص السطح بالتيارات الدوامية وكيف يُضبط مستوي الممانعة لتقليل تشويشها؟',
        'What is "Lift-Off" in surface Eddy Current Testing, and how is the impedance plane rotated to minimize false calls?'
      ),
      options: [
        bt('تغير المسافة الفاصلة بين الملف والسطح الموصل بسبب الطلاء أو الخشونة؛ ويُدار الطور لجعل خط Lift-Off أفقياً بينما تتجه إشارات الشقوق عمودياً', 'Variation in coil-to-conductor spacing (coating/roughness); phase rotation sets the lift-off trace horizontal (0°/180°) so crack signals deflect vertically'),
        bt('ارتفاع درجة حرارة المسبار فوق نقطة كوري', 'Heating the probe coil above the Curie point'),
        bt('انفصال البلورة الصوتية عن الحذاء البلاستيكي', 'Delamination of an ultrasonic wedge'),
        bt('تطاير المذيب الكيميائي من سطح العينة', 'Evaporation of acetone cleaner from the part'),
      ],
      correctIndex: 0,
      explanation: bt(
        'ضبط زاوية الطور (Phase Rotation) بحيث يتحرك أثر Lift-Off أفقياً على محور X يسمح بوضع بوابة الإنذار على المركبة الرأسية Y لكشف الشقوق السطحية بوضوح حتى عبر طبقة طلاء رقيقة.',
        'Rotating phase so lift-off moves strictly along the horizontal axis isolates vertical impedance deflections caused by surface-breaking cracks, enabling reliable inspection over thin coatings.'
      ),
    },
  ],

  mod_weld_1: [
    {
      id: 'q_weld1_1',
      codeReference: 'ASME Sec IX QW-482 / QW-483',
      question: bt(
        'ما العلاقة النظامية بين سجل تأهيل الإجراء (PQR) ومواصفة إجراء اللحام (WPS) وفق ASME Section IX؟',
        'Under ASME Section IX, what is the exact relationship between a Procedure Qualification Record (PQR) and a Welding Procedure Specification (WPS)?'
      ),
      options: [
        bt('يوثق PQR القيم الفعلية المسجلة أثناء لحام كوبون الاختبار ونتائج الاختبارات الميكانيكية المعمليّة، وتُكتب WPS استناداً إليه ضمن النطاقات المؤهلة للمتغيرات الأساسية', 'The PQR records actual welding parameters used on the test coupon and certified mechanical test results, supporting one or more WPSs within qualified essential-variable ranges'),
        bt('تُعطى PQR للحام في الموقع كتعليمات تشغيل يومية بدلاً من WPS', 'Welders work directly from the PQR without a WPS'),
        bt('يمكن تعديل نتائج اختبار الشد في PQR مكتبياً لتوسيع النطاق', 'Mechanical tensile values on a PQR can be edited without re-welding'),
        bt('لا حاجة لإجراء اختبارات ثني أو شد لتأهيل WPS إنشائية', 'Destructive tensile/bend tests are optional for groove-weld PQR'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يُعد PQR سجلاً تاريخياً لقيم حقيقية ونتائج شد وثني وصدمة معملية لا تُعدّل، بينما WPS هي وثيقة التعليمات المعتمدة للحام ضمن النطاقات المؤهلة في جداول QW-250.',
        'A PQR is an immutable record of actual coupon welding variables and destructive test results; the WPS translates that qualification into production parameter ranges for welders.'
      ),
    },
    {
      id: 'q_weld1_2',
      codeReference: 'EN 1011 / Heat Input Formula',
      question: bt(
        'احسب الدخل الحراري القوسي (Arc Energy = V × I × 60 / [1000 × S]) عند الجهد 24V والتيار 180A وسرعة التقدم 120 mm/min:',
        'Calculate arc heat energy (V × I × 60 / [1000 × S]) in kJ/mm for Voltage = 24 V, Current = 180 A, Travel Speed = 120 mm/min:'
      ),
      options: [
        bt('2.16 kJ/mm', '2.16 kJ/mm'),
        bt('0.36 kJ/mm', '0.36 kJ/mm'),
        bt('4.32 kJ/mm', '4.32 kJ/mm'),
        bt('1.08 kJ/mm', '1.08 kJ/mm'),
      ],
      correctIndex: 0,
      explanation: bt(
        'بتطبيق المعادلة: (24 × 180 × 60) / (1000 × 120) = 259,200 / 120,000 = 2.16 kJ/mm (تُضرب في معامل الكفاءة الحرارية k عند حساب Heat Input وفق EN 1011).',
        '(24 × 180 × 60) / (1000 × 120) = 259,200 / 120,000 = 2.16 kJ/mm—a critical supplementary essential variable when Notch Toughness (Charpy CVN) is specified.'
      ),
    },
    {
      id: 'q_weld1_3',
      codeReference: 'AWS D1.1 / ASME IX Consumables',
      question: bt(
        'كيف يجب تخزين ومناولة أسياخ اللحام منخفضة الهيدروجين (مثل E7018) في الموقع لمنع التشقق الهيدروجيني؟',
        'How must low-hydrogen SMAW electrodes (e.g., E7018) be controlled on site to prevent hydrogen-induced cold cracking?'
      ),
      options: [
        bt('حفظها في أفران تجفيف مضبوطة الحرارة (نحو 120–150°C بعد الفتح) وتسليمها في حافظات متنقلة ساخنة (Quivers) مع الالتزام بزمن التعرض الجوي الأقصى', 'Maintain in calibrated holding ovens (~120–150°C) after opening sealed tins, issue in heated quivers, and enforce maximum atmospheric exposure limits'),
        bt('غمرها في الماء البارد قبل اللحام لتقليل تطاير الشرر', 'Dip rods in water prior to striking an arc to reduce spatter'),
        bt('ترك العبوات مفتوحة طوال الأسبوع في رطوبة الموقع ثم مسحها بالقماش', 'Leave open cartons exposed to ambient humidity indefinitely'),
        bt('تخزينها مع الزيوت والشحوم في مستودع واحد', 'Store bare flux coatings alongside lubricating grease'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يمتص غلاف الفلكس القاعدي الرطوبة الجوية بسرعة فتتفكك في قوس اللحام إلى هيدروجين ذري ينتشر في منطقة HAZ مسبباً شروخ تحت الخرزة (Underbead Cracking).',
        'Basic low-hydrogen flux coatings are hygroscopic; absorbed moisture dissociates in the arc into diffusible atomic hydrogen, triggering delayed HAZ cold cracking.'
      ),
    },
  ],

  mod_weld_2: [
    {
      id: 'q_weld2_1',
      codeReference: 'ASME B31.3 Table 341.3.2 / AWS D1.1',
      question: bt(
        'ما المسؤولية الرئيسية لمفتش اللحام في مرحلة "أثناء اللحام" (In-Process Inspection) والتي لا يمكن تداركها بالفحص البصري بعد انتهاء اللحام؟',
        'Which critical variable verified during In-Process Welding Inspection CANNOT be verified solely by final visual inspection after cap completion?'
      ),
      options: [
        bt('حرارة التسخين المسبق وحرارة ما بين التمريرات (Interpass Temp)، ونظافة التمريرات البينية، والتيار/الجهد/سرعة التقدم لكل تمريرة', 'Preheat & interpass temperatures, inter-run slag cleaning, root purge oxygen ppm, and per-pass V/I/travel speed'),
        bt('وجود اسم الشركة مطبوعاً على اللوحة الاسمية الخارجية', 'Presence of vessel nameplate stamping'),
        bt('طول الأنبوب الإجمالي بالمتر', 'Overall spool length in meters'),
        bt('لون الدهان النهائي الخارجي', 'Final topcoat RAL color'),
      ],
      correctIndex: 0,
      explanation: bt(
        'بعد تغطية اللحام بالتمريرات النهائية، يستحيل معرفة ما إذا تم تجاوز حرارة ما بين التمريرات (Interpass) أو الدخل الحراري الذي يدهور متانة الصدمة في منطقة HAZ.',
        'Once buried under subsequent passes, interpass temperature excursions, excessive heat input, and inadequate inter-pass deslagging cannot be observed visually—making live monitoring indispensable.'
      ),
    },
    {
      id: 'q_weld2_2',
      codeReference: 'ASME B31.3 / Stainless Back-Purging',
      question: bt(
        'ما سبب تكوّن الأكسدة الخشنة الشبيهة بالسكر المحروق (Sugaring / Root Oxidation) على جذر لحام أنابيب الستانلس ستيل بعملية GTAW؟',
        'What causes severe internal root oxidation ("sugaring") during GTAW root welding of austenitic stainless steel piping?'
      ),
      options: [
        bt('غياب أو عدم كفاية التطهير الخلفي بغاز خامل (Argon Back-Purge) وتجاوز نسبة الأكسجين المتبقي داخل الأنبوب أثناء انصهار الجذر', 'Inadequate internal inert argon back-purging allowing atmospheric oxygen to react with molten chromium at the root'),
        bt('انخفاض تردد فحص الأشعة السينية لاحقاً', 'Using low-kV X-ray inspection afterward'),
        bt('استخدام غاز أرجون بنقاوة 99.999%', 'Using ultra-high-purity 99.999% argon shielding'),
        bt('تنظيف الوصلة بفرشاة مخصصة من الستانلس ستيل', 'Brushing with a dedicated stainless steel wire brush'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يتفاعل الكروم المنصهر في الستانلس ستيل مع الأكسجين الجوي فوق ~300°C مستنزفاً طبقة الخمول المقاومة للتآكل؛ يلزم تطهير خلفي بالأرجون ومراقبة الأكسجين بـ Purge Monitor.',
        'Molten chromium oxidizes rapidly in air, depleting the passive Cr₂O₃ film and forming porous root "sugaring" that invites pitting corrosion; inert argon purging monitored with an O₂ analyzer prevents it.'
      ),
    },
    {
      id: 'q_weld2_3',
      codeReference: 'ISO 9001 / ITP Hold vs Witness Point',
      question: bt(
        'في خطة الفحص والاختبار المعتمدة (ITP)، ما الفرق النظامي بين نقطة التوقف الإلزامي (Hold Point - H) ونقطة المشاهدة (Witness Point - W)؟',
        'On an approved Inspection and Test Plan (ITP), how does a Hold Point (H) differ procedurally from a Witness Point (W)?'
      ),
      options: [
        bt('في نقطة التوقف (H) يُحظر الانتقال للمرحلة التالية من التصنيع دون حضور وتوقيع الجهة المعنية أو إصدار تنازل خطي رسمي، بينما في (W) يستمر العمل بعد الإشعار الرسمي في حال عدم الحضور بالموعد', 'Work CANNOT proceed past a Hold Point (H) without formal attendance/sign-off or written waiver, whereas a Witness Point (W) requires timely formal notification after which work may proceed if unavailed'),
        bt('كلاهما اختياري للمقاول عند ضغط الجدول الزمني', 'Both may be skipped unilaterally when schedule is tight'),
        bt('نقطة المشاهدة (W) توقف المشروع نهائياً بينما (H) لمجرد العلم', 'Witness stops fabrication indefinitely while Hold is informational only'),
        bt('تُطبق (H) على أعمال الطلاء فقط ولا تشمل اللحام أو NDT', 'Hold points apply exclusively to painting, never welding or NDT'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تجاوز نقطة توقف إلزامية (Hold Point) مثل فحص تجهيز الوصلة أو مراقبة الاختبار الهيدروستاتيكي دون توقيع العميل/المفتش يُعد خرقاً للجودة يستوجب فتح تقرير عدم مطابقة (NCR).',
        'Bypassing an ITP Hold Point without inspector sign-off or formal written waiver constitutes a major quality breach requiring a Non-Conformance Report (NCR).'
      ),
    },
  ],

  mod_pwht_1: [
    {
      id: 'q_pwht1_1',
      codeReference: 'ASME B31.3 Para. 331 / ASME VIII UCS-56',
      question: bt(
        'ما الهدف الميتالورجي الرئيسي من إجراء المعالجة الحرارية بعد اللحام (PWHT) للفولاذ الكربوني وسبائك Cr-Mo؟',
        'What are the primary metallurgical objectives of Post-Weld Heat Treatment (PWHT) on carbon and Cr-Mo alloy steels?'
      ),
      options: [
        bt('تخفيف الإجهادات المتبقية (Residual Stresses)، وتطبيع البنية المارتنسيتية الهشة في منطقة HAZ لخفض الصلابة وتحسين متانة الكسر ومقاومة HIC/SSC', 'Relieving tensile residual stresses and tempering hard brittle HAZ martensite/bainite to reduce hardness and resist HIC/SSC'),
        bt('صهر معدن اللحام بالكامل لإزالة المسامية الغازية', 'Remelting the weld bead above liquidus to float out gas porosity'),
        bt('رفع صلابة منطقة HAZ فوق 450 HB لزيادة الهشاشة', 'Increasing HAZ hardness above 450 HB'),
        bt('تحويل الفولاذ الكربوني إلى سبائك تيتانيوم', 'Alloying carbon steel into titanium'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تخفض PWHT إجهادات الشد المتبقية وتطبع البنى المارتنسيتية الحساسة للتشقق (مثل ≤ 200–248 HV10 في الخدمة الحامضية NACE MR0175 / ISO 15156).',
        'PWHT relaxes yield-magnitude residual tensile stresses and tempers untempered HAZ martensite, bringing hardness within safe thresholds (e.g., ≤ 248 HV10 / 22 HRC for sour H₂S service).'
      ),
    },
    {
      id: 'q_pwht1_2',
      codeReference: 'ASME B31.3 Table 331.1.1 (P-No. 15E / P91)',
      question: bt(
        'لماذا يُعد التحكم الصارم في نطاق حرارة النقع (نحو 730°C–760°C) حاسماً جداً لسبائك الزحف 9Cr-1Mo-V (Grade P91 / P-No. 15E)؟',
        'Why is tight thermocouple control within ~730°C–760°C critical during PWHT of creep-strength-enhanced P91 (P-No. 15E) piping?'
      ),
      options: [
        bt('لأن الحرارة المنخفضة تترك مارتنسيت غير مطبّع هش، بينما تجاوز درجة التحول الحرجة الدنيا (Ac1 ~800°C) يفسد بنية مقاومة الزحف ويشكّل مارتنسيت جديد غير مطبّع عند التبريد', 'Under-soaking leaves brittle untempered martensite, while exceeding lower critical temperature (Ac1) destroys creep microstructure and forms fresh untempered martensite on cooling'),
        bt('لأن P91 ينصهر بالكامل عند 780°C', 'Because P91 melts to liquid at 780°C'),
        bt('لأن المزدوجات الحرارية لا تقرأ فوق 500°C', 'Because Type K thermocouples stop working above 500°C'),
        bt('لأن الكود يسمح بتبريد P91 بالرش المباشر بالماء المثلج', 'Because P91 requires ice-water quench after soaking'),
      ],
      correctIndex: 0,
      explanation: bt(
        'نافذة المعالجة الحرارية لمعدن P91 ضيقة وحساسة؛ تجاوز Ac1 يستوجب غالباً قطع الوصلة وإعادة اللحام لأن خصائص الزحف على المدى الطويل تنهار.',
        'Grade 91 has a narrow tempering window below Ac1: overshooting Ac1 re-austenitizes the weldment, destroying creep rupture life and often necessitating complete cut-out and re-weld.'
      ),
    },
    {
      id: 'q_pwht1_3',
      codeReference: 'WRC 452 / ASME VIII UCS-56',
      question: bt(
        'لماذا يُشترط التحكم في معدلات التسخين والتبريد وعرض نطاق التسخين والعزل الحراري المتدرج فوق 300°C–425°C أثناء PWHT الموضعي؟',
        'Why do codes strictly limit heating/cooling rates (e.g., °C/hr) and mandate minimum heated/insulated band widths above 300°C–425°C during local PWHT?'
      ),
      options: [
        bt('لتجنب التدرجات الحرارية الحادة (Thermal Gradients) التي تولد إجهادات حرارية عابرة أو تشوهاً لدناً أو شقوقاً بدلاً من تخفيف الإجهاد', 'To prevent steep axial/through-wall thermal gradients that induce severe bending stresses, distortion, or cracking'),
        bt('لتوفير استهلاك الورق في مسجل المخطط الحراري', 'Solely to save paper rolls on chart recorders'),
        bt('لمنع تأكسد شريط العزل الزجاجي الخارجي', 'To keep mineral-wool insulation blankets white'),
        bt('لتسريع انتهاء الوردية خلال 10 دقائق', 'To finish heavy-wall PWHT cycles inside 10 minutes'),
      ],
      correctIndex: 0,
      explanation: bt(
        'التسخين الموضعي بنطاق ضيق جداً أو بمعدل سريع يخلق فرق تمدد حراري هائل بين المنطقة الساخنة والمنطقة الباردة المجاورة مما يولد إجهادات متبقية جديدة.',
        'Excessive ramp rates or narrow heated bands create steep axial temperature gradients that plastically yield the hot zone against cold adjacent pipe, re-introducing high residual stresses.'
      ),
    },
  ],

  mod_pwht_2: [
    {
      id: 'q_pwht2_1',
      codeReference: 'AWS D1.1 / Direct Thermocouple Attachment',
      question: bt(
        'ما الطريقة المعتمدة لتثبيت أسلاك المزدوجة الحرارية (Type K Thermocouple) على سطح الأنبوب لضمان قراءة حرارة المعدن الحقيقية أثناء PWHT؟',
        'What is the industry-approved method for attaching Type K thermocouple junctions directly to a pressure pipe for local PWHT?'
      ),
      options: [
        bt('اللحام التفريغي المكثف منخفض الطاقة (Capacitor-Discharge / CD Stud Welding) لكل سلك منفصلاً بمسافة ~5 مم على معدن نظيف مع فحص السطح بعد الإزالة', 'Low-energy Capacitor-Discharge (CD) direct attachment of separated thermocouple wires (~5 mm apart) onto clean bare metal, followed by light blend/MT check after removal'),
        bt('لصق المزدوجة بشريط لاصق بلاستيكي فوق الوسادة الساخنة مباشرة', 'Taping the thermocouple onto the back of the ceramic heating pad'),
        bt('تعليق المزدوجة في الهواء على بعد 50 مم من الأنبوب', 'Suspending the bead in air 50 mm off the pipe OD'),
        bt('ربطها بحبل قطني فوق العزل الحراري الخارجي', 'Tying the sensor outside the thermal insulation blanket'),
      ],
      correctIndex: 0,
      explanation: bt(
        'اللحام التفريغي المكثف (CD Welding) يجعل معدن الأنبوب جزءاً من الوصلة الحرارية نفسها فتقرأ حرارة الجدار الفعلية لا حرارة سخان السيراميك.',
        'Capacitor-discharge (CD) tacking forms an intrinsic junction directly on the pipe wall so the controller regulates true metal temperature rather than radiant heater pad temperature.'
      ),
    },
    {
      id: 'q_pwht2_2',
      codeReference: 'NACE SP0472 / Hardness Verification',
      question: bt(
        'بعد انتهاء دورة PWHT على خط خدمة غاز رطب يحتوي H2S (Sour Service)، ما اختبار التحقق الميداني الإلزامي للتأكد من نجاح التطبيع الحراري؟',
        'Following PWHT on a wet H₂S (sour service) weldment, what field verification confirms adequate tempering?'
      ),
      options: [
        bt('قياس الصلابة الميداني المعاير (مثل Brinell / UCI / Leeb وفق الإجراء المؤهل) على معدن اللحام ومنطقة HAZ والمعدن الأساسي ومراجعة المخطط الحراري الموقع', 'Calibrated hardness testing across weld metal, HAZ, and parent metal alongside audit of the signed time-temperature chart'),
        bt('الاعتماد على تغير لون الأكسيد السطحي فقط', 'Visual inspection of heat-tint straw/blue oxide color alone'),
        bt('طرق الأنبوب بمطرقة حديدية لسماع الرنين', 'Striking the weld cap with a ball-peen hammer'),
        bt('رش ماء صابوني فوق العزل الحراري', 'Applying soap bubble solution onto the insulation'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تؤكد مراجعة المخطط الحراري (معدل التسخين، زمن وحرارة النقع لكل قناة، معدل التبريد) مقترنة باختبار الصلابة أن البنية الميتالورجية ضمن حدود NACE MR0175 (مثل ≤ 200 HBW لمعدن اللحام الكربوني).',
        'Reviewing all thermocouple channels on the PWHT chart plus post-PWHT hardness testing verifies compliance with NACE SP0472 / ISO 15156 limits (e.g., ≤ 200 HBW on P-1 carbon steel welds).'
      ),
    },
    {
      id: 'q_pwht2_3',
      codeReference: 'ASME Sec V / Post-PWHT NDT Timing',
      question: bt(
        'لماذا تشترط الأكواد إجراء الفحص النهائي غير الإتلافي (Final UT / MT) *بعد* الانتهاء من دورة PWHT وتبريد القطعة؟',
        'Why do pressure-equipment codes mandate performing final acceptance NDT (UT/MT/PT) AFTER completion of PWHT?'
      ),
      options: [
        bt('لأن الإجهادات الحرارية العابرة أثناء التسخين/التبريد أو ظاهرة إعادة التسخين (Reheat Cracking) قد تكشف أو تنمّي شقوقاً لم تكن موجودة قبل PWHT', 'Transient thermal stresses during ramp/cooling or Stress-Relief (Reheat) Cracking in alloy steels can initiate or propagate cracks during PWHT'),
        bt('لأن السخان السيراميكي يمحو بيانات جهاز UT السابقة عن بعد', 'Because ceramic heaters erase stored digital UT files'),
        bt('لأن سرعة الصوت لا تستقر إلا بعد سنة من التصنيع', 'Because acoustic velocity takes 12 months to stabilize'),
        bt('لتجنب دفع رسوم فحص النظر السنوي', 'To bypass inspector near-vision checks'),
      ],
      correctIndex: 0,
      explanation: bt(
        'قد تتشقق بعض السبائك (مثل Cr-Mo-V) أثناء تخفيف الإجهاد فيما يعرف بـ Reheat Cracking؛ لذا فإن التفتيش قبل PWHT وحده لا يضمن سلامة الوصلة النهائية قبل التشغيل.',
        'Certain creep-resistant alloys are susceptible to stress-relief (reheat) cracking in coarse-grained HAZ regions during PWHT; post-PWHT NDT is mandatory for final code acceptance.'
      ),
    },
  ],

  mod_api_1: [
    {
      id: 'q_api1_1',
      codeReference: 'API 510 Section 7 / ASME VIII-1 UG-27',
      question: bt(
        'في وعاء ضغط أسطواني قطره الداخلي R = 1000 mm، وضغط تصميمه P = 2.0 MPa، والإجهاد المسموح S = 138 MPa، وكفاءة الوصلة E = 1.0، كم تساوي السماكة الدنيا المطلوبة (t_min = P·R / [S·E - 0.6·P])؟',
        'For a cylindrical vessel shell with inside radius R = 1000 mm, design pressure P = 2.0 MPa, allowable stress S = 138 MPa, and joint efficiency E = 1.0, what is t_min = P·R / (S·E - 0.6·P)?'
      ),
      options: [
        bt('نحو 14.62 مم', 'Approximately 14.62 mm'),
        bt('نحو 7.25 مم', 'Approximately 7.25 mm'),
        bt('نحو 29.24 مم', 'Approximately 29.24 mm'),
        bt('نحو 20.00 مم', 'Approximately 20.00 مم'),
      ],
      correctIndex: 0,
      explanation: bt(
        'بتعويض القيم في معادلة الإجهاد المحيطي (Circumferential Stress): t_min = (2.0 × 1000) / (138 × 1.0 - 0.6 × 2.0) = 2000 / (138 - 1.2) = 2000 / 136.8 ≈ 14.62 mm.',
        'Using circumferential stress formula UG-27(c)(1): t_min = (2.0 × 1000) / (138 × 1.0 − 1.2) = 2000 / 136.8 = 14.62 mm.'
      ),
    },
    {
      id: 'q_api1_2',
      codeReference: 'API 510 / API 570 Corrosion Rate & Remaining Life',
      question: bt(
        'إذا كانت السماكة الحالية لخط أنابيب t_actual = 9.5 mm، والسماكة الدنيا للتقاعد t_min = 5.5 mm، ومعدل التآكل المقاس CR = 0.4 mm/year، فما العمر المتبقي وفترة الفحص الداخلي/السماكة القصوى وفق قاعدة نصف العمر في API 510/570؟',
        'Given t_actual = 9.5 mm, t_min = 5.5 mm, and Corrosion Rate = 0.4 mm/yr, what are the Remaining Life (RL) and half-life inspection interval?'
      ),
      options: [
        bt('العمر المتبقي = 10 سنوات؛ وفترة نصف العمر = 5 سنوات (أو الحد الأقصى للفئة أيهما أقل)', 'Remaining Life = 10 years; Half-Life interval = 5 years (or code class maximum, whichever is less)'),
        bt('العمر المتبقي = 20 سنة؛ وفترة الفحص = 15 سنة', 'Remaining Life = 20 years; interval = 15 years'),
        bt('العمر المتبقي = 4 سنوات؛ وفترة الفحص = 4 سنوات', 'Remaining Life = 4 years; interval = 4 years'),
        bt('العمر المتبقي = 2.5 سنة؛ والأنبوب مرفوض فوراً', 'Remaining Life = 2.5 years; immediate retirement required'),
      ],
      correctIndex: 0,
      explanation: bt(
        'العمر المتبقي RL = (t_actual - t_min) / CR = (9.5 - 5.5) / 0.4 = 4.0 / 0.4 = 10 سنوات؛ وتُحدد فترة الفحص التالي بالأقل من (RL / 2 = 5 سنوات) أو الحد الأقصى للسنوات في الكود.',
        'Remaining Life = (9.5 − 5.5) / 0.4 = 10.0 years. Per API 510/570, the next inspection interval shall not exceed the lesser of half the remaining life (5.0 yr) or the maximum calendar limit.'
      ),
    },
    {
      id: 'q_api1_3',
      codeReference: 'API 570 CML Strategy',
      question: bt(
        'لماذا تتطلب خطوط الحقن الكيميائي ونقاط الخلط (Injection Points & Dead Legs) في API 570 كثافة نقاط مراقبة حالة (CMLs) أعلى بكثير من الخطوط المستقيمة العادية؟',
        'Under API 570, why do chemical injection points and stagnant dead legs require dedicated circuits and dense Condition Monitoring Locations (CMLs)?'
      ),
      options: [
        bt('بسبب معدلات التآكل الموضعي المتسارع أو التآكل تحت الرواسب أو الصدمة الحرارية/الاضطراب التي قد تثقب الخط محلياً دون تآكل عام في بقية الخط', 'Accelerated localized corrosion, turbulent impingement, thermal shock, or under-deposit/dew-point attack can perforate pipe rapidly while straight runs appear intact'),
        bt('لأن طلاء تلك المناطق أرخص سعراً', 'Because paint is thinner on straight pipe runs'),
        bt('لأن الفحص البصري الخارجي يكشف السماكة الداخلية بالعين المجردة', 'Because external VT directly reads internal bore thickness'),
        bt('لتقليل عدد قراءات UT في المصنع', 'To eliminate UT grid scanning altogether'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تُصنّف نقاط الحقن والفروع الراكدة (Dead Legs) ضمن المناطق عالية المخاطر لأن آليات التلف فيها شديدة التموضع وتحتاج لمسح شبكي/تصوير إشعاعي دوري مخصص.',
        'Injection mixing zones and stagnant dead legs suffer localized accelerated attack (erosion-corrosion, acid dew-point, MIC) that single-point random UT will miss without grid scanning/RT.'
      ),
    },
  ],

  mod_api_2: [
    {
      id: 'q_api2_1',
      codeReference: 'API RP 571 (CUI Temperature Window)',
      question: bt(
        'ما نطاق درجات حرارة التشغيل الأكثر خطورة لحدوث التآكل تحت العزل الحراري (CUI) في أنابيب وأوعية الفولاذ الكربوني وفق API RP 571؟',
        'Per API RP 571, within what operating temperature range is Carbon Steel most susceptible to Corrosion Under Insulation (CUI)?'
      ),
      options: [
        bt('من -12°C إلى 175°C (10°F إلى 350°F)، وخاصة بين 60°C و 120°C حيث تتكاثف الرطوبة ولا تتبخر سريعاً', '-12°C to 175°C (10°F to 350°F), peaking around 60°C–120°C where trapped water stays warm and oxygenated'),
        bt('فوق 550°C حصراً حيث تكون الأسطح جافة تماماً', 'Strictly above 550°C under superheated dry conditions'),
        bt('تحت -160°C في خطوط الغاز الطبيعي المسال المستمرة دون دورات تدفئة', 'Continuously below -160°C cryogenic LNG without cyclic thaw'),
        bt('لا يحدث CUI إلا في الأنابيب غير المعزولة', 'CUI occurs only on bare uninsulated piping'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تحت العزل التالف تتجمع المياه المطرية أو المتكاثفة؛ وفي نطاق -12°C إلى 175°C يبقى الماء سائلاً دافئاً وغنياً بالأكسجين والأملاح فيضاعف سرعة تآكل الكربون والـ ESCC في الستانلس ستيل.',
        'Water ingress trapped beneath damaged jacketing in the -12°C to 175°C range creates a warm poultice cell causing aggressive localized carbon-steel wall loss and external chloride SCC on austenitic stainless.'
      ),
    },
    {
      id: 'q_api2_2',
      codeReference: 'API RP 580 / Risk-Based Inspection',
      question: bt(
        'كيف يُعرَّف الخطر الهندسي (Risk) في منهجية التفتيش المبني على المخاطر (API RP 580 RBI)، وما أثر الفحص غير الإتلافي الفعال عليه؟',
        'How is Risk mathematically defined in API RP 580 Risk-Based Inspection (RBI), and which term does effective NDT reduce?'
      ),
      options: [
        bt('الخطر = احتمالية الفشل (PoF) × عواقب الفشل (CoF)؛ والفحص الموجه يقلل عدم اليقين في حالة المعدة فيخفض احتمالية الفشل غير المتوقع', 'Risk = Probability of Failure (PoF) × Consequence of Failure (CoF); targeted high-effectiveness NDT reduces damage-state uncertainty, lowering PoF'),
        bt('الخطر = تكلفة الفحص مقسومة على عمر المصنع؛ والفحص يلغي العواقب الكيميائية للمادة', 'Risk = Inspection Cost / Plant Age; NDT makes toxic fluids non-toxic (eliminating CoF)'),
        bt('يسمح RBI بإلغاء جميع الفحوصات للمعدات عالية الخطورة لتوفير الميزانية', 'RBI eliminates inspection of high-risk hydrocarbon reactors to cut budget'),
        bt('لا يعتمد RBI على آليات التلف في API 571', 'RBI ignores active API 571 damage mechanisms'),
      ],
      correctIndex: 0,
      explanation: bt(
        'لا يغيّر الفحص عواقب التسرب الفيزيائية للمادة (CoF)، لكن اختيار تقنية NDT ذات فعالية كشف عالية لآلية التلف النشطة يقلل عدم اليقين ويكشف التدهور قبل الفشل فيخفض PoF.',
        'Inspection does not alter fluid flammability or inventory (CoF), but matching high-effectiveness NDT to the active damage mechanism reduces uncertainty and enables timely mitigation, lowering PoF.'
      ),
    },
    {
      id: 'q_api2_3',
      codeReference: 'API 653 Tank Bottom Inspection',
      question: bt(
        'ما التقنية القياسية السريعة لمسح ألواح قاع الخزانات البترولية فوق الأرضية (API 653) لكشف التآكل من جهة التربة السفلية وصندوق التفريغ لفحص اللحامات؟',
        'In API 653 Aboveground Storage Tank out-of-service overhauls, which NDT combination scans tank floor plates for soil-side pitting and tests lap-weld tightness?'
      ),
      options: [
        bt('مسح تسرب التدفق المغناطيسي للأرضيات (MFL Floor Scan) متبوعاً بقياس سماكة UT للمؤشرات، مع اختبار صندوق التفريغ (Vacuum Box LT) للحامات التراكبية', 'Magnetic Flux Leakage (MFL) floor scanning verified by prove-up UT thickness sizing, paired with Vacuum Box bubble leak testing on lap-welded seams'),
        bt('الفحص البصري من خارج جدار الخزان فقط دون دخول', 'External shell binoculars inspection without tank entry'),
        bt('اختبار التيارات الدوامية عالية التردد عبر طبقة فيبرجلاس 10 مم فقط', '10 MHz pancake eddy-current only'),
        bt('التصوير الإشعاعي البانورامي لكامل القاع في لقطة واحدة', 'Single-shot panoramic gamma radiography of a 60 m floor'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يمسح MFL مساحات قاع الخزان الواسعة بسرعة لكشف النقر السفلي من جهة التربة ليتم قياس عمقه بدقة بـ UT، بينما يكشف Vacuum Box أي مسار تسرب عبر لحامات الزاوية التراكبية.',
        'MFL rapidly screens large tank bottoms for soil-side corrosion (quantified via prove-up ultrasonic pit gauges), while Vacuum Box testing per ASME Sec V Art. 10 verifies lap-seam leak tightness.'
      ),
    },
  ],

  mod_coat_1: [
    {
      id: 'q_coat1_1',
      codeReference: 'ISO 8501-1 / SSPC-SP 10 (NACE No. 2)',
      question: bt(
        'ماذا تعني درجة نظافة السطح بالسفع الكاشط (Sa 2½ / Near-White Metal Blast Cleaning) وفق ISO 8501-1 و SSPC-SP 10 قبل تطبيق طلاء البطانات الغزيرة؟',
        'What surface cleanliness condition defines Sa 2½ (SSPC-SP 10 / NACE No. 2 Near-White Metal Blast) prior to heavy-duty tank lining?'
      ),
      options: [
        bt('خلو السطح من الزيوت والشحوم وقشور الدرفلة والصدأ والطلاء القديم بحيث لا تتجاوز البقايا الظلالية الطفيفة 5% من كل مساحة مرجعية', 'Free of all visible oil, grease, mill scale, rust, and paint, with any remaining slight staining streaks restricted to ≤ 5% of each unit area'),
        bt('تنظيف السطح بفرشاة يدوية سلكية لإزالة الصدأ السائب فقط', 'Hand wire brushing of loose flaking rust only (St 2)'),
        bt('ترك 50% من قشور الدرفلة السليمة تحت الطلاء', 'Leaving 50% mill scale intact beneath epoxy lining'),
        bt('غسل السطح بالماء فقط دون خشونة سطحية (Anchor Profile)', 'Low-pressure water rinsing with zero anchor profile'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تتطلب أنظمة الإيبوكسي والزنك غير العضوي تنظيفاً بالسفع الكاشط إلى درجة Sa 2½ أو Sa 3 مع تحقيق عمق خشونة (Surface Profile Rz) يطابق ورقة البيانات الفنية للطلاء.',
        'Immersion linings and zinc-rich primers require Sa 2½ / SSPC-SP 10 cleanliness (≤ 5% tight shadow staining) plus verified angular anchor profile depth for mechanical adhesion.'
      ),
    },
    {
      id: 'q_coat1_2',
      codeReference: 'ISO 8502-4 / Dew Point Psychrometrics',
      question: bt(
        'ما القاعدة البيئية الحاكمة لدرجة حرارة الفولاذ ونقطة الندى (Dew Point) قبل وأثناء تطبيق الطلاء الصناعي الواقي؟',
        'What mandatory environmental rule governs steel surface temperature relative to the ambient Dew Point during abrasive blasting and coating?'
      ),
      options: [
        bt('يجب أن تزيد درجة حرارة سطح الفولاذ بـ 3°C (5°F) على الأقل فوق نقطة الندى المحسوبة لتفادي التكاثف غير المرئي للرطوبة', 'Steel substrate temperature must remain at least 3°C (5°F) ABOVE the measured dew point to prevent invisible moisture condensation'),
        bt('يجب أن تكون حرارة الفولاذ أقل من نقطة الندى لترطيب السطح', 'Steel temperature should be 3°C below dew point to cool the paint'),
        bt('تُقاس حرارة الهواء فقط ولا تهم حرارة سطح المعدن', 'Only air temperature matters; steel surface temperature is irrelevant'),
        bt('يُسمح بالطلاء أثناء هطول الضباب متى كانت الرطوبة النسبية 99%', 'Coating is permitted at 99% RH with visible condensation'),
      ],
      correctIndex: 0,
      explanation: bt(
        'إذا اقتربت حرارة المعدن من نقطة الندى تتكون طبقة رطوبة مجهرية تحبس تحت الطلاء فتسبب فشل الالتصاق والتنفط الاسموزي والصدأ المبكر (Flash Rusting).',
        'When substrate temperature falls within 3°C of the dew point, microscopic moisture condenses onto the blast profile, causing flash rusting, poor adhesion, and premature blistering.'
      ),
    },
    {
      id: 'q_coat1_3',
      codeReference: 'ISO 8502-6 / ISO 8502-9 (Bresle Test)',
      question: bt(
        'ما الغرض من اختبار لاصقة بريسلي (Bresle Patch Conductivity Test) على سطح فولاذ بعد السفع وقبل الطلاء؟',
        'Why is a Bresle patch extraction and conductivity test (ISO 8502-6 / 8502-9) performed on blasted steel before priming?'
      ),
      options: [
        bt('قياس تركيز الأملاح الذائبة غير المرئية (مثل الكلوريدات بالمليغرام/م²) التي تسحب الرطوبة عبر الطلاء بالخاصية الاسموزية مسببة التنفط', 'Quantifying invisible soluble salt contamination (mg/m² NaCl equivalent) that drives osmotic blistering beneath immersion coatings'),
        bt('قياس السماكة الجافة النهائية للطلاء بالميكرون', 'Measuring final Dry Film Thickness (DFT) in microns'),
        bt('تحديد صلابة حبيبات الجارنت الكاشطة', 'Measuring abrasive garnet Mohs hardness'),
        bt('قياس شدة التيار الكهربائي لنظام الحماية الكاثودية', 'Measuring impressed-current cathodic protection rectifier voltage'),
      ],
      correctIndex: 0,
      explanation: bt(
        'لا يزيل السفع الجاف وحده الأملاح الكيميائية الذائبة؛ وجود أملاح فوق الحد المسموح (مثل 20–30 mg/m²) ينشئ خلية اسموزية تسحب الماء عبر غشاء الطلاء وتفجره.',
        'Dry abrasive blasting can drive soluble chlorides into valleys rather than removing them; trapped salts draw water osmotically through semi-permeable coatings, causing rapid blistering.'
      ),
    },
  ],

  mod_coat_2: [
    {
      id: 'q_coat2_1',
      codeReference: 'SSPC-PA 2 / Dry Film Thickness',
      question: bt(
        'وفقا لمعيار SSPC-PA 2 لقياس سماكة الفلم الجاف (DFT) على الهياكل الفولاذية، كيف تتم معايرة/التحقق من مقياس DFT الإلكتروني في الموقع؟',
        'Under SSPC-PA 2, how must an electronic Dry Film Thickness (DFT) gauge be verified before measuring coated steel?'
      ),
      options: [
        bt('التحقق من دقة القراءة باستخدام شرائح معايرة بلاستيكية معتمدة السمك (Certified Shims) قريبة من سماكة الطلاء المستهدفة مع ضبط خشونة المعدن الأساسي (Base Metal Reading)', 'Verify gauge accuracy on certified plastic shims bracketing the target DFT and account for the blasted Base Metal Reading (BMR)'),
        bt('تصفير الجهاز على قطعة خشب أو خرسانة', 'Zero the magnetic probe on concrete or wood'),
        bt('قياس سماكة الطلاء الرطب فقط واعتبارها مساوية للجاف بنسبة 100% لجميع الدهانات المذيبة', 'Assume Wet Film Thickness equals DFT regardless of volume solids'),
        bt('حك الطلاء بمسمار معدني وتقدير العمق بالعين', 'Scratch the coating with a nail and estimate visually'),
      ],
      correctIndex: 0,
      explanation: bt(
        'إذا وُضع مسبار DFT على سطح مسفوع خشن دون تعويض قراءة المعدن الأساسي (BMR) فسيقرأ ارتفاع قمم الخشونة خطأً كجزء من سماكة الطلاء.',
        'Verifying with traceable shims and compensating for Base Metal Reading (BMR) prevents blast-profile peaks from artificially inflating apparent coating thickness.'
      ),
    },
    {
      id: 'q_coat2_2',
      codeReference: 'NACE SP0188 / Holiday Detection',
      question: bt(
        'متى يُستخدم جهاز كشف الثقوب منخفض الجهد بالإسفنجة الرطبة (Low-Voltage Wet Sponge ~67.5V–90V) بدلاً من الشرارة عالية الجهد (High-Voltage Spark Tester)؟',
        'Per NACE SP0188, when is a low-voltage wet-sponge holiday detector (67.5–90 V DC) used instead of a high-voltage spark tester?'
      ),
      options: [
        bt('في الطلاءات الرقيقة غير الموصلة (عادة ≤ 500 ميكرون / 20 mils) حتى لا يحرق الجهد العالي غشاء الطلاء السليم ويصنع ثقباً فيه', 'On thin non-conductive coatings (typically ≤ 500 µm / 20 mils) where high-voltage spark discharge could dielectric-puncture sound film'),
        bt('في أغلفة خطوط الأنابيب المدفونة ذات السماكة 4000 ميكرون (4 مم)', 'On 4 mm thick coal-tar or polyethylene pipeline wraps'),
        bt('على الطلاءات الغنية بمسحوق الزنك المعدني الموصل كهربائياً', 'Directly on conductive inorganic zinc-rich primers'),
        bt('أثناء كون الطلاء لا يزال رطباً ولزجاً قبل التصلب', 'Immediately on wet uncured epoxy'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يُستخدم Wet Sponge في الطلاءات الرقيقة (< 500 µm) حيث يمر التيار الضعيف عبر الماء المضاف له عامل ترطيب عند وجود مسام يصل للفولاذ، بينما يُحسب جهد High-Voltage تبعاً للسماكة في البطانات السميكة.',
        'NACE SP0188 specifies low-voltage wet-sponge testing up to 500 µm (20 mils) to detect pinholes safely, reserving calculated high-voltage spark testing for thicker dielectric linings.'
      ),
    },
    {
      id: 'q_coat2_3',
      codeReference: 'AMPP / NACE SP0169 Cathodic Protection',
      question: bt(
        'ما معيار الجهد الكهربائي الأكثر شيوعاً لتحقيق الحماية الكاثودية الكافية لخطوط أنابيب الفولاذ الكربوني المدفونة قياساً إلى قطب النحاس/كبريتات النحاس المشبع (CSE)؟',
        'According to NACE SP0169 / AMPP standards, what polarized pipe-to-soil potential criterion indicates adequate cathodic protection of buried carbon steel vs. a Cu/CuSO₄ (CSE) reference electrode?'
      ),
      options: [
        bt('جهد مستقطب سالب يبلغ -850 mV أو أكثر سالبية بالنسبة لقطب CSE (أو استقطاب كاثودي بمقدار 100 mV)', 'A negative (cathodic) polarized potential of at least -850 mV vs. CSE (or 100 mV cathodic polarization shift)'),
        bt('جهد موجب +850 V تيار متردد', '+850 V AC positive potential'),
        bt('جهد سالب يتجاوز -5000 mV لتعزيز تقشر الطلاء بالهيدروجين', 'More negative than -5000 mV to maximize hydrogen disbondment'),
        bt('صفر ملي فولت تماماً عند كل الظروف', 'Exactly 0 mV relative to CSE'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تحقيق جهد مستقطب -850 mV CSE (مع مراعاة سقوط الجهد الأومي IR Drop) يوقف تيار الذوبان الأنودي للفولاذ مع تجنب الإفراط السالب المسبب لتقشر الطلاء الكاثودي (Cathodic Disbondment).',
        'An IR-free polarized potential of -850 mV vs. CSE halts anodic iron dissolution while avoiding extreme over-protection (<-1200 mV) that causes hydrogen evolution and cathodic disbondment.'
      ),
    },
  ],

  mod_qaqc_1: [
    {
      id: 'q_qaqc1_1',
      codeReference: 'ISO/IEC 17020 Type A Independence',
      question: bt(
        'ماذا تعني استقلالية جهة التفتيش من "النوع أ" (Type A Inspection Body) وفق المواصفة الدولية ISO/IEC 17020؟',
        'Under ISO/IEC 17020, what defines a "Type A" third-party inspection body?'
      ),
      options: [
        bt('استقلالية تامة كطرف ثالث عن التصميم والتصنيع والتوريد والتركيب والملكية أو الصيانة للبنود الخاضعة للتفتيش مع حيادية موثقة', 'Complete third-party independence from design, manufacture, supply, installation, ownership, or maintenance of inspected items'),
        bt('قسم فحص داخلي يتبع مباشرة لمدير الإنتاج وتُربط مكافأته بعدد القطع المقبولة يومياً', 'An internal shop crew reporting to the fabrication manager paid per accepted weld'),
        bt('مختبر لا يحتفظ بسجلات معايرة أو إجراءات مكتوبة', 'An informal consultancy operating without documented procedures'),
        bt('مورد المواد الخام الذي يفتش منتجاته بنفسه فقط', 'A raw-material mill certifying its own heats without external oversight'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تضمن الفئة Type A في ISO/IEC 17020 الحيادية الكاملة وعدم وجود تضارب مصالح مالي أو إداري يؤثر على قرار القبول والرفض الهندسي.',
        'ISO/IEC 17020 Type A accreditation requires strict organizational, financial, and operational independence from all parties involved in producing or operating the inspected asset.'
      ),
    },
    {
      id: 'q_qaqc1_2',
      codeReference: 'EN 10204 (3.1 vs 3.2 Material Certificates)',
      question: bt(
        'ما الفرق الجوهري بين شهادة اختبار المواد EN 10204 Type 3.1 وشهادة EN 10204 Type 3.2؟',
        'What distinguishes an EN 10204 Type 3.2 Mill Test Certificate (MTC) from a Type 3.1 certificate?'
      ),
      options: [
        bt('في Type 3.1 يصادق ممثل التفتيش المستقل لدى المصنع على الاختبارات الفعلية للصبة، بينما في Type 3.2 يشترك أيضاً مفتش المشتري أو جهة تفتيش طرف ثالث مستقلة في التحقق والمصادقة على التتبع والاختبارات', 'Type 3.1 is validated by the manufacturer’s independent inspection representative, whereas Type 3.2 adds independent verification/witnessing and co-endorsement by the purchaser’s authorized representative or a third-party body'),
        bt('Type 3.1 لا تحتوي على التحليل الكيميائي أو رقم الصبة (Heat Number)', 'Type 3.1 omits heat numbers and chemical composition'),
        bt('Type 3.2 تصدر بدون إجراء أي اختبار شد أو صدمة فعلي', 'Type 3.2 is a generic catalog compliance letter without actual test values'),
        bt('لا يوجد فرق بينهما وكلاهما لا يرتبط برقم الصبة', 'Both are non-specific certificates identical to Type 2.1'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تُطلب شهادات 3.2 في الأوعية الحرجة والخدمة الحامضية والبحرية لأنها تضيف مصادقة طرف مستقل خارجي على أخذ العينات وربط رقم الصبة بالتحليل الكيميائي والخواص الميكانيكية.',
        'Both 3.1 and 3.2 report specific heat/lot test results, but 3.2 requires independent witnessing and endorsement by an external third-party inspector or purchaser representative.'
      ),
    },
    {
      id: 'q_qaqc1_3',
      codeReference: 'PMI / Positive Material Identification',
      question: bt(
        'لماذا يُعد فحص التحقق الإيجابي من هوية السبيكة (PMI باستخدام XRF/OES) خطوة إلزامية في استلام وتركيب أنابيب المصافي قبل التشغيل؟',
        'Why is Positive Material Identification (PMI via XRF/OES) mandatory on alloy refinery piping spools prior to hydrotest and commissioning?'
      ),
      options: [
        bt('لمنع الخلط العرضي بتركيب وصلة أو سدادة من الفولاذ الكربوني بدلاً من سبيكة Cr-Mo مثل P11/P22 مما قد يسبب تمزقاً كارثياً بالكبريتة الساخنة', 'To prevent inadvertent alloy mix-ups (e.g., carbon steel installed in a 5Cr-0.5Mo hot sulfidation circuit) that cause catastrophic high-temperature rupture'),
        bt('لقياس عمق شقوق الجذر الداخلية بدلاً من UT', 'To size internal root cracks in place of ultrasonic testing'),
        bt('لتسخين الأنبوب قبل اللحام', 'To preheat pipe bevels to 200°C'),
        bt('لتجفيف الطلاء الخارجي بالأشعة', 'To cure polyurethane topcoats'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تتشابه وصلات الفولاذ الكربوني وسبائك الكروم-موليبدينوم بصرياً؛ تسبب حوادث خلط السبائك انهيارات مفاجئة في مصافي النفط (وفق API RP 578)، ويكشف PMI نسبة Cr و Mo و Ni فوراً.',
        'Per API RP 578, carbon steel and low-alloy Cr-Mo fittings look identical visually; rogue carbon-steel components in high-temperature sulfidic streams corrode up to 10× faster and rupture catastrophically.'
      ),
    },
  ],

  mod_qaqc_2: [
    {
      id: 'q_qaqc2_1',
      codeReference: 'ISO 9001 Clause 10.2 / RCA & CAPA',
      question: bt(
        'ما الفرق الهندسي بين "التصحيح الفوري" (Correction) و"الإجراء التصحيحي" (Corrective Action) عند معالجة تقرير عدم مطابقة (NCR)؟',
        'In quality management (ISO 9001 Clause 10.2), how does "Correction" differ from "Corrective Action" when closing an NCR?'
      ),
      options: [
        bt('التصحيح يعالج العيب الحالي (مثل إصلاح اللحام المرفوض)، بينما الإجراء التصحيحي يعالج السبب الجذري للنظام (RCA) لمنع تكرار عدم المطابقة مستقبلاً', 'Correction eliminates the detected nonconformity (e.g., repairing the rejected weld), whereas Corrective Action eliminates the systemic Root Cause (RCA) to prevent recurrence'),
        bt('كلاهما يعني توبيخ العامل شفهياً وإغلاق التقرير دون فحص', 'Both mean issuing a verbal warning without re-inspection'),
        bt('الإجراء التصحيحي يتم قبل حدوث أي مشكلة دون تحليل بيانات', 'Corrective Action skips root-cause analysis and disposition'),
        bt('التصحيح يلغي الحاجة لإعادة فحص اللحام بعد الإصلاح', 'Correction waives post-repair NDT verification'),
      ],
      correctIndex: 0,
      explanation: bt(
        'إصلاح وصلة معيبة دون معالجة السبب الجذري (مثل فرن تجفيف أسياخ معطل أو إجراء غير واضح) سيؤدي لتكرار نفس العيب في عشرات الوصلات اللاحقة.',
        'Repairing a defective weld is merely Correction; true Corrective Action investigates why the defect occurred (5-Whys / Fishbone RCA) and fixes the process control so it cannot recur.'
      ),
    },
    {
      id: 'q_qaqc2_2',
      codeReference: 'Hydrostatic Testing & As-Built Dossier',
      question: bt(
        'قبل التوقيع على تصريح إجراء الاختبار الهيدروستاتيكي (Hydrotest Pre-Test Punch Clearance) لخط أنابيب جديد، أي تحقق مما يلي إلزامي؟',
        'Before signing a Pre-Hydrotest Readiness Certificate on a newly fabricated process piping system, what must QC verify?'
      ),
      options: [
        bt('استكمال وقبول جميع لحامات الخط وفحوصات NDT و PWHT و PMI وإغلاق ملاحظات الفئة A والتحقق من صلاحية صمام التنفيس ومقاييس الضغط المعايرة ونوعية ماء الاختبار (محتوى الكلوريد للستانلس)', '100% completion and acceptance of weld map, NDT, PWHT, PMI, Category-A punch items, calibrated gauges/relief valve, and low-chloride water quality for stainless steel'),
        bt('تغطية جميع اللحامات غير المفحوصة بالعزل الحراري الكامل قبل رفع الضغط', 'Insulating all uninspected welds so leaks stay hidden'),
        bt('استخدام مقياس ضغط واحد غير معاير بمدى يساوي 10 أضعاف ضغط الاختبار', 'Using a single uncalibrated gauge rated at 10× test pressure'),
        bt('تأجيل فحص الأشعة السينية إلى ما بعد تشغيل الغاز الهيدروكربوني', 'Deferring radiography until live hydrocarbon start-up'),
      ],
      correctIndex: 0,
      explanation: bt(
        'ملف الجاهزية قبل الاختبار الهيدروستاتيكي (Test Pack Turnover) يضمن اكتمال كافة الفحوصات الحجمية والسطحية والحرارية وحماية الستانلس ستيل من الكلوريدات (< 50 ppm) ومعايرة مقاييس الضغط (1.5× إلى 4× ضغط الاختبار).',
        'Hydrotest pack release requires complete weld/NDT/PWHT/PMI reconciliation, Category-A punch closure, calibrated pressure gauges (full scale 1.5×–4× test pressure), and chloride-controlled test water.'
      ),
    },
    {
      id: 'q_qaqc2_3',
      codeReference: 'Weld Repair Rate KPI',
      question: bt(
        'عندما يرتفع مؤشر معدل رفض اللحامات الأسبوعي (Weld Reject Rate) لمقاول فوق الحد التعاقدي (مثلاً > 5%)، ما الإجراء الرقابي القياسي لقسم QA/QC؟',
        'When a contractor’s weekly radiographic/UT weld reject rate spikes above contractual thresholds (e.g., > 5%), what QA/QC escalation applies?'
      ),
      options: [
        bt('تطبيق قواعد الفحص الإضافي المتدرج (Penalty / Tracer Shots وفق B31.3)، تحليل عيوب كل لحام (مسامية أم نقص انصهار)، وإعادة تأهيل أو إيقاف اللحامين المتسببين مع مراجعة تحكم الموقع', 'Enforce progressive tracer/penalty examinations per ASME B31.3, stratify defect types by welder ID, and retrain/revoke qualification of non-performing welders while auditing site consumables/WPS adherence'),
        bt('خفض نسبة الفحص العشوائي من 10% إلى 1% لتحسين الرقم في التقرير', 'Reduce random radiography from 10% to 1% to hide defects'),
        bt('قبول اللحامات المعيبة استثنائياً لتسليم المشروع في موعده', 'Accept planar cracks to protect milestone dates'),
        bt('تغيير اسم المشروع في قاعدة البيانات', 'Reset weld numbering back to W-01'),
      ],
      correctIndex: 0,
      explanation: bt(
        'في الفحص العشوائي (Spot RT/UT مثلاً 5% أو 10% في ASME B31.3)، رفض وصلة لحام واحدة يستوجب فحص وصلتين إضافيتين لنفس اللحام في نفس الدفعة (Progressive Examination) قبل قبول الدفعة.',
        'Under ASME B31.3 progressive examination rules, a rejected spot-examined weld triggers two additional tracer welds from the same welder/lot, alongside targeted RCA and welder requalification.'
      ),
    },
  ],

  mod_integrity_1: [
    {
      id: 'q_int1_1',
      codeReference: 'API 579-1 / ASME FFS-1 Assessment Levels',
      question: bt(
        'بماذا تتميز المستويات الثلاثة لتقييم الملاءمة للخدمة (Level 1 و Level 2 و Level 3) في كود API 579-1 / ASME FFS-1؟',
        'How are Assessment Levels 1, 2, and 3 structured in API 579-1 / ASME FFS-1 Fitness-For-Service evaluations?'
      ),
      options: [
        bt('يتدرج التقييم من قواعد فحص تحفظية سريعة بمعلومات أساسية في Level 1، إلى حسابات هندسية تفصيلية في Level 2، وصولاً إلى النمذجة العددية المتقدمة (FEA) وميكانيكا الكسر غير الخطية في Level 3', 'Progression from conservative screening rules (Level 1) to detailed engineering stress calculations (Level 2), up to advanced numerical FEA and fracture mechanics (Level 3) as conservatism decreases and data requirements increase'),
        bt('تشير الأرقام إلى مستويات شهادة فاحص السوائل المخترقة فقط', 'They correspond strictly to ASNT Level I, II, and III technician ranks'),
        bt('Level 1 هو الأقل تحفظاً ولا يحتاج أي قياس للسماكة', 'Level 1 is the least conservative and requires zero thickness data'),
        bt('تُستخدم لتحديد ألوان خوذات العمل في المنصات البحرية', 'They classify offshore PPE helmet colors'),
      ],
      correctIndex: 0,
      explanation: bt(
        'صُمم Level 1 ليعطي قرار فحص محافظ وسريع؛ فإذا لم تجتز المعدة معايير التحفظ العالي في Level 1 يمكن ترقيتها إلى تحليل Level 2 بشبكة سماكة تفصيلية (CTP) أو Level 3 بتحليل العناصر المحدودة.',
        'Level 1 uses conservative screening bounds; equipment failing Level 1 is not necessarily unsafe—detailed thickness profiles (Level 2) or finite-element stress analysis (Level 3) remove excess conservatism.'
      ),
    },
    {
      id: 'q_int1_2',
      codeReference: 'ASME B31G / Pipeline Corrosion Assessment',
      question: bt(
        'ما المتغيران الهندسيان الرئيسيان اللازمان لتقييم منطقة فقد معدني خارجي بالتآكل على خط أنابيب نقل غاز وفق منهجية ASME B31G المعدلة؟',
        'Under Modified ASME B31G pipeline integrity assessment, which two flaw dimensions primarily govern remaining burst pressure strength?'
      ),
      options: [
        bt('أقصى عمق للتآكل نسبةً لسماكة الجدار (d/t) والطول المحوري لمنطقة التآكل (L) لتقدير معامل انتفاخ فوليا (Folias Factor)', 'Maximum corrosion depth ratio (d/t) and axial longitudinal extent (L), used with pipe diameter/thickness in the Folias bulging factor'),
        bt('درجة لمعان الطلاء الخارجي وعمر مضخة الحقن فقط', 'Exterior paint gloss reading and pump motor RPM'),
        bt('الطول المحيطي فقط مع إهمال عمق التآكل تماماً', 'Circumferential width alone while ignoring pit depth'),
        bt('وزن شاحنة الفحص المتنقلة', 'Gross weight of the inspection vehicle'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يتحكم العمق الأقصى (d) والطول المحوري الممتد في اتجاه إجهاد الطوق (Hoop Stress) في احتمالية الانتفاخ والتمزق، مما يحدد معامل الأمان أو الحاجة لتخفيض ضغط التشغيل (MAOP Reduction) أو وضع قميص إصلاح.',
        'Axial corrosion length (perpendicular to hoop stress) and peak depth ratio (d/t) govern radial bulging and burst capacity in B31G/RSTRENG, dictating safe operating pressure or composite/sleeve repair.'
      ),
    },
    {
      id: 'q_int1_3',
      codeReference: 'ISO 55000 / Integrity Operating Windows (IOW)',
      question: bt(
        'ما دور نوافذ التشغيل الآمنة للسلامة الميكانيكية (Integrity Operating Windows - API RP 584 IOWs) في منع الفشل المفاجئ للمعدات؟',
        'How do Integrity Operating Windows (API RP 584 IOWs) protect pressure equipment between turnaround inspections?'
      ),
      options: [
        bt('تحديد حدود حرجة وتشغيلية لمتغيرات العملية (الحرارة، pH، الكلوريدات، سرعة الجريان) تُطلق تنبيهاً وتحقيقاً هندسياً فور تجاوزها قبل تفاقم معدل التآكل أو التصدع', 'Defining process-variable thresholds (temperature, pH, chlorides, H₂S, velocity) whose exceedance triggers real-time alerts and engineering review before rapid damage escalation'),
        bt('فتح نوافذ التهوية الزجاجية في غرفة التحكم المركزية', 'Installing glass observation windows on reactor shells'),
        bt('إطالة فترات الفحص إلى 30 سنة دون مراقبة متغيرات التشغيل', 'Extending inspection intervals to 30 years regardless of process upsets'),
        bt('استبدال صمامات الأمان الميكانيكية بلوحات تحذيرية فقط', 'Replacing pressure relief valves with warning signs'),
      ],
      correctIndex: 0,
      explanation: bt(
        'قد يؤدي انحراف تشغيلي واحد لبضع ساعات (مثل دخول كلوريدات أو ارتفاع حرارة فرن تكسير) إلى تسريع التلف مئات المرات؛ تربط IOWs غرفة العمليات مباشرة بمهندس سلامة الأصول.',
        'A brief process excursion (e.g., wash-water failure or temperature spike) can invalidate historical corrosion rates overnight; IOW alarms trigger immediate RBI re-evaluation and targeted NDT.'
      ),
    },
  ],

  mod_integrity_2: [
    {
      id: 'q_int2_1',
      codeReference: 'IRATA ICOP / ISO 22846 Dual-System Principle',
      question: bt(
        'ما المبدأ الهندسي الحاكم لسلامة الوصول بالحبال الصناعية (IRATA Twin-Rope System) أثناء تنفيذ فحوصات NDT على الهياكل المرتفعة والمنصات البحرية؟',
        'What is the foundational safety principle of the IRATA ICOP / ISO 22846 industrial rope-access system during elevated NDT operations?'
      ),
      options: [
        bt('استخدام حبلين مستقلين تماماً (حبل عمل Working Line وحبل أمان احتياطي Safety Line) لكل منهما نقطة تثبيت مستقلة وجهاز إيقاف سقوط مستقل بحيث لا يؤدي فشل أي عنصر منفرد إلى السقوط', 'Two independently anchored lines—a Working Line and a Safety Back-up Line—ensuring no single point of equipment or operator failure can result in a fall'),
        bt('التعلق بحبل واحد فقط لتخفيف وزن حقيبة جهاز PAUT', 'Single-rope suspension without backup to carry heavier UT flaw detectors'),
        bt('ربط حبل الأمان في درابزين بلاستيكي مؤقت غير معتمد', 'Anchoring both ropes to unrated PVC handrail conduit'),
        bt('العمل المنفرد ليلاً بدون مشرف إنقاذ مستوى ثالث (IRATA Level 3)', 'Solo working without an on-site IRATA Level 3 safety supervisor and rescue rig'),
      ],
      correctIndex: 0,
      explanation: bt(
        'يشترط كود الممارسة الدولي IRATA ICOP وجود نظام مزدوج مستقل التثبيت، وفحص قبل الاستخدام، وخطة إنقاذ مجهزة مسبقاً بإشراف فني وصول بالحبال المستوى الثالث (IRATA Level 3).',
        'IRATA ICOP mandates redundant independent anchorage (working + backup lines), pre-use harness/rope checks, tool lanyards for NDT instruments, and a pre-rigged rescue plan supervised by an IRATA Level 3.'
      ),
    },
    {
      id: 'q_int2_2',
      codeReference: 'DROPS / Elevated NDT Equipment Safety',
      question: bt(
        'عند رفع وتشغيل جهاز فحص بالموجات فوق الصوتية أو نير مغناطيسي على ارتفاع 45 متراً فوق وحدة معالجة غاز عاملة، ما إجراء منع سقوط الأجسام (DROPS Prevention) الإلزامي؟',
        'When operating a UT flaw detector, calibration block, and couplant bottle 45 m up a live flare knock-out tower via rope access, what DROPS control is mandatory?'
      ),
      options: [
        bt('تأمين جميع الأجهزة والمسابر والأدوات بأربطة تثبيت معتمدة الحمولة (Rated Tool Lanyards) وحقائب مغلقة مع تسييج وإخلاء منطقة السقوط المحتملة أسفل العمل (Exclusion Zone)', 'Securing every instrument, probe, and hand tool with load-rated tethers/holsters and barricading a controlled drop-exclusion zone below'),
        bt('وضع كتلة المعايرة المعدنية V2 حرة فوق عارضة فولاذية مائلة', 'Balancing the steel V2 block untethered on an I-beam flange'),
        bt('إلقاء عبوات الفحص الفارغة إلى الأرض بعد الانتهاء', 'Dropping empty aerosol cans to grade when finished'),
        bt('ربط كابل مصدر الطاقة 220V بحبل الأمان الرئيسي مباشرة', 'Taping live 220 V cables directly around the nylon safety rope'),
      ],
      correctIndex: 0,
      explanation: bt(
        'الأجسام الساقطة (Dropped Objects) من أخطر الحوادث القاتلة في المنشآت الصناعية؛ كتلة معايرة وزنها 1 كجم تسقط من 45 متراً تمتلك طاقة صدم قاتلة وتخترق الأنابيب الصغيرة.',
        'Dropped objects represent a top fatality risk offshore and in refineries; certified tool lanyards with captive carabiners plus grade barricading prevent lethal impacts.'
      ),
    },
    {
      id: 'q_int2_3',
      codeReference: 'DNV-ST-E271 / ISO 10855 Offshore Containers',
      question: bt(
        'عند فحص عروات الرفع الحاملة للأحمال (Padeyes / Lifting Lugs) لحاويات المنصات البحرية وفق DNV 2.7-1 (DNV-ST-E271)، ما التسلسل الفحصي الحرج؟',
        'When inspecting offshore container lifting padeyes and primary load-bearing welds under DNV-ST-E271 (2.7-1) / ISO 10855, what NDT sequence is critical?'
      ),
      options: [
        bt('الفحص البصري الدقيق للتشوه والتآكل متبوعاً بفحص سطحي عالي الحساسية (MT أو PT حسب المعدن) قبل وبعد اختبار التحميل الإثباتي عند الاقتضاء لكشف شروخ الكلال عند جذور عروات الرفع', 'Close visual inspection for hole ovality/deformation paired with 100% MT/PT of padeye-to-frame welds (including post-proof-load NDT where applicable) to catch toe fatigue cracks'),
        bt('قياس سماكة الطلاء على سقف الحاوية الخشبي فقط', 'Measuring paint gloss on the container roof center panel only'),
        bt('الاكتفاء بقراءة رقم اللوحة المعدنية عن بعد', 'Reading the data plate number from 10 meters away'),
        bt('تسخين عروة الرفع إلى 900°C في الموقع قبل الرفع', 'Torch-heating lifting shackles to red heat prior to lifting'),
      ],
      correctIndex: 0,
      explanation: bt(
        'تتعرض عروات الرفع البحرية لأحمال صدمة ديناميكية قاسية أثناء المناولة بالأوناش؛ لذا يشترط DNV 2.7-1 فحص 100% للحامات عروات الرفع بـ MT/PT لضمان خلوها من أي شق سطحي.',
        'Offshore lifting sets and padeye welds experience high dynamic snatch loads in marine sea states; DNV-ST-E271 mandates rigorous VT + MT/PT on load-path welds to prevent catastrophic dropped loads.'
      ),
    },
  ],
};

function calculateMaxPackXp(questionCount: number): number {
  // 25 XP per correct answer + 40 XP pass bonus + 35 XP 100% mastery bonus
  return questionCount * 25 + 40 + 35;
}

export function getModuleQuizPack(moduleId: string, disciplineId?: string): LessonQuizPack {
  let matchedDiscipline = ENGINEERING_DISCIPLINES.find((d) => d.id === disciplineId);
  let matchedLevelId = 'level1';
  let moduleTitleAr = 'اختبار الوحدة المعتمدة';
  let moduleTitleEn = 'Accredited Module Assessment';
  let subtitleAr = 'تقييم تفاعلي بعد الدرس مع تصحيح فوري وتحديث نقاط المتصدرين XP';
  let subtitleEn = 'Post-lesson interactive assessment with instant code explanations & XP leaderboard update';

  for (const disc of ENGINEERING_DISCIPLINES) {
    for (const lvl of disc.levels) {
      const mod = lvl.modules.find((m) => m.id === moduleId);
      if (mod) {
        matchedDiscipline = disc;
        matchedLevelId = lvl.levelId;
        moduleTitleAr = mod.titleAr;
        moduleTitleEn = mod.titleEn;
        subtitleAr = `${disc.titleAr} · ${lvl.nameAr}`;
        subtitleEn = `${disc.titleEn} · ${lvl.nameEn}`;
        break;
      }
    }
  }

  const questions = MODULE_QUESTIONS_BANK[moduleId] || MODULE_QUESTIONS_BANK.mod_c_acad_1;

  return {
    packId: `curriculum:${moduleId}`,
    sourceKind: 'curriculum_module',
    disciplineId: matchedDiscipline?.id || disciplineId || 'conventional_ndt',
    levelId: matchedLevelId,
    moduleId,
    title: bt(moduleTitleAr, moduleTitleEn),
    subtitle: bt(subtitleAr, subtitleEn),
    passThresholdPct: 75,
    maxXpReward: calculateMaxPackXp(questions.length),
    questions,
  };
}

export function getNdeEdLessonQuizPack(course: NdeEdCourse, lesson: NdeEdLesson): LessonQuizPack {
  const questions: LessonQuizQuestion[] = [];

  // 1. Primary lesson question
  questions.push({
    id: `${lesson.id}_q1`,
    codeReference: course.standards.slice(0, 2).join(' · ') || course.code,
    question: { ar: lesson.quiz.question.ar, en: lesson.quiz.question.en },
    options: lesson.quiz.options.map((opt) => ({ ar: opt.ar, en: opt.en })),
    correctIndex: lesson.quiz.answer,
    explanation: { ar: lesson.quiz.explanation.ar, en: lesson.quiz.explanation.en },
  });

  // 2. Linked curriculum module questions (up to 2)
  const linkedModuleId = lesson.curriculum?.moduleId;
  const linkedQuestions =
    (linkedModuleId && MODULE_QUESTIONS_BANK[linkedModuleId]) ||
    (course.disciplineId === 'ndt_advanced' ? MODULE_QUESTIONS_BANK.mod_adv_et : MODULE_QUESTIONS_BANK.mod_c_ut);

  for (const lq of linkedQuestions.slice(0, 2)) {
    questions.push(lq);
  }

  // 3. One reinforcement question from the adjacent lesson in the same course so each lesson has a 4-question pack
  const lessonIndex = course.lessons.findIndex((item) => item.id === lesson.id);
  const peerLesson =
    course.lessons[(lessonIndex + 1) % course.lessons.length] ||
    course.lessons[0];

  if (peerLesson && peerLesson.id !== lesson.id) {
    questions.push({
      id: `${lesson.id}_peer_${peerLesson.id}`,
      codeReference: `${course.code} · Cross-Topic Check`,
      question: { ar: peerLesson.quiz.question.ar, en: peerLesson.quiz.question.en },
      options: peerLesson.quiz.options.map((opt) => ({ ar: opt.ar, en: opt.en })),
      correctIndex: peerLesson.quiz.answer,
      explanation: { ar: peerLesson.quiz.explanation.ar, en: peerLesson.quiz.explanation.en },
    });
  }

  return {
    packId: `nde_ed:${lesson.id}`,
    sourceKind: 'nde_ed_lesson',
    disciplineId: course.disciplineId,
    levelId: course.level === 'foundation' ? 'academic' : course.level,
    moduleId: lesson.curriculum?.moduleId || lesson.id,
    title: { ar: lesson.title.ar, en: lesson.title.en },
    subtitle: {
      ar: `${course.code} · ${course.title.ar}`,
      en: `${course.code} · ${course.title.en}`,
    },
    passThresholdPct: 75,
    maxXpReward: calculateMaxPackXp(questions.length),
    questions,
  };
}

const DISCIPLINE_DEFAULT_MODULE: Record<string, string> = {
  conventional_ndt: 'mod_c_ut',
  ndt_advanced: 'mod_adv_ut',
  welding_inspection: 'mod_weld_1',
  pwht_metallurgy: 'mod_pwht_1',
  api_inspection: 'mod_api_1',
  coating_corrosion: 'mod_coat_1',
  qa_qc: 'mod_qaqc_1',
  asset_integrity_rope: 'mod_integrity_1',
};

export function getKnowledgeLessonQuizPack(lesson: KnowledgeLesson): LessonQuizPack {
  const questions: LessonQuizQuestion[] = [
    {
      id: `know_${lesson.id}_q1`,
      codeReference: 'INSCO Foundation Syllabus',
      question: { ar: lesson.question.ar, en: lesson.question.en },
      options: lesson.options.map((opt) => ({ ar: opt.ar, en: opt.en })),
      correctIndex: lesson.answer,
      explanation: { ar: lesson.explanation.ar, en: lesson.explanation.en },
    },
  ];

  const fallbackModId = DISCIPLINE_DEFAULT_MODULE[lesson.discipline] || 'mod_c_acad_1';
  const extraQuestions = MODULE_QUESTIONS_BANK[fallbackModId] || MODULE_QUESTIONS_BANK.mod_c_acad_1;
  for (const eq of extraQuestions.slice(0, 2)) {
    questions.push(eq);
  }

  const disc = ENGINEERING_DISCIPLINES.find((d) => d.id === lesson.discipline);

  return {
    packId: `knowledge:${lesson.id}`,
    sourceKind: 'knowledge_lesson',
    disciplineId: lesson.discipline,
    levelId: 'academic',
    moduleId: fallbackModId,
    title: { ar: lesson.title.ar, en: lesson.title.en },
    subtitle: {
      ar: disc ? `مكتبة المعرفة التأسيسية · ${disc.titleAr}` : 'مكتبة المعرفة التأسيسية',
      en: disc ? `Foundational Knowledge · ${disc.titleEn}` : 'Foundational Knowledge',
    },
    passThresholdPct: 75,
    maxXpReward: calculateMaxPackXp(questions.length),
    questions,
  };
}

export function getAllCurriculumQuizPacks(): LessonQuizPack[] {
  const packs: LessonQuizPack[] = [];
  for (const disc of ENGINEERING_DISCIPLINES) {
    for (const lvl of disc.levels) {
      for (const mod of lvl.modules) {
        packs.push(getModuleQuizPack(mod.id, disc.id));
      }
    }
  }
  return packs;
}
