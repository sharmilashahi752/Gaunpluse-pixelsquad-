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
} from 'recharts';
import Card from '../ui/Card';
import { ISSUES } from '../../data/demoVillage';

/**
 * Three Recharts visualizations depicting issues by category, verification status, and severity
 */
export function IssueCharts() {
  // Chart 1: Issue Categories Data
  const categoryData = useMemo(() => {
    const counts = {
      bridge: 0,
      road: 0,
      school: 0,
      health_post: 0,
    };
    ISSUES.forEach((i) => {
      if (counts[i.category] !== undefined) {
        counts[i.category] += 1;
      }
    });

    return [
      { name: 'Bridges', count: counts.bridge, fill: '#D45F53' },
      { name: 'Roads & Trails', count: counts.road, fill: '#42866A' },
      { name: 'School Access', count: counts.school, fill: '#173D32' },
      { name: 'Health Access', count: counts.health_post, fill: '#E3AD58' },
    ];
  }, []);

  // Chart 2: Progress & Verification Pipeline Data
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

  // Chart 3: Severity Breakdown Data
  const severityData = useMemo(() => {
    const counts = {
      critical: 0,
      warning: 0,
      low: 0,
    };
    ISSUES.forEach((i) => {
      if (counts[i.severity] !== undefined) {
        counts[i.severity] += 1;
      }
    });

    return [
      { name: 'Critical Alert', value: counts.critical, fill: '#D45F53' },
      { name: 'Monitored Warning', value: counts.warning, fill: '#E3AD58' },
      { name: 'Low / Monitored', value: counts.low, fill: '#42866A' },
    ];
  }, []);

  const customTooltipStyle = {
    backgroundColor: '#F8F7F2',
    border: '1px solid rgba(66, 134, 106, 0.3)',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    color: '#173D32',
    fontWeight: 600,
    padding: '0.5rem 0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
          Infrastructure Distribution Charts
        </h3>
        <span className="text-[11px] text-[#1B2923]/60 font-medium">
          Derived from {ISSUES.length} Active Demonstration Reports
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Issue by Category */}
        <Card className="p-5 bg-white/90 border-[#42866A]/20 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#173D32] mb-1">
              1. Issues by Infrastructure Category
            </h4>
            <p className="text-xs text-[#1B2923]/70 mb-4">
              Distribution of community observations across physical asset types.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 25 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#173D32', fontWeight: 600 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#1B2923' }}
                    domain={[0, 2]}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value) => [`${value} report(s)`, 'Volume']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-cat-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-[#42866A]/15 text-[11px] text-[#1B2923]/75 space-y-1">
            <p>
              • <strong>Bridges & Roads:</strong> Essential transit arteries representing primary mobility concerns.
            </p>
            <p>
              • <strong>Schools & Clinics:</strong> Access spur routes critical to vulnerable daily commuters.
            </p>
          </div>
        </Card>

        {/* Chart 2: Pipeline Stage Distribution */}
        <Card className="p-5 bg-white/90 border-[#42866A]/20 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#173D32] mb-1">
              2. Active Pipeline Stage Distribution
            </h4>
            <p className="text-xs text-[#1B2923]/70 mb-4">
              Progress of demonstration issues through the 6-stage lifecycle.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 25 }}
                >
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: '#173D32', fontWeight: 600 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#1B2923' }}
                    domain={[0, 3]}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value) => [`${value} report(s)`, 'In Stage']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-pipe-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-[#42866A]/15 text-[11px] text-[#1B2923]/75 space-y-1">
            <p>
              • <strong>Action Proposed (2):</strong> Drainage and trail stabilization plans submitted to ward council.
            </p>
            <p>
              • <strong>Field Check & Review (2):</strong> Active geotechnical and perimeter inspections.
            </p>
          </div>
        </Card>

        {/* Chart 3: Severity Distribution */}
        <Card className="p-5 bg-white/90 border-[#42866A]/20 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#173D32] mb-1">
              3. Issue Severity Distribution
            </h4>
            <p className="text-xs text-[#1B2923]/70 mb-4">
              Prioritization urgency based on life-safety and isolation risk.
            </p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value) => [`${value} report(s)`, 'Urgency']}
                  />
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-sev-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-[#42866A]/15 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#D45F53] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#D45F53]" />
                Critical Alert
              </span>
              <span className="font-bold text-[#173D32]">1 (25%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#8F5E16] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#E3AD58]" />
                Monitored Warning
              </span>
              <span className="font-bold text-[#173D32]">2 (50%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#42866A] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#42866A]" />
                Low / Monitored
              </span>
              <span className="font-bold text-[#173D32]">1 (25%)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default IssueCharts;
