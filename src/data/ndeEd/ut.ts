import { NdeEdCourse } from './types';
import { quiz, t } from './helpers';

export const utCourse: NdeEdCourse = {
  id: 'nde-ut',
  disciplineId: 'conventional_ndt',
  code: 'UT',
  level: 'level1',
  accent: '#22d3ee',
  title: t('الموجات فوق الصوتية (UT)', 'Ultrasonic Testing (UT)'),
  subtitle: t('المبدأ، الحزمة، العرض، المعايرة، اللحام، والتقنيات المتقدمة', 'Principle, beam, display, calibration, welds and advanced techniques'),
  description: t(
    'مقرر UT من الفيزياء إلى قرار الفحص: توليد الصوت، شكل الحزمة، عرض A-Scan، معايرة DAC، فحص اللحام بالزاوية، ولمحة عن الغمر وEMAT وPAUT/TOFD. المحتوى أصلي وهيكل الموضوعات متتبع لصفحات nde-ed.org.',
    'UT from physics to inspection decisions: sound generation, beam shape, A-Scan display, DAC calibration, angle-beam weld inspection, and an outline of immersion, EMAT and PAUT/TOFD. Original content following the nde-ed.org topic structure.'
  ),
  prerequisites: t('إكمال phy-waves وphy-impedance، وأساسيات حساب المثلثات.', 'Complete phy-waves and phy-impedance, plus basic trigonometry.'),
  outcomes: [
    t('حساب الطول الموجي والمنطقة القريبة وزاوية الانتشار.', 'Calculate wavelength, near field and beam divergence.'),
    t('قراءة A-Scan وضبط البوابة والمعايرة.', 'Read an A-Scan and set gates and calibration.'),
    t('بناء منحنى DAC واستخدامه في تقييم الإشارة.', 'Build and use a DAC curve for signal evaluation.'),
    t('تحديد موقع عيب في لحام بحزمة مائلة.', 'Locate a weld flaw with an angle beam.'),
    t('شرح حدود UT ومتى تُستخدم تقنيات متقدمة.', 'Explain UT limits and when advanced techniques apply.'),
  ],
  lessons: [
    {
      id: 'ut-principles',
      title: t('توليد الصوت والنبضة والصدى', 'Sound generation, pulse and echo'),
      summary: t('كيف يتحول الجهد الكهربائي إلى صورة داخل المعدن؟', 'How an electrical voltage becomes an image inside metal.'),
      minutes: 20,
      objectives: [
        t('شرح عمل المسبار الكهروضغطي.', 'Explain piezoelectric probe operation.'),
        t('ربط التردد بالطول الموجي والحساسية.', 'Relate frequency to wavelength and sensitivity.'),
        t('تفسير زمن الرحلة والمسار ذهاباً وعودة.', 'Interpret time of flight and the round-trip path.'),
      ],
      sections: [
        {
          heading: t('المسبار', 'The probe'),
          body: t(
            'تحتوي البلورة الكهروضغطية على شحنة تتغير عند تشوهها، والعكس. نبضة كهربائية تجعلها تهتز وتولد موجة صوتية، والصدى العائد يجعلها تولد جهداً. المسبار قد يكون طولياً أو مائلاً أو سطحياً حسب التطبيق، والترددات الصناعية عادة بين 0.5 و15 MHz.',
            'A piezoelectric crystal develops charge when strained and deforms when charged. An electrical pulse makes it vibrate and launch sound; a returning echo makes it generate a voltage. Probes may be longitudinal, angle or surface wave, with industrial frequencies typically 0.5–15 MHz.'
          ),
        },
        {
          heading: t('زمن الرحلة', 'Time of flight'),
          body: t(
            'في pulse-echo يقطع الصوت المسافة إلى العاكس ثم يعود، لذلك t = 2d/v. المسار يعتمد على سرعة المادة ونمط الموجة والحرارة. تأخير المسبار والغطاء الأمامي يجب تعويضه في المعايرة. سماكة بسيطة دون تعويض تعطي قراءة منحازة.',
            'In pulse-echo, sound travels to the reflector and back, so t = 2d/v. Path depends on material velocity, wave mode and temperature. Probe delay and wear plate must be compensated during calibration. A simple thickness reading without compensation is biased.'
          ),
        },
        {
          heading: t('التردد والاختراق', 'Frequency and penetration'),
          body: t(
            'التردد الأعلى يعطي طولاً موجياً أقصر وحساسية أفضل لعيوب صغيرة، لكنه يزيد التوهين والضوضاء في الحبيبات الخشنة. التردد المنخفض أفضل للمواد السميكة أو ذات الحبيبات الكبيرة. اختيار التردد يحدده الإجراء والقطعة وليس قاعدة عامة.',
            'Higher frequency gives a shorter wavelength and better sensitivity to small flaws, but more attenuation and grain noise. Lower frequency suits thick or coarse-grained materials. Frequency choice is set by procedure and part, not a universal rule.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سرعة 5920 m/s وزمن ذهاب وعودة 10 µs. احسب السمك.', 'Velocity 5920 m/s and a 10 µs round-trip time. Calculate thickness.'),
        solution: t('t = 2d/v ⇒ d = v×t/2 = 5920 × 10×10^-6 / 2 = 0.0296 m = 29.6 mm. لا تنسَ القسمة على 2 أو تعويض تأخير المسبار.', 't = 2d/v ⇒ d = v×t/2 = 5920 × 10×10^-6 / 2 = 0.0296 m = 29.6 mm. Do not omit the factor of two or probe-delay compensation.'),
      },
      exercise: {
        prompt: t('نفس السرعة وزمن 20 µs. احسب السمك.', 'Same velocity with a 20 µs round trip. Calculate thickness.'),
        hint: t('d = v×t/2.', 'd = v×t/2.'),
        answer: t('d = 5920 × 20×10^-6 / 2 = 0.0592 m = 59.2 mm.', 'd = 5920 × 20×10^-6 / 2 = 0.0592 m = 59.2 mm.'),
      },
      quiz: quiz(
        'ut-principles-q1',
        'لماذا نقسم زمن pulse-echo على اثنين عند حساب السمك؟',
        'Why divide pulse-echo time by two when calculating thickness?',
        [
          ['لتعويض التردد', 'To compensate frequency'],
          ['لأن الصوت يقطع المسافة ذهاباً وعودة', 'Because sound travels the path out and back'],
          ['لإلغاء التوهين', 'To cancel attenuation'],
          ['لأن السرعة تتضاعف', 'Because velocity doubles'],
        ],
        1,
        'الزمن المقاس يشمل الاتجاهين، والمسافة أحادية الاتجاه.',
        'Measured time covers both directions; thickness is one way.'
      ),
      sources: ['nde-ut-principles', 'nde-ut-piezo', 'nde-ut-normal'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_ut' },
      textbook: { bookId: 'book-ut', pageNumber: 1 },
      labId: 'ut_lab',
    },
    {
      id: 'ut-beam',
      title: t('الحزمة والمنطقة القريبة والاقتران', 'Beam, near field and coupling'),
      summary: t('أين تكون الحساسية أعلى، وكيف تنتشر الحزمة؟', 'Where is sensitivity highest, and how does the beam spread?'),
      minutes: 22,
      objectives: [
        t('حساب المنطقة القريبة N.', 'Calculate the near field N.'),
        t('تقدير زاوية انتشار الحزمة.', 'Estimate beam divergence.'),
        t('شرح أثر وسيط الاقتران والزاوية.', 'Explain couplant and angle effects.'),
      ],
      sections: [
        {
          heading: t('المنطقة القريبة', 'Near field'),
          body: t(
            'في المنطقة القريبة (Fresnel) تتداخل الموجات وتتغير الشدة بشكل معقد، وقد لا يكون تقييم السعة موثوقاً. لبلورة دائرية قطرها D وطول موجي λ: N = D²/(4λ). قطر أكبر أو تردد أعلى يزيد N. تبدأ المنطقة البعيدة بعد N وتكون الحزمة أكثر انتظاماً.',
            'In the near field (Fresnel) waves interfere and intensity varies in a complex way, so amplitude evaluation may be unreliable. For a circular crystal of diameter D and wavelength λ: N = D²/(4λ). A larger crystal or higher frequency increases N. The far field begins beyond N and is more uniform.'
          ),
        },
        {
          heading: t('انتشار الحزمة', 'Beam spread'),
          body: t(
            'تنحرف الحزمة تدريجياً عن المحور. زاوية نصف الانتشار التقريبية: sin θ ≈ 0.51 λ/D (للبلورة الدائرية). كلما كبر D أو صغر λ ضاقت الحزمة. الحزمة الضيقة تعطي تحديداً أفضل للموقع لكن تغطية أقل لكل تمريرة.',
            'The beam gradually diverges. Approximate half-angle: sin θ ≈ 0.51 λ/D for a circular crystal. Larger D or smaller λ narrows the beam. A narrow beam localises better but covers less area per pass.'
          ),
        },
        {
          heading: t('الاقتران والزاوية', 'Coupling and angle'),
          body: t(
            'وسيط الاقتران يزيل الفجوة الهوائية. سماكة الوسيط وحالته تؤثران على السعة، ويجب إعادة المعايرة عند تغييره. في الحزمة المائلة، قانون سنيل يحدد زاوية الانكسار: sin θ1/v1 = sin θ2/v2. الزوايا الحرجة تنتج موجات سطحية أو تنعكس كلياً.',
            'Couplant removes the air gap. Its thickness and condition affect amplitude, so recalibrate when it changes. For angle beams, Snell’s law sets refraction: sin θ1/v1 = sin θ2/v2. Critical angles produce surface waves or total reflection.'
          ),
        },
      ],
      workedExample: {
        prompt: t('بلورة 10 mm وλ=1.48 mm. احسب N.', 'A 10 mm crystal with λ = 1.48 mm. Calculate N.'),
        solution: t('N = D²/(4λ) = 100/(4×1.48) = 16.9 mm. تقييم السعة داخل هذه المسافة يحتاج حذراً، والتغطية قد تتطلب مسافات أطول.', 'N = D²/(4λ) = 100/(4×1.48) = 16.9 mm. Amplitude evaluation within this distance needs care, and coverage may require longer paths.'),
      },
      exercise: {
        prompt: t('بنفس البلورة، احسب زاوية نصف الانتشار sin θ ≈ 0.51λ/D.', 'With the same crystal, calculate the half-angle sin θ ≈ 0.51λ/D.'),
        hint: t('0.51 × 1.48 / 10.', '0.51 × 1.48 / 10.'),
        answer: t('sin θ ≈ 0.0755 ⇒ θ ≈ 4.3° لكل جانب.', 'sin θ ≈ 0.0755 ⇒ θ ≈ 4.3° per side.'),
      },
      quiz: quiz(
        'ut-beam-q1',
        'ماذا يحدث للمنطقة القريبة N عند زيادة التردد مع ثبات قطر البلورة؟',
        'What happens to the near field N when frequency increases at fixed crystal diameter?',
        [
          ['تقل', 'It decreases'],
          ['تزيد', 'It increases'],
          ['لا تتغير', 'It is unchanged'],
          ['تصبح صفراً', 'It becomes zero'],
        ],
        1,
        'λ يقل مع زيادة التردد، وN = D²/(4λ) يزيد.',
        'λ decreases as frequency rises, so N = D²/(4λ) increases.'
      ),
      sources: ['nde-ut-beamspread', 'nde-ut-fields', 'nde-ut-formulas', 'nde-ut-couplant'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_ut' },
      textbook: { bookId: 'book-ut', pageNumber: 2 },
    },
    {
      id: 'ut-presentation',
      title: t('عرض البيانات: A-Scan وB-Scan وC-Scan', 'Data presentation: A, B and C scans'),
      summary: t('كيف تقرأ الشاشة قبل أن تثق بالرقم؟', 'How to read the screen before trusting the number.'),
      minutes: 20,
      objectives: [
        t('تفسير محاور A-Scan والبوابات.', 'Interpret A-Scan axes and gates.'),
        t('التمييز بين B-Scan وC-Scan.', 'Distinguish B-Scan and C-Scan.'),
        t('استخدام dB ومقارنة السعة.', 'Use dB and amplitude comparison.'),
      ],
      sections: [
        {
          heading: t('A-Scan', 'A-Scan'),
          body: t(
            'A-Scan يعرض السعة مقابل الزمن/المسافة على خط واحد. المحور الأفقي يمثل المسار أو الزمن، والرأسي السعة. البوابة (gate) تحدد نافذة زمنية لالتقاط إشارة وقياسها. إشارة البداية هي النبضة الأولية، وإشارة السطح قد تكون قريبة منها، ثم تأتي إشارات العيوب والظهر.',
            'A-Scan shows amplitude versus time/distance along one line. The horizontal axis is path or time; the vertical is amplitude. A gate defines a time window for capturing and measuring a signal. The initial pulse is at the start, a surface echo may follow, then flaw and back-wall echoes.'
          ),
        },
        {
          heading: t('B-Scan وC-Scan', 'B-Scan and C-Scan'),
          body: t(
            'B-Scan يعرض مقطعاً رأسياً (المسافة مقابل العمق) ويظهر امتداد العيب في العمق. C-Scan يعرض خريطة مسقطية للسطح ويظهر توزيع العيوب أفقياً. كلاهما يحتاج ترميز موضع المسبار. الصورة لا تلغي الحاجة إلى معايرة وسرعة صوت صحيحة.',
            'B-Scan shows a vertical section (distance versus depth) and reveals flaw extent in depth. C-Scan shows a plan view and reveals lateral distribution. Both require probe position encoding. An image does not remove the need for calibration and correct velocity.'
          ),
        },
        {
          heading: t('السعة والـ dB', 'Amplitude and dB'),
          body: t(
            'تُقارن السعات عادة بالديسيبل: ΔdB = 20 log(A2/A1). مضاعفة السعة تعني +6 dB تقريباً، ونصفها −6 dB. منحنى DAC يعوض تغير السعة مع المسافة، لذا تُقارن الإشارات بعد التصحيح لا قبلها. لا تقارن ارتفاع شاشة من أجهزة مختلفة دون معايرة.',
            'Amplitudes are commonly compared in decibels: ΔdB = 20 log(A2/A1). Doubling amplitude is about +6 dB; halving is −6 dB. A DAC curve compensates amplitude change with distance, so signals are compared after correction, not before. Do not compare screen heights from different instruments without calibration.'
          ),
        },
      ],
      workedExample: {
        prompt: t('إشارة 80% وأخرى 40% على نفس المعايرة. ما فرق dB؟', 'Signals of 80% and 40% on the same calibration. What is the dB difference?'),
        solution: t('ΔdB = 20 log(80/40) = 20 log 2 ≈ 6 dB. الأولى أعلى بـ6 dB، وليست «ضعف العيب» بالضرورة؛ السعة تعتمد على الحجم والاتجاه والمسافة.', 'ΔdB = 20 log(80/40) = 20 log 2 ≈ 6 dB. The first is 6 dB higher, not necessarily twice the flaw size; amplitude depends on size, orientation and distance.'),
      },
      exercise: {
        prompt: t('إشارة 60% وأخرى 120% (بعد التصحيح). ما فرق dB؟', 'Signals of 60% and 120% after correction. What is the dB difference?'),
        hint: t('20 log(120/60) = 20 log 2.', '20 log(120/60) = 20 log 2.'),
        answer: t('نحو 6 dB، لأن النسبة 2:1.', 'About 6 dB, because the ratio is 2:1.'),
      },
      quiz: quiz(
        'ut-presentation-q1',
        'ماذا يمثل المحور الأفقي في A-Scan؟',
        'What does the horizontal axis of an A-Scan represent?',
        [
          ['السعة', 'Amplitude'],
          ['الزمن أو المسار', 'Time or path'],
          ['التردد', 'Frequency'],
          ['درجة الحرارة', 'Temperature'],
        ],
        1,
        'A-Scan يرسم السعة رأسياً مقابل الزمن/المسافة أفقياً.',
        'A-Scan plots amplitude vertically against time/distance horizontally.'
      ),
      sources: ['nde-ut-presentation', 'nde-ut-dac', 'nde-ut-normal'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-ut', pageNumber: 3 },
      labId: 'ut_lab',
    },
    {
      id: 'ut-calibration',
      title: t('المعايرة ومنحنى DAC', 'Calibration and the DAC curve'),
      summary: t('كيف تجعل السعة قابلة للمقارنة؟', 'How to make amplitude comparable.'),
      minutes: 22,
      objectives: [
        t('شرح خطوات المعايرة بالكتل المرجعية.', 'Explain calibration with reference blocks.'),
        t('بناء DAC من عاكسات معروفة.', 'Build a DAC from known reflectors.'),
        t('تحديد المنطقة الميتة والدقة.', 'Identify dead zone and resolution.'),
      ],
      sections: [
        {
          heading: t('المعايرة', 'Calibration'),
          body: t(
            'المعايرة تضبط سرعة الصوت وتأخير المسبار والمدى قبل الفحص. تُستخدم كتلة مرجعية بمادة قريبة من القطعة، وتُضبط البوابات على عواكس معروفة. المعايرة ليست «ضبط الصفر» فقط؛ تشمل التحقق من الدقة والمنطقة الميتة والتكرارية. تُعاد عند تغيير المسبار أو الوسيط أو الإعداد.',
            'Calibration sets velocity, probe delay and range before inspection. A reference block of material similar to the part is used, and gates are set on known reflectors. Calibration is not just zeroing; it includes verifying accuracy, dead zone and repeatability. Repeat it after changing probe, couplant or settings.'
          ),
        },
        {
          heading: t('منحنى DAC', 'DAC curve'),
          body: t(
            'السعة المنعكسة من نفس العيب تقل مع زيادة المسافة بسبب الانتشار والتوهين. يربط DAC السعة بالمسافة لعاكس مرجعي، ويُستخدم كخط أساس. تُقيّم إشارة العيب بالنسبة لمنحنى DAC (مثلاً +2 dB أو −6 dB) بدلاً من ارتفاع مطلق. يلزم منحنى لكل مسبار/مادة/إعداد.',
            'The echo from the same reflector falls with distance because of beam spread and attenuation. A DAC links amplitude to distance for a reference reflector and provides a baseline. A flaw signal is evaluated relative to DAC (for example +2 dB or −6 dB) rather than absolute height. A curve is needed per probe/material/setup.'
          ),
        },
        {
          heading: t('المنطقة الميتة والدقة', 'Dead zone and resolution'),
          body: t(
            'المنطقة الميتة هي المسافة بعد النبضة الأولية التي لا يمكن فيها تمييز إشارة قريبة. تزداد مع النبضة الطويلة والتردد المنخفض والبلورة الكبيرة. الدقة هي القدرة على فصل إشارتين متقاربتين. العيوب القريبة من السطح قد تحتاج مسباراً مؤجلاً أو تقنية أخرى.',
            'The dead zone is the distance after the initial pulse where a nearby echo cannot be resolved. It increases with long pulses, low frequency and large crystals. Resolution is the ability to separate two close echoes. Near-surface flaws may need a delay-line probe or another technique.'
          ),
        },
      ],
      workedExample: {
        prompt: t('إشارة عيب 50% ومنحنى DAC عند 25% لنفس المسافة. ما القراءة؟', 'A flaw signal is 50% and DAC is 25% at the same distance. What is the reading?'),
        solution: t('النسبة 2:1 تعني +6 dB فوق DAC تقريباً (20 log 2). سجّل «+6 dB DAC» مع المسافة والحجم الظاهري، ولا تحوّل ذلك إلى قبول/رفض دون معيار.', 'A 2:1 ratio is about +6 dB above DAC (20 log 2). Record “+6 dB DAC” with distance and apparent size; do not convert that into accept/reject without the criterion.'),
      },
      exercise: {
        prompt: t('إشارة 100% وDAC 50%. ما الفرق dB؟', 'A 100% signal with DAC at 50%. What is the dB difference?'),
        hint: t('20 log(100/50).', '20 log(100/50).'),
        answer: t('+6 dB فوق DAC.', '+6 dB above DAC.'),
      },
      quiz: quiz(
        'ut-calibration-q1',
        'لماذا لا تُقارن السعة المطلقة بين أعماق مختلفة؟',
        'Why is absolute amplitude not compared across different depths?',
        [
          ['لأن التردد يتغير تلقائياً', 'Because frequency changes automatically'],
          ['لأن السعة تقل مع المسافة بسبب الانتشار والتوهين', 'Because amplitude falls with distance due to spread and attenuation'],
          ['لأن الشاشة لا تعرض السعة', 'Because the screen does not show amplitude'],
          ['لأن العيب يتغير حجمه', 'Because the flaw changes size'],
        ],
        1,
        'DAC يعوض هذا التغير لتصبح المقارنة ذات معنى.',
        'DAC compensates this change so comparison is meaningful.'
      ),
      sources: ['nde-ut-calibration', 'nde-ut-dac', 'nde-ut-formulas'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-ut', pageNumber: 4 },
      labId: 'ut_lab',
    },
    {
      id: 'ut-welds',
      title: t('فحص اللحام بالحزمة المائلة', 'Angle-beam weld inspection'),
      summary: t('كيف تحدد موقع العيب من مسار الصوت؟', 'How to locate a flaw from the sound path.'),
      minutes: 24,
      objectives: [
        t('تطبيق قانون سنيل لاختيار الزاوية.', 'Apply Snell’s law to select the angle.'),
        t('حساب المسار والعمق والمسافة السطحية.', 'Calculate path, depth and surface distance.'),
        t('شرح أنماط المسح وتغطية منطقة اللحام.', 'Explain scanning patterns and weld coverage.'),
      ],
      sections: [
        {
          heading: t('الزاوية والوضع', 'Angle and setup'),
          body: t(
            'تُستخدم حزمة قصية بزاوية 45° أو 60° أو 70° غالباً. يجب أن تكون الحزمة عمودية على العيب المحتمل، وأن تغطي منطقة اللحام والمنطقة المتأثرة حرارياً. يحدد الكود زوايا ومسافات وعواكس مرجعية. الحزمة المائلة لا تدخل السطح عمودياً، لذا الحساب يحتاج مثلثاً.',
            'A shear beam at 45°, 60° or 70° is common. The beam should be perpendicular to the expected flaw and cover the weld and heat-affected zone. The code defines angles, distances and reference reflectors. An angle beam enters obliquely, so location calculations use a triangle.'
          ),
        },
        {
          heading: t('حساب الموقع', 'Location calculation'),
          body: t(
            'لنصف قفزة واحدة: المسار S = T / cos θ، والعمق d = S cos θ = T، والمسافة السطحية x = S sin θ = T tan θ. للقفزة الكاملة ضاعف القيم. هذه العلاقات تعتمد على أن الصوت ينتقل في خط مستقيم وأن سرعة المادة معروفة؛ الانكسار على السطح يغيّر الزاوية.',
            'For a half skip: path S = T / cos θ, depth d = S cos θ = T, and surface distance x = S sin θ = T tan θ. For a full skip, double the values. These relations assume straight-line propagation and known velocity; refraction at the surface changes the angle.'
          ),
        },
        {
          heading: t('المسح والتغطية', 'Scanning and coverage'),
          body: t(
            'يشمل المسح الحركة على طول اللحام وعبره، مع اتجاهات متقابلة وزوايا مناسبة. يلزم تداخل كافٍ بين التمريرات لتغطية الحجم. العيوب الاتجاهية قد تظهر في اتجاه واحد فقط. يجب تمييز إشارات الهندسة (جذر، تاج، Hi-Lo) من إشارات العيوب، وغالباً بمساعدة رسومات ومقارنة.',
            'Scanning includes movement along and across the weld with opposing directions and suitable angles. Sufficient overlap between passes is needed for volumetric coverage. Oriented flaws may appear in only one direction. Geometry echoes (root, cap, Hi-Lo) must be distinguished from flaws, often using drawings and comparison.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سماكة 20 mm، زاوية 45°. احسب مسار نصف القفزة والمسافة السطحية.', 'Thickness 20 mm, angle 45°. Calculate half-skip path and surface distance.'),
        solution: t('S = 20/cos45° = 28.3 mm. x = 20×tan45° = 20 mm. القفزة الكاملة تعطي 56.6 mm و40 mm. إذا ظهرت الإشارة عند 28.3 mm فهي عند العمق 20 mm تقريباً (الجذر).', 'S = 20/cos45° = 28.3 mm. x = 20×tan45° = 20 mm. A full skip gives 56.6 mm and 40 mm. An echo at 28.3 mm corresponds to about 20 mm depth (the root).'),
      },
      exercise: {
        prompt: t('زاوية 60° وسماكة 20 mm. احسب مسار نصف القفزة.', 'Angle 60°, thickness 20 mm. Calculate the half-skip path.'),
        hint: t('cos60° = 0.5.', 'cos60° = 0.5.'),
        answer: t('S = 20/0.5 = 40 mm، والمسافة السطحية 20×tan60° ≈ 34.6 mm.', 'S = 20/0.5 = 40 mm, and surface distance 20×tan60° ≈ 34.6 mm.'),
      },
      quiz: quiz(
        'ut-welds-q1',
        'لماذا تُستخدم زوايا متعددة في فحص اللحام؟',
        'Why are multiple angles used in weld inspection?',
        [
          ['لأن الصوت يتوقف عند 45°', 'Because sound stops at 45°'],
          ['للكشف عن عيوب باتجاهات وأعماق مختلفة', 'To detect flaws at different orientations and depths'],
          ['لتغيير سرعة الصوت', 'To change sound velocity'],
          ['لإلغاء الحاجة للمعايرة', 'To remove the need for calibration'],
        ],
        1,
        'اتجاه العيب وعمقه يحددان الزاوية والمسار المناسبين؛ زاوية واحدة لا تغطي كل الحالات.',
        'Flaw orientation and depth determine suitable angle and path; one angle cannot cover everything.'
      ),
      sources: ['nde-ut-angle1', 'nde-ut-angle2', 'nde-ut-weldments'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-ut', pageNumber: 5 },
      labId: 'ut_lab',
    },
    {
      id: 'ut-advanced',
      title: t('الغمر وEMAT وPAUT/TOFD', 'Immersion, EMAT and PAUT/TOFD'),
      summary: t('ما الذي تضيفه التقنيات المتقدمة وما حدودها؟', 'What advanced techniques add and where they stop.'),
      minutes: 22,
      objectives: [
        t('شرح مبدأ الفحص بالغمر.', 'Explain immersion testing.'),
        t('تحديد مزايا EMAT وحدوده.', 'Identify EMAT advantages and limits.'),
        t('تمييز PAUT وTOFD عن UT التقليدي.', 'Distinguish PAUT and TOFD from conventional UT.'),
      ],
      sections: [
        {
          heading: t('الغمر', 'Immersion'),
          body: t(
            'في الفحص بالغمر يكون المسبار والمعدة داخل سائل، ويُستخدم الماء غالباً كوسيط. يسمح ذلك بمسح آلي وتركيز جيد وزوايا متعددة، ويناسب القطع المعقدة والإنتاج الكبير. يحتاج التحكم في المسافة والزاوية ونظافة الماء وفقاعات الهواء التي تشوش الإشارة.',
            'In immersion testing the probe and part are in a liquid, often water. This enables automated scanning, good focusing and multiple angles, suitable for complex parts and production. It needs control of distance, angle and water cleanliness, since bubbles scatter the signal.'
          ),
        },
        {
          heading: t('EMAT', 'EMAT'),
          body: t(
            'محولات EMAT تولد الصوت كهرومغناطيسياً في السطح، ولا تحتاج وسيط اقتران سائلاً. تناسب الأسطح الساخنة أو الخشنة أو البعيدة، لكنها أقل كفاءة وقد تحتاج طاقة أعلى، وتعمل فقط على مواد موصلة/مغناطيسية حسب التصميم. لا تغني عن المعايرة والتحقق.',
            'EMATs generate sound electromagnetically at the surface and need no fluid couplant. They suit hot, rough or remote surfaces, but are less efficient, may need higher power, and work only on conductive/magnetic materials depending on design. They do not replace calibration and verification.'
          ),
        },
        {
          heading: t('PAUT وTOFD', 'PAUT and TOFD'),
          body: t(
            'PAUT يستخدم مصفوفة عناصر ويوجه الحزمة إلكترونياً لتغطية زوايا ومسارات متعددة، ويحتاج معايرة وبرامج تحليل. TOFD يعتمد على حيود أطراف العيب ويقيس الارتفاع بدقة أكبر، لكنه حساس للهندسة ويحتاج تنظيماً خاصاً. كلاهما ليس «تصويراً مباشراً» ولا يلغي الحاجة إلى إجراء مؤهل.',
            'PAUT uses an element array and steers the beam electronically for multiple angles and paths, requiring calibration and analysis software. TOFD uses tip diffraction to size flaw height, more accurately in some cases, but is sensitive to geometry and needs specific setup. Neither is direct imaging, and neither removes the need for a qualified procedure.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سطح ساخن 300°C ولا يمكن استخدام وسيط سائل. ما الخيار؟', 'A 300°C surface prevents liquid couplant. What option?'),
        solution: t('قد يكون EMAT مناسباً إن كانت المادة موصلة/مغناطيسية وكان التصميم يتحمل الحرارة، مع التحقق من الحساسية. البديل قد يكون فحصاً بصرياً أو تقنية غير تلامسية أخرى وفق الإجراء؛ لا تفترض أن EMAT يحل كل الحالات.', 'EMAT may suit if the material is conductive/magnetic and the design tolerates heat, with sensitivity verification. Alternatives may be visual or another non-contact technique per procedure; do not assume EMAT solves every case.'),
      },
      exercise: {
        prompt: t('اذكر ميزة واحدة وحداً واحداً لـ EMAT.', 'Name one advantage and one limit of EMAT.'),
        hint: t('لا يحتاج وسيطاً؛ كفاءته منخفضة.', 'No couplant; lower efficiency.'),
        answer: t('ميزة: لا يحتاج اقتراناً سائلاً ويعمل على أسطح ساخنة/خشنة. حد: كفاءة أقل، يحتاج مادة مناسبة وطاقة أعلى، ولا يناسب كل الأشكال.', 'Advantage: no liquid couplant and works on hot/rough surfaces. Limit: lower efficiency, needs suitable material and higher power, and not all geometries.'),
      },
      quiz: quiz(
        'ut-advanced-q1',
        'أي عبارة صحيحة عن PAUT؟',
        'Which statement about PAUT is correct?',
        [
          ['لا يحتاج معايرة', 'It needs no calibration'],
          ['يوجه الحزمة إلكترونياً ويحتاج إجراءً مؤهلاً', 'It steers the beam electronically and needs a qualified procedure'],
          ['يعمل فقط على الألومنيوم', 'It works only on aluminium'],
          ['يغني عن تحليل الإشارة', 'It removes the need for signal analysis'],
        ],
        1,
        'PAUT تقنية متقدمة تحتاج معايرة وبرامج وإجراءً وتحليلاً، وليست بديلاً عن التأهيل.',
        'PAUT is advanced and needs calibration, software, procedure and analysis; it is not a substitute for qualification.'
      ),
      sources: ['nde-ut-immersion', 'nde-ut-emat', 'nde-ut-presentation'],
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_ut' },
      textbook: { bookId: 'book-paut-tofd', pageNumber: 1 },
    },
  ],
  standards: ['ASME Sec V Art. 4', 'ASME Sec VIII Div. 1', 'AWS D1.1', 'ISO 17640'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/Ultrasonics/index.xhtml',
  limits: t(
    'المقرر لا يمنح تأهيل UT ولا يحدد حدود قبول. القيم والمعايرة والزوايا والمقارنة بـDAC تخضع لإجراء معتمد ومواصفة العقد ونسخة الكود.',
    'The course does not qualify a UT inspector or set acceptance limits. Values, calibration, angles and DAC comparison follow an approved procedure, contract specification and code edition.'
  ),
};
