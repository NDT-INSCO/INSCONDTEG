import { NdeEdCourse } from './types';
import { quiz, t } from './helpers';

export const mtCourse: NdeEdCourse = {
  id: 'nde-mt',
  disciplineId: 'conventional_ndt',
  code: 'MT',
  level: 'foundation',
  accent: '#f59e0b',
  title: t('الجسيمات المغناطيسية (MT)', 'Magnetic Particle Testing (MT)'),
  subtitle: t('المبدأ، التمغنط، الجسيمات، المعدات، والتفسير', 'Principle, magnetization, particles, equipment and interpretation'),
  description: t(
    'مقرر في فحص الجسيمات المغناطيسية للمواد الفيرومغناطيسية: كيف يتسرب الفيض عند العيب، كيف تختار اتجاه التمغنط وشدة المجال، وكيف تتحكم في الجسيمات والإضاءة. الموضوعات متتبعة لهيكل nde-ed.org والصياغة أصلية.',
    'A magnetic particle course for ferromagnetic materials: how flux leaks at a flaw, how to choose magnetization direction and field strength, and how to control particles and lighting. Topics follow the nde-ed.org structure with original wording.'
  ),
  prerequisites: t('أساسيات المغناطيسية ومنحنى B-H. يُفضل إكمال phy-magnetism.', 'Magnetism and B-H loop basics. Completing phy-magnetism is recommended.'),
  outcomes: [
    t('تفسير تسرب الفيض واتجاه المجال المطلوب.', 'Explain flux leakage and the required field direction.'),
    t('اختيار طريقة تمغنط مناسبة لهندسة القطعة.', 'Select a magnetization method for part geometry.'),
    t('ضبط الجسيمات والتعليق والإضاءة.', 'Control particles, suspension and lighting.'),
    t('تفسير الدلالات وإزالة المغنطة وتوثيق النتيجة.', 'Interpret indications, demagnetize and record the result.'),
  ],
  lessons: [
    {
      id: 'mt-principles',
      title: t('تسرب الفيض واتجاه العيب', 'Flux leakage and flaw orientation'),
      summary: t('لماذا يظهر العيب فقط عندما يقطع خطوط الفيض؟', 'Why a flaw appears only when it interrupts flux lines.'),
      minutes: 18,
      objectives: [
        t('شرح تكون القطبين عند العيب.', 'Explain pole formation at a discontinuity.'),
        t('ربط اتجاه المجال باتجاه العيب.', 'Relate field direction to flaw direction.'),
        t('تحديد المواد والحدود العمقية للطريقة.', 'Identify suitable materials and depth limits.'),
      ],
      sections: [
        {
          heading: t('أساس الكشف', 'Detection basis'),
          body: t(
            'عند تمغنط مادة فيرومغناطيسية تنتشر خطوط الفيض داخلها. إذا قطع عيبٌ هذه الخطوط، تنحرف الخطوط إلى السطح وتتكون مناطق قطبية تجذب الجسيمات. الدلالة هي تجمع جسيمات عند تسرب الفيض. إذا كان العيب موازياً للفيض، لا يحدث تسرب كافٍ وقد يُفوَّت.',
            'When a ferromagnetic part is magnetized, flux lines travel through it. If a discontinuity interrupts them, lines divert to the surface and form poles that attract particles. The indication is a particle build-up at the leakage site. If the flaw is parallel to the flux, leakage may be insufficient and the flaw missed.'
          ),
        },
        {
          heading: t('الاتجاه والعمق', 'Direction and depth'),
          body: t(
            'أفضل كشف عندما يكون المجال عمودياً تقريباً على العيب. لذلك تُستخدم غالباً مغنطة طولية ومحيطية. الكشف يتركز عند السطح وقريباً منه؛ العمق الفعلي يعتمد على نوع التيار وشدة المجال وهندسة القطعة. العيوب العميقة قد تظهر بضعف أو لا تظهر.',
            'Detection is best when the field is roughly perpendicular to the flaw, so longitudinal and circumferential magnetization are often combined. Detection is concentrated at and near the surface; actual depth depends on current type, field strength and geometry. Deep flaws may be weak or invisible.'
          ),
        },
        {
          heading: t('المواد المناسبة', 'Suitable materials'),
          body: t(
            'تشمل المواد الفيرومغناطيسية الفولاذ الكربوني والمنخفض السبائكية وبعض الفولاذ المقاوم للصدأ الفيريتي/المارتنسيتي. الفولاذ الأوستنيتي والألومنيوم والنحاس والتيتانيوم غير مناسبة. يجب التحقق من قابلية المادة للمغنطة قبل الفحص، لا الافتراض من الاسم التجاري.',
            'Ferromagnetic materials include carbon and low-alloy steels and some ferritic/martensitic stainless steels. Austenitic stainless, aluminium, copper and titanium are unsuitable. Verify magnetizability before testing; do not infer it from a trade name.'
          ),
        },
      ],
      workedExample: {
        prompt: t('شق طولي في أنبوب. أي اتجاه مجال تختار أولاً؟', 'A longitudinal crack in a pipe. Which field direction first?'),
        solution: t('استخدم مجالاً محيطياً (circumferential) ليكون عمودياً على الشق الطولي. يضاف اتجاه طولي للكشف عن الشقوق العرضية. لا تعتمد على اتجاه واحد لتغطية كل الاحتمالات.', 'Use a circumferential field to be perpendicular to the longitudinal crack. Add a longitudinal direction for transverse cracks. Do not rely on one direction to cover all possibilities.'),
      },
      exercise: {
        prompt: t('لماذا لا يُكشف شق موازٍ لخطوط الفيض جيداً؟', 'Why is a crack parallel to flux lines poorly detected?'),
        hint: t('فكر في انحراف الخطوط وتكوين الأقطاب.', 'Think about flux diversion and pole formation.'),
        answer: t('لأن الخطوط لا تُقطع بشكل كافٍ، فلا يتكون تسرب واضح إلى السطح ولا تجذب الجسيمات.', 'The lines are not interrupted enough, so no clear surface leakage forms and particles are not attracted.'),
      },
      quiz: quiz(
        'mt-principles-q1',
        'أي مادة لا تصلح لفحص MT؟',
        'Which material is unsuitable for MT?',
        [
          ['فولاذ كربوني', 'Carbon steel'],
          ['فولاذ مارتنزيتي مقاوم للصدأ', 'Martensitic stainless steel'],
          ['ألومنيوم', 'Aluminium'],
          ['حديد زهر فيرومغناطيسي', 'Ferromagnetic cast iron'],
        ],
        2,
        'الألومنيوم غير فيرومغناطيسي؛ MT يحتاج مادة قابلة للمغنطة.',
        'Aluminium is not ferromagnetic; MT requires a magnetizable material.'
      ),
      sources: ['nde-mt-principles', 'nde-mt-magnetism', 'nde-mt-orientation'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_mt' },
      textbook: { bookId: 'book-mt', pageNumber: 1 },
      labId: 'pt_mt_darkroom',
    },
    {
      id: 'mt-magnetization',
      title: t('طرق التمغنط والمجال', 'Magnetization methods and field'),
      summary: t('اليوك والبرود والملف والتيار: أيها يناسب القطعة؟', 'Yoke, prod, coil and current: which suits the part?'),
      minutes: 22,
      objectives: [
        t('مقارنة اليوك والبرود والملف والموصل المركزي.', 'Compare yoke, prod, coil and central conductor.'),
        t('شرح أثر نوع التيار على العمق.', 'Explain how current type affects depth.'),
        t('استخدام نسبة L/D والحالة المستمرة/المتبقية.', 'Use L/D ratio and continuous/residual magnetization.'),
      ],
      sections: [
        {
          heading: t('الطرق', 'Methods'),
          body: t(
            'اليوك يولد مجالاً بين قطبيه ويناسب الأسطح واللحامات. البرود يمرر تياراً عبر القطعة ويترك آثاراً. الملف يولد مجالاً طولياً، والموصل المركزي يولد مجالاً محيطياً داخل التجاويف. اختيار الطريقة يعتمد على الشكل والوصول واتجاه العيب المطلوب.',
            'A yoke creates a field between its poles and suits surfaces and welds. Prods pass current through the part and may leave marks. A coil produces a longitudinal field; a central conductor produces a circumferential field inside bores. Selection depends on shape, access and the flaw direction sought.'
          ),
        },
        {
          heading: t('التيار والعمق', 'Current and depth'),
          body: t(
            'التيار المتردد (AC) يُستخدم غالباً مع اليوك ويركز المجال قرب السطح. التيار المستمر (DC) والنصف موجي (HWDC) يخترقان أعمق. شدة المجال المطلوبة تعتمد على الطريقة والحجم؛ تحقق بمؤشر مجال بدلاً من الافتراض. التيار الزائد قد يسبب احتراقاً أو دلالات كاذبة.',
            'Alternating current (AC) is common with yokes and concentrates the field near the surface. Direct current (DC) and half-wave DC penetrate deeper. Required field strength depends on method and size; verify with a field indicator instead of assuming. Excessive current can cause burning or false indications.'
          ),
        },
        {
          heading: t('L/D والمغنطة المتبقية', 'L/D and residual magnetization'),
          body: t(
            'نسبة الطول إلى القطر تحدد سهولة تمغنط القطعة بالملف. القطع القصيرة السميكة (L/D صغيرة) تحتاج موصلًا مركزياً أو لف كابل. المغنطة المستمرة تُطبق الجسيمات أثناء مرور المجال، والمتبقية بعد إزالته؛ المتبقية تعتمد على الاحتفاظ المغناطيسي للمادة وقد لا تكفي للمواد منخفضة التخلفية.',
            'The length-to-diameter ratio governs how easily a part is magnetized in a coil. Short, thick parts (low L/D) need a central conductor or cable wrap. Continuous magnetization applies particles while the field is on; residual applies them after it is removed and depends on the material’s retentivity, which may be insufficient.'
          ),
        },
      ],
      workedExample: {
        prompt: t('قطعة طولها 300 mm وقطرها 50 mm. احسب L/D.', 'A part is 300 mm long and 50 mm in diameter. Calculate L/D.'),
        solution: t('L/D = 300/50 = 6. القيمة متوسطة؛ قد يكون الملف كافياً لكن التحقق بمؤشر مجال ضروري. القطع ذات L/D الأصغر قد تحتاج موصلًا مركزياً.', 'L/D = 300/50 = 6. This is moderate; a coil may be adequate, but field-indicator verification is required. Parts with lower L/D may need a central conductor.'),
      },
      exercise: {
        prompt: t('قطعة طولها 200 mm وقطرها 50 mm. احسب L/D وماذا يعني؟', 'A part is 200 mm long and 50 mm diameter. Calculate L/D and interpret it.'),
        hint: t('L/D = 4.', 'L/D = 4.'),
        answer: t('L/D = 4، وهي منخفضة نسبياً؛ التمغنط بالملف أقل كفاءة، وقد يلزم موصل مركزي أو لف كابل مع التحقق الميداني.', 'L/D = 4, relatively low; coil magnetization is less efficient, so a central conductor or cable wrap may be needed with field verification.'),
      },
      quiz: quiz(
        'mt-magnetization-q1',
        'ما ميزة التيار المستمر في MT؟',
        'What is an advantage of direct current in MT?',
        [
          ['مجال أعمق من التيار المتردد', 'A deeper field than alternating current'],
          ['لا يحتاج جسيمات', 'It requires no particles'],
          ['يعمل على الألومنيوم', 'It works on aluminium'],
          ['يلغي الحاجة لإزالة المغنطة', 'It removes the need for demagnetization'],
        ],
        0,
        'DC/HWDC يخترقان أعمق من AC الذي يتركز قرب السطح.',
        'DC/HWDC penetrates deeper than AC, which concentrates near the surface.'
      ),
      sources: ['nde-mt-current', 'nde-mt-ld', 'nde-mt-continuous', 'nde-mt-portable'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_mt' },
      textbook: { bookId: 'book-mt', pageNumber: 2 },
      labId: 'pt_mt_darkroom',
    },
    {
      id: 'mt-media',
      title: t('الجسيمات والتعليق والحساسية', 'Particles, suspension and sensitivity'),
      summary: t('جاف أم رطب؟ فلوري أم مرئي؟', 'Dry or wet? Fluorescent or visible?'),
      minutes: 18,
      objectives: [
        t('مقارنة الجسيمات الجافة والرطبة.', 'Compare dry and wet particles.'),
        t('شرح دور حجم الجسيم وشكلها وتلوينها.', 'Explain particle size, shape and colour.'),
        t('ضبط تركيز التعليق وتلوثه.', 'Control suspension concentration and contamination.'),
      ],
      sections: [
        {
          heading: t('الجسيمات الجافة', 'Dry particles'),
          body: t(
            'تُستخدم جسيمات جافة مع مغنطة مستمرة غالباً، وتناسب الأسطح الخشنة واللحامات الساخنة نسبياً. تحتاج تدفقاً مناسباً وإضاءة جيدة. الجسيمات الدقيقة قد تلتصق بالتجاويف وتسبب ضوضاء؛ الجسيمات الخشنة أقل حساسية.',
            'Dry particles are often used with continuous magnetization and suit rough surfaces and moderately warm welds. They need suitable flow and good lighting. Fine particles may lodge in crevices and cause noise; coarse particles are less sensitive.'
          ),
        },
        {
          heading: t('التعليق الرطب', 'Wet suspension'),
          body: t(
            'تُعلَّق الجسيمات في سائل حامل وتُطبق بالرش أو الغمر. الفلوري الرطب شائع للكشف عالي الحساسية تحت UV-A. يجب ضبط التركيز ودرجة الحموضة/القلوية والتلوث وفق المواصفة، لأن التركيز المنخفض يضعف الدلالة والمرتفع يسبب ترسباً وضوضاء.',
            'Particles are suspended in a carrier liquid and applied by spray or immersion. Fluorescent wet suspension is common for high-sensitivity UV-A inspection. Concentration, pH and contamination must be controlled per specification: low concentration weakens indications, high concentration causes settling and noise.'
          ),
        },
        {
          heading: t('الاختيار', 'Selection'),
          body: t(
            'الأسطح الخشنة تميل للجسيمات الجافة أو المرئية، والأسطح الناعمة والحرجة للفلوري الرطب. الضوء الأبيض القوي قد يغسل الدلالة الفلورية؛ والضوء الأسود لا يفيد مع الجسيمات غير الفلورية. اختر النظام كوحدة: جسيم + تعليق + إضاءة + مشاهدة.',
            'Rough surfaces tend toward dry or visible particles; smooth, critical surfaces toward wet fluorescent. Strong white light can wash out a fluorescent indication, and black light does nothing for non-fluorescent particles. Select the system as a unit: particle, suspension, lighting and viewing.'
          ),
        },
      ],
      workedExample: {
        prompt: t('لحام خشن في ورشة مفتوحة: جاف أم رطب فلوري؟', 'A rough weld in an open shop: dry or wet fluorescent?'),
        solution: t('الجاف المرئي عادة أنسب للخشونة والإضاءة المحيطة، مع تمغنط مستمر. الفلوري الرطب يحتاج تعتيم وتحكماً في التركيز. القرار النهائي وفق الإجراء وحساسية القطعة، ويمكن التحقق بكتلة مرجعية.', 'Visible dry particles are usually better for roughness and ambient light, with continuous magnetization. Wet fluorescent needs darkness and concentration control. The final choice follows procedure and part sensitivity, verified on a reference block.'),
      },
      exercise: {
        prompt: t('لماذا يجب التحقق من تركيز التعليق الرطب؟', 'Why must wet-suspension concentration be checked?'),
        hint: t('فكر في الدلالة الضعيفة والترسب.', 'Think weak indications and settling.'),
        answer: t('التركيز المنخفض يعطي دلالات ضعيفة، والمرتفع يسبب ترسباً وتجمعات كاذبة؛ كلاهما يقلل موثوقية التفسير.', 'Low concentration gives weak indications; high concentration causes settling and false clusters; both reduce interpretation reliability.'),
      },
      quiz: quiz(
        'mt-media-q1',
        'ما الذي تحتاجه الجسيمات الفلورية لتظهر؟',
        'What do fluorescent particles need to be visible?',
        [
          ['ضوء أبيض قوي', 'Strong white light'],
          ['ضوء UV-A وتعتيم مناسب', 'UV-A light and suitable darkening'],
          ['تيار متردد فقط', 'AC current only'],
          ['ماء فقط', 'Water only'],
        ],
        1,
        'الفلورية تُثار بالضوء فوق البنفسجي وتحتاج ظروف مشاهدة مظلمة.',
        'Fluorescence is excited by UV-A and needs dark viewing conditions.'
      ),
      sources: ['nde-mt-particles', 'nde-mt-suspension', 'nde-mt-wet', 'nde-mt-concentration'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_mt' },
      textbook: { bookId: 'book-mt', pageNumber: 3 },
    },
    {
      id: 'mt-equipment',
      title: t('المعدات والإضاءة ومؤشرات المجال', 'Equipment, lighting and field indicators'),
      summary: t('كيف تتحقق أن المجال كافٍ قبل الحكم؟', 'How to verify the field is adequate before judging.'),
      minutes: 18,
      objectives: [
        t('اختيار معدات محمولة أو ثابتة حسب العمل.', 'Select portable or stationary equipment for the job.'),
        t('التحقق من شدة المجال بمؤشر مناسب.', 'Verify field strength with a suitable indicator.'),
        t('ضبط الإضاءة والتحقق الدوري.', 'Set lighting and perform periodic checks.'),
      ],
      sections: [
        {
          heading: t('المعدات', 'Equipment'),
          body: t(
            'المعدات المحمولة تشمل اليوك الكهربائي والمغناطيس الدائم ومصادر التيار للبرود. المعدات الثابتة تشمل مقاعد التمغنط والملفات وأنظمة الرش. يجب التحقق من قدرة المعدات على تحقيق المجال المطلوب، ومن سلامة الكابلات والأرضي والحماية الكهربائية.',
            'Portable equipment includes electromagnetic yokes, permanent magnets and prod current sources. Stationary equipment includes magnetizing benches, coils and spray systems. Verify that equipment can achieve the required field, and check cables, grounding and electrical protection.'
          ),
        },
        {
          heading: t('مؤشرات المجال', 'Field indicators'),
          body: t(
            'مؤشر المجال قطعة مرجعية تُظهر اتجاه وكفاية المجال. يُستخدم للتحقق من أن اليوك أو الملف يولد مجالاً كافياً قبل الفحص، وللكشف عن ملفات معطلة أو تلامس ضعيف. لا تعتمد على صوت اليوك أو شدة التيار فقط.',
            'A field indicator is a reference piece that shows field direction and adequacy. It verifies that a yoke or coil produces enough field before inspection and reveals faulty coils or poor contact. Do not rely only on yoke sound or current setting.'
          ),
        },
        {
          heading: t('الإضاءة والفحص الدوري', 'Lighting and periodic checks'),
          body: t(
            'الفحص المرئي يحتاج ضوءاً أبيض كافياً، والفلوري يحتاج UV-A بشدة مناسبة وضوءاً محيطاً منخفضاً. تُفحص مصابيح UV دورياً، وتُقاس الشدة عند مسافة العمل. تحقق أيضاً من تركيز الجسيمات وحالة الحوض والأرضي والكابلات وسلامة العدسات.',
            'Visible inspection needs adequate white light; fluorescent inspection needs suitable UV-A intensity and low ambient light. UV lamps are checked periodically and intensity measured at working distance. Also verify particle concentration, bath condition, grounding, cables and lens condition.'
          ),
        },
      ],
      workedExample: {
        prompt: t('يوك يعمل بالتيار المتردد ولا يرفع مؤشر المجال عند طرفيه. ما الإجراء؟', 'An AC yoke does not lift the field indicator at its poles. What do you do?'),
        solution: t('أوقف الفحص. تحقق من الكابلات والمفتاح والتلامس وسلامة اليوك. لا تزد التيار عشوائياً. استخدم يوكاً آخر أو أعد التحقق وفق الإجراء؛ لا تبدأ الفحص بمعدة غير محققة.', 'Stop the inspection. Check cables, switch, contact and yoke condition. Do not increase current arbitrarily. Use another yoke or re-verify per procedure; do not inspect with unverified equipment.'),
      },
      exercise: {
        prompt: t('ما وظيفة مؤشر المجال؟', 'What is the function of a field indicator?'),
        hint: t('هل يقيس التيار أم يكشف وجود المجال واتجاهه؟', 'Does it measure current or reveal field presence and direction?'),
        answer: t('التحقق من وجود المجال واتجاهه وكفايته عند القطب أو على القطعة، وكشف الأعطال أو التلامس الضعيف.', 'Verify field presence, direction and adequacy at the pole or on the part, and reveal faults or poor contact.'),
      },
      quiz: quiz(
        'mt-equipment-q1',
        'لماذا نستخدم مؤشر المجال بدلاً من الاعتماد على قيمة التيار فقط؟',
        'Why use a field indicator instead of relying only on current setting?',
        [
          ['لأن التيار لا يؤثر', 'Because current has no effect'],
          ['لأن المجال الفعلي يعتمد على الهندسة والتلامس وحالة المعدة', 'Because actual field depends on geometry, contact and equipment condition'],
          ['لأن المؤشر يقيس الحرارة', 'Because the indicator measures temperature'],
          ['لأن المؤشر يزيل المغنطة', 'Because the indicator demagnetizes'],
        ],
        1,
        'نفس التيار قد يعطي مجالاً مختلفاً حسب الدائرة والقطعة؛ المؤشر يتحقق من النتيجة الفعلية.',
        'The same current can give a different field depending on the circuit and part; the indicator verifies the actual result.'
      ),
      sources: ['nde-mt-portable', 'nde-mt-stationary', 'nde-mt-indicators', 'nde-mt-concentration'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-mt', pageNumber: 4 },
    },
    {
      id: 'mt-interpretation',
      title: t('تفسير الدلالات وإزالة المغنطة', 'Indication interpretation and demagnetization'),
      summary: t('متى تكون الدلالة عيباً، ومتى تكون أثراً سطحياً؟', 'When is an indication a flaw, and when a surface artefact?'),
      minutes: 20,
      objectives: [
        t('تمييز أشكال الدلالات وأسبابها.', 'Distinguish indication shapes and causes.'),
        t('تحديد الحاجة إلى إزالة المغنطة.', 'Determine when demagnetization is required.'),
        t('توثيق النتيجة وحدود الطريقة.', 'Record the result and method limits.'),
      ],
      sections: [
        {
          heading: t('أشكال الدلالات', 'Indication patterns'),
          body: t(
            'الدلالة الخطية الحادة قد ترتبط بشق، والدلالات المتفرقة الدائرية بمسامية، والدلالة العريضة غير المنتظمة قد تكون أثراً سطحياً. الدلالات الناتجة عن أقطاب المغناطيس أو التلامس تظهر عند نقاط محددة وتختفي بعد إعادة التمغنط أو التنظيف. التفسير يحتاج معرفة الهندسة وتاريخ التصنيع.',
            'A sharp linear indication may relate to a crack, scattered rounded indications to porosity, and a broad irregular mark to a surface artefact. Magnet or contact poles produce indications at specific points that may disappear after re-magnetization or cleaning. Interpretation needs geometry and manufacturing history.'
          ),
        },
        {
          heading: t('إزالة المغنطة', 'Demagnetization'),
          body: t(
            'بعد MT قد تبقى القطعة ممغنطة، وقد يؤثر ذلك على اللحام أو القطع المتحركة أو القياسات الحساسة. تُزال المغنطة بتقليل المجال تدريجياً أو استخدام اتجاه/تردد مناسب، وتُتحقق بقيمة منخفضة وفق المواصفة. ليست كل قطعة تحتاج إزالة؛ حدد المتطلب قبل العمل.',
            'After MT a part may remain magnetized, affecting welding, moving components or sensitive measurements. Demagnetization uses a gradually decreasing field or a suitable direction/frequency and is verified against a specification limit. Not every part requires it; establish the requirement before work.'
          ),
        },
        {
          heading: t('الحدود والتوثيق', 'Limits and records'),
          body: t(
            'MT سطحي/قريب من السطح فقط، ولا يكشف العيوب الداخلية العميقة. يحتاج مادة فيرومغناطيسية واتجاهاً مناسباً للمجال. السجل يشمل الطريقة والتيار ونوع الجسيمات والتركيز والاتجاه والمؤشر والإضاءة والنتيجة والموقع. «لا دلالة» لا تعني «لا عيب» خارج حدود الطريقة.',
            'MT is surface/near-surface only and cannot find deep internal flaws. It needs a ferromagnetic material and suitable field direction. The record includes method, current, particle type, concentration, direction, indicator, lighting, result and location. “No indication” does not mean “no flaw” outside the method’s limits.'
          ),
        },
      ],
      workedExample: {
        prompt: t('دلالة عند نقطة تلامس البرود فقط. هل هي عيب؟', 'An indication appears only at a prod contact point. Is it a flaw?'),
        solution: t('قد تكون أثراً من التلامس/الاحتراق. أعد التنظيف والتمغنط بطريقة لا تلامسية، وافحص الموضع المجاور. إذا اختفت، فليست دليلاً على عيب داخلي. إذا بقيت، قيّمها وفق المعيار ووثّقها.', 'It may be a contact/burn artefact. Re-clean and magnetize non-contact, then examine the adjacent area. If it disappears, it is not evidence of an internal flaw. If it remains, assess against the criterion and record it.'),
      },
      exercise: {
        prompt: t('اذكر حالتين تستدعيان إزالة المغنطة.', 'Name two situations requiring demagnetization.'),
        hint: t('فكر في اللحام اللاحق والقطع المتحركة والقياسات.', 'Think subsequent welding, moving parts and measurements.'),
        answer: t('قبل لحام لاحق أو تشغيل قطع متحركة حساسة، وعندما تحدد المواصفة حداً للمغناطيسية المتبقية أو تؤثر على القياس.', 'Before subsequent welding or operation of sensitive moving parts, and when a specification sets a residual-magnetism limit or measurements are affected.'),
      },
      quiz: quiz(
        'mt-interpretation-q1',
        'هل «لا دلالة» في MT تعني عدم وجود أي عيب؟',
        'Does “no indication” in MT mean no flaw exists?',
        [
          ['نعم دائماً', 'Always yes'],
          ['لا؛ الطريقة محدودة بالسطح والقريب منه وبالمواد الفيرومغناطيسية', 'No; the method is limited to surface/near-surface and ferromagnetic materials'],
          ['نعم، إذا كان التيار مرتفعاً', 'Yes, if current is high'],
          ['لا، لأن MT يكشف العيوب الداخلية فقط', 'No, because MT only finds internal flaws'],
        ],
        1,
        'غياب الدلالة داخل حدود الطريقة لا ينفي وجود عيب خارج هذه الحدود.',
        'Absence of an indication within method limits does not exclude a flaw outside them.'
      ),
      sources: ['nde-mt-indications', 'nde-mt-orientation', 'nde-mt-continuous', 'nde-mt-stationary'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-mt', pageNumber: 5 },
    },
  ],
  standards: ['ASME Sec V Art. 7', 'ASTM E709 / E1444', 'ISO 9934'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/MagParticle/index.xhtml',
  limits: t(
    'لا يمنح المقرر تأهيل MT ولا يحدد قيم تيار أو تركيز ملزمة. القيم والإجراءات تأتي من مواصفة العقد والكود والإجراء المعتمد والمعدات المستخدمة.',
    'The course does not qualify an MT inspector or set mandatory current or concentration values. Values and procedures come from the contract specification, code, approved procedure and equipment.'
  ),
};
