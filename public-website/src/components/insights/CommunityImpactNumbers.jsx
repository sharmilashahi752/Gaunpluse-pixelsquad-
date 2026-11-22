import React, { useMemo } from 'react';
import {
  ISSUES,
  BRIDGES,
  EDGES,
  FACILITIES,
  SETTLEMENTS,
} from '../../data/demoVillage';

/**
 * Community Impact in Numbers Section
 * Displays four core indicators derived 100% dynamically from real application data:
 * 1. Total Infrastructure Assets (Bridges + Edges + Facilities = 16)
 * 2. Active Reported Issues (4)
 * 3. Communities Represented (2 settlements, 1,040 residents)
 * 4. Field-Verified Reports (3 verified, 75%)
 */
export function CommunityImpactNumbers() {
  const stats = useMemo(() => {
    const totalAssets = (BRIDGES?.length || 0) + (EDGES?.length || 0) + (FACILITIES?.length || 0);
    const activeIssues = ISSUES?.length || 0;
    const verifiedIssues = (ISSUES || []).filter((i) => i.verificationStatus === 'verified').length;
    const verificationRate = activeIssues > 0 ? Math.round((verifiedIssues / activeIssues) * 100) : 0;
    const totalCommunities = SETTLEMENTS?.length || 0;
    const totalPopulation = (SETTLEMENTS || []).reduce(
      (acc, s) => acc + (s.estimatedPopulation || 0),
      0
    );

    return [
      {
        id: 'assets',
        value: totalAssets.toString(),
        label: 'Total Infrastructure Assets',
        detail: 'Mapped bridges, road segments, and facilities',
        context: `${BRIDGES.length} bridges • ${EDGES.length} trail corridors • ${FACILITIES.length} public nodes`,
      },
      {
        id: 'issues',
        value: activeIssues.toString(),
        label: 'Active Reported Issues',
        detail: 'Community observations monitored across Wards 3 & 4',
        context: `${(ISSUES || []).filter((i) => i.severity === 'critical').length} critical alert • ${(ISSUES || []).filter((i) => i.severity === 'warning').length} monitored warnings`,
      },
      {
        id: 'communities',
        value: totalCommunities.toString(),
        label: 'Communities Represented',
        detail: 'Village settlements covered by spatial routing',
        context: `${totalPopulation.toLocaleString()} residents across ${SETTLEMENTS.map((s) => s.name).join(' & ')}`,
      },
      {
        id: 'verified',
        value: `${verifiedIssues}`,
        rateBadge: `${verificationRate}% Verified`,
        label: 'Field-Verified Reports',
        detail: 'On-site technical inspections by sub-engineers',
        context: `${verifiedIssues} of ${activeIssues} submissions validated on the ground`,
      },
    ];
  }, []);

  const hasData = (ISSUES?.length || 0) > 0;

  return (
    <section aria-labelledby="impact-numbers-heading" className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-stone-200 pb-3">
        <h2
          id="impact-numbers-heading"
          className="scroll-mt-24 text-2xl sm:text-3xl font-bold text-[#173D32] tracking-tight"
        >
          Community Impact in Numbers
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed font-normal">
          Real indicators dynamically calculated from the Sundar Gaun spatial network and incident registry.
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-[8px] border border-stone-200 bg-stone-50 p-6 text-center text-sm text-[#64748B]">
          No active dataset metrics available for display.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-[8px] border border-stone-200 bg-white p-6 lg:p-7 shadow-xs hover:border-[#173D32] hover:shadow-sm transition-all flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#173D32] tracking-tight leading-none">
                    {stat.value}
                  </p>
                  {stat.rateBadge && (
                    <span className="text-[11px] font-semibold text-[#42866A] bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-100">
                      {stat.rateBadge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#1B2923] pt-0.5 leading-snug">
                  {stat.label}
                </h3>

                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                  {stat.detail}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 text-[11px] sm:text-xs text-[#64748B] leading-tight">
                {stat.context}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CommunityImpactNumbers;
