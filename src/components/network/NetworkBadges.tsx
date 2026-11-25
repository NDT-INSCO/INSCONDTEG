import React from 'react';
import { Award, BadgeCheck, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import type { Language } from '../../types';
import type { CommunityWorkspaceProfile } from '../../client/types';
import type { MemberReputationSummary } from '../../network/networkTaxonomy';
import { computeVerificationTrackState } from '../../network/networkTaxonomy';

/**
 * Strictly three independent badges:
 * - Identity Verified
 * - Organization Verified
 * - Credential Reviewed
 * None is inferred from another, and none is granted without admin review.
 */
export const VerificationTrackBadges: React.FC<{
  profile: CommunityWorkspaceProfile | null | undefined;
  language: Language;
  isLight?: boolean;
}> = ({ profile, language, isLight = false }) => {
  const isAr = language === 'ar';
  const tracks = computeVerificationTrackState(profile);
  if (!tracks.identity && !tracks.organization && !tracks.credential) {
    return null;
  }
  return (
    <div data-testid="network-verification-tracks" className="flex flex-wrap items-center gap-1">
      {tracks.identity ? (
        <span
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
            isLight
              ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
              : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
          }`}
        >
          <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr ? 'هوية موثقة' : 'Identity Verified'}
        </span>
      ) : null}
      {tracks.organization ? (
        <span
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
            isLight
              ? 'border-violet-300 bg-violet-50 text-violet-800'
              : 'border-violet-500/40 bg-violet-500/10 text-violet-200'
          }`}
        >
          <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr ? 'مؤسسة موثقة' : 'Organization Verified'}
        </span>
      ) : null}
      {tracks.credential ? (
        <span
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
            isLight
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr ? 'مؤهل مراجَع' : 'Credential Verified'}
        </span>
      ) : null}
    </div>
  );
};

/**
 * Community activity recognition score — explicitly separated from formal verification.
 */
export const ReputationScorePill: React.FC<{
  summary: MemberReputationSummary;
  language: Language;
  isLight?: boolean;
}> = ({ summary, language, isLight = false }) => {
  const isAr = language === 'ar';
  return (
    <span
      data-testid="network-reputation-pill"
      title={
        isAr
          ? 'نقاط التفاعل المجتمعي — مستقلة تماماً عن التحقق الرسمي للشهادات'
          : 'Community activity score — strictly separate from credential verification'
      }
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
        isLight
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      }`}
    >
      <Award className="h-3 w-3 shrink-0" aria-hidden="true" />
      {isAr
        ? `${summary.tierAr} · ${summary.recognitionScore} نقطة`
        : `${summary.tierEn} · ${summary.recognitionScore} pts`}
    </span>
  );
};

/**
 * Mandatory disclosure badge on every AI-generated or AI-assisted post/reply/summary.
 */
export const AiGeneratedBadge: React.FC<{
  language: Language;
  isLight?: boolean;
}> = ({ language, isLight = false }) => {
  const isAr = language === 'ar';
  return (
    <span
      data-testid="network-ai-badge"
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
        isLight
          ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800'
          : 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200'
      }`}
    >
      <Sparkles className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      {isAr ? 'مُولَّد بالذكاء الاصطناعي' : 'AI-Generated'}
    </span>
  );
};
