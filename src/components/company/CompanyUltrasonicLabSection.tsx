import React, { useState } from 'react';
import { Language } from '../../types';
import { UtFlawDetectorDevice } from '../academy/virtuallab/UtFlawDetectorDevice';
import { PautOmniScanDevice } from '../academy/virtuallab/PautOmniScanDevice';
import { 
  Activity, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CompanyUltrasonicLabSectionProps {
  language: Language;
  onNavigateToAcademy?: (subTab?: string) => void;
}

export const CompanyUltrasonicLabSection: React.FC<CompanyUltrasonicLabSectionProps> = ({
  language,
  onNavigateToAcademy
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeDevice, setActiveDevice] = useState<'ut' | 'paut'>('ut');

  return (
    <section id="ultrasonic-lab" className="py-16 border-b border-slate-800 bg-slate-900/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'مختبر المحاكاة التفاعلي لأجهزة الفحص بالموجات والمصفوفات' : 'Interactive Ultrasonic & Phased Array Testing Lab'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr ? 'التجربة الحية لأجهزة UT و PAUT الرقمية المعتمدة' : 'Live Interactive UT & PAUT Flaw Detection Simulation'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'اختبر بنفسك دقة أجهزة الفحص المعتمدة لدى إنسكو: جهاز كشف العيوب الرقمي (Krautkramer USM 35X) وجهاز المصفوفات الطورية المتقدم (Olympus OmniScan X3). يمكنك تعديل الكسب (Gain)، النطاق (Range)، زوايا المجس، ومسح وصلات اللحام واكتشاف عيوب الجذور ونقص الانصهار لحظياً.'
                : 'Experience the precision of INSCO’s calibrated field equipment: Digital Flaw Detector (Krautkramer USM 35X) and Phased Array (Olympus OmniScan X3). Adjust gain, range, beam angles, and size real-time weld discontinuities.'}
            </p>
          </div>

          {/* Device Switcher Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveDevice('ut')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 ${
                activeDevice === 'ut'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isAr ? 'جهاز UT الرقمي (USM 35X)' : 'Conventional UT'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDevice('paut')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 ${
                activeDevice === 'paut'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isAr ? 'جهاز PAUT المصفوفات (OmniScan)' : 'Phased Array PAUT'}</span>
            </button>
          </div>
        </div>

        {/* Render Selected Device Component */}
        {activeDevice === 'ut' ? (
          <UtFlawDetectorDevice language={language} />
        ) : (
          <PautOmniScanDevice language={language} />
        )}

        {/* Footer Deep Link to Academy Full Lab */}
        {onNavigateToAcademy && (
          <div className="mt-8 p-4 rounded-xl border border-cyan-500/30 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isAr ? 'تريد تدريباً عملياً متقدماً مع مهام وتقارير معتمدة؟' : 'Looking for guided missions and accredited training reports?'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isAr ? 'أكاديمية إنسكو تقدم ورش عمل تفاعلية كاملة مع بنك المهام ومسائل الحسابات الصوتية.' : 'INSCO Academy offers full interactive workshops with acoustic calculations.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToAcademy('workshops')}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-cyan-900/30"
            >
              <span>{isAr ? 'دخول المعمل التفاعلي بالأكاديمية' : 'Enter Academy Virtual Lab'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
