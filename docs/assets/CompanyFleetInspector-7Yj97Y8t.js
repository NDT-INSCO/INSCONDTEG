import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { t as CircleCheck } from "./circle-check-C1rtQ7NC.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { dn as ChevronRight, fn as ChevronLeft, nn as FileCheck2, ot as SectionHeading, yt as TriangleAlert } from "./index-BKrODMj6.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CircleMinus = createLucideIcon("circle-minus", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "M8 12h8",
	key: "1wcyev"
}]]);
//#endregion
//#region src/utils/calibration.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var MONTH = /^(\d{4})-(\d{2})$/;
var DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
/**
* Last moment the record is still valid, in UTC.
* Month-only input expands to the final day of that month — we never assume an
* earlier day, because under-claiming validity is the safe direction.
*/
function validityEnd(validUntil) {
	if (!validUntil) return null;
	const month = MONTH.exec(validUntil);
	if (month) {
		const year = Number(month[1]);
		const monthIndex = Number(month[2]);
		if (monthIndex < 1 || monthIndex > 12) return null;
		return new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59));
	}
	const day = DAY.exec(validUntil);
	if (day) {
		const date = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]), 23, 59, 59));
		return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === validUntil ? date : null;
	}
	return null;
}
function calibrationState(validUntil, now = /* @__PURE__ */ new Date(), warningDays = 60) {
	const end = validityEnd(validUntil);
	if (!end) return "unknown";
	const remainingMs = end.getTime() - now.getTime();
	if (remainingMs < 0) return "expired";
	if (remainingMs <= warningDays * 24 * 60 * 60 * 1e3) return "expiring";
	return "valid";
}
var MONTHS_AR = [
	"يناير",
	"فبراير",
	"مارس",
	"أبريل",
	"مايو",
	"يونيو",
	"يوليو",
	"أغسطس",
	"سبتمبر",
	"أكتوبر",
	"نوفمبر",
	"ديسمبر"
];
var MONTHS_EN = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
/** Human date for the register: month precision stays month precision. */
function formatValidity(validUntil, language) {
	if (!validUntil || !validityEnd(validUntil)) return language === "ar" ? "غير محددة" : "Not stated";
	const month = MONTH.exec(validUntil);
	if (month) return `${(language === "ar" ? MONTHS_AR : MONTHS_EN)[Number(month[2]) - 1] ?? month[2]} ${month[1]}`;
	const day = DAY.exec(validUntil);
	if (day) {
		const name = (language === "ar" ? MONTHS_AR : MONTHS_EN)[Number(day[2]) - 1] ?? day[2];
		return language === "ar" ? `${Number(day[3])} ${name} ${day[1]}` : `${Number(day[3])} ${name} ${day[1]}`;
	}
	return validUntil;
}
function calibrationLabel(state, language) {
	switch (state) {
		case "valid": return language === "ar" ? "معايرة سارية" : "Calibration valid";
		case "expiring": return language === "ar" ? `تنتهي خلال 60 يومًا` : `Expires within 60 days`;
		case "expired": return language === "ar" ? "المعايرة منتهية" : "Calibration expired";
		default: return language === "ar" ? "الصلاحية غير منشورة" : "Validity not published";
	}
}
/** Tailwind classes per state — call with a verified state before using the green valid tone. */
function calibrationTone(state) {
	switch (state) {
		case "valid": return {
			badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
			card: "border-emerald-500/40",
			icon: "text-emerald-400"
		};
		case "expiring": return {
			badge: "bg-amber-500/10 border-amber-500/40 text-amber-300",
			card: "border-amber-500/40",
			icon: "text-amber-300"
		};
		case "expired": return {
			badge: "bg-red-500/10 border-red-500/40 text-red-300",
			card: "border-red-500/50",
			icon: "text-red-400"
		};
		default: return {
			badge: "bg-slate-500/10 border-slate-500/30 text-slate-300",
			card: "border-slate-700",
			icon: "text-slate-400"
		};
	}
}
//#endregion
//#region src/utils/fleetRecordStatus.ts
function exactDay(value) {
	return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && validityEnd(value));
}
function fleetRecordStatus(record, now) {
	const reviewed = record.reviewedCalibration;
	const reviewedDate = reviewed && exactDay(reviewed.reviewedOn) ? /* @__PURE__ */ new Date(`${reviewed.reviewedOn}T00:00:00Z`) : null;
	const verified = Boolean(reviewed?.certificateReference.trim() && exactDay(reviewed.expiresOn) && reviewedDate && reviewedDate <= now);
	const expiry = verified ? reviewed.expiresOn : validityEnd(record.validUntil) ? record.validUntil : null;
	return {
		verified,
		state: calibrationState(expiry, now),
		expiry,
		nextCalibration: exactDay(record.nextCalibrationOn) ? record.nextCalibrationOn : null,
		maintenance: record.maintenance ?? "not_reported"
	};
}
//#endregion
//#region src/components/company/CompanyFleetInspector.tsx
var import_jsx_runtime = require_jsx_runtime();
/** Icon that matches the derived calibration state — never a fixed green tick. */
function StateIcon({ state, className }) {
	if (state === "valid") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
		className,
		"aria-hidden": "true"
	});
	if (state === "expiring") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
		className,
		"aria-hidden": "true"
	});
	if (state === "expired") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleMinus, {
		className,
		"aria-hidden": "true"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheck2, {
		className,
		"aria-hidden": "true"
	});
}
function evidenceLabel(status, language) {
	if (status.maintenance === "on_hold") return language === "ar" ? "موقوفة للصيانة" : "Maintenance hold";
	if (status.verified) return calibrationLabel(status.state, language);
	return status.state === "expired" ? language === "ar" ? "تاريخ السجل منتهٍ · غير محقَّق" : "Register date expired · unverified" : language === "ar" ? "المعايرة غير محقَّقة" : "Calibration not verified";
}
function evidenceTone(status) {
	if (status.maintenance === "on_hold") return "expiring";
	return status.verified || status.state === "expired" ? status.state : "unknown";
}
var FLEET_REGISTRY = [
	{
		id: "pwht-65kw",
		name: {
			ar: "وحدات المعالجة الحرارية الأوتوماتيكية 65 kW (16 وحدة مملوكة)",
			en: "65 kW Automatic Heat Treatment Units (16 Owned Units)"
		},
		category: "pwht",
		ownedQty: 16,
		model: "65 kW / 65 kVA 6-Channel Auto Programmer",
		manufacturer: "Cooperheat / Stork Engineering",
		serialRange: "INS-PWHT-01 to INS-PWHT-16",
		calibrationBody: "National Institute for Standards (NIS) / Traceable NIST",
		calibrationStatus: {
			ar: "معايرة NIS متتبعة (NIST)",
			en: "NIS-traceable calibration"
		},
		validUntil: "2026-12",
		applications: [{
			ar: "تسخين مبدئي ومعالجة حرارية بعد اللحام للمواسير والأوعية",
			en: "Pre-heating & Post-Weld Heat Treatment for Piping"
		}, {
			ar: "معالجة سبائك P91, P22, P11, P5 في محطات الطاقة",
			en: "Alloy heat treatment P91, P22, P11 in CCPP power plants"
		}],
		keySpecs: [
			{
				label: {
					ar: "القدرة الحرارية الخارجة",
					en: "Heating Output"
				},
				value: "65 kW"
			},
			{
				label: {
					ar: "القدرة الكهربية المسحوبة",
					en: "Apparent Power Draw"
				},
				value: "65 kVA / 400V 3-Phase"
			},
			{
				label: {
					ar: "قنوات التحكم",
					en: "Control Channels"
				},
				value: "6 Independent PID Zones"
			},
			{
				label: {
					ar: "مسجل درجات الحرارة",
					en: "Recorder"
				},
				value: "Chino / Eurotherm 6-Pt Strip Chart"
			},
			{
				label: {
					ar: "أقصى درجة حرارة",
					en: "Max Temperature"
				},
				value: "1,200 °C"
			}
		],
		deployedProjects: [
			"Burullus 4,800 MW CCPP",
			"Talkha Power Plant",
			"El-Kureimat",
			"El Sewedy Electric"
		]
	},
	{
		id: "olympus-paut",
		name: {
			ar: "أجهزة فحص الموجات والمصفوفات الطورية (Olympus OmniScan)",
			en: "Phased Array Ultrasonic Flaw Detectors (Olympus OmniScan)"
		},
		category: "ut",
		ownedQty: 4,
		model: "OmniScan X3 / MX2 64:128PR",
		manufacturer: "Olympus NDT / Evident Scientific",
		serialRange: "INS-UT-PA01 to PA04",
		calibrationBody: "Evident Certified Calibration Lab (ISO 17025)",
		calibrationStatus: {
			ar: "معايرة إلكترونية سنوية معتمدة",
			en: "Factory Calibrated"
		},
		validUntil: "2026-11",
		applications: [{
			ar: "فحص رقمي مشفر لوصلات اللحام المحيطية واستبدال الأشعة RT",
			en: "Encoded sectorial weld inspection replacing conventional RT"
		}, {
			ar: "كشف شروخ الجذور ونقص الانصهار بمسح قطاعي S-Scan و L-Scan",
			en: "Root cracks, LOF, and porosity volumetric sizing"
		}],
		keySpecs: [
			{
				label: {
					ar: "المصفوفة الإلكترونية",
					en: "Pulser / Receiver"
				},
				value: "32:128PR & 64:128PR"
			},
			{
				label: {
					ar: "الماسح المشفر",
					en: "Encoder"
				},
				value: "Mini-Wheel Optical Encoder"
			},
			{
				label: {
					ar: "زوايا المسح",
					en: "Beam Angles"
				},
				value: "35° to 75° Sectorial"
			}
		],
		deployedProjects: [
			"Burullus CCPP Steam Lines",
			"PetroMasila Yemen",
			"NVOC Borg El-Arab"
		]
	},
	{
		id: "krautkramer-usm",
		name: {
			ar: "أجهزة قياس العيوب بالموجات فوق الصوتية (Krautkramer USM 35X)",
			en: "Digital Ultrasonic Flaw Detectors (Krautkramer USM 35X)"
		},
		category: "ut",
		ownedQty: 8,
		model: "USM 35X DAC/AWS",
		manufacturer: "GE Sensing & Inspection / Krautkramer",
		serialRange: "INS-UT-01 to INS-UT-08",
		calibrationBody: "National Standards Lab (NIS Egypt)",
		calibrationStatus: {
			ar: "معايرة نصف سنوية دورية",
			en: "Calibrated with IIW Blocks"
		},
		validUntil: "2026-10",
		applications: [{
			ar: "فحص يدوي شامل للحامات الأنابيب والصفائح المعدنية",
			en: "Manual UT of pipe welds and structural plates"
		}, {
			ar: "قياس دقيق لسماكة الجدران المتبقية وكشف التآكل الداخلي",
			en: "Precision wall thickness and internal corrosion surveys"
		}],
		keySpecs: [
			{
				label: {
					ar: "التردد التشغيلي",
					en: "Frequency Range"
				},
				value: "0.5 to 20 MHz"
			},
			{
				label: {
					ar: "منحنيات المقارنة",
					en: "Evaluation Curve"
				},
				value: "ASME DAC, TCG, DGS & AWS D1.1"
			},
			{
				label: {
					ar: "قوالب المعايرة",
					en: "Calibration Blocks"
				},
				value: "V1 / V2 & Step Wedges"
			}
		],
		deployedProjects: [
			"Ayoun Mousa Power Station",
			"Talkha CCPP",
			"Elsewedy Transformers"
		]
	},
	{
		id: "sentinel-rt",
		name: {
			ar: "حاويات التصوير الإشعاعي الصناعي بجاما (Sentinel 880 Delta)",
			en: "Gamma Industrial Radiography Projectors (Sentinel 880)"
		},
		category: "rt",
		ownedQty: 6,
		model: "Sentinel 880 Delta / SPEC 150",
		manufacturer: "QSA Global / Source Production",
		serialRange: "INS-RT-01 to INS-RT-06",
		calibrationBody: "Egyptian Nuclear & Radiological Regulatory Authority (ENRRA)",
		calibrationStatus: {
			ar: "مرخص ومحصن من هيئة الرقابة النووية",
			en: "ENRRA Practice Licensed"
		},
		validUntil: null,
		applications: [{
			ar: "تصوير إشعاعي صناعي لأنابيب الغاز والنفط والأوعية المضغوطة",
			en: "Volumetric radiography for cross-country pipelines & vessels"
		}, {
			ar: "توثيق أرشيفي دائم على أفلام صناعية وكواشف رقمية",
			en: "Permanent radiographic film archival & digital CR"
		}],
		keySpecs: [
			{
				label: {
					ar: "المصادر المشعة",
					en: "Radioisotopes"
				},
				value: "Iridium-192 & Selenium-75"
			},
			{
				label: {
					ar: "أقصى نشاط إشعاعي",
					en: "Max Capacity"
				},
				value: "100 Ci (Ir-192)"
			},
			{
				label: {
					ar: "كوليماتور الحزمة",
					en: "Collimator"
				},
				value: "Tungsten Directional 60°"
			}
		],
		deployedProjects: [
			"ORASCOM Power Projects",
			"El Sewedy Electric (PO GM102473)",
			"Bagram Airfield Project"
		]
	},
	{
		id: "niton-pmi",
		name: {
			ar: "محلل السبائك المحمول بالأشعة السينية (Thermo Niton XL2)",
			en: "Handheld XRF Positive Material Analyzer (Thermo Niton)"
		},
		category: "metallurgy",
		ownedQty: 2,
		model: "Niton XL2 GOLDD Ultra",
		manufacturer: "Thermo Fisher Scientific",
		serialRange: "INS-PMI-01 & 02",
		calibrationBody: "Thermo Fisher Certified Factory Calibration",
		calibrationStatus: {
			ar: "معايرة بمعايير معتمدة NIST Standard",
			en: "NIST Standards Verified"
		},
		validUntil: "2026-12",
		applications: [{
			ar: "تحليل فوري لتركيب سبائك الصلب المقاوم للصدأ والكروم موليبدينوم",
			en: "Instant chemical verification for Cr-Mo & Stainless Steel"
		}, {
			ar: "منع خلط المواد بمستودعات البترول ومواقع التركيبات",
			en: "Material mix-up prevention on refineries & piping spools"
		}],
		keySpecs: [
			{
				label: {
					ar: "العناصر القابلة للتحليل",
					en: "Element Range"
				},
				value: "Ti to Bi (Cr, Ni, Mo, V, Mn, Fe)"
			},
			{
				label: {
					ar: "زمن التحليل",
					en: "Test Duration"
				},
				value: "2 - 5 Seconds"
			},
			{
				label: {
					ar: "مكتبة السبائك",
					en: "Alloy Library"
				},
				value: "500+ Standard Grade Alloys"
			}
		],
		deployedProjects: [
			"Burullus 4,800 MW CCPP",
			"PetroMasila Yemen",
			"Ayoun Mousa Station"
		]
	},
	{
		id: "parker-mt",
		name: {
			ar: "حدوات الفحص بالجسيمات المغناطيسية (Parker B-300 AC/DC)",
			en: "Electromagnetic Particle Yokes (Parker B-300 AC/DC)"
		},
		category: "mt_pt",
		ownedQty: 12,
		model: "B-300 Contour Probe AC/DC",
		manufacturer: "Parker Research Corp. (USA)",
		serialRange: "INS-MT-01 to INS-MT-12",
		calibrationBody: "National Standards Lab (Deadweight 10 lbs / 40 lbs test)",
		calibrationStatus: {
			ar: "معايرة قوة الرفع الدورية مجددة",
			en: "Lift Capacity Verified"
		},
		validUntil: "2026-11",
		applications: [{
			ar: "كشف شقوق السطح وتحت السطح باللحامات الإنشائية والأنابيب",
			en: "Surface and sub-surface flaw detection in ferromagnetic welds"
		}, {
			ar: "فحوصات جسيمات رطبة وجافة وفلورية تحت الأشعة فوق البنفسجية",
			en: "Dry powder, wet visible, and fluorescent UV inspections"
		}],
		keySpecs: [
			{
				label: {
					ar: "قوة الرفع بالتيار المتردد",
					en: "AC Lift Capacity"
				},
				value: "10 lbs (4.5 kg) Verified"
			},
			{
				label: {
					ar: "قوة الرفع بالتيار المستمر",
					en: "DC Lift Capacity"
				},
				value: "40 lbs (18 kg) Verified"
			},
			{
				label: {
					ar: "أذرع التثبيت",
					en: "Leg Configuration"
				},
				value: "Double Jointed Articulated"
			}
		],
		deployedProjects: [
			"El Sewedy Electric",
			"Talkha Expansions",
			"US Army Bagram Project"
		]
	},
	{
		id: "maximator-hydro",
		name: {
			ar: "مضخات ومسجلات الضغط الهيدروستاتيكي العالي (Maximator Skid)",
			en: "High-Pressure Hydrostatic Testing Skids (Maximator 15,000 PSI)"
		},
		category: "hydro",
		ownedQty: 4,
		model: "Maximator Air-Driven Liquid Pump Skid",
		manufacturer: "Maximator GmbH (Germany)",
		serialRange: "INS-HYD-01 to 04",
		calibrationBody: "Egyptian Organization for Standardization (EOS)",
		calibrationStatus: {
			ar: "مانومترات ومسجلات معايرة معتمدة",
			en: "Deadweight Calibrated"
		},
		validUntil: "2027-01",
		applications: [{
			ar: "اختبارات الضغط الهيدروستاتيكي للأنابيب والأوعية البترولية",
			en: "Proof pressure testing for high-pressure process piping"
		}, {
			ar: "تسجيل بياني للضغط والحرارة على مسجلات دائرية معتمدة",
			en: "Barton 2-Pen circular chart recording (Pressure & Temp)"
		}],
		keySpecs: [
			{
				label: {
					ar: "أقصى ضغط تشغيلي",
					en: "Max Test Pressure"
				},
				value: "15,000 PSI (1,034 Bar)"
			},
			{
				label: {
					ar: "مسجل الضغط",
					en: "Recorder"
				},
				value: "Barton 242E 2-Pen Circular Chart"
			},
			{
				label: {
					ar: "دقة القياس",
					en: "Accuracy"
				},
				value: "Class 0.5% Full Scale"
			}
		],
		deployedProjects: [
			"NVOC Borg El-Arab",
			"PetroMasila Yemen",
			"Orascom Power Stations"
		]
	}
];
var CompanyFleetInspector = ({ language, now }) => {
	const isAr = language === "ar";
	const today = now ?? /* @__PURE__ */ new Date();
	const ArrowIcon = isAr ? ChevronLeft : ChevronRight;
	const [activeCategory, setActiveCategory] = (0, import_react.useState)("all");
	const [selectedEquipmentId, setSelectedEquipmentId] = (0, import_react.useState)("pwht-65kw");
	const categories = [
		{
			id: "all",
			label: {
				ar: "كل المعدات بالسجل",
				en: "All listed equipment"
			}
		},
		{
			id: "pwht",
			label: {
				ar: "وحدات PWHT",
				en: "PWHT equipment"
			}
		},
		{
			id: "ut",
			label: {
				ar: "أجهزة الموجات UT / PAUT",
				en: "Ultrasonic (UT/PAUT)"
			}
		},
		{
			id: "rt",
			label: {
				ar: "أجهزة جاما الإشعاعية RT",
				en: "Gamma Radiography"
			}
		},
		{
			id: "mt_pt",
			label: {
				ar: "حدوات المغناطيسية MT/PT",
				en: "Surface MT/PT"
			}
		},
		{
			id: "metallurgy",
			label: {
				ar: "تحليل السبائك والصلادة",
				en: "PMI & Hardness"
			}
		},
		{
			id: "hydro",
			label: {
				ar: "مضخات الضغط الهيدروستاتيكي",
				en: "Hydro Testing"
			}
		}
	];
	const filteredFleet = FLEET_REGISTRY.filter((item) => {
		if (activeCategory === "all") return true;
		return item.category === activeCategory;
	});
	const selectedItem = filteredFleet.find((i) => i.id === selectedEquipmentId) ?? filteredFleet[0];
	const selectedStatus = fleetRecordStatus(selectedItem, today);
	const selectedState = evidenceTone(selectedStatus);
	const selectedTone = calibrationTone(selectedState);
	const expiredCount = FLEET_REGISTRY.filter((item) => fleetRecordStatus(item, today).state === "expired").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "fleet-inspector",
		className: "py-16 border-b border-slate-800 bg-slate-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
							eyebrow: isAr ? "سجل الأصول والمعايرة والتجهيزات الميدانية" : "Equipment and calibration register",
							eyebrowIcon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-4 h-4 text-cyan-400" }),
							title: isAr ? "المعدات وحالة الوثائق" : "Equipment and record status",
							description: isAr ? "راجع البيانات الواردة في سجل إنسكو. اسأل الفريق الفني عن شهادة كل جهاز وتوافره لمشروعك." : "Browse entries in the INSCO register. Ask the technical team for the certificate and availability of the specific instrument."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-slate-300 leading-relaxed",
							children: isAr ? "التواريخ المنقولة من السجل ليست شهادات معايرة. الحالة لا تؤكد الجاهزية للتشغيل أو انتهاء الصيانة." : "Dates copied from the register are not calibration certificates. This register does not establish operational readiness or maintenance clearance."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-end shrink-0 space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-2xl font-black text-cyan-400 font-mono tabular-nums",
								children: FLEET_REGISTRY.length
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-slate-400",
								children: isAr ? "فئات معدات بالسجل" : "Equipment entries"
							}),
							expiredCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[11px] font-mono text-red-300 flex items-center justify-end gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
									className: "w-3 h-3",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? `${expiredCount} تاريخ منتهٍ حسب السجل` : `${expiredCount} expired register date(s)` })]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap items-center gap-1.5 pb-4 mb-8",
					children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": activeCategory === cat.id,
						onClick: () => setActiveCategory(cat.id),
						className: `px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${activeCategory === cat.id ? "bg-sky-300 text-slate-950 font-bold" : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800"}`,
						children: cat.label[language]
					}, cat.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "lg:col-span-5 space-y-3",
						children: filteredFleet.map((equip) => {
							const isSelected = equip.id === selectedItem.id;
							const status = fleetRecordStatus(equip, today);
							const state = evidenceTone(status);
							const tone = calibrationTone(state);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-pressed": isSelected,
								onClick: () => setSelectedEquipmentId(equip.id),
								className: `w-full text-start p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${isSelected ? "border-cyan-500 bg-cyan-950/20 text-white" : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800",
											children: [
												equip.ownedQty,
												" ",
												isAr ? "وحدات" : "Units"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-mono text-slate-400",
											children: equip.manufacturer
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-bold text-slate-100 mt-1.5",
										children: equip.name[language]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: `w-4 h-4 shrink-0 transition mt-1 ${isSelected ? "text-cyan-400" : "text-slate-600"}` })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-2 border-t border-slate-800/80",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `flex items-center gap-1 ${tone.icon}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateIcon, {
											state,
											className: "w-3 h-3"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: evidenceLabel(status, language) })]
									}), status.expiry && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-300",
										children: formatValidity(status.expiry, language)
									})]
								})]
							}, equip.id);
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs font-mono text-cyan-400 mb-1",
									children: [
										selectedItem.manufacturer,
										" · ",
										selectedItem.model
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xl font-black text-white",
									children: selectedItem.name[language]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex flex-col gap-1 shrink-0 ${selectedTone.badge}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateIcon, {
											state: selectedState,
											className: "w-4 h-4"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: evidenceLabel(selectedStatus, language) })]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "grid gap-3 rounded-lg border border-slate-700 p-4 text-sm sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-slate-300",
										children: selectedStatus.verified ? isAr ? "انتهاء الشهادة بعد مراجعتها" : "Reviewed certificate expiry" : isAr ? "تاريخ الانتهاء المذكور بالسجل" : "Reported expiry date"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "font-semibold",
										children: formatValidity(selectedStatus.expiry, language)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-slate-300",
										children: isAr ? "المعايرة القادمة" : "Next calibration"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "font-semibold",
										children: formatValidity(selectedStatus.nextCalibration, language)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-slate-300",
										children: isAr ? "حالة الصيانة" : "Maintenance status"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "font-semibold",
										children: selectedStatus.maintenance === "on_hold" ? isAr ? "موقوفة للصيانة" : "Maintenance hold" : selectedStatus.maintenance === "clear" ? isAr ? "لا يوجد إيقاف مسجل للصيانة" : "No recorded maintenance hold" : isAr ? "لم تُنشر حالة الصيانة" : "Maintenance status not published"
									})] }),
									selectedStatus.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-slate-300",
										children: isAr ? "مرجع الشهادة" : "Certificate reference"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "break-all font-semibold",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: selectedItem.reviewedCalibration.certificateReference })
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-lg bg-slate-950/70 border border-slate-800",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-500 text-[11px]",
											children: isAr ? "النطاق التسلسلي (Serial No):" : "Serial Range:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-200 font-bold mt-0.5",
											children: selectedItem.serialRange
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-lg bg-slate-950/70 border border-slate-800",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-500 text-[11px]",
											children: isAr ? "جهة المعايرة المذكورة بالسجل:" : "Reported calibration laboratory:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-cyan-300 font-bold mt-0.5",
											children: selectedItem.calibrationBody
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-lg bg-slate-950/70 border border-slate-800 sm:col-span-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-500 text-[11px]",
											children: isAr ? "نوع سجل المعايرة:" : "Register entry:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-slate-200 font-bold mt-0.5",
											children: selectedItem.calibrationStatus[language]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase text-slate-400 tracking-wider",
									children: isAr ? "المواصفات الفنية حسب السجل:" : "Register specifications:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 sm:grid-cols-2 gap-3",
									children: selectedItem.keySpecs.map((spec, sIdx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-lg bg-slate-950/50 border border-slate-800",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-slate-400",
											children: spec.label[language]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-mono font-bold text-slate-100 mt-1",
											children: spec.value
										})]
									}, sIdx))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase text-slate-400 tracking-wider",
									children: isAr ? "التطبيقات الهندسية الميدانية:" : "Field Operational Capabilities:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-2 text-xs text-slate-300",
									children: selectedItem.applications.map((app, aIdx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4 text-cyan-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: app[language] })]
									}, aIdx))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-4 border-t border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase text-slate-400 tracking-wider mb-2",
									children: isAr ? "المشروعات المذكورة في سجل المعدة:" : "Projects named in the register:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: selectedItem.deployedProjects.map((proj, pIdx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono",
										children: proj
									}, pIdx))
								})]
							})
						]
					})]
				})
			]
		})
	});
};
//#endregion
export { CompanyFleetInspector };
