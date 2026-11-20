import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { $ as Shape, A as MathUtils, B as PlaneGeometry, F as MeshStandardMaterial, G as Quaternion, H as Points, I as Object3D, J as RepeatWrapping, K as Ray, M as MeshBasicMaterial, P as MeshPhysicalMaterial, Q as ShaderMaterial, R as PerspectiveCamera, S as LatheGeometry, U as PointsMaterial, V as PointLight, X as SRGBColorSpace, Z as Scene, _ as FogExp2, a as BufferAttribute, at as TorusGeometry, b as HemisphereLight, c as CatmullRomCurve3, ct as Vector3, f as Controls, g as ExtrudeGeometry, i as BoxGeometry, it as TOUCH, j as Mesh, k as MOUSE, l as Clock, m as DirectionalLight, n as WebGLRenderer, o as BufferGeometry, ot as TubeGeometry, p as CylinderGeometry, q as Raycaster, s as CanvasTexture, st as Vector2, t as PMREMGenerator, tt as Spherical, u as Color, x as InstancedMesh, y as Group, z as Plane } from "./three.module-KJ9Rnf9y.js";
import { t as RoomEnvironment } from "./RoomEnvironment-dUxLHW9h.js";
//#region node_modules/three/examples/jsm/controls/OrbitControls.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* Fires when the camera has been transformed by the controls.
*
* @event OrbitControls#change
* @type {Object}
*/
var _changeEvent = { type: "change" };
/**
* Fires when an interaction was initiated.
*
* @event OrbitControls#start
* @type {Object}
*/
var _startEvent = { type: "start" };
/**
* Fires when an interaction has finished.
*
* @event OrbitControls#end
* @type {Object}
*/
var _endEvent = { type: "end" };
var _ray = new Ray();
var _plane = new Plane();
var _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);
var _v = new Vector3();
var _twoPI = 2 * Math.PI;
var _STATE = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
};
var _EPS = 1e-6;
/**
* Orbit controls allow the camera to orbit around a target.
*
* OrbitControls performs orbiting, dollying (zooming), and panning. Unlike {@link TrackballControls},
* it maintains the "up" direction `object.up` (+Y by default).
*
* - Orbit: Left mouse / touch: one-finger move.
* - Zoom: Middle mouse, or mousewheel / touch: two-finger spread or squish.
* - Pan: Right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move.
*
* ```js
* const controls = new OrbitControls( camera, renderer.domElement );
*
* // controls.update() must be called after any manual changes to the camera's transform
* camera.position.set( 0, 20, 100 );
* controls.update();
*
* function animate() {
*
* 	// required if controls.enableDamping or controls.autoRotate are set to true
* 	controls.update();
*
* 	renderer.render( scene, camera );
*
* }
* ```
*
* @augments Controls
* @three_import import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
*/
var OrbitControls = class extends Controls {
	/**
	* Constructs a new controls instance.
	*
	* @param {Object3D} object - The object that is managed by the controls.
	* @param {?HTMLElement} domElement - The HTML element used for event listeners.
	*/
	constructor(object, domElement = null) {
		super(object, domElement);
		this.state = _STATE.NONE;
		/**
		* The focus point of the controls, the `object` orbits around this.
		* It can be updated manually at any point to change the focus of the controls.
		*
		* @type {Vector3}
		*/
		this.target = new Vector3();
		/**
		* The focus point of the `minTargetRadius` and `maxTargetRadius` limits.
		* It can be updated manually at any point to change the center of interest
		* for the `target`.
		*
		* @type {Vector3}
		*/
		this.cursor = new Vector3();
		/**
		* How far you can dolly in (perspective camera only).
		*
		* @type {number}
		* @default 0
		*/
		this.minDistance = 0;
		/**
		* How far you can dolly out (perspective camera only).
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxDistance = Infinity;
		/**
		* How far you can zoom in (orthographic camera only).
		*
		* @type {number}
		* @default 0
		*/
		this.minZoom = 0;
		/**
		* How far you can zoom out (orthographic camera only).
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxZoom = Infinity;
		/**
		* How close you can get the target to the 3D `cursor`.
		*
		* @type {number}
		* @default 0
		*/
		this.minTargetRadius = 0;
		/**
		* How far you can move the target from the 3D `cursor`.
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxTargetRadius = Infinity;
		/**
		* How far you can orbit vertically, lower limit. Range is `[0, Math.PI]` radians.
		*
		* @type {number}
		* @default 0
		*/
		this.minPolarAngle = 0;
		/**
		* How far you can orbit vertically, upper limit. Range is `[0, Math.PI]` radians.
		*
		* @type {number}
		* @default Math.PI
		*/
		this.maxPolarAngle = Math.PI;
		/**
		* How far you can orbit horizontally, lower limit. If set, the interval `[ min, max ]`
		* must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		*
		* @type {number}
		* @default -Infinity
		*/
		this.minAzimuthAngle = -Infinity;
		/**
		* How far you can orbit horizontally, upper limit. If set, the interval `[ min, max ]`
		* must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		*
		* @type {number}
		* @default -Infinity
		*/
		this.maxAzimuthAngle = Infinity;
		/**
		* Set to `true` to enable damping (inertia), which can be used to give a sense of weight
		* to the controls. Note that if this is enabled, you must call `update()` in your animation
		* loop.
		*
		* @type {boolean}
		* @default false
		*/
		this.enableDamping = false;
		/**
		* The damping inertia used if `enableDamping` is set to `true`.
		*
		* Note that for this to work, you must call `update()` in your animation loop.
		*
		* @type {number}
		* @default 0.05
		*/
		this.dampingFactor = .05;
		/**
		* Enable or disable zooming (dollying) of the camera.
		*
		* @type {boolean}
		* @default true
		*/
		this.enableZoom = true;
		/**
		* Speed of zooming / dollying.
		*
		* @type {number}
		* @default 1
		*/
		this.zoomSpeed = 1;
		/**
		* Enable or disable horizontal and vertical rotation of the camera.
		*
		* Note that it is possible to disable a single axis by setting the min and max of the
		* `minPolarAngle` or `minAzimuthAngle` to the same value, which will cause the vertical
		* or horizontal rotation to be fixed at that value.
		*
		* @type {boolean}
		* @default true
		*/
		this.enableRotate = true;
		/**
		* Speed of rotation.
		*
		* @type {number}
		* @default 1
		*/
		this.rotateSpeed = 1;
		/**
		* How fast to rotate the camera when the keyboard is used.
		*
		* @type {number}
		* @default 1
		*/
		this.keyRotateSpeed = 1;
		/**
		* Enable or disable camera panning.
		*
		* @type {boolean}
		* @default true
		*/
		this.enablePan = true;
		/**
		* Speed of panning.
		*
		* @type {number}
		* @default 1
		*/
		this.panSpeed = 1;
		/**
		* Defines how the camera's position is translated when panning. If `true`, the camera pans
		* in screen space. Otherwise, the camera pans in the plane orthogonal to the camera's up
		* direction.
		*
		* @type {boolean}
		* @default true
		*/
		this.screenSpacePanning = true;
		/**
		* How fast to pan the camera when the keyboard is used in
		* pixels per keypress.
		*
		* @type {number}
		* @default 7
		*/
		this.keyPanSpeed = 7;
		/**
		* Setting this property to `true` allows to zoom to the cursor's position.
		*
		* @type {boolean}
		* @default false
		*/
		this.zoomToCursor = false;
		/**
		* Set to true to automatically rotate around the target
		*
		* Note that if this is enabled, you must call `update()` in your animation loop.
		* If you want the auto-rotate speed to be independent of the frame rate (the refresh
		* rate of the display), you must pass the time `deltaTime`, in seconds, to `update()`.
		*
		* @type {boolean}
		* @default false
		*/
		this.autoRotate = false;
		/**
		* How fast to rotate around the target if `autoRotate` is `true`. The default  equates to 30 seconds
		* per orbit at 60fps.
		*
		* Note that if `autoRotate` is enabled, you must call `update()` in your animation loop.
		*
		* @type {number}
		* @default 2
		*/
		this.autoRotateSpeed = 2;
		/**
		* This object contains references to the keycodes for controlling camera panning.
		*
		* ```js
		* controls.keys = {
		* 	LEFT: 'ArrowLeft', //left arrow
		* 	UP: 'ArrowUp', // up arrow
		* 	RIGHT: 'ArrowRight', // right arrow
		* 	BOTTOM: 'ArrowDown' // down arrow
		* }
		* ```
		* @type {Object}
		*/
		this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		};
		/**
		* This object contains references to the mouse actions used by the controls.
		*
		* ```js
		* controls.mouseButtons = {
		* 	LEFT: THREE.MOUSE.ROTATE,
		* 	MIDDLE: THREE.MOUSE.DOLLY,
		* 	RIGHT: THREE.MOUSE.PAN
		* }
		* ```
		* @type {Object}
		*/
		this.mouseButtons = {
			LEFT: MOUSE.ROTATE,
			MIDDLE: MOUSE.DOLLY,
			RIGHT: MOUSE.PAN
		};
		/**
		* This object contains references to the touch actions used by the controls.
		*
		* ```js
		* controls.mouseButtons = {
		* 	ONE: THREE.TOUCH.ROTATE,
		* 	TWO: THREE.TOUCH.DOLLY_PAN
		* }
		* ```
		* @type {Object}
		*/
		this.touches = {
			ONE: TOUCH.ROTATE,
			TWO: TOUCH.DOLLY_PAN
		};
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {Vector3}
		*/
		this.target0 = this.target.clone();
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {Vector3}
		*/
		this.position0 = this.object.position.clone();
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {number}
		*/
		this.zoom0 = this.object.zoom;
		this._cursorStyle = "auto";
		this._domElementKeyEvents = null;
		this._lastPosition = new Vector3();
		this._lastQuaternion = new Quaternion();
		this._lastTargetPosition = new Vector3();
		this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
		this._quatInverse = this._quat.clone().invert();
		this._spherical = new Spherical();
		this._sphericalDelta = new Spherical();
		this._scale = 1;
		this._panOffset = new Vector3();
		this._rotateStart = new Vector2();
		this._rotateEnd = new Vector2();
		this._rotateDelta = new Vector2();
		this._panStart = new Vector2();
		this._panEnd = new Vector2();
		this._panDelta = new Vector2();
		this._dollyStart = new Vector2();
		this._dollyEnd = new Vector2();
		this._dollyDelta = new Vector2();
		this._dollyDirection = new Vector3();
		this._mouse = new Vector2();
		this._performCursorZoom = false;
		this._pointers = [];
		this._pointerPositions = {};
		this._controlActive = false;
		this._onPointerMove = onPointerMove.bind(this);
		this._onPointerDown = onPointerDown.bind(this);
		this._onPointerUp = onPointerUp.bind(this);
		this._onContextMenu = onContextMenu.bind(this);
		this._onMouseWheel = onMouseWheel.bind(this);
		this._onKeyDown = onKeyDown.bind(this);
		this._onTouchStart = onTouchStart.bind(this);
		this._onTouchMove = onTouchMove.bind(this);
		this._onMouseDown = onMouseDown.bind(this);
		this._onMouseMove = onMouseMove.bind(this);
		this._interceptControlDown = interceptControlDown.bind(this);
		this._interceptControlUp = interceptControlUp.bind(this);
		if (this.domElement !== null) this.connect(this.domElement);
		this.update();
	}
	/**
	* Defines the visual representation of the cursor.
	*
	* @type {('auto'|'grab')}
	* @default 'auto'
	*/
	set cursorStyle(type) {
		this._cursorStyle = type;
		if (type === "grab") this.domElement.style.cursor = "grab";
		else this.domElement.style.cursor = "auto";
	}
	get cursorStyle() {
		return this._cursorStyle;
	}
	connect(element) {
		super.connect(element);
		this.domElement.addEventListener("pointerdown", this._onPointerDown);
		this.domElement.addEventListener("pointercancel", this._onPointerUp);
		this.domElement.addEventListener("contextmenu", this._onContextMenu);
		this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: false });
		this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, {
			passive: true,
			capture: true
		});
		this.domElement.style.touchAction = "none";
	}
	disconnect() {
		this.state = _STATE.NONE;
		this.domElement.removeEventListener("pointerdown", this._onPointerDown);
		this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove);
		this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp);
		this.domElement.removeEventListener("pointercancel", this._onPointerUp);
		this.domElement.removeEventListener("wheel", this._onMouseWheel);
		this.domElement.removeEventListener("contextmenu", this._onContextMenu);
		this.stopListenToKeyEvents();
		const document = this.domElement.getRootNode();
		document.removeEventListener("keydown", this._interceptControlDown, { capture: true });
		document.removeEventListener("keyup", this._interceptControlUp, { capture: true });
		this._controlActive = false;
		this._pointers.length = 0;
		this._pointerPositions = {};
		this.domElement.style.touchAction = "";
		this.domElement.style.cursor = "auto";
	}
	dispose() {
		this.disconnect();
	}
	/**
	* Get the current vertical rotation, in radians.
	*
	* @return {number} The current vertical rotation, in radians.
	*/
	getPolarAngle() {
		return this._spherical.phi;
	}
	/**
	* Get the current horizontal rotation, in radians.
	*
	* @return {number} The current horizontal rotation, in radians.
	*/
	getAzimuthalAngle() {
		return this._spherical.theta;
	}
	/**
	* Returns the distance from the camera to the target.
	*
	* @return {number} The distance from the camera to the target.
	*/
	getDistance() {
		return this.object.position.distanceTo(this.target);
	}
	/**
	* Adds key event listeners to the given DOM element.
	* `window` is a recommended argument for using this method.
	*
	* @param {HTMLElement} domElement - The DOM element
	*/
	listenToKeyEvents(domElement) {
		domElement.addEventListener("keydown", this._onKeyDown);
		this._domElementKeyEvents = domElement;
	}
	/**
	* Removes the key event listener previously defined with `listenToKeyEvents()`.
	*/
	stopListenToKeyEvents() {
		if (this._domElementKeyEvents !== null) {
			this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown);
			this._domElementKeyEvents = null;
		}
	}
	/**
	* Save the current state of the controls. This can later be recovered with `reset()`.
	*/
	saveState() {
		this.target0.copy(this.target);
		this.position0.copy(this.object.position);
		this.zoom0 = this.object.zoom;
	}
	/**
	* Reset the controls to their state from either the last time the `saveState()`
	* was called, or the initial state.
	*/
	reset() {
		this.target.copy(this.target0);
		this.object.position.copy(this.position0);
		this.object.zoom = this.zoom0;
		this.object.updateProjectionMatrix();
		this.dispatchEvent(_changeEvent);
		this.update();
		this.state = _STATE.NONE;
	}
	/**
	* Programmatically pan the camera.
	*
	* @param {number} deltaX - The horizontal pan amount in pixels.
	* @param {number} deltaY - The vertical pan amount in pixels.
	*/
	pan(deltaX, deltaY) {
		this._pan(deltaX, deltaY);
		this.update();
	}
	/**
	* Programmatically dolly in (zoom in for perspective camera).
	*
	* @param {number} dollyScale - The dolly scale factor.
	*/
	dollyIn(dollyScale) {
		this._dollyIn(dollyScale);
		this.update();
	}
	/**
	* Programmatically dolly out (zoom out for perspective camera).
	*
	* @param {number} dollyScale - The dolly scale factor.
	*/
	dollyOut(dollyScale) {
		this._dollyOut(dollyScale);
		this.update();
	}
	/**
	* Programmatically rotate the camera left (around the vertical axis).
	*
	* @param {number} angle - The rotation angle in radians.
	*/
	rotateLeft(angle) {
		this._rotateLeft(angle);
		this.update();
	}
	/**
	* Programmatically rotate the camera up (around the horizontal axis).
	*
	* @param {number} angle - The rotation angle in radians.
	*/
	rotateUp(angle) {
		this._rotateUp(angle);
		this.update();
	}
	update(deltaTime = null) {
		const position = this.object.position;
		_v.copy(position).sub(this.target);
		_v.applyQuaternion(this._quat);
		this._spherical.setFromVector3(_v);
		if (this.autoRotate && this.state === _STATE.NONE) this._rotateLeft(this._getAutoRotationAngle(deltaTime));
		if (this.enableDamping) {
			this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
			this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
		} else {
			this._spherical.theta += this._sphericalDelta.theta;
			this._spherical.phi += this._sphericalDelta.phi;
		}
		let min = this.minAzimuthAngle;
		let max = this.maxAzimuthAngle;
		if (isFinite(min) && isFinite(max)) {
			if (min < -Math.PI) min += _twoPI;
			else if (min > Math.PI) min -= _twoPI;
			if (max < -Math.PI) max += _twoPI;
			else if (max > Math.PI) max -= _twoPI;
			if (min <= max) this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
			else this._spherical.theta = this._spherical.theta > (min + max) / 2 ? Math.max(min, this._spherical.theta) : Math.min(max, this._spherical.theta);
		}
		this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
		this._spherical.makeSafe();
		if (this.enableDamping === true) this.target.addScaledVector(this._panOffset, this.dampingFactor);
		else this.target.add(this._panOffset);
		this.target.sub(this.cursor);
		this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
		this.target.add(this.cursor);
		let zoomChanged = false;
		if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera) this._spherical.radius = this._clampDistance(this._spherical.radius);
		else {
			const prevRadius = this._spherical.radius;
			this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
			zoomChanged = prevRadius != this._spherical.radius;
		}
		_v.setFromSpherical(this._spherical);
		_v.applyQuaternion(this._quatInverse);
		position.copy(this.target).add(_v);
		this.object.lookAt(this.target);
		if (this.enableDamping === true) {
			this._sphericalDelta.theta *= 1 - this.dampingFactor;
			this._sphericalDelta.phi *= 1 - this.dampingFactor;
			this._panOffset.multiplyScalar(1 - this.dampingFactor);
		} else {
			this._sphericalDelta.set(0, 0, 0);
			this._panOffset.set(0, 0, 0);
		}
		if (this.zoomToCursor && this._performCursorZoom) {
			let newRadius = null;
			if (this.object.isPerspectiveCamera) {
				const prevRadius = _v.length();
				newRadius = this._clampDistance(prevRadius * this._scale);
				const radiusDelta = prevRadius - newRadius;
				this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
				this.object.updateMatrixWorld();
				zoomChanged = !!radiusDelta;
			} else if (this.object.isOrthographicCamera) {
				const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseBefore.unproject(this.object);
				const prevZoom = this.object.zoom;
				this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
				this.object.updateProjectionMatrix();
				zoomChanged = prevZoom !== this.object.zoom;
				const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseAfter.unproject(this.object);
				this.object.position.sub(mouseAfter).add(mouseBefore);
				this.object.updateMatrixWorld();
				newRadius = _v.length();
			} else {
				console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.");
				this.zoomToCursor = false;
			}
			if (newRadius !== null) {
				if (this.screenSpacePanning) this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(newRadius).add(this.object.position);
				else {
					_ray.origin.copy(this.object.position);
					_ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);
					if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) this.object.lookAt(this.target);
					else {
						_plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
						_ray.intersectPlane(_plane, this.target);
					}
				}
			}
		} else if (this.object.isOrthographicCamera) {
			const prevZoom = this.object.zoom;
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
			if (prevZoom !== this.object.zoom) {
				this.object.updateProjectionMatrix();
				zoomChanged = true;
			}
		}
		this._scale = 1;
		this._performCursorZoom = false;
		if (zoomChanged || this._lastPosition.distanceToSquared(this.object.position) > _EPS || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS || this._lastTargetPosition.distanceToSquared(this.target) > _EPS) {
			this.dispatchEvent(_changeEvent);
			this._lastPosition.copy(this.object.position);
			this._lastQuaternion.copy(this.object.quaternion);
			this._lastTargetPosition.copy(this.target);
			return true;
		}
		return false;
	}
	_getAutoRotationAngle(deltaTime) {
		if (deltaTime !== null) return _twoPI / 60 * this.autoRotateSpeed * deltaTime;
		else return _twoPI / 60 / 60 * this.autoRotateSpeed;
	}
	_getZoomScale(delta) {
		const normalizedDelta = Math.abs(delta * .01);
		return Math.pow(.95, this.zoomSpeed * normalizedDelta);
	}
	_rotateLeft(angle) {
		this._sphericalDelta.theta -= angle;
	}
	_rotateUp(angle) {
		this._sphericalDelta.phi -= angle;
	}
	_panLeft(distance, objectMatrix) {
		_v.setFromMatrixColumn(objectMatrix, 0);
		_v.multiplyScalar(-distance);
		this._panOffset.add(_v);
	}
	_panUp(distance, objectMatrix) {
		if (this.screenSpacePanning === true) _v.setFromMatrixColumn(objectMatrix, 1);
		else {
			_v.setFromMatrixColumn(objectMatrix, 0);
			_v.crossVectors(this.object.up, _v);
		}
		_v.multiplyScalar(distance);
		this._panOffset.add(_v);
	}
	_pan(deltaX, deltaY) {
		const element = this.domElement;
		if (this.object.isPerspectiveCamera) {
			const position = this.object.position;
			_v.copy(position).sub(this.target);
			let targetDistance = _v.length();
			targetDistance *= Math.tan(this.object.fov / 2 * Math.PI / 180);
			this._panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
			this._panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
		} else if (this.object.isOrthographicCamera) {
			this._panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
			this._panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
		} else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
			this.enablePan = false;
		}
	}
	_dollyOut(dollyScale) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) this._scale /= dollyScale;
		else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
			this.enableZoom = false;
		}
	}
	_dollyIn(dollyScale) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) this._scale *= dollyScale;
		else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
			this.enableZoom = false;
		}
	}
	_updateZoomParameters(x, y) {
		if (!this.zoomToCursor) return;
		this._performCursorZoom = true;
		const rect = this.domElement.getBoundingClientRect();
		const dx = x - rect.left;
		const dy = y - rect.top;
		const w = rect.width;
		const h = rect.height;
		this._mouse.x = dx / w * 2 - 1;
		this._mouse.y = -(dy / h) * 2 + 1;
		this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
	}
	_clampDistance(dist) {
		return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
	}
	_handleMouseDownRotate(event) {
		this._rotateStart.set(event.clientX, event.clientY);
	}
	_handleMouseDownDolly(event) {
		this._updateZoomParameters(event.clientX, event.clientX);
		this._dollyStart.set(event.clientX, event.clientY);
	}
	_handleMouseDownPan(event) {
		this._panStart.set(event.clientX, event.clientY);
	}
	_handleMouseMoveRotate(event) {
		this._rotateEnd.set(event.clientX, event.clientY);
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
		this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
		this._rotateStart.copy(this._rotateEnd);
		this.update();
	}
	_handleMouseMoveDolly(event) {
		this._dollyEnd.set(event.clientX, event.clientY);
		this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
		if (this._dollyDelta.y > 0) this._dollyOut(this._getZoomScale(this._dollyDelta.y));
		else if (this._dollyDelta.y < 0) this._dollyIn(this._getZoomScale(this._dollyDelta.y));
		this._dollyStart.copy(this._dollyEnd);
		this.update();
	}
	_handleMouseMovePan(event) {
		this._panEnd.set(event.clientX, event.clientY);
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
		this._pan(this._panDelta.x, this._panDelta.y);
		this._panStart.copy(this._panEnd);
		this.update();
	}
	_handleMouseWheel(event) {
		this._updateZoomParameters(event.clientX, event.clientY);
		if (event.deltaY < 0) this._dollyIn(this._getZoomScale(event.deltaY));
		else if (event.deltaY > 0) this._dollyOut(this._getZoomScale(event.deltaY));
		this.update();
	}
	_handleKeyDown(event) {
		let needsUpdate = false;
		switch (event.code) {
			case this.keys.UP:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateUp(_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(0, this.keyPanSpeed);
				needsUpdate = true;
				break;
			case this.keys.BOTTOM:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateUp(-_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(0, -this.keyPanSpeed);
				needsUpdate = true;
				break;
			case this.keys.LEFT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateLeft(_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(this.keyPanSpeed, 0);
				needsUpdate = true;
				break;
			case this.keys.RIGHT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateLeft(-_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(-this.keyPanSpeed, 0);
				needsUpdate = true;
		}
		if (needsUpdate) {
			event.preventDefault();
			this.update();
		}
	}
	_handleTouchStartRotate(event) {
		if (this._pointers.length === 1) this._rotateStart.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._rotateStart.set(x, y);
		}
	}
	_handleTouchStartPan(event) {
		if (this._pointers.length === 1) this._panStart.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._panStart.set(x, y);
		}
	}
	_handleTouchStartDolly(event) {
		const position = this._getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this._dollyStart.set(0, distance);
	}
	_handleTouchStartDollyPan(event) {
		if (this.enableZoom) this._handleTouchStartDolly(event);
		if (this.enablePan) this._handleTouchStartPan(event);
	}
	_handleTouchStartDollyRotate(event) {
		if (this.enableZoom) this._handleTouchStartDolly(event);
		if (this.enableRotate) this._handleTouchStartRotate(event);
	}
	_handleTouchMoveRotate(event) {
		if (this._pointers.length == 1) this._rotateEnd.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._rotateEnd.set(x, y);
		}
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
		this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
		this._rotateStart.copy(this._rotateEnd);
	}
	_handleTouchMovePan(event) {
		if (this._pointers.length === 1) this._panEnd.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._panEnd.set(x, y);
		}
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
		this._pan(this._panDelta.x, this._panDelta.y);
		this._panStart.copy(this._panEnd);
	}
	_handleTouchMoveDolly(event) {
		const position = this._getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this._dollyEnd.set(0, distance);
		this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed));
		this._dollyOut(this._dollyDelta.y);
		this._dollyStart.copy(this._dollyEnd);
		const centerX = (event.pageX + position.x) * .5;
		const centerY = (event.pageY + position.y) * .5;
		this._updateZoomParameters(centerX, centerY);
	}
	_handleTouchMoveDollyPan(event) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);
		if (this.enablePan) this._handleTouchMovePan(event);
	}
	_handleTouchMoveDollyRotate(event) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);
		if (this.enableRotate) this._handleTouchMoveRotate(event);
	}
	_addPointer(event) {
		this._pointers.push(event.pointerId);
	}
	_removePointer(event) {
		delete this._pointerPositions[event.pointerId];
		for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) {
			this._pointers.splice(i, 1);
			return;
		}
	}
	_isTrackingPointer(event) {
		for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) return true;
		return false;
	}
	_trackPointer(event) {
		let position = this._pointerPositions[event.pointerId];
		if (position === void 0) {
			position = new Vector2();
			this._pointerPositions[event.pointerId] = position;
		}
		position.set(event.pageX, event.pageY);
	}
	_getSecondPointerPosition(event) {
		const pointerId = event.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
		return this._pointerPositions[pointerId];
	}
	_customWheelEvent(event) {
		const mode = event.deltaMode;
		const newEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			deltaY: event.deltaY
		};
		switch (mode) {
			case 1:
				newEvent.deltaY *= 16;
				break;
			case 2: newEvent.deltaY *= 100;
		}
		if (event.ctrlKey && !this._controlActive) newEvent.deltaY *= 10;
		return newEvent;
	}
};
function onPointerDown(event) {
	if (this.enabled === false) return;
	if (this._pointers.length === 0) {
		this.domElement.setPointerCapture(event.pointerId);
		this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove);
		this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp);
	}
	if (this._isTrackingPointer(event)) return;
	this._addPointer(event);
	if (event.pointerType === "touch") this._onTouchStart(event);
	else this._onMouseDown(event);
	if (this._cursorStyle === "grab") this.domElement.style.cursor = "grabbing";
}
function onPointerMove(event) {
	if (this.enabled === false) return;
	if (event.pointerType === "touch") this._onTouchMove(event);
	else this._onMouseMove(event);
}
function onPointerUp(event) {
	this._removePointer(event);
	switch (this._pointers.length) {
		case 0:
			this.domElement.releasePointerCapture(event.pointerId);
			this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove);
			this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp);
			this.dispatchEvent(_endEvent);
			this.state = _STATE.NONE;
			if (this._cursorStyle === "grab") this.domElement.style.cursor = "grab";
			break;
		case 1:
			const pointerId = this._pointers[0];
			const position = this._pointerPositions[pointerId];
			this._onTouchStart({
				pointerId,
				pageX: position.x,
				pageY: position.y
			});
	}
}
function onMouseDown(event) {
	let mouseAction;
	switch (event.button) {
		case 0:
			mouseAction = this.mouseButtons.LEFT;
			break;
		case 1:
			mouseAction = this.mouseButtons.MIDDLE;
			break;
		case 2:
			mouseAction = this.mouseButtons.RIGHT;
			break;
		default: mouseAction = -1;
	}
	switch (mouseAction) {
		case MOUSE.DOLLY:
			if (this.enableZoom === false) return;
			this._handleMouseDownDolly(event);
			this.state = _STATE.DOLLY;
			break;
		case MOUSE.ROTATE:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enablePan === false) return;
				this._handleMouseDownPan(event);
				this.state = _STATE.PAN;
			} else {
				if (this.enableRotate === false) return;
				this._handleMouseDownRotate(event);
				this.state = _STATE.ROTATE;
			}
			break;
		case MOUSE.PAN:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enableRotate === false) return;
				this._handleMouseDownRotate(event);
				this.state = _STATE.ROTATE;
			} else {
				if (this.enablePan === false) return;
				this._handleMouseDownPan(event);
				this.state = _STATE.PAN;
			}
			break;
		default: this.state = _STATE.NONE;
	}
	if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent);
}
function onMouseMove(event) {
	switch (this.state) {
		case _STATE.ROTATE:
			if (this.enableRotate === false) return;
			this._handleMouseMoveRotate(event);
			break;
		case _STATE.DOLLY:
			if (this.enableZoom === false) return;
			this._handleMouseMoveDolly(event);
			break;
		case _STATE.PAN:
			if (this.enablePan === false) return;
			this._handleMouseMovePan(event);
	}
}
function onMouseWheel(event) {
	if (this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE) return;
	event.preventDefault();
	this.dispatchEvent(_startEvent);
	this._handleMouseWheel(this._customWheelEvent(event));
	this.dispatchEvent(_endEvent);
}
function onKeyDown(event) {
	if (this.enabled === false) return;
	this._handleKeyDown(event);
}
function onTouchStart(event) {
	this._trackPointer(event);
	switch (this._pointers.length) {
		case 1:
			switch (this.touches.ONE) {
				case TOUCH.ROTATE:
					if (this.enableRotate === false) return;
					this._handleTouchStartRotate(event);
					this.state = _STATE.TOUCH_ROTATE;
					break;
				case TOUCH.PAN:
					if (this.enablePan === false) return;
					this._handleTouchStartPan(event);
					this.state = _STATE.TOUCH_PAN;
					break;
				default: this.state = _STATE.NONE;
			}
			break;
		case 2:
			switch (this.touches.TWO) {
				case TOUCH.DOLLY_PAN:
					if (this.enableZoom === false && this.enablePan === false) return;
					this._handleTouchStartDollyPan(event);
					this.state = _STATE.TOUCH_DOLLY_PAN;
					break;
				case TOUCH.DOLLY_ROTATE:
					if (this.enableZoom === false && this.enableRotate === false) return;
					this._handleTouchStartDollyRotate(event);
					this.state = _STATE.TOUCH_DOLLY_ROTATE;
					break;
				default: this.state = _STATE.NONE;
			}
			break;
		default: this.state = _STATE.NONE;
	}
	if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent);
}
function onTouchMove(event) {
	this._trackPointer(event);
	switch (this.state) {
		case _STATE.TOUCH_ROTATE:
			if (this.enableRotate === false) return;
			this._handleTouchMoveRotate(event);
			this.update();
			break;
		case _STATE.TOUCH_PAN:
			if (this.enablePan === false) return;
			this._handleTouchMovePan(event);
			this.update();
			break;
		case _STATE.TOUCH_DOLLY_PAN:
			if (this.enableZoom === false && this.enablePan === false) return;
			this._handleTouchMoveDollyPan(event);
			this.update();
			break;
		case _STATE.TOUCH_DOLLY_ROTATE:
			if (this.enableZoom === false && this.enableRotate === false) return;
			this._handleTouchMoveDollyRotate(event);
			this.update();
			break;
		default: this.state = _STATE.NONE;
	}
}
function onContextMenu(event) {
	if (this.enabled === false) return;
	event.preventDefault();
}
function interceptControlDown(event) {
	if (event.key === "Control") {
		this._controlActive = true;
		this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true
		});
	}
}
function interceptControlUp(event) {
	if (event.key === "Control") {
		this._controlActive = false;
		this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true
		});
	}
}
//#endregion
//#region src/components/company/InscoHero3dBanner.tsx
var import_jsx_runtime = require_jsx_runtime();
var _camGoalPos = new Vector3();
var _camGoalTarget = new Vector3();
var _pointerVec = new Vector2();
var _dummy = new Object3D();
var PART_SPECS = {
	weld_seam: {
		id: "weld_seam",
		titleAr: "لحام دائري 30 بوصة — ASTM A106 Gr. B",
		titleEn: "30\" Circumferential Girth Weld — ASTM A106 Gr. B",
		specAr: "سماكة جدار 28.6 مم · فحص جذر اللحام طبقاً لـ ASME Sec. V",
		specEn: "28.6 mm Wall · Root Fusion Inspection per ASME Sec. V"
	},
	orbital_scanner: {
		id: "orbital_scanner",
		titleAr: "عربة المسح المداري التلقائي (PAUT / Gamma)",
		titleEn: "Automated Orbital Scanner Crawler (PAUT / Gamma)",
		specAr: "64 عنصر مصفوفة طورية 5.0 MHz · ترميز مسار C-Scan حي",
		specEn: "64-Element 5.0 MHz Phased Array · Live Encoded C-Scan"
	},
	ansi_flange: {
		id: "ansi_flange",
		titleAr: "فلانشة ضغط عالي Class 600 RF · 16 مسمار تثبيت",
		titleEn: "Forged Class 600 RF Weld-Neck Flange · 16 Stud Bolts",
		specAr: "معالجة حرارية PWHT 760°C · مطابقة لخطوط البخار والغاز",
		specEn: "PWHT 760°C Qualified · High-Pressure Steam & Gas Service"
	}
};
function detectSoftwareWebGL() {
	try {
		const testCanvas = document.createElement("canvas");
		const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
		if (!gl) return true;
		const ext = gl.getExtension("WEBGL_debug_renderer_info");
		const rendererStr = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
		gl.getExtension("WEBGL_lose_context")?.loseContext();
		return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
	} catch {
		return true;
	}
}
function disposeSceneTree(root) {
	root.traverse((obj) => {
		const renderable = obj;
		if (renderable.geometry) renderable.geometry.dispose();
		const mat = renderable.material;
		if (Array.isArray(mat)) mat.forEach((m) => {
			const std = m;
			std.map?.dispose();
			std.roughnessMap?.dispose();
			m.dispose();
		});
		else if (mat) {
			const std = mat;
			std.map?.dispose();
			std.roughnessMap?.dispose();
			mat.dispose();
		}
	});
}
function createBrushedSteelTextures(maxAnisotropy) {
	const albedoCanvas = document.createElement("canvas");
	albedoCanvas.width = 512;
	albedoCanvas.height = 256;
	const ctxA = albedoCanvas.getContext("2d");
	const roughCanvas = document.createElement("canvas");
	roughCanvas.width = 512;
	roughCanvas.height = 256;
	const ctxR = roughCanvas.getContext("2d");
	if (ctxA && ctxR) {
		ctxA.fillStyle = "#1e293b";
		ctxA.fillRect(0, 0, 512, 256);
		ctxR.fillStyle = "#4a4a4a";
		ctxR.fillRect(0, 0, 512, 256);
		for (let y = 0; y < 256; y += 2) {
			const shade = 26 + y * 17 % 18;
			ctxA.fillStyle = `rgb(${shade}, ${shade + 11}, ${shade + 26})`;
			ctxA.fillRect(0, y, 512, 1);
			const roughVal = 52 + y * 23 % 44;
			ctxR.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
			ctxR.fillRect(0, y, 512, 1);
		}
		ctxA.strokeStyle = "rgba(56, 189, 248, 0.14)";
		ctxA.lineWidth = 1.5;
		for (let x = 64; x < 512; x += 128) {
			ctxA.beginPath();
			ctxA.moveTo(x, 0);
			ctxA.lineTo(x, 256);
			ctxA.stroke();
		}
	}
	const map = new CanvasTexture(albedoCanvas);
	map.colorSpace = SRGBColorSpace;
	map.wrapS = RepeatWrapping;
	map.wrapT = RepeatWrapping;
	map.anisotropy = Math.max(1, maxAnisotropy);
	const roughnessMap = new CanvasTexture(roughCanvas);
	roughnessMap.colorSpace = "";
	roughnessMap.wrapS = RepeatWrapping;
	roughnessMap.wrapT = RepeatWrapping;
	roughnessMap.anisotropy = Math.max(1, maxAnisotropy);
	return {
		map,
		roughnessMap
	};
}
function createContactShadowTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
		grad.addColorStop(0, "rgba(2, 6, 23, 0.72)");
		grad.addColorStop(.5, "rgba(2, 6, 23, 0.34)");
		grad.addColorStop(1, "rgba(2, 6, 23, 0)");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 256, 256);
	}
	const tex = new CanvasTexture(canvas);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}
function createBeamWaveShaderMaterial() {
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		side: 2,
		blending: 2,
		uniforms: {
			uTime: { value: 0 },
			uColor: { value: new Color(2282478) },
			uIntensity: { value: .9 }
		},
		vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
		fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      void main() {
        float travel = fract(vUv.y * 5.0 - uTime * 1.45);
        float waveBand = smoothstep(0.0, 0.25, travel) * (1.0 - smoothstep(0.35, 0.95, travel));
        float fresnel = pow(1.0 - abs(dot(normalize(vNormalView), normalize(vViewPos))), 1.4);
        float axialFade = smoothstep(0.0, 0.14, vUv.y) * (1.0 - smoothstep(0.65, 1.0, vUv.y));
        float alpha = (0.14 + 0.55 * waveBand + 0.32 * fresnel) * axialFade * uIntensity;
        gl_FragColor = vec4(uColor * (1.0 + waveBand * 0.45), clamp(alpha, 0.0, 0.88));
      }
    `
	});
}
function createHorizonGridMaterial() {
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		side: 2,
		uniforms: {
			uTime: { value: 0 },
			uAccentColor: { value: new Color(440020) }
		},
		vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
		fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uAccentColor;
      void main() {
        vec2 centered = (vUv - 0.5) * 24.0;
        vec2 grid = abs(fract(centered - 0.5) - 0.5) / fwidth(centered);
        float line = min(grid.x, grid.y);
        float gridAlpha = 1.0 - min(line, 1.0);
        float dist = length(vUv - 0.5) * 2.0;
        float radialMask = 1.0 - smoothstep(0.28, 0.96, dist);
        float pulseRing = smoothstep(0.04, 0.0, abs(fract(dist * 0.85 - uTime * 0.18) - 0.5));
        vec3 col = mix(vec3(0.06, 0.14, 0.28), uAccentColor, pulseRing * 0.65);
        float alpha = (gridAlpha * 0.24 + pulseRing * 0.14) * radialMask;
        gl_FragColor = vec4(col, alpha);
      }
    `
	});
}
var InscoHero3dBanner = ({ language, mode, cameraPreset, autoOrbit, onInspectedPartChange, className = "" }) => {
	const isAr = language === "ar";
	const mountRef = (0, import_react.useRef)(null);
	const [webglUnavailable, setWebglUnavailable] = (0, import_react.useState)(false);
	const modeRef = (0, import_react.useRef)(mode);
	const presetRef = (0, import_react.useRef)(cameraPreset);
	const autoOrbitRef = (0, import_react.useRef)(autoOrbit);
	const isArRef = (0, import_react.useRef)(isAr);
	const userDraggedRef = (0, import_react.useRef)(false);
	const presetTransitionRef = (0, import_react.useRef)(false);
	const onInspectedPartRef = (0, import_react.useRef)(onInspectedPartChange);
	(0, import_react.useEffect)(() => {
		modeRef.current = mode;
	}, [mode]);
	(0, import_react.useEffect)(() => {
		presetRef.current = cameraPreset;
		userDraggedRef.current = false;
		presetTransitionRef.current = true;
	}, [cameraPreset]);
	(0, import_react.useEffect)(() => {
		autoOrbitRef.current = autoOrbit;
	}, [autoOrbit]);
	(0, import_react.useEffect)(() => {
		isArRef.current = isAr;
	}, [isAr]);
	(0, import_react.useEffect)(() => {
		onInspectedPartRef.current = onInspectedPartChange;
	}, [onInspectedPartChange]);
	(0, import_react.useEffect)(() => {
		const container = mountRef.current;
		if (!container) return;
		const prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const isSoftwareGl = detectSoftwareWebGL();
		let renderer;
		try {
			renderer = new WebGLRenderer({
				antialias: !isSoftwareGl,
				alpha: true,
				powerPreference: "high-performance"
			});
		} catch {
			setWebglUnavailable(true);
			return;
		}
		const initW = Math.max(320, container.clientWidth || 960);
		const initH = Math.max(320, container.clientHeight || 560);
		renderer.outputColorSpace = SRGBColorSpace;
		renderer.toneMapping = 4;
		renderer.toneMappingExposure = 1.12;
		renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
		renderer.setSize(initW, initH);
		renderer.shadowMap.enabled = !isSoftwareGl;
		renderer.shadowMap.type = 2;
		container.innerHTML = "";
		renderer.domElement.style.display = "block";
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		container.appendChild(renderer.domElement);
		const handleContextLost = (e) => {
			e.preventDefault();
			setWebglUnavailable(true);
		};
		const handleContextRestored = () => {
			setWebglUnavailable(false);
		};
		renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
		renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
		const scene = new Scene();
		scene.background = new Color(132631);
		scene.fog = new FogExp2(132631, .048);
		const pmremGenerator = new PMREMGenerator(renderer);
		const envTex = pmremGenerator.fromScene(new RoomEnvironment(), .04).texture;
		scene.environment = envTex;
		pmremGenerator.dispose();
		const camera = new PerspectiveCamera(40, initW / initH, .1, 80);
		camera.position.set(3.4, 2.25, 7.6);
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = !isSoftwareGl;
		controls.dampingFactor = .06;
		controls.enableZoom = false;
		controls.enablePan = false;
		controls.minPolarAngle = Math.PI * .22;
		controls.maxPolarAngle = Math.PI * .64;
		controls.target.set(0, -.1, 0);
		controls.addEventListener("start", () => {
			userDraggedRef.current = true;
			presetTransitionRef.current = false;
		});
		const hemiLight = new HemisphereLight(8246268, 988970, .85);
		scene.add(hemiLight);
		const keyLight = new DirectionalLight(16773590, 2.2);
		keyLight.position.set(5.5, 8, 5);
		keyLight.castShadow = !isSoftwareGl;
		keyLight.shadow.mapSize.set(1024, 1024);
		keyLight.shadow.camera.near = 1;
		keyLight.shadow.camera.far = 22;
		keyLight.shadow.camera.left = -5.5;
		keyLight.shadow.camera.right = 5.5;
		keyLight.shadow.camera.top = 4.5;
		keyLight.shadow.camera.bottom = -4.5;
		keyLight.shadow.bias = -5e-4;
		keyLight.shadow.normalBias = .02;
		scene.add(keyLight);
		const rimLight = new DirectionalLight(2282478, 1.55);
		rimLight.position.set(-6, 3.2, -5);
		scene.add(rimLight);
		const inspectionSpotLight = new PointLight(3718648, 3, 9, 1.6);
		inspectionSpotLight.position.set(0, 1.75, 1.6);
		scene.add(inspectionSpotLight);
		const steelTextures = createBrushedSteelTextures(renderer.capabilities.getMaxAnisotropy());
		const contactShadowTex = createContactShadowTexture();
		const pipeSteelMat = new MeshPhysicalMaterial({
			color: 3359061,
			map: steelTextures.map,
			roughnessMap: steelTextures.roughnessMap,
			metalness: .92,
			roughness: .24,
			anisotropy: .8,
			anisotropyRotation: Math.PI / 2,
			clearcoat: .25,
			clearcoatRoughness: .35
		});
		const flangeSteelMat = new MeshStandardMaterial({
			color: 6583435,
			metalness: .88,
			roughness: .32
		});
		const matteSlateMat = new MeshStandardMaterial({
			color: 988970,
			metalness: .35,
			roughness: .72
		});
		const weldSeamMat = new MeshStandardMaterial({
			color: 3718648,
			metalness: .78,
			roughness: .28,
			emissive: new Color(165063),
			emissiveIntensity: .75
		});
		const scannerBodyMat = new MeshStandardMaterial({
			color: 165063,
			metalness: .65,
			roughness: .28,
			emissive: new Color(959977),
			emissiveIntensity: .32
		});
		const brassTrimMat = new MeshStandardMaterial({
			color: 16096779,
			metalness: .9,
			roughness: .22
		});
		const perspexWedgeMat = new MeshPhysicalMaterial({
			color: 14742270,
			metalness: .05,
			roughness: .08,
			transmission: isSoftwareGl ? 0 : .78,
			transparent: true,
			opacity: isSoftwareGl ? .42 : .95,
			ior: 1.49,
			thickness: .45,
			clearcoat: 1
		});
		const pwhtPadMat = new MeshStandardMaterial({
			color: 16347926,
			metalness: .25,
			roughness: .65,
			emissive: new Color(14753096),
			emissiveIntensity: .9,
			transparent: true,
			opacity: 0
		});
		const beamShaderMat = createBeamWaveShaderMaterial();
		const horizonGridMat = createHorizonGridMaterial();
		const heroRigGroup = new Group();
		scene.add(heroRigGroup);
		const floorY = -1.78;
		const gridPlane = new Mesh(new PlaneGeometry(24, 24), horizonGridMat);
		gridPlane.rotation.x = -Math.PI / 2;
		gridPlane.position.y = floorY;
		scene.add(gridPlane);
		const shadowPlaneMat = new MeshBasicMaterial({
			map: contactShadowTex,
			transparent: true,
			depthWrite: false,
			opacity: .7
		});
		const shadowPlane = new Mesh(new PlaneGeometry(7.2, 3.6), shadowPlaneMat);
		shadowPlane.rotation.x = -Math.PI / 2;
		shadowPlane.position.y = -1.76;
		heroRigGroup.add(shadowPlane);
		const pipeRadius = 1.12;
		const pipeLength = 5.8;
		const pipeGeo = new CylinderGeometry(pipeRadius, pipeRadius, pipeLength, 52, 1, false);
		pipeGeo.rotateZ(Math.PI / 2);
		const pipeMesh = new Mesh(pipeGeo, pipeSteelMat);
		pipeMesh.castShadow = true;
		pipeMesh.receiveShadow = true;
		heroRigGroup.add(pipeMesh);
		const wireGeo = new CylinderGeometry(1.1280000000000001, 1.1280000000000001, 5.7, 28, 6, true);
		wireGeo.rotateZ(Math.PI / 2);
		const wireMat = new MeshBasicMaterial({
			color: 3718648,
			wireframe: true,
			transparent: true,
			opacity: .11
		});
		const wireCage = new Mesh(wireGeo, wireMat);
		heroRigGroup.add(wireCage);
		const boreGeo = new CylinderGeometry(pipeRadius * .78, pipeRadius * .78, 5.88, 36);
		boreGeo.rotateZ(Math.PI / 2);
		const boreMesh = new Mesh(boreGeo, matteSlateMat);
		heroRigGroup.add(boreMesh);
		const flangeProfile = [
			new Vector2(pipeRadius * .8, -.18),
			new Vector2(1.54, -.18),
			new Vector2(1.54, .06),
			new Vector2(1.36, .14),
			new Vector2(1.1400000000000001, .26),
			new Vector2(pipeRadius * .8, .26)
		];
		const flangeGeo = new LatheGeometry(flangeProfile, 44);
		flangeGeo.rotateZ(Math.PI / 2);
		const leftFlange = new Mesh(flangeGeo, flangeSteelMat);
		leftFlange.position.x = -2.76;
		leftFlange.castShadow = true;
		leftFlange.userData.partId = "ansi_flange";
		heroRigGroup.add(leftFlange);
		const rightFlange = new Mesh(flangeGeo, flangeSteelMat);
		rightFlange.rotation.y = Math.PI;
		rightFlange.position.x = pipeLength / 2 - .14;
		rightFlange.castShadow = true;
		rightFlange.userData.partId = "ansi_flange";
		heroRigGroup.add(rightFlange);
		const boltGeo = new CylinderGeometry(.048, .048, .38, 6);
		boltGeo.rotateZ(Math.PI / 2);
		const boltCountPerSide = 16;
		const flangeBoltsInstanced = new InstancedMesh(boltGeo, brassTrimMat, 32);
		const boltRingR = 1.4000000000000001;
		let boltIdx = 0;
		[-2.82, pipeLength / 2 - .08].forEach((fx) => {
			for (let i = 0; i < boltCountPerSide; i++) {
				const ang = i / boltCountPerSide * Math.PI * 2;
				_dummy.position.set(fx, Math.cos(ang) * boltRingR, Math.sin(ang) * boltRingR);
				_dummy.rotation.set(0, 0, 0);
				_dummy.scale.set(1, 1, 1);
				_dummy.updateMatrix();
				flangeBoltsInstanced.setMatrixAt(boltIdx++, _dummy.matrix);
			}
		});
		flangeBoltsInstanced.instanceMatrix.needsUpdate = true;
		flangeBoltsInstanced.computeBoundingSphere();
		flangeBoltsInstanced.userData.partId = "ansi_flange";
		heroRigGroup.add(flangeBoltsInstanced);
		const saddleShape = new Shape();
		saddleShape.moveTo(-.92, 0);
		saddleShape.lineTo(.92, 0);
		saddleShape.lineTo(.78, .72);
		saddleShape.absarc(0, 1.78, 1.1500000000000001, -Math.PI * .22, -Math.PI * .78, true);
		saddleShape.lineTo(-.78, .72);
		saddleShape.closePath();
		const saddleGeo = new ExtrudeGeometry(saddleShape, {
			depth: .28,
			bevelEnabled: true,
			bevelThickness: .03,
			bevelSize: .025,
			bevelSegments: 2
		});
		saddleGeo.rotateY(Math.PI / 2);
		saddleGeo.translate(-.14, floorY, 0);
		[-1.85, 1.85].forEach((sx) => {
			const saddle = new Mesh(saddleGeo, matteSlateMat);
			saddle.position.x = sx;
			saddle.castShadow = true;
			saddle.receiveShadow = true;
			heroRigGroup.add(saddle);
		});
		const weldProfile = [
			new Vector2(1.1, -.24),
			new Vector2(1.1800000000000002, -.11),
			new Vector2(1.205, 0),
			new Vector2(1.1800000000000002, .11),
			new Vector2(1.1, .24)
		];
		const weldGeo = new LatheGeometry(weldProfile, 52);
		weldGeo.rotateZ(Math.PI / 2);
		const weldSeamMesh = new Mesh(weldGeo, weldSeamMat);
		weldSeamMesh.userData.partId = "weld_seam";
		heroRigGroup.add(weldSeamMesh);
		const flawRingGeo = new TorusGeometry(1.215, .016, 12, 56);
		flawRingGeo.rotateY(Math.PI / 2);
		const flawRingMat = new MeshBasicMaterial({
			color: 2282478,
			transparent: true,
			opacity: .75
		});
		const flawRing = new Mesh(flawRingGeo, flawRingMat);
		heroRigGroup.add(flawRing);
		const padGeo = new BoxGeometry(.68, .08, .44);
		const pwhtPadCount = 12;
		const pwhtPadsMesh = new InstancedMesh(padGeo, pwhtPadMat, pwhtPadCount);
		for (let i = 0; i < pwhtPadCount; i++) {
			const ang = i / pwhtPadCount * Math.PI * 2;
			const rPad = 1.2400000000000002;
			_dummy.position.set(0, Math.cos(ang) * rPad, Math.sin(ang) * rPad);
			_dummy.rotation.set(ang, 0, 0);
			_dummy.scale.set(1, 1, 1);
			_dummy.updateMatrix();
			pwhtPadsMesh.setMatrixAt(i, _dummy.matrix);
		}
		pwhtPadsMesh.instanceMatrix.needsUpdate = true;
		pwhtPadsMesh.computeBoundingSphere();
		heroRigGroup.add(pwhtPadsMesh);
		const bandGeo = new TorusGeometry(1.2100000000000002, .035, 16, 64);
		bandGeo.rotateY(Math.PI / 2);
		const guideBand = new Mesh(bandGeo, flangeSteelMat);
		guideBand.position.x = .56;
		heroRigGroup.add(guideBand);
		const scannerPivot = new Group();
		heroRigGroup.add(scannerPivot);
		const scannerCarriage = new Group();
		scannerCarriage.position.set(.56, 1.2600000000000002, 0);
		scannerPivot.add(scannerCarriage);
		const chassisShape = new Shape();
		chassisShape.moveTo(-.26, 0);
		chassisShape.lineTo(.26, 0);
		chassisShape.lineTo(.22, .24);
		chassisShape.lineTo(-.18, .28);
		chassisShape.closePath();
		const chassisGeo = new ExtrudeGeometry(chassisShape, {
			depth: .34,
			bevelEnabled: true,
			bevelThickness: .03,
			bevelSize: .02,
			bevelSegments: 2
		});
		chassisGeo.translate(0, 0, -.17);
		const chassisMesh = new Mesh(chassisGeo, scannerBodyMat);
		chassisMesh.castShadow = true;
		chassisMesh.userData.partId = "orbital_scanner";
		scannerCarriage.add(chassisMesh);
		const armGeo = new BoxGeometry(.42, .07, .09);
		const armMesh = new Mesh(armGeo, flangeSteelMat);
		armMesh.position.set(-.34, .08, 0);
		armMesh.userData.partId = "orbital_scanner";
		scannerCarriage.add(armMesh);
		const wedgeGeo = new BoxGeometry(.26, .16, .22);
		const wedgeMesh = new Mesh(wedgeGeo, perspexWedgeMat);
		wedgeMesh.position.set(-.56, -.02, 0);
		wedgeMesh.userData.partId = "orbital_scanner";
		scannerCarriage.add(wedgeMesh);
		const arrayCap = new Mesh(new BoxGeometry(.18, .12, .2), scannerBodyMat);
		arrayCap.position.set(-.56, .11, 0);
		arrayCap.userData.partId = "orbital_scanner";
		scannerCarriage.add(arrayCap);
		const lemoConnector = new Mesh(new CylinderGeometry(.03, .03, .12, 12), brassTrimMat);
		lemoConnector.position.set(-.56, .22, 0);
		scannerCarriage.add(lemoConnector);
		const cableCurve = new CatmullRomCurve3([
			new Vector3(-.56, .27, 0),
			new Vector3(-.4, .45, .08),
			new Vector3(-.14, .42, .05),
			new Vector3(.02, .25, 0)
		]);
		const cableGeo = new TubeGeometry(cableCurve, 20, .022, 8, false);
		const cableMesh = new Mesh(cableGeo, matteSlateMat);
		scannerCarriage.add(cableMesh);
		const beamConeGeo = new CylinderGeometry(.05, .62, 1.35, 32, 1, true);
		const beamConeMesh = new Mesh(beamConeGeo, beamShaderMat);
		beamConeMesh.position.set(-.56, -.72, 0);
		scannerCarriage.add(beamConeMesh);
		const pCount = 140;
		const pPositions = /* @__PURE__ */ new Float32Array(420);
		for (let i = 0; i < pCount; i++) {
			const ang = i / pCount * Math.PI * 2 * 3;
			const rad = 1.5 + i % 5 * .22;
			pPositions[i * 3] = (i / pCount - .5) * 6.4;
			pPositions[i * 3 + 1] = Math.cos(ang) * rad;
			pPositions[i * 3 + 2] = Math.sin(ang) * rad;
		}
		const pGeo = new BufferGeometry();
		pGeo.setAttribute("position", new BufferAttribute(pPositions, 3));
		const pMat = new PointsMaterial({
			color: 3718648,
			size: .048,
			transparent: true,
			opacity: .65,
			blending: 2,
			depthWrite: false
		});
		const particlePoints = new Points(pGeo, pMat);
		heroRigGroup.add(particlePoints);
		if (!isSoftwareGl) renderer.compile(scene, camera);
		const raycaster = new Raycaster();
		const clickables = [
			weldSeamMesh,
			chassisMesh,
			wedgeMesh,
			arrayCap,
			leftFlange,
			rightFlange
		];
		let lastRaycastMs = 0;
		const handlePointerMove = (e) => {
			const now = performance.now();
			if (now - lastRaycastMs < 55) return;
			lastRaycastMs = now;
			const rect = renderer.domElement.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;
			_pointerVec.x = (e.clientX - rect.left) / rect.width * 2 - 1;
			_pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(_pointerVec, camera);
			const hits = raycaster.intersectObjects(clickables, false);
			if (hits.length > 0) {
				const partId = hits[0].object.userData.partId;
				renderer.domElement.style.cursor = "pointer";
				if (partId && PART_SPECS[partId]) onInspectedPartRef.current?.(PART_SPECS[partId]);
			} else renderer.domElement.style.cursor = "grab";
		};
		renderer.domElement.addEventListener("pointermove", handlePointerMove);
		const applyResponsiveFraming = (w, h) => {
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h);
		};
		const handleResize = () => {
			if (!mountRef.current) return;
			const w = Math.max(320, mountRef.current.clientWidth);
			const h = Math.max(320, mountRef.current.clientHeight);
			applyResponsiveFraming(w, h);
		};
		let resizeObserver = null;
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(handleResize);
			resizeObserver.observe(container);
		}
		window.addEventListener("resize", handleResize);
		const clock = new Clock();
		let frameId = 0;
		let disposed = false;
		const afterDraw = (cb) => {
			try {
				const gl = renderer.getContext();
				if (gl && typeof gl.fenceSync === "function") {
					const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
					gl.flush();
					const poll = () => {
						if (disposed) return;
						if ((sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED) === gl.UNSIGNALED) frameId = window.setTimeout(poll, 5);
						else {
							if (sync) gl.deleteSync(sync);
							frameId = window.setTimeout(cb, 80);
						}
					};
					frameId = window.setTimeout(poll, 5);
					return;
				}
			} catch {}
			frameId = window.setTimeout(cb, 80);
		};
		const tick = () => {
			if (disposed) return;
			const dt = Math.min(clock.getDelta(), .08);
			const elapsed = prefersReducedMotion ? 0 : clock.getElapsedTime();
			const isWide = (container.clientWidth || initW) >= 980;
			const desiredRigX = isWide ? isArRef.current ? -1.45 : 1.45 : 0;
			heroRigGroup.position.x = MathUtils.damp(heroRigGroup.position.x, desiredRigX, 5, dt);
			heroRigGroup.position.y = isWide ? -.08 : .15;
			const preset = presetRef.current;
			const baseX = heroRigGroup.position.x;
			if (preset === "weld_focus") {
				_camGoalPos.set(baseX + .65, 1.35, 4.15);
				_camGoalTarget.set(baseX, .05, 0);
			} else if (preset === "orbital_rig") {
				_camGoalPos.set(baseX + 2.4, 2.05, 4.65);
				_camGoalTarget.set(baseX + .35, .55, 0);
			} else {
				_camGoalPos.set(baseX + (isArRef.current ? -.9 : .9), 2.15, isWide ? 7.1 : 8.2);
				_camGoalTarget.set(baseX, -.05, 0);
			}
			if (presetTransitionRef.current && !userDraggedRef.current) {
				camera.position.x = MathUtils.damp(camera.position.x, _camGoalPos.x, 4.5, dt);
				camera.position.y = MathUtils.damp(camera.position.y, _camGoalPos.y, 4.5, dt);
				camera.position.z = MathUtils.damp(camera.position.z, _camGoalPos.z, 4.5, dt);
				controls.target.x = MathUtils.damp(controls.target.x, _camGoalTarget.x, 5.5, dt);
				controls.target.y = MathUtils.damp(controls.target.y, _camGoalTarget.y, 5.5, dt);
				controls.target.z = MathUtils.damp(controls.target.z, _camGoalTarget.z, 5.5, dt);
				if (camera.position.distanceTo(_camGoalPos) < .03) presetTransitionRef.current = false;
			} else if (!userDraggedRef.current) controls.target.x = MathUtils.damp(controls.target.x, _camGoalTarget.x, 4, dt);
			controls.autoRotate = autoOrbitRef.current && !prefersReducedMotion && !isSoftwareGl;
			controls.autoRotateSpeed = .65;
			controls.update();
			const curMode = modeRef.current;
			beamShaderMat.uniforms.uTime.value = elapsed;
			horizonGridMat.uniforms.uTime.value = elapsed;
			if (curMode === "ut") {
				beamShaderMat.uniforms.uColor.value.setHex(2282478);
				beamShaderMat.uniforms.uIntensity.value = .95;
				horizonGridMat.uniforms.uAccentColor.value.setHex(440020);
				weldSeamMat.color.setHex(3718648);
				weldSeamMat.emissive.setHex(165063);
				weldSeamMat.emissiveIntensity = .72 + Math.sin(elapsed * 2.5) * .14;
				flawRingMat.color.setHex(2282478);
				flawRingMat.opacity = .65 + Math.sin(elapsed * 4) * .25;
				pMat.color.setHex(3718648);
				inspectionSpotLight.color.setHex(2282478);
				pwhtPadMat.opacity = MathUtils.damp(pwhtPadMat.opacity, 0, 6, dt);
				beamConeMesh.visible = true;
			} else if (curMode === "rt") {
				beamShaderMat.uniforms.uColor.value.setHex(16096779);
				beamShaderMat.uniforms.uIntensity.value = 1.05;
				horizonGridMat.uniforms.uAccentColor.value.setHex(16096779);
				weldSeamMat.color.setHex(16498468);
				weldSeamMat.emissive.setHex(14251782);
				weldSeamMat.emissiveIntensity = .8 + Math.sin(elapsed * 3) * .18;
				flawRingMat.color.setHex(16498468);
				flawRingMat.opacity = .72 + Math.sin(elapsed * 5) * .22;
				pMat.color.setHex(16498468);
				inspectionSpotLight.color.setHex(16096779);
				pwhtPadMat.opacity = MathUtils.damp(pwhtPadMat.opacity, 0, 6, dt);
				beamConeMesh.visible = true;
			} else {
				beamShaderMat.uniforms.uColor.value.setHex(16007006);
				beamShaderMat.uniforms.uIntensity.value = .45;
				horizonGridMat.uniforms.uAccentColor.value.setHex(16347926);
				weldSeamMat.color.setHex(16478597);
				weldSeamMat.emissive.setHex(14753096);
				weldSeamMat.emissiveIntensity = 1.35 + Math.sin(elapsed * 2.2) * .35;
				flawRingMat.color.setHex(16347926);
				flawRingMat.opacity = .5 + Math.sin(elapsed * 2.5) * .25;
				pMat.color.setHex(16347926);
				inspectionSpotLight.color.setHex(16347926);
				pwhtPadMat.opacity = MathUtils.damp(pwhtPadMat.opacity, .92, 4, dt);
				pwhtPadMat.emissiveIntensity = .85 + Math.sin(elapsed * 2.8) * .35;
				beamConeMesh.visible = false;
			}
			if (!prefersReducedMotion) {
				const orbitAngle = Math.sin(elapsed * .55) * .78;
				scannerPivot.rotation.x = orbitAngle;
				particlePoints.rotation.x = elapsed * .18;
			}
			renderer.render(scene, camera);
			if (prefersReducedMotion) return;
			if (isSoftwareGl) afterDraw(tick);
			else frameId = requestAnimationFrame(tick);
		};
		tick();
		return () => {
			disposed = true;
			cancelAnimationFrame(frameId);
			clearTimeout(frameId);
			resizeObserver?.disconnect();
			window.removeEventListener("resize", handleResize);
			renderer.domElement.removeEventListener("pointermove", handlePointerMove);
			renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
			renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
			controls.dispose();
			envTex.dispose();
			steelTextures.map.dispose();
			steelTextures.roughnessMap.dispose();
			contactShadowTex.dispose();
			disposeSceneTree(scene);
			renderer.dispose();
		};
	}, []);
	if (webglUnavailable) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "insco-3d-banner-fallback",
		className: `relative w-full h-full overflow-hidden bg-slate-950 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-radial-[circle_at_70%_45%,_var(--tw-gradient-stops)] from-cyan-900/35 via-slate-950 to-slate-950" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 1200 560",
			className: "absolute inset-0 w-full h-full opacity-55",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "fallbackPipeGrad",
				x1: "0%",
				y1: "0%",
				x2: "0%",
				y2: "100%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#38bdf8",
						stopOpacity: "0.25"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "50%",
						stopColor: "#0f172a",
						stopOpacity: "0.85"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#0284c7",
						stopOpacity: "0.2"
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				transform: isAr ? "translate(140, 130)" : "translate(540, 130)",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "40",
						y: "95",
						width: "480",
						height: "145",
						rx: "18",
						fill: "url(#fallbackPipeGrad)",
						stroke: "#38bdf8",
						strokeWidth: "1.5",
						strokeOpacity: "0.45"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "262",
						y: "88",
						width: "26",
						height: "159",
						rx: "4",
						fill: "#0ea5e9",
						fillOpacity: "0.32",
						stroke: "#22d3ee",
						strokeWidth: "2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "40",
						cy: "167",
						rx: "18",
						ry: "88",
						fill: "#1e293b",
						stroke: "#64748b",
						strokeWidth: "2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "520",
						cy: "167",
						rx: "18",
						ry: "88",
						fill: "#1e293b",
						stroke: "#64748b",
						strokeWidth: "2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M275 88 L225 235 L325 235 Z",
						fill: "#22d3ee",
						fillOpacity: "0.22",
						className: "ut-beam-cone-pulse"
					})
				]
			})]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: mountRef,
		"data-testid": "insco-3d-banner-canvas-host",
		"aria-label": isAr ? "مشهد ثلاثي الأبعاد تفاعلي لفحص خطوط الأنابيب" : "Interactive 3D pipeline NDT & PWHT inspection scene",
		className: `relative w-full h-full overflow-hidden select-none ${className}`
	});
};
//#endregion
export { InscoHero3dBanner };
