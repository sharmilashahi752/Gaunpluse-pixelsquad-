import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  Network,
  RefreshCw,
  Route,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, StatusBadge } from '../ui';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: 'Namaste! I am your **GaunPulse AI assistant**.\n\nI can help you prioritize urgent repairs, simulate road and bridge disruptions, generate village reports, or prepare action plans.\n\nAsk me any question in English or Nepali, or select one of the common tasks above.',
    timestamp: 'Just now',
  },
];

const SUGGESTION_CHIPS = [
  'Which issue should Ward 3 inspect first?',
  'What happens if the bridge is blocked?',
  "Show me this month's infrastructure problems.",
  'मेरो गाउँमा कुन समस्या सबैभन्दा जरुरी छ?',
];

export default function AIHomeScreen({ onSelectTask, onNavigate }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('gaunpulse_ai_home_chat');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingPlan, setImportingPlan] = useState({});
  const [importedPlanSuccess, setImportedPlanSuccess] = useState({});
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);

  // Save conversation state
  useEffect(() => {
    try {
      sessionStorage.setItem('gaunpulse_ai_home_chat', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist AI messages:', e);
    }
  }, [messages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load live village statistics for recent activity widget
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.warn('Could not load stats for AI home:', err));
  }, []);

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    sessionStorage.removeItem('gaunpulse_ai_home_chat');
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');

    const userMessage = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          message: query,
          village_id: 1,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.text })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage = {
        role: 'assistant',
        text: data.reply || 'I analyzed the village database.',
        language: data.language,
        tools_called: data.tools_called || [],
        draft_action_plan: data.draft_action_plan || null,
        suggested_questions: data.suggested_questions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Could not reach GaunPulse AI: ${err.message}. Please verify the intelligence service is active.`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Action Plan Ingestion into MySQL
  const handleSavePlan = async (plan, msgIndex) => {
    if (!plan || importingPlan[msgIndex]) return;

    setImportingPlan((prev) => ({ ...prev, [msgIndex]: true }));
    try {
      const today = new Date();
      const dueDate = new Date(today.getTime() + (plan.target_days || 7) * 24 * 60 * 60 * 1000);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const res = await fetch('http://127.0.0.1:8000/api/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          village_id: plan.village_id || 1,
          issue_id: plan.issue_id || 1,
          title: plan.title,
          priority: plan.priority === 'Critical' ? 'Critical' : 'High',
          responsible_team: plan.responsible_team || 'Municipal Infrastructure Unit',
          ward: plan.ward || 'Ward 4',
          status: 'pending',
          progress_percentage: 0,
          target_completion_date: dueDateStr,
          description: plan.problem_summary,
          notes: `Suggested Inspection Steps:\n${(plan.suggested_inspection_steps || []).join('\n')}\n\nAccessibility: ${plan.accessibility_considerations || 'Standard field survey'}\n\nResponsibility: ${plan.proposed_responsibilities || 'Municipal Team'}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to register action plan in database.');
      }

      setImportedPlanSuccess((prev) => ({ ...prev, [msgIndex]: true }));
    } catch (e) {
      alert(`Error saving plan: ${e.message}`);
    } finally {
      setImportingPlan((prev) => ({ ...prev, [msgIndex]: false }));
    }
  };

  return (
    <div className="ai-home">
      {/* 1. Welcoming Assistant Hero */}
      <div className="ai-home-hero">
        <div className="ai-home-hero__header">
          <span className="ai-home-hero__badge">
            <Sparkles size={14} /> GaunPulse AI
          </span>
          <span className="ai-home-hero__lang">
            <Globe size={13} /> Nepali & English
          </span>
        </div>
        <h1 className="ai-home-hero__title">How can I help your village today?</h1>
        <p className="ai-home-hero__subtitle">
          Ask a question or choose what you'd like to do.
        </p>
      </div>

      {/* 2. Four Primary Task Cards */}
      <div className="ai-task-grid">
        {/* Task 1: Find Urgent Problems */}
        <div
          className="ai-task-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelectTask('prioritization')}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTask('prioritization')}
        >
          <div className="ai-task-card__icon-wrap ai-task-card__icon-wrap--red">
            <ShieldAlert size={24} />
          </div>
          <div className="ai-task-card__content">
            <span className="ai-task-card__eyebrow">Find Urgent Problems</span>
            <h3 className="ai-task-card__title">What should we fix first?</h3>
            <p className="ai-task-card__desc">
              Discover which issues need attention first based on safety risk and village access.
            </p>
          </div>
          <button className="button button--secondary ai-task-card__btn" type="button">
            Analyze Problems <ArrowRight size={15} />
          </button>
        </div>

        {/* Task 2: Check Infrastructure Impact */}
        <div
          className="ai-task-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelectTask('impact')}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTask('impact')}
        >
          <div className="ai-task-card__icon-wrap ai-task-card__icon-wrap--green">
            <Network size={24} />
          </div>
          <div className="ai-task-card__content">
            <span className="ai-task-card__eyebrow">Check Infrastructure</span>
            <h3 className="ai-task-card__title">Explore road & bridge impacts</h3>
            <p className="ai-task-card__desc">
              See how damaged roads and bridges affect communities and cut off essential facilities.
            </p>
          </div>
          <button className="button button--secondary ai-task-card__btn" type="button">
            Check Impact <ArrowRight size={15} />
          </button>
        </div>

        {/* Task 3: Create Reports */}
        <div
          className="ai-task-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelectTask('reports')}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTask('reports')}
        >
          <div className="ai-task-card__icon-wrap ai-task-card__icon-wrap--blue">
            <BarChart3 size={24} />
          </div>
          <div className="ai-task-card__content">
            <span className="ai-task-card__eyebrow">Create a Report</span>
            <h3 className="ai-task-card__title">Understand village trends</h3>
            <p className="ai-task-card__desc">
              Turn village complaint records and infrastructure evidence into clear visual charts.
            </p>
          </div>
          <button className="button button--secondary ai-task-card__btn" type="button">
            Create Report <ArrowRight size={15} />
          </button>
        </div>

        {/* Task 4: Plan a Repair */}
        <div
          className="ai-task-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelectTask('planning')}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTask('planning')}
        >
          <div className="ai-task-card__icon-wrap ai-task-card__icon-wrap--amber">
            <ClipboardCheck size={24} />
          </div>
          <div className="ai-task-card__content">
            <span className="ai-task-card__eyebrow">Plan a Repair</span>
            <h3 className="ai-task-card__title">Prepare a draft action plan</h3>
            <p className="ai-task-card__desc">
              Draft a practical action plan with task checklists ready for municipal council review.
            </p>
          </div>
          <button className="button button--secondary ai-task-card__btn" type="button">
            Create Plan <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 3. Simple ChatGPT-like Village Intelligence Assistant */}
      <div className="ai-chat-card">
        <div className="ai-chat-card__header">
          <div className="ai-chat-card__title-wrap">
            <div className="ai-chat-card__avatar">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="ai-chat-card__title">GaunPulse AI Conversation</h3>
              <p className="ai-chat-card__sub">Evidence-backed answers from your village database and graph simulations</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, background: '#eaf5ee', color: '#176342', padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>
              Nepali & English
            </span>
            <button
              className="button button--secondary"
              type="button"
              onClick={clearChat}
              style={{ fontSize: 11, padding: '4px 8px' }}
              title="Reset conversation"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="ai-chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`ai-chat-bubble ai-chat-bubble--${message.role}`}
            >
              <div className="ai-chat-bubble__avatar">
                {message.role === 'assistant' ? <Bot size={16} /> : 'YOU'}
              </div>
              <div className="ai-chat-bubble__body">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </div>

                {/* Simulation Result Box (Clean Summary) */}
                {message.tools_called?.some((t) => t.tool === 'simulate_infrastructure_failure' && t.result && !t.result.error) && (
                  (() => {
                    const simCall = message.tools_called.find((t) => t.tool === 'simulate_infrastructure_failure');
                    const res = simCall.result;
                    return (
                      <div style={{ marginTop: 10, background: '#ffffff', border: '1px solid #c8d8cc', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#176342', fontWeight: 700, fontSize: 12 }}>
                          <Network size={14} /> Calculated Access Impact:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                          <div style={{ background: '#fef2f2', padding: 8, borderRadius: 6 }}>
                            <span style={{ fontSize: 10, color: '#991b1b', display: 'block', fontWeight: 600 }}>ISOLATED POPULATION</span>
                            <strong style={{ fontSize: 16, color: '#b91c1c' }}>{res.affected_households} Households</strong>
                          </div>
                          <div style={{ background: '#f8faf8', padding: 8, borderRadius: 6 }}>
                            <span style={{ fontSize: 10, color: '#556e62', display: 'block', fontWeight: 600 }}>AFFECTED SETTLEMENT</span>
                            <strong style={{ fontSize: 13, color: '#092d22' }}>{res.isolated_settlements?.[0]?.settlement || 'Ridge Settlements'}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Draft Action Plan Card */}
                {message.draft_action_plan && (
                  <div style={{ marginTop: 12, background: '#fffdfa', border: '1px solid #eed9b7', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ClipboardCheck size={16} /> {message.draft_action_plan.title}
                      </strong>
                      <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        DRAFT
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#556e62' }}>
                      {message.draft_action_plan.problem_summary}
                    </p>
                    {message.draft_action_plan.suggested_inspection_steps && (
                      <div style={{ background: '#fefbf6', padding: '8px 12px', borderRadius: 6, marginBottom: 10, fontSize: 11.5, color: '#4b5563' }}>
                        <strong style={{ display: 'block', color: '#78350f', marginBottom: 4 }}>Checklist:</strong>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {message.draft_action_plan.suggested_inspection_steps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <small style={{ color: '#78350f', fontSize: 11 }}>
                        Requires human municipal signoff.
                      </small>
                      {importedPlanSuccess[index] ? (
                        <span style={{ color: '#166534', fontWeight: 600, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} /> Saved to Action Plans
                        </span>
                      ) : (
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => handleSavePlan(message.draft_action_plan, index)}
                          disabled={importingPlan[index]}
                          style={{ fontSize: 11.5, padding: '5px 12px' }}
                        >
                          {importingPlan[index] ? <Loader2 size={13} className="spin" /> : <ClipboardCheck size={13} />}
                          Save to Action Plans
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Optional Expandable Technical Calculations (Clean UX for Non-Tech Users) */}
                {message.tools_called && message.tools_called.length > 0 && (
                  <details className="ai-details-toggle">
                    <summary>View supporting calculation details & data sources</summary>
                    <div style={{ marginTop: 8, fontSize: 11.5, color: '#556e62', lineHeight: 1.5 }}>
                      {message.tools_called.map((t, idx) => (
                        <div key={idx} style={{ marginBottom: 6 }}>
                          • <strong>Agent Tool:</strong> {t.tool} · {t.agent || 'GaunPulse Intelligence'}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-chat-bubble ai-chat-bubble--assistant">
              <div className="ai-chat-bubble__avatar">
                <Bot size={16} />
              </div>
              <div className="ai-chat-bubble__body" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#556e62' }}>
                <Loader2 size={15} className="spin" /> GaunPulse AI is analyzing village records...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="ai-chips-wrap">
          <span style={{ fontSize: 11, color: '#687c73', fontWeight: 600 }}>Try asking:</span>
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              className="ai-chip"
              type="button"
              onClick={() => handleSendMessage(chip)}
              disabled={loading}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          className="ai-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your village, reports or infrastructure..."
            disabled={loading}
          />
          <button
            className="ai-input-send-btn"
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={15} />}
          </button>
        </form>
      </div>

      {/* 4. Small Recent Village Activity Section */}
      <Card style={{ padding: '16px 20px', background: '#ffffff', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="eyebrow" style={{ color: '#176342', fontWeight: 700 }}>Village Context</span>
            <h4 style={{ margin: '2px 0', fontSize: 14, color: '#092d22' }}>Active Municipal Intelligence</h4>
            <p style={{ margin: 0, fontSize: 12, color: '#687c73' }}>
              Connected to <strong>{stats?.monitored_villages ?? 18} registered villages</strong> across Nepal · {stats?.active_issues ?? 7} active community reports.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => onNavigate?.('village-map')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Explore Map
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => onNavigate?.('action-plans')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              View Action Plans
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
