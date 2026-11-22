import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Home,
  Info,
  Layers,
  Loader2,
  MapPin,
  Network,
  RefreshCw,
  Route,
  ShieldAlert,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, StatusBadge } from '../ui';
import { useVillageSelection } from '../../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import { cachedFetchJson } from '../../utils/apiCache';

export default function AIImpactSection({ onSelectTab, onNavigate }) {
  const { selectedVillageId, setSelectedVillageId, selectedVillage, villages: contextVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [edges, setEdges] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [scenario, setScenario] = useState('monsoon_torrent');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const abortControllerRef = useRef(null);

  // Sync villages from global context
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

  // When selected village changes:
  // 1. Clear previous selected edge immediately
  // 2. Clear previous simulation result immediately
  // 3. Clear previous errors
  // 4. Cancel in-flight requests from prior village
  // 5. Fetch fresh village network and select that village's own first edge
  useEffect(() => {
    if (!selectedVillageId) return;

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset all stale state immediately
    setSelectedEdgeId('');
    setSimResult(null);
    setError(null);
    setEdges([]);
    setReadiness(null);
    setNetworkLoading(true);

    fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load village network (HTTP ${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setNetworkLoading(false);

        const edgeList = data.edges || [];
        setEdges(edgeList);
        setReadiness(data.readiness || null);

        // Populate and select only from the newly loaded village's records
        if (edgeList.length > 0) {
          // Auto-select first bridge or first edge belonging to this village
          const bridgeEdge = edgeList.find((e) =>
            ['bridge', 'suspension_bridge'].includes((e.infrastructure_type || e.type || '').toLowerCase())
          );
          const firstEdge = bridgeEdge || edgeList[0];
          setSelectedEdgeId(String(firstEdge.id));
        } else {
          setSelectedEdgeId('');
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setNetworkLoading(false);
        console.error('Failed to load village network:', err);
        setError(err.message || 'Could not load village infrastructure network.');
        setSimResult(null);
      });

    return () => {
      controller.abort();
    };
  }, [selectedVillageId]);

  const handleVillageChange = (e) => {
    const newVillageId = e.target.value;
    // Clear simulation results and error before triggering state change
    setSimResult(null);
    setError(null);
    setSelectedEdgeId('');
    setSelectedVillageId(newVillageId);
  };

  const runImpactAnalysis = async () => {
    if (!selectedVillageId || !selectedEdgeId) return;

    // Validate that the selected edge belongs to the currently loaded village
    const matchingEdge = edges.find((e) => String(e.id) === String(selectedEdgeId));
    if (!matchingEdge) {
      setError(`Selected infrastructure edge '${selectedEdgeId}' does not belong to the selected village.`);
      setSimResult(null);
      return;
    }

    // Verify simulation readiness
    if (readiness && readiness.can_simulate === false) {
      setError('This village needs mapped and connected roads before impact analysis can run.');
      setSimResult(null);
      return;
    }

    setSimulating(true);
    setError(null);
    // Clear previous simulation result so failed request never leaves stale result visible
    setSimResult(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          village_id: Number(selectedVillageId),
          blocked_edge_ids: [Number(selectedEdgeId)],
          failed_edge_id: Number(selectedEdgeId),
          scenario_type: scenario === 'monsoon_torrent' ? 'monsoon_flood' : 'complete_closure',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Simulation service returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setSimResult(data.result || data);
      setError(null);
    } catch (err) {
      console.error('Impact simulation failed:', err);
      setError(err.message || 'Could not execute NetworkX impact analysis.');
      // Ensure stale simulation result is cleared on error
      setSimResult(null);
    } finally {
      setSimulating(false);
    }
  };

  const activeEdge = edges.find((e) => String(e.id) === String(selectedEdgeId));
  const currentVillageObj = selectedVillage || villages.find((v) => Number(v.id) === Number(selectedVillageId));
  const villageName = currentVillageObj?.name || 'Selected Village';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Human-Centered Task Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#092d22', fontFamily: 'Georgia, serif' }}>
          What happens if this road or bridge is blocked?
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#556e62' }}>
          Simulate real shortest-path connectivity and see which settlements are isolated from schools and health posts.
        </p>
      </div>

      {/* Expandable Technical Graph Information */}
      <details className="ai-details-toggle">
        <summary>
          <Network size={14} /> View simulation engine details (NetworkX 3.x)
        </summary>
        <div style={{ marginTop: 8, fontSize: 12, color: '#274b39', lineHeight: 1.5 }}>
          Calculates real shortest-path connectivity changes on rural infrastructure graphs. Baseline vs post-failure routes reveal exact isolated settlements, detour delays, and cut-off lifelines.
        </div>
      </details>

      {/* Simulator Control Card */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {/* Village Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600 }}>MUNICIPALITY & VILLAGE</label>
              <select
                value={selectedVillageId}
                onChange={handleVillageChange}
                style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff' }}
              >
                {deduplicateVillages(villages).map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatVillageLabel(v)}
                  </option>
                ))}
              </select>
            </div>

            {/* Road or Bridge Asset Selector (populated only with selected village's edges) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600 }}>INFRASTRUCTURE LIFELINE ASSET</label>
              <select
                value={selectedEdgeId}
                onChange={(e) => {
                  setSelectedEdgeId(e.target.value);
                  setError(null);
                }}
                disabled={networkLoading || edges.length === 0}
                style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff', minWidth: 260 }}
              >
                {networkLoading ? (
                  <option value="">Loading village infrastructure...</option>
                ) : edges.length === 0 ? (
                  <option value="">No mapped roads or bridges in this village</option>
                ) : (
                  edges.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.infrastructure_type || e.type || 'Link'}) - {e.edge_code || `Edge #${e.id}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Failure Scenario Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600 }}>FAILURE SCENARIO</label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, color: '#176342', fontWeight: 600, background: '#ffffff' }}
              >
                <option value="monsoon_torrent">Monsoon River Torrent / Pier Scour</option>
                <option value="slope_failure">Landslide Debris Slide / Slope Washout</option>
                <option value="cable_snap">Structural Fatigue / Anchor Shift</option>
                <option value="seismic">Seismic Retaining Wall Collapse</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="button button--primary"
            onClick={runImpactAnalysis}
            disabled={simulating || networkLoading || !selectedEdgeId || edges.length === 0}
            style={{ fontSize: 12, padding: '8px 20px' }}
          >
            {simulating ? <Loader2 size={14} className="spin" /> : <Network size={14} />} Analyze Infrastructure Impact
          </button>
        </div>
      </Card>

      {/* Network Readiness Warning for Villages without Mapped Infrastructure */}
      {!networkLoading && edges.length === 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: 13, color: '#92400e', display: 'block' }}>
                This village needs mapped and connected roads before impact analysis can run.
              </strong>
              <span style={{ fontSize: 12, color: '#b45309' }}>
                Village '{villageName}' does not have any active road or bridge corridors in the municipal database.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onNavigate && onNavigate('village-data')}
            style={{ fontSize: 11.5, padding: '6px 14px' }}
          >
            Open Village Data Manager <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Error Message Display - Stale result is NOT rendered beneath */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 18px', color: '#991b1b', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <strong>Simulation Failed:</strong> {error}
          </div>
        </div>
      )}

      {/* Simulation Results Display (Rendered ONLY on successful execution without errors) */}
      {!error && simResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: 16 }}>
          {/* Impact Overview & Access Comparisons */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#176342' }}>
                  Simulated Disruption: {activeEdge?.name || `Infrastructure #${selectedEdgeId}`}
                </strong>
                <span style={{ fontSize: 11, color: '#687c73' }}>
                  Village: {villageName} · Scenario: {scenario.replace('_', ' ').toUpperCase()} · Edge {selectedEdgeId}
                </span>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#fee2e2', color: '#991b1b' }}>
                Simulated Disruption Active
              </span>
            </div>

            {/* Impact Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 10.5, color: '#991b1b', fontWeight: 600, display: 'block' }}>AFFECTED HOUSEHOLDS</span>
                <strong style={{ fontSize: 22, color: '#b91c1c', fontFamily: 'Georgia, serif' }}>
                  {simResult.affected_households ?? 0} HH
                </strong>
                <small style={{ display: 'block', color: '#687c73', fontSize: 10 }}>Directly impacted</small>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 10.5, color: '#92400e', fontWeight: 600, display: 'block' }}>DISCONNECTED SETTLEMENTS</span>
                <strong style={{ fontSize: 22, color: '#b45309', fontFamily: 'Georgia, serif' }}>
                  {simResult.isolated_settlements?.length ?? 0}
                </strong>
                <small style={{ display: 'block', color: '#687c73', fontSize: 10 }}>Severed lifelines</small>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 10.5, color: '#166534', fontWeight: 600, display: 'block' }}>FACILITIES CUT OFF</span>
                <strong style={{ fontSize: 22, color: '#15803d', fontFamily: 'Georgia, serif' }}>
                  {simResult.essential_facilities_affected?.length ?? 0}
                </strong>
                <small style={{ display: 'block', color: '#687c73', fontSize: 10 }}>Clinics & schools</small>
              </div>
            </div>

            {/* Human-Readable Explanation */}
            <div style={{ background: '#f8faf8', border: '1px solid #e2ece3', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#274b39', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#176342', marginBottom: 4 }}>
                NetworkX Topological Finding:
              </strong>
              {simResult.summary_explanation || (
                simResult.affected_households > 0
                  ? `Simulated failure of ${activeEdge?.name || 'this lifeline corridor'} severs the single accessible route for ${simResult.isolated_settlements?.[0]?.settlement || 'connected settlements'} (${simResult.affected_households} households). No viable detour exists under current topological conditions.`
                  : `Simulated failure of this link preserves redundant connectivity via adjacent bypass routes. No settlement is completely isolated.`
              )}
            </div>

            {/* Settlement-to-Facility Journey Changes Table */}
            <strong style={{ display: 'block', fontSize: 12, color: '#176342', marginBottom: 6 }}>
              Settlement-to-Facility Journey Impact Analysis:
            </strong>
            <div className="table-scroll">
              <table className="data-table" style={{ fontSize: 11.5 }}>
                <thead>
                  <tr>
                    <th>Settlement</th>
                    <th>Destination Facility</th>
                    <th>Baseline Time</th>
                    <th>After Failure</th>
                    <th>Accessibility Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(simResult.access_comparisons || []).slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td><strong>{row.settlement}</strong></td>
                      <td>{row.facility} ({row.facility_type})</td>
                      <td>{row.before_minutes != null ? `${row.before_minutes} min` : 'Unreachable'}</td>
                      <td>
                        {row.after_minutes != null ? (
                          <span style={{ color: '#b45309', fontWeight: 700 }}>{row.after_minutes} min (+{Math.round(row.after_minutes - row.before_minutes)}m)</span>
                        ) : (
                          <span style={{ color: '#b91c1c', fontWeight: 700 }}>Unreachable (Blocked)</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                            background: row.status === 'unreachable' ? '#fee2e2' : '#fef3c7',
                            color: row.status === 'unreachable' ? '#991b1b' : '#92400e',
                          }}
                        >
                          {row.status === 'unreachable' ? 'Cut Off (Zero Routes)' : 'Detour Required'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Uncertainty & Engineering Assumptions Panel */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ padding: 6, borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>
                <Cpu size={16} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#176342' }}>
                  Engineering Assumptions & Uncertainty
                </strong>
                <span style={{ fontSize: 10.5, color: '#687c73' }}>NetworkX Shortest-Path Model Bounds</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5, color: '#4b5563', lineHeight: 1.5 }}>
              <div style={{ padding: 10, background: '#fbfcfb', border: '1px solid #e5ece6', borderRadius: 6 }}>
                <strong style={{ color: '#176342', display: 'block' }}>1. Walking Speed Baseline:</strong>
                Calculated at standard rural mountain walking speed (50-65 m/min) calibrated for gradient elevation gain.
              </div>

              <div style={{ padding: 10, background: '#fbfcfb', border: '1px solid #e5ece6', borderRadius: 6 }}>
                <strong style={{ color: '#176342', display: 'block' }}>2. Single-Point-of-Failure Risk:</strong>
                Footbridges and trails crossing river gorges or landslide zones have 0% redundancy during monsoon swollen states.
              </div>

              <div style={{ padding: 10, background: '#fbfcfb', border: '1px solid #e5ece6', borderRadius: 6 }}>
                <strong style={{ color: '#176342', display: 'block' }}>3. Missing Subsurface Telemetry:</strong>
                Geotechnical rockfall probability and abutment scouring require physical probe verification by municipal engineer.
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #edf0eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="button button--primary"
                onClick={() => onSelectTab('planning')}
                style={{ fontSize: 11.5, padding: '7px 14px', justifyContent: 'center' }}
              >
                Draft Repair Plan for This Asset <Wrench size={13} />
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => onNavigate && onNavigate('village-map')}
                style={{ fontSize: 11.5, padding: '7px 14px', justifyContent: 'center' }}
              >
                Inspect GIS Spatial Map <MapPin size={13} />
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
