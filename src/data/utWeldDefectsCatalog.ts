export type ExtendedWeldFlawId =
  | 'root_crack'
  | 'transverse_crack'
  | 'haz_underbead_crack'
  | 'crater_star_crack'
  | 'lack_of_fusion'
  | 'interpass_lof'
  | 'root_lof'
  | 'incomplete_penetration'
  | 'slag_inclusion'
  | 'tungsten_inclusion'
  | 'isolated_pore'
  | 'porosity_cluster'
  | 'wormhole_porosity'
  | 'toe_undercut'
  | 'root_concavity'
  | 'base_lamination';

export type DefectFamily = 'cracks' | 'fusion_penetration' | 'volumetric' | 'geometry_lamination';

export interface ComprehensiveDefectSpec {
  id: ExtendedWeldFlawId;
  codeSymbol: string; // e.g., CR-L, CR-T, LOF-SW, IP, SL, POR-C, LAM
  family: DefectFamily;
  name: { ar: string; en: string };
  category: 'Planar' | 'Volumetric';
  locationZone: { ar: string; en: string };
  morphologyShape: { ar: string; en: string };
  nominalDepthRatio: number; // 0.0 (top cap) to 1.0 (bottom root)
  distanceFromWeldCenterMm: number; // X offset from centerline (mm)
  centerYmm: number; // Y position along weld seam (0..100 mm)
  lengthMm: number; // ΔL along weld axis (mm)
  heightMm: number; // Δh through-wall height (mm)
  reflectivityFactor: number; // 0..1
  optimalAngleDeg: number; // 0, 45, 60, 70
  recommendedSkewDeg: number; // 0° (perpendicular to weld) or 90° (parallel to weld)
  directionalSensitivity: 'High (Sharp Specular)' | 'Medium (Semi-Directional)' | 'Low (Omnidirectional)';
  echoWaveformType: 'sharp_spike_tip' | 'clean_specular' | 'jagged_multipeak' | 'dense_cluster' | 'backwall_loss';
  description: { ar: string; en: string };
  nature: { ar: string; en: string };
  echoSignature: { ar: string; en: string };
  beamInteractionNote: { ar: string; en: string };
  rejectionReason: { ar: string; en: string };
  defaultAsmeVerdict: 'REJECT' | 'ACCEPT';
}

export const ALL_WELD_DEFECTS_CATALOG: ComprehensiveDefectSpec[] = [
  // ===================== 1. CRACKS FAMILY (الشروخ المستوية) =====================
  {
    id: 'root_crack',
    codeSymbol: 'CR-R',
    family: 'cracks',
    name: { ar: 'شرخ طولي في جذر اللحام (Root Crack)', en: 'Root Crack (Planar)' },
    category: 'Planar',
    locationZone: { ar: 'جذر اللحام (Root Zone)', en: 'Weld Root Center' },
    morphologyShape: { ar: 'شق رأسي متعرج حاد الحواف يمتد للأعلى من الجذر', en: 'Vertical jagged branched planar fissure from root' },
    nominalDepthRatio: 0.96,
    distanceFromWeldCenterMm: 0.5,
    centerYmm: 50,
    lengthMm: 14.0,
    heightMm: 3.5,
    reflectivityFactor: 0.95,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'sharp_spike_tip',
    description: {
      ar: 'شرخ طولي حاد وخطير يمتد من جذر اللحام للأعلى بسبب إجهادات الانكماش الحراري أو الهيدروجين الحبيسي.',
      en: 'Sharp planar longitudinal crack propagating upward from weld root due to shrinkage stress and hydrogen.',
    },
    nature: {
      ar: 'عيب مستوي (Planar) حاد الحواف يركز الإجهادات بشدة، مرفوض بأي طول في كافة الأكواد الدولية.',
      en: 'Zero-tolerance planar stress concentrator; strictly rejectable at any measurable length.',
    },
    echoSignature: {
      ar: 'قمة حادة عالية السعة من زاوية الجذر (Corner Trap) تسبقها إشارة حيود ضعيفة من قمة الشرخ العلوية (Tip Diffraction).',
      en: 'High-amplitude sharp corner-trap spike preceded by a weak upper crack-tip diffraction echo for Δh sizing.',
    },
    beamInteractionNote: {
      ar: 'عند سقوط كوم الأشعة بزاوية 60° ينحبس الشعاع في الزاوية القائمة بين الشرخ وقاع المعدن فيرتد بشدة، بينما تحيد الحافة العلوية جزءاً صغيراً من الموجة.',
      en: 'A 60° shear cone forms a strong corner trap at the root intersection while the upper tip diffracts a secondary spherical wavelet.',
    },
    rejectionReason: {
      ar: 'مرفوض قطعياً طبقاً لكود ASME Sec VIII (UW-51) و AWS D1.1 لخطر الانهيار الكسري الهش.',
      en: 'Strictly UNACCEPTABLE per ASME Sec VIII Div 1 (UW-51) & AWS D1.1.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'transverse_crack',
    codeSymbol: 'CR-T',
    family: 'cracks',
    name: { ar: 'شرخ عرضي متعامد على اللحام (Transverse Crack)', en: 'Transverse Weld Crack' },
    category: 'Planar',
    locationZone: { ar: 'معدن اللحام والـ HAZ عرضياً', en: 'Transverse Across Weld Crown/Fill' },
    morphologyShape: { ar: 'مستوى كسر عمودي يقطع محور اللحام بزاوية 90°', en: 'Planar fracture perpendicular (90°) to weld axis' },
    nominalDepthRatio: 0.45,
    distanceFromWeldCenterMm: 0.0,
    centerYmm: 50,
    lengthMm: 7.5,
    heightMm: 4.0,
    reflectivityFactor: 0.88,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 90,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'sharp_spike_tip',
    description: {
      ar: 'شرخ يقطع درزة اللحام عرضياً نتيجة الانكماش الطولي المقيد في اللحامات عالية الصلادة.',
      en: 'Planar crack oriented perpendicular to the weld axis caused by longitudinal restraint shrinkage.',
    },
    nature: {
      ar: 'عيب مستوي خطير لا يظهر بالفحص العمودي المعتاد إلا بتوجيه البروب موازياً لخط اللحام (Skew 90°).',
      en: 'Planar fracture invisible to standard 0°-skew scans; requires scanning parallel to the weld seam (Skew 90°).',
    },
    echoSignature: {
      ar: 'صدى حاد يظهر فقط عند تدوير المجس بمحاذاة خط اللحام أو فوق الكاب المجلخ، ويختفي عند الفحص الجانبي العادي.',
      en: 'Sharp narrow spike appearing strongly when probe is skewed parallel/15° to the weld axis.',
    },
    beamInteractionNote: {
      ar: 'لوجه الشرخ المتعامد على محور اللحام، يمر كوم الأشعة الجانبي بموازاته دون انعكاس يُذكر ما لم يُوجَّه المخروط الصوتي طولياً.',
      en: 'Because the crack plane faces along the weld seam, the ultrasonic cone must impinge along the seam axis to reflect back.',
    },
    rejectionReason: {
      ar: 'مرفوض تماماً في كافة الأكواد (ASME UW-51 / AWS D1.1 / API 1104).',
      en: 'Strictly REJECTED across ASME, AWS, and API standards.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'haz_underbead_crack',
    codeSymbol: 'CR-HAZ',
    family: 'cracks',
    name: { ar: 'شرخ تحت الدرزة بمنطقة التأثر الحراري (HAZ Cold Crack)', en: 'HAZ / Underbead Hydrogen Crack' },
    category: 'Planar',
    locationZone: { ar: 'المنطقة المتأثرة بالحرارة (HAZ)', en: 'Heat-Affected Zone (Parent Metal Boundary)' },
    morphologyShape: { ar: 'شق مائل موازٍ لخط الانصهار داخل معدن الأساس المجاور', en: 'Stepped planar crack parallel to fusion boundary inside HAZ' },
    nominalDepthRatio: 0.36,
    distanceFromWeldCenterMm: 7.2,
    centerYmm: 48,
    lengthMm: 15.0,
    heightMm: 3.2,
    reflectivityFactor: 0.91,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'sharp_spike_tip',
    description: {
      ar: 'شرخ بارد متأخر يتكون بعد اللحام بساعات في منطقة الـ HAZ نتيجة اجتماع المارتنسيت الهش والهيدروجين.',
      en: 'Delayed hydrogen-induced cold crack forming in brittle martensitic HAZ microstructure up to 48h post-weld.',
    },
    nature: {
      ar: 'عيب مستوي متدرج الدقيق خلف خط الانصهار مباشرةً، يُكشف بوضوح في المسار الأول أو الثاني (Leg 2).',
      en: 'Fine stepped planar crack outside weld metal in HAZ; typically requires post-weld delay inspection.',
    },
    echoSignature: {
      ar: 'نبضة حادة ذات حواف متدرجة دقيقة تقع على مسافة أفقية X خارج حدود معدن اللحام داخل منطقة الـ HAZ.',
      en: 'High-amplitude sharp spike with fine secondary facets plotting just outside the bevel fusion line in HAZ.',
    },
    beamInteractionNote: {
      ar: 'يرتد جزء كبير من كوم الأشعة الساقط بزاوية 60° أو 70° عن وجه الشرخ المائل مع تشتت طفيف من تفرعاته الميكروسكوبية.',
      en: '60°–70° beam cone intersects the HAZ facet nearly perpendicularly, returning a high-energy echo with micro-tip tails.',
    },
    rejectionReason: {
      ar: 'مرفوض قطعياً في جميع الأكواد الهندسية دون أي تسامح.',
      en: 'Zero tolerance — strictly REJECTED under all codes.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'crater_star_crack',
    codeSymbol: 'CR-ST',
    family: 'cracks',
    name: { ar: 'شرخ الفوهة النجمي المتشعب (Crater / Star Crack)', en: 'Crater / Star Crack' },
    category: 'Planar',
    locationZone: { ar: 'نهاية بركة اللحام العلوية (Arc Stop Crater)', en: 'Weld Pass Crater / Cap Stop' },
    morphologyShape: { ar: 'شروخ شعاعية ثلاثية متشعبة كالنجمة في بؤرة انقطاع القوس', en: 'Multi-branched star-shaped radial shrinkage cracks' },
    nominalDepthRatio: 0.18,
    distanceFromWeldCenterMm: 1.0,
    centerYmm: 62,
    lengthMm: 6.5,
    heightMm: 2.4,
    reflectivityFactor: 0.84,
    optimalAngleDeg: 70,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Medium (Semi-Directional)',
    echoWaveformType: 'sharp_spike_tip',
    description: {
      ar: 'شروخ تجمد ساخنة متشعبة تحدث عند الإيقاف المفاجئ لقوس اللحام دون ملء فوهة النهاية (Crater).',
      en: 'Hot solidification cracks radiating in a star pattern due to abrupt arc termination without crater fill.',
    },
    nature: {
      ar: 'عيب مستوي متفرع لعدة اتجاهات؛ لذا يعكس الموجات من عدة زوايا دوران للمجس (Orbital Swivel).',
      en: 'Multi-directional planar branches reflect ultrasonic energy across multiple probe swivel angles.',
    },
    echoSignature: {
      ar: 'قمتان أو ثلاث قمم حادة متقاربة تتبادل الارتفاع عند عمل دوران مداري (Swivel ±20°) بالمجس بزاوية 70° في Leg 2.',
      en: 'Two to three sharp alternating spikes peaking successively as the probe swivels across star branches.',
    },
    beamInteractionNote: {
      ar: 'بسبب أذرع النجمة المتشعبة، يصطدم كوم الأشعة العريض دائماً بفرع واحد على الأقل بزاوية شبه عمودية.',
      en: 'Because the star arms radiate at multiple angles, the diverging beam cone catches different branches during swivel.',
    },
    rejectionReason: {
      ar: 'مرفوض في ASME و AWS و API لأن أذرع النجمة تنمو سريعاً تحت أحمال التشغيل.',
      en: 'Strictly REJECTED as an active crack initiation site.',
    },
    defaultAsmeVerdict: 'REJECT',
  },

  // ===================== 2. LACK OF FUSION & PENETRATION =====================
  {
    id: 'lack_of_fusion',
    codeSymbol: 'LOF-SW',
    family: 'fusion_penetration',
    name: { ar: 'نقص انصهار جانبي بالشطف (Sidewall LOF)', en: 'Lack of Sidewall Fusion (LOF)' },
    category: 'Planar',
    locationZone: { ar: 'جدار شطف الوصلة المائل (Bevel Face 30°)', en: 'Weld Bevel Sidewall (30° Groove)' },
    morphologyShape: { ar: 'طبقة انفصال مستوية ملساء تماماً منطبقة على زاوية الشطف 30°', en: 'Smooth flat planar separation aligned along 30° bevel wall' },
    nominalDepthRatio: 0.56,
    distanceFromWeldCenterMm: 5.2,
    centerYmm: 48,
    lengthMm: 18.0,
    heightMm: 2.8,
    reflectivityFactor: 0.92,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'clean_specular',
    description: {
      ar: 'فشل معدن اللحام المنصهر في الانصهار الميتالورجي مع جدار الشطف المائل نتيجة انخفاض الحرارة أو الأكاسيد.',
      en: 'Failure of weld metal to fuse metallurgically with the prepared bevel sidewall face.',
    },
    nature: {
      ar: 'عيب مستوي أملس كالمرآة مائل بزاوية 30°؛ يتطلب زاوية شعاع 60° لتسقط عمودية تماماً (90°) على وجهه!',
      en: 'Mirror-like planar defect inclined at 30°; demands a 60° shear wave to achieve 90° normal specular reflection.',
    },
    echoSignature: {
      ar: 'نبضة وحيدة نظيفة جداً وعالية السعة عند زاوية 60°، وتختفي سريعاً لو فُحصت بزاوية غير مناسبة بعيداً عن العمودية.',
      en: 'Single narrow, mirror-clean high-amplitude spike at 60°; drops drastically if scanned off-normal.',
    },
    beamInteractionNote: {
      ar: 'أفضل مثال لتخيل كوم الأشعة: لو سقط الشعاع بزاوية غير متعامدة ينعكس كالمرآة بعيداً عن البروب (خطر عدم الاكتشاف بزاوية خاطئة!).',
      en: 'Classic specular mirror behavior: if the cone central axis is not perpendicular to the bevel, energy reflects away from the probe.',
    },
    rejectionReason: {
      ar: 'مرفوض قطعياً في ASME Sec VIII و AWS D1.1 و API 1104.',
      en: 'Strictly UNACCEPTABLE per ASME Sec VIII, AWS D1.1, and API 1104.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'interpass_lof',
    codeSymbol: 'LOF-IP',
    family: 'fusion_penetration',
    name: { ar: 'نقص انصهار بين باصات اللحام (Inter-run LOF)', en: 'Interpass / Inter-run Lack of Fusion' },
    category: 'Planar',
    locationZone: { ar: 'بين طبقات الإيداع الداخلية (Multi-pass Fill)', en: 'Between Internal Weld Passes' },
    morphologyShape: { ar: 'قوس مستوٍ شبه أفقي يفصل بين طبقتي لحام متتاليتين', en: 'Horizontal/shallow-angled planar laminar disbond between passes' },
    nominalDepthRatio: 0.48,
    distanceFromWeldCenterMm: 2.0,
    centerYmm: 52,
    lengthMm: 16.0,
    heightMm: 1.5,
    reflectivityFactor: 0.82,
    optimalAngleDeg: 45,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'clean_specular',
    description: {
      ar: 'عدم انصهار طبقة اللحام الجديدة مع سطح الطبقة السابقة نتيجة التحدب الزائد للدرزة أو سرعة التقدم العالية.',
      en: 'Lack of fusion between adjacent weld beads in multi-pass welding due to excessive bead convexity.',
    },
    nature: {
      ar: 'عيب مستوي أفقي أو قليل الميل في قلب اللحام؛ يُكشف بزاوية 45° أو المسح القطاعي الواسع PAUT S-Scan.',
      en: 'Shallow-inclined planar defect inside weld volume; best detected with steeper 45° angle or PAUT sectorial sweep.',
    },
    echoSignature: {
      ar: 'صدى حاد متوسط إلى عالي السعة يقع داخل معدن اللحام بعيداً عن جدار الشطف ويقوى عند الزوايا المنخفضة (45°).',
      en: 'Clean narrow echo plotting inside weld fill volume, peaking at 45° rather than 70°.',
    },
    beamInteractionNote: {
      ar: 'نظراً لميله الأفقي، توفر الحافة السفلية لكوم الأشعة بزاوية 45° أو الفحص المباشر من فوق الكاب المجلخ أفضل زاوية انعكاس.',
      en: 'Due to its shallow orientation, 45° shear cones or 0° cap scans capture stronger reflections than shallow 70° rays.',
    },
    rejectionReason: {
      ar: 'مرفوض كعيب مستوي (Planar LOF) طبقاً لـ ASME UW-51 و B31.3.',
      en: 'REJECTED as planar lack of fusion under ASME UW-51 & B31.3.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'root_lof',
    codeSymbol: 'LOF-R',
    family: 'fusion_penetration',
    name: { ar: 'نقص انصهار بحافة الجذر (Root Face LOF)', en: 'Lack of Root Fusion (One-Sided)' },
    category: 'Planar',
    locationZone: { ar: 'أحد جانبي شفة الجذر (Single Root Land)', en: 'One Side of Root Land' },
    morphologyShape: { ar: 'انفصال رأسي على جانب واحد من شفة الجذر مع انصهار الجانب الآخر', en: 'Vertical planar lack of fusion on one root face land' },
    nominalDepthRatio: 0.97,
    distanceFromWeldCenterMm: 1.6,
    centerYmm: 46,
    lengthMm: 13.0,
    heightMm: 2.4,
    reflectivityFactor: 0.89,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'clean_specular',
    description: {
      ar: 'عدم ذوبان إحدى حافتي الجذر بسبب انحراف القوس الكهربائي نحو جانب واحد أو الترحيل (Hi-Lo Misalignment).',
      en: 'Failure of root bead to fuse into one root face due to arc blow, improper electrode aim, or Hi-Lo offset.',
    },
    nature: {
      ar: 'عيب مستوي بالجذر يعطي صدى قوياً جداً من جانب الفحص المقابل له، وقد تحجبه درزة الجذر من الجانب الآخر.',
      en: 'Asymmetric root planar reflector; gives a much stronger corner echo from the unfused side than the opposite side.',
    },
    echoSignature: {
      ar: 'نبضة حادة عند عمق الجذر مع إزاحة جانبية طفيفة عن خط المركز X = +1.6mm وتباين واضح عند الفحص من الجانبين.',
      en: 'Sharp corner echo at root depth D=t shifted slightly off weld centerline (X = +1.6mm).',
    },
    beamInteractionNote: {
      ar: 'يبرهن على أهمية الفحص من كلا جانبي اللحام: كوم الأشعة القادم من جهة الانفصال يصنع Corner Trap مثالي.',
      en: 'Demonstrates why ASME mandates scanning from both sides: the cone from the unfused side hits an unobstructed corner.',
    },
    rejectionReason: {
      ar: 'مرفوض في ASME Sec VIII و B31.3 و AWS D1.1.',
      en: 'REJECTED under ASME Sec VIII, B31.3, and AWS D1.1.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'incomplete_penetration',
    codeSymbol: 'IP / LOP',
    family: 'fusion_penetration',
    name: { ar: 'نقص تغلغل في جذر اللحام (Incomplete Penetration)', en: 'Incomplete Penetration (LOP)' },
    category: 'Planar',
    locationZone: { ar: 'مركز جذر اللحام تماماً (X = 0)', en: 'Exact Weld Root Centerline (X = 0)' },
    morphologyShape: { ar: 'قناة مستطيلة مفتوحة غير مملوءة بمعدن اللحام في قاع الجذر', en: 'Open rectangular unpenetrated root gap channel at X = 0' },
    nominalDepthRatio: 1.0,
    distanceFromWeldCenterMm: 0.0,
    centerYmm: 52,
    lengthMm: 22.0,
    heightMm: 2.5,
    reflectivityFactor: 0.90,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'clean_specular',
    description: {
      ar: 'عدم وصول معدن اللحام إلى قاع الجذر بالكامل بسبب ضيق فتحة الجذر أو كبر قطر سلك اللحام أو ضعف التيار.',
      en: 'Failure of root weld metal to reach the bottom of the joint due to narrow root gap or low current.',
    },
    nature: {
      ar: 'عاكس زاوي متماثل تماماً (Symmetrical Corner Reflector) يظهر بنفس القوة والموقع من يمين ويسار اللحام.',
      en: 'Classic symmetrical corner reflector at X=0, D=t detected equally from both sides of the weld.',
    },
    echoSignature: {
      ar: 'قمة أحادية حادة وعالية السعة عند عمق السماكة الكاملة t وخط المركز X=0 من كلا الجانبين (45° أو 60°).',
      en: 'Strong single sharp spike plotting right at X=0 and D=t from both left and right probe approaches.',
    },
    beamInteractionNote: {
      ar: 'الجداران الرأسيان لشفة الجذر غير المنصهرة مع السطح السفلي يشكلان مصيدة صوتية تعيد كوم الأشعة مباشرةً للمجس.',
      en: 'Unfused vertical root lands form a 90° retro-reflector corner with the bottom plate surface.',
    },
    rejectionReason: {
      ar: 'مرفوض قطعياً في ASME Sec VIII UW-51 و ASME B31.3 (الفئة الحرجة).',
      en: 'Unacceptable under ASME Sec VIII UW-51 and Severe Cyclic B31.3.',
    },
    defaultAsmeVerdict: 'REJECT',
  },

  // ===================== 3. VOLUMETRIC INCLUSIONS & POROSITY =====================
  {
    id: 'slag_inclusion',
    codeSymbol: 'SL-E',
    family: 'volumetric',
    name: { ar: 'شائبة خبث طولية محبوسة (Elongated Slag)', en: 'Elongated Slag Inclusion' },
    category: 'Volumetric',
    locationZone: { ar: 'بين باصات التعبئة وحواف الشطف', en: 'Weld Fill / Toe of Pass' },
    morphologyShape: { ar: 'جسم غير معدني خشن الأوجه ممتد طولياً كالخيط المتعرج', en: 'Irregular multi-faceted elongated non-metallic stringer' },
    nominalDepthRatio: 0.44,
    distanceFromWeldCenterMm: 3.2,
    centerYmm: 45,
    lengthMm: 8.5,
    heightMm: 1.8,
    reflectivityFactor: 0.62,
    optimalAngleDeg: 45,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Low (Omnidirectional)',
    echoWaveformType: 'jagged_multipeak',
    description: {
      ar: 'خبث وأكاسيد بودرة لحام (SMAW/SAW/FCAW) محبوسة بسبب سوء التنظيف وتكسير الخبث بين الطبقات.',
      en: 'Entrapped non-metallic flux/oxide residue left between passes due to inadequate interpass deslagging.',
    },
    nature: {
      ar: 'عيب حجمي ذو أسطح خشنة متعددة يكسر كوم الأشعة ويشتته في جميع الاتجاهات، ويُقيَّم بطوله وسعته.',
      en: 'Volumetric rough scatterer with lower acoustic impedance than steel; evaluated by length and DAC level.',
    },
    echoSignature: {
      ar: 'غلاف صدى عريض مسنن متعدد القمم الفرعية (Jagged Envelope) لا ينهار فجأة عند تدوير المجس مدارياً.',
      en: 'Broad jagged multi-peak envelope maintaining moderate amplitude across multiple viewing angles.',
    },
    beamInteractionNote: {
      ar: 'عندما يغمر كوم الأشعة جسم الخبث غير المنتظم، ترتد موجات جزئية من نتوءاته المختلفة بفروق زمنية دقيقة فتظهر قمم مسننة.',
      en: 'Diffuse scattering from irregular slag facets sends overlapping wavelets back to the transducer, creating a serrated echo.',
    },
    rejectionReason: {
      ar: 'إذا زاد طوله عن 6 مم (لسمك ≤ 19 مم) أو t/3 طبقاً لـ ASME UW-51 يُرفض؛ وهنا L=8.5mm > 6mm فيُرفض ما لم يكن أقصر.',
      en: 'Evaluated by length per ASME UW-51 / App. 12: L=8.5mm exceeds 6.0mm limit -> REJECT (acceptable if L <= 6.0mm).',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'tungsten_inclusion',
    codeSymbol: 'TI',
    family: 'volumetric',
    name: { ar: 'شائبة تنجستن عالية الكثافة (Tungsten Inclusion)', en: 'Dense Tungsten Inclusion (GTAW)' },
    category: 'Volumetric',
    locationZone: { ar: 'باص الجذر أو التعبئة بلحام الأرجون TIG', en: 'GTAW Root / Hot Pass' },
    morphologyShape: { ar: 'حبيبة معدنية صلبة كروية/مدببة عالية الكثافة جداً', en: 'Small dense metallic tungsten droplet embedded in weld' },
    nominalDepthRatio: 0.78,
    distanceFromWeldCenterMm: 1.2,
    centerYmm: 50,
    lengthMm: 3.0,
    heightMm: 1.6,
    reflectivityFactor: 0.56,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Low (Omnidirectional)',
    echoWaveformType: 'jagged_multipeak',
    description: {
      ar: 'انكسار أو ذوبان جزء من قطب التنجستن وغرسه في حوض اللحام أثناء لحام الأرجون (GTAW / TIG).',
      en: 'Fragment of tungsten electrode dipped or melted into the weld pool during GTAW/TIG welding.',
    },
    nature: {
      ar: 'شائبة حجمية قصيرة جداً ذات ممانعة صوتية أعلى بكثير من الفولاذ (عكس المسام والخبث).',
      en: 'Isolated volumetric particle with much higher acoustic impedance than steel; short localized indication.',
    },
    echoSignature: {
      ar: 'نبضة نقطية قصيرة المدى متماثلة من جميع الاتجاهات تسقط سعتها سريعاً فور تحريك المجس على المحور Y.',
      en: 'Localized point-reflector echo visible from all angles, dropping rapidly over a 3mm Y-scan span.',
    },
    beamInteractionNote: {
      ar: 'يعمل كعاكس نقطي داخل كوم الأشعة (أصغر من عرض المخروط الصوتي)، لذا يقيس عرض الإشارة عرض المخروط ما لم ننتبه!',
      en: 'Smaller than the beam cone width; apparent -6dB scan width reflects beam spread unless sized carefully.',
    },
    rejectionReason: {
      ar: 'مقبول في ASME UW-51 كشائبة معزولة صغيرة (L = 3.0 مم ≤ 6.0 مم وسعتها معتدلة).',
      en: 'ACCEPTABLE under ASME UW-51 as a small isolated volumetric inclusion (L = 3.0mm <= 6.0mm).',
    },
    defaultAsmeVerdict: 'ACCEPT',
  },
  {
    id: 'isolated_pore',
    codeSymbol: 'POR-I',
    family: 'volumetric',
    name: { ar: 'فجوة غازية كروية منفردة (Isolated Gas Pore)', en: 'Isolated Spherical Gas Pore' },
    category: 'Volumetric',
    locationZone: { ar: 'وسط معدن اللحام', en: 'Mid-Weld Deposit' },
    morphologyShape: { ar: 'فقاعة كروية ملساء مملوءة بالغاز محبوسة أثناء التجمد', en: 'Smooth spherical gas cavity trapped in weld metal' },
    nominalDepthRatio: 0.50,
    distanceFromWeldCenterMm: 0.8,
    centerYmm: 50,
    lengthMm: 2.8,
    heightMm: 2.5,
    reflectivityFactor: 0.45,
    optimalAngleDeg: 45,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Low (Omnidirectional)',
    echoWaveformType: 'jagged_multipeak',
    description: {
      ar: 'فقاعة غاز مفردة (هيدروجين أو نيتروجين أو CO) حُبست قبل صعودها للسطح بسبب سرعة التجمد.',
      en: 'Single spherical gas bubble trapped during solidification due to moisture or shielding disturbance.',
    },
    nature: {
      ar: 'عاكس كروي يشتت معظم الطاقة الصوتية بعيداً ويعيد جزءاً صغيراً متساوياً من كافة الزوايا.',
      en: 'Spherical acoustic scatterer reflecting a small fraction of incident energy omnidirectionally.',
    },
    echoSignature: {
      ar: 'قمة نظيفة ولكن منخفضة السعة نسبياً (غالباً تحت 50% DAC) ثابتة الشكل عند الدوران حولها 360°.',
      en: 'Low-to-moderate smooth single echo largely invariant during 360° orbital probe rotation.',
    },
    beamInteractionNote: {
      ar: 'تشتت الكرة الغازية كوم الأشعة في محيط 360° كالمصباح الكروي فلا يعود للبروب إلا الشعاع الساقط على قطبها المقابل.',
      en: 'Convex spherical surface diverges the incident cone outward in 3D, returning weak omnidirectional energy.',
    },
    rejectionReason: {
      ar: 'مقبول في ASME Sec VIII و AWS D1.1 لطالما كان معزولاً وصغير القطر ودون عتبة التقييم الحرجة.',
      en: 'ACCEPTABLE isolated porosity within ASME Sec VIII & AWS D1.1 size limits.',
    },
    defaultAsmeVerdict: 'ACCEPT',
  },
  {
    id: 'porosity_cluster',
    codeSymbol: 'POR-C',
    family: 'volumetric',
    name: { ar: 'عنقود مسامات غازية متجمعة (Cluster Porosity)', en: 'Porosity Cluster (Gas Cavities)' },
    category: 'Volumetric',
    locationZone: { ar: 'بداية أو نهاية الدرزة / اضطراب الغاز الواقي', en: 'Start/Stop Zone Weld Fill' },
    morphologyShape: { ar: 'تجمع عنقودي لعدة فقاعات غازية كروية صغيرة متقاربة', en: 'Localized 3D cluster of multiple fine spherical gas pores' },
    nominalDepthRatio: 0.52,
    distanceFromWeldCenterMm: 1.0,
    centerYmm: 55,
    lengthMm: 5.0,
    heightMm: 2.2,
    reflectivityFactor: 0.48,
    optimalAngleDeg: 45,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Low (Omnidirectional)',
    echoWaveformType: 'dense_cluster',
    description: {
      ar: 'مجموعة فقاعات غازية متجاورة نتجت عن انقطاع مؤقت لغاز الحماية أو رطوبة غلاف الإلكترود.',
      en: 'Localized group of gas pores caused by wind draft disrupting shielding gas or damp electrode flux.',
    },
    nature: {
      ar: 'عيب حجمي مشتت؛ تتداخل الموجات المرتدة من كل فقاعة فتصنع مجموعة نبضات متراقصة.',
      en: 'Volumetric cluster producing constructive/destructive interference between closely spaced pores.',
    },
    echoSignature: {
      ar: 'حزمة من القمم الصغيرة المتلاحقة (Cluster / Grass-like peaks) تتراقص سعتها مع أقل حركة للبروب.',
      en: 'Multiple closely spaced dancing peaks of low-to-medium height flickering as probe translates.',
    },
    beamInteractionNote: {
      ar: 'يحتوي كوم الأشعة الواحد على عدة فقاعات في آنٍ واحد فتصل أصداء متقاربة المسار الصوتي تتداخل على الشاشة.',
      en: 'The ultrasonic cone illuminates multiple pores simultaneously, returning a train of closely spaced echoes.',
    },
    rejectionReason: {
      ar: 'مقبول في ASME Sec VIII إذا كانت السعة أقل من 100% DAC والطول الكلي للعنقود ≤ 6 مم.',
      en: 'ACCEPTABLE under ASME Sec VIII when below reference DAC and cluster length <= 6.0mm.',
    },
    defaultAsmeVerdict: 'ACCEPT',
  },
  {
    id: 'wormhole_porosity',
    codeSymbol: 'POR-W',
    family: 'volumetric',
    name: { ar: 'مسامية أنبوبية دودية ممتدة (Wormhole / Piping)', en: 'Piping / Wormhole Porosity' },
    category: 'Volumetric',
    locationZone: { ar: 'تمتد مائلة من الجذر باتجاه منتصف اللحام', en: 'Root-to-Mid-Weld Solidification Front' },
    morphologyShape: { ar: 'فجوة غازية أسطوانية طويلة تشبه الأنبوب أو الدودة باتجاه التجمد', en: 'Elongated tubular gas cavity following dendritic solidification' },
    nominalDepthRatio: 0.72,
    distanceFromWeldCenterMm: 2.2,
    centerYmm: 50,
    lengthMm: 11.0,
    heightMm: 3.6,
    reflectivityFactor: 0.70,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Medium (Semi-Directional)',
    echoWaveformType: 'jagged_multipeak',
    description: {
      ar: 'فجوة غازية أنبوبية مستطيلة نمت مع جبهة تجمد المعدن بسبب تلوث سطح الجذر بالزيت أو الصدأ أو الرطوبة.',
      en: 'Elongated tubular gas cavity growing along solidification dendrites due to wet/contaminated root joint.',
    },
    nature: {
      ar: 'أخطر أشكال المسامية لأن جانبها الأسطواني يعمل كعاكس أسطواني (مثل ثقب SDH!) عند التعامد عليه.',
      en: 'Semi-directional tubular cavity; its cylindrical wall reflects strongly like an SDH when hit broadside.',
    },
    echoSignature: {
      ar: 'نبضة متوسطة إلى عالية السعة عند السقوط العمودي على جانب الأنبوب مع ذيل ترددي ثانوي.',
      en: 'Stronger echo than spherical pores when hit perpendicular to cylinder axis, often exceeding 50%–100% DAC.',
    },
    beamInteractionNote: {
      ar: 'إذا سقط كوم الأشعة عمودياً على طول الأنبوب الدودي ينعكس بقوة، أما إذا سقط على رأسه فيتشتت بضعف.',
      en: 'Broadside impingement of the cone on the tubular wall yields high specular-cylindrical reflection.',
    },
    rejectionReason: {
      ar: 'مرفوض هنا لتجاوز الطول المتراكم الحد المسموح (11 مم > 6 مم) في ASME UW-51 / API 1104.',
      en: 'REJECTED when aligned/piping cavity length (11mm) exceeds 6mm ASME limit.',
    },
    defaultAsmeVerdict: 'REJECT',
  },

  // ===================== 4. GEOMETRIC PROFILE & BASE-METAL LAMINATION =====================
  {
    id: 'toe_undercut',
    codeSymbol: 'UC-T',
    family: 'geometry_lamination',
    name: { ar: 'نحر سطحي عند حرف الكاب (Cap Toe Undercut)', en: 'Toe Undercut (Surface Groove)' },
    category: 'Planar',
    locationZone: { ar: 'التقاء حافة الكاب العلوي بمعدن الأساس', en: 'Top Weld Cap Toe Junction' },
    morphologyShape: { ar: 'أخدود محفور في المعدن الأصلي بمحاذاة حافة الغطاء العلوي', en: 'Surface notch/groove melted along upper weld cap toe' },
    nominalDepthRatio: 0.08,
    distanceFromWeldCenterMm: 9.0,
    centerYmm: 50,
    lengthMm: 12.0,
    heightMm: 1.8,
    reflectivityFactor: 0.76,
    optimalAngleDeg: 70,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Medium (Semi-Directional)',
    echoWaveformType: 'clean_specular',
    description: {
      ar: 'أخدود سطحي ناتج عن التيار العالي أو طول القوس الزائد أدى لذوبان حافة المعدن الأصلي دون امتلائها.',
      en: 'Groove melted into base metal adjacent to weld cap toe due to excessive voltage/current and travel speed.',
    },
    nature: {
      ar: 'عيب هندسي سطحي يركز الإجهادات، يُفحص صوتياً عبر ارتداد القفزة الكاملة (Leg 2 Full-Skip) بزاوية 70°.',
      en: 'Top-surface geometric notch detected ultrasonically in Leg 2 (Full-Skip) at depth D ≈ 0–2mm.',
    },
    echoSignature: {
      ar: 'صدى يظهر في المسار الثاني (Leg 2) عند مسافة أفقية تساوي نصف عرض الكاب (+9 مم)، ويجب تمييزه عن حافة الكاب الطبيعية.',
      en: 'Leg 2 corner reflection at X = +9mm near D ≈ 1.8mm; verified by finger-damping test on weld toe.',
    },
    beamInteractionNote: {
      ar: 'يرتد كوم الأشعة عن قاع اللوح أولاً (Half-Skip) ثم يصعد في Leg 2 ليصطدم بأخدود النحر العلوي.',
      en: 'The ultrasonic cone bounces off the bottom wall first, expanding in width as Leg 2 illuminates the upper weld toe.',
    },
    rejectionReason: {
      ar: 'مرفوض لتجاوز عمق النحر (1.8 مم) الحد الأقصى المسموح (0.8 - 1.0 مم) في AWS D1.1 و ASME B31.3.',
      en: 'REJECTED because undercut depth (1.8mm) exceeds the 1.0mm (1/32 in.) code maximum.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'root_concavity',
    codeSymbol: 'RC / SB',
    family: 'geometry_lamination',
    name: { ar: 'تقعر وانكماش جذر اللحام (Root Concavity / Suck-back)', en: 'Root Concavity (Suck-Back)' },
    category: 'Volumetric',
    locationZone: { ar: 'السطح الداخلي لجذر الأنبوب (ID Root)', en: 'Internal Pipe Root Surface (ID)' },
    morphologyShape: { ar: 'انخفاض مقعر أملس منحني للداخل في درزة الجذر', en: 'Smooth curved inward meniscus depression along weld root' },
    nominalDepthRatio: 0.94,
    distanceFromWeldCenterMm: 0.0,
    centerYmm: 50,
    lengthMm: 14.0,
    heightMm: 1.9,
    reflectivityFactor: 0.68,
    optimalAngleDeg: 60,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'Medium (Semi-Directional)',
    echoWaveformType: 'jagged_multipeak',
    description: {
      ar: 'انسحاب بركة معدن الجذر للأعلى بفعل الانكماش أو ضغط غاز التطهير الداخلي في لحام المواسير.',
      en: 'Inward depression of the root bead caused by shrinkage surface tension or excessive internal purge pressure.',
    },
    nature: {
      ar: 'عيب هندسي ذو سطح منحني أملس (وليس حاداً كالشرخ) يقلل السمك الفعلي للجدار عند الجذر.',
      en: 'Smooth contoured geometric root groove reducing net wall thickness; less sharp than IP or root crack.',
    },
    echoSignature: {
      ar: 'صدى متوسط السعة أعرض قليلاً من صدى الشرخ عند X=0 وعمق أقل بمقدار 1.5 مم من السطح الداخلي.',
      en: 'Smooth rounded root echo plotting slightly above full thickness (D ≈ t - 1.5mm) at centerline.',
    },
    beamInteractionNote: {
      ar: 'الانحناء المقعر يعمل كعدسة صوتية تشتت أو تركز جزءاً من كوم الأشعة بشكل أنعم من الزاوية الحادة لنقص التغلغل.',
      en: 'Smooth concave meniscus reflects a broader, gentler pulse than a sharp 90° incomplete penetration land.',
    },
    rejectionReason: {
      ar: 'مرفوض في حال قلّ صافي سمك اللحام عن سمك المعدن الأصلي الأدنى طبقاً لـ ASME B31.3 / API 1104.',
      en: 'REJECTED when root depression reduces net weld thickness below minimum design wall thickness.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
  {
    id: 'base_lamination',
    codeSymbol: 'LAM',
    family: 'geometry_lamination',
    name: { ar: 'تصفيح/تورق المعدن الأساسي (Base-Metal Lamination)', en: 'Base-Metal Rolling Lamination' },
    category: 'Planar',
    locationZone: { ar: 'منتصف سمك معدن اللوح الأساسي (Parent Plate)', en: 'Mid-Thickness of Parent Steel Plate' },
    morphologyShape: { ar: 'طبقة انفصال أفقية عريضة موازية تماماً لسطح اللوح نتيجة الدرفلة', en: 'Wide flat horizontal laminar separation parallel to rolled plate surface' },
    nominalDepthRatio: 0.50,
    distanceFromWeldCenterMm: 24.0,
    centerYmm: 50,
    lengthMm: 28.0,
    heightMm: 0.8,
    reflectivityFactor: 0.96,
    optimalAngleDeg: 0,
    recommendedSkewDeg: 0,
    directionalSensitivity: 'High (Sharp Specular)',
    echoWaveformType: 'backwall_loss',
    description: {
      ar: 'انفصال مسطح داخل اللوح الفولاذي نتج عن فرد الفجوات والشوائب أثناء درفلة الصاج في مصنع الحديد، ويحجب شعاع الزاوية عن الوصول للحام!',
      en: 'Flat internal plate separation rolled out during steel mill manufacturing; blocks angle beams from reaching the weld!',
    },
    nature: {
      ar: 'يجب فحص منطقة حركة المجس أولاً بمجس رأسي 0° (Straight Beam Scan) قبل فحص اللحام بالزاوية لاكتشاف التصفيح!',
      en: 'Mandatory pre-weld scan target using a 0° normal probe; intercepts and reflects 0° longitudinal waves completely.',
    },
    echoSignature: {
      ar: 'بمجس 0°: ظهور صدى قوي جداً عند منتصف السمك (t/2) مع اختفاء كامل لصدى القاع الأصلي (Loss of Backwall Echo)!',
      en: 'With 0° probe: strong spike at mid-thickness (D = 0.5t) accompanied by total drop-out of the backwall echo.',
    },
    beamInteractionNote: {
      ar: 'لاكتشاف التصفيح نستخدم كوم أشعة رأسي 0° فيرتد 100% عن صفيحة التورق، بينما يعترض التصفيح مسار الأشعة المائلة ويضلل الفاحص!',
      en: 'A 0° vertical cone reflects 100% off the horizontal lamination; an angled shear cone gets trapped above the lamination.',
    },
    rejectionReason: {
      ar: 'يُرفض اللوح أو يُعدّل مسار الفحص إذا حجب التصفيح منطقة المسح طبقاً لـ ASTM A435 / ASME Sec V T-472.',
      en: 'Plate scan zone rejected or requires alternate procedure per ASTM A435 & ASME Sec V Art. 4.',
    },
    defaultAsmeVerdict: 'REJECT',
  },
];

export interface NearFieldZoneAssessment {
  zone: 'near_field' | 'transition_focus' | 'far_field';
  ratioSOverN: number;
  isUnreliableAmplitudeZone: boolean;
  badgeText: { ar: string; en: string };
  advisory: { ar: string; en: string };
}

export interface UltrasonicBeamConeMetrics {
  wavelengthMm: number;
  nearFieldLengthMm: number;
  wedgeTravelMm: number;
  wedgeVelocityMs: number;
  wedgeEquivalentSteelMm: number;
  effectiveNearFieldInSpecimenMm: number;
  farFieldStartMm: number;
  halfAngleMinus6dBDeg: number;
  halfAngleMinus20dBDeg: number;
  effectiveApertureMm: number;
  focalWaistWidthMm: number;
  width6dBAtDepthMm: (soundPathMm: number) => number;
  width20dBAtDepthMm: (soundPathMm: number) => number;
  axialPressureAtPath: (soundPathMm: number) => number;
  evaluateNearFieldZone: (soundPathMm: number) => NearFieldZoneAssessment;
}

/**
 * Computes exact physical ultrasonic radiation cone ("كوم الأشعة") & Near-Field (Fresnel) parameters:
 * - Wavelength lambda = V / f
 * - Total Near-Field Fresnel length N = D^2 * f / (4 * V) = D^2 / (4 * lambda)
 * - Wedge Equivalent Steel Path = L_w * (V_wedge / V_specimen)
 * - Effective Near Field inside Specimen N_eff = max(0, N - WedgeEquivalentPath)
 * - -6 dB Sizing Cone Half-Angle = arcsin(0.514 * lambda / D)
 * - -20 dB Edge Cone Half-Angle = arcsin(1.22 * lambda / D)
 */
export function computeUltrasonicBeamCone(params: {
  frequencyMhz: number;
  velocityMs: number;
  crystalDiameterMm?: number;
  wedgeTravelMm?: number;
  wedgeVelocityMs?: number;
  isPaut?: boolean;
  pautApertureElements?: number;
  pautPitchMm?: number;
  pautFocalDepthMm?: number;
}): UltrasonicBeamConeMetrics {
  const freqHz = Math.max(0.5, params.frequencyMhz) * 1e6;
  const velMs = Math.max(1500, params.velocityMs);
  const wavelengthMm = (velMs / freqHz) * 1000;

  const effectiveApertureMm = params.isPaut
    ? Math.max(6, (params.pautApertureElements ?? 32) * (params.pautPitchMm ?? 0.6))
    : Math.max(4, params.crystalDiameterMm ?? 10);

  // Near field N = D^2 / (4 * lambda) = D^2 * f / (4 * V)
  const nearFieldLengthMm = (effectiveApertureMm * effectiveApertureMm) / (4 * wavelengthMm);

  // Perspex/Rexolite wedge consumes part of the Near Field before beam enters steel
  const wedgeTravelMm = Math.max(0, params.wedgeTravelMm ?? 0);
  const wedgeVelocityMs = Math.max(2000, params.wedgeVelocityMs ?? 2730);
  const wedgeEquivalentSteelMm = wedgeTravelMm * (wedgeVelocityMs / velMs);
  const effectiveNearFieldInSpecimenMm = Math.max(0, nearFieldLengthMm - wedgeEquivalentSteelMm);
  const farFieldStartMm = effectiveNearFieldInSpecimenMm > 0 ? effectiveNearFieldInSpecimenMm : nearFieldLengthMm;

  const sin6dB = Math.min(0.65, (0.514 * wavelengthMm) / effectiveApertureMm);
  const sin20dB = Math.min(0.88, (1.22 * wavelengthMm) / effectiveApertureMm);

  const halfAngleMinus6dBDeg = (Math.asin(sin6dB) * 180) / Math.PI;
  const halfAngleMinus20dBDeg = (Math.asin(sin20dB) * 180) / Math.PI;

  const tan6 = Math.tan((halfAngleMinus6dBDeg * Math.PI) / 180);
  const tan20 = Math.tan((halfAngleMinus20dBDeg * Math.PI) / 180);

  const focalDist = params.isPaut ? Math.min(nearFieldLengthMm, params.pautFocalDepthMm ?? 20) : nearFieldLengthMm;
  const focalWaistWidthMm = Math.max(1.2, (1.02 * wavelengthMm * focalDist) / effectiveApertureMm);

  const width6dBAtDepthMm = (soundPathMm: number) => {
    const s = Math.max(0, soundPathMm);
    if (params.isPaut && params.pautFocalDepthMm) {
      const f = params.pautFocalDepthMm;
      if (s <= f) {
        const ratio = s / Math.max(1, f);
        return effectiveApertureMm * (1 - ratio) + focalWaistWidthMm * ratio;
      }
      return focalWaistWidthMm + 2 * (s - f) * tan6;
    }
    if (s <= nearFieldLengthMm) {
      const ratio = s / Math.max(1, nearFieldLengthMm);
      return effectiveApertureMm * (1 - 0.35 * ratio);
    }
    return effectiveApertureMm * 0.65 + 2 * (s - nearFieldLengthMm) * tan6;
  };

  const width20dBAtDepthMm = (soundPathMm: number) => {
    const s = Math.max(0, soundPathMm);
    if (s <= nearFieldLengthMm * 0.6) {
      return effectiveApertureMm * 1.05;
    }
    return effectiveApertureMm * 0.85 + 2 * Math.max(0, s - nearFieldLengthMm * 0.6) * tan20;
  };

  const axialPressureAtPath = (specimenSoundPathMm: number) => {
    const sEq = Math.max(0.8, specimenSoundPathMm + wedgeEquivalentSteelMm);
    const n = Math.max(1, nearFieldLengthMm);
    const phase = (Math.PI * n) / (2 * sEq);
    if (sEq < n) {
      return Math.max(0.12, Math.abs(Math.sin(phase)));
    }
    return Math.min(1, Math.abs(Math.sin(phase)));
  };

  const evaluateNearFieldZone = (specimenSoundPathMm: number): NearFieldZoneAssessment => {
    const s = Math.max(0, specimenSoundPathMm);
    const nSpec = effectiveNearFieldInSpecimenMm;
    const refN = Math.max(0.5, nSpec > 0 ? nSpec : nearFieldLengthMm);
    const ratio = s / refN;

    if (nSpec > 0 && s > 0 && s <= nSpec) {
      return {
        zone: 'near_field',
        ratioSOverN: Number(ratio.toFixed(2)),
        isUnreliableAmplitudeZone: true,
        badgeText: {
          ar: `▲ داخل المجال القريب Fresnel (S = ${s.toFixed(1)} ≤ N_eff = ${nSpec.toFixed(1)} مم)`,
          en: `▲ INSIDE NEAR FIELD (S = ${s.toFixed(1)} ≤ N_eff = ${nSpec.toFixed(1)} mm)`,
        },
        advisory: {
          ar: 'تحذير فيزيائي: العيب يقع داخل منطقة التداخل البناء والهدام (Near Field)؛ تتذبذب سعة الصدى بشدة ولا يُعتمد على تقييم السعة DAC هنا إلا باستخدام المسار الثاني (Leg 2) أو تقليل التردد/قطر البلورة أو تبئير PAUT.',
          en: 'Fresnel Interference Warning: Reflector lies inside the Near Field where constructive/destructive wave interference causes erratic amplitude swings. Use Full-Skip Leg 2, smaller crystal/lower freq, or PAUT electronic focus.',
        },
      };
    }

    if (s > nSpec && s <= nSpec * 1.25 && nSpec > 0) {
      return {
        zone: 'transition_focus',
        ratioSOverN: Number(ratio.toFixed(2)),
        isUnreliableAmplitudeZone: false,
        badgeText: {
          ar: `◆ بؤرة الانتقال الطبيعية Y₀⁺ (S = ${s.toFixed(1)} مم ≈ N_eff)`,
          en: `◆ NATURAL FOCUS TRANSITION Y₀⁺ (S = ${s.toFixed(1)} mm ≈ N_eff)`,
        },
        advisory: {
          ar: 'العيب عند نهاية المجال القريب وبداية المجال البعيد (أعلى ضغط صوتي محوري طبيعي وأدق عرض للحزمة قبل التشتت).',
          en: 'Reflector sits right at the Fresnel-to-Fraunhofer transition peak (maximum natural axial sensitivity and minimum beam waist).',
        },
      };
    }

    return {
      zone: 'far_field',
      ratioSOverN: Number(ratio.toFixed(2)),
      isUnreliableAmplitudeZone: false,
      badgeText: {
        ar: `● المجال البعيد الآمن Fraunhofer (S = ${s.toFixed(1)} > N_eff = ${nSpec.toFixed(1)} مم)`,
        en: `● SAFE FAR FIELD ZONE (S = ${s.toFixed(1)} > N_eff = ${nSpec.toFixed(1)} mm)`,
      },
      advisory: {
        ar: 'منطقة فرانهوفر القياسية: يتناقص الضغط الصوتي بانتظام مع المسافة بدون تذبذب تداخلي، مما يجعل تقييم السعة بمنحنى DAC / TCG وقياس -6dB دقيقاً ومعتمداً.',
        en: 'Fraunhofer Far-Field Zone: Acoustic pressure decays smoothly with distance without interference nulls — DAC/TCG amplitude sizing is 100% valid.',
      },
    };
  };

  return {
    wavelengthMm,
    nearFieldLengthMm,
    wedgeTravelMm,
    wedgeVelocityMs,
    wedgeEquivalentSteelMm,
    effectiveNearFieldInSpecimenMm,
    farFieldStartMm,
    halfAngleMinus6dBDeg,
    halfAngleMinus20dBDeg,
    effectiveApertureMm,
    focalWaistWidthMm,
    width6dBAtDepthMm,
    width20dBAtDepthMm,
    axialPressureAtPath,
    evaluateNearFieldZone,
  };
}

/**
 * Draws anatomically distinct 2D cross-section morphology for all 16 weld & parent-metal defects.
 */
export function drawComprehensiveDefectMorphology(
  ctx: CanvasRenderingContext2D,
  flawId: ExtendedWeldFlawId,
  x: number,
  y: number,
  topY: number,
  bottomY: number,
  scale: number,
  isHit: boolean
): void {
  ctx.save();
  if (isHit) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
  }

  switch (flawId) {
    case 'root_crack': {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(x, bottomY);
      ctx.lineTo(x - 0.9 * scale, bottomY - 1.8 * scale);
      ctx.lineTo(x + 0.7 * scale, bottomY - 3.3 * scale);
      ctx.lineTo(x - 0.4 * scale, bottomY - 4.8 * scale);
      ctx.stroke();
      // Fine secondary micro-branch
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - 0.9 * scale, bottomY - 1.8 * scale);
      ctx.lineTo(x - 2.1 * scale, bottomY - 2.9 * scale);
      ctx.stroke();
      break;
    }
    case 'transverse_crack': {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x - 2.6 * scale, y - 2.2 * scale);
      ctx.lineTo(x - 0.6 * scale, y - 0.4 * scale);
      ctx.lineTo(x + 1.2 * scale, y + 0.6 * scale);
      ctx.lineTo(x + 2.6 * scale, y + 2.2 * scale);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - 3 * scale, y - 2.6 * scale, 6 * scale, 5.2 * scale);
      break;
    }
    case 'haz_underbead_crack': {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x - 1.6 * scale, y - 3.2 * scale);
      ctx.lineTo(x - 0.5 * scale, y - 1.0 * scale);
      ctx.lineTo(x + 0.8 * scale, y + 1.2 * scale);
      ctx.lineTo(x + 1.8 * scale, y + 3.2 * scale);
      ctx.stroke();
      break;
    }
    case 'crater_star_crack': {
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2.2;
      for (let arm = 0; arm < 6; arm++) {
        const ang = (arm * Math.PI) / 3 + 0.25;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * 2.8 * scale, y + Math.sin(ang) * 2.4 * scale);
        ctx.stroke();
      }
      break;
    }
    case 'lack_of_fusion': {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(x - 1.9 * scale, y - 3.5 * scale);
      ctx.lineTo(x + 1.9 * scale, y + 3.5 * scale);
      ctx.stroke();
      break;
    }
    case 'interpass_lof': {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(x - 3.4 * scale, y + 0.5 * scale);
      ctx.quadraticCurveTo(x, y - 1.4 * scale, x + 3.4 * scale, y + 0.5 * scale);
      ctx.stroke();
      break;
    }
    case 'root_lof': {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(x, bottomY);
      ctx.lineTo(x + 1.4 * scale, bottomY - 3.4 * scale);
      ctx.stroke();
      break;
    }
    case 'incomplete_penetration': {
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.fillRect(x - 1.8 * scale, bottomY - 3.0 * scale, 3.6 * scale, 3.0 * scale);
      ctx.strokeRect(x - 1.8 * scale, bottomY - 3.0 * scale, 3.6 * scale, 3.0 * scale);
      break;
    }
    case 'slag_inclusion': {
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 3.0 * scale, y);
      ctx.lineTo(x - 1.4 * scale, y - 1.6 * scale);
      ctx.lineTo(x + 1.6 * scale, y - 1.2 * scale);
      ctx.lineTo(x + 3.0 * scale, y + 0.4 * scale);
      ctx.lineTo(x + 0.8 * scale, y + 1.7 * scale);
      ctx.lineTo(x - 1.8 * scale, y + 1.3 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'tungsten_inclusion': {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x, y, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'isolated_pore': {
      ctx.fillStyle = '#0ea5e9';
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y, 1.9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'porosity_cluster': {
      ctx.fillStyle = '#38bdf8';
      for (const [ox, oy, r] of [
        [-1.9, -0.8, 1.05],
        [1.1, -1.6, 0.95],
        [0, 0.6, 1.15],
        [-0.9, 1.8, 0.9],
        [1.9, 0.9, 1.0],
        [0.2, -0.8, 0.8],
      ]) {
        ctx.beginPath();
        ctx.arc(x + ox * scale, y + oy * scale, r * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'wormhole_porosity': {
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, y, 1.3 * scale, 3.6 * scale, -0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'toe_undercut': {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(x - 2.2 * scale, topY);
      ctx.quadraticCurveTo(x, topY + 3.0 * scale, x + 2.2 * scale, topY);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'root_concavity': {
      ctx.fillStyle = '#050814';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x - 3.2 * scale, bottomY + 1.5 * scale);
      ctx.quadraticCurveTo(x, bottomY - 3.2 * scale, x + 3.2 * scale, bottomY + 1.5 * scale);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'base_lamination': {
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(x - 8.5 * scale, y);
      ctx.lineTo(x + 8.5 * scale, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 6.5 * scale, y + 1.2 * scale);
      ctx.lineTo(x + 5.5 * scale, y + 1.2 * scale);
      ctx.stroke();
      break;
    }
  }

  if (isHit) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export type UltrasonicWaveMode = 'longitudinal' | 'shear';
export type UltrasonicReflectionRegime = 'auto' | 'full' | 'partial';

export interface UltrasonicRayReflectionBreakdown {
  regime: 'backwall_full' | 'flaw_full' | 'flaw_partial';
  incidentPct: number;
  reflectedToProbePct: number;
  reflectedOffAxisPct: number;
  transmittedBypassPct: number;
  shadowZoneActive: boolean;
  summaryLabel: { ar: string; en: string };
}

export function computeRayReflectionBreakdown(params: {
  isHit: boolean;
  beamOcclusionRatio?: number;
  scatterMode?: 'specular_planar' | 'corner_trap' | 'volumetric_scatter' | 'tip_diffraction' | 'lamination';
  angleDiffDeg?: number;
  isStraightZeroBeam?: boolean;
  regimeOverride?: UltrasonicReflectionRegime;
}): UltrasonicRayReflectionBreakdown {
  const {
    isHit,
    beamOcclusionRatio = 0.65,
    scatterMode = 'specular_planar',
    angleDiffDeg = 0,
    isStraightZeroBeam = false,
    regimeOverride = 'auto',
  } = params;

  if (!isHit) {
    if (isStraightZeroBeam) {
      return {
        regime: 'backwall_full',
        incidentPct: 100,
        reflectedToProbePct: 100,
        reflectedOffAxisPct: 0,
        transmittedBypassPct: 0,
        shadowZoneActive: false,
        summaryLabel: {
          ar: 'ارتداد كلي 100% من القاع للمجس (حدود فولاذ / هواء)',
          en: '100% Full Backwall Reflection to Probe (Steel/Air Interface)',
        },
      };
    }
    return {
      regime: 'backwall_full',
      incidentPct: 100,
      reflectedToProbePct: 0,
      reflectedOffAxisPct: 100,
      transmittedBypassPct: 0,
      shadowZoneActive: false,
      summaryLabel: {
        ar: 'ارتداد مرآوي كلي 100% من القاع نحو المسار الثاني (Leg 2)',
        en: '100% Full Specular Backwall Bounce (Leg 1 → Leg 2)',
      },
    };
  }

  const occlusion = Math.max(0.18, Math.min(1.0, beamOcclusionRatio));
  const absAngleDiff = Math.abs(angleDiffDeg);

  const autoIsFull =
    (scatterMode === 'lamination' && occlusion >= 0.72) ||
    (scatterMode === 'corner_trap' && occlusion >= 0.78 && absAngleDiff <= 14) ||
    occlusion >= 0.88;

  const isFull =
    regimeOverride === 'full' ? true : regimeOverride === 'partial' ? false : autoIsFull;

  if (isFull) {
    const directAlignment =
      scatterMode === 'corner_trap' || scatterMode === 'lamination'
        ? Math.max(0.76, 1 - absAngleDiff / 80)
        : Math.max(0.42, 1 - absAngleDiff / 42);
    const reflectedToProbePct = Math.min(100, Math.max(40, Math.round(100 * directAlignment)));
    const reflectedOffAxisPct = 100 - reflectedToProbePct;
    return {
      regime: 'flaw_full',
      incidentPct: 100,
      reflectedToProbePct,
      reflectedOffAxisPct,
      transmittedBypassPct: 0,
      shadowZoneActive: true,
      summaryLabel: {
        ar: `ارتداد كلي من العيب (${reflectedToProbePct}% للمجس · منطقة ظل صوتي خلف العيب)`,
        en: `Full Flaw Reflection (${reflectedToProbePct}% to Probe · Acoustic Shadow Zone Behind Flaw)`,
      },
    };
  }

  // Partial reflection: part reflects to probe, part scatters/reflects off-axis, part transmits/bypasses past flaw
  const interceptedPct =
    regimeOverride === 'partial'
      ? Math.min(68, Math.max(40, Math.round(occlusion * 66)))
      : Math.min(76, Math.max(28, Math.round(occlusion * 74)));
  const transmittedBypassPct = 100 - interceptedPct;

  let probeShare = 0.6;
  if (scatterMode === 'volumetric_scatter') {
    probeShare = 0.52;
  } else if (scatterMode === 'corner_trap' || scatterMode === 'lamination') {
    probeShare = 0.74;
  } else {
    probeShare = Math.max(0.35, 0.85 - absAngleDiff / 50);
  }

  const reflectedToProbePct = Math.max(12, Math.min(interceptedPct - 6, Math.round(interceptedPct * probeShare)));
  const reflectedOffAxisPct = Math.max(0, interceptedPct - reflectedToProbePct);

  return {
    regime: 'flaw_partial',
    incidentPct: 100,
    reflectedToProbePct,
    reflectedOffAxisPct,
    transmittedBypassPct,
    shadowZoneActive: false,
    summaryLabel: {
      ar: `ارتداد جزئي (${reflectedToProbePct}% للمجس + ${reflectedOffAxisPct}% جانبي) ونفاذ ${transmittedBypassPct}% خلف العيب`,
      en: `Partial Reflection (${reflectedToProbePct}% Echo + ${reflectedOffAxisPct}% Off-Axis) · ${transmittedBypassPct}% Bypass Forward`,
    },
  };
}

export interface UltrasonicDefectImpactSpec {
  x: number;
  y: number;
  hit: boolean;
  scatterMode?: 'specular_planar' | 'corner_trap' | 'volumetric_scatter' | 'tip_diffraction' | 'lamination';
  leg?: 1 | 2;
}

/**
 * Renders the full 2D Ultrasonic Radiation Cone ("كوم الأشعة") with real-time animated waves:
 * - -20 dB Outer Beam Divergence Cone & -6 dB Sizing Core Energy Cone
 * - Fresnel Near-Field (NF) Interference Maxima/Minima Fringes & Far-Field Transition Gate
 * - True Longitudinal (parallel compression/rarefaction ⇄) vs Shear/Transverse (perpendicular sinusoidal ⇅) wave propagation
 * - Explicit directional arrows for Incident/Transmitted rays (▶), Returning Reflected Echo rays (◀),
 *   Off-Axis Specular/Scatter reflections (↗), and Full vs. Partial Acoustic Shadow / Bypass zones
 */
export function drawUltrasonicBeamCone2D(params: {
  ctx: CanvasRenderingContext2D;
  entryX: number;
  entryY: number;
  bounceX: number;
  bounceY: number;
  leg2EndX?: number;
  leg2EndY?: number;
  scalePxPerMm: number;
  coneMetrics: UltrasonicBeamConeMetrics;
  isPaut?: boolean;
  focalDepthMm?: number;
  showWavefronts?: boolean;
  showNearField?: boolean;
  isHit?: boolean;
  animationPhase?: number;
  waveMode?: UltrasonicWaveMode;
  reflectionBreakdown?: UltrasonicRayReflectionBreakdown;
  defectImpact?: UltrasonicDefectImpactSpec;
}): void {
  const {
    ctx,
    entryX,
    entryY,
    bounceX,
    bounceY,
    leg2EndX,
    leg2EndY,
    scalePxPerMm,
    coneMetrics,
    isPaut = false,
    showWavefronts = true,
    showNearField = true,
    isHit = false,
    animationPhase = 0,
    waveMode,
    reflectionBreakdown,
    defectImpact,
  } = params;

  ctx.save();

  const dx1 = bounceX - entryX;
  const dy1 = bounceY - entryY;
  const leg1LenPx = Math.max(1, Math.hypot(dx1, dy1));
  const leg1LenMm = leg1LenPx / Math.max(0.1, scalePxPerMm);
  const ux1 = dx1 / leg1LenPx;
  const uy1 = dy1 / leg1LenPx;
  // Normal perpendicular vector to Leg 1 ray
  const nx1 = -uy1;
  const ny1 = ux1;

  const w0_6Px = (coneMetrics.effectiveApertureMm * 0.45 * scalePxPerMm) / 2;
  const w0_20Px = (coneMetrics.effectiveApertureMm * 0.65 * scalePxPerMm) / 2;
  const w1_6Px = (coneMetrics.width6dBAtDepthMm(leg1LenMm) * scalePxPerMm) / 2;
  const w1_20Px = (coneMetrics.width20dBAtDepthMm(leg1LenMm) * scalePxPerMm) / 2;

  const hasLeg2 = leg2EndX !== undefined && leg2EndY !== undefined;
  const dx2 = hasLeg2 ? (leg2EndX as number) - bounceX : 0;
  const dy2 = hasLeg2 ? (leg2EndY as number) - bounceY : 0;
  const leg2LenPx = hasLeg2 ? Math.max(1, Math.hypot(dx2, dy2)) : 0;
  const leg2LenMm = hasLeg2 ? leg2LenPx / Math.max(0.1, scalePxPerMm) : 0;
  const totalLenMm = leg1LenMm + leg2LenMm;
  const ux2 = hasLeg2 ? dx2 / leg2LenPx : 0;
  const uy2 = hasLeg2 ? dy2 / leg2LenPx : 0;
  const nx2 = -uy2;
  const ny2 = ux2;
  const w2_6Px = hasLeg2 ? (coneMetrics.width6dBAtDepthMm(totalLenMm) * scalePxPerMm) / 2 : w1_6Px;
  const w2_20Px = hasLeg2 ? (coneMetrics.width20dBAtDepthMm(totalLenMm) * scalePxPerMm) / 2 : w1_20Px;

  const effectiveHit = Boolean(isHit || defectImpact?.hit);
  const activeWaveMode: UltrasonicWaveMode =
    waveMode ?? (coneMetrics.wavelengthMm > 1.15 || !hasLeg2 ? 'longitudinal' : 'shear');
  const activeReflection: UltrasonicRayReflectionBreakdown =
    reflectionBreakdown ??
    computeRayReflectionBreakdown({
      isHit: effectiveHit,
      scatterMode: defectImpact?.scatterMode,
      isStraightZeroBeam: !hasLeg2,
    });

  const phase = Number.isFinite(animationPhase) ? animationPhase : 0;
  // Longitudinal waves propagate ~1.83x faster (5920 vs 3240 m/s) with longer wavelength
  const speedMultiplier = activeWaveMode === 'longitudinal' ? 48 : 32;
  const waveSpacingPx = Math.max(
    7,
    Math.min(22, coneMetrics.wavelengthMm * (activeWaveMode === 'longitudinal' ? 9.5 : 11.5) * (scalePxPerMm / 4.2))
  );
  const travelOffsetPx = ((phase * speedMultiplier) % waveSpacingPx + waveSpacingPx) % waveSpacingPx;

  // Locate where defect intercepts Leg 1 or Leg 2 along propagation axis
  const hitLeg = defectImpact?.leg === 2 && hasLeg2 ? 2 : 1;
  const rawHitProjLeg1 =
    effectiveHit && defectImpact
      ? Math.max(8, Math.min(leg1LenPx, (defectImpact.x - entryX) * ux1 + (defectImpact.y - entryY) * uy1))
      : leg1LenPx;
  const rawHitProjLeg2 =
    effectiveHit && defectImpact && hasLeg2
      ? Math.max(8, Math.min(leg2LenPx, (defectImpact.x - bounceX) * ux2 + (defectImpact.y - bounceY) * uy2))
      : leg2LenPx;

  // Forward transmission attenuation after flaw strike (0 in Full Reflection shadow, partial ratio otherwise)
  const postFlawTransmitFactor = !effectiveHit
    ? 1
    : activeReflection.shadowZoneActive
    ? 0
    : Math.max(0.22, activeReflection.transmittedBypassPct / 100);

  // Helper: Draw a crisp directional arrowhead along unit vector (ux, uy)
  const drawDirectionalArrow = (
    tipX: number,
    tipY: number,
    ux: number,
    uy: number,
    sizePx: number,
    fillStyle: string,
    strokeStyle?: string
  ) => {
    const nx = -uy;
    const ny = ux;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(tipX + ux * sizePx * 0.55, tipY + uy * sizePx * 0.55);
    ctx.lineTo(tipX - ux * sizePx * 0.75 + nx * sizePx * 0.55, tipY - uy * sizePx * 0.75 + ny * sizePx * 0.55);
    ctx.lineTo(tipX - ux * sizePx * 0.42, tipY - uy * sizePx * 0.42);
    ctx.lineTo(tipX - ux * sizePx * 0.75 - nx * sizePx * 0.55, tipY - uy * sizePx * 0.75 - ny * sizePx * 0.55);
    ctx.closePath();
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }
  };

  // Helper to draw a curved acoustic wavefront arc clipped analytically to the cone width
  const drawClippedWavefrontArc = (
    cx: number,
    cy: number,
    ux: number,
    uy: number,
    nx: number,
    ny: number,
    distAlongPx: number,
    halfConeWidthPx: number,
    curvatureSagPx: number,
    strokeStyle: string,
    lineWidth: number
  ) => {
    const px = cx + ux * distAlongPx;
    const py = cy + uy * distAlongPx;
    const span = Math.max(2, halfConeWidthPx);
    const segments = 8;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const tNorm = (s / segments) * 2 - 1; // -1 .. +1
      const lat = tNorm * span;
      // Parabolic spherical wavefront curvature trailing slightly at the edges
      const sag = (1 - tNorm * tNorm) * curvatureSagPx;
      const wx = px + nx * lat + ux * sag;
      const wy = py + ny * lat + uy * sag;
      if (s === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  };

  // Helper: Draw physically distinct Longitudinal (compression/rarefaction slabs + parallel ⇄ particles)
  // OR Shear/Transverse (perpendicular sinusoidal wave + transverse ⇅ particles) along a beam segment
  const drawWaveModePropagation = (opts: {
    startX: number;
    startY: number;
    ux: number;
    uy: number;
    nx: number;
    ny: number;
    segLenPx: number;
    halfWStart: number;
    halfWEnd: number;
    phaseOffsetPx: number;
    intensity: number;
    isReflectedLeg?: boolean;
  }) => {
    const {
      startX,
      startY,
      ux,
      uy,
      nx,
      ny,
      segLenPx,
      halfWStart,
      halfWEnd,
      phaseOffsetPx,
      intensity,
      isReflectedLeg = false,
    } = opts;
    if (segLenPx < 6 || intensity <= 0.04) return;

    if (activeWaveMode === 'longitudinal') {
      // LONGITUDINAL WAVE (L-Wave): Compressional density bands + particle motion PARALLEL (⇄) to propagation
      for (let d = Math.max(3.5, phaseOffsetPx); d < segLenPx - 2; d += waveSpacingPx) {
        const t = d / segLenPx;
        const hw = halfWStart + (halfWEnd - halfWStart) * t;
        const alpha = Math.min(0.85, (0.55 - t * 0.16) * intensity);

        // Dense compression cluster (3 closely-packed parallel fronts representing high pressure)
        for (const subOffset of [-1.8, 0, 1.8]) {
          const sd = d + subOffset;
          if (sd > 1 && sd < segLenPx - 1) {
            drawClippedWavefrontArc(
              startX,
              startY,
              ux,
              uy,
              nx,
              ny,
              sd,
              hw * 0.9,
              1.1,
              isReflectedLeg
                ? `rgba(16, 185, 129, ${(alpha * (subOffset === 0 ? 1 : 0.45)).toFixed(2)})`
                : `rgba(52, 211, 153, ${(alpha * (subOffset === 0 ? 1 : 0.48)).toFixed(2)})`,
              subOffset === 0 ? 2.1 : 1.0
            );
          }
        }
      }

      // Parallel-oscillating material particles along the beam spine & core edges
      const particleStep = Math.max(12, waveSpacingPx * 1.15);
      const waveK = (Math.PI * 2) / Math.max(8, waveSpacingPx);
      const omegaPhase = phase * (speedMultiplier / Math.max(8, waveSpacingPx)) * Math.PI * 2;
      for (let baseD = 10; baseD < segLenPx - 6; baseD += particleStep) {
        const t = baseD / segLenPx;
        const hw = (halfWStart + (halfWEnd - halfWStart) * t) * 0.52;
        const disp = Math.sin(baseD * waveK - omegaPhase) * 3.4;
        for (const latFrac of [-0.65, 0, 0.65]) {
          const bx = startX + ux * (baseD + disp) + nx * hw * latFrac;
          const by = startY + uy * (baseD + disp) + ny * hw * latFrac;
          ctx.fillStyle = isReflectedLeg
            ? `rgba(110, 231, 183, ${(0.88 * intensity).toFixed(2)})`
            : `rgba(167, 243, 208, ${(0.92 * intensity).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(bx, by, latFrac === 0 ? 2.1 : 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Tiny parallel oscillation guide bar (⇄) along (ux, uy) on centerline particles
          if (latFrac === 0) {
            ctx.strokeStyle = `rgba(167, 243, 208, ${(0.45 * intensity).toFixed(2)})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(bx - ux * 4.5, by - uy * 4.5);
            ctx.lineTo(bx + ux * 4.5, by + uy * 4.5);
            ctx.stroke();
          }
        }
      }
    } else {
      // SHEAR / TRANSVERSE WAVE (S-Wave): Transverse sinusoidal shear waveform + particle motion PERPENDICULAR (⇅)
      const waveK = (Math.PI * 2) / Math.max(9, waveSpacingPx * 1.15);
      const omegaPhase = phase * (speedMultiplier / Math.max(8, waveSpacingPx)) * Math.PI * 2;
      const steps = Math.max(16, Math.floor(segLenPx / 3));

      // Draw continuous transverse sinusoidal shear wave snaking perpendicular to propagation vector
      ctx.strokeStyle = isReflectedLeg
        ? `rgba(251, 191, 36, ${(0.9 * intensity).toFixed(2)})`
        : isPaut
        ? `rgba(253, 224, 71, ${(0.88 * intensity).toFixed(2)})`
        : `rgba(125, 211, 252, ${(0.9 * intensity).toFixed(2)})`;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const d = (i / steps) * segLenPx;
        const t = d / segLenPx;
        const hw = halfWStart + (halfWEnd - halfWStart) * t;
        const env = Math.sin(Math.min(1, t * 4) * (Math.PI / 2));
        const shearAmp = Math.min(hw * 0.68, 7.5) * env;
        const offset = Math.sin(d * waveK - omegaPhase) * shearAmp;
        const wx = startX + ux * d + nx * offset;
        const wy = startY + uy * d + ny * offset;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Secondary counter-phase envelope for volumetric shear wave clarity
      ctx.strokeStyle = isReflectedLeg
        ? `rgba(251, 191, 36, ${(0.28 * intensity).toFixed(2)})`
        : `rgba(56, 189, 248, ${(0.28 * intensity).toFixed(2)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const d = (i / steps) * segLenPx;
        const t = d / segLenPx;
        const hw = halfWStart + (halfWEnd - halfWStart) * t;
        const env = Math.sin(Math.min(1, t * 4) * (Math.PI / 2));
        const shearAmp = Math.min(hw * 0.52, 5.5) * env;
        const offset = -Math.sin(d * waveK - omegaPhase) * shearAmp;
        const wx = startX + ux * d + nx * offset;
        const wy = startY + uy * d + ny * offset;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Perpendicularly-oscillating shear particles (⇅ along nx, ny)
      const particleStep = Math.max(11, waveSpacingPx);
      for (let baseD = 9; baseD < segLenPx - 5; baseD += particleStep) {
        const t = baseD / segLenPx;
        const hw = halfWStart + (halfWEnd - halfWStart) * t;
        const shearAmp = Math.min(hw * 0.68, 7.5);
        const disp = Math.sin(baseD * waveK - omegaPhase) * shearAmp;
        const ax = startX + ux * baseD;
        const ay = startY + uy * baseD;
        const px = ax + nx * disp;
        const py = ay + ny * disp;

        // Faint perpendicular shear displacement tether from axis to oscillating particle
        ctx.strokeStyle = `rgba(186, 230, 253, ${(0.38 * intensity).toFixed(2)})`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = isReflectedLeg
          ? `rgba(253, 224, 71, ${(0.95 * intensity).toFixed(2)})`
          : `rgba(224, 242, 254, ${(0.95 * intensity).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // 1. Draw -20 dB Outer Radiation Cone (Leg 1)
  ctx.fillStyle = isPaut ? 'rgba(245, 158, 11, 0.08)' : 'rgba(56, 189, 248, 0.08)';
  ctx.strokeStyle = isPaut ? 'rgba(245, 158, 11, 0.30)' : 'rgba(56, 189, 248, 0.30)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(entryX + nx1 * w0_20Px, entryY + ny1 * w0_20Px);
  ctx.lineTo(bounceX + nx1 * w1_20Px, bounceY + ny1 * w1_20Px);
  ctx.lineTo(bounceX - nx1 * w1_20Px, bounceY - ny1 * w1_20Px);
  ctx.lineTo(entryX - nx1 * w0_20Px, entryY - ny1 * w0_20Px);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Draw -6 dB Core Effective Sizing Cone (Leg 1)
  const coreGrad = ctx.createLinearGradient(entryX, entryY, bounceX, bounceY);
  if (effectiveHit) {
    coreGrad.addColorStop(0, 'rgba(244, 63, 94, 0.34)');
    coreGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.24)');
    coreGrad.addColorStop(1, activeReflection.shadowZoneActive && hitLeg === 1 ? 'rgba(15, 23, 42, 0.08)' : 'rgba(244, 63, 94, 0.14)');
  } else if (activeWaveMode === 'longitudinal') {
    coreGrad.addColorStop(0, 'rgba(16, 185, 129, 0.30)');
    coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0.12)');
  } else if (isPaut) {
    coreGrad.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
    coreGrad.addColorStop(1, 'rgba(245, 158, 11, 0.14)');
  } else {
    coreGrad.addColorStop(0, 'rgba(34, 211, 238, 0.34)');
    coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0.12)');
  }
  ctx.fillStyle = coreGrad;
  ctx.strokeStyle = isPaut ? 'rgba(251, 191, 36, 0.62)' : 'rgba(34, 211, 238, 0.62)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(entryX + nx1 * w0_6Px, entryY + ny1 * w0_6Px);
  ctx.lineTo(bounceX + nx1 * w1_6Px, bounceY + ny1 * w1_6Px);
  ctx.lineTo(bounceX - nx1 * w1_6Px, bounceY - ny1 * w1_6Px);
  ctx.lineTo(entryX - nx1 * w0_6Px, entryY - ny1 * w0_6Px);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2B. Acoustic Shadow Zone behind defect on Full Reflection (no transmitted bypass energy)
  if (effectiveHit && activeReflection.shadowZoneActive && hitLeg === 1 && rawHitProjLeg1 < leg1LenPx - 6) {
    const tHit = rawHitProjLeg1 / leg1LenPx;
    const hitW6 = w0_6Px + (w1_6Px - w0_6Px) * tHit;
    const hx = entryX + ux1 * rawHitProjLeg1;
    const hy = entryY + uy1 * rawHitProjLeg1;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.68)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hx + nx1 * hitW6, hy + ny1 * hitW6);
    ctx.lineTo(bounceX + nx1 * w1_6Px, bounceY + ny1 * w1_6Px);
    ctx.lineTo(bounceX - nx1 * w1_6Px, bounceY - ny1 * w1_6Px);
    ctx.lineTo(hx - nx1 * hitW6, hy - ny1 * hitW6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. Draw Leg 2 Reflected Cone (Skip Bounce) if coordinates provided and not completely shadowed on Leg 1
  if (hasLeg2 && leg2EndX !== undefined && leg2EndY !== undefined) {
    const leg2OpacityScale = effectiveHit && hitLeg === 1 ? postFlawTransmitFactor : 1;
    // Leg 2 -20 dB outer spread
    ctx.fillStyle = `rgba(245, 158, 11, ${(0.055 * leg2OpacityScale).toFixed(3)})`;
    ctx.strokeStyle = `rgba(245, 158, 11, ${(0.24 * Math.max(0.25, leg2OpacityScale)).toFixed(2)})`;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(bounceX + nx2 * w1_20Px, bounceY + ny2 * w1_20Px);
    ctx.lineTo(leg2EndX + nx2 * w2_20Px, leg2EndY + ny2 * w2_20Px);
    ctx.lineTo(leg2EndX - nx2 * w2_20Px, leg2EndY - ny2 * w2_20Px);
    ctx.lineTo(bounceX - nx2 * w1_20Px, bounceY - ny2 * w1_20Px);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Leg 2 -6 dB core cone with gradient attenuation
    const leg2Grad = ctx.createLinearGradient(bounceX, bounceY, leg2EndX, leg2EndY);
    leg2Grad.addColorStop(
      0,
      `rgba(245, 158, 11, ${((effectiveHit ? 0.24 : 0.17) * leg2OpacityScale).toFixed(3)})`
    );
    leg2Grad.addColorStop(1, `rgba(245, 158, 11, ${(0.05 * leg2OpacityScale).toFixed(3)})`);
    ctx.fillStyle = leg2Grad;
    ctx.strokeStyle = `rgba(245, 158, 11, ${(0.42 * Math.max(0.25, leg2OpacityScale)).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounceX + nx2 * w1_6Px, bounceY + ny2 * w1_6Px);
    ctx.lineTo(leg2EndX + nx2 * w2_6Px, leg2EndY + ny2 * w2_6Px);
    ctx.lineTo(leg2EndX - nx2 * w2_6Px, leg2EndY - ny2 * w2_6Px);
    ctx.lineTo(bounceX - nx2 * w1_6Px, bounceY - ny2 * w1_6Px);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 4. Draw Near-Field (Fresnel Zone N) Shaded Interference Cylinder & Far-Field Boundary
  const effectiveNfMm =
    coneMetrics.effectiveNearFieldInSpecimenMm > 0
      ? coneMetrics.effectiveNearFieldInSpecimenMm
      : coneMetrics.nearFieldLengthMm;

  if (showNearField) {
    const nfLeg1Mm = Math.min(leg1LenMm, effectiveNfMm);
    const nfPx = nfLeg1Mm * scalePxPerMm;

    if (nfPx > 5) {
      const nfX = entryX + ux1 * nfPx;
      const nfY = entryY + uy1 * nfPx;
      const nfHalfW0 = w0_6Px * 1.08;
      const nfHalfWEnd = (coneMetrics.width6dBAtDepthMm(nfLeg1Mm) * scalePxPerMm) / 2;

      // Translucent Violet Fresnel Interference Zone Polygon (0 -> NF)
      const nfGrad = ctx.createLinearGradient(entryX, entryY, nfX, nfY);
      nfGrad.addColorStop(0, 'rgba(168, 85, 247, 0.30)');
      nfGrad.addColorStop(0.6, 'rgba(192, 132, 252, 0.18)');
      nfGrad.addColorStop(1, 'rgba(168, 85, 247, 0.10)');
      ctx.fillStyle = nfGrad;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.72)';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(entryX + nx1 * nfHalfW0, entryY + ny1 * nfHalfW0);
      ctx.lineTo(nfX + nx1 * nfHalfWEnd, nfY + ny1 * nfHalfWEnd);
      ctx.lineTo(nfX - nx1 * nfHalfWEnd, nfY - ny1 * nfHalfWEnd);
      ctx.lineTo(entryX - nx1 * nfHalfW0, entryY - ny1 * nfHalfW0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Animated Fresnel Constructive/Destructive Interference Maxima & Minima Pockets inside Near Field
      const nfCrossCount = Math.max(3, Math.min(7, Math.floor(nfPx / 12)));
      for (let i = 1; i <= nfCrossCount; i++) {
        const frac = i / (nfCrossCount + 1);
        const distPx = nfPx * frac;
        const rw = nfHalfW0 * (1 - 0.18 * frac);
        const rx = entryX + ux1 * distPx;
        const ry = entryY + uy1 * distPx;
        const pulse = 0.5 + 0.5 * Math.sin(phase * 5.2 - i * 1.35);

        ctx.strokeStyle = `rgba(216, 180, 254, ${(0.22 + pulse * 0.38).toFixed(2)})`;
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(rx - nx1 * rw, ry - ny1 * rw);
        ctx.quadraticCurveTo(rx + ux1 * (3 + pulse * 3), ry + uy1 * (3 + pulse * 3), rx + nx1 * rw, ry + ny1 * rw);
        ctx.stroke();

        ctx.fillStyle = pulse > 0.55 ? 'rgba(233, 213, 255, 0.78)' : 'rgba(126, 34, 206, 0.45)';
        ctx.beginPath();
        ctx.arc(rx, ry, 1.4 + pulse * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effectiveNfMm <= leg1LenMm) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(nfX - nx1 * (nfHalfWEnd + 6), nfY - ny1 * (nfHalfWEnd + 6));
        ctx.lineTo(nfX + nx1 * (nfHalfWEnd + 6), nfY + ny1 * (nfHalfWEnd + 6));
        ctx.stroke();

        if (typeof ctx.fillText === 'function') {
          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText(`NF=${effectiveNfMm.toFixed(1)}mm`, nfX + 6, nfY - 5);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.font = '8px monospace';
          ctx.fillText('Far Field →', nfX + 6, nfY + 6);
        }
      } else if (hasLeg2 && leg2EndX !== undefined && leg2EndY !== undefined) {
        const remNfPx = Math.min(leg2LenPx * 0.92, (effectiveNfMm - leg1LenMm) * scalePxPerMm);
        const nf2X = bounceX + ux2 * remNfPx;
        const nf2Y = bounceY + uy2 * remNfPx;
        const nf2HalfW = (coneMetrics.width6dBAtDepthMm(effectiveNfMm) * scalePxPerMm) / 2;

        ctx.fillStyle = 'rgba(168, 85, 247, 0.20)';
        ctx.beginPath();
        ctx.moveTo(bounceX + nx2 * nfHalfWEnd, bounceY + ny2 * nfHalfWEnd);
        ctx.lineTo(nf2X + nx2 * nf2HalfW, nf2Y + ny2 * nf2HalfW);
        ctx.lineTo(nf2X - nx2 * nf2HalfW, nf2Y - ny2 * nf2HalfW);
        ctx.lineTo(bounceX - nx2 * nfHalfWEnd, bounceY - ny2 * nfHalfWEnd);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(nf2X - nx2 * (nf2HalfW + 5), nf2Y - ny2 * (nf2HalfW + 5));
        ctx.lineTo(nf2X + nx2 * (nf2HalfW + 5), nf2Y + ny2 * (nf2HalfW + 5));
        ctx.stroke();

        if (typeof ctx.fillText === 'function') {
          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText(`NF=${effectiveNfMm.toFixed(1)}mm`, nf2X + 5, nf2Y - 4);
        }
      }
    }
  }

  // 5. Animated Longitudinal / Shear Wave Propagation & Incident/Reflected Ray Vectors
  if (showWavefronts) {
    // 5A. Fine multi-ray acoustic filaments (-6 dB boundaries + inner core rays)
    const rayOffsets = [-0.88, -0.44, 0.44, 0.88];
    for (const frac of rayOffsets) {
      ctx.strokeStyle = isPaut ? 'rgba(251, 191, 36, 0.26)' : 'rgba(125, 211, 252, 0.24)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(entryX + nx1 * w0_6Px * frac, entryY + ny1 * w0_6Px * frac);
      if (effectiveHit && hitLeg === 1 && activeReflection.shadowZoneActive) {
        const tHit = rawHitProjLeg1 / leg1LenPx;
        const hwHit = w0_6Px + (w1_6Px - w0_6Px) * tHit;
        ctx.lineTo(entryX + ux1 * rawHitProjLeg1 + nx1 * hwHit * frac, entryY + uy1 * rawHitProjLeg1 + ny1 * hwHit * frac);
      } else {
        ctx.lineTo(bounceX + nx1 * w1_6Px * frac, bounceY + ny1 * w1_6Px * frac);
        if (hasLeg2 && leg2EndX !== undefined && leg2EndY !== undefined && postFlawTransmitFactor > 0.05) {
          ctx.lineTo(leg2EndX + nx2 * w2_6Px * frac, leg2EndY + ny2 * w2_6Px * frac);
        }
      }
      ctx.stroke();
    }

    // 5B. Propagating curved wavefront crests + True Longitudinal/Shear Waveform along Leg 1
    const leg1WaveEndPx = effectiveHit && hitLeg === 1 ? rawHitProjLeg1 : leg1LenPx;
    for (let r = Math.max(3.5, travelOffsetPx); r < leg1WaveEndPx - 1; r += waveSpacingPx) {
      const tLeg1 = r / leg1LenPx;
      const distMm = r / Math.max(0.1, scalePxPerMm);
      const inFresnel = distMm <= effectiveNfMm;
      const halfW6 = w0_6Px + (w1_6Px - w0_6Px) * tLeg1;
      const halfW20 = w0_20Px + (w1_20Px - w0_20Px) * tLeg1;
      const sagPx = inFresnel ? 1.4 : Math.min(6.5, 1.8 + tLeg1 * 4.5);

      const waveIdx = Math.floor((r - travelOffsetPx + phase * speedMultiplier) / waveSpacingPx);
      const isStrongPacket = waveIdx % 3 === 0;
      const attenuation = 1 - tLeg1 * 0.25;

      drawClippedWavefrontArc(
        entryX,
        entryY,
        ux1,
        uy1,
        nx1,
        ny1,
        r,
        halfW20 * 0.96,
        sagPx * 1.15,
        isPaut
          ? `rgba(251, 191, 36, ${(0.18 * attenuation).toFixed(2)})`
          : `rgba(56, 189, 248, ${(0.20 * attenuation).toFixed(2)})`,
        0.9
      );

      const coreAlpha = (isStrongPacket ? 0.85 : 0.45) * attenuation;
      const coreStroke = effectiveHit
        ? `rgba(254, 215, 170, ${coreAlpha.toFixed(2)})`
        : inFresnel
        ? `rgba(233, 213, 255, ${coreAlpha.toFixed(2)})`
        : isPaut
        ? `rgba(254, 240, 138, ${coreAlpha.toFixed(2)})`
        : `rgba(186, 230, 253, ${coreAlpha.toFixed(2)})`;

      drawClippedWavefrontArc(
        entryX,
        entryY,
        ux1,
        uy1,
        nx1,
        ny1,
        r,
        halfW6 * 0.98,
        sagPx,
        coreStroke,
        isStrongPacket ? 1.9 : 1.1
      );
    }

    // Active Longitudinal (⇄ compression) or Shear (⇅ transverse sinusoidal) wave shape along Leg 1 incident ray
    drawWaveModePropagation({
      startX: entryX,
      startY: entryY,
      ux: ux1,
      uy: uy1,
      nx: nx1,
      ny: ny1,
      segLenPx: leg1WaveEndPx,
      halfWStart: w0_6Px,
      halfWEnd: w0_6Px + (w1_6Px - w0_6Px) * (leg1WaveEndPx / leg1LenPx),
      phaseOffsetPx: travelOffsetPx,
      intensity: 1.0,
    });

    // If Partial Reflection on Leg 1: continue transmitting the bypassed wave fraction past the flaw!
    if (effectiveHit && hitLeg === 1 && !activeReflection.shadowZoneActive && rawHitProjLeg1 < leg1LenPx - 6) {
      const hx = entryX + ux1 * rawHitProjLeg1;
      const hy = entryY + uy1 * rawHitProjLeg1;
      const tHit = rawHitProjLeg1 / leg1LenPx;
      const hwHit = w0_6Px + (w1_6Px - w0_6Px) * tHit;
      drawWaveModePropagation({
        startX: hx,
        startY: hy,
        ux: ux1,
        uy: uy1,
        nx: nx1,
        ny: ny1,
        segLenPx: leg1LenPx - rawHitProjLeg1,
        halfWStart: hwHit * 0.85,
        halfWEnd: w1_6Px * 0.85,
        phaseOffsetPx: ((travelOffsetPx - rawHitProjLeg1) % waveSpacingPx + waveSpacingPx) % waveSpacingPx,
        intensity: postFlawTransmitFactor,
      });
    }

    // 5C. Propagating curved wavefront crests + Wave Shape along Leg 2 (after bottom-wall specular reflection!)
    if (hasLeg2 && leg2EndX !== undefined && leg2EndY !== undefined && leg2LenPx > 4 && postFlawTransmitFactor > 0.05) {
      const leg2WaveEndPx =
        effectiveHit && hitLeg === 2 ? rawHitProjLeg2 : leg2LenPx;
      const bounceOffsetPx = ((phase * speedMultiplier - leg1LenPx) % waveSpacingPx + waveSpacingPx) % waveSpacingPx;
      for (let r2 = Math.max(3.5, bounceOffsetPx); r2 < leg2WaveEndPx - 1; r2 += waveSpacingPx) {
        const tLeg2 = r2 / leg2LenPx;
        const halfW6_2 = w1_6Px + (w2_6Px - w1_6Px) * tLeg2;
        const halfW20_2 = w1_20Px + (w2_20Px - w1_20Px) * tLeg2;
        const sagPx2 = Math.min(7.5, 4.2 + tLeg2 * 3.0);
        const atten2 = 0.72 * (1 - tLeg2 * 0.35) * (hitLeg === 1 ? postFlawTransmitFactor : 1);

        drawClippedWavefrontArc(
          bounceX,
          bounceY,
          ux2,
          uy2,
          nx2,
          ny2,
          r2,
          halfW20_2 * 0.94,
          sagPx2 * 1.1,
          `rgba(251, 191, 36, ${(0.18 * atten2).toFixed(2)})`,
          0.85
        );

        drawClippedWavefrontArc(
          bounceX,
          bounceY,
          ux2,
          uy2,
          nx2,
          ny2,
          r2,
          halfW6_2 * 0.96,
          sagPx2,
          `rgba(253, 224, 71, ${(0.72 * atten2).toFixed(2)})`,
          1.45
        );
      }

      drawWaveModePropagation({
        startX: bounceX,
        startY: bounceY,
        ux: ux2,
        uy: uy2,
        nx: nx2,
        ny: ny2,
        segLenPx: leg2WaveEndPx,
        halfWStart: w1_6Px,
        halfWEnd: w1_6Px + (w2_6Px - w1_6Px) * (leg2WaveEndPx / leg2LenPx),
        phaseOffsetPx: bounceOffsetPx,
        intensity: hitLeg === 1 ? postFlawTransmitFactor : 1.0,
        isReflectedLeg: true,
      });

      // Bottom-wall specular reflection pulse flash at (bounceX, bounceY)
      const bouncePulse = 0.5 + 0.5 * Math.sin(phase * 7.5);
      const bounceRadius = Math.max(3.5, w1_6Px * (0.45 + bouncePulse * 0.35));
      ctx.strokeStyle = `rgba(251, 191, 36, ${((0.35 + bouncePulse * 0.45) * (hitLeg === 1 ? postFlawTransmitFactor : 1)).toFixed(2)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(bounceX, bounceY, bounceRadius, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Fixed directional arrow along Leg 2 reflected path (▶ upward toward top surface)
      const l2MidX = bounceX + ux2 * (leg2WaveEndPx * 0.55);
      const l2MidY = bounceY + uy2 * (leg2WaveEndPx * 0.55);
      drawDirectionalArrow(
        l2MidX,
        l2MidY,
        ux2,
        uy2,
        8.5,
        `rgba(251, 191, 36, ${(0.92 * (hitLeg === 1 ? postFlawTransmitFactor : 1)).toFixed(2)})`,
        '#0f172a'
      );
    }

    // 5D. Traveling Photon / Acoustic Energy Pulse Beads + Forward Directional Arrows along Incident Ray
    const totalPathPx =
      effectiveHit && activeReflection.shadowZoneActive
        ? hitLeg === 1
          ? rawHitProjLeg1
          : leg1LenPx + rawHitProjLeg2
        : leg1LenPx + leg2LenPx;

    for (let pIdx = 0; pIdx < 3; pIdx++) {
      const normPos = ((phase * 0.65 + pIdx / 3) % 1 + 1) % 1;
      const distTotal = normPos * Math.max(12, totalPathPx);
      let bx = entryX;
      let by = entryY;
      let bux = ux1;
      let buy = uy1;
      let isAfterFlawBypass = false;

      if (distTotal <= leg1LenPx || !hasLeg2) {
        const d = Math.min(distTotal, leg1LenPx);
        bx = entryX + ux1 * d;
        by = entryY + uy1 * d;
        if (effectiveHit && hitLeg === 1 && d > rawHitProjLeg1) {
          isAfterFlawBypass = true;
        }
      } else {
        const d2 = distTotal - leg1LenPx;
        bx = bounceX + ux2 * d2;
        by = bounceY + uy2 * d2;
        bux = ux2;
        buy = uy2;
        if (effectiveHit && hitLeg === 1) {
          isAfterFlawBypass = true;
        }
      }

      const beadOpacity = isAfterFlawBypass ? Math.max(0.35, postFlawTransmitFactor) : 1.0;
      const glow = ctx.createRadialGradient(bx, by, 0.5, bx, by, 7.5);
      glow.addColorStop(0, `rgba(224, 242, 254, ${(0.95 * beadOpacity).toFixed(2)})`);
      glow.addColorStop(
        0.45,
        isAfterFlawBypass
          ? `rgba(251, 191, 36, ${(0.55 * beadOpacity).toFixed(2)})`
          : `rgba(34, 211, 238, ${(0.6 * beadOpacity).toFixed(2)})`
      );
      glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
      ctx.fill();

      drawDirectionalArrow(bx, by, bux, buy, 7.5, `rgba(255, 255, 255, ${beadOpacity.toFixed(2)})`);
    }

    // Static reference directional arrow on Leg 1 incident ray
    const incMidX = entryX + ux1 * (leg1WaveEndPx * 0.48);
    const incMidY = entryY + uy1 * (leg1WaveEndPx * 0.48);
    drawDirectionalArrow(incMidX, incMidY, ux1, uy1, 8.5, '#38bdf8', '#0f172a');
  }

  // 6. Defect Interaction Scattering, Off-Axis Specular Reflection & Returning Echo Wavelets
  if (defectImpact?.hit) {
    const defX = defectImpact.x;
    const defY = defectImpact.y;
    const scatterMode = defectImpact.scatterMode || 'specular_planar';
    const echoStrength = Math.max(0.32, activeReflection.reflectedToProbePct / 100);

    // 6A. Expanding scattering / corner-trap wavelets right at the defect
    for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
      const ringProgress = ((phase * 1.15 + ringIdx / 3) % 1 + 1) % 1;
      const maxScatterR = scatterMode === 'volumetric_scatter' ? 24 : 20;
      const scatterR = 3 + ringProgress * maxScatterR;
      const alpha = (1 - ringProgress) * 0.82;

      if (scatterMode === 'volumetric_scatter') {
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(defX, defY, scatterR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const backAng = Math.atan2(entryY - defY, entryX - defX);
        ctx.strokeStyle =
          scatterMode === 'corner_trap'
            ? `rgba(244, 63, 94, ${alpha.toFixed(2)})`
            : `rgba(251, 146, 60, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(defX, defY, scatterR, backAng - 0.85, backAng + 0.85);
        ctx.stroke();
      }
    }

    // 6A-bis. Off-Axis Specular / Scattered Reflected Rays (↗) when partial or angled reflection occurs
    if (activeReflection.reflectedOffAxisPct >= 8) {
      const offAxisStrength = Math.min(1, activeReflection.reflectedOffAxisPct / 55);
      const specRayLen = 28 + offAxisStrength * 22;
      const incUx = hitLeg === 2 && hasLeg2 ? ux2 : ux1;
      const incUy = hitLeg === 2 && hasLeg2 ? uy2 : uy1;
      const offAngles =
        scatterMode === 'volumetric_scatter'
          ? [-0.95, 0.95, 2.2]
          : [-0.68];

      for (const deltaAng of offAngles) {
        const baseAng = Math.atan2(-incUy, -incUx) + deltaAng;
        const oux = Math.cos(baseAng);
        const ouy = Math.sin(baseAng);
        const endOx = defX + oux * specRayLen;
        const endOy = defY + ouy * specRayLen;

        ctx.strokeStyle = `rgba(251, 146, 60, ${(0.65 * offAxisStrength).toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(defX, defY);
        ctx.lineTo(endOx, endOy);
        ctx.stroke();
        ctx.setLineDash([]);

        drawDirectionalArrow(
          defX + oux * (specRayLen * 0.72),
          defY + ouy * (specRayLen * 0.72),
          oux,
          ouy,
          7,
          `rgba(251, 146, 60, ${(0.9 * offAxisStrength).toFixed(2)})`,
          '#0f172a'
        );
      }
    }

    // 6B. Returning Echo Wavelets + Explicit Reverse Directional Arrows (◀) Racing Back to Transducer
    const returnWaypoints: Array<{ x: number; y: number }> =
      defectImpact.leg === 2 && hasLeg2
        ? [
            { x: defX, y: defY },
            { x: bounceX, y: bounceY },
            { x: entryX, y: entryY },
          ]
        : [
            { x: defX, y: defY },
            { x: entryX, y: entryY },
          ];

    let totalRetPx = 0;
    const retSegments: Array<{
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      len: number;
      ux: number;
      uy: number;
    }> = [];
    for (let i = 0; i < returnWaypoints.length - 1; i++) {
      const p0 = returnWaypoints[i];
      const p1 = returnWaypoints[i + 1];
      const ddx = p1.x - p0.x;
      const ddy = p1.y - p0.y;
      const len = Math.max(1, Math.hypot(ddx, ddy));
      retSegments.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, len, ux: ddx / len, uy: ddy / len });
      totalRetPx += len;
    }

    // Draw crisp reflected return ray path + fixed reverse arrow (◀ toward probe)
    ctx.strokeStyle = `rgba(52, 211, 153, ${(0.72 * echoStrength + 0.18).toFixed(2)})`;
    ctx.lineWidth = activeReflection.regime === 'flaw_full' ? 2.4 : 1.7;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    retWaypointsLoop: for (let i = 0; i < returnWaypoints.length; i++) {
      const pt = returnWaypoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
      if (i > 10) break retWaypointsLoop;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (const seg of retSegments) {
      if (seg.len > 14) {
        drawDirectionalArrow(
          seg.x0 + seg.ux * (seg.len * 0.52),
          seg.y0 + seg.uy * (seg.len * 0.52),
          seg.ux,
          seg.uy,
          activeReflection.regime === 'flaw_full' ? 9.5 : 8.0,
          '#34d399',
          '#052e16'
        );
      }
    }

    for (let echoIdx = 0; echoIdx < 3; echoIdx++) {
      const retNorm = ((phase * 0.85 + echoIdx / 3) % 1 + 1) % 1;
      let rem = retNorm * totalRetPx;
      for (const seg of retSegments) {
        if (rem <= seg.len) {
          const ex = seg.x0 + seg.ux * rem;
          const ey = seg.y0 + seg.uy * rem;
          const enx = -seg.uy;
          const eny = seg.ux;

          drawClippedWavefrontArc(
            seg.x0,
            seg.y0,
            seg.ux,
            seg.uy,
            enx,
            eny,
            rem,
            7 + (rem / Math.max(1, totalRetPx)) * 5,
            2.2,
            `rgba(52, 211, 153, ${(0.94 * echoStrength * (1 - retNorm * 0.25)).toFixed(2)})`,
            activeReflection.regime === 'flaw_full' ? 2.3 : 1.8
          );

          const retGlow = ctx.createRadialGradient(ex, ey, 0.5, ex, ey, 6.5);
          retGlow.addColorStop(0, 'rgba(167, 243, 208, 0.98)');
          retGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.65)');
          retGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = retGlow;
          ctx.beginPath();
          ctx.arc(ex, ey, 6.5, 0, Math.PI * 2);
          ctx.fill();

          drawDirectionalArrow(ex, ey, seg.ux, seg.uy, 7.0, '#6ee7b7');
          break;
        }
        rem -= seg.len;
      }
    }

    // Concise in-canvas reflection badge right next to the flaw impact
    if (typeof ctx.fillText === 'function') {
      const tagText =
        activeReflection.regime === 'flaw_full'
          ? `FULL ECHO ◀ ${activeReflection.reflectedToProbePct}% · SHADOW 0%`
          : `ECHO ◀ ${activeReflection.reflectedToProbePct}% · PASS ▶ ${activeReflection.transmittedBypassPct}%`;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = activeReflection.regime === 'flaw_full' ? '#fda4af' : '#6ee7b7';
      ctx.fillText(tagText, defX, Math.max(20, defY - 13));
    }
  } else if (!hasLeg2 && typeof ctx.fillText === 'function') {
    // 0° straight beam backwall 100% reflection arrow back up to probe
    drawDirectionalArrow(
      bounceX - ux1 * (leg1LenPx * 0.35),
      bounceY - uy1 * (leg1LenPx * 0.35),
      -ux1,
      -uy1,
      8.5,
      '#34d399',
      '#052e16'
    );
  }

  ctx.restore();
}

// =============================================================================
// PER-DEFECT MULTI-CODE ALLOWABLE TOLERANCE ENGINE (16 Defects × 5 Standards)
// =============================================================================

export type InspectionCodeId = 'asme_viii' | 'asme_b31_3' | 'aws_d1_1' | 'api_1104' | 'iso_11666';

export interface InspectionCodeMeta {
  id: InspectionCodeId;
  shortLabel: string;
  fullTitle: { ar: string; en: string };
  clauseSummary: { ar: string; en: string };
}

export const INSPECTION_CODES_META: InspectionCodeMeta[] = [
  {
    id: 'asme_viii',
    shortLabel: 'ASME Sec VIII',
    fullTitle: {
      ar: 'ASME Section VIII Div. 1 (UW-51 & Appendix 12) — أوعية الضغط',
      en: 'ASME Sec VIII Div 1 (UW-51 & Mandatory Appendix 12)',
    },
    clauseSummary: {
      ar: 'صفر سماحية لأي شرخ أو نقص انصهار أو نقص تغلغل؛ العيوب المتطاولة الأخرى (كالخبث) تحكمها سماكة المعدن (6 مم أو t/3 حتى 19 مم).',
      en: 'Zero tolerance for planar cracks, LOF, and LOP; elongated volumetric indications scale with thickness t (6mm, t/3, max 19mm).',
    },
  },
  {
    id: 'asme_b31_3',
    shortLabel: 'ASME B31.3',
    fullTitle: {
      ar: 'ASME B31.3 (Table 341.3.2 Normal Fluid Service) — أنابيب العمليات',
      en: 'ASME B31.3 Process Piping (Table 341.3.2 Normal Fluid Service)',
    },
    clauseSummary: {
      ar: 'يمنع الشروخ ونقص الانصهار تماماً؛ يسمح بحدود مقيدة لنقص التغلغل السطحي بالجذر والخبث المعزول (≤ t/3) حسب سمك الجدار.',
      en: 'Zero cracks or lack of fusion; tightly bounded limits for minor root LOP (≤1mm), isolated slag (≤t/3), and undercut.',
    },
  },
  {
    id: 'aws_d1_1',
    shortLabel: 'AWS D1.1',
    fullTitle: {
      ar: 'AWS D1.1 (Clause 8 / Table 8.2) — المنشآت المعدنية الفولاذية',
      en: 'AWS D1.1 (Structural Welding Code - Clause 8 / Table 8.2)',
    },
    clauseSummary: {
      ar: 'يمنع كافة الشروخ وعيوب الفئة A الكبيرة؛ يقيم العيوب الأخرى بمعامل الديسيبل (d = a - b - c) مع حدود طول للفئتين B (19 مم) و C (50 مم).',
      en: 'Zero cracks or Class A large flaws; Class B (≤19mm) & Class C (≤50mm) evaluated via Indication Rating d = a - b - c.',
    },
  },
  {
    id: 'api_1104',
    shortLabel: 'API 1104',
    fullTitle: {
      ar: 'API Standard 1104 (Sec. 9 & 11.4 UT) — لحام خطوط الأنابيب البترولية',
      en: 'API 1104 (Pipeline Welding Sec. 9 & 11.4 UT Acceptance)',
    },
    clauseSummary: {
      ar: 'يمنع الشروخ (عدا شرخ الفوهة النجمي الضحل ≤ 4 مم) ويحدد أطوالاً صريحة للعيوب الخطية (≤ 25 مم) والحجمية المدفونة (≤ 2t أو 50 مم).',
      en: 'Prohibits cracks (except shallow star crater ≤4mm); sets explicit mm limits for linear (≤25mm) and buried volumetric flaws.',
    },
  },
  {
    id: 'iso_11666',
    shortLabel: 'ISO 11666',
    fullTitle: {
      ar: 'ISO 11666 / ISO 17640 (Acceptance Level 2) — المواصفة الأوروبية الدولية',
      en: 'ISO 11666 / ISO 17640 (Ultrasonic Weld Acceptance Level 2)',
    },
    clauseSummary: {
      ar: 'يقارن سعة الصدى بمنحنى المرجع H₀؛ ترفض العيوب المستوية فوق منحنى القبول وتحدد أطوال العيوب النقطية والمتطاولة بنسبة من السمك t.',
      en: 'Evaluates indications against Reference Level H0 (AL2); planar echoes rejected, volumetric lengths bounded by thickness t.',
    },
  },
];

export interface DefectCodeToleranceResult {
  flawId: ExtendedWeldFlawId;
  code: InspectionCodeId;
  codeCitation: string;
  clauseRef: string;
  thicknessMm: number;
  isZeroTolerance: boolean;
  maxLengthMm: number;
  maxHeightOrDepthMm: number | null;
  amplitudeCriterion: { ar: string; en: string };
  toleranceBadge: { ar: string; en: string };
  toleranceRuleSummary: { ar: string; en: string };
  reject: boolean;
  evaluationExplanation: { ar: string; en: string };
}

/**
 * Computes the exact engineering allowable tolerance ("سماحية كل عيب") for any of the 16 catalog defects
 * based on the selected Inspection Code and specimen wall thickness t (mm), and evaluates measured dimensions.
 */
export function getDefectCodeTolerance(
  flawId: ExtendedWeldFlawId,
  code: InspectionCodeId,
  thicknessMm: number,
  measured?: {
    lengthMm?: number;
    heightMm?: number;
    awsDRatingDb?: number;
    pctDac?: number;
  }
): DefectCodeToleranceResult {
  const t = Math.max(6, thicknessMm);
  const spec = ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === flawId) || ALL_WELD_DEFECTS_CATALOG[0];
  const measL = measured?.lengthMm ?? spec.lengthMm;
  const measH = measured?.heightMm ?? spec.heightMm;
  const pctDac = measured?.pctDac ?? Math.round(spec.reflectivityFactor * 95);
  const codeMeta = INSPECTION_CODES_META.find((c) => c.id === code) || INSPECTION_CODES_META[0];

  const r1 = (n: number) => Number(n.toFixed(1));
  const asmeViiiElongatedLimitMm = t <= 19 ? 6.0 : t <= 57 ? r1(t / 3) : 19.0;
  const b313SlagLimitMm = r1(t / 3);

  let clauseRef = '';
  let isZeroTolerance = false;
  let maxLengthMm = 0;
  let maxHeightOrDepthMm: number | null = null;
  let amplitudeCriterion = { ar: 'تقييم من 20% DAC (رفض > 100% DAC)', en: 'Evaluate ≥ 20% DAC (Reject > 100% DAC)' };
  let toleranceBadge = { ar: '', en: '' };
  let toleranceRuleSummary = { ar: '', en: '' };
  let reject = true;

  if (spec.family === 'cracks') {
    if (code === 'api_1104' && flawId === 'crater_star_crack') {
      clauseRef = 'API 1104 Sec. 9.3.10 & 11.4.7.1';
      isZeroTolerance = false;
      maxLengthMm = 4.0;
      maxHeightOrDepthMm = 1.5;
      amplitudeCriterion = { ar: 'يُسمح بشرخ الفوهة النجمي السطحي فقط إذا L ≤ 4.0 مم', en: 'Shallow crater star crack only if L ≤ 4.0 mm (5/32")' };
      toleranceBadge = { ar: 'L ≤ 4.0 مم (شرخ فوهة سطحي فقط)', en: 'L ≤ 4.0 mm (Shallow Crater Only)' };
      toleranceRuleSummary = {
        ar: 'استثناء وحيد في كود خطوط الأنابيب API 1104 يسمح بشرخ الفوهة النجمي السطحي الناتج عن انكماش نهاية القوس شريطة ألا يتعدى طوله 4.0 مم (5/32 بوصة).',
        en: 'Unique API 1104 pipeline provision permitting shallow crater star cracks resulting from bead stop solidification if length ≤ 4.0 mm (5/32 in.).',
      };
      reject = measL > maxLengthMm || measH > 1.5;
    } else {
      isZeroTolerance = true;
      maxLengthMm = 0;
      maxHeightOrDepthMm = 0;
      clauseRef =
        code === 'asme_viii'
          ? 'ASME VIII Div.1 UW-51 / App.12-3(a)'
          : code === 'asme_b31_3'
          ? 'ASME B31.3 Table 341.3.2 (Criterion A)'
          : code === 'aws_d1_1'
          ? 'AWS D1.1 Clause 8.13.1 & Table 8.2'
          : code === 'api_1104'
          ? 'API 1104 Sec. 9.3.10 / 11.4.7.1'
          : 'ISO 11666 Clause 6 (Planar Cracks)';
      amplitudeCriterion = {
        ar: 'مرفوض عند أي سعة قابلة للتمييز كشرخ',
        en: 'Unacceptable at any detectable amplitude',
      };
      toleranceBadge = {
        ar: '0.0 مم — غير مسموح إطلاقاً (Zero Tolerance)',
        en: '0.0 mm — Zero Tolerance (Prohibited)',
      };
      toleranceRuleSummary = {
        ar: 'جميع الشروخ الطولية والعرضية وشروخ الـ HAZ مرفوضة قطعياً (سماحية = صفر مم) لكونها حادة الحواف وتؤدي لانهيار كسري هش تحت الضغط.',
        en: 'All longitudinal, transverse, and HAZ cracks have strictly 0.0 mm tolerance due to severe stress concentration and brittle fracture risk.',
      };
      reject = true;
    }
  } else if (spec.family === 'fusion_penetration') {
    if (code === 'asme_viii') {
      clauseRef = 'ASME VIII Div.1 UW-51(b)(1) & App.12-3(a)';
      isZeroTolerance = true;
      maxLengthMm = 0;
      maxHeightOrDepthMm = 0;
      amplitudeCriterion = { ar: 'مرفوض أياً كانت السعة أو الطول', en: 'Rejected regardless of length or DAC %' };
      toleranceBadge = { ar: '0.0 مم — غير مسموح (Zero Planar)', en: '0.0 mm — Not Permitted' };
      toleranceRuleSummary = {
        ar: 'يحظر كود أوعية الضغط ASME VIII Div.1 أي نقص انصهار (جانبي أو بين الطبقات أو بالجذر) أو نقص تغلغل أياً كان طوله.',
        en: 'ASME Sec VIII Div 1 prohibits any lack of fusion (sidewall, interpass, root) or incomplete penetration regardless of length.',
      };
      reject = true;
    } else if (code === 'asme_b31_3') {
      if (flawId === 'incomplete_penetration') {
        const maxLopDepth = r1(Math.min(1.0, 0.2 * t));
        clauseRef = 'ASME B31.3 Table 341.3.2 (Normal Fluid Service)';
        isZeroTolerance = false;
        maxLengthMm = 38.0;
        maxHeightOrDepthMm = maxLopDepth;
        amplitudeCriterion = {
          ar: `العمق Δh ≤ ${maxLopDepth} مم والطول التراكمي ≤ 38 مم (خدمة عادية؛ صفر للخدمة الدورية الحرجة)`,
          en: `Depth Δh ≤ ${maxLopDepth} mm & L ≤ 38 mm/150mm (Normal Service; 0 mm in Severe Cyclic)`,
        };
        toleranceBadge = {
          ar: `Δh ≤ ${maxLopDepth} مم · L ≤ 38 مم (خدمة عادية)`,
          en: `Δh ≤ ${maxLopDepth} mm · L ≤ 38 mm`,
        };
        toleranceRuleSummary = {
          ar: `في خدمة الموائع العادية بـ B31.3 يُسمح بنقص تغلغل جذر طفيف جداً بعمق لا يتجاوز ${maxLopDepth} مم (الأقل من 1 مم أو 0.2t)، ويُمنع تماماً (0 مم) في الخدمة الحرجة Severe Cyclic.`,
          en: `ASME B31.3 Normal Fluid Service allows minor root LOP up to Δh ≤ ${maxLopDepth} mm (lesser of 1.0mm or 0.2t) and L ≤ 38mm; Severe Cyclic is 0 mm.`,
        };
        reject = measH > maxLopDepth || measL > maxLengthMm;
      } else {
        clauseRef = 'ASME B31.3 Table 341.3.2 (Lack of Fusion)';
        isZeroTolerance = true;
        maxLengthMm = 0;
        maxHeightOrDepthMm = 0;
        amplitudeCriterion = { ar: 'صفر مم لنقص الانصهار في الخدمة العادية والحرجة', en: '0 mm for Lack of Fusion (Normal & Severe Cyclic)' };
        toleranceBadge = { ar: '0.0 مم — غير مسموح بنقص الانصهار', en: '0.0 mm — Zero LOF Permitted' };
        toleranceRuleSummary = {
          ar: 'لا يسمح كود الأنابيب ASME B31.3 بأي نقص انصهار جانبي أو بين الطبقات في وصلات التناكب الحلقية.',
          en: 'ASME B31.3 prohibits lack of fusion across bevel sidewalls, interpass boundaries, and root faces.',
        };
        reject = true;
      }
    } else if (code === 'aws_d1_1') {
      clauseRef = 'AWS D1.1 Clause 8.13.1 & Table 8.2 (CJP Groove)';
      const dRating = measured?.awsDRatingDb ?? 2.0;
      isZeroTolerance = true;
      maxLengthMm = 0;
      maxHeightOrDepthMm = 0;
      amplitudeCriterion = {
        ar: `Class A (d ≤ +4 dB) مرفوض فوراً؛ العيوب المستوية المؤكدة = 0 مم (d الحالي = ${dRating.toFixed(1)} dB)`,
        en: `Class A (d ≤ +4 dB) & confirmed CJP planar fusion flaws = 0 mm (d = ${dRating.toFixed(1)} dB)`,
      };
      toleranceBadge = { ar: '0.0 مم (مرفوض كعيب انصهار مستوي CJP)', en: '0.0 mm (CJP Planar Reject)' };
      toleranceRuleSummary = {
        ar: 'في وصلات التغلغل الكامل الإنشائية (CJP) بكود AWS D1.1 تُرفض عيوب عدم الانصهار والعيوب المصنفة Class A دون تسامح.',
        en: 'In AWS D1.1 Complete Joint Penetration (CJP) structural welds, planar fusion discontinuities and Class A ratings are rejected.',
      };
      reject = true;
    } else if (code === 'api_1104') {
      const apiMaxL = flawId === 'interpass_lof' ? r1(Math.min(50.0, 2 * t)) : 25.0;
      const apiMaxH = r1(Math.min(3.0, 0.125 * t));
      clauseRef = 'API 1104 Sec. 9.3.1–9.3.5 & Sec. 11.4.7.2 (Linear LF/IP)';
      isZeroTolerance = false;
      maxLengthMm = apiMaxL;
      maxHeightOrDepthMm = apiMaxH;
      amplitudeCriterion = {
        ar: `يشترط السعة < 100% DAC والعمق Δh ≤ ${apiMaxH} مم والطول L ≤ ${apiMaxL} مم`,
        en: `Acceptable only if < 100% DAC, Δh ≤ ${apiMaxH} mm, and L ≤ ${apiMaxL} mm`,
      };
      toleranceBadge = {
        ar: `L ≤ ${apiMaxL} مم · Δh ≤ ${apiMaxH} مم (<100% DAC)`,
        en: `L ≤ ${apiMaxL} mm · Δh ≤ ${apiMaxH} mm`,
      };
      toleranceRuleSummary = {
        ar: `يسمح كود خطوط الأنابيب API 1104 بمؤشر خطي محدود لنقص التغلغل أو الانصهار بطول لا يتعدى ${apiMaxL} مم وارتفاع عمقي ≤ ${apiMaxH} مم بشرط عدم تجاوز 100% DAC.`,
        en: `API 1104 permits bounded linear root/interpass indications up to L ≤ ${apiMaxL} mm and through-wall height Δh ≤ ${apiMaxH} mm when below 100% DAC.`,
      };
      reject = measL > apiMaxL || measH > apiMaxH || pctDac >= 100;
    } else {
      clauseRef = 'ISO 11666 Clause 6.2 (AL 2 Planar vs H₀)';
      isZeroTolerance = true;
      maxLengthMm = 0;
      maxHeightOrDepthMm = 0;
      amplitudeCriterion = { ar: 'أي عاكس مستوٍ يتجاوز مستوى التقييم يُرفض (0 مم)', en: 'Planar reflectors above evaluation level rejected (0 mm)' };
      toleranceBadge = { ar: '0.0 مم — مرفوض مستوٍ (AL 2)', en: '0.0 mm — Planar Reject (AL 2)' };
      toleranceRuleSummary = {
        ar: 'طبقاً لمواصفة ISO 11666 (المستوى 2) تُرفض المؤشرات المصنفة كمستوية (نقص انصهار / نقص تغلغل) فور تجاوزها عتبة التقييم.',
        en: 'Under ISO 11666 Acceptance Level 2, indications characterized as planar (LOF / LOP) are unacceptable.',
      };
      reject = true;
    }
  } else if (spec.family === 'volumetric') {
    const isRoundedPoint = flawId === 'tungsten_inclusion' || flawId === 'isolated_pore';
    const isCluster = flawId === 'porosity_cluster';

    if (code === 'asme_viii') {
      if (isRoundedPoint) {
        const maxDiam = r1(Math.min(4.8, Math.max(2.5, 0.25 * t)));
        clauseRef = 'ASME VIII Div.1 Mandatory Appendix 4 & UW-51';
        maxLengthMm = maxDiam;
        maxHeightOrDepthMm = maxDiam;
        amplitudeCriterion = { ar: 'أقل من 100% DAC كمؤشر كروي معزول', en: 'Below 100% DAC as isolated rounded indication' };
        toleranceBadge = { ar: `القطر ≤ ${maxDiam} مم (معزول)`, en: `Ø ≤ ${maxDiam} mm (Isolated)` };
        toleranceRuleSummary = {
          ar: `الشوائب النقطية والفجوات الغازية المعزولة مقبولة في ASME VIII إذا لم يتجاوز قطرها ${maxDiam} مم (الأقل من 0.25t أو 4.8 مم) وكانت سعتها ≤ 100% DAC.`,
          en: `Isolated rounded pores and dense tungsten particles are acceptable under ASME VIII App. 4 up to Ø ≤ ${maxDiam} mm when ≤ 100% DAC.`,
        };
        reject = measL > maxDiam || pctDac > 100;
      } else if (isCluster) {
        const maxClusterL = r1(Math.min(19.0, Math.max(6.0, 0.5 * t)));
        clauseRef = 'ASME VIII Div.1 Appendix 4 / App. 12-3(b)';
        maxLengthMm = maxClusterL;
        maxHeightOrDepthMm = 3.0;
        amplitudeCriterion = { ar: 'السعة ≤ 100% DAC والمسافة بين العناقيد ≥ 25 مم', en: 'Amplitude ≤ 100% DAC & spacing ≥ 25 mm' };
        toleranceBadge = { ar: `طول العنقود L ≤ ${maxClusterL} مم`, en: `Cluster L ≤ ${maxClusterL} mm` };
        toleranceRuleSummary = {
          ar: `المسامية العنقودية الموضعية مقبولة إذا لم يتجاوز طول التجمع ${maxClusterL} مم عند سمك t=${t} مم مع بقاء السعة دون 100% DAC.`,
          en: `Localized cluster porosity is acceptable up to cluster length L ≤ ${maxClusterL} mm at t=${t}mm provided amplitude stays ≤ 100% DAC.`,
        };
        reject = measL > maxClusterL || pctDac > 100;
      } else {
        clauseRef = 'ASME VIII Div.1 Mandatory Appendix 12-3(b) & UW-51';
        maxLengthMm = asmeViiiElongatedLimitMm;
        maxHeightOrDepthMm = r1(Math.min(3.5, 0.2 * t));
        amplitudeCriterion = {
          ar: 'السعة ≤ 100% DAC؛ الطول: 6 مم (t≤19)، t/3 (19<t≤57)، 19 مم (t>57)',
          en: 'Amp ≤ 100% DAC; L ≤ 6mm (t≤19), t/3 (19<t≤57), 19mm (t>57)',
        };
        toleranceBadge = {
          ar: `L ≤ ${asmeViiiElongatedLimitMm} مم (${t <= 19 ? 'حد ثابت 6مم' : t <= 57 ? 't/3' : 'حد أقصى 19مم'})`,
          en: `L ≤ ${asmeViiiElongatedLimitMm} mm (${t <= 19 ? '1/4"' : t <= 57 ? 't/3' : '3/4"'})`,
        };
        toleranceRuleSummary = {
          ar: `لسمك العينة الحالي (t = ${t} مم)، السماحية القصوى لطول العيب المتطاول طبقاً لـ ASME VIII Appendix 12 هي ${asmeViiiElongatedLimitMm} مم بشرط ألا تتجاوز السعة 100% DAC.`,
          en: `At current thickness t = ${t} mm, ASME VIII Appendix 12 sets maximum elongated indication length at ${asmeViiiElongatedLimitMm} mm (provided ≤ 100% DAC).`,
        };
        reject = measL > asmeViiiElongatedLimitMm || pctDac > 100;
      }
    } else if (code === 'asme_b31_3') {
      const limL = isRoundedPoint ? r1(Math.min(4.0, 0.25 * t)) : flawId === 'wormhole_porosity' ? 6.0 : b313SlagLimitMm;
      const limW = r1(Math.min(2.5, t / 3));
      clauseRef = 'ASME B31.3 Table 341.3.2 (Inclusions & Porosity)';
      maxLengthMm = limL;
      maxHeightOrDepthMm = limW;
      amplitudeCriterion = { ar: `السعة ≤ 100% DAC والسمك العرضي ≤ ${limW} مم`, en: `Amplitude ≤ 100% DAC & width/height ≤ ${limW} mm` };
      toleranceBadge = { ar: `L ≤ ${limL} مم · Δh ≤ ${limW} مم`, en: `L ≤ ${limL} mm · Δh ≤ ${limW} mm` };
      toleranceRuleSummary = {
        ar: `يحدد كود أنابيب العمليات ASME B31.3 طول الشوائب الحجمية بـ t/3 (${b313SlagLimitMm} مم) وعرضها/ارتفاعها بـ ${limW} مم كحد أقصى.`,
        en: `ASME B31.3 bounds elongated volumetric inclusions to L ≤ t/3 (${b313SlagLimitMm} mm) and height/width ≤ ${limW} mm.`,
      };
      reject = measL > limL || measH > limW * 1.4;
    } else if (code === 'aws_d1_1') {
      const awsMaxL = isRoundedPoint ? 6.0 : isCluster || flawId === 'wormhole_porosity' ? 10.0 : t < 20 ? 12.0 : 19.0;
      const dRating = measured?.awsDRatingDb ?? 6.5;
      clauseRef = 'AWS D1.1 Clause 8 / Table 8.2 (Class B/C/D)';
      maxLengthMm = awsMaxL;
      maxHeightOrDepthMm = 3.0;
      amplitudeCriterion = {
        ar: 'Class B (L ≤ 19 مم) · Class C (L ≤ 50 مم) · Class D مقبول؛ Class A مرفوض',
        en: 'Class B (L ≤ 19 mm) · Class C (L ≤ 50 mm) · Class A Rejected',
      };
      toleranceBadge = { ar: `L ≤ ${awsMaxL} مم (Class B/C)`, en: `L ≤ ${awsMaxL} mm (Class B/C)` };
      toleranceRuleSummary = {
        ar: `يقيم كود المنشآت AWS D1.1 الشوائب والمسامات عبر فرق الديسيبل (d = a - b - c)؛ للعيوب المتوسطة Class B الطول الأقصى المسموح ${awsMaxL} مم.`,
        en: `AWS D1.1 evaluates volumetric discontinuities by dB rating (d = a - b - c), permitting up to L ≤ ${awsMaxL} mm for Class B medium flaws.`,
      };
      reject = dRating <= 4 || measL > awsMaxL;
    } else if (code === 'api_1104') {
      const apiVolL = isRoundedPoint
        ? r1(Math.min(3.2, 0.25 * t))
        : isCluster || flawId === 'wormhole_porosity'
        ? 13.0
        : r1(Math.min(50.0, 2 * t));
      clauseRef = 'API 1104 Sec. 9.3.8–9.3.9 & Sec. 11.4.7.3 (Volumetric)';
      maxLengthMm = apiVolL;
      maxHeightOrDepthMm = isRoundedPoint ? apiVolL : 3.2;
      amplitudeCriterion = { ar: 'مؤشر حجمي مدفون (أقل من مستوى مرجع UT الخطي)', en: 'Buried volumetric indication within API 1104 Table 4/UT limits' };
      toleranceBadge = { ar: `L ≤ ${apiVolL} مم (حجمي API)`, en: `L ≤ ${apiVolL} mm (API Volumetric)` };
      toleranceRuleSummary = {
        ar: `يمنح API 1104 سماحية أوسع للشوائب الحجمية المدفونة في خطوط الأنابيب تصل إلى ${apiVolL} مم (${isRoundedPoint ? 'الأقل من 3.2 مم أو 0.25t' : isCluster || flawId === 'wormhole_porosity' ? '13 مم (1/2 بوصة)' : 'الأقل من 2t أو 50 مم'}).`,
        en: `API 1104 permits buried volumetric discontinuities up to ${apiVolL} mm (${isRoundedPoint ? 'min(3.2mm, 0.25t)' : isCluster || flawId === 'wormhole_porosity' ? '13mm / 1/2"' : 'min(2t, 50mm)'}).`,
      };
      reject = measL > apiVolL;
    } else {
      const isoVolL = isRoundedPoint ? r1(Math.min(6.0, 0.3 * t)) : r1(Math.min(20.0, 0.75 * t));
      clauseRef = 'ISO 11666 Clause 6.3 / Annex A (Acceptance Level 2)';
      maxLengthMm = isoVolL;
      maxHeightOrDepthMm = 3.0;
      amplitudeCriterion = { ar: 'تحت منحنى القبول AL 2 (H₀ إلى H₀ + 6dB للقصيرة)', en: 'Below AL 2 curve (H0 to H0 + 6dB for short reflectors)' };
      toleranceBadge = { ar: `L ≤ ${isoVolL} مم (AL 2)`, en: `L ≤ ${isoVolL} mm (AL 2)` };
      toleranceRuleSummary = {
        ar: `في مواصفة ISO 11666 (المستوى الثاني AL 2) لسمك t=${t} مم، يُسمح بالعاكسات الحجمية غير المستوية حتى طول ${isoVolL} مم ما لم تتجاوز منحنى القبول العلوي.`,
        en: `Under ISO 11666 Acceptance Level 2 at t=${t}mm, non-planar reflectors are permitted up to L ≤ ${isoVolL} mm below the AL2 curve.`,
      };
      reject = measL > isoVolL;
    }
  } else {
    if (flawId === 'toe_undercut') {
      const maxUcDepth =
        code === 'asme_viii'
          ? r1(Math.min(0.8, 0.1 * t))
          : code === 'asme_b31_3'
          ? r1(Math.min(1.0, 0.25 * t))
          : code === 'aws_d1_1'
          ? 1.0
          : code === 'api_1104'
          ? r1(Math.min(0.8, 0.125 * t))
          : r1(Math.min(0.5, 0.05 * t));
      const maxUcLen = code === 'iso_11666' ? 25.0 : 50.0;
      clauseRef =
        code === 'asme_viii'
          ? 'ASME VIII Div.1 UW-35(a) (Undercut)'
          : code === 'asme_b31_3'
          ? 'ASME B31.3 Table 341.3.2 (Undercut)'
          : code === 'aws_d1_1'
          ? 'AWS D1.1 Table 8.1 (Undercut Depth)'
          : code === 'api_1104'
          ? 'API 1104 Sec. 9.7 / Table 4'
          : 'ISO 5817 Level B / ISO 11666';
      maxLengthMm = maxUcLen;
      maxHeightOrDepthMm = maxUcDepth;
      amplitudeCriterion = {
        ar: `المعيار الحاكم هو عمق النحر Δh ≤ ${maxUcDepth} مم (يُقاس صوتياً في المسار الثاني + بصرياً)`,
        en: `Governed by undercut depth Δh ≤ ${maxUcDepth} mm (verified in Leg 2 + VT gauge)`,
      };
      toleranceBadge = {
        ar: `العمق Δh ≤ ${maxUcDepth} مم · L ≤ ${maxUcLen} مم`,
        en: `Depth Δh ≤ ${maxUcDepth} mm · L ≤ ${maxUcLen} mm`,
      };
      toleranceRuleSummary = {
        ar: `النحر السطحي عند حرف الكاب يُحكم أساساً بعمقه داخل المعدن الأصلي: الحد الأقصى في هذا الكود هو Δh ≤ ${maxUcDepth} مم (أكثر من ذلك يسبب تركيز إجهادات سطحي مرفوض).`,
        en: `Toe undercut tolerance is governed by groove depth into parent steel: maximum permissible depth under this code is Δh ≤ ${maxUcDepth} mm.`,
      };
      reject = measH > maxUcDepth || measL > maxUcLen;
    } else if (flawId === 'root_concavity') {
      const maxRcDepth =
        code === 'asme_viii'
          ? r1(Math.min(1.2, 0.08 * t))
          : code === 'iso_11666'
          ? r1(Math.min(1.0, 0.1 * t))
          : r1(Math.min(1.6, 0.1 * t));
      const maxRcLen = code === 'api_1104' ? 50.0 : r1(Math.min(40.0, 1.5 * t));
      clauseRef =
        code === 'asme_viii'
          ? 'ASME VIII Div.1 UW-35 / App. 12'
          : code === 'asme_b31_3'
          ? 'ASME B31.3 Table 341.3.2 (Root Concavity)'
          : code === 'aws_d1_1'
          ? 'AWS D1.1 Clause 8 (Root Profile)'
          : code === 'api_1104'
          ? 'API 1104 Sec. 9.3.6 (Root Concavity)'
          : 'ISO 5817 / ISO 11666 (Root Suck-Back)';
      maxLengthMm = maxRcLen;
      maxHeightOrDepthMm = maxRcDepth;
      amplitudeCriterion = {
        ar: `يشترط انحناء أملس وصافي سمك الجدار ≥ t (عمق التقعر Δh ≤ ${maxRcDepth} مم)`,
        en: `Smooth contour & net wall thickness ≥ t required (Δh ≤ ${maxRcDepth} mm)`,
      };
      toleranceBadge = {
        ar: `Δh ≤ ${maxRcDepth} مم · L ≤ ${maxRcLen} مم`,
        en: `Δh ≤ ${maxRcDepth} mm · L ≤ ${maxRcLen} mm`,
      };
      toleranceRuleSummary = {
        ar: `يُقبل تقعر الجذر المنحني الأملس فقط إذا لم يقلل صافي سمك اللحام عن سمك التصميم (عمق التقعر المسموح ≤ ${maxRcDepth} مم عند t=${t} مم).`,
        en: `Smooth root concavity (suck-back) is acceptable only when net weld throat meets design thickness (max depression Δh ≤ ${maxRcDepth} mm at t=${t}mm).`,
      };
      reject = measH > maxRcDepth || measL > maxRcLen;
    } else {
      const maxLamL =
        code === 'api_1104' ? 6.4 : code === 'asme_b31_3' || code === 'iso_11666' ? 20.0 : 25.0;
      clauseRef =
        code === 'asme_viii'
          ? 'ASME Sec V T-472 / SA-578 Level B'
          : code === 'aws_d1_1'
          ? 'AWS D1.1 Clause 7.2.3 (Plate Discontinuities)'
          : code === 'api_1104'
          ? 'API 5L / API 1104 Bevel Scan Zone'
          : code === 'asme_b31_3'
          ? 'ASME B31.3 / ASTM A435 Scan Zone'
          : 'EN 10160 Class S2/E2 & ISO 17640';
      maxLengthMm = maxLamL;
      maxHeightOrDepthMm = null;
      amplitudeCriterion = {
        ar: 'فحص بمجس رأسي 0°: فقدان صدى القاع الكامل بمنطقة المسح يستوجب إجراء بديل أو رفض فوق الحد',
        en: '0° Straight-Beam Scan: Total backwall loss in angle-beam scan zone bounded by L_max',
      };
      toleranceBadge = {
        ar: `L ≤ ${maxLamL} مم بمنطقة مسح اللحام`,
        en: `L ≤ ${maxLamL} mm in Scan Zone`,
      };
      toleranceRuleSummary = {
        ar: `تورق المعدن الأساسي (Lamination) داخل منطقة حركة مجس الزاوية يحجب الأشعة عن اللحام؛ الحد الأقصى المسموح دون تعديل إجراء الفحص أو الإصلاح هو ${maxLamL} مم.`,
        en: `Base-metal rolling lamination inside the angle-beam scan path masks weld flaws; max allowable extent in scan zone is ${maxLamL} mm.`,
      };
      reject = measL > maxLamL;
    }
  }

  const evaluationExplanation = isZeroTolerance
    ? {
        ar: `مرفوض قطعياً طبقاً لـ ${clauseRef}: السماحية لهذا العيب = 0.0 مم (غير مسموح بأي طول؛ الطول المقاس حالياً L = ${measL.toFixed(1)} مم).`,
        en: `STRICTLY REJECTED per ${clauseRef}: Allowable tolerance is 0.0 mm (Zero tolerance regardless of size; measured L = ${measL.toFixed(1)} mm).`,
      }
    : reject
    ? {
        ar: `مرفوض طبقاً لـ ${clauseRef}: القيم المقاسة (L = ${measL.toFixed(1)} مم، Δh = ${measH.toFixed(1)} مم) تتجاوز السماحية القصوى المسموحة (${toleranceBadge.ar}).`,
        en: `REJECTED per ${clauseRef}: Measured size (L = ${measL.toFixed(1)} mm, Δh = ${measH.toFixed(1)} mm) exceeds code allowable tolerance (${toleranceBadge.en}).`,
      }
    : {
        ar: `مقبول هندسياً طبقاً لـ ${clauseRef}: القيم المقاسة (L = ${measL.toFixed(1)} مم، Δh = ${measH.toFixed(1)} مم) تقع ضمن السماحية المسموحة (${toleranceBadge.ar}).`,
        en: `ACCEPTED per ${clauseRef}: Measured size (L = ${measL.toFixed(1)} mm, Δh = ${measH.toFixed(1)} mm) is within code allowable tolerance (${toleranceBadge.en}).`,
      };

  return {
    flawId,
    code,
    codeCitation: codeMeta.fullTitle.en,
    clauseRef,
    thicknessMm: t,
    isZeroTolerance,
    maxLengthMm,
    maxHeightOrDepthMm,
    amplitudeCriterion,
    toleranceBadge,
    toleranceRuleSummary,
    reject,
    evaluationExplanation,
  };
}

/**
 * Generates the complete 16-defect allowable tolerance schedule for the active code & specimen thickness t.
 */
export function getAllDefectsCodeToleranceSchedule(
  code: InspectionCodeId,
  thicknessMm: number
): Array<{ defect: ComprehensiveDefectSpec; tolerance: DefectCodeToleranceResult }> {
  return ALL_WELD_DEFECTS_CATALOG.map((defect) => ({
    defect,
    tolerance: getDefectCodeTolerance(defect.id, code, thicknessMm, {
      lengthMm: defect.lengthMm,
      heightMm: defect.heightMm,
    }),
  }));
}
