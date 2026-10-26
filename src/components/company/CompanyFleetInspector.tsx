import React, { useState } from 'react';
import { Language } from '../../types';
import { 
  Flame, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  Calendar, 
  Wrench, 
  ExternalLink,
  Search,
  Radio,
  FileCheck2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface FleetEquipment {
  id: string;
  name: { ar: string; en: string };
  category: 'pwht' | 'ut' | 'rt' | 'mt_pt' | 'metallurgy' | 'hydro';
  ownedQty: number;
  model: string;
  manufacturer: string;
  serialRange: string;
  calibrationBody: string;
  calibrationStatus: { ar: string; en: string };
  validity: string;
  applications: { ar: string; en: string }[];
  keySpecs: { label: { ar: string; en: string }; value: string }[];
  deployedProjects: string[];
}

const FLEET_REGISTRY: FleetEquipment[] = [
  {
    id: 'pwht-65kw',
    name: {
      ar: 'وحدات المعالجة الحرارية الأوتوماتيكية 65 kW (16 وحدة مملوكة)',
      en: '65 kW Automatic Heat Treatment Units (16 Owned Units)'
    },
    category: 'pwht',
    ownedQty: 16,
    model: '65 kVA 6-Channel Auto Programmer',
    manufacturer: 'Cooperheat / Stork Engineering',
    serialRange: 'INS-PWHT-01 to INS-PWHT-16',
    calibrationBody: 'National Institute for Standards (NIS) / Traceable NIST',
    calibrationStatus: { ar: 'معايرة معتمدة وسارية', en: 'Verified & Calibrated' },
    validity: 'Valid to Dec 2026',
    applications: [
      { ar: 'تسخين مبدئي ومعالجة حرارية بعد اللحام للمواسير والأوعية', en: 'Pre-heating & Post-Weld Heat Treatment for Piping' },
      { ar: 'معالجة سبائك P91, P22, P11, P5 في محطات الطاقة', en: 'Alloy heat treatment P91, P22, P11 in CCPP power plants' }
    ],
    keySpecs: [
      { label: { ar: 'القدرة الكهربية', en: 'Power Rating' }, value: '65 kVA / 400V 3-Phase' },
      { label: { ar: 'قنوات التحكم', en: 'Control Channels' }, value: '6 Independent PID Zones' },
      { label: { ar: 'مسجل درجات الحرارة', en: 'Recorder' }, value: 'Chino / Eurotherm 6-Pt Strip Chart' },
      { label: { ar: 'أقصى درجة حرارة', en: 'Max Temperature' }, value: '1,200 °C' }
    ],
    deployedProjects: ['Burullus 4,800 MW CCPP', 'Talkha Power Plant', 'El-Kureimat', 'El Sewedy Electric']
  },
  {
    id: 'olympus-paut',
    name: {
      ar: 'أجهزة فحص الموجات والمصفوفات الطورية (Olympus OmniScan)',
      en: 'Phased Array Ultrasonic Flaw Detectors (Olympus OmniScan)'
    },
    category: 'ut',
    ownedQty: 4,
    model: 'OmniScan X3 / MX2 64:128PR',
    manufacturer: 'Olympus NDT / Evident Scientific',
    serialRange: 'INS-UT-PA01 to PA04',
    calibrationBody: 'Evident Certified Calibration Lab (ISO 17025)',
    calibrationStatus: { ar: 'معايرة إلكترونية سنوية معتمدة', en: 'Factory Calibrated' },
    validity: 'Valid to Nov 2026',
    applications: [
      { ar: 'فحص رقمي مشفر لوصلات اللحام المحيطية واستبدال الأشعة RT', en: 'Encoded sectorial weld inspection replacing conventional RT' },
      { ar: 'كشف شروخ الجذور ونقص الانصهار بمسح قطاعي S-Scan و L-Scan', en: 'Root cracks, LOF, and porosity volumetric sizing' }
    ],
    keySpecs: [
      { label: { ar: 'المصفوفة الإلكترونية', en: 'Pulser / Receiver' }, value: '32:128PR & 64:128PR' },
      { label: { ar: 'الماسح المشفر', en: 'Encoder' }, value: 'Mini-Wheel Optical Encoder' },
      { label: { ar: 'زوايا المسح', en: 'Beam Angles' }, value: '35° to 75° Sectorial' }
    ],
    deployedProjects: ['Burullus CCPP Steam Lines', 'PetroMasila Yemen', 'NVOC Borg El-Arab']
  },
  {
    id: 'krautkramer-usm',
    name: {
      ar: 'أجهزة قياس العيوب بالموجات فوق الصوتية (Krautkramer USM 35X)',
      en: 'Digital Ultrasonic Flaw Detectors (Krautkramer USM 35X)'
    },
    category: 'ut',
    ownedQty: 8,
    model: 'USM 35X DAC/AWS',
    manufacturer: 'GE Sensing & Inspection / Krautkramer',
    serialRange: 'INS-UT-01 to INS-UT-08',
    calibrationBody: 'National Standards Lab (NIS Egypt)',
    calibrationStatus: { ar: 'معايرة نصف سنوية دورية', en: 'Calibrated with IIW Blocks' },
    validity: 'Valid to Oct 2026',
    applications: [
      { ar: 'فحص يدوي شامل للحامات الأنابيب والصفائح المعدنية', en: 'Manual UT of pipe welds and structural plates' },
      { ar: 'قياس دقيق لسماكة الجدران المتبقية وكشف التآكل الداخلي', en: 'Precision wall thickness and internal corrosion surveys' }
    ],
    keySpecs: [
      { label: { ar: 'التردد التشغيلي', en: 'Frequency Range' }, value: '0.5 to 20 MHz' },
      { label: { ar: 'منحنيات المقارنة', en: 'Evaluation Curve' }, value: 'ASME DAC, TCG, DGS & AWS D1.1' },
      { label: { ar: 'قوالب المعايرة', en: 'Calibration Blocks' }, value: 'V1 / V2 & Step Wedges' }
    ],
    deployedProjects: ['Ayoun Mousa Power Station', 'Talkha CCPP', 'Elsewedy Transformers']
  },
  {
    id: 'sentinel-rt',
    name: {
      ar: 'حاويات التصوير الإشعاعي الصناعي بجاما (Sentinel 880 Delta)',
      en: 'Gamma Industrial Radiography Projectors (Sentinel 880)'
    },
    category: 'rt',
    ownedQty: 6,
    model: 'Sentinel 880 Delta / SPEC 150',
    manufacturer: 'QSA Global / Source Production',
    serialRange: 'INS-RT-01 to INS-RT-06',
    calibrationBody: 'Egyptian Nuclear & Radiological Regulatory Authority (ENRRA)',
    calibrationStatus: { ar: 'مرخص ومحصن من هيئة الرقابة النووية', en: 'ENRRA Practice Licensed' },
    validity: 'License LS.0112 Valid',
    applications: [
      { ar: 'تصوير إشعاعي صناعي لأنابيب الغاز والنفط والأوعية المضغوطة', en: 'Volumetric radiography for cross-country pipelines & vessels' },
      { ar: 'توثيق أرشيفي دائم على أفلام صناعية وكواشف رقمية', en: 'Permanent radiographic film archival & digital CR' }
    ],
    keySpecs: [
      { label: { ar: 'المصادر المشعة', en: 'Radioisotopes' }, value: 'Iridium-192 & Selenium-75' },
      { label: { ar: 'أقصى نشاط إشعاعي', en: 'Max Capacity' }, value: '100 Ci (Ir-192)' },
      { label: { ar: 'كوليماتور الحزمة', en: 'Collimator' }, value: 'Tungsten Directional 60°' }
    ],
    deployedProjects: ['ORASCOM Power Projects', 'El Sewedy Electric (PO GM102473)', 'Bagram Airfield Project']
  },
  {
    id: 'niton-pmi',
    name: {
      ar: 'محلل السبائك المحمول بالأشعة السينية (Thermo Niton XL2)',
      en: 'Handheld XRF Positive Material Analyzer (Thermo Niton)'
    },
    category: 'metallurgy',
    ownedQty: 2,
    model: 'Niton XL2 GOLDD Ultra',
    manufacturer: 'Thermo Fisher Scientific',
    serialRange: 'INS-PMI-01 & 02',
    calibrationBody: 'Thermo Fisher Certified Factory Calibration',
    calibrationStatus: { ar: 'معايرة بمعايير معتمدة NIST Standard', en: 'NIST Standards Verified' },
    validity: 'Valid to Dec 2026',
    applications: [
      { ar: 'تحليل فوري لتركيب سبائك الصلب المقاوم للصدأ والكروم موليبدينوم', en: 'Instant chemical verification for Cr-Mo & Stainless Steel' },
      { ar: 'منع خلط المواد بمستودعات البترول ومواقع التركيبات', en: 'Material mix-up prevention on refineries & piping spools' }
    ],
    keySpecs: [
      { label: { ar: 'العناصر القابلة للتحليل', en: 'Element Range' }, value: 'Ti to Bi (Cr, Ni, Mo, V, Mn, Fe)' },
      { label: { ar: 'زمن التحليل', en: 'Test Duration' }, value: '2 - 5 Seconds' },
      { label: { ar: 'مكتبة السبائك', en: 'Alloy Library' }, value: '500+ Standard Grade Alloys' }
    ],
    deployedProjects: ['Burullus 4,800 MW CCPP', 'PetroMasila Yemen', 'Ayoun Mousa Station']
  },
  {
    id: 'parker-mt',
    name: {
      ar: 'حدوات الفحص بالجسيمات المغناطيسية (Parker B-300 AC/DC)',
      en: 'Electromagnetic Particle Yokes (Parker B-300 AC/DC)'
    },
    category: 'mt_pt',
    ownedQty: 12,
    model: 'B-300 Contour Probe AC/DC',
    manufacturer: 'Parker Research Corp. (USA)',
    serialRange: 'INS-MT-01 to INS-MT-12',
    calibrationBody: 'National Standards Lab (Deadweight 10 lbs / 40 lbs test)',
    calibrationStatus: { ar: 'معايرة قوة الرفع الدورية مجددة', en: 'Lift Capacity Verified' },
    validity: 'Valid to Nov 2026',
    applications: [
      { ar: 'كشف شقوق السطح وتحت السطح باللحامات الإنشائية والأنابيب', en: 'Surface and sub-surface flaw detection in ferromagnetic welds' },
      { ar: 'فحوصات جسيمات رطبة وجافة وفلورية تحت الأشعة فوق البنفسجية', en: 'Dry powder, wet visible, and fluorescent UV inspections' }
    ],
    keySpecs: [
      { label: { ar: 'قوة الرفع بالتيار المتردد', en: 'AC Lift Capacity' }, value: '10 lbs (4.5 kg) Verified' },
      { label: { ar: 'قوة الرفع بالتيار المستمر', en: 'DC Lift Capacity' }, value: '40 lbs (18 kg) Verified' },
      { label: { ar: 'أذرع التثبيت', en: 'Leg Configuration' }, value: 'Double Jointed Articulated' }
    ],
    deployedProjects: ['El Sewedy Electric', 'Talkha Expansions', 'US Army Bagram Project']
  },
  {
    id: 'maximator-hydro',
    name: {
      ar: 'مضخات ومسجلات الضغط الهيدروستاتيكي العالي (Maximator Skid)',
      en: 'High-Pressure Hydrostatic Testing Skids (Maximator 15,000 PSI)'
    },
    category: 'hydro',
    ownedQty: 4,
    model: 'Maximator Air-Driven Liquid Pump Skid',
    manufacturer: 'Maximator GmbH (Germany)',
    serialRange: 'INS-HYD-01 to 04',
    calibrationBody: 'Egyptian Organization for Standardization (EOS)',
    calibrationStatus: { ar: 'مانومترات ومسجلات معايرة معتمدة', en: 'Deadweight Calibrated' },
    validity: 'Valid to Jan 2027',
    applications: [
      { ar: 'اختبارات الضغط الهيدروستاتيكي للأنابيب والأوعية البترولية', en: 'Proof pressure testing for high-pressure process piping' },
      { ar: 'تسجيل بياني للضغط والحرارة على مسجلات دائرية معتمدة', en: 'Barton 2-Pen circular chart recording (Pressure & Temp)' }
    ],
    keySpecs: [
      { label: { ar: 'أقصى ضغط تشغيلي', en: 'Max Test Pressure' }, value: '15,000 PSI (1,034 Bar)' },
      { label: { ar: 'مسجل الضغط', en: 'Recorder' }, value: 'Barton 242E 2-Pen Circular Chart' },
      { label: { ar: 'دقة القياس', en: 'Accuracy' }, value: 'Class 0.5% Full Scale' }
    ],
    deployedProjects: ['NVOC Borg El-Arab', 'PetroMasila Yemen', 'Orascom Power Stations']
  }
];

interface CompanyFleetInspectorProps {
  language: Language;
}

export const CompanyFleetInspector: React.FC<CompanyFleetInspectorProps> = ({ language }) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('pwht-65kw');

  const categories = [
    { id: 'all', label: { ar: 'كافة المعدات والأسطول (48+ جهاز)', en: 'All Fleet (48+ Units)' } },
    { id: 'pwht', label: { ar: 'وحدات PWHT (16 وحدة)', en: 'PWHT Fleet (16)' } },
    { id: 'ut', label: { ar: 'أجهزة الموجات UT / PAUT', en: 'Ultrasonic (UT/PAUT)' } },
    { id: 'rt', label: { ar: 'أجهزة جاما الإشعاعية RT', en: 'Gamma Radiography' } },
    { id: 'mt_pt', label: { ar: 'حدوات المغناطيسية MT/PT', en: 'Surface MT/PT' } },
    { id: 'metallurgy', label: { ar: 'تحليل السبائك والصلادة', en: 'PMI & Hardness' } },
    { id: 'hydro', label: { ar: 'مضخات الضغط الهيدروستاتيكي', en: 'Hydro Testing' } }
  ];

  const filteredFleet = FLEET_REGISTRY.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const selectedItem = FLEET_REGISTRY.find(i => i.id === selectedEquipmentId) || FLEET_REGISTRY[0];

  return (
    <section id="fleet-inspector" className="py-16 border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'سجل الأصول والمعايرة والتجهيزات الميدانية' : 'Traceable Equipment Fleet & Calibration Register'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr
                ? 'مستودع المعدات المملوكة بالكامل وجاهزية الانتشار الفوري'
                : '100% Company-Owned Fleet: Calibrated & Deployment Ready'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'تمتلك إنسكو أسطولاً متكاملاً من أرقى الشركات العالمية (Olympus, Cooperheat, Krautkramer, Sentinel) مخزناً بالورش المركزية بالقاهرة مع شهادات معايرة دورية معتمدة قابلة للتتبع طبقاً لـ NIST.'
                : 'INSCO operates a fully-owned, audited instrument fleet stored at our central Cairo workshops with certified calibration records traceable to national and international measurement institutes.'}
            </p>
          </div>

          <div className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-end shrink-0">
            <div className="text-2xl font-black text-cyan-400 font-mono tabular-nums">48+</div>
            <div className="text-xs text-slate-400">{isAr ? 'أجهزة رئيسية مملوكة' : 'Primary Calibrated Assets'}</div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              {cat.label[language]}
            </button>
          ))}
        </div>

        {/* Master Fleet Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Equipment List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredFleet.map(equip => {
              const isSelected = equip.id === selectedItem.id;
              return (
                <div
                  key={equip.id}
                  onClick={() => setSelectedEquipmentId(equip.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {equip.ownedQty} {isAr ? 'وحدات' : 'Units'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {equip.manufacturer}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 mt-1.5">
                        {equip.name[language]}
                      </h4>
                    </div>
                    <ArrowIcon className={`w-4 h-4 shrink-0 transition mt-1 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{equip.calibrationStatus[language]}</span>
                    </span>
                    <span>{equip.validity}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: In-Depth Technical Specification Dossier */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-cyan-400 mb-1">
                  {selectedItem.manufacturer} · {selectedItem.model}
                </div>
                <h3 className="text-xl font-black text-white">
                  {selectedItem.name[language]}
                </h3>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedItem.calibrationStatus[language]}</span>
              </div>
            </div>

            {/* Serial & Traceability Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-slate-500 text-[11px]">{isAr ? 'النطاق التسلسلي (Serial No):' : 'Serial Range:'}</div>
                <div className="text-slate-200 font-bold mt-0.5">{selectedItem.serialRange}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-slate-500 text-[11px]">{isAr ? 'جهة ومعهد المعايرة:' : 'Calibration Laboratory:'}</div>
                <div className="text-cyan-300 font-bold mt-0.5">{selectedItem.calibrationBody}</div>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                {isAr ? 'المواصفات الفنية المعتمدة للمعدة:' : 'Approved Equipment Technical Specifications:'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {selectedItem.keySpecs.map((spec, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="text-[11px] text-slate-400">{spec.label[language]}</div>
                    <div className="text-xs font-mono font-bold text-slate-100 mt-1">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Applications */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                {isAr ? 'التطبيقات الهندسية الميدانية:' : 'Field Operational Capabilities:'}
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {selectedItem.applications.map((app, aIdx) => (
                  <li key={aIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{app[language]}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deployed Mega Projects */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
                {isAr ? 'أبرز المشروعات التي تم تشغيل هذه المعدة بها:' : 'Landmark Projects Deployed On:'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedItem.deployedProjects.map((proj, pIdx) => (
                  <span
                    key={pIdx}
                    className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
                  >
                    {proj}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
