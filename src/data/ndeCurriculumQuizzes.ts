export interface ArticleQuizQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
}

export const ARTICLE_QUIZZES: Record<string, ArticleQuizQuestion[]> = {
  'intro-ndt-fundamentals': [
    {
      id: 'q-intro-1',
      questionAr: 'ما هو الفرق الجوهري بين مصطلحي "الانقطاع" (Discontinuity) و"العيب" (Defect) في المواصفات الهندسية؟',
      questionEn: 'What is the governing distinction between "Discontinuity" and "Defect" according to engineering codes?',
      optionsAr: [
        'الانقطاع يكون دائماً سبباً لرفض القطعة بينما العيب يمكن قبوله دائماً',
        'الانقطاع هو أي تغير في البنية بينما العيب انقطاع يتجاوز حدود القبول المسموحة في الكود ويستوجب الرفض',
        'العيب يظهر في السطح فقط بينما الانقطاع يظهر في باطن المعدن فقط',
        'لا يوجد أي فرق بينهما وهما مصطلحان مترادفان تماماً'
      ],
      optionsEn: [
        'A discontinuity is always rejectable whereas a defect is always acceptable',
        'A discontinuity is any structural interruption, while a defect exceeds code rejection limits mandating rejection/repair',
        'Defects are surface-only while discontinuities are internal-only',
        'There is no difference, they are exact synonyms'
      ],
      correctIndex: 1,
      explanationAr: 'طبقاً لكودات ASME وAWS وAPI، الانقطاع (Discontinuity) هو أي شذوذ أو تغير في التجانس المعدني، ولا يُسمى عيباً (Defect) إلا إذا تجاوزت أبعاده أو شدته معايير القبول المحددة في الكود، مما يجعله مرفوضاً.',
      explanationEn: 'Under ASME, AWS, and API codes, a discontinuity is any interruption in typical structure; it only becomes a defect when it violates code acceptance criteria, mandating rejection.'
    },
    {
      id: 'q-intro-2',
      questionAr: 'إذا طُلب منك فحص شروخ كلال سطحية مفتوحة في خزان مصنوع من سبائك الألومنيوم غير المغناطيسية، ما هي الطريقة الأنسب؟',
      questionEn: 'To inspect open surface fatigue cracks in a non-magnetic aluminum alloy vessel, which method is most appropriate?',
      optionsAr: [
        'فحص الجسيمات المغناطيسية (MT)',
        'فحص السوائل النافذة (PT)',
        'تشتت الفيض المغناطيسي (MFL)',
        'الفحص بالأشعة السينية فقط'
      ],
      optionsEn: [
        'Magnetic Particle Testing (MT)',
        'Liquid Penetrant Testing (PT)',
        'Magnetic Flux Leakage (MFL)',
        'X-Ray Radiography only'
      ],
      correctIndex: 1,
      explanationAr: 'الألومنيوم معدن غير فيرومغناطيسي، لذلك لا يمكن تطبيق MT أو MFL عليه. طريقة السوائل النافذة (PT) ممتازة لكشف الشروخ السطحية المفتوحة في جميع المعادن الصلبة غير المسامية.',
      explanationEn: 'Aluminum is non-ferromagnetic, ruling out MT and MFL. Liquid Penetrant Testing (PT) is ideal for surface-breaking cracks in all non-porous metals.'
    }
  ],
  'sci-electricity-magnetism': [
    {
      id: 'q-mag-1',
      questionAr: 'ماذا يمثل "المجال المغناطيسي القسري" (Coercive Force - Hc) على منحنى التخلفية المغناطيسية (B-H Loop)؟',
      questionEn: 'What does Coercive Force (Hc) represent on a B-H hysteresis curve?',
      optionsAr: [
        'شدة المغنطة القصوى التي يمكن للمادة الوصول إليها',
        'شدة المجال العكسي المعاكس اللازمة لإزالة المغناطيسية المتبقية تماماً لتصبح الصفر',
        'المغناطيسية المتبقية بعد انقطاع التيار الكهربائي',
        'سرعة توصيل التيار في الملف'
      ],
      optionsEn: [
        'The maximum saturation magnetization of the material',
        'The reverse magnetic field strength required to reduce residual magnetism back to zero',
        'The residual magnetism remaining after the magnetizing force is removed',
        'The electric current speed through the coil'
      ],
      correctIndex: 1,
      explanationAr: 'القوة القسرية (Coercive Force - Hc) هي شدة المجال المغناطيسي العكسي اللازم بذله لتصفير الفيض المتبقي (Retentivity) داخل العينة بعد مغنطتها، وهي معيار رئيسي لصعوبة إزالة المغنطة (Demagnetization).',
      explanationEn: 'Coercive force (Hc) is the intensity of reverse magnetic field needed to reduce residual induction (retentivity) to zero, determining demagnetization difficulty.'
    },
    {
      id: 'q-mag-2',
      questionAr: 'ما هي درجة حرارة كوري (Curie Temperature) وما أثرها على الفحص بالجسيمات المغناطيسية (MT)؟',
      questionEn: 'What is the Curie Temperature and its effect on Magnetic Particle Testing (MT)?',
      optionsAr: [
        'درجة الحرارة التي يتحول عندها الفولاذ من موصل إلى عازل كهربائي',
        'درجة الحرارة (حوالي 770°م للحديد) التي تفقد عندها المادة خواصها الفيرومغناطيسية وتصبح بارامغناطيسية مما يمنع فحص MT',
        'درجة الحرارة المثالية لإجراء المعالجة الحرارية بعد اللحام PWHT',
        'درجة الغليان لسوائل التعليق المغناطيسي'
      ],
      optionsEn: [
        'The temperature where steel turns from conductor to insulator',
        'The temperature (~770°C for iron) where ferromagnetic behavior is lost becoming paramagnetic, disabling MT inspection',
        'The optimal temperature for PWHT post weld heat treatment',
        'The boiling temperature of magnetic carrier oils'
      ],
      correctIndex: 1,
      explanationAr: 'عند تجاوز درجة حرارة كوري (نحو 770 مئوية في الحديد النقي)، تنهار النطاقات المغناطيسية (Magnetic Domains) ويفقد المعدن فيرومغناطيسيته، فلا يمكن توليد فيض مغناطيسي فيه ولا يمكن إجراء فحص MT إطلاقاً فوق هذه الحرارة.',
      explanationEn: 'Above the Curie point (~770°C for pure iron), thermal agitation disrupts magnetic domains, turning ferromagnetic steel paramagnetic and making MT impossible.'
    }
  ],
  'sci-wave-mechanics-acoustics': [
    {
      id: 'q-acoust-1',
      questionAr: 'وفقاً لقانون سنيل (Snell’s Law)، ماذا يحدث للموجة الصوتية عند انتقالها بزاوية سقوط من مادة بطيئة (إسفين البلكسيجلاس) إلى مادة سريعة (الصلب الكربوني)؟',
      questionEn: 'According to Snell’s Law, what happens when sound enters at an angle from a slower medium (Perspex wedge) into a faster medium (carbon steel)?',
      optionsAr: [
        'تنكسر الموجة مقتربة من العمود المقام وتقل سرعتها',
        'تنكسر الموجة مبتعدة عن العمود المقام (زاوية الانكسار أكبر من زاوية السقوط)',
        'تتلاشى الموجة بالكامل ولا تعبر السطح الفاصل',
        'تستمر في نفس مسارها دون أي انكسار بزاوية متطابقة'
      ],
      optionsEn: [
        'The wave refracts towards the normal and slows down',
        'The wave refracts away from the normal (refraction angle > incident angle)',
        'The wave completely disappears and cannot cross the boundary',
        'It continues straight along its original trajectory without bend'
      ],
      correctIndex: 1,
      explanationAr: 'حسب قانون سنيل: (sin θ1 / V1) = (sin θ2 / V2). وبما أن سرعة الصوت في الصلب (V2 ≈ 3240 m/s للموجة المستعرضة) أكبر بكثير من سرعته في البلكسيجلاس (V1 ≈ 2700 m/s)، فإن زاوية الانكسار θ2 تكون أكبر من زاوية السقوط θ1، أي تنكسر مبتعدة عن العمود المقام.',
      explanationEn: 'Snell’s Law states (sin θ1 / V1) = (sin θ2 / V2). Since steel acoustic velocity exceeds acrylic wedge velocity, the refracted angle θ2 is larger than incident angle θ1, bending away from the normal.'
    },
    {
      id: 'q-acoust-2',
      questionAr: 'ما هي الزاوية الحرجة الأولى (First Critical Angle) في فحص الموجات فوق الصوتية بزاوية؟',
      questionEn: 'What is the First Critical Angle in ultrasonic angle beam inspection?',
      optionsAr: [
        'زاوية السقوط التي تنكسر عندها الموجة الطولية بزاوية 90° وتتلاشى ليتبقى فقط موجات القص (Shear Waves) في الصلب',
        'زاوية السقوط التي يتلاشى عندها صوت الجهاز',
        'زاوية السقوط التي تولد موجات طولية فقط دون موجات قص',
        'الزاوية التي ينكسر عندها شعاع الليزر'
      ],
      optionsEn: [
        'The incident angle at which the refracted longitudinal wave reaches 90° and disappears, leaving only shear waves in the steel',
        'The angle where the instrument speaker mutes',
        'The angle producing purely longitudinal waves with zero shear conversion',
        'The angle where laser beams refract'
      ],
      correctIndex: 0,
      explanationAr: 'عند الوصول للزاوية الحرجة الأولى، تصبح زاوية انكسار الموجة الطولية 90 درجة وتتحول لموجة زاحفة على السطح ثم تتلاشى، تاركة في المعدن موجات القص المستعرضة فقط، وهو النطاق المفضل لفحص وصلات اللحام بالزوايا (45°، 60°، 70°).',
      explanationEn: 'At the first critical angle, the longitudinal wave refracts to 90° along the boundary and vanishes, leaving only pure shear waves inside the workpiece—the standard mode for weld angle inspection.'
    }
  ],
  'sci-radiation-physics-decay': [
    {
      id: 'q-rad-1',
      questionAr: 'ما هو عمر النصف (Half-Life) للنظير المشع الإيريديوم-192 (Ir-192) المستخدم بكثرة في التصوير الإشعاعي الميداني؟',
      questionEn: 'What is the half-life of Iridium-192 (Ir-192), widely used in industrial radiography?',
      optionsAr: [
        'حوالي 30 يوماً',
        'حوالي 73.8 يوماً (نحو 74 يوماً)',
        'حوالي 5.27 سنة',
        'حوالي 30 سنة'
      ],
      optionsEn: [
        'Approximately 30 days',
        'Approximately 73.8 days (~74 days)',
        'Approximately 5.27 years',
        'Approximately 30 years'
      ],
      correctIndex: 1,
      explanationAr: 'عمر النصف للإيريديوم-192 هو نحو 74 يوماً (73.83 days)، بينما الكوبالت-60 عمر نصفه 5.27 سنة والسيزيوم-137 عمر نصفه 30.17 سنة والسلينيوم-75 نحو 120 يوماً.',
      explanationEn: 'The half-life of Ir-192 is approximately 73.8 days. Cobalt-60 is 5.27 years, Selenium-75 is ~120 days, and Cesium-137 is 30.2 years.'
    },
    {
      id: 'q-rad-2',
      questionAr: 'إذا كانت شدة الإشعاع عند مسافة مترين من المصدر هي 100 mR/h، فكم تصبح الشدة عند مسافة 4 أمتار وفق قانون التربيع العكسي؟',
      questionEn: 'If radiation intensity at 2 meters from a source is 100 mR/h, what is the intensity at 4 meters per the inverse square law?',
      optionsAr: [
        '50 mR/h',
        '25 mR/h',
        '10 mR/h',
        '200 mR/h'
      ],
      optionsEn: [
        '50 mR/h',
        '25 mR/h',
        '10 mR/h',
        '200 mR/h'
      ],
      correctIndex: 1,
      explanationAr: 'طبقاً لقانون التربيع العكسي: I2 = I1 × (D1 / D2)². بمضاعفة المسافة من 2 متر إلى 4 أمتار (الضعف)، تقل الشدة إلى الربع: 100 / (2)² = 25 mR/h.',
      explanationEn: 'By the Inverse Square Law: I2 = I1 * (D1/D2)². Doubling the distance from 2m to 4m cuts radiation intensity by a factor of 4: 100 / 4 = 25 mR/h.'
    }
  ],
  'method-vt-comprehensive': [
    {
      id: 'q-vt-1',
      questionAr: 'ما هي أدنى شدة إضاءة مطلوبة على السطح المفحوص أثناء إجراء الفحص البصري العام طبقاً لكود ASME Section V Article 9؟',
      questionEn: 'What is the minimum light intensity required at the inspection surface per ASME Section V Article 9 for visual inspection?',
      optionsAr: [
        '100 Lux (10 foot-candles)',
        '500 Lux (50 foot-candles)',
        '1076 Lux (100 foot-candles)',
        '2500 Lux (250 foot-candles)'
      ],
      optionsEn: [
        '100 Lux (10 foot-candles)',
        '500 Lux (50 foot-candles)',
        '1076 Lux (100 foot-candles)',
        '2500 Lux (250 foot-candles)'
      ],
      correctIndex: 2,
      explanationAr: 'يشترط كود ASME Section V Article 9 ألا تقل شدة الإضاءة على سطح الفحص البصري عن 100 foot-candles، وهو ما يعادل تقريباً 1076 لوكس، ويتم قياسها بمقياس لوكسميتر معتمد.',
      explanationEn: 'ASME Section V Article 9 mandates a minimum illumination of 100 foot-candles (approx. 1076 lux) on the workpiece surface, verified using a calibrated light meter.'
    },
    {
      id: 'q-vt-2',
      questionAr: 'ما هي الزاوية والمسافة القصوى المسموح بهما للعين في الفحص البصري المباشر (Direct Visual Inspection) حسب ASME؟',
      questionEn: 'What are the maximum distance and minimum angle permitted for direct visual inspection under ASME Section V?',
      optionsAr: [
        'المسافة لا تزيد عن 24 بوصة (600 ملم) وزاوية الرؤية لا تقل عن 30 درجة مع السطح',
        'المسافة لا تزيد عن 48 بوصة وزاوية الرؤية لا تقل عن 45 درجة',
        'المسافة لا تزيد عن متر واحد وأي زاوية مقبولة',
        'المسافة لا تزيد عن 10 سنتيمترات وزاوية عمودية 90 درجة فقط'
      ],
      optionsEn: [
        'Distance not exceeding 24 inches (600 mm) with an eye-to-surface angle not less than 30 degrees',
        'Distance up to 48 inches with angle not less than 45 degrees',
        'Distance up to 1 meter at any angle',
        'Distance up to 10 cm at exactly 90 degrees'
      ],
      correctIndex: 0,
      explanationAr: 'وفقاً لمواصفات ASME Sec V Art 9، يجب ألا تزيد مسافة عين المفتش عن سطح القطعة عن 24 بوصة (نحو 610 ملم)، وألا تقل زاوية خط النظر عن 30 درجة بالنسبة لمستوى السطح المفحوص.',
      explanationEn: 'Under ASME Sec V Art 9, the inspector’s eye must be within 24 inches (610 mm) of the surface, oriented at an angle of at least 30 degrees to the plane.'
    }
  ],
  'method-pt-comprehensive': [
    {
      id: 'q-pt-1',
      questionAr: 'في مواصفة AMS 2644 لسوائل الفحص النافذة، ماذا يعني التصنيف (Type I, Method A, Form a)؟',
      questionEn: 'Under AMS 2644 penetrant classification, what does (Type I, Method A, Form a) designate?',
      optionsAr: [
        'صبغة مرئية حمراء قابلة للغسيل بالمذيب مع مظهر سائل',
        'صبغة فلورية تتوهج بالأشعة فوق البنفسجية، قابلة للغسيل بالماء مباشرة، مع مظهر مسحوق جاف (Dry Powder)',
        'صبغة ملونة لا تحتاج لمظهر',
        'صبغة ذات حساسية منخفضة جداً للسباكة فقط'
      ],
      optionsEn: [
        'Visible red solvent-removable with liquid developer',
        'Fluorescent penetrant (UV), water-washable, with dry powder developer (Form a)',
        'Self-developing visible dye',
        'Ultra-low sensitivity penetrant for rough castings only'
      ],
      correctIndex: 1,
      explanationAr: 'في AMS 2644: النوع الأول Type I هو الفلوري (Fluorescent)، والطريقة Method A هي القابلية للغسيل بالماء المباشر (Water Washable)، والشكل Form a هو المظهر المسحوق الجاف (Dry Powder Developer).',
      explanationEn: 'Under AMS 2644: Type I denotes fluorescent, Method A denotes water-washable, and Form a denotes dry powder developer.'
    },
    {
      id: 'q-pt-2',
      questionAr: 'لماذا يُحظر تماماً رش المذيب العضوي المنظف (Solvent Remover) مباشرة على السطح أثناء مرحلة إزالة السائل النافذ في Method C؟',
      questionEn: 'Why is it strictly forbidden to spray solvent remover directly onto test parts during penetrant excess removal in Method C?',
      optionsAr: [
        'لأن المذيب سريع الاشتعال فقط',
        'لأنه سيتغلغل داخل الشقوق ويذيب السائل النافذ ويغسله إلى الخارج مما يؤدي إلى عدم ظهور الدلالات وإخفاء العيوب الخطيرة',
        'لأن المذيب يتلف مادة الفولاذ الكربوني',
        'لأنه يجعل سطح القطعة ساخناً جداً'
      ],
      optionsEn: [
        'Solely because the solvent is flammable',
        'Because solvent will wash penetrant out of discontinuities, flushing flaws and masking critical defects',
        'Because solvent chemically attacks carbon steel',
        'Because it causes workpiece overheating'
      ],
      correctIndex: 1,
      explanationAr: 'رش المذيب مباشرة يؤدي إلى ظاهرة الغسيل الزائد (Over-washing) حيث يتسرب المذيب للشقوق ويذيب المادة النافذة ويفرغها، مما يمنع ظهور أي مؤشر لعيوب الشقوق. يجب مسح السطح بقطعة قماش مبللة بالمذيب برفق.',
      explanationEn: 'Spraying solvent directly dissolves and flushes penetrant out of shallow cracks (over-washing), causing false-negative inspection and masking dangerous defects. Solvent must only be applied to lint-free wiping towels.'
    }
  ],
  'method-mt-comprehensive': [
    {
      id: 'q-mt-1',
      questionAr: 'ما هي قدرة الرفع الميكانيكية (Lifting Power) المطلوبة لحاضنة الكهرومغناطيسية (AC Yoke) للتأكد من كفاءة مغنطتها؟',
      questionEn: 'What is the required lifting power for an AC electromagnetic yoke to verify magnetic strength?',
      optionsAr: [
        '4.5 كجم (10 أرطال) عند أقصى تباعد مستخدم بين الأقطاب',
        '18.1 كجم (40 رطلاً)',
        '1 كجم (2.2 رطل)',
        '50 كجم'
      ],
      optionsEn: [
        '10 lbs (4.5 kg) at the maximum pole spacing to be used',
        '40 lbs (18.1 kg)',
        '2.2 lbs (1 kg)',
        '50 kg'
      ],
      correctIndex: 0,
      explanationAr: 'كود ASME Sec V Art 7 وASTM E709 يشترطان أن ترفع حاضنة التيار المتردد (AC Yoke) ثقلاً وزنه 10 أرطال (4.5 كجم) عند مسافة التباعد بين الساقين، بينما حاضنة التيار المستمر (DC Yoke) يلزمها رفع 40 رطلاً (18.1 كجم).',
      explanationEn: 'ASME Sec V Art 7 and ASTM E709 specify that an AC yoke must lift a 10 lb (4.5 kg) test weight at maximum operating spacing; DC yokes must lift 40 lbs (18.1 kg).'
    },
    {
      id: 'q-mt-2',
      questionAr: 'ما نوع التيار الكهربائي الأكثر تفضيلاً لكشف الشقوق السطحية الدقيقة في فحص الجسيمات المغناطيسية، ولماذا؟',
      questionEn: 'Which electrical current type is preferred for detecting fine surface cracks in MT, and why?',
      optionsAr: [
        'التيار المستمر النقي (DC) لأنه يخترق لأعماق كبيرة',
        'التيار المتردد (AC) بسبب ظاهرة الظاهرة السطحية (Skin Effect) التي تحصر الفيض في السطح بدقة',
        'التيار ثلاثي الأطوار عالي التردد',
        'تيار البطارية العادي'
      ],
      optionsEn: [
        'Pure Direct Current (DC) because of deep penetration',
        'Alternating Current (AC) due to skin effect concentrating magnetic flux at the outer surface',
        'Three-phase high frequency current',
        'Standard battery direct current'
      ],
      correctIndex: 1,
      explanationAr: 'في التيار المتردد (AC)، تؤدي الظاهرة السطحية (Skin Effect) إلى تركيز كثافة الفيض المغناطيسي على الطبقة السطحية الرقيقة الخارجية، مما يعطي أعلى حساسية للشروخ السطحية الدقيقة، بالإضافة إلى أن تذبذب التيار يمنح الجسيمات حركة تنشيطية (Particle Mobility).',
      explanationEn: 'Alternating Current (AC) produces a skin effect that confines magnetic flux lines right at the outer surface, maximizing sensitivity for tight surface cracks while providing particle mobility.'
    }
  ],
  'method-ut-comprehensive': [
    {
      id: 'q-ut-1',
      questionAr: 'ماذا يحدث لشعاع الموجات فوق الصوتية في منطقة الحقل القريب (Near Field - Fresnel Zone) أمام المحول؟',
      questionEn: 'What characterizes the ultrasonic sound beam in the Near Field (Fresnel Zone)?',
      optionsAr: [
        'تكون شدة الضغط الصوتي منتظمة ومستقرة تماماً وتتناسب مع المسافة',
        'تحدث تداخلات هدامة وبناءة معقدة تسبب تذبذب شدة الضغط الصوتي، مما يجعل قياس حجم العيوب في هذه المنطقة غير دقيق',
        'يتشتت الصوت بالكامل وتتوقف النبضة',
        'تتحول الموجة الطولية مباشرة إلى موجة كهرومغناطيسية'
      ],
      optionsEn: [
        'Sound pressure is completely uniform and smoothly attenuated',
        'Complex constructive/destructive wave interferences cause extreme pressure fluctuations, making flaw sizing unreliable',
        'The sound beam completely disperses and stops',
        'The acoustic wave instantly turns into electromagnetic radiation'
      ],
      correctIndex: 1,
      explanationAr: 'في الحقل القريب (Fresnel Zone)، تتداخل الموجات المنبعثة من نقاط البلورة المختلفة بناءً وهدماً، مما ينتج قمم وقيعان في الضغط الصوتي. لذلك، لا يمكن تقييم حجم العيوب ومقارنتها بدقة إلا في منطقة الحقل البعيد (Far Field / Fraunhofer Zone).',
      explanationEn: 'In the near field (Fresnel zone), sound wavelets from crystal facets interfere constructively and destructively, causing severe pressure fluctuations that prevent accurate flaw evaluation until reaching the far field.'
    },
    {
      id: 'q-ut-2',
      questionAr: 'ما هو منحنى تصحيح السعة مع المسافة (Distance Amplitude Correction - DAC) في جهاز الـ UT؟',
      questionEn: 'What is a Distance Amplitude Correction (DAC) curve in ultrasonic testing?',
      optionsAr: [
        'منحنى يحدد سرعة الصوت في الهواء',
        'منحنى مرسوم على شاشة الجهاز يربط بين سعة الصدى من عاكسات متساوية الحجم على أعماق مختلفة لتعويض التوهين والتباعد الصوتي',
        'منحنى يوضح شحن بطارية الجهاز',
        'منحنى لقياس حرارة السطح'
      ],
      optionsEn: [
        'A curve measuring sound speed in atmospheric air',
        'A plotted curve connecting echo amplitudes from equal-sized reflectors at various depths to compensate for acoustic attenuation and beam spread',
        'A battery charge monitoring curve',
        'A surface temperature measurement curve'
      ],
      correctIndex: 1,
      explanationAr: 'منحنى DAC يُرسم باستخدام بلوك معايرة يحتوي على ثقوب جانبية (Side-Drilled Holes) على أعماق مختلفة؛ حيث يقوم بربط قمم الإشارات ليمثل خط مرجعي لتقييم العيوب بصرف النظر عن عمقها لتعويض الفقد بالمسافة والتشتت.',
      explanationEn: 'A DAC curve connects peak responses from identical reflectors (e.g. side-drilled holes) located at varying material depths, providing an evaluation threshold that compensates for beam spread and material attenuation.'
    }
  ],
  'method-rt-comprehensive': [
    {
      id: 'q-rt-1',
      questionAr: 'ما هو مؤشر جودة الصورة (IQI / Penetrameter) وما الغرض منه في التصوير الإشعاعي الصناعي؟',
      questionEn: 'What is an Image Quality Indicator (IQI / Penetrameter) and its purpose in radiographic testing?',
      optionsAr: [
        'أداة لحساب سماكة الفيلم الحساس',
        'أداة معيارية (سلكية أو ذات ثقوب) توضع على القطعة للتأكد من حساسية الفحص ووضوح الصورة والقدرة على كشف العيوب المطلوبة طبقاً للكود',
        'جهاز قياس نسبة الرطوبة داخل غرفة التحميض',
        'درع لحماية الفيلم من الضوء'
      ],
      optionsEn: [
        'A tool measuring radiographic film emulsion thickness',
        'A standardized wire or hole gauge placed on the part to verify radiographic sensitivity, contrast, and resolution per code',
        'A darkroom hygrometer',
        'A shield protecting film against room light'
      ],
      correctIndex: 1,
      explanationAr: 'مؤشر IQI (سواء كان من النوع السلكي Wire-type طبقاً لـ ISO/ASTM أو من نوع الثقوب Hole-type طبقاً لـ ASME) يوضع على جانب المصدر للقطعة لإثبات أن الفيلم حقق مستوى الحساسية والتباين المطلوب (مثل حساسية 2% لرؤية سلك معين).',
      explanationEn: 'An IQI (wire or plaque hole type under ASME/ASTM/ISO) verifies image sensitivity, contrast, and sharpness, proving that the radiograph can resolve specified flaw thicknesses.'
    },
    {
      id: 'q-rt-2',
      questionAr: 'ما هو النطاق المقبول لكثافة الفيلم الإشعاعي (Transmitted Density) في التصوير بأشعة X وأشعة جاما حسب ASME Section V Article 2؟',
      questionEn: 'What is the acceptable film optical density range for X-ray and Gamma radiography per ASME Section V Article 2?',
      optionsAr: [
        '0.5 إلى 1.0 H&D',
        'من 1.8 إلى 4.0 للأشعة السينية (X-Ray)، ومن 2.0 إلى 4.0 لأشعة جاما (Gamma Ray)',
        'أعلى من 6.0 دائماً',
        'أي كثافة طالما الفيلم رمادي اللون'
      ],
      optionsEn: [
        '0.5 to 1.0 H&D',
        '1.8 to 4.0 for X-radiographs, and 2.0 to 4.0 for Gamma radiographs',
        'Always higher than 6.0 H&D',
        'Any density provided the film looks grayish'
      ],
      correctIndex: 1,
      explanationAr: 'كود ASME Section V Article 2 ينص على أن كثافة الفيلم المنقولة المقاسة بجهاز الدنسيتوميتر (Densitometer) يجب أن تكون بين 1.8 و4.0 لصور الأشعة السينية، وبين 2.0 و4.0 لصور أشعة جاما عند المشاهدة بفيور إشعاعي مرخص.',
      explanationEn: 'ASME Sec V Art 2 mandates optical density between 1.8 and 4.0 for X-ray radiographs, and between 2.0 and 4.0 for gamma ray radiographs, measured using a verified densitometer.'
    }
  ],
  'method-et-comprehensive': [
    {
      id: 'q-et-1',
      questionAr: 'كيف يؤثر عمق العيب على إشارة التيارات الدوامية في مستوى الممانعة المركبة (Impedance Plane)؟',
      questionEn: 'How does flaw depth affect the eddy current signal display on an impedance plane?',
      optionsAr: [
        'لا يتغير طور الإشارة وإنما تتغير فقط سعتها',
        'ينتج عن اختلاف العمق إزاحة في زاوية الطور (Phase Angle Lag)، مما يتيح التمييز الدقيق بين العيوب السطحية والداخلية وقياس عمق الشق',
        'التيارات الدوامية لا تستطيع كشف العيوب السطحية إطلاقاً',
        'تختفي نقطة الاتزان تماماً من الشاشة'
      ],
      optionsEn: [
        'Signal phase angle stays constant, altering only voltage amplitude',
        'Different depths induce a phase angle lag, allowing discrimination between outer surface, inner surface, and subsurface flaws',
        'Eddy currents cannot detect surface flaws',
        'The balance point permanently disappears from the screen'
      ],
      correctIndex: 1,
      explanationAr: 'مع تعمق التيارات الدوامية داخل المعدن، يتأخر طورها الزمني (Phase Lag). هذا التغير في زاوية الطور على مستوى الممانعة هو الأساس الذي يُمكّن مفتش التيارات الدوامية من تحديد عمق العيب بدقة ميكرونية والتمييز بين عيوب السطح الخارجي والداخلي.',
      explanationEn: 'As eddy currents diffuse deeper into conductive material, they experience a phase lag. This phase angle shift on the complex impedance plane enables precise flaw depth estimation and ID vs OD defect discrimination.'
    }
  ],
  'rad-safety-alara-protection': [
    {
      id: 'q-radsafe-1',
      questionAr: 'ما هي الركائز الأساسية الثلاث للحماية من الإشعاع وتقليل الجرعة الإشعاعية التراكمية في مبدأ ALARA؟',
      questionEn: 'What are the three cardinal principles of radiation protection to minimize exposure under ALARA?',
      optionsAr: [
        'الضغط، والحرارة، والكثافة',
        'الوقت (Time)، والمسافة (Distance)، والتدريع (Shielding)',
        'السرعة، والتيار، والمقاومة',
        'التهوية، والتبريد، والإضاءة'
      ],
      optionsEn: [
        'Pressure, Temperature, and Density',
        'Time, Distance, and Shielding',
        'Speed, Current, and Resistance',
        'Ventilation, Cooling, and Illumination'
      ],
      correctIndex: 1,
      explanationAr: 'مبادئ الوقاية الإشعاعية الثلاثة المعترف بها دولياً هي: 1. تقليل وقت التعرض (Time)، 2. زيادة المسافة من المصدر وفق قانون التربيع العكسي (Distance)، 3. وضع حواجز تدريع مناسبة كالرصاص أو الخرسانة (Shielding).',
      explanationEn: 'The three cardinal tenets of ALARA are: 1. Minimizing exposure time, 2. Maximizing distance from source (Inverse Square Law), and 3. Utilizing appropriate shielding materials (lead, tungsten, concrete).'
    }
  ]
};
