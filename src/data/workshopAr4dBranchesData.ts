import type { SimulationNdtMethod } from '../utils/simulationHistoryStore';

export type WorkshopAr4dBranchId =
  | 'ut_paut'
  | 'rt_gamma_xray'
  | 'vt_pt_mt_surface'
  | 'et_mfl_tubing'
  | 'pwht_metallurgy'
  | 'welding_hydro'
  | 'api_coating_corrosion'
  | 'asset_integrity_irata';

export interface Workshop4dPhaseMilestone {
  progressPct: number;
  labelAr: string;
  labelEn: string;
}

export interface WorkshopAr4dBranchSpec {
  id: WorkshopAr4dBranchId;
  orderLabel: string;
  shortCode: string;
  accentHex: string;
  badgeClass: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  standardRef: string;
  ndtMethod: SimulationNdtMethod;
  equipmentAr: string;
  equipmentEn: string;
  /** Primary continuous variable controlled by slider */
  param1LabelAr: string;
  param1LabelEn: string;
  param1Unit: string;
  param1Min: number;
  param1Max: number;
  param1Step: number;
  param1Default: number;
  /** Secondary continuous variable controlled by slider */
  param2LabelAr: string;
  param2LabelEn: string;
  param2Unit: string;
  param2Min: number;
  param2Max: number;
  param2Step: number;
  param2Default: number;
  /** 4D timeline milestones along t = 0..100% */
  phases: [
    Workshop4dPhaseMilestone,
    Workshop4dPhaseMilestone,
    Workshop4dPhaseMilestone,
    Workshop4dPhaseMilestone,
  ];
}

export interface Workshop4dTelemetrySnapshot {
  phaseIndex: number;
  activePhaseLabelAr: string;
  activePhaseLabelEn: string;
  metric1LabelAr: string;
  metric1LabelEn: string;
  metric1Value: string;
  metric2LabelAr: string;
  metric2LabelEn: string;
  metric2Value: string;
  metric3LabelAr: string;
  metric3LabelEn: string;
  metric3Value: string;
  codePass: boolean;
  codeVerdictAr: string;
  codeVerdictEn: string;
}

export const WORKSHOP_AR4D_BRANCHES: readonly WorkshopAr4dBranchSpec[] = [
  {
    id: 'ut_paut',
    orderLabel: '01',
    shortCode: 'UT / PAUT',
    accentHex: '#22d3ee',
    badgeClass: 'bg-cyan-500 text-slate-950 border-cyan-400',
    titleAr: 'الموجات فوق الصوتية والمصفوفات الطورية (UT & PAUT)',
    titleEn: 'Ultrasonic & Phased Array (UT & PAUT)',
    subtitleAr: 'محاكاة 4D لانتشار الموجات القصية والمسح القطاعي S-Scan حول محيط اللحام',
    subtitleEn: '4D shear-wave skip & 64-element sectorial sweep across girth weld over scan time',
    standardRef: 'ASME Sec. V Art. 4 · ISO 13588',
    ndtMethod: 'PAUT',
    equipmentAr: 'OmniScan X3 64-El · مجس زاوي 5.0 MHz + ويدج بلكسيجلاس',
    equipmentEn: 'OmniScan X3 64-El · 5.0 MHz Shear Probe + Perspex Wedge',
    param1LabelAr: 'زاوية الانكسار (Refracted Angle)',
    param1LabelEn: 'Refracted Beam Angle',
    param1Unit: '°',
    param1Min: 40,
    param1Max: 75,
    param1Step: 5,
    param1Default: 60,
    param2LabelAr: 'سماكة الجدار (Wall Thickness)',
    param2LabelEn: 'Pipe Wall Thickness',
    param2Unit: 'mm',
    param2Min: 8,
    param2Max: 40,
    param2Step: 1,
    param2Default: 20,
    phases: [
      { progressPct: 0, labelAr: 'توليد النبضة (t₀)', labelEn: 'Pulse Excitation' },
      { progressPct: 33, labelAr: 'انكسار سنيل بالويدج', labelEn: 'Wedge Refraction' },
      { progressPct: 66, labelAr: 'قفزة الجذر (½ Skip)', labelEn: 'Half-Skip Root Hit' },
      { progressPct: 100, labelAr: 'قفزة الغطاء (Full Skip)', labelEn: 'Full-Skip Cap Return' },
    ],
  },
  {
    id: 'rt_gamma_xray',
    orderLabel: '02',
    shortCode: 'RT · Gamma',
    accentHex: '#f59e0b',
    badgeClass: 'bg-amber-500 text-slate-950 border-amber-400',
    titleAr: 'التصوير الإشعاعي الصناعي (RT · Ir-192 & X-Ray)',
    titleEn: 'Industrial Radiography (RT · Ir-192 & X-Ray)',
    subtitleAr: 'محاكاة 4D لتوهين الفوتونات وتكوّن الصورة الكامنة على الفيلم وحزام الأمان 2 mR/hr',
    subtitleEn: '4D Beer-Lambert photon attenuation, latent film density buildup & 2 mR/hr perimeter',
    standardRef: 'ASME Sec. V Art. 2 · ENRRA · ISO 17636',
    ndtMethod: 'RT',
    equipmentAr: 'حاوية Sentinel Ir-192 / فيلم Agfa D7 · مؤشر أسلاك ASME IQI',
    equipmentEn: 'Sentinel Ir-192 Projector · Agfa D7 Film · ASME Wire IQI',
    param1LabelAr: 'المسافة البؤرية (SFD)',
    param1LabelEn: 'Source-to-Film Distance (SFD)',
    param1Unit: 'mm',
    param1Min: 250,
    param1Max: 800,
    param1Step: 25,
    param1Default: 500,
    param2LabelAr: 'نشاط المصدر (Activity)',
    param2LabelEn: 'Isotope Activity',
    param2Unit: 'Ci',
    param2Min: 10,
    param2Max: 80,
    param2Step: 5,
    param2Default: 40,
    phases: [
      { progressPct: 0, labelAr: 'إخراج المصدر وإزالة الضمان', labelEn: 'Source Crank-Out' },
      { progressPct: 35, labelAr: 'انبعاث فوتونات جاما', labelEn: 'Gamma Flux Emission' },
      { progressPct: 70, labelAr: 'تراكم الكثافة البصرية H&D', labelEn: 'Film Density Buildup' },
      { progressPct: 100, labelAr: 'سحب المصدر وتوثيق Ug', labelEn: 'Retract & Ug Check' },
    ],
  },
  {
    id: 'vt_pt_mt_surface',
    orderLabel: '03',
    shortCode: 'VT · PT · MT',
    accentHex: '#ec4899',
    badgeClass: 'bg-pink-500 text-white border-pink-400',
    titleAr: 'الفحص البصري والسوائل النافذة والجسيمات المغناطيسية',
    titleEn: 'Surface NDE (VT · PT · MT Yoke)',
    subtitleAr: 'تسلسل زمني 4D لخطوات المغنطة AC Yoke وتغلغل السائل النافذ بالخاصية الشعرية',
    subtitleEn: '4D chronological sequence: AC Yoke flux leakage, PT capillary dwell & VT cap laser gauge',
    standardRef: 'ASME V Art. 6, 7, 9 · AWS D1.1',
    ndtMethod: 'MT',
    equipmentAr: 'حدوة مغناطيسية AC/DC Yoke · بخاخ فلوري UV-A · مقياس كامبريدج',
    equipmentEn: 'AC/DC Electromagnetic Yoke · Type-I Fluorescent PT · Cambridge Gauge',
    param1LabelAr: 'زمن التغلغل / التثبيت (Dwell Time)',
    param1LabelEn: 'Penetrant / Magnetization Dwell',
    param1Unit: 'min',
    param1Min: 5,
    param1Max: 30,
    param1Step: 1,
    param1Default: 12,
    param2LabelAr: 'تباعد قطبي الفك (Yoke Spacing)',
    param2LabelEn: 'MT Yoke Pole Spacing',
    param2Unit: 'mm',
    param2Min: 60,
    param2Max: 180,
    param2Step: 5,
    param2Default: 115,
    phases: [
      { progressPct: 0, labelAr: 'تنظيف وتجفيف السطح', labelEn: 'Pre-Clean & Dry' },
      { progressPct: 35, labelAr: 'تغلغل شعري / مغنطة', labelEn: 'Capillary / Flux Apply' },
      { progressPct: 70, labelAr: 'إظهار الدلالات بالمظهر', labelEn: 'Developer Bleed-Out' },
      { progressPct: 100, labelAr: 'قياس UV-A ومقاس التاج', labelEn: 'UV-A & VT Evaluation' },
    ],
  },
  {
    id: 'et_mfl_tubing',
    orderLabel: '04',
    shortCode: 'ET / MFL',
    accentHex: '#8b5cf6',
    badgeClass: 'bg-violet-500 text-white border-violet-400',
    titleAr: 'التيارات الدوامية وتسرب الفيض للمبادلات والخزانات (ET & MFL)',
    titleEn: 'Eddy Current & Tank Floor MFL',
    subtitleAr: 'مسح متحرك 4D لماسح قيعان الخزانات MFL ومسبار أنابيب المبادلات الحرارية',
    subtitleEn: '4D motorized MFL tank floor crawler & heat-exchanger bobbin coil impedance trace',
    standardRef: 'ASTM E426 · API 653 · ASME Art. 8',
    ndtMethod: 'MULTI',
    equipmentAr: 'ماسح MFL أرضي · وحدة التيارات الدوامية متعددة الترددات RFT/EC',
    equipmentEn: 'Motorized MFL Floor Scanner · Multi-Frequency EC/RFT Tube Unit',
    param1LabelAr: 'تردد المسبار (EC Frequency)',
    param1LabelEn: 'Probe Excitation Frequency',
    param1Unit: 'kHz',
    param1Min: 20,
    param1Max: 400,
    param1Step: 10,
    param1Default: 140,
    param2LabelAr: 'عمق النقر الموضعي (Pitting Loss)',
    param2LabelEn: 'Localized Pitting Wall Loss',
    param2Unit: '%',
    param2Min: 5,
    param2Max: 85,
    param2Step: 5,
    param2Default: 35,
    phases: [
      { progressPct: 0, labelAr: 'معايرة ثقب المرجع ASME', labelEn: 'ASME Tube Reference' },
      { progressPct: 33, labelAr: 'اجتياز عارضة التدعيم', labelEn: 'Baffle Support Pass' },
      { progressPct: 68, labelAr: 'رصد انحراف طور التآكل', labelEn: 'Phase-Angle Flaw Hit' },
      { progressPct: 100, labelAr: 'تحديد عمق الفقد بالخريطة', labelEn: 'C-Scan Wall Map Log' },
    ],
  },
  {
    id: 'pwht_metallurgy',
    orderLabel: '05',
    shortCode: 'PWHT · PMI',
    accentHex: '#f43f5e',
    badgeClass: 'bg-rose-500 text-white border-rose-400',
    titleAr: 'المعالجة الحرارية بعد اللحام 65 kW وعلم المعادن (PWHT & PMI)',
    titleEn: '65 kW PWHT Thermal Cycle & PMI Metallurgy',
    subtitleAr: 'تطور حراري 4D حقيقي لوسادات السيراميك من التسخين وحتى النقع 760°C وفحص الصلادة',
    subtitleEn: '4D thermal glow progression across heating, 760°C soak & cooling + hardness relief',
    standardRef: 'ASME B31.3 Table 331.1.1 · AWS D10.10 · NACE MR0175',
    ndtMethod: 'MULTI',
    equipmentAr: 'وحدة PWHT 65 kW أوتوماتيكية · 12 وسادة FCP · جهاز XRF PMI + UCI',
    equipmentEn: '65 kW Automatic PWHT Rig · 12 Ceramic FCP Pads · XRF PMI & UCI',
    param1LabelAr: 'درجة حرارة النقع المستهدفة (Soak Temp)',
    param1LabelEn: 'Target Soak Temperature',
    param1Unit: '°C',
    param1Min: 580,
    param1Max: 780,
    param1Step: 10,
    param1Default: 630,
    param2LabelAr: 'سماكة الوصلة المعالجة (Thickness)',
    param2LabelEn: 'Joint Wall Thickness',
    param2Unit: 'mm',
    param2Min: 12,
    param2Max: 90,
    param2Step: 2,
    param2Default: 32,
    phases: [
      { progressPct: 0, labelAr: 'التركيب والعزل والترموكبل', labelEn: 'FCP & Type-K Setup' },
      { progressPct: 30, labelAr: 'صعود حراري مقنن ≤220°C/h', labelEn: 'Controlled Ramp Up' },
      { progressPct: 65, labelAr: 'نقع إزالة الإجهادات Soak', labelEn: 'Thermal Stress Soak' },
      { progressPct: 100, labelAr: 'تبريد وفحص صلادة ≤248 HV', labelEn: 'Cool Down & Hardness' },
    ],
  },
  {
    id: 'welding_hydro',
    orderLabel: '06',
    shortCode: 'WELD · HYDRO',
    accentHex: '#fb923c',
    badgeClass: 'bg-orange-500 text-slate-950 border-orange-400',
    titleAr: 'تفتيش اللحام WPS واختبار الضغط الهيدروستاتيكي (Welding & Hydrotest)',
    titleEn: 'Welding WPS Heat Input & Hydrostatic Test',
    subtitleAr: 'محاكاة 4D لتمريرات اللحام المتعاقبة والدخل الحراري يليه ضغط الاختبار 1.5× MAWP',
    subtitleEn: '4D multi-pass bead deposition & heat-input thermal plume followed by 1.5x hydrotest',
    standardRef: 'ASME Sec. IX · AWS D1.1 · ASME B31.3 Ch. VI',
    ndtMethod: 'VT',
    equipmentAr: 'مقياس دخل حراري رقمي · مضخة ضغط هيدروستاتيكية + مسجل شريطي',
    equipmentEn: 'Digital Heat-Input Logger · High-Pressure Hydro Skid & Deadweight',
    param1LabelAr: 'الدخل الحراري (Heat Input)',
    param1LabelEn: 'Welding Heat Input',
    param1Unit: 'kJ/mm',
    param1Min: 0.6,
    param1Max: 3.2,
    param1Step: 0.1,
    param1Default: 1.5,
    param2LabelAr: 'ضغط الاختبار المائي (Test Pressure)',
    param2LabelEn: 'Hydrostatic Test Pressure',
    param2Unit: 'bar',
    param2Min: 15,
    param2Max: 180,
    param2Step: 5,
    param2Default: 95,
    phases: [
      { progressPct: 0, labelAr: 'تمريرة الجذر GTAW Root', labelEn: 'GTAW Root & Purge' },
      { progressPct: 35, labelAr: 'تمريرات الملء والغطاء Cap', labelEn: 'Fill & Cap Passes' },
      { progressPct: 70, labelAr: 'رفع الضغط الهيدروستاتيكي', labelEn: 'Hydro Pressurization' },
      { progressPct: 100, labelAr: 'زمن الثبات وفحص التسريب', labelEn: 'Hold & Zero-Leak Pass' },
    ],
  },
  {
    id: 'api_coating_corrosion',
    orderLabel: '07',
    shortCode: 'API · COAT',
    accentHex: '#10b981',
    badgeClass: 'bg-emerald-500 text-slate-950 border-emerald-400',
    titleAr: 'فحص API وتدهور السماكة وفحص الدهانات (API 510/570 & Coating)',
    titleEn: 'API Corrosion Life & Coating Holiday Inspection',
    subtitleAr: 'محاكاة 4D عبر سنوات الخدمة (0–25 سنة) لتآكل الجدار + كاشف الشرر Holiday وقياس DFT',
    subtitleEn: '4D multi-year service life wall-loss trajectory (0–25 yrs) + SSPC-PA 2 & Holiday spark',
    standardRef: 'API 570 · API 510 · SSPC-PA 2 · NACE SP0188',
    ndtMethod: 'UT',
    equipmentAr: 'مقياس سماكة بالموجات UT · مقياس DFT · كاشف شرر Holiday 15 kV',
    equipmentEn: 'UT Corrosion Gauge · PosiTector DFT · 15 kV Holiday Spark Detector',
    param1LabelAr: 'معدل التآكل السنوي (Corrosion Rate)',
    param1LabelEn: 'Annual Corrosion Rate (CR)',
    param1Unit: 'mm/yr',
    param1Min: 0.05,
    param1Max: 0.65,
    param1Step: 0.05,
    param1Default: 0.2,
    param2LabelAr: 'سماكة الطلاء الجاف (Coating DFT)',
    param2LabelEn: 'Dry Film Thickness (DFT)',
    param2Unit: 'µm',
    param2Min: 120,
    param2Max: 550,
    param2Step: 10,
    param2Default: 320,
    phases: [
      { progressPct: 0, labelAr: 'تجهيز السفع Sa 2½', labelEn: 'Sa 2½ Blast Profile' },
      { progressPct: 33, labelAr: 'تطبيق الإيبوكسي ومسح الشرر', labelEn: 'DFT & Holiday Sweep' },
      { progressPct: 68, labelAr: 'التقادم التشغيلي (Year 12)', labelEn: 'Mid-Life CML Audit' },
      { progressPct: 100, labelAr: 'أفق العمر المتبقي (RL)', labelEn: 'Remaining Life Check' },
    ],
  },
  {
    id: 'asset_integrity_irata',
    orderLabel: '08',
    shortCode: 'IRATA · QA',
    accentHex: '#38bdf8',
    badgeClass: 'bg-sky-500 text-slate-950 border-sky-400',
    titleAr: 'سلامة الأصول والوصول بالحبال وضمان الجودة (IRATA & RBI / ITP)',
    titleEn: 'Asset Integrity · IRATA Rope Access & QA/QC ITP',
    subtitleAr: 'محاكاة 4D لنزول طاقم IRATA بالحبلين المستقلين على الأبراج وتخفيض مصفوفة المخاطر RBI',
    subtitleEn: '4D twin-rope IRATA elevated column descent, tool tethering & API 580 risk reduction',
    standardRef: 'IRATA ICOP · API 580 RBI · API 579 FFS · ISO 9001',
    ndtMethod: 'MULTI',
    equipmentAr: 'نظام الحبلين المستقلين IRATA L3 · تأمين أدوات سقوط · مصفوفة PoF×CoF',
    equipmentEn: 'Twin-Rope IRATA L3 Rig · Drop-Prevent Tether · API 580 RBI Console',
    param1LabelAr: 'ارتفاع موقع الفحص (Tower Elevation)',
    param1LabelEn: 'Tower Inspection Elevation',
    param1Unit: 'm',
    param1Min: 10,
    param1Max: 95,
    param1Step: 5,
    param1Default: 48,
    param2LabelAr: 'تغطية الفحص لتقليل المخاطر (RBI Scope)',
    param2LabelEn: 'RBI NDE Coverage Scope',
    param2Unit: '%',
    param2Min: 10,
    param2Max: 100,
    param2Step: 5,
    param2Default: 80,
    phases: [
      { progressPct: 0, labelAr: 'تثبيت نقطتي الربط المستقلتين', labelEn: 'Dual Anchor & Rescue' },
      { progressPct: 33, labelAr: 'النزول بالحبلين وتأمين الأجهزة', labelEn: 'Twin-Rope Descent' },
      { progressPct: 68, labelAr: 'تنفيذ مسح NDT على الارتفاع', labelEn: 'Aloft NDT Scanning' },
      { progressPct: 100, labelAr: 'توقيع Hold Point وتحديث RBI', labelEn: 'ITP Sign-Off & RBI' },
    ],
  },
];

export function mapDisciplineToAr4dBranch(disciplineId?: string): WorkshopAr4dBranchId {
  switch (disciplineId) {
    case 'conventional_ndt':
      return 'vt_pt_mt_surface';
    case 'ndt_advanced':
      return 'ut_paut';
    case 'welding_inspection':
      return 'welding_hydro';
    case 'pwht_metallurgy':
      return 'pwht_metallurgy';
    case 'api_inspection':
      return 'api_coating_corrosion';
    case 'coating_corrosion':
      return 'api_coating_corrosion';
    case 'qa_qc':
      return 'asset_integrity_irata';
    case 'asset_integrity_rope':
      return 'asset_integrity_irata';
    default:
      return 'ut_paut';
  }
}

export function computeWorkshop4dTelemetry(
  branch: WorkshopAr4dBranchSpec,
  timeProgress01: number,
  param1: number,
  param2: number
): Workshop4dTelemetrySnapshot {
  const t = Math.max(0, Math.min(1, timeProgress01));
  const pct = t * 100;

  let phaseIndex = 0;
  for (let i = branch.phases.length - 1; i >= 0; i -= 1) {
    if (pct >= branch.phases[i].progressPct) {
      phaseIndex = i;
      break;
    }
  }
  const activePhase = branch.phases[phaseIndex];

  switch (branch.id) {
    case 'ut_paut': {
      const rad = (param1 * Math.PI) / 180;
      const halfSkip = param2 * Math.tan(rad);
      const soundPath = (param2 / Math.cos(rad)) * (0.4 + t * 1.6);
      const depth = t <= 0.5 ? param2 * (t * 2) : param2 * (2 - t * 2);
      const echoFsh = Math.round(42 + Math.sin(Math.min(Math.PI, t * Math.PI)) * 52);
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'مسار الصوت (Sound Path)',
        metric1LabelEn: 'Sound Path (SP)',
        metric1Value: `${soundPath.toFixed(1)} mm`,
        metric2LabelAr: 'القفزة النصفية ½S / العمق',
        metric2LabelEn: 'Half-Skip ½S / Depth',
        metric2Value: `${halfSkip.toFixed(1)} / ${depth.toFixed(1)} mm`,
        metric3LabelAr: 'ذروة الصدى (A-Scan)',
        metric3LabelEn: 'Echo Amplitude',
        metric3Value: `${echoFsh}% FSH`,
        codePass: param1 >= 45 && param1 <= 70,
        codeVerdictAr: param1 >= 45 && param1 <= 70 ? 'تغطية S-Scan مطابقة لـ ASME Art. 4' : 'زاوية خارج النطاق القياسي',
        codeVerdictEn: param1 >= 45 && param1 <= 70 ? 'S-Scan Coverage ASME Art. 4 PASS' : 'Angle Outside Standard Band',
      };
    }

    case 'rt_gamma_xray': {
      const sfd = param1;
      const wall = 14;
      const sod = Math.max(30, sfd - wall - 3);
      const ug = (3.0 * (wall + 3)) / sod;
      const maxUg = 0.51;
      const opticalDensity = 0.3 + t * Math.min(3.4, (param2 / 40) * (500 / sfd) * 2.45);
      const barricadeM = Math.round(Math.sqrt((param2 * 480) / 2));
      const passes = ug <= maxUg && (t < 0.85 || (opticalDensity >= 2.0 && opticalDensity <= 4.0));
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'اللاوضوح الهندسي (Ug)',
        metric1LabelEn: 'Geometric Unsharpness Ug',
        metric1Value: `${ug.toFixed(3)} / ${maxUg} mm`,
        metric2LabelAr: 'الكثافة البصرية الحية (H&D)',
        metric2LabelEn: 'Live Film Density (H&D)',
        metric2Value: `${opticalDensity.toFixed(2)} D`,
        metric3LabelAr: 'نصف قطر الحزام الآمن',
        metric3LabelEn: '2 mR/hr Barricade',
        metric3Value: `${barricadeM} m`,
        codePass: passes,
        codeVerdictAr: ug <= maxUg ? 'اللاوضوح Ug مطابق لـ ASME Sec. V' : 'تجاوز حد Ug — زد المسافة SFD',
        codeVerdictEn: ug <= maxUg ? 'ASME Sec. V Ug & Dose Perimeter PASS' : 'Exceeds Max Ug — Increase SFD',
      };
    }

    case 'vt_pt_mt_surface': {
      const dwellValid = param1 >= 10 && param1 <= 25;
      const yokeValid = param2 >= 75 && param2 <= 150;
      const bleedPct = Math.round(Math.min(100, t * 125));
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'نسبة إظهار الدلالة 4D',
        metric1LabelEn: '4D Indication Contrast',
        metric1Value: `${bleedPct}%`,
        metric2LabelAr: 'مؤقت التغلغل / الفحص',
        metric2LabelEn: 'Dwell Timer',
        metric2Value: `${(param1 * t).toFixed(1)} / ${param1} min`,
        metric3LabelAr: 'إضاءة UV-A / فك Yoke',
        metric3LabelEn: 'UV-A / Pole Span',
        metric3Value: `${param2} mm · 1420 µW/cm²`,
        codePass: dwellValid && yokeValid,
        codeVerdictAr: dwellValid && yokeValid ? 'مقبول طبقاً لـ ASME Art. 6 & 7' : 'اضبط التباعد (75–150mm) وزمن التغلغل (≥10m)',
        codeVerdictEn: dwellValid && yokeValid ? 'ASME Art. 6/7 Surface Sensitivity PASS' : 'Adjust Yoke (75–150mm) & Dwell (≥10m)',
      };
    }

    case 'et_mfl_tubing': {
      const penDepthMm = (503 / Math.sqrt(param1 * 1000 * 1.0 * 1.4)) * 10;
      const phaseDeg = Math.round(18 + param2 * 1.45);
      const flawAmp = Math.round(18 + Math.exp(-Math.pow((t - 0.68) * 6, 2)) * param2);
      const acceptable = param2 < 40;
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'عمق الاختراق القياسي δ',
        metric1LabelEn: 'Skin Depth (δ)',
        metric1Value: `${penDepthMm.toFixed(2)} mm`,
        metric2LabelAr: 'زاوية طور ليساجو',
        metric2LabelEn: 'Lissajous Phase Angle',
        metric2Value: `${phaseDeg}°`,
        metric3LabelAr: 'فقد السماكة / السعة',
        metric3LabelEn: 'Wall Loss / Signal',
        metric3Value: `${param2}% (${flawAmp}%)`,
        codePass: acceptable,
        codeVerdictAr: acceptable ? 'تآكل أقل من حد السد 40% (API 653 / TEMA)' : 'يتطلب سد الأنبوب أو تقييم إصلاح (>40%)',
        codeVerdictEn: acceptable ? 'Below 40% Tube Plugging Limit' : 'Exceeds 40% Wall Loss — Plug/Repair',
      };
    }

    case 'pwht_metallurgy': {
      const ambient = 28;
      let currentTemp = ambient;
      if (t < 0.35) {
        currentTemp = ambient + (param1 - ambient) * (t / 0.35);
      } else if (t < 0.72) {
        currentTemp = param1 + Math.sin(t * 25) * 4;
      } else {
        currentTemp = param1 - (param1 - 240) * ((t - 0.72) / 0.28);
      }
      const stressReliefPct = Math.round(Math.min(96, Math.pow(Math.min(1, t / 0.75), 1.4) * 94));
      const postHardnessHv = Math.round(288 - stressReliefPct * 0.72);
      const soakMins = Math.max(60, Math.round((param2 / 25) * 60));
      const passes = param1 >= 595 && param1 <= 760 && postHardnessHv <= 248;
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'الحرارة الحية للوصلة',
        metric1LabelEn: 'Live Joint Temp',
        metric1Value: `${Math.round(currentTemp)}°C`,
        metric2LabelAr: 'زمن النقع / إزالة الإجهاد',
        metric2LabelEn: 'Soak / Stress Relief',
        metric2Value: `${soakMins} min · ${stressReliefPct}%`,
        metric3LabelAr: 'صلادة HAZ المتوقعة',
        metric3LabelEn: 'Post-PWHT Hardness',
        metric3Value: `${postHardnessHv} HV`,
        codePass: passes,
        codeVerdictAr: passes ? 'دورة PWHT مطابقة لـ ASME B31.3 و NACE ≤248 HV' : 'حرارة خارج النافذة أو صلادة مرتفعة',
        codeVerdictEn: passes ? 'ASME B31.3 & NACE ≤248 HV Hardness PASS' : 'Check Soak Window / Post Hardness',
      };
    }

    case 'welding_hydro': {
      const hydroPhase = t >= 0.65;
      const livePressureBar = hydroPhase ? param2 * Math.min(1, (t - 0.65) / 0.22) : 0;
      const heatInputOk = param1 >= 0.8 && param1 <= 2.4;
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'الدخل الحراري WPS',
        metric1LabelEn: 'WPS Heat Input',
        metric1Value: `${param1.toFixed(1)} kJ/mm`,
        metric2LabelAr: 'ضغط الاختبار الحي',
        metric2LabelEn: 'Live Hydro Pressure',
        metric2Value: `${livePressureBar.toFixed(1)} / ${param2} bar`,
        metric3LabelAr: 'حالة الإحكام والتمريرات',
        metric3LabelEn: 'Pass / Tightness',
        metric3Value: hydroPhase ? 'HOLD · ZERO DROP' : `PASS ${Math.min(4, Math.floor(t * 6) + 1)}/4`,
        codePass: heatInputOk,
        codeVerdictAr: heatInputOk ? 'الدخل الحراري واختبار الضغط 1.5× مطابقان لـ ASME IX' : 'تحذير: الدخل الحراري خارج حدود PQR',
        codeVerdictEn: heatInputOk ? 'WPS Heat Input & 1.5x Hydrotest PASS' : 'Heat Input Outside Qualified PQR Range',
      };
    }

    case 'api_coating_corrosion': {
      const nominalT = 12.7;
      const tMin = 6.2;
      const simYear = t * 25;
      const remainingWall = Math.max(2.0, nominalT - param1 * simYear);
      const remainingLifeYr = Math.max(0, (nominalT - tMin) / param1);
      const dftOk = param2 >= 250 && param2 <= 450;
      const wallOk = remainingWall >= tMin;
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'السماكة عند السنة ' + simYear.toFixed(1),
        metric1LabelEn: `Wall @ Year ${simYear.toFixed(1)}`,
        metric1Value: `${remainingWall.toFixed(2)} mm`,
        metric2LabelAr: 'العمر المتبقي (RL)',
        metric2LabelEn: 'Remaining Life (RL)',
        metric2Value: `${remainingLifeYr.toFixed(1)} yrs`,
        metric3LabelAr: 'سماكة الدهان الجاف DFT',
        metric3LabelEn: 'Coating DFT',
        metric3Value: `${param2} µm`,
        codePass: wallOk && dftOk,
        codeVerdictAr: wallOk && dftOk ? 'السماكة فوق t_min والطلاء مطابق لـ SSPC-PA 2' : !wallOk ? 'تجاوز t_min — استبدال أو إعادة تصنيف' : 'سماكة الطلاء خارج نطاق 250–450 µm',
        codeVerdictEn: wallOk && dftOk ? 'Above t_min & SSPC-PA 2 DFT PASS' : !wallOk ? 'Below t_min — Repair/Rerate Required' : 'DFT Outside 250–450 µm Spec',
      };
    }

    case 'asset_integrity_irata': {
      const altitudeM = param1 * Math.sin(Math.min(Math.PI, t * Math.PI * 0.92 + 0.12));
      const riskReductionPct = Math.round(param2 * 0.85 * Math.min(1, 0.25 + t * 0.85));
      const twinRopeSafe = param2 >= 50;
      return {
        phaseIndex,
        activePhaseLabelAr: activePhase.labelAr,
        activePhaseLabelEn: activePhase.labelEn,
        metric1LabelAr: 'الارتفاع الحالي (4D)',
        metric1LabelEn: 'Live Elevation (4D)',
        metric1Value: `${altitudeM.toFixed(1)} / ${param1} m`,
        metric2LabelAr: 'تخفيض مخاطر RBI',
        metric2LabelEn: 'PoF Risk Reduction',
        metric2Value: `-${riskReductionPct}% PoF`,
        metric3LabelAr: 'تأمين الحبلين + ITP',
        metric3LabelEn: 'Twin-Rope & ITP',
        metric3Value: t > 0.85 ? 'HOLD SIGNED' : 'DUAL LOCKED',
        codePass: twinRopeSafe,
        codeVerdictAr: twinRopeSafe ? 'تأمين IRATA مزدوج ونطاق RBI معتمد' : 'وسّع نطاق فحص RBI لخفض المخاطر (≥50%)',
        codeVerdictEn: twinRopeSafe ? 'IRATA Twin-Rope & API 580 RBI PASS' : 'Expand RBI NDE Scope (≥50%)',
      };
    }
  }
}
