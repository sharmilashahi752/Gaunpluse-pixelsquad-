import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CircleDashed,
  CloudUpload,
  Database,
  FileBarChart,
  Filter,
  LoaderCircle,
  MapPinned,
  MessageSquareText,
  Network,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import CommunityVoices from '../components/CommunityVoices';
import VillageMapPreview from '../components/VillageMapPreview';
import {
  actionPlans,
  issues,
  reportMetrics,
  villageRecords,
} from '../data/demoData';
import { Card, CardHeader, DemoLabel, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';

const severityTone = { Critical: 'red', High: 'orange', Medium: 'green' };

export function VillageMapPage() {
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Spatial overview" title="Village Map" description="Explore a styled preview of settlements, facilities and infrastructure reports across the demonstration municipality." actions={<button className="button button--secondary" type="button"><Filter size={16} /> Filter layers</button>} />
      <FeatureNotice title="Map preview only" icon={MapPinned}>Leaflet, geospatial layers and live village records will be connected in a later part.</FeatureNotice>
      <VillageMapPreview expanded />
    </div>
  );
}

export function IssuesAlertsPage() {
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitDemo = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-stack">
      <PageIntro eyebrow="Community reporting" title="Issues & Alerts" description="Triage fictional infrastructure reports and preview an accessible issue-reporting workflow." actions={<button className="button button--primary" type="button" onClick={() => document.getElementById('report-title')?.focus()}><Plus size={16} /> New report</button>} />
      <FeatureNotice title="Browser-only demonstration" icon={ShieldCheck}>Submitting this form does not save or send data. A secure municipal API will be added in a later part.</FeatureNotice>
      <div className="module-grid module-grid--issues">
        <Card>
          <CardHeader eyebrow="Triage board" title="Open reports" description="Four fictional records ordered by severity." action={<DemoLabel compact />} />
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Issue</th><th>Village</th><th>Severity</th><th>Status</th></tr></thead>
              <tbody>{issues.map((item) => <tr key={item.id}><td><strong>{item.issue}</strong><small>{item.id} · {item.category}</small></td><td>{item.village}</td><td><StatusBadge tone={severityTone[item.severity]}>{item.severity}</StatusBadge></td><td>{item.status}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Report preview" title="Share an infrastructure issue" description="Fields show the future reporting experience." />
          {submitted ? (
            <div className="form-success" role="status"><CheckCircle2 size={23} /><div><strong>Demo report acknowledged</strong><p>Nothing was stored. Clear the preview to test the form again.</p></div><button className="text-button" type="button" onClick={() => { setSubmitted(false); setDescription(''); }}>Clear preview</button></div>
          ) : (
            <form className="form-stack" onSubmit={submitDemo}>
              <label htmlFor="report-title">Issue title</label>
              <input id="report-title" name="title" required placeholder="e.g. Footbridge handrail damaged" />
              <label htmlFor="report-location">Village or ward</label>
              <select id="report-location" name="location" defaultValue=""><option value="" disabled>Select a location</option><option>Thulogaun · Ward 4</option><option>Simalchaur · Ward 2</option><option>Raniban · Ward 6</option></select>
              <label htmlFor="report-description">What did the community observe?</label>
              <textarea id="report-description" value={description} onChange={(event) => setDescription(event.target.value)} required placeholder="Describe the issue without sharing sensitive personal details." />
              <button className="button button--primary" type="submit">Preview submission <ArrowRight size={16} /></button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export function SimulationsPage() {
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Decision sandbox" title="Simulations" description="Compare illustrative before-and-after access scenarios without changing official records." actions={<button className="button button--primary" type="button"><Network size={16} /> Run demo preview</button>} />
      <FeatureNotice title="No simulation service connected" icon={Network}>These cards use fixed fictional values. Part 2 does not call Python or any live infrastructure model.</FeatureNotice>
      <div className="scenario-builder">
        <Card className="scenario-controls">
          <CardHeader eyebrow="Scenario setup" title="Seti Bridge disruption" description="Choose the inputs for a future simulation run." />
          <div className="form-stack">
            <label htmlFor="scenario-asset">Infrastructure asset</label><select id="scenario-asset" defaultValue="bridge"><option value="bridge">Seti footbridge · Ward 4</option><option value="road">Simalchaur access road · Ward 2</option></select>
            <label htmlFor="scenario-condition">Assumed condition</label><select id="scenario-condition" defaultValue="closed"><option value="closed">Fully unavailable</option><option value="limited">Limited pedestrian access</option></select>
            <label htmlFor="scenario-duration">Duration</label><select id="scenario-duration" defaultValue="7"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>
            <button className="button button--primary" type="button">Preview scenario <ArrowRight size={16} /></button>
          </div>
        </Card>
        <Card className="scenario-result">
          <div className="scenario-result__head"><div><span className="eyebrow">Illustrative outcome</span><h2>Access impact</h2></div><DemoLabel /></div>
          <div className="impact-number"><strong>20</strong><span>households may need a detour</span></div>
          <div className="comparison-bars">
            <div><span>School journey</span><strong>18 → 58 min</strong><i style={{ '--bar': '82%' }} /></div>
            <div><span>Health-post journey</span><strong>19 → 59 min</strong><i style={{ '--bar': '85%' }} /></div>
            <div><span>Market access</span><strong>24 → 41 min</strong><i style={{ '--bar': '58%' }} /></div>
          </div>
          <p className="scenario-result__note"><TriangleAlert size={16} /> This preview is not evidence for an operational safety decision.</p>
        </Card>
      </div>
    </div>
  );
}

export function ActionPlansPage() {
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Coordinated response" title="Action Plans" description="Track ownership, progress and next steps for demonstration response plans." actions={<button className="button button--primary" type="button"><Plus size={16} /> Draft action plan</button>} />
      <FeatureNotice title="Planning preview" icon={CircleDashed}>Assignments and progress are fictional and are not connected to municipal workflow tools.</FeatureNotice>
      <div className="plan-grid">{actionPlans.map((plan, index) => <Card className="plan-card" key={plan.title}><div className="plan-card__top"><StatusBadge tone={index === 0 ? 'red' : index === 1 ? 'orange' : 'green'}>{index === 0 ? 'Urgent' : 'In progress'}</StatusBadge><DemoLabel compact /></div><h2>{plan.title}</h2><p>{plan.owner}</p><div className="progress-label"><span>{plan.tasks}</span><strong>{plan.progress}%</strong></div><div className="progress-track"><span style={{ width: `${plan.progress}%` }} /></div><div className="plan-card__footer"><span>Due {plan.due}</span><button className="text-button" type="button">Open plan <ArrowRight size={15} /></button></div></Card>)}</div>
    </div>
  );
}

export function CommunityVoicesPage() {
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Participatory insight" title="Community Voices" description="Review how local observations could be acknowledged, categorized and connected to municipal follow-up." actions={<button className="button button--primary" type="button"><MessageSquareText size={16} /> Record a voice</button>} />
      <FeatureNotice title="Consent-first preview" icon={ShieldCheck}>All names and messages are fictional. Future community submissions will require consent, privacy controls and moderation.</FeatureNotice>
      <CommunityVoices full />
      <Card className="empty-state" as="section"><span><MessageSquareText size={23} /></span><h2>No more voices in this demo</h2><p>When connected later, filters and pagination will help teams review additional community submissions.</p><button className="button button--secondary" type="button">Review archived preview</button></Card>
    </div>
  );
}

export function ReportsInsightsPage() {
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Evidence overview" title="Reports & Insights" description="Understand fictional reporting patterns and response performance through clear, readable summaries." actions={<button className="button button--secondary" type="button"><FileBarChart size={16} /> Export preview</button>} />
      <FeatureNotice title="Illustrative analytics" icon={BarChart3}>Metrics are hard-coded demonstration values and cannot yet be filtered or exported.</FeatureNotice>
      <div className="report-metrics">{reportMetrics.map((metric) => <Card key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></Card>)}</div>
      <Card>
        <CardHeader eyebrow="Issue mix" title="Reports by infrastructure category" description="Fictional reports received during the last six months." action={<DemoLabel compact />} />
        <div className="horizontal-chart" aria-label="Horizontal bar chart of issue categories"><div><span>Roads & trails</span><i><b style={{ width: '82%' }} /></i><strong>38</strong></div><div><span>Water access</span><i><b style={{ width: '64%' }} /></i><strong>29</strong></div><div><span>Bridges</span><i><b style={{ width: '47%' }} /></i><strong>21</strong></div><div><span>Public facilities</span><i><b style={{ width: '31%' }} /></i><strong>14</strong></div></div>
      </Card>
    </div>
  );
}

const initialMessages = [{ role: 'assistant', text: 'Namaste. I am a scripted interface preview. Ask a sample question to see the planned conversation flow.' }];

export function AIAgentPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState('');

  const sendMessage = (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }, { role: 'assistant', text: 'This is a fixed UI demonstration response. No AI model, village database or live tool was contacted.' }]);
    setQuestion('');
  };

  return (
    <div className="page-stack agent-page">
      <PageIntro eyebrow="Decision-support preview" title="AI Agent" description="Explore the planned chat experience for evidence-based municipal questions." />
      <FeatureNotice title="UI demonstration — not a working AI model" icon={Bot}>Messages stay in this browser session. Responses are scripted and no external model, database or simulator is connected.</FeatureNotice>
      <Card className="agent-chat">
        <div className="agent-chat__header"><span className="agent-chat__avatar"><Sparkles size={20} /></span><div><strong>GaunPulse Assistant</strong><span>Scripted demo · no live connection</span></div><StatusBadge tone="orange">Demo mode</StatusBadge></div>
        <div className="agent-chat__messages" aria-live="polite">{messages.map((message, index) => <div className={`chat-message chat-message--${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'assistant' ? <Bot size={16} /> : 'AS'}</span><p>{message.text}</p></div>)}</div>
        <form className="agent-chat__composer" onSubmit={sendMessage}><label className="sr-only" htmlFor="agent-question">Ask a demonstration question</label><input id="agent-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about a fictional infrastructure issue…" /><button className="button button--primary" type="submit" aria-label="Send demonstration message"><Send size={17} /></button></form>
        <p className="agent-chat__privacy"><ShieldCheck size={13} /> Do not enter personal, sensitive or operational information.</p>
      </Card>
    </div>
  );
}

export function VillageDataPage() {
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Data stewardship" title="Village Data Manager" description="Preview how authorized teams could review village records, completeness and future imports." actions={<button className="button button--primary" type="button"><Upload size={16} /> Import preview</button>} />
      <FeatureNotice title="Static records only" icon={Database}>There is no database in Part 2. Editing, validation, permissions and version history will be added later.</FeatureNotice>
      <div className="state-showcase" aria-label="Interface state examples"><div className="state-card state-card--loading"><LoaderCircle size={20} /><div><strong>Loading state</strong><span>Preparing a village import preview…</span></div></div><div className="state-card state-card--empty"><CloudUpload size={20} /><div><strong>Empty state</strong><span>No files are waiting to import.</span></div></div><div className="state-card state-card--error"><AlertCircle size={20} /><div><strong>Error state</strong><span>Invalid rows would appear here.</span></div></div></div>
      <Card>
        <CardHeader eyebrow="Record completeness" title="Village directory" description="Sample records for interface design and testing." action={<DemoLabel compact />} />
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Village</th><th>Ward</th><th>Households</th><th>Facilities</th><th>Completeness</th></tr></thead><tbody>{villageRecords.map((record) => <tr key={record.name}><td><strong>{record.name}</strong><small>Fictional record</small></td><td>{record.ward}</td><td>{record.households}</td><td>{record.facilities}</td><td><div className="table-progress"><i><b style={{ width: `${record.completeness}%` }} /></i><strong>{record.completeness}%</strong></div></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
