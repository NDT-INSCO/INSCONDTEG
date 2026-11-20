import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { BriefcaseBusiness, CheckCircle2, MapPin, PlusCircle, Wrench } from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityOpportunity,
  CommunityOpportunityType,
} from '../../client/types';
import {
  createCommunityOpportunity,
  updateCommunityOpportunityStatus,
} from '../../client/firestoreClientService';

interface InscoCommunityOpportunitiesBoardProps {
  language: Language;
  user: User | null;
  authorName: string;
  authorOrg: string;
  companyCode?: string;
  opportunities: CommunityOpportunity[];
  onRequireSignIn?: () => void;
}

const ALL_METHODS = ['RT', 'UT', 'PAUT', 'MT', 'PT', 'VT', 'PWHT', 'PMI'];

export const InscoCommunityOpportunitiesBoard: React.FC<
  InscoCommunityOpportunitiesBoardProps
> = ({
  language,
  user,
  authorName,
  authorOrg,
  companyCode,
  opportunities,
  onRequireSignIn,
}) => {
  const isAr = language === 'ar';
  const [filterType, setFilterType] = useState<'all' | CommunityOpportunityType>('all');
  const [composerOpen, setComposerOpen] = useState(false);

  const [opportunityType, setOpportunityType] = useState<CommunityOpportunityType>('job');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['RT', 'UT']);
  const [requirements, setRequirements] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleMethod = (m: string) => {
    setSelectedMethods(prev =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter(x => x !== m) : prev) : [...prev, m]
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    setErrorMsg(null);
    if (title.trim().length < 3 || requirements.trim().length < 5) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال عنوان واضح والمتطلبات الفنية.'
          : 'Please enter a clear title and technical requirements.'
      );
      return;
    }
    setSaving(true);
    try {
      await createCommunityOpportunity(user, {
        authorName,
        authorOrg,
        companyCode,
        opportunityType,
        title: title.trim(),
        location: location.trim() || 'Egypt / MENA',
        methods: selectedMethods,
        requirements: requirements.trim(),
      });
      setTitle('');
      setLocation('');
      setRequirements('');
      setComposerOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = opportunities.filter(o =>
    filterType === 'all' ? true : o.opportunityType === filterType
  );

  return (
    <div data-testid="community-opportunities-board" className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">
            {isAr
              ? 'بوابة الوظائف والمناقصات الهندسية (NDT & PWHT)'
              : 'NDT Jobs, Inspection Tenders & Equipment Board'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'فرص التوظيف للمفتشين المعتمدين، عقود المقاولات الصناعية، وتأجير المعدات.'
              : 'Certified inspector roles, industrial inspection tenders, and equipment mobilization.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) onRequireSignIn?.();
            else setComposerOpen(o => !o);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'نشر فرصة / مناقصة' : 'Post Job / Tender'}</span>
        </button>
      </div>

      {composerOpen && user && (
        <form
          onSubmit={e => void handlePublish(e)}
          className="rounded-xl border border-amber-500/40 bg-slate-900/80 p-4 space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'نوع الفرصة' : 'Opportunity Type'}</span>
              <select
                value={opportunityType}
                onChange={e => setOpportunityType(e.target.value as CommunityOpportunityType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="job">{isAr ? 'وظيفة مهندس / مفتش NDT' : 'NDT Job / Inspector Role'}</option>
                <option value="tender">{isAr ? 'مناقصة / تعاقد مشروع' : 'Inspection Tender / Subcontract'}</option>
                <option value="equipment">{isAr ? 'توفير / طلب معدات' : 'Equipment Mobilization'}</option>
              </select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-slate-400 block">{isAr ? 'العنوان *' : 'Title *'}</span>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isAr ? 'مثال: مطلوب مفتش PAUT Level II لمحطة كهرباء' : 'e.g. PAUT Level II Inspector for Combined-Cycle Plant'}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'الموقع / الدولة *' : 'Location *'}</span>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Suez / Jubail / Abu Dhabi"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </label>
            <div className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'طرق الفحص المطلوبة' : 'Required Methods'}</span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_METHODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMethod(m)}
                    className={`px-2 py-1 rounded border font-mono text-[11px] font-bold cursor-pointer ${
                      selectedMethods.includes(m)
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-700 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-slate-400 block">{isAr ? 'المتطلبات والاعتمادات *' : 'Requirements & Standards *'}</span>
            <textarea
              rows={3}
              required
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>

          {errorMsg && (
            <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 font-bold text-white cursor-pointer"
            >
              {saving ? (isAr ? 'جاري النشر...' : 'Publishing...') : isAr ? 'نشر الفرصة' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'all', ar: 'الكل', en: 'All' },
            { id: 'job', ar: 'وظائف', en: 'Jobs' },
            { id: 'tender', ar: 'مناقصات ومشاريع', en: 'Tenders' },
            { id: 'equipment', ar: 'معدات', en: 'Equipment' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
              filterType === tab.id
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
            }`}
          >
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center text-xs text-slate-400">
          {isAr
            ? 'لا توجد فرص أو مناقصات منشورة حالياً في هذا القسم.'
            : 'No published jobs, tenders, or equipment postings in this category yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(opp => (
            <div
              key={opp.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
                    {opp.opportunityType === 'equipment' ? (
                      <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <BriefcaseBusiness className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{opp.opportunityType.toUpperCase()}</span>
                    <span>·</span>
                    <span className={opp.status === 'open' ? 'text-emerald-400' : 'text-slate-500'}>
                      {opp.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5">{opp.title}</h4>
                  <div className="text-xs text-slate-400">
                    {opp.authorOrg} · {opp.authorName}
                  </div>
                </div>
                {user && user.uid === opp.authorUid && (
                  <button
                    type="button"
                    onClick={() =>
                      void updateCommunityOpportunityStatus(
                        opp.id,
                        opp.status === 'open' ? 'closed' : 'open'
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-400 cursor-pointer"
                  >
                    {opp.status === 'open'
                      ? isAr
                        ? 'إغلاق'
                        : 'Close'
                      : isAr
                        ? 'إعادة فتح'
                        : 'Reopen'}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
                {opp.requirements}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {opp.location}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-cyan-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  {opp.methods.join(' · ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
