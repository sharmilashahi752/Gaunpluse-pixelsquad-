import { useEffect, useState } from 'react';
import { MapPinned, Radio, TriangleAlert, Users } from 'lucide-react';
import AIAgentPreview from '../components/AIAgentPreview';
import CommunityVoices from '../components/CommunityVoices';
import ConnectivityTrendChart from '../components/ConnectivityTrendChart';
import ImpactSimulationPreview from '../components/ImpactSimulationPreview';
import PriorityActionQueue from '../components/PriorityActionQueue';
import StatCard from '../components/StatCard';
import VillageMapPreview from '../components/VillageMapPreview';
import WelcomeBanner from '../components/WelcomeBanner';
import { summaryStats as fallbackStats } from '../data/demoData';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load dashboard stats:', err));
  }, []);

  const liveStats = [
    {
      label: 'Monitored Villages',
      value: String(stats?.monitored_villages ?? 1),
      change: '1 demo network active',
      tone: 'green',
      icon: MapPinned,
    },
    {
      label: 'Active Issues',
      value: String(stats?.active_issues ?? 4),
      change: `${stats?.resolved_issues ?? 1} resolved`,
      tone: 'orange',
      icon: Radio,
    },
    {
      label: 'Critical Disruptions',
      value: String(stats?.critical_disruptions ?? 1),
      change: 'Needs immediate review',
      tone: 'red',
      icon: TriangleAlert,
    },
    {
      label: 'Affected Households',
      value: String(stats?.affected_households ?? 73),
      change: 'Across active village wards',
      tone: 'mint',
      icon: Users,
    },
  ];

  return (
    <div className="page-stack">
      <WelcomeBanner onExplore={() => onNavigate('village-map')} />

      <section className="stats-grid" aria-label="Municipality summary">
        {liveStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid dashboard-grid--primary">
        <VillageMapPreview onOpenMap={() => onNavigate('village-map')} />
        <ImpactSimulationPreview onOpenSimulation={() => onNavigate('simulations')} />
      </div>

      <div className="dashboard-grid dashboard-grid--secondary">
        <PriorityActionQueue onViewAll={() => onNavigate('action-plans')} />
        <ConnectivityTrendChart />
      </div>

      <div className="dashboard-grid dashboard-grid--tertiary">
        <CommunityVoices onViewAll={() => onNavigate('community-voices')} />
        <AIAgentPreview onOpenAgent={() => onNavigate('ai-agent')} />
      </div>
    </div>
  );
}
