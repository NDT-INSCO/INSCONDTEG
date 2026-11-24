import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type LessonFocus = 'ascan' | 'dac' | 'ut';
type Props = { speaking: boolean; thinking: boolean; lesson: LessonFocus };

export const VirtualEngineer3D: React.FC<Props> = ({ speaking, thinking, lesson }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(speaking);
  const thinkingRef = useRef(thinking);
  const lessonRef = useRef(lesson);

  useEffect(() => { speakingRef.current = speaking; }, [speaking]);
  useEffect(() => { thinkingRef.current = thinking; }, [thinking]);
  useEffect(() => { lessonRef.current = lesson; }, [lesson]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;

    try {
      const scene = new THREE.Scene();
      scene.background = null;
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
      camera.position.set(0, 1.55, 6.8);
      camera.lookAt(0, 1.35, 0);

      const activeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer = activeRenderer;
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      activeRenderer.setClearColor(0x000000, 0);
      activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
      activeRenderer.shadowMap.enabled = true;
      activeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.appendChild(activeRenderer.domElement);
      host.closest('.ve-instructor')?.classList.add('ve-3d-ready');

      scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x31445a, 2.0));
      const key = new THREE.DirectionalLight(0xffedcf, 2.4);
      key.position.set(3, 5, 5);
      key.castShadow = true;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x62c5d5, 1.3);
      rim.position.set(-4, 2, -2);
      scene.add(rim);

      const navy = new THREE.MeshStandardMaterial({ color: 0x244761, roughness: 0.72 });
      const jacket = new THREE.MeshStandardMaterial({ color: 0xc9d8df, roughness: 0.82 });
      const skin = new THREE.MeshStandardMaterial({ color: 0xc98f6c, roughness: 0.86 });
      const helmet = new THREE.MeshStandardMaterial({ color: 0xf0bd4e, roughness: 0.52 });
      const gold = new THREE.MeshStandardMaterial({ color: 0xd89a32, metalness: 0.35, roughness: 0.5 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x172b3c, roughness: 0.65 });
      const white = new THREE.MeshStandardMaterial({ color: 0xf3f7f7, roughness: 0.9 });

      const engineer = new THREE.Group();
      scene.add(engineer);

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 1.05, 6, 12), jacket);
      torso.position.set(0, 0.72, 0);
      torso.scale.set(1.12, 1, 0.72);
      torso.castShadow = true;
      engineer.add(torso);

      const shirt = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.75, 4), navy);
      shirt.position.set(0, 0.78, 0.39);
      shirt.rotation.z = Math.PI;
      shirt.scale.set(0.8, 1, 0.25);
      engineer.add(shirt);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.34, 16), skin);
      neck.position.set(0, 1.55, 0);
      engineer.add(neck);

      const head = new THREE.Group();
      head.position.set(0, 2.02, 0);
      engineer.add(head);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 20), skin);
      face.scale.set(0.82, 1.05, 0.78);
      face.castShadow = true;
      head.add(face);

      const eyeGeo = new THREE.SphereGeometry(0.035, 10, 8);
      for (const x of [-0.16, 0.16]) {
        const eye = new THREE.Mesh(eyeGeo, dark);
        eye.position.set(x, 0.06, 0.365);
        head.add(eye);
      }
      const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), dark);
      mouth.position.set(0, -0.19, 0.365);
      mouth.scale.set(0.8, 0.22, 0.28);
      head.add(mouth);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), helmet);
      cap.position.set(0, 0.31, 0);
      cap.scale.set(1.04, 0.9, 0.92);
      head.add(cap);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.055, 32), gold);
      brim.position.set(0, 0.16, 0.015);
      head.add(brim);

      const leftArm = new THREE.Group();
      leftArm.position.set(-0.48, 1.25, 0);
      engineer.add(leftArm);
      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.58, 4, 10), navy);
      upperArm.position.set(-0.3, 0.1, 0);
      upperArm.rotation.z = -1.08;
      leftArm.add(upperArm);
      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.53, 4, 10), skin);
      forearm.position.set(-0.72, 0.43, 0.02);
      forearm.rotation.z = -1.25;
      leftArm.add(forearm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), skin);
      hand.position.set(-1.04, 0.79, 0.04);
      leftArm.add(hand);
      const pointingFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.42, 10), skin);
      pointingFinger.position.set(-1.25, 1.02, 0.06);
      pointingFinger.rotation.z = -0.78;
      leftArm.add(pointingFinger);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.48, 1.25, 0);
      engineer.add(rightArm);
      const restingArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 4, 10), navy);
      restingArm.position.set(0.28, -0.16, 0);
      restingArm.rotation.z = -0.35;
      rightArm.add(restingArm);
      const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skin);
      rightHand.position.set(0.44, -0.57, 0.02);
      rightArm.add(rightHand);

      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.035), navy);
      badge.position.set(0.34, 0.78, 0.49);
      engineer.add(badge);
      const badgeStripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.015), gold);
      badgeStripe.position.set(0.34, 0.78, 0.514);
      engineer.add(badgeStripe);

      const ground = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), new THREE.MeshBasicMaterial({ color: 0x24445b, transparent: true, opacity: 0.12 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      ground.scale.set(1.15, 0.45, 1);
      scene.add(ground);

      const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        activeRenderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
      } else {
        window.addEventListener('resize', resize);
      }

      const clock = new THREE.Clock();
      const animate = () => {
        frame = window.requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        engineer.position.y = Math.sin(time * 1.4) * 0.025;
        head.rotation.y = thinkingRef.current ? Math.sin(time * 2) * 0.09 : Math.sin(time * 0.55) * 0.025;
        const targetAngle = lessonRef.current === 'dac' ? -0.16 : lessonRef.current === 'ut' ? 0.12 : 0;
        leftArm.rotation.z += (targetAngle - leftArm.rotation.z) * 0.055;
        leftArm.rotation.z += Math.sin(time * (speakingRef.current ? 3.2 : 0.8)) * (speakingRef.current ? 0.012 : 0.004);
        mouth.scale.y = speakingRef.current ? 0.18 + Math.abs(Math.sin(time * 10)) * 0.75 : 0.12;
        activeRenderer.render(scene, camera);
      };
      animate();
    } catch {
      host.closest('.ve-instructor')?.classList.remove('ve-3d-ready');
      renderer?.dispose();
    }

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      renderer?.dispose();
      renderer?.domElement.remove();
      host.closest('.ve-instructor')?.classList.remove('ve-3d-ready');
    };
  }, []);

  return <div className="ve-engineer-3d" ref={hostRef} aria-hidden="true" />;
};
