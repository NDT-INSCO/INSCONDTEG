import { BookPage } from '../data/ndeTextbooksData';
import { Language } from '../types';

export interface KnowledgeCheckQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
  conceptTagAr: string;
  conceptTagEn: string;
}

// Curated high-precision technical question bank mapped by textbook discipline & page numbers
const CURATED_PAGE_QUESTIONS: Record<string, KnowledgeCheckQuestion[]> = {
  // --- Ultrasonic Testing (UT) ---
  'ut_p1': [
    {
      id: 'ut-q1-1',
      questionAr: 'ما هو التردد المعتمد عادة للأمواج فوق الصوتية في الفحوصات الهندسية اللاإتلافية (NDT)؟',
      questionEn: 'What is the standard frequency range for ultrasonic non-destructive testing (NDT)?',
      optionsAr: ['أقل من 20 هرتز (تحت صوتي)', 'بين 20 هرتز و 20 كيلوهرتز (مجال سمعي)', 'من 0.5 إلى 25 ميجاهرتز (MHz)', 'أعلى من 500 جيجاهرتز'],
      optionsEn: ['Below 20 Hz (Infrasound)', 'Between 20 Hz and 20 kHz (Audible)', 'From 0.5 to 25 MHz', 'Above 500 GHz'],
      correctIndex: 2,
      explanationAr: 'تستخدم فحوصات NDT ترددات تتراوح عادة بين 0.5 و 25 ميجاهرتز (MHz) لتحقيق التوازن بين عمق الاختراق وقوة الفصل لاكتشاف العيوب الدقيقة.',
      explanationEn: 'Industrial NDT ultrasonic testing operates in the 0.5 to 25 MHz range to balance penetration depth with flaw resolution.',
      conceptTagAr: 'أسس الأمواج فوق الصوتية',
      conceptTagEn: 'Ultrasonic Wave Fundamentals'
    },
    {
      id: 'ut-q1-2',
      questionAr: 'ما العلاقة بين التردد (f) والطول الموجي (λ) وسرعة الصوت (v) في المادة؟',
      questionEn: 'What is the relationship between frequency (f), wavelength (λ), and sound velocity (v)?',
      optionsAr: ['λ = v / f', 'λ = v × f', 'λ = f / v', 'λ = v² / f'],
      optionsEn: ['λ = v / f', 'λ = v × f', 'λ = f / v', 'λ = v² / f'],
      correctIndex: 0,
      explanationAr: 'العلاقة الفيزيائية الحاكمة هي λ = v / f؛ حيث يتناسب الطول الموجي عكسياً مع التردد عند ثبات سرعة انتشار الموجة في الوسط.',
      explanationEn: 'The governing equation is λ = v / f, where wavelength is inversely proportional to frequency for a given medium velocity.',
      conceptTagAr: 'معادلة الطول الموجي',
      conceptTagEn: 'Wavelength Equation'
    }
  ],
  'ut_p2': [
    {
      id: 'ut-q2-1',
      questionAr: 'وفقاً لقانون سنيل (Snell’s Law)، متى تحدث الزاوية الحرجة الأولى في فحص UT للصلب؟',
      questionEn: "According to Snell's Law, when does the first critical angle occur in ultrasonic testing of steel?",
      optionsAr: ['عندما تنكسر الموجة الطولية بزاوية 90° داخل المادة', 'عندما تنكسر الموجة القصية بزاوية 90°', 'عند وصول زاوية السقوط إلى 0° بالضبط', 'عندما تتلاشى موجة ريليه السطحية'],
      optionsEn: ['When the longitudinal refracted wave reaches 90°', 'When the shear wave reaches 90°', 'When the incident angle is exactly 0°', 'When the Rayleigh wave disappears'],
      correctIndex: 0,
      explanationAr: 'تحدث الزاوية الحرجة الأولى عندما تصبح زاوية انكسار الموجة الطولية 90 درجة، مما يترك فقط الأمواج القصية (Transverse/Shear waves) لتنتشر في المادة.',
      explanationEn: 'The first critical angle occurs when the refracted longitudinal wave reaches 90 degrees, leaving only shear waves in the test piece.',
      conceptTagAr: 'قانون سنيل والزوايا الحرجة',
      conceptTagEn: "Snell's Law & Critical Angles"
    }
  ],
  'ut_p3': [
    {
      id: 'ut-q3-1',
      questionAr: 'ما هي المقاومة الصوتية النوعية (Acoustic Impedance Z) وكيف تُحسب؟',
      questionEn: 'What is Acoustic Impedance (Z) and how is it calculated?',
      optionsAr: ['Z = ρ × v (حاصل ضرب الكثافة في سرعة الصوت)', 'Z = ρ / v (الكثافة مقسومة على السرعة)', 'Z = v / f (السرعة مقسومة على التردد)', 'Z = f² × ρ'],
      optionsEn: ['Z = ρ × v (Density multiplied by velocity)', 'Z = ρ / v (Density divided by velocity)', 'Z = v / f (Velocity divided by frequency)', 'Z = f² × ρ'],
      correctIndex: 0,
      explanationAr: 'تُعرف المقاومة الصوتية بأنها حاصل ضرب كثافة الوسط (ρ) في سرعة الصوت فيه (v)، وتحدد نسبة الطاقة الصوتية المنعكسة والمنقولة عبر السطوح البينية.',
      explanationEn: 'Acoustic impedance Z is the product of material density (ρ) and acoustic velocity (v), governing reflection and transmission at boundaries.',
      conceptTagAr: 'المقاومة الصوتية ومعامل الانعكاس',
      conceptTagEn: 'Acoustic Impedance & Reflection'
    }
  ],

  // --- Radiographic Testing (RT) ---
  'rt_p1': [
    {
      id: 'rt-q1-1',
      questionAr: 'وفقاً لقانون التربيع العكسي، إذا تضاعفت المسافة من المصدر الإشعاعي مرتين، فكم تصبح شدة الإشعاع؟',
      questionEn: 'According to the Inverse Square Law, if the distance from the radiation source is doubled, the radiation intensity becomes:',
      optionsAr: ['نصف القيمة الأصلية (1/2)', 'ربع القيمة الأصلية (1/4)', 'ضعف القيمة الأصلية (2x)', 'ثُمن القيمة الأصلية (1/8)'],
      optionsEn: ['Half the original value (1/2)', 'One-quarter of the original value (1/4)', 'Twice the original value (2x)', 'One-eighth of the original value (1/8)'],
      correctIndex: 1,
      explanationAr: 'ينص قانون التربيع العكسي (I₁/I₂ = D₂²/D₁²) على أن الشدة تتناسب عكسياً مع مربع المسافة؛ لذا فمضاعفة المسافة مرتين تقلل الشدة إلى الربع (1/4).',
      explanationEn: 'The Inverse Square Law states intensity is inversely proportional to distance squared; doubling distance reduces intensity to 1/4.',
      conceptTagAr: 'قانون التربيع العكسي',
      conceptTagEn: 'Inverse Square Law'
    }
  ],
  'rt_p2': [
    {
      id: 'rt-q2-1',
      questionAr: 'ما هو تعريف سُمك نصف القيمة (Half-Value Layer - HVL) في الفيزياء الإشعاعية؟',
      questionEn: 'What is the definition of Half-Value Layer (HVL) in radiation physics?',
      optionsAr: ['سُمك المادة الذي يقلل شدة الإشعاع إلى النصف (50%)', 'سُمك فيلم الأشعة المطلوب للتصوير', 'نصف قطر بؤرة أنبوب الأشعة السينية', 'عمق النفاذ الأقصى للشعاع'],
      optionsEn: ['Material thickness that attenuates radiation intensity by 50%', 'Radiographic film thickness required for exposure', 'Half the focal spot radius', 'Maximum penetration depth'],
      correctIndex: 0,
      explanationAr: 'طبقة نصف القيمة (HVL) هي سُمك الدرع الواقي الذي يخفّض شدة الحزمة الإشعاعية إلى 50% من شدتها الابتدائية وفق معادلة الامتصاص الأسي.',
      explanationEn: 'HVL is the thickness of a specific shielding material that reduces beam intensity to 50% of its initial value.',
      conceptTagAr: 'طبقة نصف القيمة والتوهين',
      conceptTagEn: 'Half-Value Layer & Attenuation'
    }
  ],

  // --- Magnetic Particle Testing (MT) ---
  'mt_p1': [
    {
      id: 'mt-q1-1',
      questionAr: 'ما هو الشرط الأساسي في المادة لتكون قابلة للفحص بجزيئات المغناطيسية (MT)؟',
      questionEn: 'What is the primary material requirement for Magnetic Particle Testing (MT)?',
      optionsAr: ['أن تكون المادة ذات موصلية كهربائية عالية جداً', 'أن تكون المادة ذات مغناطيسية حديدية (Ferromagnetic)', 'أن تكون المادة شفافة بصرياً', 'أن تكون المادة غير مغناطيسية كالألومنيوم'],
      optionsEn: ['Extremely high electrical conductivity', 'Ferromagnetic material properties', 'Optical transparency', 'Non-magnetic material such as aluminum'],
      correctIndex: 1,
      explanationAr: 'يقتصر فحص MT على المواد ذات المغناطيسية الحديدية (Ferromagnetic) كالصلب الكربوني وحديد الصب، التي تسمح بتشكيل خطوط فيض مغناطيسي كافية لتكوين تسرب مغناطيسي (Flux Leakage).',
      explanationEn: 'MT requires ferromagnetic materials (e.g., carbon steel) capable of sustaining magnetic flux leakage at discontinuities.',
      conceptTagAr: 'المغناطيسية الحديدية وتسرب الفيض',
      conceptTagEn: 'Ferromagnetism & Flux Leakage'
    }
  ],
  'mt_p2': [
    {
      id: 'mt-q2-1',
      questionAr: 'ما الفرق الرئيسي بين المغنطة بالتيار المتردد (AC) والتيار المستمر (DC) في فحص MT؟',
      questionEn: 'What is the main difference between AC and DC magnetization in MT inspection?',
      optionsAr: ['التيار المتردد يكشف العيوب العميقة والتيار المستمر يكشف السطحية', 'التيار المتردد يتركز على السطح بسبب الظاهرة الجلدية، بينما التيار المستمر يخترق لعمق أكبر', 'لا يوجد أي فرق بينهما في الاستجابة', 'التيار المتردد يلغي المغناطيسية فقط'],
      optionsEn: ['AC detects deep subsurface flaws while DC detects surface', 'AC concentrates on the surface due to skin effect, whereas DC penetrates deeper', 'No operational difference exists', 'AC is solely used for demagnetization'],
      correctIndex: 1,
      explanationAr: 'بفعل الظاهرة الجلدية (Skin Effect)، تتركز خطوط الفيض المغناطيسي للتيار المتردد (AC) على السطح مما يمنحه حساسية قصوى للشقوق السطحية، بينما يخترق التيار المستمر (DC) إلى عمق تحت السطح.',
      explanationEn: 'Due to the skin effect, AC magnetic fields concentrate near the surface providing high surface flaw sensitivity, while DC penetrates into the subsurface.',
      conceptTagAr: 'الظاهرة الجلدية واختيار نوع التيار',
      conceptTagEn: 'Skin Effect & Current Selection'
    }
  ],

  // --- Liquid Penetrant Testing (PT) ---
  'pt_p1': [
    {
      id: 'pt-q1-1',
      questionAr: 'ما هي الخاصية الفيزيائية الأساسية التي يعتمد عليها فحص السائل النافذ (PT) لدخول الشقوق الدقيقة؟',
      questionEn: 'What fundamental physical property enables penetrant to enter fine surface cracks in PT?',
      optionsAr: ['الحث الكهرومغناطيسي', 'الخاصية الشعرية (Capillary Action)', 'النشاط الإشعاعي', 'الانكسار الصوتي'],
      optionsEn: ['Electromagnetic induction', 'Capillary action', 'Radioactive decay', 'Acoustic refraction'],
      correctIndex: 1,
      explanationAr: 'يعتمد فحص PT بالكامل على الخاصية الشعرية (Capillary Action) الناتجة عن قوى التلاصق والتوتر السطحي لجذب السائل النافذ واحتجازه داخل الشقوق المفتوحة للسطح.',
      explanationEn: 'PT relies entirely on capillary action driven by surface tension and wetting ability to draw penetrant into surface-breaking discontinuities.',
      conceptTagAr: 'الخاصية الشعرية والتوتر السطحي',
      conceptTagEn: 'Capillary Action & Surface Tension'
    }
  ],
  'pt_p2': [
    {
      id: 'pt-q2-1',
      questionAr: 'ما هو زمن التغلغل (Dwell Time) في فحص السائل النافذ؟',
      questionEn: 'What is Dwell Time in Liquid Penetrant Testing?',
      optionsAr: ['الزمن المسموح به لجفاف المظهر (Developer)', 'الزمن الكلي لفحص العينة بالمجهر', 'الزمن المطلوب لبقاء السائل النافذ مبللاً على السطح ليتغلغل داخل العيوب', 'زمن تنظيف القطعة بالمذيب'],
      optionsEn: ['Time for developer drying', 'Total microscopy inspection time', 'Time the penetrant remains wet on the surface to infiltrate flaws', 'Solvent pre-cleaning duration'],
      correctIndex: 2,
      explanationAr: 'زمن التغلغل (Dwell Time) هو المدة الزمنية المحددة في الإجراء القياسي (مثل ASME Sec V) لترك السائل النافذ مبللاً على السطح لضمان اختراقه الكامل لأضيق الشقوق.',
      explanationEn: 'Dwell time is the specified duration the penetrant must remain wet on the part surface to ensure full infiltration into discontinuities.',
      conceptTagAr: 'زمن التغلغل واشتراطات ASME',
      conceptTagEn: 'Dwell Time & ASME Requirements'
    }
  ],

  // --- Eddy Current Testing (ET) ---
  'et_p1': [
    {
      id: 'et-q1-1',
      questionAr: 'ما هو القانون الكهرومغناطيسي الأساسي الذي يصف توليد التيارات الدوامية داخل المادة الموصلة؟',
      questionEn: "What fundamental electromagnetic law describes the induction of eddy currents in conductive materials?",
      optionsAr: ["قانون فاراداي للحث الكهرومغناطيسي وقانون لينز", "قانون كولوم الكهروستاتيكي", "قانون سنيل للانكسار", "قانون بوييل للغازات"],
      optionsEn: ["Faraday's Law of Induction & Lenz's Law", "Coulomb's Law of Electrostatics", "Snell's Law of Refraction", "Boyle's Ideal Gas Law"],
      correctIndex: 0,
      explanationAr: "ينص قانون فاراداي على أن التغير في المجال المغناطيسي يولد قوة دافعة كهربائية تستحث تيارات دوامية، ويعاكس اتجاهها المجال الأصلي طبقاً لقانون لينز.",
      explanationEn: "Faraday's Law establishes that changing magnetic flux induces an EMF driving circulating eddy currents, oriented to oppose the source by Lenz's Law.",
      conceptTagAr: "قانون فاراداي ولينز",
      conceptTagEn: "Faraday's & Lenz's Laws"
    }
  ],
  'et_p2': [
    {
      id: 'et-q2-1',
      questionAr: 'عند زيادة تردد الفحص (Frequency) في اختبار التيارات الدوامية، ماذا يحدث لعمق النفاذ القياسي (δ)؟',
      questionEn: 'When the inspection frequency is increased in Eddy Current testing, what happens to standard depth of penetration (δ)?',
      optionsAr: ['يزداد عمق النفاذ إلى الضعف', 'يقل عمق النفاذ وتتركز التيارات بالقرب من السطح', 'يبقى عمق النفاذ ثابتاً دون أي تغيير', 'تتلاشى الموصلية الكهربائية'],
      optionsEn: ['Depth of penetration doubles', 'Depth of penetration decreases, concentrating currents near surface', 'Penetration depth remains unchanged', 'Electrical conductivity drops to zero'],
      correctIndex: 1,
      explanationAr: 'يتناسب عمق النفاذ القياسي δ = 1 / √(π f μ σ) عكسياً مع الجذر التربيعي للتردد؛ لذا فإن رفع التردد يقلل عمق النفاذ ويركز الطاقة في الطبقة السطحية.',
      explanationEn: 'Standard depth δ = 1 / √(π f μ σ) is inversely proportional to √frequency, meaning higher frequencies produce shallower penetration.',
      conceptTagAr: 'معادلة عمق النفاذ القياسي',
      conceptTagEn: 'Standard Depth of Penetration Formula'
    }
  ],

  // --- Visual Testing (VT) ---
  'vt_p1': [
    {
      id: 'vt-q1-1',
      questionAr: 'وفقاً لمتطلبات كود ASME Section V Article 9، ما هو الحد الأدنى لمستوى الإضاءة المطلوب لإجراء الفحص البصري المباشر (Direct Visual)؟',
      questionEn: 'According to ASME Section V Article 9, what is the minimum illumination level required for direct visual examination?',
      optionsAr: ['100 لوكس (Lux)', '500 لوكس (Lux)', '1000 لوكس (100 foot-candles / 1076 Lux)', '50 لوكس فقط في الغرف المظلمة'],
      optionsEn: ['100 Lux (10 fc)', '500 Lux (50 fc)', '1000 Lux (100 foot-candles / 1076 Lux)', '50 Lux in darkened area'],
      correctIndex: 2,
      explanationAr: 'يشترط كود ASME Section V ألا يقل مستوى الإضاءة على سطح الفحص عن 1000 لوكس (100 foot-candles) لضمان وضوح وتمييز أدق العيوب والتشققات.',
      explanationEn: 'ASME Section V mandates a minimum light intensity of 1000 Lux (100 foot-candles) at the inspection surface for direct visual examination.',
      conceptTagAr: 'متطلبات الإضاءة لكود ASME',
      conceptTagEn: 'ASME Illumination Criteria'
    },
    {
      id: 'vt-q1-2',
      questionAr: 'ما هي المسافة والزاوية المعيارية للرؤية في الفحص البصري المباشر وفق المعايير القياسية؟',
      questionEn: 'What are the standard distance and viewing angle limits for direct visual inspection?',
      optionsAr: ['مسافة لا تتجاوز 600 ملم (24 بوصة) وزاوية لا تقل عن 30 درجة مع السطح', 'مسافة مترين وزاوية 10 درجات', 'مسافة 10 أمتار باستخدام منظار مقرب', 'الزاوية يجب أن تكون 90 درجة فقط على بعد 5 سم'],
      optionsEn: ['Distance <= 600 mm (24 in) and angle >= 30 degrees to the surface', 'Distance 2 meters and angle 10 degrees', 'Distance 10 meters with binoculars', 'Angle must be exactly 90 degrees at 5 cm distance'],
      correctIndex: 0,
      explanationAr: 'تنص المواصفات الدولية كـ ASME و AWS على أن تكون العين على مسافة لا تزيد عن 600 ملم (24 in) وبزاوية نظر لا تقل عن 30° عن سطح القطعة المفحوصة.',
      explanationEn: 'Standards require the inspector eye to be within 600 mm (24 in) of the examination surface at an angle of not less than 30 degrees.',
      conceptTagAr: 'زوايا ومسافات الرؤية المباشرة',
      conceptTagEn: 'Viewing Angles & Distance Limits'
    }
  ],

  // --- Phased Array & TOFD ---
  'paut / tofd_p1': [
    {
      id: 'paut-q1-1',
      questionAr: 'ما هو الشرط الهندسي لتجنب تكون فصوص التعرج الزائفة (Grating Lobes) في محولات PAUT؟',
      questionEn: 'What is the design condition to avoid grating lobes in phased array transducers?',
      optionsAr: [
        'أن تكون خطوة العناصر (Pitch) أصغر من أو تساوي نصف الطول الموجي (p ≤ λ/2)',
        'أن يتم طلاء الإسفين بطبقة من الزيت الثقيل',
        'أن يكون عدد العناصر 4 عناصر فقط',
        'أن تكون زاوية الانكسار 90 درجة دائماً'
      ],
      optionsEn: [
        'Element pitch must be less than or equal to half the wavelength (p <= lambda / 2)',
        'Wedge must be coated with heavy grease',
        'Total element count must be strictly 4',
        'Refracted angle must always be 90 degrees'
      ],
      correctIndex: 0,
      explanationAr: 'تشترط المعايير الهندسية لكود ASME Sec V Art 4 ألا تتجاوز خطوة العناصر (Pitch) نصف الطول الموجي λ/2 لمنع تداخل الموجات الجانبية المشكلة لفصوص التعرج.',
      explanationEn: 'ASME Sec V mandates element pitch p <= lambda / 2 to suppress spatial aliasing grating lobes.',
      conceptTagAr: 'معيار تجنب فصوص التعرج',
      conceptTagEn: 'Grating Lobe Suppression'
    }
  ],
  'paut / tofd_p4': [
    {
      id: 'tofd-q4-1',
      questionAr: 'ما الترتيب الزمني الصحيح لوصول الإشارات الصوتية على شاشة فحص TOFD؟',
      questionEn: 'What is the correct temporal sequence of acoustic signals on a TOFD A-scan?',
      optionsAr: [
        'الموجة الجانبية (LW) ← حيود القمة العلوية ← حيود القاع السفلي ← صدى القاع (BW)',
        'صدى القاع (BW) ← الموجة الجانبية (LW) ← الشق',
        'حيود القمة العلوية أولاً ثم الموجة الجانبية',
        'لا يوجد أي ترتيب ثابت وتصل جميعها في نفس الوقت'
      ],
      optionsEn: [
        'Lateral Wave (LW) -> Upper Tip -> Lower Tip -> Backwall Echo (BW)',
        'Backwall Echo (BW) -> Lateral Wave -> Flaw tips',
        'Upper Tip first, followed by Lateral Wave',
        'No chronological sequence; all signals arrive concurrently'
      ],
      correctIndex: 0,
      explanationAr: 'تصل الموجة الجانبية السطحية أولاً لأنها تقطع أقصر مسار مستقيم تحت السطح، تليها إشارة حيود قمة الشق العلوية (ب Secara معكوس)، ثم القاع السفلي، وأخيراً صدى الجدار الخلفي.',
      explanationEn: 'The lateral wave arrives first taking the shortest direct surface path, followed by upper tip (phase inverted), lower tip, and lastly specular backwall reflection.',
      conceptTagAr: 'تسلسل إشارات TOFD',
      conceptTagEn: 'TOFD Signal Chronology'
    }
  ],

  // --- Welding Quality & Acceptance Codes ---
  'welding & codes_p1': [
    {
      id: 'weld-q1-1',
      questionAr: 'ما هو العيب الداخلي المميز لعملية لحام TIG (GTAW) والذي يظهر في صور الأشعة كنقاط بيضاء ناصعة؟',
      questionEn: 'Which internal discontinuity is distinctive to GTAW (TIG) and appears as bright white spots on radiographs?',
      optionsAr: [
        'شوائب التنجستن (Tungsten Inclusions)',
        'احتباس الخبث الفلكسي (Slag Inclusions)',
        'المسامية الدودية السطحية',
        'تقويض باص الوجه (Undercut)'
      ],
      optionsEn: [
        'Tungsten Inclusions',
        'Flux Slag Inclusions',
        'Surface Wormhole Porosity',
        'Face Undercut'
      ],
      correctIndex: 0,
      explanationAr: 'تنتج شوائب التنجستن عن تلامس قطب التنجستن غير المستهلك مع حوض اللحام، وتظهر ناصعة البياض في أفلام الأشعة لأن كثافة التنجستن العالية توهن الأشعة بدرجة أكبر بكثير من الفولاذ.',
      explanationEn: 'Tungsten inclusions result from electrode dip, appearing as bright white spots on radiographs due to tungsten high atomic density attenuating X-rays far more than steel.',
      conceptTagAr: 'شوائب التنجستن في GTAW',
      conceptTagEn: 'GTAW Tungsten Inclusions'
    }
  ],
  'welding & codes_p3': [
    {
      id: 'weld-q3-1',
      questionAr: 'وفق كود أوعية الضغط ASME Section VIII UW-51، ما حكم الشروخ ونقص الانصهار؟',
      questionEn: 'Under ASME Section VIII Div 1 UW-51 full radiography, what is the disposition of cracks and lack of fusion?',
      optionsAr: [
        'مرفوضة رفضاً قاطعاً بغض النظر عن طولها (Rejectable)',
        'مقبولة إذا كان طولها أقل من 6 ملم',
        'مقبولة في الألواح التي تزيد سماكتها عن 50 ملم',
        'يُسمح بنقص الانصهار في باص الجذر فقط'
      ],
      optionsEn: [
        'Strictly rejectable regardless of length (Zero tolerance)',
        'Acceptable if length is under 6 mm',
        'Acceptable in plates thicker than 50 mm',
        'Lack of fusion is tolerated in root pass only'
      ],
      correctIndex: 0,
      explanationAr: 'تنص الفقرة UW-51(b)(1) و (2) على أن الشروخ ونقص الانصهار ونقص الاختراق تعتبر عيوباً مرفوضة قطعاً دون أي سماحية لطولها في أوعية الضغط.',
      explanationEn: 'UW-51 mandates zero tolerance for cracks, lack of fusion, and incomplete penetration; any presence is non-negotiably rejectable.',
      conceptTagAr: 'معايير رفض الشروخ في ASME',
      conceptTagEn: 'ASME Section VIII UW-51 Mandates'
    }
  ],

  // --- Acoustic Emission & Leak Testing ---
  'ae_lt_p1': [
    {
      id: 'ae-q1-1',
      questionAr: 'ما هو التفسير الفيزيائي لظاهرة فيليسيتي (Felicity Effect) في فحص الانبعاث الصوتي؟',
      questionEn: 'What is the physical interpretation of the Felicity Effect in Acoustic Emission?',
      optionsAr: [
        'ظهور انبعاثات صوتية مبكرة عند حمل أقل من الحمل الأقصى السابق نتيجة وجود شرخ ميكانيكي نشط',
        'انعدام الصوت تماماً حتى ينكسر الوعاء فجأة',
        'زيادة سرعة الصوت إلى الضعف داخل السائل الهيدروليكي',
        'تلاشي الإشارات بسبب حرارة الوسط'
      ],
      optionsEn: [
        'Early acoustic emissions occurring at loads below previous peak due to active defect growth',
        'Total acoustic silence until catastrophic structural failure',
        'Acoustic velocity doubling inside hydraulic fluid',
        'Signal extinction caused by thermal ambient effects'
      ],
      correctIndex: 0,
      explanationAr: 'تحدث ظاهرة فيليسيتي عندما تبدأ الانبعاثات الصوتية عند مستوى حمل أقل من الحمل الأقصى السابق (نسبة فيليسيتي FR < 1)، وهي علامة تشخيصية قاطعة على وجود شرخ نشط ينمو في المعدة.',
      explanationEn: 'The Felicity Effect occurs when emissions start below the prior peak load (FR < 1), definitively diagnosing active defect propagation under stress.',
      conceptTagAr: 'ظاهرة ونسبة فيليسيتي',
      conceptTagEn: 'Felicity Effect & Ratio'
    }
  ],
  'ae_lt_p4': [
    {
      id: 'ae-q4-1',
      questionAr: 'كم هو الحد الأدنى الهندسي لعدد مجسات AE غير المتسامتة اللازمة لتحديد موقع مصدر الشروخ على سطح مستوٍ عبر خوارزمية TDOA؟',
      questionEn: 'What is the geometric minimum number of non-collinear AE sensors required for 2D planar source location via TDOA?',
      optionsAr: [
        '3 مجسات على الأقل (Triangular array)',
        'مجسان فقط على خط مستقيم',
        'مجس واحد مركزي',
        '50 مجساً'
      ],
      optionsEn: [
        'Minimum of 3 non-collinear sensors (Triangular array)',
        'Only 2 sensors along a straight line',
        'A single central transducer',
        '50 sensors'
      ],
      correctIndex: 0,
      explanationAr: 'يتطلب التثليث المستوي لتقاطع خطوط القطوع الزائدة TDOA وجود ما لا يقل عن 3 مجسات في مصفوفة غير متسامتة على خط واحد لتعيين الإحداثيات (x, y) بدون غموض مكاني.',
      explanationEn: '2D planar triangulation via intersecting hyperbolic TDOA curves geometrically mandates a minimum of 3 non-collinear sensors to resolve (x, y) coordinates.',
      conceptTagAr: 'هندسة تثليث مصادر AE',
      conceptTagEn: 'AE Planar Triangulation'
    }
  ],
  'ae_lt_p6': [
    {
      id: 'lt-q6-1',
      questionAr: 'في أي نمط تدفق غازي يخضع تسريب الهيليوم لقانون غراهام ويتناسب معدل التسريب عكسياً مع الجذر التربيعي للكتلة الجزيئية (1/√M)؟',
      questionEn: "In which gas flow regime does helium leakage follow Graham's Law, with leak rate scaling inversely with √M?",
      optionsAr: [
        'التدفق الجزيئي الحر (Molecular Flow حيث رقم كنودسن Kn > 1)',
        'التدفق اللزج الصفائحي (Viscous Laminar)',
        'التدفق المضطرب العاصف (Turbulent)',
        'التدفق دون الصوتي'
      ],
      optionsEn: [
        'Molecular Flow regime (Knudsen number Kn > 1)',
        'Viscous Laminar flow regime',
        'Turbulent choked flow',
        'Subsonic bulk flow'
      ],
      correctIndex: 0,
      explanationAr: 'في التخلخل العالي حيث Kn > 1، يسود التدفق الجزيئي الحر وتتحرك الجزيئات دون تصادمات بينية، لذا ينفذ الهيليوم الخفيف (M=4) أسرع بكثير من الهواء (M=28.9) وفق قانون غراهام 1/√M.',
      explanationEn: "In high vacuum where Kn > 1, molecular flow dominates; lighter helium gas (M=4) passes ~2.7x faster than air (M=28.9) according to Graham's Law.",
      conceptTagAr: 'التدفق الجزيئي وقانون غراهام',
      conceptTagEn: "Molecular Flow & Graham's Law"
    }
  ]
};

/**
 * Intelligent Dynamic Question Generator:
 * Generates tailored multiple-choice questions from any page's text, formulas, and key points
 */
export function generateKnowledgeCheckQuestions(
  page: BookPage,
  language: Language = 'ar',
  bookDiscipline: string = 'NDT'
): KnowledgeCheckQuestion[] {
  const result: KnowledgeCheckQuestion[] = [];
  const pageIdKey = `${bookDiscipline.toLowerCase()}_p${page.pageNumber}`;

  // 1. Check curated high-fidelity questions for this specific discipline & page
  if (CURATED_PAGE_QUESTIONS[pageIdKey] && CURATED_PAGE_QUESTIONS[pageIdKey].length > 0) {
    result.push(...CURATED_PAGE_QUESTIONS[pageIdKey]);
  }

  // 2. If the page already has a predefined quizQuestion, incorporate it
  if (page.quizQuestion) {
    result.push({
      id: `page-def-q-${page.pageNumber}`,
      questionAr: page.quizQuestion.questionAr,
      questionEn: page.quizQuestion.questionEn,
      optionsAr: page.quizQuestion.optionsAr,
      optionsEn: page.quizQuestion.optionsEn,
      correctIndex: page.quizQuestion.correctIndex,
      explanationAr: page.quizQuestion.explanationAr,
      explanationEn: page.quizQuestion.explanationEn,
      conceptTagAr: page.chapterTitleAr,
      conceptTagEn: page.chapterTitleEn
    });
  }

  // 3. Dynamic Generation based on Governing Formula (if present)
  if (page.formula) {
    const formulaQ: KnowledgeCheckQuestion = {
      id: `dyn-formula-${page.pageNumber}`,
      questionAr: `بناءً على المعادلة الهندسية الحاكمة في هذه الصفحة: [ ${page.formula.latex} ]، ما المبدأ الفيزيائي المباشر الذي تحسبه؟`,
      questionEn: `Based on the governing engineering equation on this page: [ ${page.formula.latex} ], what physical relationship does it define?`,
      optionsAr: [
        page.formula.descriptionAr,
        'حساب نسبة الرطوبة النسبية في بيئة الورشة',
        'معدل التآكل الكيميائي السطحي للمعادن غير الحديدية',
        'تحديد التكلفة التشغيلية الإجمالية للمعدة'
      ],
      optionsEn: [
        page.formula.descriptionEn,
        'Relative humidity calculation in the workshop environment',
        'Surface chemical corrosion rate in non-ferrous alloys',
        'Total operational lifecycle cost estimation'
      ],
      correctIndex: 0,
      explanationAr: `المعادلة الرياضية المعروضة [ ${page.formula.latex} ] تمثل بدقة: ${page.formula.descriptionAr}، وهي ركيزة أساسية في التحليل الحسابي لهذا الباب.`,
      explanationEn: `The mathematical equation [ ${page.formula.latex} ] specifically defines: ${page.formula.descriptionEn}, serving as a key analytical baseline for this chapter.`,
      conceptTagAr: 'المعادلة الهندسية الحاكمة',
      conceptTagEn: 'Governing Engineering Formula'
    };
    result.push(formulaQ);
  }

  // 4. Dynamic Generation from Key Engineering Points (if present)
  if (page.keyPointsAr && page.keyPointsAr.length > 0) {
    const primaryTakeawayAr = page.keyPointsAr[0];
    const primaryTakeawayEn = (page.keyPointsEn && page.keyPointsEn[0]) || primaryTakeawayAr;
    
    // Choose distractor styles based on common engineering traps
    const keyPointQ: KnowledgeCheckQuestion = {
      id: `dyn-keypoint-${page.pageNumber}`,
      questionAr: `وفقاً للمفاهيم الهندسية المقررة في صفحة "${page.pageTitleAr}"، أي من العبارات التالية صحيحة؟`,
      questionEn: `According to the technical concepts established on page "${page.pageTitleEn}", which of the following statements is scientifically accurate?`,
      optionsAr: [
        primaryTakeawayAr,
        'لا تلزم معايرة الأجهزة قبل الفحص إذا كانت جديدة الصنع ومحفوظة بمستودع جاف',
        'يمكن تجاهل توجيهات الأكواد القياسية الدولية في حالات الفحص الميداني العاجل',
        'جميع المواد الهندسية تتفاعل بنفس المقدار المتطابق مع الطاقة المطبقة دون تباين في المقاومة'
      ],
      optionsEn: [
        primaryTakeawayEn,
        'Instrument calibration is unnecessary if the device is recently purchased and stored dry',
        'International standard code mandates may be omitted during urgent field operations',
        'All engineering materials respond identically to applied excitation energy without impedance variation'
      ],
      correctIndex: 0,
      explanationAr: `العبارة الصحيحة المؤكدة في محتوى الصفحة هي: "${primaryTakeawayAr}". أما بقية الخيارات فتمثل أخطاء تشغيلية شائعة تتعارض مع معايير الجودة وسلامة المنشآت.`,
      explanationEn: `The verified fact highlighted in this page is: "${primaryTakeawayEn}". The other options represent common operational pitfalls violating standard quality assurance protocols.`,
      conceptTagAr: 'المفاهيم الهندسية الجوهرية',
      conceptTagEn: 'Core Engineering Takeaways'
    };
    result.push(keyPointQ);
  }

  // 5. Fallback generator if fewer than 2 questions exist for this page
  if (result.length < 2) {
    const pageTitleAr = page.pageTitleAr;
    const pageTitleEn = page.pageTitleEn;
    const fallbackQ: KnowledgeCheckQuestion = {
      id: `dyn-concept-${page.pageNumber}`,
      questionAr: `ما هو الهدف الفني الرئيسي من دراسة "${pageTitleAr}" ضمن فحص ${bookDiscipline}؟`,
      questionEn: `What is the primary technical objective of studying "${pageTitleEn}" within ${bookDiscipline} inspection?`,
      optionsAr: [
        `فهم آليات التشغيل والتحكم في المتغيرات الفيزيائية لضمان دقة كشف وتوصيف العيوب بدقة`,
        'استبدال عمليات الفحص الدوري كلياً بالاختبارات الإتلافية',
        'تقليل متطلبات تدريب الفاحصين إلى الصفر',
        'إلغاء الحاجة لتدوين تقارير الفحص والاحتفاظ بها'
      ],
      optionsEn: [
        `Understanding physical mechanisms and variable control to ensure accurate flaw detection and sizing`,
        'Completely replacing routine non-destructive surveillance with destructive coupons',
        'Eliminating all personnel certification and qualification requirements',
        'Abolishing test report documentation and archiving protocols'
      ],
      correctIndex: 0,
      explanationAr: `الهدف الهندسي المحوري لموضوع "${pageTitleAr}" هو ضبط المتغيرات وتطبيق المبادئ الفيزيائية لاكتشاف العيوب بدقة معيارية عالية تتوافق مع اشتراطات السلامة.`,
      explanationEn: `The core objective of "${pageTitleEn}" is controlling variables and applying physical principles for accurate flaw evaluation meeting safety codes.`,
      conceptTagAr: 'أهداف الفحص المعياري',
      conceptTagEn: 'Inspection Objectives'
    };
    result.push(fallbackQ);
  }

  return result;
}
