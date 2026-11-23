import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Layers,
  ListOrdered,
  Loader2,
  Network,
  RefreshCw,
  Save,
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
import {
  calculatePriorityScore,
  DEMO_PRIORITIZATION_ISSUES,
  filterDemoIssues,
  SCORING_MODEL,
} from '../../utils/prioritizationScoring';

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

  // Demo Prioritization Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRecalcNonce, setDemoRecalcNonce] = useState(0);

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
  const isMarphaSelected = villageName.toLowerCase().includes('marpha');

  // Fetch real issues from MySQL
  const fetchAndAnalyzePriorities = async () => {
    if (isDemoMode) {
      // In demo mode, recalculate scoring deterministically
      setAnalyzing(true);
      setTimeout(() => {
        setDemoRecalcNonce((prev) => prev + 1);
        setAnalyzing(false);
      }, 300);
      return;
    }

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
    if (!isDemoMode) {
      fetchAndAnalyzePriorities();
    }
  }, [selectedVillageId, isDemoMode]);

  // Scoring function for Real MySQL records
  const calculateRealIssueScore = (iss) => {
    const sev = (iss.severity || '').toLowerCase();
    const cat = (iss.category || '').toLowerCase();

    // 1. Severity Score (30%)
    let sevScore = 40;
    if (sev === 'critical') sevScore = 95;
    else if (sev === 'high') sevScore = 75;
    else if (sev === 'medium') sevScore = 50;

    // 2. Affected Population Factor (30%)
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

    // 3. Service Disruption (25%)
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

  // Demo Scored Issues
  const demoRankedIssues = useMemo(() => {
    if (!isDemoMode) return [];

    const filtered = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, {
      category,
      ward,
      villageName,
    });

    return filtered
      .map((iss) => {
        const scoreData = calculatePriorityScore(iss);
        return {
          ...iss,
          tracking_code: iss.id === 'demo-bridge-01' ? 'GP-DEMO-01' : 'GP-DEMO-02',
          analysis: {
            compositeScore: scoreData.finalScore,
            finalScore: scoreData.finalScore,
            classification: scoreData.classification,
            badgeTone: scoreData.badgeTone,
            breakdown: scoreData.breakdown,
            formattedBreakdown: scoreData.formattedBreakdown,
            affectedHH: iss.affected_households,
            popScore: scoreData.breakdown.population.score,
            disruptionScore: scoreData.breakdown.essentialServices.score,
            sevScore: scoreData.breakdown.severity.score,
            verScore: 90,
            cutoffServices:
              iss.category === 'damaged_bridge'
                ? ['District Hospital Emergency Corridor', 'Janahit Secondary School']
                : ['Local Agricultural Market Access Trail', 'Ward 1 Health Clinic Access'],
            confidence: 'Demonstration Only (Sample Record)',
            missingData: null,
          },
        };
      })
      .sort((a, b) => b.analysis.compositeScore - a.analysis.compositeScore);
  }, [isDemoMode, category, ward, villageName, demoRecalcNonce]);

  // Real Issues Filtering and Ranking
  const realFilteredIssues = useMemo(() => {
    if (isDemoMode) return [];
    return issues.filter((iss) => {
      if (category !== 'all' && iss.category !== category) return false;
      if (ward !== 'all') {
        const w = iss.ward || currentVillageObj?.ward_no || '1';
        if (String(w) !== String(ward)) return false;
      }
      return true;
    });
  }, [issues, category, ward, currentVillageObj, isDemoMode]);

  const realRankedIssues = useMemo(() => {
    if (isDemoMode) return [];
    return realFilteredIssues
      .map((iss) => ({
        ...iss,
        analysis: calculateRealIssueScore(iss),
      }))
      .sort((a, b) => b.analysis.compositeScore - a.analysis.compositeScore);
  }, [realFilteredIssues, villageNetwork, isDemoMode]);

  // Combined Active Issues List depending on Mode
  const rankedIssues = isDemoMode ? demoRankedIssues : realRankedIssues;

  // Keep first issue selected when list changes or on mode switch
  useEffect(() => {
    if (rankedIssues.length > 0) {
      if (!selectedIssue || !rankedIssues.some((i) => i.id === selectedIssue.id)) {
        setSelectedIssue(rankedIssues[0]);
      }
    } else {
      setSelectedIssue(null);
    }
  }, [rankedIssues]);

  const handleSaveOverride = (issueId) => {
    setOverrideSaved((prev) => ({ ...prev, [issueId]: true }));
    setTimeout(() => {
      setOverrideSaved((prev) => ({ ...prev, [issueId]: false }));
    }, 2500);
  };

  const switchToMarphaVillage = () => {
    const marpha = villages.find((v) => v.name.toLowerCase().includes('marpha'));
    if (marpha) {
      setSelectedVillageId(marpha.id);
    }
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
          {isDemoMode ? (
            <div>
              <strong>Demonstration Prioritization Model:</strong> Infrastructure Severity (30%), Affected Population Impact (25%), Essential Service Disruption (20%), Emergency Access Disruption (15%), Repair Cost Efficiency (10%).
              <div style={{ marginTop: 4, color: '#556e62' }}>
                Normalized against reference population P<sub>ref</sub> = 600 and maximum benchmark repair cost NPR 2,500,000. Higher composite scores indicate more urgent repair priority.
              </div>
            </div>
          ) : (
            <div>
              <strong>Deterministic Formula:</strong> Population Impact (30%), Essential Service Disruption (25%), Structural Severity (30%), Ground Verification (15%). Calculated deterministically from verified municipal records.
            </div>
          )}
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

            {/* Demo Mode Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'flex-end' }}>
              <label style={{ fontSize: 10, color: '#687c73', fontWeight: 600 }}>DEMO MODE</label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDemoMode ? '#0f4831' : '#176342',
                  cursor: 'pointer',
                  background: isDemoMode ? '#e6f4ea' : '#f7f9f7',
                  border: `1px solid ${isDemoMode ? '#176342' : '#c8d8cc'}`,
                  padding: '6px 12px',
                  borderRadius: 6,
                  userSelect: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isDemoMode}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIsDemoMode(next);
                    setSelectedIssue(null);
                  }}
                  style={{ accentColor: '#176342', cursor: 'pointer' }}
                />
                <span>Show Demo Prioritization</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            className="button button--primary"
            onClick={fetchAndAnalyzePriorities}
            disabled={analyzing}
            style={{ fontSize: 12, padding: '8px 18px', gap: 7 }}
          >
            {analyzing ? <Loader2 size={14} className="spin" /> : <Sliders size={14} />} Re-calculate Priorities
          </button>
        </div>
      </Card>

      {/* Demo Notice Banner */}
      {isDemoMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#eff8f3',
            border: '1px solid #c2e2cf',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 12.5,
            color: '#176342',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={17} color="#176342" />
            <div>
              <strong>Demonstration Mode:</strong> Demonstration data — fictional infrastructure scenarios, not actual reported incidents.
              <span style={{ display: 'block', fontSize: 11, color: '#4d695b' }}>
                Designated Scenario Location: <strong>Marpha — Demo Scenario</strong> (Mustang) · Isolated from live civic reports.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsDemoMode(false);
              setSelectedIssue(null);
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #c8d8cc',
              borderRadius: 5,
              padding: '4px 10px',
              color: '#176342',
              fontWeight: 600,
              fontSize: 11.5,
              cursor: 'pointer',
            }}
          >
            Exit Demo Mode
          </button>
        </div>
      )}

      {/* Location Notice when demo mode is active and non-Marpha village is selected */}
      {isDemoMode && !isMarphaSelected && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <strong>Notice:</strong> Demonstration scenarios are designated for <strong>Marpha — Demo Scenario</strong>. Currently viewing {villageName}.
          </div>
          <button
            type="button"
            onClick={switchToMarphaVillage}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: 5,
              padding: '5px 12px',
              fontWeight: 600,
              fontSize: 11.5,
              cursor: 'pointer',
            }}
          >
            Switch to Marpha
          </button>
        </div>
      )}

      {/* Empty State when no issues exist for the selected village / filters */}
      {rankedIssues.length === 0 && !analyzing && (
        <Card style={{ padding: '36px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={36} color="#176342" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#092d22', margin: '0 0 6px' }}>
            {isDemoMode
              ? `No Demo Issues Match Current Filters in ${villageName}`
              : `No Active Infrastructure Issues in ${villageName}`}
          </h3>
          <p style={{ fontSize: 13, color: '#687c73', margin: '0 0 16px', maxWidth: 480, marginInline: 'auto' }}>
            {isDemoMode
              ? `No demonstration issues match category "${category}" or ward "${ward}". Adjust your filters or switch to "All Lifelines".`
              : 'There are currently no registered disruption issues or field alerts recorded in MySQL for this village. You can activate demonstration mode or report an issue.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isDemoMode && (
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  setIsDemoMode(true);
                  if (!isMarphaSelected) switchToMarphaVillage();
                }}
              >
                <Sparkles size={14} /> Show Demo Prioritization (Marpha Scenario)
              </button>
            )}
            <button
              type="button"
              className="button button--secondary"
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
          {/* Left Column: Ranked Issues */}
          {isDemoMode ? (
            /* DEMO MODE: Result Cards matching Section 4 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                    Calculated Demonstration Priority Rankings
                  </strong>
                  <span style={{ fontSize: 11, color: '#687c73' }}>
                    Calculated using multi-factor weighted scoring model ({rankedIssues.length} issues)
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#176342', background: '#e3f3e3', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                  Demo Prioritization
                </span>
              </div>

              {rankedIssues.map((item, idx) => {
                const isSelected = selectedIssue?.id === item.id;
                const score = item.analysis.compositeScore ?? item.analysis.finalScore;
                const isCritical = (item.severity || '').toLowerCase() === 'critical';

                return (
                  <Card
                    key={item.id}
                    style={{
                      padding: '16px 18px',
                      border: isSelected ? '2px solid #176342' : '1px solid #d9e3db',
                      background: isSelected ? '#f7faf8' : '#ffffff',
                      borderRadius: 8,
                      boxShadow: isSelected ? '0 4px 12px rgba(23, 99, 66, 0.08)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Header Row: Title and Calculated Score */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-grid',
                              placeItems: 'center',
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: idx === 0 ? '#c0392b' : '#d97706',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: 11,
                            }}
                          >
                            Priority #{idx + 1}
                          </span>
                          <strong style={{ fontSize: 15, color: '#092d22' }}>
                            {item.title}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#556e62', flexWrap: 'wrap' }}>
                          <StatusBadge tone={isCritical ? 'red' : 'orange'}>
                            {item.severity}
                          </StatusBadge>
                          <span>|</span>
                          <strong style={{ color: '#176342' }}>{item.category_label || item.category}</strong>
                          <span>|</span>
                          <span style={{ color: '#7c8e84' }}>{item.location}</span>
                        </div>
                      </div>

                      {/* Calculated Score Display */}
                      <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <small style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: '#687c73', fontWeight: 600 }}>
                          Calculated Score
                        </small>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 3 }}>
                          <strong style={{ fontSize: 20, color: score >= 80 ? '#c0392b' : '#d97706' }}>
                            {score}
                          </strong>
                          <span style={{ fontSize: 11, color: '#687c73' }}>/ 100</span>
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 10,
                            fontWeight: 700,
                            color: score >= 80 ? '#991b1b' : '#92400e',
                            background: score >= 80 ? '#fee2e2' : '#fef3c7',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {item.analysis.classification || (score >= 80 ? 'Critical Priority' : 'Moderate Priority')}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                        gap: 10,
                        background: '#f4f7f4',
                        border: '1px solid #e2ece3',
                        borderRadius: 6,
                        padding: '10px 12px',
                        margin: '10px 0',
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <span style={{ display: 'block', fontSize: 10.5, color: '#687c73' }}>Affected Households</span>
                        <strong style={{ color: '#092d22' }}>{item.affected_households}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 10.5, color: '#687c73' }}>Affected Population</span>
                        <strong style={{ color: '#092d22' }}>{item.affected_population}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 10.5, color: '#687c73' }}>Estimated Repair Cost</span>
                        <strong style={{ color: '#092d22' }}>{item.estimated_repair_cost_formatted}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 10.5, color: '#687c73' }}>Infrastructure Condition</span>
                        <strong style={{ color: '#092d22' }}>{item.infrastructure_condition}</strong>
                      </div>
                    </div>

                    {/* Reason / Explanation */}
                    <div style={{ fontSize: 12, color: '#274b39', marginBottom: 12, lineHeight: 1.5 }}>
                      <strong>Reason: </strong> {item.reason}
                    </div>

                    {/* Footer Row: Details Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eef3ee', paddingTop: 10 }}>
                      <span style={{ fontSize: 11, color: '#7c8e84' }}>
                        Verification: <strong>{item.verification_status}</strong>
                      </span>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setSelectedIssue(item)}
                        style={{ fontSize: 11.5, padding: '5px 12px', gap: 6 }}
                      >
                        {isSelected ? 'Viewing Priority Details' : 'View Priority Details'} <ArrowRight size={12} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* REAL MODE: Existing Ranked Issues Table */
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
          )}

          {/* Right Column: Selected Issue Calculation Breakdown */}
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

              {/* Exact Formula Breakdown Box for Demo Mode matching Section 6 */}
              {isDemoMode && selectedIssue.analysis?.breakdown ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ display: 'block', fontSize: 10.5, color: '#687c73', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                      Weighted Priority Calculation
                    </span>
                    <pre
                      style={{
                        background: '#092d22',
                        color: '#e4f4ea',
                        padding: '12px 14px',
                        borderRadius: 6,
                        fontFamily: 'Courier New, monospace',
                        fontSize: 11.5,
                        lineHeight: 1.6,
                        overflowX: 'auto',
                        margin: 0,
                        border: '1px solid #176342',
                      }}
                    >
{`Severity:              ${String(selectedIssue.analysis.breakdown.severity.score).padStart(2, ' ')} × 0.30 = ${selectedIssue.analysis.breakdown.severity.weighted.toFixed(1).padStart(4, ' ')}
Population Impact:     ${String(selectedIssue.analysis.breakdown.population.score).padStart(2, ' ')} × 0.25 = ${selectedIssue.analysis.breakdown.population.weighted.toFixed(1).padStart(4, ' ')}
Essential Services:    ${String(selectedIssue.analysis.breakdown.essentialServices.score).padStart(2, ' ')} × 0.20 = ${selectedIssue.analysis.breakdown.essentialServices.weighted.toFixed(1).padStart(4, ' ')}
Emergency Access:     ${String(selectedIssue.analysis.breakdown.emergencyAccess.score).padStart(3, ' ')} × 0.15 = ${selectedIssue.analysis.breakdown.emergencyAccess.weighted.toFixed(1).padStart(4, ' ')}
Cost Efficiency:       ${String(selectedIssue.analysis.breakdown.costEfficiency.score).padStart(2, ' ')} × 0.10 = ${selectedIssue.analysis.breakdown.costEfficiency.weighted.toFixed(1).padStart(4, ' ')}

Total Priority Score:              ${selectedIssue.analysis.finalScore.toFixed(1)}/100`}
                    </pre>
                  </div>

                  {/* 5-Factor Progress Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: '#4b5563' }}>Infrastructure Severity (30%)</span>
                        <strong>{selectedIssue.analysis.breakdown.severity.score} / 100</strong>
                      </div>
                      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selectedIssue.analysis.breakdown.severity.score}%`, background: '#b91c1c' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: '#4b5563' }}>Population Impact (25%) [P_ref: 600]</span>
                        <strong>{selectedIssue.analysis.breakdown.population.score} / 100</strong>
                      </div>
                      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selectedIssue.analysis.breakdown.population.score}%`, background: '#d97706' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: '#4b5563' }}>Essential Services Impact (20%)</span>
                        <strong>{selectedIssue.analysis.breakdown.essentialServices.score} / 100</strong>
                      </div>
                      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selectedIssue.analysis.breakdown.essentialServices.score}%`, background: '#176342' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: '#4b5563' }}>Emergency Access Disruption (15%)</span>
                        <strong>{selectedIssue.analysis.breakdown.emergencyAccess.score} / 100</strong>
                      </div>
                      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selectedIssue.analysis.breakdown.emergencyAccess.score}%`, background: '#2563eb' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: '#4b5563' }}>Repair Cost Efficiency (10%) [C_max: 2.5M]</span>
                        <strong>{selectedIssue.analysis.breakdown.costEfficiency.score} / 100</strong>
                      </div>
                      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selectedIssue.analysis.breakdown.costEfficiency.score}%`, background: '#059669' }} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Sub-Criteria Progress Bars for Real Mode */
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
              )}

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
