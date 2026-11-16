import React, { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { GeospatialMap } from './maps/GeospatialMap';
import { Navbar } from './components/Navbar';
import { LeftMenuDrawer } from './features/navigation/LeftMenuDrawer';
import { LakeExplorerPanel } from './features/lake-explorer/LakeExplorerPanel';
import { LakeTelemetryCard } from './features/digital-twin/LakeTelemetryCard';
import { TimelineController } from './features/timeline/TimelineController';
import { ComparisonStudioModal } from './features/comparison/ComparisonStudioModal';
import { RestorationLabModal } from './features/restoration/RestorationLabModal';
import { EvidenceReportModal } from './features/reports/EvidenceReportModal';
import { MethodologyView } from './features/methodology/MethodologyView';
import { GroqPredictionModal } from './features/predictions/GroqPredictionModal';
import { ResearchLabModal } from './features/research/ResearchLabModal';
import { LandingPage } from './features/landing/LandingPage';

export const App: React.FC = () => {
  const { fetchLakes, fetchHealth, isLoadingLakes, activeScreen, setActiveScreen, selectedLake, lakes, selectLake } = useAppStore();

  useEffect(() => {
    fetchLakes();
    fetchHealth();
  }, [fetchLakes, fetchHealth]);

  // Handle URL Hash navigation on load and when hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();

      if (
        hash === '#audit' ||
        hash === '#features' ||
        hash === '#flagship' ||
        hash === '#simulation' ||
        hash === '#tech'
      ) {
        setActiveScreen('landing');
        const id = hash.replace('#', '');
        const scrollToTarget = (attempts = 0) => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else if (attempts < 15) {
            setTimeout(() => scrollToTarget(attempts + 1), 60);
          }
        };
        setTimeout(() => scrollToTarget(0), 50);
      } else if (hash === '#home' || hash === '#landing' || hash === '' || hash === '#') {
        setActiveScreen('landing');
      } else if (hash === '#map' || hash === '#digital-twin') {
        setActiveScreen('command-center');
      } else if (hash === '#comparison' || hash === '#compare') {
        setActiveScreen('comparison-studio');
      } else if (hash === '#simulation-lab' || hash === '#restoration') {
        setActiveScreen('restoration-lab');
      } else if (hash === '#methodology') {
        setActiveScreen('methodology');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setActiveScreen]);

  // Fallback auto-select flagship lake when opening lake-dependent views
  useEffect(() => {
    if (
      (activeScreen === 'comparison-studio' || activeScreen === 'restoration-lab') &&
      !selectedLake &&
      lakes.length > 0
    ) {
      const bellandur = lakes.find((l) => l.official_name.toLowerCase().includes('bellandur')) || lakes[0];
      selectLake(bellandur.id);
    }
  }, [activeScreen, selectedLake, lakes, selectLake]);

  if (activeScreen === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100">
      {/* 1. Full-Screen Geospatial Environment */}
      <GeospatialMap />

      {/* 2. Top HUD Navigation (Light Mode) */}
      <Navbar />

      {/* 3. Three Dots Floating Menu on Left Hand Side (Dashboard Analysis & Simulation) */}
      <LeftMenuDrawer />

      {/* 4. Left Side Lake Explorer Drawer */}
      <LakeExplorerPanel />

      {/* 5. Right Side Lake Telemetry Panel */}
      <LakeTelemetryCard />

      {/* 6. Bottom Temporal Simulation Timeline Controller */}
      <TimelineController />

      {/* 7. Context Modals */}
      <ComparisonStudioModal />
      <RestorationLabModal />
      <EvidenceReportModal />
      <MethodologyView />
      <GroqPredictionModal />
      <ResearchLabModal />

      {/* Subtle initial loading splash in Light Theme */}
      {isLoadingLakes && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-extrabold tracking-widest text-slate-900">JALASHAYA</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Initializing Bengaluru Water Body Digital Twin...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
