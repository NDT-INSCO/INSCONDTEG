import "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as ListChecks } from "./list-checks-3PdhwBZP.js";
import { an as Download, en as FileText, in as ExternalLink, lt as INSCO_COMPANY_DATA, ot as SectionHeading, st as CtaButton } from "./index-BKrODMj6.js";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var CompanyVendorVaultSection = ({ language }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "vault",
		className: "py-16 border-b border-slate-800 bg-slate-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					className: "mb-12",
					eyebrow: isAr ? "ملف الشركة ومتطلبات التأهيل" : "Company profile & qualification documents",
					title: isAr ? "نسخة عامة من ملف التأهيل" : "Public extract for vendor qualification",
					description: isAr ? "ملف تاريخي يحتفظ بأرقام الصفحات الأصلية. النسخ الشخصية والتراخيص وعقود العملاء ليست جزءًا من التحميل العام؛ اطلب المستندات المطلوبة بقناة خاصة." : "The historical extract keeps the original page references. Personnel, licence and client scans are not included; request the documents you need through a private channel."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-14 rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 to-cyan-950/30 p-8 sm:p-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-8 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs font-mono text-cyan-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										INSCO_COMPANY_DATA.docRef,
										" · ",
										INSCO_COMPANY_DATA.revision
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xl sm:text-2xl font-black text-white",
									children: isAr ? "ملف الشركة وسابقة الأعمال (PDF)" : "INSCO Company Profile & Track Record (PDF)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-slate-300 leading-relaxed",
									children: isAr ? "نبذة تاريخية وسجل الأعمال ونسخ شهادات نظم الإدارة. الصفحات المستبعدة تحمل إشعارًا بدلًا من المستند الأصلي." : "Historical company background, project records and corporate ISO copies. Restricted pages show a notice instead of the original document."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 flex flex-wrap items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: INSCO_COMPANY_DATA.pdfBrochureUrl,
										download: "INSCO_Company_Profile_Public_Extract.pdf",
										className: "inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-300 hover:bg-sky-200 text-slate-950 font-semibold text-sm transition shadow-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تحميل النسخة العامة (PDF)" : "Download public extract (PDF)" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: INSCO_COMPANY_DATA.pdfBrochureUrl,
										target: "_blank",
										rel: "noopener noreferrer",
										className: "inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "معاينة في تبويب جديد" : "Open in New Tab" })]
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 font-mono text-xs text-slate-300",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-slate-400 font-bold uppercase pb-1 border-b border-slate-800",
									children: isAr ? "بيانات النسخة التاريخية" : "Dossier Meta"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-400",
										children: isAr ? "عدد الصفحات:" : "Pages:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-cyan-400 font-bold",
										children: isAr ? "50 صفحة" : "50 pages"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-400",
										children: isAr ? "تاريخ الإصدار:" : "Issue Date:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-200",
										children: "05 OCT 2026"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-400",
										children: isAr ? "الإصدار:" : "Revision:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-200",
										children: "Rev. 05"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-400",
										children: isAr ? "رقم الجهة في الملف:" : "CAB ID in dossier:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-cyan-400 font-bold",
										children: "#120007"
									})]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6 mb-14",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-bold text-white",
						children: isAr ? "فهرس الملاحق (A–E)" : "Annex index (A–E)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-400",
						children: isAr ? "نسخ ISO متاحة؛ المستندات الأخرى على الطلب." : "ISO copies are available; request other records privately."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
						children: INSCO_COMPANY_DATA.annexes.map((annex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700",
											children: annex.code
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-mono text-slate-400",
											children: isAr ? `صفحة ${annex.pageNo}` : `Page ${annex.pageNo}`
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-bold text-white",
										children: annex.title[language]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-300 leading-relaxed",
										children: annex.summary[language]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: annex.issuingBody }), annex.pageNo <= 17 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `${INSCO_COMPANY_DATA.pdfBrochureUrl}#page=${annex.pageNo}`,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "inline-flex min-h-9 items-center text-cyan-300 underline underline-offset-4",
									children: isAr ? "افتح النسخة التاريخية" : "Open historical copy"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#contact",
									className: "inline-flex min-h-9 items-center text-cyan-300 underline underline-offset-4",
									children: isAr ? "اطلب المستند" : "Request document"
								})]
							})]
						}, annex.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-2xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1",
									children: isAr ? "قائمة التحقق لاعتماد الموردين" : "Documents to request"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xl font-bold text-white",
									children: isAr ? "قائمة تحقق لتأهيل المورد" : "Checklist for vendor qualification"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-slate-400 mt-1",
									children: isAr ? "حدّد المستندات اللازمة لنطاق التعاقد واطلب نسخًا حديثة من الفريق الفني. القائمة ليست إثباتًا لتوافر الوثائق أو سريانها." : "Ask the technical team for current documents for your scope. This checklist does not establish availability or validity."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
							children: [
								{
									ar: "السجل التجاري والبطاقة الضريبية سارية",
									en: "Valid Commercial Registration & Tax Card"
								},
								{
									ar: "شهادات الأيزو الثلاثية المعتمدة (9001 / 14001 / 45001)",
									en: "Triple ISO Accredited Certificates (9001/14001/45001)"
								},
								{
									ar: "شهادة المدقق الرئيسي CQI-IRCA المعتمد",
									en: "CQI-IRCA Lead Auditor Credential"
								},
								{
									ar: "شهادات مؤهلات وتراخيص مهندسي ASNT Level II / III",
									en: "Certified ASNT Level II & III Inspector Credentials"
								},
								{
									ar: "تراخيص هيئة الرقابة النووية والإشعاعية (ENRRA)",
									en: "ENRRA Industrial Radiation Source Licenses"
								},
								{
									ar: "شهادات معايرة الأجهزة المجددة دورياً طبقا لـ NIST",
									en: "Traceable Equipment Calibration Certificates"
								},
								{
									ar: "سجل سابقة أعمال معتمدة وأوامر توريد مشروعات كبرى",
									en: "Verified Track Record & Major Project Work Orders"
								},
								{
									ar: "سياسة السلامة والصحة المهنية والبيئة (HSE Manual)",
									en: "Comprehensive Corporate HSE & QA/QC Manual"
								}
							].map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "w-4 h-4 text-cyan-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item[language] })]
							}, idx))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaButton, {
							href: "#contact",
							variant: "secondary",
							children: isAr ? "اطلب وثائق التأهيل" : "Request qualification documents"
						})
					]
				})
			]
		})
	});
};
//#endregion
export { CompanyVendorVaultSection };
