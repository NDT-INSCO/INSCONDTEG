export interface BookPage {
  pageNumber: number;
  chapterTitleAr: string;
  chapterTitleEn: string;
  pageTitleAr: string;
  pageTitleEn: string;
  contentAr: string;
  contentEn: string;
  keyPointsAr?: string[];
  keyPointsEn?: string[];
  formula?: {
    latex: string;
    descriptionAr: string;
    descriptionEn: string;
  };
  experimentId?: string; // Links to interactive lab simulator
  quizQuestion?: {
    questionAr: string;
    questionEn: string;
    optionsAr: string[];
    optionsEn: string[];
    correctIndex: number;
    explanationAr: string;
    explanationEn: string;
  };
}

export interface NdtTextbook {
  id: string;
  discipline: 'VT' | 'PT' | 'MT' | 'UT' | 'RT' | 'ET' | 'MATERIALS' | 'INTRO' | 'PAUT_TOFD' | 'WELDING_CODES' | 'AE_LT';
  colorTheme: {
    primary: string;
    gradient: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
  };
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  edition: string;
  authorAr: string;
  authorEn: string;
  totalPages: number;
  estimatedHours: number;
  applicableStandards: string[];
  coverSummaryAr: string;
  coverSummaryEn: string;
  pages: BookPage[];
}

export const NDT_TEXTBOOKS: NdtTextbook[] = [
  // =========================================================================
  // 1. ULTRASONIC TESTING TEXTBOOK (UT)
  // =========================================================================
  {
    id: 'book-ut',
    discipline: 'UT',
    colorTheme: {
      primary: 'text-sky-400',
      gradient: 'from-[#0a1f44] via-[#0d2a5e] to-[#06122b]',
      border: 'border-sky-500/40',
      badgeBg: 'bg-sky-500/20',
      badgeText: 'text-sky-300',
      accent: 'border-sky-400'
    },
    titleAr: 'المرجع الأكاديمي في فحص الموجات فوق الصوتية (UT)',
    titleEn: 'Academic Textbook of Ultrasonic Testing (UT)',
    subtitleAr: 'الفيزياء الصوتية، محولات الطاقة، قانون سنيل، ومنحنيات المعايرة DAC وDGS',
    subtitleEn: 'Wave Acoustics, Transducers, Snell’s Law, and DAC/DGS Calibration',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 10,
    estimatedHours: 8,
    applicableStandards: ['ASME Sec V Art 4', 'ASME Sec VIII Div 1', 'AWS D1.1', 'ISO 17640', 'API 1104'],
    coverSummaryAr: 'دراسة هندسية متكاملة لفيزياء الموجات فوق الصوتية، ميكانيكا الموجات الطولية وموجات القص، تصميم محولات الطاقة الكهروضغطية، الفحص بالزاوية لوصلات اللحام، وتوليد شاشات A-Scan وB-Scan وC-Scan.',
    coverSummaryEn: 'Comprehensive engineering coverage of acoustic wave physics, shear and longitudinal modes, piezoelectric transducer design, angle beam weld testing, and A/B/C-Scan analysis.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: فيزياء الموجات فوق الصوتية',
        chapterTitleEn: 'Chapter 1: Acoustic Wave Physics',
        pageTitleAr: 'ميكانيكا انتشار الموجات وسرعة الصوت في المواد',
        pageTitleEn: 'Wave Propagation Mechanics & Acoustic Velocity',
        contentAr: `الموجات فوق الصوتية هي موجات ميكانيكية ذات ترددات تتجاوز حد السمع البشري (أعلى من 20 كيلوهرتز)، ويتراوح نطاق الفحص الصناعي المعتمد عادة بين 0.5 إلى 15 ميجاهرتز.
تنتشر الموجات في الأوساط الصلبة والسائلة والغازية عبر اهتزاز جسيمات المادة حول مواضع اتزانها دون انتقال دائم للمادة.
توجد أنماط رئيسية لانتشار الموجات:
1. الموجات الطولية (Longitudinal / Compression Waves): تهتز جزيئات الوسط في نفس اتجاه انتشار الموجة، وتنتشر في جميع حالات المادة (الصلبة والسائلة والغازية)، وتتميز بأعلى سرعة (حوالي 5920 m/s في الفولاذ الكربوني).
2. موجات القص المستعرضة (Transverse / Shear Waves): تهتز الجزيئات عمودياً على اتجاه الانتشار، وتنتشر في الأجسام الصلبة فقط لأن السوائل والغازات لا تتحمل قوى القص، وسرعتها تقارب نصف سرعة الموجة الطولية (حوالي 3240 m/s في الفولاذ).
3. موجات ريليه السطحية (Surface / Rayleigh Waves): تنتشر على سطح المادة الصلبة بعمق يعادل طولاً موجياً واحداً تقريباً وسرعتها نحو 90% من سرعة موجة القص.`,
        contentEn: `Ultrasonic testing utilizes mechanical vibrations above the human audible limit (>20 kHz), with industrial NDT typically operating between 0.5 MHz and 15 MHz.
Key wave modes include:
1. Longitudinal (Compression) Waves: Particle displacement occurs parallel to wave propagation direction. These propagate through solids, liquids, and gases at high velocity (~5920 m/s in carbon steel).
2. Shear (Transverse) Waves: Particle oscillation is perpendicular to propagation direction. Shear waves require shear modulus, existing only in solid materials at roughly half longitudinal velocity (~3240 m/s in steel).
3. Rayleigh Surface Waves: Confined within an elliptical orbit to a depth of roughly one wavelength along surfaces.`,
        keyPointsAr: [
          'التردد القياسي للفحص الهندسي: من 2 إلى 5 ميجاهرتز لمعظم تطبيقات الفولاذ.',
          'العلاقة الحاكمة بين السرعة والتردد والطول الموجي: V = f × λ.',
          'الحد الأدنى لحجم العيب القابل للكشف صوتياً هو نصف الطول الموجي (λ/2).'
        ],
        keyPointsEn: [
          'Standard testing frequency: 2 MHz to 5 MHz for standard structural steels.',
          'Governing wave equation: V = f * lambda.',
          'Theoretical flaw detectability threshold is approximately half the wavelength (lambda / 2).'
        ],
        formula: {
          latex: '\\lambda = \\frac{V}{f}',
          descriptionAr: 'حساب الطول الموجي λ بدلالة سرعة الصوت V وتردد المحول f',
          descriptionEn: 'Acoustic wavelength lambda calculation from velocity V and frequency f'
        }
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الأول: فيزياء الموجات فوق الصوتية',
        chapterTitleEn: 'Chapter 1: Acoustic Wave Physics',
        pageTitleAr: 'المقاومة الصوتية النوعية ومعاملات الانعكاس والانكسار',
        pageTitleEn: 'Acoustic Impedance & Boundary Reflection Coefficients',
        contentAr: `المقاومة الصوتية النوعية (Acoustic Impedance - Z) هي مقياس ممانعة جزيئات المادة لمرور الموجات الصوتية، وتساوي حاصل ضرب كثافة المادة (ρ) في سرعة الصوت فيها (V): Z = ρ × V.
عندما تصطدم الموجة بالحد الفاصل بين مادتين مختلفتين في المقاومة الصوتية، ينعكس جزء من الطاقة الصوتية ويعبر الجزء الآخر.
إذا كان الفرق في المقاومة الصوتية كبيراً جداً (مثل الحد الفاصل بين الفولاذ والهواء داخل شرخ)، ينعكس ما يقرب من 99.9% من طاقة الصوت، وهذا هو الأساس الفيزيائي لكشف الشروخ والعيوب بالموجات فوق الصوتية.
ولهذا السبب أيضاً نستخدم سائل التلامس (Couplant) كالزيت أو الجل المائي بين المحول وقطعة الاختبار لإزاحة الهواء المحبوس والسماح للصوت بالعبور.`,
        contentEn: `Acoustic Impedance (Z) measures a medium’s resistance to acoustic transmission: Z = density (rho) * velocity (V).
When sound encounters a boundary between media of differing impedances, energy splits into reflected and transmitted portions.
At a steel-air interface (such as a crack cavity), the acoustic mismatch causes virtually 99.9% reflection back to the transducer—the physical basis of flaw detection.
Couplant gel is mandatory to displace trapped air between probe and workpiece.`,
        keyPointsAr: [
          'المقاومة الصوتية للفولاذ الكربوني: حوالي 45.4 × 10⁶ kg/(m²·s).',
          'المقاومة الصوتية للهواء: حوالي 400 kg/(m²·s) فقط، مما يسبب انعكاساً شبه تام.',
          'وظيفة سائل التلامس هي المطابقة الصوتية وطرد الهواء لمنع الفقد الكامل للطاقة.'
        ],
        keyPointsEn: [
          'Carbon steel acoustic impedance: ~45.4 MRayls.',
          'Air acoustic impedance: only ~0.0004 MRayls, causing near-total reflection.',
          'Couplant gel eliminates air gaps to permit acoustic energy transmission.'
        ],
        formula: {
          latex: 'R = \\left(\\frac{Z_2 - Z_1}{Z_2 + Z_1}\\right)^2, \\quad T = \\frac{4 Z_1 Z_2}{(Z_1 + Z_2)^2}',
          descriptionAr: 'معامل الانعكاس الطاقي R ومعامل النفاذ T بين وسطين صوتيين',
          descriptionEn: 'Acoustic power reflection coefficient R and transmission coefficient T'
        }
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثاني: انكسار الصوت والفحص بزاوية',
        chapterTitleEn: 'Chapter 2: Angle Beam & Snell’s Law',
        pageTitleAr: 'قانون سنيل والزوايا الحرجة في فحص وصلات اللحام',
        pageTitleEn: 'Snell’s Law & Critical Angles in Weld Testing',
        contentAr: `في فحص وصلات اللحام، تُستخدم مجسات الزاوية (Angle Probes) حيث يتم تثبيت البلورة على إسفين من البلكسيجلاس (Perspex Wedge) بزاوية ميل معينة.
عند انتقال الموجة الطولية من الإسفين (سرعة الصوت فيه 2700 m/s) إلى الفولاذ (سرعة موجة القص فيه 3240 m/s)، تنكسر الموجة طبقاً لقانون سنيل.
- الزاوية الحرجة الأولى (First Critical Angle ≈ 27.5°): عندها تنكسر الموجة الطولية بزاوية 90° وتتلاشى، ويتبقى في الفولاذ موجات القص فقط.
- الزاوية الحرجة الثانية (Second Critical Angle ≈ 57.5°): عندها تنكسر موجة القص بزاوية 90° وتتحول لموجة ريليه سطحية.
لذلك، يتم اختيار زوايا إسفين الفحص لوصلات اللحام بين الزاويتين الحرجتين (بين 28° و56°) لتوليد موجات قص نقية في الفولاذ بزوايا انكسار شائعة: 45° و60° و70°.`,
        contentEn: `Angle beam inspection mounts piezoelectric elements on Lucite wedges to introduce refracted sound at designated angles.
Snell’s Law governs acoustic refraction across the wedge-steel boundary.
- First Critical Angle (~27.5° incident): Refracted longitudinal wave reaches 90° and vanishes, leaving pure shear waves.
- Second Critical Angle (~57.5° incident): Shear wave reaches 90° and transforms into surface waves.
Selecting incident angles between 28° and 56° yields pure refracted shear waves in steel at industry-standard angles: 45°, 60°, and 70°.`,
        keyPointsAr: [
          'الزوايا القياسية المعتمدة لفحص اللحام: 45° للشروخ العميقة، 60° لمنتصف الجدار، 70° لعيوب الجذر.',
          'العمل بموجات القص النقية يمنع حدوث أصداء طفيلية مضللة (Spurious Signals) ناتجة عن التداخل بين موجات طولية ومستعرضة.'
        ],
        keyPointsEn: [
          'Standard weld inspection angles: 45° for thick/deep flaws, 60° for mid-wall, 70° for root/fusion flaws.',
          'Operating in the pure shear window eliminates confusing multi-mode echo clutter.'
        ],
        formula: {
          latex: '\\frac{\\sin \\theta_1}{V_1} = \\frac{\\sin \\theta_2}{V_2}',
          descriptionAr: 'قانون سنيل للانكسار الصوتي لحساب زاوية انكسار الصوت في الفولاذ',
          descriptionEn: 'Snell’s Law for acoustic refraction between wedge and test piece'
        }
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الثالث: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 3: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل محاكاة قانون سنيل ومسار الشعاع الصوتي في الفولاذ',
        pageTitleEn: 'Snell’s Law & Sound Beam Refraction Virtual Lab',
        contentAr: `قم بتشغيل المعمل التفاعلي أدناه لاختبار سلوك الشعاع الصوتي المنكسر داخل إسفين الفحص وقطعة الفولاذ.
يمكنك تحريك شريط زاوية السقوط داخل الإسفين (Incident Angle) ومشاهدة تغير زاوية انكسار موجة القص وموجة الضغط لحظياً، مع تحديد الزوايا الحرجة الأولى والثانية ومسار ارتداد الصوت من السطح السفلي (Skip Distance / V-Path).`,
        contentEn: `Operate the virtual laboratory below to analyze acoustic refraction and sound path geometry.
Adjust the incident wedge angle slider to watch real-time refracted shear and longitudinal waves, boundary critical transitions, and weld V-path skip reflections.`,
        experimentId: 'exp-ut-snell-beam'
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الرابع: الحقل الصوتي للمحول',
        chapterTitleEn: 'Chapter 4: Transducer Beam Profile',
        pageTitleAr: 'منطقة الحقل القريب (Near Field) والتباعد الصوتي (Beam Divergence)',
        pageTitleEn: 'Near Field Fresnel Zone & Far Field Beam Divergence',
        contentAr: `ينقسم الشعاع الصوتي الصادر من محول الموجات فوق الصوتية إلى منطقتين رئيسيتين:
1. الحقل القريب (Near Field / Fresnel Zone):
المنطقة الملاصقة مباشرة لوجه البلورة. تحدث فيها تداخلات بناءة وهدامة ناتجة عن وصول موجات من حواف البلورة ومركزها بأطوار مختلفة، مما يسبب تذبذباً حاداً في الضغط الصوتي.
تحذير هندسي: لا يجوز تقييم حجم العيوب ومقارنتها بسعة الصدى داخل منطقة الحقل القريب لعدم استقرار الضغط الصوتي.
2. الحقل البعيد (Far Field / Fraunhofer Zone):
المنطقة التي تبدأ بعد نهاية الحقل القريب، حيث يتلاشى التداخل ويصبح انخفاض الضغط الصوتي منتظماً ويتناسب عكسياً مع المسافة، مع حدوث انفراج وتباعد جانبي لشعاع الصوت (Beam Divergence).`,
        contentEn: `An ultrasonic transducer beam exhibits two distinct axial zones:
1. Near Field (Fresnel Zone):
Directly adjacent to the crystal face. Constructive and destructive interference produces intense pressure oscillations.
Engineering Warning: Flaw sizing via amplitude is invalid within the near field due to pressure instability.
2. Far Field (Fraunhofer Zone):
Extends beyond the near field. Sound pressure attenuates predictably and smoothly with distance, accompanied by lateral beam spread.`,
        keyPointsAr: [
          'طول الحقل القريب N يتناسب طردياً مع مربع قطر المحول (D²) وتردد الفحص (f).',
          'تقييم حجم العيوب باستخدام منحنيات DAC وDGS يتم حصراً في الحقل البعيد.'
        ],
        keyPointsEn: [
          'Near field length N is proportional to probe diameter squared and frequency.',
          'Accurate flaw sizing via DAC/DGS must be conducted within the far field.'
        ],
        formula: {
          latex: 'N = \\frac{D^2 \\cdot f}{4 V} = \\frac{D^2}{4 \\lambda}, \\quad \\sin \\gamma = 1.22 \\frac{\\lambda}{D}',
          descriptionAr: 'حساب طول الحقل القريب N وزاوية تباعد الحزمة الصوتية γ',
          descriptionEn: 'Near field length N and half-angle beam divergence gamma'
        }
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل الخامس: المعايرة ومنحنيات الحساسية',
        chapterTitleEn: 'Chapter 5: Calibration & DAC / DGS',
        pageTitleAr: 'منحنى تصحيح السعة مع المسافة (DAC) وتقنية DGS / AVG',
        pageTitleEn: 'Distance Amplitude Correction (DAC) & DGS / AVG Sizing',
        contentAr: `عندما يبتعد العيب عن المحول، تقل سعة الصدى المنعكس منه طبيعياً بسبب التباعد الهندسي والتوهين الداخلي للخامة، حتى لو كان العيب بنفس الحجم.
لتعويض هذا الفقد، يفرض كود ASME Sec V Art 4 إنشاء منحنى تصحيح السعة مع المسافة (Distance Amplitude Correction - DAC):
- يتم إعداد بلوك معايرة قياسي (Basic Calibration Block) بنفس سماكة ومعدن القطعة المفحوصة ويحتوي على ثقوب حفر جانبي (Side-Drilled Holes - SDH) على أعماق ¼ و½ و¾ السماكة.
- يتم تسجيل قمم الصدى وضبط أعلى قمة عند 80% من ارتفاع الشاشة (FSH).
- يتم رسم المنحنى الرابط بين القمم (100% DAC) ومنحنيات التقييم المرافقة (50% DAC للرصد و20% DAC لتقييم الخلفية).
تقنية DGS / AVG (مخطط المسافة والكسب والحجم): تتيح مقارنة صدى العيب بعاكسات قرصية افتراضية مسطحة القاع (FBH) مدمجة في برمجية الجهاز دون الحاجة لبلوكات متعددة.`,
        contentEn: `Echo amplitude diminishes naturally with depth due to beam divergence and material attenuation, even for identical flaw areas.
ASME Section V Article 4 mandates a Distance Amplitude Correction (DAC) curve:
- Calibrated using a matching block containing Side-Drilled Holes (SDH) at 1/4T, 1/2T, and 3/4T depths.
- Highest indication is set to 80% Full Screen Height (FSH).
- Connecting the peaks produces the 100% DAC primary reference line, along with 50% DAC recording thresholds.
DGS / AVG systems compare echoes against theoretical flat-bottom hole (FBH) disk reflectors directly in instrument software.`,
        keyPointsAr: [
          'منحنى 100% DAC هو الخط المرجعي للرفض والقبول.',
          'أي دلالة تتجاوز 100% DAC وتملك امتداداً طولياً تُعتبر غير مقبولة طبقاً لـ ASME Sec VIII.',
          'الدلالات التي تتجاوز 50% DAC يجب فحصها وتحديد موقعها وطبيعتها.'
        ],
        keyPointsEn: [
          'The 100% DAC curve establishes primary code evaluation threshold.',
          'Indications exceeding 100% DAC with measurable length are rejectable under ASME Sec VIII.',
          'Signals exceeding 50% DAC require characterization and sizing.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السادس: إجراءات فحص وصلات اللحام',
        chapterTitleEn: 'Chapter 6: Weld Inspection Procedures',
        pageTitleAr: 'المسح العرضي والمتقاطع لحزام اللحام وتحديد أبعاد العيوب',
        pageTitleEn: 'Raster Scanning & Flaw Sizing Technique (6 dB Drop)',
        contentAr: `تتطلب عملية فحص وصلات اللحام بالموجات فوق الصوتية إجراءات محددة وصارمة:
1. فحص المعدن الأساسي (Base Metal Laminar Scan): بمحول طولي مستقيم 0° على جانبي اللحام للتأكد من خلو الصفيحة من الانفصالات الصفائحية (Laminations) التي قد تعترض شعاع الزاوية.
2. المسح العرضي لحزام اللحام (Raster Scanning): تحريك محول الزاوية ذهاباً وإياباً بزاوية 90° مع محور اللحام مع تداخل لا يقل عن 10% إلى 20% بين كل شوط.
3. الحركة الاهتزازية الزاوية (Swiveling): تدوير المحول بزاوية ±10° إلى ±15° أثناء الحركة لرصد العيوب ذات الأوجه المائلة كنقص الانصهار الجانبي (Lack of Side Fusion).
4. تحديد الطول بتقنية هبوط 6 ديسيبل (6 dB Drop Method): تحريك المحول بموازاة اللحام حتى تهبط سعة إشارة العيب إلى نصف قيمتها القصوى (انخفاض 6 dB) لتحديد نقطة بداية العيب ونهايته.`,
        contentEn: `Weld inspection protocol mandates:
1. Base Metal Lamination Scan: Straight beam 0° scan along the scan path to verify absence of laminar tearing.
2. Raster Scanning: Continuous back-and-forth angle beam motion across the weld seam with at least 10-20% element overlap.
3. Swivel Oscillation: Rotating probe +/-10° to 15° to capture misaligned planar flaws like lack of sidewall fusion.
4. Flaw Length Sizing (6 dB Drop): Traversing parallel to the weld until peak amplitude drops by 50% (-6 dB), marking exact flaw extremities.`,
        keyPointsAr: [
          'يجب معايرة سرعة الصوت والمدى الزمني على بلوك IIW V1 أو V2 قبل بدء الفحص.',
          'يجب إعادة المعايرة كل 4 ساعات أو عند تغيير المشغل أو الشك في الكابل أو المحول.'
        ],
        keyPointsEn: [
          'Range and velocity calibration must be executed on an IIW V1 or V2 reference block.',
          'Calibration verification is mandatory every 4 hours or upon probe/cable exchange.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل السابع: معايير القبول والرفض',
        chapterTitleEn: 'Chapter 7: Acceptance & Rejection Codes',
        pageTitleAr: 'حدود الرفض المعيارية طبقاً لـ ASME وAWS وAPI',
        pageTitleEn: 'Code Acceptance Criteria: ASME Sec VIII, AWS D1.1, API 1104',
        contentAr: `تنص الكودات العالمية على حدود حاسمة لرفض العيوب في فحص الموجات فوق الصوتية:
- كود ASME Section VIII Div 1 (App. 12) وASME B31.3:
  * تُرفض جميع الشقوق (Cracks) ونقص الانصهار (Lack of Fusion) ونقص التغلغل (Lack of Penetration) مهما كان طولها.
  * أي دلالة خطية تتجاوز سعتها خط المرجع (100% DAC) يزيد طولها عن:
    - 6 ملم (1/4 بوصة) للسماكات حتى 19 ملم (3/4 بوصة).
    - ثلث السماكة (t/3) للسماكات من 19 ملم حتى 57 ملم.
    - 19 ملم للسماكات الأكبر من 57 ملم.
- كود AWS D1.1 (الهياكل الإنشائية الصلبة):
  * تصنيف الدلالات إلى أربع فئات (Class A, B, C, D) بالاعتماد على معامل التقييم العشري (d = a - b - c). فئة Class A مرفوضة دائماً بصرف النظر عن الطول.`,
        contentEn: `Code thresholds for ultrasonic testing:
- ASME Sec VIII Div 1 & B31.3:
  * Cracks, lack of fusion, and incomplete penetration are unconditionally rejected.
  * Linear indications exceeding reference level (100% DAC) are rejected if length exceeds:
    - 6 mm (1/4 in) for t <= 19 mm.
    - t/3 for 19 mm < t <= 57 mm.
    - 19 mm (3/4 in) for t > 57 mm.
- AWS D1.1 Structural Steel:
  * Categorizes indications into Class A, B, C, D based on decibel rating d = a - b - c. Class A is unconditionally rejected.`,
        keyPointsAr: [
          'العيوب المستوية (Planar Defects) كالشقوق ونقص الانصهار هي الأخطر في ميكانيكا الكسر.',
          'التقييم يعتمد على عاملين: سعة الصدى المعاكسة (Amplitude) والامتداد الطولي المقاس (Length).'
        ],
        keyPointsEn: [
          'Planar defects (cracks, LOF) exhibit highest stress intensity factors.',
          'Rejection combines echo amplitude severity with physical flaw length.'
        ]
      },
      {
        pageNumber: 9,
        chapterTitleAr: 'الفصل الثامن: أفضل الممارسات الميدانية',
        chapterTitleEn: 'Chapter 8: Field Best Practices',
        pageTitleAr: 'إرشادات خبراء إنسكو للسلامة والدقة في الفحص بالموجات',
        pageTitleEn: 'INSCO Engineering Best Practices for UT Accuracy',
        contentAr: `إرشادات خبراء التفتيش المعتمدة لدى إنسكو لضمان أقصى دقة وجودة:
1. نظافة وخشونة السطح: يجب تنظيف سطح المسح من الصدأ والخبث المتطاير والدهان المفكك حتى الوصول للسطح المعدني اللامع (Ra <= 6.3 µm) لتجنب توهين شعاع الصوت أو تشتته.
2. قياس السماكة الفعلية: لا تعتمد أبداً على السماكة الاسمية في المخططات؛ قِس السماكة الفعلية للقطعة في عدة نقاط قبل ضبط زوايا الارتداد (V-Path) على الجهاز.
3. تعويض فقد النقل (Transfer Correction): قارن سعة صدى القاع بين بلوك المعايرة والقطعة الفعلية؛ وأضف فرق الديسيبل كتعويض للنقل (Transfer Loss dB).
4. توثيق درجة الحرارة: سرعة الصوت في الفولاذ تتغير بمقدار نحو 1% لكل 55 درجة مئوية؛ تأكد من معايرة الجهاز عند نفس درجة حرارة التشغيل للقطعة المفحوصة.`,
        contentEn: `INSCO certified expert field guidelines:
1. Surface Preparation: Clean scan areas of loose scale, spatter, and flaking paint down to bare metal (Ra <= 6.3 µm) to avoid severe acoustic scatter.
2. Actual Thickness Verification: Never rely blindly on nominal design drawings; measure actual wall thickness at scan bounds before setting V-path skips.
3. Transfer Correction: Compare backwall echo between calibration block and component; apply dB transfer loss offset.
4. Temperature Compensation: Acoustic velocity shifts ~1% per 55°C. Calibrate blocks at operational part temperatures.`,
        keyPointsAr: [
          'تطبيق تعويض النقل (Transfer Correction) إلزامي طبقاً للمواصفة القياسية.',
          'التأكد من مطابقة سائل التلامس لبيئة الفحص (عدم استخدام مواد قابلة للاشتعال في الخطوط الساخنة).'
        ],
        keyPointsEn: [
          'Transfer correction is mandatory for accurate dB amplitude evaluation.',
          'Ensure couplant chemistry suits component temperature and metallurgy.'
        ]
      },
      {
        pageNumber: 10,
        chapterTitleAr: 'الفصل التاسع: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 9: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فحص الموجات فوق الصوتية',
        pageTitleEn: 'Ultrasonic Testing Comprehensive Review Exam',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه والاطلاع على التفسير المعتمد.`,
        contentEn: `Verify your mastery of ultrasonic engineering principles with this standardized review question and accredited explanation.`,
        quizQuestion: {
          questionAr: 'إذا كان تردد المحول 4 MHz وسرعة موجات القص في الفولاذ 3240 m/s، فما هو الطول الموجي λ وما هو أصغر عيب يمكن كشفه نظرياً؟',
          questionEn: 'If probe frequency is 4 MHz and shear velocity in steel is 3240 m/s, what is wavelength lambda and the smallest theoretically detectable flaw?',
          optionsAr: [
            'الطول الموجي 0.81 ملم، وأصغر عيب حوالي 0.40 ملم (نصف الطول الموجي)',
            'الطول الموجي 2.5 ملم، وأصغر عيب 2.5 ملم',
            'الطول الموجي 0.1 ملم، وأصغر عيب 1 ملم',
            'الطول الموجي 1.62 ملم، وأصغر عيب 3.24 ملم'
          ],
          optionsEn: [
            'Wavelength is 0.81 mm, smallest detectable flaw is ~0.40 mm (lambda / 2)',
            'Wavelength is 2.5 mm, smallest detectable flaw is 2.5 mm',
            'Wavelength is 0.1 mm, smallest detectable flaw is 1 mm',
            'Wavelength is 1.62 mm, smallest detectable flaw is 3.24 mm'
          ],
          correctIndex: 0,
          explanationAr: 'طبقاً للقانون: λ = V / f = 3240 / 4,000,000 = 0.00081 m = 0.81 mm. والقاعدة الفيزيائية الأساسية تنص على أن أصغر عيب يمكن كشفه صوتياً يعادل نصف الطول الموجي (λ/2) = 0.81 / 2 ≈ 0.40 mm.',
          explanationEn: 'By formula: lambda = V / f = 3240 / 4,000,000 = 0.81 mm. The physical detection limit is lambda / 2 = 0.81 / 2 ≈ 0.40 mm.'
        }
      }
    ]
  },

  // =========================================================================
  // 2. LIQUID PENETRANT TESTING TEXTBOOK (PT)
  // =========================================================================
  {
    id: 'book-pt',
    discipline: 'PT',
    colorTheme: {
      primary: 'text-rose-400',
      gradient: 'from-[#380e1c] via-[#521327] to-[#200810]',
      border: 'border-rose-500/40',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-300',
      accent: 'border-rose-400'
    },
    titleAr: 'المرجع الأكاديمي في فحص السوائل النافذة (PT)',
    titleEn: 'Academic Textbook of Liquid Penetrant Testing (PT)',
    subtitleAr: 'الخاصية الشعرية، تصنيف AMS 2644، خطوات المعالجة الستة، وتفسير الدلالات',
    subtitleEn: 'Capillary Action, AMS 2644 Classification, 6-Step Processing, and Evaluation',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 6,
    applicableStandards: ['ASME Sec V Art 6', 'ASTM E165', 'AMS 2644', 'ISO 3452', 'AWS D1.1'],
    coverSummaryAr: 'مرجع كامل لفيزياء التوتر السطحي والخاصية الشعرية، تصنيف عائلات السوائل النافذة، التحكم في زمن المكوث (Dwell Time)، إجراءات الغسيل وإزالة الفائض، وتطبيق المظهر (Developer).',
    coverSummaryEn: 'Comprehensive guide covering surface tension physics, capillary wetting, AMS 2644 penetrant families, dwell time control, excess removal protocols, and developer mechanics.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: الأساس الفيزيائي للخاصية الشعرية',
        chapterTitleEn: 'Chapter 1: Capillary Action Physics',
        pageTitleAr: 'التوتر السطحي وزاوية التلامس وقانون لابلاس',
        pageTitleEn: 'Surface Tension, Contact Angle & Laplace Equation',
        contentAr: `يعتمد فحص السوائل النافذة (PT) على ظاهرة الخاصية الشعرية (Capillary Action) التي تُمكّن السائل من التغلغل داخل الشقوق السطحية الضيقة والمجهرية المفتوحة على السطح دون الحاجة لأي ضغط خارجي، حتى لو كان التغلغل ضد اتجاه الجاذبية الأرضية.
تحكم هذه العملية ثلاثة عوامل فيزيائية رئيسية:
1. التوتر السطحي (Surface Tension - γ): قوى التماسك بين جزيئات السائل النافذ.
2. زاوية التلامس والترطيب (Contact Angle - θ): الزاوية بين قطرة السائل والسطح المعدني. لكي يحدث ترطيب كامل واختراق شعري تلقائي، يجب أن تكون زاوية التلامس حادة جداً وتقترب من الصفر (θ < 90°، ومثالياً θ ≈ 0°).
3. الضغط الشعري (Capillary Pressure - ΔP): الضغط الذي يدفع السائل للداخل، ويتناسب عكسياً مع عرض فتحة الشق (W)؛ فكلما كان الشق أضيق، كان الضغط الشعري الدافغ للسائل أقوى وأعلى!`,
        contentEn: `Liquid Penetrant Testing (PT) exploits capillary action to draw liquid penetrant into tight, surface-breaking discontinuities without external pressure, even against gravity.
Governed by three primary physical properties:
1. Surface Tension (gamma): Cohesive intermolecular forces within the penetrant.
2. Wetting Contact Angle (theta): Must be acute and near zero (theta ≈ 0°) for spontaneous wetting.
3. Capillary Pressure (delta P): Inversely proportional to crack opening width (W). Extremely tight fissures exert tremendous capillary suction pressure!`,
        keyPointsAr: [
          'يجب أن يكون العيب مفتوحاً تماماً على السطح وخالياً من الزيوت أو الرطوبة أو نواتج الصدأ.',
          'لا يمكن لطريقة PT كشف العيوب الداخلية أو العيوب المغطاة بطبقات طلاء محكمة.'
        ],
        keyPointsEn: [
          'Discontinuities must be open to the clean outer surface, free of oil, moisture, or rust.',
          'PT cannot detect subsurface discontinuities or defects sealed beneath intact paint.'
        ],
        formula: {
          latex: '\\Delta P = \\frac{2 \\gamma \\cos \\theta}{r}',
          descriptionAr: 'معادلة لابلاس للضغط الشعري ΔP المتولد داخل الشق بدلالة نصف القطر r والتوتر السطحي γ وزاوية التلامس θ',
          descriptionEn: 'Young-Laplace equation for capillary pressure in a narrow cylindrical fissure'
        }
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 2: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل محاكاة الخاصية الشعرية وزمن التغلغل في الشقوق المجهرية',
        pageTitleEn: 'Capillary Action & Penetrant Dwell Time Virtual Lab',
        contentAr: `شغّل المعمل التفاعلي أدناه لدراسة ديناميكا تغلغل السائل النافذ داخل شق معدني.
تحكم في عرض الشق (Crack Width) ولزوجة السائل وزاوية التلامس لمشاهدة سرعة الاختراق الشعري وحساب زمن المكوث الأدنى المطلوب لضمان وصول السائل إلى قاع الشق.`,
        contentEn: `Operate the interactive simulator below to analyze penetrant capillary dynamics.
Adjust crack aperture width, penetrant viscosity, and contact angle to visualize infiltration velocity and minimum dwell time.`,
        experimentId: 'exp-pt-capillary-lab'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: التصنيف الدولي AMS 2644',
        chapterTitleEn: 'Chapter 3: AMS 2644 International Classification',
        pageTitleAr: 'عائلات وأنواع السوائل النافذة وطرق الإزالة وأشكال المظهر',
        pageTitleEn: 'Penetrant Types, Methods, Sensitivity Levels & Forms',
        contentAr: `تعتمد الصناعة المعيارية تصنيف المواصفة العسكرية الأمريكية القياسية AMS 2644 / ASTM E165:
1. النوع (Type):
   - Type I: فلوري (Fluorescent) يُفحص تحت الأشعة فوق البنفسجية (UV-A / Black Light) وهو الأعلى حساسية عالمياً.
   - Type II: صبغة مرئية حمراء (Visible Dye) تُفحص تحت الضوء الأبيض المرئي العادي.
2. طريقة إزالة الفائض (Method):
   - Method A: قابل للغسيل بالماء مباشرة (Water Washable).
   - Method B: مستحلب بعدي ذائب في الزيت (Post-Emulsified, Lipophilic).
   - Method C: قابل للإزالة بالمذيب العضوي (Solvent Removable) - الطريقة الأكثر شيوعاً في الفحص الميداني للمواقع.
   - Method D: مستحلب بعدي ذائب في الماء (Post-Emulsified, Hydrophilic).
3. مستويات الحساسية (Sensitivity Levels للنوع الفلوري):
   - Level ½ (حساسية منخفضة جداً)، Level 1 (منخفضة)، Level 2 (متوسطة)، Level 3 (عالية)، Level 4 (فائقة الحساسية لصناعات الطيران والفضاء).
4. أشكال المظهر (Developer Forms):
   - Form a (مسحوق جاف)، Form b (ذائب في الماء)، Form c (معلق في الماء)، Form d (غير مائي Nonaqueous aerosol - الأكثر حساسية في الميدان).`,
        contentEn: `AMS 2644 and ASTM E165 classify penetrant inspection materials into:
1. Type:
   - Type I: Fluorescent (viewed under UV-A black light, highest sensitivity).
   - Type II: Visible Red Dye (viewed under white ambient light).
2. Method (Excess Removal):
   - Method A: Water Washable.
   - Method B: Post-Emulsified, Lipophilic.
   - Method C: Solvent Removable (predominant for portable field piping inspection).
   - Method D: Post-Emulsified, Hydrophilic.
3. Sensitivity Levels (Type I): Level 1/2 to Level 4 (ultra-high for aerospace).
4. Developer Forms: Form a (Dry powder), Form d (Nonaqueous wet spray, highest portable sensitivity).`,
        keyPointsAr: [
          'يُحظر خلط مواد من شركات أو عائلات مختلفة؛ يجب استخدام مجموعة متوافقة (Family Group).',
          'النوع الفلوري Type I Level 4 إلزامي لشفرات توربينات الطيران ومحركات الصواريخ.'
        ],
        keyPointsEn: [
          'Intermixing materials from differing manufacturers or families is strictly prohibited.',
          'Fluorescent Type I Level 4 is mandatory for jet engine turbine blade inspections.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: خطوات المعالجة المعيارية الستة',
        chapterTitleEn: 'Chapter 4: The 6-Step Processing Sequence',
        pageTitleAr: 'دورة الفحص الكاملة من التنظيف الأولي حتى الفحص النهائي',
        pageTitleEn: 'Complete 6-Step Processing Cycle: Clean to Evaluation',
        contentAr: `تتطلب الطريقة اتباع 6 خطوات متسلسلة بدقة تامة:
1. التنظيف والتجفيف الأولي (Pre-cleaning & Drying): إزالة الزيوت والدهانات؛ والانتظار حتى يجف المذيب تماماً (5 دقائق على الأقل).
2. تطبيق السائل النافذ وزمن المكوث (Penetrant Application & Dwell Time): رش أو دهان السائل مع الالتزام بزمن مكوث يتراوح بين 10 إلى 30 دقيقة حسب المعدن ونوع العيب المحتمل.
3. إزالة السائل الفائض (Excess Penetrant Removal): مسح السطح بقطعة قماش جافة أولاً، ثم مسحه بقطعة قماش مبللة برفق بالمذيب (Method C). يُمنع منعاً باتاً رش المذيب مباشرة على السطح!
4. التجفيف (Drying): تجفيف السطح بالهواء الطبيعي دون استخدام هواء مضغوط عالي القوة.
5. تطبيق المظهر (Developer Application): رج العبوة جيداً ورش طبقة بيضاء رقيقة ومتجانسة من مسافة 20 إلى 30 سم.
6. زمن التظهير والتفسير (Developing Time & Interpretation): مراقبة السطح بعد 10 دقائق من وضع المظهر؛ حيث يعمل المظهر كنشافة تسحب السائل النافذ من الشقوق بفعل الخاصية الشعرية العكسية فتنزف الصبغة الحمراء فوق الخلفية البيضاء.`,
        contentEn: `The 6 fundamental steps:
1. Pre-cleaning & Drying: Degreasing and solvent evaporation.
2. Penetrant Application & Dwell Time: Immersion, spray, or brushing with 10-30 min dwell.
3. Excess Penetrant Removal: Wipe with clean dry rag, then with solvent-dampened cloth. Never spray solvent directly!
4. Drying: Clean air drying.
5. Developer Application: Thin, uniform white coat applied from 20-30 cm distance.
6. Developing Time & Evaluation: Observe bleed-out after 10-30 min under reverse capillary action.`,
        keyPointsAr: [
          'الرش المباشر للمذيب على السطح يُفرغ الشقوق من السائل ويُخفي العيوب (False Negative).',
          'طبقة المظهر السميكة جداً تمنع نزف الصبغة وتُخفي الشروخ الدقيقة.'
        ],
        keyPointsEn: [
          'Spraying solvent directly into flaws causes over-washing, washing away indications.',
          'Excessively thick developer blankets flaws, suppressing capillary bleed-out.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: شروط الإضاءة والبيئة',
        chapterTitleEn: 'Chapter 5: Illumination & Environmental Constraints',
        pageTitleAr: 'متطلبات الضوء الأبيض وضوء الأشعة فوق البنفسجية UV-A',
        pageTitleEn: 'White Light & Black Light UV-A Requirements per ASME',
        contentAr: `يحدد كود ASME Sec V Art 6 وASTM E1417 شروط الإضاءة الواجب توفرها:
- في فحص الصبغة المرئية (Type II Visible):
  * الحد الأدنى لشدة الضوء الأبيض على السطح المفحوص هو 100 foot-candles (ما يعادل 1076 Lux).
- في فحص الصبغة الفلورية (Type I Fluorescent):
  * يجب إجراء الفحص في غرفة مظلمة بحيث لا يزيد الضوء المرئي المحيط عن 2 foot-candles (نحو 21.5 Lux).
  * يجب ألا تقل شدة مصباح الأشعة فوق البنفسجية (Black Light / UV-A) عن 1000 µW/cm² عند سطح القطعة بطول موجي اسمي 365 نانومتر.
  * يجب على المفتش البقاء في الظلام لمدة 5 دقائق على الأقل لتكييف العين (Dark Adaptation) قبل بدء التفتيش.`,
        contentEn: `ASME Sec V Article 6 illumination mandates:
- Type II Visible: Minimum 100 foot-candles (1076 lux) on the inspection surface.
- Type I Fluorescent:
  * Darkened booth with ambient visible light not exceeding 2 foot-candles (21.5 lux).
  * UV-A black light intensity >= 1000 micro-watts/cm² at 365 nm peak.
  * Minimum 5-minute dark eye adaptation period before commencing evaluation.`,
        keyPointsAr: [
          'يجب قياس شدة الأشعة فوق البنفسجية بمقياس UVX Radiometer معتمد يومياً.',
          'ارتداء نظارات واقية للأشعة فوق البنفسجية بدون تلوين يمنع توهج مقلة العين (Eyeball Fluorescence).'
        ],
        keyPointsEn: [
          'UV-A intensity must be verified daily with a calibrated digital radiometer.',
          'UV-blocking safety glasses protect eyes from fatigue and corneal clouding.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: تفسير وتقييم الدلالات',
        chapterTitleEn: 'Chapter 6: Interpretation & Flaw Characterization',
        pageTitleAr: 'التمييز بين الدلالات الحقيقية والزائفة واللا صلة لها',
        pageTitleEn: 'Discriminating True, False & Non-Relevant Indications',
        contentAr: `تصنف الدلالات المرصودة أثناء التفتيش إلى ثلاثة أنواع:
1. الدلالات الحقيقية (True Indications): ناتجة عن انقطاعات حقيقية في المعدن (شروخ كلال، مسامية، نقص انصهار).
2. الدلالات الزائفة (False Indications): ناتجة عن سوء تطبيق الفحص أو التلوث (مثل عدم التنظيف الكافي، لمس السطح بأصابع ملوثة بالصبغة، أو تطاير قطرات صبغة بعد وضع المظهر).
3. الدلالات عديمة الصلة (Non-Relevant Indications): ناتجة عن التصميم الهندسي الطبيعي للقطعة كالتداخلات الميكانيكية بالبرشام أو الخوابير أو الخيوط اللولبية.
أشكال الدلالات الحقيقية:
- الدلالة الخطية (Linear Indication): طولها يزيد عن ثلاثة أضعاف عرضها (مثل الشروخ ونقص الانصهار).
- الدلالة الدائرية (Rounded Indication): دائرية أو بيضاوية طولها يساوي أو يقل عن ثلاثة أضعاف عرضها (مثل المسام والجيوب الغازية).`,
        contentEn: `Three indication categories:
1. True Indications: Originate from real discontinuities (fatigue cracks, porosity, lack of fusion).
2. False Indications: Arise from procedural contamination, inadequate wash, or lint transfer.
3. Non-Relevant Indications: Result from intentional mechanical contours (threads, press fits, keyways).
Morphological shapes:
- Linear Indication: Length is greater than 3 times width (cracks, seam, laps).
- Rounded Indication: Circular or elliptical with length <= 3 times width (gas pockets).`,
        keyPointsAr: [
          'في حال الشك في دلالة زائفة، يجب إعادة تنظيف القطعة وفحصها بالكامل.',
          'الدلالات الخطية ذات النزف المستمر تشير إلى شروخ عميقة وحرجة.'
        ],
        keyPointsEn: [
          'Suspected false indications mandate complete re-cleaning and re-processing.',
          'Linear indications with rapid, wide bleed-out reflect deep, critical fissures.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: معايير القبول والرفض',
        chapterTitleEn: 'Chapter 7: Acceptance & Rejection Codes',
        pageTitleAr: 'معايير ASME Sec VIII وAWS D1.1 في قبول دلالات PT',
        pageTitleEn: 'ASME Sec VIII & AWS D1.1 Acceptance Criteria for PT',
        contentAr: `معايير القبول في كود ASME Section VIII Div 1 (Appendix 8):
تُعتبر الدلالة قابلة للتقييم (Relevant) إذا كان أي بعد فيها يتجاوز 1.5 ملم (1/16 بوصة).
تكون الدلالات مرفوضة قطعياً في الحالات الآتية:
1. أي دلالة خطية ذات صلة (Relevant Linear Indication) - الشروخ ونقص الانصهار مرفوضة مهما كان طولها!
2. أي دلالة دائرية ذات صلة يزيد قطرها عن 5 ملم (3/16 بوصة).
3. وجود أربع دلالات دائرية ذات صلة أو أكثر متراصفة على خط واحد ويفصل بين حوافها مسافة تقل عن 1.5 ملم.`,
        contentEn: `ASME Sec VIII Div 1 Mandatory Appendix 8 acceptance limits:
Only indications with major dimension > 1.5 mm (1/16 in) are evaluable as relevant.
The following are unconditionally rejectable:
1. Any relevant linear indication (cracks, laps, lack of fusion of any length!).
2. Any relevant rounded indication with dimension > 5 mm (3/16 in).
3. Four or more relevant rounded indications in a line separated by 1.5 mm or less edge-to-edge.`,
        keyPointsAr: [
          'الرفض الفوري لأي دلالة خطية هو معيار صارم في جميع كودات الأوعية المضغوطة والأنابيب.',
          'يجب قياس أبعاد الدلالة المنزوفة (Bleed-out dimension) وليس حجم الشق الفيزيائي.'
        ],
        keyPointsEn: [
          'Linear indications are unconditionally rejected across pressure vessel and piping codes.',
          'Evaluation dimensions apply to the developer bleed-out mark, not the physical crack width.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فحص السوائل النافذة',
        pageTitleEn: 'Liquid Penetrant Testing Review Examination',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of penetrant testing engineering principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ما هو السبب الهندسي الصارم لمنع رش مذيب التنظيف (Solvent Remover) مباشرة على سطح القطعة أثناء إزالة السائل النافذ في Method C؟',
          questionEn: 'Why is spraying solvent remover directly onto test parts strictly prohibited during excess penetrant removal in Method C?',
          optionsAr: [
            'لأنه يذيب السائل النافذ داخل الشقوق ويغسله للخارج مسبباً دلالات سلبية كاذبة وإخفاء العيوب الخطيرة',
            'لأنه يرفع درجة حرارة القطعة بشكل مفاجئ',
            'لأنه يحول الصبغة المرئية إلى صبغة فلورية',
            'لأنه يجعل السائل النافذ يتجمد في مكانه'
          ],
          optionsEn: [
            'Because solvent dissolves penetrant inside flaws and washes it out, causing false-negatives and masking defects',
            'Because it abruptly spikes part temperature',
            'Because it transforms visible dye into fluorescent dye',
            'Because it instantly freezes the penetrant'
          ],
          correctIndex: 0,
          explanationAr: 'الرش المباشر للمذيب يؤدي لظاهرة الغسيل الزائد (Over-washing) حيث يتسرب المذيب لداخل الشقوق الشعرية ويفرغها من الصبغة، فلا تنزف أي مؤشرات بعد وضع المظهر، مما يعطي انطباعاً مضللاً بخلو القطعة من الشروخ.',
          explanationEn: 'Direct solvent application flushes penetrant out of capillary openings (over-washing), wiping away defect reservoirs and causing catastrophic false-negative inspections.'
        }
      }
    ]
  },

  // =========================================================================
  // 3. MAGNETIC PARTICLE TESTING TEXTBOOK (MT)
  // =========================================================================
  {
    id: 'book-mt',
    discipline: 'MT',
    colorTheme: {
      primary: 'text-amber-400',
      gradient: 'from-[#38260a] via-[#4d340e] to-[#211606]',
      border: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300',
      accent: 'border-amber-400'
    },
    titleAr: 'المرجع الأكاديمي في فحص الجسيمات المغناطيسية (MT)',
    titleEn: 'Academic Textbook of Magnetic Particle Testing (MT)',
    subtitleAr: 'النظرية المغناطيسية، مجالات التسرب، الحواضن، وإزالة المغنطة المتبقية',
    subtitleEn: 'Magnetism, Flux Leakage, Yokes, Coils & Demagnetization',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 6,
    applicableStandards: ['ASME Sec V Art 7', 'ASTM E709', 'ISO 9934', 'AWS D1.1', 'API 1104'],
    coverSummaryAr: 'دراسة هندسية وفيزيائية لحلقة التخلفية المغناطيسية، خطوط التسرب المغناطيسي (Flux Leakage)، مغنطة التيار المتردد والمستمر، حواضن Yokes، وفحص قوة الرفع 10 lb وإزالة المغنطة.',
    coverSummaryEn: 'Engineering handbook covering B-H hysteresis, magnetic flux leakage, AC/DC magnetization modes, electromagnetic yokes, 10 lb dead-weight lift verification, and demagnetization.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: النظرية الكهرومغناطيسية',
        chapterTitleEn: 'Chapter 1: Electromagnetic Theory',
        pageTitleAr: 'النطاقات المغناطيسية ومجالات تسرب الفيض (Flux Leakage)',
        pageTitleEn: 'Magnetic Domains & Magnetic Flux Leakage Mechanics',
        contentAr: `يعتمد فحص الجسيمات المغناطيسية (MT) على الخواص الفيرومغناطيسية للحديد والصلب الكربوني وسبائك النيكل والكوبالت.
في الحالة الطبيعية غير الممغنطة، تتجمع الذرات في نطاقات مغناطيسية مجهرية (Magnetic Domains) متجهة عشوائياً فتلغي مجالاتها بعضها بعضاً.
عند تطبيق مجال مغناطيسي خارجي قوي، تصطف هذه النطاقات في اتجاه واحد موحد لتصبح القطعة ممغنطة بالكامل.
مبدأ كشف العيوب (Flux Leakage):
تسري خطوط الفيض المغناطيسي داخل المعدن الفيرومغناطيسي بسهولة فائقة بسبب نفاذيته المغناطيسية العالية.
عندما يعترض شق أو فجوة مسار خطوط الفيض بزاوية معترضة، ونظراً لأن الهواء أو الغاز داخل الشق يملك نفاذية مغناطيسية منخفضة جداً وممانعة هائلة، تجبر خطوط الفيض على الانحناء والخروج من السطح مشكلة قطبين شمالي وجنوبي موضعيين ومجال تسرب خارجي (Flux Leakage Field).
عند نثر جزيئات أكسيد الحديد المغناطيسية المعلقة، تنجذب فوراً وبقوة إلى قطبي التسرب مكونة خطاً دالاً على موقع الشق وأبعاده بدقة.`,
        contentEn: `MT relies on ferromagnetic material domains aligning with an external magnetic field.
Acoustic flux lines travel unimpeded through high-permeability steel.
When an orthogonal discontinuity intersects the flux path, the high reluctance of the crack cavity forces magnetic flux to breach the surface, forming localized North and South poles and a Magnetic Flux Leakage (MFL) field.
Fine ferromagnetic particles are attracted and held by the leakage field, forming sharp visual indications.`,
        keyPointsAr: [
          'أعلى حساسية لكشف العيب تحدث عندما تكون خطوط الفيض عمودية بزاوية 90° على اتجاه الشق.',
          'إذا كانت خطوط الفيض موازية للشق تماماً، فلن يحدث تسرب للفيض ولن تظهر أي دلالة.'
        ],
        keyPointsEn: [
          'Maximum detection sensitivity occurs when magnetic flux lines intersect flaw orientation at 90°.',
          'Flaws parallel to flux lines generate zero leakage and cannot be detected.'
        ],
        formula: {
          latex: 'B = \\mu \\cdot H, \\quad \\text{Flux Reluctance } \\mathcal{R} = \\frac{l}{\\mu A}',
          descriptionAr: 'كثافة الفيض B بدلالة النفاذية μ والمجال H، وممانعة المسار المغناطيسي R',
          descriptionEn: 'Magnetic flux density B = mu * H, and reluctance R of magnetic circuit'
        }
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 2: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل محاكاة خطوط تسرب الفيض المغناطيسي وحاضنة الـ Yoke',
        pageTitleEn: 'Magnetic Flux Leakage & Yoke Field Virtual Lab',
        contentAr: `شغّل المعمل التفاعلي أدناه لدراسة كيفية انحناء خطوط الفيض المغناطيسي وتجمع الجسيمات المغناطيسية فوق الشقوق.
تحكم في زاوية الشق، ونوع التيار (AC تيار متردد للسطح، أو DC تيار مستمر للأعماق)، وشاهد كيف تنجذب الجسيمات لتشكل مؤشراً واضحاً.`,
        contentEn: `Operate the interactive simulator below to analyze magnetic flux distortion and particle attraction.
Adjust crack angle and current mode (AC for surface vs DC for subsurface) to view flux lines and particle bridge formations.`,
        experimentId: 'exp-mt-flux-leakage'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: أنواع التيارات ومعدات المغنطة',
        chapterTitleEn: 'Chapter 3: Magnetizing Currents & Equipment',
        pageTitleAr: 'التيار المتردد AC والتيار المستمر ومواصفات الحاضنة Yoke',
        pageTitleEn: 'AC vs DC Currents & Electromagnetic Yoke Standards',
        contentAr: `يحدد نوع التيار الكهربائي عمق المغنطة وحساسية الفحص:
1. التيار المتردد (AC - Alternating Current):
   - يولد ظاهرة الظاهرة السطحية (Skin Effect) التي تحصر الفيض في الطبقة السطحية الرقيقة (عمق نحو 1 إلى 2 ملم).
   - يعطي أعلى حساسية للشروخ السطحية الدقيقة، بالإضافة إلى أن تذبذب التيار يمنح الجسيمات حركة تنشيطية (Particle Mobility) تساعدها على التجمع السريع.
   - يتطلب كود ASME Sec V Art 7 أن ترفع حاضنة الـ AC Yoke وزناً حديدياً لا يقل عن 10 أرطال (4.5 كجم) عند مسافة التباعد القصوى المستخدمة بين الساقين.
2. التيار المستمر المقوّم (HWDC / DC):
   - يخترق لأعماق أكبر تحت السطح (حتى نحو 6 ملم) لكشف العيوب تحت السطحية، وتتطلب حاضنة الـ DC رفع ثقل لا يقل عن 40 رطلاً (18.1 كجم).
3. تقنيات المغنطة المزدوجة (Crossed Yoke / Dual Field):
   - لضمان كشف الشروخ في جميع الاتجاهات، يجب مغنطة كل منطقة مرتين في اتجاهين متعامدين (90°)، أو استخدام حاضنة متقاطعة تولد مجالاً دواراً.`,
        contentEn: `Current type determines penetration depth:
1. Alternating Current (AC):
   - Confined by skin effect to the outer ~1-2 mm surface layer.
   - Highest sensitivity for fine fatigue cracks; rapid reversal provides particle mobility.
   - ASME Sec V Art 7 mandates an AC yoke lift capacity >= 10 lbs (4.5 kg) at operational spacing.
2. Direct Current / Half-Wave Rectified (HWDC / DC):
   - Penetrates subsurface (~6 mm). DC yoke dead-weight lifting requirement is 40 lbs (18.1 kg).
3. Orthogonal Coverage: Two sequential magnetizations at roughly 90° angles are mandatory to guarantee multi-directional flaw interception.`,
        keyPointsAr: [
          'يجب فحص قوة رفع الحاضنة (10 lbs) دورياً قبل الاستخدام في كل وردية عمل.',
          'التيار المتردد هو المعيار الذهبي المفضل لشروخ اللحام السطحية.'
        ],
        keyPointsEn: [
          'Yoke dead-weight lift test (10 lb AC) is mandatory at the start of each work shift.',
          'AC current is the global standard for detecting surface weld cracks.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: وسائط الفحص والجسيمات',
        chapterTitleEn: 'Chapter 4: Inspection Media & Particles',
        pageTitleAr: 'الجسيمات الجافة والمعلقة الرطبة والجسيمات الفلورية',
        pageTitleEn: 'Dry Powders, Wet Suspensions & Fluorescent Media',
        contentAr: `تنقسم وسائط الفحص المغناطيسي إلى نوعين رئيسيين:
1. الجسيمات الجافة (Dry Powder Method):
   - مساحيق دقيقة من برادة الحديد المعالجة كيميائياً بألوان متباينة (رمادي، أسود، أحمر).
   - تُنثر بنفاخة هواء خفيفة (Powder Blower) أثناء مرور تيار المغنطة.
   - ممتازة للأسطح الخشنة والساخنة واللحامات في المواقع الخارجية.
2. الطريقة الرطبة المعلقة (Wet Suspension Method):
   - جسيمات مغناطيسية دقيقة جداً معلقة في سائل حامل كالبترول الخفيف أو الماء المعالج بمانع الصدأ.
   - تُوفر حساسية فائقة جداً للشروخ الشعرية الدقيقة.
   - تتضمن جزيئات فلورية (Fluorescent Wet Method) تتوهج بلون أصفر/أخضر زاهٍ تحت ضوء الأشعة فوق البنفسجية (UV-A).
فحص تركيز المعلق الرطب (Centrifuge Tube Test):
يتم فحص تركيز الجزيئات في السائل بواسطة أنبوب طرد مركزي (Pear-shaped Centrifuge Tube) بسعة 100 مل وتركه ليستقر لمدة 30 دقيقة:
- المعلق غير الفلوري: حجم الاستقرار 1.2 إلى 2.4 مل.
- المعلق الفلوري: حجم الاستقرار 0.1 إلى 0.4 مل.`,
        contentEn: `Two primary media categories:
1. Dry Powder Method:
   - Finely divided treated iron particles in grey, black, or red colors.
   - Sprayed using light bulb blowers during magnetization. Optimal for rough/hot field welds.
2. Wet Suspension Method:
   - Ultra-fine particles suspended in light petroleum or conditioned water.
   - Maximum sensitivity for tight, shallow fissures.
   - Available as fluorescent particles inspected under UV-A black light.
Centrifuge Settling Tube Test (ASTM E709):
100 mL sample settled for 30 minutes in a pear-shaped centrifuge tube:
- Visible suspension: 1.2 to 2.4 mL settled volume.
- Fluorescent suspension: 0.1 to 0.4 mL settled volume.`,
        keyPointsAr: [
          'يجب رج أو تقليب خزان المعلق الرطب باستمرار لمنع ترسب الجسيمات في القاع.',
          'مؤشر كاسترول (Castrol Strips) أو قرص باي (Pie Gauge) يُستخدم للتحقق من اتجاه وكفاءة المجال.'
        ],
        keyPointsEn: [
          'Continuous bath agitation prevents particle settling in reservoir tanks.',
          'Pie gauges or Castrol strips verify adequate field strength and direction.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: إزالة المغناطيسية المتبقية',
        chapterTitleEn: 'Chapter 5: Demagnetization Protocols',
        pageTitleAr: 'طرق تصفير المجال المغناطيسي المتبقي وقياسه',
        pageTitleEn: 'Demagnetization Procedures & Residual Field Gauging',
        contentAr: `بعد انتهاء الفحص بالجسيمات المغناطيسية، تتبقى في القطعة كمية من المغناطيسية المتبقية (Residual Magnetism).
متى تكون إزالة المغنطة (Demagnetization) إلزامية؟
1. إذا كانت القطعة ستخضع لعمليات لحام كهربائي لاحقة؛ لأن المجال المغناطيسي المتبقي يسبب انحراف قوس اللحام (Arc Blow).
2. إذا كانت القطعة جزءاً من محرك أو تروس أو محامل دوارة (Bearings)؛ لأن المغناطيسية ستجذب برادة الحديد وتسبب تآكلاً حاداً وتلفاً ميكانيكياً.
3. إذا كانت القطعة ستركب في أنظمة ملاحية حساسة.
طريقة إزالة المغنطة:
يتم تعريض القطعة لمجال مغناطيسي متناوب (AC) أعلى من مجال التشبع، ثم تقليل شدة المجال تدريجياً وببطء إلى الصفر (عن طريق سحب القطعة ببطء بعيداً عن ملف التيار المتردد لمسافة مترين على الأقل).
التحقق من النجاح: قياس الفيض المتبقي بمقياس مغناطيسية (Field Indicator / Gaussmeter)؛ ويشترط عادة ألا يزيد المجال المتبقي عن ±3 Gauss (أو ±2 Gauss للتطبيقات الحرجة).`,
        contentEn: `Demagnetization is critical when parts undergo subsequent operations:
1. Downstream arc welding: Residual magnetism induces severe arc blow, preventing sound weld deposition.
2. Rotating machinery, bearings, and gears: Residual flux traps abrasive iron debris, causing rapid failure.
3. Proximity to magnetic compasses or aerospace avionics.
Method: Subject component to an alternating current field exceeding saturation, then smoothly decrease amplitude to zero (traversing component through an AC coil across >= 2 meters).
Verification: Calibrated gaussmeter must read <= +/-3 Gauss (+/-2 Gauss for critical aerospace components).`,
        keyPointsAr: [
          'انحراف قوس اللحام (Arc Blow) هو المؤشر الميداني الأكثر وضوحاً لوجود مغناطيسية متبقية عالية.',
          'الصلب الكربوني الصلب ذو الكربون العالي يملك احتفاظية عالية ويصعب إزالة مغنطته مقارنة بالحديد المطاوع.'
        ],
        keyPointsEn: [
          'Arc blow during welding is a primary indicator of excessive residual magnetism.',
          'High-carbon alloys exhibit high retentivity and coercive force, demanding stronger demagnetizing fields.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: معايير القبول والرفض',
        chapterTitleEn: 'Chapter 6: Acceptance & Rejection Codes',
        pageTitleAr: 'حدود الرفض المعيارية في ASME Sec VIII وAWS D1.1',
        pageTitleEn: 'Code Rejection Thresholds: ASME Sec VIII & AWS D1.1',
        contentAr: `معايير القبول في كود ASME Section VIII Div 1 (Appendix 6):
تُعتبر الدلالة ذات صلة (Relevant) إذا تجاوز طولها 1.5 ملم (1/16 بوصة).
تُرفض الحالات الآتية قطعياً:
1. أي دلالة خطية ذات صلة (Relevant Linear Indication) يزيد طولها عن 1.5 ملم - الشروخ والتمزقات مرفوضة فوراً.
2. أي دلالة دائرية ذات صلة يزيد قطرها عن 5 ملم (3/16 بوصة).
3. وجود 4 دلالات دائرية متراصفة أو أكثر تفصل بينها مسافة 1.5 ملم أو أقل من الحافة للحافة.
في كود اللحام الإنشائي AWS D1.1:
- يُرفض أي شرخ مهما كان صغيراً في وصلات اللحام.
- يجب توثيق وإصلاح جميع مناطق نقص الانصهار.`,
        contentEn: `ASME Sec VIII Div 1 Mandatory Appendix 6 criteria:
Relevant threshold > 1.5 mm (1/16 in).
Rejectable conditions:
1. Any relevant linear indication (cracks, lack of fusion of any length > 1.5 mm).
2. Any relevant rounded indication > 5 mm (3/16 in).
3. Four or more relevant rounded indications aligned in a row separated by 1.5 mm or less.
AWS D1.1 Structural Welding:
- Cracks are unconditionally prohibited in all cyclic and static weld categories.`,
        keyPointsAr: [
          'الشروخ في اختبار MT مرفوضة دائماً ولا يُسمح بها تحت أي ظرف في كودات الضغط والإنشاءات.',
          'يجب تنظيف القطعة بعد الفحص لإزالة برادة الحديد لمنع تآكل السطح لاحقاً.'
        ],
        keyPointsEn: [
          'Cracks are unconditionally rejectable under all pressure vessel and structural codes.',
          'Post-cleaning to remove residual particles is essential to avoid galvanic surface corrosion.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: أفضل الممارسات الميدانية',
        chapterTitleEn: 'Chapter 7: Field Best Practices',
        pageTitleAr: 'إرشادات مفتشي إنسكو للتحكم في الحاضنة والطلاء الأبيض',
        pageTitleEn: 'INSCO Certified Field Best Practices for MT Inspection',
        contentAr: `إرشادات فنية معتمدة من إنسكو:
1. استخدام الطلاء التبايني الأبيض (White Contrast Paint): عند فحص الأسطح الداكنة باستخدام الجسيمات المغناطيسية السوداء، ضع طبقة دهان تبايني بيضاء رقيقة جداً (لا تتجاوز 50 ميكرون / 2 mils)؛ لأن الدهان السميك يُضعف تسرب الفيض المغناطيسي ويُخفي العيوب.
2. تباعد أقطاب الحاضنة: اضبط المسافة بين ساقي الحاضنة بين 100 ملم إلى 150 ملم (4 إلى 6 بوصات) لتحقيق أعلى كثافة فيض ممكنة.
3. توقيت نثر الجزيئات: انثر الجسيمات المغناطيسية أثناء سريان التيار (Continuous Method)؛ ولا تقطع التيار إلا بعد استقرار الجسيمات بالكامل.
4. زاوية المسح المزدوج: قم بفحص كل منطقة بوضعين متعامدين بزاوية 90 درجة لضمان تقاطع خطوط الفيض مع الشروخ الطولية والعرضية.`,
        contentEn: `INSCO field protocols:
1. White Contrast Paint: When using black particles on dark steel, apply an ultra-thin layer (< 50 microns / 2 mils). Thick paint bridges and damps leakage fields.
2. Yoke Pole Spacing: Maintain pole spacing between 100-150 mm (4-6 inches) for maximum flux density.
3. Continuous Method: Apply particles while the current is energized. Never de-energize until particles have settled.
4. Orthogonal Dual Scan: Examine every joint with two passes rotated 90° apart to intercept longitudinal and transverse flaws.`,
        keyPointsAr: [
          'الدهان الأبيض السميك يسبب انخفاضاً حاداً في حساسية الفحص.',
          'طريقة المغنطة المستمرة (Continuous Method) أكثر حساسية بمراحل من طريقة المجال المتبقي (Residual Method).'
        ],
        keyPointsEn: [
          'Excessively thick contrast paint sharply degrades leakage field detection.',
          'Continuous magnetization provides drastically higher sensitivity than residual testing.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فحص الجسيمات المغناطيسية',
        pageTitleEn: 'Magnetic Particle Testing Review Examination',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of magnetic particle engineering principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ما هي قدرة الرفع الميكانيكية بالوزن الميت (Dead-Weight Lifting Power) المطلوبة لحاضنة التيار المتردد (AC Yoke) للتأكد من كفاءتها طبقاً لكود ASME Sec V Art 7؟',
          questionEn: 'What is the required dead-weight lifting capacity for an AC yoke per ASME Section V Article 7?',
          optionsAr: [
            '10 أرطال (4.5 كجم) عند مسافة التباعد القصوى بين الساقين',
            '40 رطلاً (18.1 كجم)',
            '1 رطل (0.45 كجم)',
            '100 رطل'
          ],
          optionsEn: [
            '10 lbs (4.5 kg) at maximum operating leg spacing',
            '40 lbs (18.1 kg)',
            '1 lb (0.45 kg)',
            '100 lbs'
          ],
          correctIndex: 0,
          explanationAr: 'ينص كود ASME Section V Article 7 وASTM E709 على أن حاضنات التيار المتردد (AC Yoke) يجب أن ترفع وزناً معيارياً لا يقل عن 10 أرطال (4.5 كجم)، بينما حاضنات التيار المستمر (DC Yoke) يلزمها رفع 40 رطلاً (18.1 كجم).',
          explanationEn: 'ASME Sec V Art 7 and ASTM E709 mandate that an AC yoke must lift a 10 lb (4.5 kg) certified test weight at the maximum pole spacing used during inspection.'
        }
      }
    ]
  },

  // =========================================================================
  // 4. RADIOGRAPHIC TESTING TEXTBOOK (RT)
  // =========================================================================
  {
    id: 'book-rt',
    discipline: 'RT',
    colorTheme: {
      primary: 'text-emerald-400',
      gradient: 'from-[#0b3320] via-[#104a2f] to-[#071f13]',
      border: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300',
      accent: 'border-emerald-400'
    },
    titleAr: 'المرجع الأكاديمي في فحص التصوير الإشعاعي (RT)',
    titleEn: 'Academic Textbook of Radiographic Testing (RT)',
    subtitleAr: 'فيزياء الأشعة، النظائر المشعة، جودة الصورة IQI، وتفسير الأفلام الصناعية',
    subtitleEn: 'Radiation Physics, Radioisotopes, Image Quality Indicators & Film Interpretation',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 8,
    applicableStandards: ['ASME Sec V Art 2', 'ASME Sec VIII', 'API 1104', 'ISO 17636', 'ASTM E1032'],
    coverSummaryAr: 'تغطية متكاملة لفيزياء الأشعة السينية وأشعة جاما، النظائر المشعة الصناعية (Ir-192, Co-60, Se-75)، قانون التربيع العكسي، الكثافة الضوئية (Density)، واللاتماثل الهندسي (Ug).',
    coverSummaryEn: 'Comprehensive treatment of X-ray and gamma radiation physics, industrial isotopes (Ir-192, Co-60, Se-75), inverse square law, film optical density, and geometric unsharpness (Ug).',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: فيزياء الإشعاع وتوليد الأشعة',
        chapterTitleEn: 'Chapter 1: Radiation Physics & Generation',
        pageTitleAr: 'الأشعة السينية، أشعة جاما، واضمحلال النظائر المشعة',
        pageTitleEn: 'X-Rays, Gamma Rays & Radioactive Isotope Decay',
        contentAr: `التصوير الإشعاعي الصناعي (RT) يستخدم الإشعاع الكهرومغناطيسي عالي الطاقة قصير الطول الموجي لاختراق المواد المعتمة وتكوين صورة دائمة على فيلم فوتوغرافي حساس أو لاقط رقمي.
مصادر الإشعاع الصناعي:
1. أنابيب الأشعة السينية (X-Ray Tubes):
   - يتم توليدها كهربائياً عن طريق تسريع الإلكترونات من المهبط (Cathode) وصدمها بالمصعد المعدني (Anode / Tungsten Target).
   - يتم التحكم في قوة الاختراق عبر فرق الجهد بالكيلوفولت (kV)، وفي شدة الإشعاع عبر تيار الأنبوب بالميلي أمبير (mA).
   - ميزة كبرى: يمكن إطفاؤها كهربائياً بأمان فوري.
2. النظائر المشعة (Gamma Ray Radioisotopes):
   - نوى ذرات غير مستقرة تطلق أشعة جاما ذات طاقات محددة تلقائياً أثناء اضمحلالها الإشعاعي:
     * الإيريديوم-192 (Ir-192): طاقة 0.31 إلى 0.61 MeV، عمر النصف نحو 74 يوماً، لفحص الفولاذ من 10 إلى 50 ملم.
     * الكوبالت-60 (Co-60): طاقة 1.17 و1.33 MeV، عمر النصف 5.27 سنة، لفحص المقاطع الفولاذية الثقيلة (50 إلى 150 ملم).
     * السيلينيوم-75 (Se-75): طاقة ناعمة 0.22 MeV، عمر النصف 120 يوماً، لفحص الأنابيب رقيقة الجدار والفولاذ المقاوم للصدأ.`,
        contentEn: `Industrial radiography employs high-energy, short-wavelength electromagnetic photons to penetrate opaque materials and expose radiographic film or digital detector arrays.
Sources:
1. X-Ray Generators: Electrically generated by decelerating high-velocity electrons into a tungsten anode. Penetrating quality is governed by kilovoltage (kV), beam intensity by tube current (mA). Immediate electrical shutoff.
2. Gamma Radioisotopes: Natural radioisotopes decaying spontaneously:
   - Iridium-192 (Ir-192): Energy 0.3-0.6 MeV, half-life 73.8 days, steel range 10-50 mm.
   - Cobalt-60 (Co-60): Energy 1.17 & 1.33 MeV, half-life 5.27 years, steel range 50-150 mm.
   - Selenium-75 (Se-75): Softer spectrum, half-life 120 days, ideal for thin-wall alloy piping.`,
        keyPointsAr: [
          'أشعة جاما لا يمكن إطفاؤها بمفتاح كهربائي؛ ويجب تخزين المصدر داخل حاوية تدريع ثقيلة من نضيد اليورانيوم المنضب أو الرصاص (Camera/Exposure Device).',
          'عمر النصف (Half-Life) هو الزمن اللازم لتقليص نشاط المصدر الإشعاعي إلى نصف قيمته الأصلية.'
        ],
        keyPointsEn: [
          'Gamma isotope decay is spontaneous and cannot be switched off; exposure devices use depleted uranium shielding.',
          'Half-life is the time required for a radioisotope to decay to half its initial activity.'
        ],
        formula: {
          latex: 'A = A_0 \\cdot e^{-\\lambda t} = A_0 \\cdot (0.5)^{\\frac{t}{T_{1/2}}}',
          descriptionAr: 'قانون الاضمحلال الإشعاعي لحساب النشاطية A بدلالة عمر النصف T_1/2 والزمن t',
          descriptionEn: 'Radioactive decay law computing remaining activity A after elapsed time t'
        }
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 2: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل محاكاة قانون التربيع العكسي وتدريع الإشعاع (HVL)',
        pageTitleEn: 'Inverse Square Law & Radiation Shielding Virtual Lab',
        contentAr: `شغّل المعمل التفاعلي أدناه لدراسة حسابات السلامة الإشعاعية وشدة الجرعة.
تحكم في مسافة المفتش عن المصدر (Distance)، وسماكة حاجز التدريع بالرصاص أو الخرسانة، وشاهد كيف تتناقص الجرعة الإشعاعية المقاسة بجهاز المسح (Survey Meter) لتحديد حزام العزل الأمني للحماية.`,
        contentEn: `Operate the interactive simulator below to analyze radiation safety calculations and shielding factors.
Adjust distance and shield material thickness (lead/concrete) to calculate Geiger counter exposure rates and cordon safety perimeters.`,
        experimentId: 'exp-rt-shielding-lab'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: جودة الصورة واللاتماثل الهندسي',
        chapterTitleEn: 'Chapter 3: Image Quality & Geometric Unsharpness',
        pageTitleAr: 'اللاتماثل الهندسي (Ug) ومؤشرات جودة الصورة (IQI / Penetrameters)',
        pageTitleEn: 'Geometric Unsharpness (Ug) & Image Quality Indicators (IQI)',
        contentAr: `تعتمد قدرة الفيلم الإشعاعي على كشف العيوب على ثلاثة عوامل رئيسية: الكثافة الضوئية (Density)، والتباين (Contrast)، وحدّة الوضوح (Definition).
1. اللاتماثل الهندسي (Geometric Unsharpness - Ug):
   - ضبابية حواف صورة العيب الناتجة عن أن مصدر الإشعاع ليس نقطة رياضية متناهية الصغر بل له بؤرة فيزيائية ذات أبعاد حقيقية (Focal Spot Size - F).
   - تحكمها المعادلة: Ug = (F × d) / D، حيث d هي سماكة القطعة، وD هي المسافة من المصدر إلى سطح القطعة.
   - يفرض كود ASME Sec V Art 2 حدوداً قصوى لـ Ug:
     * للسماكات حتى 2 بوصة (50 ملم): ألا يتجاوز Ug قيمة 0.51 ملم (0.020 بوصة).
2. مؤشر جودة الصورة (IQI / Penetrameter):
   - أداة معيارية تُوضع على جانب المصدر للقطعة لإثبات تحقيق الحساسية المطلوبة (عادة حساسية 2%):
     * مؤشرات الثقوب (Hole Type): صفيحة معيارية بسماكة T تحتوي ثقوباً بأقطار 1T و2T و4T (مطلوب عادة رؤية الثقب 2T).
     * المؤشرات السلكية (Wire Type ASTM / ISO): أسلاك معيارية بأقطار متدرجة؛ ويشترط الكود رؤية سلك محدد بأدق قطر مطلوب.`,
        contentEn: `Radiographic quality hinges on Density, Contrast, and Definition.
1. Geometric Unsharpness (Ug): Edge penumbra blurring caused by the finite dimensions of the focal spot size (F):
   Ug = (F * d) / D, where d is component thickness and D is source-to-object distance.
   ASME Sec V Article 2 limits Ug to <= 0.51 mm (0.020 in) for thickness <= 50 mm.
2. Image Quality Indicators (IQI / Penetrameters):
   Verified standard placed on the source-side to validate 2% image sensitivity:
   - Hole-type: Plaque of thickness T with 1T, 2T, 4T holes (2T hole visibility typical).
   - Wire-type (ASTM E747 / ISO 19232): Graded wire diameters where the designated thin wire must be distinctly resolved.`,
        keyPointsAr: [
          'لتقليل اللاتماثل الهندسي Ug، يجب زيادة مسافة المصدر (D) أو اختيار مصدر ذي بؤرة أصغر (F).',
          'إذا وُضع مؤشر الـ IQI على جانب الفيلم بدلاً من جانب المصدر، يُشترط وضع حرف الرصاص (F) بجواره وتخفيض السلك المطلوب درجة واحدة.'
        ],
        keyPointsEn: [
          'Minimizing geometric unsharpness requires maximizing source-to-film distance or choosing smaller focal spots.',
          'Film-side IQI placement requires a lead letter "F" and a stricter wire resolution requirement.'
        ],
        formula: {
          latex: 'U_g = \\frac{F \\cdot d}{D}, \\quad D = \\text{Source-to-Object Distance}',
          descriptionAr: 'قانون اللاتماثل الهندسي Ug بدلالة حجم بؤرة المصدر F وسماكة المادة d والمسافة D',
          descriptionEn: 'Geometric unsharpness formula Ug = F * d / D'
        }
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: الكثافة الضوئية وتحميض الأفلام',
        chapterTitleEn: 'Chapter 4: Optical Density & Darkroom Processing',
        pageTitleAr: 'قياس الكثافة الضوئية (H&D) وخطوات التحميض والتثبيت',
        pageTitleEn: 'Film Optical Density (H&D) & Darkroom Chemical Processing',
        contentAr: `الكثافة الضوئية (Transmitted Optical Density - D):
مقياس لدرجة اسوداد الفيلم بعد التحميض، وتُقاس بجهاز الدنسيتوميتر (Densitometer): D = log₁₀(I₀ / I_t).
متطلبات كود ASME Section V Article 2 لكثافة الفيلم الإشعاعي:
- صور الأشعة السينية (X-Ray): يجب أن تكون الكثافة في منطقة اللحام بين 1.8 إلى 4.0 H&D.
- صور أشعة جاما (Gamma Ray): يجب أن تكون الكثافة بين 2.0 إلى 4.0 H&D.
- التفاوت المسموح في الكثافة عبر الصورة المركبة يجب ألا يتجاوز -15% أو +30% عن الكثافة المقاسة بجوار الـ IQI.
خطوات التحميض الكيميائي المعياري في الغرفة المظلمة:
1. التحميض (Developing): عند درجة حرارة 20°م لمدة 5 دقائق لتحويل بلورات بروميد الفضة المتأثرة بالإشعاع إلى فضة معدنية سوداء.
2. حمام الإيقاف (Stop Bath): غمر الفيلم في حمض الخليك المخفف لمدة 30 ثانية لوقف عملية التحميض فوراً.
3. التثبيت (Fixing): إذابة بلورات الفضة غير المعرضة وإزالتها لحفظ الصورة بشكل دائم (لمدة 10 إلى 15 دقيقة).
4. الغسيل النهائي والتجفيف (Washing & Drying): غسيل بالماء الجاري لمدة 20 دقيقة لإزالة بقايا الثيوسلفات لمنع اصفرار الفيلم مع الزمن.`,
        contentEn: `Optical Density (D) quantifies radiographic film blackening: D = log10(I0 / It).
ASME Section V Article 2 limits:
- X-Ray Radiographs: Density must be between 1.8 and 4.0 H&D across the weld seam.
- Gamma Radiographs: Density must be between 2.0 and 4.0 H&D.
- Permitted density variation: -15% to +30% relative to the density adjacent to the IQI.
Standard 5-Step Darkroom Processing:
1. Developer: 5 min at 20°C converts exposed silver halide to metallic silver.
2. Stop Bath: 30 sec acid bath terminates development immediately.
3. Fixer: 10-15 min dissolves unexposed silver halide to preserve image permanence.
4. Wash: 20 min running water removes thiosulfate chemicals.
5. Dry: Dust-free warm air drying.`,
        keyPointsAr: [
          'جهاز الدنسيتوميتر يجب معايرته بلوك كثافة معتمد (Step Wedge Calibration Film) كل 90 يوماً.',
          'التحميض عند درجات حرارة أعلى من 24°م يسبب تشوه المستحلب الحساس وحبيبات خشنة.'
        ],
        keyPointsEn: [
          'Densitometers must be calibrated against certified step tablets every 90 days.',
          'Overheating developer solutions above 24°C produces chemical fog and coarse graininess.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: تفسير عيوب اللحام الإشعاعية',
        chapterTitleEn: 'Chapter 5: Weld Discontinuity Interpretation',
        pageTitleAr: 'المظاهر الإشعاعية لعيوب اللحام على الفيلم الصناعي',
        pageTitleEn: 'Radiographic Signatures of Welding Flaws on Film',
        contentAr: `تظهر العيوب على الفيلم الإشعاعي نتيجة اختلاف امتصاص الإشعاع:
1. الشقوق (Cracks):
   - خطوط داكنة رفيعة جداً، متعرجة وذات نهايات مدببة وحادة.
2. نقص الانصهار (Lack of Fusion - LOF):
   - خط داكن مستقيم ذو حافة حادة جداً ومستوية على أحد جانبي خط اللحام (يمثل عدم اندماج المعدن مع جدار الأخدود).
3. نقص التغلغل عند الجذر (Lack of Penetration - LOP):
   - شريط داكن مستمر أو متقطع في منتصف خط اللحام تماماً، بحواف مستقيمة موازية لمحور اللحام (يمثل عدم وصول اللحام لكامل سماكة الجذر).
4. التقويض (Undercut):
   - شريط عريض داكن غير منتظم الحواف يمتد على طول حافة حزام اللحام (Toe).
5. خبث اللحام (Slag Inclusions):
   - بقع داكنة غير منتظمة الشكل، مستطيلة أو ذيلية، ناتجة عن انحباس بودرة اللحام داخل المعدن.
6. المسامية الغازية (Gas Porosity):
   - دوائر داكنة ملساء الحواف ومستديرة تماماً ناتجة عن فقاعات الغاز المحبوسة.
7. الإشعاع الزائف (Artifacts):
   - بقع ناتجة عن خدش المستحلب أو تفريغ الكهرباء الاستاتيكية أو علامات ثني الفيلم (Crimp Marks).`,
        contentEn: `Flaw radiographic signatures:
1. Cracks: Thin, jagged, dark lines with sharp tail terminations.
2. Lack of Fusion (LOF): Very straight, sharp dark line aligned along weld bevel sidewall.
3. Lack of Penetration (LOP): Continuous or intermittent straight-edged dark band centered along root centerline.
4. Undercut: Broad, wavy dark line running along the weld toe transition.
5. Slag Inclusions: Dark, irregular, elongated indications with jagged borders.
6. Porosity: Round, smooth-edged dark spots occurring isolated, clustered, or linear.
7. Artifacts: False indications from static discharge, film crimping, or water spots.`,
        keyPointsAr: [
          'العيوب التي تقلل سماكة المعدن (فجوات، شقوق) تظهر داكنة (أكثر سواداً) لأنها تسمح بمرور إشعاع أكبر.',
          'الشوائب الثقيلة كالتنجستن (Tungsten Inclusions) تظهر بيضاء ناصعة لأن كثافتها أعلى من الفولاذ فتمتص الإشعاع بالكامل.'
        ],
        keyPointsEn: [
          'Voids and volume losses appear darker because they transmit higher radiation doses.',
          'Tungsten inclusions appear bright white because tungsten absorption exceeds steel.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: معايير القبول والرفض',
        chapterTitleEn: 'Chapter 6: Acceptance & Rejection Codes',
        pageTitleAr: 'حدود القبول والرفض في كودات ASME Sec VIII وAPI 1104',
        pageTitleEn: 'Acceptance Criteria: ASME Section VIII & API 1104',
        contentAr: `معايير القبول في كود ASME Section VIII Div 1 (UW-51):
1. العيوب المرفوضة قطعياً:
   - أي شرخ (Crack) أو منطقة نقص انصهار (Lack of Fusion) أو نقص تغلغل غير كامل في الجذر مرفوضة تماماً بصرف النظر عن طولها.
2. عيوب الخبث والعيوب الخطية (Elongated Inclusions):
   - تُرفض إذا زاد طولها عن:
     * 6 ملم (1/4 بوصة) للسماكات حتى 19 ملم.
     * ثلث السماكة (t/3) للسماكات من 19 ملم إلى 57 ملم.
     * 19 ملم (3/4 بوصة) للسماكات الأكبر من 57 ملم.
     * وجود مجموعة عيوب خطية على خط واحد يزيد طولها الإجمالي عن سماكة اللحام t في طول 12t.
3. المسامية (Porosity):
   - يتم تقييمها بمقارنة الفيلم الإشعاعي بمخططات المسامية القياسية (Porosity Charts) الملحقة بالكود (Appendix 4) لتحديد الحجم والعدد المسموح لكل بوصة مربعة.`,
        contentEn: `ASME Sec VIII Div 1 Paragraph UW-51 limits:
1. Unconditional Rejections: Any crack, lack of fusion, or incomplete penetration is unconditionally rejected.
2. Elongated / Slag Inclusions: Rejected if length exceeds:
   - 6 mm (1/4 in) for t <= 19 mm.
   - t/3 for 19 mm < t <= 57 mm.
   - 19 mm (3/4 in) for t > 57 mm.
   - Group of aligned inclusions exceeding t in total length within a 12t weld segment.
3. Porosity: Evaluated by direct comparison against ASME Appendix 4 Porosity Charts.`,
        keyPointsAr: [
          'كود خطوط الأنابيب API 1104 يسمح بأطوال محدودة من نقص التغلغل عند الجذر في الشروط غير الحرجة، بينما يرفضها ASME UW-51 رفضاً تاماً.',
          'يجب حفظ الأفلام الإشعاعية في بيئة جافة ومكيفة لمدة لا تقل عن 5 سنوات طبقاً لمتطلبات الكود.'
        ],
        keyPointsEn: [
          'API 1104 allows limited root LOP in non-critical lines, whereas ASME UW-51 rejects it completely.',
          'Radiographs must be preserved in climate-controlled archives for at least 5 years per code.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: السلامة الإشعاعية وحسابات ALARA',
        chapterTitleEn: 'Chapter 7: Radiation Protection & ALARA',
        pageTitleAr: 'حدود الجرعات ومسافة الأمان والحسابات الرياضية للحماية',
        pageTitleEn: 'Dose Limits, Safety Perimeters & Shielding Physics',
        contentAr: `السلامة الإشعاعية هي الركيزة الأخطر في التصوير الإشعاعي الصناعي:
- مبادئ ALARA (As Low As Reasonably Achievable):
  * تقليل الجرعة الإشعاعية إلى أدنى مستوى ممكن عبر الركائز الثلاث:
    1. الوقت (Time): تقليل زمن التواجد قرب المصدر.
    2. المسافة (Distance): زيادة المسافة وفق قانون التربيع العكسي (مضاعفة المسافة تقلل الجرعة إلى الربع).
    3. التدريع (Shielding): استخدام حواجز من الرصاص أو التنجستن بين المصدر والعاملين.
- حدود الجرعات السنوية القانونية:
  * العاملون المهنيون في الإشعاع (Radiation Workers): أقصى جرعة سنوية 20 ملي سيفرت (20 mSv / 2 rem) في السنة.
  * عامة الجمهور (General Public): أقصى جرعة سنوية 1 ملي سيفرت (1 mSv / 0.1 rem) في السنة.
- مناطق العزل الميداني:
  * يجب إحاطة منطقة التصوير بشريط تحذير إشعاعي ثلاثي الشفرات مع لافتات واضحة وأضواء تحذيرية حمراء دوارة عند خط عزل لا تزيد الجرعة عنده عن 2 mR/hr (20 µSv/h).`,
        contentEn: `Radiation protection guidelines:
- ALARA Core Tenets:
  1. Time: Minimize duration near unshielded sources.
  2. Distance: Maximize distance per Inverse Square Law (doubling distance cuts dose rate by 75%).
  3. Shielding: Utilize high-density collimators and lead aprons.
- Legal Annual Occupational Dose Limits:
  * Radiation Workers: 20 mSv/year (2 rem/year).
  * General Public: 1 mSv/year (0.1 rem/year).
- Field Barricade Boundary: High radiation rope perimeter marked at the 2 mR/hr (20 micro-Sv/hr) isodose line with active warning flashers.`,
        keyPointsAr: [
          'استخدام الموجه الإشعاعي (Collimator) إلزامي في الميدان لتقليص انبعاث الأشعة وتوجيهها نحو خط اللحام فقط.',
          'كل مفتش إشعاعي يجب أن يحمل مقياس جرعات شخصي TLD أو OSL مع مقياس جرعة لحظي (Beeper / Rate Alarm).'
        ],
        keyPointsEn: [
          'Tungsten collimators are mandatory to restrict radiation emission strictly to the target weld seam.',
          'Personnel must wear TLD/OSL dosimeter badges and direct-reading audio rate alarms.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فحص التصوير الإشعاعي',
        pageTitleEn: 'Radiographic Testing Review Examination',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of radiographic testing engineering principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ما هو النطاق المسموح به معيارياً لكثافة الفيلم الإشعاعي المنقولة (Transmitted Density) لصور أشعة جاما حسب ASME Section V Article 2؟',
          questionEn: 'What is the acceptable film optical density range for Gamma radiographs under ASME Section V Article 2?',
          optionsAr: [
            'من 2.0 إلى 4.0 H&D',
            'من 0.5 إلى 1.0 H&D',
            'أعلى من 6.0 H&D دائماً',
            'بين 1.0 و1.5 H&D فقط'
          ],
          optionsEn: [
            'Between 2.0 and 4.0 H&D',
            'Between 0.5 and 1.0 H&D',
            'Always above 6.0 H&D',
            'Between 1.0 and 1.5 H&D only'
          ],
          correctIndex: 0,
          explanationAr: 'ينص كود ASME Section V Article 2 على أن كثافة الفيلم المنقولة المقاسة بجهاز الدنسيتوميتر يجب أن تكون بين 1.8 و4.0 لصور الأشعة السينية (X-Ray)، وبين 2.0 و4.0 لصور أشعة جاما (Gamma Ray) لضمان التباين والحساسية اللازمة.',
          explanationEn: 'ASME Sec V Art 2 specifies optical film density between 1.8 and 4.0 for X-ray radiographs, and between 2.0 and 4.0 for gamma radiographs, measured with a calibrated densitometer.'
        }
      }
    ]
  },

  // =========================================================================
  // 5. EDDY CURRENT TESTING TEXTBOOK (ET)
  // =========================================================================
  {
    id: 'book-et',
    discipline: 'ET',
    colorTheme: {
      primary: 'text-amber-300',
      gradient: 'from-[#2e2609] via-[#45380c] to-[#1c1705]',
      border: 'border-amber-400/40',
      badgeBg: 'bg-amber-400/20',
      badgeText: 'text-amber-200',
      accent: 'border-amber-400'
    },
    titleAr: 'المرجع الأكاديمي في فحص التيارات الدوامية (ET)',
    titleEn: 'Academic Textbook of Eddy Current Testing (ET)',
    subtitleAr: 'الحث الكهرومغناطيسي، عمق التغلغل القياسي، ومستوى الممانعة المركبة',
    subtitleEn: 'Electromagnetic Induction, Standard Depth of Penetration & Impedance Plane',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 6,
    applicableStandards: ['ASME Sec V Art 8', 'ASTM E243', 'ASTM E426', 'ISO 15549', 'ASME Sec XI'],
    coverSummaryAr: 'مرجع هندسي متخصص في فيزياء الحث الكهرومغناطيسي، قانون فاراداي ولينز، ظاهرة الظاهرة السطحية، عمق التغلغل القياسي δ، تحليل مستوى الممانعة المركبة، وفحص أنابيب المبادلات الحرارية.',
    coverSummaryEn: 'Specialized handbook covering electromagnetic induction, Faraday and Lenz laws, skin depth penetration delta, complex impedance plane phasor analysis, and heat exchanger tubing inspection.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: الحث الكهرومغناطيسي والظاهرة السطحية',
        chapterTitleEn: 'Chapter 1: Electromagnetic Induction & Skin Effect',
        pageTitleAr: 'قانون فاراداي ولينز وتوليد التيارات الدوامية في المعادن',
        pageTitleEn: 'Faraday & Lenz Laws: Generating Induced Eddy Currents',
        contentAr: `يعتمد فحص التيارات الدوامية (ET) على مبادئ الحث الكهرومغناطيسي:
1. قانون فاراداي: عند إمرار تيار متردد عالي التردد داخل ملف نحاسي (Coil)، يتولد حول الملف مجال مغناطيسي أولي متغير في الشدة والاتجاه.
2. توليد التيارات الدوامية: عندما يُوضع هذا الملف بالقرب من مادة موصلة للكهرباء (كالصلب، النحاس، الألومنيوم، التيتانيوم)، يقطع المجال الأولي إلكترونات المادة، مما يحث تيارات كهربائية دائرية مغلقة تشبه الدوامات المائية وتسمى التيارات الدوامية (Eddy Currents).
3. قانون لينز: تولد التيارات الدوامية المحتثة مجالاً مغناطيسياً ثانوياً معاكساً تماماً في اتجاهه للمجال الأولي للملف، مما يغير من ممانعة الملف الكلية (Impedance - Z).
4. كشف العيوب: عند مرور الملف فوق شرخ سطحي أو تآكل جداري، تعترض هذه العيوب مسار التيارات الدوامية فتقل شدتها ويتشوه مسارها، مما يغير الممانعة الكهربائية للملف فوراً وتظهر الإشارة على شاشة الجهاز.`,
        contentEn: `Eddy current testing exploits electromagnetic induction:
1. Faraday’s Law: AC current through a test coil creates an alternating primary magnetic field.
2. Induced Currents: Bringing this coil near a conductive workpiece induces closed circulating loops of eddy currents.
3. Lenz’s Law: Induced eddy currents generate a secondary opposing magnetic field, modifying coil electrical impedance (Z).
4. Flaw Detection: Surface cracks or wall loss interrupt the eddy current paths, shifting net coil impedance and displaying a defect indication on screen.`,
        keyPointsAr: [
          'لا تتطلب طريقة ET أي تلامس ميكانيكي مباشر أو سائل تلامس (Couplant-free).',
          'يمكن للفحص كشف العيوب من خلال طبقات الطلاء والدهان العازل بسماكات تصل إلى 2 ملم.'
        ],
        keyPointsEn: [
          'ET is a non-contact, couplant-free inspection technique.',
          'Capable of detecting surface-breaking cracks through intact non-conductive coatings and paint up to 2 mm thick.'
        ],
        formula: {
          latex: 'E = -N \\frac{d\\Phi}{dt}, \\quad Z = \\sqrt{R^2 + X_L^2}',
          descriptionAr: 'قانون فاراداي للقوة الدافعة الكهربائية الحثية والممانعة الكلية Z',
          descriptionEn: 'Faraday’s Law of induction and net probe impedance Z'
        }
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 2: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل محاكاة عمق التغلغل القياسي (Skin Depth δ) ومستوى الممانعة',
        pageTitleEn: 'Standard Depth of Penetration (δ) & Phasor Plane Virtual Lab',
        contentAr: `شغّل المعمل التفاعلي أدناه لتحليل سلوك التيارات الدوامية داخل المعادن.
تحكم في تردد الفحص (Frequency) والتوصيلية الكهربائية للمعدن (Conductivity) والنفاذية المغناطيسية لمشاهدة منحنى اضمحلال التيارات الدوامية مع العمق ومسار زاوية الطور على مستوى الممانعة المركبة.`,
        contentEn: `Operate the interactive simulator below to analyze eddy current skin effect and phase analysis.
Adjust inspection frequency, metal conductivity (% IACS), and permeability to view exponential current decay curves and impedance plane flaw vectors.`,
        experimentId: 'exp-et-skin-depth'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: عمق التغلغل القياسي',
        chapterTitleEn: 'Chapter 3: Standard Depth of Penetration',
        pageTitleAr: 'حساب عمق التغلغل القياسي (δ) وتأثير التردد',
        pageTitleEn: 'Standard Depth of Penetration (δ) Formulation',
        contentAr: `بسبب ظاهرة الظاهرة السطحية (Skin Effect)، تتركز التيارات الدوامية بأعلى كثافة لها على السطح الخارجي للقطعة المفحوصة، ثم تتناقص شدتها أُسياً مع التعمق داخل المعدن.
عمق التغلغل القياسي (Standard Depth of Penetration - δ):
هو العمق الذي تنخفض عنده كثافة التيارات الدوامية إلى نحو 37% (أي 1/e) من قيمتها عند السطح الخارجي:
δ = 50 × √(ρ / (f × μ_r)) [ملم]
حيث:
- f: تردد الفحص بالهرتز (Hz).
- ρ: المقاومية الكهربائية للمعدن (µΩ·cm).
- μ_r: النفاذية المغناطيسية النسبية للمادة (تساوي 1 للمعادن غير المغناطيسية كالألومنيوم والنحاس والصلب الأوستنيتي المقاوم للصدأ).
القاعدة الهندسية:
- للكشف عن الشروخ السطحية الدقيقة جداً: نستخدم ترددات عالية جداً (من 100 kHz إلى 2 MHz) لتركيز الطاقة في السطح.
- للكشف عن التآكل والعيوب في الجدار الداخلي للأنابيب أو تحت السطح: نستخدم ترددات منخفضة (من 1 kHz إلى 50 kHz) لزيادة عمق الاختراق.`,
        contentEn: `Due to the skin effect, eddy current density is maximum at the surface and decays exponentially with depth.
Standard Depth of Penetration (delta):
Depth at which eddy current density drops to 37% (1/e) of its surface value:
delta = 50 * sqrt(resistivity / (f * relative_permeability)) [mm].
Engineering Rules:
- Fine surface cracks: High frequencies (100 kHz - 2 MHz) concentrate energy at the immediate surface.
- Subsurface and ID tube wall loss: Lower frequencies (1 kHz - 50 kHz) achieve deeper electromagnetic penetration.`,
        keyPointsAr: [
          'عمق التغلغل الفعال (Effective Depth of Penetration) يعادل نحو ثلاثة أضعاف عمق التغلغل القياسي (3δ)، حيث تنخفض كثافة التيار إلى 5%.',
          'المعادن المغناطيسية كالفولاذ الكربوني تملك نفاذية عالية جداً تجعل عمق التغلغل ضحلاً للغاية ما لم يتم استخدام مغنطة تشبع مستمرة (Magnetic Saturation).'
        ],
        keyPointsEn: [
          'Effective depth of penetration is ~3 * delta, where current density drops to ~5%.',
          'Ferromagnetic steel exhibits high permeability, restricting penetration to a paper-thin skin unless magnetically saturated with a strong DC bias.'
        ],
        formula: {
          latex: '\\delta = \\frac{1}{\\sqrt{\\pi f \\mu \\sigma}} = 50 \\sqrt{\\frac{\\rho}{f \\cdot \\mu_r}} \\quad [\\text{mm}]',
          descriptionAr: 'معادلة عمق التغلغل القياسي للتيارات الدوامية بدلالة التردد والنفاذية والتوصيلية',
          descriptionEn: 'Standard depth of penetration formula delta'
        }
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: تحليل مستوى الممانعة المركبة',
        chapterTitleEn: 'Chapter 4: Complex Impedance Plane Analysis',
        pageTitleAr: 'فهم زاوية الطور (Phase Lag) والتمييز بين العيوب والتوصيلية',
        pageTitleEn: 'Phase Lag Analysis & Separating Conductivity vs Lift-Off',
        contentAr: `تُعرض إشارات أجهزة التيارات الدوامية الحديثة على شاشة مستوى الممانعة المركبة (Impedance Plane Display):
- المحور الأفقي يمثل المقاومة الأومية (Resistance - R).
- المحور الرأسي يمثل الممانعة الحثية (Inductive Reactance - X_L).
كل تغيير في حالة القطعة المفحوصة يُحدث إزاحة مميزة لنقطة الاتزان على الشاشة:
1. إشارة الرفع والابتعاد (Lift-Off Vector):
   - تحدث عند ابتعاد المحول عن سطح القطعة، وتتحرك في زاوية محددة. يتم تدوير الشاشة برمجياً بحيث يصبح خط الرفع أفقياً تماماً، لتفادي الخلط بينه وبين إشارات العيوب!
2. زاوية الطور وتأخر الطور (Phase Lag):
   - مع تعمق التيارات الدوامية في المعدن، تتأخر زاوية طورها.
   - هذا التأخر يسمح للمفتش بالتمييز بدقة متناهية بين الشروخ السطحية الخارجية (OD Flaws) والعيوب في الجدار الداخلي (ID Flaws)، وقياس عمق الشق بمقدار زاوية الطور.
3. التوصيلية الكهربائية:
   - تغير التوصيلية يتحرك على طول منحنى التوصيلية، ويُستخدم في فرز السبائك والتحقق من المعالجة الحرارية.`,
        contentEn: `Modern ET instruments display signals on a complex impedance plane (R vs XL axes):
1. Lift-Off Vector: Movement away from the surface shifts impedance in a characteristic direction. Phase rotation is adjusted during calibration to place the lift-off vector horizontally, preventing false defect calls.
2. Phase Lag Sizing: As eddy currents diffuse into the material, their phase angle shifts proportionally with depth. This phase angle lag allows precise discrimination between Outer Diameter (OD) and Inner Diameter (ID) flaws.
3. Conductivity Curve: Shifts along the conductivity locus enable rapid alloy sorting and heat treatment verification.`,
        keyPointsAr: [
          'تدوير زاوية الطور (Phase Rotation) هو الخطوة الأولى في معايرة أي جهاز تيارات دوامية.',
          'العيوب السطحية تعطي إشارة عمودية تقريباً على خط الرفع، مما يوفر أقصى نسبة إشارة إلى ضوضاء (SNR).'
        ],
        keyPointsEn: [
          'Phase angle rotation is the primary step in eddy current calibration.',
          'Surface flaws project orthogonal to the horizontal lift-off vector, maximizing signal-to-noise ratio.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: فحص أنابيب المبادلات الحرارية',
        chapterTitleEn: 'Chapter 5: Heat Exchanger Tubing Inspection',
        pageTitleAr: 'مجسات البوبين (Bobbin Probes) وفحص أنابيب الغلايات والمكثفات',
        pageTitleEn: 'Bobbin Probe Testing in Boilers & Shell-and-Tube Exchangers',
        contentAr: `يُعد فحص أنابيب المبادلات الحرارية والمكثفات في مصافي النفط ومحطات الطاقة أحد أهم التطبيقات الصناعية لطريقة ET:
- نوع المجس: يُستخدم مجس داخلي أسطواني (Bobbin Probe / Internal Diameter Probe) يُدفع داخل الأنابيب غير المغناطيسية (كسبائك النحاس، التيتانيوم، والإنكونيل، والصلب الأوستنيتي).
- المعايرة القياسية (ASME Section V Article 8):
  * يتم استخدام أنبوب معايرة قياسي (Calibration Standard Tube) يحتوي على عيوب مصنعة معروفة الأبعاد بدقة:
    1. ثقب كامل نافذ في الجدار (Through-wall Hole 100%).
    2. تفريغ دائري خارجي بنسبة 20% و40% من سماكة الجدار (Flat Bottom Holes / Outer Ring).
    3. تفريغ دائري داخلي بنسبة 20% من السماكة.
    4. حلقة داعمة تحاكي صفيحة التثبيت (Support Plate Simulation).
- التقييم التفاضلي (Differential Mode): يرصد التغيرات الموضعية المفاجئة كالشقوق والتآكل النقطي (Pitting).
- التقييم المطلق (Absolute Mode): يرصد التآكل المنتظم التدريجي وانخفاض السماكة على طول الأنبوب.`,
        contentEn: `Inspection of heat exchanger tubing in refineries and power plants:
- Bobbin Probes: Internal diameter coils propelled through non-magnetic tubing (Cu-Ni, Titanium, Inconel, 316L).
- ASME Sec V Article 8 Calibration Standard:
  Tubing standard with EDM-machined reference flaws:
  1. 100% Through-wall hole.
  2. 20% and 40% OD flat-bottom holes.
  3. 20% ID groove.
  4. External carbon steel ring simulating tube support plates.
- Differential Coil Mode: Detects localized, abrupt defects like pitting and fretting cracks.
- Absolute Coil Mode: Detects gradual wall thinning and erosion wear.`,
        keyPointsAr: [
          'تحديد موقع العيب بالنسبة لألواح التثبيت (Support Plates) حاسم لمنع الخلط بين إشارة اللوح والعيوب.',
          'سرعة سحب المجس يجب أن تكون ثابتة (حوالي 1 m/s) باستخدام مسدس سحب آلي (Pusher-Puller).'
        ],
        keyPointsEn: [
          'Differentiating baffle/support plate signals from flaws requires multi-frequency mixing.',
          'Probe pull speed must remain constant (~1 m/s) using mechanical automated pullers.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: معايير القبول والرفض',
        chapterTitleEn: 'Chapter 6: Acceptance & Rejection Codes',
        pageTitleAr: 'حدود سد الأنابيب وتآكل الجدار في ASME Sec XI وAPI 510',
        pageTitleEn: 'Tubing Plug Limits & Code Criteria: ASME Sec XI & API 510',
        contentAr: `معايير تقييم أنابيب المبادلات الحرارية:
1. نسبة التآكل في سماكة الجدار (% Wall Loss):
   - الأنابيب التي يقل فيها التآكل عن 20%: مقبولة تماماً وتُترك في الخدمة دون قيود.
   - الأنابيب التي يتراوح تآكلها بين 20% إلى 39%: تُسجل وتُراقب في خطط الصيانة التنبؤية القادمة.
   - الأنابيب التي يصل أو يتجاوز فيها التآكل 40% من سماكة الجدار: تُعتبر حرجة ويُلزم الكود بوضع سدادات ميكانيكية أو هيدروليكية محكمة على طرفيها (Tube Plugging) لعزلها عن الخدمة لمنع انفجارها وتسريب الموائع الخطرة.
2. الشروخ الحلقية أو الطولية:
   - أي شرخ يُرصد في الأنبوب يُوجب سد الأنبوب وعزله فوراً بصرف النظر عن عمقه.`,
        contentEn: `Heat exchanger tubing evaluation criteria per API 510 and ASME Sec XI:
1. % Wall Loss Thresholds:
   - Wall loss < 20%: Fully acceptable for continued service.
   - Wall loss 20% to 39%: Recorded and scheduled for future tracking.
   - Wall loss >= 40%: Critical plugging threshold. Tube must be isolated using mechanical or explosive plugs to prevent catastrophic field leaks.
2. Cracks: Any crack detected in tubing mandates immediate plugging.`,
        keyPointsAr: [
          'سد الأنبوب (Plugging) عند 40% هو المعيار الهندسي العالمي الشائع في الصناعات البتروكيماوية.',
          'إذا تجاوزت نسبة الأنابيب المسدودة في المبادل 10% إلى 15% من إجمالي الحزمة، يجب إعادة تقييم كفاءة التبادل الحراري أو استبدال الحزمة بالكامل (Retubing).'
        ],
        keyPointsEn: [
          'The 40% wall loss tube plugging limit is standard across global petrochemical plants.',
          'When total plugged tubes exceed 10-15% of bundle capacity, bundle replacement (retubing) is mandatory.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: أفضل الممارسات الميدانية',
        chapterTitleEn: 'Chapter 7: Field Best Practices',
        pageTitleAr: 'إرشادات خبراء إنسكو للمعايرة وتقنية المزج متعدد الترددات',
        pageTitleEn: 'INSCO Best Practices: Multi-Frequency Mixing in Tubing',
        contentAr: `إرشادات خبراء إنسكو المعتمدة في فحص التيارات الدوامية:
1. تقنية المزج متعدد الترددات (Multi-Frequency Mixing):
   - عند فحص الأنابيب بالقرب من ألواح التثبيت (Support Plates)، تُحدث لوحة الدعم الفولاذية إشارة هائلة تُغطي على أي شروخ تحتها.
   - أفضل ممارسة: استخدام قناتين تردديتين ومزجهما برمجياً (Mix Channel) لطرح وإلغاء إشارة صفيحة التثبيت تماماً، مما يكشف الشروخ والتآكل المختبئ تحتها بوضوح ناصع!
2. التحقق الدوري من المعايرة:
   - مرر مجس البوبين في أنبوب المعايرة القياسي كل 2 إلى 4 ساعات وبداية ونهاية كل وردية عمل للتحقق من زوايا الطور وحساسية السعة.
3. نظافة الأنابيب الداخلية:
   - يجب غسيل الأنابيب بضغط الماء العالي (Hydro-blasting) وتجفيفها قبل إدخال المجس؛ لأن الرواسب الكلسية والشوائب تُعيق حركة المجس وتسبب ضوضاء في الإشارة.`,
        contentEn: `INSCO certified best practices:
1. Multi-Frequency Mixing: Steel tube support plates generate massive signals obscuring flaws. Modern practice mixes a secondary frequency to subtract and eliminate the plate signal, exposing hidden cracks.
2. Calibration Verification: Pass probe through the calibration tube standard every 2-4 hours to confirm phase angle and gain integrity.
3. Tube Pre-cleaning: High-pressure hydro-blasting prior to inspection removes internal scale and debris that cause probe jamming and false signal noise.`,
        keyPointsAr: [
          'المزج الترددي (Mixing) يُمكّن من كشف التآكل تحت ألواح التثبيت بنسبة دقة تفوق 95%.',
          'استخدام أقطار مجسات متطابقة مع القطر الداخلي للأنبوب لتقليل تأثير التذبذب الحركي (Probe Wobble).'
        ],
        keyPointsEn: [
          'Frequency mixing delivers >95% flaw detectability under support baffles.',
          'Selecting optimal probe fill-factor minimizes wobbling noise.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فحص التيارات الدوامية',
        pageTitleEn: 'Eddy Current Testing Review Examination',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of eddy current engineering principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ماذا يُمثل عمق التغلغل القياسي للتيارات الدوامية (Standard Depth of Penetration - δ)؟',
          questionEn: 'What does the Standard Depth of Penetration (delta) represent in eddy current testing?',
          optionsAr: [
            'العمق الذي تنخفض عنده كثافة التيارات الدوامية إلى 37% (1/e) من قيمتها عند السطح الخارجي',
            'أقصى عمق يمكن أن يصل إليه أي شعاع صوتي',
            'سماكة طبقة الطلاء الخارجي فقط',
            'العمق الذي تنعدم عنده الممانعة الكهربائية تماماً لتصبح صفراً'
          ],
          optionsEn: [
            'The depth where eddy current density drops to 37% (1/e) of its surface value',
            'The absolute maximum reach of ultrasonic sound',
            'The surface paint thickness only',
            'The depth where electrical impedance becomes zero'
          ],
          correctIndex: 0,
          explanationAr: 'عمق التغلغل القياسي δ هو العمق الفيزيائي الذي تتراجع عنده كثافة التيارات الدوامية المحتثة إلى 37% (أو 1/e) من قيمتها الابتدائية عند السطح الخارجي بفعل المقاومة وظاهرة الظاهرة السطحية.',
          explanationEn: 'Standard depth of penetration delta is the depth at which eddy current density decreases to 1/e (~37%) of its surface magnitude due to skin effect.'
        }
      }
    ]
  },

  // =========================================================================
  // 6. VISUAL TESTING TEXTBOOK (VT)
  // =========================================================================
  {
    id: 'book-vt',
    discipline: 'VT',
    colorTheme: {
      primary: 'text-cyan-400',
      gradient: 'from-[#07242d] via-[#0b3847] to-[#04151b]',
      border: 'border-cyan-500/40',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300',
      accent: 'border-cyan-400'
    },
    titleAr: 'المرجع الأكاديمي في الفحص البصري والهندسي (VT)',
    titleEn: 'Academic Textbook of Visual & Optical Testing (VT)',
    subtitleAr: 'البصريات، حدّة الإبصار، أجهزة القياس الميكانيكية، والفحص عن بعد RVI',
    subtitleEn: 'Optics, Vision Acuity, Mechanical Weld Gauges, and Remote Visual Inspection (RVI)',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 6,
    applicableStandards: ['ASME Sec V Art 9', 'AWS B1.11', 'ISO 17637', 'API 570', 'AWS D1.1'],
    coverSummaryAr: 'المرجع التأسيسي الأول لجميع طرق الفحص غير الإتلافي: المبادئ الفيزيائية للضوء والبصريات، شروط الرؤية المباشرة (24 بوصة وزاوية 30°)، أدوات قياس اللحام، والفحص البصري عن بعد بالبوروسكوب والفيديوسكوب.',
    coverSummaryEn: 'Foundational textbook covering light and optical principles, direct visual parameters (24 in, 30° minimum angle), precision weld gauges, and Remote Visual Inspection (RVI) with borescopes.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: فيزياء الضوء وحدّة الإبصار',
        chapterTitleEn: 'Chapter 1: Optics & Human Vision Physics',
        pageTitleAr: 'متطلبات الإضاءة (Lux) واختبارات الرؤية Jaeger J1 وSnellen',
        pageTitleEn: 'Illumination Limits (1076 Lux) & Vision Acuity Tests',
        contentAr: `يُعد الفحص البصري (Visual Testing - VT) الطريقة الأساسية والأولى في منظومة مراقبة الجودة الهندسية؛ حيث تسبق وترافق جميع طرق الفحص الأخرى.
المتطلبات الفيزيائية والمعيارية (ASME Section V Article 9):
1. شروط الفحص البصري المباشر (Direct Visual Examination):
   - مسافة الرؤية: يجب ألا تزيد المسافة بين عين المفتش والسطح المفحوص عن 24 بوصة (600 ملم تقريباً).
   - زاوية الرؤية: يجب ألا تقل زاوية خط النظر عن 30 درجة بالنسبة لمستوى السطح المفحوص لتفادي الانعكاسات المباشرة وضمان رؤية التضاريس.
2. شدة الإضاءة (Illumination):
   - الحد الأدنى لشدة الضوء على السطح المفحوص هو 100 foot-candles (ما يعادل 1076 Lux).
   - يتم التحقق من شدة الضوء باستخدام جهاز قياس الضوء (Calibrated Luxmeter) وتوثيقها في تقرير الفحص.
3. التأهيل البصري للمفتش (Vision Acuity):
   - حدة الرؤية القريبة: القدرة على قراءة حروف Jaeger J1 أو J2 على مسافة لا تقل عن 12 بوصة سنوياً.
   - تمييز الألوان: اختبار عمى الألوان (Ishihara Test) كل 3 سنوات للتمييز بين درجات التباين.`,
        contentEn: `Visual Testing (VT) is the primary NDT method, mandatory prior to any secondary method.
ASME Section V Article 9 parameters:
1. Direct Visual Constraints:
   - Eye-to-surface distance must not exceed 24 inches (600 mm).
   - Eye-to-plane angle must not be less than 30 degrees.
2. Illumination Level:
   - Minimum 100 foot-candles (1076 lux) on the inspection surface, verified via calibrated photometer.
3. Vision Qualification:
   - Near vision: Reading Jaeger J1 or J2 characters at 12 inches annually.
   - Color vision: Ishihara plate color discrimination verified triennially.`,
        keyPointsAr: [
          'الفحص البصري غير المباشر (Remote Visual Inspection - RVI) يُستخدم عندما يتعذر الوصول المباشر بالعين.',
          'شدة الإضاءة الضعيفة هي السبب الأول في إغفال الشروخ والعيوب السطحية الدقيقة.'
        ],
        keyPointsEn: [
          'Remote Visual Inspection (RVI) applies when physical access constraints prevent direct viewing.',
          'Substandard illumination is the leading cause of missed surface crack detections.'
        ],
        formula: {
          latex: 'E = \\frac{I}{d^2} \\cos \\theta \\quad [\\text{Lux}], \\quad 1\\text{ fc} = 10.76\\text{ Lux}',
          descriptionAr: 'قانون الإضاءة الساقطة E بدلالة شدة المصدر I والمسافة d وزاوية السقوط θ',
          descriptionEn: 'Illumination inverse square law E = (I / d²) * cos(theta)'
        }
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 2: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل محاكاة زاوية الرؤية وشدة الإضاءة في الفحص البصري',
        pageTitleEn: 'Visual Testing Angle & Illumination Compliance Virtual Lab',
        contentAr: `شغّل المعمل التفاعلي أدناه لتحديد مدى مطابقة ظروف الفحص البصري لكود ASME Sec V Art 9.
تحكم في مسافة عين المفتش، وزاوية الرؤية، وشدة الإضاءة باللوكس لمشاهدة التنبيه الفوري بالامتثال للمعايير أو مخالفة شروط التفتيش.`,
        contentEn: `Operate the interactive simulator below to evaluate ASME Sec V Art 9 visual compliance.
Adjust viewing distance, line-of-sight angle, and surface illumination lux to inspect real-time code compliance validation.`,
        experimentId: 'exp-vt-optics-lab'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: أدوات القياس الميكانيكية للحام',
        chapterTitleEn: 'Chapter 3: Mechanical Weld Inspection Gauges',
        pageTitleAr: 'محددات ومقاييس اللحام: Bridge Cam وHi-Lo وFillet Gauges',
        pageTitleEn: 'Precision Weld Gauges: Bridge Cam, Hi-Lo & Fillet Gauges',
        contentAr: `تعتمد دقة الفحص البصري لوصلات اللحام على استخدام مقاييس ميكانيكية دقيقة ومعايرة:
1. مقياس كامبريدج / بريدج كام (Bridge Cam Gauge):
   - أداة متعددة الاستخدامات تقيس:
     * زاوية شطب الحافة (Bevel Angle 0° to 60°).
     * عدم المحاذاة أو التفاوت الخارجي (Misalignment / High-Low).
     * ارتفاع تقوية تاج اللحام (Weld Reinforcement Height).
     * عمق التقويض (Undercut Depth).
     * أبعاد ساق اللحام التراكبي (Fillet Weld Leg Length).
2. مقياس هاي-لو (Hi-Lo Gauge):
   - مقياس مخصص لفحص ومحاذاة الأنابيب قبل اللحام؛ يقيس التفاوت الداخلي بين جداري الأنبوبين (Internal Misalignment) وعرض فتحة الجذر (Root Gap).
3. مقياس زاوية لحام الزاوية (Fillet Weld Gauge):
   - طقم شرائح لقياس حجم ساق اللحام والتقعر (Concavity) أو التحدب (Convexity) في لحامات الزاوية.`,
        contentEn: `Mechanical weld inspection relies on precision calibrated gauges:
1. Cambridge / Bridge Cam Gauge: Measures bevel angle, excess weld reinforcement height, undercut depth, and fillet leg length.
2. Hi-Lo Pipe Gauge: Measures internal and external pipe wall misalignment and root opening gap.
3. Fillet Weld Gauges: Measures concave and convex fillet weld throat and leg dimensions.`,
        keyPointsAr: [
          'يجب معايرة مقاييس اللحام دورياً والتأكد من عدم تآكل حواف القياس الحادة.',
          'عمق التقويض (Undercut) لا يجوز تقديره بالعين المجردة؛ بل يجب قياسه بالمقياس الإبري المعتمد.'
        ],
        keyPointsEn: [
          'Weld gauges must be verified periodically for zero-point accuracy and mechanical wear.',
          'Undercut depth must never be guessed visually; precision dial or needle gauges are required.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: الفحص البصري عن بعد (RVI)',
        chapterTitleEn: 'Chapter 4: Remote Visual Inspection (RVI)',
        pageTitleAr: 'البوروسكوب والفيديوسكوب وكاميرات الفحص الزاحفة في الأنابيب',
        pageTitleEn: 'Borescopes, Fiberscopes, Videoscopes & Pipe Crawlers',
        contentAr: `يُطبق الفحص البصري عن بعد (RVI) عندما تكون المنطقة المراد فحصها داخلية أو محصورة أو خطرة على حياة الإنسان:
1. البوروسكوب الصلب (Rigid Borescope):
   - أنبوب معدني يحتوي على عدسات بصرية زجاجية متتالية وألياف ضوئية لنقل الإضاءة. يعطي أعلى درجات النقاء البصري والوضوح، ولكنه يتطلب مساراً مستقيماً تماماً.
2. الفايبرسكوب المرن (Flexible Fiberscope):
   - حزمة مرنة من الألياف البصرية الزجاجية المتماسكة (Coherent Fiber Bundle) لنقل الصورة، وحزمة ألياف غير متماسكة لنقل الضوء. يُمكّن من تجاوز الانحناءات داخل الأنابيب.
3. الفيديوسكوب الرقمي المتقدم (Digital Videoscope):
   - مسبار مزود بكاميرا مجهرية رقمية (CCD / CMOS Sensor) فائقة الدقة في مقدمة المسبار مع إضاءة LED مدمجة ونظام توجيه رباعي الاتجاهات (4-Way Articulation).
   - تقنية القياس ثلاثي الأبعاد (3D Stereo / Phase Measurement): تتيح قياس طول وعمق الشروخ والتآكل بدقة ميكرونية مباشرة من خلال شاشة الفيديوسكوب.`,
        contentEn: `RVI inspects confined or hazardous internal spaces:
1. Rigid Borescope: Relay lenses in a stainless tube provide maximum optical clarity for straight paths.
2. Flexible Fiberscope: Coherent fiber-optic bundles navigate tortuous bends.
3. Digital Videoscope: High-resolution distal CMOS/CCD sensor with 4-way articulation and 3D Phase Point cloud measurement to size flaw length and depth in real-time.`,
        keyPointsAr: [
          'تُستخدم تقنية RVI على نطاق واسع في فحص شفرات توربينات الغاز، وأنابيب الغلايات، والمفاعلات الكيميائية دون تفكيكها.',
          'القياس بالليزر المدمج في الفيديوسكوب يمنع الخطأ في تقدير حجم الأجسام الغريبة داخل المعدات.'
        ],
        keyPointsEn: [
          'RVI enables internal examination of gas turbine blades and chemical reactors without costly teardown.',
          'Integrated stereo/phase measurement prevents optical distortion errors in flaw sizing.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: مراحل الفحص البصري للحام',
        chapterTitleEn: 'Chapter 5: Three Stages of Weld Visual Inspection',
        pageTitleAr: 'الفحص البصري قبل وأثناء وبعد عملية اللحام',
        pageTitleEn: 'Visual Quality Control: Prior, During & Post Welding',
        contentAr: `الفحص البصري عملية مستمرة تبدأ قبل إشعال قوس اللحام وتنتهي بعد اكتمال الوصلة:
1. قبل اللحام (Prior to Welding):
   - مراجعة مواصفة إجراءات اللحام المعتمدة (WPS) وشهادة تأهيل اللحام (WPQ).
   - فحص تجهيز حواف الشطب (Bevel Angle)، ونظافة الأخدود من الصدأ والزيوت، وقياس فتحة الجذر (Root Opening) ومحاذاة الأنابيب.
   - التحقق من درجة حرارة التسخين المسبق (Preheat Temperature) بمؤشرات التمبيلتيك (Tempilstik).
2. أثناء اللحام (During Welding):
   - فحص تمريرة الجذر (Root Pass) للتأكد من اكتمال التغلغل وعدم وجود شروخ.
   - التأكد من إزالة الخبث وتنظيف كل تمريرة قبل وضع التمريرة التالية (Inter-pass Cleaning).
   - مراقبة درجة حرارة التمريرات البينية (Inter-pass Temperature).
3. بعد اكتمال اللحام (Post-Welding):
   - فحص عرض وارتفاع تاج اللحام، وتجانسه مع المعدن الأساسي.
   - فحص مناطق أقدام اللحام (Weld Toes) للتأكد من خلوها من التقويض (Undercut) والشقوق وتطاير الخبث (Spatter).`,
        contentEn: `Three-stage visual inspection protocol:
1. Prior to Welding: Verify WPS/PQR credentials, bevel geometry, root face/gap, fit-up alignment, and preheat temperature.
2. During Welding: Inspect root pass for full penetration, verify slag removal between passes, and monitor interpass temperature limits.
3. Post-Welding: Evaluate weld profile, reinforcement height, transition blend, undercut, spatter, and weld toe cracking.`,
        keyPointsAr: [
          'أكثر من 80% من عيوب اللحام يمكن تلافيها بالفحص البصري الدقيق قبل وأثناء اللحام.',
          'لا يجوز طلاء اللحام أو تطبيق أي مادة عازلة قبل اكتمال وتوثيق الفحص البصري النهائي.'
        ],
        keyPointsEn: [
          'Over 80% of welding defects are preventable through rigorous pre-weld visual fit-up verification.',
          'No paint or primer may be applied until the final post-weld visual inspection is signed off.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: معايير القبول والرفض',
        chapterTitleEn: 'Chapter 6: Acceptance & Rejection Codes',
        pageTitleAr: 'حدود القبول البصري في ASME B31.3 وAWS D1.1 وAPI 1104',
        pageTitleEn: 'Visual Acceptance Thresholds: ASME B31.3 & AWS D1.1',
        contentAr: `معايير القبول البصري لوصلات اللحام:
1. الشقوق (Cracks):
   - مرفوضة قطعياً في جميع الكودات الإنشائية وكودات الأنابيب (ASME B31.3, AWS D1.1, API 1104) دون أي تسامح.
2. نقص الانصهار (Lack of Fusion):
   - مرفوض تماماً في الخدمة الحرجة وخدمة الموائع السامة (Normal & Severe Fluids).
3. التقويض (Undercut):
   - طبقاً لـ ASME B31.3 (الخدمة العادية): يُسمح بتقويض لا يتجاوز عمقه 1 ملم (1/32 بوصة) أو ربع سماكة الجدار (أيهما أقل).
   - طبقاً لـ AWS D1.1 (الأحمال الإستاتيكية): لا يتجاوز 1 ملم، ويُسمح حتى 1.6 ملم لطول إجمالي لا يتجاوز 50 ملم في كل 300 ملم لحام.
4. ارتفاع تقوية اللحام (Weld Reinforcement):
   - يحدد الكود حداً أقصى لارتفاع التاج (يتراوح عادة بين 1.5 ملم إلى 3 ملم حسب سماكة المادة) لتجنب تركيز الإجهادات الميكانيكية عند أقدام اللحام.`,
        contentEn: `Visual acceptance thresholds:
1. Cracks: Unconditionally rejected across all welding codes.
2. Lack of Fusion: Zero tolerance under ASME B31.3 Normal and Severe cyclic services.
3. Undercut:
   - ASME B31.3: Depth <= 1 mm (1/32 in) or <= t/4, whichever is less.
   - AWS D1.1 (Statically loaded): <= 1 mm; up to 1.6 mm permitted for cumulative length <= 50 mm in any 300 mm segment.
4. Reinforcement Crown Height: Limited to 1.5 - 3 mm depending on base metal thickness to avoid notch stress risers.`,
        keyPointsAr: [
          'زيادة ارتفاع تقوية اللحام عن الحد المسموح يُعتبر عيباً هندسياً مرفوضاً لأنه يمثل تركيزاً حاداً للإجهادات (Stress Concentration).',
          'عدم المحاذاة الداخلية (Internal Misalignment) يجب ألا تتجاوز 1.5 ملم في خطوط الأنابيب عالية الضغط.'
        ],
        keyPointsEn: [
          'Excessive weld reinforcement is a rejectable stress raiser notch flaw.',
          'Internal misalignment must remain <= 1.5 mm on high-pressure piping.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: أفضل الممارسات الميدانية',
        chapterTitleEn: 'Chapter 7: Field Best Practices',
        pageTitleAr: 'إرشادات مفتشي إنسكو لتوثيق تقارير الفحص البصري',
        pageTitleEn: 'INSCO Best Practices: Documentation & Visual Verification',
        contentAr: `إرشادات خبراء إنسكو للتفتيش البصري الاحترافي:
1. استخدام مقاييس مرجعية بجوار العيوب: عند تصوير أي عيب أو شرخ بالفيديوسكوب أو الكاميرا، ضع مسطرة قياس معدنية معتمدة بجوار العيب لإثبات أبعاده الحقيقية في التقرير.
2. فحص الزوايا المخفية بالمرايا التلسكوبية: استخدم مرآة فحص تلسكوبية قابلة للإمالة لفحص الوجه الخلفي للأنابيب والمناطق صعبة الوصول.
3. تجنب الخداع البصري: لمعان المعدن المصقول والخدوش السطحية قد تبدو كالشقوق؛ استخدم عدسة مكبرة (10x Magnifier) مع إضاءة جانبية مائلة (Oblique Lighting) لإبراز الظلال وكشف التضاريس الحقيقية للانقطاع.`,
        contentEn: `INSCO visual field inspection guidelines:
1. Scaling Standards: Always photograph indications alongside a certified scale to record exact physical length in reports.
2. Articulated Inspection Mirrors: Inspect back-faces and blind root areas using tiltable telescopic inspection mirrors.
3. Optical Discrimination: Polished scratch marks mimic cracks; inspect using a 10x illuminated magnifier with oblique directional lighting to cast revealing shadows.`,
        keyPointsAr: [
          'الإضاءة المائلة (Oblique Lighting) تكشف الشروخ السطحية الدقيقة التي تخفيها الإضاءة الرأسية المباشرة.',
          'تقرير الفحص البصري يجب أن يتضمن رقم الكود، تاريخ الفحص، اسم اللحام، والأدوات المستخدمة وأرقام معايرتها.'
        ],
        keyPointsEn: [
          'Oblique grazing lighting casts shadows that accentuate minute surface fissures.',
          'Inspection reports must identify WPS number, welder ID, gauge serials, and calibration dates.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في الفحص البصري والهندسي',
        pageTitleEn: 'Visual Testing Review Examination',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of visual testing engineering principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ما هي الحدود القصوى للمسافة والحدود الدنيا للزاوية في الفحص البصري المباشر طبقاً لـ ASME Section V Article 9؟',
          questionEn: 'What are the distance and angle requirements for direct visual inspection under ASME Section V Article 9?',
          optionsAr: [
            'المسافة لا تزيد عن 24 بوصة (600 ملم) وزاوية الرؤية لا تقل عن 30 درجة مع السطح',
            'المسافة لا تزيد عن 48 بوصة وزاوية الرؤية لا تقل عن 45 درجة',
            'المسافة لا تزيد عن 10 أمتار والزاوية عمودية 90 درجة فقط',
            'أي مسافة وأي زاوية مقبولة طالما توفرت نظارات طبية'
          ],
          optionsEn: [
            'Distance not exceeding 24 inches (600 mm) and angle not less than 30 degrees to the surface',
            'Distance not exceeding 48 inches and angle not less than 45 degrees',
            'Distance up to 10 meters with perpendicular angle only',
            'Any distance and angle as long as corrective lenses are worn'
          ],
          correctIndex: 0,
          explanationAr: 'ينص كود ASME Section V Article 9 صراحة على ألا تزيد مسافة عين المفتش عن سطح القطعة عن 24 بوصة (نحو 610 ملم)، وألا تقل زاوية خط النظر عن 30 درجة بالنسبة لمستوى السطح المفحوص.',
          explanationEn: 'ASME Sec V Art 9 explicitly specifies that inspector eye distance shall not exceed 24 inches (600 mm) at an angle of not less than 30 degrees to the surface examined.'
        }
      }
    ]
  },

  // =========================================================================
  // 7. MATERIALS & METALLURGY TEXTBOOK (MATERIALS)
  // =========================================================================
  {
    id: 'book-materials',
    discipline: 'MATERIALS',
    colorTheme: {
      primary: 'text-orange-400',
      gradient: 'from-[#381c07] via-[#52290a] to-[#211004]',
      border: 'border-orange-500/40',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-300',
      accent: 'border-orange-400'
    },
    titleAr: 'المرجع الأكاديمي في علم المواد وتشكيل العيوب (Materials & Flaws)',
    titleEn: 'Academic Textbook of Materials Science & Flaw Formation',
    subtitleAr: 'البنى البلورية، مخطط Fe-C، عيوب السباكة والتشكيل، وآليات تلف API 571',
    subtitleEn: 'Crystal Lattices, Fe-C Phase Diagram, Manufacturing Flaws & API 571 Damage',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 8,
    applicableStandards: ['API 571', 'ASME Sec IX', 'ASTM A370', 'API 579 FFS', 'NACE MR0175'],
    coverSummaryAr: 'مرجع علمي عميق يربط بين البنية المجهرية للمعادن وتكوين العيوب الصناعية: الشبكات البلورية (BCC, FCC, HCP)، مخطط طور الحديد والكربون، عيوب السباكة واللحام، وآليات التآكل والتلف أثناء الخدمة في مصافي النفط.',
    coverSummaryEn: 'Definitive engineering textbook connecting metallurgy to NDT flaw formation: crystal lattices, Fe-C equilibrium diagram, casting and welding flaws, and refinery in-service damage mechanisms per API 571.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: البنى البلورية ومخطط الحديد والكربون',
        chapterTitleEn: 'Chapter 1: Crystal Lattices & Fe-C Diagram',
        pageTitleAr: 'الشبكات البلورية ومراحل تحول الصلب (أوستنيت، فيريت، مارتنسيت)',
        pageTitleEn: 'BCC, FCC, BCT Crystal Structures & Steel Phase Transformations',
        contentAr: `تتكون المعادن في حالتها الصلبة من ترتيب هندسي ذري منتظم يُسمى الشبكة البلورية (Crystal Lattice):
1. المكعب ممركز الجسم (Body-Centered Cubic - BCC):
   - بنية ذرات الحديد في درجات الحرارة العادية (طور الفيريت Ferrite / α-iron).
   - يمتاز بصلادة جيدة ومغناطيسية قوية، ولكنه يتعرض لظاهرة التحول الهش عند درجات الحرارة المنخفضة (Ductile-to-Brittle Transition Temperature - DBTT).
2. المكعب ممركز الأوجه (Face-Centered Cubic - FCC):
   - بنية ذرات الحديد عند درجات الحرارة المرتفعة أعلى من 912°م (طور الأوستنيت Austenite / γ-iron) وكذلك الفولاذ الأوستنيتي المقاوم للصدأ (304 / 316L).
   - يمتاز بممطولية فائقة ومقاومة ممتازة للصدمات حتى درجات الصفر المطلق، وهو غير فيرومغناطيسي.
3. الرباعي ممركز الجسم (Body-Centered Tetragonal - BCT):
   - بنية طور المارتنسيت (Martensite) الناتج عن التبريد الفجائي السريع (Quenching) من طور الأوستنيت؛ حيث تنحبس ذرات الكربون مسببة إجهادات داخلية هائلة وصلادة فائقة وهشاشة حادة تستلزم المراجعة الحرارية (Tempering) والمعالجة بعد اللحام (PWHT).`,
        contentEn: `Solid metals solidify into repeating atomic lattices:
1. Body-Centered Cubic (BCC): Room temperature ferrite (alpha-iron). Highly magnetic, exhibiting ductile-to-brittle transition at low temperatures.
2. Face-Centered Cubic (FCC): High temperature austenite (gamma-iron) and 300-series stainless steels. Non-magnetic, highly ductile, excellent cryogenic toughness.
3. Body-Centered Tetragonal (BCT): Martensite formed by rapid quenching from austenite. Trapped carbon atoms distort the lattice, producing extreme hardness and severe brittleness, demanding tempering and PWHT.`,
        keyPointsAr: [
          'الفولاذ المقاوم للصدأ الأوستنيتي (FCC) غير مغناطيسي ولا يمكن فحصه بالجسيمات المغناطيسية (MT).',
          'التسخين المسبق (Preheat) يبطئ معدل التبريد ويمنع تشكل طور المارتنسيت الهش المسبب للشروخ الباردة.'
        ],
        keyPointsEn: [
          'Austenitic stainless steels (FCC) are non-magnetic, ruling out magnetic particle testing (MT).',
          'Preheating retards cooling rates, preventing formation of crack-susceptible martensite.'
        ]
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: التجربة التفاعلية الحية',
        chapterTitleEn: 'Chapter 2: Interactive Virtual Laboratory',
        pageTitleAr: 'معمل استكشاف مخطط طور الحديد والكربون ومراحل المعالجة الحرارية',
        pageTitleEn: 'Iron-Carbon Phase Diagram & Heat Treatment Virtual Lab',
        contentAr: `شغّل المعمل التفاعلي أدناه لدراسة تحولات البنية المجهرية للصلب.
تحكم في درجة الحرارة ونسبة الكربون (Carbon %) وشاهد تحول الفيريت والبيرلايت إلى أوستنيت ومارتنسيت، وتعرف على نطاقات درجات حرارة التسخين والمعالجة الحرارية بعد اللحام PWHT.`,
        contentEn: `Operate the interactive simulator below to explore steel phase transformations.
Adjust temperature and carbon content to observe microstructural transitions from ferrite/pearlite to austenite and martensite, highlighting PWHT stress relief bands.`,
        experimentId: 'exp-materials-phase-lab'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: عيوب السباكة والدرفلة والتشكيل',
        chapterTitleEn: 'Chapter 3: Casting, Forging & Rolling Discontinuities',
        pageTitleAr: 'تصنيف العيوب المتأصلة والتشكيلية: الانكماش، الصفائحية، والتطبق',
        pageTitleEn: 'Inherent & Wrought Flaws: Shrinkage Cavities, Seams, Laminations',
        contentAr: `تصنف العيوب الهندسية حسب مرحلة نشأتها:
1. العيوب المتأصلة في السباكة (Inherent Casting Discontinuities):
   - فجوات الانكماش (Shrinkage Cavities): تحدث نتيجة تقلص حجم المصهور عند تجمده داخل القالب دون تعويض كافٍ من المغذيات.
   - الخبث والشوائب غير المعدنية (Non-metallic Inclusions): أكسيد الحديد والرمل المحبوس في المصهور.
   - الوصلات الباردة (Cold Shuts): التحام غير مكتمل بين تيارين من المعدن المنصهر تقابلا عند درجات حرارة منخفضة جداً.
2. عيوب التشكيل والدرفلة والطرق (Wrought Discontinuities):
   - الانفصال الصفائحي (Laminations): انضغاط فجوات الانكماش والخبث داخل السبائك أثناء درفلتها لتصبح شقوقاً مستوية موازية لسطح الصفيحة.
   - الطيات السطحية والدروب (Laps & Seams): طيات ميكانيكية تحدث أثناء الدرفلة تضغط على السطح وتشكل شروخاً طولية موازية لاتجاه التشكيل.`,
        contentEn: `Discontinuities classified by origin:
1. Inherent Casting Discontinuities:
   - Shrinkage Cavities: Voids formed by volumetric contraction during metal solidification.
   - Non-Metallic Inclusions: Slag, oxide, or refractory sand entrapped in the melt.
   - Cold Shuts: Discontinuity formed when two streams of liquid metal fail to fuse seamlessly.
2. Wrought / Rolling Discontinuities:
   - Laminations: Flat, planar separations parallel to plate surfaces formed by flattening internal casting voids during rolling.
   - Laps & Seams: Surface longitudinal folds pressed into the metal during billet extrusion or rolling.`,
        keyPointsAr: [
          'الانفصال الصفائحي (Lamination) يُكتشف بالموجات فوق الصوتية بمحول مستقيم 0°، ولا يمكن كشفه بالتصوير الإشعاعي RT إذا كان موازياً للسطح.',
          'التمزق الصفائحي (Lamellar Tearing) يحدث أسفل وصلات اللحام التراكبية T-joints نتيجة إجهادات الانكماش في اتجاه السماكة Z-axis.'
        ],
        keyPointsEn: [
          'Laminations are detected via 0° straight beam UT; RT fails to resolve them when parallel to the plate plane.',
          'Lamellar tearing occurs beneath T-joints due to through-thickness weld shrinkage stresses.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: موسوعة عيوب اللحام الشاملة',
        chapterTitleEn: 'Chapter 4: Comprehensive Welding Flaws Catalog',
        pageTitleAr: 'شروخ الهيدروجين، نقص الانصهار، ونقص التغلغل',
        pageTitleEn: 'Hydrogen Induced Cracking, Lack of Fusion & Lack of Penetration',
        contentAr: `عيوب اللحام هي الأكثر شيوعاً في الصناعات النفطية:
1. الشقوق الهيدروجينية الباردة (Hydrogen-Induced Cold Cracking - HICC):
   - أخطر عيوب اللحام؛ تحدث في المنطقة المتأثرة بالحرارة (HAZ) بعد ساعات أو أيام من انتهاء اللحام (Delayed Cracking).
   - تتطلب ثلاثة شروط متزامنة: بنية مجهرية حساسة (مارتنسيت)، إجهادات شد متبقية عالية، وتواجد ذرات هيدروجين ذائبة (من رطوبة إلكترودات اللحام).
   - الوقاية: تجفيف ألكترودات اللحام في أفران خاصة، واستخدام التسخين المسبق (Preheat)، وتطبيق المعالجة الحرارية بعد اللحام PWHT.
2. نقص الانصهار (Lack of Fusion - LOF):
   - فشل التحام معدن اللحام مع المعدن الأساسي (Sidewall LOF) أو بين تمريرات اللحام المتعاقبة (Inter-run LOF) بسبب تيار لحام منخفض جداً أو سرعة انتقال عالية أو زاوية قطب خاطئة.
3. نقص التغلغل عند الجذر (Incomplete Penetration - LOP):
   - عدم وصول معدن اللحام لكامل عمق أخدود الجذر بسبب فتحة جذر ضيقة أو شفة جذر عريضة جداً.`,
        contentEn: `Welding defect mechanisms:
1. Hydrogen-Induced Cold Cracking (HICC): Delayed underbead cracking in the HAZ. Requires susceptible microstructure (martensite), tensile stress, and diffusible hydrogen from moist consumables. Prevented via low-hydrogen electrodes, preheat, and PWHT.
2. Lack of Fusion (LOF): Non-bonding between weld metal and parent groove sidewall due to insufficient heat input or improper electrode manipulation.
3. Incomplete Penetration (LOP): Failure of weld puddle to fuse completely through the root face aperture.`,
        keyPointsAr: [
          'فحص الـ NDT للشروخ الباردة يجب أن يتم بعد مرور 24 إلى 48 ساعة على الأقل من اكتمال اللحام للصلب عالي المقاومة.',
          'الشقوق ونقص الانصهار هي عيوب خطية مستوية مرفوضة قطعياً في جميع الكودات الهندسية.'
        ],
        keyPointsEn: [
          'NDT inspection for delayed hydrogen cracking must occur 24-48 hours after weld completion on high-strength steels.',
          'Cracks and fusion defects are rejectable planar flaws across all structural codes.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: آليات التلف أثناء الخدمة (API 571)',
        chapterTitleEn: 'Chapter 5: In-Service Damage Mechanisms (API 571)',
        pageTitleAr: 'التآكل تحت العزل CUI، التآكل الإجهادي SCC، والهجوم الهيدروجيني HTHA',
        pageTitleEn: 'API 571 Mechanisms: CUI, Stress Corrosion Cracking, HTHA',
        contentAr: `يحدد كود معهد البترول الأمريكي API 571 آليات التدهور والتلف التي تصيب المعدات والأنابيب في مصافي النفط:
1. التآكل تحت العزل (Corrosion Under Insulation - CUI):
   - تآكل خارجي حاد وشديد الخطورة يحدث عند تسرب مياه الأمطار أو الرطوبة تحت طبقات العزل الحراري للأنابيب الفولاذية في نطاق درجات الحرارة بين -4°م إلى 175°م (وذروته عند 100°م).
   - الفحص: يتم كشفه بالتصوير الإشعاعي المفتوح (Profile RT) أو الموجات فوق الصوتية الموجهة (GWT) أو النبضية الكهرومغناطيسية (PEC).
2. التآكل الإجهادي التشقيقي (Stress Corrosion Cracking - SCC):
   - شروخ شجرية مجهرية سريعة ومفاجئة تنشأ بتضافر إجهادات شد ميكانيكية مع بيئة أكالة مخصصة (مثل الكلوريدات مع الفولاذ الأوستنيتي، أو كبريتيد الهيدروجين الحامضي H₂S).
3. الهجوم الهيدروجيني عند درجات الحرارة العالية (High Temperature Hydrogen Attack - HTHA):
   - تفاعل ذرات الهيدروجين عند درجات حرارة وضغوط عالية مع كربيدات الفولاذ مكونة غاز الميثان (CH₄) الذي يتجمع في فجوات مجهرية تفجر المعدن من الداخل.`,
        contentEn: `Key API 571 damage mechanisms in oil & gas facilities:
1. Corrosion Under Insulation (CUI): Severe external wall loss caused by trapped moisture under thermal insulation jackets between -4°C and 175°C (peaking at ~100°C). Detected via Profile Radiography, Guided Wave UT (GWUT), and Pulsed Eddy Current (PEC).
2. Stress Corrosion Cracking (SCC): Rapid, highly branched brittle cracking driven by tensile stresses in specific corrosive environments (chlorides attacking stainless steel, wet H2S sulfide cracking).
3. High Temperature Hydrogen Attack (HTHA): Diffused hydrogen reacts with metal carbides at high temperature/pressure to produce methane gas (CH4), inducing sub-surface micro-fissuring.`,
        keyPointsAr: [
          'آلية CUI مسؤولة عن أكثر من 40% من حالات تسريب الأنابيب المفاجئة في مصافي النفط العالمية.',
          'منحنيات نيلسون (Nelson Curves) في مواصفة API 941 تحكم الحدود الآمنة للصلب لتفادي HTHA.'
        ],
        keyPointsEn: [
          'CUI accounts for over 40% of unpredicted piping leaks in global petrochemical complexes.',
          'Nelson Curves in API 941 delineate safe operating temperature and hydrogen partial pressure limits to prevent HTHA.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: المعالجة الحرارية بعد اللحام (PWHT)',
        chapterTitleEn: 'Chapter 6: Post Weld Heat Treatment (PWHT)',
        pageTitleAr: 'تخفيف الإجهادات المتبقية ومنحنى المعالجة الحرارية المعياري',
        pageTitleEn: 'Residual Stress Relief & Standard ASME PWHT Thermal Cycle',
        contentAr: `المعالجة الحرارية بعد اللحام (Post Weld Heat Treatment - PWHT):
عملية تسخين محكومة تخضع لها الوصلة الملحومة لتقليل الإجهادات المتبقية المتولدة عن انكماش اللحام، وتخفيض صلادة المنطقة المتأثرة بالحرارة (HAZ)، وزيادة المتانة ومقاومة التآكل الإجهادي.
منحنى المعالجة الحرارية المعياري (طبقاً لـ ASME Section VIII Div 1 UCS-56):
1. معدل التسخين (Heating Rate): لا يتجاوز عادة 220°م/ساعة فوق 427°م (800°F).
2. درجة حرارة النقع والتثبيت (Soaking / Holding Temperature): تتراوح بين 595°م إلى 650°م (1100°F - 1200°F) لمعظم أنواع الفولاذ الكربوني P-No 1.
3. زمن التثبيت (Holding Time): ساعة واحدة لكل بوصة (25 ملم) من سماكة الجدار، بحد أدنى 15 دقيقة.
4. معدل التبريد المحكوم (Controlled Cooling Rate): لا يتجاوز 260°م/ساعة حتى الوصول لدرجة 427°م، ثم تبريد حر في الهواء الساكن.`,
        contentEn: `Post Weld Heat Treatment (PWHT) per ASME Section VIII UCS-56:
Relieves locked-in residual stresses from weld thermal contraction, tempers hard HAZ martensite, and restores fracture ductility.
Standard Cycle:
1. Heating Rate: Controlled to <= 220°C/hr above 427°C (800°F).
2. Soaking Temperature: 595°C to 650°C (1100°F - 1200°F) for P-No 1 carbon steels.
3. Soaking Time: 1 hour per inch (25 mm) of thickness, minimum 15 minutes.
4. Controlled Cooling Rate: <= 260°C/hr down to 427°C, followed by calm air cooling.`,
        keyPointsAr: [
          'إجراء فحص الصلادة (Hardness Testing) بعد الـ PWHT إلزامي للتأكد من ألا تتجاوز الصلادة 200 إلى 225 HB (برينل) طبقاً لـ NACE MR0175.',
          'التسخين أو التبريد السريع جداً يولد صدمة حرارية وإجهادات تفوق الإجهادات الأصلية!'
        ],
        keyPointsEn: [
          'Post-PWHT hardness testing is mandatory; maximum hardness must remain <= 200-225 HB per NACE MR0175.',
          'Excessive heating or cooling rates cause thermal shock and crack induction.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: أفضل الممارسات الميدانية',
        chapterTitleEn: 'Chapter 7: Field Best Practices',
        pageTitleAr: 'إرشادات مفتشي إنسكو لفحص التآكل وتقدير العمر المتبقي',
        pageTitleEn: 'INSCO Best Practices: Corrosion Rate & Remaining Life',
        contentAr: `إرشادات خبراء إنسكو في فحص وتقييم تدهور المواد:
1. مراقبة معدل التآكل (Corrosion Rate - CR):
   - قِس السماكة الفعلية عند نقاط قياس محددة وثابتة (Condition Monitoring Locations - CMLs) دورياً بالموجات فوق الصوتية.
   - احسب معدل التآكل: CR = (السماكة السابقة - السماكة الحالية) / عدد السنوات.
2. حساب العمر المتبقي (Remaining Life - RL):
   - RL = (السماكة الحالية - أدنى سماكة مسموحة في الكود t_min) / معدل التآكل.
   - إذا كان العمر المتبقي أقل من سنتين، يجب اتخاذ إجراءات إصلاح فورية أو تخفيض ضغط التشغيل المصرح به (Derating).`,
        contentEn: `INSCO asset integrity engineering practices:
1. Corrosion Rate (CR) Calculation:
   - Perform periodic precision ultrasonic thickness gauging at fixed Condition Monitoring Locations (CMLs).
   - CR = (t_previous - t_actual) / years elapsed.
2. Remaining Life (RL) Calculation:
   - RL = (t_actual - t_minimum_required) / Corrosion Rate.
   - If RL < 2 years, immediate replacement, weld overlay repair, or pressure de-rating is legally required.`,
        keyPointsAr: [
          'يجب استخدام مجسات حرارية مخصصة (High-Temperature Probes) وسوائل تلامس سيليكونية عند قياس السماكة على خطوط ساخنة تتجاوز 100°م.',
          'حساب أدنى سماكة مسموحة t_min يتم وفق معادلة برنشتاين للأوعية المضغوطة في ASME Sec VIII.'
        ],
        keyPointsEn: [
          'High-temperature dual transducers and silicone couplants are mandatory for pipes > 100°C.',
          'Minimum allowable thickness t_min is determined using ASME Section VIII hoop stress calculations.'
        ],
        formula: {
          latex: '\\text{Remaining Life } = \\frac{t_{\\text{actual}} - t_{\\text{min}}}{\\text{Corrosion Rate}}',
          descriptionAr: 'معادلة حساب العمر المتبقي للمعدات والأنابيب النفطية طبقاً لمواصفة API 510/570',
          descriptionEn: 'API 510/570 remaining operational life equation'
        }
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في علم المواد وتشكيل العيوب',
        pageTitleEn: 'Materials Science & Flaw Formation Review Exam',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of materials science and metallurgy principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ما هي الشروط الثلاثة المتزامنة اللازمة لحدوث الشروخ الهيدروجينية الباردة (HICC) في المنطقة المتأثرة بالحرارة (HAZ)؟',
          questionEn: 'What are the three concurrent conditions required to produce Hydrogen-Induced Cold Cracking (HICC)?',
          optionsAr: [
            'بنية مجهرية حساسة صلدة (مارتنسيت)، إجهادات شد متبقية عالية، وتواجد ذرات هيدروجين ذائبة',
            'درجة حرارة منخفضة جداً، غاز الأرجون، ومعدن النحاس',
            'سرعة لحام بطيئة، تيار مستمر، وطلاء زنك',
            'ضغط جوي مرتفع، رطوبة منخفضة، وفولاذ أوستنيتي'
          ],
          optionsEn: [
            'Susceptible microstructure (martensite), high residual tensile stress, and diffusible hydrogen',
            'Extremely low cryogenic temperature, argon gas, and pure copper',
            'Slow travel speed, DC current, and zinc primer',
            'High atmospheric pressure, low humidity, and austenitic stainless steel'
          ],
          correctIndex: 0,
          explanationAr: 'تحدث الشروخ الهيدروجينية الباردة (HICC / Delayed Cracking) عند اجتماع ثلاثة عوامل متزامنة: 1. بنية مجهرية هشة قابلة للكسر (مارتنسيت)، 2. إجهادات شد داخلية متبقية ناجمة عن انكماش اللحام، 3. تركيز كافٍ من ذرات الهيدروجين الذائبة المنتشرة في المعدن.',
          explanationEn: 'Hydrogen-induced cracking requires the simultaneous presence of: 1. A susceptible brittle microstructure (untempered martensite), 2. High residual tensile stress, and 3. Sufficient diffusible hydrogen.'
        }
      }
    ]
  },

  // =========================================================================
  // 8. INTRODUCTION TO NDT & GLOBAL STANDARDS TEXTBOOK (INTRO)
  // =========================================================================
  {
    id: 'book-intro',
    discipline: 'INTRO',
    colorTheme: {
      primary: 'text-purple-400',
      gradient: 'from-[#2c0e3d] via-[#41145a] to-[#170621]',
      border: 'border-purple-500/40',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-300',
      accent: 'border-purple-400'
    },
    titleAr: 'المرجع الأكاديمي في مدخل وفلسفة الاختبارات غير الإتلافية والمعايير العالمية',
    titleEn: 'Academic Textbook of NDT Scope, Philosophy & Global Standards',
    subtitleAr: 'منظومات التأهيل، الكودات العالمية، ميكانيكا الكسر، وتقييم الصلاحية للخدمة FFS',
    subtitleEn: 'Personnel Qualification, Global Codes, Fracture Mechanics & Fitness-for-Service',
    edition: 'الطبعة الهندسية المعتمدة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 6,
    applicableStandards: ['ASNT SNT-TC-1A', 'ASNT CP-189', 'ISO 9712', 'ASME Sec V', 'API 579 FFS'],
    coverSummaryAr: 'المدخل الشامل لمهندسي وفاحصي NDT: الفلسفة الهندسية للاختبار والتقييم، الفرق المعياري بين NDT وNDI وNDE، منظومات التأهيل والشهادات الدولية (ASNT وISO 9712)، ومصفوفة اختيار طرق الفحص.',
    coverSummaryEn: 'Foundational textbook covering NDT/NDI/NDE philosophy, international qualification frameworks (ASNT SNT-TC-1A, CP-189, ISO 9712), fracture mechanics, and engineering method selection.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: فلسفة التقييم غير الإتلافي ومستوياته',
        chapterTitleEn: 'Chapter 1: Philosophy & Tiers of NDT',
        pageTitleAr: 'الفرق المعياري بين مستويات NDT وNDI وNDE',
        pageTitleEn: 'The Three Progressive Tiers: NDT, NDI & NDE',
        contentAr: `علم التقييم غير الإتلافي منظومة متكاملة لحماية الأرواح والمنشآت وتمديد العمر التشغيلي للأصول الصناعية دون إتلافها.
يتدرج هذا العلم في ثلاثة مستويات هندسية:
1. الاختبار غير الإتلافي (Nondestructive Testing - NDT):
   - تطبيق الطرق الفيزيائية (صوت، إشعاع، مغناطيسية) للحصول على استجابات وإشارات (Indications).
2. الفحص والتفتيش الهندسي (Nondestructive Inspection - NDI):
   - مقارنة الدلالات المسجلة بحدود القبول والرفض المحددة في الكود الحاكم لتقرير ما إذا كانت القطعة مقبولة (Accept) أو مرفوضة (Reject).
3. التقييم الهندسي الشامل والسلامة الهيكلية (Nondestructive Evaluation - NDE):
   - أعلى المستويات الهندسية؛ حيث يتم قياس أبعاد العيب المرفوض بدقة (العمق والارتفاع والطول ثلاثي الأبعاد) وتطبيق معادلات ميكانيكا الكسر (Fracture Mechanics) وتقييم الصلاحية للخدمة (Fitness-for-Service FFS طبقاً لـ API 579) لتحديد ما إذا كان المكون قادراً على مواصلة الخدمة بأمان أم يجب استبداله فوراً.`,
        contentEn: `Nondestructive engineering encompasses three progressive tiers:
1. NDT (Testing): Physical application of methods to produce raw signals and indications.
2. NDI (Inspection): Comparing recorded indications against code acceptance standards to render pass/fail decisions.
3. NDE (Evaluation): High-level structural integrity assessment; measuring 3D flaw dimensions and applying fracture mechanics (API 579 Fitness-For-Service) to evaluate remaining operating life.`,
        keyPointsAr: [
          'الانقطاع (Discontinuity): أي تغير أو تشوه في تجانس البنية المعدنية.',
          'الدلالة (Indication): استجابة فيزيائية مسجلة تتطلب فحصاً لمعرفة سببها.',
          'العيب (Defect): انقطاع يتجاوز حدود القبول المسموحة في الكود ويستوجب الرفض والإصلاح.'
        ],
        keyPointsEn: [
          'Discontinuity: Any interruption in typical metallurgical structure.',
          'Indication: A detected physical response requiring investigation.',
          'Defect: A discontinuity that violates code acceptance criteria, mandating rejection.'
        ]
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: مصفوفة اختيار طريقة الفحص المثلى',
        chapterTitleEn: 'Chapter 2: Method Selection Decision Matrix',
        pageTitleAr: 'المزايا والقيود الهندسية لكل طريقة فحص ومناطق تطبيقها',
        pageTitleEn: 'Engineering Capabilities & Boundaries of NDT Methods',
        contentAr: `لا توجد طريقة فحص واحدة قادرة على كشف كل العيوب في كل المواد؛ اختيار الطريقة يحكمه موقع العيب ونوع المادة:
1. الشروخ السطحية المفتوحة:
   - السوائل النافذة (PT) لجميع المواد غير المسامية.
   - الجسيمات المغناطيسية (MT) للمعادن الفيرومغناطيسية فقط (أسرع وأدق من PT في الصلب).
   - التيارات الدوامية (ET) للأسطح المدهونة ومواسير المبادلات غير المغناطيسية.
2. العيوب الحجمية الداخلية (Volumetric Flaws):
   - التصوير الإشعاعي (RT) للمسامية والخبث ونقص التغلغل مع سجل فيلم دائم.
3. العيوب المستوية الشديدة الخطورة (Planar Flaws):
   - الموجات فوق الصوتية (UT / PAUT / TOFD) للشروخ ونقص الانصهار مع تحديد دقيق للعمق.
مبدأ الطرق المكملة (Complementary Methods):
في المشاريع الإستراتيجية كالمحطات النووية والمنصات البحرية، يُلزم الكود بالدمج بين طريقتين مكملتين (مثل VT + MT للسطح مع PAUT + TOFD للحجم).`,
        contentEn: `No single method detects all flaws; selection depends on defect orientation and metallurgy:
- Surface flaws: PT for all non-porous media; MT for ferromagnetic steel; ET for coated surfaces.
- Internal volumetric voids (gas, slag): Radiography (RT) provides permanent archived film records.
- Hazardous planar cracks/fusion defects: Ultrasonic testing (UT / PAUT / TOFD) delivers precise 3D volumetric sizing.
Complementary Methods: Critical nuclear and offshore assets mandate dual inspection (e.g. VT + MT for surfaces combined with PAUT + TOFD for volumetric inspection).`,
        keyPointsAr: [
          'تكلفة الفحص، وسهولة الوصول من جهة واحدة أو جهتين، ومخاطر السلامة الإشعاعية تحكم القرار النهائي.',
          'طريقة PAUT تحل محل التصوير الإشعاعي RT في العديد من المنشآت الحديثة لتفادي إخلاء الموقع ومخاطر الإشعاع.'
        ],
        keyPointsEn: [
          'Access constraints, cost, and radiation safety govern final method selection.',
          'Phased Array UT is increasingly replacing film RT to eliminate evacuation and radiation hazards.'
        ]
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: منظومات التأهيل والشهادات الدولية',
        chapterTitleEn: 'Chapter 3: Personnel Qualification Frameworks',
        pageTitleAr: 'المقارنة بين منظومة صاحب العمل (ASNT) والمنظومة المركزية (ISO 9712)',
        pageTitleEn: 'Employer-Based (SNT-TC-1A) vs Central Certification (ISO 9712)',
        contentAr: `تعتمد مصداقية الفحوصات غير الإتلافية على كفاءة المفتشين المؤهلين. وتوجد منظومتان رئيسيتان على مستوى العالم:
1. منظومة صاحب العمل (Employer-Based System - ASNT SNT-TC-1A / CP-189):
   - تضع الشركة وثيقة ممارسة مكتوبة (Written Practice) تعتمدها إدارة الشركة ومفتش المستوى الثالث (Level III).
   - يتم تدريب واختبار الموظف ومنحه الشهادة باسم الشركة؛ وتنتهي صلاحية الشهادة عند مغادرة الموظف للشركة.
2. منظومة الاعتماد المركزي المستقلة (Central Certification - ISO 9712 / EN 473):
   - يتم تدريب المفتش واختباره في مركز اختبار وطني معتمد مستقلاً عن الشركة.
   - تمنح الشهادة باسم المفتش وتبقى سارية المفعول معه أينما انتقل طالما حافظ على تجديدها دورياً كل 5 سنوات.
المستويات الثلاثة للتأهيل:
- المستوى الأول (Level I): مؤهل لإعداد الأجهزة والمعايرة وإجراء الفحص تحت إشراف مباشر.
- المستوى الثاني (Level II): مؤهل لإعداد الأجهزة وإجراء الفحص وتفسير وتقييم النتائج وكتابة التقارير وتدريب المستوى الأول.
- المستوى الثالث (Level III): أعلى المستويات؛ مؤهل لتطوير الإجراءات الهندسية، واختيار الطرق، واعتماد المعايير وإجراء اختبارات تأهيل المفتشين.`,
        contentEn: `Two globally accredited qualification schemes:
1. Employer-Based (ASNT SNT-TC-1A / CP-189):
   - Governed by the employer's approved Written Practice.
   - Certification is issued by the employer and expires when leaving the company.
2. Central Independent Certification (ISO 9712 / EN 473):
   - Certified via independent accredited third-party national bodies.
   - Portable with the inspector globally across employers, renewed every 5 years.
Three Certification Tiers:
- Level I: Setup, calibrate, and perform tests under supervision; cannot evaluate pass/fail.
- Level II: Calibrate, inspect, interpret, evaluate results against code, and train Level I personnel.
- Level III: Develop and approve NDT procedures, select inspection techniques, and certify personnel.`,
        keyPointsAr: [
          'لا يجوز لمفتش المستوى الأول (Level I) توقيع تقارير القبول والرفض النهائية.',
          'مفتش المستوى الثاني (Level II) هو العمود الفقري المعتمد للتفتيش الهندسي الميداني.'
        ],
        keyPointsEn: [
          'Level I personnel are legally prohibited from signing final pass/fail code evaluation reports.',
          'Level II inspectors represent the core operational backbone of field engineering inspection.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: ميكانيكا الكسر والتقييم للخدمة (FFS)',
        chapterTitleEn: 'Chapter 4: Fracture Mechanics & Fitness-For-Service',
        pageTitleAr: 'معادلات جريفيث، شدة الإجهاد K_I، ومواصفة API 579',
        pageTitleEn: 'Griffith Theory, Stress Intensity K_IC & API 579 Engineering',
        contentAr: `ميكانيكا الكسر الخطية المرنة (Linear Elastic Fracture Mechanics - LEFM):
العلم الذي يدرس سلوك المواد التي تحتوي على شروخ حقيقية تحت تأثير الأحمال الميكانيكية.
1. معامل شدة الإجهاد (Stress Intensity Factor - K_I):
   - مقياس لتركيز الإجهادات عند رأس أو طرف الشق: K_I = Y × σ × √(π × a)، حيث σ هو إجهاد الشد الاسمي، وa هو نصف طول الشق، وY هو معامل هندسي.
2. متانة الكسر للمادة (Fracture Toughness - K_IC):
   - خاصية ميكانيكية متأصلة في الخامة تمثل أقصى إجهاد يمكن لطرف الشق تحمله قبل حدوث الانهيار المفاجئ الكارثي (Unstable Brittle Fracture).
3. معيار الأمان في التقييم الهندسي:
   - طالما أن K_I < K_IC، فإن الشق مستقر ولا ينتشر فجأة.
   - إذا ارتفع K_I ليصل إلى K_IC، ينتشر الشق بسرعة الصوت ويحدث انفجار المكون أو انهيار الجسر أو الخزان!
تقييم الصلاحية للخدمة (API 579 / ASME FFS-1):
منهجية معتمدة تمكن مهندسي إنسكو من إعادة تقييم المعدات التي تحتوي على عيوب لحام أو تآكل مرفوض معيارياً وإثبات إمكانية تشغيلها بأمان بتخفيض الضغط أو فترات فحص متقاربة دون تكبد تكاليف التوقف والإصلاح غير الضرورية.`,
        contentEn: `Linear Elastic Fracture Mechanics (LEFM):
1. Stress Intensity Factor (K_I): Measures stress concentration at crack tips:
   K_I = Y * sigma * sqrt(pi * a), where sigma is nominal tensile stress, a is crack length, and Y is shape factor.
2. Fracture Toughness (K_IC): Inherent material property representing critical stress intensity threshold for catastrophic fracture.
3. Stability: Flaws remain stable as long as K_I < K_IC. When K_I reaches K_IC, rapid catastrophic brittle fracture occurs.
API 579 / ASME FFS-1 Fitness-For-Service:
Rigorous quantitative evaluation methodology determining whether in-service damaged components can continue safe operation under revised pressure/temperature ratings.`,
        keyPointsAr: [
          'الشقوق الحادة العميقة ترفع قيمة K_I أسرع بكثير من العيوب الدائرية كالمسامية.',
          'المعالجة بعد اللحام PWHT تخفض إجهادات الشد σ، مما يقلل K_I ويمنع الكسر الهش.'
        ],
        keyPointsEn: [
          'Sharp linear cracks amplify K_I exponentially compared to blunt rounded porosity.',
          'PWHT relaxes residual tensile stresses (sigma), decreasing K_I to prevent brittle fracture.'
        ],
        formula: {
          latex: 'K_I = Y \\cdot \\sigma \\sqrt{\\pi a} \\le K_{IC}',
          descriptionAr: 'معامل شدة الإجهاد K_I ومقارنته بمتانة الكسر الحرجة للمادة K_IC',
          descriptionEn: 'Stress intensity factor equation K_I <= K_IC'
        }
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: منظومة الكودات والمواصفات الدولية',
        chapterTitleEn: 'Chapter 5: International Engineering Codes',
        pageTitleAr: 'خارطة الكودات العالمية: ASME وAPI وAWS وASTM وISO',
        pageTitleEn: 'Global Standards Roadmap: ASME, API, AWS, ASTM & ISO',
        contentAr: `تخضع أعمال التفتيش غير الإتلافي لمنظومة كودات إلزامية وقانونية دولية:
1. كود الجمعية الأمريكية للمهندسين الميكانيكيين (ASME Boiler & Pressure Vessel Code):
   - ASME Section V: الكود المرجعي العام لجميع طرق NDT (إجراءات ومعدات ومعايرة).
   - ASME Section VIII: أوعية الضغط الصناعية ومعايير القبول والرفض الإلزامية.
   - ASME B31.1 & B31.3: أنابيب محطات الطاقة وأنابيب المصافي والمصانع البتروكيماوية.
   - ASME Section IX: تأهيل لحامي ومواصفات إجراءات اللحام (WPS / PQR).
2. كود معهد البترول الأمريكي (API):
   - API 1104: خطوط أنابيب النفط والغاز العابرة للحدود (Cross-country Pipelines).
   - API 510: فحص وصيانة أوعية الضغط أثناء الخدمة.
   - API 570: فحص خطوط الأنابيب أثناء الخدمة.
   - API 653: فحص وصيانة خزانات التخزين الكبرى فوق الأرض (Aboveground Storage Tanks).
3. كود جمعية اللحام الأمريكية (AWS):
   - AWS D1.1: كود اللحام الإنشائي للهياكل الصلبة والجسور والمباني.`,
        contentEn: `Hierarchy of governing international codes:
1. ASME Boiler & Pressure Vessel Code:
   - Section V: Universal NDT procedures, equipment, and calibration protocols.
   - Section VIII Div 1 & 2: Pressure vessel fabrication and acceptance standards.
   - B31.3: Process Piping; B31.1: Power Piping.
   - Section IX: Welding and Brazing Procedure (WPS/PQR) qualifications.
2. American Petroleum Institute (API):
   - API 1104: Cross-country pipelines.
   - API 510: In-service pressure vessel inspection.
   - API 570: In-service piping inspection.
   - API 653: Aboveground storage tank inspection.
3. American Welding Society (AWS):
   - AWS D1.1: Structural Welding Code - Steel.`,
        keyPointsAr: [
          'كود ASME Section V يحدد "كيف تفحص" (How to inspect)، بينما كود الإنشاء (ASME Sec VIII أو B31.3) يحدد "حدود القبول والرفض" (Accept/Reject limits).',
          'لا يجوز إجراء أي فحص NDT دون وجود إجراء هندسي معتمد (Approved NDT Procedure) مبني على كود الإنشاء المطلوب.'
        ],
        keyPointsEn: [
          'ASME Section V details "how to inspect", while construction codes (Sec VIII, B31.3) dictate "acceptance criteria".',
          'No NDT examination is legally valid without a written, approved procedure compliant with project specifications.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: أفضل الممارسات الميدانية',
        chapterTitleEn: 'Chapter 6: Field Best Practices',
        pageTitleAr: 'إرشادات إنسكو لمراجعة واعتماد إجراءات التفتيش المكتوبة',
        pageTitleEn: 'INSCO Best Practices: Writing & Auditing Written Procedures',
        contentAr: `إرشادات خبراء إنسكو لاعتماد الإجراءات الفنية المكتوبة (Written NDT Procedures):
1. المتغيرات الجوهرية (Essential Variables):
   - يجب أن يحدد الإجراء جميع المتغيرات الجوهرية التي يؤثر أي تعديل فيها على نتائج الفحص (مثل نوع الجهاز، نوع المحول، زاوية الفحص، عائلة السوائل النافذة، مسافة المصدر الإشعاعي، أو جهد التشغيل).
   - أي تغيير في متغير جوهري يتطلب إعادة تأهيل الإجراء المكتوب واعتماده مجدداً من مفتش المستوى الثالث (Level III).
2. توثيق السجلات والتقارير:
   - يجب أن يتضمن تقرير الفحص المعتمد: رقم الإجراء المكتوب، ورقم الكود وتاريخ إصداره، وأرقام المعايرة التسلسلية للأجهزة، وسماكة القطعة ومادتها، ورسم تخطيطي يوضح موقع العيوب بالنسبة لنقطة الصفر المرجعية (Datum Point).`,
        contentEn: `INSCO procedural guidelines:
1. Essential Variables: Procedures must identify essential variables (probe frequency, angle, penetrant family, source focal distance). Any change in an essential variable mandates procedure requalification by a Level III.
2. Reporting Traceability: Reports must log procedure revision, code edition, equipment serials, calibration expiry, part thickness, and exact flaw coordinate sketches relative to reference datums.`,
        keyPointsAr: [
          'اعتماد إجراء التفتيش المكتوب من قبل المستوى الثالث (Level III) هو شرط قانوني في جميع مشاريع إنسكو.',
          'التقارير الهندسية غير مكتملة البيانات تفقد قيمتها القانونية في نزاعات التحكيم والتأمين.'
        ],
        keyPointsEn: [
          'Level III written approval of inspection procedures is a statutory contractual requirement.',
          'Incomplete inspection reports are legally void in industrial arbitration and insurance claims.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: مستقبل NDT والتحول الرقمي',
        chapterTitleEn: 'Chapter 7: Future of NDT & Digital Transformation',
        pageTitleAr: 'التوأم الرقمي، التصوير الرقمي، والذكاء الاصطناعي في تفسير الإشارات',
        pageTitleEn: 'Digital Twins, Computed Radiography & AI Flaw Recognition',
        contentAr: `يشهد قطاع التقييم غير الإتلافي ثورة تقنية متسارعة (NDT 4.0):
1. التصوير الإشعاعي الرقمي (Digital & Computed Radiography - DR / CR):
   - الاستغناء التام عن الأفلام الحساسة والمواد الكيميائية في التحميض؛ واستخدام لواقط رقمية مسطحة (Flat Panel Detectors - DDA) تنقل الصورة الإشعاعية بجودة فائقة في ثوانٍ معدودة.
2. مصفوفات الموجات الطورية المتقدمة (Full Matrix Capture - FMC / TFM):
   - تسجيل إشارات جميع عناصر المصفوفة بشكل مستقل وتجميعها حاسوبياً بتقنية تركيز المصفوفة الإجمالي (TFM) لرسم صور ثلاثية الأبعاد بدقة واقعية تفوق أي مسح تقليدي.
3. الذكاء الاصطناعي وتحليل الإشارات (AI-Assisted Defect Sizing):
   - خوارزميات رؤية حاسوبية مدربة على ملايين الصور الإشعاعية وإشارات A-Scan لمساعدة المفتش على اكتشاف الشروخ الدقيقة وتصنيفها فورياً وتقليل الخطأ البشري.
4. التوأم الرقمي (Digital Twin):
   - ربط بيانات الفحص الحقيقية بنموذج ثلاثي الأبعاد للمنشأة لمتابعة معدلات التآكل وتوقع مواعيد الصيانة التنبؤية بدقة متناهية.`,
        contentEn: `The NDT 4.0 technological evolution:
1. Computed & Digital Radiography (CR / DR): Replaces wet chemicals with digital flat panel detectors (DDA), rendering real-time high-contrast radiographs in seconds.
2. Full Matrix Capture / Total Focusing Method (FMC / TFM): Captures all element signals independently to synthesize ultra-high resolution 3D volumetric images.
3. AI-Assisted Defect Recognition: Machine learning algorithms cross-check millions of A-Scans and radiographs to automate crack detection and eliminate human fatigue error.
4. Digital Twins: Integrates live field NDT data directly into 3D CAD facility models to project asset degradation predictive models.`,
        keyPointsAr: [
          'التقنيات الرقمية تقلل زمن الفحص بمقدار 70% وتوفر أرشيفاً إلكترونياً آمناً لا يتلف بمرور السنين.',
          'الذكاء الاصطناعي أداة مساعدة للمفتش لرفع الدقة، ولكن المسؤولية القانونية تظل على عاتق المفتش البشري المعتمد.'
        ],
        keyPointsEn: [
          'Digital NDT shortens turnaround by ~70% and enables cloud archiving.',
          'AI empowers inspectors with instant assist analytics, while legal liability remains with certified human Level II/III inspectors.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار الفهم والتقييم الذاتي',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فلسفة NDT والمعايير العالمية',
        pageTitleEn: 'NDT Philosophy & Global Standards Review Exam',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your mastery of NDT philosophy and international certification frameworks with this standardized review question.`,
        quizQuestion: {
          questionAr: 'ما هو الفارق الأساسي بين منظومة تأهيل المفتشين ASNT SNT-TC-1A ومنظومة ISO 9712 الدولية؟',
          questionEn: 'What is the governing distinction between ASNT SNT-TC-1A and ISO 9712 qualification frameworks?',
          optionsAr: [
            'منظومة SNT-TC-1A تعتمد على الشركة وصاحب العمل (Employer-based)، بينما ISO 9712 تعتمد على جهة وطنية مركزية مستقلة (Central certification)',
            'منظومة SNT-TC-1A مخصصة للفضاء فقط بينما ISO 9712 مخصصة للأخشاب',
            'منظومة ISO 9712 لا تتطلب أي امتحانات',
            'لا يوجد أي فرق وهما شهادة واحدة صادرة من نفس الجهة'
          ],
          optionsEn: [
            'SNT-TC-1A is employer-based under a company Written Practice, while ISO 9712 is an independent central certification',
            'SNT-TC-1A is for aerospace only while ISO 9712 is for wood products',
            'ISO 9712 requires no examinations',
            'There is no distinction, both are identical documents'
          ],
          correctIndex: 0,
          explanationAr: 'في منظومة ASNT SNT-TC-1A، تضع الشركة ممارستها المكتوبة ويمنح صاحب العمل الشهادة لموظفيه وتنتهي بمغادرتهم للشركة، بينما في ISO 9712 تمنح الشهادة من هيئة وطنية مركزية مستقلة وتبقى سارية المفعول مع المفتش أينما عمل.',
          explanationEn: 'Under SNT-TC-1A, the employer administers qualification via an internal Written Practice; ISO 9712 is centrally certified by an independent accredited body and remains portable with the individual.'
        }
      }
    ]
  },
  {
    id: 'book-paut-tofd',
    discipline: 'PAUT_TOFD',
    colorTheme: {
      primary: 'text-cyan-400',
      gradient: 'from-[#051c38] via-[#092d59] to-[#031326]',
      border: 'border-cyan-500/40',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300',
      accent: 'border-cyan-400'
    },
    titleAr: 'المرجع الأكاديمي في تقنيات الموجات الصوتية المتقدمة (PAUT & TOFD)',
    titleEn: 'Academic Textbook of Advanced Ultrasonic Testing (PAUT & TOFD)',
    subtitleAr: 'المصفوفات الطورية، قوانين البؤرة وتأخيرات الإطلاق، حيود قمة الشق، وتقدير الارتفاع الشاقولي',
    subtitleEn: 'Phased Array Architecture, Focal Delay Laws, Tip Diffraction, & Sizing Algorithms',
    edition: 'الطبعة الهندسية المتقدمة - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 12,
    applicableStandards: ['ASME Sec V Art 4', 'ASME Code Case 2235', 'ISO 13588', 'ISO 10863', 'API 1104 App A'],
    coverSummaryAr: 'مرجع هندسي شامل لتصميم محولات المصفوفة الطورية، توليد قوانين البؤرة، المسح القطاعي S-Scan والخطي E-Scan، أسس حيود وقت الطيران TOFD، انقلاب الطور الفيزيائي، وتقدير الارتفاع الشاقولي للشروخ.',
    coverSummaryEn: 'Comprehensive engineering textbook on phased array transducer design, focal law computation, S-Scan/E-Scan imaging, TOFD tip diffraction physics, phase inversion analysis, and ECA sizing.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: بنية محولات المصفوفة الطورية',
        chapterTitleEn: 'Chapter 1: Phased Array Transducer Architecture',
        pageTitleAr: 'المصفوفات البيزوكهربائية متعددة العناصر والتداخل البناء',
        pageTitleEn: 'Multi-Element Piezoelectric Arrays & Constructive Interference',
        contentAr: `تعتمد تقنية المصفوفات الطورية (Phased Array Ultrasonic Testing - PAUT) على استبدال المحول التقليدي أحادي البلورة بمصفوفة خطية أو مصفوفية تضم ما بين 16 و 128 عنصراً بيزوكهربائياً مستقلاً ومصفوفاً بدقة ميكرونية.

1. تباعد العناصر والخطوة (Pitch & Kerf):
   - يُعرّف عرض العنصر بـ (Element Width - e)، والفاصل العازل بين العناصر بـ (Kerf - g).
   - الخطوة الهندسية (Pitch - p): هي المسافة المركزية بين عنصر وآخر ($p = e + g$). للحد من تشكل فصوص التعرج غير المرغوبة (Grating Lobes)، تشترط معايير ASME ألا تتجاوز الخطوة نصف الطول الموجي ($p \le \lambda / 2$).
2. مبدأ هويغنز وتوليف الحزم (Huygens' Principle):
   - يعمل كل عنصر كمصدر نبضي لموجات كروية أولية.
   - من خلال التحكم في فارق التوقيت النانوي بين نبضات إثارة العناصر، تتداخل هذه الموجات الكروية بناءً (Constructive Interference) لتشكل جبهة موجة موحدة بالزاوية والعمق المرغوبين.
3. المزايا التشغيلية مقارنة بالفحص التقليدي:
   - مسح حجمي كامل لوصلة اللحام دون الحاجة لتحريك الإسفين ميكانيكياً للأمام والخلف.
   - تسجيل بيانات المسح الرقمية كاملة A-Scan لكل عنصر ونقطة زمنية لاسترجاعها والتحقق منها برمجياً.`,
        contentEn: `Phased Array Ultrasonic Testing (PAUT) replaces single-element crystals with multi-element piezoelectric arrays (typically 16 to 128 elements).

1. Pitch & Kerf Dimensions:
   - Element width (e) and acoustic isolating kerf (g) define element pitch: p = e + g.
   - To eliminate spurious grating lobes, standard ASME Sec V Art 4 guidelines recommend pitch p <= lambda / 2.
2. Huygens' Principle & Constructive Wavefront Synthesis:
   - Each element emits an elementary spherical wavelet.
   - By applying nanosecond-level time delays across pulser channels, wavefronts constructively interfere at prescribed refraction angles and focal depths.
3. Operational Advantages over Conventional UT:
   - Rapid volumetric weld interrogation without physical raster scanning.
   - Complete unrectified A-scan RF data recording across every encoder position for regulatory archiving.`,
        keyPointsAr: [
          'شرط تجنب فصوص التعرج (Grating Lobes) هو أن تكون الخطوة p أقل من أو تساوي نصف الطول الموجي λ/2.',
          'تتولد الحزمة الموجية الموجهة بواسطة التداخل البنّاء للموجات الكروية الفردية الناتجة عن كل عنصر.'
        ],
        keyPointsEn: [
          'Grating lobes are suppressed when element pitch p <= lambda / 2.',
          'Synthesized directional beams result from constructive interference of individual element wavelets.'
        ]
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: قوانين البؤرة وتأخيرات الطور',
        chapterTitleEn: 'Chapter 2: Focal Laws & Delay Timing Synthesis',
        pageTitleAr: 'الحسابات الرياضية لتوجيه وتركيز الحزمة الصوتية',
        pageTitleEn: 'Mathematical Modeling of Beam Steering & Electronic Focusing',
        contentAr: `قانون البؤرة (Focal Law) هو مصفوفة الأزمنة المحسوبة حاسوبياً لكل عنصر من عناصر المصفوفة لتوليد حزمة بالزاوية $\theta$ وتركيزها عند المسافة البؤرية $F$.

1. معادلة التوجيه الزاوي (Steering Delay):
   - لحرف الحزمة بزاوية $\theta$ بالنسبة للتعامد في وسط سرعته $c$، يكون التأخير الزمني للعنصر رقم $n$ ذي الموضع $x_n$:
     $$\Delta t_n = \frac{x_n \cdot \sin(\theta)}{c}$$
2. معادلة التركيز البؤري (Focusing Delay):
   - لتركيز الحزمة عند نقطة تبعد مسافة $F$ بزاوية $\theta$، يضاف تأخير انحناء مقوس تربيعي يضمن وصول نبضات جميع العناصر إلى النقطة المستهدفة في اللحظة الزمنية ذاتها تماماً.
3. فتحة العدسة الفعالة (Active Aperture):
   - تتحدد الفتحة النشطة ($A$) بعدد العناصر المشغلة ($N$) مضروبة في الخطوة ($p$).
   - كلما كبرت فتحة العدسة $A$، زاد طول المنطقة القريبة $N_{field} = \frac{A^2 \cdot f}{4 \cdot c}$ مما يسمح بتركيز الحزمة على أعماق أكبر وبحزمة أضيق.`,
        contentEn: `A Focal Law is the programmatic delay profile assigned to individual elements to steer beam at angle theta and focus at depth F.

1. Steering Delay Equation:
   - Delta t_n = (x_n * sin(theta)) / c
2. Focusing Curvature:
   - Quadratic parabolic delays ensure wavelets from perimeter elements travel longer acoustic paths to arrive concurrently with center elements at focal point F.
3. Active Aperture (A):
   - A = N * p. Larger active apertures extend near-field length, enabling tighter focal waists at deeper through-wall depths.`,
        formula: {
          latex: '\\Delta t_n = \\frac{x_n \\cdot \\sin(\\theta)}{c} + \\frac{x_n^2 \\cdot \\cos^2(\\theta)}{2 \\cdot c \\cdot F}',
          descriptionAr: 'معادلة حساب تأخيرات الطور لقوانين البؤرة (Focal Law Delays) لتوجيه وتركيز حزمة PAUT',
          descriptionEn: 'Phased Array focal law delay equation for combined beam steering and focusing'
        },
        experimentId: 'exp-paut-beam-steering'
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: أنماط المسح التصويري المتقدم',
        chapterTitleEn: 'Chapter 3: Advanced Volumetric Imaging Scans',
        pageTitleAr: 'المسح القطاعي (S-Scan) والمسح الخطي (E-Scan) والإسقاطات المكانية',
        pageTitleEn: 'Sectorial S-Scan, Electronic Linear E-Scan, & C-Scan Mapping',
        contentAr: `توفر أجهزة PAUT الحديثة تمثيلاً بيانياً متزامناً للبيانات عبر محاور فراغية متعددة:

1. المسح القطاعي (Sectorial Scan / S-Scan):
   - تثبيت نفس فتحة العدسة وتغيير زاوية الانكسار إلكترونياً عبر مدى محدد (مثلاً من 40° إلى 70° بخطوة 1°).
   - يمثل العرض المثالي لفحص درزات اللحام ذات الحواف المشطوفة (V-Bevel) حيث تكشف الزوايا المختلفة أوجه الشطف وعدم الانصهار الجانبي بدقة فائقة.
2. المسح الخطي الإلكتروني (Electronic Linear Scan / E-Scan):
   - استخدام زاوية انكسار ثابتة (مثلاً 45° أو 0°) وتمرير فتحة العدسة النشطة افتراضياً عبر طول المصفوفة عن طريق تبديل مجموعات العناصر المتعاقبة.
3. الربط مع المشفر الحركي (Encoder Synchronization):
   - ربط مجس الفحص بعجلة مشفرة بصرية تسجل الإحداثيات المكانية الدقيقة لكل مليمتير من مسار اللحام، لإنتاج خرائط C-Scan و B-Scan حجمية حقيقية قابلة لإعادة الفحص الرقمي.`,
        contentEn: `Modern phased array instruments display synchronized real-time multi-view volumetric data:

1. Sectorial Scan (S-Scan):
   - Steers across sweeping angles (e.g. 40° to 70° in 1° steps) from a stationary probe position.
   - Ideal for weld bevel inspection, catching lack of side-wall fusion regardless of bevel prep geometry.
2. Electronic Linear Scan (E-Scan):
   - Multiplexes a fixed-angle sub-aperture along array length, replicating a raster mechanical scan electronically.
3. Encoder Position Synchronization:
   - Optical position encoders correlate precise probe positional coordinates with high-density RF A-scans to synthesize calibrated C-scan top-down maps and B-scan side elevations.`,
        keyPointsAr: [
          'المسح القطاعي S-Scan يغطي زوايا من 40° إلى 70° من موقع ثابت مما يضمن تعامداً مثالياً مع شطبات اللحام.',
          'استخدام المشفر الحركي (Encoder) إلزامي في كودات ASME لاعتماد المسح كفحص نصف آلي معتمد وقابل للأرشفة.'
        ],
        keyPointsEn: [
          'S-Scan sweeps 40° to 70° from a single probe position for optimal sidewall fusion detection.',
          'Optical encoders are mandatory under ASME codes for semi-automated inspection repeatability.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: أسس تقنية حيود وقت الطيران (TOFD)',
        chapterTitleEn: 'Chapter 4: Time of Flight Diffraction (TOFD) Foundations',
        pageTitleAr: 'حيود قمة الشق وظاهرة انعكاس الطور الفيزيائي',
        pageTitleEn: 'Crack Tip Diffraction Phenomena & Phase Inversion Physics',
        contentAr: `تعتبر تقنية TOFD من أدق الوسائل غير الإتلافية على الإطلاق في تقدير الارتفاع الشاقولي للعيوب وتحديد مقاساتها الحقيقية، حيث لا تعتمد على سعة الإشارة الصوتية المنعكسة بل على زمن طيران الموجات المنحرفة عند نهايات الشروخ.

1. المبدأ الفيزيائي لحيود قمة الشق (Tip Diffraction):
   - عندما تصطدم حزمة الموجات فوق الصوتية الطولية عريضة الزاوية بنهاية الشق الحادة (Crack Tip)، تتصرف القمة كنقطة توليد جديدة تشتت موجات حيود كروية ضعيفة في كافة الاتجاهات.
2. ترتيب مجسات الإرسال والاستقبال (Pitch-Catch Configuration):
   - يوضع مجس إرسال ومجس استقبال بزوايا متقابلة ومسافة فصل مركزية محددة ($PCS$).
3. تسلسل وصول الإشارات على شاشة الفحص:
   - أولاً: الموجة الجانبية السطحية (Lateral Wave - LW) المنتشرة تحت السطح مباشرة بطور موجب (+).
   - ثانياً: إشارة حيود القمة العلوية للشرخ (Upper Tip) بطور معكوس سالب (-) نتيجة تفريغ الإجهاد عند طرف الشق.
   - ثالثاً: إشارة حيود القاع السفلي للشرخ (Lower Tip) بطور موجب (+).
   - رابعاً: صدى الجدار الخلفي (Backwall Echo - BW) بطور سالب (-).`,
        contentEn: `Time of Flight Diffraction (TOFD) provides the highest vertical sizing accuracy in NDT, relying entirely on diffraction wave transit time rather than reflected pulse amplitude.

1. Tip Diffraction Physics:
   - When a divergent longitudinal ultrasound beam strikes sharp crack extremities, tips act as Huygens secondary point emitters radiating weak spherical diffracted waves.
2. Pitch-Catch Geometry:
   - Opposed transmitter and receiver angle-beam transducers positioned at fixed Probe Center Separation (PCS).
3. Signal Arrival Sequence & Phase Signatures:
   - 1st: Lateral Wave (LW) traveling beneath scan surface (Phase +).
   - 2nd: Upper Flaw Tip with physical 180° phase inversion (Phase -).
   - 3rd: Lower Flaw Tip (Phase +).
   - 4th: High-amplitude specular Backwall Echo (Phase -).`,
        formula: {
          latex: 'd = \\frac{1}{2} \\sqrt{c^2 \\cdot t^2 - 4 \\cdot s^2}',
          descriptionAr: 'معادلة TOFD لحساب عمق الشق (d) من زمن الوصول (t) ونصف المسافة بين المجسين (s)',
          descriptionEn: 'TOFD depth sizing equation based on transit time t and half-PCS spacing s'
        },
        experimentId: 'exp-tofd-diffraction-lab'
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: تقدير مقاسات الشروخ بدقة ميكرونية',
        chapterTitleEn: 'Chapter 5: Flaw Height Sizing & Dead Zone Mitigation',
        pageTitleAr: 'حساب الارتفاع الشاقولي ومعالجة المناطق الميتة في TOFD',
        pageTitleEn: 'Through-Wall Height Sizing & Near-Surface Dead Zone Analysis',
        contentAr: `يتميز فحص TOFD بالاستقلالية التامة عن زاوية ميلان الشق، مما يجعله المعيار الذهبي لتقييم الصلاحية للخدمة (Engineering Critical Assessment - ECA).

1. حساب الارتفاع الشاقولي للشرخ ($\Delta d$):
   - يُحسب ارتفاع الشرخ الممتد عبر جدار المعدة بطرح عمق القمة العلوية من عمق القاع السفلي:
     $$\Delta d = d_{lower} - d_{upper} = \frac{1}{2} \\left( \\sqrt{c^2 t_{lower}^2 - 4 s^2} - \\sqrt{c^2 t_{upper}^2 - 4 s^2} \\right)$$
   - تصل دقة تحديد الارتفاع إلى $\pm 0.3$ ملم في الفحوصات المعيارية المحكومة.
2. المناطق الميتة (Dead Zones):
   - المنطقة الميتة السطحية (Surface Dead Zone): تقع أسفل السطح مباشرة وتختفي إشارات العيوب فيها تحت تذبذب الموجة الجانبية العريضة (LW).
   - المنطقة الميتة القاعية (Backwall Dead Zone): تقع فوق صدى القاع مباشرة وتتأثر بطول النبضة.
3. التوليف بين PAUT و TOFD:
   - تفرض المعايير الدولية الحديثة دمج تقنية PAUT لكشف عيوب السطح والقاع مع تقنية TOFD لحساب العمق والارتفاع الشاقولي للعيوب الداخلية لتحقيق تغطية فحص بنسبة 100%.`,
        contentEn: `TOFD is orientation-independent, serving as the benchmark inspection tool for Engineering Critical Assessments (ECA).

1. Through-Wall Height Sizing (Delta d):
   - Calculated precisely by resolving depth difference between lower tip and upper tip: Delta d = d_lower - d_upper.
   - Sizing repeatability routinely achieves +/- 0.3 mm in calibrated inspections.
2. Dead Zone Limitations:
   - Near-surface dead zone: masked by lateral wave ring-down duration.
   - Backwall dead zone: masked by finite pulse duration of backwall echo.
3. Hybrid PAUT + TOFD Tandem Systems:
   - Industry standards advocate combining PAUT (for near-surface and root coverage) with TOFD (for unmatched volumetric sizing accuracy).`,
        keyPointsAr: [
          'دقة قياس الارتفاع الشاقولي في تقنية TOFD تصل إلى ±0.3 ملم وهي غير مرتبطة بسعة أو سعة صدى العيب.',
          'الدمج بين PAUT و TOFD في مسار فحص واحد يوفر أعلى درجات الموثوقية الهندسية لاكتشاف وتوصيف العيوب.'
        ],
        keyPointsEn: [
          'Vertical sizing accuracy in TOFD reaches +/- 0.3 mm, completely amplitude-independent.',
          'Hybrid PAUT + TOFD deployment ensures 100% volumetric weld coverage with zero blind zones.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: معايرة وتأهيل أنظمة PAUT',
        chapterTitleEn: 'Chapter 6: Calibration & Qualification Protocols',
        pageTitleAr: 'تصحيح زمن الإسفين وسرعة الصوت ومخططات الحساسية TCG',
        pageTitleEn: 'Velocity, Wedge Delay, & Time Corrected Gain (TCG) Calibration',
        contentAr: `قبل الشروع في فحص وصلات اللحام، يفرض كود ASME Section V Article 4 تنفيذ سلسلة معايرات إلزامية مسجلة:

1. معايرة تأخير الإسفين (Wedge Delay Calibration):
   - قياس زمن انتقال الصوت داخل مادة الإسفين البلاستيكية لكل زاوية وعنصر، لضبط نقطة الصفر الحقيقية على سطح القطعة.
2. معايرة سرعة الصوت في المادة (Material Velocity):
   - التحقق من سرعة الموجة الطولية والقصية في كتلة المعايرة المماثلة حرارياً ومعدنياً لعينة الفحص.
3. منحنى الكسب المصحح زمنياً (Time Corrected Gain - TCG):
   - تصحيح التوهين الصوتي عبر العمق لضمان أن الثقوب متساوية القطر الجانبية (Side-Drilled Holes - SDH) على أعماق مختلفة تعطي سعة إشارة متطابقة (مثلاً 80% من ارتفاع الشاشة) عبر كافة الزوايا.
4. التحقق من المشفر الحركي (Encoder Calibration):
   - مسح مسافة معيارية محددة (مثل 500 ملم) والتأكد من ألا يتجاوز الخطأ المكاني $\pm 1\%$.`,
        contentEn: `Mandatory calibration protocols per ASME Section V Article 4:

1. Wedge Delay Calibration:
   - Compensates for individual element transit delays within acrylic wedge to zero reference probe contact face.
2. Material Velocity Verification:
   - Calibrates longitudinal/shear velocities on metallurgically matched calibration blocks.
3. Time Corrected Gain (TCG):
   - Equalizes side-drilled hole (SDH) peak amplitudes to 80% full screen height across all depth zones and steering angles.
4. Optical Encoder Calibration:
   - Verifies positional tracking over a 500 mm traverse within +/- 1% tolerance.`,
        keyPointsAr: [
          'معايرة TCG تضمن تكافؤ استجابة العيوب المتماثلة في الحجم بغض النظر عن عمق وجودها داخل المادة.',
          'تطابق كتلة المعايرة في المعالجة الحرارية والمعدنية مع المعدة المفحوصة شرط جوهري لمنع أخطاء السرعة والتوهين.'
        ],
        keyPointsEn: [
          'TCG calibration normalizes amplitude response for identical flaws regardless of through-wall depth.',
          'Calibration blocks must match production components acoustically and metallurgically.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: معايير قبول فحوصات PAUT و TOFD',
        chapterTitleEn: 'Chapter 7: Acceptance Standards & Code Clauses',
        pageTitleAr: 'اشتراطات كود ASME Section VIII و ASME B31.3 لاعتماد الفحص المتقدم',
        pageTitleEn: 'ASME Section VIII Div 1 & 2 Appendix 12 / Code Case 2235 Criteria',
        contentAr: `حلت فحوصات PAUT و TOFD رسمياً محل التصوير الإشعاعي (RT) في كودات أوعية الضغط وخطوط الأنابيب العالمية بموجب ASME Code Case 2235:

1. شروط استبدال الأشعة بالموجات فوق الصوتية المتقدمة:
   - تسجيل إلكتروني كامل للبيانات الخام (Raw A-Scan Data).
   - استخدام مسح آلي أو نصف آلي بمشفر مسار موثوق.
   - تأهيل الإجراء المكتوب بعينة تجريبية تحتوي على عيوب مدفونة حقيقية (Blind Demonstration Block).
2. معايير القبول المبنية على ميكانيكا الكسر (Fracture Mechanics Criteria):
   - تصنيف العيوب إلى عيوب سطحية (Surface-breaking) وعيوب مدفونة (Subsurface).
   - العيوب السطحية: ترفض إذا تجاوز ارتفاعها الشاقولي 2.5 ملم أو نسبة محددة من سماكة الجدار طبقاً لمنحنيات الكود.
   - العيوب المدفونة: يُسمح بارتفاعات أكبر للعيوب المدفونة المعزولة عن السطح إذا لم تكن قريبة من منطقة الإجهادات القصوى.`,
        contentEn: `Under ASME Code Case 2235 and Section VIII Div 2, automated PAUT/TOFD officially substitutes radiography:

1. Substitution Mandates:
   - 100% raw unrectified A-scan data digital archiving.
   - Encoded semi-automated/automated scanning mechanism.
   - Empirical blind-flaw qualification demonstration block.
2. Fracture Mechanics-Based Acceptance Criteria:
   - Discontinuities categorized as surface-connected or subsurface.
   - Surface flaws feature stringent size thresholds due to fatigue propagation kinetics; subsurface flaws permit larger allowable heights subject to ligament margins.`,
        keyPointsAr: [
          'تعتمد كودات ASME الحديثة على معايير ميكانيكا الكسر لتقييم الارتفاع الشاقولي بدلاً من مجرد الطول السطحي.',
          'حفظ ملفات البيانات الصوتية الرقمية الخام إلزامي قانونياً لمدة لا تقل عن 5 إلى 10 سنوات بعد الفحص.'
        ],
        keyPointsEn: [
          'Modern ASME codes utilize fracture mechanics flaw height thresholds over pure length metrics.',
          'Raw digital acoustic RF records must be retained in audit-ready state throughout facility lifecycle.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار التحقق والتقييم المعياري',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في تقنيات PAUT و TOFD المتقدمة',
        pageTitleEn: 'PAUT & TOFD Advanced Review Exam',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your technical mastery of phased array ultrasonic testing and time of flight diffraction with this standardized review question.`,
        quizQuestion: {
          questionAr: 'في فحص TOFD لوصلات اللحام، ما هي الخاصية الفريدة التي تميز إشارة حيود القمة العلوية للشرخ (Upper Tip) عن الموجة الجانبية؟',
          questionEn: 'In TOFD weld examination, what unique physical property distinguishes the upper flaw tip diffraction signal from the lateral wave?',
          optionsAr: [
            'انقلاب الطور الفيزيائي بمقدار 180 درجة (Phase Inversion)',
            'أن ترددها يتضاعف إلى 100 ميجاهرتز',
            'أنها تصل دائماً قبل الموجة الجانبية السطحية',
            'أن سعتها تفوق سعة صدى الجدار الخلفي بعشرة أضعاف'
          ],
          optionsEn: [
            'Physical 180-degree phase inversion (negative phase signature)',
            'Frequency automatically doubles to 100 MHz',
            'It always arrives earlier than the lateral wave',
            'Its amplitude exceeds the backwall echo by 10x'
          ],
          correctIndex: 0,
          explanationAr: 'تتميز إشارة حيود القمة العلوية بانقلاب طوري مقداره 180 درجة (طور سالب معاكس لطور الموجة الجانبية الموجب)، وهو الدليل الفيزيائي القاطع الذي يعتمده المفتش للتأكد من وجود قمة شرخ حقيقية وتحديد موضعها بدقة.',
          explanationEn: 'The upper tip diffracted signal undergoes an intrinsic 180-degree phase inversion (opposite polarity to the lateral wave), providing unequivocal physical verification of an upper crack edge.'
        }
      }
    ]
  },
  {
    id: 'book-welding-codes',
    discipline: 'WELDING_CODES',
    colorTheme: {
      primary: 'text-orange-400',
      gradient: 'from-[#331408] via-[#54210d] to-[#240c04]',
      border: 'border-orange-500/40',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-300',
      accent: 'border-orange-400'
    },
    titleAr: 'المرجع الأكاديمي في تفتيش اللحام ومعايير القبول الهندسية (Welding Quality & Codes)',
    titleEn: 'Academic Textbook of Welding Quality & International Acceptance Codes',
    subtitleAr: 'عمليات اللحام، عيوب الصهر والتشكيل، ومعايير القبول والرفض وفق ASME Sec VIII و ASME B31.3 و AWS D1.1',
    subtitleEn: 'Fusion Welding Processes, Defect Morphologies, & Code Acceptance under ASME & AWS',
    edition: 'الطبعة المعتمدة للمواصفات - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 10,
    applicableStandards: ['ASME Sec VIII Div 1 UW-51', 'ASME B31.3 Table 341.3.2', 'AWS D1.1 Clause 6', 'ASME Sec IX', 'API 579-1/ASME FFS-1'],
    coverSummaryAr: 'دراسة متعمقة لعمليات اللحام الصهري SMAW و GTAW و GMAW و SAW، تصنيف العيوب المستوية الحادة والحجمية، معايير الرفض والقبول في أوعية الضغط وشبكات الأنابيب والمنشآت الإنشائية، وإدارة وثائق WPS/PQR وتقارير NCR.',
    coverSummaryEn: 'Comprehensive engineering coverage of fusion welding, defect mechanics, code acceptance thresholds under ASME Section VIII, B31.3, and AWS D1.1, WPS/PQR qualification, and NCR governance.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: عمليات اللحام بالقوس الكهربائي',
        chapterTitleEn: 'Chapter 1: Arc Welding Processes & Mechanics',
        pageTitleAr: 'ميكانيكا الصهر والغازات الحامية في عمليات SMAW و GTAW و GMAW و SAW',
        pageTitleEn: 'Fusion Metallurgy & Shielding Mechanisms (SMAW, GTAW, GMAW, SAW)',
        contentAr: `تعتبر جودة وصلات اللحام حجر الزاوية في سلامة المنشآت الصناعية وأوعية الضغط. ترتبط كل عملية لحام بأنماط محددة من العيوب الهندسية:

1. اللحام بالقوس المعدني المحجب (SMAW / Stick):
   - استخدام إلكترود مستهلك مغطى ببودرة الفلكس (Flux) التي تنتج غازات حامية وخبثاً سائلاً يطفو فوق حوض المنصهر.
   - العيوب الشائعة: احتباس الخبث (Slag Inclusions)، الشروخ الهيدروجينية المتأخرة، ونقص الاختراق عند الجذر.
2. اللحام بقوس غاز التنجستن (GTAW / TIG):
   - استخدام قطب تنجستن غير مستهلك مع غاز خامل نقي (أرجون). يوفر أعلى درجات النقاء في باص الجذر (Root Pass).
   - العيوب الشائعة: شوائب التنجستن (Tungsten Inclusions) الناتجة عن ملامسة القطب لحوض المنصهر، والمسامية الناتجة عن تشتت الغاز الحامي بفعل التيارات الهوائية.
3. اللحام بقوس معدني محمي بالغاز (GMAW / MIG-MAG):
   - تغذية مستمرة لسلك مصمت مع غاز حامٍ.
   - العيوب الشائعة: نقص الانصهار الجانبي (Lack of Side-Wall Fusion) عند استخدام نمط النقل بالدائرة القصيرة (Short-Circuiting).
4. اللحام بالقوس المغمور (SAW):
   - القوس مدفون بالكامل تحت طبقة كثيفة من الفلكس الحبيبي، مما يوفر معدلات ترسيب هائلة في اللحامات الطولية والدائرية للأوعية الضخمة.`,
        contentEn: `Weld joint integrity governs pressure equipment and structural safety. Each arc welding process features unique flaw predisposition:

1. Shielded Metal Arc Welding (SMAW):
   - Flux-coated consumable electrode generates shielding gas and protective liquid slag.
   - Typical Discontinuities: Slag entrapment, hydrogen-induced cracking, incomplete root penetration.
2. Gas Tungsten Arc Welding (GTAW / TIG):
   - Non-consumable tungsten electrode under inert argon shield; standard benchmark for high-integrity root runs.
   - Typical Discontinuities: Tungsten inclusions from tip touch, gas porosity due to ambient draft disruption.
3. Gas Metal Arc Welding (GMAW):
   - Continuous solid wire feed with active/inert gas shielding.
   - Typical Discontinuities: Cold lap / lack of sidewall fusion under short-circuit transfer mode.
4. Submerged Arc Welding (SAW):
   - Arc completely submerged beneath granular mineral flux, delivering high deposition for heavy vessel seams.`,
        keyPointsAr: [
          'شوائب التنجستن تقتصر حصرياً على عملية لحام GTAW وتظهر في أفلام الأشعة كنقاط بيضاء شديدة البياض لكثافة التنجستن العالية.',
          'اللحام بطريقة GMAW بنمط الدائرة القصيرة يتطلب حرصاً فائقاً لتفادي نقص الانصهار الجانبي البارد (Cold Lap).'
        ],
        keyPointsEn: [
          'Tungsten inclusions are exclusive to GTAW, appearing as bright white spots on radiographs due to high atomic density.',
          'Short-circuit GMAW requires meticulous heat-input control to eliminate cold lap lack of fusion.'
        ]
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: مورفولوجيا وتصنيف عيوب اللحام',
        chapterTitleEn: 'Chapter 2: Welding Discontinuity Classification',
        pageTitleAr: 'العيوب المستوية الحادة مقابل العيوب الحجمية المستديرة',
        pageTitleEn: 'Planar Sharp Flaws vs Volumetric Rounded Discontinuities',
        contentAr: `يصنف مهندسو الفحص غير الإتلافي عيوب اللحام إلى فئتين رئيسيتين وفق درجة خطورتها الميكانيكية:

1. العيوب المستوية (Planar Discontinuities):
   - تمتاز بوجود نهايات حادة جداً تعمل كمكثفات إجهاد موضعية بالغة الخطورة (Stress Concentrators).
   - تشمل: الشقوق (Cracks)، نقص الانصهار (Lack of Fusion - LOF)، ونقص الاختراق (Lack of Penetration - LOP).
   - المعاملة الهندسية: ترفض رفضاً قاطعاً ومطلقاً بدون تساهل في كافة كودات أوعية الضغط وشبكات الأنابيب والمنشآت.
2. العيوب الحجمية (Volumetric Discontinuities):
   - تمتاز بوجود أبعاد ثلاثية وحواف دائرية غير حادة تؤدي إلى توزيع منتظم للإجهادات.
   - تشمل: المسامية الغازية الكروية (Porosity)، المسامية الدودية (Piping Porosity)، وخبث اللحام (Slag Inclusions).
   - المعاملة الهندسية: يُسمح بنسب وأطوال محددة منها طبقاً لجداول ومعايير الأكواد، لأنها لا تشكل خطراً انكسارياً داهماً ما لم تتكتل أو تتصل بالسطح.`,
        contentEn: `NDT engineering categorizes weld discontinuities into two fundamental geometric classes:

1. Planar Discontinuities:
   - Feature sharp notch-like extremities inducing intense localized stress concentrations (K_t).
   - Encompasses: Cracks, Lack of Fusion (LOF), Incomplete Penetration (LOP).
   - Regulatory Posture: Non-negotiably rejectable under zero-tolerance criteria across all pressure and structural codes.
2. Volumetric Discontinuities:
   - Feature rounded three-dimensional contours dissipating localized stresses.
   - Encompasses: Gas porosity, piping/wormhole porosity, slag inclusions.
   - Regulatory Posture: Tolerated within prescribed dimensional and cumulative cluster thresholds outlined in code charts.`,
        keyPointsAr: [
          'العيوب المستوية الحادة ترفض بشكل قاطع في كافة الكودات الهندسية نظراً لقدرتها على بدء الانهيار الانكساري الهش.',
          'العيوب الحجمية المستديرة كالخبث والمسامية تخضع لمعايير قبول وتسامح محددة تعتمد على سماكة جدار الوصلة.'
        ],
        keyPointsEn: [
          'Sharp planar flaws are uniformly rejected under all codes due to brittle fracture initiation propensity.',
          'Rounded volumetric flaws are evaluated against allowable dimensional limits proportional to weld thickness.'
        ]
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: معايير قبول أوعية الضغط ASME Section VIII',
        chapterTitleEn: 'Chapter 3: ASME Section VIII Div 1 Acceptance Criteria',
        pageTitleAr: 'اشتراطات الفحص الإشعاعي والموجي وفق الفقرات UW-51 و UW-52',
        pageTitleEn: 'Full Radiography (UW-51) vs Spot Radiography (UW-52) Mandates',
        contentAr: `يحدد كود الجمعية الأمريكية للمهندسين الميكانيكيين ASME Section VIII Div 1 قواعد صارمة لتفتيش لحامات أوعية الضغط:

1. الفحص الإشعاعي الكامل (Full Radiography - UW-51):
   - شروط الرفض المطلق: أي شرخ (Crack)، أو نقص انصهار (LOF)، أو نقص اختراق (LOP) بغض النظر عن طوله.
   - الخبث المتطاول والدلالات الخطية:
     - أقصى طول مسموح للدلالة الفردية: 6.0 ملم للسماكات $t \le 19$ ملم (3/4 in).
     - للسماكات بين 19 و 57 ملم: أقصى طول مسموح هو ثلث السماكة ($t / 3$).
     - للسماكات الأكبر من 57 ملم: الحد الأقصى المطلق هو 19.0 ملم.
     - شرط التجميع: يجب ألا يتجاوز مجموع أطوال الدلالات طول السماكة $t$ في أي مدى بطول $12t$، إلا إذا فصلت بينها مسافة تفوق $6L$.
2. الفحص الإشعاعي الموضعي (Spot Examination - UW-52):
   - يطبق على الأوعية التي صممت بكفاءة وصلة أقل ($E = 0.85$).
   - يُسمح فيه بنقص اختراق طفيف لا يتجاوز 19 ملم في كل 150 ملم من اللحام.`,
        contentEn: `ASME Boiler & Pressure Vessel Code Section VIII Division 1 establishes mandatory criteria:

1. Full Radiographic Examination (UW-51):
   - Absolute Rejection: Any crack, lack of fusion, or incomplete penetration regardless of length.
   - Elongated Indications (Slag Lines):
     - Maximum length = 6.0 mm (1/4 in) for t <= 19 mm (3/4 in).
     - Maximum length = t / 3 for 19 mm < t <= 57 mm (2-1/4 in).
     - Maximum length = 19.0 mm (3/4 in) for t > 57 mm.
     - Cumulative rule: Total aggregate length of aligned indications must not exceed weld thickness t in any 12t length.
2. Spot Radiographic Examination (UW-52):
   - Permissible for vessels designed with joint efficiency E = 0.85, granting measured allowances for minor weld root discontinuities.`,
        formula: {
          latex: 'L_{max} = \\min\\left(19\\text{ mm}, \\max\\left(6\\text{ mm}, \\frac{t}{3}\\right)\\right)',
          descriptionAr: 'معادلة حساب الحد الأقصى المسموح لخَبث اللحام المتطاول وفق كود ASME Sec VIII UW-51',
          descriptionEn: 'ASME Sec VIII UW-51 formula for maximum allowable elongated slag inclusion length'
        },
        keyPointsAr: [
          'طبقاً لـ UW-51، يُمنع منعاً باتاً قبول أي نقص انصهار أو نقص اختراق في اللحام المفحوص بالأشعة الكاملة.',
          'الحد الأقصى للخبث المتطاول في الألواح التي تقل سماكتها عن 19 ملم هو 6 ملم فقط.'
        ],
        keyPointsEn: [
          'UW-51 completely prohibits lack of fusion and incomplete penetration under full radiography.',
          'Maximum allowable slag length for plate thickness <= 19 mm is strictly 6 mm.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: معايير قبول شبكات الأنابيب ASME B31.3',
        chapterTitleEn: 'Chapter 4: Process Piping ASME B31.3 Criteria',
        pageTitleAr: 'تصنيف خدمات الموائع: الخدمة العادية مقابل الدورية الشديدة والموائع السامة',
        pageTitleEn: 'Normal Fluid Service vs Severe Cyclic Conditions & Category M Fluid',
        contentAr: `يصنف كود أنابيب المعالجة البتروكيماوية ASME B31.3 معايير قبول العيوب بناءً على خطورة المائع المنقول والظروف التشغيلية (الجدول 341.3.2):

1. خدمة الموائع العادية (Normal Fluid Service):
   - الشروخ ونقص الانصهار: مرفوضة قطعياً.
   - نقص اختراق الجذر (Incomplete Penetration): يُسمح بعمق لا يتجاوز 1 ملم أو $0.2 t$ وبطول إجمالي لا يتجاوز 38 ملم في كل 150 ملم من اللحام.
   - الخبث المتطاول: يُسمح بطول فردي لا يتجاوز $2t / 3$ وبحد أقصى لا يتعدى 3 ملم في الأنابيب الرقيقة.
2. ظروف الخدمة الدورية الشديدة (Severe Cyclic Conditions):
   - تنطبق على الخطوط المعرضة لإجهادات اهتزاز وتعب حراري متكرر.
   - ترفض كافة العيوب المستوية (صفر تسامح مع نقص الاختراق ونقص الانصهار) مع اشتراطات صارمة لنعومة باص الوجه وخلوه من أي تقويض (Undercut).
3. خدمة الموائع السامة القاتلة (Category M Fluid Service):
   - متطلبات مماثلة للخدمة الدورية الشديدة لحماية الكادر البشري والبيئة من أي تسريب غازي قاتل.`,
        contentEn: `ASME B31.3 Process Piping establishes acceptance criteria tailored to operating fluid hazard severity (Table 341.3.2):

1. Normal Fluid Service:
   - Cracks & Lack of Fusion: Zero tolerance (Rejectable).
   - Incomplete Penetration: Tolerated up to depth <= 1 mm (or 0.2t) with cumulative length <= 38 mm in any 150 mm of weld.
   - Slag Inclusions: Individual length <= 2t / 3 (max 3 mm).
2. Severe Cyclic Conditions:
   - High fatigue vibration and cyclic thermal shock environments.
   - Zero tolerance for any planar flaw (incomplete penetration and lack of fusion completely prohibited), along with zero undercut depth tolerance.
3. Category M Fluid Service (Lethal Toxic Fluids):
   - Enforces severe cyclic integrity to eliminate catastrophic environmental exposure.`,
        experimentId: 'exp-welding-flaw-evaluator'
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: كود اللحام الإنشائي الأمريكي AWS D1.1',
        chapterTitleEn: 'Chapter 5: AWS D1.1 Structural Welding Standards',
        pageTitleAr: 'معايير الوصلات الإنشائية المحملة استاتيكياً مقابل المحملة ديناميكياً',
        pageTitleEn: 'Statically Loaded vs Cyclically Loaded Nontubular Connections',
        contentAr: `يغطي كود جمعية اللحام الأمريكية AWS D1.1 المنشآت والجسور والمنصات البحرية الفولاذية (الباب السادس - التفتيش):

1. الوصلات غير الأنبوبية المحملة استاتيكياً (Statically Loaded):
   - الشروخ: ممنوعة رفضاً قاطعاً في أي جزء من اللحام.
   - نقص الانصهار: مرفوض تماماً بين باصات اللحام أو مع المعدن الأساسي.
   - التقويض (Undercut): يُسمح بعمق لا يتجاوز 1.0 ملم لألواح الصلب بسماكة تقل عن 25 ملم، وبحد أقصى 2.0 ملم لأطوال لا تتجاوز 50 ملم في كل 300 ملم لحام.
   - المسامية: يُسمح بالمسامية المنعزلة التي لا تتجاوز 2.5 ملم في كل 25 ملم طولي من الوصلة.
2. الوصلات المحملة ديناميكياً ودورياً (Cyclically Loaded):
   - لا يُسمح بأي تقويض يتجاوز عمقه 0.25 ملم في اللحامات المتعامدة مع اتجاه إجهادات الشد الرئيسية لتفادي نمو شروخ التعب الميكانيكي (Fatigue Crack Growth).`,
        contentEn: `AWS D1.1 Structural Welding Code Steel (Clause 6 - Inspection Criteria):

1. Statically Loaded Nontubular Connections:
   - Cracks: Zero tolerance (Rejectable).
   - Lack of Fusion: Thorough fusion required between weld passes and adjacent base metal.
   - Undercut: Permissible up to 1.0 mm depth for base metal < 25 mm thickness, and up to 2.0 mm for cumulative length not exceeding 50 mm in any 300 mm segment.
   - Porosity: Visible piping porosity limited to one <= 2.5 mm indication in each 25 mm of weld length.
2. Cyclically Loaded Nontubular Connections:
   - Undercut perpendicular to primary tensile stresses is capped at an ultra-stringent 0.25 mm (0.01 in) to arrest cyclic fatigue initiation.`,
        keyPointsAr: [
          'يفرض كود AWS D1.1 حدوداً صارمة جداً على عمق التقويض (Undercut) في المنشآت المعرضة لأحمال دورية ديناميكية لمنع شروخ التعب.',
          'الاندماج الكامل (Complete Fusion) بين باصات اللحام والمعدن الأساسي شرط ملزم في كافة الوصلات الإنشائية.'
        ],
        keyPointsEn: [
          'AWS D1.1 restricts undercut depth to 0.25 mm in cyclically loaded tensile joints to arrest fatigue propagation.',
          'Complete fusion across all weld runs and parent bevels is mandatory without exception.'
        ]
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: مواصفات وتأهيل إجراءات اللحام',
        chapterTitleEn: 'Chapter 6: WPS, PQR, & Welder Performance (WPQ)',
        pageTitleAr: 'مواصفة إجراء اللحام (WPS) وسجل التأهيل (PQR) والمتغيرات الجوهرية',
        pageTitleEn: 'Essential vs Non-Essential Variables, PQR Mechanical Testing, & WPQ',
        contentAr: `يشكل نظام الجودة المعتمد وفق ASME Section IX الثلاثية الهندسية لإدارة اللحام:

1. مواصفة إجراء اللحام (Welding Procedure Specification - WPS):
   - وثيقة معتمدة وموجهة لورشة التصنيع تحدد نطاقات التشغيل لكل متغير: نوع السلك، القطر، نوع الغاز ومعدل التدفق، التيار (Amps)، الجهد (Volts)، وسرعة الترسيب.
2. سجل تأهيل الإجراء (Procedure Qualification Record - PQR):
   - سجل البيانات الحقيقية المسجلة أثناء لحام عينة الاختبار المعملية، ويتضمن نتائج الاختبارات الميكانيكية الإلزامية:
     - اختبارات الشد (Tensile Tests): يجب ألا تقل مقاومة الشد عن الحد الأدنى المحدد للمعدن الأساسي.
     - اختبارات الثني (Guided Bend Tests): ثني جانبي (Side Bend) أو جذري/وجهي للتحقق من سلامة اللحام وخلوه من الشقوق والانفصال.
     - اختبار الصدم (Charpy V-Notch): لقياس متانة الكسر في درجات الحرارة المنخفضة.
3. المتغيرات الجوهرية (Essential Variables):
   - أي تغيير في متغير جوهري (مثل نوع المعدن الأساسي P-Number، نوع الإلكترود F-Number، أو حذف المعالجة الحرارية PWHT) يبطل الـ WPS ويلزم إعادة اختبار PQR جديد.`,
        contentEn: `ASME Section IX governs the welding documentation framework:

1. Welding Procedure Specification (WPS):
   - Shop-floor operational document defining permitted operational ranges: filler wire, shielding gas composition, current, voltage, travel speed, and heat input limits.
2. Procedure Qualification Record (PQR):
   - Verified archival record of actual weld coupon parameters and destructive laboratory test results:
     - Transverse Tensile Testing: Ultimate strength must equal or exceed minimum specified base metal UTS.
     - Guided Bend Testing: Verifies ductility and fusion integrity without surface tears > 3 mm.
     - Charpy V-Notch Impact Toughness: Mandatory for low-temperature/pressure applications.
3. Essential Variables:
   - Changes in essential variables (e.g. Base metal P-Number, filler F-Number, preheat reduction > 55°C, or omission of PWHT) mandate re-qualification of a new PQR.`,
        keyPointsAr: [
          'وثيقة WPS تحدد النطاقات التشغيلية المسموحة للحام، بينما وثيقة PQR تسجل القيم الفعلية ونتائج الاختبارات التدميرية المعملية.',
          'أي تعديل في المتغيرات الجوهرية (Essential Variables) يُلزم قانونياً بإعادة تأهيل اختبار PQR جديد واعتماده.'
        ],
        keyPointsEn: [
          'A WPS defines allowable operational ranges, whereas a PQR documents actual values and destructive lab coupon results.',
          'Any deviation beyond essential variable limits legally invalidates the procedure, requiring a fresh PQR.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: تقارير عدم المطابقة وإصلاح اللحام',
        chapterTitleEn: 'Chapter 7: Non-Conformance Reports & Weld Repairs',
        pageTitleAr: 'إدارة تقارير عدم المطابقة (NCR)، هندسة الإصلاح، والتقييم للخدمة (FFS)',
        pageTitleEn: 'NCR Governance, Excavation Protocols, Re-Inspection, & API 579 FFS',
        contentAr: `عند اكتشاف عيب لحام مرفوض هندسياً، يتبع مهندس الجودة مساراً إجرائياً دقيقاً وموثقاً:

1. إصدار تقرير عدم المطابقة (Non-Conformance Report - NCR):
   - عزل القطعة المعيبة ووضع علامات تحذيرية حمراء لمنع استمرار تصنيعها أو دهانها أو شحنها للموقع.
2. إجراءات حفر وإزالة العيب (Defect Excavation):
   - إزالة العيب باستخدام التجليخ الميكانيكي (Grinding) أو القوس الكربوني (Carbon Arc Gouging).
   - فحص الحفرة الناتجة بفحص السوائل النافذة (PT) أو الجسيمات المغناطيسية (MT) للتحقق من إزالة كامل جذور الشرخ قبل الشروع في إعادة اللحام.
3. إجراء اللحام التصحيحي (Weld Repair Procedure):
   - استخدام إجراء لحام إصلاحي معتمد، مع تطبيق تسخين مبدئي (Preheat) لمنع تولد الشروخ الهيدروجينية في منطقة اللحام المحدودة.
4. إعادة الفحص الكامل (Full Re-Inspection):
   - تطبيق نفس طريقة الفحص غير الإتلافي الأصلية وبمعايير قبول متطابقة أو أشد، وإرفاق التقرير في سجل إغلاق الـ NCR.`,
        contentEn: `Managing rejectable weld indications requires disciplined quality engineering:

1. Non-Conformance Report (NCR) Issuance:
   - Immediate tagging and containment of rejected component to prevent unauthorized movement or coating.
2. Excavation Protocols:
   - Controlled cavity excavation via grinding or air carbon arc gouging.
   - Mandatory PT or MT magnetic verification of the excavated groove to confirm 100% elimination of crack tips prior to re-welding.
3. Qualified Repair WPS:
   - Execution under an approved repair procedure, with strict preheat compliance to prevent high-stress hydrogen cracking.
4. Comprehensive Re-Inspection:
   - 100% volumetric/surface re-examination using original NDT method and acceptance criteria for final NCR formal closeout.`,
        keyPointsAr: [
          'فحص الحفرة المتكونة بعد إزالة العيب بواسطة PT أو MT إلزامي للتأكد من إزالة جذور الشرخ بالكامل قبل بدء إعادة اللحام.',
          'لا يُغلق تقرير عدم المطابقة NCR إلا بعد اجتياز إعادة الفحص بنجاح واعتماد مفتش الجودة المستقل ورئيس قسم التفتيش.'
        ],
        keyPointsEn: [
          'Post-excavation NDT (PT/MT) is mandatory to verify complete crack removal prior to depositing repair weld metal.',
          'An NCR cannot be closed without formal 100% NDT clearance and sign-off by the certified Quality Authority.'
        ]
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار التحقق والتقييم المعياري',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في تفتيش اللحام ومعايير القبول الهندسية',
        pageTitleEn: 'Welding Quality & Codes Review Exam',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your technical mastery of welding inspection and international acceptance codes with this standardized review question.`,
        quizQuestion: {
          questionAr: 'وفقاً لاشتراطات كود ASME Section VIII Div 1 UW-51 للفحص الإشعاعي الكامل، ما هو الحد الأقصى المسموح لخَبث اللحام المتطاول (Elongated Slag) في صفيحة فولاذية بسماكة 15 ملم؟',
          questionEn: 'According to ASME Section VIII Div 1 UW-51 under full radiography, what is the maximum allowable individual elongated slag inclusion length in a 15 mm thick steel plate?',
          optionsAr: [
            '6.0 ملم (1/4 in)',
            '15.0 ملم (كامل السماكة)',
            'صفر (مرفوض قطعياً)',
            '50.0 ملم'
          ],
          optionsEn: [
            '6.0 mm (1/4 in)',
            '15.0 mm (Equal to full thickness)',
            'Zero tolerance (Strictly rejectable)',
            '50.0 mm'
          ],
          correctIndex: 0,
          explanationAr: 'ينص كود ASME Section VIII UW-51 على أن الحد الأقصى المسموح للدلالة الخطية الفردية (كالخبث المتطاول) لأي سماكة تقل عن أو تساوي 19 ملم هو 6.0 ملم (1/4 in).',
          explanationEn: 'Under ASME Section VIII UW-51, the maximum allowable individual elongated indication length for weld thickness t <= 19 mm (3/4 in) is strictly 6.0 mm (1/4 in).'
        }
      }
    ]
  },
  {
    id: 'book-ae-lt',
    discipline: 'AE_LT',
    colorTheme: {
      primary: 'text-purple-400',
      gradient: 'from-[#1c0833] via-[#331159] to-[#120524]',
      border: 'border-purple-500/40',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-300',
      accent: 'border-purple-400'
    },
    titleAr: 'المرجع الأكاديمي في فحص الانبعاث الصوتي واختبارات التسريب (AE & LT)',
    titleEn: 'Academic Textbook of Acoustic Emission & Leak Testing (AE & LT)',
    subtitleAr: 'أمواج الإجهاد العابرة، تأثير كايزر وفيليسيتي، تحديد مواقع المصادر TDOA، ومطياف كتلة الهيليوم',
    subtitleEn: 'Transient Stress Waves, Kaiser/Felicity Ratios, TDOA Planar Location, & Helium Mass Spectrometry',
    edition: 'الطبعة الهندسية التخصصية - 2026',
    authorAr: 'المجلس الأكاديمي لهندسة الجودة والتفتيش • إنسكو',
    authorEn: 'INSCO Academic Inspection & Quality Board',
    totalPages: 8,
    estimatedHours: 10,
    applicableStandards: ['ASME Sec V Art 10 (LT)', 'ASME Sec V Art 11 & 12 (AE)', 'ISO 16148', 'ASTM E1316', 'ASTM E499'],
    coverSummaryAr: 'دراسة هندسية متقدمة لفيزياء الانبعاث الصوتي، مراقبة اختبارات الضغط الهيدروستاتيكي، تشخيص الشروخ النشطة عبر نسبة فيليسيتي، وأنظمة كشف التسريب فائقة الدقة باستخدام غاز الهيليوم والتخلخل العالي.',
    coverSummaryEn: 'Comprehensive engineering textbook on acoustic emission physics, pressure vessel hydrotest surveillance, active crack diagnosis via Felicity ratio, and high-vacuum helium mass spectrometer leak detection.',
    pages: [
      {
        pageNumber: 1,
        chapterTitleAr: 'الفصل الأول: فيزياء الانبعاث الصوتي وأمواج الإجهاد',
        chapterTitleEn: 'Chapter 1: Acoustic Emission & Transient Stress Waves',
        pageTitleAr: 'التحرير اللحظي للطاقة المرنة وتأثير كايزر وفيليسيتي',
        pageTitleEn: 'Elastic Energy Release, Kaiser Effect, & Felicity Phenomena',
        contentAr: `يختلف فحص الانبعاث الصوتي (Acoustic Emission - AE) جوهرياً عن كافة طرق الفحص غير الإتلافي التقليدية: فالطرق الأخرى ترسل طاقة خارجية إلى القطعة (Passive Listening vs Active Probing)، بينما يستمع فحص AE فقط إلى الطاقة الصوتية العابرة التي تصدرها المادة بنفسها عند تعرضها لإجهاد ميكانيكي أو حراري.

1. الآلية الفيزيائية لتوليد الانبعاث الصوتي:
   - عندما تتعرض المادة لحمل ميكانيكي، تتراكم الإجهادات حتى يحدث تفريغ موضعي فجائي للطاقة المرنة المخزونة ($Strain\ Energy$).
   - مصادر الانبعاث: حركة الانخلاعات البلورية (Dislocation movement)، بدء ونمو الشقوق المجهرية (Microcrack propagation)، تكسر واحتكاك ألياف المواد المركبة (FRP delamination)، وتآكل أو تشقق طبقات الصدأ والخبث.
2. تأثير كايزر (Kaiser Effect):
   - ينص على أن المادة السليمة لا تصدر أي انبعاثات صوتية قابلة للقياس حتى يتجاوز الحمل المطبق مستوى أقصى حمل تعرضت له المادة في تاريخها السابق.
3. ظاهرة ونسبة فيليسيتي (Felicity Effect & Ratio):
   - في المواد التي تحتوي على عيوب هيكلية نشطة أو تدهور ميكانيكي شديد، تبدأ الانبعاثات الصوتية في الظهور قبل الوصول إلى الحمل السابق!
   - نسبة فيليسيتي ($FR = P_{onset} / P_{previous}$): إذا كانت النسبة أقل من 1.0، فهذا مؤشر قاطع وحرج على نمو شرخ نشط وخلل في السلامة الإنشائية للمعدة.`,
        contentEn: `Acoustic Emission (AE) is fundamentally distinct from conventional NDT: it is an entirely passive surveillance method listening to transient elastic waves released by the material under stress, rather than actively probing with external energy.

1. Physical Generation Mechanism:
   - Rapid localized release of stored strain energy produces transient micro-seismic stress waves propagating across the structure.
   - Primary AE Sources: Dislocation glide avalanches, plastic deformation, crack initiation and jump propagation, fiber breakage in composites, and inclusion debonding.
2. The Kaiser Effect:
   - States that in structurally sound materials, acoustic emissions are absent until the previously sustained peak stress envelope is exceeded.
3. The Felicity Effect & Ratio:
   - Severe structural damage causes the breakdown of the Kaiser effect, triggering measurable acoustic emissions at stress levels well below prior maximum load.
   - Felicity Ratio: FR = Load_onset / Load_previous. When FR < 1.0, it constitutes definitive diagnostic evidence of active defect propagation.`,
        keyPointsAr: [
          'فحص AE هو فحص سلبي (Passive) يستمع لموجات الإجهاد الصادرة من المادة ولا يرسل أي طاقة صوتية مصطنعة.',
          'نسبة فيليسيتي Felicity Ratio أقل من 1.0 تدل على وجود شرخ ميكانيكي نشط ينمو ويتطلب تدخلاً هندسياً فورياً.'
        ],
        keyPointsEn: [
          'AE is a passive structural monitoring technology recording self-generated transient elastic waves.',
          'A Felicity Ratio below 1.0 diagnoses active flaw propagation and structural integrity compromise.'
        ]
      },
      {
        pageNumber: 2,
        chapterTitleAr: 'الفصل الثاني: مجسات AE ومعالم الإشارة الموجية',
        chapterTitleEn: 'Chapter 2: AE Sensors & Waveform Feature Extraction',
        pageTitleAr: 'المحولات الرنينية البيزوكهربائية والمعالم التحليلية لنبضة الضربات (Hits)',
        pageTitleEn: 'Resonant Piezoelectric Sensors & Waveform Feature Metrics',
        contentAr: `يتطلب التقاط موجات الانبعاث الصوتي الدقيقة مجسات بيزوكهربائية فائقة الحساسية مع مضخمات أولية منخفضة التشويش (Low-Noise Preamplifiers):

1. تصميم مجسات AE الرنينية (Resonant Sensors):
   - تعمل عادة في نطاق ترددات يتراوح بين 100 كيلوهرتز و 1 ميجاهرتز لتجاوز الضوضاء الميكانيكية والهيدروليكية ذات التردد المنخفض للمصنع.
   - التردد المعياري الأكثر استخداماً في أوعية الضغط الفولاذية هو 150 كيلوهرتز (R15 sensor).
2. معالم نبضة الانبعاث الصوتي (AE Waveform Features):
   - سعة الذروة (Peak Amplitude - $A_{dB}$): تقاس بالديسيبل بالنسبة لميكروفولت واحد على سطح المجس ($dB_{AE} = 20 \log_{10}(V / 1\mu V)$).
   - زمن الصعود (Rise Time): الزمن من أول تجاوز لعتبة القياس حتى بلوغ الذروة القصوى.
   - عدد الضربات (Counts): عدد مرات تجاوز الموجة لعتبة الجهد المحددة (Threshold).
   - مدة النبضة (Duration): الزمن بين أول وآخر تجاوز للعتبة.
   - الطاقة المقاسة (MARSE / Energy): المساحة تحت منحنى الجهد التربيعي، وتعتبر المؤشر الأكثر دقة لحجم الطاقة المنبعثة من الشرخ.`,
        contentEn: `Capturing micro-seismic acoustic stress waves requires ultra-sensitive piezoelectric transducers paired with integral 40 dB low-noise preamplifiers:

1. Resonant Transducer Selection:
   - Operates in the 100 kHz to 1 MHz bandwidth to isolate structural emissions from low-frequency plant background mechanical noise.
   - The industrial standard for steel pressure vessels is the 150 kHz resonant transducer (R15).
2. Time-Domain Waveform Features:
   - Peak Amplitude (A_dB): Logarithmic scale referenced to 1 uV at transducer crystal: dB_AE = 20 * log10(V / 1 uV).
   - Rise Time: Time interval from initial threshold crossing to peak amplitude.
   - Ring-Down Counts: Number of positive threshold crossings per event.
   - Duration: Time elapsed between first and final threshold crossings.
   - Energy (MARSE): Measured Area under Rectified Signal Envelope, quantifying true acoustic strain energy release.`,
        formula: {
          latex: 'A_{\\text{dB}} = 20 \\log_{10}\\left(\\frac{V_{\\text{peak}}}{1\\ \\mu\\text{V}}\\right) - \\text{Gain}_{\\text{preamp}}',
          descriptionAr: 'معادلة حساب سعة إشارة الانبعاث الصوتي بالديسيبل (dB AE) المرجعية للميكروفولت',
          descriptionEn: 'Acoustic Emission peak amplitude logarithmic decibel conversion referenced to 1 uV'
        },
        keyPointsAr: [
          'تردد 150 كيلوهرتز هو التردد القياسي لفحص أوعية الضغط والأنابيب الفولاذية لعزل الضوضاء المحيطة.',
          'طاقة MARSE تمثل مقياس الطاقة الحقيقي لنمو الشقوق ولا تتأثر بتغيرات العتبة مثل عدد الضربات.'
        ],
        keyPointsEn: [
          '150 kHz resonant sensors serve as the global benchmark to filter ambient machinery and flow noise.',
          'MARSE energy provides a robust physical metric of crack strain energy independent of threshold settings.'
        ]
      },
      {
        pageNumber: 3,
        chapterTitleAr: 'الفصل الثالث: انتشار الأمواج في الصفائح وجدران الأوعية',
        chapterTitleEn: 'Chapter 3: Guided Wave Propagation in Plate Structures',
        pageTitleAr: 'أمواج لامب الموجهة: نمط التمدد المتماثل ونمط الانثناء اللاتماثلي',
        pageTitleEn: 'Lamb Wave Dispersion: Extensional (S0) vs Flexural (A0) Modes',
        contentAr: `تنتشر موجات الانبعاث الصوتي في الصفائح الفولاذية وجدران الخزانات كأمواج موجهة (Guided Lamb Waves) مقيدة بين السطحين العلوي والسفلي:

1. نمط التمدد المتماثل (Extensional Mode - S0):
   - تتحرك جسيمات المادة موازية لمستوى الصفيحة بشكل متماثل عبر كامل السماكة.
   - يمتاز بسرعة انتشار عالية جداً في الفولاذ (حوالي 5400 م/ث) وتشتت طفيف في الترددات المنخفضة، مما يجعله الموجة الأولى التي تصل إلى المجسات البعيدة.
2. نمط الانثناء اللاتماثلي (Flexural Mode - A0):
   - تهتز جسيمات المادة عمودياً على مستوى الصفيحة مسببة حركة تموجية انثنائية.
   - سرعته أقل بكثير (حوالي 3100 م/ث) ويخضع لتشتت ملحوظ (Dispersion)؛ حيث تتغير سرعته بتغير التردد وسماكة اللوح ($f \cdot d$).
3. التوهين الصوتي الهندسي والامتصاصي:
   - يتناقص اتساع الموجة مع المسافة $r$ بفعل التبدد الهندسي الأسطواني ($1/\sqrt{r}$) والامتصاص اللزوجي المرن، مما يحدد المسافات البينية القصوى بين المجسات (عادة من 3 إلى 6 أمتار في الخزانات).`,
        contentEn: `In thin-walled structures and shell plates, acoustic emissions propagate as guided Lamb waves bounded by wall boundaries:

1. Symmetric Extensional Mode (S0):
   - In-plane particle displacement symmetric across neutral plate axis.
   - High acoustic group velocity (~5400 m/s in steel) with negligible low-frequency dispersion, constituting the initial signal arrival precursor.
2. Antisymmetric Flexural Mode (A0):
   - Out-of-plane transverse displacement inducing bending oscillations.
   - Lower velocity (~3100 m/s in steel) and highly dispersive: velocity varies sharply with the frequency-thickness product (f * d).
3. Attenuation Mechanics:
   - Acoustic amplitude decays via cylindrical geometric spreading (1 / sqrt(r)) and internal material damping, dictating sensor spacing (typically 3 to 6 m on storage tanks).`,
        keyPointsAr: [
          'نمط S0 الأسرع يمثل جبهة الوصول الأولى المستخدمة في حساب فارق زمن الوصول لتحديد موقع العيب بدقة.',
          'التوهين الهندسي الأسطواني يحكم أقصى مسافة مسموحة بين مجسات المراقبة على جدران الخزانات.'
        ],
        keyPointsEn: [
          'The faster S0 extensional mode forms the primary arrival threshold for source location timing.',
          'Cylindrical spreading governs maximum sensor spacing limits on large industrial structures.'
        ]
      },
      {
        pageNumber: 4,
        chapterTitleAr: 'الفصل الرابع: خوارزميات تثليث وتحديد مواقع المصادر',
        chapterTitleEn: 'Chapter 4: Planar Source Location & TDOA Triangulation',
        pageTitleAr: 'حساب فارق زمن الوصول (TDOA) وتوليف مصفوفات المجسات',
        pageTitleEn: 'Time Difference of Arrival (TDOA) Triangulation Algorithms',
        contentAr: `تتيح تقنية AE تحديد الإحداثيات المكانية الدقيقة ($(x, y)$ أو الكروية) لموقع الشرخ النامي على جدار الوعاء في الوقت الحقيقي دون مسح فيزيائي:

1. مبدأ فارق زمن الوصول (Time Difference of Arrival - TDOA):
   - عندما ينبعث حدث صوتي عند النقطة $(x, y)$، يصل إلى المجس $i$ في الزمن $t_i$ وإلى المجس $j$ في الزمن $t_j$.
   - فارق الزمن $\Delta t_{ij} = t_i - t_j$ يرسم قطوعاً زائدة (Hyperbolas) تكون بؤرها هي مواقع المجسات.
2. التثليث المستوي (2D Planar Triangulation):
   - يتطلب تحديد موقع العيب على سطح مستوٍ أو أسطواني ما لا يقل عن 3 مجسات غير متسامتة على خط واحد (Triangular Array).
   - تقاطع خطوط القطوع الزائدة الناتجة من أزواج المجسات يحدد إحداثيات مصدر الشرخ بدقة دائرة لا تتعدى عدة سنتيمترات.
3. التجميع الإحصائي للأحداث (Spatial Clustering):
   - تصنف العيوب الخطيرة من خلال تشكل حزم مكانية كثيفة (Clusters) تكرر إطلاق نبضات AE من نفس الإحداثية بدقة متناهية مع تصاعد الحمل.`,
        contentEn: `AE structural monitoring computes real-time coordinates of propagating cracks via Time Difference of Arrival (TDOA):

1. TDOA Hyperbolic Principle:
   - An emission event at (x, y) radiates wave fronts arriving at sensor i at t_i and sensor j at t_j.
   - The time difference Delta t_ij defines a hyperbola where sensor locations serve as focal nodes.
2. Planar Triangulation Geometry:
   - Unambiguous 2D planar/cylindrical location requires a minimum array of 3 non-collinear sensors.
   - The spatial intersection of multiple hyperbolic loci isolates the exact flaw coordinates.
3. Spatial Event Clustering:
   - High-severity active defects manifest as dense spatial clusters repeatedly emitting high-energy bursts from identical coordinates during load escalation.`,
        formula: {
          latex: '\\Delta t_{ij} = \\frac{1}{v} \\left( \\sqrt{(x - x_i)^2 + (y - y_i)^2} - \\sqrt{(x - x_j)^2 + (y - y_j)^2} \\right)',
          descriptionAr: 'معادلة فارق زمن الوصول (TDOA) لتثليث إحداثيات مصدر الانبعاث الصوتي المستوي',
          descriptionEn: 'Time Difference of Arrival (TDOA) planar hyperbolic triangulation equation'
        },
        keyPointsAr: [
          'يلزم وجود 3 مجسات على الأقل لتحديد إحداثيات مصدر الشرخ على الأسطح المستوية أو الأسطوانية.',
          'تجمع الأحداث الصوتية في بقعة جغرافية واحدة متقاربة (Cluster) هو المؤشر الهندسي الأكيد على وجود شرخ نشط.'
        ],
        keyPointsEn: [
          'A minimum of three non-collinear sensors is geometrically required for 2D surface source triangulation.',
          'Persistent spatial hit clustering provides definitive engineering evidence of localized active defect growth.'
        ]
      },
      {
        pageNumber: 5,
        chapterTitleAr: 'الفصل الخامس: مراقبة اختبارات الضغط الهيدروستاتيكي',
        chapterTitleEn: 'Chapter 5: ASME Pressure Vessel Hydrotest Surveillance',
        pageTitleAr: 'اشتراطات ASME Section V Article 11 و 12 في مراقبة الأوعية والخزانات',
        pageTitleEn: 'Surveillance Protocols for Pressure Equipment Hydrostatic Testing',
        contentAr: `يعتبر فحص AE أثناء الاختبار الهيدروستاتيكي الإلزامي (Hydrostatic Proof Test) للأوعية والخزانات الكروية معياراً عالمياً معتمداً:

1. جدول التحميل المرحلي المعياري (Stepped Loading Profile):
   - يمنع رفع الضغط بصورة مستمرة، بل يتم تصعيده على مراحل تدريجية (مثلاً 50%، 75%، 85%، 100%، 110% من ضغط التشغيل).
   - فترة التثبيت (Load Hold Periods): عند كل مرحلة، يثبت الضغط لمدة 10 إلى 30 دقيقة. إذا كانت المادة سليمة، تتلاشى الانبعاثات تماماً أثناء التثبيت؛ أما إذا استمرت الانبعاثات بالظهور أثناء ثبات الضغط، فهذا دليل قاطع على زحف مستمر للشرخ (Crack Creep).
2. معايير القبول والرفض وفق ASME Sec V:
   - توقف الفحص الفوري وإخلاء المنطقة إذا لوحظ تسارع أسي في معدل الانبعاثات ($Exponential\ Burst$).
   - تصنيف المجموعات إلى فئات خطورة (Evaluation Criteria Class I, II, III).
3. الفحص التكميلي الموضعي:
   - تُرسل فرق الفحص بالموجات فوق الصوتية (UT/PAUT) لفحص بؤر التجمع العنقودي (Clusters) فقط، مما يوفر أسابيع من مسح كامل الوعاء.`,
        contentEn: `AE surveillance during mandatory pressure vessel hydrostatic proof testing is standardized per ASME Sec V Article 11 & 12:

1. Stepped Pressurization Schedule:
   - Pressure is applied in regulated increments (e.g. 50%, 75%, 90%, 100%, 110% of design pressure).
   - Pressure Holds: Essential dwell intervals (10-30 mins) at each plateau. Structurally sound vessels become acoustically silent during holds; continuous emissions during holds indicate active subcritical crack creep.
2. ASME Acceptance Criteria:
   - Immediate test abort if exponential emission escalation or runaway acoustic energy is observed.
   - Clusters graded into evaluation severity tiers (Class I, II, III) dictating mandatory follow-up.
3. Targeted Follow-Up NDT:
   - Conventional UT/PAUT inspectors are deployed exclusively to localized AE cluster coordinates, saving immense shutdown downtime.`,
        experimentId: 'exp-ae-kaiser-felicity'
      },
      {
        pageNumber: 6,
        chapterTitleAr: 'الفصل السادس: أسس اختبارات التسريب وأنماط التدفق',
        chapterTitleEn: 'Chapter 6: Principles of Leak Testing (LT) & Flow Regimes',
        pageTitleAr: 'ديناميكا الغازات: رقم كنودسن والتدفق الجزيئي مقابل التدفق اللزج',
        pageTitleEn: 'Gas Dynamics, Knudsen Number, & Molecular vs Viscous Flow',
        contentAr: `يهدف فحص التسريب (Leak Testing - LT) إلى التحقق من إحكام الغلق التام ومنع تسرب السوائل أو الغازات الخطرة والسامة في أوعية الضغط ومحطات الطاقة والمفاعلات:

1. تعريف معدل التسريب القياسي ($Q$):
   - يُقاس بحاصل ضرب حجم الغاز المتسرب في الضغط خلال وحدة الزمن، ووحدته المعيارية هي ($\text{std}\cdot\text{cm}^3/\text{s}$ أو $\text{mbar}\cdot\text{L}/\text{s}$).
2. أنماط تدفق الغاز ورقم كنودسن (Knudsen Number - $Kn$):
   - يُعرّف رقم كنودسن بالنسبة بين المسار الحر المتوسط لجزيئات الغاز ($\lambda$) وقطر ثقب التسريب ($d$):
     $$Kn = \frac{\lambda}{d}$$
   - التدفق اللزج الصفائحي (Viscous / Laminar Flow - $Kn < 0.01$): تخضع حركة الغاز لقانون بوازيه وتعتمد على لزوجة الغاز ومربع فرق الضغط.
   - التدفق الانتقالي (Transitional Flow - $0.01 \le Kn \le 1.0$).
   - التدفق الجزيئي الحر (Molecular Flow - $Kn > 1.0$): يحدث في التخلخل العالي؛ حيث تتحرك جزيئات الغاز بشكل مستقل وتتصادم مع جدران الثقب دون تصادمات بينية، ويتناسب معدل التسريب عكسياً مع الجذر التربيعي للكتلة الجزيئية للغاز طبقاً لقانون غراهام ($Q \propto 1/\sqrt{M}$).`,
        contentEn: `Leak Testing (LT) verifies hermetic containment integrity in nuclear, petrochemical, and aerospace containment systems:

1. Standard Leak Rate Metric (Q):
   - Defined as gas throughput (P * V / t), standardized internationally in mbar * L / s or std * cm^3 / s.
2. Flow Regimes & The Knudsen Number (Kn):
   - Kn = lambda / d, where lambda is the gas molecular mean free path and d is leak path diameter.
   - Viscous / Laminar Flow (Kn < 0.01): Governed by Poiseuille flow where throughput scales with differential pressure squared and inverse dynamic viscosity.
   - Transitional Flow (0.01 <= Kn <= 1.0).
   - Molecular Flow (Kn > 1.0): Dominates under high vacuum; gas molecules travel independently colliding with orifice walls. Throughput scales inversely with square root of molecular weight per Graham's Law (Q proportional to 1 / sqrt(M)).`,
        formula: {
          latex: 'Q_{\\text{mol}} = C \\cdot \\Delta P = \\frac{1}{6} \\sqrt{\\frac{2 \\pi R T}{M}} \\cdot \\frac{d^3}{L} \\cdot (P_1 - P_2)',
          descriptionAr: 'معادلة التدفق الجزيئي الحر للغازات عبر ثقوب التسريب الدقيقة بدلالة الكتلة الجزيئية M',
          descriptionEn: 'Molecular leak conductance equation showing inverse dependence on square root of molecular weight M'
        },
        keyPointsAr: [
          'في التدفق الجزيئي الحر، ينفذ غاز الهيليوم (كتلة 4) أسرع بكثير من الهواء (كتلة 28.9) بسبب صغر وزنه الجزيئي.',
          'وحدة قياس التسريب المعتمدة دولياً هي mbar·L/s وتكافئ تقريباً std·cm³/s.'
        ],
        keyPointsEn: [
          'Under molecular flow, helium (M=4) diffuses ~2.7x faster than air (M=28.9) due to kinetic molecular mechanics.',
          'International regulatory codes mandate leak quantification in mbar * L / s.'
        ]
      },
      {
        pageNumber: 7,
        chapterTitleAr: 'الفصل السابع: فحص التسريب بمطياف كتلة الهيليوم (HMSLD)',
        chapterTitleEn: 'Chapter 7: Helium Mass Spectrometry & Vacuum Testing',
        pageTitleAr: 'تقنية القبعة والتخلخل العالي مقابل تقنية المشمام (Sniffer Probe)',
        pageTitleEn: 'High Vacuum Hood Technique vs Atmospheric Sniffer Probe (ASME Art 10)',
        contentAr: `يعتبر فحص التسريب بمطياف كتلة الهيليوم (Helium Mass Spectrometer Leak Detector - HMSLD) أكثر طرق الفحص حساسية ودقة على الإطلاق في الصناعة، بحساسية تصل إلى $1 \times 10^{-12}\ \text{mbar}\cdot\text{L}/\text{s}$:

1. لماذا يُعتمد غاز الهيليوم كمتتبع مثالي (Tracer Gas)؟
   - أصغر قطر جزيئي بعد الهيدروجين مع خمول كيميائي تام (غاز نبيل غير قابل للاشتعال).
   - نسبة وجوده في الهواء الجوي ضئيلة جداً (حوالي 5 أجزاء في المليون - 5 ppm)، مما يجعل مستوى الضوضاء الخلفية شبه معدوم.
2. تقنية التخلخل وغطاء الهيليوم (Vacuum Hood Technique - Outside-In):
   - تفريغ المعدة من الداخل إلى ضغط تخلخل عالي ($10^{-4}$ إلى $10^{-6}$ mbar) وتوصيلها بمطياف الكتلة.
   - غمر السطح الخارجي بالهيليوم عبر قبعة أو رش موضعي؛ ينجذب الهيليوم عبر أدق الثقوب إلى الداخل ويكتشفه المطياف فورياً.
3. تقنية المشمام المضغوط (Sniffer Probe Technique - Inside-Out):
   - ملء المعدة بالهيليوم تحت ضغط موجب، وتمرير مسبار شفط دقيق بمعدل سرعة لا تتجاوز 25 ملم/ثانية وعلى مسافة لا تزيد عن 3 ملم من درزات اللحام.`,
        contentEn: `Helium Mass Spectrometer Leak Detection (HMSLD) represents the pinnacle of leak sensitivity, detecting rates down to 1e-12 mbar * L / s:

1. Why Helium is the Ideal Tracer Gas:
   - Smallest atomic diameter after hydrogen, completely inert and non-flammable.
   - Natural atmospheric abundance is only ~5 ppm, ensuring ultra-low background noise and extreme signal-to-noise ratio.
2. Vacuum Envelope / Hood Technique (Inside-Out vs Outside-In):
   - Component evacuated to high vacuum (< 1e-4 mbar) coupled to spectrometer analyzer cell.
   - External envelope flooded with helium; inward migration reveals micro-fissures instantly.
3. Atmospheric Sniffer Probe Technique:
   - Vessel pressurized with helium/air mixture. Sniffer wand scanned at max 25 mm/s traverse within 3 mm of joint seam per ASME Sec V Art 10.`,
        experimentId: 'exp-lt-vacuum-leak'
      },
      {
        pageNumber: 8,
        chapterTitleAr: 'الفصل الثامن: اختبار التحقق والتقييم المعياري',
        chapterTitleEn: 'Chapter 8: Self-Assessment Examination',
        pageTitleAr: 'أسئلة مراجعة الباب في فحص الانبعاث الصوتي واختبارات التسريب',
        pageTitleEn: 'Acoustic Emission & Leak Testing Review Exam',
        contentAr: `اختبر استيعابك للمفاهيم الهندسية الواردة في هذا الكتاب الدراسي من خلال الإجابة على السؤال المعياري أدناه.`,
        contentEn: `Verify your technical mastery of acoustic emission and leak testing principles with this standardized review question.`,
        quizQuestion: {
          questionAr: 'في فحص الانبعاث الصوتي (AE)، إذا بدأت الانبعاثات الصوتية في الظهور عند حمل ميكانيكي أقل من أقصى حمل تعرضت له المعدة سابقاً، فماذا تسمى هذه الظاهرة وما دلالتها؟',
          questionEn: 'In Acoustic Emission (AE), when acoustic signals occur at a stress level below the previously sustained peak load, what is this phenomenon called and what does it indicate?',
          optionsAr: [
            'ظاهرة فيليسيتي (Felicity Effect)، وتدل على وجود تلف هيكلي أو شرخ نشط ينمو داخل المادة',
            'تأثير كايزر (Kaiser Effect)، وتدل على أن المعدة سليمة 100%',
            'ظاهرة التشتت اللامبي، وتدل على ذوبان الفولاذ',
            'ظاهرة بوييل، وتدل على زيادة الضغط الجوي'
          ],
          optionsEn: [
            'Felicity Effect, indicating structural degradation or active propagating crack',
            'Kaiser Effect, proving the component is 100% sound',
            'Lamb dispersion, indicating steel melting',
            'Boyle phenomenon, indicating barometric pressure rise'
          ],
          correctIndex: 0,
          explanationAr: 'تسمى هذه الظاهرة بظاهرة فيليسيتي (Felicity Effect) وتحدث عندما تكون نسبة فيليسيتي أقل من 1.0، وهي مؤشر قاطع على وجود ضرر ميكانيكي متراكم أو شرخ نشط يتسع تحت التحميل الدوري.',
          explanationEn: 'This phenomenon is termed the Felicity Effect (Felicity Ratio < 1.0), serving as definitive diagnostic evidence of accumulated structural damage or an actively propagating crack.'
        }
      }
    ]
  }
];
