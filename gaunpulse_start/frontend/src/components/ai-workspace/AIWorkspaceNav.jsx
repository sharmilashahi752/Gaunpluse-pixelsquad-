import {
  BarChart3,
  Bot,
  BrainCircuit,
  ClipboardList,
  GitFork,
  HelpCircle,
  LayoutDashboard,
  MessageSquareText,
  Network,
  Sliders,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';

export const AI_TABS = [
  { id: 'overview', label: 'AI Overview', icon: Sparkles, badge: 'Hub' },
  { id: 'prioritization', label: 'Problem Prioritization', icon: Sliders, badge: 'Scoring' },
  { id: 'impact', label: 'Infrastructure Impact', icon: Network, badge: 'NetworkX' },
  { id: 'visualization', label: 'Reports & Visualization', icon: BarChart3, badge: 'Charts' },
  { id: 'planning', label: 'Repair Planning', icon: Wrench, badge: 'Action Plans' },
  { id: 'citizen', label: 'Citizen Assistance', icon: MessageSquareText, badge: 'Bilingual' },
  { id: 'coordinator', label: 'AI Coordinator', icon: Bot, badge: 'Multi-Agent' },
];

export default function AIWorkspaceNav({ activeTab, onSelectTab }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '6px 8px',
        background: '#ffffff',
        border: '1px solid #ddeadb',
        borderRadius: 12,
        overflowX: 'auto',
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
      role="tablist"
      aria-label="AI Intelligence Agents"
    >
      {AI_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: isActive ? '#176342' : 'transparent',
              color: isActive ? '#ffffff' : '#476258',
              fontWeight: isActive ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              if (!isActive) e.currentTarget.style.background = '#f0f6f2';
            }}
            onMouseOut={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icon size={15} color={isActive ? '#cbeaca' : '#176342'} />
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: 4,
                background: isActive ? 'rgba(255,255,255,0.2)' : '#e8f2ea',
                color: isActive ? '#ffffff' : '#176342',
              }}
            >
              {tab.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}
