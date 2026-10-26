import React, { useState } from 'react';
import { Language } from '../../types';
import { 
  Sun, 
  Sliders, 
  Scan, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  Eye, 
  Maximize2,
  FileText,
  ShieldCheck,
  Search
} from 'lucide-react';

interface RadiographFilm {
  id: string;
  weldRef: string;
  material: string;
  defectName: { ar: string; en: string };
  defectType: 'crack' | 'lack_of_fusion' | 'porosity' | 'slag' | 'sound';
  measuredLengthMm: number;
  maxAllowedMm: number;
  governingCode: string;
  verdict: 'REJECT' | 'ACCEPT';
  verdictReason: { ar: string; en: string };
  filmDensity: number; // e.g. 2.6 H&D
  visualSvg: {
    weldWidth: number;
    weldHeight: number;
    defectCoords: { x: number; y: number; w: number; h: number; type: string };
  };
}

const FILM_DATABASE: RadiographFilm[] = [
  {
    id: 'film-crack-01',
    weldRef: 'INS-RT-W08 (Main Steam P91)',
    material: 'Grade 91 (8-inch Sch. 160)',
    defectName: {
      ar: 'شرخ طولي حرج بجذر اللحام (Longitudinal Root Crack)',
      en: 'Critical Longitudinal Root Crack'
    },
    defectType: 'crack',
    measuredLengthMm: 14.5,
    maxAllowedMm: 0,
    governingCode: 'ASME Section I PW-51.1 / B31.1 Table 136.4',
    verdict: 'REJECT',
    verdictReason: {
      ar: 'مرفوض قطعاً: الكود يمنع منعاً باتاً أي شروخ أو مؤشرات نقص انصهار مهما كان طولها (Zero Tolerance).',
      en: 'Unacceptable: All cracks and incomplete fusion indications are rejectable regardless of length.'
    },
    filmDensity: 2.75,
    visualSvg: {
      weldWidth: 500,
      weldHeight: 120,
      defectCoords: { x: 230, y: 56, w: 75, h: 4, type: 'jagged_crack' }
    }
  },
  {
    id: 'film-lof-02',
    weldRef: 'INS-RT-W22 (Crude Oil 32" Transmission)',
    material: 'API 5L X65 (14.2 mm Wall)',
    defectName: {
      ar: 'نقص انصهار في الجدار الجانبي (Lack of Side-Wall Fusion)',
      en: 'Incomplete Side-Wall Fusion'
    },
    defectType: 'lack_of_fusion',
    measuredLengthMm: 28.0,
    maxAllowedMm: 25.0,
    governingCode: 'API 1104 22nd Ed. Section 9.3.4',
    verdict: 'REJECT',
    verdictReason: {
      ar: 'مرفوض: طول نقص الانصهار الإجمالي (28 مم) يتجاوز الحد الأقصى المسموح به (25 مم أو 1 بوصة).',
      en: 'Unacceptable: Length of IF exceeds maximum allowable aggregate limit of 25 mm per API 1104.'
    },
    filmDensity: 2.50,
    visualSvg: {
      weldWidth: 500,
      weldHeight: 120,
      defectCoords: { x: 180, y: 44, w: 120, h: 5, type: 'line_fusion' }
    }
  },
  {
    id: 'film-porosity-03',
    weldRef: 'INS-RT-W45 (Lube Oil Vessel Shell)',
    material: 'SA-516 Gr. 70 (22 mm Plate)',
    defectName: {
      ar: 'مسامية غازية دائرية متفرقة (Scattered Gas Porosity)',
      en: 'Isolated Rounded Gas Porosity'
    },
    defectType: 'porosity',
    measuredLengthMm: 1.8,
    maxAllowedMm: 3.0,
    governingCode: 'ASME Section VIII Div. 1 UW-51 App. 4',
    verdict: 'ACCEPT',
    verdictReason: {
      ar: 'مقبول: قطر التجاويف الدائرية والتباعد بينها ضمن الحدود المصرح بها بالملحق 4 لمخططات المسامية.',
      en: 'Acceptable: Rounded indication dimension and spacing satisfy ASME VIII Appendix 4 porosity charts.'
    },
    filmDensity: 2.85,
    visualSvg: {
      weldWidth: 500,
      weldHeight: 120,
      defectCoords: { x: 260, y: 60, w: 6, h: 6, type: 'dots' }
    }
  },
  {
    id: 'film-slag-04',
    weldRef: 'INS-RT-W61 (Condensate Piping Spool)',
    material: 'ASTM A106 Gr. B (6" Sch. 40)',
    defectName: {
      ar: 'خط خبث ممدود متقطع (Elongated Slag Inclusion)',
      en: 'Elongated Slag Line Inclusions'
    },
    defectType: 'slag',
    measuredLengthMm: 8.2,
    maxAllowedMm: 12.0,
    governingCode: 'ASME B31.3 Table 341.3.2 (Normal Fluid Service)',
    verdict: 'ACCEPT',
    verdictReason: {
      ar: 'مقبول: طول المؤشر الخبثي 8.2 مم وهو أقل من الحد المسموح به (Tw/3 = 12 مم).',
      en: 'Acceptable: Total slag indication length is within the Tw/3 allowable limit for Normal Fluid Service.'
    },
    filmDensity: 2.65,
    visualSvg: {
      weldWidth: 500,
      weldHeight: 120,
      defectCoords: { x: 210, y: 52, w: 55, h: 6, type: 'slag_line' }
    }
  },
  {
    id: 'film-sound-05',
    weldRef: 'INS-RT-W99 (Burullus CCPP Steam Header)',
    material: 'SA-335 P91 (24" OD x 45mm)',
    defectName: {
      ar: 'لحام سليم تام النفاذية 100% بدون أي عيوب (Sound Weld)',
      en: '100% Sound Fully Penetrated Weld'
    },
    defectType: 'sound',
    measuredLengthMm: 0,
    maxAllowedMm: 0,
    governingCode: 'ASME Section I & B31.1 Full Volumetric',
    verdict: 'ACCEPT',
    verdictReason: {
      ar: 'مقبول بامتياز: تجانس تام، نفاذية مكتملة بالجذر، بدون أي شوائب أو انقطاعات معدنية.',
      en: 'Excellent sound weld: Complete root penetration, uniform reinforcement, zero planar or volumetric discontinuities.'
    },
    filmDensity: 3.10,
    visualSvg: {
      weldWidth: 500,
      weldHeight: 120,
      defectCoords: { x: 0, y: 0, w: 0, h: 0, type: 'none' }
    }
  }
];

interface RadiographicFilmViewerProps {
  language: Language;
}

export const RadiographicFilmViewer: React.FC<RadiographicFilmViewerProps> = ({ language }) => {
  const isAr = language === 'ar';

  const [activeFilmId, setActiveFilmId] = useState<string>('film-crack-01');
  const [luxBrightness, setLuxBrightness] = useState<number>(75); // 20 to 100
  const [invertContrast, setInvertContrast] = useState<boolean>(false);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  const activeFilm = FILM_DATABASE.find(f => f.id === activeFilmId) || FILM_DATABASE[0];

  return (
    <section id="radiography-viewer" className="py-16 border-b border-slate-800 bg-slate-900/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'شاشة التفسير الرقمي لأفلام الأشعة الصناعية (RT Lightbox)' : 'Digital Radiograph Lightbox & Flaw Interpreter'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr ? 'مختبر قراءة وتفسير صور الأشعة وأفلام جاما RT' : 'Interactive Radiographic Darkroom Lightbox & Evaluation'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {isAr
                ? 'محاكي رقمي لجهاز إضاءة وفحص أفلام الأشعة الصناعية عالية الكثافة (High-Intensity LED Illuminator 100,000 Lux). يمكنك فحص عيوب اللحام الحقيقية وتحديد أبعادها والتحقق من قرار القبول والرفض طبقاً لـ ASME و API.'
                : 'Digital simulation of an industrial high-intensity LED film illuminator (100,000 Lux). Inspect real welded joints, adjust optical density, measure flaw indications, and review ASME / API code acceptance verdicts.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
              {isAr ? 'ترخيص الرقابة النووية ENRRA' : 'ENRRA Licensed'}
            </span>
          </div>
        </div>

        {/* Film Selector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {FILM_DATABASE.map((film) => {
            const isSelected = film.id === activeFilmId;
            return (
              <button
                key={film.id}
                type="button"
                onClick={() => setActiveFilmId(film.id)}
                className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-500">{film.weldRef.split(' ')[0]}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      film.verdict === 'REJECT' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {film.verdict}
                    </span>
                  </div>
                  <div className={`text-xs font-bold line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {film.defectName[language]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lightbox Viewer Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual: Film Lightbox Screen */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-black p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              {/* Top Film Metadata Overlay */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-200 font-bold">{activeFilm.weldRef}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-cyan-400">{activeFilm.material}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>H&D Density: <strong className="text-white">{activeFilm.filmDensity}</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>IQI: <strong className="text-white">ASTM 1B</strong></span>
                </div>
              </div>

              {/* Simulated Radiograph Film Negative Viewport */}
              <div 
                className="relative rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4 transition-all duration-300"
                style={{
                  backgroundColor: invertContrast ? '#f8fafc' : '#05070a',
                  filter: `brightness(${luxBrightness / 50})`
                }}
              >
                <svg
                  viewBox="0 0 540 180"
                  className="w-full h-auto select-none"
                >
                  <defs>
                    <radialGradient id="lightDiffuse" cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor={invertContrast ? '#ffffff' : '#1e293b'} stopOpacity="0.9" />
                      <stop offset="100%" stopColor={invertContrast ? '#e2e8f0' : '#090d16'} stopOpacity="1" />
                    </radialGradient>
                    <linearGradient id="weldZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={invertContrast ? '#cbd5e1' : '#1e293b'} />
                      <stop offset="50%" stopColor={invertContrast ? '#94a3b8' : '#334155'} />
                      <stop offset="100%" stopColor={invertContrast ? '#cbd5e1' : '#1e293b'} />
                    </linearGradient>
                  </defs>

                  {/* Darkroom Film Background */}
                  <rect x="0" y="0" width="540" height="180" rx="8" fill="url(#lightDiffuse)" />

                  {/* Base Metal Pipe Sections */}
                  <rect x="20" y="20" width="500" height="140" fill={invertContrast ? '#e2e8f0' : '#0f172a'} opacity="0.8" />

                  {/* Weld Seam Reinforcement Crown (Lighter gray in negative radiograph) */}
                  <rect 
                    x="20" 
                    y="60" 
                    width="500" 
                    height="60" 
                    fill="url(#weldZoneGrad)" 
                    opacity="0.85" 
                  />

                  {/* Weld Cap Ripples / Texture */}
                  {Array.from({ length: 25 }).map((_, i) => (
                    <line
                      key={i}
                      x1={30 + i * 20}
                      y1="60"
                      x2={30 + i * 20}
                      y2="120"
                      stroke={invertContrast ? '#94a3b8' : '#475569'}
                      strokeWidth="1"
                      strokeDasharray="2 3"
                      opacity="0.4"
                    />
                  ))}

                  {/* Hole Type Penetrameter (IQI) Placed on Film */}
                  <rect x="40" y="30" width="45" height="18" fill="none" stroke={invertContrast ? '#0f172a' : '#94a3b8'} strokeWidth="1" />
                  <circle cx="50" cy="39" r="2" fill={invertContrast ? '#0f172a' : '#05070a'} />
                  <circle cx="62" cy="39" r="3" fill={invertContrast ? '#0f172a' : '#05070a'} />
                  <circle cx="76" cy="39" r="4.5" fill={invertContrast ? '#0f172a' : '#05070a'} />
                  <text x="40" y="26" fill={invertContrast ? '#0f172a' : '#94a3b8'} fontSize="8" fontFamily="monospace">ASTM 20</text>

                  {/* Lead Location Markers (B & Arrows) */}
                  <text x="480" y="35" fill={invertContrast ? '#0f172a' : '#e2e8f0'} fontSize="14" fontWeight="bold" fontFamily="monospace">B</text>
                  <text x="460" y="150" fill={invertContrast ? '#0f172a' : '#e2e8f0'} fontSize="10" fontFamily="monospace">0-30</text>

                  {/* Render Defect Discontinuity on the Film */}
                  {activeFilm.defectType === 'crack' && (
                    <g>
                      {/* Dark jagged line for crack in negative radiograph */}
                      <path
                        d="M 230 88 Q 250 86 270 90 T 305 87"
                        fill="none"
                        stroke={invertContrast ? '#0f172a' : '#000000'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        filter="blur(0.4px)"
                      />
                      <circle cx="230" cy="88" r="1.5" fill={invertContrast ? '#000' : '#000'} />
                      <circle cx="305" cy="87" r="1.5" fill={invertContrast ? '#000' : '#000'} />
                    </g>
                  )}

                  {activeFilm.defectType === 'lack_of_fusion' && (
                    <g>
                      {/* Straight straight dark continuous line at the fusion bevel */}
                      <rect
                        x="190"
                        y="68"
                        width="110"
                        height="3.5"
                        rx="1"
                        fill={invertContrast ? '#0f172a' : '#020617'}
                        filter="blur(0.3px)"
                      />
                    </g>
                  )}

                  {activeFilm.defectType === 'porosity' && (
                    <g>
                      {/* Clustered circular dark voids */}
                      <circle cx="260" cy="85" r="3" fill={invertContrast ? '#0f172a' : '#000'} />
                      <circle cx="272" cy="82" r="2.2" fill={invertContrast ? '#0f172a' : '#000'} />
                      <circle cx="280" cy="92" r="2.8" fill={invertContrast ? '#0f172a' : '#000'} />
                      <circle cx="295" cy="86" r="2" fill={invertContrast ? '#0f172a' : '#000'} />
                    </g>
                  )}

                  {activeFilm.defectType === 'slag' && (
                    <g>
                      {/* Irregular elongated dark line with tailing */}
                      <path
                        d="M 215 82 C 235 80, 255 85, 275 83"
                        fill="none"
                        stroke={invertContrast ? '#0f172a' : '#05070a'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter="blur(0.5px)"
                      />
                    </g>
                  )}

                  {/* Measuring Calipers Reticle Overlay */}
                  {showReticle && activeFilm.measuredLengthMm > 0 && (
                    <g opacity="0.9">
                      <rect 
                        x="200" 
                        y="48" 
                        width={activeFilm.measuredLengthMm * 4.5} 
                        height="85" 
                        fill="none" 
                        stroke="#06b6d4" 
                        strokeWidth="1.5" 
                        strokeDasharray="3 3" 
                      />
                      <line x1="200" y1="42" x2="200" y2="48" stroke="#06b6d4" strokeWidth="2" />
                      <line x1={200 + activeFilm.measuredLengthMm * 4.5} y1="42" x2={200 + activeFilm.measuredLengthMm * 4.5} y2="48" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="200" y1="45" x2={200 + activeFilm.measuredLengthMm * 4.5} y2="45" stroke="#06b6d4" strokeWidth="1" />
                      <text 
                        x={200 + (activeFilm.measuredLengthMm * 4.5) / 2} 
                        y="38" 
                        fill="#22d3ee" 
                        fontSize="11" 
                        fontWeight="bold" 
                        textAnchor="middle" 
                        fontFamily="monospace"
                      >
                        L = {activeFilm.measuredLengthMm} mm
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Lightbox Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-800 text-xs">
                {/* Lux Slider */}
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono text-slate-400">{isAr ? 'شدة الإضاءة (Lux):' : 'Illuminator Lux:'}</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={luxBrightness}
                    onChange={(e) => setLuxBrightness(Number(e.target.value))}
                    className="w-28 sm:w-36 accent-cyan-500 cursor-pointer"
                  />
                  <span className="font-mono text-slate-200">{Math.round(luxBrightness * 1000)} Lux</span>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvertContrast(!invertContrast)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      invertContrast
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {invertContrast ? 'Negative Film' : 'Invert'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReticle(!showReticle)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      showReticle
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isAr ? 'مسطرة القياس' : 'Reticle Scale'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code Acceptance & Verdict Box */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  {isAr ? 'تقرير التقييم الكودي المعتمد' : 'Code Acceptance Verdict'}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono ${
                  activeFilm.verdict === 'REJECT'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {activeFilm.verdict === 'REJECT' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{activeFilm.verdict}</span>
                </div>
              </div>

              {/* Defect Particulars */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-500">{isAr ? 'اسم العيب والمؤشر:' : 'Discontinuity Classification:'}</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">{activeFilm.defectName[language]}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="text-slate-500 text-[11px]">{isAr ? 'الطول المقاس:' : 'Measured Length:'}</div>
                    <div className="text-base font-black font-mono text-cyan-400 mt-1">
                      {activeFilm.measuredLengthMm} mm
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="text-slate-500 text-[11px]">{isAr ? 'الحد الأقصى المسموح:' : 'Max Allowable:'}</div>
                    <div className="text-base font-black font-mono text-slate-200 mt-1">
                      {activeFilm.maxAllowedMm === 0 ? '0 mm (None)' : `${activeFilm.maxAllowedMm} mm`}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-slate-500">{isAr ? 'الكود المرجعي للتقييم:' : 'Governing Standard Reference:'}</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">{activeFilm.governingCode}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="text-cyan-400 font-bold mb-1">{isAr ? 'تحليل مهندس الفحص (Level III):' : 'Level III Evaluation Notes:'}</div>
                  {activeFilm.verdictReason[language]}
                </div>
              </div>

              {/* Inspector Signature and Seal Notice */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>INSCO Quality Inspection Dept.</span>
                <span>ASNT Level III #54161</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
