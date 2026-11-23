import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { n as Calculator, t as Film } from "./film-DtNt53Rt.js";
import { t as Calendar } from "./calendar-Dz5HIQpk.js";
import { t as CircleCheck } from "./circle-check-C1rtQ7NC.js";
import { t as Clock } from "./clock-B9C0lWAm.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as MapPin } from "./map-pin-CwI3o0GO.js";
import { t as RotateCcw } from "./rotate-ccw-wuxYnQna.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { Bt as MessageSquare, Cn as ArrowRight, Dt as Send, Ft as Phone, G as useDefaultUnitSystem, Gt as Mail, an as Download, bn as BookOpen, et as isStaticPages, ft as Wrench, ht as Users, lt as INSCO_COMPANY_DATA, mn as Check, on as Copy, ot as SectionHeading, ut as Zap, wn as ArrowLeft, yt as TriangleAlert } from "./index-BKrODMj6.js";
import { n as getSyllabusSummaryStats, t as downloadTrainingSyllabus } from "./trainingSyllabusGenerator--OIk2uTQ.js";
//#region src/components/company/CompanyQuickActionsSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var RFQ_QUICK_ACTION_EVENT = "insco:rfq-quick-action";
var CompanyQuickActionsSection = ({ language, onRequestQuote, onOpenCurriculum, mode = "both" }) => {
	const isAr = language === "ar";
	const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
	const syllabusStats = (0, import_react.useMemo)(() => getSyllabusSummaryStats(), []);
	const [quoteTriggeredService, setQuoteTriggeredService] = (0, import_react.useState)(null);
	const [downloadedFilename, setDownloadedFilename] = (0, import_react.useState)(null);
	const handleOneClickQuote = (serviceType) => {
		setQuoteTriggeredService(serviceType ?? "general");
		if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") window.dispatchEvent(new CustomEvent(RFQ_QUICK_ACTION_EVENT, { detail: { serviceType } }));
		if (onRequestQuote) onRequestQuote(serviceType);
		else if (typeof document !== "undefined") {
			const rfqEl = document.getElementById("rfq");
			if (rfqEl && typeof rfqEl.scrollIntoView === "function") rfqEl.scrollIntoView({ behavior: "smooth" });
		}
		if (typeof document !== "undefined") {
			const companyInput = document.getElementById("rfq-company-input");
			if (companyInput && typeof companyInput.focus === "function") companyInput.focus({ preventScroll: true });
		}
	};
	const handleOneClickDownloadSyllabus = () => {
		const generated = downloadTrainingSyllabus(language);
		setDownloadedFilename(generated.filename);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "quick-actions",
		"aria-labelledby": "quick-actions-heading",
		className: "py-10 border-b border-slate-800 bg-slate-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
						className: "w-3.5 h-3.5",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mode === "syllabus" ? isAr ? "الأكاديمية · المنهج التدريبي" : "Academy · Training syllabus" : isAr ? "التسعير السريع" : "Express quotation" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "quick-actions-heading",
					className: "text-xl sm:text-2xl font-black text-white tracking-tight mt-1",
					children: mode === "syllabus" ? isAr ? "المنهج التدريبي بنقرة واحدة" : "Training syllabus in one click" : mode === "quote" ? isAr ? "طلب عرض سعر فوري بخطوة واحدة" : "One-step express quotation" : isAr ? "الوصول المباشر بنقرة واحدة للتسعير التجاري والمنهج التدريبي" : "Quote presets and training syllabus"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-xs font-mono text-slate-400 flex items-center gap-2 tabular-nums",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
						className: "w-3.5 h-3.5 text-cyan-400 shrink-0",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mode === "syllabus" ? isAr ? "للتعلّم الذاتي، وليس اعتمادًا مهنيًا" : "Self-study, not professional certification" : isAr ? "يساعدك في تجهيز نطاق طلبك" : "Prepare your project scope" })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `grid grid-cols-1 gap-5 ${mode === "both" ? "lg:grid-cols-2" : "max-w-3xl"}`,
				children: [mode !== "syllabus" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between gap-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono text-cyan-400 tabular-nums",
								children: isAr ? "التعاقدات والعمليات الميدانية" : "Project enquiries"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-lg sm:text-xl font-bold text-white",
								children: isAr ? "طلب عرض سعر فوري للمشروعات والتفتيش الهندسي" : "Direct Commercial & Field Inspection Quotation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
								children: isAr ? "انتقل مباشرةً إلى نموذج التسعير السريع المربوط بقطاع العمليات الفنية مع إمكانية التحديد المسبق لنوع الخدمة المطلوبة." : "Jump straight to our pre-configured technical RFQ desk for rapid mobilization, shutdown support, or vendor prequalification."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-1 flex flex-wrap items-center gap-1.5",
								children: [
									{
										id: "pwht",
										label: {
											ar: "معالجة حرارية PWHT",
											en: "PWHT Fleet"
										}
									},
									{
										id: "ut_paut",
										label: {
											ar: "فحص UT / PAUT",
											en: "UT / PAUT"
										}
									},
									{
										id: "rt_gamma",
										label: {
											ar: "تصوير جاما وإكس راي RT",
											en: "Gamma & X-Ray RT"
										}
									},
									{
										id: "prequal",
										label: {
											ar: "تأهيل موردين AVL",
											en: "Vendor Prequal"
										}
									}
								].map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => handleOneClickQuote(preset.id),
									className: "px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition cursor-pointer",
									children: preset.label[language]
								}, preset.id))
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap items-center gap-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-testid": "quick-action-request-quote",
								onClick: () => handleOneClickQuote(),
								className: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition cursor-pointer shadow-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
										className: "w-4 h-4 shrink-0",
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "طلب عرض سعر (Request Quote)" : "Request Quote" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, {
										className: "w-4 h-4 shrink-0",
										"aria-hidden": "true"
									})
								]
							})
						}), quoteTriggeredService && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "status",
							className: "flex items-center gap-2 text-xs font-mono text-emerald-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
								className: "w-4 h-4 shrink-0",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تم تفعيل وتوجيهك مباشرةً إلى نموذج عرض السعر (#RFQ)." : "RFQ form activated and focused." })]
						})]
					})]
				}), mode !== "quote" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between gap-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs font-mono text-amber-400 tabular-nums",
								children: [
									syllabusStats.disciplineCount,
									" ",
									isAr ? "تخصصات" : "Disciplines",
									" · ",
									syllabusStats.moduleCount,
									" ",
									isAr ? "وحدة تدريبية" : "Modules",
									" · ",
									syllabusStats.totalTrainingHours,
									"h",
									" ",
									isAr ? "تقديرية للتعلّم" : "estimated study"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-lg sm:text-xl font-bold text-white",
								children: isAr ? "تحميل دليل المنهج التدريبي الكامل لأكاديمية إنسكو" : "INSCO Engineering Academy study syllabus"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
								children: isAr ? "حمّل خطة المقررات وساعات الدراسة التقديرية في UT وPAUT وRT وPWHT. لا تحل الخطة محل تدريب رسمي موثّق." : "Download the print-ready master syllabus covering Level I, II, and III qualification hours, laboratory modules, and ASME/API code competencies in one click."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-testid": "quick-action-download-syllabus",
								onClick: handleOneClickDownloadSyllabus,
								className: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "w-4 h-4 shrink-0",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تحميل المنهج التدريبي (Download Training Syllabus)" : "Download Training Syllabus" })]
							}), onOpenCurriculum && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onOpenCurriculum,
								className: "inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
									className: "w-4 h-4 text-amber-400 shrink-0",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تصفح المناهج تفاعلياً" : "Explore Interactive Curricula" })]
							})]
						}), downloadedFilename && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "status",
							className: "flex items-center gap-2 text-xs font-mono text-emerald-400 tabular-nums",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
								className: "w-4 h-4 shrink-0",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? `تم تجهيز وتحميل الملف: ${downloadedFilename}` : `Syllabus downloaded: ${downloadedFilename}` })]
						})]
					})]
				})]
			})]
		})
	});
};
//#endregion
//#region src/rfq/validation.ts
/** Shared client/server constraints. Composing a phone does not prove its ownership. */
var RFQ_FIELD_LIMITS = {
	companyName: 160,
	contactName: 160,
	phone: 40,
	email: 160,
	serviceType: 60,
	projectLocation: 160,
	description: 4e3
};
var EMAIL = /^[^\s@<>]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i;
function validRfqEmail(value) {
	return value.length <= RFQ_FIELD_LIMITS.email && EMAIL.test(value);
}
function normalizeRfqPhone(value) {
	const phone = value.trim().replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 1632)).replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 1776));
	if (phone.length > RFQ_FIELD_LIMITS.phone || !/^\+?[\d ().-]+$/.test(phone)) return null;
	const digits = phone.replace(/\D/g, "");
	return digits.length >= 8 && digits.length <= 15 ? `${phone.startsWith("+") ? "+" : ""}${digits}` : null;
}
//#endregion
//#region src/rfq/submit.ts
/**
* RFQ submission.
*
* The form used to answer "تم استلام طلبكم بنجاح" after generating a reference
* number in the browser — nothing left the tab. That is the worst possible
* failure for a sales form: the customer believes a quote request is queued,
* and nobody at INSCO ever sees it.
*
* Rules encoded here:
*   · A success screen may only be shown after a 2xx response that carries a
*     reference issued by the server. No local reference is ever invented.
*   · If no endpoint is configured (static GitHub Pages build without a
*     gateway), the outcome is `not_configured` — the UI then offers mail and
*     WhatsApp hand-off so the request still reaches a human.
*   · Network/timeout/server errors are distinct and retryable.
*/
var DEFAULT_TIMEOUT_MS = 15e3;
/**
* Where to POST.
*
* `VITE_RFQ_ENDPOINT` may be either the full endpoint (a Google Apps Script
* `/exec` URL) or the base of the INSCO gateway, in which
* case `/api/rfq` is appended — the same convention `VITE_AI_BASE_URL` uses for
* `/api/ai/*`.
*/
function resolveRfqEndpoint(override, staticOnly = isStaticPages()) {
	if (override === null) return null;
	const configured = (override ?? void 0 ?? "").trim();
	if (!configured) return staticOnly ? null : "/api/rfq";
	if (configured === "/api/rfq") return staticOnly ? null : configured;
	try {
		const target = new URL(configured);
		if (target.protocol !== "https:" || target.username || target.password || target.hash) return null;
		if (!/\/exec$|\/formResponse$|\/api\/rfq\/?$/i.test(target.pathname)) target.pathname = `${target.pathname.replace(/\/+$/, "")}/api/rfq`;
		return target.href;
	} catch {
		return null;
	}
}
function buildRfqPayload(form, language, extra = {}) {
	return {
		...form,
		companyName: form.companyName.trim(),
		contactName: form.contactName.trim(),
		email: form.email.trim(),
		phone: normalizeRfqPhone(form.phone) ?? form.phone.trim(),
		projectLocation: form.projectLocation.trim(),
		description: form.description.trim(),
		language,
		pageUrl: extra.pageUrl,
		submittedAt: (extra.now ?? /* @__PURE__ */ new Date()).toISOString()
	};
}
/** POST the request and report what actually happened. */
async function submitRfq(payload, options = {}) {
	const resolved = resolveRfqEndpoint(options.endpoint);
	if (!resolved) return {
		status: "failed",
		reason: "not_configured"
	};
	const endpoint = resolved.startsWith("/") && typeof window !== "undefined" && window.location?.origin ? `${window.location.origin}${resolved}` : resolved;
	const doFetch = options.fetchImpl ?? (typeof fetch === "function" ? fetch : null);
	if (!doFetch) return {
		status: "failed",
		reason: "network",
		detail: "fetch unavailable"
	};
	const controller = typeof AbortController === "function" ? new AbortController() : null;
	const timer = controller ? setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS) : null;
	const contentType = /script\.google\.com|googleusercontent\.com/.test(endpoint) ? "text/plain;charset=utf-8" : "application/json";
	let response;
	let body = null;
	try {
		response = await doFetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": contentType,
				Accept: "application/json"
			},
			credentials: "omit",
			referrerPolicy: "no-referrer",
			cache: "no-store",
			body: JSON.stringify(payload),
			signal: controller?.signal
		});
		if ([
			404,
			405,
			501
		].includes(response.status)) return {
			status: "failed",
			reason: "not_configured"
		};
		body = await response.json().catch(() => null);
	} catch {
		return {
			status: "failed",
			reason: "network"
		};
	} finally {
		if (timer) clearTimeout(timer);
	}
	const record = body ?? {};
	if (response.status === 429) return {
		status: "failed",
		reason: "rate_limited"
	};
	if (record.error === "rfq_delivery_not_configured") return {
		status: "failed",
		reason: "not_configured"
	};
	if (response.status === 400 || response.status === 422) return {
		status: "failed",
		reason: "validation"
	};
	const reference = typeof record.reference === "string" ? record.reference.trim() : "";
	if (!response.ok || record.ok !== true || !/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(reference)) return {
		status: "failed",
		reason: "server"
	};
	return {
		status: "sent",
		reference
	};
}
var SERVICE_LABELS = {
	pwht: {
		ar: "معالجة حرارية بعد اللحام (PWHT)",
		en: "Post-Weld Heat Treatment (PWHT)"
	},
	ut_paut: {
		ar: "فحص UT / PAUT",
		en: "Ultrasonic UT / PAUT"
	},
	rt_gamma: {
		ar: "تصوير إشعاعي جاما / إكس راي (RT)",
		en: "Radiography (RT)"
	},
	mt_pt: {
		ar: "فحوصات سطحية MT / PT / VT",
		en: "Surface MT/PT/VT"
	},
	pmi_hardness: {
		ar: "تحليل سبائك وصلادة PMI / HT",
		en: "PMI & Hardness"
	},
	hydro: {
		ar: "اختبار هيدروستاتيكي",
		en: "Hydrostatic Testing"
	},
	manpower: {
		ar: "توريد عمالة معتمدة",
		en: "Certified Manpower"
	},
	prequal: {
		ar: "تسجيل في سجل الموردين (AVL)",
		en: "AVL Registration"
	}
};
function serviceLabel(serviceType, language) {
	return SERVICE_LABELS[serviceType]?.[language] ?? serviceType;
}
/** Human-readable body used for the mail/WhatsApp hand-off. */
function buildRfqMessage(form, language) {
	return (language === "ar" ? [
		"طلب عرض سعر — شركة إنسكو",
		`الشركة: ${form.companyName}`,
		`المسؤول: ${form.contactName || "—"}`,
		`الهاتف: ${form.phone}`,
		`البريد: ${form.email}`,
		`الخدمة: ${serviceLabel(form.serviceType, "ar")}`,
		`الموقع: ${form.projectLocation || "—"}`,
		`التفاصيل: ${form.description || "—"}`
	] : [
		"RFQ — INSCO",
		`Company: ${form.companyName}`,
		`Contact: ${form.contactName || "—"}`,
		`Phone: ${form.phone}`,
		`Email: ${form.email}`,
		`Service: ${serviceLabel(form.serviceType, "en")}`,
		`Location: ${form.projectLocation || "—"}`,
		`Scope: ${form.description || "—"}`
	]).join("\n");
}
//#endregion
//#region src/components/company/CompanyContactSection.tsx
var CompanyContactSection = ({ language, submitRequest, initialService, toolsSlot }) => {
	const isAr = language === "ar";
	const configured = Boolean(submitRequest || resolveRfqEndpoint());
	const emptyDraft = {
		companyName: "",
		contactName: "",
		phone: "",
		email: "",
		serviceType: initialService ?? "pwht",
		projectLocation: "",
		description: ""
	};
	const [formData, setFormData] = (0, import_react.useState)(emptyDraft);
	const [submittedRef, setSubmittedRef] = (0, import_react.useState)(null);
	const [errorMessage, setErrorMessage] = (0, import_react.useState)(null);
	const [quickQuoteActive, setQuickQuoteActive] = (0, import_react.useState)(Boolean(initialService));
	const [sending, setSending] = (0, import_react.useState)(false);
	const [failure, setFailure] = (0, import_react.useState)(null);
	const [copyStatus, setCopyStatus] = (0, import_react.useState)(null);
	const sendingRef = (0, import_react.useRef)(false);
	const trap = (0, import_react.useRef)(null);
	const receiptHeading = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (submittedRef) receiptHeading.current?.focus();
	}, [submittedRef]);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		const handleQuickAction = (event) => {
			if (sendingRef.current) return;
			const custom = event;
			const requestedService = custom.detail?.serviceType;
			const requestedLocation = custom.detail?.projectLocation;
			const requestedDescription = custom.detail?.description;
			setSubmittedRef(null);
			setErrorMessage(null);
			setFailure(null);
			setQuickQuoteActive(true);
			setFormData((prev) => ({
				...prev,
				...requestedService ? { serviceType: requestedService } : {},
				...requestedLocation ? { projectLocation: requestedLocation } : {},
				...requestedDescription ? { description: requestedDescription } : {}
			}));
		};
		window.addEventListener(RFQ_QUICK_ACTION_EVENT, handleQuickAction);
		return () => window.removeEventListener(RFQ_QUICK_ACTION_EVENT, handleQuickAction);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!initialService) return;
		setFormData((prev) => ({
			...prev,
			serviceType: initialService
		}));
		setQuickQuoteActive(true);
	}, [initialService]);
	const sendRequest = async () => {
		if (sendingRef.current || !configured) return;
		const payload = {
			...buildRfqPayload(formData, language),
			website: trap.current?.value ?? ""
		};
		const oversized = Object.entries(RFQ_FIELD_LIMITS).some(([key, limit]) => payload[key].length > limit);
		if (!payload.companyName || !normalizeRfqPhone(payload.phone) || !validRfqEmail(payload.email) || oversized) {
			setErrorMessage(isAr ? "راجع اسم الشركة ورقم الهاتف والبريد الإلكتروني، وتأكد من أن طول النص لا يتجاوز الحد المسموح." : "Check the company name, phone number and email, and keep each field within its character limit.");
			return;
		}
		setErrorMessage(null);
		setFailure(null);
		setCopyStatus(null);
		sendingRef.current = true;
		setSending(true);
		try {
			const outcome = await (submitRequest ?? submitRfq)(payload);
			if (outcome.status === "sent") {
				setFormData(emptyDraft);
				setSubmittedRef(outcome.reference);
			} else setFailure(outcome.reason);
		} catch {
			setFailure("network");
		} finally {
			sendingRef.current = false;
			setSending(false);
		}
	};
	const failureMessage = (reason) => {
		if (reason === "not_configured") return isAr ? "الإرسال المباشر من الموقع غير متاح، ولم يُسجَّل طلب. استخدم قنوات التواصل أدناه." : "Online submission is unavailable and no request was registered. Use the contact options below.";
		if (reason === "rate_limited") return isAr ? "تم رفض المحاولة بسبب كثرة الطلبات. انتظر قبل المحاولة مرة أخرى أو تواصل معنا مباشرة." : "Too many attempts. Wait before trying again, or contact us directly.";
		if (reason === "validation") return isAr ? "رفض الخادم البيانات. راجع الحقول قبل إعادة الإرسال." : "The server rejected the form. Check the fields before trying again.";
		return isAr ? "لم يصل تأكيد الاستلام. تحقّق مع الفريق قبل إعادة الإرسال لتجنّب تكرار الطلب." : "Receipt could not be confirmed. Check with the team before resending to avoid a duplicate.";
	};
	const fallback = !configured || failure !== null;
	const draftMessage = () => buildRfqMessage(formData, language);
	const copyDraft = async () => {
		try {
			await navigator.clipboard.writeText(draftMessage());
			setCopyStatus("copied");
		} catch {
			setCopyStatus("manual");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "contact",
		className: "py-16 bg-slate-900/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					className: "mb-12",
					eyebrow: isAr ? "قنوات التواصل وطلب عروض الأسعار" : "Technical enquiries and quotation",
					title: isAr ? "تواصل مع الفريق الفني أو اطلب عرض سعر" : "Contact Technical Operations or Submit an RFQ",
					description: isAr ? "شارك نطاق العمل وموقعه علشان الفريق الفني يقدر يراجع طلبك ويحدد الخطوات التالية." : "Share your scope and location so the technical team can review your request and advise on next steps."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-5 space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-5 h-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-white",
										children: isAr ? "المقر الرئيسي (القاهرة)" : "Corporate Headquarters (Cairo)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-400",
										children: INSCO_COMPANY_DATA.contacts.headOffice[language]
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 border-t border-slate-800/80 text-xs text-slate-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] font-mono text-cyan-400 uppercase",
										children: isAr ? "الورش المركزية والمخازن:" : "Central Maintenance Workshops:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-0.5 text-slate-300",
										children: INSCO_COMPANY_DATA.contacts.workshops[language]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-5 h-5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-bold text-white",
											children: isAr ? "أرقام التواصل الفني" : "Technical contact numbers"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-slate-400",
											children: isAr ? "تنسيق العمليات الميدانية والانتشار" : "Site dispatch & mobilization coordination"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2 text-xs font-mono",
										children: INSCO_COMPANY_DATA.contacts.phones.map((phone, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-slate-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: phone }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: `tel:${phone.replace(/\s+/g, "")}`,
												className: "text-cyan-400 hover:text-cyan-300 font-semibold",
												children: isAr ? "اتصال مباشر" : "Call"
											})]
										}, idx))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-slate-400",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "w-4 h-4 text-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "واتساب الإدارة الميدانية:" : "Operations WhatsApp:" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											href: `https://wa.me/${INSCO_COMPANY_DATA.contacts.whatsapp.replace(/\D/g, "")}`,
											target: "_blank",
											rel: "noopener noreferrer",
											className: "font-mono text-emerald-400 hover:text-emerald-300 font-semibold",
											children: INSCO_COMPANY_DATA.contacts.whatsapp
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "w-5 h-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-white",
										children: isAr ? "البريد الرسمي للمراسلات" : "Official Communications"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: `mailto:${INSCO_COMPANY_DATA.contacts.email}`,
										className: "text-xs text-cyan-400 hover:text-cyan-300 font-mono",
										children: INSCO_COMPANY_DATA.contacts.email
									})] })]
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: "rfq",
						className: "lg:col-span-7",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `rounded-xl border bg-slate-950 p-6 sm:p-8 space-y-6 transition ${quickQuoteActive ? "border-cyan-500/70" : "border-slate-800"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-bold text-white",
									children: isAr ? "طلب عرض سعر / اعتماد في سجل الموردين" : "Formal RFQ & Vendor Prequalification Form"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-slate-400 mt-1",
									children: isAr ? "اكتب فقط المعلومات اللازمة للتسعير. لا تُدرج مستندات هوية أو بيانات سرّية في هذا النموذج." : "Share only what is needed for the quote. Do not include identity documents or confidential information."
								})] }), quickQuoteActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-mono text-cyan-400",
									children: isAr ? "وضع التسعير السريع مفعل" : "Express Quote Ready"
								})]
							}), submittedRef ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-6 text-center space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 flex items-center justify-center mx-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-6 h-6" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										ref: receiptHeading,
										tabIndex: -1,
										className: "text-base font-bold text-white",
										children: isAr ? "تم استلام طلبكم بنجاح" : "RFQ Successfully Received"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-slate-300 max-w-md mx-auto",
										children: [
											isAr ? "رقم المتابعة مع فريق التسعير:" : "Reference to use when following up with the tender desk:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", {
												className: "break-all font-mono",
												children: submittedRef
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setSubmittedRef(null),
										className: "px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer",
										children: isAr ? "إرسال طلب جديد" : "Submit Another Request"
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: (event) => {
									event.preventDefault();
									sendRequest();
								},
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										hidden: true,
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: trap,
											type: "text",
											name: "website",
											tabIndex: -1,
											autoComplete: "off"
										})
									}),
									(errorMessage || failure || !configured) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										role: configured ? "alert" : void 0,
										className: "flex items-start gap-2 rounded-lg border border-amber-500/40 bg-slate-900 p-3 text-xs leading-relaxed text-amber-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
											className: "mt-0.5 h-4 w-4 shrink-0",
											"aria-hidden": "true"
										}), errorMessage ?? failureMessage(failure ?? "not_configured")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "rfq-company-input",
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: isAr ? "اسم الشركة / المقاول *" : "Company / Contractor Name *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "rfq-company-input",
											type: "text",
											required: true,
											maxLength: RFQ_FIELD_LIMITS.companyName,
											autoComplete: "organization",
											value: formData.companyName,
											onChange: (e) => setFormData({
												...formData,
												companyName: e.target.value
											}),
											placeholder: isAr ? "مثال: شركة بترول خليج السويس" : "e.g., Petrobel / Eni / Orascom",
											className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "rfq-person",
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: isAr ? "اسم المسؤول / المسمى الوظيفي" : "Contact Person & Title"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											id: "rfq-person",
											maxLength: RFQ_FIELD_LIMITS.contactName,
											autoComplete: "name",
											value: formData.contactName,
											onChange: (e) => setFormData({
												...formData,
												contactName: e.target.value
											}),
											placeholder: isAr ? "م. أحمد سعيد - مدير المشروع" : "Eng. John Smith - Project Director",
											className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "rfq-phone",
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: isAr ? "رقم الهاتف للتواصل الميداني *" : "Mobile / Direct Phone *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "tel",
											required: true,
											id: "rfq-phone",
											maxLength: RFQ_FIELD_LIMITS.phone,
											autoComplete: "tel",
											dir: "ltr",
											value: formData.phone,
											onChange: (e) => setFormData({
												...formData,
												phone: e.target.value
											}),
											placeholder: "+20 100 ...",
											className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "rfq-email",
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: isAr ? "البريد الإلكتروني المؤسسي *" : "Corporate Email *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "email",
											required: true,
											id: "rfq-email",
											maxLength: RFQ_FIELD_LIMITS.email,
											autoComplete: "email",
											dir: "ltr",
											value: formData.email,
											onChange: (e) => setFormData({
												...formData,
												email: e.target.value
											}),
											placeholder: "contracts@company.com",
											className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "rfq-service",
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: isAr ? "نوع الخدمة المطلوبة" : "Primary Service Needed"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											id: "rfq-service",
											value: formData.serviceType,
											onChange: (e) => setFormData({
												...formData,
												serviceType: e.target.value
											}),
											className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "pwht",
													children: isAr ? "معالجة حرارية بعد اللحام (PWHT)" : "Post-Weld Heat Treatment (PWHT)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "ut_paut",
													children: isAr ? "فحص بالموجات فوق الصوتية (UT / PAUT)" : "Ultrasonic & Phased Array (UT/PAUT)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "rt_gamma",
													children: isAr ? "فحص إشعاعي جاما / أشعة سينية (RT)" : "Industrial Radiography Gamma/X-Ray (RT)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "mt_pt",
													children: isAr ? "فحوصات سطحية (MT / PT / VT)" : "Surface Testing (MT/PT/VT)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "pmi_hardness",
													children: isAr ? "تحليل سبائك واختبار صلادة (PMI / HT)" : "Alloy Analysis PMI & Hardness HT"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "hydro",
													children: isAr ? "اختبار هيدروستاتيكي للضغوط العالية (HYDRO)" : "Hydrostatic High-Pressure Testing"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "manpower",
													children: isAr ? "توريد عمالة لحام وتفتيش معتمدة" : "Welder & QC Manpower Supply"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "prequal",
													children: isAr ? "طلب تسجيل إنسكو في سجل الموردين المعتمدين" : "Approved Vendor List (AVL) Registration"
												})
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "rfq-location",
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: isAr ? "موقع المشروع / المحافظة" : "Job Site / Location"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											id: "rfq-location",
											maxLength: RFQ_FIELD_LIMITS.projectLocation,
											value: formData.projectLocation,
											onChange: (e) => setFormData({
												...formData,
												projectLocation: e.target.value
											}),
											placeholder: isAr ? "مثال: العين السخنة، حقل ظهر، الإسكندرية" : "e.g. Ain Sokhna, Alexandria yard",
											className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "rfq-scope",
										className: "block text-xs font-medium text-slate-300 mb-1",
										children: isAr ? "تفاصيل المواصفات الفنية أو حجم الأعمال" : "Technical Specifications / Project Scope"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										rows: 3,
										id: "rfq-scope",
										maxLength: RFQ_FIELD_LIMITS.description,
										value: formData.description,
										onChange: (e) => setFormData({
											...formData,
											description: e.target.value
										}),
										placeholder: isAr ? "القطر، نوع المعدن، الكود المرجعي (ASME B31.3, AWS D1.1)..." : "Pipe diameter, material grade, code (ASME B31.3, AWS D1.1)...",
										className: "w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
									})] }),
									configured && failure !== "not_configured" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pt-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "submit",
											disabled: sending,
											"aria-busy": sending,
											className: "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-sky-300 hover:bg-sky-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition shadow-sm cursor-pointer",
											children: [sending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												className: "w-4 h-4 shrink-0 animate-spin",
												"aria-hidden": "true"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
												className: "w-4 h-4 shrink-0",
												"aria-hidden": "true"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: sending ? isAr ? "جارٍ إرسال الطلب…" : "Sending your request…" : isAr ? "إرسال طلب التسعير" : "Submit Request to Technical Team" })]
										})
									}),
									fallback && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3 border-t border-slate-800 pt-4 text-sm text-slate-300",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: isAr ? "يمكنك نسخ المسودة ولصقها في رسالة ترسلها بنفسك. فتح البريد أو واتساب لا يرسل الطلب تلقائيًا." : "Copy the draft and paste it into a message you send yourself. Opening email or WhatsApp does not submit the request." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: () => {
															copyDraft();
														},
														className: "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold hover:bg-slate-800",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
															className: "h-4 w-4",
															"aria-hidden": "true"
														}), isAr ? "نسخ مسودة الطلب" : "Copy request draft"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
														href: `mailto:${INSCO_COMPANY_DATA.contacts.email}`,
														className: "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold hover:bg-slate-800",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
															className: "h-4 w-4",
															"aria-hidden": "true"
														}), isAr ? "إرسال بالبريد الإلكتروني" : "Open email"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
														href: `https://wa.me/${INSCO_COMPANY_DATA.contacts.whatsapp.replace(/\D/g, "")}`,
														target: "_blank",
														rel: "noopener noreferrer",
														className: "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold hover:bg-slate-800",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
															className: "h-4 w-4",
															"aria-hidden": "true"
														}), isAr ? "إرسال واتساب" : "Open WhatsApp"]
													})
												]
											}),
											copyStatus === "copied" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												role: "status",
												children: isAr ? "تم نسخ المسودة. لم يُرسَل الطلب." : "Draft copied. Nothing was sent."
											}),
											copyStatus === "manual" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "block text-xs",
												children: [isAr ? "انسخ النص التالي يدويًا:" : "Copy this text manually:", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
													readOnly: true,
													value: draftMessage(),
													rows: 4,
													className: "mt-1 w-full rounded bg-slate-900 p-2"
												})]
											})
										]
									})
								]
							})]
						})
					})]
				}),
				toolsSlot
			]
		})
	});
};
//#endregion
//#region src/utils/projectCostEstimator.ts
var USD_TO_EGP_RATE = 49.5;
var ESTIMATOR_SERVICES = [
	{
		id: "pwht",
		shortCode: "PWHT",
		rfqServiceValue: "pwht",
		name: {
			ar: "المعالجة الحرارية الموضعية (PWHT 65 kW)",
			en: "Post-Weld Heat Treatment (PWHT)"
		},
		description: {
			ar: "وحدات 65 كيلوواط إلكترونية ذات 6 قنوات ومسجلات حرارة معايرة.",
			en: "65 kW 6-channel computerized consoles with calibrated chart recorders."
		},
		governingCode: "ASME B31.3 / Sec VIII",
		baseRateUsdPerJoint: 185,
		dailyCapacityPerCrew: 6,
		personnelPerCrew: 2,
		equipmentUnitName: {
			ar: "وحدة معالجة حرارية 65 kW",
			en: "65 kW PWHT Console"
		}
	},
	{
		id: "ut",
		shortCode: "UT / PAUT",
		rfqServiceValue: "ut_paut",
		name: {
			ar: "الموجات فوق الصوتية والمصفوفات (UT / PAUT)",
			en: "Ultrasonic & Phased Array (UT / PAUT)"
		},
		description: {
			ar: "فحص حجمي بأجهزة Krautkrämer USM 35X و Olympus OmniScan.",
			en: "Volumetric weld flaw sizing with USM 35X & Olympus OmniScan."
		},
		governingCode: "ASME Sec V Art. 4",
		baseRateUsdPerJoint: 68,
		dailyCapacityPerCrew: 16,
		personnelPerCrew: 2,
		equipmentUnitName: {
			ar: "جهاز فحص موجات UT / PAUT",
			en: "UT / PAUT Flaw Detector"
		}
	},
	{
		id: "rt",
		shortCode: "RT",
		rfqServiceValue: "rt_gamma",
		name: {
			ar: "التصوير الإشعاعي بالجاما والإكس راي (RT)",
			en: "Industrial Radiography (Gamma / X-Ray)"
		},
		description: {
			ar: "كاميرات Sentinel Ir-192 / Se-75 ومعمل تحميض متنقل بترخيص ENRRA.",
			en: "Sentinel Ir-192 / Se-75 projectors & mobile darkroom (ENRRA licensed)."
		},
		governingCode: "ASME Sec V Art. 2",
		baseRateUsdPerJoint: 82,
		dailyCapacityPerCrew: 14,
		personnelPerCrew: 3,
		equipmentUnitName: {
			ar: "كاميرا أشعة ومعمل تحميض متنقل",
			en: "RT Projector & Mobile Darkroom"
		}
	},
	{
		id: "surface",
		shortCode: "MT / PT / VT",
		rfqServiceValue: "mt_pt",
		name: {
			ar: "الفحوصات السطحية والبصرية (MT / PT / VT)",
			en: "Surface & Visual Testing (MT / PT / VT)"
		},
		description: {
			ar: "كشف الشروخ السطحية بالجسيمات المغناطيسية والسوائل النافذة.",
			en: "Magnetic particle yoke, penetrant, and certified weld visual inspection."
		},
		governingCode: "ASME Sec V Art. 6 & 7",
		baseRateUsdPerJoint: 28,
		dailyCapacityPerCrew: 32,
		personnelPerCrew: 2,
		equipmentUnitName: {
			ar: "طقم فحص سطحي ومغناطيسي معاير",
			en: "MT Yoke & PT Inspection Kit"
		}
	},
	{
		id: "pmi_ht",
		shortCode: "PMI & HT",
		rfqServiceValue: "pmi_hardness",
		name: {
			ar: "تحليل السبائك واختبار الصلادة (PMI & Hardness)",
			en: "Alloy Verification (PMI) & Hardness (HT)"
		},
		description: {
			ar: "تحقق كيميائي فوري للسبائك (P11/P22/P91) وقياس صلادة برينل بعد PWHT.",
			en: "XRF alloy verification and post-PWHT Brinell/Vickers hardness testing."
		},
		governingCode: "ASTM E1476 / A370",
		baseRateUsdPerJoint: 36,
		dailyCapacityPerCrew: 28,
		personnelPerCrew: 1,
		equipmentUnitName: {
			ar: "جهاز تحليل سبائك وصلادة رقمي",
			en: "XRF PMI & UCI Hardness Unit"
		}
	},
	{
		id: "hydro",
		shortCode: "HYDRO",
		rfqServiceValue: "hydro",
		name: {
			ar: "الاختبار الهيدروستاتيكي للضغوط (Hydrotest)",
			en: "Hydrostatic Pressure Testing"
		},
		description: {
			ar: "طلمبات ضغط عالٍ وعدادات ومسجلات ضغط وحرارة معتمدة لخطوط الأنابيب.",
			en: "High-pressure test pumps, manifolds, and calibrated pressure recorders."
		},
		governingCode: "ASME B31.3 / B31.4",
		baseRateUsdPerJoint: 54,
		dailyCapacityPerCrew: 20,
		personnelPerCrew: 2,
		equipmentUnitName: {
			ar: "منظومة ضغط هيدروستاتيكي ومسجل",
			en: "Hydrotest Pump & Chart Package"
		}
	}
];
var THICKNESS_TIER_OPTIONS = [
	{
		id: "small_thin",
		multiplier: .78,
		capacityFactor: 1.25,
		label: {
			ar: "أقطار صغيرة (≤ 6\" · سماكة ≤ 12 مم)",
			en: "Small-Bore (≤ 6\" · Wall ≤ 12 mm)"
		}
	},
	{
		id: "medium_std",
		multiplier: 1,
		capacityFactor: 1,
		label: {
			ar: "أقطار قياسية (8\"–18\" · سماكة 12–28 مم)",
			en: "Standard Process (8\"–18\" · 12–28 mm)"
		}
	},
	{
		id: "heavy_thick",
		multiplier: 1.55,
		capacityFactor: .65,
		label: {
			ar: "سماكات ثقيلة ومراجل (≥ 20\" · سماكة > 28 مم)",
			en: "Heavy-Wall / Steam Headers (≥ 20\" · > 28 mm)"
		}
	}
];
var MOBILIZATION_ZONE_OPTIONS = [
	{
		id: "cairo_suez",
		baseFeeUsd: 650,
		locationLabel: {
			ar: "القاهرة الكبرى / العين السخنة / السويس",
			en: "Greater Cairo / Ain Sokhna / Suez"
		}
	},
	{
		id: "alex_delta",
		baseFeeUsd: 1100,
		locationLabel: {
			ar: "الإسكندرية / الدلتا / بورسعيد (حقل ظهر)",
			en: "Alexandria / Delta / Port Said"
		}
	},
	{
		id: "red_sea_upper",
		baseFeeUsd: 1850,
		locationLabel: {
			ar: "البحر الأحمر / الصعيد / الحقول الصحراوية",
			en: "Red Sea / Upper Egypt / Remote Fields"
		}
	}
];
function formatEstimatorCurrency(amountUsd, currency) {
	const value = currency === "EGP" ? Math.round(amountUsd * USD_TO_EGP_RATE) : Math.round(amountUsd);
	const formatted = new Intl.NumberFormat("en-US").format(value);
	return currency === "EGP" ? `${formatted} EGP` : `$${formatted}`;
}
function calculateProjectEstimate(input) {
	const safeJoints = Math.max(1, Math.min(2e3, Math.round(input.jointCount)));
	const tier = THICKNESS_TIER_OPTIONS.find((t) => t.id === input.thicknessTier) ?? THICKNESS_TIER_OPTIONS[1];
	const zone = MOBILIZATION_ZONE_OPTIONS.find((z) => z.id === input.mobilizationZone) ?? MOBILIZATION_ZONE_OPTIONS[0];
	const isShutdown24x7 = input.shiftSchedule === "shutdown_24_7";
	const shiftRateMultiplier = isShutdown24x7 ? 1.28 : 1;
	const shiftOutputBoost = isShutdown24x7 ? 1.75 : 1;
	if (input.selectedServices.length === 0) return {
		lineItems: [],
		mobilizationUsd: 0,
		totalMidpointUsd: 0,
		minBudgetUsd: 0,
		maxBudgetUsd: 0,
		estimatedSiteDays: 0,
		totalCertifiedPersonnel: 0,
		includesRsoOfficer: false,
		pwhtUnitsAllocated: 0,
		requiredGeneratorKva: 0,
		estimatedRtFilms: 0,
		primaryRfqServiceValue: "pwht"
	};
	const bundleFactor = input.selectedServices.length >= 3 ? .95 : 1;
	const rawItems = [];
	let maxSingleDisciplineDays = 1;
	let totalCrew = 0;
	let pwhtUnitsAllocated = 0;
	for (const svcId of input.selectedServices) {
		const spec = ESTIMATOR_SERVICES.find((s) => s.id === svcId);
		if (!spec) continue;
		const equipmentUnits = Math.min(svcId === "pwht" ? 16 : 6, safeJoints > 120 ? 3 : safeJoints > 45 ? 2 : 1);
		if (svcId === "pwht") pwhtUnitsAllocated = equipmentUnits;
		const effectiveDailyOutput = Math.max(1, spec.dailyCapacityPerCrew * equipmentUnits * tier.capacityFactor * shiftOutputBoost);
		const serviceDays = Math.max(1, Math.ceil(safeJoints / effectiveDailyOutput));
		if (serviceDays > maxSingleDisciplineDays) maxSingleDisciplineDays = serviceDays;
		const shiftFactorForCrew = isShutdown24x7 ? 2 : 1;
		const crewCount = spec.personnelPerCrew * equipmentUnits * shiftFactorForCrew;
		totalCrew += crewCount;
		const costUsd = Math.round(safeJoints * spec.baseRateUsdPerJoint * tier.multiplier * shiftRateMultiplier * bundleFactor);
		rawItems.push({
			serviceId: spec.id,
			shortCode: spec.shortCode,
			name: spec.name,
			equipmentUnits,
			equipmentUnitName: spec.equipmentUnitName,
			crewCount,
			serviceDays,
			costUsd
		});
	}
	const includesRsoOfficer = input.selectedServices.includes("rt");
	if (includesRsoOfficer) totalCrew += 1;
	const rtHazmatLogisticsUsd = includesRsoOfficer ? 420 : 0;
	const multiEquipmentLogisticsUsd = Math.max(0, rawItems.length - 1) * 240;
	const mobilizationUsd = zone.baseFeeUsd + rtHazmatLogisticsUsd + multiEquipmentLogisticsUsd;
	const totalMidpointUsd = rawItems.reduce((acc, item) => acc + item.costUsd, 0) + mobilizationUsd;
	const lineItems = rawItems.map((item) => ({
		...item,
		sharePct: totalMidpointUsd > 0 ? Math.max(1, Math.round(item.costUsd / totalMidpointUsd * 100)) : 0
	}));
	const minBudgetUsd = Math.round(totalMidpointUsd * .92);
	const maxBudgetUsd = Math.round(totalMidpointUsd * 1.08);
	const sequentialBufferDays = input.selectedServices.length >= 2 ? 1 : 0;
	const estimatedSiteDays = maxSingleDisciplineDays + sequentialBufferDays;
	const requiredGeneratorKva = pwhtUnitsAllocated * 75;
	const filmsPerJoint = input.thicknessTier === "heavy_thick" ? 5 : input.thicknessTier === "medium_std" ? 3 : 2;
	const estimatedRtFilms = includesRsoOfficer ? safeJoints * filmsPerJoint : 0;
	const firstSpec = ESTIMATOR_SERVICES.find((s) => s.id === input.selectedServices[0]) ?? ESTIMATOR_SERVICES[0];
	return {
		lineItems,
		mobilizationUsd,
		totalMidpointUsd,
		minBudgetUsd,
		maxBudgetUsd,
		estimatedSiteDays,
		totalCertifiedPersonnel: totalCrew,
		includesRsoOfficer,
		pwhtUnitsAllocated,
		requiredGeneratorKva,
		estimatedRtFilms,
		primaryRfqServiceValue: firstSpec.rfqServiceValue
	};
}
function buildEstimateRfqSummary(input, result, currency, language) {
	const isAr = language === "ar";
	const tier = THICKNESS_TIER_OPTIONS.find((t) => t.id === input.thicknessTier) ?? THICKNESS_TIER_OPTIONS[1];
	const codes = result.lineItems.map((li) => li.shortCode).join(" + ");
	const rangeStr = `${formatEstimatorCurrency(result.minBudgetUsd, currency)} – ${formatEstimatorCurrency(result.maxBudgetUsd, currency)}`;
	if (isAr) return `تقدير مشروع أولي: الخدمات (${codes}) | عدد الوصلات: ${input.jointCount} وصلة (${tier.label.ar}) | المدة المقدرة: ${result.estimatedSiteDays} أيام عمل | الطاقم: ${result.totalCertifiedPersonnel} فرد معتمد | الميزانية التقديرية: ${rangeStr}.`;
	return `Project Estimate Scope: Services (${codes}) | Volume: ${input.jointCount} weld joints (${tier.label.en}) | Est. Duration: ${result.estimatedSiteDays} site days | Crew: ${result.totalCertifiedPersonnel} certified personnel | Budgetary Range: ${rangeStr}.`;
}
//#endregion
//#region src/components/company/CompanyProjectCostEstimator.tsx
var IMPERIAL_THICKNESS_LABELS = {
	small_thin: {
		ar: "أقطار صغيرة (≤ 6\" · سماكة ≤ 0.47 بوصة)",
		en: "Small-Bore (≤ 6\" · Wall ≤ 0.47\")"
	},
	medium_std: {
		ar: "أقطار قياسية (8\"–18\" · سماكة 0.47–1.10 بوصة)",
		en: "Standard Process (8\"–18\" · 0.47\"–1.10\")"
	},
	heavy_thick: {
		ar: "سماكات ثقيلة ومراجل (≥ 20\" · سماكة > 1.10 بوصة)",
		en: "Heavy-Wall / Steam Headers (≥ 20\" · > 1.10\")"
	}
};
var CompanyProjectCostEstimator = ({ language, onTransferToRfq }) => {
	const isAr = language === "ar";
	const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
	const { defaultUnitSystem } = useDefaultUnitSystem();
	const [selectedServices, setSelectedServices] = (0, import_react.useState)(["pwht", "ut"]);
	const [jointCount, setJointCount] = (0, import_react.useState)(40);
	const [thicknessTier, setThicknessTier] = (0, import_react.useState)("medium_std");
	const [mobilizationZone, setMobilizationZone] = (0, import_react.useState)("cairo_suez");
	const [shiftSchedule, setShiftSchedule] = (0, import_react.useState)("day_standard");
	const [currency, setCurrency] = (0, import_react.useState)("USD");
	const [transferredNotice, setTransferredNotice] = (0, import_react.useState)(false);
	const toggleService = (serviceId) => {
		setTransferredNotice(false);
		setSelectedServices((prev) => {
			if (prev.includes(serviceId)) {
				if (prev.length === 1) return prev;
				return prev.filter((id) => id !== serviceId);
			}
			return [...prev, serviceId];
		});
	};
	const handleResetDefaults = () => {
		setSelectedServices(["pwht", "ut"]);
		setJointCount(40);
		setThicknessTier("medium_std");
		setMobilizationZone("cairo_suez");
		setShiftSchedule("day_standard");
		setTransferredNotice(false);
	};
	const estimateInput = (0, import_react.useMemo)(() => ({
		selectedServices,
		jointCount,
		thicknessTier,
		mobilizationZone,
		shiftSchedule
	}), [
		selectedServices,
		jointCount,
		thicknessTier,
		mobilizationZone,
		shiftSchedule
	]);
	const estimate = (0, import_react.useMemo)(() => calculateProjectEstimate(estimateInput), [estimateInput]);
	const activeZone = MOBILIZATION_ZONE_OPTIONS.find((z) => z.id === mobilizationZone) ?? MOBILIZATION_ZONE_OPTIONS[0];
	const handleTransferEstimateToRfq = () => {
		const summaryText = buildEstimateRfqSummary(estimateInput, estimate, currency, language);
		if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") window.dispatchEvent(new CustomEvent(RFQ_QUICK_ACTION_EVENT, { detail: {
			serviceType: estimate.primaryRfqServiceValue,
			projectLocation: activeZone.locationLabel[language],
			description: summaryText
		} }));
		setTransferredNotice(true);
		if (onTransferToRfq) onTransferToRfq();
		else if (typeof document !== "undefined") {
			const rfqEl = document.getElementById("rfq");
			if (rfqEl && typeof rfqEl.scrollIntoView === "function") rfqEl.scrollIntoView({ behavior: "smooth" });
		}
		if (typeof document !== "undefined") {
			const companyInput = document.getElementById("rfq-company-input");
			if (companyInput && typeof companyInput.focus === "function") companyInput.focus({ preventScroll: true });
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "cost-estimator",
		"aria-labelledby": "cost-estimator-heading",
		"data-unit-mode": defaultUnitSystem,
		className: "py-16 border-b border-slate-800 bg-slate-900/50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calculator, {
								className: "w-4 h-4",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "حاسبة تكلفة ومتطلبات المشروعات الهندسية (Project Cost Estimator)" : "Project Cost & Resource Estimator" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "cost-estimator-heading",
							className: "text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
							children: isAr ? "قدّر ميزانية مشروعك والأسطول والطاقم المطلوب فورياً" : "Interactive Project Cost & Mobilization Requirements Estimator"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm sm:text-base text-slate-400 leading-relaxed",
							children: isAr ? "اختر نوعاً واحداً أو حزمة متكاملة من خدمات الفحص والمعالجة الحرارية (PWHT، UT/PAUT، RT الجاما والإكس راي، MT/PT، PMI) لحساب الميزانية التقديرية وعدد المعدات وأيام العمل الميدانية." : "Select one or multiple inspection and heat treatment disciplines (PWHT, UT/PAUT, RT, MT/PT, PMI, Hydrotest) to estimate budgetary cost ranges, crew size, fleet units, and site duration."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "group",
						"aria-label": isAr ? "عملة التقدير" : "Estimator Currency",
						className: "inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setCurrency("USD"),
							className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${currency === "USD" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`,
							children: "USD ($)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setCurrency("EGP"),
							className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${currency === "EGP" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`,
							children: "EGP (ج.م)"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: handleResetDefaults,
						className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
							className: "w-3.5 h-3.5",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "إعادة الضبط" : "Reset" })]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-7 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm sm:text-base font-bold text-white",
								children: isAr ? "1. اختر الخدمات الهندسية المطلوبة بالمشروع (متعدد الاختيارات)" : "1. Select Required Inspection & PWHT Services (Multi-Select)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-mono text-cyan-400 tabular-nums",
								children: [
									selectedServices.length,
									" / ",
									ESTIMATOR_SERVICES.length,
									" ",
									isAr ? "خدمات محددة" : "Selected",
									selectedServices.length >= 3 ? isAr ? " · خصم حزمة 5%" : " · 5% Bundle Applied" : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
							children: ESTIMATOR_SERVICES.map((svc) => {
								const isSelected = selectedServices.includes(svc.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": isSelected,
									"data-testid": `estimator-service-${svc.id}`,
									onClick: () => toggleService(svc.id),
									className: `p-4 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between gap-2 ${isSelected ? "bg-cyan-950/30 border-cyan-500 text-white shadow-sm" : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-mono font-bold text-cyan-400",
													children: svc.shortCode
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? "bg-cyan-500 border-cyan-400 text-slate-950" : "border-slate-700 bg-slate-950"}`,
													children: isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3.5 h-3.5 stroke-[3]" })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs sm:text-sm font-bold",
												children: svc.name[language]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-slate-400 leading-relaxed",
												children: svc.description[language]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: svc.governingCode }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-slate-200 font-bold",
											children: [
												formatEstimatorCurrency(svc.baseRateUsdPerJoint, currency),
												"/",
												isAr ? "وصلة" : "jt"
											]
										})]
									})]
								}, svc.id);
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm sm:text-base font-bold text-white",
								children: isAr ? "2. حدد حجم الأعمال ومواصفات الموقع والجدول الزمني" : "2. Configure Weld Joint Volume, Pipe Tier & Mobilization"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "estimator-joint-count",
										className: "font-bold text-slate-200",
										children: isAr ? "إجمالي عدد وصلات اللحام / نقاط الفحص:" : "Estimated Weld Joints / Test Points:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "estimator-joint-count",
											type: "number",
											min: 1,
											max: 1e3,
											value: jointCount,
											onChange: (e) => setJointCount(Math.max(1, Math.min(1e3, Number(e.target.value) || 1))),
											className: "w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-xs text-center tabular-nums"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-400 font-mono",
											children: isAr ? "وصلة" : "joints"
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									"aria-label": isAr ? "شريط تمرير عدد الوصلات" : "Weld joint count slider",
									type: "range",
									min: 5,
									max: 500,
									step: 5,
									value: Math.min(500, jointCount),
									onChange: (e) => setJointCount(Number(e.target.value)),
									className: "w-full accent-cyan-500 cursor-pointer"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "estimator-thickness-tier",
										className: "block text-xs font-bold text-slate-200",
										children: isAr ? "فئة الأقطار وسماكة الجدار:" : "Pipe Diameter & Wall Thickness:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "estimator-thickness-tier",
										value: thicknessTier,
										onChange: (e) => setThicknessTier(e.target.value),
										className: "w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500",
										children: THICKNESS_TIER_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: opt.id,
											children: defaultUnitSystem === "imperial" ? IMPERIAL_THICKNESS_LABELS[opt.id][language] : opt.label[language]
										}, opt.id))
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "estimator-zone",
										className: "block text-xs font-bold text-slate-200",
										children: isAr ? "النطاق الجغرافي للمشروع:" : "Project Site & Mobilization Zone:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "estimator-zone",
										value: mobilizationZone,
										onChange: (e) => setMobilizationZone(e.target.value),
										className: "w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500",
										children: MOBILIZATION_ZONE_OPTIONS.map((z) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: z.id,
											children: z.locationLabel[language]
										}, z.id))
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-bold text-slate-200",
									children: isAr ? "نظام التشغيل والورديات بالموقع:" : "Execution Shift Schedule:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setShiftSchedule("day_standard"),
										className: `p-3 rounded-xl border text-xs font-bold text-start transition cursor-pointer ${shiftSchedule === "day_standard" ? "bg-cyan-600 text-white border-cyan-400" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: isAr ? "وردية نهارية قياسية (10 ساعات)" : "Standard Day Shift (10h)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `text-[11px] font-normal mt-0.5 ${shiftSchedule === "day_standard" ? "text-cyan-100" : "text-slate-400"}`,
											children: isAr ? "للمشروعات الإنشائية والتصنيع" : "Optimal cost for fabrication & construction"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setShiftSchedule("shutdown_24_7"),
										className: `p-3 rounded-xl border text-xs font-bold text-start transition cursor-pointer ${shiftSchedule === "shutdown_24_7" ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: isAr ? "طوارئ وعَمرة متواصلة 24/7 (ورديتان)" : "24/7 Turnaround / Shutdown (Dual Crew)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `text-[11px] font-normal mt-0.5 ${shiftSchedule === "shutdown_24_7" ? "text-slate-900" : "text-slate-400"}`,
											children: isAr ? "يختصر مدة التنفيذ بمقدار ~43% لتوقفات المصافي" : "Cuts site duration by ~43% for critical outages"
										})]
									})]
								})]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-5 rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 space-y-5 shadow-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pb-4 border-b border-slate-800 space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase tracking-wider text-cyan-400",
									children: isAr ? "النطاق المالي التقديري للمشروع" : "Estimated Project Budget Range"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									"data-testid": "estimator-budget-range",
									className: "text-2xl sm:text-3xl font-black text-white font-mono tabular-nums",
									children: [
										formatEstimatorCurrency(estimate.minBudgetUsd, currency),
										" –",
										" ",
										formatEstimatorCurrency(estimate.maxBudgetUsd, currency)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs font-mono text-slate-400 tabular-nums",
									children: [
										isAr ? "القيمة المرجعية المتوسطة:" : "Midpoint Estimate:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "text-amber-400",
											children: formatEstimatorCurrency(estimate.totalMidpointUsd, currency)
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-bold uppercase tracking-wider text-slate-300",
									children: isAr ? "متطلبات التنفيذ والموارد الميدانية المقدرة" : "Estimated Project Requirements"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3 tabular-nums",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 rounded-xl border border-slate-800 bg-slate-900/70",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 text-[11px] text-slate-400",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
													className: "w-3.5 h-3.5 text-cyan-400",
													"aria-hidden": "true"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "المدة الزمنية بالموقع" : "Est. Site Duration" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												"data-testid": "estimator-site-days",
												className: "text-lg font-black text-white font-mono mt-1",
												children: [
													estimate.estimatedSiteDays,
													" ",
													isAr ? "أيام عمل" : "Days"
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 rounded-xl border border-slate-800 bg-slate-900/70",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 text-[11px] text-slate-400",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
													className: "w-3.5 h-3.5 text-amber-400",
													"aria-hidden": "true"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "الطاقم الهندسي المعتمد" : "Certified Crew" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												"data-testid": "estimator-crew-count",
												className: "text-lg font-black text-white font-mono mt-1",
												children: [
													estimate.totalCertifiedPersonnel,
													" ",
													isAr ? "أفراد" : "Personnel"
												]
											})]
										}),
										estimate.pwhtUnitsAllocated > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 rounded-xl border border-slate-800 bg-slate-900/70",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 text-[11px] text-slate-400",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
													className: "w-3.5 h-3.5 text-orange-400",
													"aria-hidden": "true"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "قدرة التغذية الكهربائية" : "PWHT Power Load" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-sm font-black text-white font-mono mt-1",
												children: [
													estimate.pwhtUnitsAllocated,
													"× 65kW (",
													estimate.requiredGeneratorKva,
													" kVA)"
												]
											})]
										}),
										estimate.estimatedRtFilms > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 rounded-xl border border-slate-800 bg-slate-900/70",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 text-[11px] text-slate-400",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, {
													className: "w-3.5 h-3.5 text-emerald-400",
													"aria-hidden": "true"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "أفلام الأشعة المقدرة" : "Est. RT Film Count" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-sm font-black text-white font-mono mt-1",
												children: [
													"~",
													estimate.estimatedRtFilms,
													" ",
													isAr ? "فيلم ASTM" : "Films"
												]
											})]
										})
									]
								}),
								estimate.includesRsoOfficer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center gap-2 text-[11px] font-mono text-cyan-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
										className: "w-4 h-4 text-cyan-400 shrink-0",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "يتضمن مسؤول وقاية إشعاعية مرخص (ENRRA RSO) وعربة تحميض متنقلة." : "Includes dedicated ENRRA Radiation Safety Officer (RSO) & mobile darkroom." })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5 pt-2 border-t border-slate-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, {
									className: "w-3.5 h-3.5 text-cyan-400",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تفصيل البنود والمعدات المخصصة" : "Itemized Service & Fleet Allocation" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 text-xs tabular-nums",
								children: [estimate.lineItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between font-bold text-white",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.shortCode }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-cyan-400",
											children: formatEstimatorCurrency(item.costUsd, currency)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											item.equipmentUnits,
											"× ",
											item.equipmentUnitName[language]
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											item.crewCount,
											" ",
											isAr ? "فنيين" : "crew",
											" · ",
											item.serviceDays,
											"d"
										] })]
									})]
								}, item.serviceId)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl border border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-xs font-mono text-slate-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "الانتشار اللوجستي وتصاريح السلامة (Mobilization)" : "Site Mobilization & HSE Logistics" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-slate-200",
										children: formatEstimatorCurrency(estimate.mobilizationUsd, currency)
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5 pt-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-testid": "estimator-transfer-rfq-btn",
									onClick: handleTransferEstimateToRfq,
									className: "w-full py-3.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
											className: "w-4 h-4 shrink-0",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تحويل التقدير والمواصفات إلى طلب عرض سعر رسمي (#RFQ)" : "Lock Scope & Request Official Quote (#RFQ)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, {
											className: "w-4 h-4 shrink-0",
											"aria-hidden": "true"
										})
									]
								}),
								transferredNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									role: "status",
									className: "text-xs font-mono text-emerald-400 text-center",
									children: isAr ? "تم نسخ تفاصيل التقدير والموقع تلقائياً إلى نموذج #RFQ بالأسفل." : "Estimate scope and location populated into the #RFQ form below."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-slate-500 leading-relaxed",
									children: isAr ? "الأرقام أعلاه استرشادية لتخطيط ميزانيات المشروعات؛ يصدر العرض المالي الملزم بعد مراجعة جدول الأقطار (Weld Map) من الإدارة الفنية." : "Figures represent planning estimates; binding commercial rates are issued upon weld-map review by Technical Operations."
								})
							]
						})
					]
				})]
			})]
		})
	});
};
//#endregion
//#region src/components/company/CompanyQuotePage.tsx
function CompanyQuotePage({ language, anchor, quoteService }) {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyContactSection, {
		language,
		initialService: quoteService,
		toolsSlot: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			open: anchor === "cost-estimator" || anchor === "quick-actions" ? true : void 0,
			className: "mt-8 rounded-xl border border-slate-800 bg-slate-950/60",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer px-4 py-4 font-semibold text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
					children: isAr ? "أدوات اختيارية: تسعير سريع وحاسبة تقديرية" : "Optional tools: quote presets and cost estimator"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 text-sm leading-relaxed text-slate-300",
					children: isAr ? "الأرقام للتخطيط فقط؛ عرض السعر الرسمي يصدر من الفريق الفني." : "Figures are for planning only. The technical team issues the formal quote."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyQuickActionsSection, {
					language,
					mode: "quote"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyProjectCostEstimator, {
					language,
					onTransferToRfq: () => document.getElementById("rfq")?.scrollIntoView({ block: "start" })
				})
			]
		})
	});
}
//#endregion
export { CompanyQuotePage };
