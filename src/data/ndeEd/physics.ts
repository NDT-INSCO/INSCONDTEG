import { NdeEdCourse } from './types.js';
import { quiz, t } from './helpers.js';

const GOV = {
  status: 'approved' as const,
  technicalReviewerRole: 'NDT Level III — cross-method physics',
  lastUpdatedAt: '2026-11-24',
  lastReviewedAt: '2026-11-24',
  changeLog: [
    '2026-11-24: Baseline governance metadata and prerequisiteLessonIds added by educational audit pilot. SME/Level III review required.',
  ],
};


export const physicsCourse: NdeEdCourse = {
  id: 'nde-physics',
  disciplineId: 'conventional_ndt',
  code: 'PHYSICS',
  level: 'foundation',
  accent: '#e2c275',
  title: t('أساسيات الفيزياء والقياس لـ NDT', 'NDT Physics & Measurement Foundations'),
  subtitle: t('الموجات، المقاومة الصوتية، المغناطيسية، الإشعاع، والخاصية الشعرية', 'Waves, acoustic impedance, magnetism, radiation and capillarity'),
  description: t(
    'مقرر تأسيسي يشرح الفيزياء التي تعتمد عليها طرق الفحص الخمس. يبدأ من وصف الموجة ويصل إلى سبب عمل وسيط الاقتران ومنحنى التخلفية وقانون التوهين، مع أمثلة محلولة وتمارين قصيرة.',
    'A foundation course explaining the physics behind the five classical NDT methods: from wave description to couplants, hysteresis and attenuation, with worked examples and short exercises.'
  ),
  prerequisites: t('جبر أساسي ووحدات SI. لا يتطلب خبرة فحص سابقة.', 'Basic algebra and SI units. No prior inspection experience.'),
  outcomes: [
    t('حساب الطول الموجي والسرعة والتردد وتحويل الوحدات دون أخطاء.', 'Calculate wavelength, velocity and frequency and convert units correctly.'),
    t('تفسير الانعكاس عند حدود المواد باستخدام المقاومة الصوتية.', 'Explain reflection at material boundaries using acoustic impedance.'),
    t('ربط النفاذية والمغناطيسية المتبقية بحدود فحص MT.', 'Relate permeability and retentivity to MT limits.'),
    t('تطبيق قانون التوهين وطبقة النصف على التصوير الإشعاعي.', 'Apply attenuation and half-value layer to radiography.'),
    t('شرح دخول السائل النافذ في الشقوق بالخاصية الشعرية.', 'Explain penetrant ingress into cracks by capillary action.'),
  ],
  lessons: [
    {
      id: 'phy-waves',
      title: t('وصف الموجة والطول الموجي', 'Wave description and wavelength'),
      summary: t('لماذا يحدد λ ما يمكن رؤيته، وكيف تحسبه من السرعة والتردد؟', 'Why λ sets what can be seen, and how to calculate it from velocity and frequency.'),
      minutes: 18,
      objectives: [
        t('تعريف التردد والدورة والطول الموجي والسعة.', 'Define frequency, period, wavelength and amplitude.'),
        t('تطبيق المعادلة v = f × λ مع وحدات متسقة.', 'Apply v = f × λ with consistent units.'),
        t('شرح المقايضة بين الدقة والاختراق عند زيادة التردد.', 'Explain the resolution–penetration trade-off when frequency increases.'),
      ],
      sections: [
        {
          heading: t('الموجة كوصف رياضي', 'A wave as a mathematical description'),
          body: t(
            'الموجة انتقال للطاقة دون انتقال دائم للمادة. التردد f هو عدد الدورات في الثانية، والدورة T = 1/f. السعة تعبر عن شدة الاضطراب، والطول الموجي λ هو المسافة بين قمتين متتاليتين. في الأوساط الصلبة قد توجد موجة طولية وموجة قص وسطحية، ولكل نمط سرعة مختلفة.',
            'A wave transfers energy without permanent material transport. Frequency f is cycles per second and period T = 1/f. Amplitude describes disturbance strength; wavelength λ is the distance between successive crests. Solids can carry longitudinal, shear and surface modes, each with a different velocity.'
          ),
        },
        {
          heading: t('المعادلة الحاكمة', 'The governing equation'),
          body: t(
            'العلاقة الأساسية هي v = f × λ. السرعة تعتمد على المادة ونمط الموجة والحرارة، وليست ثابتاً عالمياً. في الفولاذ الكربوني تقارب السرعة الطولية 5920 m/s والقصية 3240 m/s. استخدم MHz مع m/s يعطي λ بالمليمتر مباشرة بعد ضرب التردد في 10^6.',
            'The core relation is v = f × λ. Velocity depends on material, wave mode and temperature; it is not a universal constant. Carbon steel is about 5920 m/s longitudinal and 3240 m/s shear. Using MHz with m/s gives λ in millimetres after multiplying frequency by 10^6.'
          ),
        },
        {
          heading: t('الحد العملي للكشف', 'The practical detection limit'),
          body: t(
            'لا يمكن كشف عيب أصغر بكثير من الطول الموجي بثقة. رفع التردد يقلل λ ويحسن الفصل، لكنه يزيد التوهين والتشتت في الحبيبات الخشنة ويقلل الاختراق. اختيار التردد قرار موازنة يحدده السماكة والبنية ونوع العيب، لا قاعدة واحدة.',
            'Flaws much smaller than the wavelength cannot be reliably detected. Raising frequency reduces λ and improves resolution, but increases attenuation and grain scattering and reduces penetration. Frequency selection balances thickness, microstructure and flaw type; there is no single rule.'
          ),
        },
      ],
      workedExample: {
        prompt: t('مسبار طولي بتردد 4 MHz في فولاذ سرعته 5920 m/s. احسب λ.', 'A 4 MHz longitudinal probe in steel with velocity 5920 m/s. Calculate λ.'),
        solution: t('λ = v/f = 5920 / (4 × 10^6) = 1.48 × 10^-3 m = 1.48 mm. عيب 0.5 mm أصغر من λ/3؛ قد يُكشف بإشارة ضعيفة لكن الحكم يحتاج معايرة وتكرارية.', 'λ = v/f = 5920 / (4 × 10^6) = 1.48 × 10^-3 m = 1.48 mm. A 0.5 mm flaw is below λ/3; it may produce a weak signal, but judgement needs calibration and repeatability.'),
      },
      exercise: {
        prompt: t('احسب الطول الموجي لموجة قص بتردد 2.25 MHz في الفولاذ (3240 m/s).', 'Calculate the shear wavelength at 2.25 MHz in steel (3240 m/s).'),
        hint: t('حوّل MHz إلى Hz قبل القسمة.', 'Convert MHz to Hz before dividing.'),
        answer: t('λ = 3240 / (2.25 × 10^6) = 1.44 mm.', 'λ = 3240 / (2.25 × 10^6) = 1.44 mm.'),
      },
      quiz: quiz(
        'phy-waves-q1',
        'إذا تضاعف التردد مع ثبات سرعة الصوت، ماذا يحدث للطول الموجي؟',
        'If frequency doubles while sound velocity is constant, what happens to wavelength?',
        [
          ['يتضاعف', 'It doubles'],
          ['ينخفض إلى النصف', 'It halves'],
          ['لا يتغير', 'It stays unchanged'],
          ['يصبح صفراً', 'It becomes zero'],
        ],
        1,
        'من v = f × λ، عند ثبات v فإن مضاعفة f تنصف λ.',
        'From v = f × λ, with v constant, doubling f halves λ.'
      ),
      quizBank: [
        quiz('phy-waves-q2', 'ما العلاقة الصحيحة بين سرعة الموجة والتردد والطول الموجي؟', 'What is the correct relationship between wave velocity, frequency and wavelength?', [['v = f × λ','v = f × λ'], ['v = f / λ','v = f / λ'], ['λ = v × f','λ = v × f'], ['f = v × λ','f = v × λ']], 0, 'سرعة الموجة تساوي التردد مضروباً في الطول الموجي.', 'Wave velocity equals frequency multiplied by wavelength.', { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }),
        quiz('phy-waves-q3', 'إذا زاد التردد مع ثبات سرعة المادة، ماذا يحدث للطول الموجي؟', 'If frequency increases while material velocity stays constant, what happens to wavelength?', [['يزداد','It increases'], ['يقل','It decreases'], ['يبقى ثابتاً','It stays the same'], ['يصبح صفراً دائماً','It always becomes zero']], 1, 'من v=fλ، عند ثبات v وزيادة f يجب أن يقل λ.', 'From v=fλ, with constant v and higher f, λ must decrease.', { category: 'understanding', difficulty: 'easy', reviewStatus: 'approved' }),
      ],

      sources: ['nde-waves', 'nde-sound', 'nde-materials'],
      prerequisiteLessonIds: [],
      assumptionsAndLimits: [
        t('هذا الدرس تعليمي ويحتاج تطبيقه في الميدان إلى إجراء معتمد ومؤهل مختص.', 'This lesson is educational; field application requires an approved procedure and qualified personnel.'),
        t('أي قرار قبول/رفض أو صلاحية للخدمة يتبع الكود/الإجراء المعتمد وليس هذا الملخص.', 'Any acceptance/rejection or fitness-for-service decision follows the approved code/procedure, not this summary.'),
      ],
      referenceTrace: [
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-waves',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — Waves.', 'Supporting reading: Physics — Waves.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-sound',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — Sound.', 'Supporting reading: Physics — Sound.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-materials',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — Materials and Processes.', 'Supporting reading: Physics — Materials and Processes.'),
        }
      ],
      governance: GOV,
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_1' },
      textbook: { bookId: 'book-ut', pageNumber: 1 },
      labId: 'ut_lab',
    },
    {
      id: 'phy-impedance',
      title: t('المقاومة الصوتية والانعكاس', 'Acoustic impedance and reflection'),
      summary: t('لماذا يعكس الهواء معظم الصوت، ولماذا نحتاج وسيط اقتران؟', 'Why air reflects most sound, and why a couplant is needed.'),
      minutes: 20,
      objectives: [
        t('حساب المقاومة الصوتية Z = ρv.', 'Calculate acoustic impedance Z = ρv.'),
        t('تقدير معامل الانعكاس عند حد بين مادتين.', 'Estimate the reflection coefficient at a material boundary.'),
        t('شرح دور وسيط الاقتران ومخاطر الفجوة الهوائية.', 'Explain the role of couplant and the risk of an air gap.'),
      ],
      sections: [
        {
          heading: t('المقاومة الصوتية', 'Acoustic impedance'),
          body: t(
            'المقاومة الصوتية Z = ρ × v، حيث ρ الكثافة وv سرعة الصوت. تقاس بوحدة Rayl (Pa·s/m). الفولاذ نحو 46 MRayl، الماء نحو 1.5 MRayl، والهواء نحو 0.0004 MRayl. اختلاف Z بين وسطين يحدد مقدار الطاقة المنعكسة والمنتظمة.',
            'Acoustic impedance Z = ρ × v, where ρ is density and v sound velocity, measured in Rayl (Pa·s/m). Steel is about 46 MRayl, water about 1.5 MRayl and air about 0.0004 MRayl. The impedance mismatch sets how much energy is reflected and transmitted.'
          ),
        },
        {
          heading: t('معامل الانعكاس', 'Reflection coefficient'),
          body: t(
            'عند سقوط عمودي، نسبة الطاقة المنعكسة R = ((Z2 − Z1)/(Z2 + Z1))^2. الفولاذ/الهواء يعكس تقريباً كل الطاقة، لذلك لا ينتقل الصوت دون وسيط. الفولاذ/الماء يعكس جزءاً كبيراً لكنه يسمح بمرور كافٍ للفحص. الحزمة المائلة تضيف تحويل النمط وزوايا حرجة.',
            'For normal incidence the reflected energy fraction is R = ((Z2 − Z1)/(Z2 + Z1))^2. Steel/air reflects nearly all energy, so sound does not enter without a couplant. Steel/water still reflects strongly but transmits enough for inspection. Angle beams add mode conversion and critical angles.'
          ),
        },
        {
          heading: t('التوهين والتشتت', 'Attenuation and scattering'),
          body: t(
            'تقل السعة مع المسافة بسبب الامتصاص والتشتت. الحبيبات الخشنة والمسامية والصدأ تخفض الإشارة وتزيد الضوضاء. لا تفسر انخفاض الإشارة كعيب قبل التحقق من الاقتران والسطح والمسافة والتردد.',
            'Amplitude falls with distance through absorption and scattering. Coarse grains, porosity and scale reduce signal and raise noise. Do not interpret a low signal as a flaw before checking coupling, surface, path length and frequency.'
          ),
        },
      ],
      workedExample: {
        prompt: t('احسب R للطاقة عند حد فولاذ (Z=46 MRayl) وماء (Z=1.5 MRayl).', 'Calculate the energy reflection R at steel (46 MRayl) to water (1.5 MRayl).'),
        solution: t('R = ((46 − 1.5)/(46 + 1.5))^2 = (44.5/47.5)^2 ≈ 0.878، أي نحو 88% انعكاس و12% انتقال. يوضح ذلك أهمية الاقتران وزاوية السقوط.', 'R = ((46 − 1.5)/(46 + 1.5))^2 = (44.5/47.5)^2 ≈ 0.878, about 88% reflected and 12% transmitted. This shows why coupling and incidence angle matter.'),
      },
      exercise: {
        prompt: t('احسب R عند حد ألومنيوم (Z=17 MRayl) وماء (1.5 MRayl).', 'Calculate R at aluminium (17 MRayl) to water (1.5 MRayl).'),
        hint: t('استخدم نفس النسبة المربعة، ولا تخلط بين R ونسبة السعة.', 'Use the same squared ratio; do not confuse R with amplitude ratio.'),
        answer: t('R = ((17 − 1.5)/(17 + 1.5))^2 = (15.5/18.5)^2 ≈ 0.702، نحو 70%.', 'R = ((17 − 1.5)/(17 + 1.5))^2 = (15.5/18.5)^2 ≈ 0.702, about 70%.'),
      },
      quiz: quiz(
        'phy-impedance-q1',
        'ما الوظيفة الأساسية لوسيط الاقتران في UT؟',
        'What is the main function of a couplant in UT?',
        [
          ['زيادة سرعة الصوت في المعدن', 'Increase sound velocity in the metal'],
          ['إزالة الفجوة الهوائية ونقل الطاقة إلى العينة', 'Remove the air gap and transmit energy into the part'],
          ['تغيير تردد المسبار', 'Change the probe frequency'],
          ['منع الانعكاس من العيب', 'Prevent reflection from flaws'],
        ],
        1,
        'الفجوة الهوائية تعكس معظم الطاقة؛ الوسيط يملأها ويحسن الانتقال.',
        'An air gap reflects most energy; couplant fills it and improves transmission.'
      ),
      quizBank: [
        quiz('phy-impedance-q2', 'ما العاملان الأساسيان في حساب المقاومة الصوتية؟', 'What two factors determine acoustic impedance?', [['الكثافة وسرعة الصوت','Density and sound velocity'], ['التردد والسعة','Frequency and amplitude'], ['الحرارة واللون','Temperature and color'], ['الجهد والتيار','Voltage and current']], 0, 'المقاومة الصوتية Z = ρ × v.', 'Acoustic impedance Z = ρ × v.', { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }),
        quiz('phy-impedance-q3', 'عند حدود بين مادتين متشابهتين جداً في المقاومة الصوتية، ماذا تتوقع للانعكاس؟', 'At a boundary between materials with very similar acoustic impedance, what happens to reflection?', [['انعكاس كبير جداً','Very high reflection'], ['انعكاس قليل وانتقال أكبر','Low reflection and more transmission'], ['لا يوجد انتقال','No transmission'], ['تتضاعف السرعة دائماً','Velocity always doubles']], 1, 'كلما قل فرق المقاومة الصوتية قلت الطاقة المنعكسة وزادت المنقولة.', 'Smaller impedance mismatch means less reflected energy and more transmission.', { category: 'understanding', difficulty: 'medium', reviewStatus: 'approved' }),
      ],

      sources: ['nde-sound', 'nde-ut-couplant', 'nde-ut-principles'],
      prerequisiteLessonIds: ['phy-waves'],
      assumptionsAndLimits: [
        t('هذا الدرس تعليمي ويحتاج تطبيقه في الميدان إلى إجراء معتمد ومؤهل مختص.', 'This lesson is educational; field application requires an approved procedure and qualified personnel.'),
        t('أي قرار قبول/رفض أو صلاحية للخدمة يتبع الكود/الإجراء المعتمد وليس هذا الملخص.', 'Any acceptance/rejection or fitness-for-service decision follows the approved code/procedure, not this summary.'),
      ],
      referenceTrace: [
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-sound',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — Sound.', 'Supporting reading: Physics — Sound.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-ut-couplant',
          verified: true,
          note: t('مرجع قراءة داعم: Ultrasonic — Couplant.', 'Supporting reading: Ultrasonic — Couplant.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-ut-principles',
          verified: true,
          note: t('مرجع قراءة داعم: Ultrasonic — Basic Principles.', 'Supporting reading: Ultrasonic — Basic Principles.'),
        }
      ],
      governance: GOV,
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_1' },
      textbook: { bookId: 'book-ut', pageNumber: 2 },
    },
    {
      id: 'phy-magnetism',
      title: t('المغناطيسية ومنحنى التخلفية', 'Magnetism and the hysteresis loop'),
      summary: t('النفاذية والقوة القسرية والمغناطيسية المتبقية: حدود MT.', 'Permeability, coercivity and retentivity: the limits of MT.'),
      minutes: 20,
      objectives: [
        t('شرح النطاقات المغناطيسية ودور النفاذية.', 'Explain magnetic domains and the role of permeability.'),
        t('قراءة B-H loop وتحديد Hc وBr.', 'Read a B-H loop and identify Hc and Br.'),
        t('تحديد المواد التي يمكن فحصها بـ MT.', 'Identify materials that can be examined by MT.'),
      ],
      sections: [
        {
          heading: t('النطاقات والنفاذية', 'Domains and permeability'),
          body: t(
            'في المواد الفيرومغناطيسية تترتب النطاقات في اتجاهات متعاكسة عند غياب المجال. تطبيق مجال خارجي يعيد ترتيبها فيكبر الفيض B. النفاذية μ = B/H، والنسبية μr = μ/μ0. الحديد والفولاذ والنيكل والكوبالت فيرومغناطيسية؛ الألومنيوم والنحاس والفولاذ الأوستنيتي ليست كذلك.',
            'In ferromagnetic materials, domains point in opposing directions with no applied field. An external field reorients them and increases flux B. Permeability μ = B/H and relative permeability μr = μ/μ0. Iron, steel, nickel and cobalt are ferromagnetic; aluminium, copper and austenitic stainless steel are not.'
          ),
        },
        {
          heading: t('التخلفية والقوة القسرية', 'Hysteresis and coercivity'),
          body: t(
            'عند إزالة المجال يبقى فيض متبقٍ Br، ويحتاج عكس المجال إلى Hc لإرجاع B إلى الصفر. هذه الخاصية تمكن MT من كشف العيوب، لكنها تعني أيضاً أن القطعة قد تبقى ممغنطة وتحتاج إزالة مغنطة. الحرارة فوق كوري تفقد المادة سلوكها المغناطيسي.',
            'When the field is removed a residual flux Br remains, and a reverse field Hc is needed to return B to zero. This enables MT flaw detection but also leaves parts magnetized and requiring demagnetization. Above the Curie temperature the material loses ferromagnetic behaviour.'
          ),
        },
        {
          heading: t('حدود الكشف', 'Detection limits'),
          body: t(
            'MT يكشف العيوب السطحية والقريبة من السطح في المواد الفيرومغناطيسية فقط. عمق الكشف يعتمد على نوع التيار وشدة المجال وهندسة الجزء. المجال يجب أن يكون قريباً من عمودي على العيب؛ لذلك تُستخدم اتجاهات مغنطة متعددة.',
            'MT detects surface and near-surface flaws in ferromagnetic materials only. Depth depends on current type, field strength and part geometry. The field should be roughly perpendicular to the flaw, so multiple magnetization directions are used.'
          ),
        },
      ],
      workedExample: {
        prompt: t('إذا كان B=1.2 T عند H=2000 A/m، احسب μr (μ0=4π×10^-7).', 'If B = 1.2 T at H = 2000 A/m, calculate μr (μ0 = 4π×10^-7).'),
        solution: t('μ = B/H = 1.2/2000 = 6×10^-4 H/m. μr = μ/μ0 = 6×10^-4/(1.257×10^-6) ≈ 477.', 'μ = B/H = 1.2/2000 = 6×10^-4 H/m. μr = μ/μ0 = 6×10^-4/(1.257×10^-6) ≈ 477.'),
      },
      exercise: {
        prompt: t('عند B=1.5 T وH=4000 A/m، احسب μr.', 'At B = 1.5 T and H = 4000 A/m, calculate μr.'),
        hint: t('μ = B/H ثم اقسم على μ0.', 'Compute μ = B/H, then divide by μ0.'),
        answer: t('μ = 3.75×10^-4، وμr ≈ 298.', 'μ = 3.75×10^-4, so μr ≈ 298.'),
      },
      quiz: quiz(
        'phy-magnetism-q1',
        'أي مادة يمكن فحصها بطريقة الجسيمات المغناطيسية؟',
        'Which material can be examined by magnetic particle testing?',
        [
          ['فولاذ كربوني فيرومغناطيسي', 'Ferromagnetic carbon steel'],
          ['ألومنيوم غير مغناطيسي', 'Non-magnetic aluminium'],
          ['فولاذ أوستنيتي', 'Austenitic stainless steel'],
          ['نحاس نقي', 'Pure copper'],
        ],
        0,
        'MT يحتاج مادة فيرومغناطيسية؛ الفولاذ الكربوني كذلك، بخلاف الألومنيوم والنحاس والأوستنيتي.',
        'MT requires a ferromagnetic material. Carbon steel qualifies; aluminium, copper and austenitic stainless do not.'
      ),
      quizBank: [
        quiz('phy-magnetism-q2', 'ما المقصود بالنفاذية المغناطيسية للمادة؟', 'What does magnetic permeability describe?', [['قدرة المادة على دعم تكوّن المجال المغناطيسي',"A material's ability to support magnetic field formation"], ['سرعة الصوت في المادة','Sound velocity in the material'], ['كثافة المادة فقط','Only material density'], ['لون سطح المادة','Material surface color']], 0, 'النفاذية تصف استجابة المادة للمجال المغناطيسي.', 'Permeability describes how a material responds to a magnetic field.', { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }),
        quiz('phy-magnetism-q3', 'لماذا قد لا يكتشف فحص MT عيباً موازياً تماماً لخطوط الفيض؟', 'Why might MT miss a flaw parallel to magnetic flux lines?', [['لأن العيب يصبح أكبر','Because the flaw becomes larger'], ['لأن تسرب الفيض يكون ضعيفاً أو معدوماً','Because flux leakage is weak or absent'], ['لأن الجسيمات تتبخر','Because particles evaporate'], ['لأن المجال لا يدخل الفولاذ','Because field cannot enter steel']], 1, 'كشف MT يعتمد على تسرب الفيض عند انقطاع مكوّن مناسب لاتجاه المجال.', 'MT detection depends on flux leakage when the discontinuity interrupts the field appropriately.', { category: 'application', difficulty: 'medium', reviewStatus: 'approved' }),
      ],

      sources: ['nde-magnetism', 'nde-mt-magnetism', 'nde-mt-principles'],
      prerequisiteLessonIds: ['phy-waves'],
      assumptionsAndLimits: [
        t('هذا الدرس تعليمي ويحتاج تطبيقه في الميدان إلى إجراء معتمد ومؤهل مختص.', 'This lesson is educational; field application requires an approved procedure and qualified personnel.'),
        t('أي قرار قبول/رفض أو صلاحية للخدمة يتبع الكود/الإجراء المعتمد وليس هذا الملخص.', 'Any acceptance/rejection or fitness-for-service decision follows the approved code/procedure, not this summary.'),
      ],
      referenceTrace: [
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-magnetism',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — Magnetism.', 'Supporting reading: Physics — Magnetism.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-mt-magnetism',
          verified: true,
          note: t('مرجع قراءة داعم: Magnetic Particle — The Use of Magnetism in NDT.', 'Supporting reading: Magnetic Particle — The Use of Magnetism in NDT.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-mt-principles',
          verified: true,
          note: t('مرجع قراءة داعم: Magnetic Particle — Basic Principles.', 'Supporting reading: Magnetic Particle — Basic Principles.'),
        }
      ],
      governance: GOV,
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_2' },
      textbook: { bookId: 'book-mt', pageNumber: 1 },
      labId: 'pt_mt_darkroom',
    },
    {
      id: 'phy-radiation',
      title: t('الإشعاع والتوهين وطبقة النصف', 'Radiation, attenuation and half-value layer'),
      summary: t('كيف يخترق الإشعاع المادة، وكيف نحسب التعرض والمسافة؟', 'How radiation penetrates matter, and how exposure and distance are calculated.'),
      minutes: 22,
      objectives: [
        t('شرح التفاعلات الرئيسية للفوتونات مع المادة.', 'Explain the main photon interactions with matter.'),
        t('تطبيق I = I0 e^(−μx) وHVL.', 'Apply I = I0 e^(−μx) and HVL.'),
        t('تفسير قانون التربيع العكسي في الحماية الإشعاعية.', 'Interpret the inverse-square law in radiation protection.'),
      ],
      sections: [
        {
          heading: t('المصادر والتفاعل', 'Sources and interaction'),
          body: t(
            'ينتج التصوير الإشعاعي فوتونات عالية الطاقة من أنبوب أشعة إكس أو نظير مشع مثل Ir-192 أو Co-60 أو Se-75. عند المرور في المادة تحدث ثلاثة تفاعلات رئيسية: الامتصاص الكهروضوئي، واستطارة كومبتون، وإنتاج الأزواج عند الطاقات العالية. اختلاف التوهين يخلق تباين الصورة.',
            'Industrial radiography uses high-energy photons from an X-ray tube or a radioisotope such as Ir-192, Co-60 or Se-75. Three interactions dominate: photoelectric absorption, Compton scattering and pair production at high energy. Differences in attenuation create image contrast.'
          ),
        },
        {
          heading: t('قانون التوهين', 'Attenuation law'),
          body: t(
            'I = I0 × e^(−μx) لشعاع أحادي الطاقة، حيث μ معامل التوهين الخطي وx السمك. طبقة النصف HVL = ln2/μ، وطبقة العشر TVL = ln10/μ. كل HVL تقلل الشدة إلى النصف، وكل TVL إلى العُشر. المعاملات تعتمد على المادة والطاقة.',
            'I = I0 × e^(−μx) for monoenergetic radiation, where μ is the linear attenuation coefficient and x is thickness. Half-value layer HVL = ln2/μ and tenth-value layer TVL = ln10/μ. Each HVL halves intensity; each TVL reduces it to one tenth. Coefficients depend on material and energy.'
          ),
        },
        {
          heading: t('المسافة والسلامة', 'Distance and safety'),
          body: t(
            'تقل شدة الإشعاع مع مربع المسافة وفق 1/r². مضاعفة المسافة تقلل المعدل إلى الربع. تستخدم أجهزة قياس المعدل والجرعة للتحقق من حدود منطقة العمل، ويجب تطبيق إجراءات المصدر المغلقة والتصاريح والمراقبة قبل أي تعرض.',
            'Radiation intensity follows the inverse-square law 1/r². Doubling distance reduces the rate to one quarter. Survey and personal dosimeters verify work-area limits; sealed-source procedures, permits and monitoring are required before any exposure.'
          ),
        },
      ],
      workedExample: {
        prompt: t('إذا كانت HVL = 8 mm، فما نسبة الشدة بعد 24 mm؟', 'If HVL = 8 mm, what intensity fraction remains after 24 mm?'),
        solution: t('عدد طبقات النصف = 24/8 = 3، فتبقى (1/2)^3 = 1/8 من الشدة الأصلية.', 'The number of half-value layers is 24/8 = 3, leaving (1/2)^3 = 1/8 of the original intensity.'),
      },
      exercise: {
        prompt: t('بنفس HVL، ما نسبة الشدة بعد 32 mm؟', 'With the same HVL, what fraction remains after 32 mm?'),
        hint: t('اقسم السمك على HVL ثم ارفع 1/2 للأس.', 'Divide thickness by HVL, then raise 1/2 to that power.'),
        answer: t('32/8 = 4 طبقات، والنسبة (1/2)^4 = 1/16.', '32/8 = 4 layers, so the fraction is (1/2)^4 = 1/16.'),
      },
      quiz: quiz(
        'phy-radiation-q1',
        'ماذا يحدث لمعدل الجرعة إذا تضاعفت المسافة من المصدر؟',
        'What happens to dose rate if distance from the source doubles?',
        [
          ['يتضاعف', 'It doubles'],
          ['ينخفض إلى النصف', 'It halves'],
          ['ينخفض إلى الربع', 'It drops to one quarter'],
          ['لا يتغير', 'It is unchanged'],
        ],
        2,
        'قانون التربيع العكسي: المعدل يتناسب مع 1/r²، ومضاعفة r تعطي الربع.',
        'Inverse-square law: rate is proportional to 1/r², so doubling r gives one quarter.'
      ),
      quizBank: [
        quiz('phy-radiation-q2', 'أي خاصية تجعل الأشعة المؤينة مفيدة في RT وخطيرة في نفس الوقت؟', 'Which property makes ionizing radiation useful in RT but also hazardous?', [['قدرتها على اختراق المادة والتفاعل معها','Its ability to penetrate and interact with matter'], ['لونها المرئي','Its visible color'], ['انعدام طاقتها','Its lack of energy'], ['عدم تأثرها بالمسافة','It is unaffected by distance']], 0, 'نفس القدرة على الاختراق والتفاعل تمكّن التصوير لكنها تتطلب تحكماً إشعاعياً.', 'The same penetration/interaction enables imaging but requires radiation control.', { category: 'understanding', difficulty: 'easy', reviewStatus: 'approved' }),
        quiz('phy-radiation-q3', 'ما المبدأ الأساسي للحماية من الإشعاع؟', 'What is a basic principle of radiation protection?', [['الزمن والمسافة والحماية','Time, distance and shielding'], ['السرعة والضغط والحرارة','Speed, pressure and temperature'], ['اللون والشكل والملمس','Color, shape and texture'], ['التردد والطور والسعة','Frequency, phase and amplitude']], 0, 'تقليل الزمن، زيادة المسافة، واستخدام الحماية تقلل الجرعة.', 'Reducing time, increasing distance, and using shielding reduce dose.', { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }),
      ],

      sources: ['nde-xray', 'nde-rt-interaction', 'nde-rt-penetration', 'nde-rt-safety'],
      prerequisiteLessonIds: ['phy-waves'],
      assumptionsAndLimits: [
        t('هذا الدرس تعليمي ويحتاج تطبيقه في الميدان إلى إجراء معتمد ومؤهل مختص.', 'This lesson is educational; field application requires an approved procedure and qualified personnel.'),
        t('أي قرار قبول/رفض أو صلاحية للخدمة يتبع الكود/الإجراء المعتمد وليس هذا الملخص.', 'Any acceptance/rejection or fitness-for-service decision follows the approved code/procedure, not this summary.'),
      ],
      referenceTrace: [
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-xray',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — X-Rays.', 'Supporting reading: Physics — X-Rays.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-rt-interaction',
          verified: true,
          note: t('مرجع قراءة داعم: Radiography — Interaction of Radiation and Matter.', 'Supporting reading: Radiography — Interaction of Radiation and Matter.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-rt-penetration',
          verified: true,
          note: t('مرجع قراءة داعم: Radiography — Depth of Penetration.', 'Supporting reading: Radiography — Depth of Penetration.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-rt-safety',
          verified: true,
          note: t('مرجع قراءة داعم: NDE Engineering — Radiation Detectors.', 'Supporting reading: NDE Engineering — Radiation Detectors.'),
        }
      ],
      governance: GOV,
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_2' },
      textbook: { bookId: 'book-rt', pageNumber: 1 },
      labId: 'rt_illuminator',
    },
    {
      id: 'phy-capillary',
      title: t('الخاصية الشعرية وفحص السوائل النافذة', 'Capillary action and penetrant testing'),
      summary: t('التوتر السطحي وزاوية التبلل يفسران دخول النافذ في الشق.', 'Surface tension and contact angle explain penetrant ingress into cracks.'),
      minutes: 18,
      objectives: [
        t('ربط التوتر السطحي وزاوية التبلل بدخول السائل.', 'Relate surface tension and contact angle to liquid ingress.'),
        t('تقدير ضغط الخاصية الشعرية لنصف قطر شق.', 'Estimate capillary pressure for a crack radius.'),
        t('شرح أثر التنظيف وجودة السطح على الحساسية.', 'Explain how cleaning and surface quality affect sensitivity.'),
      ],
      sections: [
        {
          heading: t('التوتر السطحي والتبلل', 'Surface tension and wetting'),
          body: t(
            'تتماسك جزيئات السائل بقوى تجعل سطحه يشبه غشاءً مشدوداً. عندما تكون قوى التلاصق مع الصلادة أكبر من التماسك، تقل زاوية التبلل θ عن 90° ويُبلل السطح. النفاذ الجيد يحتاج توتراً سطحياً منخفضاً وزاوية تبلل صغيرة ونظافة سطح.',
            'Liquid molecules cohere, making the surface behave like a stretched membrane. When adhesion to the solid exceeds cohesion, the contact angle θ falls below 90° and the surface wets. Good penetrants need low surface tension, a small contact angle and a clean surface.'
          ),
        },
        {
          heading: t('ضغط الخاصية الشعرية', 'Capillary pressure'),
          body: t(
            'فرق الضغط الدافع تقريباً Δp = 2γ cosθ / r، حيث γ التوتر السطحي وr نصف قطر الفتحة. كلما صغر r زاد الضغط الدافع، لكن الشقوق الضيقة جداً والمغلقة قد تمنع الدخول أو التنظيف. الشقوق المفتوحة للسطح فقط هي ما يكشفه PT.',
            'The driving pressure is approximately Δp = 2γ cosθ / r, where γ is surface tension and r the opening radius. Smaller r gives higher driving pressure, but very tight or blocked cracks may prevent ingress or cleaning. PT only detects discontinuities open to the surface.'
          ),
        },
        {
          heading: t('من الفيزياء إلى الإجراء', 'From physics to procedure'),
          body: t(
            'تطبيق النافذ وزمن المكوث وإزالة الزائد والتجفيف والتطوير كلها خطوات تحافظ على السائل داخل الشق. الغسل المفرط أو التجفيف القوي يسحبان النافذ من العيب ويسببان نتائج كاذبة. المطوّر يعمل كضغط عكسي يسحب النافذ إلى السطح.',
            'Penetrant application, dwell, excess removal, drying and development all preserve liquid inside the crack. Over-washing or aggressive drying draws penetrant out and causes false results. Developer acts as a blotter, drawing penetrant back to the surface.'
          ),
        },
      ],
      workedExample: {
        prompt: t('لشق نصف قطره 0.02 mm، γ=0.03 N/m، θ=0°. احسب Δp.', 'For a crack radius of 0.02 mm, γ = 0.03 N/m and θ = 0°, calculate Δp.'),
        solution: t('r = 2×10^-5 m. Δp = 2×0.03×1/(2×10^-5) = 3000 Pa، أي نحو 3 kPa. قيم صغيرة لكنها كافية لسائل منخفض التوتر السطحي في فتحة شعرية.', 'r = 2×10^-5 m. Δp = 2×0.03×1/(2×10^-5) = 3000 Pa, about 3 kPa. Small, but sufficient for a low-surface-tension liquid in a capillary opening.'),
      },
      exercise: {
        prompt: t('بنفس γ وθ، احسب Δp لنصف قطر 0.05 mm.', 'With the same γ and θ, calculate Δp for a 0.05 mm radius.'),
        hint: t('r = 5×10^-5 m.', 'r = 5×10^-5 m.'),
        answer: t('Δp = 2×0.03/(5×10^-5) = 1200 Pa، أي 1.2 kPa.', 'Δp = 2×0.03/(5×10^-5) = 1200 Pa, or 1.2 kPa.'),
      },
      quiz: quiz(
        'phy-capillary-q1',
        'أي عيب لا يمكن لفحص السوائل النافذة كشفه؟',
        'Which flaw cannot be detected by liquid penetrant testing?',
        [
          ['شرخ سطحي مفتوح', 'An open surface crack'],
          ['مسامية سطحية', 'Surface porosity'],
          ['عيب داخلي مغلق تماماً', 'A fully closed internal flaw'],
          ['نقص انصهار سطحي', 'Surface lack of fusion'],
        ],
        2,
        'PT يعتمد على دخول السائل من السطح؛ العيب الداخلي المغلق لا يصل إليه النافذ.',
        'PT relies on surface entry; penetrant cannot reach a fully enclosed internal flaw.'
      ),
      quizBank: [
        quiz('phy-capillary-q2', 'ما الشرط الأساسي لكي يعمل فحص السائل النافذ؟', 'What is a basic condition for penetrant testing to work?', [['عيب مفتوح على السطح','A surface-breaking discontinuity'], ['عيب عميق تحت السطح فقط','Only a deep subsurface flaw'], ['مادة غير موصلة دائماً','Always non-conductive material'], ['مجال مغناطيسي قوي','A strong magnetic field']], 0, 'PT يعتمد على دخول السائل إلى عيب مفتوح للسطح.', 'PT relies on liquid entering a surface-breaking discontinuity.', { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }),
        quiz('phy-capillary-q3', 'كيف تؤثر نظافة السطح على فحص PT؟', 'How does surface cleanliness affect PT?', [['لا تؤثر','It has no effect'], ['الأوساخ قد تمنع دخول النافذ أو تسبب دلالات مضللة','Contamination can block penetrant entry or cause misleading indications'], ['تزيد حساسية الفحص دائماً','It always increases sensitivity'], ['تلغي الحاجة للمظهر','It removes the need for developer']], 1, 'التنظيف شرط أساسي قبل تطبيق النافذ.', 'Cleaning is essential before penetrant application.', { category: 'application', difficulty: 'easy', reviewStatus: 'approved' }),
      ],

      sources: ['nde-capillary', 'nde-pt-process', 'nde-pt-penetrants'],
      prerequisiteLessonIds: ['phy-waves'],
      assumptionsAndLimits: [
        t('هذا الدرس تعليمي ويحتاج تطبيقه في الميدان إلى إجراء معتمد ومؤهل مختص.', 'This lesson is educational; field application requires an approved procedure and qualified personnel.'),
        t('أي قرار قبول/رفض أو صلاحية للخدمة يتبع الكود/الإجراء المعتمد وليس هذا الملخص.', 'Any acceptance/rejection or fitness-for-service decision follows the approved code/procedure, not this summary.'),
      ],
      referenceTrace: [
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-capillary',
          verified: true,
          note: t('مرجع قراءة داعم: Physics — Capillary Action.', 'Supporting reading: Physics — Capillary Action.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-pt-process',
          verified: true,
          note: t('مرجع قراءة داعم: Penetrant — Liquid Penetrant Inspection Process.', 'Supporting reading: Penetrant — Liquid Penetrant Inspection Process.'),
        },
        {
          kind: 'reading_support' as const,
          sourceId: 'nde-pt-penetrants',
          verified: true,
          note: t('مرجع قراءة داعم: Penetrant — Penetrants.', 'Supporting reading: Penetrant — Penetrants.'),
        }
      ],
      governance: GOV,
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_2' },
      textbook: { bookId: 'book-pt', pageNumber: 1 },
      labId: 'pt_mt_darkroom',
    },
  ],
  standards: ['ASME Sec V Art. 4/6/7/9', 'ASTM E1316', 'ISO 9712 principles'],
  sourceLanding: 'https://www.nde-ed.org/Physics/index.xhtml',
  limits: t(
    'هذا مقرر فيزياء تطبيقية، وليس بديلاً عن منهج Level I/II أو تدريب معملي. الأمثلة تعليمية ولا تحدد حدود قبول أو جرعات أو إجراءات موقع.',
    'This is applied-physics courseware, not a Level I/II syllabus or laboratory training. Examples are educational and do not define acceptance limits, doses or site procedures.'
  ),
};
