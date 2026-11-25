import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  StepForward,
  Waves
} from 'lucide-react';
import { GE_MATERIALS, GeMaterialId } from '../../../utils/geExposureTimeEngine';
import { Language } from '../../../types';
import { GeUnitSystem } from './GeRadiographicExposureTimeApp';

export type UltrasonicCouplantId = 'water' | 'glycerin' | 'perspex' | 'air_gap';
export type UltrasonicFlawMode = 'none' | 'porosity_void' | 'planar_crack';

export interface UltrasonicLongitudinalMaterialSpec {
  id: GeMaterialId;
  longitudinalVelocityMs: number;
  densityGcm3: number;
  acousticImpedanceMRayl: number;
  attenuationAt4MhzNpPerMm: number;
  grainNoteEn: string;
  grainNoteAr: string;
}

export interface UltrasonicCouplantSpec {
  id: UltrasonicCouplantId;
  nameEn: string;
  nameAr: string;
  longitudinalVelocityMs: number;
  densityGcm3: number;
  acousticImpedanceMRayl: number;
  attenuationAt4MhzNpPerMm: number;
}

export const ULTRASONIC_COUPLANTS: Record<UltrasonicCouplantId, UltrasonicCouplantSpec> = {
  water: {
    id: 'water',
    nameEn: 'Water Bath / Aqualene (Immersion)',
    nameAr: 'وسط مائي / غمر (Water Couplant)',
    longitudinalVelocityMs: 1480,
    densityGcm3: 1.0,
    acousticImpedanceMRayl: 1.48,
    attenuationAt4MhzNpPerMm: 0.002
  },
  glycerin: {
    id: 'glycerin',
    nameEn: 'Ultrasonic Gel / Glycerin Couplant',
    nameAr: 'جل التوصيل فوق الصوتي (Glycerin Gel)',
    longitudinalVelocityMs: 1920,
    densityGcm3: 1.26,
    acousticImpedanceMRayl: 2.42,
    attenuationAt4MhzNpPerMm: 0.012
  },
  perspex: {
    id: 'perspex',
    nameEn: 'Perspex / PMMA Delay Line',
    nameAr: 'خط تأخير بيرسبيكس (Perspex Delay)',
    longitudinalVelocityMs: 2730,
    densityGcm3: 1.18,
    acousticImpedanceMRayl: 3.22,
    attenuationAt4MhzNpPerMm: 0.032
  },
  air_gap: {
    id: 'air_gap',
    nameEn: 'Dry Air Gap (No Couplant)',
    nameAr: 'فجوة هوائية جافة (بدون جل توصيل)',
    longitudinalVelocityMs: 343,
    densityGcm3: 0.0012,
    acousticImpedanceMRayl: 0.00041,
    attenuationAt4MhzNpPerMm: 0.14
  }
};

export const ULTRASONIC_LONGITUDINAL_MATERIALS: Record<GeMaterialId, UltrasonicLongitudinalMaterialSpec> = {
  carbon_steel: {
    id: 'carbon_steel',
    longitudinalVelocityMs: 5920,
    densityGcm3: GE_MATERIALS.carbon_steel.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.carbon_steel.densityGcm3 * 5920) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.014,
    grainNoteEn: 'Fine ferritic-pearlitic grains: sharp longitudinal wavefronts & deep penetration.',
    grainNoteAr: 'بنية حبيبية منتظمة: جبهات موجية طولية واضحة واختراق عميق.'
  },
  stainless_steel: {
    id: 'stainless_steel',
    longitudinalVelocityMs: 5790,
    densityGcm3: GE_MATERIALS.stainless_steel.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.stainless_steel.densityGcm3 * 5790) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.036,
    grainNoteEn: 'Coarse austenitic grains scatter high-frequency waves, accelerating density decay.',
    grainNoteAr: 'حبيبات الأوستنيت الخشنة تشتت الترددات العالية وتسرّع هبوط كثافة الموجة.'
  },
  aluminum: {
    id: 'aluminum',
    longitudinalVelocityMs: 6320,
    densityGcm3: GE_MATERIALS.aluminum.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.aluminum.densityGcm3 * 6320) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.008,
    grainNoteEn: 'Highest longitudinal velocity & lowest acoustic impedance among structural metals.',
    grainNoteAr: 'أعلى سرعة طولية وأقل مقاومة صوتية؛ الطول الموجي يتمدد بشكل ملحوظ عند الاختراق.'
  },
  titanium: {
    id: 'titanium',
    longitudinalVelocityMs: 6100,
    densityGcm3: GE_MATERIALS.titanium.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.titanium.densityGcm3 * 6100) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.018,
    grainNoteEn: 'Moderate impedance (27.5 MRayl) yields smoother entry transmission than steel.',
    grainNoteAr: 'مقاومة صوتية متوسطة تسمح بنفاذية أعلى عند السطح مقارنة بالصلب.'
  },
  copper_brass: {
    id: 'copper_brass',
    longitudinalVelocityMs: 4700,
    densityGcm3: GE_MATERIALS.copper_brass.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.copper_brass.densityGcm3 * 4700) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.034,
    grainNoteEn: 'Lower velocity compresses longitudinal wavelengths closer together inside the wall.',
    grainNoteAr: 'انخفاض السرعة يضغط المسافة بين قمم التضاغط ويزيد التوهين عبر السُمك.'
  },
  inconel_nickel: {
    id: 'inconel_nickel',
    longitudinalVelocityMs: 5820,
    densityGcm3: GE_MATERIALS.inconel_nickel.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.inconel_nickel.densityGcm3 * 5820) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.044,
    grainNoteEn: 'Highest acoustic impedance (49.1 MRayl) & pronounced grain-boundary attenuation.',
    grainNoteAr: 'أعلى مقاومة صوتية (49.1 MRayl) مع فقد مرتفع في كثافة الطاقة داخل السبائك.'
  },
  lead: {
    id: 'lead',
    longitudinalVelocityMs: 2160,
    densityGcm3: GE_MATERIALS.lead.densityGcm3,
    acousticImpedanceMRayl: Number(((GE_MATERIALS.lead.densityGcm3 * 2160) / 1000).toFixed(2)),
    attenuationAt4MhzNpPerMm: 0.095,
    grainNoteEn: 'Ultra-slow velocity packs longitudinal compression bands tightly while rapidly damping amplitude.',
    grainNoteAr: 'سرعة منخفضة جداً تكدّس نطاقات التضاغط مع امتصاص وتوهين فائق الكثافة.'
  }
};

export interface LongitudinalPenetrationModel {
  couplant: UltrasonicCouplantSpec;
  specimen: UltrasonicLongitudinalMaterialSpec;
  frequencyMhz: number;
  thicknessMm: number;
  flawMode: UltrasonicFlawMode;
  couplantWavelengthMm: number;
  specimenWavelengthMm: number;
  wavelengthExpansionRatio: number;
  spatialWavefrontDensityPerCm: number;
  reflectionEnergyPct: number;
  transmissionEnergyPct: number;
  pressureTransmissionRatio: number;
  attenuationCoeffNpPerMm: number;
  attenuationDbPerMm: number;
  entryAmplitudeNorm: number;
  backWallAmplitudeNorm: number;
  backWallEnergyDensityPct: number;
  flawDepthMm: number | null;
  flawTransmissionFactor: number;
  timeOfFlightUs: number;
}

export function computeLongitudinalPenetrationModel(input: {
  materialId: GeMaterialId;
  thicknessMm: number;
  frequencyMhz: number;
  couplantId: UltrasonicCouplantId;
  flawMode: UltrasonicFlawMode;
}): LongitudinalPenetrationModel {
  const couplant = ULTRASONIC_COUPLANTS[input.couplantId];
  const specimen = ULTRASONIC_LONGITUDINAL_MATERIALS[input.materialId];
  const frequencyMhz = Math.max(0.5, Math.min(12, input.frequencyMhz));
  const thicknessMm = Math.max(2, Math.min(150, input.thicknessMm));

  const couplantWavelengthMm = Number((couplant.longitudinalVelocityMs / (frequencyMhz * 1000)).toFixed(3));
  const specimenWavelengthMm = Number((specimen.longitudinalVelocityMs / (frequencyMhz * 1000)).toFixed(3));
  const wavelengthExpansionRatio = Number((specimenWavelengthMm / Math.max(0.01, couplantWavelengthMm)).toFixed(2));
  const spatialWavefrontDensityPerCm = Number((10 / Math.max(0.05, specimenWavelengthMm)).toFixed(1));

  const z1 = couplant.acousticImpedanceMRayl;
  const z2 = specimen.acousticImpedanceMRayl;
  const reflectionRatio = Math.pow((z2 - z1) / (z2 + z1), 2);
  const transmissionRatio = Math.max(0, 1 - reflectionRatio);
  const pressureTransmissionRatio = Number(((2 * z2) / (z1 + z2)).toFixed(2));

  // Frequency-dependent attenuation alpha(f) ~ alpha_4MHz * (f / 4)^1.25
  const attenuationCoeffNpPerMm = Number(
    (specimen.attenuationAt4MhzNpPerMm * Math.pow(frequencyMhz / 4, 1.25)).toFixed(4)
  );
  const attenuationDbPerMm = Number((attenuationCoeffNpPerMm * 8.686).toFixed(3));

  const entryAmplitudeNorm = Number(Math.sqrt(transmissionRatio).toFixed(4));
  const flawDepthMm = input.flawMode === 'none' ? null : Number((thicknessMm * 0.52).toFixed(1));
  const flawTransmissionFactor =
    input.flawMode === 'none' ? 1 : input.flawMode === 'porosity_void' ? 0.28 : 0.08;

  const backWallAmplitudeNorm = Number(
    (entryAmplitudeNorm * Math.exp(-attenuationCoeffNpPerMm * thicknessMm) * flawTransmissionFactor).toFixed(4)
  );
  const backWallEnergyDensityPct = Number((Math.pow(backWallAmplitudeNorm, 2) * 100).toFixed(2));
  const timeOfFlightUs = Number(((thicknessMm * 2) / (specimen.longitudinalVelocityMs * 0.001)).toFixed(2));

  return {
    couplant,
    specimen,
    frequencyMhz,
    thicknessMm,
    flawMode: input.flawMode,
    couplantWavelengthMm,
    specimenWavelengthMm,
    wavelengthExpansionRatio,
    spatialWavefrontDensityPerCm,
    reflectionEnergyPct: Number((reflectionRatio * 100).toFixed(2)),
    transmissionEnergyPct: Number((transmissionRatio * 100).toFixed(2)),
    pressureTransmissionRatio,
    attenuationCoeffNpPerMm,
    attenuationDbPerMm,
    entryAmplitudeNorm,
    backWallAmplitudeNorm,
    backWallEnergyDensityPct,
    flawDepthMm,
    flawTransmissionFactor,
    timeOfFlightUs
  };
}

export interface LongitudinalWavePenetrationSimProps {
  language: Language;
  materialId: GeMaterialId;
  onChangeMaterialId: (next: GeMaterialId) => void;
  materialThicknessMm: number;
  onChangeThicknessMm: (next: number) => void;
  unitSystem: GeUnitSystem;
}

export const LongitudinalWavePenetrationSim: React.FC<LongitudinalWavePenetrationSimProps> = ({
  language,
  materialId,
  onChangeMaterialId,
  materialThicknessMm,
  onChangeThicknessMm,
  unitSystem
}) => {
  const isAr = language === 'ar';

  const [frequencyMhz, setFrequencyMhz] = useState<number>(4.0);
  const [couplantId, setCouplantId] = useState<UltrasonicCouplantId>('glycerin');
  const [flawMode, setFlawMode] = useState<UltrasonicFlawMode>('none');
  const [phaseRad, setPhaseRad] = useState<number>(0.85);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });
  const [hoverNormX, setHoverNormX] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  const model = useMemo(
    () =>
      computeLongitudinalPenetrationModel({
        materialId,
        thicknessMm: materialThicknessMm,
        frequencyMhz,
        couplantId,
        flawMode
      }),
    [materialId, materialThicknessMm, frequencyMhz, couplantId, flawMode]
  );

  // Respect prefers-reduced-motion dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (mql.matches) {
        setIsPlaying(false);
      }
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameTimeRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = now;
      }
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastFrameTimeRef.current) / 1000));
      lastFrameTimeRef.current = now;
      // Angular speed scales subtly with frequency so higher MHz pulses feel brisker yet smooth
      const omega = 2.6 + (frequencyMhz - 1) * 0.38;
      setPhaseRad((prev) => (prev + dtSec * omega) % (Math.PI * 200));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, frequencyMhz]);

  // SVG Layout geometry (viewBox 0 0 820 380)
  const zoneCouplantStart = 88;
  const zoneInterfaceX = 232;
  const zoneBackWallX = 768;
  const specimenWidthPx = zoneBackWallX - zoneInterfaceX;
  const couplantWidthPx = zoneInterfaceX - zoneCouplantStart;

  const fieldTop = 44;
  const fieldBottom = 196;
  const fieldMidY = (fieldTop + fieldBottom) / 2;

  const waveTop = 228;
  const waveBottom = 342;
  const waveMidY = (waveTop + waveBottom) / 2;
  const waveMaxHalfHeight = 46;

  // Visual wave numbers k1 (couplant) & k2 (specimen):
  // Preserve physically faithful wavelength contrast between couplant and specimen
  // while keeping visual cycles crisp and readable across 1..10 MHz.
  const couplantMmRepresented = 6.0;
  const couplantCyclesVisible = Math.max(1.8, Math.min(18, couplantMmRepresented / model.couplantWavelengthMm));
  const k1Px = (2 * Math.PI * couplantCyclesVisible) / couplantWidthPx;

  const specimenVisualMmSpan = Math.max(14, Math.min(90, model.thicknessMm));
  const specimenCyclesVisible = Math.max(1.5, Math.min(26, specimenVisualMmSpan / model.specimenWavelengthMm));
  const k2Px = (2 * Math.PI * specimenCyclesVisible) / specimenWidthPx;

  const flawRelX = 0.52;
  const flawCenterX = zoneInterfaceX + flawRelX * specimenWidthPx;

  // Compute local longitudinal wave displacement & compression density at any SVG x
  const evaluateWaveAtSvgX = (x: number) => {
    if (x <= zoneInterfaceX) {
      const dx = x - zoneCouplantStart;
      // Forward incident wave + reflected wave from interface
      const rAmp = Math.sqrt(model.reflectionEnergyPct / 100);
      const attenC = Math.exp(-model.couplant.attenuationAt4MhzNpPerMm * (dx / couplantWidthPx) * couplantMmRepresented);
      const incident = attenC * Math.cos(k1Px * dx - phaseRad);
      const reflected = rAmp * 0.65 * Math.cos(-k1Px * (zoneInterfaceX - x) - phaseRad);
      // Compression density norm in [0, 1] (0.5 neutral, >0.5 compressed, <0.5 rarefied)
      const compressionNorm = Math.max(0, Math.min(1, 0.5 + 0.48 * incident));
      return {
        zone: 'couplant' as const,
        depthMm: 0,
        envelope: attenC,
        displacementPx: 11 * attenC * Math.sin(k1Px * dx - phaseRad),
        pressureNorm: incident + reflected * 0.35,
        compressionNorm,
        energyDensityPct: Number((Math.pow(attenC, 2) * 100).toFixed(1))
      };
    }

    const relSpecimen = Math.max(0, Math.min(1, (x - zoneInterfaceX) / specimenWidthPx));
    const depthMm = relSpecimen * model.thicknessMm;
    const dxSpec = x - zoneInterfaceX;

    let flawAtten = 1;
    let flawReflectedTerm = 0;
    if (model.flawMode !== 'none') {
      if (relSpecimen >= flawRelX) {
        flawAtten = model.flawTransmissionFactor;
      } else {
        const distToFlaw = flawCenterX - x;
        const echoStrength = 1 - model.flawTransmissionFactor;
        flawReflectedTerm =
          echoStrength * 0.45 * model.entryAmplitudeNorm * Math.cos(-k2Px * distToFlaw - phaseRad);
      }
    }

    const attenSpecimen =
      model.entryAmplitudeNorm * Math.exp(-model.specimen.attenuationAt4MhzNpPerMm * Math.pow(frequencyMhz / 4, 1.25) * depthMm) * flawAtten;

    const interfacePhaseOffset = k1Px * couplantWidthPx;
    const forwardWave = attenSpecimen * Math.cos(interfacePhaseOffset + k2Px * dxSpec - phaseRad);
    const totalPressure = forwardWave + flawReflectedTerm;
    const compressionNorm = Math.max(0, Math.min(1, 0.5 + 0.48 * forwardWave));

    return {
      zone: 'specimen' as const,
      depthMm,
      envelope: attenSpecimen,
      displacementPx: 11 * attenSpecimen * Math.sin(interfacePhaseOffset + k2Px * dxSpec - phaseRad),
      pressureNorm: totalPressure,
      compressionNorm,
      energyDensityPct: Number((Math.pow(attenSpecimen, 2) * 100).toFixed(1))
    };
  };

  // Precompute longitudinal particle grid (rows x columns) showing real parallel compression & rarefaction
  const particleRows = [fieldMidY - 52, fieldMidY - 26, fieldMidY, fieldMidY + 26, fieldMidY + 52];
  const couplantCols = 14;
  const specimenCols = 44;

  const particles = useMemo(() => {
    const items: Array<{
      id: string;
      cx: number;
      cy: number;
      densityNorm: number;
      inSpecimen: boolean;
      envelope: number;
    }> = [];

    for (let r = 0; r < particleRows.length; r++) {
      const y = particleRows[r];
      // Couplant lattice
      for (let c = 0; c < couplantCols; c++) {
        const baseX = zoneCouplantStart + 8 + (c / (couplantCols - 1)) * (couplantWidthPx - 14);
        const w = evaluateWaveAtSvgX(baseX);
        const shiftedX = Math.max(zoneCouplantStart + 3, Math.min(zoneInterfaceX - 3, baseX + w.displacementPx));
        items.push({
          id: `c-${r}-${c}`,
          cx: Number(shiftedX.toFixed(1)),
          cy: y,
          densityNorm: w.compressionNorm,
          inSpecimen: false,
          envelope: w.envelope
        });
      }
      // Specimen lattice
      for (let c = 0; c < specimenCols; c++) {
        const baseX = zoneInterfaceX + 6 + (c / (specimenCols - 1)) * (specimenWidthPx - 12);
        const w = evaluateWaveAtSvgX(baseX);
        const shiftedX = Math.max(zoneInterfaceX + 3, Math.min(zoneBackWallX - 3, baseX + w.displacementPx));
        items.push({
          id: `s-${r}-${c}`,
          cx: Number(shiftedX.toFixed(1)),
          cy: y,
          densityNorm: w.compressionNorm,
          inSpecimen: true,
          envelope: w.envelope
        });
      }
    }
    return items;
  }, [phaseRad, model, particleRows.length]);

  // Precompute compression band slices so compression zones glow visibly inside couplant & specimen
  const compressionBands = useMemo(() => {
    const bands: Array<{ x: number; width: number; opacity: number; isCompressed: boolean; inSpecimen: boolean }> = [];
    const couplantSlices = 24;
    const cW = couplantWidthPx / couplantSlices;
    for (let i = 0; i < couplantSlices; i++) {
      const x = zoneCouplantStart + i * cW;
      const w = evaluateWaveAtSvgX(x + cW * 0.5);
      const strength = Math.abs(w.compressionNorm - 0.5) * 2;
      bands.push({
        x: Number(x.toFixed(1)),
        width: Number((cW + 0.5).toFixed(1)),
        opacity: Number((0.05 + strength * 0.42).toFixed(3)),
        isCompressed: w.compressionNorm >= 0.5,
        inSpecimen: false
      });
    }

    const specimenSlices = 72;
    const sW = specimenWidthPx / specimenSlices;
    for (let i = 0; i < specimenSlices; i++) {
      const x = zoneInterfaceX + i * sW;
      const w = evaluateWaveAtSvgX(x + sW * 0.5);
      const strength = Math.abs(w.compressionNorm - 0.5) * 2;
      bands.push({
        x: Number(x.toFixed(1)),
        width: Number((sW + 0.5).toFixed(1)),
        opacity: Number((0.03 + strength * 0.48).toFixed(3)),
        isCompressed: w.compressionNorm >= 0.5,
        inSpecimen: true
      });
    }
    return bands;
  }, [phaseRad, model]);

  // Synchronized longitudinal pressure wave path + density attenuation envelope
  const { wavePathD, upperEnvelopeD, lowerEnvelopeD } = useMemo(() => {
    const steps = 150;
    const wPts: string[] = [];
    const envTopPts: string[] = [];
    const envBotPts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const x = zoneCouplantStart + (i / steps) * (zoneBackWallX - zoneCouplantStart);
      const w = evaluateWaveAtSvgX(x);
      const clampedP = Math.max(-1.15, Math.min(1.15, w.pressureNorm));
      const y = waveMidY - clampedP * waveMaxHalfHeight;
      const envYTop = waveMidY - Math.min(1, w.envelope) * waveMaxHalfHeight;
      const envYBot = waveMidY + Math.min(1, w.envelope) * waveMaxHalfHeight;

      const cmd = i === 0 ? 'M' : 'L';
      wPts.push(`${cmd} ${x.toFixed(1)} ${y.toFixed(1)}`);
      envTopPts.push(`${cmd} ${x.toFixed(1)} ${envYTop.toFixed(1)}`);
      envBotPts.push(`${cmd} ${x.toFixed(1)} ${envYBot.toFixed(1)}`);
    }

    return {
      wavePathD: wPts.join(' '),
      upperEnvelopeD: envTopPts.join(' '),
      lowerEnvelopeD: envBotPts.join(' ')
    };
  }, [phaseRad, model]);

  const probeInfo = useMemo(() => {
    if (hoverNormX === null) return null;
    const x = zoneCouplantStart + hoverNormX * (zoneBackWallX - zoneCouplantStart);
    const evalPt = evaluateWaveAtSvgX(x);
    return {
      svgX: x,
      ...evalPt
    };
  }, [hoverNormX, phaseRad, model]);

  const formatThickness = (mm: number) =>
    unitSystem === 'imperial' ? `${(mm / 25.4).toFixed(2)}" (${mm.toFixed(1)} mm)` : `${mm.toFixed(1)} mm`;

  const selectedMatMeta = GE_MATERIALS[materialId];

  return (
    <section
      id="ge-longitudinal-wave-simulator"
      data-testid="ge-longitudinal-wave-simulator"
      aria-label={isAr ? 'محاكي الموجات فوق الصوتية الطولية عند الاختراق' : 'Ultrasonic Longitudinal Waves Penetration Simulator'}
      className="rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-5 sm:p-6 space-y-5 shadow-2xl"
    >
      {/* Top Simulator Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-cyan-400">
            <Waves className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden="true" />
            <span>
              {isAr
                ? 'محاكاة الموجات فوق الصوتية — نمط الموجات الطولية (0° Longitudinal / Compression Waves)'
                : 'Ultrasonic Testing Simulation — 0° Longitudinal (Compression) Waves'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {isAr
              ? 'شكل الموجة الطولية وتغيّر كثافتها وطولها الموجي عند اختراق المواد'
              : 'Longitudinal Wave Shape, Compression Density & Wavelength Shift on Penetration'}
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            {isAr
              ? 'تنتشر الموجات الطولية بتذبذب الجزيئات موازياً لاتجاه الاختراق (⇄) مكونةً مناطق تضاغط عالية الكثافة ومناطق تخلخل. عند عبور الحد الفاصل إلى المعدن تتغير الكثافة المكانية (λ = V_L / f) وتنخفض كثافة الطاقة بالانعكاس والتوهين الأسّي.'
              : 'Longitudinal waves oscillate particles parallel (⇄) to propagation, forming alternating high-density compression bands and low-density rarefactions. Crossing the couplant-to-specimen interface transforms wavelength (λ = V_L / f), compression spacing, and energy density via impedance mismatch and exponential attenuation.'}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="ge-longitudinal-play-pause-btn"
            onClick={() => setIsPlaying((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              isPlaying
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:bg-slate-700'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : isAr ? 'تشغيل الموجة' : 'Play Wave'}</span>
          </button>

          <button
            type="button"
            data-testid="ge-longitudinal-step-btn"
            onClick={() => {
              setIsPlaying(false);
              setPhaseRad((prev) => prev + Math.PI / 4);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
          >
            <StepForward className="w-3.5 h-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            <span>{isAr ? 'خطوة طور' : 'Step Phase'}</span>
          </button>

          <button
            type="button"
            data-testid="ge-longitudinal-reset-btn"
            onClick={() => {
              setFrequencyMhz(4.0);
              setCouplantId('glycerin');
              setFlawMode('none');
              setPhaseRad(0.85);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{isAr ? 'ضبط الموجة' : 'Reset Wave'}</span>
          </button>
        </div>
      </div>

      {/* Live Physical Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="block text-[10px] text-slate-400">
            {isAr ? 'سرعة الموجة الطولية (V_L)' : 'Longitudinal Velocity (V_L)'}
          </span>
          <strong data-testid="ge-longitudinal-velocity-readout" className="text-sm text-cyan-300 tabular-nums">
            {model.specimen.longitudinalVelocityMs.toLocaleString('en-US')} m/s
          </strong>
          <span className="block text-[10px] text-slate-500 tabular-nums">
            {isAr ? 'الوسط:' : 'Couplant:'} {model.couplant.longitudinalVelocityMs} m/s
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="block text-[10px] text-slate-400">
            {isAr ? 'كثافة المادة (ρ)' : 'Material Density (ρ)'}
          </span>
          <strong data-testid="ge-longitudinal-density-readout" className="text-sm text-amber-300 tabular-nums">
            {model.specimen.densityGcm3.toFixed(2)} g/cm³
          </strong>
          <span className="block text-[10px] text-slate-500 tabular-nums">
            Z₂ = {model.specimen.acousticImpedanceMRayl.toFixed(2)} MRayl
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="block text-[10px] text-slate-400">
            {isAr ? 'تغير الطول الموجي (λ)' : 'Wavelength Shift (λ₁ → λ₂)'}
          </span>
          <strong data-testid="ge-longitudinal-wavelength-readout" className="text-sm text-sky-300 tabular-nums">
            {model.couplantWavelengthMm.toFixed(2)} → {model.specimenWavelengthMm.toFixed(2)} mm
          </strong>
          <span className="block text-[10px] text-slate-500 tabular-nums">
            {model.wavelengthExpansionRatio >= 1
              ? `${model.wavelengthExpansionRatio.toFixed(2)}× ${isAr ? 'تمدد' : 'stretch'}`
              : `${model.wavelengthExpansionRatio.toFixed(2)}× ${isAr ? 'انضغاط' : 'compact'}`}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="block text-[10px] text-slate-400">
            {isAr ? 'نفاذ / انعكاس السطح' : 'Entry Transmitted / Reflected'}
          </span>
          <strong data-testid="ge-longitudinal-transmission-readout" className="text-sm text-emerald-300 tabular-nums">
            T {model.transmissionEnergyPct.toFixed(1)}% · R {model.reflectionEnergyPct.toFixed(1)}%
          </strong>
          <span className="block text-[10px] text-slate-500 tabular-nums">
            Z₁={model.couplant.acousticImpedanceMRayl} → Z₂={model.specimen.acousticImpedanceMRayl}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="block text-[10px] text-slate-400">
            {isAr ? 'كثافة التضاغط المتبقية' : 'Exit Wave Density'}
          </span>
          <strong data-testid="ge-longitudinal-exit-density-readout" className="text-sm text-teal-300 tabular-nums">
            {model.backWallEnergyDensityPct.toFixed(1)}%
          </strong>
          <span className="block text-[10px] text-slate-500 tabular-nums">
            {isAr ? 'توهين:' : 'Atten:'} {model.attenuationDbPerMm.toFixed(2)} dB/mm
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="block text-[10px] text-slate-400">
            {isAr ? 'كثافة القمم / سم وزمن العبور' : 'Fronts/cm & Round-Trip TOF'}
          </span>
          <strong data-testid="ge-longitudinal-tof-readout" className="text-sm text-violet-300 tabular-nums">
            {model.spatialWavefrontDensityPerCm.toFixed(1)} /cm · {model.timeOfFlightUs.toFixed(1)} µs
          </strong>
          <span className="block text-[10px] text-slate-500 tabular-nums">
            f = {model.frequencyMhz.toFixed(1)} MHz · t = {model.thicknessMm.toFixed(1)} mm
          </span>
        </div>
      </div>

      {/* Two-Zone Sandbox Layout: Stage (left/top ~68%) + Control Deck (right ~32%) */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* STAGE: Dual-Layer Longitudinal Wave Shape & Density Penetration Diagram */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 sm:p-4 space-y-3">
          {/* Stage Legend & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-cyan-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" aria-hidden="true" />
                <span>{isAr ? 'تضاغط (كثافة عالية)' : 'Compression (High Density)'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-slate-500 inline-block" aria-hidden="true" />
                <span>{isAr ? 'تخلخل (كثافة منخفضة)' : 'Rarefaction (Low Density)'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold">
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'اهتزاز جزيئات موازٍ لمسار الاختراق' : 'Particle Motion ∥ Wave Axis'}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {model.transmissionEnergyPct < 5 ? (
                <span
                  data-testid="ge-longitudinal-coupling-status"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 font-bold"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'انعكاس شبه كلي — لا يوجد نفاذ' : 'IMPEDANCE BLOCK (NO COUPLANT)'}</span>
                </span>
              ) : (
                <span
                  data-testid="ge-longitudinal-coupling-status"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'اختراق طولي مستمر' : 'ACTIVE PENETRATION'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive SVG Visualization */}
          <div className="relative overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950 p-1.5">
            <svg
              data-testid="ge-longitudinal-wave-svg"
              viewBox="0 0 820 380"
              className="w-full h-auto min-w-[600px] select-none"
              role="img"
              aria-label={
                isAr
                  ? 'رسم تفاعلي لشكل الموجات الطولية وتغير كثافتها عند اختراق المادة'
                  : 'Interactive diagram of longitudinal wave shape and compression density change upon material penetration'
              }
            >
              <defs>
                <linearGradient id="geUtProbeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="geUtCouplantBg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.16" />
                </linearGradient>
                <linearGradient id="geUtSpecimenBg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.96" />
                </linearGradient>
                <linearGradient id="geUtWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
                  <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.28" />
                </linearGradient>
              </defs>

              {/* Top Section Header Labels */}
              <text x="44" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
                {isAr ? 'مسبار PZT' : '0° PROBE'}
              </text>
              <text x={(zoneCouplantStart + zoneInterfaceX) / 2} y="22" fill="#38bdf8" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                {isAr ? `وسط التوصيل (λ₁=${model.couplantWavelengthMm.toFixed(2)}mm)` : `COUPLANT (λ₁=${model.couplantWavelengthMm.toFixed(2)}mm)`}
              </text>
              <text x={(zoneInterfaceX + zoneBackWallX) / 2} y="22" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                {isAr
                  ? `اختراق ${selectedMatMeta.nameAr.split('(')[0].trim()} · السُمك ${formatThickness(model.thicknessMm)} · λ₂=${model.specimenWavelengthMm.toFixed(2)}mm`
                  : `PENETRATED ${selectedMatMeta.nameEn.split('(')[0].trim().toUpperCase()} · ${formatThickness(model.thicknessMm)} · λ₂=${model.specimenWavelengthMm.toFixed(2)}mm`}
              </text>

              {/* Transducer Housing & Oscillating Piezoelectric Crystal */}
              <rect x="14" y={fieldTop + 14} width="66" height={fieldBottom - fieldTop - 28} rx="8" fill="url(#geUtProbeGrad)" stroke="#475569" strokeWidth="1.5" />
              <text x="46" y={fieldMidY - 8} fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                0° L
              </text>
              <text x="46" y={fieldMidY + 8} fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                {model.frequencyMhz.toFixed(1)} MHz
              </text>
              <text x="46" y={fieldMidY + 24} fill="#fbbf24" fontSize="9" fontFamily="monospace" textAnchor="middle">
                ⇄ PZT
              </text>
              {/* Oscillating crystal face */}
              <rect
                data-testid="ge-longitudinal-pzt-crystal"
                x={Number((78 + 3.2 * Math.sin(-phaseRad)).toFixed(1))}
                y={fieldTop + 18}
                width="7"
                height={fieldBottom - fieldTop - 36}
                rx="2"
                fill="#22d3ee"
                stroke="#cffafe"
                strokeWidth="0.8"
              />

              {/* Couplant Zone Box */}
              <rect
                x={zoneCouplantStart}
                y={fieldTop}
                width={couplantWidthPx}
                height={fieldBottom - fieldTop}
                fill="url(#geUtCouplantBg)"
                stroke="#0284c7"
                strokeWidth="1"
              />

              {/* Specimen Zone Box */}
              <rect
                x={zoneInterfaceX}
                y={fieldTop}
                width={specimenWidthPx}
                height={fieldBottom - fieldTop}
                fill="url(#geUtSpecimenBg)"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Longitudinal Compression / Rarefaction Density Bands */}
              <g data-testid="ge-longitudinal-compression-bands" pointerEvents="none">
                {compressionBands.map((b, idx) => (
                  <rect
                    key={idx}
                    x={b.x}
                    y={fieldTop + 2}
                    width={b.width}
                    height={fieldBottom - fieldTop - 4}
                    fill={b.isCompressed ? (b.inSpecimen ? '#06b6d4' : '#38bdf8') : '#020617'}
                    fillOpacity={b.opacity}
                  />
                ))}
              </g>

              {/* Longitudinal Medium Particles Oscillating Parallel to Propagation */}
              <g data-testid="ge-longitudinal-particle-field" pointerEvents="none">
                {particles.map((pt) => {
                  const isHighCompression = pt.densityNorm > 0.62;
                  const fill = isHighCompression
                    ? '#67e8f9'
                    : pt.densityNorm < 0.38
                      ? '#475569'
                      : pt.inSpecimen
                        ? '#94a3b8'
                        : '#7dd3fc';
                  const radius = isHighCompression ? 2.5 : pt.densityNorm < 0.38 ? 1.55 : 2.0;
                  return (
                    <circle
                      key={pt.id}
                      cx={pt.cx}
                      cy={pt.cy}
                      r={radius}
                      fill={fill}
                      fillOpacity={Math.max(0.28, Math.min(0.95, 0.32 + pt.envelope * 0.65))}
                    />
                  );
                })}
              </g>

              {/* Acoustic Entry Interface Boundary */}
              <line
                x1={zoneInterfaceX}
                y1={fieldTop - 8}
                x2={zoneInterfaceX}
                y2={waveBottom + 10}
                stroke="#fbbf24"
                strokeWidth="1.8"
                strokeDasharray="5 3"
              />
              <rect x={zoneInterfaceX - 44} y={fieldBottom + 4} width="88" height="16" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.9" />
              <text x={zoneInterfaceX} y={fieldBottom + 15} fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Z₁→Z₂ ({model.transmissionEnergyPct.toFixed(0)}% T)
              </text>

              {/* Optional Internal Flaw / Discontinuity Inside Specimen */}
              {model.flawMode !== 'none' && (
                <g data-testid="ge-longitudinal-flaw-marker">
                  {model.flawMode === 'porosity_void' ? (
                    <ellipse
                      cx={flawCenterX}
                      cy={fieldMidY}
                      rx="11"
                      ry="24"
                      fill="#020617"
                      stroke="#f87171"
                      strokeWidth="1.8"
                      strokeDasharray="3 2"
                    />
                  ) : (
                    <line
                      x1={flawCenterX}
                      y1={fieldMidY - 38}
                      x2={flawCenterX}
                      y2={fieldMidY + 38}
                      stroke="#f87171"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}
                  <rect x={flawCenterX - 46} y={fieldTop + 6} width="92" height="15" rx="3" fill="#450a0a" stroke="#f87171" strokeWidth="0.8" />
                  <text x={flawCenterX} y={fieldTop + 16.5} fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    {model.flawMode === 'porosity_void'
                      ? (isAr ? 'فجوة هوائية ← صدى' : 'VOID ← ECHO')
                      : (isAr ? 'شرخ داخلي ← صدى' : 'CRACK ← ECHO')}
                  </text>
                </g>
              )}

              {/* Back Wall Boundary */}
              <line x1={zoneBackWallX} y1={fieldTop - 6} x2={zoneBackWallX} y2={waveBottom + 10} stroke="#10b981" strokeWidth="2.2" />
              <text x={zoneBackWallX - 4} y={fieldBottom + 15} fill="#34d399" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                {isAr ? `الجدار الخلفي (${model.backWallEnergyDensityPct.toFixed(1)}%)` : `BACK WALL (${model.backWallEnergyDensityPct.toFixed(1)}%)`}
              </text>

              {/* Direction Arrows inside Particle Field */}
              <g pointerEvents="none" opacity="0.85">
                <line x1={zoneInterfaceX + 18} y1={fieldTop + 16} x2={zoneInterfaceX + 76} y2={fieldTop + 16} stroke="#38bdf8" strokeWidth="1.5" />
                <polygon points={`${zoneInterfaceX + 76},${fieldTop + 12} ${zoneInterfaceX + 84},${fieldTop + 16} ${zoneInterfaceX + 76},${fieldTop + 20}`} fill="#38bdf8" />
                <text x={zoneInterfaceX + 90} y={fieldTop + 19} fill="#7dd3fc" fontSize="8" fontFamily="monospace">
                  {isAr ? 'اتجاه الانتشار والاهتزاز ⇄' : 'Propagation & Oscillation ⇄'}
                </text>
              </g>

              {/* BOTTOM BAND: Longitudinal Density / Pressure Wave Shape Curve */}
              <rect
                x={zoneCouplantStart}
                y={waveTop}
                width={zoneBackWallX - zoneCouplantStart}
                height={waveBottom - waveTop}
                rx="6"
                fill="#020617"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {/* Baseline center axis (ambient density) */}
              <line
                x1={zoneCouplantStart}
                y1={waveMidY}
                x2={zoneBackWallX}
                y2={waveMidY}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Upper & Lower Density Attenuation Envelope */}
              <path
                data-testid="ge-longitudinal-envelope-upper"
                d={upperEnvelopeD}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.3"
                strokeDasharray="4 3"
                opacity="0.75"
              />
              <path
                data-testid="ge-longitudinal-envelope-lower"
                d={lowerEnvelopeD}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.3"
                strokeDasharray="4 3"
                opacity="0.75"
              />

              {/* Live Longitudinal Compression/Rarefaction Waveform */}
              <path
                data-testid="ge-longitudinal-waveform-path"
                d={wavePathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />

              {/* Waveform Axis Labels */}
              <text x={zoneCouplantStart - 6} y={waveTop + 12} fill="#67e8f9" fontSize="8" fontFamily="monospace" textAnchor="end">
                +Δρ
              </text>
              <text x={zoneCouplantStart - 6} y={waveMidY + 3} fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">
                ρ₀
              </text>
              <text x={zoneCouplantStart - 6} y={waveBottom - 6} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="end">
                -Δρ
              </text>
              <text x={zoneCouplantStart + 8} y={waveBottom + 14} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                {isAr
                  ? 'منحنى تغير كثافة الانضغاط اللحظية (+Δρ تضاغط / -Δρ تخلخل) مع غلاف التوهين بالاختراق'
                  : 'Instantaneous Compression Density Waveform (+Δρ Compression / -Δρ Rarefaction) + Penetration Envelope'}
              </text>

              {/* Interactive Hover Inspection Crosshair */}
              {probeInfo && (
                <g data-testid="ge-longitudinal-hover-probe" pointerEvents="none">
                  <line
                    x1={probeInfo.svgX}
                    y1={fieldTop}
                    x2={probeInfo.svgX}
                    y2={waveBottom}
                    stroke="#f8fafc"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                    opacity="0.7"
                  />
                  <circle
                    cx={probeInfo.svgX}
                    cy={waveMidY - Math.max(-1.15, Math.min(1.15, probeInfo.pressureNorm)) * waveMaxHalfHeight}
                    r="4"
                    fill="#22d3ee"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={Math.min(640, Math.max(zoneCouplantStart + 4, probeInfo.svgX + 8))}
                    y={waveTop + 6}
                    width="124"
                    height="32"
                    rx="4"
                    fill="#0f172a"
                    stroke="#22d3ee"
                    strokeWidth="0.9"
                  />
                  <text
                    x={Math.min(640, Math.max(zoneCouplantStart + 4, probeInfo.svgX + 8)) + 6}
                    y={waveTop + 19}
                    fill="#e2e8f0"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {probeInfo.zone === 'couplant'
                      ? (isAr ? 'وسط التوصيل' : 'Couplant Zone')
                      : `${isAr ? 'العمق' : 'Depth'}: ${probeInfo.depthMm.toFixed(1)} mm`}
                  </text>
                  <text
                    x={Math.min(640, Math.max(zoneCouplantStart + 4, probeInfo.svgX + 8)) + 6}
                    y={waveTop + 31}
                    fill="#67e8f9"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isAr ? 'كثافة الموجة:' : 'Wave Density:'} {probeInfo.energyDensityPct}%
                  </text>
                </g>
              )}

              {/* Transparent Hover Layer */}
              <rect
                data-testid="ge-longitudinal-hover-layer"
                x={zoneCouplantStart}
                y={fieldTop}
                width={zoneBackWallX - zoneCouplantStart}
                height={waveBottom - fieldTop}
                fill="transparent"
                className="cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (rect.width > 0) {
                    setHoverNormX(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                  } else {
                    setHoverNormX(0.5);
                  }
                }}
                onMouseLeave={() => setHoverNormX(null)}
              />
            </svg>
          </div>

          {/* Physical Insight Callout */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <Activity className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <div className="font-bold text-cyan-300">
                {isAr ? selectedMatMeta.nameAr : selectedMatMeta.nameEn}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr ? model.specimen.grainNoteAr : model.specimen.grainNoteEn}
              </p>
            </div>
          </div>
        </div>

        {/* CONTROL & CONCEPT DECK */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-cyan-400 border-b border-slate-800 pb-2.5">
            <Sliders className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'معاملات الاختراق والموجة الطولية' : 'Longitudinal Wave & Penetration Controls'}</span>
          </div>

          {/* Probe Frequency Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="ge-longitudinal-freq-slider" className="font-semibold text-slate-200">
                {isAr ? 'تردد المسبار الطولي (f):' : 'Probe Frequency (f):'}
              </label>
              <strong data-testid="ge-longitudinal-freq-value" className="font-mono text-cyan-300 tabular-nums">
                {frequencyMhz.toFixed(1)} MHz
              </strong>
            </div>
            <input
              id="ge-longitudinal-freq-slider"
              data-testid="ge-longitudinal-freq-slider"
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={frequencyMhz}
              onChange={(e) => setFrequencyMhz(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1.0 MHz ({isAr ? 'اختراق أعمق' : 'Deep'})</span>
              <span>4.0 MHz</span>
              <span>10.0 MHz ({isAr ? 'كثافة موجية أعلى' : 'Dense'})</span>
            </div>
          </div>

          {/* Specimen Material (synced with GE calculator materialId) */}
          <div className="space-y-1.5">
            <label htmlFor="ge-longitudinal-material-select" className="font-semibold text-slate-200 block">
              {isAr ? 'المادة المخترقة (متزامنة مع الحاسبة):' : 'Specimen Material (Synced):'}
            </label>
            <select
              id="ge-longitudinal-material-select"
              data-testid="ge-longitudinal-material-select"
              value={materialId}
              onChange={(e) => onChangeMaterialId(e.target.value as GeMaterialId)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {(Object.keys(GE_MATERIALS) as GeMaterialId[]).map((mKey) => {
                const mat = GE_MATERIALS[mKey];
                const utSpec = ULTRASONIC_LONGITUDINAL_MATERIALS[mKey];
                return (
                  <option key={mKey} value={mKey}>
                    {isAr ? mat.nameAr : mat.nameEn} ({utSpec.longitudinalVelocityMs} m/s · {mat.densityGcm3} g/cm³)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Specimen Thickness (synced with materialThicknessMm) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="ge-longitudinal-thickness-slider" className="font-semibold text-slate-200">
                {isAr ? 'سُمك الاختراق (t):' : 'Penetration Thickness (t):'}
              </label>
              <strong className="font-mono text-amber-300 tabular-nums">
                {formatThickness(materialThicknessMm)}
              </strong>
            </div>
            <input
              id="ge-longitudinal-thickness-slider"
              data-testid="ge-longitudinal-thickness-slider"
              type="range"
              min={4}
              max={90}
              step={1}
              value={Math.max(4, Math.min(90, materialThicknessMm))}
              onChange={(e) => onChangeThicknessMm(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Couplant / Delay Medium */}
          <div className="space-y-1.5">
            <label htmlFor="ge-longitudinal-couplant-select" className="font-semibold text-slate-200 block">
              {isAr ? 'وسط التوصيل (Couplant Interface):' : 'Couplant / Interface Medium:'}
            </label>
            <select
              id="ge-longitudinal-couplant-select"
              data-testid="ge-longitudinal-couplant-select"
              value={couplantId}
              onChange={(e) => setCouplantId(e.target.value as UltrasonicCouplantId)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {(Object.keys(ULTRASONIC_COUPLANTS) as UltrasonicCouplantId[]).map((cId) => {
                const c = ULTRASONIC_COUPLANTS[cId];
                return (
                  <option key={cId} value={cId}>
                    {isAr ? c.nameAr : c.nameEn} (Z={c.acousticImpedanceMRayl} MRayl)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Internal Discontinuity / Flaw Simulation */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{isAr ? 'عيب داخلي في مسار الاختراق:' : 'Internal Discontinuity in Path:'}</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'none', ar: 'سليم', en: 'Sound' },
                  { id: 'porosity_void', ar: 'فجوة مسامية', en: 'Air Void' },
                  { id: 'planar_crack', ar: 'شرخ مستوٍ', en: 'Crack' }
                ] as const
              ).map((opt) => {
                const active = flawMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`ge-longitudinal-flaw-${opt.id}`}
                    aria-pressed={active}
                    onClick={() => setFlawMode(opt.id)}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                      active
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {isAr ? opt.ar : opt.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concise Density Change Summary */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-[11px] font-mono">
            <div className="text-slate-400 font-bold">
              {isAr ? 'ملخص تغير الكثافة عند الاختراق:' : 'Penetration Density Summary:'}
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{isAr ? 'تباعد جبهات التضاغط:' : 'Wavefront Spacing:'}</span>
              <span className="text-cyan-300 tabular-nums">
                {model.couplantWavelengthMm.toFixed(2)} → {model.specimenWavelengthMm.toFixed(2)} mm
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{isAr ? 'فاقد الانعكاس السطحي:' : 'Interface Reflection Loss:'}</span>
              <span className="text-amber-300 tabular-nums">{model.reflectionEnergyPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{isAr ? 'الاحتفاظ بالكثافة حتى الجدار الخلفي:' : 'Retained Back-Wall Density:'}</span>
              <span className="text-emerald-300 tabular-nums">{model.backWallEnergyDensityPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
