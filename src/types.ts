/**
 * Canonical type surface for the INSCO academy.
 *
 * This module is the single source of truth. `src/types/index.ts` re-exports it
 * and `src/data/curriculum/types.ts` extends it, so the two previously diverging
 * schemas can no longer drift apart.
 */

export type Language = 'ar' | 'en';

export interface LocalizedText {
  ar: string;
  en: string;
}

/* ------------------------------------------------------------------ defects */

export type DefectSeverity = 'Critical' | 'Major' | 'Minor';

export interface EducationalDefect {
  id: string;
  name: LocalizedText;
  /** Physical nature of the discontinuity (void, planar crack, inclusion...). */
  nature: LocalizedText;
  /** Typical root cause in the welding / forming process. */
  cause: LocalizedText;
  /** NDT methods best suited to detect it, in decreasing order of usefulness. */
  bestDetectionMethods: string[];
  /** Acceptance criteria pointer, e.g. "ASME Sec VIII Div 1, UW-51". */
  acceptanceCriteriaCode: string;
  severity: DefectSeverity;
  /** Legacy short description kept for compact cards. */
  description?: LocalizedText;
  /** Method id from `NDT_METHODS` that best illustrates the defect. */
  method?: string;
}

/* -------------------------------------------------------------------- quiz */

export interface QuizQuestion {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
  /** Canonical zero-based index of the correct option. */
  correctAnswer: number;
  /** Legacy alias used by the flip-book quiz widgets. */
  correctIndex?: number;
  explanation: LocalizedText;
  discipline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  codeReference?: string;
}

/* ------------------------------------------------------------------ methods */

export interface NDTMethod {
  id: string;
  /** Short method code shown on badges (VT, PT, MT, UT, RT, ET...). */
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  category: string;
  /** Main standards governing the method. */
  standards: string;
}

/* ---------------------------------------------------------------- standards */

export interface StandardEntry {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  /** What the standard covers and where it applies. */
  scope: string;
  publisher: string;
  category?: string;
  /** Legacy localized title kept for older cards. */
  title?: LocalizedText;
  description?: LocalizedText;
}

/* --------------------------------------------------------------- curriculum */

export interface CurriculumModule {
  id: string;
  titleAr: string;
  titleEn: string;
  duration: string;
  topicsAr: string[];
  topicsEn?: string[];
  keyTopics?: string[];
  learningOutcomesAr?: string[];
  learningOutcomesEn?: string[];
  flashcardDeckId?: string;
  quizId?: string;
}

export interface KeyFormula {
  nameAr: string;
  nameEn: string;
  formula: string;
  noteAr?: string;
  noteEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

export interface PracticalSkill {
  id?: string;
  titleAr?: string;
  titleEn?: string;
  skillAr?: string;
  skillEn?: string;
  codeStandard?: string;
  importance?: string;
  [key: string]: any;
}

export interface ReferenceTextbook {
  title: string;
  author?: string;
  standardOrPublisher?: string;
  year?: string;
}

export interface CurriculumLevel {
  levelId: string;
  tierCategory?: string;
  nameAr: string;
  nameEn: string;
  academicStageAr?: string;
  academicStageEn?: string;
  targetRoleAr: string;
  targetRoleEn: string;
  prerequisitesAr: string;
  prerequisitesEn: string;
  trainingHours: number;
  experienceMonths: number;
  internationalCerts: string[];
  applicableCodes: string[];
  responsibilitiesAr: string[];
  responsibilitiesEn: string[];
  modules: CurriculumModule[];
  keyFormulas?: KeyFormula[];
  practicalSkillsChecklist?: PracticalSkill[];
  referenceTextbooks?: ReferenceTextbook[];
  academicFoundations?: any;
}

export interface EngineeringDiscipline {
  id: string;
  titleAr: string;
  titleEn: string;
  category: string;
  badgeColor: string;
  overviewAr: string;
  overviewEn: string;
  keyTechniques: string[];
  globalAccreditations: string[];
  targetIndustries: string[];
  levels: CurriculumLevel[];
}

/* --------------------------------------------------------------- textbooks */

export interface TextbookPage {
  pageNumber: number;
  title: LocalizedText;
  contentBlocks?: unknown[];
  quizQuestion?: QuizQuestion;
  [key: string]: any;
}

export interface NdtTextbook {
  id: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  author?: LocalizedText;
  level?: string;
  pages: TextbookPage[];
  [key: string]: any;
}
