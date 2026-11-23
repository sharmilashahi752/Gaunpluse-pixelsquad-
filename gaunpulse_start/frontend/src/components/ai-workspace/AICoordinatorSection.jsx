import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  FileText,
  HelpCircle,
  Languages,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, PageIntro, StatusBadge } from '../ui';
import { useVillageSelection } from '../../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import { cachedFetchJson } from '../../utils/apiCache';

export default function AICoordinatorSection({ onNavigate, onSelectTab }) {
  const { selectedVillageId, setSelectedVillageId, selectedVillage, villages: contextVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);

  // Sync villages from context
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
    } else {
      cachedFetchJson('/api/villages', {}, { ttlMs: 120000 })
        .then((data) => {
          if (Array.isArray(data)) setVillages(data);
        })
        .catch((err) => console.error('Failed to load villages:', err));
    }
  }, [contextVillages]);

  const currentVillageObj = selectedVillage || villages.find((v) => Number(v.id) === Number(selectedVillageId));
  const villageName = currentVillageObj?.name || 'Selected Village';
  const villageWard = currentVillageObj?.ward_no ? `Ward ${currentVillageObj.ward_no}` : 'Ward 1';

  const INITIAL_MESSAGES = [
    {
      role: 'assistant',
      text: `Namaste! I am the **GaunPulse AI Coordinator** for **${villageName}**.\n\nI orchestrate intelligence across all specialized agents: **Problem Prioritization**, **NetworkX Impact Simulator**, and **Repair Action Planning**.\n\nYou can ask multi-step municipal questions, such as:\n• "Analyze ${villageWard} and tell me which infrastructure problem we should inspect first."\n• "What happens if a primary lifeline road or bridge is blocked? Show affected households and draft an action plan."\n• "पुल बिग्रिएपछि कुन बस्ती प्रभावित हुन्छ र मर्मत योजना कस्तो बनाउने?"`,
      tools_called: [],
      suggested_questions: [
        `Which issues should ${villageName} inspect first?`,
        `What happens if a bridge in ${villageName} is blocked?`,
        `पुल वा बाटो अवरुद्ध हुँदा कुन बस्ती प्रभावित हुन्छ?`,
        `Draft an action plan for the top disruption in ${villageName}`,
      ],
    },
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`gaunpulse_coordinator_messages_${selectedVillageId || 1}`);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [importingPlan, setImportingPlan] = useState({});
  const [planImportSuccess, setPlanImportSuccess] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const messagesEndRef = useRef(null);

  // Update initial messages when village changes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`gaunpulse_coordinator_messages_${selectedVillageId || 1}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages(INITIAL_MESSAGES);
      }
    } catch {
      setMessages(INITIAL_MESSAGES);
    }
  }, [selectedVillageId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`gaunpulse_coordinator_messages_${selectedVillageId || 1}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist coordinator messages:', e);
    }
  }, [messages, selectedVillageId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    sessionStorage.removeItem(`gaunpulse_coordinator_messages_${selectedVillageId || 1}`);
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
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          message: query,
          village_id: Number(selectedVillageId),
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
      console.error('Coordinator chat error:', err);
      setErrorMsg(err.message || 'Could not communicate with the AI Coordinator.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Connection Error:** ${err.message || 'Failed to reach GaunPulse AI Intelligence service.'}`,
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

      const res = await fetch('/api/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          village_id: plan.village_id || Number(selectedVillageId),
          issue_id: plan.issue_id || null,
          title: plan.title,
          priority: plan.priority === 'Critical' ? 'Critical' : 'High',
          responsible_team: plan.responsible_team || 'Municipal Infrastructure Unit',
          ward: plan.ward || villageWard,
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

  const dedupedVillages = deduplicateVillages(villages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Coordinator Protocol Banner with Village Selector */}
      <div
        style={{
          background: '#f4f8f4',
          border: '1px solid #c9dec9',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: '#274b39',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrainCircuit size={20} color="#176342" style={{ flexShrink: 0 }} />
          <div>
            <strong>Multi-Agent Orchestrator:</strong> The Coordinator combines Problem Prioritization, NetworkX Impact Simulation, and Repair Planning agents for <strong>{villageName}</strong>.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Village Context Selector */}
          <select
            value={selectedVillageId || ''}
            onChange={(e) => setSelectedVillageId(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #c8d8cc',
              fontSize: 11,
              color: '#176342',
              fontWeight: 600,
              background: '#ffffff',
            }}
          >
            {dedupedVillages.map((v) => (
              <option key={v.id} value={v.id}>
                {formatVillageLabel(v)}
              </option>
            ))}
          </select>

          <button
            className="button button--secondary"
            type="button"
            onClick={clearChat}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            <Trash2 size={12} /> Reset Chat
          </button>
        </div>
      </div>

      {/* Main Chat Thread */}
      <Card className="agent-chat" style={{ padding: 0 }}>
        <div className="agent-chat__header">
          <span className="agent-chat__avatar" style={{ background: '#176342', color: '#cbeaca' }}>
            <Bot size={22} />
          </span>
          <div>
            <strong>GaunPulse AI Coordinator</strong>
            <span>Multi-Agent Decision Support for {villageName}</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="agent-chat__messages" style={{ minHeight: 440, maxHeight: 600 }}>
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

                {/* Multi-Agent Contribution Badges */}
                {message.tools_called && message.tools_called.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {message.tools_called.map((toolCall, tIdx) => {
                      const res = toolCall.result;
                      const agentName = toolCall.agent || (toolCall.tool === 'simulate_infrastructure_failure' ? 'Infrastructure Impact Agent' : 'Problem Prioritization Agent');
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
                              <Sparkles size={13} /> Contributing Agent: <strong>{agentName}</strong>
                            </span>
                            <span style={{ fontSize: 10, background: '#e3f3e3', color: '#176342', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                              Tool: <code>{toolCall.tool}</code>
                            </span>
                          </div>

                          {isSim && res && !res.error && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 6, background: '#fbfdfb', padding: 8, borderRadius: 6 }}>
                              <div>
                                <span style={{ color: '#687c73', display: 'block', fontSize: 10 }}>AFFECTED HOUSEHOLDS</span>
                                <strong style={{ color: '#c0392b', fontSize: 13.5 }}>{res.affected_households} HH Isolated</strong>
                              </div>
                              <div>
                                <span style={{ color: '#687c73', display: 'block', fontSize: 10 }}>ISOLATED SETTLEMENT</span>
                                <strong style={{ color: '#176342', fontSize: 12.5 }}>
                                  {res.isolated_settlements?.[0]?.settlement || 'Isolated Neighborhood'}
                                </strong>
                              </div>
                              <div>
                                <span style={{ color: '#687c73', display: 'block', fontSize: 10 }}>CALCULATION ENGINE</span>
                                <strong style={{ color: '#176342', fontSize: 12 }}>NetworkX MultiGraph</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Draft Action Plan Card */}
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
                        Inspection Checklist:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563' }}>
                        {message.draft_action_plan.suggested_inspection_steps?.map((step, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: 2 }}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5ebd8' }}>
                      <span style={{ fontSize: 11, color: '#78350f' }}>
                        ⚖️ Human municipal signoff required to authorize budget in {villageName}.
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
              </div>
            </div>
          ))}

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
                <span>AI Coordinator is delegating to specialized agents for {villageName}...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div style={{ padding: '8px 18px', background: '#fafbf9', borderTop: '1px solid #ecefe9', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          <span style={{ fontSize: 11, color: '#687c73', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <HelpCircle size={13} /> Quick Workflows:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
            {[
              `Which issues should ${villageName} inspect first?`,
              `What happens if a bridge in ${villageName} is blocked?`,
              `पुल वा बाटो अवरुद्ध हुँदा कुन बस्ती प्रभावित हुन्छ?`,
              `Draft an action plan for the top disruption in ${villageName}`,
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
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <form className="agent-chat__composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <label className="sr-only" htmlFor="coordinator-question">Ask the AI Coordinator</label>
          <input
            id="coordinator-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={`Ask across agents for ${villageName} (e.g., analyze ward, simulate bridge failure, and prepare draft plan)...`}
          />
          <button
            className="button button--primary"
            type="submit"
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </form>

        <p className="agent-chat__privacy">
          <ShieldCheck size={13} /> Role-based authorization enforced for {villageName}. Private citizen data redacted. Municipal signoff required for budget and repairs.
        </p>
      </Card>
    </div>
  );
}
