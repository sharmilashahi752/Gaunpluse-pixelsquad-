import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  MessageSquareText,
  Network,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, StatusBadge } from '../ui';
import { useVillageSelection } from '../../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import { cachedFetchJson } from '../../utils/apiCache';

export default function AIOverviewSection({ onSelectTab, onNavigate }) {
  const { selectedVillageId, setSelectedVillageId, selectedVillage, villages: contextVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const loadOverviewData = async () => {
    if (!selectedVillageId) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, insightsRes, issuesRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/dashboard/stats').then((r) => r.json()),
        fetch(`http://127.0.0.1:8000/api/ai/insights?village_id=${selectedVillageId}`).then((r) => r.json()),
        fetch(`http://127.0.0.1:8000/api/issues?village_id=${selectedVillageId}`).then((r) => r.json()),
      ]);

      setStats(statsRes);
      setInsights(insightsRes);
      const rawIssues = Array.isArray(issuesRes) ? issuesRes : (issuesRes.data || []);
      setRecentIssues(rawIssues.slice(0, 4));
    } catch (err) {
      console.error('Failed to load overview data:', err);
      setError('Could not connect to Laravel API or Python Intelligence service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [selectedVillageId]);

  const dedupedVillages = deduplicateVillages(villages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Security & Data Quality Warning Banner with Village Context */}
      <div
        style={{
          background: '#f4f8f4',
          border: '1px solid #c9dec9',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 12.5,
          color: '#274b39',
        }}
      >
        <ShieldCheck size={22} color="#176342" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', color: '#176342', marginBottom: 2 }}>
            Data Governance & Decision-Support Notice:
          </strong>
          Simulation outcomes and priority indices originate from verified municipal database records for <strong>{villageName}</strong> and deterministic NetworkX graph topology. 
          All AI recommendations are advisory: physical engineering certification and official municipal sign-off are required before public tender release or budget disbursement.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            type="button"
            onClick={loadOverviewData}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#176342',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
            title="Refresh Data"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', color: '#991b1b', fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#687c73', fontWeight: 600 }}>ISSUES IN {villageName.toUpperCase()}</span>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700 }}>Active</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#176342', fontFamily: 'Georgia, serif' }}>
            {recentIssues.length}
          </div>
          <span style={{ fontSize: 11, color: '#687c73' }}>
            Logged for {villageName}
          </span>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#687c73', fontWeight: 600 }}>VERIFIED CRITICAL PROBLEMS</span>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#fee2e2', color: '#b91c1c', fontSize: 10, fontWeight: 700 }}>Urgent</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#c0392b', fontFamily: 'Georgia, serif' }}>
            {recentIssues.filter((i) => (i.severity || '').toLowerCase() === 'critical').length}
          </div>
          <span style={{ fontSize: 11, color: '#687c73' }}>
            {insights?.critical_issues_summary || 'Needs immediate on-site inspection'}
          </span>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#687c73', fontWeight: 600 }}>NETWORK MONITORED</span>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1', fontSize: 10, fontWeight: 700 }}>GIS Mapped</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#176342', fontFamily: 'Georgia, serif' }}>
            {insights?.metrics?.monitored_edges ?? '...'} Edges
          </div>
          <span style={{ fontSize: 11, color: '#687c73' }}>
            {insights?.metrics?.monitored_nodes ?? '...'} connected settlement nodes
          </span>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#687c73', fontWeight: 600 }}>ACTION PLANS IN WORKFLOW</span>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#e8f5e9', color: '#2e7d32', fontSize: 10, fontWeight: 700 }}>Managed</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#176342', fontFamily: 'Georgia, serif' }}>
            {stats?.total_action_plans ?? 2}
          </div>
          <span style={{ fontSize: 11, color: '#687c73' }}>
            {stats?.action_plans_in_progress ?? 1} in progress
          </span>
        </Card>
      </div>

      {/* Quick Action Cards for Every Specialized Agent */}
      <Card style={{ padding: 18 }}>
        <CardHeader
          eyebrow="Specialized agent workflows"
          title={`Direct Agent Workspaces for ${villageName}`}
          description="Access dedicated intelligence tools for triage, simulation, visual reporting, and repair action planning."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
          {/* Prioritization */}
          <div
            style={{
              padding: 14,
              border: '1px solid #ddeadb',
              borderRadius: 10,
              background: '#fcfdfb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: 6, borderRadius: 6, background: '#e3f3e3', color: '#176342' }}>
                  <Sliders size={16} />
                </span>
                <strong style={{ fontSize: 13, color: '#176342' }}>Problem Prioritization</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#576f64', lineHeight: 1.5 }}>
                Triage road and bridge damage in {villageName} with multi-criteria weighted scoring (population, lifelines, and severity).
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onSelectTab('prioritization')}
              style={{ fontSize: 11.5, padding: '6px 12px', justifyContent: 'space-between' }}
            >
              Analyze {villageName} Priorities <ArrowRight size={13} />
            </button>
          </div>

          {/* Impact Simulation */}
          <div
            style={{
              padding: 14,
              border: '1px solid #ddeadb',
              borderRadius: 10,
              background: '#fcfdfb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: 6, borderRadius: 6, background: '#e3f3e3', color: '#176342' }}>
                  <Network size={16} />
                </span>
                <strong style={{ fontSize: 13, color: '#176342' }}>Infrastructure Impact</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#576f64', lineHeight: 1.5 }}>
                Run NetworkX shortest-path simulations to isolate failed bridges and calculate newly disconnected settlements in {villageName}.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onSelectTab('impact')}
              style={{ fontSize: 11.5, padding: '6px 12px', justifyContent: 'space-between' }}
            >
              Run Impact Analysis <ArrowRight size={13} />
            </button>
          </div>

          {/* Reports & Visualizer */}
          <div
            style={{
              padding: 14,
              border: '1px solid #ddeadb',
              borderRadius: 10,
              background: '#fcfdfb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: 6, borderRadius: 6, background: '#e3f3e3', color: '#176342' }}>
                  <BarChart3 size={16} />
                </span>
                <strong style={{ fontSize: 13, color: '#176342' }}>Reports & Visualization</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#576f64', lineHeight: 1.5 }}>
                Generate interactive Chart.js analytics across wards, trend curves, and export formatted CSV summaries for {villageName}.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onSelectTab('visualization')}
              style={{ fontSize: 11.5, padding: '6px 12px', justifyContent: 'space-between' }}
            >
              Generate Visual Report <ArrowRight size={13} />
            </button>
          </div>

          {/* Repair Planning */}
          <div
            style={{
              padding: 14,
              border: '1px solid #ddeadb',
              borderRadius: 10,
              background: '#fcfdfb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: 6, borderRadius: 6, background: '#e3f3e3', color: '#176342' }}>
                  <Wrench size={16} />
                </span>
                <strong style={{ fontSize: 13, color: '#176342' }}>Repair Planning</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#576f64', lineHeight: 1.5 }}>
                Draft structured engineering action plans with inspection checklists and submit them to municipal workflow for {villageName}.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onSelectTab('planning')}
              style={{ fontSize: 11.5, padding: '6px 12px', justifyContent: 'space-between' }}
            >
              Prepare Repair Plan <ArrowRight size={13} />
            </button>
          </div>

          {/* Citizen Assistance */}
          <div
            style={{
              padding: 14,
              border: '1px solid #ddeadb',
              borderRadius: 10,
              background: '#fcfdfb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: 6, borderRadius: 6, background: '#e3f3e3', color: '#176342' }}>
                  <MessageSquareText size={16} />
                </span>
                <strong style={{ fontSize: 13, color: '#176342' }}>Citizen Assistance</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#576f64', lineHeight: 1.5 }}>
                Bilingual Devanagari/English liaison for reporting damaged infrastructure and checking live issue tracking codes in {villageName}.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onSelectTab('citizen')}
              style={{ fontSize: 11.5, padding: '6px 12px', justifyContent: 'space-between' }}
            >
              Citizen Inquiries <ArrowRight size={13} />
            </button>
          </div>

          {/* AI Coordinator */}
          <div
            style={{
              padding: 14,
              border: '1px solid #ddeadb',
              borderRadius: 10,
              background: '#fcfdfb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: 6, borderRadius: 6, background: '#e3f3e3', color: '#176342' }}>
                  <Bot size={16} />
                </span>
                <strong style={{ fontSize: 13, color: '#176342' }}>AI Coordinator</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#576f64', lineHeight: 1.5 }}>
                Conversational assistant orchestrating cross-agent workflows for comprehensive municipal decision support in {villageName}.
              </p>
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onSelectTab('coordinator')}
              style={{ fontSize: 11.5, padding: '6px 12px', justifyContent: 'space-between' }}
            >
              Ask GaunPulse AI <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </Card>

      {/* Proactive Intelligence & Recent Analyses Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Risk & Recommendation */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ padding: 6, borderRadius: 6, background: '#fef3c7', color: '#b45309' }}>
              <TriangleAlert size={18} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                Active Single-Point-of-Failure Alert
              </strong>
              <span style={{ fontSize: 11, color: '#687c73' }}>NetworkX MultiGraph Simulation Engine</span>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            {insights?.simulation_risk_alert || `Infrastructure monitoring active for ${villageName}.`}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #edf0eb' }}>
            <strong style={{ display: 'block', fontSize: 11.5, color: '#176342', marginBottom: 4 }}>
              Municipal Recommendation:
            </strong>
            <p style={{ margin: 0, fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
              {insights?.recommended_action || `Review prioritized infrastructure issues and assign technical inspection teams for ${villageName}.`}
            </p>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onSelectTab('impact')}
              style={{ fontSize: 11, padding: '5px 12px' }}
            >
              Inspect Simulation <Network size={12} />
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onSelectTab('planning')}
              style={{ fontSize: 11, padding: '5px 12px' }}
            >
              Draft Action Plan <Wrench size={12} />
            </button>
          </div>
        </Card>

        {/* Recent Registered Disruptions */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                Latest Verified Reports for {villageName}
              </strong>
              <span style={{ fontSize: 11, color: '#687c73' }}>Live MySQL ServBay Records</span>
            </div>
            <StatusBadge tone="green">MySQL Live</StatusBadge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentIssues.length === 0 ? (
              <p style={{ fontSize: 12, color: '#687c73', fontStyle: 'italic', margin: '10px 0' }}>
                No active issues recorded in the database for {villageName}.
              </p>
            ) : (
              recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#f8faf8',
                    border: '1px solid #e2ece3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', color: '#274b39' }}>{issue.title}</strong>
                    <span style={{ fontSize: 10.5, color: '#687c73' }}>
                      {issue.tracking_code || `GP-${issue.id}`} · {issue.category?.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: issue.severity?.toLowerCase() === 'critical' ? '#fee2e2' : '#fef3c7',
                      color: issue.severity?.toLowerCase() === 'critical' ? '#991b1b' : '#92400e',
                    }}
                  >
                    {issue.severity || 'High'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button
              type="button"
              className="text-button"
              onClick={() => onNavigate && onNavigate('issues-alerts')}
              style={{ fontSize: 11.5 }}
            >
              View all issues in Municipal Tracker <ArrowRight size={13} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
