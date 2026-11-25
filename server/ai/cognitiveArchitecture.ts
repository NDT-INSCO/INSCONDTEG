/**
 * INSCO AI Agent — Cognitive Architecture, Domain Training & Response Logic Engine
 *
 * Implements modern reasoning structures (First-Principles, Chain-of-Verification / CoVe,
 * Tree-of-Thoughts Trade-off Matrix, ReAct Planner, Socratic Tutor), Domain Few-Shot Training
 * Playbooks, Reviewed INSCO Library RAG Injection, and Epistemic Anti-Hallucination Calibration.
 *
 * Node-only module used by server.ts; exported helpers are pure for unit testing.
 */
import type {
  AgentLanguage,
  ChatGptFewShotExample,
  ChatGptReasoningArchitecture,
  ChatGptResponseStyle,
  ChatGptTaskMode,
  ChatGptTrainingPack,
} from '../../src/ai/agentsContract';
import type { SearchHit } from '../../src/ai/search';

const PACK_KNOWLEDGE: Record<ChatGptTrainingPack, { en: string; ar: string }> = {
  ndt_codes: {
    en: [
      '[PLAYBOOK: NDT Codes & Quantitative Equations]',
      '- Radiography (ASME Sec. V Art. 2 / ISO 17636): Geometric unsharpness Ug = (F * d) / D, where F = focal spot / source size, d = source-side surface to film distance (specimen thickness), D = source-to-object distance (SFD - d). Standard ASME Sec. V Table T-274.2 limits: <= 0.51mm (t < 50mm), <= 0.76mm (50-75mm), <= 1.02mm (75-100mm). Film transmission density H&D: 2.0-4.0 (Gamma / X-ray single film) and wire IQI essential wire visible across weld & HAZ.',
      '- Ultrasonic & PAUT/TOFD (ASME Sec. V Art. 4 / Sec. VIII Div. 1 App. 12 / ISO 17640): Snell Law sin(theta1)/v1 = sin(theta2)/v2 (Carbon steel shear Vs ~ 3230 m/s, longitudinal Vl ~ 5900 m/s). Half-skip surface distance SD = t * tan(theta); Full V-path surface distance = 2 * t * tan(theta). Transfer correction required whenever test surface roughness differs from calibration block.',
      '- Magnetic & Penetrant (ASME Sec. V Art. 6 & 7 / ASTM E709 & E165): Visible light >= 1000 lx; UV-A (365 nm) >= 1000 uW/cm^2 at 380 mm with ambient white light <= 20 lx; dwell time typical 10-30 min (temperature 10-52 C unless qualified); AC yoke lift >= 4.5 kg, DC/PM >= 18.1 kg.',
    ].join('\n'),
    ar: [
      '[مجموعة تدريب: الأكواد الدولية والحسابات الهندسية NDT]',
      '- التصوير الإشعاعي (ASME Sec. V Art. 2 / ISO 17636): عدم الحدة الهندسي Ug = (F × d) / D حيث F حجم البؤرة/المصدر، d سمك العينة حتى الفيلم، D المسافة من المصدر لسطح الجسم (SFD - d). الحدود القياسية: <= 0.51 مم (سمك < 50 مم)، <= 0.76 مم (50-75 مم). الكثافة البصرية للفيلم H&D بين 2.0 و 4.0 مع تحقق رؤية السلك المطلوب لمؤشر جودة الصورة IQI عبر اللحام والـ HAZ.',
      '- الموجات فوق الصوتية وPAUT/TOFD (ASME Sec. V Art. 4 / App. 12): قانون سنيل sin(theta1)/v1 = sin(theta2)/v2 (سرعة الموجة العرضية في الكربون ستيل ~ 3230 م/ث، الطولية ~ 5900 م/ث). نصف المسار SD = t × tan(theta) والمسار الكامل V-path = 2 × t × tan(theta). يلزم تصحيح الانتقال Transfer Correction عند اختلاف خشونة السطح.',
      '- الجسيمات المغناطيسية والسوائل المتغلغلة (ASME Art. 6 & 7): الإضاءة المرئية >= 1000 لوكس، الأشعة فوق البنفسجية >= 1000 ميكرووات/سم² مع إضاءة محيطة <= 20 لوكس، وزن رفع اليوك AC >= 4.5 كجم و DC >= 18.1 كجم.',
    ].join('\n'),
  },
  film_diagnostics: {
    en: [
      '[PLAYBOOK: RT Film Reading & Defect Acceptance Logic]',
      'Before condemning a radiographic indication, execute this 4-step differential check:',
      '1) Film Quality & Artifact Elimination: Check B-lead back-scatter letter, H&D density variation (+/-15%/-30% of IQI), developer streaks, water marks, static discharge, or pressure crimps (which follow emulsion surface, not weld geometry).',
      '2) Geometric Localization: Identify centerline (root pass / bevel fusion line / cap toe) vs. HAZ/base metal.',
      '3) Morphology Signature: Linear sharp dark line along fusion bevel = Lack of Sidewall Fusion (LOF); Straight dark centerline with sharp edges = Incomplete Penetration (IP) vs. rounded diffuse centerline = Root Concavity; Elongated irregular worm with rounded tips = Slag Inclusion; Scattered spherical = Porosity.',
      '4) Code Acceptance Decision Matrix: Clearly state whether standard requires zero linear planar cracks/LOF/IP (e.g., ASME Sec. VIII UW-51) vs. thickness-scaled slag/porosity limits.',
    ].join('\n'),
    ar: [
      '[مجموعة تدريب: منهجية قراءة أفلام الأشعة RT وتقييم العيوب]',
      'قبل إصدار قرار رفض لعيب في الفيلم الإشعاعي، نفّذ تسلسل التحقق رباعي المراحل:',
      '1) فحص جودة الفيلم واستبعاد عيوب التحميض: تحقق من عدم وجود ارتداد لحرف B، نطاق الكثافة الضوئية H&D، وخلو الفيلم من خطوط التحميض أو علامات الضغط والكهرباء الساكنة.',
      '2) التموضع الهندسي: حدد موقع المؤشر بدقة (خط الجذر Root، خط التلاحم Bevel Fusion Line، أو منطقة التأثر الحراري HAZ).',
      '3) التمييز الشكلي (Morphology): خط داكن حاد بمحاذاة الجدار الجانبي = عدم اندماج جانبي LOF؛ خط مستقيم حاد في المنتصف = نقص تغلغل الجذر IP؛ دودة غير منتظمة النهايات = خبث Slag؛ نقاط دائرية = مسامية Porosity.',
      '4) مصفوفة القبول والرفض بالكود: فرّق صراحةً بين العيوب المرفوضة قطعياً مهما كان طولها (الشروخ، LOF، IP في ASME Sec. VIII UW-51) وبين العيوب الحجمية المحكومة بجدول الطول والسمك.',
    ].join('\n'),
  },
  pwht_thermal: {
    en: [
      '[PLAYBOOK: PWHT 65kW Induction / Resistance Heat Treatment Logic]',
      '- Heating & Cooling Rates (ASME Sec. VIII Div. 1 UW-40 / B31.3): Above 315 C (600 F), max heating/cooling rate is scaled by wall thickness: 222 C/hr divided by (thickness_mm / 25), capped strictly at 280 C/hr (and never exceeding code cap when wall is thin).',
      '- Soak Window: Carbon Steel (P-No. 1): typical 595-650 C for 1 hr per 25mm (min 15 min). P-No. 5A / P91 (P-No. 15E): strict narrow band (e.g. P91 ~ 750-775 C) where overshooting AC1 destroys tempered martensite creep strength and triggers hardness/microstructure rejection.',
      '- Control Loop Verification: Verify thermocouple spacing across circumferential zones (top/bottom 12-6 o-clock convective delta), heated band width (>= 3x weld + thickness), and insulation overlap.',
    ].join('\n'),
    ar: [
      '[مجموعة تدريب: هندسة المعالجة الحرارية PWHT بقدرة 65kW]',
      '- معدلات التسخين والتبريد (ASME Sec. VIII UW-40 / B31.3): فوق 315 درجة مئوية يُحسب المعدل الأقصى بالعلاقة 222 درجة/ساعة مقسوماً على (السمك مم / 25) وبحد أقصى لا يتجاوز 280 درجة/ساعة.',
      '- نافذة التثبيت Soak: الكربون ستيل (P-No. 1) عادةً 595-650 مئوية لمدة ساعة لكل 25 مم (حد أدنى 15 دقيقة). سبائك P91 (P-No. 15E) حساسة جداً (نطاق ضيق ~ 750-775 مئوية) وتجاوز درجة AC1 يدمر خصائص الزحف والصلادة.',
      '- التحقق الميداني: تأكد من توزيع المزدوجات الحرارية Thermocouples بين أعلى وأسفل الماسورة، عرض نطاق التسخين، وعزل التمدد الحراري.',
    ].join('\n'),
  },
  software_architecture: {
    en: [
      '[PLAYBOOK: Production Software & AI System Architecture]',
      '- Enforce Modular Clean Boundaries: Separate Shared Contracts/Validators, Pure Domain Logic, Server API Gateways (keys strictly server-side in process.env), and Stateless/Hook-driven UI components.',
      '- Security-by-Default: Parameterized queries, strict MIME & byte-size validation, zero raw HTML injection (use structured AST/React rendering), URL scheme allowlisting (http/https only).',
      '- Algorithmic Rigor: Explicitly state Time/Space Big-O complexity, edge cases (null/empty/concurrency/abort/quota), and failure recovery without swallowing real upstream errors.',
    ].join('\n'),
    ar: [
      '[مجموعة تدريب: معمارية البرمجيات وأنظمة الذكاء الحديثة]',
      '- الفصل الطبقي النظيف: فصل العقود والتحقق (Contracts/Validators)، منطق الأعمال الصافي، بوابات الخادم الآمنة (عدم كشف المفاتيح للمتصفح مطلقاً)، وواجهات React المعيارية.',
      '- الأمان الافتراضي: التحقق الصارم من المدخلات والملفات والروابط (http/https فقط)، عدم حقن HTML خام، وتمرير الأخطاء الحقيقية للواجهة.',
      '- التحليل الخوارزمي: توضيح التعقيد الزمني/المكاني Big-O ومعالجة الحالات الحدية (التوقف المفاجئ، الإلغاء، الفراغ، الأخطاء المتزامنة).',
    ].join('\n'),
  },
  executive_reports: {
    en: [
      '[PLAYBOOK: Executive Engineering Deliverables & Decision Memos]',
      'Structure formal reports as: 1) Executive Bottom-Line Decision, 2) Scope & Governing Standards Table, 3) Quantitative Findings & Risk Matrix (High/Medium/Low), 4) Corrective Action Plan with Owner & Verification Gate.',
    ].join('\n'),
    ar: [
      '[مجموعة تدريب: التقارير التنفيذية والمذكرات الهندسية المعتمدة]',
      'نظّم التقارير الرسمية كالتالي: 1) الخلاصة التنفيذية والقرار المباشر، 2) جدول النطاق والمعايير الحاكمة، 3) النتائج الكمية ومصفوفة المخاطر، 4) خطة الإجراءات التصحيحية وبوابة التحقق.',
    ].join('\n'),
  },
};

const REFERENCE_FEW_SHOT_AR = [
  'أمثلة مرجعية معايرة لمنطقية الإجابة وبنائها:',
  'مثال (حساب فحص هندسي):',
  '- المستخدم: "احسب عدم الحدة الهندسي Ug لمصدر 2 مم، سمك ماسورة 18 مم، مسافة مصدر-فيلم SFD = 450 مم حسب ASME Sec. V."',
  '- البنية المثالية: [1] المعادلة القياسية أولاً: Ug = (F × d) / D حيث D = SFD - d | [2] استخلاص المعطيات والافتراضات (F=2, d=18, D=432) | [3] التعويض الرقمي والتحقق من الوحدات (Ug = 36 / 432 = 0.083 مم) | [4] مقارنة بحد الكود (< 0.51 مم ← مطابق هندسياً مع التنويه لضرورة مراجعة الإجراء المعتمد PQR/WPS).',
].join('\n');

const REFERENCE_FEW_SHOT_EN = [
  'Calibrated Few-Shot Structure Exemplar:',
  'Example (Quantitative Engineering Query):',
  '- User: "Compute geometric unsharpness Ug for a 2mm source, 18mm wall, SFD = 450mm per ASME Sec. V."',
  '- Ideal Logic Structure: [1] Governing Equation: Ug = (F * d) / D, D = SFD - d | [2] Explicit Assumptions & Units | [3] Arithmetic Evaluation & Sanity Check (Ug = 36 / 432 = 0.083 mm) | [4] Compliance Verdict (< 0.51 mm limit -> Acceptable, subject to qualified written procedure).',
].join('\n');

export function selectAdaptiveArchitecture(
  message: string,
  requested: ChatGptReasoningArchitecture | undefined,
  mode: ChatGptTaskMode,
  hasVerifyTarget: boolean
): Exclude<ChatGptReasoningArchitecture, 'auto'> {
  if (hasVerifyTarget) return 'chain_of_verification';
  if (requested && requested !== 'auto') return requested;

  const q = message.toLowerCase();
  if (
    /قارن|مقارنة|أيهما أفضل|أفضل خيار|compare|vs\.?|versus|trade[- ]?off|choose between|architecture|معمارية|اختيار/.test(
      q
    )
  ) {
    return 'tree_of_thoughts';
  }
  if (
    /تحقق|دقق|راجع|هل هذا صحيح|verify|audit|validate|check code|flaw|خطأ في|bug|review/.test(q) ||
    mode === 'deep_research'
  ) {
    return 'chain_of_verification';
  }
  if (
    /احسب|معادلة|اشتق|فيزياء|كثافة|سماكة|ضغط|calculate|formula|derive|equation|ug|snell|pwht|thermal/.test(
      q
    ) ||
    mode === 'thinking'
  ) {
    return 'first_principles';
  }
  if (
    /علمني|اشرح لي من الصفر|تدريب|امتحان|سؤال تدريبي|teach me|explain step|quiz|level iii/.test(q)
  ) {
    return 'socratic_tutor';
  }
  if (
    /خطوات|خطة|ابني|صمم|برمج|كود|اكتب برنامج|implement|build|debug|pipeline|roadmap/.test(q) ||
    mode === 'code_analyst'
  ) {
    return 'react_planner';
  }
  return 'chain_of_verification';
}

export function buildArchitectureBlueprint(
  arch: Exclude<ChatGptReasoningArchitecture, 'auto'>,
  lang: AgentLanguage,
  selfVerifyPass: boolean
): string {
  const isAr = lang === 'ar';
  const blueprints: Record<Exclude<ChatGptReasoningArchitecture, 'auto'>, { ar: string; en: string }> = {
    first_principles: {
      ar: [
        'هيكل التفكير النشط: [التفكير من المبادئ الأولى — First-Principles Decomposition]',
        '1) فكك المسألة إلى قوانينها الفيزيائية/الرياضية الأساسية أو قواعدها الحاكمة قبل اقتراح أي حل.',
        '2) اكتب الفرضيات الصريحة وحدود الصلاحية والوحدات القياسية بوضوح.',
        '3) تدرج في الاشتقاق أو الحساب خطوة بخطوة مع فحص منطقية الأبعاد والنتائج الحدية.',
        '4) اختم بخلاصة عملية قابلة للتطبيق الميداني.',
      ].join('\n'),
      en: [
        'ACTIVE REASONING ARCHITECTURE: [First-Principles Decomposition]',
        '1) Break the problem down to fundamental physical equations, governing constraints, or axiomatic specs before proposing solutions.',
        '2) State explicit assumptions, boundary conditions, and measurement units.',
        '3) Execute step-by-step derivation/calculation with dimensional & magnitude sanity checks.',
        '4) Deliver a crisp actionable engineering conclusion.',
      ].join('\n'),
    },
    chain_of_verification: {
      ar: [
        'هيكل التفكير النشط: [سلسلة التحقق الذاتي — Chain-of-Verification (CoVe)]',
        '1) صُغ الفرضية أو الإجابة الأولية داخلياً.',
        '2) اختبر كل ادعاء ورقم ومعادلة وبند كود ضد أسئلة تحقق مستقلة (هل هناك استثناء؟ هل الرقم منطقي؟ هل الشرط مفقود؟).',
        '3) احذف أي ادعاء غير مؤكد واستبدله بتأطير دقيق.',
        '4) اعرض النتيجة المُدقّقة النهائية منظمةً بوضوح، مع ذكر الفرضيات أو نقاط التحقق الميداني.',
      ].join('\n'),
      en: [
        'ACTIVE REASONING ARCHITECTURE: [Chain-of-Verification (CoVe)]',
        '1) Formulate the baseline thesis internally.',
        '2) Run independent verification checks on every equation, number, code clause, and edge case.',
        '3) Prune unverified assumptions or ambiguous claims.',
        '4) Output the verified final answer clearly, separating proven facts from items requiring procedure/site verification.',
      ].join('\n'),
    },
    tree_of_thoughts: {
      ar: [
        'هيكل التفكير النشط: [شجرة الأفكار ومصفوفة المفاضلة — Tree-of-Thoughts Matrix]',
        '1) استعرض 3 مسارات/خيارات هندسية أو برمجية بديلة لحل المشكلة.',
        '2) قيّم كل مسار عبر جدول مقارنة يغطي: السلامة والامتثال للكود، الدقة/احتمالية الكشف POD، التكلفة/الزمن، وسهولة التنفيذ.',
        '3) استبعد المسارات الأضعف مع بيان سبب الرفض، ثم حدد المسار الأمثل وخطة تنفيذه.',
      ].join('\n'),
      en: [
        'ACTIVE REASONING ARCHITECTURE: [Tree-of-Thoughts Evaluation Matrix]',
        '1) Generate 3 distinct candidate solution paths.',
        '2) Score each branch in a Markdown comparison table across Compliance/Safety, Accuracy/POD, Cost/Latency, and Execution Risk.',
        '3) Prune inferior branches explicitly and present the winning path with implementation steps.',
      ].join('\n'),
    },
    react_planner: {
      ar: [
        'هيكل التفكير النشط: [التخطيط التنفيذي المراحل — ReAct Plan-Execute-Verify]',
        '1) الهدف والمخرجات: حدد النتيجة المطلوبة بدقة.',
        '2) التحليل وتجهيز الأدوات: حدد البيانات أو الأدوات اللازمة (مثل بحث الويب، لوحة Canvas، أو أدوات INSCO).',
        '3) التنفيذ المتسلسل: أنشئ الحل كاملاً (كود، خطة، أو إجراء) مع معالجة الحالات الحدية والأخطاء.',
        '4) قائمة تحقق الجودة: أضف اختباراً أو مؤشرات قبول نهائية.',
      ].join('\n'),
      en: [
        'ACTIVE REASONING ARCHITECTURE: [ReAct Plan-Execute-Verify]',
        '1) Goal & Deliverables: Lock exact requirements and constraints.',
        '2) Evidence & Tools: Gather grounding context or invoke Canvas / Search / INSCO tools cleanly.',
        '3) Complete Execution: Produce clean modular code or a phased engineering workflow handling edge cases.',
        '4) Verification Checklist: Close with concrete validation checks.',
      ].join('\n'),
    },
    socratic_tutor: {
      ar: [
        'هيكل التفكير النشط: [المعلم التشخيصي التفاعلي — Socratic Guided Reasoning]',
        '1) قدّم تفسيراً واضحاً ومباشراً للمفهوم مع مثال رقمي تطبيقي قصير.',
        '2) حدد الأخطاء الشائعة التي يقع فيها المهندسون/المتدربون في هذا الموضوع.',
        '3) اختم بسؤال تشخيصي واحد أو خطوتين عملية لتعميق الفهم.',
      ].join('\n'),
      en: [
        'ACTIVE REASONING ARCHITECTURE: [Socratic Diagnostic Tutor]',
        '1) Explain the core mechanism intuitively with one concise worked example.',
        '2) Highlight common misconceptions or field pitfalls.',
        '3) Conclude with one targeted diagnostic check question to reinforce mastery.',
      ].join('\n'),
    },
  };

  const verifyGuard = selfVerifyPass
    ? isAr
      ? '\nبروتوكول تدقيق منطقية الرد (Self-Audit): قبل الإخراج، تأكد من: (أ) عدم وجود تناقض رقمي أو منطقي، (ب) عدم اختراع رقم بند كود أو قيمة غير مؤكدة، (ج) التمييز بين «الحقيقة المحسوبة/الموثقة» و«المتطلب الإجرائي الواجب مراجعته».'
      : '\nSELF-AUDIT LOGIC GATE: Before emitting text, verify (a) zero arithmetic/logical contradictions, (b) zero invented code clause numbers or citations, (c) explicit separation between verified calculation/fact vs. site-specific procedure confirmation.'
    : '';

  return `${blueprints[arch][isAr ? 'ar' : 'en']}${verifyGuard}`;
}

export function buildResponseLogicContract(
  lang: AgentLanguage,
  style: ChatGptResponseStyle | undefined
): string {
  const isAr = lang === 'ar';
  const styleLine =
    style === 'concise'
      ? isAr
        ? 'الإيجاز التنفيذي: قدّم الخلاصة المباشرة في نقاط وجدول دون حشو.'
        : 'Concise Executive Style: Deliver the bottom line upfront with tight bullets and tables.'
      : style === 'detailed'
      ? isAr
        ? 'التعمق الشامل: قدّم تحليلاً تقنياً عميقاً بالأدلة والجداول والمعادلات.'
        : 'Deep Comprehensive Style: Provide thorough technical breakdowns, tables, equations, and caveats.'
      : style === 'step_by_step'
      ? isAr
        ? 'التسلسل المرقّم: صُغ الحل في خطوات منطقية مرقمة واضحة.'
        : 'Step-by-Step Style: Structure every stage into clear numbered steps.'
      : isAr
      ? 'التوازن الاحترافي: ابدأ بالخلاصة المباشرة (BLUF) ثم التحليل المهيكل والمراجع.'
      : 'Balanced Precision: Start with the Bottom-Line-Up-Front (BLUF), followed by structured analysis and references.';

  return isAr
    ? [
        'عقد منطقية الرد وجودة الصياغة:',
        `- ${styleLine}`,
        '- ابدأ مباشرة بجوهر الإجابة بدون مقدمات مجاملة أو إعادة صياغة السؤال.',
        '- استخدم تنسيق Markdown غنياً (عناوين فرعية واضحة، جداول مقارنة، وكتل كود محددة اللغة).',
        '- تحلَّ بالانضباط المعرفي (Epistemic Honesty): إذا كان البند الدقيق يتطلب نسخة كود محددة أو إجراء عميل مكتوباً لم يُرفق، صرّح بذلك بوضوح أو استعن ببحث الويب عند تفعيله بدلاً من التخمين.',
      ].join('\n')
    : [
        'RESPONSE LOGIC & STRUCTURAL CONTRACT:',
        `- ${styleLine}`,
        '- Lead with the core answer immediately (BLUF); omit filler pleasantries or restating the prompt.',
        '- Use clean rich Markdown (clear headings, Markdown tables for comparisons/parameters, fenced code blocks with language tags).',
        '- Epistemic Discipline: never guess exact clause numbers or acceptance values without grounding; state assumptions and scope boundaries explicitly.',
      ].join('\n');
}

export function formatLibraryRagContext(hits: SearchHit[], lang: AgentLanguage): string {
  if (!hits.length) return '';
  const topHits = hits.slice(0, 4);
  const blocks: string[] = [];
  let charBudget = 2800;

  for (const hit of topHits) {
    const doc = hit.document;
    const title = doc.title[lang] || doc.title.ar || doc.title.en;
    const rawText = (doc.text[lang] || doc.text.ar || doc.text.en || '')
      .replace(/\s+/g, ' ')
      .trim();
    const slice = rawText.slice(0, Math.min(700, charBudget));
    if (slice.length < 30) continue;
    blocks.push(
      `[${doc.id}] ${title}${doc.pageNumber ? ` (${doc.bookId} p.${doc.pageNumber})` : ''}\n${slice}`
    );
    charBudget -= slice.length;
    if (charBudget <= 0) break;
  }

  if (blocks.length === 0) return '';
  const header =
    lang === 'ar'
      ? 'مقتطفات مرجعية مسترجعة من مكتبة INSCO الهندسية المراجَعة (استرشد بها واستشهد بمعرّفاتها عند الاقتباس):'
      : 'Retrieved Grounding Passages from Reviewed INSCO Engineering Library (reference passage IDs cleanly when citing):';
  return `${header}\n${blocks.join('\n---\n')}`;
}

export function buildTrainedKnowledgeContext(params: {
  packs: ChatGptTrainingPack[];
  customFewShots?: ChatGptFewShotExample[];
  libraryHits: SearchHit[];
  lang: AgentLanguage;
}): string {
  const sections: string[] = [];
  const key = params.lang === 'ar' ? 'ar' : 'en';

  for (const pack of params.packs.slice(0, 5)) {
    const text = PACK_KNOWLEDGE[pack]?.[key];
    if (text) sections.push(text);
  }

  sections.push(params.lang === 'ar' ? REFERENCE_FEW_SHOT_AR : REFERENCE_FEW_SHOT_EN);

  if (params.customFewShots && params.customFewShots.length > 0) {
    const formatted = params.customFewShots
      .slice(0, 8)
      .map(
        (ex, idx) =>
          `Custom Trained Rule #${idx + 1}:\nWhen request matches: ${ex.inputPattern}\nFollow this exact structure/logic:\n${ex.expectedStructure}`
      )
      .join('\n\n');
    sections.push(
      params.lang === 'ar'
        ? `[أمثلة التدريب المخصصة من المستخدم — التزم بها بدقة]\n${formatted}`
        : `[USER-TRAINED FEW-SHOT RULES — FOLLOW STRICTLY]\n${formatted}`
    );
  }

  const ragText = formatLibraryRagContext(params.libraryHits, params.lang);
  if (ragText) sections.push(ragText);

  return sections.join('\n\n');
}
