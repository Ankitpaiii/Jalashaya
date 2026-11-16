import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const TimelineController: React.FC = () => {
  const {
    observations,
    selectedObservationIndex,
    setSelectedObservationIndex,
    selectedLake,
    comparisonData,
    maskOpacity,
    setMaskOpacity
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2000);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || observations.length <= 1) return;

    const interval = setInterval(() => {
      const nextIdx = (useAppStore.getState().selectedObservationIndex + 1) % observations.length;
      setSelectedObservationIndex(nextIdx);
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, observations.length, playbackSpeed, setSelectedObservationIndex]);

  if (!selectedLake || observations.length === 0) return null;

  const currentObservation = observations[selectedObservationIndex];
  const detectedArea = currentObservation?.detected_area_hectares ?? 0;
  const lostArea = comparisonData && comparisonData.area_change_hectares < 0
    ? Math.abs(comparisonData.area_change_hectares)
    : 0;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-2xl pointer-events-auto">
      {/* Floating Encroachment Legend in Light Mode */}
      <div className="flex items-center justify-center gap-3.5 mb-2 text-[11px] font-mono text-slate-800 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/90 w-fit mx-auto shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 border border-sky-400" />
          <span className="font-medium">Active Water ({detectedArea.toFixed(1)} ha)</span>
        </span>
        {selectedObservationIndex > 0 && lostArea > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600 border border-red-500 animate-pulse" />
            <span className="text-red-700 font-bold">Urban Encroachment (+{lostArea.toFixed(1)} ha)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Baseline (0 ha encroached)</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-dashed border-sky-500" />
          <span className="text-slate-500">Cadastral Basin</span>
        </span>
        <span className="text-slate-300">|</span>
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className="text-slate-500 font-sans">Mask:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={maskOpacity}
            onChange={(e) => setMaskOpacity(parseFloat(e.target.value))}
            className="w-14 accent-red-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            title="Adjust opacity to see houses and roads beneath the red encroachment overlay"
          />
          <span className="font-mono text-red-600 font-bold w-6 text-right text-[10px]">
            {Math.round(maskOpacity * 100)}%
          </span>
        </div>
      </div>

      {/* Main Timeline Card */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl px-4 py-2.5 flex items-center justify-between gap-3 text-slate-800">
        {/* Playback Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => {
              setIsPlaying(false);
              setSelectedObservationIndex(Math.max(0, selectedObservationIndex - 1));
            }}
            disabled={selectedObservationIndex === 0}
            title="Previous observation"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-25 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play temporal time-lapse'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setSelectedObservationIndex(
                Math.min(observations.length - 1, selectedObservationIndex + 1)
              );
            }}
            disabled={selectedObservationIndex === observations.length - 1}
            title="Next observation"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-25 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Track with Years */}
        <div className="flex-1 px-3 relative flex items-center justify-between min-w-[200px]">
          {/* Subtle line */}
          <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-slate-200 -translate-y-1/2 rounded" />

          {observations.map((obs, idx) => {
            const isSelected = selectedObservationIndex === idx;
            const year = obs.observation_date.split('-')[0];
            const is2017 = year === '2017';

            return (
              <button
                key={obs.id}
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedObservationIndex(idx);
                }}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
                title={is2017 ? '2017 Pristine Baseline State' : `${year} Observation & Encroachment`}
              >
                {/* Marker Dot */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isSelected
                      ? is2017
                        ? 'bg-emerald-600 border-white ring-2 ring-emerald-600 scale-125 shadow-sm'
                        : 'bg-sky-600 border-white ring-2 ring-sky-600 scale-125 shadow-sm'
                      : is2017
                      ? 'bg-emerald-100 border-emerald-400 group-hover:border-emerald-600'
                      : 'bg-white border-slate-300 group-hover:border-sky-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono mt-1 font-semibold transition-colors flex items-center gap-0.5 ${
                    isSelected
                      ? is2017
                        ? 'text-emerald-700 font-bold'
                        : 'text-sky-700 font-bold'
                      : is2017
                      ? 'text-emerald-600'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                >
                  {is2017 && <span className="text-[9px]">🌿</span>}
                  <span>{year}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Date & Surface Area Readout */}
        <div className="shrink-0 text-right font-mono text-xs pl-3 border-l border-slate-200/80">
          <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{currentObservation?.observation_date}</span>
          </div>
          <div className="font-bold text-sky-700 text-sm">
            {detectedArea.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">ha water</span>
          </div>
        </div>
      </div>
    </div>
  );
};
