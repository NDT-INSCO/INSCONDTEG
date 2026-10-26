import React from 'react';
import { Language } from '../../types';

interface GlobalLeaderboardProps {
  language: Language;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ language }) => {
  const isAr = language === 'ar';
  return (
    <div className="rounded-2xl border border-yellow-400/25 bg-[#10132b] p-5">
      <h3 className="text-xl font-bold text-white mb-3">
        {isAr ? 'لوحة المتصدرين' : 'Leaderboard'}
      </h3>
      <p className="text-slate-300 text-sm">
        {isAr ? 'أفضل المتعلمين.' : 'Top learners.'}
      </p>
    </div>
  );
};