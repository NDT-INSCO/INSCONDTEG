import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as Eye } from "./eye-DyafRkmV.js";
import { Wn as Layers, vr as Box } from "./index-DREFzxRg.js";
import { A as MathUtils, C as Line, D as LineLoop, F as MeshStandardMaterial, G as Quaternion, H as Points, M as MeshBasicMaterial, O as LineSegments, Q as ShaderMaterial, R as PerspectiveCamera, T as LineCurve3, U as PointsMaterial, V as PointLight, W as QuadraticBezierCurve3, X as SRGBColorSpace, Y as RingGeometry, Z as Scene, _ as FogExp2, a as BufferAttribute, at as TorusGeometry, b as HemisphereLight, c as CatmullRomCurve3, ct as Vector3, et as SphereGeometry, h as EdgesGeometry, i as BoxGeometry, j as Mesh, l as Clock, m as DirectionalLight, n as WebGLRenderer, nt as Sprite, o as BufferGeometry, ot as TubeGeometry, p as CylinderGeometry, rt as SpriteMaterial, s as CanvasTexture, t as PMREMGenerator, u as Color, v as GridHelper, w as LineBasicMaterial, y as Group } from "./three.module-KJ9Rnf9y.js";
import { n as RoomEnvironment } from "./OrbitControls-NitkVtVF.js";
//#region src/components/academy/virtuallab/UtThreeScene.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function getSeverityHex(severity, isLiveActive) {
	if (isLiveActive) return 2282478;
	if (severity === "Critical") return 15680580;
	if (severity === "High") return 16096779;
	if (severity === "Moderate") return 3718648;
	return 3462041;
}
function getSeverityCssColor(severity, isLiveActive) {
	if (isLiveActive) return "#22d3ee";
	if (severity === "Critical") return "#f87171";
	if (severity === "High") return "#fbbf24";
	if (severity === "Moderate") return "#38bdf8";
	return "#34d399";
}
/**
* Generates a razor-sharp procedural CanvasTexture callout badge for 3D dimension annotations
* (Depth Z and Length L) with SRGBColorSpace and anisotropic filtering.
*/
function createDimensionCalloutSprite(primaryText, secondaryText, accentCss, maxAnisotropy, disposables) {
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 128;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(7, 12, 26, 0.92)";
		ctx.strokeStyle = accentCss;
		ctx.lineWidth = 4;
		ctx.beginPath();
		if (typeof ctx.roundRect === "function") ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 18);
		else ctx.rect(8, 8, canvas.width - 16, canvas.height - 16);
		ctx.fill();
		ctx.stroke();
		ctx.font = "bold 34px \"JetBrains Mono\", \"IBM Plex Mono\", monospace";
		ctx.fillStyle = "#f8fafc";
		ctx.textBaseline = "middle";
		ctx.fillText(primaryText, 28, 48);
		ctx.font = "bold 26px \"JetBrains Mono\", \"IBM Plex Mono\", monospace";
		ctx.fillStyle = accentCss;
		ctx.fillText(secondaryText, 28, 88);
	}
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = Math.max(1, maxAnisotropy);
	texture.needsUpdate = true;
	const spriteMat = new SpriteMaterial({
		map: texture,
		transparent: true,
		depthTest: false,
		depthWrite: false
	});
	disposables.push(texture, spriteMat);
	const sprite = new Sprite(spriteMat);
	sprite.scale.set(2.55, .64, 1);
	sprite.renderOrder = 18;
	return sprite;
}
/**
* Generates an animated GLSL 1.0 ShaderMaterial for 3D ultrasonic beam cones & Fresnel near-field zones.
* Renders traveling compressional/shear wavefront crests, near-field interference ripples, and Fresnel rim glow.
*/
function createUltrasonicBeamShaderMaterial(options) {
	const { coreColor, outerColor, nearFieldColor = 11032055, freqMHz, nearFieldFrac, baseOpacity, phaseOffset = 0, isDetected = false, isNearFieldZone = false, xrayActive = false } = options;
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		depthTest: false,
		side: 2,
		uniforms: {
			uTime: { value: 0 },
			uFreqMHz: { value: freqMHz },
			uNearFieldFrac: { value: MathUtils.clamp(nearFieldFrac, .05, .95) },
			uBaseOpacity: { value: baseOpacity * (xrayActive ? 1.25 : .92) },
			uPhaseOffset: { value: phaseOffset },
			uIsDetected: { value: isDetected ? 1 : 0 },
			uIsNearFieldZone: { value: isNearFieldZone ? 1 : 0 },
			uCoreColor: { value: new Color(coreColor) },
			uOuterColor: { value: new Color(outerColor) },
			uNearFieldColor: { value: new Color(nearFieldColor) },
			uEchoColor: { value: new Color(1096065) }
		},
		vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
		fragmentShader: `
      uniform float uTime;
      uniform float uFreqMHz;
      uniform float uNearFieldFrac;
      uniform float uBaseOpacity;
      uniform float uPhaseOffset;
      uniform float uIsDetected;
      uniform float uIsNearFieldZone;
      uniform vec3 uCoreColor;
      uniform vec3 uOuterColor;
      uniform vec3 uNearFieldColor;
      uniform vec3 uEchoColor;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;

      void main() {
        // CylinderGeometry maps uv.y = 1.0 at entry (start) -> 0.0 at far end
        float axial = clamp(1.0 - vUv.y, 0.0, 1.0);
        float waveDensity = 5.0 + uFreqMHz * 1.9;
        float speed = 1.85 + uFreqMHz * 0.22;

        // Forward-traveling acoustic wave crests & burst packet envelope
        float phase = (axial * waveDensity - uTime * speed) * 6.2831853 + uPhaseOffset;
        float crest = pow(0.5 + 0.5 * cos(phase), 2.6);
        float packet = 0.55 + 0.45 * sin((axial * 2.1 - uTime * (speed * 0.44)) * 6.2831853 + uPhaseOffset);

        // Fresnel Near-Field interference fringes (0 -> N_eff)
        float nfMask = 1.0 - smoothstep(uNearFieldFrac - 0.06, uNearFieldFrac + 0.08, axial);
        float interference = 0.5 + 0.5 * sin(vUv.x * 18.84955 + axial * 16.0 - uTime * 3.4);
        float nfMix = clamp(nfMask * (0.55 + 0.45 * uIsNearFieldZone), 0.0, 1.0);

        // Returning defect echo wave (when defect is intersected)
        float echoCrest = pow(0.5 + 0.5 * cos((axial * waveDensity * 0.9 + uTime * speed * 1.15) * 6.2831853), 3.0);
        float echoMask = uIsDetected * 0.42 * echoCrest;

        // Soft Fresnel rim glow so cone borders read as acoustic energy rather than hard polygons
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float ndotv = abs(dot(n, v));
        float rim = pow(1.0 - ndotv, 1.35);
        float centerGlow = smoothstep(0.0, 0.65, ndotv);

        vec3 baseCol = mix(uOuterColor, uCoreColor, clamp(crest * 0.75 + centerGlow * 0.35, 0.0, 1.0));
        baseCol = mix(baseCol, uNearFieldColor, nfMix * (0.45 + 0.45 * interference));
        baseCol = mix(baseCol, uEchoColor, clamp(echoMask, 0.0, 0.65));

        float endFade = smoothstep(0.0, 0.04, axial) * (1.0 - smoothstep(0.94, 1.0, axial) * 0.45);
        float energy = (0.34 + 0.66 * crest * packet + nfMix * interference * 0.22 + echoMask * 0.35);
        float alpha = clamp(uBaseOpacity * energy * (0.58 + 0.55 * rim) * endFade, 0.04, 0.88);

        gl_FragColor = vec4(baseCol, alpha);
      }
    `
	});
}
/**
* Recursively disposes geometries, materials, and procedural textures inside a Three.js Object3D tree.
*/
function disposeObjectTree(obj) {
	obj.traverse((child) => {
		const meshOrLine = child;
		if (meshOrLine.geometry) meshOrLine.geometry.dispose();
		const mat = meshOrLine.material;
		if (Array.isArray(mat)) mat.forEach((m) => {
			const tex = m.map;
			if (tex) tex.dispose();
			m.dispose();
		});
		else if (mat) {
			const tex = mat.map;
			if (tex) tex.dispose();
			mat.dispose();
		}
	});
}
var UtThreeScene = ({ language = "ar", blockType, probePositionMm, probeAngleDeg, probePreset = "B", selectedStep = 1, plateThicknessMm = 20, defectDetected = false, detectedWireframeOverlays = [], showDefectWireframes = true, xraySpecimenMode = false, onToggleDefectWireframes, onToggleXraySpecimen, transducerFreqMHz = 4, crystalDiameterMm = 12.7, isYokeEnergized = false, areParticlesApplied = false, crackAngleDeg = 90, magneticFieldKaM = 3.6, yokePoleSpacingMm = 120, mtCurrentMode = "AC" }) => {
	const isAr = language === "ar";
	const mountRef = (0, import_react.useRef)(null);
	const [webglUnavailable, setWebglUnavailable] = (0, import_react.useState)(false);
	const [internalShowWireframes, setInternalShowWireframes] = (0, import_react.useState)(true);
	const [internalXrayMode, setInternalXrayMode] = (0, import_react.useState)(false);
	const wireframesVisible = onToggleDefectWireframes ? showDefectWireframes : internalShowWireframes;
	const xrayActive = onToggleXraySpecimen ? xraySpecimenMode : internalXrayMode;
	const handleToggleWireframes = () => {
		if (onToggleDefectWireframes) onToggleDefectWireframes();
		else setInternalShowWireframes((v) => !v);
	};
	const handleToggleXray = () => {
		if (onToggleXraySpecimen) onToggleXraySpecimen();
		else setInternalXrayMode((v) => !v);
	};
	const sceneRef = (0, import_react.useRef)(null);
	const rendererRef = (0, import_react.useRef)(null);
	const cameraRef = (0, import_react.useRef)(null);
	const rootGroupRef = (0, import_react.useRef)(null);
	const probeGroupRef = (0, import_react.useRef)(null);
	const soundBeamRef = (0, import_react.useRef)(null);
	const particlesGroupRef = (0, import_react.useRef)(null);
	const fluxLinesGroupRef = (0, import_react.useRef)(null);
	const defectMeshRef = (0, import_react.useRef)(null);
	const energizedRef = (0, import_react.useRef)(isYokeEnergized);
	energizedRef.current = isYokeEnergized;
	const freqRef = (0, import_react.useRef)(transducerFreqMHz);
	freqRef.current = transducerFreqMHz;
	const magFieldRef = (0, import_react.useRef)(magneticFieldKaM);
	magFieldRef.current = magneticFieldKaM;
	const reducedMotionRef = (0, import_react.useRef)(typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false);
	const isDraggingRef = (0, import_react.useRef)(false);
	const previousMousePositionRef = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const cameraSphericalRef = (0, import_react.useRef)({
		radius: 24,
		theta: Math.PI / 4,
		phi: Math.PI / 3.2
	});
	const targetLookAt = (0, import_react.useRef)(new Vector3(0, 0, 0));
	(0, import_react.useEffect)(() => {
		const mount = mountRef.current;
		if (!mount) return;
		const isSoftwareGl = (() => {
			try {
				const gl = document.createElement("canvas").getContext("webgl2");
				if (!gl) return true;
				const ext = gl.getExtension("WEBGL_debug_renderer_info");
				const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
				const gpu = String(gl.getParameter(param));
				gl.getExtension("WEBGL_lose_context")?.loseContext();
				return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
			} catch {
				return true;
			}
		})();
		const scene = new Scene();
		scene.background = new Color(461338);
		scene.fog = new FogExp2(461338, .014);
		sceneRef.current = scene;
		const width = mount.clientWidth || 600;
		const height = mount.clientHeight || 400;
		const camera = new PerspectiveCamera(42, width / height, .1, 1e3);
		cameraRef.current = camera;
		const updateCameraPos = () => {
			const { radius, theta, phi } = cameraSphericalRef.current;
			camera.position.x = targetLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
			camera.position.y = targetLookAt.current.y + radius * Math.cos(phi);
			camera.position.z = targetLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);
			camera.lookAt(targetLookAt.current);
		};
		updateCameraPos();
		let renderer;
		try {
			renderer = new WebGLRenderer({
				antialias: !isSoftwareGl,
				powerPreference: "high-performance"
			});
		} catch {
			setWebglUnavailable(true);
			return;
		}
		renderer.setSize(width, height);
		renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
		renderer.outputColorSpace = SRGBColorSpace;
		renderer.toneMapping = 4;
		renderer.toneMappingExposure = 1.15;
		renderer.shadowMap.enabled = !isSoftwareGl;
		renderer.shadowMap.type = 2;
		rendererRef.current = renderer;
		mount.appendChild(renderer.domElement);
		const onContextLost = (ev) => {
			ev.preventDefault();
			setWebglUnavailable(true);
		};
		const onContextRestored = () => {
			setWebglUnavailable(false);
		};
		renderer.domElement.addEventListener("webglcontextlost", onContextLost);
		renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
		const pmremGenerator = new PMREMGenerator(renderer);
		try {
			scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), .05).texture;
		} catch {}
		pmremGenerator.dispose();
		const hemiLight = new HemisphereLight(12313087, 988970, .95);
		scene.add(hemiLight);
		const dirLight1 = new DirectionalLight(16774630, 2.3);
		dirLight1.position.set(15, 25, 20);
		dirLight1.castShadow = !isSoftwareGl;
		scene.add(dirLight1);
		const dirLight2 = new DirectionalLight(8961023, 1.15);
		dirLight2.position.set(-15, 12, -15);
		scene.add(dirLight2);
		const pointLight = new PointLight(3718648, 1.4, 30);
		pointLight.position.set(0, 10, 5);
		scene.add(pointLight);
		const gridHelper = new GridHelper(30, 30, 1976635, 988970);
		gridHelper.position.y = -4;
		scene.add(gridHelper);
		const rootGroup = new Group();
		scene.add(rootGroup);
		rootGroupRef.current = rootGroup;
		let frameId = 0;
		let isDisposed = false;
		const clock = new Clock();
		const afterDraw = (cb) => {
			const gl = renderer.getContext();
			if (gl && typeof gl.fenceSync === "function") {
				const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
				gl.flush();
				const poll = () => {
					if (isDisposed) return;
					if ((sync && gl.getSyncParameter(sync, gl.SYNC_STATUS)) === gl.UNSIGNALED) frameId = window.setTimeout(poll, 5);
					else {
						if (sync) gl.deleteSync(sync);
						frameId = window.setTimeout(cb, 80);
					}
				};
				frameId = window.setTimeout(poll, 5);
			} else frameId = window.setTimeout(cb, 80);
		};
		const tick = () => {
			if (isDisposed) return;
			const elapsedTime = clock.getElapsedTime();
			const animTime = reducedMotionRef.current ? .35 : elapsedTime;
			if (soundBeamRef.current) {
				const pulseRate = 3.5 + freqRef.current * 1.15;
				const children = soundBeamRef.current.children;
				for (let idx = 0; idx < children.length; idx++) {
					const child = children[idx];
					if (!(child instanceof Mesh)) continue;
					if (child.material instanceof ShaderMaterial && child.userData.isUtBeamShader) {
						child.material.uniforms.uTime.value = animTime;
						continue;
					}
					const travelCfg = child.userData.utTravelWave;
					if (travelCfg) {
						const rawT = animTime * travelCfg.speed + travelCfg.phaseOffset;
						const t = rawT - Math.floor(rawT);
						child.position.set(travelCfg.startX + (travelCfg.endX - travelCfg.startX) * t, travelCfg.startY + (travelCfg.endY - travelCfg.startY) * t, travelCfg.startZ + (travelCfg.endZ - travelCfg.startZ) * t);
						const r = travelCfg.rStart + (travelCfg.rEnd - travelCfg.rStart) * t;
						if (travelCfg.isBead) {
							const beadScale = .72 + .45 * Math.sin(t * Math.PI);
							child.scale.set(beadScale, beadScale, beadScale);
						} else child.scale.set(r, r, Math.max(.15, r * .65));
						if (child.material instanceof MeshBasicMaterial) {
							const fade = Math.sin(t * Math.PI);
							child.material.opacity = travelCfg.baseOpacity * (.2 + .8 * fade);
						}
						continue;
					}
					if (child.userData.utBouncePulse) {
						const pulse = .5 + .5 * Math.sin(animTime * pulseRate * 1.15);
						const s = .85 + .35 * pulse;
						child.scale.set(s, s, s);
						if (child.material instanceof MeshBasicMaterial) child.material.opacity = .35 + .55 * pulse;
						continue;
					}
					if (child.material instanceof MeshStandardMaterial) {
						const baseOpacity = child.userData.baseOpacity || .55;
						child.material.opacity = baseOpacity + Math.sin(animTime * pulseRate + idx) * .14;
					}
				}
			}
			if (fluxLinesGroupRef.current && energizedRef.current) {
				const fluxPulseSpeed = 6 + magFieldRef.current * 2.4;
				fluxLinesGroupRef.current.children.forEach((line, idx) => {
					if (line instanceof Line && line.material instanceof LineBasicMaterial) {
						const baseOp = line.userData.baseOpacity ?? .5;
						line.material.opacity = Math.min(1, Math.max(.12, baseOp + Math.sin(elapsedTime * fluxPulseSpeed + idx) * .28));
					}
				});
			}
			renderer.render(scene, camera);
			if (isSoftwareGl) afterDraw(tick);
			else frameId = requestAnimationFrame(tick);
		};
		tick();
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width: w, height: h } = entry.contentRect;
				if (w > 0 && h > 0) {
					camera.aspect = w / h;
					camera.updateProjectionMatrix();
					renderer.setSize(w, h);
				}
			}
		});
		resizeObserver.observe(mount);
		const dom = renderer.domElement;
		const onPointerDown = (e) => {
			isDraggingRef.current = true;
			previousMousePositionRef.current = {
				x: e.clientX,
				y: e.clientY
			};
		};
		const onPointerMove = (e) => {
			if (!isDraggingRef.current) return;
			const deltaX = e.clientX - previousMousePositionRef.current.x;
			const deltaY = e.clientY - previousMousePositionRef.current.y;
			cameraSphericalRef.current.theta -= deltaX * .008;
			cameraSphericalRef.current.phi = Math.max(.1, Math.min(Math.PI / 2 - .05, cameraSphericalRef.current.phi - deltaY * .008));
			updateCameraPos();
			previousMousePositionRef.current = {
				x: e.clientX,
				y: e.clientY
			};
		};
		const onPointerUp = () => {
			isDraggingRef.current = false;
		};
		const onWheel = (e) => {
			e.preventDefault();
			cameraSphericalRef.current.radius = Math.max(8, Math.min(45, cameraSphericalRef.current.radius + e.deltaY * .02));
			updateCameraPos();
		};
		dom.addEventListener("pointerdown", onPointerDown);
		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
		dom.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			isDisposed = true;
			cancelAnimationFrame(frameId);
			clearTimeout(frameId);
			dom.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
			dom.removeEventListener("wheel", onWheel);
			dom.removeEventListener("webglcontextlost", onContextLost);
			dom.removeEventListener("webglcontextrestored", onContextRestored);
			resizeObserver.disconnect();
			disposeObjectTree(scene);
			scene.clear();
			renderer.dispose();
			if (mount.contains(dom)) mount.removeChild(dom);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const root = rootGroupRef.current;
		if (!root) return;
		while (root.children.length > 0) {
			const obj = root.children[0];
			root.remove(obj);
			disposeObjectTree(obj);
		}
		probeGroupRef.current = null;
		soundBeamRef.current = null;
		particlesGroupRef.current = null;
		fluxLinesGroupRef.current = null;
		defectMeshRef.current = null;
		const maxAnisotropy = rendererRef.current?.capabilities.getMaxAnisotropy?.() ?? 1;
		const extraDisposables = [];
		const clampedFreq = MathUtils.clamp(transducerFreqMHz, .5, 15);
		const clampedCrystalMm = MathUtils.clamp(crystalDiameterMm, 5, 28);
		const waveVelMs = blockType === "angle_weld" || blockType === "iiw_v1" && probePreset === "C" ? 3240 : 5920;
		const wavelengthMm = waveVelMs / (clampedFreq * 1e3);
		const nearFieldMm = clampedCrystalMm * clampedCrystalMm * clampedFreq / (4 * (waveVelMs / 1e3));
		const sinHalfSpread = Math.min(.62, .514 * wavelengthMm / clampedCrystalMm);
		const halfSpreadRad = Math.asin(sinHalfSpread);
		const probeScaleRatio = MathUtils.clamp(clampedCrystalMm / 12.7, .65, 1.65);
		const steelMaterial = new MeshStandardMaterial({
			color: 9741240,
			metalness: .85,
			roughness: .25,
			envMapIntensity: 1.2
		});
		const specimenSteelMaterial = new MeshStandardMaterial({
			color: 9741240,
			metalness: xrayActive ? .55 : .85,
			roughness: .25,
			envMapIntensity: 1.2,
			transparent: xrayActive,
			opacity: xrayActive ? .36 : 1,
			depthWrite: !xrayActive
		});
		const polishedSteelMaterial = new MeshStandardMaterial({
			color: 13751771,
			metalness: .95,
			roughness: .12,
			envMapIntensity: 1.5
		});
		const brassMaterial = new MeshStandardMaterial({
			color: 14251782,
			metalness: .85,
			roughness: .3
		});
		const perspexMaterial = new MeshStandardMaterial({
			color: 10875900,
			metalness: .1,
			roughness: .1,
			transparent: true,
			opacity: .75
		});
		const probeBodyMaterial = new MeshStandardMaterial({
			color: 988970,
			metalness: .4,
			roughness: .4
		});
		const probeWearPlateMaterial = new MeshStandardMaterial({
			color: 3718648,
			metalness: .9,
			roughness: .1
		});
		const cableMat = new MeshStandardMaterial({
			color: 1120295,
			roughness: .8
		});
		if (blockType === "iiw_v1") {
			const iiwGroup = new Group();
			const blockLength = 14;
			const blockHeight = 4.6;
			const blockDepth = 1.2;
			const slabGeo = new BoxGeometry(blockLength, blockHeight, blockDepth);
			const slabMesh = new Mesh(slabGeo, steelMaterial);
			slabMesh.castShadow = true;
			slabMesh.receiveShadow = true;
			iiwGroup.add(slabMesh);
			const arcGeo = new CylinderGeometry(blockHeight * .95, blockHeight * .95, blockDepth, 32, 1, false, -Math.PI / 2, Math.PI);
			arcGeo.rotateX(Math.PI / 2);
			const arcMesh = new Mesh(arcGeo, polishedSteelMaterial);
			arcMesh.position.set(-7, 0, 0);
			arcMesh.castShadow = true;
			iiwGroup.add(arcMesh);
			const sdhGeo = new CylinderGeometry(.12, .12, 1.3, 16);
			sdhGeo.rotateX(Math.PI / 2);
			const sdhMat = new MeshBasicMaterial({ color: 198418 });
			const sdhMesh = new Mesh(sdhGeo, sdhMat);
			sdhMesh.position.set(2.5, .8, 0);
			iiwGroup.add(sdhMesh);
			const perspexGeo = new CylinderGeometry(1.2, 1.2, 1.25, 32);
			perspexGeo.rotateX(Math.PI / 2);
			const perspexMesh = new Mesh(perspexGeo, perspexMaterial);
			perspexMesh.position.set(-2, -.6, 0);
			iiwGroup.add(perspexMesh);
			const stepCutGeo = new BoxGeometry(2.5, 1.2, 1.25);
			const stepCutMat = new MeshStandardMaterial({
				color: 4674921,
				metalness: .7,
				roughness: .4
			});
			const stepCutMesh = new Mesh(stepCutGeo, stepCutMat);
			stepCutMesh.position.set(5.5, -1.7, 0);
			iiwGroup.add(stepCutMesh);
			for (let deg = 40; deg <= 75; deg += 5) {
				const rad = deg * Math.PI / 180;
				const tickGeo = new BoxGeometry(.04, .35, 1.22);
				const tickMat = new MeshBasicMaterial({ color: 1976635 });
				const tickMesh = new Mesh(tickGeo, tickMat);
				const arcR = blockHeight * .95;
				tickMesh.position.set(-7 + Math.cos(rad) * arcR * .9, Math.sin(rad) * arcR * .9, 0);
				tickMesh.rotation.z = rad - Math.PI / 2;
				iiwGroup.add(tickMesh);
			}
			root.add(iiwGroup);
			const probeGroup = new Group();
			const probeRadius = .7 * probeScaleRatio;
			const probeCasingGeo = new CylinderGeometry(probeRadius, probeRadius, 1.4, 24);
			const probeCasingMesh = new Mesh(probeCasingGeo, probeBodyMaterial);
			probeGroup.add(probeCasingMesh);
			const wearPlateGeo = new CylinderGeometry(probeRadius * .97, probeRadius * .97, .15, 24);
			const wearPlateMesh = new Mesh(wearPlateGeo, probeWearPlateMaterial);
			wearPlateMesh.position.y = -.7;
			probeGroup.add(wearPlateMesh);
			const bncGeo = new CylinderGeometry(.25, .25, .6, 16);
			const bncMesh = new Mesh(bncGeo, brassMaterial);
			bncMesh.position.y = .9;
			probeGroup.add(bncMesh);
			const cableCurve = new CatmullRomCurve3([
				new Vector3(0, 1.2, 0),
				new Vector3(.5, 2, .5),
				new Vector3(2, 2.8, 1.5),
				new Vector3(3.5, 2.5, 3)
			]);
			const cableGeo = new TubeGeometry(cableCurve, 20, .08, 8, false);
			const cableMesh = new Mesh(cableGeo, cableMat);
			probeGroup.add(cableMesh);
			const couplantGeo = new RingGeometry(.1, probeRadius * 1.15, 24);
			couplantGeo.rotateX(-Math.PI / 2);
			const couplantMat = new MeshStandardMaterial({
				color: 3718648,
				transparent: true,
				opacity: .6,
				roughness: .1
			});
			const couplantMesh = new Mesh(couplantGeo, couplantMat);
			couplantMesh.position.y = -.78;
			probeGroup.add(couplantMesh);
			root.add(probeGroup);
			probeGroupRef.current = probeGroup;
			const beamGroup = new Group();
			const beamLen = 4.4;
			const nearStartR = Math.max(.14, probeRadius * .48);
			const farEndR = MathUtils.clamp(nearStartR + Math.tan(halfSpreadRad) * beamLen * 2.2, nearStartR + .08, 2.15);
			const beamGeo = new CylinderGeometry(nearStartR, farEndR, beamLen, 24, 1, true);
			beamGeo.translate(0, -4.4 / 2, 0);
			const nfSceneLen = MathUtils.clamp(nearFieldMm / 100 * beamLen, .35, beamLen * .85);
			const beamMat = createUltrasonicBeamShaderMaterial({
				coreColor: 3718648,
				outerColor: 165063,
				nearFieldColor: 11032055,
				freqMHz: clampedFreq,
				nearFieldFrac: MathUtils.clamp(nfSceneLen / beamLen, .08, .88),
				baseOpacity: .52,
				xrayActive
			});
			const beamMesh = new Mesh(beamGeo, beamMat);
			beamMesh.userData = { isUtBeamShader: true };
			beamMesh.renderOrder = 6;
			beamGroup.add(beamMesh);
			const nfGeo = new CylinderGeometry(nearStartR * .88, nearStartR * .95, nfSceneLen, 20, 1, true);
			nfGeo.translate(0, -nfSceneLen / 2, 0);
			const nfMat = createUltrasonicBeamShaderMaterial({
				coreColor: 12616956,
				outerColor: 8266446,
				nearFieldColor: 15235577,
				freqMHz: clampedFreq,
				nearFieldFrac: 1,
				baseOpacity: .42,
				isNearFieldZone: true,
				xrayActive
			});
			const nfMesh = new Mesh(nfGeo, nfMat);
			nfMesh.userData = { isUtBeamShader: true };
			nfMesh.renderOrder = 7;
			beamGroup.add(nfMesh);
			const wfTorusGeo = new TorusGeometry(1, .035, 8, 28);
			wfTorusGeo.rotateX(-Math.PI / 2);
			const wavefrontRingCount = Math.min(8, Math.max(4, Math.round(clampedFreq * 1.1)));
			const wfSpeed = .55 + clampedFreq * .07;
			for (let wIdx = 0; wIdx < wavefrontRingCount; wIdx++) {
				const wfMesh = new Mesh(wfTorusGeo, new MeshBasicMaterial({
					color: 6809849,
					transparent: true,
					opacity: .72,
					depthTest: false,
					depthWrite: false
				}));
				wfMesh.renderOrder = 8;
				wfMesh.userData = { utTravelWave: {
					startX: 0,
					startY: -.05,
					startZ: 0,
					endX: 0,
					endY: -4.4,
					endZ: 0,
					rStart: nearStartR * .92,
					rEnd: farEndR * .95,
					phaseOffset: wIdx / wavefrontRingCount,
					speed: wfSpeed,
					baseOpacity: .78
				} };
				beamGroup.add(wfMesh);
			}
			const rayGeo = new CylinderGeometry(.032, .032, beamLen, 8);
			rayGeo.translate(0, -4.4 / 2, 0);
			const rayMat = new MeshBasicMaterial({
				color: 14742270,
				transparent: true,
				opacity: .55,
				depthTest: false,
				depthWrite: false
			});
			const rayMesh = new Mesh(rayGeo, rayMat);
			rayMesh.renderOrder = 7;
			beamGroup.add(rayMesh);
			const impactRingGeo = new RingGeometry(.18, farEndR * .72, 24);
			impactRingGeo.rotateX(-Math.PI / 2);
			const impactRingMat = new MeshBasicMaterial({
				color: 3718648,
				transparent: true,
				opacity: .7,
				side: 2,
				depthTest: false,
				depthWrite: false
			});
			const impactRingMesh = new Mesh(impactRingGeo, impactRingMat);
			impactRingMesh.position.y = -4.4;
			impactRingMesh.renderOrder = 8;
			impactRingMesh.userData = { utBouncePulse: true };
			beamGroup.add(impactRingMesh);
			if (probePreset === "C") beamGroup.rotation.z = -probeAngleDeg * Math.PI / 180 * .45;
			probeGroup.add(beamGroup);
			soundBeamRef.current = beamGroup;
		} else if (blockType === "step_wedge") {
			const stepGroup = new Group();
			const stepHeights = [
				.8,
				1.6,
				2.4,
				3.2,
				4
			];
			const stepWidth = 2.4;
			const stepDepth = 2.8;
			stepHeights.forEach((h, idx) => {
				const xPos = (idx - 2) * stepWidth;
				const geo = new BoxGeometry(2.36, h, stepDepth);
				const mesh = new Mesh(geo, idx === selectedStep - 1 ? polishedSteelMaterial : steelMaterial);
				mesh.position.set(xPos, h / 2 - 2, 0);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				stepGroup.add(mesh);
				const labelGeo = new BoxGeometry(stepWidth * .7, .02, .4);
				const labelMat = new MeshBasicMaterial({ color: 988970 });
				const labelMesh = new Mesh(labelGeo, labelMat);
				labelMesh.position.set(xPos, h - 1.99, stepDepth / 2 - .35);
				stepGroup.add(labelMesh);
			});
			root.add(stepGroup);
			const probeGroup = new Group();
			const stepProbeR = .65 * probeScaleRatio;
			const probeCasingGeo = new CylinderGeometry(stepProbeR, stepProbeR, 1.2, 24);
			const probeCasingMesh = new Mesh(probeCasingGeo, probeBodyMaterial);
			probeGroup.add(probeCasingMesh);
			const wearPlateGeo = new CylinderGeometry(stepProbeR * .97, stepProbeR * .97, .12, 24);
			const wearPlateMesh = new Mesh(wearPlateGeo, probeWearPlateMaterial);
			wearPlateMesh.position.y = -.6;
			probeGroup.add(wearPlateMesh);
			const couplantGeo = new RingGeometry(.1, stepProbeR * 1.15, 24);
			couplantGeo.rotateX(-Math.PI / 2);
			const couplantMat = new MeshStandardMaterial({
				color: 3718648,
				transparent: true,
				opacity: .7,
				roughness: .1
			});
			const couplantMesh = new Mesh(couplantGeo, couplantMat);
			couplantMesh.position.y = -.66;
			probeGroup.add(couplantMesh);
			const currentH = stepHeights[selectedStep - 1] || .8;
			const xPos = (selectedStep - 1 - 2) * stepWidth;
			probeGroup.position.set(xPos, currentH - 2 + .66, 0);
			const beamGroup = new Group();
			const topR = Math.max(.16, stepProbeR * .52);
			const botR = MathUtils.clamp(topR + Math.tan(halfSpreadRad) * currentH * 2, topR + .04, 1.35);
			const beamGeo = new CylinderGeometry(topR, botR, currentH, 16);
			beamGeo.translate(0, -currentH / 2 - .66, 0);
			const beamMat = createUltrasonicBeamShaderMaterial({
				coreColor: 3718648,
				outerColor: 165063,
				nearFieldColor: 11032055,
				freqMHz: clampedFreq,
				nearFieldFrac: .35,
				baseOpacity: .56,
				xrayActive
			});
			const beamMesh = new Mesh(beamGeo, beamMat);
			beamMesh.userData = { isUtBeamShader: true };
			beamMesh.renderOrder = 6;
			beamGroup.add(beamMesh);
			const stepWfGeo = new TorusGeometry(1, .032, 8, 24);
			stepWfGeo.rotateX(-Math.PI / 2);
			const stepRingCount = Math.max(3, Math.round(currentH * 1.4));
			for (let wIdx = 0; wIdx < stepRingCount; wIdx++) {
				const ringMesh = new Mesh(stepWfGeo, new MeshBasicMaterial({
					color: 6809849,
					transparent: true,
					opacity: .72,
					depthTest: false,
					depthWrite: false
				}));
				ringMesh.renderOrder = 8;
				ringMesh.userData = { utTravelWave: {
					startX: 0,
					startY: -.68,
					startZ: 0,
					endX: 0,
					endY: -currentH - .66,
					endZ: 0,
					rStart: topR * .9,
					rEnd: botR * .96,
					phaseOffset: wIdx / stepRingCount,
					speed: .65 + clampedFreq * .06,
					baseOpacity: .78
				} };
				beamGroup.add(ringMesh);
			}
			const echoGeo = new RingGeometry(.1, botR * 1.05, 16);
			echoGeo.rotateX(-Math.PI / 2);
			const echoMat = new MeshBasicMaterial({
				color: 6809849,
				transparent: true,
				opacity: .75,
				side: 2,
				depthTest: false,
				depthWrite: false
			});
			const echoMesh = new Mesh(echoGeo, echoMat);
			echoMesh.position.y = -currentH - .66;
			echoMesh.renderOrder = 8;
			echoMesh.userData = { utBouncePulse: true };
			beamGroup.add(echoMesh);
			probeGroup.add(beamGroup);
			root.add(probeGroup);
			probeGroupRef.current = probeGroup;
			soundBeamRef.current = beamGroup;
		} else if (blockType === "angle_weld") {
			const weldGroup = new Group();
			const plateWidth = 14;
			const plateH = MathUtils.clamp(plateThicknessMm / 20 * 2.2, 1.1, 4.4);
			const plateDepth = 5;
			const plateGeo = new BoxGeometry(plateWidth, plateH, plateDepth);
			const plateMesh = new Mesh(plateGeo, specimenSteelMaterial);
			plateMesh.position.y = -plateH / 2;
			plateMesh.castShadow = !xrayActive;
			plateMesh.receiveShadow = true;
			weldGroup.add(plateMesh);
			const plateEdgesGeo = new EdgesGeometry(plateGeo);
			const plateEdgesMat = new LineBasicMaterial({
				color: xrayActive ? 3718648 : 3359061,
				transparent: true,
				opacity: xrayActive ? .55 : .3
			});
			const plateEdges = new LineSegments(plateEdgesGeo, plateEdgesMat);
			plateEdges.position.y = -plateH / 2;
			weldGroup.add(plateEdges);
			const capGeo = new CylinderGeometry(.8, 1.2, plateDepth, 16);
			capGeo.rotateZ(Math.PI / 2);
			capGeo.rotateY(Math.PI / 2);
			const weldMat = new MeshStandardMaterial({
				color: 6583435,
				roughness: .45,
				metalness: .75,
				transparent: xrayActive,
				opacity: xrayActive ? .42 : 1,
				depthWrite: !xrayActive
			});
			const weldCapMesh = new Mesh(capGeo, weldMat);
			weldCapMesh.position.set(0, .08, 0);
			weldGroup.add(weldCapMesh);
			const vGrooveShape = new BufferGeometry().setFromPoints([
				new Vector3(-1.15, 0, -5 / 2),
				new Vector3(-.2, -plateH, -5 / 2),
				new Vector3(.2, -plateH, -5 / 2),
				new Vector3(1.15, 0, -5 / 2),
				new Vector3(1.15, 0, plateDepth / 2),
				new Vector3(.2, -plateH, plateDepth / 2),
				new Vector3(-.2, -plateH, plateDepth / 2),
				new Vector3(-1.15, 0, plateDepth / 2)
			]);
			const vGrooveLine = new LineLoop(vGrooveShape, new LineBasicMaterial({
				color: 9741240,
				transparent: true,
				opacity: .35
			}));
			weldGroup.add(vGrooveLine);
			const rootBeadGeo = new CylinderGeometry(.35, .55, plateDepth, 16);
			rootBeadGeo.rotateX(Math.PI / 2);
			const rootBeadMesh = new Mesh(rootBeadGeo, weldMat);
			rootBeadMesh.position.set(0, -plateH, 0);
			weldGroup.add(rootBeadMesh);
			[-1.35, 1.35].forEach((xOff) => {
				const hazGeo = new BoxGeometry(.35, .03, plateDepth);
				const hazMat = new MeshBasicMaterial({
					color: 9584654,
					polygonOffset: true,
					polygonOffsetFactor: -1,
					polygonOffsetUnits: -1
				});
				const hazMesh = new Mesh(hazGeo, hazMat);
				hazMesh.position.set(xOff, .015, 0);
				weldGroup.add(hazMesh);
			});
			const crackGeo = new BoxGeometry(.22, .42, 1.2);
			const crackMat = new MeshStandardMaterial({
				color: defectDetected ? 15680580 : 8330525,
				emissive: defectDetected ? 15680580 : 3342336,
				emissiveIntensity: defectDetected ? 1.35 : .25
			});
			const crackMesh = new Mesh(crackGeo, crackMat);
			crackMesh.position.set(0, -plateH + .24, 0);
			weldGroup.add(crackMesh);
			defectMeshRef.current = crackMesh;
			if (wireframesVisible && detectedWireframeOverlays.length > 0) {
				const wireframeOverlayGroup = new Group();
				detectedWireframeOverlays.forEach((ov, idx) => {
					const hexColor = getSeverityHex(ov.severity, ov.isLiveActive);
					const cssColor = getSeverityCssColor(ov.severity, ov.isLiveActive);
					const xScene = MathUtils.clamp(ov.xMm / 10, -5.2, 5.2);
					const zScene = MathUtils.clamp((ov.yMm - 50) / 10, -1.9, plateDepth * .38);
					const depthRatio = MathUtils.clamp(ov.calculatedDepthMm / Math.max(1, plateThicknessMm), 0, 1.15);
					const targetDepthY = -depthRatio * plateH;
					const lengthScene = MathUtils.clamp(ov.calculatedLengthMm / 10, .36, plateDepth * .88);
					const heightScene = MathUtils.clamp(ov.heightMm / Math.max(1, plateThicknessMm) * plateH, .22, plateH * .55);
					const widthScene = MathUtils.clamp(ov.transverseWidthMm / 10, .26, 1.8);
					const boxCenterY = MathUtils.clamp(targetDepthY + (depthRatio >= .88 ? heightScene * .45 : 0), -plateH + heightScene * .45, -heightScene * .45);
					const flawBoxGeo = new BoxGeometry(widthScene, heightScene, lengthScene, 2, 1, 3);
					const flawLatticeMat = new MeshBasicMaterial({
						color: hexColor,
						wireframe: true,
						transparent: true,
						opacity: ov.isLiveActive ? .52 : .34,
						depthTest: false,
						depthWrite: false
					});
					const flawLatticeMesh = new Mesh(flawBoxGeo, flawLatticeMat);
					flawLatticeMesh.position.set(xScene, boxCenterY, zScene);
					flawLatticeMesh.renderOrder = 11;
					wireframeOverlayGroup.add(flawLatticeMesh);
					const flawEdgesGeo = new EdgesGeometry(new BoxGeometry(widthScene, heightScene, lengthScene));
					const flawEdgesMat = new LineBasicMaterial({
						color: hexColor,
						transparent: true,
						opacity: .98,
						depthTest: false,
						depthWrite: false
					});
					const flawEdges = new LineSegments(flawEdgesGeo, flawEdgesMat);
					flawEdges.position.set(xScene, boxCenterY, zScene);
					flawEdges.renderOrder = 12;
					wireframeOverlayGroup.add(flawEdges);
					const surfY = .035;
					const halfW = widthScene / 2;
					const halfL = lengthScene / 2;
					const topBoxY = boxCenterY + heightScene / 2;
					const footprintPts = [
						new Vector3(xScene - halfW, surfY, zScene - halfL),
						new Vector3(xScene + halfW, surfY, zScene - halfL),
						new Vector3(xScene + halfW, surfY, zScene + halfL),
						new Vector3(xScene - halfW, surfY, zScene + halfL)
					];
					const footprintGeo = new BufferGeometry().setFromPoints(footprintPts);
					const footprintLoop = new LineLoop(footprintGeo, new LineBasicMaterial({
						color: hexColor,
						transparent: true,
						opacity: .85,
						depthTest: false
					}));
					footprintLoop.renderOrder = 12;
					wireframeOverlayGroup.add(footprintLoop);
					const dropVertices = [];
					[
						[-halfW, -halfL],
						[halfW, -halfL],
						[halfW, halfL],
						[-halfW, halfL]
					].forEach(([dx, dz]) => {
						dropVertices.push(new Vector3(xScene + dx, surfY, zScene + dz), new Vector3(xScene + dx, topBoxY, zScene + dz));
					});
					const dropLinesGeo = new BufferGeometry().setFromPoints(dropVertices);
					const dropLines = new LineSegments(dropLinesGeo, new LineBasicMaterial({
						color: 9741240,
						transparent: true,
						opacity: .55,
						depthTest: false
					}));
					dropLines.renderOrder = 10;
					wireframeOverlayGroup.add(dropLines);
					if (idx < 3) {
						const caliperOffsetX = xScene + halfW + .55 + idx * .45;
						const depthTick = .18;
						const depthCaliperPts = [
							new Vector3(caliperOffsetX - depthTick, 0, zScene),
							new Vector3(caliperOffsetX + depthTick, 0, zScene),
							new Vector3(caliperOffsetX, 0, zScene),
							new Vector3(caliperOffsetX, targetDepthY, zScene),
							new Vector3(caliperOffsetX - depthTick, targetDepthY, zScene),
							new Vector3(caliperOffsetX + depthTick, targetDepthY, zScene),
							new Vector3(xScene + halfW, targetDepthY, zScene),
							new Vector3(caliperOffsetX, targetDepthY, zScene)
						];
						const depthCaliperGeo = new BufferGeometry().setFromPoints(depthCaliperPts);
						const depthCaliperLines = new LineSegments(depthCaliperGeo, new LineBasicMaterial({
							color: 3718648,
							transparent: true,
							opacity: .95,
							depthTest: false
						}));
						depthCaliperLines.renderOrder = 14;
						wireframeOverlayGroup.add(depthCaliperLines);
						const lenOffsetY = boxCenterY - heightScene / 2 - .28;
						const lenTick = .16;
						const lengthCaliperPts = [
							new Vector3(xScene, lenOffsetY - lenTick, zScene - halfL),
							new Vector3(xScene, lenOffsetY + lenTick, zScene - halfL),
							new Vector3(xScene, lenOffsetY, zScene - halfL),
							new Vector3(xScene, lenOffsetY, zScene + halfL),
							new Vector3(xScene, lenOffsetY - lenTick, zScene + halfL),
							new Vector3(xScene, lenOffsetY + lenTick, zScene + halfL)
						];
						const lengthCaliperGeo = new BufferGeometry().setFromPoints(lengthCaliperPts);
						const lengthCaliperLines = new LineSegments(lengthCaliperGeo, new LineBasicMaterial({
							color: 16498468,
							transparent: true,
							opacity: .95,
							depthTest: false
						}));
						lengthCaliperLines.renderOrder = 14;
						wireframeOverlayGroup.add(lengthCaliperLines);
						const badgeSprite = createDimensionCalloutSprite(`${ov.codeSymbol} · Z: ${ov.calculatedDepthMm.toFixed(1)} mm`, `Length L: ${ov.calculatedLengthMm.toFixed(1)} mm`, cssColor, maxAnisotropy, extraDisposables);
						badgeSprite.position.set(caliperOffsetX + 1.45, MathUtils.clamp(targetDepthY * .55, -plateH + .3, -.35), zScene);
						wireframeOverlayGroup.add(badgeSprite);
					}
				});
				weldGroup.add(wireframeOverlayGroup);
			}
			root.add(weldGroup);
			const probeGroup = new Group();
			const wedgeW = 1.8 * Math.max(.85, probeScaleRatio * .95);
			const wedgeGeo = new BoxGeometry(wedgeW, 1.2, 1.4 * Math.max(.85, probeScaleRatio * .95));
			const wedgeMat = new MeshStandardMaterial({
				color: 12248829,
				transparent: true,
				opacity: .8,
				roughness: .15
			});
			const wedgeMesh = new Mesh(wedgeGeo, wedgeMat);
			wedgeMesh.position.y = .6;
			probeGroup.add(wedgeMesh);
			const refractedClampedDeg = MathUtils.clamp(probeAngleDeg, 0, 78);
			const refractedRad = refractedClampedDeg * Math.PI / 180;
			const incidentPerspexRad = Math.asin(Math.min(.94, 2330 / 3240 * Math.sin(refractedRad)));
			const crystalGeo = new BoxGeometry(.85 * probeScaleRatio, .22, 1 * probeScaleRatio);
			crystalGeo.rotateZ(-incidentPerspexRad);
			const crystalMesh = new Mesh(crystalGeo, probeBodyMaterial);
			crystalMesh.position.set(-.28, 1.18, 0);
			probeGroup.add(crystalMesh);
			const cableGeo = new CylinderGeometry(.06, .06, 2, 8);
			cableGeo.rotateZ(Math.PI / 4);
			const cableMesh = new Mesh(cableGeo, cableMat);
			cableMesh.position.set(-1, 2, 0);
			probeGroup.add(cableMesh);
			root.add(probeGroup);
			probeGroupRef.current = probeGroup;
			const beamGroup = new Group();
			const leg1X = Math.tan(refractedRad) * plateH;
			const startVec = new Vector3(0, 0, 0);
			const bounceVec = new Vector3(leg1X, -plateH, 0);
			const fullSkipVec = new Vector3(leg1X * 2, 0, 0);
			const leg1Length = startVec.distanceTo(bounceVec);
			const coreRadiusStart = Math.max(.06, .09 * probeScaleRatio);
			const coneRadiusBounce = MathUtils.clamp(coreRadiusStart + Math.tan(halfSpreadRad) * leg1Length * 1.85, coreRadiusStart + .04, .95);
			const coneRadiusFullSkip = MathUtils.clamp(coneRadiusBounce + Math.tan(halfSpreadRad) * leg1Length * 1.65, coneRadiusBounce + .04, 1.45);
			const wedgeStartVec = new Vector3(-.28, 1.12, 0);
			const wedgeRayPath = new LineCurve3(wedgeStartVec, startVec);
			const wedgeRayGeo = new TubeGeometry(wedgeRayPath, 6, .032, 8, false);
			const wedgeRayMat = new MeshBasicMaterial({
				color: 6809849,
				transparent: true,
				opacity: .72,
				depthTest: false,
				depthWrite: false
			});
			const wedgeRayMesh = new Mesh(wedgeRayGeo, wedgeRayMat);
			wedgeRayMesh.renderOrder = 7;
			beamGroup.add(wedgeRayMesh);
			const leg1Path = new LineCurve3(startVec, bounceVec);
			const leg1Geo = new TubeGeometry(leg1Path, 10, .04, 8, false);
			const beamMat = new MeshBasicMaterial({
				color: defectDetected ? 16498468 : 8246268,
				transparent: true,
				opacity: .68,
				depthTest: false,
				depthWrite: false
			});
			const leg1Mesh = new Mesh(leg1Geo, beamMat);
			leg1Mesh.renderOrder = 7;
			beamGroup.add(leg1Mesh);
			const leg1Mid = startVec.clone().add(bounceVec).multiplyScalar(.5);
			const leg1Dir = bounceVec.clone().sub(startVec).normalize();
			const nfRatioOnLeg1 = MathUtils.clamp(nearFieldMm / Math.max(12, plateThicknessMm * 2.2), .12, .85);
			const leg1ConeGeo = new CylinderGeometry(coreRadiusStart, coneRadiusBounce, Math.max(.2, leg1Length), 24, 1, true);
			const coneEnvelopeMat = createUltrasonicBeamShaderMaterial({
				coreColor: defectDetected ? 16498468 : 3718648,
				outerColor: defectDetected ? 14251782 : 165063,
				nearFieldColor: 11032055,
				freqMHz: clampedFreq,
				nearFieldFrac: nfRatioOnLeg1,
				baseOpacity: .56,
				phaseOffset: 0,
				isDetected: defectDetected,
				xrayActive
			});
			const leg1ConeMesh = new Mesh(leg1ConeGeo, coneEnvelopeMat);
			leg1ConeMesh.position.copy(leg1Mid);
			leg1ConeMesh.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), leg1Dir);
			leg1ConeMesh.userData = { isUtBeamShader: true };
			leg1ConeMesh.renderOrder = 6;
			beamGroup.add(leg1ConeMesh);
			const nfLen3D = leg1Length * nfRatioOnLeg1;
			const nfEndVec = startVec.clone().add(leg1Dir.clone().multiplyScalar(nfLen3D));
			const nfMidVec = startVec.clone().add(nfEndVec).multiplyScalar(.5);
			const nfAngleGeo = new CylinderGeometry(coreRadiusStart * .95, MathUtils.lerp(coreRadiusStart, coneRadiusBounce, nfRatioOnLeg1), Math.max(.15, nfLen3D), 20, 1, true);
			const nfAngleMat = createUltrasonicBeamShaderMaterial({
				coreColor: 12616956,
				outerColor: 8266446,
				nearFieldColor: 15235577,
				freqMHz: clampedFreq,
				nearFieldFrac: 1,
				baseOpacity: .42,
				isNearFieldZone: true,
				isDetected: defectDetected,
				xrayActive
			});
			const nfAngleMesh = new Mesh(nfAngleGeo, nfAngleMat);
			nfAngleMesh.position.copy(nfMidVec);
			nfAngleMesh.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), leg1Dir);
			nfAngleMesh.userData = { isUtBeamShader: true };
			nfAngleMesh.renderOrder = 7;
			beamGroup.add(nfAngleMesh);
			const zAxisUnit = new Vector3(0, 0, 1);
			const leg1RingQuat = new Quaternion().setFromUnitVectors(zAxisUnit, leg1Dir);
			const angleWfTorusGeo = new TorusGeometry(1, .042, 8, 28);
			const anglePulseBeadGeo = new SphereGeometry(.085, 10, 10);
			const legWaveCount = Math.min(7, Math.max(4, Math.round(clampedFreq * .9)));
			const angleWaveSpeed = .58 + clampedFreq * .065;
			for (let wIdx = 0; wIdx < legWaveCount; wIdx++) {
				const ringMesh = new Mesh(angleWfTorusGeo, new MeshBasicMaterial({
					color: defectDetected ? 16639626 : 6809849,
					transparent: true,
					opacity: .82,
					depthTest: false,
					depthWrite: false
				}));
				ringMesh.quaternion.copy(leg1RingQuat);
				ringMesh.renderOrder = 8;
				ringMesh.userData = { utTravelWave: {
					startX: startVec.x,
					startY: startVec.y,
					startZ: startVec.z,
					endX: bounceVec.x,
					endY: bounceVec.y,
					endZ: bounceVec.z,
					rStart: coreRadiusStart * .9,
					rEnd: coneRadiusBounce * .94,
					phaseOffset: wIdx / legWaveCount,
					speed: angleWaveSpeed,
					baseOpacity: .85
				} };
				beamGroup.add(ringMesh);
			}
			for (let bIdx = 0; bIdx < 2; bIdx++) {
				const bead = new Mesh(anglePulseBeadGeo, new MeshBasicMaterial({
					color: 16317180,
					transparent: true,
					opacity: .92,
					depthTest: false,
					depthWrite: false
				}));
				bead.renderOrder = 9;
				bead.userData = { utTravelWave: {
					startX: startVec.x,
					startY: startVec.y,
					startZ: startVec.z,
					endX: bounceVec.x,
					endY: bounceVec.y,
					endZ: bounceVec.z,
					rStart: 1,
					rEnd: 1,
					phaseOffset: bIdx * .5,
					speed: angleWaveSpeed,
					baseOpacity: .94,
					isBead: true
				} };
				beamGroup.add(bead);
			}
			const wedgeBead = new Mesh(anglePulseBeadGeo, new MeshBasicMaterial({
				color: 6809849,
				transparent: true,
				opacity: .9,
				depthTest: false,
				depthWrite: false
			}));
			wedgeBead.renderOrder = 9;
			wedgeBead.userData = { utTravelWave: {
				startX: wedgeStartVec.x,
				startY: wedgeStartVec.y,
				startZ: wedgeStartVec.z,
				endX: startVec.x,
				endY: startVec.y,
				endZ: startVec.z,
				rStart: 1,
				rEnd: 1,
				phaseOffset: .15,
				speed: angleWaveSpeed * 1.4,
				baseOpacity: .9,
				isBead: true
			} };
			beamGroup.add(wedgeBead);
			const bottomBounceGeo = new RingGeometry(.08, Math.max(.28, coneRadiusBounce * 1.15), 24);
			bottomBounceGeo.rotateX(-Math.PI / 2);
			const bottomBounceMat = new MeshBasicMaterial({
				color: defectDetected ? 16498468 : 3718648,
				transparent: true,
				opacity: .78,
				side: 2,
				depthTest: false,
				depthWrite: false
			});
			const bottomBounceMesh = new Mesh(bottomBounceGeo, bottomBounceMat);
			bottomBounceMesh.position.copy(bounceVec);
			bottomBounceMesh.renderOrder = 8;
			bottomBounceMesh.userData = { utBouncePulse: true };
			beamGroup.add(bottomBounceMesh);
			if (refractedClampedDeg > 5) {
				const leg2Path = new LineCurve3(bounceVec, fullSkipVec);
				const leg2Geo = new TubeGeometry(leg2Path, 10, .036, 8, false);
				const leg2Mesh = new Mesh(leg2Geo, beamMat);
				leg2Mesh.renderOrder = 7;
				beamGroup.add(leg2Mesh);
				const leg2Mid = bounceVec.clone().add(fullSkipVec).multiplyScalar(.5);
				const leg2Dir = fullSkipVec.clone().sub(bounceVec).normalize();
				const leg2ConeGeo = new CylinderGeometry(coneRadiusBounce, coneRadiusFullSkip, Math.max(.2, leg1Length), 24, 1, true);
				const leg2ConeMat = createUltrasonicBeamShaderMaterial({
					coreColor: defectDetected ? 16096779 : 3718648,
					outerColor: defectDetected ? 11817737 : 223649,
					nearFieldColor: 8490232,
					freqMHz: clampedFreq,
					nearFieldFrac: .05,
					baseOpacity: .44,
					phaseOffset: Math.PI * .75,
					isDetected: defectDetected,
					xrayActive
				});
				const leg2ConeMesh = new Mesh(leg2ConeGeo, leg2ConeMat);
				leg2ConeMesh.position.copy(leg2Mid);
				leg2ConeMesh.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), leg2Dir);
				leg2ConeMesh.userData = { isUtBeamShader: true };
				leg2ConeMesh.renderOrder = 6;
				beamGroup.add(leg2ConeMesh);
				const leg2RingQuat = new Quaternion().setFromUnitVectors(zAxisUnit, leg2Dir);
				for (let wIdx = 0; wIdx < legWaveCount; wIdx++) {
					const ringMesh2 = new Mesh(angleWfTorusGeo, new MeshBasicMaterial({
						color: defectDetected ? 16498468 : 3718648,
						transparent: true,
						opacity: .68,
						depthTest: false,
						depthWrite: false
					}));
					ringMesh2.quaternion.copy(leg2RingQuat);
					ringMesh2.renderOrder = 8;
					ringMesh2.userData = { utTravelWave: {
						startX: bounceVec.x,
						startY: bounceVec.y,
						startZ: bounceVec.z,
						endX: fullSkipVec.x,
						endY: fullSkipVec.y,
						endZ: fullSkipVec.z,
						rStart: coneRadiusBounce * .92,
						rEnd: coneRadiusFullSkip * .95,
						phaseOffset: (wIdx + .5) / legWaveCount,
						speed: angleWaveSpeed,
						baseOpacity: .68
					} };
					beamGroup.add(ringMesh2);
				}
				const leg2Bead = new Mesh(anglePulseBeadGeo, new MeshBasicMaterial({
					color: 16707722,
					transparent: true,
					opacity: .85,
					depthTest: false,
					depthWrite: false
				}));
				leg2Bead.renderOrder = 9;
				leg2Bead.userData = { utTravelWave: {
					startX: bounceVec.x,
					startY: bounceVec.y,
					startZ: bounceVec.z,
					endX: fullSkipVec.x,
					endY: fullSkipVec.y,
					endZ: fullSkipVec.z,
					rStart: 1,
					rEnd: 1,
					phaseOffset: .25,
					speed: angleWaveSpeed,
					baseOpacity: .85,
					isBead: true
				} };
				beamGroup.add(leg2Bead);
			}
			if (defectDetected) {
				for (let eIdx = 0; eIdx < 3; eIdx++) {
					const echoRing = new Mesh(angleWfTorusGeo, new MeshBasicMaterial({
						color: 1096065,
						transparent: true,
						opacity: .88,
						depthTest: false,
						depthWrite: false
					}));
					echoRing.quaternion.copy(leg1RingQuat);
					echoRing.renderOrder = 9;
					echoRing.userData = { utTravelWave: {
						startX: bounceVec.x,
						startY: bounceVec.y,
						startZ: bounceVec.z,
						endX: startVec.x,
						endY: startVec.y,
						endZ: startVec.z,
						rStart: coneRadiusBounce * .68,
						rEnd: coreRadiusStart * 1.15,
						phaseOffset: eIdx / 3,
						speed: angleWaveSpeed * 1.15,
						baseOpacity: .88
					} };
					beamGroup.add(echoRing);
				}
				const scatterRing = new Mesh(angleWfTorusGeo, new MeshBasicMaterial({
					color: 3462041,
					transparent: true,
					opacity: .9,
					depthTest: false,
					depthWrite: false
				}));
				scatterRing.rotation.x = Math.PI / 2;
				scatterRing.renderOrder = 9;
				scatterRing.userData = { utTravelWave: {
					startX: bounceVec.x,
					startY: bounceVec.y + .18,
					startZ: bounceVec.z,
					endX: bounceVec.x,
					endY: bounceVec.y + .18,
					endZ: bounceVec.z,
					rStart: .18,
					rEnd: Math.max(.65, coneRadiusBounce * 1.25),
					phaseOffset: 0,
					speed: angleWaveSpeed * 1.35,
					baseOpacity: .9
				} };
				beamGroup.add(scatterRing);
			}
			probeGroup.add(beamGroup);
			soundBeamRef.current = beamGroup;
		} else if (blockType === "mt_yoke") {
			const mtGroup = new Group();
			const clampedFieldKaM = MathUtils.clamp(magneticFieldKaM, 0, 6.5);
			const clampedYokeSpacingMm = MathUtils.clamp(yokePoleSpacingMm, 75, 200);
			const poleHalfSpan = MathUtils.clamp(clampedYokeSpacingMm / 40, 1.85, 5);
			const plateGeo = new BoxGeometry(12.5, 1.5, 8);
			const plateMesh = new Mesh(plateGeo, specimenSteelMaterial);
			plateMesh.position.y = -.75;
			plateMesh.castShadow = !xrayActive;
			plateMesh.receiveShadow = true;
			mtGroup.add(plateMesh);
			const crackLength = 2.4;
			const crackWidth = .08;
			const crackRotRad = (crackAngleDeg - 90) * Math.PI / 180;
			const crackGeo = new BoxGeometry(crackLength, .16, crackWidth);
			crackGeo.rotateY(crackRotRad);
			const crackMat = new MeshBasicMaterial({ color: 592139 });
			const crackMesh = new Mesh(crackGeo, crackMat);
			crackMesh.position.set(0, -.04, 0);
			mtGroup.add(crackMesh);
			if (wireframesVisible && detectedWireframeOverlays.length > 0) {
				const mtWireGroup = new Group();
				const activeMt = detectedWireframeOverlays[0];
				const lenScene = MathUtils.clamp(activeMt.calculatedLengthMm / 10, .4, 3.2);
				const subDepthScene = MathUtils.clamp(activeMt.heightMm / 10, .15, .5);
				const cssCol = getSeverityCssColor(activeMt.severity, activeMt.isLiveActive);
				const hexCol = getSeverityHex(activeMt.severity, activeMt.isLiveActive);
				const wfHolder = new Group();
				wfHolder.rotation.y = crackRotRad;
				const boxG = new BoxGeometry(lenScene, subDepthScene, .24, 3, 1, 1);
				const wfMesh = new Mesh(boxG, new MeshBasicMaterial({
					color: hexCol,
					wireframe: true,
					transparent: true,
					opacity: .48,
					depthTest: false
				}));
				wfMesh.position.set(0, -subDepthScene / 2 + .03, 0);
				wfMesh.renderOrder = 11;
				wfHolder.add(wfMesh);
				const edgeG = new EdgesGeometry(new BoxGeometry(lenScene, subDepthScene, .24));
				const edgeSeg = new LineSegments(edgeG, new LineBasicMaterial({
					color: hexCol,
					transparent: true,
					opacity: .98,
					depthTest: false
				}));
				edgeSeg.position.set(0, -subDepthScene / 2 + .03, 0);
				edgeSeg.renderOrder = 12;
				wfHolder.add(edgeSeg);
				const halfL = lenScene / 2;
				const calZ = .42;
				const calY = .06;
				const mtCalPts = [
					new Vector3(-halfL, calY, .27999999999999997),
					new Vector3(-halfL, calY, .56),
					new Vector3(-halfL, calY, calZ),
					new Vector3(halfL, calY, calZ),
					new Vector3(halfL, calY, .27999999999999997),
					new Vector3(halfL, calY, .56)
				];
				const mtCalLine = new LineSegments(new BufferGeometry().setFromPoints(mtCalPts), new LineBasicMaterial({
					color: 16498468,
					depthTest: false
				}));
				mtCalLine.renderOrder = 14;
				wfHolder.add(mtCalLine);
				mtWireGroup.add(wfHolder);
				const mtSprite = createDimensionCalloutSprite(`${activeMt.codeSymbol} · Z: ${activeMt.calculatedDepthMm.toFixed(1)} mm`, `Length L: ${activeMt.calculatedLengthMm.toFixed(1)} mm`, cssCol, maxAnisotropy, extraDisposables);
				mtSprite.position.set(0, 1.05, 1.35);
				mtWireGroup.add(mtSprite);
				mtGroup.add(mtWireGroup);
			}
			const yokeGroup = new Group();
			const handleGeo = new BoxGeometry(poleHalfSpan * 2 + 1, 1.4, 1.6);
			const handleMat = new MeshStandardMaterial({
				color: mtCurrentMode === "HWDC" ? 11817737 : 14427686,
				roughness: .55,
				metalness: .25
			});
			const handleMesh = new Mesh(handleGeo, handleMat);
			handleMesh.position.y = 4.2;
			yokeGroup.add(handleMesh);
			const triggerGeo = new BoxGeometry(.8, .4, .4);
			const triggerMat = new MeshBasicMaterial({ color: isYokeEnergized && clampedFieldKaM > .2 ? 2278750 : 1579035 });
			const triggerMesh = new Mesh(triggerGeo, triggerMat);
			triggerMesh.position.set(0, 3.4, .7);
			yokeGroup.add(triggerMesh);
			[-poleHalfSpan, poleHalfSpan].forEach((xLeg, idx) => {
				const legGeo = new BoxGeometry(1.2, 3.6, 1.4);
				const legMesh = new Mesh(legGeo, steelMaterial);
				legMesh.position.set(xLeg, 2, 0);
				yokeGroup.add(legMesh);
				const footGeo = new BoxGeometry(1.6, .4, 1.6);
				const footMesh = new Mesh(footGeo, polishedSteelMaterial);
				footMesh.position.set(xLeg, .2, 0);
				yokeGroup.add(footMesh);
				const poleLabelGeo = new BoxGeometry(.6, .6, .02);
				const poleLabelMat = new MeshBasicMaterial({ color: idx === 0 ? 3900150 : 15680580 });
				const poleLabelMesh = new Mesh(poleLabelGeo, poleLabelMat);
				poleLabelMesh.position.set(xLeg, 2.5, .71);
				yokeGroup.add(poleLabelMesh);
			});
			mtGroup.add(yokeGroup);
			root.add(mtGroup);
			const fluxGroup = new Group();
			if (isYokeEnergized && clampedFieldKaM > .15) {
				const halfLineSteps = Math.max(1, Math.min(6, Math.round(clampedFieldKaM)));
				const archPeakY = .48 + clampedFieldKaM / 6.5 * .92;
				const primaryFluxHex = mtCurrentMode === "HWDC" ? 16096779 : 3718648;
				const baseFluxOpacity = MathUtils.clamp(.28 + clampedFieldKaM / 6.5 * .58, .25, .92);
				for (let i = -halfLineSteps; i <= halfLineSteps; i++) {
					const zOffset = i / Math.max(1, halfLineSteps) * 2.15;
					const points = new QuadraticBezierCurve3(new Vector3(-(poleHalfSpan - .2), .24, zOffset), new Vector3(0, archPeakY, zOffset * 1.28), new Vector3(poleHalfSpan - .2, .24, zOffset)).getPoints(28);
					const fluxGeo = new BufferGeometry().setFromPoints(points);
					const fluxLineMat = new LineBasicMaterial({
						color: primaryFluxHex,
						transparent: true,
						opacity: baseFluxOpacity
					});
					const fluxLine = new Line(fluxGeo, fluxLineMat);
					fluxLine.userData = { baseOpacity: baseFluxOpacity };
					fluxGroup.add(fluxLine);
					if (mtCurrentMode === "HWDC" && Math.abs(i) <= 2) {
						const subCurve = new QuadraticBezierCurve3(new Vector3(-(poleHalfSpan - .2), -.05, zOffset * .75), new Vector3(0, -.68, zOffset * .85), new Vector3(poleHalfSpan - .2, -.05, zOffset * .75));
						const subGeo = new BufferGeometry().setFromPoints(subCurve.getPoints(22));
						const subMat = new LineBasicMaterial({
							color: 16498468,
							transparent: true,
							opacity: baseFluxOpacity * .75,
							depthTest: false
						});
						const subLine = new Line(subGeo, subMat);
						subLine.userData = { baseOpacity: baseFluxOpacity * .75 };
						fluxGroup.add(subLine);
					}
				}
			}
			root.add(fluxGroup);
			fluxLinesGroupRef.current = fluxGroup;
			const particlesGroup = new Group();
			if (areParticlesApplied) {
				const fieldFactor = isYokeEnergized ? MathUtils.clamp(clampedFieldKaM / 3.6, .05, 1.55) : .04;
				const orientationFactor = Math.sin(crackAngleDeg * Math.PI / 180);
				const fluxLeakageStrength = MathUtils.clamp(fieldFactor * orientationFactor, .03, 1.35);
				const particleCount = Math.round(260 + Math.min(620, clampedFieldKaM * 95));
				const pGeo = new BufferGeometry();
				const pPositions = new Float32Array(particleCount * 3);
				for (let i = 0; i < particleCount; i++) {
					let px = 0;
					let py = .03;
					let pz = 0;
					const clusterProb = Math.min(.92, fluxLeakageStrength * .78);
					if (Math.random() < clusterProb) {
						const t = (Math.random() - .5) * crackLength;
						const spread = (Math.random() - .5) * Math.max(.05, .16 * (1.25 - Math.min(1, fluxLeakageStrength)));
						px = t * Math.cos(crackRotRad) - spread * Math.sin(crackRotRad);
						pz = t * Math.sin(crackRotRad) + spread * Math.cos(crackRotRad);
						py = .03 + Math.min(.11, fluxLeakageStrength * .06 * Math.random());
					} else {
						px = (Math.random() - .5) * (poleHalfSpan * 1.9);
						pz = (Math.random() - .5) * 4.2;
					}
					pPositions[i * 3] = px;
					pPositions[i * 3 + 1] = py;
					pPositions[i * 3 + 2] = pz;
				}
				pGeo.setAttribute("position", new BufferAttribute(pPositions, 3));
				const hasAdequateField = isYokeEnergized && clampedFieldKaM >= 2.4 && orientationFactor > .5;
				const pMat = new PointsMaterial({
					color: hasAdequateField ? 2278750 : isYokeEnergized && clampedFieldKaM >= 1.2 ? 16498468 : 3359061,
					size: hasAdequateField ? .13 : .1
				});
				const particlesMesh = new Points(pGeo, pMat);
				particlesGroup.add(particlesMesh);
			}
			root.add(particlesGroup);
			particlesGroupRef.current = particlesGroup;
		}
		return () => {
			extraDisposables.forEach((d) => d.dispose());
		};
	}, [
		blockType,
		probePreset,
		selectedStep,
		probeAngleDeg,
		plateThicknessMm,
		transducerFreqMHz,
		crystalDiameterMm,
		isYokeEnergized,
		areParticlesApplied,
		crackAngleDeg,
		magneticFieldKaM,
		yokePoleSpacingMm,
		mtCurrentMode,
		defectDetected,
		detectedWireframeOverlays,
		wireframesVisible,
		xrayActive
	]);
	(0, import_react.useEffect)(() => {
		const probe = probeGroupRef.current;
		if (!probe) return;
		if (blockType === "iiw_v1") {
			if (probePreset === "A") {
				probe.position.set(4.5, 3.08, 0);
				probe.rotation.set(0, 0, 0);
			} else if (probePreset === "B") {
				probe.position.set(-1, 3.08, 0);
				probe.rotation.set(0, 0, 0);
			} else if (probePreset === "C") {
				probe.position.set(-1.8, 3.08, 0);
				probe.rotation.set(0, 0, -probeAngleDeg * Math.PI / 180 / 4);
			} else if (probePreset === "D") {
				probe.position.set(2.5, 3.08, 0);
				probe.rotation.set(0, 0, 0);
			}
		} else if (blockType === "angle_weld") {
			const xStandoff = -(probePositionMm / 10);
			probe.position.set(xStandoff, 0, 0);
		}
	}, [
		blockType,
		probePreset,
		probePositionMm,
		probeAngleDeg
	]);
	const supportsDefectWireframe = blockType === "angle_weld" || blockType === "mt_yoke";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full min-h-[380px] sm:min-h-[460px] bg-[#070a1a] rounded-2xl overflow-hidden border border-[#1e293b] select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: mountRef,
				className: "w-full h-full cursor-grab active:cursor-grabbing"
			}),
			webglUnavailable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 flex items-center justify-center bg-[#070a1a]/95 p-6 text-center text-xs font-mono text-slate-300 pointer-events-none",
				children: [
					"2D Schematic Fallback Active · Probe X=",
					probePositionMm,
					"mm · ∠",
					probeAngleDeg,
					"°"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "three-scene-live-telemetry",
				className: "absolute top-3 left-3 flex flex-col gap-0.5 bg-[#060916]/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono tabular-nums pointer-events-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "محاكاة ثلاثية الأبعاد 3D · اسحب للتدوير / العجلة للتكبير" : "Interactive 3D Viewport · Drag to Orbit / Scroll to Zoom" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-cyan-300 font-bold",
					children: blockType === "mt_yoke" ? `MT ${mtCurrentMode} · H = ${isYokeEnergized ? magneticFieldKaM.toFixed(1) : "0.0"} kA/m (${isYokeEnergized ? Math.round(magneticFieldKaM * 12.56) : 0} G) · Pole = ${yokePoleSpacingMm} mm` : `UT f = ${transducerFreqMHz.toFixed(2)} MHz · ∠${probeAngleDeg}° · Ø${crystalDiameterMm} mm · t = ${plateThicknessMm} mm`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-3 right-3 bg-[#060916]/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-bold text-amber-400 pointer-events-none",
				children: [
					blockType === "iiw_v1" && (isAr ? "كتلة المعايرة القياسية IIW V1 (ISO 2400)" : "IIW Type 1 Block (ISO 2400)"),
					blockType === "step_wedge" && (isAr ? "كتلة الدرج المتدرجة 5-Step Wedge (ASTM E797)" : "5-Step Wedge (ASTM E797)"),
					blockType === "angle_weld" && (isAr ? "فحص اللحام بالزاوية + إسقاط الشبكة السلكية للعيوب" : "Angle Weld Specimen + 3D Defect Wireframe"),
					blockType === "mt_yoke" && (isAr ? "الفحص بالشوكة المغناطيسية + الشبكة السلكية للشرخ" : "MT AC Yoke + 3D Crack Wireframe")
				]
			}),
			supportsDefectWireframe && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-3 left-3 right-3 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pointer-events-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-1.5 bg-[#060916]/92 px-2.5 py-2 rounded-xl border border-slate-800 text-[11px] font-mono pointer-events-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleToggleWireframes,
							"aria-pressed": wireframesVisible,
							className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${wireframesVisible ? "border-cyan-400/60 bg-cyan-950/70 text-cyan-200" : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, { className: "w-3.5 h-3.5 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? `الشبكة السلكية للعيوب: ${wireframesVisible ? "مفعلة" : "مخفية"}` : `3D Defect Wireframe: ${wireframesVisible ? "ON" : "OFF"}` })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleToggleXray,
							"aria-pressed": xrayActive,
							className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${xrayActive ? "border-amber-400/60 bg-amber-950/70 text-amber-200" : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? `شفافية العينة X-Ray: ${xrayActive ? "مفعلة" : "صلبة"}` : `X-Ray Weld: ${xrayActive ? "ON" : "OFF"}` })]
						}),
						blockType === "angle_weld" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden xl:flex items-center gap-2 ps-1 text-[10.5px] text-slate-400",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-1 bg-sky-400 inline-block rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Leg 1" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-1 bg-amber-400 inline-block rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Leg 2" })]
								})
							]
						})
					]
				}), wireframesVisible && detectedWireframeOverlays.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "region",
					"aria-label": isAr ? "قراءات الشبكة السلكية ثلاثية الأبعاد للعيوب المكتشفة على العينة" : "3D Weld Defect Wireframe Sizing Overlay",
					className: "bg-[#060916]/94 px-3 py-2 rounded-xl border border-cyan-500/40 text-[11px] font-mono tabular-nums space-y-1 pointer-events-auto max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 text-[10.5px] text-cyan-300 font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? `إسقاط سلكي 3D مباشر على اللحام (${detectedWireframeOverlays.length}):` : `3D Specimen Wireframe Overlay (${detectedWireframeOverlays.length} Flaw${detectedWireframeOverlays.length > 1 ? "s" : ""}):` })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-0.5",
						children: detectedWireframeOverlays.slice(0, 3).map((ov) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2 text-slate-200",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-white",
									children: ov.codeSymbol
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sky-300 font-semibold",
									children: isAr ? `العمق المحسوب Z = ${ov.calculatedDepthMm.toFixed(1)} mm` : `Depth Z = ${ov.calculatedDepthMm.toFixed(1)} mm`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-600",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-amber-300 font-semibold",
									children: isAr ? `الطول المحسوب L = ${ov.calculatedLengthMm.toFixed(1)} mm` : `Length L = ${ov.calculatedLengthMm.toFixed(1)} mm`
								})
							]
						}, ov.id))
					})]
				})]
			})
		]
	});
};
//#endregion
export { UtThreeScene };
