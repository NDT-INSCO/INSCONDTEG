import React from 'react';
import {
  Compass,
  BookOpen,
  Wrench,
  Award,
  Trophy,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AcademyTab } from '../../academyTabs';

/**
 * The academy navigation, grouped by the learner's journey instead of by the
 * history of the codebase.
 *
 * Before this file the hub bar held six boxes whose last box mixed standards,
 * quizzes, the AI tutor and the roadmap, while the first box mixed "learn" with
 * "reference". Every one of the 33 tabs is now a child of exactly one station:
 *
 *   1 choose your path  → path, curriculum, courses, methods
 *   2 learn             → encyclopedia, lessons, EDB, flashcards, standards
 *   3 practice          → the 14 labs and simulators
 *   4 test yourself     → quiz, exam simulation, practical, exam center
 *   5 track progress    → completion map, roadmap, leaderboard, statement
 *   6 ask the mentor    → AI tutor, generated video
 *
 * Deep links are untouched: the station is derived from `activeSubTab`, so
 * `#rt_lab`, `#quiz` and friends still open the right content directly.
 */
export interface AcademyStationChild {
  tab: AcademyTab;
  ar: string;
  en: string;
  /** Kept for existing tests and deep links that target a specific sub-tab. */
  testId?: string;
}

export type AcademyStationId =
  | 'choose'
  | 'learn'
  | 'practice'
  | 'test'
  | 'progress'
  | 'tutor';

export interface AcademyStation {
  id: AcademyStationId;
  ar: string;
  en: string;
  icon: LucideIcon;
  /** Tab opened when the station itself is clicked. */
  defaultTab: AcademyTab;
  children: AcademyStationChild[];
  testId?: string;
}

export interface AcademyStationCounts {
  books: number;
  documents: number;
  courses: number;
  paths: number;
}

export function buildAcademyStations({
  books,
  documents,
  courses,
  paths,
}: AcademyStationCounts): AcademyStation[] {
  return [
    {
      id: 'choose',
      ar: 'اختر مسارك',
      en: 'Choose your path',
      icon: Compass,
      defaultTab: 'paths',
      children: [
        { tab: 'paths', ar: `مسارات التعلم (${paths})`, en: `Learning Paths (${paths})` },
        { tab: 'curriculum', ar: 'المناهج الثمانية والمسارات المهنية', en: 'Eight Disciplines & Career Paths' },
        { tab: 'courses', ar: `مقررات NDE-Ed التفاعلية (${courses} مقررات)`, en: `NDE-Ed Interactive Courses (${courses})` },
        { tab: 'methods', ar: 'دليل الـ 12 تقنية فحص', en: '12 NDT Methods Guide' },
      ],
    },
    {
      id: 'learn',
      ar: 'تعلّم',
      en: 'Learn',
      icon: BookOpen,
      defaultTab: 'encyclopedia',
      children: [
        { tab: 'encyclopedia', ar: `الكتب الدراسية التفاعلية (${books} كتاباً)`, en: `Interactive Textbooks & Labs (${books} Books)` },
        { tab: 'knowledge', ar: 'مكتبة الدروس ومسار القراءة التأسيسي', en: 'Foundational Lessons & Reading Path' },
        { tab: 'edb', ar: `مكتبة EDB وتقليب الصفحات (${documents} مستنداً)`, en: `EDB Flipbook Library (${documents} Documents)` },
        { tab: 'flashcards', ar: 'بطاقات الاستذكار السريع', en: 'Quick Flashcards' },
        { tab: 'standards', ar: 'مكتبة الأكواد (ASME / API / AWS)', en: 'Standards Library' },
      ],
    },
    {
      id: 'practice',
      ar: 'تدرّب · معامل المحاكاة',
      en: 'Practice · Labs',
      icon: Wrench,
      defaultTab: 'sim_labs_rt',
      testId: 'academy-simulation-labs-hub',
      children: [
        { tab: 'sim_labs_rt', ar: 'محاكاة (Panorama · Ellipse · Street) والمتغيرات التقنية', en: 'Panorama · Ellipse · Street Dynamic Simulator' },
        { tab: 'sim_labs_ar', ar: 'الكاميرا وتراكب عناصر NDT الحية (Media API)', en: 'Live Camera NDT Overlay (Media API)', testId: 'academy-subtab-sim-labs-ar' },
        { tab: 'ar_rt_codes', ar: 'الواقع المعزز الشامل لتكنيكات وعيوب وأكواد RT', en: 'Complete AR RT Techniques, Defects & All Codes' },
        { tab: 'ge_exposure_time', ar: 'حاسبة وقت التعريض GE Exposure Time App', en: 'GE Radiographic Exposure Time App' },
        { tab: 'workshops', ar: 'معامل الورش الشاملة وأجهزة (UT · PAUT · RT · 3D)', en: 'Master NDT Workbenches (UT · PAUT · RT · 3D)' },
        { tab: 'rt_lab', ar: 'معمل التصوير الإشعاعي RT (جاما وإكس راي)', en: 'Gamma & X-Ray RT Lab' },
        { tab: 'rt_techniques', ar: 'محاكي البانوراما والإليبس والستريت تكنيك RT', en: 'Panoramic, Elliptical & Straight RT' },
        { tab: 'paut_controller', ar: 'جهاز تحكم PAUT الميداني (Inspector Controller)', en: 'PAUT Inspector Controller' },
        { tab: 'weld_simulator', ar: 'محاكي فحص اللحام وتتبع الأشعة والكود', en: 'Weld UT Ray Tracing & Codes' },
        { tab: 'dac_builder', ar: 'مختبر منحنى المعايرة DAC', en: 'ASME DAC Curve Builder' },
        { tab: 'v1_v2_calibration', ar: 'كالبريشن بلوكات V1 & V2 واستارت تشيك الكود', en: 'V1 & V2 Blocks + Start-Check' },
        { tab: 'defects', ar: 'محاكي عيوب اللحام (Defect Simulator)', en: 'Weld Defect Simulator' },
        { tab: 'pwht_curve', ar: 'محاكي منحنيات PWHT الحرارية', en: 'PWHT Thermal Curve' },
        { tab: 'simulation_history', ar: 'سجل المحاكاة', en: 'Simulation History' },
      ],
    },
    {
      id: 'test',
      ar: 'اختبر نفسك',
      en: 'Test yourself',
      icon: Award,
      defaultTab: 'quiz',
      children: [
        { tab: 'quiz', ar: 'اختبار المعرفة وتأهيل ASNT', en: 'ASNT Quiz' },
        { tab: 'exam_simulation', ar: 'محاكي امتحانات التأهيل (Level 1 & 2)', en: 'Certification Exam Simulation', testId: 'academy-subtab-exam-simulation' },
        { tab: 'practical', ar: 'التقييم العملي الموثّق (تدريبي)', en: 'Practical Assessment (training)' },
        { tab: 'certification_center', ar: 'مركز تسجيل الاختبارات الرسمية والمحاكي التجريبي', en: 'Official Exam Center & Mock Tests', testId: 'academy-subtab-certification-center' },
      ],
    },
    {
      id: 'progress',
      ar: 'تابع إنجازك',
      en: 'Track progress',
      icon: Trophy,
      defaultTab: 'completion_map',
      children: [
        { tab: 'completion_map', ar: 'خريطة الاستكمال', en: 'Completion Map' },
        { tab: 'roadmap', ar: 'خريطة مسار التعلم', en: 'Academy Roadmap' },
        { tab: 'leaderboard', ar: 'لوحة متصدري المعرفة', en: 'Knowledge Leaderboard' },
        { tab: 'certificates', ar: 'إفادة تعلم ذاتي غير معتمدة', en: 'Self-Study Statement (non-accredited)' },
      ],
    },
    {
      id: 'tutor',
      ar: 'اسأل المدرّس',
      en: 'Ask the mentor',
      icon: Sparkles,
      defaultTab: 'ask_ai',
      children: [
        { tab: 'ask_ai', ar: 'اسأل المستشار الأكاديمي', en: 'Ask Professor AI' },
        { tab: 'video_gen', ar: 'توليد فيديو المحاكاة', en: 'Veo Simulation' },
      ],
    },
  ];
}

/** Which station owns a tab (used for the active state and `#hash` deep links). */
export function stationForTab(stations: AcademyStation[], tab: AcademyTab): AcademyStation {
  return stations.find(station => station.children.some(child => child.tab === tab)) ?? stations[0];
}

interface AcademyStationNavProps {
  stations: AcademyStation[];
  activeSubTab: AcademyTab;
  isAr: boolean;
  onSelect: (tab: AcademyTab) => void;
  /**
   * Only this station exists on the current page (the portal gives every
   * station its own page). The six-station grid is replaced by the station's
   * own tab pills, because switching station is the page navigation's job.
   */
  onlySection?: AcademyStationId;
}

export const AcademyStationNav: React.FC<AcademyStationNavProps> = ({
  stations,
  activeSubTab,
  isAr,
  onSelect,
  onlySection,
}) => {
  const activeStation = onlySection
    ? stations.find(station => station.id === onlySection) ?? stationForTab(stations, activeSubTab)
    : stationForTab(stations, activeSubTab);

  if (onlySection) {
    return (
      <nav
        aria-label={isAr ? `أقسام محطة ${activeStation.ar}` : `${activeStation.en} tabs`}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-[#202755] bg-[#0c0e22] p-2.5 shadow-xl">
          {activeStation.children.map(child => {
            const isCurrent = child.tab === activeSubTab;
            return (
              <button
                key={child.tab}
                type="button"
                data-testid={child.testId}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => onSelect(child.tab)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer text-start leading-tight ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'bg-[#10132b] text-slate-300 border border-[#212752] hover:text-white hover:border-amber-400/40'
                }`}
              >
                <span>{isAr ? child.ar : child.en}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={isAr ? 'محطات رحلة المتعلم' : 'Learner journey stations'} className="space-y-3 mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#0c0e22] p-1.5 rounded-2xl border-2 border-[#202755] shadow-xl max-w-6xl mx-auto">
        {stations.map(station => {
          const Icon = station.icon;
          const isActive = station.id === activeStation.id;
          return (
            <button
              key={station.id}
              type="button"
              data-testid={station.testId}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onSelect(station.defaultTab)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center leading-tight ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="truncate">{isAr ? station.ar : station.en}</span>
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label={isAr ? `محتويات محطة ${activeStation.ar}` : `${activeStation.en} station contents`}
        className="flex flex-wrap items-center justify-center gap-2 animate-fadeIn"
      >
        {activeStation.children.map(child => {
          const isCurrent = child.tab === activeSubTab;
          return (
            <button
              key={child.tab}
              type="button"
              data-testid={child.testId}
              aria-current={isCurrent ? 'true' : undefined}
              onClick={() => onSelect(child.tab)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isCurrent
                  ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                  : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>{isAr ? child.ar : child.en}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
