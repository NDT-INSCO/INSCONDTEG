import React from 'react';
import { Language } from '../../types';
import { 
  GraduationCap, 
  Layers, 
  Award, 
  Map, 
  Trophy, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

interface CompanyAcademyHighlightProps {
  language: Language;
  onNavigateToAcademy: (initialSubTab?: any) => void;
}

export const CompanyAcademyHighlight: React.FC<CompanyAcademyHighlightProps> = ({
  language,
  onNavigateToAcademy,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const academyFeatures = [
    {
      id: 'workshops',
      title: { ar: 'معامل المحاكاة الافتراضية ثلاثية الأبعاد', en: '3D Virtual Simulation Labs' },
      description: {
        ar: 'محاكاة كاملة لأجهزة UT Krautkramer، أشعة جاما الإشعاعية، فحص الجسيمات المغناطيسية MT، ومنحنيات المعالجة الحرارية PWHT.',
        en: 'Realistic simulators for UT Krautkramer, gamma radiography collimators, MT magnetic yokes, and PWHT thermal cycles.'
      },
      icon: Layers,
      subTab: 'workshops'
    },
    {
      id: 'curriculum',
      title: { ar: 'المناهج الهندسية المعتمدة (ASNT / ISO)', en: 'Standardized NDT Curricula' },
      description: {
        ar: 'مقررات تفصيلية مطابقة لأكواد ASNT SNT-TC-1A وEN ISO 9712 من المستوى التمهيدي وحتى Level III.',
        en: 'Exhaustive course syllabi aligned with ASNT SNT-TC-1A and EN ISO 9712 from Academic Foundation to Level III.'
      },
      icon: GraduationCap,
      subTab: 'curriculum'
    },
    {
      id: 'certification_center',
      title: { ar: 'مركز الامتحانات والتأهيل المهني', en: 'Certification & Exam Center' },
      description: {
        ar: 'التسجيل لاختبارات الاعتماد الرسمية، فحص الأهلية والمتطلبات المسبقة، وخوض اختبارات تجريبية تحضيرية Mock Tests.',
        en: 'Formal NDT exam registration, prerequisite eligibility auditor, and timed pre-exam mock practice simulators.'
      },
      icon: Award,
      subTab: 'certification_center'
    },
    {
      id: 'roadmap',
      title: { ar: 'خارطة الطريق التعليمية للمهندس', en: 'Engineer Learning Roadmap' },
      description: {
        ar: 'مخطط مسار تفاعلي يربط المعامل والوحدات المنجزة، ويوصي بالمستوى القادم للشهادة المطلوب تحقيقها.',
        en: 'Interactive career path visualizing completed library modules and dynamically recommending the next certification.'
      },
      icon: Map,
      subTab: 'roadmap'
    },
    {
      id: 'leaderboard',
      title: { ar: 'لوحة المعرفة وساعات التدريب (XP)', en: 'Knowledge Leaderboard & XP' },
      description: {
        ar: 'تسجيل ساعات التدريب العملي والنظري، حساب نقاط الخبرة (XP)، والتنافس الأكاديمي الإيجابي بين مهندسي الجودة.',
        en: 'Log formal study hours, accrue verified engineering XP, and track peer standing on the global academy podium.'
      },
      icon: Trophy,
      subTab: 'leaderboard'
    },
  ];

  return (
    <section id="academy-preview" className="py-16 border-b border-slate-800 bg-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Banner Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-linear-to-br from-slate-900 via-slate-950 to-cyan-950/30 p-8 sm:p-10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <GraduationCap className="w-4 h-4" />
                <span>{isAr ? 'الذراع الأكاديمي والتدريبي لشركة إنسكو' : 'INSCO Academic & Training Wing'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {isAr
                  ? 'أكاديمية إنسكو الهندسية: بناء وتأهيل كوادر الفحص الاحترافية'
                  : 'INSCO Engineering Academy: Cultivating Certified NDT Pioneers'}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {isAr
                  ? 'إيماناً بأن جودة الاختبار تبدأ من كفاءة المهندس، طورت إنسكو بيئة تدريبية رقمية متقدمة تضم معامل محاكاة ثلاثية الأبعاد، بنوك أسئلة معتمدة، ومسارات تأهيل لشهادات ASNT وCSWIP وAWS.'
                  : 'Because testing integrity begins with engineer competence, INSCO developed a cutting-edge digital learning ecosystem featuring 3D virtual simulation labs, verified quiz engines, and ASNT/ISO qualification pathways.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigateToAcademy()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                >
                  <GraduationCap className="w-5 h-5 shrink-0" />
                  <span>{isAr ? 'دخول الأكاديمية التفاعلية الشاملة' : 'Launch Full Academy Platform'}</span>
                  <ArrowIcon className="w-4 h-4 shrink-0" />
                </button>

                <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{isAr ? 'مفتوحة للطلاب ومهندسي الجودة مجاناً' : 'Free access for students & QC engineers'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats side block */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="text-xs font-mono uppercase text-slate-400">
                {isAr ? 'إحصائيات البيئة التعليمية' : 'Platform Scope'}
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-xl font-black text-cyan-400 font-mono">6+</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'معامل محاكاة 3D' : '3D Virtual Labs'}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-xl font-black text-cyan-400 font-mono">120+</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'أسئلة معتمدة' : 'Verified Questions'}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-xl font-black text-cyan-400 font-mono">4</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'مستويات تأهيل' : 'Qualification Levels'}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-xl font-black text-cyan-400 font-mono">100%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'تطابق مع الأكواد' : 'Code Compliant'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid with Deep-link Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {academyFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {item.title[language]}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description[language]}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onNavigateToAcademy(item.subTab)}
                    className="w-full inline-flex items-center justify-between text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-1 cursor-pointer"
                  >
                    <span>{isAr ? 'استكشاف هذا القسم بالأكاديمية' : 'Open in Academy'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
