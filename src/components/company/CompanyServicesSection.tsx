import React, { useState } from 'react';
import { Language } from '../../types';
import { COMMERCIAL_NDT_METHODS, INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { COMPANY_MEDIA } from '../../data/companyMedia';
import { CompanyRegionalFleetMap } from './CompanyRegionalFleetMap';
import { SERVICE_FAMILIES, type ServiceFamilyId } from '../../utils/serviceFamilies';
import { SectionHeading } from '../ui/SectionHeading';
import { 
  Flame, 
  Wrench, 
  CheckCircle2, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Thermometer
} from 'lucide-react';

interface CompanyServicesSectionProps {
  language: Language;
  onNavigateToAcademyModule?: (subTab: string) => void;
  /** Opens the dedicated technical-demonstrations page (`#demo`). */
  onOpenDemo?: () => void;
  /** Opens a shareable page per service family (`#services/ndt` …). */
  onOpenService?: (id: ServiceFamilyId) => void;
}

export const CompanyServicesSection: React.FC<CompanyServicesSectionProps> = ({
  language,
  onNavigateToAcademyModule,
  onOpenDemo,
  onOpenService,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('UT');

  const pwhtImagePath = COMPANY_MEDIA.pwhtHeatTreatment;
  const rtImagePath = COMPANY_MEDIA.radiographyGammaScan;
  const pautImagePath = COMPANY_MEDIA.pautFlawDetector;

  const categories = [
    { id: 'all', label: { ar: 'كافة الطرق المعروضة', en: 'All listed methods' } },
    { id: 'volumetric', label: { ar: 'الفحوصات الحجمية (Volumetric)', en: 'Volumetric NDT' } },
    { id: 'surface', label: { ar: 'الفحوصات السطحية (Surface)', en: 'Surface NDT' } },
    { id: 'analysis', label: { ar: 'التحليل والصلادة (Field Metallurgy)', en: 'Field Analysis' } },
    { id: 'pressure', label: { ar: 'الضغط والمعالجة (Pressure & PWHT)', en: 'Heat & Pressure' } },
  ];

  const filteredMethods = COMMERCIAL_NDT_METHODS.filter(method => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'volumetric') return ['UT', 'RT', 'PAUT'].includes(method.code);
    if (activeCategory === 'surface') return ['VT', 'MT', 'PT', 'PC'].includes(method.code);
    if (activeCategory === 'analysis') return ['PMI', 'HT'].includes(method.code);
    if (activeCategory === 'pressure') return ['HYDRO', 'SR'].includes(method.code);
    return true;
  });

  const selectedMethod = COMMERCIAL_NDT_METHODS.find(m => m.code === selectedMethodId) || COMMERCIAL_NDT_METHODS[0];

  const handleSelectMethodFromMap = (methodCode: string) => {
    setActiveCategory('all');
    setSelectedMethodId(methodCode);
    const catalogEl = document.getElementById('ndt-methods-catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="services" className="py-16 border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <SectionHeading
          className="mb-12"
          eyebrow={isAr ? 'مجالات العمل والمعدات' : 'Inspection and heat treatment'}
          title={
            isAr
              ? 'طرق الفحص غير الإتلافي والمعالجة الحرارية'
              : 'NDT methods and heat treatment'
          }
          description={
            isAr
              ? 'تعرّف على الاستخدامات والمراجع الشائعة لكل طريقة. يراجع الفريق الفني الإجراء المطلوب والمعدات المتاحة لكل مشروع.'
              : 'Compare typical applications and references. The technical team confirms the applicable procedure and equipment for your project.'
          }
        />

        {/* Four service families, each with its own shareable page. */}
        {onOpenService && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
            {SERVICE_FAMILIES.map(family => (
              <button
                key={family.id}
                type="button"
                onClick={() => onOpenService(family.id)}
                className="group text-start rounded-xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 p-4 transition cursor-pointer"
              >
                <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition">
                  {family.title[language]}
                </div>
                <div className="mt-1 text-xs text-slate-400">{family.short[language]}</div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
                  {isAr ? 'تفاصيل الخدمة' : 'Service details'}
                  <ArrowIcon className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PWHT Fleet Feature Spotlight Card with Authentic Photography & Thermal HUD */}
        <div className="mb-14 rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/90 to-cyan-950/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Descriptive info & Standards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {INSCO_COMPANY_DATA.pwhtFleet.title[language]}
                  </h3>
                  <div className="text-xs text-cyan-400 font-mono">
                    {isAr ? '16 وحدة إلكترونية مملوكة بالكامل في مصر' : '16 Fully-Owned Computerized Units in Egypt'}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {INSCO_COMPANY_DATA.pwhtFleet.description[language]}
              </p>

              {/* PWHT Features & Standards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {INSCO_COMPANY_DATA.pwhtFleet.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat[language]}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono text-slate-400">
                <span className="text-slate-500">{isAr ? 'الأكواد المطبقة:' : 'Governing Codes:'}</span>
                {INSCO_COMPANY_DATA.pwhtFleet.codes.map((code, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-200 border border-slate-700/60">
                    {code}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {onNavigateToAcademyModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateToAcademyModule('pwht_curve')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-lg transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isAr ? 'محاكي منحنيات PWHT التفاعلي' : 'Open PWHT Curve Simulator'}</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  {isAr ? 'استجابة سريعة 24/7 للمواقع البترولية' : '24/7 Immediate Site Dispatch'}
                </span>
              </div>
            </div>

            {/* Right Column: High-Res Real Thermal PWHT Photograph with Telemetry Overlay */}
            <div
              data-preserve-dark="true"
              className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 group"
            >
              <img
                src={pwhtImagePath}
                alt={isAr ? 'عملية المعالجة الحرارية بعد اللحام PWHT' : 'PWHT post weld heat treatment operation'}
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-72 object-cover transition duration-700 group-hover:scale-105"
              />

              {/* Thermal glow overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Top Temperature Badge */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none">
                <div className="px-2.5 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-rose-500/40 text-rose-400 flex items-center gap-1.5 font-bold">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>742°C / 750°C SOAK</span>
                </div>
                <div className="px-2.5 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-slate-700 text-slate-200">
                  {INSCO_COMPANY_DATA.pwhtFleet.unitCount} {isAr ? 'وحدات 65 kW' : 'Units'}
                </div>
              </div>

              {/* Bottom Stat Strip */}
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px]">
                    {isAr ? 'وحدة معالجة حرارية 65 kW أوتوماتيكية' : '65 kW Automatic Programmed Unit'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    AWS D10.10 & ASME B31.3 · 6-Channel Strip Recorder
                  </div>
                </div>
                <div className="text-end font-mono text-xs font-black text-cyan-400">
                  16 {isAr ? 'وحدة' : 'Units'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Regional Map of PWHT 16-Unit Fleet & Project Sites */}
        <CompanyRegionalFleetMap
          language={language}
          onSelectNdtMethod={handleSelectMethodFromMap}
          onNavigateToAcademyModule={onNavigateToAcademyModule}
        />

        {/* 12 NDT Methods Matrix Header & Segmented Filter */}
        <div id="ndt-methods-catalog" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'فهرس طرق الفحص غير الإتلافي' : 'Non-Destructive Testing Methods Catalog'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'اختر الطريقة للاطلاع على المعدات والرمز والكود الهندسي المرجعي' : 'Select a method to review typical equipment and reference specifications'}
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label[language]}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Method Explorer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list of methods */}
            <div className="lg:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredMethods.map(method => {
                const isSelected = selectedMethod.code === method.code;
                return (
                  <button
                    key={method.code}
                    type="button"
                    onClick={() => setSelectedMethodId(method.code)}
                    className={`w-full text-start p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/20 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded bg-slate-800 text-cyan-400 font-mono text-xs font-bold border border-slate-700/60">
                        {method.code}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {method.name[language]}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {method.category[language]}
                        </div>
                      </div>
                    </div>
                    <ArrowIcon className={`w-4 h-4 shrink-0 transition ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Right selected method specification view with Visual Proof */}
            <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-black text-cyan-400">
                      {selectedMethod.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedMethod.category[language]}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-1">
                    {selectedMethod.name[language]}
                  </h4>
                </div>
                <div className="text-end font-mono text-xs text-slate-400">
                  <div>{isAr ? 'الكود المرجعي:' : 'Standard:'}</div>
                  <div className="text-cyan-300 font-semibold">{selectedMethod.standards}</div>
                </div>
              </div>

              {/* Dynamic Image Display for RT, PAUT, UT */}
              {selectedMethod.code === 'RT' ? (
                <div className="relative rounded-lg overflow-hidden border border-purple-500/30 group">
                  <img
                    src={rtImagePath}
                    alt={isAr ? 'جهاز التصوير الإشعاعي الصناعي جاما' : 'Industrial gamma radiographic testing device'}
                    referrerPolicy="no-referrer"
                    className="w-full h-48 object-cover transition duration-500 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 text-[11px] font-mono text-slate-200 flex justify-between items-center">
                    <span className="text-purple-300">{isAr ? 'ترخيص رسمي من هيئة الرقابة النووية (ENRRA)' : 'ENRRA Practice Licensed (Ir-192/Se-75)'}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-200">Spec 150 / Sentinel</span>
                  </div>
                </div>
              ) : (selectedMethod.code === 'PAUT' || selectedMethod.code === 'UT') ? (
                <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 group">
                  <img
                    src={pautImagePath}
                    alt={isAr ? 'جهاز فحص الموجات فوق الصوتية والمصفوفات الطورية' : 'Phased array ultrasonic flaw detector S-scan'}
                    referrerPolicy="no-referrer"
                    className="w-full h-48 object-cover transition duration-500 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 text-[11px] font-mono text-slate-200 flex justify-between items-center">
                    <span className="text-cyan-300">{isAr ? 'مسح قطاعي S-Scan للكشف عن عيوب جذر اللحام' : 'Sectorial S-Scan Root Flaw Imaging'}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-200">Olympus OmniScan</span>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  {isAr ? 'نطاق الفحص والتطبيق الصناعي:' : 'Operational Scope & Industrial Application:'}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedMethod.description[language]}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-4 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isAr ? 'المعدات وأجهزة الفحص المعتمدة:' : 'Approved & Calibrated Equipment Fleet:'}</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-mono">
                  {selectedMethod.equipment[language]}
                </div>
              </div>

              {/* Cross link to Academy Virtual Lab / Modules */}
              {onNavigateToAcademyModule && (
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                  <span>
                    {isAr
                      ? 'متاح في معمل المحاكاة ثلاثي الأبعاد بالأكاديمية'
                      : 'Simulate this method in the Academy Virtual Lab'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToAcademyModule(
                        selectedMethod.code === 'RT' ? 'rt_lab' : 'workshops'
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isAr ? 'فتح المحاكاة التفاعلية' : 'Launch 3D Lab'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supplementary Corporate Services (Welding, QC/QA Manpower, Equipment Rental) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {INSCO_COMPANY_DATA.services.map(svc => (
            <div
              key={svc.id}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                  <Wrench className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {svc.title[language]}
                </h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {svc.description[language]}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {svc.highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{hl[language]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bridge to the demonstrations page: the labs used to sit here and
            pushed the accreditations ten screens down. */}
        {onOpenDemo && (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">
                {isAr ? 'شاهد كيف نقرأ الإشارة قبل أن نحكم' : 'See how we read the signal before judging'}
              </div>
              <p className="mt-1 text-xs text-slate-400 max-w-xl leading-relaxed">
                {isAr
                  ? 'محاكي دورة PWHT، عارض أفلام إشعاعية، ومعمل UT/PAUT — كلها في صفحة عرض فني واحدة، بلا مزاحمة للمحتوى التجاري.'
                  : 'PWHT cycle simulator, radiographic film lightbox and the UT/PAUT lab — together on one demonstrations page, without crowding the commercial content.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDemo}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition whitespace-nowrap cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              {isAr ? 'افتح العرض الفني' : 'Open demonstrations'}
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
