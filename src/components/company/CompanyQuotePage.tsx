import type { Language } from '../../types';
import { CompanyContactSection } from './CompanyContactSection';
import { CompanyQuickActionsSection } from './CompanyQuickActionsSection';
import { CompanyProjectCostEstimator } from './CompanyProjectCostEstimator';

export function CompanyQuotePage({ language, anchor, quoteService }: {
  language: Language;
  anchor: string;
  quoteService?: string;
}) {
  const isAr = language === 'ar';
  return (
    <CompanyContactSection
      language={language}
      initialService={quoteService}
      toolsSlot={
        <details
          open={anchor === 'cost-estimator' || anchor === 'quick-actions' ? true : undefined}
          className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60"
        >
          <summary className="cursor-pointer px-4 py-4 font-semibold text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
            {isAr ? 'أدوات اختيارية: تسعير سريع وحاسبة تقديرية' : 'Optional tools: quote presets and cost estimator'}
          </summary>
          <p className="px-4 text-sm leading-relaxed text-slate-300">
            {isAr
              ? 'الأرقام للتخطيط فقط؛ عرض السعر الرسمي يصدر من الفريق الفني.'
              : 'Figures are for planning only. The technical team issues the formal quote.'}
          </p>
          <CompanyQuickActionsSection language={language} mode="quote" />
          <CompanyProjectCostEstimator
            language={language}
            onTransferToRfq={() => document.getElementById('rfq')?.scrollIntoView({ block: 'start' })}
          />
        </details>
      }
    />
  );
}
