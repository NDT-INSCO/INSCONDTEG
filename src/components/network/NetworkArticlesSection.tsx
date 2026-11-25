import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CircleAlert,
  ExternalLink,
  GraduationCap,
  Heart,
  Loader2,
  PenLine,
  Send,
  Sparkles,
} from 'lucide-react';
import type { Language } from '../../types';
import type { CommunityNdtMethod, CommunityPost, CommunityWorkspaceProfile } from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { AiGeneratedBadge } from './NetworkBadges';
import {
  ACADEMY_LINKABLE_COURSES,
  NDT_METHOD_TAXONOMY,
} from '../../network/networkTaxonomy';
import { runCommunityAssist } from '../../ai/agentsClient';

interface NetworkArticlesSectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenAcademy: () => void;
}

export const NetworkArticlesSection: React.FC<NetworkArticlesSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ndtMethod, setNdtMethod] = useState<CommunityNdtMethod>('PAUT');
  const [kind, setKind] = useState<'article' | 'case_study'>('article');
  const [academyCourseId, setAcademyCourseId] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [aiAssisted, setAiAssisted] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    let stopPosts: (() => void) | undefined;
    let stopCard: (() => void) | undefined;

    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stopPosts = api.subscribeCommunityPosts(
        false,
        list => {
          if (!active) return;
          setPosts(list);
          setLoading(false);
        },
        () => {
          if (active) setLoading(false);
        }
      );
      if (uid) {
        stopCard = api.subscribeMyCommunityWorkspace(
          uid,
          next => {
            if (active) setCard(next);
          },
          () => {}
        );
      }
    });

    return () => {
      active = false;
      stopPosts?.();
      stopCard?.();
    };
  }, [serviceReady, uid]);

  const articles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      const isLongForm =
        p.categoryTag === 'article' ||
        p.categoryTag === 'case_study' ||
        p.postFormat === 'article' ||
        p.postFormat === 'case_study' ||
        p.postType === 'technical_case';
      if (!isLongForm) return false;
      if (methodFilter !== 'ALL' && p.ndtMethod !== methodFilter) return false;
      if (!q) return true;
      return `${p.title} ${p.body} ${p.authorName} ${(p.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [posts, methodFilter, search]);

  const runAiHelper = useCallback(
    async (action: 'draft_from_topic' | 'enhance_post' | 'code_check') => {
      const seed = body.trim() || title.trim();
      if (seed.length < 3) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await runCommunityAssist({
          action,
          language: isAr ? 'ar' : 'en',
          ndtMethod,
          title: title.trim() || undefined,
          body: seed,
        });
        const generated = (res.body ?? res.reply ?? '').trim();
        if (action === 'draft_from_topic') {
          if (!title.trim() && res.title) setTitle(res.title.slice(0, 180));
          setBody(generated.slice(0, 3000));
        } else if (action === 'enhance_post') {
          setBody(generated.slice(0, 3000));
        } else {
          setBody(prev => `${prev.trim()}\n\n---\n${generated}`.slice(0, 3000));
        }
        setAiAssisted(true);
      } catch (err) {
        setAiError(err instanceof Error ? err.message : String(err));
      } finally {
        setAiLoading(false);
      }
    },
    [body, isAr, ndtMethod, title]
  );

  const publishArticle = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || title.trim().length < 3 || body.trim().length < 5) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const api = await import('../../client/firestoreClientService');
        const course = ACADEMY_LINKABLE_COURSES.find(c => c.id === academyCourseId);
        const tags = tagsText
          .split(/[,،#\n]+/)
          .map(t => t.trim())
          .filter(Boolean)
          .slice(0, 6);
        await api.createCommunityPost(user, {
          authorName: card.displayName,
          authorOrg: card.organizationName,
          ...(card.headline ? { authorHeadline: card.headline } : {}),
          ...(card.companyCode ? { authorCompanyCode: card.companyCode } : {}),
          postType: 'technical_case',
          categoryTag: kind,
          ndtMethod,
          title: title.trim(),
          body: body.trim(),
          tags,
          ...(linkUrl.trim().startsWith('https://') ? { linkUrl: linkUrl.trim() } : {}),
          ...(course
            ? { academyCourseId: course.id, academyCourseTitle: isAr ? course.ar : course.en }
            : {}),
          isAiAssisted: aiAssisted,
          visibility: 'public',
          isPinnedAnnouncement: false,
        });
        setTitle('');
        setBody('');
        setLinkUrl('');
        setTagsText('');
        setAcademyCourseId('');
        setAiAssisted(false);
        setComposerOpen(false);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [academyCourseId, account?.user, aiAssisted, body, card, isAr, kind, linkUrl, ndtMethod, tagsText, title]
  );

  const canPublish = Boolean(uid && verified && card);

  return (
    <div data-testid="network-section-articles" className="min-w-0 space-y-3">
      <div className={`${s.card} p-3`}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className={`flex items-center gap-2 text-base font-bold ${s.heading}`}>
              <BookOpen className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'المقالات الفنية ودراسات الحالة' : 'Technical Articles & Case Studies'}
            </h2>
            <p className={`mt-0.5 text-[11px] ${s.subtext}`}>
              {isAr
                ? 'شروح ميدانية ومراجعات أكواد الفحص غير الإتلافي مرتبطة بدورات الأكاديمية.'
                : 'Field notes, NDT code interpretations, and failure case studies linked with INSCO Academy.'}
            </p>
          </div>
          {canPublish ? (
            <button
              type="button"
              onClick={() => setComposerOpen(v => !v)}
              data-testid="network-article-compose-toggle"
              className={s.buttonPrimary}
            >
              <PenLine className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {composerOpen
                ? isAr ? 'إغلاق المحرر' : 'Close editor'
                : isAr ? 'كتابة مقال فني' : 'Write technical article'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (uid ? onOpenProfile() : onOpenAccount('signin'))}
              className={s.buttonSecondary}
            >
              <PenLine className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {uid
                ? isAr ? 'أكمل بطاقتك للكتابة' : 'Complete profile to write'
                : isAr ? 'سجّل الدخول للكتابة' : 'Sign in to write'}
            </button>
          )}
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={isAr ? 'بحث في المقالات' : 'Search articles'}
            placeholder={isAr ? 'ابحث بالعنوان أو الكود أو الكاتب…' : 'Search title, code, or author…'}
            className={`${s.input} sm:max-w-xs`}
          />
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            aria-label={isAr ? 'تصفية بالتخصص' : 'Filter by NDT method'}
            className={`${s.input} sm:w-48`}
          >
            <option value="ALL">{isAr ? 'كل تخصصات NDT' : 'All NDT methods'}</option>
            {NDT_METHOD_TAXONOMY.map(m => (
              <option key={m.id} value={m.id}>
                {isAr ? m.ar : m.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {composerOpen && canPublish ? (
        <form onSubmit={publishArticle} className={`${s.card} space-y-2.5 p-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs font-bold ${s.heading}`}>
              {isAr ? 'محرر المقالات ودراسات الحالة' : 'Article & Case Study Editor'}
            </span>
            {aiAssisted ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={kind}
              onChange={e => setKind(e.target.value as 'article' | 'case_study')}
              className={s.input}
              aria-label={isAr ? 'التصنيف' : 'Category'}
            >
              <option value="article">{isAr ? 'مقال فني' : 'Technical Article'}</option>
              <option value="case_study">{isAr ? 'دراسة حالة ميدانية' : 'Field Case Study'}</option>
            </select>

            <select
              value={ndtMethod}
              onChange={e => setNdtMethod(e.target.value as CommunityNdtMethod)}
              className={s.input}
              aria-label={isAr ? 'طريقة الفحص' : 'NDT Method'}
            >
              {NDT_METHOD_TAXONOMY.map(m => (
                <option key={m.id} value={m.id}>
                  {isAr ? m.ar : m.en}
                </option>
              ))}
            </select>

            <select
              value={academyCourseId}
              onChange={e => setAcademyCourseId(e.target.value)}
              className={s.input}
              aria-label={isAr ? 'ربط بدورة أكاديمية' : 'Link Academy course'}
            >
              <option value="">{isAr ? 'ربط بدورة أكاديمية (اختياري)' : 'Link Academy course (optional)'}</option>
              {ACADEMY_LINKABLE_COURSES.map(c => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.ar : c.en}
                </option>
              ))}
            </select>
          </div>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={180}
            required
            placeholder={isAr ? 'عنوان المقال أو دراسة الحالة…' : 'Article or case study title…'}
            className={s.input}
          />

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            maxLength={3000}
            required
            placeholder={
              isAr
                ? 'اكتب التحليل الهندسي، خطوات المعايرة، الكود المرجعي، والنتائج…'
                : 'Write the engineering analysis, calibration setup, reference code, and findings…'
            }
            className={`${s.input} resize-y`}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
              placeholder={isAr ? 'وسوم: ASME-V, PAUT, P91' : 'Tags: ASME-V, PAUT, P91'}
              className={s.input}
            />
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://... (optional technical reference)"
              className={s.input}
            />
          </div>

          {/* INSCO Community AI Writing Assistant */}
          <div className={`${s.subCard} flex flex-wrap items-center gap-1.5 p-2`}>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-fuchsia-400">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'مساعد INSCO للكتابة:' : 'INSCO Community AI:'}
            </span>
            <button
              type="button"
              disabled={aiLoading || (title.trim().length < 3 && body.trim().length < 3)}
              onClick={() => void runAiHelper('draft_from_topic')}
              className={s.buttonSecondary}
            >
              {aiLoading ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : null}
              {isAr ? 'صياغة مسودة' : 'Draft article'}
            </button>
            <button
              type="button"
              disabled={aiLoading || body.trim().length < 5}
              onClick={() => void runAiHelper('enhance_post')}
              className={s.buttonSecondary}
            >
              {isAr ? 'تحسين الأسلوب' : 'Enhance clarity'}
            </button>
            <button
              type="button"
              disabled={aiLoading || body.trim().length < 5}
              onClick={() => void runAiHelper('code_check')}
              className={s.buttonSecondary}
            >
              {isAr ? 'فحص مرجعي للكود' : 'Code & technical check'}
            </button>
            {aiError ? <span className="text-[10px] text-rose-400">{aiError}</span> : null}
          </div>

          {submitError ? <p className="text-[10px] text-rose-400">{submitError}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || title.trim().length < 3 || body.trim().length < 5}
              className={s.buttonPrimary}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {isAr ? 'نشر المقال' : 'Publish article'}
            </button>
          </div>
        </form>
      ) : null}

      {!serviceReady ? (
        <div className={`${s.card} p-4 text-xs ${s.subtext}`}>
          <CircleAlert className="mb-1 inline h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />{' '}
          {isAr
            ? 'المقالات متاحة عند تفعيل اتصال قاعدة البيانات.'
            : 'Articles require active database configuration.'}
        </div>
      ) : loading ? (
        <p className={`flex items-center gap-2 p-4 text-xs ${s.subtext}`}>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل المقالات…' : 'Loading articles…'}
        </p>
      ) : articles.length === 0 ? (
        <div data-testid="network-articles-empty" className={`${s.card} p-6 text-center`}>
          <BookOpen className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
          <p className={`mt-2 text-xs font-bold ${s.heading}`}>
            {isAr ? 'لا توجد مقالات منشورة مطابقة للبحث بعد' : 'No published articles match this filter yet'}
          </p>
          <p className={`mt-1 text-[11px] ${s.subtext}`}>
            {isAr
              ? 'كن أول من يوثق دراسة حالة أو شرحاً هندسياً حقيقياً لمجتمع إنسكو.'
              : 'Be the first member to publish a technical case study or code guide.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {articles.map(article => (
            <article key={article.id} data-testid="network-article-card" className={`${s.card} flex flex-col justify-between p-3`}>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={s.chip}>{article.ndtMethod}</span>
                  <span className={s.chip}>
                    {article.categoryTag === 'case_study'
                      ? isAr ? 'دراسة حالة' : 'Case Study'
                      : isAr ? 'مقال فني' : 'Article'}
                  </span>
                  {article.isAiAssisted ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
                </div>
                <h3 className={`text-sm font-bold leading-snug ${s.heading}`}>{article.title}</h3>
                <p className={`text-[10px] ${s.subtext}`}>
                  {article.authorName} · {article.authorOrg}
                </p>
                <p className={`whitespace-pre-wrap text-[11px] leading-relaxed ${s.subtext}`}>
                  {article.body}
                </p>
                {article.tags && article.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {article.tags.map(t => (
                      <span key={t} className={s.chip}>#{t}</span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 ${s.divider}`}>
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className={`inline-flex items-center gap-1 ${s.subtext}`}>
                    <Heart className="h-3 w-3 shrink-0 text-rose-400" aria-hidden="true" />
                    {article.likesCount}
                  </span>
                  {article.academyCourseId ? (
                    <button
                      type="button"
                      onClick={onOpenAcademy}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 cursor-pointer hover:border-amber-400"
                    >
                      <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {article.academyCourseTitle || (isAr ? 'دورة الأكاديمية' : 'Academy course')}
                    </button>
                  ) : null}
                </div>
                {article.linkUrl ? (
                  <a
                    href={article.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {isAr ? 'مرجع' : 'Reference'}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkArticlesSection;
