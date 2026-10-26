import { NdeEdCourse } from './types';
import { quiz, t } from './helpers';

export const ptCourse: NdeEdCourse = {
  id: 'nde-pt',
  disciplineId: 'conventional_ndt',
  code: 'PT',
  level: 'foundation',
  accent: '#f472b6',
  title: t('السوائل النافذة (PT)', 'Liquid Penetrant Testing (PT)'),
  subtitle: t('المبدأ، المواد، الضبط، التطبيق، والتفسير', 'Principle, materials, control, application and interpretation'),
  description: t(
    'مقرر كامل لطريقة السوائل النافذة: كيف يدخل النافذ في الشق، كيف تختار العائلة والمطوّر، كيف تضبط الحرارة والزمن والغسل، وكيف تفسر الدلالة دون تهويل. مبني على هيكل موضوعات nde-ed.org بصياغة وأمثلة أصلية.',
    'A complete liquid penetrant course: how penetrant enters a crack, how to select the family and developer, how to control temperature, time and washing, and how to interpret indications without overclaiming. Topic structure follows nde-ed.org with original wording and examples.'
  ),
  prerequisites: t('أساسيات الخاصية الشعرية وقياس الحرارة. يُفضل قراءة درس phy-capillary.', 'Capillary action and temperature measurement basics. Completing phy-capillary is recommended.'),
  outcomes: [
    t('شرح خطوات PT الست وربط كل خطوة بجودة النتيجة.', 'Explain the six PT steps and link each to result quality.'),
    t('اختيار نوع النافذ وطريقة الإزالة والمطوّر لحالة محددة.', 'Select penetrant type, removal method and developer for a case.'),
    t('ضبط الحرارة والمكوث والغسل والتجفيف والإضاءة وفق الإجراء.', 'Control temperature, dwell, washing, drying and lighting per procedure.'),
    t('تمييز الدلالة الحقيقية من الكاذبة وتسجيلها.', 'Distinguish true from false indications and record them.'),
  ],
  lessons: [
    {
      id: 'pt-principles',
      title: t('مبدأ العملية وخطواتها الست', 'The process and its six steps'),
      summary: t('من التجويف الشعري إلى دلالة مرئية.', 'From capillary entry to a visible indication.'),
      minutes: 18,
      objectives: [
        t('ترتيب خطوات PT وتفسير هدف كل خطوة.', 'Order PT steps and explain each purpose.'),
        t('تحديد أنواع العيوب التي تكشفها الطريقة.', 'Identify flaw types the method detects.'),
        t('شرح لماذا الإزالة المفرطة أو الناقصة تفسد النتيجة.', 'Explain why under- or over-removal ruins the result.'),
      ],
      sections: [
        {
          heading: t('التسلسل', 'The sequence'),
          body: t(
            'التسلسل المعتاد: تنظيف أولي، تطبيق النافذ، مكوث، إزالة الزائد، تجفيف، تطبيق المطوّر، مشاهدة وتفسير، ثم تنظيف لاحق. كل خطوة تحفظ أو تدمر ما قبلها. إذا لم يُنظف السطح، دخل النافذ في التلوث بدلاً من الشق؛ وإذا غُسل بقوة، خرج النافذ من العيب.',
            'The usual sequence is pre-cleaning, penetrant application, dwell, excess removal, drying, developer application, observation and interpretation, then post-cleaning. Each step preserves or destroys the previous one. Poor cleaning lets penetrant enter contamination instead of a crack; aggressive washing removes it from the flaw.'
          ),
        },
        {
          heading: t('ما الذي يُكشف', 'What is detected'),
          body: t(
            'PT يكشف العيوب المفتوحة للسطح في المواد غير المسامية: الشروخ، المسامية السطحية، نقص الانصهار السطحي، والتشققات الحرارية. لا يكشف العيوب الداخلية المغلقة. المواد المسامية مثل البطانة الخزفية أو السباكة الخشنة قد تحتاج طريقة مختلفة أو ضبطاً خاصاً.',
            'PT detects surface-breaking flaws in non-porous materials: cracks, surface porosity, surface lack of fusion and heat-affected cracking. It does not detect closed internal flaws. Porous materials such as ceramic coatings or coarse castings may need another method or special control.'
          ),
        },
        {
          heading: t('المقايضة بين الحساسية والضوضاء', 'Sensitivity versus noise'),
          body: t(
            'نافذ عالي الحساسية يكشف عيوباً أدق لكنه قد يبرز خشونة السطح والخدوش كدلالات كاذبة. الإنارة القوية والمطوّر الرقيق قد يزيدان التباين، لكنهما لا يصلحان سطحاً سيئاً. الإجراء يحدد العائلة والمستوى، لا «الأقوى دائماً».',
            'A high-sensitivity penetrant reveals finer flaws but may highlight surface roughness and scratches as false indications. Strong lighting and a thin developer can raise contrast but cannot rescue a poor surface. The procedure defines the family and level; “strongest” is not always best.'
          ),
        },
      ],
      workedExample: {
        prompt: t('قطعة بها صدأ سطحي وطلاء جزئي. ابدأ من أين؟', 'A part has surface rust and partial coating. Where do you start?'),
        solution: t('ابدأ بالتنظيف وإزالة ما يعوق وصول النافذ، مع التحقق من أن التنظيف لا يغير الحالة المطلوب تقييمها. بعد التجفيف طبق النافذ ثم اتبع المكوث والإزالة والتطوير وفق الإجراء. وثّق حالة السطح قبل الفحص.', 'Start by cleaning and removing what blocks penetrant access, verifying cleaning does not change the condition to be assessed. Dry, apply penetrant, then follow dwell, removal and development per procedure. Record the surface condition before testing.'),
      },
      exercise: {
        prompt: t('اذكر الخطوة التي تسبق تطبيق المطوّر ولماذا.', 'Name the step before developer application and why.'),
        hint: t('ماذا يحدث لو بقي الماء أو النافذ الزائد؟', 'What happens if water or excess penetrant remains?'),
        answer: t('التجفيف (بعد إزالة النافذ الزائد والغسل). الرطوبة الزائدة تخفف المطوّر وتفسد تكوّن الطبقة وتسبب دلالات كاذبة.', 'Drying (after excess removal and washing). Excess moisture dilutes developer, disrupts the layer and causes false indications.'),
      },
      quiz: quiz(
        'pt-principles-q1',
        'أي عيب لا يكشفه PT؟',
        'Which flaw does PT not detect?',
        [
          ['شرخ سطحي مفتوح', 'An open surface crack'],
          ['نقص انصهار سطحي', 'Surface lack of fusion'],
          ['عيب داخلي مغلق', 'A closed internal flaw'],
          ['مسامية سطحية', 'Surface porosity'],
        ],
        2,
        'PT يحتاج مساراً من السطح إلى العيب؛ العيب الداخلي المغلق غير قابل للوصول.',
        'PT needs a path from the surface; a closed internal flaw is unreachable.'
      ),
      sources: ['nde-pt-process', 'nde-pt-proscons', 'nde-capillary'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_pt' },
      textbook: { bookId: 'book-pt', pageNumber: 1 },
      labId: 'pt_mt_darkroom',
    },
    {
      id: 'pt-materials',
      title: t('النافذ والمستحلب والمطوّر', 'Penetrant, emulsifier and developer'),
      summary: t('عائلات المواد وكيف تختار منها.', 'Material families and how to choose among them.'),
      minutes: 20,
      objectives: [
        t('التمييز بين النافذ المرئي والفلوري.', 'Distinguish visible from fluorescent penetrant.'),
        t('شرح طرق الإزالة المائية والزيتية والمذيبة.', 'Explain water-washable, post-emulsifiable and solvent removal.'),
        t('اختيار المطوّر المناسب لخشونة السطح.', 'Select a developer suitable for the surface roughness.'),
      ],
      sections: [
        {
          heading: t('النافذ', 'The penetrant'),
          body: t(
            'النافذ المرئي يعتمد على لون قوي في الضوء الأبيض، والفلوري يعتمد على إصدار ضوء تحت UV-A. الفلوري عادة أعلى حساسية لكنه يحتاج غرفة مظلمة وفحصاً بالضوء الأسود. تُصنف النوافذ حسب الحساسية والطريقة، وتحدد المواصفة المستويات المقبولة.',
            'Visible penetrant relies on strong colour under white light; fluorescent penetrant emits under UV-A. Fluorescent usually offers higher sensitivity but needs a darkened area and black-light inspection. Penetrants are classified by sensitivity and method, with acceptable levels defined by the specification.'
          ),
        },
        {
          heading: t('الإزالة', 'Removal'),
          body: t(
            'المائي يُغسل مباشرة، والزيتي (post-emulsifiable) يحتاج مستحلباً قبل الغسل، والمذيب يُزال بالمسح. المستحلب الدهني أو المائي يجب أن يطبق بتركيز وزمن محددين؛ الإفراط في المستحلب يجعل النافذ قابلاً للغسل من داخل العيب أيضاً. المذيبة قد تترك بقايا وتؤثر على المطوّر.',
            'Water-washable penetrant is rinsed directly; post-emulsifiable penetrant needs an emulsifier before rinsing; solvent-removable is wiped. Emulsifier concentration and time must be controlled; over-emulsification makes penetrant wash out of the flaw itself. Solvents may leave residue and affect the developer.'
          ),
        },
        {
          heading: t('المطوّر', 'The developer'),
          body: t(
            'المطوّر الجاف والذواب في الماء والمعلق في الماء وغير المائي (مذيب) تختلف في السماكة والتباين وسهولة التطبيق. المطوّر الرقيق يزيد الحساسية لكنه قد لا يغطي خشونة عالية؛ الطبقة السميكة تخفي التفاصيل. اختر وفق الإجراء واختبر على عينة مرجعية.',
            'Dry powder, water-soluble, water-suspendible and non-aqueous (solvent) developers differ in thickness, contrast and ease of application. A thin film raises sensitivity but may not cover rough surfaces; a thick layer hides detail. Select per procedure and verify on a reference sample.'
          ),
        },
      ],
      workedExample: {
        prompt: t('سبيكة مصقولة تريد أعلى حساسية، وخزان له سطح خشن. هل تختار نفس النظام؟', 'A polished alloy needs maximum sensitivity; a tank has a rough surface. Same system?'),
        solution: t('ليس بالضرورة. المصقولة قد تناسب نافذاً فلورياً عالي الحساسية ومطوّراً رقيقاً، بينما الخشنة قد تحتاج مطوّراً أكثر سماكة/تغطية وتقليلاً للضوضاء. تحقق من حساسية النظام على عيب مرجعي بدلاً من الافتراض.', 'Not necessarily. The polished part may suit high-sensitivity fluorescent penetrant and a thin developer, while the rough tank may need fuller developer coverage and noise control. Verify system sensitivity on a reference defect rather than assuming.'),
      },
      exercise: {
        prompt: t('متى تحتاج مستحلباً في PT؟', 'When is an emulsifier needed in PT?'),
        hint: t('فكر في النافذ الزيتي/القابل للإزالة بعد الاستحلاب.', 'Think of post-emulsifiable penetrant.'),
        answer: t('عند استخدام نافذ post-emulsifiable: يُطبق المستحلب بعد المكوث وقبل الغسل ليجعل النافذ الزائد قابلاً للإزالة.', 'When using post-emulsifiable penetrant: apply emulsifier after dwell and before rinsing to make excess penetrant removable.'),
      },
      quiz: quiz(
        'pt-materials-q1',
        'ما وظيفة المطوّر؟',
        'What is the function of the developer?',
        [
          ['زيادة دخول النافذ إلى الشق', 'Increase penetrant ingress into the crack'],
          ['سحب النافذ المحبوس إلى السطح لتكوين دلالة مرئية', 'Draw trapped penetrant to the surface to form a visible indication'],
          ['إزالة النافذ الزائد', 'Remove excess penetrant'],
          ['تبريد السطح', 'Cool the surface'],
        ],
        1,
        'المطوّر يعمل كضاغط/ماص يسحب النافذ من العيب ويشكل طبقة ذات تباين.',
        'Developer acts as a blotter, drawing penetrant from the flaw into a contrasting layer.'
      ),
      sources: ['nde-pt-penetrants', 'nde-pt-developers', 'nde-pt-emulsifiers', 'nde-pt-removal'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level1', moduleId: 'mod_c_pt' },
      textbook: { bookId: 'book-pt', pageNumber: 2 },
    },
    {
      id: 'pt-control',
      title: t('ضبط العملية: الحرارة والزمن والغسل والإضاءة', 'Process control: temperature, time, washing and light'),
      summary: t('المتغيرات التي تصنع الفرق بين نتيجة موثوقة وضياع وقت.', 'Variables that separate a reliable result from wasted effort.'),
      minutes: 22,
      objectives: [
        t('تحديد الحرارة والزمن المطلوبين وفق الإجراء.', 'Determine temperature and time requirements per procedure.'),
        t('شرح مخاطر الغسل الزائد والتجفيف القوي.', 'Explain the risks of over-washing and aggressive drying.'),
        t('التحقق من الإضاءة وكفاءة النظام.', 'Verify lighting and system performance.'),
      ],
      sections: [
        {
          heading: t('الحرارة والزمن', 'Temperature and time'),
          body: t(
            'تؤثر حرارة السطح والمواد في لزوجة النافذ وسرعة الدخول والتبخير. المواصفات تحدد نطاقاً مسموحاً؛ خارج النطاق قد يصبح النافذ لزجاً أو يتبخر بسرعة. زمن المكوث يبدأ من تغطية السطح ويحدده الإجراء ونوع العيب. لا تقصّر الزمن لتسريع العمل.',
            'Surface and material temperature affect penetrant viscosity, ingress rate and evaporation. Specifications define an acceptable range; outside it penetrant may become too viscous or evaporate quickly. Dwell starts when the surface is covered and is set by procedure and flaw type. Do not shorten it to save time.'
          ),
        },
        {
          heading: t('الغسل والتجفيف', 'Washing and drying'),
          body: t(
            'الغسل بالماء يهدف لإزالة النافذ السطحي فقط. ضغط مرتفع أو مسافة قريبة أو زمن طويل يسحب النافذ من العيب. التجفيف بتيار ساخن قوي قد يطرده أيضاً ويشقق طبقة المطوّر. استخدم الضغط والزمن والحرارة المحددة، وافحص تحت نفس ظروف الإضاءة.',
            'Water washing removes only surface penetrant. High pressure, a close nozzle or a long rinse can draw penetrant out of the flaw. Hot, strong drying can also drive it out and crack the developer layer. Use the specified pressure, time and temperature, and inspect under the same lighting conditions.'
          ),
        },
        {
          heading: t('التحقق من النظام', 'System performance'),
          body: t(
            'تُفحص المواد دورياً: حساسية النافذ، تلوث الحوض، تركيز المطوّر، شدة UV-A، وشدة الضوء الأبيض، وكفاءة الغسل. تستخدم كتلة مرجعية ذات عيوب معروفة للتحقق من النظام كاملاً. السجلات تثبت أن النتيجة صادرة عن نظام مضبوط لا عن صدفة.',
            'Materials are checked periodically: penetrant sensitivity, bath contamination, developer concentration, UV-A intensity, white-light intensity and rinse performance. A reference block with known defects verifies the whole system. Records show the result came from a controlled system, not chance.'
          ),
        },
      ],
      workedExample: {
        prompt: t('فاحص رفع ضغط الغسل لتسريع العمل، فاختفت دلالة صغيرة. ما التفسير؟', 'An inspector raised rinse pressure to speed up work and a small indication disappeared. Why?'),
        solution: t('الغسل المفرط سحب النافذ من الشق. الدلالة لم «تُصلح»؛ بل أُزيلت مادتها. يجب إعادة التنظيف والتطبيق بالضغط والزمن المعتمدين، ثم التحقق بكتلة مرجعية.', 'Over-washing drew penetrant out of the crack. The indication was not corrected; its material was removed. Re-clean and reapply using approved pressure and time, then verify with a reference block.'),
      },
      exercise: {
        prompt: t('اذكر متغيرين يجب تسجيلهما في تقرير PT غير نوع النافذ.', 'Name two PT variables to record besides penetrant type.'),
        hint: t('فكر في الزمن والحرارة والإضاءة والمطوّر.', 'Think time, temperature, lighting and developer.'),
        answer: t('مثل: زمن المكوث، حرارة السطح، نوع المطوّر، زمن التطوير، شدة الإضاءة/UV-A، ضغط الغسل.', 'For example: dwell time, surface temperature, developer type, development time, lighting/UV-A intensity, rinse pressure.'),
      },
      quiz: quiz(
        'pt-control-q1',
        'ماذا يسبب الغسل المفرط؟',
        'What does over-washing cause?',
        [
          ['زيادة حساسية الكشف', 'Increased detection sensitivity'],
          ['سحب النافذ من العيب وضياع الدلالة', 'Removing penetrant from the flaw and losing the indication'],
          ['تحسين التصاق المطوّر', 'Better developer adhesion'],
          ['تقليل زمن المكوث', 'Reduced dwell time'],
        ],
        1,
        'الغسل الزائد يزيل النافذ المحبوس، خاصة من العيوب الضيقة.',
        'Excess washing removes trapped penetrant, especially from tight flaws.'
      ),
      sources: ['nde-pt-temperature', 'nde-pt-dwell', 'nde-pt-wash', 'nde-pt-drying', 'nde-pt-lighting', 'nde-pt-performance'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-pt', pageNumber: 3 },
    },
    {
      id: 'pt-application',
      title: t('التجهيز والاختيار والتطبيق والإزالة', 'Preparation, selection, application and removal'),
      summary: t('قرارات عملية قبل أن يلمس النافذ السطح.', 'Practical decisions before penetrant touches the surface.'),
      minutes: 20,
      objectives: [
        t('تقييم تجهيز السطح واختيار طريقة الإزالة.', 'Assess surface preparation and select a removal method.'),
        t('ضبط التطبيق والمكوث وتفادي الجفاف.', 'Control application and dwell and avoid drying out.'),
        t('إزالة النافذ الزائد دون إتلاف الدلالة.', 'Remove excess penetrant without damaging indications.'),
      ],
      sections: [
        {
          heading: t('التجهيز والاختيار', 'Preparation and selection'),
          body: t(
            'التجهيز يهدف لفتح العيب وإزالة ما يعوق الدخول دون إغلاقه. قد تحتاج أسطح الآلات أو اللحامات إلى تنظيف ميكانيكي أو كيميائي مناسب. اختيار الطريقة يعتمد على حجم القطعة وعددها وخشونة السطح وتوافر الماء والكهرباء والحساسية المطلوبة.',
            'Preparation aims to open the flaw and remove obstructions without sealing it. Machined surfaces or welds may need suitable mechanical or chemical cleaning. Method selection depends on part size, quantity, roughness, availability of water and power, and required sensitivity.'
          ),
        },
        {
          heading: t('التطبيق والمكوث', 'Application and dwell'),
          body: t(
            'يُطبق النافذ بطريقة تغطي السطح بالكامل: غمر، رش، فرشاة، أو تدفق. يجب ألا يجف النافذ على السطح أثناء المكوث. الحرارة العالية والرياح والتجفيف السريع تقلل الزمن الفعلي. استخدم كمية كافية وسجّل الطريقة، ولا تعتمد على طبقة رقيقة غير مكتملة.',
            'Apply penetrant so it covers the surface completely: immersion, spray, brush or flow. It must not dry on the surface during dwell. High temperature, draughts and rapid drying reduce effective time. Use sufficient quantity, record the method, and avoid an incomplete thin film.'
          ),
        },
        {
          heading: t('الإزالة', 'Removal'),
          body: t(
            'الإزالة تختلف حسب العائلة: غسل مائي فوري، استحلاب ثم غسل، أو مسح بمذيب. في جميع الحالات احتفظ بطبقة رقيقة من النافذ على السطح لتجنب الإفراط. لا تعيد استخدام ماء ملوث أو مذيبات متسخة. جفف قبل المطوّر بالطريقة المعتمدة.',
            'Removal depends on the family: immediate water rinse, emulsify then rinse, or solvent wipe. In all cases keep the removal controlled to avoid over-removal. Do not reuse contaminated water or dirty solvents. Dry before developer using the approved method.'
          ),
        },
      ],
      workedExample: {
        prompt: t('قطعة كبيرة الحجم لا يمكن غمرها، وسطحها ناعم. اختر طريقة تطبيق وإزالة.', 'A large part cannot be immersed and has a smooth surface. Choose application and removal.'),
        solution: t('يمكن التطبيق بالرش أو التدفق مع تغطية كاملة، ثم إزالة وفق العائلة (غسل/استحلاب/مسح). يجب التحقق من أن التغطية وصلت لكل السطح وأن الإزالة لم تتجاوز الحد. القرار النهائي وفق الإجراء والمواصفة.', 'Spray or flow application with full coverage is possible, then removal per family (rinse/emulsify/wipe). Verify full coverage and controlled removal. The final choice follows the procedure and specification.'),
      },
      exercise: {
        prompt: t('لماذا لا يجوز أن يجف النافذ على السطح قبل الإزالة؟', 'Why must penetrant not dry on the surface before removal?'),
        hint: t('ما الذي يحدث للمادة الصلبة داخل الشق؟', 'What happens to material inside the crack?'),
        answer: t('الجفاف يثبت النافذ ويجعله أصعب في الإزالة، وقد يمنع خروجه من العيب في مرحلة التطوير ويسبب دلالات كاذبة أو ضعيفة.', 'Drying fixes penetrant, makes removal harder and can prevent it from emerging during development, causing false or weak indications.'),
      },
      quiz: quiz(
        'pt-application-q1',
        'ما الهدف من التجهيز قبل PT؟',
        'What is the purpose of preparation before PT?',
        [
          ['إغلاق الشقوق', 'Sealing cracks'],
          ['إزالة ما يعوق دخول النافذ دون إغلاق العيب', 'Removing obstructions to penetrant entry without sealing the flaw'],
          ['تسخين السطح', 'Heating the surface'],
          ['تلوين السطح', 'Colouring the surface'],
        ],
        1,
        'التنظيف يفتح مسار الدخول؛ الإغلاق أو التلوث يمنع الكشف.',
        'Cleaning opens the entry path; sealing or contamination prevents detection.'
      ),
      sources: ['nde-pt-preparation', 'nde-pt-selection', 'nde-pt-application', 'nde-pt-removal', 'nde-pt-developers'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-pt', pageNumber: 4 },
    },
    {
      id: 'pt-interpretation',
      title: t('تفسير الدلالات والسلامة', 'Indication interpretation and safety'),
      summary: t('دلالة حمراء ليست حكماً؛ والسلامة جزء من الإجراء.', 'A red indication is not a verdict; safety is part of the procedure.'),
      minutes: 20,
      objectives: [
        t('تصنيف الدلالة وحجمها وسببها المحتمل.', 'Classify an indication, its size and likely cause.'),
        t('تمييز الدلالة الكاذبة من الحقيقية.', 'Distinguish false from true indications.'),
        t('تطبيق ضوابط السلامة وإدارة المواد.', 'Apply safety controls and material handling.'),
      ],
      sections: [
        {
          heading: t('قراءة الدلالة', 'Reading an indication'),
          body: t(
            'الدلالة هي أثر مرئي، وليست بالضرورة عيباً. سجل الشكل والاتجاه والطول والعرض والموقع. الدلالة الخطية الحادة قد تشير لشرخ، والمتقطعة المتفرقة قد تشير لمسامية. المقارنة مع كتلة مرجعية والإضاءة المناسبة تساعدان في التصنيف.',
            'An indication is a visible trace, not necessarily a defect. Record shape, orientation, length, width and location. A sharp linear indication may suggest a crack; scattered rounded indications may suggest porosity. Comparison with a reference block and suitable lighting aid classification.'
          ),
        },
        {
          heading: t('الدلالات الكاذبة', 'False indications'),
          body: t(
            'خدوش المعالجة، حدود الطلاء، آثار الفرشاة، تلوث المطوّر، وعدم التجفيف الكافي قد تظهر كدلالات. بعضها يختفي عند إعادة التنظيف. لا ترفض قطعة بناءً على دلالة واحدة دون استبعاد الأسباب السطحية وإعادة الفحص.',
            'Machining scratches, coating edges, brush marks, developer contamination and incomplete drying can appear as indications. Some disappear after re-cleaning. Do not reject a part from one indication without excluding surface causes and re-examining.'
          ),
        },
        {
          heading: t('السلامة وإدارة المواد', 'Safety and material handling'),
          body: t(
            'النوافذ والمذيبات والمستحلبات قد تكون قابلة للاشتعال أو مهيجة أو ضارة بالبيئة. استخدم تهوية مناسبة وقفازات ونظارات الحماية، وافحص UV-A دون النظر المباشر إلى المصدر. تخلص من المواد المستعملة وفق اللوائح، ولا تصرفها في الصرف العام.',
            'Penetrants, solvents and emulsifiers may be flammable, irritant or environmentally harmful. Use suitable ventilation, gloves and eye protection, and inspect UV-A without looking directly at the source. Dispose of used materials per regulations; do not discharge to drains.'
          ),
        },
      ],
      workedExample: {
        prompt: t('دلالة حمراء دائرية صغيرة على سطح مصقول؛ هل هي مسامية؟', 'A small round red indication on a polished surface: is it porosity?'),
        solution: t('ليست بالضرورة. قد تكون ثقباً أو خدشاً أو قطرة نافذ. أعد التنظيف والفحص، واستخدم التكبير والزاوية، وقارن بكتلة مرجعية. إن بقيت، سجلها كدلالة وقيّمها وفق معيار القبول وطبيعة المادة.', 'Not necessarily; it could be a pit, scratch or penetrant droplet. Re-clean and re-examine with magnification and different angles, and compare with a reference block. If it remains, record it as an indication and assess against the acceptance criterion and material.'),
      },
      exercise: {
        prompt: t('اذكر ضابط سلامة واحداً خاصاً بفحص PT الفلوري.', 'Name one safety control specific to fluorescent PT.'),
        hint: t('فكر في الضوء الأسود والمخاطر الضوئية.', 'Think black light and optical hazards.'),
        answer: t('استخدام نظارات واقية من UV-A، وعدم النظر المباشر إلى المصدر، وحماية الجلد والعينين، مع تهوية مناسبة.', 'Use UV-A protective eyewear, avoid direct viewing of the source, protect skin and eyes, and ensure suitable ventilation.'),
      },
      quiz: quiz(
        'pt-interpretation-q1',
        'هل كل دلالة في PT تعني وجود عيب مرفوض؟',
        'Does every PT indication mean a rejectable defect?',
        [
          ['نعم، الدلالة تعني الرفض', 'Yes, an indication means rejection'],
          ['لا؛ توجد دلالات كاذبة ويجب تقييمها وفق المعيار', 'No; false indications exist and must be assessed against the criterion'],
          ['نعم، إلا في الفولاذ', 'Yes, except in steel'],
          ['لا، كل الدلالات كاذبة', 'No, all indications are false'],
        ],
        1,
        'الدلالة أثر يحتاج تفسيراً؛ قد تكون سطحية أو كاذبة، والقبول يعتمد على المعيار.',
        'An indication is a trace needing interpretation; it may be superficial or false, and acceptance depends on the criterion.'
      ),
      sources: ['nde-pt-defect', 'nde-pt-safety', 'nde-pt-performance'],
      curriculum: { disciplineId: 'conventional_ndt', levelId: 'level2', moduleId: 'mod_c2_1' },
      textbook: { bookId: 'book-pt', pageNumber: 6 },
    },
  ],
  standards: ['ASME Sec V Art. 6', 'ASTM E165 / E1417', 'ISO 3452'],
  sourceLanding: 'https://www.nde-ed.org/NDETechniques/PenetrantTest/index.xhtml',
  limits: t(
    'المقرر لا يؤهل فاحص PT ولا يحدد نطاقات الحرارة أو الأزمنة الملزمة. استخدم إجراءً معتمداً ومواصفة العقد ونسخة الكود المطلوبة.',
    'The course does not qualify a PT inspector or set mandatory temperature or time ranges. Use an approved procedure, the contract specification and the required code edition.'
  ),
};
