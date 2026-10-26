import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Focus,
  Layers,
  Maximize2,
  Ruler,
} from 'lucide-react';
import { Language } from '../../../types';
import {
  CalibrationBlockId,
  V2BlockThicknessMm,
} from '../../../data/v1v2CalibrationData';
import { playCalibrationClick } from '../../../utils/ndtAudioFeedback';

export interface V1V2ThreeSceneProps {
  language: Language;
  targetBlock: CalibrationBlockId;
  v2ThicknessMm: V2BlockThicknessMm;
  v2SdhDiameterMm?: 5.0 | 1.5;
  sensitivityReflectorMode?: 'sdh' | 'edm_notch';
  v1ZeroSpot: 'thk_25' | 'height_100' | 'perspex_50' | 'res_steps';
  selectedReflectorId: string;
  probeMode: 'zero_deg' | 'angle_shear';
  nominalAngleDeg: 45 | 60 | 70;
  trueRefractedAngleDeg: number;
  probePositionXmm: number;
  beamDirection: 'right' | 'left';
  bipMarkedOnWedge: boolean;
  weldThicknessMm: number;
  halfSkipWeldMm: number;
  fullSkipWeldMm: number;
  couplantApplied: boolean;
  primaryEchoAmplitudePct: number;
  onSelectReflector?: (reflectorId: string) => void;
}

type CameraPresetId = 'isometric' | 'front_scale' | 'top_scan' | 'flaw_zoom';

function disposeObjectTree(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const meshOrLine = child as THREE.Mesh | THREE.Line | THREE.Points;
    if (meshOrLine.geometry) {
      meshOrLine.geometry.dispose();
    }
    const mat = (meshOrLine as THREE.Mesh).material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) std.map.dispose();
        m.dispose();
      });
    } else if (mat) {
      const spr = mat as THREE.SpriteMaterial;
      if (spr.map) spr.map.dispose();
      mat.dispose();
    }
  });
}

function createCalloutSprite(
  line1: string,
  line2: string,
  accentHexCss: string,
  maxAnisotropy: number,
  scaleW = 3.2,
  scaleH = 0.8
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(7, 12, 26, 0.94)';
    ctx.strokeStyle = accentHexCss;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 16);
    } else {
      ctx.rect(6, 6, canvas.width - 12, canvas.height - 12);
    }
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 31px "IBM Plex Mono", "JetBrains Mono", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, 22, 45);

    ctx.font = 'bold 24px "IBM Plex Mono", "JetBrains Mono", monospace';
    ctx.fillStyle = accentHexCss;
    ctx.fillText(line2, 22, 88);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleW, scaleH, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function createV1EngravingOverlayTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sc = 5; // 1 mm = 5 px (300 mm -> 1500 px, 100 mm -> 500 px)

    // Engraved BIP ruler around X = 200 mm (-50 to +35 mm)
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.92)';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px monospace';
    for (let mm = -55; mm <= 35; mm += 1) {
      const px = (200 + mm) * sc;
      const tickH = mm === 0 ? 34 : mm % 10 === 0 ? 24 : mm % 5 === 0 ? 16 : 9;
      ctx.lineWidth = mm === 0 ? 3.5 : mm % 5 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, tickH);
      ctx.stroke();
      if (mm % 10 === 0 && mm !== 0) {
        ctx.fillText(String(Math.abs(mm)), px - 11, 46);
      }
    }

    // Zero datum label at X = 200 mm
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('0 (R100)', 200 * sc - 42, 68);

    // Engraved Refracted Angle Scale for Ø1.5 mm SDH at (X=35, Y=15) -> 40°..70°
    ctx.strokeStyle = '#fb7185';
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 18px monospace';
    [40, 45, 50, 55, 60, 65, 70].forEach((deg) => {
      const xMm = 35 + 15 * Math.tan((deg * Math.PI) / 180);
      const px = xMm * sc;
      ctx.lineWidth = deg % 10 === 0 || deg === 45 ? 2.5 : 1.6;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, 24);
      ctx.stroke();
      if ([40, 45, 50, 60, 70].includes(deg)) {
        ctx.fillText(`${deg}°`, px - 14, 44);
      }
    });

    // Bottom edge high-angle scale (60°..75°) relative to Ø1.5mm SDH (85 mm from bottom)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.fillStyle = '#7dd3fc';
    [60, 65, 70, 75].forEach((deg) => {
      const xMm = 35 + 85 * Math.tan(((90 - deg) * Math.PI) / 180);
      if (xMm < 185) {
        const px = xMm * sc;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 500);
        ctx.lineTo(px, 476);
        ctx.stroke();
        ctx.fillText(`${deg}°`, px - 14, 468);
      }
    });

    // Stamped ISO block identification
    ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('IIW TYPE 1 / ISO 2400 (V1)', 22 * sc, 92 * sc);
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.fillText('300 × 100 × 25 mm · S355J0', 22 * sc, 96.5 * sc);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
}

function createV2EngravingOverlayTexture(
  v2ThicknessMm: number,
  v2SdhDiaMm: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 516;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sc = 12; // 1 mm = 12 px (75 mm -> 900 px, 43 mm -> 516 px)

    // Engraved BIP millimeter scale around X = 25 mm (-15 to +15 mm)
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.94)';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 19px monospace';
    for (let mm = -15; mm <= 15; mm += 1) {
      const px = (25 + mm) * sc;
      const tickH = mm === 0 ? 38 : mm % 5 === 0 ? 24 : 12;
      ctx.lineWidth = mm === 0 ? 3.5 : mm % 5 === 0 ? 2.2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, tickH);
      ctx.stroke();
      if (mm % 5 === 0 && mm !== 0) {
        ctx.fillText(String(Math.abs(mm)), px - 10, 48);
      }
    }

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 21px monospace';
    ctx.fillText('0 (R25/R50)', 25 * sc - 56, 70);

    // Engraved Angle Scale for V2 SDH at (X = 45, Y = 15) -> 40°..70°
    ctx.strokeStyle = '#fb7185';
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 18px monospace';
    [40, 45, 50, 55, 60, 65, 70].forEach((deg) => {
      const xMm = 45 + 15 * Math.tan((deg * Math.PI) / 180);
      if (xMm <= 74) {
        const px = xMm * sc;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, 24);
        ctx.stroke();
        if ([45, 55, 60, 65].includes(deg)) {
          ctx.fillText(`${deg}°`, px - 14, 46);
        }
      }
    });

    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`ISO 7963 (V2) · ${v2ThicknessMm}mm`, 14 * sc, 37 * sc);
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#fda4af';
    ctx.fillText(`Ø${v2SdhDiaMm.toFixed(1)} SDH + EDM Notch`, 14 * sc, 40.2 * sc);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
}

export const V1V2ThreeScene: React.FC<V1V2ThreeSceneProps> = ({
  language,
  targetBlock,
  v2ThicknessMm,
  v2SdhDiameterMm = 5.0,
  sensitivityReflectorMode = 'sdh',
  v1ZeroSpot,
  selectedReflectorId,
  probeMode,
  nominalAngleDeg,
  trueRefractedAngleDeg,
  probePositionXmm,
  beamDirection,
  bipMarkedOnWedge,
  weldThicknessMm,
  halfSkipWeldMm,
  fullSkipWeldMm,
  couplantApplied,
  primaryEchoAmplitudePct,
  onSelectReflector,
}) => {
  const isAr = language === 'ar';
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('isometric');
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const pulseRingRef = useRef<THREE.Mesh | null>(null);

  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 34, theta: 0.42, phi: 1.12 });
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const maxAnisoRef = useRef<number>(1);

  const applyCameraPreset = (preset: CameraPresetId) => {
    setCameraPreset(preset);
    if (preset === 'isometric') {
      sphericalRef.current = { radius: 33, theta: 0.44, phi: 1.1 };
      lookAtRef.current.set(0, 0, 0);
    } else if (preset === 'front_scale') {
      sphericalRef.current = { radius: 31, theta: 0.0, phi: Math.PI / 2 };
      lookAtRef.current.set(0, 0, 0);
    } else if (preset === 'top_scan') {
      sphericalRef.current = { radius: 30, theta: 0.02, phi: 0.24 };
      lookAtRef.current.set(0, 1.5, 0);
    } else {
      // Flaw / SDH / Notch close-up
      if (targetBlock === 'v1_iso2400') {
        if (selectedReflectorId === 'v1_resolution_steps' || selectedReflectorId === 'v1_zero_index_notch') {
          lookAtRef.current.set(4.5, -3.5, 0);
        } else if (selectedReflectorId === 'v1_perspex_50') {
          lookAtRef.current.set(-5.0, -0.5, 0);
        } else {
          lookAtRef.current.set(-11.2, 3.2, 0);
        }
        sphericalRef.current = { radius: 14.5, theta: 0.34, phi: 1.18 };
      } else if (targetBlock === 'v2_iso7963') {
        lookAtRef.current.set(1.8, 1.4, 0);
        sphericalRef.current = { radius: 16.5, theta: 0.36, phi: 1.16 };
      } else {
        lookAtRef.current.set(-2.5, 0, 0);
        sphericalRef.current = { radius: 18, theta: 0.38, phi: 1.12 };
      }
    }

    const cam = cameraRef.current;
    if (cam) {
      const { radius, theta, phi } = sphericalRef.current;
      cam.position.set(
        lookAtRef.current.x + radius * Math.sin(phi) * Math.sin(theta),
        lookAtRef.current.y + radius * Math.cos(phi),
        lookAtRef.current.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      cam.lookAt(lookAtRef.current);
    }
  };

  // Initialize Three.js WebGL stage once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

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
    scene.background = new THREE.Color(0x060b17);
    scene.fog = new THREE.FogExp2(0x060b17, 0.011);
    sceneRef.current = scene;

    const width = mount.clientWidth || 680;
    const height = mount.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 400);
    cameraRef.current = camera;

    const syncCamera = () => {
      const { radius, theta, phi } = sphericalRef.current;
      camera.position.set(
        lookAtRef.current.x + radius * Math.sin(phi) * Math.sin(theta),
        lookAtRef.current.y + radius * Math.cos(phi),
        lookAtRef.current.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(lookAtRef.current);
    };
    syncCamera();

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
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    maxAnisoRef.current = renderer.capabilities.getMaxAnisotropy?.() || 1;
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

    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    } catch {
      // Headless fallback
    }
    pmrem.dispose();

    // Three-point warm/cool studio inspection lighting
    const hemi = new THREE.HemisphereLight(0xcbe6ff, 0x0b1224, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e2, 2.4);
    keyLight.position.set(18, 26, 22);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.15);
    fillLight.position.set(-20, 12, -16);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 1.3, 45);
    rimLight.position.set(0, 14, -10);
    scene.add(rimLight);

    // Calibrated optical bench grid below block
    const grid = new THREE.GridHelper(44, 44, 0x1e293b, 0x0f172a);
    grid.position.y = -6.2;
    scene.add(grid);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // Orbit & Zoom pointer handlers
    const domEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
      sphericalRef.current.theta -= dx * 0.0075;
      sphericalRef.current.phi = Math.max(
        0.15,
        Math.min(Math.PI - 0.18, sphericalRef.current.phi - dy * 0.0075)
      );
      syncCamera();
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(
        10,
        Math.min(62, sphericalRef.current.radius + e.deltaY * 0.025)
      );
      syncCamera();
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (!mount) return;
            const nw = mount.clientWidth || 680;
            const nh = mount.clientHeight || 420;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
          })
        : null;
    resizeObserver?.observe(mount);

    // Software-GL fenceSync paced render loop
    let timerOrRafId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (isSoftwareGl && gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            timerOrRafId = window.setTimeout(poll, 6);
          } else {
            if (sync) gl.deleteSync(sync);
            timerOrRafId = window.setTimeout(cb, 75);
          }
        };
        timerOrRafId = window.setTimeout(poll, 8);
      } else if (isSoftwareGl) {
        timerOrRafId = window.setTimeout(cb, 85);
      } else {
        timerOrRafId = window.requestAnimationFrame(cb);
      }
    };

    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      if (pulseRingRef.current) {
        const s = 1 + 0.22 * Math.sin(t * 4.2);
        pulseRingRef.current.scale.set(s, s, 1);
      }
      renderer.render(scene, camera);
      afterDraw(tick);
    };
    tick();

    return () => {
      disposed = true;
      window.clearTimeout(timerOrRafId);
      window.cancelAnimationFrame(timerOrRafId);
      resizeObserver?.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('webglcontextlost', onContextLost);
      domEl.removeEventListener('webglcontextrestored', onContextRestored);
      disposeObjectTree(scene);
      renderer.dispose();
      if (domEl.parentNode === mount) {
        mount.removeChild(domEl);
      }
    };
  }, []);

  // Rebuild 3D Calibration Block Geometry, Flaws (SDHs + Notches), Probe & Acoustic Rays on prop updates
  useEffect(() => {
    const root = rootGroupRef.current;
    if (!root) return;

    while (root.children.length > 0) {
      const ch = root.children[0];
      disposeObjectTree(ch);
      root.remove(ch);
    }
    pulseRingRef.current = null;

    const aniso = maxAnisoRef.current;
    const rad = (trueRefractedAngleDeg * Math.PI) / 180;

    // Shared calibrated PBR materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: xrayMode ? 0x334155 : 0x8996a8,
      metalness: xrayMode ? 0.25 : 0.78,
      roughness: xrayMode ? 0.35 : 0.28,
      transparent: xrayMode,
      opacity: xrayMode ? 0.28 : 1.0,
      depthWrite: !xrayMode,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: xrayMode ? 0x38bdf8 : 0xcbd5e1,
      transparent: true,
      opacity: xrayMode ? 0.65 : 0.45,
    });

    // =========================================================================
    // 1. IIW V1 BLOCK (ISO 2400 — 300 × 100 × 25 mm | 1 unit = 10 mm)
    // =========================================================================
    if (targetBlock === 'v1_iso2400') {
      const sc = 0.1; // 300mm -> 30.0, 100mm -> 10.0, 25mm -> 2.5
      const toX = (xMm: number) => (xMm - 150) * sc;
      const toY = (yMm: number) => (50 - yMm) * sc;
      const halfZ = 1.25; // 25mm / 2 * 0.1

      const shape = new THREE.Shape();
      // Start top-left (X=0, Y=0)
      shape.moveTo(toX(0), toY(0));
      // Top scanning face up to Zero-Index Saw Slot (2mm wide × 3mm deep at X = 200mm)
      shape.lineTo(toX(199), toY(0));
      shape.lineTo(toX(199), toY(3));
      shape.lineTo(toX(201), toY(3));
      shape.lineTo(toX(201), toY(0));
      shape.lineTo(toX(300), toY(0));

      // True R100 mm curved quadrant centered at (X=200, Y=0), sweeping clockwise from (300,0) to (200,100)
      shape.absarc(toX(200), toY(0), 100 * sc, 0, -Math.PI / 2, true);

      // Machined Axial Resolution Triplet Steps at X = 192..200 mm (85 / 91 / 100 mm paths)
      shape.lineTo(toX(200), toY(91));
      shape.lineTo(toX(194), toY(91));
      shape.lineTo(toX(194), toY(85));
      shape.lineTo(toX(192), toY(85));
      shape.lineTo(toX(192), toY(100));

      // Bottom flat face back to (X=0, Y=100)
      shape.lineTo(toX(0), toY(100));
      shape.closePath();

      // Through-hole 1: Ø50.0 mm cylindrical bore at (X=100, Y=55)
      const bore50 = new THREE.Path();
      bore50.absarc(toX(100), toY(55), 25 * sc, 0, Math.PI * 2, false);
      shape.holes.push(bore50);

      // Through-hole 2: Ø1.5 mm Reference Side-Drilled Hole (SDH) at (X=35, Y=15)
      const sdh15 = new THREE.Path();
      sdh15.absarc(toX(35), toY(15), 0.9 * sc, 0, Math.PI * 2, false);
      shape.holes.push(sdh15);

      const v1Geo = new THREE.ExtrudeGeometry(shape, {
        depth: 25 * sc,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 2,
        curveSegments: 64,
      });
      v1Geo.translate(0, 0, -halfZ);

      const v1Mesh = new THREE.Mesh(v1Geo, steelMat);
      v1Mesh.castShadow = true;
      v1Mesh.receiveShadow = true;
      root.add(v1Mesh);

      const v1Edges = new THREE.LineSegments(new THREE.EdgesGeometry(v1Geo, 18), edgeMat);
      root.add(v1Edges);

      // Concentric Perspex / PMMA Insert (Ø50 bore housing 23.0 mm thick acrylic cylinder = 50 mm steel eq.)
      const pmmaSelected = selectedReflectorId === 'v1_perspex_50' || v1ZeroSpot === 'perspex_50';
      const pmmaGeo = new THREE.CylinderGeometry(2.46, 2.46, 2.3, 48);
      pmmaGeo.rotateX(Math.PI / 2);
      const pmmaMat = new THREE.MeshPhysicalMaterial({
        color: pmmaSelected ? 0x38bdf8 : 0x7dd3fc,
        roughness: 0.12,
        metalness: 0.0,
        transmission: 0.65,
        transparent: true,
        opacity: 0.55,
        ior: 1.49,
      });
      const pmmaMesh = new THREE.Mesh(pmmaGeo, pmmaMat);
      pmmaMesh.position.set(toX(100), toY(55), 0);
      root.add(pmmaMesh);

      // Highlighted Ø1.5 mm Through-Drilled SDH Sleeve & Chamfer Ring at (X=35, Y=15)
      const sdhActive =
        selectedReflectorId === 'v1_sdh_1_5mm' ||
        (probeMode === 'angle_shear' && beamDirection === 'left' && sensitivityReflectorMode === 'sdh');
      const sdhCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 2.56, 24).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: sdhActive ? 0xf43f5e : 0xfb7185,
          emissive: sdhActive ? 0xe11d48 : 0x4c0519,
          emissiveIntensity: sdhActive ? 0.9 : 0.35,
          metalness: 0.4,
          roughness: 0.3,
        })
      );
      sdhCylinder.position.set(toX(35), toY(15), 0);
      root.add(sdhCylinder);

      // Highlighted Resolution Notched Steps & 2×3mm Zero-Index Notch
      const notchActive =
        selectedReflectorId === 'v1_resolution_steps' ||
        selectedReflectorId === 'v1_zero_index_notch' ||
        v1ZeroSpot === 'res_steps' ||
        sensitivityReflectorMode === 'edm_notch';

      const slotHighlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 1.52, 2.54),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: notchActive ? 0.85 : 0.25,
          transparent: true,
          opacity: notchActive ? 0.55 : 0.22,
        })
      );
      slotHighlight.position.set(toX(196), toY(92.5), 0);
      root.add(slotHighlight);

      const zeroSlotMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.32, 2.56),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.75,
        })
      );
      zeroSlotMesh.position.set(toX(200), toY(1.5), 0);
      root.add(zeroSlotMesh);

      // Front Engraved Scale Overlay Plane
      const v1ScaleTex = createV1EngravingOverlayTexture(aniso);
      const scalePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 10),
        new THREE.MeshBasicMaterial({
          map: v1ScaleTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        })
      );
      scalePlane.position.set(0, 0, halfZ + 0.035);
      root.add(scalePlane);

      // Live 3D Transducer & Ultrasonic Beam Path on V1
      const probeGroup = new THREE.Group();
      const effXmm =
        probeMode === 'zero_deg'
          ? v1ZeroSpot === 'perspex_50'
            ? 100
            : v1ZeroSpot === 'res_steps'
            ? probePositionXmm
            : v1ZeroSpot === 'thk_25'
            ? 65
            : 145
          : probePositionXmm;

      if (probeMode === 'zero_deg' && v1ZeroSpot === 'thk_25') {
        // Coupled onto the front Z=25mm face to measure 25/50/75/100mm thickness multiples!
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.7, 1.4, 28).rotateX(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.45, roughness: 0.3 })
        );
        cyl.position.set(toX(65), toY(50), halfZ + 0.72);
        probeGroup.add(cyl);

        const beamCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.55, 2.5, 24).rotateX(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.42 })
        );
        beamCyl.position.set(toX(65), toY(50), 0);
        probeGroup.add(beamCyl);
      } else if (probeMode === 'zero_deg') {
        // Coupled onto top scanning face Y=0
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.72, 0.72, 1.45, 28),
          new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.45, roughness: 0.3 })
        );
        cyl.position.set(toX(effXmm), toY(0) + 0.74, 0);
        probeGroup.add(cyl);

        const beamDepthMm = v1ZeroSpot === 'perspex_50' ? 80 : v1ZeroSpot === 'res_steps' ? 92 : 100;
        const beamCone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.85, beamDepthMm * sc, 24),
          new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.34 })
        );
        beamCone.position.set(toX(effXmm), toY(beamDepthMm / 2), 0);
        probeGroup.add(beamCone);
      } else {
        // Shear-wave Angle Probe Wedge on top scanning face Y=0
        const wedge = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 1.15, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.25 })
        );
        wedge.position.set(toX(effXmm), toY(0) + 0.58, 0);
        probeGroup.add(wedge);

        // BIP Exit Marker Strip on Wedge Side
        const bipStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 1.18, 1.58),
          new THREE.MeshBasicMaterial({ color: bipMarkedOnWedge ? 0x22c55e : 0xf43f5e })
        );
        bipStrip.position.set(toX(effXmm), toY(0) + 0.58, 0);
        probeGroup.add(bipStrip);

        // Acoustic Shear Ray + Volumetric Beam Cone
        const dirSign = beamDirection === 'right' ? 1 : -1;
        const rayLenMm =
          beamDirection === 'right'
            ? 100
            : Math.min(105, Math.hypot(Math.max(4, effXmm - 35), 15) + 4);
        const startPt = new THREE.Vector3(toX(effXmm), toY(0), 0);
        const endXmm = effXmm + dirSign * rayLenMm * Math.sin(rad);
        const endYmm = Math.min(100, rayLenMm * Math.cos(rad));
        const endPt = new THREE.Vector3(toX(endXmm), toY(endYmm), 0);

        const rayLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([startPt, endPt]),
          new THREE.LineBasicMaterial({ color: 0x38bdf8 })
        );
        probeGroup.add(rayLine);

        const segVec = new THREE.Vector3().subVectors(endPt, startPt);
        const coneLen = segVec.length();
        const beamCone = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(0.35, coneLen * 0.11), coneLen, 24, 1, true),
          new THREE.MeshBasicMaterial({
            color: primaryEchoAmplitudePct >= 65 ? 0x22d3ee : 0x38bdf8,
            transparent: true,
            opacity: 0.24,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        const mid = new THREE.Vector3().addVectors(startPt, endPt).multiplyScalar(0.5);
        beamCone.position.copy(mid);
        // Cone apex is at +Y/2 in Three.js ConeGeometry; orient apex at startPt
        beamCone.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          segVec.clone().normalize().negate()
        );
        probeGroup.add(beamCone);

        if (primaryEchoAmplitudePct >= 50) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.22, 0.38, 28),
            new THREE.MeshBasicMaterial({
              color: 0xfbbf24,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.9,
            })
          );
          ring.position.set(endPt.x, endPt.y, halfZ + 0.08);
          pulseRingRef.current = ring;
          probeGroup.add(ring);
        }
      }
      root.add(probeGroup);

      // 3D Dimension & Reflector Callout Sprites
      if (showDimensions) {
        const dimGroup = new THREE.Group();
        const overallSpr = createCalloutSprite(
          'ISO 2400 (V1): 300 × 100 × 25 mm',
          'Mass 5.55 kg · VL=5920 / VS=3255 m/s',
          '#38bdf8',
          aniso,
          6.8,
          1.45
        );
        overallSpr.position.set(0, -6.4, 0);
        dimGroup.add(overallSpr);

        const sdhSpr = createCalloutSprite(
          'Ø1.50 mm Through SDH',
          'X=35mm, Depth Y=15mm (β & 80% FSH)',
          '#fb7185',
          aniso,
          5.2,
          1.2
        );
        sdhSpr.position.set(toX(35), toY(15) + 2.4, halfZ + 0.6);
        dimGroup.add(sdhSpr);

        const r100Spr = createCalloutSprite(
          'R100.0 mm Quadrant + 2×3 Notch',
          'BIP Exit & 100/200 mm Shear Sweep',
          '#fbbf24',
          aniso,
          5.6,
          1.2
        );
        r100Spr.position.set(toX(255), toY(25) + 2.2, halfZ + 0.6);
        dimGroup.add(r100Spr);

        const resSpr = createCalloutSprite(
          '85 / 91 / 100 mm Notched Steps',
          '2×15mm Corner-Trap Slot + 6×9mm Step',
          '#34d399',
          aniso,
          5.5,
          1.2
        );
        resSpr.position.set(toX(195), toY(98) - 1.5, halfZ + 0.8);
        dimGroup.add(resSpr);

        root.add(dimGroup);
      }
    }

    // =========================================================================
    // 2. IIW V2 MINIATURE BLOCK (ISO 7963 — 75 × 43 × 12.5/20 mm | 1 unit = 4 mm)
    // =========================================================================
    else if (targetBlock === 'v2_iso7963') {
      const sc = 0.25; // 75mm -> 18.75, 43mm -> 10.75, 12.5mm -> 3.125, 20mm -> 5.0
      const toX = (xMm: number) => (xMm - 37.5) * sc;
      const toY = (yMm: number) => (21.5 - yMm) * sc;
      const depthUnits = v2ThicknessMm * sc;
      const halfZ = depthUnits / 2;

      const shape = new THREE.Shape();
      // Top scanning edge X = 0..75 mm at Y = 0, with subtle 1.0×1.2mm zero-index notch at X = 25 mm
      shape.moveTo(toX(0), toY(0));
      shape.lineTo(toX(24.5), toY(0));
      shape.lineTo(toX(25.0), toY(1.2));
      shape.lineTo(toX(25.5), toY(0));
      shape.lineTo(toX(75), toY(0));

      // Right concentric R50 mm arc centered at (X = 25, Y = 0), sweeping from (75,0) down to Y = 43 mm
      const r50EndAngle = -Math.asin(43 / 50); // ~ -1.035 rad
      shape.absarc(toX(25), toY(0), 50 * sc, 0, r50EndAngle, true);

      // Bottom flat datum at Y = 43 mm with machined 1.5mm deep × 2.0mm wide EDM Reference Notch at X = 30 mm!
      shape.lineTo(toX(31.0), toY(43));
      shape.lineTo(toX(31.0), toY(41.5));
      shape.lineTo(toX(29.0), toY(41.5));
      shape.lineTo(toX(29.0), toY(43));
      shape.lineTo(toX(14), toY(43));
      shape.lineTo(toX(8), toY(23));

      // Left concentric R25 mm arc centered at (X = 25, Y = 0) up to (0, 0)
      const r25StartAngle = Math.PI + Math.asin(23 / 25);
      shape.absarc(toX(25), toY(0), 25 * sc, r25StartAngle, Math.PI, true);
      shape.closePath();

      // Through-hole: Ø5.0 mm (or Ø1.5 mm) Reference SDH at (X = 45, Y = 15)
      const sdhHole = new THREE.Path();
      sdhHole.absarc(toX(45), toY(15), (v2SdhDiameterMm / 2) * sc, 0, Math.PI * 2, false);
      shape.holes.push(sdhHole);

      const v2Geo = new THREE.ExtrudeGeometry(shape, {
        depth: depthUnits,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
        curveSegments: 56,
      });
      v2Geo.translate(0, 0, -halfZ);

      const v2Mesh = new THREE.Mesh(v2Geo, steelMat);
      v2Mesh.castShadow = true;
      v2Mesh.receiveShadow = true;
      root.add(v2Mesh);

      root.add(new THREE.LineSegments(new THREE.EdgesGeometry(v2Geo, 18), edgeMat));

      // Highlighted V2 SDH Inner Sleeve
      const sdhCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(
          (v2SdhDiameterMm / 2) * sc * 0.98,
          (v2SdhDiameterMm / 2) * sc * 0.98,
          depthUnits + 0.08,
          28
        ).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: sensitivityReflectorMode === 'sdh' ? 0.75 : 0.3,
          metalness: 0.35,
          roughness: 0.3,
        })
      );
      sdhCyl.position.set(toX(45), toY(15), 0);
      root.add(sdhCyl);

      // Highlighted 1.5 × 2.0 mm Rectangular EDM Reference Notch at bottom (X = 30, Y = 41.5..43)
      const v2NotchHighlight = new THREE.Mesh(
        new THREE.BoxGeometry(2.0 * sc, 1.5 * sc, depthUnits + 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity:
            sensitivityReflectorMode === 'edm_notch' || selectedReflectorId === 'v2_edm_surface_notch'
              ? 0.95
              : 0.4,
        })
      );
      v2NotchHighlight.position.set(toX(30), toY(42.25), 0);
      root.add(v2NotchHighlight);

      // Front Engraved Scale Plate
      const v2Tex = createV2EngravingOverlayTexture(v2ThicknessMm, v2SdhDiameterMm, aniso);
      const scalePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(75 * sc, 43 * sc),
        new THREE.MeshBasicMaterial({
          map: v2Tex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        })
      );
      scalePlane.position.set(0, 0, halfZ + 0.05);
      root.add(scalePlane);

      // Live 3D Probe & Reverberation Ray Tracing on V2
      const probeGroup = new THREE.Group();
      const clampedX = Math.max(8, Math.min(70, probePositionXmm));
      if (probeMode === 'zero_deg') {
        // Coupled onto side thickness face (12.5 mm or 20 mm)
        const p0 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 0.95, 1.6, 28).rotateX(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.45, roughness: 0.3 })
        );
        p0.position.set(toX(30), toY(22), halfZ + 0.85);
        probeGroup.add(p0);

        const beam0 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.75, depthUnits, 24).rotateX(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.4 })
        );
        beam0.position.set(toX(30), toY(22), 0);
        probeGroup.add(beam0);
      } else {
        const wedge = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 1.35, 1.9),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.3, roughness: 0.25 })
        );
        wedge.position.set(toX(clampedX), toY(0) + 0.68, 0);
        probeGroup.add(wedge);

        const bipTick = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 1.38, 1.98),
          new THREE.MeshBasicMaterial({ color: bipMarkedOnWedge ? 0x22c55e : 0xf43f5e })
        );
        bipTick.position.set(toX(clampedX), toY(0) + 0.68, 0);
        probeGroup.add(bipTick);

        const dirSign = beamDirection === 'right' ? 1 : -1;
        const rayLenMm =
          beamDirection === 'left' && clampedX > 48
            ? Math.hypot(clampedX - 45, 15)
            : beamDirection === 'left'
            ? 25
            : 50;
        const pStart = new THREE.Vector3(toX(clampedX), toY(0), 0);
        const pEnd = new THREE.Vector3(
          toX(clampedX + dirSign * rayLenMm * Math.sin(rad)),
          toY(Math.min(43, rayLenMm * Math.cos(rad))),
          0
        );

        probeGroup.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pStart, pEnd]),
            new THREE.LineBasicMaterial({ color: 0x38bdf8 })
          )
        );

        const seg = new THREE.Vector3().subVectors(pEnd, pStart);
        const len = Math.max(0.5, seg.length());
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(0.4, len * 0.12), len, 24, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        cone.position.copy(new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), seg.clone().normalize().negate());
        probeGroup.add(cone);

        // Secondary R25 <-> R50 Concentric Reverberation Path when near X = 25 mm
        if (Math.abs(clampedX - 25) <= 4.5) {
          const oppLenMm = beamDirection === 'left' ? 50 : 25;
          const pOpp = new THREE.Vector3(
            toX(clampedX - dirSign * oppLenMm * Math.sin(rad)),
            toY(Math.min(43, oppLenMm * Math.cos(rad))),
            0
          );
          const dashMat = new THREE.LineDashedMaterial({
            color: 0xfbbf24,
            dashSize: 0.45,
            gapSize: 0.25,
          });
          const reverbLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pStart, pOpp]),
            dashMat
          );
          reverbLine.computeLineDistances();
          probeGroup.add(reverbLine);
        }
      }
      root.add(probeGroup);

      if (showDimensions) {
        const dimGroup = new THREE.Group();
        const overall = createCalloutSprite(
          `ISO 7963 (V2): 75 × 43 × ${v2ThicknessMm} mm`,
          'Concentric R25 & R50 Arcs · Field Pocket Block',
          '#fbbf24',
          aniso,
          6.8,
          1.45
        );
        overall.position.set(0, -6.8, 0);
        dimGroup.add(overall);

        const sdhCallout = createCalloutSprite(
          `Ø${v2SdhDiameterMm.toFixed(1)} mm Through SDH`,
          'X=45mm, Depth Y=15mm (80% FSH Ref)',
          '#fb7185',
          aniso,
          5.3,
          1.2
        );
        sdhCallout.position.set(toX(48), toY(15) + 2.2, halfZ + 0.7);
        dimGroup.add(sdhCallout);

        const notchCallout = createCalloutSprite(
          '1.5 × 2.0 mm EDM Notch',
          'Bottom Corner-Trap Start-Check Target',
          '#34d399',
          aniso,
          5.3,
          1.2
        );
        notchCallout.position.set(toX(30), toY(43) - 1.5, halfZ + 0.7);
        dimGroup.add(notchCallout);

        root.add(dimGroup);
      }
    }

    // =========================================================================
    // 3. 3D WELD PRE-SCAN START-CHECK SPECIMEN (t = 25 mm + 10%t EDM Notches)
    // =========================================================================
    else {
      const sc = 0.16; // 160mm -> 25.6, 25mm -> 4.0, Z width = 56mm -> 8.96
      const plateW = 165 * sc;
      const plateH = weldThicknessMm * sc;
      const plateZ = 56 * sc;
      const weldCenterX = -42 * sc; // Weld at left-center so right scanning zone covers up to 115mm standoff
      const topY = plateH / 2;
      const botY = -plateH / 2;

      const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateZ), steelMat);
      root.add(plateMesh);
      root.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(plateW, plateH, plateZ)),
          edgeMat
        )
      );

      // Single-V Weld Groove Fusion Prism + Crown & Root Bead
      const weldMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.65,
        roughness: 0.38,
        transparent: xrayMode,
        opacity: xrayMode ? 0.45 : 1.0,
      });
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.4, plateZ, 24, 1, false, 0, Math.PI).rotateX(Math.PI / 2),
        weldMat
      );
      crown.scale.set(1.2, 0.36, 1);
      crown.position.set(weldCenterX, topY, 0);
      root.add(crown);

      const rootBead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, plateZ, 20).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.35 })
      );
      rootBead.scale.set(1, 0.45, 1);
      rootBead.position.set(weldCenterX, botY, 0);
      root.add(rootBead);

      // Machined 10%t (2.5 mm) Root & Crown Reference EDM Notches (for Start-Check sensitivity verification)
      const notchDepthUnits = Math.max(0.32, weldThicknessMm * 0.1 * sc);
      const rootEdmNotch = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, notchDepthUnits, plateZ * 0.55),
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: sensitivityReflectorMode === 'edm_notch' ? 0.95 : 0.45,
        })
      );
      rootEdmNotch.position.set(weldCenterX + 0.3, botY + notchDepthUnits / 2, 0);
      root.add(rootEdmNotch);

      const capEdmNotch = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, notchDepthUnits, plateZ * 0.55),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: sensitivityReflectorMode === 'edm_notch' ? 0.95 : 0.45,
        })
      );
      capEdmNotch.position.set(weldCenterX + 1.5, topY - notchDepthUnits / 2, 0);
      root.add(capEdmNotch);

      // Couplant Gel Film Layer on Scanning Zone when verified
      if (couplantApplied) {
        const gel = new THREE.Mesh(
          new THREE.PlaneGeometry(115 * sc, plateZ * 0.78).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.24,
          })
        );
        gel.position.set(weldCenterX + 64 * sc, topY + 0.03, 0);
        root.add(gel);
      }

      // Chalked Skip Lines on Top Plate: Half-Skip (S/2) & Full-Skip (S)
      const halfSkipWorldX = weldCenterX + halfSkipWeldMm * sc;
      const fullSkipWorldX = weldCenterX + fullSkipWeldMm * sc;
      if (halfSkipWeldMm > 5 && halfSkipWeldMm < 120) {
        const sHalfLine = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.05, plateZ),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
        );
        sHalfLine.position.set(halfSkipWorldX, topY + 0.04, 0);
        root.add(sHalfLine);
      }
      if (fullSkipWeldMm > 10 && fullSkipWeldMm < 125) {
        const sFullLine = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.05, plateZ),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        sFullLine.position.set(fullSkipWorldX, topY + 0.04, 0);
        root.add(sFullLine);
      }

      // Live Probe & Leg I / Leg II Acoustic Ray Tracing
      const probeWorldX = weldCenterX + Math.min(118, Math.max(15, probePositionXmm)) * sc;
      const pGroup = new THREE.Group();
      if (probeMode === 'zero_deg') {
        const p0 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.85, 0.85, 1.5, 28),
          new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.45, roughness: 0.3 })
        );
        p0.position.set(probeWorldX, topY + 0.78, 0);
        pGroup.add(p0);

        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.7, plateH, 24),
          new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.36 })
        );
        col.position.set(probeWorldX, 0, 0);
        pGroup.add(col);
      } else {
        const wedge = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 1.25, 1.7),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.25 })
        );
        wedge.position.set(probeWorldX, topY + 0.64, 0);
        pGroup.add(wedge);

        // Leg I (Probe -> Bottom Root Bounce)
        const bounceX = probeWorldX - halfSkipWeldMm * sc;
        const pEntry = new THREE.Vector3(probeWorldX, topY, 0);
        const pBounce = new THREE.Vector3(bounceX, botY, 0);
        pGroup.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pEntry, pBounce]),
            new THREE.LineBasicMaterial({ color: 0xfbbf24 })
          )
        );

        // Leg II (Bottom Bounce -> Upper Bevel / Crown)
        const leg2X = bounceX - halfSkipWeldMm * sc;
        const pTop2 = new THREE.Vector3(leg2X, topY, 0);
        pGroup.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pBounce, pTop2]),
            new THREE.LineBasicMaterial({ color: 0x38bdf8 })
          )
        );
      }
      root.add(pGroup);

      if (showDimensions) {
        const dimGroup = new THREE.Group();
        const weldSpr = createCalloutSprite(
          `Butt Weld Specimen: t = ${weldThicknessMm} mm`,
          `S/2 = ${halfSkipWeldMm} mm · Full Skip S = ${fullSkipWeldMm} mm`,
          '#34d399',
          aniso,
          6.8,
          1.45
        );
        weldSpr.position.set(0, botY - 2.3, 0);
        dimGroup.add(weldSpr);

        const notchSpr = createCalloutSprite(
          '10%t Root & Surface EDM Notches',
          'Start-Check Sensitivity & Skip Targets',
          '#fb7185',
          aniso,
          5.6,
          1.2
        );
        notchSpr.position.set(weldCenterX, topY + 2.3, 0);
        dimGroup.add(notchSpr);

        root.add(dimGroup);
      }
    }
  }, [
    targetBlock,
    v2ThicknessMm,
    v2SdhDiameterMm,
    sensitivityReflectorMode,
    v1ZeroSpot,
    selectedReflectorId,
    probeMode,
    nominalAngleDeg,
    trueRefractedAngleDeg,
    probePositionXmm,
    beamDirection,
    bipMarkedOnWedge,
    weldThicknessMm,
    halfSkipWeldMm,
    fullSkipWeldMm,
    couplantApplied,
    primaryEchoAmplitudePct,
    xrayMode,
    showDimensions,
  ]);

  const activeBlockHeadline =
    targetBlock === 'v1_iso2400'
      ? isAr
        ? 'مجسم 3D لبلوكة V1 (ISO 2400 — 300×100×25 مم)'
        : '3D IIW V1 Block (ISO 2400 — 300×100×25 mm)'
      : targetBlock === 'v2_iso7963'
      ? isAr
        ? `مجسم 3D لبلوكة V2 (ISO 7963 — 75×43×${v2ThicknessMm} مم)`
        : `3D IIW V2 Block (ISO 7963 — 75×43×${v2ThicknessMm} mm)`
      : isAr
      ? `مجسم 3D لاستارت تشيك وصلة اللحام (t=${weldThicknessMm} مم)`
      : `3D Weld Start-Check Specimen (t=${weldThicknessMm} mm)`;

  return (
    <div
      role="region"
      aria-label="3D V1 and V2 Ultrasonic Calibration Blocks Interactive Viewport"
      className="relative w-full h-[350px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-800 bg-[#060b17] select-none"
    >
      {/* WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Accessible Headless / WebGL-Fallback Technical Geometry Summary */}
      {webglUnavailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#060b17] text-slate-300 space-y-2 z-10">
          <Box className="w-8 h-8 text-cyan-400" />
          <div className="text-sm font-black text-white">{activeBlockHeadline}</div>
          <p className="text-xs text-slate-400 max-w-md font-mono">
            {targetBlock === 'v1_iso2400'
              ? '3D Extruded Geometry: 300×100×25 mm · R100 Quadrant · Ø50 Bore + 23mm PMMA · Ø1.5mm SDH · 85/91/100mm Resolution Notches · 2×3mm Zero Slot'
              : targetBlock === 'v2_iso7963'
              ? `3D Extruded Geometry: 75×43×${v2ThicknessMm} mm · Concentric R25 & R50 Arcs · Ø${v2SdhDiameterMm.toFixed(1)}mm SDH · 1.5×2.0mm EDM Reference Notch`
              : `3D Butt-Weld Start-Check Specimen: t=${weldThicknessMm} mm · 10%t Root & Surface EDM Notches · S/2=${halfSkipWeldMm}mm · S=${fullSkipWeldMm}mm`}
          </p>
        </div>
      )}

      {/* Discreet Top-Start Telemetry Badge (Solid dark surface, zero backdrop-blur over WebGL) */}
      <div className="absolute top-2.5 inset-x-2.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        <div className="px-2.5 py-1 rounded-lg bg-[#070c1a]/90 border border-slate-800 text-[11px] font-mono text-slate-200 flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold">{activeBlockHeadline}</span>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-[#070c1a]/90 border border-slate-800 text-[10.5px] font-mono text-slate-300 tabular-nums">
          {probeMode === 'zero_deg'
            ? `0° Long. · X=${probePositionXmm.toFixed(1)}mm`
            : `${nominalAngleDeg}° Shear (β=${trueRefractedAngleDeg.toFixed(1)}°) · X=${probePositionXmm.toFixed(1)}mm`}
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Side-Panel Occlusion) */}
      <div className="absolute bottom-2.5 inset-x-2.5 flex flex-col items-center pointer-events-none z-20">
        <div className="pointer-events-auto rounded-xl bg-[#070c1a]/95 border border-slate-800 px-2.5 py-1.5 shadow-xl max-w-full">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10.5px] font-mono">
            {!dockCollapsed && (
              <>
                {/* Camera Angle Presets */}
                {(
                  [
                    { id: 'isometric', ar: 'منظور 3D', en: '3D Orbit', icon: Compass },
                    { id: 'front_scale', ar: 'مسقط التدريج', en: 'Scale Face', icon: Ruler },
                    { id: 'top_scan', ar: 'سطح المسح', en: 'Top Scan', icon: Maximize2 },
                    { id: 'flaw_zoom', ar: 'تقريب الثقوب/الحزوز', en: 'Flaw Zoom', icon: Focus },
                  ] as const
                ).map((camBtn) => {
                  const Icon = camBtn.icon;
                  const active = cameraPreset === camBtn.id;
                  return (
                    <button
                      key={camBtn.id}
                      type="button"
                      onClick={() => {
                        playCalibrationClick();
                        applyCameraPreset(camBtn.id);
                      }}
                      className={`px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        active
                          ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{isAr ? camBtn.ar : camBtn.en}</span>
                    </button>
                  );
                })}

                <span className="text-slate-700 hidden sm:inline">|</span>

                {/* X-Ray Internal Inspection Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setXrayMode((v) => !v);
                  }}
                  className={`px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    xrayMode
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>{isAr ? 'أشعة X-Ray للثقوب' : 'X-Ray Internal'}</span>
                </button>

                {/* 3D Dimension Callouts Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setShowDimensions((v) => !v);
                  }}
                  className={`px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    showDimensions
                      ? 'bg-emerald-600 text-white font-bold border-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{isAr ? 'أبعاد 3D' : '3D Dims'}</span>
                </button>

                {/* Quick Flaw Jump Chips (SDH vs Notch) */}
                {onSelectReflector && targetBlock !== 'weld_start_check' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        playCalibrationClick();
                        onSelectReflector(
                          targetBlock === 'v1_iso2400' ? 'v1_sdh_1_5mm' : 'v2_sdh_5mm'
                        );
                        applyCameraPreset('flaw_zoom');
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      {targetBlock === 'v1_iso2400' ? 'Ø1.5 SDH' : `Ø${v2SdhDiameterMm.toFixed(1)} SDH`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playCalibrationClick();
                        onSelectReflector(
                          targetBlock === 'v1_iso2400'
                            ? 'v1_zero_index_notch'
                            : 'v2_edm_surface_notch'
                        );
                        applyCameraPreset('flaw_zoom');
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'حز EDM' : 'EDM Notch'}
                    </button>
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              aria-label={dockCollapsed ? 'Expand 3D Controls' : 'Collapse 3D Controls'}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>{isAr ? 'أدوات 3D' : '3D Controls'}</span>
                </>
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
