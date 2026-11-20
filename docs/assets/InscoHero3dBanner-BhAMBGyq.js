import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { $ as Shape, A as MathUtils, B as PlaneGeometry, F as MeshStandardMaterial, H as Points, I as Object3D, J as RepeatWrapping, M as MeshBasicMaterial, P as MeshPhysicalMaterial, Q as ShaderMaterial, R as PerspectiveCamera, S as LatheGeometry, U as PointsMaterial, V as PointLight, X as SRGBColorSpace, Z as Scene, _ as FogExp2, a as BufferAttribute, at as TorusGeometry, b as HemisphereLight, c as CatmullRomCurve3, ct as Vector3, g as ExtrudeGeometry, i as BoxGeometry, j as Mesh, l as Clock, m as DirectionalLight, n as WebGLRenderer, o as BufferGeometry, ot as TubeGeometry, p as CylinderGeometry, q as Raycaster, s as CanvasTexture, st as Vector2, t as PMREMGenerator, u as Color, x as InstancedMesh, y as Group } from "./three.module-KJ9Rnf9y.js";
import { n as RoomEnvironment, t as OrbitControls } from "./OrbitControls-NitkVtVF.js";
//#region src/components/company/InscoHero3dBanner.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
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
