import React, { useState } from 'react';
import { Search, MapPin, ChevronDown, X, Droplet, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const LakeExplorerPanel: React.FC = () => {
  const {
    lakes,
    selectedLakeId,
    selectLake,
    searchQuery,
    setSearchQuery,
    selectedZone,
    setSelectedZone,
    isExplorerOpen,
    setIsExplorerOpen
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENCROACHED' | 'FREE'>('ALL');

  const zones = [
    'ALL',
    'Mahadevapura',
    'Bommanahalli',
    'Yelahanka',
    'RR Nagar',
    'East',
    'South',
    'Dasarahalli',
    'West'
  ];

  const filteredLakes = lakes.filter((l) => {
    const matchesSearch =
      l.official_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.administrative_zone && l.administrative_zone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesZone = selectedZone === 'ALL' || !selectedZone || l.administrative_zone === selectedZone;

    const isEnc = (l.encroachment_status || '').toLowerCase().includes('encroached');
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ENCROACHED' && isEnc) ||
      (statusFilter === 'FREE' && !isEnc);

    return matchesSearch && matchesZone && matchesStatus;
  });

  const encroachedCount = lakes.filter((l) =>
    (l.encroachment_status || '').toLowerCase().includes('encroached')
  ).length;
  const freeCount = lakes.length - encroachedCount;

  const selectedLakeObj = lakes.find((l) => l.id === selectedLakeId);

  return (
    <aside className="absolute top-[66px] left-[120px] z-30 pointer-events-auto">
      {/* 1. Collapsed Floating Search Pill */}
      {!isExplorerOpen ? (
        <button
          onClick={() => setIsExplorerOpen(true)}
          className="flex items-center space-x-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 hover:border-sky-300 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md text-xs text-slate-800 transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-slate-900 truncate max-w-[140px]">
            {selectedLakeObj ? selectedLakeObj.official_name : 'Explore Lakes'}
          </span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold border border-slate-200">
            {lakes.length}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
        </button>
      ) : (
        /* 2. Expanded Clean Floating Drawer in Light Mode */
        <div className="w-88 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <Droplet className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-bold tracking-tight text-slate-900 uppercase">
                Bengaluru Civic Lake Census
              </span>
              <span className="text-[10px] font-mono bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                {filteredLakes.length} / {lakes.length}
              </span>
            </div>
            <button
              onClick={() => setIsExplorerOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Encroachment Audit Status Tabs */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-100/70 border-b border-slate-200 text-xs gap-1 font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`py-1 rounded-md transition-colors ${statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              All ({lakes.length})
            </button>
            <button
              onClick={() => setStatusFilter('ENCROACHED')}
              className={`py-1 rounded-md flex items-center justify-center space-x-1 transition-colors ${statusFilter === 'ENCROACHED'
                ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                : 'text-slate-500 hover:text-red-600'
                }`}
            >
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span>Encroached ({encroachedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('FREE')}
              className={`py-1 rounded-md flex items-center justify-center space-x-1 transition-colors ${statusFilter === 'FREE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                : 'text-slate-500 hover:text-emerald-600'
                }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Free ({freeCount})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search lake name or ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Zone Chips Horizontal Scroll */}
          <div className="px-2 py-1.5 border-b border-slate-100 flex items-center space-x-1 overflow-x-auto text-[10px] bg-slate-50/50">
            {zones.map((zone) => {
              const isSelected = (selectedZone === zone) || (zone === 'ALL' && !selectedZone);
              return (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone === 'ALL' ? null : zone)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap font-medium transition-colors ${isSelected
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                    }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>

          {/* Lake List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredLakes.map((lake) => {
              const isSelected = lake.id === selectedLakeId;
              const isEnc = (lake.encroachment_status || '').toLowerCase().includes('encroached');

              return (
                <div
                  key={lake.id}
                  onClick={() => {
                    selectLake(lake.id);
                    setIsExplorerOpen(false);
                  }}
                  className={`p-2.5 hover:bg-sky-50/60 cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-sky-50 border-l-4 border-sky-600' : ''
                    }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-900">{lake.official_name}</span>
                      {isEnc ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                          Encroached
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          Restored
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {lake.administrative_zone || 'Bengaluru'} • {lake.area_hectares.toFixed(1)} ha
                    </p>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
