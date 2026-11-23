import { r as __exportAll } from "./rolldown-runtime-oLLnCvco.js";
import { E as evaluateGeofence, k as resolveSiteCoordinates } from "./index-BKrODMj6.js";
import { _ as doc, b as serverTimestamp, c as onSnapshot, d as runTransaction, f as setDoc, g as collection, h as writeBatch, i as getDoc, l as orderBy, m as where, n as addDoc, o as getDocs, p as updateDoc, r as deleteDoc, s as limit, u as query, y as increment } from "./index.esm-T7XjjJ2p.js";
import { S as signOut, _ as sendPasswordResetEmail, b as signInWithPhoneNumber, c as isFirebaseConfigured, d as RecaptchaVerifier, f as browserLocalPersistence, g as sendEmailVerification, h as onAuthStateChanged, i as auth, m as createUserWithEmailAndPassword, n as OperationType, o as db, p as browserSessionPersistence, s as handleFirestoreError, u as GoogleAuthProvider, v as setPersistence, x as signInWithPopup, y as signInWithEmailAndPassword } from "./config-BaEX8mXf.js";
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
//#region src/client/firestoreClientService.ts
var firestoreClientService_exports = /* @__PURE__ */ __exportAll({
	addCommunityPostComment: () => addCommunityPostComment,
	adminApproveAndLinkClientAccount: () => adminApproveAndLinkClientAccount,
	adminUpdateClientRequest: () => adminUpdateClientRequest,
	clearPendingRegistrationDraft: () => clearPendingRegistrationDraft,
	confirmClientPortalVerification: () => confirmClientPortalVerification,
	connectWithCommunityMember: () => connectWithCommunityMember,
	createClientRequest: () => createClientRequest,
	createCommunityOpportunity: () => createCommunityOpportunity,
	createCommunityPost: () => createCommunityPost,
	createCompanyEmployee: () => createCompanyEmployee,
	createCompanyReport: () => createCompanyReport,
	createCompanyWithUniqueCode: () => createCompanyWithUniqueCode,
	createInitialCompanyFromRegistration: () => createInitialCompanyFromRegistration,
	deleteCommunityPost: () => deleteCommunityPost,
	deleteCompanyReport: () => deleteCompanyReport,
	detectUserAuthMethod: () => detectUserAuthMethod,
	endorseMemberWorkspace: () => endorseMemberWorkspace,
	formatClientProfileError: () => formatClientProfileError,
	formatFirebaseAuthError: () => formatFirebaseAuthError,
	getCommunityPostReaction: () => getCommunityPostReaction,
	getCommunityWorkspace: () => getCommunityWorkspace,
	initializeStarterCompaniesArchive: () => initializeStarterCompaniesArchive,
	isCurrentClientUser: () => isCurrentClientUser,
	isPortalFirestoreReady: () => isPortalFirestoreReady,
	isVerifiedAdminUser: () => isVerifiedAdminUser,
	isVerifiedPortalUser: () => isVerifiedPortalUser,
	loadPendingRegistrationDraft: () => loadPendingRegistrationDraft,
	normalizeE164Phone: () => normalizeE164Phone,
	normalizePhoneDigits: () => normalizePhoneDigits,
	observeClientPortalAuth: () => observeClientPortalAuth,
	recordEmployeeAttendance: () => recordEmployeeAttendance,
	resendClientVerificationEmail: () => resendClientVerificationEmail,
	saveClientRegistration: () => saveClientRegistration,
	savePendingRegistrationDraft: () => savePendingRegistrationDraft,
	sendClientPasswordReset: () => sendClientPasswordReset,
	sendClientPhoneOtp: () => sendClientPhoneOtp,
	setCommunityPostReaction: () => setCommunityPostReaction,
	signInClientPortalWithEmail: () => signInClientPortalWithEmail,
	signInClientPortalWithGoogle: () => signInClientPortalWithGoogle,
	signOutClientPortal: () => signOutClientPortal,
	signUpClientPortalWithEmail: () => signUpClientPortalWithEmail,
	subscribeAuthorPublicPosts: () => subscribeAuthorPublicPosts,
	subscribeClientRequests: () => subscribeClientRequests,
	subscribeCommunityOpportunities: () => subscribeCommunityOpportunities,
	subscribeCommunityPosts: () => subscribeCommunityPosts,
	subscribeCommunityWorkspaces: () => subscribeCommunityWorkspaces,
	subscribeCompanies: () => subscribeCompanies,
	subscribeCompanyAttendance: () => subscribeCompanyAttendance,
	subscribeCompanyEmployees: () => subscribeCompanyEmployees,
	subscribeCompanyReports: () => subscribeCompanyReports,
	subscribeMyClientAccount: () => subscribeMyClientAccount,
	subscribeMyCommunityWorkspace: () => subscribeMyCommunityWorkspace,
	subscribeMyConnections: () => subscribeMyConnections,
	subscribePostComments: () => subscribePostComments,
	subscribePostReactions: () => subscribePostReactions,
	updateCommunityOpportunityStatus: () => updateCommunityOpportunityStatus,
	updateCommunityPostModeration: () => updateCommunityPostModeration,
	updateCompanyRecord: () => updateCompanyRecord,
	updateCompanyReportStatus: () => updateCompanyReportStatus,
	updateEmployeeLiveLocation: () => updateEmployeeLiveLocation,
	upsertCommunityWorkspace: () => upsertCommunityWorkspace
});
function isVerifiedAdminUser(user) {
	if (!user) return false;
	return Boolean(user.emailVerified && user.email?.toLowerCase() === "inscondtco@gmail.com".toLowerCase());
}
function isVerifiedPortalUser(user) {
	if (!user) return false;
	if (user.emailVerified) return true;
	return Boolean(user.phoneNumber && user.providerData?.some((p) => p.providerId === "phone"));
}
function detectUserAuthMethod(user) {
	const providers = user?.providerData?.map((p) => p.providerId) ?? [];
	if (providers.includes("phone")) return "phone";
	if (providers.includes("password")) return "email";
	return "google";
}
function normalizePhoneDigits(value) {
	return value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) & 15));
}
function normalizeE164Phone(raw) {
	const trimmed = normalizePhoneDigits(raw).trim().replace(/[\s\-()]/g, "");
	if (!trimmed) return "";
	if (trimmed.startsWith("+")) return trimmed;
	if (trimmed.startsWith("00")) return `+${trimmed.slice(2)}`;
	if (/^01[0125]\d{8}$/.test(trimmed)) return `+2${trimmed}`;
	return `+${trimmed}`;
}
function firebaseErrorCode(err) {
	return err?.code;
}
function formatFirebaseAuthError(err, language) {
	const isAr = language === "ar";
	switch (firebaseErrorCode(err)) {
		case "auth/operation-not-allowed":
		case "auth/admin-restricted-operation": return isAr ? "طريقة الدخول هذه غير مفعّلة. استخدم طريقة أخرى أو تواصل مع دعم إنسكو." : "This sign-in method is not enabled. Use another method or contact INSCO support.";
		case "auth/app-not-authorized":
		case "auth/configuration-not-found": return isAr ? "خدمة إنشاء الحساب غير مهيّأة على هذا الموقع. تواصل مع دعم إنسكو." : "Account registration is not configured for this website. Contact INSCO support.";
		case "auth/unauthorized-domain": return isAr ? "عنوان الموقع الحالي غير معتمد لتسجيل الدخول. افتح بوابة إنسكو من رابطها الرسمي أو تواصل مع الدعم." : "This website address is not authorized for sign-in. Open the official INSCO site or contact support.";
		case "auth/email-already-in-use": return isAr ? "هذا البريد مسجّل بالفعل. اختر «تسجيل الدخول»، أو استخدم «نسيت كلمة المرور؟»." : "This email is already registered. Sign in or use “Forgot password?”.";
		case "auth/account-exists-with-different-credential": return isAr ? "استخدم طريقة تسجيل الدخول التي أنشأت بها الحساب أول مرة." : "Use the sign-in method you originally used to create your account.";
		case "auth/wrong-password":
		case "auth/invalid-credential":
		case "auth/invalid-login-credentials":
		case "auth/user-not-found": return isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. يمكنك طلب رابط لإعادة تعيين كلمة المرور." : "Incorrect email or password. You can request a password reset link.";
		case "auth/invalid-email": return isAr ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.";
		case "auth/weak-password":
		case "auth/password-does-not-meet-requirements": return isAr ? "كلمة المرور لا تستوفي شروط الحساب. اختر كلمة مرور أطول تجمع بين الأحرف والأرقام والرموز." : "The password does not meet the account requirements. Use a longer password with letters, numbers and symbols.";
		case "auth/user-token-expired":
		case "auth/invalid-user-token": return isAr ? "انتهت صلاحية الجلسة. سجّل الخروج ثم ادخل مرة أخرى." : "Your session has expired. Sign out and sign in again.";
		case "auth/user-disabled": return isAr ? "الحساب غير متاح. تواصل مع دعم إنسكو." : "This account is unavailable. Contact INSCO support.";
		case "auth/invalid-phone-number": return isAr ? "صيغة رقم الهاتف غير صحيحة. اكتبه بالصيغة الدولية مثل +2010XXXXXXXX." : "Invalid phone number format. Use international format, e.g. +2010XXXXXXXX.";
		case "auth/invalid-verification-code":
		case "auth/code-expired": return isAr ? "رمز التحقق غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً." : "Invalid or expired SMS verification code. Request a new code.";
		case "auth/billing-not-enabled": return isAr ? "رسائل التحقق غير متاحة حالياً. استخدم البريد الإلكتروني أو حساب Google." : "SMS verification is currently unavailable. Use email or Google sign-in.";
		case "auth/too-many-requests": return isAr ? "محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة." : "Too many attempts. Wait a few minutes and try again.";
		case "auth/network-request-failed": return isAr ? "تعذّر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت وحاول مرة أخرى." : "Could not reach the sign-in service. Check your connection and try again.";
		case "auth/web-storage-unsupported": return isAr ? "المتصفح يمنع حفظ جلسة الدخول. اسمح بتخزين بيانات الموقع أو جرّب متصفحاً آخر." : "The browser blocked session storage. Allow site storage or try another browser.";
		case "auth/popup-blocked": return isAr ? "المتصفح حظر نافذة دخول Google. اسمح بالنوافذ المنبثقة ثم حاول مجدداً." : "The browser blocked Google sign-in. Allow popups and try again.";
		case "auth/popup-closed-by-user": return isAr ? "أُغلقت نافذة تسجيل الدخول بحساب Google قبل الإتمام." : "The Google sign-in window was closed before completing.";
		default: return isAr ? "تعذّر إتمام العملية. حاول مرة أخرى، أو تواصل مع دعم إنسكو إذا استمرت المشكلة." : "Could not complete the operation. Try again or contact INSCO support if it persists.";
	}
}
async function prepareClientSession(rememberMe) {
	if (!auth) throw new Error("Firebase Auth is not initialized");
	try {
		await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
	} catch {
		throw Object.assign(/* @__PURE__ */ new Error("Could not set browser session persistence"), { code: "auth/web-storage-unsupported" });
	}
	return auth;
}
async function signInClientPortalWithGoogle(rememberMe) {
	const clientAuth = rememberMe === void 0 ? auth : await prepareClientSession(rememberMe);
	if (!clientAuth) throw new Error("Firebase Auth is not initialized");
	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({ prompt: "select_account" });
	return (await signInWithPopup(clientAuth, provider)).user;
}
async function signUpClientPortalWithEmail(email, password, rememberMe) {
	const clientAuth = await prepareClientSession(rememberMe);
	return (await createUserWithEmailAndPassword(clientAuth, email.trim(), password)).user;
}
async function signInClientPortalWithEmail(email, password, rememberMe) {
	const clientAuth = await prepareClientSession(rememberMe);
	return (await signInWithEmailAndPassword(clientAuth, email.trim(), password)).user;
}
async function confirmClientPortalVerification(user, refresh = false) {
	if (refresh) await user.reload();
	if (!isVerifiedPortalUser(user)) return false;
	const isVerifiedToken = ({ claims, signInProvider }) => claims.email_verified === true || signInProvider === "phone" && typeof claims.phone_number === "string" && claims.phone_number.length >= 5;
	if (!refresh && isVerifiedToken(await user.getIdTokenResult())) return true;
	return isVerifiedToken(await user.getIdTokenResult(true));
}
async function resendClientVerificationEmail(user) {
	await sendEmailVerification(user);
}
async function sendClientPasswordReset(email) {
	if (!auth) throw new Error("Firebase Auth is not initialized");
	try {
		await sendPasswordResetEmail(auth, email.trim());
	} catch (err) {
		if (!["auth/user-not-found", "auth/user-disabled"].includes(firebaseErrorCode(err) ?? "")) throw err;
	}
}
async function sendClientPhoneOtp(rawPhone, recaptchaContainerId, rememberMe) {
	const e164Phone = normalizeE164Phone(rawPhone);
	if (!/^\+[1-9]\d{7,14}$/.test(e164Phone)) throw Object.assign(/* @__PURE__ */ new Error("Invalid phone number"), { code: "auth/invalid-phone-number" });
	const clientAuth = await prepareClientSession(rememberMe);
	const verifier = new RecaptchaVerifier(clientAuth, recaptchaContainerId, { size: "invisible" });
	try {
		return await signInWithPhoneNumber(clientAuth, e164Phone, verifier);
	} finally {
		try {
			verifier.clear();
		} catch {}
	}
}
async function signOutClientPortal() {
	if (!auth) return;
	await signOut(auth);
}
function observeClientPortalAuth(callback) {
	if (!auth) {
		callback(null);
		return () => {};
	}
	return onAuthStateChanged(auth, callback);
}
function isPortalFirestoreReady() {
	return Boolean(isFirebaseConfigured && db && auth);
}
var LEGACY_REG_DRAFT_KEY_PREFIX = "insco_pending_client_reg_v1_";
var pendingRegistration = null;
function isCurrentClientUser(uid) {
	return auth?.currentUser?.uid === uid;
}
function pickRegistrationDraft(value) {
	if (!value || typeof value !== "object") return null;
	const source = value;
	const { fullName, phone, organizationName } = source;
	if (typeof fullName !== "string" || typeof phone !== "string" || typeof organizationName !== "string") return null;
	const draft = {
		fullName,
		phone,
		organizationName
	};
	for (const field of [
		"personalEmail",
		"jobTitle",
		"nationalId",
		"secondaryPhone",
		"personalAddress",
		"organizationNameEn",
		"sector",
		"commercialRegNo",
		"taxCardNo",
		"companyPhone",
		"companyEmail",
		"website",
		"companyAddress",
		"cityGovernorate",
		"activeScope",
		"requestedCompanyCode"
	]) {
		const val = source[field];
		if (typeof val === "string") draft[field] = val;
	}
	if (typeof source.autoCreateCompanyWorkspace === "boolean") draft.autoCreateCompanyWorkspace = source.autoCreateCompanyWorkspace;
	return draft;
}
function savePendingRegistrationDraft(uid, draft) {
	if (!isCurrentClientUser(uid)) return false;
	const safe = pickRegistrationDraft(draft);
	if (!safe) return false;
	pendingRegistration = {
		uid,
		draft: safe
	};
	return true;
}
function loadPendingRegistrationDraft(uid) {
	if (!isCurrentClientUser(uid)) return null;
	if (pendingRegistration?.uid === uid) return pendingRegistration.draft;
	try {
		const key = `${LEGACY_REG_DRAFT_KEY_PREFIX}${uid}`;
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		localStorage.removeItem(key);
		const draft = pickRegistrationDraft(JSON.parse(raw));
		if (!draft) return null;
		pendingRegistration = {
			uid,
			draft
		};
		return draft;
	} catch {
		return null;
	}
}
function clearPendingRegistrationDraft(uid) {
	if (pendingRegistration?.uid === uid) pendingRegistration = null;
}
function formatClientProfileError(err, language) {
	const isAr = language === "ar";
	switch (firebaseErrorCode(err)) {
		case "unauthenticated": return isAr ? "سجّل الدخول مرة أخرى ثم أعد المحاولة." : "Sign in again and retry.";
		case "permission-denied": return isAr ? "قاعدة البيانات رفضت العملية. تأكّد من تفعيل حسابك، وتواصل مع دعم إنسكو إذا استمرت المشكلة." : "The database denied the operation. Check that your account is verified or contact INSCO support.";
		case "unavailable":
		case "deadline-exceeded": return isAr ? "تعذّر الاتصال بقاعدة البيانات. تحقق من الإنترنت ثم أعد المحاولة." : "Could not reach the database. Check your internet connection and retry.";
		default: return isAr ? "تعذّر إتمام العملية. أعد المحاولة." : "Could not complete the operation. Try again.";
	}
}
function requireCurrentClient(user) {
	if (!isCurrentClientUser(user.uid)) throw Object.assign(/* @__PURE__ */ new Error("Client session changed"), { code: "unauthenticated" });
}
async function saveClientRegistration(user, input, { createOnly = false } = {}) {
	if (!db) throw new Error("Firestore not initialized");
	requireCurrentClient(user);
	const docRef = doc(db, "client_accounts", user.uid);
	const reqCode = sanitizeUpperCode(input.requestedCompanyCode ?? "");
	const resolvedEmail = clampStr(input.personalEmail, 160) || clampStr(user.email ?? void 0, 160) || `${user.uid.slice(0, 12)}@phone.insco.local`;
	const resolvedPhone = clampStr(input.phone, 40) || clampStr(user.phoneNumber ?? void 0, 40);
	const extendedFields = {
		fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		email: resolvedEmail,
		phone: resolvedPhone,
		organizationName: clampStr(input.organizationName, 160),
		requestedCompanyCode: reqCode,
		sector: clampStr(input.sector, 80),
		jobTitle: clampStr(input.jobTitle, 120),
		nationalId: clampStr(input.nationalId, 40),
		secondaryPhone: clampStr(input.secondaryPhone, 40),
		personalAddress: clampStr(input.personalAddress, 240),
		organizationNameEn: clampStr(input.organizationNameEn, 180),
		commercialRegNo: clampStr(input.commercialRegNo, 64),
		taxCardNo: clampStr(input.taxCardNo, 64),
		companyPhone: clampStr(input.companyPhone, 40),
		companyEmail: clampStr(input.companyEmail, 160),
		website: clampStr(input.website, 200),
		companyAddress: clampStr(input.companyAddress, 240),
		cityGovernorate: clampStr(input.cityGovernorate, 100),
		activeScope: clampStr(input.activeScope, 1e3)
	};
	return runTransaction(db, async (transaction) => {
		const snapshot = await transaction.get(docRef);
		requireCurrentClient(user);
		if (snapshot.exists()) {
			if (createOnly) return "existing";
			transaction.update(docRef, {
				...extendedFields,
				updatedAt: serverTimestamp()
			});
			return "updated";
		}
		const isAdmin = isVerifiedAdminUser(user);
		transaction.set(docRef, {
			uid: user.uid,
			...extendedFields,
			authMethod: detectUserAuthMethod(user),
			assignedCompanyId: "",
			assignedCompanyCode: "",
			role: isAdmin ? "admin" : "client",
			approvalStatus: isAdmin ? "approved" : "pending",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		return "created";
	});
}
async function createInitialCompanyFromRegistration(user, draft) {
	requireCurrentClient(user);
	return createCompanyWithUniqueCode(user.uid, {
		nameAr: draft.organizationName.trim(),
		nameEn: (draft.organizationNameEn || draft.organizationName).trim(),
		archiveCategory: "new_onboarding",
		hasActiveTestingDossier: true,
		sector: draft.sector?.trim() || "Industrial & Contracting",
		commercialRegNo: draft.commercialRegNo?.trim(),
		contactEmail: draft.companyEmail?.trim(),
		contactPhone: draft.companyPhone?.trim(),
		projectLocation: (draft.cityGovernorate || draft.companyAddress || "").trim(),
		activeScope: draft.activeScope?.trim(),
		legacySinceYear: String((/* @__PURE__ */ new Date()).getFullYear()),
		assignedClientUid: user.uid
	});
}
function subscribeMyClientAccount(uid, onData, onError) {
	if (!db) {
		onData(null);
		return () => {};
	}
	return onSnapshot(doc(db, "client_accounts", uid), { includeMetadataChanges: true }, (snap) => {
		if (!isCurrentClientUser(uid) || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
		onData(snap.exists() ? snap.data() : null);
	}, onError);
}
async function adminApproveAndLinkClientAccount(params) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `client_accounts/${params.clientUid}`;
	const batch = writeBatch(db);
	batch.update(doc(db, "client_accounts", params.clientUid), {
		approvalStatus: params.approvalStatus,
		assignedCompanyId: params.company?.id ?? "",
		assignedCompanyCode: params.company?.companyCode ?? "",
		updatedAt: serverTimestamp()
	});
	if (params.company) {
		batch.update(doc(db, "companies", params.company.id), {
			assignedClientUid: params.clientUid,
			updatedAt: serverTimestamp()
		});
		const reportsSnap = await getDocs(collection(db, "companies", params.company.id, "reports"));
		for (const rDoc of reportsSnap.docs) batch.update(rDoc.ref, {
			assignedClientUid: params.clientUid,
			updatedAt: serverTimestamp()
		});
	}
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function createClientRequest(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const path = "client_requests";
	const requestCode = generateRequestCode();
	const cleanMethods = input.serviceMethods.map((m) => clampStr(m, 32)).filter(Boolean).slice(0, BLUEPRINT_LIMITS.MAX_METHODS_PER_REQUEST);
	try {
		await addDoc(collection(db, "client_requests"), {
			requestCode,
			submittedByUid: user.uid,
			submittedByEmail: clampStr(user.email || "client@insco.local", 160),
			companyName: clampStr(input.companyName, 160),
			companyCode: sanitizeUpperCode(input.companyCode ?? ""),
			contactName: clampStr(input.contactName, 120),
			phone: clampStr(input.phone, 40),
			serviceMethods: cleanMethods.length > 0 ? cleanMethods : ["NDT"],
			projectLocation: clampStr(input.projectLocation, 180),
			urgency: input.urgency,
			scopeSummary: clampStr(input.scopeSummary, BLUEPRINT_LIMITS.REQUEST_SCOPE_MAX),
			status: "new",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		return requestCode;
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
async function adminUpdateClientRequest(requestId, updates) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `client_requests/${requestId}`;
	try {
		await updateDoc(doc(db, "client_requests", requestId), {
			status: updates.status,
			adminNotes: clampStr(updates.adminNotes, BLUEPRINT_LIMITS.ADMIN_NOTES_MAX),
			companyCode: sanitizeUpperCode(updates.companyCode ?? ""),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeClientRequests(uid, isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "client_requests";
	const q = isAdmin ? query(collection(db, "client_requests"), orderBy("createdAt", "desc")) : query(collection(db, "client_requests"), where("submittedByUid", "==", uid));
	return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
		if (!isCurrentClientUser(uid) || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
		const requests = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		if (!isAdmin) requests.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
		onData(requests);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function createCompanyWithUniqueCode(creatorUid, input) {
	if (!db) throw new Error("Firestore not initialized");
	const companyRef = doc(collection(db, "companies"));
	const companyCode = sanitizeUpperCode(input.companyCode ?? `INS-CO-${companyRef.id}`);
	if (companyCode.length < BLUEPRINT_LIMITS.COMPANY_CODE_MIN || !BLUEPRINT_LIMITS.COMPANY_CODE_REGEX.test(companyCode)) throw new Error("Invalid company code format");
	const codeRef = doc(db, "company_codes", companyCode);
	const path = `companies/${companyRef.id}`;
	const siteCoords = resolveSiteCoordinates({
		siteLat: input.siteLat,
		siteLng: input.siteLng,
		geofenceRadiusMeters: input.geofenceRadiusMeters,
		projectLocation: input.projectLocation
	});
	const payload = {
		companyCode,
		nameAr: clampStr(input.nameAr, BLUEPRINT_LIMITS.NAME_MAX),
		nameEn: clampStr(input.nameEn, BLUEPRINT_LIMITS.NAME_MAX),
		archiveCategory: input.archiveCategory,
		hasActiveTestingDossier: input.hasActiveTestingDossier,
		sector: clampStr(input.sector, 100),
		commercialRegNo: clampStr(input.commercialRegNo, 64),
		contactPerson: clampStr(input.contactPerson, 120),
		contactEmail: clampStr(input.contactEmail, 160),
		contactPhone: clampStr(input.contactPhone, 40),
		projectLocation: clampStr(input.projectLocation, 180),
		activeScope: clampStr(input.activeScope, BLUEPRINT_LIMITS.SCOPE_MAX),
		assignedClientUid: clampStr(input.assignedClientUid ?? creatorUid, 128),
		legacySinceYear: clampStr(input.legacySinceYear, 16),
		reportsCount: 0,
		siteLat: siteCoords.lat,
		siteLng: siteCoords.lng,
		geofenceRadiusMeters: siteCoords.geofenceRadiusMeters,
		createdByUid: creatorUid,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	const batch = writeBatch(db);
	batch.set(companyRef, payload);
	batch.set(codeRef, {
		companyCode,
		companyId: companyRef.id,
		createdByUid: creatorUid,
		createdAt: serverTimestamp()
	});
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: companyRef.id,
		...payload
	};
}
async function updateCompanyRecord(companyId, updates) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `companies/${companyId}`;
	try {
		await updateDoc(doc(db, "companies", companyId), {
			...updates.nameAr !== void 0 && { nameAr: clampStr(updates.nameAr, 180) },
			...updates.nameEn !== void 0 && { nameEn: clampStr(updates.nameEn, 180) },
			...updates.archiveCategory !== void 0 && { archiveCategory: updates.archiveCategory },
			...updates.hasActiveTestingDossier !== void 0 && { hasActiveTestingDossier: updates.hasActiveTestingDossier },
			...updates.sector !== void 0 && { sector: clampStr(updates.sector, 100) },
			...updates.commercialRegNo !== void 0 && { commercialRegNo: clampStr(updates.commercialRegNo, 64) },
			...updates.contactPerson !== void 0 && { contactPerson: clampStr(updates.contactPerson, 120) },
			...updates.contactEmail !== void 0 && { contactEmail: clampStr(updates.contactEmail, 160) },
			...updates.contactPhone !== void 0 && { contactPhone: clampStr(updates.contactPhone, 40) },
			...updates.projectLocation !== void 0 && { projectLocation: clampStr(updates.projectLocation, 180) },
			...updates.activeScope !== void 0 && { activeScope: clampStr(updates.activeScope, BLUEPRINT_LIMITS.SCOPE_MAX) },
			...updates.legacySinceYear !== void 0 && { legacySinceYear: clampStr(updates.legacySinceYear, 16) },
			...typeof updates.siteLat === "number" && Number.isFinite(updates.siteLat) && { siteLat: Math.max(-90, Math.min(90, updates.siteLat)) },
			...typeof updates.siteLng === "number" && Number.isFinite(updates.siteLng) && { siteLng: Math.max(-180, Math.min(180, updates.siteLng)) },
			...typeof updates.geofenceRadiusMeters === "number" && Number.isFinite(updates.geofenceRadiusMeters) && { geofenceRadiusMeters: Math.max(BLUEPRINT_LIMITS.MIN_GEOFENCE_RADIUS_M, Math.min(BLUEPRINT_LIMITS.MAX_GEOFENCE_RADIUS_M, Math.round(updates.geofenceRadiusMeters))) },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeCompanies(uid, isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "companies";
	const q = isAdmin ? query(collection(db, "companies"), orderBy("companyCode", "asc")) : query(collection(db, "companies"), where("assignedClientUid", "==", uid));
	return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
		if (!isCurrentClientUser(uid) || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => a.companyCode.localeCompare(b.companyCode));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
function sanitizeTechnicalData(raw) {
	const result = {};
	let count = 0;
	for (const [k, v] of Object.entries(raw)) {
		if (count >= BLUEPRINT_LIMITS.MAX_TECH_FIELDS) break;
		if (v === void 0 || v === null || v === "") continue;
		if (k === "customFields" && Array.isArray(v)) {
			result.customFields = v.filter((r) => r && typeof r.label === "string" && r.label.trim().length > 0).slice(0, 15).map((r) => ({
				label: clampStr(r.label, 80),
				value: clampStr(String(r.value ?? ""), 160),
				unit: clampStr(r.unit ?? "", 24)
			}));
			count += 1;
		} else if (typeof v === "string") {
			result[clampStr(k, 64)] = clampStr(v, 300);
			count += 1;
		} else if (typeof v === "number" || typeof v === "boolean") {
			result[clampStr(k, 64)] = v;
			count += 1;
		}
	}
	return result;
}
async function createCompanyReport(adminUid, company, input) {
	if (!db) throw new Error("Firestore not initialized");
	const reportRef = doc(collection(db, "companies", company.id, "reports"));
	const path = `companies/${company.id}/reports/${reportRef.id}`;
	const cleanNumber = sanitizeReportNumber(input.reportNumber);
	const batch = writeBatch(db);
	batch.set(reportRef, {
		companyId: company.id,
		companyCode: company.companyCode,
		assignedClientUid: company.assignedClientUid || "",
		reportNumber: cleanNumber,
		templateKey: clampStr(input.templateKey, 64) || "custom_template_v1",
		method: input.method,
		isLegacyArchive: input.isLegacyArchive,
		projectName: clampStr(input.projectName, 180),
		clientPoNumber: clampStr(input.clientPoNumber, 80),
		componentOrJointId: clampStr(input.componentOrJointId, 160),
		materialSpec: clampStr(input.materialSpec, 100),
		thicknessMm: clampStr(input.thicknessMm, 40),
		codeStandard: clampStr(input.codeStandard, 120),
		inspectorName: clampStr(input.inspectorName, 120),
		inspectionDate: clampStr(input.inspectionDate, 20),
		verdict: input.verdict,
		status: input.status,
		technicalData: sanitizeTechnicalData(input.technicalData),
		notes: clampStr(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
		createdByUid: adminUid,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
	batch.update(doc(db, "companies", company.id), {
		reportsCount: increment(1),
		updatedAt: serverTimestamp()
	});
	try {
		await batch.commit();
		return reportRef.id;
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
async function updateCompanyReportStatus(companyId, reportId, updates) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `companies/${companyId}/reports/${reportId}`;
	try {
		await updateDoc(doc(db, "companies", companyId, "reports", reportId), {
			status: updates.status,
			verdict: updates.verdict,
			...updates.notes !== void 0 && { notes: clampStr(updates.notes, BLUEPRINT_LIMITS.NOTES_MAX) },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function deleteCompanyReport(companyId, reportId) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `companies/${companyId}/reports/${reportId}`;
	const batch = writeBatch(db);
	batch.delete(doc(db, "companies", companyId, "reports", reportId));
	batch.update(doc(db, "companies", companyId), {
		reportsCount: increment(-1),
		updatedAt: serverTimestamp()
	});
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.DELETE, path);
	}
}
function subscribeCompanyReports(companyId, uid, isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `companies/${companyId}/reports`;
	const q = isAdmin ? query(collection(db, "companies", companyId, "reports"), orderBy("inspectionDate", "desc")) : query(collection(db, "companies", companyId, "reports"), where("assignedClientUid", "==", uid));
	return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
		if (!isCurrentClientUser(uid) || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => (b.inspectionDate || "").localeCompare(a.inspectionDate || ""));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function initializeStarterCompaniesArchive(adminUid, existingCompanies) {
	if (existingCompanies.length > 0) return 0;
	const starterDefinitions = [
		{
			code: generateNextCompanyCode([]),
			nameAr: "سيمنس للطاقة - مشروع محطة كهرباء البرلس 4800 ميجاوات",
			nameEn: "Siemens Energy — Burullus 4800 MW Power Plant",
			archiveCategory: "active_testing",
			hasActiveTestingDossier: true,
			sector: "Power Generation & Energy",
			commercialRegNo: "CR-EG-4800-SM",
			contactPerson: "QA/QC Lead Engineer",
			contactEmail: "qa-burullus@client.example",
			contactPhone: "+20 100 000 0101",
			projectLocation: "Kafr El-Sheikh / Burullus, Egypt",
			activeScope: "HP/LP Steam Piping PAUT, Gamma RT, 65kW PWHT Cycles & Hardness Testing",
			legacySinceYear: "2017"
		},
		{
			code: "INS-CO-0102",
			nameAr: "أوراسكوم للإنشاءات - قطاع البنية الصناعية والطاقة",
			nameEn: "Orascom Construction — Industrial & Power Division",
			archiveCategory: "active_testing",
			hasActiveTestingDossier: true,
			sector: "EPC & Heavy Contracting",
			commercialRegNo: "CR-EG-2204-OR",
			contactPerson: "Senior Welding & NDT Coordinator",
			contactEmail: "ndt-coord@client.example",
			contactPhone: "+20 100 000 0102",
			projectLocation: "New Administrative Capital & Suez, Egypt",
			activeScope: "Structural & Process Piping UT/RT, MT/PT Surface Inspection & Hydrostatic Witness",
			legacySinceYear: "2015"
		},
		{
			code: "INS-CO-0103",
			nameAr: "بترومسيلة للاستكشاف والإنتاج - أرشيف عقود سابقة",
			nameEn: "PetroMasila Exploration & Production — Legacy Archive",
			archiveCategory: "legacy_archive",
			hasActiveTestingDossier: false,
			sector: "Oil & Gas Upstream",
			commercialRegNo: "CR-YE-1409-PM",
			contactPerson: "Field Integrity Department",
			contactEmail: "integrity@client.example",
			contactPhone: "+967 00 000 103",
			projectLocation: "Hadhramaut Sector 14, Yemen",
			activeScope: "Archived RT/UT Tank & Pipeline Inspection Dossiers & PWHT Charts (2014–2019)",
			legacySinceYear: "2014"
		}
	];
	let created = 0;
	for (const item of starterDefinitions) {
		const company = await createCompanyWithUniqueCode(adminUid, {
			companyCode: item.code,
			nameAr: item.nameAr,
			nameEn: item.nameEn,
			archiveCategory: item.archiveCategory,
			hasActiveTestingDossier: item.hasActiveTestingDossier,
			sector: item.sector,
			commercialRegNo: item.commercialRegNo,
			contactPerson: item.contactPerson,
			contactEmail: item.contactEmail,
			contactPhone: item.contactPhone,
			projectLocation: item.projectLocation,
			activeScope: item.activeScope,
			legacySinceYear: item.legacySinceYear,
			assignedClientUid: ""
		});
		if (item.hasActiveTestingDossier) await createCompanyReport(adminUid, company, {
			reportNumber: `${company.companyCode}-RT-2026-001`,
			templateKey: "rt_weld_v1",
			method: "RT",
			isLegacyArchive: true,
			projectName: item.nameEn,
			clientPoNumber: "PO-2025-8841",
			componentOrJointId: "LINE-MS-104-W12",
			materialSpec: "ASTM A335 P91",
			thicknessMm: "32",
			codeStandard: "ASME B31.1 / Sec V Art. 2",
			inspectorName: "INSCO NDT Level III Lead",
			inspectionDate: "2026-01-15",
			verdict: "ACCEPT",
			status: "archived",
			technicalData: {
				radiationSource: "Ir-192",
				sourceActivityCi: "44",
				sfdMm: "650",
				technique: "DWSI",
				filmClass: "AGFA D7",
				iqiType: "ASTM 1C",
				filmDensity: "2.65",
				discontinuityNotes: "No rejectable indications observed."
			},
			notes: "Legacy archived dossier baseline record."
		});
		created += 1;
	}
	return created;
}
async function createCompanyEmployee(actorUid, company, input) {
	if (!db) throw new Error("Firestore not initialized");
	const empRef = doc(collection(db, "companies", company.id, "employees"));
	const path = `companies/${company.id}/employees/${empRef.id}`;
	const cleanBadge = sanitizeUpperCode(input.badgeCode) || "EMP-101";
	const ownerUid = company.assignedClientUid || actorUid;
	const payload = {
		companyId: company.id,
		companyCode: company.companyCode,
		ownerUid,
		workerUid: clampStr(input.workerUid, 128),
		fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		roleTitle: clampStr(input.roleTitle, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		badgeCode: cleanBadge.slice(0, 40),
		phone: clampStr(input.phone, 40),
		faceEnrolled: Boolean(input.faceEnrolled),
		faceDigest: clampStr(input.faceDigest, 128),
		...typeof input.lastLat === "number" && Number.isFinite(input.lastLat) && { lastLat: input.lastLat },
		...typeof input.lastLng === "number" && Number.isFinite(input.lastLng) && { lastLng: input.lastLng },
		lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
		onlineStatus: "off_duty",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(empRef, payload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: empRef.id,
		...payload
	};
}
async function updateEmployeeLiveLocation(companyId, employeeId, coords) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `companies/${companyId}/employees/${employeeId}`;
	try {
		await updateDoc(doc(db, "companies", companyId, "employees", employeeId), {
			lastLat: Math.max(-90, Math.min(90, coords.lat)),
			lastLng: Math.max(-180, Math.min(180, coords.lng)),
			lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
			...coords.onlineStatus !== void 0 && { onlineStatus: coords.onlineStatus },
			...coords.faceEnrolled !== void 0 && { faceEnrolled: coords.faceEnrolled },
			...coords.faceDigest !== void 0 && { faceDigest: clampStr(coords.faceDigest, 128) },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeCompanyEmployees(companyId, uid, isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `companies/${companyId}/employees`;
	const q = isAdmin ? query(collection(db, "companies", companyId, "employees"), orderBy("badgeCode", "asc")) : query(collection(db, "companies", companyId, "employees"), where("ownerUid", "==", uid));
	return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
		if (!isCurrentClientUser(uid) || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => a.badgeCode.localeCompare(b.badgeCode));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function recordEmployeeAttendance(params) {
	if (!db) throw new Error("Firestore not initialized");
	const logRef = doc(collection(db, "companies", params.company.id, "attendance"));
	const path = `companies/${params.company.id}/attendance/${logRef.id}`;
	const site = resolveSiteCoordinates(params.company);
	const evaluation = evaluateGeofence({
		workerLat: params.lat,
		workerLng: params.lng,
		siteLat: site.lat,
		siteLng: site.lng,
		radiusMeters: site.geofenceRadiusMeters
	});
	const timestampIso = (/* @__PURE__ */ new Date()).toISOString();
	const nextStatus = evaluation.status === "outside_geofence" && params.eventType === "check_in" ? "alert" : params.eventType === "check_in" ? "on_site" : "off_duty";
	const logPayload = {
		companyId: params.company.id,
		companyCode: params.company.companyCode,
		ownerUid: params.company.assignedClientUid || params.actorUid,
		employeeId: params.employee.id,
		employeeName: clampStr(params.employee.fullName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		workerUid: params.actorUid,
		eventType: params.eventType,
		lat: Math.max(-90, Math.min(90, params.lat)),
		lng: Math.max(-180, Math.min(180, params.lng)),
		...typeof params.accuracyMeters === "number" && Number.isFinite(params.accuracyMeters) && { accuracyMeters: Math.max(0, Math.min(5e4, Math.round(params.accuracyMeters))) },
		distanceFromSiteMeters: evaluation.distanceMeters,
		geofenceRadiusMeters: evaluation.radiusMeters,
		geofenceStatus: evaluation.status,
		faceVerified: Boolean(params.faceVerified),
		...params.faceSnapshotHash && { faceSnapshotHash: clampStr(params.faceSnapshotHash, 128) },
		verificationMethod: params.verificationMethod,
		...params.deviceLabel && { deviceLabel: clampStr(params.deviceLabel, 120) },
		...params.notes && { notes: clampStr(params.notes, 500) },
		timestampIso,
		createdAt: serverTimestamp()
	};
	const batch = writeBatch(db);
	batch.set(logRef, logPayload);
	batch.update(doc(db, "companies", params.company.id, "employees", params.employee.id), {
		lastLat: logPayload.lat,
		lastLng: logPayload.lng,
		lastSeenAt: timestampIso,
		onlineStatus: nextStatus,
		...params.faceVerified && params.faceSnapshotHash && {
			faceEnrolled: true,
			faceDigest: clampStr(params.faceSnapshotHash, 128)
		},
		updatedAt: serverTimestamp()
	});
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: logRef.id,
		...logPayload
	};
}
function subscribeCompanyAttendance(companyId, uid, isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `companies/${companyId}/attendance`;
	const q = isAdmin ? query(collection(db, "companies", companyId, "attendance"), orderBy("timestampIso", "desc")) : query(collection(db, "companies", companyId, "attendance"), where("ownerUid", "==", uid));
	return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
		if (!isCurrentClientUser(uid) || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => (b.timestampIso || "").localeCompare(a.timestampIso || ""));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function upsertCommunityWorkspace(user, input, existing) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_workspaces/${user.uid}`;
	const docRef = doc(db, "community_workspaces", user.uid);
	const sharedFields = {
		displayName: clampStr(input.displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		organizationName: clampStr(input.organizationName, 160),
		sector: clampStr(input.sector, 100),
		city: clampStr(input.city, 100),
		companyCode: sanitizeUpperCode(input.companyCode ?? ""),
		specialtyTrades: clampStr(input.specialtyTrades, 300),
		bio: clampStr(input.bio, 600),
		companiesManaged: Math.max(0, Math.min(1e4, Math.round(input.companiesManaged))),
		isPublished: Boolean(input.isPublished),
		...input.headline !== void 0 && { headline: clampStr(input.headline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX) },
		...input.certifications !== void 0 && { certifications: clampStr(input.certifications, BLUEPRINT_LIMITS.COMMUNITY_CERTS_MAX) },
		...typeof input.yearsExperience === "number" && Number.isFinite(input.yearsExperience) && { yearsExperience: Math.max(0, Math.min(70, Math.round(input.yearsExperience))) },
		...input.availabilityStatus !== void 0 && { availabilityStatus: input.availabilityStatus },
		...input.profileVisibility !== void 0 && { profileVisibility: input.profileVisibility },
		...input.photoURL ? { photoURL: input.photoURL } : {},
		...input.bannerURL ? { bannerURL: input.bannerURL } : {},
		...input.linkedInUrl ? { linkedInUrl: input.linkedInUrl } : {},
		...input.skills !== void 0 && { skills: String(input.skills).toLowerCase().replace(/[^a-z0-9_,]/g, "").replace(/,+/g, ",").replace(/^,|,$/g, "").slice(0, 700).replace(/,+$/, "") },
		updatedAt: serverTimestamp()
	};
	try {
		if (!existing) await setDoc(docRef, {
			uid: user.uid,
			...sharedFields,
			followersCount: 0,
			endorsementsCount: 0,
			createdAt: serverTimestamp()
		});
		else await updateDoc(docRef, sharedFields);
	} catch (err) {
		handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, path);
	}
}
async function endorseMemberWorkspace(targetUid) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_workspaces/${targetUid}`;
	try {
		await updateDoc(doc(db, "community_workspaces", targetUid), {
			endorsementsCount: increment(1),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeMyCommunityWorkspace(uid, onData, onError) {
	if (!db) {
		onData(null);
		return () => {};
	}
	const path = `community_workspaces/${uid}`;
	return onSnapshot(doc(db, "community_workspaces", uid), (snap) => {
		onData(snap.exists() ? snap.data() : null);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.GET, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
/**
* Read one member's card for the public page.
*
* A one-shot `getDoc` rather than a listener: a visitor's page does not need live
* updates, and a `get` is what `firestore.rules` gates for `profileVisibility`.
*/
async function getCommunityWorkspace(uid) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_workspaces/${uid}`;
	try {
		const snapshot = await getDoc(doc(db, "community_workspaces", uid));
		return snapshot.exists() ? snapshot.data() : null;
	} catch (err) {
		handleFirestoreError(err, OperationType.GET, path);
	}
}
/**
* A member's own public posts, for their public page.
*
* The query is constrained to `visibility == 'public'`, which is exactly what the
* list rule can prove for a signed-out reader — so the page works without a session
* and never leaks a members-only post into it.
*/
function subscribeAuthorPublicPosts(authorUid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_posts";
	const q = query(collection(db, "community_posts"), where("authorUid", "==", authorUid), where("visibility", "==", "public"), limit(30));
	return onSnapshot(q, (snap) => {
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
function subscribeCommunityWorkspaces(isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_workspaces";
	const q = isAdmin ? query(collection(db, "community_workspaces"), orderBy("updatedAt", "desc")) : query(collection(db, "community_workspaces"), where("isPublished", "==", true));
	return onSnapshot(q, (snap) => {
		const list = snap.docs.map((d) => d.data());
		list.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function createCommunityPost(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const postRef = doc(collection(db, "community_posts"));
	const path = `community_posts/${postRef.id}`;
	const cleanTags = (input.tags ?? []).map((t) => clampStr(t.replace(/^#/, ""), 32)).filter(Boolean).slice(0, BLUEPRINT_LIMITS.COMMUNITY_MAX_TAGS);
	const allowPinned = isVerifiedAdminUser(user) && Boolean(input.isPinnedAnnouncement);
	const payload = {
		authorUid: user.uid,
		authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		...input.authorHeadline && { authorHeadline: clampStr(input.authorHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX) },
		authorOrg: clampStr(input.authorOrg, 160),
		...input.authorCompanyCode && { authorCompanyCode: sanitizeUpperCode(input.authorCompanyCode) },
		postType: input.postType,
		ndtMethod: input.ndtMethod,
		title: clampStr(input.title, BLUEPRINT_LIMITS.COMMUNITY_POST_TITLE_MAX),
		body: clampStr(input.body, BLUEPRINT_LIMITS.COMMUNITY_POST_BODY_MAX),
		...cleanTags.length > 0 && { tags: cleanTags },
		...input.technicalSnippet && { technicalSnippet: clampStr(input.technicalSnippet, BLUEPRINT_LIMITS.COMMUNITY_SNIPPET_MAX) },
		...input.aiSummary && { aiSummary: clampStr(input.aiSummary, BLUEPRINT_LIMITS.COMMUNITY_AI_SUMMARY_MAX) },
		likesCount: 0,
		commentsCount: 0,
		visibility: input.visibility ?? "public",
		aiModerationStatus: "approved",
		isPinnedAnnouncement: allowPinned,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(postRef, payload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: postRef.id,
		...payload
	};
}
async function updateCommunityPostModeration(postId, updates) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}`;
	try {
		await updateDoc(doc(db, "community_posts", postId), {
			...updates.aiModerationStatus !== void 0 && { aiModerationStatus: updates.aiModerationStatus },
			...updates.isPinnedAnnouncement !== void 0 && { isPinnedAnnouncement: updates.isPinnedAnnouncement },
			...updates.aiSummary !== void 0 && { aiSummary: clampStr(updates.aiSummary, BLUEPRINT_LIMITS.COMMUNITY_AI_SUMMARY_MAX) },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function deleteCommunityPost(postId) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}`;
	try {
		await deleteDoc(doc(db, "community_posts", postId));
	} catch (err) {
		handleFirestoreError(err, OperationType.DELETE, path);
	}
}
function createdAtMs(ts) {
	if (ts && typeof ts === "object" && "toMillis" in ts && typeof ts.toMillis === "function") return ts.toMillis();
	return 0;
}
function subscribeCommunityPosts(isAdmin, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_posts";
	const q = isAdmin ? query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(60)) : query(collection(db, "community_posts"), where("visibility", "==", "public"), limit(60));
	return onSnapshot(q, (snap) => {
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => {
			if (a.isPinnedAnnouncement !== b.isPinnedAnnouncement) return a.isPinnedAnnouncement ? -1 : 1;
			return createdAtMs(b.createdAt) - createdAtMs(a.createdAt);
		});
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
/**
* Read one member's own reaction to one post.
*
* This is the read that makes a reaction safe to toggle: without it, a second tap
* cannot know whether it should add a like or remove one, and the stored counter
* would drift away from the reaction documents that are supposed to define it.
* The rules already allow reading a single reaction by its exact path.
*/
async function getCommunityPostReaction(postId, uid) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}/reactions/${uid}`;
	try {
		const snapshot = await getDoc(doc(db, "community_posts", postId, "reactions", uid));
		return snapshot.exists() ? snapshot.data() : null;
	} catch (err) {
		handleFirestoreError(err, OperationType.GET, path);
		return null;
	}
}
async function setCommunityPostReaction(user, postId, reactionType, existingReaction) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}/reactions/${user.uid}`;
	const postRef = doc(db, "community_posts", postId);
	const reactRef = doc(db, "community_posts", postId, "reactions", user.uid);
	const batch = writeBatch(db);
	if (existingReaction && existingReaction.reactionType === reactionType) {
		batch.delete(reactRef);
		batch.update(postRef, {
			likesCount: increment(-1),
			updatedAt: serverTimestamp()
		});
	} else if (existingReaction) batch.update(reactRef, {
		reactionType,
		updatedAt: serverTimestamp()
	});
	else {
		batch.set(reactRef, {
			postId,
			uid: user.uid,
			reactionType,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		batch.update(postRef, {
			likesCount: increment(1),
			updatedAt: serverTimestamp()
		});
	}
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribePostReactions(postId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_posts/${postId}/reactions`;
	return onSnapshot(collection(db, "community_posts", postId, "reactions"), (snap) => {
		onData(snap.docs.map((d) => d.data()));
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function addCommunityPostComment(user, postId, input) {
	if (!db) throw new Error("Firestore not initialized");
	const commentRef = doc(collection(db, "community_posts", postId, "comments"));
	const path = `community_posts/${postId}/comments/${commentRef.id}`;
	const batch = writeBatch(db);
	batch.set(commentRef, {
		postId,
		authorUid: user.uid,
		authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		...input.authorHeadline && { authorHeadline: clampStr(input.authorHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX) },
		body: clampStr(input.body, BLUEPRINT_LIMITS.COMMUNITY_COMMENT_MAX),
		isAiAssisted: Boolean(input.isAiAssisted),
		createdAt: serverTimestamp()
	});
	batch.update(doc(db, "community_posts", postId), {
		commentsCount: increment(1),
		updatedAt: serverTimestamp()
	});
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribePostComments(postId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_posts/${postId}/comments`;
	return onSnapshot(query(collection(db, "community_posts", postId, "comments"), orderBy("createdAt", "asc")), (snap) => {
		onData(snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		})));
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function connectWithCommunityMember(user, fromName, target) {
	if (!db) throw new Error("Firestore not initialized");
	if (user.uid === target.uid) return;
	const connId = `${user.uid}_${target.uid}`;
	const path = `community_connections/${connId}`;
	try {
		await setDoc(doc(db, "community_connections", connId), {
			fromUid: user.uid,
			toUid: target.uid,
			fromName: clampStr(fromName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
			toName: clampStr(target.displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
			status: "connected",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribeMyConnections(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_connections";
	const q = query(collection(db, "community_connections"), where("fromUid", "==", uid));
	return onSnapshot(q, (snap) => {
		onData(snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		})));
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function createCommunityOpportunity(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const oppRef = doc(collection(db, "community_opportunities"));
	const path = `community_opportunities/${oppRef.id}`;
	const cleanMethods = input.methods.map((m) => clampStr(m, 32)).filter(Boolean).slice(0, 8);
	const methods = cleanMethods.length > 0 ? cleanMethods : ["GENERAL"];
	const payload = {
		authorUid: user.uid,
		authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		authorOrg: clampStr(input.authorOrg, 160),
		...input.companyCode && { companyCode: sanitizeUpperCode(input.companyCode) },
		opportunityType: input.opportunityType,
		title: clampStr(input.title, 180),
		location: clampStr(input.location, 140),
		methods,
		requirements: clampStr(input.requirements, 1500),
		status: "open",
		visibility: "public",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(oppRef, payload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: oppRef.id,
		...payload
	};
}
async function updateCommunityOpportunityStatus(opportunityId, status) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_opportunities/${opportunityId}`;
	try {
		await updateDoc(doc(db, "community_opportunities", opportunityId), {
			status,
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeCommunityOpportunities(onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_opportunities";
	const q = query(collection(db, "community_opportunities"), where("visibility", "==", "public"), limit(40));
	return onSnapshot(q, (snap) => {
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
//#endregion
export { generateNextCompanyCode as $, signInClientPortalWithGoogle as A, subscribeMyClientAccount as B, observeClientPortalAuth as C, sendClientPhoneOtp as D, sendClientPasswordReset as E, subscribeCommunityWorkspaces as F, updateCommunityOpportunityStatus as G, subscribeMyConnections as H, subscribeCompanies as I, updateCompanyReportStatus as J, updateCommunityPostModeration as K, subscribeCompanyAttendance as L, subscribeClientRequests as M, subscribeCommunityOpportunities as N, setCommunityPostReaction as O, subscribeCommunityPosts as P, generateNextBadgeCode as Q, subscribeCompanyEmployees as R, normalizePhoneDigits as S, saveClientRegistration as T, subscribePostComments as U, subscribeMyCommunityWorkspace as V, subscribePostReactions as W, upsertCommunityWorkspace as X, updateEmployeeLiveLocation as Y, BLUEPRINT_LIMITS as Z, formatClientProfileError as _, createClientRequest as a, isPortalFirestoreReady as b, createCompanyEmployee as c, createInitialCompanyFromRegistration as d, generateNextReportNumber as et, deleteCommunityPost as f, firestoreClientService_exports as g, endorseMemberWorkspace as h, connectWithCommunityMember as i, signUpClientPortalWithEmail as j, signInClientPortalWithEmail as k, createCompanyReport as l, detectUserAuthMethod as m, adminApproveAndLinkClientAccount as n, sanitizeUpperCode as nt, createCommunityOpportunity as o, deleteCompanyReport as p, updateCompanyRecord as q, adminUpdateClientRequest as r, createCommunityPost as s, addCommunityPostComment as t, sanitizeReportNumber as tt, createCompanyWithUniqueCode as u, formatFirebaseAuthError as v, recordEmployeeAttendance as w, isVerifiedAdminUser as x, initializeStarterCompaniesArchive as y, subscribeCompanyReports as z };
