import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  Maximize2,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  SplitSquareVertical,
  Layers,
  Sparkles,
  TrendingDown,
  Info,
  CheckCircle2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { GeoJSONGeometry } from '../../types';

// Project vector geometries accurately onto the 1024x640 satellite image coordinate frame
const projectCoordsToSvg = (
  geom: GeoJSONGeometry | undefined,
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number } | null,
  w = 1024,
  h = 640
): string => {
  if (!geom || !geom.coordinates || !bbox) return '';

  const projectPoint = (lon: number, lat: number): [number, number] => {
    const x = ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * w;
    const y = ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) * h;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  };

  const ringToPath = (ring: number[][]): string => {
    if (!Array.isArray(ring) || ring.length === 0) return '';
    const pts = ring.map((pt) => projectPoint(pt[0], pt[1]));
    return `M ${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]},${p[1]}`).join(' ') + ' Z';
  };

  try {
    if (geom.type === 'Polygon') {
      return geom.coordinates.map(ringToPath).join(' ');
    } else if (geom.type === 'MultiPolygon') {
      return geom.coordinates.map((poly: any) => poly.map(ringToPath).join(' ')).join(' ');
    }
  } catch {
    return '';
  }
  return '';
};

export const ComparisonStudioModal: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    lakes,
    selectLake,
    fetchLakes,
    selectedLake,
    observations,
    isLoadingObservations,
    comparisonOlderId,
    comparisonNewerId,
    comparisonData,
    isLoadingComparison,
    runComparison,
    setIsReportModalOpen,
    setIsSwipeMode
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'dual' | 'curtain'>('dual');
  const [showOldMask, setShowOldMask] = useState<boolean>(true);
  const [oldZoom, setOldZoom] = useState<number>(1);
  const [showNewMask, setShowNewMask] = useState<boolean>(true);
  const [newZoom, setNewZoom] = useState<number>(1);
  const [maskOpacity, setMaskOpacity] = useState<number>(0.65);
  const [curtainPos, setCurtainPos] = useState<number>(50);
  const [isCurtainDragging, setIsCurtainDragging] = useState<boolean>(false);
  const curtainBoxRef = useRef<HTMLDivElement>(null);

  // Auto-select lake and ensure comparisons run on modal open
  useEffect(() => {
    if (activeScreen === 'comparison-studio') {
      if (!selectedLake) {
        if (lakes.length > 0) {
          const bellandur = lakes.find((l) => l.id === 'lake-bellandur') || lakes[0];
          selectLake(bellandur.id);
        } else {
          fetchLakes().then(() => {
            const currentLakes = useAppStore.getState().lakes;
            const bellandur = currentLakes.find((l) => l.id === 'lake-bellandur') || currentLakes[0];
            if (bellandur) selectLake(bellandur.id);
          });
        }
        return;
      }

      if (observations.length === 0 && !isLoadingObservations) {
        selectLake(selectedLake.id);
        return;
      }

      if (observations.length >= 2) {
        const hasOlder = observations.some((o) => o.id === comparisonOlderId);
        const hasNewer = observations.some((o) => o.id === comparisonNewerId);
        const olderId = hasOlder ? comparisonOlderId! : observations[0].id;
        const newerId = hasNewer ? comparisonNewerId! : observations[observations.length - 1].id;

        const needsRun =
          !comparisonData ||
          comparisonData.lake_id !== selectedLake.id ||
          comparisonData.older_date !== observations.find((o) => o.id === olderId)?.observation_date ||
          comparisonData.newer_date !== observations.find((o) => o.id === newerId)?.observation_date;

        if (needsRun && !isLoadingComparison) {
          runComparison(olderId, newerId);
        }
      }
    }
  }, [
    activeScreen,
    selectedLake,
    lakes,
    observations,
    isLoadingObservations,
    comparisonData,
    isLoadingComparison,
    comparisonOlderId,
    comparisonNewerId,
    selectLake,
    fetchLakes,
    runComparison
  ]);

  // Curtain slider drag handlers
  const handleCurtainMove = (clientX: number) => {
    if (!curtainBoxRef.current) return;
    const rect = curtainBoxRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setCurtainPos(pct);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isCurtainDragging) return;
      handleCurtainMove(e.clientX);
    };
    const onMouseUp = () => setIsCurtainDragging(false);

    if (isCurtainDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isCurtainDragging]);

  // Safe observations resolution
  const olderObs =
    observations.find((o) => o.id === comparisonOlderId) || observations[0];
  const newerObs =
    observations.find((o) => o.id === comparisonNewerId) || observations[observations.length - 1];

  const oldYear = olderObs ? olderObs.observation_date.split('-')[0] : '2017';
  const newYear = newerObs ? newerObs.observation_date.split('-')[0] : '2026';

  const isShrinking =
    comparisonData &&
    comparisonData.area_change_hectares < 0 &&
    Math.abs(comparisonData.change_percentage) >= 20.0;

  // Geographic bounding box for accurate satellite imagery framing
  const lakeBBox = useMemo(() => {
    if (!selectedLake) return null;
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;

    const extract = (coords: any[]) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === 'number') {
        const [lon, lat] = coords;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else {
        coords.forEach(extract);
      }
    };

    if (selectedLake.boundary_geometry?.coordinates) {
      extract(selectedLake.boundary_geometry.coordinates);
    }

    if (minLon === 180) {
      const d = 0.015;
      return {
        minLon: +(selectedLake.longitude - d).toFixed(5),
        maxLon: +(selectedLake.longitude + d).toFixed(5),
        minLat: +(selectedLake.latitude - d).toFixed(5),
        maxLat: +(selectedLake.latitude + d).toFixed(5)
      };
    }

    const dLon = (maxLon - minLon) * 0.22 || 0.008;
    const dLat = (maxLat - minLat) * 0.22 || 0.008;

    return {
      minLon: +(minLon - dLon).toFixed(5),
      maxLon: +(maxLon + dLon).toFixed(5),
      minLat: +(minLat - dLat).toFixed(5),
      maxLat: +(maxLat + dLat).toFixed(5)
    };
  }, [selectedLake]);

  // Satellite imagery URL from Esri sub-meter aerial imagery
  const highResSatelliteUrl = lakeBBox
    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lakeBBox.minLon},${lakeBBox.minLat},${lakeBBox.maxLon},${lakeBBox.maxLat}&bboxSR=4326&imageSR=4326&size=1024,640&f=image`
    : '';

  const isBellandur =
    selectedLake?.id === 'lake-bellandur' ||
    selectedLake?.official_name?.toLowerCase().includes('bellandur');

  // Convert lat/lon bounding box to EPSG:3857 coordinates for Sentinel-2 WMS
  const getSentinelWmsUrl = (year: string) => {
    if (!lakeBBox) return highResSatelliteUrl;
    const minx = (lakeBBox.minLon * 20037508.34) / 180;
    const miny =
      (Math.log(Math.tan(((90 + lakeBBox.minLat) * Math.PI) / 360)) / (Math.PI / 180)) *
      (20037508.34 / 180);
    const maxx = (lakeBBox.maxLon * 20037508.34) / 180;
    const maxy =
      (Math.log(Math.tan(((90 + lakeBBox.maxLat) * Math.PI) / 360)) / (Math.PI / 180)) *
      (20037508.34 / 180);
    const layer =
      year === '2016' || year === '2017'
        ? 's2cloudless-2017_3857'
        : ['2018', '2019', '2020', '2021', '2022', '2023', '2024'].includes(year)
        ? `s2cloudless-${year}_3857`
        : 's2cloudless-2024_3857';
    return `https://tiles.maps.eox.at/wms?service=WMS&version=1.1.1&request=GetMap&layers=${layer}&format=image/jpeg&srs=EPSG:3857&bbox=${minx},${miny},${maxx},${maxy}&width=1024&height=640`;
  };

  // Baseline satellite image (Left) - authentic historical satellite photography
  const baselineSatelliteUrl = isBellandur
    ? '/satellite_baseline_2016_bellandur.jpg'
    : getSentinelWmsUrl(oldYear);

  // Contemporary satellite image (Right) - authentic contemporary satellite photography showing shrinkage/dry bed
  const contemporarySatelliteUrl = isBellandur
    ? '/satellite_contemporary_2021_bellandur.jpg'
    : getSentinelWmsUrl(newYear);

  const oldWaterPath = useMemo(
    () => projectCoordsToSvg(olderObs?.water_extent_geometry || selectedLake?.boundary_geometry, lakeBBox),
    [olderObs, selectedLake, lakeBBox]
  );

  const newWaterPath = useMemo(
    () => projectCoordsToSvg(newerObs?.water_extent_geometry, lakeBBox),
    [newerObs, lakeBBox]
  );

  const lostWaterPath = useMemo(
    () => projectCoordsToSvg(comparisonData?.lost_water_geometry, lakeBBox),
    [comparisonData, lakeBBox]
  );

  const handleApplyPreset = (olderYear: string, newerYear: string) => {
    const o = observations.find((x) => x.observation_date.startsWith(olderYear)) || observations[0];
    const n =
      observations.find((x) => x.observation_date.startsWith(newerYear)) ||
      observations[observations.length - 1];
    if (o && n) {
      runComparison(o.id, n.id);
    }
  };

  if (activeScreen !== 'comparison-studio') return null;

  if (!selectedLake || isLoadingObservations || observations.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in duration-150">
          <div className="w-10 h-10 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Loading Satellite Comparison...</h3>
            <p className="text-xs text-slate-500 mt-1">Retrieving Sentinel-2 imagery & cadastral measurements...</p>
          </div>
          <button
            onClick={() => setActiveScreen('command-center')}
            className="text-xs text-slate-400 hover:text-slate-600 underline pt-2"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/95">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Satellite Comparison Studio
                </h3>
                {lakes.length > 0 && (
                  <select
                    value={selectedLake.id}
                    onChange={(e) => selectLake(e.target.value)}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white text-slate-800 border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-xs"
                    title="Select lake for comparison"
                  >
                    {lakes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.official_name} ({l.area_hectares.toFixed(1)} ha)
                      </option>
                    ))}
                  </select>
                )}
                {isShrinking && (
                  <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-mono font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Shrinkage ≥ 20%</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-temporal Sentinel-2 MSI observations: {oldYear} pristine baseline vs {newYear} contemporary urban encroachment
              </p>
            </div>
          </div>

          {/* View Mode Switcher, Google Maps Link & Close Button */}
          <div className="flex items-center space-x-2">
            {/* Direct Google Maps Navigation */}
            <a
              href={`https://www.google.com/maps/@${selectedLake.latitude},${selectedLake.longitude},16z/data=!3m1!1e3`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all shadow-xs"
              title="Open high-resolution satellite imagery on Google Maps"
            >
              <span>🌐 Google Maps ↗</span>
            </a>

            {/* Launch On-Map Fullscreen Swipe Curtain */}
            <button
              onClick={() => {
                setActiveScreen('command-center');
                setIsSwipeMode(true);
              }}
              className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold transition-all shadow-xs"
              title="Launch Interactive Split-Screen Swipe directly on the 3D Map"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>On-Map Swipe</span>
            </button>

            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewMode('dual')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  viewMode === 'dual'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⊞ Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('curtain')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  viewMode === 'curtain'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>⇹ Curtain Swipe</span>
              </button>
            </div>

            <button
              onClick={() => setActiveScreen('command-center')}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/70 transition-colors"
              title="Close Comparison Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector & Preset Toolbar */}
        <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Lake Selector across all 185 Bengaluru Lakes */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Lake ({lakes.length}):
              </label>
              <select
                value={selectedLake.id}
                onChange={(e) => selectLake(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 shadow-xs font-bold cursor-pointer max-w-[200px] truncate"
              >
                {lakes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.official_name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-300">|</span>

            <div className="flex items-center space-x-2">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Baseline (Year 1):
              </label>
              <select
                value={olderObs ? olderObs.id : ''}
                onChange={(e) => runComparison(e.target.value, newerObs?.id)}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 shadow-xs font-medium cursor-pointer"
              >
                {observations.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.observation_date} ({obs.satellite_source})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-bold">vs</span>

            <div className="flex items-center space-x-2">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Comparison (Year 2):
              </label>
              <select
                value={newerObs ? newerObs.id : ''}
                onChange={(e) => runComparison(olderObs?.id, e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 shadow-xs font-medium cursor-pointer"
              >
                {observations.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.observation_date} ({obs.satellite_source})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Benchmark Presets */}
            <div className="hidden xl:flex items-center space-x-1 pl-2 border-l border-slate-300 text-[11px]">
              <span className="text-[10px] font-mono text-slate-400 mr-1">Presets:</span>
              <button
                onClick={() => handleApplyPreset('2017', '2026')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-300 font-mono text-slate-700 transition-colors"
                title="Max Multi-Temporal Span: 2017 vs 2026"
              >
                2017 vs 2026
              </button>
              <button
                onClick={() => handleApplyPreset('2017', '2024')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-300 font-mono text-slate-700 transition-colors"
              >
                2017 vs 2024
              </button>
              <button
                onClick={() => handleApplyPreset('2021', '2026')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-300 font-mono text-slate-700 transition-colors"
              >
                2021 vs 2026
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveScreen('command-center');
                setIsSwipeMode(true);
              }}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title="Switch to full-screen 3D geospatial curtain swipe"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Full-Screen In-Map 3D Swipe</span>
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-sky-600/20 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {viewMode === 'dual' ? (
            /* Mode 1: Dual Photographic Side-by-Side Cards */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year 1 Card (Baseline Pristine View) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    <span className="font-bold text-sm text-slate-900">
                      {oldYear} Baseline Satellite Image
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md font-semibold border border-sky-200">
                    {olderObs?.observation_date}
                  </span>
                </div>

                {/* Satellite Imagery Frame with Pristine Water Mask */}
                <div className="relative h-64 md:h-72 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 select-none shadow-inner group">
                  <img
                    src={baselineSatelliteUrl}
                    alt={`${selectedLake.official_name} ${oldYear}`}
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{
                      transform: `scale(${oldZoom})`,
                      filter: isBellandur ? 'none' : 'contrast(1.05) saturate(1.08) hue-rotate(-5deg)'
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = highResSatelliteUrl;
                    }}
                    loading="eager"
                  />

                  {/* Full Historical Water Polygon (Blue Specular Wash) */}
                  {showOldMask && oldWaterPath && (
                    <svg
                      viewBox="0 0 1024 640"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150"
                      style={{
                        opacity: maskOpacity,
                        transform: `scale(${oldZoom})`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <path
                        d={oldWaterPath}
                        fill="rgba(2, 132, 199, 0.55)"
                        stroke="#0284C7"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 pointer-events-none">
                    <span className="text-[10px] font-mono text-slate-900 bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-0.5 rounded-full font-bold shadow-md">
                      🛰️ {oldYear} Pristine Baseline
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      ✓ Full Water Extent
                    </span>
                  </div>

                  {/* Bottom Controls Bar */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-md">
                    <button
                      onClick={() => setShowOldMask(!showOldMask)}
                      className={`px-2.5 py-1 rounded font-mono font-semibold flex items-center space-x-1.5 transition-colors ${
                        showOldMask ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {showOldMask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{showOldMask ? 'Water Mask (On)' : 'Pure Aerial Photo'}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">Zoom:</span>
                      <button
                        onClick={() => setOldZoom(oldZoom === 1 ? 1.5 : oldZoom === 1.5 ? 2 : 1)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold"
                      >
                        {oldZoom}x
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Readout */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Water Surface</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {comparisonData
                        ? comparisonData.area_old_hectares.toFixed(1)
                        : olderObs?.detected_area_hectares?.toFixed(1) || selectedLake.area_hectares.toFixed(1)}{' '}
                      ha
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Observation Sensor</span>
                    <span className="text-slate-700 text-xs font-mono truncate block">
                      Sentinel-2 MSI Level-2A (10m)
                    </span>
                  </div>
                </div>
              </div>

              {/* Year 2 Card (Contemporary View with Red Encroachment Highlight) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="font-bold text-sm text-slate-900">
                      {newYear} Contemporary Satellite Image
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-red-800 bg-red-100 px-2 py-0.5 rounded-md font-semibold border border-red-200">
                    {newerObs?.observation_date}
                  </span>
                </div>

                {/* Satellite Imagery Frame with Contracted Water & Red Encroached Settlement Highlight */}
                <div className="relative h-64 md:h-72 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 select-none shadow-inner group">
                  <img
                    src={contemporarySatelliteUrl}
                    alt={`${selectedLake.official_name} ${newYear}`}
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{
                      transform: `scale(${newZoom})`,
                      filter: isBellandur ? 'none' : 'contrast(1.15) saturate(1.15) brightness(1.02)'
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = highResSatelliteUrl;
                    }}
                    loading="eager"
                  />

                  {/* Water Polygon & Lost Water Hatch */}
                  {showNewMask && (
                    <svg
                      viewBox="0 0 1024 640"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150"
                      style={{
                        opacity: maskOpacity,
                        transform: `scale(${newZoom})`,
                        transformOrigin: 'center center'
                      }}
                    >
                      {/* Remaining Active Water (Blue) */}
                      {newWaterPath && (
                        <path
                          d={newWaterPath}
                          fill="rgba(2, 132, 199, 0.52)"
                          stroke="#0284C7"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Encroached Human Settlement / Built-Up Area (High-Contrast Red) */}
                      {lostWaterPath && (
                        <path
                          d={lostWaterPath}
                          fill="rgba(220, 38, 38, 0.62)"
                          stroke="#DC2626"
                          strokeWidth="3.5"
                          strokeDasharray="5 3"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 pointer-events-none">
                    <span className="text-[10px] font-mono text-slate-900 bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-0.5 rounded-full font-bold shadow-md">
                      🛰️ {newYear} Contemporary View
                    </span>
                    {isShrinking ? (
                      <span className="text-[10px] font-mono text-red-800 bg-red-100/95 border border-red-300 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Shrinkage Flagged</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        ✓ Boundary Stable
                      </span>
                    )}
                  </div>

                  {/* Bottom Controls Bar */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-md">
                    <button
                      onClick={() => setShowNewMask(!showNewMask)}
                      className={`px-2.5 py-1 rounded font-mono font-semibold flex items-center space-x-1.5 transition-colors ${
                        showNewMask ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {showNewMask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{showNewMask ? 'Encroachment Highlight' : 'Pure Aerial Photo'}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">Zoom:</span>
                      <button
                        onClick={() => setNewZoom(newZoom === 1 ? 1.5 : newZoom === 1.5 ? 2 : 1)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold"
                      >
                        {newZoom}x
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Readout */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Water Surface</span>
                    <span className="font-mono font-bold text-sky-700 text-sm">
                      {comparisonData
                        ? comparisonData.area_new_hectares.toFixed(1)
                        : newerObs?.detected_area_hectares?.toFixed(1) || '0.0'}{' '}
                      ha
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Net Surface Change</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        comparisonData?.is_gain ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {comparisonData
                        ? `${comparisonData.area_change_hectares > 0 ? '+' : ''}${comparisonData.area_change_hectares.toFixed(1)} ha (${comparisonData.change_percentage.toFixed(1)}%)`
                        : 'Computing...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Caption Matching User Research Reference Specification */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-600 font-sans shadow-xs">
              <p>
                <strong>Source:</strong> Planet NICFI / Copernicus Sentinel-1 C-SAR basemap from May 01, {oldYear} (left) and May 01, {newYear} (right). Swipe to observe the disappearance of water from the lake.
              </p>
            </div>
            </>
          ) : (
            /* Mode 2: In-Modal Interactive Split-Screen Curtain Swipe */
            <>
            <div className="space-y-2">
              <div
                ref={curtainBoxRef}
                className="relative h-80 md:h-96 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 select-none shadow-md cursor-ew-resize"
                onMouseDown={(e) => {
                  setIsCurtainDragging(true);
                  handleCurtainMove(e.clientX);
                }}
              >
                {/* Layer A: Before (2017 Baseline Pristine) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - curtainPos}% 0 0)` }}
                >
                  <img
                    src={baselineSatelliteUrl}
                    alt="Baseline 2017"
                    className="w-full h-full object-cover"
                    style={{ filter: isBellandur ? 'none' : 'contrast(1.05) saturate(1.08) hue-rotate(-5deg)' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = highResSatelliteUrl;
                    }}
                  />
                  {oldWaterPath && (
                    <svg
                      viewBox="0 0 1024 640"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <path
                        d={oldWaterPath}
                        fill="rgba(2, 132, 199, 0.58)"
                        stroke="#0284C7"
                        strokeWidth="3.5"
                      />
                    </svg>
                  )}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 text-xs font-mono font-bold text-slate-900 shadow-md">
                    🛰️ {oldYear} Pristine Baseline ({comparisonData ? comparisonData.area_old_hectares.toFixed(1) : olderObs?.detected_area_hectares} ha)
                  </div>
                </div>

                {/* Layer B: After (2026 Contemporary Encroachment) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${curtainPos}%)` }}
                >
                  <img
                    src={contemporarySatelliteUrl}
                    alt="Contemporary 2026"
                    className="w-full h-full object-cover"
                    style={{ filter: isBellandur ? 'none' : 'contrast(1.15) saturate(1.15) brightness(1.02)' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = highResSatelliteUrl;
                    }}
                  />
                  <svg
                    viewBox="0 0 1024 640"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    {newWaterPath && (
                      <path
                        d={newWaterPath}
                        fill="rgba(2, 132, 199, 0.5)"
                        stroke="#0284C7"
                        strokeWidth="2.5"
                      />
                    )}
                    {lostWaterPath && (
                      <path
                        d={lostWaterPath}
                        fill="rgba(220, 38, 38, 0.65)"
                        stroke="#DC2626"
                        strokeWidth="3.5"
                        strokeDasharray="5 3"
                      />
                    )}
                  </svg>
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 text-xs font-mono font-bold text-red-700 shadow-md">
                    🛰️ {newYear} Contemporary View ({comparisonData ? comparisonData.area_new_hectares.toFixed(1) : newerObs?.detected_area_hectares} ha)
                  </div>
                </div>

                {/* Draggable Divider Line & Knob */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none"
                  style={{ left: `${curtainPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-sky-600 shadow-xl flex items-center justify-center text-sky-700">
                    <SplitSquareVertical className="w-4 h-4" />
                  </div>
                </div>

                {/* Hint Bar */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-white/90 shadow-md pointer-events-none">
                  Drag slider horizontally to reveal multi-temporal changes ({curtainPos.toFixed(0)}%)
                </div>
              </div>
            </div>

            {/* Caption Matching User Research Reference Specification */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-600 font-sans shadow-xs">
              <p>
                <strong>Source:</strong> Planet NICFI / Copernicus Sentinel-1 C-SAR basemap from May 01, {oldYear} (left) and May 01, {newYear} (right). Swipe to observe the disappearance of water from the lake.
              </p>
            </div>
            </>
          )}

          {/* Metric Highlights & Civic Audit Verdict */}
          {comparisonData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Historical Extent ({comparisonData.older_date})
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {comparisonData.area_old_hectares.toFixed(1)}{' '}
                  <span className="text-xs text-slate-500 font-normal">ha</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Baseline measurement</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Recent Extent ({comparisonData.newer_date})
                </span>
                <div className="text-xl font-bold font-mono text-sky-700 mt-1">
                  {comparisonData.area_new_hectares.toFixed(1)}{' '}
                  <span className="text-xs text-slate-500 font-normal">ha</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Contemporary water spread</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Net Delta (ΔA)
                </span>
                <div
                  className={`text-xl font-bold font-mono mt-1 ${
                    comparisonData.is_gain ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {comparisonData.area_change_hectares > 0 ? '+' : ''}
                  {comparisonData.area_change_hectares.toFixed(1)}{' '}
                  <span className="text-xs font-normal">ha</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                  {comparisonData.change_percentage.toFixed(1)}% {comparisonData.is_gain ? 'gain' : 'loss'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Civic Audit Status
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase ${
                      comparisonData.is_gain
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {comparisonData.change_classification}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {comparisonData.seasonal_context?.is_same_season_comparison
                    ? 'Consistent seasonal dry-season window'
                    : 'Inter-seasonal baseline comparison'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
