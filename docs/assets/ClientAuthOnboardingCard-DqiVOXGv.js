import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as CircleCheck } from "./circle-check-C1rtQ7NC.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { t as UserCheck } from "./user-check-D3m-wSgB.js";
import { Ft as Phone, Gt as Mail, N as AccountPrivacyNotice, Yt as KeyRound, _n as BriefcaseBusiness, _t as UserPlus, gn as Building2, qt as LogIn } from "./index-BKrODMj6.js";
import { A as signInClientPortalWithGoogle, D as sendClientPhoneOtp, E as sendClientPasswordReset, S as normalizePhoneDigits, j as signUpClientPortalWithEmail, k as signInClientPortalWithEmail, nt as sanitizeUpperCode, v as formatFirebaseAuthError } from "./firestoreClientService-BUGkAdZ4.js";
//#region src/components/client/ClientRegistrationFormFields.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ClientRegistrationFormFields = ({ language, value, onChange, showPersonalEmail = true, lockPersonalEmail = false, lockPrimaryPhone = false, showAutoCreateCompanyToggle = false, requireCompanyDetails = true }) => {
	const isAr = language === "ar";
	const patch = (key, nextVal) => {
		onChange({
			...value,
			[key]: nextVal
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
			className: "rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("legend", {
				className: "px-2 inline-flex items-center gap-1.5 text-xs font-black text-cyan-300",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCheck, {
					className: "w-3.5 h-3.5",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "أولاً: البيانات الشخصية للمفوّض / صاحب الحساب" : "1. Personal & Representative Details" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-slate-300 block font-semibold",
							children: isAr ? "الاسم الكامل *" : "Full Name *"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							required: true,
							name: "fullName",
							value: value.fullName,
							onChange: (e) => patch("fullName", e.target.value),
							placeholder: isAr ? "م. أحمد محمود عبد الله" : "Eng. Ahmed Mahmoud",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-slate-300 block font-semibold",
							children: isAr ? "المسمى الوظيفي / الصفة" : "Job Title / Position"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							name: "jobTitle",
							value: value.jobTitle ?? "",
							onChange: (e) => patch("jobTitle", e.target.value),
							placeholder: isAr ? "مدير جودة QA/QC أو مهندس مشاريع" : "QA/QC Manager / Project Engineer",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-slate-300 block font-semibold",
							children: [isAr ? "رقم الهاتف الأساسي / واتساب" : "Primary Phone / WhatsApp", requireCompanyDetails ? " *" : ""]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "tel",
							required: requireCompanyDetails,
							disabled: lockPrimaryPhone,
							name: "phone",
							value: value.phone,
							onChange: (e) => patch("phone", e.target.value),
							placeholder: "+20 100 000 0000",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 disabled:bg-slate-950/60 disabled:text-slate-400 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-slate-300 block",
							children: isAr ? "رقم هاتف بديل (اختياري)" : "Secondary Phone (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "tel",
							name: "secondaryPhone",
							value: value.secondaryPhone ?? "",
							onChange: (e) => patch("secondaryPhone", e.target.value),
							placeholder: "+20 120 000 0000",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					}),
					showPersonalEmail && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-slate-300 block",
							children: isAr ? "البريد الإلكتروني الشخصي" : "Personal Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							disabled: lockPersonalEmail,
							name: "personalEmail",
							value: value.personalEmail ?? "",
							onChange: (e) => patch("personalEmail", e.target.value),
							placeholder: "name@domain.com",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 disabled:bg-slate-950/60 disabled:text-slate-400 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-slate-300 block",
							children: isAr ? "الرقم القومي / جواز السفر (للتحقق)" : "National ID / Passport Ref"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							name: "nationalId",
							value: value.nationalId ?? "",
							onChange: (e) => patch("nationalId", e.target.value),
							placeholder: isAr ? "اختياري للتحقق الإداري" : "Optional identity reference",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1 md:col-span-2 lg:col-span-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-slate-300 block",
							children: isAr ? "العنوان الشخصي / عنوان المراسلات" : "Personal / Correspondence Address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							name: "personalAddress",
							value: value.personalAddress ?? "",
							onChange: (e) => patch("personalAddress", e.target.value),
							placeholder: isAr ? "الشارع، الحي، المدينة، الدولة" : "Street, District, City, Country",
							className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
						})]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
			className: "rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("legend", {
					className: "px-2 inline-flex items-center gap-1.5 text-xs font-black text-amber-300",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
						className: "w-3.5 h-3.5",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "ثانياً: البيانات الخاصة بالشركة / المنشأة" : "2. Company & Organization Details" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-slate-300 block font-semibold",
								children: [isAr ? "اسم الشركة الرسمي (عربي)" : "Company Official Name", requireCompanyDetails ? " *" : ""]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: requireCompanyDetails,
								name: "organizationName",
								value: value.organizationName,
								onChange: (e) => patch("organizationName", e.target.value),
								placeholder: isAr ? "شركة ... للمشروعات الصناعية" : "Company Official Name",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "اسم الشركة (إنجليزي للتقارير)" : "Company Name (English)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "organizationNameEn",
								value: value.organizationNameEn ?? "",
								onChange: (e) => patch("organizationNameEn", e.target.value),
								placeholder: "e.g. Nile Delta Industrial Co.",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block font-semibold",
								children: isAr ? "القطاع الصناعي" : "Industry Sector"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "sector",
								value: value.sector ?? "",
								onChange: (e) => patch("sector", e.target.value),
								placeholder: isAr ? "بترول وغاز / طاقة / بتروكيماويات / مقاولات" : "Oil & Gas / Power / EPC",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "رقم السجل التجاري" : "Commercial Reg No."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "commercialRegNo",
								value: value.commercialRegNo ?? "",
								onChange: (e) => patch("commercialRegNo", e.target.value),
								placeholder: "CR-123456",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "رقم البطاقة الضريبية" : "Tax Card / VAT No."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "taxCardNo",
								value: value.taxCardNo ?? "",
								onChange: (e) => patch("taxCardNo", e.target.value),
								placeholder: "100-200-300",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "هاتف الشركة / الخط الأرضي" : "Company Official Phone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "tel",
								name: "companyPhone",
								value: value.companyPhone ?? "",
								onChange: (e) => patch("companyPhone", e.target.value),
								placeholder: "+20 2 0000 0000",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "البريد الرسمي للشركة" : "Corporate Email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								name: "companyEmail",
								value: value.companyEmail ?? "",
								onChange: (e) => patch("companyEmail", e.target.value),
								placeholder: "info@company.com",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "المدينة / المحافظة / الدولة" : "City / Governorate / Country"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "cityGovernorate",
								value: value.cityGovernorate ?? "",
								onChange: (e) => patch("cityGovernorate", e.target.value),
								placeholder: isAr ? "القاهرة / السويس / الجيزة، مصر" : "Cairo / Suez, Egypt",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "الموقع الإلكتروني للشركة (اختياري)" : "Company Website (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "url",
								autoComplete: "url",
								name: "website",
								value: value.website ?? "",
								onChange: (e) => patch("website", e.target.value),
								placeholder: "https://company.com",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1 md:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "عنوان مقر الشركة / موقع المصنع أو المشروع" : "Company HQ / Plant Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "companyAddress",
								value: value.companyAddress ?? "",
								onChange: (e) => patch("companyAddress", e.target.value),
								placeholder: isAr ? "المنطقة الصناعية، القطعة..." : "Industrial Zone, Plot...",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "كود الشركة (إن وُجد مسبقاً - اختياري)" : "Existing Company Code (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								name: "requestedCompanyCode",
								value: value.requestedCompanyCode ?? "",
								onChange: (e) => patch("requestedCompanyCode", sanitizeUpperCode(e.target.value)),
								placeholder: "INS-CO-0101",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1 md:col-span-2 lg:col-span-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 block",
								children: isAr ? "نطاق الأعمال والاختبارات المطلوبة (NDT / PWHT / خطوط / خزانات)" : "Primary Engineering Activities & Testing Scope"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 2,
								name: "activeScope",
								value: value.activeScope ?? "",
								onChange: (e) => patch("activeScope", e.target.value),
								placeholder: isAr ? "مثال: فحص لحامات خطوط البترول RT/PAUT والمعالجة الحرارية PWHT للغلايات والمبادلات..." : "e.g., Pipeline RT/PAUT weld inspection, PWHT heat treatment, tank integrity...",
								className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
							})]
						})
					]
				}),
				showAutoCreateCompanyToggle && value.requestedCompanyCode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-cyan-200",
					children: isAr ? "سيُحفظ الكود لطلب ربط ملف الشركة الموجود، من دون إنشاء ملف مكرر." : "This code will be saved for linking an existing company, without creating a duplicate dossier."
				}),
				showAutoCreateCompanyToggle && !value.requestedCompanyCode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						name: "autoCreateCompanyWorkspace",
						checked: Boolean(value.autoCreateCompanyWorkspace),
						onChange: (e) => patch("autoCreateCompanyWorkspace", e.target.checked),
						className: "mt-0.5 accent-emerald-500"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "block text-white",
						children: isAr ? "تكويد وتفعيل ملف الشركة داخل حسابي تلقائياً فور التسجيل" : "Automatically code & create my Company Workspace upon sign-up"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] text-emerald-200/80",
						children: isAr ? "ينشئ لك ملف شركة خاصاً برقم كودي فريد لإدارة الفنيين وتتبع الخرائط والتقارير فوراً." : "Generates a coded Company Dossier workspace so you can manage technicians, GPS maps, and reports immediately."
					})] })]
				})
			]
		})]
	});
};
//#endregion
//#region src/components/client/ClientAuthOnboardingCard.tsx
var EMPTY_DRAFT = {
	fullName: "",
	personalEmail: "",
	phone: "",
	jobTitle: "",
	nationalId: "",
	secondaryPhone: "",
	personalAddress: "",
	organizationName: "",
	organizationNameEn: "",
	sector: "Oil & Gas / Power",
	commercialRegNo: "",
	taxCardNo: "",
	companyPhone: "",
	companyEmail: "",
	website: "",
	companyAddress: "",
	cityGovernorate: "",
	activeScope: "",
	requestedCompanyCode: "",
	autoCreateCompanyWorkspace: true
};
var DRAFT_TEXT_FIELDS = Object.keys(EMPTY_DRAFT).filter((key) => key !== "autoCreateCompanyWorkspace");
function namedInput(fields, name) {
	const control = fields?.namedItem(name);
	return control && "tagName" in control && control.tagName === "INPUT" ? control : null;
}
function normalizeSignupWebsite(value) {
	const site = value?.trim() ?? "";
	if (!site) return "";
	try {
		const url = new URL(site.includes("://") ? site : `https://${site}`);
		return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".") && !url.username && !url.password ? url.href : null;
	} catch {
		return null;
	}
}
var ClientAuthOnboardingCard = ({ language, firebaseReady, authReady, onOpenCompanyPortal, initialMode = "signin", scope = "client", onRegistrationReady }) => {
	const isAr = language === "ar";
	const [mode, setMode] = (0, import_react.useState)(initialMode);
	const [provider, setProvider] = (0, import_react.useState)("email");
	const isRegister = mode === "register";
	const site = scope === "site";
	const collectProfile = isRegister && !site;
	const recaptchaId = (0, import_react.useId)();
	const emailForm = (0, import_react.useRef)(null);
	const registrationFields = (0, import_react.useRef)(null);
	const lastEmail = (0, import_react.useRef)("");
	const [rememberMe, setRememberMe] = (0, import_react.useState)(false);
	const [authPhone, setAuthPhone] = (0, import_react.useState)("");
	const [otpConfirmation, setOtpConfirmation] = (0, import_react.useState)(null);
	const [otpCode, setOtpCode] = (0, import_react.useState)("");
	const [draft, setDraft] = (0, import_react.useState)(EMPTY_DRAFT);
	const [action, setAction] = (0, import_react.useState)(null);
	const [failure, setFailure] = (0, import_react.useState)(null);
	const [infoMsg, setInfoMsg] = (0, import_react.useState)(null);
	const canSubmit = firebaseReady && authReady && !action;
	const submitting = action === "auth";
	const sendingOtp = action === "sms";
	const targetPhone = collectProfile ? draft.phone : authPhone;
	const reportError = (message, input) => setFailure({
		message,
		input
	});
	const clearMessages = () => {
		setFailure(null);
		setInfoMsg(null);
	};
	const clearOtp = () => {
		setOtpConfirmation(null);
		setOtpCode("");
	};
	const emailInput = (name) => namedInput(emailForm.current?.elements, name);
	const emailField = () => emailInput("username");
	const profileInput = (field) => namedInput(registrationFields.current?.elements, field);
	const switchAuthView = () => {
		const field = emailField();
		if (field) lastEmail.current = field.value;
		clearMessages();
		clearOtp();
	};
	const updateDraft = (next) => {
		if (next.phone !== draft.phone) clearOtp();
		setDraft(next);
	};
	const captureDraft = () => {
		const next = { ...draft };
		for (const field of DRAFT_TEXT_FIELDS) {
			const input = profileInput(field);
			if (input) next[field] = input.value;
		}
		next.autoCreateCompanyWorkspace = profileInput("autoCreateCompanyWorkspace")?.checked ?? next.autoCreateCompanyWorkspace;
		setDraft(next);
		return next;
	};
	const validateDraft = (input) => {
		const phone = normalizePhoneDigits(input.phone).trim();
		const issue = (field, ar, en) => {
			reportError(isAr ? ar : en, profileInput(field));
			return null;
		};
		if (input.fullName.trim().length < 2) return issue("fullName", "اكتب الاسم الكامل للمفوّض.", "Enter the representative’s full name.");
		if (phone.replace(/\D/g, "").length < 5) return issue("phone", "اكتب رقم الهاتف الأساسي بالأرقام.", "Enter a valid primary phone number.");
		if (input.organizationName.trim().length < 2) return issue("organizationName", "اكتب اسم الشركة الرسمي.", "Enter the official company name.");
		if (profileInput("personalEmail")?.validity.typeMismatch) return issue("personalEmail", "صحّح البريد الشخصي أو اترك الحقل الاختياري فارغاً.", "Correct the personal email or leave the optional field blank.");
		if (profileInput("companyEmail")?.validity.typeMismatch) return issue("companyEmail", "صحّح بريد الشركة أو اترك الحقل الاختياري فارغاً.", "Correct the company email or leave the optional field blank.");
		const website = normalizeSignupWebsite(input.website);
		if (website === null) return issue("website", "اكتب موقع الشركة بشكل صحيح (مثال: www.company.com) أو اتركه فارغاً.", "Enter a valid company website (e.g. www.company.com) or leave it blank.");
		return {
			...input,
			phone,
			website
		};
	};
	const handOffDraft = (signedUser, details, accountEmail) => {
		onRegistrationReady(signedUser, {
			...details,
			fullName: details.fullName.trim(),
			personalEmail: (accountEmail ?? (details.personalEmail?.trim() || signedUser.email || "")).trim(),
			phone: (signedUser.phoneNumber || details.phone).trim()
		}, accountEmail !== void 0);
	};
	const handleGoogleAction = async () => {
		if (!canSubmit) return;
		clearMessages();
		const details = collectProfile ? validateDraft(captureDraft()) : null;
		if (collectProfile && !details) return;
		setAction("auth");
		try {
			const signedUser = await signInClientPortalWithGoogle(rememberMe);
			if (details) handOffDraft(signedUser, details);
		} catch (err) {
			reportError(formatFirebaseAuthError(err, language));
		} finally {
			setAction(null);
		}
	};
	const handleEmailSubmit = async (e) => {
		e.preventDefault();
		if (!canSubmit) return;
		clearMessages();
		const liveDraft = collectProfile ? captureDraft() : null;
		const fields = new FormData(e.currentTarget);
		const email = String(fields.get("username") ?? "").trim();
		const password = String(fields.get("password") ?? "");
		if (!email || !emailField()?.validity.valid) {
			reportError(isAr ? "اكتب بريد الحساب بشكل صحيح." : "Enter a valid account email address.", emailField());
			return;
		}
		if (!password) {
			reportError(isAr ? "اكتب كلمة المرور." : "Enter your password.", emailInput("password"));
			return;
		}
		if (isRegister && password.length < 6) {
			reportError(isAr ? "استخدم كلمة مرور من 6 أحرف على الأقل." : "Use a password of at least 6 characters.", emailInput("password"));
			return;
		}
		if (isRegister && password !== fields.get("confirm-password")) {
			reportError(isAr ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.", emailInput("confirm-password"));
			return;
		}
		const details = liveDraft ? validateDraft(liveDraft) : null;
		if (collectProfile && !details) return;
		setAction("auth");
		try {
			if (isRegister) {
				const createdUser = await signUpClientPortalWithEmail(email, password, rememberMe);
				if (details) handOffDraft(createdUser, details, createdUser.email || email);
				else onRegistrationReady(createdUser, null, true);
			} else await signInClientPortalWithEmail(email, password, rememberMe);
		} catch (err) {
			const message = formatFirebaseAuthError(err, language);
			setFailure({
				message: isRegister ? `${isAr ? "تعذّر إنشاء الحساب." : "Could not create the account."} ${message}` : message,
				recoverSignIn: isRegister && err?.code === "auth/email-already-in-use"
			});
		} finally {
			setAction(null);
		}
	};
	const handlePasswordReset = async () => {
		if (!canSubmit) return;
		clearMessages();
		const field = emailField();
		if (!field?.value.trim() || !field.validity.valid) {
			reportError(isAr ? "اكتب بريد الحساب بشكل صحيح أولاً، ثم اضغط «نسيت كلمة المرور؟»." : "Enter a valid account email first, then select “Forgot password?”.");
			field?.focus();
			return;
		}
		setAction("reset");
		try {
			await sendClientPasswordReset(field.value);
			setInfoMsg(isAr ? "إذا كان البريد مرتبطاً بحساب، سيصلك رابط لإعادة تعيين كلمة المرور. راجع الوارد والبريد غير المرغوب فيه." : "If this email belongs to an account, you will receive a reset link. Check your inbox and spam folder.");
		} catch (err) {
			reportError(formatFirebaseAuthError(err, language));
		} finally {
			setAction(null);
		}
	};
	const handleSendPhoneOtp = async () => {
		if (!canSubmit) return;
		clearMessages();
		const details = collectProfile ? validateDraft(captureDraft()) : null;
		if (collectProfile && !details) return;
		setAction("sms");
		try {
			const confirmation = await sendClientPhoneOtp(details?.phone ?? targetPhone, recaptchaId, rememberMe);
			setOtpConfirmation(confirmation);
			setOtpCode("");
			setInfoMsg(isAr ? "تم إرسال رمز التحقق SMS إلى رقم هاتفك. أدخل الكود المكون من 6 أرقام أدناه." : "SMS verification code sent. Enter the 6-digit OTP code below.");
		} catch (err) {
			reportError(formatFirebaseAuthError(err, language));
		} finally {
			setAction(null);
		}
	};
	const handleVerifyPhoneOtp = async (e) => {
		e.preventDefault();
		if (!canSubmit || !otpConfirmation) return;
		clearMessages();
		const code = normalizePhoneDigits(otpCode).trim();
		if (!/^\d{6}$/.test(code)) {
			reportError(isAr ? "أدخل رمز التحقق من 6 أرقام." : "Enter the 6-digit SMS verification code.");
			return;
		}
		const details = collectProfile ? validateDraft(captureDraft()) : null;
		if (collectProfile && !details) return;
		setAction("auth");
		try {
			const cred = await otpConfirmation.confirm(code);
			if (details) handOffDraft(cred.user, details);
		} catch (err) {
			reportError(formatFirebaseAuthError(err, language));
		} finally {
			setAction(null);
		}
	};
	const feedback = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		!firebaseReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			role: "alert",
			className: "rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200",
			children: isAr ? "خدمة تسجيل دخول العملاء غير متاحة حالياً. حاول لاحقاً أو تواصل مع الدعم." : "Client sign-in is unavailable. Try again later or contact support."
		}),
		failure && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "alert",
			className: "rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: failure.message }),
				failure.input && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-cyan-200 font-bold underline",
					onClick: () => {
						failure.input?.focus({ preventScroll: true });
						failure.input?.scrollIntoView?.({ block: "center" });
					},
					children: isAr ? "راجع الحقل" : "Review field"
				}),
				failure.recoverSignIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-cyan-200 font-bold underline",
					onClick: () => {
						switchAuthView();
						setMode("signin");
						emailForm.current?.scrollIntoView?.({ block: "center" });
					},
					children: isAr ? "ادخل بالبريد نفسه" : "Sign in with this email"
				})
			]
		}),
		infoMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "status",
			className: "flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
				className: "w-4 h-4 shrink-0",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: infoMsg })]
		})
	] });
	const rememberOption = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-start gap-2.5 text-xs text-slate-300",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "checkbox",
			name: "remember-session",
			checked: rememberMe,
			disabled: Boolean(action) || provider === "phone" && Boolean(otpConfirmation),
			onChange: (e) => setRememberMe(e.target.checked),
			className: "mt-0.5 accent-cyan-500"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "block text-slate-100",
			children: isAr ? "ابقني مسجّلاً على هذا الجهاز" : "Keep me signed in on this device"
		}), isAr ? "استخدمه على جهازك الخاص فقط. هذا الخيار لا يحفظ كلمة المرور." : "Use only on a private device. This does not save your password."] })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "client-auth-onboarding-card",
		className: site ? "space-y-4" : "max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-8 space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, {
								className: "w-4 h-4",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: site ? isAr ? "حساب واحد لكل الأقسام" : "One account for every section" : isAr ? "بوابة عملاء ومجتمع أعمال إنسكو" : "INSCO Client & Business Community Portal" })]
						}),
						site ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-black text-white",
							children: isRegister ? isAr ? "إنشاء حساب إنسكو" : "Create your INSCO account" : isAr ? "تسجيل الدخول إلى إنسكو" : "Sign in to INSCO"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl sm:text-2xl font-black text-white",
							children: mode === "register" ? isAr ? "إنشاء حساب عميل جديد بالبيانات الشخصية وبيانات الشركة" : "Create Client Account with Full Personal & Company Details" : isAr ? "تسجيل الدخول إلى بوابة العملاء والملفات" : "Sign In to Client & Company Dossier Portal"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs sm:text-sm text-slate-300",
							children: site ? isAr ? "نفس الحساب للشركة والعملاء والأكاديمية والمجتمع. تقدر تضيف بيانات ملفك بعد التفعيل." : "Use the same account for Company, Clients, Academy, and Community. Add profile details after verification." : isAr ? "اختر وسيلة التوثيق المناسبة (البريد الإلكتروني، رقم التليفون SMS، أو حساب Google) وسجّل جميع بياناتك الشخصية وبيانات شركتك مباشرة." : "Authenticate via Email, Phone SMS OTP, or Google Account while recording full personal & corporate profile information."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "tablist",
					"aria-label": isAr ? "وضع الدخول والتسجيل" : "Authentication Mode",
					className: "grid w-full grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs sm:w-auto lg:shrink-0 self-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "tab",
						"aria-selected": mode === "register",
						disabled: Boolean(action),
						onClick: () => {
							if (mode === "register") return;
							switchAuthView();
							setMode("register");
						},
						className: `inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center font-bold transition cursor-pointer sm:whitespace-nowrap sm:px-3.5 ${mode === "register" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, {
							className: "w-3.5 h-3.5 shrink-0",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "إنشاء حساب جديد" : "Create Account" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "tab",
						"aria-selected": mode === "signin",
						disabled: Boolean(action),
						onClick: () => {
							if (mode === "signin") return;
							switchAuthView();
							setMode("signin");
						},
						className: `inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center font-bold transition cursor-pointer sm:whitespace-nowrap sm:px-3.5 ${mode === "signin" ? "bg-cyan-600 text-white" : "text-slate-300 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, {
							className: "w-3.5 h-3.5 shrink-0",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تسجيل الدخول" : "Sign In" })]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs font-bold text-slate-400",
					children: isAr ? "اختر طريقة التسجيل / الدخول:" : "Choose Sign-In / Registration Method:"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs",
					children: [
						{
							id: "email",
							ar: "البريد الإلكتروني وكلمة المرور",
							en: "Email & Password",
							Icon: Mail
						},
						{
							id: "phone",
							ar: "رقم التليفون (رمز تحقق SMS)",
							en: "Phone Number (SMS OTP)",
							Icon: Phone
						},
						{
							id: "google",
							ar: "حساب Google السريع",
							en: "Google Account",
							Icon: ShieldCheck
						}
					].map((item) => {
						const active = provider === item.id;
						const Icon = item.Icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"data-testid": `auth-method-tab-${item.id}`,
							"aria-pressed": active,
							disabled: Boolean(action),
							onClick: () => {
								if (provider === item.id) return;
								switchAuthView();
								setProvider(item.id);
							},
							className: `flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 font-bold transition cursor-pointer ${active ? "border-cyan-500 bg-cyan-500/15 text-cyan-200" : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:text-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "w-4 h-4 shrink-0",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? item.ar : item.en })]
						}, item.id);
					})
				})]
			}),
			collectProfile && provider !== "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("fieldset", {
				ref: registrationFields,
				disabled: Boolean(action),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientRegistrationFormFields, {
					language,
					value: draft,
					onChange: updateDraft,
					showAutoCreateCompanyToggle: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4",
				children: [
					provider === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						ref: emailForm,
						method: "post",
						noValidate: true,
						"aria-busy": submitting,
						onSubmit: (e) => void handleEmailSubmit(e),
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-black text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
									className: "w-4 h-4 text-cyan-400",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mode === "register" ? isAr ? "بيانات الدخول بالبريد الإلكتروني وكلمة المرور" : "Email & Password Account Credentials" : isAr ? "تسجيل الدخول بالبريد الإلكتروني" : "Sign In with Email & Password" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: site ? "grid min-w-0 grid-cols-1 gap-3 text-xs" : "grid grid-cols-1 md:grid-cols-3 gap-3 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-300 block font-semibold",
											children: isAr ? "البريد الإلكتروني للحساب *" : "Account Email *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "email",
											name: "username",
											autoComplete: "username",
											autoCapitalize: "none",
											spellCheck: false,
											dir: "ltr",
											required: true,
											defaultValue: lastEmail.current || (isRegister ? draft.personalEmail : ""),
											placeholder: "client@company.com",
											className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-300 block font-semibold",
											children: isAr ? "كلمة المرور *" : "Password *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "password",
											name: "password",
											autoComplete: isRegister ? "new-password" : "current-password",
											dir: "ltr",
											required: true,
											minLength: isRegister ? 6 : void 0,
											placeholder: "••••••",
											className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
										})]
									}),
									mode === "register" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-300 block font-semibold",
											children: isAr ? "تأكيد كلمة المرور *" : "Confirm Password *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "password",
											name: "confirm-password",
											autoComplete: "new-password",
											dir: "ltr",
											required: true,
											minLength: 6,
											placeholder: "••••••",
											className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
										})]
									})
								]
							}),
							collectProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("fieldset", {
								ref: registrationFields,
								disabled: Boolean(action),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientRegistrationFormFields, {
									language,
									value: draft,
									onChange: updateDraft,
									showPersonalEmail: false,
									showAutoCreateCompanyToggle: true
								})
							}),
							collectProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-300",
								children: isAr ? "الحقول بعلامة * مطلوبة فقط. باقي البيانات تقدر تضيفها بعد تفعيل حسابك." : "Only fields marked * are required. You can add other details after verifying your account."
							}),
							isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountPrivacyNotice, { language }),
							rememberOption,
							feedback,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: !canSubmit,
									className: "inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 transition cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
										className: "w-4 h-4",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: submitting ? isAr ? isRegister ? "جاري إنشاء الحساب…" : "جاري تسجيل الدخول…" : isRegister ? "Creating the account…" : "Signing in…" : mode === "register" ? isAr ? "إنشاء الحساب وإرسال رابط التفعيل" : "Create Account & Send Verification Link" : isAr ? "دخول بالبريد الإلكتروني" : "Sign In with Email" })]
								}), mode === "signin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !canSubmit,
									onClick: () => void handlePasswordReset(),
									className: "text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 cursor-pointer",
									children: action === "reset" ? isAr ? "جاري طلب الرابط…" : "Requesting link…" : isAr ? "نسيت كلمة المرور؟" : "Forgot password?"
								})]
							})
						]
					}, mode),
					provider !== "email" && isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountPrivacyNotice, { language }),
					provider !== "email" && rememberOption,
					provider === "phone" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-black text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
									className: "w-4 h-4 text-emerald-400",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "التسجيل والدخول عبر رقم التليفون برسالة تأكيد SMS" : "Phone Number Registration & Sign-In via SMS OTP" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-xs items-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-300 block font-semibold",
										children: isAr ? "رقم الموبايل بالصيغة الدولية (+20...) *" : "International Mobile Number *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "tel",
										autoComplete: "tel",
										disabled: Boolean(action),
										value: targetPhone,
										onChange: (e) => {
											clearOtp();
											if (collectProfile) setDraft({
												...draft,
												phone: e.target.value
											});
											else setAuthPhone(e.target.value);
										},
										placeholder: "+201000000000",
										className: "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: !canSubmit,
									onClick: () => void handleSendPhoneOtp(),
									className: "inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-black text-white transition cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
										className: "w-3.5 h-3.5",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: sendingOtp ? isAr ? "جاري الإرسال..." : "Sending SMS..." : otpConfirmation ? isAr ? "إعادة إرسال رمز التحقق" : "Resend SMS Code" : isAr ? "إرسال رمز التحقق SMS" : "Send SMS Verification Code" })]
								}) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: recaptchaId }),
							feedback,
							otpConfirmation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: (e) => void handleVerifyPhoneOtp(e),
								className: "flex flex-wrap items-end gap-3 border-t border-slate-800 pt-3 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "space-y-1 flex-1 min-w-[200px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-300 block font-semibold",
										children: isAr ? "أدخل رمز التحقق (6 أرقام)" : "Enter 6-digit SMS Code"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										inputMode: "numeric",
										autoComplete: "one-time-code",
										required: true,
										value: otpCode,
										onChange: (e) => setOtpCode(e.target.value),
										placeholder: "123456",
										className: "w-full rounded-lg border border-cyan-500/50 bg-slate-900 px-3 py-2 font-mono text-sm tracking-widest text-white focus:outline-none"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: !canSubmit,
									className: "inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
										className: "w-4 h-4",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: submitting ? isAr ? "جاري التحقق..." : "Verifying..." : collectProfile ? isAr ? "تأكيد الرمز وحفظ البيانات" : "Verify OTP & Save Profile" : isAr ? "تأكيد والدخول" : "Verify & Sign In" })]
								})]
							})
						]
					}),
					provider === "google" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "basis-full empty:hidden",
								children: feedback
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-slate-300",
								children: site ? isAr ? "استخدم نفس طريقة الدخول كل مرة علشان تفتح حسابك الحالي." : "Use your original sign-in method to return to the same account." : mode === "register" ? isAr ? "بعد استكمال بياناتك الشخصية وبيانات الشركة أعلاه، اضغط لتوثيق الحساب عبر Google وحفظ الملف فوراً." : "After completing your Personal & Company details above, click to authenticate with Google and save your profile immediately." : isAr ? "سجّل الدخول مباشرة بحساب Google المرتبط بملف شركتك." : "Sign in directly with the Google account linked to your company dossier."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-testid": "client-portal-google-signin",
								disabled: !canSubmit,
								onClick: () => void handleGoogleAction(),
								className: "inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 transition cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, {
									className: "w-4 h-4",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: submitting ? isAr ? "جاري التوثيق..." : "Authenticating..." : collectProfile ? isAr ? "توثيق بحساب Google وحفظ جميع البيانات" : "Register with Google & Save All Details" : isAr ? "تسجيل الدخول بحساب Google" : "Sign In with Google" })]
							})
						]
					})
				]
			}),
			onOpenCompanyPortal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between gap-3 pt-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onOpenCompanyPortal,
					className: "rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer",
					children: isAr ? "العودة لبوابة الشركة" : "Back to Corporate Portal"
				})
			})
		]
	});
};
//#endregion
export { ClientAuthOnboardingCard, ClientRegistrationFormFields as t };
