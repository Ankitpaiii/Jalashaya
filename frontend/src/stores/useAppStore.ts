import { create } from 'zustand';
import {
  LakeSummary,
  LakeDetail,
  SatelliteObservation,
  ComparisonData,
  RestorationSimulation,
  MapLayerState,
  AppScreen
} from '../types';
import { api } from '../services/api';

interface AppStoreState {
  // Navigation & Screen
  activeScreen: AppScreen;
  setActiveScreen: (screen: AppScreen) => void;

  // Lakes
  lakes: LakeSummary[];
  selectedLakeId: string | null;
  selectedLake: LakeDetail | null;
  searchQuery: string;
  selectedZone: string | null;
  isLoadingLakes: boolean;

  // Observations & Timeline
  observations: SatelliteObservation[];
  selectedObservationIndex: number;
  isLoadingObservations: boolean;

  // Active Map Layers
  layers: MapLayerState;
  toggleLayer: (layer: keyof MapLayerState) => void;
  satelliteProvider: 'sentinel' | 'google' | 'esri';
  setSatelliteProvider: (provider: 'sentinel' | 'google' | 'esri') => void;

  // Camera Target
  cameraTarget: { center: [number, number]; zoom: number; pitch: number; bearing: number } | null;

  // Comparison Studio
  comparisonOlderId: string | null;
  comparisonNewerId: string | null;
  comparisonData: ComparisonData | null;
  isLoadingComparison: boolean;

  // Restoration Simulation Lab
  restorationTargetPct: number;
  restorationData: RestorationSimulation | null;
  isLoadingRestoration: boolean;

  // Satellite Swipe & Visual Difference Inspection
  isSwipeMode: boolean;
  setIsSwipeMode: (enabled: boolean) => void;
  swipePosition: number; // 0 to 100%
  setSwipePosition: (pos: number) => void;
  maskOpacity: number; // 0.0 to 1.0
  setMaskOpacity: (opacity: number) => void;
  showSatelliteOverlay: boolean;
  setShowSatelliteOverlay: (show: boolean) => void;

  // System Health / Transparency
  systemHealth: any | null;

  // UI Panels State
  isExplorerOpen: boolean;
  setIsExplorerOpen: (open: boolean) => void;
  isTelemetryOpen: boolean;
  setIsTelemetryOpen: (open: boolean) => void;
  isLayersOpen: boolean;
  setIsLayersOpen: (open: boolean) => void;

  // Modals & 3D Human Perspective
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  isPredictionModalOpen: boolean;
  setIsPredictionModalOpen: (open: boolean) => void;
  isResearchModalOpen: boolean;
  setIsResearchModalOpen: (open: boolean) => void;
  isHuman3DView: boolean;
  toggleHuman3DView: () => void;

  // Actions
  fetchLakes: () => Promise<void>;
  selectLake: (lakeId: string) => Promise<void>;
  setSelectedObservationIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedZone: (zone: string | null) => void;
  runComparison: (olderId?: string, newerId?: string) => Promise<void>;
  updateRestorationSlider: (pct: number) => Promise<void>;
  fetchHealth: () => Promise<void>;
  resetCameraToBengaluru: () => void;
}

const getInitialScreen = (): AppScreen => {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.toLowerCase();
  if (hash === '#map' || hash === '#digital-twin') return 'command-center';
  if (hash === '#comparison' || hash === '#compare') return 'comparison-studio';
  if (hash === '#simulation-lab' || hash === '#restoration') return 'restoration-lab';
  if (hash === '#methodology') return 'methodology';
  return 'landing';
};

export const useAppStore = create<AppStoreState>((set, get) => ({
  activeScreen: getInitialScreen(),
  setActiveScreen: (screen) => {
    set({ activeScreen: screen });
    if (typeof window !== 'undefined') {
      const hashMap: Record<AppScreen, string> = {
        'landing': '#home',
        'command-center': '#map',
        'lake-explorer': '#explorer',
        'comparison-studio': '#comparison',
        'restoration-lab': '#simulation-lab',
        'methodology': '#methodology',
        'about': '#about'
      };
      const landingSections = ['#audit', '#features', '#flagship', '#simulation', '#tech'];
      const isCurrentLandingSection = landingSections.some((sec) => window.location.hash.startsWith(sec));
      if (window.location.hash !== hashMap[screen] && !isCurrentLandingSection) {
        window.history.replaceState(null, '', hashMap[screen] || '#home');
      }
    }
  },

  lakes: [],
  selectedLakeId: null,
  selectedLake: null,
  searchQuery: '',
  selectedZone: null,
  isLoadingLakes: false,

  observations: [],
  selectedObservationIndex: 0,
  isLoadingObservations: false,

  layers: {
    satellite: true,
    cadastralBoundary: true,
    detectedWater: true,
    lostWater: true,
    gainedWater: true,
    labels: true,
    terrain3D: true,
  },
  satelliteProvider: 'sentinel',
  setSatelliteProvider: (provider) => set({ satelliteProvider: provider }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  cameraTarget: null,

  comparisonOlderId: null,
  comparisonNewerId: null,
  comparisonData: null,
  isLoadingComparison: false,

  restorationTargetPct: 50,
  restorationData: null,
  isLoadingRestoration: false,

  // Satellite Swipe & Visual Difference Inspection defaults
  isSwipeMode: false,
  setIsSwipeMode: (enabled) => set({ isSwipeMode: enabled }),
  swipePosition: 50,
  setSwipePosition: (pos) => set({ swipePosition: pos }),
  maskOpacity: 0.55,
  setMaskOpacity: (opacity) => set({ maskOpacity: opacity }),
  showSatelliteOverlay: true,
  setShowSatelliteOverlay: (show) => set({ showSatelliteOverlay: show }),

  isExplorerOpen: false,
  setIsExplorerOpen: (open) => set({ isExplorerOpen: open }),
  isTelemetryOpen: true,
  setIsTelemetryOpen: (open) => set({ isTelemetryOpen: open }),
  isLayersOpen: false,
  setIsLayersOpen: (open) => set({ isLayersOpen: open }),

  systemHealth: null,
  isReportModalOpen: false,
  setIsReportModalOpen: (open) => set({ isReportModalOpen: open }),
  isPredictionModalOpen: false,
  setIsPredictionModalOpen: (open) => set({ isPredictionModalOpen: open }),
  isResearchModalOpen: false,
  setIsResearchModalOpen: (open) => set({ isResearchModalOpen: open }),
  isHuman3DView: false,
  toggleHuman3DView: () => {
    const next = !get().isHuman3DView;
    set({ isHuman3DView: next });
    const { selectedLake } = get();
    if (selectedLake) {
      if (next) {
        set({
          cameraTarget: {
            center: [selectedLake.longitude, selectedLake.latitude],
            zoom: 16.5,
            pitch: 68,
            bearing: 42
          }
        });
      } else {
        set({
          cameraTarget: {
            center: [selectedLake.longitude, selectedLake.latitude],
            zoom: 14.5,
            pitch: 0,
            bearing: 0
          }
        });
      }
    }
  },

  fetchLakes: async () => {
    set({ isLoadingLakes: true });
    try {
      const lakes = await api.getLakes();
      set({ lakes, isLoadingLakes: false });
      if (!get().selectedLakeId && lakes.length > 0) {
        const bellandur = lakes.find((l) => l.id === 'lake-bellandur') || lakes[0];
        get().selectLake(bellandur.id);
      }
    } catch (err) {
      console.error('Failed to load lakes', err);
      set({ isLoadingLakes: false });
    }
  },

  selectLake: async (lakeId: string) => {
    set({ selectedLakeId: lakeId, isLoadingObservations: true });
    try {
      const [lakeDetail, observations] = await Promise.all([
        api.getLake(lakeId),
        api.getObservations(lakeId),
      ]);

      const lastIdx = observations.length > 0 ? observations.length - 1 : 0;
      const is3D = get().isHuman3DView;
      set({
        selectedLake: lakeDetail,
        observations,
        selectedObservationIndex: lastIdx,
        isLoadingObservations: false,
        cameraTarget: {
          center: [lakeDetail.longitude, lakeDetail.latitude],
          zoom: is3D ? 16.5 : 14.2,
          pitch: is3D ? 68 : 0,
          bearing: is3D ? 42 : 0,
        },
      });

      if (observations.length >= 2) {
        const older = observations[0].id;
        const newer = observations[observations.length - 1].id;
        set({ comparisonOlderId: older, comparisonNewerId: newer });
        get().runComparison(older, newer);
      }
    } catch (err) {
      console.error('Failed to select lake', err);
      set({ isLoadingObservations: false });
    }
  },

  setSelectedObservationIndex: (index: number) => {
    set({ selectedObservationIndex: index });
    const { observations, selectedLakeId } = get();
    if (observations && observations.length >= 2 && selectedLakeId) {
      const baseline = observations[0].id;
      const current = observations[index]?.id;
      if (index === 0) {
        set({ comparisonData: null, comparisonOlderId: baseline, comparisonNewerId: baseline });
      } else if (current) {
        get().runComparison(baseline, current);
      }
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedZone: (zone: string | null) => set({ selectedZone: zone }),

  runComparison: async (olderId?: string, newerId?: string) => {
    const { selectedLakeId, observations } = get();
    if (!selectedLakeId || observations.length < 2) return;

    const oldId = olderId || observations[0].id;
    const newId = newerId || observations[observations.length - 1].id;

    set({ isLoadingComparison: true, comparisonOlderId: oldId, comparisonNewerId: newId });
    try {
      const cmp = await api.compareObservations(selectedLakeId, oldId, newId);
      set({ comparisonData: cmp, isLoadingComparison: false });
    } catch (err) {
      console.error('Failed to run comparison', err);
      set({ isLoadingComparison: false });
    }
  },

  updateRestorationSlider: async (pct: number) => {
    set({ restorationTargetPct: pct });
    const { selectedLakeId } = get();
    if (!selectedLakeId) return;

    set({ isLoadingRestoration: true });
    try {
      const sim = await api.simulateRestoration(selectedLakeId, pct);
      set({ restorationData: sim, isLoadingRestoration: false });
    } catch (err) {
      console.error('Failed to simulate restoration', err);
      set({ isLoadingRestoration: false });
    }
  },

  fetchHealth: async () => {
    try {
      const health = await api.getHealth();
      set({ systemHealth: health });
    } catch (err) {
      console.error('Failed to fetch system health', err);
    }
  },

  resetCameraToBengaluru: () => {
    set({
      cameraTarget: {
        center: [77.6300, 12.9600],
        zoom: 11.2,
        pitch: 0,
        bearing: 0,
      }
    });
  }
}));
