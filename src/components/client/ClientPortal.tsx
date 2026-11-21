import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Clock,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import type { Language } from '../../types';
import type { ClientSectionId } from '../../utils/portalRoutes';
import type {
  AttendanceLog,
  ClientAccount,
  ClientRegistrationDraftInput,
  ClientRequest,
  CommunityConnection,
  CommunityOpportunity,
  CommunityPost,
  CommunityWorkspaceProfile,
  CompanyEmployee,
  CompanyInspectionReport,
  CompanyRecord,
} from '../../client/types';
import {
  createInitialCompanyFromRegistration,
  formatClientProfileError,
  formatFirebaseAuthError,
  isVerifiedAdminUser,
  saveClientRegistration,
  subscribeClientRequests,
  subscribeCommunityOpportunities,
  subscribeCommunityPosts,
  subscribeCommunityWorkspaces,
  subscribeCompanies,
  subscribeCompanyAttendance,
  subscribeCompanyEmployees,
  subscribeCompanyReports,
  subscribeMyClientAccount,
  subscribeMyCommunityWorkspace,
  subscribeMyConnections,
  updateEmployeeLiveLocation,
  type ClientProfileSaveResult,
} from '../../client/firestoreClientService';
import { sanitizeUpperCode } from '../../client/types';
import { publishSiteTelemetrySnapshot } from '../../ai/telemetryStore';
import { ClientErrorBoundary } from './ClientErrorBoundary';
import { ClientAuthOnboardingCard } from './ClientAuthOnboardingCard';
import { useSiteAccount } from '../../account/SiteAccountContext';
import { AccountVerificationCard } from '../account/AccountVerificationCard';
import { PrivateAccountReview } from '../account/PrivateAccountReview';
import { ClientCompaniesSection } from './ClientCompaniesSection';
import { ClientCompanyDossier } from './ClientCompanyDossier';
import { ClientRequestsSection } from './ClientRequestsSection';
import { ClientRegistrationSection } from './ClientRegistrationSection';
import { EmployeeTimeClockPortal } from './EmployeeTimeClockPortal';
import { CommunityWorkspacesHub } from './CommunityWorkspacesHub';

interface ClientPortalProps {
  language: Language;
  section: ClientSectionId;
  companyId?: string;
  onNavigateSection: (section: ClientSectionId, companyId?: string) => void;
  onOpenCompanyPortal: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = props => {
  const { user } = useSiteAccount();
  return (
    <ClientErrorBoundary key={user ? `client:${user.uid}` : 'signed-out'} language={props.language}>
      <ClientPortalContent {...props} />
    </ClientErrorBoundary>
  );
};

type PendingSaveState =
  | { status: 'idle' | 'saving' | 'saved' | 'existing' | 'creating-company' | 'company-failed' }
  | { status: 'failed'; error: unknown };

const ClientPortalContent: React.FC<ClientPortalProps> = ({
  language,
  section,
  companyId,
  onNavigateSection,
  onOpenCompanyPortal,
}) => {
  const isAr = language === 'ar';
  const {
    user, ready: authReady, available: firebaseReady, checking: checkingSession,
    verified: isVerifiedUser, action: verificationAction, notice: verificationNotice,
    draft: pendingDraft, onRegistrationReady, onDraftSaved, signOut: handleSignOut,
  } = useSiteAccount();
  const [draftSave, setDraftSave] = useState<PendingSaveState>({ status: 'idle' });
  const savingDraft = useRef(false);

  const [loadedAccount, setLoadedAccount] = useState<ClientAccount | null>();
  const [accountError, setAccountError] = useState<Error | null>(null);
  const [accountReadAttempt, setAccountReadAttempt] = useState(0);
  const myAccount = loadedAccount ?? null;
  const accountReady = loadedAccount !== undefined;
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [activeCompanyReports, setActiveCompanyReports] = useState<CompanyInspectionReport[]>([]);
  const [activeCompanyEmployees, setActiveCompanyEmployees] = useState<CompanyEmployee[]>([]);
  const [activeCompanyAttendance, setActiveCompanyAttendance] = useState<AttendanceLog[]>([]);
  const [selectedWorkforceCompanyId, setSelectedWorkforceCompanyId] = useState<string>('');
  const [myCommunityProfile, setMyCommunityProfile] = useState<CommunityWorkspaceProfile | null>(
    null
  );
  const [communityDirectory, setCommunityDirectory] = useState<CommunityWorkspaceProfile[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityOpportunities, setCommunityOpportunities] = useState<CommunityOpportunity[]>([]);
  const [myConnections, setMyConnections] = useState<CommunityConnection[]>([]);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState(false);
  const handleWorkspaceLoadError = useCallback(() => {
    setLoadingData(false);
    setWorkspaceLoadError(true);
  }, []);
  const isAdmin = isVerifiedUser && isVerifiedAdminUser(user);

  // Public + Authenticated INSCO Community streams
  useEffect(() => {
    if (!firebaseReady) {
      setCommunityDirectory([]);
      setCommunityPosts([]);
      setCommunityOpportunities([]);
      return;
    }
    const unsubDirectory = subscribeCommunityWorkspaces(
      isAdmin,
      setCommunityDirectory,
      () => {}
    );
    const unsubPosts = subscribeCommunityPosts(isAdmin, setCommunityPosts, () => {});
    const unsubOpps = subscribeCommunityOpportunities(setCommunityOpportunities, () => {});
    return () => {
      unsubDirectory();
      unsubPosts();
      unsubOpps();
    };
  }, [firebaseReady, isAdmin]);

  useEffect(() => {
    if (!user || !isVerifiedUser || !firebaseReady) return;
    setAccountError(null);
    return subscribeMyClientAccount(user.uid, setLoadedAccount, setAccountError);
  }, [user, isVerifiedUser, firebaseReady, accountReadAttempt]);

  useEffect(() => {
    if (!user || !isVerifiedUser || !firebaseReady) return;

    // Non-profile reads must not prevent customers from using their account
    // or saving their details (a missing index, for example, affects one list).
    setLoadingData(true);
    const unsubMyCommunity = subscribeMyCommunityWorkspace(
      user.uid,
      setMyCommunityProfile,
      handleWorkspaceLoadError
    );
    const unsubConnections = subscribeMyConnections(user.uid, setMyConnections, () => {});
    const unsubRequests = subscribeClientRequests(
      user.uid,
      isAdmin,
      data => {
        setRequests(data);
        setLoadingData(false);
      },
      handleWorkspaceLoadError
    );
    const unsubCompanies = subscribeCompanies(
      user.uid,
      isAdmin,
      data => {
        setCompanies(data);
        setLoadingData(false);
      },
      handleWorkspaceLoadError
    );
    return () => {
      unsubMyCommunity();
      unsubConnections();
      unsubRequests();
      unsubCompanies();
    };
  }, [user, isVerifiedUser, isAdmin, firebaseReady, handleWorkspaceLoadError]);

  // The global AI dock can run on any route. Never pass private account,
  // attendance or request data to its ambient telemetry.
  useEffect(() => {
    const posts = communityPosts.filter(post => post.visibility === 'public');
    publishSiteTelemetrySnapshot({
      communityPostsCount: posts.length,
      communityMembersCount: communityDirectory.filter(profile => profile.isPublished).length,
      opportunitiesCount: communityOpportunities.length,
      recentPosts: posts.slice(0, 8).map(p => ({
        id: p.id,
        title: p.title,
        ndtMethod: p.ndtMethod,
        postType: p.postType,
        authorOrg: p.authorOrg,
        excerpt: p.body.slice(0, 220),
        aiModerationStatus: p.aiModerationStatus,
      })),
    });
  }, [communityPosts, communityDirectory, communityOpportunities]);

  const finishPendingProfile = useCallback(async (
    input: ClientRegistrationDraftInput,
    result: ClientProfileSaveResult
  ) => {
    if (!user || !pendingDraft) return;
    onDraftSaved(user.uid);
    if (result === 'existing') {
      setDraftSave({ status: 'existing' });
      return;
    }

    if (result === 'created' && pendingDraft.autoCreateCompanyWorkspace && !sanitizeUpperCode(input.requestedCompanyCode ?? '')) {
      setDraftSave({ status: 'creating-company' });
      try {
        await createInitialCompanyFromRegistration(user, input);
      } catch {
        // The profile, including company contact/details, is already saved.
        // A separate dossier failure must not cause a retry of the profile.
        setDraftSave({ status: 'company-failed' });
        return;
      }
    }
    setDraftSave({ status: 'saved' });
  }, [user, pendingDraft, onDraftSaved]);

  const savePendingProfile = useCallback(async () => {
    if (!user || !isVerifiedUser || !pendingDraft || !accountReady || accountError || savingDraft.current) return;
    savingDraft.current = true;
    setDraftSave({ status: 'saving' });
    try {
      const result = myAccount ? 'existing' : await saveClientRegistration(user, pendingDraft, { createOnly: true });
      await finishPendingProfile(pendingDraft, result);
    } catch (error) {
      setDraftSave({ status: 'failed', error });
    } finally {
      savingDraft.current = false;
    }
  }, [user, isVerifiedUser, pendingDraft, accountReady, accountError, myAccount, finishPendingProfile]);

  useEffect(() => {
    if (draftSave.status === 'idle') void savePendingProfile();
  }, [draftSave.status, savePendingProfile]);

  const activeCompany = useMemo(
    () => (companyId ? companies.find(c => c.id === companyId) ?? null : null),
    [companies, companyId]
  );

  const trackedCompanyId = useMemo(
    () => activeCompany?.id || selectedWorkforceCompanyId || companies[0]?.id || '',
    [activeCompany?.id, selectedWorkforceCompanyId, companies]
  );

  useEffect(() => {
    if (!isVerifiedUser || !user || !activeCompany) {
      setActiveCompanyReports([]);
      setReportsLoading(false);
      return;
    }
    setReportsLoading(true);
    return subscribeCompanyReports(
      activeCompany.id,
      user.uid,
      isAdmin,
      data => {
        setActiveCompanyReports(data);
        setReportsLoading(false);
      },
      () => {
        setReportsLoading(false);
        handleWorkspaceLoadError();
      }
    );
  }, [isVerifiedUser, user, activeCompany, isAdmin, handleWorkspaceLoadError]);

  useEffect(() => {
    if (!isVerifiedUser || !user || !trackedCompanyId) {
      setActiveCompanyEmployees([]);
      setActiveCompanyAttendance([]);
      return;
    }
    const unsubEmps = subscribeCompanyEmployees(
      trackedCompanyId,
      user.uid,
      isAdmin,
      setActiveCompanyEmployees,
      handleWorkspaceLoadError
    );
    const unsubAtt = subscribeCompanyAttendance(
      trackedCompanyId,
      user.uid,
      isAdmin,
      setActiveCompanyAttendance,
      handleWorkspaceLoadError
    );
    return () => {
      unsubEmps();
      unsubAtt();
    };
  }, [isVerifiedUser, user, trackedCompanyId, isAdmin, handleWorkspaceLoadError]);

  const handleRequestEmployeeLocationUpdate = (emp: CompanyEmployee) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        void updateEmployeeLiveLocation(emp.companyId, emp.id, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }).finally(() => setUpdatingLocation(false));
      },
      () => {
        setUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const verificationError = verificationNotice?.status === 'error'
    ? formatFirebaseAuthError(verificationNotice.error, language)
    : null;
  const draftSaving = draftSave.status === 'saving' || Boolean(pendingDraft && draftSave.status === 'idle' && accountReady && !accountError);
  const awaitingSavedAccount = !myAccount && draftSave.status !== 'idle'
    && draftSave.status !== 'failed' && !draftSaving;

  const navItems: Array<{
    id: ClientSectionId;
    labelAr: string;
    labelEn: string;
    Icon: typeof LayoutDashboard;
    count?: number;
  }> = [
    { id: 'overview', labelAr: 'لوحة التحكم', labelEn: 'Overview', Icon: LayoutDashboard },
    {
      id: 'requests',
      labelAr: 'طلبات العملاء',
      labelEn: 'Client Requests',
      Icon: ClipboardList,
      count: requests.length,
    },
    {
      id: 'companies',
      labelAr: 'أرشيف الشركات والملفات',
      labelEn: 'Companies & Dossiers',
      Icon: Building2,
      count: companies.length,
    },
    {
      id: 'timeclock',
      labelAr: 'بوابة الحضور والانصراف',
      labelEn: 'Worker Time-Clock',
      Icon: Clock,
    },
    {
      id: 'community',
      labelAr: 'مجتمع إدارة الأعمال',
      labelEn: 'Business Community',
      Icon: Globe2,
      count: communityDirectory.length,
    },
    { id: 'register', labelAr: 'التسجيل وربط الكود', labelEn: 'Registration & Link', Icon: UserPlus },
  ];

  const activeTestingCount = useMemo(
    () => companies.filter(c => c.hasActiveTestingDossier).length,
    [companies]
  );
  const legacyCount = useMemo(
    () => companies.filter(c => c.archiveCategory === 'legacy_archive').length,
    [companies]
  );
  const totalReportsCount = useMemo(
    () => companies.reduce((sum, c) => sum + (c.reportsCount || 0), 0),
    [companies]
  );

  return (
    <div data-testid="client-portal-root" className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!authReady || checkingSession ? (
        <div role="status" className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-200">
          {isAr ? 'جاري التحقّق من جلسة العميل…' : 'Checking your client session…'}
        </div>
      ) : !user && section === 'community' && !guestAuthOpen ? (
        <CommunityWorkspacesHub
          language={language}
          user={null}
          account={null}
          myProfile={null}
          directoryProfiles={communityDirectory}
          companies={[]}
          posts={communityPosts}
          opportunities={communityOpportunities}
          connections={[]}
          isAdmin={false}
          onRequireSignIn={() => setGuestAuthOpen(true)}
          onOpenCompanies={() => setGuestAuthOpen(true)}
          onOpenTimeClock={() => setGuestAuthOpen(true)}
        />
      ) : !user ? (
        /* Unauthenticated Multi-Provider Sign-In & Complete Registration View */
        <div className="space-y-4">
          {guestAuthOpen && section === 'community' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGuestAuthOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-cyan-400 cursor-pointer"
              >
                {isAr ? 'العودة إلى مجتمع INSCO ←' : '← Back to INSCO Community'}
              </button>
            </div>
          )}
          <ClientAuthOnboardingCard
            key={section === 'register' ? 'register' : 'signin'}
            language={language}
            firebaseReady={firebaseReady}
            authReady={authReady}
            initialMode={section === 'register' ? 'register' : 'signin'}
            onOpenCompanyPortal={onOpenCompanyPortal}
            onRegistrationReady={onRegistrationReady}
          />
        </div>
      ) : !isVerifiedUser ? (
        <AccountVerificationCard language={language} client />
      ) : (
        /* Authenticated SaaS Workspace Canvas (Sidebar + Main Viewport) */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation (260px on lg+) */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {myAccount?.fullName || user.displayName || user.email || user.phoneNumber}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {user.email || user.phoneNumber}
                  </div>
                </div>
                {isAdmin && (
                  <span
                    title={isAr ? 'حساب إدارة العمليات' : 'Operations Admin'}
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 shrink-0"
                  >
                    ADMIN
                  </span>
                )}
              </div>

              {myAccount?.assignedCompanyCode && (
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-mono text-cyan-300">
                  {isAr ? 'كود الشركة: ' : 'Code: '}
                  <strong>{myAccount.assignedCompanyCode}</strong>
                </div>
              )}

              <nav aria-label={isAr ? 'تنقل بوابة العملاء' : 'Client Portal Navigation'} className="space-y-1">
                {navItems.map(item => {
                  const active = section === item.id;
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigateSection(item.id)}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                      </span>
                      {typeof item.count === 'number' && (
                        <span className="font-mono tabular-nums text-[11px] opacity-85">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <button
                type="button"
                disabled={Boolean(verificationAction)}
                onClick={() => void handleSignOut()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          </aside>

          {/* Main Content Viewport */}
          <div className="flex-1 min-w-0 space-y-5">
            {verificationError && (
              <p role="alert" className="rounded-lg border border-rose-500/40 p-3 text-xs text-rose-200">{verificationError}</p>
            )}
            {workspaceLoadError && (
              <p role="status" className="rounded-lg border border-amber-500/40 p-3 text-xs text-amber-200">
                {isAr ? 'تعذّر تحميل بعض قوائم البوابة. يمكنك متابعة استخدام ملفك الشخصي.' : 'Some portal lists could not be loaded. You can still use your profile.'}
              </p>
            )}
            {(section === 'register' || pendingDraft) && !accountReady && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
                {accountError ? (
                  <div role="alert" className="space-y-2 text-rose-200">
                    <p>{isAr ? 'تعذّر تحميل بيانات الحساب.' : 'Could not load your account.'} {formatClientProfileError(accountError, language)}</p>
                    <button type="button" className="font-bold text-cyan-300 underline" onClick={() => setAccountReadAttempt(n => n + 1)}>
                      {isAr ? 'أعد تحميل بيانات الحساب' : 'Retry loading account'}
                    </button>
                  </div>
                ) : (
                  <p role="status">{isAr ? 'بانتظار تحميل بيانات الحساب من قاعدة البيانات… تأكّد من اتصالك بالإنترنت.' : 'Waiting for your account data. Check your internet connection if this persists.'}</p>
                )}
              </div>
            )}
            {draftSaving && (
              <p role="status" className="rounded-lg border border-cyan-500/40 p-3 text-xs text-cyan-200">
                {isAr ? 'جاري حفظ بياناتك في الحساب…' : 'Saving your details to your account…'}
              </p>
            )}
            {draftSave.status === 'failed' && (
              <div role="alert" className="rounded-lg border border-rose-500/40 p-3 space-y-2 text-xs text-rose-200">
                <p>{isAr ? 'لم تُحفظ بياناتك في الحساب بعد. المسودة ما زالت موجودة.' : 'Your details have not been saved to your account. Your draft is still available.'} {formatClientProfileError(draftSave.error, language)}</p>
                {section !== 'register' && (
                  <button type="button" className="font-bold text-cyan-300 underline" onClick={() => onNavigateSection('register')}>
                    {isAr ? 'راجع المسودة وأعد الحفظ' : 'Review draft and retry saving'}
                  </button>
                )}
              </div>
            )}
            {(draftSave.status === 'saved' || draftSave.status === 'creating-company' || draftSave.status === 'company-failed') && (
              <div role="status" className="rounded-lg border border-emerald-500/40 p-3 space-y-1 text-xs text-emerald-200">
                <p>{isAr ? 'تم حفظ بياناتك الشخصية وبيانات الشركة في حسابك.' : 'Your personal and company details were saved to your account.'}</p>
                {draftSave.status === 'creating-company' && <p>{isAr ? 'جاري إنشاء ملف الشركة…' : 'Creating your company dossier…'}</p>}
                {draftSave.status === 'company-failed' && (
                  <p className="text-amber-200">
                    {isAr ? 'لم يُنشأ ملف التقارير المنفصل. يمكنك إنشاؤه من أرشيف الشركات.' : 'The separate company dossier could not be created. You can create it in Companies & Dossiers.'}
                  </p>
                )}
              </div>
            )}
            {draftSave.status === 'existing' && (
              <p role="status" className="rounded-lg border border-cyan-500/40 p-3 text-xs text-cyan-200">
                {isAr ? 'لديك ملف محفوظ بالفعل. لم نستبدله بمسودة التسجيل.' : 'Your profile already exists. It was not replaced with the registration draft.'}
              </p>
            )}
            {section === 'overview' && (
              <div className="space-y-5" data-testid="client-overview-section">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                      {isAdmin
                        ? isAr
                          ? 'مركز إدارة العملاء والملفات'
                          : 'Operations & Client Dossier Command'
                        : isAr
                          ? 'بوابة العميل الإلكترونية'
                          : 'Client Self-Service Workspace'}
                    </div>
                    <h1 className="text-xl font-black text-white mt-0.5">
                      {isAr ? 'لوحة متابعة الطلبات وأرشيف الشركات' : 'Client Requests & Company Dossiers Overview'}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateSection('timeclock')}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'بوابة الحضور والانصراف' : 'Worker Time-Clock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateSection('requests')}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 transition cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'طلب اختبار جديد' : 'New Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateSection('companies')}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'أرشيف الشركات والريبورتات' : 'Companies & Reports'}
                    </button>
                  </div>
                </div>

                {/* KPI Summary Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-xs text-slate-400">{isAr ? 'طلبات العملاء' : 'Client Requests'}</div>
                    <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                      {requests.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-xs text-slate-400">{isAr ? 'شركات قيد الاختبار' : 'Active Testing'}</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
                      {activeTestingCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-xs text-slate-400">{isAr ? 'أرشيف قديم' : 'Legacy Archive'}</div>
                    <div className="text-2xl font-black text-amber-400 font-mono tabular-nums mt-1">
                      {legacyCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-xs text-slate-400">{isAr ? 'إجمالي الريبورتات' : 'Total Reports'}</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono tabular-nums mt-1">
                      {totalReportsCount}
                    </div>
                  </div>
                </div>

                {/* Quick Prompt to Complete Registration if New Client */}
                {loadedAccount === null && !draftSaving && !awaitingSavedAccount && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">
                          {isAr
                            ? 'استكمل بيانات تسجيل شركتك في الموقع'
                            : 'Complete your organization registration'}
                        </div>
                        <div className="text-slate-300 mt-0.5">
                          {isAr
                            ? 'أضف اسم شركتك ورقم التواصل (أو الكود الخاص بكم) لتسهيل ربط ملف التقارير بحسابك.'
                            : 'Add your company name and phone (or existing Company Code) so operations can link your dossier.'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateSection('register')}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer shrink-0"
                    >
                      {isAr ? 'إكمال التسجيل الآن' : 'Register Organization'}
                    </button>
                  </div>
                )}

                {/* Active Testing Companies Quick Cards */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-white">
                      {isAr ? 'الشركات قيد الاختبار والملفات النشطة' : 'Active Testing Company Files'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => onNavigateSection('companies')}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      {isAr ? 'عرض الأرشيف الكامل ←' : 'View Full Archive →'}
                    </button>
                  </div>

                  {companies.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4">
                      {isAr
                        ? 'لا توجد ملفات شركات مرتبطة حالياً. انتقل إلى قسم "أرشيف الشركات والملفات" لبدء الإضافة.'
                        : 'No company files linked yet. Open Companies & Dossiers to add or request linking.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {companies.slice(0, 4).map(co => (
                        <button
                          key={co.id}
                          type="button"
                          onClick={() => onNavigateSection('companies', co.id)}
                          className="text-start rounded-lg border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 p-4 transition cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-mono">
                            <span className="font-bold text-cyan-300 tabular-nums">{co.companyCode}</span>
                            <span className="text-slate-400 tabular-nums">
                              {co.reportsCount ?? 0} {isAr ? 'تقرير' : 'reports'}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white line-clamp-1">
                            {isAr ? co.nameAr : co.nameEn}
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'فتح فايل التقارير والبيانات' : 'Open Dossier & Reports'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'requests' && (
              <ClientRequestsSection
                language={language}
                user={user}
                account={myAccount}
                requests={requests}
                companies={companies}
                isAdmin={isAdmin}
                loading={loadingData}
                onCompanyCreatedFromRequest={newCompanyId =>
                  onNavigateSection('companies', newCompanyId)
                }
              />
            )}

            {section === 'companies' && (
              activeCompany ? (
                <ClientCompanyDossier
                  language={language}
                  company={activeCompany}
                  reports={activeCompanyReports}
                  employees={activeCompanyEmployees}
                  attendanceLogs={activeCompanyAttendance}
                  reportsLoading={reportsLoading}
                  isAdmin={isAdmin}
                  currentUid={user.uid}
                  onBackToArchive={() => onNavigateSection('companies')}
                  onRequestEmployeeLocationUpdate={handleRequestEmployeeLocationUpdate}
                  isUpdatingEmployeeLocation={updatingLocation}
                  onOpenTimeClock={() => {
                    setSelectedWorkforceCompanyId(activeCompany.id);
                    onNavigateSection('timeclock');
                  }}
                />
              ) : companyId && loadingData ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3" aria-busy="true">
                  <div className="h-5 w-52 rounded bg-slate-800 animate-pulse" />
                  <div className="h-24 rounded-lg bg-slate-950/60 animate-pulse" />
                </div>
              ) : companyId && !loadingData ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                  <div className="text-sm font-black text-white">
                    {isAr
                      ? 'ملف الشركة غير متاح أو غير مرتبط بحسابك'
                      : 'Company dossier unavailable or not linked to your account'}
                  </div>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? `تعذر العثور على ملف للشركة بالمعرّف (${companyId}) ضمن صلاحيات الحساب الحالي.`
                      : `No accessible company dossier matched ID "${companyId}" under your signed-in account.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('companies')}
                    className="rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-cyan-300 transition cursor-pointer"
                  >
                    {isAr ? 'العودة إلى أرشيف الشركات' : 'Return to Companies Archive'}
                  </button>
                </div>
              ) : (
                <ClientCompaniesSection
                  language={language}
                  companies={companies}
                  loading={loadingData}
                  isAdmin={isAdmin}
                  currentUid={user.uid}
                  onOpenCompanyDossier={id => onNavigateSection('companies', id)}
                />
              )
            )}

            {section === 'timeclock' && (
              <EmployeeTimeClockPortal
                language={language}
                currentUid={user.uid}
                companies={companies}
                selectedCompanyId={trackedCompanyId}
                onSelectCompany={id => setSelectedWorkforceCompanyId(id)}
                employees={activeCompanyEmployees}
                attendanceLogs={activeCompanyAttendance}
                onCreateCompanyShortcut={() => onNavigateSection('companies')}
              />
            )}

            {section === 'community' && (
              <CommunityWorkspacesHub
                language={language}
                user={user}
                account={myAccount}
                myProfile={myCommunityProfile}
                directoryProfiles={communityDirectory}
                companies={companies}
                posts={communityPosts}
                opportunities={communityOpportunities}
                connections={myConnections}
                requests={requests}
                attendanceLogs={activeCompanyAttendance}
                isAdmin={isAdmin}
                onRequireSignIn={() => setGuestAuthOpen(true)}
                onOpenCompanies={() => onNavigateSection('companies')}
                onOpenTimeClock={() => onNavigateSection('timeclock')}
              />
            )}

            {section === 'register' && <PrivateAccountReview language={language} user={user} companies={companies} canLinkCompany={isAdmin} />}
            {section === 'register' && accountReady && !draftSaving && !awaitingSavedAccount && (
              <ClientRegistrationSection
                language={language}
                user={user}
                account={myAccount}
                pendingDraft={pendingDraft}
                onSaveDraft={pendingDraft && !myAccount ? input => onRegistrationReady(user, {
                  ...input, autoCreateCompanyWorkspace: pendingDraft.autoCreateCompanyWorkspace,
                }, false) : undefined}
                onSaved={pendingDraft ? finishPendingProfile : undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
