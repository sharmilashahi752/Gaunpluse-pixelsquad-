import { TrendingUp } from 'lucide-react';
import { connectivityTrend } from '../data/demoData';
import { Card, CardHeader, DemoLabel } from './ui';

const points = connectivityTrend.map((item, index) => ({
  ...item,
  x: 8 + index * (84 / (connectivityTrend.length - 1)),
  y: 88 - ((item.value - 55) / 35) * 70,
}));
const polyline = points.map(({ x, y }) => `${x},${y}`).join(' ');
const area = `8,91 ${polyline} 92,91`;

export default function ConnectivityTrendChart() {
  return (
    <Card className="trend-card">
      <CardHeader
        eyebrow="Six-month view"
        title="Infrastructure connectivity"
        description="Illustrative share of households connected to key services."
        action={<DemoLabel compact />}
      />
      <div className="trend-summary">
        <strong>84%</strong>
        <span><TrendingUp size={14} /> 6 points since October</span>
      </div>
      <div className="chart-wrap" aria-label="Connectivity trend from June to November, rising from 66 to 84 percent">
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
          {points.map((point) => <circle key={point.month} cx={point.x} cy={point.y} r="1.8" />)}
        </svg>
        <div className="chart-labels">
          {connectivityTrend.map(({ month }) => <span key={month}>{month}</span>)}
        </div>
      </div>
    </Card>
  );
}
