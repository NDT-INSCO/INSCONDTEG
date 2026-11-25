import { C as _isFirebaseServerApp, I as createMockUserToken, K as isCloudWorkstation, O as registerVersion, P as FirebaseError, Q as pingServer, S as _getProvider, T as getApp, U as getModularInstance, V as getDefaultEmulatorHostnameAndPort, j as Component, w as _registerComponent, x as SDK_VERSION } from "./index.esm-T7XjjJ2p.js";
import { c as isFirebaseConfigured, l as firebase_applet_config_default, r as app } from "./config-DD0nZkwK.js";
import { d as mediaPath, m as validateMediaFile, o as extensionForMime } from "./networkIdentity-D-GB3WyO.js";
//#region node_modules/@firebase/storage/dist/index.esm.js
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @fileoverview Constants used in the Firebase Storage library.
*/
/**
* Domain name for firebase storage.
*/
var DEFAULT_HOST = "firebasestorage.googleapis.com";
/**
* The key in Firebase config json for the storage bucket.
*/
var CONFIG_STORAGE_BUCKET_KEY = "storageBucket";
/**
* 2 minutes
*
* The timeout for all operations except upload.
*/
var DEFAULT_MAX_OPERATION_RETRY_TIME = 12e4;
/**
* 10 minutes
*
* The timeout for upload.
*/
var DEFAULT_MAX_UPLOAD_RETRY_TIME = 6e5;
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* An error returned by the Firebase Storage SDK.
* @public
*/
var StorageError = class StorageError extends FirebaseError {
	/**
	* @param code - A `StorageErrorCode` string to be prefixed with 'storage/' and
	*  added to the end of the message.
	* @param message  - Error message.
	* @param status_ - Corresponding HTTP Status Code
	*/
	constructor(code, message, status_ = 0) {
		super(prependCode(code), `Firebase Storage: ${message} (${prependCode(code)})`);
		this.status_ = status_;
		/**
		* Stores custom error data unique to the `StorageError`.
		*/
		this.customData = { serverResponse: null };
		this._baseMessage = this.message;
		Object.setPrototypeOf(this, StorageError.prototype);
	}
	get status() {
		return this.status_;
	}
	set status(status) {
		this.status_ = status;
	}
	/**
	* Compares a `StorageErrorCode` against this error's code, filtering out the prefix.
	*/
	_codeEquals(code) {
		return prependCode(code) === this.code;
	}
	/**
	* Optional response message that was added by the server.
	*/
	get serverResponse() {
		return this.customData.serverResponse;
	}
	set serverResponse(serverResponse) {
		this.customData.serverResponse = serverResponse;
		if (this.customData.serverResponse) this.message = `${this._baseMessage}\n${this.customData.serverResponse}`;
		else this.message = this._baseMessage;
	}
};
/**
* @public
* Error codes that can be attached to `StorageError` objects.
*/
var StorageErrorCode;
(function(StorageErrorCode) {
	StorageErrorCode["UNKNOWN"] = "unknown";
	StorageErrorCode["OBJECT_NOT_FOUND"] = "object-not-found";
	StorageErrorCode["BUCKET_NOT_FOUND"] = "bucket-not-found";
	StorageErrorCode["PROJECT_NOT_FOUND"] = "project-not-found";
	StorageErrorCode["QUOTA_EXCEEDED"] = "quota-exceeded";
	StorageErrorCode["UNAUTHENTICATED"] = "unauthenticated";
	StorageErrorCode["UNAUTHORIZED"] = "unauthorized";
	StorageErrorCode["UNAUTHORIZED_APP"] = "unauthorized-app";
	StorageErrorCode["RETRY_LIMIT_EXCEEDED"] = "retry-limit-exceeded";
	StorageErrorCode["INVALID_CHECKSUM"] = "invalid-checksum";
	StorageErrorCode["CANCELED"] = "canceled";
	StorageErrorCode["INVALID_EVENT_NAME"] = "invalid-event-name";
	StorageErrorCode["INVALID_URL"] = "invalid-url";
	StorageErrorCode["INVALID_DEFAULT_BUCKET"] = "invalid-default-bucket";
	StorageErrorCode["NO_DEFAULT_BUCKET"] = "no-default-bucket";
	StorageErrorCode["CANNOT_SLICE_BLOB"] = "cannot-slice-blob";
	StorageErrorCode["SERVER_FILE_WRONG_SIZE"] = "server-file-wrong-size";
	StorageErrorCode["NO_DOWNLOAD_URL"] = "no-download-url";
	StorageErrorCode["INVALID_ARGUMENT"] = "invalid-argument";
	StorageErrorCode["INVALID_ARGUMENT_COUNT"] = "invalid-argument-count";
	StorageErrorCode["APP_DELETED"] = "app-deleted";
	StorageErrorCode["INVALID_ROOT_OPERATION"] = "invalid-root-operation";
	StorageErrorCode["INVALID_FORMAT"] = "invalid-format";
	StorageErrorCode["INTERNAL_ERROR"] = "internal-error";
	StorageErrorCode["UNSUPPORTED_ENVIRONMENT"] = "unsupported-environment";
})(StorageErrorCode || (StorageErrorCode = {}));
function prependCode(code) {
	return "storage/" + code;
}
function unknown() {
	return new StorageError(StorageErrorCode.UNKNOWN, "An unknown error occurred, please check the error payload for server response.");
}
function objectNotFound(path) {
	return new StorageError(StorageErrorCode.OBJECT_NOT_FOUND, "Object '" + path + "' does not exist.");
}
function quotaExceeded(bucket) {
	return new StorageError(StorageErrorCode.QUOTA_EXCEEDED, "Quota for bucket '" + bucket + "' exceeded, please view quota on https://firebase.google.com/pricing/.");
}
function unauthenticated() {
	return new StorageError(StorageErrorCode.UNAUTHENTICATED, "User is not authenticated, please authenticate using Firebase Authentication and try again.");
}
function unauthorizedApp() {
	return new StorageError(StorageErrorCode.UNAUTHORIZED_APP, "This app does not have permission to access Firebase Storage on this project.");
}
function unauthorized(path) {
	return new StorageError(StorageErrorCode.UNAUTHORIZED, "User does not have permission to access '" + path + "'.");
}
function retryLimitExceeded() {
	return new StorageError(StorageErrorCode.RETRY_LIMIT_EXCEEDED, "Max retry time for operation exceeded, please try again.");
}
function canceled() {
	return new StorageError(StorageErrorCode.CANCELED, "User canceled the upload/download.");
}
function invalidUrl(url) {
	return new StorageError(StorageErrorCode.INVALID_URL, "Invalid URL '" + url + "'.");
}
function invalidDefaultBucket(bucket) {
	return new StorageError(StorageErrorCode.INVALID_DEFAULT_BUCKET, "Invalid default bucket '" + bucket + "'.");
}
function noDefaultBucket() {
	return new StorageError(StorageErrorCode.NO_DEFAULT_BUCKET, "No default bucket found. Did you set the 'storageBucket' property when initializing the app?");
}
function cannotSliceBlob() {
	return new StorageError(StorageErrorCode.CANNOT_SLICE_BLOB, "Cannot slice blob for upload. Please retry the upload.");
}
function noDownloadURL() {
	return new StorageError(StorageErrorCode.NO_DOWNLOAD_URL, "The given file does not have any download URLs.");
}
function missingPolyFill(polyFill) {
	return new StorageError(StorageErrorCode.UNSUPPORTED_ENVIRONMENT, `${polyFill} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`);
}
/**
* @internal
*/
function invalidArgument(message) {
	return new StorageError(StorageErrorCode.INVALID_ARGUMENT, message);
}
function appDeleted() {
	return new StorageError(StorageErrorCode.APP_DELETED, "The Firebase app was deleted.");
}
/**
* @param name - The name of the operation that was invalid.
*
* @internal
*/
function invalidRootOperation(name) {
	return new StorageError(StorageErrorCode.INVALID_ROOT_OPERATION, "The operation '" + name + "' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').");
}
/**
* @param format - The format that was not valid.
* @param message - A message describing the format violation.
*/
function invalidFormat(format, message) {
	return new StorageError(StorageErrorCode.INVALID_FORMAT, "String does not match format '" + format + "': " + message);
}
/**
* @param message - A message describing the internal error.
*/
function internalError(message) {
	throw new StorageError(StorageErrorCode.INTERNAL_ERROR, "Internal error: " + message);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @fileoverview Functionality related to the parsing/composition of bucket/
* object location.
*/
/**
* Firebase Storage location data.
*
* @internal
*/
var Location = class Location {
	constructor(bucket, path) {
		this.bucket = bucket;
		this.path_ = path;
	}
	get path() {
		return this.path_;
	}
	get isRoot() {
		return this.path.length === 0;
	}
	fullServerUrl() {
		const encode = encodeURIComponent;
		return "/b/" + encode(this.bucket) + "/o/" + encode(this.path);
	}
	bucketOnlyServerUrl() {
		return "/b/" + encodeURIComponent(this.bucket) + "/o";
	}
	static makeFromBucketSpec(bucketString, host) {
		let bucketLocation;
		try {
			bucketLocation = Location.makeFromUrl(bucketString, host);
		} catch (e) {
			return new Location(bucketString, "");
		}
		if (bucketLocation.path === "") return bucketLocation;
		else throw invalidDefaultBucket(bucketString);
	}
	static makeFromUrl(url, host) {
		let location = null;
		const bucketDomain = "([A-Za-z0-9.\\-_]+)";
		function gsModify(loc) {
			if (loc.path.charAt(loc.path.length - 1) === "/") loc.path_ = loc.path_.slice(0, -1);
		}
		const gsRegex = new RegExp("^gs://" + bucketDomain + "(/(.*))?$", "i");
		const gsIndices = {
			bucket: 1,
			path: 3
		};
		function httpModify(loc) {
			loc.path_ = decodeURIComponent(loc.path);
		}
		const version = "v[A-Za-z0-9_]+";
		const firebaseStorageHost = host.replace(/[.]/g, "\\.");
		const firebaseStorageRegExp = new RegExp(`^https?://${firebaseStorageHost}/${version}/b/${bucketDomain}/o(/([^?#]*).*)?\$`, "i");
		const firebaseStorageIndices = {
			bucket: 1,
			path: 3
		};
		const cloudStorageRegExp = new RegExp(`^https?://${host === DEFAULT_HOST ? "(?:storage.googleapis.com|storage.cloud.google.com)" : host}/${bucketDomain}/([^?#]*)`, "i");
		const groups = [
			{
				regex: gsRegex,
				indices: gsIndices,
				postModify: gsModify
			},
			{
				regex: firebaseStorageRegExp,
				indices: firebaseStorageIndices,
				postModify: httpModify
			},
			{
				regex: cloudStorageRegExp,
				indices: {
					bucket: 1,
					path: 2
				},
				postModify: httpModify
			}
		];
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			const captures = group.regex.exec(url);
			if (captures) {
				const bucketValue = captures[group.indices.bucket];
				let pathValue = captures[group.indices.path];
				if (!pathValue) pathValue = "";
				location = new Location(bucketValue, pathValue);
				group.postModify(location);
				break;
			}
		}
		if (location == null) throw invalidUrl(url);
		return location;
	}
};
/**
* A request whose promise always fails.
*/
var FailRequest = class {
	constructor(error) {
		this.promise_ = Promise.reject(error);
	}
	/** @inheritDoc */
	getPromise() {
		return this.promise_;
	}
	/** @inheritDoc */
	cancel(_appDelete = false) {}
};
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Accepts a callback for an action to perform (`doRequest`),
* and then a callback for when the backoff has completed (`backoffCompleteCb`).
* The callback sent to start requires an argument to call (`onRequestComplete`).
* When `start` calls `doRequest`, it passes a callback for when the request has
* completed, `onRequestComplete`. Based on this, the backoff continues, with
* another call to `doRequest` and the above loop continues until the timeout
* is hit, or a successful response occurs.
* @description
* @param doRequest Callback to perform request
* @param backoffCompleteCb Callback to call when backoff has been completed
*/
function start(doRequest, backoffCompleteCb, timeout) {
	let waitSeconds = 1;
	let retryTimeoutId = null;
	let globalTimeoutId = null;
	let hitTimeout = false;
	let cancelState = 0;
	function canceled() {
		return cancelState === 2;
	}
	let triggeredCallback = false;
	function triggerCallback(...args) {
		if (!triggeredCallback) {
			triggeredCallback = true;
			backoffCompleteCb.apply(null, args);
		}
	}
	function callWithDelay(millis) {
		retryTimeoutId = setTimeout(() => {
			retryTimeoutId = null;
			doRequest(responseHandler, canceled());
		}, millis);
	}
	function clearGlobalTimeout() {
		if (globalTimeoutId) clearTimeout(globalTimeoutId);
	}
	function responseHandler(success, ...args) {
		if (triggeredCallback) {
			clearGlobalTimeout();
			return;
		}
		if (success) {
			clearGlobalTimeout();
			triggerCallback.call(null, success, ...args);
			return;
		}
		if (canceled() || hitTimeout) {
			clearGlobalTimeout();
			triggerCallback.call(null, success, ...args);
			return;
		}
		if (waitSeconds < 64) waitSeconds *= 2;
		let waitMillis;
		if (cancelState === 1) {
			cancelState = 2;
			waitMillis = 0;
		} else waitMillis = (waitSeconds + Math.random()) * 1e3;
		callWithDelay(waitMillis);
	}
	let stopped = false;
	function stop(wasTimeout) {
		if (stopped) return;
		stopped = true;
		clearGlobalTimeout();
		if (triggeredCallback) return;
		if (retryTimeoutId !== null) {
			if (!wasTimeout) cancelState = 2;
			clearTimeout(retryTimeoutId);
			callWithDelay(0);
		} else if (!wasTimeout) cancelState = 1;
	}
	callWithDelay(0);
	globalTimeoutId = setTimeout(() => {
		hitTimeout = true;
		stop(true);
	}, timeout);
	return stop;
}
/**
* Stops the retry loop from repeating.
* If the function is currently "in between" retries, it is invoked immediately
* with the second parameter as "true". Otherwise, it will be invoked once more
* after the current invocation finishes iff the current invocation would have
* triggered another retry.
*/
function stop(id) {
	id(false);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
function isJustDef(p) {
	return p !== void 0;
}
function isNonArrayObject(p) {
	return typeof p === "object" && !Array.isArray(p);
}
function isString(p) {
	return typeof p === "string" || p instanceof String;
}
function isNativeBlob(p) {
	return isNativeBlobDefined() && p instanceof Blob;
}
function isNativeBlobDefined() {
	return typeof Blob !== "undefined";
}
function validateNumber(argument, minValue, maxValue, value) {
	if (value < minValue) throw invalidArgument(`Invalid value for '${argument}'. Expected ${minValue} or greater.`);
	if (value > maxValue) throw invalidArgument(`Invalid value for '${argument}'. Expected ${maxValue} or less.`);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
function makeUrl(urlPart, host, protocol) {
	let origin = host;
	if (protocol == null) origin = `https://${host}`;
	return `${protocol}://${origin}/v0${urlPart}`;
}
function makeQueryString(params) {
	const encode = encodeURIComponent;
	let queryPart = "?";
	for (const key in params) if (params.hasOwnProperty(key)) {
		const nextPart = encode(key) + "=" + encode(params[key]);
		queryPart = queryPart + nextPart + "&";
	}
	queryPart = queryPart.slice(0, -1);
	return queryPart;
}
/**
* Error codes for requests made by the XhrIo wrapper.
*/
var ErrorCode;
(function(ErrorCode) {
	ErrorCode[ErrorCode["NO_ERROR"] = 0] = "NO_ERROR";
	ErrorCode[ErrorCode["NETWORK_ERROR"] = 1] = "NETWORK_ERROR";
	ErrorCode[ErrorCode["ABORT"] = 2] = "ABORT";
})(ErrorCode || (ErrorCode = {}));
/**
* @license
* Copyright 2022 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Checks the status code to see if the action should be retried.
*
* @param status Current HTTP status code returned by server.
* @param additionalRetryCodes additional retry codes to check against
*/
function isRetryStatusCode(status, additionalRetryCodes) {
	const isFiveHundredCode = status >= 500 && status < 600;
	const isExtraRetryCode = [408, 429].indexOf(status) !== -1;
	const isAdditionalRetryCode = additionalRetryCodes.indexOf(status) !== -1;
	return isFiveHundredCode || isExtraRetryCode || isAdditionalRetryCode;
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @fileoverview Defines methods used to actually send HTTP requests from
* abstract representations.
*/
/**
* Handles network logic for all Storage Requests, including error reporting and
* retries with backoff.
*
* @param I - the type of the backend's network response.
* @param - O the output type used by the rest of the SDK. The conversion
* happens in the specified `callback_`.
*/
var NetworkRequest = class {
	constructor(url_, method_, headers_, body_, successCodes_, additionalRetryCodes_, callback_, errorCallback_, timeout_, progressCallback_, connectionFactory_, retry = true, isUsingEmulator = false) {
		this.url_ = url_;
		this.method_ = method_;
		this.headers_ = headers_;
		this.body_ = body_;
		this.successCodes_ = successCodes_;
		this.additionalRetryCodes_ = additionalRetryCodes_;
		this.callback_ = callback_;
		this.errorCallback_ = errorCallback_;
		this.timeout_ = timeout_;
		this.progressCallback_ = progressCallback_;
		this.connectionFactory_ = connectionFactory_;
		this.retry = retry;
		this.isUsingEmulator = isUsingEmulator;
		this.pendingConnection_ = null;
		this.backoffId_ = null;
		this.canceled_ = false;
		this.appDelete_ = false;
		this.promise_ = new Promise((resolve, reject) => {
			this.resolve_ = resolve;
			this.reject_ = reject;
			this.start_();
		});
	}
	/**
	* Actually starts the retry loop.
	*/
	start_() {
		const doTheRequest = (backoffCallback, canceled) => {
			if (canceled) {
				backoffCallback(false, new RequestEndStatus(false, null, true));
				return;
			}
			const connection = this.connectionFactory_();
			this.pendingConnection_ = connection;
			const progressListener = (progressEvent) => {
				const loaded = progressEvent.loaded;
				const total = progressEvent.lengthComputable ? progressEvent.total : -1;
				if (this.progressCallback_ !== null) this.progressCallback_(loaded, total);
			};
			if (this.progressCallback_ !== null) connection.addUploadProgressListener(progressListener);
			connection.send(this.url_, this.method_, this.isUsingEmulator, this.body_, this.headers_).then(() => {
				if (this.progressCallback_ !== null) connection.removeUploadProgressListener(progressListener);
				this.pendingConnection_ = null;
				const hitServer = connection.getErrorCode() === ErrorCode.NO_ERROR;
				const status = connection.getStatus();
				if (!hitServer || isRetryStatusCode(status, this.additionalRetryCodes_) && this.retry) {
					backoffCallback(false, new RequestEndStatus(false, null, connection.getErrorCode() === ErrorCode.ABORT));
					return;
				}
				backoffCallback(true, new RequestEndStatus(this.successCodes_.indexOf(status) !== -1, connection));
			});
		};
		/**
		* @param requestWentThrough - True if the request eventually went
		*     through, false if it hit the retry limit or was canceled.
		*/
		const backoffDone = (requestWentThrough, status) => {
			const resolve = this.resolve_;
			const reject = this.reject_;
			const connection = status.connection;
			if (status.wasSuccessCode) try {
				const result = this.callback_(connection, connection.getResponse());
				if (isJustDef(result)) resolve(result);
				else resolve();
			} catch (e) {
				reject(e);
			}
			else if (connection !== null) {
				const err = unknown();
				err.serverResponse = connection.getErrorText();
				if (this.errorCallback_) reject(this.errorCallback_(connection, err));
				else reject(err);
			} else if (status.canceled) reject(this.appDelete_ ? appDeleted() : canceled());
			else reject(retryLimitExceeded());
		};
		if (this.canceled_) backoffDone(false, new RequestEndStatus(false, null, true));
		else this.backoffId_ = start(doTheRequest, backoffDone, this.timeout_);
	}
	/** @inheritDoc */
	getPromise() {
		return this.promise_;
	}
	/** @inheritDoc */
	cancel(appDelete) {
		this.canceled_ = true;
		this.appDelete_ = appDelete || false;
		if (this.backoffId_ !== null) stop(this.backoffId_);
		if (this.pendingConnection_ !== null) this.pendingConnection_.abort();
	}
};
/**
* A collection of information about the result of a network request.
* @param opt_canceled - Defaults to false.
*/
var RequestEndStatus = class {
	constructor(wasSuccessCode, connection, canceled) {
		this.wasSuccessCode = wasSuccessCode;
		this.connection = connection;
		this.canceled = !!canceled;
	}
};
function addAuthHeader_(headers, authToken) {
	if (authToken !== null && authToken.length > 0) headers["Authorization"] = "Firebase " + authToken;
}
function addVersionHeader_(headers, firebaseVersion) {
	headers["X-Firebase-Storage-Version"] = "webjs/" + (firebaseVersion ?? "AppManager");
}
function addGmpidHeader_(headers, appId) {
	if (appId) headers["X-Firebase-GMPID"] = appId;
}
function addAppCheckHeader_(headers, appCheckToken) {
	if (appCheckToken !== null) headers["X-Firebase-AppCheck"] = appCheckToken;
}
function makeRequest(requestInfo, appId, authToken, appCheckToken, requestFactory, firebaseVersion, retry = true, isUsingEmulator = false) {
	const queryPart = makeQueryString(requestInfo.urlParams);
	const url = requestInfo.url + queryPart;
	const headers = Object.assign({}, requestInfo.headers);
	addGmpidHeader_(headers, appId);
	addAuthHeader_(headers, authToken);
	addVersionHeader_(headers, firebaseVersion);
	addAppCheckHeader_(headers, appCheckToken);
	return new NetworkRequest(url, requestInfo.method, headers, requestInfo.body, requestInfo.successCodes, requestInfo.additionalRetryCodes, requestInfo.handler, requestInfo.errorHandler, requestInfo.timeout, requestInfo.progressCallback, requestFactory, retry, isUsingEmulator);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @fileoverview Some methods copied from goog.fs.
* We don't include goog.fs because it pulls in a bunch of Deferred code that
* bloats the size of the released binary.
*/
function getBlobBuilder() {
	if (typeof BlobBuilder !== "undefined") return BlobBuilder;
	else if (typeof WebKitBlobBuilder !== "undefined") return WebKitBlobBuilder;
	else return;
}
/**
* Concatenates one or more values together and converts them to a Blob.
*
* @param args The values that will make up the resulting blob.
* @return The blob.
*/
function getBlob$1(...args) {
	const BlobBuilder = getBlobBuilder();
	if (BlobBuilder !== void 0) {
		const bb = new BlobBuilder();
		for (let i = 0; i < args.length; i++) bb.append(args[i]);
		return bb.getBlob();
	} else if (isNativeBlobDefined()) return new Blob(args);
	else throw new StorageError(StorageErrorCode.UNSUPPORTED_ENVIRONMENT, "This browser doesn't seem to support creating Blobs");
}
/**
* Slices the blob. The returned blob contains data from the start byte
* (inclusive) till the end byte (exclusive). Negative indices cannot be used.
*
* @param blob The blob to be sliced.
* @param start Index of the starting byte.
* @param end Index of the ending byte.
* @return The blob slice or null if not supported.
*/
function sliceBlob(blob, start, end) {
	if (blob.webkitSlice) return blob.webkitSlice(start, end);
	else if (blob.mozSlice) return blob.mozSlice(start, end);
	else if (blob.slice) return blob.slice(start, end);
	return null;
}
/**
* @license
* Copyright 2021 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/** Converts a Base64 encoded string to a binary string. */
function decodeBase64(encoded) {
	if (typeof atob === "undefined") throw missingPolyFill("base-64");
	return atob(encoded);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* An enumeration of the possible string formats for upload.
* @public
*/
var StringFormat = {
	/**
	* Indicates the string should be interpreted "raw", that is, as normal text.
	* The string will be interpreted as UTF-16, then uploaded as a UTF-8 byte
	* sequence.
	* Example: The string 'Hello! \\ud83d\\ude0a' becomes the byte sequence
	* 48 65 6c 6c 6f 21 20 f0 9f 98 8a
	*/
	RAW: "raw",
	/**
	* Indicates the string should be interpreted as base64-encoded data.
	* Padding characters (trailing '='s) are optional.
	* Example: The string 'rWmO++E6t7/rlw==' becomes the byte sequence
	* ad 69 8e fb e1 3a b7 bf eb 97
	*/
	BASE64: "base64",
	/**
	* Indicates the string should be interpreted as base64url-encoded data.
	* Padding characters (trailing '='s) are optional.
	* Example: The string 'rWmO--E6t7_rlw==' becomes the byte sequence
	* ad 69 8e fb e1 3a b7 bf eb 97
	*/
	BASE64URL: "base64url",
	/**
	* Indicates the string is a data URL, such as one obtained from
	* canvas.toDataURL().
	* Example: the string 'data:application/octet-stream;base64,aaaa'
	* becomes the byte sequence
	* 69 a6 9a
	* (the content-type "application/octet-stream" is also applied, but can
	* be overridden in the metadata object).
	*/
	DATA_URL: "data_url"
};
var StringData = class {
	constructor(data, contentType) {
		this.data = data;
		this.contentType = contentType || null;
	}
};
/**
* @internal
*/
function dataFromString(format, stringData) {
	switch (format) {
		case StringFormat.RAW: return new StringData(utf8Bytes_(stringData));
		case StringFormat.BASE64:
		case StringFormat.BASE64URL: return new StringData(base64Bytes_(format, stringData));
		case StringFormat.DATA_URL: return new StringData(dataURLBytes_(stringData), dataURLContentType_(stringData));
	}
	throw unknown();
}
function utf8Bytes_(value) {
	const b = [];
	for (let i = 0; i < value.length; i++) {
		let c = value.charCodeAt(i);
		if (c <= 127) b.push(c);
		else if (c <= 2047) b.push(192 | c >> 6, 128 | c & 63);
		else if ((c & 64512) === 55296) {
			if (!(i < value.length - 1 && (value.charCodeAt(i + 1) & 64512) === 56320)) b.push(239, 191, 189);
			else {
				const hi = c;
				const lo = value.charCodeAt(++i);
				c = 65536 | (hi & 1023) << 10 | lo & 1023;
				b.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
			}
		} else if ((c & 64512) === 56320) b.push(239, 191, 189);
		else b.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
	}
	return new Uint8Array(b);
}
function percentEncodedBytes_(value) {
	let decoded;
	try {
		decoded = decodeURIComponent(value);
	} catch (e) {
		throw invalidFormat(StringFormat.DATA_URL, "Malformed data URL.");
	}
	return utf8Bytes_(decoded);
}
function base64Bytes_(format, value) {
	switch (format) {
		case StringFormat.BASE64: {
			const hasMinus = value.indexOf("-") !== -1;
			const hasUnder = value.indexOf("_") !== -1;
			if (hasMinus || hasUnder) throw invalidFormat(format, "Invalid character '" + (hasMinus ? "-" : "_") + "' found: is it base64url encoded?");
			break;
		}
		case StringFormat.BASE64URL: {
			const hasPlus = value.indexOf("+") !== -1;
			const hasSlash = value.indexOf("/") !== -1;
			if (hasPlus || hasSlash) throw invalidFormat(format, "Invalid character '" + (hasPlus ? "+" : "/") + "' found: is it base64 encoded?");
			value = value.replace(/-/g, "+").replace(/_/g, "/");
			break;
		}
	}
	let bytes;
	try {
		bytes = decodeBase64(value);
	} catch (e) {
		if (e.message.includes("polyfill")) throw e;
		throw invalidFormat(format, "Invalid character found");
	}
	const array = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
	return array;
}
var DataURLParts = class {
	constructor(dataURL) {
		this.base64 = false;
		this.contentType = null;
		const matches = dataURL.match(/^data:([^,]+)?,/);
		if (matches === null) throw invalidFormat(StringFormat.DATA_URL, "Must be formatted 'data:[<mediatype>][;base64],<data>");
		const middle = matches[1] || null;
		if (middle != null) {
			this.base64 = endsWith(middle, ";base64");
			this.contentType = this.base64 ? middle.substring(0, middle.length - 7) : middle;
		}
		this.rest = dataURL.substring(dataURL.indexOf(",") + 1);
	}
};
function dataURLBytes_(dataUrl) {
	const parts = new DataURLParts(dataUrl);
	if (parts.base64) return base64Bytes_(StringFormat.BASE64, parts.rest);
	else return percentEncodedBytes_(parts.rest);
}
function dataURLContentType_(dataUrl) {
	return new DataURLParts(dataUrl).contentType;
}
function endsWith(s, end) {
	if (!(s.length >= end.length)) return false;
	return s.substring(s.length - end.length) === end;
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @file Provides a Blob-like wrapper for various binary types (including the
* native Blob type). This makes it possible to upload types like ArrayBuffers,
* making uploads possible in environments without the native Blob type.
*/
/**
* @param opt_elideCopy - If true, doesn't copy mutable input data
*     (e.g. Uint8Arrays). Pass true only if you know the objects will not be
*     modified after this blob's construction.
*
* @internal
*/
var FbsBlob = class FbsBlob {
	constructor(data, elideCopy) {
		let size = 0;
		let blobType = "";
		if (isNativeBlob(data)) {
			this.data_ = data;
			size = data.size;
			blobType = data.type;
		} else if (data instanceof ArrayBuffer) {
			if (elideCopy) this.data_ = new Uint8Array(data);
			else {
				this.data_ = new Uint8Array(data.byteLength);
				this.data_.set(new Uint8Array(data));
			}
			size = this.data_.length;
		} else if (data instanceof Uint8Array) {
			if (elideCopy) this.data_ = data;
			else {
				this.data_ = new Uint8Array(data.length);
				this.data_.set(data);
			}
			size = data.length;
		}
		this.size_ = size;
		this.type_ = blobType;
	}
	size() {
		return this.size_;
	}
	type() {
		return this.type_;
	}
	slice(startByte, endByte) {
		if (isNativeBlob(this.data_)) {
			const realBlob = this.data_;
			const sliced = sliceBlob(realBlob, startByte, endByte);
			if (sliced === null) return null;
			return new FbsBlob(sliced);
		} else {
			const slice = new Uint8Array(this.data_.buffer, startByte, endByte - startByte);
			return new FbsBlob(slice, true);
		}
	}
	static getBlob(...args) {
		if (isNativeBlobDefined()) {
			const blobby = args.map((val) => {
				if (val instanceof FbsBlob) return val.data_;
				else return val;
			});
			return new FbsBlob(getBlob$1.apply(null, blobby));
		} else {
			const uint8Arrays = args.map((val) => {
				if (isString(val)) return dataFromString(StringFormat.RAW, val).data;
				else return val.data_;
			});
			let finalLength = 0;
			uint8Arrays.forEach((array) => {
				finalLength += array.byteLength;
			});
			const merged = new Uint8Array(finalLength);
			let index = 0;
			uint8Arrays.forEach((array) => {
				for (let i = 0; i < array.length; i++) merged[index++] = array[i];
			});
			return new FbsBlob(merged, true);
		}
	}
	uploadData() {
		return this.data_;
	}
};
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Returns the Object resulting from parsing the given JSON, or null if the
* given string does not represent a JSON object.
*/
function jsonObjectOrNull(s) {
	let obj;
	try {
		obj = JSON.parse(s);
	} catch (e) {
		return null;
	}
	if (isNonArrayObject(obj)) return obj;
	else return null;
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @fileoverview Contains helper methods for manipulating paths.
*/
/**
* @return Null if the path is already at the root.
*/
function parent(path) {
	if (path.length === 0) return null;
	const index = path.lastIndexOf("/");
	if (index === -1) return "";
	return path.slice(0, index);
}
function child(path, childPath) {
	const canonicalChildPath = childPath.split("/").filter((component) => component.length > 0).join("/");
	if (path.length === 0) return canonicalChildPath;
	else return path + "/" + canonicalChildPath;
}
/**
* Returns the last component of a path.
* '/foo/bar' -> 'bar'
* '/foo/bar/baz/' -> 'baz/'
* '/a' -> 'a'
*/
function lastComponent(path) {
	const index = path.lastIndexOf("/", path.length - 2);
	if (index === -1) return path;
	else return path.slice(index + 1);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
function noXform_(metadata, value) {
	return value;
}
var Mapping = class {
	constructor(server, local, writable, xform) {
		this.server = server;
		this.local = local || server;
		this.writable = !!writable;
		this.xform = xform || noXform_;
	}
};
var mappings_ = null;
function xformPath(fullPath) {
	if (!isString(fullPath) || fullPath.length < 2) return fullPath;
	else return lastComponent(fullPath);
}
function getMappings() {
	if (mappings_) return mappings_;
	const mappings = [];
	mappings.push(new Mapping("bucket"));
	mappings.push(new Mapping("generation"));
	mappings.push(new Mapping("metageneration"));
	mappings.push(new Mapping("name", "fullPath", true));
	function mappingsXformPath(_metadata, fullPath) {
		return xformPath(fullPath);
	}
	const nameMapping = new Mapping("name");
	nameMapping.xform = mappingsXformPath;
	mappings.push(nameMapping);
	/**
	* Coerces the second param to a number, if it is defined.
	*/
	function xformSize(_metadata, size) {
		if (size !== void 0) return Number(size);
		else return size;
	}
	const sizeMapping = new Mapping("size");
	sizeMapping.xform = xformSize;
	mappings.push(sizeMapping);
	mappings.push(new Mapping("timeCreated"));
	mappings.push(new Mapping("updated"));
	mappings.push(new Mapping("md5Hash", null, true));
	mappings.push(new Mapping("cacheControl", null, true));
	mappings.push(new Mapping("contentDisposition", null, true));
	mappings.push(new Mapping("contentEncoding", null, true));
	mappings.push(new Mapping("contentLanguage", null, true));
	mappings.push(new Mapping("contentType", null, true));
	mappings.push(new Mapping("metadata", "customMetadata", true));
	mappings_ = mappings;
	return mappings_;
}
function addRef(metadata, service) {
	function generateRef() {
		const bucket = metadata["bucket"];
		const path = metadata["fullPath"];
		const loc = new Location(bucket, path);
		return service._makeStorageReference(loc);
	}
	Object.defineProperty(metadata, "ref", { get: generateRef });
}
function fromResource(service, resource, mappings) {
	const metadata = {};
	metadata["type"] = "file";
	const len = mappings.length;
	for (let i = 0; i < len; i++) {
		const mapping = mappings[i];
		metadata[mapping.local] = mapping.xform(metadata, resource[mapping.server]);
	}
	addRef(metadata, service);
	return metadata;
}
function fromResourceString(service, resourceString, mappings) {
	const obj = jsonObjectOrNull(resourceString);
	if (obj === null) return null;
	return fromResource(service, obj, mappings);
}
function downloadUrlFromResourceString(metadata, resourceString, host, protocol) {
	const obj = jsonObjectOrNull(resourceString);
	if (obj === null) return null;
	if (!isString(obj["downloadTokens"])) return null;
	const tokens = obj["downloadTokens"];
	if (tokens.length === 0) return null;
	const encode = encodeURIComponent;
	return tokens.split(",").map((token) => {
		const bucket = metadata["bucket"];
		const path = metadata["fullPath"];
		return makeUrl("/b/" + encode(bucket) + "/o/" + encode(path), host, protocol) + makeQueryString({
			alt: "media",
			token
		});
	})[0];
}
function toResourceString(metadata, mappings) {
	const resource = {};
	const len = mappings.length;
	for (let i = 0; i < len; i++) {
		const mapping = mappings[i];
		if (mapping.writable) resource[mapping.server] = metadata[mapping.local];
	}
	return JSON.stringify(resource);
}
/**
* @license
* Copyright 2019 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Contains a fully specified request.
*
* @param I - the type of the backend's network response.
* @param O - the output response type used by the rest of the SDK.
*/
var RequestInfo = class {
	constructor(url, method, handler, timeout) {
		this.url = url;
		this.method = method;
		this.handler = handler;
		this.timeout = timeout;
		this.urlParams = {};
		this.headers = {};
		this.body = null;
		this.errorHandler = null;
		/**
		* Called with the current number of bytes uploaded and total size (-1 if not
		* computable) of the request body (i.e. used to report upload progress).
		*/
		this.progressCallback = null;
		this.successCodes = [200];
		this.additionalRetryCodes = [];
	}
};
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Throws the UNKNOWN StorageError if cndn is false.
*/
function handlerCheck(cndn) {
	if (!cndn) throw unknown();
}
function metadataHandler(service, mappings) {
	function handler(xhr, text) {
		const metadata = fromResourceString(service, text, mappings);
		handlerCheck(metadata !== null);
		return metadata;
	}
	return handler;
}
function downloadUrlHandler(service, mappings) {
	function handler(xhr, text) {
		const metadata = fromResourceString(service, text, mappings);
		handlerCheck(metadata !== null);
		return downloadUrlFromResourceString(metadata, text, service.host, service._protocol);
	}
	return handler;
}
function sharedErrorHandler(location) {
	function errorHandler(xhr, err) {
		let newErr;
		if (xhr.getStatus() === 401) {
			if (xhr.getErrorText().includes("Firebase App Check token is invalid")) newErr = unauthorizedApp();
			else newErr = unauthenticated();
		} else if (xhr.getStatus() === 402) newErr = quotaExceeded(location.bucket);
		else if (xhr.getStatus() === 403) newErr = unauthorized(location.path);
		else newErr = err;
		newErr.status = xhr.getStatus();
		newErr.serverResponse = err.serverResponse;
		return newErr;
	}
	return errorHandler;
}
function objectErrorHandler(location) {
	const shared = sharedErrorHandler(location);
	function errorHandler(xhr, err) {
		let newErr = shared(xhr, err);
		if (xhr.getStatus() === 404) newErr = objectNotFound(location.path);
		newErr.serverResponse = err.serverResponse;
		return newErr;
	}
	return errorHandler;
}
function getDownloadUrl(service, location, mappings) {
	const url = makeUrl(location.fullServerUrl(), service.host, service._protocol);
	const method = "GET";
	const timeout = service.maxOperationRetryTime;
	const requestInfo = new RequestInfo(url, method, downloadUrlHandler(service, mappings), timeout);
	requestInfo.errorHandler = objectErrorHandler(location);
	return requestInfo;
}
function determineContentType_(metadata, blob) {
	return metadata && metadata["contentType"] || blob && blob.type() || "application/octet-stream";
}
function metadataForUpload_(location, blob, metadata) {
	const metadataClone = Object.assign({}, metadata);
	metadataClone["fullPath"] = location.path;
	metadataClone["size"] = blob.size();
	if (!metadataClone["contentType"]) metadataClone["contentType"] = determineContentType_(null, blob);
	return metadataClone;
}
/**
* Prepare RequestInfo for uploads as Content-Type: multipart.
*/
function multipartUpload(service, location, mappings, blob, metadata) {
	const urlPart = location.bucketOnlyServerUrl();
	const headers = { "X-Goog-Upload-Protocol": "multipart" };
	function genBoundary() {
		let str = "";
		for (let i = 0; i < 2; i++) str = str + Math.random().toString().slice(2);
		return str;
	}
	const boundary = genBoundary();
	headers["Content-Type"] = "multipart/related; boundary=" + boundary;
	const metadata_ = metadataForUpload_(location, blob, metadata);
	const metadataString = toResourceString(metadata_, mappings);
	const preBlobPart = "--" + boundary + "\r\nContent-Type: application/json; charset=utf-8\r\n\r\n" + metadataString + "\r\n--" + boundary + "\r\nContent-Type: " + metadata_["contentType"] + "\r\n\r\n";
	const postBlobPart = "\r\n--" + boundary + "--";
	const body = FbsBlob.getBlob(preBlobPart, blob, postBlobPart);
	if (body === null) throw cannotSliceBlob();
	const urlParams = { name: metadata_["fullPath"] };
	const url = makeUrl(urlPart, service.host, service._protocol);
	const method = "POST";
	const timeout = service.maxUploadRetryTime;
	const requestInfo = new RequestInfo(url, method, metadataHandler(service, mappings), timeout);
	requestInfo.urlParams = urlParams;
	requestInfo.headers = headers;
	requestInfo.body = body.uploadData();
	requestInfo.errorHandler = sharedErrorHandler(location);
	return requestInfo;
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Network layer for browsers. We use this instead of goog.net.XhrIo because
* goog.net.XhrIo is hyuuuuge and doesn't work in React Native on Android.
*/
var XhrConnection = class {
	constructor() {
		this.sent_ = false;
		this.xhr_ = new XMLHttpRequest();
		this.initXhr();
		this.errorCode_ = ErrorCode.NO_ERROR;
		this.sendPromise_ = new Promise((resolve) => {
			this.xhr_.addEventListener("abort", () => {
				this.errorCode_ = ErrorCode.ABORT;
				resolve();
			});
			this.xhr_.addEventListener("error", () => {
				this.errorCode_ = ErrorCode.NETWORK_ERROR;
				resolve();
			});
			this.xhr_.addEventListener("load", () => {
				resolve();
			});
		});
	}
	send(url, method, isUsingEmulator, body, headers) {
		if (this.sent_) throw internalError("cannot .send() more than once");
		if (isCloudWorkstation(url) && isUsingEmulator) this.xhr_.withCredentials = true;
		this.sent_ = true;
		this.xhr_.open(method, url, true);
		if (headers !== void 0) {
			for (const key in headers) if (headers.hasOwnProperty(key)) this.xhr_.setRequestHeader(key, headers[key].toString());
		}
		if (body !== void 0) this.xhr_.send(body);
		else this.xhr_.send();
		return this.sendPromise_;
	}
	getErrorCode() {
		if (!this.sent_) throw internalError("cannot .getErrorCode() before sending");
		return this.errorCode_;
	}
	getStatus() {
		if (!this.sent_) throw internalError("cannot .getStatus() before sending");
		try {
			return this.xhr_.status;
		} catch (e) {
			return -1;
		}
	}
	getResponse() {
		if (!this.sent_) throw internalError("cannot .getResponse() before sending");
		return this.xhr_.response;
	}
	getErrorText() {
		if (!this.sent_) throw internalError("cannot .getErrorText() before sending");
		return this.xhr_.statusText;
	}
	/** Aborts the request. */
	abort() {
		this.xhr_.abort();
	}
	getResponseHeader(header) {
		return this.xhr_.getResponseHeader(header);
	}
	addUploadProgressListener(listener) {
		if (this.xhr_.upload != null) this.xhr_.upload.addEventListener("progress", listener);
	}
	removeUploadProgressListener(listener) {
		if (this.xhr_.upload != null) this.xhr_.upload.removeEventListener("progress", listener);
	}
};
var XhrTextConnection = class extends XhrConnection {
	initXhr() {
		this.xhr_.responseType = "text";
	}
};
function newTextConnection() {
	return new XhrTextConnection();
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @license
* Copyright 2019 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @fileoverview Defines the Firebase StorageReference class.
*/
/**
* Provides methods to interact with a bucket in the Firebase Storage service.
* @internal
* @param _location - An fbs.location, or the URL at
*     which to base this object, in one of the following forms:
*         gs://<bucket>/<object-path>
*         http[s]://firebasestorage.googleapis.com/
*                     <api-version>/b/<bucket>/o/<object-path>
*     Any query or fragment strings will be ignored in the http[s]
*     format. If no value is passed, the storage object will use a URL based on
*     the project ID of the base firebase.App instance.
*/
var Reference = class Reference {
	constructor(_service, location) {
		this._service = _service;
		if (location instanceof Location) this._location = location;
		else this._location = Location.makeFromUrl(location, _service.host);
	}
	/**
	* Returns the URL for the bucket and path this object references,
	*     in the form gs://<bucket>/<object-path>
	* @override
	*/
	toString() {
		return "gs://" + this._location.bucket + "/" + this._location.path;
	}
	_newRef(service, location) {
		return new Reference(service, location);
	}
	/**
	* A reference to the root of this object's bucket.
	*/
	get root() {
		const location = new Location(this._location.bucket, "");
		return this._newRef(this._service, location);
	}
	/**
	* The name of the bucket containing this reference's object.
	*/
	get bucket() {
		return this._location.bucket;
	}
	/**
	* The full path of this object.
	*/
	get fullPath() {
		return this._location.path;
	}
	/**
	* The short name of this object, which is the last component of the full path.
	* For example, if fullPath is 'full/path/image.png', name is 'image.png'.
	*/
	get name() {
		return lastComponent(this._location.path);
	}
	/**
	* The `StorageService` instance this `StorageReference` is associated with.
	*/
	get storage() {
		return this._service;
	}
	/**
	* A `StorageReference` pointing to the parent location of this `StorageReference`, or null if
	* this reference is the root.
	*/
	get parent() {
		const newPath = parent(this._location.path);
		if (newPath === null) return null;
		const location = new Location(this._location.bucket, newPath);
		return new Reference(this._service, location);
	}
	/**
	* Utility function to throw an error in methods that do not accept a root reference.
	*/
	_throwIfRoot(name) {
		if (this._location.path === "") throw invalidRootOperation(name);
	}
};
/**
* Uploads data to this object's location.
* The upload is not resumable.
*
* @param ref - StorageReference where data should be uploaded.
* @param data - The data to upload.
* @param metadata - Metadata for the newly uploaded data.
* @returns A Promise containing an UploadResult
*/
function uploadBytes$1(ref, data, metadata) {
	ref._throwIfRoot("uploadBytes");
	const requestInfo = multipartUpload(ref.storage, ref._location, getMappings(), new FbsBlob(data, true), metadata);
	return ref.storage.makeRequestWithTokens(requestInfo, newTextConnection).then((finalMetadata) => {
		return {
			metadata: finalMetadata,
			ref
		};
	});
}
/**
* Returns the download URL for the given Reference.
* @public
* @returns A `Promise` that resolves with the download
*     URL for this object.
*/
function getDownloadURL$1(ref) {
	ref._throwIfRoot("getDownloadURL");
	const requestInfo = getDownloadUrl(ref.storage, ref._location, getMappings());
	return ref.storage.makeRequestWithTokens(requestInfo, newTextConnection).then((url) => {
		if (url === null) throw noDownloadURL();
		return url;
	});
}
/**
* Returns reference for object obtained by appending `childPath` to `ref`.
*
* @param ref - StorageReference to get child of.
* @param childPath - Child path from provided ref.
* @returns A reference to the object obtained by
* appending childPath, removing any duplicate, beginning, or trailing
* slashes.
*
*/
function _getChild$1(ref, childPath) {
	const newPath = child(ref._location.path, childPath);
	const location = new Location(ref._location.bucket, newPath);
	return new Reference(ref.storage, location);
}
/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
function isUrl(path) {
	return /^[A-Za-z]+:\/\//.test(path);
}
/**
* Returns a firebaseStorage.Reference for the given url.
*/
function refFromURL(service, url) {
	return new Reference(service, url);
}
/**
* Returns a firebaseStorage.Reference for the given path in the default
* bucket.
*/
function refFromPath(ref, path) {
	if (ref instanceof FirebaseStorageImpl) {
		const service = ref;
		if (service._bucket == null) throw noDefaultBucket();
		const reference = new Reference(service, service._bucket);
		if (path != null) return refFromPath(reference, path);
		else return reference;
	} else if (path !== void 0) return _getChild$1(ref, path);
	else return ref;
}
function ref$1(serviceOrRef, pathOrUrl) {
	if (pathOrUrl && isUrl(pathOrUrl)) {
		if (serviceOrRef instanceof FirebaseStorageImpl) return refFromURL(serviceOrRef, pathOrUrl);
		else throw invalidArgument("To use ref(service, url), the first argument must be a Storage instance.");
	} else return refFromPath(serviceOrRef, pathOrUrl);
}
function extractBucket(host, config) {
	const bucketString = config?.[CONFIG_STORAGE_BUCKET_KEY];
	if (bucketString == null) return null;
	return Location.makeFromBucketSpec(bucketString, host);
}
function connectStorageEmulator$1(storage, host, port, options = {}) {
	storage.host = `${host}:${port}`;
	const useSsl = isCloudWorkstation(host);
	if (useSsl) pingServer(`https://${storage.host}/b`).catch(() => {});
	storage._isUsingEmulator = true;
	storage._protocol = useSsl ? "https" : "http";
	const { mockUserToken } = options;
	if (mockUserToken) storage._overrideAuthToken = typeof mockUserToken === "string" ? mockUserToken : createMockUserToken(mockUserToken, storage.app.options.projectId);
}
/**
* A service that provides Firebase Storage Reference instances.
* @param opt_url - gs:// url to a custom Storage Bucket
*
* @internal
*/
var FirebaseStorageImpl = class {
	constructor(app, _authProvider, _appCheckProvider, _url, _firebaseVersion, _isUsingEmulator = false) {
		this.app = app;
		this._authProvider = _authProvider;
		this._appCheckProvider = _appCheckProvider;
		this._url = _url;
		this._firebaseVersion = _firebaseVersion;
		this._isUsingEmulator = _isUsingEmulator;
		this._bucket = null;
		/**
		* This string can be in the formats:
		* - host
		* - host:port
		*/
		this._host = DEFAULT_HOST;
		this._protocol = "https";
		this._appId = null;
		this._deleted = false;
		this._maxOperationRetryTime = DEFAULT_MAX_OPERATION_RETRY_TIME;
		this._maxUploadRetryTime = DEFAULT_MAX_UPLOAD_RETRY_TIME;
		this._requests = /* @__PURE__ */ new Set();
		if (_url != null) this._bucket = Location.makeFromBucketSpec(_url, this._host);
		else this._bucket = extractBucket(this._host, this.app.options);
	}
	/**
	* The host string for this service, in the form of `host` or
	* `host:port`.
	*/
	get host() {
		return this._host;
	}
	set host(host) {
		this._host = host;
		if (this._url != null) this._bucket = Location.makeFromBucketSpec(this._url, host);
		else this._bucket = extractBucket(host, this.app.options);
	}
	/**
	* The maximum time to retry uploads in milliseconds.
	*/
	get maxUploadRetryTime() {
		return this._maxUploadRetryTime;
	}
	set maxUploadRetryTime(time) {
		validateNumber("time", 0, Number.POSITIVE_INFINITY, time);
		this._maxUploadRetryTime = time;
	}
	/**
	* The maximum time to retry operations other than uploads or downloads in
	* milliseconds.
	*/
	get maxOperationRetryTime() {
		return this._maxOperationRetryTime;
	}
	set maxOperationRetryTime(time) {
		validateNumber("time", 0, Number.POSITIVE_INFINITY, time);
		this._maxOperationRetryTime = time;
	}
	async _getAuthToken() {
		if (this._overrideAuthToken) return this._overrideAuthToken;
		const auth = this._authProvider.getImmediate({ optional: true });
		if (auth) {
			const tokenData = await auth.getToken();
			if (tokenData !== null) return tokenData.accessToken;
		}
		return null;
	}
	async _getAppCheckToken() {
		if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) return this.app.settings.appCheckToken;
		const appCheck = this._appCheckProvider.getImmediate({ optional: true });
		if (appCheck) return (await appCheck.getToken()).token;
		return null;
	}
	/**
	* Stop running requests and prevent more from being created.
	*/
	_delete() {
		if (!this._deleted) {
			this._deleted = true;
			this._requests.forEach((request) => request.cancel());
			this._requests.clear();
		}
		return Promise.resolve();
	}
	/**
	* Returns a new firebaseStorage.Reference object referencing this StorageService
	* at the given Location.
	*/
	_makeStorageReference(loc) {
		return new Reference(this, loc);
	}
	/**
	* @param requestInfo - HTTP RequestInfo object
	* @param authToken - Firebase auth token
	*/
	_makeRequest(requestInfo, requestFactory, authToken, appCheckToken, retry = true) {
		if (!this._deleted) {
			const request = makeRequest(requestInfo, this._appId, authToken, appCheckToken, requestFactory, this._firebaseVersion, retry, this._isUsingEmulator);
			this._requests.add(request);
			request.getPromise().then(() => this._requests.delete(request), () => this._requests.delete(request));
			return request;
		} else return new FailRequest(appDeleted());
	}
	async makeRequestWithTokens(requestInfo, requestFactory) {
		const [authToken, appCheckToken] = await Promise.all([this._getAuthToken(), this._getAppCheckToken()]);
		return this._makeRequest(requestInfo, requestFactory, authToken, appCheckToken).getPromise();
	}
};
var name = "@firebase/storage";
var version = "0.14.6";
/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Type constant for Firebase Storage.
*/
var STORAGE_TYPE = "storage";
/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Uploads data to this object's location.
* The upload is not resumable.
* @public
* @param ref - {@link StorageReference} where data should be uploaded.
* @param data - The data to upload.
* @param metadata - Metadata for the data to upload.
* @returns A Promise containing an UploadResult
*/
function uploadBytes(ref, data, metadata) {
	ref = getModularInstance(ref);
	return uploadBytes$1(ref, data, metadata);
}
/**
* Returns the download URL for the given {@link StorageReference}.
* @public
* @param ref - {@link StorageReference} to get the download URL for.
* @returns A `Promise` that resolves with the download
*     URL for this object.
*/
function getDownloadURL(ref) {
	ref = getModularInstance(ref);
	return getDownloadURL$1(ref);
}
function ref(serviceOrRef, pathOrUrl) {
	serviceOrRef = getModularInstance(serviceOrRef);
	return ref$1(serviceOrRef, pathOrUrl);
}
/**
* Gets a {@link FirebaseStorage} instance for the given Firebase app.
* @public
* @param app - Firebase app to get {@link FirebaseStorage} instance for.
* @param bucketUrl - The gs:// url to your Firebase Storage Bucket.
* If not passed, uses the app's default Storage Bucket.
* @returns A {@link FirebaseStorage} instance.
*/
function getStorage(app = getApp(), bucketUrl) {
	app = getModularInstance(app);
	const storageInstance = _getProvider(app, STORAGE_TYPE).getImmediate({ identifier: bucketUrl });
	const emulator = getDefaultEmulatorHostnameAndPort("storage");
	if (emulator) connectStorageEmulator(storageInstance, ...emulator);
	return storageInstance;
}
/**
* Modify this {@link FirebaseStorage} instance to communicate with the Cloud Storage emulator.
*
* @param storage - The {@link FirebaseStorage} instance
* @param host - The emulator host (ex: localhost)
* @param port - The emulator port (ex: 5001)
* @param options - Emulator options. `options.mockUserToken` is the mock auth
* token to use for unit testing Security Rules.
* @public
*/
function connectStorageEmulator(storage, host, port, options = {}) {
	connectStorageEmulator$1(storage, host, port, options);
}
/**
* @license
* Copyright 2021 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Cloud Storage for Firebase
*
* @packageDocumentation
*/
/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
function factory(container, { instanceIdentifier: url }) {
	return new FirebaseStorageImpl(container.getProvider("app").getImmediate(), container.getProvider("auth-internal"), container.getProvider("app-check-internal"), url, SDK_VERSION);
}
function registerStorage() {
	_registerComponent(new Component(STORAGE_TYPE, factory, "PUBLIC").setMultipleInstances(true));
	registerVersion(name, version, "");
	registerVersion(name, version, "esm2020");
}
registerStorage();
//#endregion
//#region src/client/profileMediaService.ts
/**
* Uploading a member's photo and banner to Firebase Storage.
*
* The bucket path mirrors `storage.rules` exactly:
*
*   community_profiles/{uid}/{photo|banner}-{timestamp}.{jpg|png|webp}
*
* A member can only write under their own uid, only image bytes, and only within the
* size the rule allows. The validation here is the same two checks, so a rejected
* file never leaves the device.
*
* When Storage is not provisioned (or the build has no bucket), the caller gets a
* typed `MediaUploadError` with `code: 'unavailable'` and the interface offers the
* paste-a-link route instead of pretending the upload worked.
*/
var MediaUploadError = class extends Error {
	code;
	ar;
	en;
	constructor(code, ar, en) {
		super(`${code}: ${en}`);
		this.name = "MediaUploadError";
		this.code = code;
		this.ar = ar;
		this.en = en;
	}
};
/** True only when a bucket is configured; the rule may still refuse the write. */
function isMediaUploadAvailable() {
	return Boolean(isFirebaseConfigured && app && firebase_applet_config_default?.storageBucket);
}
async function uploadProfileImage(user, kind, file) {
	if (!isMediaUploadAvailable()) throw new MediaUploadError("unavailable", "تخزين الصور غير مهيّأ في هذه النسخة. استخدم «لصق رابط» أو ولّد بانراً بعد تفعيل التخزين.", "Image storage is not provisioned in this build. Use “paste a link”, or generate a banner once storage is enabled.");
	const rejection = validateMediaFile(file, kind);
	if (rejection) throw new MediaUploadError("invalid", rejection.ar, rejection.en);
	const objectRef = ref(getStorage(app), mediaPath(user.uid, kind, extensionForMime(file.type)));
	try {
		await uploadBytes(objectRef, file, {
			contentType: file.type,
			cacheControl: "public, max-age=86400"
		});
		return await getDownloadURL(objectRef);
	} catch (error) {
		const code = error?.code;
		const normalized = typeof code === "string" ? code : "";
		if (normalized.includes("unauthorized") || normalized.includes("permission")) throw new MediaUploadError("denied", "رفض التخزين هذا الملف. تأكد أنك مسجّل الدخول وأن الصورة بصيغة وحجم مسموحين.", "Storage refused this file. Check that you are signed in and that the image type and size are allowed.");
		throw new MediaUploadError("network", "تعذّر رفع الصورة. تحقّق من اتصالك ثم أعد المحاولة.", "The upload failed. Check your connection and try again.");
	}
}
//#endregion
export { MediaUploadError, isMediaUploadAvailable, uploadProfileImage };
