import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as CircleCheck } from "./circle-check-C1rtQ7NC.js";
import { t as CircleX } from "./circle-x-uOqfXyjf.js";
import { Ct as Sun, rn as Eye } from "./index-BKrODMj6.js";
//#region src/components/company/RadiographicFilmViewer.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
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
		"data-demonstration": "radiography-viewer",
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
export { RadiographicFilmViewer };
