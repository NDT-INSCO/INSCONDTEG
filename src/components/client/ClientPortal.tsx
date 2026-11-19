import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Clock,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import type { Language } from '../../types';
import type { ClientSectionId } from '../../utils/portalRoutes';
import type {
  AttendanceLog,
  ClientAccount,
  ClientRequest,
  CommunityWorkspaceProfile,
  CompanyEmployee,
  CompanyInspectionReport,
  CompanyRecord,
} from '../../client/types';
import {
  isPortalFirestoreReady,
  isVerifiedAdminUser,
  observeClientPortalAuth,
  signInClientPortalWithGoogle,
  signOutClientPortal,
  subscribeAllClientAccounts,
  subscribeClientRequests,
  subscribeCommunityWorkspaces,
  subscribeCompanies,
  subscribeCompanyAttendance,
  subscribeCompanyEmployees,
  subscribeCompanyReports,
  subscribeMyClientAccount,
  subscribeMyCommunityWorkspace,
  updateEmployeeLiveLocation,
} from '../../client/firestoreClientService';
import { ClientErrorBoundary } from './ClientErrorBoundary';
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

export const ClientPortal: React.FC<ClientPortalProps> = ({
  language,
  section,
  companyId,
  onNavigateSection,
  onOpenCompanyPortal,
}) => {
  const isAr = language === 'ar';
  const firebaseReady = isPortalFirestoreReady();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [myAccount, setMyAccount] = useState<ClientAccount | null>(null);
  const [allAccounts, setAllAccounts] = useState<ClientAccount[]>([]);
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
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);

  if (runtimeError) {
    throw runtimeError;
  }

  const isAdmin = useMemo(() => isVerifiedAdminUser(user), [user]);

  useEffect(() => {
    const unsub = observeClientPortalAuth(current => {
      setUser(current);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady || !user || !firebaseReady) {
      setMyAccount(null);
      setAllAccounts([]);
      setRequests([]);
      setCompanies([]);
      setMyCommunityProfile(null);
      setCommunityDirectory([]);
      return;
    }

    setLoadingData(true);
    const unsubAccount = subscribeMyClientAccount(user.uid, setMyAccount, setRuntimeError);
    const unsubMyCommunity = subscribeMyCommunityWorkspace(
      user.uid,
      setMyCommunityProfile,
      setRuntimeError
    );
    const unsubDirectory = subscribeCommunityWorkspaces(
      isAdmin,
      setCommunityDirectory,
      setRuntimeError
    );
    const unsubRequests = subscribeClientRequests(
      user.uid,
      isAdmin,
      data => {
        setRequests(data);
        setLoadingData(false);
      },
      setRuntimeError
    );
    const unsubCompanies = subscribeCompanies(
      user.uid,
      isAdmin,
      data => {
        setCompanies(data);
        setLoadingData(false);
      },
      setRuntimeError
    );
    const unsubAllAccounts = isAdmin
      ? subscribeAllClientAccounts(setAllAccounts, setRuntimeError)
      : () => {};

    return () => {
      unsubAccount();
      unsubMyCommunity();
      unsubDirectory();
      unsubRequests();
      unsubCompanies();
      unsubAllAccounts();
    };
  }, [authReady, user, isAdmin, firebaseReady]);

  const activeCompany = useMemo(
    () => (companyId ? companies.find(c => c.id === companyId) ?? null : null),
    [companies, companyId]
  );

  const trackedCompanyId = useMemo(
    () => activeCompany?.id || selectedWorkforceCompanyId || companies[0]?.id || '',
    [activeCompany?.id, selectedWorkforceCompanyId, companies]
  );

  useEffect(() => {
    if (!authReady || !user || !activeCompany) {
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
      err => {
        setReportsLoading(false);
        setRuntimeError(err);
      }
    );
  }, [authReady, user, activeCompany, isAdmin]);

  useEffect(() => {
    if (!authReady || !user || !trackedCompanyId) {
      setActiveCompanyEmployees([]);
      setActiveCompanyAttendance([]);
      return;
    }
    const unsubEmps = subscribeCompanyEmployees(
      trackedCompanyId,
      user.uid,
      isAdmin,
      setActiveCompanyEmployees,
      setRuntimeError
    );
    const unsubAtt = subscribeCompanyAttendance(
      trackedCompanyId,
      user.uid,
      isAdmin,
      setActiveCompanyAttendance,
      setRuntimeError
    );
    return () => {
      unsubEmps();
      unsubAtt();
    };
  }, [authReady, user, trackedCompanyId, isAdmin]);

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

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInClientPortalWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

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
    <ClientErrorBoundary language={language}>
      <div data-testid="client-portal-root" className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!user ? (
          /* Unauthenticated Sign-In & Onboarding Landing View */
          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
                  <BriefcaseBusiness className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'بوابة عملاء وملفات إنسكو' : 'INSCO Client & Dossier Portal'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {isAr
                    ? 'بوابة طلبات العملاء، أرشيف الشركات المكوّد، وملفات التقارير'
                    : 'Client Requests, Coded Company Archive & Inspection Dossiers'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isAr
                    ? 'سجّل دخولك عبر Google لإنشاء حساب جهة أو متابعة طلبات الاختبار الجديدة، واستعراض ملف شركتك برقمها الكودي وأرشيف تقارير الفحص والريبورتات الصادرة.'
                    : 'Sign in with Google to register your organization, submit and track NDT/PWHT testing requests, and access your company’s coded archive and inspection reports.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
                <div className="font-bold text-cyan-300">
                  {isAr ? '1. التسجيل وطلبات العملاء' : '1. Registration & Requests'}
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {isAr
                    ? 'تقديم طلبات الفحص والمعالجة الحرارية ومتابعة حالتها لحظياً.'
                    : 'Submit inspection scopes and monitor operations review status live.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
                <div className="font-bold text-emerald-300">
                  {isAr ? '2. أرشيف الشركات بالكود' : '2. Coded Company Archive'}
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {isAr
                    ? 'رقم كودي فريد لكل شركة قديمة أو جديدة لسهولة الفهرسة والأرشفة.'
                    : 'Unique Company Code assigned to every legacy and new client company.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
                <div className="font-bold text-amber-300">
                  {isAr ? '3. فايل الريبورتات والبيانات' : '3. Dedicated Report File'}
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {isAr
                    ? 'أرشفة تقارير الشركة قيد الاختبار وآلية إدخال بيانات الريبورتات الجديدة.'
                    : 'Archived reports repository plus modular data-entry report builder.'}
                </p>
              </div>
            </div>

            {authError && (
              <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                {authError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                data-testid="client-portal-google-signin"
                disabled={!firebaseReady || !authReady}
                onClick={() => void handleGoogleSignIn()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-3 text-sm font-black text-slate-950 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'تسجيل الدخول / التسجيل بحساب Google'
                    : 'Sign In / Register with Google'}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenCompanyPortal}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                {isAr ? 'العودة لبوابة الشركة' : 'Back to Corporate Portal'}
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated SaaS Workspace Canvas (Sidebar + Main Viewport) */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation (260px on lg+) */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {myAccount?.fullName || user.displayName || user.email}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      {user.email}
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
                  onClick={() => void signOutClientPortal()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </div>
            </aside>

            {/* Main Content Viewport */}
            <div className="flex-1 min-w-0 space-y-5">
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
                  {!myAccount && (
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
                  onOpenCompanies={() => onNavigateSection('companies')}
                  onOpenTimeClock={() => onNavigateSection('timeclock')}
                />
              )}

              {section === 'register' && (
                <ClientRegistrationSection
                  language={language}
                  user={user}
                  account={myAccount}
                  allAccounts={allAccounts}
                  companies={companies}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </ClientErrorBoundary>
  );
};
