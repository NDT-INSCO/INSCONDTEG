import type { AcademyTab } from '../academyTabs';
import {
  EDB_FORMAT,
  EDB_GENERATOR,
  EDB_VERSION,
  type EdbBlock,
  type EdbChapter,
  type EdbDocument,
  type EdbIndexEntry,
  type EdbPage,
} from '../edb/types';
import type { ClassifiedDriveItem } from './driveOrganizer';

export interface ExtractedDriveContent {
  text: string;
  htmlContent?: string;
  csvRows?: string[][];
  pages?: Array<{ pageNumber: number; text: string }>;
  extractionMethod: 'pdfjs' | 'google-export' | 'text' | 'csv' | 'html' | 'metadata-only';
  note?: string;
}

export interface SimulatorParam {
  key: string;
  labelAr: string;
  labelEn: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface SimulatorMetric {
  labelAr: string;
  labelEn: string;
  value: string;
  status?: 'normal' | 'warning' | 'pass';
}

export interface ImportedDriveSimulator {
  id: string;
  sourceFileId: string;
  name: string;
  titleAr: string;
  titleEn: string;
  discipline: string;
  targetLabTab: AcademyTab;
  mode: 'html-sandbox' | 'dataset-lab' | 'formula-workbench';
  summaryAr: string;
  summaryEn: string;
  standards: string[];
  formulas: string[];
  params: SimulatorParam[];
  datasetHeaders?: string[];
  datasetRows?: string[][];
  htmlContent?: string;
  webViewLink?: string;
  importedAt: string;
}

export interface ImportedVocationalBookEntry {
  book: EdbDocument;
  indexEntry: EdbIndexEntry;
  sourceFileId: string;
  discipline: string;
  suggestedLabTab: AcademyTab;
  webViewLink?: string;
  importedAt: string;
  extractionMethod: ExtractedDriveContent['extractionMethod'];
}

function sanitizeEdbId(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const base = `edb-drive-${clean || 'doc'}`;
  return base.slice(0, 78);
}

function cleanDisplayTitle(filename: string): string {
  return filename
    .replace(/\.[a-z0-9]{1,6}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || filename;
}

export function extractStandardsFromText(text: string): string[] {
  const found = new Set<string>();
  const patterns: Array<[RegExp, string]> = [
    [/ASME\s*(?:BPVC\s*)?Sec(?:tion)?\s*[VIX]+/gi, 'ASME Sec V'],
    [/ASME\s*Sec(?:tion)?\s*VIII/gi, 'ASME Sec VIII'],
    [/ASME\s*B31\.[13]/gi, 'ASME B31.3'],
    [/API\s*1104/gi, 'API 1104'],
    [/API\s*650/gi, 'API 650'],
    [/AWS\s*D1\.[15]/gi, 'AWS D1.1'],
    [/ISO\s*9712/gi, 'ISO 9712'],
    [/ISO\s*1763[67]/gi, 'ISO 17636'],
    [/SNT-?TC-?1A/gi, 'ASNT SNT-TC-1A'],
    [/ASTM\s*[EA]\d+/gi, 'ASTM'],
  ];
  for (const [rx, label] of patterns) {
    if (rx.test(text)) found.add(label);
  }
  return Array.from(found);
}

export function extractFormulasFromText(text: string): string[] {
  const formulas: string[] = [];
  const lines = text
    .split(/\r?\n|(?<=[.;])\s+/)
    .map(l => l.trim())
    .filter(l => l.length >= 5 && l.length <= 140);

  for (const line of lines) {
    if (/[=≈≤≥]/.test(line) && /[a-zA-Z0-9]/.test(line) && /[/*+\-^()√]|sin|cos|tan|log|exp|Ug|SFD|SOD|dB|Ci/i.test(line)) {
      if (!formulas.includes(line)) formulas.push(line);
      if (formulas.length >= 6) break;
    }
  }
  return formulas;
}

function splitTextIntoReadableChunks(text: string, maxChars = 950): string[] {
  const normalized = text.replace(/\r/g, '').replace(/\t+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      for (let i = 0; i < para.length; i += maxChars) {
        chunks.push(para.slice(i, i + maxChars).trim());
      }
      continue;
    }
    if ((current.length + para.length + 2) > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.slice(0, 24);
}

function isMostlyArabic(text: string): boolean {
  const arMatches = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const enMatches = text.match(/[a-zA-Z]/g)?.length ?? 0;
  return arMatches >= enMatches;
}

function bilingualBodyPair(snippet: string, discipline: string): { ar: string; en: string } {
  if (isMostlyArabic(snippet)) {
    return {
      ar: snippet,
      en: `[${discipline} Vocational Extract] ${snippet}`,
    };
  }
  return {
    ar: `[مقتطف تعليم مهني — ${discipline}] ${snippet}`,
    en: snippet,
  };
}

function vocationalQuizForDiscipline(discipline: string, idPrefix: string): EdbBlock {
  switch (discipline) {
    case 'RT':
      return {
        type: 'quiz',
        id: `${idPrefix}-q1`,
        question: {
          ar: 'عند التحضير لتنفيذ لقطة تصوير إشعاعي (RT) وفق متطلبات ASME Sec V، ما العامل الأساسي لضبط عدم الوضوح الهندسي (Ug) ضمن الحدود؟',
          en: 'When preparing a radiographic shot under ASME Sec V, which parameter primarily controls geometric unsharpness (Ug)?',
        },
        options: [
          { ar: 'نسبة البؤرة والمسافة من الجسم للفيلم (SOD و OFD)', en: 'Focal spot size, source-to-object distance (SOD), and object-to-film distance (OFD)' },
          { ar: 'لون غلاف الكاسيت فقط', en: 'Cassette cover color only' },
          { ar: 'درجة حرارة غرفة التحميض فقط', en: 'Darkroom temperature only' },
        ],
        answer: 0,
        explanation: {
          ar: 'تُحسب Ug بالمعادلة Ug = (F × d) / D، لذا تقليل المسافة بين الجسم والفيلم وزيادة مسافة المصدر يحسّنان حدة الصورة.',
          en: 'Ug = (F × d) / D; minimizing object-to-film distance (d) and maximizing source-to-object distance (D) keep geometric unsharpness within code limits.',
        },
      };
    case 'UT':
    case 'PAUT / TOFD':
      return {
        type: 'quiz',
        id: `${idPrefix}-q1`,
        question: {
          ar: 'لماذا تُجرى المعايرة على كتلة V1/V2 أو DAC قبل البدء بفحص لحام بالموجات فوق الصوتية؟',
          en: 'Why must V1/V2 or DAC calibration be performed before scanning a production weld with UT?',
        },
        options: [
          { ar: 'لتثبيت صفر المسبار ومعايرة المدى والكسب المرجعي لتعويض التوهين', en: 'To set probe zero/angle/range and compensate for beam spread & attenuation' },
          { ar: 'لتسخين عينة اللحام قبل الفحص', en: 'To preheat the weld specimen before scanning' },
          { ar: 'لإلغاء الحاجة إلى مادة الاقتران (Couplant)', en: 'To eliminate the need for acoustic couplant' },
        ],
        answer: 0,
        explanation: {
          ar: 'المعايرة المرجعية تضمن دقة حساب العمق ومسار الحزمة وتقييم سعة العيوب مقارنة بالعاكس القياسي.',
          en: 'Reference calibration establishes accurate beam path/depth localization and amplitude sizing against a known reflector.',
        },
      };
    case 'PWHT':
      return {
        type: 'quiz',
        id: `${idPrefix}-q1`,
        question: {
          ar: 'في المعالجة الحرارية بعد اللحام (PWHT)، ما أهمية التحكم في معدلات التسخين والتبريد؟',
          en: 'In Post-Weld Heat Treatment (PWHT), why are heating and cooling ramp rates strictly controlled?',
        },
        options: [
          { ar: 'لمنع الإجهادات الحرارية والتشوه وتكوّن الشروخ أثناء الانتقال الحراري', en: 'To prevent thermal gradients, distortion, and cracking during thermal ramps' },
          { ar: 'لزيادة سرعة تآكل الوصلة', en: 'To accelerate corrosion of the weldment' },
          { ar: 'لتقليل سمك المعدن الأساسي', en: 'To reduce base metal wall thickness' },
        ],
        answer: 0,
        explanation: {
          ar: 'تُقيّد الأكواد مثل ASME Sec VIII و B31.3 معدلات التسخين والتبريد لضمان تجانس تخفيف الإجهادات المتبقية.',
          en: 'Codes like ASME Sec VIII and B31.3 cap ramp rates so residual stresses relax uniformly without thermal shock.',
        },
      };
    default:
      return {
        type: 'quiz',
        id: `${idPrefix}-q1`,
        question: {
          ar: 'ما الخطوة المهنية الأولى قبل تطبيق أي إجراء فحص لا إتلافي (NDT) في الموقع؟',
          en: 'What is the mandatory first vocational step before executing any NDT inspection on site?',
        },
        options: [
          { ar: 'مراجعة الإجراء المعتمد والمعايرة وحدود القبول وفق الكود المرجعي وتأمين السلامة', en: 'Verify the approved procedure, calibration, acceptance criteria, and site safety controls' },
          { ar: 'كتابة التقرير النهائي قبل الفحص', en: 'Draft the final acceptance report prior to testing' },
          { ar: 'تجاهل حالة السطح والمعايرة', en: 'Skip surface preparation and calibration verification' },
        ],
        answer: 0,
        explanation: {
          ar: 'التطبيق المهني السليم يبدأ بالتحقق من الإجراء المكتوب والمعايرة واشتراطات السلامة والكود الحاكم.',
          en: 'Professional field execution always begins by verifying the written procedure, valid calibration, safety barriers, and governing standard.',
        },
      };
  }
}

export function buildVocationalEdbBook(
  item: ClassifiedDriveItem,
  extracted: ExtractedDriveContent
): EdbDocument {
  const now = new Date().toISOString();
  const displayTitle = cleanDisplayTitle(item.name);
  const edbId = sanitizeEdbId(item.id);
  const detectedStandards = extractStandardsFromText(`${item.name}\n${extracted.text}`);
  const standards = detectedStandards.length > 0 ? detectedStandards : ['ASME Sec V', 'ISO 9712'];
  const formulas = extractFormulasFromText(extracted.text);

  const pageTexts: Array<{ titleAr: string; titleEn: string; body: string }> = [];
  if (extracted.pages && extracted.pages.length > 0) {
    extracted.pages
      .filter(p => p.text.trim().length > 0)
      .slice(0, 20)
      .forEach(p => {
        pageTexts.push({
          titleAr: `صفحة ${p.pageNumber} — محتوى مهني`,
          titleEn: `Page ${p.pageNumber} — Vocational Content`,
          body: p.text.trim().slice(0, 1800),
        });
      });
  }

  if (pageTexts.length === 0) {
    const chunks = splitTextIntoReadableChunks(extracted.text);
    chunks.forEach((chunk, idx) => {
      pageTexts.push({
        titleAr: `الوحدة التطبيقية ${idx + 1}`,
        titleEn: `Vocational Unit ${idx + 1}`,
        body: chunk,
      });
    });
  }

  if (pageTexts.length === 0) {
    pageTexts.push({
      titleAr: 'مرجع مهني مدمج داخل منصة إنسكو',
      titleEn: 'Integrated Vocational Module inside INSCO Platform',
      body: extracted.note
        || `تم دمج هذا المرجع (${item.name}) في تخصص ${item.discipline} داخل منصة إنسكو للتعليم المهني والربط المباشر بالمعامل التفاعلية.`,
    });
  }

  const chapterOverviewId = 'ch-vocational-intro';
  const chapterUnitsId = 'ch-vocational-units';
  const chapterAssessId = 'ch-vocational-assess';

  const pages: EdbPage[] = [];

  // Page 1: Vocational Cover & Lab Bridge
  const coverBlocks: EdbBlock[] = [
    {
      type: 'heading',
      level: 1,
      text: {
        ar: `التعليم المهني التطبيقي: ${displayTitle}`,
        en: `Vocational Engineering Module: ${displayTitle}`,
      },
    },
    {
      type: 'callout',
      tone: 'info',
      title: { ar: 'مسار التعليم المهني — مستورد من Google Drive', en: 'Vocational Education Track — Imported from Drive' },
      text: {
        ar: `التخصص الفني: ${item.discipline} • المعايير المرتبطة: ${standards.join(' / ')} • طريقة الاستخلاص: ${extracted.extractionMethod}.`,
        en: `Technical discipline: ${item.discipline} • Governing standards: ${standards.join(' / ')} • Extraction method: ${extracted.extractionMethod}.`,
      },
    },
    {
      type: 'experiment',
      experimentId: item.suggestedTab,
      label: {
        ar: `تشغيل المحاكي التفاعلي المرتبط (${item.suggestedTab})`,
        en: `Launch linked interactive simulator (${item.suggestedTab})`,
      },
    },
  ];

  if (formulas.length > 0) {
    coverBlocks.push({
      type: 'formula',
      expression: formulas[0],
      caption: {
        ar: 'معادلة أو علاقة هندسية مستخلصة من المرجع',
        en: 'Engineering relation extracted from the source document',
      },
    });
  }

  coverBlocks.push({
    type: 'callout',
    tone: 'success',
    title: { ar: 'محتوى مدمج بالكامل داخل المنصة', en: 'Hosted Inside INSCO Platform' },
    text: {
      ar: `تم استيعاب وتصنيف وحدة «${displayTitle}» بالكامل داخل منصة إنسكو للعمل أونلاين دون تحويلك إلى أي منصات خارجية.`,
      en: `Module "${displayTitle}" is integrated natively inside INSCO Academy with full flipbook study, quizzes, and simulator links.`,
    },
  });

  const coverPageId = 'page-cover';
  pages.push({
    id: coverPageId,
    number: 1,
    chapterId: chapterOverviewId,
    kind: 'cover',
    title: { ar: displayTitle, en: displayTitle },
    blocks: coverBlocks,
    estimatedMinutes: 5,
  });

  const unitPageIds: string[] = [];
  pageTexts.forEach((unit, idx) => {
    const pid = `page-unit-${idx + 1}`;
    unitPageIds.push(pid);
    const blocks: EdbBlock[] = [
      {
        type: 'heading',
        level: 2,
        text: { ar: unit.titleAr, en: unit.titleEn },
      },
      {
        type: 'paragraph',
        text: bilingualBodyPair(unit.body, item.discipline),
      },
    ];
    if (idx === 0 && formulas.length > 1) {
      blocks.push({
        type: 'formula',
        expression: formulas[1],
        caption: { ar: 'معادلة تطبيقية من النص', en: 'Applied formula from document' },
      });
    }
    pages.push({
      id: pid,
      number: pages.length + 1,
      chapterId: chapterUnitsId,
      kind: 'content',
      title: { ar: unit.titleAr, en: unit.titleEn },
      blocks,
      estimatedMinutes: 6,
    });
  });

  const assessPageId = 'page-assessment';
  const assessBlocks: EdbBlock[] = [
    {
      type: 'heading',
      level: 2,
      text: { ar: 'تحقق الكفاءة المهنية والتطبيق العملي', en: 'Vocational Competency & Practical Check' },
    },
    vocationalQuizForDiscipline(item.discipline, edbId),
    {
      type: 'callout',
      tone: 'warning',
      title: { ar: 'ملاحظة التأهيل المهني', en: 'Vocational Qualification Note' },
      text: {
        ar: 'هذه الوحدة للتعليم المهني التطبيقي والتدريب الذاتي داخل أكاديمية إنسكو، ولا تُعد بديلاً عن شهادة الاعتماد الرسمية أو الإجراء الهندسي المعتمد للمشروع.',
        en: 'This module supports vocational self-study and practical training inside INSCO Academy and does not replace official certification or approved project procedures.',
      },
    },
  ];
  pages.push({
    id: assessPageId,
    number: pages.length + 1,
    chapterId: chapterAssessId,
    kind: 'assessment',
    title: { ar: 'تقييم التطبيق المهني', en: 'Vocational Assessment' },
    blocks: assessBlocks,
    estimatedMinutes: 5,
  });

  const chapters: EdbChapter[] = [
    { id: chapterOverviewId, title: { ar: 'بطاقة الوحدة المهنية', en: 'Vocational Brief' }, pageIds: [coverPageId] },
    { id: chapterUnitsId, title: { ar: 'المحتوى العلمي والتطبيقي', en: 'Vocational Content' }, pageIds: unitPageIds },
    { id: chapterAssessId, title: { ar: 'التحقق المهني والربط بالمعمل', en: 'Competency Check' }, pageIds: [assessPageId] },
  ];

  const totalMinutes = Math.max(15, pages.length * 6);

  return {
    format: EDB_FORMAT,
    version: EDB_VERSION,
    id: edbId,
    metadata: {
      title: {
        ar: `${displayTitle} (تعليم مهني)`,
        en: `${displayTitle} (Vocational Education)`,
      },
      subtitle: {
        ar: `مادة تعليم مهني مستخلصة من Google Drive • ${item.discipline}`,
        en: `Vocational learning module extracted from Google Drive • ${item.discipline}`,
      },
      author: {
        ar: 'أكاديمية إنسكو — مستورد من مكتبة المدرسة',
        en: 'INSCO Academy — Imported from Drive School Library',
      },
      publisher: 'INSCO NDT Academy',
      edition: 'Drive Vocational v1.0',
      createdAt: now,
      updatedAt: now,
      languages: ['ar', 'en'],
      readingDirection: 'auto',
      estimatedMinutes: totalMinutes,
      keywords: [
        { ar: item.discipline, en: item.discipline },
        { ar: 'تعليم مهني', en: 'Vocational Education' },
      ],
      rights: {
        holder: 'INSCO NDT Library',
        license: 'Educational Reference',
        notice: {
          ar: 'مستخلص تعليمي للتدريب المهني داخل أكاديمية إنسكو من مجلد Google Drive المرتبط.',
          en: 'Vocational educational extract prepared inside INSCO Academy from the linked Google Drive folder.',
        },
      },
      standards,
      relatedDiscipline: item.discipline,
      relatedLevel: 'Vocational',
    },
    theme: {
      accent: '#f59e0b',
      accentSoft: '#fef3c7',
      ink: '#0f172a',
      paper: '#fffdf7',
      label: { ar: 'تعليم مهني', en: 'VOCATIONAL ED' },
    },
    chapters,
    pages,
    generator: EDB_GENERATOR,
  };
}

export function buildEdbIndexEntryFromVocationalBook(book: EdbDocument): EdbIndexEntry {
  return {
    id: book.id,
    file: `${book.id}.edb`,
    kind: 'course',
    title: book.metadata.title,
    subtitle: book.metadata.subtitle,
    discipline: book.metadata.relatedDiscipline || 'General NDT',
    pages: book.pages.length,
    estimatedMinutes: book.metadata.estimatedMinutes,
    accent: book.theme.accent,
    edition: book.metadata.edition,
    standards: book.metadata.standards || [],
    checksum: 'drive-import',
    bytes: JSON.stringify(book).length,
  };
}

function defaultParamsForDiscipline(discipline: string, sourceText: string): SimulatorParam[] {
  const numMatches = Array.from(sourceText.matchAll(/\b(\d{1,4}(?:\.\d{1,2})?)\s*(mm|ci|kv|kev|mev|mhz|deg|°|°c|min|hr)\b/gi));
  const hintVal = (unitPattern: RegExp, fallback: number, min: number, max: number) => {
    const found = numMatches.find(m => unitPattern.test(m[2]));
    const parsed = found ? Number(found[1]) : fallback;
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  };

  if (discipline === 'RT') {
    return [
      { key: 'thicknessMm', labelAr: 'سمك المعدن (mm)', labelEn: 'Wall Thickness (mm)', unit: 'mm', min: 4, max: 120, step: 1, defaultValue: hintVal(/mm/i, 16, 4, 120) },
      { key: 'sfdMm', labelAr: 'المسافة البؤرية للفيلم SFD (mm)', labelEn: 'Source-to-Film Distance SFD (mm)', unit: 'mm', min: 250, max: 1500, step: 10, defaultValue: 700 },
      { key: 'activityCi', labelAr: 'شدة المصدر (Ci)', labelEn: 'Source Activity (Ci)', unit: 'Ci', min: 5, max: 120, step: 1, defaultValue: hintVal(/ci/i, 35, 5, 120) },
      { key: 'focalSpotMm', labelAr: 'حجم البؤرة (mm)', labelEn: 'Focal Spot Size (mm)', unit: 'mm', min: 0.5, max: 5, step: 0.1, defaultValue: 2.5 },
    ];
  }

  if (discipline === 'UT' || discipline === 'PAUT / TOFD') {
    return [
      { key: 'thicknessMm', labelAr: 'سمك اللوح / اللحام (mm)', labelEn: 'Specimen Thickness (mm)', unit: 'mm', min: 6, max: 150, step: 1, defaultValue: hintVal(/mm/i, 25, 6, 150) },
      { key: 'angleDeg', labelAr: 'زاوية المسبار (°)', labelEn: 'Probe Angle (°)', unit: '°', min: 35, max: 75, step: 5, defaultValue: 60 },
      { key: 'velocityMs', labelAr: 'سرعة الموجة القصية (m/s)', labelEn: 'Shear Wave Velocity (m/s)', unit: 'm/s', min: 2800, max: 6200, step: 10, defaultValue: 3250 },
      { key: 'frequencyMhz', labelAr: 'تردد المسبار (MHz)', labelEn: 'Probe Frequency (MHz)', unit: 'MHz', min: 1, max: 10, step: 0.5, defaultValue: hintVal(/mhz/i, 4, 1, 10) },
    ];
  }

  if (discipline === 'PWHT') {
    return [
      { key: 'thicknessMm', labelAr: 'سمك الوصلة (mm)', labelEn: 'Weld Thickness (mm)', unit: 'mm', min: 10, max: 150, step: 1, defaultValue: hintVal(/mm/i, 32, 10, 150) },
      { key: 'holdTempC', labelAr: 'درجة حرارة التثبيت (°C)', labelEn: 'Soak Temperature (°C)', unit: '°C', min: 520, max: 760, step: 5, defaultValue: hintVal(/°?c/i, 620, 520, 760) },
      { key: 'heatingRateCPerHr', labelAr: 'معدل التسخين (°C/hr)', labelEn: 'Heating Rate (°C/hr)', unit: '°C/hr', min: 30, max: 220, step: 5, defaultValue: 140 },
    ];
  }

  return [
    { key: 'thicknessMm', labelAr: 'المعامل الهندسي / السمك (mm)', labelEn: 'Inspection Parameter / Thickness (mm)', unit: 'mm', min: 5, max: 100, step: 1, defaultValue: hintVal(/mm/i, 20, 5, 100) },
    { key: 'intensity', labelAr: 'شدة الفحص / المعامل (%)', labelEn: 'Inspection Intensity / Factor (%)', unit: '%', min: 10, max: 100, step: 5, defaultValue: 75 },
  ];
}

export function computeDriveSimulatorMetrics(
  sim: ImportedDriveSimulator,
  values: Record<string, number>
): SimulatorMetric[] {
  const get = (key: string, fallback: number) =>
    Number.isFinite(values[key]) ? values[key] : fallback;

  if (sim.discipline === 'RT') {
    const t = get('thicknessMm', 16);
    const sfd = Math.max(100, get('sfdMm', 700));
    const ci = Math.max(1, get('activityCi', 35));
    const focal = get('focalSpotMm', 2.5);
    const sod = Math.max(50, sfd - t);
    const ug = (focal * t) / sod;
    const hvl = 12.7; // approx Ir-192 in steel (mm)
    const expFactor = Math.pow(2, t / hvl);
    const exposureMin = (0.04 * expFactor * Math.pow(sfd / 500, 2)) / (ci / 30);
    return [
      {
        labelAr: 'عدم الوضوح الهندسي Ug',
        labelEn: 'Geometric Unsharpness Ug',
        value: `${ug.toFixed(3)} mm`,
        status: ug <= 0.51 ? 'pass' : 'warning',
      },
      {
        labelAr: 'زمن التعريض التقديري (Ir-192)',
        labelEn: 'Estimated Exposure Time',
        value: `${exposureMin.toFixed(2)} min`,
        status: 'normal',
      },
      {
        labelAr: 'مسافة المصدر للجسم SOD',
        labelEn: 'Source-to-Object Distance',
        value: `${sod.toFixed(0)} mm`,
        status: 'normal',
      },
    ];
  }

  if (sim.discipline === 'UT' || sim.discipline === 'PAUT / TOFD') {
    const t = get('thicknessMm', 25);
    const deg = get('angleDeg', 60);
    const v = get('velocityMs', 3250);
    const freq = get('frequencyMhz', 4);
    const rad = (deg * Math.PI) / 180;
    const halfSkip = t * Math.tan(rad);
    const fullSkip = halfSkip * 2;
    const beamPathHalf = t / Math.max(0.1, Math.cos(rad));
    const wavelengthMm = v / (freq * 1000);
    return [
      {
        labelAr: 'مسافة نصف القفزة (Half-Skip)',
        labelEn: 'Half-Skip Surface Distance',
        value: `${halfSkip.toFixed(1)} mm (Full: ${fullSkip.toFixed(1)} mm)`,
        status: 'pass',
      },
      {
        labelAr: 'طول مسار الحزمة (Beam Path)',
        labelEn: '1st Leg Beam Path',
        value: `${beamPathHalf.toFixed(1)} mm`,
        status: 'normal',
      },
      {
        labelAr: 'الطول الموجي λ',
        labelEn: 'Wavelength λ',
        value: `${wavelengthMm.toFixed(2)} mm`,
        status: wavelengthMm <= 1.2 ? 'pass' : 'warning',
      },
    ];
  }

  if (sim.discipline === 'PWHT') {
    const t = get('thicknessMm', 32);
    const hold = get('holdTempC', 620);
    const rate = Math.max(20, get('heatingRateCPerHr', 140));
    const maxAllowedRate = Math.min(220, Math.round((5500 / Math.max(25, t))));
    const soakMinutes = Math.max(60, Math.round((t / 25.4) * 60));
    const rampHours = (hold - 315) / rate;
    return [
      {
        labelAr: 'زمن التثبيت الموصى به (Soak)',
        labelEn: 'Recommended Soak Time',
        value: `${soakMinutes} min`,
        status: 'normal',
      },
      {
        labelAr: 'أقصى معدل تسخين مسموح (ASME)',
        labelEn: 'ASME Max Ramp Rate',
        value: `${maxAllowedRate} °C/hr`,
        status: rate <= maxAllowedRate ? 'pass' : 'warning',
      },
      {
        labelAr: 'مدة الصعود الحراري',
        labelEn: 'Heating Ramp Duration',
        value: `${rampHours.toFixed(2)} hr`,
        status: 'normal',
      },
    ];
  }

  const thickness = get('thicknessMm', 20);
  const intensity = get('intensity', 75);
  return [
    {
      labelAr: 'معامل التغطية الهندسية',
      labelEn: 'Geometric Coverage Index',
      value: `${((intensity / 100) * thickness).toFixed(1)} mm eq.`,
      status: intensity >= 60 ? 'pass' : 'warning',
    },
    {
      labelAr: 'حالة التحقق المهني',
      labelEn: 'Vocational Readiness',
      value: intensity >= 60 ? (sim.discipline + ' OK') : 'Adjust ≥ 60%',
      status: intensity >= 60 ? 'pass' : 'warning',
    },
  ];
}

export function buildImportedSimulatorLab(
  item: ClassifiedDriveItem,
  extracted: ExtractedDriveContent
): ImportedDriveSimulator {
  const displayTitle = cleanDisplayTitle(item.name);
  const id = `sim-drive-${item.id.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 56)}`;
  const standards = extractStandardsFromText(`${item.name}\n${extracted.text}`);
  const formulas = extractFormulasFromText(extracted.text);
  const params = defaultParamsForDiscipline(item.discipline, extracted.text);

  const hasCsv = Boolean(extracted.csvRows && extracted.csvRows.length >= 2);
  const hasHtml = Boolean(extracted.htmlContent && extracted.htmlContent.trim().length > 20);

  const mode: ImportedDriveSimulator['mode'] = hasHtml
    ? 'html-sandbox'
    : hasCsv
    ? 'dataset-lab'
    : 'formula-workbench';

  return {
    id,
    sourceFileId: item.id,
    name: item.name,
    titleAr: `محاكي: ${displayTitle}`,
    titleEn: `Simulator: ${displayTitle}`,
    discipline: item.discipline,
    targetLabTab: item.suggestedTab,
    mode,
    summaryAr: hasHtml
      ? 'محاكي تفاعلي مستورد مباشرة من Drive مع تشغيل معزول وآمن وربط بمعامل إنسكو.'
      : hasCsv
      ? 'محاكي جداول وبيانات معايرة مستورد من Drive لتجربة السيناريوهات وتغيير المعاملات حياً.'
      : 'معمل حسابات ومحاكاة فيزيائية مستخلص من ملف المحاكي/التجربة في Drive ومربوط بالمعامل التفاعلية.',
    summaryEn: hasHtml
      ? 'Interactive HTML simulation imported from Drive with sandboxed runner & INSCO lab bridge.'
      : hasCsv
      ? 'Tabular calibration & scenario dataset imported from Drive with live parameter workbench.'
      : 'Physics & engineering parameter simulator built from the Drive lab resource and linked to INSCO 3D/AR labs.',
    standards: standards.length ? standards : ['ASME Sec V'],
    formulas,
    params,
    datasetHeaders: hasCsv ? extracted.csvRows![0].slice(0, 8) : undefined,
    datasetRows: hasCsv ? extracted.csvRows!.slice(1, 30).map(r => r.slice(0, 8)) : undefined,
    htmlContent: hasHtml ? extracted.htmlContent!.slice(0, 250_000) : undefined,
    webViewLink: item.webViewLink,
    importedAt: new Date().toISOString(),
  };
}
