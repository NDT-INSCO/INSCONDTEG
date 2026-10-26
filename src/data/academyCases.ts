import { LocalText, text } from './academyKnowledge';

export interface AcademyCase {
  id: string;
  title: LocalText;
  summary: LocalText;
}

export const ACADEMY_CASES: AcademyCase[] = [
  { id: 'case-ut-thickness', title: text('حالة UT: سمك جدار', 'Case UT: wall thickness'), summary: text('قراءات متعددة وحساب عدم اليقين.', 'Multiple readings and uncertainty.') },
  { id: 'case-pt-crack', title: text('حالة PT: شرخ سطحي', 'Case PT: surface crack'), summary: text('تشخيص شرخ في ألومنيوم.', 'Diagnosing crack in aluminium.') },
  { id: 'case-mt-orientation', title: text('حالة MT: اتجاه عيب', 'Case MT: flaw orientation'), summary: text('فقد عيب موازٍ للمجال.', 'Missed flaw parallel to field.') },
  { id: 'case-rt-density', title: text('حالة RT: كثافة فلم', 'Case RT: film density'), summary: text('قراءة densitometer.', 'Densitometer reading.') },
  { id: 'case-weld-heat', title: text('حالة لحام: مدخلات حرارة', 'Case weld: heat input'), summary: text('حساب heat input.', 'Heat input calculation.') },
  { id: 'case-api-life', title: text('حالة API: عمر متبقي', 'Case API: remaining life'), summary: text('حساب عمر متبقي.', 'Remaining life calculation.') },
];
