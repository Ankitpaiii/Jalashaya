import React, { useState } from 'react';
import {
  MoreVertical,
  X,
  BarChart3,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  Layers,
  FileText,
  Home,
  ArrowRight,
  Maximize2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const LeftMenuDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulation' | 'tools'>('dashboard');

  const {
    lakes,
    selectedLake,
    selectLake,
    setActiveScreen,
    setIsSwipeMode,
    setIsReportModalOpen,
    restorationTargetPct,
    updateRestorationSlider
  } = useAppStore();

  const encroachedCount = lakes.filter((l) => l.encroachment_status !== 'Free of Intrusion (Restored)').length;
  const freeCount = lakes.length - encroachedCount;

  // Top shrinking lakes for the leaderboard
  const topShrinking = [
    { name: 'Bellandur Lake', zone: 'Mahadevapura', drop: 63.3, current: 119.0, baseline: 324.5 },
    { name: 'Varthur Lake', zone: 'Mahadevapura', drop: 58.2, current: 75.3, baseline: 180.2 },
    { name: 'Byramangala Reservoir', zone: 'South', drop: 45.1, current: 142.0, baseline: 258.6 },
    { name: 'Horamavu Agara Lake', zone: 'Mahadevapura', drop: 41.0, current: 18.2, baseline: 30.8 },
    { name: 'Hebbal Lake', zone: 'Yelahanka', drop: 38.5, current: 42.1, baseline: 68.5 },
    { name: 'Madiwala Lake', zone: 'South', drop: 32.4, current: 82.0, baseline: 121.3 },
    { name: 'Kaikondrahalli Lake', zone: 'Mahadevapura', drop: 28.1, current: 17.5, baseline: 24.3 }
  ];

  const handleSelectShrinkingLake = (lakeName: string) => {
    const match = lakes.find((l) => l.official_name.toLowerCase().includes(lakeName.toLowerCase()));
    if (match) {
      selectLake(match.id);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Analytics Trigger Button on the Left */}
      <div className="absolute top-[66px] left-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-1.5 bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-sm hover:shadow-md rounded-xl px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all group"
          title="Open Dashboard Analysis & Restoration Simulation"
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-slate-700">Analytics</span>
        </button>
      </div>

      {/* Slide-out Left Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex">
          <div className="bg-white border-r border-slate-200 shadow-2xl w-full max-w-md h-full flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Control Hub & Analytics</h3>
                  <p className="text-[11px] text-slate-500">Dashboard Analysis & Simulation Lab</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-semibold bg-slate-100/60 p-1 gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dashboard Analysis</span>
              </button>
              <button
                onClick={() => setActiveTab('simulation')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'simulation'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulation Lab</span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'tools'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Tools</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {activeTab === 'dashboard' && (
                <>
                  {/* Civic Inventory Summary */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2.5">
                      Bengaluru Civic Lake Census (185 Lakes)
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl">
                        <div className="flex items-center space-x-1.5 text-red-700 text-xs font-bold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Encroached</span>
                        </div>
                        <div className="text-2xl font-extrabold text-red-700 mt-1 font-mono">
                          {encroachedCount || 136}
                        </div>
                        <span className="text-[10px] text-red-600/80 block mt-0.5">73.5% of water bodies</span>
                      </div>

                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                        <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Intrusion-Free</span>
                        </div>
                        <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                          {freeCount || 49}
                        </div>
                        <span className="text-[10px] text-emerald-600/80 block mt-0.5">26.5% restored / pristine</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Shrinking Lakes Leaderboard */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center space-x-1">
                        <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                        <span>Critical Shrinkage Leaderboard</span>
                      </h4>
                      <span className="text-[10px] font-mono text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        Drop ≥ 20%
                      </span>
                    </div>

                    <div className="space-y-2">
                      {topShrinking.map((lake, idx) => (
                        <div
                          key={lake.name}
                          onClick={() => handleSelectShrinkingLake(lake.name)}
                          className="p-3 bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-900 group-hover:text-sky-700 block">
                                {lake.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {lake.zone} • {lake.current} ha (was {lake.baseline} ha)
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-extrabold text-red-600 font-mono block">
                              -{lake.drop}%
                            </span>
                            <span className="text-[9px] text-slate-400 flex items-center justify-end group-hover:text-sky-600">
                              Fly to <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'simulation' && (
                <div className="space-y-4">
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-slate-700">
                    <span className="font-bold text-sky-800 block mb-1">Hydrological Basin Simulator</span>
                    Simulate reclaiming encroached land and restoring legal cadastral basin boundaries for{' '}
                    <span className="font-bold text-slate-900">{selectedLake?.official_name || 'selected lake'}</span>.
                  </div>

                  {/* Target Percentage Slider */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Rejuvenation Target:</span>
                      <span className="font-mono text-base font-extrabold text-sky-600">
                        {restorationTargetPct}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={restorationTargetPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateRestorationSlider(val);
                      }}
                      className="w-full h-2 accent-sky-600 cursor-pointer bg-slate-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>10% (Perimeter)</span>
                      <span>50% (Core Basin)</span>
                      <span>100% (Full Cadastre)</span>
                    </div>
                  </div>

                  {/* Quick Simulation Trigger */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setActiveScreen('restoration-lab');
                    }}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-sky-600/20 transition-all"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Open Full 3D Simulation Lab</span>
                  </button>
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-2.5 text-xs">
                  <button
                    onClick={async () => {
                      setIsOpen(false);
                      if (!selectedLake && lakes.length > 0) {
                        const bellandur = lakes.find((l) => l.id === 'lake-bellandur') || lakes[0];
                        await selectLake(bellandur.id);
                      }
                      setActiveScreen('comparison-studio');
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between font-medium text-slate-800 transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-sky-600" />
                      <span>Side-by-Side Satellite Studio</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsSwipeMode(true);
                      setActiveScreen('command-center');
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between font-medium text-slate-800 transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-cyan-600" />
                      <span>In-Map Satellite Curtain Swipe</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsReportModalOpen(true);
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between font-medium text-slate-800 transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Official Civic Compliance Report</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setActiveScreen('landing');
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between font-medium text-slate-800 transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Home className="w-4 h-4 text-indigo-600" />
                      <span>Return to Animated Landing Page</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
