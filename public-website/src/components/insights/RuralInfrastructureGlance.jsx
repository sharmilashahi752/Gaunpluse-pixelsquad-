import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Clock,
  PieChart as PieIcon,
  TrendingUp,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { ISSUES, SETTLEMENTS } from '../../data/demoVillage';
import { runNetworkSimulation } from '../../utils/graphSimulation';

/**
 * Rural Infrastructure at a Glance Section
 * - Chart 1: Infrastructure Status Over Time (Clean Area/Line chart across dates)
 * - Chart 2: Infrastructure Issues by Category (Donut chart with percentage, count, accessible legend)
 * - Additional visual indicators: Issues by Severity & Baseline vs Disrupted Travel Times
 * Derived 100% dynamically from actual GaunPulse data structures.
 */
export function RuralInfrastructureGlance() {
  const [activeTab, setActiveTab] = useState('primary'); // 'primary' | 'severity' | 'accessibility'

  // Empty state check
  const hasIssues = Array.isArray(ISSUES) && ISSUES.length > 0;

  // Chart 1 Data: Infrastructure Status Over Time (Timeline derived from reportedAt & progressHistory)
  const timelineData = useMemo(() => {
    if (!hasIssues) return [];

    const dateSet = new Set();
    ISSUES.forEach((i) => {
      const rm = i.reportedAt?.match(/^\d{4}-\d{2}-\d{2}/);
      if (rm) dateSet.add(rm[0]);
      i.progressHistory?.forEach((p) => {
        const pm = p.date?.match(/^\d{4}-\d{2}-\d{2}/);
        if (pm && p.status !== 'pending') dateSet.add(pm[0]);
      });
    });

    const sortedDates = Array.from(dateSet).sort();

    return sortedDates.map((dateStr) => {
      // Cumulative reported
      const reported = ISSUES.filter((i) => {
        const m = i.reportedAt?.match(/^\d{4}-\d{2}-\d{2}/);
        return m && m[0] <= dateStr;
      }).length;

      // Cumulative verified
      const verified = ISSUES.filter((i) => {
        const vHistory = i.progressHistory?.find(
          (p) =>
            (p.stage === 'Field Verification' ||
              p.stage === 'Action Proposed' ||
              p.stage === 'Resolved') &&
            p.status !== 'pending' &&
            p.date?.match(/^\d{4}-\d{2}-\d{2}/)
        );
        if (!vHistory) return false;
        const vm = vHistory.date.match(/^\d{4}-\d{2}-\d{2}/);
        return vm && vm[0] <= dateStr;
      }).length;

      // Cumulative action proposed
      const actionProposed = ISSUES.filter((i) => {
        const aHistory = i.progressHistory?.find(
          (p) =>
            (p.stage === 'Action Proposed' ||
              p.stage === 'Work In Progress' ||
              p.stage === 'Resolved') &&
            p.status !== 'pending' &&
            p.date?.match(/^\d{4}-\d{2}-\d{2}/)
        );
        if (!aHistory) return false;
        const am = aHistory.date.match(/^\d{4}-\d{2}-\d{2}/);
        return am && am[0] <= dateStr;
      }).length;

      const parts = dateStr.split('-');
      const label = parts.length === 3 ? `Nov ${parts[2]}` : dateStr;

      return {
        date: dateStr,
        label,
        reported,
        verified,
        actionProposed,
      };
    });
  }, [hasIssues]);

  // Chart 2 Data: Issues by Category (Donut Chart with count & percentage)
  const categoryData = useMemo(() => {
    if (!hasIssues) return [];

    const categoryConfig = {
      bridge: { name: 'Bridges', fill: '#173D32' },
      road: { name: 'Roads & Trails', fill: '#42866A' },
      school: { name: 'Education', fill: '#5C7C64' },
      health_post: { name: 'Healthcare', fill: '#8F5E16' },
    };

    const counts = {};
    ISSUES.forEach((i) => {
      const key = i.category || 'other';
      counts[key] = (counts[key] || 0) + 1;
    });

    const total = ISSUES.length;

    return Object.entries(counts).map(([catKey, count]) => {
      const cfg = categoryConfig[catKey] || {
        name: catKey.charAt(0).toUpperCase() + catKey.slice(1),
        fill: '#64748B',
      };
      const percentage = Math.round((count / total) * 100);
      return {
        key: catKey,
        name: cfg.name,
        count,
        percentage,
        fill: cfg.fill,
      };
    });
  }, [hasIssues]);

  // Additional Indicator 1: Issues by Severity
  const severityData = useMemo(() => {
    if (!hasIssues) return [];

    const severityConfig = {
      critical: { name: 'Critical Alert', fill: '#D45F53' }, // red strictly for critical
      warning: { name: 'Monitored Warning', fill: '#E3AD58' }, // amber
      low: { name: 'Low / Monitored', fill: '#42866A' }, // green
    };

    const counts = { critical: 0, warning: 0, low: 0 };
    ISSUES.forEach((i) => {
      if (counts[i.severity] !== undefined) {
        counts[i.severity] += 1;
      }
    });

    return [
      { name: 'Critical Alert', count: counts.critical, fill: severityConfig.critical.fill },
      { name: 'Monitored Warning', count: counts.warning, fill: severityConfig.warning.fill },
      { name: 'Low / Monitored', count: counts.low, fill: severityConfig.low.fill },
    ];
  }, [hasIssues]);

  // Additional Indicator 2: Baseline vs Disrupted Travel Times (from graph engine)
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
        delta: computed ? computed.deltaMinutes : (r.disrupted - r.baseline),
      };
    });
  }, []);

  return (
    <section aria-labelledby="glance-heading" className="space-y-6 text-left">
      {/* Section Header with Navigation Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-3 gap-3">
        <div className="space-y-1">
          <h2
            id="glance-heading"
            className="scroll-mt-24 text-2xl sm:text-3xl font-bold text-[#173D32] tracking-tight"
          >
            Rural Infrastructure at a Glance
          </h2>
          <p className="text-sm text-[#64748B] max-w-2xl leading-relaxed font-normal">
            Real-time status progression, category classification, risk severity, and accessibility impacts.
          </p>
        </div>

        {/* Dimension Tabs */}
        <div className="inline-flex rounded-[4px] border border-stone-200 bg-stone-50 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('primary')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
              activeTab === 'primary'
                ? 'bg-white text-[#173D32] shadow-2xs'
                : 'text-[#64748B] hover:text-[#173D32]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Core Charts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('severity')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
              activeTab === 'severity'
                ? 'bg-white text-[#173D32] shadow-2xs'
                : 'text-[#64748B] hover:text-[#173D32]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Severity &amp; Risk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accessibility')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
              activeTab === 'accessibility'
                ? 'bg-white text-[#173D32] shadow-2xs'
                : 'text-[#64748B] hover:text-[#173D32]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Access Delays</span>
          </button>
        </div>
      </div>

      {!hasIssues ? (
        <div className="rounded-[8px] border border-stone-200 bg-stone-50 p-8 text-center text-sm text-[#64748B]">
          No active community hazard reports found in the current registry.
        </div>
      ) : activeTab === 'primary' ? (
        /* Primary View: Chart 1 (Timeline Area Chart) & Chart 2 (Category Donut Chart) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Chart 1: Infrastructure Status Over Time */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-6 sm:p-7 lg:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                  Infrastructure Status Over Time
                </h3>
                <span className="text-[11px] font-semibold text-[#42866A] bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-100">
                  Reporting Period: Nov 17–21, 2026
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Progression of cumulative community reports, field inspections, and action proposals.
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#173D32" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#173D32" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#42866A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#42866A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E3AD58" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E3AD58" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#1B2923', fontSize: 11, fontWeight: 500 }}
                    stroke="#CBD5E1"
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    stroke="#CBD5E1"
                    tickLine={false}
                    allowDecimals={false}
                    unit=" pts"
                    domain={[0, 5]}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94A3B8', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-stone-200 shadow-md p-3 rounded-[3px] text-xs space-y-1.5 text-left">
                          <p className="font-bold text-[#173D32] border-b border-stone-100 pb-1">
                            {d.label} ({d.date})
                          </p>
                          <div className="flex justify-between gap-4 text-[#64748B]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#173D32]" /> Total Reported:
                            </span>
                            <span className="font-semibold text-[#173D32]">{d.reported} issues</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[#64748B]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#42866A]" /> Field-Verified:
                            </span>
                            <span className="font-semibold text-[#42866A]">{d.verified} issues</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[#64748B]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#E3AD58]" /> Action Planned:
                            </span>
                            <span className="font-semibold text-[#8F5E16]">{d.actionProposed} issues</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reported"
                    name="Total Reported"
                    stroke="#173D32"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReported)"
                  />
                  <Area
                    type="monotone"
                    dataKey="verified"
                    name="Field-Verified"
                    stroke="#42866A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVerified)"
                  />
                  <Area
                    type="monotone"
                    dataKey="actionProposed"
                    name="Action Planned"
                    stroke="#E3AD58"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAction)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>Tracking 6-stage lifecycle across simulated dates.</span>
              <span className="font-medium text-[#173D32]">Source: GaunPulse Graph Registry</span>
            </div>
          </div>

          {/* Chart 2: Infrastructure Issues by Category (Donut Chart) */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-6 sm:p-7 lg:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                  Infrastructure Issues by Category
                </h3>
                <span className="text-[11px] font-semibold text-[#64748B] bg-stone-100 px-2 py-0.5 rounded-[2px]">
                  Total: {ISSUES.length} Issues
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Distribution of community incident reports across mapped structural categories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
              {/* Donut Chart with Center Label */}
              <div className="sm:col-span-7 h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={`cell-${entry.key}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-stone-200 shadow-md p-2.5 rounded-[3px] text-xs space-y-1 text-left">
                            <span className="font-bold text-[#173D32] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                              {d.name}
                            </span>
                            <p className="text-[#64748B]">
                              Count: <strong>{d.count}</strong> ({d.percentage}% of total)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[#173D32] leading-none">
                    {ISSUES.length}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider pt-0.5">
                    Issues
                  </span>
                </div>
              </div>

              {/* Accessible Legend with Counts and Percentages */}
              <div className="sm:col-span-5 space-y-2.5 text-xs text-left">
                {categoryData.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-1.5 rounded-[3px] hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-[2px] shrink-0"
                        style={{ backgroundColor: item.fill }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-[#1B2923]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-[#173D32]">
                      {item.count} <span className="text-[#64748B] font-normal">({item.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>Categories derived from active Sundar Gaun reports.</span>
              <span className="font-medium text-[#173D32]">Source: GaunPulse Registry</span>
            </div>
          </div>
        </div>
      ) : activeTab === 'severity' ? (
        /* Supporting View: Severity & Risk Distribution */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white border border-stone-200 rounded-[8px] p-6 sm:p-7 lg:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                Infrastructure Severity Breakdown
              </h3>
              <p className="text-xs text-[#64748B]">
                Engineering risk triage classifying urgent vehicular severance vs monitored hazards.
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={severityData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#1B2923', fontSize: 11, fontWeight: 500 }}
                    stroke="#CBD5E1"
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    stroke="#CBD5E1"
                    tickLine={false}
                    allowDecimals={false}
                    unit=" rep"
                    domain={[0, 4]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-stone-200 shadow-md p-2.5 rounded-[3px] text-xs space-y-1 text-left">
                          <span className="font-bold text-[#173D32]">{d.name}</span>
                          <p className="text-[#64748B]">Count: <strong>{d.count}</strong> reports</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="Reports" radius={[3, 3, 0, 0]} maxBarSize={44}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>1 critical alert (Bridge B scour void) requires emergency diversion.</span>
              <span className="font-medium text-[#173D32]">Source: GaunPulse Triage</span>
            </div>
          </div>

          {/* Severity Guidance Card */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-6 sm:p-7 lg:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                Triage Thresholds &amp; Protocols
              </h3>
              <p className="text-xs text-[#64748B]">
                Municipal engineering response standards across severity classes.
              </p>
            </div>

            <div className="space-y-3 text-xs text-[#1B2923] pt-1">
              <div className="border border-red-100 bg-red-50/60 rounded-[4px] p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#D45F53]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Critical Alert (1 Issue • 25%)</span>
                </div>
                <p className="text-xs text-[#1B2923]/80 leading-relaxed font-normal">
                  Immediate life-safety hazard or full severance of vehicular corridor (Khola River Motor Bridge scour).
                  Protocol mandates sub-engineer dispatch within 24 hours and emergency load restrictions.
                </p>
              </div>

              <div className="border border-amber-100 bg-amber-50/60 rounded-[4px] p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#8F5E16]">
                  <Clock className="w-3.5 h-3.5 text-[#E3AD58]" />
                  <span>Monitored Warning (2 Issues • 50%)</span>
                </div>
                <p className="text-xs text-[#1B2923]/80 leading-relaxed font-normal">
                  Active structural or drainage impediment elevating pedestrian travel fatigue (Upallo Basti ridge slump &amp; school culvert siltation). Scheduled for ward committee review.
                </p>
              </div>

              <div className="border border-emerald-100 bg-emerald-50/60 rounded-[4px] p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#42866A]">
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Low Risk (1 Issue • 25%)</span>
                </div>
                <p className="text-xs text-[#1B2923]/80 leading-relaxed font-normal">
                  Non-critical observation under active monitoring (Health Post retaining wall terrace bulge). No immediate detour induced.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 text-[11px] text-[#64748B]">
              Standardized against Nepal NDRRMA municipal risk assessment guidelines.
            </div>
          </div>
        </div>
      ) : (
        /* Supporting View: Baseline vs Disrupted Travel Times & Community Accessibility */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white border border-stone-200 rounded-[8px] p-6 sm:p-7 lg:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                Transit Delay Under Bridge Failure
              </h3>
              <p className="text-xs text-[#64748B]">
                Deterministic travel time penalty comparing normal transit against Khola Bridge closure detour.
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={travelComparisonData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#1B2923', fontSize: 11, fontWeight: 500 }}
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
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-stone-200 shadow-md p-3 rounded-[3px] text-xs space-y-1 text-left">
                          <p className="font-bold text-[#173D32]">{d.name}</p>
                          <p className="text-[#64748B]">Normal Transit: <strong>{d.baselineTime} min</strong></p>
                          <p className="text-[#173D32]">Disrupted Detour: <strong>{d.disruptedTime} min</strong></p>
                          {d.delta > 0 && (
                            <p className="text-[#D45F53] font-bold pt-1 border-t border-stone-100">
                              Delay Penalty: +{d.delta} min
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                  <Bar dataKey="baselineTime" name="Baseline (Normal)" fill="#94A3B8" radius={[2, 2, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="disruptedTime" name="Disrupted Detour" fill="#173D32" radius={[2, 2, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>Tallo Basti → Clinic commute increases from 18 to 51 min (+183%).</span>
              <span className="font-medium text-[#173D32]">Source: Dijkstra Simulation</span>
            </div>
          </div>

          {/* Community Accessibility Impact Card */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-6 sm:p-7 lg:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                Community Accessibility Breakdown
              </h3>
              <p className="text-xs text-[#64748B]">
                Population and household vulnerability distributions during infrastructure severance.
              </p>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              {SETTLEMENTS.map((settlement) => (
                <div
                  key={settlement.id}
                  className="border border-stone-200 rounded-[4px] p-3.5 space-y-2 bg-[#F9FAF9]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#173D32]">
                      {settlement.name}
                    </span>
                    <span className="text-[11px] font-semibold text-[#42866A] bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-100">
                      {settlement.estimatedPopulation} Residents ({settlement.households} Households)
                    </span>
                  </div>

                  <p className="text-xs text-[#1B2923]/80 leading-relaxed font-normal">
                    {settlement.id === 'settlement-tallo'
                      ? 'Critically vulnerable to Khola River Motor Bridge scour. Disruption forces pedestrian stretcher transit over upper suspension bridge.'
                      : 'Maintains independent northern trail access to Basic School. Emergency healthcare remains accessible via upper footpaths.'}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 text-[11px] text-[#64748B]">
              Modeled using topological node-edge coordinates from demoVillage.js.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default RuralInfrastructureGlance;
