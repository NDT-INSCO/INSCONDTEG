import { c as inspectLinkedInUrl, f as normaliseLinkedInUrl, h as visibilityById, l as isSafeImageUrl, u as linkedInProblemMessage } from "./networkIdentity-D-GB3WyO.js";
//#region src/network/networkSkills.ts
var NETWORK_SKILL_LIMITS = {
	maxSkills: 20,
	skillIdMax: 40,
	recommendationMin: 40,
	recommendationMax: 1200,
	endorsementsPerSkillShown: 99
};
/** The vocabulary. Ids are lower_snake, ≤40 chars, and never change once shipped. */
var NETWORK_SKILLS = [
	{
		id: "ut",
		ar: "فحص الموجات فوق الصوتية UT",
		en: "Ultrasonic Testing (UT)",
		group: "methods"
	},
	{
		id: "paut",
		ar: "الموجات فوق الصوتية المرحلية PAUT",
		en: "Phased Array (PAUT)",
		group: "methods"
	},
	{
		id: "tofd",
		ar: "زمن الطيران الانحرافي TOFD",
		en: "Time of Flight Diffraction (TOFD)",
		group: "methods"
	},
	{
		id: "rt",
		ar: "التصوير الإشعاعي RT",
		en: "Radiographic Testing (RT)",
		group: "methods"
	},
	{
		id: "rt_film",
		ar: "تفسير أفلام التصوير RT-FI",
		en: "Radiographic Film Interpretation",
		group: "methods"
	},
	{
		id: "mt",
		ar: "الجسيمات المغناطيسية MT",
		en: "Magnetic Particle (MT)",
		group: "methods"
	},
	{
		id: "pt",
		ar: "السوائل النافذة PT",
		en: "Penetrant Testing (PT)",
		group: "methods"
	},
	{
		id: "vt",
		ar: "الفحص البصري VT",
		en: "Visual Testing (VT)",
		group: "methods"
	},
	{
		id: "et",
		ar: "التيارات الدوامية ET",
		en: "Eddy Current (ET)",
		group: "methods"
	},
	{
		id: "pmi",
		ar: "تحليل المعادن PMI",
		en: "Positive Material Identification (PMI)",
		group: "materials"
	},
	{
		id: "ht",
		ar: "المعالجة الحرارية PWHT",
		en: "Post Weld Heat Treatment",
		group: "materials"
	},
	{
		id: "hardness",
		ar: "قياس الصلادة",
		en: "Hardness Testing",
		group: "materials"
	},
	{
		id: "weld_qa",
		ar: "جودة اللحام QA/QC",
		en: "Welding QA/QC",
		group: "materials"
	},
	{
		id: "corrosion",
		ar: "تقييم التآكل",
		en: "Corrosion Assessment",
		group: "materials"
	},
	{
		id: "sizing",
		ar: "تقييم حجم العيوب",
		en: "Defect Sizing",
		group: "sizing"
	},
	{
		id: "acceptance",
		ar: "تطبيق معايير القبول",
		en: "Acceptance Criteria",
		group: "sizing"
	},
	{
		id: "asnt",
		ar: "مؤهلات ASNT",
		en: "ASNT Qualifications",
		group: "sizing"
	},
	{
		id: "iso9712",
		ar: "مؤهلات ISO 9712",
		en: "ISO 9712 Qualifications",
		group: "sizing"
	},
	{
		id: "reporting",
		ar: "كتابة التقارير الفنية",
		en: "Technical Reporting",
		group: "management"
	},
	{
		id: "ndte_ed",
		ar: "التدريب والتأهيل NDT",
		en: "NDT Training",
		group: "management"
	},
	{
		id: "inspection_mgmt",
		ar: "إدارة أعمال الفحص",
		en: "Inspection Management",
		group: "management"
	},
	{
		id: "risk_based",
		ar: "الفحص المبني على المخاطر RBI",
		en: "Risk-Based Inspection",
		group: "management"
	}
];
var NETWORK_SKILL_GROUPS = [
	{
		id: "methods",
		ar: "طرق الفحص",
		en: "Methods"
	},
	{
		id: "materials",
		ar: "مواد ومعالجة",
		en: "Materials & treatment"
	},
	{
		id: "sizing",
		ar: "تقييم ومعايير",
		en: "Sizing & standards"
	},
	{
		id: "management",
		ar: "إدارة وتدريب",
		en: "Management & training"
	}
];
var SKILL_IDS = new Set(NETWORK_SKILLS.map((skill) => skill.id));
function skillById(id) {
	return NETWORK_SKILLS.find((skill) => skill.id === id);
}
function skillLabel(skill, isAr) {
	return isAr ? skill.ar : skill.en;
}
/**
* The stored form is one string so the rules can prove it: ids only, no spaces.
* Unknown ids are dropped rather than kept — an id from an older build that no
* longer exists must not resurrect a chip nobody can name.
*/
function parseSkills(raw) {
	if (!raw) return [];
	const out = [];
	for (const part of raw.split(",")) {
		const id = part.trim();
		if (!id || !SKILL_IDS.has(id) || out.includes(id)) continue;
		if (out.length >= NETWORK_SKILL_LIMITS.maxSkills) break;
		out.push(id);
	}
	return out;
}
function serialiseSkills(ids) {
	return parseSkills(ids.join(",")).join(",");
}
/** Adding a skill at the ceiling replaces nothing: the caller gets the same string back. */
function toggleSkill(raw, id) {
	const current = parseSkills(raw);
	if (current.includes(id)) return {
		value: serialiseSkills(current.filter((item) => item !== id)),
		rejected: null
	};
	if (!SKILL_IDS.has(id)) return {
		value: serialiseSkills(current),
		rejected: null
	};
	if (current.length >= NETWORK_SKILL_LIMITS.maxSkills) return {
		value: serialiseSkills(current),
		rejected: "limit"
	};
	return {
		value: serialiseSkills([...current, id]),
		rejected: null
	};
}
/** Deterministic id: one endorsement per (target, skill, endorser), enforced by the rules. */
function endorsementId(toUid, skillId, fromUid) {
	return `${toUid}_${skillId}_${fromUid}`;
}
/**
* Why the endorse button is or is not offered. Mirrors the rules; the rules remain
* the authority, this only avoids offering a click that must fail.
*/
function canEndorse(params) {
	const { viewerUid, viewerVerified, toUid, skillId, targetSkills, existing } = params;
	if (!viewerUid) return {
		allowed: false,
		reasonAr: "سجّل الدخول لتزكية المهارات.",
		reasonEn: "Sign in to endorse skills."
	};
	if (!viewerVerified) return {
		allowed: false,
		reasonAr: "التزكية تحتاج بريداً مؤكَّداً (خطوة تأكيد واحدة).",
		reasonEn: "Endorsing needs a confirmed email (one verification step)."
	};
	if (viewerUid === toUid) return {
		allowed: false,
		reasonAr: "لا تُزكّي مهاراتك أنت.",
		reasonEn: "You cannot endorse your own skills."
	};
	if (!targetSkills.includes(skillId)) return {
		allowed: false,
		reasonAr: "هذه المهارة ليست على بطاقة العضو.",
		reasonEn: "This skill is not on their card."
	};
	if (existing.some((row) => row.fromUid === viewerUid && row.skillId === skillId)) return {
		allowed: false,
		reasonAr: "زكّيت هذه المهارة بالفعل.",
		reasonEn: "You already endorsed this skill."
	};
	return {
		allowed: true,
		reasonAr: null,
		reasonEn: null
	};
}
/** Counts per skill, computed from the documents — there is no counter field to trust. */
function countEndorsements(rows) {
	const counts = {};
	for (const row of rows) counts[row.skillId] = (counts[row.skillId] ?? 0) + 1;
	return counts;
}
function endorsersOf(rows, skillId) {
	return rows.filter((row) => row.skillId === skillId).map((row) => row.fromName).filter(Boolean);
}
var RECOMMENDATION_RELATIONS = [
	{
		id: "colleague",
		ar: "زميل عمل",
		en: "Colleague"
	},
	{
		id: "client",
		ar: "عميل",
		en: "Client"
	},
	{
		id: "instructor",
		ar: "مدرّب",
		en: "Instructor"
	}
];
function relationLabel(id, isAr) {
	const found = RECOMMENDATION_RELATIONS.find((relation) => relation.id === id);
	if (!found) return isAr ? "علاقة غير محددة" : "Unspecified relation";
	return isAr ? found.ar : found.en;
}
var EMPTY_RECOMMENDATION = {
	relation: "colleague",
	body: ""
};
/** One recommendation per pair, in one direction — the id itself prevents a second. */
function recommendationId(fromUid, toUid) {
	return `${fromUid}_${toUid}`;
}
function validateRecommendation(draft) {
	const errors = [];
	const body = draft.body.trim();
	if (!RECOMMENDATION_RELATIONS.some((relation) => relation.id === draft.relation)) errors.push({
		field: "relation",
		ar: "اختر نوع العلاقة.",
		en: "Choose the relation."
	});
	if (body.length < NETWORK_SKILL_LIMITS.recommendationMin) errors.push({
		field: "body",
		ar: `اكتب ${NETWORK_SKILL_LIMITS.recommendationMin} حرفاً على الأقل — توصية بلا تفاصيل لا تُفيد.`,
		en: `Write at least ${NETWORK_SKILL_LIMITS.recommendationMin} characters — a vague line helps nobody.`
	});
	else if (body.length > NETWORK_SKILL_LIMITS.recommendationMax) errors.push({
		field: "body",
		ar: `التوصية أطول من ${NETWORK_SKILL_LIMITS.recommendationMax} حرفاً.`,
		en: `The recommendation is longer than ${NETWORK_SKILL_LIMITS.recommendationMax} characters.`
	});
	return errors;
}
/** A recommendation the viewer may edit or remove: their own, still theirs to change. */
function canManageRecommendation(row, viewerUid) {
	if (!viewerUid) return false;
	return row.fromUid === viewerUid || row.toUid === viewerUid;
}
//#endregion
//#region src/network/networkProfileForm.ts
/** Mirrors `isValidCommunityWorkspace` in firestore.rules. */
var NETWORK_PROFILE_LIMITS = {
	displayNameMin: 2,
	displayNameMax: 120,
	organizationMin: 2,
	organizationMax: 160,
	sectorMin: 2,
	sectorMax: 100,
	cityMax: 100,
	specialtyMax: 300,
	bioMax: 600,
	headlineMax: 160,
	certificationsMax: 240,
	yearsExperienceMax: 70
};
/** The sectors of the rules' `sector` field, phrased for engineers. */
var NETWORK_SECTORS = [
	"الفحص غير الإتلافي",
	"المعالجة الحرارية",
	"فحص اللحام",
	"ضمان وضبط الجودة",
	"التآكل والمواد",
	"خطوط الأنابيب",
	"السلامة الصناعية",
	"مقاولات وصيانة صناعية",
	"تعليم وتدريب هندسي"
];
var NETWORK_AVAILABILITY = [
	{
		id: "active_field",
		ar: "على رأس العمل",
		en: "On site / employed"
	},
	{
		id: "open_to_work",
		ar: "متاح للفرص",
		en: "Open to work"
	},
	{
		id: "hiring",
		ar: "أبحث عن كفاءات",
		en: "Hiring"
	},
	{
		id: "offering_services",
		ar: "أقدّم خدمات",
		en: "Offering services"
	}
];
var EMPTY_NETWORK_PROFILE = {
	displayName: "",
	headline: "",
	organizationName: "",
	sector: NETWORK_SECTORS[0],
	city: "",
	specialtyTrades: "",
	certifications: "",
	bio: "",
	yearsExperience: "",
	availabilityStatus: "active_field",
	isPublished: true,
	photoURL: "",
	bannerURL: "",
	linkedInUrl: "",
	profileVisibility: "public",
	skills: "",
	professionalRole: "",
	relatedFields: [],
	languages: ["ar", "en"],
	experienceSummary: "",
	educationSummary: "",
	projectsSummary: "",
	shareAcademyProgress: false,
	messagePolicy: "everyone"
};
/** Load an existing card into the form, without ever inventing a field. */
function draftFromProfile(profile) {
	if (!profile) return { ...EMPTY_NETWORK_PROFILE };
	return {
		displayName: profile.displayName ?? "",
		headline: profile.headline ?? "",
		organizationName: profile.organizationName ?? "",
		sector: profile.sector ?? NETWORK_SECTORS[0],
		city: profile.city ?? "",
		specialtyTrades: profile.specialtyTrades ?? "",
		certifications: profile.certifications ?? "",
		bio: profile.bio ?? "",
		yearsExperience: typeof profile.yearsExperience === "number" ? String(profile.yearsExperience) : "",
		availabilityStatus: profile.availabilityStatus ?? "active_field",
		isPublished: profile.isPublished !== false,
		photoURL: profile.photoURL ?? "",
		bannerURL: profile.bannerURL ?? "",
		linkedInUrl: profile.linkedInUrl ?? "",
		skills: parseSkills(profile.skills ?? "").join(","),
		profileVisibility: visibilityById(profile.profileVisibility),
		professionalRole: profile.professionalRole ?? "",
		relatedFields: Array.isArray(profile.relatedFields) ? profile.relatedFields : typeof profile.relatedFields === "string" && profile.relatedFields ? String(profile.relatedFields).split(",").map((s) => s.trim()).filter(Boolean) : [],
		languages: Array.isArray(profile.languages) ? profile.languages : typeof profile.languages === "string" && profile.languages ? String(profile.languages).split(",").map((s) => s.trim()).filter(Boolean) : [],
		experienceSummary: profile.experienceSummary ?? "",
		educationSummary: profile.educationSummary ?? "",
		projectsSummary: profile.projectsSummary ?? "",
		shareAcademyProgress: profile.shareAcademyProgress === true,
		messagePolicy: profile.messagePolicy === "connections" || profile.messagePolicy === "none" ? profile.messagePolicy : "everyone"
	};
}
var length = (value) => (value ?? "").trim().length;
var longEnough = (value, min) => length(value) >= min;
/**
* Validate the draft against the same constraints the database enforces.
*
* Two required fields are not obvious to a member, so they are named plainly:
* `organizationName` is required by the rules even for an independent engineer
* ("مستقل" is an acceptable answer), and `sector` must be one of the known ones.
*/
function validateNetworkProfileDraft(draft) {
	const errors = [];
	const push = (field, ar, en) => errors.push({
		field,
		ar,
		en
	});
	const name = draft.displayName.trim();
	if (!longEnough(name, NETWORK_PROFILE_LIMITS.displayNameMin)) push("displayName", "الاسم مطلوب (حرفان على الأقل).", "Your name is required (at least two characters).");
	else if (length(name) > NETWORK_PROFILE_LIMITS.displayNameMax) push("displayName", `الاسم أطول من ${NETWORK_PROFILE_LIMITS.displayNameMax} حرفاً.`, `The name is longer than ${NETWORK_PROFILE_LIMITS.displayNameMax} characters.`);
	const org = draft.organizationName.trim();
	if (!longEnough(org, NETWORK_PROFILE_LIMITS.organizationMin)) push("organizationName", "اكتب جهة العمل، أو «مستقل» إذا كنت تعمل لحسابك.", "Enter your employer, or \"Independent\" if you work for yourself.");
	else if (length(org) > NETWORK_PROFILE_LIMITS.organizationMax) push("organizationName", `جهة العمل أطول من ${NETWORK_PROFILE_LIMITS.organizationMax} حرفاً.`, `The employer is longer than ${NETWORK_PROFILE_LIMITS.organizationMax} characters.`);
	const sector = draft.sector.trim();
	if (!longEnough(sector, NETWORK_PROFILE_LIMITS.sectorMin)) push("sector", "اختر القطاع.", "Choose your sector.");
	else if (length(sector) > NETWORK_PROFILE_LIMITS.sectorMax) push("sector", "اسم القطاع طويل جداً.", "The sector name is too long.");
	if (length(draft.headline) > NETWORK_PROFILE_LIMITS.headlineMax) push("headline", `المسمّى المختصر أطول من ${NETWORK_PROFILE_LIMITS.headlineMax} حرفاً.`, `The headline is longer than ${NETWORK_PROFILE_LIMITS.headlineMax} characters.`);
	if (length(draft.city) > NETWORK_PROFILE_LIMITS.cityMax) push("city", "اسم المدينة طويل جداً.", "The city name is too long.");
	if (length(draft.specialtyTrades) > NETWORK_PROFILE_LIMITS.specialtyMax) push("specialtyTrades", `التخصصات أطول من ${NETWORK_PROFILE_LIMITS.specialtyMax} حرفاً.`, `The specialities are longer than ${NETWORK_PROFILE_LIMITS.specialtyMax} characters.`);
	if (length(draft.certifications) > NETWORK_PROFILE_LIMITS.certificationsMax) push("certifications", `قائمة الشهادات أطول من ${NETWORK_PROFILE_LIMITS.certificationsMax} حرفاً.`, `The certifications line is longer than ${NETWORK_PROFILE_LIMITS.certificationsMax} characters.`);
	if (length(draft.bio) > NETWORK_PROFILE_LIMITS.bioMax) push("bio", `النبذة أطول من ${NETWORK_PROFILE_LIMITS.bioMax} حرفاً.`, `The bio is longer than ${NETWORK_PROFILE_LIMITS.bioMax} characters.`);
	const years = draft.yearsExperience.trim();
	if (years !== "") {
		const parsed = Number(years);
		if (!Number.isFinite(parsed) || parsed < 0 || parsed > NETWORK_PROFILE_LIMITS.yearsExperienceMax) push("yearsExperience", `سنوات الخبرة بين 0 و${NETWORK_PROFILE_LIMITS.yearsExperienceMax}.`, `Years of experience must be between 0 and ${NETWORK_PROFILE_LIMITS.yearsExperienceMax}.`);
	}
	if (!NETWORK_AVAILABILITY.some((item) => item.id === draft.availabilityStatus)) push("availabilityStatus", "اختر حالة تفرّغ صحيحة.", "Choose a valid availability state.");
	if (draft.photoURL.trim() !== "" && !isSafeImageUrl(draft.photoURL)) push("photoURL", "رابط الصورة يجب أن يبدأ بـ https://", "The photo link must start with https://");
	if (draft.bannerURL.trim() !== "" && !isSafeImageUrl(draft.bannerURL)) push("bannerURL", "رابط البانر يجب أن يبدأ بـ https://", "The banner link must start with https://");
	const linkedInProblem = inspectLinkedInUrl(normaliseLinkedInUrl(draft.linkedInUrl));
	if (linkedInProblem) push("linkedInUrl", linkedInProblemMessage(linkedInProblem, true), linkedInProblemMessage(linkedInProblem, false));
	if (draft.profileVisibility !== "public" && draft.profileVisibility !== "members") push("profileVisibility", "اختر من يرى صفحتك.", "Choose who can open your page.");
	return errors;
}
var trimmed = (value) => value.trim();
var optional = (value) => {
	const next = trimmed(value);
	return next === "" ? void 0 : next;
};
/**
* Draft → the exact payload `upsertCommunityWorkspace` accepts.
*
* Optional fields are omitted rather than sent empty, because an empty string in
* Firestore is a value (and would overwrite a field the member cleared by choice
* with a blank one the rules then have to police).
*/
function toWorkspaceWrite(draft, existing) {
	const years = trimmed(draft.yearsExperience);
	const parsedYears = years === "" ? void 0 : Math.round(Number(years));
	const headline = optional(draft.headline);
	const certifications = optional(draft.certifications);
	const specialtyTrades = optional(draft.specialtyTrades);
	const bio = optional(draft.bio);
	const city = optional(draft.city);
	const companyCode = existing?.companyCode ? existing.companyCode : void 0;
	const professionalRole = optional(draft.professionalRole ?? "");
	const experienceSummary = optional(draft.experienceSummary ?? "");
	const educationSummary = optional(draft.educationSummary ?? "");
	const projectsSummary = optional(draft.projectsSummary ?? "");
	return {
		displayName: trimmed(draft.displayName),
		organizationName: trimmed(draft.organizationName),
		sector: trimmed(draft.sector),
		...city !== void 0 ? { city } : {},
		...companyCode ? { companyCode } : {},
		...specialtyTrades !== void 0 ? { specialtyTrades } : {},
		...bio !== void 0 ? { bio } : {},
		companiesManaged: existing?.companiesManaged ?? 0,
		isPublished: draft.isPublished,
		...headline !== void 0 ? { headline } : {},
		...certifications !== void 0 ? { certifications } : {},
		...parsedYears !== void 0 && Number.isFinite(parsedYears) ? { yearsExperience: parsedYears } : {},
		availabilityStatus: draft.availabilityStatus,
		...optional(draft.photoURL) !== void 0 ? { photoURL: optional(draft.photoURL) } : {},
		...optional(draft.bannerURL) !== void 0 ? { bannerURL: optional(draft.bannerURL) } : {},
		...normaliseLinkedInUrl(draft.linkedInUrl) !== "" ? { linkedInUrl: normaliseLinkedInUrl(draft.linkedInUrl) } : {},
		profileVisibility: draft.profileVisibility,
		skills: parseSkills(draft.skills).join(","),
		...professionalRole ? { professionalRole: professionalRole.slice(0, 60) } : {},
		...Array.isArray(draft.relatedFields) && draft.relatedFields.length > 0 ? { relatedFields: draft.relatedFields.slice(0, 8) } : {},
		...Array.isArray(draft.languages) && draft.languages.length > 0 ? { languages: draft.languages.slice(0, 6) } : {},
		...experienceSummary ? { experienceSummary: experienceSummary.slice(0, 1200) } : {},
		...educationSummary ? { educationSummary: educationSummary.slice(0, 600) } : {},
		...projectsSummary ? { projectsSummary: projectsSummary.slice(0, 800) } : {},
		...draft.shareAcademyProgress !== void 0 ? { shareAcademyProgress: Boolean(draft.shareAcademyProgress) } : {},
		...draft.messagePolicy ? { messagePolicy: draft.messagePolicy } : {}
	};
}
/** How complete the card is, so a member knows what a visitor still cannot see. */
function networkProfileCompleteness(draft) {
	const checks = [
		{
			filled: longEnough(draft.displayName, NETWORK_PROFILE_LIMITS.displayNameMin),
			ar: "الاسم",
			en: "Name"
		},
		{
			filled: longEnough(draft.organizationName, NETWORK_PROFILE_LIMITS.organizationMin),
			ar: "جهة العمل",
			en: "Employer"
		},
		{
			filled: longEnough(draft.headline, 4),
			ar: "المسمّى المهني",
			en: "Headline"
		},
		{
			filled: longEnough(draft.specialtyTrades, 3),
			ar: "التخصصات",
			en: "Specialities"
		},
		{
			filled: longEnough(draft.certifications, 3),
			ar: "الشهادات (كإقرار غير موثّق)",
			en: "Certifications (as an unverified claim)"
		},
		{
			filled: longEnough(draft.bio, 20),
			ar: "نبذة",
			en: "Bio"
		},
		{
			filled: trimmed(draft.yearsExperience) !== "",
			ar: "سنوات الخبرة",
			en: "Years of experience"
		},
		{
			filled: longEnough(draft.city, 2),
			ar: "المدينة",
			en: "City"
		}
	];
	const filled = checks.filter((check) => check.filled).length;
	return {
		percent: Math.round(filled / checks.length * 100),
		missingAr: checks.filter((check) => !check.filled).map((check) => check.ar),
		missingEn: checks.filter((check) => !check.filled).map((check) => check.en)
	};
}
//#endregion
export { toggleSkill as C, skillLabel as S, endorsersOf as _, networkProfileCompleteness as a, relationLabel as b, EMPTY_RECOMMENDATION as c, NETWORK_SKILL_LIMITS as d, RECOMMENDATION_RELATIONS as f, endorsementId as g, countEndorsements as h, draftFromProfile as i, NETWORK_SKILLS as l, canManageRecommendation as m, NETWORK_PROFILE_LIMITS as n, toWorkspaceWrite as o, canEndorse as p, NETWORK_SECTORS as r, validateNetworkProfileDraft as s, NETWORK_AVAILABILITY as t, NETWORK_SKILL_GROUPS as u, parseSkills as v, validateRecommendation as w, skillById as x, recommendationId as y };
