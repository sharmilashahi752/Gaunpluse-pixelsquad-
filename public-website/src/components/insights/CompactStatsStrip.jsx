import React, { useMemo } from 'react';
import {
  ISSUES,
  BRIDGES,
  EDGES,
  FACILITIES,
  SETTLEMENTS,
} from '../../data/demoVillage';

/**
 * Refined Infrastructure Overview Statistics
 * Displays four core metrics in a clean, single horizontal row with subtle vertical dividers,
 * large bold numbers, and concise descriptions without clutter.
 */
export function CompactStatsStrip() {
  const stats = useMemo(() => {
    const totalReports = ISSUES.length;
    const verifiedReports = ISSUES.filter((i) => i.verificationStatus === 'verified').length;
    const mappedAssets = BRIDGES.length + EDGES.length + FACILITIES.length;
    const communitiesCovered = SETTLEMENTS.length;
    const totalPopulation = SETTLEMENTS.reduce(
      (acc, s) => acc + (s.estimatedPopulation || 0),
      0
    );

    return {
      totalReports,
      verifiedReports,
      mappedAssets,
      communitiesCovered,
      totalPopulation,
    };
  }, []);

  const items = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      caption: 'Active community hazard observations',
    },
    {
      label: 'Field-Verified',
      value: stats.verifiedReports,
      caption: '75% inspected by technical liaisons',
    },
    {
      label: 'Mapped Assets',
      value: stats.mappedAssets,
      caption: 'Bridges, road segments, and facilities',
    },
    {
      label: 'Communities',
      value: stats.communitiesCovered,
      caption: `Tallo & Upallo Basti (${stats.totalPopulation.toLocaleString()} residents)`,
    },
  ];

  return (
    <section aria-labelledby="stats-overview-heading" className="text-left">
      <h2 id="stats-overview-heading" className="sr-only">
        Infrastructure Overview
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-200 border-y border-stone-200 bg-white py-5">
        {items.map((item, idx) => (
          <div
            key={item.label}
            className={`px-4 sm:px-6 py-2.5 md:py-0 text-left ${
              idx === 0 ? 'sm:pl-1' : ''
            }`}
          >
            <p className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#173D32] tracking-tight leading-none">
              {item.value}
            </p>
            <h3 className="mt-1.5 text-xs font-semibold text-[#1B2923]">
              {item.label}
            </h3>
            <p className="mt-0.5 text-xs text-[#64748B] leading-normal font-normal">
              {item.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CompactStatsStrip;
