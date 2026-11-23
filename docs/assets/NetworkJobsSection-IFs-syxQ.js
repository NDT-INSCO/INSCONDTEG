const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firestoreClientService-BUGkAdZ4.js","assets/rolldown-runtime-oLLnCvco.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css","assets/index.esm-T7XjjJ2p.js","assets/config-BaEX8mXf.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as Briefcase } from "./briefcase-Dv_sjYzX.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as MapPin } from "./map-pin-CwI3o0GO.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Dt as Send, Ot as Search, P as useOptionalSiteAccount, _t as UserPlus, mn as Check } from "./index-BKrODMj6.js";
//#region src/network/networkJobsForm.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var NETWORK_JOB_LIMITS = {
	titleMin: 3,
	titleMax: 180,
	locationMin: 2,
	locationMax: 140,
	requirementsMin: 5,
	requirementsMax: 1500,
	methodMax: 32,
	methodsMax: 8
};
var NETWORK_OPPORTUNITY_TYPES = [
	{
		id: "job",
		ar: "وظيفة",
		en: "Job",
		accent: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
	},
	{
		id: "tender",
		ar: "مناقصة / عقد",
		en: "Tender / contract",
		accent: "text-amber-300 border-amber-500/40 bg-amber-500/10"
	},
	{
		id: "equipment",
		ar: "معدات ومهام",
		en: "Equipment & assignments",
		accent: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10"
	}
];
function opportunityTypeById(id) {
	return NETWORK_OPPORTUNITY_TYPES.find((type) => type.id === id);
}
var EMPTY_JOB_DRAFT = {
	type: "job",
	title: "",
	location: "",
	methods: "",
	requirements: ""
};
var trimmed = (value) => value.trim();
/**
* Method codes, cleaned the same way tags are: over-long codes are dropped rather
* than truncated, duplicates collapse, and the list is capped at eight.
*/
function normaliseMethods(raw) {
	const seen = /* @__PURE__ */ new Set();
	const methods = [];
	for (const part of raw.split(/[,،\n]+/)) {
		const method = part.trim().replace(/\s+/g, " ");
		if (!method) continue;
		if (method.length > NETWORK_JOB_LIMITS.methodMax) continue;
		const key = method.toUpperCase();
		if (seen.has(key)) continue;
		seen.add(key);
		methods.push(method);
		if (methods.length === NETWORK_JOB_LIMITS.methodsMax) break;
	}
	return methods;
}
function validateJobDraft(draft) {
	const errors = [];
	const push = (field, ar, en) => errors.push({
		field,
		ar,
		en
	});
	if (!opportunityTypeById(draft.type)) push("type", "اختر نوع الفرصة.", "Choose the opportunity type.");
	const title = trimmed(draft.title);
	if (title.length < NETWORK_JOB_LIMITS.titleMin) push("title", "العنوان قصير جداً (3 أحرف على الأقل).", "The title is too short (at least three characters).");
	else if (title.length > NETWORK_JOB_LIMITS.titleMax) push("title", `العنوان أطول من ${NETWORK_JOB_LIMITS.titleMax} حرفاً.`, `The title is longer than ${NETWORK_JOB_LIMITS.titleMax} characters.`);
	const location = trimmed(draft.location);
	if (location.length < NETWORK_JOB_LIMITS.locationMin) push("location", "اكتب المكان (المدينة/الموقع).", "Enter the location (city or site).");
	else if (location.length > NETWORK_JOB_LIMITS.locationMax) push("location", `المكان أطول من ${NETWORK_JOB_LIMITS.locationMax} حرفاً.`, `The location is longer than ${NETWORK_JOB_LIMITS.locationMax} characters.`);
	if (normaliseMethods(draft.methods).length === 0) push("methods", "اذكر طريقة فحص واحدة على الأقل (مثل PAUT أو RT).", "Name at least one method (e.g. PAUT or RT).");
	const requirements = trimmed(draft.requirements);
	if (requirements.length < NETWORK_JOB_LIMITS.requirementsMin) push("requirements", "اكتب المتطلبات (5 أحرف على الأقل): الشهادات والخبرة.", "Describe the requirements (at least five characters): certificates and experience.");
	else if (requirements.length > NETWORK_JOB_LIMITS.requirementsMax) push("requirements", `المتطلبات أطول من ${NETWORK_JOB_LIMITS.requirementsMax} حرفاً.`, `The requirements are longer than ${NETWORK_JOB_LIMITS.requirementsMax} characters.`);
	return errors;
}
/** Draft → the exact input `createCommunityOpportunity` accepts. */
function toOpportunityInput(draft, author) {
	return {
		authorName: trimmed(author.displayName),
		authorOrg: trimmed(author.organizationName),
		...author.companyCode ? { companyCode: author.companyCode } : {},
		opportunityType: draft.type,
		title: trimmed(draft.title),
		location: trimmed(draft.location),
		methods: normaliseMethods(draft.methods),
		requirements: trimmed(draft.requirements)
	};
}
function matchesJobFilter(opportunity, filter) {
	if (filter.type !== "all" && opportunity.opportunityType !== filter.type) return false;
	const method = filter.method.trim().toUpperCase();
	if (method) {
		if (!(opportunity.methods ?? []).map((entry) => entry.toUpperCase()).some((entry) => entry.includes(method))) return false;
	}
	const text = filter.text.trim().toLowerCase();
	if (!text) return true;
	return [
		opportunity.title,
		opportunity.location,
		opportunity.requirements,
		...opportunity.methods ?? []
	].join(" ").toLowerCase().includes(text);
}
//#endregion
//#region src/components/network/NetworkJobsSection.tsx
var import_jsx_runtime = require_jsx_runtime();
var fieldClass = "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none";
var relativeDate = (value, isAr) => {
	const millis = value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function" ? value.toMillis() : 0;
	if (!millis) return isAr ? "الآن" : "now";
	return new Date(millis).toLocaleDateString(isAr ? "ar-EG" : "en-GB");
};
/**
* `#network/jobs` — real opportunities.
*
* Reading, publishing and closing use `community_opportunities` and its service.
* Two honest limits are surfaced instead of hidden:
*   - there is no applications collection yet, so the action is «تواصل مع الناشر»
*     (a real connection), not a fake "Apply" button;
*   - the rules accept only `public` visibility, so no private option is offered.
*/
var NetworkJobsSection = ({ language, onOpenAccount, onOpenProfile, slowAfterMs = 8e3 }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [opportunities, setOpportunities] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [slow, setSlow] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [card, setCard] = (0, import_react.useState)(null);
	const [connections, setConnections] = (0, import_react.useState)([]);
	const [connecting, setConnecting] = (0, import_react.useState)(null);
	const [actionError, setActionError] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(EMPTY_JOB_DRAFT);
	const [touched, setTouched] = (0, import_react.useState)(false);
	const [publishing, setPublishing] = (0, import_react.useState)(false);
	const [published, setPublished] = (0, import_react.useState)(false);
	const [closing, setClosing] = (0, import_react.useState)(null);
	const [filter, setFilter] = (0, import_react.useState)({
		text: "",
		type: "all",
		method: ""
	});
	const serviceReady = account?.available ?? false;
	const uid = account?.user?.uid ?? null;
	const verified = account?.verified ?? false;
	const canPublish = Boolean(uid) && verified && Boolean(card);
	const connectedUids = (0, import_react.useMemo)(() => {
		const set = /* @__PURE__ */ new Set();
		for (const connection of connections) if (connection.status === "connected") set.add(connection.toUid);
		return set;
	}, [connections]);
	(0, import_react.useEffect)(() => {
		if (!serviceReady) {
			setLoading(false);
			return;
		}
		let active = true;
		let stop;
		setLoading(true);
		setSlow(false);
		const timer = setTimeout(() => {
			if (active) setSlow(true);
		}, slowAfterMs);
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stop = api.subscribeCommunityOpportunities((next) => {
				if (!active) return;
				setOpportunities(next);
				setLoading(false);
				setSlow(false);
			}, (nextError) => {
				if (!active) return;
				setError(nextError.message);
				setLoading(false);
				setSlow(false);
			});
		}), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));
		return () => {
			active = false;
			clearTimeout(timer);
			stop?.();
		};
	}, [serviceReady, slowAfterMs]);
	(0, import_react.useEffect)(() => {
		setCard(null);
		setConnections([]);
		if (!uid || !serviceReady) return;
		let active = true;
		let stopCard;
		let stopConnections;
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stopCard = api.subscribeMyCommunityWorkspace(uid, (next) => {
				if (active) setCard(next);
			}, () => {});
			stopConnections = api.subscribeMyConnections(uid, (next) => {
				if (active) setConnections(next);
			}, () => {});
		}), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));
		return () => {
			active = false;
			stopCard?.();
			stopConnections?.();
		};
	}, [uid, serviceReady]);
	const errors = (0, import_react.useMemo)(() => validateJobDraft(draft), [draft]);
	const previewMethods = (0, import_react.useMemo)(() => normaliseMethods(draft.methods), [draft.methods]);
	const update = (0, import_react.useCallback)((key, value) => {
		setTouched(true);
		setPublished(false);
		setActionError(null);
		setDraft((current) => ({
			...current,
			[key]: value
		}));
	}, []);
	const publish = (0, import_react.useCallback)(async (event) => {
		event.preventDefault();
		setTouched(true);
		const user = account?.user;
		if (!user || !card || errors.length > 0) return;
		setPublishing(true);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]))).createCommunityOpportunity(user, toOpportunityInput(draft, {
				displayName: card.displayName,
				organizationName: card.organizationName,
				companyCode: card.companyCode
			}));
			setDraft(EMPTY_JOB_DRAFT);
			setTouched(false);
			setPublished(true);
		} catch (failure) {
			setActionError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setPublishing(false);
		}
	}, [
		account?.user,
		card,
		draft,
		errors.length
	]);
	const toggleStatus = (0, import_react.useCallback)(async (opportunity) => {
		setClosing(opportunity.id);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]))).updateCommunityOpportunityStatus(opportunity.id, opportunity.status === "open" ? "closed" : "open");
		} catch (failure) {
			setActionError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setClosing(null);
		}
	}, []);
	const contactPublisher = (0, import_react.useCallback)(async (opportunity) => {
		const user = account?.user;
		if (!user || !card || connecting) return;
		setConnecting(opportunity.id);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]))).connectWithCommunityMember(user, card.displayName, {
				uid: opportunity.authorUid,
				displayName: opportunity.authorName
			});
		} catch (failure) {
			setActionError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setConnecting(null);
		}
	}, [
		account?.user,
		card,
		connecting
	]);
	const visible = (0, import_react.useMemo)(() => opportunities.filter((opportunity) => matchesJobFilter(opportunity, filter)), [opportunities, filter]);
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-jobs-unavailable",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0 text-violet-300",
				"aria-hidden": "true"
			}), isAr ? "لوحة الفرص غير متاحة في هذه النسخة" : "The jobs board is not available in this build"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُهيَّأ اتصال Firebase، فلا توجد فرص حقيقية — ولن نعرض وظائف تجريبية بدلاً منها." : "Firebase is not initialised, so there are no real opportunities — and we will not show trial jobs instead."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-jobs-live",
		className: "grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-3",
			children: [
				canPublish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: publish,
					className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1.5 text-xs font-bold text-white",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, {
									className: "h-4 w-4 shrink-0 text-violet-300",
									"aria-hidden": "true"
								}),
								isAr ? "نشر فرصة" : "Publish an opportunity",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ms-auto text-[10px] font-normal text-slate-500",
									children: isAr ? `باسم ${card?.displayName} · ${card?.organizationName}` : `as ${card?.displayName} · ${card?.organizationName}`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 grid min-w-0 gap-2 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "النوع" : "Type"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: draft.type,
										onChange: (event) => update("type", event.target.value),
										className: fieldClass,
										"aria-label": isAr ? "نوع الفرصة" : "Opportunity type",
										children: NETWORK_OPPORTUNITY_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: type.id,
											children: isAr ? type.ar : type.en
										}, type.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "المكان" : "Location"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft.location,
										onChange: (event) => update("location", event.target.value),
										maxLength: NETWORK_JOB_LIMITS.locationMax,
										className: fieldClass,
										"aria-label": isAr ? "مكان الفرصة" : "Opportunity location",
										placeholder: isAr ? "مثال: الجيزة / موقع البرلس" : "e.g. Giza / El-Burullus site"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "العنوان" : "Title"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft.title,
										onChange: (event) => update("title", event.target.value),
										maxLength: NETWORK_JOB_LIMITS.titleMax,
										className: fieldClass,
										"aria-label": isAr ? "عنوان الفرصة" : "Opportunity title",
										placeholder: isAr ? "مفتش PAUT — المستوى II" : "PAUT inspector — Level II"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "طرق الفحص (حتى 8)" : "Methods (up to 8)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft.methods,
										onChange: (event) => update("methods", event.target.value),
										className: fieldClass,
										"aria-label": isAr ? "طرق الفحص المطلوبة" : "Required methods",
										placeholder: "PAUT, TOFD, RT"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: [isAr ? "المتطلبات" : "Requirements", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ms-1 font-normal text-slate-500",
											children: isAr ? "(الشهادات · الخبرة · المدة)" : "(certificates · experience · duration)"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: draft.requirements,
										onChange: (event) => update("requirements", event.target.value),
										maxLength: NETWORK_JOB_LIMITS.requirementsMax,
										rows: 3,
										className: `${fieldClass} resize-none`,
										"aria-label": isAr ? "متطلبات الفرصة" : "Opportunity requirements"
									})]
								})
							]
						}),
						previewMethods.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 flex flex-wrap gap-1",
							children: previewMethods.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400",
								children: method
							}, method))
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: publishing || errors.length > 0,
									className: "inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
									children: [publishing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										className: "h-3.5 w-3.5 shrink-0 animate-spin",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
										className: "h-3.5 w-3.5 shrink-0",
										"aria-hidden": "true"
									}), isAr ? "نشر الفرصة" : "Publish"]
								}),
								touched && errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "alert",
									className: "text-[10px] text-rose-300",
									children: isAr ? errors[0].ar : errors[0].en
								}) : null,
								published ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "status",
									className: "text-[10px] font-bold text-emerald-300",
									children: isAr ? "نُشرت الفرصة." : "Published."
								}) : null
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-jobs-gate",
					className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 text-xs font-bold text-white",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, {
								className: "h-4 w-4 shrink-0 text-violet-300",
								"aria-hidden": "true"
							}), isAr ? "نشر فرصة" : "Publish an opportunity"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11px] leading-relaxed text-slate-400",
							children: !account?.ready ? isAr ? "جارٍ التحقق من جلسة حسابك…" : "Checking your account session…" : !uid ? isAr ? "سجّل الدخول لنشر فرصة. التصفح متاح للجميع." : "Sign in to publish. Browsing is open to everyone." : !verified ? isAr ? "أكّد بريدك أولاً — القواعد ترفض النشر قبله." : "Confirm your email first — the rules refuse to publish before it." : isAr ? "أنشئ بطاقتك المهنية أولاً: الفرصة تُنشر باسمك وجهة عملك." : "Create your card first: an opportunity carries your name and organisation."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								account?.ready && !uid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onOpenAccount("signin"),
									className: "rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
									children: isAr ? "تسجيل الدخول" : "Sign in"
								}) : null,
								account?.ready && uid && !verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onOpenAccount("account"),
									className: "rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300",
									children: isAr ? "فتح حسابي" : "Open my account"
								}) : null,
								account?.ready && uid && verified && !card ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: onOpenProfile,
									className: "rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
									children: isAr ? "إنشاء البطاقة" : "Create the card"
								}) : null
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-2.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-1.5 sm:flex-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									className: "h-3.5 w-3.5 shrink-0 text-violet-300",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: filter.text,
									onChange: (event) => setFilter((current) => ({
										...current,
										text: event.target.value
									})),
									"aria-label": isAr ? "ابحث في الفرص" : "Search opportunities",
									placeholder: isAr ? "ابحث بالعنوان أو المكان أو المتطلبات…" : "Search title, location or requirements…",
									className: "min-w-0 flex-1 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: filter.type,
								onChange: (event) => setFilter((current) => ({
									...current,
									type: event.target.value
								})),
								"aria-label": isAr ? "تصفية بالنوع" : "Filter by type",
								className: "min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: isAr ? "كل الأنواع" : "All types"
								}), NETWORK_OPPORTUNITY_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: type.id,
									children: isAr ? type.ar : type.en
								}, type.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: filter.method,
								onChange: (event) => setFilter((current) => ({
									...current,
									method: event.target.value
								})),
								"aria-label": isAr ? "تصفية بطريقة الفحص" : "Filter by method",
								placeholder: isAr ? "طريقة: PAUT" : "Method: PAUT",
								className: "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 sm:w-36"
							})
						]
					})
				}),
				actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: isAr ? `تعذّر تنفيذ الإجراء: ${actionError}` : `Action failed: ${actionError}`
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: isAr ? `تعذّر تحميل الفرص: ${error}` : `Could not load opportunities: ${error}`
				}) : null,
				loading && slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-jobs-slow",
					className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs font-bold text-amber-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
							className: "h-4 w-4 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "الاتصال بالتخزين بطيء أو محجوب" : "The store is slow or blocked"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] leading-relaxed text-amber-100/90",
						children: isAr ? "لم تصل أي فرصة بعد — هذا ليس لوحاً فارغاً، بل اتصال لم يكتمل." : "No opportunity has arrived yet — this is not an empty board, but an unfinished connection."
					})]
				}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					role: "status",
					className: "flex items-center gap-2 p-3 text-[11px] text-slate-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "h-4 w-4 shrink-0 animate-spin",
						"aria-hidden": "true"
					}), isAr ? "جارٍ تحميل الفرص…" : "Loading opportunities…"]
				}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-jobs-empty",
					className: "rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, {
							className: "mx-auto h-6 w-6 text-slate-600",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs font-bold text-slate-300",
							children: opportunities.length === 0 ? isAr ? "لا توجد فرص منشورة بعد" : "No published opportunities yet" : isAr ? "لا نتائج مطابقة للفلاتر" : "No opportunities match the filters"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500",
							children: opportunities.length === 0 ? isAr ? "أول فرصة حقيقية تظهر هنا بمجرد نشرها من عضو مؤكَّد البريد. لا وظائف وهمية." : "The first real opportunity appears here once a confirmed member publishes it. No invented jobs." : isAr ? "جرّب نوعاً آخر أو طريقة أخرى، أو امسح كلمة البحث." : "Try another type or method, or clear the search."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					"data-testid": "network-jobs-list",
					className: "space-y-2.5",
					children: visible.map((opportunity) => {
						const type = opportunityTypeById(opportunity.opportunityType);
						const mine = opportunity.authorUid === uid;
						const already = connectedUids.has(opportunity.authorUid);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							"data-testid": "network-job-card",
							className: `min-w-0 rounded-xl border bg-[#0f0f22] p-3 ${opportunity.status === "closed" ? "border-[#232345] opacity-75" : "border-[#232345]"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex min-w-0 flex-wrap items-start justify-between gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-1.5",
												children: [
													type ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `rounded border px-1.5 py-0.5 text-[9px] font-bold ${type.accent}`,
														children: isAr ? type.ar : type.en
													}) : null,
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `rounded px-1.5 py-0.5 text-[9px] font-bold ${opportunity.status === "open" ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border border-slate-600 bg-slate-700/30 text-slate-300"}`,
														children: opportunity.status === "open" ? isAr ? "مفتوحة" : "Open" : isAr ? "مغلقة" : "Closed"
													}),
													mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200",
														children: isAr ? "فرصتك" : "Yours"
													}) : null
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "mt-1 text-sm font-bold leading-snug text-white",
												children: opportunity.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
														className: "h-2.5 w-2.5 shrink-0",
														"aria-hidden": "true"
													}), opportunity.location]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 truncate",
													children: [
														opportunity.authorOrg,
														" · ",
														relativeDate(opportunity.createdAt, isAr)
													]
												})]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1.5 flex flex-wrap gap-1",
									children: (opportunity.methods ?? []).map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
										children: method
									}, method))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400",
									children: opportunity.requirements
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#1d1d38] pt-2",
									children: mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => void toggleStatus(opportunity),
										disabled: closing === opportunity.id,
										className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
										children: [closing === opportunity.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											className: "h-3 w-3 shrink-0 animate-spin",
											"aria-hidden": "true"
										}) : null, opportunity.status === "open" ? isAr ? "إغلاق الفرصة" : "Close it" : isAr ? "إعادة فتحها" : "Reopen it"]
									}) : already ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										"data-testid": "network-job-connected",
										className: "inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), isAr ? "الناشر في شبكتك" : "Publisher is in your network"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => void contactPublisher(opportunity),
										disabled: !uid || !verified || !card || connecting === opportunity.id,
										"aria-disabled": !uid || !verified || !card || connecting === opportunity.id,
										title: !uid ? isAr ? "سجّل الدخول للتواصل مع الناشر" : "Sign in to contact the publisher" : !verified ? isAr ? "أكّد بريدك أولاً" : "Confirm your email first" : !card ? isAr ? "أنشئ بطاقتك المهنية أولاً" : "Create your card first" : isAr ? "إضافة الناشر إلى شبكتك كي يصلا لملفك" : "Add the publisher to your network so they reach your profile",
										"data-testid": "network-job-contact",
										className: `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${uid && verified && card ? "border-violet-400/50 bg-violet-500/10 text-violet-200 cursor-pointer hover:border-violet-300" : "border-[#2a2a4d] bg-[#14142a] text-slate-500 opacity-70 cursor-not-allowed"}`,
										children: [connecting === opportunity.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											className: "h-3 w-3 shrink-0 animate-spin",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), isAr ? "تواصل مع الناشر" : "Contact the publisher"]
									})
								})
							]
						}) }, opportunity.id);
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "min-w-0 space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-[10px] leading-relaxed text-sky-100",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-[11px] font-bold text-sky-200",
						children: isAr ? "حدود معلنة، لا مخفية" : "Stated limits, not hidden ones"
					}), isAr ? "لا يوجد تقديم رسمي بعد (لا سيرة تُرفع ولا حالة طلب)؛ لذلك الزر هو «تواصل مع الناشر» — اتصال مهني حقيقي. نظام التقديم يأتي في مرحلته مع مجموعة طلبات وقواعدها." : "There is no formal application yet (no CV upload, no application state), so the action is “Contact the publisher” — a real professional connection. Applications arrive in their own phase with a dedicated collection and rules."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400",
					children: isAr ? "كل الفرص عامة: القواعد لا تقبل نطاقاً آخر اليوم، فلا نعرض خياراً لا نستطيع الوفاء به." : "Every opportunity is public: the rules accept no other visibility today, so no option we cannot honour is offered."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400",
					children: isAr ? "طلب عرض سعر (RFQ) يبقى في بوابة العملاء — لا يُرسل ولا يُستقبل هنا." : "Quote requests (RFQ) stay in the client portal — they are neither sent nor received here."
				})
			]
		})]
	});
};
//#endregion
export { NetworkJobsSection, NetworkJobsSection as default };
