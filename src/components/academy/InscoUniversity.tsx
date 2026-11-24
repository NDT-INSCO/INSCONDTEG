/**
 * جامعة إنسكو الروبوتية للإنشاءات الصناعية — the Robotic University tab.
 * One screen, six halls: العمادة (the Council), التخصصات (Departments),
 * روبوتات الجمع (Collectors), الخلايا العصبية (Neural cells),
 * الأرشيف العلمي (the Organising robot) and المعمل (The Lab for teaching the
 * platform's AI agents).
 *
 * Everything shown is either bundled (the reviewed seed, always available —
 * including the static Pages build) or fetched from the hosting AI gateway,
 * with the two clearly labelled apart. No number on this screen is typed by
 * hand: counters derive from the arrays below.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BrainCircuit,
  GraduationCap,
  Landmark,
  LayoutGrid,
  Microscope,
  Radar,
  ShieldAlert,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  PLATFORM_AGENT_TARGETS,
  UNIVERSITY_COLLECTORS,
  UNIVERSITY_DEPARTMENTS,
  UNIVERSITY_NEURAL_CELLS,
} from '../../data/university';
import {
  SEED_KNOWLEDGE,
  buildLabTeachingPack,
  filterKnowledgeRecords,
  knowledgeStats,
  mergeKnowledgeRecords,
  organizeKnowledgeRecords,
  type KnowledgeRecord,
  type LabTeachingPack,
} from '../../data/universityKnowledge';
import {
  buildAgentTeachingPack,
  collectDocumentedKnowledge,
  fetchUniversityArchive,
  fetchUniversityStatus,
  organizeArchive,
  synthesizeDepartment,
  UniversityApiError,
} from '../../ai/universityClient';
import type {
  UniversityCollectResponse,
  UniversityOrganizeResponse,
  UniversityStatus,
  UniversitySynthesizeResponse,
} from '../../ai/universityContract';
import {
  ArchiveTab,
  CollectTab,
  CouncilTab,
  DepartmentsTab,
  LabTab,
  NeuralTab,
} from './InscoUniversityTabs';

type UnivTab = 'council' | 'departments' | 'collect' | 'neural' | 'archive' | 'lab';

const TABS: { id: UnivTab; ar: string; en: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'council', ar: 'العمادة والمجلس', en: 'The Council', icon: Landmark },
  { id: 'departments', ar: 'التخصصات الاثنا عشر', en: 'Departments', icon: LayoutGrid },
  { id: 'collect', ar: 'روبوتات الجمع', en: 'Collectors', icon: Radar },
  { id: 'neural', ar: 'الخلايا العصبية', en: 'Neural Cells', icon: BrainCircuit },
  { id: 'archive', ar: 'الأرشيف العلمي', en: 'The Organising Robot', icon: Archive },
  { id: 'lab', ar: 'المعمل', en: 'The Lab', icon: Microscope },
];

export const InscoUniversity: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';

  const [tab, setTab] = useState<UnivTab>('council');
  const [status, setStatus] = useState<UniversityStatus | null>(null);
  const [runtimeRecords, setRuntimeRecords] = useState<KnowledgeRecord[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const [departmentId, setDepartmentId] = useState<string>('engineering');
  const [collectorId, setCollectorId] = useState<string>('collector-engineering-research');
  const [focus, setFocus] = useState('');

  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<UniversityCollectResponse | null>(null);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [collectOrigin, setCollectOrigin] = useState<'gateway' | 'local' | null>(null);

  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizeResult, setSynthesizeResult] = useState<UniversitySynthesizeResponse | null>(null);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  const [organizing, setOrganizing] = useState(false);
  const [organizeResult, setOrganizeResult] = useState<UniversityOrganizeResponse | null>(null);
  const [organizeError, setOrganizeError] = useState<string | null>(null);

  const [teaching, setTeaching] = useState(false);
  const [teachTarget, setTeachTarget] = useState<string>('tutor');
  const [pack, setPack] = useState<LabTeachingPack | null>(null);
  const [teachOrigin, setTeachOrigin] = useState<'gateway' | 'local' | null>(null);
  const [teachError, setTeachError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveDept, setArchiveDept] = useState<string>('all');
  const [archiveStatus, setArchiveStatus] = useState<'all' | 'reviewed' | 'pending-review'>('all');

  const pushLog = useCallback((line: string) => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLog(prev => [`${time} · ${line}`, ...prev].slice(0, 24));
  }, []);

  const allRecords = useMemo(
    () => [...SEED_KNOWLEDGE, ...runtimeRecords],
    [runtimeRecords]
  );
  const stats = useMemo(() => knowledgeStats(allRecords), [allRecords]);

  const selectedDepartment = UNIVERSITY_DEPARTMENTS.find(d => d.id === departmentId)!;
  const departmentCollectors = UNIVERSITY_COLLECTORS.filter(agent => agent.departmentId === departmentId);
  const departmentCell = UNIVERSITY_NEURAL_CELLS.find(agent => agent.departmentId === departmentId)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nextStatus = await fetchUniversityStatus();
      if (cancelled) return;
      setStatus(nextStatus);
      pushLog(
        nextStatus.configured
          ? (isAr ? `العميد: البوابة حية — النموذج ${nextStatus.model}` : `Rector: gateway live — model ${nextStatus.model}`)
          : (isAr ? 'العميد: لا بوابة ذكاء اصطناعي على هذه النسخة — الأرشيف الموثق يعمل محليًا' : 'Rector: no AI gateway on this build — the reviewed archive runs locally')
      );
      if (nextStatus.configured) {
        try {
          const archive = await fetchUniversityArchive();
          if (cancelled) return;
          setRuntimeRecords(archive.records as KnowledgeRecord[]);
          pushLog(isAr ? `المُنظِّم: حُمِّل ${archive.records.length} سجلًا من الأرشيف الحي` : `Organiser: loaded ${archive.records.length} runtime records`);
        } catch {
          pushLog(isAr ? 'المُنظِّم: تعذر الوصول للأرشيف الحي — عُرضت البذور الموثقة فقط' : 'Organiser: runtime archive unreachable — showing the reviewed seed only');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshRuntimeArchive = useCallback(async () => {
    try {
      const archive = await fetchUniversityArchive();
      setRuntimeRecords(archive.records as KnowledgeRecord[]);
    } catch {
      /* gateway hiccup — keep what we have */
    }
  }, []);

  const runCollect = async () => {
    if (collecting) return;
    setCollecting(true);
    setCollectResult(null);
    setCollectError(null);
    setCollectOrigin(null);
    pushLog(isAr ? `العميد: وجّه ${collectorId} إلى «${selectedDepartment.ar}»` : `Rector routed ${collectorId} to ${selectedDepartment.en}`);
    try {
      const result = await collectDocumentedKnowledge({
        departmentId,
        query: focus.trim() || undefined,
        collectorId,
        language: isAr ? 'ar' : 'en',
      });
      setCollectResult(result);
      setCollectOrigin('gateway');
      pushLog(
        result.mode === 'live'
          ? (isAr ? `الجمع اكتمل: ${result.records.length} سجلات (نموذج حي) → قيد المراجعة` : `Collection done: ${result.records.length} live records → pending review`)
          : (isAr ? `الجمع المحلي: عرض ${result.records.length} سجلات موثقة (لا بوابة)` : `Offline fallback: ${result.records.length} reviewed records served (no gateway)`)
      );
      if (result.persisted) void refreshRuntimeArchive();
    } catch (error) {
      if (error instanceof UniversityApiError && (error.code === 'not_configured' || error.status === 503)) {
        // Static build: serve the reviewed seed locally with the same honesty.
        const seeded = SEED_KNOWLEDGE.filter(record => record.departmentId === departmentId);
        setCollectResult({
          ok: true,
          mode: 'seed',
          departmentId,
          collectorId,
          persisted: false,
          message: {
            ar: 'هذه نسخة ثابتة بلا بوابة — السجلات المعروضة من الأرشيف الموثق داخل التطبيق، وليست تصفحًا حيًا.',
            en: 'This static build has no gateway — the records shown are bundled archival references, not a live browse.',
          },
          records: seeded,
        });
        setCollectOrigin('local');
        pushLog(isAr ? 'الجمع: لا بوابة — عُرضت البذور الموثقة محليًا' : 'Collect: no gateway — reviewed seed served locally');
      } else {
        setCollectError(error instanceof Error ? error.message : String(error));
        pushLog(isAr ? 'الجمع فشل — راجع الخطأ أدناه' : 'Collection failed — see the error below');
      }
    } finally {
      setCollecting(false);
    }
  };

  const runSynthesize = async () => {
    if (synthesizing) return;
    setSynthesizing(true);
    setSynthesizeResult(null);
    setSynthesizeError(null);
    pushLog(isAr ? `النواة: جلسة ${departmentCell.id} لمذاكرة «${selectedDepartment.ar}»` : `Nucleus session: ${departmentCell.id} digesting ${selectedDepartment.en}`);
    try {
      const result = await synthesizeDepartment({ departmentId, language: isAr ? 'ar' : 'en' });
      setSynthesizeResult(result);
      pushLog(isAr ? `الخلية: دمج ${result.mergedCount} مجموعات مكررة` : `Cell: merged ${result.mergedCount} duplicate group(s)`);
      void refreshRuntimeArchive();
    } catch (error) {
      if (error instanceof UniversityApiError && (error.code === 'not_configured' || error.status === 503 || error.status === 404)) {
        // Deterministic local fallback — the cell is an algorithm, not a network call.
        const pool = allRecords.filter(record => record.departmentId === departmentId);
        const merged = mergeKnowledgeRecords(pool, departmentCell.id);
        setSynthesizeResult({
          ok: true,
          mode: 'seed',
          departmentId,
          cellId: departmentCell.id,
          mergedCount: merged.mergedCount,
          persisted: false,
          message: {
            ar: 'نُفذت المذاكرة محليًا داخل المتصفح (بلا بوابة) — النتائج ليست محفوظة على خادم.',
            en: 'Digest ran locally in the browser (no gateway) — results are not persisted to a server.',
          },
          records: merged.records,
          changes: merged.changes,
        });
        pushLog(isAr ? 'الخلية: مذاكرة محلية (المتصفح) — بلا حفظ على الخادم' : 'Cell: local digest (browser) — nothing persisted');
      } else {
        setSynthesizeError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setSynthesizing(false);
    }
  };

  const runOrganize = async () => {
    if (organizing) return;
    setOrganizing(true);
    setOrganizeResult(null);
    setOrganizeError(null);
    pushLog(isAr ? 'المُنظِّم: بدء دورة تنظيم وهيكلة كاملة للأرشيف' : 'Organiser: full archive restructure cycle started');
    try {
      const result = await organizeArchive({ language: isAr ? 'ar' : 'en' });
      setOrganizeResult(result);
      pushLog(isAr ? `المُنظِّم: أُسند ${result.codesAssigned} كودًا، ثبّت ${result.codesKept}` : `Organiser: assigned ${result.codesAssigned} codes, kept ${result.codesKept}`);
      void refreshRuntimeArchive();
    } catch (error) {
      if (error instanceof UniversityApiError && (error.code === 'not_configured' || error.status === 503 || error.status === 404)) {
        const organised = organizeKnowledgeRecords(allRecords);
        setOrganizeResult({
          ok: true,
          message: {
            ar: 'نُظمت نسخة المتصفح المحلية فقط (البذور + ما حُمِّل) — لا خادم يُعاد كتابته هنا.',
            en: 'Local browser copy organised only (seed + loaded) — no server-side archive was rewritten.',
          },
          stats: organised.stats,
          actions: organised.actions,
          codesAssigned: organised.codesAssigned,
          codesKept: organised.codesKept,
        });
        pushLog(isAr ? 'المُنظِّم: تنظيم محلي (بلا حفظ على الخادم)' : 'Organiser: local audit (no server persistence)');
      } else {
        setOrganizeError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setOrganizing(false);
    }
  };

  const buildPackMarkdown = (value: LabTeachingPack): string => {
    const L: string[] = [];
    L.push(`# ${value.packId} — ${value.departmentLabel.ar} → ${value.targetLabel.ar}`);
    L.push('');
    L.push(`> ${value.honestNote.ar}`);
    L.push('');
    L.push('## ديباجة النظام | System preamble');
    L.push('');
    L.push(value.preamble.ar);
    L.push('');
    L.push(value.preamble.en);
    L.push('');
    L.push('## الخلاصة العلمية | Digest');
    L.push('');
    for (const line of value.digest) L.push(`- ${line}`);
    L.push('');
    L.push('## أسئلة وإجابات للمراقبة | Eval Q&A');
    L.push('');
    for (const pair of value.qaPairs) {
      L.push(`**س:** ${pair.questionAr}`);
      L.push(`**A:** ${pair.questionEn}`);
      L.push('');
      L.push(pair.answerAr);
      L.push('');
      L.push(pair.answerEn);
      L.push('');
    }
    L.push('## حدود وأمانات | Guardrails');
    L.push('');
    for (const guard of value.guardrails) {
      L.push(`- ${guard.ar}`);
      L.push(`  ${guard.en}`);
    }
    L.push('');
    L.push('## المصادر | Sources');
    L.push('');
    for (const source of value.sources) L.push(`- ${source.title} — ${source.publisher} — ${source.url}`);
    return L.join('\n');
  };

  const runTeach = async () => {
    if (teaching) return;
    setTeaching(true);
    setPack(null);
    setTeachError(null);
    setTeachOrigin(null);
    pushLog(isAr ? `المعمل: توليد حزمة تعليم لـ «${PLATFORM_AGENT_TARGETS.find(t => t.id === teachTarget)?.ar}»` : 'The Lab: building a teaching pack');
    try {
      const result = await buildAgentTeachingPack({ departmentId, targetId: teachTarget, language: isAr ? 'ar' : 'en' });
      setPack(result.pack);
      setTeachOrigin('gateway');
      pushLog(isAr ? `المعمل: حزمة ${result.pack.packId} جاهزة للمراجعة البشرية` : `The Lab: pack ${result.pack.packId} ready for human review`);
    } catch (error) {
      if (error instanceof UniversityApiError && (error.code === 'not_configured' || error.status === 503 || error.status === 404)) {
        const built = buildLabTeachingPack(
          departmentId,
          teachTarget as (typeof PLATFORM_AGENT_TARGETS)[number]['id'],
          allRecords
        );
        if (built) {
          setPack(built);
          setTeachOrigin('local');
          pushLog(isAr ? 'المعمل: حزمة مولّدة محليًا من الأرشيف الموثق' : 'The Lab: pack built locally from the reviewed archive');
        } else {
          setTeachError(isAr ? 'لا توجد مادة كافية في هذا القسم بعد.' : 'Not enough material in this department yet.');
        }
      } else {
        setTeachError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setTeaching(false);
    }
  };

  const copyPack = async () => {
    if (!pack) return;
    try {
      await navigator.clipboard.writeText(buildPackMarkdown(pack));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      pushLog(isAr ? 'المعمل: تعذر النسخ — التنزيل متاح بدلًا منه' : 'The Lab: clipboard blocked — use download instead');
    }
  };

  const downloadPack = () => {
    if (!pack) return;
    const blob = new Blob([buildPackMarkdown(pack)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${pack.packId}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const filteredArchive = useMemo(
    () =>
      filterKnowledgeRecords(allRecords, {
        departmentId: archiveDept === 'all' ? undefined : archiveDept,
        query: archiveQuery,
        status: archiveStatus === 'all' ? undefined : archiveStatus,
      }),
    [allRecords, archiveDept, archiveQuery, archiveStatus]
  );

  /* ------------------------------- render --------------------------------- */

  return (
    <section aria-label={isAr ? 'جامعة إنسكو الروبوتية' : 'INSCO Robotic University'} className="space-y-5">
      {/* ------------------------------- masthead ------------------------------ */}
      <header className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#191307] via-[#10132b] to-[#0b0d1e] p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -end-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-amber-400/10">
              <GraduationCap className="h-9 w-9 sm:h-11 sm:w-11 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-mono-code font-bold tracking-[0.25em] text-amber-500">INSCO ROBOTIC UNIVERSITY · EST. 2026</p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-black leading-8 text-white">
                {isAr ? 'جامعة إنسكو الروبوتية للإنشاءات الصناعية' : 'INSCO Robotic University for Industrial Construction'}
              </h2>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                {isAr
                  ? 'العلم الموثق أولًا… ثم التطوير… ثم التعليم — «المعمل» يغذّي وكلاء المنصة بالعلم مرتبًا ومراجَعًا.'
                  : 'Documented science first… then evolution… then teaching — The Lab feeds the platform’s AI agents with organised, reviewed knowledge.'}
              </p>
            </div>
          </div>
          <div className="lg:ms-auto flex flex-col items-start lg:items-end gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${status?.configured ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'}`}>
              <span className={`h-2 w-2 rounded-full ${status?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {status === null
                ? (isAr ? 'جارٍ فحص البوابة…' : 'Checking the gateway…')
                : status.configured
                  ? (isAr ? `بوابة حية · ${status.model}` : `Live gateway · ${status.model}`)
                  : (isAr ? 'وضع الأرشيف الموثق (بلا بوابة)' : 'Reviewed-archive mode (no gateway)')}
            </span>
            <p className="text-[10px] font-mono-code text-slate-500">GEMINI_API_KEY → {status?.configured ? (isAr ? 'موجود' : 'present') : (isAr ? 'غير موجود على هذه النسخة' : 'absent on this build')}</p>
            <p className="text-[10px] font-mono-code text-slate-500">ARCHIVE → {status?.store === 'firestore'
              ? (isAr ? 'Firestore — دائم (مجاني)' : 'Firestore — durable (free tier)')
              : status?.store === 'file'
                ? (isAr ? 'ملف على الخادم — يدوم' : 'host file — durable')
                : status?.store === 'memory'
                  ? (isAr ? 'ذاكرة مؤقتة — ينمحي عند إعادة التشغيل' : 'in-memory — cleared on restart')
                  : (isAr ? '…' : '…')}</p>
          </div>
        </div>

        {/* derived counters — never typed by hand */}
        <dl className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { v: UNIVERSITY_DEPARTMENTS.length, ar: 'تخصصًا علميًا', en: 'specialisations' },
            { v: UNIVERSITY_COLLECTORS.length, ar: 'روبوت جمع', en: 'collector robots' },
            { v: UNIVERSITY_NEURAL_CELLS.length + 1, ar: 'خلية عصبية', en: 'neural cells' },
            { v: stats.total, ar: 'سجلًا في الأرشيف', en: 'archive records' },
            { v: stats.reviewed, ar: 'سجلًا معتمدًا', en: 'reviewed records' },
            { v: stats.validHttpsSources, ar: 'استشهاد HTTPS', en: 'HTTPS citations' },
          ].map(item => (
            <div key={item.en} className="rounded-xl border border-[#29315b] bg-[#0b0d1e]/80 px-3 py-2 text-center">
              <dt className="sr-only">{isAr ? item.ar : item.en}</dt>
              <dd className="text-xl sm:text-2xl font-black text-amber-300 font-mono-code">{item.v}</dd>
              <dd className="text-[9px] sm:text-[10px] leading-3 text-slate-400 mt-1">{isAr ? item.ar : item.en}</dd>
            </div>
          ))}
        </dl>

        <p className="relative mt-4 flex items-start gap-2 rounded-xl border border-[#29315b] bg-[#0b0d1e]/70 p-3 text-[10px] sm:text-[11px] leading-5 text-slate-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>
            {isAr
              ? 'الجامعة صريحة في مصدر كل معلومة: ما جُمع حيًا من الإنترنت يُوسم «قيد المراجعة» ولا يُعتمد بلا مختص. النسخة الثابتة على الإنترنت تعرض الأرشيف الموثق المبدئي فقط، ولا تتظاهر بتصفح حي. المحتوى مادة علمية هندسية وليس شهادة أو اعتمادًا مهنيًا.'
              : 'The university is explicit about provenance: anything harvested live is tagged «pending review» and never counts as approved without a specialist. The static build serves the reviewed seed only — it never pretends to browse. Material is engineering science, not a professional certificate or accreditation.'}
          </span>
        </p>
      </header>

      {/* ------------------------------ tab bar ------------------------------- */}
      <div role="tablist" aria-label={isAr ? 'أجنحة الجامعة' : 'University halls'} className="flex flex-wrap gap-2">
        {TABS.map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                active
                  ? 'border-amber-400/70 bg-amber-400/10 text-amber-300'
                  : 'border-[#29315b] bg-[#10132b] text-slate-300 hover:border-amber-400/40 hover:text-amber-200'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {isAr ? item.ar : item.en}
            </button>
          );
        })}
      </div>

      {tab === 'council' && (
        <CouncilTab isAr={isAr} onOpenDepartments={() => setTab('departments')} />
      )}
      {tab === 'departments' && (
        <DepartmentsTab
          isAr={isAr}
          departmentId={departmentId}
          onSelectDepartment={id => {
            setDepartmentId(id);
            setCollectorId(`collector-${id}-research`);
          }}
          onGoCollect={() => setTab('collect')}
        />
      )}
      {tab === 'collect' && (
        <CollectTab
          isAr={isAr}
          departmentId={departmentId}
          onSelectDepartment={id => {
            setDepartmentId(id);
            setCollectorId(`collector-${id}-research`);
          }}
          collectors={departmentCollectors}
          collectorId={collectorId}
          onSelectCollector={setCollectorId}
          focus={focus}
          onFocusChange={setFocus}
          collecting={collecting}
          result={collectResult}
          error={collectError}
          origin={collectOrigin}
          onRun={runCollect}
        />
      )}
      {tab === 'neural' && (
        <NeuralTab
          isAr={isAr}
          departmentId={departmentId}
          onSelectDepartment={id => {
            setDepartmentId(id);
            setCollectorId(`collector-${id}-research`);
          }}
          cell={departmentCell}
          synthesizing={synthesizing}
          result={synthesizeResult}
          error={synthesizeError}
          onRun={runSynthesize}
        />
      )}
      {tab === 'archive' && (
        <ArchiveTab
          isAr={isAr}
          records={allRecords}
          stats={stats}
          query={archiveQuery}
          onQueryChange={setArchiveQuery}
          dept={archiveDept}
          onDeptChange={setArchiveDept}
          statusFilter={archiveStatus}
          onStatusFilterChange={setArchiveStatus}
          organizing={organizing}
          organizeResult={organizeResult}
          organizeError={organizeError}
          onOrganize={runOrganize}
          filtered={filteredArchive}
          store={status?.store}
        />
      )}
      {tab === 'lab' && (
        <LabTab
          isAr={isAr}
          departmentId={departmentId}
          onSelectDepartment={id => {
            setDepartmentId(id);
            setCollectorId(`collector-${id}-research`);
          }}
          target={teachTarget}
          onTargetChange={setTeachTarget}
          teaching={teaching}
          pack={pack}
          origin={teachOrigin}
          error={teachError}
          onGenerate={runTeach}
          onCopy={copyPack}
          copied={copied}
          onDownload={downloadPack}
        />
      )}

      {/* --------------------------- live activity log -------------------------- */}
      {log.length > 0 && (
        <details className="rounded-2xl border border-[#232a4e] bg-[#05061a] p-3">
          <summary className="cursor-pointer text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-amber-300">
            {isAr ? `سجل عمليات الجامعة (${log.length})` : `University operations log (${log.length})`}
          </summary>
          <ol className="mt-2 space-y-1 font-mono-code text-[10px] leading-4 text-emerald-300/90" dir="auto">
            {log.map((line, idx) => (
              <li key={`${idx}-${line.slice(0, 24)}`}>› {line}</li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
};
