import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bot,
  BrainCircuit,
  Cpu,
  Layers,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sliders,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { PageIntro } from '../components/ui';
import AIWorkspaceNav from '../components/ai-workspace/AIWorkspaceNav';
import AIOverviewSection from '../components/ai-workspace/AIOverviewSection';
import AIPrioritizationSection from '../components/ai-workspace/AIPrioritizationSection';
import AIImpactSection from '../components/ai-workspace/AIImpactSection';
import AIVisualizationSection from '../components/ai-workspace/AIVisualizationSection';
import AIRepairPlanningSection from '../components/ai-workspace/AIRepairPlanningSection';
import AICitizenAssistanceSection from '../components/ai-workspace/AICitizenAssistanceSection';
import AICoordinatorSection from '../components/ai-workspace/AICoordinatorSection';

const VALID_TABS = ['overview', 'prioritization', 'impact', 'visualization', 'planning', 'citizen', 'coordinator'];

const getTabFromHash = () => {
  try {
    const raw = window.location.hash;
    if (raw.includes('?tab=')) {
      const tab = raw.split('?tab=')[1].split('&')[0];
      if (VALID_TABS.includes(tab)) return tab;
    }
  } catch {}
  return 'overview';
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
    window.location.hash = `/ai-agent?tab=${tabId}`;
  };

  return (
    <div className="page-stack agent-page" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Workspace Header */}
      <PageIntro
        eyebrow="Unified Municipal Decision Support"
        title="GaunPulse AI Intelligence"
        description="Understand problems. Compare impacts. Make informed decisions. An integrated workspace coordinating specialized rural infrastructure AI agents."
        actions={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e3f3e3', color: '#176342', padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700 }}>
            <Cpu size={14} /> NetworkX 3.x + MySQL ServBay
          </div>
        }
      />

      {/* Secondary Navigation Tabs */}
      <AIWorkspaceNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Active Agent Workspace Section */}
      <div role="tabpanel" id={`ai-tab-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'overview' && (
          <AIOverviewSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'prioritization' && (
          <AIPrioritizationSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'impact' && (
          <AIImpactSection onSelectTab={handleSelectTab} onNavigate={onNavigate} />
        )}

        {activeTab === 'visualization' && (
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
      </div>
    </div>
  );
}
