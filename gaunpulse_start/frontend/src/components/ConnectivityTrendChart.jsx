import { useEffect, useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from './ui';

export default function ConnectivityTrendChart() {
  const [trends, setTrends] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetch('/api/reports/trends')
      .then((r) => r.json())
      .then((data) => setTrends(data))
      .catch((e) => console.warn('Could not load trends:', e));

    fetch('/api/reports/overview')
      .then((r) => r.json())
      .then((data) => setOverview(data))
      .catch((e) => console.warn('Could not load overview:', e));
  }, []);

  const timeline = trends?.timeline || [
    { label: 'Jun', submitted: 0, resolved: 0 },
    { label: 'Jul', submitted: 0, resolved: 0 },
    { label: 'Aug', submitted: 0, resolved: 0 },
    { label: 'Sep', submitted: 0, resolved: 0 },
    { label: 'Oct', submitted: 0, resolved: 0 },
    { label: 'Nov', submitted: 8, resolved: 1 },
  ];

  // Map timeline to chart points
  const maxVal = Math.max(...timeline.map((t) => t.submitted + t.resolved), 5);
  const points = timeline.map((item, index) => {
    const total = item.submitted;
    const yVal = 88 - (total / maxVal) * 65;
    return {
      month: item.label || item.month_key,
      value: total,
      x: 8 + index * (84 / Math.max(timeline.length - 1, 1)),
      y: Math.max(15, Math.min(88, yVal)),
    };
  });

  const polyline = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const area = `8,91 ${polyline} 92,91`;

  const totalLifelines = overview?.infrastructure?.total_edges ?? 4587;
  const resolutionRate = overview?.kpis?.resolution_rate?.formatted ?? '12.5%';

  return (
    <Card className="trend-card">
      <CardHeader
        title="Infrastructure connectivity & triage"
        description="Real-time timeline of municipal issue registrations and resolution flow."
      />
      <div className="trend-summary">
        <strong>{resolutionRate}</strong>
        <span><TrendingUp size={14} /> {totalLifelines.toLocaleString()} monitored lifelines in database</span>
      </div>
      <div className="chart-wrap" aria-label="Monthly issue inflow and resolution timeline">
        <svg className="line-chart" viewBox="0 0 100 100" role="img" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#42a875" stopOpacity=".3" />
              <stop offset="100%" stopColor="#42a875" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="8" x2="92" y1="22" y2="22" />
          <line x1="8" x2="92" y1="56" y2="56" />
          <line x1="8" x2="92" y1="91" y2="91" />
          <polygon points={area} fill="url(#chartArea)" />
          <polyline className="line-chart__path" points={polyline} />
          {points.map((point) => <circle key={point.month} cx={point.x} cy={point.y} r="2.2" fill="#176342" />)}
        </svg>
        <div className="chart-labels">
          {points.map(({ month }) => <span key={month}>{month}</span>)}
        </div>
      </div>
    </Card>
  );
}
