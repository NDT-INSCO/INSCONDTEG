export type MissingNdtMethodId =
  | 'et_rft'
  | 'lt_hydro'
  | 'tofd'
  | 'mfl_api_ffs'
  | 'coating_holiday'
  | 'pmi_hardness';

export type CodeVerdictStatus = 'pass' | 'warn' | 'reject';

export interface MissingNdtParamSpec {
  key: string;
  labelAr: string;
  labelEn: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface MissingNdtCodeClauseResult {
  codeId: string;
  standard: string;
  clause: string;
  titleAr: string;
  titleEn: string;
  status: CodeVerdictStatus;
  limitAr: string;
  limitEn: string;
  measuredAr: string;
  measuredEn: string;
  reasonAr: string;
  reasonEn: string;
  remediationAr: string;
  remediationEn: string;
}

export interface MissingNdtTelemetryMetric {
  id: string;
  labelAr: string;
  labelEn: string;
  value: string;
  tone: 'cyan' | 'amber' | 'emerald' | 'rose' | 'violet';
}

export interface MissingNdtEvaluationResult {
  methodId: MissingNdtMethodId;
  overallStatus: CodeVerdictStatus;
  passCount: number;
  warnCount: number;
  rejectCount: number;
  metrics: MissingNdtTelemetryMetric[];
  clauses: MissingNdtCodeClauseResult[];
  summaryAr: string;
  summaryEn: string;
  physicsFormulaAr: string;
  physicsFormulaEn: string;
  /** Method-specific structured telemetry for SVG visualizers */
  visualData: Record<string, number | string | boolean>;
}

export interface MissingNdtCodeScenario {
  id: string;
  methodId: MissingNdtMethodId;
  codeBadge: string;
  expectedOutcome: CodeVerdictStatus;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  acceptanceTargetAr: string;
  acceptanceTargetEn: string;
  params: Record<string, number>;
}

export interface MissingNdtMethodMeta {
  id: MissingNdtMethodId;
  shortCode: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  codesCovered: string[];
  params: MissingNdtParamSpec[];
}

export const MISSING_NDT_METHODS: readonly MissingNdtMethodMeta[] = [
  {
    id: 'et_rft',
    shortCode: 'ET / RFT',
    titleAr: 'التيارات الدوامية وفحص الأنابيب عن بُعد (ET & RFT)',
    titleEn: 'Eddy Current & Remote Field Tubing (ET / RFT)',
    subtitleAr: 'مخطط ليساجو للمعاوقة، عمق الاختراق القشري، وزاوية الطور ID/OD',
    subtitleEn: 'Lissajous Impedance Plane, Skin Depth δ, & ID/OD Phase Discrimination',
    codesCovered: ['ASME Sec. V Art. 8', 'ASTM E426', 'ISO 15548', 'TEMA RCB', 'API RP 572'],
    params: [
      {
        key: 'frequencyKhz',
        labelAr: 'تردد المجس (kHz)',
        labelEn: 'Probe Frequency',
        unit: 'kHz',
        min: 10,
        max: 500,
        step: 5,
        defaultValue: 120,
      },
      {
        key: 'wallLossPct',
        labelAr: 'نسبة تآكل جدار الأنبوب (%)',
        labelEn: 'Tube Wall Loss',
        unit: '% WT',
        min: 0,
        max: 85,
        step: 2,
        defaultValue: 18,
      },
      {
        key: 'defectSide',
        labelAr: 'موضع العيب (0=ID داخلي · 1=OD خارجي)',
        labelEn: 'Flaw Origin (0=ID · 1=OD)',
        unit: 'Side',
        min: 0,
        max: 1,
        step: 1,
        defaultValue: 1,
      },
      {
        key: 'fillFactorPct',
        labelAr: 'معامل الامتلاء (Fill Factor %)',
        labelEn: 'Coil Fill Factor',
        unit: '%',
        min: 55,
        max: 96,
        step: 1,
        defaultValue: 84,
      },
    ],
  },
  {
    id: 'lt_hydro',
    shortCode: 'LT / HYDRO',
    titleAr: 'اختبارات التسريب والضغط الهيدروستاتيكي (LT & Hydro)',
    titleEn: 'Leak Testing: Hydrostatic, Pneumatic, Vacuum Box & He-MS',
    subtitleAr: 'منحنى Pressure-Time، صندوق التفريغ، ومطياف الهيليوم الدقيق',
    subtitleEn: 'Pressure-Time Chart Recorder, Vacuum Box Bubble Test & He-Mass Spec',
    codesCovered: [
      'ASME Sec. VIII UG-99',
      'ASME B31.3 Ch. VI',
      'ASME Sec. V Art. 10',
      'API 653 Sec. 12',
      'API 1104',
    ],
    params: [
      {
        key: 'mawpBar',
        labelAr: 'أقصى ضغط تشغيل مسموح MAWP',
        labelEn: 'Design MAWP',
        unit: 'bar',
        min: 10,
        max: 120,
        step: 2,
        defaultValue: 40,
      },
      {
        key: 'appliedRatioPct',
        labelAr: 'نسبة ضغط الاختبار إلى MAWP (%)',
        labelEn: 'Test Pressure Ratio (% MAWP)',
        unit: '%',
        min: 90,
        max: 175,
        step: 5,
        defaultValue: 150,
      },
      {
        key: 'pressureDropPctHr',
        labelAr: 'انخفاض الضغط أو التسريب المقاس',
        labelEn: 'Measured Pressure Decay / Leak',
        unit: '%/hr',
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.2,
      },
      {
        key: 'vacuumKpa',
        labelAr: 'تفريغ صندوق الفقاعات (Vacuum Box)',
        labelEn: 'Vacuum Box Differential ΔP',
        unit: 'kPa',
        min: 8,
        max: 45,
        step: 1,
        defaultValue: 28,
      },
    ],
  },
  {
    id: 'tofd',
    shortCode: 'TOFD',
    titleAr: 'حيود زمن الطيران بالموجات فوق الصوتية (TOFD)',
    titleEn: 'Time-of-Flight Diffraction (TOFD) Weld Sizing',
    subtitleAr: 'الموجة الجانبية، قوسا حيود أطراف الشرخ، ومنحنى B-Scan/A-Scan',
    subtitleEn: 'Lateral Wave, Tip Diffraction Hyperbolas, Dead Zone & B/A-Scan',
    codesCovered: [
      'ASME Sec. V Art. 4 App. III',
      'ASME Sec. VIII App. 12',
      'ISO 10863',
      'ISO 15626',
      'AWS D1.1 Cl. 8',
    ],
    params: [
      {
        key: 'thicknessMm',
        labelAr: 'سماكة الجدار (T)',
        labelEn: 'Wall Thickness (T)',
        unit: 'mm',
        min: 12,
        max: 80,
        step: 2,
        defaultValue: 30,
      },
      {
        key: 'pcsMm',
        labelAr: 'تباعد المجسين (PCS)',
        labelEn: 'Probe Center Separation (PCS)',
        unit: 'mm',
        min: 20,
        max: 160,
        step: 2,
        defaultValue: 64,
      },
      {
        key: 'flawTopDepthMm',
        labelAr: 'عمق الطرف العلوي للعيب (d₁)',
        labelEn: 'Upper Flaw Tip Depth (d₁)',
        unit: 'mm',
        min: 1.5,
        max: 60,
        step: 0.5,
        defaultValue: 11,
      },
      {
        key: 'flawHeightMm',
        labelAr: 'الارتفاع العمودي للشرخ (h)',
        labelEn: 'Through-Wall Flaw Height (h)',
        unit: 'mm',
        min: 0.5,
        max: 24,
        step: 0.5,
        defaultValue: 2.5,
      },
    ],
  },
  {
    id: 'mfl_api_ffs',
    shortCode: 'MFL / API / FFS',
    titleAr: 'تسرب الفيض المغناطيسي وتقييم العمر المتبقي (MFL & API 510/570/653/579)',
    titleEn: 'MFL Tank Floor & API 510/570/653/579 Remaining Life & FFS',
    subtitleAr: 'خريطة قاع الخزان C-Scan، معدل التآكل CR، ومعامل القوة المتبقية RSF',
    subtitleEn: 'MFL Floor C-Scan Map, Corrosion Rate, Remaining Life & API 579 RSF',
    codesCovered: ['API 653', 'API 510', 'API 570', 'API 579-1 / FFS-1', 'ASME B31G'],
    params: [
      {
        key: 'nominalThickMm',
        labelAr: 'السماكة التصميمية / المطلوبة t_min',
        labelEn: 'Required Minimum Thickness t_min',
        unit: 'mm',
        min: 3.0,
        max: 18.0,
        step: 0.5,
        defaultValue: 6.5,
      },
      {
        key: 'actualThickMm',
        labelAr: 'أقل سماكة متبقية مقاسة t_actual',
        labelEn: 'Measured Remaining Thickness t_actual',
        unit: 'mm',
        min: 1.5,
        max: 22.0,
        step: 0.2,
        defaultValue: 8.6,
      },
      {
        key: 'corrosionRateMmYr',
        labelAr: 'معدل التآكل السنوي (CR)',
        labelEn: 'Corrosion Rate (CR)',
        unit: 'mm/yr',
        min: 0.05,
        max: 2.0,
        step: 0.05,
        defaultValue: 0.25,
      },
      {
        key: 'mflLossPct',
        labelAr: 'إشارة MFL المعايرة (% فقد محلي)',
        labelEn: 'MFL Localized Loss Signal',
        unit: '%',
        min: 5,
        max: 85,
        step: 5,
        defaultValue: 25,
      },
    ],
  },
  {
    id: 'coating_holiday',
    shortCode: 'COATING / DFT',
    titleAr: 'فحص الطلاء والندى والسمك الجاف واختبار الهوليداي',
    titleEn: 'Coating Inspection: Dew Point ΔT, SSPC-PA 2 DFT & Holiday Spark',
    subtitleAr: 'معادلة ماجنوس لنقطة الندى، ملف السفع D4417، وجُهد NACE SP0188',
    subtitleEn: 'Magnus Dew Point Spread, Blast Profile, SSPC-PA 2 & Holiday Voltage',
    codesCovered: ['SSPC-PA 2', 'ISO 8501-1', 'ASTM D4417', 'NACE SP0188', 'ISO 8502-6'],
    params: [
      {
        key: 'steelTempC',
        labelAr: 'درجة حرارة المعدن (T_steel)',
        labelEn: 'Steel Substrate Temp',
        unit: '°C',
        min: 10,
        max: 50,
        step: 0.5,
        defaultValue: 26,
      },
      {
        key: 'relHumidityPct',
        labelAr: 'الرطوبة النسبية المحيطة (RH %)',
        labelEn: 'Relative Humidity (RH %)',
        unit: '%',
        min: 20,
        max: 96,
        step: 1,
        defaultValue: 62,
      },
      {
        key: 'measuredDftUm',
        labelAr: 'متوسط سماكة الطلاء الجاف (DFT)',
        labelEn: 'Measured Average DFT',
        unit: 'µm',
        min: 120,
        max: 500,
        step: 10,
        defaultValue: 260,
      },
      {
        key: 'saltMgM2',
        labelAr: 'أملاح بريسيل الذائبة (Bresle Salt)',
        labelEn: 'Bresle Soluble Salts',
        unit: 'mg/m²',
        min: 5,
        max: 95,
        step: 5,
        defaultValue: 25,
      },
    ],
  },
  {
    id: 'pmi_hardness',
    shortCode: 'PMI / HARDNESS',
    titleAr: 'تحقق السبائك XRF PMI والصلادة بعد اللحام (NACE / ASME)',
    titleEn: 'XRF Alloy Verification (PMI) & Weld / Sour-Service Hardness',
    subtitleAr: 'طيف الطاقة XRF، المكافئ الكربوني CE، وحدود NACE MR0175',
    subtitleEn: 'XRF keV Spectrum, Carbon Equivalent CE_IIW & NACE MR0175 Hardness',
    codesCovered: ['API RP 578', 'ASTM E1476', 'ASME Sec. II', 'NACE MR0175', 'ASTM A956'],
    params: [
      {
        key: 'chromiumPct',
        labelAr: 'نسبة الكروم المقاسة XRF (Cr %)',
        labelEn: 'Measured Chromium (Cr %)',
        unit: '% Cr',
        min: 0.1,
        max: 24.0,
        step: 0.1,
        defaultValue: 2.25,
      },
      {
        key: 'molybdenumPct',
        labelAr: 'نسبة الموليبدينوم المقاسة XRF (Mo %)',
        labelEn: 'Measured Molybdenum (Mo %)',
        unit: '% Mo',
        min: 0.0,
        max: 3.5,
        step: 0.05,
        defaultValue: 1.0,
      },
      {
        key: 'hazHardnessHv',
        labelAr: 'أعلى صلادة في منطقة التأثر الحراري (HAZ)',
        labelEn: 'Peak HAZ Hardness (HV10)',
        unit: 'HV',
        min: 150,
        max: 360,
        step: 2,
        defaultValue: 218,
      },
      {
        key: 'carbonEq',
        labelAr: 'المكافئ الكربوني (CE_IIW)',
        labelEn: 'Carbon Equivalent (CE_IIW)',
        unit: 'CE',
        min: 0.25,
        max: 0.65,
        step: 0.01,
        defaultValue: 0.41,
      },
    ],
  },
];

function computeOverallStatus(clauses: MissingNdtCodeClauseResult[]): {
  overallStatus: CodeVerdictStatus;
  passCount: number;
  warnCount: number;
  rejectCount: number;
} {
  let passCount = 0;
  let warnCount = 0;
  let rejectCount = 0;
  for (const c of clauses) {
    if (c.status === 'pass') passCount += 1;
    else if (c.status === 'warn') warnCount += 1;
    else rejectCount += 1;
  }
  const overallStatus: CodeVerdictStatus =
    rejectCount > 0 ? 'reject' : warnCount > 0 ? 'warn' : 'pass';
  return { overallStatus, passCount, warnCount, rejectCount };
}

function evaluateEtRft(params: Record<string, number>): MissingNdtEvaluationResult {
  const fKhz = params.frequencyKhz ?? 120;
  const wallLossPct = params.wallLossPct ?? 18;
  const isOd = (params.defectSide ?? 1) >= 0.5;
  const fillFactorPct = params.fillFactorPct ?? 84;

  // Austenitic 316L / Inconel tubing reference: sigma_r ~ 2.4% IACS, mu_r = 1
  const sigmaIacsPct = 2.4;
  const fHz = fKhz * 1000;
  // Standard skin depth in mm for %IACS non-magnetic alloy: delta_mm ≈ 660 / sqrt(f_Hz * sigma_pct)
  const skinDepthMm = 660 / Math.sqrt(Math.max(1, fHz) * sigmaIacsPct);
  const f90Khz = Number(((660 / 1.65) ** 2 / (sigmaIacsPct * 1000)).toFixed(0)); // 1.65mm nominal tube WT

  // Phase angle convention (ASME Sec V Art. 8 calibration: 4x20% OD hole ≈ 115-145°, ID pit ≈ 30-55°)
  const phaseDeg = isOd
    ? Math.min(168, Math.round(92 + wallLossPct * 0.92))
    : Math.min(82, Math.round(22 + wallLossPct * 0.72));

  const snrDb = Number(
    Math.max(4, (wallLossPct * 0.45 + (fillFactorPct - 55) * 0.35 - (fKhz > 320 ? 3 : 0))).toFixed(1)
  );
  const amplitudeV = Number(Math.min(9.8, 0.4 + wallLossPct * 0.11).toFixed(2));

  const clauses: MissingNdtCodeClauseResult[] = [
    {
      codeId: 'asme_v_art8',
      standard: 'ASME Sec. V Art. 8',
      clause: 'T-862 / App. II',
      titleAr: 'معايرة الطور ونسبة الإشارة إلى الضوضاء',
      titleEn: 'Phase Rotation & Signal-to-Noise Ratio',
      status: snrDb >= 9.5 && fillFactorPct >= 75 ? 'pass' : snrDb >= 6 ? 'warn' : 'reject',
      limitAr: 'SNR ≥ 9.5 dB ومعامل امتلاء ≥ 75%',
      limitEn: 'SNR ≥ 9.5 dB & Fill Factor ≥ 75%',
      measuredAr: `${snrDb} dB · Fill ${fillFactorPct}%`,
      measuredEn: `${snrDb} dB · Fill ${fillFactorPct}%`,
      reasonAr:
        fillFactorPct < 75
          ? 'انخفاض معامل الامتلاء يسبب ضوضاء Lift-off تمنع التمييز الدقيق لعمق العيب.'
          : 'الإشارة متوافقة مع منحنى معايرة الثقوب ASME 20%-100%.',
      reasonEn:
        fillFactorPct < 75
          ? 'Low fill factor introduces excessive lift-off noise masking defect phase.'
          : 'Phase rotation and SNR satisfy ASME Appendix II calibration tube checks.',
      remediationAr: 'استخدم بروب بقطر أقرب للقطر الداخلي للأنبوب (Fill ≥ 80%) وأعد معايرة Lift-off.',
      remediationEn: 'Select larger bobbin probe OD (Fill ≥ 80%) and re-null lift-off balance.',
    },
    {
      codeId: 'tema_rcb',
      standard: 'TEMA RCB / Industry',
      clause: 'Plug Limit 40%',
      titleAr: 'حد سَد أنابيب المبادلات الحرارية (Plugging Criteria)',
      titleEn: 'Heat Exchanger Tube Plugging Threshold',
      status: wallLossPct >= 40 ? 'reject' : wallLossPct >= 25 ? 'warn' : 'pass',
      limitAr: 'تآكل < 40% من سماكة الجدار (تحذير ≥ 25%)',
      limitEn: 'Wall Loss < 40% WT (Monitor ≥ 25%)',
      measuredAr: `${wallLossPct}% (${isOd ? 'خارجي OD' : 'داخلي ID'})`,
      measuredEn: `${wallLossPct}% (${isOd ? 'OD side' : 'ID side'})`,
      reasonAr:
        wallLossPct >= 40
          ? 'تجاوز التآكل حد الـ 40%؛ يلزم عزل وسد الأنبوب ميكانيكياً (Tube Plugging) فوراً.'
          : wallLossPct >= 25
          ? 'تآكل متوسط يوضع على قائمة المتابعة الدورية في التوقف القادم.'
          : 'سماكة الجدار المتبقية ضمن الحدود الآمنة للتشغيل.',
      reasonEn:
        wallLossPct >= 40
          ? 'Wall loss reaches ≥ 40% plugging criterion; isolate and plug tube immediately.'
          : wallLossPct >= 25
          ? 'Moderate thinning flagged for re-inspection during next turnaround.'
          : 'Remaining tube wall is within safe operating margin.',
      remediationAr: 'نفّذ سد ميكانيكي للأنبوب (Tapered / Explosive Plug) وسجّل إحداثي الصف والعمود.',
      remediationEn: 'Install mechanical tube plug and record row/column tube-sheet coordinate.',
    },
    {
      codeId: 'astm_e426',
      standard: 'ASTM E426 / E309',
      clause: 'Sec. 8.3 Skin Depth',
      titleAr: 'اختيار التردد الأساسي f90 لاختراق كامل الجدار',
      titleEn: 'Standard Penetration Depth (δ) Frequency Selection',
      status:
        skinDepthMm >= 1.1 && skinDepthMm <= 2.4
          ? 'pass'
          : skinDepthMm >= 0.75
          ? 'warn'
          : 'reject',
      limitAr: 'δ = 1.1 – 2.4 mm (لجدار 1.65 mm)',
      limitEn: 'δ = 1.1 – 2.4 mm (for 1.65 mm WT)',
      measuredAr: `δ = ${skinDepthMm.toFixed(2)} mm عند ${fKhz} kHz`,
      measuredEn: `δ = ${skinDepthMm.toFixed(2)} mm at ${fKhz} kHz`,
      reasonAr:
        skinDepthMm < 0.75
          ? 'التردد مرتفع جداً؛ التيارات لا تصل للسطح الخارجي OD وتفقد العيوب العميقة.'
          : 'عمق الاختراق القياسي يغطي جدار الأنبوب بكفاءة.',
      reasonEn:
        skinDepthMm < 0.75
          ? 'Excessive frequency traps eddy currents near ID surface, missing OD pitting.'
          : 'Standard depth of penetration covers full tube wall cleanly.',
      remediationAr: `اضبط التردد الأساسي بالقرب من f₉₀ ≈ ${f90Khz} kHz.`,
      remediationEn: `Tune primary inspection frequency near f₉₀ ≈ ${f90Khz} kHz.`,
    },
    {
      codeId: 'iso_15548',
      standard: 'ISO 15548-3',
      clause: 'Phase Separation',
      titleAr: 'تحديد موقع العيب والتمييز عن ألواح التثبيت (Baffle)',
      titleEn: 'ID/OD Phase Separation & Baffle Discrimination',
      status:
        (isOd && phaseDeg >= 95) || (!isOd && phaseDeg <= 75) ? 'pass' : 'warn',
      limitAr: 'ID: 20°–75° · OD: 95°–168°',
      limitEn: 'ID: 20°–75° · OD: 95°–168°',
      measuredAr: `${phaseDeg}° (${isOd ? 'OD' : 'ID'})`,
      measuredEn: `${phaseDeg}° (${isOd ? 'OD' : 'ID'})`,
      reasonAr: 'فصل الطور بين عيوب الداخل ID والخارج OD وألواح الدعم واضح ومُعاير.',
      reasonEn: 'Phase separation cleanly distinguishes ID pitting, OD fretting, and support plates.',
      remediationAr: 'فعّل قناة المزج (Mix Channel) لإلغاء إشارة لوح التثبيت Baffle عند الفحص.',
      remediationEn: 'Use multi-frequency differential Mix channel to suppress support plate signals.',
    },
    {
      codeId: 'api_rp_572',
      standard: 'API RP 572',
      clause: 'Sec. 10.4 Tubing',
      titleAr: 'تقييم موثوقية حزمة الأنابيب وخطة التوقف',
      titleEn: 'Exchanger Bundle Reliability & Integrity Review',
      status: wallLossPct >= 55 ? 'reject' : wallLossPct >= 30 ? 'warn' : 'pass',
      limitAr: 'تآكل موضعي حاد < 55%',
      limitEn: 'Severe pitting < 55% WT',
      measuredAr: `${wallLossPct}% WT`,
      measuredEn: `${wallLossPct}% WT`,
      reasonAr:
        wallLossPct >= 55
          ? 'خطر ثقب قريب وتسرب بين موائع الغلاف والأنابيب؛ يتطلب فحصاً موسعاً للأنابيب المجاورة.'
          : 'مؤشر موثوقية الحزمة مستقر وفق API 572.',
      reasonEn:
        wallLossPct >= 55
          ? 'Imminent through-wall leak risk; expand 100% ET inspection to surrounding tubes.'
          : 'Bundle integrity remains within API 572 turnaround interval.',
      remediationAr: 'وسّع عينة الفحص لتشمل 100% من الأنابيب في نفس الممر (Pass) وقيم RFT للأنابيب الفيرومغناطيسية.',
      remediationEn: 'Expand scope to 100% of tubes in affected pass or switch to RFT for carbon steel.',
    },
  ];

  const counts = computeOverallStatus(clauses);
  return {
    methodId: 'et_rft',
    ...counts,
    metrics: [
      {
        id: 'skin_depth',
        labelAr: 'عمق الاختراق القشري (δ)',
        labelEn: 'Skin Depth (δ)',
        value: `${skinDepthMm.toFixed(2)} mm`,
        tone: skinDepthMm < 0.75 ? 'rose' : 'cyan',
      },
      {
        id: 'phase_angle',
        labelAr: 'زاوية الطور (Lissajous)',
        labelEn: 'Phase Angle (θ)',
        value: `${phaseDeg}°`,
        tone: 'amber',
      },
      {
        id: 'amplitude',
        labelAr: 'سعة المعاوقة (V_pp)',
        labelEn: 'Signal Amplitude',
        value: `${amplitudeV.toFixed(2)} V`,
        tone: wallLossPct >= 40 ? 'rose' : 'emerald',
      },
      {
        id: 'snr',
        labelAr: 'نسبة الإشارة للضوضاء',
        labelEn: 'Signal-to-Noise (SNR)',
        value: `${snrDb} dB`,
        tone: snrDb < 9.5 ? 'amber' : 'violet',
      },
    ],
    clauses,
    summaryAr:
      counts.overallStatus === 'pass'
        ? 'معايرة التيارات الدوامية سليمة وتآكل الجدار أقل من حد السد (40% TEMA).'
        : counts.overallStatus === 'warn'
        ? 'تآكل متوسط أو معامل امتلاء منخفض؛ يتطلب تعديل التردد أو وضع الأنبوب تحت المراقبة.'
        : 'مخالفة كود جسيمة: تآكل حرج يستوجب سد الأنبوب أو تردد غير كافٍ لاختراق الجدار.',
    summaryEn:
      counts.overallStatus === 'pass'
        ? 'ET calibration and tube wall integrity comply with ASME Sec. V Art. 8 and TEMA limits.'
        : counts.overallStatus === 'warn'
        ? 'Moderate wall loss or sub-optimal probe parameters; monitor or recalibrate.'
        : 'Code Reject: Tube meets plugging limit (≥40%) or insufficient skin penetration.',
    physicsFormulaAr: 'δ = 660 / √(f_Hz · %IACS)  |  Z = R + j·ωL  |  θ = arctan(ΔX_L / ΔR)',
    physicsFormulaEn: 'δ = 660 / √(f_Hz · %IACS)  |  Z = R + j·ωL  |  θ = arctan(ΔX_L / ΔR)',
    visualData: {
      frequencyKhz: fKhz,
      wallLossPct,
      isOd,
      phaseDeg,
      skinDepthMm: Number(skinDepthMm.toFixed(2)),
      amplitudeV,
      fillFactorPct,
    },
  };
}

function evaluateLtHydro(params: Record<string, number>): MissingNdtEvaluationResult {
  const mawpBar = params.mawpBar ?? 40;
  const appliedRatioPct = params.appliedRatioPct ?? 150;
  const dropPctHr = params.pressureDropPctHr ?? 0.2;
  const vacuumKpa = params.vacuumKpa ?? 28;

  const testPressureBar = Number(((mawpBar * appliedRatioPct) / 100).toFixed(1));
  const ug99RequiredBar = Number((1.3 * mawpBar).toFixed(1));
  const b313RequiredBar = Number((1.5 * mawpBar).toFixed(1));
  // Estimated equivalent Helium leak rate in atm*cc/s (log-scaled from dropPctHr)
  const heLeakRate =
    dropPctHr <= 0.05
      ? 2.4e-7
      : Number((dropPctHr * 3.5e-4).toExponential(1));

  const clauses: MissingNdtCodeClauseResult[] = [
    {
      codeId: 'asme_viii_ug99',
      standard: 'ASME Sec. VIII Div. 1',
      clause: 'UG-99(b) Hydro Test',
      titleAr: 'الضغط الهيدروستاتيكي القياسي لأوعية الضغط (≥ 1.3 × MAWP)',
      titleEn: 'Pressure Vessel Standard Hydrostatic Test (≥ 1.3 × MAWP)',
      status:
        appliedRatioPct < 130
          ? 'reject'
          : appliedRatioPct > 165
          ? 'warn'
          : 'pass',
      limitAr: `≥ ${ug99RequiredBar} bar (130% MAWP)`,
      limitEn: `≥ ${ug99RequiredBar} bar (130% MAWP)`,
      measuredAr: `${testPressureBar} bar (${appliedRatioPct}%)`,
      measuredEn: `${testPressureBar} bar (${appliedRatioPct}%)`,
      reasonAr:
        appliedRatioPct < 130
          ? 'ضغط الاختبار أقل من الحد الأدنى الإلزامي 1.3 × MAWP في UG-99.'
          : appliedRatioPct > 165
          ? 'ضغط زائد قد يسبب إجهاد خضوع محلي للأطراف (Over-pressurization warning).'
          : 'ضغط الاختبار الهيدروستاتيكي يحقق معامل أمان UG-99 بالكامل.',
      reasonEn:
        appliedRatioPct < 130
          ? 'Test pressure falls below mandatory ASME UG-99 minimum of 1.3 × MAWP.'
          : appliedRatioPct > 165
          ? 'Excessive test pressure risks localized yielding near nozzles.'
          : 'Hydrostatic test pressure satisfies ASME UG-99 structural margin.',
      remediationAr: 'ارفع ضغط المضخة الهيدروستاتيكية إلى 1.3× – 1.5× MAWP وثبّت لفترة التثبيت.',
      remediationEn: 'Adjust hydro pump target between 1.3× and 1.5× MAWP for hold duration.',
    },
    {
      codeId: 'asme_b313',
      standard: 'ASME B31.3',
      clause: '345.4.2 Piping Hydro',
      titleAr: 'ضغط اختبار الأنابيب الصناعية (1.5 × MAWP)',
      titleEn: 'Process Piping Hydrostatic Test (1.5 × Design)',
      status: appliedRatioPct < 150 ? 'reject' : dropPctHr > 0.3 ? 'reject' : 'pass',
      limitAr: `≥ ${b313RequiredBar} bar (150%) · ثبات دون تسرب (≤0.3%/hr)`,
      limitEn: `≥ ${b313RequiredBar} bar (150%) · Zero Visible Leakage (≤0.3%/hr)`,
      measuredAr: `${testPressureBar} bar · فقد ${dropPctHr.toFixed(1)}%/hr`,
      measuredEn: `${testPressureBar} bar · decay ${dropPctHr.toFixed(1)}%/hr`,
      reasonAr:
        appliedRatioPct < 150
          ? 'كود أنابيب العمليات B31.3 يشترط 1.5 × ضغط التصميم (أو 1.1 للتجربة الهوائية).'
          : dropPctHr > 0.3
          ? 'انخفاض الضغط أثناء فترة الثبات يشير لتسرب في الحشيات أو وصلات اللحام.'
          : 'ثبات كامل في مسجل الضغط Pressure Chart Recorder لمدة التثبيت.',
      reasonEn:
        appliedRatioPct < 150
          ? 'ASME B31.3 requires 1.5 × design pressure for hydrostatic piping tests.'
          : dropPctHr > 0.3
          ? 'Unexplained pressure decay indicates active flange or weld weepage.'
          : 'Strip chart recorder confirms zero-leak pressure hold.',
      remediationAr: 'افحص الوصلات بسائل الفقاعات، أعد ربط الفلانشات أو أصلح نقطة النضح وأعد الاختبار.',
      remediationEn: 'Inspect joints for weeping, re-torque flanges or repair weld pinhole, and retest.',
    },
    {
      codeId: 'asme_v_art10',
      standard: 'ASME Sec. V Art. 10',
      clause: 'App. II / IV / V',
      titleAr: 'حساسية صندوق التفريغ ومطياف كتلة الهيليوم',
      titleEn: 'Vacuum Box Differential & Mass Spec Leak Rate',
      status:
        vacuumKpa < 15 || dropPctHr > 0.6
          ? 'reject'
          : vacuumKpa < 20
          ? 'warn'
          : 'pass',
      limitAr: 'ΔP = 20–35 kPa · تسرب He ≤ 1×10⁻⁵ atm·cc/s',
      limitEn: 'ΔP = 20–35 kPa · He rate ≤ 1×10⁻⁵ atm·cc/s',
      measuredAr: `ΔP = ${vacuumKpa} kPa · He = ${heLeakRate}`,
      measuredEn: `ΔP = ${vacuumKpa} kPa · He = ${heLeakRate}`,
      reasonAr:
        vacuumKpa < 15
          ? 'الضغط التفريغي غير كافٍ لسحب فقاعات الصابون عبر المسامات الدقيقة.'
          : dropPctHr > 0.6
          ? 'معدل تسرب الهيليوم المكافئ يتجاوز حد الحساسية الكمي المسموح.'
          : 'فارق ضغط صندوق التفريغ وحساسية الكشف مطابقان لـ Art. 10.',
      reasonEn:
        vacuumKpa < 15
          ? 'Insufficient vacuum differential cannot nucleate soap bubbles through tight pores.'
          : dropPctHr > 0.6
          ? 'Equivalent tracer leak rate exceeds quantitative acceptance threshold.'
          : 'Vacuum differential and tracer sensitivity comply with Art. 10.',
      remediationAr: 'تأكد من إحكام حاشية المطاط لصندوق التفريغ وحقق 21–35 kPa (3–5 psi).',
      remediationEn: 'Reseat rubber seal gasket on vacuum box and maintain 21–35 kPa (3–5 psi).',
    },
    {
      codeId: 'api_653_12',
      standard: 'API 653',
      clause: 'Sec. 12.1.2 / 12.3',
      titleAr: 'اختبار لحامات قاع الخزانات بصندوق التفريغ 100%',
      titleEn: 'Storage Tank Bottom Weld Vacuum Box Exam',
      status:
        vacuumKpa < 20
          ? 'reject'
          : dropPctHr > 0.4
          ? 'reject'
          : 'pass',
      limitAr: '≥ 20 kPa (3 psi) لمده ≥ 5 ثوانٍ مع انعدام الفقاعات',
      limitEn: '≥ 20 kPa (3 psi) for ≥ 5s with Zero Soap Bubbles',
      measuredAr: `${vacuumKpa} kPa · تسرب ${dropPctHr > 0.4 ? 'مكتشف' : 'معدوم'}`,
      measuredEn: `${vacuumKpa} kPa · leak ${dropPctHr > 0.4 ? 'Detected' : 'None'}`,
      reasonAr:
        vacuumKpa < 20
          ? 'قاع الخزان في API 653 يلزم ألا يقل التفريغ عن 3 psi (20.7 kPa).'
          : 'قاع الخزان خالٍ من الثغور النافذة في منطقة الاختبار.',
      reasonEn:
        vacuumKpa < 20
          ? 'API 653 requires minimum 3 psi (20.7 kPa) differential across tank floor lap welds.'
          : 'Tank bottom lap welds show zero soap bubble formation.',
      remediationAr: 'امسح المنطقة بمحلول صابون خالٍ من الرغوة المفرطة وأعد الكشف لمدة 5 ثوانٍ متواصلة.',
      remediationEn: 'Apply calibrated surfactant film and hold ≥ 21 kPa for 5 seconds per overlap.',
    },
    {
      codeId: 'api_1104_hydro',
      standard: 'API 1104 / B31.8',
      clause: 'Linepipe Strength & Leak',
      titleAr: 'توافق خطوط الأنابيب البرية ومراقبة ثبات الضغط',
      titleEn: 'Cross-Country Pipeline Hydro Hold Verification',
      status: dropPctHr > 0.35 ? 'reject' : appliedRatioPct < 125 ? 'warn' : 'pass',
      limitAr: 'انخفاض ≤ 0.35%/hr بعد استقرار الحرارة',
      limitEn: 'Decay ≤ 0.35%/hr after thermal stabilization',
      measuredAr: `${dropPctHr.toFixed(1)}%/hr`,
      measuredEn: `${dropPctHr.toFixed(1)}%/hr`,
      reasonAr:
        dropPctHr > 0.35
          ? 'انخفاض الضغط يتجاوز حد استقرار الحرارة المسموح في مسجل الضغط.'
          : 'سجل ثبات الضغط مطابق لمتطلبات اختبارات الخطوط.',
      reasonEn:
        dropPctHr > 0.35
          ? 'Pressure drop exceeds thermal stabilization tolerance.'
          : 'Deadweight tester & chart verify pipeline strength hold.',
      remediationAr: 'استخرج الهواء المحبوس عبر صمامات التنفيس العليا (High-Point Vents) قبل البدء.',
      remediationEn: 'Bleed trapped air pockets at high-point vents prior to pressurization hold.',
    },
  ];

  const counts = computeOverallStatus(clauses);
  return {
    methodId: 'lt_hydro',
    ...counts,
    metrics: [
      {
        id: 'test_pressure',
        labelAr: 'ضغط الاختبار الفعلي',
        labelEn: 'Applied Test Pressure',
        value: `${testPressureBar} bar`,
        tone: appliedRatioPct < 130 ? 'rose' : 'cyan',
      },
      {
        id: 'pressure_drop',
        labelAr: 'معدل فقدان الضغط',
        labelEn: 'Pressure Decay Rate',
        value: `${dropPctHr.toFixed(1)}%/hr`,
        tone: dropPctHr > 0.3 ? 'rose' : 'emerald',
      },
      {
        id: 'vacuum_diff',
        labelAr: 'تفريغ الصندوق (ΔP)',
        labelEn: 'Vacuum Box ΔP',
        value: `${vacuumKpa} kPa`,
        tone: vacuumKpa < 20 ? 'amber' : 'violet',
      },
      {
        id: 'he_leak',
        labelAr: 'مكافئ تسرب الهيليوم',
        labelEn: 'He Mass Spec Rate',
        value: `${heLeakRate}`,
        tone: 'amber',
      },
    ],
    clauses,
    summaryAr:
      counts.overallStatus === 'pass'
        ? 'جميع اختبارات الضغط وصندوق التفريغ وحساسية الهيليوم مستوفية لمتطلبات الأكواد.'
        : counts.overallStatus === 'warn'
        ? 'تنبيه معايرة أو ضغط أعلى من المعتاد؛ راجع حدود الإجهاد وتفريغ الصندوق.'
        : 'مرفوض بالكود: قصور في ضغط الاختبار، وجود تسرب، أو تفريغ غير كافٍ.',
    summaryEn:
      counts.overallStatus === 'pass'
        ? 'Hydrostatic hold, vacuum differential, and leak sensitivity satisfy all 5 standards.'
        : counts.overallStatus === 'warn'
        ? 'Boundary condition warning: review over-pressure margin or vacuum differential.'
        : 'Code Reject: Insufficient test pressure, active pressure decay, or low vacuum ΔP.',
    physicsFormulaAr: 'P_hydro = 1.5 × MAWP × (S_test / S_design)  |  Q_leak = Δ(P·V) / Δt',
    physicsFormulaEn: 'P_hydro = 1.5 × MAWP × (S_test / S_design)  |  Q_leak = Δ(P·V) / Δt',
    visualData: {
      mawpBar,
      appliedRatioPct,
      testPressureBar,
      dropPctHr,
      vacuumKpa,
    },
  };
}

function evaluateTofd(params: Record<string, number>): MissingNdtEvaluationResult {
  const T = params.thicknessMm ?? 30;
  const pcs = params.pcsMm ?? 64;
  const d1 = Math.min(T - 2, params.flawTopDepthMm ?? 11);
  const h = Math.min(T - d1, params.flawHeightMm ?? 2.5);
  const d2 = Number((d1 + h).toFixed(2));
  const cL = 5.9; // Longitudinal wave in steel mm/us

  const sHalf = pcs / 2;
  const tLwUs = Number(((2 * sHalf) / cL).toFixed(2));
  const tBwUs = Number(((2 * Math.sqrt(sHalf * sHalf + T * T)) / cL).toFixed(2));
  const t1Us = Number(((2 * Math.sqrt(sHalf * sHalf + d1 * d1)) / cL).toFixed(2));
  const t2Us = Number(((2 * Math.sqrt(sHalf * sHalf + d2 * d2)) / cL).toFixed(2));

  // Lateral wave dead zone (high-frequency TOFD pulse resolution in mm depth)
  const deadZoneMm = Number(
    Math.max(1.5, Math.sqrt(Math.max(0, ((cL * (tLwUs + 0.07)) / 2) ** 2 - sHalf * sHalf))).toFixed(1)
  );
  // Optimal PCS for 60° longitudinal beam intersection at 2/3 T: PCS = 2 * (2/3 T) * tan(60°)
  const optimalPcsMm = Number((2 * (0.67 * T) * Math.tan((60 * Math.PI) / 180)).toFixed(0));
  const pcsRatio = pcs / Math.max(1, optimalPcsMm);
  const isSurfaceBreaking = d1 <= deadZoneMm;

  const clauses: MissingNdtCodeClauseResult[] = [
    {
      codeId: 'asme_v_art4_iii',
      standard: 'ASME Sec. V Art. 4',
      clause: 'App. III TOFD',
      titleAr: 'ضبط تباعد المجسين PCS والتغطية الهندسية للشعاع',
      titleEn: 'PCS Geometry & 2/3-T Beam Intersection',
      status:
        pcsRatio >= 0.72 && pcsRatio <= 1.38
          ? 'pass'
          : pcsRatio >= 0.55 && pcsRatio <= 1.65
          ? 'warn'
          : 'reject',
      limitAr: `PCS مثالي ≈ ${optimalPcsMm} mm (±35%)`,
      limitEn: `Optimal PCS ≈ ${optimalPcsMm} mm (±35%)`,
      measuredAr: `PCS = ${pcs} mm (منطقة ميتة ${deadZoneMm} mm)`,
      measuredEn: `PCS = ${pcs} mm (Dead zone ${deadZoneMm} mm)`,
      reasonAr:
        pcsRatio < 0.72 || pcsRatio > 1.38
          ? 'تباعد المجسين يبعد تقاطع الشعاع عن ثلثي السماكة 2/3T أو يوسع المنطقة الميتة.'
          : 'هندسة PCS تغطي الجدار مع تلاقي حاد للموجات المنفرجة.',
      reasonEn:
        pcsRatio < 0.72 || pcsRatio > 1.38
          ? 'PCS departs from 2/3-T beam intersection, increasing dead zone or losing tip sensitivity.'
          : 'PCS geometry maintains optimal 60° beam intersection at 2/3 T.',
      remediationAr: `اضبط تباعد PCS إلى ${optimalPcsMm} mm وأضف قناة PAUT تكميلية للمنطقة الميتة السطحية.`,
      remediationEn: `Set PCS near ${optimalPcsMm} mm and add supplementary PAUT/UT for dead zone coverage.`,
    },
    {
      codeId: 'asme_viii_app12',
      standard: 'ASME Sec. VIII',
      clause: 'Code Case 2235 / App. 12',
      titleAr: 'حدود القبول الكسرية لارتفاع العيب (Flaw Height / T)',
      titleEn: 'Fracture Mechanics Height/Thickness Acceptance',
      status: isSurfaceBreaking || h > T * 0.14 ? 'reject' : h > T * 0.08 ? 'warn' : 'pass',
      limitAr: `عيب باطني ≤ ${(T * 0.14).toFixed(1)} mm و d₁ > ${deadZoneMm} mm`,
      limitEn: `Subsurface ≤ ${(T * 0.14).toFixed(1)} mm & d₁ > ${deadZoneMm} mm`,
      measuredAr: `h = ${h.toFixed(1)} mm · d₁ = ${d1.toFixed(1)} mm`,
      measuredEn: `h = ${h.toFixed(1)} mm · d₁ = ${d1.toFixed(1)} mm`,
      reasonAr:
        isSurfaceBreaking
          ? 'الشرخ يكسر الموجة الجانبية السطحية (Surface-breaking flaw)؛ مرفوض قطعياً بالكود.'
          : h > T * 0.14
          ? 'الارتفاع العمودي للشرخ يتجاوز جدول القبول التابع لسماكة الجدار.'
          : 'العيوب الباطنية الصغيرة ضمن حدود جدول القبول الكسري.',
      reasonEn:
        isSurfaceBreaking
          ? 'Surface-breaking indication disrupts lateral wave; strictly rejected.'
          : h > T * 0.14
          ? 'Through-wall height exceeds ASME App. 12 / Code Case 2235 limits.'
          : 'Embedded flaw height satisfies fracture-mechanics table.',
      remediationAr: 'افتح قناة لحام موضعية (Gouge & Repair) وأعد الفحص بـ TOFD + PAUT بعد الإصلاح.',
      remediationEn: 'Excavate defect, reweld under qualified WPS, and re-scan with TOFD + PAUT.',
    },
    {
      codeId: 'iso_10863',
      standard: 'ISO 10863',
      clause: 'Testing Level B / C',
      titleAr: 'استبانة السطح الميت وقراءة انعكاس الطور (180° Phase Shift)',
      titleEn: 'Lateral Wave Dead Zone & 180° Phase Reversal Sizing',
      status: deadZoneMm <= 4.2 ? 'pass' : 'warn',
      limitAr: 'عمق المنطقة الميتة للسطح العلوي ≤ 4.2 mm',
      limitEn: 'Lateral wave dead zone ≤ 4.2 mm',
      measuredAr: `${deadZoneMm} mm`,
      measuredEn: `${deadZoneMm} mm`,
      reasonAr:
        deadZoneMm > 4.2
          ? 'المنطقة الميتة أعمق من 4.2 mm مما يستوجب مسحاً إضافياً بمجسات سطحية أو زاوية عالية.'
          : 'جودة فصل الطور بين الطرف العلوي (موجب) والسفلي (سالب) واضحة.',
      reasonEn:
        deadZoneMm > 4.2
          ? 'Near-surface dead zone exceeds 4.2 mm; add creeping wave or PAUT surface pass.'
          : 'Clear 180° phase reversal observed between top and bottom diffraction tips.',
      remediationAr: 'استخدم مسبار 10 MHz قصير النبضة أو قلّل الـ PCS لتقليص المنطقة الميتة.',
      remediationEn: 'Use higher-frequency 10 MHz damped transducer or tighten PCS.',
    },
    {
      codeId: 'iso_15626',
      standard: 'ISO 15626',
      clause: 'Level 1 / 2 TOFD',
      titleAr: 'تقييم الارتفاع المسموح (Level 2 = 0.2T حد أقصى)',
      titleEn: 'ISO 15626 Acceptance Level 2 Flaw Sizing',
      status: h > Math.min(4.0, T * 0.15) || isSurfaceBreaking ? 'reject' : 'pass',
      limitAr: `مقدار الارتفاع h ≤ ${Math.min(4.0, T * 0.15).toFixed(1)} mm`,
      limitEn: `Height h ≤ ${Math.min(4.0, T * 0.15).toFixed(1)} mm`,
      measuredAr: `h = ${h.toFixed(1)} mm`,
      measuredEn: `h = ${h.toFixed(1)} mm`,
      reasonAr: 'المقارنة المباشرة بين الارتفاع المقاس وحدود المستوى الثاني ISO 15626.',
      reasonEn: 'Direct height comparison against ISO 15626 Quality Level 2.',
      remediationAr: 'أجرِ تقييماً ثانوياً باللحام أو طبق تحليل ECA الهندسي الحرج.',
      remediationEn: 'Repair weld or perform Engineering Critical Assessment (ECA).',
    },
    {
      codeId: 'aws_d11_tofd',
      standard: 'AWS D1.1',
      clause: 'Cl. 8 Part F (Alt UT)',
      titleAr: 'التحقق من المسح الآلي وإرفاق خريطة D-Scan',
      titleEn: 'Encoded D-Scan Recording & Flaw Sizing',
      status: h > 3.5 || isSurfaceBreaking ? 'reject' : 'pass',
      limitAr: 'حجم مدمج غير متصل بالسطح · h ≤ 3.5 mm',
      limitEn: 'Non-surface-connected planar height ≤ 3.5 mm',
      measuredAr: `d₁=${d1.toFixed(1)}mm · Δt=${(t2Us - t1Us).toFixed(2)} µs`,
      measuredEn: `d₁=${d1.toFixed(1)}mm · Δt=${(t2Us - t1Us).toFixed(2)} µs`,
      reasonAr: 'سجل التحجيم الزمني Δt يحقق دقة AWS D1.1 Cl. 8 الملحقة.',
      reasonEn: 'Encoded Δt tip separation achieves sub-millimeter through-wall sizing.',
      remediationAr: 'وثق صورة الـ D-Scan الرمادية ومواقع المؤشرات العلوية والسفلية في التقرير.',
      remediationEn: 'Archive grayscale D-Scan strip with upper/lower cursor delta markers.',
    },
  ];

  const counts = computeOverallStatus(clauses);
  return {
    methodId: 'tofd',
    ...counts,
    metrics: [
      {
        id: 't_lw',
        labelAr: 'زمن الموجة الجانبية (LW)',
        labelEn: 'Lateral Wave Time',
        value: `${tLwUs} µs`,
        tone: 'cyan',
      },
      {
        id: 'tip_delta_t',
        labelAr: 'فرق زمن الحيود (Δt)',
        labelEn: 'Tip Delta Time (Δt)',
        value: `${(t2Us - t1Us).toFixed(2)} µs`,
        tone: 'amber',
      },
      {
        id: 'flaw_height',
        labelAr: 'ارتفاع العيب المحسوب (h)',
        labelEn: 'Sized Height (h)',
        value: `${h.toFixed(1)} mm`,
        tone: h > 3.5 || isSurfaceBreaking ? 'rose' : 'emerald',
      },
      {
        id: 'dead_zone',
        labelAr: 'سمك المنطقة الميتة',
        labelEn: 'Surface Dead Zone',
        value: `${deadZoneMm} mm`,
        tone: deadZoneMm > 4.2 ? 'amber' : 'violet',
      },
    ],
    clauses,
    summaryAr:
      counts.overallStatus === 'pass'
        ? 'ضبط PCS والمؤشرات الزمنية TOFD مثالي والعيوب ضمن حدود القبول الكسري.'
        : counts.overallStatus === 'warn'
        ? 'المنطقة الميتة أو الـ PCS قريب من الحد؛ يُنصح بدعم الفحص بمسح PAUT سطحي.'
        : 'مخالفة كود: شرخ واصل للسطح (Lateral Wave Break) أو ارتفاع يتجاوز حد الكود.',
    summaryEn:
      counts.overallStatus === 'pass'
        ? 'TOFD PCS geometry calibrated and through-wall sizing within acceptance limits.'
        : counts.overallStatus === 'warn'
        ? 'Dead zone or PCS near limit; add supplementary surface UT/PAUT pass.'
        : 'Code Reject: Surface-breaking crack or excessive through-wall height.',
    physicsFormulaAr: 'd = ½·√((c_L·t)² - PCS²)  |  h = d₂ - d₁  |  PCS_opt ≈ 1.34·T·tan(60°)',
    physicsFormulaEn: 'd = ½·√((c_L·t)² - PCS²)  |  h = d₂ - d₁  |  PCS_opt ≈ 1.34·T·tan(60°)',
    visualData: {
      thicknessMm: T,
      pcsMm: pcs,
      d1,
      d2,
      h,
      tLwUs,
      t1Us,
      t2Us,
      tBwUs,
      deadZoneMm,
      isSurfaceBreaking,
    },
  };
}

function evaluateMflApiFfs(params: Record<string, number>): MissingNdtEvaluationResult {
  const tMin = params.nominalThickMm ?? 6.5;
  const tActual = params.actualThickMm ?? 8.6;
  const cr = params.corrosionRateMmYr ?? 0.25;
  const mflLossPct = params.mflLossPct ?? 25;

  const allowanceMm = Number((tActual - tMin).toFixed(2));
  const remainingLifeYr =
    allowanceMm <= 0 ? 0 : Number((allowanceMm / Math.max(0.01, cr)).toFixed(1));
  const nextIntervalYr = Number(Math.min(10, Math.max(0, 0.5 * remainingLifeYr)).toFixed(1));
  // Simplified API 579-1 Level 1 RSF estimation from wall loss ratio
  const rsf = Number(Math.max(0.35, 1 - (mflLossPct / 100) * 0.45 * (tActual < tMin ? 1.45 : 0.7)).toFixed(2));

  const clauses: MissingNdtCodeClauseResult[] = [
    {
      codeId: 'api_653',
      standard: 'API 653',
      clause: 'Sec. 4.4 Tank Bottom',
      titleAr: 'سماكة قاع الخزان المتبقية وماسح MFL',
      titleEn: 'Tank Floor Minimum Thickness & MFL Proving',
      status: tActual < 2.5 || mflLossPct >= 65 ? 'reject' : mflLossPct >= 40 ? 'warn' : 'pass',
      limitAr: 't_actual ≥ 2.5 mm · فقد MFL < 65%',
      limitEn: 't_actual ≥ 2.5 mm · MFL loss < 65%',
      measuredAr: `${tActual.toFixed(1)} mm · MFL ${mflLossPct}%`,
      measuredEn: `${tActual.toFixed(1)} mm · MFL ${mflLossPct}%`,
      reasonAr:
        tActual < 2.5 || mflLossPct >= 65
          ? 'اقتربت الحفرة من حد الثقب (API 653 2.5mm minimum floor)؛ يجب تركيب رقعة لحام.'
          : 'تم التحقق بالـ UT اليدوي المعاير لإشارات الماسح المغناطيسي MFL.',
      reasonEn:
        tActual < 2.5 || mflLossPct >= 65
          ? 'Floor pit approaches 2.5 mm minimum threshold; patch plate repair mandatory.'
          : 'MFL indications proved by calibrated 0° UT A-scan.',
      remediationAr: 'ركّب رقعة فولاذية (Lap-Welded Patch Plate) واختبر لحاماتها بصندوق التفريغ.',
      remediationEn: 'Install lap-welded floor patch plate and vacuum-box test perimeter.',
    },
    {
      codeId: 'api_510',
      standard: 'API 510',
      clause: 'Sec. 6.4 / 7.1 RL',
      titleAr: 'فترة الفحص القادمة ونصف العمر المتبقي لأوعية الضغط',
      titleEn: 'Pressure Vessel Half-Life Interval (min 0.5·RL, 10 yr)',
      status: tActual < tMin ? 'reject' : remainingLifeYr < 4 ? 'warn' : 'pass',
      limitAr: 't_actual ≥ t_min · العمر المتبقي ≥ 4 سنوات',
      limitEn: 't_actual ≥ t_min · Remaining Life ≥ 4 yrs',
      measuredAr: `RL = ${remainingLifeYr} yr · فاصل ${nextIntervalYr} yr`,
      measuredEn: `RL = ${remainingLifeYr} yr · Next ${nextIntervalYr} yr`,
      reasonAr:
        tActual < tMin
          ? 'السماكة الفعلية أقل من t_min التصميمية؛ يُمنع التشغيل دون تقييم API 579 أو إصلاح.'
          : `يُلزم API 510 بتعيين الفحص القادم بعد ${nextIntervalYr} سنوات (نصف العمر المتبقي).`,
      reasonEn:
        tActual < tMin
          ? 'Actual thickness is below t_min; vessel is unfit for design MAWP without FFS/repair.'
          : `API 510 caps external/internal interval at ${nextIntervalYr} yrs (half remaining life).`,
      remediationAr: 'أعد حساب MAWP المخفض أو نفّذ لحام تكسية (Weld Overlay) لتعويض السماكة.',
      remediationEn: 'Re-rate vessel MAWP or restore thickness via qualified weld buildup.',
    },
    {
      codeId: 'api_570',
      standard: 'API 570',
      clause: 'Sec. 6.3 / 7.1 Piping',
      titleAr: 'معدل التآكل وفحص نقاط قياس السماكة TMLs للأنابيب',
      titleEn: 'Process Piping Corrosion Rate & TML Scheduling',
      status: cr > 0.75 || tActual < tMin ? 'reject' : cr > 0.4 ? 'warn' : 'pass',
      limitAr: 'معدل تآكل مستقر (CR ≤ 0.75 mm/yr) · t ≥ t_min',
      limitEn: 'Controlled Corrosion Rate ≤ 0.75 mm/yr · t ≥ t_min',
      measuredAr: `CR = ${cr.toFixed(2)} mm/yr`,
      measuredEn: `CR = ${cr.toFixed(2)} mm/yr`,
      reasonAr:
        cr > 0.75
          ? 'تآكل نشط متسارع يتطلب تغيير حقن المثبطات الكيميائية وإضافة نقاط TML.'
          : 'معدل التآكل ضمن النطاق المحسوب لشبكة الأنابيب.',
      reasonEn:
        cr > 0.75
          ? 'Accelerated corrosion rate requires inhibitor adjustment and additional TMLs.'
          : 'Short/long-term corrosion rate remains controlled.',
      remediationAr: 'فعّل مراقبة التآكل بالموجات الموجهة / B-Scan عند نقاط الحقن والأكواع.',
      remediationEn: 'Increase UT B-scan density at injection points and elbows.',
    },
    {
      codeId: 'api_579_ffs',
      standard: 'API 579-1 / ASME FFS-1',
      clause: 'Part 4 / 5 Metal Loss',
      titleAr: 'معامل القوة المتبقية (RSF ≥ 0.90) للمعدات المعيبة',
      titleEn: 'Fitness-for-Service Remaining Strength Factor (RSF)',
      status: rsf < 0.9 ? 'reject' : rsf < 0.94 ? 'warn' : 'pass',
      limitAr: 'RSF ≥ 0.90 للقبول في الخدمة (Allowable RSFa = 0.90)',
      limitEn: 'RSF ≥ 0.90 (Allowable RSFa)',
      measuredAr: `RSF = ${rsf.toFixed(2)}`,
      measuredEn: `RSF = ${rsf.toFixed(2)}`,
      reasonAr:
        rsf < 0.9
          ? 'معامل القوة المتبقية أقل من 0.90؛ المعدة غير صالحة عند الضغط التصميمي الحالي.'
          : 'معامل القوة المتبقية RSF يحقق شرط الصلاحية للخدمة المستوى الأول/الثاني.',
      reasonEn:
        rsf < 0.9
          ? 'RSF falls below 0.90; component requires repair or MAWP derating.'
          : 'Component passes API 579-1 Remaining Strength Factor screening.',
      remediationAr: 'طبق Level 2 FFS مع تقليل ضغط التشغيل المسموح MAWP_r أو تركيب غلاف مركب.',
      remediationEn: 'Compute Level 2 rerated MAWP_r or apply engineered composite wrap repair.',
    },
    {
      codeId: 'asme_b31g',
      standard: 'ASME B31G',
      clause: 'Modified B31G (0.85 d/t)',
      titleAr: 'تقييم التآكل الموضعي على خطوط الأنابيب المضغوطة',
      titleEn: 'Modified B31G Pipeline Metal-Loss Assessment',
      status: mflLossPct >= 80 || tActual < tMin ? 'reject' : mflLossPct >= 50 ? 'warn' : 'pass',
      limitAr: 'العمق الموضعي < 80% WT والسماكة المتبقية ≥ t_min',
      limitEn: 'Local pit depth < 80% WT & t_actual ≥ t_min',
      measuredAr: `فقد ${mflLossPct}% · فائض ${allowanceMm.toFixed(1)} mm`,
      measuredEn: `Loss ${mflLossPct}% · Margin ${allowanceMm.toFixed(1)} mm`,
      reasonAr: 'المعامل الهندسي للانتفاخ M يعكس هامش الأمان الهيدروليكي للأنبوب.',
      reasonEn: 'Folias bulging factor evaluation confirms remaining burst margin.',
      remediationAr: 'ركّب طوق إصلاح نوع B (Type-B Full Encirclement Sleeve) إذا تجاوز العمق 50%.',
      remediationEn: 'Install Type-B full-encirclement steel sleeve where pit depth exceeds 50%.',
    },
  ];

  const counts = computeOverallStatus(clauses);
  return {
    methodId: 'mfl_api_ffs',
    ...counts,
    metrics: [
      {
        id: 'allowance',
        labelAr: 'هامش السماكة المتبقية',
        labelEn: 'Corrosion Allowance Left',
        value: `${allowanceMm >= 0 ? '+' : ''}${allowanceMm.toFixed(1)} mm`,
        tone: allowanceMm < 0 ? 'rose' : 'emerald',
      },
      {
        id: 'rem_life',
        labelAr: 'العمر المتبقي (RL)',
        labelEn: 'Remaining Life (RL)',
        value: `${remainingLifeYr} yr`,
        tone: remainingLifeYr < 4 ? 'rose' : 'cyan',
      },
      {
        id: 'next_insp',
        labelAr: 'موعد الفحص القادم',
        labelEn: 'Next Inspection (0.5 RL)',
        value: `${nextIntervalYr} yr`,
        tone: 'amber',
      },
      {
        id: 'rsf',
        labelAr: 'معامل القوة API 579 (RSF)',
        labelEn: 'API 579 RSF',
        value: rsf.toFixed(2),
        tone: rsf < 0.9 ? 'rose' : 'violet',
      },
    ],
    clauses,
    summaryAr:
      counts.overallStatus === 'pass'
        ? 'نتائج MFL والسماكة المتبقية والعمر التشغيلي مطابقة لكافة أكواد API و FFS.'
        : counts.overallStatus === 'warn'
        ? 'بداية استنزاف سماحية التآكل أو إشارة MFL متوسطة؛ تقليص فترة الفحص الدورية.'
        : 'مخالفة كود حرجة: السماكة دون t_min أو معامل القوة RSF < 0.90 — يتطلب إصلاحاً فورياً.',
    summaryEn:
      counts.overallStatus === 'pass'
        ? 'MFL floor map, remaining life, and RSF satisfy all API 510/570/653/579 codes.'
        : counts.overallStatus === 'warn'
        ? 'Moderate corrosion loss; shorten inspection interval and prove MFL pits via UT.'
        : 'Code Reject: Wall below t_min or RSF < 0.90; repair or derate equipment immediately.',
    physicsFormulaAr: 'RL = (t_actual - t_min) / CR  |  Interval = min(0.5·RL, 10 yr)  |  RSF ≥ 0.90',
    physicsFormulaEn: 'RL = (t_actual - t_min) / CR  |  Interval = min(0.5·RL, 10 yr)  |  RSF ≥ 0.90',
    visualData: {
      tMin,
      tActual,
      cr,
      mflLossPct,
      remainingLifeYr,
      nextIntervalYr,
      rsf,
    },
  };
}

function evaluateCoatingHoliday(params: Record<string, number>): MissingNdtEvaluationResult {
  const steelTempC = params.steelTempC ?? 26;
  const rh = params.relHumidityPct ?? 62;
  const dftUm = params.measuredDftUm ?? 260;
  const saltMgM2 = params.saltMgM2 ?? 25;

  // Approximate ambient air temp close to substrate -1.5°C for realistic dew-point stress test
  const airTempC = steelTempC - 1.5;
  // Magnus formula for Dew Point Td
  const a = 17.625;
  const b = 243.04;
  const gamma = Math.log(rh / 100) + (a * airTempC) / (b + airTempC);
  const dewPointC = Number(((b * gamma) / (a - gamma)).toFixed(1));
  const deltaT = Number((steelTempC - dewPointC).toFixed(1));

  // NACE SP0188 high-voltage DC holiday spark formula: V ≈ 250 * sqrt(DFT_um) (or 3294 for thick epoxy)
  const holidayVoltageV = Math.round(250 * Math.sqrt(dftUm));
  const targetMinDftUm = 250;
  const singleSpot80Pct = Number((dftUm * 0.85).toFixed(0));

  const clauses: MissingNdtCodeClauseResult[] = [
    {
      codeId: 'iso_8502_dew',
      standard: 'ISO 8502-4 / SSPC',
      clause: 'Dew Point Spread ΔT ≥ 3°C',
      titleAr: 'شرط الرطوبة النسبية وفارق نقطة الندى قبل الطلاء',
      titleEn: 'Psychrometric Dew Point Margin (ΔT ≥ 3°C) & RH ≤ 85%',
      status: deltaT < 3.0 || rh > 85 ? 'reject' : deltaT < 4.5 ? 'warn' : 'pass',
      limitAr: 'T_steel - T_dew ≥ 3.0°C · الرطوبة ≤ 85%',
      limitEn: 'ΔT ≥ 3.0°C · RH ≤ 85%',
      measuredAr: `ΔT = ${deltaT.toFixed(1)}°C (Td = ${dewPointC}°C) · RH ${rh}%`,
      measuredEn: `ΔT = ${deltaT.toFixed(1)}°C (Td = ${dewPointC}°C) · RH ${rh}%`,
      reasonAr:
        deltaT < 3.0 || rh > 85
          ? 'خطر تكثف رطوبة خفية على المعدن المسفوع؛ يُحظر السفع أو الطلاء فوراً.'
          : 'الظروف المناخية جافة وآمنة لبدء السفع وتطبيق طبقات الإيبوكسي.',
      reasonEn:
        deltaT < 3.0 || rh > 85
          ? 'Flash rusting & osmotic blistering risk! Blast/coating prohibited when ΔT < 3°C or RH > 85%.'
          : 'Substrate temperature maintains safe ≥ 3°C buffer above dew point.',
      remediationAr: 'أوقف الطلاء وشغّل مزيلات الرطوبة (Dehumidifiers) وسخانات التدفئة الموضعية.',
      remediationEn: 'Halt coating application and run enclosure dehumidifiers/heaters until ΔT ≥ 3°C.',
    },
    {
      codeId: 'sspc_pa2',
      standard: 'SSPC-PA 2',
      clause: 'Level 3 (±20% / 80% Spot)',
      titleAr: 'سماكة الطلاء الجاف DFT وقاعدة الـ 80% الأدنى',
      titleEn: 'Dry Film Thickness (DFT) Target & 80% Spot Rule',
      status:
        dftUm < targetMinDftUm * 0.8 || dftUm > 460
          ? 'reject'
          : dftUm < targetMinDftUm
          ? 'warn'
          : 'pass',
      limitAr: `متوسط ≥ ${targetMinDftUm} µm · أدنى نقطة ≥ 200 µm · أقصى ≤ 460 µm`,
      limitEn: `Avg ≥ ${targetMinDftUm} µm · Min Spot ≥ 200 µm · Max ≤ 460 µm`,
      measuredAr: `متوسط ${dftUm} µm (أدنى نقطة ${singleSpot80Pct} µm)`,
      measuredEn: `Avg ${dftUm} µm (min spot ${singleSpot80Pct} µm)`,
      reasonAr:
        dftUm < targetMinDftUm * 0.8
          ? 'نقص حاد في سماكة الحاجز؛ الطلاء معرض للنفاذية والصدأ المبكر.'
          : dftUm > 460
          ? 'سماكة مفرطة تسبب تشقق الطين (Mud-cracking) واحتباس المذيبات.'
          : 'توزيع الـ 5 نقاط مطابق لـ SSPC-PA 2 Level 3.',
      reasonEn:
        dftUm < targetMinDftUm * 0.8
          ? 'Under-thickness violates barrier protection; apply additional coat.'
          : dftUm > 460
          ? 'Excessive DFT induces mud-cracking and solvent entrapment.'
          : 'Spot & gauge averages comply with SSPC-PA 2.',
      remediationAr: 'صنفر النقاط ناقصة السماكة (Sweep Blast/Sand) وأضف طبقة معالجة تجميلية.',
      remediationEn: 'Feather/abrade low-DFT zones and apply touch-up stripe/build coat.',
    },
    {
      codeId: 'nace_sp0188',
      standard: 'NACE SP0188',
      clause: 'High-Voltage Holiday',
      titleAr: 'معايرة جهد اختبار الشرارة لكشف الثقوب الدقيقة (Pinholes)',
      titleEn: 'Holiday Spark Voltage Calibration (V = 250·√DFT)',
      status:
        holidayVoltageV < 1800
          ? 'warn'
          : holidayVoltageV > 5600
          ? 'warn'
          : 'pass',
      limitAr: 'جهد معاير للسمك بدون إحراق العازل',
      limitEn: 'Calibrated DC voltage without dielectric burn-through',
      measuredAr: `${holidayVoltageV} V DC (${dftUm} µm)`,
      measuredEn: `${holidayVoltageV} V DC (${dftUm} µm)`,
      reasonAr:
        'الجهد المحسوب يكشف أي ثقب إبرة أو فراغ بالفيلم الجاف دون إتلاف طبقة الطلاء السليمة.',
      reasonEn:
        'Calculated DC voltage reliably sparks through pinholes without dielectric breakdown.',
      remediationAr: 'استخدم مقياس جهد معاير (Jeep Meter) ومرر الفرشاة النحاسية بسرعة ≤ 0.3 m/s.',
      remediationEn: 'Verify brush voltage with Jeep meter and sweep at ≤ 0.3 m/s.',
    },
    {
      codeId: 'iso_8502_6',
      standard: 'ISO 8502-6 / 8502-9',
      clause: 'Bresle Soluble Salts',
      titleAr: 'اختبار الأملاح الذائبة قبل السفع النهائي',
      titleEn: 'Soluble Chloride Contamination (Bresle Patch)',
      status: saltMgM2 > 50 ? 'reject' : saltMgM2 > 35 ? 'warn' : 'pass',
      limitAr: '≤ 50 mg/m² (لخزانات الغمر ≤ 35 mg/m²)',
      limitEn: '≤ 50 mg/m² (Immersion ≤ 35 mg/m²)',
      measuredAr: `${saltMgM2} mg/m²`,
      measuredEn: `${saltMgM2} mg/m²`,
      reasonAr:
        saltMgM2 > 50
          ? 'أملاح كلوريد عالية تسبب تقرحات أسموزية (Osmotic Blistering) وفصل الطلاء.'
          : 'مستوى نظافة السطح الكيميائي آمن ومطابق لمواصفات الغمر.',
      reasonEn:
        saltMgM2 > 50
          ? 'High soluble salt count triggers osmotic blistering under immersion.'
          : 'Low ionic contamination verified by Bresle conductivity patch.',
      remediationAr: 'اغسل السطح بماء عذب عالي الضغط (UHP Fresh Water Wash) وأعد قياس Bresle.',
      remediationEn: 'Perform high-pressure fresh water wash and retest Bresle conductivity.',
    },
    {
      codeId: 'astm_d4417',
      standard: 'ASTM D4417 / ISO 8501-1',
      clause: 'Sa 2½ · 50–75 µm Profile',
      titleAr: 'نظافة السفع وخشونة الترابط الميكانيكي (Anchor Profile)',
      titleEn: 'Blast Cleanliness Sa 2½ & Replica Tape Anchor Profile',
      status: dftUm >= 200 && saltMgM2 <= 50 ? 'pass' : 'warn',
      limitAr: 'درجة السفع Sa 2½ · خشونة 50–75 µm بشريط Testex',
      limitEn: 'Sa 2½ Near-White Blast · 50–75 µm Replica Tape',
      measuredAr: `نسبة السماكة/الخشونة ${(dftUm / 62).toFixed(1)}×`,
      measuredEn: `DFT/Profile ratio ${(dftUm / 62).toFixed(1)}×`,
      reasonAr: 'عمق الخشونة يضمن التماسك الميكانيكي للطلاء دون بروز قمم معدنية (Rogue Peaks).',
      reasonEn: 'Coat build provides safe >3× coverage over 62 µm blast anchor peaks.',
      remediationAr: 'وثق 3 قراءات بشريط Press-O-Film وألصقها في تقرير مراقبة الجودة.',
      remediationEn: 'Retain Press-O-Film replica tapes inside coating QA dossier.',
    },
  ];

  const counts = computeOverallStatus(clauses);
  return {
    methodId: 'coating_holiday',
    ...counts,
    metrics: [
      {
        id: 'dew_spread',
        labelAr: 'فارق نقطة الندى (ΔT)',
        labelEn: 'Dew Point Spread (ΔT)',
        value: `${deltaT.toFixed(1)}°C`,
        tone: deltaT < 3.0 ? 'rose' : 'emerald',
      },
      {
        id: 'dft_avg',
        labelAr: 'متوسط سماكة DFT',
        labelEn: 'Measured Avg DFT',
        value: `${dftUm} µm`,
        tone: dftUm < 200 || dftUm > 460 ? 'rose' : 'cyan',
      },
      {
        id: 'holiday_v',
        labelAr: 'جهد الشرارة NACE',
        labelEn: 'Holiday Spark Voltage',
        value: `${holidayVoltageV} V`,
        tone: 'amber',
      },
      {
        id: 'salt',
        labelAr: 'ملوحة بريسيل',
        labelEn: 'Bresle Salt Level',
        value: `${saltMgM2} mg/m²`,
        tone: saltMgM2 > 50 ? 'rose' : 'violet',
      },
    ],
    clauses,
    summaryAr:
      counts.overallStatus === 'pass'
        ? 'البيئة المناخية، سماكة DFT، الملوحة، وجهد الهوليداي مطابقة بالكامل لأكواد الطلاء.'
        : counts.overallStatus === 'warn'
        ? 'انحراف طفيف في السماكة أو رطوبة قريبة من الحد؛ يتطلب معالجة جزئية.'
        : 'مخالفة كود: نقطة الندى < 3°C أو ملوحة بريسيل عالية أو سماكة خارج SSPC-PA 2.',
    summaryEn:
      counts.overallStatus === 'pass'
        ? 'Psychrometrics, SSPC-PA 2 DFT, Bresle salts, and holiday voltage comply cleanly.'
        : counts.overallStatus === 'warn'
        ? 'Marginal DFT or humidity buffer; adjust coat thickness or climate control.'
        : 'Code Reject: Dew point violation (ΔT < 3°C), excessive salts, or out-of-spec DFT.',
    physicsFormulaAr: 'ΔT = T_steel - T_dew ≥ 3°C  |  V_holiday = 250·√(DFT_µm)  |  SSPC-PA 2 ≥ 80% min',
    physicsFormulaEn: 'ΔT = T_steel - T_dew ≥ 3°C  |  V_holiday = 250·√(DFT_µm)  |  SSPC-PA 2 ≥ 80% min',
    visualData: {
      steelTempC,
      dewPointC,
      deltaT,
      rh,
      dftUm,
      holidayVoltageV,
      saltMgM2,
    },
  };
}

function evaluatePmiHardness(params: Record<string, number>): MissingNdtEvaluationResult {
  const cr = params.chromiumPct ?? 2.25;
  const mo = params.molybdenumPct ?? 1.0;
  const hv = params.hazHardnessHv ?? 218;
  const ce = params.carbonEq ?? 0.41;

  // Approximate HRC from HV10 above 230 HV
  const hrcApprox = hv >= 235 ? Number(((hv - 120) / 5.9).toFixed(1)) : Number(((hv - 130) / 5.8).toFixed(1));
  const hbwApprox = Math.round(hv * 0.95);

  // Closest target alloy identification based on Cr% / Mo%
  let detectedAlloy = 'P22 (2.25Cr-1Mo)';
  let alloyMismatch = false;
  if (cr < 0.45 && mo < 0.15) {
    detectedAlloy = 'Carbon Steel (A106 Gr.B)';
    alloyMismatch = true; // Assuming P22/alloy service verification scenario unless low-Cr intended
  } else if (cr >= 0.9 && cr <= 1.55 && mo >= 0.4 && mo <= 0.7) {
    detectedAlloy = 'P11 (1.25Cr-0.5Mo)';
  } else if (cr >= 1.9 && cr <= 2.65 && mo >= 0.85 && mo <= 1.2) {
    detectedAlloy = 'P22 (2.25Cr-1Mo)';
  } else if (cr >= 8.0 && cr <= 9.6 && mo >= 0.85 && mo <= 1.15) {
    detectedAlloy = 'P91 (9Cr-1Mo-V)';
  } else if (cr >= 16.0 && cr <= 19.0 && mo >= 1.8) {
    detectedAlloy = 'SS 316L (17Cr-12Ni-2.5Mo)';
  } else {
    detectedAlloy = `Mixed / Off-Spec (${cr.toFixed(1)}Cr-${mo.toFixed(2)}Mo)`;
    alloyMismatch = true;
  }

  const clauses: MissingNdtCodeClauseResult[] = [
    {
      codeId: 'api_rp_578',
      standard: 'API RP 578',
      clause: 'Sec. 4 / 6 Mix-Up',
      titleAr: 'كشف خلط السبائك والتحقق الإيجابي من الهوية (PMI)',
      titleEn: 'Material Verification Program & Alloy Mix-Up Prevention',
      status: alloyMismatch ? 'reject' : 'pass',
      limitAr: 'تطابق سبيكة Cr-Mo المعتمدة دون استبدال بكربون ستيل',
      limitEn: 'Matches specified Cr-Mo/Stainless grade; zero CS mix-up',
      measuredAr: `${detectedAlloy}`,
      measuredEn: `${detectedAlloy}`,
      reasonAr:
        alloyMismatch
          ? 'تحذير خلط سبائك! التركيب الكيميائي لا يطابق عائلة السبائك المقاومة للحرارة أو التآكل.'
          : 'بصمة الـ XRF تؤكد تطابق سبيكة الوصلة ومعدن الأساس بالكامل.',
      reasonEn:
        alloyMismatch
          ? 'Critical alloy mix-up detected! Measured Cr/Mo fails material specification.'
          : 'XRF elemental fingerprint positively verifies specified alloy grade.',
      remediationAr: 'اعزل الوصلة المرفوضة فوراً، وسّع الفحص 100% للدفعة، واستبدل القطعة أو سلك اللحام.',
      remediationEn: 'Quarantine non-conforming spool, expand PMI to 100% of heat lot, and replace.',
    },
    {
      codeId: 'astm_e1476',
      standard: 'ASTM E1476',
      clause: 'XRF Precision',
      titleAr: 'دقة المطياف المحمول ونسبة الموليبدينوم والكروم',
      titleEn: 'Handheld XRF Calibration & Elemental Verification',
      status: cr >= 0.9 && mo >= 0.4 ? 'pass' : alloyMismatch ? 'reject' : 'warn',
      limitAr: 'التحقق من مرجع CRM قريب من السبيكة قبل المسح',
      limitEn: 'Calibrated against Certified Reference Material (CRM)',
      measuredAr: `Cr ${cr.toFixed(2)}% · Mo ${mo.toFixed(2)}%`,
      measuredEn: `Cr ${cr.toFixed(2)}% · Mo ${mo.toFixed(2)}%`,
      reasonAr: 'معايرة أشعة X-Ray الفلورية تمنح دقة تصنيف فورية للعناصر السبائكية.',
      reasonEn: 'XRF K-alpha energy peaks cleanly separate Cr and Mo lines.',
      remediationAr: 'نظف القشرة الكربونية بالصنفرة الخفيفة إلى معدن لامع قبل ملامسة نافذة الجهاز.',
      remediationEn: 'Grind oxide mill scale to bright bare metal before triggering XRF beam.',
    },
    {
      codeId: 'nace_mr0175',
      standard: 'NACE MR0175 / ISO 15156',
      clause: 'Sour Service ≤ 248 HV / 22 HRC',
      titleAr: 'حد صلادة الخدمة الحامضية لمنع التشقق الهيدروجيني (SSC)',
      titleEn: 'Sour Service Hardness Limit (≤ 248 HV / 22 HRC)',
      status: hv > 248 ? 'reject' : hv > 235 ? 'warn' : 'pass',
      limitAr: '≤ 248 HV10 (≤ 22 HRC) في منطقة اللحام و HAZ',
      limitEn: '≤ 248 HV10 (≤ 22 HRC) across Weld & HAZ',
      measuredAr: `${hv} HV (~${hrcApprox} HRC / ${hbwApprox} HBW)`,
      measuredEn: `${hv} HV (~${hrcApprox} HRC / ${hbwApprox} HBW)`,
      reasonAr:
        hv > 248
          ? 'الصلادة تتجاوز 248 HV؛ خطر تشقق إجهاد الكبريتيد (SSC) في بيئة H₂S مرتفع جداً.'
          : 'الصلادة الموضعية في HAZ دون عتبة NACE الحرجة.',
      reasonEn:
        hv > 248
          ? 'Hardness exceeds 248 HV; high risk of Sulfide Stress Cracking (SSC) in wet H₂S.'
          : 'Weld and HAZ hardness remain safely below NACE 248 HV ceiling.',
      remediationAr: 'أعد إجراء المعالجة الحرارية (Re-PWHT) عند 680–730°C لتليين مارتنزيت الـ HAZ.',
      remediationEn: 'Perform corrective PWHT temper cycle to bring HAZ hardness ≤ 248 HV.',
    },
    {
      codeId: 'asme_sec2_b313',
      standard: 'ASME B31.3 / Sec. II',
      clause: 'Table 331.1.1 PWHT Hardness',
      titleAr: 'تقييم المعالجة الحرارية بعد اللحام لسبائك Cr-Mo',
      titleEn: 'Cr-Mo Alloy Post-Weld Hardness Verification',
      status: hv > 241 && cr >= 2.0 ? 'reject' : hv > 225 ? 'warn' : 'pass',
      limitAr: 'لسبائك P22: HBW ≤ 225–241 بعد PWHT',
      limitEn: 'For P22 (2.25Cr-1Mo): ≤ 241 HBW post-PWHT',
      measuredAr: `${hbwApprox} HBW`,
      measuredEn: `${hbwApprox} HBW`,
      reasonAr:
        hv > 241 && cr >= 2.0
          ? 'صلادة P22 بعد التلدين مرتفعة؛ يُحتمل عدم كفاية زمن أو حرارة الـ PWHT.'
          : 'تجانس التلدين الحراري في الوصلة ومعدن الأساس ممتاز.',
      reasonEn:
        hv > 241 && cr >= 2.0
          ? 'Elevated Cr-Mo weld hardness suggests incomplete tempering soak.'
          : 'Post-weld hardness profile indicates effective PWHT soak.',
      remediationAr: 'راجع مخطط ثيرموكبل الـ PWHT وأعد دورة التلدين لمدة إضافية.',
      remediationEn: 'Audit PWHT thermocouple chart and execute supplementary tempering cycle.',
    },
    {
      codeId: 'astm_a956_ce',
      standard: 'ASTM A956 / IIW CE',
      clause: 'Leeb/UCI & CE ≤ 0.45',
      titleAr: 'قابلية التصلد والمكافئ الكربوني في منطقة HAZ',
      titleEn: 'Carbon Equivalent (CE_IIW) & Hardenability',
      status: ce > 0.5 ? 'reject' : ce > 0.44 ? 'warn' : 'pass',
      limitAr: 'CE_IIW ≤ 0.45 بدون تسخين مسبق خاص',
      limitEn: 'CE_IIW ≤ 0.45 standard preheat',
      measuredAr: `CE = ${ce.toFixed(2)}`,
      measuredEn: `CE = ${ce.toFixed(2)}`,
      reasonAr:
        ce > 0.5
          ? 'مكافئ كربوني مرتفع يزيد خطر التشقق البارد (Hydrogen Cracking) ويتطلب تسخيناً مسبقاً عالياً.'
          : 'قابلية اللحام والتصلد متوازنة مع شروط التسخين المسبق القياسية.',
      reasonEn:
        ce > 0.5
          ? 'High CE_IIW increases cold-cracking susceptibility; mandatory high preheat.'
          : 'Carbon equivalent within standard preheat envelope.',
      remediationAr: 'ارفع حرارة التسخين المسبق Preheat > 175°C واستخدم أقطاباً منخفضة الهيدروجين H4.',
      remediationEn: 'Raise preheat above 175°C and bake low-hydrogen E8018-B2/B3 consumables.',
    },
  ];

  const counts = computeOverallStatus(clauses);
  return {
    methodId: 'pmi_hardness',
    ...counts,
    metrics: [
      {
        id: 'alloy',
        labelAr: 'هوية السبيكة XRF',
        labelEn: 'Identified Alloy Grade',
        value: detectedAlloy,
        tone: alloyMismatch ? 'rose' : 'cyan',
      },
      {
        id: 'hv',
        labelAr: 'صلادة HAZ المقاسة',
        labelEn: 'Peak HAZ Hardness',
        value: `${hv} HV (${hrcApprox} HRC)`,
        tone: hv > 248 ? 'rose' : 'emerald',
      },
      {
        id: 'hbw',
        labelAr: 'المكافئ البرينيل',
        labelEn: 'Equivalent Brinell',
        value: `${hbwApprox} HBW`,
        tone: 'amber',
      },
      {
        id: 'ce',
        labelAr: 'المكافئ الكربوني (CE)',
        labelEn: 'Carbon Equivalent CE',
        value: ce.toFixed(2),
        tone: ce > 0.5 ? 'rose' : 'violet',
      },
    ],
    clauses,
    summaryAr:
      counts.overallStatus === 'pass'
        ? 'تم التحقق الإيجابي من السبيكة عبر XRF والصلادة أقل من حد الخدمة الحامضية NACE 248 HV.'
        : counts.overallStatus === 'warn'
        ? 'صلادة أو مكافئ كربوني قريب من الحد الأعلى؛ يتطلب مراجعة PWHT.'
        : 'مخالفة كود جسيمة: خلط سبائك Carbon Steel/Off-Spec أو تجاوز صلادة NACE 248 HV.',
    summaryEn:
      counts.overallStatus === 'pass'
        ? 'XRF PMI confirms specified Cr-Mo alloy and HAZ hardness meets NACE ≤ 248 HV.'
        : counts.overallStatus === 'warn'
        ? 'Borderline hardness or CE; review PWHT soak chart and preheat.'
        : 'Code Reject: Alloy mix-up detected or hardness exceeds NACE MR0175 248 HV limit.',
    physicsFormulaAr: 'CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15  |  NACE ≤ 248 HV (22 HRC)',
    physicsFormulaEn: 'CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15  |  NACE ≤ 248 HV (22 HRC)',
    visualData: {
      cr,
      mo,
      hv,
      hbwApprox,
      hrcApprox,
      ce,
      detectedAlloy,
      alloyMismatch,
    },
  };
}

export function evaluateMissingNdtMethod(
  methodId: MissingNdtMethodId,
  params: Record<string, number>
): MissingNdtEvaluationResult {
  switch (methodId) {
    case 'et_rft':
      return evaluateEtRft(params);
    case 'lt_hydro':
      return evaluateLtHydro(params);
    case 'tofd':
      return evaluateTofd(params);
    case 'mfl_api_ffs':
      return evaluateMflApiFfs(params);
    case 'coating_holiday':
      return evaluateCoatingHoliday(params);
    case 'pmi_hardness':
      return evaluatePmiHardness(params);
  }
}

export const MISSING_NDT_CODE_SCENARIOS: readonly MissingNdtCodeScenario[] = [
  // ET / RFT Scenarios
  {
    id: 'et_pass_asme',
    methodId: 'et_rft',
    codeBadge: 'ASME Sec. V Art. 8 · TEMA Pass',
    expectedOutcome: 'pass',
    titleAr: 'أنبوب مبادل حراري سليم (تآكل خارجي طفيف 16%)',
    titleEn: 'Compliant Exchanger Tube (16% OD Fretting)',
    summaryAr: 'تردد f₉₀ مضبوط على 120 kHz، معامل امتلاء 86%، والطور يفصل التآكل الخفيف دون حد السد.',
    summaryEn: 'Tuned f₉₀ at 120 kHz, 86% fill factor, clear 107° OD phase well below 40% TEMA limit.',
    acceptanceTargetAr: 'قبول تشغيلي وإدراج في سجل المتابعة الروتينية.',
    acceptanceTargetEn: 'Accept for continued service under routine turnaround monitoring.',
    params: { frequencyKhz: 120, wallLossPct: 16, defectSide: 1, fillFactorPct: 86 },
  },
  {
    id: 'et_reject_tema_plug',
    methodId: 'et_rft',
    codeBadge: 'TEMA RCB 40% Plugging Reject',
    expectedOutcome: 'reject',
    titleAr: 'ثقب تآكل حاد ≥ 48% يستوجب سد الأنبوب فوراً',
    titleEn: 'Critical 48% ID Pitting — Tube Plugging Required',
    summaryAr: 'تآكل داخلي ID بنسبة 48% تجاوز حد الـ 40% الميكانيكي لـ TEMA مع إشارة طور حادة 57°.',
    summaryEn: '48% ID pitting breaches 40% TEMA plugging limit with sharp 57° phase vector.',
    acceptanceTargetAr: 'رفض وعزل الأنبوب بسدادات ميكانيكية من الطرفين.',
    acceptanceTargetEn: 'Reject & plug tube on both tube-sheet ends; expand 100% pass scope.',
    params: { frequencyKhz: 135, wallLossPct: 48, defectSide: 0, fillFactorPct: 84 },
  },
  {
    id: 'et_reject_skin_depth',
    methodId: 'et_rft',
    codeBadge: 'ASTM E426 Skin-Depth Error',
    expectedOutcome: 'reject',
    titleAr: 'خطأ ضبط تردد عالٍ (420 kHz) يحجب عيوب السطح الخارجي',
    titleEn: 'Excessive Frequency (420 kHz) Blinding OD Pits',
    summaryAr: 'التردد المرتفع يقلص δ إلى 0.66 mm فقط، فلا تخترق التيارات الدوامية كامل جدار الأنبوب.',
    summaryEn: 'High 420 kHz shrinks skin depth δ to 0.66 mm, missing outer-wall fretting.',
    acceptanceTargetAr: 'إعادة ضبط التردد قرب 110–140 kHz لتحقيق الاختراق الكامل.',
    acceptanceTargetEn: 'Recalibrate f₉₀ frequency down to 110–140 kHz for full wall penetration.',
    params: { frequencyKhz: 420, wallLossPct: 30, defectSide: 1, fillFactorPct: 82 },
  },
  {
    id: 'et_warn_liftoff',
    methodId: 'et_rft',
    codeBadge: 'ISO 15548 Fill-Factor Drift',
    expectedOutcome: 'warn',
    titleAr: 'بروب صغير الحجم (Fill Factor 62%) يسبب ضوضاء Lift-off',
    titleEn: 'Undersized Bobbin Probe (62% Fill) Noise',
    summaryAr: 'بروب غير مناسب للقطر الداخلي يخفض SNR تحت حد 9.5 dB وفق ASME Art. 8.',
    summaryEn: 'Undersized bobbin coil drops SNR below ASME Art. 8 threshold.',
    acceptanceTargetAr: 'استبدال المجس بمقاس أكبر يرفع معامل الامتلاء ≥ 80%.',
    acceptanceTargetEn: 'Swap to larger probe achieving ≥ 80% fill factor.',
    params: { frequencyKhz: 120, wallLossPct: 18, defectSide: 0, fillFactorPct: 62 },
  },

  // LT / Hydro Scenarios
  {
    id: 'lt_pass_b313',
    methodId: 'lt_hydro',
    codeBadge: 'ASME B31.3 & UG-99 Pass',
    expectedOutcome: 'pass',
    titleAr: 'اختبار هيدروستاتيكي ناجح (150% MAWP + ثبات تام)',
    titleEn: 'Compliant Piping & Vessel Hydro (150% MAWP)',
    summaryAr: 'ضغط 60 bar على تصميم 40 bar مع انخفاض 0.1%/hr وصندوق تفريغ معاير على 28 kPa.',
    summaryEn: '60 bar test on 40 bar MAWP with 0.1%/hr hold stability and 28 kPa vacuum box.',
    acceptanceTargetAr: 'اعتماد شهادة الاختبار الهيدروستاتيكي وختم التوريد.',
    acceptanceTargetEn: 'Sign off hydro test chart and release spool/vessel.',
    params: { mawpBar: 40, appliedRatioPct: 150, pressureDropPctHr: 0.1, vacuumKpa: 28 },
  },
  {
    id: 'lt_reject_underpressure',
    methodId: 'lt_hydro',
    codeBadge: 'ASME UG-99 Under-Pressure',
    expectedOutcome: 'reject',
    titleAr: 'اختبار هوائي أو ضغط ناقص (110% MAWP) غير كافٍ للكود',
    titleEn: 'Insufficient Test Pressure (110% MAWP) Violation',
    summaryAr: 'ضغط الاختبار 110% فقط لا يحقق شرط 130% UG-99 أو 150% ASME B31.3 للهيدرو.',
    summaryEn: '110% pressure falls short of 130% ASME UG-99 and 150% B31.3 hydro requirements.',
    acceptanceTargetAr: 'رفع ضغط الاختبار إلى 150% MAWP للهيدروستاتيك (أو اعتماد إجراءات الهواء الخاصة).',
    acceptanceTargetEn: 'Raise hydro pressure to 150% MAWP per B31.3 Table 345.',
    params: { mawpBar: 50, appliedRatioPct: 110, pressureDropPctHr: 0.1, vacuumKpa: 26 },
  },
  {
    id: 'lt_reject_decay',
    methodId: 'lt_hydro',
    codeBadge: 'API 1104 / Art. 10 Active Leak',
    expectedOutcome: 'reject',
    titleAr: 'نضح وتسرب ضغط (1.4%/hr) أثناء فترة التثبيت',
    titleEn: 'Active Pressure Decay (1.4%/hr) During Hold',
    summaryAr: 'هبوط الضغط المتواصل على المخطط الزمني يثبت وجود ثقب نافذ أو تهريب حشية.',
    summaryEn: 'Continuous strip-chart decay signals active pinhole weepage.',
    acceptanceTargetAr: 'تفريغ الضغط وإصلاح نقطة التسرب ثم إعادة دورة الاختبار الكاملة.',
    acceptanceTargetEn: 'Depressurize, repair leaking joint/weld, and repeat full hold test.',
    params: { mawpBar: 40, appliedRatioPct: 150, pressureDropPctHr: 1.4, vacuumKpa: 28 },
  },
  {
    id: 'lt_reject_vacuum',
    methodId: 'lt_hydro',
    codeBadge: 'API 653 Sec. 12 Low ΔP',
    expectedOutcome: 'reject',
    titleAr: 'تفريغ ضعيف لصندوق الصابون (12 kPa) على قاع خزان',
    titleEn: 'Low Vacuum Box Differential (12 kPa) Tank Floor Fail',
    summaryAr: 'تفريغ 12 kPa أقل من حد 20.7 kPa (3 psi) اللازم لكشف مسامات قاع الخزان.',
    summaryEn: '12 kPa fails API 653 3 psi (20.7 kPa) threshold to nucleate leak bubbles.',
    acceptanceTargetAr: 'تغيير حشية المطاط وضبط مضخة التفريغ على 24–32 kPa.',
    acceptanceTargetEn: 'Replace vacuum box gasket and hold 24–32 kPa differential.',
    params: { mawpBar: 40, appliedRatioPct: 150, pressureDropPctHr: 0.2, vacuumKpa: 12 },
  },

  // TOFD Scenarios
  {
    id: 'tofd_pass_iso',
    methodId: 'tofd',
    codeBadge: 'ISO 10863 & ASME App. 12 Pass',
    expectedOutcome: 'pass',
    titleAr: 'عيب باطني صغير (h = 2.0 mm) بعيد عن المنطقة الميتة',
    titleEn: 'Acceptable Embedded Flaw (h = 2.0 mm, Subsurface)',
    summaryAr: 'ضبط PCS مثالي على 60 mm لجدار 30 mm، وإشارة باطنية ارتفاعها 2.0 mm دون كسر للسطح.',
    summaryEn: 'Clean 60 mm PCS on 30 mm wall; embedded 2.0 mm height stays within Code Case 2235.',
    acceptanceTargetAr: 'قبول العيب وتسجيل خريطة D-Scan المرمّزة في الملف النهائي.',
    acceptanceTargetEn: 'Accept indication and archive encoded D-Scan record.',
    params: { thicknessMm: 30, pcsMm: 60, flawTopDepthMm: 12, flawHeightMm: 2.0 },
  },
  {
    id: 'tofd_reject_surface_crack',
    methodId: 'tofd',
    codeBadge: 'ASME & ISO 15626 Surface Break',
    expectedOutcome: 'reject',
    titleAr: 'شرخ سطحي يكسر الموجة الجانبية (Surface-Breaking Crack)',
    titleEn: 'Surface-Breaking Crack Disrupting Lateral Wave',
    summaryAr: 'الطرف العلوي عند عمق 2.0 mm يقطع الموجة الجانبية مباشرة مع ارتفاع 5.5 mm.',
    summaryEn: 'Upper tip at 2.0 mm breaches lateral wave dead zone with 5.5 mm height.',
    acceptanceTargetAr: 'رفض قاطع بالكود واستئصال اللحام مع مسح PAUT/MT تأكيدي.',
    acceptanceTargetEn: 'Strict reject across all codes; gouge and weld repair.',
    params: { thicknessMm: 32, pcsMm: 68, flawTopDepthMm: 2.0, flawHeightMm: 5.5 },
  },
  {
    id: 'tofd_reject_height',
    methodId: 'tofd',
    codeBadge: 'AWS D1.1 Cl. 8 Height Reject',
    expectedOutcome: 'reject',
    titleAr: 'نقص انصهار منتصف اللحام بارتفاع رأسي 9.0 mm',
    titleEn: 'Mid-Wall Lack of Fusion (9.0 mm Through-Wall Height)',
    summaryAr: 'إشارة حيود واضحة بانعكاس طور 180° بين القمة والقاع بارتفاع يفوق حدود الجداول.',
    summaryEn: 'Clear 180° phase-reversed tip signals measuring 9.0 mm vertical height.',
    acceptanceTargetAr: 'رفض هندسي وإزالة العيب وإعادة اللحام.',
    acceptanceTargetEn: 'Code reject; excavate and reweld defect zone.',
    params: { thicknessMm: 36, pcsMm: 74, flawTopDepthMm: 13, flawHeightMm: 9.0 },
  },
  {
    id: 'tofd_warn_pcs',
    methodId: 'tofd',
    codeBadge: 'ASME Sec. V Art. 4 PCS Error',
    expectedOutcome: 'reject',
    titleAr: 'تباعد مجسات غير مناسب (PCS = 128 mm) لجدار 24 mm',
    titleEn: 'Misaligned PCS (128 mm) for 24 mm Wall Thickness',
    summaryAr: 'المسافة الزائدة بين المجسين تُفقد التقاء الـ 2/3T وتشوّه حساب الأعماق.',
    summaryEn: 'Oversized PCS skips 2/3-T focal overlap and distorts hyperbolic sizing.',
    acceptanceTargetAr: 'إعادة المعايرة وضبط PCS إلى ~50 mm قبل تسجيل الفحص.',
    acceptanceTargetEn: 'Reset PCS near ~50 mm and re-verify lateral/backwall arrival times.',
    params: { thicknessMm: 24, pcsMm: 128, flawTopDepthMm: 10, flawHeightMm: 2.0 },
  },

  // MFL / API / FFS Scenarios
  {
    id: 'mfl_pass_api',
    methodId: 'mfl_api_ffs',
    codeBadge: 'API 510 / 653 / 579 Pass',
    expectedOutcome: 'pass',
    titleAr: 'تشغيل آمن: عمر متبقي 14 سنة و RSF = 0.94',
    titleEn: 'Fit for Service: 14-Year Remaining Life & RSF 0.94',
    summaryAr: 'سماكة متبقية 9.2 mm فوق t_min = 6.0 mm ومعدل تآكل بطيء 0.22 mm/yr.',
    summaryEn: '9.2 mm actual thickness above 6.0 mm t_min with 0.22 mm/yr corrosion rate.',
    acceptanceTargetAr: 'استمرار التشغيل وجدولة الفحص الدوري القادم بعد 7.3 سنوات.',
    acceptanceTargetEn: 'Approve operation; schedule half-life UT inspection at 7.3 years.',
    params: { nominalThickMm: 6.0, actualThickMm: 9.2, corrosionRateMmYr: 0.22, mflLossPct: 20 },
  },
  {
    id: 'mfl_reject_below_tmin',
    methodId: 'mfl_api_ffs',
    codeBadge: 'API 510 & ASME B31G Below t_min',
    expectedOutcome: 'reject',
    titleAr: 'هبوط السماكة تحت الحد الأدنى t_actual < t_min',
    titleEn: 'Wall Below Minimum Required Thickness (t_actual < t_min)',
    summaryAr: 'السماكة المقاسة 5.2 mm أقل من t_min البالغة 7.0 mm؛ العمر المتبقي صفر!',
    summaryEn: 'Measured 5.2 mm breaches 7.0 mm t_min; zero remaining corrosion allowance.',
    acceptanceTargetAr: 'إيقاف/تخفيض MAWP أو إجراء لحام تعويضي أو غلاف مركب فوراً.',
    acceptanceTargetEn: 'Shutdown/derate MAWP or install engineered weld buildup/sleeve.',
    params: { nominalThickMm: 7.0, actualThickMm: 5.2, corrosionRateMmYr: 0.45, mflLossPct: 55 },
  },
  {
    id: 'mfl_reject_tank_pit',
    methodId: 'mfl_api_ffs',
    codeBadge: 'API 653 Floor Patch Trigger',
    expectedOutcome: 'reject',
    titleAr: 'حفرة MFL عميقة بقاع الخزان (70% فقد · 2.2 mm متبقي)',
    titleEn: 'Severe Tank Floor MFL Pit (70% Loss · 2.2 mm Left)',
    summaryAr: 'نقر تآكل بـ 70% بقاع الخزان تحت حد 2.5 mm الإلزامي في API 653.',
    summaryEn: '70% floor pit leaves 2.2 mm, violating API 653 2.5 mm floor threshold.',
    acceptanceTargetAr: 'تركيب رقعة لحام فولاذية فوق المنطقة المتضررة.',
    acceptanceTargetEn: 'Install lap-welded steel patch plate per API 653 Sec. 9.10.',
    params: { nominalThickMm: 4.0, actualThickMm: 2.2, corrosionRateMmYr: 0.35, mflLossPct: 70 },
  },
  {
    id: 'mfl_warn_high_cr',
    methodId: 'mfl_api_ffs',
    codeBadge: 'API 570 Accelerated Corrosion',
    expectedOutcome: 'reject',
    titleAr: 'تآكل أنابيب نشط ومتسارع (0.95 mm/yr) قرب نقط حقن',
    titleEn: 'Accelerated Piping Corrosion (0.95 mm/yr)',
    summaryAr: 'معدل التآكل المرتفع يقلص العمر المتبقي إلى أقل من 3 سنوات ويستلزم تدخل المعالجة.',
    summaryEn: 'High 0.95 mm/yr rate drops remaining life below 3 years.',
    acceptanceTargetAr: 'مراجعة حقن المثبطات ومضاعفة نقاط TML على الكوع والمجمع.',
    acceptanceTargetEn: 'Adjust chemical inhibitor dosing and add UT B-scan TML grid.',
    params: { nominalThickMm: 5.5, actualThickMm: 7.8, corrosionRateMmYr: 0.95, mflLossPct: 35 },
  },

  // Coating / Holiday Scenarios
  {
    id: 'coat_pass_sspc',
    methodId: 'coating_holiday',
    codeBadge: 'SSPC-PA 2 · NACE SP0188 Pass',
    expectedOutcome: 'pass',
    titleAr: 'ظروف طلاء مثالية (ΔT = 8°C · 270 µm · ملوحة منخفضة)',
    titleEn: 'Compliant Coating Cycle (ΔT 8°C · 270 µm · Low Salt)',
    summaryAr: 'المعدن دافئ بفارق آمن فوق نقطة الندى، ومتوسط DFT يحقق SSPC-PA 2 Level 3.',
    summaryEn: 'Dry substrate >8°C above dew point, 270 µm avg DFT, clean Bresle salt test.',
    acceptanceTargetAr: 'إجازة الاختبار والشروع في اختبار الشرارة عند 4,108 V.',
    acceptanceTargetEn: 'Approve coat build and verify pinhole-free film at 4,108 V.',
    params: { steelTempC: 28, relHumidityPct: 56, measuredDftUm: 270, saltMgM2: 20 },
  },
  {
    id: 'coat_reject_dewpoint',
    methodId: 'coating_holiday',
    codeBadge: 'ISO 8502-4 Dew Point Violation',
    expectedOutcome: 'reject',
    titleAr: 'رطوبة مرتفعة 91% تسبب تكثف الندى (ΔT < 3°C)',
    titleEn: 'High Humidity (91% RH) — Dew Point Spread Fail',
    summaryAr: 'الرطوبة العالية تجعل فارق نقطة الندى أقل من 3°C؛ خطورة عالية لتقشر الطلاء.',
    summaryEn: '91% RH drops dew point margin below mandatory 3.0°C window.',
    acceptanceTargetAr: 'إيقاف السفع والطلاء فوراً حتى تتحسن الرطوبة.',
    acceptanceTargetEn: 'Suspend blasting & painting immediately until ΔT ≥ 3°C.',
    params: { steelTempC: 20, relHumidityPct: 91, measuredDftUm: 260, saltMgM2: 20 },
  },
  {
    id: 'coat_reject_salts',
    methodId: 'coating_holiday',
    codeBadge: 'ISO 8502-6 Salt Contamination',
    expectedOutcome: 'reject',
    titleAr: 'تلوث أملاح بريسيل عالية (80 mg/m²) يهدد الغمر',
    titleEn: 'High Bresle Soluble Salts (80 mg/m²) Contamination',
    summaryAr: 'ملوحة سطح المعدن تتجاوز حد 50 mg/m² مما يؤدي لتقرحات أسموزية بعد التشغيل.',
    summaryEn: 'Surface chlorides at 80 mg/m² breach 50 mg/m² limit for immersion epoxy.',
    acceptanceTargetAr: 'غسيل بالماء العذب المضغوط وإعادة اختبار Bresle قبل وضع الأساس.',
    acceptanceTargetEn: 'Pressure-wash with clean fresh water and retest Bresle patch.',
    params: { steelTempC: 29, relHumidityPct: 55, measuredDftUm: 280, saltMgM2: 80 },
  },
  {
    id: 'coat_reject_under_dft',
    methodId: 'coating_holiday',
    codeBadge: 'SSPC-PA 2 Under-Thickness',
    expectedOutcome: 'reject',
    titleAr: 'نقص سماكة الطلاء الجاف (160 µm) تحت حد الـ 80%',
    titleEn: 'Low Coating Thickness (160 µm < 200 µm Min)',
    summaryAr: 'متوسط الـ DFT قليل للغاية ولا يغطي قمم السفع (Rogue Peaks).',
    summaryEn: '160 µm fails minimum 200 µm SSPC-PA 2 barrier threshold.',
    acceptanceTargetAr: 'تطبيق طبقة تقوية إضافية للوصول إلى 250–300 µm.',
    acceptanceTargetEn: 'Apply additional epoxy build coat to reach 250–300 µm.',
    params: { steelTempC: 27, relHumidityPct: 58, measuredDftUm: 160, saltMgM2: 20 },
  },

  // PMI / Hardness Scenarios
  {
    id: 'pmi_pass_p22',
    methodId: 'pmi_hardness',
    codeBadge: 'API RP 578 & NACE MR0175 Pass',
    expectedOutcome: 'pass',
    titleAr: 'وصلة سبيكة P22 سليمة (2.25Cr-1Mo · 214 HV)',
    titleEn: 'Verified P22 Alloy (2.25Cr-1Mo) & Post-PWHT 214 HV',
    summaryAr: 'بصمة XRF تطابق P22 والصلادة 214 HV دون عتبة الخدمة الحامضية NACE 248 HV.',
    summaryEn: 'XRF matches P22 grade; 214 HV HAZ hardness satisfies NACE MR0175.',
    acceptanceTargetAr: 'اعتماد الهوية السبائكية وإصدار تقرير PMI والصلادة.',
    acceptanceTargetEn: 'Release weld joint under API RP 578 & NACE compliance.',
    params: { chromiumPct: 2.25, molybdenumPct: 1.0, hazHardnessHv: 214, carbonEq: 0.41 },
  },
  {
    id: 'pmi_reject_mixup',
    methodId: 'pmi_hardness',
    codeBadge: 'API RP 578 Alloy Mix-Up',
    expectedOutcome: 'reject',
    titleAr: 'خطأ خلط سبائك: قطعة كربون ستيل (0.2Cr) داخل خط P22!',
    titleEn: 'Critical Mix-Up: Carbon Steel (0.2% Cr) in P22 Line',
    summaryAr: 'جهاز XRF كشف وجود قطعة فولاذ كربوني عادي داخل خط حراري مصمم لسبيكة Cr-Mo.',
    summaryEn: 'XRF reveals plain carbon steel spool mistakenly welded into Cr-Mo service.',
    acceptanceTargetAr: 'عزل وقص الوصلة فوراً ومسح 100% من مكونات الدفعة بالـ XRF.',
    acceptanceTargetEn: 'Cut out misidentified spool and run 100% PMI sweep on heat lot.',
    params: { chromiumPct: 0.2, molybdenumPct: 0.05, hazHardnessHv: 192, carbonEq: 0.39 },
  },
  {
    id: 'pmi_reject_nace_hard',
    methodId: 'pmi_hardness',
    codeBadge: 'NACE MR0175 Sour-Service Fail',
    expectedOutcome: 'reject',
    titleAr: 'صلادة HAZ خطرة (294 HV / 29.5 HRC) في خدمة H₂S',
    titleEn: 'Excessive HAZ Hardness (294 HV) Exceeding NACE 248 HV',
    summaryAr: 'نسيج مارتنزيتي غير ملدّن يرفع خطر التشقق بالهيدروجين (SSC) فوراً.',
    summaryEn: 'Untempered martensitic HAZ exceeds 248 HV sour-service limit.',
    acceptanceTargetAr: 'إعادة دورة المعالجة الحرارية PWHT وإعادة فحص 100% بالصلادة.',
    acceptanceTargetEn: 'Execute corrective PWHT cycle and verify hardness ≤ 248 HV.',
    params: { chromiumPct: 1.25, molybdenumPct: 0.5, hazHardnessHv: 294, carbonEq: 0.44 },
  },
  {
    id: 'pmi_reject_p91_ce',
    methodId: 'pmi_hardness',
    codeBadge: 'ASME Sec. II & IIW CE Fail',
    expectedOutcome: 'reject',
    titleAr: 'خلط سبيكة غريب + مكافئ كربوني مرتفع CE = 0.56',
    titleEn: 'Off-Spec Cr-Mo Chemistry & High Hardenability (CE 0.56)',
    summaryAr: 'تركيب سبائكي غير متطابق مع مكافئ كربوني 0.56 وصلادة 266 HV.',
    summaryEn: 'Non-conforming chemistry with 0.56 CE triggers cold-cracking risk.',
    acceptanceTargetAr: 'مراجعة شهادات المواد (MTR) وإعادة التقييم الميتالورجي.',
    acceptanceTargetEn: 'Audit Mill Test Report (MTR) and apply qualified repair procedure.',
    params: { chromiumPct: 4.5, molybdenumPct: 0.25, hazHardnessHv: 266, carbonEq: 0.56 },
  },
];
