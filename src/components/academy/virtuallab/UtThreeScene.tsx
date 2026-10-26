import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Box, Eye, Layers } from 'lucide-react';
import { Language } from '../../../types';
import { Defect3DWireframeSpec } from '../../../utils/discoveredDefectsStore';

export interface UtThreeSceneProps {
  language?: Language;
  blockType: 'iiw_v1' | 'step_wedge' | 'angle_weld' | 'mt_yoke';
  // UT probe properties
  probePositionMm: number; // position on block surface
  probeAngleDeg: number; // 0 (normal), 45, 60, 70
  probePreset?: 'A' | 'B' | 'C' | 'D'; // IIW positions
  selectedStep?: number; // 1 to 5 for step wedge
  // Inspection parameters
  plateThicknessMm?: number;
  defectLocationMm?: number;
  defectDetected?: boolean;
  // 3D Wireframe Overlays of Detected Weld Defects (Depth Z & Length L)
  detectedWireframeOverlays?: Defect3DWireframeSpec[];
  showDefectWireframes?: boolean;
  xraySpecimenMode?: boolean;
  onToggleDefectWireframes?: () => void;
  onToggleXraySpecimen?: () => void;
  // MT parameters
  isYokeEnergized?: boolean;
  areParticlesApplied?: boolean;
  crackAngleDeg?: number; // 90 = perpendicular, 0 = parallel
}

function getSeverityHex(severity: Defect3DWireframeSpec['severity'], isLiveActive?: boolean): number {
  if (isLiveActive) return 0x22d3ee; // Electric cyan highlight when actively intersected
  if (severity === 'Critical') return 0xef4444;
  if (severity === 'High') return 0xf59e0b;
  if (severity === 'Moderate') return 0x38bdf8;
  return 0x34d399;
}

function getSeverityCssColor(severity: Defect3DWireframeSpec['severity'], isLiveActive?: boolean): string {
  if (isLiveActive) return '#22d3ee';
  if (severity === 'Critical') return '#f87171';
  if (severity === 'High') return '#fbbf24';
  if (severity === 'Moderate') return '#38bdf8';
  return '#34d399';
}

/**
 * Generates a razor-sharp procedural CanvasTexture callout badge for 3D dimension annotations
 * (Depth Z and Length L) with SRGBColorSpace and anisotropic filtering.
 */
function createDimensionCalloutSprite(
  primaryText: string,
  secondaryText: string,
  accentCss: string,
  maxAnisotropy: number,
  disposables: Array<{ dispose: () => void }>
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Crisp dark instrument callout card
    ctx.fillStyle = 'rgba(7, 12, 26, 0.92)';
    ctx.strokeStyle = accentCss;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 18);
    } else {
      ctx.rect(8, 8, canvas.width - 16, canvas.height - 16);
    }
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 34px "JetBrains Mono", "IBM Plex Mono", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textBaseline = 'middle';
    ctx.fillText(primaryText, 28, 48);

    ctx.font = 'bold 26px "JetBrains Mono", "IBM Plex Mono", monospace';
    ctx.fillStyle = accentCss;
    ctx.fillText(secondaryText, 28, 88);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  texture.needsUpdate = true;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  disposables.push(texture, spriteMat);

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.55, 0.64, 1);
  sprite.renderOrder = 18;
  return sprite;
}

/**
 * Recursively disposes geometries, materials, and procedural textures inside a Three.js Object3D tree.
 */
function disposeObjectTree(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const meshOrLine = child as THREE.Mesh | THREE.Line | THREE.Points;
    if (meshOrLine.geometry) {
      meshOrLine.geometry.dispose();
    }
    const mat = (meshOrLine as THREE.Mesh).material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        const tex = (m as THREE.MeshStandardMaterial).map;
        if (tex) tex.dispose();
        m.dispose();
      });
    } else if (mat) {
      const tex = (mat as THREE.SpriteMaterial).map;
      if (tex) tex.dispose();
      mat.dispose();
    }
  });
}

export const UtThreeScene: React.FC<UtThreeSceneProps> = ({
  language = 'ar',
  blockType,
  probePositionMm,
  probeAngleDeg,
  probePreset = 'B',
  selectedStep = 1,
  plateThicknessMm = 20,
  defectDetected = false,
  detectedWireframeOverlays = [],
  showDefectWireframes = true,
  xraySpecimenMode = false,
  onToggleDefectWireframes,
  onToggleXraySpecimen,
  isYokeEnergized = false,
  areParticlesApplied = false,
  crackAngleDeg = 90,
}) => {
  const isAr = language === 'ar';
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Local fallback toggles if parent does not control them
  const [internalShowWireframes, setInternalShowWireframes] = useState(true);
  const [internalXrayMode, setInternalXrayMode] = useState(false);

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

  // References to keep track of mutable Three.js objects across prop updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const probeGroupRef = useRef<THREE.Group | null>(null);
  const soundBeamRef = useRef<THREE.Group | null>(null);
  const particlesGroupRef = useRef<THREE.Group | null>(null);
  const fluxLinesGroupRef = useRef<THREE.Group | null>(null);
  const defectMeshRef = useRef<THREE.Mesh | null>(null);
  const energizedRef = useRef<boolean>(isYokeEnergized);
  energizedRef.current = isYokeEnergized;

  // Camera Orbit controls state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 24, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a1a);
    scene.fog = new THREE.FogExp2(0x070a1a, 0.014);
    sceneRef.current = scene;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const updateCameraPos = () => {
      const { radius, theta, phi } = cameraSphericalRef.current;
      camera.position.x = targetLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = targetLookAt.current.y + radius * Math.cos(phi);
      camera.position.z = targetLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(targetLookAt.current);
    };
    updateCameraPos();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglUnavailable(true);
    };
    const onContextRestored = () => {
      setWebglUnavailable(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    try {
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
    } catch {
      // fallback in headless contexts
    }
    pmremGenerator.dispose();

    // Warm/cool 3-point studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xbbe1ff, 0x0f172a, 0.95);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 2.3);
    dirLight1.position.set(15, 25, 20);
    dirLight1.castShadow = !isSoftwareGl;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x88bbff, 1.15);
    dirLight2.position.set(-15, 12, -15);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.4, 30);
    pointLight.position.set(0, 10, 5);
    scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // Paced animation loop (respecting software WebGL fenceSync pacing)
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (isDisposed) return;
      const elapsedTime = clock.getElapsedTime();

      if (soundBeamRef.current) {
        soundBeamRef.current.children.forEach((child, idx) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const baseOpacity = child.userData.baseOpacity || 0.6;
            child.material.opacity = baseOpacity + Math.sin(elapsedTime * 6 + idx) * 0.14;
          }
        });
      }

      if (fluxLinesGroupRef.current && energizedRef.current) {
        fluxLinesGroupRef.current.children.forEach((line, idx) => {
          if (line instanceof THREE.Line && line.material instanceof THREE.LineBasicMaterial) {
            line.material.opacity = 0.5 + Math.sin(elapsedTime * 12 + idx) * 0.38;
          }
        });
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
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
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.008;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.008)
      );

      updateCameraPos();
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        8,
        Math.min(45, cameraSphericalRef.current.radius + e.deltaY * 0.02)
      );
      updateCameraPos();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('webglcontextlost', onContextLost);
      dom.removeEventListener('webglcontextrestored', onContextRestored);
      resizeObserver.disconnect();

      disposeObjectTree(scene);
      scene.clear();
      renderer.dispose();
      if (mount.contains(dom)) {
        mount.removeChild(dom);
      }
    };
  }, []);

  // Re-build 3D Scene & Wireframe Overlays when blockType, specimen state, or detected defects change
  useEffect(() => {
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
    const extraDisposables: Array<{ dispose: () => void }> = [];

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 1.2,
    });

    const specimenSteelMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: xrayActive ? 0.55 : 0.85,
      roughness: 0.25,
      envMapIntensity: 1.2,
      transparent: xrayActive,
      opacity: xrayActive ? 0.36 : 1.0,
      depthWrite: !xrayActive,
    });

    const polishedSteelMaterial = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 1.5,
    });

    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.3,
    });

    const perspexMaterial = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
    });

    const probeBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.4,
      roughness: 0.4,
    });

    const probeWearPlateMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
    });

    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
    });

    // -------------------------------------------------------------
    // BLOCK 1: IIW TYPE 1 (V1) CALIBRATION BLOCK
    // -------------------------------------------------------------
    if (blockType === 'iiw_v1') {
      const iiwGroup = new THREE.Group();
      const blockLength = 14;
      const blockHeight = 4.6;
      const blockDepth = 1.2;

      const slabGeo = new THREE.BoxGeometry(blockLength, blockHeight, blockDepth);
      const slabMesh = new THREE.Mesh(slabGeo, steelMaterial);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      iiwGroup.add(slabMesh);

      const arcGeo = new THREE.CylinderGeometry(
        blockHeight * 0.95,
        blockHeight * 0.95,
        blockDepth,
        32,
        1,
        false,
        -Math.PI / 2,
        Math.PI
      );
      arcGeo.rotateX(Math.PI / 2);
      const arcMesh = new THREE.Mesh(arcGeo, polishedSteelMaterial);
      arcMesh.position.set(-blockLength / 2, 0, 0);
      arcMesh.castShadow = true;
      iiwGroup.add(arcMesh);

      const sdhGeo = new THREE.CylinderGeometry(0.12, 0.12, blockDepth + 0.1, 16);
      sdhGeo.rotateX(Math.PI / 2);
      const sdhMat = new THREE.MeshBasicMaterial({ color: 0x030712 });
      const sdhMesh = new THREE.Mesh(sdhGeo, sdhMat);
      sdhMesh.position.set(2.5, 0.8, 0);
      iiwGroup.add(sdhMesh);

      const perspexGeo = new THREE.CylinderGeometry(1.2, 1.2, blockDepth + 0.05, 32);
      perspexGeo.rotateX(Math.PI / 2);
      const perspexMesh = new THREE.Mesh(perspexGeo, perspexMaterial);
      perspexMesh.position.set(-2, -0.6, 0);
      iiwGroup.add(perspexMesh);

      const stepCutGeo = new THREE.BoxGeometry(2.5, 1.2, blockDepth + 0.05);
      const stepCutMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.7,
        roughness: 0.4,
      });
      const stepCutMesh = new THREE.Mesh(stepCutGeo, stepCutMat);
      stepCutMesh.position.set(5.5, -1.7, 0);
      iiwGroup.add(stepCutMesh);

      for (let deg = 40; deg <= 75; deg += 5) {
        const rad = (deg * Math.PI) / 180;
        const tickGeo = new THREE.BoxGeometry(0.04, 0.35, blockDepth + 0.02);
        const tickMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const tickMesh = new THREE.Mesh(tickGeo, tickMat);
        const arcR = blockHeight * 0.95;
        tickMesh.position.set(
          -blockLength / 2 + Math.cos(rad) * arcR * 0.9,
          Math.sin(rad) * arcR * 0.9,
          0
        );
        tickMesh.rotation.z = rad - Math.PI / 2;
        iiwGroup.add(tickMesh);
      }

      root.add(iiwGroup);

      const probeGroup = new THREE.Group();
      const probeCasingGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.4, 24);
      const probeCasingMesh = new THREE.Mesh(probeCasingGeo, probeBodyMaterial);
      probeGroup.add(probeCasingMesh);

      const wearPlateGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.15, 24);
      const wearPlateMesh = new THREE.Mesh(wearPlateGeo, probeWearPlateMaterial);
      wearPlateMesh.position.y = -0.7;
      probeGroup.add(wearPlateMesh);

      const bncGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16);
      const bncMesh = new THREE.Mesh(bncGeo, brassMaterial);
      bncMesh.position.y = 0.9;
      probeGroup.add(bncMesh);

      const cableCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(0.5, 2.0, 0.5),
        new THREE.Vector3(2.0, 2.8, 1.5),
        new THREE.Vector3(3.5, 2.5, 3.0),
      ]);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 20, 0.08, 8, false);
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      probeGroup.add(cableMesh);

      const couplantGeo = new THREE.RingGeometry(0.1, 0.8, 24);
      couplantGeo.rotateX(-Math.PI / 2);
      const couplantMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
      });
      const couplantMesh = new THREE.Mesh(couplantGeo, couplantMat);
      couplantMesh.position.y = -0.78;
      probeGroup.add(couplantMesh);

      root.add(probeGroup);
      probeGroupRef.current = probeGroup;

      const beamGroup = new THREE.Group();
      const beamGeo = new THREE.ConeGeometry(0.9, 4.4, 24, 1, true);
      beamGeo.rotateX(Math.PI);
      beamGeo.translate(0, -2.2, 0);

      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.userData = { baseOpacity: 0.45 };
      beamGroup.add(beamMesh);

      const rayGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.4, 8);
      rayGeo.translate(0, -2.2, 0);
      const rayMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const rayMesh = new THREE.Mesh(rayGeo, rayMat);
      beamGroup.add(rayMesh);

      const impactRingGeo = new THREE.RingGeometry(0.2, 0.6, 24);
      impactRingGeo.rotateX(-Math.PI / 2);
      const impactRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
      });
      const impactRingMesh = new THREE.Mesh(impactRingGeo, impactRingMat);
      impactRingMesh.position.y = -4.4;
      beamGroup.add(impactRingMesh);

      probeGroup.add(beamGroup);
      soundBeamRef.current = beamGroup;
    }

    // -------------------------------------------------------------
    // BLOCK 2: 5-STEP WEDGE CALIBRATION BLOCK
    // -------------------------------------------------------------
    else if (blockType === 'step_wedge') {
      const stepGroup = new THREE.Group();
      const stepHeights = [0.8, 1.6, 2.4, 3.2, 4.0];
      const stepWidth = 2.4;
      const stepDepth = 2.8;

      stepHeights.forEach((h, idx) => {
        const xPos = (idx - 2) * stepWidth;
        const geo = new THREE.BoxGeometry(stepWidth - 0.04, h, stepDepth);
        const mesh = new THREE.Mesh(
          geo,
          idx === selectedStep - 1 ? polishedSteelMaterial : steelMaterial
        );
        mesh.position.set(xPos, h / 2 - 2, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        stepGroup.add(mesh);

        const labelGeo = new THREE.BoxGeometry(stepWidth * 0.7, 0.02, 0.4);
        const labelMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(xPos, h - 1.99, stepDepth / 2 - 0.35);
        stepGroup.add(labelMesh);
      });

      root.add(stepGroup);

      const probeGroup = new THREE.Group();
      const probeCasingGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.2, 24);
      const probeCasingMesh = new THREE.Mesh(probeCasingGeo, probeBodyMaterial);
      probeGroup.add(probeCasingMesh);

      const wearPlateGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.12, 24);
      const wearPlateMesh = new THREE.Mesh(wearPlateGeo, probeWearPlateMaterial);
      wearPlateMesh.position.y = -0.6;
      probeGroup.add(wearPlateMesh);

      const couplantGeo = new THREE.RingGeometry(0.1, 0.75, 24);
      couplantGeo.rotateX(-Math.PI / 2);
      const couplantMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
      });
      const couplantMesh = new THREE.Mesh(couplantGeo, couplantMat);
      couplantMesh.position.y = -0.66;
      probeGroup.add(couplantMesh);

      const currentH = stepHeights[selectedStep - 1] || 0.8;
      const xPos = (selectedStep - 1 - 2) * stepWidth;
      probeGroup.position.set(xPos, currentH - 2 + 0.66, 0);

      const beamGroup = new THREE.Group();
      const beamGeo = new THREE.CylinderGeometry(0.4, 0.4, currentH, 16);
      beamGeo.translate(0, -currentH / 2 - 0.66, 0);
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.5,
        emissive: 0x0284c7,
        emissiveIntensity: 0.7,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamGroup.add(beamMesh);

      const echoGeo = new THREE.RingGeometry(0.1, 0.45, 16);
      echoGeo.rotateX(-Math.PI / 2);
      const echoMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
      const echoMesh = new THREE.Mesh(echoGeo, echoMat);
      echoMesh.position.y = -currentH - 0.66;
      beamGroup.add(echoMesh);

      probeGroup.add(beamGroup);
      root.add(probeGroup);
      probeGroupRef.current = probeGroup;
      soundBeamRef.current = beamGroup;
    }

    // -------------------------------------------------------------
    // BLOCK 3: ANGLE BEAM WELD INSPECTION + 3D DEFECT WIREFRAME OVERLAYS
    // -------------------------------------------------------------
    else if (blockType === 'angle_weld') {
      const weldGroup = new THREE.Group();
      const plateWidth = 14;
      const plateH = 2.2; // represents plateThicknessMm (default 20 mm)
      const plateDepth = 5.0; // represents 50 mm visible weld seam span (center Y = 50 mm)

      // Base Plate + Specimen Wireframe Outline when X-Ray mode is active
      const plateGeo = new THREE.BoxGeometry(plateWidth, plateH, plateDepth);
      const plateMesh = new THREE.Mesh(plateGeo, specimenSteelMaterial);
      plateMesh.position.y = -plateH / 2;
      plateMesh.castShadow = !xrayActive;
      plateMesh.receiveShadow = true;
      weldGroup.add(plateMesh);

      // Subtle structural wireframe edge cage on the V-groove plate itself
      const plateEdgesGeo = new THREE.EdgesGeometry(plateGeo);
      const plateEdgesMat = new THREE.LineBasicMaterial({
        color: xrayActive ? 0x38bdf8 : 0x334155,
        transparent: true,
        opacity: xrayActive ? 0.55 : 0.3,
      });
      const plateEdges = new THREE.LineSegments(plateEdgesGeo, plateEdgesMat);
      plateEdges.position.y = -plateH / 2;
      weldGroup.add(plateEdges);

      // V-Groove Weld Seam (center reinforcement cap + internal V bevel wireframe)
      const capGeo = new THREE.CylinderGeometry(0.8, 1.2, plateDepth, 16);
      capGeo.rotateZ(Math.PI / 2);
      capGeo.rotateY(Math.PI / 2);
      const weldMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.45,
        metalness: 0.75,
        transparent: xrayActive,
        opacity: xrayActive ? 0.42 : 1.0,
        depthWrite: !xrayActive,
      });
      const weldCapMesh = new THREE.Mesh(capGeo, weldMat);
      weldCapMesh.position.set(0, 0.08, 0);
      weldGroup.add(weldCapMesh);

      // Internal Single-V Bevel Fusion Planes (Wireframe reference inside weld)
      const vGrooveShape = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.15, 0, -plateDepth / 2),
        new THREE.Vector3(-0.2, -plateH, -plateDepth / 2),
        new THREE.Vector3(0.2, -plateH, -plateDepth / 2),
        new THREE.Vector3(1.15, 0, -plateDepth / 2),
        new THREE.Vector3(1.15, 0, plateDepth / 2),
        new THREE.Vector3(0.2, -plateH, plateDepth / 2),
        new THREE.Vector3(-0.2, -plateH, plateDepth / 2),
        new THREE.Vector3(-1.15, 0, plateDepth / 2),
      ]);
      const vGrooveLine = new THREE.LineLoop(
        vGrooveShape,
        new THREE.LineBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.35,
        })
      );
      weldGroup.add(vGrooveLine);

      // Weld Root Bead at bottom
      const rootBeadGeo = new THREE.CylinderGeometry(0.35, 0.55, plateDepth, 16);
      rootBeadGeo.rotateX(Math.PI / 2);
      const rootBeadMesh = new THREE.Mesh(rootBeadGeo, weldMat);
      rootBeadMesh.position.set(0, -plateH, 0);
      weldGroup.add(rootBeadMesh);

      // Heat-Affected Zone (HAZ) subtle bands on both sides (polygonOffset to prevent Z-fighting)
      [-1.35, 1.35].forEach((xOff) => {
        const hazGeo = new THREE.BoxGeometry(0.35, 0.03, plateDepth);
        const hazMat = new THREE.MeshBasicMaterial({
          color: 0x92400e,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const hazMesh = new THREE.Mesh(hazGeo, hazMat);
        hazMesh.position.set(xOff, 0.015, 0);
        weldGroup.add(hazMesh);
      });

      // Internal Physical Weld Root Crack Solid Core
      const crackGeo = new THREE.BoxGeometry(0.22, 0.42, 1.2);
      const crackMat = new THREE.MeshStandardMaterial({
        color: defectDetected ? 0xef4444 : 0x7f1d1d,
        emissive: defectDetected ? 0xef4444 : 0x330000,
        emissiveIntensity: defectDetected ? 1.35 : 0.25,
      });
      const crackMesh = new THREE.Mesh(crackGeo, crackMat);
      crackMesh.position.set(0, -plateH + 0.24, 0);
      weldGroup.add(crackMesh);
      defectMeshRef.current = crackMesh;

      // -----------------------------------------------------------
      // 3D DETECTED DEFECT WIREFRAME OVERLAYS (Exact Depth Z & Length L)
      // -----------------------------------------------------------
      if (wireframesVisible && detectedWireframeOverlays.length > 0) {
        const wireframeOverlayGroup = new THREE.Group();

        detectedWireframeOverlays.forEach((ov, idx) => {
          const hexColor = getSeverityHex(ov.severity, ov.isLiveActive);
          const cssColor = getSeverityCssColor(ov.severity, ov.isLiveActive);

          // Map physical millimeters onto the 3D weld specimen coordinates:
          // X: 10 mm = 1.0 scene unit (clamped to specimen width)
          // Y (vertical depth): Z=0 mm -> y=0, Z=plateThicknessMm -> y=-plateH
          // Z (along weld seam): yMm=50 -> z=0, 10 mm = 1.0 scene unit
          const xScene = THREE.MathUtils.clamp(ov.xMm / 10, -5.2, 5.2);
          const zScene = THREE.MathUtils.clamp(((ov.yMm - 50) / 10), -plateDepth * 0.38, plateDepth * 0.38);
          const depthRatio = THREE.MathUtils.clamp(ov.calculatedDepthMm / Math.max(1, plateThicknessMm), 0, 1.15);
          const targetDepthY = -depthRatio * plateH;

          const lengthScene = THREE.MathUtils.clamp(ov.calculatedLengthMm / 10, 0.36, plateDepth * 0.88);
          const heightScene = THREE.MathUtils.clamp(
            (ov.heightMm / Math.max(1, plateThicknessMm)) * plateH,
            0.22,
            plateH * 0.55
          );
          const widthScene = THREE.MathUtils.clamp(ov.transverseWidthMm / 10, 0.26, 1.8);

          // Ensure subsurface bounding box sits cleanly within/at root when Z ≈ plateThicknessMm
          const boxCenterY = THREE.MathUtils.clamp(
            targetDepthY + (depthRatio >= 0.88 ? heightScene * 0.45 : 0),
            -plateH + heightScene * 0.45,
            -heightScene * 0.45
          );

          // 1. Subsurface X-Ray Wireframe Bounding Cage (visible directly through solid steel!)
          const flawBoxGeo = new THREE.BoxGeometry(widthScene, heightScene, lengthScene, 2, 1, 3);
          const flawLatticeMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            wireframe: true,
            transparent: true,
            opacity: ov.isLiveActive ? 0.52 : 0.34,
            depthTest: false,
            depthWrite: false,
          });
          const flawLatticeMesh = new THREE.Mesh(flawBoxGeo, flawLatticeMat);
          flawLatticeMesh.position.set(xScene, boxCenterY, zScene);
          flawLatticeMesh.renderOrder = 11;
          wireframeOverlayGroup.add(flawLatticeMesh);

          const flawEdgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(widthScene, heightScene, lengthScene));
          const flawEdgesMat = new THREE.LineBasicMaterial({
            color: hexColor,
            transparent: true,
            opacity: 0.98,
            depthTest: false,
            depthWrite: false,
          });
          const flawEdges = new THREE.LineSegments(flawEdgesGeo, flawEdgesMat);
          flawEdges.position.set(xScene, boxCenterY, zScene);
          flawEdges.renderOrder = 12;
          wireframeOverlayGroup.add(flawEdges);

          // 2. Top-Surface Projection Footprint (Z = 0 mm Weld Cap) + 4 Corner Depth Drop-Lines
          const surfY = 0.035;
          const halfW = widthScene / 2;
          const halfL = lengthScene / 2;
          const topBoxY = boxCenterY + heightScene / 2;

          const footprintPts = [
            new THREE.Vector3(xScene - halfW, surfY, zScene - halfL),
            new THREE.Vector3(xScene + halfW, surfY, zScene - halfL),
            new THREE.Vector3(xScene + halfW, surfY, zScene + halfL),
            new THREE.Vector3(xScene - halfW, surfY, zScene + halfL),
          ];
          const footprintGeo = new THREE.BufferGeometry().setFromPoints(footprintPts);
          const footprintLoop = new THREE.LineLoop(
            footprintGeo,
            new THREE.LineBasicMaterial({
              color: hexColor,
              transparent: true,
              opacity: 0.85,
              depthTest: false,
            })
          );
          footprintLoop.renderOrder = 12;
          wireframeOverlayGroup.add(footprintLoop);

          // 4 Vertical Projection Drop-Lines connecting Z=0 surface footprint to subsurface wireframe
          const dropVertices: THREE.Vector3[] = [];
          [
            [-halfW, -halfL],
            [halfW, -halfL],
            [halfW, halfL],
            [-halfW, halfL],
          ].forEach(([dx, dz]) => {
            dropVertices.push(
              new THREE.Vector3(xScene + dx, surfY, zScene + dz),
              new THREE.Vector3(xScene + dx, topBoxY, zScene + dz)
            );
          });
          const dropLinesGeo = new THREE.BufferGeometry().setFromPoints(dropVertices);
          const dropLines = new THREE.LineSegments(
            dropLinesGeo,
            new THREE.LineBasicMaterial({
              color: 0x94a3b8,
              transparent: true,
              opacity: 0.55,
              depthTest: false,
            })
          );
          dropLines.renderOrder = 10;
          wireframeOverlayGroup.add(dropLines);

          // 3. Exact Calculated DEPTH (Z) 3D Caliper Leader + Sprite Callout
          // Render full 3D dimension calipers for the primary/live defect and up to 3 overlays cleanly
          if (idx < 3) {
            const caliperOffsetX = xScene + halfW + 0.55 + idx * 0.45;
            const depthTick = 0.18;
            const depthCaliperPts = [
              // Top tick at Z = 0 mm surface
              new THREE.Vector3(caliperOffsetX - depthTick, 0, zScene),
              new THREE.Vector3(caliperOffsetX + depthTick, 0, zScene),
              // Vertical shaft from surface Z=0 down to exact calculatedDepthMm
              new THREE.Vector3(caliperOffsetX, 0, zScene),
              new THREE.Vector3(caliperOffsetX, targetDepthY, zScene),
              // Bottom tick at Z = calculatedDepthMm
              new THREE.Vector3(caliperOffsetX - depthTick, targetDepthY, zScene),
              new THREE.Vector3(caliperOffsetX + depthTick, targetDepthY, zScene),
              // Horizontal witness line from defect wireframe to caliper
              new THREE.Vector3(xScene + halfW, targetDepthY, zScene),
              new THREE.Vector3(caliperOffsetX, targetDepthY, zScene),
            ];
            const depthCaliperGeo = new THREE.BufferGeometry().setFromPoints(depthCaliperPts);
            const depthCaliperLines = new THREE.LineSegments(
              depthCaliperGeo,
              new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.95,
                depthTest: false,
              })
            );
            depthCaliperLines.renderOrder = 14;
            wireframeOverlayGroup.add(depthCaliperLines);

            // 4. Exact Calculated LENGTH (L) 3D Caliper Leader along the weld seam
            const lenOffsetY = boxCenterY - heightScene / 2 - 0.28;
            const lenTick = 0.16;
            const lengthCaliperPts = [
              // Start tick at -L/2
              new THREE.Vector3(xScene, lenOffsetY - lenTick, zScene - halfL),
              new THREE.Vector3(xScene, lenOffsetY + lenTick, zScene - halfL),
              // Longitudinal shaft spanning exact calculatedLengthMm
              new THREE.Vector3(xScene, lenOffsetY, zScene - halfL),
              new THREE.Vector3(xScene, lenOffsetY, zScene + halfL),
              // End tick at +L/2
              new THREE.Vector3(xScene, lenOffsetY - lenTick, zScene + halfL),
              new THREE.Vector3(xScene, lenOffsetY + lenTick, zScene + halfL),
            ];
            const lengthCaliperGeo = new THREE.BufferGeometry().setFromPoints(lengthCaliperPts);
            const lengthCaliperLines = new THREE.LineSegments(
              lengthCaliperGeo,
              new THREE.LineBasicMaterial({
                color: 0xfbbf24,
                transparent: true,
                opacity: 0.95,
                depthTest: false,
              })
            );
            lengthCaliperLines.renderOrder = 14;
            wireframeOverlayGroup.add(lengthCaliperLines);

            // 5. High-DPI 3D Dimension Callout Badge Sprite pinned beside the wireframe
            const badgeSprite = createDimensionCalloutSprite(
              `${ov.codeSymbol} · Z: ${ov.calculatedDepthMm.toFixed(1)} mm`,
              `Length L: ${ov.calculatedLengthMm.toFixed(1)} mm`,
              cssColor,
              maxAnisotropy,
              extraDisposables
            );
            badgeSprite.position.set(
              caliperOffsetX + 1.45,
              THREE.MathUtils.clamp(targetDepthY * 0.55, -plateH + 0.3, -0.35),
              zScene
            );
            wireframeOverlayGroup.add(badgeSprite);
          }
        });

        weldGroup.add(wireframeOverlayGroup);
      }

      root.add(weldGroup);

      // Angle Probe with Perspex Wedge (45°, 60°, 70°)
      const probeGroup = new THREE.Group();
      const wedgeGeo = new THREE.BoxGeometry(1.8, 1.2, 1.4);
      const wedgeMat = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.8,
        roughness: 0.15,
      });
      const wedgeMesh = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedgeMesh.position.y = 0.6;
      probeGroup.add(wedgeMesh);

      const crystalGeo = new THREE.BoxGeometry(0.8, 0.2, 1.0);
      crystalGeo.rotateZ((-probeAngleDeg * Math.PI) / 180 / 2);
      const crystalMesh = new THREE.Mesh(crystalGeo, probeBodyMaterial);
      crystalMesh.position.set(-0.3, 1.2, 0);
      probeGroup.add(crystalMesh);

      const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8);
      cableGeo.rotateZ(Math.PI / 4);
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      cableMesh.position.set(-1.0, 2.0, 0);
      probeGroup.add(cableMesh);

      root.add(probeGroup);
      probeGroupRef.current = probeGroup;

      // Dynamic 3D Sound Beam (Leg 1 direct to bottom wall, Leg 2 skip bounce)
      const beamGroup = new THREE.Group();
      const angleRad = (probeAngleDeg * Math.PI) / 180;
      const leg1X = Math.tan(angleRad) * plateH;

      const leg1Path = new THREE.LineCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(leg1X, -plateH, 0)
      );
      const leg1Geo = new THREE.TubeGeometry(leg1Path, 10, 0.1, 8, false);
      const beamMat = new THREE.MeshStandardMaterial({
        color: defectDetected ? 0xf59e0b : 0x38bdf8,
        emissive: defectDetected ? 0xf59e0b : 0x0284c7,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.85,
      });
      const leg1Mesh = new THREE.Mesh(leg1Geo, beamMat);
      beamGroup.add(leg1Mesh);

      const bottomBounceGeo = new THREE.RingGeometry(0.1, 0.35, 16);
      bottomBounceGeo.rotateX(-Math.PI / 2);
      const bottomBounceMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const bottomBounceMesh = new THREE.Mesh(bottomBounceGeo, bottomBounceMat);
      bottomBounceMesh.position.set(leg1X, -plateH, 0);
      beamGroup.add(bottomBounceMesh);

      const leg2Path = new THREE.LineCurve3(
        new THREE.Vector3(leg1X, -plateH, 0),
        new THREE.Vector3(leg1X * 2, 0, 0)
      );
      const leg2Geo = new THREE.TubeGeometry(leg2Path, 10, 0.08, 8, false);
      const leg2Mesh = new THREE.Mesh(leg2Geo, beamMat);
      beamGroup.add(leg2Mesh);

      probeGroup.add(beamGroup);
      soundBeamRef.current = beamGroup;
    }

    // -------------------------------------------------------------
    // BLOCK 4: MAGNETIC PARTICLE TESTING (MT) YOKE + SURFACE CRACK WIREFRAME
    // -------------------------------------------------------------
    else if (blockType === 'mt_yoke') {
      const mtGroup = new THREE.Group();

      const plateGeo = new THREE.BoxGeometry(12, 1.5, 8);
      const plateMesh = new THREE.Mesh(plateGeo, specimenSteelMaterial);
      plateMesh.position.y = -0.75;
      plateMesh.castShadow = !xrayActive;
      plateMesh.receiveShadow = true;
      mtGroup.add(plateMesh);

      const crackLength = 2.4; // 24.0 mm
      const crackWidth = 0.08;
      const crackRotRad = ((crackAngleDeg - 90) * Math.PI) / 180;
      const crackGeo = new THREE.BoxGeometry(crackLength, 0.16, crackWidth);
      crackGeo.rotateY(crackRotRad);
      const crackMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      const crackMesh = new THREE.Mesh(crackGeo, crackMat);
      crackMesh.position.set(0, -0.04, 0);
      mtGroup.add(crackMesh);

      // 3D Wireframe Overlay on MT Surface Crack when detected
      if (wireframesVisible && detectedWireframeOverlays.length > 0) {
        const mtWireGroup = new THREE.Group();
        const activeMt = detectedWireframeOverlays[0];
        const lenScene = THREE.MathUtils.clamp(activeMt.calculatedLengthMm / 10, 0.4, 3.2);
        const subDepthScene = THREE.MathUtils.clamp(activeMt.heightMm / 10, 0.15, 0.5);
        const cssCol = getSeverityCssColor(activeMt.severity, activeMt.isLiveActive);
        const hexCol = getSeverityHex(activeMt.severity, activeMt.isLiveActive);

        const wfHolder = new THREE.Group();
        wfHolder.rotation.y = crackRotRad;

        const boxG = new THREE.BoxGeometry(lenScene, subDepthScene, 0.24, 3, 1, 1);
        const wfMesh = new THREE.Mesh(
          boxG,
          new THREE.MeshBasicMaterial({
            color: hexCol,
            wireframe: true,
            transparent: true,
            opacity: 0.48,
            depthTest: false,
          })
        );
        wfMesh.position.set(0, -subDepthScene / 2 + 0.03, 0);
        wfMesh.renderOrder = 11;
        wfHolder.add(wfMesh);

        const edgeG = new THREE.EdgesGeometry(new THREE.BoxGeometry(lenScene, subDepthScene, 0.24));
        const edgeSeg = new THREE.LineSegments(
          edgeG,
          new THREE.LineBasicMaterial({
            color: hexCol,
            transparent: true,
            opacity: 0.98,
            depthTest: false,
          })
        );
        edgeSeg.position.set(0, -subDepthScene / 2 + 0.03, 0);
        edgeSeg.renderOrder = 12;
        wfHolder.add(edgeSeg);

        // Surface Length Caliper (L = calculatedLengthMm)
        const halfL = lenScene / 2;
        const calZ = 0.42;
        const calY = 0.06;
        const mtCalPts = [
          new THREE.Vector3(-halfL, calY, calZ - 0.14),
          new THREE.Vector3(-halfL, calY, calZ + 0.14),
          new THREE.Vector3(-halfL, calY, calZ),
          new THREE.Vector3(halfL, calY, calZ),
          new THREE.Vector3(halfL, calY, calZ - 0.14),
          new THREE.Vector3(halfL, calY, calZ + 0.14),
        ];
        const mtCalLine = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(mtCalPts),
          new THREE.LineBasicMaterial({ color: 0xfbbf24, depthTest: false })
        );
        mtCalLine.renderOrder = 14;
        wfHolder.add(mtCalLine);

        mtWireGroup.add(wfHolder);

        const mtSprite = createDimensionCalloutSprite(
          `${activeMt.codeSymbol} · Z: ${activeMt.calculatedDepthMm.toFixed(1)} mm`,
          `Length L: ${activeMt.calculatedLengthMm.toFixed(1)} mm`,
          cssCol,
          maxAnisotropy,
          extraDisposables
        );
        mtSprite.position.set(0, 1.05, 1.35);
        mtWireGroup.add(mtSprite);

        mtGroup.add(mtWireGroup);
      }

      const yokeGroup = new THREE.Group();
      const handleGeo = new THREE.BoxGeometry(7, 1.4, 1.6);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.6,
        metalness: 0.2,
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.y = 4.2;
      yokeGroup.add(handleMesh);

      const triggerGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
      const triggerMat = new THREE.MeshBasicMaterial({
        color: isYokeEnergized ? 0x22c55e : 0x18181b,
      });
      const triggerMesh = new THREE.Mesh(triggerGeo, triggerMat);
      triggerMesh.position.set(0, 3.4, 0.7);
      yokeGroup.add(triggerMesh);

      [-3.0, 3.0].forEach((xLeg, idx) => {
        const legGeo = new THREE.BoxGeometry(1.2, 3.6, 1.4);
        const legMesh = new THREE.Mesh(legGeo, steelMaterial);
        legMesh.position.set(xLeg, 2.0, 0);
        yokeGroup.add(legMesh);

        const footGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
        const footMesh = new THREE.Mesh(footGeo, polishedSteelMaterial);
        footMesh.position.set(xLeg, 0.2, 0);
        yokeGroup.add(footMesh);

        const poleLabelGeo = new THREE.BoxGeometry(0.6, 0.6, 0.02);
        const poleLabelMat = new THREE.MeshBasicMaterial({
          color: idx === 0 ? 0x3b82f6 : 0xef4444,
        });
        const poleLabelMesh = new THREE.Mesh(poleLabelGeo, poleLabelMat);
        poleLabelMesh.position.set(xLeg, 2.5, 0.71);
        yokeGroup.add(poleLabelMesh);
      });

      mtGroup.add(yokeGroup);
      root.add(mtGroup);

      const fluxGroup = new THREE.Group();
      if (isYokeEnergized) {
        for (let i = -3; i <= 3; i++) {
          const zOffset = (i / 3) * 1.8;
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-2.8, 0.25, zOffset),
            new THREE.Vector3(0, 0.9, zOffset * 1.3),
            new THREE.Vector3(2.8, 0.25, zOffset)
          );
          const points = curve.getPoints(24);
          const fluxGeo = new THREE.BufferGeometry().setFromPoints(points);
          const fluxLineMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.7,
          });
          const fluxLine = new THREE.Line(fluxGeo, fluxLineMat);
          fluxGroup.add(fluxLine);
        }
      }
      root.add(fluxGroup);
      fluxLinesGroupRef.current = fluxGroup;

      const particlesGroup = new THREE.Group();
      if (areParticlesApplied) {
        const fluxLeakageStrength = isYokeEnergized
          ? Math.sin((crackAngleDeg * Math.PI) / 180)
          : 0.05;
        const particleCount = 450;
        const pGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          let px = 0;
          let pz = 0;

          if (Math.random() < fluxLeakageStrength * 0.85) {
            const t = (Math.random() - 0.5) * crackLength;
            const spread = (Math.random() - 0.5) * 0.12 * (1.1 - fluxLeakageStrength);
            px = t * Math.cos(crackRotRad) - spread * Math.sin(crackRotRad);
            pz = t * Math.sin(crackRotRad) + spread * Math.cos(crackRotRad);
          } else {
            px = (Math.random() - 0.5) * 5.5;
            pz = (Math.random() - 0.5) * 4.0;
          }

          pPositions[i * 3] = px;
          pPositions[i * 3 + 1] = 0.03;
          pPositions[i * 3 + 2] = pz;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        const pMat = new THREE.PointsMaterial({
          color: isYokeEnergized && fluxLeakageStrength > 0.5 ? 0x22c55e : 0x1f2937,
          size: 0.12,
        });
        const particlesMesh = new THREE.Points(pGeo, pMat);
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
    selectedStep,
    probeAngleDeg,
    plateThicknessMm,
    isYokeEnergized,
    areParticlesApplied,
    crackAngleDeg,
    defectDetected,
    detectedWireframeOverlays,
    wireframesVisible,
    xrayActive,
  ]);

  // Update dynamic probe position
  useEffect(() => {
    const probe = probeGroupRef.current;
    if (!probe) return;

    if (blockType === 'iiw_v1') {
      if (probePreset === 'A') {
        probe.position.set(4.5, 2.3 + 0.78, 0);
        probe.rotation.set(0, 0, 0);
      } else if (probePreset === 'B') {
        probe.position.set(-1.0, 2.3 + 0.78, 0);
        probe.rotation.set(0, 0, 0);
      } else if (probePreset === 'C') {
        probe.position.set(-1.8, 2.3 + 0.78, 0);
        probe.rotation.set(0, 0, (-probeAngleDeg * Math.PI) / 180 / 4);
      } else if (probePreset === 'D') {
        probe.position.set(2.5, 2.3 + 0.78, 0);
        probe.rotation.set(0, 0, 0);
      }
    } else if (blockType === 'angle_weld') {
      const xStandoff = -(probePositionMm / 10);
      probe.position.set(xStandoff, 0, 0);
    }
  }, [blockType, probePreset, probePositionMm, probeAngleDeg]);

  const supportsDefectWireframe = blockType === 'angle_weld' || blockType === 'mt_yoke';

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] bg-[#070a1a] rounded-2xl overflow-hidden border border-[#1e293b] select-none">
      {/* Dedicated Isolated WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {webglUnavailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#070a1a]/95 p-6 text-center text-xs font-mono text-slate-300 pointer-events-none">
          2D Schematic Fallback Active · Probe X={probePositionMm}mm · ∠{probeAngleDeg}°
        </div>
      )}

      {/* Top-Left Minimal Spec Header (Solid rgba surface — zero backdrop-filter over WebGL) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-[#060916]/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 pointer-events-none">
        <span>
          {isAr
            ? 'محاكاة ثلاثية الأبعاد 3D · اسحب للتدوير / العجلة للتكبير'
            : 'Interactive 3D Viewport · Drag to Orbit / Scroll to Zoom'}
        </span>
      </div>

      {/* Top-Right Block Identification */}
      <div className="absolute top-3 right-3 bg-[#060916]/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-bold text-amber-400 pointer-events-none">
        {blockType === 'iiw_v1' &&
          (isAr ? 'كتلة المعايرة القياسية IIW V1 (ISO 2400)' : 'IIW Type 1 Block (ISO 2400)')}
        {blockType === 'step_wedge' &&
          (isAr ? 'كتلة الدرج المتدرجة 5-Step Wedge (ASTM E797)' : '5-Step Wedge (ASTM E797)')}
        {blockType === 'angle_weld' &&
          (isAr
            ? 'فحص اللحام بالزاوية + إسقاط الشبكة السلكية للعيوب'
            : 'Angle Weld Specimen + 3D Defect Wireframe')}
        {blockType === 'mt_yoke' &&
          (isAr
            ? 'الفحص بالشوكة المغناطيسية + الشبكة السلكية للشرخ'
            : 'MT AC Yoke + 3D Crack Wireframe')}
      </div>

      {/* Unified Bottom HUD Dock: Beam Legend + 3D Wireframe Overlay Toggles & Exact Depth/Length Readout */}
      {supportsDefectWireframe && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pointer-events-none">
          {/* Bottom-Left: Beam Path & Wireframe Controls */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#060916]/92 px-2.5 py-2 rounded-xl border border-slate-800 text-[11px] font-mono pointer-events-auto">
            <button
              type="button"
              onClick={handleToggleWireframes}
              aria-pressed={wireframesVisible}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${
                wireframesVisible
                  ? 'border-cyan-400/60 bg-cyan-950/70 text-cyan-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isAr
                  ? `الشبكة السلكية للعيوب: ${wireframesVisible ? 'مفعلة' : 'مخفية'}`
                  : `3D Defect Wireframe: ${wireframesVisible ? 'ON' : 'OFF'}`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleXray}
              aria-pressed={xrayActive}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${
                xrayActive
                  ? 'border-amber-400/60 bg-amber-950/70 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isAr
                  ? `شفافية العينة X-Ray: ${xrayActive ? 'مفعلة' : 'صلبة'}`
                  : `X-Ray Weld: ${xrayActive ? 'ON' : 'OFF'}`}
              </span>
            </button>

            {blockType === 'angle_weld' && (
              <div className="hidden xl:flex items-center gap-2 ps-1 text-[10.5px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-sky-400 inline-block rounded" />
                  <span>Leg 1</span>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-amber-400 inline-block rounded" />
                  <span>Leg 2</span>
                </span>
              </div>
            )}
          </div>

          {/* Bottom-Right: Live Semantic Readout of 3D Wireframe Overlays (Exact Calculated Depth & Length) */}
          {wireframesVisible && detectedWireframeOverlays.length > 0 && (
            <div
              role="region"
              aria-label={
                isAr
                  ? 'قراءات الشبكة السلكية ثلاثية الأبعاد للعيوب المكتشفة على العينة'
                  : '3D Weld Defect Wireframe Sizing Overlay'
              }
              className="bg-[#060916]/94 px-3 py-2 rounded-xl border border-cyan-500/40 text-[11px] font-mono tabular-nums space-y-1 pointer-events-auto max-w-md"
            >
              <div className="flex items-center gap-1.5 text-[10.5px] text-cyan-300 font-bold">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isAr
                    ? `إسقاط سلكي 3D مباشر على اللحام (${detectedWireframeOverlays.length}):`
                    : `3D Specimen Wireframe Overlay (${detectedWireframeOverlays.length} Flaw${
                        detectedWireframeOverlays.length > 1 ? 's' : ''
                      }):`}
                </span>
              </div>
              <div className="space-y-0.5">
                {detectedWireframeOverlays.slice(0, 3).map((ov) => (
                  <div
                    key={ov.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-slate-200"
                  >
                    <span className="font-bold text-white">{ov.codeSymbol}</span>
                    <span className="text-sky-300 font-semibold">
                      {isAr
                        ? `العمق المحسوب Z = ${ov.calculatedDepthMm.toFixed(1)} mm`
                        : `Depth Z = ${ov.calculatedDepthMm.toFixed(1)} mm`}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-300 font-semibold">
                      {isAr
                        ? `الطول المحسوب L = ${ov.calculatedLengthMm.toFixed(1)} mm`
                        : `Length L = ${ov.calculatedLengthMm.toFixed(1)} mm`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
