import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { j as Cpu, r as UtFlawDetectorDevice, t as PautOmniScanDevice } from "./PautOmniScanDevice-C3V0uNjW.js";
import { Cn as ArrowRight, Tn as Activity, Zt as GraduationCap, wn as ArrowLeft } from "./index-BKrODMj6.js";
//#region src/components/company/CompanyUltrasonicLabSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var CompanyUltrasonicLabSection = ({ language, onNavigateToAcademy }) => {
	const isAr = language === "ar";
	const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
	const [activeDevice, setActiveDevice] = (0, import_react.useState)("ut");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		"data-demonstration": "ultrasonic-lab",
		className: "py-16 border-b border-slate-800 bg-slate-900/60 relative overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "w-4 h-4 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "مختبر المحاكاة التفاعلي لأجهزة الفحص بالموجات والمصفوفات" : "Interactive Ultrasonic & Phased Array Testing Lab" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
								children: isAr ? "التجربة الحية لأجهزة UT و PAUT الرقمية المعتمدة" : "Live Interactive UT & PAUT Flaw Detection Simulation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm sm:text-base text-slate-400 leading-relaxed",
								children: isAr ? "اختبر بنفسك دقة أجهزة الفحص المعتمدة لدى إنسكو: جهاز كشف العيوب الرقمي (Krautkramer USM 35X) وجهاز المصفوفات الطورية المتقدم (Olympus OmniScan X3). يمكنك تعديل الكسب (Gain)، النطاق (Range)، زوايا المجس، ومسح وصلات اللحام واكتشاف عيوب الجذور ونقص الانصهار لحظياً." : "Experience the precision of INSCO’s calibrated field equipment: Digital Flaw Detector (Krautkramer USM 35X) and Phased Array (Olympus OmniScan X3). Adjust gain, range, beam angles, and size real-time weld discontinuities."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setActiveDevice("ut"),
							className: `px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 ${activeDevice === "ut" ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/40" : "text-slate-400 hover:text-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "جهاز UT الرقمي (USM 35X)" : "Conventional UT" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setActiveDevice("paut"),
							className: `px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 ${activeDevice === "paut" ? "bg-amber-600 text-white shadow-md shadow-amber-950/40" : "text-slate-400 hover:text-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "جهاز PAUT المصفوفات (OmniScan)" : "Phased Array PAUT" })]
						})]
					})]
				}),
				activeDevice === "ut" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UtFlawDetectorDevice, { language }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PautOmniScanDevice, { language }),
				onNavigateToAcademy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 p-4 rounded-xl border border-cyan-500/30 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs font-bold text-white",
							children: isAr ? "تريد تدريباً عملياً متقدماً مع مهام وتقارير معتمدة؟" : "Looking for guided missions and accredited training reports?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-slate-400",
							children: isAr ? "أكاديمية إنسكو تقدم ورش عمل تفاعلية كاملة مع بنك المهام ومسائل الحسابات الصوتية." : "INSCO Academy offers full interactive workshops with acoustic calculations."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onNavigateToAcademy("workshops"),
						className: "px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-cyan-900/30",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "دخول المعمل التفاعلي بالأكاديمية" : "Enter Academy Virtual Lab" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: "w-3.5 h-3.5" })]
					})]
				})
			]
		})
	});
};
//#endregion
export { CompanyUltrasonicLabSection };
