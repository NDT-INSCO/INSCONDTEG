import { Language } from '../types';

export type LocalText = Record<Language, string>;

const text = (ar: string, en: string): LocalText => ({ ar, en });

export type PracticalMethod = 'VT' | 'PT' | 'MT' | 'UT' | 'RT' | 'ET';

export interface PPACriterion {
  id: string;
  label: LocalText;
  /** Missing this step makes the task fail regardless of the total score. */
  critical?: boolean;
  /** What the assessor must actually observe, not what the candidate claims. */
  evidence: LocalText;
}

export interface PracticalTask {
  id: string;
  method: PracticalMethod;
  title: LocalText;
  objective: LocalText;
  specimen: LocalText;
  equipment: string[];
  procedureNote: LocalText;
  safety: LocalText;
  estimatedMinutes: number;
  criteria: PPACriterion[];
}

/**
 * Training task bank. Every task describes an observable behaviour on a
 * specimen, the acceptance evidence an assessor must see, and the safety
 * constraints of the method. Nothing here is a qualification standard: the
 * criteria are written for a supervised training record, not for an accredited
 * examination.
 */
export const PRACTICAL_TASKS: PracticalTask[] = [
  {
    id: 'pa-vt-geometry',
    method: 'VT',
    title: text('قياس هندسة وصلة تناكبية وتوثيقها', 'Measure and record a butt-weld geometry'),
    objective: text('قياس ارتفاع التاج وHi-Lo والقضم بأداة مناسبة وتسجيل النتائج بوحدات واضحة.', 'Measure cap height, Hi-Lo and undercut with a suitable gauge and record results in stated units.'),
    specimen: text('لوحة لحام تناكبي مع عيب هندسي معروف الموضع.', 'Butt-welded plate with a documented geometric feature at a known location.'),
    equipment: ['Cambridge gauge', 'Hi-Lo gauge', 'depth gauge', 'light meter', 'camera'],
    procedureNote: text('يحدد المُقيِّم مواضع القياس الثلاثة قبل البدء؛ لا يختار المتدرب المواضع لتجنب انتقاء الأفضل.', 'The assessor fixes the three measurement locations before the candidate starts, so the candidate cannot cherry-pick.'),
    safety: text('سطح بارد، حواف آمنة، إضاءة كافية، دون رفع أحمال.', 'Cool surface, safe edges, adequate lighting, no lifting.'),
    estimatedMinutes: 25,
    criteria: [
      { id: 'c1', label: text('تحقق من حالة الأداة وصفرها', 'Checks gauge condition and zero'), evidence: text('يذكر/يُظهر التحقق قبل أول قراءة.', 'States or shows the check before the first reading.'), critical: true },
      { id: 'c2', label: text('تثبيت المرجع على السطح الصحيح', 'Datums the gauge on the correct surface'), evidence: text('المرجع على سطح الوصلة لا على القاعدة الخطأ.', 'Datum sits on the specified surface, not the wrong one.'), critical: true },
      { id: 'c3', label: text('قراءة ثلاث قيم هندسية', 'Reads three geometric values'), evidence: text('ثلاث قيم مطابقة للمواضع المحددة ±0.5 mm.', 'Three values matching the fixed locations within 0.5 mm.') },
      { id: 'c4', label: text('تسجيل الوحدة والموضع والأداة', 'Records unit, location and tool'), evidence: text('كل قيمة مصحوبة بالوحدة ورقم الموضع والأداة.', 'Each value carries its unit, location index and tool.') },
      { id: 'c5', label: text('الامتناع عن قرار قبول/رفض', 'Declines to issue an acceptance decision'), evidence: text('يذكر أن القرار يحتاج بند الكود والإصدار.', 'States that the decision needs the code clause and edition.'), critical: true },
    ],
  },
  {
    id: 'pa-pt-cycle',
    method: 'PT',
    title: text('تنفيذ دورة سائل نافذ كاملة', 'Execute a complete penetrant cycle'),
    objective: text('تنفيذ التنظيف والتطبيق والإزالة والتطوير بترتيب صحيح وتسجيل كل زمن.', 'Perform cleaning, application, removal and development in order, recording each time.'),
    specimen: text('عينة لحام بشرخ سطحي مرجعي.', 'Weld specimen with a reference surface-breaking crack.'),
    equipment: ['penetrant', 'cleaner', 'developer', 'lint-free cloths', 'timer', 'UV lamp (if fluorescent)'],
    procedureNote: text('الأزمنة الحرجة (تشبع، تصريف، تطوير) يحددها المُقيِّم من الإجراء المكتوب قبل البدء.', 'The assessor sets the critical dwell, drain and development times from the written procedure before starting.'),
    safety: text('تهوية، قفازات، حماية عين، إدارة نفايات.', 'Ventilation, gloves, eye protection, waste handling.'),
    estimatedMinutes: 40,
    criteria: [
      { id: 'c1', label: text('تهوية ومعدات حماية قبل الفتح', 'Ventilation and PPE before opening'), evidence: text('التهوية تعمل والحماية مرتدية قبل فتح العبوة.', 'Ventilation running and PPE worn before opening containers.'), critical: true },
      { id: 'c2', label: text('تنظيف وتجفيف قبل التطبيق', 'Cleans and dries before application'), evidence: text('السطح نظيف وجاف عند التطبيق.', 'Surface clean and dry at application.') },
      { id: 'c3', label: text('تطبيق يغطي المنطقة المطلوبة', 'Coverage of the required area'), evidence: text('تغطية كاملة دون جفاف موضعي.', 'Full coverage without local drying.'), critical: true },
      { id: 'c4', label: text('زمن تشبع وتصريف مطابق', 'Dwell and drain time match'), evidence: text('الزمن المسجل داخل نطاق الإجراء.', 'Recorded time inside the procedure range.') },
      { id: 'c5', label: text('إزالة دون إفراط', 'Removal without over-washing'), evidence: text('خلفية نظيفة دون سحب المؤشر من العيب.', 'Clean background without pulling the indication out.') },
      { id: 'c6', label: text('تطوير وقراءة في الإضاءة الصحيحة', 'Develops and reads under correct lighting'), evidence: text('قراءة بعد زمن التطوير وتحت الإضاءة المناسبة.', 'Reads after development time under the required lighting.') },
      { id: 'c7', label: text('تسجيل المؤشر وأبعاده', 'Records the indication and size'), evidence: text('الموقع والطول والاتجاه مسجلة.', 'Location, length and orientation recorded.') },
    ],
  },
  {
    id: 'pa-mt-current',
    method: 'MT',
    title: text('تمغنط عينة وحساب شدة التيار', 'Magnetise a specimen and compute current'),
    objective: text('حساب شدة التيار من قاعدة L/D، تمغنط العينة، تفسير المؤشر، ثم إزالة التمغنط.', 'Compute current from the L/D rule, magnetise, interpret the indication, then demagnetise.'),
    specimen: text('عينة أنبوبية فولاذية 25 mm بشرخ طولي مرجعي.', '25 mm steel tubular specimen with a reference longitudinal crack.'),
    equipment: ['yoke or cable wrap', 'current source', 'wet particles', 'Gauss meter', 'L/D reference'],
    procedureNote: text('المُقيِّم يعطي القطر والطول ويتحقق من الحساب قبل تطبيق التيار.', 'The assessor supplies diameter and length and checks the calculation before current is applied.'),
    safety: text('عزل كهربائي، تجنب الحلقات المفتوحة، سطح جاف.', 'Electrical isolation, avoid open loops, dry surface.'),
    estimatedMinutes: 35,
    criteria: [
      { id: 'c1', label: text('حساب L/D وشدة التيار', 'Computes L/D and current'), evidence: text('الحساب مكتوب قبل التطبيق ومطابق للمعطيات.', 'Calculation written before application and matching the inputs.'), critical: true },
      { id: 'c2', label: text('اختيار اتجاه التمغنط للعيب الطولي', 'Selects field direction for a longitudinal flaw'), evidence: text('اتجاه المجال عمودي على العيب المتوقع.', 'Field direction perpendicular to the expected flaw.'), critical: true },
      { id: 'c3', label: text('تطبيق الجسيمات دون جفاف', 'Applies particles without drying'), evidence: text('طبقة رطبة موحدة أثناء التمغنط.', 'Uniform wet film during magnetisation.') },
      { id: 'c4', label: text('تفسير المؤشر وتصنيفه', 'Interprets and classifies the indication'), evidence: text('تمييز مؤشر خطي حاد عن خلفية أو تدفق هندسي.', 'Distinguishes a sharp linear indication from background or geometric leakage.') },
      { id: 'c5', label: text('إزالة التمغنط والتحقق', 'Demagnetises and verifies'), evidence: text('قراءة المغناطيسية المتبقية مسجلة.', 'Residual field reading recorded.') },
    ],
  },
  {
    id: 'pa-ut-calibration',
    method: 'UT',
    title: text('معايرة المدى والحساسية ومسح خط لحام', 'Range and sensitivity calibration with a weld scan'),
    objective: text('معايرة المدى على كتلة V1، بناء DAC، ثم مسح خط لحام بخطوات مناسبة.', 'Calibrate range on a V1 block, build a DAC, then scan a weld line with adequate step size.'),
    specimen: text('كتلة V1 ولوحة لحام بسماكة معلومة.', 'V1 block and a welded plate of known thickness.'),
    equipment: ['UT flaw detector', '60° probe', 'couplant', 'V1/V2 block', 'DAC block', 'ruler'],
    procedureNote: text('المُقيِّم يتحقق من معايرة المدى قبل المسح ويسجل المكاسب.', 'The assessor verifies range calibration before the scan and records the gain values.'),
    safety: text('سطح نظيف، كابل آمن، لا تشغيل أثناء صيانة الجهاز.', 'Clean surface, secure cable, no operation during instrument maintenance.'),
    estimatedMinutes: 45,
    criteria: [
      { id: 'c1', label: text('معايرة المدى على V1', 'Range calibration on V1'), evidence: text('انعكاسات السماكات المعروفة في مواقعها.', 'Known thickness echoes at their correct positions.'), critical: true },
      { id: 'c2', label: text('ضبط الحساسية وبناء DAC', 'Sensitivity set and DAC built'), evidence: text('ثلاث نقاط مرجعية على الأقل ومنحنى مسجل.', 'At least three reference points and a recorded curve.') },
      { id: 'c3', label: text('خطوات مسح لا تتجاوز نصف عرض الحزمة', 'Scan steps within half beam width'), evidence: text('الخطوات مقاسة أو محسوبة ومسجلة.', 'Steps measured or calculated and recorded.') },
      { id: 'c4', label: text('تمييز إشارة العيب من الهندسة', 'Separates flaw signal from geometry'), evidence: text('يذكر احتمال انعكاس هندسي ويبرره.', 'Names a geometric reflection possibility and justifies it.') },
      { id: 'c5', label: text('قياس الموقع والعمق من الشاشة', 'Reads position and depth from the screen'), evidence: text('القيم مطابقة للمواقع المرجعية داخل الحد المعلن.', 'Values match reference locations within the stated tolerance.') },
      { id: 'c6', label: text('ذكر حدود الطريقة', 'States the method limits'), evidence: text('يذكر حداً واحداً على الأقل (هندسة السطح/الاقتران/التغطية).', 'Names at least one limit (surface geometry, coupling, coverage).'), critical: true },
    ],
  },
  {
    id: 'pa-rt-image-quality',
    method: 'RT',
    title: text('تقييم جودة صورة إشعاعية', 'Evaluate radiographic image quality'),
    objective: text('قياس الكثافة البصرية، اختيار IQI، وتسجيل الحساسية المحققة وعدم الوضوح الهندسي.', 'Measure optical density, select an IQI, and record achieved sensitivity and geometric unsharpness.'),
    specimen: text('فيلم أو صورة رقمية مرجعية مع IQI مرئي.', 'Reference film or digital image with a visible IQI.'),
    equipment: ['densitometer', 'IQI set', 'film viewer', 'magnifier', 'reference procedure'],
    procedureNote: text('المُقيِّم يحدد منطقة الاهتمام مسبقاً؛ لا تُقاس الكثافة في منطقة محروقة.', 'The assessor fixes the region of interest beforehand; density is not measured in a burn-out area.'),
    safety: text('هذا تمرين على صورة مؤرشفة — لا مصدر إشعاع ولا تعريض.', 'This is an archived-image exercise: no radiation source and no exposure.'),
    estimatedMinutes: 30,
    criteria: [
      { id: 'c1', label: text('قياس الكثافة البصرية', 'Measures optical density'), evidence: text('قراءتان على الأقل داخل منطقة الاهتمام.', 'At least two readings within the region of interest.') },
      { id: 'c2', label: text('اختيار IQI المناسب للسماكة', 'Selects the IQI for the thickness'), evidence: text('الاختيار مبرر بالسماكة والإجراء.', 'Choice justified by thickness and procedure.') },
      { id: 'c3', label: text('تسجيل الحساسية المحققة', 'Records achieved sensitivity'), evidence: text('رقم السلك المرئي مسجل.', 'Visible wire number recorded.') },
      { id: 'c4', label: text('تمييز عدم الوضوح الهندسي', 'Identifies geometric unsharpness'), evidence: text('يحدد سببه ويقترح تصحيحاً.', 'Identifies the cause and proposes a correction.') },
      { id: 'c5', label: text('عدم إصدار حكم قبول', 'Does not issue an acceptance decision'), evidence: text('يصرّح بأن القبول يحتاج الكود والإصدار.', 'States that acceptance needs the code and edition.'), critical: true },
    ],
  },
  {
    id: 'pa-et-surface-crack',
    method: 'ET',
    title: text('كشف شرخ سطحي بتيار دوامي', 'Detect a surface crack with eddy current'),
    objective: text('معايرة المسبار على عيب مرجعي، مسح السطح باتجاهين، وتمييز إشارة رفع الملف عن العيب.', 'Calibrate the probe on a reference flaw, scan in two directions, and separate lift-off from a flaw.'),
    specimen: text('لوحة ألومنيوم بعيب مرجعي معروف.', 'Aluminium plate with a known reference flaw.'),
    equipment: ['eddy current instrument', 'pancake probe', 'reference block', 'ruler', 'tape'],
    procedureNote: text('المُقيِّم يحدد اتجاهي المسح المتعامدين قبل البدء.', 'The assessor defines the two perpendicular scan directions before starting.'),
    safety: text('كهرباء آمنة، سطح غير حاد، لا أسطح ساخنة.', 'Safe electrical setup, no sharp surfaces, no hot surfaces.'),
    estimatedMinutes: 35,
    criteria: [
      { id: 'c1', label: text('معايرة على عيب مرجعي', 'Calibration on a reference flaw'), evidence: text('نقطة الصفر والطور مضبوطة على المرجع.', 'Null and phase set on the reference.') },
      { id: 'c2', label: text('مسح باتجاهين متعامدين', 'Scans in two perpendicular directions'), evidence: text('تغطية السطح مرتين مع تسجيل الاتجاه.', 'Surface covered twice with direction recorded.'), critical: true },
      { id: 'c3', label: text('تثبيت المسافة', 'Maintains constant lift-off'), evidence: text('لا تغيّر مسافة ثابتة أثناء المسح.', 'No deliberate gap change during the scan.') },
      { id: 'c4', label: text('تمييز رفع الملف من العيب', 'Distinguishes lift-off from a flaw'), evidence: text('يجرب تغييراً مقصوداً ويقارن الاتجاه.', 'Introduces a deliberate change and compares direction.') },
      { id: 'c5', label: text('تسجيل النتيجة مع حدود الطريقة', 'Records the result with method limits'), evidence: text('يذكر حدود العمق والنفاذية والاتجاه.', 'Names depth, permeability and orientation limits.'), critical: true },
    ],
  },
];

export const PRACTICAL_METHODS: PracticalMethod[] = ['VT', 'PT', 'MT', 'UT', 'RT', 'ET'];

/** 0 = not observed, 1 = needs coaching, 2 = meets, 3 = exceeds (independent + explains why). */
export const PPA_SCALE = [
  { value: 0, label: text('لم يُلاحظ', 'Not observed'), detail: text('لم تُنفَّذ الخطوة أو لم تُرَ.', 'Step not performed or not seen.') },
  { value: 1, label: text('يحتاج توجيهاً', 'Needs coaching'), detail: text('نُفِّذت بعد توجيه أو بخطأ مؤثر.', 'Performed after prompting or with a material error.') },
  { value: 2, label: text('يطابق', 'Meets'), detail: text('نُفِّذت بشكل صحيح ومستقل.', 'Performed correctly and independently.') },
  { value: 3, label: text('يتجاوز', 'Exceeds'), detail: text('صحيح ومستقل مع شرح السبب.', 'Correct and independent with the reasoning explained.') },
] as const;

/**
 * Training-record policy. Deliberately explicit that this is not a
 * qualification, not an accredited examination, and not evidence of competence
 * outside the supervising organisation.
 */
export const PPA_POLICY = {
  title: text('سجل تقييم عملي تدريبي', 'Training practical assessment record'),
  statement: text(
    'هذا سجل تدريبي داخلي لمهمة عملية تحت إشراف مُقيِّم. ليس شهادة، ولا امتحاناً معتمداً، ولا دليلاً على الكفاءة المهنية خارج المنظمة المشرفة. لا يصدر عن ASNT أو ISO أو أي جهة اعتماد، ولا يعوّض التدريب الميداني أو الاختبار الرسمي.',
    'This is an internal training record for a supervised practical task. It is not a certificate, not an accredited examination, and not evidence of professional competence outside the supervising organisation. It is not issued by ASNT, ISO or any accrediting body, and does not replace field training or a formal examination.'
  ),
  assessorRule: text(
    'المُقيِّم يجب أن يكون مؤهلاً في الطريقة ومفصولاً عن المتدرب. لا يوقّع المتدرب على تقييم نفسه.',
    'The assessor must be qualified in the method and independent of the candidate. A candidate cannot sign their own assessment.'
  ),
  retention: text(
    'السجل محلي في المتصفح. التصدير اختياري ومسؤولية من يشاركه. لا تُخزَّن مستندات هوية أو صور شهادات.',
    'The record is local to the browser. Export is optional and the responsibility of whoever shares it. No identity documents or certificate images are stored.'
  ),
  outcomeRule: text(
    'أي خطوة حرجة غير مطابقة (0 أو 1) تعني «لم يجتز» بغض النظر عن مجموع الدرجات.',
    'Any critical step below "meets" (0 or 1) means "not yet" regardless of the total score.'
  ),
} as const;

export function tasksForMethod(method: PracticalMethod): PracticalTask[] {
  return PRACTICAL_TASKS.filter(task => task.method === method);
}

export function getPracticalTask(taskId: string): PracticalTask | undefined {
  return PRACTICAL_TASKS.find(task => task.id === taskId);
}
