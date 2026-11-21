import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  Sparkles,
} from 'lucide-react';
import AIHomeScreen from '../components/ai-workspace/AIHomeScreen';
import AIPrioritizationSection from '../components/ai-workspace/AIPrioritizationSection';
import AIImpactSection from '../components/ai-workspace/AIImpactSection';
import AIVisualizationSection from '../components/ai-workspace/AIVisualizationSection';
import AIRepairPlanningSection from '../components/ai-workspace/AIRepairPlanningSection';
import AICitizenAssistanceSection from '../components/ai-workspace/AICitizenAssistanceSection';
import AICoordinatorSection from '../components/ai-workspace/AICoordinatorSection';
import AIOverviewSection from '../components/ai-workspace/AIOverviewSection';

const VALID_TABS = [
  'home',
  'prioritization',
  'impact',
  'reports',
  'visualization',
  'planning',
  'citizen',
  'coordinator',
  'overview',
];

const TASK_TITLES = {
  prioritization: 'Find Urgent Problems',
  impact: 'Check Infrastructure Impact',
  reports: 'Create Reports',
  visualization: 'Create Reports',
  planning: 'Plan a Repair',
  citizen: 'Citizen Assistance',
  coordinator: 'Multi-Agent Orchestrator',
  overview: 'Technical Overview',
};

const getTabFromHash = () => {
  try {
    const raw = window.location.hash || '';
    if (raw.includes('?tab=')) {
      const tab = raw.split('?tab=')[1].split('&')[0];
      if (VALID_TABS.includes(tab)) return tab;
    }
  } catch {}
  return 'home';
};

export default function AIAgentPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState(getTabFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tabId) => {
    if (!VALID_TABS.includes(tabId)) return;
    setActiveTab(tabId);
    if (tabId === 'home') {
      window.location.hash = '/ai-agent';
    } else {
      window.location.hash = `/ai-agent?tab=${tabId}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHome = activeTab === 'home';

  return (
    <div className="page-stack agent-page" style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* Workflow Breadcrumb Header (when viewing a specific task) */}
      {!isHome && (
        <nav className="ai-workflow-topbar" aria-label="Task Navigation">
          <div className="ai-breadcrumb">
            <button
              className="ai-back-btn"
              type="button"
              onClick={() => handleSelectTab('home')}
            >
              <ArrowLeft size={14} /> Back to AI Home
            </button>
            <ChevronRight size={14} color="#8fa097" />
            <span style={{ fontWeight: 600, color: '#092d22' }}>
              {TASK_TITLES[activeTab] || 'Task Workspace'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, background: '#eaf5ee', color: '#176342', padding: '3px 10px', borderRadius: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Globe size={12} /> Nepali & English
            </span>
          </div>
        </nav>
      )}

      {/* Primary View: AI Home vs. Task-Oriented Workflow */}
      <div role="region" aria-label="AI Intelligence Workspace">
        {isHome && (
          <AIHomeScreen onSelectTask={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'prioritization' && (
          <AIPrioritizationSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'impact' && (
          <AIImpactSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {(activeTab === 'reports' || activeTab === 'visualization') && (
          <AIVisualizationSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'planning' && (
          <AIRepairPlanningSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'citizen' && (
          <AICitizenAssistanceSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'coordinator' && (
          <AICoordinatorSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'overview' && (
          <AIOverviewSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
