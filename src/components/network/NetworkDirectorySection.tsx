import React, { useEffect, useState } from 'react';
import { CircleAlert, Loader2, MapPin, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import type { Language } from '../../types';
import type { CommunityWorkspaceProfile } from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { NETWORK_AVAILABILITY } from '../../network/networkProfileForm';

interface NetworkDirectorySectionProps {
  language: Language;
  /** Opens the sign-in dialog so a member can add their own card. */
  onOpenAccount: () => void;
  /** Jumps to the profile form. */
  onOpenProfile: () => void;
}

const availabilityLabel = (id: string | undefined, isAr: boolean) => {
  const found = NETWORK_AVAILABILITY.find(item => item.id === id);
  if (!found) return null;
  return isAr ? found.ar : found.en;
};

/**
 * `#network/people` — the real member directory.
 *
 * It reads the published community workspaces and nothing else. When there are
 * no members yet it says so in words; it never pads the list with invented
 * engineers, because a directory of fake experts is worse than an empty one.
 */
export const NetworkDirectorySection: React.FC<NetworkDirectorySectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const [members, setMembers] = useState<CommunityWorkspaceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState('');

  const serviceReady = account?.available ?? false;
  const signedIn = Boolean(account?.user?.uid);
  const myUid = account?.user?.uid ?? null;

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    let stop: (() => void) | undefined;
    setLoading(true);
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stop = api.subscribeCommunityWorkspaces(
        false,
        next => {
          if (!active) return;
          setMembers(next);
          setLoading(false);
        },
        nextError => {
          if (!active) return;
          setError(nextError.message);
          setLoading(false);
        }
      );
    });
    return () => {
      active = false;
      stop?.();
    };
  }, [serviceReady]);

  if (!serviceReady) {
    return (
      <div
        data-testid="network-directory-unavailable"
        className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          {isAr ? 'دليل الأعضاء غير متاح في هذه النسخة' : 'The member directory is not available in this build'}
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400">
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، لذلك لا يوجد أعضاء حقيقيون لعرضهم — ولن نعرض أسماء وهمية بدلاً منهم.'
            : 'Firebase is not initialised, so there are no real members to show — and we will not show invented names instead.'}
        </p>
      </div>
    );
  }

  const needle = term.trim().toLowerCase();
  const visible = needle
    ? members.filter(member =>
        [member.displayName, member.headline, member.organizationName, member.sector, member.city, member.specialtyTrades]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(needle))
      )
    : members;

  return (
    <div data-testid="network-directory-live">
      <div className="mb-2.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
          <input
            value={term}
            onChange={event => setTerm(event.target.value)}
            aria-label={isAr ? 'البحث في الأعضاء' : 'Search members'}
            placeholder={isAr ? 'ابحث بالاسم أو التخصص أو المدينة…' : 'Search by name, discipline or city…'}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {signedIn ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
            >
              <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'بطاقتي' : 'My card'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300"
            >
              <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'أضف بطاقتك' : 'Add your card'}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
          {isAr ? `تعذّر تحميل الدليل: ${error}` : `Could not load the directory: ${error}`}
        </p>
      ) : null}

      {loading ? (
        <p role="status" className="flex items-center gap-2 p-3 text-[11px] text-slate-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل الأعضاء…' : 'Loading members…'}
        </p>
      ) : visible.length === 0 ? (
        <div
          data-testid="network-directory-empty"
          className="rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center"
        >
          <Users className="mx-auto h-6 w-6 text-slate-600" aria-hidden="true" />
          <p className="mt-2 text-xs font-bold text-slate-300">
            {needle
              ? isAr ? 'لا نتائج مطابقة' : 'No matching members'
              : isAr ? 'لا يوجد أعضاء منشورون بعد' : 'No published members yet'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500">
            {needle
              ? isAr ? 'جرّب كلمة أخرى، أو ابحث بالقطاع بدل الاسم.' : 'Try another word, or search by sector instead of a name.'
              : isAr
                ? 'الدليل يعرض البطاقات المنشورة فقط. أول بطاقة حقيقية تظهر هنا بمجرد حفظها وتأكيد البريد.'
                : 'The directory shows published cards only. The first real card appears here as soon as it is saved and the email is confirmed.'}
          </p>
        </div>
      ) : (
        <ul data-testid="network-directory-list" className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(member => {
            const availability = availabilityLabel(member.availabilityStatus, isAr);
            const isMe = member.uid === myUid;
            return (
              <li
                key={member.uid}
                data-testid="network-member-card"
                className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-bold text-violet-200">
                    {(member.displayName ?? '?').trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="min-w-0 truncate text-xs font-bold text-white">{member.displayName}</p>
                      {isMe ? (
                        <span className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200">
                          {isAr ? 'بطاقتك' : 'You'}
                        </span>
                      ) : null}
                    </div>
                    <p className="min-w-0 truncate text-[10px] text-slate-400">{member.headline || member.organizationName}</p>
                    <p className="min-w-0 truncate text-[10px] text-slate-500">{member.organizationName}</p>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
                    {member.sector}
                  </span>
                  {member.city ? (
                    <span className="inline-flex items-center gap-0.5 rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
                      <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                      {member.city}
                    </span>
                  ) : null}
                  {typeof member.yearsExperience === 'number' ? (
                    <span className="rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
                      {isAr ? `${member.yearsExperience} سنة` : `${member.yearsExperience} yrs`}
                    </span>
                  ) : null}
                  {availability ? (
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-200">
                      {availability}
                    </span>
                  ) : null}
                </div>

                {member.specialtyTrades ? (
                  <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-slate-400">{member.specialtyTrades}</p>
                ) : null}

                {member.certifications ? (
                  <p className="mt-1.5 flex items-start gap-1 rounded border border-[#232345] bg-[#0b0b18] px-1.5 py-1 text-[9px] leading-relaxed text-slate-400">
                    <ShieldCheck className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <span className="min-w-0">
                      {isAr ? 'شهادات معلنة (غير مُتحقَّق منها): ' : 'Declared certifications (not verified): '}
                      {member.certifications}
                    </span>
                  </p>
                ) : null}

                {!isMe ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={isAr ? 'الاتصال المباشر يفعّل في مرحلة المنشورات والاتصالات' : 'Connect turns on in the posts-and-connections phase'}
                      className="inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-500 opacity-70 cursor-not-allowed"
                    >
                      {isAr ? 'اتصال' : 'Connect'}
                    </button>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={isAr ? 'الرسائل تُفعّل في مرحلتها' : 'Messages arrive in their own phase'}
                      className="inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-500 opacity-70 cursor-not-allowed"
                    >
                      {isAr ? 'رسالة' : 'Message'}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NetworkDirectorySection;
