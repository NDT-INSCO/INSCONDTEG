import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { n as createLucideIcon, t as Eye } from "./eye-DyafRkmV.js";
import { n as EyeOff, r as CircleAlert, t as RotateCw } from "./rotate-cw-BZxM_76B.js";
import { t as ClipboardCheck } from "./clipboard-check-CejqIRPH.js";
import { n as LayoutDashboard, r as ClipboardList, t as Save } from "./save-i6p7a9jN.js";
import { t as Trash2 } from "./trash-2-nZVRBPor.js";
import { Bn as Mail, Cr as ArrowLeft, Gn as KeyRound, Ln as Megaphone, Sn as ShieldCheck, Sr as ArrowRight, Tn as Search, Un as LoaderCircle, Vn as LogOut, Zn as FileText, cn as ADMIN_HASH, dn as isQuoteStatus, fr as Check, gr as Building2, jn as Phone, kn as Plus, ln as QUOTE_STATUSES, lr as ChevronRight, on as externalAdminLink, sn as ADMIN_API, tr as Earth, un as isAdminPassword, ur as ChevronLeft, wr as Activity, xn as Sparkles, xr as ArrowUpRight } from "./index-CgJ65bxK.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Clock4 = createLucideIcon("clock-4", [["path", {
	d: "M12 6v6l4 2",
	key: "mmk7yg"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Fingerprint = createLucideIcon("fingerprint", [
	["path", {
		d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
		key: "1nerag"
	}],
	["path", {
		d: "M14 13.12c0 2.38 0 6.38-1 8.88",
		key: "o46ks0"
	}],
	["path", {
		d: "M17.29 21.02c.12-.6.43-2.3.5-3.02",
		key: "ptglia"
	}],
	["path", {
		d: "M2 12a10 10 0 0 1 18-6",
		key: "ydlgp0"
	}],
	["path", {
		d: "M2 16h.01",
		key: "1gqxmh"
	}],
	["path", {
		d: "M21.8 16c.2-2 .131-5.354 0-6",
		key: "drycrb"
	}],
	["path", {
		d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
		key: "1tidbn"
	}],
	["path", {
		d: "M8.65 22c.21-.66.45-1.32.57-2",
		key: "13wd9y"
	}],
	["path", {
		d: "M9 6.8a6 6 0 0 1 9 5.2v2",
		key: "1fr1j5"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Inbox = createLucideIcon("inbox", [["polyline", {
	points: "22 12 16 12 14 15 10 15 8 12 2 12",
	key: "o97t9d"
}], ["path", {
	d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
	key: "oot6mr"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LockKeyhole = createLucideIcon("lock-keyhole", [
	["circle", {
		cx: "12",
		cy: "16",
		r: "1",
		key: "1au0dj"
	}],
	["rect", {
		x: "3",
		y: "10",
		width: "18",
		height: "12",
		rx: "2",
		key: "6s8ecr"
	}],
	["path", {
		d: "M7 10V7a5 5 0 0 1 10 0v3",
		key: "1pqi11"
	}]
]);
//#endregion
//#region src/admin/client.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var AdminApiError = class extends Error {
	code;
	retryAfter;
	constructor(code, retryAfter = 0) {
		super(code);
		this.code = code;
		this.retryAfter = retryAfter;
	}
};
async function request(path, options = {}) {
	const controller = new AbortController();
	const abort = () => controller.abort();
	const timeout = setTimeout(abort, 12e3);
	if (options.signal?.aborted) abort();
	else options.signal?.addEventListener("abort", abort, { once: true });
	try {
		const response = await fetch(`${ADMIN_API}${path}`, {
			method: options.method ?? "GET",
			credentials: "same-origin",
			redirect: "error",
			cache: "no-store",
			signal: controller.signal,
			headers: {
				Accept: "application/json",
				...options.body === void 0 ? {} : { "Content-Type": "application/json" }
			},
			body: options.body === void 0 ? void 0 : JSON.stringify(options.body)
		});
		if (response.status === 204) return void 0;
		if (!response.headers.get("content-type")?.includes("application/json")) throw new AdminApiError(response.status < 500 ? "not_configured" : "unavailable");
		const data = await response.json();
		if (!response.ok) throw new AdminApiError(data?.error || "unavailable", Number(response.headers.get("Retry-After")) || 0);
		return data;
	} finally {
		clearTimeout(timeout);
		options.signal?.removeEventListener("abort", abort);
	}
}
var adminClient = {
	login: (password) => request("/login", {
		method: "POST",
		body: { password }
	}),
	logout: () => request("/logout", { method: "POST" }),
	dashboard: (signal) => request("/dashboard", { signal }),
	passkeyStatus: (signal) => request("/passkeys/status", { signal }),
	passkeys: (signal) => request("/passkeys", { signal }),
	passkeyAuthOptions: (signal) => request("/passkeys/authenticate/options", {
		method: "POST",
		body: {},
		signal
	}),
	passkeyAuthVerify: (response, signal) => request("/passkeys/authenticate/verify", {
		method: "POST",
		body: { response },
		signal
	}),
	passkeyRegisterOptions: (label, signal) => request("/passkeys/register/options", {
		method: "POST",
		body: { label },
		signal
	}),
	passkeyRegisterVerify: (response, signal) => request("/passkeys/register/verify", {
		method: "POST",
		body: { response },
		signal
	}),
	removePasskey: (id, signal) => request(`/passkeys/${encodeURIComponent(id)}`, {
		method: "DELETE",
		signal
	}),
	quotes: (search, status, page, signal) => {
		return request(`/quotes?${new URLSearchParams({
			q: search,
			status,
			page: String(page)
		})}`, { signal });
	},
	quote: (reference, signal) => request(`/quotes/${encodeURIComponent(reference)}`, { signal }),
	updateQuote: (reference, status) => request(`/quotes/${encodeURIComponent(reference)}`, {
		method: "PATCH",
		body: { status }
	}),
	saveAnnouncement: (input) => request("/announcement", {
		method: "PUT",
		body: input
	})
};
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/bufferToBase64URLString.js
/**
* Convert the given array buffer into a Base64URL-encoded string. Ideal for converting various
* credential response ArrayBuffers to string for sending back to the server as JSON.
*
* Helper method to compliment `base64URLStringToBuffer`
*/
function bufferToBase64URLString(buffer) {
	const bytes = new Uint8Array(buffer);
	let str = "";
	for (const charCode of bytes) str += String.fromCharCode(charCode);
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/base64URLStringToBuffer.js
/**
* Convert from a Base64URL-encoded string to an Array Buffer. Best used when converting a
* credential ID from a JSON string to an ArrayBuffer, like in allowCredentials or
* excludeCredentials
*
* Helper method to compliment `bufferToBase64URLString`
*/
function base64URLStringToBuffer(base64URLString) {
	const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
	/**
	* Pad with '=' until it's a multiple of four
	* (4 - (85 % 4 = 1) = 3) % 4 = 3 padding
	* (4 - (86 % 4 = 2) = 2) % 4 = 2 padding
	* (4 - (87 % 4 = 3) = 1) % 4 = 1 padding
	* (4 - (88 % 4 = 0) = 4) % 4 = 0 padding
	*/
	const padLength = (4 - base64.length % 4) % 4;
	const padded = base64.padEnd(base64.length + padLength, "=");
	const binary = atob(padded);
	const buffer = new ArrayBuffer(binary.length);
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return buffer;
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/browserSupportsWebAuthn.js
/**
* Determine if the browser is capable of Webauthn
*/
function browserSupportsWebAuthn() {
	return _browserSupportsWebAuthnInternals.stubThis(globalThis?.PublicKeyCredential !== void 0 && typeof globalThis.PublicKeyCredential === "function");
}
/**
* Make it possible to stub the return value during testing
* @ignore Don't include this in docs output
*/
var _browserSupportsWebAuthnInternals = { stubThis: (value) => value };
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/toPublicKeyCredentialDescriptor.js
function toPublicKeyCredentialDescriptor(descriptor) {
	const { id } = descriptor;
	return {
		...descriptor,
		id: base64URLStringToBuffer(id),
		transports: descriptor.transports,
		type: descriptor.type
	};
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/isValidDomain.js
/**
* A simple test to determine if a hostname is a properly-formatted domain name
*
* A "valid domain" is defined here: https://url.spec.whatwg.org/#valid-domain
*
* Regex was originally sourced from here, then remixed to add punycode support:
* https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s15.html
*/
function isValidDomain(hostname) {
	return hostname === "localhost" || /^((xn--[a-z0-9-]+|[a-z0-9]+(-[a-z0-9]+)*)\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(hostname);
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/webAuthnError.js
/**
* A custom Error used to return a more nuanced error detailing _why_ one of the eight documented
* errors in the spec was raised after calling `navigator.credentials.create()` or
* `navigator.credentials.get()`:
*
* - `AbortError`
* - `ConstraintError`
* - `InvalidStateError`
* - `NotAllowedError`
* - `NotSupportedError`
* - `SecurityError`
* - `TypeError`
* - `UnknownError`
*
* Error messages were determined through investigation of the spec to determine under which
* scenarios a given error would be raised.
*/
var WebAuthnError = class extends Error {
	constructor({ message, code, cause, name }) {
		super(message, { cause });
		Object.defineProperty(this, "code", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.name = name ?? cause.name;
		this.code = code;
	}
};
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/identifyRegistrationError.js
/**
* Attempt to intuit _why_ an error was raised after calling `navigator.credentials.create()`
*/
function identifyRegistrationError({ error, options }) {
	const { publicKey } = options;
	if (!publicKey) throw Error("options was missing required publicKey property");
	if (error.name === "AbortError") {
		if (options.signal instanceof AbortSignal) return new WebAuthnError({
			message: "Registration ceremony was sent an abort signal",
			code: "ERROR_CEREMONY_ABORTED",
			cause: error
		});
	} else if (error.name === "ConstraintError") {
		if (publicKey.authenticatorSelection?.requireResidentKey === true) return new WebAuthnError({
			message: "Discoverable credentials were required but no available authenticator supported it",
			code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
			cause: error
		});
		else if (options.mediation === "conditional" && publicKey.authenticatorSelection?.userVerification === "required") return new WebAuthnError({
			message: "User verification was required during automatic registration but it could not be performed",
			code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
			cause: error
		});
		else if (publicKey.authenticatorSelection?.userVerification === "required") return new WebAuthnError({
			message: "User verification was required but no available authenticator supported it",
			code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
			cause: error
		});
	} else if (error.name === "InvalidStateError") return new WebAuthnError({
		message: "The authenticator was previously registered",
		code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
		cause: error
	});
	else if (error.name === "NotAllowedError")
 /**
	* Pass the error directly through. Platforms are overloading this error beyond what the spec
	* defines and we don't want to overwrite potentially useful error messages.
	*/
	return new WebAuthnError({
		message: error.message,
		code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
		cause: error
	});
	else if (error.name === "NotSupportedError") {
		if (publicKey.pubKeyCredParams.filter((param) => param.type === "public-key").length === 0) return new WebAuthnError({
			message: "No entry in pubKeyCredParams was of type \"public-key\"",
			code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
			cause: error
		});
		return new WebAuthnError({
			message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
			code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
			cause: error
		});
	} else if (error.name === "SecurityError") {
		const effectiveDomain = globalThis.location.hostname;
		if (!isValidDomain(effectiveDomain)) return new WebAuthnError({
			message: `${globalThis.location.hostname} is an invalid domain`,
			code: "ERROR_INVALID_DOMAIN",
			cause: error
		});
		else if (publicKey.rp.id !== effectiveDomain) return new WebAuthnError({
			message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
			code: "ERROR_INVALID_RP_ID",
			cause: error
		});
	} else if (error.name === "TypeError") {
		if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) return new WebAuthnError({
			message: "User ID was not between 1 and 64 characters",
			code: "ERROR_INVALID_USER_ID_LENGTH",
			cause: error
		});
	} else if (error.name === "UnknownError") return new WebAuthnError({
		message: "The authenticator was unable to process the specified options, or could not create a new credential",
		code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
		cause: error
	});
	return error;
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/webAuthnAbortService.js
var BaseWebAuthnAbortService = class {
	constructor() {
		Object.defineProperty(this, "controller", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
	createNewAbortSignal() {
		if (this.controller) {
			const abortError = /* @__PURE__ */ new Error("Cancelling existing WebAuthn API call for new one");
			abortError.name = "AbortError";
			this.controller.abort(abortError);
		}
		const newController = new AbortController();
		this.controller = newController;
		return newController.signal;
	}
	cancelCeremony() {
		if (this.controller) {
			const abortError = /* @__PURE__ */ new Error("Manually cancelling existing WebAuthn API call");
			abortError.name = "AbortError";
			this.controller.abort(abortError);
			this.controller = void 0;
		}
	}
};
/**
* A service singleton to help ensure that only a single WebAuthn ceremony is active at a time.
*
* Users of **@simplewebauthn/browser** shouldn't typically need to use this, but it can help e.g.
* developers building projects that use client-side routing to better control the behavior of
* their UX in response to router navigation events.
*/
var WebAuthnAbortService = new BaseWebAuthnAbortService();
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/toAuthenticatorAttachment.js
var attachments = ["cross-platform", "platform"];
/**
* If possible coerce a `string` value into a known `AuthenticatorAttachment`
*/
function toAuthenticatorAttachment(attachment) {
	if (!attachment) return;
	if (attachments.indexOf(attachment) < 0) return;
	return attachment;
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/methods/startRegistration.js
/**
* Begin authenticator "registration" via WebAuthn attestation
*
* @param optionsJSON Output from **@simplewebauthn/server**'s `generateRegistrationOptions()`
* @param useAutoRegister (Optional) Try to silently create a passkey with the password manager that the user just signed in with. Defaults to `false`.
*/
async function startRegistration(options) {
	if (!options.optionsJSON && options.challenge) {
		console.warn("startRegistration() was not called correctly. It will try to continue with the provided options, but this call should be refactored to use the expected call structure instead. See https://simplewebauthn.dev/docs/packages/browser#typeerror-cannot-read-properties-of-undefined-reading-challenge for more information.");
		options = { optionsJSON: options };
	}
	const { optionsJSON, useAutoRegister = false } = options;
	if (!browserSupportsWebAuthn()) throw new Error("WebAuthn is not supported in this browser");
	const publicKey = {
		...optionsJSON,
		challenge: base64URLStringToBuffer(optionsJSON.challenge),
		user: {
			...optionsJSON.user,
			id: base64URLStringToBuffer(optionsJSON.user.id)
		},
		excludeCredentials: optionsJSON.excludeCredentials?.map(toPublicKeyCredentialDescriptor)
	};
	const createOptions = {};
	/**
	* Try to use conditional create to register a passkey for the user with the password manager
	* the user just used to authenticate with. The user won't be shown any prominent UI by the
	* browser.
	*/
	if (useAutoRegister) createOptions.mediation = "conditional";
	createOptions.publicKey = publicKey;
	createOptions.signal = WebAuthnAbortService.createNewAbortSignal();
	let credential;
	try {
		credential = await navigator.credentials.create(createOptions);
	} catch (err) {
		throw identifyRegistrationError({
			error: err,
			options: createOptions
		});
	}
	if (!credential) throw new Error("Registration was not completed");
	const { id, rawId, response, type } = credential;
	let transports = void 0;
	if (typeof response.getTransports === "function") transports = response.getTransports();
	let responsePublicKeyAlgorithm = void 0;
	if (typeof response.getPublicKeyAlgorithm === "function") try {
		responsePublicKeyAlgorithm = response.getPublicKeyAlgorithm();
	} catch (error) {
		warnOnBrokenImplementation("getPublicKeyAlgorithm()", error);
	}
	let responsePublicKey = void 0;
	if (typeof response.getPublicKey === "function") try {
		const _publicKey = response.getPublicKey();
		if (_publicKey !== null) responsePublicKey = bufferToBase64URLString(_publicKey);
	} catch (error) {
		warnOnBrokenImplementation("getPublicKey()", error);
	}
	let responseAuthenticatorData;
	if (typeof response.getAuthenticatorData === "function") try {
		responseAuthenticatorData = bufferToBase64URLString(response.getAuthenticatorData());
	} catch (error) {
		warnOnBrokenImplementation("getAuthenticatorData()", error);
	}
	return {
		id,
		rawId: bufferToBase64URLString(rawId),
		response: {
			attestationObject: bufferToBase64URLString(response.attestationObject),
			clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
			transports,
			publicKeyAlgorithm: responsePublicKeyAlgorithm,
			publicKey: responsePublicKey,
			authenticatorData: responseAuthenticatorData
		},
		type,
		clientExtensionResults: credential.getClientExtensionResults(),
		authenticatorAttachment: toAuthenticatorAttachment(credential.authenticatorAttachment)
	};
}
/**
* Visibly warn when we detect an issue related to a passkey provider intercepting WebAuthn API
* calls
*/
function warnOnBrokenImplementation(methodName, cause) {
	console.warn(`The browser extension that intercepted this WebAuthn API call incorrectly implemented ${methodName}. You should report this error to them.\n`, cause);
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/browserSupportsWebAuthnAutofill.js
/**
* Determine if the browser supports conditional UI, so that WebAuthn credentials can
* be shown to the user in the browser's typical password autofill popup.
*/
function browserSupportsWebAuthnAutofill() {
	if (!browserSupportsWebAuthn()) return _browserSupportsWebAuthnAutofillInternals.stubThis(new Promise((resolve) => resolve(false)));
	/**
	* I don't like the `as unknown` here but there's a `declare var PublicKeyCredential` in
	* TS' DOM lib that's making it difficult for me to just go `as PublicKeyCredentialFuture` as I
	* want. I think I'm fine with this for now since it's _supposed_ to be temporary, until TS types
	* have a chance to catch up.
	*/
	const globalPublicKeyCredential = globalThis.PublicKeyCredential;
	if (globalPublicKeyCredential?.isConditionalMediationAvailable === void 0) return _browserSupportsWebAuthnAutofillInternals.stubThis(new Promise((resolve) => resolve(false)));
	return _browserSupportsWebAuthnAutofillInternals.stubThis(globalPublicKeyCredential.isConditionalMediationAvailable());
}
var _browserSupportsWebAuthnAutofillInternals = { stubThis: (value) => value };
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/helpers/identifyAuthenticationError.js
/**
* Attempt to intuit _why_ an error was raised after calling `navigator.credentials.get()`
*/
function identifyAuthenticationError({ error, options }) {
	const { publicKey } = options;
	if (!publicKey) throw Error("options was missing required publicKey property");
	if (error.name === "AbortError") {
		if (options.signal instanceof AbortSignal) return new WebAuthnError({
			message: "Authentication ceremony was sent an abort signal",
			code: "ERROR_CEREMONY_ABORTED",
			cause: error
		});
	} else if (error.name === "NotAllowedError")
 /**
	* Pass the error directly through. Platforms are overloading this error beyond what the spec
	* defines and we don't want to overwrite potentially useful error messages.
	*/
	return new WebAuthnError({
		message: error.message,
		code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
		cause: error
	});
	else if (error.name === "SecurityError") {
		const effectiveDomain = globalThis.location.hostname;
		if (!isValidDomain(effectiveDomain)) return new WebAuthnError({
			message: `${globalThis.location.hostname} is an invalid domain`,
			code: "ERROR_INVALID_DOMAIN",
			cause: error
		});
		else if (publicKey.rpId !== effectiveDomain) return new WebAuthnError({
			message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
			code: "ERROR_INVALID_RP_ID",
			cause: error
		});
	} else if (error.name === "UnknownError") return new WebAuthnError({
		message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
		code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
		cause: error
	});
	return error;
}
//#endregion
//#region node_modules/@simplewebauthn/browser/esm/methods/startAuthentication.js
/**
* Begin authenticator "login" via WebAuthn assertion
*
* @param optionsJSON Output from **@simplewebauthn/server**'s `generateAuthenticationOptions()`
* @param useBrowserAutofill (Optional) Initialize conditional UI to enable logging in via browser autofill prompts. Defaults to `false`.
* @param verifyBrowserAutofillInput (Optional) Ensure a suitable `<input>` element is present when `useBrowserAutofill` is `true`. Defaults to `true`.
*/
async function startAuthentication(options) {
	if (!options.optionsJSON && options.challenge) {
		console.warn("startAuthentication() was not called correctly. It will try to continue with the provided options, but this call should be refactored to use the expected call structure instead. See https://simplewebauthn.dev/docs/packages/browser#typeerror-cannot-read-properties-of-undefined-reading-challenge for more information.");
		options = { optionsJSON: options };
	}
	const { optionsJSON, useBrowserAutofill = false, verifyBrowserAutofillInput = true } = options;
	if (!browserSupportsWebAuthn()) throw new Error("WebAuthn is not supported in this browser");
	let allowCredentials;
	if (optionsJSON.allowCredentials?.length !== 0) allowCredentials = optionsJSON.allowCredentials?.map(toPublicKeyCredentialDescriptor);
	const publicKey = {
		...optionsJSON,
		challenge: base64URLStringToBuffer(optionsJSON.challenge),
		allowCredentials
	};
	const getOptions = {};
	/**
	* Set up the page to prompt the user to select a credential for authentication via the browser's
	* input autofill mechanism.
	*/
	if (useBrowserAutofill) {
		if (!await browserSupportsWebAuthnAutofill()) throw Error("Browser does not support WebAuthn autofill");
		if (document.querySelectorAll("input[autocomplete$='webauthn']").length < 1 && verifyBrowserAutofillInput) throw Error("No <input> with \"webauthn\" as the only or last value in its `autocomplete` attribute was detected");
		getOptions.mediation = "conditional";
		publicKey.allowCredentials = [];
	}
	getOptions.publicKey = publicKey;
	getOptions.signal = WebAuthnAbortService.createNewAbortSignal();
	let credential;
	try {
		credential = await navigator.credentials.get(getOptions);
	} catch (err) {
		throw identifyAuthenticationError({
			error: err,
			options: getOptions
		});
	}
	if (!credential) throw new Error("Authentication was not completed");
	const { id, rawId, response, type } = credential;
	let userHandle = void 0;
	if (response.userHandle) userHandle = bufferToBase64URLString(response.userHandle);
	return {
		id,
		rawId: bufferToBase64URLString(rawId),
		response: {
			authenticatorData: bufferToBase64URLString(response.authenticatorData),
			clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
			signature: bufferToBase64URLString(response.signature),
			userHandle
		},
		type,
		clientExtensionResults: credential.getClientExtensionResults(),
		authenticatorAttachment: toAuthenticatorAttachment(credential.authenticatorAttachment)
	};
}
//#endregion
//#region src/admin/passkeyClient.ts
function passkeyBrowser() {
	if (typeof window === "undefined") return "unsupported";
	if (window.top !== window) return "embedded";
	return window.isSecureContext && browserSupportsWebAuthn() ? "ready" : "unsupported";
}
function ensureActive(signal) {
	if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
}
async function withDevice(signal, prompt) {
	ensureActive(signal);
	const cancel = () => WebAuthnAbortService.cancelCeremony();
	signal.addEventListener("abort", cancel, { once: true });
	try {
		return await prompt();
	} catch (error) {
		ensureActive(signal);
		if (error instanceof WebAuthnError && error.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") throw new AdminApiError("passkey_exists");
		throw new AdminApiError("passkey_prompt_failed");
	} finally {
		signal.removeEventListener("abort", cancel);
	}
}
async function signInWithPasskey(signal) {
	if (passkeyBrowser() !== "ready") throw new AdminApiError("passkey_browser");
	const optionsJSON = await adminClient.passkeyAuthOptions(signal);
	const response = await withDevice(signal, () => startAuthentication({ optionsJSON }));
	ensureActive(signal);
	await adminClient.passkeyAuthVerify(response, signal);
}
async function enrollPasskey(label, signal) {
	if (passkeyBrowser() !== "ready") throw new AdminApiError("passkey_browser");
	const optionsJSON = await adminClient.passkeyRegisterOptions(label, signal);
	const response = await withDevice(signal, () => startRegistration({ optionsJSON }));
	ensureActive(signal);
	return adminClient.passkeyRegisterVerify(response, signal);
}
//#endregion
//#region src/components/admin/AdminUi.tsx
var import_jsx_runtime = require_jsx_runtime();
function AdminBrand({ language }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-brand",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ad-brand-mark",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
				size: 22,
				"aria-hidden": "true"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
			lang: "en",
			dir: "ltr",
			children: ["INSCO", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "." })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: language === "ar" ? "مركز عمليات الموقع" : "Site operations" })] })]
	});
}
function BackIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
		size: 16,
		className: "ad-directional",
		"aria-hidden": "true"
	});
}
function AdminLoading({ language }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-loading",
		role: "status",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			size: 18,
			className: "ad-spin",
			"aria-hidden": "true"
		}), language === "ar" ? "جارٍ التحميل…" : "Loading…"]
	});
}
function AdminMessage({ children, error = true }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `ad-message ${error ? "is-error" : "is-success"}`,
		role: error ? "alert" : "status",
		children: [error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
			size: 16,
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children })]
	});
}
function PasskeyNewTab({ language }) {
	const ar = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "ad-passkey-tip",
		children: [
			ar ? "لاستخدام مفتاح المرور، " : "To use a passkey, ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: ADMIN_HASH,
				target: "_blank",
				rel: "noopener noreferrer",
				children: ar ? "افتح البوابة في تبويب مستقل" : "open the portal in its own tab"
			}),
			"."
		]
	});
}
function adminError(error, language) {
	const ar = language === "ar";
	const generic = ar ? "تعذّر إتمام العملية. تحقق من الاتصال وحاول مرة أخرى." : "Could not complete the request. Check your connection and try again.";
	if (!(error instanceof AdminApiError)) return generic;
	switch (error.code) {
		case "invalid_credentials":
		case "invalid_pin": return ar ? "كلمة المرور غير صحيحة." : "The password is incorrect.";
		case "rate_limited": {
			const minutes = Math.max(1, Math.ceil(error.retryAfter / 60));
			return ar ? `محاولات كثيرة. حاول مجددًا بعد ${numberText(minutes, language)} دقيقة.` : `Too many attempts. Try again in ${minutes} min.`;
		}
		case "cookies_blocked": return ar ? "تعذّر حفظ جلسة الدخول. افتح البوابة في تبويب مستقل وتأكد من السماح بملفات تعريف الارتباط." : "Your session could not be saved. Open the portal in its own tab and allow cookies.";
		case "origin_not_allowed": return ar ? "افتح البوابة من عنوانها المعتمد ثم حاول مجددًا." : "Open the portal at its configured address and try again.";
		case "passkey_browser": return ar ? "مفاتيح المرور غير متاحة في هذا المتصفح. استخدم كلمة المرور." : "Passkeys are unavailable in this browser. Use your password.";
		case "passkey_prompt_failed": return ar ? "لم يكتمل التحقق على جهازك. حاول مجددًا أو استخدم كلمة المرور." : "Device verification did not complete. Try again or use your password.";
		case "passkey_challenge_expired": return ar ? "انتهت مهلة التحقق. ابدأ المحاولة مرة أخرى في تبويب مستقل." : "The verification attempt expired. Start again in the portal’s own tab.";
		case "passkey_verification_failed": return ar ? "تعذّر الدخول بهذا المفتاح. جرّب مفتاحًا مسجّلًا أو استخدم كلمة المرور." : "This passkey did not sign you in. Try a registered passkey or use your password.";
		case "passkey_registration_failed": return ar ? "تعذّر حفظ مفتاح المرور. حاول إضافة المفتاح مرة أخرى." : "The passkey could not be saved. Try adding it again.";
		case "passkey_not_configured": return ar ? "مفاتيح المرور غير مهيّأة على هذا العنوان." : "Passkeys are not configured at this address.";
		case "no_passkeys": return ar ? "لا يوجد مفتاح مرور مسجّل. ادخل بكلمة المرور لإضافة مفتاح." : "No passkey is registered. Sign in with your password to add one.";
		case "passkey_password_required": return ar ? "سجّل الخروج ثم ادخل بكلمة المرور لإدارة مفاتيح المرور." : "Sign out and sign in with your password to manage passkeys.";
		case "passkey_exists": return ar ? "مفتاح المرور هذا مسجّل بالفعل." : "This passkey is already registered.";
		case "passkey_limit": return ar ? "تم الوصول إلى الحد الأقصى. احذف مفتاحًا قبل إضافة آخر." : "The passkey limit is reached. Remove a passkey before adding another.";
		case "passkey_not_found": return ar ? "مفتاح المرور لم يعد مسجّلًا." : "This passkey is no longer registered.";
		case "invalid_announcement": return ar ? "أضف نصًا في اللغتين قبل النشر والتزم بحد الأحرف." : "Add a message in both languages before publishing and stay within the character limit.";
		case "quote_not_found": return ar ? "هذا الطلب غير موجود." : "This request was not found.";
		default: return generic;
	}
}
function numberText(value, language) {
	return new Intl.NumberFormat(language === "ar" ? "ar-EG-u-nu-latn" : "en").format(value);
}
function shortDate(value, language, format = { dateStyle: "medium" }) {
	return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", format).format(new Date(value));
}
var STATUS_COPY = {
	new: {
		ar: "جديد",
		en: "New"
	},
	in_progress: {
		ar: "قيد المتابعة",
		en: "In follow-up"
	},
	closed: {
		ar: "مغلق",
		en: "Closed"
	}
};
function QuoteStatusPill({ status, language }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `ad-status ad-status-${status}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ad-dot" }), STATUS_COPY[status][language]]
	});
}
function EmptyQuotes({ filtered, language }) {
	const ar = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-empty",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ad-empty-icon",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {
					size: 22,
					"aria-hidden": "true"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: filtered ? ar ? "لا توجد نتائج مطابقة" : "No matching requests" : ar ? "لا توجد طلبات بعد" : "No requests yet" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: filtered ? ar ? "جرّب تعديل كلمة البحث أو اختيار حالة أخرى." : "Try a different search or status." : ar ? "تظهر هنا الطلبات التي يستقبلها نموذج عرض السعر عبر هذا الخادم." : "Requests accepted by this server’s quote form will appear here." })
		]
	});
}
var SERVICES = {
	general: {
		ar: "استفسار عام",
		en: "General enquiry"
	},
	pwht: {
		ar: "المعالجة الحرارية",
		en: "Heat treatment"
	},
	ndt: {
		ar: "الفحص غير الإتلافي",
		en: "NDT inspection"
	},
	ut_paut: {
		ar: "فحص UT / PAUT",
		en: "Ultrasonic & phased array"
	},
	rt_gamma: {
		ar: "التصوير الإشعاعي",
		en: "Radiographic testing"
	},
	mt_pt: {
		ar: "الفحوصات السطحية",
		en: "Surface testing"
	},
	pmi_hardness: {
		ar: "تحليل السبائك والصلادة",
		en: "Alloy analysis & hardness"
	},
	hydro: {
		ar: "اختبار هيدروستاتيكي",
		en: "Hydrostatic testing"
	},
	manpower: {
		ar: "توريد عمالة فنية",
		en: "Technical manpower"
	},
	prequal: {
		ar: "تسجيل مورد معتمد",
		en: "Vendor registration"
	}
};
function serviceText(service, language) {
	return Object.prototype.hasOwnProperty.call(SERVICES, service) ? SERVICES[service][language] : service;
}
function QuoteTable({ items, language, onOpen }) {
	const ar = language === "ar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ad-table-scroll",
		tabIndex: 0,
		role: "region",
		"aria-label": ar ? "جدول الطلبات" : "Requests table",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "ad-table",
			role: "table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				role: "rowgroup",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					role: "row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: ar ? "الشركة / المرجع" : "Company / reference"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: ar ? "الخدمة" : "Service"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: ar ? "الاستلام" : "Received"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: ar ? "الحالة" : "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							className: "ad-table-action",
							children: ar ? "التفاصيل" : "Details"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				role: "rowgroup",
				children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					role: "row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							role: "rowheader",
							scope: "row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: item.companyName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
								dir: "ltr",
								children: item.reference
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "ad-cell-service",
							role: "cell",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: serviceText(item.serviceType, language) })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "ad-cell-date",
							role: "cell",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								dateTime: item.receivedAt,
								children: shortDate(item.receivedAt, language)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "ad-cell-status",
							role: "cell",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteStatusPill, {
								status: item.status,
								language
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "ad-table-action",
							role: "cell",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ad-text-button",
								onClick: () => onOpen(item.reference),
								"aria-label": `${ar ? "عرض الطلب" : "View request"} ${item.reference}`,
								children: ar ? "عرض التفاصيل" : "View details"
							})
						})
					]
				}, item.reference))
			})]
		})
	});
}
//#endregion
//#region src/components/admin/AdminAnnouncement.tsx
function AdminAnnouncement({ language, initial, onSessionError, onSaved }) {
	const ar = language === "ar";
	const [draft, setDraft] = (0, import_react.useState)(initial);
	const [baseline, setBaseline] = (0, import_react.useState)(initial);
	const [previewLanguage, setPreviewLanguage] = (0, import_react.useState)(language);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const changed = draft.enabled !== baseline.enabled || draft.message.ar !== baseline.message.ar || draft.message.en !== baseline.message.en;
	const visibility = !draft.enabled ? ar ? "مخفي للزوّار" : "Hidden from visitors" : changed ? ar ? "ظاهر بعد الحفظ" : "Visible on save" : ar ? "منشور الآن" : "Published";
	async function save(event) {
		event.preventDefault();
		if (saving || !changed) return;
		if (draft.enabled && (!draft.message.ar.trim() || !draft.message.en.trim())) {
			setError(new AdminApiError("invalid_announcement"));
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const announcement = await adminClient.saveAnnouncement({
				enabled: draft.enabled,
				message: draft.message
			});
			setDraft(announcement);
			setBaseline(announcement);
			setSaved(true);
			onSaved(announcement);
		} catch (cause) {
			if (!onSessionError(cause)) setError(cause);
		} finally {
			setSaving(false);
		}
	}
	function edit(next) {
		setDraft(next);
		setSaved(false);
		setError(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-editor-grid",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "ad-panel",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ad-panel-heading",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
					size: 20,
					"aria-hidden": "true"
				}), ar ? "إعلان الصفحة الرئيسية" : "Homepage announcement"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "انشر رسالة قصيرة لزوّار صفحة الشركة أو احتفظ بها كمسودة." : "Publish a short message to company-site visitors or keep it as a draft." })] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "ad-form-stack ad-announcement-form",
				onSubmit: save,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ad-switch-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ar ? "إظهار الإعلان للزوّار" : "Show announcement to visitors" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: ar ? "يظهر أعلى الصفحة الرئيسية بعد الحفظ." : "Appears above the homepage hero once saved." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							role: "switch",
							type: "checkbox",
							className: "ad-switch",
							checked: draft.enabled,
							disabled: saving,
							onChange: (event) => edit({
								...draft,
								enabled: event.target.checked
							})
						})]
					}),
					["ar", "en"].map((locale) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ad-announcement-field",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: locale === "ar" ? ar ? "نص الإعلان بالعربية" : "Arabic announcement" : ar ? "نص الإعلان بالإنجليزية" : "English announcement" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "ad-input",
								rows: 3,
								dir: locale === "ar" ? "rtl" : "ltr",
								lang: locale,
								maxLength: 240,
								disabled: saving,
								value: draft.message[locale],
								placeholder: locale === "ar" ? "اكتب رسالة قصيرة للزوّار…" : "Write a short message for visitors…",
								onChange: (event) => edit({
									...draft,
									message: {
										...draft.message,
										[locale]: event.target.value
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
								className: "ad-counter",
								dir: "ltr",
								children: [
									numberText(draft.message[locale].length, language),
									" / ",
									numberText(240, language)
								]
							})
						]
					}, locale)),
					error != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(error, language) }),
					saved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, {
						error: false,
						children: baseline.enabled ? ar ? "تم نشر الإعلان على الموقع." : "The announcement is now published." : ar ? "تم الحفظ. الإعلان غير ظاهر للزوّار." : "Saved. The announcement is hidden from visitors."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-save-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "submit",
							className: "ad-button ad-primary",
							disabled: saving || !changed,
							children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 17,
								className: "ad-spin",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
								size: 17,
								"aria-hidden": "true"
							}), ar ? "حفظ الإعلان" : "Save announcement"]
						}), baseline.updatedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
							ar ? "آخر حفظ:" : "Last saved:",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								dateTime: baseline.updatedAt,
								children: shortDate(baseline.updatedAt, language, {
									dateStyle: "medium",
									timeStyle: "short"
								})
							})
						] })]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "ad-panel ad-preview-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ad-panel-heading",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
						size: 20,
						"aria-hidden": "true"
					}), ar ? "معاينة الإعلان" : "Announcement preview"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "كيف ستبدو الرسالة عند النشر" : "See how the message will look" })] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-preview-tools",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `ad-neutral-tag ${draft.enabled ? "is-enabled" : ""}`,
						children: [draft.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							size: 13,
							"aria-hidden": "true"
						}), visibility]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-preview-langs",
						"aria-label": ar ? "لغة المعاينة" : "Preview language",
						role: "group",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": previewLanguage === "ar",
							onClick: () => setPreviewLanguage("ar"),
							lang: "ar",
							children: "ع"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": previewLanguage === "en",
							onClick: () => setPreviewLanguage("en"),
							lang: "en",
							children: "EN"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-notice-preview",
					dir: previewLanguage === "ar" ? "rtl" : "ltr",
					lang: previewLanguage,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
						size: 20,
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: draft.message[previewLanguage].trim() || (previewLanguage === "ar" ? "سيظهر نص الإعلان هنا." : "Your announcement will appear here.") })]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/admin/AdminLogin.tsx
function SecurityGraphic() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-security-graphic",
		dir: "ltr",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 360 208",
				fill: "none",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
						id: "ad-graph-dots",
						width: "12",
						height: "12",
						patternUnits: "userSpaceOnUse",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "1",
							cy: "1",
							r: "1",
							fill: "#71e4d4",
							opacity: ".22"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
						id: "ad-graph-glow",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							stopColor: "#277e81",
							stopOpacity: ".45"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: "#0a1929",
							stopOpacity: "0"
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "10",
						y: "6",
						width: "340",
						height: "192",
						fill: "url(#ad-graph-dots)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "180",
						cy: "101",
						rx: "155",
						ry: "95",
						fill: "url(#ad-graph-glow)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M10 29V9h20m300 0h20v20M10 178v20h20m300 0h20v-20",
						stroke: "#4c7b86"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "180",
						cy: "103",
						r: "87",
						stroke: "#315f70",
						strokeDasharray: "3 7"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "180",
						cy: "103",
						r: "70",
						stroke: "#467682",
						opacity: ".76"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "180",
						cy: "103",
						r: "54",
						stroke: "#67d8ca",
						strokeOpacity: ".32",
						fill: "#0f2938"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M180 7v14m0 164v14m-94-96h-13m200 0h14M94 102H57L38 82H20m247 22h38l19 20h16",
						stroke: "#54bfb4",
						strokeOpacity: ".52"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "20",
						cy: "82",
						r: "3",
						fill: "#70e6d5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "340",
						cy: "124",
						r: "3",
						fill: "#70e6d5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "180",
						cy: "33",
						r: "3",
						fill: "#70e6d5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "180",
						cy: "173",
						r: "3",
						fill: "#70e6d5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M180 70c9 7 24 10 24 10v22c0 17-11 27-24 34-13-7-24-17-24-34V80s15-3 24-10Z",
						fill: "#17394a",
						stroke: "#8bf3e0",
						strokeWidth: "1.6"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "170",
						y: "98",
						width: "20",
						height: "15",
						rx: "3",
						fill: "#91f3df"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M175 98v-4a5 5 0 1 1 10 0v4",
						stroke: "#91f3df",
						strokeWidth: "2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M180 104v3",
						stroke: "#163544",
						strokeWidth: "2",
						strokeLinecap: "round"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "ad-graphic-tag",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ad-dot" }), " INSCO / ACCESS CONTROL"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ad-graphic-index",
				children: "01"
			})
		]
	});
}
function AdminLogin({ language, phase, linkedPortal, notice, onBack, onToggleLanguage, onRetry, onLogin, onPasskeyLogin }) {
	const ar = language === "ar";
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [pending, setPending] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [passkeyError, setPasskeyError] = (0, import_react.useState)(null);
	const [passkeyAvailable, setPasskeyAvailable] = (0, import_react.useState)(false);
	const [badFormat, setBadFormat] = (0, import_react.useState)(false);
	const headingRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const ceremony = (0, import_react.useRef)(null);
	const device = passkeyBrowser();
	(0, import_react.useEffect)(() => {
		headingRef.current?.focus({ preventScroll: true });
		return () => ceremony.current?.abort();
	}, []);
	(0, import_react.useEffect)(() => {
		if (linkedPortal || phase !== "login" || device === "unsupported") return;
		const controller = new AbortController();
		adminClient.passkeyStatus(controller.signal).then(({ available }) => {
			if (!controller.signal.aborted) setPasskeyAvailable(available);
		}).catch(() => {});
		return () => controller.abort();
	}, [
		phase,
		device,
		linkedPortal
	]);
	async function submit(event) {
		event.preventDefault();
		if (pending) return;
		setError(null);
		setPasskeyError(null);
		if (!isAdminPassword(password)) {
			setBadFormat(true);
			inputRef.current?.focus();
			return;
		}
		setBadFormat(false);
		setPending("password");
		setShowPassword(false);
		try {
			await onLogin(password);
		} catch (cause) {
			setError(cause);
			inputRef.current?.focus();
		} finally {
			setPassword("");
			setPending(null);
		}
	}
	async function usePasskey() {
		if (pending || ceremony.current) return;
		const controller = new AbortController();
		ceremony.current = controller;
		setPending("passkey");
		setPasskeyError(null);
		setError(null);
		setBadFormat(false);
		setShowPassword(false);
		setPassword("");
		try {
			await onPasskeyLogin(controller.signal);
		} catch (cause) {
			if (!controller.signal.aborted) setPasskeyError(cause);
		} finally {
			ceremony.current = null;
			if (!controller.signal.aborted) setPending(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-theme ad-login-view",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "ad-login-top",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminBrand, { language }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-login-tools",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ad-icon-button",
						onClick: onToggleLanguage,
						"aria-label": ar ? "Switch to English" : "التحويل إلى العربية",
						title: ar ? "English" : "العربية",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, {
							size: 17,
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							lang: ar ? "en" : "ar",
							children: ar ? "EN" : "ع"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ad-button ad-button-muted",
						onClick: onBack,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackIcon, {}), ar ? "العودة للموقع" : "Back to site"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "ad-login-main",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-login-shell",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-login-story",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ad-eyebrow",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ad-dot" }), ar ? "مساحة خاصة بفريق إنسكو" : "INSCO STAFF WORKSPACE"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ad-login-display",
								children: ar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"إدارة الموقع.",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "من مكان واحد." })
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"Site operations.",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "One workspace." })
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ad-login-story-copy",
								children: ar ? "تابع طلبات العملاء، راجع ما يحتاج تدخلًا، وانشر إعلانات الموقع من لوحة واحدة." : "Track incoming enquiries, see what needs attention, and publish announcements from one dashboard."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecurityGraphic, {})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-login-entry",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ad-entry-icon",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {
									size: 23,
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								tabIndex: -1,
								ref: headingRef,
								children: ar ? "دخول الإدارة" : "Admin sign-in"
							}),
							linkedPortal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ad-login-feedback",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "ad-subtle",
									children: ar ? "تسجيل الدخول يتم على عنوان الإدارة الآمن." : "Sign in at the secure admin address."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: "ad-button ad-primary",
									href: linkedPortal,
									target: "_blank",
									rel: "noopener noreferrer",
									children: [ar ? "فتح بوابة الإدارة" : "Open admin portal", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
										size: 17,
										className: "ad-directional",
										"aria-hidden": "true"
									})]
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								phase === "login" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "ad-subtle",
									children: passkeyAvailable && device === "ready" ? ar ? "استخدم كلمة المرور أو مفتاح المرور المسجّل." : "Use the admin password or a registered passkey." : ar ? "أدخل كلمة مرور الإدارة للمتابعة." : "Enter the admin password to continue."
								}),
								phase === "checking" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLoading, { language }),
								(phase === "disabled" || phase === "offline") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "ad-login-feedback",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminMessage, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: phase === "disabled" ? ar ? "بوابة الإدارة غير مهيّأة" : "Admin portal not configured" : ar ? "تعذّر الاتصال بالبوابة" : "Portal unreachable" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: phase === "disabled" ? ar ? "هذا العنوان غير متصل بخادم الإدارة. افتح رابط الإدارة المعتمد لتسجيل الدخول." : "This address is not connected to the admin server. Use the configured admin address to sign in." : ar ? "تحقق من عنوان الإدارة والاتصال ثم أعد المحاولة." : "Check the admin address and your connection, then try again." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "ad-button ad-button-muted",
										onClick: onRetry,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, {
											size: 16,
											"aria-hidden": "true"
										}), ar ? "إعادة التحقق" : "Check again"]
									})]
								})
							] }),
							!linkedPortal && phase === "login" && passkeyAvailable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ad-passkey-entry",
								children: [device === "embedded" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasskeyNewTab, { language }), device === "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "ad-button ad-button-muted ad-passkey-cta",
										disabled: pending !== null,
										onClick: () => void usePasskey(),
										"aria-describedby": "ad-passkey-hint",
										children: [pending === "passkey" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											size: 20,
											className: "ad-spin",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fingerprint, {
											size: 20,
											"aria-hidden": "true"
										}), pending === "passkey" ? ar ? "أكمل التحقق على جهازك…" : "Verify on your device…" : ar ? "الدخول بالبصمة أو Face ID" : "Sign in with fingerprint or Face ID"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										id: "ad-passkey-hint",
										className: "ad-passkey-tip",
										children: ar ? "يستخدم مفتاح المرور بصمة الإصبع أو الوجه أو رمز قفل الجهاز، حسب جهازك." : "Your passkey uses the fingerprint, face recognition, or screen lock supported by your device."
									}),
									passkeyError != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(passkeyError, language) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "ad-sign-in-divider",
										children: ar ? "أو" : "or"
									})
								] })]
							}),
							!linkedPortal && phase === "login" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "ad-login-form",
								method: "post",
								onSubmit: submit,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "ad-password",
										children: ar ? "كلمة المرور" : "Admin password"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ad-password-field",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
												size: 17,
												"aria-hidden": "true",
												className: "ad-password-leading"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: inputRef,
												id: "ad-password",
												name: "password",
												type: showPassword ? "text" : "password",
												dir: "ltr",
												autoComplete: "current-password",
												autoCapitalize: "none",
												spellCheck: false,
												required: true,
												maxLength: 128,
												value: password,
												placeholder: "••••••••",
												"aria-invalid": badFormat || void 0,
												onChange: (event) => {
													setPassword(event.target.value);
													setBadFormat(false);
													setError(null);
												},
												readOnly: pending !== null
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setShowPassword(!showPassword),
												disabled: pending !== null,
												"aria-label": showPassword ? ar ? "إخفاء كلمة المرور" : "Hide password" : ar ? "إظهار كلمة المرور" : "Show password",
												children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
													size: 18,
													"aria-hidden": "true"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
													size: 18,
													"aria-hidden": "true"
												})
											})
										]
									}),
									notice && !error && !badFormat && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, {
										error: false,
										children: notice === "logout" ? ar ? "تم تسجيل الخروج." : "You have signed out." : ar ? "انتهت الجلسة. سجّل دخولك مرة أخرى." : "Your session ended. Sign in again."
									}),
									badFormat && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: ar ? `أدخل كلمة مرور صالحة من 8 إلى 128 حرفًا.` : `Enter a valid password between 8 and 128 characters.` }),
									error != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(error, language) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "submit",
										className: "ad-button ad-primary ad-login-cta",
										disabled: pending !== null,
										children: [pending === "password" ? ar ? "جارٍ التحقق…" : "Verifying…" : ar ? "تسجيل الدخول" : "Sign in", pending === "password" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											size: 19,
											className: "ad-spin",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
											size: 19,
											className: "ad-directional",
											"aria-hidden": "true"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ad-login-secure",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									size: 16,
									"aria-hidden": "true"
								}), ar ? "الدخول مخصّص للإدارة فقط" : "Restricted to authorised staff"]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "ad-login-bottom",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "© 2026 INSCO" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ar ? "بوابة إدارة الموقع" : "Website administration" })]
			})
		]
	});
}
//#endregion
//#region src/components/admin/AdminOverview.tsx
function AdminOverview({ data, language, onInbox, onQuote, onAnnouncement }) {
	const ar = language === "ar";
	const metrics = [
		{
			status: void 0,
			icon: ClipboardList,
			label: ar ? "إجمالي الطلبات" : "Total requests",
			value: data.totals.total,
			tone: "cyan"
		},
		{
			status: "new",
			icon: Inbox,
			label: ar ? "طلبات جديدة" : "New requests",
			value: data.totals.new,
			tone: "teal"
		},
		{
			status: "in_progress",
			icon: Clock4,
			label: ar ? "قيد المتابعة" : "In follow-up",
			value: data.totals.in_progress,
			tone: "amber"
		},
		{
			status: "closed",
			icon: Check,
			label: ar ? "طلبات مغلقة" : "Closed requests",
			value: data.totals.closed,
			tone: "violet"
		}
	];
	const peak = Math.max(1, ...data.activity.map((day) => day.count));
	const insightText = data.totals.overdue > 0 ? ar ? `هناك ${numberText(data.totals.overdue, language)} من الطلبات المفتوحة منذ ٤٨ ساعة أو أكثر.` : `${data.totals.overdue} open request(s) have been waiting for at least 48 hours.` : data.totals.new > 0 ? ar ? `لديك ${numberText(data.totals.new, language)} من الطلبات الجديدة بانتظار المراجعة.` : `${data.totals.new} new request(s) are waiting for review.` : ar ? "لا توجد طلبات جديدة أو متأخرة تحتاج إلى مراجعة الآن." : "No new or overdue requests need your attention right now.";
	const services = [
		{
			title: ar ? "صندوق عروض الأسعار" : "Quote inbox",
			on: true,
			offLabel: ""
		},
		{
			title: ar ? "إشعارات الطلبات الخارجية" : "External quote notifications",
			on: data.services.rfqNotificationsConfigured,
			offLabel: ar ? "الصندوق فقط" : "Inbox only"
		},
		{
			title: ar ? "المستشار الذكي" : "AI tutor",
			on: data.services.tutorConfigured,
			offLabel: ar ? "غير مهيّأ" : "Not configured"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-stack",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "ad-welcome",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ad-eyebrow",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ad-dot" }), ar ? "نظرة تشغيلية" : "OPERATIONS OVERVIEW"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: ar ? "لوحة الإدارة" : "Website dashboard" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "تابع طلبات العملاء وإعلانات الموقع، واعرف ما يحتاج إلى متابعتك." : "Track customer requests and site announcements, and see what needs your attention." })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-welcome-art",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
							size: 73,
							strokeWidth: 1.15
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ad-metrics",
				"aria-label": ar ? "ملخص الطلبات" : "Requests summary",
				children: metrics.map(({ label, value, icon: Icon, tone, status }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `ad-metric ad-tone-${tone}`,
					onClick: () => onInbox(status),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ad-metric-top",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ad-metric-icon",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									size: 18,
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
								size: 15,
								className: "ad-corner-arrow",
								"aria-hidden": "true"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: numberText(value, language) }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })
					]
				}, label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ad-overview-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "ad-panel ad-activity",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-panel-heading",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {
							size: 19,
							"aria-hidden": "true"
						}), ar ? "نشاط الطلبات" : "Request activity"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "عدد الطلبات المستلمة يوميًا" : "Daily intake of quote requests" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ad-neutral-tag",
							children: ar ? "آخر ٧ أيام · UTC" : "Last 7 days · UTC"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-chart",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ad-chart-grid",
							"aria-hidden": "true",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "ad-chart-bars",
							"aria-label": ar ? "طلبات كل يوم" : "Requests by day",
							children: data.activity.map(({ day, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: count > 0 ? "has-count" : "",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "ad-chart-track",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "ad-chart-bar",
										style: { height: count ? `${Math.max(9, count / peak * 82)}%` : "2px" },
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: numberText(count, language) })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
									dateTime: day,
									children: shortDate(day, language, {
										timeZone: "UTC",
										day: "numeric",
										month: "numeric"
									})
								})]
							}, day))
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "ad-panel ad-monitor",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ad-panel-heading",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								size: 19,
								"aria-hidden": "true"
							}), ar ? "متابعة ذكية" : "Smart follow-up"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "تنبيه حسب حالة الطلبات" : "Updates based on request status" })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `ad-insight ${data.totals.overdue ? "is-urgent" : ""}`,
							children: [data.totals.overdue > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock4, {
								size: 19,
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {
								size: 19,
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: data.totals.overdue > 0 ? ar ? "طلبات متأخرة" : "Overdue requests" : ar ? "أولوية المتابعة" : "Follow-up priority" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: insightText }),
								(data.totals.overdue > 0 || data.totals.new > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ad-text-button",
									onClick: () => onInbox(data.totals.overdue > 0 ? void 0 : "new"),
									children: ar ? "راجع صندوق الطلبات" : "Review the inbox"
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "ad-services",
							children: services.map((service) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: service.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: `ad-service-state ${service.on ? "is-on" : ""}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ad-dot" }), service.on ? ar ? "مهيّأ" : "Configured" : service.offLabel]
							})] }, service.title))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "ad-panel ad-recent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-panel-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
						size: 19,
						"aria-hidden": "true"
					}), ar ? "أحدث الطلبات" : "Recent requests"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "آخر الطلبات المستلمة عبر النموذج" : "Latest enquiries accepted by the quote form" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ad-button ad-button-muted",
						onClick: () => onInbox(),
						children: [ar ? "عرض الكل" : "View all", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
							size: 16,
							className: "ad-corner-arrow",
							"aria-hidden": "true"
						})]
					})]
				}), data.recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteTable, {
					items: data.recent,
					language,
					onOpen: onQuote
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyQuotes, { language })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "ad-panel ad-announcement-shortcut",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ad-metric-icon",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
							size: 19,
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: ar ? "إعلان الصفحة الرئيسية" : "Homepage announcement" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: data.announcement.enabled ? ar ? "هناك إعلان منشور حاليًا." : "An announcement is currently published." : ar ? "لا يوجد إعلان منشور حاليًا." : "No announcement is currently published." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ad-button ad-button-muted",
						onClick: onAnnouncement,
						children: ar ? "إدارة الإعلان" : "Manage announcement"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/components/admin/AdminPasskeys.tsx
function AdminPasskeys({ language, onSessionError }) {
	const ar = language === "ar";
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [reload, setReload] = (0, import_react.useState)(0);
	const [label, setLabel] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [working, setWorking] = (0, import_react.useState)(null);
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const operation = (0, import_react.useRef)(null);
	const device = passkeyBrowser();
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		setLoadError(null);
		adminClient.passkeys(controller.signal).then((data) => {
			if (!controller.signal.aborted) setSettings(data);
		}).catch((cause) => {
			if (!controller.signal.aborted && !onSessionError(cause)) setLoadError(cause);
		});
		return () => controller.abort();
	}, [onSessionError, reload]);
	(0, import_react.useEffect)(() => () => operation.current?.abort(), []);
	async function perform(kind, action) {
		if (operation.current) return;
		const controller = new AbortController();
		operation.current = controller;
		setWorking(kind);
		setError(null);
		setNotice(null);
		try {
			await action(controller.signal);
		} catch (cause) {
			if (!controller.signal.aborted && !onSessionError(cause)) {
				if (cause instanceof AdminApiError && cause.code === "passkey_password_required") {
					setSettings((current) => current && {
						...current,
						canManage: false
					});
					setConfirmId(null);
				}
				setError(cause);
			}
		} finally {
			operation.current = null;
			if (!controller.signal.aborted) setWorking(null);
		}
	}
	function add(event) {
		event.preventDefault();
		if (!settings?.canManage || settings.items.length >= 10 || device !== "ready") return;
		setConfirmId(null);
		perform("add", async (signal) => {
			const item = await enrollPasskey(label.trim() || (ar ? "جهازي" : "My device"), signal);
			if (signal.aborted) return;
			setSettings((current) => current && {
				...current,
				items: [item, ...current.items]
			});
			setLabel("");
			setNotice("added");
		});
	}
	function remove(item) {
		if (!settings?.canManage || confirmId !== item.id) return;
		perform("remove", async (signal) => {
			await adminClient.removePasskey(item.id, signal);
			if (signal.aborted) return;
			setSettings((current) => current && {
				...current,
				items: current.items.filter((key) => key.id !== item.id)
			});
			setConfirmId(null);
			setNotice("removed");
		});
	}
	if (loadError != null) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ad-panel ad-stack",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(loadError, language) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "ad-button ad-button-muted ad-passkey-retry",
			onClick: () => setReload((value) => value + 1),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, {
				size: 16,
				"aria-hidden": "true"
			}), ar ? "إعادة التحميل" : "Try again"]
		})]
	});
	if (!settings) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "ad-panel",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLoading, { language })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-stack",
		children: [
			error != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(error, language) }),
			notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, {
				error: false,
				children: notice === "added" ? ar ? "تم تسجيل مفتاح المرور. يمكنك استخدامه عند تسجيل الدخول مرة أخرى." : "Passkey added. You can use it the next time you sign in." : ar ? "تم إلغاء مفتاح المرور وإنهاء جلساته المفتوحة." : "Passkey revoked and its open sessions ended."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ad-detail-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "ad-panel",
					"aria-labelledby": "ad-passkey-enroll",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ad-panel-heading",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								id: "ad-passkey-enroll",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fingerprint, {
									size: 19,
									"aria-hidden": "true"
								}), ar ? "الدخول بالبصمة أو الوجه" : "Fingerprint or Face ID"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "يستخدم مفتاح المرور طريقة التحقق المتوفرة على جهازك. لا يتلقّى الموقع بصمتك أو بيانات وجهك." : "A passkey uses your device’s security check. Your fingerprint and face data never reach the site." })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ad-passkey-tip",
							children: ar ? "تظل كلمة المرور متاحة للدخول، حتى لو غيّرت جهازك." : "Your password remains available, even if you change devices."
						}),
						!settings.enabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ad-passkey-tip",
							children: ar ? "مفاتيح المرور غير مهيّأة على هذا العنوان. افتح عنوان HTTPS المعتمد للبوابة." : "Passkeys are not configured here. Open the portal at its configured HTTPS address."
						}) : !settings.canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ad-passkey-tip",
							children: ar ? "للإضافة أو الإلغاء، سجّل الخروج وادخل بكلمة المرور. يمكنك إدارة المفاتيح لمدة 10 دقائق بعد الدخول بها." : "To add or revoke a key, sign out and sign in with your password. You can manage keys for 10 minutes after using it."
						}) : device === "embedded" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasskeyNewTab, { language }) : device !== "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ad-passkey-tip",
							children: ar ? "استخدم متصفحًا يدعم مفاتيح المرور لتسجيل جهازك." : "Use a browser that supports passkeys to register your device."
						}) : settings.items.length >= 10 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ad-passkey-tip",
							children: ar ? "احذف مفتاحًا قبل إضافة آخر." : "Remove a passkey before adding another."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "ad-form-stack ad-passkey-form",
							onSubmit: add,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								htmlFor: "ad-passkey-label",
								children: [ar ? "اسم الجهاز (اختياري)" : "Device name (optional)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "ad-passkey-label",
									className: "ad-input",
									dir: "auto",
									type: "text",
									autoComplete: "off",
									maxLength: 48,
									placeholder: ar ? "مثال: هاتفي" : "e.g. My phone",
									value: label,
									onChange: (event) => setLabel(event.target.value),
									disabled: working !== null
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								className: "ad-button ad-primary",
								disabled: working !== null,
								children: [working === "add" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									size: 17,
									className: "ad-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									size: 17,
									"aria-hidden": "true"
								}), working === "add" ? ar ? "أكمل التحقق على جهازك…" : "Verify on your device…" : ar ? "إضافة مفتاح مرور" : "Add a passkey"]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "ad-panel",
					"aria-labelledby": "ad-passkey-list",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-panel-heading",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							id: "ad-passkey-list",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
								size: 18,
								"aria-hidden": "true"
							}), ar ? "المفاتيح المسجّلة" : "Registered passkeys"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "ألغِ مفتاح أي جهاز لم تعد تستخدمه." : "Revoke the key for a device you no longer use." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ad-neutral-tag",
							dir: "ltr",
							children: [
								numberText(settings.items.length, language),
								" / ",
								10
							]
						})]
					}), settings.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ad-empty",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ar ? "لا توجد مفاتيح مرور مسجّلة" : "No passkeys registered" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "ad-passkey-list",
						children: settings.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ad-passkey-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ad-passkey-item",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: item.label }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
										ar ? "أُضيف في" : "Added",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
											dateTime: item.createdAt,
											children: shortDate(item.createdAt, language)
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.lastUsedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										ar ? "آخر استخدام:" : "Last used:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
											dateTime: item.lastUsedAt,
											children: shortDate(item.lastUsedAt, language)
										})
									] }) : ar ? "لم يُستخدم بعد" : "Not used yet" })
								]
							}), settings.canManage && confirmId !== item.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ad-button ad-button-muted",
								disabled: working !== null,
								"aria-label": `${ar ? "إلغاء مفتاح المرور:" : "Revoke passkey:"} ${item.label}`,
								onClick: () => {
									setConfirmId(item.id);
									setNotice(null);
									setError(null);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									size: 15,
									"aria-hidden": "true"
								}), ar ? "إلغاء المفتاح" : "Revoke"]
							})]
						}), settings.canManage && confirmId === item.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ad-passkey-confirm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "سيُمنع الدخول بهذا المفتاح وتُنهى جلساته المفتوحة. سيظل المفتاح محفوظًا على جهازك حتى تزيله منه." : "This key can no longer sign in, and its open sessions will end. It stays on your device until you remove it there." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ad-button ad-passkey-danger",
								disabled: working !== null,
								onClick: () => remove(item),
								children: working === "remove" ? ar ? "جارٍ الإلغاء…" : "Revoking…" : ar ? "تأكيد الإلغاء" : "Confirm revocation"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ad-button ad-button-muted",
								disabled: working !== null,
								onClick: () => setConfirmId(null),
								children: ar ? "رجوع" : "Cancel"
							})] })]
						})] }, item.id))
					})]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/admin/AdminQuotes.tsx
function AdminQuotes({ language, initialStatus, reference, onOpen, onSessionError, onUpdate }) {
	const ar = language === "ar";
	const [query, setQuery] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)(initialStatus);
	const [page, setPage] = (0, import_react.useState)(1);
	const [version, setVersion] = (0, import_react.useState)(0);
	const [load, setLoad] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (reference) return;
		const controller = new AbortController();
		setLoad(null);
		adminClient.quotes(search, status, page, controller.signal).then((data) => {
			if (!controller.signal.aborted) setLoad({ data });
		}).catch((error) => {
			if (!controller.signal.aborted && !onSessionError(error)) setLoad({ error });
		});
		return () => controller.abort();
	}, [
		reference,
		search,
		status,
		page,
		version,
		onSessionError
	]);
	if (reference) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteDetails, {
		reference,
		language,
		onBack: () => {
			setLoad(null);
			onOpen(null);
		},
		onSessionError,
		onUpdate
	}, reference);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ad-panel ad-inbox",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ad-panel-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {
					size: 20,
					"aria-hidden": "true"
				}), ar ? "صندوق طلبات عروض الأسعار" : "Quote request inbox"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "ابحث عن الطلبات المستلمة عبر هذا الخادم وافتحها لمتابعة حالتها." : "Find requests received by this server and open them to update their status." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ad-button ad-button-muted",
					onClick: () => setVersion((value) => value + 1),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, {
						size: 16,
						"aria-hidden": "true"
					}), ar ? "تحديث القائمة" : "Refresh list"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "ad-filters",
				onSubmit: (event) => {
					event.preventDefault();
					setSearch(query.trim());
					setPage(1);
					setVersion((value) => value + 1);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ad-filter-search",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ar ? "ابحث في الصندوق" : "Search the inbox" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ad-icon-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 17,
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ad-input",
								type: "search",
								value: query,
								onChange: (event) => setQuery(event.target.value),
								maxLength: 160,
								placeholder: ar ? "اسم الشركة أو رقم الطلب" : "Company name or reference",
								dir: "auto"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ar ? "تصفية حسب الحالة" : "Filter by status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "ad-input",
						value: status,
						onChange: (event) => {
							const value = event.target.value;
							setStatus(isQuoteStatus(value) ? value : "");
							setPage(1);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: ar ? "كل الحالات" : "All statuses"
						}), QUOTE_STATUSES.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value,
							children: STATUS_COPY[value][language]
						}, value))]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "ad-button ad-primary",
						children: ar ? "بحث" : "Search"
					})
				]
			}),
			!load && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLoading, { language }),
			load && "error" in load && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(load.error, language) }),
			load && "data" in load && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [load.data.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteTable, {
				items: load.data.items,
				language,
				onOpen
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyQuotes, {
				filtered: Boolean(search || status),
				language
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ad-pagination",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					role: "status",
					children: ar ? `عدد النتائج: ${numberText(load.data.total, language)}` : `Results: ${numberText(load.data.total, language)}`
				}), load.data.pages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ad-icon-button",
						disabled: load.data.page <= 1,
						onClick: () => setPage(load.data.page - 1),
						"aria-label": ar ? "الصفحة السابقة" : "Previous page",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							size: 18,
							className: "ad-directional",
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("bdi", { children: [
						numberText(load.data.page, language),
						" / ",
						numberText(load.data.pages, language)
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ad-icon-button",
						disabled: load.data.page >= load.data.pages,
						onClick: () => setPage(load.data.page + 1),
						"aria-label": ar ? "الصفحة التالية" : "Next page",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							size: 18,
							className: "ad-directional",
							"aria-hidden": "true"
						})
					})
				] })]
			})] })
		]
	});
}
function QuoteDetails({ reference, language, onBack, onSessionError, onUpdate }) {
	const ar = language === "ar";
	const [load, setLoad] = (0, import_react.useState)(null);
	const [version, setVersion] = (0, import_react.useState)(0);
	const [nextStatus, setNextStatus] = (0, import_react.useState)("new");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		setLoad(null);
		adminClient.quote(reference, controller.signal).then((data) => {
			if (controller.signal.aborted) return;
			setLoad({ data });
			setNextStatus(data.status);
		}).catch((cause) => {
			if (!controller.signal.aborted && !onSessionError(cause)) setLoad({ error: cause });
		});
		return () => controller.abort();
	}, [
		reference,
		version,
		onSessionError
	]);
	async function save(event) {
		event.preventDefault();
		if (saving) return;
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			const data = await adminClient.updateQuote(reference, nextStatus);
			setLoad({ data });
			setNextStatus(data.status);
			setSaved(true);
			onUpdate();
		} catch (cause) {
			if (!onSessionError(cause)) setError(cause);
		} finally {
			setSaving(false);
		}
	}
	const quote = load && "data" in load ? load.data : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-stack",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "ad-button ad-button-muted",
				onClick: onBack,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackIcon, {}), ar ? "العودة للطلبات" : "Back to requests"]
			}) }),
			!load && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "ad-panel",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLoading, { language })
			}),
			load && "error" in load && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "ad-panel ad-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(load.error, language) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ad-button ad-button-muted",
					onClick: () => setVersion((value) => value + 1),
					children: ar ? "أعد المحاولة" : "Try again"
				}) })]
			}),
			quote && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ad-detail-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "ad-panel",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ad-panel-heading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, {
								size: 20,
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: quote.companyName })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ad-mono",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: quote.reference })
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteStatusPill, {
								status: quote.status,
								language
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "ad-quote-facts",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: ar ? "اسم المسؤول" : "Contact name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									dir: "auto",
									children: quote.contactName || "—"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: ar ? "الخدمة المطلوبة" : "Requested service" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									dir: "auto",
									children: serviceText(quote.serviceType, language)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: ar ? "وقت الاستلام" : "Received at" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: shortDate(quote.receivedAt, language, {
									dateStyle: "medium",
									timeStyle: "short"
								}) })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: ar ? "موقع المشروع" : "Project location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									dir: "auto",
									children: quote.projectLocation || "—"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: ar ? "البريد الإلكتروني" : "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `mailto:${encodeURIComponent(quote.email).replace("%40", "@")}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
										size: 15,
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", { children: quote.email })]
								}) })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: ar ? "رقم الهاتف" : "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `tel:${quote.phone.trim().startsWith("+") ? "+" : ""}${quote.phone.replace(/\D/g, "")}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
										size: 15,
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bdi", {
										dir: "ltr",
										children: quote.phone
									})]
								}) })] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ad-quote-description",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: ar ? "تفاصيل الطلب" : "Request details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								dir: "auto",
								children: quote.description || (ar ? "لم تُضف تفاصيل." : "No details provided.")
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "ad-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ad-panel-heading",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: ar ? "إدارة حالة الطلب" : "Manage request status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ar ? "تظهر الحالة لفريق الإدارة فقط." : "The status is visible to admins only." })] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "ad-form-stack",
						onSubmit: save,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [ar ? "الحالة" : "Status", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "ad-input",
								value: nextStatus,
								disabled: saving,
								onChange: (event) => {
									const value = event.target.value;
									if (isQuoteStatus(value)) setNextStatus(value);
									setSaved(false);
								},
								children: QUOTE_STATUSES.map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: status,
									children: STATUS_COPY[status][language]
								}, status))
							})] }),
							error != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(error, language) }),
							saved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, {
								error: false,
								children: ar ? "تم حفظ حالة الطلب." : "Request status saved."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								className: "ad-button ad-primary",
								disabled: saving || nextStatus === quote.status,
								children: [saving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									size: 16,
									className: "ad-spin",
									"aria-hidden": "true"
								}), ar ? "حفظ الحالة" : "Save status"]
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/admin/AdminPortal.tsx
function AdminPortal(props) {
	const [gate, setGate] = (0, import_react.useState)({ kind: "checking" });
	const [check, setCheck] = (0, import_react.useState)(0);
	const destination = externalAdminLink();
	const linkedPortal = destination && new URL(destination).origin !== window.location.origin ? destination : null;
	(0, import_react.useEffect)(() => {
		if (linkedPortal) return;
		const controller = new AbortController();
		adminClient.dashboard(controller.signal).then((initial) => {
			if (!controller.signal.aborted) setGate({
				kind: "ready",
				initial
			});
		}).catch((error) => {
			if (controller.signal.aborted) return;
			const code = error instanceof AdminApiError ? error.code : "";
			setGate({ kind: code === "signed_out" ? "login" : code === "not_configured" ? "disabled" : "offline" });
		});
		return () => controller.abort();
	}, [check, linkedPortal]);
	const onSessionError = (0, import_react.useCallback)((error) => {
		if (!(error instanceof AdminApiError)) return false;
		if (error.code === "signed_out") {
			setGate({
				kind: "login",
				notice: "expired"
			});
			return true;
		}
		if (error.code === "not_configured") {
			setGate({ kind: "disabled" });
			return true;
		}
		return false;
	}, []);
	async function login(authenticate, signal) {
		try {
			await authenticate();
			const initial = await adminClient.dashboard(signal);
			if (!signal?.aborted) setGate({
				kind: "ready",
				initial
			});
		} catch (error) {
			if (signal?.aborted) return;
			if (error instanceof AdminApiError && error.code === "signed_out") throw new AdminApiError("cookies_blocked");
			if (!onSessionError(error)) throw error;
		}
	}
	async function logout() {
		await adminClient.logout();
		setGate({
			kind: "login",
			notice: "logout"
		});
	}
	return gate.kind === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminWorkspace, {
		...props,
		initial: gate.initial,
		onSessionError,
		onLogout: logout
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLogin, {
		...props,
		phase: gate.kind,
		notice: gate.notice,
		linkedPortal,
		onLogin: (password) => login(() => adminClient.login(password)),
		onPasskeyLogin: (signal) => login(() => signInWithPasskey(signal), signal),
		onRetry: () => {
			setGate({ kind: "checking" });
			setCheck((value) => value + 1);
		}
	});
}
var VIEWS = [
	{
		id: "overview",
		icon: LayoutDashboard,
		ar: "نظرة عامة",
		en: "Overview"
	},
	{
		id: "quotes",
		icon: Inbox,
		ar: "صندوق الطلبات",
		en: "Quote requests"
	},
	{
		id: "announcement",
		icon: Megaphone,
		ar: "إعلانات الموقع",
		en: "Announcements"
	},
	{
		id: "passkeys",
		icon: Fingerprint,
		ar: "مفاتيح المرور",
		en: "Passkeys"
	}
];
function AdminWorkspace({ language, initial, onBack, onToggleLanguage, onSessionError, onLogout }) {
	const ar = language === "ar";
	const [data, setData] = (0, import_react.useState)(initial);
	const [active, setActive] = (0, import_react.useState)("overview");
	const [initialStatus, setInitialStatus] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)(null);
	const [refreshing, setRefreshing] = (0, import_react.useState)(false);
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const heading = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => onSessionError(new AdminApiError("signed_out")), Math.max(0, data.sessionExpiresAt - Date.now()));
		return () => window.clearTimeout(timer);
	}, [data.sessionExpiresAt, onSessionError]);
	(0, import_react.useEffect)(() => {
		heading.current?.focus({ preventScroll: true });
	}, [active, reference]);
	async function refresh() {
		if (refreshing || signingOut) return;
		setRefreshing(true);
		setError(null);
		try {
			setData(await adminClient.dashboard());
		} catch (cause) {
			if (!onSessionError(cause)) setError(cause);
		} finally {
			setRefreshing(false);
		}
	}
	async function signOut() {
		if (signingOut) return;
		setSigningOut(true);
		setError(null);
		try {
			await onLogout();
		} catch (cause) {
			if (!onSessionError(cause)) setError(cause);
		} finally {
			setSigningOut(false);
		}
	}
	function navigate(view, status = "", quote = null) {
		setActive(view);
		setInitialStatus(status);
		setReference(quote);
		setError(null);
		window.scrollTo({
			top: 0,
			behavior: "instant"
		});
	}
	function selectQuote(quote) {
		setReference(quote);
		window.scrollTo({
			top: 0,
			behavior: "instant"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ad-theme ad-workspace",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "ad-sidebar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminBrand, { language }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ad-sidebar-label",
					children: ar ? "مساحة العمل" : "WORKSPACE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "ad-sidebar-nav",
					"aria-label": ar ? "أقسام الإدارة" : "Admin sections",
					children: VIEWS.map(({ icon: Icon, id, ...label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ad-nav-button",
						"aria-current": active === id ? "page" : void 0,
						onClick: () => navigate(id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							size: 19,
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label[language] })]
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-sidebar-bottom",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ad-private",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
								size: 17,
								"aria-hidden": "true"
							}), ar ? "جلسة إدارة محمية" : "Private admin session"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ad-nav-button",
							onClick: onBack,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackIcon, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ar ? "العودة للموقع" : "Back to site" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ad-nav-button ad-logout",
							disabled: signingOut,
							onClick: () => void signOut(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
								size: 17,
								"aria-hidden": "true",
								className: "ad-directional"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signingOut ? ar ? "جارٍ الخروج…" : "Signing out…" : ar ? "تسجيل الخروج" : "Sign out" })]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "ad-workspace-content",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "ad-topbar",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ad-topbar-label",
						children: ar ? "بوابة إدارة إنسكو" : "INSCO ADMIN"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						ref: heading,
						tabIndex: -1,
						children: reference ? ar ? "بيانات الطلب" : "Request details" : VIEWS.find((view) => view.id === active)[language]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ad-topbar-actions",
						children: [active === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
							ar ? "آخر تحديث:" : "Updated:",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								dateTime: data.updatedAt,
								children: shortDate(data.updatedAt, language, { timeStyle: "short" })
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ad-icon-button",
							disabled: refreshing,
							onClick: () => void refresh(),
							"aria-label": ar ? "تحديث الملخص" : "Refresh overview",
							title: ar ? "تحديث الملخص" : "Refresh overview",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, {
								size: 17,
								"aria-hidden": "true",
								className: refreshing ? "ad-spin" : ""
							})
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ad-icon-button",
							onClick: onToggleLanguage,
							"aria-label": ar ? "Switch to English" : "التحويل إلى العربية",
							title: ar ? "English" : "العربية",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, {
								size: 17,
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								lang: ar ? "en" : "ar",
								children: ar ? "EN" : "ع"
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ad-workspace-body",
					"aria-busy": refreshing,
					children: [
						error != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMessage, { children: adminError(error, language) }),
						active === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminOverview, {
							language,
							data,
							onInbox: (status) => navigate("quotes", status),
							onQuote: (quote) => navigate("quotes", "", quote),
							onAnnouncement: () => navigate("announcement")
						}),
						active === "quotes" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminQuotes, {
							language,
							initialStatus,
							reference,
							onOpen: selectQuote,
							onSessionError,
							onUpdate: () => void refresh()
						}),
						active === "announcement" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminAnnouncement, {
							language,
							initial: data.announcement,
							onSessionError,
							onSaved: (announcement) => setData((current) => ({
								...current,
								announcement
							}))
						}),
						active === "passkeys" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPasskeys, {
							language,
							onSessionError
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "ad-workspace-footer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "© 2026 INSCO" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ar ? "مركز عمليات الموقع" : "Site operations workspace" })]
				})
			]
		})]
	});
}
//#endregion
export { AdminPortal as default };
