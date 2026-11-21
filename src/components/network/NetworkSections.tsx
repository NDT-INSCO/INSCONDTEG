import React from 'react';
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CircleDashed,
  Filter,
  GraduationCap,
  Info,
  Lock,
  MessageSquare,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  NETWORK_SECTION_COPY,
  networkSectionLabel,
  type NetworkSectionId,
} from '../../utils/portalRoutes';
import { NETWORK_ICON } from './NetworkShell';
import {
  NETWORK_ARTICLE_TEMPLATES,
  NETWORK_DISCIPLINES,
  NETWORK_EVENT_TEMPLATES,
  NETWORK_GROUPS,
  NETWORK_JOB_TEMPLATES,
  NETWORK_ORG_TEMPLATES,
  NETWORK_POST_TEMPLATES,
  NETWORK_POST_TYPES,
  NETWORK_VERIFICATION_LEVELS,
  disciplineLabel,
  type NetworkPostTemplate,
} from './networkContent';

/* ------------------------------- primitives -------------------------------- */

const Panel: React.FC<{ children: React.ReactNode; className?: string; label?: string }> = ({
  children,
  className = '',
  label,
}) => (
  <section
    aria-label={label}
    className={`min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3 ${className}`}
  >
    {children}
  </section>
);

/** Every template card carries this badge — a card cannot look like real data. */
const SampleBadge: React.FC<{ language: Language }> = ({ language }) => (
  <span
    data-testid="network-sample-badge"
    className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-violet-200"
  >
    {language === 'ar' ? 'نموذج توضيحي' : 'Sample'}
  </span>
);

/**
 * A write action that will exist once accounts do.
 *
 * Rendered as a genuinely disabled control (not a look-alike) so keyboard users
 * are not sent into a dead end, with the reason next to it in plain language.
 */
const DisabledAction: React.FC<{
  language: Language;
  labelAr: string;
  labelEn: string;
  icon?: React.ReactNode;
}> = ({ language, labelAr, labelEn, icon }) => {
  const isAr = language === 'ar';
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="network-write-disabled"
        title={isAr ? 'معطّل: يفعّل بعد ربط الخادم ونظام الحسابات' : 'Disabled: enabled once the backend and accounts exist'}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[11px] font-bold text-slate-500 opacity-70 cursor-not-allowed"
      >
        {icon ?? <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {isAr ? labelAr : labelEn}
      </button>
    </span>
  );
};

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="shrink-0 rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[10px] text-slate-300">
    {children}
  </span>
);

const SectionIntro: React.FC<{
  language: Language;
  id: NetworkSectionId;
  extra?: React.ReactNode;
}> = ({ language, id, extra }) => {
  const isAr = language === 'ar';
  const Icon = NETWORK_ICON[id];
  return (
    <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          <h2 className="truncate text-base font-bold text-white sm:text-lg">
            {networkSectionLabel(id, isAr ? 'ar' : 'en')}
          </h2>
        </div>
        <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-slate-400 sm:text-xs">
          {NETWORK_SECTION_COPY[id][isAr ? 'ar' : 'en']}
        </p>
      </div>
      {extra ? <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div> : null}
    </div>
  );
};

/* ---------------------------------- feed ----------------------------------- */

const PostTemplateCard: React.FC<{ post: NetworkPostTemplate; language: Language }> = ({ post, language }) => {
  const isAr = language === 'ar';
  const type = NETWORK_POST_TYPES.find(t => t.id === post.type);
  return (
    <article className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2a4d] bg-[#14142a] text-[10px] font-bold text-slate-500">
          ?
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="min-w-0 truncate text-xs font-bold text-slate-300">
              {isAr ? 'مكان اسم العضو ومسمّاه' : 'Member name and headline go here'}
            </span>
            <SampleBadge language={language} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {type ? <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${type.accent}`}>{type[isAr ? 'ar' : 'en']}</span> : null}
            <Chip>{disciplineLabel(post.discipline, isAr ? 'ar' : 'en')}</Chip>
          </div>
        </div>
      </div>

      <h3 className="mt-2 text-sm font-bold leading-snug text-white">{post[isAr ? 'titleAr' : 'titleEn']}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{post[isAr ? 'bodyAr' : 'bodyEn']}</p>
      <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[10px] text-slate-500">
        <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate">{post[isAr ? 'mediaAr' : 'mediaEn']}</span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[#1d1d38] pt-2">
        <DisabledAction language={language} labelAr="إعجاب" labelEn="Like" icon={<Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
        <DisabledAction language={language} labelAr="تعليق" labelEn="Comment" icon={<MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
        <DisabledAction language={language} labelAr="مشاركة" labelEn="Share" />
      </div>
    </article>
  );
};

export const NetworkFeed: React.FC<{ language: Language; onOpenSection: (s: NetworkSectionId) => void }> = ({
  language,
  onOpenSection,
}) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-feed">
      <SectionIntro language={language} id="feed" />
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,220px)]">
        {/* left rail */}
        <div className="min-w-0 space-y-3">
          <Panel label={isAr ? 'بطاقتك المهنية' : 'Your professional card'}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2a2a4d] bg-[#14142a] text-xs font-bold text-slate-500">
                ?
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-200">{isAr ? 'ملفك المهني' : 'Your profile'}</p>
                <p className="truncate text-[10px] text-slate-500">{isAr ? 'لم يُنشأ حساب بعد' : 'No account yet'}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-center">
              <div className="rounded border border-[#232345] px-1 py-1">
                <p className="text-[10px] text-slate-500">{isAr ? 'اتصالات' : 'Connections'}</p>
                <p className="text-xs font-bold text-slate-400">—</p>
              </div>
              <div className="rounded border border-[#232345] px-1 py-1">
                <p className="text-[10px] text-slate-500">{isAr ? 'متابِعون' : 'Followers'}</p>
                <p className="text-xs font-bold text-slate-400">—</p>
              </div>
            </div>
          </Panel>

          <Panel label={isAr ? 'اختصارات' : 'Shortcuts'}>
            <div className="grid grid-cols-2 gap-1.5">
              {(['groups', 'jobs', 'articles', 'events', 'people', 'verify'] as NetworkSectionId[]).map(id => {
                const Icon = NETWORK_ICON[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onOpenSection(id)}
                    className="flex min-w-0 items-center gap-1.5 rounded-md border border-[#232345] bg-[#101028] px-1.5 py-1.5 text-start text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
                    <span className="min-w-0 truncate">{networkSectionLabel(id, isAr ? 'ar' : 'en')}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* centre column */}
        <div className="min-w-0 space-y-3">
          <Panel label={isAr ? 'محرر المنشور' : 'Post composer'}>
            <div className="flex min-w-0 items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2a4d] bg-[#14142a] text-[10px] text-slate-500">
                ?
              </div>
              <div className="min-w-0 flex-1">
                <textarea
                  disabled
                  rows={2}
                  aria-label={isAr ? 'محرر المنشور (معطّل)' : 'Post composer (disabled)'}
                  placeholder={isAr ? 'شارك سؤالاً فنياً أو دراسة حالة… (يتفعّل بعد إنشاء الحسابات)' : 'Share a technical question or case study… (enabled once accounts exist)'}
                  data-testid="network-composer-disabled"
                  className="w-full resize-none rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-400 placeholder:text-slate-600 cursor-not-allowed"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <DisabledAction language={language} labelAr="نشر" labelEn="Publish" />
                  <DisabledAction language={language} labelAr="إرفاق" labelEn="Attach" />
                  <span className="text-[10px] text-slate-500">
                    {isAr ? 'أنواع المنشورات: نقاش فني · دراسة حالة · أخبار · وظائف…' : 'Post types: technical · case study · news · jobs…'}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {NETWORK_POST_TEMPLATES.map(post => (
            <PostTemplateCard key={post.id} post={post} language={language} />
          ))}
        </div>

        {/* right rail */}
        <div className="min-w-0 space-y-3">
          <Panel label={isAr ? 'فرص مقترحة' : 'Suggested jobs'}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
              <span className="min-w-0 truncate">{isAr ? 'أحدث الفرص' : 'Latest jobs'}</span>
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {NETWORK_JOB_TEMPLATES.slice(0, 2).map(job => (
                <li key={job.id} className="min-w-0 rounded-md border border-[#232345] px-2 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="min-w-0 truncate text-[10px] font-bold text-slate-300">{job[isAr ? 'ar' : 'en']}</span>
                    <SampleBadge language={language} />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{job[isAr ? 'requirementAr' : 'requirementEn']}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onOpenSection('jobs')}
              className="mt-1.5 w-full rounded-md border border-[#2a2a4d] px-2 py-1 text-[10px] font-bold text-violet-300 transition cursor-pointer hover:border-violet-400"
            >
              {isAr ? 'كل الفرص' : 'All jobs'}
            </button>
          </Panel>

          <Panel label={isAr ? 'فعاليات' : 'Events'}>
            <ul className="space-y-1.5">
              {NETWORK_EVENT_TEMPLATES.slice(0, 2).map(event => (
                <li key={event.id} className="flex min-w-0 items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
                  <span className="min-w-0 truncate text-[10px] text-slate-300">{event[isAr ? 'ar' : 'en']}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel label={isAr ? 'أكاديمية' : 'Academy'}>
            <p className="text-[10px] leading-relaxed text-slate-400">
              {isAr
                ? 'نتائج التقييمات لا تُنشر تلقائياً على الشبكة، ولا تُعرض شارات قبل التحقق.'
                : 'Assessment results are never posted to the network automatically, and no badge is shown before it is verified.'}
            </p>
            <div className="mt-1.5">
              <button
                type="button"
                onClick={() => onOpenSection('verify')}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 transition cursor-pointer hover:border-emerald-400"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {isAr ? 'التحقق المهني' : 'Verification'}
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------- profile --------------------------------- */

export const NetworkProfile: React.FC<{ language: Language; onOpenSection: (s: NetworkSectionId) => void }> = ({
  language,
  onOpenSection,
}) => {
  const isAr = language === 'ar';
  const rows = [
    { ar: 'المسمّى المهني', en: 'Professional headline' },
    { ar: 'التخصص', en: 'Discipline' },
    { ar: 'مستويات NDT (ASNT / ISO 9712)', en: 'NDT levels (ASNT / ISO 9712)' },
    { ar: 'سنوات الخبرة والقطاعات', en: 'Years of experience and sectors' },
    { ar: 'الموقع', en: 'Location' },
    { ar: 'اللغات', en: 'Languages' },
  ];
  return (
    <div data-testid="network-section-profile">
      <SectionIntro
        language={language}
        id="profile"
        extra={<DisabledAction language={language} labelAr="تحرير الملف" labelEn="Edit profile" />}
      />
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <Panel label={isAr ? 'بيانات الملف' : 'Profile fields'}>
          <ul className="divide-y divide-[#1d1d38]">
            {rows.map(row => (
              <li key={row.en} className="flex min-w-0 items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate text-[11px] text-slate-400">{isAr ? row.ar : row.en}</span>
                <span className="shrink-0 rounded border border-dashed border-[#2a2a4d] px-2 py-0.5 text-[10px] text-slate-600">
                  {isAr ? 'يُملأ بعد التسجيل' : 'Filled after sign-up'}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-3">
          <Panel label={isAr ? 'الشهادات وحالة التحقق' : 'Certificates and their state'}>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-amber-200">
              {isAr
                ? 'لا تُعرض أي شهادة كـ«مُتحقَّقة» قبل مراجعتها من جهة الإصدار. الحالة الافتراضية دائماً «قيد التحقق».'
                : 'No certificate is shown as verified before the issuing body is checked. The default state is always pending.'}
            </div>
            <ul className="mt-2 space-y-1.5">
              {['ASNT NDT Level II', 'ISO 9712 Level II', 'AWS CWI'].map(cert => (
                <li key={cert} className="flex min-w-0 items-center justify-between gap-2 rounded border border-[#232345] px-2 py-1">
                  <span className="min-w-0 truncate text-[11px] text-slate-300">{cert}</span>
                  <Chip>{isAr ? 'قيد التحقق' : 'Pending'}</Chip>
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <DisabledAction language={language} labelAr="طلب تحقق" labelEn="Request verification" icon={<BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
            </div>
          </Panel>

          <Panel label={isAr ? 'التعلّم' : 'Learning'}>
            <p className="text-[10px] leading-relaxed text-slate-400">
              {isAr
                ? 'تقدّمك في الأكاديمية يظهر لك وحدك؛ لا يُنشر أي نتيجة تقييم على الملف العام دون موافقتك.'
                : 'Your academy progress is visible to you alone; no assessment result reaches the public profile without your consent.'}
            </p>
            <button
              type="button"
              onClick={() => onOpenSection('verify')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-300 transition cursor-pointer hover:border-violet-400"
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'شارات التحقق' : 'Verification badges'}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------- groups ---------------------------------- */

export const NetworkGroups: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-groups">
      <SectionIntro language={language} id="groups" />
      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {NETWORK_GROUPS.map(group => (
          <Panel key={group.slug} label={group[isAr ? 'ar' : 'en']}>
            <div className="flex min-w-0 items-start justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                <h3 className="min-w-0 truncate text-xs font-bold text-white">{group[isAr ? 'ar' : 'en']}</h3>
              </div>
              <SampleBadge language={language} />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{disciplineLabel(group.discipline, isAr ? 'ar' : 'en')}</p>
            <p className="mt-1.5 rounded border border-[#232345] bg-[#0b0b18] px-1.5 py-1 text-[10px] leading-relaxed text-slate-400">
              {isAr ? `قواعد المجموعة: ${group.rulesAr}` : `Group rules: ${group.rulesEn}`}
            </p>
            <div className="mt-2 flex items-center justify-between gap-1.5">
              <span className="min-w-0 truncate text-[10px] text-slate-500">{group[isAr ? 'membersAr' : 'membersEn']}</span>
              <DisabledAction language={language} labelAr="انضمام" labelEn="Join" icon={<UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------- people ---------------------------------- */

export const NetworkPeople: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-people">
      <SectionIntro language={language} id="people" />
      <div className="mb-2.5 flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
          <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isAr ? 'الفلاتر:' : 'Filters:'}
        </span>
        {NETWORK_DISCIPLINES.slice(0, 5).map(d => (
          <Chip key={d.id}>{d[isAr ? 'ar' : 'en']}</Chip>
        ))}
        <Chip>{isAr ? '+ المزيد' : '+ more'}</Chip>
      </div>
      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {NETWORK_DISCIPLINES.slice(0, 6).map(item => (
          <Panel key={item.id} label={item[isAr ? 'ar' : 'en']}>
            <div className="flex min-w-0 items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2a4d] bg-[#14142a] text-[10px] text-slate-500">
                  ?
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-300">{isAr ? 'مكان العضو' : 'Member slot'}</p>
                  <p className="truncate text-[10px] text-slate-500">{item[isAr ? 'ar' : 'en']}</p>
                </div>
              </div>
              <SampleBadge language={language} />
            </div>
            <p className="mt-1.5 truncate text-[10px] text-slate-500">{item.codes}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DisabledAction language={language} labelAr="اتصال" labelEn="Connect" icon={<UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
              <DisabledAction language={language} labelAr="متابعة" labelEn="Follow" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------- jobs ----------------------------------- */

export const NetworkJobs: React.FC<{ language: Language; onOpenCompany: () => void }> = ({ language, onOpenCompany }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-jobs">
      <SectionIntro language={language} id="jobs" />
      <div className="mb-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-sky-200">
        {isAr
          ? 'الوظائف هنا للعرض المهني فقط. طلبات عروض الأسعار (RFQ) تبقى في بوابة العملاء ولا تُخلط مع رسائل الشبكة.'
          : 'Jobs here are professional listings only. Quote requests (RFQ) stay in the client portal and are never mixed with network messages.'}
      </div>
      <div className="grid min-w-0 gap-2.5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" label={isAr ? 'قوالب الفرص' : 'Job templates'}>
          <ul className="space-y-2">
            {NETWORK_JOB_TEMPLATES.map(job => (
              <li key={job.id} className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2.5">
                <div className="flex min-w-0 items-start justify-between gap-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Briefcase className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    <h3 className="min-w-0 truncate text-xs font-bold text-white">{job[isAr ? 'ar' : 'en']}</h3>
                  </div>
                  <SampleBadge language={language} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Chip>{disciplineLabel(job.discipline, isAr ? 'ar' : 'en')}</Chip>
                  <Chip>{job[isAr ? 'requirementAr' : 'requirementEn']}</Chip>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500">{job[isAr ? 'metaAr' : 'metaEn']}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <DisabledAction language={language} labelAr="تقديم" labelEn="Apply" />
                  <DisabledAction language={language} labelAr="حفظ" labelEn="Save" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="min-w-0 space-y-3">
          <Panel label={isAr ? 'فلاتر البحث' : 'Search filters'}>
            <div aria-hidden="true" className="space-y-1.5 opacity-60">
              <div className="rounded border border-dashed border-[#2a2a4d] px-2 py-1 text-[10px] text-slate-500">{isAr ? 'التخصص' : 'Discipline'}</div>
              <div className="rounded border border-dashed border-[#2a2a4d] px-2 py-1 text-[10px] text-slate-500">{isAr ? 'الدولة/المدينة' : 'Country/city'}</div>
              <div className="rounded border border-dashed border-[#2a2a4d] px-2 py-1 text-[10px] text-slate-500">{isAr ? 'نوع العمل: دوام كامل' : 'Employment: full-time'}</div>
              <div className="rounded border border-dashed border-[#2a2a4d] px-2 py-1 text-[10px] text-slate-500">{isAr ? 'المستوى المطلوب II' : 'Required level: II'}</div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              {isAr ? 'تفعّل الفلاتر مع أول بيانات حقيقية — لا تُعرض نتائج وهمية.' : 'Filters come alive with the first real data — no fabricated results.'}
            </p>
          </Panel>
          <Panel label={isAr ? 'للجهات' : 'For organisations'}>
            <p className="text-[10px] leading-relaxed text-slate-400">
              {isAr ? 'نشر الوظائف سيكون من صفحة المؤسسة بعد توثيقها.' : 'Jobs will be published from a verified organisation page.'}
            </p>
            <button
              type="button"
              onClick={onOpenCompany}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-300 transition cursor-pointer hover:border-cyan-400"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'صفحة إنسكو' : 'INSCO page'}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- articles --------------------------------- */

export const NetworkArticles: React.FC<{ language: Language; onOpenAcademy: () => void }> = ({ language, onOpenAcademy }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-articles">
      <SectionIntro
        language={language}
        id="articles"
        extra={<DisabledAction language={language} labelAr="كتابة مقال" labelEn="Write article" />}
      />
      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {NETWORK_ARTICLE_TEMPLATES.map(article => (
          <Panel key={article.id} label={article[isAr ? 'ar' : 'en']}>
            <div className="flex min-w-0 items-start justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <BookOpen className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                <h3 className="min-w-0 truncate text-xs font-bold text-white">{article[isAr ? 'ar' : 'en']}</h3>
              </div>
              <SampleBadge language={language} />
            </div>
            <div className="mt-1.5">
              <Chip>{disciplineLabel(article.discipline, isAr ? 'ar' : 'en')}</Chip>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{article[isAr ? 'noteAr' : 'noteEn']}</p>
            <button
              type="button"
              onClick={onOpenAcademy}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-400"
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'الدرس المرتبط' : 'Linked lesson'}
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------- events ---------------------------------- */

export const NetworkEvents: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-events">
      <SectionIntro language={language} id="events" />
      <ul className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {NETWORK_EVENT_TEMPLATES.map(event => (
          <li key={event.id}>
            <Panel label={event[isAr ? 'ar' : 'en']}>
              <div className="flex min-w-0 items-start justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                  <h3 className="min-w-0 truncate text-xs font-bold text-white">{event[isAr ? 'ar' : 'en']}</h3>
                </div>
                <SampleBadge language={language} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Chip>{event[isAr ? 'kindAr' : 'kindEn']}</Chip>
                <Chip>{isAr ? 'التاريخ بعد النشر' : 'Date after publishing'}</Chip>
              </div>
              <div className="mt-2">
                <DisabledAction language={language} labelAr="تسجيل الحضور" labelEn="Register" />
              </div>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------------- companies -------------------------------- */

export const NetworkCompanies: React.FC<{ language: Language; onOpenCompany: () => void }> = ({ language, onOpenCompany }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-companies">
      <SectionIntro language={language} id="companies" />
      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {NETWORK_ORG_TEMPLATES.map((org, index) => (
          <Panel key={org.id} label={org[isAr ? 'ar' : 'en']}>
            <div className="flex min-w-0 items-start justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <Building2 className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                <h3 className="min-w-0 truncate text-xs font-bold text-white">{org[isAr ? 'ar' : 'en']}</h3>
              </div>
              <SampleBadge language={language} />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">{org[isAr ? 'sectorAr' : 'sectorEn']}</p>
            {index === 0 ? (
              <button
                type="button"
                onClick={onOpenCompany}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-300 transition cursor-pointer hover:border-cyan-400"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {isAr ? 'فتح بوابة الشركة' : 'Open company portal'}
              </button>
            ) : (
              <div className="mt-2">
                <DisabledAction language={language} labelAr="متابعة المؤسسة" labelEn="Follow organisation" />
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------- messages --------------------------------- */

export const NetworkMessages: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-messages">
      <SectionIntro language={language} id="messages" />
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <Panel label={isAr ? 'المحادثات' : 'Threads'}>
          <ul className="space-y-1.5">
            {[1, 2, 3].map(n => (
              <li key={n} className="flex min-w-0 items-center gap-2 rounded-md border border-[#232345] px-2 py-1.5 opacity-70">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a4d] bg-[#14142a] text-[10px] text-slate-500">?</div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold text-slate-400">{isAr ? `محادثة ${n}` : `Thread ${n}`}</p>
                  <p className="truncate text-[10px] text-slate-600">{isAr ? 'لا رسائل بعد' : 'No messages yet'}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel label={isAr ? 'نافذة الرسالة' : 'Message pane'}>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[#2a2a4d] bg-[#0b0b18] text-[11px] text-slate-500">
            {isAr ? 'المراسلة تتفعّل بعد إنشاء الحسابات' : 'Messaging turns on once accounts exist'}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <input
              disabled
              aria-label={isAr ? 'كتابة رسالة (معطّل)' : 'Write a message (disabled)'}
              placeholder={isAr ? 'اكتب رسالة…' : 'Write a message…'}
              className="min-w-0 flex-1 rounded-md border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1 text-[11px] text-slate-400 placeholder:text-slate-600 cursor-not-allowed"
            />
            <DisabledAction language={language} labelAr="إرسال" labelEn="Send" />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            {isAr
              ? 'قناة منفصلة تماماً عن RFQ: عروض الأسعار تُطلب من بوابة العملاء وتُتابَع هناك، ولا تُرسل كرسالة اجتماعية.'
              : 'A channel entirely separate from RFQ: quotes are requested and tracked in the client portal, never as a social message.'}
          </p>
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------ notifications ------------------------------ */

export const NetworkNotifications: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  const prefs = [
    { ar: 'طلبات الاتصال', en: 'Connection requests' },
    { ar: 'التعليقات والتفاعلات', en: 'Comments and reactions' },
    { ar: 'المنشورات في مجموعاتي', en: 'Posts in my groups' },
    { ar: 'الوظائف المطابقة لتخصصي', en: 'Jobs matching my discipline' },
    { ar: 'رسائل مباشرة', en: 'Direct messages' },
    { ar: 'ملخص أسبوعي بالبريد', en: 'Weekly email digest' },
  ];
  return (
    <div data-testid="network-section-notifications">
      <SectionIntro language={language} id="notifications" />
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <Panel label={isAr ? 'ضبط الإشعارات' : 'Notification settings'}>
          <ul className="divide-y divide-[#1d1d38]">
            {prefs.map(pref => (
              <li key={pref.en} className="flex min-w-0 items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate text-[11px] text-slate-300">{pref[isAr ? 'ar' : 'en']}</span>
                <span
                  aria-hidden="true"
                  className="relative h-4 w-8 shrink-0 rounded-full border border-[#2a2a4d] bg-[#14142a] opacity-60"
                >
                  <span className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-slate-500 start-0.5" />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-slate-500">
            {isAr ? 'المفاتيح معطّلة حتى يوجد حساب فعلي.' : 'Switches stay disabled until a real account exists.'}
          </p>
        </Panel>
        <Panel label={isAr ? 'صندوق الإشعارات' : 'Notifications inbox'}>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[#2a2a4d] bg-[#0b0b18] text-[11px] text-slate-500">
            {isAr ? 'لا إشعارات — لا نشاط حقيقي بعد' : 'No notifications — no real activity yet'}
          </div>
        </Panel>
      </div>
    </div>
  );
};

/* --------------------------------- search ---------------------------------- */

export const NetworkSearch: React.FC<{ language: Language; onOpenSection: (s: NetworkSectionId) => void }> = ({
  language,
  onOpenSection,
}) => {
  const isAr = language === 'ar';
  const scopes: NetworkSectionId[] = ['people', 'groups', 'jobs', 'articles', 'events', 'companies'];
  return (
    <div data-testid="network-section-search">
      <SectionIntro language={language} id="search" />
      <Panel label={isAr ? 'البحث' : 'Search'}>
        <div className="flex min-w-0 items-center gap-1.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          <input
            disabled
            aria-label={isAr ? 'بحث (معطّل)' : 'Search (disabled)'}
            placeholder={isAr ? 'ابحث في الأعضاء والمجموعات والوظائف والمقالات…' : 'Search people, groups, jobs, articles…'}
            className="min-w-0 flex-1 rounded-md border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-400 placeholder:text-slate-600 cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          {isAr ? 'البحث يفتح على البيانات الحقيقية بعد إطلاق الشبكة.' : 'Search opens on real data once the network launches.'}
        </p>
      </Panel>
      <div className="mt-2.5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {scopes.map(scope => {
          const Icon = NETWORK_ICON[scope];
          return (
            <button
              key={scope}
              type="button"
              onClick={() => onOpenSection(scope)}
              className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[#232345] bg-[#101028] px-2 py-2 text-start text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
              <span className="min-w-0 truncate">{networkSectionLabel(scope, isAr ? 'ar' : 'en')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* --------------------------------- verify ---------------------------------- */

export const NetworkVerify: React.FC<{ language: Language; onOpenSection: (s: NetworkSectionId) => void }> = ({
  language,
  onOpenSection,
}) => {
  const isAr = language === 'ar';
  return (
    <div data-testid="network-section-verify">
      <SectionIntro language={language} id="verify" />
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <Panel label={isAr ? 'مستويات التحقق' : 'Verification levels'}>
          <ul className="space-y-2">
            {NETWORK_VERIFICATION_LEVELS.map(level => (
              <li key={level.id} className={`min-w-0 rounded-lg border px-2.5 py-2 ${level.accent}`}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <h3 className="min-w-0 truncate text-xs font-bold">{level[isAr ? 'ar' : 'en']}</h3>
                  {level.id === 'member' ? <Chip>{isAr ? 'الافتراضي' : 'Default'}</Chip> : null}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-300/80">{level[isAr ? 'meaningAr' : 'meaningEn']}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="min-w-0 space-y-3">
          <Panel label={isAr ? 'مساران منفصلان' : 'Two separate tracks'}>
            <ol className="list-inside list-decimal space-y-1.5 text-[10px] leading-relaxed text-slate-300">
              <li>
                <span className="font-bold text-cyan-300">{isAr ? 'التحقق من الهوية' : 'Identity verification'}</span>
                {' — '}
                {isAr ? 'أنت شخص حقيقي، عبر بريد الجهة أو مستند رسمي.' : 'you are a real person, via an employer email or an official document.'}
              </li>
              <li>
                <span className="font-bold text-emerald-300">{isAr ? 'التحقق من المؤهل' : 'Credential verification'}</span>
                {' — '}
                {isAr ? 'شهادة ASNT/ISO 9712 تُراجَع مع جهة الإصدار، وتُعرض الشارة بجانبها فقط.' : 'an ASNT/ISO 9712 certificate is checked with the issuer, and the badge sits beside that certificate only.'}
              </li>
            </ol>
            <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] leading-relaxed text-amber-200">
              {isAr
                ? 'مراجعة الشهادة لا تعني التحقق من الهوية، والعكس صحيح. لا تُمنح أي شارة تلقائياً.'
                : 'A checked certificate does not imply a verified identity, and vice versa. No badge is ever granted automatically.'}
            </p>
          </Panel>
          <Panel label={isAr ? 'الطلب' : 'Request'}>
            <div className="flex flex-col gap-1.5">
              <DisabledAction language={language} labelAr="طلب التحقق من الهوية" labelEn="Request identity check" icon={<BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
              <DisabledAction language={language} labelAr="إضافة شهادة للمراجعة" labelEn="Submit a certificate" icon={<BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />} />
              <p className="mt-1 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'طلبات التحقق تُراجَع يدوياً من إنسكو؛ لا نشر تلقائي لأي نتيجة تقييم.'
                    : 'Verification requests are reviewed manually by INSCO; no assessment result is ever auto-published.'}
                </span>
              </p>
            </div>
          </Panel>
          <button
            type="button"
            onClick={() => onOpenSection('profile')}
            className="w-full rounded-md border border-[#2a2a4d] px-2 py-1 text-[10px] font-bold text-violet-300 transition cursor-pointer hover:border-violet-400"
          >
            {isAr ? 'العودة إلى ملفي المهني' : 'Back to my profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
