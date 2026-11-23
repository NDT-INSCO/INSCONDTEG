const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BKrODMj6.js","assets/rolldown-runtime-oLLnCvco.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css","assets/AdvancedMotionVisualizerSection-wJecBZA4.js","assets/PwhtCycleSimulator-CHwz_B-o.js","assets/flame-DuWslMqX.js","assets/rotate-ccw-wuxYnQna.js","assets/RadiographicFilmViewer-MdG_uGMQ.js","assets/circle-check-C1rtQ7NC.js","assets/circle-x-uOqfXyjf.js","assets/CompanyUltrasonicLabSection-CgWk2EyO.js","assets/PautOmniScanDevice-C3V0uNjW.js","assets/info-DziJ9J3c.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { $t as FlaskConical, Cn as ArrowRight, Jt as Layers, Qt as Gauge, Sn as ArrowUpRight, St as Thermometer, kt as ScanLine, st as CtaButton, wn as ArrowLeft } from "./index-BKrODMj6.js";
//#region src/components/company/CompanyDemoPortal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var CompanyHero = import_react.lazy(() => __vitePreload(() => import("./index-BKrODMj6.js").then((n) => n.Z).then((module) => ({ default: module.CompanyHero })), __vite__mapDeps([0,1,2,3,4,5,6,7])));
var Hologram = import_react.lazy(() => __vitePreload(() => import("./AdvancedMotionVisualizerSection-wJecBZA4.js").then((module) => ({ default: module.AdvancedMotionVisualizerSection })), __vite__mapDeps([8,1,2,6,0,3,4,5,7])));
var Pwht = import_react.lazy(() => __vitePreload(() => import("./PwhtCycleSimulator-CHwz_B-o.js").then((module) => ({ default: module.PwhtCycleSimulator })), __vite__mapDeps([9,1,2,10,3,11,4,0,5,6,7])));
var Films = import_react.lazy(() => __vitePreload(() => import("./RadiographicFilmViewer-MdG_uGMQ.js").then((module) => ({ default: module.RadiographicFilmViewer })), __vite__mapDeps([12,1,2,13,3,14,0,4,5,6,7])));
var Ultrasonic = import_react.lazy(() => __vitePreload(() => import("./CompanyUltrasonicLabSection-CgWk2EyO.js").then((module) => ({ default: module.CompanyUltrasonicLabSection })), __vite__mapDeps([15,1,2,16,3,17,13,14,11,4,6,0,5,7])));
var DEMOS = [
	{
		key: "inspection-showcase",
		icon: Layers,
		ar: {
			title: "المشهد الثلاثي وأدوات التحكم",
			line: "استكشف المشهد والأوضاع والكاميرا."
		},
		en: {
			title: "3D showcase and controls",
			line: "Explore the scene, modes and camera controls."
		}
	},
	{
		key: "hologram-lab",
		icon: Layers,
		ar: {
			title: "معرض الصور والهولوغرام",
			line: "تصفّح المشاهد التوضيحية وجرب نموذج الإشارة."
		},
		en: {
			title: "Gallery and hologram",
			line: "Browse illustrative scenes and explore a signal model."
		}
	},
	{
		key: "pwht-simulator",
		icon: Thermometer,
		ar: {
			title: "محاكي دورة المعالجة الحرارية",
			line: "تسخين ومكوث وتبريد مضبوط على 65 kW لكل وحدة."
		},
		en: {
			title: "PWHT cycle simulator",
			line: "Ramp, soak and cooling control on a 65 kW unit."
		}
	},
	{
		key: "radiography-viewer",
		icon: ScanLine,
		ar: {
			title: "عارض أفلام التصوير الإشعاعي",
			line: "كيف نحكم على الكثافة والعيب في الصورة."
		},
		en: {
			title: "Radiographic film lightbox",
			line: "How density and defects are judged on film."
		}
	},
	{
		key: "ultrasonic-lab",
		icon: Gauge,
		ar: {
			title: "معمل UT / PAUT",
			line: "معايرة، بوابات A-Scan و S-Scan، وقراءة الإشارة."
		},
		en: {
			title: "UT / PAUT lab",
			line: "Calibration, A-Scan and S-Scan gates, signal reading."
		}
	}
];
/** The hash remains reachable while closed; the module loads only when opened. */
function DemoPanel({ id, open, onToggle, label, language, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		id,
		open,
		className: "border-b border-slate-800 bg-slate-950",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
			className: "mx-auto max-w-7xl cursor-pointer px-4 py-5 font-bold text-cyan-300 focus-visible:outline focus-visible:outline-2 sm:px-6",
			onClick: (event) => {
				event.preventDefault();
				onToggle();
			},
			children: label
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "status",
				className: "mx-auto max-w-7xl px-4 pb-5 text-sm text-slate-300",
				children: language === "ar" ? "جارٍ تحميل العرض…" : "Loading demonstration…"
			}),
			children
		})]
	});
}
var CompanyDemoPortal = ({ language, anchor, onBack, onRequestQuote, onOpenAcademy }) => {
	const isAr = language === "ar";
	const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
	const [openDemo, setOpenDemo] = (0, import_react.useState)(anchor);
	(0, import_react.useEffect)(() => setOpenDemo(anchor), [anchor]);
	const lab = {
		"inspection-showcase": /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyHero, {
			language,
			headingLevel: "h2",
			onNavigateToAcademy: () => onOpenAcademy(),
			onNavigateToSection: onRequestQuote
		}),
		"hologram-lab": /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hologram, { language }),
		"pwht-simulator": /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pwht, { language }),
		"radiography-viewer": /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Films, {
			language,
			onOpenFullRtLab: () => onOpenAcademy("rt_lab")
		}),
		"ultrasonic-lab": /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ultrasonic, {
			language,
			onNavigateToAcademy: (tab) => onOpenAcademy(tab)
		})
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "top",
				className: "pt-10 pb-12 border-b border-slate-800 bg-slate-950 relative overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-cyan-950/25 via-slate-950 to-slate-950 pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative max-w-7xl mx-auto px-4 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onBack,
							className: "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition cursor-pointer mb-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-3.5 h-3.5 ltr:hidden" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "w-3.5 h-3.5 rtl:hidden" }),
								isAr ? "العودة إلى بوابة الشركة" : "Back to the corporate portal"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-3xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2",
									children: isAr ? "العرض الفني التفاعلي" : "Technical Demonstrations"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
									children: isAr ? "أدوات تعرض كيف نقرأ الإشارة ونحكم على العيب" : "See how we read the signal and judge the defect"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm sm:text-base text-slate-400 leading-relaxed",
									children: isAr ? "اختر عرضًا لتحميله. المحاكاة والصور أمثلة تعليمية، وليست نتائج فحص أو إعدادات تشغيل. المعامل الكاملة موجودة في الأكاديمية." : "Choose a demonstration to load it. These simulations and illustrations are not inspection results or operating settings. Full training labs are available in the academy."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-5 flex flex-wrap items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaButton, {
										variant: "primary",
										onClick: onRequestQuote,
										children: isAr ? "اطلب عرض سعر" : "Request a quote"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CtaButton, {
										variant: "secondary",
										onClick: () => onOpenAcademy("rt_lab"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "w-4 h-4" }),
											isAr ? "المعامل الكاملة في الأكاديمية" : "Full labs in the academy",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: "w-3.5 h-3.5" })
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3",
							children: DEMOS.map((demo) => {
								const Icon = demo.icon;
								const copy = isAr ? demo.ar : demo.en;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `#demo/${demo.key}`,
									onClick: (event) => {
										if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpenDemo(demo.key);
									},
									className: "rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-sky-400",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-4 h-4 text-cyan-400" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 text-sm font-bold text-white",
											children: copy.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-slate-400 leading-relaxed",
											children: copy.line
										})
									]
								}, demo.key);
							})
						})
					]
				})]
			}),
			DEMOS.map((demo) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoPanel, {
				id: demo.key,
				open: openDemo === demo.key,
				onToggle: () => setOpenDemo((current) => current === demo.key ? void 0 : demo.key),
				label: (isAr ? demo.ar : demo.en).title,
				language,
				children: lab[demo.key]
			}, demo.key)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "py-12 bg-slate-900/50 border-t border-slate-800",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-bold text-white",
						children: isAr ? "جاهز تناقش نطاق مشروعك؟" : "Ready to scope your project?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-400 mt-1",
						children: isAr ? "تواصل مع الفريق الفني لمراجعة نطاق العمل والتوافر." : "Ask the technical team about scope and availability."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onRequestQuote,
							className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer",
							children: [isAr ? "طلب عرض سعر" : "Request a quote", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "w-3.5 h-3.5" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onBack,
							className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer",
							children: isAr ? "بوابة الشركة" : "Corporate portal"
						})]
					})]
				})
			})
		]
	});
};
//#endregion
export { CompanyDemoPortal };
