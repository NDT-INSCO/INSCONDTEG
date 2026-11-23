import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { Cn as ArrowRight, Lt as Pause, Nt as Play, in as ExternalLink, lt as INSCO_COMPANY_DATA, ot as SectionHeading, wn as ArrowLeft } from "./index-BKrODMj6.js";
//#region src/components/company/CompanyTestimonialsSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var REFERENCES = [
	{
		client: "MARIDIVE Offshore & AIC / Siemens",
		page: 12,
		title: {
			ar: "محطة عيون موسى (السويس)",
			en: "Ayoun Mousa power station (Suez)"
		},
		scope: {
			ar: "يورد سجل المنشآت أعمال فحص غير إتلافي ومعالجة حرارية بالمحطة.",
			en: "The facility record lists NDT and PWHT work at the plant."
		}
	},
	{
		client: "ORASCOM Construction",
		page: 12,
		ref: "E-06",
		title: {
			ar: "محطة كهرباء البرلس",
			en: "El-Burullus power station"
		},
		scope: {
			ar: "يورد سجل المنشآت مقاولة باطن للفحص والمعالجة الحرارية.",
			en: "The facility record lists an inspection and PWHT subcontract."
		}
	},
	{
		client: "ADPC / PETROMASILA",
		page: 11,
		title: {
			ar: "خطوط الأنابيب في اليمن",
			en: "Pipelines in Yemen"
		},
		scope: {
			ar: "يذكر سجل الأعمال التصوير الإشعاعي وفحص استمرارية الطلاء.",
			en: "The track record lists radiographic inspection and coating continuity testing."
		}
	},
	{
		client: "El Sewedy Electric",
		page: 12,
		ref: "GM102473",
		title: {
			ar: "مصانع المحولات في القاهرة",
			en: "Transformer works in Cairo"
		},
		scope: {
			ar: "يربط سجل الأعمال فحوصات المصنع بمرجع أمر التوريد المدون.",
			en: "The track record associates factory inspections with the listed purchase order."
		}
	},
	{
		client: "Serka & Contrack",
		page: 11,
		ref: "B-01",
		title: {
			ar: "سابقة أعمال باجرام",
			en: "Bagram project record"
		},
		scope: {
			ar: "يذكر سجل الشركة أعمال فحص ومعالجة حرارية، ويفهرس خطاب تقدير تاريخيًا.",
			en: "The dossier lists NDT and PWHT work and indexes a historical letter of appreciation."
		}
	}
];
function CompanyTestimonialsSection({ language }) {
	const isAr = language === "ar";
	const [index, setIndex] = (0, import_react.useState)(0);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const total = REFERENCES.length;
	const reference = REFERENCES[index];
	const Previous = isAr ? ArrowRight : ArrowLeft;
	const Next = isAr ? ArrowLeft : ArrowRight;
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		const timer = setInterval(() => setIndex((value) => (value + 1) % total), 7500);
		return () => clearInterval(timer);
	}, [playing, total]);
	const choose = (next) => {
		setPlaying(false);
		setIndex((next + total) % total);
	};
	const control = "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-2 text-slate-200 hover:border-sky-400";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "testimonials",
		"aria-labelledby": "project-references-title",
		className: "border-b border-slate-800 bg-slate-900/40 py-12 sm:py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl space-y-6 px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					id: "project-references-title",
					eyebrow: isAr ? "ملف الشركة · سجل تاريخي" : "Company dossier · Historical record",
					title: isAr ? "مراجع المشروعات" : "Project references",
					description: isAr ? "أمثلة من سجل الأعمال، وليست اقتباسات من العملاء أو قياسات للأداء." : "Examples from the work history, not client quotations or measured outcomes."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					role: "group",
					"aria-label": isAr ? "اختر مرجعًا" : "Choose a reference",
					children: REFERENCES.map((item, position) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": position === index,
						onClick: () => choose(position),
						className: `min-h-10 max-w-full rounded-lg border px-3 py-1.5 text-start text-xs font-semibold ${position === index ? "border-sky-300 bg-sky-300 text-slate-950" : "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400"}`,
						children: item.client
					}, item.client))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-7",
					"aria-live": playing ? "off" : "polite",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-semibold text-cyan-300",
							children: [reference.client, "ref" in reference ? ` · ${reference.ref}` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-bold text-white",
							children: reference.title[language]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-prose text-sm leading-relaxed text-slate-300",
							children: reference.scope[language]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `${INSCO_COMPANY_DATA.pdfBrochureUrl}#page=${reference.page}`,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-cyan-300 underline underline-offset-4",
							children: [isAr ? `ملف الشركة · صفحة ${reference.page}` : `Company dossier · page ${reference.page}`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
								className: "size-4 shrink-0",
								"aria-hidden": "true"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: control,
							onClick: () => setPlaying((value) => !value),
							"aria-label": playing ? isAr ? "أوقف العرض التلقائي" : "Pause rotation" : isAr ? "شغّل العرض التلقائي" : "Start rotation",
							children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
								className: "size-4",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								"aria-hidden": "true"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: control,
							onClick: () => choose(index - 1),
							"aria-label": isAr ? "المرجع السابق" : "Previous reference",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Previous, {
								className: "size-4",
								"aria-hidden": "true"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "px-1 font-mono text-xs text-slate-300",
							children: [
								index + 1,
								" / ",
								total
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: control,
							onClick: () => choose(index + 1),
							"aria-label": isAr ? "المرجع التالي" : "Next reference",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Next, {
								className: "size-4",
								"aria-hidden": "true"
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
export { CompanyTestimonialsSection };
