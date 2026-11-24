import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Bot, Braces, CircuitBoard, Clipboard, Download, GitBranch, Inbox, Layers3, LockKeyhole, Play, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { adminClient, AdminApiError } from '../../admin/client';
import {
  DEFAULT_FACTORY_NEURON, FACTORY_CELLS, FACTORY_CELL_COPY, FACTORY_LIMITS, FACTORY_OUTPUTS, FACTORY_SAMPLES,
  FACTORY_TASKS, FACTORY_TRIGGERS, factoryBundle, normaliseFactoryRequest, simulateFactory,
  type FactoryCell, type FactoryCellKind, type FactoryDraft, type FactoryNeuron, type FactoryOutput, type FactoryRequest,
  type FactorySample, type FactorySnapshot, type FactoryTask, type FactoryTrace, type FactoryTrigger,
} from '../../admin/factory';
import { FACTORY_LANGUAGES, FACTORY_OUTPUT_COPY, FACTORY_TASK_COPY, FACTORY_TRIGGER_COPY, cellLabel, localFactoryDraft, starterCells } from '../../admin/factoryTemplates';
import type { Language } from '../../types';
import { AdminMessage, adminError, numberText, shortDate } from './AdminUi';

interface FactoryProps {
  language: Language;
  snapshot: FactorySnapshot;
  aiConfigured: boolean;
  active?: boolean;
  onSessionError: (error: unknown) => boolean;
}
interface Prepared {
  source: 'template' | 'ai';
  signature: string;
  input: FactoryRequest;
  cells: FactoryCell[];
  draft: FactoryDraft;
}
const outputIcon = { scenario: GitBranch, block: Braces, bot: Bot, neuron: CircuitBoard };
const cellIcon = { input: Inbox, rule: GitBranch, neuron: CircuitBoard, draft: Layers3 };
const traceCopy: Record<FactoryTrace['state'], { ar: string; en: string }> = {
  read: { ar: 'قُرئت العيّنة', en: 'Sample read' },
  flagged: { ar: 'متابعة مقترحة', en: 'Follow-up suggested' },
  clear: { ar: 'لا إشارة متابعة', en: 'No follow-up signal' },
  drafted: { ar: 'مسودة داخلية مقترحة', en: 'Internal draft proposed' },
  no_input: { ar: 'أضف القراءة قبل هذه الخطوة', en: 'Read a signal before this step' },
  review: { ar: 'بانتظار مراجعة المشرف', en: 'Waiting for human review' },
};

function failureText(error: unknown, language: Language) {
  if (error instanceof AdminApiError) {
    const ar = language === 'ar';
    switch (error.code) {
      case 'factory_not_configured': return ar ? 'التوليد بالذكاء غير مهيّأ على الخادم. القوالب المحلية متاحة.' : 'AI drafting is not configured on the server. Local templates are available.';
      case 'factory_invalid_request': return ar ? 'راجع الوصف واللغة والخطوات قبل التوليد.' : 'Check the brief, language and steps before drafting.';
      case 'factory_invalid_draft': return ar ? 'ردّ النموذج لم يطابق صيغة المسودة. جرّب وصفًا أقصر أو استخدم قالبًا محليًا.' : 'The model returned an invalid draft. Try a shorter brief or a local template.';
      case 'factory_timeout': return ar ? 'استغرق التوليد وقتًا طويلًا. تقدر تجرّب تاني أو تستخدم قالبًا محليًا.' : 'Drafting timed out. Retry or use a local template.';
      case 'factory_unavailable': return ar ? 'تعذّر اتصال المصنع بالنموذج. لم تتغيّر المسودة الحالية.' : 'The factory could not reach the model. Your current draft was not changed.';
    }
  }
  return adminError(error, language);
}

function NeuronControls({ language, neuron, onChange }: { language: Language; neuron: FactoryNeuron; onChange: (neuron: FactoryNeuron) => void }) {
  const ar = language === 'ar';
  const fields = [
    { id: 'queueWeight', label: ar ? 'وزن الطلبات الجديدة' : 'New requests weight', min: -3, max: 3 },
    { id: 'delayWeight', label: ar ? 'وزن التأخير' : 'Overdue weight', min: -3, max: 3 },
    { id: 'bias', label: ar ? 'الانحياز' : 'Bias', min: -3, max: 3 },
    { id: 'threshold', label: ar ? 'عتبة المتابعة' : 'Review threshold', min: 0, max: 1 },
  ] as const;
  return <details className="factory-neuron">
    <summary>{ar ? 'ضبط الخلية التجريبية' : 'Tune the sample neuron'}</summary>
    <div className="factory-neuron-grid">
      {fields.map(({ id, label, min, max }) => <label key={id}>{label}
        <div><input type="range" min={min} max={max} step={.05} value={neuron[id]}
          onChange={event => onChange({ ...neuron, [id]: event.target.valueAsNumber })} />
        <output dir="ltr">{neuron[id].toFixed(2)}</output></div>
      </label>)}
    </div>
    <p>{ar ? 'نوزن إشارتين، نجمعهما، ونحوّل الناتج إلى درجة بين ٠ و١. لا يوجد تدريب أو قرار تلقائي.' : 'Two weighted sample signals are combined into a score from 0 to 1. No training or automatic decision.'}</p>
  </details>;
}

export default function AdminFactory({ language, snapshot, aiConfigured, active = true, onSessionError }: FactoryProps) {
  const ar = language === 'ar';
  const t = (arabic: string, english: string) => ar ? arabic : english;
  const heading = useId();
  const [task, setTask] = useState<FactoryTask>('inbox');
  const [output, setOutput] = useState<FactoryOutput>('bot');
  const [trigger, setTrigger] = useState<FactoryTrigger>('daily');
  const [programming, setProgramming] = useState('TypeScript');
  const [otherLanguage, setOtherLanguage] = useState('');
  const [brief, setBrief] = useState('');
  const [includeSnapshot, setIncludeSnapshot] = useState(false);
  const [cells, setCells] = useState<FactoryCell[]>(() => starterCells('inbox'));
  const [nextKind, setNextKind] = useState<FactoryCellKind>('neuron');
  const [sample, setSample] = useState<FactorySample>('busy');
  const [showTrace, setShowTrace] = useState(false);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  const selectedLanguage = programming === 'other' ? otherLanguage : programming;
  const rawInput = { task, output, trigger, locale: language, language: selectedLanguage, brief, includeSnapshot, cells: cells.map(cell => cell.kind) };
  const signature = (steps: FactoryCell[]) => JSON.stringify({ ...rawInput, cells: steps });
  const stale = prepared !== null && prepared.signature !== signature(cells);
  const trace = showTrace ? simulateFactory(cells, task, sample) : [];

  useEffect(() => () => inflight.current?.abort(), []);
  useEffect(() => {
    if (!active && inflight.current) {
      inflight.current.abort();
      inflight.current = null;
      setPending(false);
    }
  }, [active]);

  const designCell = (kind: FactoryCellKind, label = ''): FactoryCell => ({
    id: `cell-${++sequence.current}`, kind, label, ...(kind === 'neuron' ? { neuron: { ...DEFAULT_FACTORY_NEURON } } : {}),
  });
  function chooseOutput(next: FactoryOutput) {
    setOutput(next);
    if (next === 'neuron' && !cells.some(cell => cell.kind === 'neuron') && cells.length < FACTORY_LIMITS.cells) {
      const added = designCell('neuron');
      setCells(current => {
        const index = current.findIndex(cell => cell.kind === 'draft');
        return index < 0 ? [...current, added] : [...current.slice(0, index), added, ...current.slice(index)];
      });
    }
  }
  function moveCell(index: number, delta: -1 | 1) {
    setCells(current => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function updateCell(id: string, changes: Partial<Pick<FactoryCell, 'label' | 'neuron'>>) {
    setCells(current => current.map(cell => cell.id === id ? { ...cell, ...changes } : cell));
  }
  function cancelDraft() {
    inflight.current?.abort();
    inflight.current = null;
    setPending(false);
    setNotice(t('تم إيقاف انتظار المسودة.', 'Stopped waiting for the draft.'));
  }
  async function generate(source: Prepared['source']) {
    if (!active || inflight.current) return;
    setNotice('');
    setProblem('');
    const input = normaliseFactoryRequest(rawInput, source === 'ai');
    if (!input) {
      setProblem(t('حدّد لغة صحيحة وخطوة واحدة على الأقل. للتوليد بالذكاء اكتب هدفًا لا يقل عن ٨ أحرف.', 'Choose a valid language and at least one cell. AI drafting needs a brief of at least 8 characters.'));
      return;
    }
    const seed = { input, cells, signature: signature(cells), source };
    if (source === 'template') {
      setPrepared({ ...seed, draft: localFactoryDraft(input, cells) });
      return;
    }
    const controller = new AbortController();
    inflight.current = controller;
    setPending(true);
    try {
      const draft = await adminClient.factoryDraft(input, controller.signal);
      if (!controller.signal.aborted) setPrepared({ ...seed, draft });
    } catch (error) {
      if (!controller.signal.aborted && !onSessionError(error)) setProblem(failureText(error, language));
    } finally {
      if (inflight.current === controller) { inflight.current = null; setPending(false); }
    }
  }
  function applySteps() {
    if (!prepared || stale || !prepared.draft.steps.length) return;
    const next = prepared.draft.steps.map(({ kind, label }) => designCell(kind, label));
    setCells(next);
    setShowTrace(false);
    setPrepared({ ...prepared, cells: next, input: { ...prepared.input, cells: next.map(cell => cell.kind) }, signature: signature(next) });
    setNotice(t('تم اعتماد ترتيب الخطوات في المسودة فقط.', 'The suggested steps are now in your draft.'));
  }
  function download() {
    if (!prepared || stale) return;
    const exportCells = prepared.cells.map(cell => ({ ...cell, label: cellLabel(cell, prepared.input.locale) }));
    const bundle = factoryBundle(prepared.input, exportCells, prepared.draft, prepared.source);
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `insco-${prepared.input.output}-draft.json`;
    try { anchor.click(); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  async function copy() {
    if (!prepared?.draft.code || stale) return;
    try {
      await navigator.clipboard.writeText(prepared.draft.code);
      setNotice(t('اتنسخ الكود. راجعه قبل الاستخدام.', 'Code copied. Review it before use.'));
    } catch {
      setNotice(t('النسخ التلقائي غير متاح؛ حدّد الكود وانسخه يدويًا.', 'Clipboard unavailable; select the code to copy it manually.'));
    }
  }

  return <div className="factory-studio" aria-labelledby={heading}>
    <section className="factory-hero">
      <div className="factory-hero-intro">
        <span className="factory-kicker"><CircuitBoard size={15} aria-hidden="true" /> INSCO / BUILD STUDIO</span>
        <h2 id={heading}>{t('من مهمة متابعة إلى حل برمجي', 'Turn an operations task into a build plan')}</h2>
        <p>{t('صمّم الخطوات، جرّبها بعيّنة، وصدّر مسودة كود أو روبوت للمراجعة.', 'Compose steps, rehearse them with a sample, and export a code or bot draft for review.')}</p>
        <span className="factory-badge"><ShieldCheck size={14} aria-hidden="true" />{t('مسودات فقط · بدون تشغيل أو نشر', 'Drafts only · no execution or deployment')}</span>
      </div>
      <div className="factory-snapshot">
        <div><strong>{t('لقطة متابعة الموقع', 'Site operations snapshot')}</strong><time dateTime={snapshot.capturedAt}>{shortDate(snapshot.capturedAt, language, { dateStyle: 'short', timeStyle: 'short' })}</time></div>
        <dl>
          {[[t('جديدة', 'New'), snapshot.newRequests], [t('قيد المتابعة', 'In follow-up'), snapshot.inProgress], [t('متأخرة', 'Overdue'), snapshot.overdue]].map(([label, value], i) =>
            <div key={label} className={i === 2 && snapshot.overdue > 0 ? 'factory-metric-attention' : ''}><dt>{label}</dt><dd>{numberText(Number(value), language)}</dd></div>)}
        </dl>
        <p><span className="ad-dot" />{snapshot.announcementEnabled ? t('إعلان الموقع ظاهر', 'Site announcement visible') : t('إعلان الموقع مخفي', 'Site announcement hidden')}</p>
      </div>
    </section>

    <div className="factory-grid">
      <section className="ad-panel factory-brief">
        <div className="factory-panel-head"><span>01</span><div><h2>{t('موجز العمل', 'Work brief')}</h2><p>{t('اختار مهمة ومخرجها.', 'Choose a task and its deliverable.')}</p></div></div>
        <fieldset><legend>{t('المهمة', 'Task')}</legend><div className="factory-presets">
          {FACTORY_TASKS.map(key => <button key={key} type="button" disabled={pending} aria-pressed={task === key} onClick={() => setTask(key)}>{FACTORY_TASK_COPY[key][language]}</button>)}
        </div></fieldset>
        <fieldset><legend>{t('نوع المخرج', 'Deliverable')}</legend><div className="factory-modes">
          {FACTORY_OUTPUTS.map(key => { const Icon = outputIcon[key]; return <button key={key} type="button" disabled={pending} aria-pressed={output === key} onClick={() => chooseOutput(key)}><Icon size={18} aria-hidden="true" />{FACTORY_OUTPUT_COPY[key][language]}</button>; })}
        </div></fieldset>
        <label className="factory-field">{t('هدف المهمة', 'Task objective')}
          <textarea className="ad-input" rows={4} maxLength={FACTORY_LIMITS.brief} value={brief} disabled={pending} onChange={event => setBrief(event.target.value)}
            placeholder={t('مثلاً: جهّز مسودة تقرير يومي عن الطلبات المتأخرة للفريق…', 'Example: draft a daily report for staff about overdue requests…')} />
        </label>
        <div className="factory-selects">
          <label className="factory-field">{t('لغة البرمجة', 'Programming language')}
            <select className="ad-input" value={programming} disabled={pending} onChange={event => setProgramming(event.target.value)}>
              {FACTORY_LANGUAGES.map(name => <option key={name}>{name}</option>)}<option value="other">{t('لغة أخرى…', 'Other language…')}</option>
            </select>
          </label>
          <label className="factory-field">{t('محفّز مقترح', 'Proposed trigger')}
            <select className="ad-input" value={trigger} disabled={pending} onChange={event => setTrigger(event.target.value as FactoryTrigger)}>
              {FACTORY_TRIGGERS.map(key => <option key={key} value={key}>{FACTORY_TRIGGER_COPY[key][language]}</option>)}
            </select>
          </label>
        </div>
        {programming === 'other' && <label className="factory-field">{t('اسم اللغة', 'Language name')}
          <input className="ad-input" dir="auto" maxLength={FACTORY_LIMITS.language} value={otherLanguage} disabled={pending} onChange={event => setOtherLanguage(event.target.value)} />
        </label>}
        {aiConfigured && <label className="factory-consent"><input type="checkbox" checked={includeSnapshot} disabled={pending} onChange={event => setIncludeSnapshot(event.target.checked)} />{t('أرفق إجماليات الموقع مع طلب الذكاء (بدون بيانات العملاء)', 'Include aggregate site counts in the AI request (no customer details)')}</label>}
        <p className="factory-hint">{aiConfigured
          ? t('زر الذكاء يرسل الوصف إلى Gemini. ما تدخلش مفاتيح أو معلومات خاصة.', 'AI drafting sends your brief to Gemini. Do not enter keys or private information.')
          : t('القوالب متاحة بدون مفتاح. التوليد من وصفك يحتاج Gemini على الخادم.', 'Templates need no key. Drafting from your brief requires Gemini on the server.')}</p>
        <div className="factory-actions">
          <button type="button" className="ad-button ad-button-muted" disabled={pending} onClick={() => void generate('template')}><Braces size={16} aria-hidden="true" />{t('إنشاء من قالب', 'Build from template')}</button>
          <button type="button" className="ad-button ad-primary" disabled={!aiConfigured || pending} onClick={() => void generate('ai')}><Sparkles size={16} aria-hidden="true" />{pending ? t('جارٍ تجهيز المسودة…', 'Drafting…') : t('مسودة بالذكاء', 'Draft with AI')}</button>
          {pending && <button type="button" className="ad-text-button" onClick={cancelDraft}>{t('إلغاء', 'Cancel')}</button>}
        </div>
        {problem && <AdminMessage>{problem}</AdminMessage>}
      </section>

      <section className="ad-panel factory-board">
        <div className="factory-panel-head"><span>02</span><div><h2>{t('لوحة السيناريو', 'Scenario board')}</h2><p>{t('ركّب الخلايا بالترتيب. المراجعة البشرية ثابتة في النهاية.', 'Arrange the cells. Human review always stays at the end.')}</p></div></div>
        <div className="factory-add">
          <label className="factory-field">{t('نوع الخلية', 'Cell type')}<select className="ad-input" value={nextKind} disabled={pending} onChange={event => setNextKind(event.target.value as FactoryCellKind)}>
            {FACTORY_CELLS.map(kind => <option key={kind} value={kind}>{FACTORY_CELL_COPY[kind][language]}</option>)}
          </select></label>
          <button type="button" className="ad-button ad-button-muted" disabled={pending || cells.length >= FACTORY_LIMITS.cells} onClick={() => {
            const added = designCell(nextKind);
            setCells(current => [...current, added]);
          }}><Plus size={16} aria-hidden="true" />{t('أضف خلية', 'Add cell')}</button>
        </div>
        <ol className="factory-pipeline">
          {cells.map((cell, index) => {
            const Icon = cellIcon[cell.kind];
            const result = trace.find(item => item.id === cell.id);
            const number = numberText(index + 1, language);
            return <li key={cell.id}>
              <span className="factory-cell-icon"><Icon size={18} aria-hidden="true" /></span>
              <div className="factory-cell-body">
                <label className="factory-cell-label"><span>{number} · {FACTORY_CELL_COPY[cell.kind][language]}</span>
                  <input className="ad-input" aria-label={t(`اسم الخلية ${number}`, `Cell ${number} name`)} value={cell.label} placeholder={FACTORY_CELL_COPY[cell.kind][language]} maxLength={100} disabled={pending} onChange={event => updateCell(cell.id, { label: event.target.value })} />
                </label>
                {cell.neuron && <fieldset disabled={pending}><NeuronControls language={language} neuron={cell.neuron} onChange={neuron => updateCell(cell.id, { neuron })} /></fieldset>}
                {result && <p className={`factory-trace factory-trace-${result.state}`}>{traceCopy[result.state][language]}{result.score !== undefined ? ` · ${numberText(Math.round(result.score * 100), language)}%` : ''}</p>}
              </div>
              <div className="factory-cell-actions">
                <button type="button" className="ad-icon-button" title={t('حرّك لأعلى', 'Move up')} aria-label={t(`حرّك الخلية ${number} لأعلى`, `Move cell ${number} up`)} disabled={pending || index === 0} onClick={() => moveCell(index, -1)}><ArrowUp size={15} aria-hidden="true" /></button>
                <button type="button" className="ad-icon-button" title={t('حرّك لأسفل', 'Move down')} aria-label={t(`حرّك الخلية ${number} لأسفل`, `Move cell ${number} down`)} disabled={pending || index === cells.length - 1} onClick={() => moveCell(index, 1)}><ArrowDown size={15} aria-hidden="true" /></button>
                <button type="button" className="ad-icon-button" title={t('احذف الخلية', 'Remove cell')} aria-label={t(`احذف الخلية ${number}`, `Remove cell ${number}`)} disabled={pending} onClick={() => setCells(current => current.filter(item => item.id !== cell.id))}><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            </li>;
          })}
          <li className="factory-review"><span className="factory-cell-icon"><LockKeyhole size={18} aria-hidden="true" /></span><div><strong>{FACTORY_CELL_COPY.review[language]}</strong><p>{showTrace ? traceCopy.review[language] : t('لا إجراء على الموقع من هنا', 'No live action from this workspace')}</p></div></li>
        </ol>
        <div className="factory-simulation">
          <label className="factory-field">{t('عيّنة اصطناعية', 'Synthetic sample')}<select className="ad-input" value={sample} onChange={event => setSample(event.target.value as FactorySample)}><option value="quiet">{t('يوم هادئ', 'Quiet day')}</option><option value="busy">{t('طلبات تحتاج متابعة', 'Follow-up queue')}</option></select></label>
          <button type="button" className="ad-button ad-button-muted" onClick={() => setShowTrace(true)} disabled={!cells.length}><Play size={16} aria-hidden="true" />{t('حاكِ الخطوات', 'Rehearse steps')}</button>
        </div>
        {showTrace && <p className="factory-hint" role="status">{t('محاكاة محلية ببيانات اصطناعية، من غير تشغيل الكود:', 'Local rehearsal on synthetic data; no code was run:')} {numberText(FACTORY_SAMPLES[sample].newRequests, language)} {t('جديدة،', 'new,')} {numberText(FACTORY_SAMPLES[sample].overdue, language)} {t('متأخرة.', 'overdue.')}</p>}
      </section>
    </div>

    <section className="ad-panel factory-output">
      <div className="factory-panel-head"><span>03</span><div><h2>{t('مخرجات المصنع', 'Factory output')}</h2><p>{t('راجع المسودة قبل ما تنسخها أو تشاركها.', 'Review the draft before copying or sharing it.')}</p></div></div>
      {!prepared ? <div className="factory-empty"><Braces size={27} aria-hidden="true" /><p>{t('مفيش مسودة لسه. اختار مخرجًا واعمل قالبًا، أو اطلب مسودة بالذكاء.', 'No draft yet. Choose a deliverable and build a template or request an AI draft.')}</p></div> : <>
        {stale && <AdminMessage>{t('المدخلات اتغيّرت. أنشئ مسودة جديدة قبل النسخ أو التنزيل.', 'The design changed. Generate a fresh draft before copying or downloading.')}</AdminMessage>}
        <div className="factory-draft-header"><h3 dir="auto">{prepared.draft.title}</h3><span className="factory-badge">{prepared.source === 'ai' ? t('مسودة Gemini', 'Gemini draft') : t('قالب محلي', 'Local template')}</span></div>
        <p dir="auto" className="factory-summary">{prepared.draft.summary}</p>
        {prepared.input.output === 'bot' && <p className="factory-hint"><Bot size={15} aria-hidden="true" />{t('محفّز مقترح، مش روبوت شغّال:', 'Proposed trigger, not a running bot:')} {FACTORY_TRIGGER_COPY[prepared.input.trigger][language]}</p>}
        {prepared.source === 'ai' && prepared.draft.steps.length > 0 && <div className="factory-suggestions"><strong>{t('خطوات مقترحة', 'Proposed steps')}</strong><ol>{prepared.draft.steps.map((step, index) => <li key={index} dir="auto">{step.label}</li>)}</ol>
          <button type="button" className="ad-text-button" onClick={applySteps} disabled={stale || pending}>{t('استبدل السيناريو بالخطوات المقترحة', 'Replace scenario with proposed steps')}</button>
        </div>}
        {prepared.draft.code ? <div className="factory-code"><div><Braces size={16} aria-hidden="true" />{prepared.input.language}</div><pre dir="ltr" tabIndex={0} aria-label={t('مسودة الكود', 'Code draft')}><code>{prepared.draft.code}</code></pre></div>
          : prepared.input.output !== 'scenario' && <p className="factory-hint">{t('المسودة دي مفيهاش كود باللغة المختارة. جرّب قالبًا بلغة مدعومة أو التوليد بالذكاء لو متاح.', 'This draft has no code in the chosen language. Try a supported template language or AI drafting if available.')}</p>}
        <div className="factory-checks"><strong>{t('قائمة المراجعة', 'Review checklist')}</strong><ul>{prepared.draft.checks.map((check, index) => <li key={index} dir="auto">{check}</li>)}</ul></div>
        <div className="factory-actions">
          {prepared.draft.code && <button type="button" className="ad-button ad-button-muted" disabled={stale || pending} onClick={() => void copy()}><Clipboard size={16} aria-hidden="true" />{t('انسخ الكود', 'Copy code')}</button>}
          <button type="button" className="ad-button ad-primary" disabled={stale || pending} onClick={download}><Download size={16} aria-hidden="true" />{t('نزّل المسودة JSON', 'Download draft JSON')}</button>
        </div>
      </>}
      {notice && <AdminMessage error={false}>{notice}</AdminMessage>}
      <p className="factory-hint">{t('التغييرات مؤقتة لحد ما تخرج من بوابة الإدارة. نزّل المسودة لو عايز تحتفظ بيها.', 'Changes are temporary until you leave the admin portal. Download a draft to keep it.')}</p>
    </section>
  </div>;
}
