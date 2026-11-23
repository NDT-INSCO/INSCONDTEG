import "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { in as ExternalLink, lt as INSCO_COMPANY_DATA, ot as SectionHeading, xn as Award } from "./index-BKrODMj6.js";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var CompanyCertificationsSection = ({ language }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "certifications",
		className: "py-16 border-b border-slate-800 bg-slate-900/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					className: "mb-12",
					eyebrow: isAr ? "الجودة والتأهيل المؤسسي" : "Quality and vendor qualification",
					title: isAr ? "الشهادات والتراخيص الواردة في ملف الشركة" : "Certificates and licences in the company dossier",
					description: isAr ? "بيانات الشهادات من النسخة المنشورة من ملف إنسكو. تحقّق من سريانها ونطاقها مع الجهة المصدرة قبل التأهيل أو التعاقد." : "These records are from the published INSCO dossier. Confirm current status and scope with the issuing body before qualification or contracting."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-12",
					children: INSCO_COMPANY_DATA.certifications.map((cert, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-slate-800 bg-slate-950/70 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800",
										children: cert.code
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] font-mono text-slate-400",
										children: [
											isAr ? "انتهاء مدوّن:" : "Listed expiry:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: cert.expiryDate })
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-base font-bold text-white",
									children: cert.title[language]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-slate-300 leading-relaxed",
									children: cert.scope[language]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-slate-800/80 pt-3 space-y-1 text-[11px] font-mono text-slate-400",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "رقم الشهادة:" : "Cert No:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-200",
										children: cert.certNo
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "جهة الاعتماد:" : "Accreditation:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-cyan-300 font-semibold",
										children: cert.accreditationBody
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: "inline-flex min-h-9 items-center gap-1 font-semibold text-cyan-300 underline underline-offset-4",
									href: `${INSCO_COMPANY_DATA.pdfBrochureUrl}#page=${15 + index}`,
									target: "_blank",
									rel: "noopener noreferrer",
									children: [isAr ? `وثيقة ${cert.code} في الملف (PDF)` : `${cert.code} in the dossier (PDF)`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
										className: "h-3.5 w-3.5",
										"aria-hidden": "true"
									})]
								})
							]
						})]
					}, cert.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-slate-800 bg-slate-950/80 p-6 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-6 h-6" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-base font-bold text-white",
									children: INSCO_COMPANY_DATA.leadAuditor.title[language]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-cyan-400 font-mono",
									children: INSCO_COMPANY_DATA.leadAuditor.body
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-300 leading-relaxed",
								children: INSCO_COMPANY_DATA.leadAuditor.scope[language]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#contact",
								className: "inline-flex min-h-9 items-center text-xs font-semibold text-cyan-300 underline underline-offset-4",
								children: isAr ? "اطلب وثائق التأهيل الحالية" : "Request current personnel qualifications"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-slate-800 bg-slate-950/80 p-6 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-6 h-6" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-base font-bold text-white",
									children: isAr ? "ترخيص هيئة الرقابة النووية والإشعاعية (ENRRA)" : "Egyptian Nuclear & Radiological Regulatory Authority (ENRRA)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-cyan-400 font-mono",
									children: isAr ? "المصدر: الملحق C في ملف الشركة" : "Source: company dossier, Annex C"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-300 leading-relaxed",
								children: isAr ? "الملحق يفهرس وثائق التصوير الإشعاعي الصناعي؛ النسخ غير متاحة للعامة. اطلب الترخيص الحالي وتحقق من نطاقه قبل العمل." : "The annex indexes industrial radiography records. Request the current licence and confirm its scope; the scans are not distributed publicly."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-cyan-300 underline underline-offset-4",
								href: "#contact",
								children: isAr ? "اطلب مستند الترخيص الحالي" : "Request current licensing evidence"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "سجل NDT العالمي:" : "ndt.org Global Registry:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: INSCO_COMPANY_DATA.contacts.ndtOrgListingUrl,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["ID: ", INSCO_COMPANY_DATA.ndtOrgId] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3 h-3" })]
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1",
							children: isAr ? "ملخص ملف الشركة" : "Company profile summary"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-bold text-white",
							children: isAr ? "موضوعات للمراجعة عند التأهيل" : "Items to review during qualification"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
						children: INSCO_COMPANY_DATA.fiveReasons.map((reason, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs font-black text-cyan-400",
									children: [
										"0",
										reason.number,
										"."
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-xs font-bold text-slate-200",
									children: reason.title[language]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-400 leading-relaxed",
								children: reason.description[language]
							})]
						}, idx))
					})]
				})
			]
		})
	});
};
//#endregion
export { CompanyCertificationsSection };
