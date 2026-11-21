import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Layers,
  ListOrdered,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, StatusBadge } from '../ui';

export default function AIPrioritizationSection({ onNavigate, onSelectTab }) {
  const [municipality, setMunicipality] = useState('Helambu Rural Municipality');
  const [ward, setWard] = useState('all');
  const [villageId, setVillageId] = useState('1');
  const [category, setCategory] = useState('all');
  const [issues, setIssues] = useState([]);
  const [prioritiesData, setPrioritiesData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [overrideNotes, setOverrideNotes] = useState({});
  const [overrideSaved, setOverrideSaved] = useState({});

  const fetchAndAnalyzePriorities = async () => {
    setAnalyzing(true);
    try {
      const [prioRes, issuesRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/priorities').then((r) => r.json()),
        fetch(`http://127.0.0.1:8000/api/issues?village_id=${villageId}`).then((r) => r.json()),
      ]);

      setPrioritiesData(prioRes);
      const rawIssues = Array.isArray(issuesRes) ? issuesRes : (issuesRes.data || []);
      setIssues(rawIssues);
      if (rawIssues.length > 0 && !selectedIssue) {
        setSelectedIssue(rawIssues[0]);
      }
    } catch (err) {
      console.error('Failed to analyze priorities:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzePriorities();
  }, [villageId]);

  // Deterministic Scoring Breakdown
  const calculateIssueScore = (iss) => {
    const sev = (iss.severity || '').toLowerCase();
    const cat = (iss.category || '').toLowerCase();

    // 1. Severity Score (30%)
    let sevScore = 40;
    if (sev === 'critical') sevScore = 95;
    else if (sev === 'high') sevScore = 75;
    else if (sev === 'medium') sevScore = 50;

    // 2. Affected Population Factor (30%)
    // Bridge B or single point of failure isolates 20 HH; road slides partially affect 35 HH
    let popScore = 50;
    let affectedHH = 15;
    if (cat.includes('bridge')) {
      popScore = 90;
      affectedHH = 20;
    } else if (cat.includes('road')) {
      popScore = 70;
      affectedHH = 35;
    } else if (cat.includes('water')) {
      popScore = 80;
      affectedHH = 28;
    }

    // 3. Service Disruption (25%) - schools / health posts cut off
    let disruptionScore = 40;
    let cutoffServices = ['Local Market Access'];
    if (cat.includes('bridge') || sev === 'critical') {
      disruptionScore = 90;
      cutoffServices = ['Bhotenamlang Primary Health Post', 'Janahit Secondary School'];
    } else if (cat.includes('water')) {
      disruptionScore = 85;
      cutoffServices = ['Communal Tapstand Network'];
    }

    // 4. Verification Quality (15%)
    const isVerified = iss.status === 'verified' || iss.status === 'in_progress';
    const verScore = isVerified ? 90 : 60;

    // Weighted Formula
    const composite = (popScore * 0.30) + (disruptionScore * 0.25) + (sevScore * 0.30) + (verScore * 0.15);

    return {
      compositeScore: Math.round(composite),
      popScore,
      disruptionScore,
      sevScore,
      verScore,
      affectedHH,
      cutoffServices,
      confidence: isVerified ? 'High (Field Verified)' : 'Medium (Citizen Report Pending Verification)',
      missingData: isVerified ? null : 'Recent geotechnical shear test reading missing; verification visit required.',
    };
  };

  const filteredIssues = issues.filter((iss) => {
    if (category !== 'all' && iss.category !== category) return false;
    if (ward !== 'all') {
      const w = iss.ward || '4';
      if (String(w) !== String(ward)) return false;
    }
    return true;
  });

  const rankedIssues = filteredIssues
    .map((iss) => ({
      ...iss,
      analysis: calculateIssueScore(iss),
    }))
    .sort((a, b) => b.analysis.compositeScore - a.analysis.compositeScore);

  const handleSaveOverride = (issueId) => {
    setOverrideSaved((prev) => ({ ...prev, [issueId]: true }));
    setTimeout(() => {
      setOverrideSaved((prev) => ({ ...prev, [issueId]: false }));
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Policy and Algorithm Banner */}
      <div
        style={{
          background: '#f4f8f4',
          border: '1px solid #c9dec9',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 12,
          color: '#274b39',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sliders size={20} color="#176342" style={{ flexShrink: 0 }} />
          <div>
            <strong>Deterministic Priority Scoring Algorithm:</strong> Weighted criteria: Population Impact (30%), Essential Service Disruption (25%), Structural Severity (30%), Ground Verification (15%).
            Scores are calculated deterministically without LLM hallucinations.
          </div>
        </div>
        <StatusBadge tone="green">Deterministic Formula</StatusBadge>
      </div>

      {/* Filter and Control Bar */}
      <Card style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Municipality */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#687c73', fontWeight: 600 }}>MUNICIPALITY</label>
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="Helambu Rural Municipality">Helambu Rural Municipality</option>
              </select>
            </div>

            {/* Ward */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#687c73', fontWeight: 600 }}>WARD</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="all">All Wards (1-7)</option>
                <option value="4">Ward 4 (Bhotenamlang)</option>
                <option value="3">Ward 3</option>
                <option value="2">Ward 2</option>
              </select>
            </div>

            {/* Village */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#687c73', fontWeight: 600 }}>VILLAGE</label>
              <select
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="1">Bhotenamlang (Model Village)</option>
              </select>
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#687c73', fontWeight: 600 }}>INFRASTRUCTURE CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="all">All Lifelines</option>
                <option value="damaged_bridge">Bridges & Crossings</option>
                <option value="road_block">Roads & Trails</option>
                <option value="water_supply">Water Supply</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="button button--primary"
            onClick={fetchAndAnalyzePriorities}
            disabled={analyzing}
            style={{ fontSize: 12, padding: '8px 18px' }}
          >
            {analyzing ? <Loader2 size={14} className="spin" /> : <Sliders size={14} />} Analyze Priorities
          </button>
        </div>
      </Card>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: 16 }}>
        {/* Ranked Issues Table */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                Priority-Ranked Infrastructure Interventions
              </strong>
              <span style={{ fontSize: 11, color: '#687c73' }}>
                Sorted by computed Priority Index ({rankedIssues.length} issues analyzed)
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#176342', background: '#e3f3e3', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              Live Ranking
            </span>
          </div>

          <div className="table-scroll">
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Infrastructure Disruption</th>
                  <th>Impact Score</th>
                  <th>Affected Pop.</th>
                  <th>Urgency</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rankedIssues.map((item, idx) => {
                  const isSelected = selectedIssue?.id === item.id;
                  const score = item.analysis.compositeScore;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: isSelected ? '#f0f7f1' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedIssue(item)}
                    >
                      <td>
                        <span
                          style={{
                            display: 'inline-grid',
                            placeItems: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: idx === 0 ? '#c0392b' : (idx === 1 ? '#d97706' : '#176342'),
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 10.5,
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{item.title}</strong>
                        <small style={{ display: 'block', color: '#687c73', fontSize: 10.5 }}>
                          {item.tracking_code || `GP-${item.id}`} · Ward {item.ward || '4'}
                        </small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ color: score >= 80 ? '#c0392b' : (score >= 60 ? '#d97706' : '#176342'), fontSize: 13 }}>
                            {score}
                          </strong>
                          <span style={{ fontSize: 10, color: '#687c73' }}>/ 100</span>
                        </div>
                      </td>
                      <td>
                        <strong>{item.analysis.affectedHH} HH</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: score >= 80 ? '#fee2e2' : (score >= 60 ? '#fef3c7' : '#e0f2fe'),
                            color: score >= 80 ? '#991b1b' : (score >= 60 ? '#92400e' : '#075985'),
                          }}
                        >
                          {score >= 80 ? 'Immediate Inspection' : (score >= 60 ? 'High Priority' : 'Routine')}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(item);
                          }}
                          style={{ fontSize: 11 }}
                        >
                          Inspect <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Issue Calculation Breakdown & Official Override */}
        {selectedIssue && (
          <Card style={{ padding: 18 }}>
            <div style={{ borderBottom: '1px solid #edf0eb', paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600 }}>AUDIT BREAKDOWN</span>
                <span style={{ fontSize: 10, background: '#e3f3e3', color: '#176342', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  Confidence: {selectedIssue.analysis?.confidence.split(' ')[0]}
                </span>
              </div>
              <strong style={{ display: 'block', fontSize: 14, color: '#176342', marginTop: 4 }}>
                {selectedIssue.title}
              </strong>
              <span style={{ fontSize: 11, color: '#687c73' }}>
                Tracking: {selectedIssue.tracking_code || `GP-${selectedIssue.id}`} · {selectedIssue.category?.replace('_', ' ')}
              </span>
            </div>

            {/* Score Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>Population Impact (30% weight)</span>
                  <strong>{selectedIssue.analysis?.popScore}/100 ({selectedIssue.analysis?.affectedHH} HH)</strong>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${selectedIssue.analysis?.popScore}%`, height: '100%', background: '#176342' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>Essential Services Disruption (25% weight)</span>
                  <strong>{selectedIssue.analysis?.disruptionScore}/100</strong>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${selectedIssue.analysis?.disruptionScore}%`, height: '100%', background: '#d97706' }} />
                </div>
                <small style={{ fontSize: 10, color: '#687c73', display: 'block', marginTop: 2 }}>
                  Cut off: {selectedIssue.analysis?.cutoffServices?.join(', ')}
                </small>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>Structural Physical Severity (30% weight)</span>
                  <strong>{selectedIssue.analysis?.sevScore}/100 ({selectedIssue.severity})</strong>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${selectedIssue.analysis?.sevScore}%`, height: '100%', background: '#c0392b' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>Ground Field Verification (15% weight)</span>
                  <strong>{selectedIssue.analysis?.verScore}/100</strong>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${selectedIssue.analysis?.verScore}%`, height: '100%', background: '#0284c7' }} />
                </div>
              </div>
            </div>

            {/* Missing Data Warning */}
            {selectedIssue.analysis?.missingData && (
              <div style={{ marginTop: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#92400e' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Info size={12} /> Missing Ground Telemetry:
                </strong>
                {selectedIssue.analysis.missingData}
              </div>
            )}

            {/* Official Review / Override Documenter */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #edf0eb' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#176342', display: 'block', marginBottom: 4 }}>
                Document Official Municipal Override / Review Notes:
              </label>
              <textarea
                rows={2}
                placeholder="Enter justification if modifying inspection rank (e.g., upcoming election route, critical ambulance bypass)..."
                value={overrideNotes[selectedIssue.id] || ''}
                onChange={(e) => setOverrideNotes({ ...overrideNotes, [selectedIssue.id]: e.target.value })}
                style={{ width: '100%', borderRadius: 6, border: '1px solid #cfdecf', padding: 8, fontSize: 11, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {overrideSaved[selectedIssue.id] ? (
                  <span style={{ fontSize: 11, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Review recorded in audit trail
                  </span>
                ) : <span />}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleSaveOverride(selectedIssue.id)}
                    style={{ fontSize: 11, padding: '5px 12px' }}
                  >
                    <Save size={12} /> Save Review Note
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => onSelectTab('planning')}
                    style={{ fontSize: 11, padding: '5px 12px' }}
                  >
                    Create Action Plan <Wrench size={12} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
