import { NdeEdCourse } from './types.js';
import { quiz, t } from './helpers.js';

const UT_GOV = {
  status: 'approved' as const,
  technicalReviewerRole: 'UT Level III / SME',
  lastUpdatedAt: '2026-11-24',
  lastReviewedAt: '2026-11-24',
  changeLog: [
    '2026-11-24: Pilot educational audit - added prerequisites, assumptions/limits, reference trace, and expanded quiz bank. Requires SME/Level III technical review before authoritative publication.',
  ],
};

const RT_READING = (sourceId: string, noteAr: string, noteEn: string) => ({
  kind: 'reading_support' as const,
  sourceId,
  verified: true,
  note: t(noteAr, noteEn),
});

const NORM_PENDING = (title: string, noteAr: string, noteEn: string) => ({
  kind: 'normative_standard' as const,
  title,
  verified: false,
  note: t(noteAr, noteEn),
});

export const utCourse: NdeEdCourse = {
  id: 'nde-ut',
  disciplineId: 'conventional_ndt',
  code: 'UT',
  level: 'level1',
  accent: '#22d3ee',
  title: t('الموجات فوق الصوتية (UT)', 'Ultrasonic Testing (UT)'),
  subtitle: t('المبدأ، الحزمة، العرض، المعايرة، اللحام، والتقنيات المتقدمة', 'Principle, beam, display, calibration, welds and advanced techniques'),
  description: t(
    'مقرر UT من الفيزياء إلى قرار الفحص: توليد الصوت، شكل الحزمة، عرض A-Scan، معايرة DAC، فحص اللحام بالزاوية، ولمحة عن الغمر وEMAT وPAUT/TOFD. المحتوى أصلي وهيكل الموضوعات متتبع لصفحات nde-ed.org. هذه النسخة خضعت لتدقيق تعليمي أولي وتحتاج مراجعة فنية Level III قبل اعتمادها مرجعاً نهائياً.',
    'UT from physics to inspection decisions: sound generation, beam shape, A-Scan display, DAC calibration, angle-beam weld inspection, and an outline of immersion, EMAT and PAUT/TOFD. Original content following the nde-ed.org topic structure. This version has undergone an initial educational audit and requires Level III technical review before authoritative publication.'
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
            'تحتوي البلورة الكهروضغطية على شحنة تتغير عند تشوهها، والعكس. نبضة كهربائية تجعلها تهتز وتولد موجة صوتية، والصدى العائد يجعلها تولد جهداً. المسبار قد يكون طولياً أو مائلاً أو سطحياً حسب التطبيق، والترددات الصناعية عادة بين 0.5 و15 MHz. اختيار نوع المسبار والتردد يتبع إجراء الفحص وخصائص المادة وهدف الفحص.',
            'A piezoelectric crystal develops charge when strained and deforms when charged. An electrical pulse makes it vibrate and launch sound; a returning echo makes it generate a voltage. Probes may be longitudinal, angle or surface wave, with industrial frequencies typically 0.5–15 MHz. Probe type and frequency selection follow the inspection procedure, material properties and inspection objective.'
          ),
        },
        {
          heading: t('زمن الرحلة', 'Time of flight'),
          body: t(
            'في pulse-echo يقطع الصوت المسافة إلى العاكس ثم يعود، لذلك t = 2d/v. المسار يعتمد على سرعة المادة ونمط الموجة والحرارة. تأخير المسبار والغطاء الأمامي/الوتد يجب تعويضه في المعايرة. قراءة سمك أو مسار دون تعويض تأخير أو تحقق من السرعة تعطي قراءة منحازة.',
            'In pulse-echo, sound travels to the reflector and back, so t = 2d/v. Path depends on material velocity, wave mode and temperature. Probe delay and wear plate/wedge delay must be compensated during calibration. A thickness or path reading without delay compensation or velocity verification is biased.'
          ),
        },
        {
          heading: t('التردد والاختراق', 'Frequency and penetration'),
          body: t(
            'التردد الأعلى يعطي طولاً موجياً أقصر وحساسية أفضل لعيوب صغيرة، لكنه يزيد التوهين والضوضاء في الحبيبات الخشنة. التردد المنخفض أفضل للمواد السميكة أو ذات الحبيبات الكبيرة. اختيار التردد يحدده الإجراء والقطعة، ويجب التحقق منه عملياً على الكتلة المرجعية.',
            'Higher frequency gives a shorter wavelength and better sensitivity to small flaws, but more attenuation and grain noise. Lower frequency suits thick or coarse-grained materials. Frequency choice is set by procedure and part, and should be verified on the reference block.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سرعة 5920 m/s وزمن ذهاب وعودة 10 µs. احسب السمك.', 'Velocity 5920 m/s and a 10 µs round-trip time. Calculate thickness.'),
        solution: t('t = 2d/v ⇒ d = v×t/2 = 5920 × 10×10^-6 / 2 = 0.0296 m = 29.6 mm. لا تنسَ القسمة على 2 أو تعويض تأخير المسبار والتحقق من معايرة السرعة.', 't = 2d/v ⇒ d = v×t/2 = 5920 × 10×10^-6 / 2 = 0.0296 m = 29.6 mm. Do not omit the factor of two, probe-delay compensation, or velocity calibration verification.'),
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
        'Measured time covers both directions; thickness is one way.',
        { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }
      ),
      quizBank: [
        quiz(
          'ut-principles-q2',
          'ما الأثر المتوقع لرفع تردد المسبار مع بقاء المادة كما هي؟',
          'What is the expected effect of increasing probe frequency on the same material?',
          [
            ['طول موجي أقصر وحساسية أعلى عادةً للعيوب الصغيرة مع زيادة التوهين', 'Shorter wavelength and usually higher sensitivity to small flaws, with increased attenuation'],
            ['طول موجي أطول واختراق أقل', 'Longer wavelength and less penetration'],
            ['لا يتغير شيء طالما السرعة ثابتة', 'Nothing changes as long as velocity is constant'],
            ['يزداد زمن الرحلة لنفس السمك', 'Round-trip time increases for the same thickness'],
          ],
          0,
          'زيادة التردد تقلل λ وتزيد الحساسية للعيوب الصغيرة، لكنها قد تزيد التوهين وضوضاء الحبيبات.',
          'Higher frequency reduces λ and can improve sensitivity to small flaws, but may increase attenuation and grain noise.',
          { category: 'understanding', difficulty: 'medium', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-principles-q3',
          'بعد تغيير المسبار، ما الإجراء الصحيح قبل قياس السمك؟',
          'After changing the probe, what should be done before thickness measurement?',
          [
            ['البدء مباشرة لأن المادة نفسها', 'Start immediately because the material is the same'],
            ['إعادة المعايرة/التحقق من السرعة وتأخير المسبار حسب الإجراء', 'Recalibrate/verify velocity and probe delay per procedure'],
            ['رفع الكسب فقط حتى تظهر الإشارة', 'Only increase gain until the signal appears'],
            ['تغيير وسيط الاقتران يكفي', 'Changing couplant is enough'],
          ],
          1,
          'تغيير المسبار قد يغير التأخير والاستجابة؛ يجب التحقق من المعايرة قبل القياس.',
          'Changing the probe can change delay and response; calibration must be verified before measurement.',
          { category: 'application', difficulty: 'medium', reviewStatus: 'approved' }
        ),
      ],
      sources: ['nde-ut-principles', 'nde-ut-piezo', 'nde-ut-normal'],
      prerequisiteLessonIds: ['phy-waves', 'phy-impedance'],
      assumptionsAndLimits: [
        t('المعادلات تفترض انتشاراً مستقيماً وسرعة معروفة في مادة متجانسة نسبياً.', 'Equations assume straight-line propagation and known velocity in a reasonably homogeneous material.'),
        t('القياس يعتمد على معايرة صحيحة وتعويض تأخير المسبار/الوتد.', 'Measurement depends on correct calibration and probe/wedge delay compensation.'),
        t('اختيار التردد والمسبار يخضع لإجراء الفحص المعتمد، وليس لهذه الأمثلة فقط.', 'Probe/frequency selection follows the approved inspection procedure, not only these examples.'),
      ],
      referenceTrace: [
        RT_READING('nde-ut-principles', 'مرجع قراءة داعم لمبدأ pulse-echo.', 'Supporting reading for pulse-echo principle.'),
        RT_READING('nde-ut-piezo', 'مرجع قراءة داعم للمسبار الكهروضغطي.', 'Supporting reading for piezoelectric transducers.'),
        RT_READING('nde-ut-normal', 'مرجع قراءة داعم للفحص بالحزمة العمودية.', 'Supporting reading for normal beam inspection.'),
        NORM_PENDING('ASME Section V, Article 4 (verify edition)', 'مرجع معياري محتمل لتقنية UT؛ يجب التحقق من الإصدار والبند المطبق قبل الاستشهاد.', 'Potential normative UT technique reference; verify applicable edition and clause before citation.'),
      ],
      governance: UT_GOV,
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
            'في المنطقة القريبة (Fresnel) تتداخل الموجات وتتغير الشدة بشكل معقد، وقد لا يكون تقييم السعة موثوقاً. لبلورة دائرية قطرها D وطول موجي λ: N = D²/(4λ). قطر أكبر أو تردد أعلى يزيد N. تبدأ المنطقة البعيدة بعد N وتكون الحزمة أكثر انتظاماً، لكن الحساب يظل تقريباً يعتمد على افتراضات المسبار والمادة.',
            'In the near field (Fresnel) waves interfere and intensity varies in a complex way, so amplitude evaluation may be unreliable. For a circular crystal of diameter D and wavelength λ: N = D²/(4λ). A larger crystal or higher frequency increases N. The far field begins beyond N and is more uniform, but the calculation remains an approximation dependent on probe and material assumptions.'
          ),
        },
        {
          heading: t('انتشار الحزمة', 'Beam spread'),
          body: t(
            'تنحرف الحزمة تدريجياً عن المحور. زاوية نصف الانتشار التقريبية: sin θ ≈ 0.51 λ/D (للبلورة الدائرية). كلما كبر D أو صغر λ ضاقت الحزمة. الحزمة الضيقة تعطي تحديداً أفضل للموقع لكن تغطية أقل لكل تمريرة، لذلك يجب الموازنة بين الحساسية والتغطية وفق الإجراء.',
            'The beam gradually diverges. Approximate half-angle: sin θ ≈ 0.51 λ/D for a circular crystal. Larger D or smaller λ narrows the beam. A narrow beam localises better but covers less area per pass, so sensitivity and coverage must be balanced per procedure.'
          ),
        },
        {
          heading: t('الاقتران والزاوية', 'Coupling and angle'),
          body: t(
            'وسيط الاقتران يزيل الفجوة الهوائية. سماكة الوسيط وحالته تؤثران على السعة، ويجب إعادة المعايرة عند تغييره. في الحزمة المائلة، قانون سنيل يحدد زاوية الانكسار: sin θ1/v1 = sin θ2/v2. الزوايا الحرجة تنتج موجات سطحية أو انعكاساً كلياً؛ اختيار الزاوية يجب أن يكون مبنياً على هندسة القطعة والعيب المتوقع والإجراء.',
            'Couplant removes the air gap. Its thickness and condition affect amplitude, so recalibrate when it changes. For angle beams, Snell’s law sets refraction: sin θ1/v1 = sin θ2/v2. Critical angles produce surface waves or total reflection; angle selection must be based on part geometry, expected flaw orientation and procedure.'
          ),
        },
      ],
      workedExample: {
        prompt: t('بلورة 10 mm وλ=1.48 mm. احسب N.', 'A 10 mm crystal with λ = 1.48 mm. Calculate N.'),
        solution: t('N = D²/(4λ) = 100/(4×1.48) = 16.9 mm. تقييم السعة داخل هذه المسافة يحتاج حذراً، وقد يتطلب الإجراء تعويضاً أو ترتيب فحص مناسب.', 'N = D²/(4λ) = 100/(4×1.48) = 16.9 mm. Amplitude evaluation within this distance needs care, and the procedure may require compensation or a suitable inspection arrangement.'),
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
        'λ decreases as frequency rises, so N = D²/(4λ) increases.',
        { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }
      ),
      quizBank: [
        quiz(
          'ut-beam-q2',
          'لماذا قد تكون مقارنة السعة داخل المنطقة القريبة غير موثوقة؟',
          'Why can amplitude comparison be unreliable in the near field?',
          [
            ['لأن سرعة الصوت تصبح صفراً', 'Because sound velocity becomes zero'],
            ['لأن تداخل الموجات يسبب تغيرات معقدة في الشدة', 'Because wave interference causes complex intensity variations'],
            ['لأن الاقتران لا يعمل في المنطقة القريبة', 'Because couplant does not work in the near field'],
            ['لأن A-Scan لا يعمل', 'Because A-Scan does not work'],
          ],
          1,
          'في Fresnel zone تتداخل الموجات فتتغير الشدة موضعياً، لذلك تقييم السعة يحتاج حذراً.',
          'In the Fresnel zone, interference causes local intensity variations, so amplitude evaluation needs caution.',
          { category: 'understanding', difficulty: 'medium', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-beam-q3',
          'ما الخطر العملي لتغيير وسيط الاقتران دون إعادة تحقق؟',
          'What is the practical risk of changing couplant without re-verification?',
          [
            ['لا خطر لأن الاقتران ليس له تأثير', 'No risk because couplant has no effect'],
            ['قد تتغير السعة/الاستجابة فتتأثر المقارنة والمعايرة', 'Amplitude/response may change, affecting comparison and calibration'],
            ['يتغير سمك المادة', 'Material thickness changes'],
            ['تنعكس الإشارة دائماً بنسبة 100%', 'The signal is always reflected 100%'],
          ],
          1,
          'الاقتران يؤثر على نقل الطاقة؛ أي تغيير قد يتطلب إعادة تحقق حسب الإجراء.',
          'Couplant affects energy transfer; changes may require re-verification per procedure.',
          { category: 'application', difficulty: 'medium', reviewStatus: 'approved' }
        ),
      ],
      sources: ['nde-ut-beamspread', 'nde-ut-fields', 'nde-ut-formulas', 'nde-ut-couplant'],
      prerequisiteLessonIds: ['ut-principles'],
      assumptionsAndLimits: [
        t('معادلات N وانتشار الحزمة هنا تقريبية لبلورة دائرية piston-like.', 'Near-field and beam-spread formulas here are approximations for a circular piston-like crystal.'),
        t('تأثيرات الهندسة، الحبيبات، عدم التجانس، وسطح الدخول قد تغير سلوك الحزمة فعلياً.', 'Geometry, grain structure, inhomogeneity and entry surface can alter real beam behavior.'),
        t('اختيار الاقتران والزاوية يجب أن يتبع الإجراء المعتمد والتحقق العملي.', 'Couplant and angle selection must follow the approved procedure and practical verification.'),
      ],
      referenceTrace: [
        RT_READING('nde-ut-beamspread', 'مرجع قراءة داعم لانتشار الحزمة.', 'Supporting reading for beam spread.'),
        RT_READING('nde-ut-fields', 'مرجع قراءة داعم للمجال الإشعاعي.', 'Supporting reading for radiated fields.'),
        RT_READING('nde-ut-formulas', 'مرجع قراءة داعم للمعادلات.', 'Supporting reading for formulas.'),
        RT_READING('nde-ut-couplant', 'مرجع قراءة داعم للاقتران.', 'Supporting reading for couplant.'),
        NORM_PENDING('ASME Section V, Article 4 (verify edition)', 'للتحقق من متطلبات المعايرة/الحزمة/الإجراء حسب الإصدار المطبق.', 'Verify calibration/beam/procedure requirements against the applicable edition.'),
      ],
      governance: UT_GOV,
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
            'A-Scan يعرض السعة مقابل الزمن/المسافة على خط واحد. المحور الأفقي يمثل المسار أو الزمن، والرأسي السعة. البوابة (gate) تحدد نافذة زمنية لالتقاط إشارة وقياسها. إشارة البداية هي النبضة الأولية، وإشارة السطح قد تكون قريبة منها، ثم تأتي إشارات العيوب والظهر. ضبط البوابات والمعايرة يحدد معنى القراءة.',
            'A-Scan shows amplitude versus time/distance along one line. The horizontal axis is path or time; the vertical is amplitude. A gate defines a time window for capturing and measuring a signal. The initial pulse is at the start, a surface echo may follow, then flaw and back-wall echoes. Gate setup and calibration define what the reading means.'
          ),
        },
        {
          heading: t('B-Scan وC-Scan', 'B-Scan and C-Scan'),
          body: t(
            'B-Scan يعرض مقطعاً رأسياً (المسافة مقابل العمق) ويظهر امتداد العيب في العمق. C-Scan يعرض خريطة مسقطية للسطح ويظهر توزيع العيوب أفقياً. كلاهما يحتاج ترميز موضع المسبار. الصورة لا تلغي الحاجة إلى معايرة وسرعة صوت صحيحة وتفسير مؤهل.',
            'B-Scan shows a vertical section (distance versus depth) and reveals flaw extent in depth. C-Scan shows a plan view and reveals lateral distribution. Both require probe position encoding. An image does not remove the need for calibration, correct velocity and qualified interpretation.'
          ),
        },
        {
          heading: t('السعة والـ dB', 'Amplitude and dB'),
          body: t(
            'تُقارن السعات عادة بالديسيبل: ΔdB = 20 log(A2/A1). مضاعفة السعة تعني +6 dB تقريباً، ونصفها −6 dB. منحنى DAC يعوض تغير السعة مع المسافة، لذا تُقارن الإشارات بعد التصحيح لا قبلها. لا تقارن ارتفاع شاشة من أجهزة مختلفة دون معايرة، ولا تحول فرق dB مباشرة إلى حجم عيب دون طريقة تقييم معتمدة.',
            'Amplitudes are commonly compared in decibels: ΔdB = 20 log(A2/A1). Doubling amplitude is about +6 dB; halving is −6 dB. A DAC curve compensates amplitude change with distance, so signals are compared after correction, not before. Do not compare screen heights from different instruments without calibration, and do not convert dB difference directly to flaw size without an approved evaluation method.'
          ),
        },
      ],
      workedExample: {
        prompt: t('إشارة 80% وأخرى 40% على نفس المعايرة. ما فرق dB؟', 'Signals of 80% and 40% on the same calibration. What is the dB difference?'),
        solution: t('ΔdB = 20 log(80/40) = 20 log 2 ≈ 6 dB. الأولى أعلى بـ6 dB، وليست «ضعف العيب» بالضرورة؛ السعة تعتمد على الحجم والاتجاه والمسافة والعاكسية.', 'ΔdB = 20 log(80/40) = 20 log 2 ≈ 6 dB. The first is 6 dB higher, not necessarily twice the flaw size; amplitude depends on size, orientation, distance and reflectivity.'),
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
        'A-Scan plots amplitude vertically against time/distance horizontally.',
        { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }
      ),
      quizBank: [
        quiz(
          'ut-presentation-q2',
          'إشارتان على نفس الإعداد: الأولى 40% والثانية 20%. ما الفرق التقريبي؟',
          'Two signals on the same setup: 40% and 20%. What is the approximate difference?',
          [
            ['+6 dB', '+6 dB'],
            ['-6 dB', '-6 dB'],
            ['+20 dB', '+20 dB'],
            ['0 dB', '0 dB'],
          ],
          1,
          'النسبة 20/40 = 0.5، و20 log(0.5) ≈ -6 dB.',
          'Ratio 20/40 = 0.5, and 20 log(0.5) ≈ -6 dB.',
          { category: 'application', difficulty: 'medium', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-presentation-q3',
          'لماذا لا تكفي صورة C-Scan وحدها لاتخاذ قرار قبول نهائي؟',
          'Why is a C-Scan image alone insufficient for a final acceptance decision?',
          [
            ['لأن C-Scan لا يمكن عرضها على الكمبيوتر', 'Because C-Scan cannot be displayed on a computer'],
            ['لأن القرار يحتاج معايرة صحيحة، تفسير مؤهل، ومعيار قبول/إجراء معتمد', 'Because the decision needs correct calibration, qualified interpretation, and an approved acceptance criterion/procedure'],
            ['لأن C-Scan يلغي الحاجة للمعايرة', 'Because C-Scan removes the need for calibration'],
            ['لأن جميع إشارات C-Scan هي عيوب مرفوضة', 'Because all C-Scan signals are rejectable defects'],
          ],
          1,
          'العرض المرئي أداة تفسير؛ قرار القبول يحتاج سياق معايرة وإجراء وكود ومؤهل.',
          'A visual display is an interpretation tool; acceptance needs calibration context, procedure/code and qualified personnel.',
          { category: 'critical_thinking', difficulty: 'medium', reviewStatus: 'approved' }
        ),
      ],
      sources: ['nde-ut-presentation', 'nde-ut-dac', 'nde-ut-normal'],
      prerequisiteLessonIds: ['ut-principles'],
      assumptionsAndLimits: [
        t('مقارنات dB صالحة فقط ضمن نفس الإعداد/المعايرة أو بعد تصحيح مناسب.', 'dB comparisons are valid only within the same setup/calibration or after appropriate correction.'),
        t('فرق السعة ليس قياساً مباشراً لحجم العيب.', 'Amplitude difference is not a direct flaw-size measurement.'),
        t('العروض B/C تحتاج ترميز موضع ومعايرة صحيحة.', 'B/C-scan displays require position encoding and correct calibration.'),
      ],
      referenceTrace: [
        RT_READING('nde-ut-presentation', 'مرجع قراءة داعم لعروض A/B/C.', 'Supporting reading for A/B/C-scan presentation.'),
        RT_READING('nde-ut-dac', 'مرجع قراءة داعم لمقارنة السعة بعد التصحيح.', 'Supporting reading for corrected amplitude comparison.'),
        NORM_PENDING('ASME Section V, Article 4 (verify edition)', 'تحقق من متطلبات التسجيل والعرض حسب الإصدار والإجراء.', 'Verify recording/display requirements against applicable edition and procedure.'),
      ],
      governance: UT_GOV,
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
        t('تحديد المنطقة الميتة والدقة وحدود استخدام DAC.', 'Identify dead zone, resolution and DAC use limits.'),
      ],
      sections: [
        {
          heading: t('المعايرة', 'Calibration'),
          body: t(
            'المعايرة تضبط سرعة الصوت وتأخير المسبار والمدى قبل الفحص. تُستخدم كتلة مرجعية بمادة وحالة سطح قريبة من القطعة قدر الإمكان. المعايرة ليست «ضبط الصفر» فقط؛ تشمل التحقق من الدقة، الخطية، المنطقة الميتة، الدقة المحورية، والتكرارية حسب الإجراء. تُعاد أو يُتحقق منها عند تغيير المسبار، الكابل، الوتد، الوسيط، الجهاز، أو أي إعداد مؤثر.',
            'Calibration sets velocity, probe delay and range before inspection. A reference block with material and surface condition as close as practical to the part is used. Calibration is not just zeroing; it includes verifying accuracy, linearity, dead zone, resolution and repeatability as required by procedure. Recalibrate or verify when probe, cable, wedge, couplant, instrument or any influencing setting changes.'
          ),
        },
        {
          heading: t('منحنى DAC', 'DAC curve'),
          body: t(
            'السعة المنعكسة من عاكس مرجعي مماثل تقل مع زيادة المسافة بسبب الانتشار والتوهين. يربط DAC السعة بالمسافة لعاكسات مرجعية معروفة، ويُستخدم كخط أساس للمقارنة. تُقيّم إشارة العيب بالنسبة لمنحنى DAC (مثلاً +6 dB أو −6 dB) ضمن نفس الإعداد. DAC ليس وحيداً دائماً: قد يستخدم الإجراء TCG أو DGS أو طرق تقييم أخرى. يجب توثيق نوع العاكس المرجعي، الكتلة، الإعدادات، وأي تصحيحات مطلوبة.',
            'Echo amplitude from a similar reference reflector falls with distance because of beam spread and attenuation. A DAC links amplitude to distance for known reference reflectors and provides a comparison baseline. A flaw signal is evaluated relative to DAC (for example +6 dB or −6 dB) within the same setup. DAC is not always the only method: procedures may use TCG, DGS or other evaluation methods. Document reflector type, block, settings and any required corrections.'
          ),
        },
        {
          heading: t('المنطقة الميتة والدقة وحدود القرار', 'Dead zone, resolution and decision limits'),
          body: t(
            'المنطقة الميتة هي المسافة بعد النبضة الأولية التي لا يمكن فيها تمييز إشارة قريبة. تزداد مع النبضة الطويلة والتردد المنخفض. الدقة هي القدرة على فصل إشارتين متقاربتين. العيوب القريبة من السطح قد تحتاج مسبار تأخير، حزمة مزدوجة، أو تقنية أخرى. الأهم: قراءة بالنسبة لـ DAC ليست قرار قبول/رفض؛ قرار القبول يتبع الكود/الإجراء المعتمد وسياق العيب.',
            'The dead zone is the distance after the initial pulse where a nearby echo cannot be resolved. It increases with long pulses and lower frequency. Resolution is the ability to separate two close echoes. Near-surface flaws may need a delay-line, dual-element probe, or another technique. Critically: a DAC-relative reading is not an accept/reject decision; acceptance follows the approved code/procedure and flaw context.'
          ),
        },
      ],
      workedExample: {
        prompt: t('إشارة عيب 50% ومنحنى DAC عند 25% لنفس المسافة. ما القراءة؟', 'A flaw signal is 50% and DAC is 25% at the same distance. What is the reading?'),
        solution: t('النسبة 2:1 تعني +6 dB فوق DAC تقريباً (20 log 2). سجّل «+6 dB relative to DAC» مع المسافة، الإعداد، ونوع العاكس المرجعي. لا تحوّل ذلك إلى قبول/رفض دون معيار الكود/الإجراء المعتمد.', 'A 2:1 ratio is about +6 dB above DAC (20 log 2). Record “+6 dB relative to DAC” with distance, setup, and reference reflector type. Do not convert that into accept/reject without the approved code/procedure criterion.'),
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
        'DAC compensates this change so comparison is meaningful.',
        { category: 'understanding', difficulty: 'easy', reviewStatus: 'approved' }
      ),
      quizBank: [
        quiz(
          'ut-calibration-q2',
          'أي إجراء مطلوب بعد تغيير الوتد أو الكابل أو وسيط الاقتران؟',
          'Which action is required after changing wedge, cable or couplant?',
          [
            ['لا شيء إذا كانت الإشارة مرئية', 'Nothing if the signal is visible'],
            ['إعادة تحقق/معايرة حسب الإجراء قبل الاستمرار', 'Re-verify/recalibrate per procedure before continuing'],
            ['زيادة الكسب فقط', 'Only increase gain'],
            ['تغيير لون الشاشة', 'Change screen color'],
          ],
          1,
          'أي تغيير مؤثر قد يغير الاستجابة أو المسار؛ يجب التحقق قبل تسجيل قرارات فحص.',
          'Influencing changes can alter response/path; verification is needed before recording inspection decisions.',
          { category: 'application', difficulty: 'medium', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-calibration-q3',
          'إشارة مسجلة عند +6 dB DAC. ما العبارة الأدق؟',
          'A signal is recorded at +6 dB DAC. Which statement is most accurate?',
          [
            ['العيب مرفوض تلقائياً', 'The flaw is automatically rejectable'],
            ['القطعة مقبولة لأن DAC تم بناؤه', 'The part is accepted because DAC was built'],
            ['السعة أعلى من مرجع DAC بنفس الإعداد؛ قرار القبول يحتاج الكود/الإجراء المعتمد', 'Amplitude is above DAC reference in the same setup; acceptance needs approved code/procedure'],
            ['قياس +6 dB يعني أن طول العيب 6 مم', 'A +6 dB reading means flaw length is 6 mm'],
          ],
          2,
          'قراءة DAC تصف السعة بالنسبة لمرجع؛ القبول/الرفض قرار كودي/إجرائي منفصل.',
          'A DAC reading describes amplitude relative to a reference; accept/reject is a separate code/procedure decision.',
          { category: 'critical_thinking', difficulty: 'hard', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-calibration-q4',
          'متى قد يكون DAC غير كافٍ وحده؟',
          'When might DAC alone be insufficient?',
          [
            ['عندما نحتاج تعويض كسب متغير مع الزمن/العمق أو طريقة تقييم أخرى حسب الإجراء', 'When time/depth gain compensation or another evaluation method is required by procedure'],
            ['عندما تكون المادة معدنية', 'When the material is metal'],
            ['عندما يكون المسبار 5 MHz', 'When the probe is 5 MHz'],
            ['دائماً DAC يكفي لكل الحالات', 'DAC is always sufficient for all cases'],
          ],
          0,
          'بعض الإجراءات تستخدم TCG/DGS أو متطلبات خاصة؛ اختيار الطريقة يتبع الإجراء والمعيار المطبق.',
          'Some procedures use TCG/DGS or special requirements; method selection follows the procedure and applicable standard.',
          { category: 'understanding', difficulty: 'medium', reviewStatus: 'approved' }
        ),
      ],
      sources: ['nde-ut-calibration', 'nde-ut-dac', 'nde-ut-formulas'],
      prerequisiteLessonIds: ['ut-principles', 'ut-presentation'],
      assumptionsAndLimits: [
        t('أمثلة DAC هنا تعليمية ولا تمثل منحنى قبول كودي.', 'DAC examples here are educational and do not represent a code acceptance curve.'),
        t('يجب توثيق نوع العاكس المرجعي والكتلة والإعدادات وأي تصحيحات نقل/سطح مطلوبة بالإجراء.', 'Reference reflector type, block, settings and any required transfer/surface corrections must be documented per procedure.'),
        t('قراءة فوق/تحت DAC ليست قرار قبول أو رفض.', 'A reading above/below DAC is not an accept/reject decision.'),
        t('قرب العيب من السطح قد يتأثر بالمنطقة الميتة ويحتاج تقنية مناسبة.', 'Near-surface flaws may be affected by dead zone and need an appropriate technique.'),
      ],
      referenceTrace: [
        RT_READING('nde-ut-calibration', 'مرجع قراءة داعم للمعايرة.', 'Supporting reading for calibration.'),
        RT_READING('nde-ut-dac', 'مرجع قراءة داعم لمنحنى DAC.', 'Supporting reading for DAC curve.'),
        RT_READING('nde-ut-formulas', 'مرجع قراءة داعم للعلاقات الرياضية.', 'Supporting reading for mathematical relations.'),
        NORM_PENDING('ASME Section V, Article 4 (verify edition)', 'تحقق من متطلبات الكتل المرجعية، DAC/TCG، والتحقق الدوري حسب الإصدار المطبق.', 'Verify reference block, DAC/TCG and periodic verification requirements against the applicable edition.'),
      ],
      governance: UT_GOV,
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
            'تُستخدم حزمة قصية بزاوية 45° أو 60° أو 70° غالباً. يجب أن تكون الحزمة موجهة للكشف عن العيب المتوقع، وأن تغطي منطقة اللحام والمنطقة المتأثرة حرارياً. يحدد الإجراء والكود زوايا ومسافات وعواكس مرجعية. قبل المسح يجب التحقق من نقطة الخروج، زاوية الحزمة، معايرة المدى، والحساسية.',
            'A shear beam at 45°, 60° or 70° is common. The beam should be oriented to detect the expected flaw and cover the weld and heat-affected zone. Procedure and code define angles, distances and reference reflectors. Before scanning, verify exit point, beam angle, range calibration and sensitivity.'
          ),
        },
        {
          heading: t('حساب الموقع', 'Location calculation'),
          body: t(
            'لنفترض سماكة T وسطحين متوازيين وانتشار مستقيم: مسار نصف القفزة إلى الخلفية S = T / cos θ، والمسافة السطحية x = T tan θ. لقفزة كاملة S = 2T/cos θ و x = 2T tan θ. لإشارة عند مسار صوت Sᵢ داخل القفزة الأولى، العمق التقريبي d = Sᵢ cos θ والمسافة السطحية = Sᵢ sin θ (مع مراعاة أي نصف قفزة). هذه علاقات مبسطة؛ يجب تأكيدها برسم skip chart والتحقق العملي.',
            'Assuming thickness T, parallel surfaces and straight propagation: half-skip path to backwall S = T / cos θ, surface distance x = T tan θ. Full skip: S = 2T/cos θ, x = 2T tan θ. For an echo at sound path Sᵢ in the first leg, approximate depth d = Sᵢ cos θ and surface distance = Sᵢ sin θ (accounting for leg). These are simplified relations; confirm with a skip chart and practical verification.'
          ),
        },
        {
          heading: t('المسح والتغطية', 'Scanning and coverage'),
          body: t(
            'يشمل المسح الحركة على طول اللحام وعبره، مع اتجاهات متقابلة وزوايا مناسبة. يلزم تداخل كافٍ بين التمريرات لتغطية الحجم. العيوب الاتجاهية قد تظهر في اتجاه واحد فقط. يجب تمييز إشارات الهندسة (جذر، تاج، Hi-Lo، لحام خلفي) من إشارات العيوب باستخدام الرسم، الموقع، الحركة، وتأكيد من اتجاهات أخرى.',
            'Scanning includes movement along and across the weld with opposing directions and suitable angles. Sufficient overlap between passes is needed for volumetric coverage. Oriented flaws may appear in only one direction. Geometry echoes (root, cap, Hi-Lo, backing) must be distinguished from flaws using drawing, position, movement and confirmation from other directions.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سماكة 20 mm، زاوية 45°. احسب مسار نصف القفزة والمسافة السطحية.', 'Thickness 20 mm, angle 45°. Calculate half-skip path and surface distance.'),
        solution: t('S = 20/cos45° = 28.3 mm. x = 20×tan45° = 20 mm. القفزة الكاملة تعطي 56.6 mm و40 mm. إذا ظهرت الإشارة عند 28.3 mm وكانت على القفزة الأولى فقد تتوافق مع عمق قريب من 20 mm (مثل جذر)، لكن يجب تأكيد طبيعة الإشارة بالحركة والاتجاهات الأخرى.', 'S = 20/cos45° = 28.3 mm. x = 20×tan45° = 20 mm. A full skip gives 56.6 mm and 40 mm. An echo at 28.3 mm on the first leg may correspond to near 20 mm depth (e.g. root), but signal character must be confirmed by movement and other directions.'),
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
        'Flaw orientation and depth determine suitable angle and path; one angle cannot cover everything.',
        { category: 'understanding', difficulty: 'easy', reviewStatus: 'approved' }
      ),
      quizBank: [
        quiz(
          'ut-welds-q2',
          'إشارة تظهر عند مسار الصوت المتوقع لجذر اللحام. ما الخطوة الصحيحة التالية؟',
          'An echo appears at the expected root sound path. What is the next correct step?',
          [
            ['تسجيلها كعيب رفض فوراً', 'Record it immediately as a rejectable flaw'],
            ['تجاهلها لأنها دائماً هندسة', 'Ignore it because it is always geometry'],
            ['تأكيد طبيعتها بالحركة، الاتجاه، الطول، والمقارنة مع رسم الوصلة', 'Confirm its nature by movement, direction, length and comparison with weld drawing'],
            ['رفع الكسب حتى تختفي', 'Increase gain until it disappears'],
          ],
          2,
          'إشارات الجذر قد تكون هندسية أو عيباً؛ يجب تأكيدها قبل التصنيف.',
          'Root signals may be geometry or flaws; they must be characterized before classification.',
          { category: 'application', difficulty: 'medium', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-welds-q3',
          'ما الافتراض الأساسي في حسابات skip المبسطة؟',
          'What is a key assumption in simplified skip calculations?',
          [
            ['سطوح متوازية وانتشار مستقيم وسرعة معروفة', 'Parallel surfaces, straight propagation and known velocity'],
            ['أن جميع العيوب كروية', 'All flaws are spherical'],
            ['أن الكسب لا يؤثر', 'Gain has no effect'],
            ['أن الاقتران غير مطلوب', 'Couplant is not required'],
          ],
          0,
          'تغير الهندسة أو السطح أو السرعة يغير المسار الفعلي ويستلزم حذراً.',
          'Changes in geometry, surface or velocity change the actual path and require caution.',
          { category: 'knowledge', difficulty: 'medium', reviewStatus: 'approved' }
        ),
      ],
      sources: ['nde-ut-angle1', 'nde-ut-angle2', 'nde-ut-weldments'],
      prerequisiteLessonIds: ['ut-beam', 'ut-calibration'],
      assumptionsAndLimits: [
        t('حسابات skip المبسطة تفترض سماكة ثابتة، سطوح متوازية، وانتشار مستقيم.', 'Simplified skip calculations assume constant thickness, parallel surfaces and straight propagation.'),
        t('يجب التحقق من exit point/زاوية الحزمة/المعايرة قبل المسح.', 'Exit point, beam angle and calibration must be verified before scanning.'),
        t('تمييز إشارة الهندسة عن العيب يتطلب تحليل حركة وإتجاهات متعددة، وليس السعة وحدها.', 'Distinguishing geometry from flaw signals requires movement/direction analysis, not amplitude alone.'),
      ],
      referenceTrace: [
        RT_READING('nde-ut-angle1', 'مرجع قراءة داعم للحزمة المائلة وقانون سنيل.', 'Supporting reading for angle beam and Snell’s law.'),
        RT_READING('nde-ut-angle2', 'مرجع قراءة داعم لحساب الموقع.', 'Supporting reading for flaw location calculation.'),
        RT_READING('nde-ut-weldments', 'مرجع قراءة داعم لفحص اللحامات.', 'Supporting reading for weld inspection.'),
        NORM_PENDING('ISO 17640 / AWS D1.1 / ASME Section V Article 4 (verify editions)', 'المعيار المطبق يعتمد على العقد والإجراء؛ تحقق من الإصدار والنطاق قبل أي استشهاد.', 'Applicable standard depends on contract/procedure; verify edition and scope before citation.'),
      ],
      governance: UT_GOV,
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
            'في الفحص بالغمر يكون المسبار والمعدة داخل سائل، ويُستخدم الماء غالباً كوسيط. يسمح ذلك بمسح آلي وتركيز جيد وزوايا متعددة، ويناسب القطع المعقدة والإنتاج الكبير. يحتاج التحكم في المسافة والزاوية ونظافة الماء وفقاعات الهواء التي تشوش الإشارة، كما يحتاج إعداد معايرة مناسب لمسار الماء/المعدن.',
            'In immersion testing the probe and part are in a liquid, often water. This enables automated scanning, good focusing and multiple angles, suitable for complex parts and production. It needs control of distance, angle and water cleanliness, since bubbles scatter the signal, and requires calibration setup appropriate for the water/metal path.'
          ),
        },
        {
          heading: t('EMAT', 'EMAT'),
          body: t(
            'محولات EMAT تولد الصوت كهرومغناطيسياً في السطح، ولا تحتاج وسيط اقتران سائلاً. تناسب الأسطح الساخنة أو الخشنة أو البعيدة، لكنها أقل كفاءة وقد تحتاج طاقة أعلى، وتعمل فقط على مواد موصلة/مغناطيسية حسب التصميم. لا تغني عن المعايرة والتحقق، وقد تكون الحساسية محدودة مقارنة بتقنيات تلامسية معينة.',
            'EMATs generate sound electromagnetically at the surface and need no fluid couplant. They suit hot, rough or remote surfaces, but are less efficient, may need higher power, and work only on conductive/magnetic materials depending on design. They do not replace calibration and verification, and sensitivity may be limited compared with some contact techniques.'
          ),
        },
        {
          heading: t('PAUT وTOFD', 'PAUT and TOFD'),
          body: t(
            'PAUT يستخدم مصفوفة عناصر ويوجه الحزمة إلكترونياً لتغطية زوايا ومسارات متعددة، ويحتاج معايرة، focal laws، ترميز موضع، وبرامج تحليل وإجراء مؤهل. TOFD يعتمد على حيود أطراف العيب ويستخدم غالباً لتقدير الارتفاع، لكنه حساس للهندسة ويحتاج إعداداً خاصاً وله حدود قرب السطح/الظهر (dead zones) تتطلب تقنيات مكملة حسب الإجراء. كلاهما ليس «تصويراً مباشراً» ولا يلغي الحاجة إلى إجراء مؤهل ومراجع مؤهل.',
            'PAUT uses an element array and steers the beam electronically for multiple angles and paths, requiring calibration, focal laws, position encoding, analysis software and a qualified procedure. TOFD uses tip diffraction and is often used for height sizing, but is sensitive to geometry, needs specific setup, and has near-surface/back-wall dead-zone limitations that may require complementary techniques per procedure. Neither is direct imaging, and neither removes the need for a qualified procedure and qualified personnel.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سطح ساخن 300°C ولا يمكن استخدام وسيط سائل. ما الخيار؟', 'A 300°C surface prevents liquid couplant. What option?'),
        solution: t('قد يكون EMAT مناسباً إن كانت المادة موصلة/مغناطيسية وكان التصميم يتحمل الحرارة، مع التحقق من الحساسية والإجراء. البديل قد يكون فحصاً بصرياً أو تقنية غير تلامسية أخرى وفق الإجراء؛ لا تفترض أن EMAT يحل كل الحالات.', 'EMAT may suit if the material is conductive/magnetic and the design tolerates heat, with sensitivity verification and procedure control. Alternatives may be visual or another non-contact technique per procedure; do not assume EMAT solves every case.'),
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
        'PAUT is advanced and needs calibration, software, procedure and analysis; it is not a substitute for qualification.',
        { category: 'knowledge', difficulty: 'easy', reviewStatus: 'approved' }
      ),
      quizBank: [
        quiz(
          'ut-advanced-q2',
          'ما أحد حدود TOFD التي يجب أن يعرفها المتعلم؟',
          'What is one TOFD limitation a learner should know?',
          [
            ['لا يمكن استخدامه على المعادن', 'It cannot be used on metals'],
            ['له مناطق عمياء قرب السطح والخلفية وقد يحتاج تقنية مكملة', 'It has near-surface/back-wall dead zones and may need complementary technique'],
            ['لا يحتاج أي إعداد', 'It needs no setup'],
            ['يعطي دائماً قرار قبول تلقائي', 'It always gives automatic acceptance'],
          ],
          1,
          'TOFD قوي في تقدير الارتفاع في حالات مناسبة، لكن dead zones والهندسة تحد من تغطيته.',
          'TOFD is strong for height sizing in suitable cases, but dead zones and geometry limit coverage.',
          { category: 'understanding', difficulty: 'medium', reviewStatus: 'approved' }
        ),
        quiz(
          'ut-advanced-q3',
          'متى تختار تقنية متقدمة بدلاً من UT تقليدي؟',
          'When should an advanced technique be chosen over conventional UT?',
          [
            ['دائماً، لأنها أحدث', 'Always, because it is newer'],
            ['عندما توفر تغطية/قدرة تقييم مطلوبة بالإجراء وتكون القيود مقبولة ومؤهلة', 'When it provides required coverage/evaluation capability, with acceptable and qualified limitations per procedure'],
            ['عندما لا يوجد إجراء', 'When there is no procedure'],
            ['لإلغاء الحاجة للمعايرة', 'To eliminate calibration'],
          ],
          1,
          'اختيار التقنية قرار هندسي/إجرائي يعتمد على الهدف، الهندسة، القيود، والتأهيل.',
          'Technique selection is an engineering/procedural decision based on objective, geometry, limitations and qualification.',
          { category: 'critical_thinking', difficulty: 'medium', reviewStatus: 'approved' }
        ),
      ],
      sources: ['nde-ut-immersion', 'nde-ut-emat', 'nde-ut-presentation'],
      prerequisiteLessonIds: ['ut-welds'],
      assumptionsAndLimits: [
        t('هذا الدرس توعية تقنية متقدمة وليس تأهيلاً PAUT/TOFD/EMAT.', 'This lesson is advanced-tech awareness, not PAUT/TOFD/EMAT qualification.'),
        t('TOFD له dead zones قرب السطح والخلفية؛ PAUT يحتاج focal laws وترميز وتحليل مؤهل.', 'TOFD has near-surface/back-wall dead zones; PAUT needs focal laws, encoding and qualified analysis.'),
        t('اختيار التقنية المتقدمة يتبع الإجراء، الكود المطبق، التأهيل، والقدرة على التحقق.', 'Advanced technique selection follows procedure, applicable code, qualification and verification capability.'),
      ],
      referenceTrace: [
        RT_READING('nde-ut-immersion', 'مرجع قراءة داعم للفحص بالغمر.', 'Supporting reading for immersion testing.'),
        RT_READING('nde-ut-emat', 'مرجع قراءة داعم لـ EMAT.', 'Supporting reading for EMAT.'),
        RT_READING('nde-ut-presentation', 'مرجع قراءة داعم لعرض البيانات المتقدمة.', 'Supporting reading for advanced data presentation.'),
        NORM_PENDING('ASME Section V / ISO 13588 / ISO 19285 (verify editions and scope)', 'مراجع محتملة حسب التقنية؛ يجب التحقق من الإصدار والنطاق والتطبيق قبل الاستشهاد.', 'Potential references depending on technique; verify edition, scope and applicability before citation.'),
      ],
      governance: UT_GOV,
      curriculum: { disciplineId: 'ndt_advanced', levelId: 'level1', moduleId: 'mod_adv_ut' },
      textbook: { bookId: 'book-paut-tofd', pageNumber: 1 },
    },
  ],
  standards: ['ASME Sec V Art. 4', 'ASME Sec VIII Div. 1', 'AWS D1.1', 'ISO 17640'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/Ultrasonics/index.xhtml',
  limits: t(
    'المقرر لا يمنح تأهيل UT ولا يحدد حدود قبول. القيم والمعايرة والزوايا والمقارنة بـDAC تخضع لإجراء معتمد ومواصفة العقد ونسخة الكود. النسخة الحالية للمراجعة التعليمية وتحتاج مراجعة فنية Level III قبل اعتمادها مرجعاً نهائياً.',
    'The course does not qualify a UT inspector or set acceptance limits. Values, calibration, angles and DAC comparison follow an approved procedure, contract specification and code edition. The current version is for educational review and requires Level III technical review before authoritative publication.'
  ),
};
