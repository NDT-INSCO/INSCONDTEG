import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as Briefcase } from "./briefcase-Dv_sjYzX.js";
import { t as Earth } from "./earth-aTDIeEqj.js";
import { gn as Building2, lt as INSCO_COMPANY_DATA, ot as SectionHeading } from "./index-BKrODMj6.js";
//#region src/components/company/CompanyProjectsSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var CompanyProjectsSection = ({ language }) => {
	const isAr = language === "ar";
	const [activeTab, setActiveTab] = (0, import_react.useState)("clients");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "projects",
		className: "py-16 border-b border-slate-800 bg-slate-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
						eyebrow: isAr ? "المشروعات ونطاقات العمل" : "Projects and scopes",
						title: isAr ? "سابقة الأعمال في ملف إنسكو" : "Work history from the INSCO dossier",
						description: isAr ? "الأمثلة ونطاقات العمل من ملف الشركة المنشور، وليست دليلًا على تعاقد أو توافر حالي." : "Examples and scopes are from the company dossier. They do not establish a current contract or availability."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex max-w-full flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": activeTab === "clients",
							onClick: () => setActiveTab("clients"),
							className: `px-4 py-2 text-xs font-medium rounded-md transition cursor-pointer ${activeTab === "clients" ? "bg-sky-300 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`,
							children: isAr ? "العملاء والمشروعات" : "Key Clients & Contracts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": activeTab === "facilities",
							onClick: () => setActiveTab("facilities"),
							className: `px-4 py-2 text-xs font-medium rounded-md transition cursor-pointer ${activeTab === "facilities" ? "bg-sky-300 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`,
							children: isAr ? "المنشآت ومحطات الطاقة" : "Major Facilities Served"
						})]
					})]
				}),
				activeTab === "clients" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
					children: INSCO_COMPANY_DATA.clients.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition space-y-3 flex flex-col justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono font-bold text-cyan-400",
									children: item.client
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-mono text-slate-500",
									children: item.country
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-white",
								children: item.project[language]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-3 border-t border-slate-800/80 text-xs text-slate-300",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] font-mono uppercase text-slate-400 mb-1",
								children: isAr ? "نطاق الأعمال المنفذة:" : "Scope Executed:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: item.activities[language] })]
						})]
					}, idx))
				}),
				activeTab === "facilities" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
					children: INSCO_COMPANY_DATA.facilities.map((facility, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-cyan-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono font-semibold",
									children: facility.clientOrContractor
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-white",
								children: facility.name[language]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 pt-3 border-t border-slate-800/80 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-slate-300",
								children: facility.scope[language]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-slate-400 font-mono text-[11px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: facility.location[language] })]
							})]
						})]
					}, idx))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 rounded-lg border border-slate-800 bg-slate-900/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "w-6 h-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-bold text-white",
							children: isAr ? "راجع الملاحق واطلب مستندات التأهيل" : "Review the dossier and request current qualification documents"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-slate-400 mt-0.5",
							children: isAr ? "سجل الأعمال في الصفحتين 11–12. يسرد فهرس الملاحق مراجع الخطابات وأوامر التوريد." : "The work history is on pages 11–12. The annex index lists historical references and purchase orders."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `${INSCO_COMPANY_DATA.pdfBrochureUrl}#page=14`,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition",
						children: isAr ? "افتح فهرس الملاحق (PDF)" : "Open annex index (PDF)"
					})]
				})
			]
		})
	});
};
//#endregion
export { CompanyProjectsSection };
