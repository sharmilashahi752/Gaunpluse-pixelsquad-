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
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [resIssues, resPlans, resVillages] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/issues'),
        fetch('http://127.0.0.1:8000/api/action-plans'),
        fetch('http://127.0.0.1:8000/api/villages'),
      ]);
      const data = {
        exported_at: new Date().toISOString(),
        villages: await resVillages.json(),
        issues: (await resIssues.json()).data || [],
        action_plans: await resPlans.json(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gaunpulse-infrastructure-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Evidence overview"
        title="Reports & Insights"
        description="Understand reporting patterns and municipal response performance through evidence summaries."
        actions={
          <button className="button button--primary" type="button" onClick={handleExport} disabled={exporting}>
            <FileBarChart size={16} /> {exporting ? 'Generating...' : 'Export Municipal JSON'}
          </button>
        }
      />
      <FeatureNotice title="Connected to Municipal Evidence" icon={BarChart3}>
        Metrics are aggregated from registered village lifelines, citizen reports, and action plan records.
      </FeatureNotice>
      <div className="report-metrics">
        {reportMetrics.map((metric) => (
          <Card key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader
          eyebrow="Issue mix"
          title="Reports by infrastructure category"
          description="Reports categorized across transport, water, bridges, and access."
          action={<DemoLabel compact />}
        />
        <div className="horizontal-chart" aria-label="Horizontal bar chart of issue categories">
          <div>
            <span>Roads & trails</span>
            <i><b style={{ width: '82%' }} /></i>
            <strong>38</strong>
          </div>
          <div>
            <span>Water access</span>
            <i><b style={{ width: '64%' }} /></i>
            <strong>29</strong>
          </div>
          <div>
            <span>Bridges</span>
            <i><b style={{ width: '47%' }} /></i>
            <strong>21</strong>
          </div>
          <div>
            <span>Public facilities</span>
            <i><b style={{ width: '31%' }} /></i>
            <strong>14</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { default as AIAgentPage } from './AIAgentPage';

export function VillageDataPage() {
  const [villages, setVillages] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/villages')
      .then((res) => res.json())
      .then((data) => setVillages(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load villages:', err));
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportStatus(`Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Schema validated.`);
    }
  };

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Data stewardship"
        title="Village Data Manager"
        description="Inspect village records, settlements, and baseline infrastructure networks stored in MySQL."
        actions={
          <button className="button button--primary" type="button" onClick={() => setShowImportModal(true)}>
            <Upload size={16} /> Import GIS / GeoJSON
          </button>
        }
      />
      <FeatureNotice title="Connected to Municipal GIS Database" icon={Database}>
        Infrastructure records and settlement topologies are loaded directly from MySQL.
      </FeatureNotice>
      <div className="state-showcase" aria-label="Interface state examples">
        <div className="state-card state-card--loading">
          <LoaderCircle size={20} />
          <div>
            <strong>Active Lifeline Synchronizer</strong>
            <span>MySQL connection healthy · ServBay 3306</span>
          </div>
        </div>
        <div className="state-card state-card--empty">
          <CloudUpload size={20} />
          <div>
            <strong>Automated Backups</strong>
            <span>Daily JSON snapshot available</span>
          </div>
        </div>
        <div className="state-card state-card--error" style={{ background: '#f1f8f2', borderColor: '#248157' }}>
          <CheckCircle2 size={20} color="#176342" />
          <div>
            <strong>Topology Integrity</strong>
            <span>All edges linked to valid endpoints</span>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader
          eyebrow="Municipal database directory"
          title="Village Directory"
          description="Live village administrative records and network nodes."
          action={<DemoLabel compact />}
        />
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Village</th>
                <th>Municipality / Ward</th>
                <th>Settlements</th>
                <th>Active Issues</th>
                <th>Database Status</th>
              </tr>
            </thead>
            <tbody>
              {villages.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.name}</strong>
                    <small style={{ display: 'block', color: '#687c73' }}>
                      {record.local_name || record.district}
                    </small>
                  </td>
                  <td>{record.municipality} · Ward {record.ward_no || '4'}</td>
                  <td><strong>{record.settlements_count || 3}</strong> settlements</td>
                  <td><strong>{record.issues_count || 0}</strong> issues logged</td>
                  <td>
                    <StatusBadge tone="green">Synchronized</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 45, 34, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #dfe6df',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', color: '#092d22' }}>Import Village GIS Data</h3>
            <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#687c73' }}>
              Select a GeoJSON or CSV file with village infrastructure lifeline coordinates and attributes.
            </p>
            <input
              type="file"
              accept=".geojson,.json,.csv,.kml"
              onChange={handleFileSelect}
              style={{ width: '100%', padding: '10px', border: '1px dashed #248157', borderRadius: '8px', background: '#f8faf8' }}
            />
            {importStatus && (
              <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#176342', fontWeight: 'bold' }}>
                ✓ {importStatus}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button className="button button--secondary" type="button" onClick={() => { setShowImportModal(false); setImportStatus(null); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
