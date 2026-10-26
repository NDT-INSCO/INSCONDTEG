import { NdeEdCourse } from './types';
import { quiz, t } from './helpers';

export const rtCourse: NdeEdCourse = {
  id: 'nde-rt',
  disciplineId: 'conventional_ndt',
  code: 'RT',
  level: 'level1',
  accent: '#a78bfa',
  title: t('التصوير الإشعاعي الصناعي (RT)', 'Industrial Radiographic Testing (RT)'),
  subtitle: t('المصادر، التوهين، الفيلم، الجودة، التفسير، والسلامة', 'Sources, attenuation, film, quality, interpretation and safety'),
  description: t(
    'مقرر RT يغطي فيزياء الفوتونات ومصادر الإشعاع والفيلم والتصوير الرقمي وحسابات التعرض ومؤشرات الجودة وتفسير صور اللحام، مع فصل واضح بين حدود الطريقة ومتطلبات السلامة. هيكل الموضوعات متتبع لـnde-ed.org.',
    'An RT course covering photon physics, sources, film and digital imaging, exposure calculations, image quality indicators and weld interpretation, with clear separation of method limits and safety requirements. Topic structure follows nde-ed.org.'
  ),
  prerequisites: t('إكمال phy-radiation، وأساسيات اللوغاريتمات.', 'Complete phy-radiation and basic logarithms.'),
  outcomes: [
    t('تفسير التوهين واختيار مصدر مناسب لسماكة.', 'Explain attenuation and select a source for a thickness.'),
    t('ضبط التعرض وكثافة الفيلم وقراءة منحنى الخصائص.', 'Control exposure and film density and read a characteristic curve.'),
    t('استخدام IQI وتقييم جودة الصورة.', 'Use IQIs and assess image quality.'),
    t('تمييز عيوب اللحام من آرتيفاكت الصورة.', 'Distinguish weld flaws from image artefacts.'),
    t('تطبيق مبادئ الوقت والمسافة والتدريع.', 'Apply time, distance and shielding principles.'),
  ],
  lessons: [
    {
      id: 'rt-physics',
      title: t('مصادر الإشعاع والتفاعل والتوهين', 'Radiation sources, interaction and attenuation'),
      summary: t('لماذا تخترق أشعة إكس الفولاذ ولا تخترق الرصاص بنفس السهولة؟', 'Why X-rays cross steel more easily than lead.'),
      minutes: 22,
      objectives: [
        t('مقارنة أنبوب الأشعة والنظير المشع.', 'Compare an X-ray tube with a radioisotope.'),
        t('شرح التفاعلات الثلاثة الرئيسية.', 'Explain the three main interactions.'),
        t('تطبيق قانون التوهين وHVL.', 'Apply the attenuation law and HVL.'),
      ],
      sections: [
        {
          heading: t('المصادر', 'Sources'),
          body: t(
            'أنبوب الأشعة السينية يولد طيفاً قابلاً للضبط بالجهد والتيار. النظائر المشعة تصدر طاقات محددة: Ir-192 وCo-60 وSe-75 أمثلة شائعة، ولكل منها نطاق سماكة مناسب. اختيار المصدر يوازن بين الاختراق والتباين وزمن التعرض. المصادر المغلقة تحتاج تصريحاً وضوابط خاصة.',
            'An X-ray tube produces an adjustable spectrum via voltage and current. Radioisotopes emit discrete energies: Ir-192, Co-60 and Se-75 are common, each with a suitable thickness range. Source selection balances penetration, contrast and exposure time. Sealed sources require authorisation and specific controls.'
          ),
        },
        {
          heading: t('التفاعل', 'Interaction'),
          body: t(
            'في نطاق RT الصناعي يهيمن الامتصاص الكهروضوئي عند الطاقات المنخفضة، واستطارة كومبتون عند المتوسطة والعالية، وقد يحدث إنتاج أزواج فوق 1.022 MeV. الامتصاص يزيد مع العدد الذري والكثافة؛ لذلك يظهر الفولاذ أكثف من البلاستيك بنفس السمك. الاستطارة تقلل التباين وتحتاج تدريعاً وتقييداً.',
            'In industrial RT, photoelectric absorption dominates at low energy, Compton scattering at medium/high energy, and pair production can occur above 1.022 MeV. Absorption rises with atomic number and density, so steel appears denser than plastic at equal thickness. Scatter reduces contrast and needs shielding and collimation.'
          ),
        },
        {
          heading: t('التوهين', 'Attenuation'),
          body: t(
            'I = I0 e^(−μx) للشعاع أحادي الطاقة، وHVL = ln2/μ. القيم الفعلية تعتمد على الطيف والسمك والهندسة؛ لذلك تُستخدم بيانات الكود والجداول المعتمدة. لا تستخدم HVL واحداً لكل الطاقات. الفوتونات المتناثرة قد تصل إلى الكاشف وتقلل التباين.',
            'I = I0 e^(−μx) for monoenergetic radiation, and HVL = ln2/μ. Real values depend on spectrum, thickness and geometry, so code data and approved tables are used. Do not apply one HVL to every energy. Scattered photons can reach the detector and reduce contrast.'
          ),
        },
      ],
      workedExample: {
        prompt: t('HVL = 6 mm، ما نسبة الشدة بعد 18 mm؟', 'HVL = 6 mm; what intensity fraction remains after 18 mm?'),
        solution: t('18/6 = 3 طبقات نصف، فتبقى (1/2)^3 = 1/8. هذا تقدير لشعاع أحادي الطاقة؛ الطيف الواقعي يعقّد الحساب.', '18/6 = 3 half-value layers, leaving (1/2)^3 = 1/8. This assumes monoenergetic radiation; a real spectrum complicates the calculation.'),
      },
      exercise: {
        prompt: t('بنفس HVL، ما النسبة بعد 24 mm؟', 'With the same HVL, what fraction remains after 24 mm?'),
        hint: t('24/6 = 4.', '24/6 = 4.'),
        answer: t('(1/2)^4 = 1/16 من الشدة الأصلية.', '(1/2)^4 = 1/16 of the original intensity.'),
      },
      quiz: quiz(
        'rt-physics-q1',
        'لماذا يزيد الامتصاص الكهروضوئي في المواد ذات العدد الذري الأعلى؟',
        'Why is photoelectric absorption stronger in higher-atomic-number materials?',
        [
          ['لأنها أخف', 'Because they are lighter'],
          ['لأن احتمال التفاعل يرتفع مع Z والكثافة', 'Because interaction probability rises with Z and density'],
          ['لأنها لا تنتج استطارة', 'Because they produce no scatter'],
          ['لأن طاقتها أقل دائماً', 'Because their energy is always lower'],
        ],
        1,
        'الامتصاص الكهروضوئي يعتمد بقوة على العدد الذري والكثافة، ما يزيد التباين في المعادن الثقيلة.',
        'Photoelectric absorption depends strongly on atomic number and density, increasing contrast in heavy metals.'
      ),
      sources: ['nde-xray', 'nde-rt-interaction', 'nde-rt-penetration', 'nde-rt-sources'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_rt' },
      textbook: { bookId: 'book-rt', pageNumber: 1 },
      labId: 'rt_illuminator',
    },
    {
      id: 'rt-imaging',
      title: t('الفيلم والكثافة والتباين والتصوير الرقمي', 'Film, density, contrast and digital imaging'),
      summary: t('كيف تتحول الفوتونات إلى صورة قابلة للتفسير؟', 'How photons become an interpretable image.'),
      minutes: 22,
      objectives: [
        t('شرح بنية الفيلم وتكوين الصورة.', 'Explain film structure and image formation.'),
        t('قراءة منحنى الخصائص وكثافة الفيلم.', 'Read a characteristic curve and film density.'),
        t('مقارنة CR/DR بالفيلم.', 'Compare CR/DR with film.'),
      ],
      sections: [
        {
          heading: t('الفيلم', 'Film'),
          body: t(
            'يتكون الفيلم من قاعدة وطبقة مستحلب تحتوي حبيبات هاليد الفضة. الفوتونات أو الضوء المنبعث من الشاشة المكثفة يحوّل بعض الحبيبات إلى صورة كامنة، تتحول إلى فضة معدنية عند التحميض. المناطق الأكثر تعرضاً تصبح أغمق؛ لذلك يُعكس تفسير «الداكن» عند قراءة العيب.',
            'Film has a base and an emulsion with silver halide grains. Photons or light from an intensifying screen form a latent image, converted to metallic silver during development. More exposed areas become darker; this reverses the intuitive reading of a dark indication.'
          ),
        },
        {
          heading: t('الكثافة والتباين', 'Density and contrast'),
          body: t(
            'الكثافة البصرية D = log10(I0/I). التباين هو فرق الكثافة بين منطقتين. منحنى الخصائص يربط التعرض بالكثافة ويظهر منطقة الخطية والتشبع. زيادة التعرض قد ترفع الكثافة لكنها لا تزيد التباين دائماً؛ التباين يعتمد أيضاً على طاقة الإشعاع والسمك والاستطارة.',
            'Optical density D = log10(I0/I). Contrast is the density difference between two areas. The characteristic curve links exposure to density and shows the linear and saturation regions. More exposure may raise density but not always contrast; contrast also depends on radiation energy, thickness and scatter.'
          ),
        },
        {
          heading: t('CR وDR', 'CR and DR'),
          body: t(
            'التصوير المحوسب يستخدم صفيحة فوسفورية تُقرأ بالليزر، والرقمي المباشر يستخدم كاشفاً إلكترونياً. كلاهما يسمح بمعالجة وعرض أسرع ونطاق ديناميكي أوسع، لكنه يحتاج معايرة وجودة صورة وتوثيقاً. المعالجة الرقمية قد تخفي عيباً أو تخلق آرتيفاكت؛ لا تعدل الصورة بما يغير الدلالة.',
            'Computed radiography uses a photostimulable plate read by laser; direct digital radiography uses an electronic detector. Both allow faster processing and display with wider dynamic range, but need calibration, image-quality checks and records. Digital processing can hide a flaw or create artefacts; do not alter an image in a way that changes the indication.'
          ),
        },
      ],
      workedExample: {
        prompt: t('كثافة 2.0 و2.6 في منطقتين. ما فرق الكثافة؟', 'Densities of 2.0 and 2.6 in two areas. What is the density difference?'),
        solution: t('ΔD = 0.6. الكثافة ليست خطية مع التعرض في كل النطاق؛ يجب البقاء في منطقة منحنى الخصائص المناسبة للقراءة.', 'ΔD = 0.6. Density is not linear with exposure across the whole range; stay in the suitable region of the characteristic curve.'),
      },
      exercise: {
        prompt: t('إذا زادت الكثافة من 2.2 إلى 2.8، ما الفرق؟', 'If density rises from 2.2 to 2.8, what is the difference?'),
        hint: t('اطرح القيمتين.', 'Subtract the two values.'),
        answer: t('ΔD = 0.6.', 'ΔD = 0.6.'),
      },
      quiz: quiz(
        'rt-imaging-q1',
        'ماذا يعني منحنى خصائص الفيلم؟',
        'What does a film characteristic curve describe?',
        [
          ['علاقة التعرض بالكثافة البصرية', 'The relationship between exposure and optical density'],
          ['علاقة السمك بالسرعة', 'Thickness versus velocity'],
          ['علاقة الجهد بالتيار', 'Voltage versus current'],
          ['علاقة التردد بالطول الموجي', 'Frequency versus wavelength'],
        ],
        0,
        'المنحنى يعرض استجابة الفيلم للتعرض ويساعد في اختيار الكثافة والتباين.',
        'The curve shows film response to exposure and guides density and contrast selection.'
      ),
      sources: ['nde-rt-film', 'nde-rt-density', 'nde-rt-curves', 'nde-rt-contrast'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-rt', pageNumber: 2 },
    },
    {
      id: 'rt-technique',
      title: t('التعرض وهندسة التصوير وجودة الصورة', 'Exposure, geometry and image quality'),
      summary: t('كيف تختار المسافة والزمن والـIQI؟', 'How to choose distance, time and the IQI.'),
      minutes: 24,
      objectives: [
        t('تطبيق قانون التربيع العكسي على زمن التعرض.', 'Apply the inverse-square law to exposure time.'),
        t('شرح تأثير الحجم البؤري والمسافة على الحدّة.', 'Explain focal spot and distance effects on sharpness.'),
        t('اختيار IQI وتقييم الجودة.', 'Select an IQI and assess quality.'),
      ],
      sections: [
        {
          heading: t('الهندسة', 'Geometry'),
          body: t(
            'المسافة بين المصدر والقطعة والكاشف تحدد التكبير والحدّة. الحجم البؤري الصغير يحسن الحدّة، لكنه يقلل الشدة المتاحة. يجب أن يكون المصدر والقطعة والكاشف في ترتيب مناسب، وأن يقلل التكبير والانحراف قدر الإمكان. التشوه الهندسي قد يوحي بعيب غير موجود.',
            'Source-to-object and object-to-detector distances set magnification and sharpness. A small focal spot improves sharpness but reduces available intensity. Source, object and detector must be arranged appropriately, minimising magnification and distortion. Geometric distortion can mimic a flaw.'
          ),
        },
        {
          heading: t('التعرض والمسافة', 'Exposure and distance'),
          body: t(
            'الشدة تتناسب مع 1/r²، لذا للحفاظ على التعرض عند مضاعفة المسافة يلزم زمن أكبر أربع مرات. التعرض الفعلي يعتمد أيضاً على التيار والجهد والفيلم والتدريع. استخدم مخطط التعرض المعتمد أو حسابات الإجراء، وتحقق بالكثافة المقاسة.',
            'Intensity follows 1/r², so doubling distance requires four times the time to maintain exposure. Actual exposure also depends on current, voltage, film and filtration. Use the approved exposure chart or procedure calculation and verify with measured density.'
          ),
        },
        {
          heading: t('مؤشرات جودة الصورة', 'Image quality indicators'),
          body: t(
            'تُستخدم أسلاك أو ألواح IQI لقياس حساسية التقنية. موضع المؤشر واتجاهه مهمان، ويجب أن يظهر السلك المطلوب أو الثقب المطلوب وفق المعيار. قلة التعرض أو الاستطارة أو سوء الهندسة تظهر كفقدان في الجودة. لا تعتمد على «صورة جميلة» بدلاً من مؤشر قابل للقياس.',
            'Wire or plaque IQIs measure technique sensitivity. Their position and orientation matter, and the required wire or hole must be visible per the standard. Under-exposure, scatter or poor geometry show as lost quality. Do not substitute a “nice image” for a measurable indicator.'
          ),
        },
      ],
      workedExample: {
        prompt: t('المسافة من 700 mm إلى 1000 mm. كم يزيد زمن التعرض تقريباً؟', 'Distance changes from 700 mm to 1000 mm. How much must exposure time increase?'),
        solution: t('(1000/700)² ≈ 2.04، أي نحو ضعف الزمن للحفاظ على نفس التعرض. تحقق بالكثافة المقاسة ولا تفترض تساوي الشدة.', '(1000/700)² ≈ 2.04, about double the time to maintain exposure. Verify with measured density; do not assume equal intensity.'),
      },
      exercise: {
        prompt: t('إذا تضاعفت المسافة، كيف يتغير الزمن؟', 'If distance doubles, how does time change?'),
        hint: t('1/r².', '1/r².'),
        answer: t('يزيد أربع مرات للحفاظ على نفس الشدة عند الكاشف.', 'It becomes four times longer to keep the same detector intensity.'),
      },
      quiz: quiz(
        'rt-technique-q1',
        'ما الهدف من IQI؟',
        'What is the purpose of an IQI?',
        [
          ['قياس سمك المادة', 'Measure material thickness'],
          ['التحقق من حساسية جودة الصورة', 'Verify image-quality sensitivity'],
          ['تحديد نوع النظير', 'Identify the isotope'],
          ['قياس الجرعة', 'Measure dose'],
        ],
        1,
        'IQI مؤشر قابل للقياس على جودة التقنية وحساسية الصورة، وليس مقياس سمك.',
        'An IQI is a measurable indicator of technique and image sensitivity, not a thickness gauge.'
      ),
      sources: ['nde-rt-exposure', 'nde-rt-quality', 'nde-rt-curves', 'nde-rt-sources'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-rt', pageNumber: 3 },
      labId: 'rt_illuminator',
    },
    {
      id: 'rt-interpretation',
      title: t('تفسير صور اللحام والآرتيفاكت', 'Weld radiograph interpretation and artefacts'),
      summary: t('كيف تميز المسامية من الخبث من الشرخ؟', 'How to tell porosity from slag from a crack.'),
      minutes: 24,
      objectives: [
        t('ربط شكل الدلالة بنوع العيب المحتمل.', 'Relate indication shape to likely flaw type.'),
        t('تمييز آرتيفاكت الفيلم والمعالجة.', 'Recognise film and processing artefacts.'),
        t('تسجيل الموقع والمقاس والمرجع.', 'Record location, size and reference.'),
      ],
      sections: [
        {
          heading: t('العيوب الشائعة', 'Common flaws'),
          body: t(
            'المسامية تظهر كدوائر داكنة متفرقة أو تجمعات. الخبث يظهر كخط داكن غير منتظم متقطع. عدم الانصهار يظهر كخط داكن حاد بطول الوصلة. الشروخ قد تكون خطوطاً دقيقة متعرجة، وقد تحتاج زاوية أو طريقة أخرى لتأكيدها. التنغستن يظهر كبقع فاتحة شديدة الامتصاص.',
            'Porosity appears as scattered dark rounded spots or clusters. Slag appears as irregular, interrupted dark lines. Lack of fusion appears as a sharp dark line along the joint. Cracks may be fine irregular lines and may need another angle or method to confirm. Tungsten appears as bright, highly absorbing spots.'
          ),
        },
        {
          heading: t('الآرتيفاكت', 'Artefacts'),
          body: t(
            'قد تنتج الخطوط من خدوش الفيلم أو المعالجة أو الشاشة أو الاستطارة. البقع قد تكون من غبار أو قطرات. الحواف الداكنة قد تكون أثراً هندسياً. لا تفسر صورة واحدة دون التحقق من الإعداد والفيلم والمعالجة والمقارنة مع صور مرجعية.',
            'Lines may come from film scratches, processing, screens or scatter. Spots may be dust or drips. Dark edges may be geometric effects. Do not interpret a single image without checking setup, film, processing and comparison with reference images.'
          ),
        },
        {
          heading: t('التسجيل', 'Recording'),
          body: t(
            'سجل رقم الصورة والقطعة والموقع والاتجاه والمصدر والمسافة والزمن والكثافة وIQI والتاريخ والمفسر. استخدم رسماً أو صورة مرجعية لتحديد الموقع بدقة. القبول والرفض يعودان إلى معيار الكود والخدمة، وليس إلى مظهر الصورة وحده.',
            'Record image number, part, location, direction, source, distance, time, density, IQI, date and interpreter. Use a drawing or reference image to locate the indication precisely. Acceptance and rejection follow the code criterion and service, not appearance alone.'
          ),
        },
      ],
      workedExample: {
        prompt: t('خط داكن حاد بطول الوصلة في صورة لحام تناكبي. ما الاحتمال؟', 'A sharp dark line along a butt weld in a radiograph. What is likely?'),
        solution: t('قد يكون عدم انصهار أو شرخاً. تحقق من الاتجاه والامتداد والزوايا الأخرى، واستخدم UT أو MT/PT للتأكيد حسب المادة والموقع. لا تعلن الرفض من الصورة وحدها؛ اربطها بالمعيار والفحص المكمل.', 'It may be lack of fusion or a crack. Check orientation, extent and other angles, and use UT or MT/PT for confirmation as appropriate. Do not reject from the image alone; link it to the criterion and complementary examination.'),
      },
      exercise: {
        prompt: t('كيف يظهر الخبث عادة في الصورة؟', 'How does slag typically appear?'),
        hint: t('خط داكن غير منتظم، وليس دوائر منتظمة.', 'Irregular dark line, not regular circles.'),
        answer: t('خط داكن غير منتظم/متقطع، بخلاف المسامية الدائرية والشق الحاد.', 'An irregular/interrupted dark line, unlike rounded porosity or a sharp crack.'),
      },
      quiz: quiz(
        'rt-interpretation-q1',
        'أي دلالة تظهر كدوائر داكنة متفرقة؟',
        'Which indication appears as scattered dark rounded spots?',
        [
          ['الخبث', 'Slag'],
          ['المسامية', 'Porosity'],
          ['عدم الانصهار', 'Lack of fusion'],
          ['التنغستن', 'Tungsten'],
        ],
        1,
        'الغاز المحبوس ينتج تجاويف كروية تظهر كدوائر داكنة في الصورة.',
        'Trapped gas forms rounded cavities that appear as dark circles.'
      ),
      sources: ['nde-rt-interp', 'nde-rt-quality', 'nde-rt-contrast'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-rt', pageNumber: 4 },
    },
    {
      id: 'rt-safety',
      title: t('السلامة الإشعاعية وإدارة الموقع', 'Radiation safety and site control'),
      summary: t('الوقت والمسافة والتدريع ليست شعارات.', 'Time, distance and shielding are not slogans.'),
      minutes: 20,
      objectives: [
        t('تطبيق مبادئ ALARA والوقت والمسافة والتدريع.', 'Apply ALARA, time, distance and shielding.'),
        t('شرح وظيفة أجهزة المسح والجرعات.', 'Explain survey meters and dosimeters.'),
        t('تحديد عناصر السيطرة على الموقع.', 'Identify site-control elements.'),
      ],
      sections: [
        {
          heading: t('المبادئ', 'Principles'),
          body: t(
            'قلل زمن التعرض، زد المسافة، واستخدم التدريع المناسب. الشدة تتناسب مع 1/r²، والتدريع يقلل الشدة حسب المادة والطاقة. تُحدد حدود المنطقة المحظورة بواسطة شخص مؤهل وأجهزة معايرة، لا بالتقدير. لا تفترض أن جداراً عادياً يحقق التدريع المطلوب.',
            'Reduce exposure time, increase distance and use suitable shielding. Intensity follows 1/r², and shielding attenuates according to material and energy. Controlled-area boundaries are set by a qualified person using calibrated instruments, not estimation. Do not assume an ordinary wall provides the required shielding.'
          ),
        },
        {
          heading: t('القياس والمراقبة', 'Measurement and monitoring'),
          body: t(
            'مقاييس المعدل (survey meters) تقيس شدة الإشعاع في الموقع، ومقاييس الجرعة الشخصية تسجل التعرض الفردي. يجب التحقق من معايرة الأجهزة واستجابة الطاقة، واستخدام مقياس مناسب للنطاق. السجلات والتصاريح والمراقبة جزء من العمل، لا إجراء شكلي.',
            'Survey meters measure site dose rate; personal dosimeters record individual exposure. Verify calibration and energy response and use an instrument suited to the range. Records, permits and monitoring are part of the job, not paperwork.'
          ),
        },
        {
          heading: t('السيطرة على الموقع', 'Site control'),
          body: t(
            'تشمل الحواجز واللافتات والتحكم في الدخول والاتصال والتنسيق مع الآخرين. المصدر المفتوح يحتاج إجراءات خاصة، والمصدر المغلق يحتاج التأكد من إعادته إلى الحاوية بعد العمل. لا تترك مصدراً دون تأمين أو تبدأ عملاً دون تصريح.',
            'Controls include barriers, signs, access control, communication and coordination with others. Open sources need special procedures; sealed sources must be confirmed back in their shielded container after work. Never leave a source unsecured or start without authorisation.'
          ),
        },
      ],
      workedExample: {
        prompt: t('معدل الجرعة 40 µSv/h على متر. ما القيمة على مترين (مع تجاهل التدريع)؟', 'A dose rate of 40 µSv/h at one metre. What is it at two metres, ignoring shielding?'),
        solution: t('1/r² يقلل المعدل إلى الربع: 10 µSv/h. على 4 أمتار يصبح 2.5 µSv/h. القياس الفعلي قد يختلف بسبب الاستطارة والتدريع.', '1/r² reduces it to one quarter: 10 µSv/h. At 4 m it becomes 2.5 µSv/h. Actual readings may differ due to scatter and shielding.'),
      },
      exercise: {
        prompt: t('إذا كان المعدل 80 µSv/h على متر، فما المتوقع على 4 أمتار؟', 'If the rate is 80 µSv/h at one metre, what is expected at 4 m?'),
        hint: t('المسافة تضاعفت مرتين، أي 1/16.', 'Distance increased twice, so 1/16.'),
        answer: t('80/16 = 5 µSv/h تقريباً.', '80/16 = 5 µSv/h approximately.'),
      },
      quiz: quiz(
        'rt-safety-q1',
        'ما الأنسب عند الحاجة لتقليل الجرعة في موقع تصوير؟',
        'What is most appropriate to reduce dose at a radiographic site?',
        [
          ['زيادة زمن التعرض', 'Increase exposure time'],
          ['الاعتماد على المسافة والتدريع وتقليل الزمن', 'Use distance, shielding and reduced time'],
          ['إزالة الحواجز لتسهيل الحركة', 'Remove barriers for movement'],
          ['إيقاف أجهزة المسح', 'Switch off survey meters'],
        ],
        1,
        'الوقت والمسافة والتدريع هي ضوابط الجرعة الأساسية، مع القياس والمراقبة.',
        'Time, distance and shielding are the core dose controls, supported by measurement and monitoring.'
      ),
      sources: ['nde-rt-safety', 'nde-xray', 'nde-rt-penetration'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-rt', pageNumber: 5 },
      labId: 'rt_illuminator',
    },
  ],
  standards: ['ASME Sec V Art. 2', 'ASTM E94 / E1742', 'ISO 17636'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/Radiography/index.xhtml',
  limits: t(
    'المقرر لا يؤهل مشغّل تصوير إشعاعي ولا يحدد حدود جرعة أو تدريع ملزمة. العمل الميداني يتطلب ترخيصاً وتدريباً وإشرافاً وفق اللوائح المحلية.',
    'The course does not qualify a radiographer or set binding dose or shielding limits. Field work requires licensing, training and supervision under local regulations.'
  ),
};
