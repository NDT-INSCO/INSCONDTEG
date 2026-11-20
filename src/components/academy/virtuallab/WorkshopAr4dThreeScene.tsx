import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Language } from '../../../types';
import type {
  Workshop4dTelemetrySnapshot,
  WorkshopAr4dBranchId,
} from '../../../data/workshopAr4dBranchesData';

export type ArBackdropMode = 'camera' | 'pipe' | 'studio3d';

export interface WorkshopAr4dThreeSceneProps {
  language: Language;
  branchId: WorkshopAr4dBranchId;
  timeProgress01: number;
  param1: number;
  param2: number;
  accentHex: string;
  backdropMode: ArBackdropMode;
  arScalePct: number;
  arRotationDeg: number;
  telemetry: Workshop4dTelemetrySnapshot;
}

interface DynamicSceneState {
  branchId: WorkshopAr4dBranchId;
  timeProgress01: number;
  param1: number;
  param2: number;
  arScalePct: number;
  arRotationDeg: number;
  backdropMode: ArBackdropMode;
}

interface BuiltBranchRig {
  group: THREE.Group;
  update: (elapsed: number, t4d: number, p1: number, p2: number) => void;
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

function createEnergyWaveShader(baseColorHex: string, secondaryHex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0.35 },
      uIntensity: { value: 1.0 },
      uPrimary: { value: new THREE.Color(baseColorHex) },
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
        float pulseMask = 1.0 - smoothstep(front - 0.14, front + 0.04, axial);
        float wave = pow(0.5 + 0.5 * cos((axial * 7.5 - uTime * 2.4) * 6.283185), 2.5);
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float rim = pow(1.0 - abs(dot(n, v)), 1.25);
        vec3 col = mix(uSecondary, uPrimary, clamp(wave * 0.8 + rim * 0.35, 0.0, 1.0));
        float alpha = clamp((0.18 + 0.62 * wave) * pulseMask * (0.55 + 0.55 * rim) * uIntensity, 0.02, 0.88);
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

function buildBranchAssembly(
  branchId: WorkshopAr4dBranchId,
  accentHex: string,
  envMap: THREE.Texture | null
): BuiltBranchRig {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.86,
    roughness: 0.28,
    envMap,
    envMapIntensity: 1.1,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.72,
    roughness: 0.38,
    envMap,
  });

  const weldMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.22,
    envMap,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentHex),
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 0.45,
    metalness: 0.4,
    roughness: 0.25,
  });

  // Ground contact ring anchored just above floor plane
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 1.86, 64),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = -1.58;
  group.add(baseRing);

  // Common Lathe-profile industrial pipe helper for pipe-based disciplines
  const buildSteelPipeWithWeld = (radius = 0.88, length = 3.2, transparentCut = false) => {
    const pipeGroup = new THREE.Group();
    const pipeMat = transparentCut
      ? new THREE.MeshPhysicalMaterial({
          color: 0x475569,
          metalness: 0.65,
          roughness: 0.25,
          transparent: true,
          opacity: 0.56,
          transmission: 0.25,
          ior: 1.45,
          envMap,
        })
      : steelMat;

    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 40, 1, false), pipeMat);
    cyl.rotation.z = Math.PI / 2;
    cyl.castShadow = true;
    cyl.receiveShadow = true;
    pipeGroup.add(cyl);

    // Flanges on both ends via Extrude/Torus + instanced bolts
    [-length / 2, length / 2].forEach((xPos) => {
      const flange = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.16, radius + 0.16, 0.14, 36), darkAlloyMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.x = xPos;
      pipeGroup.add(flange);
    });

    // Instanced flange bolts (16 bolts total)
    const boltGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.2, 8);
    const bolts = new THREE.InstancedMesh(boltGeo, weldMat, 16);
    const dummy = new THREE.Object3D();
    let idx = 0;
    [-length / 2, length / 2].forEach((xPos) => {
      for (let b = 0; b < 8; b += 1) {
        const ang = (b / 8) * Math.PI * 2;
        dummy.position.set(xPos, Math.cos(ang) * (radius + 0.09), Math.sin(ang) * (radius + 0.09));
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.updateMatrix();
        bolts.setMatrixAt(idx, dummy.matrix);
        idx += 1;
      }
    });
    bolts.instanceMatrix.needsUpdate = true;
    bolts.computeBoundingSphere();
    pipeGroup.add(bolts);

    // Raised circumferential weld seam
    const weldCrown = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.025, 0.075, 16, 48), weldMat);
    weldCrown.rotation.y = Math.PI / 2;
    pipeGroup.add(weldCrown);

    return { pipeGroup, pipeCyl: cyl, weldCrown };
  };

  // =========================================================================
  // BRANCH 1: UT & PAUT — Orbiting Crawler + Perspex Wedge + 4D Shear Wave Cone
  // =========================================================================
  if (branchId === 'ut_paut') {
    const { pipeGroup } = buildSteelPipeWithWeld(0.86, 3.2, true);
    group.add(pipeGroup);

    const orbitPivot = new THREE.Group();
    group.add(orbitPivot);

    // Perspex Wedge (MeshPhysicalMaterial) + PAUT Probe housing riding at top radius
    const wedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.18, 0.26),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.12,
        transmission: 0.72,
        thickness: 0.3,
        ior: 1.49,
        transparent: true,
        opacity: 0.88,
      })
    );
    wedge.position.set(-0.46, 0.96, 0);
    orbitPivot.add(wedge);

    const probeBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.24), accentMat);
    probeBody.position.set(-0.52, 1.12, 0);
    orbitPivot.add(probeBody);

    // Four crawler wheels straddling pipe
    [-0.16, 0.16].forEach((zOff) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), darkAlloyMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(-0.46, 0.94, zOff);
      orbitPivot.add(wheel);
    });

    // Animated 4D Shear / Sectorial Beam Cone
    const utBeamMat = createEnergyWaveShader('#22d3ee', '#0284c7');
    const utBeam = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.35, 24, 1, true), utBeamMat);
    utBeam.position.set(-0.08, 0.42, 0);
    utBeam.rotation.z = 0.78;
    orbitPivot.add(utBeam);

    // Internal root weld defect reflector pulsing when sound wave hits t ~ 0.55
    const flawSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.8,
      })
    );
    flawSphere.position.set(0.0, 0.15, 0);
    group.add(flawSphere);

    return {
      group,
      update: (elapsed, t4d, p1, p2) => {
        orbitPivot.rotation.x = t4d * Math.PI * 1.4 - 0.5;
        const beamAngleRad = ((p1 - 45) * Math.PI) / 180;
        utBeam.rotation.z = 0.65 + beamAngleRad * 0.45;
        const wallScale = 0.78 + ((p2 - 8) / 32) * 0.45;
        utBeam.scale.set(1, wallScale, 1);
        utBeamMat.uniforms.uTime.value = elapsed;
        utBeamMat.uniforms.uProgress.value = t4d;
        const hitPulse = Math.exp(-Math.pow((t4d - 0.58) * 5, 2));
        flawSphere.scale.setScalar(0.85 + hitPulse * 0.65);
        (flawSphere.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + hitPulse * 2.1;
      },
    };
  }

  // =========================================================================
  // BRANCH 2: RT Gamma & X-Ray — Sentinel Guide Tube Crank + 360° Photon Flux + Film Darkening
  // =========================================================================
  if (branchId === 'rt_gamma_xray') {
    const { pipeGroup } = buildSteelPipeWithWeld(0.88, 3.2, true);
    group.add(pipeGroup);

    // External Sentinel Projector Camera Box
    const projector = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.42), darkAlloyMat);
    projector.position.set(-1.55, -0.95, 0.85);
    group.add(projector);

    // S-Tube guide path from projector to center of pipe weld
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, -0.82, 0.72),
      new THREE.Vector3(-0.75, -0.35, 0.25),
      new THREE.Vector3(-0.15, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
    ]);
    const guideTube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.045, 10, false),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.3 })
    );
    group.add(guideTube);

    // Moving Ir-192 Isotope Capsule traveling along the curve by t4d
    const sourceCapsule = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.8,
      })
    );
    group.add(sourceCapsule);

    // 360° Gamma Photon Cone / Cylinder Field
    const gammaShader = createEnergyWaveShader('#fbbf24', '#ea580c');
    const photonRing = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.34, 48, 1, true), gammaShader);
    photonRing.rotation.z = Math.PI / 2;
    group.add(photonRing);

    // Wrap-around Agfa D7 Film Cassette Belt around the weld darkening as t advances
    const filmMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0f172a,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const filmBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.42, 48, 1, true), filmMat);
    filmBelt.rotation.z = Math.PI / 2;
    group.add(filmBelt);

    return {
      group,
      update: (elapsed, t4d, p1, p2) => {
        const crankT = Math.min(1, t4d * 2.5);
        const pos = curve.getPointAt(crankT);
        sourceCapsule.position.copy(pos);
        const exposureActive = t4d >= 0.2 ? Math.min(1, (t4d - 0.2) * 1.4) : 0.1;
        gammaShader.uniforms.uTime.value = elapsed * (0.7 + p2 / 60);
        gammaShader.uniforms.uProgress.value = exposureActive;
        gammaShader.uniforms.uIntensity.value = 0.55 + (p2 / 80) * 0.75;
        // Film optically darkens over exposure time
        const darkness = Math.max(0.08, 0.68 - t4d * 0.56);
        filmMat.color.setRGB(darkness * 0.3, darkness * 0.6, darkness * 0.95);
        filmMat.opacity = 0.38 + t4d * 0.42;
        const scaleSfd = 0.85 + ((p1 - 250) / 550) * 0.42;
        projector.position.set(-1.35 * scaleSfd, -0.95, 0.85);
      },
    };
  }

  // =========================================================================
  // BRANCH 3: VT / PT / MT Yoke — Butt Weld Plate + Copper Coil Yoke + Glowing Flux + Crack Bleed
  // =========================================================================
  if (branchId === 'vt_pt_mt_surface') {
    // Heavy beveled steel plate coupon
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.36, 1.8), steelMat);
    plate.position.y = -0.55;
    plate.receiveShadow = true;
    group.add(plate);

    const weldBead = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 1.82, 20), weldMat);
    weldBead.rotation.x = Math.PI / 2;
    weldBead.position.set(0, -0.35, 0);
    group.add(weldBead);

    // Surface Crack Line glowing intensely with UV-A penetrant bleed-out
    const crackMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xec4899,
      emissiveIntensity: 0.4,
    });
    const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.82), crackMat);
    crackMesh.position.set(0.02, -0.22, 0);
    group.add(crackMesh);

    // Articulated Electromagnetic Yoke straddling weld
    const yokeGroup = new THREE.Group();
    group.add(yokeGroup);

    const yokeArchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, -0.25, 0),
      new THREE.Vector3(-0.58, 0.62, 0),
      new THREE.Vector3(0.0, 0.88, 0),
      new THREE.Vector3(0.58, 0.62, 0),
      new THREE.Vector3(0.62, -0.25, 0),
    ]);
    const yokeCore = new THREE.Mesh(new THREE.TubeGeometry(yokeArchCurve, 28, 0.09, 12, false), darkAlloyMat);
    yokeGroup.add(yokeCore);

    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
    [-0.58, 0.58].forEach((xLeg) => {
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 20), copperMat);
      coil.position.set(xLeg, 0.34, 0);
      yokeGroup.add(coil);
    });

    // Magnetic flux field lines arcing across weld
    const fluxMat = createEnergyWaveShader('#ec4899', '#38bdf8');
    const fluxPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.52), fluxMat);
    fluxPlane.rotation.x = -Math.PI / 2;
    fluxPlane.position.set(0, -0.18, 0);
    yokeGroup.add(fluxPlane);

    return {
      group,
      update: (elapsed, t4d, p1, p2) => {
        yokeGroup.position.z = Math.sin(t4d * Math.PI * 2) * 0.45;
        const spacingFactor = 0.72 + ((p2 - 60) / 120) * 0.58;
        yokeGroup.scale.x = spacingFactor;
        const dwellGlow = Math.min(1, (t4d * p1) / 8);
        crackMat.emissiveIntensity = 0.25 + dwellGlow * 2.4;
        fluxMat.uniforms.uTime.value = elapsed;
        fluxMat.uniforms.uProgress.value = t4d;
        fluxMat.uniforms.uIntensity.value = 0.5 + dwellGlow * 0.7;
      },
    };
  }

  // =========================================================================
  // BRANCH 4: ET & MFL — Heat-Exchanger Tube Bundle + Motorized MFL Scanner Probe
  // =========================================================================
  if (branchId === 'et_mfl_tubing') {
    const bundleGroup = new THREE.Group();
    group.add(bundleGroup);

    // Instanced array of 9 heat-exchanger / boiler tubes
    const tubeGeo = new THREE.CylinderGeometry(0.11, 0.11, 3.2, 20);
    const tubes = new THREE.InstancedMesh(tubeGeo, steelMat, 9);
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let r = -1; r <= 1; r += 1) {
      for (let c = -1; c <= 1; c += 1) {
        dummy.position.set(0, r * 0.44, c * 0.44);
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.updateMatrix();
        tubes.setMatrixAt(idx, dummy.matrix);
        idx += 1;
      }
    }
    tubes.instanceMatrix.needsUpdate = true;
    tubes.computeBoundingSphere();
    bundleGroup.add(tubes);

    // 3 vertical baffle support plates
    [-1.05, 0.0, 1.05].forEach((bx) => {
      const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 1.35), darkAlloyMat);
      baffle.position.x = bx;
      bundleGroup.add(baffle);
    });

    // Moving MFL / Bobbin Probe Collar scanning center top tube
    const probeCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.34, 24), accentMat);
    probeCollar.rotation.z = Math.PI / 2;
    probeCollar.position.set(-1.4, 0.44, 0);
    group.add(probeCollar);

    // Eddy Current / MFL Magnetic Pulse Ring around probe
    const ecShader = createEnergyWaveShader('#a78bfa', '#22d3ee');
    const pulseHalo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 14, 32), ecShader);
    pulseHalo.rotation.y = Math.PI / 2;
    probeCollar.add(pulseHalo);

    // Localized pitting defect marker at x = +0.58
    const pitFlaw = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.9 })
    );
    pitFlaw.position.set(0.58, 0.44, 0);
    group.add(pitFlaw);

    return {
      group,
      update: (elapsed, t4d, p1, p2) => {
        const scanX = -1.45 + t4d * 2.9;
        probeCollar.position.x = scanX;
        const distToFlaw = Math.abs(scanX - 0.58);
        const flawHit = Math.exp(-Math.pow(distToFlaw * 3.5, 2));
        pulseHalo.scale.setScalar(1 + flawHit * 0.55);
        pitFlaw.scale.setScalar(0.6 + (p2 / 85) * 0.85 + flawHit * 0.4);
        ecShader.uniforms.uTime.value = elapsed * (0.7 + p1 / 200);
        ecShader.uniforms.uProgress.value = Math.max(0.25, t4d);
      },
    };
  }

  // =========================================================================
  // BRANCH 5: PWHT 65 kW — Pipe + 12 Instanced Ceramic FCP Pads + Blackbody Thermal Glow
  // =========================================================================
  if (branchId === 'pwht_metallurgy') {
    const { pipeGroup } = buildSteelPipeWithWeld(0.86, 3.2, false);
    group.add(pipeGroup);

    // 12 Ceramic Flexible Heating Pads (InstancedMesh) hugging the weld band
    const padGeo = new THREE.BoxGeometry(0.46, 0.09, 0.34);
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

    // Type-K Thermocouple Wire & Probe
    const tcRing = new THREE.Mesh(new THREE.TorusGeometry(0.99, 0.025, 10, 48), weldMat);
    tcRing.rotation.y = Math.PI / 2;
    tcRing.position.x = 0.28;
    group.add(tcRing);

    // 4D Thermal Halo Plume rising over weld
    const thermalShader = createEnergyWaveShader('#fb7185', '#f59e0b');
    const heatHalo = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.12, 0.85, 40, 1, true), thermalShader);
    heatHalo.rotation.z = Math.PI / 2;
    group.add(heatHalo);

    return {
      group,
      update: (elapsed, t4d, p1) => {
        // Trapezoidal thermal curve: ramp (0..0.35), soak (0.35..0.72), cool (0.72..1.0)
        let heatNorm = 0;
        if (t4d < 0.35) heatNorm = t4d / 0.35;
        else if (t4d < 0.72) heatNorm = 1.0;
        else heatNorm = Math.max(0.18, 1.0 - (t4d - 0.72) / 0.28);

        const tempGain = ((p1 - 580) / 200) * 0.45 + 0.65;
        const glow = heatNorm * tempGain;
        padMat.emissive.setRGB(1.0 * glow, 0.28 * glow * glow, 0.03 * glow);
        padMat.emissiveIntensity = 0.15 + glow * 2.4;
        thermalShader.uniforms.uTime.value = elapsed;
        thermalShader.uniforms.uProgress.value = Math.max(0.15, heatNorm);
        thermalShader.uniforms.uIntensity.value = 0.3 + glow * 0.8;
      },
    };
  }

  // =========================================================================
  // BRANCH 6: Welding & Hydrotest — 4 Progressive Weld Passes + Pressurized Hydro Flanges
  // =========================================================================
  if (branchId === 'welding_hydro') {
    const { pipeGroup, weldCrown } = buildSteelPipeWithWeld(0.84, 3.0, true);
    group.add(pipeGroup);

    // Glowing GTAW Arc spot moving along weld during t = 0..0.65
    const arcOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0x38bdf8, emissiveIntensity: 2.2 })
    );
    group.add(arcOrb);

    // Heavy Hydrotest End Blind Plates + Pressure Gauge Dial
    const gaugeHead = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 24), accentMat);
    gaugeHead.position.set(1.56, 0.45, 0);
    gaugeHead.rotation.z = Math.PI / 2;
    group.add(gaugeHead);

    // Pressurized Internal Hydro Wave Rings expanding when t >= 0.65
    const hydroShader = createEnergyWaveShader('#fb923c', '#10b981');
    const hydroPulse = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 2.7, 36, 1, true), hydroShader);
    hydroPulse.rotation.z = Math.PI / 2;
    group.add(hydroPulse);

    return {
      group,
      update: (elapsed, t4d, p1, p2) => {
        const weldPhase = Math.min(1, t4d / 0.65);
        const arcAngle = weldPhase * Math.PI * 2;
        arcOrb.visible = t4d < 0.66;
        arcOrb.position.set(0, Math.cos(arcAngle) * 0.9, Math.sin(arcAngle) * 0.9);
        const beadGrow = 0.4 + weldPhase * 0.72 + (p1 - 0.6) * 0.08;
        weldCrown.scale.set(1, 1, beadGrow);

        const hydroActive = t4d >= 0.65 ? Math.min(1, (t4d - 0.65) / 0.25) : 0.05;
        hydroPulse.scale.set(1 + hydroActive * 0.06, 1, 1 + hydroActive * 0.06);
        hydroShader.uniforms.uTime.value = elapsed;
        hydroShader.uniforms.uProgress.value = hydroActive;
        hydroShader.uniforms.uIntensity.value = hydroActive * (0.45 + p2 / 180);
      },
    };
  }

  // =========================================================================
  // BRANCH 7: API Corrosion & Coating Holiday — Coated Pipe Wall Loss Morph + 15 kV Brush
  // =========================================================================
  if (branchId === 'api_coating_corrosion') {
    const { pipeGroup, pipeCyl } = buildSteelPipeWithWeld(0.86, 3.2, false);
    group.add(pipeGroup);

    // Translucent Protective Epoxy Jacket
    const coatMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      roughness: 0.2,
      transparent: true,
      opacity: 0.52,
      envMap,
    });
    const coatJacket = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 2.85, 40, 1, true), coatMat);
    coatJacket.rotation.z = Math.PI / 2;
    group.add(coatJacket);

    // Moving 15 kV Holiday Spark Brass Brush Collar
    const brushRing = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.06, 14, 42), accentMat);
    brushRing.rotation.y = Math.PI / 2;
    group.add(brushRing);

    const sparkOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0x22d3ee, emissiveIntensity: 2.5 })
    );
    sparkOrb.position.set(0.32, 0.94, 0);
    group.add(sparkOrb);

    return {
      group,
      update: (elapsed, t4d, p1, p2) => {
        brushRing.position.x = -1.3 + t4d * 2.6;
        // Simulate multi-year internal wall thinning slightly scaling pipe radius
        const wallRetention = Math.max(0.76, 1 - t4d * (p1 * 0.32));
        pipeCyl.scale.set(wallRetention, 1, wallRetention);
        coatMat.opacity = 0.28 + ((p2 - 120) / 430) * 0.45;
        const nearPinhole = Math.exp(-Math.pow((brushRing.position.x - 0.32) * 4, 2));
        sparkOrb.scale.setScalar(0.35 + nearPinhole * (1.2 + 0.3 * Math.sin(elapsed * 22)));
      },
    };
  }

  // =========================================================================
  // BRANCH 8: Asset Integrity · IRATA Rope Access — Elevated Column + Twin Ropes + Tech Descent
  // =========================================================================
  const towerMat = steelMat;
  const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 3.3, 36), towerMat);
  vessel.position.y = 0.05;
  vessel.castShadow = true;
  group.add(vessel);

  const topDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.76, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    darkAlloyMat
  );
  topDome.position.y = 1.7;
  group.add(topDome);

  // Stiffening Rings (InstancedMesh)
  const stiffener = new THREE.InstancedMesh(new THREE.TorusGeometry(0.81, 0.04, 10, 36), darkAlloyMat, 4);
  const sDummy = new THREE.Object3D();
  [-1.1, -0.35, 0.4, 1.15].forEach((yLvl, idx) => {
    sDummy.position.set(0, yLvl, 0);
    sDummy.rotation.set(Math.PI / 2, 0, 0);
    sDummy.updateMatrix();
    stiffener.setMatrixAt(idx, sDummy.matrix);
  });
  stiffener.instanceMatrix.needsUpdate = true;
  stiffener.computeBoundingSphere();
  group.add(stiffener);

  // Twin Independent IRATA Working & Safety Ropes
  const mainRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 3.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 })
  );
  mainRope.position.set(-0.14, 0.05, 0.88);
  group.add(mainRope);

  const backupRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 3.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.4 })
  );
  backupRope.position.set(0.14, 0.05, 0.88);
  group.add(backupRope);

  // Descending Technician Harness + UT Kit Rig
  const techRig = new THREE.Group();
  const harness = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.24), accentMat);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.3 })
  );
  helmet.position.y = 0.34;
  techRig.add(harness, helmet);
  techRig.position.set(0, 1.1, 0.92);
  group.add(techRig);

  // RBI Risk Reduction Orbit Halo
  const rbiMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x10b981,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.78,
  });
  const rbiHalo = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.04, 14, 48), rbiMat);
  rbiHalo.rotation.x = Math.PI / 2;
  group.add(rbiHalo);

  return {
    group,
    update: (_elapsed, t4d, p1, p2) => {
      const span = 1.65 + (p1 / 95) * 0.75;
      techRig.position.y = 1.35 - t4d * Math.min(2.4, span);
      rbiHalo.position.y = techRig.position.y;
      const riskProgress = Math.min(1, (p2 / 100) * (0.35 + t4d * 0.65));
      rbiMat.emissive.setRGB(1 - riskProgress, 0.45 + riskProgress * 0.55, 0.35);
      rbiMat.color.setRGB(1 - riskProgress * 0.7, 0.65 + riskProgress * 0.3, 0.95);
    },
  };
}

export const WorkshopAr4dThreeScene: React.FC<WorkshopAr4dThreeSceneProps> = ({
  language,
  branchId,
  timeProgress01,
  param1,
  param2,
  accentHex,
  backdropMode,
  arScalePct,
  arRotationDeg,
  telemetry,
}) => {
  const isAr = language === 'ar';
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState<boolean>(false);

  const liveStateRef = useRef<DynamicSceneState>({
    branchId,
    timeProgress01,
    param1,
    param2,
    arScalePct,
    arRotationDeg,
    backdropMode,
  });

  useEffect(() => {
    liveStateRef.current = {
      branchId,
      timeProgress01,
      param1,
      param2,
      arScalePct,
      arRotationDeg,
      backdropMode,
    };
  }, [branchId, timeProgress01, param1, param2, arScalePct, arRotationDeg, backdropMode]);

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
    const handleContextRestored = () => {
      // Scene continues on next tick
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
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      // Environment reflection map via RoomEnvironment on all devices
      pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
      roomEnv.dispose();
      scene.environment = envTarget.texture;

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
      camera.position.set(2.8, 1.9, 4.45);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.minDistance = 2.6;
      controls.maxDistance = 8.2;
      controls.maxPolarAngle = Math.PI * 0.62;

      // Key warm + fill cool lights
      const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.72);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.3);
      keyLight.position.set(4.5, 6.2, 4.0);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(new THREE.Color(accentHex), 1.15);
      rimLight.position.set(-4.2, 2.5, -3.6);
      scene.add(rimLight);

      // Subtle calibration floor grid plane
      const floorGrid = new THREE.GridHelper(9, 18, new THREE.Color(accentHex), 0x1e293b);
      floorGrid.position.y = -1.62;
      (floorGrid.material as THREE.Material).transparent = true;
      (floorGrid.material as THREE.Material).opacity = 0.28;
      scene.add(floorGrid);

      const arPivot = new THREE.Group();
      scene.add(arPivot);

      const rig = buildBranchAssembly(branchId, accentHex, envTarget.texture);
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
          // Pure transparent overlay directly atop live camera video or pipe image
          renderer.setClearColor(0x000000, 0);
          scene.fog = null;
          floorGrid.visible = false;
        }

        const scaleNorm = state.arScalePct / 100;
        arPivot.scale.setScalar(scaleNorm);
        arPivot.rotation.y = (state.arRotationDeg * Math.PI) / 180;

        rig.update(elapsed, state.timeProgress01, state.param1, state.param2);
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
          renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
          renderer.dispose();
        }
      };
    } catch {
      setWebglUnsupported(true);
    }
  }, [branchId, accentHex]);

  // Synchronized SVG 4D Projection Fallback (also cleanly visible in JSDOM headless testing)
  if (webglUnsupported) {
    const pct = Math.round(timeProgress01 * 100);
    const scaleNorm = arScalePct / 100;
    return (
      <div
        data-testid="workshop-ar4d-3d-fallback"
        className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
          backdropMode === 'studio3d' ? 'bg-[#050a18]' : 'bg-transparent'
        }`}
      >
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full pointer-events-none"
          aria-label={isAr ? `عرض 4D لفرع ${branchId}` : `4D projection for ${branchId}`}
        >
          <g transform={`translate(400, 225) rotate(${arRotationDeg}) scale(${scaleNorm})`}>
            {/* Perspective Steel Pipe / Specimen Wireframe */}
            <rect
              x="-240"
              y="-76"
              width="480"
              height="152"
              rx="18"
              fill="rgba(15, 23, 42, 0.38)"
              stroke={accentHex}
              strokeWidth="2.5"
              strokeDasharray="10 6"
            />
            {/* Weld Center Band */}
            <rect
              x="-24"
              y="-78"
              width="48"
              height="156"
              fill="rgba(251, 191, 36, 0.16)"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            {/* Moving 4D Time Scanner / Thermal / Radiation Wave Marker */}
            <circle
              cx={-180 + timeProgress01 * 360}
              cy={0}
              r={26 + (param2 % 20)}
              fill={accentHex}
              fillOpacity={0.28}
              stroke={accentHex}
              strokeWidth="3"
            />
            <line
              x1={-180 + timeProgress01 * 360}
              y1="-110"
              x2={-180 + timeProgress01 * 360}
              y2="110"
              stroke="#fef08a"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <text
              x="0"
              y="-108"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="16"
              fontFamily="monospace"
              fontWeight="bold"
            >
              4D AR ENGINE · {branchId.toUpperCase()} · t={pct}% · {telemetry.metric1Value}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="workshop-ar4d-three-canvas"
      className="relative w-full h-full"
    />
  );
};
