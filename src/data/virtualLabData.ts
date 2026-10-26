export interface VirtualLabExperiment {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  method: 'UT' | 'MT';
  standard: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  difficultyAr: string;
  difficultyEn: string;
  objectivesAr: string[];
  objectivesEn: string[];
  blockType: 'iiw_v1' | 'step_wedge' | 'angle_weld' | 'mt_yoke';
  defaultVelocity: number; // m/s
  defaultRange: number; // mm
  defaultGain: number; // dB
  defaultZero: number; // microseconds
  defaultGateStart: number; // mm
  defaultGateWidth: number; // mm
  defaultGateThreshold: number; // % FSH
  steps: {
    stepNumber: number;
    titleAr: string;
    titleEn: string;
    instructionAr: string;
    instructionEn: string;
    targetParameter: 'velocity' | 'gain' | 'position' | 'gate' | 'freeze';
    targetConditionAr: string;
    targetConditionEn: string;
    hintAr: string;
    hintEn: string;
  }[];
}

export const VIRTUAL_LAB_EXPERIMENTS: VirtualLabExperiment[] = [
  {
    id: 'ut-iiw-v1-range',
    titleAr: 'معايرة النطاق وسرعة الصوت على كتلة IIW V1',
    titleEn: 'Range & Sound Velocity Calibration on IIW V1 Block',
    subtitleAr: 'معايرة سرعة الموجات الطولية (5920 م/ث) ونطاق الشاشة (100 مم / 200 مم) طبقاً لـ ISO 2400 / ASME Sec V',
    subtitleEn: 'Calibrate longitudinal sound velocity (5920 m/s) and time base (100 mm / 200 mm) per ISO 2400 & ASME Sec V',
    method: 'UT',
    standard: 'ASME Sec V Art. 4 / ISO 2400 (EN 12223)',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    difficultyEn: 'Intermediate',
    objectivesAr: [
      'ضبط سرعة الموجة الطولية في الفولاذ الكربوني بدقة (5920 m/s)',
      'معايرة الإزاحة الصفرية (Probe Zero Delay) للتخلص من زمن انتقال الصوت داخل الحذاء',
      'محاذاة صدى القوس الدائري (100 مم) وصدى الارتداد المضاعف (200 مم)',
      'ضبط حساسية الكسب (Gain) ليصل الصدى المرجعي إلى 80% من كامل ارتفاع الشاشة (FSH)'
    ],
    objectivesEn: [
      'Accurately calibrate carbon steel longitudinal wave velocity (5920 m/s)',
      'Compensate for probe zero delay through transducer wear plate/shoe',
      'Align the 100 mm radius arc echo and its multiple 200 mm bounce',
      'Adjust instrument Gain to establish reference sensitivity at 80% FSH'
    ],
    blockType: 'iiw_v1',
    defaultVelocity: 5850,
    defaultRange: 250,
    defaultGain: 38,
    defaultZero: 0.8,
    defaultGateStart: 85,
    defaultGateWidth: 30,
    defaultGateThreshold: 50,
    steps: [
      {
        stepNumber: 1,
        titleAr: 'وضع المجس على نقطة المعايرة',
        titleEn: 'Position Transducer on Reference Arc',
        instructionAr: 'قم بوضع المجس ذو الزاوية 0° في الموضع (B) الموجه نحو القوس الدائري نصف قطره 100 مم.',
        instructionEn: 'Position the 0° normal beam probe at position (B) oriented towards the 100 mm radius cylindrical arc.',
        targetParameter: 'position',
        targetConditionAr: 'المجس في الموضع B (نصف القطر 100 مم)',
        targetConditionEn: 'Probe positioned at B (100 mm arc)',
        hintAr: 'انقر على زر "الموضع B: قوس 100 مم" في لوحة التحكم.',
        hintEn: 'Click "Position B: 100mm Arc" in the positioning panel.'
      },
      {
        stepNumber: 2,
        titleAr: 'ضبط حساسية الكسب (Gain)',
        titleEn: 'Adjust Receiver Gain',
        instructionAr: 'عدّل الكسب (Gain) بحيث يصل ارتفاع الصدى الأول عند 100 مم إلى 80% من كامل ارتفاع الشاشة (FSH).',
        instructionEn: 'Adjust the Gain until the primary 100 mm echo reaches 80% Full Screen Height (FSH).',
        targetParameter: 'gain',
        targetConditionAr: 'الكسب بين 42 dB و 46 dB (ارتفاع الصدى ~80% FSH)',
        targetConditionEn: 'Gain between 42 dB and 46 dB (echo amplitude ~80% FSH)',
        hintAr: 'استخدم أزرار +1dB أو +6dB للوصول لـ 44 dB تقريباً.',
        hintEn: 'Use +1dB or +6dB buttons to reach approx 44 dB.'
      },
      {
        stepNumber: 3,
        titleAr: 'معايرة سرعة الصوت (Velocity)',
        titleEn: 'Calibrate Sound Velocity',
        instructionAr: 'اضبط سرعة الصوت لتتطابق بدقة مع سرعة الموجات الطولية في الفولاذ الكربوني (5920 m/s).',
        instructionEn: 'Calibrate material velocity to carbon steel longitudinal wave speed (5920 m/s).',
        targetParameter: 'velocity',
        targetConditionAr: 'سرعة الصوت = 5920 m/s (±20 m/s)',
        targetConditionEn: 'Velocity = 5920 m/s (±20 m/s)',
        hintAr: 'اضبط شريط تمرير السرعة إلى 5920 m/s بالضبط.',
        hintEn: 'Slide the velocity control to exactly 5920 m/s.'
      },
      {
        stepNumber: 4,
        titleAr: 'ضبط بوابة القياس A (Gate A)',
        titleEn: 'Set Measurement Gate A',
        instructionAr: 'حرك بداية البوابة A لتلتقط قمة الصدى عند 100 مم مع خفض عتبة التحذير إلى 40% FSH.',
        instructionEn: 'Position Gate A over the 100 mm backwall echo with threshold at 40% FSH.',
        targetParameter: 'gate',
        targetConditionAr: 'بداية البوابة بين 85 مم و 95 مم وعتبة التنبيه < 60%',
        targetConditionEn: 'Gate start between 85 mm and 95 mm, threshold < 60%',
        hintAr: 'حرك منزلق بداية البوابة ليتجاوز 90 مم وراقب إضاءة مؤشر الإنذار.',
        hintEn: 'Adjust gate start slider around 90 mm and observe the alarm LED trigger.'
      }
    ]
  },
  {
    id: 'ut-step-wedge-thickness',
    titleAr: 'معايرة السماكة والخطية على كتلة السلالم (Step Wedge)',
    titleEn: 'Thickness & Linearity Calibration on Step Wedge',
    subtitleAr: 'التحقق من خطية الجهاز ودقة قياس السماكات المتدرجة (2.5 مم إلى 12.5 مم)',
    subtitleEn: 'Verify equipment linearity and precision across stepped thicknesses (2.5 mm to 12.5 mm)',
    method: 'UT',
    standard: 'ASTM E797 / ASME Sec V Art. 5',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    difficultyEn: 'Beginner',
    objectivesAr: [
      'معايرة مقياس السماكة بالموجات فوق الصوتية بنقطتين (2-Point Calibration: رفيعة وسميكة)',
      'التحقق من الخطية الرأسية والأفقية لجهاز الفحص',
      'رصد ارتدادات الصدى المتعددة (Multi-echo reverberation) في المقاطع الرقيقة',
      'حساب نسبة الخطأ المئوية ومقارنتها بسماحية الكود (±0.05 مم)'
    ],
    objectivesEn: [
      'Perform 2-point ultrasonic thickness calibration (thin step & thick step)',
      'Verify vertical and horizontal linearity of the flaw detector',
      'Observe multi-echo reverberation patterns in thin sections',
      'Calculate percentage error and compare against tolerance (±0.05 mm)'
    ],
    blockType: 'step_wedge',
    defaultVelocity: 5920,
    defaultRange: 30,
    defaultGain: 34,
    defaultZero: 0.0,
    defaultGateStart: 5,
    defaultGateWidth: 10,
    defaultGateThreshold: 50,
    steps: [
      {
        stepNumber: 1,
        titleAr: 'فحص الدرجة الرقيقة (2.5 مم)',
        titleEn: 'Inspect Thin Step (2.5 mm)',
        instructionAr: 'ضع المجس على الدرجة الأولى بسماكة 2.5 مم ولاحظ تكرار الصدى على الشاشة.',
        instructionEn: 'Position probe on Step 1 (2.5 mm thickness) and observe multiple backwall reverberations.',
        targetParameter: 'position',
        targetConditionAr: 'المجس على الدرجة 1 (2.5 مم)',
        targetConditionEn: 'Probe on step 1 (2.5 mm)',
        hintAr: 'اختر الدرجة رقم 1 (2.5mm) من محدد الدرجات.',
        hintEn: 'Select step 1 (2.5mm) from the step selector.'
      },
      {
        stepNumber: 2,
        titleAr: 'معايرة الصفر (Zero Offset)',
        titleEn: 'Zero Offset Calibration',
        instructionAr: 'اضبط إزاحة الصفر حتى تطابق القراءة الرقمية بالضبط 2.50 مم.',
        instructionEn: 'Adjust zero offset until the digital readout reads exactly 2.50 mm.',
        targetParameter: 'velocity',
        targetConditionAr: 'قراءة السماكة = 2.50 مم ±0.05 مم',
        targetConditionEn: 'Thickness readout = 2.50 mm ±0.05 mm',
        hintAr: 'عدّل منزلق الصفر (Probe Delay) لضبط المحاذاة.',
        hintEn: 'Fine-tune probe zero delay slider.'
      },
      {
        stepNumber: 3,
        titleAr: 'فحص الدرجة السميكة (10.0 مم)',
        titleEn: 'Inspect Thick Step (10.0 mm)',
        instructionAr: 'انقل المجس إلى الدرجة رقم 4 بسماكة 10.0 مم للتحقق من السرعة.',
        instructionEn: 'Move probe to step 4 (10.0 mm) to verify sound velocity calibration.',
        targetParameter: 'position',
        targetConditionAr: 'المجس على الدرجة 4 (10.0 مم)',
        targetConditionEn: 'Probe on step 4 (10.0 mm)',
        hintAr: 'اختر الدرجة رقم 4 وراقب تحرك صدى القاع إلى 10 مم.',
        hintEn: 'Select step 4 and note backwall echo shifting to 10 mm.'
      }
    ]
  },
  {
    id: 'ut-angle-weld-inspection',
    titleAr: 'فحص لحام الأنابيب بالزاوية وتحديد العيوب (Angle Beam)',
    titleEn: 'Angle Beam Weld Inspection & Defect Triangulation',
    subtitleAr: 'محاكاة ارتداد الشعاع الصوتي (Leg 1 و Leg 2) وتحديد موقع العيب وعمقه بطريقة التثليث المثلثي',
    subtitleEn: 'Simulate sound path bounce (Leg 1 & Leg 2) and locate defect depth via trigonometric triangulation',
    method: 'UT',
    standard: 'ASME Sec V Art. 4 / AWS D1.1 / ISO 17640',
    difficulty: 'Advanced',
    difficultyAr: 'متقدم',
    difficultyEn: 'Advanced',
    objectivesAr: [
      'فهم زوايا الانكسار (45°, 60°, 70°) ومسافة القفزة الصوتية (Skip Distance)',
      'تطبيق قانون سنيل (Snell\'s Law) لارتداد الموجة القصية (Shear Wave: 3240 m/s)',
      'تحديد موقع الشق في جذر اللحام أو عدم الانصهار الجانبي',
      'حساب المسافة السطحية (Surface Distance R) والعمق الحقيقي (Depth D)'
    ],
    objectivesEn: [
      'Master refracted shear angles (45°, 60°, 70°) and acoustic Skip Distance',
      'Apply Snell\'s Law for transverse shear waves in carbon steel (3240 m/s)',
      'Detect root cracks or sidewall lack of fusion within the weld groove',
      'Calculate true Sound Path (S), Surface Distance (R), and Defect Depth (D)'
    ],
    blockType: 'angle_weld',
    defaultVelocity: 3240, // shear wave
    defaultRange: 150,
    defaultGain: 48,
    defaultZero: 1.2,
    defaultGateStart: 50,
    defaultGateWidth: 35,
    defaultGateThreshold: 45,
    steps: [
      {
        stepNumber: 1,
        titleAr: 'اختيار زاوية الإسفين (Probe Angle)',
        titleEn: 'Select Wedge Angle (60°)',
        instructionAr: 'اختر إسفين الزاوية 60° المناسب لسماكة الصفيحة (20 مم).',
        instructionEn: 'Select the 60° refracted angle wedge suitable for 20 mm plate thickness.',
        targetParameter: 'velocity',
        targetConditionAr: 'زاوية الإسفين = 60° والموجة قصية (3240 m/s)',
        targetConditionEn: 'Wedge angle = 60° with shear wave velocity (3240 m/s)',
        hintAr: 'اختر زاوية 60° من محدد زاوية الإسفين.',
        hintEn: 'Select 60° from the probe angle selector.'
      },
      {
        stepNumber: 2,
        titleAr: 'مسح منطقة اللحام (Scan Path)',
        titleEn: 'Raster Scan Weldment',
        instructionAr: 'حرك المجس للأمام والخلف بين مسافة 25 مم و 55 مم من خط مركز اللحام لرصد صدى الشق.',
        instructionEn: 'Move probe back and forth between 25 mm and 55 mm standoff distance to intercept the root crack.',
        targetParameter: 'position',
        targetConditionAr: 'ظهور صدى العيب داخل البوابة بحجم يتجاوز 60% FSH',
        targetConditionEn: 'Defect echo appears inside gate exceeding 60% FSH',
        hintAr: 'حرك منزلق مسافة المجس بالقرب من 40 مم حتى يتطابق مسار الشعاع مع جذر اللحام.',
        hintEn: 'Adjust probe position slider near 40 mm standoff until the beam intersects the weld root.'
      },
      {
        stepNumber: 3,
        titleAr: 'تجميد الشاشة وتوثيق الإحداثيات (Freeze)',
        titleEn: 'Freeze & Record Defect Triangulation',
        instructionAr: 'عند الوصول لأعلى قمة للصدى، قم بتجميد الشاشة (Freeze) لتسجيل مسار الصوت والعمق.',
        instructionEn: 'At peak defect echo amplitude, activate Freeze mode to capture sound path, depth, and standoff.',
        targetParameter: 'freeze',
        targetConditionAr: 'تفعيل وضع التجميد (Screen Frozen)',
        targetConditionEn: 'Display frozen (Screen Frozen)',
        hintAr: 'انقر على زر "تجميد الشاشة / Freeze" باللون الأخضر.',
        hintEn: 'Click the "Freeze" button on the flaw detector panel.'
      }
    ]
  },
  {
    id: 'mt-magnetic-yoke-inspection',
    titleAr: 'محاكاة الفحص بالجسيمات المغناطيسية والشوكة الكهرومغناطيسية (MT Yoke)',
    titleEn: 'Electromagnetic Yoke & Magnetic Particle Simulation (MT)',
    subtitleAr: 'فحص تسرب الفيض المغناطيسي (MFL) وكشف الشقوق السطحية بالمسحوق الجاف والفلوروسنت',
    subtitleEn: 'Magnetic Flux Leakage (MFL) simulation revealing surface cracks via dry & fluorescent powders',
    method: 'MT',
    standard: 'ASME Sec V Art. 7 / ASTM E1444 / ISO 9934',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    difficultyEn: 'Beginner',
    objectivesAr: [
      'فهم اتجاه خطوط الفيض المغناطيسي وأهمية تعامد الشق مع خطوط المجال',
      'اختبار قدرة الرفع الميكانيكية للشوكة (10 lb / 4.5 kg AC)',
      'ملاحظة ظاهرة تسرب الفيض المغناطيسي (Magnetic Flux Leakage) وتجمع الجسيمات',
      'المقارنة بين الجسيمات الجافة الملونة والجسيمات الفلوروسنتية تحت الأشعة فوق البنفسجية UV-A'
    ],
    objectivesEn: [
      'Understand magnetic field flux direction and crack orientation perpendicularity',
      'Verify AC yoke mechanical 10 lb (4.5 kg) lifting power rule',
      'Observe magnetic flux leakage (MFL) attracting fine ferromagnetic particles',
      'Contrast dry color-contrast particles against fluorescent particles under UV-A'
    ],
    blockType: 'mt_yoke',
    defaultVelocity: 0,
    defaultRange: 0,
    defaultGain: 0,
    defaultZero: 0,
    defaultGateStart: 0,
    defaultGateWidth: 0,
    defaultGateThreshold: 0,
    steps: [
      {
        stepNumber: 1,
        titleAr: 'تنشيط الشوكة الكهرومغناطيسية (Energize Yoke)',
        titleEn: 'Energize Electromagnetic Yoke',
        instructionAr: 'اضغط على زر تشغيل المجال المغناطيسي لتوليد فيض مغناطيسي متردد بين قطبي الشوكة.',
        instructionEn: 'Press the trigger to energize the AC coil and establish magnetic flux lines between the yoke poles.',
        targetParameter: 'velocity',
        targetConditionAr: 'الشوكة قيد التشغيل (AC Field Active)',
        targetConditionEn: 'Yoke energized (AC Field Active)',
        hintAr: 'انقر على زر "تنشيط المجال الكهرومغناطيسي".',
        hintEn: 'Click the "Energize Magnetic Field" switch.'
      },
      {
        stepNumber: 2,
        titleAr: 'تطبيق المسحوق المغناطيسي (Apply Particles)',
        titleEn: 'Apply Ferromagnetic Particles',
        instructionAr: 'رش الجسيمات المغناطيسية فوق منطقة الفحص مع بقاء المجال مفعلاً لتتجمع عند الشق.',
        instructionEn: 'Dust magnetic particles across the inspection area while energized to visualize flux leakage.',
        targetParameter: 'gain',
        targetConditionAr: 'تطبيق المسحوق وظهور مؤشر الشق',
        targetConditionEn: 'Particles applied with crack indication formed',
        hintAr: 'انقر على زر "رش المسحوق المغناطيسي (Dust Particles)".',
        hintEn: 'Click the "Apply Magnetic Particles" button.'
      },
      {
        stepNumber: 3,
        titleAr: 'تدوير اتجاه الشق (Crack Angle)',
        titleEn: 'Rotate Defect Orientation',
        instructionAr: 'غير زاوية الشق من التعامد (90°) إلى التوازي (0°) ولاحظ اختفاء مؤشر التسرب تماماً.',
        instructionEn: 'Rotate crack orientation from perpendicular (90°) to parallel (0°) to observe loss of indication.',
        targetParameter: 'position',
        targetConditionAr: 'ملاحظة تأثير زاوية الشق على الفيض المتسرب',
        targetConditionEn: 'Observe flaw angle effect on flux leakage',
        hintAr: 'حرك منزلق زاوية الشق من 90° إلى 0°.',
        hintEn: 'Rotate the defect orientation angle slider.'
      }
    ]
  }
];

export interface CalibrationReportData {
  certificateId: string;
  technicianName: string;
  companyName: string;
  discipline: string;
  experimentTitle: string;
  standard: string;
  date: string;
  equipmentModel: string;
  equipmentSerial: string;
  transducerModel: string;
  transducerFreqMHz: number;
  transducerSizeMm: number;
  transducerAngleDeg: number;
  blockType: string;
  calibratedVelocity: number;
  calibratedZeroDelay: number;
  calibratedGainDb: number;
  referenceEchoFshPercent: number;
  measuredThicknessMm?: number;
  actualThicknessMm?: number;
  errorMm?: number;
  soundPathMm?: number;
  surfaceDistMm?: number;
  defectDepthMm?: number;
  status: 'PASSED' | 'FAILED';
  evaluatorNotesAr: string;
  evaluatorNotesEn: string;
}
