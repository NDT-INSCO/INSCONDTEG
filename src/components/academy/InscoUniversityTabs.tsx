/**
 * The six halls of «جامعة إنسكو الروبوتية» — presentational tab components.
 * All numbers come from props/derived data; nothing is invented here.
 */
import React from 'react';
import {
  Archive,
  ArrowDown,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ClipboardCopy,
  Code2,
  Download,
  ExternalLink,
  FlaskConical,
  HardHat,
  Landmark,
  Layers,
  LayoutGrid,
  Loader2,
  Megaphone,
  Microscope,
  Radar,
  Ruler,
  ScanLine,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sigma,
  Sparkles,
  Target,
  ArchiveRestore,
} from 'lucide-react';
import {
  PLATFORM_AGENT_TARGETS,
  UNIVERSITY_COLLECTORS,
  UNIVERSITY_CENTRAL_AGENTS,
  UNIVERSITY_DEPARTMENTS,
  UNIVERSITY_NEURAL_CELLS,
  type UniversityAgent,
  type UniversityDepartment,
} from '../../data/university';
import {
  SEED_KNOWLEDGE,
  recordCompleteness,
  type KnowledgeRecord,
  type KnowledgeStats,
  type LabTeachingPack,
} from '../../data/universityKnowledge';
import type {
  UniversityCollectResponse,
  UniversityOrganizeResponse,
  UniversitySynthesizeResponse,
} from '../../ai/universityContract';

const DEPT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flask: FlaskConical,
  ruler: Ruler,
  sigma: Sigma,
  braces: Code2,
  layers: Layers,
  'hard-hat': HardHat,
  'scroll-text': ScrollText,
  'shield-check': ShieldCheck,
  'scan-line': ScanLine,
  'code-2': Code2,
  megaphone: Megaphone,
  target: Target,
};
const deptIcon = (key: string) => DEPT_ICONS[key] ?? BookOpenCheck;

const inputClass =
  'w-full rounded-xl border border-[#303961] bg-[#0b0d1e] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400/70 focus:outline-none';
const cardClass = 'rounded-2xl border border-[#29315b] bg-[#10132b] p-4 sm:p-5 space-y-3';

/* ------------------------------ shared bits ------------------------------- */

export const SourceList: React.FC<{ sources: KnowledgeRecord['sources'] }> = ({ sources }) => (
  <ul className="space-y-1">
    {sources.map(source => (
      <li key={source.url + source.title} className="flex items-start gap-1.5 text-[11px] leading-5">
        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sky-300 underline decoration-sky-800 underline-offset-2 hover:text-sky-200"
        >
          {source.title}
        </a>
        <span className="text-slate-500">· {source.publisher}</span>
      </li>
    ))}
  </ul>
);

export const StatusBadge: React.FC<{ status: KnowledgeRecord['status']; isAr: boolean }> = ({ status, isAr }) =>
  status === 'reviewed' ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      {isAr ? 'معتمد' : 'Reviewed'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
      <ShieldAlert className="w-3 h-3" aria-hidden="true" />
      {isAr ? 'قيد المراجعة' : 'Pending review'}
    </span>
  );

export const RecordCard: React.FC<{ record: KnowledgeRecord; isAr: boolean; compact?: boolean }> = ({ record, isAr, compact }) => (
  <article className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-md bg-[#161a35] px-2 py-0.5 text-[10px] font-mono-code font-bold text-amber-300" dir="ltr">
        {record.code}
      </code>
      <StatusBadge status={record.status} isAr={isAr} />
      <span className="text-[10px] font-mono-code text-slate-500">v{record.version}</span>
      <span className="text-[10px] text-slate-500">
        · {isAr ? 'اكتمال' : 'complete'} {recordCompleteness(record)}%
      </span>
    </div>
    <h4 className="text-sm font-bold leading-6 text-slate-100">{isAr ? record.titleAr : record.titleEn}</h4>
    <p className="text-[11px] leading-5 text-slate-400">{isAr ? record.summaryAr : record.summaryEn}</p>
    {!compact && (
      <>
        <ul className="list-disc pe-5 space-y-1 text-[11px] leading-5 text-slate-300">
          {(isAr ? record.keyPointsAr : record.keyPointsEn).slice(0, 4).map(point => (
            <li key={point.slice(0, 60)}>{point}</li>
          ))}
        </ul>
        {record.formula && (
          <code dir="ltr" className="block overflow-x-auto rounded-lg bg-[#05061a] px-3 py-2 font-mono-code text-[11px] text-emerald-300">
            {record.formula}
          </code>
        )}
        <SourceList sources={record.sources} />
      </>
    )}
  </article>
);

const DepartmentSelect: React.FC<{
  isAr: boolean;
  value: string;
  onChange: (id: string) => void;
  label: string;
}> = ({ isAr, value, onChange, label }) => (
  <label className="block space-y-1.5">
    <span className="text-[11px] font-bold text-slate-400">{label}</span>
    <span className="relative block">
      <select value={value} onChange={event => onChange(event.target.value)} className={`${inputClass} appearance-none pe-9`}>
        {UNIVERSITY_DEPARTMENTS.map(department => (
          <option key={department.id} value={department.id}>
            {department.code} — {isAr ? department.ar : department.en}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </span>
  </label>
);

/* ------------------------------ 1 · العمادة -------------------------------- */

export const CouncilTab: React.FC<{ isAr: boolean; onOpenDepartments: () => void }> = ({ isAr, onOpenDepartments }) => {
  const rector = UNIVERSITY_CENTRAL_AGENTS.find(agent => agent.id === 'rector')!;
  const centrals = UNIVERSITY_CENTRAL_AGENTS.filter(agent => agent.id !== 'rector');
  const flow = [
    { icon: Radar, ar: '١ · جمع العلم من الإنترنت', en: '1 · Harvest the web' },
    { icon: Archive, ar: '٢ · تنظيم وهيكلة وأرشفة', en: '2 · Organise & archive' },
    { icon: BrainCircuit, ar: '٣ · مذاكرة الخلية العصبية', en: '3 · Neural-cell digest' },
    { icon: Microscope, ar: '٤ · تعليم وكلاء المنصة في المعمل', en: '4 · Teach the platform agents' },
  ];
  return (
    <div className="space-y-4">
      {/* the operating pipeline */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label={isAr ? 'خط تشغيل الجامعة' : 'University operating pipeline'}>
        {flow.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.en}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[10px] sm:text-[11px] font-bold text-amber-200">
                <Icon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                {isAr ? step.ar : step.en}
              </span>
              {index < flow.length - 1 && <ArrowDown className="h-4 w-4 -rotate-90 text-slate-600" aria-hidden="true" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* the Rector */}
      <article className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Landmark className="h-8 w-8 text-amber-400" aria-hidden="true" />
          <div>
            <p className="text-[10px] font-mono-code uppercase tracking-[0.2em] text-amber-500">{isAr ? 'السلطة العليا · الموجه' : 'Supreme authority · Router'}</p>
            <h3 className="text-lg sm:text-xl font-black text-white">{rector.ar}</h3>
            <p className="text-[10px] text-slate-500 font-mono-code" dir="ltr">{rector.id} · {rector.status}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] sm:text-xs leading-6 text-slate-300">{isAr ? rector.mandateAr : rector.mandateEn}</p>
      </article>

      {/* the three central organs */}
      <div className="grid gap-3 md:grid-cols-3">
        {centrals.map(agent => (
          <CentralOrganCard key={agent.id} agent={agent} isAr={isAr} />
        ))}
      </div>

      {/* the twelve departments with their robots */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-white">{isAr ? 'الأقسام الاثنا عشر وروبوتاتها' : 'The twelve departments and their robots'}</h3>
          <button
            type="button"
            onClick={onOpenDepartments}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20 cursor-pointer"
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            {isAr ? 'ادخل قسم التخصصات' : 'Open the departments hall'}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {UNIVERSITY_DEPARTMENTS.map(department => {
            const Icon = deptIcon(department.icon);
            const collectors = UNIVERSITY_COLLECTORS.filter(a => a.departmentId === department.id);
            const cell = UNIVERSITY_NEURAL_CELLS.find(a => a.departmentId === department.id)!;
            const seedCount = SEED_KNOWLEDGE.filter(r => r.departmentId === department.id).length;
            return (
              <div key={department.id} className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: `${department.color}55`, color: department.color, background: `${department.color}14` }}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold leading-4 text-slate-100">{isAr ? department.ar : department.en}</p>
                    <p className="text-[9px] font-mono-code text-slate-500">{department.code} · {seedCount} {isAr ? 'سجلًا موثقًا' : 'documented records'}</p>
                  </div>
                </div>
                <ul className="space-y-0.5 text-[9px] leading-4 text-slate-400">
                  {collectors.map(collector => (
                    <li key={collector.id} className="flex items-start gap-1">
                      <Radar className="mt-0.5 h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                      <span className="line-clamp-1">{collector.ar.split('—')[0].trim()}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-1">
                    <BrainCircuit className="mt-0.5 h-3 w-3 shrink-0 text-fuchsia-400" aria-hidden="true" />
                    <span className="line-clamp-1">{isAr ? cell.ar : cell.en}</span>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] leading-5 text-slate-500">
          {isAr
            ? 'كل روبوت موصوف هنا كود وتعليمات موثقة في هذا المستودع — لا وعود دعائية إضافية، ولا معرفة تُعتمد بلا مصدر ولا مراجعة بشرية.'
            : 'Every robot described here is code and documented instructions in this repository — no marketing promises, and nothing is approved without a source and human review.'}
        </p>
      </div>
    </div>
  );
};

const centralIcon = (id: string) => (id === 'archivist' ? ArchiveRestore : id === 'nucleus' ? BrainCircuit : Microscope);

const CentralOrganCard: React.FC<{ agent: UniversityAgent; isAr: boolean }> = ({ agent, isAr }) => {
  const Icon = centralIcon(agent.id);
  const accent = agent.id === 'archivist' ? 'text-emerald-300 border-emerald-400/30' : agent.id === 'nucleus' ? 'text-fuchsia-300 border-fuchsia-400/30' : 'text-violet-300 border-violet-400/30';
  return (
    <article className={`rounded-2xl border bg-[#10132b] p-4 space-y-2 ${accent}`}>
      <Icon className="h-6 w-6" aria-hidden="true" />
      <h4 className="text-sm font-black text-white leading-6">{isAr ? agent.ar : agent.en}</h4>
      <p className="text-[10px] leading-5 text-slate-400">{isAr ? agent.mandateAr : agent.mandateEn}</p>
      <p className="text-[9px] font-mono-code text-slate-600" dir="ltr">{agent.id} · {agent.status}</p>
    </article>
  );
};

/* ----------------------------- 2 · التخصصات -------------------------------- */

export const DepartmentsTab: React.FC<{
  isAr: boolean;
  departmentId: string;
  onSelectDepartment: (id: string) => void;
  onGoCollect: () => void;
}> = ({ isAr, departmentId, onSelectDepartment, onGoCollect }) => {
  const department = UNIVERSITY_DEPARTMENTS.find(d => d.id === departmentId)!;
  const Icon = deptIcon(department.icon);
  const records = SEED_KNOWLEDGE.filter(record => record.departmentId === departmentId);
  const reviewed = records.filter(record => record.status === 'reviewed').length;
  const collectors = UNIVERSITY_COLLECTORS.filter(a => a.departmentId === departmentId);
  const cell = UNIVERSITY_NEURAL_CELLS.find(a => a.departmentId === departmentId)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* department rail */}
      <nav aria-label={isAr ? 'الأقسام' : 'Departments'} className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {UNIVERSITY_DEPARTMENTS.map(item => {
          const ItemIcon = deptIcon(item.icon);
          const active = item.id === departmentId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectDepartment(item.id)}
              aria-pressed={active}
              className={`flex min-w-[180px] lg:min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-start transition cursor-pointer ${
                active ? 'border-amber-400/60 bg-amber-400/10' : 'border-[#29315b] bg-[#10132b] hover:border-amber-400/30'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: `${item.color}55`, color: item.color }}>
                <ItemIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold leading-4 text-slate-100">{isAr ? item.ar : item.en}</span>
                <span className="block text-[9px] font-mono-code text-slate-500">{item.code}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* department detail */}
      <div className="space-y-4">
        <div className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ borderColor: `${department.color}66`, color: department.color, background: `${department.color}14` }}>
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[9px] font-mono-code uppercase tracking-[0.2em] text-slate-500">{isAr ? 'قسم' : 'DEPARTMENT'} · {department.code}</p>
                <h3 className="text-lg font-black leading-6 text-white">{isAr ? department.ar : department.en}</h3>
                <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">{isAr ? department.taglineAr : department.taglineEn}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoCollect}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/50 bg-sky-400/10 px-3 py-2 text-[10px] font-bold text-sky-300 transition hover:bg-sky-400/20 cursor-pointer whitespace-nowrap"
            >
              <Radar className="h-4 w-4" aria-hidden="true" />
              {isAr ? 'شغّل روبوت جمع لهذا القسم' : 'Run a collector for this department'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(isAr ? department.tracksAr : department.tracksEn).map(track => (
              <span key={track} className="rounded-full border border-[#303961] bg-[#0b0d1e] px-2.5 py-1 text-[9px] text-slate-300">
                {track}
              </span>
            ))}
          </div>
          {/* this department's robots */}
          <div className="grid gap-2 sm:grid-cols-3">
            {collectors.map(collector => (
              <div key={collector.id} className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-2.5">
                <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sky-400">
                  <Radar className="h-3 w-3" aria-hidden="true" />
                  {isAr ? 'روبوت جمع' : 'Collector'}
                </p>
                <p className="mt-1 text-[10px] font-bold leading-4 text-slate-100">{isAr ? collector.ar : collector.en}</p>
                <p className="mt-0.5 text-[8px] font-mono-code text-slate-500" dir="ltr">{collector.id}</p>
              </div>
            ))}
            <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-2.5">
              <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-fuchsia-400">
                <BrainCircuit className="h-3 w-3" aria-hidden="true" />
                {isAr ? 'خلية عصبية' : 'Neural cell'}
              </p>
              <p className="mt-1 text-[10px] font-bold leading-4 text-slate-100">{isAr ? cell.ar : cell.en}</p>
              <p className="mt-0.5 text-[8px] font-mono-code text-slate-500" dir="ltr">{cell.id}</p>
            </div>
          </div>
        </div>

        {/* the reviewed seed records for this department */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono-code uppercase tracking-[0.2em] text-slate-500">
            {isAr ? `السجلات الموثقة (${records.length} — ${reviewed} معتمد)` : `Documented records (${records.length} — ${reviewed} reviewed)`}
          </p>
          {records.map(record => (
            <RecordCard key={record.id} record={record} isAr={isAr} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* --------------------------- 3 · روبوتات الجمع ----------------------------- */

export const CollectTab: React.FC<{
  isAr: boolean;
  departmentId: string;
  onSelectDepartment: (id: string) => void;
  collectors: UniversityAgent[];
  collectorId: string;
  onSelectCollector: (id: string) => void;
  focus: string;
  onFocusChange: (value: string) => void;
  collecting: boolean;
  result: UniversityCollectResponse | null;
  error: string | null;
  origin: 'gateway' | 'local' | null;
  onRun: () => void;
}> = ({ isAr, departmentId, onSelectDepartment, collectors, collectorId, onSelectCollector, focus, onFocusChange, collecting, result, error, origin, onRun }) => {
  const stages = [
    { ar: 'العميد يوجّه المهمة', en: 'Rector routes the mission' },
    { ar: 'روبوت الجمع يتصفح الويب الموثق', en: 'Collector searches the documented web' },
    { ar: 'المُنظِّم يكلّف أكواد الأرشفة', en: 'Organiser assigns archive codes' },
    { ar: 'السجلات تدخل «قيد المراجعة»', en: 'Records land as «pending review»' },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className={`${cardClass} h-fit`}>
        <h3 className="flex items-center gap-2 text-sm font-black text-white">
          <Radar className="h-5 w-5 text-sky-400" aria-hidden="true" />
          {isAr ? 'غرفة قيادة روبوت الجمع' : 'Collector mission control'}
        </h3>
        <DepartmentSelect isAr={isAr} value={departmentId} onChange={onSelectDepartment} label={isAr ? '١ · القسم المستهدف' : '1 · Target department'} />
        <fieldset className="space-y-1.5">
          <legend className="text-[11px] font-bold text-slate-400">{isAr ? '٢ · روبوت الجمع المُكلَّف' : '2 · Assigned collector robot'}</legend>
          <div className="grid gap-1.5">
            {collectors.map(collector => (
              <label key={collector.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 transition ${collectorId === collector.id ? 'border-sky-400/60 bg-sky-400/10' : 'border-[#29315b] bg-[#0b0d1e] hover:border-sky-400/30'}`}>
                <input type="radio" name="collector" className="mt-1 accent-sky-400" checked={collectorId === collector.id} onChange={() => onSelectCollector(collector.id)} />
                <span>
                  <span className="block text-[10px] font-bold leading-4 text-slate-100">{isAr ? collector.ar : collector.en}</span>
                  <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">{isAr ? collector.mandateAr : collector.mandateEn}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400">{isAr ? '٣ · التركيز (اختياري)' : '3 · Focus (optional)'}</span>
          <input type="text" value={focus} onChange={event => onFocusChange(event.target.value)} maxLength={400} placeholder={isAr ? 'مثال: الحماية الكاثودية للأنابيب المدفونة في التربة المالحة' : 'e.g. cathodic protection of buried pipelines in saline soil'} className={inputClass} />
        </label>
        <button
          type="button"
          onClick={onRun}
          disabled={collecting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/60 bg-sky-500/20 px-4 py-3 text-xs font-black text-sky-200 transition hover:bg-sky-500/30 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
        >
          {collecting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Radar className="h-5 w-5" aria-hidden="true" />}
          {collecting ? (isAr ? 'روبوت الجمع يعمل عبر الإنترنت…' : 'Collector is sweeping the web…') : (isAr ? 'شغّل روبوت الجمع من الإنترنت' : 'Run the internet collector')}
        </button>
        {/* pipeline */}
        <ol className="space-y-1 pt-1" aria-label={isAr ? 'مراحل الرحلة' : 'Mission stages'}>
          {stages.map((stage, index) => (
            <li key={stage.en} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[9px] leading-4 ${collecting ? 'border-sky-400/30 text-sky-300 animate-pulse' : 'border-[#232a4e] text-slate-500'}`} style={{ animationDelay: `${index * 160}ms` }}>
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current font-mono-code text-[8px]">{index + 1}</span>
              {isAr ? stage.ar : stage.en}
            </li>
          ))}
        </ol>
        <p className="text-[9px] leading-4 text-slate-500">
          {isAr
            ? 'البحث الحي قد يستغرق حتى دقيقة. كل ما يعود يُوسم «قيد المراجعة» — لا سجل يُعتمد بلا مختص.'
            : 'Live search can take up to a minute. Everything that comes back is tagged «pending review» — nothing is approved without a specialist.'}
        </p>
      </div>

      {/* results */}
      <div className="space-y-3">
        {error && (
          <div role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-[11px] leading-6 text-red-200">
            {error}
          </div>
        )}
        {!result && !error && (
          <div className="rounded-2xl border border-dashed border-[#303961] p-8 text-center">
            <Radar className="mx-auto h-10 w-10 text-slate-700" aria-hidden="true" />
            <p className="mt-3 text-xs text-slate-500">{isAr ? 'لم تعمل أي مهمة جمع بعد — اختر القسم والروبوت واضغط التشغيل.' : 'No collection mission yet — pick a department and a collector, then run it.'}</p>
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#29315b] bg-[#10132b] p-3">
              {result.mode === 'live' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isAr ? 'نموذج حي عبر الإنترنت + بحث Google' : 'Live model + Google Search grounding'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">
                  {isAr ? 'أرشيف موثق (لا بوابة على هذه النسخة)' : 'Reviewed archive (no gateway on this build)'}
                </span>
              )}
              <span className="text-[10px] font-mono-code text-slate-500" dir="ltr">{result.collectorId}</span>
              {origin === 'local' && <span className="text-[9px] text-slate-500">{isAr ? '(نسخة محلية ثابتة)' : '(static local copy)'}</span>}
              {result.persisted ? (
                <span className="text-[10px] font-bold text-emerald-400">{isAr ? '✓ حُفظت في الأرشيف الحي على الخادم' : '✓ Persisted to the server-side archive'}</span>
              ) : (
                <span className="text-[10px] text-slate-500">{isAr ? 'لم تُحفظ على خادم' : 'Not persisted to a server'}</span>
              )}
            </div>
            <p className="rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3 text-[11px] leading-6 text-slate-300">
              {isAr ? result.message.ar : result.message.en}
            </p>
            {result.records.map(record => (
              <RecordCard key={record.id} record={record} isAr={isAr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------- 4 · الخلايا العصبية ---------------------------- */

export const NeuralTab: React.FC<{
  isAr: boolean;
  departmentId: string;
  onSelectDepartment: (id: string) => void;
  cell: UniversityAgent;
  synthesizing: boolean;
  result: UniversitySynthesizeResponse | null;
  error: string | null;
  onRun: () => void;
}> = ({ isAr, departmentId, onSelectDepartment, cell, synthesizing, result, error, onRun }) => (
  <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
    <div className={`${cardClass} h-fit`}>
      <h3 className="flex items-center gap-2 text-sm font-black text-white">
        <BrainCircuit className="h-5 w-5 text-fuchsia-400" aria-hidden="true" />
        {isAr ? 'الخلية العصبية — غرفة المذاكرة' : 'The Neural Cell — digest chamber'}
      </h3>
      <DepartmentSelect isAr={isAr} value={departmentId} onChange={onSelectDepartment} label={isAr ? '١ · القسم المُذاكَر' : '1 · Department to digest'} />
      <article className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-3 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">{isAr ? 'هويتي المهنية' : 'Cell mandate'}</p>
        <p className="text-[11px] leading-6 text-slate-300">{isAr ? cell.mandateAr : cell.mandateEn}</p>
        <p className="text-[9px] font-mono-code text-slate-500" dir="ltr">{cell.id}</p>
      </article>
      <div className="rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isAr ? 'كيف تذاكر الخلية (خوارزمية صريحة)' : 'How the cell digests (an explicit algorithm)'}</p>
        <ol className="mt-1.5 list-decimal space-y-1 ps-5 text-[10px] leading-5 text-slate-300">
          <li>{isAr ? 'تطبيع المفاتيح: تُوحَّد عناوين السجلات وتُستخرج بصمتها للبحث عن التكرار.' : 'Key normalisation: titles are canonicalised and fingerprinted to find duplicates.'}</li>
          <li>{isAr ? 'دمج المكرر: تُجمع النقاط والمصادر بلا تكرار، ويُرفع رقم الإصدار إلزاميًا.' : 'Duplicate merge: key points and sources are unioned, version is always bumped.'}</li>
          <li>{isAr ? 'كل ما تغيّر محتوىً يعود «قيد المراجعة» — لا اعتماد آلي أبدًا.' : 'Anything whose content changed returns to «pending review» — never auto-approved.'}</li>
        </ol>
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={synthesizing}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-400/60 bg-fuchsia-500/20 px-4 py-3 text-xs font-black text-fuchsia-200 transition hover:bg-fuchsia-500/30 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
      >
        {synthesizing ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <BrainCircuit className="h-5 w-5" aria-hidden="true" />}
        {synthesizing ? (isAr ? 'الخلية تذاكر…' : 'The cell is digesting…') : (isAr ? 'شغّل الخلية العصبية لهذا القسم' : 'Run this department’s neural cell')}
      </button>
      <p className="text-[9px] leading-4 text-slate-500">
        {isAr
          ? 'المذاكرة دالة حتمية تعمل بلا إنترنت وبلا رصيد — البوابة الحية تثري الصياغة فقط عندما تكون مهيأة.'
          : 'The digest is a deterministic function — no internet, no quota. A live gateway only enriches phrasing when configured.'}
      </p>
    </div>
    <div className="space-y-3">
      {error && <div role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-[11px] leading-6 text-red-200">{error}</div>}
      {!result && !error && (
        <div className="rounded-2xl border border-dashed border-[#303961] p-8 text-center">
          <BrainCircuit className="mx-auto h-10 w-10 text-slate-700" aria-hidden="true" />
          <p className="mt-3 text-xs text-slate-500">{isAr ? 'لم تذاكر الخلية أي دفعة بعد.' : 'The cell has not digested a batch yet.'}</p>
        </div>
      )}
      {result && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/5 p-4">
            <span className="font-mono-code text-3xl font-black text-fuchsia-300">{result.mergedCount}</span>
            <div>
              <p className="text-[10px] font-bold text-slate-300">{isAr ? 'مجموعات مكررة دُمجت' : 'duplicate groups merged'}</p>
              <p className="text-[9px] text-slate-500">{isAr ? (result.persisted ? 'حُفظت النسخ المدموجة على الخادم' : 'لم تُحفظ على خادم (نسخة محلية)') : (result.persisted ? 'Merged copies persisted server-side' : 'Not persisted (local copy)')}</p>
            </div>
            <p className="w-full text-[11px] leading-6 text-slate-300">{isAr ? result.message.ar : result.message.en}</p>
          </div>
          {result.changes.length > 0 && (
            <ol className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#232a4e] bg-[#05061a] p-3 font-mono-code text-[9px] leading-5 text-slate-400" dir="auto">
              {result.changes.slice(0, 40).map((change, index) => (
                <li key={`${index}-${change.recordId}`}>
                  <span className={change.kind === 'merged' ? 'text-fuchsia-300' : 'text-slate-500'}>[{change.kind}]</span>{' '}
                  {isAr ? change.detailAr : change.detailEn}
                </li>
              ))}
            </ol>
          )}
          {result.records.map(record => (
            <RecordCard key={record.id} record={record} isAr={isAr} compact />
          ))}
        </div>
      )}
    </div>
  </div>
);

/* --------------------------- 5 · الأرشيف العلمي ---------------------------- */

export const ArchiveTab: React.FC<{
  isAr: boolean;
  records: KnowledgeRecord[];
  stats: KnowledgeStats;
  query: string;
  onQueryChange: (value: string) => void;
  dept: string;
  onDeptChange: (value: string) => void;
  statusFilter: 'all' | 'reviewed' | 'pending-review';
  onStatusFilterChange: (value: 'all' | 'reviewed' | 'pending-review') => void;
  organizing: boolean;
  organizeResult: UniversityOrganizeResponse | null;
  organizeError: string | null;
  onOrganize: () => void;
  filtered: KnowledgeRecord[];
}> = ({ isAr, stats, query, onQueryChange, dept, onDeptChange, statusFilter, onStatusFilterChange, organizing, organizeResult, organizeError, onOrganize, filtered }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h3 className="flex items-center gap-2 text-sm font-black text-white">
          <ArchiveRestore className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          {isAr ? '«المُنظِّم» — روبوت التنظيم والهيكلة والأرشفة' : '“The Organiser” — structuring & archiving robot'}
        </h3>
        <p className="mt-1 text-[11px] leading-6 text-slate-400">
          {isAr
            ? 'يحوّل كل سجل خام إلى بطاقة أرشفة علمية: كود ثابت INSCO-IND-…، تصنيف بالقسم، فحص استشهادات HTTPS، كشف التكرار، وقياس الاكتمال — ثم الفهرسة القابلة للبحث.'
            : 'Turns every raw record into a scientific archive card: stable INSCO-IND-… code, department classification, HTTPS citation audit, duplicate detection, completeness scoring — then a searchable index.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onOrganize}
        disabled={organizing}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-4 py-2.5 text-[11px] font-black text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-wait disabled:opacity-70 cursor-pointer whitespace-nowrap"
      >
        {organizing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArchiveRestore className="h-4 w-4" aria-hidden="true" />}
        {organizing ? (isAr ? 'المُنظِّم يعمل…' : 'The Organiser runs…') : (isAr ? 'شغّل روبوت التنظيم والهيكلة' : 'Run the Organising robot')}
      </button>
    </div>

    {/* live organisation report */}
    {organizeError && <div role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-[11px] leading-6 text-red-200">{organizeError}</div>}
    {organizeResult && (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 space-y-2">
        <p className="text-[11px] leading-6 text-emerald-100">{organizeResult.message[isAr ? 'ar' : 'en']}</p>
        <p className="text-[10px] font-mono-code text-emerald-300/80">
          {isAr ? 'أكواد أُسندت' : 'codes assigned'}: {organizeResult.codesAssigned} · {isAr ? 'أكواد ثبتت' : 'codes kept'}: {organizeResult.codesKept} · {isAr ? 'إجراءات' : 'actions'}: {organizeResult.actions.length}
        </p>
        <ol className="max-h-40 space-y-1 overflow-y-auto font-mono-code text-[9px] leading-5 text-slate-400" dir="auto">
          {organizeResult.actions.slice(0, 30).map((action, index) => (
            <li key={`${index}-${action.recordId}`}><span className="text-emerald-400">[{action.kind}]</span> {isAr ? action.detailAr : action.detailEn}</li>
          ))}
        </ol>
      </div>
    )}

    {/* derived statistics */}
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {[
        { v: stats.total, ar: 'إجمالي السجلات', en: 'total records' },
        { v: stats.reviewed, ar: 'معتمد', en: 'reviewed' },
        { v: stats.pendingReview, ar: 'قيد المراجعة', en: 'pending' },
        { v: `${stats.avgCompleteness}%`, ar: 'متوسط الاكتمال', en: 'avg completeness' },
        { v: stats.validHttpsSources, ar: 'استشهادات HTTPS', en: 'HTTPS citations' },
        { v: stats.byDepartment.length, ar: 'أقسام مفهرسة', en: 'departments indexed' },
      ].map(item => (
        <div key={item.en} className="rounded-xl border border-[#29315b] bg-[#10132b] px-3 py-2 text-center">
          <dd className="font-mono-code text-lg font-black text-emerald-300">{item.v}</dd>
          <dt className="mt-0.5 text-[9px] leading-3 text-slate-500">{isAr ? item.ar : item.en}</dt>
        </div>
      ))}
    </dl>

    {/* search & filters */}
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder={isAr ? 'ابحث في الأرشيف… (كود، عنوان، مصطلح، ناشر)' : 'Search the archive… (code, title, term, publisher)'} className={`${inputClass} ps-9`} aria-label={isAr ? 'بحث في الأرشيف' : 'Search the archive'} />
      </label>
      <div className="flex gap-2">
        <select value={dept} onChange={event => onDeptChange(event.target.value)} className={`${inputClass} w-auto`} aria-label={isAr ? 'تصفية بالقسم' : 'Filter by department'}>
          <option value="all">{isAr ? 'كل الأقسام' : 'All departments'}</option>
          {UNIVERSITY_DEPARTMENTS.map(department => (
            <option key={department.id} value={department.id}>{department.code} — {isAr ? department.ar : department.en}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={event => onStatusFilterChange(event.target.value as typeof statusFilter)} className={`${inputClass} w-auto`} aria-label={isAr ? 'تصفية بالحالة' : 'Filter by status'}>
          <option value="all">{isAr ? 'كل الحالات' : 'All statuses'}</option>
          <option value="reviewed">{isAr ? 'معتمد فقط' : 'Reviewed only'}</option>
          <option value="pending-review">{isAr ? 'قيد المراجعة' : 'Pending review'}</option>
        </select>
      </div>
    </div>

    {/* the scientific index */}
    <div className="overflow-hidden rounded-2xl border border-[#29315b]">
      <div className="hidden grid-cols-[130px_1fr_64px_92px_72px_110px] gap-2 border-b border-[#29315b] bg-[#10132b] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 md:grid">
        <span>{isAr ? 'الكود' : 'Code'}</span>
        <span>{isAr ? 'السجل' : 'Record'}</span>
        <span>{isAr ? 'القسم' : 'Dept'}</span>
        <span>{isAr ? 'الحالة' : 'Status'}</span>
        <span>{isAr ? 'الإصدار' : 'Ver'}</span>
        <span>{isAr ? 'الاكتمال' : 'Complete'}</span>
      </div>
      <ul className="divide-y divide-[#1d2342] bg-[#0b0d1e]">
        {filtered.slice(0, 60).map(record => {
          const completeness = recordCompleteness(record);
          return (
            <li key={record.id} className="grid grid-cols-1 gap-1 px-3 py-2 md:grid-cols-[130px_1fr_64px_92px_72px_110px] md:items-center md:gap-2">
              <code dir="ltr" className="font-mono-code text-[9px] font-bold text-amber-300">{record.code}</code>
              <span className="text-[10px] leading-4 text-slate-200">{isAr ? record.titleAr : record.titleEn}</span>
              <span className="text-[9px] font-mono-code text-slate-500">{UNIVERSITY_DEPARTMENTS.find(d => d.id === record.departmentId)?.code}</span>
              <StatusBadge status={record.status} isAr={isAr} />
              <span className="font-mono-code text-[9px] text-slate-500">v{record.version}</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#232a4e]">
                  <span className={`block h-full ${completeness >= 84 ? 'bg-emerald-400' : completeness >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${completeness}%` }} />
                </span>
                <span className="font-mono-code text-[9px] text-slate-500">{completeness}%</span>
              </span>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-[11px] text-slate-500">{isAr ? 'لا توجد سجلات مطابقة لبحثك.' : 'No records match your search.'}</li>
        )}
      </ul>
    </div>
    <p className="text-[9px] text-slate-500">
      {isAr
        ? `يعرض ${Math.min(filtered.length, 60)} من ${filtered.length} سجلًا مطابقًا. الأرشيف الحي (المجموع من الإنترنت) محفوظ على الخادم المستضيف؛ على النسخة الثابتة تُفهرس البذور الموثقة فقط.`
        : `Showing ${Math.min(filtered.length, 60)} of ${filtered.length} matching records. The runtime archive lives on the hosting server; the static build indexes the reviewed seed only.`}
    </p>
  </div>
);

/* ------------------------------ 6 · المعمل --------------------------------- */

export const LabTab: React.FC<{
  isAr: boolean;
  departmentId: string;
  onSelectDepartment: (id: string) => void;
  target: string;
  onTargetChange: (id: string) => void;
  teaching: boolean;
  pack: LabTeachingPack | null;
  origin: 'gateway' | 'local' | null;
  error: string | null;
  onGenerate: () => void;
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
}> = ({ isAr, departmentId, onSelectDepartment, target, onTargetChange, teaching, pack, origin, error, onGenerate, onCopy, copied, onDownload }) => (
  <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
    <div className={`${cardClass} h-fit`}>
      <h3 className="flex items-center gap-2 text-sm font-black text-white">
        <Microscope className="h-5 w-5 text-violet-400" aria-hidden="true" />
        {isAr ? 'المعمل — وحدة تعليم وكلاء الذكاء الاصطناعي' : 'The Lab — AI-agent teaching unit'}
      </h3>
      <article className="rounded-xl border border-violet-400/25 bg-violet-400/5 p-3">
        <p className="text-[11px] leading-6 text-slate-300">
          {isAr
            ? 'المعمل لا يخترع وكلاء جددًا — يأخذ المعرفة المعتمدة من الأرشيف ويحوّلها إلى «حزمة تعليم وكيل»: ديباجة نظام + خلاصة علمية + أسئلة مراقبة وحدود — تُراجع بشريًا ثم تُحقن في وكيل منصة INSCO المختار.'
            : 'The Lab invents no new agents — it lifts approved knowledge from the archive into an «agent teaching pack»: a system preamble + scientific digest + evaluation Q&A and guardrails — reviewed by a human, then injected into the chosen INSCO platform agent.'}
        </p>
      </article>
      <DepartmentSelect isAr={isAr} value={departmentId} onChange={onSelectDepartment} label={isAr ? '١ · القسم المُعلِّم' : '1 · Subject department'} />
      <label className="block space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400">{isAr ? '٢ · الوكيل المُتعلِّم' : '2 · Student agent'}</span>
        <select value={target} onChange={event => onTargetChange(event.target.value)} className={inputClass}>
          {PLATFORM_AGENT_TARGETS.map(item => (
            <option key={item.id} value={item.id}>{isAr ? item.ar : item.en}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={onGenerate}
        disabled={teaching}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/60 bg-violet-500/20 px-4 py-3 text-xs font-black text-violet-200 transition hover:bg-violet-500/30 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
      >
        {teaching ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-5 w-5" aria-hidden="true" />}
        {teaching ? (isAr ? 'المعمل يجهّز الحزمة…' : 'The Lab is assembling the pack…') : (isAr ? 'ولّد حزمة تعليم الوكيل' : 'Generate the teaching pack')}
      </button>
      <p className="text-[9px] leading-4 text-slate-500">
        {isAr
          ? 'التوليد حتمي من الأرشيف الموثق — لا يستهلك رصيد الذكاء الاصطناعي، ويعمل على النسخة الثابتة أيضًا. كل حزمة «مبدئية» حتى توقيع مختص الأرشيف.'
          : 'Generation is deterministic over the reviewed archive — no AI quota consumed, works on the static build too. Every pack is «draft» until the archive specialist signs it.'}
      </p>
    </div>

    <div className="space-y-3">
      {error && <div role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-[11px] leading-6 text-red-200">{error}</div>}
      {!pack && !error && (
        <div className="rounded-2xl border border-dashed border-[#303961] p-8 text-center">
          <Microscope className="mx-auto h-10 w-10 text-slate-700" aria-hidden="true" />
          <p className="mt-3 text-xs text-slate-500">{isAr ? 'اختر القسم والوكيل ثم ولّد الحزمة.' : 'Pick a department and an agent, then generate the pack.'}</p>
        </div>
      )}
      {pack && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-400/5 p-3">
            <code dir="ltr" className="rounded-md bg-[#161a35] px-2 py-1 font-mono-code text-[10px] font-bold text-violet-300">{pack.packId}</code>
            <span className="text-[10px] text-slate-400">{isAr ? `${pack.departmentLabel.ar} → ${pack.targetLabel.ar}` : `${pack.departmentLabel.en} → ${pack.targetLabel.en}`}</span>
            {origin === 'local' && <span className="text-[9px] text-slate-500">{isAr ? '(مولّدة محليًا)' : '(built locally)'}</span>}
            <span className="ms-auto flex gap-1.5">
              <button type="button" onClick={onCopy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#303961] bg-[#10132b] px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition hover:border-violet-400/50 hover:text-violet-200 cursor-pointer">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copied ? (isAr ? 'نُسخ!' : 'Copied!') : (isAr ? 'نسخ Markdown' : 'Copy Markdown')}
              </button>
              <button type="button" onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-lg border border-[#303961] bg-[#10132b] px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition hover:border-violet-400/50 hover:text-violet-200 cursor-pointer">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                .md
              </button>
            </span>
          </div>

          <section className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-300">{isAr ? 'ديباجة النظام' : 'System preamble'}</h4>
            <p className="mt-1.5 text-[11px] leading-6 text-slate-200">{pack.preamble.ar}</p>
            <p className="mt-1 border-t border-[#1d2342] pt-1.5 text-[10px] leading-5 text-slate-500" dir="ltr">{pack.preamble.en}</p>
          </section>

          <section className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-300">{isAr ? `الخلاصة العلمية (${pack.digest.length} مقطعًا)` : `Scientific digest (${pack.digest.length} entries)`}</h4>
            <ul className="mt-1.5 space-y-1.5">
              {pack.digest.map((line, index) => (
                <li key={index} className="text-[10px] leading-5 text-slate-300">{line}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-300">{isAr ? `أسئلة مراقبة (${pack.qaPairs.length})` : `Evaluation Q&A (${pack.qaPairs.length})`}</h4>
            <div className="mt-1.5 space-y-2">
              {pack.qaPairs.map((pair, index) => (
                <details key={index} className="rounded-lg border border-[#1d2342] bg-[#05061a] p-2.5">
                  <summary className="cursor-pointer text-[10px] font-bold leading-5 text-slate-200">س{index + 1}. {pair.questionAr}</summary>
                  <div className="mt-1.5 space-y-1 border-t border-[#1d2342] pt-1.5 text-[9px] leading-5 text-slate-400">
                    <p dir="ltr" className="text-slate-500">{pair.questionEn}</p>
                    <p className="whitespace-pre-line text-slate-300">{pair.answerAr}</p>
                    <p className="whitespace-pre-line" dir="ltr">{pair.answerEn}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3">
            <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{isAr ? 'الحدود والأمانات' : 'Guardrails'}</h4>
            <ul className="mt-1.5 list-disc space-y-1 ps-5 text-[10px] leading-5 text-slate-300">
              {pack.guardrails.map((guard, index) => (
                <li key={index}>{guard.ar}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#232a4e] bg-[#0b0d1e] p-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-300">{isAr ? 'المصادر الموثقة' : 'Documented sources'}</h4>
            <SourceList sources={pack.sources} />
          </section>

          <p className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-[10px] leading-6 text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{pack.honestNote.ar}<br /><span className="text-amber-200/70">{pack.honestNote.en}</span></span>
          </p>
        </div>
      )}
    </div>
  </div>
);
