import { _ as doc, b as serverTimestamp, c as onSnapshot, f as setDoc, g as collection, h as writeBatch, i as getDoc, l as orderBy, m as where, p as updateDoc, r as deleteDoc, s as limit, u as query, y as increment } from "./index.esm-T7XjjJ2p.js";
import { n as OperationType, o as db, s as handleFirestoreError } from "./config-DD0nZkwK.js";
import { n as clampStr, t as BLUEPRINT_LIMITS } from "./types-BIkT06ZC.js";
//#region src/client/networkPlatformService.ts
function createdAtMs(ts) {
	if (ts && typeof ts === "object" && "toMillis" in ts && typeof ts.toMillis === "function") try {
		return ts.toMillis();
	} catch {
		return 0;
	}
	return 0;
}
function splitCsv(val) {
	if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
	if (typeof val === "string") return val.split(/[,،]+/).map((v) => v.trim()).filter(Boolean);
	return [];
}
function httpsOrOmit(raw) {
	const clean = (raw ?? "").trim();
	if (!clean || !/^https:\/\/.+/i.test(clean)) return void 0;
	return clean.slice(0, 500);
}
async function addPostAnswer(user, postId, input) {
	if (!db) throw new Error("Firestore not initialized");
	const ansRef = doc(collection(db, "community_posts", postId, "answers"));
	const path = `community_posts/${postId}/answers/${ansRef.id}`;
	const headline = clampStr(input.authorHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX);
	const refs = clampStr(input.references, 500);
	const courseId = clampStr(input.academyCourseId, 80);
	const payload = {
		postId,
		authorUid: user.uid,
		authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		...headline ? { authorHeadline: headline } : {},
		body: clampStr(input.body, 3e3),
		...refs ? { references: refs } : {},
		...courseId ? { academyCourseId: courseId } : {},
		upvotesCount: 0,
		isAccepted: false,
		expertReviewed: false,
		isAiAssisted: Boolean(input.isAiAssisted),
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(ansRef, payload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: ansRef.id,
		...payload
	};
}
function subscribePostAnswers(postId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_posts/${postId}/answers`;
	const q = query(collection(db, "community_posts", postId, "answers"), orderBy("createdAt", "asc"));
	return onSnapshot(q, (snap) => {
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => {
			if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
			if (a.expertReviewed !== b.expertReviewed) return a.expertReviewed ? -1 : 1;
			return (b.upvotesCount ?? 0) - (a.upvotesCount ?? 0);
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
async function getMyAnswerVote(postId, answerId, uid) {
	if (!db) return false;
	const path = `community_posts/${postId}/answers/${answerId}/votes/${uid}`;
	try {
		return (await getDoc(doc(db, "community_posts", postId, "answers", answerId, "votes", uid))).exists();
	} catch (err) {
		handleFirestoreError(err, OperationType.GET, path);
		return false;
	}
}
async function toggleAnswerUpvote(user, postId, answerId) {
	if (!db) throw new Error("Firestore not initialized");
	const voteRef = doc(db, "community_posts", postId, "answers", answerId, "votes", user.uid);
	const ansRef = doc(db, "community_posts", postId, "answers", answerId);
	const path = `community_posts/${postId}/answers/${answerId}/votes/${user.uid}`;
	try {
		const existing = await getDoc(voteRef);
		const batch = writeBatch(db);
		if (existing.exists()) {
			batch.delete(voteRef);
			batch.update(ansRef, {
				upvotesCount: increment(-1),
				updatedAt: serverTimestamp()
			});
			await batch.commit();
			return false;
		}
		batch.set(voteRef, {
			uid: user.uid,
			createdAt: serverTimestamp()
		});
		batch.update(ansRef, {
			upvotesCount: increment(1),
			updatedAt: serverTimestamp()
		});
		await batch.commit();
		return true;
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
		return false;
	}
}
async function setAnswerAccepted(postId, answerId, isAccepted) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}/answers/${answerId}`;
	try {
		await updateDoc(doc(db, "community_posts", postId, "answers", answerId), {
			isAccepted: Boolean(isAccepted),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function toggleAnswerExpertReview(user, reviewerName, postId, answerId, expertReviewed) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}/answers/${answerId}`;
	try {
		await updateDoc(doc(db, "community_posts", postId, "answers", answerId), {
			expertReviewed: Boolean(expertReviewed),
			reviewerUid: user.uid,
			reviewerName: clampStr(reviewerName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function castPollVote(user, postId, optionIndex) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_posts/${postId}/poll_votes/${user.uid}`;
	const voteRef = doc(db, "community_posts", postId, "poll_votes", user.uid);
	try {
		if ((await getDoc(voteRef)).exists()) await deleteDoc(voteRef);
		await setDoc(voteRef, {
			postId,
			uid: user.uid,
			optionIndex: Math.max(0, Math.min(5, Math.round(optionIndex))),
			createdAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribePollVotes(postId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_posts/${postId}/poll_votes`;
	return onSnapshot(collection(db, "community_posts", postId, "poll_votes"), (snap) => {
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
async function addGroupResource(user, groupId, input) {
	if (!db) throw new Error("Firestore not initialized");
	const resRef = doc(collection(db, "community_groups", groupId, "resources"));
	const path = `community_groups/${groupId}/resources/${resRef.id}`;
	const url = httpsOrOmit(input.url);
	const eventDateIso = clampStr(input.eventDateIso, 40);
	const payload = {
		groupId,
		authorUid: user.uid,
		authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		kind: input.kind,
		title: clampStr(input.title, 160),
		description: clampStr(input.description, 1e3),
		...url ? { url } : {},
		...eventDateIso ? { eventDateIso } : {},
		createdAt: serverTimestamp()
	};
	try {
		await setDoc(resRef, payload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: resRef.id,
		...payload
	};
}
function subscribeGroupResources(groupId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_groups/${groupId}/resources`;
	return onSnapshot(query(collection(db, "community_groups", groupId, "resources"), orderBy("createdAt", "desc")), (snap) => {
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
async function deleteGroupResource(groupId, resourceId) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_groups/${groupId}/resources/${resourceId}`;
	try {
		await deleteDoc(doc(db, "community_groups", groupId, "resources", resourceId));
	} catch (err) {
		handleFirestoreError(err, OperationType.DELETE, path);
	}
}
async function toggleFollow(user, targetType, targetId, targetName) {
	if (!db) throw new Error("Firestore not initialized");
	const followId = `${user.uid}_${targetType}_${targetId}`;
	const ref = doc(db, "community_follows", followId);
	const path = `community_follows/${followId}`;
	try {
		if ((await getDoc(ref)).exists()) {
			await deleteDoc(ref);
			if (targetType === "company") await updateDoc(doc(db, "community_companies", targetId), {
				followersCount: increment(-1),
				updatedAt: serverTimestamp()
			}).catch(() => {});
			else await updateDoc(doc(db, "community_workspaces", targetId), {
				followersCount: increment(-1),
				updatedAt: serverTimestamp()
			}).catch(() => {});
			return false;
		}
		await setDoc(ref, {
			followerUid: user.uid,
			targetType,
			targetId,
			targetName: clampStr(targetName, 160),
			createdAt: serverTimestamp()
		});
		if (targetType === "company") await updateDoc(doc(db, "community_companies", targetId), {
			followersCount: increment(1),
			updatedAt: serverTimestamp()
		}).catch(() => {});
		else await updateDoc(doc(db, "community_workspaces", targetId), {
			followersCount: increment(1),
			updatedAt: serverTimestamp()
		}).catch(() => {});
		return true;
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
		return false;
	}
}
function subscribeMyFollows(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_follows";
	return onSnapshot(query(collection(db, "community_follows"), where("followerUid", "==", uid)), (snap) => {
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
async function toggleBookmark(user, postId, postTitle) {
	if (!db) throw new Error("Firestore not initialized");
	const bookmarkId = `${user.uid}_${postId}`;
	const ref = doc(db, "community_bookmarks", bookmarkId);
	const path = `community_bookmarks/${bookmarkId}`;
	try {
		if ((await getDoc(ref)).exists()) {
			await deleteDoc(ref);
			return false;
		}
		await setDoc(ref, {
			uid: user.uid,
			postId,
			postTitle: clampStr(postTitle, 180),
			createdAt: serverTimestamp()
		});
		return true;
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
		return false;
	}
}
function subscribeMyBookmarks(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_bookmarks";
	return onSnapshot(query(collection(db, "community_bookmarks"), where("uid", "==", uid)), (snap) => {
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
async function submitJobApplication(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const appId = `${input.opportunityId}_${user.uid}`;
	const path = `community_job_applications/${appId}`;
	const headline = clampStr(input.applicantHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX);
	const org = clampStr(input.applicantOrg, 160);
	const cv = clampStr(input.cvSummary, 800);
	try {
		await setDoc(doc(db, "community_job_applications", appId), {
			opportunityId: input.opportunityId,
			opportunityTitle: clampStr(input.opportunityTitle, 180),
			employerUid: input.employerUid,
			applicantUid: user.uid,
			applicantName: clampStr(input.applicantName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
			...headline ? { applicantHeadline: headline } : {},
			...org ? { applicantOrg: org } : {},
			coverNote: clampStr(input.coverNote, 1500),
			...cv ? { cvSummary: cv } : {},
			status: "submitted",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribeMyJobApplications(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_job_applications";
	return onSnapshot(query(collection(db, "community_job_applications"), where("applicantUid", "==", uid)), (snap) => {
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
function subscribeEmployerJobApplications(employerUid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_job_applications";
	return onSnapshot(query(collection(db, "community_job_applications"), where("employerUid", "==", employerUid)), (snap) => {
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
async function updateJobApplicationStatus(applicationId, status) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_job_applications/${applicationId}`;
	try {
		await updateDoc(doc(db, "community_job_applications", applicationId), {
			status,
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function mapCompanyDoc(id, raw) {
	return {
		id,
		ownerUid: String(raw.ownerUid ?? ""),
		name: String(raw.name ?? ""),
		...raw.nameAr ? { nameAr: String(raw.nameAr) } : {},
		industry: String(raw.industry ?? ""),
		description: String(raw.description ?? ""),
		...raw.headquarters ? { headquarters: String(raw.headquarters) } : {},
		...raw.branches ? { branches: String(raw.branches) } : {},
		...raw.website ? { website: String(raw.website) } : {},
		...raw.contactEmail ? { contactEmail: String(raw.contactEmail) } : {},
		services: splitCsv(raw.services),
		specializations: splitCsv(raw.specializations),
		...raw.projectsSummary ? { projectsSummary: String(raw.projectsSummary) } : {},
		...raw.logoURL ? { logoURL: String(raw.logoURL) } : {},
		...raw.coverURL ? { coverURL: String(raw.coverURL) } : {},
		verificationStatus: raw.verificationStatus ?? "pending",
		followersCount: typeof raw.followersCount === "number" ? raw.followersCount : 0,
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt
	};
}
async function createCommunityCompany(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const ref = doc(collection(db, "community_companies"));
	const path = `community_companies/${ref.id}`;
	const logoURL = httpsOrOmit(input.logoURL);
	const coverURL = httpsOrOmit(input.coverURL);
	const servicesStr = clampStr((input.services ?? []).join(", "), 500);
	const specsStr = clampStr((input.specializations ?? []).join(", "), 400);
	const writePayload = {
		ownerUid: user.uid,
		name: clampStr(input.name, 160),
		...input.nameAr?.trim() ? { nameAr: clampStr(input.nameAr, 160) } : {},
		industry: clampStr(input.industry, 120),
		description: clampStr(input.description, 1500),
		...input.headquarters?.trim() ? { headquarters: clampStr(input.headquarters, 160) } : {},
		...input.branches?.trim() ? { branches: clampStr(input.branches, 400) } : {},
		...input.website?.trim() ? { website: clampStr(input.website, 300) } : {},
		...input.contactEmail?.trim() ? { contactEmail: clampStr(input.contactEmail, 160) } : {},
		...servicesStr ? { services: servicesStr } : {},
		...specsStr ? { specializations: specsStr } : {},
		...input.projectsSummary?.trim() ? { projectsSummary: clampStr(input.projectsSummary, 1e3) } : {},
		...logoURL ? { logoURL } : {},
		...coverURL ? { coverURL } : {},
		verificationStatus: "pending",
		followersCount: 0,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(ref, writePayload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return mapCompanyDoc(ref.id, writePayload);
}
async function updateCommunityCompany(companyId, updates) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_companies/${companyId}`;
	try {
		await updateDoc(doc(db, "community_companies", companyId), {
			...updates.name !== void 0 && { name: clampStr(updates.name, 160) },
			...updates.nameAr !== void 0 && { nameAr: clampStr(updates.nameAr, 160) },
			...updates.industry !== void 0 && { industry: clampStr(updates.industry, 120) },
			...updates.description !== void 0 && { description: clampStr(updates.description, 1500) },
			...updates.headquarters !== void 0 && { headquarters: clampStr(updates.headquarters, 160) },
			...updates.branches !== void 0 && { branches: clampStr(updates.branches, 400) },
			...updates.website !== void 0 && { website: clampStr(updates.website, 300) },
			...updates.contactEmail !== void 0 && { contactEmail: clampStr(updates.contactEmail, 160) },
			...updates.services !== void 0 && { services: clampStr(updates.services.join(", "), 500) },
			...updates.specializations !== void 0 && { specializations: clampStr(updates.specializations.join(", "), 400) },
			...updates.projectsSummary !== void 0 && { projectsSummary: clampStr(updates.projectsSummary, 1e3) },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeCommunityCompanies(onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_companies";
	return onSnapshot(query(collection(db, "community_companies"), orderBy("updatedAt", "desc"), limit(60)), (snap) => {
		onData(snap.docs.map((d) => mapCompanyDoc(d.id, d.data())));
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
function mapDepartmentDoc(id, raw) {
	return {
		id,
		companyId: String(raw.companyId ?? ""),
		name: String(raw.name ?? ""),
		...raw.parentDeptId ? { parentDepartmentId: String(raw.parentDeptId) } : {},
		levelOrder: typeof raw.levelRank === "number" ? raw.levelRank : 3,
		roleTitle: String(raw.levelTitle ?? ""),
		roleKey: inferRoleKey(String(raw.levelTitle ?? "")),
		...raw.managerUid ? { managerUid: String(raw.managerUid) } : {},
		...raw.managerName ? { managerName: String(raw.managerName) } : {},
		services: splitCsv(raw.services),
		specialties: splitCsv(raw.specializations),
		activeProjects: splitCsv(raw.projectsSummary),
		...raw.description ? { overview: String(raw.description) } : {},
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt
	};
}
function inferRoleKey(title) {
	const lower = title.toLowerCase();
	if (lower.includes("managing")) return "managing_director";
	if (lower.includes("operations")) return "operations_manager";
	if (lower.includes("technical")) return "technical_manager";
	if (lower.includes("department")) return "department_manager";
	if (lower.includes("leader")) return "team_leader";
	if (lower.includes("engineer") || lower.includes("inspector") || lower.includes("tech")) return "engineer_inspector";
	return "custom";
}
async function upsertCompanyDepartment(companyId, deptId, input, existingCreatedAt) {
	if (!db) throw new Error("Firestore not initialized");
	const targetRef = deptId ? doc(db, "community_companies", companyId, "departments", deptId) : doc(collection(db, "community_companies", companyId, "departments"));
	const path = `community_companies/${companyId}/departments/${targetRef.id}`;
	const payload = {
		companyId,
		...input.parentDepartmentId?.trim() ? { parentDeptId: clampStr(input.parentDepartmentId, 128) } : {},
		levelRank: Math.max(0, Math.min(20, Math.round(input.levelOrder))),
		levelTitle: clampStr(input.roleTitle, 80),
		name: clampStr(input.name, 120),
		...input.overview?.trim() ? { description: clampStr(input.overview, 800) } : {},
		...input.managerUid?.trim() ? { managerUid: clampStr(input.managerUid, 128) } : {},
		...input.managerName?.trim() ? { managerName: clampStr(input.managerName, 120) } : {},
		...input.specialties?.length ? { specializations: clampStr(input.specialties.join(", "), 400) } : {},
		...input.services?.length ? { services: clampStr(input.services.join(", "), 400) } : {},
		...input.activeProjects?.length ? { projectsSummary: clampStr(input.activeProjects.join(", "), 600) } : {},
		createdAt: existingCreatedAt ?? serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(targetRef, payload);
	} catch (err) {
		handleFirestoreError(err, deptId ? OperationType.UPDATE : OperationType.CREATE, path);
	}
	return targetRef.id;
}
async function deleteCompanyDepartment(companyId, deptId) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_companies/${companyId}/departments/${deptId}`;
	try {
		await deleteDoc(doc(db, "community_companies", companyId, "departments", deptId));
	} catch (err) {
		handleFirestoreError(err, OperationType.DELETE, path);
	}
}
function subscribeCompanyDepartments(companyId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_companies/${companyId}/departments`;
	return onSnapshot(collection(db, "community_companies", companyId, "departments"), (snap) => {
		onData(snap.docs.map((d) => mapDepartmentDoc(d.id, d.data())));
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function inviteCompanyAffiliation(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const affId = `${input.companyId}_${input.employeeUid}`;
	const path = `community_companies/${input.companyId}/affiliations/${affId}`;
	try {
		await setDoc(doc(db, "community_companies", input.companyId, "affiliations", affId), {
			companyId: input.companyId,
			companyName: clampStr(input.companyName, 160),
			employeeUid: input.employeeUid,
			employeeName: clampStr(input.employeeName, 120),
			roleTitle: clampStr(input.roleTitle, 100),
			...input.departmentId ? { departmentId: clampStr(input.departmentId, 128) } : {},
			...input.departmentName ? { departmentName: clampStr(input.departmentName, 120) } : {},
			status: "invited",
			invitedByUid: user.uid,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
async function respondCompanyAffiliation(companyId, employeeUid, status) {
	if (!db) throw new Error("Firestore not initialized");
	const affId = `${companyId}_${employeeUid}`;
	const path = `community_companies/${companyId}/affiliations/${affId}`;
	try {
		await updateDoc(doc(db, "community_companies", companyId, "affiliations", affId), {
			status,
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeCompanyAffiliations(companyId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_companies/${companyId}/affiliations`;
	return onSnapshot(collection(db, "community_companies", companyId, "affiliations"), (snap) => {
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
async function fetchUserAffiliationsAcrossCompanies(uid, companyIds) {
	if (!db || companyIds.length === 0) return [];
	const results = [];
	for (const cid of companyIds.slice(0, 25)) try {
		const snap = await getDoc(doc(db, "community_companies", cid, "affiliations", `${cid}_${uid}`));
		if (snap.exists()) results.push({
			id: snap.id,
			...snap.data()
		});
	} catch {}
	return results;
}
async function createCommunityEvent(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const ref = doc(collection(db, "community_events"));
	const path = `community_events/${ref.id}`;
	const cleanSpeakers = (input.speakers ?? []).map((s) => clampStr(s, 100)).filter(Boolean).slice(0, 10);
	const payload = {
		organizerUid: user.uid,
		organizerName: clampStr(input.organizerName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
		organizerOrg: clampStr(input.organizerOrg, 160),
		...input.companyId?.trim() ? { companyId: clampStr(input.companyId, 128) } : {},
		eventType: input.eventType,
		title: clampStr(input.title, 180),
		description: clampStr(input.description, 2e3),
		...cleanSpeakers.length > 0 ? { speakers: cleanSpeakers } : {},
		dateIso: clampStr(input.dateIso, 40),
		venueOrLink: clampStr(input.venueOrLink, 300),
		capacity: Math.max(1, Math.min(5e4, Math.round(input.capacity))),
		attendeesCount: 0,
		...input.academyCourseId?.trim() ? { academyCourseId: clampStr(input.academyCourseId, 80) } : {},
		...input.postEventResources?.trim() ? { postEventResources: clampStr(input.postEventResources, 1e3) } : {},
		status: "upcoming",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(ref, payload);
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
	return {
		id: ref.id,
		...payload
	};
}
async function updateCommunityEvent(eventId, updates) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_events/${eventId}`;
	try {
		await updateDoc(doc(db, "community_events", eventId), {
			...updates.status !== void 0 && { status: updates.status },
			...updates.postEventResources !== void 0 && { postEventResources: clampStr(updates.postEventResources, 1e3) },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeCommunityEvents(onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_events";
	return onSnapshot(query(collection(db, "community_events"), orderBy("createdAt", "desc"), limit(50)), (snap) => {
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
async function rsvpCommunityEvent(user, eventId, displayName, register) {
	if (!db) throw new Error("Firestore not initialized");
	const regRef = doc(db, "community_events", eventId, "registrations", user.uid);
	const evRef = doc(db, "community_events", eventId);
	const path = `community_events/${eventId}/registrations/${user.uid}`;
	try {
		const existing = await getDoc(regRef);
		const wasRegistered = existing.exists() && existing.data().status === "registered";
		const batch = writeBatch(db);
		if (register && !wasRegistered) {
			batch.set(regRef, {
				eventId,
				uid: user.uid,
				displayName: clampStr(displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
				status: "registered",
				createdAt: existing.exists() ? existing.data().createdAt ?? serverTimestamp() : serverTimestamp(),
				updatedAt: serverTimestamp()
			});
			batch.update(evRef, {
				attendeesCount: increment(1),
				updatedAt: serverTimestamp()
			});
			await batch.commit();
		} else if (!register && wasRegistered) {
			batch.set(regRef, {
				eventId,
				uid: user.uid,
				displayName: clampStr(displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
				status: "cancelled",
				createdAt: existing.data().createdAt ?? serverTimestamp(),
				updatedAt: serverTimestamp()
			});
			batch.update(evRef, {
				attendeesCount: increment(-1),
				updatedAt: serverTimestamp()
			});
			await batch.commit();
		}
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeEventRegistrations(eventId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_events/${eventId}/registrations`;
	return onSnapshot(collection(db, "community_events", eventId, "registrations"), (snap) => {
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
function deterministicThreadId(uidA, uidB) {
	return [uidA, uidB].sort().join("__");
}
async function getOrCreateDmThread(user, myName, otherUid, otherName) {
	if (!db) throw new Error("Firestore not initialized");
	const threadId = deterministicThreadId(user.uid, otherUid);
	const ref = doc(db, "community_message_threads", threadId);
	const path = `community_message_threads/${threadId}`;
	try {
		const snap = await getDoc(ref);
		if (snap.exists()) return {
			id: snap.id,
			...snap.data()
		};
		const payload = {
			participantUids: [user.uid, otherUid].sort(),
			participantNames: {
				[user.uid]: clampStr(myName, 120),
				[otherUid]: clampStr(otherName, 120)
			},
			lastMessage: "",
			lastSenderUid: user.uid,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};
		await setDoc(ref, payload);
		return {
			id: threadId,
			...payload
		};
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribeMyDmThreads(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_message_threads";
	return onSnapshot(query(collection(db, "community_message_threads"), where("participantUids", "array-contains", uid)), (snap) => {
		const list = snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		}));
		list.sort((a, b) => createdAtMs(b.updatedAt) - createdAtMs(a.updatedAt));
		onData(list);
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function sendDirectMessage(user, threadId, input) {
	if (!db) throw new Error("Firestore not initialized");
	const msgRef = doc(collection(db, "community_message_threads", threadId, "messages"));
	const threadRef = doc(db, "community_message_threads", threadId);
	const path = `community_message_threads/${threadId}/messages/${msgRef.id}`;
	const cleanBody = clampStr(input.body, 2e3);
	const attachmentUrl = httpsOrOmit(input.attachmentUrl);
	const batch = writeBatch(db);
	batch.set(msgRef, {
		threadId,
		senderUid: user.uid,
		senderName: clampStr(input.senderName, 120),
		recipientUid: input.recipientUid,
		body: cleanBody,
		...attachmentUrl ? { attachmentUrl } : {},
		isRead: false,
		createdAt: serverTimestamp()
	});
	batch.update(threadRef, {
		lastMessage: clampStr(cleanBody, 240),
		lastSenderUid: user.uid,
		updatedAt: serverTimestamp()
	});
	try {
		await batch.commit();
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
async function markDirectMessageRead(threadId, messageId) {
	if (!db) return;
	const path = `community_message_threads/${threadId}/messages/${messageId}`;
	try {
		await updateDoc(doc(db, "community_message_threads", threadId, "messages", messageId), { isRead: true });
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
function subscribeThreadMessages(threadId, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = `community_message_threads/${threadId}/messages`;
	return onSnapshot(query(collection(db, "community_message_threads", threadId, "messages"), orderBy("createdAt", "asc")), (snap) => {
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
async function blockCommunityMember(user, blockedUid, reason) {
	if (!db) throw new Error("Firestore not initialized");
	const blockId = `${user.uid}_${blockedUid}`;
	const path = `community_blocks/${blockId}`;
	try {
		await setDoc(doc(db, "community_blocks", blockId), {
			blockerUid: user.uid,
			blockedUid,
			...reason?.trim() ? { reason: clampStr(reason, 240) } : {},
			createdAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
async function unblockCommunityMember(user, blockedUid) {
	if (!db) throw new Error("Firestore not initialized");
	const blockId = `${user.uid}_${blockedUid}`;
	const path = `community_blocks/${blockId}`;
	try {
		await deleteDoc(doc(db, "community_blocks", blockId));
	} catch (err) {
		handleFirestoreError(err, OperationType.DELETE, path);
	}
}
function subscribeMyBlocks(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_blocks";
	return onSnapshot(query(collection(db, "community_blocks"), where("blockerUid", "==", uid)), (snap) => {
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
async function createCommunityNotification(actor, input) {
	if (!db) return;
	if (actor.uid === input.recipientUid) return;
	const ref = doc(collection(db, "community_notifications"));
	`${ref.id}`;
	try {
		await setDoc(ref, {
			recipientUid: input.recipientUid,
			actorUid: actor.uid,
			actorName: clampStr(input.actorName, 120),
			category: input.category,
			title: clampStr(input.title, 160),
			body: clampStr(input.body, 400),
			...input.linkSection ? { linkSection: clampStr(input.linkSection, 40) } : {},
			...input.linkEntryId ? { linkEntryId: clampStr(input.linkEntryId, 128) } : {},
			isRead: false,
			createdAt: serverTimestamp()
		});
	} catch {}
}
function subscribeMyNotifications(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_notifications";
	return onSnapshot(query(collection(db, "community_notifications"), where("recipientUid", "==", uid)), (snap) => {
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
async function markNotificationRead(notificationId, isRead = true) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_notifications/${notificationId}`;
	try {
		await updateDoc(doc(db, "community_notifications", notificationId), { isRead });
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function markAllNotificationsRead(items) {
	if (!db) return;
	const unread = items.filter((i) => !i.isRead);
	if (unread.length === 0) return;
	const batch = writeBatch(db);
	for (const item of unread.slice(0, 50)) batch.update(doc(db, "community_notifications", item.id), { isRead: true });
	await batch.commit();
}
var DEFAULT_NOTIFICATION_PREFS = {
	connections: true,
	comments: true,
	groups: true,
	jobs: true,
	messages: true,
	events: true,
	academy: true,
	weeklyDigest: false
};
function subscribeNotificationPrefs(uid, onData, onError) {
	if (!db) {
		onData({
			uid,
			...DEFAULT_NOTIFICATION_PREFS
		});
		return () => {};
	}
	const path = `community_notification_prefs/${uid}`;
	return onSnapshot(doc(db, "community_notification_prefs", uid), (snap) => {
		if (snap.exists()) {
			const data = snap.data();
			onData({
				uid,
				...DEFAULT_NOTIFICATION_PREFS,
				...data
			});
		} else onData({
			uid,
			...DEFAULT_NOTIFICATION_PREFS
		});
	}, (err) => {
		try {
			handleFirestoreError(err, OperationType.GET, path);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
async function saveNotificationPrefs(user, prefs) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_notification_prefs/${user.uid}`;
	try {
		await setDoc(doc(db, "community_notification_prefs", user.uid), {
			connections: Boolean(prefs.connections),
			comments: Boolean(prefs.comments),
			groups: Boolean(prefs.groups),
			jobs: Boolean(prefs.jobs),
			messages: Boolean(prefs.messages),
			events: Boolean(prefs.events),
			academy: Boolean(prefs.academy),
			weeklyDigest: Boolean(prefs.weeklyDigest),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function submitVerificationRequest(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const ref = doc(collection(db, "community_verifications"));
	const path = `community_verifications/${ref.id}`;
	const evidenceUrl = httpsOrOmit(input.evidenceUrl);
	try {
		await setDoc(ref, {
			uid: user.uid,
			memberName: clampStr(input.memberName, 120),
			track: input.track,
			subjectTitle: clampStr(input.subjectTitle, 160),
			issuerOrCompany: clampStr(input.issuerOrCompany, 160),
			evidenceNote: clampStr(input.evidenceNote, 800),
			...evidenceUrl ? { evidenceUrl } : {},
			...input.companyId?.trim() ? { companyId: clampStr(input.companyId, 128) } : {},
			status: "pending",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribeMyVerifications(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_verifications";
	return onSnapshot(query(collection(db, "community_verifications"), where("uid", "==", uid)), (snap) => {
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
function subscribeAllVerificationsAdmin(onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_verifications";
	return onSnapshot(query(collection(db, "community_verifications"), orderBy("createdAt", "desc"), limit(80)), (snap) => {
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
async function reviewVerificationAdmin(verification, decision) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_verifications/${verification.id}`;
	try {
		await updateDoc(doc(db, "community_verifications", verification.id), {
			status: decision,
			updatedAt: serverTimestamp()
		});
		if (decision === "approved") {
			const workspaceField = verification.track === "identity" ? { identityVerified: true } : verification.track === "organization" ? {
				organizationVerified: true,
				...verification.companyId ? { verifiedOrganizationId: verification.companyId } : {}
			} : { credentialVerified: true };
			await updateDoc(doc(db, "community_workspaces", verification.uid), {
				...workspaceField,
				updatedAt: serverTimestamp()
			}).catch(() => {});
			if (verification.track === "organization" && verification.companyId) await updateDoc(doc(db, "community_companies", verification.companyId), {
				verificationStatus: "verified",
				updatedAt: serverTimestamp()
			}).catch(() => {});
		}
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function submitModerationReport(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	const ref = doc(collection(db, "community_reports"));
	const path = `community_reports/${ref.id}`;
	try {
		await setDoc(ref, {
			reporterUid: user.uid,
			reporterName: clampStr(input.reporterName, 120),
			targetType: input.targetType,
			targetId: clampStr(input.targetId, 128),
			targetTitle: clampStr(input.targetTitle, 180),
			reason: clampStr(input.reason, 800),
			status: "open",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribeModerationReportsAdmin(onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_reports";
	return onSnapshot(query(collection(db, "community_reports"), orderBy("createdAt", "desc"), limit(60)), (snap) => {
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
async function updateModerationReportStatus(reportId, status) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_reports/${reportId}`;
	try {
		await updateDoc(doc(db, "community_reports", reportId), {
			status,
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function sendCommunityEmail(user, input) {
	if (!db) throw new Error("Firestore not initialized");
	if (!input.recipientUid || input.recipientUid === user.uid) throw new Error("Invalid recipient UID");
	const ref = doc(collection(db, "community_emails"));
	const path = `community_emails/${ref.id}`;
	const cleanSubject = clampStr(input.subject, 180);
	const cleanBody = clampStr(input.body, 5e3);
	if (cleanSubject.length < 2) throw new Error("Email subject must be at least 2 characters");
	if (cleanBody.length < 1) throw new Error("Email body cannot be empty");
	const attachmentUrl = httpsOrOmit(input.attachmentUrl);
	const senderOrg = clampStr(input.senderOrg, 160);
	const replyToEmailId = clampStr(input.replyToEmailId, 128);
	const payload = {
		participantUids: [user.uid, input.recipientUid].sort(),
		senderUid: user.uid,
		senderName: clampStr(input.senderName, 120) || user.uid,
		...senderOrg ? { senderOrg } : {},
		recipientUid: input.recipientUid,
		recipientName: clampStr(input.recipientName, 120) || input.recipientUid,
		subject: cleanSubject,
		category: input.category,
		priority: input.priority,
		body: cleanBody,
		...attachmentUrl ? { attachmentUrl } : {},
		...replyToEmailId ? { replyToEmailId } : {},
		recipientRead: false,
		senderStarred: false,
		recipientStarred: false,
		senderFolder: "sent",
		recipientFolder: "inbox",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	try {
		await setDoc(ref, payload);
		return {
			id: ref.id,
			...payload
		};
	} catch (err) {
		handleFirestoreError(err, OperationType.CREATE, path);
	}
}
function subscribeMyEmails(uid, onData, onError) {
	if (!db) {
		onData([]);
		return () => {};
	}
	const path = "community_emails";
	return onSnapshot(query(collection(db, "community_emails"), where("participantUids", "array-contains", uid)), (snap) => {
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
async function markCommunityEmailRead(emailId, read = true) {
	if (!db) return;
	const path = `community_emails/${emailId}`;
	try {
		await updateDoc(doc(db, "community_emails", emailId), {
			recipientRead: read,
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function toggleCommunityEmailStar(email, myUid, starred) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_emails/${email.id}`;
	const isSender = email.senderUid === myUid;
	const isRecipient = email.recipientUid === myUid;
	if (!isSender && !isRecipient) return;
	try {
		await updateDoc(doc(db, "community_emails", email.id), {
			...isSender ? { senderStarred: starred } : { recipientStarred: starred },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
async function setCommunityEmailFolder(email, myUid, archived) {
	if (!db) throw new Error("Firestore not initialized");
	const path = `community_emails/${email.id}`;
	const isSender = email.senderUid === myUid;
	const isRecipient = email.recipientUid === myUid;
	if (!isSender && !isRecipient) return;
	try {
		await updateDoc(doc(db, "community_emails", email.id), {
			...isSender ? { senderFolder: archived ? "archive" : "sent" } : { recipientFolder: archived ? "archive" : "inbox" },
			updatedAt: serverTimestamp()
		});
	} catch (err) {
		handleFirestoreError(err, OperationType.UPDATE, path);
	}
}
//#endregion
export { DEFAULT_NOTIFICATION_PREFS, addGroupResource, addPostAnswer, blockCommunityMember, castPollVote, createCommunityCompany, createCommunityEvent, createCommunityNotification, deleteCompanyDepartment, deleteGroupResource, deterministicThreadId, fetchUserAffiliationsAcrossCompanies, getMyAnswerVote, getOrCreateDmThread, inviteCompanyAffiliation, markAllNotificationsRead, markCommunityEmailRead, markDirectMessageRead, markNotificationRead, respondCompanyAffiliation, reviewVerificationAdmin, rsvpCommunityEvent, saveNotificationPrefs, sendCommunityEmail, sendDirectMessage, setAnswerAccepted, setCommunityEmailFolder, submitJobApplication, submitModerationReport, submitVerificationRequest, subscribeAllVerificationsAdmin, subscribeCommunityCompanies, subscribeCommunityEvents, subscribeCompanyAffiliations, subscribeCompanyDepartments, subscribeEmployerJobApplications, subscribeEventRegistrations, subscribeGroupResources, subscribeModerationReportsAdmin, subscribeMyBlocks, subscribeMyBookmarks, subscribeMyDmThreads, subscribeMyEmails, subscribeMyFollows, subscribeMyJobApplications, subscribeMyNotifications, subscribeMyVerifications, subscribeNotificationPrefs, subscribePollVotes, subscribePostAnswers, subscribeThreadMessages, toggleAnswerExpertReview, toggleAnswerUpvote, toggleBookmark, toggleCommunityEmailStar, toggleFollow, unblockCommunityMember, updateCommunityCompany, updateCommunityEvent, updateJobApplicationStatus, updateModerationReportStatus, upsertCompanyDepartment };
