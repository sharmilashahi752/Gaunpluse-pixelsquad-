import React from 'react';
import { Layers, AlertTriangle, ShieldCheck, Route, HeartPulse, Home, RotateCcw } from 'lucide-react';
import { EDGES, BRIDGES, FACILITIES, SETTLEMENTS, ISSUES } from '../../data/demoVillage';

export function MapFilters({ activeFilter, onFilterChange, onReset, selectedFeature }) {
  // Compute counts for active badges
  const counts = {
    all: EDGES.length + FACILITIES.length + SETTLEMENTS.length,
    issues: ISSUES.length,
    bridges: BRIDGES.length,
    roads: EDGES.filter((e) => e.type === 'road').length,
    services: FACILITIES.length,
    settlements: SETTLEMENTS.length,
  };

  const filterOptions = [
    { id: 'all', label: 'All Infrastructure', icon: Layers, count: counts.all },
    {
      id: 'issues',
      label: 'Reported Issues',
      icon: AlertTriangle,
      count: counts.issues,
      accent: 'text-[#D45F53]',
      activeBadge: 'bg-[#D45F53] text-white',
    },
    { id: 'bridges', label: 'Bridges', icon: ShieldCheck, count: counts.bridges },
    { id: 'roads', label: 'Roads & Trails', icon: Route, count: counts.roads },
    { id: 'services', label: 'Essential Services', icon: HeartPulse, count: counts.services },
    { id: 'settlements', label: 'Settlements', icon: Home, count: counts.settlements },
  ];

  const hasActiveFilterOrSelection = activeFilter !== 'all' || selectedFeature !== null;

  return (
    <div className="bg-white/90 backdrop-blur-xs border border-[#42866A]/20 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#173D32]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#173D32]">
            Map Layer Filters
          </span>
          <span className="text-xs text-[#42866A]">
            ({counts.all} mapped assets in Sundar Gaun)
          </span>
        </div>

        {hasActiveFilterOrSelection && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D45F53] hover:text-[#B44335] transition-colors focus-visible:ring-2 focus-visible:ring-[#D45F53] rounded-md px-1.5 py-0.5"
            title="Reset filters and clear selected feature"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters & Selection</span>
          </button>
        )}
      </div>

      {/* Filter Buttons: Horizontal scrollable on mobile, flex-wrap on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {filterOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeFilter === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onFilterChange(opt.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
                isActive
                  ? 'bg-[#173D32] text-white shadow-xs'
                  : 'bg-[#F8F7F2] text-[#1B2923] hover:bg-[#DDEBE2] border border-[#42866A]/20'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-[#E3AD58]' : opt.accent || 'text-[#42866A]'
                }`}
              />
              <span>{opt.label}</span>
              <span
                className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : opt.id === 'issues'
                    ? 'bg-[#D45F53]/15 text-[#D45F53] font-bold'
                    : 'bg-[#DDEBE2] text-[#173D32]'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MapFilters;
