import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Language } from '../../../types';
import type {
  Ar4dInspectorDisciplineId,
  Ar4dUnifiedTelemetry,
} from '../../../data/ar4dVtMtPtPwhtEngine';

export type VtMtPtPwhtBackdropMode = 'camera' | 'pipe' | 'studio3d';

export interface VtMtPtPwhtAr4dThreeSceneProps {
  language: Language;
  disciplineId: Ar4dInspectorDisciplineId;
  telemetry: Ar4dUnifiedTelemetry;
  accentHex: string;
  backdropMode: VtMtPtPwhtBackdropMode;
  arScalePct: number;
  arRotationDeg: number;
  pwhtTargetC?: number;
  vtCapMm?: number;
  mtTwoWay?: boolean;
}

interface DynamicSceneState {
  telemetry: Ar4dUnifiedTelemetry;
  arScalePct: number;
  arRotationDeg: number;
  backdropMode: VtMtPtPwhtBackdropMode;
  pwhtTargetC: number;
  vtCapMm: number;
  mtTwoWay: boolean;
}

interface BuiltInspectorRig {
  group: THREE.Group;
  update: (elapsed: number, state: DynamicSceneState) => void;
}

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);
  } catch {
    return true;
  }
}

function createEnergyShader(primaryHex: string, secondaryHex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0.4 },
      uIntensity: { value: 1.0 },
      uPrimary: { value: new THREE.Color(primaryHex) },
      uSecondary: { value: new THREE.Color(secondaryHex) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uProgress;
      uniform float uIntensity;
      uniform vec3 uPrimary;
      uniform vec3 uSecondary;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;

      void main() {
        float axial = clamp(1.0 - vUv.y, 0.0, 1.0);
        float front = clamp(uProgress * 1.12, 0.08, 1.0);
        float pulseMask = 1.0 - smoothstep(front - 0.16, front + 0.04, axial);
        float wave = pow(0.5 + 0.5 * cos((axial * 7.2 - uTime * 2.3) * 6.283185), 2.2);
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float rim = pow(1.0 - abs(dot(n, v)), 1.2);
        vec3 col = mix(uSecondary, uPrimary, clamp(wave * 0.78 + rim * 0.38, 0.0, 1.0));
        float alpha = clamp((0.18 + 0.62 * wave) * pulseMask * (0.52 + 0.55 * rim) * uIntensity, 0.02, 0.90);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

function disposeSceneTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
}

function buildInspectorRig(
  disciplineId: Ar4dInspectorDisciplineId,
  accentHex: string,
  envMap: THREE.Texture | null
): BuiltInspectorRig {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.85,
    roughness: 0.28,
    envMap,
    envMapIntensity: 1.1,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.72,
    roughness: 0.36,
    envMap,
  });

  const weldMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.22,
    envMap,
  });

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 1.86, 64),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = -1.35;
  group.add(baseRing);

  // =========================================================================
  // 1. VT — Weld Coupon + Undercut Groove + Moving Cambridge Laser Profiler
  // =========================================================================
  if (disciplineId === 'vt') {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.38, 1.9), steelMat);
    plate.position.y = -0.45;
    plate.receiveShadow = true;
    group.add(plate);

    const weldBead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.92, 24), weldMat);
    weldBead.rotation.x = Math.PI / 2;
    weldBead.position.set(0, -0.24, 0);
    group.add(weldBead);

    const undercutMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    });
    const undercutTrench = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.95), undercutMat);
    undercutTrench.position.set(0.24, -0.24, 0.12);
    group.add(undercutTrench);

    // Sliding 3D Cambridge / Bridge Cam Gauge Head + Cyan Laser Sheet
    const gaugeGroup = new THREE.Group();
    const gaugeBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.46, 0.14),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        metalness: 0.65,
        roughness: 0.25,
        envMap,
      })
    );
    gaugeBody.position.set(0, 0.28, 0);
    const gaugePointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.65 })
    );
    gaugePointer.rotation.z = Math.PI;
    gaugePointer.position.set(0, -0.02, 0);
    gaugeGroup.add(gaugeBody, gaugePointer);

    const laserMat = createEnergyShader('#38bdf8', '#22d3ee');
    const laserFan = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.42), laserMat);
    laserFan.position.set(0, -0.02, 0);
    gaugeGroup.add(laserFan);
    group.add(gaugeGroup);

    return {
      group,
      update: (elapsed, state) => {
        const t4d = state.telemetry.timeProgress01;
        gaugeGroup.position.z = -0.78 + t4d * 1.56;
        const capScale = Math.max(0.55, Math.min(2.1, state.vtCapMm / 2.2));
        weldBead.scale.set(1, 1, capScale);
        undercutMat.emissiveIntensity = 0.25 + state.telemetry.visualState.defectSeverity01 * 1.65;
        laserMat.uniforms.uTime.value = elapsed;
        laserMat.uniforms.uProgress.value = Math.max(0.3, t4d);
        laserMat.uniforms.uIntensity.value = 0.45 + state.telemetry.visualState.fluxIntensity01 * 0.7;
      },
    };
  }

  // =========================================================================
  // 2. MT — Butt Weld Plate + Articulated AC/DC Yoke + Orthogonal 0°/90° Flux
  // =========================================================================
  if (disciplineId === 'mt') {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.36, 2.0), steelMat);
    plate.position.y = -0.48;
    plate.receiveShadow = true;
    group.add(plate);

    const weldBead = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 2.02, 22), weldMat);
    weldBead.rotation.x = Math.PI / 2;
    weldBead.position.set(0, -0.28, 0);
    group.add(weldBead);

    const crackMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xec4899,
      emissiveIntensity: 0.4,
    });
    const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.92), crackMat);
    crackMesh.position.set(0.02, -0.14, 0);
    group.add(crackMesh);

    const yokeGroup = new THREE.Group();
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, -0.22, 0),
      new THREE.Vector3(-0.56, 0.64, 0),
      new THREE.Vector3(0.0, 0.90, 0),
      new THREE.Vector3(0.56, 0.64, 0),
      new THREE.Vector3(0.62, -0.22, 0),
    ]);
    const yokeCore = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 28, 0.088, 12, false), darkAlloyMat);
    yokeGroup.add(yokeCore);

    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
    [-0.56, 0.56].forEach((xLeg) => {
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 20), copperMat);
      coil.position.set(xLeg, 0.36, 0);
      yokeGroup.add(coil);
    });

    const fluxMat = createEnergyShader('#ec4899', '#38bdf8');
    const fluxRibbon = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.56), fluxMat);
    fluxRibbon.rotation.x = -Math.PI / 2;
    fluxRibbon.position.set(0, -0.14, 0);
    yokeGroup.add(fluxRibbon);
    group.add(yokeGroup);

    return {
      group,
      update: (elapsed, state) => {
        const t4d = state.telemetry.timeProgress01;
        // 0° scan during t = 0..0.5, rotate smoothly to 90° during t = 0.5..0.95 if two-way active
        if (state.mtTwoWay && t4d > 0.48) {
          const rotBlend = Math.min(1, (t4d - 0.48) / 0.14);
          yokeGroup.rotation.y = (Math.PI / 2) * rotBlend;
        } else {
          yokeGroup.rotation.y = 0;
        }
        yokeGroup.position.z = Math.sin(t4d * Math.PI * 2) * 0.32;
        crackMat.emissiveIntensity = 0.35 + state.telemetry.visualState.fluxIntensity01 * 2.3;
        fluxMat.uniforms.uTime.value = elapsed;
        fluxMat.uniforms.uProgress.value = Math.max(0.2, t4d);
        fluxMat.uniforms.uIntensity.value = 0.55 + state.telemetry.visualState.fluxIntensity01 * 0.75;
      },
    };
  }

  // =========================================================================
  // 3. PT — Weld Coupon + Capillary Crack Cavity + Expanding Developer Bleed Halo
  // =========================================================================
  if (disciplineId === 'pt') {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.36, 2.0), steelMat);
    plate.position.y = -0.48;
    plate.receiveShadow = true;
    group.add(plate);

    const weldBead = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 2.02, 22), weldMat);
    weldBead.rotation.x = Math.PI / 2;
    weldBead.position.set(0, -0.28, 0);
    group.add(weldBead);

    // Translucent White Non-Aqueous Developer Coat appearing at t >= 0.58
    const devMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.0,
      roughness: 0.85,
    });
    const devFilm = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.5), devMat);
    devFilm.rotation.x = -Math.PI / 2;
    devFilm.position.set(0, -0.29, 0);
    group.add(devFilm);

    const crackMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xa855f7,
      emissiveIntensity: 0.45,
    });
    const crackCore = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), crackMat);
    crackCore.position.set(0.05, -0.14, 0);
    group.add(crackCore);

    // Expanding Capillary Bleed-Out Shader Disc
    const bleedShader = createEnergyShader('#e879f9', '#fb7185');
    const bleedDisc = new THREE.Mesh(new THREE.CircleGeometry(0.65, 36), bleedShader);
    bleedDisc.rotation.x = -Math.PI / 2;
    bleedDisc.position.set(0.05, -0.26, 0);
    group.add(bleedDisc);

    // UV-A / Inspection Wand Hovering Above Surface
    const wandGroup = new THREE.Group();
    const wandBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.24), darkAlloyMat);
    wandBody.position.set(0, 0.66, 0);
    const uvLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.04, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 1.4 })
    );
    uvLens.position.set(0, 0.57, 0);
    wandGroup.add(wandBody, uvLens);
    group.add(wandGroup);

    return {
      group,
      update: (elapsed, state) => {
        const t4d = state.telemetry.timeProgress01;
        const bleed01 = state.telemetry.visualState.capillaryBleed01;
        wandGroup.position.x = Math.sin(t4d * Math.PI * 2) * 0.45;
        devMat.opacity = t4d > 0.56 ? Math.min(0.45, (t4d - 0.56) * 1.4) : 0.08 * t4d;
        bleedDisc.scale.setScalar(0.3 + bleed01 * (0.85 + state.telemetry.visualState.defectSeverity01 * 0.55));
        crackMat.emissiveIntensity = 0.4 + bleed01 * 2.2;
        bleedShader.uniforms.uTime.value = elapsed;
        bleedShader.uniforms.uProgress.value = Math.max(0.18, bleed01);
        bleedShader.uniforms.uIntensity.value = 0.35 + bleed01 * 0.9;
      },
    };
  }

  // =========================================================================
  // 4. PWHT — Insulated Pipe + 12 Instanced Ceramic FCP Pads + Blackbody Glow
  // =========================================================================
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 3.2, 40, 1, false), steelMat);
  pipe.rotation.z = Math.PI / 2;
  pipe.castShadow = true;
  pipe.receiveShadow = true;
  group.add(pipe);

  const weldCrown = new THREE.Mesh(new THREE.TorusGeometry(0.885, 0.075, 16, 48), weldMat);
  weldCrown.rotation.y = Math.PI / 2;
  group.add(weldCrown);

  const padGeo = new THREE.BoxGeometry(0.52, 0.09, 0.34);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x991b1b,
    emissiveIntensity: 0.25,
    roughness: 0.55,
  });
  const pads = new THREE.InstancedMesh(padGeo, padMat, 12);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i += 1) {
    const ang = (i / 12) * Math.PI * 2;
    dummy.position.set(0, Math.cos(ang) * 0.94, Math.sin(ang) * 0.94);
    dummy.rotation.set(ang, 0, 0);
    dummy.updateMatrix();
    pads.setMatrixAt(i, dummy.matrix);
  }
  pads.instanceMatrix.needsUpdate = true;
  pads.computeBoundingSphere();
  group.add(pads);

  const tcRing = new THREE.Mesh(new THREE.TorusGeometry(0.99, 0.025, 10, 48), weldMat);
  tcRing.rotation.y = Math.PI / 2;
  tcRing.position.x = 0.30;
  group.add(tcRing);

  const thermalShader = createEnergyShader('#fb7185', '#f59e0b');
  const heatHalo = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.12, 0.9, 40, 1, true), thermalShader);
  heatHalo.rotation.z = Math.PI / 2;
  group.add(heatHalo);

  return {
    group,
    update: (elapsed, state) => {
      const heatNorm = state.telemetry.visualState.thermalNormalized01;
      const tempGain = ((state.pwhtTargetC - 560) / 220) * 0.45 + 0.65;
      const glow = heatNorm * tempGain;
      padMat.emissive.setRGB(1.0 * glow, 0.28 * glow * glow, 0.03 * glow);
      padMat.emissiveIntensity = 0.15 + glow * 2.45;
      thermalShader.uniforms.uTime.value = elapsed;
      thermalShader.uniforms.uProgress.value = Math.max(0.15, heatNorm);
      thermalShader.uniforms.uIntensity.value = 0.28 + glow * 0.85;
    },
  };
}

export const VtMtPtPwhtAr4dThreeScene: React.FC<VtMtPtPwhtAr4dThreeSceneProps> = ({
  language,
  disciplineId,
  telemetry,
  accentHex,
  backdropMode,
  arScalePct,
  arRotationDeg,
  pwhtTargetC = 620,
  vtCapMm = 2.4,
  mtTwoWay = true,
}) => {
  const isAr = language === 'ar';
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState<boolean>(false);

  const liveStateRef = useRef<DynamicSceneState>({
    telemetry,
    arScalePct,
    arRotationDeg,
    backdropMode,
    pwhtTargetC,
    vtCapMm,
    mtTwoWay,
  });

  useEffect(() => {
    liveStateRef.current = {
      telemetry,
      arScalePct,
      arRotationDeg,
      backdropMode,
      pwhtTargetC,
      vtCapMm,
      mtTwoWay,
    };
  }, [telemetry, arScalePct, arRotationDeg, backdropMode, pwhtTargetC, vtCapMm, mtTwoWay]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let pmremGenerator: THREE.PMREMGenerator | null = null;
    let envTarget: THREE.WebGLRenderTarget | null = null;
    let controls: OrbitControls | null = null;
    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleContextLost = (ev: Event) => {
      ev.preventDefault();
    };

    try {
      const width = Math.max(container.clientWidth || 640, 320);
      const height = Math.max(container.clientHeight || 360, 240);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });

      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
      roomEnv.dispose();
      scene.environment = envTarget.texture;

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
      camera.position.set(2.55, 1.85, 4.15);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.minDistance = 2.4;
      controls.maxDistance = 8.0;
      controls.maxPolarAngle = Math.PI * 0.64;

      const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.72);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.25);
      keyLight.position.set(4.5, 6.2, 4.0);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(new THREE.Color(accentHex), 1.15);
      rimLight.position.set(-4.2, 2.5, -3.6);
      scene.add(rimLight);

      const floorGrid = new THREE.GridHelper(9, 18, new THREE.Color(accentHex), 0x1e293b);
      floorGrid.position.y = -1.38;
      (floorGrid.material as THREE.Material).transparent = true;
      (floorGrid.material as THREE.Material).opacity = 0.28;
      scene.add(floorGrid);

      const arPivot = new THREE.Group();
      scene.add(arPivot);

      const rig = buildInspectorRig(disciplineId, accentHex, envTarget.texture);
      arPivot.add(rig.group);

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = Math.max(container.clientWidth || 640, 320);
        const h = Math.max(container.clientHeight || 360, 240);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };

      const resizeObs =
        typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
      resizeObs?.observe(container);

      const glCtx = isSoftwareGl ? (renderer.getContext() as WebGL2RenderingContext) : null;
      const startTime = performance.now();

      const afterDraw = (cb: () => void) => {
        if (disposed) return;
        if (isSoftwareGl && glCtx && typeof glCtx.fenceSync === 'function') {
          const sync = glCtx.fenceSync(glCtx.SYNC_GPU_COMMANDS_COMPLETE, 0);
          glCtx.flush();
          const poll = () => {
            if (disposed) return;
            const status = sync ? glCtx.clientWaitSync(sync, 0, 0) : glCtx.ALREADY_SIGNALED;
            if (status === glCtx.TIMEOUT_EXPIRED) {
              timeoutId = setTimeout(poll, 4);
              return;
            }
            if (sync) glCtx.deleteSync(sync);
            timeoutId = setTimeout(cb, 80);
          };
          timeoutId = setTimeout(poll, 4);
        } else {
          rafId = window.requestAnimationFrame(cb);
        }
      };

      const tick = () => {
        if (disposed || !renderer || !scene) return;
        const state = liveStateRef.current;
        const elapsed = prefersReducedMotion ? 0 : (performance.now() - startTime) * 0.001;

        if (state.backdropMode === 'studio3d') {
          renderer.setClearColor(0x050a18, 1);
          scene.fog = new THREE.FogExp2(0x050a18, 0.085);
          floorGrid.visible = true;
        } else {
          renderer.setClearColor(0x000000, 0);
          scene.fog = null;
          floorGrid.visible = false;
        }

        const scaleNorm = state.arScalePct / 100;
        arPivot.scale.setScalar(scaleNorm);
        arPivot.rotation.y = (state.arRotationDeg * Math.PI) / 180;

        rig.update(elapsed, state);
        controls?.update();
        renderer.render(scene, camera);

        afterDraw(tick);
      };

      tick();

      return () => {
        disposed = true;
        if (rafId) window.cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
        resizeObs?.disconnect();
        controls?.dispose();
        disposeSceneTree(arPivot);
        floorGrid.geometry.dispose();
        (floorGrid.material as THREE.Material).dispose();
        envTarget?.dispose();
        pmremGenerator?.dispose();
        if (renderer) {
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          renderer.dispose();
        }
      };
    } catch {
      setWebglUnsupported(true);
    }
  }, [disciplineId, accentHex]);

  // Synchronized Discipline-Specific 4D SVG Projection Fallback (also active in headless/JSDOM)
  if (webglUnsupported) {
    const t = telemetry.timeProgress01;
    const pct = Math.round(t * 100);
    const scaleNorm = arScalePct / 100;
    const { thermalNormalized01, liveTempC, capillaryBleed01, laserSweepNorm01, defectSeverity01 } =
      telemetry.visualState;

    return (
      <div
        data-testid="vtmtptpwht-ar4d-svg-fallback"
        className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
          backdropMode === 'studio3d' ? 'bg-[#050a18]' : 'bg-transparent'
        }`}
      >
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full pointer-events-none"
          aria-label={isAr ? `عرض AR + 4D لتخصص ${disciplineId}` : `AR + 4D projection for ${disciplineId}`}
        >
          <g transform={`translate(400, 225) rotate(${arRotationDeg}) scale(${scaleNorm})`}>
            {/* Base Steel Specimen Plate */}
            <rect
              x="-250"
              y="-82"
              width="500"
              height="164"
              rx="16"
              fill="rgba(15, 23, 42, 0.54)"
              stroke={accentHex}
              strokeWidth="2.4"
              strokeDasharray="8 5"
            />
            {/* Weld Bead Axis */}
            <rect
              x="-24"
              y="-86"
              width="48"
              height="172"
              rx="6"
              fill="rgba(148, 163, 184, 0.25)"
              stroke="#cbd5e1"
              strokeWidth="1.6"
            />

            {disciplineId === 'vt' && (
              <g data-testid="svg-4d-vt-layer">
                {/* Undercut Groove Marker */}
                <rect
                  x="20"
                  y="-42"
                  width="8"
                  height="84"
                  rx="2"
                  fill="#f43f5e"
                  fillOpacity={0.35 + defectSeverity01 * 0.55}
                />
                {/* Sliding Cambridge Caliper & Laser Scan Fan */}
                <line
                  x1="-165"
                  y1={-66 + laserSweepNorm01 * 132}
                  x2="165"
                  y2={-66 + laserSweepNorm01 * 132}
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
                <rect
                  x="-54"
                  y={-82 + laserSweepNorm01 * 132}
                  width="108"
                  height="32"
                  rx="6"
                  fill="rgba(14, 165, 233, 0.3)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              </g>
            )}

            {disciplineId === 'mt' && (
              <g
                data-testid="svg-4d-mt-layer"
                transform={mtTwoWay && t > 0.48 ? 'rotate(90)' : 'rotate(0)'}
              >
                {/* Yoke Poles & Curved Flux Leakage Field */}
                <circle cx="-115" cy="0" r="18" fill="rgba(236, 72, 153, 0.28)" stroke="#ec4899" strokeWidth="2.5" />
                <circle cx="115" cy="0" r="18" fill="rgba(56, 189, 248, 0.28)" stroke="#38bdf8" strokeWidth="2.5" />
                <path
                  d="M -98 -10 Q 0 -75 98 -10 M -98 0 L 98 0 M -98 10 Q 0 75 98 10"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.4"
                  strokeDasharray="6 4"
                />
                {/* Glowing Fluorescent Particle Cluster at Crack */}
                <ellipse
                  cx="4"
                  cy="0"
                  rx={12 + defectSeverity01 * 12}
                  ry={28 + t * 24}
                  fill="rgba(244, 114, 182, 0.45)"
                  stroke="#f472b6"
                  strokeWidth="2"
                />
              </g>
            )}

            {disciplineId === 'pt' && (
              <g data-testid="svg-4d-pt-layer">
                {/* Expanding Capillary Bleed-Out Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={18 + capillaryBleed01 * (36 + defectSeverity01 * 28)}
                  fill="rgba(168, 85, 247, 0.34)"
                  stroke="#e879f9"
                  strokeWidth="2.6"
                />
                <rect x="-4" y="-34" width="8" height="68" rx="3" fill="#e879f9" />
              </g>
            )}

            {disciplineId === 'pwht' && (
              <g data-testid="svg-4d-pwht-layer">
                {/* FCP Ceramic Pad Glow Zones */}
                <rect
                  x="-76"
                  y="-92"
                  width="152"
                  height="184"
                  rx="8"
                  fill={`rgba(244, 63, 94, ${0.15 + thermalNormalized01 * 0.58})`}
                  stroke="#f59e0b"
                  strokeWidth="2.4"
                />
                {/* Live 4D Trapezoidal Thermal Curve Sparkline */}
                <polyline
                  points="-210,126 -110,58 105,58 210,118"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.6"
                />
                <circle
                  cx={-210 + t * 420}
                  cy={
                    t < 0.34
                      ? 126 - (t / 0.34) * 68
                      : t < 0.72
                        ? 58
                        : 58 + ((t - 0.72) / 0.28) * 60
                  }
                  r="7"
                  fill="#fef08a"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="150"
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="13"
                  fontFamily="monospace"
                >
                  {liveTempC}°C / {pwhtTargetC}°C
                </text>
              </g>
            )}

            <text
              x="0"
              y="-116"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="15"
              fontFamily="monospace"
              fontWeight="bold"
            >
              AR+4D {disciplineId.toUpperCase()} · t={pct}% · {telemetry.metric1Value}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="vtmtptpwht-ar4d-three-canvas"
      className="relative w-full h-full"
    />
  );
};
