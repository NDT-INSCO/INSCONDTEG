import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Language } from '../../types';
import { Play, Pause, RotateCcw, Eye, ShieldAlert, Sparkles, Activity, Layers } from 'lucide-react';

interface InteractiveInspectionHologramProps {
  language: Language;
}

export const InteractiveInspectionHologram: React.FC<InteractiveInspectionHologramProps> = ({ language }) => {
  const isAr = language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas2dRef = useRef<HTMLCanvasElement>(null);

  // Inspection simulation state
  const [inspectionMode, setInspectionMode] = useState<'ut' | 'rt' | 'pwht'>('ut');
  const [probeAngle, setProbeAngle] = useState<number>(60);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [detectedDefect, setDetectedDefect] = useState<{
    type: string;
    depthMm: number;
    amplitudeDb: number;
    status: 'ACCEPT' | 'REJECT';
  } | null>(null);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const pipeMeshRef = useRef<THREE.Mesh | null>(null);
  const weldMeshRef = useRef<THREE.Mesh | null>(null);
  const probeGroupRef = useRef<THREE.Group | null>(null);
  const beamLineRef = useRef<THREE.Line | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (err) {
      // In headless test environments (JSDOM) where WebGL is unavailable
      return;
    }

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 3, 20);
    cyanPointLight.position.set(2, 5, 4);
    scene.add(cyanPointLight);

    const amberPointLight = new THREE.PointLight(0xf59e0b, 2, 15);
    amberPointLight.position.set(-3, -2, -2);
    scene.add(amberPointLight);

    // 1. Pipe Geometry (Cylinder representing heavy-wall pipeline)
    const pipeRadius = 1.8;
    const pipeLength = 8;
    const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLength, 36, 1, true);
    pipeGeo.rotateZ(Math.PI / 2);

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: false,
      transparent: true,
      opacity: 0.88,
    });
    const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
    scene.add(pipeMesh);
    pipeMeshRef.current = pipeMesh;

    // Inner wireframe cylinder for holographic digital grid effect
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0891b2,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const wireMesh = new THREE.Mesh(pipeGeo, wireMat);
    scene.add(wireMesh);

    // 2. Circumferential Weld Seam in the center
    const weldGeo = new THREE.CylinderGeometry(pipeRadius + 0.04, pipeRadius + 0.04, 0.6, 36);
    weldGeo.rotateZ(Math.PI / 2);
    const weldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const weldMesh = new THREE.Mesh(weldGeo, weldMat);
    scene.add(weldMesh);
    weldMeshRef.current = weldMesh;

    // 3. Ultrasonic Probe Transducer Model
    const probeGroup = new THREE.Group();
    const probeHeadGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
    const probeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.3,
    });
    const probeMesh = new THREE.Mesh(probeHeadGeo, probeMat);
    probeGroup.add(probeMesh);

    // Cable connector
    const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    cableMesh.position.y = 0.3;
    probeGroup.add(cableMesh);

    probeGroup.position.set(0.6, pipeRadius + 0.2, 0);
    scene.add(probeGroup);
    probeGroupRef.current = probeGroup;

    // 4. Acoustic Beam / Laser Path Line
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.6, -1.2, 0),
      new THREE.Vector3(0, -pipeRadius * 1.5, 0),
    ]);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const beamLine = new THREE.Line(beamGeo, beamMat);
    probeGroup.add(beamLine);
    beamLineRef.current = beamLine;

    // 5. Soundwave Particles / Photon Cloud
    const particleCount = 80;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Subtle slow rotation of the pipeline
      if (pipeMesh) {
        pipeMesh.rotation.x = 0.2;
      }

      // Moving probe scanning back and forth across weld seam
      if (probeGroup && isScanning) {
        const scanOffset = Math.sin(elapsed * 2.2) * 0.9;
        probeGroup.position.x = scanOffset;
        probeGroup.position.y = pipeRadius + 0.18 + Math.cos(scanOffset * 0.5) * 0.02;

        // Animate particles
        if (particles) {
          particles.rotation.y = elapsed * 0.1;
        }

        // Defect detection trigger when probe is directly over weld center
        if (Math.abs(scanOffset) < 0.18) {
          setDetectedDefect({
            type: isAr ? 'نقص انصهار في جذر اللحام (Lack of Root Fusion)' : 'Weld Root Lack of Fusion',
            depthMm: 14.8,
            amplitudeDb: 84.5,
            status: 'REJECT',
          });
        } else {
          setDetectedDefect({
            type: isAr ? 'هيكل معدني سليم ومطابق للكود' : 'Base Material Sound & Verified',
            depthMm: 22.0,
            amplitudeDb: 18.2,
            status: 'ACCEPT',
          });
        }
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [isScanning, isAr]);

  // Update inspection mode visualization in Three.js
  useEffect(() => {
    if (!weldMeshRef.current || !beamLineRef.current) return;
    const weldMat = weldMeshRef.current.material as THREE.MeshStandardMaterial;
    const beamMat = beamLineRef.current.material as THREE.LineBasicMaterial;

    if (inspectionMode === 'ut') {
      weldMat.emissive.setHex(0x0284c7);
      beamMat.color.setHex(0x22d3ee);
    } else if (inspectionMode === 'rt') {
      weldMat.emissive.setHex(0x9333ea);
      beamMat.color.setHex(0xc084fc);
    } else if (inspectionMode === 'pwht') {
      weldMat.emissive.setHex(0xe11d48);
      weldMat.emissiveIntensity = 0.8;
      beamMat.color.setHex(0xfb7185);
    }
  }, [inspectionMode]);

  // 2D Canvas A-Scan Radar / Oscilloscope Simulation
  useEffect(() => {
    const canvas = canvas2dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const drawOscilloscope = () => {
      t += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      // Dark oscilloscope grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;

      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 80% Full Screen Height (FSH) Threshold Gate
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.25);
      ctx.lineTo(w, h * 0.25);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = '9px monospace';
      ctx.fillText('ASME 80% DAC GATE', 10, h * 0.25 - 4);

      // Acoustic RF signal waveform
      ctx.strokeStyle = inspectionMode === 'rt' ? '#c084fc' : inspectionMode === 'pwht' ? '#f43f5e' : '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const baseLineY = h * 0.78;
      ctx.moveTo(0, baseLineY);

      const hasDefect = detectedDefect?.status === 'REJECT';

      for (let x = 0; x < w; x++) {
        let y = baseLineY;

        // Initial IP pulse at x = 20
        if (x > 15 && x < 35) {
          y -= Math.sin(((x - 15) / 20) * Math.PI) * (h * 0.65);
        }

        // Defect Echo Spike at x = 110 (triggers when defect detected)
        if (hasDefect && x > 95 && x < 125) {
          const spikeHeight = h * 0.58 + Math.sin(t * 8) * 8;
          y -= Math.sin(((x - 95) / 30) * Math.PI) * spikeHeight;
        }

        // Backwall Echo at x = 200
        if (x > 185 && x < 215) {
          y -= Math.sin(((x - 185) / 30) * Math.PI) * (h * 0.42);
        }

        // Noise floor
        y += (Math.sin(x * 0.2 + t * 4) + Math.cos(x * 0.4 - t * 2)) * 2;

        ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(drawOscilloscope);
    };

    drawOscilloscope();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [inspectionMode, detectedDefect]);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 sm:p-8 overflow-hidden relative shadow-2xl">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span>{isAr ? 'المختبر ثلاثي الأبعاد التفاعلي' : 'Live 3D Holographic NDT Inspection Lab'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {isAr
              ? 'محاكاة المسح الرقمي للحامات والأنابيب بالموجات فوق الصوتية وأشعة جاما'
              : 'Interactive 3D Pipeline Weld Ultrasonic & Radiography Scanner'}
          </h3>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setInspectionMode('ut')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              inspectionMode === 'ut' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isAr ? 'موجات UT' : 'UT Waves'}</span>
          </button>
          <button
            type="button"
            onClick={() => setInspectionMode('rt')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              inspectionMode === 'rt' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'أشعة جاما RT' : 'Gamma RT'}</span>
          </button>
          <button
            type="button"
            onClick={() => setInspectionMode('pwht')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              inspectionMode === 'pwht' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'حرارة PWHT' : 'PWHT Heat'}</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Holographic Viewport */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-linear-to-b from-slate-900/60 to-slate-950 p-4 relative flex flex-col justify-between min-h-[320px]">
          {/* Three.js Canvas Container */}
          <div ref={containerRef} className="w-full h-72 sm:h-80" />

          {/* Interactive HUD Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-cyan-300">
              {isAr ? 'خط أنابيب 30" ASTM A106 Gr. B' : '30" Pipe ASTM A106 Gr. B'}
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-slate-300">
              {isAr ? `زاوية المسبار: ${probeAngle}°` : `Probe Angle: ${probeAngle}°`}
            </div>
          </div>

          {/* Bottom Simulation Controls */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScanning(!isScanning)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition cursor-pointer"
              >
                {isScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isScanning ? (isAr ? 'إيقاف مؤقت' : 'Pause Scan') : (isAr ? 'تشغيل المسح' : 'Resume Scan')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProbeAngle((prev) => (prev === 45 ? 60 : prev === 60 ? 70 : 45));
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'تغيير الزاوية' : 'Angle'}: {probeAngle}°</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {isAr ? 'سرعة الصوت: 5,920 م/ث (صلب كربوني)' : 'Velocity: 5,920 m/s (Carbon Steel)'}
            </div>
          </div>
        </div>

        {/* Right: Live A-Scan Radar & Diagnostic HUD */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between">
              <span>{isAr ? 'مرسمة الموجات (A-Scan RF Signal)' : 'Real-Time A-Scan Signal'}</span>
              <span className="text-cyan-400 font-bold">5.0 MHz</span>
            </div>

            {/* 2D Canvas */}
            <div className="rounded-lg overflow-hidden border border-slate-800 shadow-inner">
              <canvas
                ref={canvas2dRef}
                width={280}
                height={140}
                className="w-full h-auto block"
              />
            </div>
          </div>

          {/* Defect Diagnostics Telemetry Card */}
          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'التقييم الكودي:' : 'Evaluation:'}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  detectedDefect?.status === 'REJECT'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {detectedDefect?.status === 'REJECT'
                  ? isAr ? 'مرفوض كودياً (Defect Detected)' : 'REJECT (Defect Exceeds DAC)'
                  : isAr ? 'مقبول (Sound Metal)' : 'ACCEPT (Complies with Code)'}
              </span>
            </div>

            <div className="text-slate-300 font-sans text-xs">
              {detectedDefect?.type}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div>
                {isAr ? 'العمق:' : 'Depth:'}{' '}
                <span className="text-cyan-400 font-bold">{detectedDefect?.depthMm} mm</span>
              </div>
              <div>
                {isAr ? 'السعة:' : 'Amplitude:'}{' '}
                <span className="text-cyan-400 font-bold">{detectedDefect?.amplitudeDb} dB</span>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              {isAr
                ? 'محاكاة تفاعلية مبنية على خوارزميات التفتيش بالموجات الصوتية طبقا لـ ASME Section V Art. 4.'
                : 'Simulating acoustic wave reflection compliant with ASME Section V Article 4.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
