/**
 * Curriculum-specific view of the canonical types.
 *
 * The rich schema lives in `src/types.ts`; this module only narrows the level
 * identifier to the four stages the curriculum actually uses, and re-exports the
 * supporting types so existing imports keep working unchanged.
 */
import { CurriculumLevel, CurriculumModule, EngineeringDiscipline, KeyFormula, PracticalSkill, ReferenceTextbook } from '../../types';

export type { CurriculumModule, EngineeringDiscipline, KeyFormula, PracticalSkill, ReferenceTextbook };

export interface DisciplineLevel extends Omit<CurriculumLevel, 'levelId'> {
  levelId: 'academic' | 'level1' | 'level2' | 'level3';
}

export interface WorkshopLab {
  id: string;
  titleAr: string;
  titleEn: string;
  disciplineId: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  interactiveTool: string;
  tags: string[];
}
