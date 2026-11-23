const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/InteractiveInspectionHologram-DwiWnpG_.js","assets/rolldown-runtime-oLLnCvco.js","assets/jsx-runtime-CJAQq89J.js","assets/rotate-ccw-wuxYnQna.js","assets/createLucideIcon-Cyy1bEkm.js","assets/index-BKrODMj6.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css","assets/three.module-VemjNcgc.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { J as useEscapeKey, Q as COMPANY_MEDIA, Wt as Maximize2, Y as useModalFocus, wt as Sparkles } from "./index-BKrODMj6.js";
//#region src/components/company/AdvancedMotionVisualizerSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var InteractiveInspectionHologram = import_react.lazy(() => __vitePreload(() => import("./InteractiveInspectionHologram-DwiWnpG_.js").then((module) => ({ default: module.InteractiveInspectionHologram })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])));
var AdvancedMotionVisualizerSection = ({ language }) => {
	const isAr = language === "ar";
	const [selectedGalleryImg, setSelectedGalleryImg] = (0, import_react.useState)(null);
	const lightbox = (0, import_react.useRef)(null);
	useEscapeKey(selectedGalleryImg !== null, () => setSelectedGalleryImg(null));
	useModalFocus(selectedGalleryImg !== null, lightbox);
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
				ar: "نموذج توضيحي لوحدة معالجة حرارية",
				en: "Typical programmable PWHT unit"
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
				ar: "مشهد توضيحي لمعدات التصوير",
				en: "Illustrative industrial radiography scene"
			},
			src: COMPANY_MEDIA.radiographyGammaScan,
			code: "ISO 17636 · DEMO",
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
		"data-demonstration": "hologram-lab",
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
							children: isAr ? "معرض مشاهد الفحص والمعالجة التوضيحية" : "Illustrative inspection and heat treatment gallery"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-400",
							children: isAr ? "صور توضيحية وليست سجلًا فعليًا لمعدة أو موقع عميل" : "Illustrations, not records of specific equipment or client sites."
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
					ref: lightbox,
					tabIndex: -1,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": galleryItems[selectedGalleryImg].title[language],
					className: "fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6",
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
export { AdvancedMotionVisualizerSection };
