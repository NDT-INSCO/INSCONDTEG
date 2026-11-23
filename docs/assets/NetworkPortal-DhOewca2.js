const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/NetworkProfileSection-Ch07S_ma.js","assets/rolldown-runtime-oLLnCvco.js","assets/jsx-runtime-CJAQq89J.js","assets/createLucideIcon-Cyy1bEkm.js","assets/circle-alert-BqP2ljBW.js","assets/linkedin-DZZtgKUO.js","assets/loader-circle-BuW2oL63.js","assets/save-Bt8Ogdlf.js","assets/shield-check-BseoenC-.js","assets/upload-CENY4Gxd.js","assets/preload-helper-B6u0oZm0.js","assets/index-BKrODMj6.js","assets/publicUrl-Caz80cHM.js","assets/index-2b7fG9FA.css","assets/networkProfileForm-DKDncrxG.js","assets/NetworkFeedSection-DoM78Ok8.js","assets/NetworkJobsSection-IFs-syxQ.js","assets/briefcase-Dv_sjYzX.js","assets/map-pin-CwI3o0GO.js","assets/NetworkDirectorySection-CE7Y5hvx.js","assets/NetworkMemberProfile-CygrvhV0.js","assets/lock-DA1SF9yS.js","assets/plus-CZjdWV3u.js","assets/NetworkGroupsSection-C5ARr1mr.js","assets/networkGroupsForm-ZuOQumZk.js","assets/NetworkGroupPage-BHOh5jgb.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { n as Bell, t as Info } from "./info-DziJ9J3c.js";
import { t as Briefcase } from "./briefcase-Dv_sjYzX.js";
import { n as FastForward, t as Lock } from "./lock-DA1SF9yS.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
import { Bt as MessageSquare, M as SiteAccountActions, Ot as Search, P as useOptionalSiteAccount, Zt as GraduationCap, bn as BookOpen, c as NETWORK_SECTION_COPY, d as networkSectionLabel, f as networkSectionShort, gn as Building2, gt as UserRound, ht as Users, s as NETWORK_SECTIONS } from "./index-BKrODMj6.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var BadgeCheck = createLucideIcon("badge-check", [["path", {
	d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
	key: "3c2336"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CalendarDays = createLucideIcon("calendar-days", [
	["path", {
		d: "M8 2v4",
		key: "1cmpym"
	}],
	["path", {
		d: "M16 2v4",
		key: "4m81vk"
	}],
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "4",
		rx: "2",
		key: "1hopcy"
	}],
	["path", {
		d: "M3 10h18",
		key: "8toen8"
	}],
	["path", {
		d: "M8 14h.01",
		key: "6423bh"
	}],
	["path", {
		d: "M12 14h.01",
		key: "1etili"
	}],
	["path", {
		d: "M16 14h.01",
		key: "1gbofw"
	}],
	["path", {
		d: "M8 18h.01",
		key: "lrp35t"
	}],
	["path", {
		d: "M12 18h.01",
		key: "mhygvu"
	}],
	["path", {
		d: "M16 18h.01",
		key: "kzsmim"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LayoutList = createLucideIcon("layout-list", [
	["rect", {
		width: "7",
		height: "7",
		x: "3",
		y: "3",
		rx: "1",
		key: "1g98yp"
	}],
	["rect", {
		width: "7",
		height: "7",
		x: "3",
		y: "14",
		rx: "1",
		key: "1bb6yr"
	}],
	["path", {
		d: "M14 4h7",
		key: "3xa0d5"
	}],
	["path", {
		d: "M14 9h7",
		key: "1icrd9"
	}],
	["path", {
		d: "M14 15h7",
		key: "1mj8o2"
	}],
	["path", {
		d: "M14 20h7",
		key: "11slyb"
	}]
]);
//#endregion
//#region src/components/network/NetworkShell.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var NETWORK_ICON = {
	feed: LayoutList,
	profile: UserRound,
	groups: Users,
	people: UserRound,
	jobs: Briefcase,
	articles: BookOpen,
	events: CalendarDays,
	companies: Building2,
	messages: MessageSquare,
	notifications: Bell,
	search: Search,
	verify: ShieldCheck
};
/**
* The prototype ribbon.
*
* The addendum forbids presenting demo content as real members or jobs, so the
* banner is part of the shell (not something a page can forget to render) and
* every card that carries template data also carries its own badge.
*/
var NetworkPrototypeBanner = ({ language, compact = false }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-prototype-banner",
		role: "note",
		className: `flex min-w-0 items-start gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-3 py-2 text-[11px] leading-relaxed text-violet-200 ${compact ? "" : "sm:text-xs"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FastForward, {
			className: "mt-0.5 h-4 w-4 shrink-0 text-violet-300",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0",
			children: language === "ar" ? "حسابك وملفك المهني والمنشورات والتعليقات والإعجاب ودليل الأعضاء والفرص المهنية تعمل الآن على حساب إنسكو الحقيقي. المجموعات والرسائل والإشعارات والتحقق المهني ما زالت تصوراً تصميمياً، وكل إجراء كتابة فيها معطّل بوضوح." : "Your account, professional card, posts, comments, likes, the member directory and the jobs board now run on the real INSCO account. Groups, messages, notifications and verification are still a design prototype, and their write actions stay visibly disabled."
		})]
	});
};
/** The network's own navigation — one bounded grid, never a scrolling strip. */
var NetworkHeader = ({ language, section, onOpenSection }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		"data-testid": "network-header",
		className: "border-b border-violet-500/20 bg-[#0a0a18]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 py-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-violet-300",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
								className: "h-4 w-4 shrink-0",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: isAr ? "INSCO ENGINEERING NETWORK" : "INSCO ENGINEERING NETWORK"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 truncate text-xl font-black tracking-tight text-white sm:text-2xl",
							children: isAr ? "الشبكة الهندسية — المجتمع المهني" : "Engineering Network — the professional community"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-violet-200",
						children: isAr ? "جزئياً مفعّل" : "Partly live"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": isAr ? "أقسام الشبكة الهندسية" : "Engineering Network sections",
					className: "mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-12",
					children: NETWORK_SECTIONS.map((id) => {
						const Icon = NETWORK_ICON[id];
						const isCurrent = id === section;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onOpenSection(id),
							"aria-current": isCurrent ? "page" : void 0,
							title: networkSectionLabel(id, isAr ? "ar" : "en"),
							"data-testid": `network-nav-${id}`,
							className: `flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center transition cursor-pointer xl:flex-row xl:gap-1.5 ${isCurrent ? "bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20" : "border border-[#232345] bg-[#101028] text-slate-300 hover:border-violet-400/50 hover:text-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: `h-4 w-4 shrink-0 ${isCurrent ? "text-slate-950" : "text-violet-300"}`,
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "w-full text-[10px] font-bold leading-tight xl:text-[11px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "xl:hidden",
									children: networkSectionShort(id, isAr ? "ar" : "en")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden xl:inline",
									children: networkSectionLabel(id, isAr ? "ar" : "en")
								})]
							})]
						}, id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkPrototypeBanner, {
						language,
						compact: true
					})
				})
			]
		})
	});
};
/**
* The network footer — deliberately its own.
*
* A member at the end of a page gets the community rules and the two doors back
* to the company profile and the academy; a buyer never sees this footer.
*/
var NetworkFooter = ({ language, onOpenCompany, onOpenAcademy }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "mt-4 border-t border-[#232345] bg-[#08080f] py-6 text-[11px] text-slate-400",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
						className: "h-4 w-4 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: isAr ? "شبكة إنسكو الهندسية" : "INSCO Engineering Network"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl leading-relaxed",
					children: isAr ? "شبكة مهنية متخصصة في الفحص غير الإتلافي والمعالجة الحرارية والجودة — لا تُعرض فيها شهادات كموثّقة قبل التحقق منها، ولا تُنشر نتائج تقييمات الأكاديمية دون موافقة صاحبها." : "A professional network for NDT, PWHT and quality engineering — certificates are never shown as verified before they are checked, and academy results are never published without the member’s consent."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onOpenAcademy,
					className: "inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, {
						className: "h-3.5 w-3.5 shrink-0",
						"aria-hidden": "true"
					}), isAr ? "الأكاديمية" : "Academy"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onOpenCompany,
					className: "inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition cursor-pointer hover:border-cyan-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
						className: "h-3.5 w-3.5 shrink-0",
						"aria-hidden": "true"
					}), isAr ? "بوابة الشركة" : "Company portal"]
				})]
			})]
		})
	});
};
//#endregion
//#region src/components/network/networkContent.ts
var NETWORK_DISCIPLINES = [
	{
		id: "ndt",
		ar: "الفحص غير الإتلافي",
		en: "NDT (general)",
		codes: "ASNT · ISO 9712"
	},
	{
		id: "ut_paut",
		ar: "الموجات فوق الصوتية والمصفوفات",
		en: "UT / PAUT / TOFD",
		codes: "ASME V Art. 4 · 5"
	},
	{
		id: "rt_dr",
		ar: "التصوير الإشعاعي والرقمي",
		en: "RT / DR",
		codes: "ASME V Art. 2 · EN 14784"
	},
	{
		id: "surface",
		ar: "الفحوصات السطحية",
		en: "MT / PT / VT",
		codes: "ASME V Art. 6 · 7 · 9"
	},
	{
		id: "welding",
		ar: "فحص اللحام",
		en: "Welding inspection",
		codes: "AWS D1.1 · ASME IX"
	},
	{
		id: "pwht",
		ar: "المعالجة الحرارية بعد اللحام",
		en: "PWHT",
		codes: "AWS D10.10 · ASME B31.3"
	},
	{
		id: "qa_qc",
		ar: "ضبط وضمان الجودة",
		en: "QA / QC",
		codes: "ISO 9001 · ITP"
	},
	{
		id: "materials",
		ar: "التآكل والمواد",
		en: "Corrosion & materials",
		codes: "NACE · PMI"
	},
	{
		id: "pipeline",
		ar: "فحص وخطوط الأنابيب",
		en: "Pipeline inspection",
		codes: "API 1104 · B31.4/8"
	},
	{
		id: "safety",
		ar: "السلامة الصناعية",
		en: "Industrial safety",
		codes: "HSE · ISO 45001"
	}
];
function disciplineLabel(id, language) {
	const found = NETWORK_DISCIPLINES.find((item) => item.id === id);
	return found ? found[language] : id;
}
var NETWORK_ARTICLE_TEMPLATES = [
	{
		id: "art-dac",
		sample: true,
		ar: "قالب مقال: بناء منحنى DAC من V1/V2",
		en: "Article template: building a DAC curve from V1/V2",
		discipline: "ut_paut",
		noteAr: "يُربَط تلقائياً بدرس الأكاديمية ذي الصلة",
		noteEn: "Links to the matching academy lesson"
	},
	{
		id: "art-pwht",
		sample: true,
		ar: "قالب مقال: قراءة منحنى PWHT المسجّل",
		en: "Article template: reading a recorded PWHT chart",
		discipline: "pwht",
		noteAr: "يُربَط بمحاكي مهم",
		noteEn: "Links to the matching simulator"
	},
	{
		id: "art-film",
		sample: true,
		ar: "قالب مقال: كثافة الفيلم و Ug في RT",
		en: "Article template: film density and Ug in RT",
		discipline: "rt_dr",
		noteAr: "يُربَط بمعمل RT",
		noteEn: "Links to the RT lab"
	}
];
var NETWORK_EVENT_TEMPLATES = [
	{
		id: "ev-workshop",
		sample: true,
		ar: "قالب فعالية: ورشة عملية على PAUT",
		en: "Event template: a hands-on PAUT workshop",
		kindAr: "ورشة عمل",
		kindEn: "Workshop"
	},
	{
		id: "ev-webinar",
		sample: true,
		ar: "قالب فعالية: ندوة عن أكواد ASME",
		en: "Event template: an ASME codes webinar",
		kindAr: "ندوة",
		kindEn: "Seminar"
	},
	{
		id: "ev-conf",
		sample: true,
		ar: "قالب فعالية: مؤتمر الجودة الصناعية",
		en: "Event template: industrial quality conference",
		kindAr: "مؤتمر",
		kindEn: "Conference"
	}
];
var NETWORK_ORG_TEMPLATES = [
	{
		id: "org-insco",
		sample: true,
		ar: "صفحة إنسكو المؤسسية",
		en: "The INSCO organisation page",
		sectorAr: "NDT · PWHT · فحص اللحام",
		sectorEn: "NDT · PWHT · welding inspection"
	},
	{
		id: "org-contractor",
		sample: true,
		ar: "قالب صفحة مقاول عام",
		en: "General-contractor page template",
		sectorAr: "مشروعات الطاقة والصناعة",
		sectorEn: "Power and industrial projects"
	},
	{
		id: "org-lab",
		sample: true,
		ar: "قالب صفحة معمل فحص",
		en: "Inspection-laboratory page template",
		sectorAr: "مختبرات وفحص مستقل",
		sectorEn: "Laboratories and third-party inspection"
	}
];
/** The four professional states of INSCO Verified Professional. */
var NETWORK_VERIFICATION_LEVELS = [
	{
		id: "member",
		ar: "حساب مهني",
		en: "Professional account",
		meaningAr: "بريد مؤكَّد ومسمّى وتخصص — لا يُدّعى أي تحقق من الشهادات.",
		meaningEn: "A confirmed email, a headline and a discipline — no credential claim is made.",
		accent: "border-slate-600 text-slate-300"
	},
	{
		id: "identity",
		ar: "هوية مُتحقَّقة",
		en: "Identity verified",
		meaningAr: "التحقق من الشخص نفسه (هوية/جهة عمل)، منفصل تماماً عن الشهادات.",
		meaningEn: "The person is verified (identity or employer), entirely separate from certificates.",
		accent: "border-cyan-500/50 text-cyan-300"
	},
	{
		id: "credential",
		ar: "مؤهل مُتحقَّق",
		en: "Credential verified",
		meaningAr: "راجعنا شهادة ASNT/ISO 9712 مع جهة الإصدار — تُعرض الشارة بجانب تلك الشهادة فقط.",
		meaningEn: "An ASNT/ISO 9712 certificate was checked with the issuing body — the badge sits beside that certificate only.",
		accent: "border-emerald-500/50 text-emerald-300"
	},
	{
		id: "expert",
		ar: "خبير تقني",
		en: "Technical expert",
		meaningAr: "خبرة موثّقة ومشاركات مُراجَعة — لا يُمنح تلقائياً بعدد المنشورات.",
		meaningEn: "Documented experience and reviewed contributions — never granted automatically by post count.",
		accent: "border-amber-500/50 text-amber-300"
	}
];
//#endregion
//#region src/components/network/NetworkSections.tsx
var Panel = ({ children, className = "", label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
	"aria-label": label,
	className: `min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3 ${className}`,
	children
});
/** Every template card carries this badge — a card cannot look like real data. */
var SampleBadge = ({ language }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
	"data-testid": "network-sample-badge",
	className: "shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-violet-200",
	children: language === "ar" ? "نموذج توضيحي" : "Sample"
});
/**
* A write action that will exist once accounts do.
*
* Rendered as a genuinely disabled control (not a look-alike) so keyboard users
* are not sent into a dead end, with the reason next to it in plain language.
*/
var DisabledAction = ({ language, labelAr, labelEn, icon }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex min-w-0 items-center gap-1.5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			disabled: true,
			"aria-disabled": "true",
			"data-testid": "network-write-disabled",
			title: isAr ? "معطّل: يفعّل بعد ربط الخادم ونظام الحسابات" : "Disabled: enabled once the backend and accounts exist",
			className: "inline-flex items-center gap-1.5 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[11px] font-bold text-slate-500 opacity-70 cursor-not-allowed",
			children: [icon ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
				className: "h-3.5 w-3.5 shrink-0",
				"aria-hidden": "true"
			}), isAr ? labelAr : labelEn]
		})
	});
};
var Chip = ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
	className: "shrink-0 rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[10px] text-slate-300",
	children
});
var SectionIntro = ({ language, id, extra }) => {
	const isAr = language === "ar";
	const Icon = NETWORK_ICON[id];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-4 w-4 shrink-0 text-violet-300",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "truncate text-base font-bold text-white sm:text-lg",
					children: networkSectionLabel(id, isAr ? "ar" : "en")
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-3xl text-[11px] leading-relaxed text-slate-400 sm:text-xs",
				children: NETWORK_SECTION_COPY[id][isAr ? "ar" : "en"]
			})]
		}), extra ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex shrink-0 flex-wrap items-center gap-2",
			children: extra
		}) : null]
	});
};
var NetworkArticles = ({ language, onOpenAcademy }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-articles",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
			language,
			id: "articles",
			extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisabledAction, {
				language,
				labelAr: "كتابة مقال",
				labelEn: "Write article"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3",
			children: NETWORK_ARTICLE_TEMPLATES.map((article) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				label: article[isAr ? "ar" : "en"],
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-start justify-between gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
								className: "h-4 w-4 shrink-0 text-violet-300",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "min-w-0 truncate text-xs font-bold text-white",
								children: article[isAr ? "ar" : "en"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SampleBadge, { language })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: disciplineLabel(article.discipline, isAr ? "ar" : "en") })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-[10px] leading-relaxed text-slate-400",
						children: article[isAr ? "noteAr" : "noteEn"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onOpenAcademy,
						className: "mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, {
							className: "h-3.5 w-3.5 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "الدرس المرتبط" : "Linked lesson"]
					})
				]
			}, article.id))
		})]
	});
};
var NetworkEvents = ({ language }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-events",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
			language,
			id: "events"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3",
			children: NETWORK_EVENT_TEMPLATES.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				label: event[isAr ? "ar" : "en"],
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-start justify-between gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
								className: "h-4 w-4 shrink-0 text-violet-300",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "min-w-0 truncate text-xs font-bold text-white",
								children: event[isAr ? "ar" : "en"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SampleBadge, { language })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex flex-wrap gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: event[isAr ? "kindAr" : "kindEn"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: isAr ? "التاريخ بعد النشر" : "Date after publishing" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisabledAction, {
							language,
							labelAr: "تسجيل الحضور",
							labelEn: "Register"
						})
					})
				]
			}) }, event.id))
		})]
	});
};
var NetworkCompanies = ({ language, onOpenCompany }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-companies",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
			language,
			id: "companies"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3",
			children: NETWORK_ORG_TEMPLATES.map((org, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				label: org[isAr ? "ar" : "en"],
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-start justify-between gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
								className: "h-4 w-4 shrink-0 text-violet-300",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "min-w-0 truncate text-xs font-bold text-white",
								children: org[isAr ? "ar" : "en"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SampleBadge, { language })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] text-slate-400",
						children: org[isAr ? "sectorAr" : "sectorEn"]
					}),
					index === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onOpenCompany,
						className: "mt-2 inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-300 transition cursor-pointer hover:border-cyan-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
							className: "h-3.5 w-3.5 shrink-0",
							"aria-hidden": "true"
						}), isAr ? "فتح بوابة الشركة" : "Open company portal"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisabledAction, {
							language,
							labelAr: "متابعة المؤسسة",
							labelEn: "Follow organisation"
						})
					})
				]
			}, org.id))
		})]
	});
};
var NetworkMessages = ({ language }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-messages",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
			language,
			id: "messages"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-w-0 gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				label: isAr ? "المحادثات" : "Threads",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1.5",
					children: [
						1,
						2,
						3
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-w-0 items-center gap-2 rounded-md border border-[#232345] px-2 py-1.5 opacity-70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a4d] bg-[#14142a] text-[10px] text-slate-500",
							children: "?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[10px] font-bold text-slate-400",
								children: isAr ? `محادثة ${n}` : `Thread ${n}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[10px] text-slate-600",
								children: isAr ? "لا رسائل بعد" : "No messages yet"
							})]
						})]
					}, n))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				label: isAr ? "نافذة الرسالة" : "Message pane",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-32 items-center justify-center rounded-lg border border-dashed border-[#2a2a4d] bg-[#0b0b18] text-[11px] text-slate-500",
						children: isAr ? "المراسلة تتفعّل بعد إنشاء الحسابات" : "Messaging turns on once accounts exist"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							disabled: true,
							"aria-label": isAr ? "كتابة رسالة (معطّل)" : "Write a message (disabled)",
							placeholder: isAr ? "اكتب رسالة…" : "Write a message…",
							className: "min-w-0 flex-1 rounded-md border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1 text-[11px] text-slate-400 placeholder:text-slate-600 cursor-not-allowed"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisabledAction, {
							language,
							labelAr: "إرسال",
							labelEn: "Send"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[10px] leading-relaxed text-slate-500",
						children: isAr ? "قناة منفصلة تماماً عن RFQ: عروض الأسعار تُطلب من بوابة العملاء وتُتابَع هناك، ولا تُرسل كرسالة اجتماعية." : "A channel entirely separate from RFQ: quotes are requested and tracked in the client portal, never as a social message."
					})
				]
			})]
		})]
	});
};
var NetworkNotifications = ({ language }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-notifications",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
			language,
			id: "notifications"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-w-0 gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				label: isAr ? "ضبط الإشعارات" : "Notification settings",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-[#1d1d38]",
					children: [
						{
							ar: "طلبات الاتصال",
							en: "Connection requests"
						},
						{
							ar: "التعليقات والتفاعلات",
							en: "Comments and reactions"
						},
						{
							ar: "المنشورات في مجموعاتي",
							en: "Posts in my groups"
						},
						{
							ar: "الوظائف المطابقة لتخصصي",
							en: "Jobs matching my discipline"
						},
						{
							ar: "رسائل مباشرة",
							en: "Direct messages"
						},
						{
							ar: "ملخص أسبوعي بالبريد",
							en: "Weekly email digest"
						}
					].map((pref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-w-0 items-center justify-between gap-2 py-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 truncate text-[11px] text-slate-300",
							children: pref[isAr ? "ar" : "en"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: "relative h-4 w-8 shrink-0 rounded-full border border-[#2a2a4d] bg-[#14142a] opacity-60",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-slate-500 start-0.5" })
						})]
					}, pref.en))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[10px] text-slate-500",
					children: isAr ? "المفاتيح معطّلة حتى يوجد حساب فعلي." : "Switches stay disabled until a real account exists."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				label: isAr ? "صندوق الإشعارات" : "Notifications inbox",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-32 items-center justify-center rounded-lg border border-dashed border-[#2a2a4d] bg-[#0b0b18] text-[11px] text-slate-500",
					children: isAr ? "لا إشعارات — لا نشاط حقيقي بعد" : "No notifications — no real activity yet"
				})
			})]
		})]
	});
};
var NetworkSearch = ({ language, onOpenSection }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-search",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
				language,
				id: "search"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				label: isAr ? "البحث" : "Search",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-4 w-4 shrink-0 text-violet-300",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						disabled: true,
						"aria-label": isAr ? "بحث (معطّل)" : "Search (disabled)",
						placeholder: isAr ? "ابحث في الأعضاء والمجموعات والوظائف والمقالات…" : "Search people, groups, jobs, articles…",
						className: "min-w-0 flex-1 rounded-md border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-400 placeholder:text-slate-600 cursor-not-allowed"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[10px] text-slate-500",
					children: isAr ? "البحث يفتح على البيانات الحقيقية بعد إطلاق الشبكة." : "Search opens on real data once the network launches."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2.5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6",
				children: [
					"people",
					"groups",
					"jobs",
					"articles",
					"events",
					"companies"
				].map((scope) => {
					const Icon = NETWORK_ICON[scope];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onOpenSection(scope),
						className: "flex min-w-0 items-center gap-1.5 rounded-lg border border-[#232345] bg-[#101028] px-2 py-2 text-start text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "h-3.5 w-3.5 shrink-0 text-violet-300",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 truncate",
							children: networkSectionLabel(scope, isAr ? "ar" : "en")
						})]
					}, scope);
				})
			})
		]
	});
};
var NetworkVerify = ({ language, onOpenSection }) => {
	const isAr = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "network-section-verify",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionIntro, {
			language,
			id: "verify"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				label: isAr ? "مستويات التحقق" : "Verification levels",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: NETWORK_VERIFICATION_LEVELS.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: `min-w-0 rounded-lg border px-2.5 py-2 ${level.accent}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									className: "h-4 w-4 shrink-0",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "min-w-0 truncate text-xs font-bold",
									children: level[isAr ? "ar" : "en"]
								}),
								level.id === "member" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: isAr ? "الافتراضي" : "Default" }) : null
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[10px] leading-relaxed text-slate-300/80",
							children: level[isAr ? "meaningAr" : "meaningEn"]
						})]
					}, level.id))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						label: isAr ? "مساران منفصلان" : "Two separate tracks",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
								className: "list-inside list-decimal space-y-1.5 text-[10px] leading-relaxed text-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-cyan-300",
										children: isAr ? "التحقق من الهوية" : "Identity verification"
									}),
									" — ",
									isAr ? "أنت شخص حقيقي، عبر بريد الجهة أو مستند رسمي." : "you are a real person, via an employer email or an official document."
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-emerald-300",
										children: isAr ? "التحقق من المؤهل" : "Credential verification"
									}),
									" — ",
									isAr ? "شهادة ASNT/ISO 9712 تُراجَع مع جهة الإصدار، وتُعرض الشارة بجانبها فقط." : "an ASNT/ISO 9712 certificate is checked with the issuer, and the badge sits beside that certificate only."
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] leading-relaxed text-amber-200",
								children: isAr ? "مراجعة الشهادة لا تعني التحقق من الهوية، والعكس صحيح. لا تُمنح أي شارة تلقائياً." : "A checked certificate does not imply a verified identity, and vice versa. No badge is ever granted automatically."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 text-[10px] leading-relaxed text-slate-400",
								children: isAr ? "العضوية تستخدم جلسة حساب إنسكو الموحّد نفسها (بريد مؤكَّد واحد لكل الأقسام) — لا يُنشأ حساب ثانٍ للشبكة." : "Membership uses the same unified INSCO account session (one confirmed email across every section) — no second account is created for the network."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						label: isAr ? "الطلب" : "Request",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisabledAction, {
									language,
									labelAr: "طلب التحقق من الهوية",
									labelEn: "Request identity check",
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
										className: "h-3.5 w-3.5 shrink-0",
										"aria-hidden": "true"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisabledAction, {
									language,
									labelAr: "إضافة شهادة للمراجعة",
									labelEn: "Submit a certificate",
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
										className: "h-3.5 w-3.5 shrink-0",
										"aria-hidden": "true"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
										className: "mt-0.5 h-3.5 w-3.5 shrink-0",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "طلبات التحقق تُراجَع يدوياً من إنسكو؛ لا نشر تلقائي لأي نتيجة تقييم." : "Verification requests are reviewed manually by INSCO; no assessment result is ever auto-published." })]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenSection("profile"),
						className: "w-full rounded-md border border-[#2a2a4d] px-2 py-1 text-[10px] font-bold text-violet-300 transition cursor-pointer hover:border-violet-400",
						children: isAr ? "العودة إلى ملفي المهني" : "Back to my profile"
					})
				]
			})]
		})]
	});
};
//#endregion
//#region src/components/network/NetworkPortal.tsx
/**
* Live sections stay in distinct chunks. Prototype sections do not import
* the account data service or write records.
*/
var NetworkProfileSection = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkProfileSection-Ch07S_ma.js").then((module) => ({ default: module.NetworkProfileSection })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var NetworkFeedSection = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkFeedSection-DoM78Ok8.js").then((module) => ({ default: module.NetworkFeedSection })), __vite__mapDeps([15,1,2,3,4,6,10,11,8,12,13])));
var NetworkJobsSection = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkJobsSection-IFs-syxQ.js").then((module) => ({ default: module.NetworkJobsSection })), __vite__mapDeps([16,1,2,17,3,4,6,18,10,11,8,12,13])));
var NetworkDirectorySection = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkDirectorySection-CE7Y5hvx.js").then((module) => ({ default: module.NetworkDirectorySection })), __vite__mapDeps([19,1,2,4,3,6,18,8,10,11,12,13,14])));
var NetworkMemberProfile = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkMemberProfile-CygrvhV0.js").then((module) => ({ default: module.NetworkMemberProfile })), __vite__mapDeps([20,1,2,3,17,4,21,5,6,18,22,10,11,8,12,13,14])));
var NetworkGroupsSection = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkGroupsSection-C5ARr1mr.js").then((module) => ({ default: module.NetworkGroupsSection })), __vite__mapDeps([23,1,2,3,4,24,21,6,22,8,10,11,12,13])));
var NetworkGroupPage = (0, import_react.lazy)(() => __vitePreload(() => import("./NetworkGroupPage-BHOh5jgb.js").then((module) => ({ default: module.NetworkGroupPage })), __vite__mapDeps([25,1,2,4,3,24,21,6,22,10,11,8,12,13])));
var LoadingSection = ({ language }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
	role: "status",
	className: "p-4 text-[11px] text-slate-400",
	children: language === "ar" ? "جارٍ تحميل بيانات حسابك…" : "Loading your account data…"
});
/**
* The fourth portal, as a shell around one section.
*
* The network owns its header, its footer and its background so a visitor can
* never mistake a member's feed for the INSCO brochure, or an academy lesson.
* The feed, professional card and member directory use the unified account.
* The remaining sections are labelled prototypes.
*/
var NetworkPortal = ({ language, section, entryId, onOpenSection, onOpenCompany, onOpenAcademy, onOpenPrivateProfile }) => {
	const account = useOptionalSiteAccount();
	const openSection = (0, import_react.useCallback)((next) => onOpenSection(next), [onOpenSection]);
	const [panelRequest, setPanelRequest] = (0, import_react.useState)(null);
	const requestPanel = (0, import_react.useCallback)((panel) => {
		setPanelRequest((current) => ({
			panel,
			nonce: (current?.nonce ?? 0) + 1
		}));
	}, []);
	const openAccount = (0, import_react.useCallback)(() => requestPanel("signin"), [requestPanel]);
	/** The card form asks for `signin` or, for an unconfirmed email, `account`. */
	const openAccountPanel = (0, import_react.useCallback)((panel) => requestPanel(panel), [requestPanel]);
	const body = (() => {
		switch (section) {
			case "feed": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "network-section-feed",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkFeedSection, {
						language,
						onOpenAccount: openAccountPanel,
						onOpenProfile: () => openSection("profile")
					})
				})
			});
			case "profile": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "network-section-profile",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkProfileSection, {
						language,
						onOpenAccount: openAccountPanel
					})
				})
			});
			case "people":
				if (entryId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": "network-section-member",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkMemberProfile, {
							uid: entryId,
							language,
							onOpenAccount: openAccountPanel,
							onOpenProfile: () => openSection("profile"),
							onOpenDirectory: () => openSection("people")
						})
					})
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": "network-section-people",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkDirectorySection, {
							language,
							onOpenAccount: openAccount,
							onOpenProfile: () => openSection("profile"),
							onOpenMember: (uid) => onOpenSection("people", uid)
						})
					})
				});
			case "groups":
				if (entryId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": "network-section-group",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkGroupPage, {
							groupId: entryId,
							language,
							onOpenAccount: openAccountPanel,
							onOpenProfile: () => openSection("profile"),
							onBack: () => openSection("groups")
						})
					})
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": "network-section-groups",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkGroupsSection, {
							language,
							onOpenAccount: openAccountPanel,
							onOpenProfile: () => openSection("profile"),
							onOpenGroup: (groupId) => onOpenSection("groups", groupId)
						})
					})
				});
			case "jobs": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "network-section-jobs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkJobsSection, {
						language,
						onOpenAccount: openAccountPanel,
						onOpenProfile: () => openSection("profile")
					})
				})
			});
			case "articles": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkArticles, {
				language,
				onOpenAcademy
			});
			case "events": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkEvents, { language });
			case "companies": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkCompanies, {
				language,
				onOpenCompany
			});
			case "messages": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkMessages, { language });
			case "notifications": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkNotifications, { language });
			case "search": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkSearch, {
				language,
				onOpenSection: openSection
			});
			case "verify": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkVerify, {
				language,
				onOpenSection: openSection
			});
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "network-section-feed",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSection, { language }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkFeedSection, {
						language,
						onOpenAccount: openAccountPanel,
						onOpenProfile: () => openSection("profile")
					})
				})
			});
		}
	})();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-portal": "network",
		"data-section": section,
		"data-prototype": section === "feed" || section === "profile" || section === "people" || section === "jobs" || section === "groups" ? "partial" : "true",
		...entryId ? { "data-entry-id": entryId } : {},
		className: "min-h-screen bg-[#07070f] text-slate-200",
		dir: language === "ar" ? "rtl" : "ltr",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkHeader, {
				language,
				section,
				onOpenSection: openSection
			}),
			account && onOpenPrivateProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				id: "network-account-bar",
				className: "mx-auto max-w-7xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteAccountActions, {
					language,
					onOpenProfile: onOpenPrivateProfile,
					requestPanel: panelRequest
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				id: "insco-main",
				tabIndex: -1,
				className: "mx-auto max-w-7xl px-4 py-4 sm:px-6",
				children: body
			}, account?.user ? `account:${account.user.uid}` : "guest"),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkFooter, {
				language,
				onOpenCompany,
				onOpenAcademy
			})
		]
	});
};
//#endregion
export { NetworkPortal, NetworkPortal as default, BadgeCheck as t };
