export interface Flashcard {
  id: string;
  disciplineId: string;
  moduleId?: string;
  method: 'VT' | 'PT' | 'MT' | 'UT' | 'RT' | 'PAUT' | 'TOFD' | 'PWHT' | 'API' | 'WELD' | 'COAT' | 'QA';
  frontAr: string;
  frontEn: string;
  backAr: string;
  backEn: string;
  keyFormula?: string;
  codeReference?: string;
  examTipAr?: string;
  examTipEn?: string;
}

export const CURRICULUM_FLASHCARDS: Flashcard[] = [
  // -------------------------------------------------------------
  // VT (Visual Testing)
  // -------------------------------------------------------------
  {
    id: 'fc_vt_1',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_vt',
    method: 'VT',
    frontAr: 'ما هي شدة الإضاءة وزاوية الرؤية الدنيا المطلوبة في الفحص البصري المباشر وفق ASME Section V؟',
    frontEn: 'What are the minimum lighting and viewing angle requirements for direct VT under ASME Section V Article 9?',
    backAr: '• شدة الإضاءة: 100 foot-candles (1076 Lux) على السطح.\n• زاوية الرؤية: لا تقل عن 30 درجة مع سطح الفحص.\n• أقصى مسافة فحص: 24 بوصة (600 مم).',
    backEn: '• Min Illumination: 100 foot-candles (1076 Lux) on surface.\n• Viewing Angle: Not less than 30 degrees to the surface.\n• Max Distance: Within 24 inches (600 mm).',
    codeReference: 'ASME Section V Article 9, T-952 & T-953',
    examTipAr: 'سؤال متكرر جداً في امتحانات ASNT Level II و CSWIP!',
    examTipEn: 'Frequent question in ASNT Level II and CSWIP examinations.'
  },
  {
    id: 'fc_vt_2',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_vt',
    method: 'VT',
    frontAr: 'ما هو الحد الأقصى للنحر (Undercut) المسموح به في ASME B31.3 Table 341.3.2 للأنابيب العادية؟',
    frontEn: 'What is the maximum allowable undercut in ASME B31.3 Table 341.3.2 for Normal Fluid Service?',
    backAr: 'أقل من أو يساوي 1.0 مم (1/32 in)، وبشرط ألا يتجاوز 10% من سمك جدار الأنبوب الاسمية.',
    backEn: 'Less than or equal to 1.0 mm (1/32 in), and not exceeding 10% of the nominal pipe wall thickness.',
    codeReference: 'ASME B31.3 Table 341.3.2 (Symbol H)',
    examTipAr: 'انتبه: في الخدمة الشديدة (Severe Cyclic) النحر غير مسموح إطلاقاً بعمق يتجاوز 0.5 مم.',
    examTipEn: 'Note: Severe Cyclic service has even stricter limitations (max 0.5 mm).'
  },

  // -------------------------------------------------------------
  // PT (Liquid Penetrant)
  // -------------------------------------------------------------
  {
    id: 'fc_pt_1',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'PT',
    frontAr: 'ما هو زمن التغلغل الأدنى (Dwell Time) للمظهر والمخترق وفق ASTM E165 و ASME Sec V؟',
    frontEn: 'What is the standard minimum dwell time for penetrant and developer per ASTM E165 & ASME Sec V?',
    backAr: '• زمن تغلغل السائل (Penetrant Dwell): من 5 إلى 10 دقائق للفولاذ الملحوم (20 دقيقة للشقوق الضيقة جداً).\n• زمن التظهير (Developer Dwell): 10 دقائق كحد أدنى (ولا يزيد عن ساعتين لتفادي النزيف الزائد).',
    backEn: '• Penetrant Dwell: 5 to 10 minutes for steel welds (up to 20 mins for tight fatigue cracks).\n• Developer Dwell: 10 minutes minimum (max 2 hours to avoid excessive bleeding).',
    codeReference: 'ASME Section V Article 6 Table T-672',
    examTipAr: 'درجة حرارة السطح يجب أن تكون بين 5°C و 52°C (40°F إلى 125°F) للاختبار القياسي.',
    examTipEn: 'Standard examination temperature window is 5°C to 52°C (40°F to 125°F).'
  },
  {
    id: 'fc_pt_2',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'PT',
    frontAr: 'ما هي الخاصية الفيزيائية الأساسية التي تحكم دخول السائل النافذ في الشقوق الدقيقة؟',
    frontEn: 'What primary physical property drives liquid penetrant into fine tight discontinuities?',
    backAr: 'الخاصية الشعرية (Capillary Action)، وهي محصلة التوتر السطحي للسائل (Surface Tension) وزاوية التبلل الصغرى (Contact Wetting Angle θ < 90°).',
    backEn: 'Capillary Action, determined by high liquid surface tension and low contact wetting angle (θ < 90°).',
    keyFormula: 'h = (2γ cos θ) / (ρ g r)',
    examTipAr: 'اللزوجة المنخفضة تحدد سرعة الدخول، بينما زاوية التبلل المنخفضة تحدد قابلية البلل.',
    examTipEn: 'Viscosity controls entry rate, while contact angle controls wetting capability.'
  },

  // -------------------------------------------------------------
  // MT (Magnetic Particle)
  // -------------------------------------------------------------
  {
    id: 'fc_mt_1',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'MT',
    frontAr: 'ما الفرق الجوهري بين استخدام مغنطة التيار المتردد (AC) والتيار المستمر (DC) في فحص MT؟',
    frontEn: 'What is the fundamental difference between AC and DC magnetization in Magnetic Particle Testing?',
    backAr: '• التيار المتردد (AC): يتركز في الطبقة السطحية فقط بسبب ظاهرة التأثير السطحي (Skin Effect)؛ ممتاز للشقوق السطحية.\n• التيار المستمر (DC / Half-wave DC): يتغلغل في عمق المادة لكشف العيوب تحت السطحية (Near-surface flaws).',
    backEn: '• AC Magnetization: Concentrated on skin layer due to "skin effect"; optimal for sharp surface-breaking cracks.\n• DC / HWDC: Deep magnetic penetration into the core; detects near-subsurface discontinuities.',
    codeReference: 'ASTM E709 / ASME Section V Article 7',
    examTipAr: 'قوة رفع حدوة AC المطلوبة 4.5 كجم (10 lbs)، بينما حدوة DC تتطلب 18 كجم (40 lbs).',
    examTipEn: 'AC yoke requires 10 lbs (4.5 kg) lift test; DC yoke requires 40 lbs (18 kg) lift test.'
  },
  {
    id: 'fc_mt_2',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'MT',
    frontAr: 'ما هي شدة المجال المغناطيسي المتبقي المقبولة لإلغاء المغنطة (Demagnetization)؟',
    frontEn: 'What is the maximum acceptable residual magnetic field after demagnetization?',
    backAr: 'عادة أقل من 3 غاوس (Gauss) أو ±2 غاوس وفق معظم مواصفات التوربينات وأوعية الضغط لتفادي انحراف القوس (Arc Blow) أثناء اللحام اللاحق.',
    backEn: 'Typically less than 3 Gauss (or ±2 Gauss) verified with a calibrated field indicator (Pie gauge / Hall-effect gaussmeter).',
    codeReference: 'ASME Section V Article 7 T-778',
    examTipAr: 'المجال المغناطيسي المتبقي العالي يسبب مشاكل خطيرة في لحام الغاز وقراءات الأجهزة الدقيقة.',
    examTipEn: 'High residual field causes severe arc blow during subsequent welding.'
  },

  // -------------------------------------------------------------
  // UT (Ultrasonic Testing)
  // -------------------------------------------------------------
  {
    id: 'fc_ut_1',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'UT',
    frontAr: 'ما هي معادلة قانون سنيل (Snell’s Law) لحساب زوايا انكسار الصوت في فحص الزاوية (Angle Beam)؟',
    frontEn: 'What is Snell’s Law formula for calculating acoustic refraction angle in UT angle beam inspection?',
    backAr: 'sin(θ1) / V1 = sin(θ2) / V2\nحيث θ1 زاوية السقوط في الإسفين (Lucite wedge)، و V1 سرعة الصوت في الإسفين (~2730 m/s)، و θ2 زاوية الانكسار في الصلب، و V2 سرعة موجة القص في الصلب (~3240 m/s).',
    backEn: 'sin(θ1) / V1 = sin(θ2) / V2\nWhere θ1 = incident angle in wedge, V1 = velocity in wedge (~2730 m/s), θ2 = refracted shear angle in steel, V2 = shear wave velocity in steel (~3240 m/s).',
    keyFormula: 'sin(θ1) / V1 = sin(θ2) / V2',
    codeReference: 'ASME Section V Article 4',
    examTipAr: 'الزاوية الحرجة الأولى تلغي الموجة الطولية، والزاوية الحرجة الثانية تلغي موجة القص وتنتج موجة ريليه السطحية.',
    examTipEn: 'First critical angle eliminates longitudinal wave; second critical angle eliminates shear wave creating surface Rayleigh wave.'
  },
  {
    id: 'fc_ut_2',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'UT',
    frontAr: 'ما هي منطقة الحقل القريب (Near Field Length - N) وكيف تؤثر على كشف العيوب؟',
    frontEn: 'What is the Near Field (Fresnel Zone - N) length and its effect on flaw detection in UT?',
    backAr: 'N = (D² × f) / (4 × V) = D² / (4λ)\nتتميز منطقة الحقل القريب بتذبذبات شديدة في ضغط الصوت (Pressure fluctuations) تجعل تقدير حجم العيب غير دقيق.',
    backEn: 'N = (D² × f) / (4 × V) = D² / (4λ)\nIn the near field, extreme sound pressure oscillations make quantitative flaw sizing unreliable.',
    keyFormula: 'N = D² / (4λ)',
    examTipAr: 'توصيف وقياس حجم العيب يتم دائماً في الحقل البعيد (Far Field) حيث ينخفض الضغط بانتظام مع المسافة.',
    examTipEn: 'Accurate flaw evaluation and DAC calibration are conducted in the Far Field.'
  },

  // -------------------------------------------------------------
  // RT (Radiographic Testing)
  // -------------------------------------------------------------
  {
    id: 'fc_rt_1',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'RT',
    frontAr: 'ما هو مدى الكثافة البصرية (Optical Density) المقبول للأفلام الإشعاعية وفق ASME Section V Article 2؟',
    frontEn: 'What is the acceptable transmitted optical density range for radiographic films per ASME Section V Art. 2?',
    backAr: '• أشعة إكس (X-Ray): 1.8 إلى 4.0\n• أشعة جاما (Gamma-Ray: Ir-192 / Co-60): 2.0 إلى 4.0\n• أقصى كثافة للقراءة المجمعة (Composite viewing): 4.0',
    backEn: '• X-Ray: 1.8 to 4.0 H&D density.\n• Gamma-Ray: 2.0 to 4.0 H&D density.\n• Single film max reading: 4.0.',
    codeReference: 'ASME Section V Article 2 T-282.1',
    examTipAr: 'يتم قياس الكثافة بواسطة جهاز Densitometer المعاير مع شريحة المعايرة المعتمدة.',
    examTipEn: 'Density is verified using a calibrated densitometer and certified step wedge film.'
  },
  {
    id: 'fc_rt_2',
    disciplineId: 'conventional_ndt',
    moduleId: 'mod_c_acad_1',
    method: 'RT',
    frontAr: 'ما هي معادلة عدم الحدة الهندسية (Geometric Unsharpness - Ug) وكيف تقللها؟',
    frontEn: 'What is the Geometric Unsharpness (Ug) formula and how is it minimized in RT?',
    backAr: 'Ug = (F × d) / D\nحيث F حجم البؤرة الإشعاعية (Focal Spot Size)، و d المسافة بين العيب والفيلم، و D المسافة بين المصدر والسطح المقابل للعيب (Source-to-Object Distance).',
    backEn: 'Ug = (F × d) / D\nWhere F = focal spot dimension, d = object-to-film distance, D = source-to-object distance.',
    keyFormula: 'Ug = (F × d) / D',
    codeReference: 'ASME Section V Article 2 Table T-274.1',
    examTipAr: 'لتقليل Ug: استخدم أصغر بؤرة ممكنة، ضع الفيلم ملاصقاً تماماً للعينة (d -> 0)، وزد مسافة المصدر (D).',
    examTipEn: 'To minimize Ug: minimize focal spot size, place film intimately against weld, and maximize source distance.'
  },

  // -------------------------------------------------------------
  // PWHT & Metallurgy
  // -------------------------------------------------------------
  {
    id: 'fc_pwht_1',
    disciplineId: 'pwht_metallurgy',
    moduleId: 'mod_pwht_1',
    method: 'PWHT',
    frontAr: 'ما هو أقصى معدل تسخين وتبريد مسموح به في ASME Section VIII Div 1 UW-40 للصلب الكربوني؟',
    frontEn: 'What are the maximum heating and cooling rates permitted under ASME Sec VIII UW-40 for P-No 1 steel?',
    backAr: 'أقصى معدل فوق 800°F (425°C): 400°F/hr مقسوماً على السمك بالبوصات، وبحد أقصى لا يتجاوز 400°F/hr ولا يقل عن 100°F/hr.',
    backEn: 'Above 800°F (425°C): Max rate = 400°F/hr divided by thickness in inches, not exceeding 400°F/hr and never required below 100°F/hr.',
    codeReference: 'ASME Section VIII Div 1 Table UW-40 / AWS D10.10',
    examTipAr: 'معدل التبريد المقيد يمنع الصدمة الحرارية وتوليد إجهادات متبقية جديدة أثناء الانكماش غير المتوازن.',
    examTipEn: 'Controlled cooling prevents thermal shock and new differential shrinkage residual stresses.'
  },
  {
    id: 'fc_pwht_2',
    disciplineId: 'pwht_metallurgy',
    moduleId: 'mod_pwht_1',
    method: 'PWHT',
    frontAr: 'ما هو معامل هولومون-جافي (Hollomon-Jaffe Parameter) وما دلالته في المعالجة الحرارية؟',
    frontEn: 'What is the Hollomon-Jaffe Parameter (HJP) and its significance in tempering/PWHT?',
    backAr: 'HJP = T × (C + log t)\nحيث T درجة الحرارة المطلقة بالكلفن، و t زمن المكوث بالساعات، و C ثابت المادة (~20 للصلب الكربوني). يعبر عن التأثير الحراري المكافئ لزمن المكوث مع الحرارة.',
    backEn: 'HJP = T × (C + log t)\nWhere T is absolute temperature (Kelvin), t is soak time in hours, and C is material constant (~20 for carbon steel). It quantifies equivalent thermal exposure.',
    keyFormula: 'P = T × (20 + log(t)) × 10⁻³',
    examTipAr: 'يمكن الحصول على نفس الصلادة إما بحرارة أعلى وزمن أقصر، أو بحرارة أقل وزمن أطول وفق HJP.',
    examTipEn: 'Enables trading higher soak temperature for shorter duration to achieve equivalent tempering.'
  },

  // -------------------------------------------------------------
  // API Inspection (API 510, 570)
  // -------------------------------------------------------------
  {
    id: 'fc_api_1',
    disciplineId: 'api_inspection',
    moduleId: 'mod_api_1',
    method: 'API',
    frontAr: 'ما هي معادلة كود ASME Section VIII UG-27 لحساب السمك الأصغري لجدار وعاء أسطواني تحت ضغط داخلي؟',
    frontEn: 'What is the ASME Section VIII UG-27 formula for minimum thickness of a cylindrical shell under internal pressure?',
    backAr: 't = (P × R) / (S × E - 0.6 × P)\nحيث P الضغط التصميمي الداخلي، R نصف القطر الداخلي، S أقصى إجهاد مسموح به للمادة، E كفاءة وصلة اللحام (Joint Efficiency: 1.0 لـ 100% RT، و 0.85 لـ Spot RT).',
    backEn: 't = (P × R) / (S × E - 0.6 × P)\nWhere P = design pressure, R = inside radius, S = maximum allowable stress, E = joint efficiency (1.0 for full RT, 0.85 for spot RT).',
    keyFormula: 't_min = (P × R) / (S × E - 0.6P)',
    codeReference: 'ASME Section VIII Div 1 UG-27(c)(1)',
    examTipAr: 'احفظ معادلة UG-27 جيداً، هي قلب حسابات API 510 للمفتش المعتمد!',
    examTipEn: 'UG-27 is the core equation in API 510 body of knowledge exams.'
  },
  {
    id: 'fc_api_2',
    disciplineId: 'api_inspection',
    moduleId: 'mod_api_1',
    method: 'API',
    frontAr: 'كيف تحسب العمر المتبقي وفترة الفحص الداخلي القصوى لوعاء ضغط وفق API 510؟',
    frontEn: 'How are Remaining Life and Maximum Inspection Interval calculated under API 510?',
    backAr: '• العمر المتبقي = (السمك الفعلي - t_min) / معدل التآكل (Corrosion Rate).\n• فترة التفتيش الداخلي = نصف العمر المتبقي (Half Remaining Life) أو 10 سنوات (أيهما أقل).',
    backEn: '• Remaining Life = (t_actual - t_min) / Corrosion Rate.\n• Max Internal Inspection Interval = Half remaining life or 10 years, whichever is less.',
    keyFormula: 'RL = (t_act - t_min) / CR',
    codeReference: 'API 510 Section 6.5',
    examTipAr: 'إذا كان العمر المتبقي أقل من 4 سنوات، فإن فترة الفحص تكون العمر المتبقي بالكامل بحد أقصى سنتين.',
    examTipEn: 'When remaining life is less than 4 years, inspection interval may be the full remaining life up to 2 years.'
  },

  // -------------------------------------------------------------
  // Welding Inspection
  // -------------------------------------------------------------
  {
    id: 'fc_weld_1',
    disciplineId: 'welding_inspection',
    moduleId: 'mod_weld_1',
    method: 'WELD',
    frontAr: 'ما هي معادلة حساب طاقة القوس الحرارية (Heat Input) في عمليات اللحام الكهربائي؟',
    frontEn: 'What is the Arc Heat Input equation for electric arc welding processes?',
    backAr: 'Heat Input (kJ/mm) = (V × A × 60) / (Travel Speed mm/min × 1000) × Thermal Efficiency (η)\nحيث η = 0.8 لـ SMAW/MMA، و 0.6 لـ GTAW/TIG، و 0.8 لـ GMAW/MIG، و 1.0 لـ SAW.',
    backEn: 'Heat Input (kJ/mm) = (Volts × Amps × 60) / (Travel Speed mm/min × 1000) × Thermal Efficiency (η)\nWhere η = 0.8 for SMAW, 0.6 for GTAW, 0.8 for GMAW, 1.0 for SAW.',
    keyFormula: 'HI = (V × I × 60) / (S × 1000) × η',
    codeReference: 'EN 1011-1 / ASME Section IX QW-409.1',
    examTipAr: 'زيادة Heat Input تبطئ التبريد وتزيد حجم الحبيبات في HAZ، بينما انخفاضها يسبب تبريداً سريعاً وتكون المارتنسيت الهش.',
    examTipEn: 'High heat input coarsens HAZ grain size; low heat input causes rapid cooling and brittle martensite.'
  }
];
