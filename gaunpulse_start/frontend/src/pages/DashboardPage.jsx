import AIAgentPreview from '../components/AIAgentPreview';
import CommunityVoices from '../components/CommunityVoices';
import ConnectivityTrendChart from '../components/ConnectivityTrendChart';
import ImpactSimulationPreview from '../components/ImpactSimulationPreview';
import PriorityActionQueue from '../components/PriorityActionQueue';
import StatCard from '../components/StatCard';
import VillageMapPreview from '../components/VillageMapPreview';
import WelcomeBanner from '../components/WelcomeBanner';
import { summaryStats } from '../data/demoData';

export default function DashboardPage({ onNavigate }) {
  return (
    <div className="page-stack">
      <WelcomeBanner onExplore={() => onNavigate('village-map')} />

      <section className="stats-grid" aria-label="Municipality summary">
        {summaryStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
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
