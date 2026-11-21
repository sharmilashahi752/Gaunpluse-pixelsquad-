import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Route,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export function ImpactResults({ simulationResult }) {
  const { isBaseline, metrics, routeResults, disabledEdgeIds } = simulationResult;

  return (
    <div className="space-y-6">
      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Scenario State */}
        <Card className="p-4 bg-white/90 border-[#42866A]/20">
          <span className="text-[10px] uppercase font-bold text-[#42866A] tracking-wider block">
            Scenario State
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            {isBaseline ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#42866A]" />
                <span className="font-extrabold text-sm sm:text-base text-[#173D32]">
                  Baseline
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-[#D45F53]" />
                <span className="font-extrabold text-sm sm:text-base text-[#D45F53]">
                  Disrupted
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-[#1B2923]/60 truncate">
            {isBaseline ? 'All bridges open' : `${disabledEdgeIds.length} bridge(s) closed`}
          </p>
        </Card>

        {/* Metric 2: Affected Households */}
        <Card className="p-4 bg-white/90 border-[#42866A]/20">
          <span className="text-[10px] uppercase font-bold text-[#42866A] tracking-wider block">
            Affected Households
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-extrabold text-2xl text-[#173D32]">
              {metrics.totalAffectedHouseholds}
            </span>
            <span className="text-xs text-[#1B2923]/60">
              / {metrics.totalVillageHouseholds}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#1B2923]/60">
            {isBaseline
              ? 'Zero households disrupted'
              : `${Math.round((metrics.totalAffectedHouseholds / metrics.totalVillageHouseholds) * 100)}% of village families`}
          </p>
        </Card>

        {/* Metric 3: Affected Settlements */}
        <Card className="p-4 bg-white/90 border-[#42866A]/20">
          <span className="text-[10px] uppercase font-bold text-[#42866A] tracking-wider block">
            Settlement Impact
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-extrabold text-2xl text-[#173D32]">
              {metrics.affectedSettlementsCount}
            </span>
            <span className="text-xs text-[#1B2923]/60">
              / {metrics.totalSettlements}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#1B2923]/60">
            {metrics.disconnectedSettlementsCount > 0
              ? `${metrics.disconnectedSettlementsCount} disconnected`
              : metrics.delayedSettlementsCount > 0
              ? `${metrics.delayedSettlementsCount} delayed via detour`
              : 'Direct access open'}
          </p>
        </Card>

        {/* Metric 4: Alternative Routes */}
        <Card className="p-4 bg-white/90 border-[#42866A]/20">
          <span className="text-[10px] uppercase font-bold text-[#42866A] tracking-wider block">
            Alternative Route
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <Route className="w-5 h-5 text-[#42866A]" />
            <span className="font-bold text-xs sm:text-sm text-[#173D32] truncate">
              {isBaseline
                ? 'Primary Direct'
                : metrics.alternativeRoutesAvailable
                ? 'Detour Active'
                : 'No Route'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#1B2923]/60 truncate">
            {metrics.alternativeRoutesAvailable
              ? 'West Ridge Trail path'
              : isBaseline
              ? 'Optimal network state'
              : 'Isolated by gorge'}
          </p>
        </Card>
      </div>

      {/* Route-by-Route Transit Table */}
      <Card className="bg-white/95 border-[#42866A]/20 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#42866A]/15">
          <div>
            <h3 className="font-bold text-base text-[#173D32]">
              Transit Impact to Essential Services
            </h3>
            <p className="text-xs text-[#42866A]">
              Dijkstra shortest-path calculations before and during infrastructure disruption
            </p>
          </div>
          <Badge variant="neutral">Deterministic Dijkstra Engine</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#42866A]/20 text-[#42866A] font-bold uppercase tracking-wider">
                <th className="py-2.5 pr-3">Origin Settlement</th>
                <th className="py-2.5 px-3">Destination Facility</th>
                <th className="py-2.5 px-3 text-center">Baseline Time</th>
                <th className="py-2.5 px-3 text-center">Scenario Time</th>
                <th className="py-2.5 px-3 text-center">Access Status</th>
                <th className="py-2.5 pl-3 text-right">Travel Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#42866A]/10 text-[#1B2923]">
              {routeResults.map((r, i) => (
                <tr key={i} className="hover:bg-[#F8F7F2]/80 transition-colors">
                  <td className="py-3 pr-3 font-semibold text-[#173D32]">
                    {r.settlementName}
                    <span className="block text-[10px] text-[#42866A] font-normal">
                      {r.settlementHouseholds} households
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-medium text-[#173D32]">{r.facilityName}</span>
                    <span className="block text-[10px] text-[#1B2923]/60 capitalize">
                      {r.facilityType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-medium text-[#173D32]">
                    {r.baselineTime !== null ? `${r.baselineTime} min` : 'N/A'}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {r.status === 'Disconnected' ? (
                      <span className="text-[#D45F53] font-sans">No Path</span>
                    ) : (
                      <span className={r.deltaMinutes > 0 ? 'text-[#D45F53]' : 'text-[#173D32]'}>
                        {r.scenarioTime} min
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {r.status === 'Disconnected' ? (
                      <Badge variant="alert">Disconnected</Badge>
                    ) : r.status === 'Delayed' ? (
                      <Badge variant="amber">Delayed</Badge>
                    ) : r.status === 'Unaffected' ? (
                      <Badge variant="neutral">Unaffected</Badge>
                    ) : (
                      <Badge variant="neutral">Insufficient data</Badge>
                    )}
                  </td>

                  <td className="py-3 pl-3 text-right font-mono font-bold">
                    {r.status === 'Disconnected' ? (
                      <span className="text-[#D45F53]">Severed</span>
                    ) : r.deltaMinutes > 0 ? (
                      <span className="text-[#D45F53]">+{r.deltaMinutes} min</span>
                    ) : (
                      <span className="text-[#42866A]">±0 min</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Precise Definitions Box */}
        <div className="mt-5 p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 text-[11px] text-[#1B2923]/70 space-y-1">
          <p>
            <strong className="text-[#173D32]">Status Definitions:</strong>{' '}
            <span className="text-[#D45F53] font-semibold">Disconnected</span> = No topological graph path exists across open edges.{' '}
            <span className="text-[#8F5E16] font-semibold">Delayed</span> = Alternative path exists with increased travel time.{' '}
            <span className="text-[#173D32] font-semibold">Unaffected</span> = Access route and duration remain unchanged.
          </p>
          <p className="text-[10px] text-[#42866A]">
            * Data uncertainty notice: Travel-time values are estimated simulation benchmarks for the demonstration network.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ImpactResults;
