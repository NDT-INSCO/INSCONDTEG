import { EngineeringDiscipline } from '../types';
import { conventionalNdtLevel1 } from '../levels/conventionalLevel1';

export const conventionalNdtDiscipline: EngineeringDiscipline = {
  id: 'conventional_ndt',
  titleAr: 'علوم الفحص غير الإتلافي التقليدي (Conventional NDT)',
  titleEn: 'Conventional Non-Destructive Testing (VT, PT, MT, UT, RT)',
  category: 'ndt_conventional',
  badgeColor: 'amber',
  overviewAr: 'الركيزة الأساسية لضمان سلامة المنشآت الهندسية والمعدات الحيوية دون إلحاق أي ضرر فيزيائي بها. تشمل التقنيات الخمس الكلاسيكية (البصري، السائل النافذ، الجسيمات المغناطيسية، الموجات فوق الصوتية، والتصوير الإشعاعي) من الأساس الفيزيائي الجامعي وحتى سلطة المستوى الثالث.',
  overviewEn: 'The cornerstone of asset integrity, allowing non-destructive examination of materials and welds. Encompasses the 5 classical methods (VT, PT, MT, UT, RT) spanning academic university physics to Level III consulting authority.',
  keyTechniques: [
    'VT (Visual Testing - ASME Sec V Art. 9)',
    'PT (Liquid Penetrant - ASTM E165 / ASME Art. 6)',
    'MT (Magnetic Particle - ASTM E709 / ASME Art. 7)',
    'UT (Ultrasonic Testing - ASME Sec V Art. 4)',
    'RT (Radiographic Testing - ASME Sec V Art. 2)'
  ],
  globalAccreditations: ['ASNT SNT-TC-1A', 'ANSI / ASNT CP-189', 'ISO 9712', 'ASME Section V', 'AWS D1.1', 'API 1104'],
  targetIndustries: ['Refineries & Petrochemical', 'Cross-Country Pipelines', 'Power & Nuclear Plants', 'Offshore Platforms', 'Boilers & Pressure Vessels'],
  levels: [
    // -------------------------------------------------------------------------
    // LEVEL 1: ACADEMIC & UNIVERSITY FOUNDATIONS (المرحلة الأكاديمية والجامعية)
    // -------------------------------------------------------------------------
    {
      levelId: 'academic',
      tierCategory: 'academic',
      nameAr: 'المرحلة الأكاديمية والجامعية (University Engineering Science)',
      nameEn: 'Academic & University Engineering Foundations',
      academicStageAr: 'المقررات الأكاديمية لطلاب كليات الهندسة والمعاهد التقنية (Materials Science & Physics)',
      academicStageEn: 'Curriculum for University Engineering Students (B.Sc. Metallurgy / Mechanical / Physics)',
      targetRoleAr: 'دراسة وتطبيق النظريات الفيزيائية والكيميائية وسلوك الموجات وسريان الفيض المغناطيسي والإشعاع الذري',
      targetRoleEn: 'Master theoretical physics of wave propagation, electromagnetism, atomic radiation, and surface capillary action',
      prerequisitesAr: 'دراسة جامعية في الفيزياء التطبيقية، ميكانيكا المواد، الكهرومغناطيسية، وميتالورجيا المعادن',
      prerequisitesEn: 'University coursework in Applied Physics, Mechanics of Materials, Electromagnetism, and Metallurgy',
      trainingHours: 120,
      experienceMonths: 0,
      internationalCerts: ['B.Sc. Mechanical / Metallurgy / Physics', 'ASNT University Student Member'],
      applicableCodes: ['ASTM E1316 (NDT Terminology)', 'ASME Section V (Introduction)', 'ISO 9712 Principles'],
      responsibilitiesAr: [
        'فهم الاشتقاق الرياضي لمعادلات سرعة الموجات الصوتية والانكسار والانعكاس في الأوساط الصلبة',
        'تفسير سلوك المجالات المغناطيسية ومنحنى التخلفية المغناطيسية (Hysteresis Curve) وتكون التدفق المتسرب',
        'دراسة كيمياء التوتر السطحي وزوايا التبلل وقوانين الخاصية الشعرية في السوائل النافذة',
        'فهم فيزياء الأشعة المؤينة وقوانين توهين الإشعاع (Beer-Lambert Law) والجرعات الإشعاعية المسموحة',
        'تنفيذ التجارب المعملية الأكاديمية لحساب سرعات الصوت ومعاملات الامتصاص للمواد المختلفة'
      ],
      responsibilitiesEn: [
        'Derive mathematical equations governing acoustic wave velocities, refraction, and mode conversion in solids',
        'Analyze magnetic domains, hysteresis loops (B-H curve), and flux leakage physics at surface discontinuities',
        'Investigate surface energy, contact wetting angles, and capillary rise kinetics in dye penetrant formulations',
        'Master ionizing radiation physics, exponential photon attenuation laws, and biological dose equivalents',
        'Conduct laboratory physics experiments measuring acoustic velocity and attenuation across diverse alloys'
      ],
      modules: [
        {
          id: 'mod_c_acad_1',
          titleAr: 'الوحدة الأكاديمية 1: فيزياء الموجات الصوتية الميكانيكية ومعادلات سنيل',
          titleEn: 'Academic Module 1: Acoustic Wave Physics & Snell’s Refraction Laws',
          duration: '35 ساعة محاضرات ومختبرات جامعية',
          topicsAr: [
            'الموجات المرنة في الأوساط الصلبة: الموجات الطولية (Compressional)، موجات القص (Transverse Shear)، وموجات السطح (Rayleigh)',
            'سرعات انتشار الصوت في المعادن والصلب الكربوني (5920 m/s طولية، 3240 m/s مستعرضة)',
            'قانون سنيل لانكسار الموجات: حساب زاوية السقوط وزاوية الانكسار والتحويل النمطي (Mode Conversion)',
            'الزاوية الحرجة الأولى والثانية واختيار زاوية إسفين البلكسيجلاس (Perspex Wedge 45°, 60°, 70°)',
            'المنطقة القريبة (Fresnel Near Field) وزاوية تشتت الحزمة الصوتية في المجال البعيد (Fraunhofer Far Field)'
          ],
          topicsEn: [
            'Elastic waves in solids: Longitudinal (P-waves), Transverse shear (S-waves), and Rayleigh surface waves',
            'Sound velocities in engineering metals (Carbon steel: 5920 m/s longitudinal, 3240 m/s shear)',
            'Snell’s Law of Refraction: Incident vs refracted angles and acoustic mode conversion at interfaces',
            'First and second critical angles and Perspex wedge angle optimization (45°, 60°, 70°)',
            'Near-field Fresnel zone length calculation and far-field Fraunhofer beam divergence modeling'
          ],
          learningOutcomesAr: [
            'القدرة على اشتقاق زوايا مسابير الفحص بالموجات فوق الصوتية لأي سبيكة معدنية',
            'فهم الأسباب الفيزيائية لظواهر الانكسار والحيود والتشتت الصوتي'
          ],
          learningOutcomesEn: [
            'Derive ultrasonic probe wedge angles and refraction behaviors for arbitrary metallic alloys',
            'Master the physical origins of acoustic reflection, refraction, diffraction, and attenuation'
          ]
        },
        {
          id: 'mod_c_acad_2',
          titleAr: 'الوحدة الأكاديمية 2: الكهرومغناطيسية، الخاصية الشعرية، والإشعاع الذري',
          titleEn: 'Academic Module 2: Electromagnetism, Capillary Kinetics & Nuclear Physics',
          duration: '45 ساعة محاضرات ونظريات',
          topicsAr: [
            'المغناطيسية الحديدية (Ferromagnetism): النطاقات المغناطيسية (Magnetic Domains)، النفاذية، والقوة القسرية',
            'توليد المجال المغناطيسي المتسرب (Magnetic Flux Leakage - MFL) عند العيوب العمودية على خطوط الفيض',
            'معادلة يونغ-لابلاس وقوانين التوتر السطحي وزوايا التبلل (Wetting Angle θ < 90°) في فحص السائل النافذ PT',
            'النشاط الإشعاعي ونظرية الكم: طيف أشعة إكس (Bremssstrahlung) وأشعة جاما من النظائر المشعة (Ir-192, Co-60, Se-75)',
            'قانون بير-لامبرت لتوهين الفوتونات: طبقة النصف (HVL) وطبقة العشر (TVL) والتحلل الإشعاعي الأسّي'
          ],
          topicsEn: [
            'Ferromagnetism: Magnetic domain theory, permeability, retentivity, coercivity, and hysteresis loops',
            'Physics of magnetic flux leakage (MFL) generated at surface-breaking and near-surface planar flaws',
            'Young-Laplace capillary equation, surface tension, and contact wetting angle dynamics in penetrant testing',
            'Radioactivity and quantum photonics: Continuous X-ray Bremsstrahlung vs discrete gamma isotopes',
            'Beer-Lambert exponential attenuation law: Half-Value Layer (HVL), Tenth-Value Layer (TVL), and decay kinetics'
          ],
          learningOutcomesAr: [
            'فهم الأساس العلمي الصارم لكافة ظواهر الفحص غير الإتلافي دون الاعتماد على الحفظ المجرد',
            'حساب سماكات الدروع الواقية من الإشعاع وجرعات الأمان في المنشآت الصناعية'
          ],
          learningOutcomesEn: [
            'Grasp the rigorous scientific foundation of all NDT phenomena without reliance on rote memorization',
            'Calculate radiation shielding thicknesses and occupational safety boundaries for industrial isotopes'
          ]
        },
        {
          id: 'mod_c_acad_vt',
          titleAr: 'الوحدة الأكاديمية VT: قياس هندسة الوصلة وقبولها',
          titleEn: 'Academic Module VT: Weld Geometry Measurement & Acceptance',
          duration: '15 ساعة محاضرات وتمارين',
          topicsAr: [
            'هندسة الوصلة: Hi-Lo، undercut، cap height، toe angle',
            'أدوات القياس: Cambridge gauge، Hi-Lo gauge، مقياس عمق',
            'توثيق القياس: وحدات، دقة، رقم الأداة، مرجع البند',
            'قرار القبول وفق الكود (ASME/AWS/API) ونوع الخدمة'
          ],
          topicsEn: [
            'Joint geometry: Hi-Lo, undercut, cap height, toe angle',
            'Measurement tools: Cambridge gauge, Hi-Lo gauge, depth gauge',
            'Documentation: units, resolution, gauge ID, clause reference',
            'Acceptance decision per code (ASME/AWS/API) and service type'
          ],
          learningOutcomesAr: [
            'قياس هندسة الوصلة وتوثيقها',
            'اتخاذ قرار قبول وفق الكود'
          ],
          learningOutcomesEn: [
            'Measure and document joint geometry',
            'Make an acceptance decision per code'
          ]
        }
      ],
      keyFormulas: [
        {
          nameAr: 'قانون سنيل لانكسار الموجات الصوتية',
          nameEn: 'Snell’s Law of Refraction',
          formula: 'sin(θ₁) / v₁ = sin(θ₂) / v₂',
          descriptionAr: 'يحدد زاوية انكسار حزمة الموجات فوق الصوتية في الصلب (θ₂) بناءً على زاوية السقوط في الإسفين (θ₁) وسرعة الصوت في الوسطين.',
          descriptionEn: 'Computes refracted beam angle in steel (θ₂) given incident angle in wedge (θ₁) and phase velocities.'
        },
        {
          nameAr: 'حساب مسافة المنطقة القريبة للمسبار (Fresnel Zone)',
          nameEn: 'Ultrasonic Near Field Length (N)',
          formula: 'N = (D² × f) / (4 × v) = D² / (4 × λ)',
          descriptionAr: 'المنطقة التي تتذبذب فيها شدة الحزمة الصوتية تذبذباً حاداً ولا يجوز قياس حجم العيوب داخلها لعدم استقرار السعة.',
          descriptionEn: 'The distance of acoustic pressure oscillations; flaw sizing must be performed in the far field (beyond N).'
        },
        {
          nameAr: 'قانون بير-لامبرت لتوهين الإشعاع النفاذ',
          nameEn: 'Beer-Lambert Photon Attenuation Law',
          formula: 'I = I₀ × e^(-μ × x)',
          descriptionAr: 'شدة الإشعاع النافذ (I) تقل أسياً مع زيادة سماكة المعدن (x) ومعامل التوهين الخطي للمادة (μ).',
          descriptionEn: 'Transmitted photon intensity (I) decreases exponentially with material thickness (x) and linear attenuation (μ).'
        },
        {
          nameAr: 'ارتفاع السائل النافذ بالخاصية الشعرية داخل الشروخ',
          nameEn: 'Jurin’s Capillary Rise Equation',
          formula: 'h = (2 × γ × cos θ) / (ρ × g × r)',
          descriptionAr: 'يفسر قدرة السائل النافذ على التغلغل التلقائي في أدق الشروخ المجهرية بفعل التوتر السطحي (γ) وزاوية التبلل (θ).',
          descriptionEn: 'Explains spontaneous penetrant ingress into micro-cracks driven by surface tension and contact angle.'
        }
      ],
      practicalSkillsChecklist: [
        { skillAr: 'قياس سرعة الصوت الطولية والمستعرضة معملياً في 4 معادن مختلفة (صلب، ألومنيوم، نحاس، تيتانيوم)', skillEn: 'Measure longitudinal and shear wave velocities experimentally across 4 engineering alloys', importance: 'mandatory' },
        { skillAr: 'رسم منحنى التخلفية المغناطيسية (B-H Curve) لمعدن حديدي وحساب المغناطيسية المتبقية', skillEn: 'Plot magnetic hysteresis B-H curve for ferritic steel and determine retentivity/coercivity', importance: 'mandatory' },
        { skillAr: 'إجراء تجربة الأنبوب الشعري وحساب تأثير التوتر السطحي على زمن مكوث السائل النافذ Dwell Time', skillEn: 'Perform capillary tube experiments measuring surface tension influence on penetrant dwell kinetics', importance: 'mandatory' },
        { skillAr: 'حساب معامل التوهين الإشعاعي (Linear Attenuation μ) باستخدام عداد جيجر وألواح رصاص', skillEn: 'Calculate linear attenuation coefficient (μ) using Geiger counter and calibrated lead plates', importance: 'mandatory' }
      ],
      referenceTextbooks: [
        { title: 'Ultrasonic Testing of Materials', author: 'J. Krautkrämer & H. Krautkrämer', standardOrPublisher: 'Springer-Verlag' },
        { title: 'ASNT Non-Destructive Testing Handbook (Vols 1-5)', author: 'American Society for NDT', standardOrPublisher: 'ASNT Press' },
        { title: 'Industrial Radiology: Theory and Practice', author: 'R. Halmshaw', standardOrPublisher: 'Chapman & Hall' }
      ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 1: PROFESSIONAL TECHNICIAN STAGE (المستوى الأول المهني)
    // -------------------------------------------------------------------------
    conventionalNdtLevel1,

    // LEVEL 2: CERTIFIED INSPECTOR & EVALUATOR (المستوى الثاني المهني المعتمد)
    // -------------------------------------------------------------------------
    {
      levelId: 'level2',
      tierCategory: 'level2',
      nameAr: 'المستوى الثاني المهني المعتمد (Certified Level II Inspector & Evaluator)',
      nameEn: 'Level II (Certified Senior Inspector & Code Evaluator)',
      academicStageAr: 'شهادة الاعتماد المهني والتأهيل الفني الميداني (ASNT SNT-TC-1A / ISO 9712 Level 2)',
      academicStageEn: 'Professional Qualification & Certification (ASNT SNT-TC-1A / ISO 9712 Level 2)',
      targetRoleAr: 'إعداد تعليمات الفحص وتفسير المؤشرات وقبول أو رفض اللحامات وتوقيع التقارير الرسمية أمام العميل',
      targetRoleEn: 'Set up & calibrate equipment, interpret indications, accept/reject welds per code, sign official inspection reports',
      prerequisitesAr: 'شهادة المستوى الأول مع خبرة ميدانية موثقة لا تقل عن 12 شهراً واجتياز امتحانات ASNT الثلاثة (عام، نوعي، وعملي)',
      prerequisitesEn: 'Level I certified with min 12 months verified logbook, passing General, Specific, and Practical exams',
      trainingHours: 80,
      experienceMonths: 12,
      internationalCerts: ['ASNT Level II (VT, PT, MT, UT, RT)', 'ISO 9712 Level 2', 'PCN Level 2'],
      applicableCodes: ['ASME Sec VIII Div 1', 'ASME B31.3', 'API 1104', 'AWS D1.1', 'ASME Sec V', 'ISO 5817'],
      responsibilitiesAr: [
        'تفسير وتمييز المؤشرات الحقيقية (Relevant Indications) عن الخاطئة أو الهندسية (Geometric / Non-relevant)',
        'تقييم أبعاد العيوب وقبولها أو رفضها استناداً للجداول الإلزامية لأكواد ASME و API و AWS',
        'بناء منحنيات تصحيح السعة مع المسافة DAC و TCG ومعايرة الأجهزة على بلوكات ASME و IIW',
        'قراءة وتفسير أفلام التصوير الإشعاعي الصناعي وتحديد حساسية السلك IQI والكثافة البصرية H&D',
        'صياغة تعليمات الفحص الميدانية (NDT Work Instructions) وتوقيع واعتماد التقارير الرسمية'
      ],
      responsibilitiesEn: [
        'Distinguish relevant defect indications from non-relevant geometrical artifacts and false calls',
        'Evaluate flaw dimensions and render authoritative pass/reject dispositions per ASME/API/AWS acceptance criteria',
        'Construct Distance Amplitude Correction (DAC) & TCG curves calibrating on standard ASME/IIW blocks',
        'Interpret industrial radiographic films verifying wire IQI 2% sensitivity and optical density (1.8 - 4.0)',
        'Draft method-specific NDT field instructions and formally sign off official inspection certificates'
      ],
      modules: [
        {
          id: 'mod_c2_1',
          titleAr: 'الوحدة 1: تحليل وتفسير مؤشرات العيوب الحجمية والخطية ومعايرة الأجهزة',
          titleEn: 'Module 1: Flaw Sizing, Calibration Blocks & Signal Interpretation',
          duration: '40 ساعة تدريبية مكثفة',
          topicsAr: [
            'معايرة مسبار الزاوية على بلوك IIW V1 و V2: ضبط نقطة الخروج (Index Point) وسرعة الصوت وتأخير المسبار',
            'بناء منحنى الـ DAC على بلوك ASME الأساسي ذو الثقوب الجانبية (Side Drilled Holes - SDH)',
            'طرق قياس طول العيب: تقنية هبوط الـ 6 ديسيبل (6dB Drop) وتقنية هبوط الـ 20 ديسيبل',
            'فحص الجسيمات المغناطيسية الفلورية والغرفة المظلمة وقياس شدة الضوء الأسود (≥ 1000 µW/cm²)',
            'خطوات فحص السائل النافذ القياسية الخمس وإزالة الفائض دون غسيل مفرط (Over-washing)'
          ],
          topicsEn: [
            'Angle beam calibration on IIW V1/V2 blocks: Probe index point zeroing, velocity, and wedge delay',
            'Constructing Distance Amplitude Correction (DAC) curve on ASME basic blocks with side-drilled holes',
            'Flaw length sizing methodologies: 6dB drop technique for planar flaws and 20dB drop for beam boundary',
            'Fluorescent MT inspection in darkroom: black light intensity verification (≥ 1000 µW/cm² at 365 nm)',
            'Standard 5-step liquid penetrant testing: Dwell time control and solvent wipe without over-washing'
          ],
          learningOutcomesAr: [
            'معايرة الأجهزة وفحص الوصلات الملحومة بموثوقية هندسية عالية جداً',
            'تحديد عمق وطول ونوع العيب (شرخ، نقص تغلغل، مسامية، خبث) بدقة مليمترية'
          ],
          learningOutcomesEn: [
            'Calibrate flaw detectors and inspect weldments with exceptionally high engineering repeatability',
            'Accurately resolve flaw depth, length, and morphology (crack, LOP, slag, porosity) within ±1mm'
          ]
        },
        {
          id: 'mod_c2_2',
          titleAr: 'الوحدة 2: تطبيق أكواد القبول والرفض العالمية (ASME, API, AWS)',
          titleEn: 'Module 2: World Acceptance Standards & Official Reporting',
          duration: '40 ساعة دراسات حالة وأفلام',
          topicsAr: [
            'معايير قبول ASME B31.3 Table 341.3.2 للخدمات العادية والحرجة (Normal Fluid vs Severe Cyclic)',
            'جداول قبول أوعية الضغط طبقاً لكود ASME Section VIII Div 1 (UW-51, Appendix 4, Appendix 12)',
            'معايير فحص خطوط الأنابيب البترولية طبقاً لـ API 1104 Section 9 ومقارنة أطوال الشروخ المسموحة',
            'معايير اللحامات الإنشائية طبقاً لـ AWS D1.1 Table 6.1 للتفتيش البصري والفحص بالموجات فوق الصوتية',
            'قراءة أفلام RT وقياس كثافة H&D ومطابقة السلك الحساس رقم 10 و 11 طبقاً لـ ASME Sec V Art. 2'
          ],
          topicsEn: [
            'ASME B31.3 Table 341.3.2 acceptance criteria (Normal Fluid vs Severe Cyclic service conditions)',
            'ASME Section VIII Div 1 pressure vessel acceptance standards (UW-51, App 4 PT/MT, App 12 UT)',
            'Cross-country petroleum pipeline weld inspection criteria according to API 1104 Section 9',
            'AWS D1.1 Table 6.1 structural visual and ultrasonic weld acceptance criteria',
            'RT film interpretation, H&D optical density auditing, and wire IQI #10/#11 verification per ASME Sec V'
          ],
          learningOutcomesAr: [
            'الربط الصارم بين أي إشارة أو ظل يظهر على الشاشة وبين الفقرة القانونية المحددة في كود العميل',
            'إصدار وتوقيع تقارير فحص رسمية معتمدة لا يمكن الطعن فيها هندسياً'
          ],
          learningOutcomesEn: [
            'Directly map any signal or shadow to explicit contractual clauses in client engineering specifications',
            'Issue and endorse legally binding, authoritative NDT inspection certificates'
          ]
        }
      ],
      keyFormulas: [
        {
          nameAr: 'حساب زاوية تشتت الحزمة الصوتية في المجال البعيد',
          nameEn: 'Ultrasonic Half-Beam Spread Angle (α)',
          formula: 'sin(α) = 1.22 × λ / D',
          descriptionAr: 'يحدد مقدار اتساع الحزمة الصوتية مع زيادة مسافة المسار الصوتي، مما يؤثر على دقة تحديد أبعاد العيوب.',
          descriptionEn: 'Defines half-divergence angle of ultrasonic beam; larger crystals and higher frequencies reduce beam spread.'
        },
        {
          nameAr: 'حساب الكثافة البصرية لأفلام الأشعة (Optical Density)',
          nameEn: 'Radiographic Optical Density (H&D)',
          formula: 'D = log₁₀(I₀ / I_t)',
          descriptionAr: 'نسبة شدة الضوء الساقط إلى الضوء النافذ عبر فيلم الأشعة. يشترط ASME V أن تكون الكثافة بين 1.8 و 4.0.',
          descriptionEn: 'Logarithmic ratio of incident to transmitted light; ASME Section V mandates density between 1.8 and 4.0.'
        }
      ],
      practicalSkillsChecklist: [
        { skillAr: 'بناء منحنى DAC بـ 3 نقاط على الأقل على بلوك ASME مع رسم خط التحذير 50% DAC', skillEn: 'Construct a 3-point DAC curve on ASME basic block with 50% recording threshold line', importance: 'mandatory' },
        { skillAr: 'قراءة وتفسير طقم مكون من 10 أفلام لحام تتضمن عيوب شروخ وخبث ونقص تغلغل وتقديم تقرير مطابق للكود', skillEn: 'Interpret set of 10 weld radiographs resolving crack, slag, and LOP with code pass/fail report', importance: 'mandatory' },
        { skillAr: 'إجراء فحص السائل النافذ الفلوري وقياس شدة الضوء الأسود بالأفوميتر الضوئي وتوثيق المؤشرات', skillEn: 'Perform fluorescent penetrant inspection, verify black light irradiance, and document flaw bleed-out', importance: 'mandatory' },
        { skillAr: 'صياغة بطاقة تعليمات تفتيش فنية (NDT Technique Sheet) لمفصل لحام أنبوبي قطر 12 بوصة', skillEn: 'Draft an industrial NDT technique sheet for 12-inch pipe butt weld inspection', importance: 'mandatory' }
      ],
      referenceTextbooks: [
        { title: 'ASNT Level II Study Guide: Ultrasonic Testing', author: 'ASNT Technical Committee', standardOrPublisher: 'ASNT Press' },
        { title: 'ASME Boiler and Pressure Vessel Code: Section V (Nondestructive Examination)', author: 'ASME International', standardOrPublisher: 'ASME Standards' },
        { title: 'API Standard 1104: Welding of Pipelines and Related Facilities', author: 'American Petroleum Institute', standardOrPublisher: 'API Publishing' }
      ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 3: CONSULTING AUTHORITY & DIRECTOR (المستوى الثالث الاستشاري)
    // -------------------------------------------------------------------------
    {
      levelId: 'level3',
      tierCategory: 'level3',
      nameAr: 'المستوى الثالث الاستشاري ورئيس قطاع الفحص (ASNT Level III Technical Authority)',
      nameEn: 'Level III (Consulting Authority & Quality Director)',
      academicStageAr: 'أعلى رتبة هندسية واستشارية دولية في علوم التفتيش غير الإتلافي (ASNT / ISO 9712 Level 3)',
      academicStageEn: 'Peak Consulting & Engineering Authority in Non-Destructive Examination (ASNT Level III)',
      targetRoleAr: 'تأسيس واعتماد الممارسة المكتوبة، اعتماد إجراءات الفحص NDT Procedures، التحكيم الهندسي، وتأهيل الكوادر',
      targetRoleEn: 'Establish corporate Written Practice, author and approve NDT procedures, arbitrate code disputes, certify staff',
      prerequisitesAr: 'بكالوريوس هندسة مع خبرة 4 سنوات أو دبلوم عالي مع خبرة 8 سنوات، واجتياز امتحانات ASNT الأساسية والتخصصية الصارمة',
      prerequisitesEn: 'B.Sc. Engineering with 4 yrs or diploma with 8 yrs experience, passing ASNT Basic and Method examinations',
      trainingHours: 120,
      experienceMonths: 48,
      internationalCerts: ['ASNT Level III (VT, PT, MT, UT, RT)', 'ISO 9712 Level 3', 'ACCP Professional'],
      applicableCodes: ['ASNT SNT-TC-1A', 'ANSI / ASNT CP-189', 'ASME Sec V Art. 1', 'ISO 17025', 'ISO 9001'],
      responsibilitiesAr: [
        'صياغة وإقرار ممارسة الشركة المكتوبة (Written Practice) لتأهيل وتصديق العاملين طبقاً لـ SNT-TC-1A',
        'إعداد وتدقيق واعتماد كافة إجراءات الفحص غير الإتلافي (NDT Procedures) والمصادقة بالختم الرسمي',
        'تمثيل الشركة كخبير محكم أمام كبرى شركات البترول (أرامكو، إيني، بي بي) والجهات الرقابية الدولية',
        'تصميم حلول التفتيش للمعدات الحرجة ودرجات الحرارة المرتفعة والسبائك غير الحديدية المعقدة',
        'إجراء امتحانات التأهيل النظري والعملي لفنيي ومفتشي المستوى الأول والثاني وإصدار الشهادات'
      ],
      responsibilitiesEn: [
        'Author and enforce corporate Written Practice for qualification & certification per SNT-TC-1A / CP-189',
        'Review, audit, and formally stamp all corporate NDT engineering procedures per ASME Section V Article 1',
        'Serve as chief technical arbitrator before petroleum majors (Aramco, Eni, BP) and international regulators',
        'Design specialized inspection methodologies for exotic alloys and high-temperature operating units',
        'Administer written and practical qualification exams for Level I and Level II candidates'
      ],
      modules: [
        {
          id: 'mod_c3_1',
          titleAr: 'الوحدة 1: صياغة الممارسة المكتوبة واعتماد الإجراءات الهندسية (ASME Sec V Art. 1)',
          titleEn: 'Module 1: Written Practice, Procedure Formulation & Code Compliance',
          duration: '60 ساعة استشارية وقانونية',
          topicsAr: [
            'صياغة وثيقة الممارسة المكتوبة (Corporate Written Practice) وفق متطلبات SNT-TC-1A و CP-189',
            'هيكلة إجراء الفحص غير الإتلافي المعتمد: المتغيرات الأساسية (Essential Variables) وغير الأساسية',
            'متطلبات فحص حدة البصر (Jaeger 1) وفحص تمييز الألوان السنوي للأطقم الفنية',
            'التأهيل العملي على عينات حقيقية تتضمن عيوباً خفية وتوثيق نسبة دقة الاكتشاف (Probability of Detection - POD)'
          ],
          topicsEn: [
            'Authoring Corporate Written Practice satisfying ASNT SNT-TC-1A, CP-189, and ISO 9712 mandates',
            'Structuring ASME Section V Article 1 approved procedures: Essential, non-essential, and supplementary variables',
            'Vision acuity standards: Jaeger 1 near vision and Ishihara color perception annual audits',
            'Practical qualification testing using blind flawed specimens and assessing Probability of Detection (POD)'
          ],
          learningOutcomesAr: [
            'بناء منظومة تأهيل وتفتيش مؤسسية كاملة تحوز على ثقة مكاتب التفتيش العالمية',
            'إعداد إجراءات فحص معتمدة مطابقة لمواصفات العقد وكود ASME'
          ],
          learningOutcomesEn: [
            'Build an institutional qualification and inspection system trusted by world auditing bureaus',
            'Draft stamped NDT procedures fully compliant with contract specifications and ASME codes'
          ]
        },
        {
          id: 'mod_c3_2',
          titleAr: 'الوحدة 2: التحكيم الهندسي، ميكانيكا الكسر، وتحليل الانهيارات الكارثية',
          titleEn: 'Module 2: Technical Arbitration, Fracture Mechanics & Failure Forensics',
          duration: '60 ساعة دراسات استشارية',
          topicsAr: [
            'التحكيم عند اختلاف نتائج الفحص بين الموجات فوق الصوتية UT والتصوير الإشعاعي RT',
            'ميكانيكا الكسر المرن الخطي (Linear Elastic Fracture Mechanics - LEFM) ومعامل شدة الإجهاد K_IC',
            'معدل نمو الشروخ بقانون باريس (Paris Law da/dN) لتحديد موعد الانهيار المتوقع تحت أحمال الإجهاد الدوري',
            'التحقيق في الانهيارات الميدانية الكارثية (Root Cause Failure Analysis) وفحص الميكروسكوب الإلكتروني الماسح SEM'
          ],
          topicsEn: [
            'Technical arbitration when reconciling conflicting inspection dispositions between UT and RT',
            'Linear Elastic Fracture Mechanics (LEFM): Stress intensity factor K_I and plane-strain fracture toughness K_IC',
            'Paris-Erdogan fatigue crack propagation law (da/dN = C · ΔK^m) predicting critical structural life',
            'Root Cause Failure Analysis (RCFA) of catastrophic pipeline ruptures and Scanning Electron Microscopy (SEM)'
          ],
          learningOutcomesAr: [
            'حسم أي نزاع فني مع العميل واستشاري المشروع بحجج هندسية قاطعة ومدعومة بالأكواد',
            'حماية الأصول الاستراتيجية من الانهيارات الكارثية عبر تقييمات ميكانيكا الكسر المتقدمة'
          ],
          learningOutcomesEn: [
            'Definitively resolve technical disputes with clients and audit bureaus through unchallengeable code citations',
            'Protect strategic infrastructure from catastrophic ruptures via advanced fracture mechanics evaluations'
          ]
        }
      ],
      keyFormulas: [
        {
          nameAr: 'معامل شدة الإجهاد عند قمة الشرخ (Stress Intensity Factor)',
          nameEn: 'Mode I Stress Intensity Factor (K_I)',
          formula: 'K_I = Y × σ × √(π × a)',
          descriptionAr: 'يحدد حالة الإجهاد عند قمة الشرخ ذو الطول (a) تحت إجهاد الشد (σ) ومعامل الشكل الهندسي (Y). إذا تجاوزت K_I قيمة K_IC يحدث الكسر الهش الفوري.',
          descriptionEn: 'Defines stress state at crack tip; catastrophic brittle fracture occurs instantly when K_I exceeds fracture toughness K_IC.'
        },
        {
          nameAr: 'قانون باريس لنمو شروخ الإجهاد الدوري (Fatigue Crack Growth)',
          nameEn: 'Paris-Erdogan Crack Growth Law',
          formula: 'da / dN = C × (ΔK)^m',
          descriptionAr: 'معدل زيادة طول الشرخ (da) لكل دورة تحميل (dN) يعتمد على مدى معامل شدة الإجهاد (ΔK) وثوابت المادة (C, m).',
          descriptionEn: 'Predicts crack extension per stress cycle (da/dN) as power function of cyclic stress intensity range (ΔK).'
        }
      ],
      practicalSkillsChecklist: [
        { skillAr: 'صياغة واعتماد ممارسة مكتوبة (Written Practice) كاملة لشركة تفتيش كبرى وفق CP-189 و SNT-TC-1A', skillEn: 'Author and stamp complete Corporate Written Practice satisfying CP-189 and SNT-TC-1A', importance: 'mandatory' },
        { skillAr: 'إعداد واعتماد إجراء فحص شامل بالموجات فوق الصوتية UT لأوعية الضغط طبقاً لـ ASME Sec V Art. 4', skillEn: 'Author and formally approve comprehensive UT procedure for pressure vessels per ASME Sec V Art. 4', importance: 'mandatory' },
        { skillAr: 'حل نزاع تحكيمي بين تقرير فحص RT يوضح شقاً طولياً وتقرير UT يوضح نقص تغلغل جذري', skillEn: 'Arbitrate technical dispute reconciling conflicting RT film flaw vs angle-beam UT echodynamic signal', importance: 'mandatory' },
        { skillAr: 'وضع أسئلة امتحانات التأهيل التخصصي والعملي للمستوى الثاني وتدقيق العينات المشوبة بعيوب معلومة', skillEn: 'Formulate Specific and Practical qualification exams for Level II candidates using master flawed specimens', importance: 'mandatory' }
      ],
      referenceTextbooks: [
        { title: 'ASNT Recommended Practice No. SNT-TC-1A (Latest Edition)', author: 'ASNT Standards Development', standardOrPublisher: 'American Society for NDT' },
        { title: 'Fracture Mechanics: Fundamentals and Applications', author: 'T. L. Anderson', standardOrPublisher: 'CRC Press' },
        { title: 'ASM Handbook, Volume 17: Nondestructive Evaluation and Quality Control', author: 'ASM International', standardOrPublisher: 'ASM Press' }
      ]
    }
  ]
};
