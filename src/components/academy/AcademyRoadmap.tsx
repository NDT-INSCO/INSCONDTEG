import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Award,
  GraduationCap,
  Target,
  BookOpen,
  HelpCircle,
  Activity,
  Layers,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  Filter,
  Search,
  ExternalLink,
  Flame,
  Check,
  Play,
  RotateCcw,
  Sliders,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { KNOWLEDGE_LESSONS } from '../../data/academyKnowledge';
import {
  getCompletedModules,
  getCompletedTopics,
  getQuizResults,
  markModuleCompleted
} from '../../utils/curriculumProgress';

const KNOWLEDGE_STORAGE_KEY = 'insco_knowledge_read_v1';

export type CertificationTrack = 'all' | 'conventional_ndt' | 'advanced_ndt' | 'welding_inspection' | 'api_inspection';
export type MilestoneTier = 'tier0_foundation' | 'tier1_level1' | 'tier2_level2' | 'tier3_level3_api';

export interface RoadmapMilestone {
  id: string;
  sourceType: 'library_lesson' | 'curriculum_module';
  disciplineId: string;
  tier: MilestoneTier;
  tierNumber: number;
  title: { ar: string; en: string };
  summary: { ar: string; en: string };
  codeOrStandard?: string;
  techniques: string[];
  estimatedHours: number;
  prerequisites: { ar: string; en: string };
  order: number;
  targetRole: { ar: string; en: string };
  associatedLabId?: string;
  curriculumLevelIdx?: number;
}

export interface CertificationLevelRecommendation {
  id: string;
  badgeLevel: 'level1' | 'level2' | 'level3' | 'api';
  title: { ar: string; en: string };
  accreditationBody: string;
  scope: { ar: string; en: string };
  whyRecommended: { ar: string; en: string };
  requiredTrainingHours: number;
  requiredExperienceMonths: number;
  prerequisitesMetCount: number;
  totalPrerequisitesCount: number;
  progressPercent: number;
  eligibleNow: boolean;
  targetCareerRoles: { ar: string; en: string };
  targetIndustries: { ar: string; en: string };
  recommendedNextModules: string[];
  applicableCodes: string[];
}

interface AcademyRoadmapProps {
  language: Language;
  onNavigateToModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  onOpenLibraryLesson?: (lessonId: string) => void;
  onLaunchQuiz?: (disciplineId?: string, levelId?: string, moduleId?: string) => void;
  onNavigateToCertificates?: () => void;
  onOpenVirtualLab?: (labId?: string) => void;
}

export const AcademyRoadmap: React.FC<AcademyRoadmapProps> = ({
  language,
  onNavigateToModule,
  onOpenLibraryLesson,
  onLaunchQuiz,
  onNavigateToCertificates,
  onOpenVirtualLab,
}) => {
  const isAr = language === 'ar';

  // State for tracked items
  const [readLessonIds, setReadLessonIds] = useState<string[]>([]);
  const [completedModulesMap, setCompletedModulesMap] = useState<Record<string, boolean>>({});
  const [quizResultsMap, setQuizResultsMap] = useState<Record<string, any>>({});
  
  // Filter state
  const [selectedTrack, setSelectedTrack] = useState<CertificationTrack>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'next_up'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  // Sync progress from localStorage
  const refreshProgress = () => {
    try {
      const storedLessons = JSON.parse(localStorage.getItem(KNOWLEDGE_STORAGE_KEY) || '[]');
      setReadLessonIds(Array.isArray(storedLessons) ? storedLessons : []);
    } catch {
      setReadLessonIds([]);
    }
    setCompletedModulesMap(getCompletedModules());
    setQuizResultsMap(getQuizResults());
  };

  useEffect(() => {
    refreshProgress();
    const handleProgressUpdate = () => refreshProgress();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === KNOWLEDGE_STORAGE_KEY || e.key === null) {
        refreshProgress();
      }
    };
    window.addEventListener('insco_progress_updated', handleProgressUpdate);
    window.addEventListener('insco_topic_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('insco_progress_updated', handleProgressUpdate);
      window.removeEventListener('insco_topic_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Build the complete milestone sequence from Library Lessons & Curriculum Modules
  const allMilestones: RoadmapMilestone[] = useMemo(() => {
    const list: RoadmapMilestone[] = [];
    let orderIndex = 1;

    // 1. TIER 0: Foundational Science Milestones from Library
    KNOWLEDGE_LESSONS.forEach((lesson) => {
      let tier: MilestoneTier = 'tier0_foundation';
      let tierNumber = 0;
      if (lesson.id === 'qualification' || lesson.id === 'quality') {
        tier = 'tier0_foundation';
      } else if (lesson.id === 'remaining-life' || lesson.id === 'rbi') {
        tier = 'tier3_level3_api';
        tierNumber = 3;
      }

      list.push({
        id: `lib_${lesson.id}`,
        sourceType: 'library_lesson',
        disciplineId: lesson.discipline,
        tier,
        tierNumber,
        title: { ar: lesson.title.ar, en: lesson.title.en },
        summary: { ar: lesson.summary.ar, en: lesson.summary.en },
        codeOrStandard: lesson.sources.join(' / ').toUpperCase(),
        techniques: [lesson.discipline.replace('_', ' ').toUpperCase()],
        estimatedHours: Math.max(2, Math.round(lesson.minutes / 10)),
        prerequisites: { ar: lesson.prerequisites.ar, en: lesson.prerequisites.en },
        order: orderIndex++,
        targetRole: {
          ar: 'تأسيس علمي وفيزيائي نظري متين قبل التشغيل الميداني',
          en: 'Core scientific & theoretical physics foundation prior to field testing'
        },
        associatedLabId: lesson.discipline === 'conventional_ndt' ? 'ut_lab' : undefined
      });
    });

    // 2. TIERS 1, 2, 3: Curriculum Modules from Disciplines
    ENGINEERING_DISCIPLINES.forEach((disc) => {
      disc.levels.forEach((lvl, lvlIdx) => {
        let tier: MilestoneTier = 'tier1_level1';
        let tierNumber = 1;
        if (lvl.levelId === 'academic') {
          tier = 'tier0_foundation';
          tierNumber = 0;
        } else if (lvl.levelId === 'level1') {
          tier = 'tier1_level1';
          tierNumber = 1;
        } else if (lvl.levelId === 'level2') {
          tier = 'tier2_level2';
          tierNumber = 2;
        } else if (lvl.levelId === 'level3') {
          tier = 'tier3_level3_api';
          tierNumber = 3;
        }

        lvl.modules.forEach((mod) => {
          list.push({
            id: `cur_${mod.id}`,
            sourceType: 'curriculum_module',
            disciplineId: disc.id,
            tier,
            tierNumber,
            title: { ar: mod.titleAr, en: mod.titleEn },
            summary: {
              ar: mod.learningOutcomesAr?.[0] || mod.topicsAr[0] || disc.overviewAr,
              en: mod.learningOutcomesEn?.[0] || mod.topicsEn?.[0] || disc.overviewEn
            },
            codeOrStandard: lvl.applicableCodes[0] || disc.globalAccreditations[0] || 'ASME / ISO',
            techniques: disc.keyTechniques.slice(0, 3),
            estimatedHours: parseInt(mod.duration, 10) || 30,
            prerequisites: { ar: lvl.prerequisitesAr, en: lvl.prerequisitesEn },
            order: orderIndex++,
            targetRole: { ar: lvl.targetRoleAr, en: lvl.targetRoleEn },
            curriculumLevelIdx: lvlIdx,
            associatedLabId: disc.id === 'conventional_ndt' ? 'ut_lab' : disc.id === 'pwht_metallurgy' ? 'pwht_thermo_profile' : undefined
          });
        });
      });
    });

    return list;
  }, []);

  // Helper to check completion status
  const isMilestoneCompleted = (m: RoadmapMilestone): boolean => {
    if (m.sourceType === 'library_lesson') {
      const rawId = m.id.replace('lib_', '');
      return readLessonIds.includes(rawId);
    }
    const rawId = m.id.replace('cur_', '');
    return Boolean(completedModulesMap[rawId]);
  };

  // Helper to toggle completion directly
  const handleToggleMilestone = (m: RoadmapMilestone, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (m.sourceType === 'library_lesson') {
      const rawId = m.id.replace('lib_', '');
      let next: string[];
      if (readLessonIds.includes(rawId)) {
        next = readLessonIds.filter(id => id !== rawId);
      } else {
        next = [...readLessonIds, rawId];
      }
      setReadLessonIds(next);
      try {
        localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      window.dispatchEvent(new CustomEvent('insco_progress_updated', { detail: { lessonId: rawId } }));
    } else {
      const rawId = m.id.replace('cur_', '');
      const current = Boolean(completedModulesMap[rawId]);
      if (current) {
        // Unmark
        const updated = { ...completedModulesMap };
        delete updated[rawId];
        setCompletedModulesMap(updated);
        localStorage.setItem('insco_academy_completed_modules', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('insco_progress_updated', { detail: { moduleId: rawId } }));
      } else {
        markModuleCompleted(rawId, 100);
        refreshProgress();
      }
    }
  };

  // Quick helper to simulate progress for demo / testing
  const handleSimulateStage = (tierTarget: MilestoneTier) => {
    if (tierTarget === 'tier0_foundation') {
      // Mark all foundation lessons read
      const foundationIds = KNOWLEDGE_LESSONS.map(l => l.id);
      setReadLessonIds(foundationIds);
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(foundationIds));
      window.dispatchEvent(new CustomEvent('insco_progress_updated'));
    } else if (tierTarget === 'tier1_level1') {
      // Mark level 1 conventional modules completed
      const conv = ENGINEERING_DISCIPLINES.find(d => d.id === 'conventional_ndt');
      const lvl1 = conv?.levels.find(l => l.levelId === 'level1');
      lvl1?.modules.forEach(m => markModuleCompleted(m.id, 95));
      refreshProgress();
    } else if (tierTarget === 'tier2_level2') {
      // Mark level 2 conventional & welding modules completed
      const conv = ENGINEERING_DISCIPLINES.find(d => d.id === 'conventional_ndt');
      const lvl2 = conv?.levels.find(l => l.levelId === 'level2');
      lvl2?.modules.forEach(m => markModuleCompleted(m.id, 92));
      const weld = ENGINEERING_DISCIPLINES.find(d => d.id === 'welding_inspection');
      weld?.levels.find(l => l.levelId === 'level2')?.modules.forEach(m => markModuleCompleted(m.id, 90));
      refreshProgress();
    }
  };

  const handleResetProgress = () => {
    localStorage.removeItem(KNOWLEDGE_STORAGE_KEY);
    localStorage.removeItem('insco_academy_completed_modules');
    setReadLessonIds([]);
    setCompletedModulesMap({});
    window.dispatchEvent(new CustomEvent('insco_progress_updated'));
  };

  // Compute Overall Counts
  const totalMilestonesCount = allMilestones.length;
  const completedMilestonesCount = allMilestones.filter(isMilestoneCompleted).length;
  const overallRoadmapPercent = totalMilestonesCount > 0 ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100) : 0;

  // Filtered Milestones
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      // Track filter
      if (selectedTrack === 'conventional_ndt' && m.disciplineId !== 'conventional_ndt') return false;
      if (selectedTrack === 'advanced_ndt' && m.disciplineId !== 'ndt_advanced') return false;
      if (selectedTrack === 'welding_inspection' && m.disciplineId !== 'welding_inspection' && m.disciplineId !== 'pwht_metallurgy') return false;
      if (selectedTrack === 'api_inspection' && m.disciplineId !== 'api_inspection' && m.disciplineId !== 'asset_integrity_rope') return false;

      // Status filter
      const completed = isMilestoneCompleted(m);
      if (statusFilter === 'completed' && !completed) return false;
      if (statusFilter === 'in_progress' && completed) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = m.title.ar.toLowerCase().includes(q) || m.title.en.toLowerCase().includes(q);
        const inCode = m.codeOrStandard?.toLowerCase().includes(q);
        const inSummary = m.summary.ar.toLowerCase().includes(q) || m.summary.en.toLowerCase().includes(q);
        if (!inTitle && !inCode && !inSummary) return false;
      }

      return true;
    });
  }, [allMilestones, selectedTrack, statusFilter, searchQuery, readLessonIds, completedModulesMap]);

  // Selected Milestone Data
  const selectedMilestone = useMemo(() => {
    if (!selectedMilestoneId) return null;
    return allMilestones.find(m => m.id === selectedMilestoneId) || null;
  }, [allMilestones, selectedMilestoneId]);

  // --------------------------------------------------------------------------
  // Dynamic Next NDT Certification Level Recommender
  // --------------------------------------------------------------------------
  const nextCertificationRecommendation: CertificationLevelRecommendation = useMemo(() => {
    const foundationDone = readLessonIds.length;
    const totalFoundation = KNOWLEDGE_LESSONS.length;

    // Count Level 1 modules done
    let level1DoneCount = 0;
    let level1TotalCount = 0;
    let level2DoneCount = 0;
    let level2TotalCount = 0;
    let level3DoneCount = 0;

    allMilestones.forEach(m => {
      if (m.tier === 'tier1_level1') {
        level1TotalCount++;
        if (isMilestoneCompleted(m)) level1DoneCount++;
      } else if (m.tier === 'tier2_level2') {
        level2TotalCount++;
        if (isMilestoneCompleted(m)) level2DoneCount++;
      } else if (m.tier === 'tier3_level3_api') {
        if (isMilestoneCompleted(m)) level3DoneCount++;
      }
    });

    // Step 1: Incomplete Foundations
    if (foundationDone < 4) {
      const progress = Math.min(100, Math.round((foundationDone / 4) * 100));
      return {
        id: 'cert_rec_foundation',
        badgeLevel: 'level1',
        title: {
          ar: 'تأهيل الأساس العلمي والفيزيائي لـ NDT والسلامة الإشعاعية (Pre-Level I Foundation)',
          en: 'NDT Applied Physics & Radiation Safety Foundation (Pre-Level I Trainee)'
        },
        accreditationBody: 'ASNT SNT-TC-1A / ISO 9712 Trainee Scheme',
        scope: {
          ar: 'استيعاب فيزياء الموجات الصوتية وانكسار سنيل، والتسرب المغناطيسي، وكيمياء النفاذية الشعرية، والسلامة في التصوير الإشعاعي RT.',
          en: 'Master acoustic wave physics, Snell’s refraction, magnetic flux leakage, capillary rise kinetics, and radiation safety limits.'
        },
        whyRecommended: {
          ar: 'يوصى بالبدء بالدروس التأسيسية لفهم المبادئ العلمية وقواعد عدم اليقين قبل الانتقال إلى معايرة الأجهزة الميدانية.',
          en: 'Recommended starting point: grasp underlying scientific principles and measurement uncertainty before hands-on instrument calibration.'
        },
        requiredTrainingHours: 40,
        requiredExperienceMonths: 0,
        prerequisitesMetCount: foundationDone,
        totalPrerequisitesCount: 4,
        progressPercent: progress,
        eligibleNow: foundationDone >= 4,
        targetCareerRoles: {
          ar: 'متدرب فحص جودة / فني مبتدئ في مختبرات الفحص غير الإتلافي',
          en: 'NDT Trainee / Junior Quality Testing Laboratory Assistant'
        },
        targetIndustries: {
          ar: 'مختبرات الفحص الهندسي، مصانع الهياكل المعدنية، ومراكز التدريب المهني',
          en: 'Engineering testing labs, steel fabrication shops, industrial vocational training'
        },
        recommendedNextModules: ['measurement', 'waves', 'safety', 'vt_geometry'],
        applicableCodes: ['ASTM E1316', 'ISO 9712 Principles', 'IAEA TECDOC-628']
      };
    }

    // Step 2: Foundation complete, pursuing Level 1 Conventional Operator
    if (level1DoneCount < 3) {
      const progress = Math.min(100, Math.round((level1DoneCount / 3) * 100));
      return {
        id: 'cert_rec_level1',
        badgeLevel: 'level1',
        title: {
          ar: 'شهادة مشغل NDT معتمد المستوى الأول (ISO 9712 / ASNT SNT-TC-1A Level I Operator)',
          en: 'Certified NDT Operator Level I (ISO 9712 / ASNT SNT-TC-1A Conventional UT/PT/MT/VT)'
        },
        accreditationBody: 'ISO 9712 / ASNT SNT-TC-1A / EN 473',
        scope: {
          ar: 'ضبط ومعايرة أجهزة الموجات فوق الصوتية (UT A-Scan) وتطبيق السائل النافذ (PT) والجسيمات المغناطيسية (MT) وفق إجراءات مكتوبة.',
          en: 'Set up and calibrate ultrasonic flaw detectors, conduct PT and MT testing under specific written Level II/III instructions.'
        },
        whyRecommended: {
          ar: 'لقد استوفيت الأساس العلمي النظري! الخطوة التالية الأنسب هي الحصول على أول ترخيص فحص مهني لتشغيل الأجهزة عملياً.',
          en: 'You have mastered the foundational science! The optimal next milestone is your first industrial testing operator qualification.'
        },
        requiredTrainingHours: 80,
        requiredExperienceMonths: 3,
        prerequisitesMetCount: level1DoneCount,
        totalPrerequisitesCount: 3,
        progressPercent: progress,
        eligibleNow: level1DoneCount >= 3,
        targetCareerRoles: {
          ar: 'فني مشغل فحص بالموجات والسطح (NDT Level I Technician / Field Operator)',
          en: 'NDT Field Operator / Ultrasonic & Surface Testing Technician'
        },
        targetIndustries: {
          ar: 'صناعة النفط والغاز، خطوط الأنابيب، صيانة محطات الطاقة، وتصنيع المراجل',
          en: 'Oil & Gas installations, cross-country pipelines, boiler & pressure vessel fabricators'
        },
        recommendedNextModules: ['mod_c_acad_1', 'mod_c_lvl1_1', 'mod_c_lvl1_2'],
        applicableCodes: ['ASME Section V Art. 4 & 5', 'ASTM E165', 'ASTM E709', 'ISO 9712']
      };
    }

    // Step 3: Level 1 completed, pursuing Level 2 Senior Inspector / Sizing & Acceptance Authority
    if (level2DoneCount < 3) {
      const progress = Math.min(100, Math.round((level2DoneCount / 3) * 100));
      return {
        id: 'cert_rec_level2',
        badgeLevel: 'level2',
        title: {
          ar: 'مفتش NDT أول معتمد المستوى الثاني (ISO 9712 Level II Senior Inspector / Flaw Sizing & Acceptance)',
          en: 'Certified Senior NDT Inspector Level II (ASME Sec VIII/B31.3 & API 1104 Sizing & Evaluation)'
        },
        accreditationBody: 'ISO 9712 / ASNT CP-189 / CSWIP 3.1 NDT',
        scope: {
          ar: 'سلطة تقييم وتوصيف العيوب الداخلية، رسم منحنيات DAC/TCG، وإصدار قرارات القبول والرفض المعتمدة وكتابة تقارير الفحص.',
          en: 'Direct authority to size defects, establish DAC/TCG distance-amplitude curves, interpret radiographic films, and decide weld acceptance.'
        },
        whyRecommended: {
          ar: 'بما أنك أتقنت تشغيل التقنيات، فإن ترقية المستوى الثاني تمنحك السلطة الهندسية لاعتماد التقارير وتحقيق قفزة نوعية في سوق العمل.',
          en: 'With Level I techniques mastered, Level II certification provides full legal authority to evaluate indications and sign official test reports.'
        },
        requiredTrainingHours: 120,
        requiredExperienceMonths: 9,
        prerequisitesMetCount: level2DoneCount,
        totalPrerequisitesCount: 3,
        progressPercent: progress,
        eligibleNow: level2DoneCount >= 3,
        targetCareerRoles: {
          ar: 'مفتش NDT معتمد للمواقع والمحطات / مهندس جودة تقييم لحامات',
          en: 'Certified Level II NDT Inspector / QA Sizing Specialist / Shutdown Turnaround Inspector'
        },
        targetIndustries: {
          ar: 'مصافي البترول، منصات الحفر البحرية، محطات الطاقة النووية والحرارية، وصوامع الغاز المسال',
          en: 'Refineries, offshore drilling rigs, petrochemical plants, nuclear & cryogenic storage'
        },
        recommendedNextModules: ['mod_c_lvl2_1', 'mod_c_lvl2_2', 'mod_weld_1'],
        applicableCodes: ['ASME Section V Art. 4', 'ASME B31.3 Table 341.3.2', 'API 1104 App. III']
      };
    }

    // Step 4: Level 2 completed, pursuing Advanced NDT (PAUT/TOFD) or API 510/570
    if (level3DoneCount < 2) {
      const progress = Math.min(100, Math.round((level3DoneCount / 2) * 100));
      return {
        id: 'cert_rec_advanced_api',
        badgeLevel: 'api',
        title: {
          ar: 'أخصائي الفحص الرقمي المتقدم ومفتش المنشآت الحيوية (Advanced PAUT/TOFD & API 570/510)',
          en: 'Advanced NDT PAUT/TOFD Specialist & API 570/510 Pressure Piping/Vessel Inspector'
        },
        accreditationBody: 'ISO 13588 (PAUT) / ASME Code Case 2235 / API ICP',
        scope: {
          ar: 'التصوير الحجمي ثلاثي الأبعاد بالمصفوفات الطورية وحيود زمن الطيران، وتقييم العمر المتبقي للأوعية والأنابيب وحسابات التآكل.',
          en: '3D sectorial/linear volumetric imaging, tip diffraction crack height sizing, corrosion rate monitoring & remaining service life calculations.'
        },
        whyRecommended: {
          ar: 'لقد أثبت كفاءتك في الفحوصات التقليدية. مسار المصفوفات الطورية (PAUT) وترخيص API يمثلان قمة الطلب المالي والهندسي عالمياً.',
          en: 'You possess solid Level II credentials. Transitioning to Phased Array UT and API in-service inspection unlocks senior engineering roles.'
        },
        requiredTrainingHours: 160,
        requiredExperienceMonths: 24,
        prerequisitesMetCount: level3DoneCount,
        totalPrerequisitesCount: 2,
        progressPercent: progress,
        eligibleNow: level3DoneCount >= 2,
        targetCareerRoles: {
          ar: 'أخصائي PAUT/TOFD متقدم / مفتش أوعية وأنابيب معتمد API Inspector',
          en: 'Lead Advanced PAUT Data Analyst / API 570 Certified Plant Piping Inspector'
        },
        targetIndustries: {
          ar: 'مشاريع الغاز المسال LNG، خطوط الضغط العالي، أوعية المفاعلات، وتوربينات الطاقة',
          en: 'LNG cryogenic infrastructure, offshore risers, high-pressure subsea pipelines, turbine rotors'
        },
        recommendedNextModules: ['mod_adv_1', 'mod_adv_2', 'mod_api_1'],
        applicableCodes: ['ASME Code Case 2235', 'ISO 13588', 'BS EN ISO 10863', 'API 570 / 510']
      };
    }

    // Step 5: Advanced & Senior Leader reached -> ASNT NDT Level III & Corporate Consultant
    return {
      id: 'cert_rec_level3_master',
      badgeLevel: 'level3',
      title: {
        ar: 'خبير واستشاري الفحص غير الإتلافي المستوى الثالث (ASNT NDT Level III & Technical Authority)',
        en: 'Principal NDT Level III & Corporate Technical Authority (ASNT NDT Level III / ISO 9712 Level 3)'
      },
      accreditationBody: 'ASNT Central Certification Program (ACCP) / ISO 9712 Level III',
      scope: {
        ar: 'اعتماد وتأليف إجراءات الفحص المكتوبة (NDT Procedures)، تأهيل المفتشين، واعتماد تقنيات الفحص في المشروعات القومية الكبرى.',
        en: 'Establish and approve written NDT procedures, audit qualification systems, represent corporate technical authority before clients & regulators.'
      },
      whyRecommended: {
        ar: 'إنجاز استثنائي! لقد أكملت معظم مسارات الفحص والتقييم. الخطوة الأسمى هي نيل رتبة المستوى الثالث والقيادة الهندسية الاستشارية.',
        en: 'Outstanding achievement! You have completed advanced multi-method milestones. The pinnacle is Corporate Level III authority.'
      },
      requiredTrainingHours: 200,
      requiredExperienceMonths: 36,
      prerequisitesMetCount: 5,
      totalPrerequisitesCount: 5,
      progressPercent: 100,
      eligibleNow: true,
      targetCareerRoles: {
        ar: 'استشاري NDT Level III معتمد / رئيس مهندسي سلامة الأصول وضبط الجودة',
        en: 'Chief Asset Integrity Engineer / Corporate Level III Consultant / QA Director'
      },
      targetIndustries: {
        ar: 'الهيئات الاستشارية الدولية، شركات النفط الوطنية، ووكالات الرقابة النووية والفضائية',
        en: 'Major energy corporations, classification societies (DNV/Lloyds), aerospace & nuclear safety boards'
      },
      recommendedNextModules: ['mod_c_lvl3_1', 'mod_asset_1'],
      applicableCodes: ['ASNT SNT-TC-1A', 'ASNT CP-189', 'ISO 9712', 'ASME Section V']
    };
  }, [allMilestones, readLessonIds, completedModulesMap]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-8 animate-fadeIn text-slate-100">
      
      {/* 1. HERO BANNER: ACADEMY LEARNING PATH & ROADMAP */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-br from-[#0c1433] via-[#0d173d] to-[#080b1c] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-8 -ms-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>INSCO • ACADEMY LEARNING PATH & CERTIFICATION ROADMAP</span>
            </div>

            {/* Quick Demo Simulator Buttons for Testing */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">{isAr ? 'محاكاة التقدم:' : 'Demo Simulator:'}</span>
              <button
                onClick={() => handleSimulateStage('tier0_foundation')}
                className="px-2.5 py-1 rounded-md bg-[#161c3c] hover:bg-[#202958] text-amber-300 border border-amber-400/30 transition text-[11px]"
                title={isAr ? 'تحديد الدروس التأسيسية كمقروءة' : 'Mark foundation lessons read'}
              >
                + {isAr ? 'الأساس العلمي' : 'Foundation'}
              </button>
              <button
                onClick={() => handleSimulateStage('tier1_level1')}
                className="px-2.5 py-1 rounded-md bg-[#161c3c] hover:bg-[#202958] text-emerald-300 border border-emerald-400/30 transition text-[11px]"
                title={isAr ? 'إكمال وحدات Level 1' : 'Complete Level 1 modules'}
              >
                + Level I
              </button>
              <button
                onClick={() => handleSimulateStage('tier2_level2')}
                className="px-2.5 py-1 rounded-md bg-[#161c3c] hover:bg-[#202958] text-cyan-300 border border-cyan-400/30 transition text-[11px]"
                title={isAr ? 'إكمال وحدات Level 2' : 'Complete Level 2 modules'}
              >
                + Level II
              </button>
              <button
                onClick={handleResetProgress}
                className="px-2 py-1 rounded-md bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition text-[11px] flex items-center gap-1"
                title={isAr ? 'إعادة ضبط المحاكاة' : 'Reset progress'}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr ? 'خريطة مسار التعلم والتأهيل المهني لـ NDT' : 'NDT Academy Student Learning Path & Career Roadmap'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
            {isAr
              ? 'تتبع محطات رحلتك التعليمية من أساسيات الفيزياء الهندسية والسلامة في مكتبة المعرفة، مروراً بمعايرة الأجهزة وتوصيف العيوب في المناهج، وحتى استحقاق المستوى المهني القادم (Level I / II / III / API).'
              : 'Visualize your structured qualification journey from fundamental physics and safety in the Knowledge Library, through hands-on instrument calibration and flaw sizing, to qualifying for your next industry certification.'}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-2xl border border-[#263560] bg-[#0c122b]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                {isAr ? 'المحطات المكتملة' : 'Milestones Completed'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{completedMilestonesCount}</span>
                <span className="text-xs text-slate-400">/ {totalMilestonesCount}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full transition-all duration-500" style={{ width: `${overallRoadmapPercent}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-[#263560] bg-[#0c122b]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'دروس المكتبة المقروءة' : 'Library Lessons Read'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-300">{readLessonIds.length}</span>
                <span className="text-xs text-slate-400">/ {KNOWLEDGE_LESSONS.length}</span>
              </div>
              <span className="text-[11px] text-amber-400/80 mt-1 block">
                {isAr ? 'تأسيس علمي ثنائي اللغة' : 'Bilingual Foundation'}
              </span>
            </div>

            <div className="rounded-2xl border border-[#263560] bg-[#0c122b]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'وحدات المناهج المعتمدة' : 'Curriculum Modules Passed'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-300">{Object.keys(completedModulesMap).length}</span>
                <span className="text-xs text-slate-400">{isAr ? 'وحدة' : 'mods'}</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 mt-1 block">
                {isAr ? 'معايرة واختبارات كودية' : 'Code Calibrations'}
              </span>
            </div>

            <div className="rounded-2xl border border-[#263560] bg-[#0c122b]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Trophy className="w-3.5 h-3.5 text-purple-400" />
                {isAr ? 'المستوى المقترح القادم' : 'Next Target Level'}
              </span>
              <div className="text-sm font-black text-purple-200 truncate mt-1">
                {nextCertificationRecommendation.badgeLevel.toUpperCase()}
              </div>
              <span className="text-[11px] text-purple-300/80 mt-1 block truncate">
                {nextCertificationRecommendation.accreditationBody}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STANDOUT INTELLIGENT ADVISOR: "NEXT NDT CERTIFICATION LEVEL TO PURSUE" */}
      <section 
        aria-label={isAr ? 'المستوى المقترح القادم' : 'Next Suggested NDT Certification Level'}
        className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-[#1a1c38] via-[#12152f] to-[#0c0e24] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
                {isAr ? 'المستشار الذكي للتأهيل المهني' : 'INTELLIGENT NDT CAREER ADVISOR'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'المستوى المهني المقترح استهدافه الآن' : 'Next Recommended NDT Certification Level'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md">
              <Award className="w-4 h-4" />
              <span>{nextCertificationRecommendation.accreditationBody}</span>
            </span>
          </div>
        </div>

        {/* Main Recommendation Content */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
          <div className="space-y-4">
            <div>
              <h4 className="text-xl sm:text-2xl font-black text-amber-200 leading-snug">
                {nextCertificationRecommendation.title[language]}
              </h4>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                {nextCertificationRecommendation.scope[language]}
              </p>
            </div>

            {/* Why Recommended Callout */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs sm:text-sm text-sky-100 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sky-300 font-bold block mb-1">
                  {isAr ? 'لماذا تم اقتراح هذا المستوى بناءً على مسارك الحالي؟' : 'Why this level is recommended for your current path:'}
                </strong>
                <p className="text-slate-300 leading-relaxed">
                  {nextCertificationRecommendation.whyRecommended[language]}
                </p>
              </div>
            </div>

            {/* Target Roles and Target Industries */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-[#0c0f24] p-3 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  {isAr ? 'المسمى الوظيفي المستهدف:' : 'Target Job Roles:'}
                </span>
                <p className="text-white font-medium">{nextCertificationRecommendation.targetCareerRoles[language]}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#0c0f24] p-3 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  {isAr ? 'القطاعات الصناعية المستفيدة:' : 'Target Industries:'}
                </span>
                <p className="text-white font-medium">{nextCertificationRecommendation.targetIndustries[language]}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Prerequisites & Progress Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-[#0b0e24] p-5 space-y-4">
            <h5 className="text-white font-bold text-sm flex items-center justify-between">
              <span>{isAr ? 'جاهزية متطلبات الاعتماد' : 'Certification Readiness'}</span>
              <span className="text-amber-300 font-mono text-xs">{nextCertificationRecommendation.progressPercent}%</span>
            </h5>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700" 
                style={{ width: `${nextCertificationRecommendation.progressPercent}%` }} 
              />
            </div>

            <div className="space-y-2 text-xs text-slate-300 divide-y divide-slate-800/80">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {isAr ? 'ساعات تدريبية موصى بها' : 'Classroom Training Required'}
                </span>
                <span className="font-bold text-white">{nextCertificationRecommendation.requiredTrainingHours} {isAr ? 'ساعة' : 'hrs'}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  {isAr ? 'خبرة ميدانية موثقة مطلوبة' : 'Documented Field Experience'}
                </span>
                <span className="font-bold text-white">{nextCertificationRecommendation.requiredExperienceMonths} {isAr ? 'شهراً' : 'months'}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? 'المتطلبات السابقة المنجزة' : 'Prerequisites Met'}
                </span>
                <span className="font-bold text-emerald-300">
                  {nextCertificationRecommendation.prerequisitesMetCount} / {nextCertificationRecommendation.totalPrerequisitesCount}
                </span>
              </div>
            </div>

            {/* Applicable Standards Badges */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
                {isAr ? 'الأكواد المرجعية للاختبار والتأهيل:' : 'Governing Standards & Codes:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {nextCertificationRecommendation.applicableCodes.map((code, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#161a3f] text-cyan-200 border border-cyan-500/25">
                    {code}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 space-y-2">
              <button
                onClick={() => {
                  if (onNavigateToCertificates) {
                    onNavigateToCertificates();
                  } else if (onLaunchQuiz) {
                    onLaunchQuiz('conventional_ndt', nextCertificationRecommendation.badgeLevel === 'api' ? 'level2' : nextCertificationRecommendation.badgeLevel);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>{isAr ? 'عرض إفادات واختبارات هذا المستوى' : 'Review Certification Exam & Badges'}</span>
              </button>

              {onLaunchQuiz && (
                <button
                  onClick={() => onLaunchQuiz('conventional_ndt')}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-[#171c3e] hover:bg-[#202758] text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'بدء اختبار المعرفة التأهيلي (ASNT Quiz)' : 'Launch Knowledge Quiz'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. ROADMAP CONTROLS: TRACK FILTERS, SEARCH & STATUS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tracks Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1 me-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              {isAr ? 'المسار التخصصي:' : 'Track:'}
            </span>
            {[
              { id: 'all', ar: 'كل المسارات', en: 'All Tracks' },
              { id: 'conventional_ndt', ar: 'الفحص التقليدي (Level 1/2/3)', en: 'Conventional NDT' },
              { id: 'advanced_ndt', ar: 'الفحص المتقدم (PAUT/TOFD)', en: 'Advanced NDT' },
              { id: 'welding_inspection', ar: 'تفتيش اللحام و PWHT', en: 'Welding & PWHT' },
              { id: 'api_inspection', ar: 'تفتيش المنشآت والأنابيب (API)', en: 'API Plant Inspection' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTrack(tab.id as CertificationTrack)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTrack === tab.id
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'bg-[#10132b] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {tab[language]}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-[#10132b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع المحطات' : 'All Milestones'}</option>
              <option value="completed">{isAr ? 'المكتملة فقط' : 'Completed Only'}</option>
              <option value="in_progress">{isAr ? 'قيد الإنجاز والقادمة' : 'In Progress & Next'}</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث في محطات المسار (الموجات الصوتية، ASME، زوايا الانكسار، API، التصوير الإشعاعي...)'
                : 'Search roadmap milestones by technique, code, or keyword (UT, ASME, Snell, API, TOFD...)'
            }
            className="w-full bg-[#0c0f24] border border-slate-800 rounded-2xl py-2.5 ps-10 pe-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition"
          />
        </div>
      </div>

      {/* 4. VISUAL ROADMAP MILESTONES PIPELINE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <span>{isAr ? 'تسلسل المحطات التعليمية والكودية' : 'Curriculum & Library Milestones Timeline'}</span>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredMilestones.length} {isAr ? 'محطة' : 'milestones'})
            </span>
          </h3>

          <span className="text-xs text-slate-400 hidden sm:inline">
            {isAr ? 'انقر على أي محطة للاطلاع على تفاصيلها والتنقل إليها' : 'Click any milestone to view details & launch actions'}
          </span>
        </div>

        {filteredMilestones.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400 space-y-3">
            <p>{isAr ? 'لا توجد محطات مطابقة للفلاتر المحددة.' : 'No milestones match your selected filter or search.'}</p>
            <button
              onClick={() => { setSelectedTrack('all'); setStatusFilter('all'); setSearchQuery(''); }}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Clear search and filters'}
            </button>
          </div>
        ) : (
          <div className="relative border-s-2 border-slate-800 ms-4 sm:ms-8 ps-6 sm:ps-8 space-y-6">
            {filteredMilestones.map((milestone, idx) => {
              const isDone = isMilestoneCompleted(milestone);
              const isSelected = selectedMilestoneId === milestone.id;

              // Color scheme according to tier
              const tierBadgeColors = {
                tier0_foundation: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                tier1_level1: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                tier2_level2: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
                tier3_level3_api: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
              }[milestone.tier];

              const tierLabels = {
                tier0_foundation: isAr ? 'المستوى 0 • الأساس العلمي والمكتبة' : 'Tier 0 • Foundation Science',
                tier1_level1: isAr ? 'المستوى 1 • مشغل فحص معتمد (Level I)' : 'Tier 1 • Certified Operator (Level I)',
                tier2_level2: isAr ? 'المستوى 2 • مفتش أول وتوصيف عيوب (Level II)' : 'Tier 2 • Senior Inspector (Level II)',
                tier3_level3_api: isAr ? 'المستوى 3 • الفحص المتقدم وتفتيش المنشآت (Level III / API)' : 'Tier 3 • Advanced / API Specialist',
              }[milestone.tier];

              return (
                <div key={milestone.id} className="relative group">
                  {/* Timeline Node Bullet */}
                  <div 
                    onClick={(e) => handleToggleMilestone(milestone, e)}
                    className={`absolute -start-[35px] sm:-start-[43px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 z-10 ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                        : 'bg-[#0e132e] border-slate-600 text-slate-400 group-hover:border-amber-400 group-hover:text-amber-300'
                    }`}
                    title={isDone ? (isAr ? 'مكتمل - انقر لإلغاء التحديد' : 'Completed - click to toggle') : (isAr ? 'انقر لتحديد المحطة كمكتملة' : 'Click to mark complete')}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-[11px] font-mono font-bold">{idx + 1}</span>}
                  </div>

                  {/* Milestone Card */}
                  <div
                    onClick={() => setSelectedMilestoneId(isSelected ? null : milestone.id)}
                    className={`rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-amber-400/80 bg-[#161a3f] shadow-xl'
                        : isDone
                        ? 'border-emerald-500/30 bg-[#0e152d]/90 hover:border-emerald-400/60'
                        : 'border-[#222b4d] bg-[#0c1026]/90 hover:border-slate-600'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierBadgeColors}`}>
                          {tierLabels}
                        </span>

                        {milestone.codeOrStandard && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                            {milestone.codeOrStandard}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isAr ? 'تم الإنجاز' : 'Completed'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Circle className="w-3.5 h-3.5 text-slate-500" />
                            {isAr ? 'قيد الدراسة' : 'Pending'}
                          </span>
                        )}

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {milestone.estimatedHours} {isAr ? 'ساعة' : 'h'}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-base sm:text-lg font-black text-white group-hover:text-amber-200 transition">
                      {milestone.title[language]}
                    </h4>

                    {/* Summary */}
                    <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed line-clamp-2">
                      {milestone.summary[language]}
                    </p>

                    {/* Action Bar & Quick CTAs */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Left: Techniques chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {milestone.techniques.map((tech, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 text-[11px]">
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Right: Direct Actions */}
                      <div className="flex items-center gap-2">
                        {/* Toggle button */}
                        <button
                          onClick={(e) => handleToggleMilestone(milestone, e)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>{isAr ? 'مكتمل' : 'Done'}</span>
                            </>
                          ) : (
                            <span>{isAr ? 'تحديد كمكتمل' : 'Mark Done'}</span>
                          )}
                        </button>

                        {/* Open in Library or Curriculum */}
                        {milestone.sourceType === 'library_lesson' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rawId = milestone.id.replace('lib_', '');
                              if (onOpenLibraryLesson) {
                                onOpenLibraryLesson(rawId);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isAr ? 'فتح الدرس' : 'Open Lesson'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rawId = milestone.id.replace('cur_', '');
                              if (onNavigateToModule) {
                                onNavigateToModule(milestone.disciplineId, milestone.curriculumLevelIdx || 0, rawId);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{isAr ? 'فتح الوحدة' : 'Open Module'}</span>
                          </button>
                        )}

                        {/* Lab Simulation CTA if available */}
                        {milestone.associatedLabId && onOpenVirtualLab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenVirtualLab(milestone.associatedLabId);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-bold flex items-center gap-1 transition cursor-pointer"
                            title={isAr ? 'فتح المعمل الافتراضي المرتبط' : 'Open related Virtual Lab'}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isAr ? 'المعمل' : 'Lab'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details Drawer if Selected */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-3 bg-[#0a0d20] -mx-5 -mb-5 p-5 rounded-b-2xl animate-fadeIn">
                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block font-semibold mb-1">
                              {isAr ? 'المتطلبات السابقة للمحطة:' : 'Prerequisites:'}
                            </span>
                            <p className="text-slate-200 bg-[#121633] p-2.5 rounded-lg border border-slate-800">
                              {milestone.prerequisites[language]}
                            </p>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-semibold mb-1">
                              {isAr ? 'الدور الميداني والكود المستهدف:' : 'Target Role & Code Responsibility:'}
                            </span>
                            <p className="text-slate-200 bg-[#121633] p-2.5 rounded-lg border border-slate-800">
                              {milestone.targetRole[language]}
                            </p>
                          </div>
                        </div>

                        {onLaunchQuiz && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => onLaunchQuiz(milestone.disciplineId)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 hover:brightness-110 transition shadow cursor-pointer"
                            >
                              <HelpCircle className="w-4 h-4" />
                              <span>{isAr ? 'اختبار المعرفة وتأكيد إنجاز المحطة' : 'Take Verification Quiz'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. NDT CERTIFICATION PATHWAY TIERS EXPLAINER MATRIX */}
      <section className="rounded-3xl border border-slate-800 bg-[#0b0e24] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-xl font-black text-white">
              {isAr ? 'مستويات شهادات NDT العالمية ومتطلبات التأهيل (SNT-TC-1A / ISO 9712)' : 'Global NDT Certification Tiers & Prerequisites Guide'}
            </h4>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              {isAr
                ? 'فهم الفروق الرسمية بين رتب التفتيش من المشغل وحتى الخبير الاستشاري، لضمان تخطيط مسارك بدقة.'
                : 'Understand official requirements separating Operator, Senior Inspector, and Principal Level III Consultant.'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0e1633] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LEVEL I
              </span>
              <span className="text-xs text-slate-400 font-mono">Operator</span>
            </div>
            <h5 className="text-base font-black text-white">
              {isAr ? 'مشغل فحص غير إتلافي معتمد' : 'Certified NDT Operator'}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'تشغيل ومعايرة الأجهزة وتطبيق الفحص وفق تعليمات محددة ومكتوبة من المستوى الثاني/الثالث، دون سلطة قبول أو رفض مستقلة.'
                : 'Calibrate equipment, conduct specific inspections, and record results according to written instructions without independent acceptance authority.'}
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
              <div>• {isAr ? 'التدريب: 40-80 ساعة كلاسيكية' : 'Training: 40-80 classroom hours'}</div>
              <div>• {isAr ? 'الخبرة: 1-3 أشهر موثقة' : 'Experience: 1-3 months logged'}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-[#0e1633] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                LEVEL II
              </span>
              <span className="text-xs text-slate-400 font-mono">Inspector</span>
            </div>
            <h5 className="text-base font-black text-white">
              {isAr ? 'مفتش NDT معتمد وسلطة تقييم' : 'Certified Senior Inspector'}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'توصيف وتحديد أبعاد العيوب (Flaw Sizing)، تطبيق معايير القبول والرفض الكودية، تدريب المستوى الأول، وإصدار التقارير النهائية.'
                : 'Set up calibrations, evaluate and size flaws against codes/standards, authorize acceptance/rejection, and supervise Level I personnel.'}
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
              <div>• {isAr ? 'التدريب: 80-120 ساعة متقدمة' : 'Training: 80-120 advanced hours'}</div>
              <div>• {isAr ? 'الخبرة: 9-12 شهراً ميدانياً' : 'Experience: 9-12 field months'}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-[#0e1633] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                LEVEL III / API
              </span>
              <span className="text-xs text-slate-400 font-mono">Authority</span>
            </div>
            <h5 className="text-base font-black text-white">
              {isAr ? 'استشاري وخبير فحص معتمد' : 'Principal Technical Consultant'}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'تأليف واعتماد إجراءات الفحص (NDT Procedures)، اختبار وتأهيل الكوادر، وتقديم المشورة الفنية في النزاعات والكوارث الهندسية.'
                : 'Establish and approve written procedures, qualify personnel, design complex inspection protocols, and advise corporate asset integrity.'}
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
              <div>• {isAr ? 'التدريب: تخصص هندسي + شهادة ACCP' : 'Training: Degree + ACCP Exam'}</div>
              <div>• {isAr ? 'الخبرة: 2-4 سنوات كـ Level II' : 'Experience: 2-4 years as Level II'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ACADEMY DISCLAIMER FOOTER */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-300 font-bold mb-0.5">
            {isAr ? 'إخلاء مسؤولية تنظيمي وأكاديمي:' : 'Regulatory & Academic Disclaimer:'}
          </strong>
          {isAr
            ? 'خريطة التعلم والتوصيات الصادرة هنا هي أداة إرشادية وتدريبية ذاتية لمساعدة الطلاب والمهندسين في تنظيم مسارهم الدراسي. اجتياز محطات الأكاديمية لا يمنح تلقائياً شهادة ترخيص عمل معتمدة رسمياً أو تفويضاً ميدانياً، حيث يشترط في النظم الدولية (ISO 9712 / SNT-TC-1A) الخضوع لاختبارات نظرية وعملية مقننة وفحص حدة الإبصار وتفويض خطي من جهة العمل أو الهيئة الوطنية المعتمدة.'
            : 'The learning path roadmap and certification suggestions are educational guidance tools designed to structure self-study. Completing academy milestones does not replace mandated employer certification, centralized ISO 9712 exams, near-vision acuity verification, or supervised on-the-job training required by applicable codes and regulatory bodies.'}
        </div>
      </div>

    </div>
  );
};
