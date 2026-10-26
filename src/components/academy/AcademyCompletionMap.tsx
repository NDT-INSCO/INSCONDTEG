import React from 'react';
import {
  Map,
  CheckCircle2,
  AlertTriangle,
  ListOrdered,
  FileCode2,
  BookOpen,
  Layers,
  Wrench,
  Trophy,
  Award,
  Search,
  BrainCircuit,
  Flame,
  Activity,
  GraduationCap,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES, WORKSHOP_LABS } from '../../data/academyCurriculum';

interface AcademyCompletionMapProps {
  language: Language;
}

export const AcademyCompletionMap: React.FC<AcademyCompletionMapProps> = ({ language }) => {
  const isAr = language === 'ar';

  const disciplineCount = ENGINEERING_DISCIPLINES.length;
  const levelCount = ENGINEERING_DISCIPLINES.reduce((a, d) => a + d.levels.length, 0);
  const moduleCount = ENGINEERING_DISCIPLINES.reduce(
    (a, d) => a + d.levels.reduce((b, l) => b + (l.modules?.length || 0), 0),
    0
  );
  const workshopCount = WORKSHOP_LABS.length;

  const exists: { ar: string; en: string }[] = [
    { ar: '8 مجالات هندسية (NDT تقليدي/متقدم، لحام، PWHT/معادن، API، دهانات/تآكل، جودة، سلامة أصول)', en: '8 engineering disciplines (conventional/advanced NDT, welding, PWHT/metallurgy, API, coating/corrosion, quality, asset integrity)' },
    { ar: '24 مستوى (أكاديمي، Level 1/2/3، مفتش، أول) مع متطلبات وساعات وخبرة ومسؤوليات', en: '24 levels (academic, Level 1/2/3, inspector, senior) with prerequisites, hours, experience, responsibilities' },
    { ar: `${moduleCount}+ وحدة منهج مع نتائج تعلم وموضوعات وصيغ`, en: `${moduleCount}+ curriculum modules with learning outcomes, topics and formulas` },
    { ar: `${workshopCount} معامل تفاعلية (UT A-Scan، PT/MT، RT، مقاييس لحام، API vessel life، ...)` , en: `${workshopCount} interactive labs (UT A-Scan, PT/MT, RT, weld gauges, API vessel life, ...)` },
    { ar: 'محاكي عيوب اللحام + محاكي منحنيات PWHT الحرارية', en: 'Weld defect simulator + PWHT thermal curve simulator' },
    { ar: 'بنك أسئلة ASNT + اختبار المعرفة (CurriculumQuizEngine)', en: 'ASNT question bank + knowledge quiz (CurriculumQuizEngine)' },
    { ar: 'تتبع التقدم محلياً (curriculumProgress) + شهادات/أوسمة (CurriculumCertificatesView)', en: 'Local progress tracking (curriculumProgress) + certificates/badges (CurriculumCertificatesView)' },
    { ar: 'لوحة متصدري المعرفة وساعات الدراسة (KnowledgeLeaderboard) + محطة التركيز والمؤقت', en: 'Knowledge & study hours leaderboard (KnowledgeLeaderboard) + focus station & timer' },
    { ar: 'خريطة مسار التعلم والتأهيل المهني (AcademyRoadmap) + اقتراح المستوى التالي', en: 'Student Learning Path & Career Roadmap (AcademyRoadmap) + Next Certification Engine' },
    { ar: 'مركز تسجيل اختبارات NDT وشروط الأهلية والامتحانات التجريبية (CertificationCenter)', en: 'Official Exam Registration & Pre-Exam Mock Test Center (CertificationCenter)' },
    { ar: 'بحث دلالي (SemanticSearchBar) + بحث في مصطلحات NDT/PWHT', en: 'Semantic search (SemanticSearchBar) + NDT/PWHT term search' },
    { ar: 'مكتبة الأكواد (ASME/API/AWS) + 12 تقنية فحص', en: 'Standards library (ASME/API/AWS) + 12 NDT methods guide' },
    { ar: 'مستشار أكاديمي بالذكاء الاصطناعي + توليد فيديو صناعي (يعتمد على خادم)', en: 'AI academic tutor + industrial video gen (requires server)' },
    { ar: 'بحث معرفي/مراجع (academySemanticGlossary)', en: 'Knowledge glossary (academySemanticGlossary)' },
  ];

  const gaps: { ar: string; en: string }[] = [
    { ar: 'القوائم ليست دروساً: لا يوجد شرح متدرج/تمارين/تصحيح/مواد مرجعية لكل وحدة', en: 'Lists are not lessons: no graded explanations/exercises/corrections/reference material per module' },
    { ar: 'لا توجد مكتبة مراجع (Reference Library) مع روابط/تصنيف/تتبع قراءة (كانت في فرع 77528e83)', en: 'No reference library with links/filter/reading progress (existed in branch 77528e83)' },
    { ar: 'لا توجد دروس تأسيسية (23 درساً) (كانت في فرع 77528e83)', en: 'No foundation lessons (23 lessons) (existed in branch 77528e83)' },
    { ar: 'لا يوجد نظام تحرير/مراجعة علمية أو إدارة مدربين وتقييم عملي', en: 'No content authoring/scientific review or trainer management/practical assessment system' },
    { ar: 'بيانات التقدم محلية (localStorage) وليست سجلاً موثقاً', en: 'Progress is local (localStorage), not an audited record' },
    { ar: 'الشهادات/الساعات قد تُفهم كاعتماد رسمي — تحتاج إعادة تسمية', en: 'Certificates/hours may be read as official accreditation — need relabeling' },
    { ar: 'المحاكاة قد تعطي ثقة زائدة — حدود واضحة مطلوبة', en: 'Simulations may overstate skill — clear limits needed' },
    { ar: 'لا توجد اختبارات متصفح (Playwright) — فحص بصري معلّق', en: 'No browser tests (Playwright) — visual check pending' },
    { ar: 'لا يوجد CMS لإدارة الدروس/المصادر/المراجعات', en: 'No CMS for lessons/sources/reviews' },
    { ar: 'الخدمات الذكية (AI/Video) لا تعمل على GitHub Pages (تحتاج Node/WebSocket)', en: 'AI/Video services do not run on GitHub Pages (need Node/WebSocket)' },
    { ar: 'لا يوجد تدقيق لروابط المصادر/نسخ الأكواد', en: 'No audit of source links/code editions' },
  ];

  const nextSteps: { phase: string; ar: string; en: string }[] = [
    { phase: 'P1', ar: 'دمج مكتبة المراجع + 23 درساً تأسيسياً من فرع 77528e83 (cherry-pick) مع الحفاظ على ميزات 00989e2b', en: 'Merge reference library + 23 foundation lessons from branch 77528e83 (cherry-pick) while keeping 00989e2b features' },
    { phase: 'P1', ar: 'إعادة تسمية "الشهادات" إلى "إفادة تعلم ذاتي غير معتمدة" + تنبيه حدود', en: 'Relabel "Certificates" to "Self-study attestation (non-accredited)" + limits notice' },
    { phase: 'P2', ar: 'تحويل مخطط المنهج إلى مقررات فعلية (VT/PT/MT/UT أولاً): أهداف قابلة للقياس، دروس، تمارين، اختبار نهائي + خريطة تغطية', en: 'Convert curriculum outline to real courses (VT/PT/MT/UT first): measurable objectives, lessons, exercises, final exam + coverage map' },
    { phase: 'P2', ar: 'تعيين مراجع Level III + متخصصي لحام/معادن/تآكل/API لكل مسار', en: 'Assign Level III reviewers + welding/metallurgy/corrosion/API specialists per track' },
    { phase: 'P3', ar: 'تعلم/تقييم عملي موثق: تسجيل مدربين، قوائم تقييم، سجل خبرة بإشراف', en: 'Documented practical learning/assessment: trainer registration, checklists, supervised experience log' },
    { phase: 'P3', ar: 'CMS + مزامنة تقدم آمنة + نسخ احتياطي/تصدير + مراقبة روابط', en: 'CMS + secure progress sync + backup/export + link monitoring' },
    { phase: 'P4', ar: 'ترجمات كاملة + وسائط مع نصوص بديلة + اختبارات متصفح (Playwright)', en: 'Full translations + accessible media + browser tests (Playwright)' },
    { phase: 'P4', ar: 'استضافة Node/WebSocket للخدمات الذكية + حماية مفاتيح + حدود استخدام', en: 'Node/WebSocket hosting for smart services + key protection + rate limits' },
  ];

  const keyFiles: { file: string; ar: string; en: string }[] = [
    { file: 'src/components/EducationalAcademy.tsx', ar: 'الحاوية الرئيسية للأكاديمية + التبويبات', en: 'Main academy container + tabs' },
    { file: 'src/data/academyCurriculum.ts', ar: '8 مجالات، 6 معامل', en: '8 disciplines, 6 labs' },
    { file: 'src/data/curriculum/types.ts', ar: 'أنواع المنهج (CurriculumModule, DisciplineLevel, ...)', en: 'Curriculum types' },
    { file: 'src/data/curriculum/disciplines/*.ts', ar: 'بيانات 8 مجالات', en: '8 discipline data files' },
    { file: 'src/components/academy/DisciplineCurriculumView.tsx', ar: 'عرض المنهج', en: 'Curriculum view' },
    { file: 'src/components/academy/CurriculumQuizEngine.tsx', ar: 'محرك الاختبار', en: 'Quiz engine' },
    { file: 'src/components/academy/CertificationCenter.tsx', ar: 'مركز تسجيل اختبارات NDT وشروط الأهلية والامتحانات التجريبية', en: 'Certification Center & Mock Tests' },
    { file: 'src/components/academy/CurriculumCertificatesView.tsx', ar: 'الشهادات/الأوسمة', en: 'Certificates/badges' },
    { file: 'src/components/academy/AcademyRoadmap.tsx', ar: 'خريطة مسار التعلم واقتراح شهادات NDT', en: 'Academy Roadmap & Next Certification' },
    { file: 'src/components/academy/KnowledgeLeaderboard.tsx', ar: 'لوحة متصدري المعرفة وساعات الدراسة', en: 'Knowledge & Study Leaderboard' },
    { file: 'src/components/academy/FocusStudyStation.tsx', ar: 'محطة تركيز', en: 'Focus station' },
    { file: 'src/utils/curriculumProgress.ts', ar: 'تتبع التقدم', en: 'Progress tracking' },
    { file: 'src/utils/quizLeaderboardService.ts', ar: 'خدمة لوحة المتصدرين', en: 'Leaderboard service' },
    { file: 'docs/HANDOVER_AR.md', ar: 'دليل التسليم', en: 'Handover guide' },
    { file: 'docs/ACADEMY_REVIEW_AR.md', ar: 'مراجعة الأكاديمية (من فرع 77528e83)', en: 'Academy review (from branch 77528e83)' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 font-bold text-xs uppercase tracking-wider mb-3">
          <Map className="w-4 h-4" />
          <span>{isAr ? 'خريطة استكمال الأكاديمية' : 'Academy Completion Map'}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white">
          {isAr ? 'ما الموجود، ما الناقص، وما ترتيب الشغل الجاي' : 'What exists, what is missing, and the next work order'}
        </h3>
        <p className="text-slate-300 text-sm mt-2">
          {isAr
            ? 'هذه الخريطة تُحدّث مع كل إصدار. استخدمها لتجنب تكرار الشغل ولبدء العمل من آخر نسخة.'
            : 'This map is updated with each release. Use it to avoid rework and to start from the latest version.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {[
          { icon: <BookOpen className="w-5 h-5 text-amber-400" />, label: isAr ? 'مجالات' : 'Disciplines', value: disciplineCount },
          { icon: <Layers className="w-5 h-5 text-sky-400" />, label: isAr ? 'مستويات' : 'Levels', value: levelCount },
          { icon: <GraduationCap className="w-5 h-5 text-emerald-400" />, label: isAr ? 'وحدات' : 'Modules', value: moduleCount },
          { icon: <Wrench className="w-5 h-5 text-pink-400" />, label: isAr ? 'معامل' : 'Labs', value: workshopCount },
        ].map((s, i) => (
          <div key={i} className="bg-[#0c0e22] border border-[#202755] rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* What exists */}
      <section className="bg-[#0c0e22] border border-[#202755] rounded-2xl p-5 max-w-5xl mx-auto">
        <h4 className="flex items-center gap-2 text-amber-400 font-bold text-lg mb-3">
          <CheckCircle2 className="w-5 h-5" />
          {isAr ? 'الموجود فعلاً (What exists)' : 'What exists'}
        </h4>
        <ul className="space-y-2">
          {exists.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{isAr ? e.ar : e.en}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Gaps */}
      <section className="bg-[#0c0e22] border border-[#202755] rounded-2xl p-5 max-w-5xl mx-auto">
        <h4 className="flex items-center gap-2 text-rose-400 font-bold text-lg mb-3">
          <AlertTriangle className="w-5 h-5" />
          {isAr ? 'الناقص / الفجوات (Gaps)' : 'Gaps / Missing'}
        </h4>
        <ul className="space-y-2">
          {gaps.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span>{isAr ? g.ar : g.en}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Next work order */}
      <section className="bg-[#0c0e22] border border-[#202755] rounded-2xl p-5 max-w-5xl mx-auto">
        <h4 className="flex items-center gap-2 text-sky-400 font-bold text-lg mb-3">
          <ListOrdered className="w-5 h-5" />
          {isAr ? 'ترتيب الشغل الجاي (Next work order)' : 'Next work order'}
        </h4>
        <ol className="space-y-3">
          {nextSteps.map((n, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
              <span className="shrink-0 w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold flex items-center justify-center text-xs">
                {n.phase}
              </span>
              <span className="mt-1.5">{isAr ? n.ar : n.en}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Key files */}
      <section className="bg-[#0c0e22] border border-[#202755] rounded-2xl p-5 max-w-5xl mx-auto">
        <h4 className="flex items-center gap-2 text-violet-400 font-bold text-lg mb-3">
          <FileCode2 className="w-5 h-5" />
          {isAr ? 'ملفات ومصادر رئيسية (Key files)' : 'Key files & sources'}
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {keyFiles.map((k, i) => (
            <div key={i} className="bg-[#10132b] border border-[#1e2554] rounded-lg p-2.5">
              <div className="font-mono text-xs text-amber-300 break-all">{k.file}</div>
              <div className="text-xs text-slate-400 mt-1">{isAr ? k.ar : k.en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Handover note */}
      <div className="max-w-5xl mx-auto bg-amber-500/5 border border-amber-400/20 rounded-xl p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
          <BookOpen className="w-4 h-4" />
          {isAr ? 'دليل التسليم' : 'Handover guide'}
        </div>
        {isAr
          ? 'راجع docs/HANDOVER_AR.md و docs/ACADEMY_REVIEW_AR.md و docs/TRANSFER_PACKAGE.md للتفاصيل (التشغيل، البنية، الفجوات، خطة الاستكمال، حزمة النقل).'
          : 'See docs/HANDOVER_AR.md, docs/ACADEMY_REVIEW_AR.md and docs/TRANSFER_PACKAGE.md for details (run, architecture, gaps, completion plan, transfer package).'}
      </div>
    </div>
  );
};

export default AcademyCompletionMap;
