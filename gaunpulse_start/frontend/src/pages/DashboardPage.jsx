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

  const isRealData = Boolean(stats);
  const villageCount = stats?.monitored_villages ?? 1;

  const liveStats = [
    {
      label: 'Monitored Villages',
      value: stats ? String(stats.monitored_villages) : '...',
      change: stats
        ? `${stats.monitored_villages} active municipal network${stats.monitored_villages === 1 ? '' : 's'}`
        : 'Connecting to database...',
      tone: 'green',
      icon: MapPinned,
      isLive: isRealData,
    },
    {
      label: 'Active Issues',
      value: stats ? String(stats.active_issues) : '...',
      change: stats
        ? `${stats.resolved_issues ?? 0} resolved in database`
        : 'Loading triage queue...',
      tone: 'orange',
      icon: Radio,
      isLive: isRealData,
    },
    {
      label: 'Critical Disruptions',
      value: stats ? String(stats.critical_disruptions) : '...',
      change: stats
        ? ((stats.critical_disruptions ?? 0) > 0 ? `${stats.critical_disruptions} need immediate review` : 'All critical lifelines operational')
        : 'Evaluating risk...',
      tone: 'red',
      icon: TriangleAlert,
      isLive: isRealData,
    },
    {
      label: 'Affected Households',
      value: stats ? String(stats.affected_households) : '...',
      change: 'Across active settlement network',
      tone: 'mint',
      icon: Users,
      isLive: isRealData,
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
