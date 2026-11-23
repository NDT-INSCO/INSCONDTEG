const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/rulesProbe-Gb9OW4tV.js","assets/index.esm-T7XjjJ2p.js","assets/rolldown-runtime-oLLnCvco.js","assets/config-BaEX8mXf.js","assets/communityGroupsService-BCy726Ax.js","assets/firestoreClientService-BUGkAdZ4.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { _ as Clock3, a as NETWORK_GROUP_POST_POLICIES, d as membershipFor, f as postPolicyById, h as validateGroupDraft, i as NETWORK_GROUP_LIMITS, l as groupAccess, p as toGroupInput, r as NETWORK_GROUP_JOIN_POLICIES, s as describeGroupFailure, t as EMPTY_GROUP_DRAFT, u as joinPolicyById } from "./networkGroupsForm-ZuOQumZk.js";
import { t as Lock } from "./lock-DA1SF9yS.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as Plus } from "./plus-CZjdWV3u.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Ot as Search, P as useOptionalSiteAccount, ht as Users, jt as RefreshCw } from "./index-BKrODMj6.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var DoorOpen = createLucideIcon("door-open", [
	["path", {
		d: "M11 20H2",
		key: "nlcfvz"
	}],
	["path", {
		d: "M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z",
		key: "au4z13"
	}],
	["path", {
		d: "M11 4H8a2 2 0 0 0-2 2v14",
		key: "74r1mk"
	}],
	["path", {
		d: "M14 12h.01",
		key: "1jfl7z"
	}],
	["path", {
		d: "M22 20h-3",
		key: "vhrsz"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var UsersRound = createLucideIcon("users-round", [
	["path", {
		d: "M18 21a8 8 0 0 0-16 0",
		key: "3ypg7q"
	}],
	["circle", {
		cx: "10",
		cy: "8",
		r: "5",
		key: "o932ke"
	}],
	["path", {
		d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",
		key: "10s06x"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var WifiOff = createLucideIcon("wifi-off", [
	["path", {
		d: "M12 20h.01",
		key: "zekei9"
	}],
	["path", {
		d: "M8.5 16.429a5 5 0 0 1 7 0",
		key: "1bycff"
	}],
	["path", {
		d: "M5 12.859a10 10 0 0 1 5.17-2.69",
		key: "1dl1wf"
	}],
	["path", {
		d: "M19 12.859a10 10 0 0 0-2.007-1.523",
		key: "4k23kn"
	}],
	["path", {
		d: "M2 8.82a15 15 0 0 1 4.177-2.643",
		key: "1grhjp"
	}],
	["path", {
		d: "M22 8.82a15 15 0 0 0-11.288-3.764",
		key: "z3jwby"
	}],
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}]
]);
//#endregion
//#region src/components/network/NetworkRulesStatus.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var RULES_EDITOR = "https://console.firebase.google.com/project/ai-studio-applet-webapp-18922/firestore/rules";
/**
* The one thing that can make a live page fail every write: the rules on the
* Firebase project are older than this build. Rather than let a member discover
* that through an error, the page states it — but only after *measuring* it, never
* as a guess.
*/
function NetworkRulesStatus({ language, probe }) {
	const isAr = language === "ar";
	const [result, setResult] = (0, import_react.useState)(null);
	const [checking, setChecking] = (0, import_react.useState)(true);
	const run = (0, import_react.useCallback)(async () => {
		setChecking(true);
		try {
			const api = probe ? { probeGroupRules: probe } : await __vitePreload(() => import("./rulesProbe-Gb9OW4tV.js"), __vite__mapDeps([0,1,2,3]));
			setResult(await api.probeGroupRules());
		} catch {
			setResult({
				state: "unknown",
				code: null,
				checkedAt: null
			});
		} finally {
			setChecking(false);
		}
	}, [probe]);
	(0, import_react.useEffect)(() => {
		run();
	}, [run]);
	const shell = "flex flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] leading-relaxed";
	const recheck = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": "network-rules-recheck",
		onClick: () => void run(),
		disabled: checking,
		className: "ms-auto inline-flex items-center gap-1 rounded border border-white/20 px-1.5 py-0.5 font-bold text-white/90 transition hover:border-white/40 disabled:opacity-50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
			className: `h-3 w-3 ${checking ? "animate-spin" : ""}`,
			"aria-hidden": "true"
		}), isAr ? "أعد الفحص" : "Check again"]
	});
	if (checking && !result) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-rules-checking",
		className: `${shell} border-[#232345] bg-[#0f0f22] text-slate-400`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			className: "h-3.5 w-3.5 shrink-0 animate-spin",
			"aria-hidden": "true"
		}), isAr ? "جارٍ فحص القواعد المنشورة…" : "Checking the published rules…"]
	});
	if (!result) return null;
	if (result.state === "ready") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-rules-ready",
		title: isAr ? "قراءة واحدة على مستند غير موجود: نجاحها يعني أن القواعد المنشورة تعرف مسار الجروبات — لا أنه يسمح بكل كتابة." : "A single read of a document that does not exist: success means the published rules know the groups path — not that every write is allowed.",
		className: `${shell} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
				className: "h-3.5 w-3.5 shrink-0",
				"aria-hidden": "true"
			}),
			isAr ? "القواعد المنشورة تعرف مسار الجروبات (فحص قراءة فعلي)." : "The published rules know the groups path (a real read check).",
			recheck
		]
	});
	if (result.state === "offline") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-rules-offline",
		className: `${shell} border-amber-500/30 bg-amber-500/10 text-amber-200`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, {
				className: "h-3.5 w-3.5 shrink-0",
				"aria-hidden": "true"
			}),
			isAr ? "تعذّر الفحص بسبب الشبكة — لم يُحكم على القواعد." : "The check could not reach the server — no verdict on the rules.",
			recheck
		]
	});
	if (result.state === "unknown") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-rules-unknown",
		className: `${shell} border-[#232345] bg-[#0f0f22] text-slate-400`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-3.5 w-3.5 shrink-0",
				"aria-hidden": "true"
			}),
			isAr ? "لم يتمكّن الفحص من الحكم على القواعد." : "The check could not decide.",
			recheck
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-rules-missing",
		className: `${shell} border-rose-500/40 bg-rose-500/10 text-rose-200`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-3.5 w-3.5 shrink-0",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [
					isAr ? "القواعد المنشورة على Firebase لا تعرف مسار الجروبات بعد، فسيُرفض الإنشاء والانضمام. الملف firestore.rules موجود في المستودع ولم يُنشر على المشروع:" : "The rules published on Firebase do not know the groups path yet, so creating and joining will be refused. firestore.rules exists in the repository but was never published to the project:",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: RULES_EDITOR,
						target: "_blank",
						rel: "noreferrer",
						className: "mx-1 font-bold text-rose-100 underline decoration-dotted underline-offset-2",
						children: isAr ? "افتح محرّر القواعد" : "Open the rules editor"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mx-1 text-rose-300/80",
						children: "·"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "rounded bg-black/30 px-1 py-0.5 font-mono text-[10px] text-rose-100",
						children: "npm run rules:deploy"
					})
				]
			}),
			recheck
		]
	});
}
//#endregion
//#region src/components/network/NetworkGroupsSection.tsx
var fieldClass = "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none";
/**
* `#network/groups` — the groups members create themselves.
*
* Every group states its two policies on its card, because a visitor has to know
* whether the door is open, answered by the owner, or invitation-only *before* clicking.
* The rules enforce the same answer; the interface only tells the truth about it.
*/
var NetworkGroupsSection = ({ language, onOpenAccount, onOpenProfile, onOpenGroup, slowAfterMs = 8e3 }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [groups, setGroups] = (0, import_react.useState)([]);
	const [memberships, setMemberships] = (0, import_react.useState)([]);
	const [card, setCard] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [slow, setSlow] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [term, setTerm] = (0, import_react.useState)("");
	const [draft, setDraft] = (0, import_react.useState)(EMPTY_GROUP_DRAFT);
	const [touched, setTouched] = (0, import_react.useState)(false);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [created, setCreated] = (0, import_react.useState)(null);
	const [actionError, setActionError] = (0, import_react.useState)(null);
	const [joining, setJoining] = (0, import_react.useState)(null);
	const serviceReady = account?.available ?? false;
	const uid = account?.user?.uid ?? null;
	const verified = account?.verified ?? false;
	const canCreate = Boolean(uid) && verified && Boolean(card);
	(0, import_react.useEffect)(() => {
		setGroups([]);
		setMemberships([]);
		setCard(null);
		setLoading(Boolean(serviceReady));
		setSlow(false);
		setError(null);
		if (!serviceReady) {
			setLoading(false);
			return;
		}
		let active = true;
		const stopFns = [];
		const timer = setTimeout(() => {
			if (active) setSlow(true);
		}, slowAfterMs);
		__vitePreload(() => import("./communityGroupsService-BCy726Ax.js").then((api) => {
			if (!active) return;
			stopFns.push(api.subscribeCommunityGroups((next) => {
				if (!active) return;
				setGroups(next);
				setLoading(false);
				setSlow(false);
			}, (nextError) => {
				if (!active) return;
				setError(nextError.message);
				setLoading(false);
				setSlow(false);
			}));
			if (uid) {
				stopFns.push(api.subscribeMyGroupMemberships(uid, (next) => {
					if (active) setMemberships(next);
				}, () => {}));
				__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((service) => {
					if (!active) return;
					stopFns.push(service.subscribeMyCommunityWorkspace(uid, (next) => {
						if (active) setCard(next);
					}, () => {}));
				}), __vite__mapDeps([5,2,6,7,8,9,10,11,12,1,3]));
			}
		}), __vite__mapDeps([4,1,2,3]));
		return () => {
			active = false;
			clearTimeout(timer);
			stopFns.forEach((stop) => stop());
		};
	}, [
		serviceReady,
		uid,
		slowAfterMs
	]);
	const errors = (0, import_react.useMemo)(() => validateGroupDraft(draft), [draft]);
	const update = (0, import_react.useCallback)((key, value) => {
		setTouched(true);
		setCreated(null);
		setActionError(null);
		setDraft((current) => ({
			...current,
			[key]: value
		}));
	}, []);
	const create = (0, import_react.useCallback)(async (event) => {
		event.preventDefault();
		setTouched(true);
		const user = account?.user;
		if (!user || !card || errors.length > 0) return;
		setCreating(true);
		setActionError(null);
		try {
			const id = await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([4,1,2,3]))).createCommunityGroup(user, card.displayName, toGroupInput(draft));
			setDraft(EMPTY_GROUP_DRAFT);
			setTouched(false);
			setCreated(id);
		} catch (failure) {
			setActionError(describeGroupFailure(failure, isAr));
		} finally {
			setCreating(false);
		}
	}, [
		account?.user,
		card,
		draft,
		errors.length
	]);
	const join = (0, import_react.useCallback)(async (group) => {
		const user = account?.user;
		if (!user || !card) return;
		setJoining(group.id);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([4,1,2,3]))).joinCommunityGroup(group, user, card.displayName);
		} catch (failure) {
			const message = failure instanceof Error ? failure.message : String(failure);
			setActionError(message === "invite-only" ? isAr ? "هذا الجروب بالدعوة فقط — يضيفك المالك." : "This group is invitation-only — its owner adds members." : describeGroupFailure(failure, isAr));
		} finally {
			setJoining(null);
		}
	}, [
		account?.user,
		card,
		isAr
	]);
	const visible = (0, import_react.useMemo)(() => {
		const needle = term.trim().toLowerCase();
		if (needle === "") return groups;
		return groups.filter((group) => group.name.toLowerCase().includes(needle) || group.description.toLowerCase().includes(needle) || group.ownerName.toLowerCase().includes(needle));
	}, [groups, term]);
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-groups-unavailable",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0 text-violet-300",
				"aria-hidden": "true"
			}), isAr ? "الجروبات غير متاحة في هذه النسخة" : "Groups are not available in this build"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُهيَّأ اتصال Firebase، فلا توجد جروبات حقيقية — ولن نعرض جروبات تجريبية بدلاً منها." : "Firebase is not initialised, so there are no real groups — and we will not show trial groups instead."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-groups-live",
		className: "grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkRulesStatus, { language }),
				canCreate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: create,
					className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1.5 text-xs font-bold text-white",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									className: "h-4 w-4 shrink-0 text-violet-300",
									"aria-hidden": "true"
								}),
								isAr ? "أنشئ جروباً" : "Create a group",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ms-auto text-[10px] font-normal text-slate-500",
									children: isAr ? `المالك: ${card?.displayName}` : `Owner: ${card?.displayName}`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 grid min-w-0 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: isAr ? "اسم الجروب" : "Group name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft.name,
										onChange: (event) => update("name", event.target.value),
										maxLength: NETWORK_GROUP_LIMITS.nameMax,
										className: fieldClass,
										"aria-label": isAr ? "اسم الجروب" : "Group name",
										placeholder: isAr ? "مثال: مفتشو PAUT في مصر" : "e.g. PAUT inspectors in Egypt"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-[10px] font-bold text-slate-400",
										children: [isAr ? "الغرض" : "Purpose", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ms-1 font-normal text-slate-500",
											children: isAr ? "(يظهر لكل زائر)" : "(visible to every visitor)"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: draft.description,
										onChange: (event) => update("description", event.target.value),
										maxLength: NETWORK_GROUP_LIMITS.descriptionMax,
										rows: 2,
										className: `${fieldClass} resize-none`,
										"aria-label": isAr ? "وصف الجروب" : "Group description"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid min-w-0 gap-2 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[10px] font-bold text-slate-400",
											children: isAr ? "كيف ينضم الناس؟" : "How do people join?"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											value: draft.joinPolicy,
											onChange: (event) => update("joinPolicy", event.target.value),
											className: fieldClass,
											"aria-label": isAr ? "سياسة الانضمام" : "Join policy",
											children: NETWORK_GROUP_JOIN_POLICIES.map((policy) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: policy.id,
												children: isAr ? policy.ar : policy.en
											}, policy.id))
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[10px] font-bold text-slate-400",
											children: isAr ? "من ينشر؟" : "Who may post?"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											value: draft.postPolicy,
											onChange: (event) => update("postPolicy", event.target.value),
											className: fieldClass,
											"aria-label": isAr ? "سياسة النشر" : "Post policy",
											children: NETWORK_GROUP_POST_POLICIES.map((policy) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: policy.id,
												children: isAr ? policy.ar : policy.en
											}, policy.id))
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
									disabled: creating || errors.length > 0,
									className: "inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
									children: [creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										className: "h-3.5 w-3.5 shrink-0 animate-spin",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										className: "h-3.5 w-3.5 shrink-0",
										"aria-hidden": "true"
									}), isAr ? "إنشاء الجروب" : "Create group"]
								}),
								touched && errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "alert",
									className: "text-[10px] text-rose-300",
									children: isAr ? errors[0].ar : errors[0].en
								}) : null,
								created ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									role: "status",
									className: "text-[10px] font-bold text-emerald-300",
									children: isAr ? "أُنشئ الجروب." : "Group created."
								}) : null
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-groups-gate",
					className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 text-xs font-bold text-white",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsersRound, {
								className: "h-4 w-4 shrink-0 text-violet-300",
								"aria-hidden": "true"
							}), isAr ? "أنشئ جروباً" : "Create a group"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11px] leading-relaxed text-slate-400",
							children: !account?.ready ? isAr ? "جارٍ التحقق من جلسة حسابك…" : "Checking your account session…" : !uid ? isAr ? "سجّل الدخول لإنشاء جروب. التصفح متاح للجميع." : "Sign in to create a group. Browsing is open to everyone." : !verified ? isAr ? "أكّد بريدك أولاً — القواعد ترفض الإنشاء قبله." : "Confirm your email first — the rules refuse creation before it." : isAr ? "أنشئ بطاقتك المهنية أولاً: الجروب يُنسب إلى اسمك." : "Create your card first: a group is attributed to your name."
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-1.5 rounded-lg border border-[#232345] bg-[#0f0f22] px-2 py-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: term,
						onChange: (event) => setTerm(event.target.value),
						"aria-label": isAr ? "ابحث في الجروبات" : "Search groups",
						placeholder: isAr ? "ابحث بالاسم أو الوصف أو المالك…" : "Search by name, purpose or owner…",
						className: "min-w-0 flex-1 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
					})]
				}),
				actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: actionError
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: describeGroupFailure({ message: error }, isAr)
				}) : null,
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": "network-groups-loading",
					className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
					children: slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs font-bold text-amber-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
							className: "h-4 w-4 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "الاتصال بالتخزين بطيء أو محجوب" : "The store is slow or blocked"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] leading-relaxed text-amber-100/90",
						children: isAr ? "لم تصل أي مجموعة بعد — هذا ليس فراغاً، بل اتصال لم يكتمل." : "No group has arrived yet — this is not emptiness, but an unfinished connection."
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						role: "status",
						className: "flex items-center gap-2 text-[11px] text-slate-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "h-4 w-4 shrink-0 animate-spin",
							"aria-hidden": "true"
						}), isAr ? "جارٍ تحميل الجروبات…" : "Loading groups…"]
					})
				}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "network-groups-empty",
					className: "rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsersRound, {
							className: "mx-auto h-6 w-6 text-slate-600",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs font-bold text-slate-300",
							children: groups.length === 0 ? isAr ? "لا توجد جروبات بعد" : "No groups yet" : isAr ? "لا نتائج مطابقة" : "No matching groups"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500",
							children: groups.length === 0 ? isAr ? "أول جروب حقيقي يظهر هنا بمجرد إنشائه من عضو مؤكَّد البريد. لا جروبات وهمية." : "The first real group appears here once a confirmed member creates one. No invented groups." : isAr ? "جرّب كلمة أخرى أو امسح البحث." : "Try another word, or clear the search."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					"data-testid": "network-groups-list",
					className: "grid min-w-0 gap-2.5 sm:grid-cols-2",
					children: visible.map((group) => {
						const membership = membershipFor(group, memberships);
						const access = groupAccess(group, uid, membership);
						const joinPolicy = joinPolicyById(group.joinPolicy);
						const postPolicy = postPolicyById(group.postPolicy);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							"data-testid": "network-group-card",
							className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-w-0 items-start justify-between gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "min-w-0 text-sm font-bold leading-snug text-white",
										children: group.name
									}), access.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200",
										children: isAr ? "مالك" : "Owner"
									}) : access.state === "member" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded border border-emerald-500/40 bg-emerald-500/10 px-1 text-[9px] font-bold text-emerald-200",
										children: isAr ? "عضو" : "Member"
									}) : access.state === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1 text-[9px] font-bold text-amber-200",
										children: isAr ? "قيد المراجعة" : "Pending"
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 line-clamp-3 text-[10px] leading-relaxed text-slate-400",
									children: group.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[9px] text-slate-500",
									children: isAr ? `المالك: ${group.ownerName}` : `Owner: ${group.ownerName}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1.5 flex flex-wrap gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
										children: isAr ? joinPolicy.ar : joinPolicy.en
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
										children: isAr ? postPolicy.ar : postPolicy.en
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex flex-wrap items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => onOpenGroup(group.id),
										"data-testid": "network-group-open",
										className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DoorOpen, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), isAr ? "فتح الجروب" : "Open the group"]
									}), access.state === "member" || access.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										"data-testid": "network-group-member-state",
										className: "inline-flex items-center gap-1 text-[9px] text-emerald-300",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), isAr ? "داخل الجروب" : "Inside"]
									}) : access.state === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										"data-testid": "network-group-pending",
										className: "inline-flex items-center gap-1 text-[9px] text-amber-300",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), isAr ? "طلبك قيد المراجعة" : "Your request is pending"]
									}) : access.state === "rejected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center gap-1 text-[9px] text-rose-300",
										children: isAr ? "رُفض طلبك" : "Your request was rejected"
									}) : access.joinIntent === "invite-only" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										"data-testid": "network-group-invite-only",
										title: isAr ? "يضيفك مالك الجروب" : "The group owner adds members",
										className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-500",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), isAr ? "بدعوة فقط" : "Invitation only"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => void join(group),
										disabled: !uid || !verified || !card || joining === group.id,
										title: !uid ? isAr ? "سجّل الدخول للانضمام" : "Sign in to join" : !verified ? isAr ? "أكّد بريدك أولاً" : "Confirm your email first" : !card ? isAr ? "أنشئ بطاقتك أولاً" : "Create your card first" : void 0,
										"data-testid": "network-group-join",
										className: `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${uid && verified && card ? "border-violet-400/50 bg-violet-500/10 text-violet-200 cursor-pointer hover:border-violet-300" : "border-[#2a2a4d] bg-[#14142a] text-slate-500 opacity-70 cursor-not-allowed"}`,
										children: [joining === group.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											className: "h-3 w-3 shrink-0 animate-spin",
											"aria-hidden": "true"
										}) : access.joinIntent === "request" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
											className: "h-3 w-3 shrink-0",
											"aria-hidden": "true"
										}), access.joinIntent === "request" ? isAr ? "طلب انضمام" : "Request to join" : isAr ? "انضمام" : "Join"]
									})]
								})
							]
						}, group.id);
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "min-w-0 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-[10px] leading-relaxed text-sky-100",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-1 text-[11px] font-bold text-sky-200",
					children: isAr ? "المالك يقرّر، والقاعدة تفرض" : "The owner decides, the rules enforce"
				}), isAr ? "سياسة الانضمام وسياسة النشر يختارهما مالك الجروب، ومكتوبتان على بطاقة الجروب قبل أي نقرة — و`firestore.rules` ترفض ما يخالفهما." : "The owner chooses how people join and who posts; both are printed on the card before any click — and `firestore.rules` refuses anything else."]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400",
				children: isAr ? "منشورات الجروب لا تظهر في التغذية العامة ولا في صفحتك العامة — تغذية الجروب مكانها داخله." : "Group posts never appear in the public feed or on your public page — a group feed stays inside its group."
			})]
		})]
	});
};
//#endregion
export { NetworkGroupsSection, NetworkGroupsSection as default };
