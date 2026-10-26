import React, { useEffect, useState } from 'react';
import { Award, History, X } from 'lucide-react';
import type { Language } from '../../types';
import { useSimulationLevelUp } from '../../utils/simulationHistoryStore';

interface SimulationLevelUpToastProps {
  language: Language;
  onOpenHistory?: () => void;
}

export const SimulationLevelUpToast: React.FC<SimulationLevelUpToastProps> = ({
  language,
  onOpenHistory,
}) => {
  const isAr = language === 'ar';
  const { levelUp, dismissLevelUp } = useSimulationLevelUp(6500);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!levelUp) {
      setEntered(false);
      return;
    }
    setEntered(false);
    const timer = setTimeout(() => {
      setEntered(true);
    }, 16);
    (timer as unknown as { unref?: () => void })?.unref?.();
    return () => clearTimeout(timer);
  }, [levelUp]);

  if (!levelUp) return null;

  return (
    <div
      key={levelUp.id}
      role="status"
      aria-live="polite"
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="simulation-level-up-toast"
      className={`fixed bottom-5 end-5 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-amber-400/50 bg-[#0b0e20]/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
        entered
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-95 motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg border border-amber-400/40 bg-amber-500/15 flex items-center justify-center text-amber-300 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
              entered ? 'scale-100' : 'scale-90'
            }`}
          >
            <Award className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold text-amber-300">
              {isAr ? 'ترقية مستوى الخبرة · Level Up!' : 'Level Up · Milestone Reached!'}
            </div>

            <div className="text-sm font-black text-white leading-snug">
              {isAr
                ? `المستوى ${levelUp.newLevel} — ${levelUp.levelTitle.ar}`
                : `Level ${levelUp.newLevel} — ${levelUp.levelTitle.en}`}
            </div>

            <div className="text-xs font-mono tabular-nums text-slate-300 flex flex-wrap items-center gap-1.5">
              <span className="text-emerald-400 font-bold">+{levelUp.xpEarned} XP</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span>
                {isAr
                  ? `الإجمالي ${levelUp.totalXp} XP`
                  : `Total ${levelUp.totalXp} XP`}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-400">
                {isAr
                  ? `الهدف التالي ${levelUp.nextTierXp} XP`
                  : `Next at ${levelUp.nextTierXp} XP`}
              </span>
            </div>

            {onOpenHistory && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenHistory();
                    dismissLevelUp();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{isAr ? 'عرض سجل المحاكاة ونقاط XP' : 'View Simulation History & XP'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismissLevelUp}
          aria-label={isAr ? 'إغلاق إشعار الترقية' : 'Dismiss level up notification'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
