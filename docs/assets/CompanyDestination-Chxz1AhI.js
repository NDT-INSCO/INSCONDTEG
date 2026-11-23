const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CompanyServicesSection-Du0cD4EU.js","assets/rolldown-runtime-oLLnCvco.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/circle-check-C1rtQ7NC.js","assets/src-CFjF8TB-.js","assets/flame-DuWslMqX.js","assets/map-pin-CwI3o0GO.js","assets/navigation-Cjrfrd5q.js","assets/plus-CZjdWV3u.js","assets/rotate-ccw-wuxYnQna.js","assets/shield-check-BseoenC-.js","assets/index-BKrODMj6.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css","assets/CompanyFleetInspector-7Yj97Y8t.js","assets/CompanyCertificationsSection-DDZOzNHr.js","assets/CompanyStandardsMatrix-B4eca1VI.js","assets/file-check-DxS4P9sC.js","assets/CompanyProjectsSection-CfWY-7fm.js","assets/briefcase-Dv_sjYzX.js","assets/earth-aTDIeEqj.js","assets/CompanyTestimonialsSection-BXcnSJv0.js","assets/CompanyVendorVaultSection-C4zxU7Lj.js","assets/list-checks-3PdhwBZP.js","assets/CompanyFieldTools-B4xRmRTx.js","assets/clock-B9C0lWAm.js","assets/EmployeeAttendanceTimeline-BU6VPQGO.js","assets/jspdf.es.min-Cjiilahk.js","assets/firestoreClientService-BUGkAdZ4.js","assets/index.esm-T7XjjJ2p.js","assets/config-BaEX8mXf.js","assets/CompanyQuotePage-BTFkNhEz.js","assets/film-DtNt53Rt.js","assets/calendar-Dz5HIQpk.js","assets/loader-circle-BuW2oL63.js","assets/trainingSyllabusGenerator--OIk2uTQ.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Cn as ArrowRight, N as AccountPrivacyNotice, lt as INSCO_COMPANY_DATA, ot as SectionHeading, p as COMPANY_DETAILS, st as CtaButton, t as CompanyAnchor, wn as ArrowLeft } from "./index-BKrODMj6.js";
//#region src/components/company/CompanyDestination.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var Services = import_react.lazy(() => __vitePreload(() => import("./CompanyServicesSection-Du0cD4EU.js").then((m) => ({ default: m.CompanyServicesSection })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])));
var Equipment = import_react.lazy(() => __vitePreload(() => import("./CompanyFleetInspector-7Yj97Y8t.js").then((m) => ({ default: m.CompanyFleetInspector })), __vite__mapDeps([16,1,2,3,4,11,12,13,14,15])));
var Certifications = import_react.lazy(() => __vitePreload(() => import("./CompanyCertificationsSection-DDZOzNHr.js").then((m) => ({ default: m.CompanyCertificationsSection })), __vite__mapDeps([17,1,2,11,3,12,13,14,15])));
var Standards = import_react.lazy(() => __vitePreload(() => import("./CompanyStandardsMatrix-B4eca1VI.js").then((m) => ({ default: m.CompanyStandardsMatrix })), __vite__mapDeps([18,1,2,4,3,19,6,12,11,13,14,15])));
var Projects = import_react.lazy(() => __vitePreload(() => import("./CompanyProjectsSection-CfWY-7fm.js").then((m) => ({ default: m.CompanyProjectsSection })), __vite__mapDeps([20,1,2,21,3,22,12,11,13,14,15])));
var Testimonials = import_react.lazy(() => __vitePreload(() => import("./CompanyTestimonialsSection-BXcnSJv0.js").then((m) => ({ default: m.CompanyTestimonialsSection })), __vite__mapDeps([23,1,2,12,3,11,13,14,15])));
var Dossier = import_react.lazy(() => __vitePreload(() => import("./CompanyVendorVaultSection-C4zxU7Lj.js").then((m) => ({ default: m.CompanyVendorVaultSection })), __vite__mapDeps([24,1,2,25,3,12,11,13,14,15])));
var FieldTools = import_react.lazy(() => __vitePreload(() => import("./CompanyFieldTools-B4xRmRTx.js").then((m) => ({ default: m.CompanyFieldTools })), __vite__mapDeps([26,1,2,27,3,28,4,7,12,11,13,14,15,29,30,31,32,8,10])));
var Quote = import_react.lazy(() => __vitePreload(() => import("./CompanyQuotePage-BTFkNhEz.js").then((m) => ({ default: m.CompanyQuotePage })), __vite__mapDeps([33,1,2,34,3,35,4,27,36,7,10,11,12,13,14,15,37])));
var COPY = {
	about: {
		ar: "تعرّف على نشاط إنسكو والقطاعات التي يغطيها سجل الشركة.",
		en: "Get to know INSCO and the sectors in the company profile.",
		next: "services"
	},
	services: {
		ar: "قارن طرق الفحص والمعالجة الحرارية والخدمات المساندة ثم افتح تفاصيل الخدمة المناسبة.",
		en: "Compare inspection, heat treatment and related services before choosing a scope.",
		next: "equipment"
	},
	equipment: {
		ar: "راجع مواصفات الأجهزة وسجل المعايرة. اسألنا عن توافر المعدة لمشروعك.",
		en: "Review instrument capabilities and calibration records, then ask about availability for your scope.",
		next: "projects"
	},
	quality: {
		ar: "راجع نطاق الوثائق والمراجع الفنية، واطلب نسخة سارية عند التأهيل.",
		en: "Review the documented scope and technical references. Ask for current copies for qualification.",
		next: "dossier"
	},
	projects: {
		ar: "اطّلع على نطاق الأعمال في ملف الشركة وافصل السجلات المنشورة عن الأمثلة التوضيحية.",
		en: "See the scope in the company profile and distinguish published records from examples.",
		next: "quote"
	},
	dossier: {
		ar: "ملف الشركة والملاحق المستخدمة في تأهيل الموردين.",
		en: "The company profile and annexes for vendor qualification.",
		next: "quote"
	},
	quote: {
		ar: "ناقش نطاق العمل مع الفريق الفني أو أرسل طلبًا إذا كانت قناة الاستلام متاحة.",
		en: "Discuss your scope with the technical team or send a request when online intake is available."
	},
	field: {
		ar: "روابط ملفات الفحص وأدوات الحضور تبعًا لصلاحيات بوابة العملاء، وليست سجلاً عامًا للعميل.",
		en: "Inspector shortcuts and attendance tools use the client portal’s existing permissions."
	},
	privacy: {
		ar: "ما الذي يحفظه حساب إنسكو الموحّد ومن يستطيع فتح الملف الخاص.",
		en: "What the INSCO account stores and who can access the private profile."
	}
};
var SECTORS = {
	ar: [
		"الطاقة ومحطات التوليد",
		"البترول والغاز",
		"الإنشاءات والمشروعات الصناعية"
	],
	en: [
		"Power & generation",
		"Oil & gas",
		"Industrial construction"
	]
};
function CompanyDestination({ language, detail, anchor, quoteService, onOpen, onOpenService, onOpenDemo, onOpenClient, onOpenDossier, onOpenAcademy }) {
	const isAr = language === "ar";
	const title = COMPANY_DETAILS[detail][language];
	const next = COPY[detail].next;
	const Back = isAr ? ArrowRight : ArrowLeft;
	const Forward = isAr ? ArrowLeft : ArrowRight;
	const target = anchor === COMPANY_DETAILS[detail].hash || /^(contact|vendor|capabilities)$/.test(anchor) ? void 0 : anchor;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-company-detail": detail,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-slate-800 bg-slate-950",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CtaButton, {
						variant: "ghost",
						size: "sm",
						onClick: () => onOpen(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Back, {
							className: "size-4 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "رئيسية الشركة" : "Company home"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
						as: "h1",
						className: "mt-3",
						eyebrow: isAr ? "شركة إنسكو" : "INSCO Corporate",
						title,
						description: COPY[detail][language]
					})]
				})
			}),
			detail === "about" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6",
				id: "about",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold text-white",
						children: INSCO_COMPANY_DATA.name[language]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-prose text-slate-300",
						children: INSCO_COMPANY_DATA.tagline[language]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "industries",
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-white",
							children: isAr ? "القطاعات" : "Industries"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid gap-3 sm:grid-cols-3",
							children: SECTORS[language].map((sector) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "rounded-xl border border-slate-700 px-4 py-3",
								children: sector
							}, sector))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaButton, {
							href: INSCO_COMPANY_DATA.pdfBrochureUrl,
							external: true,
							variant: "secondary",
							children: isAr ? "ملف الشركة (PDF)" : "Company profile (PDF)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaButton, {
							variant: "ghost",
							onClick: () => onOpen("certifications"),
							children: isAr ? "الجودة والشهادات" : "Quality & certifications"
						})]
					})
				]
			}),
			detail === "services" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Services, {
				language,
				onNavigateToAcademyModule: onOpenAcademy,
				onOpenService,
				onOpenDemo
			}),
			detail === "equipment" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Equipment, { language }),
			detail === "quality" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Certifications, { language }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Standards, { language })] }),
			detail === "projects" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Projects, { language }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Testimonials, { language })] }),
			detail === "dossier" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dossier, { language }),
			detail === "quote" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quote, {
				language,
				anchor,
				quoteService
			}),
			detail === "field" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldTools, {
				language,
				onOpenClient,
				onOpenDossier
			}),
			detail === "privacy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-7xl px-4 py-8 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountPrivacyNotice, { language }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaButton, {
					className: "mt-5",
					variant: "secondary",
					onClick: () => onOpenClient("register"),
					children: isAr ? "ملف الحساب الخاص" : "Private account profile"
				})]
			}),
			next && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				"aria-label": isAr ? "الخطوة التالية" : "Next step",
				className: "mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-7 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CtaButton, {
					onClick: () => onOpen(COMPANY_DETAILS[next].hash),
					children: [
						COMPANY_DETAILS[next][language],
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Forward, {
							className: "size-4 shrink-0",
							"aria-hidden": "true"
						})
					]
				}), next !== "quote" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaButton, {
					variant: "secondary",
					onClick: () => onOpen("rfq"),
					children: isAr ? "اطلب عرض سعر" : "Request a quote"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyAnchor, { id: target })
		]
	});
}
//#endregion
export { CompanyDestination };
