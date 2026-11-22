import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Loader2, MessageSquareQuote, Plus, Trash2, Users } from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityEndorsement,
  CommunityRecommendation,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import {
  EMPTY_RECOMMENDATION,
  NETWORK_SKILL_LIMITS,
  RECOMMENDATION_RELATIONS,
  canEndorse,
  canManageRecommendation,
  countEndorsements,
  endorsersOf,
  parseSkills,
  relationLabel,
  skillById,
  skillLabel,
  validateRecommendation,
  type RecommendationDraft,
} from '../../network/networkSkills';

const chip =
  'inline-flex min-w-0 items-center gap-1 rounded-full border border-[#2a2a4d] bg-[#0b0b18] px-2 py-0.5 text-[10px] text-slate-200';
const smallButton =
  'inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200 transition hover:border-violet-400 disabled:opacity-50';

const shortDate = (value: unknown, isAr: boolean): string => {
  const raw = value as { toDate?: () => Date } | string | number | null | undefined;
  const date =
    raw && typeof raw === 'object' && typeof raw.toDate === 'function'
      ? raw.toDate()
      : typeof raw === 'string' || typeof raw === 'number'
        ? new Date(raw)
        : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'short' });
};

interface PanelProps {
  profile: CommunityWorkspaceProfile;
  language: Language;
  /** True on `#network/profile` screens: the viewer is the card's owner. */
  self?: boolean;
  onOpenProfile?: () => void;
}

/**
 * Declared skills, with endorsement counts computed from documents.
 *
 * The heading says "تزكيات زملاء" and never "موثّق": an endorsement is a colleague's
 * word, and this site grants no verification badge through it.
 */
export const NetworkSkillsPanel: React.FC<PanelProps> = ({ profile, language, self = false, onOpenProfile }) => {
  const isAr = language === 'ar';
  const account = useOptionalSiteAccount();
  const viewerUid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const declared = useMemo(() => parseSkills(profile.skills), [profile.skills]);
  const [rows, setRows] = useState<CommunityEndorsement[]>([]);
  const [mine, setMine] = useState<Record<string, true>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!verified) {
      setRows([]);
      setLoading(false);
      return;
    }
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        const api = await import('../../client/communityReputationService');
        unsubscribe = api.subscribeEndorsements(
          profile.uid,
          next => {
            if (!alive) return;
            setRows(next);
            setLoading(false);
          },
          error => {
            if (!alive) return;
            setFailure(error.message);
            setLoading(false);
          }
        );
        if (viewerUid && viewerUid !== profile.uid) {
          const own = await api.loadMyEndorsements(viewerUid, profile.uid);
          if (alive) setMine(own);
        }
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [profile.uid, verified, viewerUid]);

  const counts = useMemo(() => countEndorsements(rows), [rows]);

  const endorse = useCallback(
    async (skillId: string) => {
      const user = account?.user;
      if (!user) return;
      setBusy(skillId);
      setFailure(null);
      try {
        const api = await import('../../client/communityReputationService');
        const myName = (await api.loadMyDisplayName(user.uid)) || user.displayName || '';
        await api.endorseSkill(user, { uid: profile.uid, skillId }, myName);
      } catch (error) {
        setFailure(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(null);
      }
    },
    [account?.user, profile.uid]
  );

  if (declared.length === 0) {
    return (
      <div data-testid="network-skills-empty" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
        <p className="text-[10px] leading-relaxed text-slate-400">
          {isAr ? 'لم يُعلن أي مهارة بعد.' : 'No skills declared yet.'}
        </p>
        {self && onOpenProfile ? (
          <button type="button" onClick={onOpenProfile} className={`${smallButton} mt-2`}>
            <Plus className="h-3 w-3" aria-hidden="true" />
            {isAr ? 'أعلن مهاراتك من ملفك' : 'Declare skills on your profile'}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div data-testid="network-skills-panel" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <h3 className="text-[11px] font-bold text-slate-200">{isAr ? 'المهارات' : 'Skills'}</h3>
        <span className="rounded bg-amber-500/10 px-1 text-[8px] font-bold text-amber-300">
          {isAr ? 'تزكيات زملاء — ليست شهادة' : 'peer endorsements — not certification'}
        </span>
        {!verified ? (
          <span data-testid="network-skills-signin" className="text-[9px] text-slate-500">
            {isAr ? 'سجّل الدخول لرؤية التزكيات.' : 'Sign in to see endorsements.'}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p role="status" className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل التزكيات…' : 'Loading endorsements…'}
        </p>
      ) : null}

      <ul data-testid="network-skills-list" className="mt-1.5 flex flex-wrap gap-1.5">
        {declared.map(skillId => {
          const skill = skillById(skillId);
          const label = skill ? skillLabel(skill, isAr) : skillId;
          const count = counts[skillId] ?? 0;
          const gate = canEndorse({
            viewerUid,
            viewerVerified: verified,
            toUid: profile.uid,
            skillId,
            targetSkills: declared,
            existing: rows,
          });
          const already = mine[skillId] === true;
          return (
            <li key={skillId} data-testid="network-skill-chip" className={chip} title={label}>
              <span className="max-w-[190px] truncate">{label}</span>
              <span
                data-testid="network-skill-endorsements"
                className="rounded-full bg-violet-500/15 px-1 text-[9px] font-bold text-violet-200"
                title={
                  count === 0
                    ? isAr
                      ? 'لا تزكيات بعد'
                      : 'No endorsements yet'
                    : `${endorsersOf(rows, skillId).slice(0, 6).join(' · ')}`
                }
              >
                {count}
              </span>
              {!self && verified ? (
                already ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-300">
                    <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
                    {isAr ? 'زكّيتها' : 'endorsed'}
                  </span>
                ) : (
                  <button
                    type="button"
                    data-testid="network-skill-endorse"
                    disabled={!gate.allowed || busy === skillId}
                    title={isAr ? gate.reasonAr ?? 'زكّي هذه المهارة' : gate.reasonEn ?? 'Endorse this skill'}
                    onClick={() => void endorse(skillId)}
                    className={smallButton}
                  >
                    {busy === skillId ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                    )}
                    {isAr ? 'زكِّ' : 'Endorse'}
                  </button>
                )
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
        {isAr
          ? `العدد محسوب من تزكيات الأعضاء المؤكَّدين (حتى ${NETWORK_SKILL_LIMITS.maxSkills} مهارة للعضو). لا يُمنح أي شارة تحقّق من التزكية.`
          : `Counts are computed from confirmed members' endorsements (up to ${NETWORK_SKILL_LIMITS.maxSkills} skills each). An endorsement grants no verification badge.`}
      </p>

      {failure ? (
        <p role="alert" className="mt-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
          {failure}
        </p>
      ) : null}
    </div>
  );
};

/**
 * Written recommendations. Readable by confirmed members (the rules decide that,
 * the panel only reports it), one per pair, editable by its author.
 */
export const NetworkRecommendationsPanel: React.FC<PanelProps> = ({
  profile,
  language,
  self = false,
}) => {
  const isAr = language === 'ar';
  const account = useOptionalSiteAccount();
  const viewerUid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const [rows, setRows] = useState<CommunityRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<RecommendationDraft>(EMPTY_RECOMMENDATION);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [errors, setErrors] = useState<ReturnType<typeof validateRecommendation>>([]);

  useEffect(() => {
    if (!verified) {
      setLoading(false);
      return;
    }
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        const api = await import('../../client/communityReputationService');
        unsubscribe = api.subscribeRecommendations(
          profile.uid,
          next => {
            if (!alive) return;
            setRows(next);
            setLoading(false);
          },
          error => {
            if (!alive) return;
            setFailure(error.message);
            setLoading(false);
          }
        );
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [profile.uid, verified]);

  const mineRow = rows.find(row => row.fromUid === viewerUid) ?? null;
  // Validated on every render so the button state never lags the text, but the
  // message stays quiet until the member has actually typed something.
  const blocked = validateRecommendation(draft).length > 0;

  useEffect(() => {
    if (mineRow && !editing) {
      setDraft({ relation: mineRow.relation as RecommendationDraft['relation'], body: mineRow.body });
    }
  }, [mineRow?.id, editing]);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const user = account?.user;
      if (!user) return;
      const nextErrors = validateRecommendation(draft);
      setErrors(nextErrors);
      if (nextErrors.length > 0) return;
      setSaving(true);
      setFailure(null);
      try {
        const api = await import('../../client/communityReputationService');
        const myName = (await api.loadMyDisplayName(user.uid)) || user.displayName || '';
        await api.writeRecommendation(
          user,
          { uid: profile.uid, displayName: profile.displayName },
          myName,
          { relation: draft.relation, body: draft.body.trim() },
          { exists: Boolean(mineRow) }
        );
        setEditing(false);
      } catch (error) {
        setFailure(error instanceof Error ? error.message : String(error));
      } finally {
        setSaving(false);
      }
    },
    [account?.user, draft, mineRow, profile.displayName, profile.uid]
  );

  const remove = useCallback(async (row: CommunityRecommendation) => {
    setFailure(null);
    try {
      const api = await import('../../client/communityReputationService');
      await api.deleteRecommendation(row.id);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return (
    <div data-testid="network-recommendations-panel" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
        <h3 className="text-[11px] font-bold text-slate-200">{isAr ? 'توصيات مكتوبة' : 'Written recommendations'}</h3>
        <span className="text-[9px] text-slate-500">
          {isAr ? 'من عضو إلى عضو — الكلمة لكاتبها' : 'Member to member — the words belong to their author'}
        </span>
      </div>

      {!verified ? (
        <p data-testid="network-recommendations-signin" className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
          {isAr
            ? 'التوصيات تُقرأ للأعضاء المؤكَّدين فقط — هذا قرار القواعد، لا إخفاء واجهة.'
            : 'Recommendations are readable by confirmed members only — that is the rules, not a hidden button.'}
        </p>
      ) : loading ? (
        <p role="status" className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل التوصيات…' : 'Loading recommendations…'}
        </p>
      ) : rows.length === 0 ? (
        <p data-testid="network-recommendations-empty" className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
          {isAr ? 'لا توصيات بعد.' : 'No recommendations yet.'}
        </p>
      ) : (
        <ul data-testid="network-recommendations-list" className="mt-1.5 space-y-2">
          {rows.map(row => {
            const manageable = canManageRecommendation(row, viewerUid);
            return (
              <li key={row.id} data-testid="network-recommendation" className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-white">{row.fromName}</span>
                  <span className="rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400">
                    {relationLabel(row.relation, isAr)}
                  </span>
                  <span className="text-[9px] text-slate-500">{shortDate(row.createdAt, isAr)}</span>
                  {manageable ? (
                    <span className="ms-auto flex items-center gap-1">
                      {row.fromUid === viewerUid ? (
                        <button
                          type="button"
                          data-testid="network-recommendation-edit"
                          onClick={() => {
                            setEditing(true);
                            setDraft({ relation: row.relation as RecommendationDraft['relation'], body: row.body });
                          }}
                          className="text-[9px] font-bold text-violet-300 underline decoration-dotted"
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        data-testid="network-recommendation-delete"
                        onClick={() => void remove(row)}
                        title={isAr ? 'حذف التوصية' : 'Delete recommendation'}
                        className="text-[9px] font-bold text-rose-300"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300">{row.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {verified && !self ? (
        <form onSubmit={submit} data-testid="network-recommendation-form" className="mt-2 min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Users className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
            <label className="text-[9px] font-bold text-slate-400" htmlFor="recommendation-relation">
              {isAr ? 'علاقتك به' : 'Your relation'}
            </label>
            <select
              id="recommendation-relation"
              value={draft.relation}
              onChange={event => setDraft(current => ({ ...current, relation: event.target.value as RecommendationDraft['relation'] }))}
              className="rounded border border-[#2a2a4d] bg-[#0f0f22] px-1.5 py-0.5 text-[10px] text-slate-200"
            >
              {RECOMMENDATION_RELATIONS.map(relation => (
                <option key={relation.id} value={relation.id}>
                  {isAr ? relation.ar : relation.en}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={draft.body}
            onChange={event => {
              setDraft(current => ({ ...current, body: event.target.value }));
              setErrors(validateRecommendation({ ...draft, body: event.target.value }));
            }}
            rows={3}
            maxLength={NETWORK_SKILL_LIMITS.recommendationMax + 40}
            placeholder={
              isAr
                ? 'مثال: عملنا معاً في فحص لحامات خط ١٢ بوصة، وكان مسؤولاً عن تقييم العيوب بدقة…'
                : 'Example: we worked together on the 12-inch line, and he sized the defects precisely…'
            }
            className="mt-1.5 w-full min-w-0 rounded border border-[#2a2a4d] bg-[#0f0f22] px-2 py-1.5 text-[10px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <button type="submit" disabled={saving || blocked} data-testid="network-recommendation-submit" className={smallButton}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : null}
              {mineRow ? (isAr ? 'احفظ التعديل' : 'Save changes') : isAr ? 'أضف توصية' : 'Add recommendation'}
            </button>
            <span className="text-[9px] text-slate-500">
              {draft.body.trim().length}/{NETWORK_SKILL_LIMITS.recommendationMax}
            </span>
            {errors.length > 0 && draft.body.trim().length > 0 ? (
              <span role="alert" data-testid="network-recommendation-error" className="text-[9px] text-rose-300">
                {isAr ? errors[0].ar : errors[0].en}
              </span>
            ) : null}
          </div>
        </form>
      ) : null}

      {failure ? (
        <p role="alert" className="mt-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
          {failure}
        </p>
      ) : null}
    </div>
  );
};
