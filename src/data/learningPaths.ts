import { Language } from '../types';
import { NDE_ED_COURSES, NDE_ED_LESSONS } from './ndeEd';

export type LocalText = Record<Language, string>;

const text = (ar: string, en: string): LocalText => ({ ar, en });

export interface PathStep {
  id: string;
  kind: 'course' | 'practical' | 'reading' | 'check';
  title: LocalText;
  detail: LocalText;
  /** NDE-Ed course id when `kind === 'course'`. */
  courseId?: string;
  /** Practical task id when `kind === 'practical'`. */
  practicalTaskId?: string;
  minutes?: number;
}

export interface LearningPath {
  id: string;
  title: LocalText;
  summary: LocalText;
  audience: LocalText;
  outcome: LocalText;
  /** Explicit statement of what finishing the path does NOT mean. */
  limits: LocalText;
  steps: PathStep[];
}

const courseStep = (courseId: string, detail: LocalText): PathStep => {
  const course = NDE_ED_COURSES.find(item => item.id === courseId);
  return {
    id: `step-${courseId}`,
    kind: 'course',
    title: course ? course.title : text(courseId, courseId),
    detail,
    courseId,
    minutes: course ? course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0) : undefined,
  };
};

/**
 * Curated sequences over the same content. Paths do not duplicate material: each
 * step points at a course, a practical task or a check that already exists, so a
 * correction to a lesson propagates everywhere.
 */
export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-foundations',
    title: text('مسار الأساس الفيزيائي', 'Physics foundations path'),
    summary: text('ابدأ من الفيزياء ثم الطرق الأربع التقليدية بترتيب يبني على بعضه.', 'Start with physics, then the four conventional methods in a building order.'),
    audience: text('لمن لم يدرس NDT من قبل أو يريد ترتيب معلوماته.', 'For newcomers to NDT, or anyone rebuilding their fundamentals.'),
    outcome: text('فهم كيف يتكون العيب وكيف تتفاعل الطريقة معه قبل الدخول في إجراءات الفحص.', 'Understand how a flaw forms and how a method interacts with it before moving to procedures.'),
    limits: text('مسار تعلم ذاتي؛ لا يعطي ساعات تدريب معتمدة ولا يؤهل للعمل على معدات حقيقية.', 'A self-study path; it does not award accredited training hours or authorise work on real equipment.'),
    steps: [
      courseStep('nde-physics', text('ابدأ بالفيزياء: الموجات، المقاومة الصوتية، المغناطيسية، الإشعاع، والخاصية الشعرية.', 'Start with physics: waves, acoustic impedance, magnetism, radiation and capillarity.')),
      { id: 'step-check-physics', kind: 'check', title: text('فحص فهم الفيزياء', 'Physics knowledge check'), detail: text('أكمل الفحص الشامل للمقرر قبل الانتقال.', 'Complete the course self-check before moving on.') },
      courseStep('nde-vt', text('الفحص البصري أولاً لأنه يبني عادة الملاحظة والتوثيق.', 'Visual testing first, because it builds observation and recording habits.')),
      courseStep('nde-pt', text('ثم السائل النافذ للعيوب السطحية المفتوحة.', 'Then penetrant testing for open surface flaws.')),
      courseStep('nde-mt', text('ثم الجسيمات المغناطيسية للمواد الحديدية.', 'Then magnetic particle testing for ferromagnetic materials.')),
      { id: 'step-practical-vt', kind: 'practical', title: text('تقييم عملي: قياس هندسة وصلة', 'Practical: weld geometry measurement'), detail: text('نفّذها مع مُقيِّم مستقل على عينة.', 'Perform it with an independent assessor on a specimen.'), practicalTaskId: 'pa-vt-geometry', minutes: 25 },
      { id: 'step-practical-pt', kind: 'practical', title: text('تقييم عملي: دورة سائل نافذ', 'Practical: penetrant cycle'), detail: text('سجّل الأزمنة الحرجة كلها.', 'Record every critical dwell time.'), practicalTaskId: 'pa-pt-cycle' },
      { id: 'step-reading-codes', kind: 'reading', title: text('قراءة الكود المطبق', 'Read the applicable code'), detail: text('افتح نسخة الكود المطلوبة في العقد قبل أي قرار قبول.', 'Open the code edition required by the contract before any acceptance decision.') },
    ],
  },
  {
    id: 'path-volumetric',
    title: text('مسار الفحص الحجمي (UT/RT)', 'Volumetric inspection path (UT/RT)'),
    summary: text('الموجات فوق الصوتية والإشعاع: الكشف داخل الجدار وحدود كل طريقة.', 'Ultrasonics and radiography: seeing inside the wall and the limits of each method.'),
    audience: text('لمن يعمل في فحص اللحامات والأوعية والأنابيب.', 'For those working on weld, vessel and piping inspection.'),
    outcome: text('اختيار الطريقة الحجمية المناسبة وتفسير الإشارة مع حدودها.', 'Choose the right volumetric method and interpret the signal with its limits.'),
    limits: text('لا يمنح صلاحية توقيع تقارير UT/RT؛ التوقيع يحتاج تأهيلاً رسمياً من جهة معترف بها.', 'Does not authorise signing UT/RT reports; that requires formal qualification from a recognised body.'),
    steps: [
      courseStep('nde-physics', text('راجع فيزياء الموجات والتوهين قبل UT وRT.', 'Review wave physics and attenuation before UT and RT.')),
      courseStep('nde-ut', text('UT: المسابر، المعايرة، DAC، مسح اللحام.', 'UT: probes, calibration, DAC and weld scanning.')),
      { id: 'step-practical-ut', kind: 'practical', title: text('تقييم عملي: معايرة ومسح UT', 'Practical: UT calibration and scan'), detail: text('معايرة المدى ثم مسح بخطوات صحيحة.', 'Range calibration, then a scan with correct step size.'), practicalTaskId: 'pa-ut-calibration' },
      courseStep('nde-rt', text('RT: التعريض، الفيلم، جودة الصورة، والسلامة.', 'RT: exposure, film, image quality and safety.')),
      { id: 'step-practical-rt', kind: 'practical', title: text('تقييم عملي: جودة صورة إشعاعية', 'Practical: radiographic image quality'), detail: text('تمرين على صورة مؤرشفة، دون أي مصدر إشعاع.', 'An archived-image exercise with no radiation source.'), practicalTaskId: 'pa-rt-image-quality' },
      { id: 'step-check-volumetric', kind: 'check', title: text('فحص شامل للمقررين', 'Self-check for both courses'), detail: text('اجتز فحص كل درس قبل الاعتماد على الملخصات.', 'Pass each lesson check before relying on the summaries.') },
    ],
  },
  {
    id: 'path-surface-advanced',
    title: text('مسار الأسطح والتقنيات المتقدمة', 'Surface and advanced techniques path'),
    summary: text('من الإبصار والجسيمات إلى التيارات الدوامية والمصفوفة الطورية.', 'From vision and particles to eddy current and phased array.'),
    audience: text('لمن يعمل في فحص الأسطح والأنابيب والقطع الجوية.', 'For surface, tube and aerospace inspection work.'),
    outcome: text('التمييز بين طرق الأسطح واختيار الأنسب لكل مادة وهندسة.', 'Distinguish surface methods and choose the right one for each material and geometry.'),
    limits: text('لا يغطي FMC/TFM أو الموجات الموجهة أو التصوير الحراري؛ هذه خارج نطاق المحتوى الحالي.', 'Does not cover FMC/TFM, guided waves or thermography; those are outside the current content.'),
    steps: [
      courseStep('nde-vt', text('VT: الإضاءة والتباين وهندسة الوصلة.', 'VT: lighting, contrast and weld geometry.')),
      courseStep('nde-mt', text('MT: التمغنط وقاعدة L/D وإزالة التمغنط.', 'MT: magnetisation, the L/D rule and demagnetisation.')),
      courseStep('nde-et', text('ET: الحث، المستوي الممانعي، الأنابيب، والترددات المتعددة.', 'ET: induction, the impedance plane, tubing and multiple frequencies.')),
      { id: 'step-practical-mt', kind: 'practical', title: text('تقييم عملي: تمغنط وحساب تيار', 'Practical: magnetisation and current calculation'), detail: text('احسب قبل التطبيق ثم قِس المغناطيسية المتبقية.', 'Calculate before applying, then measure residual field.'), practicalTaskId: 'pa-mt-current' },
      { id: 'step-practical-et', kind: 'practical', title: text('تقييم عملي: كشف شرخ بتيار دوامي', 'Practical: eddy current crack detection'), detail: text('مسح باتجاهين وتمييز رفع الملف.', 'Scan in two directions and separate lift-off.'), practicalTaskId: 'pa-et-surface-crack' },
      courseStep('nde-ut', text('راجع فصل UT المتقدم لفهم PAUT/TOFD قبل أي عمل متقدم.', 'Review the advanced UT lesson to understand PAUT/TOFD before advanced work.')),
    ],
  },
];

export function getLearningPath(pathId: string): LearningPath | undefined {
  return LEARNING_PATHS.find(path => path.id === pathId);
}

export function pathStats(path: LearningPath) {
  const minutes = path.steps.reduce((sum, step) => sum + (step.minutes || 0), 0);
  return {
    steps: path.steps.length,
    courses: path.steps.filter(step => step.kind === 'course').length,
    practical: path.steps.filter(step => step.kind === 'practical').length,
    checks: path.steps.filter(step => step.kind === 'check').length,
    minutes,
  };
}

/**
 * Validates that every step points at content that exists. Returns a list of
 * human-readable problems so tests and the UI can fail loudly instead of
 * showing a dead step.
 */
export function validatePath(path: LearningPath): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const step of path.steps) {
    if (seen.has(step.id)) problems.push(`${path.id}: duplicate step id ${step.id}`);
    seen.add(step.id);
    if (step.kind === 'course') {
      if (!step.courseId) problems.push(`${path.id}/${step.id}: course step without courseId`);
      else if (!NDE_ED_COURSES.some(course => course.id === step.courseId)) problems.push(`${path.id}/${step.id}: unknown course ${step.courseId}`);
    }
    if (step.kind === 'practical' && !step.practicalTaskId) problems.push(`${path.id}/${step.id}: practical step without a task`);
    if (!step.title.en.trim() || !step.title.ar.trim()) problems.push(`${path.id}/${step.id}: bilingual title required`);
    if (!step.detail.en.trim() || !step.detail.ar.trim()) problems.push(`${path.id}/${step.id}: bilingual detail required`);
  }
  if (path.steps.length < 3) problems.push(`${path.id}: a path needs at least three steps`);
  return problems;
}

/** Lessons referenced by a path, in order, without duplicates. */
export function pathLessonIds(path: LearningPath): string[] {
  const ids: string[] = [];
  for (const step of path.steps) {
    if (step.kind !== 'course' || !step.courseId) continue;
    const course = NDE_ED_COURSES.find(item => item.id === step.courseId);
    course?.lessons.forEach(lesson => {
      if (!ids.includes(lesson.id)) ids.push(lesson.id);
    });
  }
  return ids.filter(id => NDE_ED_LESSONS.some(lesson => lesson.id === id));
}
