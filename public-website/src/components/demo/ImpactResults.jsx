import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Home,
  Users,
} from 'lucide-react';

export function ImpactResults({ simulationResult }) {
  const { isBaseline, metrics, routeResults, disabledEdgeIds } = simulationResult;

  // Maximum delay across any affected route
  const maxDelay = Math.max(0, ...routeResults.map((r) => r.deltaMinutes || 0));

  return (
    <div className="space-y-6 text-left">
      {/* 4. Concise Row of Simulation Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Network Status */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Network Status
            </span>
            {isBaseline ? (
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-extrabold ${
                isBaseline ? 'text-[#173D32]' : 'text-[#DC2626]'
              }`}
            >
              {isBaseline ? 'Connected' : 'Disrupted'}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#64748B] truncate">
            {isBaseline
              ? 'All crossings operational'
              : `${disabledEdgeIds.length} bridge link(s) severed`}
          </p>
        </div>

        {/* Metric 2: Affected Households */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Affected Households
            </span>
            <Users className="w-4 h-4 text-[#173D32]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-[#173D32]">
              {metrics.totalAffectedHouseholds}
            </span>
            <span className="text-xs text-[#64748B]">
              / {metrics.totalVillageHouseholds}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">
            {isBaseline
              ? '0 families impacted'
              : `${Math.round(
                  (metrics.totalAffectedHouseholds / metrics.totalVillageHouseholds) * 100
                )}% of village families`}
          </p>
        </div>

        {/* Metric 3: Travel Delays */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Travel Delays
            </span>
            <Clock className="w-4 h-4 text-[#173D32]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-extrabold ${
                maxDelay > 0 ? 'text-[#D97706]' : 'text-[#173D32]'
              }`}
            >
              {maxDelay > 0 ? `+${maxDelay} min` : '0 min'}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#64748B] truncate">
            {isBaseline
              ? 'Direct baseline transit'
              : metrics.disconnectedSettlementsCount > 0
              ? 'Severed path'
              : 'Detour via mountain trail'}
          </p>
        </div>

        {/* Metric 4: Disconnected Settlements */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Disconnected
            </span>
            <Home className="w-4 h-4 text-[#173D32]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-extrabold ${
                metrics.disconnectedSettlementsCount > 0
                  ? 'text-[#DC2626]'
                  : 'text-[#173D32]'
              }`}
            >
              {metrics.disconnectedSettlementsCount}
            </span>
            <span className="text-xs text-[#64748B]">
              / {metrics.totalSettlements} settlements
            </span>
          </div>
          <p className="mt-1 text-xs text-[#64748B] truncate">
            {metrics.disconnectedSettlementsCount > 0
              ? 'Zero passable route across river'
              : 'Alternative detour available'}
          </p>
        </div>
      </div>

      {/* 5. Clean Travel Impact Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="mb-4 pb-3 border-b border-[#E5E7EB]">
          <h3 className="font-bold text-base text-[#173D32]">
            Travel Impact on Essential Services
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Comparing baseline and simulated transit times from village bastis to schools and health facilities
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 pr-4">Origin Settlement</th>
                <th className="py-2.5 px-4">Destination Facility</th>
                <th className="py-2.5 px-3 text-center">Baseline Time</th>
                <th className="py-2.5 px-3 text-center">Simulated Time</th>
                <th className="py-2.5 px-3 text-center">Access Status</th>
                <th className="py-2.5 pl-4 text-right">Travel Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#1B2923]">
              {routeResults.map((r, i) => (
                <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 pr-4">
                    <span className="font-semibold text-[#173D32] block">{r.settlementName}</span>
                    <span className="text-[11px] text-[#64748B]">
                      {r.settlementHouseholds} households
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-[#173D32] block">{r.facilityName}</span>
                    <span className="text-[11px] text-[#64748B] capitalize">
                      {r.facilityType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono font-medium text-[#173D32]">
                    {r.baselineTime !== null ? `${r.baselineTime} min` : 'N/A'}
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono font-bold">
                    {r.status === 'Disconnected' ? (
                      <span className="text-[#DC2626]">No Path</span>
                    ) : (
                      <span className={r.deltaMinutes > 0 ? 'text-[#D97706]' : 'text-[#173D32]'}>
                        {r.scenarioTime} min
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    {r.status === 'Disconnected' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                        Disconnected
                      </span>
                    ) : r.status === 'Delayed' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                        Delayed
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-[#475569] border border-stone-200">
                        Unaffected
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 pl-4 text-right font-mono font-bold">
                    {r.status === 'Disconnected' ? (
                      <span className="text-[#DC2626]">Severed</span>
                    ) : r.deltaMinutes > 0 ? (
                      <span className="text-[#D97706]">+{r.deltaMinutes} min</span>
                    ) : (
                      <span className="text-[#16A34A]">±0 min</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Concise Status Legend */}
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#64748B] flex flex-wrap items-center justify-between gap-2">
          <p>
            <strong className="text-[#173D32]">Definitions:</strong>{' '}
            <span className="text-[#DC2626] font-medium">Disconnected</span> = No open topological route.{' '}
            <span className="text-[#D97706] font-medium">Delayed</span> = Accessible via longer detour.{' '}
            <span className="text-[#16A34A] font-medium">Unaffected</span> = Route duration unchanged.
          </p>
          <span className="text-[10px] text-[#94A3B8]">Dijkstra Shortest-Path Model</span>
        </div>
      </div>
    </div>
  );
}

export default ImpactResults;
