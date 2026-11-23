const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firestoreClientService-BUGkAdZ4.js","assets/rolldown-runtime-oLLnCvco.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css","assets/index.esm-T7XjjJ2p.js","assets/config-BaEX8mXf.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Bt as MessageSquare, Dt as Send, It as PenLine, P as useOptionalSiteAccount, gt as UserRound, on as Copy } from "./index-BKrODMj6.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Heart = createLucideIcon("heart", [["path", {
	d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
	key: "mvr1a0"
}]]);
//#endregion
//#region src/network/networkFeedForm.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/** Mirrors `isValidCommunityPost` / `isValidCommunityComment` in firestore.rules. */
var NETWORK_POST_LIMITS = {
	titleMin: 3,
	titleMax: 180,
	bodyMin: 5,
	bodyMax: 3e3,
	commentMin: 1,
	commentMax: 1500,
	tagMax: 32,
	tagsMax: 6,
	authorNameMax: 120,
	authorOrgMax: 160,
	authorHeadlineMax: 160
};
/** The eight kinds a member chooses from, each mapped to a stored post type. */
var NETWORK_POST_KINDS = [
	{
		id: "technical",
		ar: "نقاش فني",
		en: "Technical discussion",
		stored: "discussion",
		accent: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10"
	},
	{
		id: "knowledge",
		ar: "معرفة هندسية",
		en: "Engineering knowledge",
		stored: "technical_case",
		accent: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
	},
	{
		id: "case_study",
		ar: "دراسة حالة",
		en: "Case study",
		stored: "technical_case",
		accent: "text-amber-300 border-amber-500/40 bg-amber-500/10"
	},
	{
		id: "news",
		ar: "أخبار القطاع",
		en: "Industry news",
		stored: "announcement",
		accent: "text-slate-300 border-slate-600 bg-slate-700/30"
	},
	{
		id: "career",
		ar: "مسيرة مهنية",
		en: "Career update",
		stored: "discussion",
		accent: "text-violet-300 border-violet-500/40 bg-violet-500/10"
	},
	{
		id: "jobs",
		ar: "وظائف وفرص",
		en: "Jobs & opportunities",
		stored: "job_tender",
		accent: "text-rose-300 border-rose-500/40 bg-rose-500/10"
	},
	{
		id: "training",
		ar: "تدريب وورش",
		en: "Training & workshops",
		stored: "announcement",
		accent: "text-sky-300 border-sky-500/40 bg-sky-500/10"
	},
	{
		id: "research",
		ar: "أبحاث ومنشورات",
		en: "Research & publications",
		stored: "technical_case",
		accent: "text-teal-300 border-teal-500/40 bg-teal-500/10"
	}
];
function postKindById(id) {
	return NETWORK_POST_KINDS.find((kind) => kind.id === id);
}
/**
* Stored type → the label a reader sees.
*
* Several network kinds collapse into one stored type, so this picks the most
* specific label that still tells the truth about what was stored.
*/
function displayKindForStored(stored) {
	return postKindById(stored === "discussion" ? "technical" : stored === "technical_case" ? "case_study" : stored === "announcement" ? "news" : stored === "job_tender" ? "jobs" : "knowledge") ?? NETWORK_POST_KINDS[0];
}
/** The nine methods the database accepts, with the labels engineers use. */
var NETWORK_METHODS = [
	{
		id: "GENERAL",
		ar: "عام",
		en: "General"
	},
	{
		id: "UT",
		ar: "موجات فوق صوتية UT",
		en: "Ultrasonic UT"
	},
	{
		id: "PAUT",
		ar: "مصفوفات PAUT",
		en: "Phased array PAUT"
	},
	{
		id: "RT",
		ar: "تصوير إشعاعي RT",
		en: "Radiography RT"
	},
	{
		id: "MT",
		ar: "جسيمات مغناطيسية MT",
		en: "Magnetic particle MT"
	},
	{
		id: "PT",
		ar: "سوائل نافذة PT",
		en: "Penetrant PT"
	},
	{
		id: "VT",
		ar: "فحص بصري VT",
		en: "Visual VT"
	},
	{
		id: "PWHT",
		ar: "معالجة حرارية PWHT",
		en: "Heat treatment PWHT"
	},
	{
		id: "AR",
		ar: "مركبات وأتمتة AR",
		en: "AR & automation"
	}
];
var EMPTY_POST_DRAFT = {
	kind: "technical",
	method: "GENERAL",
	title: "",
	body: "",
	tags: "",
	visibility: "public"
};
var trimmed = (value) => value.trim();
/**
* Split whatever the member typed into the tag list the rules accept.
*
* The rules only bound the first tag's length, so this bounds all of them; a
* long tag is dropped rather than silently truncated, because a truncated word
* is worse than a missing one.
*/
function normaliseTags(raw) {
	const seen = /* @__PURE__ */ new Set();
	const tags = [];
	for (const part of raw.split(/[,،#\n]+/)) {
		const tag = part.trim().replace(/\s+/g, " ");
		if (!tag) continue;
		if (tag.length > NETWORK_POST_LIMITS.tagMax) continue;
		const key = tag.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		tags.push(tag);
		if (tags.length === NETWORK_POST_LIMITS.tagsMax) break;
	}
	return tags;
}
function validatePostDraft(draft) {
	const errors = [];
	const push = (field, ar, en) => errors.push({
		field,
		ar,
		en
	});
	if (!postKindById(draft.kind)) push("kind", "اختر نوع المنشور.", "Choose a post type.");
	if (!NETWORK_METHODS.some((method) => method.id === draft.method)) push("method", "اختر طريقة فحص صحيحة.", "Choose a valid NDT method.");
	const title = trimmed(draft.title);
	if (title.length < NETWORK_POST_LIMITS.titleMin) push("title", "العنوان قصير جداً (3 أحرف على الأقل).", "The title is too short (at least three characters).");
	else if (title.length > NETWORK_POST_LIMITS.titleMax) push("title", `العنوان أطول من ${NETWORK_POST_LIMITS.titleMax} حرفاً.`, `The title is longer than ${NETWORK_POST_LIMITS.titleMax} characters.`);
	const body = trimmed(draft.body);
	if (body.length < NETWORK_POST_LIMITS.bodyMin) push("body", "النص قصير جداً (5 أحرف على الأقل).", "The body is too short (at least five characters).");
	else if (body.length > NETWORK_POST_LIMITS.bodyMax) push("body", `النص أطول من ${NETWORK_POST_LIMITS.bodyMax} حرفاً.`, `The body is longer than ${NETWORK_POST_LIMITS.bodyMax} characters.`);
	if (draft.visibility !== "public" && draft.visibility !== "members_only") push("visibility", "اختر نطاق الظهور.", "Choose who can see this.");
	return errors;
}
function validateCommentDraft(body) {
	const value = trimmed(body);
	if (value.length < NETWORK_POST_LIMITS.commentMin) return [{
		field: "body",
		ar: "اكتب تعليقاً أولاً.",
		en: "Write a comment first."
	}];
	if (value.length > NETWORK_POST_LIMITS.commentMax) return [{
		field: "body",
		ar: `التعليق أطول من ${NETWORK_POST_LIMITS.commentMax} حرفاً.`,
		en: `The comment is longer than ${NETWORK_POST_LIMITS.commentMax} characters.`
	}];
	return [];
}
/**
* Draft → the exact input `createCommunityPost` accepts.
*
* `authorOrg` is required by the rules even for an independent engineer, so the
* caller must have a card; the component refuses to open the composer without
* one instead of inventing an organisation name.
*/
function toPostInput(draft, author) {
	const kind = postKindById(draft.kind);
	const tags = normaliseTags(draft.tags);
	const headline = trimmed(author.headline ?? "");
	return {
		authorName: trimmed(author.displayName),
		...headline ? { authorHeadline: headline.slice(0, NETWORK_POST_LIMITS.authorHeadlineMax) } : {},
		authorOrg: trimmed(author.organizationName),
		...author.companyCode ? { authorCompanyCode: author.companyCode } : {},
		postType: kind ? kind.stored : "discussion",
		ndtMethod: draft.method,
		title: trimmed(draft.title),
		body: trimmed(draft.body),
		...tags.length > 0 ? { tags } : {},
		visibility: draft.visibility,
		isPinnedAnnouncement: false
	};
}
/** A short, honest preview of what a visitor will read. */
function postExcerpt(body, max = 220) {
	const clean = body.replace(/\s+/g, " ").trim();
	return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}
//#endregion
//#region src/components/network/NetworkFeedSection.tsx
var import_jsx_runtime = require_jsx_runtime();
var fieldClass = "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none";
function relativeTime(value, isAr) {
	const millis = value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function" ? value.toMillis() : 0;
	if (!millis) return isAr ? "الآن" : "just now";
	const minutes = Math.floor((Date.now() - millis) / 6e4);
	if (minutes < 1) return isAr ? "الآن" : "just now";
	if (minutes < 60) return isAr ? `قبل ${minutes} دقيقة` : `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return isAr ? `قبل ${hours} ساعة` : `${hours} h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return isAr ? `قبل ${days} يوم` : `${days} d ago`;
	return new Date(millis).toLocaleDateString(isAr ? "ar-EG" : "en-GB");
}
/**
* `#network/feed` — real posts, real comments.
*
* Publishing and commenting use the shipped community service and rules. Two
* things are deliberately *not* here yet: reactions (they need the member's own
* reaction to be read first, or a tap would double-count) and any invented
* content. An empty feed says it is empty.
*/
var NetworkFeedSection = ({ language, onOpenAccount, onOpenProfile, slowAfterMs = 8e3 }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [card, setCard] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [slow, setSlow] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(EMPTY_POST_DRAFT);
	const [touched, setTouched] = (0, import_react.useState)(false);
	const [publishing, setPublishing] = (0, import_react.useState)(false);
	const [publishError, setPublishError] = (0, import_react.useState)(null);
	const [published, setPublished] = (0, import_react.useState)(false);
	const [openComments, setOpenComments] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(null);
	/** Which reaction this member gave, per post, as read from the database. */
	const [myReactions, setMyReactions] = (0, import_react.useState)({});
	const [reacting, setReacting] = (0, import_react.useState)(null);
	const [reactionError, setReactionError] = (0, import_react.useState)(null);
	const serviceReady = account?.available ?? false;
	const uid = account?.user?.uid ?? null;
	const verified = account?.verified ?? false;
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
			stop = api.subscribeCommunityPosts(false, (next) => {
				if (!active) return;
				setPosts(next);
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
		if (!uid || !serviceReady) return;
		let active = true;
		let stop;
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stop = api.subscribeMyCommunityWorkspace(uid, (next) => {
				if (active) setCard(next);
			}, () => {});
		}), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));
		return () => {
			active = false;
			stop?.();
		};
	}, [uid, serviceReady]);
	const errors = (0, import_react.useMemo)(() => validatePostDraft(draft), [draft]);
	const canPublish = Boolean(uid) && verified && Boolean(card);
	const update = (0, import_react.useCallback)((key, value) => {
		setTouched(true);
		setPublished(false);
		setPublishError(null);
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
		setPublishError(null);
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]))).createCommunityPost(user, toPostInput(draft, {
				displayName: card.displayName,
				organizationName: card.organizationName,
				headline: card.headline,
				companyCode: card.companyCode
			}));
			setDraft({
				...EMPTY_POST_DRAFT,
				method: draft.method,
				kind: draft.kind
			});
			setTouched(false);
			setPublished(true);
		} catch (publishFailure) {
			setPublishError(publishFailure instanceof Error ? publishFailure.message : String(publishFailure));
		} finally {
			setPublishing(false);
		}
	}, [
		account?.user,
		card,
		draft,
		errors.length
	]);
	/**
	* Toggle a like without ever guessing.
	*
	* The stored counter must equal the number of reaction documents, so the write
	* is always preceded by reading this member's own reaction for this post: an
	* existing `like` is removed, a different reaction is switched, and no reaction
	* becomes one. A blind `increment(1)` on every tap is what makes counters drift.
	*/
	const toggleLike = (0, import_react.useCallback)(async (postId) => {
		const user = account?.user;
		if (!user || reacting) return;
		setReacting(postId);
		setReactionError(null);
		try {
			const api = await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));
			const mine = await api.getCommunityPostReaction(postId, user.uid);
			await api.setCommunityPostReaction(user, postId, "like", mine);
			setMyReactions((current) => {
				const next = { ...current };
				if (mine) delete next[postId];
				else next[postId] = "like";
				return next;
			});
		} catch (failure) {
			setReactionError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setReacting(null);
		}
	}, [account?.user, reacting]);
	const copyLink = (0, import_react.useCallback)(async (postId) => {
		const url = `${window.location.origin}${window.location.pathname}#network/feed/${postId}`;
		try {
			await navigator.clipboard?.writeText(url);
			setCopied(postId);
			setTimeout(() => setCopied(null), 2e3);
		} catch {
			setCopied(null);
		}
	}, []);
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-feed-unavailable",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0 text-violet-300",
				"aria-hidden": "true"
			}), isAr ? "المنشورات غير متاحة في هذه النسخة" : "The feed is not available in this build"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُهيَّأ اتصال Firebase، لذلك لا توجد منشورات حقيقية — ولن نعرض منشورات تجريبية بدلاً منها." : "Firebase is not initialised, so there are no real posts — and we will not show trial posts instead."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-feed-live",
		className: "grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,240px)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-3",
			children: [
				canPublish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: publish,
					className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 text-xs font-bold text-white",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, {
									className: "h-4 w-4 shrink-0 text-violet-300",
									"aria-hidden": "true"
								}),
								isAr ? "منشور جديد" : "New post",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ms-auto text-[10px] font-normal text-slate-500",
									children: isAr ? `نشر باسم ${card?.displayName}` : `Posting as ${card?.displayName}`
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
										children: isAr ? "نوع المنشور" : "Post type"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: draft.kind,
										onChange: (event) => update("kind", event.target.value),
										className: fieldClass,
										"aria-label": isAr ? "نوع المنشور" : "Post type",
										children: NETWORK_POST_KINDS.map((kind) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: kind.id,
											children: isAr ? kind.ar : kind.en
										}, kind.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "طريقة الفحص" : "NDT method"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: draft.method,
										onChange: (event) => update("method", event.target.value),
										className: fieldClass,
										"aria-label": isAr ? "طريقة الفحص" : "NDT method",
										children: NETWORK_METHODS.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: method.id,
											children: isAr ? method.ar : method.en
										}, method.id))
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
										maxLength: NETWORK_POST_LIMITS.titleMax,
										className: fieldClass,
										"aria-label": isAr ? "عنوان المنشور" : "Post title",
										placeholder: isAr ? "مثال: قراءة إشارة على شطف 30° في P91" : "e.g. reading an indication on a 30° bevel in P91"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: [isAr ? "النص" : "Body", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ms-1 font-normal text-slate-500",
											children: isAr ? "(القطر، السماكة، الزاوية، الكود المرجعي…)" : "(diameter, thickness, angle, reference code…)"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: draft.body,
										onChange: (event) => update("body", event.target.value),
										maxLength: NETWORK_POST_LIMITS.bodyMax,
										rows: 4,
										className: `${fieldClass} resize-none`,
										"aria-label": isAr ? "نص المنشور" : "Post body"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "وسوم (حتى 6)" : "Tags (up to 6)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft.tags,
										onChange: (event) => update("tags", event.target.value),
										className: fieldClass,
										"aria-label": isAr ? "وسوم المنشور" : "Post tags",
										placeholder: "ASME-V · TOFD · P91"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "من يرى المنشور" : "Who can see it"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: draft.visibility,
										onChange: (event) => update("visibility", event.target.value),
										className: fieldClass,
										"aria-label": isAr ? "نطاق ظهور المنشور" : "Post visibility",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "public",
											children: isAr ? "عام" : "Public"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "members_only",
											children: isAr ? "الأعضاء فقط" : "Members only"
										})]
									})]
								})
							]
						}),
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
									}), isAr ? "نشر" : "Publish"]
								}),
								touched && errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "alert",
									className: "text-[10px] text-rose-300",
									children: isAr ? errors[0].ar : errors[0].en
								}) : null,
								published ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "status",
									className: "text-[10px] font-bold text-emerald-300",
									children: isAr ? "نُشر المنشور." : "Published."
								}) : null,
								publishError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "alert",
									className: "text-[10px] text-rose-300",
									children: isAr ? `لم يُنشر: ${publishError}` : `Not published: ${publishError}`
								}) : null
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComposerGate, {
					language,
					signedIn: Boolean(uid),
					verified,
					hasCard: Boolean(card),
					ready: account?.ready ?? false,
					onOpenAccount,
					onOpenProfile
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: isAr ? `تعذّر تحميل المنشورات: ${error}` : `Could not load posts: ${error}`
				}) : null,
				reactionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: isAr ? `تعذّر تسجيل الإعجاب: ${reactionError}` : `Could not record the like: ${reactionError}`
				}) : null,
				loading && slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-feed-slow",
					className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs font-bold text-amber-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
							className: "h-4 w-4 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "الاتصال بالتخزين بطيء أو محجوب" : "The store is slow or blocked"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] leading-relaxed text-amber-100/90",
						children: isAr ? "لم يصل أي منشور بعد — هذا ليس منشوراً محذوفاً ولا منشوراً تجريبياً، بل اتصال لم يكتمل." : "No post has arrived yet — this is neither a deleted nor a trial post, but an unfinished connection."
					})]
				}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					role: "status",
					className: "flex items-center gap-2 p-3 text-[11px] text-slate-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "h-4 w-4 shrink-0 animate-spin",
						"aria-hidden": "true"
					}), isAr ? "جارٍ تحميل المنشورات…" : "Loading posts…"]
				}) : posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-feed-empty",
					className: "rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
							className: "mx-auto h-6 w-6 text-slate-600",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs font-bold text-slate-300",
							children: isAr ? "لا توجد منشورات بعد" : "No posts yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500",
							children: isAr ? "أول منشور حقيقي يظهر هنا بمجرد نشره من عضو مؤكَّد البريد. لا نملأ الفراغ بمنشورات تجريبية." : "The first real post appears here as soon as a verified member publishes it. We do not fill the gap with trial posts."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					"data-testid": "network-feed-list",
					className: "space-y-2.5",
					children: posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostCard, {
						language,
						post,
						mine: post.authorUid === uid,
						canComment: canPublish,
						commentsOpen: openComments === post.id,
						onToggleComments: () => setOpenComments((current) => current === post.id ? null : post.id),
						onCopyLink: () => copyLink(post.id),
						copied: copied === post.id,
						canReact: Boolean(uid) && verified,
						reacted: Boolean(myReactions[post.id]),
						reacting: reacting === post.id,
						onToggleLike: () => void toggleLike(post.id),
						onOpenAccount,
						onOpenProfile,
						author: card,
						user: account?.user ?? null
					}) }, post.id))
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "min-w-0 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "flex items-center gap-1.5 text-[11px] font-bold text-slate-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), isAr ? "قواعد النشر" : "Posting rules"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-1.5 space-y-1 text-[10px] leading-relaxed text-slate-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: isAr ? "· سؤال فني واضح مع الكود المرجعي." : "· A clear technical question with the reference code." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: isAr ? "· لا إعلانات تجارية ولا أسعار." : "· No advertising and no pricing." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: isAr ? "· لا صور مصدر مشع ولا بيانات عملاء." : "· No radiation-source photos and no client data." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: isAr ? "· الشهادات تُذكر كإقرار، لا كشارة تحقق." : "· Certificates are stated as a claim, not as a verified badge." })
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[10px] leading-relaxed text-emerald-100",
				children: isAr ? "الإعجاب يُقرأ قبل أن يُكتب: نتحقق من تفاعلك على المنشور أولاً، فلا تُحسب ضغطة مرتين ولا يبتعد العدّاد عن عدد التفاعلات الحقيقي." : "A like is read before it is written: your own reaction is checked first, so a tap is never counted twice and the counter never drifts from the real reactions."
			})]
		})]
	});
};
var ComposerGate = ({ language, signedIn, verified, hasCard, ready, onOpenAccount, onOpenProfile }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-composer-gate",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 text-xs font-bold text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, {
					className: "h-4 w-4 shrink-0 text-violet-300",
					"aria-hidden": "true"
				}), isAr ? "منشور جديد" : "New post"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[11px] leading-relaxed text-slate-400",
				children: !ready ? isAr ? "جارٍ التحقق من جلسة حسابك…" : "Checking your account session…" : !signedIn ? isAr ? "سجّل الدخول لتكتب منشوراً. القراءة متاحة للجميع." : "Sign in to write a post. Reading is open to everyone." : !verified ? isAr ? "أكّد بريدك أولاً — قواعد الحماية لا تسمح بالنشر قبله." : "Confirm your email first — the rules refuse to publish before it." : isAr ? "أنشئ بطاقتك المهنية أولاً: المنشور يُنشر باسمك وجهة عملك، ولا نختلق اسماً بديلاً." : "Create your professional card first: a post carries your name and organisation, and we will not invent a stand-in."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: [
					ready && !signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenAccount("signin"),
						className: "rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
						children: isAr ? "تسجيل الدخول" : "Sign in"
					}) : null,
					ready && signedIn && !verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenAccount("account"),
						className: "rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300",
						children: isAr ? "فتح حسابي" : "Open my account"
					}) : null,
					ready && signedIn && verified && !hasCard ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onOpenProfile,
						className: "rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
						children: isAr ? "إنشاء البطاقة" : "Create the card"
					}) : null
				]
			})
		]
	});
};
var PostCard = ({ language, post, mine, canComment, commentsOpen, copied, canReact, reacted, reacting, onToggleLike, author, user, onToggleComments, onCopyLink, onOpenAccount, onOpenProfile }) => {
	const isAr = language === "ar";
	const kind = displayKindForStored(post.postType);
	const method = NETWORK_METHODS.find((item) => item.id === post.ndtMethod);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		"data-testid": "network-post-card",
		className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-start gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-[11px] font-bold text-violet-200",
					children: (post.authorName ?? "?").trim().charAt(0)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate text-xs font-bold text-white",
								children: post.authorName
							}),
							mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200",
								children: isAr ? "منشورك" : "Yours"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 text-[10px] text-slate-500",
								children: relativeTime(post.createdAt, isAr)
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "min-w-0 truncate text-[10px] text-slate-400",
						children: [post.authorHeadline, post.authorOrg].filter(Boolean).join(" · ")
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 flex flex-wrap items-center gap-1",
				children: [
					kind ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded border px-1.5 py-0.5 text-[9px] font-bold ${kind.accent}`,
						children: isAr ? kind.ar : kind.en
					}) : null,
					method ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
						children: isAr ? method.ar : method.en
					}) : null,
					post.visibility === "members_only" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-200",
						children: isAr ? "الأعضاء فقط" : "Members only"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-1.5 text-sm font-bold leading-snug text-white",
				children: post.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-400",
				children: postExcerpt(post.body, 480)
			}),
			post.tags && post.tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 flex flex-wrap gap-1",
				children: post.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400",
					children: ["#", tag]
				}, tag))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#1d1d38] pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onToggleLike,
						disabled: !canReact || reacting,
						"aria-pressed": reacted,
						"aria-disabled": !canReact || reacting,
						title: canReact ? isAr ? reacted ? "إلغاء الإعجاب" : "إعجاب — يُقرأ تفاعلك أولاً فلا يُحسب مرتين" : "الإعجاب يحتاج بريداً مؤكَّداً" : isAr ? "الإعجاب يحتاج حساباً مؤكَّد البريد" : "Liking needs a confirmed account",
						"data-testid": "network-like",
						className: `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${reacted ? "border-violet-400/60 bg-violet-500/20 text-violet-100" : "border-[#2a2a4d] bg-[#14142a] text-slate-300"} ${canReact && !reacting ? "cursor-pointer hover:border-violet-400/50 hover:text-white" : "cursor-not-allowed opacity-60"}`,
						children: [reacting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "h-3 w-3 shrink-0 animate-spin",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
							className: `h-3 w-3 shrink-0 ${reacted ? "fill-current" : ""}`,
							"aria-hidden": "true"
						}), isAr ? `إعجاب ${post.likesCount}` : `Like ${post.likesCount}`]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onToggleComments,
						"aria-expanded": commentsOpen,
						className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
							className: "h-3 w-3 shrink-0",
							"aria-hidden": "true"
						}), isAr ? `التعليقات ${post.commentsCount}` : `Comments ${post.commentsCount}`]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onCopyLink,
						className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
							className: "h-3 w-3 shrink-0",
							"aria-hidden": "true"
						}), copied ? isAr ? "نُسخ الرابط" : "Link copied" : isAr ? "رابط المنشور" : "Post link"]
					})
				]
			}),
			commentsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comments, {
				language,
				postId: post.id,
				canComment,
				author,
				user,
				onOpenAccount,
				onOpenProfile
			}) : null
		]
	});
};
var Comments = ({ language, postId, canComment, author, user, onOpenAccount, onOpenProfile }) => {
	const isAr = language === "ar";
	const [comments, setComments] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [body, setBody] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [sendError, setSendError] = (0, import_react.useState)(null);
	const errors = validateCommentDraft(body);
	(0, import_react.useEffect)(() => {
		let active = true;
		let stop;
		setLoading(true);
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stop = api.subscribePostComments(postId, (next) => {
				if (!active) return;
				setComments(next);
				setLoading(false);
			}, (nextError) => {
				if (!active) return;
				setError(nextError.message);
				setLoading(false);
			});
		}), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));
		return () => {
			active = false;
			stop?.();
		};
	}, [postId]);
	const submit = async (event) => {
		event.preventDefault();
		if (!user || !author || errors.length > 0) return;
		setSending(true);
		setSendError(null);
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]))).addCommunityPostComment(user, postId, {
				authorName: author.displayName,
				...author.headline ? { authorHeadline: author.headline } : {},
				body
			});
			setBody("");
		} catch (failure) {
			setSendError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-comments",
		className: "mt-2 border-t border-[#1d1d38] pt-2",
		children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			role: "status",
			className: "flex items-center gap-1.5 text-[10px] text-slate-500",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "h-3 w-3 shrink-0 animate-spin",
				"aria-hidden": "true"
			}), isAr ? "جارٍ تحميل التعليقات…" : "Loading comments…"]
		}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			role: "alert",
			className: "text-[10px] text-rose-300",
			children: isAr ? `تعذّر تحميل التعليقات: ${error}` : `Could not load comments: ${error}`
		}) : comments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] text-slate-500",
			children: isAr ? "لا تعليقات بعد." : "No comments yet."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1.5",
			children: comments.map((comment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] px-2 py-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 truncate text-[10px] font-bold text-slate-300",
						children: comment.authorName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-[9px] text-slate-500",
						children: relativeTime(comment.createdAt, isAr)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400",
					children: comment.body
				})]
			}, comment.id))
		}), canComment ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: body,
					onChange: (event) => setBody(event.target.value),
					maxLength: NETWORK_POST_LIMITS.commentMax,
					"aria-label": isAr ? "اكتب تعليقاً" : "Write a comment",
					placeholder: isAr ? "اكتب تعليقاً فنياً…" : "Write a technical comment…",
					className: "min-w-0 flex-1 rounded-md border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "submit",
					disabled: sending || errors.length > 0,
					className: "inline-flex items-center gap-1 rounded-md bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
					children: [sending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "h-3 w-3 shrink-0 animate-spin",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
						className: "h-3 w-3 shrink-0",
						"aria-hidden": "true"
					}), isAr ? "إرسال" : "Send"]
				}),
				sendError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					role: "alert",
					className: "w-full text-[10px] text-rose-300",
					children: isAr ? `لم يُرسل: ${sendError}` : `Not sent: ${sendError}`
				}) : null
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1.5 flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] text-slate-500",
				children: isAr ? "للتعليق تحتاج بطاقة مهنية مؤكَّدة." : "Commenting needs a confirmed professional card."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => user ? onOpenProfile() : onOpenAccount("signin"),
				className: "rounded-md border border-violet-400/50 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300",
				children: user ? isAr ? "بطاقتي" : "My card" : isAr ? "تسجيل الدخول" : "Sign in"
			})]
		})]
	});
};
//#endregion
export { NetworkFeedSection, NetworkFeedSection as default };
