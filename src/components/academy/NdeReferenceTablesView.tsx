import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  Sliders, 
  Layers, 
  Zap, 
  Radiation, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  HelpCircle, 
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Filter
} from 'lucide-react';
import { Language } from '../../types';
import { 
  ACOUSTIC_PROPERTIES_TABLE, 
  ELECTRICAL_CONDUCTIVITY_TABLE, 
  RADIOISOTOPE_PROPERTIES_TABLE, 
  WELD_ACCEPTANCE_CRITERIA_MATRIX, 
  PENETRANT_CLASSIFICATION_MATRIX,
  AcousticPropertyEntry,
  ElectricalConductivityEntry,
  RadioisotopeEntry
} from '../../data/ndeReferenceTablesData';

interface NdeReferenceTablesViewProps {
  language: Language;
}

export const NdeReferenceTablesView: React.FC<NdeReferenceTablesViewProps> = ({ language }) => {
  const isAr = language === 'ar';

  type SubTab = 'acoustics' | 'conductivity' | 'isotopes' | 'weld_matrix' | 'penetrant_sys';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('acoustics');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Acoustic Table State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testFrequencyMHz, setTestFrequencyMHz] = useState<number>(5.0);

  const filteredAcousticMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ACOUSTIC_PROPERTIES_TABLE.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.materialAr.toLowerCase().includes(q) ||
        item.materialEn.toLowerCase().includes(q) ||
        item.categoryAr.toLowerCase().includes(q) ||
        item.categoryEn.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // 2. Conductivity Table State & Live Frequency Slider
  const [eddyFreqKhz, setEddyFreqKhz] = useState<number>(100);

  const filteredConductivity = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ELECTRICAL_CONDUCTIVITY_TABLE.filter(item => {
      if (!q) return true;
      return (
        item.alloyAr.toLowerCase().includes(q) ||
        item.alloyEn.toLowerCase().includes(q) ||
        item.typicalApplicationAr.toLowerCase().includes(q) ||
        item.typicalApplicationEn.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // 3. Radioisotope live activity decay calculator
  const [initialActivityCi, setInitialActivityCi] = useState<number>(50);
  const [elapsedDays, setElapsedDays] = useState<number>(30);

  return (
    <div className="space-y-6 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Navigation for Engineering Tables */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0a0d24] border border-[#1d2350] rounded-2xl">
        <button
          onClick={() => { setActiveSubTab('acoustics'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'acoustics'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-[#14193d]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'خواص الموجات الصوتية والمواد (UT)' : 'Acoustic Velocities & Materials (UT)'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('conductivity'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'conductivity'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-[#14193d]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{isAr ? 'التوصيلية الكهربية ومسبار ET' : 'Conductivity & Skin Depth (ET)'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('isotopes'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'isotopes'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-[#14193d]'
          }`}
        >
          <Radiation className="w-4 h-4" />
          <span>{isAr ? 'النظائر المشعة والتوهين (RT)' : 'Radioisotopes & Shielding (RT)'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('weld_matrix'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'weld_matrix'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-[#14193d]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isAr ? 'مصفوفة قبول عيوب اللحام (ASME/AWS)' : 'Weld Acceptance Matrix'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('penetrant_sys'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'penetrant_sys'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-[#14193d]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'تصنيف السوائل النافذة (AMS 2644)' : 'Penetrant Classification'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ACOUSTIC PROPERTIES TABLE (UT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'acoustics' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d1029] border border-[#1c2250]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث عن سبيكة أو معدن...' : 'Search material or alloy...'}
                  className={`bg-[#060818] border border-[#232b62] rounded-xl py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 w-64 ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-[#060818] border border-[#232b62] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
                  <option value="ferrous">{isAr ? 'معادن حديدية' : 'Ferrous'}</option>
                  <option value="non_ferrous">{isAr ? 'معادن غير حديدية' : 'Non-Ferrous'}</option>
                  <option value="polymer_liquid">{isAr ? 'بوليمرات وسوائل' : 'Polymers & Liquids'}</option>
                  <option value="special_crystal">{isAr ? 'بلورات كهرضغطية' : 'Piezo Crystals'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#060818] px-3.5 py-2 rounded-xl border border-[#232b62] text-xs">
              <span className="text-slate-300">{isAr ? 'حساب الطول الموجي عند تردد:' : 'Live Wavelength Frequency:'}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={testFrequencyMHz}
                  onChange={e => setTestFrequencyMHz(parseFloat(e.target.value))}
                  className="w-24 accent-amber-400 cursor-pointer"
                />
                <span className="font-mono font-bold text-amber-400">{testFrequencyMHz.toFixed(1)} MHz</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1e2554] bg-[#0a0d24]">
            <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-[#101438] text-slate-300 font-bold border-b border-[#1f2658]">
                <tr>
                  <th className="p-3">{isAr ? 'المادة / السبيكة' : 'Material / Alloy'}</th>
                  <th className="p-3 text-center">{isAr ? 'الكثافة ρ (g/cm³)' : 'Density (g/cm³)'}</th>
                  <th className="p-3 text-center">{isAr ? 'سرعة الموجة الطولية (m/s)' : 'Longitudinal VL (m/s)'}</th>
                  <th className="p-3 text-center">{isAr ? 'سرعة الموجة القصية (m/s)' : 'Shear VS (m/s)'}</th>
                  <th className="p-3 text-center">{isAr ? 'الممانعة الصوتية Z (Rayls)' : 'Acoustic Impedance (x10⁶)'}</th>
                  <th className="p-3 text-center text-amber-400 font-bold">
                    {isAr ? `الطول الموجي λ عند ${testFrequencyMHz} MHz` : `λ at ${testFrequencyMHz} MHz`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d46] text-slate-200">
                {filteredAcousticMaterials.map((item) => {
                  const liveWavelength = (item.longitudinalVelocity / (testFrequencyMHz * 1e6)) * 1000;
                  return (
                    <tr key={item.id} className="hover:bg-[#12163d]/60 transition">
                      <td className="p-3 font-semibold text-white">
                        <div>{isAr ? item.materialAr : item.materialEn}</div>
                        <span className="text-[10px] text-slate-400">{isAr ? item.categoryAr : item.categoryEn}</span>
                      </td>
                      <td className="p-3 text-center font-mono">{item.density.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono font-bold text-cyan-300">{item.longitudinalVelocity.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono text-emerald-300">
                        {item.shearVelocity > 0 ? item.shearVelocity.toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-center font-mono text-indigo-300">{item.acousticImpedance.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono font-black text-amber-400 bg-amber-500/5">
                        {liveWavelength.toFixed(2)} mm
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ELECTRICAL CONDUCTIVITY & SKIN DEPTH (ET) */}
      {/* ========================================================================= */}
      {activeSubTab === 'conductivity' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d1029] border border-[#1c2250]">
            <div className="relative">
              <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في السبائك والتوصيلية...' : 'Search alloys & conductivities...'}
                className={`bg-[#060818] border border-[#232b62] rounded-xl py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 w-64 ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            <div className="flex items-center gap-3 bg-[#060818] px-3.5 py-2 rounded-xl border border-[#232b62] text-xs">
              <span className="text-slate-300">{isAr ? 'تردد فحص التيارات الدوامية:' : 'Eddy Current Frequency:'}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={eddyFreqKhz}
                  onChange={e => setEddyFreqKhz(parseInt(e.target.value, 10))}
                  className="w-28 accent-emerald-400 cursor-pointer"
                />
                <span className="font-mono font-bold text-emerald-400">{eddyFreqKhz} kHz</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1e2554] bg-[#0a0d24]">
            <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-[#101438] text-slate-300 font-bold border-b border-[#1f2658]">
                <tr>
                  <th className="p-3">{isAr ? 'السبيكة / المعدن' : 'Alloy / Metal'}</th>
                  <th className="p-3 text-center">{isAr ? 'التوصيلية (% IACS)' : 'Conductivity (% IACS)'}</th>
                  <th className="p-3 text-center">{isAr ? 'التوصيلية (MS/m)' : 'Conductivity (MS/m)'}</th>
                  <th className="p-3 text-center">{isAr ? 'المقاومة ρ (µΩ·cm)' : 'Resistivity (µΩ·cm)'}</th>
                  <th className="p-3 text-center">{isAr ? 'النفاذية النسبية µr' : 'Permeability µr'}</th>
                  <th className="p-3 text-center text-emerald-400 font-bold">
                    {isAr ? `عمق الاختراق δ عند ${eddyFreqKhz} kHz` : `Skin Depth δ at ${eddyFreqKhz} kHz`}
                  </th>
                  <th className="p-3">{isAr ? 'التطبيق الصناعي المعياري' : 'Typical Application'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d46] text-slate-200">
                {filteredConductivity.map((item) => {
                  // Standard Depth of Penetration: delta (mm) = 50 * sqrt(rho / (f_Hz * mur))
                  // with rho in micro-ohm-cm, f in Hz, delta in mm: delta = 50.3 * sqrt(rho / (f_Hz * mur))
                  const deltaMm = 50.3 * Math.sqrt(item.resistivityMicroOhmCm / (eddyFreqKhz * 1000 * item.relativePermeability));
                  return (
                    <tr key={item.id} className="hover:bg-[#12163d]/60 transition">
                      <td className="p-3 font-semibold text-white">
                        {isAr ? item.alloyAr : item.alloyEn}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-400">{item.conductivityIacsPct.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-cyan-300">{item.conductivityMsm.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono text-slate-300">{item.resistivityMicroOhmCm.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono">
                        {item.relativePermeability > 1.5 ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                            {item.relativePermeability} (Ferro)
                          </span>
                        ) : (
                          <span className="text-slate-400">{item.relativePermeability.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-emerald-400 bg-emerald-500/5">
                        {deltaMm < 0.01 ? '<0.01' : deltaMm.toFixed(2)} mm
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs">
                        {isAr ? item.typicalApplicationAr : item.typicalApplicationEn}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RADIOISOTOPES & SHIELDING (RT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'isotopes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1029] to-[#12173f] border border-[#1e2554] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Radiation className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  {isAr ? 'محاكي الاضمحلال الإشعاعي الحي للنظائر الصناعية' : 'Live Radioisotope Activity Decay Simulator'}
                </h4>
                <p className="text-xs text-slate-300">
                  {isAr ? 'قانون الانحلال الإشعاعي: A(t) = A₀ × (0.5)^(t / T₁/₂)' : 'Decay Formula: A(t) = A₀ × (0.5)^(t / T₁/₂)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2 bg-[#060818] px-3 py-1.5 rounded-xl border border-[#222b64]">
                <span className="text-slate-400">{isAr ? 'النشاط الابتدائي A₀:' : 'Initial Activity:'}</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={initialActivityCi}
                  onChange={e => setInitialActivityCi(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-16 bg-transparent text-amber-400 font-mono font-bold focus:outline-none text-center"
                />
                <span className="text-slate-400">Ci</span>
              </div>

              <div className="flex items-center gap-2 bg-[#060818] px-3 py-1.5 rounded-xl border border-[#222b64]">
                <span className="text-slate-400">{isAr ? 'المدة المنقضية t:' : 'Elapsed Time:'}</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={elapsedDays}
                  onChange={e => setElapsedDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 bg-transparent text-cyan-400 font-mono font-bold focus:outline-none text-center"
                />
                <span className="text-slate-400">{isAr ? 'يوماً' : 'Days'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RADIOISOTOPE_PROPERTIES_TABLE.map((iso) => {
              const remainingFraction = Math.pow(0.5, elapsedDays / iso.halfLifeDays);
              const remainingCi = initialActivityCi * remainingFraction;
              return (
                <div key={iso.id} className="p-4 rounded-2xl bg-[#090c23] border border-[#1e2554] space-y-3 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b2149]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-amber-400">{iso.symbol}</span>
                      <span className="text-xs font-bold text-white">{isAr ? iso.isotopeAr : iso.isotopeEn}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                      {isAr ? iso.halfLifeAr : iso.halfLifeEn}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#060816] border border-[#1a2046] text-center">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'النشاط المتبقي بعد المدة' : 'Remaining Activity'}</span>
                    <span className="text-lg font-mono font-black text-emerald-400">
                      {remainingCi.toFixed(2)} Ci
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({(remainingFraction * 100).toFixed(1)}% {isAr ? 'من الشدة الأصلية' : 'of initial'})
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>{isAr ? 'طاقة الفوتونات:' : 'Photon Energies:'}</span>
                      <span className="font-mono text-cyan-300">{iso.principalEnergiesMev}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>{isAr ? 'سمك النصف رصاص (HVL Pb):' : 'HVL Lead:'}</span>
                      <span className="font-mono text-amber-300 font-bold">{iso.hvlLeadMm} mm</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>{isAr ? 'سمك النصف فولاذ (HVL Steel):' : 'HVL Steel:'}</span>
                      <span className="font-mono text-indigo-300 font-bold">{iso.hvlSteelMm} mm</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>{isAr ? 'النطاق العملي للفحص:' : 'Thickness Range:'}</span>
                      <span className="font-mono text-slate-200">{iso.practicalThicknessRangeMm}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 pt-2 border-t border-[#171d42] leading-relaxed">
                    {isAr ? iso.primaryApplicationAr : iso.primaryApplicationEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. WELD ACCEPTANCE CRITERIA MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'weld_matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0d1029] border border-[#1c2250] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white block">
                {isAr ? 'المقارنة المعيارية الفورية لكودات قبول عيوب اللحامات الهندسية' : 'Engineering Weld Flaw Acceptance Matrix'}
              </span>
              <span>
                {isAr 
                  ? 'مقارنة دقيقة لحدود القبول والرفض بين كود أوعية الضغط (ASME Sec VIII)، كود أنابيب العمليات (ASME B31.3)، وكود المنشآت الهيكلية (AWS D1.1).'
                  : 'Direct clause-by-clause comparison between Pressure Vessels (ASME Sec VIII), Process Piping (ASME B31.3), and Structural Steel (AWS D1.1).'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1e2554] bg-[#0a0d24]">
            <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-[#101438] text-slate-300 font-bold border-b border-[#1f2658]">
                <tr>
                  <th className="p-3 w-1/5">{isAr ? 'نوع العيب الهندسي' : 'Weld Discontinuity'}</th>
                  <th className="p-3 text-center">{isAr ? 'ASME Sec VIII UW-51 (فحص 100%)' : 'ASME VIII UW-51 (Full RT)'}</th>
                  <th className="p-3 text-center">{isAr ? 'ASME Sec VIII UW-52 (فحص موضعي Spot)' : 'ASME VIII UW-52 (Spot RT)'}</th>
                  <th className="p-3 text-center">{isAr ? 'ASME B31.3 (خدمة اعتيادية Normal)' : 'ASME B31.3 Normal'}</th>
                  <th className="p-3 text-center">{isAr ? 'ASME B31.3 (إجهاد دوري شديد Severe)' : 'ASME B31.3 Severe Cyclic'}</th>
                  <th className="p-3 text-center">{isAr ? 'AWS D1.1 (منشآت ثابتة Static)' : 'AWS D1.1 Static'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d46] text-slate-200">
                {WELD_ACCEPTANCE_CRITERIA_MATRIX.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-[#12163d]/60 transition">
                    <td className="p-3 font-bold text-white">
                      {isAr ? rule.flawTypeAr : rule.flawTypeEn}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        rule.asmeSecViiiUw51.isAcceptable
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {isAr ? rule.asmeSecViiiUw51.ar : rule.asmeSecViiiUw51.en}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        rule.asmeSecViiiUw52.isAcceptable
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {isAr ? rule.asmeSecViiiUw52.ar : rule.asmeSecViiiUw52.en}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        rule.asmeB313Normal.isAcceptable
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {isAr ? rule.asmeB313Normal.ar : rule.asmeB313Normal.en}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        rule.asmeB313Severe.isAcceptable
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {isAr ? rule.asmeB313Severe.ar : rule.asmeB313Severe.en}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        rule.awsD11Static.isAcceptable
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {isAr ? rule.awsD11Static.ar : rule.awsD11Static.en}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PENETRANT CLASSIFICATION GUIDE (PT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'penetrant_sys' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0d1029] border border-[#1c2250] flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white block">
                {isAr ? 'تصنيف منظومات السوائل النافذة وفق المواصفة العسكرية SAE AMS 2644 و ISO 3452' : 'Dye Penetrant System Classifications (AMS 2644 & ISO 3452)'}
              </span>
              <span>
                {isAr 
                  ? 'دليل اختيار نوع الصبغة، طريقة الإزالة، ومستوى الحساسية بحسب المتطلبات الهندسية وطبيعة السطح.'
                  : 'Guide to choosing penetrant type, removal method, and sensitivity level for mission-critical parts.'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PENETRANT_CLASSIFICATION_MATRIX.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#090c23] border border-[#1e2554] space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-[#1b2149]">
                  <div>
                    <span className="text-xs font-black text-amber-400 block">{item.typeCode} • {item.methodCode}</span>
                    <span className="text-sm font-bold text-white">{isAr ? item.methodAr : item.methodEn}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {item.sensitivityLevel}
                  </span>
                </div>

                <div className="text-xs space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                    <span className="font-bold block text-[10px] text-emerald-300 uppercase">
                      {isAr ? 'المزايا ونقاط القوة:' : 'Key Advantages:'}
                    </span>
                    <p className="text-[11px] mt-0.5">{isAr ? item.advantagesAr : item.advantagesEn}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
                    <span className="font-bold block text-[10px] text-red-300 uppercase">
                      {isAr ? 'المحددات والاعتبارات:' : 'Limitations & Care:'}
                    </span>
                    <p className="text-[11px] mt-0.5">{isAr ? item.limitationsAr : item.limitationsEn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
