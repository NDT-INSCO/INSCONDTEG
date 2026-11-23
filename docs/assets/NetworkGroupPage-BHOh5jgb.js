const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/communityGroupsService-BCy726Ax.js","assets/index.esm-T7XjjJ2p.js","assets/rolldown-runtime-oLLnCvco.js","assets/config-BaEX8mXf.js","assets/firestoreClientService-BUGkAdZ4.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { _ as Clock3, a as NETWORK_GROUP_POST_POLICIES, c as draftFromGroup, f as postPolicyById, g as validateGroupPostDraft, h as validateGroupDraft, i as NETWORK_GROUP_LIMITS, l as groupAccess, m as toGroupPostInput, n as EMPTY_GROUP_POST_DRAFT, o as approvedMemberCount, p as toGroupInput, r as NETWORK_GROUP_JOIN_POLICIES, s as describeGroupFailure, t as EMPTY_GROUP_DRAFT, u as joinPolicyById } from "./networkGroupsForm-ZuOQumZk.js";
import { t as Lock } from "./lock-DA1SF9yS.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as Plus } from "./plus-CZjdWV3u.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Dt as Send, Et as Settings2, P as useOptionalSiteAccount, _t as UserPlus, bt as Trash2, dt as X, ht as Users, mn as Check, wn as ArrowLeft } from "./index-BKrODMj6.js";
//#region src/components/network/NetworkGroupPage.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var fieldClass = "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none";
var shortDate = (value, isAr) => {
	const at = value && typeof value === "object" && "toMillis" in value ? value.toMillis?.() ?? 0 : 0;
	if (!at) return isAr ? "الآن" : "now";
	try {
		return new Date(at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
			day: "numeric",
			month: "short"
		});
	} catch {
		return new Date(at).toISOString().slice(0, 10);
	}
};
/**
* `#network/groups/<groupId>` — one group.
*
* The page asks the same question the rules ask: is this member approved here, and did
* the owner allow members to post? A non-member is not shown an empty feed but the way
* in — or, for an invitation-only group, the reason there is none. The owner gets the
* tools their own policy implies: answer requests, change the two policies, add members.
*/
var NetworkGroupPage = ({ groupId, language, onOpenAccount, onOpenProfile, onBack, slowAfterMs = 8e3 }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [group, setGroup] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [slow, setSlow] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [card, setCard] = (0, import_react.useState)(null);
	const [members, setMembers] = (0, import_react.useState)([]);
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [postsState, setPostsState] = (0, import_react.useState)("idle");
	const [draft, setDraft] = (0, import_react.useState)(EMPTY_GROUP_POST_DRAFT);
	const [posting, setPosting] = (0, import_react.useState)(false);
	const [actionError, setActionError] = (0, import_react.useState)(null);
	const [joining, setJoining] = (0, import_react.useState)(false);
	const [answering, setAnswering] = (0, import_react.useState)(null);
	const [settings, setSettings] = (0, import_react.useState)(EMPTY_GROUP_DRAFT);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [savingSettings, setSavingSettings] = (0, import_react.useState)(false);
	const [directory, setDirectory] = (0, import_react.useState)([]);
	const [inviting, setInviting] = (0, import_react.useState)(null);
	const serviceReady = account?.available ?? false;
	const uid = account?.user?.uid ?? null;
	const verified = account?.verified ?? false;
	const membership = (0, import_react.useMemo)(() => members.find((member) => member.uid === uid) ?? null, [members, uid]);
	const access = (0, import_react.useMemo)(() => group ? groupAccess(group, uid, membership) : null, [
		group,
		uid,
		membership
	]);
	(0, import_react.useEffect)(() => {
		setGroup(null);
		setMembers([]);
		setPosts([]);
		setPostsState("idle");
		setError(null);
		setSlow(false);
		if (!serviceReady) {
			setLoading(false);
			return;
		}
		let active = true;
		setLoading(true);
		const timer = setTimeout(() => {
			if (active) setSlow(true);
		}, slowAfterMs);
		__vitePreload(() => import("./communityGroupsService-BCy726Ax.js").then((api) => {
			if (!active) return;
			api.subscribeCommunityGroup(groupId, (next) => {
				if (!active) return;
				setGroup(next);
				setLoading(false);
				setSlow(false);
				if (next) setSettings(draftFromGroup(next));
			}, (nextError) => {
				if (!active) return;
				setError(nextError.message);
				setLoading(false);
				setSlow(false);
			});
			if (uid) {
				api.subscribeGroupMembers(groupId, (next) => {
					if (active) setMembers(next);
				}, () => {});
				__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((service) => {
					if (!active) return;
					service.subscribeMyCommunityWorkspace(uid, (next) => {
						if (active) setCard(next);
					}, () => {});
				}), __vite__mapDeps([4,2,5,6,7,8,9,10,11,1,3]));
			}
		}), __vite__mapDeps([0,1,2,3]));
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [
		groupId,
		serviceReady,
		uid,
		slowAfterMs
	]);
	const canReadPosts = access?.canReadPosts ?? false;
	(0, import_react.useEffect)(() => {
		if (!serviceReady || !canReadPosts) {
			setPosts([]);
			setPostsState(access && !canReadPosts ? "refused" : "idle");
			return;
		}
		let active = true;
		setPostsState("loading");
		__vitePreload(() => import("./communityGroupsService-BCy726Ax.js").then((api) => {
			if (!active) return;
			api.subscribeGroupPosts(groupId, (next) => {
				if (!active) return;
				setPosts(next);
				setPostsState("ready");
			}, () => {
				if (active) setPostsState("refused");
			});
		}), __vite__mapDeps([0,1,2,3]));
		return () => {
			active = false;
		};
	}, [
		groupId,
		serviceReady,
		canReadPosts,
		access
	]);
	(0, import_react.useEffect)(() => {
		if (!access?.isOwner || group?.joinPolicy !== "invite") {
			setDirectory([]);
			return;
		}
		let active = true;
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			api.subscribeCommunityWorkspaces(false, (next) => {
				if (active) setDirectory(next);
			}, () => {});
		}), __vite__mapDeps([4,2,5,6,7,8,9,10,11,1,3]));
		return () => {
			active = false;
		};
	}, [access?.isOwner, group?.joinPolicy]);
	const join = (0, import_react.useCallback)(async () => {
		const user = account?.user;
		if (!group || !user || !card) return;
		setJoining(true);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([0,1,2,3]))).joinCommunityGroup(group, user, card.displayName);
		} catch (failure) {
			const message = failure instanceof Error ? failure.message : String(failure);
			setActionError(message === "invite-only" ? isAr ? "هذا الجروب بالدعوة فقط — يضيفك المالك." : "This group is invitation-only — its owner adds members." : describeGroupFailure(failure, isAr));
		} finally {
			setJoining(false);
		}
	}, [
		account?.user,
		card,
		group,
		isAr
	]);
	const post = (0, import_react.useCallback)(async (event) => {
		event.preventDefault();
		const user = account?.user;
		if (!group || !user || !card) return;
		if (validateGroupPostDraft(draft).length > 0) return;
		setPosting(true);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([0,1,2,3]))).createGroupPost(user, group.id, {
				displayName: card.displayName,
				headline: card.headline
			}, toGroupPostInput(draft));
			setDraft(EMPTY_GROUP_POST_DRAFT);
		} catch (failure) {
			setActionError(describeGroupFailure(failure, isAr));
		} finally {
			setPosting(false);
		}
	}, [
		account?.user,
		card,
		draft,
		group
	]);
	const answer = (0, import_react.useCallback)(async (target, decision) => {
		if (!group) return;
		setAnswering(target.uid);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([0,1,2,3]))).answerGroupRequest(group.id, target.uid, decision);
		} catch (failure) {
			setActionError(describeGroupFailure(failure, isAr));
		} finally {
			setAnswering(null);
		}
	}, [group]);
	const saveSettings = (0, import_react.useCallback)(async () => {
		if (!group || validateGroupDraft(settings).length > 0) return;
		setSavingSettings(true);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([0,1,2,3]))).updateCommunityGroupSettings(group.id, toGroupInput(settings));
			setSettingsOpen(false);
		} catch (failure) {
			setActionError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setSavingSettings(false);
		}
	}, [group, settings]);
	const invite = (0, import_react.useCallback)(async (target) => {
		if (!group) return;
		setInviting(target.uid);
		setActionError(null);
		try {
			await (await __vitePreload(() => import("./communityGroupsService-BCy726Ax.js"), __vite__mapDeps([0,1,2,3]))).inviteToCommunityGroup(group.id, {
				uid: target.uid,
				displayName: target.displayName
			});
		} catch (failure) {
			setActionError(describeGroupFailure(failure, isAr));
		} finally {
			setInviting(null);
		}
	}, [group]);
	const back = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onBack,
		className: "inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
			className: "h-3.5 w-3.5 shrink-0",
			"aria-hidden": "true"
		}), isAr ? "كل الجروبات" : "All groups"]
	});
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-group-unavailable",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0 text-violet-300",
				"aria-hidden": "true"
			}), isAr ? "الجروبات غير متاحة في هذه النسخة" : "Groups are not available in this build"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 text-[11px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُهيَّأ اتصال Firebase، فلا جروب حقيقياً لقراءته." : "Firebase is not initialised, so there is no real group to read."
		})]
	});
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-testid": "network-group-loading",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-xs font-bold text-amber-200",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0",
				"aria-hidden": "true"
			}), isAr ? "الاتصال بطيء أو محجوب" : "The connection is slow or blocked"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-[10px] text-amber-100/90",
			children: isAr ? "لم يصل الجروب بعد — ليست صفحة فارغة." : "The group has not arrived yet — this is not an empty page."
		})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			role: "status",
			className: "flex items-center gap-2 text-[11px] text-slate-400",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "h-4 w-4 shrink-0 animate-spin",
				"aria-hidden": "true"
			}), isAr ? "جارٍ تحميل الجروب…" : "Loading the group…"]
		})
	});
	if (error || !group) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-group-missing",
		className: "mx-auto max-w-xl rounded-xl border border-[#232345] bg-[#0f0f22] p-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
				className: "mx-auto h-6 w-6 text-slate-600",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm font-bold text-white",
				children: isAr ? "لا يوجد جروب بهذا الرابط" : "No group at this link"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-slate-400",
				children: error ? isAr ? `تعذّر تحميله: ${error}` : `It could not be loaded: ${error}` : isAr ? "ربما حُذف، أو أن الرابط قديم. لا نعرض جروباً بديلاً." : "It may have been deleted, or the link is old. We do not show a substitute group."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: back
			})
		]
	});
	const joinPolicy = joinPolicyById(group.joinPolicy);
	const postPolicy = postPolicyById(group.postPolicy);
	const approved = approvedMemberCount(members);
	const pending = members.filter((member) => member.status === "pending");
	const postErrors = validateGroupPostDraft(draft);
	const settingsErrors = validateGroupDraft(settings);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-group-live",
		className: "mx-auto min-w-0 max-w-3xl space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-wrap items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									"data-testid": "network-group-name",
									className: "text-base font-bold leading-snug text-white",
									children: group.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[11px] leading-relaxed text-slate-300",
									children: group.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-[10px] text-slate-500",
									children: [isAr ? `المالك: ${group.ownerName}` : `Owner: ${group.ownerName}`, access?.canReadPosts ? ` · ${isAr ? `${approved} عضو` : `${approved} members`}` : ""]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1.5 flex flex-wrap gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
											children: isAr ? joinPolicy.ar : joinPolicy.en
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
											children: isAr ? postPolicy.ar : postPolicy.en
										}),
										access?.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200",
											children: isAr ? "أنت المالك" : "You own this group"
										}) : access?.state === "member" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-200",
											children: isAr ? "عضو" : "Member"
										}) : access?.state === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-200",
											children: isAr ? "طلبك قيد المراجعة" : "Your request is pending"
										}) : null
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1.5",
							children: [access?.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSettingsOpen((open) => !open),
								"data-testid": "network-group-settings-toggle",
								className: "inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "إعدادات الجروب" : "Group settings"]
							}) : null, back]
						})]
					}),
					actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "mt-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
						children: actionError
					}) : null,
					access?.isOwner && settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-testid": "network-group-settings",
						className: "mt-2 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid min-w-0 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: settings.name,
									onChange: (event) => setSettings((current) => ({
										...current,
										name: event.target.value
									})),
									maxLength: NETWORK_GROUP_LIMITS.nameMax,
									className: fieldClass,
									"aria-label": isAr ? "اسم الجروب" : "Group name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: settings.description,
									onChange: (event) => setSettings((current) => ({
										...current,
										description: event.target.value
									})),
									maxLength: NETWORK_GROUP_LIMITS.descriptionMax,
									rows: 2,
									className: `${fieldClass} resize-none`,
									"aria-label": isAr ? "وصف الجروب" : "Group description"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid min-w-0 gap-2 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: settings.joinPolicy,
										onChange: (event) => setSettings((current) => ({
											...current,
											joinPolicy: event.target.value
										})),
										className: fieldClass,
										"aria-label": isAr ? "سياسة الانضمام" : "Join policy",
										children: NETWORK_GROUP_JOIN_POLICIES.map((policy) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: policy.id,
											children: isAr ? policy.ar : policy.en
										}, policy.id))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: settings.postPolicy,
										onChange: (event) => setSettings((current) => ({
											...current,
											postPolicy: event.target.value
										})),
										className: fieldClass,
										"aria-label": isAr ? "سياسة النشر" : "Post policy",
										children: NETWORK_GROUP_POST_POLICIES.map((policy) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: policy.id,
											children: isAr ? policy.ar : policy.en
										}, policy.id))
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void saveSettings(),
								disabled: savingSettings || settingsErrors.length > 0,
								"data-testid": "network-group-settings-save",
								className: "inline-flex items-center gap-1 rounded-md bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
								children: [savingSettings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3 w-3 shrink-0 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "حفظ السياسات" : "Save policies"]
							}), settingsErrors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] text-rose-300",
								children: isAr ? settingsErrors[0].ar : settingsErrors[0].en
							}) : null]
						})]
					}) : null
				]
			}),
			access?.isOwner && pending.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "network-group-requests",
				className: "rounded-xl border border-amber-500/30 bg-amber-500/5 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-[11px] font-bold text-amber-200",
					children: isAr ? `طلبات انضمام (${pending.length})` : `Join requests (${pending.length})`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-1.5 space-y-1.5",
					children: pending.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-w-0 flex-wrap items-center justify-between gap-1.5 rounded border border-[#232345] bg-[#0b0b18] px-2 py-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 truncate text-[10px] text-slate-200",
							children: request.displayName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void answer(request, "approved"),
								disabled: answering === request.uid,
								"data-testid": "network-group-approve",
								className: "inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-200 transition cursor-pointer hover:border-emerald-300 disabled:opacity-50",
								children: [answering === request.uid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-2.5 w-2.5 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "h-2.5 w-2.5",
									"aria-hidden": "true"
								}), isAr ? "قبول" : "Approve"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void answer(request, "rejected"),
								disabled: answering === request.uid,
								"data-testid": "network-group-reject",
								className: "inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-200 transition cursor-pointer hover:border-rose-300 disabled:opacity-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
									className: "h-2.5 w-2.5",
									"aria-hidden": "true"
								}), isAr ? "رفض" : "Reject"]
							})]
						})]
					}, request.uid))
				})]
			}) : null,
			access?.isOwner && group.joinPolicy === "invite" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "network-group-invite",
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "flex items-center gap-1.5 text-[11px] font-bold text-slate-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), isAr ? "أضف عضواً من دليل الأعضاء" : "Add a member from the directory"]
				}), directory.filter((member) => !members.some((row) => row.uid === member.uid)).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[10px] text-slate-500",
					children: isAr ? "لا أعضاء متاحين للإضافة الآن." : "No members available to add right now."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-1.5 space-y-1",
					children: directory.filter((member) => !members.some((row) => row.uid === member.uid)).slice(0, 8).map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-w-0 flex-wrap items-center justify-between gap-1.5 rounded border border-[#232345] bg-[#0b0b18] px-2 py-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 truncate text-[10px] text-slate-200",
							children: [
								member.displayName,
								" · ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-500",
									children: member.organizationName
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void invite(member),
							disabled: inviting === member.uid,
							className: "inline-flex items-center gap-1 rounded border border-violet-400/50 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300 disabled:opacity-50",
							children: [inviting === member.uid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								className: "h-2.5 w-2.5 animate-spin",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "h-2.5 w-2.5",
								"aria-hidden": "true"
							}), isAr ? "إضافة" : "Add"]
						})]
					}, member.uid))
				})]
			}) : null,
			!access?.canReadPosts ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "network-group-gate",
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
						className: "mx-auto h-6 w-6 text-slate-600",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm font-bold text-white",
						children: access?.state === "pending" ? isAr ? "طلبك قيد المراجعة" : "Your request is pending" : access?.state === "rejected" ? isAr ? "رُفض طلبك" : "Your request was rejected" : isAr ? "منشورات الجروب للأعضاء" : "This feed is for members"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-slate-400",
						children: access?.state === "pending" ? isAr ? "المالك لم يبتّ في طلبك بعد — لا نشر ولا قراءة قبل الموافقة، وهذا ما تفرضه القواعد." : "The owner has not answered yet — no reading or posting before approval, as the rules require." : access?.state === "rejected" ? isAr ? "قرار المالك نهائي في هذه الجلسة. يمكنك مراسلته من دليل الأعضاء." : "The owner’s decision stands for now. You can reach them from the directory." : access?.joinIntent === "invite-only" ? isAr ? "هذا الجروب بالدعوة فقط — يضيفك المالك بنفسه." : "This group is invitation-only — its owner adds members." : isAr ? "تغذية الجروب لا تُقرأ قبل الموافقة، حتى لا يبدو الجروب فارغاً وهو ليس كذلك." : "A group feed is not readable before approval, so a group never looks empty when it is not."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center justify-center gap-2",
						children: [
							access && access.state === "none" && access.joinIntent !== "invite-only" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void join(),
								disabled: !uid || !verified || !card || joining,
								title: !uid ? isAr ? "سجّل الدخول للانضمام" : "Sign in to join" : !verified ? isAr ? "أكّد بريدك أولاً" : "Confirm your email first" : !card ? isAr ? "أنشئ بطاقتك أولاً" : "Create your card first" : void 0,
								"data-testid": "network-group-join-page",
								className: `inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${uid && verified && card ? "bg-violet-500 text-slate-950 cursor-pointer hover:bg-violet-400" : "border border-[#2a2a4d] bg-[#14142a] text-slate-500 cursor-not-allowed"}`,
								children: [joining ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3.5 w-3.5 shrink-0 animate-spin",
									"aria-hidden": "true"
								}) : access.joinIntent === "request" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
									className: "h-3.5 w-3.5 shrink-0",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									className: "h-3.5 w-3.5 shrink-0",
									"aria-hidden": "true"
								}), access.joinIntent === "request" ? isAr ? "طلب انضمام" : "Request to join" : isAr ? "انضمام" : "Join"]
							}) : null,
							!uid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => onOpenAccount("signin"),
								className: "rounded-lg border border-[#2a2a4d] bg-[#14142a] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
								children: isAr ? "تسجيل الدخول" : "Sign in"
							}) : null,
							uid && !verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => onOpenAccount("account"),
								className: "rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300",
								children: isAr ? "أكّد بريدك" : "Confirm your email"
							}) : null,
							uid && verified && !card ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onOpenProfile,
								className: "rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
								children: isAr ? "أنشئ بطاقتك" : "Create your card"
							}) : null
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [access?.canPost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: post,
				className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 text-[11px] font-bold text-white",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
								className: "h-3.5 w-3.5 shrink-0 text-violet-300",
								"aria-hidden": "true"
							}),
							isAr ? `انشر في ${group.name}` : `Post in ${group.name}`,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ms-auto text-[9px] font-normal text-slate-500",
								children: isAr ? `باسم ${card?.displayName}` : `as ${card?.displayName}`
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: draft.title,
						onChange: (event) => setDraft((current) => ({
							...current,
							title: event.target.value
						})),
						maxLength: NETWORK_GROUP_LIMITS.titleMax,
						className: `${fieldClass} mt-2`,
						"aria-label": isAr ? "عنوان المنشور (اختياري)" : "Post title (optional)",
						placeholder: isAr ? "عنوان (اختياري)" : "Title (optional)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: draft.body,
						onChange: (event) => setDraft((current) => ({
							...current,
							body: event.target.value
						})),
						maxLength: NETWORK_GROUP_LIMITS.bodyMax,
						rows: 3,
						className: `${fieldClass} mt-1.5 resize-none`,
						"aria-label": isAr ? "نص المنشور" : "Post body",
						placeholder: isAr ? "شارك ما تعلمته في الموقع…" : "Share what you learned on site…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: posting || postErrors.length > 0,
								"data-testid": "network-group-post-submit",
								className: "inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
								children: [posting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3.5 w-3.5 shrink-0 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
									className: "h-3.5 w-3.5 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "نشر" : "Post"]
							}),
							postErrors.length > 0 && draft.body !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] text-rose-300",
								children: isAr ? postErrors[0].ar : postErrors[0].en
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ms-auto text-[9px] text-slate-600",
								children: [
									draft.body.length,
									"/",
									NETWORK_GROUP_LIMITS.bodyMax
								]
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"data-testid": "network-group-post-blocked",
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400",
				children: isAr ? access?.postBlockedAr : access?.postBlockedEn
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "flex items-center gap-1.5 text-[11px] font-bold text-slate-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), isAr ? "منشورات الجروب" : "Group posts"]
				}), postsState === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					role: "status",
					className: "mt-1.5 flex items-center gap-2 text-[10px] text-slate-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "h-3.5 w-3.5 shrink-0 animate-spin",
						"aria-hidden": "true"
					}), isAr ? "جارٍ تحميل المنشورات…" : "Loading posts…"]
				}) : posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					"data-testid": "network-group-posts-empty",
					className: "mt-1.5 text-[10px] leading-relaxed text-slate-500",
					children: isAr ? "لا منشورات بعد. أول منشور حقيقي يظهر هنا — لا شيء يُملأ به الفراغ." : "No posts yet. The first real post appears here — nothing is used to fill the gap."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					"data-testid": "network-group-posts",
					className: "mt-1.5 space-y-2",
					children: posts.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-testid": "network-group-post",
						className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-200",
										children: entry.authorName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-slate-500",
										children: shortDate(entry.createdAt, isAr)
									}),
									entry.authorUid === uid || access?.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											__vitePreload(() => import("./communityGroupsService-BCy726Ax.js").then((api) => api.deleteGroupPost(group.id, entry.id)), __vite__mapDeps([0,1,2,3]));
										},
										title: isAr ? "حذف المنشور" : "Delete the post",
										className: "ms-auto inline-flex items-center gap-0.5 rounded border border-[#2a2a4d] px-1 py-0.5 text-[9px] text-slate-500 transition cursor-pointer hover:border-rose-400/50 hover:text-rose-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											className: "h-2.5 w-2.5",
											"aria-hidden": "true"
										}), isAr ? "حذف" : "Delete"]
									}) : null
								]
							}),
							entry.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-0.5 text-[11px] font-bold text-white",
								children: entry.title
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300",
								children: entry.body
							})
						]
					}, entry.id))
				})]
			})] })
		]
	});
};
//#endregion
export { NetworkGroupPage, NetworkGroupPage as default };
