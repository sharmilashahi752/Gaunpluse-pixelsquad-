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
import { cachedFetchJson } from '../utils/apiCache';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cachedFetchJson(
      '/api/dashboard/stats',
      {},
      {
        ttlMs: 45000,
        onBackgroundUpdate: (fresh) => {
          if (fresh) setStats(fresh);
        },
      }
    )
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  const liveStats = [
    {
      label: 'Monitored Villages',
      value: stats ? String(stats.monitored_villages) : '—',
      change: stats
        ? `${stats.monitored_villages} active municipal network${stats.monitored_villages === 1 ? '' : 's'}`
        : 'Connecting to database...',
      tone: 'green',
      icon: MapPinned,
      onClick: () => onNavigate('village-map'),
      loading,
    },
    {
      label: 'Active Issues',
      value: stats ? String(stats.active_issues) : '—',
      change: stats
        ? `${stats.resolved_issues ?? 0} resolved in database`
        : 'Loading triage queue...',
      tone: 'orange',
      icon: Radio,
      onClick: () => onNavigate('issues-alerts'),
      loading,
    },
    {
      label: 'Critical Disruptions',
      value: stats ? String(stats.critical_disruptions) : '—',
      change: stats
        ? ((stats.critical_disruptions ?? 0) > 0 ? `${stats.critical_disruptions} require immediate review` : 'All critical lifelines operational')
        : 'Evaluating risk...',
      tone: 'red',
      icon: TriangleAlert,
      onClick: () => onNavigate('issues-alerts'),
      loading,
    },
    {
      label: 'Affected Households',
      value: stats ? String(stats.affected_households) : '—',
      change: 'Across active settlement network',
      tone: 'mint',
      icon: Users,
      onClick: () => onNavigate('simulations'),
      loading,
    },
  ];

  return (
    <div className="page-stack">
      <WelcomeBanner
        userName="Asha"
        onExplore={() => onNavigate('village-map')}
        onReportIssue={() => onNavigate('issues-alerts')}
      />

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
