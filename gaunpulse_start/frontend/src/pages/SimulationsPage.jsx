import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  GitCompare,
  History,
  Loader2,
  MapPin,
  Network,
  RefreshCw,
  Route,
  ShieldAlert,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import InteractiveVillageMap from '../components/InteractiveVillageMap';
import { Card, CardHeader, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';

const API_BASE = 'http://127.0.0.1:8000/api';
const BLOCKED_STATUSES = new Set(['blocked', 'closed', 'impassable', 'failed', 'out_of_service']);

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined).map(String))];
}

function displayMetric(value, unit) {
  if (value === null || value === undefined) return 'No path';
  if (unit === 'meters') {
    return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`;
  }
  return `${Number(value).toFixed(1)} min`;
}

function readinessLabel(status) {
  return {
    no_data: 'No mapped data',
    incomplete_network: 'Incomplete network',
    imported_unverified: 'Imported · experimental',
    simulation_ready_sample: 'Simulation-ready sample',
    field_verified: 'Field verified',
  }[status] || 'Not validated';
}

function readinessTone(status) {
  if (status === 'field_verified' || status === 'simulation_ready_sample') return 'green';
  if (status === 'imported_unverified') return 'orange';
  return 'red';
}

export default function SimulationsPage({ onNavigate }) {
  const { selectedVillageId, setSelectedVillageId } = useVillageSelection();
  const [villages, setVillages] = useState([]);
  const [villageData, setVillageData] = useState(null);
  const [loadingVillage, setLoadingVillage] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [scenarioType, setScenarioType] = useState('complete_closure');
  const [simulationEnvelope, setSimulationEnvelope] = useState(null);
  const [simulationError, setSimulationError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [mapMode, setMapMode] = useState('before');
  const [activeTab, setActiveTab] = useState('simulate');
  const [repairOptionA, setRepairOptionA] = useState('');
  const [repairOptionB, setRepairOptionB] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonError, setComparisonError] = useState('');
  const [comparing, setComparing] = useState(false);
  const [history, setHistory] = useState([]);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/villages?status=active`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load registered villages.');
        return data;
      })
      .then((data) => {
        if (!Array.isArray(data)) return;
        setVillages(data);
        const selectedExists = data.some((village) => Number(village.id) === Number(selectedVillageId));
        if (!selectedExists && data.length > 0) setSelectedVillageId(data[0].id);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.message);
      });
    return () => controller.abort();
  }, [selectedVillageId, setSelectedVillageId]);

  useEffect(() => {
    if (!selectedVillageId) return undefined;
    const requestedVillageId = Number(selectedVillageId);
    const controller = new AbortController();

    setLoadingVillage(true);
    setLoadError('');
    setVillageData(null);
    setSelectedEdgeId('');
    setSimulationEnvelope(null);
    setSimulationError('');
    setComparisonResult(null);
    setComparisonError('');
    setRepairOptionA('');
    setRepairOptionB('');
    setMapMode('before');

    Promise.all([
      fetch(`${API_BASE}/villages/${requestedVillageId}/network`, { signal: controller.signal }),
      fetch(`${API_BASE}/simulations?village_id=${requestedVillageId}`, { signal: controller.signal }),
    ])
      .then(async ([networkResponse, historyResponse]) => {
        const [networkData, historyData] = await Promise.all([networkResponse.json(), historyResponse.json()]);
        if (!networkResponse.ok) throw new Error(networkData.message || 'Unable to load this village network.');
        if (Number(networkData?.village?.id) !== requestedVillageId) {
          throw new Error('The server returned a different village network. Please retry.');
        }
        return { networkData, historyData: historyResponse.ok ? historyData : [] };
      })
      .then(({ networkData, historyData }) => {
        if (controller.signal.aborted) return;
        setVillageData(networkData);
        setHistory(Array.isArray(historyData) ? historyData : []);
        const firstOperational = networkData.edges?.find(
          (edge) => !BLOCKED_STATUSES.has(String(edge.status || '').toLowerCase()),
        );
        if (firstOperational) setSelectedEdgeId(String(firstOperational.id));

        const damaged = (networkData.edges || []).filter((edge) => BLOCKED_STATUSES.has(String(edge.status || '').toLowerCase()));
        if (damaged[0]) setRepairOptionA(String(damaged[0].id));
        if (damaged[1]) setRepairOptionB(String(damaged[1].id));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingVillage(false);
      });

    return () => controller.abort();
  }, [selectedVillageId]);

  const readiness = villageData?.readiness;
  const selectedEdge = villageData?.edges?.find((edge) => String(edge.id) === String(selectedEdgeId));
  const damagedEdges = useMemo(
    () => (villageData?.edges || []).filter((edge) => BLOCKED_STATUSES.has(String(edge.status || '').toLowerCase())),
    [villageData],
  );
  const result = simulationEnvelope?.result || null;
  const baselineRouteEdgeIds = useMemo(
    () => unique((result?.access_comparisons || []).flatMap((comparison) => comparison.baseline_edge_ids || [])),
    [result],
  );
  const alternativeRouteEdgeIds = useMemo(
    () => unique((result?.access_comparisons || []).flatMap((comparison) => comparison.alternative_edge_ids || [])),
    [result],
  );
  const affectedSettlementIds = useMemo(
    () => unique([
      ...(result?.isolated_settlements || []).map((settlement) => settlement.settlement_id),
      ...(result?.detour_settlements || []).map((settlement) => settlement.settlement_id),
    ]),
    [result],
  );

  const runSimulation = async () => {
    if (!selectedVillageId || !selectedEdgeId || !readiness?.can_simulate) return;
    setSimulating(true);
    setSimulationError('');
    try {
      const response = await fetch(`${API_BASE}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          village_id: Number(selectedVillageId),
          blocked_edge_ids: [Number(selectedEdgeId)],
          scenario_type: scenarioType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The simulation could not be completed.');
      if (Number(data.village_id) !== Number(selectedVillageId)) throw new Error('The simulation result belongs to a different village.');
      setSimulationEnvelope(data);
      setHistory((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setMapMode('after');
    } catch (error) {
      setSimulationError(error.message);
    } finally {
      setSimulating(false);
    }
  };

  const resetScenario = () => {
    setSimulationEnvelope(null);
    setSimulationError('');
    setComparisonResult(null);
    setComparisonError('');
    setMapMode('before');
  };

  const validateNetwork = async () => {
    if (!selectedVillageId) return;
    setValidating(true);
    try {
      const response = await fetch(`${API_BASE}/villages/${selectedVillageId}/network-readiness`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Network validation failed.');
      setVillageData((current) => (current ? { ...current, readiness: data } : current));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setValidating(false);
    }
  };

  const runComparison = async () => {
    if (!repairOptionA || !repairOptionB || repairOptionA === repairOptionB) return;
    const edgeA = damagedEdges.find((edge) => String(edge.id) === repairOptionA);
    const edgeB = damagedEdges.find((edge) => String(edge.id) === repairOptionB);
    setComparing(true);
    setComparisonError('');
    try {
      const response = await fetch(`${API_BASE}/simulations/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          village_id: Number(selectedVillageId),
          currently_blocked_edge_ids: damagedEdges.map((edge) => Number(edge.id)),
          scenario_a: { name: `Repair ${edgeA?.name || 'Option A'} first`, repair_edge_ids: [Number(repairOptionA)] },
          scenario_b: { name: `Repair ${edgeB?.name || 'Option B'} first`, repair_edge_ids: [Number(repairOptionB)] },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Repair comparison failed.');
      setComparisonResult(data);
    } catch (error) {
      setComparisonError(error.message);
    } finally {
      setComparing(false);
    }
  };

  const downloadReport = () => {
    if (!simulationEnvelope || !villageData) return;
    const report = {
      platform: 'GaunPulse — The Village That Speaks',
      village: villageData.village,
      readiness,
      simulation: simulationEnvelope,
      generated_at: new Date().toISOString(),
      disclaimer: 'Decision-support output only. Field inspection and authorized municipal review remain required.',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gaunpulse-simulation-${simulationEnvelope.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const reopenHistory = (simulation) => {
    setSimulationEnvelope(simulation);
    setSelectedEdgeId(String(simulation.failed_edge_id || simulation.blocked_edge_ids?.[0] || ''));
    setMapMode('after');
    setActiveTab('simulate');
  };

  const openRelatedIssue = () => {
    const related = villageData?.issues?.find((issue) => String(issue.edge_id) === String(selectedEdgeId));
    onNavigate?.(related ? `issues-alerts?issue=${related.id}` : 'issues-alerts');
  };

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Graph Intelligence Engine"
        title="Infrastructure Impact Simulator"
        description="Run evidence-backed road and bridge disruptions against the selected village’s saved MySQL graph, then inspect calculated access changes on the real mapped network."
        actions={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`button ${activeTab === 'simulate' ? 'button--primary' : 'button--secondary'}`} type="button" onClick={() => setActiveTab('simulate')}>
              <Network size={16} /> Impact Simulation
            </button>
            <button className={`button ${activeTab === 'compare' ? 'button--primary' : 'button--secondary'}`} type="button" onClick={() => setActiveTab('compare')}>
              <GitCompare size={16} /> Compare Repairs
            </button>
          </div>
        )}
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <MapPin size={22} color="#176342" />
            <div>
              <span className="eyebrow">Selected administrative context</span>
              <h3 style={{ margin: '2px 0', color: '#092d22' }}>{villageData?.village?.name || (loadingVillage ? 'Loading village…' : 'Select a village')}</h3>
              <small style={{ color: '#687c73' }}>
                {villageData?.village
                  ? `${villageData.village.municipality} · Ward ${villageData.village.ward_no || 'Not recorded'} · ${villageData.village.district}`
                  : 'No administrative record loaded'}
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select id="village-select" aria-label="Select village" value={selectedVillageId || ''} onChange={(event) => setSelectedVillageId(event.target.value)} style={{ padding: '9px 12px', border: '1px solid #cad7cf', borderRadius: 8, background: '#fff' }}>
              {deduplicateVillages(villages).map((village) => <option key={village.id} value={village.id}>{formatVillageLabel(village)}</option>)}
            </select>
            {readiness && <StatusBadge tone={readinessTone(readiness.status)}>{readinessLabel(readiness.status)}</StatusBadge>}
          </div>
        </div>
        {readiness && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8e3', display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 11.5, color: '#587066' }}>
            <span><strong>Source:</strong> {readiness.source?.join(', ') || 'Not recorded'}</span>
            <span><strong>Updated:</strong> {readiness.last_updated_at ? new Date(readiness.last_updated_at).toLocaleString() : 'Not recorded'}</span>
            <span><strong>Graph:</strong> {readiness.graph_version}</span>
            <span><strong>Routing:</strong> {readiness.routing_metric === 'distance_meters' ? 'Mapped distance' : 'Stored travel time'}</span>
          </div>
        )}
      </Card>

      {loadError && <FeatureNotice title="Village network could not be loaded" icon={AlertCircle}>{loadError}</FeatureNotice>}
      {loadingVillage && <Card><div style={{ padding: 36, textAlign: 'center' }}><Loader2 className="animate-spin" size={24} /> Loading the selected village graph…</div></Card>}

      {!loadingVillage && readiness && !readiness.can_simulate && (
        <Card>
          <CardHeader eyebrow="Network readiness" title={readinessLabel(readiness.status)} description="The simulator will not substitute another village or fictional graph." />
          <div style={{ padding: 16, background: '#fff5f2', border: '1px solid #f0b4a8', borderRadius: 10 }}>
            {readiness.errors.map((error) => <p key={error} style={{ margin: '5px 0', color: '#9f2f2f' }}><TriangleAlert size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />{error}</p>)}
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="button button--secondary" type="button" onClick={() => onNavigate?.('village-data')}><Wrench size={15} /> Add infrastructure</button>
            <button className="button button--secondary" type="button" onClick={() => onNavigate?.('village-map')}><MapPin size={15} /> Import geographic data</button>
            <button className="button button--primary" type="button" onClick={validateNetwork} disabled={validating}>{validating ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Validate Network</button>
          </div>
        </Card>
      )}

      {!loadingVillage && readiness?.can_simulate && activeTab === 'simulate' && (
        <div className="simulator-grid">
          <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <Card>
              <CardHeader eyebrow="Scenario parameters" title="Simulation Controls" description="Only infrastructure saved under the selected village is available." />
              <div className="form-stack">
                <label htmlFor="edge-select"><strong>Road or bridge</strong></label>
                <select id="edge-select" value={selectedEdgeId} onChange={(event) => { setSelectedEdgeId(event.target.value); resetScenario(); }}>
                  {(villageData?.edges || []).map((edge) => <option key={edge.id} value={edge.id}>{edge.name} · {edge.infrastructure_type || edge.type}</option>)}
                </select>
                {selectedEdge && (
                  <div style={{ padding: 11, background: '#f2f7f3', borderRadius: 9, fontSize: 12 }}>
                    <div><strong>Status:</strong> {selectedEdge.status}</div>
                    <div><strong>Source:</strong> {selectedEdge.provenance_source || 'Not recorded'} · {selectedEdge.verification_status || 'unverified'}</div>
                    <div><strong>Weight:</strong> {readiness.routing_metric === 'distance_meters' ? displayMetric(selectedEdge.length_meters, 'meters') : displayMetric(selectedEdge.travel_minutes, 'minutes')}</div>
                  </div>
                )}
                <label htmlFor="scenario-select"><strong>Failure scenario</strong></label>
                <select id="scenario-select" value={scenarioType} onChange={(event) => setScenarioType(event.target.value)}>
                  <option value="complete_closure">Complete infrastructure closure</option>
                  <option value="monsoon_flood">Monsoon flood · complete closure</option>
                  <option value="landslide">Landslide · complete closure</option>
                  <option value="structural_closure">Structural safety closure</option>
                </select>
                <small style={{ color: '#687c73' }}>Partial restriction is disabled because this graph has no verified capacity model.</small>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="button button--primary" type="button" onClick={runSimulation} disabled={simulating || !selectedEdgeId}>
                    {simulating ? <Loader2 className="animate-spin" size={16} /> : <Network size={16} />} {simulating ? 'Computing…' : 'Run Simulation'}
                  </button>
                  <button className="button button--secondary" type="button" onClick={resetScenario}><RefreshCw size={15} /> Reset</button>
                  <button className="button button--secondary" type="button" onClick={validateNetwork} disabled={validating}><CheckCircle2 size={15} /> Validate</button>
                </div>
                {simulationError && <div className="inline-error"><AlertCircle size={15} /> {simulationError}</div>}
              </div>
            </Card>

            {readiness.experimental && (
              <FeatureNotice title="Experimental result" icon={ShieldAlert}>
                Imported or unverified graph records are technically routable, but results are not field-confirmed outcomes.
              </FeatureNotice>
            )}

            {result && (
              <Card>
                <CardHeader eyebrow="Calculated impact" title="Outcome Summary" />
                <div className="simulation-kpis">
                  <div><span>Affected households</span><strong>{result.household_estimate_complete ? result.affected_households : 'Unknown'}</strong>{!result.household_estimate_complete && <small>{result.affected_households} known subtotal</small>}</div>
                  <div><span>Disconnected settlements</span><strong>{result.isolated_settlements?.length || 0}</strong></div>
                  <div><span>Detour settlements</span><strong>{result.detour_settlements?.length || 0}</strong></div>
                  <div><span>Facilities affected</span><strong>{result.essential_facilities_affected?.length || 0}</strong></div>
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#334b42' }}>{result.summary_explanation}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="button button--secondary" type="button" onClick={downloadReport}><Download size={15} /> Generate Report</button>
                  <button className="button button--secondary" type="button" onClick={openRelatedIssue}><AlertCircle size={15} /> Open Related Issue</button>
                </div>
              </Card>
            )}
          </div>

          <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
            <Card>
              <CardHeader
                eyebrow="Stored geographic network"
                title={`${mapMode === 'before' ? 'Before' : 'After'} Simulation`}
                description={mapMode === 'before' ? 'Operational baseline routes use stored graph links.' : 'Failed infrastructure is red; calculated alternative route links are amber.'}
                action={result && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`button ${mapMode === 'before' ? 'button--primary' : 'button--secondary'}`} type="button" onClick={() => setMapMode('before')}>Before</button>
                    <button className={`button ${mapMode === 'after' ? 'button--primary' : 'button--secondary'}`} type="button" onClick={() => setMapMode('after')}>After</button>
                  </div>
                )}
              />
              <InteractiveVillageMap
                villageData={villageData}
                highlightedEdgeIds={mapMode === 'after' && result ? result.blocked_edge_ids : []}
                baselineRouteEdgeIds={mapMode === 'before' && result ? baselineRouteEdgeIds : []}
                alternativeRouteEdgeIds={mapMode === 'after' && result ? alternativeRouteEdgeIds : []}
                affectedSettlementIds={mapMode === 'after' && result ? affectedSettlementIds : []}
                highlightedStatus="blocked"
                selectedEdgeId={selectedEdgeId}
                onSelectEdge={(edge) => { setSelectedEdgeId(String(edge.id)); resetScenario(); }}
                requireStoredGeometry
                height="470px"
              />
            </Card>

            {result && (
              <Card>
                <CardHeader eyebrow="Before and after" title="Settlement Access Evidence" description={`Routes are measured in ${result.unit}; no travel minutes are invented when only distance is available.`} />
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>Settlement</th><th>Facility</th><th>Before</th><th>After</th><th>Status</th><th>Evidence path</th></tr></thead>
                    <tbody>
                      {(result.access_comparisons || []).map((comparison) => (
                        <tr key={`${comparison.settlement_id}-${comparison.facility_id}`}>
                          <td><strong>{comparison.settlement}</strong></td>
                          <td>{comparison.facility}<br /><small>{comparison.facility_type}</small></td>
                          <td>{displayMetric(comparison.before_value, comparison.unit)}</td>
                          <td>{displayMetric(comparison.after_value, comparison.unit)}</td>
                          <td><StatusBadge tone={comparison.status === 'unreachable' ? 'red' : comparison.status === 'detour' ? 'orange' : 'green'}>{comparison.status.replace('_', ' ')}</StatusBadge></td>
                          <td><small>{comparison.status === 'unreachable' ? 'No post-failure path' : (comparison.alternative_path || comparison.baseline_path || []).join(' → ')}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {!loadingVillage && readiness?.can_simulate && activeTab === 'compare' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <Card>
            <CardHeader eyebrow="What If We Fix This First?" title="Repair Comparison" description="Compare two links currently recorded as damaged or blocked. Cost remains unavailable unless a verified source is stored." />
            {damagedEdges.length < 2 ? (
              <FeatureNotice title="Two damaged links are required" icon={TriangleAlert}>
                This village currently has {damagedEdges.length} blocked link(s). Record at least two damaged roads or bridges in Village Data Manager before comparing repairs.
              </FeatureNotice>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                <label style={{ flex: 1, minWidth: 230 }}><strong>Repair option A</strong><select value={repairOptionA} onChange={(event) => setRepairOptionA(event.target.value)} style={{ width: '100%', marginTop: 6 }}>{damagedEdges.map((edge) => <option key={edge.id} value={edge.id}>{edge.name}</option>)}</select></label>
                <label style={{ flex: 1, minWidth: 230 }}><strong>Repair option B</strong><select value={repairOptionB} onChange={(event) => setRepairOptionB(event.target.value)} style={{ width: '100%', marginTop: 6 }}>{damagedEdges.map((edge) => <option key={edge.id} value={edge.id}>{edge.name}</option>)}</select></label>
                <button className="button button--primary" type="button" onClick={runComparison} disabled={comparing || repairOptionA === repairOptionB}>{comparing ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />} Compare</button>
              </div>
            )}
            {comparisonError && <div className="inline-error"><AlertCircle size={15} /> {comparisonError}</div>}
          </Card>
          {comparisonResult && (
            <Card>
              <CardHeader eyebrow="Calculated comparison" title="Repair Outcomes" description={comparisonResult.comparison_summary} />
              <div className="repair-grid">
                {[comparisonResult.scenario_a, comparisonResult.scenario_b].map((scenario) => (
                  <div key={scenario.scenario_name} className="repair-option-card">
                    <h3>{scenario.scenario_name}</h3>
                    <p><span>Households regaining access</span><strong>{scenario.households_regaining_access}</strong></p>
                    <p><span>Facilities restored</span><strong>{scenario.facilities_restored}</strong></p>
                    <p><span>Routes restored</span><strong>{scenario.restored_routes_count}</strong></p>
                    <p><span>Route improvement</span><strong>{displayMetric(scenario.route_improvement_value, scenario.route_improvement_unit)}</strong></p>
                    <p><span>Remaining affected households</span><strong>{scenario.remaining_affected_households}</strong></p>
                    <p><span>Cost</span><strong>Unavailable</strong></p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#687c73' }}>{comparisonResult.recommendation_note}</p>
            </Card>
          )}
        </div>
      )}

      {villageData && (
        <Card>
          <CardHeader eyebrow="Saved calculations" title="Simulation History" description="Reopen prior results; an older graph badge means the village network changed after calculation." action={<History size={18} />} />
          {history.length === 0 ? <p style={{ color: '#687c73' }}>No saved simulations for this village yet.</p> : (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>ID</th><th>Scenario</th><th>Calculated</th><th>Verification</th><th>Graph</th><th>Action</th></tr></thead>
                <tbody>{history.map((simulation) => (
                  <tr key={simulation.id}>
                    <td>#{simulation.id}</td>
                    <td>{simulation.scenario_type?.replaceAll('_', ' ') || 'complete closure'}</td>
                    <td>{simulation.created_at ? new Date(simulation.created_at).toLocaleString() : 'Unknown'}</td>
                    <td>{simulation.verification_level || 'legacy result'}</td>
                    <td>{simulation.is_graph_outdated ? <StatusBadge tone="orange">Older graph</StatusBadge> : <StatusBadge tone="green">Current</StatusBadge>}</td>
                    <td><button className="button button--secondary" type="button" onClick={() => reopenHistory(simulation)}><Eye size={14} /> Reopen</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
