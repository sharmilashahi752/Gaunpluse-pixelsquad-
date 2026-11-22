import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Editorial Page Header for GaunPulse Insights & Data
 * Inspired by Our World in Data and NDRRMA publication headers
 */
export function InsightsHeader() {
  return (
    <header className="border-b border-stone-200 pb-8 space-y-4 text-left">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#42866A]">
          Civic Infrastructure Research & Public Intelligence
        </span>
      </div>

      <div className="max-w-4xl space-y-2">
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#173D32] tracking-tight leading-[1.15]">
          Infrastructure Insights & Data
        </h1>
        <p className="text-base sm:text-lg text-[#1B2923]/80 leading-relaxed font-normal">
          Exploring how roads, bridges, schools, and healthcare facilities shape life in rural communities.
        </p>
      </div>

      {/* Official Demonstration Notice (NDRRMA / OWID publication style) */}
      <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-[4px] bg-stone-50 border border-stone-200 text-xs text-[#1B2923]/80">
        <AlertCircle className="w-4 h-4 text-[#42866A] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#173D32]">
            Demonstration Prototype Research Data
          </p>
          <p className="text-[#64748B] leading-relaxed">
            All records, settlement demographics, and infrastructure assessments shown on this page represent synthetic topological modeling for the fictional mid-hill community of <em>Sundar Gaun</em> (Wards 3 & 4), developed for hackathon evaluation and open decision-support research.
          </p>
        </div>
      </div>
    </header>
  );
}

export default InsightsHeader;
