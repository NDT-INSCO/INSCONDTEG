import React from 'react';
import { Language } from '../types';

interface IndustrialVideoGenProps {
  language: Language;
}

export const IndustrialVideoGen: React.FC<IndustrialVideoGenProps> = ({ language }) => {
  const isAr = language === 'ar';
  return (
    <div className="rounded-2xl border border-purple-400/25 bg-gradient-to-br from-[#1a1040] to-[#0b0c1c] p-5 sm:p-8">
      <h3 className="text-xl font-bold text-white mb-3">
        {isAr ? 'توليد فيديو صناعي' : 'Industrial Video Generation'}
      </h3>
      <p className="text-slate-300 text-sm">
        {isAr ? 'هذه الميزة تتطلب خادم خلفي.' : 'This feature requires a backend server.'}
      </p>
    </div>
  );
};