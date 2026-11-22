import React, { useCallback, useEffect, useState } from 'react';
import { CircleAlert, Loader2, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';
import type { Language } from '../../types';
import type { RulesProbeResult } from '../../client/rulesProbe';

const RULES_EDITOR =
  'https://console.firebase.google.com/project/ai-studio-applet-webapp-18922/firestore/rules';

interface NetworkRulesStatusProps {
  language: Language;
  /** Injected so the strip can be tested without a network; defaults to the real probe. */
  probe?: () => Promise<RulesProbeResult>;
}

/**
 * The one thing that can make a live page fail every write: the rules on the
 * Firebase project are older than this build. Rather than let a member discover
 * that through an error, the page states it — but only after *measuring* it, never
 * as a guess.
 */
export function NetworkRulesStatus({ language, probe }: NetworkRulesStatusProps) {
  const isAr = language === 'ar';
  const [result, setResult] = useState<RulesProbeResult | null>(null);
  const [checking, setChecking] = useState(true);

  const run = useCallback(async () => {
    setChecking(true);
    try {
      const api = probe ? { probeGroupRules: probe } : await import('../../client/rulesProbe');
      setResult(await api.probeGroupRules());
    } catch {
      setResult({ state: 'unknown', code: null, checkedAt: null });
    } finally {
      setChecking(false);
    }
  }, [probe]);

  useEffect(() => {
    void run();
  }, [run]);

  const shell = 'flex flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] leading-relaxed';
  const recheck = (
    <button
      type="button"
      data-testid="network-rules-recheck"
      onClick={() => void run()}
      disabled={checking}
      className="ms-auto inline-flex items-center gap-1 rounded border border-white/20 px-1.5 py-0.5 font-bold text-white/90 transition hover:border-white/40 disabled:opacity-50"
    >
      <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
      {isAr ? 'أعد الفحص' : 'Check again'}
    </button>
  );

  if (checking && !result) {
    return (
      <div data-testid="network-rules-checking" className={`${shell} border-[#232345] bg-[#0f0f22] text-slate-400`}>
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
        {isAr ? 'جارٍ فحص القواعد المنشورة…' : 'Checking the published rules…'}
      </div>
    );
  }

  if (!result) return null;

  if (result.state === 'ready') {
    return (
      <div
        data-testid="network-rules-ready"
        title={
          isAr
            ? 'قراءة واحدة على مستند غير موجود: نجاحها يعني أن القواعد المنشورة تعرف مسار الجروبات — لا أنه يسمح بكل كتابة.'
            : 'A single read of a document that does not exist: success means the published rules know the groups path — not that every write is allowed.'
        }
        className={`${shell} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {isAr
          ? 'القواعد المنشورة تعرف مسار الجروبات (فحص قراءة فعلي).'
          : 'The published rules know the groups path (a real read check).'}
        {recheck}
      </div>
    );
  }

  if (result.state === 'offline') {
    return (
      <div data-testid="network-rules-offline" className={`${shell} border-amber-500/30 bg-amber-500/10 text-amber-200`}>
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {isAr ? 'تعذّر الفحص بسبب الشبكة — لم يُحكم على القواعد.' : 'The check could not reach the server — no verdict on the rules.'}
        {recheck}
      </div>
    );
  }

  if (result.state === 'unknown') {
    return (
      <div data-testid="network-rules-unknown" className={`${shell} border-[#232345] bg-[#0f0f22] text-slate-400`}>
        <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {isAr ? 'لم يتمكّن الفحص من الحكم على القواعد.' : 'The check could not decide.'}
        {recheck}
      </div>
    );
  }

  return (
    <div data-testid="network-rules-missing" className={`${shell} border-rose-500/40 bg-rose-500/10 text-rose-200`}>
      <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        {isAr
          ? 'القواعد المنشورة على Firebase لا تعرف مسار الجروبات بعد، فسيُرفض الإنشاء والانضمام. الملف firestore.rules موجود في المستودع ولم يُنشر على المشروع:'
          : 'The rules published on Firebase do not know the groups path yet, so creating and joining will be refused. firestore.rules exists in the repository but was never published to the project:'}
        <a
          href={RULES_EDITOR}
          target="_blank"
          rel="noreferrer"
          className="mx-1 font-bold text-rose-100 underline decoration-dotted underline-offset-2"
        >
          {isAr ? 'افتح محرّر القواعد' : 'Open the rules editor'}
        </a>
        <span className="mx-1 text-rose-300/80">·</span>
        <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[10px] text-rose-100">npm run rules:deploy</code>
      </span>
      {recheck}
    </div>
  );
}
