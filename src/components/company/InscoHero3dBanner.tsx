import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Language } from '../../types';

export type HeroBanner3dMode = 'ut' | 'rt' | 'pwht';
export type HeroBannerCameraPreset = 'overview' | 'weld_focus' | 'orbital_rig';

export interface InspectedBannerPart {
  id: 'weld_seam' | 'orbital_scanner' | 'ansi_flange';
  titleAr: string;
  titleEn: string;
  specAr: string;
  specEn: string;
}

export interface InscoHero3dBannerProps {
  language: Language;
  mode: HeroBanner3dMode;
  cameraPreset: HeroBannerCameraPreset;
  autoOrbit: boolean;
  /** The full interactive hero needs its own framing on portrait screens. */
  landing?: boolean;
  paused?: boolean;
  /** Stop even on-demand draws while the scene is not visible. */
  suspended?: boolean;
  onReadyChange?: (ready: boolean) => void;
  onInspectedPartChange?: (part: InspectedBannerPart | null) => void;
  className?: string;
}

// Module-scope reusable math helpers (zero GC inside animation tick)
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _pointerVec = new THREE.Vector2();
const _dummy = new THREE.Object3D();

const PART_SPECS: Record<InspectedBannerPart['id'], InspectedBannerPart> = {
  weld_seam: {
    id: 'weld_seam',
    titleAr: 'لحام دائري 30 بوصة — ASTM A106 Gr. B',
    titleEn: '30" Circumferential Girth Weld — ASTM A106 Gr. B',
    specAr: 'سماكة جدار 28.6 مم · فحص جذر اللحام طبقاً لـ ASME Sec. V',
    specEn: '28.6 mm Wall · Root Fusion Inspection per ASME Sec. V',
  },
  orbital_scanner: {
    id: 'orbital_scanner',
    titleAr: 'عربة المسح المداري التلقائي (PAUT / Gamma)',
    titleEn: 'Automated Orbital Scanner Crawler (PAUT / Gamma)',
    specAr: '64 عنصر مصفوفة طورية 5.0 MHz · ترميز مسار C-Scan حي',
    specEn: '64-Element 5.0 MHz Phased Array · Live Encoded C-Scan',
  },
  ansi_flange: {
    id: 'ansi_flange',
    titleAr: 'فلانشة ضغط عالي Class 600 RF · 16 مسمار تثبيت',
    titleEn: 'Forged Class 600 RF Weld-Neck Flange · 16 Stud Bolts',
    specAr: 'معالجة حرارية PWHT 760°C · مطابقة لخطوط البخار والغاز',
    specEn: 'PWHT 760°C Qualified · High-Pressure Steam & Gas Service',
  },
};

function detectSoftwareWebGL(context?: WebGL2RenderingContext): boolean {
  try {
    const gl = context ?? document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    if (!context) gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return true;
  }
}

function disposeSceneTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const renderable = obj as THREE.Mesh | THREE.Line | THREE.Points;
    if (renderable.geometry) {
      renderable.geometry.dispose();
    }
    const mat = (renderable as THREE.Mesh).material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        std.map?.dispose();
        std.roughnessMap?.dispose();
        m.dispose();
      });
    } else if (mat) {
      const std = mat as THREE.MeshStandardMaterial;
      std.map?.dispose();
      std.roughnessMap?.dispose();
      mat.dispose();
    }
  });
}

function createBrushedSteelTextures(maxAnisotropy: number) {
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = 512;
  albedoCanvas.height = 256;
  const ctxA = albedoCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 512;
  roughCanvas.height = 256;
  const ctxR = roughCanvas.getContext('2d');

  if (ctxA && ctxR) {
    ctxA.fillStyle = '#1e293b';
    ctxA.fillRect(0, 0, 512, 256);

    ctxR.fillStyle = '#4a4a4a';
    ctxR.fillRect(0, 0, 512, 256);

    for (let y = 0; y < 256; y += 2) {
      const shade = 26 + ((y * 17) % 18);
      ctxA.fillStyle = `rgb(${shade}, ${shade + 11}, ${shade + 26})`;
      ctxA.fillRect(0, y, 512, 1);

      const roughVal = 52 + ((y * 23) % 44);
      ctxR.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
      ctxR.fillRect(0, y, 512, 1);
    }

    // Subtle circumferential calibration mill bands
    ctxA.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctxA.lineWidth = 1.5;
    for (let x = 64; x < 512; x += 128) {
      ctxA.beginPath();
      ctxA.moveTo(x, 0);
      ctxA.lineTo(x, 256);
      ctxA.stroke();
    }
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = Math.max(1, maxAnisotropy);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = Math.max(1, maxAnisotropy);

  return { map, roughnessMap };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.72)');
    grad.addColorStop(0.5, 'rgba(2, 6, 23, 0.34)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBeamWaveShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x22d3ee) },
      uIntensity: { value: 0.9 },
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
    `,
  });
}

function createHorizonGridMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAccentColor: { value: new THREE.Color(0x06b6d4) },
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
    `,
  });
}

export const InscoHero3dBanner: React.FC<InscoHero3dBannerProps> = ({
  language,
  mode,
  cameraPreset,
  autoOrbit,
  landing = false,
  paused = false,
  suspended = false,
  onReadyChange,
  onInspectedPartChange,
  className = '',
}) => {
  const isAr = language === 'ar';
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Store reactive React props in refs so WebGL scene never tears down on mode/preset switches
  const modeRef = useRef<HeroBanner3dMode>(mode);
  const presetRef = useRef<HeroBannerCameraPreset>(cameraPreset);
  const autoOrbitRef = useRef<boolean>(autoOrbit);
  const pausedRef = useRef(paused);
  const suspendedRef = useRef(suspended);
  const isArRef = useRef<boolean>(isAr);
  const userDraggedRef = useRef<boolean>(false);
  const presetTransitionRef = useRef<boolean>(false);
  const onInspectedPartRef = useRef(onInspectedPartChange);
  const renderOnDemand = useRef<(() => void) | null>(null);
  const cancelScheduledFrame = useRef<(() => void) | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    renderOnDemand.current?.();
  }, [mode]);

  useEffect(() => {
    presetRef.current = cameraPreset;
    userDraggedRef.current = false;
    presetTransitionRef.current = true;
    renderOnDemand.current?.();
  }, [cameraPreset]);

  useEffect(() => {
    autoOrbitRef.current = autoOrbit;
  }, [autoOrbit]);

  useEffect(() => {
    const returning = suspendedRef.current && !suspended;
    pausedRef.current = paused;
    suspendedRef.current = suspended;
    if (suspended || paused) cancelScheduledFrame.current?.();
    if (!suspended && (!paused || returning)) renderOnDemand.current?.();
  }, [paused, suspended]);

  useEffect(() => {
    isArRef.current = isAr;
    if (!userDraggedRef.current) presetTransitionRef.current = true;
    renderOnDemand.current?.();
  }, [isAr]);

  useEffect(() => {
    onInspectedPartRef.current = onInspectedPartChange;
  }, [onInspectedPartChange]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    let isSoftwareGl: boolean;
    try {
      // The homepage can show its photo without asking Three.js to create
      // another context if WebGL is disabled or unavailable.
      const canvas = landing ? document.createElement('canvas') : undefined;
      const context = canvas?.getContext('webgl2', { alpha: true, antialias: false });
      if (landing && !context) return;
      isSoftwareGl = detectSoftwareWebGL(context ?? undefined);
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: context ?? undefined,
        antialias: !isSoftwareGl && !landing,
        alpha: true,
        powerPreference: landing ? 'default' : 'high-performance',
      });
    } catch {
      if (!landing) setWebglUnavailable(true);
      return;
    }

    const initW = container.clientWidth || 960;
    const initH = container.clientHeight || 560;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, landing ? 1.5 : 2));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, landing ? 0.034 : 0.048);

    // Mandatory studio environment reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmremGenerator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.1, 80);
    camera.position.set(3.4, 2.25, 7.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    // A drag can orbit the rig; a vertical swipe must still scroll the home page.
    if (landing) {
      renderer.domElement.style.touchAction = 'pan-y';
      renderer.domElement.style.cursor = 'grab';
    }
    controls.enableDamping = !landing && !isSoftwareGl && !prefersReducedMotion;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false; // Preserve smooth vertical page scroll
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.64;
    controls.target.set(0, -0.1, 0);

    controls.addEventListener('start', () => {
      userDraggedRef.current = true;
      presetTransitionRef.current = false;
    });

    // Balanced 3-Point Studio Lighting Rig (warm key + cool hemisphere fill + rim)
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    keyLight.position.set(5.5, 8.0, 5.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -5.5;
    keyLight.shadow.camera.right = 5.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.55);
    rimLight.position.set(-6.0, 3.2, -5.0);
    scene.add(rimLight);

    const inspectionSpotLight = new THREE.PointLight(0x38bdf8, 3.0, 9.0, 1.6);
    inspectionSpotLight.position.set(0, 1.75, 1.6);
    scene.add(inspectionSpotLight);

    // -------------------------------------------------------------------------
    // Procedural Textures & Materials
    // -------------------------------------------------------------------------
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const steelTextures = createBrushedSteelTextures(maxAniso);
    const contactShadowTex = createContactShadowTexture();

    const pipeSteelMat = new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      map: steelTextures.map,
      roughnessMap: steelTextures.roughnessMap,
      metalness: 0.92,
      roughness: 0.24,
      anisotropy: 0.8,
      anisotropyRotation: Math.PI / 2,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
    });

    const flangeSteelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.88,
      roughness: 0.32,
    });

    const matteSlateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.35,
      roughness: 0.72,
    });

    const weldSeamMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.78,
      roughness: 0.28,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.75,
    });

    const scannerBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.65,
      roughness: 0.28,
      emissive: new THREE.Color(0x0ea5e9),
      emissiveIntensity: 0.32,
    });

    const brassTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.22,
    });

    const perspexWedgeMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 0.95,
      ior: 1.49,
      thickness: 0.45,
      clearcoat: 1.0,
    });

    const pwhtPadMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.25,
      roughness: 0.65,
      emissive: new THREE.Color(0xe11d48),
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.0,
    });

    const beamShaderMat = createBeamWaveShaderMaterial();
    const horizonGridMat = createHorizonGridMaterial();

    // -------------------------------------------------------------------------
    // Root Assembly Group (framed asymmetrically for text legibility on wide screens)
    // -------------------------------------------------------------------------
    const heroRigGroup = new THREE.Group();
    scene.add(heroRigGroup);

    // Horizon Floor Plane + Grounded Contact Shadow
    const floorY = -1.78;
    const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), horizonGridMat);
    gridPlane.rotation.x = -Math.PI / 2;
    gridPlane.position.y = floorY;
    scene.add(gridPlane);

    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = floorY + 0.02; // Offset >= 0.02 to prevent Z-fighting
    heroRigGroup.add(shadowPlane);

    // 1. Primary 30" Heavy-Wall Pipeline Spool (1.15 radius, 5.8m length along X)
    const pipeRadius = 1.12;
    const pipeLength = 5.8;
    const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLength, 52, 1, false);
    pipeGeo.rotateZ(Math.PI / 2);
    const pipeMesh = new THREE.Mesh(pipeGeo, pipeSteelMat);
    pipeMesh.castShadow = true;
    pipeMesh.receiveShadow = true;
    heroRigGroup.add(pipeMesh);

    // Subtle CAD Wireframe Overlay Cage on pipe
    const wireGeo = new THREE.CylinderGeometry(pipeRadius + 0.008, pipeRadius + 0.008, pipeLength - 0.1, 28, 6, true);
    wireGeo.rotateZ(Math.PI / 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.11,
    });
    const wireCage = new THREE.Mesh(wireGeo, wireMat);
    heroRigGroup.add(wireCage);

    // Dark Inner Pipe Bore Plugs
    const boreGeo = new THREE.CylinderGeometry(pipeRadius * 0.78, pipeRadius * 0.78, pipeLength + 0.08, 36);
    boreGeo.rotateZ(Math.PI / 2);
    const boreMesh = new THREE.Mesh(boreGeo, matteSlateMat);
    heroRigGroup.add(boreMesh);

    // 2. Forged ANSI Weld-Neck Flanges (LatheGeometry) + 32 Instanced Stud Bolts
    const flangeProfile = [
      new THREE.Vector2(pipeRadius * 0.8, -0.18),
      new THREE.Vector2(pipeRadius + 0.42, -0.18),
      new THREE.Vector2(pipeRadius + 0.42, 0.06),
      new THREE.Vector2(pipeRadius + 0.24, 0.14),
      new THREE.Vector2(pipeRadius + 0.02, 0.26),
      new THREE.Vector2(pipeRadius * 0.8, 0.26),
    ];
    const flangeGeo = new THREE.LatheGeometry(flangeProfile, 44);
    flangeGeo.rotateZ(Math.PI / 2);

    const leftFlange = new THREE.Mesh(flangeGeo, flangeSteelMat);
    leftFlange.position.x = -pipeLength / 2 + 0.14;
    leftFlange.castShadow = true;
    leftFlange.userData.partId = 'ansi_flange';
    heroRigGroup.add(leftFlange);

    const rightFlange = new THREE.Mesh(flangeGeo, flangeSteelMat);
    rightFlange.rotation.y = Math.PI;
    rightFlange.position.x = pipeLength / 2 - 0.14;
    rightFlange.castShadow = true;
    rightFlange.userData.partId = 'ansi_flange';
    heroRigGroup.add(rightFlange);

    // 32 Flange Stud Bolts via single InstancedMesh
    const boltGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.38, 6);
    boltGeo.rotateZ(Math.PI / 2);
    const boltCountPerSide = 16;
    const flangeBoltsInstanced = new THREE.InstancedMesh(boltGeo, brassTrimMat, boltCountPerSide * 2);
    const boltRingR = pipeRadius + 0.28;
    let boltIdx = 0;
    [-pipeLength / 2 + 0.08, pipeLength / 2 - 0.08].forEach((fx) => {
      for (let i = 0; i < boltCountPerSide; i++) {
        const ang = (i / boltCountPerSide) * Math.PI * 2;
        _dummy.position.set(fx, Math.cos(ang) * boltRingR, Math.sin(ang) * boltRingR);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        flangeBoltsInstanced.setMatrixAt(boltIdx++, _dummy.matrix);
      }
    });
    flangeBoltsInstanced.instanceMatrix.needsUpdate = true;
    flangeBoltsInstanced.computeBoundingSphere();
    flangeBoltsInstanced.userData.partId = 'ansi_flange';
    heroRigGroup.add(flangeBoltsInstanced);

    // 3. Structural Steel Saddle Supports (ExtrudeGeometry with bevels, flush on floorY)
    const saddleShape = new THREE.Shape();
    saddleShape.moveTo(-0.92, 0);
    saddleShape.lineTo(0.92, 0);
    saddleShape.lineTo(0.78, 0.72);
    saddleShape.absarc(0, 1.78, pipeRadius + 0.03, -Math.PI * 0.22, -Math.PI * 0.78, true);
    saddleShape.lineTo(-0.78, 0.72);
    saddleShape.closePath();

    const saddleGeo = new THREE.ExtrudeGeometry(saddleShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
    });
    saddleGeo.rotateY(Math.PI / 2);
    saddleGeo.translate(-0.14, floorY, 0);

    [-1.85, 1.85].forEach((sx) => {
      const saddle = new THREE.Mesh(saddleGeo, matteSlateMat);
      saddle.position.x = sx;
      saddle.castShadow = true;
      saddle.receiveShadow = true;
      heroRigGroup.add(saddle);
    });

    // 4. Sculpted Bevel Girth Weld Seam + Internal Root Flaw Marker (x = 0)
    const weldProfile = [
      new THREE.Vector2(pipeRadius - 0.02, -0.24),
      new THREE.Vector2(pipeRadius + 0.06, -0.11),
      new THREE.Vector2(pipeRadius + 0.085, 0.0),
      new THREE.Vector2(pipeRadius + 0.06, 0.11),
      new THREE.Vector2(pipeRadius - 0.02, 0.24),
    ];
    const weldGeo = new THREE.LatheGeometry(weldProfile, 52);
    weldGeo.rotateZ(Math.PI / 2);
    const weldSeamMesh = new THREE.Mesh(weldGeo, weldSeamMat);
    weldSeamMesh.userData.partId = 'weld_seam';
    heroRigGroup.add(weldSeamMesh);

    // Glowing Root Defect Calibration Target Ring
    const flawRingGeo = new THREE.TorusGeometry(pipeRadius + 0.095, 0.016, 12, 56);
    flawRingGeo.rotateY(Math.PI / 2);
    const flawRingMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.75,
    });
    const flawRing = new THREE.Mesh(flawRingGeo, flawRingMat);
    heroRigGroup.add(flawRing);

    // 5. PWHT 65 kW Flexible Ceramic Heating Pad Array (12 curved blocks encircling weld)
    const padGeo = new THREE.BoxGeometry(0.68, 0.08, 0.44);
    const pwhtPadCount = 12;
    const pwhtPadsMesh = new THREE.InstancedMesh(padGeo, pwhtPadMat, pwhtPadCount);
    for (let i = 0; i < pwhtPadCount; i++) {
      const ang = (i / pwhtPadCount) * Math.PI * 2;
      const rPad = pipeRadius + 0.12;
      _dummy.position.set(0, Math.cos(ang) * rPad, Math.sin(ang) * rPad);
      _dummy.rotation.set(ang, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      pwhtPadsMesh.setMatrixAt(i, _dummy.matrix);
    }
    pwhtPadsMesh.instanceMatrix.needsUpdate = true;
    pwhtPadsMesh.computeBoundingSphere();
    heroRigGroup.add(pwhtPadsMesh);

    // 6. Orbital Magnetic Guide Band & Articulated Scanner Carriage (Composite 6-part Group)
    const bandGeo = new THREE.TorusGeometry(pipeRadius + 0.09, 0.035, 16, 64);
    bandGeo.rotateY(Math.PI / 2);
    const guideBand = new THREE.Mesh(bandGeo, flangeSteelMat);
    guideBand.position.x = 0.56;
    heroRigGroup.add(guideBand);

    const scannerPivot = new THREE.Group();
    heroRigGroup.add(scannerPivot);

    const scannerCarriage = new THREE.Group();
    scannerCarriage.position.set(0.56, pipeRadius + 0.14, 0);
    scannerPivot.add(scannerCarriage);

    // Scanner beveled chassis
    const chassisShape = new THREE.Shape();
    chassisShape.moveTo(-0.26, 0);
    chassisShape.lineTo(0.26, 0);
    chassisShape.lineTo(0.22, 0.24);
    chassisShape.lineTo(-0.18, 0.28);
    chassisShape.closePath();
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    chassisGeo.translate(0, 0, -0.17);
    const chassisMesh = new THREE.Mesh(chassisGeo, scannerBodyMat);
    chassisMesh.castShadow = true;
    chassisMesh.userData.partId = 'orbital_scanner';
    scannerCarriage.add(chassisMesh);

    // Brass encoder wheel + mounting arm
    const armGeo = new THREE.BoxGeometry(0.42, 0.07, 0.09);
    const armMesh = new THREE.Mesh(armGeo, flangeSteelMat);
    armMesh.position.set(-0.34, 0.08, 0);
    armMesh.userData.partId = 'orbital_scanner';
    scannerCarriage.add(armMesh);

    // Perspex Shear-Wave Wedge over weld center (x offset -0.56 brings it directly over x=0 weld!)
    const wedgeGeo = new THREE.BoxGeometry(0.26, 0.16, 0.22);
    const wedgeMesh = new THREE.Mesh(wedgeGeo, perspexWedgeMat);
    wedgeMesh.position.set(-0.56, -0.02, 0);
    wedgeMesh.userData.partId = 'orbital_scanner';
    scannerCarriage.add(wedgeMesh);

    // Phased Array Transducer Cap + Brass Connector
    const arrayCap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.2), scannerBodyMat);
    arrayCap.position.set(-0.56, 0.11, 0);
    arrayCap.userData.partId = 'orbital_scanner';
    scannerCarriage.add(arrayCap);

    const lemoConnector = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), brassTrimMat);
    lemoConnector.position.set(-0.56, 0.22, 0);
    scannerCarriage.add(lemoConnector);

    // Braided Umbilical Cable Curve from scanner cap to carriage
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.56, 0.27, 0),
      new THREE.Vector3(-0.4, 0.45, 0.08),
      new THREE.Vector3(-0.14, 0.42, 0.05),
      new THREE.Vector3(0.02, 0.25, 0),
    ]);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 20, 0.022, 8, false);
    const cableMesh = new THREE.Mesh(cableGeo, matteSlateMat);
    scannerCarriage.add(cableMesh);

    // Volumetric Shader Inspection Cone / Beam Fan radiating into the weld
    const beamConeGeo = new THREE.CylinderGeometry(0.05, 0.62, 1.35, 32, 1, true);
    const beamConeMesh = new THREE.Mesh(beamConeGeo, beamShaderMat);
    beamConeMesh.position.set(-0.56, -0.72, 0);
    scannerCarriage.add(beamConeMesh);

    // 7. Telemetry / Photon Particle Cloud orbiting pipeline
    const pCount = 140;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const ang = (i / pCount) * Math.PI * 2 * 3;
      const rad = pipeRadius + 0.38 + (i % 5) * 0.22;
      pPositions[i * 3] = ((i / pCount) - 0.5) * 6.4;
      pPositions[i * 3 + 1] = Math.cos(ang) * rad;
      pPositions[i * 3 + 2] = Math.sin(ang) * rad;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.048,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particlePoints = new THREE.Points(pGeo, pMat);
    heroRigGroup.add(particlePoints);

    // Pre-warm shaders on hardware WebGL
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting setup (hover highlights & click inspection on Layer 0 proxy targets)
    const raycaster = new THREE.Raycaster();
    const clickables = [weldSeamMesh, chassisMesh, wedgeMesh, arrayCap, leftFlange, rightFlange];
    let lastRaycastMs = 0;

    const inspectPart = (e: PointerEvent) => {
      const now = performance.now();
      if (suspendedRef.current || (e.type === 'pointermove' && now - lastRaycastMs < 55)) return;
      lastRaycastMs = now;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      _pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerVec, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const partId = hits[0].object.userData.partId as InspectedBannerPart['id'] | undefined;
        renderer.domElement.style.cursor = 'pointer';
        if (partId && PART_SPECS[partId]) {
          onInspectedPartRef.current?.(PART_SPECS[partId]);
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointermove', inspectPart);
    if (landing) renderer.domElement.addEventListener('pointerdown', inspectPart);

    // -------------------------------------------------------------------------
    // Main Render Loop (with Software-WebGL GPU fence pacing)
    // -------------------------------------------------------------------------
    // Three.js requires WebGL 2, including for the software renderer.
    const gl = renderer.getContext() as WebGL2RenderingContext;
    let frameId = 0;
    let timerId = 0;
    let fence: WebGLSync | null = null;
    let disposed = false;
    let contextLost = false;
    let hasDrawn = false;
    let lastFrameTime = 0;
    let elapsed = 0;
    let framedWidth = 0;
    let framedHeight = 0;

    const cancelQueuedDraw = () => {
      controls.autoRotate = false;
      lastFrameTime = 0;
      cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
      frameId = timerId = 0;
      if (fence) gl.deleteSync(fence);
      fence = null;
    };

    const canDraw = () => !disposed && !contextLost && !suspendedRef.current && (!landing || !document.hidden);
    const requestFrame = () => {
      if (canDraw() && !frameId && !timerId) frameId = requestAnimationFrame(tick);
    };

    const afterDraw = () => {
      fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (fence) gl.flush();
      const poll = () => {
        if (!canDraw()) {
          cancelQueuedDraw();
          return;
        }
        if (fence && gl.getSyncParameter(fence, gl.SYNC_STATUS) === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
          return;
        }
        if (fence) gl.deleteSync(fence);
        fence = null;
        timerId = window.setTimeout(() => {
          timerId = 0;
          requestFrame();
        }, 80);
      };
      timerId = window.setTimeout(poll, 5);
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      hasDrawn = false;
      cancelQueuedDraw();
      if (!landing) setWebglUnavailable(true);
      onReadyChange?.(false);
    };
    const handleContextRestored = () => {
      contextLost = false;
      if (!landing) setWebglUnavailable(false);
      requestFrame();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const tick = (now: number) => {
      if (!canDraw()) {
        frameId = 0;
        return;
      }
      // Home passes live motion preferences in `paused`; the demo also checks
      // the entry preference so standalone renderers default to reduced motion.
      const animated = !pausedRef.current && (landing || !prefersReducedMotion);
      const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.1) : 0;
      lastFrameTime = now;
      if (animated) elapsed += delta;
      // Snap to a new preset when a paused view only needs one frame.
      const dt = !animated || (landing && !hasDrawn) ? 10 : delta;
      const w = container.clientWidth || initW;
      const h = container.clientHeight || initH;
      const isWide = w >= (landing ? 880 : 980); // Match the hero's split layout.
      if (w !== framedWidth || h !== framedHeight) {
        camera.aspect = w / h;
        if (framedWidth || w !== initW || h !== initH) renderer.setSize(w, h, false);
        framedWidth = w;
        framedHeight = h;
        if (landing) presetTransitionRef.current = true;
        camera.updateProjectionMatrix();
      }
      if (landing) {
        // At phone widths the section is tall. Keep the pipe behind the title
        // and actions, while leaving the canvas continuous down to the dock.
        camera.zoom = isWide ? Math.min(1.1, w / (1.15 * h)) : Math.min(1, 1.45 * w / h);
        const offsetX = isWide ? 0 : w * (isArRef.current ? 0.065 : -0.065);
        const offsetY = isWide ? -h * 0.025 : h / 2 - Math.min(h * 0.37, w < 640 ? 345 : 410);
        const view = camera.view;
        if (!view || view.fullWidth !== w || view.fullHeight !== h || view.offsetX !== offsetX || view.offsetY !== offsetY) {
          camera.setViewOffset(w, h, offsetX, offsetY, w, h);
        }
      }
      const desiredRigX = isWide ? (isArRef.current ? -1.45 : 1.45) : 0;
      heroRigGroup.position.x = THREE.MathUtils.damp(heroRigGroup.position.x, desiredRigX, 5, dt);
      heroRigGroup.position.y = isWide ? -0.08 : 0.15;

      // Smooth Camera Preset Transitions (yields immediately if user dragged)
      const preset = presetRef.current;
      const baseX = heroRigGroup.position.x;
      if (preset === 'weld_focus') {
        _camGoalPos.set(baseX + 0.65, 1.35, 4.15);
        _camGoalTarget.set(baseX, 0.05, 0);
      } else if (preset === 'orbital_rig') {
        _camGoalPos.set(baseX + 2.4, 2.05, 4.65);
        _camGoalTarget.set(baseX + 0.35, 0.55, 0);
      } else {
        const yaw = landing ? (isWide ? 5.9 : 4.8) : 0.9;
        const distance = landing ? (isWide ? 6.15 : 7.0) : (isWide ? 7.1 : 8.2);
        _camGoalPos.set(baseX + (isArRef.current ? -yaw : yaw), landing ? 1.85 : 2.15, distance);
        _camGoalTarget.set(baseX, -0.05, 0);
      }

      if (presetTransitionRef.current && !userDraggedRef.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 4.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 4.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 4.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 5.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 5.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, 5.5, dt);

        if (camera.position.distanceTo(_camGoalPos) < 0.03) {
          presetTransitionRef.current = false;
        }
      } else if (!userDraggedRef.current) {
        // Keep orbit center locked smoothly to responsive rig offset
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 4, dt);
      }

      controls.autoRotate = animated && autoOrbitRef.current && (landing ? !presetTransitionRef.current : !isSoftwareGl);
      controls.autoRotateSpeed = 0.65;
      controls.update(landing ? delta : undefined);

      // Mode-specific Materials, Volumetric Shader & Orbital Scanner Kinematics
      const curMode = modeRef.current;
      beamShaderMat.uniforms.uTime.value = elapsed;
      horizonGridMat.uniforms.uTime.value = elapsed;

      if (curMode === 'ut') {
        beamShaderMat.uniforms.uColor.value.setHex(0x22d3ee);
        beamShaderMat.uniforms.uIntensity.value = 0.95;
        horizonGridMat.uniforms.uAccentColor.value.setHex(0x06b6d4);
        weldSeamMat.color.setHex(0x38bdf8);
        weldSeamMat.emissive.setHex(0x0284c7);
        weldSeamMat.emissiveIntensity = 0.72 + Math.sin(elapsed * 2.5) * 0.14;
        flawRingMat.color.setHex(0x22d3ee);
        flawRingMat.opacity = 0.65 + Math.sin(elapsed * 4.0) * 0.25;
        pMat.color.setHex(0x38bdf8);
        inspectionSpotLight.color.setHex(0x22d3ee);
        pwhtPadMat.opacity = THREE.MathUtils.damp(pwhtPadMat.opacity, 0.0, 6, dt);
        beamConeMesh.visible = true;
      } else if (curMode === 'rt') {
        beamShaderMat.uniforms.uColor.value.setHex(0xf59e0b);
        beamShaderMat.uniforms.uIntensity.value = 1.05;
        horizonGridMat.uniforms.uAccentColor.value.setHex(0xf59e0b);
        weldSeamMat.color.setHex(0xfbbf24);
        weldSeamMat.emissive.setHex(0xd97706);
        weldSeamMat.emissiveIntensity = 0.8 + Math.sin(elapsed * 3.0) * 0.18;
        flawRingMat.color.setHex(0xfbbf24);
        flawRingMat.opacity = 0.72 + Math.sin(elapsed * 5.0) * 0.22;
        pMat.color.setHex(0xfbbf24);
        inspectionSpotLight.color.setHex(0xf59e0b);
        pwhtPadMat.opacity = THREE.MathUtils.damp(pwhtPadMat.opacity, 0.0, 6, dt);
        beamConeMesh.visible = true;
      } else {
        // PWHT 65 kW Induction Thermal Soak Mode
        beamShaderMat.uniforms.uColor.value.setHex(0xf43f5e);
        beamShaderMat.uniforms.uIntensity.value = 0.45;
        horizonGridMat.uniforms.uAccentColor.value.setHex(0xf97316);
        weldSeamMat.color.setHex(0xfb7185);
        weldSeamMat.emissive.setHex(0xe11d48);
        weldSeamMat.emissiveIntensity = 1.35 + Math.sin(elapsed * 2.2) * 0.35;
        flawRingMat.color.setHex(0xf97316);
        flawRingMat.opacity = 0.5 + Math.sin(elapsed * 2.5) * 0.25;
        pMat.color.setHex(0xf97316);
        inspectionSpotLight.color.setHex(0xf97316);
        pwhtPadMat.opacity = THREE.MathUtils.damp(pwhtPadMat.opacity, 0.92, 4, dt);
        pwhtPadMat.emissiveIntensity = 0.85 + Math.sin(elapsed * 2.8) * 0.35;
        beamConeMesh.visible = false;
      }

      // Smooth Orbital Motion of Scanner Rig around the 30" Pipe Weld Seam
      if (landing || !prefersReducedMotion) {
        const orbitAngle = Math.sin(elapsed * 0.55) * 0.78;
        scannerPivot.rotation.x = orbitAngle;
        particlePoints.rotation.x = elapsed * 0.18;
      }

      renderer.render(scene, camera);
      if (!hasDrawn) {
        hasDrawn = true;
        onReadyChange?.(true);
      }

      frameId = 0;
      if (!animated) return;
      if (isSoftwareGl) afterDraw();
      else requestFrame();
    };

    renderOnDemand.current = requestFrame;
    cancelScheduledFrame.current = cancelQueuedDraw;
    if (landing || prefersReducedMotion) controls.addEventListener('change', requestFrame);
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(requestFrame) : null;
    resizeObserver?.observe(container);
    const handleVisibilityChange = () => {
      // Restart even if a rapid hide/show was batched into one React update.
      if (document.hidden) cancelQueuedDraw();
      else requestFrame();
    };
    if (landing) document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', requestFrame);
    requestFrame();

    return () => {
      renderOnDemand.current = null;
      cancelScheduledFrame.current = null;
      controls.removeEventListener('change', requestFrame);
      disposed = true;
      cancelQueuedDraw();
      resizeObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', requestFrame);
      renderer.domElement.removeEventListener('pointermove', inspectPart);
      renderer.domElement.removeEventListener('pointerdown', inspectPart);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      environment.dispose();
      steelTextures.map.dispose();
      steelTextures.roughnessMap.dispose();
      contactShadowTex.dispose();
      disposeSceneTree(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [landing, onReadyChange]);

  if (webglUnavailable) {
    return (
      <div
        data-testid="insco-3d-banner-fallback"
        className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}
      >
        <div className="absolute inset-0 bg-radial-[circle_at_70%_45%,_var(--tw-gradient-stops)] from-cyan-900/35 via-slate-950 to-slate-950" />
        <svg
          viewBox="0 0 1200 560"
          className="absolute inset-0 w-full h-full opacity-55"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fallbackPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <g transform={isAr ? 'translate(140, 130)' : 'translate(540, 130)'}>
            <rect x="40" y="95" width="480" height="145" rx="18" fill="url(#fallbackPipeGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.45" />
            <rect x="262" y="88" width="26" height="159" rx="4" fill="#0ea5e9" fillOpacity="0.32" stroke="#22d3ee" strokeWidth="2" />
            <ellipse cx="40" cy="167" rx="18" ry="88" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <ellipse cx="520" cy="167" rx="18" ry="88" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <path d="M275 88 L225 235 L325 235 Z" fill="#22d3ee" fillOpacity="0.22" className="ut-beam-cone-pulse" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="insco-3d-banner-canvas-host"
      role="img"
      aria-label={isAr ? 'مشهد ثلاثي الأبعاد تفاعلي لفحص خطوط الأنابيب' : 'Interactive 3D pipeline NDT & PWHT inspection scene'}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
    />
  );
};
