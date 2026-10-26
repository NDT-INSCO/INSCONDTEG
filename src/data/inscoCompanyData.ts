export interface CompanyProfile {
  name: { ar: string; en: string };
  shortName: string;
  tagline: { ar: string; en: string };
  slogan: { ar: string; en: string };
  subSlogan: { ar: string; en: string };
  docRef: string;
  revision: string;
  establishedYear: number;
  incorporationNo: string;
  commercialRegistrationNo: string;
  egacCabNo: string;
  ndtOrgId: string;
  pdfBrochureUrl: string;
  quote: {
    text: { ar: string; en: string };
    author: { ar: string; en: string };
  };
  metrics: {
    value: string;
    label: { ar: string; en: string };
    subLabel: { ar: string; en: string };
  }[];
  quickFacts: { ar: string; en: string }[];
  contacts: {
    phones: string[];
    whatsapp: string;
    email: string;
    fax: string;
    headOffice: { ar: string; en: string };
    workshops: { ar: string; en: string };
    ndtOrgListingUrl: string;
  };
  fiveReasons: {
    number: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
  }[];
  certifications: {
    id: string;
    code: string;
    title: { ar: string; en: string };
    certNo: string;
    issueDate: string;
    expiryDate: string;
    issuingBody: string;
    accreditationBody: string;
    scope: { ar: string; en: string };
    badgeColor: string;
  }[];
  leadAuditor: {
    title: { ar: string; en: string };
    body: string;
    courseNo: string;
    certNo: string;
    udn: string;
    scope: { ar: string; en: string };
  };
  ndtMethods: {
    id: string;
    code: string;
    name: { ar: string; en: string };
    standards: string;
    category: { ar: string; en: string };
    description: { ar: string; en: string };
    equipment: { ar: string; en: string };
  }[];
  pwhtFleet: {
    title: { ar: string; en: string };
    unitCount: number;
    powerRating: string;
    features: { ar: string; en: string }[];
    codes: string[];
    description: { ar: string; en: string };
  };
  services: {
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    highlights: { ar: string; en: string }[];
    iconName: string;
  }[];
  clients: {
    client: string;
    project: { ar: string; en: string };
    activities: { ar: string; en: string };
    country: string;
  }[];
  facilities: {
    name: { ar: string; en: string };
    clientOrContractor: string;
    scope: { ar: string; en: string };
    location: { ar: string; en: string };
    status: 'verified_public' | 'representative';
  }[];
  annexes: {
    id: string;
    code: string;
    title: { ar: string; en: string };
    pageNo: number;
    category: string;
    issuingBody: string;
    summary: { ar: string; en: string };
  }[];
}

export const INSCO_COMPANY_DATA: CompanyProfile = {
  name: {
    ar: 'الشركة الدولية للخدمات والمقاولات - إنسكو',
    en: 'International for Services & Constructions Company - INSCO'
  },
  shortName: 'INSCO',
  tagline: {
    ar: 'الريادة الهندسية في الفحوصات غير الإتلافية والمعالجات الحرارية وخدمات اللحام',
    en: 'Integrated Non-Destructive Testing, Heat Treatment and Welding Services'
  },
  slogan: {
    ar: 'انظر أبعد من السطح.',
    en: 'SEE BEYOND THE SURFACE.'
  },
  subSlogan: {
    ar: 'هندسة النزاهة الإنشائية في كل أصل صناعي.',
    en: 'Engineering integrity into every asset.'
  },
  docRef: 'INSCO/CP/2026-10',
  revision: 'Revision 5 - Issued 05 OCT 2026',
  establishedYear: 2010,
  incorporationNo: '3566/2010',
  commercialRegistrationNo: '209632',
  egacCabNo: '#120007',
  ndtOrgId: '54161',
  pdfBrochureUrl: '/assets/aistudio/__________________d082de13.pdf',

  quote: {
    text: {
      ar: 'عملاؤنا لا يشترون مجرد اختبارات - إنهم يشترون اليقين الهندسي والسلامة المطلقة. كل تقرير نصدره يحمل ثقل اعتماداتنا وتوقيع مهندسينا المعتمدين.',
      en: 'Our clients do not buy tests - they buy certainty. Every report we issue carries the weight of our certifications and the signature of our engineers.'
    },
    author: {
      ar: 'الإدارة العامة - شركة إنسكو',
      en: 'General Management, INSCO'
    }
  },

  metrics: [
    {
      value: '20+',
      label: { ar: 'عاماً من إدارة ضبط وتوكيد الجودة', en: 'Years QA/QC Management' },
      subLabel: { ar: 'مشروعات قومية ودولية كبرى', en: 'National & international mega projects' }
    },
    {
      value: '16',
      label: { ar: 'وحدة معالجة حرارية PWHT مملوكة بالكامل', en: 'PWHT 65 kW Units Owned' },
      subLabel: { ar: 'أجهزة أوتوماتيكية مبرمجة 24/7', en: '100% company-owned automatic fleet' }
    },
    {
      value: '12',
      label: { ar: 'عائلة متكاملة من طرق الفحص NDT', en: 'NDT & Mechanical Method Families' },
      subLabel: { ar: 'شاملة PAUT و RT و MFL و PMI', en: 'Full volumetric, surface & metallurgy suite' }
    },
    {
      value: '3',
      label: { ar: 'شهادات ISO ثلاثية معتمدة حتى 2028', en: 'Triple ISO Systems to 2028' },
      subLabel: { ar: 'ISO 9001, 14001, 45001 معتمدة من EGAC', en: 'EGAC CAB #120007 - IAF MLA' }
    }
  ],

  quickFacts: [
    { ar: 'تأسست عام 2010 - سجل تجاري 209632 - ترخيص 3566/2010', en: 'Established 2010 - Cert. of Inc. 3566/2010 - CR 209632' },
    { ar: 'نظام إدارة ثلاثي الأيزو معتمد حتى 2028 (الجودة، البيئة، والسلامة المهنية)', en: 'Triple ISO-certified management system through 2028' },
    { ar: 'كبير مدققي جودة معتمد CQI-IRCA Lead Auditor ضمن طاقم الشركة الدائم', en: 'CQI-IRCA Lead Auditor on permanent in-house staff' },
    { ar: 'فريق مهندسين وفنيين معتمدين ASNT / ISO 9712 Level II في كافة الطرق', en: 'Certified ASNT Level II inspection team across all techniques' },
    { ar: 'أسطول كامل من 16 وحدة معالجة حرارية أوتوماتيكية 65 kW جاهزة للاستنفار الفوري', en: '16 x 65 kW automatic PWHT units - 100% company owned in Cairo' },
    { ar: 'أسطول فحص شامل: مصادر جاما (Ir-192 / Se-75)، وأشعة سينية X-ray، و PAUT، و MFL', en: 'Full NDT fleet incl. PAUT, Gamma RT (Ir-192/Se-75), X-ray, MFL & Eddy Current' },
    { ar: 'ممارسات وتراخيص إشعاعية مرخصة رسمياً من هيئة الرقابة النووية والإشعاعية ENRRA', en: 'ENRRA-licensed radiation practices and transport permits' },
    { ar: 'مسجلة بالدليل الدولي للفحص غير الإتلافي www.ndt.org (رقم 54161)', en: 'Listed on www.ndt.org international industrial directory (#54161)' },
    { ar: 'المقر الرئيسي بالقاهرة ومخازن الورش بالجيزة مع انتشار ميداني في مصر وخارجها', en: 'Cairo headquarters & Giza works with regional mobilization' }
  ],

  contacts: {
    phones: ['+20 109 077 7202', '+20 122 582 6396'],
    whatsapp: '+20 109 077 7202',
    email: 'insco50@yahoo.com',
    fax: '+20 2 3809 8142',
    headOffice: {
      ar: 'عمارة 7-16 مشروع اللاسلكي، طريق الأوتوستراد، المعادي، القاهرة',
      en: 'Office: 7-16 Bldg Project Elasliky, Autostrade Way, Maadi, Cairo, Egypt'
    },
    workshops: {
      ar: 'شارع الجلاء، أبو النمرس، الجيزة 12911',
      en: 'Works: Ali Galaa St., Abo ELNOMROUS, Giza 12911, Egypt'
    },
    ndtOrgListingUrl: 'https://www.ndt.org'
  },

  fiveReasons: [
    {
      number: '01',
      title: {
        ar: 'مورد واحد بنطاق عمل متكامل (One Supplier, Full Scope)',
        en: 'One Supplier, Full Scope'
      },
      description: {
        ar: 'فحوصات NDT والمعالجة الحرارية PWHT ودعم اللحام وتوريد العمالة المتخصصة تحت مظلة نظام إدارة واحد معتمد - واجهات اتصال أقل ومسؤولية تعاقدية موحدة.',
        en: 'NDT + heat treatment + welding support + manpower under a single certified management system - fewer interfaces, one single accountability.'
      }
    },
    {
      number: '02',
      title: {
        ar: 'الملكية تعني الجاهزية الفورية (Ownership Equals Readiness)',
        en: 'Ownership Equals Readiness'
      },
      description: {
        ar: 'كل جهاز ووحدة معالجة حرارية مملوكة بالكامل لشركة إنسكو ومخزنة بالقاهرة - استنفار فوري لأي موقع عمل في مصر دون انتظار أو تأخير من سوق الإيجارات.',
        en: 'Every instrument and heat-treatment unit is company-owned and stored in Cairo - mobilization to any site in Egypt without rental-market delays.'
      }
    },
    {
      number: '03',
      title: {
        ar: 'ثقافة جودة خاضعة للتدقيق الصارم (An Audited Quality Culture)',
        en: 'An Audited Quality Culture'
      },
      description: {
        ar: 'كبير مدققي جودة CQI-IRCA Lead Auditor داخل الشركة، وفنيون معتمدون ASNT Level II، وتوكيد وضبط جودة ينفذه مهندسو الشركة، و3 أنظمة أيزو تخضع لمراجعات سنوية حتى 2028.',
        en: 'A CQI-IRCA lead auditor inside the company, ASNT Level II technicians, QC/QA executed by company engineers, three ISO systems surveilled annually through 2028.'
      }
    },
    {
      number: '04',
      title: {
        ar: 'مكانة واعتمادات عابرة للحدود (Recognition Beyond Borders)',
        en: 'Recognition Beyond Borders'
      },
      description: {
        ar: 'ممارسات إشعاعية مرخصة من ENRRA، وتسجيل معتمد في دليل www.ndt.org الدولي، وسابقة أعمال منفذة في اليمن وأفغانستان والمنطقة العربية.',
        en: 'ENRRA-licensed radiation practices, listing on www.ndt.org international directory, and completed works in Yemen, Afghanistan, and the region.'
      }
    },
    {
      number: '05',
      title: {
        ar: 'امتثال كودي موثق يمكنك أرشفته (Compliance You Can File)',
        en: 'Compliance You Can File'
      },
      description: {
        ar: 'أرقام الشهادات وتواريخ الإصدار والانتهاء منشورة للتحقق الفوري مع جهات الاعتماد - ملف المورد جاهز للاعتماد مع أدلة كاملة في المرفقات.',
        en: 'Certificate numbers, issue and expiry dates published for direct verification with accreditation bodies - vendor-file ready with full evidence.'
      }
    }
  ],

  certifications: [
    {
      id: 'iso_9001',
      code: 'ISO 9001:2015',
      title: {
        ar: 'نظام إدارة الجودة (Quality Management System)',
        en: 'Quality Management System'
      },
      certNo: '24202QMS094',
      issueDate: '15 Jan 2025',
      expiryDate: '15 Jan 2028',
      issuingBody: 'QCS Middle East Africa',
      accreditationBody: 'EGAC CAB #120007 - IAF 37',
      scope: {
        ar: 'تقديم خدمات الفحص غير الإتلافي NDT والمعالجة الحرارية PWHT وخدمات اللحام',
        en: 'Provision of Non-Destructive Testing (NDT), Heat Treatment (PWHT) and Welding Services'
      },
      badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-500/10'
    },
    {
      id: 'iso_14001',
      code: 'ISO 14001:2015',
      title: {
        ar: 'نظام الإدارة البيئية (Environmental Management System)',
        en: 'Environmental Management System'
      },
      certNo: '23402EMS042',
      issueDate: '15 Jan 2025',
      expiryDate: '15 Jan 2028',
      issuingBody: 'QCS Middle East Africa',
      accreditationBody: 'EGAC CAB #120007 - IAF 35',
      scope: {
        ar: 'إدارة الالتزام البيئي والحد من المخلفات الصناعية أثناء عمليات الفحص الميداني والمعالجات',
        en: 'Environmental compliance management for field NDT, heat treatment and welding operations'
      },
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
    },
    {
      id: 'iso_45001',
      code: 'ISO 45001:2018',
      title: {
        ar: 'نظام إدارة السلامة والصحة المهنية (Occupational Health & Safety)',
        en: 'Occupational Health & Safety Management'
      },
      certNo: '23502OHS063',
      issueDate: '15 Jan 2025',
      expiryDate: '15 Jan 2028',
      issuingBody: 'QCS Middle East Africa',
      accreditationBody: 'EGAC CAB #120007 - IAF 35',
      scope: {
        ar: 'حماية الكوادر الفنية وضمان أعلى معايير السلامة الإشعاعية والحرارية بالمواقع البترولية',
        en: 'Occupational health, safety, and radiological protection standards across high-risk industrial sites'
      },
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10'
    }
  ],

  leadAuditor: {
    title: {
      ar: 'كبير مدققي جودة معتمد CQI-IRCA Lead Auditor',
      en: 'In-House CQI-IRCA Lead Auditor'
    },
    body: 'CQI & IRCA - Chartered Quality Institute / International Register of Certificated Auditors (UK)',
    courseNo: 'CQI-IRCA Course No. 18096',
    certNo: 'Certificate No. 121',
    udn: 'UDN 27956',
    scope: {
      ar: 'نطاق تدقيق معتمد لجميع الأنظمة الثلاثية: خدمات الفحص غير الإتلافي والمعالجة الحرارية واللحام.',
      en: 'Certified scope across all three systems: provision of NDT services, heat treatment and welding.'
    }
  },

  ndtMethods: [
    {
      id: 'vt',
      code: 'VT',
      name: { ar: 'الفحص البصري الهندسي (Visual Inspection)', en: 'Visual Inspection (VT)' },
      standards: 'ASME V Art. 9 - AWS D1.1 - API 570',
      category: { ar: 'فحص سطحي خط الدفاع الأول', en: 'Surface Inspection - 1st Line of Defense' },
      description: {
        ar: 'فحص بصري مباشر وعن بُعد للحامات والمكونات والمنشآت لكشف العيوب السطحية وعدم الاستواء والتآكل باستخدام مقاييس اللحام والمناظير Borescopes والإضاءة المقننة.',
        en: 'Direct and remote visual examination for surface discontinuities, misalignment and corrosion using calibrated weld gauges, borescopes and lighting kits.'
      },
      equipment: { ar: 'مقاييس كامبريدج، Hi-Lo، مناظير فحص دقيقة، أجهزة قياس شدة الإضاءة Lux', en: 'Cambridge & Hi-Lo gauges, optical borescopes, calibrated light meters' }
    },
    {
      id: 'ut',
      code: 'UT',
      name: { ar: 'فحص الموجات فوق الصوتية (Ultrasonic Testing)', en: 'Ultrasonic Testing (UT)' },
      standards: 'ASME V Art. 4 & 5 - ASTM E797',
      category: { ar: 'فحص حجمي لكشف العيوب وقياس السمك', en: 'Volumetric Flaw Detection & Thickness Surveying' },
      description: {
        ar: 'نبضات صوتية عالية التردد تُحقن في المادة لتحليل انعكاسات العيوب الداخلية كالشروخ ونقص الانصهار والمسامية، بالإضافة لقياس دقيق لسماكة الجدران المتبقية.',
        en: 'High-frequency sound pulses coupled into material; reflections from internal flaws (lack of fusion, porosity, cracks) and wall-loss echoes are analyzed on screen.'
      },
      equipment: { ar: 'أجهزة UT رقمية A-Scan، مسابير طولية وزاوية 45°/60°/70°، قوالب V1/V2', en: 'Digital UT flaw detectors, angle/straight probes, calibrated V1/V2 blocks' }
    },
    {
      id: 'rt',
      code: 'RT',
      name: { ar: 'التصوير الإشعاعي الصناعي (Radiographic Testing)', en: 'Radiographic Testing (RT)' },
      standards: 'ASME V Art. 2 - ISO 17636',
      category: { ar: 'فحص حجمي بالأشعة وتوثيق دائم', en: 'Volumetric Imaging & Permanent Film Archive' },
      description: {
        ar: 'حزم إشعاعية من مصادر جاما (Ir-192 / Se-75) أو أجهزة X-ray تخترق اللحامات وتظهر التغيرات الكثافية على الأفلام والكواشف الرقمية بترخيص ENRRA الصارم.',
        en: 'Gamma beams (Ir-192, Se-75) or X-rays traverse welds exposing film or digital detectors, revealing volumetric defects under strict ENRRA radiation-safety controls.'
      },
      equipment: { ar: 'حاويات جاما Sentinel / Spec 150، أجهزة أشعة سينية، أفلام صناعية، أجهزة Densitometer', en: 'Gamma projectors (Ir-192, Se-75), industrial X-ray units, calibrated densitometers' }
    },
    {
      id: 'mt',
      code: 'MT',
      name: { ar: 'فحص الجسيمات المغناطيسية (Magnetic Particle Testing)', en: 'Magnetic Particle Testing (MT)' },
      standards: 'ASME V Art. 7 - ASTM E709',
      category: { ar: 'كشف شقوق السطح وتحت السطح بالمواد الحديدية', en: 'Surface & Subsurface Ferromagnetic Crack Detection' },
      description: {
        ar: 'مغنطة المكونات وتطبيق مساحيق الحديد الملونة أو الفلورية لكشف تسرب الفيض المغناطيسي عند الشقوق السطحية والشبه سطحية بدقة وحساسية فائقة.',
        en: 'The component is magnetized and iron particles applied; discontinuities distort the magnetic field collecting particles into visible indications under white or UV light.'
      },
      equipment: { ar: 'حدوات تيار متردد ومستمر AC/DC Yokes، حبيبات جافة ورطبة، إضاءة UV سوداء', en: 'AC/DC electromagnetic yokes, dry/wet particles, calibrated UV-A lamps' }
    },
    {
      id: 'pt',
      code: 'PT',
      name: { ar: 'فحص السوائل النافذة (Liquid Penetrant Testing)', en: 'Liquid Penetrant Testing (PT)' },
      standards: 'ASME V Art. 6 - ISO 3452',
      category: { ar: 'كشف شقوق السطح بالمواد غير المسامية', en: 'Surface-Breaking Flaws in Non-Porous Metals' },
      description: {
        ar: 'سائل ذو توتر سطحي منخفض يتغلغل بالخاصية الشعرية داخل الشقوق المفتوحة للسطح، ليتم سحبه بالمظهر لتكوين دلالة واضحة في الصلب والألومنيوم والسبائك.',
        en: 'Low-surface-tension penetrant enters surface-breaking flaws by capillary action; developer bleeds out penetrant into vivid indications on non-porous alloys.'
      },
      equipment: { ar: 'سوائل نافذة ملونة وفلورية Type I/II، ومظهرات، ومنظفات معتمدة كودياً', en: 'Visible & fluorescent penetrant systems (Method A/C), solvent cleaners, developers' }
    },
    {
      id: 'paut',
      code: 'PAUT',
      name: { ar: 'المصفوفات الطورية المتقدمة (Phased Array UT)', en: 'Phased Array UT (PAUT)' },
      standards: 'ASME V Art. 4 App. - ISO 13588',
      category: { ar: 'مسح حجمي رقمي متعدد الزوايا وإلكتروني', en: 'Advanced Multi-Angle Electronic Sectorial Scanning' },
      description: {
        ar: 'مجوعات مجسات متعددة العناصر توجه وتركز حزم الموجات إلكترونياً لإنتاج مسح تصويري مشفر بحركة واحدة، بتغطية أسرع وتسجيل رقمي دائم للحام.',
        en: 'Multi-element arrays steer and focus ultrasonic beams electronically, producing encoded, imageable scans of weld volume in a single pass with permanent records.'
      },
      equipment: { ar: 'أجهزة PAUT رقمية متقدمة، ماسحات مشفرة Encoders، مسابير مصفوفات متعددة العناصر', en: 'Multi-channel PAUT flaw detectors, wheel encoders, 16/64/128 element matrix arrays' }
    },
    {
      id: 'pmi',
      code: 'PMI',
      name: { ar: 'مطابقة وتحديد السبيكة الإيجابي (Positive Material ID)', en: 'Positive Material Identification (PMI)' },
      standards: 'ASTM E572 - API RP 578',
      category: { ar: 'تحليل كيميائي فوري لتركيب السبائك', en: 'Instant Handheld XRF Chemical Grade Verification' },
      description: {
        ar: 'أجهزة فلورية الأشعة السينية المحمولة XRF تحدد التركيب الكيميائي للسبيكة في ثوانٍ، لضمان مطابقة الأنابيب والوصلات والمستهلكات للمواصفات ومنع الخلط.',
        en: 'Handheld X-ray fluorescence identifies alloy chemistry in seconds, verifying that pipes, fittings and weld consumables match specified metallurgy grades.'
      },
      equipment: { ar: 'أجهزة XRF محمولة معتمدة لتحليل عناصر Cr, Ni, Mo, Ti, Cu, Mn, Fe', en: 'Handheld XRF alloy analyzers with factory calibration libraries' }
    },
    {
      id: 'ht',
      code: 'HT',
      name: { ar: 'اختبار قياس الصلادة الميداني (Hardness Testing)', en: 'Field Hardness Testing (HT)' },
      standards: 'ASTM A956 - ISO 18265',
      category: { ar: 'التحقق من كفاءة المعالجة الحرارية و HAZ', en: 'Weld, Base Metal & HAZ Temper Verification' },
      description: {
        ar: 'قياسات صلادة محمولة بطريقة Leeb و UCI على معدن اللحام والمنطقة المتأثرة بالحرارة HAZ والمعدن الأصلي للتحقق من كفاءة PWHT ومقاومة التكسر.',
        en: 'Portable Leeb and UCI hardness measurements on weld metal, heat-affected zone and base metal verify material condition and effectiveness of post-weld heat treatment.'
      },
      equipment: { ar: 'أجهزة صلادة إلكترونية رقمية UCI / Leeb، كتل معايرة قياسية محققة', en: 'Portable digital Leeb & Ultrasonic Contact Impedance (UCI) hardness testers' }
    },
    {
      id: 'hydro',
      code: 'HYDRO',
      name: { ar: 'اختبار الضغط الهيدروستاتيكي (Hydrostatic Testing)', en: 'Hydrostatic Pressure Testing' },
      standards: 'ASME B31.3 - API 1104',
      category: { ar: 'إثبات السلامة الإنشائية ومقاومة التسريب', en: 'Proof of Structural Tightness & Pressure Integrity' },
      description: {
        ar: 'ملء الأنابيب والأوعية بالماء وضغطها أعلى من ضغط التصميم مع مراقبة مستمرة للتسريب والتشوه الدائم، كدليل قاطع على السلامة قبل التشغيل.',
        en: 'Piping and vessels are filled and pressurized above design pressure with water while monitored for leakage and deformation - definitive proof before commissioning.'
      },
      equipment: { ar: 'مضخات ضغط هيدروليكية، مانومترات معايرة، مسجلات ضغط رقمية Chart Recorders', en: 'High-pressure testing skids, calibrated deadweight testers, certified chart recorders' }
    },
    {
      id: 'sr',
      code: 'SR',
      name: { ar: 'قياس خشونة وبروفايل السطح (Surface Roughness)', en: 'Surface Roughness & Profile' },
      standards: 'ISO 8503 - ASTM D4417 - SSPC-PA 2',
      category: { ar: 'فحص التجهيز قبل تطبيق الدهان الواقي', en: 'Blast-Cleaned Anchor Profile Verification' },
      description: {
        ar: 'قياس عمق البروفايل للصلب المنظف بالرمال باستخدام أجهزة قياس الخشونة والمقارنات لتأكيد الالتصاق المطلوب للدهان كنقطة توقف إلزامية (Hold Point).',
        en: 'The anchor profile of blast-cleaned steel is measured with comparators and replica/profile testers to confirm adhesion profile before any primer is applied.'
      },
      equipment: { ar: 'مقاييس إبرية رقمية، شرائط Testex، مقارنات خشونة ISO 8503', en: 'Digital surface profile gauges, Testex replica tape, ISO 8503 comparators' }
    },
    {
      id: 'pc',
      code: 'PC',
      name: { ar: 'تفتيش الدهانات والطلاءات الواقية (Coating / Painting)', en: 'Coating & Painting Inspection' },
      standards: 'SSPC-PA 2 - ISO 19840 - NACE SP0188',
      category: { ar: 'حماية المنشآت من التآكل وفحص العوازل', en: 'Corrosion Protection, DFT & Holiday Testing' },
      description: {
        ar: 'قياس سمك الدهان الجاف DFT، واختبارات الالتصاق والتوصيل واختبار الشرر عالي الجهد (Holiday Detector) لكشف الثقوب المجهرية ومنع تآكل الأصول.',
        en: 'Dry-film thickness, cross-hatch adhesion and high-voltage spark (holiday) testing verify coating continuity, protecting assets against corrosive service environments.'
      },
      equipment: { ar: 'أجهزة قياس DFT إلكترونية، كواشف شرر Holiday Detectors، أجهزة قياس الرطوبة والندى', en: 'Digital dry film thickness gauges, high/low voltage holiday detectors, psychrometers' }
    },
    {
      id: 'mfl_ec',
      code: 'MFL / EC',
      name: { ar: 'التيارات الدوامية وتسرب الفيض (Eddy Current & MFL)', en: 'Eddy Current & Magnetic Flux Leakage' },
      standards: 'ASTM E426 - ASTM E2944 - API 653',
      category: { ar: 'مسح سريع لقيعان الخزانات وأنابيب المبادلات', en: 'High-Speed Tank Floor & Heat Exchanger Tubing Scans' },
      description: {
        ar: 'مسح أنابيب المبادلات الحرارية وتحديد التآكل الداخلي والخارجي، ومسح قيعان خزانات البترول بالفيض المغناطيسي المتسرب بسرعة إنتاجية عالية.',
        en: 'Eddy-current probes detect cracks and tube-wall loss on conductive alloys; MFL scanning maps corrosion and metal loss across tank floors and pipes at high speed.'
      },
      equipment: { ar: 'ماسحات قيعان الخزانات MFL Floor Scanners، أجهزة فحص أنابيب المبادلات EC/RFT', en: 'Motorized MFL tank floor scanners, multi-frequency eddy current tube inspection units' }
    }
  ],

  pwhtFleet: {
    title: {
      ar: 'أسطول المعالجة الحرارية بعد اللحام PWHT (16 وحدة 65 kW مملوكة بالكامل)',
      en: 'Post-Weld Heat Treatment Fleet (16 x 65 kW Automatic Units, 100% Owned)'
    },
    unitCount: 16,
    powerRating: '65 kW Fully Automatic',
    features: [
      { ar: '16 وحدة معالجة حرارية أوتوماتيكية بقدرة 65 kW مخزنة بالقاهرة وجاهزة للاستنفار', en: '16 fully automatic 65 kW units stored in Cairo, ready for instant field mobilization' },
      { ar: 'متحكمات ومبرمجات حرارية مستقلة متعددة القنوات 6/12 قناة', en: 'Independent multi-channel programmers and calibrated strip chart recorders' },
      { ar: 'مزدوجات حرارية (Thermocouples) معتمدة وسخانات سيراميكية مرنة FCP', en: 'Certified calibrated thermocouples and high-durability flexible ceramic pads' },
      { ar: 'تشغيل دورات حرارية مبرمجة على مدار 24/7 دون انقطاع', en: 'Continuous 24/7 programmed thermal soaking, heating, and cooling cycles' }
    ],
    codes: ['ASME B31.3 Table 331.1.1', 'AWS D10.10', 'AWS D1.1', 'API 537', 'ASME Section VIII UW-40'],
    description: {
      ar: 'تحكم دقيق في معدلات التسخين وزمن المكوث والتبريد لإزالة الإجهادات المتبقية وخفض صلادة منطقة اللحام و HAZ واستعادة المتانة، مع إصدار الرسوم البيانية المعتمدة كودياً.',
      en: 'Controlled heating, soaking, and cooling cycles relieve residual stresses and restore toughness per ASME/AWS with fully traceable temperature strip charts.'
    }
  },

  services: [
    {
      id: 'ndt_service',
      title: { ar: 'الفحوصات غير الإتلافية الشاملة (Complete NDT Services)', en: 'Complete Non-Destructive Testing' },
      description: {
        ar: 'تغطية شاملة لـ 12 طريقة فحص تحت نظام إدارة معتمد، بأيدي مهندسينا ومعداتنا المملوكة، جاهزون في موقعك.',
        en: 'Complete method coverage under one certified system - company engineers, company-owned equipment, ready at your site.'
      },
      highlights: [
        { ar: 'فحوصات حجمية وسطحية وميتالورجية', en: 'Volumetric, surface, and metallurgy testing' },
        { ar: 'فريق معتمد ASNT / ISO 9712 Level II', en: 'ASNT / ISO 9712 Level II certified team' },
        { ar: 'تراخيص إشعاعية كاملة من ENRRA', en: 'Licensed ENRRA radiation practices' }
      ],
      iconName: 'Search'
    },
    {
      id: 'pwht_service',
      title: { ar: 'المعالجة الحرارية بعد اللحام (PWHT Field Services)', en: 'Post-Weld Heat Treatment (PWHT)' },
      description: {
        ar: 'أكبر أسطول وحدات 65 kW أوتوماتيكية بالقاهرة، معالجة خطوط الأنابيب والأوعية والمبادلات والمراجل بدقة كودية صارمة.',
        en: 'Leading 16-unit 65 kW fleet in Cairo for thermal stress relieving of pipelines, pressure vessels and boilers.'
      },
      highlights: [
        { ar: '16 وحدة 65 kW مملوكة بالكامل', en: '16 company-owned automatic units' },
        { ar: 'تسجيل ومطابقة المخططات مع ASME/AWS', en: 'Calibrated charts audited to ASME/AWS' },
        { ar: 'أطقم تشغيل محترفة على مدار 24 ساعة', en: '24/7 experienced operating crews' }
      ],
      iconName: 'Flame'
    },
    {
      id: 'welding_manpower',
      title: { ar: 'خدمات اللحام وتوريد العمالة الماهرة (Welding & Manpower)', en: 'Welding & Manpower Supply' },
      description: {
        ar: 'أطقم لحام معتمدة وعمالة موقعية متخصصة تحت إشراف مهندسي إنسكو وإجراءات QC/QA الصارمة وفق ASME IX و AWS D1.1.',
        en: 'Certified welding crews and site manpower mobilized under INSCO engineers and QC/QA procedures.'
      },
      highlights: [
        { ar: 'لحامون مؤهلون كودياً على إجراءات WPS/PQR', en: 'Welders qualified to project WPS/PQR codes' },
        { ar: 'إشراف مباشر من مدققي الجودة IRCA', en: 'Direct oversight by IRCA lead auditors' },
        { ar: 'جاهزية لدعم المشروعات البترولية والصناعية', en: 'Turnkey mobilization for shutdown works' }
      ],
      iconName: 'Wrench'
    },
    {
      id: 'qc_qa_rental',
      title: { ar: 'إدارة الجودة وتأجير المعدات (QC/QA & Equipment Rental)', en: 'QC/QA & Equipment Rental' },
      description: {
        ar: 'خطط التفتيش والاختبار ITP، ونقاط التوقف والشهود Hold Points، وضبط الوثائق، وتأجير المعدات مع مشغليها المحترفين.',
        en: 'Inspection and test plans, hold-point witnessing, documentation control and equipment rental with operators.'
      },
      highlights: [
        { ar: 'إصدار واعتماد إجراءات التفتيش الفنية', en: 'Authoring & approving technical ITPs' },
        { ar: 'تأجير أجهزة مع مشغلين محترفين', en: 'Equipment rental with certified operators' },
        { ar: 'نقطة اتصال واحدة مسؤولة عن الجودة', en: 'Single accountable QA/QC interface' }
      ],
      iconName: 'ShieldCheck'
    }
  ],

  clients: [
    {
      client: 'SIEMENS / ORASCOM',
      project: { ar: 'خطوط الأنابيب والخزانات - محطة البرلس ومواقع مصر', en: 'Pipelines & Tanks - Burullus CCPP & Egypt' },
      activities: { ar: 'فحص إشعاعي RT (X-ray)، و PT، و MT، ومصفوفات طورية PAUT', en: 'RT (X-ray), PT, MT, Phased Array UT' },
      country: 'Egypt'
    },
    {
      client: 'ADPC / PETROMASILA',
      project: { ar: 'خطوط أنابيب البترول - قطاع المسيلة باليمن', en: 'Oil Pipelines - Masila Block, R.O. Yemen' },
      activities: { ar: 'فحص إشعاعي جاما RT (Gamma-Ray Ir-192)، واختبار العوازل Holiday', en: 'RT (gamma-ray), Holiday spark testing' },
      country: 'Yemen'
    },
    {
      client: 'PGESCO / Ansaldo',
      project: { ar: 'خطوط إمداد الوقود - محطات الكهرباء', en: 'Fuel Pipe Lines - Power Stations' },
      activities: { ar: 'فحص إشعاعي بالمصادر المشعة RT (Gamma-Ray)', en: 'RT (gamma-ray) inspection' },
      country: 'Egypt'
    },
    {
      client: 'PGESCO / GE - Orascom',
      project: { ar: 'محطة توليد كهرباء 6 أكتوبر', en: '6th of October Power Station' },
      activities: { ar: 'كافة فحوصات NDT على خطوط الأنابيب وأوعية الضغط والخزانات', en: 'All NDT on pipe lines & tanks' },
      country: 'Egypt'
    },
    {
      client: 'U.S. Army / Serka & Contrack',
      project: { ar: 'قاعدة باجرام الجوية - مطار باجرام الدولي', en: 'Bagram Air Field - Afghanistan' },
      activities: { ar: 'فحوصات NDT ومعالجات حرارية PWHT لمنشآت الوقود', en: 'NDT & PWHT for fuel tanker offload facility' },
      country: 'Afghanistan'
    },
    {
      client: 'CMI & ARESCO',
      project: { ar: 'محطات كهرباء طلخا والكريمات البخارية والمركبة', en: 'Talkha & El-Kureimat Power Stations' },
      activities: { ar: 'فحوصات NDT متكاملة ومعالجة حرارية بعد اللحام PWHT', en: 'NDT & PWHT boiler & turbine works' },
      country: 'Egypt'
    },
    {
      client: 'PSEW / NVOC - Nat. Vegetable Oils',
      project: { ar: 'مجمع مصانع الزيوت النباتية - برج العرب بالإسكندرية', en: 'Borg El-Arab Plant - Alexandria' },
      activities: { ar: 'فحوصات RT، و UT، و PT، و MT، ومعالجة حرارية PWHT', en: 'RT, UT, PT, MT & PWHT' },
      country: 'Egypt'
    },
    {
      client: 'MARIDIVE Offshore & AIC / Siemens',
      project: { ar: 'محطة كهرباء عيون موسى البخارية - السويس', en: 'Ayoun Mousa Steam Power Plant - Suez' },
      activities: { ar: 'فحوصات NDT بحرية وبرية ومعالجة حرارية PWHT', en: 'NDT & PWHT marine & high-pressure steam' },
      country: 'Egypt'
    },
    {
      client: 'El Sewedy Electric',
      project: { ar: 'مصانع المحولات الكهربائية العملاقة - القاهرة', en: 'Transformer Works - Cairo (PO GM102473)' },
      activities: { ar: 'فحص VT، و UT، و MT، و PT، و RT، واختبار الصلادة ومعالجة PWHT', en: 'VT, UT, MT, PT, RT, hardness, PWHT' },
      country: 'Egypt'
    }
  ],

  facilities: [
    {
      name: { ar: 'محطة كهرباء عيون موسى البخارية - السويس', en: 'Ayoun Mousa Steam Power Plant - Suez' },
      clientOrContractor: 'MARIDIVE Offshore & AIC / Siemens',
      scope: { ar: 'فحوصات NDT والمعالجة الحرارية PWHT لأنابيب ومراجل الضغط العالي', en: 'NDT & PWHT on boilers and steam pipes' },
      location: { ar: 'السويس، مصر', en: 'Suez, Egypt' },
      status: 'verified_public'
    },
    {
      name: { ar: 'محطة كهرباء البرلس المركبة العملاقة 4800 MW', en: 'El-Burullus / Kafr El-Sheikh 4800 MW CCPP' },
      clientOrContractor: 'ORASCOM Construction / Siemens',
      scope: { ar: 'مقاول باطن لعمليات PWHT والفحوصات الإشعاعية والفوق صوتية', en: 'PWHT & inspection subcontract' },
      location: { ar: 'كفر الشيخ، مصر', en: 'Kafr El-Sheikh, Egypt' },
      status: 'verified_public'
    },
    {
      name: { ar: 'مصانع السويدي إلكتريك للمحولات الكهربائية', en: 'Elsewedy Electric Transformer Works - Cairo' },
      clientOrContractor: 'El Sewedy Electric (PO GM102473)',
      scope: { ar: 'فحوصات NDT الشاملة والمعالجة الحرارية لأجسام وخزانات المحولات', en: 'NDT + PWHT on high-voltage transformer tanks' },
      location: { ar: 'العاشر من رمضان / القاهرة', en: 'Cairo, Egypt' },
      status: 'verified_public'
    },
    {
      name: { ar: 'محطة توليد كهرباء طلخا - الدقهلية', en: 'Talkha Power Station - Dakahlia' },
      clientOrContractor: 'CMI & ARESCO',
      scope: { ar: 'فحوصات NDT ومعالجة حرارية لمراجل التوليد', en: 'NDT & PWHT boiler & piping works' },
      location: { ar: 'الدقهلية، مصر', en: 'Dakahlia, Egypt' },
      status: 'representative'
    },
    {
      name: { ar: 'محطة توليد كهرباء الكريمات - بني سويف', en: 'El-Kureimat Power Plant - Beni Suef' },
      clientOrContractor: 'CMI & ARESCO',
      scope: { ar: 'فحوصات NDT ومراقبة الجودة وعمليات PWHT', en: 'NDT & PWHT power plant facilities' },
      location: { ar: 'بني سويف، مصر', en: 'Beni Suef, Egypt' },
      status: 'representative'
    },
    {
      name: { ar: 'مجمع مصانع NVOC للزيوت - برج العرب', en: 'NVOC Plant - Borg El-Arab, Alexandria' },
      clientOrContractor: 'PSEW / NVOC',
      scope: { ar: 'فحوصات RT، و UT، و PT، و MT، ومعالجة حرارية PWHT', en: 'RT, UT, PT, MT & PWHT on industrial vessels' },
      location: { ar: 'الإسكندرية، مصر', en: 'Alexandria, Egypt' },
      status: 'representative'
    },
    {
      name: { ar: 'منشآت قطاع المسيلة البترولية - اليمن', en: 'Masila Block Oil Facilities - R.O. Yemen' },
      clientOrContractor: 'ADPC / PETROMASILA & ASPC',
      scope: { ar: 'فحص إشعاعي جاما RT واختبارات فحص الأنابيب البترولية', en: 'RT & NDT on cross-country pipelines' },
      location: { ar: 'حضرموت / المسيلة، اليمن', en: 'Hadramout, Yemen' },
      status: 'representative'
    }
  ],

  annexes: [
    {
      id: 'annex_a_01',
      code: 'A-01',
      title: { ar: 'شهادة الأيزو 9001:2015 لإدارة الجودة', en: 'ISO 9001:2015 Certificate (QMS)' },
      pageNo: 15,
      category: 'Annex A - Management System Certificates',
      issuingBody: 'QCS Middle East Africa / EGAC CAB #120007',
      summary: { ar: 'شهادة رقم 24202QMS094 سارية حتى 15 يناير 2028 لنطاق خدمات NDT والمعالجة الحرارية واللحام.', en: 'Cert. No. 24202QMS094 valid to 15 Jan 2028 for NDT, PWHT and welding.' }
    },
    {
      id: 'annex_a_02',
      code: 'A-02',
      title: { ar: 'شهادة الأيزو 14001:2015 للإدارة البيئية', en: 'ISO 14001:2015 Certificate (EMS)' },
      pageNo: 16,
      category: 'Annex A - Management System Certificates',
      issuingBody: 'QCS Middle East Africa / EGAC CAB #120007',
      summary: { ar: 'شهادة رقم 23402EMS042 سارية حتى 15 يناير 2028 لنطاق الفحوصات والخدمات البترولية.', en: 'Cert. No. 23402EMS042 valid to 15 Jan 2028 for environmental management.' }
    },
    {
      id: 'annex_a_03',
      code: 'A-03',
      title: { ar: 'شهادة الأيزو 45001:2018 للسلامة والصحة المهنية', en: 'ISO 45001:2018 Certificate (OH&S)' },
      pageNo: 17,
      category: 'Annex A - Management System Certificates',
      issuingBody: 'QCS Middle East Africa / EGAC CAB #120007',
      summary: { ar: 'شهادة رقم 23502OHS063 سارية حتى 15 يناير 2028 للسلامة المهنية والإشعاعية.', en: 'Cert. No. 23502OHS063 valid to 15 Jan 2028 for occupational health & safety.' }
    },
    {
      id: 'annex_a_04',
      code: 'A-04',
      title: { ar: 'شهادة كبير مدققي الجودة CQI-IRCA Lead Auditor', en: 'CQI-IRCA Lead Auditor Certificate (No. 121)' },
      pageNo: 18,
      category: 'Annex A - Management System Certificates',
      issuingBody: 'CQI & IRCA (UK) / Course No. 18096',
      summary: { ar: 'شهادة مدقق رئيسي معتمد دولياً رقم 121 / UDN 27956 لكبير مدققي إنسكو.', en: 'QMS ISO 9001:2015 Lead Auditor qualification Certificate No. 121 / UDN 27956.' }
    },
    {
      id: 'annex_b_01',
      code: 'B-01',
      title: { ar: 'خطاب تقدير مجموعة سيركا التركية (مشروع قاعدة باجرام)', en: 'Serka Group - Letter of Appreciation (Bagram)' },
      pageNo: 19,
      category: 'Annex B - Personnel Qualifications & Recommendations',
      issuingBody: 'Serka Insaat ve Ticaret A.S. (Turkey)',
      summary: { ar: 'تقدير رسمي لإدارة إنسكو عن أعمال التفتيش واللحام بمشروع الجيش الأمريكي بأفغانستان.', en: 'Appreciation of INSCO management support on US Army Corps of Engineers project.' }
    },
    {
      id: 'annex_c_01',
      code: 'C-01',
      title: { ar: 'ترخيص الممارسة الإشعاعية من هيئة الرقابة النووية ENRRA', en: 'ENRRA Radiation Practice / Use License' },
      pageNo: 30,
      category: 'Annex C - Regulatory Licenses & Radiation Safety',
      issuingBody: 'Egyptian Nuclear & Radiological Regulatory Authority (ENRRA)',
      summary: { ar: 'ترخيص مكاني رسمي رقم LS.0112 بحيازة واستخدام مصادر التصوير الإشعاعي الصناعي (Ir-192 حتى 100 Ci).', en: 'Official ENRRA license covering industrial radiography sources (Ir-192 up to 100 Ci).' }
    },
    {
      id: 'annex_d_02',
      code: 'D-02',
      title: { ar: 'وثيقة التسجيل التجاري والبطاقة الضريبية الرسمية', en: 'Official Commercial & Tax Registration Document' },
      pageNo: 34,
      category: 'Annex D - Commercial & Legal Registration',
      issuingBody: 'مصلحة الضرائب المصرية والغرفة التجارية',
      summary: { ar: 'السجل التجاري رقم 209632 وشهادة التأسيس 3566/2010 والبطاقة الضريبية المختومة.', en: 'Official stamped tax and commercial registration of INSCO in Egypt.' }
    },
    {
      id: 'annex_e_01',
      code: 'E-01',
      title: { ar: 'أمر توريد السويدي إلكتريك (PO GM102473) لخدمات NDT و PWHT', en: 'El Sewedy Electric - Purchase Order GM102473' },
      pageNo: 35,
      category: 'Annex E - Client Orders, Contracts & References',
      issuingBody: 'El Sewedy Electric - Transformers & Distribution',
      summary: { ar: 'أمر توريد رسمي لفحوصات VT, UT, MT, PT, RT, الصلادة و PWHT مع خطاب ضمان 700 ألف جنيه.', en: 'Official signed purchase order for full NDT and PWHT transformer works.' }
    },
    {
      id: 'annex_e_06',
      code: 'E-06',
      title: { ar: 'عقد مقاولة باطن مع أوراسكوم للإنشاءات (محطة البرلس 4800 MW)', en: 'ORASCOM Subcontract Agreement (Burullus CCPP)' },
      pageNo: 40,
      category: 'Annex E - Client Orders, Contracts & References',
      issuingBody: 'ORASCOM Construction Industries',
      summary: { ar: 'عقد تنفيذ أعمال المعالجة الحرارية والتفتيش بمحطة كهرباء البرلس المركبة العملاقة.', en: 'Subcontract for PWHT, pre-heating and inspection at 4800 MW Burullus plant.' }
    },
    {
      id: 'annex_e_12',
      code: 'E-12',
      title: { ar: 'أمر تسليم وخدمات شركة سيمنس الألمانية SIEMENS AG', en: 'SIEMENS AG Delivery / Service Document 1' },
      pageNo: 46,
      category: 'Annex E - Client Orders, Contracts & References',
      issuingBody: 'SIEMENS AG (Germany)',
      summary: { ar: 'مستند تسليم وأمر خدمة رسمي رقم PO 783523 لأعمال إنسكو بمشروعات سيمنس.', en: 'Official delivery and service document recording INSCO works on Siemens projects.' }
    }
  ]
};
