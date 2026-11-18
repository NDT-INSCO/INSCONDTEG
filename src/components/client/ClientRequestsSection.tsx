import React, { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderPlus,
  Search,
  Send,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  generateNextCompanyCode,
  sanitizeUpperCode,
  type ClientAccount,
  type ClientRequest,
  type ClientRequestStatus,
  type CompanyRecord,
  type RequestUrgency,
} from '../../client/types';
import {
  adminUpdateClientRequest,
  createClientRequest,
  createCompanyWithUniqueCode,
} from '../../client/firestoreClientService';

interface ClientRequestsSectionProps {
  language: Language;
  user: User;
  account: ClientAccount | null;
  requests: ClientRequest[];
  companies: CompanyRecord[];
  isAdmin: boolean;
  loading: boolean;
  onCompanyCreatedFromRequest: (companyId: string) => void;
}

const SERVICE_OPTIONS = ['RT', 'UT', 'PAUT', 'MT', 'PT', 'VT', 'PMI', 'PWHT', 'HYDRO', 'AVL'];

export const ClientRequestsSection: React.FC<ClientRequestsSectionProps> = ({
  language,
  user,
  account,
  requests,
  companies,
  isAdmin,
  loading,
  onCompanyCreatedFromRequest,
}) => {
  const isAr = language === 'ar';

  const [companyName, setCompanyName] = useState(account?.organizationName || '');
  const [companyCode, setCompanyCode] = useState(account?.assignedCompanyCode || '');
  const [contactName, setContactName] = useState(account?.fullName || user.displayName || '');
  const [phone, setPhone] = useState(account?.phone || '');
  const [serviceMethods, setServiceMethods] = useState<string[]>(['RT', 'UT']);
  const [projectLocation, setProjectLocation] = useState('');
  const [urgency, setUrgency] = useState<RequestUrgency>('standard');
  const [scopeSummary, setScopeSummary] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ClientRequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin inline editor state
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<ClientRequestStatus>('under_review');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminLinkCode, setAdminLinkCode] = useState('');

  const toggleMethod = (method: string) => {
    setServiceMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCreatedRef(null);

    if (!companyName.trim() || !contactName.trim() || !phone.trim() || !projectLocation.trim()) {
      setErrorMsg(
        isAr
          ? 'يرجى استيفاء اسم الشركة، اسم المسؤول، الهاتف، وموقع المشروع.'
          : 'Please complete Company Name, Contact Name, Phone, and Location.'
      );
      return;
    }
    if (scopeSummary.trim().length < 5) {
      setErrorMsg(
        isAr ? 'يرجى كتابة وصف مختصر لنطاق الاختبار المطلوب.' : 'Please enter a brief scope summary.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const refCode = await createClientRequest(user, {
        companyName: companyName.trim(),
        companyCode: sanitizeUpperCode(companyCode),
        contactName: contactName.trim(),
        phone: phone.trim(),
        serviceMethods,
        projectLocation: projectLocation.trim(),
        urgency,
        scopeSummary: scopeSummary.trim(),
      });
      setCreatedRef(refCode);
      setScopeSummary('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter(req => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (!q) return true;
      return (
        req.requestCode.toLowerCase().includes(q) ||
        req.companyName.toLowerCase().includes(q) ||
        (req.companyCode || '').toLowerCase().includes(q) ||
        req.projectLocation.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  const handleAdminSaveRequest = async (reqId: string) => {
    await adminUpdateClientRequest(reqId, {
      status: adminStatus,
      adminNotes,
      companyCode: adminLinkCode,
    });
    setEditingRequestId(null);
  };

  const handlePromoteRequestToCompany = async (req: ClientRequest) => {
    const nextCode =
      sanitizeUpperCode(req.companyCode || '') ||
      generateNextCompanyCode(companies.map(c => c.companyCode));
    const created = await createCompanyWithUniqueCode(user.uid, {
      companyCode: nextCode,
      nameAr: req.companyName,
      nameEn: req.companyName,
      archiveCategory: 'active_testing',
      hasActiveTestingDossier: true,
      sector: 'Industrial Client',
      contactPerson: req.contactName,
      contactEmail: req.submittedByEmail,
      contactPhone: req.phone,
      projectLocation: req.projectLocation,
      activeScope: `${req.serviceMethods.join(', ')} — ${req.scopeSummary}`,
      assignedClientUid: req.submittedByUid,
      legacySinceYear: String(new Date().getFullYear()),
    });
    await adminUpdateClientRequest(req.id, {
      status: 'approved',
      adminNotes: `Coded & opened dossier ${created.companyCode}`,
      companyCode: created.companyCode,
    });
    onCompanyCreatedFromRequest(created.id);
  };

  const statusBadge = (st: ClientRequestStatus) => {
    switch (st) {
      case 'approved':
      case 'completed':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      case 'rejected':
        return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
      case 'in_progress':
      case 'under_review':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      default:
        return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
    }
  };

  return (
    <div className="space-y-6" data-testid="client-requests-section">
      {/* Intake Form */}
      <form
        onSubmit={handleSubmitRequest}
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-black text-white">
              {isAr ? 'تقديم طلب اختبار أو خدمة عملاء جديدة' : 'Submit New Client Testing / Service Request'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'تصل الطلبات مباشرةً لقطاع العمليات الفنية لفتح كود الشركة وجدولة فرق الفحص.'
                : 'Requests route directly to INSCO Operations for company coding and field mobilization.'}
            </p>
          </div>
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'اسم الشركة *' : 'Company Name *'}</span>
            <input
              type="text"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">
              {isAr ? 'الكود الخاص بالشركة (إن وُجد)' : 'Company Code (if existing)'}
            </span>
            <input
              type="text"
              value={companyCode}
              onChange={e => setCompanyCode(sanitizeUpperCode(e.target.value))}
              placeholder="INS-CO-0101"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'اسم المهندس المسؤول *' : 'Contact Person *'}</span>
            <input
              type="text"
              required
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}</span>
            <input
              type="text"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'موقع المشروع / المحطة *' : 'Project / Plant Location *'}</span>
            <input
              type="text"
              required
              value={projectLocation}
              onChange={e => setProjectLocation(e.target.value)}
              placeholder={isAr ? 'مثال: السويس / البرلس / الجبيل' : 'e.g. Suez / Burullus / Cairo'}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'درجة الأولوية' : 'Urgency'}</span>
            <select
              value={urgency}
              onChange={e => setUrgency(e.target.value as RequestUrgency)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="standard">{isAr ? 'جدول قياسي (Standard)' : 'Standard'}</option>
              <option value="priority">{isAr ? 'أولوية قصوى (Priority)' : 'Priority'}</option>
              <option value="emergency_24h">{isAr ? 'طوارئ وتحرك فوري 24 ساعة' : '24h Emergency Dispatch'}</option>
            </select>
          </label>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs text-slate-400">
            {isAr ? 'الاختبارات والخدمات المطلوبة:' : 'Requested Testing Methods:'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_OPTIONS.map(m => {
              const active = serviceMethods.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMethod(m)}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold transition cursor-pointer ${
                    active
                      ? 'border-cyan-500 bg-cyan-600 text-white'
                      : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block space-y-1 text-xs">
          <span className="text-slate-400 block">
            {isAr ? 'وصف نطاق العمل وعدد الوصلات والمواصفات *' : 'Technical Scope Summary *'}
          </span>
          <textarea
            rows={2}
            required
            value={scopeSummary}
            onChange={e => setScopeSummary(e.target.value)}
            placeholder={
              isAr
                ? 'عدد اللحامات، السماكات، الكود المطلوب (ASME / API)، والموعد المقترح...'
                : 'Weld count, wall thickness, governing code (ASME/API), target dates...'
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {errorMsg && (
          <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {createdRef && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? `تم تسجيل طلبك بنجاح برقم متابعة: ${createdRef}`
                : `Request registered with tracking code: ${createdRef}`}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{submitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : isAr ? 'إرسال الطلب لبوابة العمليات' : 'Submit Service Request'}</span>
        </button>
      </form>

      {/* Requests Pipeline List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <h3 className="text-sm font-black text-white">
              {isAdmin
                ? isAr
                  ? 'صندوق استقبال طلبات العملاء الجدد'
                  : 'Incoming Client Requests Desk'
                : isAr
                  ? 'سجل طلباتي المقدمة'
                  : 'My Submitted Requests'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                  isAr ? 'right-2.5' : 'left-2.5'
                }`}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في الطلبات...' : 'Filter requests...'}
                className={`rounded-lg border border-slate-700 bg-slate-950 py-1.5 text-xs text-white ${
                  isAr ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5'
                }`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | ClientRequestStatus)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="new">{isAr ? 'جديد (New)' : 'New'}</option>
              <option value="under_review">{isAr ? 'قيد المراجعة' : 'Under Review'}</option>
              <option value="approved">{isAr ? 'معتمد' : 'Approved'}</option>
              <option value="in_progress">{isAr ? 'جاري التنفيذ' : 'In Progress'}</option>
              <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
              <option value="rejected">{isAr ? 'مرفوض' : 'Rejected'}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-14 rounded-lg bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 py-8 text-center text-xs text-slate-400">
            {isAr ? 'لا توجد طلبات مسجلة في هذا التصنيف حالياً.' : 'No requests found for the active filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(req => {
              const isEditing = editingRequestId === req.id;
              return (
                <div
                  key={req.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-cyan-300 tabular-nums">
                        {req.requestCode}
                      </span>
                      <span className="font-bold text-white">{req.companyName}</span>
                      {req.companyCode && (
                        <span className="font-mono text-[11px] text-amber-300">
                          [{req.companyCode}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${statusBadge(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed">{req.scopeSummary}</div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{req.serviceMethods.join(' · ')}</span>
                    <span>|</span>
                    <span>{req.projectLocation}</span>
                    <span>|</span>
                    <span>{req.contactName} ({req.phone})</span>
                  </div>

                  {req.adminNotes && (
                    <div className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-cyan-200">
                      <span className="font-semibold text-cyan-400">
                        {isAr ? 'رد العمليات: ' : 'Operations Note: '}
                      </span>
                      {req.adminNotes}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRequestId(req.id);
                              setAdminStatus(req.status);
                              setAdminNotes(req.adminNotes || '');
                              setAdminLinkCode(req.companyCode || '');
                            }}
                            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
                          >
                            {isAr ? 'تحديث الحالة والملاحظات' : 'Update Status'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handlePromoteRequestToCompany(req)}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer"
                          >
                            <FolderPlus className="w-3 h-3" />
                            <span>{isAr ? 'تكويد الشركة وفتح فايلها' : 'Code Company & Open Dossier'}</span>
                          </button>
                        </>
                      ) : (
                        <div className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              value={adminStatus}
                              onChange={e => setAdminStatus(e.target.value as ClientRequestStatus)}
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                            >
                              <option value="new">new</option>
                              <option value="under_review">under_review</option>
                              <option value="approved">approved</option>
                              <option value="in_progress">in_progress</option>
                              <option value="completed">completed</option>
                              <option value="rejected">rejected</option>
                            </select>
                            <input
                              type="text"
                              value={adminLinkCode}
                              onChange={e => setAdminLinkCode(sanitizeUpperCode(e.target.value))}
                              placeholder="INS-CO-..."
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-xs text-cyan-300"
                            />
                            <input
                              type="text"
                              value={adminNotes}
                              onChange={e => setAdminNotes(e.target.value)}
                              placeholder={isAr ? 'ملاحظات العمليات...' : 'Admin notes...'}
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleAdminSaveRequest(req.id)}
                              className="rounded bg-cyan-600 hover:bg-cyan-500 px-3 py-1 text-[11px] font-bold text-white cursor-pointer"
                            >
                              {isAr ? 'حفظ' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRequestId(null)}
                              className="rounded border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
