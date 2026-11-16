import React from 'react';
import {
  Waves,
  Compass,
  Sliders,
  Sparkles,
  BookOpen,
  RotateCcw,
  FileText,
  Home,
  SplitSquareVertical,
  FlaskConical
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { AppScreen } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    selectedLake,
    resetCameraToBengaluru,
    setIsReportModalOpen,
    lakes,
    fetchLakes,
    selectLake,
    satelliteProvider,
    setSatelliteProvider,
    isSwipeMode,
    setIsSwipeMode,
    isHuman3DView,
    toggleHuman3DView,
    setIsResearchModalOpen,
    observations,
    selectedObservationIndex
  } = useAppStore();

  const currentObservation = observations[selectedObservationIndex] || null;
  const currentYear = currentObservation ? currentObservation.observation_date.split('-')[0] : '2026';

  const handleNavClick = async (screen: AppScreen) => {
    if (screen === 'comparison-studio' || screen === 'restoration-lab') {
      if (!selectedLake) {
        let currentLakes = lakes;
        if (currentLakes.length === 0) {
          await fetchLakes();
          currentLakes = useAppStore.getState().lakes;
        }
        const bellandur = currentLakes.find((l) => l.id === 'lake-bellandur') || currentLakes[0];
        if (bellandur) {
          await selectLake(bellandur.id);
        }
      }
    }
    setActiveScreen(screen);
  };

  const navItems: { screen: AppScreen; label: string; icon: React.ReactNode }[] = [
    { screen: 'landing', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { screen: 'command-center', label: 'Digital Twin', icon: <Compass className="w-3.5 h-3.5" /> },
    { screen: 'comparison-studio', label: 'Comparison', icon: <Sliders className="w-3.5 h-3.5" /> },
    { screen: 'restoration-lab', label: 'Restoration Lab', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { screen: 'methodology', label: 'Methodology', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  const encroachedCount = lakes.filter((l) =>
    (l.encroachment_status || '').toLowerCase().includes('encroached')
  ).length || 136;
  const freeCount = (lakes.length > 0 ? lakes.length : 185) - encroachedCount;

  return (
    <header className="absolute top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
      {/* 1. Left: Brand & Navigation Tabs in a single compact unified cluster */}
      <div className="flex items-center space-x-2 pointer-events-auto shrink-0">
        <button
          onClick={() => setActiveScreen('landing')}
          className="flex items-center space-x-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-xs">
            <Waves className="w-3.5 h-3.5 font-bold" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-wider text-slate-900 group-hover:text-sky-600 transition-colors">JALASHAYA</span>
            <span className="text-[9px] font-mono text-sky-700 ml-1 uppercase font-bold bg-sky-50 px-1 py-0.2 rounded border border-sky-200">Twin</span>
          </div>
        </button>

        {/* Screen Navigation Tabs */}
        <nav className="flex items-center space-x-0.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 p-0.5 rounded-xl shadow-sm">
          {navItems.map((item) => {
            const isActive = activeScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => handleNavClick(item.screen)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Right: Satellite Provider, Tools & Actions */}
      <div className="flex items-center space-x-1.5 pointer-events-auto shrink-0">
        {/* Map Provider Toggle: Sentinel-2 vs Google HD vs Esri Maxar */}
        <div className="hidden lg:flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/90 shadow-xs text-[11px] font-semibold whitespace-nowrap">
          <button
            onClick={() => setSatelliteProvider('sentinel')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
              satelliteProvider === 'sentinel'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={`Copernicus Sentinel-2 (${currentYear}) Multi-Spectral Optical Satellite Imagery`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
            <span>Sentinel-2 ({currentYear})</span>
          </button>
          <button
            onClick={() => setSatelliteProvider('google')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
              satelliteProvider === 'google'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Google Maps Ultra-HD Hybrid Satellite (2026 High-Res)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Google</span>
          </button>
          <button
            onClick={() => setSatelliteProvider('esri')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
              satelliteProvider === 'esri'
                ? 'bg-white text-sky-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Esri World Imagery (Maxar 30cm)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Esri</span>
          </button>
        </div>

        {/* Swipe Curtain Toggle */}
        <button
          onClick={() => setIsSwipeMode(!isSwipeMode)}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs whitespace-nowrap transition-all ${
            isSwipeMode
              ? 'bg-sky-600 text-white shadow-sky-600/20'
              : 'bg-white/95 backdrop-blur-xl border border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
          title="Compare 2017 baseline vs contemporary satellite photos with an interactive swipe curtain"
        >
          <SplitSquareVertical className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden xl:inline">{isSwipeMode ? 'Exit Swipe' : 'Swipe'}</span>
        </button>

        {/* 3D Human Road View Perspective Toggle */}
        <button
          onClick={toggleHuman3DView}
          className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl text-xs font-semibold shadow-xs whitespace-nowrap transition-all ${
            isHuman3DView
              ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20'
              : 'bg-white/95 backdrop-blur-xl border border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle 3D Human Road Perspective: Ground level view of perimeter roads, buffer zones, and surrounding buildings"
        >
          <span>{isHuman3DView ? '🚶‍♂️ 3D' : '🦅 2D'}</span>
        </button>

        {/* Reset View */}
        <button
          onClick={resetCameraToBengaluru}
          title="Reset Camera to Bengaluru Overview"
          className="flex items-center space-x-1 bg-white/95 backdrop-blur-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 p-1.5 rounded-xl text-xs font-medium shadow-xs transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {/* Scientific Research Lab */}
        <button
          onClick={() => setIsResearchModalOpen(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs shadow-xs shadow-sky-600/20 transition-all cursor-pointer whitespace-nowrap"
          title="Open Peer-Reviewed Scientific Research Framework & Sentinel-1 Experiments"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Research Lab</span>
        </button>

        {/* Audit Report */}
        {selectedLake && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-2.5 py-1.5 rounded-xl text-xs shadow-xs shadow-sky-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Report</span>
          </button>
        )}
      </div>
    </header>
  );
};
