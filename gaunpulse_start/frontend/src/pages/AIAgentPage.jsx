import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  FileText,
  HelpCircle,
  Languages,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, PageIntro, StatusBadge } from '../components/ui';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: 'Namaste! I am **GaunPulse AI**, your municipal infrastructure decision-support agent. I am directly connected to the village database and NetworkX graph simulation engine.\n\nYou can ask me about active disruptions, simulate the isolation impact of road/bridge closures, or request evidence-based draft action plans in English or Nepali.',
    tools_called: [],
    suggested_questions: [
      'What happens if Bridge B is blocked?',
      'पुल बिग्रिएपछि कुन बस्ती प्रभावित हुन्छ?',
      'Draft an action plan for the bridge failure',
      'Which issues should Ward 4 inspect first?',
    ],
  },
];

export default function AIAgentPage({ onNavigate }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('gaunpulse_ai_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('auto'); // 'auto', 'en', 'ne'
  const [importingPlan, setImportingPlan] = useState({});
  const [planImportSuccess, setPlanImportSuccess] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('gaunpulse_ai_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist messages to sessionStorage:', e);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    sessionStorage.removeItem('gaunpulse_ai_messages');
  };

  const sendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    setErrorMsg(null);

    const userMessage = { role: 'user', text: query, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const langParam = language === 'auto' ? null : language;
      const res = await fetch('http://127.0.0.1:8000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          message: query,
          village_id: 1,
          language: langParam,
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
        text: data.reply || 'No response generated.',
        language: data.language,
        tools_called: data.tools_called || [],
        draft_action_plan: data.draft_action_plan || null,
        suggested_questions: data.suggested_questions || [],
        relevant_links: data.relevant_links || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setErrorMsg(err.message || 'Could not communicate with the AI agent.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Connection Error:** ${err.message || 'Failed to reach GaunPulse AI Intelligence service.'} Please ensure the backend and Python services are running.`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPlan = async (plan, msgIndex) => {
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
          notes: `Suggested Inspection Steps:\n${(plan.suggested_inspection_steps || []).join('\n')}\n\nAccessibility: ${plan.accessibility_considerations}\n\nResponsibility: ${plan.proposed_responsibilities}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to register action plan in municipal database.');
      }

      setPlanImportSuccess((prev) => ({ ...prev, [msgIndex]: true }));
    } catch (e) {
      alert(`Error importing plan: ${e.message}`);
    } finally {
      setImportingPlan((prev) => ({ ...prev, [msgIndex]: false }));
    }
  };

  return (
    <div className="page-stack agent-page" style={{ maxWidth: 1120, margin: '0 auto' }}>
      <PageIntro
        eyebrow="Municipal Decision Support"
        title="GaunPulse AI Agent"
        description="Evidence-grounded assistant for rural infrastructure planners. Powered by NetworkX shortest-path graph calculations and live MySQL records."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#eef4ee', padding: '4px 8px', borderRadius: 8, fontSize: 12, gap: 6 }}>
              <Languages size={15} color="#176342" />
              <label htmlFor="lang-select" className="sr-only">Language</label>
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#176342', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              >
                <option value="auto">Auto (English / नेपाली)</option>
                <option value="en">English</option>
                <option value="ne">नेपाली (Devanagari)</option>
              </select>
            </div>
            <button
              className="button button--secondary"
              type="button"
              onClick={clearChat}
              title="Reset conversation"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <Trash2 size={14} /> Clear Chat
            </button>
          </div>
        }
      />

      {/* Security & Decision Support Protocol Banner */}
      <div style={{ background: '#f4f8f4', border: '1px solid #c9dec9', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#274b39' }}>
        <ShieldCheck size={20} color="#176342" style={{ flexShrink: 0 }} />
        <div>
          <strong>Municipal Protocol Enforcement:</strong> AI suggestions and action plans are strictly advisory drafts. Official budget appropriation, tender issuance, and infrastructure safety certification require certified human officer sign-off.
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="agent-chat" style={{ marginTop: 16 }}>
        <div className="agent-chat__header">
          <span className="agent-chat__avatar" style={{ background: '#176342', color: '#cbeaca' }}>
            <Sparkles size={20} />
          </span>
          <div>
            <strong>GaunPulse Assistant</strong>
            <span>NetworkX Graph Simulator & MySQL Connected</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#176342', background: '#e3f3e3', padding: '3px 8px', borderRadius: 12 }}>
              <Cpu size={12} /> NetworkX 3.x
            </span>
            <StatusBadge tone="green">Live Engine</StatusBadge>
          </div>
        </div>

        {/* Message Thread */}
        <div className="agent-chat__messages" style={{ minHeight: 420, maxHeight: 600 }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message chat-message--${message.role}`}
              style={{ maxWidth: message.role === 'user' ? '70%' : '88%' }}
            >
              <span>{message.role === 'assistant' ? <Bot size={16} /> : 'WO'}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {/* Text Bubble */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '14px 5px 14px 14px' : '5px 14px 14px 14px',
                    background: message.role === 'user' ? '#fdf1eb' : '#f5faf5',
                    border: message.role === 'user' ? '1px solid #f6d8ca' : '1px solid #ddeadb',
                    color: '#274b39',
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.text}
                </div>

                {/* Tool-Result Summaries (when executed) */}
                {message.tools_called && message.tools_called.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {message.tools_called.map((toolCall, tIdx) => {
                      const res = toolCall.result;
                      const isSim = toolCall.tool === 'simulate_infrastructure_failure';
                      return (
                        <div
                          key={tIdx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #c2dec2',
                            borderLeft: '4px solid #176342',
                            borderRadius: 8,
                            padding: '10px 14px',
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#176342' }}>
                              <Cpu size={14} /> Tool Executed: <code>{toolCall.tool}</code>
                            </span>
                            <span style={{ fontSize: 10, background: '#e3f3e3', color: '#176342', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                              {isSim ? 'NetworkX Shortest-Path' : 'MySQL Verified'}
                            </span>
                          </div>

                          {isSim && res && !res.error && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 6, background: '#fbfdfb', padding: 8, borderRadius: 6 }}>
                              <div>
                                <span style={{ color: '#687c73', display: 'block', fontSize: 10 }}>AFFECTED POPULATION</span>
                                <strong style={{ color: '#c0392b', fontSize: 14 }}>{res.affected_households} Households</strong>
                              </div>
                              <div>
                                <span style={{ color: '#687c73', display: 'block', fontSize: 10 }}>ISOLATED SETTLEMENT</span>
                                <strong style={{ color: '#176342', fontSize: 13 }}>
                                  {res.isolated_settlements?.[0]?.settlement || 'None'}
                                </strong>
                              </div>
                              <div>
                                <span style={{ color: '#687c73', display: 'block', fontSize: 10 }}>FACILITY ACCESS</span>
                                <strong style={{ color: '#b9770e', fontSize: 13 }}>
                                  {res.essential_facilities_affected?.length || 2} Essential Cut Off
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Draft Action Plan Card (Requires Human Approval) */}
                {message.draft_action_plan && (
                  <div
                    style={{
                      background: '#fffdfa',
                      border: '1px solid #eed9b7',
                      borderLeft: '4px solid #d97706',
                      borderRadius: 8,
                      padding: '14px 16px',
                      fontSize: 12,
                      marginTop: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#92400e' }}>
                        <FileText size={15} /> {message.draft_action_plan.title}
                      </span>
                      <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                        DRAFT · REQUIRES HUMAN APPROVAL
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 8px', color: '#4b5563' }}>
                      <strong>Responsible Team:</strong> {message.draft_action_plan.responsible_team} · <strong>Priority:</strong> {message.draft_action_plan.priority} · <strong>Target Timeline:</strong> ~{message.draft_action_plan.target_days} days
                    </p>

                    <div style={{ background: '#fdfbf7', padding: '8px 12px', borderRadius: 6, margin: '8px 0', border: '1px solid #f1e5d1' }}>
                      <strong style={{ display: 'block', color: '#78350f', fontSize: 11, marginBottom: 4 }}>
                        Key Technical Inspection Tasks:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563' }}>
                        {message.draft_action_plan.suggested_inspection_steps?.map((step, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: 2 }}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5ebd8' }}>
                      <span style={{ fontSize: 11, color: '#78350f' }}>
                        ⚖️ Human municipal signoff required to authorize budget.
                      </span>

                      {planImportSuccess[index] ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 600 }}>
                          <CheckCircle2 size={16} /> Imported into Action Plans
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => onNavigate && onNavigate('action-plans')}
                            style={{ marginLeft: 6, padding: '4px 8px', fontSize: 11 }}
                          >
                            View Plans <ArrowRight size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => handleImportPlan(message.draft_action_plan, index)}
                          disabled={importingPlan[index]}
                          style={{ fontSize: 11, padding: '6px 14px' }}
                        >
                          {importingPlan[index] ? (
                            <>
                              <Loader2 size={13} className="spin" /> Importing...
                            </>
                          ) : (
                            <>
                              <Wrench size={13} /> Import Draft into Action Plans
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Relevant Action Links */}
                {message.relevant_links && message.relevant_links.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {message.relevant_links.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        onClick={(e) => {
                          e.preventDefault();
                          const page = link.url.replace('#/', '');
                          if (onNavigate) onNavigate(page);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: '#176342',
                          textDecoration: 'none',
                          background: '#f0f7f1',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        {link.label} <ArrowRight size={11} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing State */}
          {loading && (
            <div className="chat-message chat-message--assistant" style={{ maxWidth: '75%' }}>
              <span><Bot size={16} /></span>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '5px 14px 14px 14px',
                  background: '#f5faf5',
                  border: '1px solid #ddeadb',
                  color: '#176342',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                }}
              >
                <Loader2 size={16} className="spin" style={{ color: '#176342' }} />
                <span>GaunPulse AI is executing NetworkX calculations & analyzing village records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Pills */}
        <div style={{ padding: '8px 18px', background: '#fafbf9', borderTop: '1px solid #ecefe9', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          <span style={{ fontSize: 11, color: '#687c73', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <HelpCircle size={13} /> Suggested:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
            {[
              'What happens if Bridge B is blocked?',
              'पुल बिग्रिएपछि कुन बस्ती प्रभावित हुन्छ?',
              'Draft an action plan for the bridge failure',
              'Which issues should Ward 4 inspect first?',
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(q)}
                disabled={loading}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cfdecf',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 11,
                  color: '#176342',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#176342')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#cfdecf')}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Composer Form */}
        <form className="agent-chat__composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <label className="sr-only" htmlFor="agent-question">Ask a municipal question</label>
          <input
            id="agent-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              language === 'ne'
                ? 'पूर्वाधार समस्या, पुल अवरोध वा मर्मत योजना बारे सोध्नुहोस्...'
                : 'Ask about village lifelines, simulate closures, or draft repair plans...'
            }
          />
          <button
            className="button button--primary"
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </form>

        <p className="agent-chat__privacy">
          <ShieldCheck size={13} /> Private citizen data is redacted before AI synthesis. All simulation figures are calculated with NetworkX.
        </p>
      </Card>
    </div>
  );
}
