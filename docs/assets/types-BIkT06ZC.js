//#region src/client/types.ts
/** Strict blueprint validation constants synced with firebase-blueprint.json & firestore.rules */
var BLUEPRINT_LIMITS = {
	COMPANY_CODE_REGEX: /^[A-Z0-9-]+$/,
	REPORT_NUMBER_REGEX: /^[A-Z0-9-/]+$/,
	ID_REGEX: /^[a-zA-Z0-9_-]+$/,
	COMPANY_CODE_MIN: 3,
	COMPANY_CODE_MAX: 32,
	REPORT_NUMBER_MIN: 3,
	REPORT_NUMBER_MAX: 64,
	NAME_MAX: 180,
	SHORT_NAME_MAX: 120,
	SCOPE_MAX: 1500,
	REQUEST_SCOPE_MAX: 2e3,
	NOTES_MAX: 2e3,
	ADMIN_NOTES_MAX: 1e3,
	MAX_METHODS_PER_REQUEST: 12,
	MAX_TECH_FIELDS: 30,
	MIN_GEOFENCE_RADIUS_M: 50,
	MAX_GEOFENCE_RADIUS_M: 5e4,
	COMMUNITY_POST_TITLE_MAX: 180,
	COMMUNITY_POST_BODY_MAX: 3e3,
	COMMUNITY_COMMENT_MAX: 1500,
	COMMUNITY_SNIPPET_MAX: 600,
	COMMUNITY_AI_SUMMARY_MAX: 800,
	COMMUNITY_HEADLINE_MAX: 160,
	COMMUNITY_CERTS_MAX: 240,
	COMMUNITY_MAX_TAGS: 6
};
function sanitizeUpperCode(raw) {
	return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, BLUEPRINT_LIMITS.COMPANY_CODE_MAX);
}
function sanitizeReportNumber(raw) {
	return raw.trim().toUpperCase().replace(/[^A-Z0-9-/]/g, "-").replace(/-+/g, "-").slice(0, BLUEPRINT_LIMITS.REPORT_NUMBER_MAX);
}
function generateNextCompanyCode(existingCodes, prefix = "INS-CO") {
	const cleanPrefix = sanitizeUpperCode(prefix) || "INS-CO";
	const existingSet = new Set(existingCodes.map((c) => c.trim().toUpperCase()));
	let maxSeq = 100;
	const seqPattern = new RegExp(`^${cleanPrefix}-(\\d+)$`);
	for (const code of existingSet) {
		const match = code.match(seqPattern);
		if (match) {
			const parsed = Number.parseInt(match[1], 10);
			if (Number.isFinite(parsed) && parsed > maxSeq) maxSeq = parsed;
		}
	}
	let candidateNum = maxSeq + 1;
	while (existingSet.has(`${cleanPrefix}-${String(candidateNum).padStart(4, "0")}`)) candidateNum += 1;
	return `${cleanPrefix}-${String(candidateNum).padStart(4, "0")}`;
}
function generateNextReportNumber(companyCode, method, existingNumbers) {
	const base = `${sanitizeUpperCode(companyCode) || "INS-CO"}-${method}-${(/* @__PURE__ */ new Date()).getFullYear()}`;
	const existingSet = new Set(existingNumbers.map((n) => n.trim().toUpperCase()));
	let seq = existingNumbers.length + 1;
	while (existingSet.has(`${base}-${String(seq).padStart(3, "0")}`)) seq += 1;
	return `${base}-${String(seq).padStart(3, "0")}`.slice(0, BLUEPRINT_LIMITS.REPORT_NUMBER_MAX);
}
function generateRequestCode() {
	return `REQ-${(/* @__PURE__ */ new Date()).getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).toUpperCase().slice(2, 4)}`.slice(0, 32);
}
function clampStr(val, max) {
	return (val ?? "").trim().slice(0, max);
}
function generateNextBadgeCode(existingBadges, prefix = "EMP") {
	const cleanPrefix = sanitizeUpperCode(prefix) || "EMP";
	const existingSet = new Set(existingBadges.map((b) => b.trim().toUpperCase()));
	let maxSeq = 100;
	const pattern = new RegExp(`^${cleanPrefix}-(\\d+)$`);
	for (const badge of existingSet) {
		const match = badge.match(pattern);
		if (match) {
			const parsed = Number.parseInt(match[1], 10);
			if (Number.isFinite(parsed) && parsed > maxSeq) maxSeq = parsed;
		}
	}
	let next = maxSeq + 1;
	while (existingSet.has(`${cleanPrefix}-${String(next).padStart(3, "0")}`)) next += 1;
	return `${cleanPrefix}-${String(next).padStart(3, "0")}`;
}
//#endregion
export { generateNextReportNumber as a, sanitizeUpperCode as c, generateNextCompanyCode as i, clampStr as n, generateRequestCode as o, generateNextBadgeCode as r, sanitizeReportNumber as s, BLUEPRINT_LIMITS as t };
