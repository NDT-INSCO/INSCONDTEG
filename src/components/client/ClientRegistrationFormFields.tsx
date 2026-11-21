import React from 'react';
import { Building2, UserCheck } from 'lucide-react';
import type { Language } from '../../types';
import { sanitizeUpperCode, type ClientRegistrationDraftInput } from '../../client/types';

interface ClientRegistrationFormFieldsProps {
  language: Language;
  value: ClientRegistrationDraftInput;
  onChange: (next: ClientRegistrationDraftInput) => void;
  showPersonalEmail?: boolean;
  lockPersonalEmail?: boolean;
  lockPrimaryPhone?: boolean;
  showAutoCreateCompanyToggle?: boolean;
}

export const ClientRegistrationFormFields: React.FC<ClientRegistrationFormFieldsProps> = ({
  language,
  value,
  onChange,
  showPersonalEmail = true,
  lockPersonalEmail = false,
  lockPrimaryPhone = false,
  showAutoCreateCompanyToggle = false,
}) => {
  const isAr = language === 'ar';

  const patch = <K extends keyof ClientRegistrationDraftInput>(
    key: K,
    nextVal: ClientRegistrationDraftInput[K]
  ) => {
    onChange({ ...value, [key]: nextVal });
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Personal Representative Details */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <legend className="px-2 inline-flex items-center gap-1.5 text-xs font-black text-cyan-300">
          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'أولاً: البيانات الشخصية للمفوّض / صاحب الحساب' : '1. Personal & Representative Details'}</span>
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-slate-300 block font-semibold">
              {isAr ? 'الاسم الكامل *' : 'Full Name *'}
            </span>
            <input
              type="text"
              required
              name="fullName"
              value={value.fullName}
              onChange={e => patch('fullName', e.target.value)}
              placeholder={isAr ? 'م. أحمد محمود عبد الله' : 'Eng. Ahmed Mahmoud'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block font-semibold">
              {isAr ? 'المسمى الوظيفي / الصفة' : 'Job Title / Position'}
            </span>
            <input
              type="text"
              name="jobTitle"
              value={value.jobTitle ?? ''}
              onChange={e => patch('jobTitle', e.target.value)}
              placeholder={isAr ? 'مدير جودة QA/QC أو مهندس مشاريع' : 'QA/QC Manager / Project Engineer'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block font-semibold">
              {isAr ? 'رقم الهاتف الأساسي / واتساب *' : 'Primary Phone / WhatsApp *'}
            </span>
            <input
              type="tel"
              required
              disabled={lockPrimaryPhone}
              name="phone"
              value={value.phone}
              onChange={e => patch('phone', e.target.value)}
              placeholder="+20 100 000 0000"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 disabled:bg-slate-950/60 disabled:text-slate-400 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'رقم هاتف بديل (اختياري)' : 'Secondary Phone (optional)'}
            </span>
            <input
              type="tel"
              name="secondaryPhone"
              value={value.secondaryPhone ?? ''}
              onChange={e => patch('secondaryPhone', e.target.value)}
              placeholder="+20 120 000 0000"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          {showPersonalEmail && (
            <label className="space-y-1">
              <span className="text-slate-300 block">
                {isAr ? 'البريد الإلكتروني الشخصي' : 'Personal Email'}
              </span>
              <input
                type="email"
                disabled={lockPersonalEmail}
                name="personalEmail"
                value={value.personalEmail ?? ''}
                onChange={e => patch('personalEmail', e.target.value)}
                placeholder="name@domain.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 disabled:bg-slate-950/60 disabled:text-slate-400 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </label>
          )}

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'الرقم القومي / جواز السفر (للتحقق)' : 'National ID / Passport Ref'}
            </span>
            <input
              type="text"
              name="nationalId"
              value={value.nationalId ?? ''}
              onChange={e => patch('nationalId', e.target.value)}
              placeholder={isAr ? 'اختياري للتحقق الإداري' : 'Optional identity reference'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1 md:col-span-2 lg:col-span-3">
            <span className="text-slate-300 block">
              {isAr ? 'العنوان الشخصي / عنوان المراسلات' : 'Personal / Correspondence Address'}
            </span>
            <input
              type="text"
              name="personalAddress"
              value={value.personalAddress ?? ''}
              onChange={e => patch('personalAddress', e.target.value)}
              placeholder={isAr ? 'الشارع، الحي، المدينة، الدولة' : 'Street, District, City, Country'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>
        </div>
      </fieldset>

      {/* Section 2: Company / Organization Details */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <legend className="px-2 inline-flex items-center gap-1.5 text-xs font-black text-amber-300">
          <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'ثانياً: البيانات الخاصة بالشركة / المنشأة' : '2. Company & Organization Details'}</span>
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-slate-300 block font-semibold">
              {isAr ? 'اسم الشركة الرسمي (عربي) *' : 'Company Official Name *'}
            </span>
            <input
              type="text"
              required
              name="organizationName"
              value={value.organizationName}
              onChange={e => patch('organizationName', e.target.value)}
              placeholder={isAr ? 'شركة ... للمشروعات الصناعية' : 'Company Official Name'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'اسم الشركة (إنجليزي للتقارير)' : 'Company Name (English)'}
            </span>
            <input
              type="text"
              name="organizationNameEn"
              value={value.organizationNameEn ?? ''}
              onChange={e => patch('organizationNameEn', e.target.value)}
              placeholder="e.g. Nile Delta Industrial Co."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block font-semibold">
              {isAr ? 'القطاع الصناعي' : 'Industry Sector'}
            </span>
            <input
              type="text"
              name="sector"
              value={value.sector ?? ''}
              onChange={e => patch('sector', e.target.value)}
              placeholder={isAr ? 'بترول وغاز / طاقة / بتروكيماويات / مقاولات' : 'Oil & Gas / Power / EPC'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'رقم السجل التجاري' : 'Commercial Reg No.'}
            </span>
            <input
              type="text"
              name="commercialRegNo"
              value={value.commercialRegNo ?? ''}
              onChange={e => patch('commercialRegNo', e.target.value)}
              placeholder="CR-123456"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'رقم البطاقة الضريبية' : 'Tax Card / VAT No.'}
            </span>
            <input
              type="text"
              name="taxCardNo"
              value={value.taxCardNo ?? ''}
              onChange={e => patch('taxCardNo', e.target.value)}
              placeholder="100-200-300"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'هاتف الشركة / الخط الأرضي' : 'Company Official Phone'}
            </span>
            <input
              type="tel"
              name="companyPhone"
              value={value.companyPhone ?? ''}
              onChange={e => patch('companyPhone', e.target.value)}
              placeholder="+20 2 0000 0000"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'البريد الرسمي للشركة' : 'Corporate Email'}
            </span>
            <input
              type="email"
              name="companyEmail"
              value={value.companyEmail ?? ''}
              onChange={e => patch('companyEmail', e.target.value)}
              placeholder="info@company.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'المدينة / المحافظة / الدولة' : 'City / Governorate / Country'}
            </span>
            <input
              type="text"
              name="cityGovernorate"
              value={value.cityGovernorate ?? ''}
              onChange={e => patch('cityGovernorate', e.target.value)}
              placeholder={isAr ? 'القاهرة / السويس / الجيزة، مصر' : 'Cairo / Suez, Egypt'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'الموقع الإلكتروني للشركة (اختياري)' : 'Company Website (optional)'}
            </span>
            <input
              type="url"
              autoComplete="url"
              name="website"
              value={value.website ?? ''}
              onChange={e => patch('website', e.target.value)}
              placeholder="https://company.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-slate-300 block">
              {isAr ? 'عنوان مقر الشركة / موقع المصنع أو المشروع' : 'Company HQ / Plant Address'}
            </span>
            <input
              type="text"
              name="companyAddress"
              value={value.companyAddress ?? ''}
              onChange={e => patch('companyAddress', e.target.value)}
              placeholder={isAr ? 'المنطقة الصناعية، القطعة...' : 'Industrial Zone, Plot...'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-300 block">
              {isAr ? 'كود الشركة (إن وُجد مسبقاً - اختياري)' : 'Existing Company Code (optional)'}
            </span>
            <input
              type="text"
              name="requestedCompanyCode"
              value={value.requestedCompanyCode ?? ''}
              onChange={e => patch('requestedCompanyCode', sanitizeUpperCode(e.target.value))}
              placeholder="INS-CO-0101"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1 md:col-span-2 lg:col-span-3">
            <span className="text-slate-300 block">
              {isAr
                ? 'نطاق الأعمال والاختبارات المطلوبة (NDT / PWHT / خطوط / خزانات)'
                : 'Primary Engineering Activities & Testing Scope'}
            </span>
            <textarea
              rows={2}
              name="activeScope"
              value={value.activeScope ?? ''}
              onChange={e => patch('activeScope', e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: فحص لحامات خطوط البترول RT/PAUT والمعالجة الحرارية PWHT للغلايات والمبادلات...'
                  : 'e.g., Pipeline RT/PAUT weld inspection, PWHT heat treatment, tank integrity...'
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>
        </div>

        {showAutoCreateCompanyToggle && value.requestedCompanyCode && (
          <p className="text-xs text-cyan-200">
            {isAr
              ? 'سيُحفظ الكود لطلب ربط ملف الشركة الموجود، من دون إنشاء ملف مكرر.'
              : 'This code will be saved for linking an existing company, without creating a duplicate dossier.'}
          </p>
        )}
        {showAutoCreateCompanyToggle && !value.requestedCompanyCode && (
          <label className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              name="autoCreateCompanyWorkspace"
              checked={Boolean(value.autoCreateCompanyWorkspace)}
              onChange={e => patch('autoCreateCompanyWorkspace', e.target.checked)}
              className="mt-0.5 accent-emerald-500"
            />
            <span>
              <strong className="block text-white">
                {isAr
                  ? 'تكويد وتفعيل ملف الشركة داخل حسابي تلقائياً فور التسجيل'
                  : 'Automatically code & create my Company Workspace upon sign-up'}
              </strong>
              <span className="text-[11px] text-emerald-200/80">
                {isAr
                  ? 'ينشئ لك ملف شركة خاصاً برقم كودي فريد لإدارة الفنيين وتتبع الخرائط والتقارير فوراً.'
                  : 'Generates a coded Company Dossier workspace so you can manage technicians, GPS maps, and reports immediately.'}
              </span>
            </span>
          </label>
        )}
      </fieldset>
    </div>
  );
};
