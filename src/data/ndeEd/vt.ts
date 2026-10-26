import { NdeEdCourse } from './types';
import { quiz, t } from './helpers';

export const vtCourse: NdeEdCourse = {
  id: 'nde-vt',
  disciplineId: 'conventional_ndt',
  code: 'VT',
  level: 'foundation',
  accent: '#38bdf8',
  title: t('الفحص البصري الهندسي (VT)', 'Engineering Visual Testing (VT)'),
  subtitle: t('الإبصار، التباين، هندسة الوصلة، الإضاءة، والتوثيق', 'Vision, contrast, weld geometry, lighting and records'),
  description: t(
    'مقرر عملي في الفحص البصري: كيف ترى التفصيل، وكيف تقيس هندسة الوصلة، وكيف توثق النتيجة. ملاحظة إسناد: موقع nde-ed.org لا يضم وحدة VT منفصلة؛ استُخدمت صفحاته عن حدّة الإبصار والتباين والإضاءة، وأُكملت هندسة الوصلات من المنهج الأصلي لإنسكو.',
    'A practical visual testing course: how detail is seen, how weld geometry is measured and how results are recorded. Attribution note: nde-ed.org has no separate VT technique module; its visual-acuity, contrast and lighting pages are used, with weld geometry from INSCO’s own curriculum.'
  ),
  prerequisites: t('أساسيات القياس والوحدات. يُفضل مراجعة درس هندسة الوصلة في الكتب الدراسية.', 'Measurement and units basics. Reviewing the weld-geometry textbook page is recommended.'),
  outcomes: [
    t('شرح أثر حدّة الإبصار والتباين والإضاءة على القدرة على الكشف.', 'Explain how visual acuity, contrast and lighting affect detection.'),
    t('قياس هندسة الوصلة وتحديد مواضع القياس.', 'Measure weld geometry and locate measurement points.'),
    t('اختيار ظروف مشاهدة مناسبة وتوثيقها.', 'Select and document suitable viewing conditions.'),
    t('تسجيل دلالة بصرية مع الموقع والمقاس والمرجع.', 'Record a visual indication with location, size and reference.'),
  ],
  lessons: [
    {
      id: 'vt-perception',
      title: t('الإبصار: الحدّة والتباين والتكيف', 'Vision: acuity, contrast and adaptation'),
      summary: t('العين أداة قياس؛ ما حدودها وكيف نضبطها؟', 'The eye is a measurement instrument: what are its limits and how are they controlled?'),
      minutes: 18,
      objectives: [
        t('التمييز بين حدّة الإبصار وحساسية التباين.', 'Distinguish visual acuity from contrast sensitivity.'),
        t('شرح أثر الإضاءة والتكيف على الكشف.', 'Explain the effect of lighting and adaptation on detection.'),
        t('تحديد فحص الرؤية المطلوب قبل العمل.', 'Identify the vision check required before work.'),
      ],
      sections: [
        {
          heading: t('حدّة الإبصار', 'Visual acuity'),
          body: t(
            'حدّة الإبصار هي قدرة العين على تمييز تفصيل صغير عند مسافة معينة. تُقاس غالباً بلوحات مثل Snellen أو Jaeger، وتُحدد متطلباتها في نظام التأهيل والكود. الحدّة الجيدة لا تعني بالضرورة رؤية عيب منخفض التباين؛ فالتفصيل الصغير يحتاج تبايناً كافياً.',
            'Visual acuity is the eye’s ability to resolve small detail at a given distance, commonly tested with Snellen or Jaeger charts and specified by the qualification scheme and code. Good acuity does not guarantee seeing a low-contrast flaw; small detail also needs sufficient contrast.'
          ),
        },
        {
          heading: t('حساسية التباين والتكيف', 'Contrast sensitivity and adaptation'),
          body: t(
            'يحدد التباين بين العيب والخلفية إمكانية رؤيته. الانتقال من ضوء ساطع إلى منطقة مظلمة يحتاج وقت تكيف، والعكس كذلك. الإبهار والانعكاسات تخفضان التباين الفعلي. لذلك تُضبط الإضاءة وتُمنع المصادر المباشرة في مجال الرؤية، ولا يُسمح بالفحص أثناء التكيف غير المكتمل.',
            'The contrast between flaw and background determines visibility. Moving from bright light to a dark area requires adaptation time, and vice versa. Glare and reflections reduce effective contrast. Lighting is therefore controlled and direct sources are kept out of the field of view; inspection during incomplete adaptation is not acceptable.'
          ),
        },
        {
          heading: t('حدود العين', 'Limits of the eye'),
          body: t(
            'لا يمكن للعين قياس أبعاد دقيقة دون أداة، ولا تمييز عيب تحت طبقة طلاء أو داخل معدن. بعض العيوب الخطية تُرى بزاوية أفضل من الأخرى. استخدم عدسة أو مقياساً مناسباً ووثّق التكبير ومسافة المشاهدة بدلاً من الاعتماد على الانطباع.',
            'The eye cannot measure dimensions precisely without a tool, nor see a flaw beneath coating or inside metal. Some linear flaws are seen better from one angle. Use an appropriate lens or gauge and record magnification and viewing distance rather than relying on impression.'
          ),
        },
      ],
      workedExample: {
        prompt: t('فاحص ينتقل من الخارج نهاراً إلى خزان مظلم ويبدأ فوراً. ما الخطر؟', 'An inspector moves from daylight into a dark tank and starts immediately. What is the risk?'),
        solution: t('لم يكتمل تكيف العين مع الظلام، فتنخفض حساسية التباين وتُفوت عيوب خفيفة. يلزم انتظار زمن تكيف مناسب، وضبط الإضاءة، والتحقق من الرؤية وفق الإجراء.', 'The eye has not adapted to darkness, so contrast sensitivity is reduced and faint flaws may be missed. Allow suitable adaptation time, set the lighting and verify vision per the procedure.'),
      },
      exercise: {
        prompt: t('اذكر عاملين غير حدّة الإبصار يؤثران على رؤية عيب بصري.', 'Name two factors other than visual acuity that affect seeing a visual flaw.'),
        hint: t('فكر في الإضاءة والتباين والزاوية والمسافة.', 'Think about lighting, contrast, angle and distance.'),
        answer: t('أي عاملين من: التباين، مستوى الإضاءة، الإبهار، زاوية المشاهدة، المسافة، التكبير، تكيف العين، نظافة السطح.', 'Any two of: contrast, illumination level, glare, viewing angle, distance, magnification, eye adaptation, surface cleanliness.'),
      },
      quiz: quiz(
        'vt-perception-q1',
        'لماذا لا تكفي حدّة إبصار جيدة وحدها لضمان كشف عيب بصري؟',
        'Why is good visual acuity alone not enough to guarantee visual flaw detection?',
        [
          ['لأن العين لا ترى الألوان', 'Because the eye cannot see colour'],
          ['لأن التباين والإضاءة وزاوية المشاهدة تحدد الرؤية أيضاً', 'Because contrast, lighting and viewing angle also determine visibility'],
          ['لأن العدسات تمنع الرؤية', 'Because lenses block vision'],
          ['لأن العيب دائماً داخلي', 'Because the flaw is always internal'],
        ],
        1,
        'القدرة على تمييز تفصيل لا تعني رؤيته عند تباين منخفض أو إضاءة غير مناسبة.',
        'Resolving detail does not mean seeing it under low contrast or unsuitable lighting.'
      ),
      sources: ['nde-visual-acuity', 'nde-contrast', 'nde-light-response'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_vt' },
      textbook: { bookId: 'book-vt', pageNumber: 1 },
    },
    {
      id: 'vt-weld-geometry',
      title: t('قياس هندسة الوصلة اللحامية', 'Measuring weld joint geometry'),
      summary: t('من أين تقيس ارتفاع التاج، والإزاحة، والتأكل الحافي؟', 'Where to measure cap height, Hi-Lo and undercut.'),
      minutes: 22,
      objectives: [
        t('تعريف عناصر مقطع اللحام ومواضع القياس.', 'Define weld cross-section features and measurement locations.'),
        t('استخدام مقياس اللحام المناسب لكل قياس.', 'Use the appropriate weld gauge for each measurement.'),
        t('ربط القياس ببند القبول دون إصدار حكم من رقم منفرد.', 'Relate measurements to acceptance clauses without judging from a single number.'),
      ],
      sections: [
        {
          heading: t('عناصر المقطع', 'Cross-section features'),
          body: t(
            'يتكون مقطع الوصلة من التاج والجذر والجانبين ومنطقة التأثير الحراري. يقاس ارتفاع التاج (cap height) وعرضه، والتأكل الحافي (undercut) وعمقه، والإزاحة (Hi-Lo) بين سطحين متقابلين، وزاوية إصبع القدم (toe angle). لكل بند تعريف وحدود في الكود المطبق، وقد تختلف بين الخدمات.',
            'A weld cross-section includes cap, root, flanks and heat-affected zone. Measure cap height and width, undercut depth, Hi-Lo offset between mating surfaces and toe angle. Each feature has a code definition and limits that can differ by service.'
          ),
        },
        {
          heading: t('الأدوات والطريقة', 'Tools and method'),
          body: t(
            'تُستخدم مقاييس مثل Cambridge gauge وHi-Lo gauge ومقياس عمق وفرجار. ثبّت المرجع على السطح الصحيح، واقرأ القيمة على المحور الصحيح، وسجل الوحدة. قِس في مواضع ممثلة وحدد أسوأ حالة بدلاً من متوسط يخفي موضعاً حرجاً. تحقق من معايرة الأداة وحالتها.',
            'Tools include Cambridge and Hi-Lo gauges, depth gauges and calipers. Datum the gauge on the correct surface, read the correct scale and record units. Measure representative locations and identify the worst case rather than an average that hides a critical point. Check tool condition and calibration.'
          ),
        },
        {
          heading: t('القبول ليس رقماً واحداً', 'Acceptance is not one number'),
          body: t(
            'قد يسمح الكود بتأكل حافي محدود الطول والعمق، أو يرفض أي إزاحة تتجاوز حداً محدداً. يجب معرفة نوع الوصلة والخدمة والإصدار. القياس الصحيح لا يعني القبول؛ إنما يغذي قراراً وفق معيار محدد وموقع محدد. وثّق المرجع والبند والنسخة.',
            'A code may allow limited undercut length and depth, or reject any offset beyond a stated limit. The joint type, service and edition must be known. A correct measurement does not mean acceptance; it feeds a decision against a specific criterion and location. Record the reference, clause and edition.'
          ),
        },
      ],
      workedExample: {
        prompt: t('وصلة تناكبية بسماكة 12 mm، قياس Hi-Lo = 1.8 mm. هل تُقبل؟', 'A 12 mm butt joint has a Hi-Lo reading of 1.8 mm. Is it accepted?'),
        solution: t('لا يمكن الحكم من الرقم وحده. يلزم بند الكود ونوع الخدمة والسماكة وطول الإزاحة. اذكر ذلك في التقرير واطلب المرجع المطبق؛ لا تعلن قبولاً أو رفضاً من قراءة معزولة.', 'The number alone is insufficient. The code clause, service, thickness and extent are required. State this in the report and request the applicable reference; do not declare acceptance or rejection from an isolated reading.'),
      },
      exercise: {
        prompt: t('اذكر ثلاثة عناصر هندسية تقاس في وصلة تناكبية.', 'Name three geometric features measured on a butt weld.'),
        hint: t('فكر في التاج، الإزاحة، والتأكل الحافي.', 'Think cap, offset and undercut.'),
        answer: t('مثل: ارتفاع التاج، عرض التاج، Hi-Lo، عمق/طول التأكل الحافي، زاوية toe، ارتفاع التقعر.', 'For example: cap height, cap width, Hi-Lo, undercut depth/length, toe angle, concavity.'),
      },
      quiz: quiz(
        'vt-weld-geometry-q1',
        'ما الذي يجب فعله قبل إصدار حكم قبول على قياس هندسي؟',
        'What must be done before issuing an acceptance decision on a geometry reading?',
        [
          ['مقارنة الرقم بمتوسط الأمثلة', 'Compare the number with the average of examples'],
          ['الرجوع إلى بند الكود المطبق ونوع الخدمة والإصدار', 'Refer to the applicable code clause, service and edition'],
          ['استخدام أكبر أداة متاحة', 'Use the largest available tool'],
          ['الاعتماد على رأي الفاحص فقط', 'Rely only on inspector opinion'],
        ],
        1,
        'القبول يعتمد على معيار محدد وخدمة محددة، لا على الرقم وحده.',
        'Acceptance depends on a specific criterion and service, not a number alone.'
      ),
      sources: ['asnt-vt', 'nde-materials'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'academic', moduleId: 'mod_c_acad_vt' },
      textbook: { bookId: 'book-vt', pageNumber: 2 },
      labId: 'weld_inspector_gauge',
    },
    {
      id: 'vt-lighting-surface',
      title: t('الإضاءة والسطح والفحص البصري البعيد', 'Lighting, surface condition and remote visual inspection'),
      summary: t('ظروف المشاهدة تحدد ما إذا كان العيب مرئياً أصلاً.', 'Viewing conditions determine whether a flaw is visible at all.'),
      minutes: 18,
      objectives: [
        t('تحديد متطلبات الإضاءة والزاوية والمسافة.', 'Specify lighting, angle and distance requirements.'),
        t('شرح أثر تجهيز السطح والتلوث على الفحص.', 'Explain how surface preparation and contamination affect inspection.'),
        t('تقييد استخدام RVI وحدود دقة الصورة.', 'State the limits of RVI and image resolution.'),
      ],
      sections: [
        {
          heading: t('إضاءة قابلة للقياس', 'Measurable lighting'),
          body: t(
            'تحدد المواصفة شدة الإضاءة عند السطح وحدود التباين. استخدم مقياس إضاءة معايراً وسجل القيمة والموضع. الضوء المنتشر يقلل الإبهار، بينما الضوء الجانبي يبرز النتوءات والخدوش. لا تعتمد على «الرؤية واضحة» كوصف بديل عن قياس.',
            'Specifications define surface illuminance and contrast requirements. Use a calibrated light meter, record the value and location. Diffuse light reduces glare while grazing light accentuates ridges and scratches. “Clearly visible” is not a substitute for measurement.'
          ),
        },
        {
          heading: t('السطح قبل العين', 'Surface before eye'),
          body: t(
            'الطلاء والزيت والصدأ والغبار تخفي العيوب وتغير التباين. يجب تنظيف السطح وفق الإجراء وإزالة ما يعوق الرؤية، مع الانتباه إلى أن التنظيف قد يغير حالة السطح المطلوب تقييمها. حدد ما إذا كان الفحص قبل أو بعد الطلاء وماذا يقبل الكود.',
            'Paint, oil, scale and dust hide flaws and alter contrast. Clean per procedure and remove obstructions, while noting that cleaning may change the surface state being assessed. Establish whether inspection is before or after coating and what the code permits.'
          ),
        },
        {
          heading: t('الفحص البعيد (RVI)', 'Remote visual inspection (RVI)'),
          body: t(
            'البورسكوب والكاميرا يسمحان بالوصول إلى مناطق ضيقة، لكن دقة الصورة والإضاءة والمسافة البؤرية تحدد ما يمكن رؤيته. يجب توثيق الطراز والمجال المرئي والتكبير ومصدر الإضاءة. الصورة الرقمية قد تُحسّن أو تُشوّه؛ لا تعالج الصورة بشكل يخفي دلالة.',
            'Borescopes and cameras reach confined areas, but resolution, lighting and working distance define what can be seen. Record the model, field of view, magnification and light source. Digital images can enhance or distort; do not process an image in a way that hides an indication.'
          ),
        },
      ],
      workedExample: {
        prompt: t('صورة RVI تظهر خطاً داكناً، لكن الإضاءة مشبعة في الجزء العلوي. ما الخطوة؟', 'An RVI image shows a dark line, but the upper area is overexposed. What next?'),
        solution: t('لا تُقيّم الخط من صورة غير مضبوطة. أعد التصوير بإضاءة مناسبة وزوايا مختلفة، وثبّت المسافة والتكبير، وقارن بصورة مرجعية. إن بقي الاحتمال، استخدم طريقة سطحية مكملة مثل PT أو MT حسب المادة.', 'Do not assess the line from an improperly exposed image. Re-image with suitable lighting and different angles, fix distance and magnification, and compare with a reference. If the doubt remains, use a complementary surface method such as PT or MT as appropriate.'),
      },
      exercise: {
        prompt: t('اذكر ثلاثة بيانات يجب تسجيلها مع صورة RVI.', 'Name three data items to record with an RVI image.'),
        hint: t('فكر في الجهاز والمسافة والتكبير والإضاءة والموقع.', 'Think device, distance, magnification, lighting and location.'),
        answer: t('مثل: الجهاز/العدسة، المسافة، التكبير أو مجال الرؤية، الإضاءة، الموقع، الزاوية، مرجع القياس.', 'For example: device/lens, distance, magnification or field of view, lighting, location, angle, measurement reference.'),
      },
      quiz: quiz(
        'vt-lighting-surface-q1',
        'أي إجراء يحسن موثوقية الفحص البصري؟',
        'Which action improves the reliability of visual inspection?',
        [
          ['الاعتماد على ضوء الهاتف', 'Relying on a phone light'],
          ['قياس الإضاءة وتسجيلها وضبط الزاوية والمسافة', 'Measuring and recording illumination and controlling angle and distance'],
          ['تنظيف السطح بعد الحكم فقط', 'Cleaning only after judging'],
          ['استخدام أعلى تكبير دائماً', 'Always using maximum magnification'],
        ],
        1,
        'ظروف المشاهدة القابلة للقياس والتوثيق تجعل النتيجة قابلة للتكرار.',
        'Measurable, documented viewing conditions make the result repeatable.'
      ),
      sources: ['nde-pt-lighting', 'nde-light-response', 'nde-materials'],
      textbook: { bookId: 'book-vt', pageNumber: 3 },
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_vt' },
    },
    {
      id: 'vt-records',
      title: t('التوثيق والدلالات الكاذبة والتحقق', 'Records, false indications and verification'),
      summary: t('كيف تتحول الملاحظة إلى سجل يمكن الدفاع عنه؟', 'How an observation becomes a defensible record.'),
      minutes: 18,
      objectives: [
        t('بناء سجل فحص بصري مكتمل.', 'Build a complete visual inspection record.'),
        t('تمييز الدلالة الحقيقية من الكاذبة.', 'Distinguish true from false indications.'),
        t('اختيار طريقة مكملة عند الحاجة.', 'Select a complementary method when needed.'),
      ],
      sections: [
        {
          heading: t('عناصر السجل', 'Record content'),
          body: t(
            'يشمل السجل هوية القطعة والموقع ونوع الوصلة والسطح والظروف والإضاءة والأداة والإصدار والمعيار والمشاهدات والمقاسات والصور. يجب أن يسمح لشخص آخر بإعادة الفحص عند نفس الموضع. الصور تحتاج مرجعاً للمقياس والاتجاه.',
            'A record includes part identity, location, joint type, surface, conditions, lighting, tools, edition, criterion, observations, dimensions and images. Another person should be able to repeat the examination at the same location. Images need a scale and orientation reference.'
          ),
        },
        {
          heading: t('الدلالات الكاذبة', 'False indications'),
          body: t(
            'قد تشبه الخدوش وآثار الأدوات وحدود الطلاء والانعكاسات شروخاً. غيّر زاوية الإضاءة وفحص السطح بعد التنظيف واستخدم التكبير. لا تسجل «شرخ» بناءً على مظهر واحد؛ سجل «دلالة خطية تحتاج تحققاً» ثم استخدم طريقة مناسبة.',
            'Scratches, tool marks, coating edges and reflections can resemble cracks. Change lighting angle, inspect after cleaning and use magnification. Do not record “crack” from one appearance; record “linear indication requiring verification” and apply an appropriate method.'
          ),
        },
        {
          heading: t('الطريقة المكملة', 'Complementary method'),
          body: t(
            'VT يكشف السطح فقط. إذا كان العيب مشتبهاً به تحت السطح أو داخل weld، فاستخدم UT أو RT. إذا كان سطحياً في مادة غير مغناطيسية، فقد يكون PT مناسباً. اختيار الطريقة يعتمد على المادة والهندسة ونوع العيب والكود، لا على التفضيل.',
            'VT sees surfaces only. If a flaw may be subsurface or internal to the weld, use UT or RT. For a surface flaw in a non-magnetic material, PT may be suitable. Method choice depends on material, geometry, flaw type and code, not preference.'
          ),
        },
      ],
      workedExample: {
        prompt: t('ملاحظة خطية عند toe weld في فولاذ كربوني، والزاوية الثانية لا تظهرها. ما التسجيل؟', 'A linear mark at a carbon-steel weld toe is not seen from a second angle. How do you record it?'),
        solution: t('سجل الموقع والمقاس والزاوية والإضاءة، واذكر أنها دلالة غير مؤكدة. أعد التنظيف وافحص بالتكبير، ثم استخدم MT للتحقق من العيب السطحي/القريب من السطح وفق الإجراء.', 'Record location, size, angle and lighting, and state that it is unconfirmed. Re-clean, inspect with magnification, then use MT to verify a surface/near-surface flaw per procedure.'),
      },
      exercise: {
        prompt: t('اذكر عنصرين يجب أن يتضمنا في صورة توثيق لعيب.', 'Name two items that must accompany a flaw photograph.'),
        hint: t('كيف تعرف الحجم والموقع لاحقاً؟', 'How would you know size and location later?'),
        answer: t('مقياس أو مرجع أبعاد، وموقع/اتجاه واضح، مع تاريخ ومعرّف القطعة.', 'A scale or dimensional reference, and a clear location/orientation, plus date and part ID.'),
      },
      quiz: quiz(
        'vt-records-q1',
        'ما أفضل وصف لدلالة بصرية غير مؤكدة؟',
        'What is the best description of an unconfirmed visual indication?',
        [
          ['شرخ مؤكد', 'Confirmed crack'],
          ['عيب مرفوض', 'Rejectable defect'],
          ['دلالة خطية تحتاج تحققاً', 'Linear indication requiring verification'],
          ['لا شيء، تُهمل', 'Nothing; ignore it'],
        ],
        2,
        'الوصف الأمين يحفظ المعلومة دون تجاوز الأدلة، ثم يوجه التحقق.',
        'An honest description preserves the observation without overclaiming and directs verification.'
      ),
      sources: ['nde-visual-acuity', 'asnt-vt', 'nde-pt-defect'],
      textbook: { bookId: 'book-vt', pageNumber: 4 },
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_vt' },
    },
  ],
  standards: ['ASME Sec V Art. 9', 'AWS D1.1 visual acceptance', 'API 1104 visual acceptance'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/PenetrantTest/Introduction/visualacuity.xhtml',
  limits: t(
    'لا يمنح المقرر صفة فاحص VT مؤهل. لا تغطي الأمثلة كل معايير القبول ولا تحل محل نسخة الكود أو تدريب العين والقياس العملي.',
    'This course does not qualify a VT inspector. Examples do not cover every acceptance criterion and do not replace the code edition or practical eye and measurement training.'
  ),
};
