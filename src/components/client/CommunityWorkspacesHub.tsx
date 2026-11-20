import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Award,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  Globe2,
  LogIn,
  MapPin,
  MessageSquarePlus,
  Pin,
  Radio,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  AttendanceLog,
  ClientAccount,
  ClientRequest,
  CommunityAvailabilityStatus,
  CommunityConnection,
  CommunityNdtMethod,
  CommunityOpportunity,
  CommunityPost,
  CommunityPostType,
  CommunityWorkspaceProfile,
  CompanyRecord,
} from '../../client/types';
import {
  connectWithCommunityMember,
  createCommunityPost,
  endorseMemberWorkspace,
  upsertCommunityWorkspace,
} from '../../client/firestoreClientService';
import { runCommunityAssist, runSiteManagerAgent } from '../../ai/agentsClient';
import type { SiteManagerResponse } from '../../ai/agentsContract';
import {
  consumePendingPostDraft,
  dispatchOpenAiDock,
  getSiteTelemetrySnapshot,
  INSCO_APPLY_POST_DRAFT_EVENT,
  type PostDraftDetail,
} from '../../ai/telemetryStore';
import { InscoCommunityFeedCard } from '../community/InscoCommunityFeedCard';
import { InscoCommunityOpportunitiesBoard } from '../community/InscoCommunityOpportunitiesBoard';

type CommunityHubTab = 'feed' | 'network' | 'opportunities' | 'profile';

interface CommunityWorkspacesHubProps {
  language: Language;
  user: User | null;
  account: ClientAccount | null;
  myProfile: CommunityWorkspaceProfile | null;
  directoryProfiles: CommunityWorkspaceProfile[];
  companies: CompanyRecord[];
  posts?: CommunityPost[];
  opportunities?: CommunityOpportunity[];
  connections?: CommunityConnection[];
  requests?: ClientRequest[];
  attendanceLogs?: AttendanceLog[];
  isAdmin?: boolean;
  onRequireSignIn?: () => void;
  onOpenCompanies: () => void;
  onOpenTimeClock: () => void;
}

const NDT_METHOD_OPTIONS: CommunityNdtMethod[] = [
  'GENERAL',
  'RT',
  'UT',
  'PAUT',
  'MT',
  'PT',
  'VT',
  'PWHT',
  'AR',
];

const AVAILABILITY_LABELS: Record<
  CommunityAvailabilityStatus,
  { ar: string; en: string }
> = {
  active_field: { ar: 'في مهمة ميدانية حالياً', en: 'Active in Field' },
  open_to_work: { ar: 'متاح للتوظيف / التعاقد', en: 'Open to Work' },
  hiring: { ar: 'نبحث عن مفتشين / كوادر', en: 'Hiring Inspectors' },
  offering_services: { ar: 'نقدم خدمات فحص ومعالجة', en: 'Offering NDT/PWHT Services' },
};

export const CommunityWorkspacesHub: React.FC<CommunityWorkspacesHubProps> = ({
  language,
  user,
  account,
  myProfile,
  directoryProfiles,
  companies,
  posts = [],
  opportunities = [],
  connections = [],
  isAdmin = false,
  onRequireSignIn,
  onOpenCompanies,
  onOpenTimeClock,
}) => {
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<CommunityHubTab>('feed');

  // LinkedIn Profile Editor State
  const [displayName, setDisplayName] = useState(
    myProfile?.displayName || account?.fullName || user?.displayName || ''
  );
  const [headline, setHeadline] = useState(
    myProfile?.headline || account?.jobTitle || ''
  );
  const [organizationName, setOrganizationName] = useState(
    myProfile?.organizationName ||
      account?.organizationName ||
      (companies[0] ? (isAr ? companies[0].nameAr : companies[0].nameEn) : '')
  );
  const [sector, setSector] = useState(
    myProfile?.sector || account?.sector || 'NDT & Industrial Inspection'
  );
  const [city, setCity] = useState(myProfile?.city || account?.cityGovernorate || 'Cairo, Egypt');
  const [companyCode, setCompanyCode] = useState(
    myProfile?.companyCode || account?.assignedCompanyCode || companies[0]?.companyCode || ''
  );
  const [certifications, setCertifications] = useState(
    myProfile?.certifications || 'ASNT NDT Level II/III · ISO 9712 · ASME Sec V'
  );
  const [yearsExperience, setYearsExperience] = useState<number>(
    myProfile?.yearsExperience ?? 5
  );
  const [availabilityStatus, setAvailabilityStatus] = useState<CommunityAvailabilityStatus>(
    myProfile?.availabilityStatus ?? 'active_field'
  );
  const [specialtyTrades, setSpecialtyTrades] = useState(
    myProfile?.specialtyTrades || 'RT, UT, PAUT, PWHT, QA/QC'
  );
  const [bio, setBio] = useState(myProfile?.bio || '');
  const [isPublished, setIsPublished] = useState(myProfile?.isPublished ?? true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Feed Composer State
  const [postType, setPostType] = useState<CommunityPostType>('technical_case');
  const [ndtMethod, setNdtMethod] = useState<CommunityNdtMethod>('RT');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postTagsInput, setPostTagsInput] = useState('');
  const [technicalSnippet, setTechnicalSnippet] = useState('');
  const [publishingPost, setPublishingPost] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [aiDrafting, setAiDrafting] = useState(false);

  // Feed Filters
  const [feedTypeFilter, setFeedTypeFilter] = useState<'all' | CommunityPostType>('all');
  const [feedMethodFilter, setFeedMethodFilter] = useState<'ALL' | CommunityNdtMethod>('ALL');
  const [feedSearch, setFeedSearch] = useState('');

  // Network Directory Filters & Actions
  const [networkSearch, setNetworkSearch] = useState('');
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [endorsedUids, setEndorsedUids] = useState<Record<string, boolean>>({});

  // Site Manager AI Agent Pulse State
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerReport, setManagerReport] = useState<SiteManagerResponse | null>(null);
  const [publishingAnnouncement, setPublishingAnnouncement] = useState(false);

  useEffect(() => {
    if (myProfile) {
      setDisplayName(myProfile.displayName);
      setHeadline(myProfile.headline || '');
      setOrganizationName(myProfile.organizationName);
      setSector(myProfile.sector);
      setCity(myProfile.city || '');
      setCompanyCode(myProfile.companyCode || '');
      setCertifications(myProfile.certifications || '');
      setYearsExperience(myProfile.yearsExperience ?? 5);
      setAvailabilityStatus(myProfile.availabilityStatus ?? 'active_field');
      setSpecialtyTrades(myProfile.specialtyTrades || '');
      setBio(myProfile.bio || '');
      setIsPublished(myProfile.isPublished);
    } else if (account || user) {
      setDisplayName(prev => prev || account?.fullName || user?.displayName || '');
      setHeadline(prev => prev || account?.jobTitle || '');
      setOrganizationName(prev => prev || account?.organizationName || '');
      setCompanyCode(prev => prev || account?.assignedCompanyCode || companies[0]?.companyCode || '');
    }
  }, [myProfile, account, user, companies]);

  // Listen for AI Copilot Draft Applications
  useEffect(() => {
    const applyDraft = (detail: PostDraftDetail) => {
      setActiveTab('feed');
      setPostType(detail.postType);
      const upperMethod = (detail.ndtMethod || 'GENERAL').toUpperCase();
      setNdtMethod(
        NDT_METHOD_OPTIONS.includes(upperMethod as CommunityNdtMethod)
          ? (upperMethod as CommunityNdtMethod)
          : 'GENERAL'
      );
      setPostTitle(detail.title);
      setPostBody(detail.body);
      setPostTagsInput((detail.tags || []).join(', '));
      setComposerNotice(
        isAr
          ? 'تم تعبئة مسودة المنشور من المساعد الذكي — راجعها ثم اضغط نشر.'
          : 'Draft loaded from AI Copilot — review and click Publish.'
      );
    };

    const pending = consumePendingPostDraft();
    if (pending) applyDraft(pending);

    const handler = (ev: Event) => {
      const custom = ev as CustomEvent<PostDraftDetail>;
      if (custom.detail) applyDraft(custom.detail);
    };
    window.addEventListener(INSCO_APPLY_POST_DRAFT_EVENT, handler);
    return () => window.removeEventListener(INSCO_APPLY_POST_DRAFT_EVENT, handler);
  }, [isAr]);

  const activeAuthorName =
    displayName.trim() ||
    account?.fullName ||
    user?.displayName ||
    (isAr ? 'مهندس INSCO' : 'INSCO Engineer');

  const activeAuthorOrg =
    organizationName.trim() ||
    account?.organizationName ||
    (companies[0] ? (isAr ? companies[0].nameAr : companies[0].nameEn) : 'INSCO Network');

  const connectedUidSet = useMemo(
    () => new Set(connections.map(c => c.toUid)),
    [connections]
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    setProfileErrorMsg(null);
    setProfileStatusMsg(null);
    if (displayName.trim().length < 2 || organizationName.trim().length < 2) {
      setProfileErrorMsg(
        isAr
          ? 'يرجى إدخال الاسم الكامل واسم الجهة/الشركة.'
          : 'Please enter your full name and organization name.'
      );
      return;
    }

    setSavingProfile(true);
    try {
      await upsertCommunityWorkspace(
        user,
        {
          displayName: displayName.trim(),
          headline: headline.trim(),
          organizationName: organizationName.trim(),
          sector: sector.trim() || 'Industrial NDT',
          city: city.trim(),
          companyCode: companyCode.trim(),
          certifications: certifications.trim(),
          yearsExperience: Number.isFinite(yearsExperience) ? yearsExperience : 0,
          availabilityStatus,
          specialtyTrades: specialtyTrades.trim(),
          bio: bio.trim(),
          companiesManaged: companies.length,
          isPublished,
        },
        myProfile
      );
      setProfileStatusMsg(
        isAr
          ? 'تم حفظ ملفك المهني في مجتمع INSCO بنجاح.'
          : 'Your INSCO Community LinkedIn profile has been updated.'
      );
    } catch (err) {
      setProfileErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleComposerAiAssist = async (
    action: 'draft_from_topic' | 'enhance_post' | 'code_check'
  ) => {
    setComposerError(null);
    setComposerNotice(null);
    const seedText =
      postBody.trim() ||
      postTitle.trim() ||
      (isAr
        ? `مشاركة حالة فحص هندسية باستخدام تقنية ${ndtMethod} وفق معيار ASME Sec V`
        : `Technical field inspection insight using ${ndtMethod} under ASME Sec V`);
    setAiDrafting(true);
    try {
      const res = await runCommunityAssist({
        action,
        language,
        ndtMethod,
        title: postTitle.trim() || undefined,
        body: seedText,
      });
      if (action === 'code_check') {
        setTechnicalSnippet(res.technicalSnippet || res.reply.slice(0, 560));
        setComposerNotice(res.reply);
      } else {
        if (res.title) setPostTitle(res.title);
        if (res.body) setPostBody(res.body);
        else if (res.reply) setPostBody(res.reply);
        if (res.tags && res.tags.length > 0) setPostTagsInput(res.tags.join(', '));
        if (res.technicalSnippet) setTechnicalSnippet(res.technicalSnippet);
        setComposerNotice(
          isAr ? 'تم إنشاء الصياغة الهندسية عبر Gemini AI.' : 'Draft refined by INSCO AI.'
        );
      }
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiDrafting(false);
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    setComposerError(null);
    setComposerNotice(null);
    if (postTitle.trim().length < 3 || postBody.trim().length < 8) {
      setComposerError(
        isAr
          ? 'يرجى كتابة عنوان واضح ومحتوى تقني لا يقل عن 8 أحرف.'
          : 'Please provide a clear title and at least 8 characters of post content.'
      );
      return;
    }

    const tags = postTagsInput
      .split(/[,\s]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
      .slice(0, 6);

    setPublishingPost(true);
    try {
      await createCommunityPost(user, {
        authorName: activeAuthorName,
        authorHeadline: headline.trim() || undefined,
        authorOrg: activeAuthorOrg,
        authorCompanyCode: companyCode.trim() || undefined,
        postType,
        ndtMethod,
        title: postTitle.trim(),
        body: postBody.trim(),
        tags,
        technicalSnippet: technicalSnippet.trim() || undefined,
        visibility: 'public',
        isPinnedAnnouncement: isAdmin && postType === 'announcement',
      });
      setPostTitle('');
      setPostBody('');
      setPostTagsInput('');
      setTechnicalSnippet('');
      setComposerNotice(
        isAr ? 'تم نشر منشورك في مجتمع INSCO بنجاح.' : 'Post published to INSCO Community.'
      );
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishingPost(false);
    }
  };

  const handleConnectMember = async (member: CommunityWorkspaceProfile) => {
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    if (connectingUid || member.uid === user.uid) return;
    setConnectingUid(member.uid);
    try {
      await connectWithCommunityMember(user, activeAuthorName, {
        uid: member.uid,
        displayName: member.displayName,
      });
    } finally {
      setConnectingUid(null);
    }
  };

  const handleEndorseMember = async (member: CommunityWorkspaceProfile) => {
    if (!user) {
      onRequireSignIn?.();
      return;
    }
    if (endorsedUids[member.uid] || member.uid === user.uid) return;
    setEndorsedUids(prev => ({ ...prev, [member.uid]: true }));
    try {
      await endorseMemberWorkspace(member.uid);
    } catch {
      setEndorsedUids(prev => ({ ...prev, [member.uid]: false }));
    }
  };

  const handleRunSiteManagerPulse = async (
    mode: 'executive_audit' | 'moderate_community' | 'draft_announcement'
  ) => {
    setManagerLoading(true);
    setManagerError(null);
    try {
      const telemetry = getSiteTelemetrySnapshot();
      const res = await runSiteManagerAgent({
        instruction:
          mode === 'moderate_community'
            ? isAr
              ? 'راجع منشورات المجتمع وحدد أي منشورات تحتاج متابعة إدارية أو تثبيت.'
              : 'Audit recent community posts, identify items needing moderation or pinning.'
            : mode === 'draft_announcement'
              ? isAr
                ? 'صُغ إعلاناً رسمياً احترافياً من إدارة INSCO للمجتمع الهندسي حول السلامة وجودة الاختبارات.'
                : 'Draft an official INSCO Management announcement for the engineering community.'
              : isAr
                ? 'قدم ملخصاً تنفيذياً لإدارة الموقع والمجتمع وطلبات العملاء وتنبيهات الجيوفينس.'
                : 'Provide an executive brief covering site operations, client requests, geofence alerts, and community activity.',
        language,
        mode,
        telemetry,
      });
      setManagerReport(res);
    } catch (err) {
      setManagerError(err instanceof Error ? err.message : String(err));
    } finally {
      setManagerLoading(false);
    }
  };

  const handlePublishAiAnnouncement = async () => {
    if (!user || !isAdmin || !managerReport?.announcementDraft) return;
    setPublishingAnnouncement(true);
    try {
      await createCommunityPost(user, {
        authorName: activeAuthorName,
        authorHeadline: isAr ? 'إدارة عمليات INSCO' : 'INSCO Site Management',
        authorOrg: 'INSCO Operations',
        postType: 'announcement',
        ndtMethod: (NDT_METHOD_OPTIONS.includes(
          managerReport.announcementDraft.ndtMethod as CommunityNdtMethod
        )
          ? managerReport.announcementDraft.ndtMethod
          : 'GENERAL') as CommunityNdtMethod,
        title: managerReport.announcementDraft.title,
        body: managerReport.announcementDraft.body,
        tags: ['INSCO', 'Official'],
        visibility: 'public',
        isPinnedAnnouncement: true,
      });
      setActiveTab('feed');
    } finally {
      setPublishingAnnouncement(false);
    }
  };

  const filteredPosts = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return posts.filter(p => {
      if (feedTypeFilter !== 'all' && p.postType !== feedTypeFilter) return false;
      if (feedMethodFilter !== 'ALL' && p.ndtMethod !== feedMethodFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.authorOrg.toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    });
  }, [posts, feedTypeFilter, feedMethodFilter, feedSearch]);

  const filteredDirectory = useMemo(() => {
    const q = networkSearch.trim().toLowerCase();
    if (!q) return directoryProfiles;
    return directoryProfiles.filter(profile => {
      return (
        profile.organizationName.toLowerCase().includes(q) ||
        profile.displayName.toLowerCase().includes(q) ||
        (profile.headline ?? '').toLowerCase().includes(q) ||
        (profile.certifications ?? '').toLowerCase().includes(q) ||
        profile.sector.toLowerCase().includes(q) ||
        (profile.city ?? '').toLowerCase().includes(q) ||
        (profile.specialtyTrades ?? '').toLowerCase().includes(q)
      );
    });
  }, [directoryProfiles, networkSearch]);

  const openOpportunities = useMemo(
    () => opportunities.filter(o => o.status === 'open').slice(0, 3),
    [opportunities]
  );

  const suggestedMembers = useMemo(
    () =>
      directoryProfiles
        .filter(m => m.uid !== user?.uid && !connectedUidSet.has(m.uid))
        .slice(0, 4),
    [directoryProfiles, user?.uid, connectedUidSet]
  );

  return (
    <div data-testid="community-workspaces-hub" className="space-y-5">
      {/* Top LinkedIn + Facebook Hybrid Hero Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isAr
                ? 'مجتمع INSCO الهندسي · شبكة مهنية تفاعلية مدعومة بـ AI'
                : 'INSCO Engineering Community · LinkedIn + Facebook + Dual AI Hub'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {isAr
              ? 'منصة التواصل المهني لمفتشي ومهندسي الفحص غير التدميري والمعالجة الحرارية'
              : 'Professional NDT, PAUT & PWHT Social Network & Opportunity Exchange'}
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl">
            {isAr
              ? 'شارك دراسات الحالة الميدانية، تفاعل وعلّق مع الزملاء، استعن بالمساعد الذكي في صياغة التقارير والمنشورات، وتابع الوظائف والمناقصات وتنبيهات مدير الموقع الذكي.'
              : 'Share field cases, connect with certified inspectors, draft with Gemini AI Copilot, explore NDT jobs & tenders, and review Site Manager AI briefs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              dispatchOpenAiDock({
                agent: 'copilot',
                prompt: isAr
                  ? 'ساعدني في استخدام مجتمع INSCO وصياغة منشور تقني احترافي.'
                  : 'Help me craft a high-impact post in INSCO Community.',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-black text-white cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'اسأل المساعد الذكي' : 'Ask User Copilot'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenCompanies}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 px-3 py-2 text-xs font-bold text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>{isAr ? `شركاتي (${companies.length})` : `Companies (${companies.length})`}</span>
          </button>
          <button
            type="button"
            onClick={onOpenTimeClock}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 cursor-pointer whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'الحضور الميداني' : 'Time-Clock'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column LinkedIn + Facebook Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT RAIL (3 cols): Identity Profile Card & Hub Navigation */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4 space-y-3">
            {user ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white truncate">
                      {activeAuthorName}
                    </div>
                    <div className="text-xs text-cyan-300 font-semibold truncate">
                      {headline || (isAr ? 'مهندس / مشغّل فحص صناعي' : 'NDT / Industrial Specialist')}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {activeAuthorOrg}
                      {companyCode ? ` · ${companyCode}` : ''}
                    </div>
                  </div>
                  <Award className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                </div>

                {certifications && (
                  <div className="text-[11px] font-mono text-emerald-300 border-t border-slate-800 pt-2">
                    {certifications}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
                  <div className="rounded-lg bg-slate-950/70 p-2">
                    <div className="text-sm font-black text-white font-mono tabular-nums">
                      {connections.length}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'شبكة التواصل' : 'Connections'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-950/70 p-2">
                    <div className="text-sm font-black text-amber-400 font-mono tabular-nums">
                      {myProfile?.endorsementsCount ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'تزكيات المهارة' : 'Endorsements'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="text-sm font-black text-white">
                  {isAr ? 'تصفح مجتمع INSCO' : 'Guest Community View'}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? 'سجّل الدخول لنشر الحالات الفنية، التفاعل مع الزملاء، وبناء ملفك المهني (LinkedIn).'
                    : 'Sign in to publish field cases, react to peers, endorse skills, and post jobs.'}
                </p>
                {onRequireSignIn && (
                  <button
                    type="button"
                    onClick={onRequireSignIn}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Join Community'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Hub Navigation */}
            <nav aria-label={isAr ? 'أقسام مجتمع INSCO' : 'INSCO Community Sections'} className="space-y-1 pt-2 border-t border-slate-800">
              {(
                [
                  {
                    id: 'feed',
                    ar: 'ساحة المنشورات والنقاشات',
                    en: 'Community Feed',
                    Icon: MessageSquarePlus,
                    count: posts.length,
                  },
                  {
                    id: 'network',
                    ar: 'الشبكة المهنية (LinkedIn)',
                    en: 'Engineering Network',
                    Icon: Users,
                    count: directoryProfiles.length,
                  },
                  {
                    id: 'opportunities',
                    ar: 'الوظائف والمناقصات',
                    en: 'Jobs & Tenders',
                    Icon: BriefcaseBusiness,
                    count: opportunities.length,
                  },
                  {
                    id: 'profile',
                    ar: 'ملفي المهني والاعتمادات',
                    en: 'Edit My Profile',
                    Icon: Edit3,
                  },
                ] as Array<{
                  id: CommunityHubTab;
                  ar: string;
                  en: string;
                  Icon: typeof Users;
                  count?: number;
                }>
              ).map(tab => {
                const Icon = tab.Icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{isAr ? tab.ar : tab.en}</span>
                    </span>
                    {typeof tab.count === 'number' && (
                      <span className="font-mono tabular-nums text-[11px] opacity-85">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CENTER STREAM (6 cols): Feed + Composer / Network / Jobs / Profile */}
        <section className="lg:col-span-6 space-y-4">
          {activeTab === 'feed' && (
            <>
              {/* Rich Post Composer + Inline Gemini AI Co-Writer */}
              <form
                onSubmit={e => void handlePublishPost(e)}
                data-testid="community-post-composer"
                className="rounded-xl border border-slate-800 bg-slate-900/75 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-black text-white">
                    {isAr
                      ? 'شارك دراسة حالة، نقاشاً هندسياً، أو مناقصة فنية'
                      : 'Start a Technical Post, Case Study, or Discussion'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={aiDrafting}
                      onClick={() => void handleComposerAiAssist('draft_from_topic')}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      <span>{isAr ? 'صياغة بـ AI' : 'AI Draft'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={aiDrafting}
                      onClick={() => void handleComposerAiAssist('enhance_post')}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      <span>{isAr ? 'تحسين الأسلوب AI' : 'AI Polish'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={aiDrafting}
                      onClick={() => void handleComposerAiAssist('code_check')}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                      <span>{isAr ? 'مرجع الكود AI' : 'Add Code Ref'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <select
                    aria-label={isAr ? 'تصنيف المنشور' : 'Post Category'}
                    value={postType}
                    onChange={e => setPostType(e.target.value as CommunityPostType)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="technical_case">
                      {isAr ? 'دراسة حالة فنية (Technical Case)' : 'Technical Case Study'}
                    </option>
                    <option value="discussion">
                      {isAr ? 'نقاش هندسي (Discussion)' : 'Engineering Discussion'}
                    </option>
                    <option value="equipment_review">
                      {isAr ? 'تقييم معدات وأجهزة' : 'Equipment & Calibration Review'}
                    </option>
                    <option value="job_tender">
                      {isAr ? 'فرصة عمل / تعاقد' : 'Job / Inspection Tender'}
                    </option>
                    {isAdmin && (
                      <option value="announcement">
                        {isAr ? 'إعلان رسمي مثبت (إداري)' : 'Pinned Official Announcement'}
                      </option>
                    )}
                  </select>

                  <select
                    aria-label={isAr ? 'تخصص NDT' : 'NDT Method'}
                    value={ndtMethod}
                    onChange={e => setNdtMethod(e.target.value as CommunityNdtMethod)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300"
                  >
                    {NDT_METHOD_OPTIONS.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder={
                    isAr
                      ? 'عنوان المنشور أو المشكلة الهندسية...'
                      : 'Post headline (e.g. PAUT Sectorial Scan angle selection on 32mm P91 weld)...'
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />

                <textarea
                  rows={3}
                  value={postBody}
                  onChange={e => setPostBody(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اشرح الملاحظة الفنية، بارامترات الفحص، أو اكتب موضوعاً واضغط "صياغة بـ AI"...'
                      : 'Describe the inspection scenario, parameters, or write a quick topic and click AI Draft...'
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <input
                    type="text"
                    value={postTagsInput}
                    onChange={e => setPostTagsInput(e.target.value)}
                    placeholder={isAr ? 'وسوم: ASME, PAUT, RT (اختياري)' : 'Tags: ASME, PAUT, RT (optional)'}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={technicalSnippet}
                    onChange={e => setTechnicalSnippet(e.target.value)}
                    placeholder={
                      isAr ? 'مقتطف تقني: مثال SFD=650mm / Angle 60°' : 'Tech parameter snippet (optional)'
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-emerald-300"
                  />
                </div>

                {composerError && (
                  <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                    {composerError}
                  </div>
                )}
                {composerNotice && (
                  <div role="status" className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                    {composerNotice}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">
                    {user
                      ? isAr
                        ? `النشر باسم: ${activeAuthorName}`
                        : `Posting as ${activeAuthorName}`
                      : isAr
                        ? 'سجّل الدخول لنشر منشورك في الساحة'
                        : 'Sign in required to publish'}
                  </span>
                  <button
                    type="submit"
                    disabled={publishingPost}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {publishingPost
                        ? isAr
                          ? 'جاري النشر...'
                          : 'Publishing...'
                        : isAr
                          ? 'نشر في مجتمع INSCO'
                          : 'Publish Post'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Feed Filter & Search Controls */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', ar: 'الكل', en: 'All' },
                        { id: 'technical_case', ar: 'حالات فنية', en: 'Tech Cases' },
                        { id: 'discussion', ar: 'نقاشات', en: 'Discussions' },
                        { id: 'job_tender', ar: 'وظائف ومناقصات', en: 'Jobs' },
                        { id: 'equipment_review', ar: 'معدات', en: 'Equipment' },
                        { id: 'announcement', ar: 'إعلانات الإدارة', en: 'Official' },
                      ] as const
                    ).map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFeedTypeFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          feedTypeFilter === tab.id
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {isAr ? tab.ar : tab.en}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute start-2.5 top-2.5" aria-hidden="true" />
                    <input
                      type="search"
                      value={feedSearch}
                      onChange={e => setFeedSearch(e.target.value)}
                      placeholder={isAr ? 'بحث في المنشورات...' : 'Search feed...'}
                      className="w-full sm:w-44 rounded-lg border border-slate-700 bg-slate-950 ps-8 pe-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {(['ALL', ...NDT_METHOD_OPTIONS] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFeedMethodFilter(method)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer ${
                        feedMethodFilter === method
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Stream */}
              {filteredPosts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center space-y-3">
                  <Radio className="w-8 h-8 text-cyan-400 mx-auto" aria-hidden="true" />
                  <div className="text-sm font-black text-white">
                    {isAr
                      ? 'لا توجد منشورات مطابقة في الساحة حتى الآن'
                      : 'No matching community posts yet'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {isAr
                      ? 'ابدأ بنشر أول دراسة حالة فنية أو سؤال هندسي، أو دع المساعد الذكي يكتب مسودة جاهزة لك.'
                      : 'Publish the first NDT field case study or question, or let Gemini AI draft one for you in seconds.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleComposerAiAssist('draft_from_topic')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'اكتب أول منشور بالذكاء الاصطناعي' : 'Draft First Post with AI'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map(post => (
                    <InscoCommunityFeedCard
                      key={post.id}
                      language={language}
                      post={post}
                      user={user}
                      currentAuthorName={activeAuthorName}
                      currentAuthorHeadline={headline || undefined}
                      isAdmin={isAdmin}
                      onRequireSignIn={onRequireSignIn}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'network' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Globe2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>
                    {isAr
                      ? `شبكة المهندسين والشركات (${filteredDirectory.length})`
                      : `Engineering & Business Network (${filteredDirectory.length})`}
                  </span>
                </div>
                <input
                  type="search"
                  value={networkSearch}
                  onChange={e => setNetworkSearch(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث بالاسم، الاعتماد، الشركة أو المدينة...'
                      : 'Search name, ASNT cert, organization, or city...'
                  }
                  className="w-full sm:w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
              </div>

              {filteredDirectory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
                  {isAr
                    ? 'لا توجد ملفات مهنية منشورة مطابقة حالياً.'
                    : 'No published professional profiles match your filter yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDirectory.map(member => {
                    const isSelf = Boolean(user && user.uid === member.uid);
                    const isConnected = connectedUidSet.has(member.uid);
                    const avail = member.availabilityStatus
                      ? AVAILABILITY_LABELS[member.availabilityStatus]
                      : null;
                    return (
                      <div
                        key={member.uid}
                        className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-white truncate">
                                {member.displayName}
                              </div>
                              <div className="text-xs text-cyan-300 font-semibold truncate">
                                {member.headline || member.organizationName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {member.organizationName}
                              </div>
                            </div>
                            {member.companyCode && (
                              <span className="rounded border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 shrink-0">
                                {member.companyCode}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-emerald-300 font-semibold">
                            {member.sector}
                            {typeof member.yearsExperience === 'number'
                              ? ` · ${member.yearsExperience} ${isAr ? 'سنة خبرة' : 'yrs exp'}`
                              : ''}
                          </div>

                          {member.certifications && (
                            <div className="text-[11px] font-mono text-amber-300">
                              {member.certifications}
                            </div>
                          )}

                          {avail && (
                            <div className="text-[11px] text-slate-300">
                              {isAr ? avail.ar : avail.en}
                            </div>
                          )}

                          {member.bio && (
                            <p className="text-xs text-slate-300 line-clamp-2">{member.bio}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" aria-hidden="true" />
                              {member.city || '-'}
                            </span>
                            <span className="font-mono tabular-nums">
                              {member.endorsementsCount ?? 0} {isAr ? 'تزكية' : 'endorsements'}
                            </span>
                          </div>

                          {!isSelf && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isConnected || connectingUid === member.uid}
                                onClick={() => void handleConnectMember(member)}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                                  isConnected
                                    ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                              >
                                {isConnected ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>{isAr ? 'متصل' : 'Connected'}</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>{isAr ? 'تواصل' : 'Connect'}</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(endorsedUids[member.uid])}
                                onClick={() => void handleEndorseMember(member)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-400 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 cursor-pointer disabled:opacity-50"
                              >
                                <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                                <span>{isAr ? 'تزكية' : 'Endorse'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'opportunities' && (
            <InscoCommunityOpportunitiesBoard
              language={language}
              user={user}
              authorName={activeAuthorName}
              authorOrg={activeAuthorOrg}
              companyCode={companyCode || undefined}
              opportunities={opportunities}
              onRequireSignIn={onRequireSignIn}
            />
          )}

          {activeTab === 'profile' && (
            <form
              onSubmit={e => void handleSaveProfile(e)}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white">
                  {isAr
                    ? 'ملفك المهني على مجتمع INSCO (بيانات مهنية بدون معلومات حساسة)'
                    : 'Your INSCO LinkedIn Engineering Profile (Zero-PII)'}
                </h3>
                <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>{isAr ? 'نشر في دليل المجتمع' : 'Publish in Directory'}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'الاسم المهني *' : 'Display Name *'}</span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'المسمى المهني (Headline)' : 'Professional Headline'}</span>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder={isAr ? 'مثال: Senior PAUT & RT Level III Inspector' : 'e.g. Senior PAUT / RT Level III Inspector'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'اسم الشركة / الجهة *' : 'Organization *'}</span>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={e => setOrganizationName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'القطاع / التخصص *' : 'Industry Sector *'}</span>
                  <input
                    type="text"
                    required
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'الاعتمادات والشهادات (ASNT / ISO)' : 'Certifications (ASNT / ISO)'}</span>
                  <input
                    type="text"
                    value={certifications}
                    onChange={e => setCertifications(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-emerald-300 font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'سنوات الخبرة' : 'Years Experience'}</span>
                  <input
                    type="number"
                    min={0}
                    max={65}
                    value={yearsExperience}
                    onChange={e => setYearsExperience(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'حالة التوافر المهني' : 'Availability Status'}</span>
                  <select
                    value={availabilityStatus}
                    onChange={e => setAvailabilityStatus(e.target.value as CommunityAvailabilityStatus)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {isAr ? v.ar : v.en}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'المدينة / نطاق العمل' : 'City / Region'}</span>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'الكود التعريفي للشركة' : 'Company Code'}</span>
                  <input
                    type="text"
                    value={companyCode}
                    onChange={e => setCompanyCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 block">{isAr ? 'المهارات والتكنيكات' : 'Technical Capabilities'}</span>
                  <input
                    type="text"
                    value={specialtyTrades}
                    onChange={e => setSpecialtyTrades(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              <label className="block space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'نبذة مهنية ومشاريع بارزة' : 'Executive Summary & Projects'}</span>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </label>

              {profileErrorMsg && (
                <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {profileErrorMsg}
                </div>
              )}
              {profileStatusMsg && (
                <div role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileStatusMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {savingProfile
                      ? isAr
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                      : isAr
                        ? 'حفظ الملف المهني'
                        : 'Save Profile'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* RIGHT RAIL (3 cols): Site Manager AI Pulse + People & Jobs Discovery */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Site Manager AI Agent Executive Widget */}
          <div
            data-testid="site-manager-ai-pulse"
            className="rounded-xl border border-amber-500/35 bg-slate-900/80 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'وكيل إدارة الموقع AI' : 'Site Manager AI'}</span>
              </div>
              {managerReport && (
                <span className="font-mono text-[10px] font-bold text-emerald-300">
                  {managerReport.healthStatus}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isAr
                ? 'وكيل إداري ذكي يراقب جودة منشورات المجتمع، طلبات العملاء، وتنبيهات الجيوفينس ويصوغ الإعلانات الرسمية.'
                : 'Executive AI Director monitoring community moderation, client requests, geofence alerts & announcements.'}
            </p>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                disabled={managerLoading}
                onClick={() => void handleRunSiteManagerPulse('executive_audit')}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-3 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {managerLoading
                    ? isAr
                      ? 'جاري الفحص الشامل...'
                      : 'Running Audit...'
                    : isAr
                      ? 'تشغيل تقرير إدارة الموقع'
                      : 'Run Site Manager Audit'}
                </span>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={managerLoading}
                  onClick={() => void handleRunSiteManagerPulse('moderate_community')}
                  className="rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 px-2 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                >
                  {isAr ? 'فحص المنشورات' : 'Audit Posts'}
                </button>
                <button
                  type="button"
                  disabled={managerLoading}
                  onClick={() => void handleRunSiteManagerPulse('draft_announcement')}
                  className="rounded-lg border border-slate-700 bg-slate-950 hover:border-amber-400 px-2 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                >
                  {isAr ? 'صياغة إعلان' : 'Draft Notice'}
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  dispatchOpenAiDock({
                    agent: 'manager',
                  })
                }
                className="text-[11px] font-semibold text-cyan-400 hover:underline text-center pt-0.5 cursor-pointer"
              >
                {isAr ? 'فتح غرفة تحكم الوكيل الإداري ←' : 'Open Full Manager Console →'}
              </button>
            </div>

            {managerError && (
              <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
                {managerError}
              </div>
            )}

            {managerReport && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/85 p-3 space-y-2 text-xs">
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                  {managerReport.summary}
                </p>
                {managerReport.priorityActions.slice(0, 3).map((act, idx) => (
                  <div key={idx} className="border-t border-slate-800 pt-1.5 text-[11px]">
                    <div className="font-bold text-amber-300">{act.title}</div>
                    <div className="text-slate-400">{act.detail}</div>
                  </div>
                ))}
                {managerReport.announcementDraft && isAdmin && (
                  <button
                    type="button"
                    disabled={publishingAnnouncement}
                    onClick={() => void handlePublishAiAnnouncement()}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                  >
                    <Pin className="w-3 h-3" aria-hidden="true" />
                    <span>
                      {isAr ? 'نشر وتثبيت الإعلان المقترح' : 'Publish Pinned AI Announcement'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* People You May Know */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-white">
              <span>{isAr ? 'خبراء ومهندسون مقترحون' : 'Suggested Peers'}</span>
              <button
                type="button"
                onClick={() => setActiveTab('network')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline cursor-pointer"
              >
                {isAr ? 'عرض الكل' : 'See all'}
              </button>
            </div>
            {suggestedMembers.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'انضم الآن بدعوة مهندسي شركتك لتوسيع شبكة التواصل.'
                  : 'Invite inspectors from your project teams to grow the network.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {suggestedMembers.map(m => (
                  <div
                    key={m.uid}
                    className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{m.displayName}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {m.headline || m.organizationName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleConnectMember(m)}
                      className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300 cursor-pointer shrink-0"
                    >
                      {isAr ? 'تواصل' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Jobs & Tenders Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-white">
              <span>{isAr ? 'فرص ومناقصات مفتوحة' : 'Open Opportunities'}</span>
              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className="text-[11px] font-semibold text-amber-400 hover:underline cursor-pointer"
              >
                {isAr ? 'البوابة الكاملة' : 'Board'}
              </button>
            </div>
            {openOpportunities.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'لا توجد فرص مفتوحة حالياً — يمكنك نشر فرصة من تبويب الوظائف.'
                  : 'No open postings right now — publish one from the Jobs & Tenders tab.'}
              </p>
            ) : (
              <div className="space-y-2">
                {openOpportunities.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setActiveTab('opportunities')}
                    className="w-full text-start rounded-lg border border-slate-800 bg-slate-950/70 hover:border-amber-400/50 p-2.5 space-y-0.5 cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white line-clamp-1">{o.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {o.authorOrg} · {o.location}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400">
                      {o.methods.join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
