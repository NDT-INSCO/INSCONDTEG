import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Check,
  Users,
  Calendar,
  Wrench,
  Zap,
  Film,
  Send,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Language } from '../../types';
import {
  ESTIMATOR_SERVICES,
  THICKNESS_TIER_OPTIONS,
  MOBILIZATION_ZONE_OPTIONS,
  EstimatorServiceId,
  WallThicknessTier,
  MobilizationZone,
  ShiftSchedule,
  EstimatorCurrency,
  calculateProjectEstimate,
  formatEstimatorCurrency,
  buildEstimateRfqSummary,
} from '../../utils/projectCostEstimator';
import { RFQ_QUICK_ACTION_EVENT, RfqQuickActionDetail } from './CompanyQuickActionsSection';

export interface CompanyProjectCostEstimatorProps {
  language: Language;
  onTransferToRfq?: () => void;
}

export const CompanyProjectCostEstimator: React.FC<CompanyProjectCostEstimatorProps> = ({
  language,
  onTransferToRfq,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [selectedServices, setSelectedServices] = useState<EstimatorServiceId[]>(['pwht', 'ut']);
  const [jointCount, setJointCount] = useState<number>(40);
  const [thicknessTier, setThicknessTier] = useState<WallThicknessTier>('medium_std');
  const [mobilizationZone, setMobilizationZone] = useState<MobilizationZone>('cairo_suez');
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule>('day_standard');
  const [currency, setCurrency] = useState<EstimatorCurrency>('USD');
  const [transferredNotice, setTransferredNotice] = useState<boolean>(false);

  const toggleService = (serviceId: EstimatorServiceId) => {
    setTransferredNotice(false);
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        // Keep at least 1 service selected so estimate stays meaningful
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  const handleResetDefaults = () => {
    setSelectedServices(['pwht', 'ut']);
    setJointCount(40);
    setThicknessTier('medium_std');
    setMobilizationZone('cairo_suez');
    setShiftSchedule('day_standard');
    setTransferredNotice(false);
  };

  const estimateInput = useMemo(
    () => ({
      selectedServices,
      jointCount,
      thicknessTier,
      mobilizationZone,
      shiftSchedule,
    }),
    [selectedServices, jointCount, thicknessTier, mobilizationZone, shiftSchedule]
  );

  const estimate = useMemo(
    () => calculateProjectEstimate(estimateInput),
    [estimateInput]
  );

  const activeZone =
    MOBILIZATION_ZONE_OPTIONS.find((z) => z.id === mobilizationZone) ??
    MOBILIZATION_ZONE_OPTIONS[0];

  const handleTransferEstimateToRfq = () => {
    const summaryText = buildEstimateRfqSummary(estimateInput, estimate, currency, language);

    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<RfqQuickActionDetail>(RFQ_QUICK_ACTION_EVENT, {
          detail: {
            serviceType: estimate.primaryRfqServiceValue,
            projectLocation: activeZone.locationLabel[language],
            description: summaryText,
          },
        })
      );
    }

    setTransferredNotice(true);

    if (onTransferToRfq) {
      onTransferToRfq();
    } else if (typeof document !== 'undefined') {
      const rfqEl = document.getElementById('rfq');
      if (rfqEl && typeof rfqEl.scrollIntoView === 'function') {
        rfqEl.scrollIntoView({ behavior: 'smooth' });
      }
    }

    if (typeof document !== 'undefined') {
      const companyInput = document.getElementById('rfq-company-input') as HTMLInputElement | null;
      if (companyInput && typeof companyInput.focus === 'function') {
        companyInput.focus({ preventScroll: true });
      }
    }
  };

  return (
    <section
      id="cost-estimator"
      aria-labelledby="cost-estimator-heading"
      className="py-16 border-b border-slate-800 bg-slate-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4" aria-hidden="true" />
              <span>
                {isAr
                  ? 'حاسبة تكلفة ومتطلبات المشروعات الهندسية (Project Cost Estimator)'
                  : 'Project Cost & Resource Estimator'}
              </span>
            </div>
            <h2
              id="cost-estimator-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
            >
              {isAr
                ? 'قدّر ميزانية مشروعك والأسطول والطاقم المطلوب فورياً'
                : 'Interactive Project Cost & Mobilization Requirements Estimator'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'اختر نوعاً واحداً أو حزمة متكاملة من خدمات الفحص والمعالجة الحرارية (PWHT، UT/PAUT، RT الجاما والإكس راي، MT/PT، PMI) لحساب الميزانية التقديرية وعدد المعدات وأيام العمل الميدانية.'
                : 'Select one or multiple inspection and heat treatment disciplines (PWHT, UT/PAUT, RT, MT/PT, PMI, Hydrotest) to estimate budgetary cost ranges, crew size, fleet units, and site duration.'}
            </p>
          </div>

          {/* Currency & Reset Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label={isAr ? 'عملة التقدير' : 'Estimator Currency'}
              className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1"
            >
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EGP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  currency === 'EGP'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EGP (ج.م)
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إعادة الضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Main 12-Column Interactive Estimator Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Service Multi-Select & Scope Parameters */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Service Types */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isAr
                    ? '1. اختر الخدمات الهندسية المطلوبة بالمشروع (متعدد الاختيارات)'
                    : '1. Select Required Inspection & PWHT Services (Multi-Select)'}
                </h3>
                <span className="text-xs font-mono text-cyan-400 tabular-nums">
                  {selectedServices.length} / {ESTIMATOR_SERVICES.length}{' '}
                  {isAr ? 'خدمات محددة' : 'Selected'}
                  {selectedServices.length >= 3
                    ? isAr
                      ? ' · خصم حزمة 5%'
                      : ' · 5% Bundle Applied'
                    : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ESTIMATOR_SERVICES.map((svc) => {
                  const isSelected = selectedServices.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      aria-pressed={isSelected}
                      data-testid={`estimator-service-${svc.id}`}
                      onClick={() => toggleService(svc.id)}
                      className={`p-4 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {svc.shortCode}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              isSelected
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold">{svc.name[language]}</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {svc.description[language]}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                        <span>{svc.governingCode}</span>
                        <span className="text-slate-200 font-bold">
                          {formatEstimatorCurrency(svc.baseRateUsdPerJoint, currency)}/
                          {isAr ? 'وصلة' : 'jt'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Project Volume, Pipe Spec, Site Zone & Schedule */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 space-y-5">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isAr
                  ? '2. حدد حجم الأعمال ومواصفات الموقع والجدول الزمني'
                  : '2. Configure Weld Joint Volume, Pipe Tier & Mobilization'}
              </h3>

              {/* Joint Count Slider + Direct Number Input */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <label htmlFor="estimator-joint-count" className="font-bold text-slate-200">
                    {isAr
                      ? 'إجمالي عدد وصلات اللحام / نقاط الفحص:'
                      : 'Estimated Weld Joints / Test Points:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="estimator-joint-count"
                      type="number"
                      min={1}
                      max={1000}
                      value={jointCount}
                      onChange={(e) =>
                        setJointCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))
                      }
                      className="w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-xs text-center tabular-nums"
                    />
                    <span className="text-slate-400 font-mono">
                      {isAr ? 'وصلة' : 'joints'}
                    </span>
                  </div>
                </div>
                <input
                  aria-label={isAr ? 'شريط تمرير عدد الوصلات' : 'Weld joint count slider'}
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={Math.min(500, jointCount)}
                  onChange={(e) => setJointCount(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Diameter / Wall Thickness Tier */}
                <div className="space-y-1.5">
                  <label htmlFor="estimator-thickness-tier" className="block text-xs font-bold text-slate-200">
                    {isAr
                      ? 'فئة الأقطار وسماكة الجدار:'
                      : 'Pipe Diameter & Wall Thickness:'}
                  </label>
                  <select
                    id="estimator-thickness-tier"
                    value={thicknessTier}
                    onChange={(e) => setThicknessTier(e.target.value as WallThicknessTier)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  >
                    {THICKNESS_TIER_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label[language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobilization Zone */}
                <div className="space-y-1.5">
                  <label htmlFor="estimator-zone" className="block text-xs font-bold text-slate-200">
                    {isAr
                      ? 'النطاق الجغرافي للمشروع:'
                      : 'Project Site & Mobilization Zone:'}
                  </label>
                  <select
                    id="estimator-zone"
                    value={mobilizationZone}
                    onChange={(e) => setMobilizationZone(e.target.value as MobilizationZone)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  >
                    {MOBILIZATION_ZONE_OPTIONS.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.locationLabel[language]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shift Schedule Toggle */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-200">
                  {isAr ? 'نظام التشغيل والورديات بالموقع:' : 'Execution Shift Schedule:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShiftSchedule('day_standard')}
                    className={`p-3 rounded-xl border text-xs font-bold text-start transition cursor-pointer ${
                      shiftSchedule === 'day_standard'
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>{isAr ? 'وردية نهارية قياسية (10 ساعات)' : 'Standard Day Shift (10h)'}</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        shiftSchedule === 'day_standard' ? 'text-cyan-100' : 'text-slate-400'
                      }`}
                    >
                      {isAr ? 'للمشروعات الإنشائية والتصنيع' : 'Optimal cost for fabrication & construction'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftSchedule('shutdown_24_7')}
                    className={`p-3 rounded-xl border text-xs font-bold text-start transition cursor-pointer ${
                      shiftSchedule === 'shutdown_24_7'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {isAr
                        ? 'طوارئ وعَمرة متواصلة 24/7 (ورديتان)'
                        : '24/7 Turnaround / Shutdown (Dual Crew)'}
                    </div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        shiftSchedule === 'shutdown_24_7' ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {isAr
                        ? 'يختصر مدة التنفيذ بمقدار ~43% لتوقفات المصافي'
                        : 'Cuts site duration by ~43% for critical outages'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Live Cost Breakdown & Project Resource Requirements */}
          <div className="lg:col-span-5 rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 space-y-5 shadow-xl">
            {/* Estimated Budgetary Range Banner */}
            <div className="pb-4 border-b border-slate-800 space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                {isAr ? 'النطاق المالي التقديري للمشروع' : 'Estimated Project Budget Range'}
              </div>
              <div
                data-testid="estimator-budget-range"
                className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums"
              >
                {formatEstimatorCurrency(estimate.minBudgetUsd, currency)} –{' '}
                {formatEstimatorCurrency(estimate.maxBudgetUsd, currency)}
              </div>
              <div className="text-xs font-mono text-slate-400 tabular-nums">
                {isAr ? 'القيمة المرجعية المتوسطة:' : 'Midpoint Estimate:'}{' '}
                <strong className="text-amber-400">
                  {formatEstimatorCurrency(estimate.totalMidpointUsd, currency)}
                </strong>
              </div>
            </div>

            {/* Estimated Operational Requirements Grid */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isAr
                  ? 'متطلبات التنفيذ والموارد الميدانية المقدرة'
                  : 'Estimated Project Requirements'}
              </div>

              <div className="grid grid-cols-2 gap-3 tabular-nums">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    <span>{isAr ? 'المدة الزمنية بالموقع' : 'Est. Site Duration'}</span>
                  </div>
                  <div
                    data-testid="estimator-site-days"
                    className="text-lg font-black text-white font-mono mt-1"
                  >
                    {estimate.estimatedSiteDays} {isAr ? 'أيام عمل' : 'Days'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Users className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    <span>{isAr ? 'الطاقم الهندسي المعتمد' : 'Certified Crew'}</span>
                  </div>
                  <div
                    data-testid="estimator-crew-count"
                    className="text-lg font-black text-white font-mono mt-1"
                  >
                    {estimate.totalCertifiedPersonnel}{' '}
                    {isAr ? 'أفراد' : 'Personnel'}
                  </div>
                </div>

                {estimate.pwhtUnitsAllocated > 0 && (
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Zap className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
                      <span>{isAr ? 'قدرة التغذية الكهربائية' : 'PWHT Power Load'}</span>
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-1">
                      {estimate.pwhtUnitsAllocated}× 65kW ({estimate.requiredGeneratorKva} kVA)
                    </div>
                  </div>
                )}

                {estimate.estimatedRtFilms > 0 && (
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Film className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>{isAr ? 'أفلام الأشعة المقدرة' : 'Est. RT Film Count'}</span>
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-1">
                      ~{estimate.estimatedRtFilms} {isAr ? 'فيلم ASTM' : 'Films'}
                    </div>
                  </div>
                )}
              </div>

              {estimate.includesRsoOfficer && (
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? 'يتضمن مسؤول وقاية إشعاعية مرخص (ENRRA RSO) وعربة تحميض متنقلة.'
                      : 'Includes dedicated ENRRA Radiation Safety Officer (RSO) & mobile darkroom.'}
                  </span>
                </div>
              )}
            </div>

            {/* Itemized Service & Fleet Breakdown */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>
                  {isAr ? 'تفصيل البنود والمعدات المخصصة' : 'Itemized Service & Fleet Allocation'}
                </span>
              </div>

              <div className="space-y-2 text-xs tabular-nums">
                {estimate.lineItems.map((item) => (
                  <div
                    key={item.serviceId}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{item.shortCode}</span>
                      <span className="font-mono text-cyan-400">
                        {formatEstimatorCurrency(item.costUsd, currency)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>
                        {item.equipmentUnits}× {item.equipmentUnitName[language]}
                      </span>
                      <span>
                        {item.crewCount} {isAr ? 'فنيين' : 'crew'} · {item.serviceDays}d
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>
                    {isAr
                      ? 'الانتشار اللوجستي وتصاريح السلامة (Mobilization)'
                      : 'Site Mobilization & HSE Logistics'}
                  </span>
                  <span className="font-bold text-slate-200">
                    {formatEstimatorCurrency(estimate.mobilizationUsd, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* One-Click Transfer Estimate to Formal RFQ */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                data-testid="estimator-transfer-rfq-btn"
                onClick={handleTransferEstimateToRfq}
                className="w-full py-3.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'تحويل التقدير والمواصفات إلى طلب عرض سعر رسمي (#RFQ)'
                    : 'Lock Scope & Request Official Quote (#RFQ)'}
                </span>
                <ArrowIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              {transferredNotice && (
                <div role="status" className="text-xs font-mono text-emerald-400 text-center">
                  {isAr
                    ? 'تم نسخ تفاصيل التقدير والموقع تلقائياً إلى نموذج #RFQ بالأسفل.'
                    : 'Estimate scope and location populated into the #RFQ form below.'}
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAr
                  ? 'الأرقام أعلاه استرشادية لتخطيط ميزانيات المشروعات؛ يصدر العرض المالي الملزم بعد مراجعة جدول الأقطار (Weld Map) من الإدارة الفنية.'
                  : 'Figures represent planning estimates; binding commercial rates are issued upon weld-map review by Technical Operations.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
