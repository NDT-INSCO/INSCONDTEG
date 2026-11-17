import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { a as require_react, n as Layers, r as Eye, t as require_jsx_runtime } from "./jsx-runtime-BdKgb6Yj.js";
import { Nt as Activity, Q as ShieldAlert, X as Sparkles, et as RotateCcw, nt as Play, rt as Pause } from "./index--gd7B8N2.js";
import { F as PerspectiveCamera, J as Vector3, L as PointLight, M as MeshStandardMaterial, O as Mesh, R as Points, S as LineBasicMaterial, U as Scene, a as BufferAttribute, f as CylinderGeometry, i as BoxGeometry, k as MeshBasicMaterial, l as Clock, n as WebGLRenderer, o as BufferGeometry, r as AmbientLight, v as Group, x as Line, z as PointsMaterial } from "./three.module-DZ1WiPWM.js";
//#region src/components/company/InteractiveInspectionHologram.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var InteractiveInspectionHologram = ({ language }) => {
	const isAr = language === "ar";
	const containerRef = (0, import_react.useRef)(null);
	const canvas2dRef = (0, import_react.useRef)(null);
	const [inspectionMode, setInspectionMode] = (0, import_react.useState)("ut");
	const [probeAngle, setProbeAngle] = (0, import_react.useState)(60);
	const [isScanning, setIsScanning] = (0, import_react.useState)(true);
	const [detectedDefect, setDetectedDefect] = (0, import_react.useState)(null);
	const sceneRef = (0, import_react.useRef)(null);
	const rendererRef = (0, import_react.useRef)(null);
	const animFrameRef = (0, import_react.useRef)(null);
	const pipeMeshRef = (0, import_react.useRef)(null);
	const weldMeshRef = (0, import_react.useRef)(null);
	const probeGroupRef = (0, import_react.useRef)(null);
	const beamLineRef = (0, import_react.useRef)(null);
	const particlesRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;
		const width = container.clientWidth;
		const height = container.clientHeight || 340;
		const scene = new Scene();
		sceneRef.current = scene;
		const camera = new PerspectiveCamera(45, width / height, .1, 100);
		camera.position.set(0, 4, 9);
		camera.lookAt(0, 0, 0);
		let renderer;
		try {
			renderer = new WebGLRenderer({
				antialias: true,
				alpha: true
			});
			renderer.setSize(width, height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			container.innerHTML = "";
			container.appendChild(renderer.domElement);
			rendererRef.current = renderer;
		} catch (err) {
			return;
		}
		const ambientLight = new AmbientLight(16777215, .7);
		scene.add(ambientLight);
		const cyanPointLight = new PointLight(440020, 3, 20);
		cyanPointLight.position.set(2, 5, 4);
		scene.add(cyanPointLight);
		const amberPointLight = new PointLight(16096779, 2, 15);
		amberPointLight.position.set(-3, -2, -2);
		scene.add(amberPointLight);
		const pipeRadius = 1.8;
		const pipeGeo = new CylinderGeometry(pipeRadius, pipeRadius, 8, 36, 1, true);
		pipeGeo.rotateZ(Math.PI / 2);
		const pipeMat = new MeshStandardMaterial({
			color: 1976635,
			metalness: .85,
			roughness: .25,
			wireframe: false,
			transparent: true,
			opacity: .88
		});
		const pipeMesh = new Mesh(pipeGeo, pipeMat);
		scene.add(pipeMesh);
		pipeMeshRef.current = pipeMesh;
		const wireMat = new MeshBasicMaterial({
			color: 561586,
			wireframe: true,
			transparent: true,
			opacity: .22
		});
		const wireMesh = new Mesh(pipeGeo, wireMat);
		scene.add(wireMesh);
		const weldGeo = new CylinderGeometry(1.84, 1.84, .6, 36);
		weldGeo.rotateZ(Math.PI / 2);
		const weldMat = new MeshStandardMaterial({
			color: 3718648,
			metalness: .9,
			roughness: .3,
			emissive: 165063,
			emissiveIntensity: .4
		});
		const weldMesh = new Mesh(weldGeo, weldMat);
		scene.add(weldMesh);
		weldMeshRef.current = weldMesh;
		const probeGroup = new Group();
		const probeHeadGeo = new BoxGeometry(.5, .35, .4);
		const probeMat = new MeshStandardMaterial({
			color: 165063,
			metalness: .6,
			roughness: .2,
			emissive: 440020,
			emissiveIntensity: .3
		});
		const probeMesh = new Mesh(probeHeadGeo, probeMat);
		probeGroup.add(probeMesh);
		const cableGeo = new CylinderGeometry(.06, .06, .4);
		const cableMat = new MeshBasicMaterial({ color: 988970 });
		const cableMesh = new Mesh(cableGeo, cableMat);
		cableMesh.position.y = .3;
		probeGroup.add(cableMesh);
		probeGroup.position.set(.6, 2, 0);
		scene.add(probeGroup);
		probeGroupRef.current = probeGroup;
		const beamGeo = new BufferGeometry().setFromPoints([
			new Vector3(0, 0, 0),
			new Vector3(-.6, -1.2, 0),
			new Vector3(0, -2.7, 0)
		]);
		const beamMat = new LineBasicMaterial({
			color: 2282478,
			linewidth: 2,
			transparent: true,
			opacity: .85
		});
		const beamLine = new Line(beamGeo, beamMat);
		probeGroup.add(beamLine);
		beamLineRef.current = beamLine;
		const particleCount = 80;
		const particlePositions = /* @__PURE__ */ new Float32Array(240);
		for (let i = 0; i < particleCount; i++) {
			particlePositions[i * 3] = (Math.random() - .5) * 6;
			particlePositions[i * 3 + 1] = (Math.random() - .5) * 3;
			particlePositions[i * 3 + 2] = (Math.random() - .5) * 3;
		}
		const particleGeo = new BufferGeometry();
		particleGeo.setAttribute("position", new BufferAttribute(particlePositions, 3));
		const particleMat = new PointsMaterial({
			color: 3718648,
			size: .05,
			transparent: true,
			opacity: .5
		});
		const particles = new Points(particleGeo, particleMat);
		scene.add(particles);
		particlesRef.current = particles;
		let clock = new Clock();
		const animate = () => {
			const elapsed = clock.getElapsedTime();
			if (pipeMesh) pipeMesh.rotation.x = .2;
			if (probeGroup && isScanning) {
				const scanOffset = Math.sin(elapsed * 2.2) * .9;
				probeGroup.position.x = scanOffset;
				probeGroup.position.y = 1.98 + Math.cos(scanOffset * .5) * .02;
				if (particles) particles.rotation.y = elapsed * .1;
				if (Math.abs(scanOffset) < .18) setDetectedDefect({
					type: isAr ? "نقص انصهار في جذر اللحام (Lack of Root Fusion)" : "Weld Root Lack of Fusion",
					depthMm: 14.8,
					amplitudeDb: 84.5,
					status: "REJECT"
				});
				else setDetectedDefect({
					type: isAr ? "هيكل معدني سليم ومطابق للكود" : "Base Material Sound & Verified",
					depthMm: 22,
					amplitudeDb: 18.2,
					status: "ACCEPT"
				});
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
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
			renderer.dispose();
		};
	}, [isScanning, isAr]);
	(0, import_react.useEffect)(() => {
		if (!weldMeshRef.current || !beamLineRef.current) return;
		const weldMat = weldMeshRef.current.material;
		const beamMat = beamLineRef.current.material;
		if (inspectionMode === "ut") {
			weldMat.emissive.setHex(165063);
			beamMat.color.setHex(2282478);
		} else if (inspectionMode === "rt") {
			weldMat.emissive.setHex(9647082);
			beamMat.color.setHex(12616956);
		} else if (inspectionMode === "pwht") {
			weldMat.emissive.setHex(14753096);
			weldMat.emissiveIntensity = .8;
			beamMat.color.setHex(16478597);
		}
	}, [inspectionMode]);
	(0, import_react.useEffect)(() => {
		const canvas = canvas2dRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let animId;
		let t = 0;
		const drawOscilloscope = () => {
			t += .05;
			const w = canvas.width;
			const h = canvas.height;
			ctx.fillStyle = "#090d16";
			ctx.fillRect(0, 0, w, h);
			ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
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
			ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.moveTo(0, h * .25);
			ctx.lineTo(w, h * .25);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
			ctx.font = "9px monospace";
			ctx.fillText("ASME 80% DAC GATE", 10, h * .25 - 4);
			ctx.strokeStyle = inspectionMode === "rt" ? "#c084fc" : inspectionMode === "pwht" ? "#f43f5e" : "#22d3ee";
			ctx.lineWidth = 2;
			ctx.beginPath();
			const baseLineY = h * .78;
			ctx.moveTo(0, baseLineY);
			const hasDefect = detectedDefect?.status === "REJECT";
			for (let x = 0; x < w; x++) {
				let y = baseLineY;
				if (x > 15 && x < 35) y -= Math.sin((x - 15) / 20 * Math.PI) * (h * .65);
				if (hasDefect && x > 95 && x < 125) {
					const spikeHeight = h * .58 + Math.sin(t * 8) * 8;
					y -= Math.sin((x - 95) / 30 * Math.PI) * spikeHeight;
				}
				if (x > 185 && x < 215) y -= Math.sin((x - 185) / 30 * Math.PI) * (h * .42);
				y += (Math.sin(x * .2 + t * 4) + Math.cos(x * .4 - t * 2)) * 2;
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 sm:p-8 overflow-hidden relative shadow-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-4 h-4 text-cyan-400 animate-spin-slow" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "المختبر ثلاثي الأبعاد التفاعلي" : "Live 3D Holographic NDT Inspection Lab" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg sm:text-xl font-bold text-white tracking-tight",
				children: isAr ? "محاكاة المسح الرقمي للحامات والأنابيب بالموجات فوق الصوتية وأشعة جاما" : "Interactive 3D Pipeline Weld Ultrasonic & Radiography Scanner"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setInspectionMode("ut"),
						className: `px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${inspectionMode === "ut" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "موجات UT" : "UT Waves" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setInspectionMode("rt"),
						className: `px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${inspectionMode === "rt" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "أشعة جاما RT" : "Gamma RT" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setInspectionMode("pwht"),
						className: `px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${inspectionMode === "pwht" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "حرارة PWHT" : "PWHT Heat" })]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-8 rounded-xl border border-slate-800 bg-linear-to-b from-slate-900/60 to-slate-950 p-4 relative flex flex-col justify-between min-h-[320px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: containerRef,
						className: "w-full h-72 sm:h-80"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-cyan-300",
							children: isAr ? "خط أنابيب 30\" ASTM A106 Gr. B" : "30\" Pipe ASTM A106 Gr. B"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-slate-300",
							children: isAr ? `زاوية المسبار: ${probeAngle}°` : `Probe Angle: ${probeAngle}°`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setIsScanning(!isScanning),
								className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition cursor-pointer",
								children: [isScanning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isScanning ? isAr ? "إيقاف مؤقت" : "Pause Scan" : isAr ? "تشغيل المسح" : "Resume Scan" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setProbeAngle((prev) => prev === 45 ? 60 : prev === 60 ? 70 : 45);
								},
								className: "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									isAr ? "تغيير الزاوية" : "Angle",
									": ",
									probeAngle,
									"°"
								] })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] font-mono text-slate-400",
							children: isAr ? "سرعة الصوت: 5,920 م/ث (صلب كربوني)" : "Velocity: 5,920 m/s (Carbon Steel)"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs font-mono uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "مرسمة الموجات (A-Scan RF Signal)" : "Real-Time A-Scan Signal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-cyan-400 font-bold",
							children: "5.0 MHz"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-lg overflow-hidden border border-slate-800 shadow-inner",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
							ref: canvas2dRef,
							width: 280,
							height: 140,
							className: "w-full h-auto block"
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-slate-950/80 border border-slate-800 p-3 space-y-2 font-mono text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-400",
									children: isAr ? "التقييم الكودي:" : "Evaluation:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `px-2 py-0.5 rounded text-[11px] font-bold ${detectedDefect?.status === "REJECT" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`,
									children: detectedDefect?.status === "REJECT" ? isAr ? "مرفوض كودياً (Defect Detected)" : "REJECT (Defect Exceeds DAC)" : isAr ? "مقبول (Sound Metal)" : "ACCEPT (Complies with Code)"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-slate-300 font-sans text-xs",
								children: detectedDefect?.type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									isAr ? "العمق:" : "Depth:",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-cyan-400 font-bold",
										children: [detectedDefect?.depthMm, " mm"]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									isAr ? "السعة:" : "Amplitude:",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-cyan-400 font-bold",
										children: [detectedDefect?.amplitudeDb, " dB"]
									})
								] })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "محاكاة تفاعلية مبنية على خوارزميات التفتيش بالموجات الصوتية طبقا لـ ASME Section V Art. 4." : "Simulating acoustic wave reflection compliant with ASME Section V Article 4." })]
					})
				]
			})]
		})]
	});
};
//#endregion
export { InteractiveInspectionHologram };
