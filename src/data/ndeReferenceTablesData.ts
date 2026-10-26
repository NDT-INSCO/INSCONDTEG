export interface AcousticPropertyEntry {
  id: string;
  materialAr: string;
  materialEn: string;
  category: 'ferrous' | 'non_ferrous' | 'polymer_liquid' | 'special_crystal';
  categoryAr: string;
  categoryEn: string;
  density: number; // g/cm³
  longitudinalVelocity: number; // m/s
  shearVelocity: number; // m/s
  rayleighVelocity: number; // m/s
  acousticImpedance: number; // x10^6 kg/(m²·s) (Rayls)
  longitudinalWavelengthAt5MHz: number; // mm
}

export interface ElectricalConductivityEntry {
  id: string;
  alloyAr: string;
  alloyEn: string;
  conductivityIacsPct: number; // % IACS at 20°C
  conductivityMsm: number; // MS/m
  resistivityMicroOhmCm: number; // µΩ·cm
  relativePermeability: number; // µr
  standardPenetrationDepthAt100kHz: number; // mm
  typicalApplicationAr: string;
  typicalApplicationEn: string;
}

export interface RadioisotopeEntry {
  id: string;
  isotopeAr: string;
  isotopeEn: string;
  symbol: string;
  halfLifeAr: string;
  halfLifeEn: string;
  halfLifeDays: number;
  principalEnergiesMev: string;
  gammaConstantRhmPerCi: number; // R·m²/(h·Ci)
  hvlLeadMm: number; // mm
  hvlSteelMm: number; // mm
  hvlConcreteMm: number; // mm
  practicalThicknessRangeMm: string;
  primaryApplicationAr: string;
  primaryApplicationEn: string;
}

export interface WeldAcceptanceRule {
  flawTypeAr: string;
  flawTypeEn: string;
  asmeSecViiiUw51: { ar: string; en: string; isAcceptable: boolean };
  asmeSecViiiUw52: { ar: string; en: string; isAcceptable: boolean };
  asmeB313Normal: { ar: string; en: string; isAcceptable: boolean };
  asmeB313Severe: { ar: string; en: string; isAcceptable: boolean };
  awsD11Static: { ar: string; en: string; isAcceptable: boolean };
}

export interface PenetrantClassificationEntry {
  typeCode: string;
  typeAr: string;
  typeEn: string;
  methodCode: string;
  methodAr: string;
  methodEn: string;
  sensitivityLevel: string;
  developerForm: string;
  advantagesAr: string;
  advantagesEn: string;
  limitationsAr: string;
  limitationsEn: string;
}

export const ACOUSTIC_PROPERTIES_TABLE: AcousticPropertyEntry[] = [
  {
    id: 'mat-carbon-steel-1020',
    materialAr: 'فولاذ كربوني عادي (Carbon Steel 1020)',
    materialEn: 'Carbon Steel (AISI 1020)',
    category: 'ferrous',
    categoryAr: 'معادن حديدية',
    categoryEn: 'Ferrous Alloys',
    density: 7.85,
    longitudinalVelocity: 5920,
    shearVelocity: 3240,
    rayleighVelocity: 2980,
    acousticImpedance: 46.5,
    longitudinalWavelengthAt5MHz: 1.18
  },
  {
    id: 'mat-ss-304',
    materialAr: 'فولاذ أوستنيتي مقاوم للصدأ (Stainless Steel 304)',
    materialEn: 'Austenitic Stainless Steel (304)',
    category: 'ferrous',
    categoryAr: 'معادن حديدية',
    categoryEn: 'Ferrous Alloys',
    density: 7.93,
    longitudinalVelocity: 5660,
    shearVelocity: 3120,
    rayleighVelocity: 2870,
    acousticImpedance: 44.9,
    longitudinalWavelengthAt5MHz: 1.13
  },
  {
    id: 'mat-ss-316',
    materialAr: 'فولاذ أوستنيتي مقاوم للموليبدينوم (Stainless Steel 316L)',
    materialEn: 'Austenitic Stainless Steel (316L)',
    category: 'ferrous',
    categoryAr: 'معادن حديدية',
    categoryEn: 'Ferrous Alloys',
    density: 7.98,
    longitudinalVelocity: 5740,
    shearVelocity: 3150,
    rayleighVelocity: 2900,
    acousticImpedance: 45.8,
    longitudinalWavelengthAt5MHz: 1.15
  },
  {
    id: 'mat-cast-iron-gray',
    materialAr: 'حديد زهر رمادي (Gray Cast Iron - Pearlite)',
    materialEn: 'Gray Cast Iron (Pearlitic)',
    category: 'ferrous',
    categoryAr: 'معادن حديدية',
    categoryEn: 'Ferrous Alloys',
    density: 7.20,
    longitudinalVelocity: 4600,
    shearVelocity: 2600,
    rayleighVelocity: 2400,
    acousticImpedance: 33.1,
    longitudinalWavelengthAt5MHz: 0.92
  },
  {
    id: 'mat-al-7075',
    materialAr: 'ألومنيوم طيران عالي المتانة (Aluminum 7075-T6)',
    materialEn: 'Aircraft Aluminum (7075-T6)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 2.81,
    longitudinalVelocity: 6350,
    shearVelocity: 3100,
    rayleighVelocity: 2860,
    acousticImpedance: 17.8,
    longitudinalWavelengthAt5MHz: 1.27
  },
  {
    id: 'mat-al-6061',
    materialAr: 'ألومنيوم إنشائي (Aluminum 6061-T6)',
    materialEn: 'Structural Aluminum (6061-T6)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 2.70,
    longitudinalVelocity: 6320,
    shearVelocity: 3080,
    rayleighVelocity: 2840,
    acousticImpedance: 17.1,
    longitudinalWavelengthAt5MHz: 1.26
  },
  {
    id: 'mat-ti-6al4v',
    materialAr: 'تيتانيوم فضائي (Titanium Ti-6Al-4V)',
    materialEn: 'Aerospace Titanium (Ti-6Al-4V)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 4.43,
    longitudinalVelocity: 6100,
    shearVelocity: 3120,
    rayleighVelocity: 2880,
    acousticImpedance: 27.0,
    longitudinalWavelengthAt5MHz: 1.22
  },
  {
    id: 'mat-copper-pure',
    materialAr: 'نحاس أحمر نقي كهربائي (Pure Copper - OFHC)',
    materialEn: 'Pure Electrolytic Copper (OFHC)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 8.94,
    longitudinalVelocity: 4660,
    shearVelocity: 2330,
    rayleighVelocity: 2150,
    acousticImpedance: 41.7,
    longitudinalWavelengthAt5MHz: 0.93
  },
  {
    id: 'mat-brass-yellow',
    materialAr: 'نحاس أصفر (Naval Brass 70/30)',
    materialEn: 'Yellow Brass (70 Cu / 30 Zn)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 8.43,
    longitudinalVelocity: 4430,
    shearVelocity: 2120,
    rayleighVelocity: 1960,
    acousticImpedance: 37.3,
    longitudinalWavelengthAt5MHz: 0.89
  },
  {
    id: 'mat-inconel-625',
    materialAr: 'سبيكة إنكونيل فائقة (Inconel 625)',
    materialEn: 'Nickel Superalloy (Inconel 625)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 8.44,
    longitudinalVelocity: 5720,
    shearVelocity: 3020,
    rayleighVelocity: 2780,
    acousticImpedance: 48.3,
    longitudinalWavelengthAt5MHz: 1.14
  },
  {
    id: 'mat-lead',
    materialAr: 'رصاص نقي للحماية الإشعاعية (Pure Lead)',
    materialEn: 'Pure Lead (Chemical Grade)',
    category: 'non_ferrous',
    categoryAr: 'معادن غير حديدية',
    categoryEn: 'Non-Ferrous Alloys',
    density: 11.34,
    longitudinalVelocity: 2160,
    shearVelocity: 700,
    rayleighVelocity: 640,
    acousticImpedance: 24.5,
    longitudinalWavelengthAt5MHz: 0.43
  },
  {
    id: 'mat-lucite-wedge',
    materialAr: 'بلاستيك الإسفين الصوتي (Perspex / Lucite Wedge)',
    materialEn: 'Acrylic / Lucite (Wedge Material)',
    category: 'polymer_liquid',
    categoryAr: 'بوليمرات وسوائل',
    categoryEn: 'Polymers & Couplants',
    density: 1.18,
    longitudinalVelocity: 2730,
    shearVelocity: 1430,
    rayleighVelocity: 1320,
    acousticImpedance: 3.22,
    longitudinalWavelengthAt5MHz: 0.55
  },
  {
    id: 'mat-water-couplant',
    materialAr: 'ماء نقي للغمر والمقارنة (Water at 20°C)',
    materialEn: 'Distilled Water (Couplant at 20°C)',
    category: 'polymer_liquid',
    categoryAr: 'بوليمرات وسوائل',
    categoryEn: 'Polymers & Couplants',
    density: 1.00,
    longitudinalVelocity: 1480,
    shearVelocity: 0,
    rayleighVelocity: 0,
    acousticImpedance: 1.48,
    longitudinalWavelengthAt5MHz: 0.30
  },
  {
    id: 'mat-glycerin-couplant',
    materialAr: 'جلسرين فحص عالي اللزوجة (Glycerin Couplant)',
    materialEn: 'Industrial Glycerin Couplant',
    category: 'polymer_liquid',
    categoryAr: 'بوليمرات وسوائل',
    categoryEn: 'Polymers & Couplants',
    density: 1.26,
    longitudinalVelocity: 1920,
    shearVelocity: 0,
    rayleighVelocity: 0,
    acousticImpedance: 2.42,
    longitudinalWavelengthAt5MHz: 0.38
  },
  {
    id: 'mat-air',
    materialAr: 'الهواء الجوي (Dry Air at STP)',
    materialEn: 'Dry Air at STP',
    category: 'polymer_liquid',
    categoryAr: 'بوليمرات وسوائل',
    categoryEn: 'Polymers & Couplants',
    density: 0.0012,
    longitudinalVelocity: 343,
    shearVelocity: 0,
    rayleighVelocity: 0,
    acousticImpedance: 0.0004,
    longitudinalWavelengthAt5MHz: 0.07
  },
  {
    id: 'mat-pzt-crystal',
    materialAr: 'سيراميك كهروبيزوي للمجسات (PZT-5A Crystal)',
    materialEn: 'Piezoelectric Ceramic (PZT-5A)',
    category: 'special_crystal',
    categoryAr: 'بلورات كهرضغطية',
    categoryEn: 'Piezo Crystals',
    density: 7.75,
    longitudinalVelocity: 4350,
    shearVelocity: 2280,
    rayleighVelocity: 2100,
    acousticImpedance: 33.7,
    longitudinalWavelengthAt5MHz: 0.87
  }
];

export const ELECTRICAL_CONDUCTIVITY_TABLE: ElectricalConductivityEntry[] = [
  {
    id: 'ec-silver',
    alloyAr: 'فضة نقية (Pure Silver)',
    alloyEn: 'Pure Silver (99.99%)',
    conductivityIacsPct: 105.0,
    conductivityMsm: 61.4,
    resistivityMicroOhmCm: 1.63,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 0.20,
    typicalApplicationAr: 'معيار مرجعي أقصى في الفيزياء والمعايرة الكهربائية',
    typicalApplicationEn: 'Ultimate electrical reference standard and precision calibration'
  },
  {
    id: 'ec-copper-ofhc',
    alloyAr: 'نحاس إلكتروليتي معتمد (Copper IACS Standard)',
    alloyEn: 'Electrolytic Tough Pitch Copper (ETP)',
    conductivityIacsPct: 100.0,
    conductivityMsm: 58.0,
    resistivityMicroOhmCm: 1.72,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 0.21,
    typicalApplicationAr: 'المعيار الدولي IACS لحساب التوصيلية والمقابس',
    typicalApplicationEn: 'International Annealed Copper Standard (IACS 100%)'
  },
  {
    id: 'ec-al-1100',
    alloyAr: 'ألومنيوم تجاري نقي (Aluminum 1100-O)',
    alloyEn: 'Commercial Pure Aluminum (1100-O)',
    conductivityIacsPct: 59.0,
    conductivityMsm: 34.2,
    resistivityMicroOhmCm: 2.92,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 0.27,
    typicalApplicationAr: 'رقائق وأوعية كيميائية ومبدلات حرارية',
    typicalApplicationEn: 'Foil, chemical vessels and thermal heat exchangers'
  },
  {
    id: 'ec-al-2024-t3',
    alloyAr: 'ألومنيوم نحاسي فضائي (Aluminum 2024-T3)',
    alloyEn: 'Duralumin Aircraft Alloy (2024-T3)',
    conductivityIacsPct: 30.0,
    conductivityMsm: 17.4,
    resistivityMicroOhmCm: 5.75,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 0.38,
    typicalApplicationAr: 'أجنحة وهياكل الطائرات وفحص الشروخ والتلف الحراري',
    typicalApplicationEn: 'Aircraft fuselage/wing skins; conductivity testing for heat damage'
  },
  {
    id: 'ec-al-7075-t6',
    alloyAr: 'ألومنيوم زنكي فائق (Aluminum 7075-T6)',
    alloyEn: 'High-Strength Zinc Aluminum (7075-T6)',
    conductivityIacsPct: 33.0,
    conductivityMsm: 19.1,
    resistivityMicroOhmCm: 5.23,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 0.36,
    typicalApplicationAr: 'هياكل الطائرات المقاتلة ومعالجة T73 لمقاومة التآكل الإجهادي',
    typicalApplicationEn: 'Fighter airframes, T73 temper verification for SCC prevention'
  },
  {
    id: 'ec-brass-7030',
    alloyAr: 'نحاس أصفر خرطوشي (Cartridge Brass 70/30)',
    alloyEn: 'Cartridge Brass (70 Cu / 30 Zn)',
    conductivityIacsPct: 28.0,
    conductivityMsm: 16.2,
    resistivityMicroOhmCm: 6.17,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 0.40,
    typicalApplicationAr: 'أنابيب المكثفات والمبدلات الحرارية في محطات التوليد',
    typicalApplicationEn: 'Condenser tubes and power generation heat exchangers'
  },
  {
    id: 'ec-titanium-ti6al4v',
    alloyAr: 'سبيكة تيتانيوم فضائية (Titanium Ti-6Al-4V)',
    alloyEn: 'Aerospace Grade 5 Titanium (Ti-6Al-4V)',
    conductivityIacsPct: 1.0,
    conductivityMsm: 0.58,
    resistivityMicroOhmCm: 172.0,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 2.09,
    typicalApplicationAr: 'ريش التوربينات وأقراص الضواغط في المحركات النفاثة',
    typicalApplicationEn: 'Jet engine turbine blades, compressor disks, and medical implants'
  },
  {
    id: 'ec-inconel-718',
    alloyAr: 'سبيكة نيكل فائقة (Inconel 718 Age-Hardened)',
    alloyEn: 'Nickel-Chromium Superalloy (Inconel 718)',
    conductivityIacsPct: 1.4,
    conductivityMsm: 0.81,
    resistivityMicroOhmCm: 123.0,
    relativePermeability: 1.0,
    standardPenetrationDepthAt100kHz: 1.77,
    typicalApplicationAr: 'محركات الصواريخ والتوربينات الغازية فائقة الحرارة',
    typicalApplicationEn: 'Rocket motors, hot-section gas turbine rotor assemblies'
  },
  {
    id: 'ec-steel-1018',
    alloyAr: 'فولاذ كربوني مغناطيسي (Mild Carbon Steel 1018)',
    alloyEn: 'Mild Carbon Steel (Ferromagnetic 1018)',
    conductivityIacsPct: 10.0,
    conductivityMsm: 5.8,
    resistivityMicroOhmCm: 17.2,
    relativePermeability: 120.0,
    standardPenetrationDepthAt100kHz: 0.06,
    typicalApplicationAr: 'هياكل الضغط والأنابيب الإنشائية (تتطلب تشبع مغناطيسي للـ ET)',
    typicalApplicationEn: 'Structural pipes, requires magnetic saturation for remote field ET'
  },
  {
    id: 'ec-ss-304',
    alloyAr: 'فولاذ مقاوم للصدأ غير مغناطيسي (Stainless Steel 304)',
    alloyEn: 'Austenitic Stainless Steel (304 Annealed)',
    conductivityIacsPct: 2.5,
    conductivityMsm: 1.45,
    resistivityMicroOhmCm: 72.0,
    relativePermeability: 1.02,
    standardPenetrationDepthAt100kHz: 1.34,
    typicalApplicationAr: 'مفاعلات كيميائية ومبدلات ألبان ومحطات نووية',
    typicalApplicationEn: 'Chemical vessels, food process equipment, nuclear steam lines'
  }
];

export const RADIOISOTOPE_PROPERTIES_TABLE: RadioisotopeEntry[] = [
  {
    id: 'iso-ir-192',
    isotopeAr: 'إيريديوم-192 (Iridium-192)',
    isotopeEn: 'Iridium-192 (Ir-192)',
    symbol: '¹⁹²Ir',
    halfLifeAr: '73.83 يوم',
    halfLifeEn: '73.83 days',
    halfLifeDays: 73.83,
    principalEnergiesMev: '0.31, 0.47, 0.60 MeV (Avg 0.38 MeV)',
    gammaConstantRhmPerCi: 0.48,
    hvlLeadMm: 4.8,
    hvlSteelMm: 12.7,
    hvlConcreteMm: 43.2,
    practicalThicknessRangeMm: '10 mm إلى 75 mm فولاذ',
    primaryApplicationAr: 'المعيار الذهبي لفحص خطوط الأنابيب وأوعية الضغط موقعياً',
    primaryApplicationEn: 'Gold standard for field pipeline welds and pressure vessel radiography'
  },
  {
    id: 'iso-co-60',
    isotopeAr: 'كوبالت-60 (Cobalt-60)',
    isotopeEn: 'Cobalt-60 (Co-60)',
    symbol: '⁶⁰Co',
    halfLifeAr: '5.27 سنة (1925 يوم)',
    halfLifeEn: '5.27 years (1925 days)',
    halfLifeDays: 1925,
    principalEnergiesMev: '1.17 MeV & 1.33 MeV (Avg 1.25 MeV)',
    gammaConstantRhmPerCi: 1.32,
    hvlLeadMm: 12.5,
    hvlSteelMm: 21.6,
    hvlConcreteMm: 68.6,
    practicalThicknessRangeMm: '50 mm إلى 200 mm فولاذ سميك',
    primaryApplicationAr: 'المسبوكات الضخمة والصمامات النووية والهياكل البحرية شديدة السمك',
    primaryApplicationEn: 'Heavy cast valve bodies, nuclear steam generator heads, ultra-thick forgings'
  },
  {
    id: 'iso-se-75',
    isotopeAr: 'سيلينيوم-75 (Selenium-75)',
    isotopeEn: 'Selenium-75 (Se-75)',
    symbol: '⁷⁵Se',
    halfLifeAr: '119.8 يوم',
    halfLifeEn: '119.8 days',
    halfLifeDays: 119.8,
    principalEnergiesMev: '0.12, 0.14, 0.26, 0.40 MeV (Avg 0.22 MeV)',
    gammaConstantRhmPerCi: 0.20,
    hvlLeadMm: 2.0,
    hvlSteelMm: 8.0,
    hvlConcreteMm: 28.0,
    practicalThicknessRangeMm: '4 mm إلى 30 mm فولاذ',
    primaryApplicationAr: 'أنابيب الغلايات ومبادلات الحرارة الصغيرة بجودة تضاهي X-Ray',
    primaryApplicationEn: 'Thin-wall boiler tubes and heat exchangers with high contrast'
  },
  {
    id: 'iso-cs-137',
    isotopeAr: 'سيزيوم-137 (Cesium-137)',
    isotopeEn: 'Cesium-137 (Cs-137)',
    symbol: '¹³⁷Cs',
    halfLifeAr: '30.17 سنة',
    halfLifeEn: '30.17 years',
    halfLifeDays: 11020,
    principalEnergiesMev: '0.662 MeV',
    gammaConstantRhmPerCi: 0.33,
    hvlLeadMm: 6.5,
    hvlSteelMm: 16.0,
    hvlConcreteMm: 53.0,
    practicalThicknessRangeMm: '25 mm إلى 90 mm فولاذ',
    primaryApplicationAr: 'معايرة الأجهزة الإشعاعية وقياس الكثافة والمستويات المستمرة',
    primaryApplicationEn: 'Instrument calibration, continuous industrial level/density gauges'
  }
];

export const WELD_ACCEPTANCE_CRITERIA_MATRIX: WeldAcceptanceRule[] = [
  {
    flawTypeAr: 'الشروخ والتشققات (Cracks of any type)',
    flawTypeEn: 'Cracks of any type (Longitudinal, Transverse, Crater)',
    asmeSecViiiUw51: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeSecViiiUw52: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeB313Normal: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeB313Severe: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    awsD11Static: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false }
  },
  {
    flawTypeAr: 'نقص الانصهار (Lack of Fusion - LOF)',
    flawTypeEn: 'Lack of Fusion (Side-wall, Interpass, Root)',
    asmeSecViiiUw51: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeSecViiiUw52: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeB313Normal: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeB313Severe: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    awsD11Static: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false }
  },
  {
    flawTypeAr: 'نقص الاختراق في الجذر (Incomplete Root Penetration)',
    flawTypeEn: 'Incomplete Joint Penetration (IP)',
    asmeSecViiiUw51: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    asmeSecViiiUw52: { ar: 'مسموح بطول تراكمي ≤ 19 mm لكل 150 mm لحام', en: 'Max cumulative ≤ 19 mm per 150 mm weld', isAcceptable: true },
    asmeB313Normal: { ar: 'مسموح بعمق ≤ 1 mm أو 0.2t، وطول ≤ 38 mm لكل 150 mm', en: 'Depth ≤ 1 mm or 0.2t, length ≤ 38 mm/150 mm', isAcceptable: true },
    asmeB313Severe: { ar: 'مرفوض قطعاً (0 mm)', en: 'Strictly Unacceptable (0 mm)', isAcceptable: false },
    awsD11Static: { ar: 'مرفوض في وصلات الاختراق الكامل CJP', en: 'Prohibited in CJP groove welds', isAcceptable: false }
  },
  {
    flawTypeAr: 'شمولات الخبث الخيطية (Elongated Slag Inclusions)',
    flawTypeEn: 'Elongated Slag Inclusions',
    asmeSecViiiUw51: { ar: 'مسموح بطول فردي ≤ 6 mm (للسمك ≤ 19 mm)', en: 'Max length ≤ 6 mm (for t ≤ 19 mm)', isAcceptable: true },
    asmeSecViiiUw52: { ar: 'مسموح بطول فردي ≤ 2t/3 (أقصى حد 19 mm)', en: 'Max length ≤ 2t/3 (max 19 mm)', isAcceptable: true },
    asmeB313Normal: { ar: 'مسموح بطول تراكمي ≤ t لكل 12t من اللحام', en: 'Cumulative length ≤ t per 12t length', isAcceptable: true },
    asmeB313Severe: { ar: 'مسموح بطول فردي ≤ t/3 (أقصى حد 2.5 mm)', en: 'Individual length ≤ t/3 (max 2.5 mm)', isAcceptable: true },
    awsD11Static: { ar: 'مسموح وفق مخطط الحجم والمسافات البينية (Table 6.1)', en: 'Per flaw sizing and spacing charts (Table 6.1)', isAcceptable: true }
  },
  {
    flawTypeAr: 'الحفر السفلي (Undercut)',
    flawTypeEn: 'Undercut at weld toe',
    asmeSecViiiUw51: { ar: 'العمق ≤ 1 mm أو 10% من السُمك أيهما أقل', en: 'Depth ≤ 1 mm or 10% of t (whichever less)', isAcceptable: true },
    asmeSecViiiUw52: { ar: 'العمق ≤ 1 mm أو 10% من السُمك', en: 'Depth ≤ 1 mm or 10% of t', isAcceptable: true },
    asmeB313Normal: { ar: 'العمق ≤ 1 mm وطول ≤ 38 mm لكل 150 mm', en: 'Depth ≤ 1 mm and length ≤ 38 mm/150 mm', isAcceptable: true },
    asmeB313Severe: { ar: 'العمق ≤ 0.5 mm أو 0.1t (أيهما أقل)', en: 'Depth ≤ 0.5 mm or 0.1t (whichever less)', isAcceptable: true },
    awsD11Static: { ar: 'العمق ≤ 1 mm لمعظم الأسماك، و≤ 2 mm بطول ≤ 50 mm', en: 'Depth ≤ 1 mm general, ≤ 2 mm for 50 mm max', isAcceptable: true }
  }
];

export const PENETRANT_CLASSIFICATION_MATRIX: PenetrantClassificationEntry[] = [
  {
    typeCode: 'Type I',
    typeAr: 'النوع الأول: صبغات فلوروسنتية مشعة (Fluorescent)',
    typeEn: 'Type I: Fluorescent Dye Penetrant',
    methodCode: 'Method A',
    methodAr: 'طريقة أ: قابل للغسيل بالماء مباشرة (Water Washable)',
    methodEn: 'Method A: Water Washable',
    sensitivityLevel: 'Level 1/2 إلى Level 4',
    developerForm: 'Form a, b, c, d, e',
    advantagesAr: 'اقتصادي، فحص سريع للأسطح الخشنة والسنون الحلزونية',
    advantagesEn: 'Economical, fast processing on rough parts & threads',
    limitationsAr: 'عرضة للغسيل المفرط (Over-washing) مما قد يزيل مؤشرات الشروخ الضحلة',
    limitationsEn: 'Prone to over-washing, may rinse penetrant out of shallow defects'
  },
  {
    typeCode: 'Type I',
    typeAr: 'النوع الأول: صبغات فلوروسنتية مشعة (Fluorescent)',
    typeEn: 'Type I: Fluorescent Dye Penetrant',
    methodCode: 'Method B',
    methodAr: 'طريقة ب: مستحلب لاحق زيتي (Post-Emulsified Lipophilic)',
    methodEn: 'Method B: Post-Emulsified Lipophilic',
    sensitivityLevel: 'Level 3 إلى Level 4 (Ultra-High)',
    developerForm: 'Form a (Dry powder) أو Form d (Nonaqueous)',
    advantagesAr: 'أعلى حساسية ممكنة، مقاوم تماماً للغسيل المفرط، مثالي لشروخ التعب الدقيقة',
    advantagesEn: 'Highest sensitivity, impervious to over-washing, detects micro-fatigue cracks',
    limitationsAr: 'خطوة إضافية للمستحلب، حساس جداً لوقت التلامس (Emulsification Time)',
    limitationsEn: 'Extra processing step; critical timing window for emulsifier'
  },
  {
    typeCode: 'Type I',
    typeAr: 'النوع الأول: صبغات فلوروسنتية مشعة (Fluorescent)',
    typeEn: 'Type I: Fluorescent Dye Penetrant',
    methodCode: 'Method D',
    methodAr: 'طريقة د: مستحلب لاحق مائي (Post-Emulsified Hydrophilic)',
    methodEn: 'Method D: Post-Emulsified Hydrophilic',
    sensitivityLevel: 'Level 3 & Level 4',
    developerForm: 'Form a, c, d',
    advantagesAr: 'التحكم الفائق في عملية الشطف، المعيار الإلزامي في صناعات الطيران والتوربينات',
    advantagesEn: 'Superior rinse control, mandated standard in aerospace turbine inspections',
    limitationsAr: 'يتطلب خزانات غسيل مسبق ومراقبة تركيز المستحلب بمقياس الانكسار',
    limitationsEn: 'Requires pre-rinse tanks and refractometer concentration monitoring'
  },
  {
    typeCode: 'Type II',
    typeAr: 'النوع الثاني: صبغات مرئية ملونة بالضوء الأبيض (Visible Dye)',
    typeEn: 'Type II: Visible Color Contrast Penetrant',
    methodCode: 'Method C',
    methodAr: 'طريقة ج: قابل للإزالة بالمذيب العضوي (Solvent Removable)',
    methodEn: 'Method C: Solvent Removable',
    sensitivityLevel: 'Level 2 (Standard Sensitivity)',
    developerForm: 'Form d (Nonaqueous aerosol)',
    advantagesAr: 'محمول 100% في عبوات رذاذ (Aerosol)، لا يحتاج ظلام أو مصباح UV، مثالي للموقع',
    advantagesEn: 'Fully portable spray cans, no darkroom or UV light needed, ideal for field',
    limitationsAr: 'حساسية أقل من الفلوروسنت، يتطلب تنظيف يدوي شاق بالمذيب، نفايات كيميائية',
    limitationsEn: 'Lower sensitivity than fluorescent, labor-intensive wiping, solvent waste'
  }
];
