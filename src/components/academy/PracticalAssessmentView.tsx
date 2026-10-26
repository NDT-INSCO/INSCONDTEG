import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Info,
  ListChecks,
  Printer,
  ShieldAlert,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Language } from '../../types';
import {
  PRACTICAL_METHODS,
  PRACTICAL_TASKS,
  PPA_POLICY,
  PPA_SCALE,
  PracticalMethod,
  PracticalTask,
  getPracticalTask,
  tasksForMethod,
} from '../../data/practicalAssessment';
import {
  PPARecord,
  PPAScore,
  createPracticalAssessment,
  deletePracticalAssessment,
  exportPracticalAssessments,
  practicalStats,
  readPracticalAssessments,
  summarise,
} from '../../utils/practicalAssessment';

interface PracticalAssessmentViewProps {
  language: Language;
  initialMethod?: PracticalMethod;
}

const local = (value: { ar: string; en: string }, language: Language) => value[language];

const OutcomeBadge: React.FC<{ record: PPARecord; language: Language }> = ({ record, language }) => {
  const summary = summarise(record);
  const isAr = language === 'ar';
  if (!summary.complete) {
    return (
      <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
        {isAr ? 'غير مكتمل' : 'Incomplete'}
      </span>
    );
  }
  return summary.outcome === 'meets' ? (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
      {isAr ? 'يطابق معايير التدريب' : 'Meets training criteria'}
    </span>
  ) : (
    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
      {isAr ? 'يحتاج إعادة أداء' : 'Needs re-performance'}
    </span>
  );
};

const RecordDetail: React.FC<{ record: PPARecord; language: Language; onBack: () => void; onDelete: () => void }> = ({
  record,
  language,
  onBack,
  onDelete,
}) => {
  const isAr = language === 'ar';
  const task = getPracticalTask(record.taskId);
  const summary = summarise(record);
  if (!task) return null;
  const scoreOf = (criterionId: string) => record.scores.find(row => row.criterionId === criterionId)?.score;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-amber-400">
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isAr ? 'كل السجلات' : 'All records'}
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-[#343d65] px-3 py-1.5 text-[11px] text-slate-200 flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" />{isAr ? 'طباعة' : 'Print'}
          </button>
          <button type="button" onClick={onDelete} className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-[11px] text-rose-200 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" />{isAr ? 'حذف' : 'Delete'}
          </button>
        </div>
      </div>

      <header className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#181d45] px-2 py-0.5 font-mono text-[10px] text-sky-300">{task.method}</span>
          <OutcomeBadge record={record} language={language} />
          <span className="font-mono text-[10px] text-slate-500">{record.performedOn || '—'}</span>
        </div>
        <h3 className="mt-3 text-lg font-black text-white">{local(task.title, language)}</h3>
        <p className="mt-2 text-xs leading-6 text-slate-300">{local(task.objective, language)}</p>
        <dl className="mt-4 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
          <div className="rounded-lg border border-[#29315b] px-3 py-2">
            <dt className="text-slate-500">{isAr ? 'المتدرب (محلي)' : 'Candidate (local)'}</dt>
            <dd className="font-bold text-slate-100">{record.candidate || '—'}</dd>
          </div>
          <div className="rounded-lg border border-[#29315b] px-3 py-2">
            <dt className="text-slate-500">{isAr ? 'المُقيِّم' : 'Assessor'}</dt>
            <dd className="font-bold text-slate-100">{record.assessor || '—'}</dd>
          </div>
          <div className="rounded-lg border border-[#29315b] px-3 py-2">
            <dt className="text-slate-500">{isAr ? 'رقم مرجع المُقيِّم' : 'Assessor reference'}</dt>
            <dd className="font-mono text-slate-200">{record.assessorRef || '—'}</dd>
          </div>
          <div className="rounded-lg border border-[#29315b] px-3 py-2">
            <dt className="text-slate-500">{isAr ? 'العينة' : 'Specimen'}</dt>
            <dd className="font-mono text-slate-200">{record.specimenId || '—'}</dd>
          </div>
          <div className="rounded-lg border border-[#29315b] px-3 py-2 sm:col-span-2">
            <dt className="text-slate-500">{isAr ? 'مرجع الإجراء' : 'Procedure reference'}</dt>
            <dd className="font-mono text-slate-200">{record.procedureRef || '—'}</dd>
          </div>
        </dl>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#29315b]">
        <table className="w-full text-xs">
          <thead className="bg-[#151a38] text-slate-300">
            <tr>
              <th className="p-2 text-start">{isAr ? 'المعيار' : 'Criterion'}</th>
              <th className="p-2 text-start">{isAr ? 'الدليل المطلوب' : 'Required evidence'}</th>
              <th className="p-2">{isAr ? 'حرج' : 'Critical'}</th>
              <th className="p-2">{isAr ? 'الدرجة' : 'Score'}</th>
            </tr>
          </thead>
          <tbody>
            {task.criteria.map(criterion => {
              const score = scoreOf(criterion.id);
              const failedCritical = criterion.critical && (score === undefined || score < 2);
              return (
                <tr key={criterion.id} className={`border-t border-[#29315b] ${failedCritical ? 'bg-rose-500/5' : ''}`}>
                  <td className="p-2 font-bold text-slate-100">{local(criterion.label, language)}</td>
                  <td className="p-2 text-slate-400">{local(criterion.evidence, language)}</td>
                  <td className="p-2 text-center">{criterion.critical ? '★' : '—'}</td>
                  <td className={`p-2 text-center font-mono ${failedCritical ? 'text-rose-300' : 'text-slate-200'}`}>
                    {score === undefined ? '—' : `${score}/3`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isAr ? 'المجموع' : 'Score'}</p>
          <p className="mt-1 text-xl font-black text-white">{summary.totalScore}/{summary.maxScore} <span className="text-xs text-slate-400">({summary.percent}%)</span></p>
        </div>
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isAr ? 'خطوات حرجة غير مطابقة' : 'Failed critical steps'}</p>
          <p className={`mt-1 text-xl font-black ${summary.criticalFailures.length ? 'text-rose-300' : 'text-emerald-300'}`}>{summary.criticalFailures.length}</p>
        </div>
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isAr ? 'اكتمال السجل' : 'Record completeness'}</p>
          <p className={`mt-1 text-xl font-black ${summary.complete ? 'text-emerald-300' : 'text-amber-300'}`}>{summary.complete ? (isAr ? 'مكتمل' : 'Complete') : `${summary.missingFields.length} ${isAr ? 'ناقص' : 'missing'}`}</p>
        </div>
      </div>

      {record.notes && (
        <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 text-xs leading-6 text-slate-300">
          <h4 className="mb-1 font-bold text-slate-200">{isAr ? 'ملاحظات المُقيِّم' : 'Assessor notes'}</h4>
          <p className="whitespace-pre-line">{record.notes}</p>
        </section>
      )}

      <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-[11px] leading-6 text-amber-100/90">
        {local(PPA_POLICY.statement, language)}
      </p>
    </div>
  );
};

const AssessmentForm: React.FC<{
  task: PracticalTask;
  language: Language;
  onCancel: () => void;
  onSaved: (record: PPARecord) => void;
}> = ({ task, language, onCancel, onSaved }) => {
  const isAr = language === 'ar';
  const [candidate, setCandidate] = useState('');
  const [assessor, setAssessor] = useState('');
  const [assessorRef, setAssessorRef] = useState('');
  const [performedOn, setPerformedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [specimenId, setSpecimenId] = useState('');
  const [procedureRef, setProcedureRef] = useState('');
  const [notes, setNotes] = useState('');
  const [declared, setDeclared] = useState(false);
  const [scores, setScores] = useState<Record<string, PPAScore | undefined>>({});
  const [error, setError] = useState('');

  const preview = useMemo(() => {
    const record: PPARecord = {
      id: 'preview',
      taskId: task.id,
      method: task.method,
      candidate,
      assessor,
      assessorRef,
      performedOn,
      specimenId,
      procedureRef,
      notes,
      declared,
      scores: Object.entries(scores)
        .filter(([, score]) => score !== undefined)
        .map(([criterionId, score]) => ({ criterionId, score: score as PPAScore })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return summarise(record);
  }, [assessor, assessorRef, candidate, declared, notes, performedOn, procedureRef, scores, specimenId, task]);

  const save = () => {
    if (!assessor.trim() || !candidate.trim()) {
      setError(isAr ? 'اسم المتدرب واسم المُقيِّم مطلوبان.' : 'Candidate and assessor names are required.');
      return;
    }
    if (task.criteria.some(criterion => scores[criterion.id] === undefined)) {
      setError(isAr ? 'قيّم كل المعايير قبل الحفظ.' : 'Score every criterion before saving.');
      return;
    }
    const result = createPracticalAssessment({
      taskId: task.id,
      candidate,
      assessor,
      assessorRef,
      performedOn,
      specimenId,
      procedureRef,
      notes,
      declared,
      scores: Object.entries(scores).map(([criterionId, score]) => ({ criterionId, score: (score ?? 0) as PPAScore })),
    });
    if (!result.record) {
      setError(result.error === 'storage-unavailable'
        ? (isAr ? 'تعذر الحفظ: مساحة المتصفح غير متاحة.' : 'Could not save: browser storage unavailable.')
        : (isAr ? 'تعذر إنشاء السجل.' : 'Could not create the record.'));
      return;
    }
    onSaved(result.record);
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onCancel} className="flex items-center gap-1 text-xs text-amber-400">
        {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        {isAr ? 'إلغاء والعودة' : 'Cancel and go back'}
      </button>

      <header className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#181d45] px-2 py-0.5 font-mono text-[10px] text-sky-300">{task.method}</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="w-3 h-3" />{task.estimatedMinutes} {isAr ? 'دقيقة تقديرية' : 'min estimated'}</span>
        </div>
        <h3 className="mt-2 text-lg font-black text-white">{local(task.title, language)}</h3>
        <p className="mt-2 text-xs leading-6 text-slate-300">{local(task.objective, language)}</p>
        <div className="mt-3 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
          <p className="rounded-lg border border-[#29315b] p-2"><strong className="text-slate-100">{isAr ? 'العينة: ' : 'Specimen: '}</strong>{local(task.specimen, language)}</p>
          <p className="rounded-lg border border-[#29315b] p-2"><strong className="text-slate-100">{isAr ? 'المعدات: ' : 'Equipment: '}</strong>{task.equipment.join(' · ')}</p>
          <p className="rounded-lg border border-[#29315b] p-2 sm:col-span-2"><strong className="text-slate-100">{isAr ? 'ضبط المُقيِّم: ' : 'Assessor setup: '}</strong>{local(task.procedureNote, language)}</p>
          <p className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-2 text-amber-100 sm:col-span-2"><strong>{isAr ? 'السلامة: ' : 'Safety: '}</strong>{local(task.safety, language)}</p>
        </div>
      </header>

      <section className="grid gap-2 rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 sm:grid-cols-2">
        {[
          { label: isAr ? 'المتدرب (محلي)' : 'Candidate (local)', value: candidate, set: setCandidate, required: true },
          { label: isAr ? 'المُقيِّم' : 'Assessor', value: assessor, set: setAssessor, required: true },
          { label: isAr ? 'رقم مرجع المُقيِّم (اختياري)' : 'Assessor reference (optional)', value: assessorRef, set: setAssessorRef, required: false },
          { label: isAr ? 'تاريخ الأداء' : 'Date performed', value: performedOn, set: setPerformedOn, required: true, date: true },
          { label: isAr ? 'معرّف العينة' : 'Specimen id', value: specimenId, set: setSpecimenId, required: true },
          { label: isAr ? 'مرجع الإجراء' : 'Procedure reference', value: procedureRef, set: setProcedureRef, required: false },
        ].map(field => (
          <label key={field.label} className="block text-[11px] text-slate-300">
            <span className="mb-1 block">{field.label}{field.required ? ' *' : ''}</span>
            <input
              type={field.date ? 'date' : 'text'}
              value={field.value}
              onChange={event => field.set(event.target.value)}
              className="w-full rounded-lg border border-[#29315b] bg-[#10132b] px-2 py-1.5 text-sm text-white"
            />
          </label>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-black text-white"><ListChecks className="w-4 h-4 text-amber-400" />{isAr ? 'معايير الأداء' : 'Performance criteria'}</h4>
          <span className="text-[10px] text-slate-500">{isAr ? '★ خطوة حرجة' : '★ critical step'}</span>
        </div>
        {task.criteria.map(criterion => {
          const value = scores[criterion.id];
          const criticalFail = criterion.critical && value !== undefined && value < 2;
          return (
            <div key={criterion.id} className={`rounded-xl border p-3 ${criticalFail ? 'border-rose-400/40 bg-rose-500/5' : 'border-[#29315b] bg-[#0b0d1e]'}`}>
              <p className="text-xs font-bold text-slate-100">
                {criterion.critical && <span className="me-1 text-amber-400">★</span>}
                {local(criterion.label, language)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{local(criterion.evidence, language)}</p>
              <div role="radiogroup" aria-label={local(criterion.label, language)} className="mt-2 flex flex-wrap gap-1.5">
                {PPA_SCALE.map(scale => (
                  <button
                    key={scale.value}
                    type="button"
                    role="radio"
                    aria-checked={value === scale.value}
                    onClick={() => setScores(prev => ({ ...prev, [criterion.id]: scale.value as PPAScore }))}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      value === scale.value
                        ? 'bg-amber-400 text-slate-950'
                        : 'border border-[#343d65] text-slate-300 hover:border-amber-400/60'
                    }`}
                    title={local(scale.detail, language)}
                  >
                    {scale.value} · {local(scale.label, language)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <label className="block text-[11px] text-slate-300">
        <span className="mb-1 block">{isAr ? 'ملاحظات' : 'Notes'}</span>
        <textarea
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[#29315b] bg-[#0b0d1e] px-2 py-1.5 text-sm text-white"
        />
      </label>

      <label className="flex items-start gap-2 rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3 text-[11px] leading-6 text-slate-300">
        <input type="checkbox" checked={declared} onChange={event => setDeclared(event.target.checked)} className="mt-1" />
        <span>{isAr
          ? 'أقرّ بأن هذا سجل تدريبي غير معتمد، وأن البيانات أُدخلت محلياً، وأن المُقيِّم مستقل عن المتدرب.'
          : 'I confirm this is a non-accredited training record, that the data was entered locally, and that the assessor is independent of the candidate.'}</span>
      </label>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
        <div className="text-[11px] text-slate-300">
          <p>{isAr ? 'النتيجة المحسوبة:' : 'Computed result:'} <strong className={preview.outcome === 'meets' ? 'text-emerald-300' : 'text-amber-300'}>
            {preview.outcome === 'meets' ? (isAr ? 'يطابق معايير التدريب' : 'Meets training criteria') : (isAr ? 'لم يجتز' : 'Not yet')}
          </strong></p>
          <p className="text-slate-500">{preview.totalScore}/{preview.maxScore} ({preview.percent}%) · {isAr ? 'حرجة غير مطابقة' : 'failed critical'}: {preview.criticalFailures.length}</p>
        </div>
        <button type="button" onClick={save} disabled={!declared} className="ms-auto rounded-lg bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4" />{isAr ? 'حفظ السجل' : 'Save record'}
        </button>
      </div>
      {error && <p role="alert" className="text-[11px] text-rose-300">{error}</p>}
    </div>
  );
};

export const PracticalAssessmentView: React.FC<PracticalAssessmentViewProps> = ({ language, initialMethod }) => {
  const isAr = language === 'ar';
  const [records, setRecords] = useState<PPARecord[]>(() => readPracticalAssessments());
  const [method, setMethod] = useState<PracticalMethod>(initialMethod || 'VT');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);

  const stats = useMemo(() => practicalStats(records), [records]);
  const methodTasks = tasksForMethod(method);
  const task = taskId ? getPracticalTask(taskId) : null;
  const openRecord = openRecordId ? records.find(record => record.id === openRecordId) || null : null;

  const refresh = () => setRecords(readPracticalAssessments());

  if (openRecord) {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4">
        <RecordDetail
          record={openRecord}
          language={language}
          onBack={() => setOpenRecordId(null)}
          onDelete={() => {
            deletePracticalAssessment(openRecord.id);
            setOpenRecordId(null);
            refresh();
            setStatus(isAr ? 'حُذف السجل من هذا المتصفح.' : 'Record deleted from this browser.');
          }}
        />
      </div>
    );
  }

  if (task) {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'}>
        <AssessmentForm
          task={task}
          language={language}
          onCancel={() => setTaskId(null)}
          onSaved={record => {
            refresh();
            setTaskId(null);
            setOpenRecordId(record.id);
            setStatus(isAr ? 'حُفظ السجل محلياً. راجع النتيجة قبل الطباعة.' : 'Record saved locally. Review the result before printing.');
          }}
        />
      </div>
    );
  }

  const download = () => {
    try {
      const blob = new Blob([exportPracticalAssessments(records)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `insco-practical-assessment-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(isAr ? 'تم تصدير السجلات. الملف يحتوي بياناً بأنه غير معتمد.' : 'Records exported. The file states that it is non-accredited.');
    } catch {
      setStatus(isAr ? 'تعذر التصدير.' : 'Export failed.');
    }
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      <header className="rounded-3xl border border-teal-400/25 bg-gradient-to-br from-[#0d2430] via-[#0b1028] to-[#060812] p-5 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
          <ClipboardCheck className="w-4 h-4" />
          {isAr ? 'تقييم عملي تدريبي — غير معتمد' : 'Training practical assessment — non-accredited'}
        </div>
        <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
          {isAr ? 'مهام عملية موثقة بمعايير أداء قابلة للملاحظة' : 'Documented practical tasks with observable performance criteria'}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          {isAr
            ? `مهمة محددة، عينة، معدات، معايير أداء مع دليل مطلوب، وخطوات حرجة. يسجل المُقيِّم ما رآه فعلاً، لا ما ذكره المتدرب. ${PRACTICAL_TASKS.length} مهمة في ${PRACTICAL_METHODS.length} طرق.`
            : `A defined task, specimen, equipment, performance criteria with required evidence, and critical steps. The assessor records what was observed, not what the candidate claims. ${PRACTICAL_TASKS.length} tasks across ${PRACTICAL_METHODS.length} methods.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-200">
          <span className="rounded-lg border border-[#303961] px-3 py-1.5">{stats.total} {isAr ? 'سجل' : 'records'}</span>
          <span className="rounded-lg border border-[#303961] px-3 py-1.5">{stats.complete} {isAr ? 'مكتمل' : 'complete'}</span>
          <span className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-emerald-300">{stats.meets} {isAr ? 'يطابق المعايير' : 'meets criteria'}</span>
          <span className="rounded-lg border border-[#303961] px-3 py-1.5">{stats.methodsCovered}/{PRACTICAL_METHODS.length} {isAr ? 'طرق مغطاة' : 'methods covered'}</span>
        </div>
      </header>

      <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 flex gap-3">
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-300" />
        <div className="text-xs leading-6 text-rose-100/90">
          <p className="font-black text-rose-200">{isAr ? 'ما هذا السجل وما ليس هو' : 'What this record is and is not'}</p>
          <p className="mt-1">{local(PPA_POLICY.statement, language)}</p>
          <button type="button" onClick={() => setShowPolicy(prev => !prev)} className="mt-2 text-[11px] font-bold text-rose-200 underline">
            {showPolicy ? (isAr ? 'إخفاء السياسة' : 'Hide policy') : (isAr ? 'عرض سياسة التقييم' : 'Show assessment policy')}
          </button>
          {showPolicy && (
            <ul className="mt-2 list-disc space-y-1 ps-5 text-[11px]">
              <li>{local(PPA_POLICY.assessorRule, language)}</li>
              <li>{local(PPA_POLICY.outcomeRule, language)}</li>
              <li>{local(PPA_POLICY.retention, language)}</li>
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRACTICAL_METHODS.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setMethod(item)}
            className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
              method === item ? 'bg-teal-400 text-slate-950' : 'border border-[#343d65] text-slate-300 hover:border-teal-400/60'
            }`}
          >
            {item}
          </button>
        ))}
        <div className="ms-auto flex gap-2">
          <button type="button" onClick={download} className="flex items-center gap-1 rounded-lg border border-[#343d65] px-3 py-1.5 text-[11px] text-slate-200">
            <Download className="w-3.5 h-3.5" />{isAr ? 'تصدير JSON' : 'Export JSON'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {methodTasks.map(item => {
          const count = records.filter(record => record.taskId === item.id).length;
          return (
            <article key={item.id} className="flex flex-col rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-[#181d45] px-2 py-0.5 font-mono text-[10px] text-teal-300">{item.method}</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500"><Clock className="w-3 h-3" />{item.estimatedMinutes} min</span>
              </div>
              <h3 className="mt-2 text-sm font-black text-white">{local(item.title, language)}</h3>
              <p className="mt-1 text-[11px] leading-6 text-slate-400">{local(item.objective, language)}</p>
              <p className="mt-2 text-[10px] text-slate-500">{item.criteria.length} {isAr ? 'معياراً' : 'criteria'} · {item.criteria.filter(c => c.critical).length} {isAr ? 'حرجة' : 'critical'} · {count} {isAr ? 'سجل' : 'records'}</p>
              <button type="button" onClick={() => { setTaskId(item.id); setStatus(''); }} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-teal-400 px-3 py-2 text-[11px] font-black text-slate-950">
                <ClipboardCheck className="w-3.5 h-3.5" />{isAr ? 'بدء تقييم' : 'Start assessment'}
              </button>
            </article>
          );
        })}
      </div>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-black text-white"><FileText className="w-4 h-4 text-amber-400" />{isAr ? 'السجلات المحفوظة' : 'Saved records'}</h3>
        {records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#343d65] p-5 text-center text-xs text-slate-500">
            {isAr ? 'لا توجد سجلات بعد. ابدأ تقييماً من المهام أعلاه.' : 'No records yet. Start an assessment from the tasks above.'}
          </p>
        ) : (
          records.map(record => {
            const task = getPracticalTask(record.taskId);
            const summary = summarise(record);
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => setOpenRecordId(record.id)}
                className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3 text-start hover:border-teal-400/50"
              >
                <span className="rounded bg-[#181d45] px-2 py-0.5 font-mono text-[10px] text-teal-300">{record.method}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-100">{task ? local(task.title, language) : record.taskId}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{record.candidate || '—'} · {record.performedOn || '—'} · {summary.totalScore}/{summary.maxScore}</span>
                </span>
                <OutcomeBadge record={record} language={language} />
              </button>
            );
          })
        )}
      </section>

      {status && <p role="status" className="text-[11px] text-emerald-300">{status}</p>}

      <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 text-[11px] leading-6 text-slate-400 flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <div>
          <p>{isAr
            ? 'البيانات في localStorage فقط (insco_practical_assessment_v1). لا مزامنة ولا تحقق هوية. التصدير نصي ومسؤوليته على من يشاركه.'
            : 'Data lives only in localStorage (insco_practical_assessment_v1). No sync and no identity verification. Export is plain text, and sharing is the responsibility of whoever shares it.'}</p>
          <p className="mt-1 flex items-center gap-1 text-amber-300/80"><AlertTriangle className="w-3 h-3" />{isAr ? 'لا تُدخل بيانات شخصية حساسة أو صور مستندات.' : 'Do not enter sensitive personal data or document images.'}</p>
        </div>
      </section>
    </div>
  );
};
