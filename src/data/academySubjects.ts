import { LocalText, text } from './academyKnowledge';

export interface AcademySubject {
  id: string;
  title: LocalText;
  lab?: string;
  summary: LocalText;
}

export const ACADEMY_SUBJECTS: AcademySubject[] = [
  { id: 'measurement', title: text('القياس والوحدات', 'Measurement & units'), lab: 'ut_lab', summary: text('أساس القياس والمعايرة.', 'Measurement and calibration basics.') },
  { id: 'waves', title: text('فيزياء الموجات', 'Wave physics'), lab: 'ut_lab', summary: text('الموجات فوق الصوتية.', 'Ultrasonic waves.') },
  { id: 'vt', title: text('الفحص البصري', 'Visual testing'), lab: 'rt_illuminator', summary: text('VT وقراءة الوصلات.', 'VT and weld geometry.') },
  { id: 'pt', title: text('السائل النافذ', 'Penetrant testing'), lab: 'pt_mt_darkroom', summary: text('PT والخاصية الشعرية.', 'PT and capillary action.') },
  { id: 'mt', title: text('الجسيمات المغناطيسية', 'Magnetic particle'), lab: 'pt_mt_darkroom', summary: text('MT واتجاه المجال.', 'MT and field direction.') },
  { id: 'ut', title: text('الموجات فوق الصوتية', 'Ultrasonic testing'), lab: 'ut_lab', summary: text('UT والمعايرة.', 'UT calibration.') },
  { id: 'welding', title: text('فحص اللحام', 'Weld inspection'), lab: 'weld_inspector_gauge', summary: text('مقاييس اللحام.', 'Weld gauges.') },
  { id: 'api', title: text('API وعمر المتبقي', 'API & remaining life'), lab: 'api_vessel_life', summary: text('حسابات API.', 'API calculations.') },
];
