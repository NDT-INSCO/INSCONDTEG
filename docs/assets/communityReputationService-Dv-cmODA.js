import { _ as doc, b as serverTimestamp, c as onSnapshot, f as setDoc, g as collection, i as getDoc, m as where, o as getDocs, p as updateDoc, r as deleteDoc, s as limit, u as query } from "./index.esm-T7XjjJ2p.js";
import { n as OperationType, o as db, s as handleFirestoreError } from "./config-BaEX8mXf.js";
import { A as recommendationId, D as endorsementId } from "./networkProfileForm-DKDncrxG.js";
//#region src/client/communityReputationService.ts
var ENDORSEMENTS = "community_endorsements";
var RECOMMENDATIONS = "community_recommendations";
var requireDb = () => {
	if (!db) throw new Error("Firestore not initialized");
	return db;
};
/**
* The name shown next to an endorsement or a recommendation: the member's own card
* name, never the email or the auth display name. Falls back to empty, and the
* caller decides what to write — guessing a name would put words in someone's mouth.
*/
async function loadMyDisplayName(uid) {
	if (!db || !uid) return "";
	try {
		const name = (await getDoc(doc(db, "community_workspaces", uid))).data()?.displayName;
		return typeof name === "string" ? name : "";
	} catch {
		return "";
	}
}
function subscribeEndorsements(toUid, onData, onError) {
	if (!db || !toUid) {
		onData([]);
		return () => {};
	}
	const q = query(collection(db, ENDORSEMENTS), where("toUid", "==", toUid), limit(300));
	return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({
		id: d.id,
		...d.data()
	}))), (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, ENDORSEMENTS);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
/**
* Endorse one skill. `setDoc` on a fixed id makes this idempotent: the second
* attempt writes the same document instead of adding a second endorsement.
*/
async function endorseSkill(user, target, fromName) {
	const database = requireDb();
	try {
		await setDoc(doc(database, ENDORSEMENTS, endorsementId(target.uid, target.skillId, user.uid)), {
			toUid: target.uid,
			skillId: target.skillId,
			fromUid: user.uid,
			fromName,
			createdAt: serverTimestamp()
		});
	} catch (error) {
		handleFirestoreError(error, OperationType.CREATE, ENDORSEMENTS);
	}
}
async function withdrawEndorsement(fromUid, target) {
	const database = requireDb();
	try {
		await deleteDoc(doc(database, ENDORSEMENTS, endorsementId(target.uid, target.skillId, fromUid)));
	} catch (error) {
		handleFirestoreError(error, OperationType.DELETE, ENDORSEMENTS);
	}
}
/** Whether *I* endorsed each skill — read once, used to label the button honestly. */
async function loadMyEndorsements(fromUid, toUid) {
	if (!db || !fromUid || !toUid) return {};
	try {
		const snap = await getDocs(query(collection(db, ENDORSEMENTS), where("toUid", "==", toUid), where("fromUid", "==", fromUid), limit(50)));
		const rows = {};
		for (const entry of snap.docs) {
			const skillId = entry.data().skillId;
			if (typeof skillId === "string") rows[skillId] = true;
		}
		return rows;
	} catch {
		return {};
	}
}
function subscribeRecommendations(toUid, onData, onError) {
	if (!db || !toUid) {
		onData([]);
		return () => {};
	}
	const q = query(collection(db, RECOMMENDATIONS), where("toUid", "==", toUid), limit(30));
	return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({
		id: d.id,
		...d.data()
	}))), (err) => {
		try {
			handleFirestoreError(err, OperationType.LIST, RECOMMENDATIONS);
		} catch (wrapped) {
			onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
		}
	});
}
/**
* Write or edit *my* recommendation about someone. Creating sends `createdAt`;
* editing never touches it, because the rules require it to stay unchanged — a
* `setDoc` here would rewrite the creation date to "now" and be refused.
*/
async function writeRecommendation(user, target, fromName, input, options) {
	const database = requireDb();
	const ref = doc(database, RECOMMENDATIONS, recommendationId(user.uid, target.uid));
	try {
		if (options.exists) {
			await updateDoc(ref, {
				relation: input.relation,
				body: input.body,
				updatedAt: serverTimestamp()
			});
			return;
		}
		await setDoc(ref, {
			fromUid: user.uid,
			fromName,
			toUid: target.uid,
			toName: target.displayName,
			relation: input.relation,
			body: input.body,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		handleFirestoreError(error, options.exists ? OperationType.UPDATE : OperationType.CREATE, RECOMMENDATIONS);
	}
}
async function deleteRecommendation(id) {
	const database = requireDb();
	try {
		await deleteDoc(doc(database, RECOMMENDATIONS, id));
	} catch (error) {
		handleFirestoreError(error, OperationType.DELETE, RECOMMENDATIONS);
	}
}
//#endregion
export { deleteRecommendation, endorseSkill, loadMyDisplayName, loadMyEndorsements, subscribeEndorsements, subscribeRecommendations, withdrawEndorsement, writeRecommendation };
