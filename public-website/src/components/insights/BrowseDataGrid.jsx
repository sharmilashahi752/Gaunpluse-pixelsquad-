import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
} from 'recharts';
import { X, Info, ArrowUpRight } from 'lucide-react';
import { ISSUES } from '../../data/demoVillage';
import { runNetworkSimulation } from '../../utils/graphSimulation';

/**
 * Chart Gallery Section ("Explore Infrastructure Data")
 * Features an asymmetrical, editorial visual hierarchy:
 * - 60% Left: Large Category breakdown chart.
 * - 40% Right: Two vertically stacked smaller charts (Severity Donut & Progress Pipeline).
 * - Full-width bottom card: Travel Time & Accessibility route comparison.
 * Each chart has a title, one-sentence explanation, clear visualization, and "Explore chart →" link.
 */
export function BrowseDataGrid({ activeTopic = 'all', searchQuery = '' }) {
  const [selectedChartId, setSelectedChartId] = useState(null);

  // Keyboard escape handler for modal
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && selectedChartId) {
        setSelectedChartId(null);
      }
    },
    [selectedChartId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Chart 1: Categories
  const categoryData = useMemo(() => {
    const counts = { bridge: 0, road: 0, school: 0, health_post: 0 };
    ISSUES.forEach((i) => {
      if (counts[i.category] !== undefined) counts[i.category] += 1;
    });

    return [
      { name: 'Bridges', count: counts.bridge, fill: '#173D32' },
      { name: 'Roads & Trails', count: counts.road, fill: '#42866A' },
      { name: 'School Access', count: counts.school, fill: '#5C7C64' },
      { name: 'Health Facilities', count: counts.health_post, fill: '#8F5E16' },
    ];
  }, []);

  // Chart 2: Severity (Donut)
  const severityData = useMemo(() => {
    const counts = { critical: 0, warning: 0, low: 0 };
    ISSUES.forEach((i) => {
      if (counts[i.severity] !== undefined) counts[i.severity] += 1;
    });

    return [
      { name: 'Critical Alert', value: counts.critical, fill: '#D45F53' },
      { name: 'Monitored Warning', value: counts.warning, fill: '#E3AD58' },
      { name: 'Low Risk', value: counts.low, fill: '#42866A' },
    ];
  }, []);

  // Chart 3: Verification Pipeline
  const pipelineData = useMemo(() => {
    const counts = { under_review: 0, field_verification: 0, action_proposed: 0 };
    ISSUES.forEach((i) => {
      if (counts[i.progressStatus] !== undefined) counts[i.progressStatus] += 1;
    });

    return [
      { stage: 'Under Review', count: counts.under_review, fill: '#E3AD58' },
      { stage: 'Field Verification', count: counts.field_verification, fill: '#173D32' },
      { stage: 'Action Proposed', count: counts.action_proposed, fill: '#42866A' },
    ];
  }, []);

  // Chart 4: Travel Time Baseline vs Disrupted
  const travelComparisonData = useMemo(() => {
    const sim = runNetworkSimulation({ disabledEdgeIds: ['edge-bridge-b'] });
    const routes = [
      {
        routeLabel: 'Tallo → Clinic',
        settlement: 'settlement-tallo',
        facility: 'facility-health',
        baseline: 18,
        disrupted: 51,
      },
      {
        routeLabel: 'Tallo → School',
        settlement: 'settlement-tallo',
        facility: 'facility-school',
        baseline: 18,
        disrupted: 43,
      },
      {
        routeLabel: 'Upallo → Clinic',
        settlement: 'settlement-upallo',
        facility: 'facility-health',
        baseline: 24,
        disrupted: 24,
      },
      {
        routeLabel: 'Upallo → School',
        settlement: 'settlement-upallo',
        facility: 'facility-school',
        baseline: 16,
        disrupted: 16,
      },
    ];

    return routes.map((r) => {
      const computed = sim?.routeResults?.find(
        (res) => res.settlementId === r.settlement && res.facilityId === r.facility
      );
      return {
        name: r.routeLabel,
        baselineTime: computed ? computed.baselineTime : r.baseline,
        disruptedTime: computed ? computed.scenarioTime : r.disrupted,
      };
    });
  }, []);

  const chartCards = useMemo(
    () => ({
      categories: {
        id: 'categories',
        title: 'Issues by Infrastructure Category',
        explanation: 'Breakdown of active community hazard observations by structural typology.',
        topicTags: ['all', 'bridges', 'roads', 'education', 'healthcare'],
        takeaway: '50% of active hazards involve river crossing bridge structures.',
        methodology: 'Derived from active community observations in Sundar Gaun prototype registry.',
        type: 'bar',
        data: categoryData,
      },
      severity: {
        id: 'severity',
        title: 'Infrastructure Severity',
        explanation: 'Risk classification triage based on field engineering assessments.',
        topicTags: ['all', 'bridges', 'roads', 'access'],
        takeaway: '25% classified as critical requiring immediate vehicular diversion.',
        methodology: 'Standardized 3-tier municipal hazard triage: Critical, Monitored Warning, and Low.',
        type: 'pie',
        data: severityData,
      },
      pipeline: {
        id: 'pipeline',
        title: 'Verification Progress',
        explanation: 'Progress across the 6-stage municipal governance and repair workflow.',
        topicTags: ['all', 'access', 'roads', 'bridges'],
        takeaway: '75% of submissions have completed verified field inspection.',
        methodology: 'Lifecycle stages tracked: Intake, Verification, Scoring, Prioritization, Budget, and Notice.',
        type: 'horizontal_bar',
        data: pipelineData,
      },
      accessibility: {
        id: 'accessibility',
        title: 'Travel Time & Accessibility Impact',
        explanation: 'Modeled pedestrian and emergency ambulance transit delays under monsoon damage.',
        topicTags: ['all', 'education', 'healthcare', 'bridges', 'access'],
        takeaway: 'Khola River crossing failure inflates clinic commute by +33 minutes.',
        methodology: 'Client-side Dijkstra calculations on Sundar Gaun elevation-weighted path topology.',
        type: 'comparison_bar',
        data: travelComparisonData,
      },
    }),
    [categoryData, severityData, pipelineData, travelComparisonData]
  );

  // Check visibility by topic and search
  const isVisible = useCallback(
    (card) => {
      const matchesTopic =
        activeTopic === 'all' || card.topicTags.includes(activeTopic);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.explanation.toLowerCase().includes(q) ||
        card.takeaway.toLowerCase().includes(q);
      return matchesTopic && matchesSearch;
    },
    [activeTopic, searchQuery]
  );

  const activeModalCard = selectedChartId ? chartCards[selectedChartId] : null;

  return (
    <section aria-labelledby="browse-data-heading" className="space-y-6 text-left">
      {/* Section Header */}
      <div className="border-b border-stone-200 pb-2.5">
        <h2
          id="browse-data-heading"
          className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight"
        >
          Explore Infrastructure Data
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Interactive charts tracking incident reports, technical inspections, and physical access.
        </p>
      </div>

      <div className="space-y-6">
        {/* Top Asymmetrical Row: 60% Large Chart + 40% Two Stacked Charts */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* 60% Large Category Chart */}
          {isVisible(chartCards.categories) && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedChartId('categories')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedChartId('categories');
                }
              }}
              className="w-full lg:w-[60%] border border-stone-200 rounded-[4px] bg-white p-5 hover:border-[#173D32] transition-colors cursor-pointer flex flex-col justify-between text-left space-y-4 focus:outline-none focus:ring-1 focus:ring-[#173D32] shadow-xs"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#173D32]">
                  {chartCards.categories.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {chartCards.categories.explanation}
                </p>
              </div>

              {/* Large Chart Area */}
              <div className="h-56 w-full bg-stone-50/50 rounded-[3px] p-2 border border-stone-100 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartCards.categories.data}
                    margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#1B2923' }}
                      stroke="#94A3B8"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      stroke="#94A3B8"
                      allowDecimals={false}
                    />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={48}>
                      {chartCards.categories.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[#64748B] text-[11px] truncate pr-2">
                  {chartCards.categories.takeaway}
                </span>
                <span className="text-[#173D32] font-semibold text-xs inline-flex items-center gap-0.5 hover:text-[#42866A]">
                  Explore chart <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* 40% Two Stacked Smaller Charts */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            {/* Chart 2: Severity Donut */}
            {isVisible(chartCards.severity) && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedChartId('severity')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedChartId('severity');
                  }
                }}
                className="border border-stone-200 rounded-[4px] bg-white p-4 hover:border-[#173D32] transition-colors cursor-pointer flex-1 flex flex-col justify-between text-left space-y-2 focus:outline-none focus:ring-1 focus:ring-[#173D32] shadow-xs"
              >
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#173D32]">
                    {chartCards.severity.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {chartCards.severity.explanation}
                  </p>
                </div>

                <div className="h-28 w-full bg-stone-50/50 rounded-[3px] border border-stone-100 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartCards.severity.data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={24}
                        outerRadius={44}
                        paddingAngle={3}
                      >
                        {chartCards.severity.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] truncate pr-2">
                    {chartCards.severity.takeaway}
                  </span>
                  <span className="text-[#173D32] font-semibold shrink-0 inline-flex items-center gap-0.5 hover:text-[#42866A]">
                    Explore chart <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}

            {/* Chart 3: Verification Pipeline */}
            {isVisible(chartCards.pipeline) && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedChartId('pipeline')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedChartId('pipeline');
                  }
                }}
                className="border border-stone-200 rounded-[4px] bg-white p-4 hover:border-[#173D32] transition-colors cursor-pointer flex-1 flex flex-col justify-between text-left space-y-2 focus:outline-none focus:ring-1 focus:ring-[#173D32] shadow-xs"
              >
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#173D32]">
                    {chartCards.pipeline.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {chartCards.pipeline.explanation}
                  </p>
                </div>

                <div className="h-28 w-full bg-stone-50/50 rounded-[3px] border border-stone-100 flex items-center justify-center p-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartCards.pipeline.data}
                      margin={{ top: 5, right: 15, left: 15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 9 }}
                        stroke="#94A3B8"
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        tick={{ fontSize: 9 }}
                        stroke="#94A3B8"
                        width={85}
                      />
                      <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                        {chartCards.pipeline.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] truncate pr-2">
                    {chartCards.pipeline.takeaway}
                  </span>
                  <span className="text-[#173D32] font-semibold shrink-0 inline-flex items-center gap-0.5 hover:text-[#42866A]">
                    Explore chart <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Full-Width Section: Travel Time and Accessibility Impact */}
        {isVisible(chartCards.accessibility) && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedChartId('accessibility')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedChartId('accessibility');
              }
            }}
            className="w-full border border-stone-200 rounded-[4px] bg-white p-5 hover:border-[#173D32] transition-colors cursor-pointer text-left space-y-4 focus:outline-none focus:ring-1 focus:ring-[#173D32] shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base font-bold text-[#173D32]">
                  {chartCards.accessibility.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {chartCards.accessibility.explanation}
                </p>
              </div>
              <span className="text-[#173D32] font-semibold text-xs inline-flex items-center gap-0.5 hover:text-[#42866A] shrink-0">
                Explore chart <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="h-52 w-full bg-stone-50/50 rounded-[3px] p-2 border border-stone-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartCards.accessibility.data}
                  margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#1B2923' }}
                    stroke="#94A3B8"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    stroke="#94A3B8"
                    unit="m"
                  />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Bar
                    dataKey="baselineTime"
                    name="Normal Walk"
                    fill="#94A3B8"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="disruptedTime"
                    name="Monsoon Detour"
                    fill="#173D32"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-[#64748B]">
              <span>{chartCards.accessibility.takeaway}</span>
              <span className="text-[11px]">Dijkstra shortest path algorithm</span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Modal / Focused View */}
      {activeModalCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-chart-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setSelectedChartId(null)}
        >
          <div
            className="bg-white border border-stone-200 rounded-[4px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#42866A]">
                  Detailed Chart Exploration
                </span>
                <h3 id="modal-chart-title" className="text-xl sm:text-2xl font-bold text-[#173D32]">
                  {activeModalCard.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  {activeModalCard.explanation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChartId(null)}
                className="p-1.5 rounded-[3px] text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Close expanded visualization"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Modal Chart */}
            <div className="h-64 sm:h-80 w-full bg-[#F9FAF9] rounded-[4px] p-4 border border-stone-200">
              {activeModalCard.type === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeModalCard.data}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#1B2923' }}
                      stroke="#94A3B8"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      stroke="#94A3B8"
                      allowDecimals={false}
                    />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} />
                    <Bar
                      dataKey="count"
                      name="Reports Count"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={48}
                    >
                      {activeModalCard.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeModalCard.type === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeModalCard.data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {activeModalCard.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {activeModalCard.type === 'horizontal_bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={activeModalCard.data}
                    margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      stroke="#94A3B8"
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fontSize: 11 }}
                      stroke="#94A3B8"
                      width={110}
                    />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} />
                    <Bar dataKey="count" name="Reports" radius={[0, 3, 3, 0]} maxBarSize={28}>
                      {activeModalCard.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeModalCard.type === 'comparison_bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeModalCard.data}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#1B2923' }}
                      stroke="#94A3B8"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      stroke="#94A3B8"
                      unit="m"
                    />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                    />
                    <Bar
                      dataKey="baselineTime"
                      name="Baseline (Normal)"
                      fill="#94A3B8"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="disruptedTime"
                      name="Disrupted (Detour)"
                      fill="#173D32"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Context & Methodology Note */}
            <div className="bg-stone-50 border border-stone-200 rounded-[3px] p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#173D32]">
                <Info className="w-4 h-4 text-[#42866A]" />
                <span>Empirical Takeaway & Analytical Context</span>
              </div>
              <p className="text-[#1B2923]/80 leading-relaxed font-normal">
                {activeModalCard.takeaway}
              </p>
              <p className="text-[#64748B] pt-1 border-t border-stone-200 leading-relaxed">
                <strong>Methodology:</strong> {activeModalCard.methodology}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedChartId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-[#173D32] text-white hover:bg-[#42866A] transition-colors"
              >
                Close Visualization
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BrowseDataGrid;
