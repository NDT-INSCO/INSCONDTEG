import type { AcademyTab } from '../academyTabs';

export type DriveOrganizerCategory = 'education' | 'simulators';

export const DEFAULT_INSCO_DRIVE_FOLDER_ID = '1Aazy_CaVLDHgpFreuTGKmYPIex9Hitil';
export const DEFAULT_INSCO_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DEFAULT_INSCO_DRIVE_FOLDER_ID}`;

export const DRIVE_TARGET_FOLDERS: Record<DriveOrganizerCategory, { name: string; ar: string; en: string }> = {
  education: {
    name: '01 - التعليم (Education)',
    ar: 'التعليم والمناهج',
    en: 'Education & Study',
  },
  simulators: {
    name: '02 - المحاكيات (Simulators)',
    ar: 'المحاكيات والمعامل',
    en: 'Simulators & Labs',
  },
};

export interface DriveRawItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
  folderPath?: string;
}

export interface ClassifiedDriveItem extends DriveRawItem {
  category: DriveOrganizerCategory;
  discipline: string;
  suggestedTab: AcademyTab;
  reasonAr: string;
  reasonEn: string;
  alreadyInTargetFolder: boolean;
}

/**
 * Extracts a Google Drive folder ID from a Drive URL or raw ID string.
 * Supports:
 *   - https://drive.google.com/drive/folders/<ID>?usp=sharing
 *   - https://drive.google.com/drive/u/0/folders/<ID>
 *   - https://drive.google.com/open?id=<ID>
 *   - <ID>
 */
export function parseDriveFolderId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (folderMatch?.[1]) return folderMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

const SIMULATOR_EXTENSIONS = /\.(html?|js|mjs|jsx|ts|tsx|json|csv|xlsx?|xlsm|ipynb|glb|gltf|obj|stl|fbx|swf|exe|msi|apk|wasm|zip|rar|7z)$/i;
const SIMULATOR_KEYWORDS = /(?:^|[^a-z0-9])(simulat\w*|virtual|lab\w*|emulator|interactive|calculator|exposure|chart|calibrat\w*|dac|v1|v2|paut|tofd|3d|ar|vr|weld[-_\s]?scan|darkroom|curve|plotter|playground|sandbox|محاكي|محاكيات|معمل|تفاعلي|حاسبة|تخطيط|معايرة|منحنى|الواقع المعزز|تجربة)(?:[^a-z0-9]|$)/i;
const EDUCATION_KEYWORDS = /(?:^|[^a-z0-9])(books?|textbooks?|guides?|manuals?|lectures?|slides?|presentations?|courses?|lessons?|curriculum|study|notes|exams?|quiz\w*|questions?|standards?|codes?|asme|api|aws|iso|astm|handbook|reference|training|syllabus|workbook|sheet|pdf|تعليم|كتاب|كتب|منهج|مناهج|محاضرة|محاضرات|دليل|شرح|درس|دروس|اختبار|اسئلة|أسئلة|كود|مواصفة|مرجع|مذكرة|تدريب)(?:[^a-z0-9]|$)/i;

function detectDiscipline(haystack: string): { discipline: string; eduTab: AcademyTab; simTab: AcademyTab } {
  const normalized = haystack.replace(/[_/\\.-]+/g, ' ');
  if (/\b(rt|radiograph(?:y|ic)?|gamma|x-?ray|ir-?192|co-?60|se-?75|iqi|exposure|unsharpness)\b|إشعاع|أشعة|جاما/i.test(normalized)) {
    if (/exposure|decay|curie|half[-_\s]?life|time|تعريض|اضمحلال/i.test(normalized)) {
      return { discipline: 'RT', eduTab: 'edb', simTab: 'ge_exposure_time' };
    }
    if (/panorama|ellipse|elliptical|street|shooting|technique|بانوراما|إليبس/i.test(normalized)) {
      return { discipline: 'RT', eduTab: 'edb', simTab: 'sim_labs_rt' };
    }
    return { discipline: 'RT', eduTab: 'edb', simTab: 'rt_lab' };
  }
  if (/\b(paut|phased\s?array|tofd)\b|مصفوفة/i.test(normalized)) {
    return { discipline: 'PAUT / TOFD', eduTab: 'courses', simTab: 'paut_controller' };
  }
  if (/\b(ut|ultrasonic|dac|v1|v2|iiw|snell|angle\s?beam)\b|فوق\s?صوتي/i.test(normalized)) {
    if (/\bdac\b/i.test(normalized)) return { discipline: 'UT', eduTab: 'courses', simTab: 'dac_builder' };
    if (/\b(v1|v2|iiw|calibrat\w*)\b|معايرة/i.test(normalized)) return { discipline: 'UT', eduTab: 'courses', simTab: 'v1_v2_calibration' };
    return { discipline: 'UT', eduTab: 'courses', simTab: 'weld_simulator' };
  }
  if (/\bpwht\b|heat\s?treat|thermocouple|soak|حراري|معالجة\s?حرارية/i.test(normalized)) {
    return { discipline: 'PWHT', eduTab: 'methods', simTab: 'pwht_curve' };
  }
  if (/\b(mt|pt|vt|et|magnetic|penetrant|visual|eddy)\b|مغناطيس|نافذة|بصري|دوامية/i.test(normalized)) {
    return { discipline: 'Surface NDT', eduTab: 'courses', simTab: 'workshops' };
  }
  if (/\b(defect|flaw|slag|porosity|crack|fusion|penetration)\b|عيب|عيوب|شرخ|مسامية/i.test(normalized)) {
    return { discipline: 'Defects', eduTab: 'knowledge', simTab: 'defects' };
  }
  if (/\b(asme|api|aws|iso|astm|code|standard)\b|كود|مواصفة|معيار/i.test(normalized)) {
    return { discipline: 'Codes & Standards', eduTab: 'standards', simTab: 'ar_rt_codes' };
  }
  return { discipline: 'General NDT', eduTab: 'edb', simTab: 'workshops' };
}

export function classifyDriveItem(item: DriveRawItem): ClassifiedDriveItem {
  const path = item.folderPath ?? '';
  const haystack = `${item.name} ${path}`;
  const { discipline, eduTab, simTab } = detectDiscipline(haystack);

  const alreadyEdu = path.includes(DRIVE_TARGET_FOLDERS.education.name) || /(^|\/)(التعليم|education)/i.test(path);
  const alreadySim = path.includes(DRIVE_TARGET_FOLDERS.simulators.name) || /(^|\/)(المحاكيات|simulators)/i.test(path);

  const isGoogleSlidesOrDocs =
    item.mimeType === 'application/vnd.google-apps.document' ||
    item.mimeType === 'application/vnd.google-apps.presentation';
  const isGoogleSheet = item.mimeType === 'application/vnd.google-apps.spreadsheet';

  let category: DriveOrganizerCategory = 'education';
  let reasonAr = 'مادة مرجعية / كتاب أو ملف دراسي للتعليم النظري';
  let reasonEn = 'Study reference, manual, or theoretical learning document';

  if (alreadySim && !alreadyEdu) {
    category = 'simulators';
    reasonAr = 'موجود مسبقاً ضمن مسار المحاكيات والتجارب العملية';
    reasonEn = 'Already located inside a Simulators / Labs path';
  } else if (alreadyEdu && !alreadySim) {
    category = 'education';
    reasonAr = 'موجود مسبقاً ضمن مسار التعليم والمناهج';
    reasonEn = 'Already located inside an Education / Learning path';
  } else if (SIMULATOR_KEYWORDS.test(haystack)) {
    category = 'simulators';
    reasonAr = 'يطابق كلمات المحاكاة أو الحاسبات أو المعامل التفاعلية';
    reasonEn = 'Matches simulator, interactive lab, calibration, or exposure calculator keywords';
  } else if (SIMULATOR_EXTENSIONS.test(item.name) || isGoogleSheet) {
    category = 'simulators';
    reasonAr = 'صيغة تفاعلية / حزمة برمجية / جدول حسابات ومعايرة';
    reasonEn = 'Interactive format, executable/3D bundle, or calculation worksheet';
  } else if (EDUCATION_KEYWORDS.test(haystack) || isGoogleSlidesOrDocs || item.mimeType === 'application/pdf') {
    category = 'education';
    reasonAr = 'مستند تعليمي أو كتاب أو مرجع أكواد/محاضرات';
    reasonEn = 'Educational PDF, textbook, slide deck, or standards guide';
  }

  return {
    ...item,
    category,
    discipline,
    suggestedTab: category === 'simulators' ? simTab : eduTab,
    reasonAr,
    reasonEn,
    alreadyInTargetFolder:
      (category === 'education' && path.includes(DRIVE_TARGET_FOLDERS.education.name)) ||
      (category === 'simulators' && path.includes(DRIVE_TARGET_FOLDERS.simulators.name)),
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildOrganizedCatalogMarkdown(
  items: ClassifiedDriveItem[],
  folderName: string,
  folderId: string,
  language: 'ar' | 'en'
): string {
  const edu = items.filter(i => i.category === 'education');
  const sim = items.filter(i => i.category === 'simulators');
  const isAr = language === 'ar';

  const formatRow = (item: ClassifiedDriveItem, idx: number) =>
    `${idx + 1}. **${item.name}** (${item.discipline}) — #${item.suggestedTab}`;

  return [
    isAr
      ? `# فهرس ترتيب مجلد Google Drive — ${folderName}`
      : `# Organized Google Drive Index — ${folderName}`,
    `Folder ID: \`${folderId}\` · Total: ${items.length}`,
    '',
    isAr ? `## 1. مسار التعليم والمناهج (${edu.length})` : `## 1. Education & Study Materials (${edu.length})`,
    ...(edu.length ? edu.map(formatRow) : [isAr ? '_لا توجد ملفات مصنفة هنا بعد._' : '_No files classified here yet._']),
    '',
    isAr ? `## 2. مسار المحاكيات والمعامل التفاعلية (${sim.length})` : `## 2. Simulators & Interactive Labs (${sim.length})`,
    ...(sim.length ? sim.map(formatRow) : [isAr ? '_لا توجد ملفات مصنفة هنا بعد._' : '_No files classified here yet._']),
    '',
  ].join('\n');
}
