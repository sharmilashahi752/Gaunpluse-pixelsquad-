import React, { useMemo } from 'react';
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
import { ISSUES } from '../../data/demoVillage';
import { runNetworkSimulation } from '../../utils/graphSimulation';

/**
 * "Infrastructure at a Glance" Visualizations Section
 * Inspired by Our World in Data chart cards with explicit titles, explanations, legends, and source notes.
 */
export function InfrastructureAtAGlance() {
  // Chart 1: Category Data
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

  // Chart 2: Severity Data (Donut)
  const severityData = useMemo(() => {
    const counts = { critical: 0, warning: 0, low: 0 };
    ISSUES.forEach((i) => {
      if (counts[i.severity] !== undefined) counts[i.severity] += 1;
    });

    return [
      { name: 'Critical Alert', value: counts.critical, fill: '#D45F53' },
      { name: 'Monitored Warning', value: counts.warning, fill: '#E3AD58' },
      { name: 'Low / Monitored', value: counts.low, fill: '#42866A' },
    ];
  }, []);

  // Chart 3: Verification & Repair Pipeline (Horizontal Bar)
  const pipelineData = useMemo(() => {
    const stageCounts = {
      under_review: 0,
      field_verification: 0,
      action_proposed: 0,
    };
    ISSUES.forEach((i) => {
      if (stageCounts[i.progressStatus] !== undefined) {
        stageCounts[i.progressStatus] += 1;
      }
    });

    return [
      { stage: 'Under Review', count: stageCounts.under_review, fill: '#E3AD58' },
      { stage: 'Field Verification', count: stageCounts.field_verification, fill: '#173D32' },
      { stage: 'Action Proposed', count: stageCounts.action_proposed, fill: '#42866A' },
    ];
  }, []);

  // Chart 4: Baseline vs Disrupted Travel Time Comparison
  const travelComparisonData = useMemo(() => {
    // Run deterministic bridge closure scenario
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
        baseline: 12,
        disrupted: 36,
      },
      {
        routeLabel: 'Upallo → Clinic',
        settlement: 'settlement-upallo',
        facility: 'facility-health',
        baseline: 15,
        disrupted: 15,
      },
      {
        routeLabel: 'Upallo → School',
        settlement: 'settlement-upallo',
        facility: 'facility-school',
        baseline: 20,
        disrupted: 20,
      },
    ];

    return routes.map((r) => {
      const computed = sim.routeResults.find(
        (res) => res.settlementId === r.settlement && res.facilityId === r.facility
      );
      return {
        name: r.routeLabel,
        baselineTime: computed ? computed.baselineTime : r.baseline,
        disruptedTime: computed ? computed.scenarioTime : r.disrupted,
      };
    });
  }, []);

  const owidTooltipStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#173D32',
    padding: '8px 12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  };

  return (
    <section aria-labelledby="glance-heading" className="space-y-6 text-left">
      <div className="border-b border-stone-200 pb-3">
        <h2
          id="glance-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#173D32]"
        >
          Infrastructure at a Glance
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Empirical distributions and network connectivity metrics computed from the Sundar Gaun topology dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Category Distribution */}
        <div className="border border-stone-200 bg-white p-5 rounded-[4px] flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#42866A] block">
              FIGURE 1 • DISTRIBUTION
            </span>
            <h3 className="text-base font-bold text-[#173D32] leading-snug">
              Issues by Infrastructure Category
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Relative frequency of reported hazards categorized by physical infrastructure function.
            </p>
          </div>

          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  interval={0}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={owidTooltipStyle} />
                <Bar dataKey="count" name="Report Count" radius={[2, 2, 0, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend & Source */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-[#64748B]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#173D32]" />
                <span>Bridges</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42866A]" />
                <span>Roads & Corridors</span>
              </span>
            </div>
            <span className="italic">Source: Sundar Gaun Active Reports ({ISSUES.length} total)</span>
          </div>
        </div>

        {/* Chart 2: Severity Breakdown (Donut) */}
        <div className="border border-stone-200 bg-white p-5 rounded-[4px] flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#42866A] block">
              FIGURE 2 • RISK PROFILE
            </span>
            <h3 className="text-base font-bold text-[#173D32] leading-snug">
              Infrastructure Issue Severity
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Breakdown of hazards by risk urgency: Critical Alert, Monitored Warning, or Low.
            </p>
          </div>

          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={owidTooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>1 Critical • 2 Warning • 1 Monitored</span>
            <span className="italic">Source: Ward Technical Risk Classification</span>
          </div>
        </div>

        {/* Chart 3: Verification & Progress Pipeline (Horizontal Bar) */}
        <div className="border border-stone-200 bg-white p-5 rounded-[4px] flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#42866A] block">
              FIGURE 3 • CIVIC WORKFLOW
            </span>
            <h3 className="text-base font-bold text-[#173D32] leading-snug">
              Verification and Repair Status
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Progress of citizen observations through the municipal validation pipeline.
            </p>
          </div>

          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={pipelineData}
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: '#173D32', fontWeight: 500 }}
                  tickLine={false}
                  width={110}
                />
                <Tooltip contentStyle={owidTooltipStyle} />
                <Bar dataKey="count" name="Issues in Stage" radius={[0, 2, 2, 0]}>
                  {pipelineData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>75% Verified or Action Proposed</span>
            <span className="italic">Source: GaunPulse 6-Stage Progress Ledger</span>
          </div>
        </div>

        {/* Chart 4: Travel Time Comparison */}
        <div className="border border-stone-200 bg-white p-5 rounded-[4px] flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#42866A] block">
              FIGURE 4 • IMPACT ANALYSIS
            </span>
            <h3 className="text-base font-bold text-[#173D32] leading-snug">
              Baseline vs. Disrupted Travel Time
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Transit durations (minutes) in normal conditions versus during Bridge BR-02 closure.
            </p>
          </div>

          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={travelComparisonData}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  unit="m"
                />
                <Tooltip contentStyle={owidTooltipStyle} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={26}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                />
                <Bar dataKey="baselineTime" name="Baseline (mins)" fill="#42866A" radius={[2, 2, 0, 0]} />
                <Bar dataKey="disruptedTime" name="Disrupted Detour (mins)" fill="#D45F53" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>+33 min delay for Tallo clinic transit</span>
            <span className="italic">Source: Dijkstra Shortest-Path Algorithm</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InfrastructureAtAGlance;
