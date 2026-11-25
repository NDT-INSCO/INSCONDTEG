import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CircleAlert,
  Loader2,
  Search,
  UserRound,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import type { NetworkSectionId } from '../../utils/portalRoutes';
import type {
  CommunityCompany,
  CommunityEvent,
  CommunityGroup,
  CommunityOpportunity,
  CommunityPost,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { NDT_METHOD_TAXONOMY } from '../../network/networkTaxonomy';

interface NetworkSearchSectionProps {
  language: Language;
  onOpenSection: (section: NetworkSectionId, entryId?: string) => void;
}

type SearchCategory = 'all' | 'people' | 'companies' | 'posts' | 'articles' | 'groups' | 'jobs' | 'events';

export const NetworkSearchSection: React.FC<NetworkSearchSectionProps> = ({
  language,
  onOpenSection,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();
  const serviceReady = account?.available ?? false;

  const [queryText, setQueryText] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [methodChip, setMethodChip] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const [people, setPeople] = useState<CommunityWorkspaceProfile[]>([]);
  const [companies, setCompanies] = useState<CommunityCompany[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [jobs, setJobs] = useState<CommunityOpportunity[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    const unsubs: Array<() => void> = [];

    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      unsubs.push(api.subscribeCommunityWorkspaces(false, list => active && setPeople(list), () => {}));
      unsubs.push(
        api.subscribeCommunityPosts(
          false,
          list => {
            if (!active) return;
            setPosts(list);
            setLoading(false);
          },
          () => active && setLoading(false)
        )
      );
      unsubs.push(api.subscribeCommunityOpportunities(list => active && setJobs(list), () => {}));
    });

    void import('../../client/communityGroupsService').then(api => {
      if (!active) return;
      unsubs.push(api.subscribeCommunityGroups(list => active && setGroups(list), () => {}));
    });

    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      unsubs.push(api.subscribeCommunityCompanies(list => active && setCompanies(list), () => {}));
      unsubs.push(api.subscribeCommunityEvents(list => active && setEvents(list), () => {}));
    });

    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [serviceReady]);

  const needle = queryText.trim().toLowerCase();
  const methodMatch = (hay: string) =>
    methodChip === 'ALL' || hay.toUpperCase().includes(methodChip);

  const filteredPeople = useMemo(
    () =>
      people.filter(p => {
        const hay = `${p.displayName} ${p.headline ?? ''} ${p.organizationName} ${p.specialtyTrades} ${p.city ?? ''}`;
        if (!methodMatch(hay)) return false;
        return !needle || hay.toLowerCase().includes(needle);
      }),
    [people, needle, methodChip]
  );

  const filteredCompanies = useMemo(
    () =>
      companies.filter(c => {
        const hay = `${c.name} ${c.nameAr ?? ''} ${c.industry} ${c.description} ${c.services.join(' ')}`;
        if (!methodMatch(hay)) return false;
        return !needle || hay.toLowerCase().includes(needle);
      }),
    [companies, needle, methodChip]
  );

  const filteredPosts = useMemo(
    () =>
      posts.filter(p => {
        if (methodChip !== 'ALL' && p.ndtMethod !== methodChip) return false;
        const hay = `${p.title} ${p.body} ${p.authorName} ${(p.tags ?? []).join(' ')}`;
        return !needle || hay.toLowerCase().includes(needle);
      }),
    [posts, needle, methodChip]
  );

  const filteredArticles = useMemo(
    () =>
      filteredPosts.filter(
        p => p.categoryTag === 'article' || p.categoryTag === 'case_study' || p.postFormat === 'article'
      ),
    [filteredPosts]
  );

  const filteredGroups = useMemo(
    () =>
      groups.filter(g => {
        const hay = `${g.name} ${g.description} ${g.ownerName}`;
        if (!methodMatch(hay)) return false;
        return !needle || hay.toLowerCase().includes(needle);
      }),
    [groups, needle, methodChip]
  );

  const filteredJobs = useMemo(
    () =>
      jobs.filter(j => {
        const hay = `${j.title} ${j.location} ${j.authorOrg} ${j.requirements} ${j.methods.join(' ')}`;
        if (!methodMatch(hay)) return false;
        return !needle || hay.toLowerCase().includes(needle);
      }),
    [jobs, needle, methodChip]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter(ev => {
        const hay = `${ev.title} ${ev.description} ${ev.organizerOrg} ${ev.venueOrLink}`;
        if (!methodMatch(hay)) return false;
        return !needle || hay.toLowerCase().includes(needle);
      }),
    [events, needle, methodChip]
  );

  const categories: Array<{ id: SearchCategory; ar: string; en: string; count: number }> = [
    { id: 'all', ar: 'الكل', en: 'All', count: filteredPeople.length + filteredCompanies.length + filteredPosts.length + filteredGroups.length + filteredJobs.length + filteredEvents.length },
    { id: 'people', ar: 'الخبراء', en: 'People', count: filteredPeople.length },
    { id: 'companies', ar: 'المؤسسات', en: 'Companies', count: filteredCompanies.length },
    { id: 'posts', ar: 'المنشورات', en: 'Posts', count: filteredPosts.length },
    { id: 'articles', ar: 'المقالات', en: 'Articles', count: filteredArticles.length },
    { id: 'groups', ar: 'المجموعات', en: 'Groups', count: filteredGroups.length },
    { id: 'jobs', ar: 'الفرص', en: 'Jobs', count: filteredJobs.length },
    { id: 'events', ar: 'الفعاليات', en: 'Events', count: filteredEvents.length },
  ];

  const show = (cat: SearchCategory) => category === 'all' || category === cat;

  return (
    <div data-testid="network-section-search" className="min-w-0 space-y-3">
      <div className={`${s.card} space-y-2.5 p-3`}>
        <h2 className={`flex items-center gap-2 text-base font-bold ${s.heading}`}>
          <Search className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'البحث الموحّد في مجتمع إنسكو' : 'Unified INSCO Network Search'}
        </h2>
        <input
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
          aria-label={isAr ? 'ابحث في جميع أقسام الشبكة' : 'Search across all network entities'}
          placeholder={
            isAr
              ? 'ابحث عن مهندس، شركة، طريقة فحص (PAUT, RT, UT)، وظيفة، أو فعالية…'
              : 'Search engineers, companies, NDT methods (PAUT, RT, UT), jobs, or events…'
          }
          className={s.input}
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                category === c.id ? s.navActive : s.navInactive
              }`}
            >
              {isAr ? c.ar : c.en} ({c.count})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setMethodChip('ALL')}
            className={`rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
              methodChip === 'ALL' ? s.navActive : s.chip
            }`}
          >
            {isAr ? 'كل الطرق' : 'All NDT'}
          </button>
          {NDT_METHOD_TAXONOMY.filter(m => m.id !== 'GENERAL').map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethodChip(m.id)}
              className={`rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
                methodChip === m.id ? s.navActive : s.chip
              }`}
            >
              {m.code}
            </button>
          ))}
        </div>
      </div>

      {!serviceReady ? (
        <div className={`${s.card} p-4 text-xs ${s.subtext}`}>
          <CircleAlert className="mb-1 inline h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />{' '}
          {isAr ? 'البحث المباشر يعمل عند تفعيل اتصال قاعدة البيانات.' : 'Live cross-entity search requires database setup.'}
        </div>
      ) : loading ? (
        <p className={`flex items-center gap-2 p-4 text-xs ${s.subtext}`}>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ فهرسة السجلات الحية…' : 'Indexing live community records…'}
        </p>
      ) : (
        <div className="space-y-3">
          {show('people') && filteredPeople.length > 0 ? (
            <ResultBlock
              icon={<UserRound className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'المهندسون والخبراء' : 'People & Experts'}
              surface={s}
            >
              {filteredPeople.slice(0, 8).map(p => (
                <button
                  key={p.uid}
                  type="button"
                  onClick={() => onOpenSection('people', p.uid)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{p.displayName}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{p.headline || p.organizationName} · {p.specialtyTrades}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}

          {show('companies') && filteredCompanies.length > 0 ? (
            <ResultBlock
              icon={<Building2 className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'المؤسسات والشركات' : 'Companies & Organisations'}
              surface={s}
            >
              {filteredCompanies.slice(0, 8).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onOpenSection('companies', c.id)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{isAr && c.nameAr ? c.nameAr : c.name}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{c.industry} · {c.headquarters ?? ''}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}

          {show('posts') && filteredPosts.length > 0 ? (
            <ResultBlock
              icon={<BookOpen className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'المنشورات والنقاشات' : 'Posts & Q&A'}
              surface={s}
            >
              {filteredPosts.slice(0, 8).map(post => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onOpenSection('feed', post.id)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{post.title}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{post.authorName} · {post.ndtMethod}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}

          {show('articles') && filteredArticles.length > 0 && category === 'articles' ? (
            <ResultBlock
              icon={<BookOpen className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'المقالات ودراسات الحالة' : 'Articles & Case Studies'}
              surface={s}
            >
              {filteredArticles.slice(0, 8).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onOpenSection('articles', a.id)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{a.title}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{a.authorName} · {a.ndtMethod}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}

          {show('groups') && filteredGroups.length > 0 ? (
            <ResultBlock
              icon={<Users className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'المجموعات الهندسية' : 'Engineering Groups'}
              surface={s}
            >
              {filteredGroups.slice(0, 8).map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onOpenSection('groups', g.id)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{g.name}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{g.description}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}

          {show('jobs') && filteredJobs.length > 0 ? (
            <ResultBlock
              icon={<Briefcase className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'الوظائف والفرص' : 'Jobs & Opportunities'}
              surface={s}
            >
              {filteredJobs.slice(0, 8).map(j => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => onOpenSection('jobs', j.id)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{j.title}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{j.authorOrg} · {j.location}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}

          {show('events') && filteredEvents.length > 0 ? (
            <ResultBlock
              icon={<CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />}
              title={isAr ? 'الفعاليات' : 'Events'}
              surface={s}
            >
              {filteredEvents.slice(0, 8).map(ev => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onOpenSection('events', ev.id)}
                  className={`${s.subCard} w-full p-2 text-start transition cursor-pointer hover:border-violet-400`}
                >
                  <p className={`text-xs font-bold ${s.heading}`}>{ev.title}</p>
                  <p className={`text-[10px] ${s.subtext}`}>{ev.organizerOrg} · {ev.dateIso}</p>
                </button>
              ))}
            </ResultBlock>
          ) : null}
        </div>
      )}
    </div>
  );
};

const ResultBlock: React.FC<{
  icon: React.ReactNode;
  title: string;
  surface: ReturnType<typeof networkSurface>;
  children: React.ReactNode;
}> = ({ icon, title, surface, children }) => (
  <div className={`${surface.card} space-y-2 p-3`}>
    <h3 className={`flex items-center gap-1.5 text-xs font-bold ${surface.heading}`}>
      {icon}
      {title}
    </h3>
    <div className="grid gap-2 sm:grid-cols-2">{children}</div>
  </div>
);

export default NetworkSearchSection;
