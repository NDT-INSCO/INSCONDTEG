/**
 * الأرشيف العلمي المؤسَّس — the commissioned, documented seed of the Robotic
 * University. Every record below was written against openly published
 * engineering references; each carries at least one HTTPS source from the
 * issuing or documenting body. Records collected later by the internet
 * collectors land in the runtime archive as `pending-review` — they are never
 * silently merged into this reviewed seed.
 *
 * Fixed `updatedAt` dates: the seed is stable; evolution bumps them.
 */

export type KnowledgeStatus = 'reviewed' | 'pending-review';

export interface UniversitySource {
  title: string;
  publisher: string;
  url: string;
}

export interface KnowledgeRecord {
  id: string;
  departmentId: string;
  /** الأرشفة العلمية: INSCO-IND-<DEPT>-<NNN>. Assigned by the Organising robot. */
  code: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  keyPointsAr: string[];
  keyPointsEn: string[];
  formula?: string;
  sources: UniversitySource[];
  status: KnowledgeStatus;
  version: number;
  /** Which agent produced the record. */
  collectedBy: string;
  /** History of neural cells that evolved it (oldest first). */
  evolvedBy: string[];
  updatedAt: string;
}

const COMMISSIONED = '2026-11-24';

export const SEED_KNOWLEDGE: readonly KnowledgeRecord[] = [
  /* ------------------------------- science -------------------------------- */
  {
    id: 'kb-sci-001',
    departmentId: 'science',
    code: 'INSCO-IND-SCI-001',
    titleAr: 'التآكل الكهروكيميائي للمنشآت الصناعية وحمايتها',
    titleEn: 'Electrochemical corrosion in industrial plants and its control',
    summaryAr: 'التآكل الخيطي والأُقارن (pitting) ينشأ من خلية كهروكيميائية: أنود وكاثود يربطهما منحل كهربائي. السيطرة تتم بثلاثية محكمة: مادة مناسبة، حاجز واقٍ، وحماية كاثودية — مع تفريغ المياه لمنع الجيوب.',
    summaryEn: 'Pitting and crevice corrosion grow from an electrochemical cell: anode + cathode joined by an electrolyte. Control is a three-leg strategy: right material, protective barrier, cathodic protection — plus drainage that removes the electrolyte.',
    keyPointsAr: [
      'الخلية المكوّنة من أنود وكاثود ومنحل كهربائي شرط لوجود التآكل؛ قطع أي ركن يُوقفه.',
      'كلوريدات البيئة البحرية تُضاعف نقْر الفولاذ غير القابل للصدأ (Pitting / Chloride SCC).',
      'الحماية الكاثودية: أنودات تضحوية أو تيار مقيد وفق ISO 15589 و AMPP (NACE) SP0169.',
      'اختيار الطلاء حسب فئة التآكل C1–CX في ISO 12944 من شدة البيئة ودرجة الاستعداد للتفتيش وإعادة الطلاء.',
    ],
    keyPointsEn: [
      'Anode + cathode + electrolyte are all required; removing one leg stops the cell.',
      'Marine chlorides multiply pitting and chloride stress-corrosion cracking in stainless steels.',
      'Cathodic protection: sacrificial anodes or impressed current per ISO 15589 and AMPP (NACE) SP0169.',
      'Coatings are selected by the ISO 12944 C1–CX corrosivity class and maintenance/inspection interval.',
    ],
    formula: 'm = (M · I · t) / (n · F)  —  Faraday’s law of mass loss',
    sources: [
      { title: 'Corrosion — overview & mechanisms', publisher: 'Encyclopaedia Britannica / Wikipedia', url: 'https://en.wikipedia.org/wiki/Corrosion' },
      { title: 'ISO 12944 — Paints and varnishes, corrosion protection of steel structures', publisher: 'ISO', url: 'https://www.iso.org' },
      { title: 'AMPP — Association for Materials Protection and Performance (SP0169 & TM-series)', publisher: 'AMPP', url: 'https://www.ampp.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-sci-002',
    departmentId: 'science',
    code: 'INSCO-IND-SCI-002',
    titleAr: 'انتقال الحرارة الثلاثي في الأفران والمبادلات والمواسير',
    titleEn: 'The three modes of heat transfer in furnaces, exchangers and piping',
    summaryAr: 'التوصيل داخل الجدار، والحمل من الجدار إلى المائع، والإشعاع بين الأسطح — كل حسابات سماكة العزل ودرجة حرارة السطح الخارجي تعود لهذه الثلاثية.',
    summaryEn: 'Conduction through the wall, convection from wall to fluid, and radiation between surfaces — every insulation thickness and touch-temperature calculation reduces to this trio.',
    keyPointsAr: [
      'التوصيل: q = k·A·ΔT / L — يُستخدم لحساب سماكة العزل وفقدان الحرارة.',
      'الحمل القسري خارج الأنبوب يُرفع بتقليل قطر الأنبوب أو رفع السرعة — أساس حسابات تبريد الكابلات والمحركات.',
      'الإشعاع يتناسب مع القوة الرابعة لدرجة الحرارة المطلقة (قانون ستيفان–بولتزمان).',
      'درجة حرارة اللمس على سطح خارجي معزول تُحسب من مقاومة التوصيل الداخلية مقابل مقاومة الحمل الخارجية (نصف القطر الحرج).',
    ],
    keyPointsEn: [
      'Conduction q = k·A·ΔT / L — the workhorse for insulation sizing and heat loss.',
      'External forced convection is boosted by smaller tube diameter or higher velocity — the basis of motor & cable cooling checks.',
      'Radiation scales with the fourth power of absolute temperature (Stefan–Boltzmann).',
      'Touch temperature on an insulated surface comes from balancing internal conduction against external convection (critical radius).',
    ],
    formula: 'q = k·A·ΔT / L   ·   q = h·A·ΔT   ·   q = ε·σ·A·(T₁⁴ − T₂⁴)',
    sources: [
      { title: 'Heat transfer — fundamentals', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Heat_transfer' },
      { title: 'MIT OpenCourseWare — Thermal-Fluids Engineering', publisher: 'MIT OCW', url: 'https://ocw.mit.edu' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ----------------------------- engineering ------------------------------ */
  {
    id: 'kb-eng-001',
    departmentId: 'engineering',
    code: 'INSCO-IND-ENG-001',
    titleAr: 'الأوعية المضغوطة وفق ASME BPVC القسم الثامن شعبة 1',
    titleEn: 'Pressure vessels per ASME BPVC Section VIII Division 1',
    summaryAr: 'القطر الرقيق راسياً: t = P·R / (S·E − 0.6·P). الكود لا يصمّم «بأمان» فقط بل يوثّق: التصميم، المواد، الفحص، الاختبار الهيدروليكي وختم U — ومن يفتقد بنداً واحداً سقط الوعاء كاملًا.',
    summaryEn: 'Thin-wall shell: t = P·R / (S·E − 0.6·P). The code does not merely design «with margin» — it documents design, materials, examination, hydrostatic test and the U-stamp; missing one leg voids the vessel.',
    keyPointsAr: [
      'سماكة الجدار المعدنية الحسابية ثم تُضاف بدلات التآكل (Corrosion Allowance) وبدلة التصنيع.',
      'E هو كفاءة وصلة اللحام (1.0 ترقية RT كاملة، 0.85 فحص عشوائي، 0.7 بلا فحص حسب البند UW-12).',
      'اختبار الهيدروليك عند 1.3 ضعف ضغط التصميم (UG-99) مع تخفيف حسب الإجهادات الفعلية.',
      'ختم U الرسمي يُمنح فقط عند اكتمال التصميم–المواد–التصنيع–الفحص–التوثيق لدى مؤسسة معتمدة.',
    ],
    keyPointsEn: [
      'Compute the membrane thickness, then add corrosion allowance and fabrication tolerance.',
      'E is the weld joint efficiency (1.0 full RT, 0.85 spot, 0.7 no RT — UW-12).',
      'Hydrostatic test at 1.3 × design pressure (UG-99), relief by actual stress ratio.',
      'The official U-stamp requires the complete design–materials–fabrication–examination–documentation chain at an Authorized Manufacturer.',
    ],
    formula: 't = (P · R) / (S · E − 0.6 · P)   ·   P_hydro = 1.3 · P_design · (S_test / S_design)',
    sources: [
      { title: 'ASME Boiler & Pressure Vessel Code — Section VIII, Division 1', publisher: 'ASME', url: 'https://www.asme.org/codes-standards' },
      { title: 'Pressure vessel — design & standards overview', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Pressure_vessel' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-eng-002',
    departmentId: 'engineering',
    code: 'INSCO-IND-ENG-002',
    titleAr: 'تصميم الهياكل المعدنية الصناعية (AISC 360 و Eurocode 3)',
    titleEn: 'Industrial steel structures (AISC 360 & EN 1993)',
    summaryAr: 'تصميم العمود لا يكتمل بحساب إجهاد الانحناء فقط: الاستقرار الجانبي–الالتوائي، النحافة الفعّالة، وصلات التدعيم، وحمل الرفع أثناء التركيب كلها بنود تحكم في إطار المصنع.',
    summaryEn: 'A column is not designed by bending stress alone: lateral-torsional buckling, effective slenderness, bracing connections and lift loads during erection all govern the plant frame.',
    keyPointsAr: [
      'Fcr = Fy·(π²E /(KL/r)²) للانبعاج المرن، ومتوسط بين Fy وFe للنطاق غير المرن — AISC E3.',
      'النحافة KL/r تؤثر مباشرة؛ التدعيم الجانبي للعتبات الحرجة يرفع مقاومة LTB جوهريًا.',
      'أحمال التركيب (الرفع، الرياح على الهيكل المفتوح قبل التكسية) حالة تحميل مستقلة لا تُهمل.',
      'EN 1993-1-1 يستخدم منهج الرتبة–المرونة مع معامل γM وتوازن الحدود القصوى بالطريقة الحدّية.',
    ],
    keyPointsEn: [
      'Fcr = Fy·(π²E /(KL/r)²) in the elastic range; a Fcr–Fy transition rule governs the inelastic range — AISC E3.',
      'KL/r drives capacity; lateral bracing at critical points lifts LTB resistance substantially.',
      'Erection loads (lifting, wind on the open frame before cladding) are an independent load case.',
      'EN 1993-1-1 works the partial-factor (γM) limit-state method with section classes 1–4.',
    ],
    formula: 'F_cr = (0.658^(Fy/Fe)) · Fy   ,   Fe = π²E / (KL/r)²   (AISC E3 flexible)',
    sources: [
      { title: 'AISC 360 — Specification for Structural Steel Buildings', publisher: 'AISC', url: 'https://www.aisc.org' },
      { title: 'EN 1993 — Eurocode 3: Design of steel structures', publisher: 'CEN', url: 'https://www.cen.eu' },
      { title: 'Structural steel — materials & design', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Structural_steel' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ----------------------------- mathematics ------------------------------ */
  {
    id: 'kb-mth-001',
    departmentId: 'mathematics',
    code: 'INSCO-IND-MTH-001',
    titleAr: 'المعادلات التفاضلية في اهتزاز المنشآت والمعدات',
    titleEn: 'Differential equations in structural & machine vibration',
    summaryAr: 'كل معادلة اهتزاز مكوّنة واحدة (m·x″ + c·x′ + k·x = F(t)) هي مفتاح ضبط التردد الطبيعي بعيدًا عن ترددات التشغيل والمشي والزلزال — أصغر شروط القبول في الشراء والتركيب.',
    summaryEn: 'The single-mass oscillator (m·x″ + c·x′ + k·x = F(t)) is the key to tuning natural frequencies away from running, walking and seismic frequencies — the cheapest acceptance criterion at procurement and erection.',
    keyPointsAr: [
      'التردد الطبيعي ωn = √(k/m)؛ يجب أن يكون بعيدًا عن تردد الإثارة (معاملات ديناميكية > 20% هامشًا).',
      'نظام مُخمَّد: x(t) تضم C·e^(−ζωt)؛ معامل التخميد ζ < 1 اهتزاز، ζ = 1 حرج، ζ > 1 زاحف.',
      'التوافيق الرنينية تُكشف بمعاينة طيف الاهتزاز — أساس موازنة المراوح والتوربينات والمضخات.',
      'حل المعادلة بالتحويل اللابلاسي يتعامل مع الأحمال المتقطعة وسلوك العزل الزلزالي بمرونة.',
    ],
    keyPointsEn: [
      'Natural frequency ωn = √(k/m); keep it clear of forcing frequencies (≥ ~20% separation margin).',
      'Damped motion x(t) carries C·e^(−ζωt); ζ < 1 oscillatory, ζ = 1 critical, ζ > 1 creep.',
      'Resonance signatures are read from vibration spectra — the basis of fan, turbine and pump balancing.',
      'Laplace transforms handle impulsive loads and base-isolation behaviour cleanly.',
    ],
    formula: 'm·x″ + c·x′ + k·x = F(t)   ·   ω_n = √(k/m)   ·   x″(t) بالمشتقة الثانية للزمن',
    sources: [
      { title: 'Differential equation — theory & solving methods', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Differential_equation' },
      { title: 'NIST Digital Library of Mathematical Functions', publisher: 'NIST', url: 'https://dlmf.nist.gov' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-mth-002',
    departmentId: 'mathematics',
    code: 'INSCO-IND-MTH-002',
    titleAr: 'الإحصاء ومراقبة الجودة الإحصائية (SPC) في الورش والمواصفات',
    titleEn: 'Statistics & Statistical Process Control (SPC) on the shop floor',
    summaryAr: 'بطاقة X̄–R ليست ورقًا رسميًا بل نظام إنذار مبكر: تُخرج العملية غير المنضبطة قبل إنتاج قطعة مرفوضة، وتتحول بعدها إلى قرار قرار بقبول أو إيقاف.',
    summaryEn: 'An X̄–R chart is not paperwork; it is an early-warning system that ejects an uncontrolled process before a scrap part exists, and converts into an accept/stop decision.',
    keyPointsAr: [
      'حدود التحكم = المتوسط ± 3σ؛ نقطة واحدة خارج الحدود أو سبع نقاط متتالية في جهة واحدة = إشارة توقف.',
      'Cp ≥ 1.33 تعني أن العملية تلائم المواصفة مع 4σ هامشًا؛ القرار لا يُبنى على المتوسط وحده.',
      'توزيع البيانات ليس دائمًا طبيعيًا: قِس انحرافه (Skewness) قبل تطبيق قواعد المعالم الثلاثة.',
      'ISO 7870 سلسلة بطاقات المراقبة معيار المرجع؛ ISO 22514 للقدرة.',
    ],
    keyPointsEn: [
      'Control limits = mean ± 3σ; one point outside, or seven in a row on one side, means stop.',
      'Cp ≥ 1.33 fits the specification with a 4σ margin; never decide on the mean alone.',
      'Not all data are normal — check skewness before applying the 3-sigma rules.',
      'ISO 7870 is the control-chart reference series; ISO 22514 covers process capability.',
    ],
    formula: 'CL = X̄̄   ·   UCL/LCL = X̄̄ ± A₂·R̄  (بطاقة X̄–R)   ·   Cp = (USL − LSL) / 6σ',
    sources: [
      { title: 'Statistical process control', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Statistical_process_control' },
      { title: 'ISO 7870 — Control charts series', publisher: 'ISO', url: 'https://www.iso.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* -------------------------------- algebra ------------------------------- */
  {
    id: 'kb-alg-001',
    departmentId: 'algebra',
    code: 'INSCO-IND-ALG-001',
    titleAr: 'الجبر الخطي وعمود الفقرات في تحليل العناصر المحدودة',
    titleEn: 'Linear algebra — the spine of finite element analysis',
    summaryAr: 'مسألة FEA كاملة هي حل [K]{u} = {F}: مصفوفة صلابة عالمية، متجه إزاحات مجهول، متجه أحمال. كل برنامج تحليل إنشائي أو إجهادي يبدأ وينتهي بهذه المعادلة.',
    summaryEn: 'A full FEA problem is exactly [K]{u} = {F} — global stiffness matrix, unknown displacement vector, load vector. Every structural or stress suite begins and ends there.',
    keyPointsAr: [
      'مصفوفات الصلابة موفورة (sparse) وغير متماثلة أحيانًا؛ التخزين بالنطاقات أو CSR هو معيار الأداء.',
      'العزوم الذاتية (eigenvalues) لمصفوفة K مُثبّتة تعطي ترددات التذبذب الطبيعية، واتجاهاتها هي أنماط الأوضاع.',
      'فكك LU أو Cholesky (لهيرميت متماثلة معرفة موجبة) يحل المنظومة مباشرة؛ المتدرجة المترافقة للنماذج الضخمة.',
      'الخطأ العددي لا يأتي من الخوارزمية بل من التمثيل العشري — استخدم float64 لا float32 في أي حساب قبول.',
    ],
    keyPointsEn: [
      'Stiffness matrices are sparse and sometimes unsymmetric; banded or CSR storage is the performance norm.',
      'Eigenvalues of the constrained K give natural frequencies; eigenvectors give the mode shapes.',
      'LU or Cholesky factorisation (symmetric positive-definite) solves the system directly; conjugate gradient for huge models.',
      'Numerical error comes from floating-point representation, not the method — use float64 for acceptance-grade work.',
    ],
    formula: '[K] · {u} = {F}   ·   det([K] − λ[M]) = 0   (الأوضاع والترددات)',
    sources: [
      { title: 'Finite element method', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Finite_element_method' },
      { title: 'Linear algebra — theory and applications', publisher: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-alg-002',
    departmentId: 'algebra',
    code: 'INSCO-IND-ALG-002',
    titleAr: 'المصفوفات والتحويلات الإحداثية للرسومات والمخططات الهندسية',
    titleEn: 'Matrices and coordinate transforms in geometry & CAD',
    summaryAr: 'أي دوران لنقطة ثلاثية الأبعاد حول محور هو ضرب في مصفوفة دوران؛ وأي نقل هو جمع متجه. رسومات BIM/CAD كلها عمليات مصفوفية بحتة تحت الغطاء.',
    summaryEn: 'Rotating a 3-D point about an axis is a matrix product; translation is a vector add. Under the hood every BIM/CAD drawing is pure matrix work.',
    keyPointsAr: [
      'مصفوفة الدوران حول x هي R_x(θ) بـ cosθ وsinθ؛ والتركيب R = Rz·Ry·Rx يحقق أي توجه.',
      'الإحداثيات المتجانسة (x, y, z, 1) تدمج الدوران والنقل في مصفوفة واحدة 4×4 — معيار OpenGL/CAD.',
      'الإحداثيات المحلية للعنصر ↔ العالمية عبر مصفوفة التحويل T: {u}_global = [T]·{u}_local.',
      'condition number (κ = σmax/σmin) يقيس قابلية نظير المصفوفة للعكس — مؤشر مبكر على نماذج FEA مريضة.',
    ],
    keyPointsEn: [
      'Rotation about x is R_x(θ) built from cosθ & sinθ; composing R = Rz·Ry·Rx yields any orientation.',
      'Homogeneous coordinates (x, y, z, 1) fold rotation + translation into one 4×4 — the OpenGL/CAD norm.',
      'Local ↔ global element coordinates: {u}_global = [T]·{u}_local.',
      'Condition number κ = σmax/σmin measures matrix invertibility — an early warning for sick FEA models.',
    ],
    formula: 'R_x(θ) = [[1,0,0],[0,cosθ,−sinθ],[0,sinθ,cosθ]]   ·   κ(A) = σ_max / σ_min',
    sources: [
      { title: 'Matrix (mathematics)', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Matrix_(mathematics)' },
      { title: 'Rotation matrix', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rotation_matrix' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ------------------------------- materials ------------------------------ */
  {
    id: 'kb-mat-001',
    departmentId: 'materials',
    code: 'INSCO-IND-MAT-001',
    titleAr: 'عائلات P-Number في ASME BPVC II ودلالتها للحام',
    titleEn: 'ASME P-Number families and what they mean for welding',
    summaryAr: 'P-Number يصنّف الفولاذات حسب قابلية اللحام المعدنية، لا حسب الاسم التجاري. إجراء لحام مؤهَّل على P-No.1 يصلح لأي فولاذ كربون من نفس العائلة — وهذا هو أساس تبسيط تأهيل الإجراءات.',
    summaryEn: 'The P-Number groups steels by weldability, not trade name. A procedure qualified on P-No.1 covers every carbon steel in that family — which is exactly how procedure qualification gets simplified.',
    keyPointsAr: [
      'P-No.1: فولاذات الكربون (SA-106 Gr.B, SA-516…) — أسهل إجراءات اللحام وأرخصها.',
      'P-No.3/4/5: سبائك Cr-Mo — تتطلب تحكمًا في درجة ما بين المرات وتسخينًا مسبقًا وغالبًا PWHT.',
      'P-No.8: غير قابل للصدأ الأوستنيتي (304/316) — حساس لSensitization وCSC عند 450–850°م.',
      'P-No.15E: P91/P92 مرايا الزحف — نطاق حراري ضيق للمعالجة بعد اللحام (±10°م).',
    ],
    keyPointsEn: [
      'P-No.1: carbon steels (SA-106 Gr.B, SA-516…) — simplest, cheapest procedures.',
      'P-No.3/4/5: Cr-Mo alloys — interpass temperature control, preheat, and usually PWHT required.',
      'P-No.8: austenitic stainless (304/316) — sensitisation & chloride SCC risk in the 450–850 °C window.',
      'P-No.15E: P91/P92 creep-strength-enhanced ferritics — tight post-weld heat treatment window (±10 °C).',
    ],
    sources: [
      { title: 'ASME BPVC Section II, Part A — Ferrous Material Specifications', publisher: 'ASME', url: 'https://www.asme.org/codes-standards' },
      { title: 'Welding — metallurgy & processes', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Welding' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-mat-002',
    departmentId: 'materials',
    code: 'INSCO-IND-MAT-002',
    titleAr: 'الاختبار الميكانيكي لقبول المواد (ASTM E8 و E18 و E23)',
    titleEn: 'Mechanical testing for material acceptance (ASTM E8, E18, E23)',
    summaryAr: 'شهادة المادة لا تكفي وحدها؛ منحنى الشد الفعلي وأرقام الصلادة وصدم شاربي تفصل بين دفعة تُقبل وأخرى تُرفض بحجية قانونية وفنية.',
    summaryEn: 'A mill certificate is never enough on its own; the actual tensile curve, hardness readings and Charpy impact values legally separate an accepted batch from a rejected one.',
    keyPointsAr: [
      'ASTM E8: شد العينات القياسية بسرعة محددة؛ يُخرج YS, UTS, الاستطالة ونسبة التخصر.',
      'ASTM E18: Rockwell للصلادة الميدانية السريعة؛ E10 و E92 للمادة الصلبة والبرينل/فيكرز.',
      'ASTM E23: اختبار صدم شاربي عند درجات منخفضة يحسم قبول الفولاذ للخدمات الشتوية والبحرية.',
      'Tie-in: الصلادة التقريبية UTS(MPa) ≈ 3.3 × HB — كشف سريع للخطأ في اختبار الشد.',
    ],
    keyPointsEn: [
      'ASTM E8: standardised tension at controlled rate → YS, UTS, elongation, reduction of area.',
      'ASTM E18: field Rockwell hardness; E10 (Brinell) and E92 (Vickers) for hard/thin stock.',
      'ASTM E23: Charpy impact at low temperature — the acceptance gate for winter & offshore service.',
      'Rule of thumb: UTS (MPa) ≈ 3.3 × HB — a fast sanity check against a bad tensile test.',
    ],
    formula: 'UTS ≈ 3.3 · HB     ·     %EL = (Lf − L0) / L0 × 100',
    sources: [
      { title: 'ASTM E8 / E8M — Tension Testing of Metallic Materials', publisher: 'ASTM International', url: 'https://www.astm.org' },
      { title: 'Ultimate tensile strength', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ultimate_tensile_strength' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ----------------------------- construction ----------------------------- */
  {
    id: 'kb-con-001',
    departmentId: 'construction',
    code: 'INSCO-IND-CON-001',
    titleAr: 'الأساسات الإنشائية والخرسانة المعتمدة (ACI 318)',
    titleEn: 'Foundations & structural concrete (ACI 318)',
    summaryAr: 'قاعدة الآلة لا تُبنى بعين الحس: الأحمال التشغيلية + عزم الاهتزاز + حفلات التسوية كلها تدخل في تصميم القاعدة وخطط التأسيس — والفيصل هو إجهاد التربة الآمن وفق تقرير الجسات.',
    summaryEn: 'Machine foundations are never eye-balled: operating loads + vibration moments + settlement all feed the footing design — governed by safe soil pressure from the geotechnical report.',
    keyPointsAr: [
      'إجهاد التربة التصميمي من تقرير الجسات؛ لا يُعتمد على رقم تقديري من مرجع عام.',
      'ACI 318: التصميم بالحالات الحدية — عامل حمل U = 1.2D + 1.6L مع عوامل قصور في الكبس والشد.',
      'قواعد الماكينات تتطلب قصورًا في الاهتزاز (Natural freq > 1.3× forcing) غالبًا عبر كتلة خرسانية.',
      'عزل الأساس عن منشآت المصنع يمنع انتقال الاهتزاز إلى الهيكل (فصل إنشائي).',
    ],
    keyPointsEn: [
      'Design soil pressure comes from the geotechnical report — never from a generic handbook.',
      'ACI 318: limit-states design — U = 1.2D + 1.6L with under-strength factors in compression & tension.',
      'Machine plinths need vibration detuning (natural freq > 1.3× forcing), usually via a massive concrete block.',
      'Decoupling the plinth from the plant frame (isolation joint) stops vibration leaking structure-wide.',
    ],
    formula: 'U = 1.2·D + 1.6·L   ·   q_soil ≤ q_safe   ·   S ≈ 0.35·λ·(f′c)^0.5',
    sources: [
      { title: 'ACI 318 — Building Code Requirements for Structural Concrete', publisher: 'American Concrete Institute', url: 'https://www.concrete.org' },
      { title: 'Reinforced concrete — design & behaviour', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Reinforced_concrete' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-con-002',
    departmentId: 'construction',
    code: 'INSCO-IND-CON-002',
    titleAr: 'المواسير الصناعية الملحومة وفق ASME B31.3',
    titleEn: 'Process piping welded to ASME B31.3',
    summaryAr: 'سماكة الأنبوب الحسابية من المعادلة t = P·D / (2·(S·E + P·Y)) ثم تُضاف بدلة التآكل والتقوس؛ والاختبار الهيدروليكي الإلزامي عند 1.5× ضغط التصميم هو ختام أي خط جديد.',
    summaryEn: 'The pipe wall is computed from t = P·D / (2·(S·E + P·Y)) plus corrosion allowance and mill tolerance; the mandatory 1.5× design-pressure hydrotest closes every new line.',
    keyPointsAr: [
      'S من جداول الإجهاد المسموح ASME B31.3 اعتمادًا على المادة وحجم الحرارة التصميمية.',
      'Y معامل المادة (0.4 للفولاذ الكربوني دون 900°ف) — يصحح الإجهادات في الأطلال السميكة.',
      'اختبار الهيدروليك الافتراضي: 1.5 × P × (S_test/S)؛ للكارمية المرئية ثم التثبيت بالكليبات.',
      'الشهادات البلاستيكية (MTR) والوصلات الملحومة يجب أن ترتبط بكل خط — التتبع هو التوثيق.',
    ],
    keyPointsEn: [
      'S comes from the B31.3 allowable-stress tables by material and design temperature.',
      'Y is the material coefficient (0.4 for carbon steel below 900 °F) — corrects thick-wall stresses.',
      'Hydrotest default: 1.5 × P × (S_test/S); visual over the full length, then close the clips/supports.',
      'MTRs and weld maps must trace every foot of pipe — traceability is the documentation.',
    ],
    formula: 't = (P · D) / (2 · (S · E + P · Y))   ·   P_hydro = 1.5 · P · (S_test / S)',
    sources: [
      { title: 'ASME B31.3 — Process Piping', publisher: 'ASME', url: 'https://www.asme.org/codes-standards' },
      { title: 'Piping & instrumentation diagram', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Piping_and_instrumentation_diagram' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  /* ------------------------------- standards ------------------------------ */
  {
    id: 'kb-std-001',
    departmentId: 'standards',
    code: 'INSCO-IND-STD-001',
    titleAr: 'منظومة إدارة الجودة ISO 9001 وعلاقتها بالأكواد الإنشائية',
    titleEn: 'ISO 9001 quality management and its relation to design codes',
    summaryAr: 'الأكواد تقول «كيف تُبنى القطعة»، وISO 9001 يقول «كيف تُدار المنشأة لتضمن تكرار جودة البناء». نظام الجودة الصناعي يذوب في الأكواد عبر إجراءات التحكم في الوثائق، الفحص، وعدم المطابقة.',
    summaryEn: 'Codes say how a part is built; ISO 9001 says how the organisation is run so that build quality repeats. The QMS dissolves into the codes through document control, inspection and nonconformity procedures.',
    keyPointsAr: [
      'بنود ISO 9001: السياق، القيادة، التخطيط، الدعم، التشغيل، تقييم الأداء، التحسين (PDCA).',
      'التحكم في الوثائق يعني أن النسخة الصحيحة من الإجراء المعتمد هي المستخدمة — لا نسخة يلتقطها الفني من الهاتف.',
      'تقرير عدم المطابقة (NCR) حلقة القفل: كشف → عزل → تصحيح → تحقق → وقاية.',
      'الأكواد (ASME/API/AWS) تُستدعى داخل ISO 9001 كتوافق، وليست بديلًا عنه.',
    ],
    keyPointsEn: [
      'ISO 9001 clauses: context, leadership, planning, support, operation, performance evaluation, improvement (PDCA).',
      'Document control means the *approved* revision is the one on the shop floor — not whatever is saved on a phone.',
      'The NCR loop is the lock: detect → segregate → correct → verify → prevent.',
      'Design codes (ASME/API/AWS) are invoked inside ISO 9001 as conformity — never as a substitute for it.',
    ],
    sources: [
      { title: 'ISO 9001 — Quality management systems, requirements', publisher: 'ISO', url: 'https://www.iso.org' },
      { title: 'ISO 9001 — overview', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/ISO_9001' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-std-002',
    departmentId: 'standards',
    code: 'INSCO-IND-STD-002',
    titleAr: 'تأهيل إجراءات اللحام واللحامين (ASME BPVC IX و AWS D1.1 و ISO 9606)',
    titleEn: 'Welding procedure & welder qualification (ASME IX, AWS D1.1, ISO 9606)',
    summaryAr: 'PQR هو دليل الإثبات: اختبار شد وثني على وصلة لحام وفق متغير مؤهل؛ وWPS وثيقة التنفيذ. اللحام بلا PQR/WPS معتمد صلحيّ مبدئيًا، مهما كانت مهارة اللحام.',
    summaryEn: 'The PQR is the proof: tension and bend tests on a welded coupon within qualified variables; the WPS is the execution document. A weld without an approved PQR/WPS pair is unqualified, however skilled the welder.',
    keyPointsAr: [
      'PQR يثبت المتغيرات (سمك، قطر، حرارة تسخين مسبق، معامل الحماية، نوع التيار وتردده).',
      'WPS تُبنى على نتائج PQR واحد أو أكثر — ولا تتجاوز حدود المتغيرات المؤهلة.',
      'تأهيل اللحام ISO 9606 (أو AWS D1.1 جداول التأهيل) يجدد دوريًا بالاختبار أو بالملاحظة المسجّلة.',
      'أي تغيير جوهري في المتغيرات يُسقط الإجراء — التبديل بين GTAW و GMAW يعني إعادة تأهيل كاملة.',
    ],
    keyPointsEn: [
      'PQR proves the variables (thickness, diameter, preheat, shielding gas, current & polarity).',
      'WPS is built on one or more PQRs — and may never exceed qualified variable limits.',
      'Welder qualification ISO 9606 (or AWS D1.1 tables) is renewed periodically by test or logged monitoring.',
      'Any essential-variable change voids the procedure — switching GTAW↔GMAW means full requalification.',
    ],
    sources: [
      { title: 'ASME BPVC Section IX — Welding, Brazing & Fusing Qualifications', publisher: 'ASME', url: 'https://www.asme.org/codes-standards' },
      { title: 'AWS D1.1 — Structural Welding Code, Steel', publisher: 'AWS', url: 'https://www.aws.org' },
      { title: 'ISO 9606 — Qualification testing of welders', publisher: 'ISO', url: 'https://www.iso.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* --------------------------------- hse --------------------------------- */
  {
    id: 'kb-hse-001',
    departmentId: 'hse',
    code: 'INSCO-IND-HSE-001',
    titleAr: 'نظام إدارة السلامة والصحة المهنية ISO 45001',
    titleEn: 'ISO 45001 occupational health & safety management',
    summaryAr: 'ISO 45001 يعامل السلامة كمنظومة لا كشعار: تحديد مخاطر، ضوابط، تشاور مع العمال، تحقيق أهداف قابلة للقياس ومراجعة إدارية — الحلقة تُقفل بالتحسين وليس بتقارير الحوادث.',
    summaryEn: 'ISO 45001 treats safety as a system, not a slogan: hazard identification, controls, worker consultation, measurable objectives and management review — the loop closes with improvement, not incident reports.',
    keyPointsAr: [
      'بنود القاعدة: 6.1 إجراءات التخطيط للتعامل مع المخاطر والفرص؛ 8.1.2 إزالة الخطر أو تقليله أولًا (هرم السيطرة).',
      'التشاور ومشاركة العمال شرط في البند 5.4 — السلام لا تُفرض من الأعلى وحدها.',
      'مؤشرات السبق (leading: تدريبات، تدقيقات، تصريحات) أهم من مؤشرات النتيجة (lagging: الإصابات).',
      'إيقاف العمل لأي خطر جسيم صلاحية كل فرد في الموقع — «حق التوقف» بند أصيل.',
    ],
    keyPointsEn: [
      'Core clauses: 6.1 risks & opportunities planning; 8.1.2 remove the hazard or reduce it first (control hierarchy).',
      'Worker consultation (5.4) is mandatory — safety is never purely imposed from the top.',
      'Leading indicators (drills, audits, permits) beat lagging indicators (injuries) for management value.',
      'Stop-work authority for imminent danger belongs to every person on site — a genuine clause, not a slogan.',
    ],
    sources: [
      { title: 'ISO 45001 — Occupational health and safety management systems', publisher: 'ISO', url: 'https://www.iso.org' },
      { title: 'ISO 45001 — overview', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/ISO_45001' },
      { title: 'OSHA — U.S. Department of Labor, occupational safety', publisher: 'OSHA', url: 'https://www.osha.gov' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-hse-002',
    departmentId: 'hse',
    code: 'INSCO-IND-HSE-002',
    titleAr: 'الأماكن ذات المخاطر (الأماكن المحصورة وتصاريح العمل الساخن)',
    titleEn: 'High-risk locations — confined spaces & hot-work permits',
    summaryAr: 'معظم وفيات المواقع الصناعية تتجمع في ثلاث بؤر: مكان محصور، عمل ساخن قرب مواد قابلة للاشتعال، وعزل خاطئ للطاقة. التصريح المنضبط يكسر السلسلة الثلاثية.',
    summaryEn: 'Most industrial-site fatalities cluster in three pockets: confined space, hot work near flammables, and wrong energy isolation. A disciplined permit breaks the triple chain.',
    keyPointsAr: [
      'المكان المحصور: اختبار أكسجين 19.5–23.5% قبل الدخول واستمراره، مراقب خارجي، خط نجاة وخطة إنقاذ جاهزة.',
      'العمل الساخن: إزاحة أو تبطين القابل للاشتعال على شعاع 11 م، قياس غازات متفجر، مراقب حريق قبل وأثناء وبعد بساعة.',
      'LOTO (عزل الطاقة): تحديد مصدر، فصل، قفل بمفتاح فردي، اختبار صفر طاقة — ثم بدء العمل.',
      'تصريح العمل يُلغى بوفاة شرط واحد فيه — «أصلاً» وليس استثناءً.',
    ],
    keyPointsEn: [
      'Confined space: oxygen 19.5–23.5% before entry and throughout, attendant outside, lifeline and rescue plan ready.',
      'Hot work: remove or shield combustibles within an 11 m radius, LEL gas test, fire watch before/during/30–60 min after.',
      'LOTO: identify source, isolate, lock with personal key, verify zero energy — then work starts.',
      'A permit dies when any single condition on it dies — that is the design, not an exception.',
    ],
    sources: [
      { title: 'OSHA — Permit-Required Confined Spaces', publisher: 'OSHA', url: 'https://www.osha.gov/confined-spaces' },
      { title: 'OSHA — Control of Hazardous Energy (Lockout/Tagout)', publisher: 'OSHA', url: 'https://www.osha.gov' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* --------------------------------- nde --------------------------------- */
  {
    id: 'kb-nde-001',
    departmentId: 'nde',
    code: 'INSCO-IND-NDE-001',
    titleAr: 'تأهيل أفراد الفحص غير التدميري ISO 9712 و ASNT SNT-TC-1A',
    titleEn: 'NDT personnel qualification — ISO 9712 & ASNT SNT-TC-1A',
    summaryAr: 'العالم ينقسم إلى مدرستين: ISO 9712 بشهادة مركز خارجي معتمد، وSNT-TC-1A بشهادة صاحب العمل وفق إجراءاته. في كلتيهما: المستوى الأول ينفذ، الثاني يفسر ويقرر، الثالث يصمم الإجراءات ويشرف.',
    summaryEn: 'Two schemes dominate: ISO 9712 certified by an accredited central body, and SNT-TC-1A certified by the employer to their written practice. In both: Level 1 performs, Level 2 interprets & calls, Level 3 designs procedures and oversees.',
    keyPointsAr: [
      'ISO 9712: جهة إصدار معتمدة (مثل PCN/FROSIO/ASNT 9712)، امتحانات عامة وخاصة وعملية.',
      'SNT-TC-1A: وثائق صاحب العمل «Written Practice» يصف التدريب والرؤية والخبرة والامتحانات.',
      'الصلاحية محدودة بخمس سنوات ثم تجديد بالفحص أو بالملاحظة المسجّلة.',
      'رؤية الألوان/حدة النظر البعيدة والقريبة (Jaeger J-2 أو أفضل) شرط قبل أي تدريب.',
    ],
    keyPointsEn: [
      'ISO 9712: accredited body (PCN-style) — general, specific and practical examinations.',
      'SNT-TC-1A: the employer’s «Written Practice» defines training, vision, experience and exams.',
      'Certification lapses after five years; renewal by examination or logged observation.',
      'Colour vision & near/far acuity (Jaeger J-2 or better) are pre-training gates.',
    ],
    sources: [
      { title: 'ISO 9712 — Non-destructive testing, qualification & certification of NDT personnel', publisher: 'ISO', url: 'https://www.iso.org' },
      { title: 'ASNT — SNT-TC-1A Recommended Practice', publisher: 'ASNT', url: 'https://www.asnt.org' },
      { title: 'Iowa State University — Center for NDE (educational resources)', publisher: 'Iowa State NDE-ED', url: 'https://nde-ed.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-nde-002',
    departmentId: 'nde',
    code: 'INSCO-IND-NDE-002',
    titleAr: 'فيزياء الفحص الإشعاعي والفوق صوتي مقارنة عملية',
    titleEn: 'RT vs UT physics — a practitioner’s comparison',
    summaryAr: 'RT يلتقط الحجم ثلاثي الأبعاد للعيب عبر ظل الإشعاع على فيلم، وUT يلتقط الانعكاسات عن حدودها داخليًا. الاختيار بينهما ليس تفضيلًا بل دالة في سماكة الجدار، نوع العيب والوصول إليه.',
    summaryEn: 'RT records the defect’s shadow volume on film; UT records reflections off its internal boundaries. Choosing between them is not taste — it is a function of wall thickness, defect type and access.',
    keyPointsAr: [
      'RT: سماكة الجدار تحدد الشدة؛ الامتصاص الأسي (Beer–Lambert I = I₀·e^(−μx)) يخلق التباين.',
      'UT: موجة محورية تنعكس عند حدود العيب؛ سرعة الصوت في الفولاذ ~5900 م/ث ومعامل K=½ في Snell للزاوي.',
      'عرض المسار على شاشة A-scan يقيس العمق بدقة 0.5 مم؛ طول العيب بالخطأ المحيطي.',
      'اللحامات الملحومة يدويًا: UT أسرع وأرخص غالبًا؛ وفحص الجذور والثقوب والزحف يفضل RT أو TOFD.',
    ],
    keyPointsEn: [
      'RT: wall thickness sets intensity; exponential attenuation (Beer–Lambert I = I₀·e^(−μx)) creates contrast.',
      'UT: longitudinal wave reflects off defect boundaries; steel velocity ≈ 5900 m/s, shear mode halves it (Snell K = 0.5).',
      'A-scan time-of-flight locates depth to ~0.5 mm; defect length by circumferential sweep.',
      'Hand-welded seams: UT is usually faster & cheaper; root, porosity & creep checks favour RT or TOFD.',
    ],
    formula: 'I = I₀ · e^(−μ·x)   (RT)   ·   depth = (v · t) / 2   (UT)',
    sources: [
      { title: 'Nondestructive testing — methods & physics', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Nondestructive_testing' },
      { title: 'Iowa State University — Center for NDE', publisher: 'Iowa State NDE-ED', url: 'https://nde-ed.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ------------------------------ programming ----------------------------- */
  {
    id: 'kb-prg-001',
    departmentId: 'programming',
    code: 'INSCO-IND-PRG-001',
    titleAr: 'بايثون كأداة تحقّق هندسي (مطابقة الأكواد والتقارير)',
    titleEn: 'Python as an engineering verification tool (code compliance & reports)',
    summaryAr: 'البايثون لا يستبدل المهندس بل يكرر حسابه 1000 مرة بنفس الدقة: فحص الإجهادات على آلاف نقاط التحميل، كشف انحراف الجرتان، وتوليد تقارير PDF تلقائيًا — قوة الأتمتة ليست السرعة بل الاتساق.',
    summaryEn: 'Python does not replace the engineer — it replays their calculation a thousand times with identical precision: stress checks over thousands of load points, tolerance scans, automatic PDF reports. Automation’s power is consistency, not speed.',
    keyPointsAr: [
      'مكتبة NumPy للمصفوفات والحل العددي؛ Pandas لتدقيق جداول البيانات؛ Matplotlib للمنحنيات والثامنيات.',
      'هندسة البناء: Pydantic للتحقق من شكل المدخلات؛ البيئة الافتراضية venv لعزل المشروع وتثبيته.',
      'fpdf2 / reportlab لتوليد تقارير جاهزة للمراجعة من ملف JSON واحد لكل امتحان.',
      'قاعدة الذهب: أي نتيجة تخرج من كود تمر بـ 3 حالات تحقق (حالة معروفة، حالة حدّية، حالة عشوائية).',
    ],
    keyPointsEn: [
      'NumPy for arrays & numerics; Pandas for data-table audits; Matplotlib for curves & octagon plots.',
      'Engineering solidity: Pydantic input validation; venv for reproducible project isolation.',
      'fpdf2 / reportlab generate review-ready PDFs from one JSON per inspection.',
      'Golden rule: any code output passes 3 checks — known case, boundary case, random case.',
    ],
    sources: [
      { title: 'Python 3 — Official documentation', publisher: 'Python Software Foundation', url: 'https://docs.python.org' },
      { title: 'Python (programming language)', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Python_(programming_language)' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-prg-002',
    departmentId: 'programming',
    code: 'INSCO-IND-PRG-002',
    titleAr: 'قواعد البيانات العلائقية لأرشفة الشهادات وتقارير الفحص',
    titleEn: 'Relational databases for certificate & inspection archives',
    summaryAr: 'كل شهادة لحام أو تقرير NDT هي كيان مرتبط بثلاثة: الوصلة، الإجراء، الفاحص. النمذجة الصحيحة (3NF) تمنع نصف أخطاء مطابقة الشهادات مع الوصلات قبل أن تقع.',
    summaryEn: 'Every weld certificate or NDT report is an entity bound to three others: the joint, the procedure, the inspector. Correct 3NF modelling prevents half the certificate-to-joint matching errors before they happen.',
    keyPointsAr: [
      'الجداول: joints ↔ procedures ↔ welders ↔ reports ↔ findings — مفاتيح أجنبية NOT NULL وفهارس فريدة.',
      'الشكل الثالث (3NF): كل حقل غير مفتاحي يعتمد على المفتاح كله — لا تكرار لبيانات اللحام عليه.',
      'الفهرس الفريد على (joint_id, method, report_date) يمنع ازدواج التقارير نفسها.',
      'النسخ الاحتياطي المجدول وقابلية الاسترجاع من WAL — الأرشفة بلا استرجاع ليست أرشفة.',
    ],
    keyPointsEn: [
      'Tables: joints ↔ procedures ↔ welders ↔ reports ↔ findings — NOT NULL foreign keys, unique indexes.',
      'Third normal form: every non-key field depends on the whole key — no welder data duplicated on reports.',
      'Unique index on (joint_id, method, report_date) blocks double-reporting the same examination.',
      'Scheduled backups with WAL point-in-time recovery — an archive without restore is not an archive.',
    ],
    sources: [
      { title: 'PostgreSQL — Official documentation', publisher: 'PostgreSQL Global Development Group', url: 'https://www.postgresql.org/docs/' },
      { title: 'Relational database & SQL', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/SQL' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ---------------------------------- pr --------------------------------- */
  {
    id: 'kb-pr-001',
    departmentId: 'pr',
    code: 'INSCO-IND-PR-001',
    titleAr: 'الاتصال المؤسسي في شركات المقاولات والخدمات الصناعية',
    titleEn: 'Corporate communication at industrial contractors & service firms',
    summaryAr: 'العميل الصناعي يشتري ثقة قبل أن يشتري لحامًا. الاتصال المؤسسي الصحيح في هذا القطاع: رسائل فنية بلسان المهندس، أدلة مرئية للجودة، وقنوات حكومية وإعلامية تبني السمعة بثبات لا بذخ.',
    summaryEn: 'The industrial buyer purchases trust before welding. Correct corporate communication in this sector: engineering-voiced technical messaging, visible quality evidence, and steady government & trade-press channels — reputation by consistency, not by noise.',
    keyPointsAr: [
      'الرسالة الأساسية: «السلامة أولًا + الجودة الموثقة + التسليم في الموعد» — تُكرر بكل قناة دون ملل.',
      'المحتوى المرئي من الموقع (فيديو 60 ثانية، صورة قياس RT) أقوى من أي إعلان مكتوب.',
      'إدارة الهوية البصرية: شعار + ألوان + خط موحد — انحراف 10% في الألوان يقوّض السمعة.',
      'القنوات الحكومية والنقابية (اتحاد المقاولين، هيئة المدن الصناعية) تفتح أبوابًا لا يفتحها الإعلان.',
    ],
    keyPointsEn: [
      'The core message — «safety first, documented quality, on-time delivery» — repeated across every channel.',
      'On-site visuals (a 60-second video, an RT film) outperform any written advertisement.',
      'Visual identity control: one logo, one palette, one typeface — a 10% colour drift erodes reputation.',
      'Government & trade-association channels (contractors’ union, industrial cities authority) open doors ads never will.',
    ],
    sources: [
      { title: 'Public relations — practice & theory', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Public_relations' },
      { title: 'Public Relations Society of America — professional resources', publisher: 'PRSA', url: 'https://www.prsa.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-pr-002',
    departmentId: 'pr',
    code: 'INSCO-IND-PR-002',
    titleAr: 'إدارة الاتصال في الأزمات الصناعية (تسريب، إصابة، تعطل)',
    titleEn: 'Communication during industrial crises (leak, injury, shutdown)',
    summaryAr: 'في أول 60 دقيقة بعد أي حادث صناعي تتكون 80% من الانطباع العام.  خطة الأزمة الجاهزة: ناطق واحد معتمد، بيان أول خلال ساعة، وتحديث كل 4 ساعات حتى الإغلاق — والصمت يملأ الفراغ بأسوأ الشائعات.',
    summaryEn: 'In the first 60 minutes after an industrial incident, ~80% of public perception is set. A ready crisis plan: one accredited spokesperson, a first statement within the hour, updates every 4 hours until closure — silence gets filled by the worst rumours.',
    keyPointsAr: [
      'سلسلة التبليغ: الموقع → غرفة الأزمة → الناطق الرسمي → العائلات → الجهات الرسمية → الإعلام — بترتيب صارم.',
      'البيان الأول: ما حدث بالضبط، ما لا نعرفه بعد، ماذا نفعل الآن، متى التحديث القادم.',
      'لا تخمّن سببًا قبل اكتمال التحقيق — «لا نعرف» إجابة محترمة، «أعتقد أن» كارثة قانونية.',
      'بعد الإغلاق: تقرير شفاف للدروس المستفادة خلال 72 ساعة يحوّل الأزمة إلى ثقة.',
    ],
    keyPointsEn: [
      'Notification chain: site → crisis room → spokesperson → families → authorities → media — strictly in order.',
      'First statement: exactly what happened, what we do not yet know, what we are doing, when we update next.',
      'Never guess a cause before investigation closes — «we don’t know» is respectable; «I think…» is a legal disaster.',
      'Within 72 h of closure: a transparent lessons-learned report converts the crisis into trust.',
    ],
    sources: [
      { title: 'Crisis communication — frameworks & practice', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Crisis_communication' },
      { title: 'PRSA — crisis communication resources', publisher: 'PRSA', url: 'https://www.prsa.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },

  /* ------------------------------- marketing ------------------------------ */
  {
    id: 'kb-mkt-001',
    departmentId: 'marketing',
    code: 'INSCO-IND-MKT-001',
    titleAr: 'التسويق الصناعي B2B ودورة البيع الهندسية الطويلة',
    titleEn: 'Industrial B2B marketing and the long engineering sales cycle',
    summaryAr: 'في بيع الخدمات الصناعية (NDT، PWHT، مقاولات) المشتري لجنة لا فرد: مهندس، مشتريات، سلامة، مالية — وكل قرار يمر بـ 6–18 شهرًا من الفحص الفني والأمني والمالي. التسويق هنا يُزرع ولا يُحصد بالإعلانات.',
    summaryEn: 'In industrial services (NDT, PWHT, contracting) the buyer is a committee, not a person — engineering, procurement, HSE, finance — and every decision traverses 6–18 months of technical, safety and financial screening. Marketing here is farmed, not harvested from ads.',
    keyPointsAr: [
      'وحدة اتخاذ القرار (DMU): المستخدم + المؤثر + المشتري + البواب + الضامن — لكل دور رسالة مختلفة.',
      'الرحلة: وعي بمشكلة ← مقارنة حلول ← طلب عروض (RFQ) ← تأهيل فني ← تفاوض ← عقد — لكل مرحلة محتوى مناسب.',
      'الأدلة التي تقنع المهندس: شهادات مشاريع منجزة، سجلات سلامة، شهادات اعتماد (ISO)، حالات موثقة.',
      'العروض الفنية (Technical Proposals) هي المنتج التسويقي الحقيقي — جودتها تصنع أو تكسر الصفقة.',
    ],
    keyPointsEn: [
      'The DMU: user + influencer + buyer + gatekeeper + guarantor — each needs a different message.',
      'Journey: problem-aware → solution-compare → RFQ → technical pre-qual → negotiation → contract — stage-matched content for each.',
      'What convinces engineers: completed project references, safety records, ISO certificates, documented case studies.',
      'The technical proposal *is* the marketing product — its quality makes or breaks the deal.',
    ],
    sources: [
      { title: 'Business-to-business marketing', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Business-to-business_marketing' },
      { title: 'American Marketing Association — professional standards & resources', publisher: 'AMA', url: 'https://www.ama.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
  {
    id: 'kb-mkt-002',
    departmentId: 'marketing',
    code: 'INSCO-IND-MKT-002',
    titleAr: 'التسويق بالمحتوى التقني للشركات الهندسية (أوراق بيضاء)',
    titleEn: 'Technical content marketing for engineering firms (white papers)',
    summaryAr: 'الورقة البيضاء 8–12 صفحة تشرح مشكلة صناعية حقيقية وحلًا هندسيًا موثقًا — تُبنى ثقة تسبق البيع، وتُفهرس في محركات البحث، وتُغني قسم المبيعات عن رحلة الشرح كل مرة.',
    summaryEn: 'A white paper — 8–12 pages dissecting one real industrial problem with a documented engineering solution — builds trust before the sale, ranks in search, and saves sales a full explanation per prospect.',
    keyPointsAr: [
      'البنية: مشكلة موثقة ← تحليل فني ← حل بالأرقام ← أدلة مشروع منجز ← دعوة هادئة لفحص الموقع.',
      'العنوان يُصاغ كاستعلام بحث حقيقي («تكلفة إعادة تشغيل فرن بعد PWHT غير مطابق…) لا كشعار.',
      'كل رقم في الورقة البيضاء من مصدر موثق داخل النص — القارئ مهندس وليس مستهلكًا.',
      'القياس: تحميلات، طلبات معاينة، RFQs مباشرة — لا مشاهدات مجردة.',
    ],
    keyPointsEn: [
      'Structure: documented problem → technical analysis → quantified solution → completed-project evidence → quiet call to survey.',
      'The title is written as a real search query («cost of restarting a furnace after non-conforming PWHT…»), never as a slogan.',
      'Every figure inside the paper carries an in-text documented source — the reader is an engineer, not a consumer.',
      'Measure downloads, site-survey requests and direct RFQs — not vanity view counts.',
    ],
    sources: [
      { title: 'Content marketing', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Content_marketing' },
      { title: 'American Marketing Association — content & industrial practice', publisher: 'AMA', url: 'https://www.ama.org' },
    ],
    status: 'reviewed',
    version: 1,
    collectedBy: 'seed:university-council',
    evolvedBy: [],
    updatedAt: COMMISSIONED,
  },
] as const;

/** Records that have been reviewed and may feed The Lab's teaching packs. */
export const REVIEWED_SEED = SEED_KNOWLEDGE.filter(record => record.status === 'reviewed');
