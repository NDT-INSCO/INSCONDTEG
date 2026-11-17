import React, { useMemo, useRef, useState } from 'react';
import { geoGraticule, geoMercator, geoPath } from 'd3';
import {
  Compass,
  Crosshair,
  Flame,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '../../types';
import { useTheme } from '../../utils/themeStore';
import {
  GIZA_DEPOT_COORDINATES,
  INSCO_REGIONAL_SITES,
  REGIONAL_HYDRO_COLLECTION,
  REGIONAL_LANDMASS_COLLECTION,
  REGIONAL_VIEWPORT_PRESETS,
  RegionalSiteCategory,
  RegionalSiteNode,
  RegionalViewportPresetId,
  TOTAL_OWNED_PWHT_UNITS,
  UNIT_POWER_KW,
  calculateMobilizationDistanceKm,
  getRegionalCategoryLabel,
} from '../../data/inscoRegionalMapData';

interface CompanyRegionalFleetMapProps {
  language: Language;
  onSelectNdtMethod?: (methodCode: string) => void;
  onNavigateToAcademyModule?: (subTab: string) => void;
}

type MapFilterId = 'all' | 'pwht_active' | RegionalSiteCategory;

interface ProjectedPin {
  site: RegionalSiteNode;
  anchorX: number;
  anchorY: number;
  displayX: number;
  displayY: number;
  displaced: boolean;
}

const SVG_WIDTH = 820;
const SVG_HEIGHT = 490;
const MIN_SCALE = 650;
const MAX_SCALE = 28000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Resolves marker overlaps deterministically so closely spaced industrial sites
 * (e.g., Greater Cairo & Nile Delta at wide regional zoom) remain individually
 * clickable while keeping a crisp leader line to their true geographic coordinate.
 */
function resolvePinCollisions(
  rawPins: { site: RegionalSiteNode; anchorX: number; anchorY: number }[],
  minDist = 30
): ProjectedPin[] {
  const nodes = rawPins.map((p, idx) => {
    // Small deterministic initial angle offset so identical/near-identical points separate cleanly
    const angle = (idx * 2.39996) % (Math.PI * 2);
    return {
      ...p,
      displayX: p.anchorX + Math.cos(angle) * 0.5,
      displayY: p.anchorY + Math.sin(angle) * 0.5,
    };
  });

  for (let iter = 0; iter < 18; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.displayX - a.displayX;
        const dy = b.displayY - a.displayY;
        const dist = Math.hypot(dx, dy) || 0.01;
        if (dist < minDist) {
          const push = (minDist - dist) * 0.52;
          const ux = dx / dist;
          const uy = dy / dist;
          a.displayX -= ux * push;
          a.displayY -= uy * push;
          b.displayX += ux * push;
          b.displayY += uy * push;
        }
      }
    }
    // Gentle spring pull back toward true geographic anchor + viewport padding clamp
    for (const node of nodes) {
      node.displayX += (node.anchorX - node.displayX) * 0.12;
      node.displayY += (node.anchorY - node.displayY) * 0.12;
      node.displayX = clamp(node.displayX, 28, SVG_WIDTH - 28);
      node.displayY = clamp(node.displayY, 28, SVG_HEIGHT - 28);
    }
  }

  return nodes.map((n) => ({
    ...n,
    displaced: Math.hypot(n.displayX - n.anchorX, n.displayY - n.anchorY) > 6,
  }));
}

export const CompanyRegionalFleetMap: React.FC<CompanyRegionalFleetMapProps> = ({
  language,
  onSelectNdtMethod,
  onNavigateToAcademyModule,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  const defaultPreset =
    REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === 'all_footprint') ?? REGIONAL_VIEWPORT_PRESETS[0];

  const [activePresetId, setActivePresetId] = useState<RegionalViewportPresetId>(defaultPreset.id);
  const [center, setCenter] = useState<[number, number]>(defaultPreset.center);
  const [scale, setScale] = useState<number>(defaultPreset.scale);
  const [activeFilter, setActiveFilter] = useState<MapFilterId>('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('burullus-ccpp');
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [showMobilizationArcs, setShowMobilizationArcs] = useState<boolean>(true);

  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startCenter: [number, number];
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    startCenter: defaultPreset.center,
  });

  const filterOptions: { id: MapFilterId; label: { ar: string; en: string } }[] = [
    { id: 'all', label: { ar: `كافة المواقع (${INSCO_REGIONAL_SITES.length})`, en: `All Sites (${INSCO_REGIONAL_SITES.length})` } },
    { id: 'pwht_active', label: { ar: 'مواقع وحدات PWHT', en: 'PWHT Fleet Sites' } },
    { id: 'power', label: { ar: 'محطات الطاقة', en: 'Power Stations' } },
    { id: 'industrial', label: { ar: 'المجمعات الصناعية', en: 'Industrial Plants' } },
    { id: 'oil_gas', label: { ar: 'البترول والمشروعات الدولية', en: 'Oil, Gas & International' } },
    { id: 'fleet_hub', label: { ar: 'المقر ومخازن الأسطول', en: 'HQ & Depot' } },
  ];

  const filteredSites = useMemo(() => {
    return INSCO_REGIONAL_SITES.filter((site) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pwht_active') return site.pwhtUnitsAllocated > 0;
      return site.category === activeFilter;
    });
  }, [activeFilter]);

  const selectedSite = useMemo(() => {
    return (
      filteredSites.find((s) => s.id === selectedSiteId) ??
      INSCO_REGIONAL_SITES.find((s) => s.id === selectedSiteId) ??
      filteredSites[0] ??
      INSCO_REGIONAL_SITES[0]
    );
  }, [filteredSites, selectedSiteId]);

  const handleApplyFilter = (nextFilter: MapFilterId) => {
    setActiveFilter(nextFilter);
    const matching = INSCO_REGIONAL_SITES.filter((site) => {
      if (nextFilter === 'all') return true;
      if (nextFilter === 'pwht_active') return site.pwhtUnitsAllocated > 0;
      return site.category === nextFilter;
    });
    if (matching.length > 0 && !matching.some((s) => s.id === selectedSiteId)) {
      setSelectedSiteId(matching[0].id);
    }
    if (nextFilter === 'oil_gas') {
      const intlPreset = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === 'all_footprint');
      if (intlPreset) {
        setActivePresetId('all_footprint');
        setCenter(intlPreset.center);
        setScale(intlPreset.scale);
      }
    }
  };

  const handleSelectPreset = (presetId: RegionalViewportPresetId) => {
    const preset = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setCenter(preset.center);
    setScale(preset.scale);
  };

  const handleZoom = (factor: number) => {
    setScale((prev) => clamp(Math.round(prev * factor), MIN_SCALE, MAX_SCALE));
  };

  const handleFocusSite = (site: RegionalSiteNode) => {
    setSelectedSiteId(site.id);
    setCenter(site.coordinates);
    const targetScale = site.countryCode === 'EG' ? 7500 : 2200;
    setScale(targetScale);
  };

  const handleSelectSiteFromDirectory = (site: RegionalSiteNode) => {
    setSelectedSiteId(site.id);
    // Ensure international sites are visible if the user is zoomed tightly into Cairo/Egypt
    if (site.countryCode !== 'EG' && scale > 1800) {
      const overview = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === 'all_footprint');
      if (overview) {
        setActivePresetId('all_footprint');
        setCenter(overview.center);
        setScale(overview.scale);
      }
    }
  };

  // Build D3 Mercator projection & SVG paths
  const {
    countryPaths,
    hydroPaths,
    graticulePath,
    depotPoint,
    projectedPins,
  } = useMemo(() => {
    const proj = geoMercator()
      .center(center)
      .scale(scale)
      .translate([SVG_WIDTH / 2, SVG_HEIGHT / 2]);

    const pathGen = geoPath(proj);

    const stepDeg: [number, number] =
      scale >= 12000 ? [0.5, 0.5] : scale >= 3200 ? [2, 2] : [5, 5];
    const grat = geoGraticule().step(stepDeg)();
    const gratSvg = pathGen(grat) || '';

    const countries = REGIONAL_LANDMASS_COLLECTION.features.map((feat) => {
      const centroid = pathGen.centroid(feat);
      return {
        id: feat.properties.id,
        nameEn: feat.properties.nameEn,
        nameAr: feat.properties.nameAr,
        role: feat.properties.role,
        d: pathGen(feat) || '',
        centroid: Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? centroid : null,
      };
    });

    const hydros = REGIONAL_HYDRO_COLLECTION.features.map((feat, idx) => ({
      key: `${feat.properties.name}-${idx}`,
      d: pathGen(feat) || '',
    }));

    const depotProjected = proj(GIZA_DEPOT_COORDINATES) ?? [SVG_WIDTH / 2, SVG_HEIGHT / 2];

    const rawSitePoints = filteredSites
      .map((site) => {
        const pt = proj(site.coordinates);
        if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) return null;
        return {
          site,
          anchorX: pt[0],
          anchorY: pt[1],
        };
      })
      .filter((item): item is { site: RegionalSiteNode; anchorX: number; anchorY: number } =>
        Boolean(item)
      );

    // Filter pins reasonably near viewport before collision pass so off-screen international pins don't push Cairo pins
    const inViewportRaw = rawSitePoints.filter(
      (p) =>
        p.anchorX >= -40 &&
        p.anchorX <= SVG_WIDTH + 40 &&
        p.anchorY >= -40 &&
        p.anchorY <= SVG_HEIGHT + 40
    );

    const resolvedPins = resolvePinCollisions(inViewportRaw, scale >= 10000 ? 24 : 30);

    return {
      countryPaths: countries,
      hydroPaths: hydros,
      graticulePath: gratSvg,
      depotPoint: depotProjected as [number, number],
      projectedPins: resolvedPins,
    };
  }, [center, scale, filteredSites]);

  // Pointer drag-to-pan handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    if (target.closest('[data-map-pin="true"]')) return;
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startCenter: center,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current.dragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    // Convert pixel drag to approximate Mercator degree delta at current scale
    const degPerPx = (180 / Math.PI) / scale;
    const nextLng = clamp(dragStateRef.current.startCenter[0] - dx * degPerPx, 20, 75);
    const nextLat = clamp(dragStateRef.current.startCenter[1] + dy * degPerPx * 0.88, 10, 40);
    setCenter([nextLng, nextLat]);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current.dragging) return;
    dragStateRef.current.dragging = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const selectedDistanceKm = useMemo(
    () => calculateMobilizationDistanceKm(selectedSite.coordinates),
    [selectedSite]
  );

  // Palette values tuned for both Dark tactical atlas and Light hydrographic engineering atlas
  const mapColors = isLight
    ? {
        seaBg: '#e8f1f8',
        graticule: '#cbd5e1',
        contextLandFill: '#f8fafc',
        contextLandStroke: '#94a3b8',
        intlLandFill: '#fef3c7',
        intlLandStroke: '#d97706',
        coreLandFill: '#ecfeff',
        coreLandStroke: '#0891b2',
        countryLabel: '#475569',
        coreLabel: '#0e7490',
        nileStroke: '#0284c7',
        arcActive: '#0891b2',
        arcMuted: '#64748b',
        leaderStroke: '#475569',
        pinPlate: '#ffffff',
        pinPlateSelected: '#0f172a',
        pinText: '#0f172a',
        pinTextSelected: '#ffffff',
      }
    : {
        seaBg: '#050b16',
        graticule: '#162238',
        contextLandFill: '#0d1526',
        contextLandStroke: '#283652',
        intlLandFill: '#1c1a17',
        intlLandStroke: '#b45309',
        coreLandFill: '#0c2136',
        coreLandStroke: '#06b6d4',
        countryLabel: '#64748b',
        coreLabel: '#22d3ee',
        nileStroke: '#38bdf8',
        arcActive: '#22d3ee',
        arcMuted: '#475569',
        leaderStroke: '#94a3b8',
        pinPlate: '#0f172a',
        pinPlateSelected: '#ecfeff',
        pinText: '#f1f5f9',
        pinTextSelected: '#020617',
      };

  const getPinAccent = (category: RegionalSiteCategory): string => {
    if (category === 'fleet_hub') return isLight ? '#d97706' : '#f59e0b';
    if (category === 'power') return isLight ? '#0891b2' : '#22d3ee';
    if (category === 'industrial') return isLight ? '#059669' : '#10b981';
    return isLight ? '#e11d48' : '#fb7185';
  };

  const totalEgyptSites = INSCO_REGIONAL_SITES.filter((s) => s.countryCode === 'EG').length;
  const totalIntlSites = INSCO_REGIONAL_SITES.length - totalEgyptSites;

  return (
    <div
      id="services-regional-map"
      data-testid="company-regional-fleet-map"
      className="mb-14 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7 space-y-6"
    >
      {/* Header & Unboxed Engineering Summary Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400">
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isAr
                ? 'التوزيع الجغرافي لأسطول PWHT ومواقع المشروعات'
                : 'Geographic Distribution · PWHT Fleet & Project Sites'}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-400 tabular-nums">
              {TOTAL_OWNED_PWHT_UNITS} × {UNIT_POWER_KW} kW ({TOTAL_OWNED_PWHT_UNITS * UNIT_POWER_KW} kVA)
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight text-balance">
            {isAr
              ? 'خريطة الانتشار الإقليمي لأسطول المعالجة الحرارية (16 وحدة) ومواقع التنفيذ'
              : 'Interactive Regional Map of INSCO’s 16-Unit PWHT Fleet & Project Footprint'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isAr
              ? 'ينطلق أسطول إنسكو المملوك بالكامل من مجمع ورش أبو النمرس بالجيزة والمقر الرئيسي بالمعادي لتغطية محطات توليد الكهرباء العملاقة والمجمعات الصناعية في مصر، مع سجل تعبئة دولية في اليمن وأفغانستان.'
              : 'Mobilizing directly from INSCO’s Giza calibration depot and Maadi HQ across Egypt’s mega power stations and industrial complexes, backed by cross-border deployments in Yemen and Afghanistan.'}
          </p>
        </div>

        {/* Clean Unboxed Tabular Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono tabular-nums text-slate-300 shrink-0">
          <div>
            <div className="text-lg font-black text-cyan-400">{TOTAL_OWNED_PWHT_UNITS}</div>
            <div className="text-[11px] text-slate-400 font-sans">
              {isAr ? 'وحدة 65 kW مملوكة' : 'Owned 65 kW Units'}
            </div>
          </div>
          <span aria-hidden="true" className="text-slate-700">
            /
          </span>
          <div>
            <div className="text-lg font-black text-white">{totalEgyptSites}</div>
            <div className="text-[11px] text-slate-400 font-sans">
              {isAr ? 'مراكز ومواقع بمصر' : 'Egypt Hubs & Sites'}
            </div>
          </div>
          <span aria-hidden="true" className="text-slate-700">
            /
          </span>
          <div>
            <div className="text-lg font-black text-amber-400">{totalIntlSites}</div>
            <div className="text-[11px] text-slate-400 font-sans">
              {isAr ? 'بعثات دولية موثقة' : 'Intl. Deployments'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Sector Filters + Camera Region Presets */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Sector Filter Segmented Buttons */}
        <div
          role="group"
          aria-label={isAr ? 'تصفية مواقع الخريطة حسب القطاع' : 'Filter map sites by sector'}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800"
        >
          {filterOptions.map((opt) => {
            const active = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleApplyFilter(opt.id)}
                aria-pressed={active}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {opt.label[language]}
              </button>
            );
          })}
        </div>

        {/* Viewport Region Camera Presets */}
        <div
          role="group"
          aria-label={isAr ? 'نطاق عرض الخريطة الجغرافي' : 'Geographic map camera presets'}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800"
        >
          {REGIONAL_VIEWPORT_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                aria-pressed={active}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.label[language]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Interactive SVG Cartography (Left 7 cols) + Site Dispatch Dossier (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive SVG Regional Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 select-none">
            {/* Floating Map Zoom & Arc Overlay Toolbar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
              <button
                type="button"
                onClick={() => setShowMobilizationArcs((prev) => !prev)}
                aria-pressed={showMobilizationArcs}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 text-[11px] font-medium text-slate-200 hover:border-cyan-500/50 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>
                  {isAr ? 'مسارات الاستنفار من الجيزة' : 'Giza Mobilization Arcs'}
                </span>
              </button>

              <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 p-1">
                <button
                  type="button"
                  onClick={() => handleZoom(1.45)}
                  aria-label={isAr ? 'تكبير الخريطة' : 'Zoom in map'}
                  title={isAr ? 'تكبير الخريطة' : 'Zoom in map'}
                  className="p-1.5 rounded text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(1 / 1.45)}
                  aria-label={isAr ? 'تصغير الخريطة' : 'Zoom out map'}
                  title={isAr ? 'تصغير الخريطة' : 'Zoom out map'}
                  className="p-1.5 rounded text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(defaultPreset.id)}
                  aria-label={isAr ? 'إعادة ضبط عرض الخريطة' : 'Reset map view'}
                  title={isAr ? 'إعادة ضبط عرض الخريطة' : 'Reset map view'}
                  className="p-1.5 rounded text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Mercator SVG Canvas */}
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              role="img"
              aria-label={
                isAr
                  ? 'خريطة إقليمية تفاعلية لتوزيع أسطول المعالجة الحرارية ومواقع مشروعات إنسكو'
                  : 'Interactive regional map of INSCO PWHT fleet hubs and project sites'
              }
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-[360px] sm:h-[440px] block cursor-grab active:cursor-grabbing touch-none"
            >
              {/* Bathymetric / Hydrographic Background */}
              <rect
                x={0}
                y={0}
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                fill={mapColors.seaBg}
              />

              {/* Mercator Graticule Grid */}
              <path
                d={graticulePath}
                fill="none"
                stroke={mapColors.graticule}
                strokeWidth={0.75}
                strokeDasharray="3 3"
              />

              {/* Regional Landmass Polygons */}
              <g>
                {countryPaths.map((country) => {
                  const fill =
                    country.role === 'core'
                      ? mapColors.coreLandFill
                      : country.role === 'international'
                        ? mapColors.intlLandFill
                        : mapColors.contextLandFill;
                  const stroke =
                    country.role === 'core'
                      ? mapColors.coreLandStroke
                      : country.role === 'international'
                        ? mapColors.intlLandStroke
                        : mapColors.contextLandStroke;
                  const strokeWidth = country.role === 'core' ? 1.5 : 1;

                  return (
                    <g key={country.id}>
                      <path
                        d={country.d}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                      />
                      {country.centroid &&
                        country.centroid[0] > 30 &&
                        country.centroid[0] < SVG_WIDTH - 30 &&
                        country.centroid[1] > 24 &&
                        country.centroid[1] < SVG_HEIGHT - 24 && (
                          <text
                            x={country.centroid[0]}
                            y={country.centroid[1]}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={
                              country.role === 'core'
                                ? mapColors.coreLabel
                                : mapColors.countryLabel
                            }
                            fontSize={country.role === 'core' ? 11 : 9.5}
                            fontWeight={country.role === 'core' ? 700 : 500}
                            opacity={0.78}
                            pointerEvents="none"
                          >
                            {isAr ? country.nameAr : country.nameEn}
                          </text>
                        )}
                    </g>
                  );
                })}
              </g>

              {/* Nile River, Rosetta & Damietta Delta Branches, and Suez Canal */}
              <g pointerEvents="none">
                {hydroPaths.map((river) => (
                  <path
                    key={river.key}
                    d={river.d}
                    fill="none"
                    stroke={mapColors.nileStroke}
                    strokeWidth={scale >= 3500 ? 1.8 : 1.15}
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                ))}
              </g>

              {/* Mobilization Arcs from Giza 16-Unit PWHT Depot to Project Sites */}
              {showMobilizationArcs && (
                <g pointerEvents="none">
                  {projectedPins.map(({ site, anchorX, anchorY }) => {
                    if (site.id === 'giza-fleet-depot') return null;
                    const dx = anchorX - depotPoint[0];
                    const dy = anchorY - depotPoint[1];
                    const dist = Math.hypot(dx, dy);
                    if (dist < 4) return null;

                    const midX = (depotPoint[0] + anchorX) / 2;
                    const midY = (depotPoint[1] + anchorY) / 2 - Math.min(55, dist * 0.18);
                    const isFocused =
                      selectedSite.id === site.id || hoveredSiteId === site.id;

                    return (
                      <path
                        key={`arc-${site.id}`}
                        d={`M ${depotPoint[0].toFixed(1)} ${depotPoint[1].toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${anchorX.toFixed(1)} ${anchorY.toFixed(1)}`}
                        fill="none"
                        stroke={isFocused ? mapColors.arcActive : mapColors.arcMuted}
                        strokeWidth={isFocused ? 2 : 1.1}
                        strokeDasharray={site.countryCode === 'EG' ? '5 3' : '3 4'}
                        opacity={isFocused ? 0.95 : 0.45}
                      />
                    );
                  })}
                </g>
              )}

              {/* True Geographic Coordinate Dots & Leader Ticks for Displaced Pins */}
              <g pointerEvents="none">
                {projectedPins.map(({ site, anchorX, anchorY, displayX, displayY, displaced }) => {
                  const accent = getPinAccent(site.category);
                  return (
                    <g key={`anchor-${site.id}`}>
                      {displaced && (
                        <line
                          x1={anchorX}
                          y1={anchorY}
                          x2={displayX}
                          y2={displayY}
                          stroke={mapColors.leaderStroke}
                          strokeWidth={1}
                          opacity={0.7}
                        />
                      )}
                      <circle
                        cx={anchorX}
                        cy={anchorY}
                        r={displaced ? 2.6 : 2}
                        fill={accent}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Interactive Site Marker Pins */}
              <g>
                {projectedPins.map(({ site, displayX, displayY }) => {
                  const isSelected = selectedSite.id === site.id;
                  const isHovered = hoveredSiteId === site.id;
                  const accent = getPinAccent(site.category);
                  const badgeText =
                    site.id === 'giza-fleet-depot'
                      ? '16U'
                      : site.pwhtUnitsAllocated > 0
                        ? `${site.pwhtUnitsAllocated}U`
                        : site.code.split('-')[1] || 'NDT';

                  return (
                    <g
                      key={site.id}
                      data-map-pin="true"
                      data-testid={`map-pin-${site.id}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`${site.name[language]} — ${
                        site.pwhtUnitsAllocated > 0
                          ? `${site.pwhtUnitsAllocated} × 65 kW PWHT`
                          : 'NDT Inspection'
                      }`}
                      transform={`translate(${displayX.toFixed(1)}, ${displayY.toFixed(1)})`}
                      onClick={() => setSelectedSiteId(site.id)}
                      onMouseEnter={() => setHoveredSiteId(site.id)}
                      onMouseLeave={() => setHoveredSiteId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSiteId(site.id);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      {/* Outer Selection Halo */}
                      {(isSelected || isHovered) && (
                        <circle
                          cx={0}
                          cy={0}
                          r={isSelected ? 17 : 15}
                          fill="none"
                          stroke={accent}
                          strokeWidth={isSelected ? 2 : 1.4}
                          opacity={0.9}
                        />
                      )}

                      {/* Marker Plate */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isSelected ? 12.5 : 11}
                        fill={isSelected ? mapColors.pinPlateSelected : mapColors.pinPlate}
                        stroke={accent}
                        strokeWidth={isSelected ? 2.5 : 2}
                      />

                      {/* Unit Allocation / Code Label inside Pin */}
                      <text
                        x={0}
                        y={0.5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isSelected ? mapColors.pinTextSelected : mapColors.pinText}
                        fontSize={8.5}
                        fontWeight={800}
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      >
                        {badgeText}
                      </text>

                      {/* Floating Callout Label for Selected or Hovered Pin */}
                      {(isSelected || isHovered || scale >= 4200) && (
                        <g transform="translate(0, -20)" pointerEvents="none">
                          <rect
                            x={-68}
                            y={-11}
                            width={136}
                            height={18}
                            rx={4}
                            fill={mapColors.pinPlate}
                            stroke={isSelected ? accent : mapColors.contextLandStroke}
                            strokeWidth={1}
                            opacity={0.94}
                          />
                          <text
                            x={0}
                            y={-1.5}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={mapColors.pinText}
                            fontSize={8.5}
                            fontWeight={700}
                          >
                            {site.shortName[language]}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Bottom Coordinate & Legend Strip */}
            <div className="px-3.5 py-2.5 border-t border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 inline-block" />
                  <span>{isAr ? 'مخازن الأسطول والمقر (16U)' : 'HQ & 16-Unit Depot'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400 inline-block" />
                  <span>{isAr ? 'محطات توليد الكهرباء' : 'Power Plants'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 inline-block" />
                  <span>{isAr ? 'المجمعات الصناعية' : 'Industrial'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-400 inline-block" />
                  <span>{isAr ? 'البترول والمشروعات الدولية' : 'Oil, Gas & Intl.'}</span>
                </span>
              </div>
              <span className="font-mono tabular-nums text-[10px] text-slate-500">
                {isAr ? 'اسحب الخريطة للتحريك أو اختر موقعاً' : 'Drag map to pan · Click any pin'}
              </span>
            </div>
          </div>

          {/* Compact Quick-Select Site Directory Below Map */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
              <span className="font-semibold text-slate-300">
                {isAr
                  ? `دليل المواقع المعروضة (${filteredSites.length})`
                  : `Displayed Sites Directory (${filteredSites.length})`}
              </span>
              <span className="font-mono text-[11px] tabular-nums">
                {isAr ? 'انقر لعرض ملف التعبئة' : 'Select site to inspect fleet scope'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {filteredSites.map((site) => {
                const isSelected = selectedSite.id === site.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    data-testid={`directory-site-${site.id}`}
                    onClick={() => handleSelectSiteFromDirectory(site)}
                    className={`w-full text-start px-3 py-2 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/25 text-white'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate">
                        {site.shortName[language]}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {site.client}
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] font-semibold text-cyan-400 shrink-0">
                      {site.id === 'giza-fleet-depot'
                        ? '16 × 65kW'
                        : site.pwhtUnitsAllocated > 0
                          ? `${site.pwhtUnitsAllocated} × 65kW`
                          : 'NDT'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Site PWHT Fleet & Engineering Dossier */}
        <div
          data-testid="regional-map-site-dossier"
          className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-5"
        >
          {/* Site Kicker & Focus Action */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-400 tabular-nums">
                <span className="text-cyan-400 font-bold">{selectedSite.code}</span>
                <span aria-hidden="true">·</span>
                <span>{getRegionalCategoryLabel(selectedSite.category, isAr)}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {selectedSite.coordinates[1].toFixed(2)}°N, {selectedSite.coordinates[0].toFixed(2)}°E
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                {selectedSite.name[language]}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                <span>{selectedSite.location[language]}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleFocusSite(selectedSite)}
              title={isAr ? 'تركيز وتكبير الموقع على الخريطة' : 'Center & zoom to site on map'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 transition cursor-pointer shrink-0"
            >
              <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'تركيز' : 'Focus'}</span>
            </button>
          </div>

          {/* Client, Distance from Giza Depot & Dispatch Window */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1">
              <div className="text-[11px] text-slate-400">
                {isAr ? 'العميل / المقاول العام' : 'Client / EPC Contractor'}
              </div>
              <div className="font-bold text-slate-100 leading-snug">{selectedSite.client}</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1">
              <div className="text-[11px] text-slate-400">
                {isAr ? 'مسافة التحرك من ورش الجيزة' : 'Mobilization from Giza Depot'}
              </div>
              <div className="font-mono font-bold text-cyan-400 tabular-nums">
                {selectedDistanceKm === 0
                  ? isAr
                    ? '0 كم (المقر المركزي)'
                    : '0 km (Central Base)'
                  : isAr
                    ? `${selectedDistanceKm.toLocaleString('en-US')} كم`
                    : `${selectedDistanceKm.toLocaleString('en-US')} km`}
              </div>
              <div className="text-[11px] text-slate-400">
                {selectedSite.dispatchWindow[language]}
              </div>
            </div>
          </div>

          {/* 16-Unit PWHT Fleet Allocation Matrix (Zero Inline Styles) */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'تخصيص أسطول المعالجة الحرارية (65 kW)'
                    : 'PWHT 65 kW Fleet Allocation'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                {selectedSite.id === 'giza-fleet-depot'
                  ? `16 / ${TOTAL_OWNED_PWHT_UNITS}`
                  : `${selectedSite.pwhtUnitsAllocated} / ${TOTAL_OWNED_PWHT_UNITS}`}{' '}
                {isAr ? 'وحدات' : 'Units'}
              </span>
            </div>

            {/* 16 Individual Physical Unit Blocks representing INS-PWHT-01..16 */}
            <div
              role="img"
              aria-label={
                isAr
                  ? `تمثيل وحدات المعالجة الحرارية المخصصة من أصل ${TOTAL_OWNED_PWHT_UNITS} وحدة`
                  : `Visual meter showing allocated PWHT units out of ${TOTAL_OWNED_PWHT_UNITS} owned units`
              }
              className="grid grid-cols-16 gap-1"
            >
              {Array.from({ length: TOTAL_OWNED_PWHT_UNITS }).map((_, idx) => {
                const activeCount =
                  selectedSite.id === 'giza-fleet-depot'
                    ? TOTAL_OWNED_PWHT_UNITS
                    : selectedSite.pwhtUnitsAllocated;
                const isAllocated = idx < activeCount;
                return (
                  <div
                    key={idx}
                    title={`INS-PWHT-${String(idx + 1).padStart(2, '0')}`}
                    className={`h-2.5 rounded-xs transition-colors ${
                      isAllocated
                        ? 'bg-amber-500'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>

            <div className="text-xs text-slate-300 leading-snug">
              {selectedSite.pwhtRoleLabel[language]}
            </div>

            {selectedSite.serialAllocation && (
              <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                {isAr ? 'النطاق التسلسلي:' : 'Serial Block:'} {selectedSite.serialAllocation}
              </div>
            )}
          </div>

          {/* Operational Scope Summary */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">
              {isAr ? 'نطاق الأعمال المنفذة بالموقع' : 'Executed Site Engineering Scope'}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedSite.scopeSummary[language]}
            </p>
          </div>

          {/* Interactive NDT Methods Executed at This Site */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              {isAr
                ? 'طرق الفحص المطبقة بالموقع (انقر لعرض مواصفات الطريقة أدناه)'
                : 'Site NDT Methods (Click to inspect method specifications below)'}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedSite.ndtMethods.map((methodCode) => (
                <button
                  key={methodCode}
                  type="button"
                  onClick={() => onSelectNdtMethod?.(methodCode)}
                  className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 hover:border-cyan-500/60 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-200 transition cursor-pointer"
                >
                  {methodCode}
                </button>
              ))}
            </div>
          </div>

          {/* Governing Codes & Brochure Evidence Footer */}
          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>{selectedSite.governingCodes.join(' · ')}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {selectedSite.evidenceRef && (
                <span className="text-[11px] font-mono text-slate-400">
                  {isAr ? 'مرجع التوثيق:' : 'Evidence:'} {selectedSite.evidenceRef}
                </span>
              )}

              {onNavigateToAcademyModule && (
                <button
                  type="button"
                  onClick={() => onNavigateToAcademyModule('pwht_curve')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isAr ? 'محاكاة دورة PWHT بالأكاديمية' : 'Simulate PWHT Cycle'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
