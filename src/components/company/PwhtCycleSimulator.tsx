import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../types';
import { 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Thermometer,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface MaterialRecipe {
  id: string;
  name: { ar: string; en: string };
  code: string;
  preheatTemp: number; // °C
  soakTemp: number; // °C
  soakTimeMin: number; // minutes
  maxHeatingRate: number; // °C/hr
  maxCoolingRate: number; // °C/hr
  standardRef: string;
}

const MATERIAL_RECIPES: MaterialRecipe[] = [
  {
    id: 'p91',
    name: { ar: 'سبيكة P91 (محطات توليد الطاقة الكهربائية)', en: 'P91 Alloy (CCPP Supercritical Steam)' },
    code: 'Grade 91 (9Cr-1Mo-V)',
    preheatTemp: 220,
    soakTemp: 760,
    soakTimeMin: 120,
    maxHeatingRate: 110,
    maxCoolingRate: 100,
    standardRef: 'AWS D10.10 / ASME B31.1 Table 132'
  },
  {
    id: 'p22',
    name: { ar: 'سبيكة P22 (خطوط إعادة التسخين الحرج)', en: 'P22 Alloy (2.25Cr-1Mo Piping)' },
    code: 'Grade 22 (2.25Cr-1Mo)',
    preheatTemp: 180,
    soakTemp: 715,
    soakTimeMin: 90,
    maxHeatingRate: 150,
    maxCoolingRate: 120,
    standardRef: 'ASME Section I PW-39'
  },
  {
    id: 'cs-heavy',
    name: { ar: 'صلب كربوني عالي السماكة (أوعية الضغط)', en: 'Heavy Carbon Steel (Pressure Vessels)' },
    code: 'A516 Gr. 70 / A106 Gr. B',
    preheatTemp: 100,
    soakTemp: 620,
    soakTimeMin: 60,
    maxHeatingRate: 200,
    maxCoolingRate: 150,
    standardRef: 'ASME Section VIII Div. 1 UCS-56'
  }
];

interface PwhtCycleSimulatorProps {
  language: Language;
}

export const PwhtCycleSimulator: React.FC<PwhtCycleSimulatorProps> = ({ language }) => {
  const isAr = language === 'ar';

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('p91');
  const recipe = MATERIAL_RECIPES.find(m => m.id === selectedMaterialId) || MATERIAL_RECIPES[0];

  // Simulation state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressSec, setProgressSec] = useState<number>(0); // 0 to 600 (represents 0 to 10 hours)
  const [simSpeed, setSimSpeed] = useState<number>(2); // 1x, 2x, 5x
  const animationRef = useRef<number | null>(null);

  // Temperature calculations based on current progressSec (0 to 600)
  // Phase 1: Heating Ramp (0 - 200s) -> 25°C to soakTemp
  // Phase 2: Soaking Plateau (200 - 400s) -> soakTemp ± 5°C
  // Phase 3: Controlled Cooling (400 - 550s) -> soakTemp to 300°C
  // Phase 4: Air Cooling (550 - 600s) -> 300°C to 50°C
  const calculateCycleTemp = (time: number) => {
    const ambient = 25;
    const soak = recipe.soakTemp;
    if (time <= 200) {
      // Ramp Up
      const pct = time / 200;
      return Math.round(ambient + pct * (soak - ambient));
    } else if (time <= 400) {
      // Soaking Plateau
      const jitter = Math.sin(time * 0.2) * 3;
      return Math.round(soak + jitter);
    } else if (time <= 550) {
      // Controlled Cooling
      const pct = (time - 400) / 150;
      return Math.round(soak - pct * (soak - 300));
    } else {
      // Final Air Cooling
      const pct = (time - 550) / 50;
      return Math.round(300 - pct * (300 - 50));
    }
  };

  const currentTemp = calculateCycleTemp(progressSec);

  // 6 Channel Thermocouple Readings with realistic thermal gradients
  const tcReadings = [
    { label: 'TC-1 (Top)', temp: currentTemp, delta: 0 },
    { label: 'TC-2 (Bottom)', temp: Math.round(currentTemp - 4 + Math.sin(progressSec * 0.1) * 2), delta: -4 },
    { label: 'TC-3 (Left HAZ)', temp: Math.round(currentTemp - 8), delta: -8 },
    { label: 'TC-4 (Right HAZ)', temp: Math.round(currentTemp - 7), delta: -7 },
    { label: 'TC-5 (Weld Center)', temp: Math.round(currentTemp + 2), delta: +2 },
    { label: 'TC-6 (Aux Control)', temp: Math.round(currentTemp - 12), delta: -12 }
  ];

  // Determine current cycle stage
  let stageName = { ar: 'مرحلة التسخين والتصاعد التدريجي (Heating Ramp)', en: 'Controlled Heating Ramp' };
  let stageColor = 'text-amber-400';
  if (progressSec > 200 && progressSec <= 400) {
    stageName = { ar: 'مرحلة التثبيت الحراري (Soaking Plateau)', en: 'Soaking Plateau & Stress Relief' };
    stageColor = 'text-red-400';
  } else if (progressSec > 400 && progressSec <= 550) {
    stageName = { ar: 'مرحلة التبريد المنظم تحت العزل (Controlled Cooling)', en: 'Controlled Cooling Under Insulation' };
    stageColor = 'text-cyan-400';
  } else if (progressSec > 550) {
    stageName = { ar: 'مرحلة التبريد الهوائي الطبيعي (Air Cooling)', en: 'Final Ambient Air Cooling' };
    stageColor = 'text-emerald-400';
  }

  // Color gradient for pipe glow based on temperature
  const getPipeGlowStyle = (temp: number) => {
    if (temp < 150) {
      return { fill: '#1e293b', stroke: '#38bdf8', glow: 'rgba(56, 189, 248, 0.1)' };
    } else if (temp < 350) {
      return { fill: '#334155', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.2)' };
    } else if (temp < 550) {
      return { fill: '#7c2d12', stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    } else {
      // 550 - 780°C Glowing Cherry Red / Molten Gold
      return { fill: '#991b1b', stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.7)' };
    }
  };

  const pipeStyle = getPipeGlowStyle(currentTemp);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setProgressSec((prev) => {
          if (prev >= 600) {
            setIsRunning(false);
            return 600;
          }
          return prev + simSpeed;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRunning, simSpeed]);

  const handleReset = () => {
    setIsRunning(false);
    setProgressSec(0);
  };

  return (
    <section id="pwht-simulator" className="py-16 border-b border-slate-800 bg-slate-950 relative overflow-hidden">
      {/* Dynamic ambient heat backdrop */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000"
        style={{
          backgroundColor: currentTemp > 500 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(6, 182, 212, 0.06)'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>{isAr ? 'المحاكي الحراري الحي لأسطول وحدات 65 kW الأوتوماتيكية' : 'Live Heat Treatment Cycle Simulator (65 kW Fleet)'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr ? 'محاكاة دورة المعالجة الحرارية بعد اللحام (PWHT Cycle)' : 'Precision Post-Weld Heat Treatment Cycle Simulation'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'استكشف آلية عمل وحدات المعالجة الحرارية الـ 16 المملوكة لإنسكو بقدرة 65 kW المزودة بـ 6 قنوات تحكم PID ومسجلات Chino / Eurotherm الدقيقة لمطابقة متطلبات الكود ASME B31.1 و AWS D10.10.'
                : 'Interact with the automated thermal cycle executed by INSCO’s 16-unit 65 kW fleet, featuring 6-channel independent PID control and Eurotherm temperature logging complying with ASME B31.1 & AWS D10.10.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
              {isAr ? '16 وحدة مملوكة بالكامل' : '16 Fleet Units Owned'}
            </span>
          </div>
        </div>

        {/* Recipe Selection Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {MATERIAL_RECIPES.map((mat) => {
            const isSelected = mat.id === selectedMaterialId;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => {
                  setSelectedMaterialId(mat.id);
                  setProgressSec(0);
                  setIsRunning(false);
                }}
                className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-amber-400">{mat.code}</span>
                  <span className="text-slate-500">{mat.soakTemp} °C</span>
                </div>
                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {mat.name[language]}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  {mat.standardRef}
                </div>
              </button>
            );
          })}
        </div>

        {/* Simulator Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left/Main Column: Visual Pipe Heating + Strip Chart Graph */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Animated Pipe Cross-Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {isAr ? 'رسم حي لحرارة وصلة اللحام والمقاومات السيراميكية (Ceramic Heaters)' : 'Thermal Core Visualization & Flexible Ceramic Heating Pads'}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {stageName[language]}
                </div>
              </div>

              {/* Graphic Pipe SVG with Live Glow Shader */}
              <div className="relative py-4 flex items-center justify-center">
                <svg
                  viewBox="0 0 600 220"
                  className="w-full max-w-lg h-auto transition-all duration-700 drop-shadow-2xl"
                  style={{ filter: `drop-shadow(0 0 25px ${pipeStyle.glow})` }}
                >
                  <defs>
                    <radialGradient id="pipeHeatGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={currentTemp > 400 ? '#facc15' : '#38bdf8'} stopOpacity="0.8" />
                      <stop offset="60%" stopColor={pipeStyle.fill} stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
                    </radialGradient>
                    <pattern id="insulationPads" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect width="18" height="18" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                    </pattern>
                  </defs>

                  {/* Outer Insulation Blanket */}
                  <rect x="150" y="20" width="300" height="180" rx="12" fill="url(#insulationPads)" opacity="0.4" />
                  <rect x="150" y="20" width="300" height="180" rx="12" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Main Heavy-Wall Pipe Cylinder */}
                  <rect x="40" y="55" width="520" height="110" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />

                  {/* Heated Zone under Ceramic Resistance Mats */}
                  <rect 
                    x="180" 
                    y="55" 
                    width="240" 
                    height="110" 
                    fill="url(#pipeHeatGlow)" 
                    stroke={pipeStyle.stroke} 
                    strokeWidth="2.5" 
                    className="transition-colors duration-500"
                  />

                  {/* Circumferential Weld Centerline */}
                  <line x1="300" y1="55" x2="300" y2="165" stroke="#f8fafc" strokeWidth="3" strokeDasharray="5 3" />
                  
                  {/* Heat Convection Wave Lines when hot */}
                  {currentTemp > 300 && (
                    <g opacity={Math.min(1, (currentTemp - 300) / 300)}>
                      <path d="M 220 15 Q 240 5 260 15 T 300 15" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />
                      <path d="M 300 15 Q 320 5 340 15 T 380 15" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />
                    </g>
                  )}

                  {/* Thermocouple Attachment Points (TC1 to TC6) */}
                  <circle cx="300" cy="55" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                  <text x="310" y="52" fill="#fda4af" fontSize="10" fontFamily="monospace">TC-1 (Top)</text>

                  <circle cx="300" cy="165" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                  <text x="310" y="178" fill="#fda4af" fontSize="10" fontFamily="monospace">TC-2 (Bottom)</text>

                  <circle cx="210" cy="110" r="5" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                  <text x="145" y="113" fill="#7dd3fc" fontSize="10" fontFamily="monospace">TC-3 (HAZ)</text>

                  <circle cx="390" cy="110" r="5" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                  <text x="402" y="113" fill="#7dd3fc" fontSize="10" fontFamily="monospace">TC-4 (HAZ)</text>

                  <circle cx="300" cy="110" r="6" fill="#eab308" stroke="#fff" strokeWidth="1.5" />
                  <text x="310" y="113" fill="#fef08a" fontSize="10" fontFamily="monospace">TC-5 (Center)</text>

                  {/* Dimension Annotations */}
                  <text x="40" y="45" fill="#64748b" fontSize="10" fontFamily="monospace">P91 Sch. 160 (Wall = 38mm)</text>
                  <text x="220" y="210" fill="#94a3b8" fontSize="11" fontFamily="monospace">Heated Band = 2.5 x √ (Rt)</text>
                </svg>
              </div>

              {/* Bottom Temperature Digital Readout HUD */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500">{isAr ? 'الحرارة الحالية:' : 'Core Temperature:'}</div>
                  <div className={`text-xl font-black mt-1 ${currentTemp > 700 ? 'text-red-400' : 'text-amber-400'}`}>
                    {currentTemp} °C
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500">{isAr ? 'حرارة التثبيت المستهدفة:' : 'Target Soak Temp:'}</div>
                  <div className="text-xl font-black text-cyan-400 mt-1">
                    {recipe.soakTemp} °C
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500">{isAr ? 'معدل التصاعد الأقصى:' : 'Max Ramp Rate:'}</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {recipe.maxHeatingRate} °C/hr
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500">{isAr ? 'زمن التثبيت المكتمل:' : 'Soak Time Elapsed:'}</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {progressSec >= 200 ? `${Math.min(recipe.soakTimeMin, Math.round(((progressSec - 200) / 200) * recipe.soakTimeMin))} min` : '0 min'}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Strip Chart Recorder Canvas / Visual Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'منحنى مسجل درجات الحرارة Chino / Eurotherm 6-Point Strip Chart' : 'Eurotherm 6-Point Automated Temperature Profile'}</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {Math.round((progressSec / 600) * 100)}% {isAr ? 'من الدورة' : 'Completed'}
                </div>
              </div>

              {/* Progress Bar of Stages */}
              <div className="relative h-6 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex text-[10px] font-mono font-bold">
                <div className="w-[33.3%] bg-amber-500/20 border-r border-amber-500/30 flex items-center justify-center text-amber-300">
                  {isAr ? 'التصاعد (Ramp)' : 'Ramp Up'}
                </div>
                <div className="w-[33.3%] bg-red-500/20 border-r border-red-500/30 flex items-center justify-center text-red-300">
                  {isAr ? 'التثبيت (Soak)' : 'Soaking'}
                </div>
                <div className="w-[25%] bg-cyan-500/20 border-r border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  {isAr ? 'التبريد (Cooling)' : 'Cooling'}
                </div>
                <div className="w-[8.4%] bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  {isAr ? 'هواء' : 'Air'}
                </div>

                {/* Progress Cursor */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all"
                  style={{ left: `${(progressSec / 600) * 100}%` }}
                />
              </div>

              {/* Interactive Cockpit Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRunning(!isRunning)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/30"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل الدورة' : 'Run Cycle')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition border border-slate-800 cursor-pointer"
                    title={isAr ? 'إعادة ضبط' : 'Reset'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed Toggle */}
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                  <span className="me-1">{isAr ? 'سرعة المحاكاة:' : 'Speed:'}</span>
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setSimSpeed(spd)}
                      className={`px-2 py-1 rounded text-xs transition cursor-pointer ${
                        simSpeed === spd
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Channel Thermocouple Scanner HUD */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'قنوات الحساسات الست (6-Zone PID)' : '6-Zone PID Thermocouple Log'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Type K Traceable
                </span>
              </div>

              {/* Thermocouple List */}
              <div className="space-y-2.5">
                {tcReadings.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between font-mono text-xs"
                  >
                    <div>
                      <div className="text-slate-300 font-bold">{tc.label}</div>
                      <div className="text-[10px] text-slate-500">Channel #{idx + 1} PID</div>
                    </div>
                    <div className="text-end">
                      <div className={`text-sm font-black ${tc.temp > 700 ? 'text-red-400' : 'text-amber-400'}`}>
                        {tc.temp} °C
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Δ {tc.delta > 0 ? `+${tc.delta}` : tc.delta} °C
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Automatic Code Compliance Verification Notice */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isAr ? 'مطابقة متطلبات الكود المعتمد:' : 'Code Acceptance Verified:'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr
                    ? 'يضمن النظام الحفاظ على فرق حرارة لا يتجاوز 14°C بين أعلى وأسفل الماسورة (Top vs Bottom Gradient) طبقاً لـ AWS D10.10 مع التوثيق الآلي على شارت المعايرة.'
                    : 'System enforces max 14°C circumferential temperature gradient between top and bottom thermocouples complying with AWS D10.10 strict requirements.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
