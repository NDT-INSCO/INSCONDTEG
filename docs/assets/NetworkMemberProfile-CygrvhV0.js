const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/communityReputationService-Dv-cmODA.js","assets/index.esm-T7XjjJ2p.js","assets/rolldown-runtime-oLLnCvco.js","assets/config-BaEX8mXf.js","assets/networkProfileForm-DKDncrxG.js","assets/firestoreClientService-BUGkAdZ4.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { t as Briefcase } from "./briefcase-Dv_sjYzX.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { t as Lock } from "./lock-DA1SF9yS.js";
import { t as Linkedin } from "./linkedin-DZZtgKUO.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as MapPin } from "./map-pin-CwI3o0GO.js";
import { t as Plus } from "./plus-CZjdWV3u.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { P as useOptionalSiteAccount, bt as Trash2, gn as Building2, gt as UserRound, ht as Users, wn as ArrowLeft } from "./index-BKrODMj6.js";
import { C as RECOMMENDATION_RELATIONS, E as countEndorsements, F as validateRecommendation, M as skillById, N as skillLabel, O as endorsersOf, S as NETWORK_SKILL_LIMITS, T as canManageRecommendation, c as NETWORK_MEDIA_LIMITS, g as publicPageAccess, j as relationLabel, k as parseSkills, m as initialsOf, t as NETWORK_AVAILABILITY, u as bannerPaletteFor, v as visibilityById, w as canEndorse, y as EMPTY_RECOMMENDATION } from "./networkProfileForm-DKDncrxG.js";
import { t as BadgeCheck } from "./NetworkPortal-DhOewca2.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var MessageSquareQuote = createLucideIcon("message-square-quote", [
	["path", {
		d: "M14 14a2 2 0 0 0 2-2V8h-2",
		key: "1r06pg"
	}],
	["path", {
		d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
		key: "18887p"
	}],
	["path", {
		d: "M8 14a2 2 0 0 0 2-2V8H8",
		key: "1jzu5j"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Pencil = createLucideIcon("pencil", [["path", {
	d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
	key: "1a8usu"
}], ["path", {
	d: "m15 5 4 4",
	key: "1mk7zo"
}]]);
//#endregion
//#region src/components/network/NetworkReputation.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var chip = "inline-flex min-w-0 items-center gap-1 rounded-full border border-[#2a2a4d] bg-[#0b0b18] px-2 py-0.5 text-[10px] text-slate-200";
var smallButton = "inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200 transition hover:border-violet-400 disabled:opacity-50";
var shortDate$1 = (value, isAr) => {
	const raw = value;
	const date = raw && typeof raw === "object" && typeof raw.toDate === "function" ? raw.toDate() : typeof raw === "string" || typeof raw === "number" ? new Date(raw) : null;
	if (!date || Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
		year: "numeric",
		month: "short"
	});
};
/**
* Declared skills, with endorsement counts computed from documents.
*
* The heading says "تزكيات زملاء" and never "موثّق": an endorsement is a colleague's
* word, and this site grants no verification badge through it.
*/
var NetworkSkillsPanel = ({ profile, language, self = false, onOpenProfile }) => {
	const isAr = language === "ar";
	const account = useOptionalSiteAccount();
	const viewerUid = account?.user?.uid ?? null;
	const verified = account?.verified ?? false;
	const declared = (0, import_react.useMemo)(() => parseSkills(profile.skills), [profile.skills]);
	const [rows, setRows] = (0, import_react.useState)([]);
	const [mine, setMine] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [failure, setFailure] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!verified) {
			setRows([]);
			setLoading(false);
			return;
		}
		let alive = true;
		let unsubscribe;
		(async () => {
			try {
				const api = await __vitePreload(() => import("./communityReputationService-Dv-cmODA.js"), __vite__mapDeps([0,1,2,3,4]));
				unsubscribe = api.subscribeEndorsements(profile.uid, (next) => {
					if (!alive) return;
					setRows(next);
					setLoading(false);
				}, (error) => {
					if (!alive) return;
					setFailure(error.message);
					setLoading(false);
				});
				if (viewerUid && viewerUid !== profile.uid) {
					const own = await api.loadMyEndorsements(viewerUid, profile.uid);
					if (alive) setMine(own);
				}
			} catch {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
			unsubscribe?.();
		};
	}, [
		profile.uid,
		verified,
		viewerUid
	]);
	const counts = (0, import_react.useMemo)(() => countEndorsements(rows), [rows]);
	const endorse = (0, import_react.useCallback)(async (skillId) => {
		const user = account?.user;
		if (!user) return;
		setBusy(skillId);
		setFailure(null);
		try {
			const api = await __vitePreload(() => import("./communityReputationService-Dv-cmODA.js"), __vite__mapDeps([0,1,2,3,4]));
			const myName = await api.loadMyDisplayName(user.uid) || user.displayName || "";
			await api.endorseSkill(user, {
				uid: profile.uid,
				skillId
			}, myName);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(null);
		}
	}, [account?.user, profile.uid]);
	if (declared.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-skills-empty",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُعلن أي مهارة بعد." : "No skills declared yet."
		}), self && onOpenProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onOpenProfile,
			className: `${smallButton} mt-2`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
				className: "h-3 w-3",
				"aria-hidden": "true"
			}), isAr ? "أعلن مهاراتك من ملفك" : "Declare skills on your profile"]
		}) : null]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-skills-panel",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-[11px] font-bold text-slate-200",
						children: isAr ? "المهارات" : "Skills"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded bg-amber-500/10 px-1 text-[8px] font-bold text-amber-300",
						children: isAr ? "تزكيات زملاء — ليست شهادة" : "peer endorsements — not certification"
					}),
					!verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"data-testid": "network-skills-signin",
						className: "text-[9px] text-slate-500",
						children: isAr ? "سجّل الدخول لرؤية التزكيات." : "Sign in to see endorsements."
					}) : null
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				role: "status",
				className: "mt-1.5 flex items-center gap-2 text-[10px] text-slate-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "h-3.5 w-3.5 shrink-0 animate-spin",
					"aria-hidden": "true"
				}), isAr ? "جارٍ تحميل التزكيات…" : "Loading endorsements…"]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				"data-testid": "network-skills-list",
				className: "mt-1.5 flex flex-wrap gap-1.5",
				children: declared.map((skillId) => {
					const skill = skillById(skillId);
					const label = skill ? skillLabel(skill, isAr) : skillId;
					const count = counts[skillId] ?? 0;
					const gate = canEndorse({
						viewerUid,
						viewerVerified: verified,
						toUid: profile.uid,
						skillId,
						targetSkills: declared,
						existing: rows
					});
					const already = mine[skillId] === true;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-testid": "network-skill-chip",
						className: chip,
						title: label,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "max-w-[190px] truncate",
								children: label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"data-testid": "network-skill-endorsements",
								className: "rounded-full bg-violet-500/15 px-1 text-[9px] font-bold text-violet-200",
								title: count === 0 ? isAr ? "لا تزكيات بعد" : "No endorsements yet" : `${endorsersOf(rows, skillId).slice(0, 6).join(" · ")}`,
								children: count
							}),
							!self && verified ? already ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
									className: "h-2.5 w-2.5",
									"aria-hidden": "true"
								}), isAr ? "زكّيتها" : "endorsed"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-testid": "network-skill-endorse",
								disabled: !gate.allowed || busy === skillId,
								title: isAr ? gate.reasonAr ?? "زكّي هذه المهارة" : gate.reasonEn ?? "Endorse this skill",
								onClick: () => void endorse(skillId),
								className: smallButton,
								children: [busy === skillId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-2.5 w-2.5 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									className: "h-2.5 w-2.5",
									"aria-hidden": "true"
								}), isAr ? "زكِّ" : "Endorse"]
							}) : null
						]
					}, skillId);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-[9px] leading-relaxed text-slate-500",
				children: isAr ? `العدد محسوب من تزكيات الأعضاء المؤكَّدين (حتى ${NETWORK_SKILL_LIMITS.maxSkills} مهارة للعضو). لا يُمنح أي شارة تحقّق من التزكية.` : `Counts are computed from confirmed members' endorsements (up to ${NETWORK_SKILL_LIMITS.maxSkills} skills each). An endorsement grants no verification badge.`
			}),
			failure ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "mt-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
				children: failure
			}) : null
		]
	});
};
/**
* Written recommendations. Readable by confirmed members (the rules decide that,
* the panel only reports it), one per pair, editable by its author.
*/
var NetworkRecommendationsPanel = ({ profile, language, self = false }) => {
	const isAr = language === "ar";
	const account = useOptionalSiteAccount();
	const viewerUid = account?.user?.uid ?? null;
	const verified = account?.verified ?? false;
	const [rows, setRows] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [draft, setDraft] = (0, import_react.useState)(EMPTY_RECOMMENDATION);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [failure, setFailure] = (0, import_react.useState)(null);
	const [errors, setErrors] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!verified) {
			setLoading(false);
			return;
		}
		let alive = true;
		let unsubscribe;
		(async () => {
			try {
				unsubscribe = (await __vitePreload(() => import("./communityReputationService-Dv-cmODA.js"), __vite__mapDeps([0,1,2,3,4]))).subscribeRecommendations(profile.uid, (next) => {
					if (!alive) return;
					setRows(next);
					setLoading(false);
				}, (error) => {
					if (!alive) return;
					setFailure(error.message);
					setLoading(false);
				});
			} catch {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
			unsubscribe?.();
		};
	}, [profile.uid, verified]);
	const mineRow = rows.find((row) => row.fromUid === viewerUid) ?? null;
	const blocked = validateRecommendation(draft).length > 0;
	(0, import_react.useEffect)(() => {
		if (mineRow && !editing) setDraft({
			relation: mineRow.relation,
			body: mineRow.body
		});
	}, [mineRow?.id, editing]);
	const submit = (0, import_react.useCallback)(async (event) => {
		event.preventDefault();
		const user = account?.user;
		if (!user) return;
		const nextErrors = validateRecommendation(draft);
		setErrors(nextErrors);
		if (nextErrors.length > 0) return;
		setSaving(true);
		setFailure(null);
		try {
			const api = await __vitePreload(() => import("./communityReputationService-Dv-cmODA.js"), __vite__mapDeps([0,1,2,3,4]));
			const myName = await api.loadMyDisplayName(user.uid) || user.displayName || "";
			await api.writeRecommendation(user, {
				uid: profile.uid,
				displayName: profile.displayName
			}, myName, {
				relation: draft.relation,
				body: draft.body.trim()
			}, { exists: Boolean(mineRow) });
			setEditing(false);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : String(error));
		} finally {
			setSaving(false);
		}
	}, [
		account?.user,
		draft,
		mineRow,
		profile.displayName,
		profile.uid
	]);
	const remove = (0, import_react.useCallback)(async (row) => {
		setFailure(null);
		try {
			await (await __vitePreload(() => import("./communityReputationService-Dv-cmODA.js"), __vite__mapDeps([0,1,2,3,4]))).deleteRecommendation(row.id);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : String(error));
		}
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-recommendations-panel",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquareQuote, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-[11px] font-bold text-slate-200",
						children: isAr ? "توصيات مكتوبة" : "Written recommendations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[9px] text-slate-500",
						children: isAr ? "من عضو إلى عضو — الكلمة لكاتبها" : "Member to member — the words belong to their author"
					})
				]
			}),
			!verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"data-testid": "network-recommendations-signin",
				className: "mt-1.5 text-[10px] leading-relaxed text-slate-500",
				children: isAr ? "التوصيات تُقرأ للأعضاء المؤكَّدين فقط — هذا قرار القواعد، لا إخفاء واجهة." : "Recommendations are readable by confirmed members only — that is the rules, not a hidden button."
			}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				role: "status",
				className: "mt-1.5 flex items-center gap-2 text-[10px] text-slate-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "h-3.5 w-3.5 shrink-0 animate-spin",
					"aria-hidden": "true"
				}), isAr ? "جارٍ تحميل التوصيات…" : "Loading recommendations…"]
			}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"data-testid": "network-recommendations-empty",
				className: "mt-1.5 text-[10px] leading-relaxed text-slate-500",
				children: isAr ? "لا توصيات بعد." : "No recommendations yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				"data-testid": "network-recommendations-list",
				className: "mt-1.5 space-y-2",
				children: rows.map((row) => {
					const manageable = canManageRecommendation(row, viewerUid);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-testid": "network-recommendation",
						className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold text-white",
									children: row.fromName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400",
									children: relationLabel(row.relation, isAr)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-slate-500",
									children: shortDate$1(row.createdAt, isAr)
								}),
								manageable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ms-auto flex items-center gap-1",
									children: [row.fromUid === viewerUid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"data-testid": "network-recommendation-edit",
										onClick: () => {
											setEditing(true);
											setDraft({
												relation: row.relation,
												body: row.body
											});
										},
										className: "text-[9px] font-bold text-violet-300 underline decoration-dotted",
										children: isAr ? "تعديل" : "Edit"
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"data-testid": "network-recommendation-delete",
										onClick: () => void remove(row),
										title: isAr ? "حذف التوصية" : "Delete recommendation",
										className: "text-[9px] font-bold text-rose-300",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											className: "h-3 w-3",
											"aria-hidden": "true"
										})
									})]
								}) : null
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300",
							children: row.body
						})]
					}, row.id);
				})
			}),
			verified && !self ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				"data-testid": "network-recommendation-form",
				className: "mt-2 min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
								className: "h-3 w-3 shrink-0 text-slate-400",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[9px] font-bold text-slate-400",
								htmlFor: "recommendation-relation",
								children: isAr ? "علاقتك به" : "Your relation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "recommendation-relation",
								value: draft.relation,
								onChange: (event) => setDraft((current) => ({
									...current,
									relation: event.target.value
								})),
								className: "rounded border border-[#2a2a4d] bg-[#0f0f22] px-1.5 py-0.5 text-[10px] text-slate-200",
								children: RECOMMENDATION_RELATIONS.map((relation) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: relation.id,
									children: isAr ? relation.ar : relation.en
								}, relation.id))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: draft.body,
						onChange: (event) => {
							setDraft((current) => ({
								...current,
								body: event.target.value
							}));
							setErrors(validateRecommendation({
								...draft,
								body: event.target.value
							}));
						},
						rows: 3,
						maxLength: NETWORK_SKILL_LIMITS.recommendationMax + 40,
						placeholder: isAr ? "مثال: عملنا معاً في فحص لحامات خط ١٢ بوصة، وكان مسؤولاً عن تقييم العيوب بدقة…" : "Example: we worked together on the 12-inch line, and he sized the defects precisely…",
						className: "mt-1.5 w-full min-w-0 rounded border border-[#2a2a4d] bg-[#0f0f22] px-2 py-1.5 text-[10px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: saving || blocked,
								"data-testid": "network-recommendation-submit",
								className: smallButton,
								children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3 w-3 animate-spin",
									"aria-hidden": "true"
								}) : null, mineRow ? isAr ? "احفظ التعديل" : "Save changes" : isAr ? "أضف توصية" : "Add recommendation"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[9px] text-slate-500",
								children: [
									draft.body.trim().length,
									"/",
									NETWORK_SKILL_LIMITS.recommendationMax
								]
							}),
							errors.length > 0 && draft.body.trim().length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								role: "alert",
								"data-testid": "network-recommendation-error",
								className: "text-[9px] text-rose-300",
								children: isAr ? errors[0].ar : errors[0].en
							}) : null
						]
					})
				]
			}) : null,
			failure ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "mt-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
				children: failure
			}) : null
		]
	});
};
//#endregion
//#region src/components/network/NetworkMemberProfile.tsx
var millis = (value) => {
	if (value && typeof value === "object" && "toMillis" in value) {
		const fn = value.toMillis;
		if (typeof fn === "function") try {
			return fn();
		} catch {
			return 0;
		}
	}
	return 0;
};
var shortDate = (value, isAr) => {
	const at = millis(value);
	if (!at) return isAr ? "الآن" : "now";
	try {
		return new Date(at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric"
		});
	} catch {
		return new Date(at).toISOString().slice(0, 10);
	}
};
var availabilityLabel = (id, isAr) => {
	const found = NETWORK_AVAILABILITY.find((item) => item.id === id);
	return found ? isAr ? found.ar : found.en : null;
};
/**
* `#network/people/<uid>` — a member's public page.
*
* It reads the same `community_workspaces` card the rest of the site uses, and the
* same rules decide who may read it: a card marked «للأعضاء المؤكَّدين» is refused to a
* signed-out visitor by Firestore itself, and the page says so plainly instead of
* showing an empty shell. Nothing on this page is invented — no banner drawn as if
* the member had uploaded one, no certificate claimed as verified, no padding posts.
*/
var NetworkMemberProfile = ({ uid, language, onOpenAccount, onOpenProfile, onOpenDirectory, slowAfterMs = 8e3 }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [slow, setSlow] = (0, import_react.useState)(false);
	const [denied, setDenied] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [postsLoading, setPostsLoading] = (0, import_react.useState)(true);
	const [tab, setTab] = (0, import_react.useState)("posts");
	const serviceReady = account?.available ?? false;
	const signedIn = Boolean(account?.user?.uid);
	const verified = account?.verified ?? false;
	const isMine = account?.user?.uid === uid;
	(0, import_react.useEffect)(() => {
		setProfile(null);
		setDenied(false);
		setError(null);
		setPosts([]);
		setPostsLoading(true);
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
		(async () => {
			try {
				const found = await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([5,2,6,7,8,9,10,11,12,1,3]))).getCommunityWorkspace(uid);
				if (!active) return;
				setProfile(found);
			} catch (failure) {
				if (!active) return;
				const code = failure?.code;
				if (typeof code === "string" && code.includes("permission")) setDenied(true);
				else setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (active) {
					setLoading(false);
					setSlow(false);
					clearTimeout(timer);
				}
			}
		})();
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [
		uid,
		serviceReady,
		slowAfterMs,
		signedIn,
		verified
	]);
	const access = (0, import_react.useMemo)(() => publicPageAccess(profile, {
		signedIn,
		verified
	}), [
		profile,
		signedIn,
		verified
	]);
	const visible = access.state === "ok";
	(0, import_react.useEffect)(() => {
		if (!serviceReady || !visible) {
			setPostsLoading(false);
			return;
		}
		let active = true;
		let stop;
		setPostsLoading(true);
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stop = api.subscribeAuthorPublicPosts(uid, (next) => {
				if (!active) return;
				setPosts(next);
				setPostsLoading(false);
			}, () => {
				if (active) setPostsLoading(false);
			});
		}), __vite__mapDeps([5,2,6,7,8,9,10,11,12,1,3]));
		return () => {
			active = false;
			stop?.();
		};
	}, [
		uid,
		serviceReady,
		visible
	]);
	const copyLink = (0, import_react.useCallback)(async () => {
		const url = `${window.location.origin}${window.location.pathname}#network/people/${uid}`;
		try {
			await navigator.clipboard.writeText(url);
		} catch {}
	}, [uid]);
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-member-unavailable",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0 text-violet-300",
				"aria-hidden": "true"
			}), isAr ? "الصفحة غير متاحة في هذه النسخة" : "This page is not available in this build"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُهيَّأ اتصال Firebase، فلا يمكن قراءة بطاقة حقيقية — ولن نعرض بطاقة تجريبية بدلاً منها." : "Firebase is not initialised, so no real card can be read — and we will not show a trial card instead."
		})]
	});
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-testid": "network-member-loading",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-xs font-bold text-amber-200",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0",
				"aria-hidden": "true"
			}), isAr ? "الاتصال بالتخزين بطيء أو محجوب" : "The store is slow or blocked"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-[10px] leading-relaxed text-amber-100/90",
			children: isAr ? "لم تصل البطاقة بعد — هذه ليست صفحة فارغة، بل اتصال لم يكتمل." : "The card has not arrived yet — this is not an empty page, but an unfinished connection."
		})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			role: "status",
			className: "flex items-center gap-2 text-[11px] text-slate-400",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "h-4 w-4 shrink-0 animate-spin",
				"aria-hidden": "true"
			}), isAr ? "جارٍ تحميل البطاقة…" : "Loading the card…"]
		})
	});
	const deadEnd = (testId, title, body, action) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": testId,
		className: "mx-auto max-w-xl rounded-xl border border-[#232345] bg-[#0f0f22] p-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
				className: "mx-auto h-6 w-6 text-slate-600",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm font-bold text-white",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-slate-400",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap items-center justify-center gap-2",
				children: action
			})
		]
	});
	const backButton = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onOpenDirectory,
		className: "inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
			className: "h-3.5 w-3.5 shrink-0",
			"aria-hidden": "true"
		}), isAr ? "دليل الأعضاء" : "Member directory"]
	});
	if (error) return deadEnd("network-member-error", isAr ? "تعذّر تحميل الصفحة" : "The page could not be loaded", isAr ? `لم نتمكن من قراءة البطاقة: ${error}` : `The card could not be read: ${error}`, backButton);
	if (denied || access.state === "private") return deadEnd("network-member-private", isAr ? "هذه الصفحة للأعضاء المؤكَّدين" : "This page is for confirmed members", isAr ? "صاحب البطاقة اختار أن تكون صفحته للمسجّلين المؤكَّدين، وقواعد الحماية تمنع قراءتها قبل ذلك — ليس إخفاءً لزر، بل منعاً فعلياً." : "The member chose to keep this page for confirmed members, and the security rules refuse it before that — an actual refusal, not a hidden button.", signedIn ? account?.verified ? backButton : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onOpenAccount("account"),
		className: "inline-flex items-center gap-1 rounded-lg bg-amber-400/90 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-amber-300",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
			className: "h-3.5 w-3.5 shrink-0",
			"aria-hidden": "true"
		}), isAr ? "أكّد بريدك" : "Confirm your email"]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onOpenAccount("signin"),
		className: "inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
			className: "h-3.5 w-3.5 shrink-0",
			"aria-hidden": "true"
		}), isAr ? "تسجيل الدخول" : "Sign in"]
	}));
	if (access.state === "missing") return deadEnd("network-member-missing", isAr ? "لا توجد بطاقة بهذا الرابط" : "No card at this link", isAr ? "قد يكون الرابط قديماً أو أن العضو لم ينشئ بطاقته بعد. لا نعرض بطاقة بديلة." : "The link may be old, or the member has not created a card yet. We do not show a substitute card.", backButton);
	if (access.state === "not-published" || !profile) return deadEnd("network-member-not-published", isAr ? "البطاقة غير منشورة" : "This card is not published", isAr ? "العضو أخفى بطاقته من الدليل مؤقتاً. لا شيء لعرضه حتى يعيد نشرها." : "The member has temporarily hidden the card from the directory. There is nothing to show until it is published again.", backButton);
	const palette = bannerPaletteFor(profile.sector ?? "");
	const availability = availabilityLabel(profile.availabilityStatus, isAr);
	const membersOnly = visibilityById(profile.profileVisibility) === "members";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-member-live",
		className: "mx-auto min-w-0 max-w-3xl space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-xl border border-[#232345] bg-[#0f0f22]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					style: { aspectRatio: `${NETWORK_MEDIA_LIMITS.bannerWidth} / ${NETWORK_MEDIA_LIMITS.bannerHeight}` },
					children: [profile.bannerURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: profile.bannerURL,
						alt: isAr ? "بانر العضو" : "Member banner",
						"data-testid": "network-member-banner",
						className: "h-full w-full object-cover",
						loading: "lazy"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-testid": "network-member-banner-placeholder",
						className: "flex h-full w-full items-center justify-center",
						style: { background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] tracking-wide",
							style: { color: palette.accent },
							children: isAr ? "لا بانر بعد" : "No banner yet"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute -bottom-7 start-3 flex items-end gap-2",
						children: profile.photoURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: profile.photoURL,
							alt: profile.displayName,
							"data-testid": "network-member-photo",
							className: "h-16 w-16 rounded-full border-2 border-[#0f0f22] object-cover",
							loading: "lazy"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"data-testid": "network-member-photo-placeholder",
							className: "flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0f0f22] text-sm font-bold",
							style: {
								background: palette.to,
								color: palette.ink
							},
							children: initialsOf(profile.displayName)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-3 pb-3 pt-9",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-wrap items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										"data-testid": "network-member-name",
										className: "text-base font-bold leading-snug text-white",
										children: profile.displayName
									}),
									profile.headline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-[11px] leading-relaxed text-slate-300",
										children: profile.headline
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
													className: "h-2.5 w-2.5 shrink-0",
													"aria-hidden": "true"
												}), profile.organizationName]
											}),
											profile.city ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
													className: "h-2.5 w-2.5 shrink-0",
													"aria-hidden": "true"
												}), profile.city]
											}) : null,
											typeof profile.yearsExperience === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, {
													className: "h-2.5 w-2.5 shrink-0",
													"aria-hidden": "true"
												}), isAr ? `${profile.yearsExperience} سنة خبرة` : `${profile.yearsExperience} yrs`]
											}) : null
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1.5 flex flex-wrap items-center gap-1",
										children: [
											availability ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200",
												children: availability
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400",
												children: profile.sector
											}),
											membersOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-200",
												children: isAr ? "للأعضاء المؤكَّدين" : "Confirmed members"
											}) : null
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-1.5",
								children: [profile.linkedInUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: profile.linkedInUrl,
									target: "_blank",
									rel: "noopener noreferrer nofollow",
									"data-testid": "network-member-linkedin",
									className: "inline-flex items-center gap-1 rounded-lg border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-200 transition hover:border-sky-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Linkedin, {
										className: "h-3.5 w-3.5 shrink-0",
										"aria-hidden": "true"
									}), "LinkedIn"]
								}) : null, isMine ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: onOpenProfile,
									"data-testid": "network-member-edit",
									className: "inline-flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
										className: "h-3 w-3 shrink-0",
										"aria-hidden": "true"
									}), isAr ? "تعديل بطاقتي" : "Edit my card"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copyLink(),
									className: "inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
									children: isAr ? "نسخ الرابط" : "Copy link"
								})] }) : null]
							})]
						}),
						profile.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300",
							children: profile.bio
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-2 grid min-w-0 gap-2 sm:grid-cols-2",
							children: [profile.specialtyTrades ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[9px] font-bold text-slate-500",
									children: isAr ? "التخصصات" : "Specialities"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300",
									children: profile.specialtyTrades
								})]
							}) : null, profile.certifications ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
									className: "flex items-center gap-1 text-[9px] font-bold text-slate-500",
									children: [isAr ? "شهادات معلنة" : "Declared certificates", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded bg-amber-500/10 px-1 text-[8px] font-bold text-amber-300",
										children: isAr ? "غير مُتحقَّق منها" : "not verified"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300",
									children: profile.certifications
								})]
							}) : null]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "network-member-tabs",
				role: "tablist",
				className: "flex min-w-0 flex-wrap gap-1 rounded-xl border border-[#232345] bg-[#0f0f22] p-1",
				children: [
					{
						id: "posts",
						ar: "المنشورات",
						en: "Posts"
					},
					{
						id: "skills",
						ar: "المهارات والتزكيات",
						en: "Skills & endorsements"
					},
					{
						id: "recommendations",
						ar: "التوصيات",
						en: "Recommendations"
					}
				].map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": tab === entry.id,
					"data-testid": `network-member-tab-${entry.id}`,
					onClick: () => setTab(entry.id),
					className: `min-w-0 rounded-lg px-2 py-1 text-[10px] font-bold transition ${tab === entry.id ? "bg-violet-500/20 text-violet-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`,
					children: isAr ? entry.ar : entry.en
				}, entry.id))
			}),
			tab === "skills" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkSkillsPanel, {
				profile,
				language,
				self: isMine,
				onOpenProfile
			}) : null,
			tab === "recommendations" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkRecommendationsPanel, {
				profile,
				language,
				self: isMine
			}) : null,
			tab === "posts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-[11px] font-bold text-slate-200",
					children: isAr ? "منشورات علنية" : "Public posts"
				}), postsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					role: "status",
					className: "mt-1.5 flex items-center gap-2 text-[10px] text-slate-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "h-3.5 w-3.5 shrink-0 animate-spin",
						"aria-hidden": "true"
					}), isAr ? "جارٍ تحميل المنشورات…" : "Loading posts…"]
				}) : posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					"data-testid": "network-member-posts-empty",
					className: "mt-1.5 text-[10px] leading-relaxed text-slate-500",
					children: isAr ? "لا منشورات علنية بعد. المنشورات المخصّصة للأعضاء لا تظهر هنا — لا لغيرهم ولا هنا." : "No public posts yet. Members-only posts do not appear here — for anyone."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					"data-testid": "network-member-posts",
					className: "mt-1.5 space-y-2",
					children: posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-testid": "network-member-post",
						className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400",
									children: post.ndtMethod
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-slate-500",
									children: shortDate(post.createdAt, isAr)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-1 text-[11px] font-bold leading-snug text-white",
								children: post.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 line-clamp-3 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400",
								children: post.body
							})
						]
					}, post.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [backButton, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[9px] text-slate-600",
					children: isAr ? "الصفحة تُقرأ من بطاقتك المهنية نفسها — لا نسخة ثانية." : "This page reads your one professional card — there is no second copy."
				})]
			})
		]
	});
};
//#endregion
export { NetworkMemberProfile, NetworkMemberProfile as default };
