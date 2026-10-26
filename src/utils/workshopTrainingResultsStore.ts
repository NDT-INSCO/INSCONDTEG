import { ExtendedWeldFlawId } from '../data/utWeldDefectsCatalog';
import { recordSimulationAttempt } from './simulationHistoryStore';

export interface WorkshopTrainingAttempt {
  id: string;
  timestampIso: string;
  instrument: 'UT' | 'PAUT' | 'DAC';
  deviceModel: string;
  specimenGeometry: 'flat' | 'curved' | 'calibration_block';
  defectId: ExtendedWeldFlawId | 'sound_weld';
  defectNameAr: string;
  defectNameEn: string;
  actualDepthMm: number;
  measuredDepthMm: number;
  actualLengthMm: number;
  measuredLengthMm: number;
  echoAmplitudePct: number;
  codeStandard: string;
  traineeVerdict: 'ACCEPT' | 'REJECT';
  actualCodeVerdict: 'ACCEPT' | 'REJECT';
  isBlindChallenge: boolean;
  scorePct: number;
  feedbackAr: string;
  feedbackEn: string;
}

const STORAGE_KEY = 'insco_ut_paut_workshop_training_results_v1';
const UPDATE_EVENT = 'insco-workshop-training-updated';

const INITIAL_SEED_ATTEMPTS: WorkshopTrainingAttempt[] = [
  {
    id: 'seed-ut-1',
    timestampIso: '2026-10-24T09:15:00.000Z',
    instrument: 'UT',
    deviceModel: 'Krautkrämer USM 35X (60° Shear)',
    specimenGeometry: 'flat',
    defectId: 'root_crack',
    defectNameAr: 'شرخ طولي في جذر اللحام (Root Crack)',
    defectNameEn: 'Root Crack (Planar)',
    actualDepthMm: 24.0,
    measuredDepthMm: 23.8,
    actualLengthMm: 14.0,
    measuredLengthMm: 14.0,
    echoAmplitudePct: 88,
    codeStandard: 'ASME Sec VIII Div 1 (UW-51)',
    traineeVerdict: 'REJECT',
    actualCodeVerdict: 'REJECT',
    isBlindChallenge: false,
    scorePct: 98,
    feedbackAr: 'تحجيم ممتاز لعمق الجذر وطول العيب (-6dB) وقرار رفض مطابق تماماً للفقرة UW-51.',
    feedbackEn: 'Accurate root depth & -6dB length sizing; correct planar rejection per ASME UW-51.',
  },
  {
    id: 'seed-paut-2',
    timestampIso: '2026-10-24T09:42:00.000Z',
    instrument: 'PAUT',
    deviceModel: 'Olympus OmniScan X3 (32E 5L64)',
    specimenGeometry: 'curved',
    defectId: 'lack_of_fusion',
    defectNameAr: 'نقص انصهار جانبي بالشطف (Sidewall LOF)',
    defectNameEn: 'Lack of Sidewall Fusion (LOF)',
    actualDepthMm: 14.0,
    measuredDepthMm: 14.2,
    actualLengthMm: 18.0,
    measuredLengthMm: 17.5,
    echoAmplitudePct: 91,
    codeStandard: 'ASME B31.3 Table 341.3.2',
    traineeVerdict: 'REJECT',
    actualCodeVerdict: 'REJECT',
    isBlindChallenge: false,
    scorePct: 96,
    feedbackAr: 'تطبيق دقيق لتصحيح انحناء الأنبوب (Curved OD) وتمييز الانعكاس المرآوي على شطف 30°.',
    feedbackEn: 'Proper curved pipe OD depth correction and bevel-aligned S-Scan characterization.',
  },
  {
    id: 'seed-ut-3',
    timestampIso: '2026-10-24T10:05:00.000Z',
    instrument: 'UT',
    deviceModel: 'Krautkrämer USM 35X (45° Shear + DAC)',
    specimenGeometry: 'flat',
    defectId: 'porosity_cluster',
    defectNameAr: 'عنقود مسامات غازية متجمعة (Cluster Porosity)',
    defectNameEn: 'Porosity Cluster (Gas Cavities)',
    actualDepthMm: 13.0,
    measuredDepthMm: 13.4,
    actualLengthMm: 5.0,
    measuredLengthMm: 5.2,
    echoAmplitudePct: 46,
    codeStandard: 'ASME Sec VIII Appendix 12',
    traineeVerdict: 'ACCEPT',
    actualCodeVerdict: 'ACCEPT',
    isBlindChallenge: false,
    scorePct: 94,
    feedbackAr: 'تمييز سليم للعيب الحجمي المشتت وقرار قبول صحيح لأن الطول ≤ 6.0 مم والسعة دون DAC.',
    feedbackEn: 'Correctly identified volumetric cluster scattering and accepted per 6.0mm threshold.',
  },
];

export function getWorkshopTrainingAttempts(): WorkshopTrainingAttempt[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SEED_ATTEMPTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SEED_ATTEMPTS;
  } catch {
    return INITIAL_SEED_ATTEMPTS;
  }
}

export function gradeAndRecordWorkshopAttempt(input: {
  instrument: 'UT' | 'PAUT' | 'DAC';
  deviceModel: string;
  specimenGeometry: 'flat' | 'curved' | 'calibration_block';
  defectId: ExtendedWeldFlawId | 'sound_weld';
  defectNameAr: string;
  defectNameEn: string;
  actualDepthMm: number;
  measuredDepthMm: number;
  actualLengthMm: number;
  measuredLengthMm: number;
  echoAmplitudePct: number;
  codeStandard: string;
  traineeVerdict: 'ACCEPT' | 'REJECT';
  actualCodeVerdict: 'ACCEPT' | 'REJECT';
  isBlindChallenge?: boolean;
}): WorkshopTrainingAttempt {
  const depthErr = Math.abs(input.measuredDepthMm - input.actualDepthMm);
  const lenErr = Math.abs(input.measuredLengthMm - input.actualLengthMm);
  const verdictCorrect = input.traineeVerdict === input.actualCodeVerdict;

  // Grading rubric: 50 pts code verdict + 25 pts depth accuracy (±2mm) + 25 pts length sizing (±3mm)
  const verdictPts = verdictCorrect ? 50 : 10;
  const depthPts = Math.max(0, Math.round(25 * Math.max(0, 1 - depthErr / 6)));
  const lenPts = Math.max(0, Math.round(25 * Math.max(0, 1 - lenErr / 8)));
  const scorePct = Math.min(100, verdictPts + depthPts + lenPts);

  let feedbackAr = '';
  let feedbackEn = '';

  if (verdictCorrect && depthErr <= 1.5 && lenErr <= 2.0) {
    feedbackAr = `أداء احترافي (Level II/III): دقة عالية في قياس العمق (ΔD=${depthErr.toFixed(1)}مم) والطول (ΔL=${lenErr.toFixed(1)}مم) وحكم مطابق للكود.`;
    feedbackEn = `Level II/III precision: Depth error ${depthErr.toFixed(1)}mm, Length error ${lenErr.toFixed(1)}mm, and accurate code verdict.`;
  } else if (verdictCorrect) {
    feedbackAr = `قرار الكود (${input.traineeVerdict}) صحيح، لكن يُنصح بتحسين دقة التحجيم (فرق العمق ${depthErr.toFixed(1)}مم وفرق الطول ${lenErr.toFixed(1)}مم).`;
    feedbackEn = `Code disposition (${input.traineeVerdict}) is correct; refine sizing accuracy (ΔD=${depthErr.toFixed(1)}mm, ΔL=${lenErr.toFixed(1)}mm).`;
  } else {
    feedbackAr = `تنبيه هندسي: قرارك (${input.traineeVerdict}) يخالف حكم الكود الفعلي (${input.actualCodeVerdict}). راجع تصنيف العيب المستوي/الحجمي وحد الطول المسموح.`;
    feedbackEn = `Code mismatch: You selected ${input.traineeVerdict} whereas ${input.codeStandard} mandates ${input.actualCodeVerdict}.`;
  }

  const attempt: WorkshopTrainingAttempt = {
    id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestampIso: new Date().toISOString(),
    instrument: input.instrument,
    deviceModel: input.deviceModel,
    specimenGeometry: input.specimenGeometry,
    defectId: input.defectId,
    defectNameAr: input.defectNameAr,
    defectNameEn: input.defectNameEn,
    actualDepthMm: Number(input.actualDepthMm.toFixed(1)),
    measuredDepthMm: Number(input.measuredDepthMm.toFixed(1)),
    actualLengthMm: Number(input.actualLengthMm.toFixed(1)),
    measuredLengthMm: Number(input.measuredLengthMm.toFixed(1)),
    echoAmplitudePct: Math.round(input.echoAmplitudePct),
    codeStandard: input.codeStandard,
    traineeVerdict: input.traineeVerdict,
    actualCodeVerdict: input.actualCodeVerdict,
    isBlindChallenge: Boolean(input.isBlindChallenge),
    scorePct,
    feedbackAr,
    feedbackEn,
  };

  try {
    const existing = getWorkshopTrainingAttempts();
    const updated = [attempt, ...existing].slice(0, 30);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // ignore storage errors in restricted environments
  }

  recordSimulationAttempt({
    timestamp: attempt.timestampIso,
    simulatorId: input.isBlindChallenge
      ? 'blind_drill'
      : input.instrument === 'PAUT'
      ? 'paut_console'
      : input.instrument === 'DAC'
      ? 'dac_builder'
      : 'weld_simulator',
    targetSubTab: input.instrument === 'DAC' ? 'dac_builder' : 'weld_simulator',
    simulatorTitle: input.isBlindChallenge
      ? {
          ar: `اختبار العينة العمياء (${input.deviceModel})`,
          en: `Blind Practical Specimen (${input.deviceModel})`,
        }
      : {
          ar: `محاكي الفحص العملي — ${input.deviceModel}`,
          en: `NDT Simulation — ${input.deviceModel}`,
        },
    ndtMethod: input.instrument,
    defectTypes: [
      {
        id: input.defectId,
        ar: input.defectNameAr,
        en: input.defectNameEn,
      },
    ],
    status: verdictCorrect && scorePct >= 70 ? 'PASS' : 'FAIL',
    codeVerdict: input.actualCodeVerdict,
    traineeVerdict: input.traineeVerdict,
    codeStandard: input.codeStandard,
    scorePct,
    actualDepthMm: attempt.actualDepthMm,
    measuredDepthMm: attempt.measuredDepthMm,
    actualLengthMm: attempt.actualLengthMm,
    measuredLengthMm: attempt.measuredLengthMm,
    notes: {
      ar: feedbackAr,
      en: feedbackEn,
    },
  });

  return attempt;
}

export function resetWorkshopTrainingAttempts(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeWorkshopTrainingUpdates(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(UPDATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_EVENT, handler);
}
