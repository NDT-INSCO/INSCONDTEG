const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/InteractiveInspectionHologram-BySsMmJd.js","assets/rolldown-runtime-oLLnCvco.js","assets/jsx-runtime-CJAQq89J.js","assets/eye-DyafRkmV.js","assets/index-DG6f_JZi.js","assets/index.esm-B2yT6b-Z.js","assets/index-DmCUY4uM.css","assets/three.module-VemjNcgc.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { n as createLucideIcon, t as Eye } from "./eye-DyafRkmV.js";
import { A as Gauge, M as CircleX, O as Maximize2, j as Cpu, r as UtFlawDetectorDevice, t as PautOmniScanDevice } from "./PautOmniScanDevice-riPbOHT2.js";
import { $r as Activity, Cr as FlaskConical, Ir as CircleCheck, Jn as Thermometer, Qr as ArrowLeft, Vn as __vitePreload, Xn as Sparkles, Xr as ArrowUpRight, Yn as Sun, Zn as ShieldCheck, Zr as ArrowRight, ar as Play, ei as COMPANY_MEDIA, nr as RotateCcw, sr as Pause, v as CtaButton, wr as Flame, xr as GraduationCap, yr as Layers } from "./index-DG6f_JZi.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ScanLine = createLucideIcon("scan-line", [
	["path", {
		d: "M3 7V5a2 2 0 0 1 2-2h2",
		key: "aa7l1z"
	}],
	["path", {
		d: "M17 3h2a2 2 0 0 1 2 2v2",
		key: "4qcy5o"
	}],
	["path", {
		d: "M21 17v2a2 2 0 0 1-2 2h-2",
		key: "6vwrx8"
	}],
	["path", {
		d: "M7 21H5a2 2 0 0 1-2-2v-2",
		key: "ioqczr"
	}],
	["path", {
		d: "M7 12h10",
		key: "b7w52i"
	}]
]);
//#endregion
//#region src/components/company/AdvancedMotionVisualizerSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var InteractiveInspectionHologram = import_react.lazy(() => __vitePreload(() => import("./InteractiveInspectionHologram-BySsMmJd.js").then((module) => ({ default: module.InteractiveInspectionHologram })), __vite__mapDeps([0,1,2,3,4,5,6,7])));
var AdvancedMotionVisualizerSection = ({ language }) => {
	const isAr = language === "ar";
	const [selectedGalleryImg, setSelectedGalleryImg] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (selectedGalleryImg === null) return;
		const onKey = (event) => {
			if (event.key === "Escape") setSelectedGalleryImg(null);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [selectedGalleryImg]);
	const galleryItems = [
		{
			title: {
				ar: "الفحص الميداني بالموجات فوق الصوتية (UT)",
				en: "Ultrasonic Field Inspection (UT)"
			},
			subtitle: {
				ar: "فحص خطوط الأنابيب بمحطات الطاقة العملاقة",
				en: "Pipeline Inspection in Power Stations"
			},
			src: COMPANY_MEDIA.heroInspection,
			code: "ASME Sec. V Art. 4",
			badge: "UT / PAUT",
			equipment: "Olympus 5.0 MHz · Krautkramer USM 35X"
		},
		{
			title: {
				ar: "أسطول المعالجة الحرارية بعد اللحام (PWHT)",
				en: "Post-Weld Heat Treatment Fleet (PWHT)"
			},
			subtitle: {
				ar: "16 وحدة أوتوماتيكية مبرمجة 65 kW بالقاهرة",
				en: "16 Fully-Owned 65 kW Automated Units"
			},
			src: COMPANY_MEDIA.pwhtHeatTreatment,
			code: "AWS D10.10 & ASME B31.3",
			badge: "750°C SOAK",
			equipment: "Cooperheat / Stork 65 kW Programmed System"
		},
		{
			title: {
				ar: "التصوير الإشعاعي الصناعي بجاما (RT)",
				en: "Industrial Radiography Gamma Testing (RT)"
			},
			subtitle: {
				ar: "ترخيص رسمي من هيئة الرقابة النووية (ENRRA)",
				en: "ENRRA Licensed Radiation Practices"
			},
			src: COMPANY_MEDIA.radiographyGammaScan,
			code: "ENRRA LS.0112 · ISO 17636",
			badge: "Ir-192 / Se-75",
			equipment: "Sentinel 880 Delta / Spec 150 Projectors"
		},
		{
			title: {
				ar: "المصفوفات الطورية وكشف العيوب (PAUT)",
				en: "Phased Array Flaw Imaging (PAUT)"
			},
			subtitle: {
				ar: "مسح قطاعي متقدم S-Scan للشروخ ونقص الانصهار",
				en: "Sectorial S-Scan Weld Root Integrity"
			},
			src: COMPANY_MEDIA.pautFlawDetector,
			code: "ASME Sec. V Art. 4 App.",
			badge: "Multi-Angle 35°-70°",
			equipment: "Olympus OmniScan X3 64:128PR"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "hologram-lab",
		className: "py-16 border-b border-slate-800 bg-slate-950 relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl mb-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-4 h-4 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تقنيات الجرافيكس ثلاثية الأبعاد والمحاكاة الميدانية" : "3D Interactive Holographic & Field Graphics Lab" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
							children: isAr ? "معرض الصور الميدانية والمحاكي الهولوغرافي التفاعلي" : "Interactive 3D Holographic Scanner & Photorealistic Gallery"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm sm:text-base text-slate-400 leading-relaxed",
							children: isAr ? "تجمع إنسكو بين أحدث معدات الفحص الميدانية العالمية (Olympus وKrautkramer وSentinel) والبيئة الرقمية التفاعلية لمحاكاة انتشار الموجات والأشعة واكتشاف العيوب بدقة متناهية." : "Experience the convergence of world-class field testing instrumentation (Olympus, Krautkramer, Sentinel) with real-time 3D simulation and ultrasonic waveform diagnostics."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-14",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[420px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" }),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InteractiveInspectionHologram, { language })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold text-white",
							children: isAr ? "معرض التوثيق الفوتوغرافي لعمليات الفحص والمعالجة" : "High-Fidelity Engineering Field Operations Gallery"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-400",
							children: isAr ? "لقطات واقعية عالية الدقة للمعدات والمهندسين وأعمال التفتيش بالمواقع الحية" : "Photorealistic visual documentation of fleet assets and certified engineering inspections"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs font-mono text-cyan-400",
							children: ["4 ", isAr ? "أصول رئيسية" : "Key Assets"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5",
						children: galleryItems.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelectedGalleryImg(idx),
							"aria-haspopup": "dialog",
							"aria-label": `${item.title[language]} — ${isAr ? "فتح الصورة بالحجم الكامل" : "open full size"}`,
							className: "group relative text-start rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 transition duration-300 cursor-pointer shadow-lg flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative h-52 overflow-hidden bg-slate-950",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: item.src,
										alt: item.title[language],
										referrerPolicy: "no-referrer",
										className: "w-full h-full object-cover transition duration-700 group-hover:scale-110"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono pointer-events-none",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold",
											children: item.badge
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "p-1 rounded bg-slate-950/85 text-slate-300",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "w-3.5 h-3.5" })
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] font-mono text-cyan-400",
										children: item.code
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-bold text-white group-hover:text-cyan-300 transition",
										children: item.title[language]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-400 line-clamp-2",
										children: item.subtitle[language]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 truncate",
										children: item.equipment
									})
								]
							})]
						}, idx))
					})]
				}),
				selectedGalleryImg !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": galleryItems[selectedGalleryImg].title[language],
					className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						tabIndex: -1,
						"aria-label": isAr ? "إغلاق معاينة الصورة" : "Close image preview",
						onClick: () => setSelectedGalleryImg(null),
						className: "absolute inset-0 bg-slate-950/90 backdrop-blur-md cursor-default"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between pb-3 border-b border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono text-cyan-400",
									children: galleryItems[selectedGalleryImg].code
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-bold text-white",
									children: galleryItems[selectedGalleryImg].title[language]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setSelectedGalleryImg(null),
									className: "px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer",
									children: isAr ? "إغلاق ✕" : "Close ✕"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl overflow-hidden max-h-[60vh] bg-slate-950 flex items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: galleryItems[selectedGalleryImg].src,
									alt: galleryItems[selectedGalleryImg].title[language],
									referrerPolicy: "no-referrer",
									className: "max-h-[60vh] w-auto object-contain"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs font-mono text-slate-300 pt-2 border-t border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: galleryItems[selectedGalleryImg].equipment }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-cyan-400",
									children: isAr ? "شركة إنسكو الدولية" : "INSCO Industrial NDT"
								})]
							})
						]
					})]
				})
			]
		})]
	});
};
//#endregion
//#region src/components/company/PwhtCycleSimulator.tsx
var MATERIAL_RECIPES = [
	{
		id: "p91",
		name: {
			ar: "سبيكة P91 (محطات توليد الطاقة الكهربائية)",
			en: "P91 Alloy (CCPP Supercritical Steam)"
		},
		code: "Grade 91 (9Cr-1Mo-V)",
		preheatTemp: 220,
		soakTemp: 760,
		soakTimeMin: 120,
		maxHeatingRate: 110,
		maxCoolingRate: 100,
		standardRef: "AWS D10.10 / ASME B31.1 Table 132"
	},
	{
		id: "p22",
		name: {
			ar: "سبيكة P22 (خطوط إعادة التسخين الحرج)",
			en: "P22 Alloy (2.25Cr-1Mo Piping)"
		},
		code: "Grade 22 (2.25Cr-1Mo)",
		preheatTemp: 180,
		soakTemp: 715,
		soakTimeMin: 90,
		maxHeatingRate: 150,
		maxCoolingRate: 120,
		standardRef: "ASME Section I PW-39"
	},
	{
		id: "cs-heavy",
		name: {
			ar: "صلب كربوني عالي السماكة (أوعية الضغط)",
			en: "Heavy Carbon Steel (Pressure Vessels)"
		},
		code: "A516 Gr. 70 / A106 Gr. B",
		preheatTemp: 100,
		soakTemp: 620,
		soakTimeMin: 60,
		maxHeatingRate: 200,
		maxCoolingRate: 150,
		standardRef: "ASME Section VIII Div. 1 UCS-56"
	}
];
var PwhtCycleSimulator = ({ language }) => {
	const isAr = language === "ar";
	const [selectedMaterialId, setSelectedMaterialId] = (0, import_react.useState)("p91");
	const recipe = MATERIAL_RECIPES.find((m) => m.id === selectedMaterialId) || MATERIAL_RECIPES[0];
	const [isRunning, setIsRunning] = (0, import_react.useState)(false);
	const [progressSec, setProgressSec] = (0, import_react.useState)(0);
	const [simSpeed, setSimSpeed] = (0, import_react.useState)(2);
	(0, import_react.useRef)(null);
	const calculateCycleTemp = (time) => {
		const ambient = 25;
		const soak = recipe.soakTemp;
		if (time <= 200) {
			const pct = time / 200;
			return Math.round(ambient + pct * (soak - ambient));
		} else if (time <= 400) {
			const jitter = Math.sin(time * .2) * 3;
			return Math.round(soak + jitter);
		} else if (time <= 550) {
			const pct = (time - 400) / 150;
			return Math.round(soak - pct * (soak - 300));
		} else {
			const pct = (time - 550) / 50;
			return Math.round(300 - pct * 250);
		}
	};
	const currentTemp = calculateCycleTemp(progressSec);
	const tcReadings = [
		{
			label: "TC-1 (Top)",
			temp: currentTemp,
			delta: 0
		},
		{
			label: "TC-2 (Bottom)",
			temp: Math.round(currentTemp - 4 + Math.sin(progressSec * .1) * 2),
			delta: -4
		},
		{
			label: "TC-3 (Left HAZ)",
			temp: Math.round(currentTemp - 8),
			delta: -8
		},
		{
			label: "TC-4 (Right HAZ)",
			temp: Math.round(currentTemp - 7),
			delta: -7
		},
		{
			label: "TC-5 (Weld Center)",
			temp: Math.round(currentTemp + 2),
			delta: 2
		},
		{
			label: "TC-6 (Aux Control)",
			temp: Math.round(currentTemp - 12),
			delta: -12
		}
	];
	let stageName = {
		ar: "مرحلة التسخين والتصاعد التدريجي (Heating Ramp)",
		en: "Controlled Heating Ramp"
	};
	if (progressSec > 200 && progressSec <= 400) stageName = {
		ar: "مرحلة التثبيت الحراري (Soaking Plateau)",
		en: "Soaking Plateau & Stress Relief"
	};
	else if (progressSec > 400 && progressSec <= 550) stageName = {
		ar: "مرحلة التبريد المنظم تحت العزل (Controlled Cooling)",
		en: "Controlled Cooling Under Insulation"
	};
	else if (progressSec > 550) stageName = {
		ar: "مرحلة التبريد الهوائي الطبيعي (Air Cooling)",
		en: "Final Ambient Air Cooling"
	};
	const getPipeGlowStyle = (temp) => {
		if (temp < 150) return {
			fill: "#1e293b",
			stroke: "#38bdf8",
			glow: "rgba(56, 189, 248, 0.1)"
		};
		else if (temp < 350) return {
			fill: "#334155",
			stroke: "#f59e0b",
			glow: "rgba(245, 158, 11, 0.2)"
		};
		else if (temp < 550) return {
			fill: "#7c2d12",
			stroke: "#f97316",
			glow: "rgba(249, 115, 22, 0.4)"
		};
		else return {
			fill: "#991b1b",
			stroke: "#ef4444",
			glow: "rgba(239, 68, 68, 0.7)"
		};
	};
	const pipeStyle = getPipeGlowStyle(currentTemp);
	(0, import_react.useEffect)(() => {
		if (isRunning) {
			const interval = setInterval(() => {
				setProgressSec((prev) => {
					if (prev >= 600) {
						setIsRunning(false);
						return 600;
					}
					return prev + simSpeed;
				});
			}, 50);
			return () => clearInterval(interval);
		}
	}, [isRunning, simSpeed]);
	const handleReset = () => {
		setIsRunning(false);
		setProgressSec(0);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "pwht-simulator",
		className: "py-16 border-b border-slate-800 bg-slate-950 relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000",
			style: { backgroundColor: currentTemp > 500 ? "rgba(220, 38, 38, 0.12)" : "rgba(6, 182, 212, 0.06)" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "w-4 h-4 text-amber-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "المحاكي الحراري الحي لأسطول وحدات 65 kW الأوتوماتيكية" : "Live Heat Treatment Cycle Simulator (65 kW Fleet)" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
								children: isAr ? "محاكاة دورة المعالجة الحرارية بعد اللحام (PWHT Cycle)" : "Precision Post-Weld Heat Treatment Cycle Simulation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm sm:text-base text-slate-400 leading-relaxed",
								children: isAr ? "استكشف آلية عمل وحدات المعالجة الحرارية الـ 16 المملوكة لإنسكو بقدرة 65 kW المزودة بـ 6 قنوات تحكم PID ومسجلات Chino / Eurotherm الدقيقة لمطابقة متطلبات الكود ASME B31.1 و AWS D10.10." : "Interact with the automated thermal cycle executed by INSCO’s 16-unit 65 kW fleet, featuring 6-channel independent PID control and Eurotherm temperature logging complying with ASME B31.1 & AWS D10.10."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-3 shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400",
							children: isAr ? "16 وحدة مملوكة بالكامل" : "16 Fleet Units Owned"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-3 mb-8",
					children: MATERIAL_RECIPES.map((mat) => {
						const isSelected = mat.id === selectedMaterialId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setSelectedMaterialId(mat.id);
								setProgressSec(0);
								setIsRunning(false);
							},
							className: `p-3.5 rounded-xl border text-start transition cursor-pointer ${isSelected ? "bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/30" : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs font-mono mb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-amber-400",
										children: mat.code
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-slate-500",
										children: [mat.soakTemp, " °C"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`,
									children: mat.name[language]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] text-slate-500 font-mono mt-1",
									children: mat.standardRef
								})
							]
						}, mat.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-8 space-y-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-slate-800 bg-slate-900/70 p-6 relative overflow-hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-mono font-bold text-slate-200",
											children: isAr ? "رسم حي لحرارة وصلة اللحام والمقاومات السيراميكية (Ceramic Heaters)" : "Thermal Core Visualization & Flexible Ceramic Heating Pads"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800",
										children: stageName[language]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative py-4 flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
										viewBox: "0 0 600 220",
										className: "w-full max-w-lg h-auto transition-all duration-700 drop-shadow-2xl",
										style: { filter: `drop-shadow(0 0 25px ${pipeStyle.glow})` },
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
												id: "pipeHeatGlow",
												cx: "50%",
												cy: "50%",
												r: "50%",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "0%",
														stopColor: currentTemp > 400 ? "#facc15" : "#38bdf8",
														stopOpacity: "0.8"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "60%",
														stopColor: pipeStyle.fill,
														stopOpacity: "0.9"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "100%",
														stopColor: "#0f172a",
														stopOpacity: "1"
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
												id: "insulationPads",
												width: "20",
												height: "20",
												patternUnits: "userSpaceOnUse",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
													width: "18",
													height: "18",
													fill: "none",
													stroke: "#64748b",
													strokeWidth: "1",
													strokeDasharray: "2 2"
												})
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "150",
												y: "20",
												width: "300",
												height: "180",
												rx: "12",
												fill: "url(#insulationPads)",
												opacity: "0.4"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "150",
												y: "20",
												width: "300",
												height: "180",
												rx: "12",
												fill: "none",
												stroke: "#475569",
												strokeWidth: "1.5",
												strokeDasharray: "4 4"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "40",
												y: "55",
												width: "520",
												height: "110",
												rx: "6",
												fill: "#1e293b",
												stroke: "#334155",
												strokeWidth: "2"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "180",
												y: "55",
												width: "240",
												height: "110",
												fill: "url(#pipeHeatGlow)",
												stroke: pipeStyle.stroke,
												strokeWidth: "2.5",
												className: "transition-colors duration-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
												x1: "300",
												y1: "55",
												x2: "300",
												y2: "165",
												stroke: "#f8fafc",
												strokeWidth: "3",
												strokeDasharray: "5 3"
											}),
											currentTemp > 300 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
												opacity: Math.min(1, (currentTemp - 300) / 300),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M 220 15 Q 240 5 260 15 T 300 15",
													fill: "none",
													stroke: "#f97316",
													strokeWidth: "1.5",
													className: "animate-pulse"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M 300 15 Q 320 5 340 15 T 380 15",
													fill: "none",
													stroke: "#f97316",
													strokeWidth: "1.5",
													className: "animate-pulse"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "300",
												cy: "55",
												r: "5",
												fill: "#f43f5e",
												stroke: "#fff",
												strokeWidth: "1.5"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "310",
												y: "52",
												fill: "#fda4af",
												fontSize: "10",
												fontFamily: "monospace",
												children: "TC-1 (Top)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "300",
												cy: "165",
												r: "5",
												fill: "#f43f5e",
												stroke: "#fff",
												strokeWidth: "1.5"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "310",
												y: "178",
												fill: "#fda4af",
												fontSize: "10",
												fontFamily: "monospace",
												children: "TC-2 (Bottom)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "210",
												cy: "110",
												r: "5",
												fill: "#38bdf8",
												stroke: "#fff",
												strokeWidth: "1.5"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "145",
												y: "113",
												fill: "#7dd3fc",
												fontSize: "10",
												fontFamily: "monospace",
												children: "TC-3 (HAZ)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "390",
												cy: "110",
												r: "5",
												fill: "#38bdf8",
												stroke: "#fff",
												strokeWidth: "1.5"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "402",
												y: "113",
												fill: "#7dd3fc",
												fontSize: "10",
												fontFamily: "monospace",
												children: "TC-4 (HAZ)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "300",
												cy: "110",
												r: "6",
												fill: "#eab308",
												stroke: "#fff",
												strokeWidth: "1.5"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "310",
												y: "113",
												fill: "#fef08a",
												fontSize: "10",
												fontFamily: "monospace",
												children: "TC-5 (Center)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "40",
												y: "45",
												fill: "#64748b",
												fontSize: "10",
												fontFamily: "monospace",
												children: "P91 Sch. 160 (Wall = 38mm)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "220",
												y: "210",
												fill: "#94a3b8",
												fontSize: "11",
												fontFamily: "monospace",
												children: "Heated Band = 2.5 x √ (Rt)"
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs font-mono",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-slate-500",
												children: isAr ? "الحرارة الحالية:" : "Core Temperature:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `text-xl font-black mt-1 ${currentTemp > 700 ? "text-red-400" : "text-amber-400"}`,
												children: [currentTemp, " °C"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-slate-500",
												children: isAr ? "حرارة التثبيت المستهدفة:" : "Target Soak Temp:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-xl font-black text-cyan-400 mt-1",
												children: [recipe.soakTemp, " °C"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-slate-500",
												children: isAr ? "معدل التصاعد الأقصى:" : "Max Ramp Rate:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-sm font-bold text-slate-200 mt-1",
												children: [recipe.maxHeatingRate, " °C/hr"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-slate-500",
												children: isAr ? "زمن التثبيت المكتمل:" : "Soak Time Elapsed:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-bold text-slate-200 mt-1",
												children: progressSec >= 200 ? `${Math.min(recipe.soakTimeMin, Math.round((progressSec - 200) / 200 * recipe.soakTimeMin))} min` : "0 min"
											})]
										})
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-slate-800 bg-slate-900/50 p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs font-mono text-slate-400 flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "w-4 h-4 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "منحنى مسجل درجات الحرارة Chino / Eurotherm 6-Point Strip Chart" : "Eurotherm 6-Point Automated Temperature Profile" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs font-mono text-slate-500",
										children: [
											Math.round(progressSec / 600 * 100),
											"% ",
											isAr ? "من الدورة" : "Completed"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative h-6 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex text-[10px] font-mono font-bold",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-[33.3%] bg-amber-500/20 border-r border-amber-500/30 flex items-center justify-center text-amber-300",
											children: isAr ? "التصاعد (Ramp)" : "Ramp Up"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-[33.3%] bg-red-500/20 border-r border-red-500/30 flex items-center justify-center text-red-300",
											children: isAr ? "التثبيت (Soak)" : "Soaking"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-[25%] bg-cyan-500/20 border-r border-cyan-500/30 flex items-center justify-center text-cyan-300",
											children: isAr ? "التبريد (Cooling)" : "Cooling"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-[8.4%] bg-emerald-500/20 flex items-center justify-center text-emerald-300",
											children: isAr ? "هواء" : "Air"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all",
											style: { left: `${progressSec / 600 * 100}%` }
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-4 mt-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setIsRunning(!isRunning),
											className: "px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/30",
											children: [isRunning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isRunning ? isAr ? "إيقاف مؤقت" : "Pause" : isAr ? "تشغيل الدورة" : "Run Cycle" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: handleReset,
											className: "p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition border border-slate-800 cursor-pointer",
											title: isAr ? "إعادة ضبط" : "Reset",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-4 h-4" })
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 text-xs font-mono text-slate-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "me-1",
											children: isAr ? "سرعة المحاكاة:" : "Speed:"
										}), [
											1,
											2,
											5
										].map((spd) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setSimSpeed(spd),
											className: `px-2 py-1 rounded text-xs transition cursor-pointer ${simSpeed === spd ? "bg-cyan-600 text-white font-bold" : "bg-slate-900 text-slate-400 hover:text-white"}`,
											children: [spd, "x"]
										}, spd))]
									})]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "lg:col-span-4 space-y-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thermometer, { className: "w-4 h-4 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "قنوات الحساسات الست (6-Zone PID)" : "6-Zone PID Thermocouple Log" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
										children: "Type K Traceable"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2.5",
									children: tcReadings.map((tc, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between font-mono text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-300 font-bold",
											children: tc.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-slate-500",
											children: [
												"Channel #",
												idx + 1,
												" PID"
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-end",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `text-sm font-black ${tc.temp > 700 ? "text-red-400" : "text-amber-400"}`,
												children: [tc.temp, " °C"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-[10px] text-slate-500",
												children: [
													"Δ ",
													tc.delta > 0 ? `+${tc.delta}` : tc.delta,
													" °C"
												]
											})]
										})]
									}, idx))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-3 border-t border-slate-800 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs font-bold text-slate-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "مطابقة متطلبات الكود المعتمد:" : "Code Acceptance Verified:" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-slate-400 leading-relaxed",
										children: isAr ? "يضمن النظام الحفاظ على فرق حرارة لا يتجاوز 14°C بين أعلى وأسفل الماسورة (Top vs Bottom Gradient) طبقاً لـ AWS D10.10 مع التوثيق الآلي على شارت المعايرة." : "System enforces max 14°C circumferential temperature gradient between top and bottom thermocouples complying with AWS D10.10 strict requirements."
									})]
								})
							]
						})
					})]
				})
			]
		})]
	});
};
//#endregion
//#region src/components/company/RadiographicFilmViewer.tsx
var FILM_DATABASE = [
	{
		id: "film-crack-01",
		weldRef: "INS-RT-W08 (Main Steam P91)",
		material: "Grade 91 (8-inch Sch. 160)",
		defectName: {
			ar: "شرخ طولي حرج بجذر اللحام (Longitudinal Root Crack)",
			en: "Critical Longitudinal Root Crack"
		},
		defectType: "crack",
		measuredLengthMm: 14.5,
		maxAllowedMm: 0,
		governingCode: "ASME Section I PW-51.1 / B31.1 Table 136.4",
		verdict: "REJECT",
		verdictReason: {
			ar: "مرفوض قطعاً: الكود يمنع منعاً باتاً أي شروخ أو مؤشرات نقص انصهار مهما كان طولها (Zero Tolerance).",
			en: "Unacceptable: All cracks and incomplete fusion indications are rejectable regardless of length."
		},
		filmDensity: 2.75,
		visualSvg: {
			weldWidth: 500,
			weldHeight: 120,
			defectCoords: {
				x: 230,
				y: 56,
				w: 75,
				h: 4,
				type: "jagged_crack"
			}
		}
	},
	{
		id: "film-lof-02",
		weldRef: "INS-RT-W22 (Crude Oil 32\" Transmission)",
		material: "API 5L X65 (14.2 mm Wall)",
		defectName: {
			ar: "نقص انصهار في الجدار الجانبي (Lack of Side-Wall Fusion)",
			en: "Incomplete Side-Wall Fusion"
		},
		defectType: "lack_of_fusion",
		measuredLengthMm: 28,
		maxAllowedMm: 25,
		governingCode: "API 1104 22nd Ed. Section 9.3.4",
		verdict: "REJECT",
		verdictReason: {
			ar: "مرفوض: طول نقص الانصهار الإجمالي (28 مم) يتجاوز الحد الأقصى المسموح به (25 مم أو 1 بوصة).",
			en: "Unacceptable: Length of IF exceeds maximum allowable aggregate limit of 25 mm per API 1104."
		},
		filmDensity: 2.5,
		visualSvg: {
			weldWidth: 500,
			weldHeight: 120,
			defectCoords: {
				x: 180,
				y: 44,
				w: 120,
				h: 5,
				type: "line_fusion"
			}
		}
	},
	{
		id: "film-porosity-03",
		weldRef: "INS-RT-W45 (Lube Oil Vessel Shell)",
		material: "SA-516 Gr. 70 (22 mm Plate)",
		defectName: {
			ar: "مسامية غازية دائرية متفرقة (Scattered Gas Porosity)",
			en: "Isolated Rounded Gas Porosity"
		},
		defectType: "porosity",
		measuredLengthMm: 1.8,
		maxAllowedMm: 3,
		governingCode: "ASME Section VIII Div. 1 UW-51 App. 4",
		verdict: "ACCEPT",
		verdictReason: {
			ar: "مقبول: قطر التجاويف الدائرية والتباعد بينها ضمن الحدود المصرح بها بالملحق 4 لمخططات المسامية.",
			en: "Acceptable: Rounded indication dimension and spacing satisfy ASME VIII Appendix 4 porosity charts."
		},
		filmDensity: 2.85,
		visualSvg: {
			weldWidth: 500,
			weldHeight: 120,
			defectCoords: {
				x: 260,
				y: 60,
				w: 6,
				h: 6,
				type: "dots"
			}
		}
	},
	{
		id: "film-slag-04",
		weldRef: "INS-RT-W61 (Condensate Piping Spool)",
		material: "ASTM A106 Gr. B (6\" Sch. 40)",
		defectName: {
			ar: "خط خبث ممدود متقطع (Elongated Slag Inclusion)",
			en: "Elongated Slag Line Inclusions"
		},
		defectType: "slag",
		measuredLengthMm: 8.2,
		maxAllowedMm: 12,
		governingCode: "ASME B31.3 Table 341.3.2 (Normal Fluid Service)",
		verdict: "ACCEPT",
		verdictReason: {
			ar: "مقبول: طول المؤشر الخبثي 8.2 مم وهو أقل من الحد المسموح به (Tw/3 = 12 مم).",
			en: "Acceptable: Total slag indication length is within the Tw/3 allowable limit for Normal Fluid Service."
		},
		filmDensity: 2.65,
		visualSvg: {
			weldWidth: 500,
			weldHeight: 120,
			defectCoords: {
				x: 210,
				y: 52,
				w: 55,
				h: 6,
				type: "slag_line"
			}
		}
	},
	{
		id: "film-sound-05",
		weldRef: "INS-RT-W99 (Burullus CCPP Steam Header)",
		material: "SA-335 P91 (24\" OD x 45mm)",
		defectName: {
			ar: "لحام سليم تام النفاذية 100% بدون أي عيوب (Sound Weld)",
			en: "100% Sound Fully Penetrated Weld"
		},
		defectType: "sound",
		measuredLengthMm: 0,
		maxAllowedMm: 0,
		governingCode: "ASME Section I & B31.1 Full Volumetric",
		verdict: "ACCEPT",
		verdictReason: {
			ar: "مقبول بامتياز: تجانس تام، نفاذية مكتملة بالجذر، بدون أي شوائب أو انقطاعات معدنية.",
			en: "Excellent sound weld: Complete root penetration, uniform reinforcement, zero planar or volumetric discontinuities."
		},
		filmDensity: 3.1,
		visualSvg: {
			weldWidth: 500,
			weldHeight: 120,
			defectCoords: {
				x: 0,
				y: 0,
				w: 0,
				h: 0,
				type: "none"
			}
		}
	}
];
var RadiographicFilmViewer = ({ language, onOpenFullRtLab }) => {
	const isAr = language === "ar";
	const [activeFilmId, setActiveFilmId] = (0, import_react.useState)("film-crack-01");
	const [luxBrightness, setLuxBrightness] = (0, import_react.useState)(75);
	const [invertContrast, setInvertContrast] = (0, import_react.useState)(false);
	const [showReticle, setShowReticle] = (0, import_react.useState)(true);
	const activeFilm = FILM_DATABASE.find((f) => f.id === activeFilmId) || FILM_DATABASE[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "radiography-viewer",
		className: "py-16 border-b border-slate-800 bg-slate-900/50 relative overflow-hidden",
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
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-4 h-4 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "شاشة التفسير الرقمي لأفلام الأشعة الصناعية (RT Lightbox)" : "Digital Radiograph Lightbox & Flaw Interpreter" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
								children: isAr ? "مختبر قراءة وتفسير صور الأشعة وأفلام جاما RT" : "Interactive Radiographic Darkroom Lightbox & Evaluation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm sm:text-base text-slate-400 leading-relaxed",
								children: isAr ? "محاكي رقمي لجهاز إضاءة وفحص أفلام الأشعة الصناعية عالية الكثافة (High-Intensity LED Illuminator 100,000 Lux). يمكنك فحص عيوب اللحام الحقيقية وتحديد أبعادها والتحقق من قرار القبول والرفض طبقاً لـ ASME و API." : "Digital simulation of an industrial high-intensity LED film illuminator (100,000 Lux). Inspect real welded joints, adjust optical density, measure flaw indications, and review ASME / API code acceptance verdicts."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 shrink-0",
						children: [onOpenFullRtLab && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onOpenFullRtLab,
							className: "px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer",
							children: isAr ? "فتح معمل محاكاة الجاما والإكس راي الكامل بالأكاديمية" : "Launch Full Gamma & X-Ray RT Simulator"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300",
							children: isAr ? "ترخيص الرقابة النووية ENRRA" : "ENRRA Licensed"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8",
					children: FILM_DATABASE.map((film) => {
						const isSelected = film.id === activeFilmId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setActiveFilmId(film.id),
							className: `p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${isSelected ? "bg-slate-950 border-cyan-500 shadow-md shadow-cyan-950/40" : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-[11px] font-mono mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-500",
									children: film.weldRef.split(" ")[0]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `px-1.5 py-0.2 rounded text-[10px] font-bold ${film.verdict === "REJECT" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`,
									children: film.verdict
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `text-xs font-bold line-clamp-2 ${isSelected ? "text-white" : "text-slate-300"}`,
								children: film.defectName[language]
							})] })
						}, film.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "lg:col-span-8 space-y-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-slate-700 bg-black p-6 sm:p-8 relative overflow-hidden shadow-2xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs font-mono text-slate-400 mb-4 border-b border-slate-800 pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-200 font-bold",
												children: activeFilm.weldRef
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-600",
												children: "|"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-cyan-400",
												children: activeFilm.material
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["H&D Density: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-white",
												children: activeFilm.filmDensity
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-600",
												children: "|"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["IQI: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-white",
												children: "ASTM 1B"
											})] })
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4 transition-all duration-300",
									style: {
										backgroundColor: invertContrast ? "#f8fafc" : "#05070a",
										filter: `brightness(${luxBrightness / 50})`
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
										viewBox: "0 0 540 180",
										className: "w-full h-auto select-none",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
												id: "lightDiffuse",
												cx: "50%",
												cy: "50%",
												r: "60%",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "0%",
													stopColor: invertContrast ? "#ffffff" : "#1e293b",
													stopOpacity: "0.9"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "100%",
													stopColor: invertContrast ? "#e2e8f0" : "#090d16",
													stopOpacity: "1"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
												id: "weldZoneGrad",
												x1: "0%",
												y1: "0%",
												x2: "0%",
												y2: "100%",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "0%",
														stopColor: invertContrast ? "#cbd5e1" : "#1e293b"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "50%",
														stopColor: invertContrast ? "#94a3b8" : "#334155"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "100%",
														stopColor: invertContrast ? "#cbd5e1" : "#1e293b"
													})
												]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "0",
												y: "0",
												width: "540",
												height: "180",
												rx: "8",
												fill: "url(#lightDiffuse)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "20",
												y: "20",
												width: "500",
												height: "140",
												fill: invertContrast ? "#e2e8f0" : "#0f172a",
												opacity: "0.8"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "20",
												y: "60",
												width: "500",
												height: "60",
												fill: "url(#weldZoneGrad)",
												opacity: "0.85"
											}),
											Array.from({ length: 25 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
												x1: 30 + i * 20,
												y1: "60",
												x2: 30 + i * 20,
												y2: "120",
												stroke: invertContrast ? "#94a3b8" : "#475569",
												strokeWidth: "1",
												strokeDasharray: "2 3",
												opacity: "0.4"
											}, i)),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "40",
												y: "30",
												width: "45",
												height: "18",
												fill: "none",
												stroke: invertContrast ? "#0f172a" : "#94a3b8",
												strokeWidth: "1"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "50",
												cy: "39",
												r: "2",
												fill: invertContrast ? "#0f172a" : "#05070a"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "62",
												cy: "39",
												r: "3",
												fill: invertContrast ? "#0f172a" : "#05070a"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "76",
												cy: "39",
												r: "4.5",
												fill: invertContrast ? "#0f172a" : "#05070a"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "40",
												y: "26",
												fill: invertContrast ? "#0f172a" : "#94a3b8",
												fontSize: "8",
												fontFamily: "monospace",
												children: "ASTM 20"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "480",
												y: "35",
												fill: invertContrast ? "#0f172a" : "#e2e8f0",
												fontSize: "14",
												fontWeight: "bold",
												fontFamily: "monospace",
												children: "B"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: "460",
												y: "150",
												fill: invertContrast ? "#0f172a" : "#e2e8f0",
												fontSize: "10",
												fontFamily: "monospace",
												children: "0-30"
											}),
											activeFilm.defectType === "crack" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M 230 88 Q 250 86 270 90 T 305 87",
													fill: "none",
													stroke: invertContrast ? "#0f172a" : "#000000",
													strokeWidth: "2.5",
													strokeLinecap: "round",
													filter: "blur(0.4px)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "230",
													cy: "88",
													r: "1.5",
													fill: invertContrast ? "#000" : "#000"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "305",
													cy: "87",
													r: "1.5",
													fill: invertContrast ? "#000" : "#000"
												})
											] }),
											activeFilm.defectType === "lack_of_fusion" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "190",
												y: "68",
												width: "110",
												height: "3.5",
												rx: "1",
												fill: invertContrast ? "#0f172a" : "#020617",
												filter: "blur(0.3px)"
											}) }),
											activeFilm.defectType === "porosity" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "260",
													cy: "85",
													r: "3",
													fill: invertContrast ? "#0f172a" : "#000"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "272",
													cy: "82",
													r: "2.2",
													fill: invertContrast ? "#0f172a" : "#000"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "280",
													cy: "92",
													r: "2.8",
													fill: invertContrast ? "#0f172a" : "#000"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "295",
													cy: "86",
													r: "2",
													fill: invertContrast ? "#0f172a" : "#000"
												})
											] }),
											activeFilm.defectType === "slag" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
												d: "M 215 82 C 235 80, 255 85, 275 83",
												fill: "none",
												stroke: invertContrast ? "#0f172a" : "#05070a",
												strokeWidth: "4",
												strokeLinecap: "round",
												filter: "blur(0.5px)"
											}) }),
											showReticle && activeFilm.measuredLengthMm > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
												opacity: "0.9",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
														x: "200",
														y: "48",
														width: activeFilm.measuredLengthMm * 4.5,
														height: "85",
														fill: "none",
														stroke: "#06b6d4",
														strokeWidth: "1.5",
														strokeDasharray: "3 3"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
														x1: "200",
														y1: "42",
														x2: "200",
														y2: "48",
														stroke: "#06b6d4",
														strokeWidth: "2"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
														x1: 200 + activeFilm.measuredLengthMm * 4.5,
														y1: "42",
														x2: 200 + activeFilm.measuredLengthMm * 4.5,
														y2: "48",
														stroke: "#06b6d4",
														strokeWidth: "2"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
														x1: "200",
														y1: "45",
														x2: 200 + activeFilm.measuredLengthMm * 4.5,
														y2: "45",
														stroke: "#06b6d4",
														strokeWidth: "1"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
														x: 200 + activeFilm.measuredLengthMm * 4.5 / 2,
														y: "38",
														fill: "#22d3ee",
														fontSize: "11",
														fontWeight: "bold",
														textAnchor: "middle",
														fontFamily: "monospace",
														children: [
															"L = ",
															activeFilm.measuredLengthMm,
															" mm"
														]
													})
												]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-800 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "w-4 h-4 text-amber-400 shrink-0" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono text-slate-400",
												children: isAr ? "شدة الإضاءة (Lux):" : "Illuminator Lux:"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "range",
												min: "20",
												max: "100",
												value: luxBrightness,
												onChange: (e) => setLuxBrightness(Number(e.target.value)),
												className: "w-28 sm:w-36 accent-cyan-500 cursor-pointer"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono text-slate-200",
												children: [Math.round(luxBrightness * 1e3), " Lux"]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setInvertContrast(!invertContrast),
											className: `px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${invertContrast ? "bg-cyan-600 text-white border-cyan-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"}`,
											children: invertContrast ? "Negative Film" : "Invert"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setShowReticle(!showReticle),
											className: `px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${showReticle ? "bg-cyan-600 text-white border-cyan-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"}`,
											children: isAr ? "مسطرة القياس" : "Reticle Scale"
										})]
									})]
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "lg:col-span-4 space-y-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between pb-4 border-b border-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-mono uppercase tracking-wider text-slate-400",
										children: isAr ? "تقرير التقييم الكودي المعتمد" : "Code Acceptance Verdict"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono ${activeFilm.verdict === "REJECT" ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"}`,
										children: [activeFilm.verdict === "REJECT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: activeFilm.verdict })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-500",
											children: isAr ? "اسم العيب والمؤشر:" : "Discontinuity Classification:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-bold text-slate-100 mt-0.5",
											children: activeFilm.defectName[language]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3 pt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 rounded-xl bg-slate-900/70 border border-slate-800",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-slate-500 text-[11px]",
													children: isAr ? "الطول المقاس:" : "Measured Length:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-base font-black font-mono text-cyan-400 mt-1",
													children: [activeFilm.measuredLengthMm, " mm"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 rounded-xl bg-slate-900/70 border border-slate-800",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-slate-500 text-[11px]",
													children: isAr ? "الحد الأقصى المسموح:" : "Max Allowable:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-base font-black font-mono text-slate-200 mt-1",
													children: activeFilm.maxAllowedMm === 0 ? "0 mm (None)" : `${activeFilm.maxAllowedMm} mm`
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "pt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-slate-500",
												children: isAr ? "الكود المرجعي للتقييم:" : "Governing Standard Reference:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs font-mono font-bold text-amber-400 mt-0.5",
												children: activeFilm.governingCode
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 leading-relaxed",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-cyan-400 font-bold mb-1",
												children: isAr ? "تحليل مهندس الفحص (Level III):" : "Level III Evaluation Notes:"
											}), activeFilm.verdictReason[language]]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "INSCO Quality Inspection Dept." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ASNT Level III #54161" })]
								})
							]
						})
					})]
				})
			]
		})
	});
};
//#endregion
//#region src/components/company/CompanyUltrasonicLabSection.tsx
var CompanyUltrasonicLabSection = ({ language, onNavigateToAcademy }) => {
	const isAr = language === "ar";
	const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
	const [activeDevice, setActiveDevice] = (0, import_react.useState)("ut");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "ultrasonic-lab",
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
//#region src/components/company/CompanyDemoPortal.tsx
var DEMOS = [
	{
		key: "hologram",
		icon: Layers,
		ar: {
			title: "المشهد الميداني ثلاثي الأبعاد",
			line: "كيف نقرأ هندسة الأصل قبل اختيار زاوية الفحص."
		},
		en: {
			title: "3D field inspection scene",
			line: "How we read asset geometry before choosing a scan angle."
		}
	},
	{
		key: "pwht",
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
		key: "rt",
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
		key: "ut",
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
/**
* Technical demonstrations, moved off the corporate landing page.
*
* Nothing was rewritten: the same four components the homepage used to render
* between the services and the certifications are mounted here, in the same
* order, so a buyer who wants proof still gets the full interactive tour — but
* no longer before they have seen the accreditations and the track record.
*/
var CompanyDemoPortal = ({ language, onBack, onRequestQuote, onOpenAcademy }) => {
	const isAr = language === "ar";
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
									children: isAr ? "هذه هي نفس الأجهزة والمنهجيات المستخدمة في الميدان: محاكاة دورة حرارية، عارض أفلام إشعاعية، ومعمل موجات فوق صوتية ومصفوفات طورية. للتعمّق التدريبي، تنتقل كل أداة إلى معملها الكامل داخل الأكاديمية." : "The same instruments and methods used in the field: a thermal cycle simulator, a radiographic film lightbox, and an ultrasonic / phased-array lab. Each tool links to its full training lab inside the academy."
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
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(isAr ? ArrowLeft : ArrowRight, { className: "w-3.5 h-3.5" })
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
							children: DEMOS.map((demo) => {
								const Icon = demo.icon;
								const copy = isAr ? demo.ar : demo.en;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-slate-800 bg-slate-900/40 p-4",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvancedMotionVisualizerSection, { language }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwhtCycleSimulator, { language }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadiographicFilmViewer, {
				language,
				onOpenFullRtLab: () => onOpenAcademy("rt_lab")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyUltrasonicLabSection, {
				language,
				onNavigateToAcademy: (tab) => onOpenAcademy(tab)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "py-12 bg-slate-900/50 border-t border-slate-800",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-bold text-white",
						children: isAr ? "جاهز تناقش نطاق مشروعك؟" : "Ready to scope your project?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-400 mt-1",
						children: isAr ? "فريق العمليات يرد على طلبات التسعير في أقل من 4 ساعات عمل." : "Technical operations answer quote requests in under 4 working hours."
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
