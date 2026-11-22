import React, { useMemo } from 'react';
import {
  ISSUES,
  BRIDGES,
  EDGES,
  FACILITIES,
  SETTLEMENTS,
} from '../../data/demoVillage';

/**
 * Editorial Infrastructure Statistics
 * Presentation: Large numbers, clean thin borders, concise labels (Our World in Data & NDRRMA style)
 */
export function EditorialStats() {
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
      caption: 'Active community observations in Sundar Gaun',
    },
    {
      label: 'Field-Verified Reports',
      value: stats.verifiedReports,
      caption: 'Inspected & validated by technical liaisons (75%)',
    },
    {
      label: 'Mapped Assets',
      value: stats.mappedAssets,
      caption: 'Bridges, road segments, school & clinic facilities',
    },
    {
      label: 'Communities Covered',
      value: stats.communitiesCovered,
      caption: `Tallo Basti & Upallo Basti (${stats.totalPopulation.toLocaleString()} residents)`,
    },
  ];

  return (
    <section aria-labelledby="editorial-stats-heading" className="space-y-3 text-left">
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <h2
          id="editorial-stats-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#173D32]"
        >
          Infrastructure Overview
        </h2>
        <span className="text-[11px] text-[#64748B]">
          Dynamic Graph Registry Overview
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border-y border-stone-200 bg-white py-6">
        {items.map((item, idx) => (
          <div
            key={item.label}
            className={`px-4 sm:px-6 py-4 sm:py-0 text-left ${
              idx === 0 ? 'sm:pl-2' : ''
            }`}
          >
            <p className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#173D32] tracking-tight leading-none">
              {item.value}
            </p>
            <h3 className="mt-2 text-xs font-bold uppercase tracking-wider text-[#1B2923]">
              {item.label}
            </h3>
            <p className="mt-1 text-xs text-[#64748B] leading-normal font-normal">
              {item.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EditorialStats;
