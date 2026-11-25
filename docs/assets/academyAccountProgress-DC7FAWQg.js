const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/config-DD0nZkwK.js","assets/rolldown-runtime-oLLnCvco.js","assets/index.esm-T7XjjJ2p.js"])))=>i.map(i=>d[i]);
import { t as __vitePreload } from "./preload-helper-B6u0oZm0.js";
//#region src/account/academyAccountProgress.ts
var account = null;
var database = null;
function notify() {
	if (typeof window === "undefined") return;
	for (const event of [
		"insco_progress_updated",
		"insco_user_progress_updated",
		"insco_topic_progress_updated"
	]) window.dispatchEvent(new CustomEvent(event));
}
function readAccountAcademyProgress() {
	return account;
}
/** Local training tools stay local for visitors and ephemeral when signed in. */
var academyActivityStorage = {
	getItem(key) {
		return account ? account.activity.get(key) ?? null : localStorage.getItem(key);
	},
	setItem(key, value) {
		if (account) account.activity.set(key, value);
		else localStorage.setItem(key, value);
	},
	removeItem(key) {
		if (account) account.activity.delete(key);
		else localStorage.removeItem(key);
	}
};
function bindAccountAcademyProgress(user, verified, onStatus) {
	const bound = {
		uid: user.uid,
		name: user.displayName || "",
		modules: /* @__PURE__ */ new Map(),
		activity: /* @__PURE__ */ new Map(),
		state: verified ? "loading" : "unverified"
	};
	account = bound;
	database = null;
	let unsubscribe;
	const changeStatus = (state) => {
		if (account !== bound) return;
		bound.state = state;
		if (state === "error") bound.modules.clear();
		onStatus(state);
		notify();
	};
	onStatus(bound.state);
	if (verified) Promise.all([__vitePreload(() => import("./config-DD0nZkwK.js").then((n) => n.a), __vite__mapDeps([0,1,2])), __vitePreload(() => import("./index.esm-T7XjjJ2p.js").then((n) => n.t), __vite__mapDeps([2,1]))]).then(([config, api]) => {
		if (account !== bound) return;
		const { db, auth } = config;
		if (!db || !auth || auth.currentUser?.uid !== user.uid) {
			changeStatus("error");
			return;
		}
		database = {
			db,
			auth
		};
		const source = api.query(api.collection(db, "user_module_progress"), api.where("userId", "==", user.uid));
		unsubscribe = api.onSnapshot(source, { includeMetadataChanges: true }, (snapshot) => {
			if (account !== bound || auth.currentUser?.uid !== user.uid || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
			const modules = /* @__PURE__ */ new Map();
			for (const record of snapshot.docs) {
				const row = record.data();
				if (row.userId !== user.uid || typeof row.moduleId !== "string" || record.id !== `${user.uid}_${row.moduleId}`) continue;
				modules.set(row.moduleId, {
					...row,
					completedAt: typeof row.completedAt?.toDate === "function" ? row.completedAt : null,
					completedTopics: Array.isArray(row.completedTopics) ? row.completedTopics.filter((topic) => typeof topic === "string") : []
				});
			}
			bound.modules = modules;
			changeStatus("ready");
		}, () => changeStatus("error"));
	}).catch(() => changeStatus("error"));
	return () => {
		unsubscribe?.();
		if (account === bound) {
			account = null;
			database = null;
		}
	};
}
async function saveAccountModule(moduleId, fields, finished) {
	const bound = account;
	const target = database;
	if (!bound || bound.state !== "ready" || !target || !/^[a-zA-Z0-9_-]{1,80}$/.test(moduleId)) return false;
	try {
		const { doc, setDoc, serverTimestamp } = await __vitePreload(async () => {
			const { doc, setDoc, serverTimestamp } = await import("./index.esm-T7XjjJ2p.js").then((n) => n.t);
			return {
				doc,
				setDoc,
				serverTimestamp
			};
		}, __vite__mapDeps([2,1]));
		if (account !== bound || target.auth.currentUser?.uid !== bound.uid) return false;
		await setDoc(doc(target.db, "user_module_progress", `${bound.uid}_${moduleId}`), {
			...fields,
			moduleId,
			userId: bound.uid,
			updatedAt: serverTimestamp(),
			...finished === void 0 ? {} : { completedAt: finished ? serverTimestamp() : null }
		}, { merge: true });
		if (account !== bound) return false;
		window.dispatchEvent(new CustomEvent("insco_account_progress_saved"));
		return true;
	} catch {
		if (account === bound) window.dispatchEvent(new CustomEvent("insco_account_progress_save_error"));
		return false;
	}
}
function saveAccountModuleCompletion(moduleId, completed, score = 100) {
	return saveAccountModule(moduleId, {
		isPassed: completed && score >= 75,
		score: completed ? score : 0,
		unlockedCertificate: completed && score >= 75
	}, completed);
}
//#endregion
export { saveAccountModuleCompletion as a, saveAccountModule as i, bindAccountAcademyProgress as n, readAccountAcademyProgress as r, academyActivityStorage as t };
