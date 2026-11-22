import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  BarChart2,
  Table as TableIcon,
  AlertTriangle,
  ArrowRight,
  Clock,
  Home,
} from 'lucide-react';
import { runNetworkSimulation } from '../../utils/graphSimulation';

const SCENARIOS = [
  {
    id: 'br-02',
    name: 'BR-02 Khola Motor Bridge (Pier Scour)',
    shortName: 'BR-02 Motor Bridge',
    disabledEdges: ['edge-bridge-b'],
    description:
      'Modeled closure of the sole vehicular river crossing due to 15cm foundation pier scour.',
    articleId: 'healthcare-impact',
  },
  {
    id: 'br-01',
    name: 'BR-01 Upper Footbridge (Cable Warning)',
    shortName: 'BR-01 Upper Footbridge',
    disabledEdges: ['edge-bridge-a'],
    description:
      'Modeled closure of the pedestrian suspension bridge due to cable tension advisory.',
    articleId: 'school-accessibility',
  },
  {
    id: 'dual',
    name: 'Dual Bridge Failure (BR-01 & BR-02)',
    shortName: 'Dual Bridge Failure',
    disabledEdges: ['edge-bridge-a', 'edge-bridge-b'],
    description:
      'Modeled catastrophic monsoon scenario where both river crossings are simultaneously impassable.',
    articleId: 'infrastructure-priorities',
  },
];

const DESTINATIONS = [
  { id: 'all', label: 'All Facilities' },
  { id: 'facility-health', label: 'Health Post' },
  { id: 'facility-school', label: 'Basic School' },
];

/**
 * Featured Data Explorer Component
 * Main attraction of the Insights page:
 * - 30% Left column: Research question, explanation, dynamic findings, and research link.
 * - 70% Right column: Compact controls toolbar, enlarged interactive chart, and data table.
 */
export function FeaturedDataExplorer({ onSelectArticle }) {
  const [activeScenarioId, setActiveScenarioId] = useState('br-02');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'
  const [selectedDestination, setSelectedDestination] = useState('all');

  const currentScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0],
    [activeScenarioId]
  );

  // Compute live deterministic network simulation
  const simulationData = useMemo(() => {
    return runNetworkSimulation({ disabledEdgeIds: currentScenario.disabledEdges });
  }, [currentScenario]);

  // Filter routes by destination
  const filteredRoutes = useMemo(() => {
    if (!simulationData?.routeResults) return [];
    if (selectedDestination === 'all') {
      return simulationData.routeResults;
    }
    return simulationData.routeResults.filter(
      (r) => r.facilityId === selectedDestination
    );
  }, [simulationData, selectedDestination]);

  // Dynamic numerical takeaways
  const takeaway = useMemo(() => {
    const isDual = currentScenario.id === 'dual';
    if (isDual) {
      return {
        maxDelay: 'Disconnected',
        delayLabel: '100% valley severed',
        mostAffectedRoute: 'All river crossings impassable',
        households: 215,
        residents: 1040,
        accessNote: 'Vehicular and footbridge corridors blocked',
        severityTag: 'Critical Emergency',
      };
    }

    let maxRoute = null;
    let maxDelta = 0;

    simulationData.routeResults.forEach((r) => {
      if (r.deltaMinutes && r.deltaMinutes > maxDelta) {
        maxDelta = r.deltaMinutes;
        maxRoute = r;
      }
    });

    const isBr02 = currentScenario.id === 'br-02';
    return {
      maxDelay: `+${maxDelta} min`,
      delayLabel: `+${Math.round((maxDelta / (maxRoute?.baselineTime || 18)) * 100)}% increase`,
      mostAffectedRoute: maxRoute
        ? `${maxRoute.settlementName} → ${maxRoute.facilityName}`
        : 'Tallo Basti → Health Post',
      households: isBr02 ? 95 : 120,
      residents: isBr02 ? 460 : 580,
      accessNote: isBr02
        ? 'Vehicular transit blocked • Stretcher detour required'
        : 'Upper pedestrian corridor blocked • Lower detour required',
      severityTag: isBr02 ? 'Severe Medical Disruption' : 'Pedestrian Delay',
    };
  }, [currentScenario, simulationData]);

  // Prepare chart dataset
  const chartData = useMemo(() => {
    return filteredRoutes.map((r) => {
      const shortName = `${r.settlementName.replace(' Basti', '')} → ${
        r.facilityType === 'health_post' ? 'Clinic' : 'School'
      }`;
      return {
        name: shortName,
        fullName: `${r.settlementName} to ${r.facilityName}`,
        baseline: r.baselineTime,
        disrupted: r.scenarioTime !== null ? r.scenarioTime : 65,
        isDisconnected: r.scenarioTime === null,
        delta: r.deltaMinutes,
        status: r.status,
      };
    });
  }, [filteredRoutes]);

  return (
    <section
      aria-labelledby="featured-explorer-heading"
      className="rounded-[4px] border border-stone-200 bg-[#F9FAF9] p-6 sm:p-8 space-y-6 text-left"
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        {/* Left Column: 30% width on desktop for context and key findings */}
        <div className="w-full lg:w-[30%] space-y-5 shrink-0">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A]">
              Featured Data Explorer
            </span>
            <h2
              id="featured-explorer-heading"
              className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight leading-snug"
            >
              How Bridge Failures Affect Access to Essential Services
            </h2>
            <p className="text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed font-normal">
              In steep mountain valleys, rivers create severe bottlenecks. When a bridge fails,
              alternate routes force steep footbridge detours or complete vehicular cutoff.
              This interactive model simulates transit delays using client-side Dijkstra calculations.
            </p>
          </div>

          {/* Key Findings Card */}
          <div className="border border-stone-200 rounded-[4px] bg-white p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#173D32]">
                Key Impact Takeaway
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D45F53] bg-red-50 px-1.5 py-0.5 rounded-[2px] border border-red-100">
                <AlertTriangle className="w-3 h-3 text-[#D45F53]" />
                {takeaway.severityTag}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-[#42866A]" /> Max Delay
                </span>
                <p className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight">
                  {takeaway.maxDelay}
                </p>
                <p className="text-[10px] text-[#64748B]">{takeaway.delayLabel}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium">
                  <Home className="w-3 h-3 text-[#42866A]" /> Impacted
                </span>
                <p className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight">
                  {takeaway.households} <span className="text-xs font-normal text-[#64748B]">Homes</span>
                </p>
                <p className="text-[10px] text-[#64748B]">{takeaway.residents} residents</p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-0.5">
              <span className="text-[10px] font-semibold text-[#173D32] uppercase tracking-wider block">
                Primary Chokepoint
              </span>
              <p className="text-xs text-[#1B2923] font-medium leading-snug">
                {takeaway.mostAffectedRoute}
              </p>
              <p className="text-[10px] text-[#64748B]">{takeaway.accessNote}</p>
            </div>
          </div>

          {/* Link to Detailed Research */}
          <div>
            <button
              type="button"
              onClick={() => onSelectArticle && onSelectArticle(currentScenario.articleId)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D32] hover:text-[#42866A] transition-colors group"
            >
              <span>Read research brief on this disruption</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-[#42866A]" />
            </button>
          </div>
        </div>

        {/* Right Column: 70% width on desktop for compact toolbar + large chart */}
        <div className="w-full lg:w-[70%] space-y-3.5">
          {/* Compact Unified Controls Toolbar */}
          <div className="bg-white border border-stone-200 rounded-[4px] p-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
            {/* Scenario Selector Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-[#64748B] mr-0.5 hidden sm:inline">Scenario:</span>
              {SCENARIOS.map((s) => {
                const isActive = activeScenarioId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveScenarioId(s.id)}
                    className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors ${
                      isActive
                        ? 'bg-[#173D32] text-white border-[#173D32] font-semibold'
                        : 'bg-stone-50 text-[#64748B] border-stone-200 hover:text-[#173D32] hover:bg-stone-100'
                    }`}
                  >
                    {s.shortName}
                  </button>
                );
              })}
            </div>

            {/* Right Tools: Destination Filter + View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                {DESTINATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDestination(d.id)}
                    className={`px-2 py-0.5 rounded-[2px] text-[11px] transition-colors ${
                      selectedDestination === d.id
                        ? 'bg-stone-200 text-[#173D32] font-semibold'
                        : 'text-[#64748B] hover:text-[#173D32]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <span className="text-stone-300">|</span>

              <div className="inline-flex rounded-[3px] border border-stone-200 bg-stone-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('chart')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-[2px] transition-colors ${
                    viewMode === 'chart'
                      ? 'bg-white text-[#173D32] shadow-2xs font-semibold'
                      : 'text-[#64748B] hover:text-[#173D32]'
                  }`}
                  aria-label="Switch to chart view"
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-[2px] transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-[#173D32] shadow-2xs font-semibold'
                      : 'text-[#64748B] hover:text-[#173D32]'
                  }`}
                  aria-label="Switch to table view"
                >
                  <TableIcon className="w-3 h-3" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Large Visualization Container */}
          <div className="border border-stone-200 rounded-[4px] bg-white p-5 sm:p-6 shadow-xs">
            {viewMode === 'chart' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#64748B] border-b border-stone-100 pb-2">
                  <span className="font-semibold text-[#173D32]">
                    Commute Duration: Baseline vs. Disrupted Scenario
                  </span>
                  <span>Unit: Minutes</span>
                </div>

                <div className="h-80 sm:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#1B2923', fontSize: 12, fontWeight: 500 }}
                        stroke="#CBD5E1"
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        stroke="#CBD5E1"
                        tickLine={false}
                        unit="m"
                      />
                      <Tooltip
                        cursor={{ fill: '#F8FAFC' }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-stone-200 shadow-md p-3 rounded-[3px] text-xs space-y-1.5 text-left">
                              <p className="font-bold text-[#173D32] border-b border-stone-100 pb-1">
                                {data.fullName}
                              </p>
                              <div className="flex justify-between gap-4 text-[#64748B]">
                                <span>Normal Transit:</span>
                                <span className="font-semibold text-[#173D32]">
                                  {data.baseline} min
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 text-[#64748B]">
                                <span>Disrupted Transit:</span>
                                <span
                                  className={`font-semibold ${
                                    data.isDisconnected ? 'text-[#D45F53]' : 'text-[#173D32]'
                                  }`}
                                >
                                  {data.isDisconnected ? 'Disconnected' : `${data.disrupted} min`}
                                </span>
                              </div>
                              {data.delta !== null && (
                                <div className="flex justify-between gap-4 pt-1 border-t border-stone-100 text-[#D45F53] font-bold">
                                  <span>Travel Delay:</span>
                                  <span>+{data.delta} min</span>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                      />
                      <Bar
                        dataKey="baseline"
                        name="Normal Transit"
                        fill="#94A3B8"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={44}
                      />
                      <Bar
                        dataKey="disrupted"
                        name="Disrupted Detour"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={44}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isDisconnected ? '#D45F53' : '#173D32'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* Data Table View */
              <div className="overflow-x-auto text-xs text-left">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[#173D32] font-semibold">
                      <th className="py-2.5 px-3">Origin Settlement</th>
                      <th className="py-2.5 px-3">Destination Facility</th>
                      <th className="py-2.5 px-3 text-right">Normal</th>
                      <th className="py-2.5 px-3 text-right">Scenario</th>
                      <th className="py-2.5 px-3 text-right">Delay</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRoutes.map((r, idx) => (
                      <tr key={idx} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-[#173D32]">
                          {r.settlementName}
                        </td>
                        <td className="py-2.5 px-3 text-[#1B2923]">{r.facilityName}</td>
                        <td className="py-2.5 px-3 text-right text-[#64748B]">
                          {r.baselineTime} min
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#173D32]">
                          {r.scenarioTime !== null ? `${r.scenarioTime} min` : 'Severed'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#D45F53]">
                          {r.deltaMinutes !== null ? `+${r.deltaMinutes} min` : '∞'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-semibold ${
                              r.status === 'Delayed'
                                ? 'bg-amber-100 text-amber-800'
                                : r.status === 'Disconnected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Units & Source Caption */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#64748B] gap-1">
              <span>
                Walking speeds: 3.2 km/h; vehicle speeds: 15 km/h. Scenario: {currentScenario.description}
              </span>
              <span className="font-medium text-[#173D32]">
                Source: GaunPulse Dijkstra Simulation Engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedDataExplorer;
