import type { NdtReportMethod } from './types';

export interface TemplateFieldDefinition {
  key: string;
  labelAr: string;
  labelEn: string;
  type: 'text' | 'number' | 'select';
  unit?: string;
  placeholderAr?: string;
  placeholderEn?: string;
  options?: string[];
  defaultValue?: string;
}

export interface ReportTemplateDefinition {
  templateKey: string;
  method: NdtReportMethod;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  defaultCodeStandard: string;
  fields: TemplateFieldDefinition[];
}

/**
 * Modular NDT / PWHT Report Template Registry.
 * Designed so custom client report designs can be registered as first-class
 * templates without changing database schemas or storage rules.
 */
export const REPORT_TEMPLATES: readonly ReportTemplateDefinition[] = [
  {
    templateKey: 'rt_weld_v1',
    method: 'RT',
    titleAr: 'تقرير الفحص الإشعاعي للوصلات (RT)',
    titleEn: 'Radiographic Weld Examination Report (RT)',
    subtitleAr: 'مصدر جاما أو X-Ray · كثافة الفيلم · مؤشر جودة الصورة IQI',
    subtitleEn: 'Gamma / X-Ray source · film density · IQI sensitivity & exposure geometry',
    defaultCodeStandard: 'ASME Sec V Art. 2 / Sec VIII Div.1',
    fields: [
      {
        key: 'radiationSource',
        labelAr: 'المصدر الإشعاعي',
        labelEn: 'Radiation Source',
        type: 'select',
        options: ['Ir-192', 'Se-75', 'Co-60', 'X-Ray 300kV'],
        defaultValue: 'Ir-192',
      },
      {
        key: 'sourceActivityCi',
        labelAr: 'نشاط المصدر',
        labelEn: 'Source Activity',
        type: 'text',
        unit: 'Ci',
        placeholderAr: 'مثال: 42.5',
        placeholderEn: 'e.g. 42.5',
      },
      {
        key: 'sfdMm',
        labelAr: 'المسافة البؤرية SFD',
        labelEn: 'SFD Distance',
        type: 'text',
        unit: 'mm',
        placeholderAr: 'مثال: 600',
        placeholderEn: 'e.g. 600',
      },
      {
        key: 'technique',
        labelAr: 'أسلوب التصوير',
        labelEn: 'Exposure Technique',
        type: 'select',
        options: ['SWSI', 'DWSI', 'DWDI (Elliptical)', 'DWDI (Superimposed)'],
        defaultValue: 'DWSI',
      },
      {
        key: 'filmClass',
        labelAr: 'نوع وفئة الفيلم',
        labelEn: 'Film Brand / Class',
        type: 'text',
        placeholderAr: 'AGFA D7 / Kodak AA400',
        placeholderEn: 'AGFA D7 / Kodak AA400',
      },
      {
        key: 'iqiType',
        labelAr: 'مؤشر جودة الصورة IQI',
        labelEn: 'IQI / Wire Designation',
        type: 'text',
        placeholderAr: 'ASTM 1B / EN ISO Wire 10-16',
        placeholderEn: 'ASTM 1B / EN ISO Wire 10-16',
      },
      {
        key: 'filmDensity',
        labelAr: 'الكثافة المقاسة',
        labelEn: 'Measured Density',
        type: 'text',
        placeholderAr: '2.1 - 3.4',
        placeholderEn: '2.1 - 3.4',
      },
      {
        key: 'discontinuityNotes',
        labelAr: 'وصف المؤشرات / العيوب',
        labelEn: 'Discontinuity Findings',
        type: 'text',
        placeholderAr: 'No rejectable indications',
        placeholderEn: 'No rejectable indications',
      },
    ],
  },
  {
    templateKey: 'ut_weld_v1',
    method: 'UT',
    titleAr: 'تقرير الفحص بالموجات فوق الصوتية (UT)',
    titleEn: 'Ultrasonic Weld Testing Report (UT)',
    subtitleAr: 'معايرة V1/V2 · منحنى DAC · زوايا المسح والانعكاس',
    subtitleEn: 'IIW V1/V2 calibration · DAC reference · angle beam evaluation',
    defaultCodeStandard: 'ASME Sec V Art. 4 / AWS D1.1',
    fields: [
      {
        key: 'instrumentModel',
        labelAr: 'موديل جهاز الفحص',
        labelEn: 'UT Flaw Detector',
        type: 'text',
        defaultValue: 'Krautkrämer USM 35X',
      },
      {
        key: 'probeFrequencyMhz',
        labelAr: 'تردد المجس',
        labelEn: 'Probe Frequency',
        type: 'text',
        unit: 'MHz',
        defaultValue: '4.0',
      },
      {
        key: 'probeAngles',
        labelAr: 'زوايا المسح',
        labelEn: 'Beam Angles',
        type: 'text',
        unit: 'deg',
        defaultValue: '0°, 45°, 60°, 70°',
      },
      {
        key: 'calibrationBlock',
        labelAr: 'كتلة المعايرة',
        labelEn: 'Calibration Block',
        type: 'text',
        defaultValue: 'IIW V1 & ASME Basic Block',
      },
      {
        key: 'refGainDb',
        labelAr: 'الكسب المرجعي DAC',
        labelEn: 'Reference Gain',
        type: 'text',
        unit: 'dB',
        placeholderAr: 'مثال: 46.5 dB',
        placeholderEn: 'e.g. 46.5 dB',
      },
      {
        key: 'scanningGainDb',
        labelAr: 'كسب المسح (+dB)',
        labelEn: 'Scanning Gain Offset',
        type: 'text',
        unit: 'dB',
        defaultValue: '+6 dB',
      },
      {
        key: 'couplant',
        labelAr: 'مادة التوصيل',
        labelEn: 'Couplant',
        type: 'text',
        defaultValue: 'Ultragel II Cellulose',
      },
      {
        key: 'maxAmplitudePct',
        labelAr: 'أعلى سعة إشارة (% DAC)',
        labelEn: 'Peak Indication (% DAC)',
        type: 'text',
        placeholderAr: '< 20% DAC',
        placeholderEn: '< 20% DAC',
      },
    ],
  },
  {
    templateKey: 'paut_scan_v1',
    method: 'PAUT',
    titleAr: 'تقرير المسح بالمصفوفات الطورية (PAUT)',
    titleEn: 'Phased Array Ultrasonic Report (PAUT)',
    subtitleAr: 'قوانين التركيز Focal Laws · S-Scan / C-Scan · ملف الإزاحة',
    subtitleEn: 'Focal laws · sectorial S-Scan · encoded scan coverage',
    defaultCodeStandard: 'ASME Sec V Art. 4 Mandatory App. IV',
    fields: [
      {
        key: 'instrumentModel',
        labelAr: 'جهاز PAUT',
        labelEn: 'PAUT Unit',
        type: 'text',
        defaultValue: 'Olympus OmniScan X3',
      },
      {
        key: 'arrayProbeSpec',
        labelAr: 'مواصفات مصفوفة المجس',
        labelEn: 'Phased Array Probe',
        type: 'text',
        defaultValue: '5L64-A12 (64 Elements)',
      },
      {
        key: 'wedgeModel',
        labelAr: 'الوتد (Wedge)',
        labelEn: 'Wedge Model',
        type: 'text',
        defaultValue: 'SA12-N55S',
      },
      {
        key: 'focalLawRange',
        labelAr: 'نطاق الزوايا',
        labelEn: 'Sectorial Sweep',
        type: 'text',
        defaultValue: '40° – 70° (1° step)',
      },
      {
        key: 'encoderResolution',
        labelAr: 'دقة الإنكودر',
        labelEn: 'Encoder Resolution',
        type: 'text',
        defaultValue: '12 steps/mm',
      },
      {
        key: 'scanFileId',
        labelAr: 'معرّف ملف المسح الرقمي',
        labelEn: 'Encoded Scan File Ref',
        type: 'text',
        placeholderAr: 'OPD-2026-WELD-014.opd',
        placeholderEn: 'OPD-2026-WELD-014.opd',
      },
    ],
  },
  {
    templateKey: 'mt_pt_surface_v1',
    method: 'MT',
    titleAr: 'تقرير الفحص السطحي (MT / PT / VT)',
    titleEn: 'Surface Examination Report (MT / PT / VT)',
    subtitleAr: 'فحص الشروخ السطحية بالجسيمات المغناطيسية أو السوائل المتغلغلة',
    subtitleEn: 'Magnetic particle yoke, liquid penetrant dwell & lighting verification',
    defaultCodeStandard: 'ASME Sec V Art. 6 & 7',
    fields: [
      {
        key: 'surfaceMethod',
        labelAr: 'الطريقة الفرعية',
        labelEn: 'Technique Mode',
        type: 'select',
        options: ['Wet Fluorescent MT', 'Dry Visible MT', 'Solvent Removable PT', 'Direct VT'],
        defaultValue: 'Wet Fluorescent MT',
      },
      {
        key: 'yokeOrConsumables',
        labelAr: 'المعدة / المواد المستخدمة',
        labelEn: 'Equipment / Consumables',
        type: 'text',
        placeholderAr: 'AC/DC Electromagnetic Yoke / Magnaflux 14AM',
        placeholderEn: 'AC/DC Electromagnetic Yoke / Magnaflux 14AM',
      },
      {
        key: 'lightIntensityLux',
        labelAr: 'شدة الإضاءة / UV',
        labelEn: 'Light / UV Intensity',
        type: 'text',
        placeholderAr: '> 1076 Lux (Visible) / > 1000 µW/cm²',
        placeholderEn: '> 1076 Lux (Visible) / > 1000 µW/cm²',
      },
      {
        key: 'surfaceTempC',
        labelAr: 'حرارة السطح',
        labelEn: 'Surface Temperature',
        type: 'text',
        unit: '°C',
        defaultValue: '28',
      },
      {
        key: 'dwellOrLiftCheck',
        labelAr: 'زمن المكوث / اختبار الرفع',
        labelEn: 'Dwell Time / Yoke Lift',
        type: 'text',
        defaultValue: '10 lb AC lift verified',
      },
    ],
  },
  {
    templateKey: 'pwht_chart_v1',
    method: 'PWHT',
    titleAr: 'تقرير المعالجة الحرارية بعد اللحام (PWHT)',
    titleEn: 'Post-Weld Heat Treatment Cycle Report (PWHT)',
    subtitleAr: 'وحدة 65kW · معدلات التسخين والتبريد · درجة وزمن المكوث',
    subtitleEn: '65kW heat unit · heating/cooling ramps · soak temperature & thermocouple channels',
    defaultCodeStandard: 'ASME B31.1 / B31.3 / Sec VIII',
    fields: [
      {
        key: 'pwhtUnitSerial',
        labelAr: 'رقم وحدة المعالجة (65kW)',
        labelEn: 'PWHT Unit Serial',
        type: 'text',
        placeholderAr: 'INSCO-PWHT-09',
        placeholderEn: 'INSCO-PWHT-09',
      },
      {
        key: 'pNumber',
        labelAr: 'تصنيف المادة P-No',
        labelEn: 'Material P-Number',
        type: 'select',
        options: ['P-No. 1 (Carbon Steel)', 'P-No. 4 (1.25Cr-0.5Mo)', 'P-No. 5A (2.25Cr-1Mo)', 'P-No. 15E (P91)'],
        defaultValue: 'P-No. 1 (Carbon Steel)',
      },
      {
        key: 'soakTempC',
        labelAr: 'درجة حرارة المكوث',
        labelEn: 'Soak Temperature',
        type: 'text',
        unit: '°C',
        defaultValue: '620 ± 15',
      },
      {
        key: 'soakDurationMin',
        labelAr: 'مدة المكوث',
        labelEn: 'Soak Hold Time',
        type: 'text',
        unit: 'min',
        defaultValue: '60',
      },
      {
        key: 'heatingRateCPerHr',
        labelAr: 'معدل التسخين',
        labelEn: 'Heating Rate',
        type: 'text',
        unit: '°C/hr',
        defaultValue: '180',
      },
      {
        key: 'coolingRateCPerHr',
        labelAr: 'معدل التبريد',
        labelEn: 'Cooling Rate',
        type: 'text',
        unit: '°C/hr',
        defaultValue: '160',
      },
      {
        key: 'thermocoupleCount',
        labelAr: 'عدد المزدوجات الحرارية',
        labelEn: 'Thermocouple Channels',
        type: 'text',
        defaultValue: '6 Channels (Type K)',
      },
      {
        key: 'postHardnessHb',
        labelAr: 'الصلادة بعد المعالجة',
        labelEn: 'Post-PWHT Hardness',
        type: 'text',
        unit: 'HB',
        placeholderAr: '198 HB max',
        placeholderEn: '198 HB max',
      },
    ],
  },
  {
    templateKey: 'custom_template_v1',
    method: 'CUSTOM',
    titleAr: 'قالب تقرير هندسي مخصص (مرن)',
    titleEn: 'Extensible Custom Inspection Report',
    subtitleAr: 'قالب مفتوح لاستقبال أي تصميم تقرير خاص بالشركة مع صفوف قياس مخصصة',
    subtitleEn: 'Flexible report layout with custom measurement rows ready for bespoke designs',
    defaultCodeStandard: 'Project Specification / ISO 9712',
    fields: [
      {
        key: 'procedureRef',
        labelAr: 'مرجع إجراء الفحص',
        labelEn: 'Inspection Procedure Ref',
        type: 'text',
        placeholderAr: 'INS-PRO-NDT-001 Rev.2',
        placeholderEn: 'INS-PRO-NDT-001 Rev.2',
      },
      {
        key: 'equipmentSerial',
        labelAr: 'رقم الجهاز والمعايرة',
        labelEn: 'Equipment & Calibration ID',
        type: 'text',
        placeholderAr: 'CAL-2026-088',
        placeholderEn: 'CAL-2026-088',
      },
      {
        key: 'testCondition',
        labelAr: 'ظروف الاختبار',
        labelEn: 'Test Conditions',
        type: 'text',
        placeholderAr: 'Ambient 27°C · Surface SA 2.5',
        placeholderEn: 'Ambient 27°C · Surface SA 2.5',
      },
    ],
  },
];

export function getReportTemplate(templateKeyOrMethod?: string): ReportTemplateDefinition {
  const byKey = REPORT_TEMPLATES.find(t => t.templateKey === templateKeyOrMethod);
  if (byKey) return byKey;
  const byMethod = REPORT_TEMPLATES.find(t => t.method === templateKeyOrMethod);
  if (byMethod) return byMethod;
  if (templateKeyOrMethod === 'PT' || templateKeyOrMethod === 'VT') {
    return REPORT_TEMPLATES.find(t => t.templateKey === 'mt_pt_surface_v1')!;
  }
  return REPORT_TEMPLATES[REPORT_TEMPLATES.length - 1];
}
