import React, { useState, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Eye, 
  Flame,
  Atom,
  Info
} from 'lucide-react';
import { Language } from '../../types';

interface InteractiveBookExperimentProps {
  experimentId: string;
  language: Language;
}

export const InteractiveBookExperiment: React.FC<InteractiveBookExperimentProps> = ({ 
  experimentId, 
  language 
}) => {
  const isAr = language === 'ar';

  // =========================================================================
  // 1. EXPERIMENT: UT SNELL'S LAW & SOUND BEAM SIMULATOR
  // =========================================================================
  const [utIncidentAngle, setUtIncidentAngle] = useState<number>(38); // degrees in wedge
  const [utPlateThickness, setUtPlateThickness] = useState<number>(25); // mm
  const vWedge = 2700; // m/s Perspex longitudinal
  const vSteelShear = 3240; // m/s steel shear
  const vSteelLong = 5920; // m/s steel longitudinal

  const utCalculations = useMemo(() => {
    const radIncident = (utIncidentAngle * Math.PI) / 180;
    const sinInc = Math.sin(radIncident);

    // 1st Critical Angle (Longitudinal reaches 90°)
    const firstCritAngle = (Math.asin(vWedge / vSteelLong) * 180) / Math.PI; // ~27.1°
    // 2nd Critical Angle (Shear reaches 90°)
    const secondCritAngle = (Math.asin(vWedge / vSteelShear) * 180) / Math.PI; // ~56.4°

    // Calculate Refracted Shear Angle
    let shearAngleDeg = 0;
    let hasShearWave = false;
    const sinShear = (sinInc * vSteelShear) / vWedge;
    if (sinShear <= 1) {
      shearAngleDeg = (Math.asin(sinShear) * 180) / Math.PI;
      hasShearWave = true;
    }

    // Calculate Refracted Longitudinal Angle
    let longAngleDeg = 0;
    let hasLongWave = false;
    const sinLong = (sinInc * vSteelLong) / vWedge;
    if (sinLong <= 1) {
      longAngleDeg = (Math.asin(sinLong) * 180) / Math.PI;
      hasLongWave = true;
    }

    // Sound path & Skip distance for shear wave
    const radShear = (shearAngleDeg * Math.PI) / 180;
    const skipDistance = hasShearWave ? 2 * utPlateThickness * Math.tan(radShear) : 0;
    const halfSkip = skipDistance / 2;
    const soundPathHalf = hasShearWave ? utPlateThickness / Math.cos(radShear) : 0;
    const soundPathFull = soundPathHalf * 2;

    let modeDescriptionAr = '';
    let modeDescriptionEn = '';
    if (utIncidentAngle < firstCritAngle) {
      modeDescriptionAr = `موجات طولية (${longAngleDeg.toFixed(1)}°) وموجات قص (${shearAngleDeg.toFixed(1)}°) معاً - غير مفضل للفحص`;
      modeDescriptionEn = `Dual mode: Longitudinal (${longAngleDeg.toFixed(1)}°) and Shear (${shearAngleDeg.toFixed(1)}°) - Mode conversion noise`;
    } else if (utIncidentAngle <= secondCritAngle) {
      modeDescriptionAr = `موجة قص نقية (${shearAngleDeg.toFixed(1)}°) - النطاق المعياري المعتمد لفحص وصلات اللحام!`;
      modeDescriptionEn = `Pure Shear Wave (${shearAngleDeg.toFixed(1)}°) - Standard code approved weld inspection window!`;
    } else {
      modeDescriptionAr = 'موجات ريليه سطحية / تلاشي كامل في الفولاذ - زاوية أكبر من الزاوية الحرجة الثانية';
      modeDescriptionEn = 'Surface Rayleigh wave / Total internal reflection - Exceeded 2nd critical angle';
    }

    return {
      firstCritAngle,
      secondCritAngle,
      shearAngleDeg,
      longAngleDeg,
      hasShearWave,
      hasLongWave,
      skipDistance,
      halfSkip,
      soundPathFull,
      modeDescriptionAr,
      modeDescriptionEn
    };
  }, [utIncidentAngle, utPlateThickness]);

  // =========================================================================
  // 2. EXPERIMENT: PT CAPILLARY ACTION & PENETRATION LAB
  // =========================================================================
  const [ptFlawWidthUm, setPtFlawWidthUm] = useState<number>(4); // micrometers
  const [ptSurfaceTension, setPtSurfaceTension] = useState<number>(34); // mN/m (dynes/cm)
  const [ptContactAngle, setPtContactAngle] = useState<number>(12); // degrees
  const [ptViscosity, setPtViscosity] = useState<number>(15); // cSt

  const ptCalculations = useMemo(() => {
    const rMeters = (ptFlawWidthUm / 2) * 1e-6;
    const gammaNm = ptSurfaceTension * 1e-3;
    const thetaRad = (ptContactAngle * Math.PI) / 180;
    
    // Laplace Capillary Pressure: deltaP = (2 * gamma * cos(theta)) / r [Pa]
    const pressurePa = (2 * gammaNm * Math.cos(thetaRad)) / rMeters;
    const pressureKPa = pressurePa / 1000;
    const pressureAtm = pressurePa / 101325;

    // Washburn capillary flow rate ~ proportional to r * gamma * cos(theta) / viscosity
    const speedScore = Math.max(0.1, (ptFlawWidthUm * (ptSurfaceTension / 30) * Math.cos(thetaRad)) / (ptViscosity / 10));
    const minDwellMins = Math.max(5, Math.min(60, Math.round(50 / speedScore)));

    return {
      pressureKPa,
      pressureAtm,
      minDwellMins,
      isCompliant: ptContactAngle < 45 && ptSurfaceTension >= 25
    };
  }, [ptFlawWidthUm, ptSurfaceTension, ptContactAngle, ptViscosity]);

  // =========================================================================
  // 3. EXPERIMENT: MT MAGNETIC FLUX LEAKAGE LAB
  // =========================================================================
  const [mtCurrentMode, setMtCurrentMode] = useState<'AC' | 'DC'>('AC');
  const [mtCrackAngle, setMtCrackAngle] = useState<number>(85); // degrees relative to flux
  const [mtYokeSpacingMm, setMtYokeSpacingMm] = useState<number>(130); // mm

  const mtCalculations = useMemo(() => {
    // Flux leakage amplitude proportional to sin(theta)
    const rad = (mtCrackAngle * Math.PI) / 180;
    const leakageEfficiency = Math.abs(Math.sin(rad)) * 100;

    let detectabilityStatusAr = 'ممتازة جداً (دلالة حادة وواضحة)';
    let detectabilityStatusEn = 'Excellent (Sharp vivid indication)';
    if (leakageEfficiency < 30) {
      detectabilityStatusAr = 'معدومة / غير مرصودة (الفيض موازٍ للشرخ)';
      detectabilityStatusEn = 'Undetectable (Flux is parallel to flaw)';
    } else if (leakageEfficiency < 65) {
      detectabilityStatusAr = 'متوسطة / ضعيفة (تتطلب إعادة مغنطة متعامدة)';
      detectabilityStatusEn = 'Weak / Marginal (Requires orthogonal re-scan)';
    }

    const skinDepthMm = mtCurrentMode === 'AC' ? 1.5 : 6.0;
    const liftingPowerReqKg = mtCurrentMode === 'AC' ? 4.5 : 18.1;

    return {
      leakageEfficiency,
      detectabilityStatusAr,
      detectabilityStatusEn,
      skinDepthMm,
      liftingPowerReqKg
    };
  }, [mtCurrentMode, mtCrackAngle, mtYokeSpacingMm]);

  // =========================================================================
  // 4. EXPERIMENT: RT INVERSE SQUARE & SHIELDING LAB
  // =========================================================================
  const [rtActivityCi, setRtActivityCi] = useState<number>(50); // Curies Ir-192
  const [rtDistanceMeters, setRtDistanceMeters] = useState<number>(8); // meters
  const [rtShieldMaterial, setRtShieldMaterial] = useState<'None' | 'Lead' | 'Concrete'>('Lead');
  const [rtShieldThicknessMm, setRtShieldThicknessMm] = useState<number>(15); // mm

  const rtCalculations = useMemo(() => {
    // Gamma constant for Ir-192: ~5.2 R/(hr·Ci) at 1 meter = 5200 mR/hr at 1 meter per Ci
    const unshieldedIntensityAt1m = rtActivityCi * 5200; // mR/hr
    const unshieldedAtDistance = unshieldedIntensityAt1m / Math.pow(rtDistanceMeters, 2);

    // Half-Value Layer (HVL) for Ir-192:
    // Lead HVL ≈ 4.8 mm; Concrete HVL ≈ 43 mm
    let hvlMm = 4.8;
    if (rtShieldMaterial === 'Concrete') hvlMm = 43.0;

    let transmissionFactor = 1.0;
    if (rtShieldMaterial !== 'None' && rtShieldThicknessMm > 0) {
      transmissionFactor = Math.pow(0.5, rtShieldThicknessMm / hvlMm);
    }

    const doseRateMrHr = unshieldedAtDistance * transmissionFactor;
    const doseRateUSvHr = doseRateMrHr * 10; // 1 mR/hr ≈ 10 µSv/hr

    // Safe boundary (isodose of 2 mR/hr / 20 µSv/hr)
    const safeDistanceMeters = Math.sqrt((unshieldedIntensityAt1m * transmissionFactor) / 2);

    return {
      doseRateMrHr,
      doseRateUSvHr,
      safeDistanceMeters,
      isHazardous: doseRateMrHr > 2.0
    };
  }, [rtActivityCi, rtDistanceMeters, rtShieldMaterial, rtShieldThicknessMm]);

  // =========================================================================
  // 5. EXPERIMENT: ET SKIN DEPTH & PENETRATION LAB
  // =========================================================================
  const [etFrequencyKhz, setEtFrequencyKhz] = useState<number>(100); // kHz
  const [etConductivityIacs, setEtConductivityIacs] = useState<number>(30); // % IACS
  const [etRelativePerm, setEtRelativePerm] = useState<number>(1); // 1 for non-mag

  const etCalculations = useMemo(() => {
    // Resistivity rho (µΩ·cm) = 172.41 / %IACS
    const rho = 172.41 / Math.max(1, etConductivityIacs);
    const fHz = etFrequencyKhz * 1000;
    
    // delta = 50 * sqrt(rho / (f * mu_r)) [mm]
    const deltaMm = 50 * Math.sqrt(rho / (fHz * etRelativePerm));
    const effectiveDepth3DeltaMm = deltaMm * 3;

    return {
      rho,
      deltaMm,
      effectiveDepth3DeltaMm
    };
  }, [etFrequencyKhz, etConductivityIacs, etRelativePerm]);

  // =========================================================================
  // 6. EXPERIMENT: VT OPTICS & VIEWING COMPLIANCE LAB
  // =========================================================================
  const [vtDistanceInches, setVtDistanceInches] = useState<number>(18); // inches
  const [vtAngleDegrees, setVtAngleDegrees] = useState<number>(45); // degrees
  const [vtIlluminationLux, setVtIlluminationLux] = useState<number>(1250); // Lux

  const vtCompliance = useMemo(() => {
    const isDistCompliant = vtDistanceInches <= 24;
    const isAngleCompliant = vtAngleDegrees >= 30;
    const isLightCompliant = vtIlluminationLux >= 1076;
    const isAllPass = isDistCompliant && isAngleCompliant && isLightCompliant;

    return {
      isDistCompliant,
      isAngleCompliant,
      isLightCompliant,
      isAllPass
    };
  }, [vtDistanceInches, vtAngleDegrees, vtIlluminationLux]);

  // =========================================================================
  // 7. EXPERIMENT: MATERIALS IRON-CARBON PHASE LAB
  // =========================================================================
  const [matTempC, setMatTempC] = useState<number>(750); // Celsius
  const [matCarbonPct, setMatCarbonPct] = useState<number>(0.35); // % C

  const matPhaseInfo = useMemo(() => {
    let phaseAr = '';
    let phaseEn = '';
    let lattice = 'BCC';
    let isPwhtZone = matTempC >= 595 && matTempC <= 650;

    if (matTempC < 727) {
      if (matCarbonPct <= 0.8) {
        phaseAr = 'فيريت + بيرلايت (Ferrite + Pearlite) - صلب منخفض الكربون عالي المتانة ومغناطيسي';
        phaseEn = 'Ferrite + Pearlite (Sub-eutectoid structure, magnetic & ductile)';
      } else {
        phaseAr = 'بيرلايت + سمنتيت (Pearlite + Cementite) - صلب عالي الكربون صلد ومغناطيسي';
        phaseEn = 'Pearlite + Cementite (Hyper-eutectoid hard structure)';
      }
      lattice = 'BCC (Body-Centered Cubic)';
    } else if (matTempC <= 912 && matCarbonPct <= 0.8) {
      phaseAr = 'منطقة تحول جزئي: فيريت + أوستنيت (Ferrite + Austenite)';
      phaseEn = 'Intercritical zone: Ferrite + Austenite';
      lattice = 'BCC + FCC Mixture';
    } else {
      phaseAr = 'أوستنيت كامل (Austenite / γ-phase) - بنية مكعبة ممركزة الأوجه وغير مغناطيسية';
      phaseEn = 'Austenite (Pure FCC gamma phase, non-magnetic)';
      lattice = 'FCC (Face-Centered Cubic)';
    }

    return {
      phaseAr,
      phaseEn,
      lattice,
      isPwhtZone
    };
  }, [matTempC, matCarbonPct]);

  // =========================================================================
  // 8. EXPERIMENT: PAUT BEAM STEERING & DELAY LAWS LAB
  // =========================================================================
  const [pautSteerAngle, setPautSteerAngle] = useState<number>(15); // degrees (-30 to +30)
  const [pautFocalDepthMm, setPautFocalDepthMm] = useState<number>(30); // mm
  const [pautElementCount, setPautElementCount] = useState<number>(16); // 16, 32
  const pautPitchMm = 0.6; // element pitch mm
  const vLongitudinalSteel = 5920; // m/s

  const pautCalculations = useMemo(() => {
    const apertureWidthMm = pautElementCount * pautPitchMm;
    const steerRad = (pautSteerAngle * Math.PI) / 180;
    
    // Total delay across aperture: Delta_t = (Aperture * sin(theta)) / c [seconds]
    const maxDelaySec = (apertureWidthMm * 1e-3 * Math.sin(Math.abs(steerRad))) / vLongitudinalSteel;
    const maxDelayNs = Math.round(maxDelaySec * 1e9);

    // Near Field length: N = (D^2 * f) / (4 * v)
    const freqMhz = 5;
    const nearFieldMm = (Math.pow(apertureWidthMm, 2) * freqMhz * 1e6) / (4 * vLongitudinalSteel * 1e3);

    // Beam width at focal point approximately: lambda * F / D
    const lambdaMm = (vLongitudinalSteel / (freqMhz * 1e6)) * 1000;
    const beamWaistMm = Math.max(0.8, (lambdaMm * pautFocalDepthMm) / apertureWidthMm);

    return {
      apertureWidthMm,
      maxDelayNs,
      nearFieldMm,
      beamWaistMm,
      lambdaMm
    };
  }, [pautSteerAngle, pautFocalDepthMm, pautElementCount]);

  // =========================================================================
  // 9. EXPERIMENT: TOFD FLAW TIP DIFFRACTION & SIZING LAB
  // =========================================================================
  const [tofdPcsMm, setTofdPcsMm] = useState<number>(110); // Probe center separation (mm)
  const [tofdPlateThicknessMm, setTofdPlateThicknessMm] = useState<number>(25); // mm
  const [tofdFlawDepthMm, setTofdFlawDepthMm] = useState<number>(12); // mm from surface
  const [tofdFlawHeightMm, setTofdFlawHeightMm] = useState<number>(4); // mm

  const tofdCalculations = useMemo(() => {
    const s = tofdPcsMm / 2; // half PCS
    const c = 5920; // m/s steel longitudinal wave velocity
    const d1 = tofdFlawDepthMm; // upper tip depth
    const d2 = Math.min(tofdPlateThicknessMm - 0.5, tofdFlawDepthMm + tofdFlawHeightMm); // lower tip depth
    const T = tofdPlateThicknessMm; // backwall depth

    // Arrival times in microseconds (us): t = (2 / c) * sqrt(s^2 + d^2)
    const tLateralUs = ((2 * s * 1e-3) / c) * 1e6;
    const tUpperTipUs = ((2 * Math.sqrt(Math.pow(s * 1e-3, 2) + Math.pow(d1 * 1e-3, 2))) / c) * 1e6;
    const tLowerTipUs = ((2 * Math.sqrt(Math.pow(s * 1e-3, 2) + Math.pow(d2 * 1e-3, 2))) / c) * 1e6;
    const tBackwallUs = ((2 * Math.sqrt(Math.pow(s * 1e-3, 2) + Math.pow(T * 1e-3, 2))) / c) * 1e6;

    // Depth sizing verification formula: d = 0.5 * sqrt(c^2 * t^2 - 4 * s^2)
    const calculatedDepthMm = 0.5 * Math.sqrt(Math.max(0, Math.pow(c * (tUpperTipUs * 1e-6), 2) - 4 * Math.pow(s * 1e-3, 2))) * 1e3;

    return {
      s,
      d1,
      d2,
      tLateralUs,
      tUpperTipUs,
      tLowerTipUs,
      tBackwallUs,
      calculatedDepthMm
    };
  }, [tofdPcsMm, tofdPlateThicknessMm, tofdFlawDepthMm, tofdFlawHeightMm]);

  // =========================================================================
  // 10. EXPERIMENT: WELDING FLAW EVALUATOR (ASME & AWS STANDARDS)
  // =========================================================================
  const [weldStandard, setWeldStandard] = useState<'ASME_SEC_VIII' | 'ASME_B31_3' | 'AWS_D1_1'>('ASME_SEC_VIII');
  const [weldThicknessMm, setWeldThicknessMm] = useState<number>(16); // mm
  const [weldFlawType, setWeldFlawType] = useState<'crack' | 'lack_of_fusion' | 'incomplete_penetration' | 'elongated_slag' | 'isolated_porosity'>('elongated_slag');
  const [weldFlawLengthMm, setWeldFlawLengthMm] = useState<number>(4.5); // mm

  const weldEvaluation = useMemo(() => {
    let isAccepted = false;
    let maxAllowedLengthMm = 0;
    let standardClause = '';
    let explanationAr = '';
    let explanationEn = '';

    // Cracks are rejectable in all engineering codes
    if (weldFlawType === 'crack') {
      isAccepted = false;
      standardClause = weldStandard === 'ASME_SEC_VIII' ? 'ASME Sec VIII Div 1 UW-51(b)(1)' : (weldStandard === 'ASME_B31_3' ? 'ASME B31.3 Table 341.3.2 (A)' : 'AWS D1.1 Table 6.1 (1)');
      explanationAr = 'الشروخ والتشققات بجميع أنواعها وأطوالها غير مقبولة هندسياً قطعاً (Rejectable) في كافة الكودات الدولية لما تشكله من مكثفات إجهاد بالغة الخطورة.';
      explanationEn = 'Cracks are strictly prohibited and non-negotiably rejectable under all standard engineering codes due to extreme stress concentration risks.';
      return { isAccepted, maxAllowedLengthMm: 0, standardClause, explanationAr, explanationEn };
    }

    // Lack of Fusion & Incomplete Penetration
    if (weldFlawType === 'lack_of_fusion' || weldFlawType === 'incomplete_penetration') {
      if (weldStandard === 'ASME_SEC_VIII') {
        isAccepted = false;
        standardClause = 'ASME Sec VIII UW-51(b)(2)';
        explanationAr = 'نقص الانصهار ونقص الاختراق في أوعية الضغط غير مقبول تماماً بغض النظر عن طوله طبقاً لاشتراطات UW-51 التصويرية الكاملة.';
        explanationEn = 'Lack of fusion and incomplete penetration are zero-tolerance rejectable defects in Section VIII pressure vessels.';
      } else if (weldStandard === 'ASME_B31_3') {
        // In B31.3 Normal Fluid Service, incomplete penetration is acceptable up to 1mm or 0.2t (max 38mm in 150mm weld)
        maxAllowedLengthMm = Math.min(38, Math.max(1, 0.2 * weldThicknessMm));
        isAccepted = weldFlawLengthMm <= maxAllowedLengthMm;
        standardClause = 'ASME B31.3 Table 341.3.2 (B)';
        explanationAr = `في خدمة الموائع العادية (Normal Fluid)، يُسمح بنقص اختراق بحد أقصى ${maxAllowedLengthMm.toFixed(1)} ملم.`;
        explanationEn = `In Normal Fluid Service, incomplete penetration is permissible up to ${maxAllowedLengthMm.toFixed(1)} mm cumulatively.`;
      } else {
        isAccepted = false;
        standardClause = 'AWS D1.1 Table 6.1 (2)';
        explanationAr = 'في الوصلات غير الأنبوبية المحملة إنشائياً، أي نقص انصهار مستوٍ يعتبر عيباً مرفوضاً.';
        explanationEn = 'For statically loaded structural joints, planar lack of fusion is strictly rejectable.';
      }
      return { isAccepted, maxAllowedLengthMm, standardClause, explanationAr, explanationEn };
    }

    // Elongated Slag Inclusions
    if (weldFlawType === 'elongated_slag') {
      if (weldStandard === 'ASME_SEC_VIII') {
        // UW-51: 6mm for t <= 19mm; t/3 for 19mm < t <= 57mm; 19mm for t > 57mm
        if (weldThicknessMm <= 19) maxAllowedLengthMm = 6.0;
        else if (weldThicknessMm <= 57) maxAllowedLengthMm = weldThicknessMm / 3.0;
        else maxAllowedLengthMm = 19.0;
        isAccepted = weldFlawLengthMm <= maxAllowedLengthMm;
        standardClause = 'ASME Sec VIII Div 1 UW-51(b)(3)';
        explanationAr = `الحد الأقصى المسموح لخَبث اللحام المتطاول لسماكة ${weldThicknessMm} ملم هو ${maxAllowedLengthMm.toFixed(1)} ملم.`;
        explanationEn = `Max allowable elongated slag inclusion for ${weldThicknessMm} mm thickness is ${maxAllowedLengthMm.toFixed(1)} mm.`;
      } else if (weldStandard === 'ASME_B31_3') {
        // Table 341.3.2: 2t/3 or 3mm
        maxAllowedLengthMm = Math.min(weldThicknessMm / 3, 3.0);
        isAccepted = weldFlawLengthMm <= maxAllowedLengthMm;
        standardClause = 'ASME B31.3 Table 341.3.2 (D)';
        explanationAr = `في أنابيب المعالجة، أقصى طول فردي للخبث هو ${maxAllowedLengthMm.toFixed(1)} ملم.`;
        explanationEn = `In process piping, max individual slag indication length is ${maxAllowedLengthMm.toFixed(1)} mm.`;
      } else {
        // AWS D1.1 Table 6.1
        maxAllowedLengthMm = Math.min(10, weldThicknessMm / 3);
        isAccepted = weldFlawLengthMm <= maxAllowedLengthMm;
        standardClause = 'AWS D1.1 Clause 6.12.2';
        explanationAr = `في الهياكل الإنشائية AWS D1.1، الحد الأقصى المسموح لمؤشر الخبث هو ${maxAllowedLengthMm.toFixed(1)} ملم.`;
        explanationEn = `Under AWS D1.1 structural criteria, max permissible slag indication is ${maxAllowedLengthMm.toFixed(1)} mm.`;
      }
      return { isAccepted, maxAllowedLengthMm, standardClause, explanationAr, explanationEn };
    }

    // Isolated Porosity
    maxAllowedLengthMm = Math.min(6.0, weldThicknessMm / 4);
    isAccepted = weldFlawLengthMm <= maxAllowedLengthMm;
    standardClause = 'ASME Sec VIII Mandatory Appendix 4';
    explanationAr = `المسامية الدائرية المنعزلة بقطر ${weldFlawLengthMm} ملم مقبولة إذا لم تتجاوز المخططات البيانية للمسامية المعيارية.`;
    explanationEn = `Isolated porosity indication of ${weldFlawLengthMm} mm is evaluated against standard chart maximum density.`;

    return { isAccepted, maxAllowedLengthMm, standardClause, explanationAr, explanationEn };
  }, [weldStandard, weldThicknessMm, weldFlawType, weldFlawLengthMm]);

  // =========================================================================
  // 11. EXPERIMENT: ACOUSTIC EMISSION KAISER & FELICITY RATIO LAB
  // =========================================================================
  const [aePreviousMaxLoadKn, setAePreviousMaxLoadKn] = useState<number>(100); // Previous max load kN
  const [aeCurrentLoadKn, setAeCurrentLoadKn] = useState<number>(85); // Current applied load kN
  const [aeMaterialCondition, setAeMaterialCondition] = useState<'sound' | 'microcracking' | 'severe_flaw'>('microcracking');

  const aeCalculations = useMemo(() => {
    // Determine onset load based on material damage state
    let onsetRatio = 1.05; // Kaiser effect holds: no emission until previous load exceeded
    if (aeMaterialCondition === 'microcracking') {
      onsetRatio = 0.88; // Felicity ratio < 1.0 (emission starts before previous load)
    } else if (aeMaterialCondition === 'severe_flaw') {
      onsetRatio = 0.72; // Severe active crack propagation
    }

    const emissionOnsetLoadKn = aePreviousMaxLoadKn * onsetRatio;
    const felicityRatio = emissionOnsetLoadKn / aePreviousMaxLoadKn;
    const isEmitting = aeCurrentLoadKn >= emissionOnsetLoadKn;

    // Cumulative hits estimation
    let cumulativeHits = 0;
    if (isEmitting) {
      const overLoad = aeCurrentLoadKn - emissionOnsetLoadKn;
      cumulativeHits = Math.round(Math.pow(overLoad, 1.6) * 12 + 15);
    }

    let statusDiagnosisAr = '';
    let statusDiagnosisEn = '';
    if (felicityRatio >= 1.0) {
      statusDiagnosisAr = 'تأثير كايزر ساري المفعول (Kaiser Effect): الهيكل سليم ولا توجد شروخ نشطة تحت هذا التحميل.';
      statusDiagnosisEn = 'Kaiser Effect Valid: Structurally sound, zero acoustic emissions until prior peak load is surpassed.';
    } else {
      statusDiagnosisAr = `ظاهرة فيليسيتي نشطة (Felicity Effect): انبعاثات مبكرة عند نسبة تحميل ${felicityRatio.toFixed(2)} تدل على وجود شرخ ميكانيكي نشط ينمو داخل المادة!`;
      statusDiagnosisEn = `Felicity Effect Active: Early emission at Felicity Ratio ${felicityRatio.toFixed(2)} reveals active propagating fatigue crack!`;
    }

    return {
      emissionOnsetLoadKn,
      felicityRatio,
      isEmitting,
      cumulativeHits,
      statusDiagnosisAr,
      statusDiagnosisEn
    };
  }, [aePreviousMaxLoadKn, aeCurrentLoadKn, aeMaterialCondition]);

  // =========================================================================
  // 12. EXPERIMENT: HELIUM MASS SPECTROMETER LEAK DETECTOR LAB (HMSLD)
  // =========================================================================
  const [ltVacuumLevelExponent, setLtVacuumLevelExponent] = useState<number>(-5); // 10^-5 mbar
  const [ltOrificeDiameterUm, setLtOrificeDiameterUm] = useState<number>(3.5); // um
  const [ltTracerGas, setLtTracerGas] = useState<'helium' | 'air'>('helium');

  const ltCalculations = useMemo(() => {
    // Gas molecular weight: He = 4 g/mol, Air = 28.9 g/mol
    const molWeight = ltTracerGas === 'helium' ? 4 : 28.9;
    const pressureMbar = Math.pow(10, ltVacuumLevelExponent);

    // Flow regime determined by Knudsen number Kn = lambda / d
    // At high vacuum (Kn > 1): Molecular flow regime (Graham's Law: Leak rate proportional to 1/sqrt(M))
    const isMolecularFlow = ltVacuumLevelExponent <= -3;
    const molecularFlowMultiplier = Math.sqrt(28.9 / molWeight); // Helium flows ~2.7x faster than air through molecular leak

    // Leak rate Q in mbar*L/s (approx std.cm3/s)
    // Q proportional to d^2 or d^4 depending on regime
    const baseLeakRate = isMolecularFlow
      ? 1.5e-7 * Math.pow(ltOrificeDiameterUm / 2, 2) * (ltTracerGas === 'helium' ? molecularFlowMultiplier : 1)
      : 8e-6 * Math.pow(ltOrificeDiameterUm / 2, 4);

    const actualLeakRate = baseLeakRate * (pressureMbar / 1e-4);
    const standardPassThreshold = 1.0e-6; // ASME Sec V Art 10 typical pass threshold for vacuum systems
    const isAcceptable = actualLeakRate < standardPassThreshold;

    return {
      pressureMbar,
      isMolecularFlow,
      molecularFlowMultiplier,
      actualLeakRate,
      standardPassThreshold,
      isAcceptable
    };
  }, [ltVacuumLevelExponent, ltOrificeDiameterUm, ltTracerGas]);

  // =========================================================================
  // 13. EXPERIMENT: IRT STEFAN-BOLTZMANN & EMISSIVITY LAB
  // =========================================================================
  const [irtObjectTempC, setIrtObjectTempC] = useState<number>(85); // Object surface temperature C
  const [irtEmissivity, setIrtEmissivity] = useState<number>(0.85); // Emissivity (0.1 to 1.0)
  const [irtReflectedAmbientTempC, setIrtReflectedAmbientTempC] = useState<number>(25); // Ambient reflection C
  const sigmaStefanBoltzmann = 5.670374419e-8; // W / (m^2 * K^4)

  const irtCalculations = useMemo(() => {
    const tempKelvin = irtObjectTempC + 273.15;
    const ambientKelvin = irtReflectedAmbientTempC + 273.15;

    // Wien's Displacement Law: lambda_max = 2897.8 / T_K [um]
    const lambdaMaxUm = 2897.8 / tempKelvin;

    // Stefan-Boltzmann Total Emissive Power: E = epsilon * sigma * T^4 [W/m^2]
    const emittedPowerWm2 = irtEmissivity * sigmaStefanBoltzmann * Math.pow(tempKelvin, 4);

    // Reflected background power: (1 - epsilon) * sigma * T_amb^4 [W/m^2]
    const reflectedPowerWm2 = (1 - irtEmissivity) * sigmaStefanBoltzmann * Math.pow(ambientKelvin, 4);

    // Total radiance reaching camera lens
    const totalRadianceWm2 = emittedPowerWm2 + reflectedPowerWm2;

    // Apparent uncompensated temperature measured by camera if set to epsilon = 1.0
    const apparentUncompensatedKelvin = Math.pow(totalRadianceWm2 / sigmaStefanBoltzmann, 0.25);
    const apparentUncompensatedC = apparentUncompensatedKelvin - 273.15;
    const measurementErrorC = Math.abs(apparentUncompensatedC - irtObjectTempC);

    return {
      tempKelvin,
      lambdaMaxUm,
      emittedPowerWm2,
      reflectedPowerWm2,
      totalRadianceWm2,
      apparentUncompensatedC,
      measurementErrorC
    };
  }, [irtObjectTempC, irtEmissivity, irtReflectedAmbientTempC]);

  // =========================================================================
  // 14. EXPERIMENT: IRT ELECTRICAL HOTSPOT & DELTA-T SEVERITY EVALUATOR
  // =========================================================================
  const [irtComponentTempC, setIrtComponentTempC] = useState<number>(68); // Measured component temp C
  const [irtReferenceTempC, setIrtReferenceTempC] = useState<number>(36); // Reference / baseline temp C
  const [irtComponentType, setIrtComponentType] = useState<'terminal_lug' | 'busbar_joint' | 'circuit_breaker' | 'transformer_bushing'>('terminal_lug');

  const irtHotspotSeverity = useMemo(() => {
    const deltaTC = irtComponentTempC - irtReferenceTempC;

    // NETA / NFPA 70B Severity Assessment Categories
    let severityLevel: 'normal' | 'advisory' | 'intermediate' | 'serious' | 'critical' = 'normal';
    let correctiveActionAr = '';
    let correctiveActionEn = '';
    let standardCodeCitation = 'NFPA 70B & NETA MTS Table 100.18';

    if (deltaTC <= 3) {
      severityLevel = 'normal';
      correctiveActionAr = 'فروق حرارية طبيعية جداً ومتوازنة عبر أطوار الدائرة (ضمن الحدود المقبولة).';
      correctiveActionEn = 'Normal thermal balance across phases (within benign operating limits).';
    } else if (deltaTC <= 10) {
      severityLevel = 'advisory';
      correctiveActionAr = 'نقطة ساخنة طفيفة (1°C إلى 10°C): تنبيه استشاري، يوصى بالفحص في الصيانة الدورية المجدولة القادمة.';
      correctiveActionEn = 'Minor deficiency (1°C to 10°C Delta-T): Advisory notice; investigate at next scheduled outage.';
    } else if (deltaTC <= 20) {
      severityLevel = 'intermediate';
      correctiveActionAr = 'نقطة ساخنة متوسطة (11°C إلى 20°C): خلل محتمل في عزم الربط، يلزم تنظيف التلامسات وإعادة الربط خلال أسابيع.';
      correctiveActionEn = 'Moderate deficiency (11°C to 20°C Delta-T): Probable terminal looseness; re-torque within weeks.';
    } else if (deltaTC <= 40) {
      severityLevel = 'serious';
      correctiveActionAr = 'خلل حراري جسيم (21°C إلى 40°C): تآكل أو مقاومة تلامس خطرة، يلزم إصلاح فوري في أقرب فرصة تشغيلية ممكنة.';
      correctiveActionEn = 'Serious hazard (21°C to 40°C Delta-T): High contact resistance; repair as soon as feasible.';
    } else {
      severityLevel = 'critical';
      correctiveActionAr = 'خطر داهم وحرج للغاية (> 40°C): احتمالية اشتعال أو وميض قوسي كهربائي (Arc Flash)، يلزم الفصل الفوري والإصلاح الطارئ!';
      correctiveActionEn = 'Critical emergency (> 40°C Delta-T): Imminent arc flash or fire hazard; mandate immediate shutdown and repair!';
    }

    return {
      deltaTC,
      severityLevel,
      correctiveActionAr,
      correctiveActionEn,
      standardCodeCitation
    };
  }, [irtComponentTempC, irtReferenceTempC, irtComponentType]);

  return (
    <div className="bg-[#080b1f] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-fadeIn text-slate-100 my-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#1c2452]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block font-mono">
              {isAr ? 'المعمل التفاعلي الحي المدمج داخل الكتاب' : 'Live Embedded Virtual Laboratory'}
            </span>
            <h4 className="text-sm sm:text-base font-black text-white">
              {experimentId === 'exp-ut-snell-beam' && (isAr ? 'محاكاة انكسار الصوت وقانون سنيل (Snell’s Law Simulator)' : 'Snell’s Law & Sound Beam Simulator')}
              {experimentId === 'exp-pt-capillary-lab' && (isAr ? 'محاكاة الخاصية الشعرية والضغط الشعري للصبغة' : 'Capillary Pressure & Flaw Penetration Lab')}
              {experimentId === 'exp-mt-flux-leakage' && (isAr ? 'محاكاة خطوط تسرب الفيض المغناطيسي وتجمع الجسيمات' : 'Magnetic Flux Leakage & Yoke Field Simulator')}
              {experimentId === 'exp-rt-shielding-lab' && (isAr ? 'محاكاة قانون التربيع العكسي وتدريع الإشعاع (ALARA)' : 'Radiation Inverse Square & Shielding Simulator')}
              {experimentId === 'exp-et-skin-depth' && (isAr ? 'محاكاة عمق التغلغل القياسي للتيارات الدوامية (Skin Effect)' : 'Eddy Current Skin Depth Simulator')}
              {experimentId === 'exp-vt-optics-lab' && (isAr ? 'محاكاة شروط وزوايا الفحص البصري (ASME Sec V Art 9)' : 'Visual Inspection Optics & Angle Verification')}
              {experimentId === 'exp-materials-phase-lab' && (isAr ? 'مستكشف مخطط أطوار الحديد والكربون والمعالجة الحرارية' : 'Iron-Carbon Phase Diagram Explorer')}
              {experimentId === 'exp-paut-beam-steering' && (isAr ? 'محاكاة التوجيه والتركيز الإلكتروني للمصفوفات الطورية (PAUT Delay Laws)' : 'PAUT Electronic Beam Steering & Delay Laws Lab')}
              {experimentId === 'exp-tofd-diffraction-lab' && (isAr ? 'محاكاة حيود قمة الشق وتوليد إشارات TOFD (Tip Diffraction & Phase Inversion)' : 'TOFD Flaw Tip Diffraction & Phase Inversion Lab')}
              {experimentId === 'exp-welding-flaw-evaluator' && (isAr ? 'المقيّم التفاعلي لعيوب اللحام وفق كودات ASME Sec VIII و ASME B31.3 و AWS D1.1' : 'Welding Flaw Evaluation Simulator (ASME & AWS Codes)')}
              {experimentId === 'exp-ae-kaiser-felicity' && (isAr ? 'محاكاة تأثير كايزر وفيليسيتي ونسبة التحميل (Acoustic Emission Load Ratio)' : 'Acoustic Emission Kaiser & Felicity Ratio Lab')}
              {experimentId === 'exp-lt-vacuum-leak' && (isAr ? 'محاكاة كاشف تسريب مطياف كتلة الهيليوم (HMSLD Vacuum Leak Rate)' : 'Helium Mass Spectrometer Leak Detection Lab')}
              {experimentId === 'exp-irt-blackbody-emissivity' && (isAr ? 'محاكاة إشعاع الجسم الأسود وقانون ستيفان-بولتزمان (Stefan-Boltzmann Emissivity)' : 'Stefan-Boltzmann Emissivity & Radiation Physics Lab')}
              {experimentId === 'exp-irt-electrical-hotspot' && (isAr ? 'مقيّم النقاط الساخنة بالقواطع الكهربائية وفروق الحرارة (ΔT Hotspot Evaluator)' : 'Electrical Hotspot & Delta-T Severity Evaluator (NFPA 70B)')}
            </h4>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isAr ? 'محاكاة حية' : 'Live Interactive'}</span>
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. RENDER: UT SNELL'S LAW SIMULATOR */}
      {/* ========================================================================= */}
      {experimentId === 'exp-ut-snell-beam' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {isAr ? 'زاوية السقوط في الإسفين (Incident Angle):' : 'Incident Wedge Angle:'}
                </label>
                <span className="font-mono text-amber-400 font-bold">{utIncidentAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                value={utIncidentAngle}
                onChange={(e) => setUtIncidentAngle(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0° (طولي مستقيم)</span>
                <span>الحرجة الأولى ({utCalculations.firstCritAngle.toFixed(1)}°)</span>
                <span>الحرجة الثانية ({utCalculations.secondCritAngle.toFixed(1)}°)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {isAr ? 'سماكة قطعة الفولاذ (Plate Thickness):' : 'Steel Plate Thickness:'}
                </label>
                <span className="font-mono text-sky-400 font-bold">{utPlateThickness} mm</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={utPlateThickness}
                onChange={(e) => setUtPlateThickness(parseInt(e.target.value) || 25)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 mm (رقيقة)</span>
                <span>25 mm (متوسطة)</span>
                <span>50 mm (ثقيلة)</span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Canvas / SVG diagram */}
          <div className="bg-[#050714] border border-[#1b224d] rounded-2xl p-4 text-center overflow-hidden">
            <svg viewBox="0 0 500 240" className="w-full max-h-64 mx-auto">
              {/* Perspex Wedge */}
              <polygon points="50,20 180,20 180,100 50,100" fill="#1e2954" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="70" y="55" fill="#93c5fd" fontSize="11" fontWeight="bold">إسفين البلكسيجلاس (2700 m/s)</text>

              {/* Steel Workpiece */}
              <rect x="20" y="100" width="460" height="110" fill="#111827" stroke="#475569" strokeWidth="2" />
              <text x="30" y="125" fill="#94a3b8" fontSize="11" fontWeight="bold">قطعة الفولاذ (الصلب الكربوني)</text>
              <text x="30" y="145" fill="#64748b" fontSize="10">سماكة القطعة: {utPlateThickness} mm</text>

              {/* Interface Line */}
              <line x1="20" y1="100" x2="480" y2="100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />

              {/* Incident Sound Beam in Wedge */}
              <line 
                x1={180 - Math.tan((utIncidentAngle * Math.PI) / 180) * 80} 
                y1="20" 
                x2="180" 
                y2="100" 
                stroke="#fbbf24" 
                strokeWidth="3" 
              />
              <circle cx="180" cy="100" r="4" fill="#f59e0b" />

              {/* Refracted Shear Wave Beam */}
              {utCalculations.hasShearWave && (
                <>
                  <line 
                    x1="180" 
                    y1="100" 
                    x2={180 + Math.tan((utCalculations.shearAngleDeg * Math.PI) / 180) * 110} 
                    y2="210" 
                    stroke="#38bdf8" 
                    strokeWidth="3" 
                  />
                  {/* Reflected Skip from Backwall */}
                  <line 
                    x1={180 + Math.tan((utCalculations.shearAngleDeg * Math.PI) / 180) * 110} 
                    y1="210" 
                    x2={180 + Math.tan((utCalculations.shearAngleDeg * Math.PI) / 180) * 220} 
                    y2="100" 
                    stroke="#38bdf8" 
                    strokeWidth="2" 
                    strokeDasharray="4 2" 
                  />
                  <text 
                    x={200 + Math.tan((utCalculations.shearAngleDeg * Math.PI) / 180) * 50} 
                    y="160" 
                    fill="#38bdf8" 
                    fontSize="11" 
                    fontWeight="bold"
                  >
                    موجة القص: {utCalculations.shearAngleDeg.toFixed(1)}°
                  </text>
                </>
              )}

              {/* Refracted Longitudinal Wave Beam (if below 1st critical) */}
              {utCalculations.hasLongWave && (
                <>
                  <line 
                    x1="180" 
                    y1="100" 
                    x2={180 + Math.tan((utCalculations.longAngleDeg * Math.PI) / 180) * 110} 
                    y2="210" 
                    stroke="#f43f5e" 
                    strokeWidth="2" 
                    strokeDasharray="2 2" 
                  />
                  <text 
                    x={210 + Math.tan((utCalculations.longAngleDeg * Math.PI) / 180) * 30} 
                    y="130" 
                    fill="#f43f5e" 
                    fontSize="10"
                  >
                    موجة طولية: {utCalculations.longAngleDeg.toFixed(1)}°
                  </text>
                </>
              )}
            </svg>
          </div>

          {/* Calculations Summary Card */}
          <div className="p-4 rounded-2xl bg-[#0d112e] border border-[#232c66] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">
                {isAr ? 'حالة الحزمة الصوتية:' : 'Sound Mode:'}{' '}
                <strong className="text-amber-300">{isAr ? utCalculations.modeDescriptionAr : utCalculations.modeDescriptionEn}</strong>
              </span>
              <span className="font-mono text-sky-400 font-bold">
                Skip Distance: {utCalculations.skipDistance.toFixed(1)} mm
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono border-t border-[#1a2150]">
              <div className="text-slate-400">زاوية السقوط: <span className="text-white">{utIncidentAngle}°</span></div>
              <div className="text-slate-400">انكسار القص: <span className="text-sky-300">{utCalculations.shearAngleDeg.toFixed(1)}°</span></div>
              <div className="text-slate-400">نصف القفزة (½ Skip): <span className="text-amber-300">{utCalculations.halfSkip.toFixed(1)} mm</span></div>
              <div className="text-slate-400">مسار الصوت (Full Path): <span className="text-emerald-300">{utCalculations.soundPathFull.toFixed(1)} mm</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RENDER: PT CAPILLARY LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-pt-capillary-lab' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {isAr ? 'عرض فتحة الشق (Flaw Aperture Width):' : 'Crack Width (W):'}
                </label>
                <span className="font-mono text-rose-400 font-bold">{ptFlawWidthUm} µm</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={20}
                step={0.5}
                value={ptFlawWidthUm}
                onChange={(e) => setPtFlawWidthUm(parseFloat(e.target.value) || 4)}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 µm (شرخ شعري دقيق)</span>
                <span>20 µm (شق سطحي عريض)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {isAr ? 'زاوية التلامس والترطيب (Contact Angle θ):' : 'Contact Angle (θ):'}
                </label>
                <span className="font-mono text-amber-400 font-bold">{ptContactAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={ptContactAngle}
                onChange={(e) => setPtContactAngle(parseInt(e.target.value) || 12)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0° (ترطيب كامل وفوري)</span>
                <span>60° (ترطيب ضعيف جداً)</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-[#140b18] border border-[#3b1735]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'الضغط الشعري المتولد (ΔP):' : 'Capillary Suction Pressure:'}</span>
              <span className="text-2xl font-black text-rose-400 font-mono">{ptCalculations.pressureKPa.toFixed(1)} kPa</span>
              <span className="text-[10px] text-slate-500 block">({ptCalculations.pressureAtm.toFixed(2)} ضغط جوي)</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#140b18] border border-[#3b1735]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'أدنى زمن مكوث موصى به:' : 'Min Required Dwell Time:'}</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{ptCalculations.minDwellMins} mins</span>
              <span className="text-[10px] text-slate-500 block">{isAr ? 'طبقاً لـ ASME Sec V' : 'Per ASME Sec V'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#140b18] border border-[#3b1735]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'حالة الجاهزية والامتثال:' : 'Capillary Status:'}</span>
              <span className={`text-base font-bold ${ptCalculations.isCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ptCalculations.isCompliant ? (isAr ? '✓ ترطيب ممتاز وتغلغل سريع' : '✓ Excellent Wetting') : (isAr ? '✕ ترطيب بطيء يتطلب تنظيفاً' : '✕ Poor Infiltration')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RENDER: MT FLUX LEAKAGE LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-mt-flux-leakage' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                {isAr ? 'نوع تيار الحاضنة:' : 'Yoke Current Mode:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMtCurrentMode('AC')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    mtCurrentMode === 'AC' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#151a44] text-slate-300'
                  }`}
                >
                  AC (سطحي)
                </button>
                <button
                  onClick={() => setMtCurrentMode('DC')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    mtCurrentMode === 'DC' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#151a44] text-slate-300'
                  }`}
                >
                  DC (أعماق)
                </button>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {isAr ? 'زاوية الشق مع خطوط الفيض:' : 'Flaw Angle to Flux:'}
                </label>
                <span className="font-mono text-amber-400 font-bold">{mtCrackAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                value={mtCrackAngle}
                onChange={(e) => setMtCrackAngle(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0° (موازٍ - معدوم)</span>
                <span>90° (عمودي - أقصى حساسية)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {isAr ? 'تباعد ساقي الحاضنة:' : 'Yoke Pole Spacing:'}
                </label>
                <span className="font-mono text-sky-400 font-bold">{mtYokeSpacingMm} mm</span>
              </div>
              <input
                type="range"
                min={75}
                max={200}
                value={mtYokeSpacingMm}
                onChange={(e) => setMtYokeSpacingMm(parseInt(e.target.value) || 130)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>75 mm (فيض كثيف)</span>
                <span>200 mm (فيض مشتت)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141208] border border-[#3b3211] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                {isAr ? 'كفاءة تسرب الفيض المغناطيسي (MFL Efficiency):' : 'Flux Leakage Efficiency:'}
              </span>
              <span className="font-mono text-amber-400 font-black text-lg">
                {mtCalculations.leakageEfficiency.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-[#201d12] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${mtCalculations.leakageEfficiency}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-[#26210f]">
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'حالة الكشف عن العيب:' : 'Detectability:'}</span>
                <span className="font-bold text-white">{isAr ? mtCalculations.detectabilityStatusAr : mtCalculations.detectabilityStatusEn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'عمق التغلغل الفعال:' : 'Effective Skin Depth:'}</span>
                <span className="font-bold text-sky-300 font-mono">~{mtCalculations.skinDepthMm} mm</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'قوة الرفع المطلوبة للكود:' : 'Req Lifting Weight:'}</span>
                <span className="font-bold text-emerald-300 font-mono">{mtCalculations.liftingPowerReqKg} kg ({mtCurrentMode === 'AC' ? '10 lb' : '40 lb'})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RENDER: RT INVERSE SQUARE & SHIELDING LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-rt-shielding-lab' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="bg-[#0e1233] p-3 rounded-2xl border border-[#1e2759] space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-300">{isAr ? 'النشاطية (Curie):' : 'Activity (Ci):'}</label>
                <span className="font-mono text-emerald-400 font-bold">{rtActivityCi} Ci</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={rtActivityCi}
                onChange={(e) => setRtActivityCi(parseInt(e.target.value) || 50)}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="bg-[#0e1233] p-3 rounded-2xl border border-[#1e2759] space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-300">{isAr ? 'المسافة (Meters):' : 'Distance (m):'}</label>
                <span className="font-mono text-sky-400 font-bold">{rtDistanceMeters} m</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={rtDistanceMeters}
                onChange={(e) => setRtDistanceMeters(parseInt(e.target.value) || 8)}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="bg-[#0e1233] p-3 rounded-2xl border border-[#1e2759] space-y-1">
              <label className="text-xs font-bold text-slate-300 block">{isAr ? 'مادة التدريع:' : 'Shield Material:'}</label>
              <select
                value={rtShieldMaterial}
                onChange={(e) => setRtShieldMaterial(e.target.value as any)}
                className="w-full bg-[#141b44] border border-[#2b3977] rounded-xl py-1 px-2 text-xs text-white"
              >
                <option value="None">{isAr ? 'بدون تدريع (هواء فقط)' : 'None (Air only)'}</option>
                <option value="Lead">{isAr ? 'رصاص (Lead - HVL 4.8mm)' : 'Lead (HVL 4.8mm)'}</option>
                <option value="Concrete">{isAr ? 'خرسانة (Concrete - HVL 43mm)' : 'Concrete (HVL 43mm)'}</option>
              </select>
            </div>

            <div className="bg-[#0e1233] p-3 rounded-2xl border border-[#1e2759] space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-300">{isAr ? 'سماكة الدرع:' : 'Shield Thickness:'}</label>
                <span className="font-mono text-amber-400 font-bold">{rtShieldThicknessMm} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={rtShieldThicknessMm}
                onChange={(e) => setRtShieldThicknessMm(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className={`p-4 rounded-2xl border ${
              rtCalculations.isHazardous ? 'bg-rose-950/40 border-rose-500/50' : 'bg-emerald-950/40 border-emerald-500/50'
            }`}>
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'الجرعة عند موقع المفتش:' : 'Inspector Exposure Rate:'}</span>
              <span className={`text-2xl font-black font-mono ${rtCalculations.isHazardous ? 'text-rose-400' : 'text-emerald-400'}`}>
                {rtCalculations.doseRateMrHr.toFixed(2)} mR/hr
              </span>
              <span className="text-[10px] text-slate-400 block">({rtCalculations.doseRateUSvHr.toFixed(1)} µSv/hr)</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b1c2b] border border-[#1b3d5c]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'نصف قطر حزام العزل الآمن (2 mR/hr):' : 'Safe Barricade Radius (2 mR/h):'}</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{rtCalculations.safeDistanceMeters.toFixed(1)} meters</span>
              <span className="text-[10px] text-slate-400 block">{isAr ? 'مسافة وضع شريط التحذير' : 'Perimeter Warning Cordon'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b1c2b] border border-[#1b3d5c]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'حالة الأمان المهني:' : 'Occupational Safety:'}</span>
              <span className={`text-base font-bold ${rtCalculations.isHazardous ? 'text-rose-400' : 'text-emerald-400'}`}>
                {rtCalculations.isHazardous ? (isAr ? '⚠️ منطقة خطر (تتجاوز 2 mR/h)' : '⚠️ Radiation Hazard Zone') : (isAr ? '✓ منطقة آمنة للمشاة' : '✓ Safe Public Area')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RENDER: ET SKIN DEPTH LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-et-skin-depth' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'تردد الفحص (Frequency):' : 'Test Frequency:'}</label>
                <span className="font-mono text-amber-300 font-bold">{etFrequencyKhz} kHz</span>
              </div>
              <input
                type="range"
                min={1}
                max={1000}
                value={etFrequencyKhz}
                onChange={(e) => setEtFrequencyKhz(parseInt(e.target.value) || 100)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 kHz (تغلغل عميق)</span>
                <span>1000 kHz (سطحي فائق)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'التوصيلية الكهربائية (% IACS):' : 'Conductivity (% IACS):'}</label>
                <span className="font-mono text-sky-400 font-bold">{etConductivityIacs}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={etConductivityIacs}
                onChange={(e) => setEtConductivityIacs(parseInt(e.target.value) || 30)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1% (تيتانيوم/ستانلس)</span>
                <span>100% (نحاس نقي)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'النفاذية المغناطيسية (μ_r):' : 'Relative Permeability:'}</label>
                <span className="font-mono text-emerald-400 font-bold">{etRelativePerm}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={etRelativePerm}
                onChange={(e) => setEtRelativePerm(parseInt(e.target.value) || 1)}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (غير مغناطيسي)</span>
                <span>100 (فولاذ مغناطيسي)</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-[#171408] border border-[#3d3311]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'عمق التغلغل القياسي (Standard Depth δ):' : 'Standard Depth of Penetration (δ):'}</span>
              <span className="text-3xl font-black text-amber-300 font-mono">{etCalculations.deltaMm.toFixed(3)} mm</span>
              <span className="text-[10px] text-slate-400 block">{isAr ? 'تنخفض كثافة التيار هنا إلى 37%' : 'Current density drops to 37%'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#171408] border border-[#3d3311]">
              <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'العمق الفعال الأقصى للكشف (3δ):' : 'Effective Depth Limit (3δ):'}</span>
              <span className="text-3xl font-black text-sky-400 font-mono">{etCalculations.effectiveDepth3DeltaMm.toFixed(3)} mm</span>
              <span className="text-[10px] text-slate-400 block">{isAr ? 'أقصى عمق يمكن كشف الشقوق عنده' : 'Threshold for detectable flaw response'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. RENDER: VT OPTICS LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-vt-optics-lab' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'المسافة عن السطح (Distance):' : 'Eye-to-Surface Distance:'}</label>
                <span className="font-mono text-cyan-400 font-bold">{vtDistanceInches} in</span>
              </div>
              <input
                type="range"
                min={5}
                max={36}
                value={vtDistanceInches}
                onChange={(e) => setVtDistanceInches(parseInt(e.target.value) || 18)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5 in</span>
                <span>الحد الأقصى (24 in)</span>
                <span>36 in</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'زاوية الرؤية (Viewing Angle):' : 'Line-of-Sight Angle:'}</label>
                <span className="font-mono text-amber-400 font-bold">{vtAngleDegrees}°</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={vtAngleDegrees}
                onChange={(e) => setVtAngleDegrees(parseInt(e.target.value) || 45)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>الحد الأدنى (30°)</span>
                <span>45°</span>
                <span>90° (عمودي)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'شدة الإضاءة (Illumination):' : 'Light Intensity:'}</label>
                <span className="font-mono text-emerald-400 font-bold">{vtIlluminationLux} Lux</span>
              </div>
              <input
                type="range"
                min={200}
                max={2500}
                value={vtIlluminationLux}
                onChange={(e) => setVtIlluminationLux(parseInt(e.target.value) || 1250)}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>200 Lux</span>
                <span>الحد الأدنى (1076 Lux)</span>
                <span>2500 Lux</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#091a24] border border-[#1a394d] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${vtCompliance.isAllPass ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
              <div>
                <span className="text-xs text-slate-300 block">
                  {isAr ? 'الامتثال لكود ASME Section V Article 9:' : 'ASME Sec V Article 9 Status:'}
                </span>
                <span className={`text-base font-black ${vtCompliance.isAllPass ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {vtCompliance.isAllPass ? (isAr ? '✓ فحص متوافق ومعتمد قانونياً' : '✓ Full Code Compliance') : (isAr ? '✕ غير متوافق - يُلغى التفتيش' : '✕ Non-Compliant Inspection')}
                </span>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-mono">
              <span className={vtCompliance.isDistCompliant ? 'text-emerald-400' : 'text-rose-400'}>
                Distance: {vtCompliance.isDistCompliant ? 'PASS' : 'FAIL (>24")'}
              </span>
              <span className={vtCompliance.isAngleCompliant ? 'text-emerald-400' : 'text-rose-400'}>
                Angle: {vtCompliance.isAngleCompliant ? 'PASS' : 'FAIL (<30°)'}
              </span>
              <span className={vtCompliance.isLightCompliant ? 'text-emerald-400' : 'text-rose-400'}>
                Light: {vtCompliance.isLightCompliant ? 'PASS' : 'FAIL (<1076 Lux)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. RENDER: MATERIALS PHASE LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-materials-phase-lab' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'درجة الحرارة (Temperature °C):' : 'Temperature (°C):'}</label>
                <span className="font-mono text-orange-400 font-bold">{matTempC} °C</span>
              </div>
              <input
                type="range"
                min={20}
                max={1100}
                value={matTempC}
                onChange={(e) => setMatTempC(parseInt(e.target.value) || 750)}
                className="w-full accent-orange-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>20°C (غرفة)</span>
                <span>PWHT (595-650°C)</span>
                <span>A1 (727°C)</span>
                <span>1100°C</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'نسبة الكربون في الصلب (Carbon %):' : 'Carbon Content (% C):'}</label>
                <span className="font-mono text-amber-400 font-bold">{matCarbonPct}% C</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.05}
                value={matCarbonPct}
                onChange={(e) => setMatCarbonPct(parseFloat(e.target.value) || 0.35)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.15% (صلب خفيف)</span>
                <span>0.8% (يوتكتويد Eutectoid)</span>
                <span>1.5% (عالي الكربون)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1c0f06] border border-[#4d250c] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold">{isAr ? 'الطور المجهري المستقر حالياً:' : 'Equilibrium Microstructure:'}</span>
              <span className="font-mono text-orange-400 font-bold text-xs bg-[#2e1507] px-2 py-0.5 rounded">
                {matPhaseInfo.lattice}
              </span>
            </div>
            <p className="text-sm font-black text-amber-200">
              {isAr ? matPhaseInfo.phaseAr : matPhaseInfo.phaseEn}
            </p>
            {matPhaseInfo.isPwhtZone && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{isAr ? '★ نطاق المعالجة الحرارية بعد اللحام PWHT لتخفيف الإجهادات المتبقية!' : '★ PWHT Stress Relief Temperature Window!'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. RENDER: PAUT BEAM STEERING & DELAY LAWS SIMULATOR */}
      {/* ========================================================================= */}
      {experimentId === 'exp-paut-beam-steering' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'زاوية التوجيه الإلكتروني (Steering Angle):' : 'Steering Angle (θ):'}</label>
                <span className="font-mono text-amber-400 font-bold">{pautSteerAngle > 0 ? `+${pautSteerAngle}` : pautSteerAngle}°</span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                value={pautSteerAngle}
                onChange={(e) => setPautSteerAngle(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-30°</span>
                <span>0° (تعامد)</span>
                <span>+30°</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'عمق البؤرة الهندسية (Focal Depth):' : 'Focal Depth (F):'}</label>
                <span className="font-mono text-sky-400 font-bold">{pautFocalDepthMm} mm</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={pautFocalDepthMm}
                onChange={(e) => setPautFocalDepthMm(parseInt(e.target.value) || 30)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 mm</span>
                <span>35 mm</span>
                <span>60 mm</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="font-bold text-slate-200 text-xs block">{isAr ? 'عدد عناصر المصفوفة النشطة (Active Elements):' : 'Active Elements Aperture:'}</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[16, 32].map((elCount) => (
                  <button
                    key={elCount}
                    onClick={() => setPautElementCount(elCount)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-mono font-bold transition ${
                      pautElementCount === elCount
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-[#101538] text-slate-400 border-[#20295e] hover:text-white'
                    }`}
                  >
                    {elCount} Elements
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block pt-1">
                {isAr ? `فتحة الإرسال الكلية: ${pautCalculations.apertureWidthMm.toFixed(1)} ملم` : `Total Aperture: ${pautCalculations.apertureWidthMm.toFixed(1)} mm`}
              </span>
            </div>
          </div>

          {/* Visual Phased Array Wavefront Synthesis Canvas/SVG */}
          <div className="bg-[#050716] border border-[#1f285e] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-[#1b224d] pb-2">
              <span className="font-bold text-slate-300">{isAr ? 'مخطط تأخيرات الإطلاق (Focal Law Delays) وتجمع جبهة الموجة:' : 'Phased Array Delay Laws & Wavefront Convergence:'}</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">{pautCalculations.maxDelayNs} ns max delay</span>
            </div>

            <div className="relative h-44 w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#090e29] to-[#040612] rounded-xl border border-[#18204d]">
              {/* Piezoelectric Element Strip at the top */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: pautElementCount }).map((_, idx) => {
                  const delayFraction = Math.abs(idx - pautElementCount / 2) / (pautElementCount / 2);
                  return (
                    <div
                      key={idx}
                      className="w-1.5 sm:w-2 h-5 rounded-xs transition-colors duration-300"
                      style={{
                        backgroundColor: pautSteerAngle >= 0 
                          ? `rgb(${Math.round(245 - idx * 5)}, ${Math.round(158 + idx * 3)}, 11)`
                          : `rgb(${Math.round(11 + idx * 7)}, ${Math.round(180 - idx * 3)}, 245)`
                      }}
                      title={`Element #${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Synthesized Directed Ultrasonic Acoustic Beam */}
              <div
                className="absolute top-8 left-1/2 -translate-x-1/2 origin-top transition-all duration-300 flex flex-col items-center"
                style={{
                  transform: `translateX(-50%) rotate(${pautSteerAngle}deg)`,
                  height: `${Math.min(130, pautFocalDepthMm * 2.2)}px`
                }}
              >
                {/* Acoustic focal cone */}
                <div 
                  className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[110px] border-l-transparent border-r-transparent border-t-amber-400/30 opacity-70"
                />
                <div 
                  className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-ping"
                  title="Focal Point"
                />
              </div>

              <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                Beam Waist: ~{pautCalculations.beamWaistMm.toFixed(2)} mm
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#0c102a] border border-[#1b2354]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'عرض الحزمة عند البؤرة' : 'Focal Waist'}</span>
                <span className="font-mono text-amber-300 font-bold">{pautCalculations.beamWaistMm.toFixed(2)} mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0c102a] border border-[#1b2354]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'طول المنطقة القريبة N' : 'Near Field N'}</span>
                <span className="font-mono text-sky-300 font-bold">{pautCalculations.nearFieldMm.toFixed(1)} mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0c102a] border border-[#1b2354]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الطول الموجي λ' : 'Wavelength λ'}</span>
                <span className="font-mono text-emerald-300 font-bold">{pautCalculations.lambdaMm.toFixed(2)} mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0c102a] border border-[#1b2354]">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'أقصى تأخير زمني' : 'Max Aperture Delay'}</span>
                <span className="font-mono text-orange-400 font-bold">{pautCalculations.maxDelayNs} ns</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. RENDER: TOFD DIFFRACTION LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-tofd-diffraction-lab' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'المسافة بين المجسين (PCS):' : 'Probe Center Separation (PCS):'}</label>
                <span className="font-mono text-amber-400 font-bold">{tofdPcsMm} mm</span>
              </div>
              <input
                type="range"
                min={60}
                max={160}
                value={tofdPcsMm}
                onChange={(e) => setTofdPcsMm(parseInt(e.target.value) || 110)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Half PCS (s) = {tofdCalculations.s.toFixed(1)} mm</span>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'عمق الشق من السطح (Flaw Depth):' : 'Flaw Depth (d₁):'}</label>
                <span className="font-mono text-sky-400 font-bold">{tofdFlawDepthMm} mm</span>
              </div>
              <input
                type="range"
                min={3}
                max={tofdPlateThicknessMm - 3}
                value={tofdFlawDepthMm}
                onChange={(e) => setTofdFlawDepthMm(parseInt(e.target.value) || 12)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Plate Thickness: {tofdPlateThicknessMm} mm</span>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'ارتفاع الشق الشاقولي (Flaw Height):' : 'Through-Wall Height (Δd):'}</label>
                <span className="font-mono text-emerald-400 font-bold">{tofdFlawHeightMm} mm</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={tofdFlawHeightMm}
                onChange={(e) => setTofdFlawHeightMm(parseInt(e.target.value) || 4)}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Lower Tip d₂ = {tofdCalculations.d2.toFixed(1)} mm</span>
            </div>
          </div>

          {/* Synthetic TOFD A-Scan Oscillogram with Phase Inversion */}
          <div className="bg-[#060817] border border-[#1f285e] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-[#1b224d] pb-2">
              <span className="font-bold text-slate-300">{isAr ? 'مخطط الإشارة الصوتية (TOFD RF A-Scan) مع انقلاب طور قمة الشق:' : 'TOFD RF Signal with Upper Tip Phase Inversion:'}</span>
              <span className="font-mono text-amber-400 text-xs">c = 5920 m/s (Steel Long.)</span>
            </div>

            {/* Simulated Oscilloscope Waveform Display */}
            <div className="relative h-44 bg-black/50 rounded-xl p-3 border border-[#1b2352] flex flex-col justify-center overflow-hidden">
              {/* Zero Volts Center Line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/60" />

              {/* Signals along time axis */}
              <div className="relative h-28 flex items-center justify-between px-4 sm:px-10">
                {/* 1. Lateral Wave Signal (Positive initial phase) */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-mono text-sky-400 font-bold mb-1">
                    {isAr ? 'الموجة الجانبية LW' : 'Lateral Wave (LW)'}
                  </div>
                  <div className="w-8 h-16 flex items-center justify-center">
                    <span className="font-mono font-black text-xs text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-400/40">
                      +{tofdCalculations.tLateralUs.toFixed(2)} µs
                    </span>
                  </div>
                  <span className="text-[9px] text-sky-300/80 font-mono">Phase (+)</span>
                </div>

                {/* 2. Upper Tip Diffraction Signal (PHASE INVERTED!) */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-mono text-rose-400 font-bold mb-1">
                    {isAr ? 'حيود القمة العلوية' : 'Upper Tip (Inverted)'}
                  </div>
                  <div className="w-8 h-16 flex items-center justify-center">
                    <span className="font-mono font-black text-xs text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-400/40">
                      -{tofdCalculations.tUpperTipUs.toFixed(2)} µs
                    </span>
                  </div>
                  <span className="text-[9px] text-rose-300/90 font-mono font-bold">Phase (-) Inverted</span>
                </div>

                {/* 3. Lower Tip Diffraction Signal */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                    {isAr ? 'حيود القاع السفلي' : 'Lower Tip'}
                  </div>
                  <div className="w-8 h-16 flex items-center justify-center">
                    <span className="font-mono font-black text-xs text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-400/40">
                      +{tofdCalculations.tLowerTipUs.toFixed(2)} µs
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-300/80 font-mono">Phase (+)</span>
                </div>

                {/* 4. Backwall Reflection Echo */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">
                    {isAr ? 'صدى الجدار الخلفي BW' : 'Backwall Echo (BW)'}
                  </div>
                  <div className="w-8 h-16 flex items-center justify-center">
                    <span className="font-mono font-black text-xs text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-400/40">
                      -{tofdCalculations.tBackwallUs.toFixed(2)} µs
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-300/80 font-mono">Phase (-)</span>
                </div>
              </div>
            </div>

            {/* Mathematical Sizing Card */}
            <div className="p-3.5 rounded-xl bg-[#0f1438] border border-[#232d69] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'العمق المحسوب رياضياً من زمن الوصول d:' : 'Calculated Depth from Time of Flight d:'}</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  d = {tofdCalculations.calculatedDepthMm.toFixed(2)} mm
                </span>
              </div>
              <div className="text-end space-y-0.5">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الارتفاع الحقيقي للشق Δd:' : 'Through-Wall Flaw Height:'}</span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  Δd = {tofdFlawHeightMm.toFixed(2)} mm (دقة ±0.3 mm)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. RENDER: WELDING FLAW EVALUATOR */}
      {/* ========================================================================= */}
      {experimentId === 'exp-welding-flaw-evaluator' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Standard Selection */}
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="font-bold text-slate-200 text-xs block">{isAr ? 'الكود القياسي الحاكم:' : 'Governing Standard Code:'}</label>
              <select
                value={weldStandard}
                onChange={(e) => setWeldStandard(e.target.value as any)}
                className="w-full bg-[#141a45] border border-[#253278] text-amber-300 text-xs rounded-xl p-2.5 font-bold cursor-pointer"
              >
                <option value="ASME_SEC_VIII">ASME Sec VIII Div 1 (UW-51)</option>
                <option value="ASME_B31_3">ASME B31.3 (Process Piping)</option>
                <option value="AWS_D1_1">AWS D1.1 (Structural Steel)</option>
              </select>
            </div>

            {/* Thickness */}
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'سماكة الجدار (t):' : 'Weld Thickness (t):'}</label>
                <span className="font-mono text-sky-400 font-bold">{weldThicknessMm} mm</span>
              </div>
              <input
                type="range"
                min={6}
                max={40}
                value={weldThicknessMm}
                onChange={(e) => setWeldThicknessMm(parseInt(e.target.value) || 16)}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Flaw Type */}
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="font-bold text-slate-200 text-xs block">{isAr ? 'نوع عيب اللحام:' : 'Discontinuity Type:'}</label>
              <select
                value={weldFlawType}
                onChange={(e) => setWeldFlawType(e.target.value as any)}
                className="w-full bg-[#141a45] border border-[#253278] text-slate-200 text-xs rounded-xl p-2.5 font-bold cursor-pointer"
              >
                <option value="crack">{isAr ? 'شرخ سطحي أو عميق (Crack)' : 'Crack (Surface/Internal)'}</option>
                <option value="lack_of_fusion">{isAr ? 'نقص انصهار (Lack of Fusion)' : 'Lack of Fusion (LOF)'}</option>
                <option value="incomplete_penetration">{isAr ? 'نقص اختراق الجذور (LOP)' : 'Incomplete Penetration (LOP)'}</option>
                <option value="elongated_slag">{isAr ? 'خبث لحام متطاول (Slag Line)' : 'Elongated Slag Inclusion'}</option>
                <option value="isolated_porosity">{isAr ? 'مسامية كروية منعزلة (Porosity)' : 'Isolated Gas Porosity'}</option>
              </select>
            </div>

            {/* Flaw Length */}
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'طول الدلالة / البعد:' : 'Indication Length:'}</label>
                <span className="font-mono text-amber-400 font-bold">{weldFlawLengthMm} mm</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={20}
                step={0.5}
                value={weldFlawLengthMm}
                onChange={(e) => setWeldFlawLengthMm(parseFloat(e.target.value) || 4.5)}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Instant Engineering Code Acceptance Verdict Card */}
          <div className={`p-5 rounded-2xl border-2 space-y-3 transition-all ${
            weldEvaluation.isAccepted
              ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/70 text-rose-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-current/20">
              <div className="flex items-center gap-2">
                {weldEvaluation.isAccepted ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-base font-black">
                    {weldEvaluation.isAccepted 
                      ? (isAr ? 'مقبول هندسياً طبقاً للمواصفة (ACCEPTABLE)' : 'CODE COMPLIANT (ACCEPTABLE)') 
                      : (isAr ? 'مرفوض هندسياً طبقاً للمواصفة (REJECTABLE)' : 'NON-COMPLIANT (REJECTABLE)')}
                  </h4>
                  <span className="text-[11px] font-mono opacity-80 block">
                    {weldEvaluation.standardClause}
                  </span>
                </div>
              </div>

              <div className="text-end font-mono text-xs">
                <span className="block opacity-80">{isAr ? 'الحد الأقصى المسموح:' : 'Allowable Limit:'}</span>
                <span className="font-bold text-sm">
                  {weldEvaluation.maxAllowedLengthMm > 0 ? `${weldEvaluation.maxAllowedLengthMm.toFixed(1)} mm` : (isAr ? 'صفر (حظر مطلق)' : 'Zero tolerance')}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed font-sans">
              {isAr ? weldEvaluation.explanationAr : weldEvaluation.explanationEn}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. RENDER: AE KAISER & FELICITY RATIO LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-ae-kaiser-felicity' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'أقصى حمل سابق مسلط (Prior Peak):' : 'Previous Max Load (P_prev):'}</label>
                <span className="font-mono text-amber-400 font-bold">{aePreviousMaxLoadKn} kN</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                value={aePreviousMaxLoadKn}
                onChange={(e) => setAePreviousMaxLoadKn(parseInt(e.target.value) || 100)}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'الحمل الحالي المطبق (Current Load):' : 'Current Applied Load (P):'}</label>
                <span className="font-mono text-sky-400 font-bold">{aeCurrentLoadKn} kN</span>
              </div>
              <input
                type="range"
                min={20}
                max={220}
                value={aeCurrentLoadKn}
                onChange={(e) => setAeCurrentLoadKn(parseInt(e.target.value) || 85)}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="font-bold text-slate-200 text-xs block">{isAr ? 'حالة التلف الميكانيكي للهيكل:' : 'Structural Damage Condition:'}</label>
              <select
                value={aeMaterialCondition}
                onChange={(e) => setAeMaterialCondition(e.target.value as any)}
                className="w-full bg-[#141a45] border border-[#253278] text-amber-300 text-xs rounded-xl p-2.5 font-bold cursor-pointer"
              >
                <option value="sound">{isAr ? 'سليم تماماً (تأثير كايزر Kaiser)' : 'Sound Material (Kaiser Valid)'}</option>
                <option value="microcracking">{isAr ? 'تطور تشققات مجهرية (Felicity < 1)' : 'Microcracking (Felicity Ratio < 1)'}</option>
                <option value="severe_flaw">{isAr ? 'شرخ نشط حرج (Severe Propagation)' : 'Severe Flaw (Felicity Ratio ~ 0.7)'}</option>
              </select>
            </div>
          </div>

          {/* Diagnostic Display Card */}
          <div className="bg-[#070a1c] border border-[#1d265a] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b224d] pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{isAr ? 'نسبة التحميل الحاكمة (Felicity Ratio):' : 'Governing Felicity Ratio (FR):'}</span>
                <span className={`text-xl font-mono font-black ${aeCalculations.felicityRatio >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  FR = {aeCalculations.felicityRatio.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0d1233] border border-[#1e285a] text-center">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'حمل بدء الانبعاثات' : 'Emission Onset'}</span>
                  <span className="font-mono text-amber-300 font-bold text-xs">{aeCalculations.emissionOnsetLoadKn.toFixed(1)} kN</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0d1233] border border-[#1e285a] text-center">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'الضربات الصوتية المتراكمة' : 'Cumulative Hits'}</span>
                  <span className="font-mono text-sky-300 font-bold text-xs">{aeCalculations.cumulativeHits} Hits</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              aeCalculations.felicityRatio >= 1.0
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
            }`}>
              {aeCalculations.felicityRatio >= 1.0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                {isAr ? aeCalculations.statusDiagnosisAr : aeCalculations.statusDiagnosisEn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. RENDER: HELIUM LEAK DETECTOR LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-lt-vacuum-leak' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'مستوى التخلخل (Vacuum Pressure):' : 'System Vacuum:'}</label>
                <span className="font-mono text-amber-400 font-bold">10^{ltVacuumLevelExponent} mbar</span>
              </div>
              <input
                type="range"
                min={-7}
                max={-2}
                step={1}
                value={ltVacuumLevelExponent}
                onChange={(e) => setLtVacuumLevelExponent(parseInt(e.target.value) || -5)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">High Vacuum Range</span>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'قطر ثقب التسريب (Orifice Diameter):' : 'Leak Orifice Diameter:'}</label>
                <span className="font-mono text-sky-400 font-bold">{ltOrificeDiameterUm} µm</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={ltOrificeDiameterUm}
                onChange={(e) => setLtOrificeDiameterUm(parseFloat(e.target.value) || 3.5)}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="font-bold text-slate-200 text-xs block">{isAr ? 'الغاز المتبع (Tracer Gas):' : 'Tracer Gas Selection:'}</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(['helium', 'air'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setLtTracerGas(g)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition ${
                      ltTracerGas === g
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-[#101538] text-slate-400 border-[#20295e] hover:text-white'
                    }`}
                  >
                    {g === 'helium' ? 'Helium (He-4)' : 'Air (N2/O2)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mass Spectrometer Readout Console */}
          <div className="bg-[#050716] border border-[#1f285e] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b224d] pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{isAr ? 'معدل التسريب الحقيقي المقاس (Leak Rate Q):' : 'Measured Leak Rate (Q):'}</span>
                <span className="text-xl font-mono font-black text-amber-300">
                  {ltCalculations.actualLeakRate.toExponential(2)} mbar·L/s
                </span>
              </div>

              <div className="text-end font-mono text-xs">
                <span className="block text-slate-400 text-[10px]">{isAr ? 'حد القبول المعياري ASME Sec V:' : 'ASME Pass Criteria:'}</span>
                <span className="font-bold text-sky-300">&lt; 1.00e-6 mbar·L/s</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0c102b] border border-[#1c2454] space-y-1">
                <span className="text-slate-400 text-[10px] block">{isAr ? 'نمط التدفق الفيزيائي (Flow Regime):' : 'Flow Regime:'}</span>
                <span className="font-bold text-slate-200">
                  {ltCalculations.isMolecularFlow 
                    ? (isAr ? 'تدفق جزيئي حر (Molecular Flow Kn > 1) - خاضع لقانون غراهام' : 'Molecular Flow (Kn > 1) - Governed by Graham’s Law')
                    : (isAr ? 'تدفق انتقالي لزج (Viscous / Transitional)' : 'Viscous / Transitional Flow')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c102b] border border-[#1c2454] space-y-1">
                <span className="text-slate-400 text-[10px] block">{isAr ? 'ميزة سرعة نفاذ الهيليوم:' : 'Helium Kinetic Advantage:'}</span>
                <span className="font-bold text-emerald-300">
                  {ltTracerGas === 'helium' 
                    ? (isAr ? `ينفذ أسرع بـ ${ltCalculations.molecularFlowMultiplier.toFixed(2)}x ضعف مقارنة بالهواء` : `Passes ${ltCalculations.molecularFlowMultiplier.toFixed(2)}x faster than ambient air`)
                    : (isAr ? 'الغاز المرجعي (هواء محيط)' : 'Baseline air')}
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              ltCalculations.isAcceptable
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {ltCalculations.isAcceptable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="font-bold text-xs sm:text-sm">
                  {ltCalculations.isAcceptable 
                    ? (isAr ? 'مطابق لمعايير الإحكام والتسريب (Tight & Acceptable)' : 'LEAK RATE COMPLIANT (PASSED)') 
                    : (isAr ? 'تسريب غير مقبول هندسياً (Excessive Leakage Detected)' : 'EXCESSIVE LEAKAGE (FAILED)')}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-amber-300">
                ASME Sec V Art 10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. RENDER: IRT STEFAN-BOLTZMANN & EMISSIVITY LAB */}
      {/* ========================================================================= */}
      {experimentId === 'exp-irt-blackbody-emissivity' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'درجة حرارة السطح الحقيقية (True Temp):' : 'True Surface Temperature:'}</label>
                <span className="font-mono text-amber-400 font-bold">{irtObjectTempC}°C</span>
              </div>
              <input
                type="range"
                min={20}
                max={350}
                value={irtObjectTempC}
                onChange={(e) => setIrtObjectTempC(parseInt(e.target.value) || 85)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">T = {irtCalculations.tempKelvin.toFixed(1)} K</span>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'معامل الانبعاثية السطحية (Emissivity ε):' : 'Surface Emissivity (ε):'}</label>
                <span className="font-mono text-rose-400 font-bold">{irtEmissivity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={irtEmissivity}
                onChange={(e) => setIrtEmissivity(parseFloat(e.target.value) || 0.85)}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.1 (ألومنيوم مصقول)</span>
                <span>0.95 (مطاط/طلاء)</span>
              </div>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'حرارة الانعكاس المحيطية (Reflected Temp):' : 'Reflected Ambient Temp:'}</label>
                <span className="font-mono text-sky-400 font-bold">{irtReflectedAmbientTempC}°C</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={irtReflectedAmbientTempC}
                onChange={(e) => setIrtReflectedAmbientTempC(parseInt(e.target.value) || 25)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Background Reflection</span>
            </div>
          </div>

          {/* Radiation Physics Radiance Display */}
          <div className="bg-[#050716] border border-[#1f285e] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b224d] pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{isAr ? 'طول موجة الذروة الإشعاعية (قانون فين):' : 'Peak Emission Wavelength (Wien):'}</span>
                <span className="text-xl font-mono font-black text-rose-400">
                  λ_max = {irtCalculations.lambdaMaxUm.toFixed(2)} µm (نطاق LWIR)
                </span>
              </div>

              <div className="text-end font-mono text-xs">
                <span className="block text-slate-400 text-[10px]">{isAr ? 'إجمالي الفيض المشع (Stefan-Boltzmann):' : 'Total Radiated Power E:'}</span>
                <span className="font-bold text-amber-300 text-sm">{irtCalculations.emittedPowerWm2.toFixed(1)} W/m²</span>
              </div>
            </div>

            {/* Error Analysis Card: What happens without emissivity correction */}
            <div className="p-4 rounded-xl bg-[#0c102a] border border-[#1d275a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{isAr ? 'قراءة الكاميرا غير المعوَّضة (لو ضُبطت على ε = 1.0):' : 'Apparent Uncompensated Camera Reading (at ε = 1.0):'}</span>
                <span className="font-mono text-orange-400 font-bold text-sm">{irtCalculations.apparentUncompensatedC.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-[#1a234f] pt-2">
                <span className="text-slate-400">{isAr ? 'خطأ القياس الحراري الناتج عن تجاهل الانبعاثية:' : 'Thermal Error caused by uncalibrated emissivity:'}</span>
                <span className={`font-mono font-bold ${irtCalculations.measurementErrorC > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ΔError = ±{irtCalculations.measurementErrorC.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. RENDER: IRT ELECTRICAL HOTSPOT EVALUATOR */}
      {/* ========================================================================= */}
      {experimentId === 'exp-irt-electrical-hotspot' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'حرارة النقطة الساخنة المفحوصة:' : 'Hotspot Measured Temp:'}</label>
                <span className="font-mono text-rose-400 font-bold">{irtComponentTempC}°C</span>
              </div>
              <input
                type="range"
                min={35}
                max={130}
                value={irtComponentTempC}
                onChange={(e) => setIrtComponentTempC(parseInt(e.target.value) || 68)}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Component Under Inspection</span>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-200">{isAr ? 'حرارة المرجع الطبيعي (الطور المجاور):' : 'Baseline Reference Phase Temp:'}</label>
                <span className="font-mono text-sky-400 font-bold">{irtReferenceTempC}°C</span>
              </div>
              <input
                type="range"
                min={25}
                max={60}
                value={irtReferenceTempC}
                onChange={(e) => setIrtReferenceTempC(parseInt(e.target.value) || 36)}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Normal Reference Baseline</span>
            </div>

            <div className="bg-[#0e1233] p-4 rounded-2xl border border-[#1e2759] space-y-2">
              <label className="font-bold text-slate-200 text-xs block">{isAr ? 'نوع المعدة الكهربائية:' : 'Electrical Asset Type:'}</label>
              <select
                value={irtComponentType}
                onChange={(e) => setIrtComponentType(e.target.value as any)}
                className="w-full bg-[#141a45] border border-[#253278] text-amber-300 text-xs rounded-xl p-2.5 font-bold cursor-pointer"
              >
                <option value="terminal_lug">{isAr ? 'كبل توصيل / كليمة (Cable Lug)' : 'Cable Terminal Lug'}</option>
                <option value="busbar_joint">{isAr ? 'وصلة قضبان توزيع (Busbar Joint)' : 'Bolted Busbar Joint'}</option>
                <option value="circuit_breaker">{isAr ? 'قاطع تيار رئيسي (Molded Case CB)' : 'Circuit Breaker Contact'}</option>
                <option value="transformer_bushing">{isAr ? 'جلبة محول قدرة (Transformer Bushing)' : 'Transformer Bushing'}</option>
              </select>
            </div>
          </div>

          {/* Severity Evaluation Card per NETA / NFPA 70B */}
          <div className={`p-5 rounded-2xl border-2 space-y-3 transition-all ${
            irtHotspotSeverity.severityLevel === 'normal' || irtHotspotSeverity.severityLevel === 'advisory'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : irtHotspotSeverity.severityLevel === 'intermediate'
              ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
              : 'bg-rose-950/40 border-rose-500/80 text-rose-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-current/20">
              <div className="flex items-center gap-2.5">
                {irtHotspotSeverity.severityLevel === 'normal' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-base font-black">
                    {irtHotspotSeverity.severityLevel === 'normal' && (isAr ? 'فروق حرارية متوازنة وسليمة' : 'NORMAL / BENIGN THERMAL BALANCE')}
                    {irtHotspotSeverity.severityLevel === 'advisory' && (isAr ? 'تنبيه استشاري طفيف (ADVISORY)' : 'ADVISORY NOTICE (MINOR HOTSPOT)')}
                    {irtHotspotSeverity.severityLevel === 'intermediate' && (isAr ? 'خلل حراري متوسط (MODERATE)' : 'MODERATE DEFICIENCY (ATTENTION REQ.)')}
                    {irtHotspotSeverity.severityLevel === 'serious' && (isAr ? 'خلل جسيم عالي الخطورة (SERIOUS)' : 'SERIOUS DEFICIENCY (PROMPT ACTION)')}
                    {irtHotspotSeverity.severityLevel === 'critical' && (isAr ? 'خطر حرج وداهم (CRITICAL EMERGENCY)' : 'CRITICAL EMERGENCY (IMMEDIATE TRIP)')}
                  </h4>
                  <span className="text-[11px] font-mono opacity-80 block">
                    {irtHotspotSeverity.standardCodeCitation}
                  </span>
                </div>
              </div>

              <div className="text-end font-mono">
                <span className="block text-[10px] opacity-80">{isAr ? 'الفارق الحراري النسبي ΔT:' : 'Relative Delta-T:'}</span>
                <span className="font-black text-base text-amber-300">
                  ΔT = +{irtHotspotSeverity.deltaTC.toFixed(1)}°C
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold leading-relaxed font-sans">
              {isAr ? irtHotspotSeverity.correctiveActionAr : irtHotspotSeverity.correctiveActionEn}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
