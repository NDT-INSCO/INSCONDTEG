import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Award,
  CheckCircle2,
  Flag,
  Lightbulb,
  MessageSquare,
  Pin,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityPost,
  CommunityPostComment,
  CommunityPostReaction,
  CommunityReactionType,
} from '../../client/types';
import {
  addCommunityPostComment,
  deleteCommunityPost,
  setCommunityPostReaction,
  subscribePostComments,
  subscribePostReactions,
  updateCommunityPostModeration,
} from '../../client/firestoreClientService';
import { runCommunityAssist } from '../../ai/agentsClient';

interface InscoCommunityFeedCardProps {
  language: Language;
  post: CommunityPost;
  user: User | null;
  currentAuthorName: string;
  currentAuthorHeadline?: string;
  isAdmin: boolean;
  onRequireSignIn?: () => void;
}

const POST_TYPE_LABEL: Record<
  CommunityPost['postType'],
  { ar: string; en: string }
> = {
  technical_case: { ar: 'دراسة حالة فنية', en: 'Technical Case' },
  job_tender: { ar: 'وظيفة / مناقصة', en: 'Job / Tender' },
  discussion: { ar: 'نقاش هندسي', en: 'Discussion' },
  equipment_review: { ar: 'تقييم معدات', en: 'Equipment Review' },
  announcement: { ar: 'إعلان إداري', en: 'Official Announcement' },
};

const REACTION_OPTIONS: Array<{
  type: CommunityReactionType;
  labelAr: string;
  labelEn: string;
  Icon: typeof ThumbsUp;
}> = [
  { type: 'like', labelAr: 'أعجبني', labelEn: 'Like', Icon: ThumbsUp },
  { type: 'insightful', labelAr: 'رؤية هندسية', labelEn: 'Insightful', Icon: Lightbulb },
  { type: 'verified', labelAr: 'دقيق كودياً', labelEn: 'Tech Verified', Icon: ShieldCheck },
  { type: 'celebrate', labelAr: 'تهنئة', labelEn: 'Celebrate', Icon: Award },
];

export const InscoCommunityFeedCard: React.FC<InscoCommunityFeedCardProps> = ({
  language,
  post,
  user,
  currentAuthorName,
  currentAuthorHeadline,
  isAdmin,
  onRequireSignIn,
}) => {
  const isAr = language === 'ar';
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommunityPostComment[]>([]);
  const [reactions, setReactions] = useState<CommunityPostReaction[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(post.aiSummary ?? null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    setAiAnalysis(post.aiSummary ?? null);
  }, [post.aiSummary]);

  useEffect(() => {
    if (!post.id) return;
    const unsubReactions = subscribePostReactions(post.id, setReactions);
    let unsubComments: () => void = () => {};
    if (commentsOpen) {
      unsubComments = subscribePostComments(post.id, setComments);
    }
    return () => {
      unsubReactions();
      unsubComments();
    };
  }, [post.id, commentsOpen]);

  const myReaction = user ? reactions.find(r => r.uid === user.uid) ?? null : null;
  const displayLikesCount = Math.max(post.likesCount ?? 0, reactions.length);
  const isAuthor = Boolean(user && user.uid === post.authorUid);

  const handleReact = async (reactionType: CommunityReactionType) => {
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    if (reacting) return;
    setReacting(true);
    try {
      await setCommunityPostReaction(user, post.id, reactionType, myReaction);
    } finally {
      setReacting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent, isAiAssisted = false) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    const clean = commentText.trim();
    if (!clean || submittingComment) return;
    setSubmittingComment(true);
    try {
      await addCommunityPostComment(user, post.id, {
        authorName: currentAuthorName,
        authorHeadline: currentAuthorHeadline,
        body: clean,
        isAiAssisted,
      });
      setCommentText('');
      setCommentsOpen(true);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAiSummarizeOrCheck = async (action: 'summarize_post' | 'code_check') => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await runCommunityAssist({
        action,
        language,
        ndtMethod: post.ndtMethod,
        title: post.title,
        body: post.body,
      });
      setAiAnalysis(res.reply);
      if (isAdmin && !post.aiSummary) {
        void updateCommunityPostModeration(post.id, { aiSummary: res.reply }).catch(() => {});
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestReply = async () => {
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setCommentsOpen(true);
    try {
      const res = await runCommunityAssist({
        action: 'suggest_reply',
        language,
        ndtMethod: post.ndtMethod,
        title: post.title,
        body: post.body,
      });
      setCommentText(res.body || res.reply);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <article
      data-testid={`community-post-${post.id}`}
      className={`rounded-xl border p-4 sm:p-5 space-y-3 transition ${
        post.isPinnedAnnouncement
          ? 'border-amber-500/45 bg-slate-900/90'
          : post.aiModerationStatus === 'flagged'
            ? 'border-rose-500/45 bg-slate-900/80'
            : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      {/* Header: LinkedIn Identity + Metadata */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-white">{post.authorName}</span>
            {post.isPinnedAnnouncement && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                <Pin className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'مثبت إدارياً' : 'Pinned'}</span>
              </span>
            )}
            {post.aiModerationStatus === 'flagged' && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                <Flag className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'قيد المراجعة' : 'Flagged'}</span>
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {post.authorHeadline ? `${post.authorHeadline} · ` : ''}
            <span className="text-slate-300 font-semibold">{post.authorOrg}</span>
            {post.authorCompanyCode ? ` · ${post.authorCompanyCode}` : ''}
          </div>
          <div className="text-[11px] font-mono text-cyan-400">
            {POST_TYPE_LABEL[post.postType]?.[isAr ? 'ar' : 'en'] ?? post.postType}
            {' · '}
            {post.ndtMethod}
          </div>
        </div>

        {(isAdmin || isAuthor) && (
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button
                  type="button"
                  title={isAr ? 'تثبيت / إلغاء تثبيت الإعلان' : 'Toggle Pinned Announcement'}
                  onClick={() =>
                    void updateCommunityPostModeration(post.id, {
                      isPinnedAnnouncement: !post.isPinnedAnnouncement,
                    })
                  }
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-amber-300 cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'تمييز للمراجعة / اعتماد' : 'Toggle Moderation Flag'}
                  onClick={() =>
                    void updateCommunityPostModeration(post.id, {
                      aiModerationStatus:
                        post.aiModerationStatus === 'flagged' ? 'approved' : 'flagged',
                    })
                  }
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-rose-300 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </>
            )}
            <button
              type="button"
              title={isAr ? 'حذف المنشور' : 'Delete Post'}
              onClick={() => void deleteCommunityPost(post.id)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2">
        <h3 className="text-base font-black text-white leading-snug">{post.title}</h3>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
          {post.body}
        </p>

        {post.technicalSnippet && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
            {post.technicalSnippet}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-cyan-400">
            {post.tags.map(tag => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Inline AI Copilot Tools on Each Post */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => void handleAiSummarizeOrCheck('summarize_post')}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          <span>{isAr ? 'تلخيص AI' : 'AI Summary'}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleAiSummarizeOrCheck('code_check')}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
          <span>{isAr ? 'تحقق من الكود AI' : 'AI Code Check'}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleSuggestReply()}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:border-amber-400 px-2.5 py-1 text-[11px] font-semibold text-slate-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          <Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" />
          <span>{isAr ? 'اقترح تعليقاً هندسياً' : 'Draft Technical Reply'}</span>
        </button>
      </div>

      {aiError && (
        <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {aiError}
        </div>
      )}

      {aiAnalysis && (
        <div className="rounded-lg border border-cyan-500/30 bg-slate-950/80 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'تحليل المساعد الذكي INSCO' : 'INSCO AI Technical Brief'}</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
        </div>
      )}

      {/* Facebook / LinkedIn Social Action Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {REACTION_OPTIONS.map(opt => {
            const active = myReaction?.reactionType === opt.type;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => void handleReact(opt.type)}
                disabled={reacting}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? opt.labelAr : opt.labelEn}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
          <span>
            {displayLikesCount} {isAr ? 'تفاعل' : 'reactions'}
          </span>
          <button
            type="button"
            onClick={() => setCommentsOpen(o => !o)}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 font-sans font-semibold cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {Math.max(post.commentsCount ?? 0, comments.length)}{' '}
              {isAr ? 'تعليقات' : 'Comments'}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Comments Thread */}
      {commentsOpen && (
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400">
              {isAr
                ? 'لا توجد تعليقات بعد. كن أول من يشارك برأيه الفني.'
                : 'No comments yet. Start the engineering discussion.'}
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div
                  key={c.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-white">{c.authorName}</span>
                    {c.isAiAssisted && (
                      <span className="font-mono text-[10px] text-cyan-400">AI-Assisted</span>
                    )}
                  </div>
                  {c.authorHeadline && (
                    <div className="text-[10px] text-slate-400">{c.authorHeadline}</div>
                  )}
                  <p className="text-xs text-slate-200 whitespace-pre-line">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={e => void handleAddComment(e)} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={
                user
                  ? isAr
                    ? 'اكتب تعليقاً أو استفساراً هندسياً...'
                    : 'Write a technical comment or question...'
                  : isAr
                    ? 'سجّل الدخول لإضافة تعليق'
                    : 'Sign in to post a comment'
              }
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 px-3 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إرسال' : 'Reply'}</span>
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
