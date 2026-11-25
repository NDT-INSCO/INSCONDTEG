import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Globe,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityCompany,
  CommunityCompanyAffiliation,
  CommunityCompanyDepartment,
  CommunityFollow,
  CommunityWorkspaceProfile,
  OrgHierarchyRoleKey,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import {
  ORG_HIERARCHY_LEVELS,
  buildOrgTree,
  roleLabelForKey,
  type OrgDepartmentNode,
} from '../../network/networkTaxonomy';

interface NetworkCompaniesSectionProps {
  language: Language;
  selectedCompanyId?: string;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenCompanyPortal: () => void;
  onSelectCompany?: (companyId: string | undefined) => void;
}

export const NetworkCompaniesSection: React.FC<NetworkCompaniesSectionProps> = ({
  language,
  selectedCompanyId,
  onOpenAccount,
  onOpenProfile,
  onOpenCompanyPortal,
  onSelectCompany,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const [companies, setCompanies] = useState<CommunityCompany[]>([]);
  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [directory, setDirectory] = useState<CommunityWorkspaceProfile[]>([]);
  const [follows, setFollows] = useState<CommunityFollow[]>([]);
  const [myAffiliations, setMyAffiliations] = useState<CommunityCompanyAffiliation[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(selectedCompanyId ?? null);
  const [departments, setDepartments] = useState<CommunityCompanyDepartment[]>([]);
  const [affiliations, setAffiliations] = useState<CommunityCompanyAffiliation[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);

  // Company form
  const [compName, setCompName] = useState('');
  const [compNameAr, setCompNameAr] = useState('');
  const [compIndustry, setCompIndustry] = useState('NDT & Engineering Inspection');
  const [compHq, setCompHq] = useState('');
  const [compServices, setCompServices] = useState('RT, UT, PAUT, MT, PT, PWHT');
  const [compDesc, setCompDesc] = useState('');
  const [savingComp, setSavingComp] = useState(false);

  // Department builder form
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptRoleKey, setDeptRoleKey] = useState<OrgHierarchyRoleKey>('department_manager');
  const [deptCustomRole, setDeptCustomRole] = useState('');
  const [deptParentId, setDeptParentId] = useState('');
  const [deptManagerName, setDeptManagerName] = useState('');
  const [deptSpecialties, setDeptSpecialties] = useState('');
  const [deptServices, setDeptServices] = useState('');
  const [deptProjects, setDeptProjects] = useState('');
  const [deptOverview, setDeptOverview] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  // Affiliation invite form
  const [inviteUid, setInviteUid] = useState('');
  const [inviteRoleTitle, setInviteRoleTitle] = useState('NDT Level II Inspector');
  const [inviteDeptId, setInviteDeptId] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (selectedCompanyId) setActiveCompanyId(selectedCompanyId);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    const unsubs: Array<() => void> = [];

    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeCommunityCompanies(
          list => {
            if (!active) return;
            setCompanies(list);
            setLoading(false);
            if (!activeCompanyId && list.length > 0) {
              setActiveCompanyId(list[0].id);
            }
          },
          err => {
            if (active) {
              setError(err.message);
              setLoading(false);
            }
          }
        )
      );
      if (uid) {
        unsubs.push(
          api.subscribeMyFollows(
            uid,
            list => {
              if (active) setFollows(list);
            },
            () => {}
          )
        );
      }
    });

    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeCommunityWorkspaces(
          false,
          list => {
            if (active) setDirectory(list);
          },
          () => {}
        )
      );
      if (uid) {
        unsubs.push(
          api.subscribeMyCommunityWorkspace(
            uid,
            next => {
              if (active) setCard(next);
            },
            () => {}
          )
        );
      }
    });

    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [serviceReady, uid]);

  // Fetch my pending affiliation invites across known companies
  useEffect(() => {
    if (!serviceReady || !uid || companies.length === 0) return;
    let active = true;
    void import('../../client/networkPlatformService').then(async api => {
      const rows = await api.fetchUserAffiliationsAcrossCompanies(
        uid,
        companies.map(c => c.id)
      );
      if (active) setMyAffiliations(rows);
    });
    return () => {
      active = false;
    };
  }, [companies, serviceReady, uid]);

  // Subscribe active company departments + affiliations
  useEffect(() => {
    if (!serviceReady || !activeCompanyId) {
      setDepartments([]);
      setAffiliations([]);
      return;
    }
    let active = true;
    const unsubs: Array<() => void> = [];
    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeCompanyDepartments(
          activeCompanyId,
          list => {
            if (active) {
              setDepartments(list);
              if (list.length > 0 && !selectedDeptId) setSelectedDeptId(list[0].id);
            }
          },
          () => {}
        )
      );
      unsubs.push(
        api.subscribeCompanyAffiliations(
          activeCompanyId,
          list => {
            if (active) setAffiliations(list);
          },
          () => {}
        )
      );
    });
    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [activeCompanyId, serviceReady]);

  const activeCompany = useMemo(
    () => companies.find(c => c.id === activeCompanyId) ?? null,
    [activeCompanyId, companies]
  );

  const isCompanyOwner = Boolean(uid && activeCompany && activeCompany.ownerUid === uid);
  const canWrite = Boolean(uid && verified && card);
  const orgTree = useMemo(() => buildOrgTree(departments), [departments]);
  const selectedDept = useMemo(
    () => departments.find(d => d.id === selectedDeptId) ?? null,
    [departments, selectedDeptId]
  );

  const isFollowingCompany = useCallback(
    (companyId: string) =>
      follows.some(f => f.targetType === 'company' && f.targetId === companyId),
    [follows]
  );

  const createCompany = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || compName.trim().length < 2 || compDesc.trim().length < 5) return;
      setSavingComp(true);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        const created = await api.createCommunityCompany(user, {
          name: compName.trim(),
          nameAr: compNameAr.trim() || undefined,
          industry: compIndustry.trim() || 'NDT & Quality Engineering',
          headquarters: compHq.trim() || undefined,
          services: compServices.split(/[,،]+/).map(x => x.trim()).filter(Boolean),
          description: compDesc.trim(),
        });
        // Seed initial top Managing Director node automatically so the Org Chart opens cleanly
        await api.upsertCompanyDepartment(created.id, null, {
          name: isAr ? 'الإدارة التنفيذية' : 'Executive Leadership',
          levelOrder: 1,
          roleTitle: 'Managing Director',
          managerName: card?.displayName,
          managerUid: user.uid,
          overview: compDesc.trim().slice(0, 300),
          services: compServices.split(/[,،]+/).map(x => x.trim()).filter(Boolean),
        });
        setCompName('');
        setCompNameAr('');
        setCompHq('');
        setCompDesc('');
        setCreateCompanyOpen(false);
        setActiveCompanyId(created.id);
        onSelectCompany?.(created.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSavingComp(false);
      }
    },
    [account?.user, card?.displayName, compDesc, compHq, compIndustry, compName, compNameAr, compServices, isAr, onSelectCompany]
  );

  const addDepartment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeCompany || deptName.trim().length < 2) return;
      setSavingDept(true);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        const levelPreset = ORG_HIERARCHY_LEVELS.find(l => l.key === deptRoleKey);
        const roleTitle =
          deptRoleKey === 'custom' && deptCustomRole.trim()
            ? deptCustomRole.trim()
            : levelPreset?.en ?? 'Department Manager';
        const levelOrder = levelPreset?.levelOrder ?? 3;
        const createdId = await api.upsertCompanyDepartment(activeCompany.id, null, {
          name: deptName.trim(),
          parentDepartmentId: deptParentId || undefined,
          levelOrder,
          roleTitle,
          managerName: deptManagerName.trim() || undefined,
          specialties: deptSpecialties.split(/[,،]+/).map(x => x.trim()).filter(Boolean),
          services: deptServices.split(/[,،]+/).map(x => x.trim()).filter(Boolean),
          activeProjects: deptProjects.split(/[,،]+/).map(x => x.trim()).filter(Boolean),
          overview: deptOverview.trim() || undefined,
        });
        setSelectedDeptId(createdId);
        setDeptName('');
        setDeptManagerName('');
        setDeptSpecialties('');
        setDeptServices('');
        setDeptProjects('');
        setDeptOverview('');
        setDeptFormOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSavingDept(false);
      }
    },
    [activeCompany, deptCustomRole, deptManagerName, deptName, deptOverview, deptParentId, deptProjects, deptRoleKey, deptServices, deptSpecialties]
  );

  const sendAffiliationInvite = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !activeCompany || !inviteUid) return;
      const member = directory.find(m => m.uid === inviteUid);
      if (!member) return;
      const dept = departments.find(d => d.id === inviteDeptId);
      setInviting(true);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        await api.inviteCompanyAffiliation(user, {
          companyId: activeCompany.id,
          companyName: activeCompany.name,
          employeeUid: member.uid,
          employeeName: member.displayName,
          roleTitle: inviteRoleTitle.trim() || 'Inspector',
          departmentId: dept?.id,
          departmentName: dept?.name,
        });
        await api.createCommunityNotification(user, {
          recipientUid: member.uid,
          actorName: card?.displayName ?? activeCompany.name,
          category: 'verification',
          title: isAr ? `دعوة انتماء مؤسسي من ${activeCompany.name}` : `Company affiliation invite from ${activeCompany.name}`,
          body: inviteRoleTitle.trim(),
          linkSection: 'companies',
          linkEntryId: activeCompany.id,
        });
        setInviteUid('');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setInviting(false);
      }
    },
    [account?.user, activeCompany, card?.displayName, departments, directory, inviteDeptId, inviteRoleTitle, inviteUid, isAr]
  );

  const answerInvite = useCallback(
    async (aff: CommunityCompanyAffiliation, decision: 'accepted' | 'declined') => {
      if (!uid) return;
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        await api.respondCompanyAffiliation(aff.companyId, uid, decision);
        setMyAffiliations(prev =>
          prev.map(row => (row.id === aff.id ? { ...row, status: decision } : row))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [uid]
  );

  const renderTreeNodes = (nodes: OrgDepartmentNode[], depth = 0): React.ReactNode =>
    nodes.map(node => {
      const active = node.department.id === selectedDeptId;
      return (
        <div key={node.department.id} className={depth > 0 ? 'ms-4 mt-1.5 border-s border-violet-500/30 ps-3' : 'mt-1.5'}>
          <button
            type="button"
            onClick={() => setSelectedDeptId(node.department.id)}
            data-testid={`org-node-${node.department.id}`}
            className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-start transition cursor-pointer ${
              active
                ? 'border-violet-500 bg-violet-500/15'
                : isLight
                  ? 'border-slate-200 bg-slate-50 hover:border-violet-400'
                  : 'border-[#232345] bg-[#0b0b18] hover:border-violet-400/50'
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
                  L{node.department.levelOrder} · {roleLabelForKey(node.department.roleKey, isAr)}
                </span>
                <span className={`truncate text-xs font-bold ${s.heading}`}>{node.department.name}</span>
              </div>
              {node.department.managerName ? (
                <p className={`mt-0.5 text-[10px] ${s.subtext}`}>
                  {isAr ? 'المسؤول: ' : 'Lead: '}
                  {node.department.managerName}
                </p>
              ) : null}
            </div>
            {node.children.length > 0 ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
            )}
          </button>
          {node.children.length > 0 ? renderTreeNodes(node.children, depth + 1) : null}
        </div>
      );
    });

  const pendingMyInvites = myAffiliations.filter(a => a.status === 'invited');

  return (
    <div data-testid="network-section-companies" className="min-w-0 space-y-3">
      <div className={`${s.card} p-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className={`flex items-center gap-2 text-base font-bold ${s.heading}`}>
              <Building2 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'الشركات والهياكل التنظيمية التفاعلية' : 'Companies & Interactive Org Charts'}
            </h2>
            <p className={`mt-0.5 text-[11px] ${s.subtext}`}>
              {isAr
                ? 'صفحات الشركات الهندسية، الهيكل الإداري والفني لكل قسم، وانضمام الموظفين بموافقتهم الصريحة.'
                : 'Engineering company profiles, interactive multi-level department trees, and explicit employee affiliation consent.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpenCompanyPortal} className={s.buttonSecondary}>
              <Building2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
              {isAr ? 'بوابة الشركة الرسمية' : 'Official INSCO Portal'}
            </button>
            {canWrite ? (
              <button
                type="button"
                onClick={() => setCreateCompanyOpen(v => !v)}
                data-testid="network-company-create-toggle"
                className={s.buttonPrimary}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {createCompanyOpen
                  ? isAr ? 'إلغاء' : 'Cancel'
                  : isAr ? 'تسجيل صفحة شركة' : 'Create company page'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (uid ? onOpenProfile() : onOpenAccount('signin'))}
                className={s.buttonSecondary}
              >
                {uid
                  ? isAr ? 'أكمل بطاقتك لإنشاء شركة' : 'Complete profile to add org'
                  : isAr ? 'سجّل الدخول لإنشاء شركة' : 'Sign in to add company'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Explicit Employee Affiliation Consent Inbox */}
      {pendingMyInvites.length > 0 ? (
        <div data-testid="network-affiliation-invites" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            {isAr
              ? `دعوات انتماء وظيفي بانتظار موافقتك (${pendingMyInvites.length})`
              : `Pending company affiliation invites requiring your explicit consent (${pendingMyInvites.length})`}
          </h3>
          <div className="mt-2 space-y-1.5">
            {pendingMyInvites.map(inv => (
              <div key={inv.id} className={`${s.subCard} flex flex-wrap items-center justify-between gap-2 p-2`}>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${s.heading}`}>{inv.companyName}</p>
                  <p className={`text-[10px] ${s.subtext}`}>
                    {inv.roleTitle}
                    {inv.departmentName ? ` · ${inv.departmentName}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid={`affiliation-accept-${inv.companyId}`}
                    onClick={() => void answerInvite(inv, 'accepted')}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white cursor-pointer hover:bg-emerald-500"
                  >
                    <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {isAr ? 'موافقة وانضمام' : 'Accept & join'}
                  </button>
                  <button
                    type="button"
                    data-testid={`affiliation-decline-${inv.companyId}`}
                    onClick={() => void answerInvite(inv, 'declined')}
                    className={s.buttonSecondary}
                  >
                    <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {isAr ? 'رفض' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {createCompanyOpen && canWrite ? (
        <form onSubmit={createCompany} className={`${s.card} space-y-2.5 p-3`}>
          <h3 className={`text-xs font-bold ${s.heading}`}>
            {isAr ? 'إنشاء صفحة شركة / مؤسسة هندسية' : 'Create Company / Organization Page'}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={compName}
              onChange={e => setCompName(e.target.value)}
              required
              placeholder={isAr ? 'اسم الشركة (بالإنجليزية)…' : 'Company name (EN)…'}
              className={s.input}
            />
            <input
              value={compNameAr}
              onChange={e => setCompNameAr(e.target.value)}
              placeholder={isAr ? 'اسم الشركة (بالعربية)…' : 'Company name (AR)…'}
              className={s.input}
            />
            <input
              value={compIndustry}
              onChange={e => setCompIndustry(e.target.value)}
              required
              placeholder={isAr ? 'النشاط الهندسي' : 'Industry / Sector'}
              className={s.input}
            />
            <input
              value={compHq}
              onChange={e => setCompHq(e.target.value)}
              placeholder={isAr ? 'المقر الرئيسي (مثال: القاهرة / الجبيل)' : 'Headquarters'}
              className={s.input}
            />
          </div>
          <input
            value={compServices}
            onChange={e => setCompServices(e.target.value)}
            placeholder={isAr ? 'الخدمات (RT, UT, PAUT, PWHT…)': 'Services (RT, UT, PAUT, PWHT…)'}
            className={s.input}
          />
          <textarea
            value={compDesc}
            onChange={e => setCompDesc(e.target.value)}
            rows={3}
            required
            placeholder={isAr ? 'نبذة عن القدرات الفنية، المعامل، والاعتمادات…' : 'Company overview, capabilities, and accreditations…'}
            className={`${s.input} resize-y`}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={savingComp} className={s.buttonPrimary}>
              {savingComp ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {isAr ? 'حفظ وإنشاء الصفحة' : 'Create company page'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-400">
          {error}
        </p>
      ) : null}

      {!serviceReady || loading ? (
        <div className={`${s.card} p-4 text-xs ${s.subtext}`}>
          {loading && serviceReady ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              {isAr ? 'جارٍ تحميل الشركات والهياكل التنظيمية…' : 'Loading companies & org charts…'}
            </span>
          ) : isAr ? (
            'دليل الشركات والهياكل التنظيمية يعمل مع قاعدة البيانات الحية.'
          ) : (
            'Companies and org charts require Firestore configuration.'
          )}
        </div>
      ) : companies.length === 0 ? (
        <div data-testid="network-companies-empty" className={`${s.card} p-6 text-center`}>
          <Building2 className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
          <p className={`mt-2 text-xs font-bold ${s.heading}`}>
            {isAr ? 'لا توجد صفحات شركات منشورة بعد' : 'No published company pages yet'}
          </p>
          <p className={`mt-1 text-[11px] ${s.subtext}`}>
            {isAr
              ? 'أنشئ أول صفحة لشركتك لبناء الهيكل الإداري والفني ودعوة المهندسين.'
              : 'Register the first company page to build its interactive org chart and invite verified engineers.'}
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,270px)_minmax(0,1fr)]">
          {/* Companies list column */}
          <div className="space-y-2">
            {companies.map(comp => {
              const selected = comp.id === activeCompanyId;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => {
                    setActiveCompanyId(comp.id);
                    setSelectedDeptId(null);
                    onSelectCompany?.(comp.id);
                  }}
                  data-testid={`network-company-card-${comp.id}`}
                  className={`w-full rounded-xl border p-2.5 text-start transition cursor-pointer ${
                    selected
                      ? 'border-violet-500 bg-violet-500/10'
                      : isLight
                        ? 'border-slate-200 bg-white hover:border-violet-400'
                        : 'border-[#232345] bg-[#0f0f22] hover:border-violet-400/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className={`text-xs font-bold ${s.heading}`}>
                      {isAr && comp.nameAr ? comp.nameAr : comp.name}
                    </h3>
                    {comp.verificationStatus === 'verified' ? (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    ) : null}
                  </div>
                  <p className={`mt-0.5 text-[10px] ${s.subtext}`}>{comp.industry}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {comp.headquarters ? (
                      <span className={s.chip}>
                        <MapPin className="me-0.5 inline h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                        {comp.headquarters}
                      </span>
                    ) : null}
                    <span className={s.chip}>
                      {comp.followersCount} {isAr ? 'متابع' : 'followers'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Company Profile + Interactive Org Chart */}
          {activeCompany ? (
            <div className="min-w-0 space-y-3">
              <div className={`${s.card} p-3`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className={`text-base font-bold ${s.heading}`}>
                        {isAr && activeCompany.nameAr ? activeCompany.nameAr : activeCompany.name}
                      </h3>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                          activeCompany.verificationStatus === 'verified'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {activeCompany.verificationStatus === 'verified'
                          ? isAr ? 'مؤسسة موثقة' : 'Organization Verified'
                          : isAr ? 'تحت المراجعة' : 'Pending Review'}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-[11px] ${s.subtext}`}>{activeCompany.industry}</p>
                  </div>

                  {uid ? (
                    <button
                      type="button"
                      onClick={() => {
                        void import('../../client/networkPlatformService').then(api =>
                          account?.user
                            ? api.toggleFollow(account.user, 'company', activeCompany.id, activeCompany.name)
                            : undefined
                        );
                      }}
                      className={isFollowingCompany(activeCompany.id) ? s.buttonSecondary : s.buttonPrimary}
                    >
                      {isFollowingCompany(activeCompany.id)
                        ? isAr ? 'متابَع' : 'Following'
                        : isAr ? 'متابعة الشركة' : 'Follow company'}
                    </button>
                  ) : null}
                </div>

                <p className={`mt-2 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>
                  {activeCompany.description}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeCompany.services.map(srv => (
                    <span key={srv} className={s.chip}>{srv}</span>
                  ))}
                  {activeCompany.website ? (
                    <a
                      href={activeCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:underline"
                    >
                      <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {activeCompany.website}
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Interactive Org Chart & Department Builder */}
              <div className={`${s.card} p-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                    <GitBranch className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                    {isAr ? 'الهيكل التنظيمي والأقسام التفاعلي' : 'Interactive Org Chart & Departments'}
                  </h4>
                  {isCompanyOwner ? (
                    <button
                      type="button"
                      onClick={() => setDeptFormOpen(v => !v)}
                      data-testid="network-org-add-dept"
                      className={s.buttonSecondary}
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {isAr ? 'إضافة قسم / وحدة' : 'Add department'}
                    </button>
                  ) : null}
                </div>

                {isCompanyOwner && deptFormOpen ? (
                  <form onSubmit={addDepartment} className={`${s.subCard} mt-2.5 space-y-2 p-2.5`}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={deptName}
                        onChange={e => setDeptName(e.target.value)}
                        required
                        placeholder={isAr ? 'اسم القسم (مثال: قسم فحص PAUT)' : 'Department name (e.g. PAUT Operations)'}
                        className={s.input}
                      />
                      <select
                        value={deptRoleKey}
                        onChange={e => setDeptRoleKey(e.target.value as OrgHierarchyRoleKey)}
                        className={s.input}
                        aria-label={isAr ? 'المستوى الوظيفي' : 'Hierarchy level'}
                      >
                        {ORG_HIERARCHY_LEVELS.map(lvl => (
                          <option key={lvl.key} value={lvl.key}>
                            L{lvl.levelOrder} — {isAr ? lvl.ar : lvl.en}
                          </option>
                        ))}
                      </select>
                      {deptRoleKey === 'custom' ? (
                        <input
                          value={deptCustomRole}
                          onChange={e => setDeptCustomRole(e.target.value)}
                          placeholder={isAr ? 'اسم المستوى المخصص…' : 'Custom role title…'}
                          className={s.input}
                        />
                      ) : null}
                      <select
                        value={deptParentId}
                        onChange={e => setDeptParentId(e.target.value)}
                        className={s.input}
                        aria-label={isAr ? 'يتبع لقسم' : 'Reports to parent department'}
                      >
                        <option value="">{isAr ? 'مستوى رئيسي (جذر الهيكل)' : 'Top level (root)'}</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.roleTitle})
                          </option>
                        ))}
                      </select>
                      <input
                        value={deptManagerName}
                        onChange={e => setDeptManagerName(e.target.value)}
                        placeholder={isAr ? 'اسم مدير القسم / القائد…' : 'Department manager name…'}
                        className={s.input}
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        value={deptSpecialties}
                        onChange={e => setDeptSpecialties(e.target.value)}
                        placeholder={isAr ? 'تخصصات القسم…' : 'Specialties…'}
                        className={s.input}
                      />
                      <input
                        value={deptServices}
                        onChange={e => setDeptServices(e.target.value)}
                        placeholder={isAr ? 'الخدمات المقدمة…' : 'Services…'}
                        className={s.input}
                      />
                      <input
                        value={deptProjects}
                        onChange={e => setDeptProjects(e.target.value)}
                        placeholder={isAr ? 'المشاريع النشطة…' : 'Active projects…'}
                        className={s.input}
                      />
                    </div>
                    <textarea
                      value={deptOverview}
                      onChange={e => setDeptOverview(e.target.value)}
                      rows={2}
                      placeholder={isAr ? 'ملخص مهام القسم…' : 'Department scope & responsibilities…'}
                      className={`${s.input} resize-none`}
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={savingDept} className={s.buttonPrimary}>
                        {savingDept ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                        {isAr ? 'حفظ القسم' : 'Save department'}
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {/* Left: Interactive Hierarchy Tree */}
                  <div>
                    {orgTree.length === 0 ? (
                      <p className={`text-[11px] ${s.subtext}`}>
                        {isAr ? 'لم تُضف أقسام بعد في هذه الشركة.' : 'No departments added yet.'}
                      </p>
                    ) : (
                      renderTreeNodes(orgTree)
                    )}
                  </div>

                  {/* Right: Selected Department Mini-Page */}
                  <div>
                    {selectedDept ? (
                      <div data-testid="network-dept-detail" className={`${s.subCard} space-y-2 p-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-violet-400">
                              L{selectedDept.levelOrder} · {selectedDept.roleTitle}
                            </span>
                            <h5 className={`text-sm font-bold ${s.heading}`}>{selectedDept.name}</h5>
                          </div>
                          {isCompanyOwner ? (
                            <button
                              type="button"
                              onClick={() => {
                                void import('../../client/networkPlatformService').then(api =>
                                  api.deleteCompanyDepartment(activeCompany.id, selectedDept.id)
                                );
                                setSelectedDeptId(null);
                              }}
                              title={isAr ? 'حذف القسم' : 'Delete department'}
                              className="rounded border border-rose-500/40 p-1 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                        {selectedDept.managerName ? (
                          <p className={`text-[11px] ${s.subtext}`}>
                            <strong className={s.heading}>{isAr ? 'المسؤول: ' : 'Manager: '}</strong>
                            {selectedDept.managerName}
                          </p>
                        ) : null}
                        {selectedDept.overview ? (
                          <p className={`text-[11px] leading-relaxed ${s.subtext}`}>{selectedDept.overview}</p>
                        ) : null}
                        {selectedDept.specialties && selectedDept.specialties.length > 0 ? (
                          <div>
                            <p className={`text-[10px] font-bold ${s.heading}`}>{isAr ? 'التخصصات' : 'Specialties'}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedDept.specialties.map(sp => (
                                <span key={sp} className={s.chip}>{sp}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {selectedDept.services && selectedDept.services.length > 0 ? (
                          <div>
                            <p className={`text-[10px] font-bold ${s.heading}`}>{isAr ? 'الخدمات' : 'Services'}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedDept.services.map(sv => (
                                <span key={sv} className={s.chip}>{sv}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {selectedDept.activeProjects && selectedDept.activeProjects.length > 0 ? (
                          <div>
                            <p className={`text-[10px] font-bold ${s.heading}`}>{isAr ? 'المشاريع النشطة' : 'Active Projects'}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedDept.activeProjects.map(pr => (
                                <span key={pr} className={s.chip}>{pr}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <p className={`text-[10px] font-bold ${s.heading}`}>
                            {isAr ? 'أعضاء القسم المؤكّدون' : 'Confirmed Department Team'}
                          </p>
                          <div className="mt-1 space-y-1">
                            {affiliations.filter(
                              a => a.status === 'accepted' && (!a.departmentId || a.departmentId === selectedDept.id)
                            ).length === 0 ? (
                              <p className={`text-[10px] ${s.muted}`}>
                                {isAr ? 'لا يوجد موظفون معتمدون بعد في هذا القسم.' : 'No accepted employees in this unit yet.'}
                              </p>
                            ) : (
                              affiliations
                                .filter(a => a.status === 'accepted' && (!a.departmentId || a.departmentId === selectedDept.id))
                                .map(a => (
                                  <div key={a.id} className="flex items-center justify-between text-[10px]">
                                    <span className={s.heading}>{a.employeeName}</span>
                                    <span className={s.subtext}>{a.roleTitle}</span>
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`${s.subCard} p-4 text-center text-[11px] ${s.subtext}`}>
                        {isAr
                          ? 'اختر أي وحدة في الشجرة لعرض بياناتها ومشاريعها وفريقها.'
                          : 'Select any node in the org chart to view its scope, projects, and team.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employee Affiliation & Explicit Consent Panel */}
              <div className={`${s.card} p-3`}>
                <h4 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                  <Users className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                  {isAr ? 'فريق الشركة ودعوات الانتماء الرسمي' : 'Company Roster & Employee Affiliation Consent'}
                </h4>
                <p className={`mt-0.5 text-[10px] ${s.subtext}`}>
                  {isAr
                    ? 'لا يُربط أي مهندس بملف شركة بدون موافقته المباشرة على الدعوة.'
                    : 'Members only appear on a company roster after explicitly accepting an employer invitation.'}
                </p>

                {isCompanyOwner ? (
                  <form onSubmit={sendAffiliationInvite} className="mt-2.5 grid gap-2 sm:grid-cols-4">
                    <select
                      value={inviteUid}
                      onChange={e => setInviteUid(e.target.value)}
                      required
                      className={s.input}
                      aria-label={isAr ? 'اختر مهندساً لدعوته' : 'Select member to invite'}
                    >
                      <option value="">{isAr ? 'اختر مهندساً من الشبكة…' : 'Pick a member…'}</option>
                      {directory
                        .filter(m => m.uid !== uid)
                        .map(m => (
                          <option key={m.uid} value={m.uid}>
                            {m.displayName} ({m.headline || m.organizationName})
                          </option>
                        ))}
                    </select>
                    <select
                      value={inviteDeptId}
                      onChange={e => setInviteDeptId(e.target.value)}
                      className={s.input}
                      aria-label={isAr ? 'القسم' : 'Department'}
                    >
                      <option value="">{isAr ? 'القسم (اختياري)' : 'Department (optional)'}</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={inviteRoleTitle}
                      onChange={e => setInviteRoleTitle(e.target.value)}
                      placeholder={isAr ? 'المسمى الوظيفي' : 'Role title'}
                      className={s.input}
                    />
                    <button type="submit" disabled={inviting || !inviteUid} className={s.buttonPrimary}>
                      <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {isAr ? 'إرسال دعوة موافقة' : 'Send invite'}
                    </button>
                  </form>
                ) : null}

                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {affiliations.map(aff => (
                    <div key={aff.id} className={`${s.subCard} flex items-center justify-between gap-2 p-2`}>
                      <div className="min-w-0">
                        <p className={`truncate text-xs font-bold ${s.heading}`}>{aff.employeeName}</p>
                        <p className={`truncate text-[10px] ${s.subtext}`}>
                          {aff.roleTitle}
                          {aff.departmentName ? ` · ${aff.departmentName}` : ''}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                          aff.status === 'accepted'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : aff.status === 'invited'
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                              : 'border-slate-500/40 bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {aff.status === 'accepted'
                          ? isAr ? 'موافق وعضو' : 'Accepted'
                          : aff.status === 'invited'
                            ? isAr ? 'بانتظار الموافقة' : 'Invited'
                            : aff.status === 'declined'
                              ? isAr ? 'مرفوضة' : 'Declined'
                              : isAr ? 'مُزال' : 'Removed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default NetworkCompaniesSection;
