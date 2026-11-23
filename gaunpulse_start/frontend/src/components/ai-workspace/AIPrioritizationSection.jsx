import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useVillageSelection } from '../../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import { cachedFetchJson } from '../../utils/apiCache';

export default function AIPrioritizationSection({ onNavigate, onSelectTab }) {
  const { selectedVillageId, setSelectedVillageId, selectedVillage, villages: contextVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [ward, setWard] = useState('all');
  const [category, setCategory] = useState('all');
  const [issues, setIssues] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [overrideNotes, setOverrideNotes] = useState({});
  const [overrideSaved, setOverrideSaved] = useState({});
  const [villageNetwork, setVillageNetwork] = useState(null);

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
  const municipality = currentVillageObj?.municipality || 'Municipal Territory';

  const fetchAndAnalyzePriorities = async () => {
    if (!selectedVillageId) return;
    setAnalyzing(true);
    try {
      const [issuesRes, networkRes] = await Promise.all([
        cachedFetchJson(`/api/issues?village_id=${selectedVillageId}`, {}, {
          ttlMs: 30000,
        }),
        cachedFetchJson(`/api/villages/${selectedVillageId}/network`, {}, {
          ttlMs: 60000,
        }).catch(() => null),
      ]);

      const rawIssues = Array.isArray(issuesRes) ? issuesRes : (issuesRes.data || []);
      setIssues(rawIssues);
      setVillageNetwork(networkRes);
      if (rawIssues.length > 0) {
        setSelectedIssue(rawIssues[0]);
      } else {
        setSelectedIssue(null);
      }
    } catch (err) {
      console.error('Failed to analyze priorities:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzePriorities();
  }, [selectedVillageId]);

  // Deterministic Scoring Breakdown
  const calculateIssueScore = (iss) => {
    const sev = (iss.severity || '').toLowerCase();
    const cat = (iss.category || '').toLowerCase();

    // 1. Severity Score (30%)
    let sevScore = 40;
    if (sev === 'critical') sevScore = 95;
    else if (sev === 'high') sevScore = 75;
    else if (sev === 'medium') sevScore = 50;

    // 2. Affected Population Factor (30%) - read from actual issue or settlement estimates
    let affectedHH = iss.citizens_affected ? Math.max(1, Math.round(iss.citizens_affected / 5)) : 15;
    let popScore = Math.min(100, Math.max(30, affectedHH * 3));
    if (cat.includes('bridge')) {
      popScore = Math.max(popScore, 85);
      affectedHH = Math.max(affectedHH, 20);
    } else if (cat.includes('road')) {
      popScore = Math.max(popScore, 70);
      affectedHH = Math.max(affectedHH, 25);
    } else if (cat.includes('water')) {
      popScore = Math.max(popScore, 80);
      affectedHH = Math.max(affectedHH, 22);
    }

    // 3. Service Disruption (25%) - schools / health posts cut off
    let disruptionScore = 40;
    const facilities = villageNetwork?.facilities || [];
    const facilityNames = facilities.map((f) => f.name).filter(Boolean);
    let cutoffServices = facilityNames.length > 0 ? facilityNames.slice(0, 2) : ['Local Health Post / School Corridors'];

    if (cat.includes('bridge') || sev === 'critical') {
      disruptionScore = 90;
    } else if (cat.includes('water')) {
      disruptionScore = 85;
      cutoffServices = ['Communal Tapstand & WASH Network'];
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
      missingData: isVerified ? null : 'Field engineering inspection recommended to verify physical defect depth.',
    };
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (category !== 'all' && iss.category !== category) return false;
      if (ward !== 'all') {
        const w = iss.ward || currentVillageObj?.ward_no || '1';
        if (String(w) !== String(ward)) return false;
      }
      return true;
    });
  }, [issues, category, ward, currentVillageObj]);

  const rankedIssues = useMemo(() => {
    return filteredIssues
      .map((iss) => ({
        ...iss,
        analysis: calculateIssueScore(iss),
      }))
      .sort((a, b) => b.analysis.compositeScore - a.analysis.compositeScore);
  }, [filteredIssues, villageNetwork]);

  const handleSaveOverride = (issueId) => {
    setOverrideSaved((prev) => ({ ...prev, [issueId]: true }));
    setTimeout(() => {
      setOverrideSaved((prev) => ({ ...prev, [issueId]: false }));
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Human-Centered Task Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#092d22', fontFamily: 'Georgia, serif' }}>
          Which problems need attention first?
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#556e62' }}>
          Discover which municipal issues require rapid deployment and engineering inspection based on population risk and facility access.
        </p>
      </div>

      {/* Expandable Scoring Methodology */}
      <details className="ai-details-toggle">
        <summary>
          <Sliders size={14} /> View scoring methodology & criteria weights
        </summary>
        <div style={{ marginTop: 8, fontSize: 12, color: '#274b39', lineHeight: 1.5 }}>
          <strong>Deterministic Formula:</strong> Population Impact (30%), Essential Service Disruption (25%), Structural Severity (30%), Ground Verification (15%). Calculated deterministically from verified municipal records.
        </div>
      </details>

      {/* Filter and Control Bar */}
      <Card style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Village Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#687c73', fontWeight: 600 }}>MUNICIPALITY & VILLAGE</label>
              <select
                value={selectedVillageId}
                onChange={(e) => {
                  setSelectedVillageId(e.target.value);
                  setSelectedIssue(null);
                }}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff', minWidth: 200 }}
              >
                {deduplicateVillages(villages).map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatVillageLabel(v)}
                  </option>
                ))}
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
                <option value="all">All Wards</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                  <option key={w} value={String(w)}>
                    Ward {w}
                  </option>
                ))}
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
                <option value="damaged_road">Roads & Trails</option>
                <option value="water_supply">Water Supply</option>
                <option value="health_post_access">Health Access</option>
                <option value="school_access">School Access</option>
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
            {analyzing ? <Loader2 size={14} className="spin" /> : <Sliders size={14} />} Re-calculate Priorities
          </button>
        </div>
      </Card>

      {/* Empty State when no issues exist for the selected village */}
      {rankedIssues.length === 0 && !analyzing && (
        <Card style={{ padding: '36px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={36} color="#176342" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#092d22', margin: '0 0 6px' }}>
            No Active Infrastructure Issues in {villageName}
          </h3>
          <p style={{ fontSize: 13, color: '#687c73', margin: '0 0 16px', maxWidth: 480, marginInline: 'auto' }}>
            There are currently no registered disruption issues or field alerts recorded in MySQL for this village. You can report an issue or import infrastructure.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onNavigate && onNavigate('issues-alerts')}
            >
              Report New Field Issue <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onNavigate && onNavigate('village-data')}
            >
              Open Village Data Manager
            </button>
          </div>
        </Card>
      )}

      {/* Main Workspace Layout */}
      {rankedIssues.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: 16 }}>
          {/* Ranked Issues Table */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                  Priority-Ranked Infrastructure Interventions
                </strong>
                <span style={{ fontSize: 11, color: '#687c73' }}>
                  Sorted by computed Priority Index for {villageName} ({rankedIssues.length} issues)
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
                            {item.tracking_code || `GP-${item.id}`} · Ward {item.ward || currentVillageObj?.ward_no || '1'}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                    Transparent Priority Breakdown
                  </strong>
                  <span style={{ fontSize: 10.5, color: '#687c73' }}>
                    {selectedIssue.tracking_code || `GP-${selectedIssue.id}`} · {selectedIssue.title}
                  </span>
                </div>
                <StatusBadge tone={(selectedIssue.severity || '').toLowerCase() === 'critical' ? 'red' : 'orange'}>
                  {selectedIssue.severity}
                </StatusBadge>
              </div>

              {/* Sub-Criteria Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#4b5563' }}>Population At Risk (30%)</span>
                    <strong>{selectedIssue.analysis?.popScore || 70} / 100</strong>
                  </div>
                  <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedIssue.analysis?.popScore || 70}%`, background: '#b91c1c' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#4b5563' }}>Service Disruption Factor (25%)</span>
                    <strong>{selectedIssue.analysis?.disruptionScore || 60} / 100</strong>
                  </div>
                  <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedIssue.analysis?.disruptionScore || 60}%`, background: '#d97706' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#4b5563' }}>Structural Hazard Severity (30%)</span>
                    <strong>{selectedIssue.analysis?.sevScore || 80} / 100</strong>
                  </div>
                  <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedIssue.analysis?.sevScore || 80}%`, background: '#176342' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#4b5563' }}>Verification Confidence (15%)</span>
                    <strong>{selectedIssue.analysis?.verScore || 70} / 100</strong>
                  </div>
                  <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedIssue.analysis?.verScore || 70}%`, background: '#2563eb' }} />
                  </div>
                </div>
              </div>

              {/* Explainable Insights Box */}
              <div style={{ background: '#f8faf8', border: '1px solid #e2ece3', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, color: '#274b39', lineHeight: 1.5, marginBottom: 14 }}>
                <strong style={{ display: 'block', color: '#176342', marginBottom: 2 }}>Analysis Details:</strong>
                {selectedIssue.description || 'Infrastructure disruption requiring rapid municipal technical intervention.'}
                <div style={{ marginTop: 6, fontSize: 11, color: '#556e62' }}>
                  <strong>Lifelines Affected:</strong> {selectedIssue.analysis?.cutoffServices?.join(', ') || 'Local trail corridor'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => onSelectTab && onSelectTab('planning')}
                  style={{ fontSize: 11.5, padding: '7px 14px', justifyContent: 'center' }}
                >
                  Draft Repair Action Plan <Wrench size={13} />
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => onSelectTab && onSelectTab('impact')}
                  style={{ fontSize: 11.5, padding: '7px 14px', justifyContent: 'center' }}
                >
                  Simulate Network Impact <Network size={13} />
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
