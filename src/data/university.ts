/**
 * جامعة إنسكو الروبوتية للإنشاءات الصناعية — the INSCO Robotic University.
 *
 * "الروبوت الجامعي" that owns the industrial-construction knowledge base:
 * twelve specializations (التخصصات), a pair of internet collector robots per
 * specialization (روبوتات الجمع), a neural cell per specialization plus the
 * central nucleus (الخلايا العصبية والنواة), the Rector that routes the work
 * (رئيس الجامعة الروبوتي), the Organising & Structuring robot that archives
 * everything scientifically (روبوت التنظيم والهيكلة والأرشفة), and «المعمل» —
 * The Lab — the unit that teaches the platform's AI agents (وكيل المنصة).
 *
 * This module is deliberately dependency-free so the browser, the Express
 * gateway and the tests all share one source of truth. It holds the *reviewed
 * seed* of the university (see `universityKnowledge.ts` for the documented
 * records) — it never invents numbers: every count is derived from the arrays
 * below with the helper functions at the bottom.
 *
 * Honesty contract (same posture as the rest of the academy):
 *   1. Anything collected live from the internet lands as `pending-review`
 *      and is never presented as an approved reference until a qualified
 *      reviewer signs it off.
 *   2. If no AI gateway (GEMINI_API_KEY) is configured, the collectors say so
 *      and serve the reviewed seed instead of pretending to have browsed.
 *   3. The Lab emits *drafts* for platform agents; it does not certify them.
 */

export type UniversityLanguage = 'ar' | 'en';

/* ------------------------------- sources ---------------------------------- */

export interface UniversitySource {
  /** Human-readable document name, e.g. "ASME BPVC Section VIII Div 1". */
  title: string;
  publisher: string;
  /** https only — enforced by `normaliseUniversitySource`. */
  url: string;
}

/* ----------------------------- departments -------------------------------- */

export interface UniversityDepartment {
  id: string;
  /** Three-letter archive code used in archival numbers (INSCO-IND-<CODE>-NNN). */
  code: string;
  ar: string;
  en: string;
  taglineAr: string;
  taglineEn: string;
  /** المحاور / tracks inside the specialization. */
  tracksAr: string[];
  tracksEn: string[];
  /** lucide-react icon key, mapped in the UI layer. */
  icon: string;
  color: string;
}

export const UNIVERSITY_DEPARTMENTS: readonly UniversityDepartment[] = [
  {
    id: 'science',
    code: 'SCI',
    ar: 'العلوم الأساسية والتطبيقية',
    en: 'Fundamental & Applied Sciences',
    taglineAr: 'الفيزياء والكيمياء وجيولوجيا المنشآت — أساس كل مادة هندسية في الجامعة.',
    taglineEn: 'Physics, chemistry and site geology — the base of every engineering subject.',
    tracksAr: ['الفيزياء التطبيقية', 'الكيمياء الصناعية والتآكل', 'انتقال الحرارة والديناميكا', 'جيولوجيا وميكانيكا التربة'],
    tracksEn: ['Applied physics', 'Industrial chemistry & corrosion', 'Heat transfer & thermodynamics', 'Site geology & soil mechanics'],
    icon: 'flask',
    color: '#38bdf8',
  },
  {
    id: 'engineering',
    code: 'ENG',
    ar: 'الهندسة',
    en: 'Engineering',
    taglineAr: 'إنشائية · ميكانيكية · كهربائية — تصميم المنشآت والأوعية والماكينات الصناعية.',
    taglineEn: 'Structural · mechanical · electrical — design of plants, vessels and machines.',
    tracksAr: ['الهندسة الإنشائية المعدنية والخرسانية', 'هندسة الإجهاد والأوعية تحت الضغط', 'الهندسة الميكانيكية للمعدات', 'الهندسة الكهربائية والآلات الدوارة'],
    tracksEn: ['Steel & concrete structural design', 'Pressure-vessel & piping stress', 'Mechanical equipment design', 'Electrical & rotating machines'],
    icon: 'ruler',
    color: '#f59e0b',
  },
  {
    id: 'mathematics',
    code: 'MTH',
    ar: 'الرياضيات',
    en: 'Mathematics',
    taglineAr: 'تفاضل وتكامل، معادلات تفاضلية، إحصاء وهندسة — لغة التحقق من كل تصميم.',
    taglineEn: 'Calculus, differential equations, statistics and geometry — the verification language of every design.',
    tracksAr: ['التفاضل والتكامل', 'المعادلات التفاضلية', 'الإحصاء ومراقبة الجودة SPC', 'الهندسة التحليلية والإحداثية'],
    tracksEn: ['Differential & integral calculus', 'Differential equations', 'Statistics & SPC', 'Analytic & coordinate geometry'],
    icon: 'sigma',
    color: '#a78bfa',
  },
  {
    id: 'algebra',
    code: 'ALG',
    ar: 'الجبر والرياضيات التطبيقية',
    en: 'Algebra & Applied Mathematics',
    taglineAr: 'جبر خطي، مصفوفات، متجهات وجبر بولياني — قلب تحليل العناصر المحدودة والبرمجة.',
    taglineEn: 'Linear algebra, matrices, vectors and Boolean algebra — the core of FEA and software.',
    tracksAr: ['الجبر الخطي والفضاءات المتجهية', 'المصفوفات وأنظمة المعادلات', 'التحليل التنسوري للإجهادات', 'الجبر البولياني وبوابات المنطق'],
    tracksEn: ['Linear algebra & vector spaces', 'Matrices & linear systems', 'Tensor stress analysis', 'Boolean algebra & logic gates'],
    icon: 'braces',
    color: '#34d399',
  },
  {
    id: 'materials',
    code: 'MAT',
    ar: 'علوم المواد والمعادن واللحام',
    en: 'Materials, Metallurgy & Welding',
    taglineAr: 'فولاذات الكربون والسبائك، المعالجة الحرارية، والبنية المجهرية الملحومة.',
    taglineEn: 'Carbon & alloy steels, heat treatment and the welded microstructure.',
    tracksAr: ['تصنيف فولاذات P-Number', 'اختيار المواد للبيئات المسببة للتآكل', 'علم معادن اللحام', 'الفحص الميكانيكي (شد · صلادة · صدم)'],
    tracksEn: ['P-Number steel families', 'Material selection in corrosive service', 'Weld metallurgy', 'Mechanical testing (tension · hardness · impact)'],
    icon: 'layers',
    color: '#fb7185',
  },
  {
    id: 'construction',
    code: 'CON',
    ar: 'علوم الإنشاء والتركيب الصناعي',
    en: 'Industrial Construction & Erection Sciences',
    taglineAr: 'من الأساس وحتى التشغيل: الهياكل، المواسير، اللحام الميداني والتركيب.',
    taglineEn: 'From foundations to commissioning: structures, piping, field welding and erection.',
    tracksAr: ['الأساسات والخرسانة الإنشائية', 'المواسير الصناعية ASME B31.3', 'الإنشاء المعدني والتركيب الميداني', 'إدارة موقع الإنشاء والجدولة الزمنية'],
    tracksEn: ['Foundations & structural concrete', 'Industrial piping ASME B31.3', 'Steel erection & field assembly', 'Site management & scheduling'],
    icon: 'hard-hat',
    color: '#fbbf24',
  },
  {
    id: 'standards',
    code: 'STD',
    ar: 'علوم الأكواد والمعايير',
    en: 'Codes & Standards Sciences',
    taglineAr: 'ASME · API · AWS · ISO · EN · ASTM — قراءة الكود، تطبيق بنوده وتوثيقه.',
    taglineEn: 'ASME · API · AWS · ISO · EN · ASTM — reading the code, applying its clauses, proving it.',
    tracksAr: ['ASME BPVC و B31 سلسلة الأنابيب', 'API 510 / 570 / 653 للإصلاح والفحص', 'تأهيل اللحام وإجراءاته ASME IX · AWS D1.1', 'أنظمة الجودة والبيئة والسلامة ISO 9001/14001/45001'],
    tracksEn: ['ASME BPVC & B31 piping series', 'API 510 / 570 / 653 inspection & repair', 'Welding qualifications ASME IX · AWS D1.1', 'QMS / EMS / OHSMS ISO 9001·14001·45001'],
    icon: 'scroll-text',
    color: '#e879f9',
  },
  {
    id: 'hse',
    code: 'HSE',
    ar: 'علوم السلامة والصحة المهنية والبيئة',
    en: 'Health, Safety & Environment',
    taglineAr: 'تصاريح العمل، الأماكن المحصورة، العمل الساخن، وخطط الطوارئ في المصانع.',
    taglineEn: 'Permits, confined spaces, hot work and emergency plans in plants.',
    tracksAr: ['ISO 45001 ونظام إدارة السلامة', 'تصاريح العمل الساخن والأماكن المحصورة', 'الرفع والأعمال الثقيلة', 'البيئة والانبعاثات وإدارة النفايات'],
    tracksEn: ['ISO 45001 OHS management', 'Hot work & confined-space permits', 'Lifting & heavy rigging', 'Environment, emissions & waste'],
    icon: 'shield-check',
    color: '#4ade80',
  },
  {
    id: 'nde',
    code: 'NDE',
    ar: 'علوم الفحص والاختبار غير التدميري',
    en: 'Non-Destructive Examination Sciences',
    taglineAr: 'RT · UT · MT · PT · ET وتأهيل الأفراد ISO 9712 و ASNT SNT-TC-1A.',
    taglineEn: 'RT · UT · MT · PT · ET and personnel qualification ISO 9712 · ASNT SNT-TC-1A.',
    tracksAr: ['فيزياء الفحص الإشعاعي والفوق صوتي', 'ISO 9712 و ASNT SNT-TC-1A للتأهيل', 'اختيار طريقة الفحص المناسبة', 'تفسير المؤشرات والقرار الهندسي'],
    tracksEn: ['RT & UT physics', 'ISO 9712 · ASNT SNT-TC-1A qualification', 'Method selection', 'Indication interpretation & engineering calls'],
    icon: 'scan-line',
    color: '#22d3ee',
  },
  {
    id: 'programming',
    code: 'PRG',
    ar: 'علوم البرمجة والحاسوب والذكاء الاصطناعي',
    en: 'Programming, Computer Science & AI',
    taglineAr: 'بايثون، قواعد البيانات، واجهات BIM/CAD ووكلاء الذكاء الاصطناعي للهندسة.',
    taglineEn: 'Python, databases, BIM/CAD APIs and engineering AI agents.',
    tracksAr: ['بايثون للهندسة والأتمتة', 'قواعد البيانات وأرشفة الشهادات', 'واجهات BIM وCAD وIFC', 'وكلاء الذكاء الاصطناعي وRAG'],
    tracksEn: ['Python for engineering & automation', 'Databases & certificate archiving', 'BIM / CAD / IFC APIs', 'AI agents & RAG'],
    icon: 'code-2',
    color: '#818cf8',
  },
  {
    id: 'pr',
    code: 'PR',
    ar: 'علوم العلاقات العامة',
    en: 'Public Relations Sciences',
    taglineAr: 'الاتصال المؤسسي، إدارة السمعة، وإدارة الأزمة في الشركات الصناعية.',
    taglineEn: 'Corporate communication, reputation and crisis management for industrial firms.',
    tracksAr: ['استراتيجية الاتصال المؤسسي', 'إدارة السمعة والإعلام الصناعي', 'الاتصال في الأزمات الصناعية', 'الفعاليات والمعارض والعلاقات الحكومية'],
    tracksEn: ['Corporate communication strategy', 'Reputation & trade-press relations', 'Industrial crisis communication', 'Events, exhibitions & government affairs'],
    icon: 'megaphone',
    color: '#f472b6',
  },
  {
    id: 'marketing',
    code: 'MKT',
    ar: 'علوم التسويق الصناعي',
    en: 'Industrial Marketing Sciences',
    taglineAr: 'B2B، دورة بيع هندسية طويلة، تسويق بالمحتوى التقني وطلب عروض الأسعار.',
    taglineEn: 'B2B, the long engineering sales cycle, technical content and RFQs.',
    tracksAr: ['التسويق الصناعي B2B', 'التسويق بالمحتوى التقني (White Papers)', 'إدارة عروض الأسعار والعروض الفنية', 'المعارض الصناعية وتوليد الفرص'],
    tracksEn: ['Industrial B2B marketing', 'Technical content marketing (white papers)', 'RFQ & technical proposals', 'Trade shows & lead generation'],
    icon: 'target',
    color: '#fb923c',
  },
] as const;

const departmentIndex = new Map(UNIVERSITY_DEPARTMENTS.map(department => [department.id, department]));

export function departmentById(id: string): UniversityDepartment | undefined {
  return departmentIndex.get(id);
}

export function isUniversityDepartmentId(value: string): boolean {
  return departmentIndex.has(value);
}

/* -------------------------------- agents ---------------------------------- */

export type UniversityAgentKind =
  | 'rector'
  | 'archivist'
  | 'lab'
  | 'nucleus'
  | 'collector'
  | 'neural-cell';

export interface UniversityAgent {
  id: string;
  kind: UniversityAgentKind;
  ar: string;
  en: string;
  mandateAr: string;
  mandateEn: string;
  /** Set for collectors and neural cells; undefined for the central units. */
  departmentId?: string;
  status: 'active';
}

/** Central units: the Rector, the Organising robot, the Lab and the Nucleus. */
export const UNIVERSITY_CENTRAL_AGENTS: readonly UniversityAgent[] = [
  {
    id: 'rector',
    kind: 'rector',
    ar: 'العميد — الرئيس الجامعي الروبوتي',
    en: 'The Rector — Robotic University President',
    mandateAr: 'يوجّه مهام الجمع والمذاكرة والمراجعة بين الأقسام الاثني عشر، ويوازن بين «جمع العلم من الإنترنت» و«سلامة مراجعة المحتوى»، ويعلن أولويات كل موسم علمي.',
    mandateEn: 'Routes collection, synthesis and review tasks across the twelve departments, balancing open-internet harvesting against human review, and sets each academic season’s priorities.',
    status: 'active',
  },
  {
    id: 'archivist',
    kind: 'archivist',
    ar: '«المُنظِّم» — روبوت التنظيم والهيكلة والأرشفة',
    en: '“The Organiser” — Organising & Structuring Robot',
    mandateAr: 'يحوّل كل سجل علمي خام إلى بطاقة أرشيف علمية: كود أرشفة ثابت (INSCO-IND-…)، تصنيف حسب القسم والمحور، فحص الاكتمال والاستشهادات، وفهرسة قابلة للبحث. لا يعتمد سجلًا بلا مصدر موثق.',
    mandateEn: 'Turns every raw record into a scientific archive card: stable archive code (INSCO-IND-…), department/track classification, completeness & citation checks, searchable indexing. Nothing without a documented source is ever approved.',
    status: 'active',
  },
  {
    id: 'nucleus',
    kind: 'nucleus',
    ar: 'النواة المركزية — خلية الربط العصبي',
    en: 'The Nucleus — Central Neural Binding Cell',
    mandateAr: 'تربط خلايا الأقسام الاثنتي عشرة ببعضها: تُكتشف العلاقات بين الأقسام (مثل: إجهاد ↔ لحام ↔ كود)، وتمنع تكرار المعرفة، وتُصدر خريطة «من يقرأ ماذا» لكل وكيل في المنصة.',
    mandateEn: 'Binds the twelve departmental cells: discovers cross-department relations (stress ↔ welding ↔ code), prevents duplicated knowledge, and issues the «who-reads-what» map for every platform agent.',
    status: 'active',
  },
  {
    id: 'lab',
    kind: 'lab',
    ar: '«المعمل» — وحدة تعليم وكلاء الذكاء الاصطناعي',
    en: '“The Lab” — AI-Agent Teaching Unit',
    mandateAr: 'يأخذ المعرفة المعتمدة من الأرشيف ويحوّلها إلى «حزم تعليم وكلاء»: ديباجة نظام، خلاصة علمية، أسئلة وإجابات للمراقبة، وحدود وأمانات — جاهزة لمراجعتها ثم حقنها في وكلاء INSCO (المستشار، وكيل ChatGPT، مجتمع INSCO…).',
    mandateEn: 'Takes approved archive knowledge and turns it into «agent teaching packs»: system preamble, scientific digest, evaluation Q&A and guardrails — ready to review, then inject into INSCO agents (the tutor, the ChatGPT agent, INSCO Community…).',
    status: 'active',
  },
] as const;

/** Per-department collection topics. Two collectors per department, by design. */
const COLLECTOR_TOPICS: Record<string, { standardsAr: string; standardsEn: string; researchAr: string; researchEn: string }> = {
  science: { standardsAr: 'جامع المعايير والتجارب المعتمدة', standardsEn: 'Standards & certified experiments collector', researchAr: 'جامع الدوريات والأبحاث', researchEn: 'Journals & research collector' },
  engineering: { standardsAr: 'جامع أكواد التصميم الهندسي', standardsEn: 'Design-code collector', researchAr: 'جامع أبحاث وتقارير التصميم', researchEn: 'Design research & reports collector' },
  mathematics: { standardsAr: 'جامع المرجعيات الرياضية الرسمية', standardsEn: 'Official mathematics references collector', researchAr: 'جامع أوراق الطرق العددية', researchEn: 'Numerical-methods papers collector' },
  algebra: { standardsAr: 'جامع مرجعيات الجبر الخطي والأولي', standardsEn: 'Linear & abstract algebra references collector', researchAr: 'جامع تطبيقات FEA والجبر الحاسوبي', researchEn: 'FEA & computer-algebra applications collector' },
  materials: { standardsAr: 'جامع مواصفات المواد ASTM/ASME', standardsEn: 'ASTM/ASME materials specs collector', researchAr: 'جامع أبحاث علم معادن اللحام', researchEn: 'Welding metallurgy research collector' },
  construction: { standardsAr: 'جامع أكواد الإنشاء والتركيب', standardsEn: 'Construction & erection codes collector', researchAr: 'جامع حالات التركيب والممارسة الميدانية', researchEn: 'Field erection practice collector' },
  standards: { standardsAr: 'جامع نصوص الأكواد الأصلية', standardsEn: 'Original code-text collector', researchAr: 'جامع التفسيرات والفتاوى الفنية', researchEn: 'Interpretations & technical rulings collector' },
  hse: { standardsAr: 'جامع لوائح ومعايير السلامة', standardsEn: 'Safety regulations & standards collector', researchAr: 'جامع تقارير الحوادث والدروس المستفادة', researchEn: 'Incident reports & lessons-learned collector' },
  nde: { standardsAr: 'جامع معايير NDT للأفراد والإجراءات', standardsEn: 'NDT personnel & procedure standards collector', researchAr: 'جامع أبحاث تقنيات الفحص', researchEn: 'Examination techniques research collector' },
  programming: { standardsAr: 'جامع التوثيق الرسمي للغات والمكتبات', standardsEn: 'Official language & library docs collector', researchAr: 'جامع أوراق الذكاء الاصطناعي للهندسة', researchEn: 'Engineering-AI papers collector' },
  pr: { standardsAr: 'جامع أدبيات الاتصال المؤسسي المعتمدة', standardsEn: 'Accredited corporate-communication literature collector', researchAr: 'جامع دراسات حالات السمعة والأزمات', researchEn: 'Reputation & crisis case-study collector' },
  marketing: { standardsAr: 'جامع منهجيات التسويق الصناعي الموثقة', standardsEn: 'Documented industrial-marketing methodology collector', researchAr: 'جامع أبحاث B2B وشراء السلع الرأسمالية', researchEn: 'B2B capital-goods research collector' },
};

function collectorsFor(department: UniversityDepartment): UniversityAgent[] {
  const topic = COLLECTOR_TOPICS[department.id];
  return [
    {
      id: `collector-${department.id}-codes`,
      kind: 'collector',
      ar: `${topic.standardsAr} — ${department.ar}`,
      en: `${topic.standardsEn} — ${department.en}`,
      mandateAr: `يجمع من الإنترنت المفتوح: ${topic.standardsAr.replace('جامع ', '')} في تخصص «${department.ar}»، مع توثيق كل سجل برابط HTTPS لناشر أصلي، ويسلمه لوحدة التنظيم والهيكلة قبل أي اعتماد.`,
      mandateEn: `Harvests the open web for ${topic.standardsEn.replace(' collector', '')} within ${department.en}; every record carries an HTTPS link to the original publisher, and is handed to the Organising robot before approval.`,
      departmentId: department.id,
      status: 'active',
    },
    {
      id: `collector-${department.id}-research`,
      kind: 'collector',
      ar: `${topic.researchAr} — ${department.ar}`,
      en: `${topic.researchEn} — ${department.en}`,
      mandateAr: `يجمع من الإنترنت المفتوح: ${topic.researchAr.replace('جامع ', '')} في تخصص «${department.ar}»، ويفضّل المصادر الأولية (ناشر، جهة اعتماد، مجلة مراجعة) على المدونات، ويوسم أي سجل غير موثق بوضوح.`,
      mandateEn: `Harvests the open web for ${topic.researchEn.replace(' collector', '')} within ${department.en}; primary sources (publisher, accreditor, peer-reviewed journal) are preferred over blogs, and weakly-sourced records are flagged loudly.`,
      departmentId: department.id,
      status: 'active',
    },
  ];
}

export const UNIVERSITY_COLLECTORS: readonly UniversityAgent[] =
  UNIVERSITY_DEPARTMENTS.flatMap(collectorsFor);

export const UNIVERSITY_NEURAL_CELLS: readonly UniversityAgent[] =
  UNIVERSITY_DEPARTMENTS.map(department => ({
    id: `cell-${department.id}`,
    kind: 'neural-cell' as const,
    ar: `الخلية العصبية — ${department.ar}`,
    en: `Neural Cell — ${department.en}`,
    mandateAr: `تذاكر المعرفة الموثقة داخل «${department.ar}»، تدمج المكرر، تكتشف التعارض، ترفع رقم الإصدار، وتُعيد الصياغة علميًا بعد التنظيم — ثم تُرجع السجل كان «قيد المراجعة» حتى يوقّعه مختص.`,
    mandateEn: `Digests the documented knowledge inside ${department.en}: merges duplicates, detects conflicts, bumps versions and re-phrases after organisation — then returns the record as «pending review» until a specialist signs it.`,
    departmentId: department.id,
    status: 'active' as const,
  }));

export const UNIVERSITY_AGENTS: readonly UniversityAgent[] = [
  ...UNIVERSITY_CENTRAL_AGENTS,
  ...UNIVERSITY_COLLECTORS,
  ...UNIVERSITY_NEURAL_CELLS,
];

export function agentsByDepartment(departmentId: string): UniversityAgent[] {
  return UNIVERSITY_AGENTS.filter(agent => agent.departmentId === departmentId);
}

export function agentById(id: string): UniversityAgent | undefined {
  return UNIVERSITY_AGENTS.find(agent => agent.id === id);
}

/* --------------------------- platform AI agents --------------------------- */

/** The platform agents «المعمل» can teach. Kept in one list so UI and Lab agree. */
export const PLATFORM_AGENT_TARGETS = [
  { id: 'tutor', ar: 'المستشار الأكاديمي (الأكاديمية)', en: 'Academic Tutor (Academy)' },
  { id: 'chatgpt-agent', ar: 'وكيل INSCO الذكي (ChatGPT-class)', en: 'INSCO ChatGPT-class Agent' },
  { id: 'community-assist', ar: 'روبوت مجتمع INSCO', en: 'INSCO Community Assist Bot' },
  { id: 'site-manager', ar: 'وكيل إدارة الموقع', en: 'Site Manager Agent' },
  { id: 'user-copilot', ar: 'المساعد الشخصي للمستخدم', en: 'User Copilot' },
] as const;

export type PlatformAgentTargetId = (typeof PLATFORM_AGENT_TARGETS)[number]['id'];

export function isPlatformAgentTarget(value: string): value is PlatformAgentTargetId {
  return (PLATFORM_AGENT_TARGETS as readonly { id: string }[]).some(target => target.id === value);
}

/* ------------------------------- catalog I/O ------------------------------ */

export interface UniversityCatalog {
  departments: readonly UniversityDepartment[];
  centralAgents: readonly UniversityAgent[];
  collectors: readonly UniversityAgent[];
  neuralCells: readonly UniversityAgent[];
  platformTargets: typeof PLATFORM_AGENT_TARGETS;
}

export const UNIVERSITY_CATALOG: UniversityCatalog = {
  departments: UNIVERSITY_DEPARTMENTS,
  centralAgents: UNIVERSITY_CENTRAL_AGENTS,
  collectors: UNIVERSITY_COLLECTORS,
  neuralCells: UNIVERSITY_NEURAL_CELLS,
  platformTargets: PLATFORM_AGENT_TARGETS,
};
