import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  HelpCircle,
  Languages,
  Loader2,
  Lock,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, PageIntro, StatusBadge } from '../ui';
import { useVillageSelection } from '../../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import { cachedFetchJson } from '../../utils/apiCache';

export default function AICitizenAssistanceSection({ onNavigate }) {
  const { selectedVillageId, setSelectedVillageId, selectedVillage, villages: contextVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [language, setLanguage] = useState('ne'); // 'ne' or 'en'
  const [trackingCode, setTrackingCode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [villageIssues, setVillageIssues] = useState([]);

  // Sync villages from context
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
    } else {
      cachedFetchJson('http://127.0.0.1:8000/api/villages', {}, { ttlMs: 120000 })
        .then((data) => {
          if (Array.isArray(data)) setVillages(data);
        })
        .catch((err) => console.error('Failed to load villages:', err));
    }
  }, [contextVillages]);

  const currentVillageObj = selectedVillage || villages.find((v) => Number(v.id) === Number(selectedVillageId));
  const villageName = currentVillageObj?.name || 'Selected Village';

  // Fetch current village issues for sample tracking codes and lookup
  useEffect(() => {
    if (!selectedVillageId) return;
    fetch(`http://127.0.0.1:8000/api/issues?village_id=${selectedVillageId}`)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.data || []);
        setVillageIssues(items);
      })
      .catch((e) => console.warn('Could not load issues for citizen assistance:', e));
  }, [selectedVillageId]);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'नमस्ते! म गाउँपल्स नागरिक सहायता सहायक (Citizen Assistance Agent) हुँ।\n\nतपाईं यहाँ आफ्नो दर्ता गरिएको समस्याको स्थिति (Tracking Code) जाँच्न सक्नुहुन्छ, नयाँ समस्या कसरी दर्ता गर्ने भन्नेबारे सोध्न सक्नुहुन्छ, वा गाउँको सुरक्षित बाटो र पुलको जानकारी लिन सक्नुहुन्छ।',
      suggested: [
        'मेरो सडकको गुनासो कहाँ पुगेको छ?',
        'How can I report a damaged bridge?',
        'वडामा कुन कुन बाटो चालू छन्?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleLookupTracking = async (e) => {
    if (e) e.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!code) return;

    setLookupLoading(true);
    setLookupResult(null);

    try {
      // 1. Search in current village
      const res = await fetch(`http://127.0.0.1:8000/api/issues?village_id=${selectedVillageId}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || []);
      let matched = items.find(
        (i) => (i.tracking_code || '').toUpperCase() === code || `GP-${i.id}` === code
      );

      let matchedVillage = villageName;

      // 2. If not found in current village, search all issues to provide cross-village clarity
      if (!matched) {
        const allRes = await fetch('http://127.0.0.1:8000/api/issues');
        const allData = await allRes.json();
        const allItems = Array.isArray(allData) ? allData : (allData.data || []);
        matched = allItems.find(
          (i) => (i.tracking_code || '').toUpperCase() === code || `GP-${i.id}` === code
        );
        if (matched) {
          matchedVillage = matched.village?.name || `Village ID ${matched.village_id}`;
        }
      }

      if (matched) {
        setLookupResult({
          found: true,
          matchedVillage,
          isCurrentVillage: matchedVillage === villageName,
          issue: {
            title: matched.title,
            tracking_code: matched.tracking_code || `GP-${matched.id}`,
            status: matched.status || 'verified',
            category: matched.category,
            severity: matched.severity,
            ward: matched.ward || '1',
            created_at: matched.created_at,
          },
        });
      } else {
        setLookupResult({
          found: false,
          code,
        });
      }
    } catch (err) {
      console.error('Tracking lookup error:', err);
      setLookupResult({ error: 'Could not contact tracking service.' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
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
          village_id: Number(selectedVillageId),
          language: language,
        }),
      });

      const data = await res.json();
      const assistantMsg = {
        role: 'assistant',
        text: data.reply || 'जानकारी उपलब्ध हुन सकेन।',
        tools: data.tools_called || [],
        suggested: data.suggested_questions || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: language === 'ne'
            ? '⚠️ प्राविधिक समस्याका कारण जवाफ दिन सकिएन। कृपया केही बेरमा पुनः प्रयास गर्नुहोस्।'
            : '⚠️ Could not communicate with citizen assistant service.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleCodes = villageIssues.map((i) => i.tracking_code || `GP-${i.id}`).slice(0, 3);
  const dedupedVillages = deduplicateVillages(villages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Privacy Safeguard Banner & Village Context */}
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
          <ShieldCheck size={20} color="#176342" style={{ flexShrink: 0 }} />
          <div>
            <strong>Citizen Privacy & Public Transparency:</strong> Private citizen identities, phone numbers, and home addresses are never exposed or processed by AI. Public infrastructure status for <strong>{villageName}</strong> is communicated.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Village Selector */}
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

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e3f3e3', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}>
            <Languages size={14} color="#176342" />
            <button
              type="button"
              onClick={() => setLanguage(language === 'ne' ? 'en' : 'ne')}
              style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#176342', cursor: 'pointer' }}
            >
              {language === 'ne' ? 'नेपाली (Devanagari)' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Tracking Lookup & Chat Thread */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(0, 1.8fr)', gap: 16 }}>
        {/* Tracking Code Status Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ padding: 6, borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>
                <FileSearch size={16} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                  {language === 'ne' ? 'उजुरी स्थिति खोज (Tracking Lookup)' : 'Check Issue Tracking Status'}
                </strong>
                <span style={{ fontSize: 10.5, color: '#687c73' }}>
                  {language === 'ne' ? `गाउँ: ${villageName} · ट्र्याकिङ कोड हाल्नुहोस्` : `Village: ${villageName} · Enter tracking code`}
                </span>
              </div>
            </div>

            <form onSubmit={handleLookupTracking} style={{ display: 'flex', gap: 8 }}>
              <input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder={sampleCodes[0] || 'GP-BRG-01'}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}
              />
              <button
                type="submit"
                className="button button--primary"
                disabled={lookupLoading}
                style={{ padding: '7px 14px', fontSize: 12 }}
              >
                {lookupLoading ? <Loader2 size={13} className="spin" /> : <Search size={13} />}
              </button>
            </form>

            {/* Quick Demo Code Buttons */}
            {sampleCodes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: '#687c73' }}>Registered in {villageName}:</span>
                {sampleCodes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setTrackingCode(code);
                    }}
                    style={{
                      background: '#f0f6f2',
                      border: '1px solid #d2e4d5',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      color: '#176342',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            {/* Lookup Result Card */}
            {lookupResult && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #edf0eb' }}>
                {lookupResult.found ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: '#166534', fontSize: 12.5 }}>
                        {lookupResult.issue.title}
                      </strong>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#15803d', fontSize: 10, fontWeight: 700 }}>
                        {lookupResult.issue.status.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ display: 'block', color: '#687c73', fontSize: 11, marginBottom: 6 }}>
                      Code: {lookupResult.issue.tracking_code} · {lookupResult.matchedVillage} · Ward {lookupResult.issue.ward} · Severity: {lookupResult.issue.severity}
                    </span>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#14532d', lineHeight: 1.4 }}>
                      {language === 'ne'
                        ? `तपाईंको उजुरी ${lookupResult.matchedVillage} को नगरपालिका अभिलेखमा दर्ता भइसकेको छ। वडा प्राविधिक टोलीले निरीक्षण अगाडि बढाएको छ।`
                        : `Issue officially verified in municipal records for ${lookupResult.matchedVillage}. Technical inspection team has been scheduled.`}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, fontSize: 11.5, color: '#991b1b' }}>
                    {language === 'ne'
                      ? `ट्र्याकिङ कोड '${lookupResult.code}' प्रणालीमा भेटिएन। कृपया कोड रुजु गर्नुहोस्।`
                      : `Tracking code '${lookupResult.code}' not found in active database.`}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* How to Report Guide */}
          <Card style={{ padding: 18 }}>
            <strong style={{ display: 'block', fontSize: 13, color: '#176342', marginBottom: 6 }}>
              {language === 'ne' ? 'नयाँ समस्या कसरी दर्ता गर्ने?' : 'How Citizen Reporting Works'}
            </strong>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#4b5563', lineHeight: 1.6 }}>
              <li>
                {language === 'ne'
                  ? 'स्थान (सडक, पुल, खानेपानी) र वडा नम्बर छान्नुहोस्।'
                  : 'Select location and infrastructure category on the map.'}
              </li>
              <li>
                {language === 'ne'
                  ? 'क्षतिको फोटो र छोटो विवरण राख्नुहोस्।'
                  : 'Describe disruption and upload photo evidence.'}
              </li>
              <li>
                {language === 'ne'
                  ? 'दर्ता गरेपछि ट्र्याकिङ कोड सुरक्षित राख्नुहोस्।'
                  : 'Receive your unique tracking code for public monitoring.'}
              </li>
            </ol>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="button button--primary"
                onClick={() => onNavigate && onNavigate('issues-alerts')}
                style={{ width: '100%', fontSize: 11.5, padding: '7px 12px', justifyContent: 'center' }}
              >
                {language === 'ne' ? 'नयाँ समस्या दर्ता फारम खोल्नुहोस्' : 'Open Public Issue Report Form'} <ArrowRight size={13} />
              </button>
            </div>
          </Card>
        </div>

        {/* Citizen Chat Interface */}
        <Card className="agent-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="agent-chat__header">
            <span className="agent-chat__avatar" style={{ background: '#176342', color: '#cbeaca' }}>
              <MessageSquareText size={20} />
            </span>
            <div>
              <strong>{language === 'ne' ? 'नागरिक सहायता सहायक' : 'Citizen Assistance Agent'}</strong>
              <span>{language === 'ne' ? `${villageName} पूर्वाधार तथा उजुरी सहयोग` : `${villageName} Support & Guidance`}</span>
            </div>
            <StatusBadge tone="green">
              {language === 'ne' ? 'अनलाइन' : 'Online'}
            </StatusBadge>
          </div>

          <div className="agent-chat__messages" style={{ minHeight: 380, maxHeight: 480, flex: 1 }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message chat-message--${m.role}`}>
                <span>{m.role === 'assistant' ? <Bot size={16} /> : 'ME'}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  {m.suggested && m.suggested.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {m.suggested.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSendMessage(s)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cfdecf',
                            borderRadius: 14,
                            padding: '3px 10px',
                            fontSize: 10.5,
                            color: '#176342',
                            cursor: 'pointer',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message--assistant">
                <span><Bot size={16} /></span>
                <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={13} className="spin" />
                  {language === 'ne' ? 'सहायकले तथ्याङ्क जाँच्दैछ...' : 'Searching municipal records...'}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="agent-chat__composer" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'ne' ? `${villageName} को सडक वा पुलबारे सोध्नुहोस्...` : `Ask about ${villageName} road status or report...`}
              disabled={loading}
            />
            <button className="button button--primary" type="submit" disabled={loading || !input.trim()}>
              <Send size={15} />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
