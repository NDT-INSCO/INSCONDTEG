import type { SubTab } from '../components/EducationalAcademy';
import { INSCO_COMPANY_DATA } from '../data/inscoCompanyData';
import { ENGINEERING_DISCIPLINES } from '../data/academyCurriculum';
import { NDT_TEXTBOOKS } from '../data/ndeTextbooksData';

export type GlobalSearchCategory = 'services' | 'academy' | 'company';

export type GlobalSearchDestination =
  | { type: 'company'; sectionId?: string }
  | { type: 'academy'; subTab: SubTab };

export interface GlobalSearchItem {
  id: string;
  category: GlobalSearchCategory;
  code?: string;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  keywords: string[];
  featured?: boolean;
  destination: GlobalSearchDestination;
}

/**
 * Normalizes Arabic and Latin text for forgiving client-side substring filtering.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip Arabic diacritics (tashkeel)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildGlobalSearchIndex(): GlobalSearchItem[] {
  const items: GlobalSearchItem[] = [];

  /* ------------------------------------------------------------------------
   * 1. SERVICES (Core Services, 12 NDT Methods, PWHT & Calibrated Fleet, Labs)
   * ------------------------------------------------------------------------ */
  for (const svc of INSCO_COMPANY_DATA.services) {
    items.push({
      id: `service-${svc.id}`,
      category: 'services',
      title: svc.title,
      subtitle: svc.description,
      keywords: [
        ...svc.highlights.flatMap((h) => [h.ar, h.en]),
        'service',
        'خدمات',
        'فحص',
      ],
      featured: svc.id === 'pwht_service' || svc.id === 'ndt_service',
      destination: { type: 'company', sectionId: 'services' },
    });
  }

  for (const method of INSCO_COMPANY_DATA.ndtMethods) {
    items.push({
      id: `ndt-method-${method.id}`,
      category: 'services',
      code: method.code,
      title: method.name,
      subtitle: {
        ar: `${method.category.ar} · ${method.standards}`,
        en: `${method.category.en} · ${method.standards}`,
      },
      keywords: [
        method.code,
        method.standards,
        method.description.ar,
        method.description.en,
        method.equipment.ar,
        method.equipment.en,
      ],
      destination: { type: 'company', sectionId: 'services' },
    });
  }

  items.push(
    {
      id: 'service-fleet-inspector',
      category: 'services',
      code: '48+ UNITS',
      title: {
        ar: 'سجل الأصول وأسطول الأجهزة المعايرة (48+ جهاز)',
        en: 'Calibrated Equipment Fleet Register (48+ Units)',
      },
      subtitle: {
        ar: 'Krautkrämer USM 35X · Olympus OmniScan X3 · Sentinel 880 Gamma · XRF PMI',
        en: 'Krautkrämer USM 35X · Olympus OmniScan X3 · Sentinel 880 Gamma · XRF PMI',
      },
      keywords: [
        'fleet',
        'equipment',
        'omniscan',
        'krautkramer',
        'usm 35x',
        'sentinel 880',
        'xrf',
        'maximator',
        'calibration',
        'معدات',
        'اجهزه',
        'اسطول',
        'معايره',
      ],
      destination: { type: 'company', sectionId: 'fleet-inspector' },
    },
    {
      id: 'service-pwht-simulator',
      category: 'services',
      code: 'PWHT 65kW',
      title: {
        ar: 'المحاكي الحراري لأسطول المعالجة الحرارية (16 وحدة 65 kW)',
        en: '65 kW PWHT Thermal Cycle Simulator (16-Unit Fleet)',
      },
      subtitle: {
        ar: 'محاكاة 6 قنوات مزدوجات حرارية وفق ASME B31.1 و AWS D10.10',
        en: '6-channel PID thermocouple cycle per ASME B31.1 & AWS D10.10',
      },
      keywords: [
        'pwht',
        'heat treatment',
        '65 kw',
        'thermocouple',
        'p91',
        'p22',
        'معالجه حراريه',
        'افران',
        'سخانات سيراميكيه',
      ],
      destination: { type: 'company', sectionId: 'pwht-simulator' },
    },
    {
      id: 'service-rt-lightbox',
      category: 'services',
      code: 'RT FILM',
      title: {
        ar: 'مختبر قراءة وتفسير أفلام الأشعة الصناعية (RT Lightbox)',
        en: 'Digital Radiograph Film Lightbox & Flaw Interpreter',
      },
      subtitle: {
        ar: 'تفسير أفلام جاما Ir-192 و X-Ray وتقييم القبول والرفض كودياً',
        en: 'Gamma Ir-192 & X-Ray weld film density & ASME code acceptance',
      },
      keywords: ['rt', 'radiography', 'film', 'gamma', 'ir-192', 'xray', 'اشعه', 'افلام جاما'],
      destination: { type: 'company', sectionId: 'radiography-viewer' },
    },
    {
      id: 'service-ultrasonic-portal-lab',
      category: 'services',
      code: 'UT / PAUT',
      title: {
        ar: 'مختبر الأجهزة الرقمية الحي (UT & PAUT Flaw Detector Lab)',
        en: 'Live Digital UT & PAUT Flaw Detector Lab',
      },
      subtitle: {
        ar: 'تجربة مباشرة لجهازي Krautkrämer USM 35X و Olympus OmniScan X3',
        en: 'Interactive Krautkrämer USM 35X & Olympus OmniScan X3 consoles',
      },
      keywords: ['ut', 'paut', 'omniscan', 'usm 35x', 'flaw detector', 'موجات فوق صوتيه', 'مصفوفات طوريه'],
      destination: { type: 'company', sectionId: 'ultrasonic-lab' },
    },
    {
      id: 'service-hologram-lab',
      category: 'services',
      code: '3D LAB',
      title: {
        ar: 'المختبر ثلاثي الأبعاد والمحاكاة البصرية (3D Hologram Lab)',
        en: '3D Industrial Hologram & Motion Inspection Lab',
      },
      subtitle: {
        ar: 'استعراض ثلاثي الأبعاد لمسارات الأشعة والفحوصات غير الإتلافية',
        en: 'Interactive 3D visualization of non-destructive testing physics',
      },
      keywords: ['3d', 'hologram', 'motion', 'مختبر ثلاثي الابعاد', 'هولوجرام'],
      destination: { type: 'company', sectionId: 'hologram-lab' },
    }
  );

  /* ------------------------------------------------------------------------
   * 2. EDUCATIONAL MODULES (Academy Simulators, Workshops, Curricula, Exams)
   * ------------------------------------------------------------------------ */
  const academyCoreModules: GlobalSearchItem[] = [
    {
      id: 'academy-weld-simulator',
      category: 'academy',
      code: 'UT/PAUT SIM',
      featured: true,
      title: {
        ar: 'ورشة المحاكاة الشاملة للحام (أجهزة UT & PAUT + كالبريشن + تقرير PDF)',
        en: 'Comprehensive UT & PAUT Weld Simulator (Calibration, 3D Cone & PDF Report)',
      },
      subtitle: {
        ar: 'عينات فلات وكيرف · 16 عيب لحام · مخروط الأشعة 3D · مطابقة كود ASME / AWS',
        en: 'Flat & pipe specimens · 16 weld flaws · 3D beam cone · ASME/AWS evaluation',
      },
      keywords: [
        'weld simulator',
        'ut',
        'paut',
        'calibration',
        'beam cone',
        'inspection report',
        'pdf',
        'flat',
        'curved',
        'محاكاه اللحام',
        'كالبريشن',
        'تقرير فحص',
        'عيوب اللحام',
      ],
      destination: { type: 'academy', subTab: 'weld_simulator' },
    },
    {
      id: 'academy-dac-builder',
      category: 'academy',
      code: 'ASME DAC',
      featured: true,
      title: {
        ar: 'منشئ منحنى المعايرة DAC التفاعلي وتأثير سماكة العينة',
        en: 'Interactive ASME DAC Curve Builder & Thickness Attenuation',
      },
      subtitle: {
        ar: 'بناء منحنى تصحيح المسافة والسعة خطوة بخطوة وفق ASME Section V Art. 4',
        en: 'Step-by-step Distance-Amplitude Correction per ASME Section V Art. 4',
      },
      keywords: [
        'dac',
        'distance amplitude correction',
        'calibration curve',
        'asme section v',
        'sdh',
        'attenuation',
        'thickness',
        'منحني المعايره',
        'داك',
        'سماكه العينه',
      ],
      destination: { type: 'academy', subTab: 'dac_builder' },
    },
    {
      id: 'academy-workshops',
      category: 'academy',
      code: 'WORKSHOP',
      title: {
        ar: 'ورشة التدريب العملي الحية لأجهزة UT و PAUT',
        en: 'Hands-On UT & PAUT Virtual Training Workbench',
      },
      subtitle: {
        ar: 'مهام تدريبية ميدانية وقوانين سنيل للانكسار وضبط المسابير الزاوية',
        en: 'Field training missions, Snell law acoustics & angle-beam probe setup',
      },
      keywords: ['workshop', 'virtual lab', 'snell', 'probe', 'ورشه عمل', 'تدريب عملي', 'معمل افتراضي'],
      destination: { type: 'academy', subTab: 'workshops' },
    },
    {
      id: 'academy-simulation-history',
      category: 'academy',
      code: 'SIM LOG',
      title: {
        ar: 'سجل المحاكاة وتتبع محاولات الفحص السابقة (Simulation History)',
        en: 'Simulation History & NDT Attempt Log',
      },
      subtitle: {
        ar: 'سجل محلي دائم لمحاولات UT و PAUT و DAC والعيوب المختارة وحالة النجاح والرسوب والتوقيت',
        en: 'Persistent local log of NDT simulation attempts, defect types, pass/fail status & timestamps',
      },
      keywords: [
        'simulation history',
        'attempt log',
        'pass fail',
        'history',
        'سجل المحاكاه',
        'محاولات الفحص',
        'نتائج المحاكاه',
      ],
      destination: { type: 'academy', subTab: 'simulation_history' },
    },
    {
      id: 'academy-paut-controller',
      category: 'academy',
      code: 'PAUT CTRL',
      title: {
        ar: 'جهاز تحكم المصفوفات الطورية الميداني (PAUT Inspector Controller)',
        en: 'Field PAUT Inspector Controller & Focal Law Setup',
      },
      subtitle: {
        ar: 'ضبط قوانين التركيز (Focal Laws) والمسح القطاعي S-Scan والخطي',
        en: 'Electronic beam steering, sectorial S-scan & focal law configuration',
      },
      keywords: ['paut controller', 'focal law', 's-scan', 'sectorial', 'مصفوفات طوريه', 'تحكم paut'],
      destination: { type: 'academy', subTab: 'paut_controller' },
    },
    {
      id: 'academy-encyclopedia',
      category: 'academy',
      code: 'TEXTBOOKS',
      title: {
        ar: 'الكتب الدراسية التفاعلية وموسوعة NDT الهندسية',
        en: 'Interactive NDT Textbooks & Engineering Encyclopedia',
      },
      subtitle: {
        ar: 'مراجع علمية كاملة بتقليب الصفحات ومعامل حسابات فيزياء الفحص',
        en: 'Full flipbook textbooks, formulas & NDE physics calculators',
      },
      keywords: ['encyclopedia', 'textbooks', 'books', 'formulas', 'موسوعه', 'كتب دراسيه', 'مراجع'],
      destination: { type: 'academy', subTab: 'encyclopedia' },
    },
    {
      id: 'academy-curriculum',
      category: 'academy',
      code: 'ASNT / ISO',
      title: {
        ar: 'المناهج التدريبية المعتمدة (8 تخصصات هندسية - Level I, II, III)',
        en: 'Standardized Engineering Curricula (8 Disciplines - Level I, II, III)',
      },
      subtitle: {
        ar: 'مناهج متوافقة مع ASNT SNT-TC-1A و CP-189 و ISO 9712',
        en: 'Structured modules aligned with ASNT SNT-TC-1A, CP-189 & ISO 9712',
      },
      keywords: ['curriculum', 'curricula', 'asnt', 'iso 9712', 'level ii', 'level iii', 'مناهج', 'تخصصات', 'كورسات'],
      destination: { type: 'academy', subTab: 'curriculum' },
    },
    {
      id: 'academy-courses',
      category: 'academy',
      code: 'COURSES',
      title: {
        ar: 'كتالوج مقررات NDE-Ed التفاعلية',
        en: 'NDE-Ed Interactive Courses Catalog',
      },
      subtitle: {
        ar: 'وحدات دراسية تفاعلية في الفحص البصري والمغناطيسي والسوائل والموجات والأشعة',
        en: 'Self-paced modules covering VT, PT, MT, UT, RT & Eddy Current',
      },
      keywords: ['courses', 'nde-ed', 'e-learning', 'مقررات', 'دروس تفاعليه', 'دورات تدريبيه'],
      destination: { type: 'academy', subTab: 'courses' },
    },
    {
      id: 'academy-paths',
      category: 'academy',
      code: 'PATHS',
      title: {
        ar: 'مسارات التعلم الموجهة لمهندسي وفنيي الفحص',
        en: 'Guided NDT Career Learning Paths',
      },
      subtitle: {
        ar: 'خطط دراسية متدرجة من التأسيس الأكاديمي حتى الاحتراف الميداني',
        en: 'Step-by-step study tracks from fundamentals to field inspector',
      },
      keywords: ['learning paths', 'tracks', 'study plan', 'مسارات التعلم', 'خطه دراسيه'],
      destination: { type: 'academy', subTab: 'paths' },
    },
    {
      id: 'academy-edb',
      category: 'academy',
      code: 'EDB LIB',
      title: {
        ar: 'مكتبة الوثائق الهندسية الرقمية (EDB Flipbook Library)',
        en: 'EDB Engineering Document & Flipbook Library',
      },
      subtitle: {
        ar: 'أرشيف الكتب والمذكرات الفنية القابلة للتصفح المباشر',
        en: 'Browsable engineering manuals and technical study dossiers',
      },
      keywords: ['edb', 'library', 'flipbook', 'documents', 'مكتبه', 'وثائق هندسيه'],
      destination: { type: 'academy', subTab: 'edb' },
    },
    {
      id: 'academy-knowledge',
      category: 'academy',
      code: 'LESSONS',
      title: {
        ar: 'مكتبة الدروس التأسيسية ومسار القراءة',
        en: 'Foundational NDT Lessons & Reading Library',
      },
      subtitle: {
        ar: 'مقالات ودروس مبسطة لفيزياء ومبادئ الفحوصات غير الإتلافية',
        en: 'Core articles and structured reading for NDT fundamentals',
      },
      keywords: ['knowledge', 'lessons', 'reading', 'دروس تاسيسيه', 'قراءه'],
      destination: { type: 'academy', subTab: 'knowledge' },
    },
    {
      id: 'academy-certification-center',
      category: 'academy',
      code: 'EXAMS',
      title: {
        ar: 'مركز الامتحانات الرسمية والمحاكي التجريبي (ASNT / ISO)',
        en: 'Certification Exam Center & ASNT Mock Tests',
      },
      subtitle: {
        ar: 'اختبارات General و Specific و Practical محاكية لامتحانات التأهيل',
        en: 'Timed General, Specific & Practical qualification mock exams',
      },
      keywords: ['exam', 'certification', 'mock test', 'asnt exam', 'امتحانات', 'اختبارات', 'شهادات تاهيل'],
      destination: { type: 'academy', subTab: 'certification_center' },
    },
    {
      id: 'academy-practical',
      category: 'academy',
      code: 'PRACTICAL',
      title: {
        ar: 'التقييم العملي الموثق لتوصيف وتحديد أبعاد العيوب',
        en: 'Documented Practical Flaw Sizing Assessment',
      },
      subtitle: {
        ar: 'تمارين عملية على قراءة الإشارات وكتابة تقارير القبول والرفض',
        en: 'Hands-on evaluation checklists and flaw disposition exercises',
      },
      keywords: ['practical assessment', 'flaw sizing', 'تقييم عملي', 'اختبار عملي'],
      destination: { type: 'academy', subTab: 'practical' },
    },
    {
      id: 'academy-defects',
      category: 'academy',
      code: 'DEFECTS',
      title: {
        ar: 'أطلس ومحاكي عيوب اللحام (Weld Defect Simulator)',
        en: 'Weld Discontinuities & Defect Simulator',
      },
      subtitle: {
        ar: 'تحليل الشروخ ونقص الانصهار والخبث والمسامية وأفضل طرق كشفها',
        en: 'Cracks, lack of fusion, slag, porosity & code acceptance rules',
      },
      keywords: ['defects', 'cracks', 'porosity', 'slag', 'lack of fusion', 'عيوب اللحام', 'شروخ', 'مساميه', 'خبث'],
      destination: { type: 'academy', subTab: 'defects' },
    },
    {
      id: 'academy-pwht-curve',
      category: 'academy',
      code: 'PWHT CALC',
      title: {
        ar: 'حاسبة ومحاكي منحنيات المعالجة الحرارية (ASME B31.3 PWHT)',
        en: 'ASME B31.3 PWHT Thermal Curve Calculator',
      },
      subtitle: {
        ar: 'حساب درجات التسخين وزمن المكوث والتبريد لسبائك P1 و P4/P5 و P91',
        en: 'Calculate soak temperature, holding time & ramp rates for P1, Cr-Mo & P91',
      },
      keywords: ['pwht curve', 'soak time', 'asme b31.3', 'p91', 'حاسبه المعالجه الحراريه', 'منحني حراري'],
      destination: { type: 'academy', subTab: 'pwht_curve' },
    },
    {
      id: 'academy-standards-lib',
      category: 'academy',
      code: 'CODES LIB',
      title: {
        ar: 'مكتبة الأكواد والمواصفات القياسية (ASME / API / AWS / ISO)',
        en: 'International NDT Standards & Codes Library',
      },
      subtitle: {
        ar: 'دليل مرجعي لنطاق استخدام مواد وفصول ASME Sec V, VIII, IX و API 1104 و AWS D1.1',
        en: 'Scope and clauses across ASME Sec V/VIII/IX, API 1104, API 650 & AWS D1.1',
      },
      keywords: ['standards', 'codes', 'asme', 'api 1104', 'aws d1.1', 'مكتبه الاكواد', 'مواصفات قياسيه'],
      destination: { type: 'academy', subTab: 'standards' },
    },
    {
      id: 'academy-quiz',
      category: 'academy',
      code: 'QUIZ BANK',
      title: {
        ar: 'بنك أسئلة تأهيل مفتشي ASNT مع الشرح التفصيلي',
        en: 'ASNT Qualification Practice Quiz Bank',
      },
      subtitle: {
        ar: 'أسئلة اختيار من متعدد مع التفسير العلمي والمرجع الكودي لكل إجابة',
        en: 'Multiple-choice questions with code references and technical explanations',
      },
      keywords: ['quiz', 'questions', 'practice test', 'بنك اسئله', 'كويز'],
      destination: { type: 'academy', subTab: 'quiz' },
    },
    {
      id: 'academy-flashcards',
      category: 'academy',
      code: 'FLASHCARDS',
      title: {
        ar: 'بطاقات الاستذكار السريع للمصطلحات والمعادلات الهندسية',
        en: 'Quick Review NDT Technical Flashcards',
      },
      subtitle: {
        ar: 'مراجعة مركزة للمفاهيم والقوانين الأساسية قبل الامتحان',
        en: 'Rapid-fire concept and formula review decks for exam prep',
      },
      keywords: ['flashcards', 'review', 'terminology', 'بطاقات استذكار', 'مصطلحات'],
      destination: { type: 'academy', subTab: 'flashcards' },
    },
    {
      id: 'academy-roadmap',
      category: 'academy',
      code: 'ROADMAP',
      title: {
        ar: 'خارطة طريق مهندس الجودة والتفتيش (NDT Career Roadmap)',
        en: 'Quality & NDT Engineer Career Roadmap',
      },
      subtitle: {
        ar: 'المتطلبات وساعات الخبرة للتدرج من متدرب إلى مفتش Level III',
        en: 'Training hours and certification milestones from trainee to Level III',
      },
      keywords: ['roadmap', 'career', 'qa qc engineer', 'خارطه طريق', 'مسار مهني'],
      destination: { type: 'academy', subTab: 'roadmap' },
    },
    {
      id: 'academy-leaderboard',
      category: 'academy',
      code: 'XP BOARD',
      title: {
        ar: 'لوحة متصدري المعرفة ونقاط الخبرة (XP Leaderboard)',
        en: 'Academy Knowledge Leaderboard & XP Progress',
      },
      subtitle: {
        ar: 'متابعة التقدم التدريبي وإنجازات المتدربين في الأكاديمية',
        en: 'Track learning milestones, completed modules, and XP rankings',
      },
      keywords: ['leaderboard', 'xp', 'progress', 'لوحه المتصدرين', 'نقاط'],
      destination: { type: 'academy', subTab: 'leaderboard' },
    },
  ];

  items.push(...academyCoreModules);

  for (const disc of ENGINEERING_DISCIPLINES) {
    items.push({
      id: `academy-discipline-${disc.id}`,
      category: 'academy',
      code: disc.keyTechniques.slice(0, 2).join('/'),
      title: {
        ar: `منهج تخصصي: ${disc.titleAr}`,
        en: `Curriculum: ${disc.titleEn}`,
      },
      subtitle: {
        ar: disc.overviewAr,
        en: disc.overviewEn,
      },
      keywords: [
        ...disc.keyTechniques,
        ...disc.globalAccreditations,
        ...disc.targetIndustries,
      ],
      destination: { type: 'academy', subTab: 'curriculum' },
    });
  }

  for (const book of NDT_TEXTBOOKS) {
    items.push({
      id: `academy-textbook-${book.id}`,
      category: 'academy',
      code: `BOOK · ${book.discipline}`,
      title: {
        ar: book.titleAr,
        en: book.titleEn,
      },
      subtitle: {
        ar: book.subtitleAr,
        en: book.subtitleEn,
      },
      keywords: ['textbook', 'book', 'كتاب', book.id, book.discipline, book.edition],
      destination: { type: 'academy', subTab: 'encyclopedia' },
    });
  }

  /* ------------------------------------------------------------------------
   * 3. COMPANY INFORMATION (Profile, ISO/ENRRA, Projects, Vault, Contact/RFQ)
   * ------------------------------------------------------------------------ */
  items.push(
    {
      id: 'company-overview',
      category: 'company',
      code: INSCO_COMPANY_DATA.docRef,
      featured: true,
      title: {
        ar: 'الملف التعريفي الرسمي لشركة إنسكو وبيانات التسجيل',
        en: 'INSCO Corporate Profile & Official Registration Data',
      },
      subtitle: {
        ar: `تأسست ${INSCO_COMPANY_DATA.establishedYear} · سجل تجاري ${INSCO_COMPANY_DATA.commercialRegistrationNo} · كود إيجاك ${INSCO_COMPANY_DATA.egacCabNo}`,
        en: `Est. ${INSCO_COMPANY_DATA.establishedYear} · CR ${INSCO_COMPANY_DATA.commercialRegistrationNo} · EGAC ${INSCO_COMPANY_DATA.egacCabNo} · ndt.org #${INSCO_COMPANY_DATA.ndtOrgId}`,
      },
      keywords: [
        'about',
        'company profile',
        'insco',
        'commercial registration',
        '209632',
        '3566/2010',
        '54161',
        'maadi',
        'giza',
        'من نحن',
        'ملف الشركه',
        'سجل تجاري',
        'المعادي',
        'الجيزه',
      ],
      destination: { type: 'company' },
    },
    {
      id: 'company-enrra-irca',
      category: 'company',
      code: 'ENRRA / IRCA',
      title: {
        ar: 'ترخيص الرقابة النووية ENRRA وكبير مدققي الجودة CQI-IRCA',
        en: 'ENRRA Radiation License & In-House CQI-IRCA Lead Auditor',
      },
      subtitle: {
        ar: 'ترخيص ممارسة إشعاعية LS.0112 · كبير مدققي جودة معتمد UDN 27956',
        en: 'Official ENRRA license LS.0112 · Certificated Lead Auditor UDN 27956',
      },
      keywords: [
        'enrra',
        'radiation license',
        'nuclear',
        'irca',
        'cqi',
        'lead auditor',
        'udn 27956',
        'ls.0112',
        'الرقابه النوويه',
        'ترخيص اشعاعي',
        'مدقق جوده',
      ],
      destination: { type: 'company', sectionId: 'certifications' },
    },
    {
      id: 'company-standards-matrix',
      category: 'company',
      code: 'ASME / API',
      title: {
        ar: 'مصفوفة التوافق الكودي للمشاريع (ASME, API, AWS, ISO)',
        en: 'Corporate Engineering Codes & Standards Compliance Matrix',
      },
      subtitle: {
        ar: 'نقاط التوقف Hold Points ومتطلبات القبول لمحطات الطاقة وخطوط البترول والخزانات',
        en: 'Hold points & acceptance criteria across power plants, pipelines & storage tanks',
      },
      keywords: [
        'standards matrix',
        'asme section i',
        'asme section viii',
        'api 1104',
        'api 650',
        'aws d1.1',
        'hold points',
        'مصفوفه الاكواد',
        'معايير القبول',
      ],
      destination: { type: 'company', sectionId: 'standards-matrix' },
    },
    {
      id: 'company-projects-record',
      category: 'company',
      code: 'PROJECTS',
      featured: true,
      title: {
        ar: 'سابقة الأعمال والعملاء ومحطات التوليد الكبرى',
        en: 'Proven Track Record, Clients & Mega Power Facilities',
      },
      subtitle: {
        ar: 'سيمنس · أوراسكوم · بترومسيلة اليمن · السويدي إلكتريك · محطة البرلس 4800 MW · عيون موسى',
        en: 'Siemens · Orascom · PetroMasila Yemen · El Sewedy · Burullus 4800 MW · Ayoun Mousa',
      },
      keywords: [
        'projects',
        'clients',
        'track record',
        'siemens',
        'orascom',
        'petromasila',
        'pgesco',
        'elsewedy',
        'burullus',
        'ayoun mousa',
        'talkha',
        'kureimat',
        'bagram',
        'yemen',
        'سابقه الاعمال',
        'العملاء',
        'المشاريع',
        'محطه البرلس',
        'عيون موسي',
        'طلخا',
        'الكريمات',
        'السويدي',
        'اوراسكوم',
        'سيمنس',
      ],
      destination: { type: 'company', sectionId: 'projects' },
    },
    {
      id: 'company-testimonials',
      category: 'company',
      code: 'REVIEWS',
      title: {
        ar: 'شهادات وآراء العملاء وسجلات النجاح الميداني',
        en: 'Client Testimonials & Field Appreciation Records',
      },
      subtitle: {
        ar: 'خطابات شكر وتقييمات أداء من شركاء الطاقة والبترول والمقاولات',
        en: 'Verified appreciation letters and QA/QC feedback from EPC contractors',
      },
      keywords: ['testimonials', 'reviews', 'appreciation', 'serka', 'اراء العملاء', 'شهادات تقدير'],
      destination: { type: 'company', sectionId: 'testimonials' },
    },
    {
      id: 'company-vendor-vault',
      category: 'company',
      code: 'PDF VAULT',
      title: {
        ar: 'بوابة تأهيل الموردين والبروشور الرسمي (50 صفحة PDF + المرفقات)',
        en: 'Vendor Qualification Vault & Official 50-Page PDF Brochure',
      },
      subtitle: {
        ar: 'تحميل مباشر لملف الشركة المعتمد والمرفقات الرسمية A إلى E',
        en: 'Direct PDF dossier download and verifiable Annexes A through E',
      },
      keywords: [
        'brochure',
        'pdf',
        'vendor vault',
        'prequalification',
        'annex',
        'dossier',
        'بروشور',
        'ملف التاهيل',
        'مرفقات',
        'تحميل pdf',
      ],
      destination: { type: 'company', sectionId: 'vault' },
    },
    {
      id: 'company-contact-rfq',
      category: 'company',
      code: 'RFQ 24/7',
      title: {
        ar: 'التواصل المباشر وطلب عرض سعر فوري (RFQ & 24/7 Dispatch)',
        en: 'Contact Operations, Cairo/Giza Offices & Submit RFQ',
      },
      subtitle: {
        ar: `${INSCO_COMPANY_DATA.contacts.phones[0]} · ${INSCO_COMPANY_DATA.contacts.email} · استنفار ميداني 24/7`,
        en: `${INSCO_COMPANY_DATA.contacts.phones[0]} · ${INSCO_COMPANY_DATA.contacts.email} · 24/7 site mobilization`,
      },
      keywords: [
        'contact',
        'rfq',
        'quote',
        'quotation',
        'phone',
        'email',
        'whatsapp',
        'address',
        'cairo',
        'maadi',
        'insco50@yahoo.com',
        'تواصل',
        'اتصل بنا',
        'طلب تسعير',
        'عرض سعر',
        'تليفون',
        'عنوان',
      ],
      destination: { type: 'company', sectionId: 'contact' },
    }
  );

  for (const cert of INSCO_COMPANY_DATA.certifications) {
    items.push({
      id: `company-cert-${cert.id}`,
      category: 'company',
      code: cert.code,
      title: {
        ar: `${cert.code} — ${cert.title.ar}`,
        en: `${cert.code} — ${cert.title.en}`,
      },
      subtitle: {
        ar: `شهادة رقم ${cert.certNo} · صالحة حتى ${cert.expiryDate} (${cert.accreditationBody})`,
        en: `Cert No. ${cert.certNo} · Valid to ${cert.expiryDate} (${cert.accreditationBody})`,
      },
      keywords: [
        cert.code,
        cert.certNo,
        cert.issuingBody,
        cert.accreditationBody,
        cert.scope.ar,
        cert.scope.en,
        'iso',
        'ايزو',
        'شهاده جوده',
      ],
      destination: { type: 'company', sectionId: 'certifications' },
    });
  }

  for (const annex of INSCO_COMPANY_DATA.annexes) {
    items.push({
      id: `company-annex-${annex.id}`,
      category: 'company',
      code: `ANNEX ${annex.code}`,
      title: annex.title,
      subtitle: {
        ar: `${annex.issuingBody} · صفحة ${annex.pageNo} بالبروشور الرسمي`,
        en: `${annex.issuingBody} · Brochure Page ${annex.pageNo}`,
      },
      keywords: [annex.code, annex.category, annex.issuingBody, annex.summary.ar, annex.summary.en],
      destination: { type: 'company', sectionId: 'vault' },
    });
  }

  return items;
}

export const GLOBAL_SEARCH_ITEMS: GlobalSearchItem[] = buildGlobalSearchIndex();

/**
 * Simple, deterministic client-side text filter across Services, Educational Modules,
 * and Company Information (matches both Arabic and English fields simultaneously).
 */
export function filterGlobalSearchItems(
  query: string,
  categoryFilter: 'all' | GlobalSearchCategory = 'all',
  maxResults = 12
): GlobalSearchItem[] {
  const pool =
    categoryFilter === 'all'
      ? GLOBAL_SEARCH_ITEMS
      : GLOBAL_SEARCH_ITEMS.filter((item) => item.category === categoryFilter);

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    const featured = pool.filter((item) => item.featured);
    const rest = pool.filter((item) => !item.featured);
    return [...featured, ...rest].slice(0, Math.min(maxResults, 8));
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);

  const scored: { item: GlobalSearchItem; score: number }[] = [];

  for (const item of pool) {
    const codeNorm = normalizeSearchText(item.code ?? '');
    const titleArNorm = normalizeSearchText(item.title.ar);
    const titleEnNorm = normalizeSearchText(item.title.en);
    const subArNorm = normalizeSearchText(item.subtitle.ar);
    const subEnNorm = normalizeSearchText(item.subtitle.en);
    const kwNorm = normalizeSearchText(item.keywords.join(' '));

    const combinedHaystack = `${codeNorm} ${titleArNorm} ${titleEnNorm} ${subArNorm} ${subEnNorm} ${kwNorm}`;

    const matchesAllTokens = tokens.every((tok) => combinedHaystack.includes(tok));
    if (!matchesAllTokens) continue;

    let score = 10;
    if (codeNorm === normalizedQuery) score += 100;
    else if (codeNorm.startsWith(normalizedQuery)) score += 60;

    if (titleArNorm.startsWith(normalizedQuery) || titleEnNorm.startsWith(normalizedQuery)) {
      score += 50;
    } else if (titleArNorm.includes(normalizedQuery) || titleEnNorm.includes(normalizedQuery)) {
      score += 35;
    }

    for (const tok of tokens) {
      if (codeNorm.includes(tok)) score += 15;
      if (titleArNorm.includes(tok) || titleEnNorm.includes(tok)) score += 10;
      if (subArNorm.includes(tok) || subEnNorm.includes(tok)) score += 4;
    }

    if (item.featured) score += 3;

    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((entry) => entry.item);
}
