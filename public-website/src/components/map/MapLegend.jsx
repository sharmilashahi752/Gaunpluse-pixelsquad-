import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export function MapLegend() {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems = [
    {
      label: 'Motorable Road',
      symbol: (
        <span className="w-6 h-1.5 rounded-full bg-[#173D32] inline-block shadow-2xs" />
      ),
      desc: 'Paved or gravel vehicle route',
    },
    {
      label: 'Foot Trail / Track',
      symbol: (
        <span
          className="w-6 h-1 inline-block border-b-2 border-dashed border-[#8A7356]"
        />
      ),
      desc: 'Single-file or pack trail',
    },
    {
      label: 'Operational Bridge',
      symbol: (
        <span className="w-4 h-4 rounded-full bg-[#173D32] border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#E3AD58] shadow-xs">
          A
        </span>
      ),
      desc: 'Verified stable crossing',
    },
    {
      label: 'Critical Damaged Bridge',
      symbol: (
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D45F53] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#D45F53] border-2 border-white items-center justify-center text-[8px] font-bold text-white shadow-xs">
            !
          </span>
        </span>
      ),
      desc: 'Pier scour / access threat',
    },
    {
      label: 'Essential Service',
      symbol: (
        <span className="w-4 h-4 rounded-md bg-[#42866A] border border-white flex items-center justify-center text-[9px] text-white font-bold shadow-xs">
          +
        </span>
      ),
      desc: 'Health post or basic school',
    },
    {
      label: 'Settlement Cluster',
      symbol: (
        <span className="w-4 h-4 rounded-full bg-[#DDEBE2] border-2 border-[#173D32] flex items-center justify-center text-[8px] text-[#173D32] font-bold shadow-xs">
          H
        </span>
      ),
      desc: 'Basti residential area',
    },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-[#42866A]/20 rounded-xl p-3 shadow-xs text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-[#173D32]">
          <Info className="w-3.5 h-3.5 text-[#42866A]" />
          <span>Map Symbology Legend</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="sm:hidden p-1 text-[#42866A] hover:text-[#173D32]"
          aria-label={isExpanded ? 'Collapse map legend' : 'Expand map legend'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-[#42866A]/15">
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="shrink-0 flex items-center justify-center w-6">
                {item.symbol}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#173D32] truncate text-[11px]">
                  {item.label}
                </p>
                <p className="text-[10px] text-[#1B2923]/60 truncate leading-tight">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MapLegend;
