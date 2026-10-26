import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../types';
import { 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  Quote, 
  CheckCircle2, 
  Award, 
  Play, 
  Pause,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface TestimonialItem {
  id: string;
  client: string;
  author: {
    name: { ar: string; en: string };
    role: { ar: string; en: string };
    company: string;
  };
  project: { ar: string; en: string };
  feedback: { ar: string; en: string };
  metrics: {
    label: { ar: string; en: string };
    value: string;
  }[];
  annexRef?: string;
  standards: string;
}

const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: 'siemens-burullus',
    client: 'SIEMENS Energy / PGESCO',
    author: {
      name: { ar: 'م. ماركوس كيلر', en: 'Eng. Markus Keller' },
      role: { ar: 'مدير توكيد الجودة المقيم - محطات الطاقة', en: 'Resident QA/QC Manager - Power Projects' },
      company: 'Siemens / PGESCO Consortium'
    },
    project: {
      ar: 'محطة كهرباء البرلس المركبة العملاقة (4,800 MW)',
      en: 'Burullus 4,800 MW Combined Cycle Power Plant'
    },
    feedback: {
      ar: 'قامت إنسكو بحشد 16 وحدة معالجة حرارية في أقل من 48 ساعة للتعامل مع مسارات البخار الحرجة لسبائك P91 وP22. تم إنجاز أكثر من 1,200 وصلة لحام دون تسجيل أي عيب أو إعادة تشغيل، مما ساهم في تشغيل التوربينات طبقاً للجدول الزمني.',
      en: 'INSCO mobilized 16 automatic PWHT units in under 48 hours for high-pressure P91/P22 steam piping. Over 1,200 heavy-wall weld joints were treated and inspected with zero defect rework, meeting our critical commissioning milestone.'
    },
    metrics: [
      { label: { ar: 'وصلات سبائك P91', en: 'P91 Alloy Welds' }, value: '1,200+' },
      { label: { ar: 'معدل إعادة التشغيل', en: 'Rework Rate' }, value: '0%' },
      { label: { ar: 'سرعة الاستجابة والانتشار', en: 'Site Mobilization' }, value: '48h' },
    ],
    annexRef: 'Annex E-06',
    standards: 'ASME B31.1 & AWS D10.10'
  },
  {
    id: 'orascom-construction',
    client: 'ORASCOM Construction',
    author: {
      name: { ar: 'م. طارق المنصوري', en: 'Eng. Tarek El-Mansoury' },
      role: { ar: 'مدير قطاع الجودة والمشروعات الصناعية', en: 'Industrial Quality Director' },
      company: 'ORASCOM Construction Industries'
    },
    project: {
      ar: 'مشروعات محطات كهرباء طلخا والكريمات والمستودعات البترولية',
      en: 'Talkha & El-Kureimat Power Plants & Storage Terminals'
    },
    feedback: {
      ar: 'وجود مدقق رئيسي معتمد دولياً CQI-IRCA ومستوى ثالث ASNT Level III دائم داخل إنسكو وفر علينا أسابيع من مراجعات إجراءات الفحص NDT. التقارير الرقمية والتراخيص الإشعاعية لـ ENRRA كانت مستوفاة وجاهزة للاعتماد الفوري من المالك.',
      en: "Having an in-house CQI-IRCA Lead Auditor and ASNT Level III specialist at INSCO streamlined all procedure approvals. Their digital inspection logs and ENRRA radiation permits were flawlessly pre-cleared by third-party auditors."
    },
    metrics: [
      { label: { ar: 'قبول تقارير التفتيش', en: 'First-Pass Approval' }, value: '100%' },
      { label: { ar: 'تغطية المشروعات', en: 'Major Plants' }, value: '5 Sites' },
      { label: { ar: 'ساعات العمل الآمن', en: 'Safe Work Hours' }, value: '180,000+' },
    ],
    annexRef: 'Annex E-06 / D-02',
    standards: 'ASME Sec. IX & EN ISO 9712'
  },
  {
    id: 'petromasila-yemen',
    client: 'PETROMASILA Exploration & Production',
    author: {
      name: { ar: 'م. سالم باعباد', en: 'Eng. Salem Ba-Abbad' },
      role: { ar: 'رئيس قسم سلامة الأصول وخطوط الأنابيب', en: 'Head of Asset Integrity & Pipelines' },
      company: 'PetroMasila (Block 14 Masila Basin)'
    },
    project: {
      ar: 'المسح الحجمي بالموجات فوق الصوتية لخط التصدير الرئيسي باليمن',
      en: 'Crude Export Mainline Ultrasonic & Thickness Survey (Yemen)'
    },
    feedback: {
      ar: 'تمكن فريق إنسكو من نقل معدات الفحص المتقدمة وكوادر التفتيش عبر الحدود والعمل في بيئة صحراوية نائية بكفاءة هندسية عالية. تم فحص خط الأنابيب واكتشاف مناطق التآكل الموضعي بدقة دون تعطيل تدفق الخام.',
      en: 'INSCO deployed specialized ultrasonic and wall-loss survey crews across borders into remote desert installations. The inspection identified localized corrosion pockets accurately without interrupting crude oil production.'
    },
    metrics: [
      { label: { ar: 'طول الخط المفحوص', en: 'Pipeline Surveyed' }, value: '85 km' },
      { label: { ar: 'حوادث السلامة المهنية', en: 'Lost Time Injuries' }, value: '0 LTI' },
      { label: { ar: 'دقة قياس السمك المتبقي', en: 'Survey Tolerance' }, value: '±0.1 mm' },
    ],
    annexRef: 'Annex E-12',
    standards: 'API 570 & ASME Sec. V'
  },
  {
    id: 'elsewedy-electric',
    client: 'El Sewedy Electric',
    author: {
      name: { ar: 'م. مدحت فاروق', en: 'Eng. Medhat Farouk' },
      role: { ar: 'مدير عام الجودة بمصانع المحولات', en: 'General Manager of Quality, Transformer Division' },
      company: 'El Sewedy Electric - Transformers Works'
    },
    project: {
      ar: 'فحوصات خزانات محولات القوى الكهربائية 220kV و 500kV',
      en: '220kV & 500kV Extra-High Voltage Transformer Vessel Testing'
    },
    feedback: {
      ar: 'اعتمدنا إنسكو بموجب أمر التوريد GM102473 لتنفيذ حزمة الفحوصات الشاملة VT, UT, MT, PT, RT واختبارات الصلادة. الالتزام بمنحنيات التسخين والتبريد والتحكم الإلكتروني لـ 16 وحدة PWHT ضمن أعلى معايير الجودة المعتمدة.',
      en: 'Under purchase order GM102473, INSCO performed comprehensive NDT (VT/UT/MT/PT/RT) and hardness testing. Their 6-channel computerized PWHT thermal controllers delivered uniform soaking across complex transformer vessel geometries.'
    },
    metrics: [
      { label: { ar: 'أمر التوريد المعتمد', en: 'Verified PO' }, value: 'GM102473' },
      { label: { ar: 'درجة حرارة النقع', en: 'Uniform Soak' }, value: '750°C' },
      { label: { ar: 'طرق الفحص المنفذة', en: 'NDT Methods' }, value: '6 Families' },
    ],
    annexRef: 'Annex E-01',
    standards: 'AWS D1.1 & IEC 60076'
  },
  {
    id: 'serka-group-bagram',
    client: 'Serka Insaat ve Ticaret A.S. (Turkey)',
    author: {
      name: { ar: 'م. بوراك يلماز', en: 'Eng. Burak Yilmaz' },
      role: { ar: 'كبير مهندسي المشروع', en: 'Lead Project Engineer' },
      company: 'Serka Contracting / US Army Project'
    },
    project: {
      ar: 'منشآت وشبكات الوقود والهياكل الفولاذية بمشروع قاعدة باجرام',
      en: 'Aviation Fuel Infrastructure & Heavy Steelworks (Bagram)'
    },
    feedback: {
      ar: 'أصدرت الإدارة التركية خطاب شكر وتقدير رسمي (الملحق B-01) لإدارة ومهندسي إنسكو على الالتزام الصارم بمعايير سلاح المهندسين الأمريكي USACE وسرعة إتمام الفحوصات الإشعاعية بجاما دون أي تأخير.',
      en: 'Our executive board issued an official Letter of Appreciation (Annex B-01) to INSCO for rigorous adherence to US Army Corps of Engineers standards and rapid radiographic clearance without handover delays.'
    },
    metrics: [
      { label: { ar: 'خطاب التقدير الرسمي', en: 'Commendation Letter' }, value: 'Annex B-01' },
      { label: { ar: 'نسبة القبول الإشعاعي', en: 'Radiographic Pass' }, value: '100%' },
      { label: { ar: 'الامتثال للمعايير', en: 'USACE Compliance' }, value: 'Zero NCR' },
    ],
    annexRef: 'Annex B-01 (Page 19)',
    standards: 'ASME Sec. IX & AWS D1.1'
  }
];

interface CompanyTestimonialsSectionProps {
  language: Language;
}

export const CompanyTestimonialsSection: React.FC<CompanyTestimonialsSectionProps> = ({ language }) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);

  const total = TESTIMONIALS_DATA.length;
  const currentItem = TESTIMONIALS_DATA[currentIndex];

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleSelect = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlay, total]);

  // Framer motion sliding variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <section id="testimonials" className="py-16 border-b border-slate-800 bg-slate-900/40 relative overflow-hidden">
      {/* Background subtle light */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'شهادات العملاء وسجلات النجاح الميداني' : 'Attributable Client Testimonials & Outcomes'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr
                ? 'ثقة معتمدة من كبرى شركات الطاقة والمقاولات العالمية'
                : 'Verified Partner Feedback on Landmark Infrastructure'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'شهادات موثقة وخطابات تقدير رسمية صادرة من كبرى الكيانات الهندسية المشرفة على محطات الطاقة، مصافي البترول، وخطوط الأنابيب.'
                : 'Attributable testimonies and formal letters of commendation issued by resident engineering directors across mega-watt power stations and refineries.'}
            </p>
          </div>

          {/* Action Navigation Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Auto-play toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title={isAutoPlay ? (isAr ? 'إيقاف التبديل التلقائي' : 'Pause Auto-slide') : (isAr ? 'تشغيل التبديل التلقائي' : 'Resume Auto-slide')}
              aria-label={isAutoPlay ? 'Pause' : 'Play'}
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                aria-label="Previous Testimonial"
              >
                {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <span className="px-2 text-xs font-mono text-cyan-400 tabular-nums">
                0{currentIndex + 1} / 0{total}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                aria-label="Next Testimonial"
              >
                {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Client Tabs Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {TESTIMONIALS_DATA.map((item, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30 border border-cyan-500'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{item.client}</span>
              </button>
            );
          })}
        </div>

        {/* Main Sliding Card with Framer Motion */}
        <div 
          className="relative min-h-[380px]"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentItem.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-2xl space-y-8"
            >
              {/* Card Top: Client & Project Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-cyan-400 font-mono">
                      {currentItem.client}
                    </span>
                    {currentItem.annexRef && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-xs font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                          {currentItem.annexRef}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-200">
                    {currentItem.project[language]}
                  </h3>
                </div>

                <div className="text-start sm:text-end font-mono text-xs text-slate-400 shrink-0">
                  <div className="text-slate-500">{isAr ? 'الأكواد المطبقة:' : 'Governing Codes:'}</div>
                  <div className="text-cyan-300 font-medium">{currentItem.standards}</div>
                </div>
              </div>

              {/* Middle: Feedback Quote */}
              <div className="relative pl-0 sm:pl-2">
                <Quote className="w-8 h-8 text-cyan-500/20 mb-3" />
                <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed italic">
                  "{currentItem.feedback[language]}"
                </p>
              </div>

              {/* Bottom Split: Attributable Author & Quantified Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 border-t border-slate-800/80 items-center">
                {/* Author Info */}
                <div className="lg:col-span-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-base shrink-0">
                    {currentItem.author.name.en.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {currentItem.author.name[language]}
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentItem.author.role[language]}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                      {currentItem.author.company}
                    </div>
                  </div>
                </div>

                {/* Quantified Metrics Grid */}
                <div className="lg:col-span-7 grid grid-cols-3 gap-3">
                  {currentItem.metrics.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center"
                    >
                      <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono tabular-nums">
                        {m.value}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 font-medium truncate">
                        {m.label[language]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Indicator Progress Bar */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr
                ? 'شهادات معتمدة بأوامر توريد ومستندات رسمية مرفقة بالملف PDF'
                : 'All testimonies are cross-referenced with purchase orders in Annex E of the PDF brochure.'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {TESTIMONIALS_DATA.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleSelect(dotIdx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  dotIdx === currentIndex ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
                }`}
                aria-label={`Go to testimonial ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
