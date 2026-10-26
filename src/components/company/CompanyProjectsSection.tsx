import React, { useState } from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { Building2, Globe2, Briefcase, CheckCircle2 } from 'lucide-react';

interface CompanyProjectsSectionProps {
  language: Language;
}

export const CompanyProjectsSection: React.FC<CompanyProjectsSectionProps> = ({
  language,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'clients' | 'facilities'>('clients');

  return (
    <section id="projects" className="py-16 border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
              {isAr ? 'سجل الإنجاز والشركاء الاستراتيجيين' : 'Strategic Partners & Track Record'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr
                ? 'سابقة أعمال مع كبرى الشركات العالمية والمحلية'
                : 'Proven Track Record with Global Energy & EPC Leaders'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'ثقة معتمدة من شركات الطاقة العالمية، مقاولي الهندسة والإنشاءات (EPC)، ومنشآت البترول والغاز في مصر والشرق الأوسط.'
                : 'Trusted by multinational power giants, major EPC contractors, and oil & gas facilities across Egypt and the Middle East.'}
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'العملاء والمشروعات' : 'Key Clients & Contracts'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facilities')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition cursor-pointer ${
                activeTab === 'facilities'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'المنشآت ومحطات الطاقة' : 'Major Facilities Served'}
            </button>
          </div>
        </div>

        {/* Tab 1: Clients Grid */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INSCO_COMPANY_DATA.clients.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {item.client}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.country}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {item.project[language]}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {isAr ? 'نطاق الأعمال المنفذة:' : 'Scope Executed:'}
                  </div>
                  <div>{item.activities[language]}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Facilities Grid */}
        {activeTab === 'facilities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INSCO_COMPANY_DATA.facilities.map((facility, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono font-semibold">
                      {facility.clientOrContractor}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {facility.name[language]}
                  </h3>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="text-slate-300">
                    {facility.scope[language]}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>{facility.location[language]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Multi-project Summary strip */}
        <div className="mt-12 rounded-lg border border-slate-800 bg-slate-900/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {isAr
                  ? 'سجل سابقة أعمال معتمد وجاهز للتقديم للجان المشتريات'
                  : 'Audited Vendor Track Record Ready for Procurement Committees'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'يتضمن خطابات إشادة معتمدة من سيمنز وأوراسكوم وبترومسيلة وأوامر توريد رسمية'
                  : 'Includes formal completion certificates and recommendation letters from Siemens, Orascom, Petromasila'}
              </div>
            </div>
          </div>

          <a
            href={INSCO_COMPANY_DATA.pdfBrochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition whitespace-nowrap"
          >
            {isAr ? 'مراجعة الملحق د (سابقة الأعمال بالـ PDF)' : 'Review Track Record in PDF (Annex D)'}
          </a>
        </div>
      </div>
    </section>
  );
};
