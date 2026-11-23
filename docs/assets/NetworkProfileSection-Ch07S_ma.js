const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/profileMediaService-8tMLccz6.js","assets/index.esm-T7XjjJ2p.js","assets/rolldown-runtime-oLLnCvco.js","assets/config-BaEX8mXf.js","assets/networkProfileForm-DKDncrxG.js","assets/firestoreClientService-BUGkAdZ4.js","assets/index-BKrODMj6.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/shield-check-BseoenC-.js","assets/publicUrl-Caz80cHM.js","assets/preload-helper-B6u0oZm0.js","assets/index-2b7fG9FA.css"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { t as CircleAlert } from "./circle-alert-BqP2ljBW.js";
import { t as Linkedin } from "./linkedin-DZZtgKUO.js";
import { t as LoaderCircle } from "./loader-circle-BuW2oL63.js";
import { t as Save } from "./save-Bt8Ogdlf.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { t as Upload } from "./upload-CENY4Gxd.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { P as useOptionalSiteAccount, bt as Trash2, gn as Building2, gt as UserRound, qt as LogIn, wt as Sparkles } from "./index-BKrODMj6.js";
import { P as toggleSkill, S as NETWORK_SKILL_LIMITS, a as networkProfileCompleteness, b as NETWORK_SKILLS, c as NETWORK_MEDIA_LIMITS, d as bannerSpecFor, f as canGenerateBanner, i as draftFromProfile, k as parseSkills, l as NETWORK_PROFILE_VISIBILITY, m as initialsOf, n as NETWORK_PROFILE_LIMITS, o as toWorkspaceWrite, r as NETWORK_SECTORS, s as validateNetworkProfileDraft, t as NETWORK_AVAILABILITY, x as NETWORK_SKILL_GROUPS } from "./networkProfileForm-DKDncrxG.js";
import { t as BadgeCheck } from "./NetworkPortal-DhOewca2.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ImagePlus = createLucideIcon("image-plus", [
	["path", {
		d: "M16 5h6",
		key: "1vod17"
	}],
	["path", {
		d: "M19 2v6",
		key: "4bpg5p"
	}],
	["path", {
		d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",
		key: "1ue2ih"
	}],
	["path", {
		d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
		key: "1xmnt7"
	}],
	["circle", {
		cx: "9",
		cy: "9",
		r: "2",
		key: "af1f0g"
	}]
]);
//#endregion
//#region src/network/bannerCanvas.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var FONT_STACK = "\"Tajawal\", \"Segoe UI\", \"Noto Kufi Arabic\", system-ui, sans-serif";
function drawBanner(ctx, spec) {
	const { width, height, palette, rtl } = spec;
	const padding = Math.round(width * .05);
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, palette.from);
	gradient.addColorStop(1, palette.to);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
	ctx.save();
	ctx.globalAlpha = .12;
	ctx.strokeStyle = palette.accent;
	ctx.lineWidth = 1;
	const step = Math.round(width / 24);
	for (let x = 0; x < width; x += step) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x + height, height);
		ctx.stroke();
	}
	ctx.restore();
	ctx.save();
	ctx.globalAlpha = .9;
	ctx.fillStyle = palette.accent;
	const sweepX = rtl ? 0 : width - Math.round(width * .18);
	ctx.fillRect(sweepX, 0, Math.round(width * .18), Math.round(height * .045));
	ctx.restore();
	const avatarRadius = Math.round(height * .19);
	const avatarX = rtl ? width - padding - avatarRadius : padding + avatarRadius;
	const avatarY = Math.round(height * .42);
	ctx.save();
	ctx.beginPath();
	ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(255,255,255,0.10)";
	ctx.fill();
	ctx.lineWidth = Math.max(3, Math.round(height * .012));
	ctx.strokeStyle = palette.accent;
	ctx.stroke();
	ctx.fillStyle = palette.ink;
	ctx.font = `700 ${Math.round(avatarRadius * .78)}px ${FONT_STACK}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.direction = rtl ? "rtl" : "ltr";
	ctx.fillText(spec.initials, avatarX, avatarY + Math.round(avatarRadius * .04));
	ctx.restore();
	const textEdge = rtl ? avatarX - avatarRadius - Math.round(width * .035) : avatarX + avatarRadius + Math.round(width * .035);
	ctx.save();
	ctx.direction = rtl ? "rtl" : "ltr";
	ctx.textAlign = rtl ? "right" : "left";
	ctx.textBaseline = "alphabetic";
	ctx.fillStyle = palette.ink;
	const nameSize = Math.round(height * .145);
	const nameY = spec.headlineLines.length > 0 ? Math.round(height * .4) : Math.round(height * .52);
	ctx.font = `700 ${nameSize}px ${FONT_STACK}`;
	ctx.fillText(truncate(ctx, spec.name, width - padding * 2 - avatarRadius * 2), textEdge, nameY);
	let cursor = nameY + Math.round(height * .1);
	if (spec.headlineLines.length > 0) {
		ctx.font = `500 ${Math.round(height * .062)}px ${FONT_STACK}`;
		ctx.globalAlpha = .92;
		for (const line of spec.headlineLines) {
			ctx.fillText(line, textEdge, cursor);
			cursor += Math.round(height * .075);
		}
	}
	if (spec.metaLine !== "") {
		ctx.globalAlpha = .8;
		ctx.font = `400 ${Math.round(height * .052)}px ${FONT_STACK}`;
		ctx.fillStyle = palette.accent;
		ctx.fillText(truncate(ctx, spec.metaLine, width - padding * 2), textEdge, Math.min(cursor, Math.round(height * .86)));
	}
	ctx.globalAlpha = .7;
	ctx.fillStyle = palette.ink;
	ctx.font = `600 ${Math.round(height * .045)}px ${FONT_STACK}`;
	ctx.textAlign = rtl ? "left" : "right";
	ctx.fillText(spec.brand, rtl ? padding : width - padding, height - Math.round(height * .07));
	ctx.restore();
}
/** Canvas has no wrapping for a single line; shorten with an ellipsis instead of clipping. */
function truncate(ctx, text, maxWidth) {
	if (text === "") return text;
	if (ctx.measureText(text).width <= maxWidth) return text;
	let result = text;
	while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) result = result.slice(0, -1);
	return `${result.trim()}…`;
}
/**
* Draw the banner and hand back a JPEG.
*
* Returns `null` when the environment cannot draw (no `document`, no 2D context, or
* no `toBlob`) — the caller then explains that banner generation needs a browser
* instead of uploading a blank image.
*/
async function renderBannerBlob(spec) {
	if (typeof document === "undefined") return null;
	const canvas = document.createElement("canvas");
	canvas.width = spec.width;
	canvas.height = spec.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	drawBanner(ctx, spec);
	if (typeof canvas.toBlob !== "function") return null;
	return await new Promise((resolve) => {
		canvas.toBlob((blob) => resolve(blob), "image/jpeg", .92);
	});
}
//#endregion
//#region src/components/network/NetworkIdentityFields.tsx
var import_jsx_runtime = require_jsx_runtime();
var fieldClass$1 = "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none";
/**
* Photo, banner, LinkedIn and audience — the parts of the card that only exist for
* the public page.
*
* Three honest routes for a banner: upload one, generate one from the card, or paste
* a link. Uploading needs Firebase Storage; when it is not provisioned the button
* says so, and generating still works — the banner is drawn in the browser and can be
* downloaded, instead of a silent failure that looks like a broken feature.
*/
var NetworkIdentityFields = ({ language, draft, user, uploadEnabled, errors, onChange }) => {
	const isAr = language === "ar";
	const [status, setStatus] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [downloadUrl, setDownloadUrl] = (0, import_react.useState)(null);
	const photoInput = (0, import_react.useRef)(null);
	const bannerInput = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => () => {
		if (downloadUrl) URL.revokeObjectURL(downloadUrl);
	}, [downloadUrl]);
	const upload = (0, import_react.useCallback)(async (kind, file) => {
		if (!user) {
			setStatus({
				tone: "error",
				text: isAr ? "سجّل الدخول أولاً." : "Sign in first."
			});
			return;
		}
		setBusy(kind);
		setStatus({
			tone: "busy",
			text: isAr ? "جارٍ الرفع…" : "Uploading…"
		});
		try {
			const url = await (await __vitePreload(() => import("./profileMediaService-8tMLccz6.js"), __vite__mapDeps([0,1,2,3,4]))).uploadProfileImage(user, kind, file);
			onChange(kind === "photo" ? "photoURL" : "bannerURL", url);
			setStatus({
				tone: "ok",
				text: isAr ? "تم الرفع — احفظ البطاقة لتثبيت الصورة." : "Uploaded — save the card to keep it."
			});
		} catch (error) {
			const message = error instanceof (await __vitePreload(() => import("./profileMediaService-8tMLccz6.js"), __vite__mapDeps([0,1,2,3,4]))).MediaUploadError ? isAr ? error.ar : error.en : isAr ? "تعذّر الرفع." : "Upload failed.";
			setStatus({
				tone: "error",
				text: message
			});
		} finally {
			setBusy(null);
		}
	}, [
		isAr,
		onChange,
		user
	]);
	const generate = (0, import_react.useCallback)(async () => {
		if (!canGenerateBanner(draft)) {
			setStatus({
				tone: "error",
				text: isAr ? "اكتب اسمك أولاً ليُبنى البانر عليه." : "Enter your name first; the banner is built from it."
			});
			return;
		}
		setBusy("generate");
		setStatus({
			tone: "busy",
			text: isAr ? "جارٍ توليد البانر…" : "Generating the banner…"
		});
		try {
			const blob = await renderBannerBlob(bannerSpecFor(draft, isAr ? "ar" : "en"));
			if (!blob) {
				setStatus({
					tone: "error",
					text: isAr ? "هذا المتصفح لا يدعم رسم الصور. ارفع بانراً جاهزاً بدلاً منه." : "This browser cannot draw images. Upload a ready banner instead."
				});
				return;
			}
			if (uploadEnabled && user) {
				const api = await __vitePreload(() => import("./profileMediaService-8tMLccz6.js"), __vite__mapDeps([0,1,2,3,4]));
				const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
				onChange("bannerURL", await api.uploadProfileImage(user, "banner", file));
				setStatus({
					tone: "ok",
					text: isAr ? "وُلِّد البانر ورُفع. احفظ البطاقة." : "Banner generated and uploaded. Save the card."
				});
			} else {
				const objectUrl = URL.createObjectURL(blob);
				setDownloadUrl(objectUrl);
				setStatus({
					tone: "ok",
					text: isAr ? "تخزين الصور غير مهيّأ، لذلك ولّدنا البانر للتنزيل. انشره أو ارفعه بعد تفعيل التخزين." : "Image storage is not provisioned, so the banner was generated for download. Publish or upload it once storage is enabled."
				});
			}
		} catch (error) {
			const message = error instanceof (await __vitePreload(() => import("./profileMediaService-8tMLccz6.js"), __vite__mapDeps([0,1,2,3,4]))).MediaUploadError ? isAr ? error.ar : error.en : isAr ? "تعذّر التوليد." : "Generation failed.";
			setStatus({
				tone: "error",
				text: message
			});
		} finally {
			setBusy(null);
		}
	}, [
		draft,
		isAr,
		onChange,
		uploadEnabled,
		user
	]);
	const remove = (kind) => {
		onChange(kind === "photo" ? "photoURL" : "bannerURL", "");
		setStatus({
			tone: "ok",
			text: isAr ? "أُزيلت الصورة من البطاقة — احفظ لتثبيت ذلك." : "Removed from the card — save to keep it."
		});
	};
	const pickFile = (kind) => (event) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) upload(kind, file);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "network-identity-fields",
		className: "min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
				className: "flex items-center gap-1.5 text-[11px] font-bold text-slate-200",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
					className: "h-3.5 w-3.5 shrink-0 text-violet-300",
					"aria-hidden": "true"
				}), isAr ? "هويتك على صفحتك العامة" : "Your public-page identity"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] font-bold text-slate-400",
						children: isAr ? "البانر" : "Banner"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative mt-1 overflow-hidden rounded-lg border border-[#2a2a4d]",
						style: { aspectRatio: `${NETWORK_MEDIA_LIMITS.bannerWidth} / ${NETWORK_MEDIA_LIMITS.bannerHeight}` },
						children: draft.bannerURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: draft.bannerURL,
							alt: isAr ? "بانر الملف" : "Profile banner",
							"data-testid": "network-identity-banner",
							className: "h-full w-full object-cover",
							loading: "lazy"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-[#120b2e] via-[#241a4d] to-[#3b1d7a]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-2 text-[10px] text-violet-200/80",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/60 text-[10px] font-bold text-violet-100",
									children: initialsOf(draft.displayName)
								}), isAr ? "لا بانر بعد — ولّد واحداً أو ارفع صورة" : "No banner yet — generate one or upload an image"]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => bannerInput.current?.click(),
								disabled: busy !== null,
								className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
								children: [busy === "banner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3 w-3 shrink-0 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "رفع بانر" : "Upload a banner"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void generate(),
								disabled: busy !== null,
								"data-testid": "network-generate-banner",
								className: "inline-flex items-center gap-1 rounded-md border border-violet-400/50 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60",
								children: [busy === "generate" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3 w-3 shrink-0 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "توليد بانر احترافي" : "Generate a banner"]
							}),
							draft.bannerURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => remove("banner"),
								className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-400 transition cursor-pointer hover:border-rose-400/50 hover:text-rose-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "إزالة" : "Remove"]
							}) : null,
							downloadUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: downloadUrl,
								download: "insco-banner.jpg",
								"data-testid": "network-banner-download",
								className: "inline-flex items-center gap-1 rounded-md border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200",
								children: isAr ? "تنزيل البانر" : "Download the banner"
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: bannerInput,
						type: "file",
						accept: NETWORK_MEDIA_LIMITS.acceptedTypes.join(","),
						onChange: pickFile("banner"),
						className: "hidden",
						"aria-hidden": "true",
						tabIndex: -1
					}),
					errors.get("bannerURL") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "mt-1 text-[10px] text-rose-300",
						children: errors.get("bannerURL")
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2.5 grid min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative",
							children: draft.photoURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: draft.photoURL,
								alt: isAr ? "صورتك الشخصية" : "Your photo",
								"data-testid": "network-identity-photo",
								className: "h-14 w-14 rounded-full border-2 border-violet-400/60 object-cover",
								loading: "lazy"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#3a3a5d] text-[13px] font-bold text-slate-400",
								children: initialsOf(draft.displayName)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => photoInput.current?.click(),
								disabled: busy !== null,
								className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
								children: [busy === "photo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "h-3 w-3 shrink-0 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "صورة شخصية" : "Profile photo"]
							}), draft.photoURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => remove("photo"),
								className: "inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-400 transition cursor-pointer hover:border-rose-400/50 hover:text-rose-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "h-3 w-3 shrink-0",
									"aria-hidden": "true"
								}), isAr ? "إزالة" : "Remove"]
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: photoInput,
							type: "file",
							accept: NETWORK_MEDIA_LIMITS.acceptedTypes.join(","),
							onChange: pickFile("photo"),
							className: "hidden",
							"aria-hidden": "true",
							tabIndex: -1
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-[10px] font-bold text-slate-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Linkedin, {
								className: "h-3 w-3 shrink-0 text-sky-300",
								"aria-hidden": "true"
							}), isAr ? "رابط LinkedIn (اختياري)" : "LinkedIn URL (optional)"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: draft.linkedInUrl,
							onChange: (event) => onChange("linkedInUrl", event.target.value),
							maxLength: NETWORK_MEDIA_LIMITS.urlMax,
							dir: "ltr",
							className: `${fieldClass$1} mt-0.5`,
							placeholder: "https://www.linkedin.com/in/your-name",
							"aria-label": isAr ? "رابط LinkedIn" : "LinkedIn URL"
						}),
						errors.get("linkedInUrl") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "mt-0.5 text-[10px] text-rose-300",
							children: errors.get("linkedInUrl")
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[9px] text-slate-500",
							children: isAr ? "يظهر كزر على صفحتك العامة — نقبل linkedin.com فقط." : "Shown as a button on your page — LinkedIn hosts only."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-2 rounded border border-[#232345] bg-[#101024] px-2 py-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer text-[10px] font-bold text-slate-400",
					children: isAr ? "أو الصق رابط صورة جاهز" : "Or paste an image link"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1.5 grid min-w-0 gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: draft.photoURL,
							onChange: (event) => onChange("photoURL", event.target.value),
							dir: "ltr",
							className: fieldClass$1,
							placeholder: "https://…/photo.jpg",
							"aria-label": isAr ? "رابط الصورة الشخصية" : "Photo URL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: draft.bannerURL,
							onChange: (event) => onChange("bannerURL", event.target.value),
							dir: "ltr",
							className: fieldClass$1,
							placeholder: "https://…/banner.jpg",
							"aria-label": isAr ? "رابط البانر" : "Banner URL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[9px] leading-relaxed text-slate-500",
							children: isAr ? `روابط https فقط، وألا تتجاوز ${NETWORK_MEDIA_LIMITS.urlMax} حرفاً — القواعد ترفض غير ذلك.` : `HTTPS links only, at most ${NETWORK_MEDIA_LIMITS.urlMax} characters — the rules reject anything else.`
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "mt-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "text-[10px] font-bold text-slate-400",
					children: isAr ? "من يرى صفحتك العامة؟" : "Who can open your page?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 grid min-w-0 gap-1 sm:grid-cols-2",
					children: NETWORK_PROFILE_VISIBILITY.map((option) => {
						const checked = draft.profileVisibility === option.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: `flex min-w-0 cursor-pointer items-start gap-1.5 rounded-lg border p-1.5 text-[10px] leading-relaxed transition ${checked ? "border-violet-400/60 bg-violet-500/10 text-slate-200" : "border-[#2a2a4d] bg-[#101024] text-slate-400 hover:border-violet-400/40"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "radio",
								name: "np-visibility",
								value: option.id,
								checked,
								onChange: () => onChange("profileVisibility", option.id),
								className: "mt-0.5 h-3 w-3 shrink-0 accent-violet-500",
								"data-testid": `network-visibility-${option.id}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-bold",
									children: isAr ? option.ar : option.en
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[9px] text-slate-500",
									children: isAr ? option.hintAr : option.hintEn
								})]
							})]
						}, option.id);
					})
				})]
			}),
			!uploadEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 flex items-start gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] leading-relaxed text-amber-100",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
					className: "mt-0.5 h-3 w-3 shrink-0",
					"aria-hidden": "true"
				}), isAr ? "رفع الصور يحتاج تهيئة Firebase Storage — لم تُهيَّأ في هذه النسخة، لذلك الرفع معطّل بصراحة. التوليد والروابط تعمل." : "Image upload needs Firebase Storage, which is not provisioned in this build, so uploads are plainly disabled. Generation and links still work."]
			}) : null,
			status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: status.tone === "error" ? "alert" : "status",
				"data-testid": "network-identity-status",
				className: `mt-2 text-[10px] leading-relaxed ${status.tone === "error" ? "text-rose-300" : status.tone === "ok" ? "text-emerald-300" : "text-slate-400"}`,
				children: status.text
			}) : null
		]
	});
};
//#endregion
//#region src/components/network/NetworkProfileSection.tsx
var fieldClass = "w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none";
var labelClass = "block text-[10px] font-bold text-slate-400";
/**
* `#network/profile` — the member's real professional card.
*
* The card is the site's existing public community workspace document, written
* through its existing service and rules; this screen is a second, friendlier
* front door to the same record. Every state is explicit — no session, no
* verified email, no Firebase, no card yet, saved — because the honest answer to
* "where is my profile?" must never be an empty card that looks real.
*/
var NetworkProfileSection = ({ language, onOpenAccount }) => {
	const account = useOptionalSiteAccount();
	const isAr = language === "ar";
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(() => draftFromProfile(null));
	const [touched, setTouched] = (0, import_react.useState)(false);
	const [skillLimitHit, setSkillLimitHit] = (0, import_react.useState)(false);
	const selectedSkills = parseSkills(draft.skills);
	const [save, setSave] = (0, import_react.useState)({ status: "idle" });
	const [uploadEnabled, setUploadEnabled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let active = true;
		__vitePreload(() => import("./profileMediaService-8tMLccz6.js").then((api) => {
			if (active) setUploadEnabled(api.isMediaUploadAvailable());
		}), __vite__mapDeps([0,1,2,3,4]));
		return () => {
			active = false;
		};
	}, []);
	const uid = account?.user?.uid ?? null;
	const signedIn = Boolean(uid);
	const verified = account?.verified ?? false;
	const serviceReady = account?.available ?? false;
	(0, import_react.useEffect)(() => {
		setProfile(null);
		setDraft(draftFromProfile(null));
		setTouched(false);
		setSave({ status: "idle" });
		setLoadError(null);
		if (!uid || !serviceReady) return;
		let active = true;
		setLoading(true);
		let stop;
		__vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g).then((api) => {
			if (!active) return;
			stop = api.subscribeMyCommunityWorkspace(uid, (next) => {
				if (!active) return;
				setProfile(next);
				setDraft((current) => touched ? current : draftFromProfile(next));
				setLoading(false);
			}, (error) => {
				if (!active) return;
				setLoadError(error.message);
				setLoading(false);
			});
		}), __vite__mapDeps([5,2,6,7,8,9,10,11,12,1,3]));
		return () => {
			active = false;
			stop?.();
		};
	}, [uid, serviceReady]);
	const errors = (0, import_react.useMemo)(() => validateNetworkProfileDraft(draft), [draft]);
	const errorsByField = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const error of errors) if (!map.has(error.field)) map.set(error.field, isAr ? error.ar : error.en);
		return map;
	}, [errors, isAr]);
	const completeness = (0, import_react.useMemo)(() => networkProfileCompleteness(draft), [draft]);
	const update = (0, import_react.useCallback)((key, value) => {
		setTouched(true);
		setSave((current) => current.status === "saved" ? { status: "idle" } : current);
		setDraft((current) => ({
			...current,
			[key]: value
		}));
	}, []);
	const submit = (0, import_react.useCallback)(async (event) => {
		event.preventDefault();
		setTouched(true);
		const user = account?.user;
		if (!user) return;
		if (errors.length > 0) return;
		setSave({ status: "saving" });
		try {
			await (await __vitePreload(() => import("./firestoreClientService-BUGkAdZ4.js").then((n) => n.g), __vite__mapDeps([5,2,6,7,8,9,10,11,12,1,3]))).upsertCommunityWorkspace(user, toWorkspaceWrite(draft, profile), profile);
			setSave({ status: "saved" });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			setSave({
				status: "error",
				message: isAr ? `لم يتم الحفظ: ${message}` : `Not saved: ${message}`
			});
		}
	}, [
		account?.user,
		draft,
		errors.length,
		isAr,
		profile
	]);
	if (!serviceReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notice, {
		tone: "neutral",
		testId: "network-profile-service-unavailable",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
			className: "h-4 w-4 shrink-0",
			"aria-hidden": "true"
		}),
		titleAr: "التسجيل غير متاح في هذه النسخة",
		titleEn: "Accounts are not available in this build",
		bodyAr: "لم يُهيَّأ اتصال Firebase هنا، لذلك لا يمكن إنشاء ملف مهني حقيقي. لن نعرض لك ملفاً وهمياً بدلاً منه.",
		bodyEn: "Firebase is not initialised here, so no real professional card can be created. We will not show you a fake one instead."
	});
	if (!account?.ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-profile-checking",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			role: "status",
			className: "flex items-center gap-2 text-[11px] text-slate-400",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "h-4 w-4 shrink-0 animate-spin",
				"aria-hidden": "true"
			}), isAr ? "جارٍ التحقق من جلسة حسابك…" : "Checking your account session…"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 text-[10px] leading-relaxed text-slate-500",
			children: isAr ? "إذا استمر هذا، أعد تحميل الصفحة أو تحقق من اتصالك — لن نعرض بطاقة بالنيابة عنك." : "If this persists, reload the page or check your connection — we will not show a card on your behalf."
		})]
	});
	if (!signedIn) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-profile-signed-out",
		className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-sm font-bold text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
					className: "h-4 w-4 shrink-0 text-violet-300",
					"aria-hidden": "true"
				}), isAr ? "ملفك المهني يبدأ بحساب" : "Your professional card starts with an account"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
				children: isAr ? "الشبكة تستخدم حساب إنسكو الموحّد نفسه — لا حساب ثانٍ للشبكة. سجّل الدخول ثم املأ بطاقتك: المسمّى، التخصص، سنوات الخبرة، والشهادات كإقرار غير موثّق حتى تُراجَع." : "The network uses the same unified INSCO account — no second account. Sign in, then fill your card: headline, discipline, years of experience, and certificates as an unverified claim until reviewed."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onOpenAccount("signin"),
				className: "mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, {
					className: "h-3.5 w-3.5 shrink-0",
					"aria-hidden": "true"
				}), isAr ? "تسجيل الدخول / إنشاء حساب" : "Sign in / create account"]
			})
		]
	});
	if (!verified) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-profile-unverified",
		className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-sm font-bold text-amber-200",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
					className: "h-4 w-4 shrink-0",
					"aria-hidden": "true"
				}), isAr ? "أكّد بريدك أولاً" : "Confirm your email first"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-amber-100/90",
				children: isAr ? "قواعد الحماية لا تسمح بحفظ البطاقة قبل تأكيد البريد — لتظل الشبكة لأشخاص يمكن الوصول إليهم فعلاً. التأكيد يتم من «حسابي»." : "The security rules refuse to save a card before the email is confirmed, so the network stays reachable. Confirmation happens in “My account”."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onOpenAccount("account"),
				className: "mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
					className: "h-3.5 w-3.5 shrink-0",
					"aria-hidden": "true"
				}), isAr ? "فتح حسابي" : "Open my account"]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-profile-live",
		className: "grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "flex items-center gap-1.5 text-xs font-bold text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
							className: "h-4 w-4 shrink-0 text-violet-300",
							"aria-hidden": "true"
						}), profile ? isAr ? "تحديث بطاقتك المهنية" : "Update your professional card" : isAr ? "إنشاء بطاقتك المهنية" : "Create your professional card"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] text-slate-500",
						children: isAr ? `اكتمال البطاقة ${completeness.percent}%` : `Card completeness ${completeness.percent}%`
					})]
				}),
				loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200",
					children: isAr ? `تعذّر تحميل بطاقتك: ${loadError}` : `Could not load your card: ${loadError}`
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid min-w-0 gap-2 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "الاسم الكامل" : "Full name",
							error: errorsByField.get("displayName"),
							htmlFor: "np-name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-name",
								className: fieldClass,
								value: draft.displayName,
								onChange: (event) => update("displayName", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.displayNameMax,
								autoComplete: "name"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "جهة العمل (أو «مستقل»)" : "Employer (or “Independent”)",
							error: errorsByField.get("organizationName"),
							htmlFor: "np-org",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-org",
								className: fieldClass,
								value: draft.organizationName,
								onChange: (event) => update("organizationName", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.organizationMax,
								autoComplete: "organization"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "المسمّى المهني" : "Professional headline",
							error: errorsByField.get("headline"),
							htmlFor: "np-headline",
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-headline",
								className: fieldClass,
								value: draft.headline,
								onChange: (event) => update("headline", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.headlineMax,
								placeholder: isAr ? "مثال: مفتش PAUT/TOFD — المستوى II" : "e.g. PAUT/TOFD inspector — Level II"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "القطاع" : "Sector",
							error: errorsByField.get("sector"),
							htmlFor: "np-sector",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "np-sector",
								className: fieldClass,
								value: draft.sector,
								onChange: (event) => update("sector", event.target.value),
								children: NETWORK_SECTORS.map((sector) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: sector,
									children: sector
								}, sector))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "المدينة" : "City",
							error: errorsByField.get("city"),
							htmlFor: "np-city",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-city",
								className: fieldClass,
								value: draft.city,
								onChange: (event) => update("city", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.cityMax
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "التخصصات والطرق" : "Specialities and methods",
							error: errorsByField.get("specialtyTrades"),
							htmlFor: "np-specialties",
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-specialties",
								className: fieldClass,
								value: draft.specialtyTrades,
								onChange: (event) => update("specialtyTrades", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.specialtyMax,
								placeholder: isAr ? "UT · PAUT/TOFD · RT · فحص لحام" : "UT · PAUT/TOFD · RT · weld inspection"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "الشهادات (إقرار غير موثّق)" : "Certifications (an unverified claim)",
							error: errorsByField.get("certifications"),
							htmlFor: "np-certs",
							className: "sm:col-span-2",
							hint: isAr ? "تُعرض كإقرار منك، ولا تُوسم «مُتحقَّقة» قبل مراجعة جهة الإصدار." : "Shown as your claim, never badged “verified” before the issuer is checked.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-certs",
								className: fieldClass,
								value: draft.certifications,
								onChange: (event) => update("certifications", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.certificationsMax,
								placeholder: "ASNT UT II · ISO 9712 RT II"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "سنوات الخبرة" : "Years of experience",
							error: errorsByField.get("yearsExperience"),
							htmlFor: "np-years",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "np-years",
								className: fieldClass,
								inputMode: "numeric",
								value: draft.yearsExperience,
								onChange: (event) => update("yearsExperience", event.target.value.replace(/[^\d]/g, "")),
								maxLength: 2
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "حالة التفرّغ" : "Availability",
							error: errorsByField.get("availabilityStatus"),
							htmlFor: "np-availability",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "np-availability",
								className: fieldClass,
								value: draft.availabilityStatus,
								onChange: (event) => update("availabilityStatus", event.target.value),
								children: NETWORK_AVAILABILITY.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: item.id,
									children: isAr ? item.ar : item.en
								}, item.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Labelled, {
							label: isAr ? "نبذة" : "Bio",
							error: errorsByField.get("bio"),
							htmlFor: "np-bio",
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "np-bio",
								className: `${fieldClass} resize-none`,
								rows: 3,
								value: draft.bio,
								onChange: (event) => update("bio", event.target.value),
								maxLength: NETWORK_PROFILE_LIMITS.bioMax
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 sm:col-span-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-1 flex flex-wrap items-center justify-between gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-bold text-slate-200",
										children: isAr ? "المهارات" : "Skills"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-slate-500",
										children: isAr ? `${selectedSkills.length}/${NETWORK_SKILL_LIMITS.maxSkills} — تزكيات الزملاء لا تُعدّ شهادات` : `${selectedSkills.length}/${NETWORK_SKILL_LIMITS.maxSkills} — peer endorsements, not certificates`
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-1.5 text-[10px] leading-relaxed text-slate-500",
									children: isAr ? "اختر من القائمة المغلقة حتى يجدك بقية الأعضاء بنفس المفردات. المهارة إقرار منك، والتزكية رأي زميل — ولا واحدة منهما شهادة موثّقة." : "Pick from the closed list so members can find you with the same vocabulary. A skill is your claim, an endorsement is a colleague’s word — neither is a verified certificate."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "min-w-0 space-y-1.5",
									children: NETWORK_SKILL_GROUPS.map((group) => {
										const groupSkills = NETWORK_SKILLS.filter((skill) => skill.group === group.id);
										if (groupSkills.length === 0) return null;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mb-1 text-[10px] font-bold text-slate-400",
												children: isAr ? group.ar : group.en
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex min-w-0 flex-wrap gap-1",
												children: groupSkills.map((skill) => {
													const active = selectedSkills.includes(skill.id);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														"data-testid": `np-skill-${skill.id}`,
														"aria-pressed": active,
														onClick: () => {
															const next = toggleSkill(draft.skills, skill.id);
															update("skills", next.value);
															setSkillLimitHit(next.rejected === "limit");
														},
														className: `min-w-0 rounded-full border px-2 py-0.5 text-[10px] transition ${active ? "border-violet-400/60 bg-violet-500/20 text-violet-100" : "border-[#2b2b52] bg-[#0f0f22] text-slate-300 hover:border-violet-400/40 hover:text-violet-100"}`,
														children: isAr ? skill.ar : skill.en
													}, skill.id);
												})
											})]
										}, group.id);
									})
								}),
								skillLimitHit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									role: "status",
									className: "mt-1 text-[10px] text-amber-300",
									children: isAr ? `الحد ${NETWORK_SKILL_LIMITS.maxSkills} مهارة — أزل واحدة قبل الإضافة.` : `The limit is ${NETWORK_SKILL_LIMITS.maxSkills} skills — remove one first.`
								}) : null
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkIdentityFields, {
						language,
						draft,
						user: account?.user ?? null,
						uploadEnabled,
						errors: errorsByField,
						onChange: update
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-2 flex items-center gap-2 text-[11px] text-slate-300",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: draft.isPublished,
						onChange: (event) => update("isPublished", event.target.checked),
						className: "h-3.5 w-3.5 shrink-0 accent-violet-500"
					}), isAr ? "إظهار البطاقة في دليل الأعضاء (يمكن إخفاؤها في أي وقت)" : "Show this card in the member directory (you can hide it any time)"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2.5 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "submit",
							disabled: save.status === "saving" || errors.length > 0,
							className: "inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
							children: [save.status === "saving" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								className: "h-3.5 w-3.5 shrink-0 animate-spin",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
								className: "h-3.5 w-3.5 shrink-0",
								"aria-hidden": "true"
							}), profile ? isAr ? "حفظ التعديلات" : "Save changes" : isAr ? "إنشاء البطاقة" : "Create the card"]
						}),
						touched && errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							role: "alert",
							className: "text-[10px] text-rose-300",
							children: isAr ? `أكمل ${errors.length} حقلاً قبل الحفظ.` : `Complete ${errors.length} field(s) before saving.`
						}) : null,
						save.status === "saved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							role: "status",
							className: "text-[10px] font-bold text-emerald-300",
							children: isAr ? "تم الحفظ في حسابك." : "Saved to your account."
						}) : null,
						save.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							role: "alert",
							className: "text-[10px] text-rose-300",
							children: save.message
						}) : null
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-[#232345] bg-[#0f0f22] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
					className: "flex items-center gap-1.5 text-[11px] font-bold text-slate-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
						className: "h-3.5 w-3.5 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), isAr ? "حالة البطاقة" : "Card status"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-1.5 space-y-1 text-[10px] text-slate-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: isAr ? `منشورة: ${draft.isPublished ? "نعم" : "لا"}` : `Published: ${draft.isPublished ? "yes" : "no"}` }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: loading ? isAr ? "جارٍ التحميل…" : "Loading…" : isAr ? "مزامنة مع حسابك" : "Synced with your account" }),
						completeness.missingAr.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-slate-500",
							children: isAr ? `ناقص: ${completeness.missingAr.join(" · ")}` : `Missing: ${completeness.missingEn.join(" · ")}`
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-emerald-300",
							children: isAr ? "البطاقة مكتملة." : "The card is complete."
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[10px] leading-relaxed text-emerald-100",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
						className: "h-3.5 w-3.5 shrink-0",
						"aria-hidden": "true"
					}), isAr ? "الفرق الذي لا نخلطه" : "The difference we do not blur"]
				}), isAr ? "إقرارك بالشهادة شيء، والتحقق منها شيء آخر: لا شارة «مؤهل مُتحقَّق» تظهر من هنا، بل من مراجعة يدوية لجهة الإصدار في مسار التحقق." : "Your claim is one thing, verification another: no “credential verified” badge appears from this form, only from a manual check with the issuer in the verification track."]
			})]
		})]
	});
};
var Labelled = ({ label, htmlFor, error, hint, className = "", children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: `min-w-0 ${className}`,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			htmlFor,
			className: labelClass,
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5",
			children
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-0.5 text-[10px] text-rose-300",
			children: error
		}) : hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-0.5 text-[10px] text-slate-500",
			children: hint
		}) : null
	]
});
var Notice = ({ tone, testId, icon, titleAr, titleEn, bodyAr, bodyEn }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	"data-testid": testId,
	className: `rounded-xl border p-4 ${tone === "warning" ? "border-amber-500/30 bg-amber-500/10" : "border-[#232345] bg-[#0f0f22]"}`,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-bold text-white",
			children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0",
				children: titleAr === titleEn ? titleAr : `${titleAr}`
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400",
			children: bodyAr
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-500",
			dir: "ltr",
			children: bodyEn
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: titleEn
		})
	]
});
//#endregion
export { NetworkProfileSection, NetworkProfileSection as default };
