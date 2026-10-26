import React from 'react';
import { Volume2, VolumeX, Radio } from 'lucide-react';
import { Language } from '../../../types';
import {
  playDefectDetectedPing,
  useNdtAudioFeedback,
} from '../../../utils/ndtAudioFeedback';

interface NdtAudioControlChipProps {
  language: Language;
  compact?: boolean;
}

export const NdtAudioControlChip: React.FC<NdtAudioControlChipProps> = ({
  language,
  compact = false,
}) => {
  const isAr = language === 'ar';
  const { audioEnabled, audioVolume, toggleAudioEnabled, setAudioVolume } = useNdtAudioFeedback();

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/90 px-2.5 py-1.5 text-xs font-mono"
      role="group"
      aria-label={isAr ? 'التحكم الصوتي في مختبر المحاكاة' : 'NDT Lab Audio Feedback Controls'}
    >
      <button
        type="button"
        onClick={toggleAudioEnabled}
        aria-pressed={audioEnabled}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-bold transition cursor-pointer border ${
          audioEnabled
            ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
        }`}
      >
        {audioEnabled ? (
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span>
          {audioEnabled
            ? isAr
              ? 'الصوت التفاعلي: مفعّل'
              : 'Lab Audio: ON'
            : isAr
            ? 'الصوت التفاعلي: صامت'
            : 'Lab Audio: MUTED'}
        </span>
      </button>

      {!compact && audioEnabled && (
        <>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 tabular-nums">
            <span className="sr-only">{isAr ? 'مستوى صوت المختبر' : 'Lab Audio Volume'}</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              aria-label={isAr ? 'مستوى صوت المختبر' : 'Lab Audio Volume'}
              value={audioVolume}
              onChange={(e) => setAudioVolume(Number(e.target.value))}
              className="w-16 accent-cyan-500 cursor-pointer"
            />
            <span className="text-slate-300">{Math.round(audioVolume * 100)}%</span>
          </label>

          <button
            type="button"
            onClick={() => playDefectDetectedPing('High')}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 text-[10.5px] text-amber-300 cursor-pointer"
            title={isAr ? 'اختبار نغمة رصد العيب' : 'Test defect sonar ping'}
          >
            <Radio className="w-3 h-3" />
            <span>{isAr ? 'اختبار النغمة' : 'Test Ping'}</span>
          </button>
        </>
      )}
    </div>
  );
};
