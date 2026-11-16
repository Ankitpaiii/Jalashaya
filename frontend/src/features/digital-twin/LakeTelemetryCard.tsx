import React, { useState } from 'react';
import {
  MapPin,
  Shield,
  Layers,
  Sliders,
  Sparkles,
  FileText,
  ChevronDown,
  X,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const LakeTelemetryCard: React.FC = () => {
  const {
    selectedLake,
    observations,
    selectedObservationIndex,
    setSelectedObservationIndex,
    comparisonData,
    layers,
    toggleLayer,
    setActiveScreen,
    setIsReportModalOpen,
    isTelemetryOpen,
    setIsTelemetryOpen,
    satelliteProvider,
    setSatelliteProvider,
    runComparison,
    setIsPredictionModalOpen,
    isHuman3DView,
    toggleHuman3DView
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'metrics' | 'layers'>('metrics');

  if (!selectedLake) return null;

  const currentObservation = observations[selectedObservationIndex] || null;
  const detectedArea = currentObservation?.detected_area_hectares ?? 0;
  const cadastralArea = selectedLake.area_hectares;
  const coverageRatio = cadastralArea > 0 ? Math.min(100, Math.round((detectedArea / cadastralArea) * 100)) : 0;
  const isEncroached = (selectedLake.encroachment_status || '').toLowerCase().includes('encroached');

  // Core Requirement: Area-over-time chart data
  const trendPoints = observations.map((o) => ({
    year: o.observation_date.split('-')[0],
    date: o.observation_date,
    area: o.detected_area_hectares ?? 0
  }));

  const baselineArea = trendPoints.length > 0 ? trendPoints[0].area : cadastralArea;
  const currentArea = currentObservation?.detected_area_hectares ?? baselineArea;
  const shrinkPct = baselineArea > 0 ? ((baselineArea - currentArea) / baselineArea) * 100 : 0;

  // Core Requirement: Automatic flag when size drops past a set threshold (20% contraction threshold)
  const SHRINK_THRESHOLD_PCT = 20.0;
  const isShrinkingPastThreshold = shrinkPct >= SHRINK_THRESHOLD_PCT;

  // SVG Chart Geometry calculations
  const maxArea = Math.max(...trendPoints.map((p) => p.area), cadastralArea, 1);
  const chartWidth = 280;
  const chartHeight = 65;
  const padX = 16;
  const padY = 12;

  const coords = trendPoints.map((p, idx) => {
    const x = padX + (idx / Math.max(1, trendPoints.length - 1)) * (chartWidth - 2 * padX);
    const y = chartHeight - padY - (p.area / maxArea) * (chartHeight - 2 * padY);
    return { x, y, ...p };
  });

  const pathD = coords.reduce((acc, c, idx) => {
    return idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
  }, '');

  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - padY} L ${coords[0].x} ${chartHeight - padY} Z`
    : '';

  // 20% Threshold line
  const thresholdAreaVal = baselineArea * 0.8;
  const thresholdY = chartHeight - padY - (thresholdAreaVal / maxArea) * (chartHeight - 2 * padY);

  return (
    <aside className="absolute top-[66px] right-4 z-30 pointer-events-auto">
      {/* 1. Minimized Pill */}
      {!isTelemetryOpen ? (
        <button
          onClick={() => setIsTelemetryOpen(true)}
          className="flex items-center space-x-2.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 hover:border-sky-300 px-3.5 py-2 rounded-xl shadow-md hover:shadow-lg text-xs text-slate-800 transition-all group"
        >
          <Activity className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-slate-900">{selectedLake.official_name}</span>
          <span className="font-mono text-sky-700 font-bold">
            {detectedArea.toFixed(1)} ha
          </span>
          {isShrinkingPastThreshold && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Shrinking Alert" />
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
        </button>
      ) : (
        /* 2. Expanded Detail Card in Clean Light Theme */
        <div className="w-80 sm:w-96 max-h-[calc(100vh-160px)] flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                  {selectedLake.official_name}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedLake.administrative_zone || 'Bengaluru Urban'} • {selectedLake.custodian || 'BBMP Lakes Department'}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <a
                href={`https://www.google.com/maps/@${selectedLake.latitude},${selectedLake.longitude},16z/data=!3m1!1e3`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open directly in Google Maps Satellite View"
                className="text-emerald-600 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setIsTelemetryOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Minimize card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-100 text-xs font-semibold bg-slate-50/50 p-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${
                activeTab === 'metrics'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Telemetry & History
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${
                activeTab === 'layers'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Map Layers
            </button>
          </div>

          {/* Content */}
          <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {activeTab === 'metrics' ? (
              <div className="space-y-3">
                {/* Surface Extent Stat Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-500 block font-medium">Active Water Area</span>
                    <span className="text-lg font-mono font-bold text-sky-700">
                      {detectedArea.toFixed(1)} ha
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {coverageRatio}% of basin
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-500 block font-medium">Cadastral Boundary</span>
                    <span className="text-lg font-mono font-bold text-slate-800">
                      {cadastralArea.toFixed(1)} ha
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Legal baseline
                    </span>
                  </div>
                </div>

                {/* Core Feature 2: Area-over-time chart */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                      <TrendingDown className="w-3.5 h-3.5 text-sky-600" />
                      <span>Area-over-Time Trend</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {trendPoints[0]?.year || '2017'} – {trendPoints[trendPoints.length - 1]?.year || '2026'}
                    </span>
                  </div>

                  {/* SVG Sparkline Container */}
                  <div className="relative w-full h-[65px] bg-white rounded-lg border border-slate-200/80 overflow-hidden flex items-center justify-center">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                      <defs>
                        <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* 20% Contraction Critical Threshold Line */}
                      <line
                        x1={padX}
                        y1={thresholdY}
                        x2={chartWidth - padX}
                        y2={thresholdY}
                        stroke="#EF4444"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        strokeOpacity="0.6"
                      />

                      {/* Area fill */}
                      {areaD && <path d={areaD} fill="url(#areaGradientLight)" />}

                      {/* Line stroke */}
                      {pathD && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Interactive Points */}
                      {coords.map((c, idx) => {
                        const isSelected = selectedObservationIndex === idx;
                        return (
                          <g
                            key={c.year}
                            className="cursor-pointer"
                            onClick={() => setSelectedObservationIndex(idx)}
                          >
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r={isSelected ? 4.5 : 3}
                              fill={isSelected ? '#0284C7' : '#FFFFFF'}
                              stroke={isSelected ? '#FFFFFF' : '#0284C7'}
                              strokeWidth="2"
                            />
                            <text
                              x={c.x}
                              y={chartHeight - 1}
                              textAnchor="middle"
                              fill={isSelected ? '#0284C7' : '#64748B'}
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight={isSelected ? 'bold' : 'normal'}
                            >
                              {c.year}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5 border-t border-slate-200/60">
                    <span>2017: {trendPoints[0]?.area.toFixed(1)} ha</span>
                    <span className={shrinkPct > 20 ? 'text-red-600 font-bold' : 'text-slate-800 font-bold'}>
                      {trendPoints[trendPoints.length - 1]?.year || '2026'}: {trendPoints[trendPoints.length - 1]?.area.toFixed(1)} ha
                    </span>
                  </div>
                </div>

                {/* Core Feature 3: Automatic Flag when size drops past threshold */}
                {isShrinkingPastThreshold && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-xs animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold text-red-800 block">
                        ⚠️ Automatic Flag: Shrinking Past Threshold
                      </span>
                      <p className="text-[11px] text-red-700 mt-0.5 leading-snug">
                        Significant surface area contraction of <strong className="font-mono">-{shrinkPct.toFixed(1)}%</strong> detected since baseline observation. Exceeds critical 20% shrinkage threshold.
                      </p>
                    </div>
                  </div>
                )}

                {/* Civic Encroachment Audit Status Card */}
                <div className={`rounded-xl p-2.5 border text-xs ${
                  isEncroached
                    ? 'bg-red-50/70 border-red-200 text-red-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center space-x-1.5">
                      {isEncroached ? (
                        <Shield className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{selectedLake.encroachment_status || 'Free of Intrusion (Restored)'}</span>
                    </span>
                    {isEncroached && (
                      <span className="font-mono text-red-700 font-bold bg-white px-2 py-0.5 rounded border border-red-200 text-[10px]">
                        +{selectedLake.encroached_area_hectares?.toFixed(1) || '0.0'} ha
                      </span>
                    )}
                  </div>
                  {isEncroached && (
                    <p className="text-[11px] text-red-700/90 mt-1 leading-snug">
                      Unauthorized layouts, commercial building developments, or road network encroachment identified within buffer zone.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Tab 2: Map Layers Toggle */
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="font-medium text-slate-700">Aerial Imagery Provider</span>
                  <div className="flex items-center bg-white p-0.5 rounded-md border border-slate-200 text-[10px]">
                    <button
                      onClick={() => setSatelliteProvider('sentinel')}
                      className={`px-2 py-0.5 rounded transition-all font-semibold ${
                        satelliteProvider === 'sentinel'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Copernicus Sentinel-2 Multi-Spectral Optical Imagery"
                    >
                      Sentinel-2
                    </button>
                    <button
                      onClick={() => setSatelliteProvider('google')}
                      className={`px-2 py-0.5 rounded transition-all font-semibold ${
                        satelliteProvider === 'google'
                          ? 'bg-emerald-100 text-emerald-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Google Maps Ultra-HD Hybrid Satellite (2026 sub-meter)"
                    >
                      Google HD
                    </button>
                    <button
                      onClick={() => setSatelliteProvider('esri')}
                      className={`px-2 py-0.5 rounded transition-all font-semibold ${
                        satelliteProvider === 'esri'
                          ? 'bg-sky-100 text-sky-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Esri World Imagery"
                    >
                      Esri
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="font-medium text-slate-700">Legal Cadastral Basin</span>
                  <input
                    type="checkbox"
                    checked={layers.cadastralBoundary}
                    onChange={() => toggleLayer('cadastralBoundary')}
                    className="accent-sky-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="font-medium text-slate-700">Satellite Water Mask</span>
                  <input
                    type="checkbox"
                    checked={layers.detectedWater}
                    onChange={() => toggleLayer('detectedWater')}
                    className="accent-sky-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="font-medium text-slate-700">Encroachment Land</span>
                  <input
                    type="checkbox"
                    checked={layers.lostWater}
                    onChange={() => toggleLayer('lostWater')}
                    className="accent-red-600 h-4 w-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Groq AI Future Simulation Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsPredictionModalOpen(true)}
                className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-center transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-orange-500/20 text-xs cursor-pointer"
                title="Run Groq LPU hydro-ecological prediction simulation for this lake"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>⚡ Groq AI Simulation & Predict</span>
              </button>
            </div>

            {/* Quick Action Footer Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-xs">
              <button
                onClick={() => {
                  if (observations.length >= 2) {
                    const older = observations[0].id;
                    const newer = observations[observations.length - 1].id;
                    runComparison(older, newer);
                  }
                  setActiveScreen('comparison-studio');
                }}
                className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-center font-semibold transition-colors flex items-center justify-center space-x-1"
                title="Open Side-by-Side Satellite Comparison Studio"
              >
                <Sliders className="w-3 h-3" />
                <span>Comparison</span>
              </button>
              <button
                onClick={() => setIsPredictionModalOpen(true)}
                className="py-1.5 px-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-800 border border-amber-300 rounded-lg text-center font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                title="Groq AI Hydro-Ecological Future Simulation"
              >
                <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                <span>AI Predict</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-center font-semibold transition-colors shadow-sm"
              >
                Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
