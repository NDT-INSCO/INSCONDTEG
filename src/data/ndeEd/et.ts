import { NdeEdCourse } from './types';
import { quiz, t } from './helpers';

export const etCourse: NdeEdCourse = {
  id: 'nde-et',
  disciplineId: 'ndt_advanced',
  code: 'ET',
  level: 'level1',
  accent: '#a78bfa',
  title: t('التيارات الدوامية المتقدمة (ET)', 'Advanced Eddy Current Testing (ET)'),
  subtitle: t('الحث الكهرومغناطيسي، المستوى الممانعي، المسابر، والقياس دون تلامس', 'Electromagnetic induction, the impedance plane, probes and non-contact measurement'),
  description: t(
    'مقرر في الفحص بالتيارات الدوامية للأسطح الموصلة: كيف يتولد التيار الدوامي، وكيف يغيّر العيب ممانعة الملف، وكيف تُقرأ الإشارة على المستوى الممانعي. تستخدم صفحات nde-ed.org لهيكلة الموضوعات، والصياغة والأمثلة والأسئلة أصلية لإنسكو.',
    'A course on eddy current testing of conductive surfaces: how eddy currents are induced, how a flaw changes coil impedance, and how the impedance-plane signal is read. Topic structure follows the nde-ed.org pages; wording, examples and questions are original INSCO work.'
  ),
  prerequisites: t(
    'أساسيات الكهرباء والمغناطيسية (قانون فاراداي، النفاذية، الموصلية) ووحدات القياس.',
    'Electrical and magnetic fundamentals (Faraday’s law, permeability, conductivity) and measurement units.'
  ),
  outcomes: [
    t('شرح توليد التيار الدوامي وعمق الاختراق وحسابه.', 'Explain eddy current induction, depth of penetration and its calculation.'),
    t('اختيار المسافة والتردد والمسبار المناسب لكل تطبيق.', 'Select frequency, lift-off and probe type for each application.'),
    t('قراءة الإشارة على المستوى الممانعي وربط الطور بالعمق.', 'Read the impedance-plane signal and relate phase to depth.'),
    t('كشف شرخ سطحي وقياس موصلية وقياس سماكة طلاء غير موصل.', 'Detect a surface crack, measure conductivity and measure non-conductive coating thickness.'),
    t('بيان حدود ET: المواد الموصلة فقط، والعمق المحدود، وتأثير النفاذية.', 'State ET limits: conductive materials only, limited depth, permeability effects.'),
  ],
  lessons: [
    {
      id: 'et-principles',
      title: t('مبدأ الحث وعمق الاختراق', 'Induction and depth of penetration'),
      summary: t('لماذا يتكون التيار الدوامي، وإلى أي عمق يصل؟', 'Why eddy currents form and how deep they reach.'),
      minutes: 24,
      objectives: [
        t('شرح قانون فاراداي وتوليد التيار الدوامي في موصل.', 'Explain Faraday’s law and eddy current generation in a conductor.'),
        t('حساب عمق الاختراق القياسي من التردد والموصلية والنفاذية.', 'Calculate standard depth of penetration from frequency, conductivity and permeability.'),
        t('تفسير لماذا لا يصلح ET للمواد غير الموصلة.', 'Explain why ET does not apply to non-conductive materials.'),
      ],
      sections: [
        {
          heading: t('من الملف إلى المعدن', 'From coil to metal'),
          body: t(
            'يمر تيار متردد في ملف فينشأ مجال مغناطيسي متغير. عند تقريب الملف من موصل، يحث هذا المجال تيارات دوامية مغلقة داخل المعدن وفق قانون فاراداي. تنتج هذه التيارات مجالاً معاكساً يغيّر ممانعة الملف الظاهرة (المقاومة والمفاعلة). أي تغيير في الموصلية أو النفاذية أو الهندسة أو وجود عيب يعدّل المسار، فيتغير ما يقيسه الجهاز.',
            'An alternating current in a coil creates a changing magnetic field. Brought near a conductor, that field induces closed eddy currents by Faraday’s law. The currents produce an opposing field that changes the coil’s apparent impedance (resistance and reactance). Any change in conductivity, permeability, geometry or a discontinuity alters the path, and therefore what the instrument measures.'
          ),
        },
        {
          heading: t('عمق الاختراق', 'Depth of penetration'),
          body: t(
            'تقل كثافة التيار الدوامي مع العمق. عمق الاختراق القياسي δ هو العمق الذي تهبط عنده الكثافة إلى نحو 37% من قيمتها السطحية، ويُقدر بـ δ = 1/√(π f μ σ)، حيث f التردد وσ الموصلية وμ النفاذية. زيارة التردد أو الموصلية أو النفاذية تقلل δ. في المواد الحديدية تسيطر النفاذية العالية فيصبح الاختراق ضحلاً جداً مقارنة بالألومنيوم أو النحاس.',
            'Eddy current density decays with depth. The standard depth of penetration δ is where density falls to about 37% of its surface value, approximately δ = 1/√(π f μ σ), with f frequency, σ conductivity and μ permeability. Increasing frequency, conductivity or permeability reduces δ. In ferromagnetic steel, high permeability dominates and penetration becomes very shallow compared with aluminium or copper.'
          ),
        },
        {
          heading: t('حدود المبدأ', 'Principle limits'),
          body: t(
            'لا يمكن توليد تيار دوامي في عازل، لذلك لا يستخدم ET على البلاستيك أو الزجاج أو الخرسانة. وحتى في المعادن، الاختراق الفعلي محدود عادة ببضعة ملليمترات، كما أن التغيّر في النفاذية أو الهندسة أو المسافة ينتج إشارة تشبه إشارة العيب. لذلك يجب فصل هذه المتغيرات بمعايرة مرجعية وثابتة.',
            'No eddy current can be induced in an insulator, so ET is not used on plastics, glass or concrete. Even in metals, practical penetration is usually limited to a few millimetres, and changes in permeability, geometry or lift-off produce signals resembling a flaw. These variables must be separated with a stable reference calibration.'
          ),
        },
      ],
      workedExample: {
        prompt: t('قارن عمق الاختراق في ألومنيوم عند 100 kHz وعند 400 kHz.', 'Compare penetration depth in aluminium at 100 kHz and at 400 kHz.'),
        solution: t('من δ = 1/√(π f μ σ) نجد أن δ يتناسب عكسياً مع الجذر التربيعي للتردد. رفع التردد أربع مرات يخفض δ إلى النصف. التردد المنخفض يفحص أعمق لكنه أقل حساسية للعيوب الصغيرة السطحية.', 'From δ = 1/√(π f μ σ), δ is inversely proportional to the square root of frequency. Raising frequency four times halves δ. Lower frequency inspects deeper but is less sensitive to small surface flaws.'),
      },
      exercise: {
        prompt: t('لماذا لا يمكن فحص أنبوب PVC بتيارات دوامية؟', 'Why can a PVC pipe not be inspected with eddy currents?'),
        hint: t('فكر في شرط وجود وسط موصل.', 'Think about the requirement for a conductive medium.'),
        answer: t('لأن PVC عازل، ولا يمكن حث تيارات دوامية فيه. ET يحتاج مادة موصلة كهربائياً.', 'PVC is an insulator and cannot carry induced eddy currents. ET requires an electrically conductive material.'),
      },
      quiz: quiz(
        'et-principles-q1',
        'ما الذي يحدث لعمق الاختراق عند رفع تردد الفحص؟',
        'What happens to depth of penetration when test frequency is increased?',
        [
          ['يزداد خطياً', 'It increases linearly'],
          ['ينخفض', 'It decreases'],
          ['لا يتأثر', 'It is unaffected'],
          ['ينعدم تماماً', 'It becomes zero'],
        ],
        1,
        'δ يتناسب عكسياً مع الجذر التربيعي للتردد، لذا رفع التردد يقلل العمق.',
        'δ is inversely proportional to the square root of frequency, so a higher frequency reduces depth.'
      ),
      sources: ['nde-et-principles', 'nde-magnetism', 'nde-et-formulas'],
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_et' },
    },
    {
      id: 'et-probes',
      title: t('المسابر والتلامس ورفع الملف', 'Probes, coupling and lift-off'),
      summary: t('مسابر مطلقة وتفاضلية، وملفات داخل الأنابيب، وأثر رفع الملف.', 'Absolute and differential probes, tube coils and the lift-off effect.'),
      minutes: 24,
      objectives: [
        t('التمييز بين المسبار المطلق والتفاضلي واختيار المناسب.', 'Distinguish absolute and differential probes and select appropriately.'),
        t('شرح أثر رفع الملف ومعامل الامتلاء على الحساسية.', 'Explain lift-off and fill factor effects on sensitivity.'),
        t('ضبط المسافة والزاوية والتغطية في فحص سطح.', 'Set distance, angle and coverage for a surface scan.'),
      ],
      sections: [
        {
          heading: t('أنماط التشغيل', 'Modes of operation'),
          body: t(
            'المسبار المطلق يقيس الممانعة المطلقة للمنطقة تحت الملف، وهو حساس للتغيرات التدريجية مثل الموصلية والسماكة، لكنه ينزاح مع الحرارة والاستقرار. المسبار التفاضلي يقارن ملفين متجاورين، فيلغي التغيرات البطيئة المشتركة ويبرز العيوب الموضعية الحادة، لكنه قد يخفي عيباً طويلاً منتظماً تحت الملفين معاً.',
            'An absolute probe measures the absolute impedance under the coil. It is sensitive to gradual changes such as conductivity and thickness but drifts with temperature and instrument stability. A differential probe compares two adjacent coils, cancelling common slow drift and emphasising sharp local flaws, but it can hide a long uniform defect spanning both coils.'
          ),
        },
        {
          heading: t('الملفات الداخلية والخارجية', 'Inside and outside coils'),
          body: t(
            'فحص الأنابيب يستخدم غالباً ملفاً داخلياً (bobbin) يمر داخل الأنبوب. كلما اقترب قطر الملف من القطر الداخلي ارتفع معامل الامتلاء وتحسنت الحساسية. الملفات الخارجية (pancake) تناسب المسح اليدوي على الأسطح واللحامات. يجب أن تكون المسافة ثابتة أثناء المسح، وإلا تغيرت الإشارة بسبب رفع الملف لا بسبب العيب.',
            'Tube inspection commonly uses an internal bobbin coil pulled through the tube. The closer the coil diameter to the bore, the higher the fill factor and the better the sensitivity. Surface (pancake) coils suit manual scanning of plates and welds. The gap must stay constant during the scan, otherwise the signal changes from lift-off rather than from a flaw.'
          ),
        },
        {
          heading: t('رفع الملف والتدريع', 'Lift-off and shielding'),
          body: t(
            'زيادة المسافة بين الملف والسطح تخفض الاقتران وتغيّر الممانعة. هذا يفسد الكشف إذا تغيرت المسافة، لكنه يُستغل لقياس سماكة طلاء غير موصل. التدريع يقلل المجال الخارجي ويحسّن التركيز. يجب معايرة المسبار على سطح مرجعي من نفس المادة وبمسافة مماثلة لمسافة الفحص.',
            'Increasing the coil-to-surface gap reduces coupling and changes impedance. This spoils detection when the gap varies, but it is exploited to measure non-conductive coating thickness. Shielding reduces stray field and improves focus. Calibrate the probe on a reference of the same material and at a stand-off similar to the inspection.'
          ),
        },
      ],
      workedExample: {
        prompt: t('مسبار مطلق يُظهر انزياحاً تدريجياً أثناء مسح طويل. كيف تفرّق بينه وبين عيب؟', 'An absolute probe drifts steadily across a long scan. How do you separate drift from a flaw?'),
        solution: t('أعد المسح في الاتجاه المعاكس وبسرعة مختلفة. الانزياح التدريجي المرتبط بالزمن أو الحرارة يتكرر ولا يرتبط بموقع، بينما العيب يظهر في الموضع نفسه. يمكن أيضاً استخدام مسبار تفاضلي أو ضبط التوازن قبل كل مقطع.', 'Rescan in the opposite direction and at a different speed. Time- or temperature-related drift recurs without a fixed location, whereas a flaw appears at the same position. A differential probe or rebalancing before each section also helps.'),
      },
      exercise: {
        prompt: t('ما فائدة معامل الامتلاء العالي في فحص أنبوب بملف داخلي؟', 'What is the benefit of a high fill factor in internal tube inspection?'),
        hint: t('فكر في قوة الاقتران بين الملف والجدار.', 'Think about coupling between coil and wall.'),
        answer: t('يرفع الاقتران ويحسّن نسبة الإشارة إلى الضوضاء، فيزيد احتمال كشف العيوب الصغيرة.', 'It improves coupling and signal-to-noise, increasing the chance of detecting small flaws.'),
      },
      quiz: quiz(
        'et-probes-q1',
        'أي ميزة يقدمها المسبار التفاضلي؟',
        'Which advantage does a differential probe offer?',
        [
          ['كشف العيوب الطويلة المنتظمة بسهولة أكبر', 'Easier detection of long uniform defects'],
          ['تقليل الانزياح المشترك والتغيرات التدريجية', 'Reducing common drift and gradual changes'],
          ['قياس السماكة المطلقة مباشرة', 'Direct absolute thickness measurement'],
          ['العمل على المواد العازلة', 'Working on insulating materials'],
        ],
        1,
        'مقارنة ملفين متجاورين تلغي التغيرات المشتركة البطيئة.', 'Comparing two adjacent coils cancels common slow changes.'
      ),
      sources: ['nde-et-probes', 'nde-et-principles'],
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_et' },
      labId: 'ut_lab',
    },
    {
      id: 'et-impedance',
      title: t('المستوى الممانعي والطور والترشيح', 'The impedance plane, phase and filtering'),
      summary: t('كيف تُقرأ الإشارة: الاتجاه يعني العمق والمسافة تعني الحجم.', 'How to read the signal: direction for depth, magnitude for size.'),
      minutes: 26,
      objectives: [
        t('قراءة إشارة على مستوي المقاومة والمفاعلة.', 'Read a signal on the resistance–reactance plane.'),
        t('ربط زاوية الطور بعمق العيب وتأثير رفع الملف.', 'Relate phase angle to flaw depth and lift-off.'),
        t('ضبط المرشحات ومراجع المعايرة دون إخفاء العيب.', 'Set filters and reference standards without masking a flaw.'),
      ],
      sections: [
        {
          heading: t('لماذا المستوي الممانعي؟', 'Why the impedance plane?'),
          body: t(
            'يعرض الجهاز الممانعة كمتجه: المحور الأفقي للمقاومة والرأسي للمفاعلة. تُعاير نقطة الصفر على سطح سليم، ثم يرسم تغير الإشارة عند العيب. الطول والعرض يعطيان فكرة عن الحجم، والاتجاه (الطور) يعطي فكرة عن العمق ونوع التغير. عرض المستوي الممانعي أهم من مجرد سهم على شاشة رقمية.',
            'The instrument displays impedance as a vector: resistance on the horizontal axis, reactance on the vertical. The null is set on sound material, then the signal change is traced. Magnitude and width suggest size, while direction (phase) suggests depth and the type of change. The impedance-plane display carries more information than a single numeric arrow.'
          ),
        },
        {
          heading: t('الطور وعمق الاختراق', 'Phase and depth'),
          body: t(
            'يتأخر طور التيار الدوامي مع العمق بنحو 45 درجة لكل عمق اختراق قياسي. لذلك تظهر العيوب الأعمق بزوايا طور مختلفة عن العيوب السطحية، ويستخدم ذلك لتقدير العمق النسبي بعد معايرة على عيوب مرجعية معروفة. لا تعتمد زاوية الطور وحدها لتحديد العمق بدقة مطلقة؛ فهي تقدير يعتمد على المادة والهندسة والتردد.',
            'Eddy current phase lags with depth by roughly 45° per standard depth of penetration. Deeper flaws therefore appear at different phase angles from surface flaws, which is used to estimate relative depth after calibration on known reference flaws. Do not treat phase alone as an absolute depth measurement; it is an estimate that depends on material, geometry and frequency.'
          ),
        },
        {
          heading: t('المراجع والترشيح', 'References and filtering'),
          body: t(
            'المعايرة تكون على عيب مرجعي أو كتلة مرجعية مطابقة للمادة والهندسة. المرشحات تخفض الضوضاء والدوران والاهتزاز، لكن الترشيح الزائد يخفض السعة ويُزيح الطور وقد يخفي عيباً صغيراً. اضبط أقل ترشيح يحقق استقراراً مقبولاً، ووثّق إعداداته. أعد المعايرة عند تغيير المسبار أو السطح أو التردد.',
            'Calibrate on a reference flaw or block matched to the material and geometry. Filters suppress noise, wobble and vibration, but excessive filtering reduces amplitude, shifts phase and may hide a small flaw. Use the least filtering that gives acceptable stability, and record the settings. Recalibrate after changing probe, surface or frequency.'
          ),
        },
      ],
      workedExample: {
        prompt: t('عيبان: أحدهما سطحي والآخر على عمق قريب من δ. أيهما يظهر بطور أكبر ولماذا؟', 'Two flaws: one surface-breaking and one near a depth of δ. Which shows the larger phase angle and why?'),
        solution: t('العيب الأعمق يظهر عند طور متأخر أكبر، لأن الطور يتأخر مع العمق بنحو 45° لكل δ. يجب مقارنة الزوايا على نفس المعايرة والتردد والمادة.', 'The deeper flaw appears at a larger lagging phase angle because phase lags with depth by about 45° per δ. Compare angles only under the same calibration, frequency and material.'),
      },
      exercise: {
        prompt: t('اذكر خطرين للترشيح المفرط.', 'Name two risks of excessive filtering.'),
        hint: t('فكر في السعة والطور والعيوب الصغيرة.', 'Think amplitude, phase and small flaws.'),
        answer: t('خفض سعة الإشارة وتغيير الطور، مما يقلل احتمال كشف العيوب الصغيرة أو يجعل تقدير العمق خاطئاً.', 'It reduces signal amplitude and shifts phase, lowering the chance of detecting small flaws or biasing depth estimates.'),
      },
      quiz: quiz(
        'et-impedance-q1',
        'ماذا يمثل اتجاه متجه الإشارة على المستوي الممانعي بعد المعايرة؟',
        'After calibration, what does the direction of the signal vector on the impedance plane represent?',
        [
          ['لون السطح', 'Surface colour'],
          ['الطور، المرتبط بالعمق ونوع التغيّر', 'Phase, related to depth and type of change'],
          ['سماكة الطلاء فقط', 'Coating thickness only'],
          ['سرعة المسح حصراً', 'Scan speed exclusively'],
        ],
        1,
        'الطور يقدم تقديراً للعمق ونوع التغيّر بعد معايرة مناسبة.', 'Phase gives an estimate of depth and type of change after suitable calibration.'
      ),
      sources: ['nde-et-impedance', 'nde-et-procedures', 'nde-et-formulas'],
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_et' },
    },
    {
      id: 'et-applications',
      title: t('التطبيقات: الشروخ والأنابيب والقياس', 'Applications: cracks, tubes and measurement'),
      summary: t('أين يعمل ET فعلاً، وأين تخدعه الهندسة؟', 'Where ET works, and where geometry misleads it.'),
      minutes: 24,
      objectives: [
        t('اختيار المسبار والتردد لكشف شرخ سطحي.', 'Choose probe and frequency for surface crack detection.'),
        t('شرح فحص الأنابيب بملف داخلي وحدوده.', 'Explain bobbin tube inspection and its limits.'),
        t('قياس الموصلية والتحقق من المعالجة الحرارية.', 'Measure conductivity and verify heat treatment.'),
      ],
      sections: [
        {
          heading: t('الشروخ السطحية', 'Surface-breaking cracks'),
          body: t(
            'الشق السطحي يقطع مسار التيار الدوامي فيزيد المقاومة ويُنتج إشارة حادة. كلما كان الشق أعمق أو أطول كانت الإشارة أكبر، لكن اتجاه الشق بالنسبة لاتجاه التيار مهم: شق موازٍ للتيار ينتج إشارة أضعف بكثير من شق عمودي عليه. لهذا يُمسح باتجاهين متعامدين على الأقل.',
            'A surface crack interrupts the eddy current path, raising resistance and producing a sharp signal. Deeper or longer cracks give larger signals, but orientation relative to current matters: a crack parallel to the current produces a much weaker signal than one perpendicular to it. Scan in at least two perpendicular directions.'
          ),
        },
        {
          heading: t('الأنابيب', 'Tubes'),
          body: t(
            'ملف bobbin داخلي يتجاوب مع تآكل الجدار والشروخ الطولية والدائرية بدرجات متفاوتة، ويعطي صورة على شكل شريط. الألواح الداعمة والحواجز والانحناءات تنتج إشارات هندسية يجب تمييزها. الترددات المتعددة أو الطور يمكن أن يساعدا في فصل دعم الأنبوب عن العيب، لكن ذلك يحتاج معايرة وكتلاً مرجعية.',
            'An internal bobbin coil responds differently to wall loss and to longitudinal or circumferential cracks, producing a strip-chart trace. Support plates, baffles and bends create geometric signals that must be distinguished. Multiple frequencies or phase analysis can help separate a support from a flaw, but this requires calibration and reference blocks.'
          ),
        },
        {
          heading: t('القياس دون تلامس', 'Non-contact measurement'),
          body: t(
            'يمكن قياس الموصلية الكهربائية كمؤشر على السبيكة أو المعالجة الحرارية، وقياس سماكة طلاء غير موصل عبر رفع الملف، وقياس سماكة رقائق موصلة. القيم تتأثر بالحرارة والسطح والهندسة، لذا يُعاير الجهاز على عينات معروفة ويُصحح لدرجة الحرارة. لا تُستخدم قراءة واحدة كدليل قبول دون حد مرجعي.',
            'Conductivity can be measured as an indicator of alloy or heat treatment, non-conductive coating thickness via lift-off, and thin conductive sheet thickness. Values are affected by temperature, surface and geometry, so calibrate on known samples and correct for temperature. A single reading is not acceptance evidence without a reference limit.'
          ),
        },
      ],
      workedExample: {
        prompt: t('فحص أنبوب: إشارة متكررة عند كل لوح داعم. كيف تتعامل؟', 'Tube inspection shows a signal repeating at every support plate. How do you proceed?'),
        solution: t('الموقع المتكرر والدوري يوحي بإشارة هندسية من الدعم. استخدم تردداً أو طوراً مختلفاً أو مسباراً آخر، وقارن بإشارة لوح داعم مرجعي. لا تُسجل عيباً قبل استبعاد المصدر الهندسي.', 'A repeating, periodic location suggests a geometric support signal. Use another frequency, phase or probe and compare against a reference support. Do not record a flaw before excluding the geometric source.'),
      },
      exercise: {
        prompt: t('لماذا يُمسح السطح باتجاهين متعامدين؟', 'Why scan a surface in two perpendicular directions?'),
        hint: t('فكر في اتجاه الشق بالنسبة للتيار.', 'Think about crack orientation relative to current.'),
        answer: t('لأن الشق الموازي للتيار يعطي إشارة ضعيفة؛ المسح المتعامد يضمن قطع مسار التيار في أحد الاتجاهين.', 'A crack parallel to the current gives a weak signal; crossing directions ensures the current path is interrupted in one of them.'),
      },
      quiz: quiz(
        'et-applications-q1',
        'أي إشارة قد تكون هندسية لا عيباً في فحص أنبوب بملف داخلي؟',
        'Which signal may be geometric rather than a flaw in bobbin tube inspection?',
        [
          ['إشارة عند كل لوح داعم بموضع متكرر', 'A signal at every support plate in a repeating position'],
          ['إشارة حادة عشوائية في جدار سليم', 'A sharp random signal in an undamaged wall'],
          ['إشارة تتغير مع زيادة العمق', 'A signal that changes with increasing depth'],
          ['إشارة عند تغيير المعايرة', 'A signal when calibration changes'],
        ],
        0,
        'التكرار الدوري عند الدعامات مؤشر هندسي شائع يجب استبعاده قبل تسجيل عيب.',
        'Periodic repetition at supports is a common geometric indication that must be excluded before recording a flaw.'
      ),
      sources: ['nde-et-applications', 'nde-et-standards', 'nde-et-procedures'],
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_et' },
      textbook: { bookId: 'book-et', pageNumber: 1 },
    },
    {
      id: 'et-advanced',
      title: t('تقنيات متقدمة وحدود صريحة', 'Advanced techniques and explicit limits'),
      summary: t('ترددات متعددة ونبضية وحقل بعيد، ومتى لا يُستخدم ET.', 'Multi-frequency, pulsed and remote-field, and when ET is not suitable.'),
      minutes: 26,
      objectives: [
        t('شرح دور الترددات المتعددة في فصل الإشارات المتداخلة.', 'Explain multi-frequency mixing to separate overlapping signals.'),
        t('وصف التيار النبضي والحقل البعيد وحالات استخدامهما.', 'Describe pulsed eddy current and remote-field sensing and their uses.'),
        t('كتابة بيان حدود لفحص ET قبل التنفيذ.', 'Write a limits statement for an ET inspection before execution.'),
      ],
      sections: [
        {
          heading: t('الترددات المتعددة', 'Multiple frequencies'),
          body: t(
            'قياس واحد عند تردد واحد يخلط بين العيب والدعم والرفع والهندسة. القياس عند ترددات مختلفة يعطي إشارات تتفاعل مع هذه المتغيرات بطرق مختلفة، ثم تُدمج (mix) لإلغاء أحدها وإبراز الآخر. اختيار الترددات والدمج يحتاج دراسة ونماذج مرجعية؛ الخلط الخاطئ قد يلغي العيب نفسه.',
            'A single frequency mixes flaw, support, lift-off and geometry. Different frequencies interact with these variables differently; they can be mixed to suppress one and highlight another. Selecting frequencies and mixing requires study and reference samples, since an incorrect mix can cancel the flaw itself.'
          ),
        },
        {
          heading: t('النبضي والحقل البعيد', 'Pulsed and remote field'),
          body: t(
            'التيار النبضي يستخدم نبضة عريضة النطاق تخترق أعمق وتسمح بقياس سماكة الجدار تحت العزل أو الطلاء، وهو مفيد في خطوط الأنابيب المعزولة. الحقل البعيد يستخدم ملف إثارة وملف التقاط متباعدين بمسافة، ويناسب الأنابيب الحديدية السميكة والمناطق التي يتعذر فيها الوصول إلى السطح الداخلي. كلاهما أبطأ وأقل دقة من الفحص السطحي الموضعي.',
            'Pulsed eddy current uses a broadband pulse that penetrates deeper and allows wall-thickness measurement under insulation or coating, useful on insulated piping. Remote-field sensing uses separated exciter and detector coils at a distance and suits thick ferromagnetic tubes and areas with no internal access. Both are slower and less precise than local surface ET.'
          ),
        },
        {
          heading: t('حدود يجب كتابتها', 'Limits that must be written'),
          body: t(
            'قبل الفحص اكتب: المواد الموصلة فقط، والحد الأقصى للعمق المتوقع، وتأثير النفاذية في الفولاذ، وحساسية الاتجاه (الشروخ الموازية للتيار)، وأثر الرفع والهندسة والدعم، وحدود دقة تقدير العمق، والحاجة إلى معايرة مرجعية. هذه ليست تفاصيل إدارية؛ إنها شرط لصلاحية النتيجة.',
            'Before inspection, state: conductive materials only, expected maximum depth, permeability effects in steel, orientation sensitivity (cracks parallel to current), lift-off and geometric effects including supports, accuracy limits of depth estimation, and the need for reference calibration. These are not administrative details; they are conditions for a valid result.'
          ),
        },
      ],
      workedExample: {
        prompt: t('خط أنابيب معزول تريد قياس تآكل الجدار دون إزالة العزل. ما التقنية الأنسب؟', 'An insulated pipeline needs wall-loss measurement without removing insulation. Which technique fits?'),
        solution: t('التيار النبضي (pulsed eddy current) هو المرشح الشائع، لأنه يخترق العزل والطلاء ويكوّن تقديراً للتآكل. يجب معايرة على عينات بسماكات معروفة وتوثيق حدود الدقة والمناطق التي لا يصلها الفحص.', 'Pulsed eddy current is the usual candidate because it penetrates insulation and coating to estimate wall loss. Calibrate on known thickness samples and document accuracy limits and inaccessible areas.'),
      },
      exercise: {
        prompt: t('اذكر ثلاثة حدود يجب ذكرها في تقرير ET.', 'Name three limits that must appear in an ET report.'),
        hint: t('فكر في المادة والعمق والاتجاه والهندسة.', 'Think material, depth, orientation and geometry.'),
        answer: t('أي ثلاثة من: المواد الموصلة فقط، العمق المحدود، تأثير النفاذية، حساسية الاتجاه، أثر رفع الملف، الإشارات الهندسية، دقة تقدير العمق.', 'Any three of: conductive materials only, limited depth, permeability effects, orientation sensitivity, lift-off, geometric signals, depth-estimation accuracy.'),
      },
      quiz: quiz(
        'et-advanced-q1',
        'ما الفكرة الأساسية في دمج الترددات (frequency mixing)؟',
        'What is the core idea of frequency mixing?',
        [
          ['زيادة عدد المسابر فقط', 'Only increasing the number of probes'],
          ['إلغاء إشارة غير مرغوبة مثل الدعم أو الرفع وإبراز العيب', 'Suppressing an unwanted signal such as a support or lift-off while highlighting the flaw'],
          ['تحويل ET إلى طريقة صوتية', 'Converting ET into an acoustic method'],
          ['الاستغناء عن المعايرة', 'Eliminating calibration'],
        ],
        1,
        'الدمج يجمع إشارات ترددات مختلفة لإلغاء متغير هندسي أو رفع وإبقاء إشارة العيب.',
        'Mixing combines signals from different frequencies to cancel a geometric or lift-off variable while retaining the flaw signal.'
      ),
      sources: ['nde-et-advanced', 'nde-et-standards', 'nde-et-formulas'],
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_et' },
    },
  ],
  standards: ['ASME Sec V Art. 8', 'ISO 15548', 'ASTM E426', 'ASTM E309'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/EddyCurrent/index.xhtml',
  limits: t(
    'هذا المقرر تعليمي ولا يؤهل فاحص ET ولا يعتمد إجراءً أو حداً لتآكل الجدار. القيم والأمثلة لا تُستخدم كقرار قبول. يتطلب الفحص إجراءً معتمداً ومعايرة مرجعية ومواصفة عقد ونسخة كود مرخصة.',
    'This course is educational and does not qualify an ET inspector or approve a procedure or wall-loss limit. Values and examples are not acceptance decisions. Inspection requires an approved procedure, reference calibration, a contract specification and a licensed code edition.'
  ),
};
