import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award, 
  Calendar, 
  ShieldCheck, 
  User, 
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { Language } from '../../../types';
import { CalibrationReportData } from '../../../data/virtualLabData';

interface CalibrationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  reportData: CalibrationReportData;
}

export const CalibrationReportModal: React.FC<CalibrationReportModalProps> = ({
  isOpen,
  onClose,
  language,
  reportData
}) => {
  const isAr = language === 'ar';
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
===================================================
INSCO NDT ACADEMY - OFFICIAL CALIBRATION CERTIFICATE
===================================================
Certificate No: ${reportData.certificateId}
Date: ${reportData.date}
Technician: ${reportData.technicianName}
Method: ${reportData.discipline}
Standard: ${reportData.standard}
Equipment: ${reportData.equipmentModel} (S/N: ${reportData.equipmentSerial})
Transducer: ${reportData.transducerModel} (${reportData.transducerFreqMHz} MHz, ${reportData.transducerAngleDeg}°)
Calibration Block: ${reportData.blockType}

RESULTS:
- Calibrated Sound Velocity: ${reportData.calibratedVelocity} m/s
- Zero Offset Delay: ${reportData.calibratedZeroDelay.toFixed(2)} µs
- Reference Sensitivity Gain: ${reportData.calibratedGainDb.toFixed(1)} dB
- Reference Echo Amplitude: ${reportData.referenceEchoFshPercent.toFixed(1)}% FSH
- Calibration Status: ${reportData.status}
- Evaluator Notes: ${isAr ? reportData.evaluatorNotesAr : reportData.evaluatorNotesEn}
===================================================
`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#090d24] text-slate-100 rounded-3xl border border-[#232c66] shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2856] bg-[#0c1233]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تقرير المعايرة والشهادة المعملية المعتمدة' : 'Official Laboratory Calibration Certificate'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'وثيقة مطابقة لمعايير ASME Sec V & ISO 17025' : 'ASME Sec V & ISO 17025 Compliant Record'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ التقرير' : 'Copy')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Certificate'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet */}
        <div className="p-6 sm:p-8 space-y-6 print:bg-white print:text-black">
          {/* Header with Organization and Certificate ID */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#1f2856]">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase block font-bold">
                INSCO INTERNATIONAL NDT ACADEMY
              </span>
              <h2 className="text-xl font-black text-white tracking-wide mt-1">
                {isAr ? 'شهادة معايرة أجهزة الفحوصات اللاإتلافية' : 'NDT EQUIPMENT CALIBRATION REPORT'}
              </h2>
              <span className="text-xs text-slate-400 block mt-0.5">
                Standard: <strong className="text-slate-200">{reportData.standard}</strong>
              </span>
            </div>

            <div className="text-left sm:text-right bg-[#0d143b] px-4 py-2.5 rounded-2xl border border-[#222c66]">
              <span className="text-[10px] text-slate-400 block">Certificate No:</span>
              <span className="text-sm font-mono font-bold text-amber-400">{reportData.certificateId}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Date: {reportData.date}</span>
            </div>
          </div>

          {/* Inspection Metadata Table */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0b102b] p-4 rounded-2xl border border-[#1b224d] space-y-2.5 text-xs">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] border-b border-[#1b224d] pb-1.5 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'بيانات الفاحص والمنشأة' : 'Personnel & Facility'}
              </h5>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'اسم الفاحص:' : 'Technician:'}</span>
                <span className="font-semibold text-white">{reportData.technicianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'طريقة الفحص:' : 'Method:'}</span>
                <span className="font-semibold text-amber-400">{reportData.discipline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'نوع التجربة:' : 'Experiment:'}</span>
                <span className="font-semibold text-white">{reportData.experimentTitle}</span>
              </div>
            </div>

            <div className="bg-[#0b102b] p-4 rounded-2xl border border-[#1b224d] space-y-2.5 text-xs">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] border-b border-[#1b224d] pb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                {isAr ? 'مواصفات الجهاز والمجس' : 'Instrument & Transducer'}
              </h5>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'طراز الجهاز:' : 'Flaw Detector:'}</span>
                <span className="font-semibold text-white">{reportData.equipmentModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'المجس / التردد:' : 'Probe / Frequency:'}</span>
                <span className="font-semibold text-sky-400">
                  {reportData.transducerModel} ({reportData.transducerFreqMHz} MHz, {reportData.transducerAngleDeg}°)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'كتلة المعايرة:' : 'Calibration Block:'}</span>
                <span className="font-semibold text-white">{reportData.blockType}</span>
              </div>
            </div>
          </div>

          {/* Measured & Calibrated Parameters Table */}
          <div className="bg-[#0b102b] p-5 rounded-2xl border border-[#1b224d] space-y-4">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {isAr ? 'نتائج المعايرة المخبرية والتحقق الفني:' : 'Laboratory Calibration Verification Results:'}
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#0e163b] border border-[#222c66]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'سرعة الصوت المعايرة' : 'Calibrated Velocity'}</span>
                <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                  {reportData.calibratedVelocity} m/s
                </span>
                <span className="text-[10px] text-slate-500">Nominal: 5920 m/s</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e163b] border border-[#222c66]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'إزاحة الصفر (Probe Zero)' : 'Zero Offset Delay'}</span>
                <span className="text-base font-black font-mono text-sky-400 mt-1 block">
                  {reportData.calibratedZeroDelay.toFixed(2)} µs
                </span>
                <span className="text-[10px] text-slate-500">Compensated</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e163b] border border-[#222c66]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'كسب الحساسية المرجعي' : 'Reference Sensitivity'}</span>
                <span className="text-base font-black font-mono text-amber-400 mt-1 block">
                  {reportData.calibratedGainDb.toFixed(1)} dB
                </span>
                <span className="text-[10px] text-slate-500">Echo @ {reportData.referenceEchoFshPercent.toFixed(0)}% FSH</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e163b] border border-[#222c66]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'النتيجة الإجمالية' : 'Overall Result'}</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {reportData.status === 'PASSED' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-base font-black text-emerald-400">PASSED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span className="text-base font-black text-rose-400">FAILED</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">ASME Sec V Compliant</span>
              </div>
            </div>
          </div>

          {/* Notes and Official Stamp */}
          <div className="grid sm:grid-cols-3 gap-6 items-center pt-2">
            <div className="sm:col-span-2 space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block">
                {isAr ? 'الملاحظات الفنية للمقيم الهندسي:' : 'Technical Evaluator Remarks:'}
              </span>
              <p className="p-3 rounded-xl bg-[#0b102b] border border-[#1b224d] text-slate-300 leading-relaxed text-[11px]">
                {isAr ? reportData.evaluatorNotesAr : reportData.evaluatorNotesEn}
              </p>
            </div>

            {/* Verification Stamp Box */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block">
                CALIBRATION VERIFIED
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">ASNT Level III Authorized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
