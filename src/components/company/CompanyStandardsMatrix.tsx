import React, { useState } from 'react';
import { Language } from '../../types';
import { 
  FileCheck, 
  Layers, 
  Flame, 
  ShieldAlert, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface StandardSector {
  id: string;
  name: { ar: string; en: string };
  icon: string;
  description: { ar: string; en: string };
  primaryCodes: string[];
  ndtHoldPoints: {
    method: string;
    applicableCode: string;
    stage: { ar: string; en: string };
    acceptanceCriteria: { ar: string; en: string };
  }[];
  pwhtRequirements: {
    material: string;
    thicknessThreshold: string;
    soakingTemp: string;
    codeRule: string;
  };
  personnelStandard: { ar: string; en: string };
}

const STANDARDS_DATA: StandardSector[] = [
  {
    id: 'power',
    name: {
      ar: 'محطات توليد الطاقة الكهربائية (CCPP & Supercritical)',
      en: 'Power Generation (CCPP & Supercritical Boilers)'
    },
    icon: 'Zap',
    description: {
      ar: 'أنابيب البخار الحرج عالي الضغط، ومراجل التوليد، وتوربينات الغاز والسبائك المقاومة للحرارة (P91, P22).',
      en: 'High-pressure supercritical steam lines, boilers, HRSG modules, and creep-resistant alloys (P91, P22, P11).'
    },
    primaryCodes: ['ASME Section I', 'ASME B31.1', 'ASME Section IX', 'AWS D10.10'],
    ndtHoldPoints: [
      {
        method: 'RT / PAUT',
        applicableCode: 'ASME Sec. I PW-51 / B31.1 Para 136.4.5',
        stage: { ar: '100% فحص حجمي لوصلات خطوط البخار الرئيسي (Main Steam)', en: '100% Volumetric on Main Steam & Hot Reheat Welds' },
        acceptanceCriteria: { ar: 'انعدام تام للشروخ ونقص الانصهار، وتجاويف دائرية مقيدة بالجدول PW-51', en: 'Zero cracks, zero lack of fusion, porosity limits per Table PW-51' }
      },
      {
        method: 'MT / PT',
        applicableCode: 'ASME Sec. V Art. 7 / Art. 6',
        stage: { ar: 'فحص جذور اللحام والوجه الخارجي لوصلات الفوهات والدعامات', en: 'Root pass & final cap inspection of nozzle and attachment welds' },
        acceptanceCriteria: { ar: 'عدم قبول أي مؤشرات خطية تزيد عن 1.5 مم طبقاً للفقرة 136.4.3', en: 'No linear indications > 1.5 mm per B31.1 para 136.4.3' }
      },
      {
        method: 'PMI',
        applicableCode: 'ASME Sec. II Part C / API RP 578',
        stage: { ar: 'التحقق الكيميائي 100% لمطابقة سبائك P91 / P22 قبل وبعد التركيب', en: '100% Positive material identification for Cr-Mo-V alloy balance' },
        acceptanceCriteria: { ar: 'مطابقة نسب الكروم (8.0-9.5%) والموليبدينوم والفاناديوم', en: 'Nominal Cr (8.0-9.5%), Mo (0.85-1.05%), and V limits' }
      }
    ],
    pwhtRequirements: {
      material: 'P91 (Grade 91 / P-No 5B)',
      thicknessThreshold: 'All thicknesses mandatory',
      soakingTemp: '750 °C - 775 °C (Controlled Heating Rate ≤ 110 °C/hr)',
      codeRule: 'AWS D10.10 / ASME B31.1 Table 132 (6-Channel Auto PID Control)'
    },
    personnelStandard: {
      ar: 'مفتشو NDT ليفل II معتمدون طبقاً لـ SNT-TC-1A / ISO 9712، تحت إشراف NDT Level III ومراجع جودة رئيسي CQI-IRCA.',
      en: 'ASNT SNT-TC-1A / ISO 9712 Level II Inspectors supervised by in-house NDT Level III & CQI-IRCA Lead Auditor.'
    }
  },
  {
    id: 'oil-gas',
    name: {
      ar: 'خطوط أنابيب نقل البترول والغاز والمنصات',
      en: 'Cross-Country Pipelines & Transmission'
    },
    icon: 'Radio',
    description: {
      ar: 'شبكات خطوط الأنابيب البرية والبحرية، محطات تخفيض الضغط، والصمامات الرئيسية لنقل الخام والغاز.',
      en: 'Cross-country transmission pipelines, pig traps, block valve stations, and gathering flowlines.'
    },
    primaryCodes: ['API 1104 22nd Ed.', 'ASME B31.4', 'ASME B31.8', 'DNV-ST-F101'],
    ndtHoldPoints: [
      {
        method: 'RT / Gamma Ray',
        applicableCode: 'API 1104 Section 9 & 11',
        stage: { ar: 'تصوير إشعاعي 100% لوصلات خطوط الربط ومسارات العبور المائية والطرق', en: '100% Radiography on tie-ins, road crossings, and water crossings' },
        acceptanceCriteria: { ar: 'معايير القبول للعيوب الحجمية والشقوق طبقاً لـ API 1104 Para 9.3', en: 'Defect sizing & distribution limits per API 1104 Para 9.3' }
      },
      {
        method: 'AUT / Phased Array',
        applicableCode: 'API 1104 Annex A / Section 11.4',
        stage: { ar: 'فحص مصفوفات طورية رقمي سريع لخطوط الإنتاج والأقطار الكبيرة', en: 'Automated / Phased Array ultrasonic testing with zonal discrimination' },
        acceptanceCriteria: { ar: 'تقييم ميكانيكا الكسر الهندسي المرن (ECA / Fitness-for-Service)', en: 'Engineering Critical Assessment (ECA) flaw sizing limits' }
      },
      {
        method: 'Hydrostatic Testing',
        applicableCode: 'ASME B31.8 Chapter IV / API RP 1110',
        stage: { ar: 'اختبار الضغط الهيدروستاتيكي الميداني لمدة 24 ساعة مستمرة', en: '24-hour continuous strength & leak proof test with dual-pen chart' },
        acceptanceCriteria: { ar: 'ثبات منحنى الضغط المعاير مع تصحيح تغيرات درجات الحرارة', en: 'Zero pressure decay with temperature-compensated log analysis' }
      }
    ],
    pwhtRequirements: {
      material: 'Carbon Steel API 5L (X52, X65, X70)',
      thicknessThreshold: '> 32 mm or cold worked bend sections',
      soakingTemp: '590 °C - 620 °C',
      codeRule: 'ASME B31.4 / B31.8 post-weld stress relieving protocol'
    },
    personnelStandard: {
      ar: 'مشغلو تصوير إشعاعي معتمدون من هيئة الرقابة النووية والإشعاعية (ENRRA) ومفتشو ليفل II.',
      en: 'ENRRA Licensed Radiation Safety Officers & Certified RT/AUT Level II Operators.'
    }
  },
  {
    id: 'refinery',
    name: {
      ar: 'المصافي البترولية وأوعية الضغط والمفاعلات',
      en: 'Refineries, Petrochemicals & Pressure Vessels'
    },
    icon: 'Layers',
    description: {
      ar: 'أبراج التقطير، أوعية الضغط الثقيلة، المبادلات الحرارية، ووحدات التكسير الهيدروجيني (Hydrogen Service).',
      en: 'Pressure vessels, reactors, heat exchangers, distillation columns, and wet H2S process equipment.'
    },
    primaryCodes: ['ASME Section VIII Div. 1 & 2', 'ASME B31.3', 'API 510', 'NACE MR0175'],
    ndtHoldPoints: [
      {
        method: 'PAUT + TOFD',
        applicableCode: 'ASME Sec. VIII Code Case 2235-9',
        stage: { ar: 'استبدال كامل للأشعة في فحص اللحامات الطولية والمحيطية للأوعية', en: 'Full replacement of radiography on longitudinal & circumferential seams' },
        acceptanceCriteria: { ar: 'معايير ASME Section VIII Division 2 Table 7.8', en: 'Flaw height sizing and length limits per ASME Sec. VIII Div. 2' }
      },
      {
        method: 'Wet Fluorescent MT',
        applicableCode: 'ASME Sec. VIII App. 6 / NACE SP0296',
        stage: { ar: 'كشف شروخ التآكل الإجهادي الناجم عن كبريتيد الهيدروجين (HIC/SOHIC)', en: 'Detection of H2S environmental cracking on inside surfaces' },
        acceptanceCriteria: { ar: 'انعدام تام للمؤشرات الخطية ذات الصلة بالشروخ السطحية', en: 'Zero allowable relevant linear crack-like indications' }
      },
      {
        method: 'Hardness Testing',
        applicableCode: 'NACE MR0175 / ASTM E110',
        stage: { ar: 'قياس الصلادة الميداني بعد المعالجة الحرارية لمناطق اللحام و HAZ', en: 'Post-PWHT portable hardness surveys on weld cap & heat-affected zone' },
        acceptanceCriteria: { ar: 'أقصى صلادة مسموح بها 200 HBW (أو 22 HRC)', en: 'Maximum 200 HBW / 22 HRC to prevent sulfide stress cracking' }
      }
    ],
    pwhtRequirements: {
      material: 'Chrome-Moly (1.25Cr-0.5Mo / 2.25Cr-1Mo)',
      thicknessThreshold: '> 16 mm or sour service mandatory',
      soakingTemp: '675 °C - 705 °C',
      codeRule: 'ASME Sec. VIII UCS-56 / NACE SP0472 strict cooling control'
    },
    personnelStandard: {
      ar: 'مفتشو جودة معتمدون API 510/570 ومفتشو NDT ليفل II بالموجات والمصفوفات الطورية.',
      en: 'API 510/570 Authorized Inspectors alongside ASNT/ISO Level II Technicians.'
    }
  },
  {
    id: 'tanks',
    name: {
      ar: 'صهاريج التخزين البترولية الكبرى (Storage Tanks)',
      en: 'Atmospheric Storage Tanks & Terminals'
    },
    icon: 'Database',
    description: {
      ar: 'صهاريج تخزين الزيت الخام والمنتجات البترولية ذات السقف العائم والثابت وخطوط التعبئة البحرية.',
      en: 'Aboveground atmospheric storage tanks, floating roofs, annular plates, and bottom leak detection.'
    },
    primaryCodes: ['API 650 13th Ed.', 'API 653', 'ASME Sec. V', 'BS EN 14015'],
    ndtHoldPoints: [
      {
        method: 'Vacuum Box Testing',
        applicableCode: 'API 650 Section 8.6 / ASME Sec. V Art. 10',
        stage: { ar: 'فحص إحكام قاع الخزان بالكامل ووصلات الألواح المتراكبة (Lap Welds)', en: '100% Bottom plate lap weld bubble leak tightness test (-21 to -35 kPa)' },
        acceptanceCriteria: { ar: 'انعدام تام لتكون أي فقاعات تسريب خلال فترة المشاهدة', en: 'Zero bubble formation during minimum dwell period' }
      },
      {
        method: 'Magnetic Flux Leakage (MFL)',
        applicableCode: 'API 653 Annex G',
        stage: { ar: 'مسح مغناطيسي سريع عالي الدقة لكشف تآكل السطح السفلي لألواح القاع', en: 'High-speed bottom plate top & underside corrosion mapping scan' },
        acceptanceCriteria: { ar: 'تحديد دقيق لمواقع التآكل التي تقل فيها السماكة عن الحد الأدنى 2.5 مم', en: 'Pinpointing remaining wall thickness below t-min (0.100 in / 2.5 mm)' }
      },
      {
        method: 'Spot / Full Radiography',
        applicableCode: 'API 650 Section 8.1',
        stage: { ar: 'تصوير الوصلات الرأسية والأفقية لجدار الصهريج (Shell Joints)', en: 'Spot RT on vertical & horizontal shell seams based on thickness & welder' },
        acceptanceCriteria: { ar: 'مطابقة مواصفات ASME Section VIII UW-51 / UW-52', en: 'Acceptance per ASME UW-51 (100% RT) or UW-52 (Spot RT)' }
      }
    ],
    pwhtRequirements: {
      material: 'Heavy Shell Inserts & Flush Cleanout Doors',
      thicknessThreshold: 'Shell thickness > 38 mm or flush door assemblies',
      soakingTemp: '600 °C - 650 °C for 1 hr per 25 mm',
      codeRule: 'API 650 Para 5.7.4.2 shop / field pre-heating & stress relief'
    },
    personnelStandard: {
      ar: 'مفتشو خزانات API 653 معتمدون وفنيو فحص الفراغ والموجات ليفل II.',
      en: 'Certified API 653 Tank Inspectors & Level II Technicians with tank vault experience.'
    }
  }
];

interface CompanyStandardsMatrixProps {
  language: Language;
}

export const CompanyStandardsMatrix: React.FC<CompanyStandardsMatrixProps> = ({ language }) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeSectorId, setActiveSectorId] = useState<string>('power');
  const activeSector = STANDARDS_DATA.find(s => s.id === activeSectorId) || STANDARDS_DATA[0];

  return (
    <section id="standards-matrix" className="py-16 border-b border-slate-800 bg-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'مصفوفة الأكواد والمعايير الهندسية الدولية' : 'Engineering Codes & Standards Compliance Matrix'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr ? 'التوافق الصارم مع معايير ASME و API و AWS و ISO' : 'Rigorous Compliance with ASME, API, AWS & ISO Codes'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isAr
              ? 'تعتمد إنسكو في كافة عمليات الفحص والمعالجة الحرارية على إجراءات هندسية مكتوبة ومعتمدة (Level III Approved Procedures) تلتزم بأعلى المواصفات القياسية العالمية المعمول بها في مشاريع الطاقة والبترول الكبرى.'
              : 'INSCO executes every inspection and heat treatment scope strictly according to Level III approved written procedures, fully aligned with international codes governing mega power and oil & gas facilities.'}
          </p>
        </div>

        {/* Sector Navigation Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {STANDARDS_DATA.map((sector) => {
            const isSelected = sector.id === activeSectorId;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setActiveSectorId(sector.id)}
                className={`p-4 rounded-xl text-start transition cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sector.primaryCodes[0]}
                  </span>
                  {isSelected && <Sparkles className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {sector.name[language]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Sector Blueprint Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-8">
          {/* Top Info Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {activeSector.name[language]}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  {isAr ? 'إجراءات معتمدة Level III' : 'Level III Approved'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
                {activeSector.description[language]}
              </p>
            </div>

            {/* Standard Codes Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {activeSector.primaryCodes.map((code, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>

          {/* NDT Inspection Hold Points Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'نقاط التوقف للفحص غير الإتلافي ومعايير القبول (NDT Hold Points):' : 'Mandatory NDT Hold Points & Acceptance Codes:'}</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {isAr ? 'مطابقة متطلبات الطرف الثالث' : 'Third-Party Compliant'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeSector.ndtHoldPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/20">
                        {item.method}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.applicableCode}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 leading-snug">
                      {item.stage[language]}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="text-cyan-400 font-semibold">{isAr ? 'معيار القبول: ' : 'Criteria: '}</span>
                    {item.acceptanceCriteria[language]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Grid: PWHT Rules & Personnel Qualifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
            {/* PWHT Protocol */}
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'اشتراطات المعالجة الحرارية بعد اللحام (PWHT Rule):' : 'PWHT Specification & Soaking Control:'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">{isAr ? 'السبيكة / المادة:' : 'Base Material:'}</div>
                  <div className="text-slate-200 font-bold font-mono mt-0.5">{activeSector.pwhtRequirements.material}</div>
                </div>
                <div>
                  <div className="text-slate-500">{isAr ? 'حد السماكة الإلزامي:' : 'Thickness Threshold:'}</div>
                  <div className="text-slate-200 font-mono mt-0.5">{activeSector.pwhtRequirements.thicknessThreshold}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500">{isAr ? 'درجة حرارة التثبيت (Soaking Temp):' : 'Soaking Temperature:'}</div>
                  <div className="text-amber-300 font-bold font-mono mt-0.5">{activeSector.pwhtRequirements.soakingTemp}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500">{isAr ? 'المرجع الكودي:' : 'Governing Rule:'}</div>
                  <div className="text-slate-300 font-mono text-[11px] mt-0.5">{activeSector.pwhtRequirements.codeRule}</div>
                </div>
              </div>
            </div>

            {/* Personnel & Audit Rigor */}
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'مستويات تأهيل المفتشين والاعتمادات:' : 'Inspector Qualification & QA Protocol:'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeSector.personnelStandard[language]}
              </p>
              <div className="pt-2 text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span>{isAr ? 'رقم اعتماد المنظمة المصرية للتوحيد القياسي:' : 'EGAC Registration Number:'}</span>
                <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  CAB #120007
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
