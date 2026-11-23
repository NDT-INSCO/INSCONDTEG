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
//#region src/network/networkIdentity.ts
/** Mirrors `storage.rules`. */
var NETWORK_MEDIA_LIMITS = {
	photoMaxBytes: 2097152,
	bannerMaxBytes: 4194304,
	/** Storage also checks the content type; this is the same list. */
	acceptedTypes: [
		"image/jpeg",
		"image/png",
		"image/webp"
	],
	bannerWidth: 1200,
	bannerHeight: 400,
	photoWidth: 512,
	photoHeight: 512,
	/** A URL stored on the card (Firestore field) must stay well under the rules' cap. */
	urlMax: 500
};
/**
* Who may open `#network/people/<uid>`.
*
* `public`  — anyone with the link, signed in or not (the card is PII-free by design).
* `members` — only a signed-in member with a confirmed email, enforced by the rules,
*             not by hiding a button.
*/
var NETWORK_PROFILE_VISIBILITY = [{
	id: "public",
	ar: "عامة بالرابط",
	en: "Public link",
	hintAr: "أي زائر يفتح الرابط يرى بطاقتك المهنية. لا يُعرض بريدك ولا هاتفك إطلاقاً.",
	hintEn: "Anyone with the link sees your professional card. Your email and phone are never shown."
}, {
	id: "members",
	ar: "للأعضاء المؤكَّدين",
	en: "Confirmed members",
	hintAr: "القواعد تمنع فتح الصفحة قبل تسجيل الدخول وتأكيد البريد. تبقى في الدليل بالاسم فقط.",
	hintEn: "The rules refuse the page until sign-in and email confirmation. You still appear in the directory by name."
}];
function visibilityById(id) {
	return id === "members" ? "members" : "public";
}
var looksLikeHttpUrl = (value) => {
	const trimmed = value.trim();
	if (trimmed === "" || trimmed.length > NETWORK_MEDIA_LIMITS.urlMax) return false;
	return /^https:\/\/[^\s]+$/i.test(trimmed);
};
/**
* A photo or banner URL. HTTPS only: the site itself is served over HTTPS, and an
* `http://` image would be blocked as mixed content — promising a picture that
* cannot load is worse than asking for a proper link.
*/
function isSafeImageUrl(value) {
	return looksLikeHttpUrl(value);
}
/**
* The «LinkedIn» button points at the member's own profile there. We accept only a
* LinkedIn host, so the button can never be quietly repurposed as a redirect to
* somewhere else on a page that carries INSCO's name.
*/
function inspectLinkedInUrl(value) {
	const trimmed = value.trim();
	if (trimmed === "") return null;
	if (trimmed.length > NETWORK_MEDIA_LIMITS.urlMax) return "too_long";
	if (!/^https:\/\//i.test(trimmed)) return "scheme";
	let host;
	try {
		host = new URL(trimmed).hostname.toLowerCase();
	} catch {
		return "scheme";
	}
	return [
		"linkedin.com",
		"www.linkedin.com",
		"lnkd.in",
		"www.lnkd.in"
	].includes(host) || host.endsWith(".linkedin.com") ? null : "host";
}
function normaliseLinkedInUrl(value) {
	const trimmed = value.trim();
	if (trimmed === "") return "";
	if (/^(www\.)?(linkedin\.com|lnkd\.in)\//i.test(trimmed)) return `https://${trimmed}`;
	return trimmed;
}
function linkedInProblemMessage(problem, isAr) {
	switch (problem) {
		case "empty": return isAr ? "اكتب رابط ملفك على LinkedIn أو اتركه فارغاً." : "Enter your LinkedIn URL, or leave it empty.";
		case "scheme": return isAr ? "الرابط يجب أن يبدأ بـ https:// (مثال: https://www.linkedin.com/in/your-name)." : "The link must start with https:// (e.g. https://www.linkedin.com/in/your-name).";
		case "host": return isAr ? "هذا ليس رابط LinkedIn. نقبل linkedin.com أو lnkd.in فقط." : "That is not a LinkedIn link. Only linkedin.com or lnkd.in are accepted.";
		case "too_long": return isAr ? "الرابط أطول من المسموح." : "The link is longer than allowed.";
	}
}
/**
* Validate a picked file before a single byte leaves the device.
*
* The same two checks exist in `storage.rules`; doing them here as well turns a
* rejected upload into an instant explanation instead of a network error.
*/
function validateMediaFile(file, kind) {
	const maxBytes = kind === "photo" ? NETWORK_MEDIA_LIMITS.photoMaxBytes : NETWORK_MEDIA_LIMITS.bannerMaxBytes;
	const maxMb = Math.round(maxBytes / 1048576);
	if (!NETWORK_MEDIA_LIMITS.acceptedTypes.includes(file.type)) return {
		ar: "الصيغة غير مدعومة. المقبول: JPG أو PNG أو WebP.",
		en: "Unsupported format. Accepted: JPG, PNG or WebP."
	};
	if (file.size > maxBytes) return {
		ar: `الحجم أكبر من ${maxMb} ميجابايت. صغّر الصورة ثم أعد المحاولة.`,
		en: `The file is larger than ${maxMb} MB. Shrink it and try again.`
	};
	if (file.size === 0) return {
		ar: "الملف فارغ.",
		en: "The file is empty."
	};
	return null;
}
function extensionForMime(type) {
	if (type === "image/png") return "png";
	if (type === "image/webp") return "webp";
	return "jpg";
}
/** Where a member's media lives in the bucket; mirrored by `storage.rules`. */
function mediaPath(uid, kind, extension) {
	return `community_profiles/${uid}/${kind}-${Date.now()}.${extension}`;
}
var PALETTES = {
	"الفحص غير الإتلافي": {
		from: "#120b2e",
		to: "#3b1d7a",
		accent: "#a78bfa",
		ink: "#f5f3ff"
	},
	"المعالجة الحرارية": {
		from: "#2a0f0b",
		to: "#7c2d12",
		accent: "#fdba74",
		ink: "#fff7ed"
	},
	"فحص اللحام": {
		from: "#0b1f2a",
		to: "#155e75",
		accent: "#67e8f9",
		ink: "#ecfeff"
	},
	"ضمان وضبط الجودة": {
		from: "#0b2416",
		to: "#166534",
		accent: "#86efac",
		ink: "#f0fdf4"
	},
	"التآكل والمواد": {
		from: "#241a06",
		to: "#854d0e",
		accent: "#fde047",
		ink: "#fefce8"
	},
	"خطوط الأنابيب": {
		from: "#101a2c",
		to: "#1e3a8a",
		accent: "#93c5fd",
		ink: "#eff6ff"
	},
	"السلامة الصناعية": {
		from: "#2a0a14",
		to: "#9f1239",
		accent: "#fda4af",
		ink: "#fff1f2"
	},
	"مقاولات وصيانة صناعية": {
		from: "#171717",
		to: "#3f3f46",
		accent: "#d4d4d8",
		ink: "#fafafa"
	},
	"تعليم وتدريب هندسي": {
		from: "#14103a",
		to: "#4338ca",
		accent: "#c7d2fe",
		ink: "#eef2ff"
	}
};
var FALLBACK_PALETTE = {
	from: "#120b2e",
	to: "#3b1d7a",
	accent: "#a78bfa",
	ink: "#f5f3ff"
};
function bannerPaletteFor(sector) {
	return PALETTES[sector] ?? FALLBACK_PALETTE;
}
/** Up to two initials, so an avatar never has to be an empty circle. */
function initialsOf(name) {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "؟";
	return `${Array.from(words[0])[0] ?? ""}${words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : ""}`.toUpperCase();
}
/** Greedy wrap on spaces; a single over-long word is left intact rather than cut. */
function wrapBannerText(text, maxChars, maxLines) {
	const words = text.trim().split(/\s+/).filter(Boolean);
	const lines = [];
	let current = "";
	for (const word of words) {
		const candidate = current === "" ? word : `${current} ${word}`;
		if (Array.from(candidate).length <= maxChars || current === "") current = candidate;
		else {
			lines.push(current);
			current = word;
		}
		if (lines.length === maxLines) break;
	}
	if (lines.length < maxLines && current !== "") lines.push(current);
	return lines;
}
/**
* Turn a card into a banner that says something true.
*
* The generated banner is built from the member's own card only — name, headline,
* organisation, sector, city. It never adds a certification, a badge or a title the
* member has not entered.
*/
function bannerSpecFor(source, language = "ar") {
	const isAr = language === "ar";
	const headline = (source.headline ?? "").trim();
	const meta = [source.organizationName, source.city].map((part) => (part ?? "").trim()).filter(Boolean).join(" · ");
	return {
		width: NETWORK_MEDIA_LIMITS.bannerWidth,
		height: NETWORK_MEDIA_LIMITS.bannerHeight,
		palette: bannerPaletteFor((source.sector ?? "").trim()),
		name: (source.displayName ?? "").trim(),
		headlineLines: headline === "" ? [] : wrapBannerText(headline, isAr ? 46 : 62, 2),
		metaLine: meta,
		initials: initialsOf(source.displayName ?? ""),
		brand: isAr ? "الشبكة الهندسية · إنسكو" : "INSCO Engineering Network",
		rtl: isAr
	};
}
/** The smallest useful check before drawing: a banner without a name is anonymous. */
function canGenerateBanner(source) {
	return (source.displayName ?? "").trim().length >= 2;
}
/**
* Decide what a visitor may see, mirroring the rules.
*
* `profile` is `null` when the document could not be read at all — the rules refuse
* a members-only card to a signed-out reader, and Firestore reports that as a
* permission error, which the caller turns into `private` rather than `missing`.
*/
function publicPageAccess(profile, viewer) {
	if (!profile) return { state: "missing" };
	if (!profile.isPublished) return { state: "not-published" };
	if (visibilityById(profile.profileVisibility) === "members" && !(viewer.signedIn && viewer.verified)) return { state: "private" };
	return { state: "ok" };
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
	skills: ""
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
		profileVisibility: visibilityById(profile.profileVisibility)
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
		skills: parseSkills(draft.skills).join(",")
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
export { recommendationId as A, RECOMMENDATION_RELATIONS as C, endorsementId as D, countEndorsements as E, validateRecommendation as F, skillById as M, skillLabel as N, endorsersOf as O, toggleSkill as P, NETWORK_SKILL_LIMITS as S, canManageRecommendation as T, validateMediaFile as _, networkProfileCompleteness as a, NETWORK_SKILLS as b, NETWORK_MEDIA_LIMITS as c, bannerSpecFor as d, canGenerateBanner as f, publicPageAccess as g, mediaPath as h, draftFromProfile as i, relationLabel as j, parseSkills as k, NETWORK_PROFILE_VISIBILITY as l, initialsOf as m, NETWORK_PROFILE_LIMITS as n, toWorkspaceWrite as o, extensionForMime as p, NETWORK_SECTORS as r, validateNetworkProfileDraft as s, NETWORK_AVAILABILITY as t, bannerPaletteFor as u, visibilityById as v, canEndorse as w, NETWORK_SKILL_GROUPS as x, EMPTY_RECOMMENDATION as y };
