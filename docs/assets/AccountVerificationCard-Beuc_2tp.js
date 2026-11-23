import { t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { F as useSiteAccount, Kt as LogOut, jt as RefreshCw } from "./index-BKrODMj6.js";
import { v as formatFirebaseAuthError } from "./firestoreClientService-BUGkAdZ4.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var MailCheck = createLucideIcon("mail-check", [
	["path", {
		d: "M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8",
		key: "12jkf8"
	}],
	["path", {
		d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
		key: "1ocrg3"
	}],
	["path", {
		d: "m16 19 2 2 4-4",
		key: "1b14m6"
	}]
]);
//#endregion
//#region src/components/account/AccountVerificationCard.tsx
var import_jsx_runtime = require_jsx_runtime();
function AccountVerificationCard({ language, client = false }) {
	const account = useSiteAccount();
	const isAr = language === "ar";
	const { user, action, notice, checking, delivery, draft } = account;
	if (!user) return null;
	const failed = notice?.status === "error" || !notice && delivery?.status === "failed";
	const message = notice?.status === "error" ? formatFirebaseAuthError(notice.error, language) : notice?.status === "unverified" ? isAr ? "لم يكتمل تفعيل البريد بعد. افتح رابط التفعيل ثم حاول مرة أخرى." : "Email activation has not completed. Open the verification link and try again." : notice?.status === "resent" || delivery?.status === "sent" ? isAr ? "تم إرسال رابط التفعيل. راجع الوارد والبريد غير المرغوب فيه." : "Verification link sent. Check your inbox and spam folder." : delivery?.status === "failed" ? `${isAr ? "لم يُرسل رابط التفعيل." : "Verification email was not sent."} ${formatFirebaseAuthError(delivery.error, language)}` : delivery?.status === "sending" ? isAr ? "جارٍ إرسال رابط التفعيل…" : "Sending verification email…" : null;
	const controls = "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer disabled:cursor-wait disabled:opacity-50";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-2xl space-y-4 rounded-2xl border border-amber-500/40 bg-slate-900 p-5 sm:p-7",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-xs font-bold text-amber-300",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailCheck, {
					className: "h-4 w-4",
					"aria-hidden": "true"
				}), isAr ? "التحقّق من الحساب" : "Verify Your Account"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-black text-white",
				children: client ? isAr ? "أكد حسابك قبل استخدام بوابة العملاء" : "Verify your account to use the Client Portal" : isAr ? "فعّل حساب إنسكو الموحد" : "Verify your INSCO account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-slate-300",
				children: user.email ? isAr ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					"افتح رابط التفعيل في بريدك ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", {
						className: "break-all",
						children: user.email
					}),
					"، ثم اضغط «تحقق من التفعيل»."
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					"Open the verification link for ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", {
						className: "break-all",
						children: user.email
					}),
					", then select “Check verification”."
				] }) : isAr ? "أعد التحقق من الجلسة أو ادخل بالطريقة التي وثّقت بها حسابك." : "Check your session again or use the method you verified."
			}),
			draft && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-amber-200",
				children: isAr ? "لخصوصيتك، المسودة في ذاكرة التبويب فقط. افتح رابط التفعيل في تبويب آخر وارجع هنا قبل تحديث الصفحة أو إغلاقها." : "For your privacy the draft stays in this tab’s memory. Open the verification link separately and return here before reloading or closing the tab."
			}),
			message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: failed ? "alert" : "status",
				className: `text-xs ${failed ? "text-rose-200" : "text-emerald-200"}`,
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `${controls} bg-amber-500 text-slate-950`,
						disabled: Boolean(action || checking),
						onClick: () => void account.refreshVerification(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
							className: "h-3.5 w-3.5",
							"aria-hidden": "true"
						}), action === "refresh" || checking ? isAr ? "جارٍ التحقق…" : "Checking…" : isAr ? "تحقق من التفعيل" : "Check verification"]
					}),
					user.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${controls} border border-slate-700 text-slate-200`,
						disabled: Boolean(action || checking || delivery?.status === "sending"),
						onClick: () => void account.resendVerification(),
						children: isAr ? "أعد إرسال رابط التفعيل" : "Resend verification email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `${controls} border border-slate-700 text-slate-200`,
						disabled: Boolean(action),
						onClick: () => void account.signOut(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
							className: "h-3.5 w-3.5",
							"aria-hidden": "true"
						}), isAr ? "تسجيل الخروج" : "Sign Out"]
					})
				]
			})
		]
	});
}
//#endregion
export { AccountVerificationCard };
