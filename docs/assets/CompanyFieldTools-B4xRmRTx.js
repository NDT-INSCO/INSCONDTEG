import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as Clock } from "./clock-B9C0lWAm.js";
import { c as isValidCompanyIdSlug, d as FolderOpen, i as buildCompanyDossierUrl, l as sanitizeCompanyIdSlug, n as CompanyQrModal, o as exportCompanyQrPassPdf, r as CompanyQrBadge, s as generateCompanyQrPngDataUrl, t as EmployeeAttendanceTimeline, u as QrCode } from "./EmployeeAttendanceTimeline-BU6VPQGO.js";
import { t as MapPin } from "./map-pin-CwI3o0GO.js";
import { t as Navigation } from "./navigation-Cjrfrd5q.js";
import { t as RotateCcw } from "./rotate-ccw-wuxYnQna.js";
import { C as resetLocalWorkforceSnapshot, Ot as Search, S as recordLocalAttendanceEvent, Sn as ArrowUpRight, _n as BriefcaseBusiness, an as Download, en as FileText, gn as Building2, mn as Check, on as Copy, qt as LogIn, w as subscribeLocalWorkforceEvents, x as getLocalWorkforceSnapshot } from "./index-BKrODMj6.js";
import { A as signInClientPortalWithGoogle, C as observeClientPortalAuth, I as subscribeCompanies, L as subscribeCompanyAttendance, b as isPortalFirestoreReady, x as isVerifiedAdminUser } from "./firestoreClientService-BUGkAdZ4.js";
//#region src/components/company/CompanyQrQuickAccessSection.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var CompanyQrQuickAccessSection = ({ language, onOpenCompanyDossier, onOpenClientArchive }) => {
	const isAr = language === "ar";
	const [authUser, setAuthUser] = (0, import_react.useState)(null);
	const [companies, setCompanies] = (0, import_react.useState)([]);
	const [companiesLoading, setCompaniesLoading] = (0, import_react.useState)(false);
	const [authError, setAuthError] = (0, import_react.useState)(null);
	const [signingIn, setSigningIn] = (0, import_react.useState)(false);
	const [manualCompanyId, setManualCompanyId] = (0, import_react.useState)("");
	const [directorySearch, setDirectorySearch] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [downloadingPng, setDownloadingPng] = (0, import_react.useState)(false);
	const [modalTarget, setModalTarget] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const unsub = observeClientPortalAuth((user) => {
			setAuthUser(user);
		});
		return () => unsub();
	}, []);
	const isAdmin = (0, import_react.useMemo)(() => isVerifiedAdminUser(authUser), [authUser]);
	(0, import_react.useEffect)(() => {
		if (!authUser) {
			setCompanies([]);
			setCompaniesLoading(false);
			return;
		}
		setCompaniesLoading(true);
		const unsub = subscribeCompanies(authUser.uid, isAdmin, (list) => {
			setCompanies(list);
			setCompaniesLoading(false);
			setManualCompanyId((prev) => prev || list[0]?.id || "");
		}, (err) => {
			setCompaniesLoading(false);
			setAuthError(err.message);
		});
		return () => unsub();
	}, [authUser, isAdmin]);
	const cleanInputId = (0, import_react.useMemo)(() => sanitizeCompanyIdSlug(manualCompanyId), [manualCompanyId]);
	const activeCompanyRecord = (0, import_react.useMemo)(() => companies.find((c) => c.id === cleanInputId) ?? null, [companies, cleanInputId]);
	const isValidId = isValidCompanyIdSlug(cleanInputId);
	const activeQrTarget = (0, import_react.useMemo)(() => {
		if (!isValidId) return null;
		if (activeCompanyRecord) return activeCompanyRecord;
		return { id: cleanInputId };
	}, [
		isValidId,
		activeCompanyRecord,
		cleanInputId
	]);
	const activeDossierUrl = (0, import_react.useMemo)(() => activeQrTarget ? buildCompanyDossierUrl(activeQrTarget.id) : "", [activeQrTarget]);
	const filteredDirectory = (0, import_react.useMemo)(() => {
		const q = directorySearch.trim().toLowerCase();
		if (!q) return companies;
		return companies.filter((co) => co.id.toLowerCase().includes(q) || co.companyCode.toLowerCase().includes(q) || co.nameAr.toLowerCase().includes(q) || co.nameEn.toLowerCase().includes(q));
	}, [companies, directorySearch]);
	const handleGoogleSignIn = async () => {
		setSigningIn(true);
		setAuthError(null);
		try {
			await signInClientPortalWithGoogle();
		} catch (err) {
			setAuthError(err instanceof Error ? err.message : String(err));
		} finally {
			setSigningIn(false);
		}
	};
	const handleCopyLink = async () => {
		if (!activeDossierUrl) return;
		try {
			await navigator.clipboard?.writeText(activeDossierUrl);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {}
	};
	const handleDownloadPng = async () => {
		if (!activeQrTarget) return;
		setDownloadingPng(true);
		try {
			const dataUrl = await generateCompanyQrPngDataUrl(activeQrTarget.id, 640);
			const a = document.createElement("a");
			const slug = (activeQrTarget.companyCode || activeQrTarget.id).replace(/[^a-zA-Z0-9_-]/g, "_");
			a.href = dataUrl;
			a.download = `INSCO_QR_${slug}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} finally {
			setDownloadingPng(false);
		}
	};
	const handleDirectJump = (e) => {
		e.preventDefault();
		if (!isValidId) return;
		onOpenCompanyDossier?.(cleanInputId);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "inspector-qr-access",
		"aria-labelledby": "inspector-qr-heading",
		className: "py-16 border-t border-slate-800/80 bg-slate-950",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6 space-y-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col lg:flex-row lg:items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 max-w-2xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {
									className: "w-4 h-4",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "الوصول الميداني السريع عبر QR" : "Field Inspector QR Quick Access" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "inspector-qr-heading",
								className: "text-2xl sm:text-3xl font-black text-white tracking-tight",
								children: isAr ? "مولّد رموز QR لملفات الشركات وتقارير الفحص" : "Unique Company ID QR Generator & Dossier Pass"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-400 leading-relaxed",
								children: isAr ? "توليد كود QR فريد لكل شركة مسجلة استناداً إلى معرّف الشركة الفردي (Company ID)، ليتمكن مفتشو الموقع من مسحه والوصول الفوري إلى ملف الشركة وسجل الريبورتات." : "Generates a unique scannable QR code keyed to each registered company’s individual ID, enabling field inspectors to jump straight to that company’s file and inspection report dossier."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2.5 shrink-0",
						children: [!authUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: signingIn,
							onClick: () => void handleGoogleSignIn(),
							className: "inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 transition cursor-pointer whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, {
								className: "w-3.5 h-3.5",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signingIn ? isAr ? "جاري الاتصال..." : "Signing in..." : isAr ? "دخول لتحميل الشركات المسجلة" : "Sign in for Registered Companies" })]
						}), onOpenClientArchive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onOpenClientArchive,
							className: "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition cursor-pointer whitespace-nowrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
									className: "w-3.5 h-3.5 text-cyan-400",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "فتح بوابة أرشيف الشركات" : "Open Client Archive" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
									className: "w-3.5 h-3.5",
									"aria-hidden": "true"
								})
							]
						})]
					})]
				}),
				authError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "alert",
					className: "rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300",
					children: authError
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-slate-800 bg-slate-900/60 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleDirectJump,
						className: "lg:col-span-7 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "inspector-company-id-input",
									className: "block text-xs font-bold text-slate-200",
									children: isAr ? "المعرّف الفردي للشركة المسجلة (Individual Company ID)" : "Registered Individual Company ID"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col sm:flex-row gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "inspector-company-id-input",
										type: "text",
										dir: "ltr",
										value: manualCompanyId,
										onChange: (e) => setManualCompanyId(e.target.value),
										placeholder: isAr ? "أدخل معرّف الشركة مثل comp_petrogulf_01..." : "Enter company ID (e.g. comp_petrogulf_01)...",
										className: "flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-cyan-300 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none tabular-nums"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "submit",
										disabled: !isValidId || !onOpenCompanyDossier,
										className: "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 px-4 py-2.5 text-xs font-black text-white transition cursor-pointer whitespace-nowrap shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
											className: "w-4 h-4",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "فتح ملف الشركة والتقارير" : "Open File & Report Dossier" })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-slate-400",
									children: isAr ? "يقبل الحروف اللاتينية والأرقام والشرطات (_ و -). يتحدث كود QR والرابط المباشر تلقائياً لكل معرّف." : "Accepts alphanumeric characters, dashes, and underscores. QR matrix and deep-link update immediately per ID."
								})
							]
						}), activeQrTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									dir: "ltr",
									className: "font-mono text-[11px] text-slate-300 truncate select-all",
									children: activeDossierUrl
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void handleCopyLink(),
									className: "inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 transition cursor-pointer whitespace-nowrap shrink-0",
									children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "w-3 h-3 text-emerald-400",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تم النسخ" : "Copied" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
										className: "w-3 h-3",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "نسخ الرابط" : "Copy URL" })] })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										disabled: downloadingPng,
										onClick: () => void handleDownloadPng(),
										className: "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 transition cursor-pointer whitespace-nowrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
											className: "w-3.5 h-3.5 text-cyan-400",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تحميل صورة QR (PNG)" : "Download QR (PNG)" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => exportCompanyQrPassPdf(activeQrTarget),
										className: "inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 transition cursor-pointer whitespace-nowrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
											className: "w-3.5 h-3.5",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تصدير بطاقة المفتش PDF" : "Export Inspector Pass PDF" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setModalTarget(activeQrTarget),
										className: "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition cursor-pointer whitespace-nowrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {
											className: "w-3.5 h-3.5 text-emerald-400",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تكبير الكود" : "Expand QR" })]
									})
								]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "lg:col-span-5 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-3",
						children: activeQrTarget ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyQrBadge, {
							companyId: activeQrTarget.id,
							companyName: activeCompanyRecord ? isAr ? activeCompanyRecord.nameAr : activeCompanyRecord.nameEn : void 0,
							sizePx: 176
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-bold text-white",
								children: activeCompanyRecord ? isAr ? activeCompanyRecord.nameAr : activeCompanyRecord.nameEn : isAr ? "بطاقة وصول ملف شركة" : "Company Dossier QR"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-mono text-cyan-300 tabular-nums",
								children: activeCompanyRecord?.companyCode ? `${activeCompanyRecord.companyCode} · ID: ${activeQrTarget.id}` : `ID: ${activeQrTarget.id}`
							})]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-10 space-y-2.5 max-w-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto w-12 h-12 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {
										className: "w-6 h-6",
										"aria-hidden": "true"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-bold text-slate-200",
									children: isAr ? "أدخل معرّف الشركة لتوليد رمز QR الفوري" : "Enter a Company ID to generate its QR badge"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] text-slate-500",
									children: isAr ? "أو اختر أي شركة مسجلة أدناه بعد تسجيل الدخول." : "Or pick any registered company below once signed in."
								})
							]
						})
					})]
				}),
				authUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-black text-white",
							children: isAr ? "بطاقات QR للشركات المسجلة في قاعدة البيانات" : "Registered Companies — Live Inspector QR Directory"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-400 tabular-nums",
							children: isAr ? `الشركات المتاحة لحسابك: ${companies.length}` : `Registered companies accessible to your account: ${companies.length}`
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative w-full sm:w-72",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: `w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? "right-3" : "left-3"}`,
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "search",
								value: directorySearch,
								onChange: (e) => setDirectorySearch(e.target.value),
								placeholder: isAr ? "بحث بالمعرّف أو الكود أو الاسم..." : "Filter by ID, Code, or Name...",
								className: `w-full rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none ${isAr ? "pr-9 pl-3" : "pl-9 pr-3"}`
							})]
						})]
					}), companiesLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
						children: [
							1,
							2,
							3
						].map((idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse" }, idx))
					}) : filteredDirectory.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400",
						children: isAr ? "لا توجد شركات مسجلة مرتبطة بهذا الحساب أو مطابقة لبحثك." : "No registered companies match your filter for this account."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
						children: filteredDirectory.map((co) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setModalTarget(co),
								"aria-label": isAr ? `تكبير QR للشركة ${co.nameAr}` : `Expand QR for ${co.nameEn}`,
								className: "shrink-0 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyQrBadge, {
									companyId: co.id,
									companyName: isAr ? co.nameAr : co.nameEn,
									sizePx: 96
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1 space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-cyan-300 truncate",
											children: co.companyCode
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-slate-400 shrink-0",
											children: [
												co.reportsCount ?? 0,
												" ",
												isAr ? "تقرير" : "rpts"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-bold text-xs text-white flex items-center gap-1.5 truncate",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
											className: "w-3.5 h-3.5 text-slate-400 shrink-0",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: isAr ? co.nameAr : co.nameEn
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										dir: "ltr",
										className: "text-[11px] font-mono text-slate-400 truncate tabular-nums",
										children: ["ID: ", co.id]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 pt-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setManualCompanyId(co.id),
												className: "rounded-md border border-slate-700 bg-slate-950 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap",
												children: isAr ? "معاينة" : "Select"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setModalTarget(co),
												className: "rounded-md border border-slate-700 bg-slate-950 hover:border-emerald-500/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition cursor-pointer whitespace-nowrap",
												children: "QR / PDF"
											}),
											onOpenCompanyDossier && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => onOpenCompanyDossier(co.id),
												className: "rounded-md bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 text-[11px] font-bold text-white transition cursor-pointer whitespace-nowrap",
												children: isAr ? "الفايل" : "Dossier"
											})
										]
									})
								]
							})]
						}, co.id))
					})]
				})
			]
		}), modalTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyQrModal, {
			language,
			company: modalTarget,
			onClose: () => setModalTarget(null),
			onOpenDossier: onOpenCompanyDossier ? (companyId) => {
				setModalTarget(null);
				onOpenCompanyDossier(companyId);
			} : void 0
		})]
	});
};
//#endregion
//#region src/components/company/CompanyAttendanceTimelineSection.tsx
var CompanyAttendanceTimelineSection = ({ language, onOpenTimeClockPortal, onOpenCompaniesPortal }) => {
	const isAr = language === "ar";
	const [localSnapshot, setLocalSnapshot] = (0, import_react.useState)(() => getLocalWorkforceSnapshot());
	const [liveCompany, setLiveCompany] = (0, import_react.useState)(null);
	const [liveLogs, setLiveLogs] = (0, import_react.useState)([]);
	const [usingLiveFirestore, setUsingLiveFirestore] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		return subscribeLocalWorkforceEvents(setLocalSnapshot);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isPortalFirestoreReady()) return;
		let unsubCompanies;
		let unsubAttendance;
		const unsubAuth = observeClientPortalAuth((user) => {
			unsubCompanies?.();
			unsubAttendance?.();
			if (!user) {
				setUsingLiveFirestore(false);
				setLiveCompany(null);
				setLiveLogs([]);
				return;
			}
			const isAdmin = isVerifiedAdminUser(user);
			unsubCompanies = subscribeCompanies(user.uid, isAdmin, (companies) => {
				const primary = companies[0] ?? null;
				setLiveCompany(primary);
				unsubAttendance?.();
				if (primary) unsubAttendance = subscribeCompanyAttendance(primary.id, user.uid, isAdmin, (logs) => {
					if (logs.length > 0) {
						setLiveLogs(logs);
						setUsingLiveFirestore(true);
					} else {
						setLiveLogs([]);
						setUsingLiveFirestore(false);
					}
				}, () => {
					setUsingLiveFirestore(false);
				});
			}, () => {
				setUsingLiveFirestore(false);
			});
		});
		return () => {
			unsubAuth();
			unsubCompanies?.();
			unsubAttendance?.();
		};
	}, []);
	const displayedLogs = (0, import_react.useMemo)(() => usingLiveFirestore && liveLogs.length > 0 ? liveLogs : localSnapshot.logs, [
		usingLiveFirestore,
		liveLogs,
		localSnapshot.logs
	]);
	const displayedCompany = (0, import_react.useMemo)(() => usingLiveFirestore && liveCompany ? liveCompany : localSnapshot.company, [
		usingLiveFirestore,
		liveCompany,
		localSnapshot.company
	]);
	const handleSimulatePunch = (mode, eventType) => {
		const siteLat = displayedCompany.siteLat ?? 31.5453;
		const siteLng = displayedCompany.siteLng ?? 31.0872;
		const emp = localSnapshot.employees[0];
		recordLocalAttendanceEvent({
			employeeId: emp.id,
			eventType,
			lat: mode === "inside" ? siteLat + 4e-4 : siteLat + .022,
			lng: mode === "inside" ? siteLng + 4e-4 : siteLng + .019,
			faceVerified: true,
			verificationMethod: "face_gps",
			notes: mode === "outside" ? isAr ? "تسجيل دخول ميداني خارج نطاق المشروع (تجربة تنبيه إداري)" : "Field check-in recorded outside project geofence perimeter" : isAr ? "تسجيل داخل النطاق المعتمد لموقع المشروع" : "Checked inside authorized project perimeter"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "field-attendance-timeline",
		"data-testid": "company-attendance-timeline-section",
		className: "py-12 border-t border-slate-800/80 bg-slate-950/60",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6 space-y-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row lg:items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, {
								className: "w-3.5 h-3.5",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "المتابعة الميدانية · الخرائط والجدول الزمني" : "Field Operations · Geofenced Attendance Timeline" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl sm:text-2xl font-black text-white",
							children: isAr ? "الجدول الزمني لدخول وخروج الموظفين الميدانيين وتنبيهات النطاق الجغرافي" : "Field Crew Check-In/Out Timeline & Geofencing Alerts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs sm:text-sm text-slate-400 max-w-2xl",
							children: usingLiveFirestore ? isAr ? `عرض مباشر من سجل الشركة المرتبط بحسابك (${displayedCompany.companyCode}).` : `Live synced timeline from your linked company workspace (${displayedCompany.companyCode}).` : isAr ? "سجل تشغيلي تفاعلي بالإحداثيات الجغرافية لمحطة البرلس؛ يُصدر تنبيهاً إدارياً فورياً عند تسجيل الدخول خارج نطاق المشروع المحدد." : "Interactive GPS coordinate timeline preview; automatically triggers an Admin Geofencing Alert when any check-in falls outside the project perimeter."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						!usingLiveFirestore && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => handleSimulatePunch("inside", "check_in"),
								className: "inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 cursor-pointer whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "w-3.5 h-3.5",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تجربة دخول داخل النطاق" : "Test Inside Check-In" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => handleSimulatePunch("outside", "check_in"),
								className: "inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 cursor-pointer whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
									className: "w-3.5 h-3.5",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تجربة دخول خارج النطاق" : "Test Outside Alert" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => resetLocalWorkforceSnapshot(),
								"aria-label": isAr ? "إعادة ضبط البيانات التفاعلية" : "Reset preview log",
								className: "inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer whitespace-nowrap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
									className: "w-3.5 h-3.5",
									"aria-hidden": "true"
								})
							})
						] }),
						onOpenTimeClockPortal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onOpenTimeClockPortal,
							className: "inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, {
								className: "w-3.5 h-3.5",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "بوابة تسجيل حضور الأفراد" : "Worker Time-Clock Portal" })]
						}),
						onOpenCompaniesPortal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onOpenCompaniesPortal,
							className: "inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-300 cursor-pointer whitespace-nowrap",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "خرائط الشركات والملفات ←" : "Companies & Live Maps →" })
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmployeeAttendanceTimeline, {
				language,
				logs: displayedLogs,
				companyName: isAr ? displayedCompany.nameAr : displayedCompany.nameEn,
				companyCode: displayedCompany.companyCode
			})]
		})
	});
};
//#endregion
//#region src/components/company/CompanyFieldTools.tsx
function CompanyFieldTools({ language, onOpenClient, onOpenDossier }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyQrQuickAccessSection, {
		language,
		onOpenCompanyDossier: onOpenDossier,
		onOpenClientArchive: () => onOpenClient("companies")
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyAttendanceTimelineSection, {
		language,
		onOpenTimeClockPortal: () => onOpenClient("timeclock"),
		onOpenCompaniesPortal: () => onOpenClient("companies")
	})] });
}
//#endregion
export { CompanyFieldTools };
