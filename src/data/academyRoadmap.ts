import { LocalText, text } from './academyKnowledge';
export type RoadmapState = 'available' | 'review' | 'planned';
export interface AcademyMilestone {
  id: string;
  state: RoadmapState;
  title: LocalText;
  goal: LocalText;
  deliverables: LocalText[];
  acceptance: LocalText;
  dependsOn: string[];
}
export const ROADMAP_STATES: Record<RoadmapState, LocalText> = {
  available: text('متاح في نسخة العمل', 'Available in the working version'),
  review: text('يحتاج مراجعة وتحققاً', 'Review and validation needed'),
  planned: text('مخطط — لم يُنفذ بعد', 'Planned — not implemented yet'),
};
// This is an editorial development plan, not a student qualification or deployment tracker.
export const ACADEMY_ROADMAP: AcademyMilestone[] = [
  {
    id: 'foundation', state: 'available', title: text('المكتبة التأسيسية وخريطة العلوم', 'Foundation library & subject map'),
    goal: text('توفير نقطة بداية تجمع الشرح والأمثلة والأسئلة والمراجع والدروس المرتبطة بالتخصصات.', 'Provide a starting point connecting explanations, examples, checks, references and subject-linked lessons.'),
    deliverables: [text('دروس أصلية بالعربية والإنجليزية', 'Original Arabic and English lessons'), text('خريطة تخصصات وموارد ومعجم مختصر', 'Subject and resource map with a concise glossary'), text('سجل قراءة محلي منفصل عن شهادات التأهيل', 'Local reading log separate from professional qualification')],
    acceptance: text('المحتوى الأساسي متاح للتعلم الذاتي؛ لا يعني اكتمال مقررات أو اعتمادها. يجب استمرار مراجعة المحتوى والمصادر.', 'Foundation material is available for self-study, not complete or accredited courses. Content and sources still require ongoing review.'),
    dependsOn: [],
  },
  {
    id: 'validation', state: 'review', title: text('مراجعة النسخة وتجارب الاستخدام', 'Version review & usability checks'),
    goal: text('التحقق من صحة المحتوى والحسابات وحدود المحاكاة وقابلية الاستخدام قبل إعلان إصدار عام.', 'Verify content, calculations, model limitations and usability before announcing a public release.'),
    deliverables: [text('مراجعة علمية حسب التخصص', 'Discipline-specific technical review'), text('فحص متصفح حقيقي للموبايل والكمبيوتر باللغتين', 'Real-browser mobile and desktop checks in both languages'), text('اختبار لوحة المفاتيح والتركيز والجداول والرسوم', 'Keyboard, focus, table and diagram checks')],
    acceptance: text('تسجيل ملاحظات المراجعة ومعالجتها، والتحقق من الإصدار المنشور فعلياً. نجاح اختبارات الكود وحده لا يغلق هذه المرحلة.', 'Record and resolve review findings and verify the actually published version. Code-test success alone does not complete this stage.'),
    dependsOn: ['foundation'],
  },
  {
    id: 'core-courses', state: 'planned', title: text('مقررات VT وPT وMT وUT متدرجة', 'Structured VT, PT, MT & UT courses'),
    goal: text('تحويل الدروس التأسيسية وعناوين المنهج إلى وحدات مترابطة، لا زيادة عدد البطاقات فقط.', 'Turn foundation notes and syllabus headings into connected units, not merely more cards.'),
    deliverables: [text('أهداف ومتطلبات سابقة وترتيب دراسة لكل وحدة', 'Objectives, prerequisites and a study sequence per unit'), text('رسوم وتمارين وحالات متنوعة مرتبطة بالأهداف', 'Diagrams, exercises and varied objective-linked cases'), text('فحص فهم تراكمي وتفسير للأخطاء والمراجع', 'Cumulative checks with error explanations and references')],
    acceptance: text('مراجعة متخصص لكل وحدة وخريطة تغطية للأهداف، مع فصل واضح بين المنهج الدراسي ومتطلبات التأهيل المهني.', 'Specialist review and an objective-coverage map per unit, clearly separating study content from professional qualification requirements.'),
    dependsOn: ['validation'],
  },
  {
    id: 'applied-materials', state: 'planned', title: text('المواد واللحام والتآكل والتطبيقات', 'Materials, welding, corrosion & applications'),
    goal: text('تعميق ربط آليات التلف واختيار الطريقة وتفسير الدلالات بتاريخ التصنيع والخدمة.', 'Deepen the connection between damage mechanisms, method selection, interpretation and manufacturing/service history.'),
    deliverables: [text('مقررات مواد وتصنيع ولحام وPWHT وتآكل', 'Materials, manufacturing, welding, PWHT and corrosion units'), text('حالات مركبات وروابط وتقنيات متقدمة', 'Composite, bond and advanced-technique cases'), text('بيانات وصور أصلية أو مرخصة مع توثيق المصدر', 'Original or licensed datasets and images with provenance')],
    acceptance: text('توثيق تراخيص الوسائط وحدود التفسير؛ لا نسخ شامل لمواقع أخرى أو نقل حدود قبول عامة بين الأكواد.', 'Document media licences and interpretation limits; no wholesale copying or transfer of generic acceptance limits across codes.'),
    dependsOn: ['core-courses'],
  },
  {
    id: 'practical-assessment', state: 'planned', title: text('تقييم عملي بإشراف مختص', 'Supervised practical assessment'),
    goal: text('إضافة مهام عملية موثقة عندما تتوفر عينات ومعدات ومقيمون مؤهلون، لا اعتبار المحاكاة بديلاً للميدان.', 'Add documented practical tasks when specimens, equipment and competent assessors are available, not a simulation substitute for field work.'),
    deliverables: [text('قوائم تقييم ومعايير أداء موثقة', 'Documented performance criteria and assessment checklists'), text('سجل تدريب وخبرة بإشراف وصلاحيات واضحة', 'Supervised training and experience records with clear permissions'), text('سياسة إعادة تقييم واعتراض وحماية بيانات', 'Reassessment, appeal and data-protection policies')],
    acceptance: text('تُنفذ مع جهات ومختصين مناسبين وبسلامة موثقة. لا تصدر شهادة مهنية أو ساعات معتمدة قبل استيفاء النظام والاعتماد المطلوبين.', 'Requires appropriate organisations, specialists and documented safety. No professional credential or accredited hours without the applicable scheme and authorisation.'),
    dependsOn: ['core-courses', 'applied-materials'],
  },
];
