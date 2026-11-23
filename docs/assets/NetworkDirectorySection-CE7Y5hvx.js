const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/firestoreClientService-BUGkAdZ4.js","assets/rolldown-runtime-oLLnCvco.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css","assets/index.esm-T7XjjJ2p.js","assets/config-BaEX8mXf.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as MapPin } from "./map-pin-CwI3o0GO.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Ot as Search, P as useOptionalSiteAccount, _t as UserPlus, gt as UserRound, ht as Users, mn as Check } from "./index-BKrODMj6.js";
import { t as NETWORK_AVAILABILITY } from "./networkProfileForm-DKDncrxG.js";
//#region src/components/network/NetworkDirectorySection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var availabilityLabel = (id, isAr) => {
	const found = NETWORK_AVAILABILITY.find((item) => item.id === id);
	if (!found) return null;
	return isAr ? found.ar : found.en;
};
/**
* `#network/people` — the real member directory.
*
* It reads the published community workspaces and nothing else. When there are
* no members yet it says so in words; it never pads the list with invented
* engineers, because a directory of fake experts is worse than an empty one.
*/
var NetworkDirectorySection = ({ language, onOpenAccount, onOpenProfile, onOpenMember, slowAfterMs = 8e3 }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [members, setMembers] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [slow, setSlow] = (0, import_react.useState)(false);
	const [attempt, setAttempt] = (0, import_react.useState)(0);
	const [term, setTerm] = (0, import_react.useState)("");
	const serviceReady = account?.available ?? false;
	const signedIn = Boolean(account?.user?.uid);
	const verified = account?.verified ?? false;
	const myUid = account?.user?.uid ?? null;
	/** Members already in my network, and my own card (the name a request carries). */
	const [connections, setConnections] = (0, import_react.useState)([]);
	const [myCard, setMyCard] = (0, import_react.useState)(null);
	const [connecting, setConnecting] = (0, import_react.useState)(null);
	const [connectError, setConnectError] = (0, import_react.useState)(null);
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
			stop = api.subscribeCommunityWorkspaces(false, (next) => {
				if (!active) return;
				setMembers(next);
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
	}, [
		serviceReady,
		attempt,
		slowAfterMs
	]);
	(0, import_react.useEffect)(() => {
		if (!serviceReady || !myUid) {
			setConnections([]);
			setMyCard(null);
			return;
		}
		let active = true;
		let stopConnections;
		let stopCard;
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stopConnections = api.subscribeMyConnections(myUid, (next) => {
				if (active) setConnections(next);
			}, () => {});
			stopCard = api.subscribeMyCommunityWorkspace(myUid, (next) => {
				if (active) setMyCard(next);
			}, () => {});
		}), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));
		return () => {
			active = false;
			stopConnections?.();
			stopCard?.();
		};
	}, [serviceReady, myUid]);
	const connect = (0, import_react.useCallback)(async (target) => {
		const user = account?.user;
		if (!user || !myCard || connecting) return;
		setConnecting(target.uid);
		setConnectError(null);
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]))).connectWithCommunityMember(user, myCard.displayName, {
				uid: target.uid,
				displayName: target.displayName
			});
		} catch (failure) {
			setConnectError(failure instanceof Error ? failure.message : String(failure));
		} finally {
			setConnecting(null);
		}
	}, [
		account?.user,
		connecting,
		myCard
	]);
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-directory-unavailable",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "h-4 w-4 shrink-0 text-violet-300",
				"aria-hidden": "true"
			}), isAr ? "دليل الأعضاء غير متاح في هذه النسخة" : "The member directory is not available in this build"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
			children: isAr ? "لم يُهيَّأ اتصال Firebase، لذلك لا يوجد أعضاء حقيقيون لعرضهم — ولن نعرض أسماء وهمية بدلاً منهم." : "Firebase is not initialised, so there are no real members to show — and we will not show invented names instead."
		})]
	});
	const needle = term.trim().toLowerCase();
	const visible = needle ? members.filter((member) => [
		member.displayName,
		member.headline,
		member.organizationName,
		member.sector,
		member.city,
		member.specialtyTrades
	].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle))) : members;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-directory-live",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-1.5 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: term,
						onChange: (event) => setTerm(event.target.value),
						"aria-label": isAr ? "البحث في الأعضاء" : "Search members",
						placeholder: isAr ? "ابحث بالاسم أو التخصص أو المدينة…" : "Search by name, discipline or city…",
						className: "min-w-0 flex-1 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex shrink-0 flex-wrap items-center gap-2",
					children: signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onOpenProfile,
						className: "inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
							className: "h-3.5 w-3.5 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "بطاقتي" : "My card"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onOpenAccount,
						className: "inline-flex items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
							className: "h-3.5 w-3.5 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "أضف بطاقتك" : "Add your card"]
					})
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
				children: isAr ? `تعذّر تحميل الدليل: ${error}` : `Could not load the directory: ${error}`
			}) : null,
			loading && slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "network-directory-slow",
				className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs font-bold text-amber-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
							className: "h-4 w-4 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "الاتصال بالتخزين بطيء أو محجوب" : "The store is slow or blocked"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] leading-relaxed text-amber-100/90",
						children: isAr ? "لم يصل أي عضو بعد. هذا ليس دليلاً فارغاً — بل اتصال لم يكتمل. أعد المحاولة، أو تحقق من اتصالك بالشبكة." : "No member has arrived yet. This is not an empty directory — it is an unfinished connection. Retry, or check your network."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setError(null);
							setAttempt((current) => current + 1);
						},
						className: "mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "h-3.5 w-3.5 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "إعادة المحاولة" : "Retry"]
					})
				]
			}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				role: "status",
				className: "flex items-center gap-2 p-3 text-[11px] text-slate-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "h-4 w-4 shrink-0 animate-spin",
					"aria-hidden": "true"
				}), isAr ? "جارٍ تحميل الأعضاء…" : "Loading members…"]
			}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "network-directory-empty",
				className: "rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
						className: "mx-auto h-6 w-6 text-slate-600",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs font-bold text-slate-300",
						children: needle ? isAr ? "لا نتائج مطابقة" : "No matching members" : isAr ? "لا يوجد أعضاء منشورون بعد" : "No published members yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500",
						children: needle ? isAr ? "جرّب كلمة أخرى، أو ابحث بالقطاع بدل الاسم." : "Try another word, or search by sector instead of a name." : isAr ? "الدليل يعرض البطاقات المنشورة فقط. أول بطاقة حقيقية تظهر هنا بمجرد حفظها وتأكيد البريد." : "The directory shows published cards only. The first real card appears here as soon as it is saved and the email is confirmed."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				"data-testid": "network-directory-list",
				className: "grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3",
				children: visible.map((member) => {
					const availability = availabilityLabel(member.availabilityStatus, isAr);
					const isMe = member.uid === myUid;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-testid": "network-member-card",
						className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-start gap-2",
								children: [member.photoURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: member.photoURL,
									alt: "",
									"data-testid": "network-member-card-photo",
									className: "h-9 w-9 shrink-0 rounded-full border border-violet-500/30 object-cover",
									loading: "lazy"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-bold text-violet-200",
									children: (member.displayName ?? "?").trim().charAt(0)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex min-w-0 items-center gap-1.5",
											children: [onOpenMember ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => onOpenMember(member.uid),
												"data-testid": "network-member-open",
												title: isAr ? "افتتح الصفحة العامة" : "Open the public page",
												className: "min-w-0 truncate text-start text-xs font-bold text-white underline-offset-2 transition cursor-pointer hover:text-violet-200 hover:underline",
												children: member.displayName
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "min-w-0 truncate text-xs font-bold text-white",
												children: member.displayName
											}), isMe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200",
												children: isAr ? "بطاقتك" : "You"
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "min-w-0 truncate text-[10px] text-slate-400",
											children: member.headline || member.organizationName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "min-w-0 truncate text-[10px] text-slate-500",
											children: member.organizationName
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1.5 flex flex-wrap items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
										children: member.sector
									}),
									member.city ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-0.5 rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
											className: "h-2.5 w-2.5 shrink-0",
											"aria-hidden": "true"
										}), member.city]
									}) : null,
									typeof member.yearsExperience === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300",
										children: isAr ? `${member.yearsExperience} سنة` : `${member.yearsExperience} yrs`
									}) : null,
									availability ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-200",
										children: availability
									}) : null
								]
							}),
							member.specialtyTrades ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-slate-400",
								children: member.specialtyTrades
							}) : null,
							member.certifications ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1.5 flex items-start gap-1 rounded border border-[#232345] bg-[#0b0b18] px-1.5 py-1 text-[9px] leading-relaxed text-slate-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									className: "mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-500",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0",
									children: [isAr ? "شهادات معلنة (غير مُتحقَّق منها): " : "Declared certifications (not verified): ", member.certifications]
								})]
							}) : null,
							!isMe ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap items-center gap-1.5",
								children: [connectedUids.has(member.uid) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									"data-testid": "network-connected-chip",
									className: "inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "h-3 w-3 shrink-0",
										"aria-hidden": "true"
									}), isAr ? "في شبكتك" : "In your network"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => void connect({
										uid: member.uid,
										displayName: member.displayName
									}),
									disabled: !signedIn || !verified || !myCard || connecting === member.uid,
									"aria-disabled": !signedIn || !verified || !myCard || connecting === member.uid,
									title: !signedIn ? isAr ? "سجّل الدخول لإضافة العضو إلى شبكتك" : "Sign in to add this member" : !verified ? isAr ? "أكّد بريدك أولاً" : "Confirm your email first" : !myCard ? isAr ? "أنشئ بطاقتك المهنية أولاً — الطلب يحمل اسمك" : "Create your card first — the request carries your name" : isAr ? "إضافة العضو إلى شبكتك" : "Add this member to your network",
									"data-testid": "network-connect",
									className: `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${signedIn && verified && myCard ? "border-violet-400/50 bg-violet-500/10 text-violet-200 cursor-pointer hover:border-violet-300" : "border-[#2a2a4d] bg-[#14142a] text-slate-500 opacity-70 cursor-not-allowed"}`,
									children: [connecting === member.uid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										className: "h-3 w-3 shrink-0 animate-spin",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, {
										className: "h-3 w-3 shrink-0",
										"aria-hidden": "true"
									}), isAr ? "أضف إلى شبكتي" : "Add to my network"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: true,
									"aria-disabled": "true",
									title: isAr ? "الرسائل تُفعّل في مرحلتها" : "Messages arrive in their own phase",
									className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-500 opacity-70 cursor-not-allowed",
									children: isAr ? "رسالة" : "Message"
								})]
							}) : null
						]
					}, member.uid);
				})
			})
		]
	});
};
//#endregion
export { NetworkDirectorySection, NetworkDirectorySection as default };
