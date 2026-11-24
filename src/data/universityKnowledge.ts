/**
 * الأرشفة العلمية والخلايا العصبية — pure, deterministic logic of the Robotic
 * University. No I/O here: the browser, the Express gateway and the tests all
 * import these functions. The internet collectors need an AI gateway; this
 * module works identically offline, which is what makes the university
 * auditable and testable.
 *
 * Three organs live here:
 *   «المُنظِّم»  organizeKnowledgeRecords — the Organising & Structuring robot:
 *               assigns archive codes, verifies citations, detects duplicates,
 *               computes the completeness score and catalogue statistics.
 *   «الخلية»     mergeKnowledgeRecords  — what a neural cell does to a batch:
 *               merge duplicates, union knowledge, bump versions, flag for
 *               re-review. Content changes ⇒ status drops to pending-review.
 *   «المعمل»    buildLabTeachingPack   — The Lab: turns reviewed archive
 *               knowledge into a teaching pack for a platform AI agent.
 */
import { departmentById, PLATFORM_AGENT_TARGETS, type PlatformAgentTargetId } from './university.js';
import {
  SEED_KNOWLEDGE,
  REVIEWED_SEED,
  type KnowledgeRecord,
  type KnowledgeStatus,
  type UniversitySource,
} from './universitySeed.js';

export {
  SEED_KNOWLEDGE,
  REVIEWED_SEED,
  type KnowledgeRecord,
  type KnowledgeStatus,
  type UniversitySource,
};

/* ------------------------------ validation -------------------------------- */

const HTTPS_URL = /^https:\/\/[^\s/$.?#].[^\s]*$/i;

export function isHttpsUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 500 && HTTPS_URL.test(value.trim());
}

export function normaliseUniversitySource(raw: unknown): UniversitySource | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const title = typeof candidate.title === 'string' ? candidate.title.trim().slice(0, 240) : '';
  const publisher = typeof candidate.publisher === 'string' ? candidate.publisher.trim().slice(0, 160) : '';
  const url = typeof candidate.url === 'string' ? candidate.url.trim() : '';
  if (!title || !publisher || !isHttpsUrl(url)) return null;
  return { title, publisher, url };
}

function cleanText(value: unknown, max = 1200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanList(value: unknown, maxItems = 12, maxLen = 600): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const text = cleanText(item, maxLen);
    if (text && !seen.has(text)) {
      seen.add(text);
      out.push(text);
      if (out.length >= maxItems) break;
    }
  }
  return out;
}

export const UNIVERSITY_RECORD_LIMITS = {
  maxRecordsPerResponse: 8,
  maxTitle: 240,
  maxSummary: 1500,
  maxKeyPoints: 12,
  maxSourcesPerRecord: 6,
} as const;

const CODE_PATTERN = /^INSCO-IND-[A-Z]{2,4}-\d{3}$/;

/**
 * Normalise one raw record (e.g. model output from a collector) into a safe,
 * honest KnowledgeRecord. Anything that cannot stand alone is rejected with
 * `null`. Collected records are never born `reviewed`.
 */
export function normaliseKnowledgeRecord(
  raw: unknown,
  options: { departmentId: string; collectedBy: string; nowIso?: string; sequence?: number }
): KnowledgeRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const department = departmentById(options.departmentId);
  if (!department) return null;
  const input = raw as Record<string, unknown>;

  const titleAr = cleanText(input.titleAr ?? input.title, UNIVERSITY_RECORD_LIMITS.maxTitle);
  const summaryAr = cleanText(input.summaryAr ?? input.summary, UNIVERSITY_RECORD_LIMITS.maxSummary);
  if (!titleAr || !summaryAr) return null;

  const keyPointsAr = cleanList(input.keyPointsAr ?? input.keyPoints, UNIVERSITY_RECORD_LIMITS.maxKeyPoints);
  if (keyPointsAr.length < 2) return null;

  const sourcesRaw = Array.isArray(input.sources) ? input.sources : [];
  const sources = sourcesRaw
    .map(normaliseUniversitySource)
    .filter((source): source is UniversitySource => source !== null)
    .slice(0, UNIVERSITY_RECORD_LIMITS.maxSourcesPerRecord);
  if (sources.length === 0) return null; // no documented source ⇒ no record, ever

  const now = options.nowIso ?? new Date().toISOString();
  const titleEn = cleanText(input.titleEn, UNIVERSITY_RECORD_LIMITS.maxTitle) || titleAr;
  const summaryEn = cleanText(input.summaryEn, UNIVERSITY_RECORD_LIMITS.maxSummary) || summaryAr;
  const keyPointsEn = cleanList(input.keyPointsEn, UNIVERSITY_RECORD_LIMITS.maxKeyPoints);

  return {
    id: `kb-${department.code.toLowerCase()}-live-${now.replace(/[^0-9]/g, '').slice(0, 14)}-${options.sequence ?? 0}`,
    departmentId: department.id,
    code: `INSCO-IND-${department.code}-NEW`,
    titleAr,
    titleEn,
    summaryAr,
    summaryEn,
    keyPointsAr,
    keyPointsEn: keyPointsEn.length ? keyPointsEn : keyPointsAr,
    formula: cleanText(input.formula, 300) || undefined,
    sources,
    status: 'pending-review',
    version: 1,
    collectedBy: options.collectedBy,
    evolvedBy: [],
    updatedAt: now,
  };
}

/* ----------------------------- completeness ------------------------------- */

export function recordCompleteness(record: KnowledgeRecord): number {
  const checks: boolean[] = [
    Boolean(record.titleAr.trim() && record.titleEn.trim()),
    Boolean(record.summaryAr.trim() && record.summaryEn.trim()),
    record.keyPointsAr.length >= 3,
    record.sources.length >= 1,
    record.sources.every(source => isHttpsUrl(source.url) && source.title.trim() && source.publisher.trim()),
    CODE_PATTERN.test(record.code) && record.version >= 1,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export interface DepartmentStat {
  departmentId: string;
  code: string;
  ar: string;
  total: number;
  reviewed: number;
  pendingReview: number;
  avgCompleteness: number;
}

export interface KnowledgeStats {
  total: number;
  reviewed: number;
  pendingReview: number;
  avgCompleteness: number;
  validHttpsSources: number;
  byDepartment: DepartmentStat[];
}

export function knowledgeStats(records: readonly KnowledgeRecord[]): KnowledgeStats {
  const byDepartment = new Map<string, DepartmentStat>();
  for (const record of records) {
    const department = departmentById(record.departmentId);
    if (!department) continue;
    const entry =
      byDepartment.get(record.departmentId) ??
      { departmentId: department.id, code: department.code, ar: department.ar, total: 0, reviewed: 0, pendingReview: 0, avgCompleteness: 0 };
    entry.total += 1;
    if (record.status === 'reviewed') entry.reviewed += 1;
    else entry.pendingReview += 1;
    entry.avgCompleteness += recordCompleteness(record);
    byDepartment.set(record.departmentId, entry);
  }
  const departments = [...byDepartment.values()]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(entry => ({
      ...entry,
      avgCompleteness: entry.total ? Math.round(entry.avgCompleteness / entry.total) : 0,
    }));
  let reviewed = 0;
  let completenessSum = 0;
  let validHttpsSources = 0;
  for (const record of records) {
    if (record.status === 'reviewed') reviewed += 1;
    completenessSum += recordCompleteness(record);
    validHttpsSources += record.sources.filter(source => isHttpsUrl(source.url)).length;
  }
  const total = records.length;
  return {
    total,
    reviewed,
    pendingReview: total - reviewed,
    avgCompleteness: total ? Math.round(completenessSum / total) : 0,
    validHttpsSources,
    byDepartment: departments,
  };
}

/* ------------------- «المُنظِّم» — organisation & archiving ---------------- */

export interface OrganizeAction {
  kind: 'code-assigned' | 'citations-invalid' | 'duplicate-flagged' | 'status-held' | 'clean';
  recordId: string;
  detailAr: string;
  detailEn: string;
}

export interface OrganizeResult {
  records: KnowledgeRecord[];
  actions: OrganizeAction[];
  stats: KnowledgeStats;
  /** How many records kept their archive code, how many were re-assigned. */
  codesAssigned: number;
  codesKept: number;
}

function normaliseTitleKey(record: KnowledgeRecord): string {
  return (record.titleEn || record.titleAr)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

export function organizeKnowledgeRecords(
  records: readonly KnowledgeRecord[]
): OrganizeResult {
  const actions: OrganizeAction[] = [];
  const dedupedByKey = new Map<string, string>(); // titleKey -> first record id

  // Stable ordering: department, then existing code, then title.
  const sorted = [...records].sort(
    (a, b) =>
      a.departmentId.localeCompare(b.departmentId) ||
      a.code.localeCompare(b.code) ||
      a.titleEn.localeCompare(b.titleEn)
  );

  // First pass: scrub citations and detect duplicates (flags pending review).
  const scrubbed: KnowledgeRecord[] = sorted.map(original => {
    const record = { ...original, sources: [...original.sources], keyPointsAr: [...original.keyPointsAr] };
    const validSources = record.sources.filter(source => normaliseUniversitySource(source) !== null);
    if (validSources.length !== record.sources.length) {
      actions.push({
        kind: 'citations-invalid',
        recordId: record.id,
        detailAr: `أُسقطت ${record.sources.length - validSources.length} استشهادات غير صالحة (ليست HTTPS أو بلا ناشر).`,
        detailEn: `Dropped ${record.sources.length - validSources.length} invalid citations (not HTTPS or missing publisher).`,
      });
      record.sources = validSources;
    }
    if (record.sources.length === 0 && record.status === 'reviewed') {
      record.status = 'pending-review';
      actions.push({
        kind: 'status-held',
        recordId: record.id,
        detailAr: 'سجل بلا مصدر موثق: يُحظر إبقاؤه معتمدًا — أُعيد إلى «قيد المراجعة».',
        detailEn: 'Record with zero documented sources cannot stay approved — moved back to «pending review».',
      });
    }
    const key = `${record.departmentId}::${normaliseTitleKey(record)}`;
    const first = dedupedByKey.get(key);
    if (first) {
      record.status = 'pending-review';
      actions.push({
        kind: 'duplicate-flagged',
        recordId: record.id,
        detailAr: `تكرار محتمل لسجل سابق (${first}) — وُسم للدمج في الخلية العصبية.`,
        detailEn: `Possible duplicate of an earlier record (${first}) — flagged for the neural cell to merge.`,
      });
    } else {
      dedupedByKey.set(key, record.id);
    }
    return record;
  });

  // Second pass: assign deterministic archive codes per department.
  let codesAssigned = 0;
  let codesKept = 0;
  const counters = new Map<string, number>();
  const coded = scrubbed.map(record => {
    const department = departmentById(record.departmentId);
    if (!department) return record;
    const seq = (counters.get(department.id) ?? 0) + 1;
    counters.set(department.id, seq);
    const wanted = `INSCO-IND-${department.code}-${String(seq).padStart(3, '0')}`;
    if (record.code === wanted) {
      codesKept += 1;
      return record;
    }
    codesAssigned += 1;
    actions.push({
      kind: 'code-assigned',
      recordId: record.id,
      detailAr: `كُلف كود أرشفة ${wanted}.`,
      detailEn: `Assigned archive code ${wanted}.`,
    });
    return { ...record, code: wanted };
  });

  if (actions.length === 0) {
    actions.push({
      kind: 'clean',
      recordId: '-',
      detailAr: 'الفحص سليم: كل السجلات تحمل أكوادًا واستشهادات صالحة، ولا تكرار مكتشف.',
      detailEn: 'Audit passed: every record carries valid codes and citations, no duplicates found.',
    });
  }

  const stats = knowledgeStats(coded);
  return { records: coded, actions, stats, codesAssigned, codesKept };
}

/* --------------------- «الخلية» — neural cell processing ------------------- */

export interface MergeChange {
  recordId: string;
  kind: 'merged' | 'held-for-review' | 'untouched';
  detailAr: string;
  detailEn: string;
}

export interface MergeResult {
  records: KnowledgeRecord[];
  changes: MergeChange[];
  mergedCount: number;
}

export function mergeKnowledgeRecords(
  records: readonly KnowledgeRecord[],
  cellId: string,
  nowIso: string = new Date().toISOString()
): MergeResult {
  const groups = new Map<string, KnowledgeRecord[]>();
  for (const record of records) {
    const key = `${record.departmentId}::${normaliseTitleKey(record)}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(record);
    groups.set(key, bucket);
  }

  const changes: MergeChange[] = [];
  const mergedRecords: KnowledgeRecord[] = [];
  let mergedCount = 0;

  for (const bucket of groups.values()) {
    if (bucket.length === 1) {
      changes.push({
        recordId: bucket[0].id,
        kind: 'untouched',
        detailAr: 'تمت المذاكرة — لا دمج مطلوب.',
        detailEn: 'Digested — nothing to merge.',
      });
      mergedRecords.push(bucket[0]);
      continue;
    }

    mergedCount += 1;
    const base = [...bucket].sort((a, b) => b.version - a.version)[0];
    const keyPointsAr = [...new Set(bucket.flatMap(record => record.keyPointsAr))].slice(0, 12);
    const keyPointsEn = [...new Set(bucket.flatMap(record => record.keyPointsEn))].slice(0, 12);
    const seenSources = new Set<string>();
    const sources = bucket
      .flatMap(record => record.sources)
      .filter(source => {
        if (seenSources.has(source.url)) return false;
        seenSources.add(source.url);
        return true;
      })
      .slice(0, 8);
    const formula = bucket.map(record => record.formula).find(Boolean);
    const evolvedBy = [...new Set([...base.evolvedBy, cellId])].slice(-4);

    mergedRecords.push({
      ...base,
      keyPointsAr,
      keyPointsEn,
      sources,
      formula,
      version: base.version + 1,
      // Content changed ⇒ back to the review queue. Never silently approved.
      status: 'pending-review',
      evolvedBy,
      updatedAt: nowIso,
    });
    changes.push({
      recordId: base.id,
      kind: 'merged',
      detailAr: `دُمج ${bucket.length} سجلات مكررة → إصدار ${base.version + 1}، وصدرت نقاط موحدة ونُقل إلى «قيد المراجعة».`,
      detailEn: `Merged ${bucket.length} duplicate records → version ${base.version + 1}, unified key points, moved to «pending review».`,
    });
  }

  // Stable output order.
  mergedRecords.sort((a, b) => a.code.localeCompare(b.code));
  return { records: mergedRecords, changes, mergedCount };
}

/* --------------------------- search & filtering ---------------------------- */

export interface KnowledgeFilter {
  departmentId?: string;
  query?: string;
  status?: KnowledgeStatus;
}

export function filterKnowledgeRecords(
  records: readonly KnowledgeRecord[],
  filter: KnowledgeFilter
): KnowledgeRecord[] {
  const needle = (filter.query ?? '').trim().toLowerCase();
  return records.filter(record => {
    if (filter.departmentId && record.departmentId !== filter.departmentId) return false;
    if (filter.status && record.status !== filter.status) return false;
    if (!needle) return true;
    const haystack = [
      record.titleAr,
      record.titleEn,
      record.summaryAr,
      record.summaryEn,
      record.code,
      ...record.keyPointsAr,
      ...record.keyPointsEn,
      ...record.sources.map(source => source.publisher),
    ]
      .join(' ')
      .toLowerCase();
    return needle.split(/\s+/).every(part => haystack.includes(part));
  });
}

/* ---------------------- «المعمل» — The Lab teaching packs ------------------- */

export interface LabTeachingPack {
  packId: string;
  targetId: PlatformAgentTargetId;
  targetLabel: { ar: string; en: string };
  departmentId: string;
  departmentLabel: { ar: string; en: string };
  generatedAt: string;
  preamble: { ar: string; en: string };
  digest: string[];
  qaPairs: { questionAr: string; questionEn: string; answerAr: string; answerEn: string }[];
  guardrails: { ar: string; en: string }[];
  sources: UniversitySource[];
  honestNote: { ar: string; en: string };
}

export function buildLabTeachingPack(
  departmentId: string,
  targetId: PlatformAgentTargetId,
  records: readonly KnowledgeRecord[],
  nowIso: string = new Date().toISOString()
): LabTeachingPack | null {
  const department = departmentById(departmentId);
  const target = PLATFORM_AGENT_TARGETS.find(item => item.id === targetId);
  if (!department || !target) return null;

  // Approved knowledge leads; pending records may ride along but are labelled.
  const inDepartment = records.filter(record => record.departmentId === departmentId);
  const pool = (inDepartment.length ? inDepartment : [...records])
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'reviewed' ? -1 : 1;
      return a.code.localeCompare(b.code);
    })
    .slice(0, 6);
  if (pool.length === 0) return null;

  const digest = pool.map(
    record =>
      `【${record.code} · v${record.version} · ${record.status === 'reviewed' ? 'معتمد' : 'قيد المراجعة'}】 ${record.titleAr} — ${record.summaryAr}${record.formula ? ` | ${record.formula}` : ''}`
  );

  const qaPairs: LabTeachingPack['qaPairs'] = [];
  for (const record of pool.slice(0, 4)) {
    qaPairs.push({
      questionAr: `باختصار، ما الفكرة المحورية في «${record.titleAr}»؟`,
      questionEn: `In one line, what is «${record.titleEn}» really about?`,
      answerAr: record.summaryAr,
      answerEn: record.summaryEn,
    });
    const facts = record.keyPointsAr.slice(0, 3).map(point => `- ${point}`).join('\n');
    qaPairs.push({
      questionAr: `اذكر ثلاث حقائق امتحانية من «${record.titleAr}».`,
      questionEn: `List three exam-grade facts for «${record.titleEn}».`,
      answerAr: facts + (record.formula ? `\nالمعادلة المرجعية: ${record.formula}` : ''),
      answerEn:
        record.keyPointsEn.slice(0, 3).map(point => `- ${point}`).join('\n') +
        (record.formula ? `\nReference formula: ${record.formula}` : ''),
    });
  }

  const seenSources = new Set<string>();
  const sources = pool
    .flatMap(record => record.sources)
    .filter(source => {
      if (seenSources.has(source.url)) return false;
      seenSources.add(source.url);
      return true;
    });

  const date = nowIso.slice(0, 10);
  return {
    packId: `LAB-${department.code}-${target.id.toUpperCase().replace(/-/g, '_')}-${date}`,
    targetId,
    targetLabel: { ar: target.ar, en: target.en },
    departmentId: department.id,
    departmentLabel: { ar: department.ar, en: department.en },
    generatedAt: nowIso,
    preamble: {
      ar: `أنت وكيل INSCO المتخصص في «${department.ar}». أجب انطلاقًا من الأرشيف الموثق أدناه فقط، واذكر كود الأرشفة [INSCO-IND-…] مع كل حقيقة تقنية تقولها. إن نقص الأرشيف، قل ذلك صراحة واطلب من المستخدم الرجوع للمختص بدل التخمين.`,
      en: `You are the INSCO agent specialised in ${department.en}. Answer from the documented archive below only, citing the archive code [INSCO-IND-…] with every technical fact you state. If the archive is insufficient, say so explicitly and route the user to a qualified reviewer instead of guessing.`,
    },
    digest,
    qaPairs: qaPairs.slice(0, 6),
    guardrails: [
      {
        ar: 'لا تُصدر قرار قبول أو رفض لأي وصلة لحام أو فحص — القرار للمختص المعتمد والإجراء المعتمد.',
        en: 'Never issue an accept/reject call on any weld or examination — that belongs to the approved procedure and the qualified reviewer.',
      },
      {
        ar: 'اقتبس كود الأرشفة مع كل حقيقة، ولا تخلط بين سجل «معتمد» وآخر «قيد المراجعة».',
        en: 'Cite the archive code with every fact; never blend a «reviewed» record with a «pending review» one.',
      },
      {
        ar: 'لا تنسب شهادة أو اعتمادًا لشخص أو جهة — مواد الجامعة تدريبية وليست بديلًا عن التأهيل.',
        en: 'Never attribute a certification to a person or body — the university material is educational and never substitutes qualification.',
      },
      {
        ar: 'الأكواد والمعايير تشترى من ناشرها الرسمي؛ القوائم هنا خرائط طريق وليست نصوصًا معاد نشرها.',
        en: 'Codes and standards are bought from their official publisher; these lists are roadmaps, not re-published text.',
      },
      {
        ar: 'عند التعارض بين مصدرين، اعرض التعارض كما هو واطلب حسمًا بشريًا — لا تُصالح بينهما بالتخمين.',
        en: 'When two sources conflict, present the conflict as-is and ask for human adjudication — never reconcile by guessing.',
      },
    ],
    sources,
    honestNote: {
      ar: 'حزمة تعليم مبدئية مولّدة آليًا للمراجعة البشرية قبل أي حقن في الوكيل. ليست شهادة، ولا تُعتمد إلا بعد توقيع مختص الأرشيف.',
      en: 'Auto-generated draft teaching pack for human review before any injection into the agent. Not a certification; effective only after the archive specialist signs it.',
    },
  };
}
