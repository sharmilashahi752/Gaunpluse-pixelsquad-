import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GitCompare,
  HardHat,
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
  Sliders,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import InteractiveVillageMap from '../components/InteractiveVillageMap';
import { Card, CardHeader, DemoLabel, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';

export default function SimulationsPage() {
  const [activeTab, setActiveTab] = useState('simulate'); // 'simulate' or 'compare'
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(1);
  const [villageData, setVillageData] = useState(null);
  const [loadingVillage, setLoadingVillage] = useState(false);

  // Simulation state
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [closureScenario, setClosureScenario] = useState('monsoon_flood');
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState(null);

  // Repair comparison state ("What If We Fix This First?")
  const [repairOptionA, setRepairOptionA] = useState('');
  const [repairOptionB, setRepairOptionB] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  // Load villages on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/villages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVillages(data);
          setSelectedVillageId(data[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load villages from API:', err);
      });
  }, []);

  // Load selected village network
  useEffect(() => {
    if (!selectedVillageId) return;
    setLoadingVillage(true);
    fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`)
      .then((res) => res.json())
      .then((data) => {
        setVillageData(data);
        if (data.edges && data.edges.length > 0) {
          // Default to first bridge or first edge
          const bridge = data.edges.find((e) => (e.infrastructure_type || e.type) === 'bridge') || data.edges[0];
          setSelectedEdgeId(bridge.id);
          // Set repair defaults
          setRepairOptionA(bridge.id);
          const secondEdge = data.edges.find((e) => e.id !== bridge.id) || data.edges[0];
          setRepairOptionB(secondEdge.id);
        }
        setLoadingVillage(false);
      })
      .catch((err) => {
        console.error('Failed to load village network:', err);
        setLoadingVillage(false);
      });
  }, [selectedVillageId]);

  // Run Impact Simulation
  const handleRunSimulation = async () => {
    if (!selectedEdgeId || !selectedVillageId) return;
    setSimulating(true);
    setSimulationError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          village_id: Number(selectedVillageId),
          blocked_edge_ids: [Number(selectedEdgeId)],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Simulation failed to compute.');
      }
      setSimulationResult(data.result);
    } catch (err) {
      setSimulationError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Reset Simulation
  const handleReset = () => {
    setSimulationResult(null);
    setSimulationError(null);
  };

  // Run Repair Comparison ("What If We Fix This First?")
  const handleRunComparison = async () => {
    if (!repairOptionA || !repairOptionB || !selectedVillageId) return;
    setComparing(true);
    setComparisonError(null);

    const edgeA = villageData?.edges?.find((e) => String(e.id) === String(repairOptionA));
    const edgeB = villageData?.edges?.find((e) => String(e.id) === String(repairOptionB));

    try {
      const response = await fetch('http://127.0.0.1:8000/api/simulations/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          village_id: Number(selectedVillageId),
          currently_blocked_edge_ids: [Number(repairOptionA), Number(repairOptionB)],
          scenario_a: {
            name: `Repair ${edgeA?.name || 'Option A'} First`,
            repair_edge_ids: [Number(repairOptionA)],
          },
          scenario_b: {
            name: `Repair ${edgeB?.name || 'Option B'} First`,
            repair_edge_ids: [Number(repairOptionB)],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Comparison failed to compute.');
      }
      setComparisonResult(data);
    } catch (err) {
      setComparisonError(err.message);
    } finally {
      setComparing(false);
    }
  };

  const selectedEdge = villageData?.edges?.find((e) => String(e.id) === String(selectedEdgeId));
  const blockedIdsForMap = simulationResult?.blocked_edge_ids || (selectedEdgeId ? [selectedEdgeId] : []);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Graph Intelligence Engine"
        title="Infrastructure Impact Simulator"
        description="Run graph-theoretic simulations on rural lifeline networks using NetworkX. Calculate baseline journeys, isolate broken links, measure affected households without double counting, and compare repair interventions."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`button ${activeTab === 'simulate' ? 'button--primary' : 'button--secondary'}`}
              type="button"
              onClick={() => setActiveTab('simulate')}
            >
              <Network size={16} /> Impact Simulation
            </button>
            <button
              className={`button ${activeTab === 'compare' ? 'button--primary' : 'button--secondary'}`}
              type="button"
              onClick={() => setActiveTab('compare')}
            >
              <GitCompare size={16} /> What If We Fix This First?
            </button>
          </div>
        }
      />

      <FeatureNotice title="Calculated from NetworkX Graph Algorithm" icon={Network}>
        All numbers are computed from nodes and edges in the village lifeline network. Fictional demonstration data is separated from verified real-world records.
      </FeatureNotice>

      {/* Village Selector & Context Banner */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={20} color="#176342" />
            <div>
              <span className="eyebrow" style={{ fontSize: '10px' }}>Municipal Context</span>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22' }}>
                {villageData?.village?.name || 'Loading Village...'}
              </h3>
              <small style={{ color: '#687c73' }}>
                {villageData?.village?.municipality || 'Helambu Rural Municipality'} · Ward {villageData?.village?.ward_no || '4'}, {villageData?.village?.district || 'Sindhupalchok'}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="village-select" style={{ fontSize: '12px', fontWeight: 'bold', color: '#19392f' }}>
              Select Village:
            </label>
            <select
              id="village-select"
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #dfe6df',
                background: '#fff',
                fontSize: '12.5px',
                fontWeight: '600',
              }}
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>
            <DemoLabel compact />
          </div>
        </div>
      </Card>

      {activeTab === 'simulate' ? (
        /* TAB 1: FAILURE IMPACT SIMULATION */
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '22px', alignItems: 'start' }}>
          {/* Controls Column */}
          <div style={{ display: 'grid', gap: '20px' }}>
            <Card>
              <CardHeader
                eyebrow="Scenario parameters"
                title="Simulation Controls"
                description="Select an infrastructure link to simulate failure."
              />

              <div className="form-stack">
                <label htmlFor="edge-select" style={{ fontWeight: 'bold' }}>
                  Target Road or Bridge:
                </label>
                <select
                  id="edge-select"
                  value={selectedEdgeId}
                  onChange={(e) => {
                    setSelectedEdgeId(e.target.value);
                    setSimulationResult(null);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #dfe6df',
                    background: '#fff',
                  }}
                >
                  {villageData?.edges?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.infrastructure_type || e.type || 'road'})
                    </option>
                  ))}
                </select>

                {selectedEdge && (
                  <div style={{ padding: '10px', background: '#f1f8f2', borderRadius: '8px', border: '1px solid #dfe6df', fontSize: '11.5px', color: '#19392f' }}>
                    <p style={{ margin: '2px 0' }}><strong>Asset Code:</strong> {selectedEdge.edge_code || selectedEdge.id}</p>
                    <p style={{ margin: '2px 0' }}><strong>Current Status:</strong> <StatusBadge tone={selectedEdge.status === 'blocked' ? 'red' : 'green'}>{selectedEdge.status || 'operational'}</StatusBadge></p>
                    {selectedEdge.length_meters && <p style={{ margin: '2px 0' }}><strong>Length:</strong> {selectedEdge.length_meters}m</p>}
                    {selectedEdge.notes && <p style={{ margin: '4px 0 0', color: '#687c73', fontStyle: 'italic' }}>{selectedEdge.notes}</p>}
                  </div>
                )}

                <label htmlFor="scenario-type" style={{ fontWeight: 'bold' }}>
                  Disruption Scenario:
                </label>
                <select
                  id="scenario-type"
                  value={closureScenario}
                  onChange={(e) => setClosureScenario(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #dfe6df',
                    background: '#fff',
                  }}
                >
                  <option value="monsoon_flood">Monsoon Flash Flood / Cable Scour (Complete Blockage)</option>
                  <option value="landslide">Landslide Debris Slide (Impassable to transport)</option>
                  <option value="structural_timber">Timber Deck Degradation (Safety Closure)</option>
                </select>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={simulating || !selectedEdgeId}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {simulating ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Computing...
                      </>
                    ) : (
                      <>
                        <Network size={16} /> Run Impact Simulation
                      </>
                    )}
                  </button>
                  {simulationResult && (
                    <button className="button button--secondary" type="button" onClick={handleReset} title="Reset">
                      <RefreshCw size={15} />
                    </button>
                  )}
                </div>

                {simulationError && (
                  <div style={{ padding: '10px', background: '#fde9e5', border: '1px solid #c94b46', borderRadius: '8px', color: '#c94b46', fontSize: '12px' }}>
                    <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {simulationError}
                  </div>
                )}
              </div>
            </Card>

            {/* Simulation KPI Summary Cards (When result available) */}
            {simulationResult && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Card style={{ background: '#fff', padding: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#687c73', fontWeight: 'bold' }}>Affected Households</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: simulationResult.affected_households > 0 ? '#c94b46' : '#176342', margin: '4px 0' }}>
                    {simulationResult.affected_households}
                  </div>
                  <small style={{ color: '#687c73', fontSize: '10px' }}>Without double-counting</small>
                </Card>

                <Card style={{ background: '#fff', padding: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#687c73', fontWeight: 'bold' }}>Isolated Settlements</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: simulationResult.isolated_settlements?.length > 0 ? '#c94b46' : '#248157', margin: '4px 0' }}>
                    {simulationResult.isolated_settlements?.length || 0}
                  </div>
                  <small style={{ color: '#687c73', fontSize: '10px' }}>Zero essential access</small>
                </Card>

                <Card style={{ background: '#fff', padding: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#687c73', fontWeight: 'bold' }}>Detour Settlements</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: simulationResult.detour_settlements?.length > 0 ? '#e98535' : '#248157', margin: '4px 0' }}>
                    {simulationResult.detour_settlements?.length || 0}
                  </div>
                  <small style={{ color: '#687c73', fontSize: '10px' }}>Longer route remains</small>
                </Card>

                <Card style={{ background: '#fff', padding: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#687c73', fontWeight: 'bold' }}>Facilities Impacted</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#19392f', margin: '4px 0' }}>
                    {simulationResult.essential_facilities_affected?.length || 0}
                  </div>
                  <small style={{ color: '#687c73', fontSize: '10px' }}>School / Health / Water</small>
                </Card>
              </div>
            )}
          </div>

          {/* Visualization & Journey Comparison Column */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Interactive Leaflet Map */}
            <Card>
              <CardHeader
                eyebrow="Spatial topology"
                title="Village Lifeline Network Map"
                description={
                  simulationResult
                    ? `Showing calculated disruption impact of ${selectedEdge?.name || 'Selected Edge'}.`
                    : 'Click roads or bridges to select them for simulation, or run the scenario on the left.'
                }
                action={<DemoLabel compact />}
              />
              <InteractiveVillageMap
                villageData={villageData}
                highlightedEdgeIds={blockedIdsForMap}
                highlightedStatus="blocked"
                selectedEdgeId={selectedEdgeId}
                onSelectEdge={(edge) => {
                  setSelectedEdgeId(edge.id);
                  setSimulationResult(null);
                }}
                height="440px"
              />
            </Card>

            {/* Calculated Results Detailed Breakdown */}
            {simulationResult ? (
              <Card>
                <CardHeader
                  eyebrow="Computed Access Impact"
                  title="Journey Comparison Table"
                  description="Exact shortest-path travel time changes calculated by NetworkX."
                />

                {/* Explanation Banner */}
                <div style={{ padding: '12px 16px', background: '#fdf8f0', border: '1px solid #f29b4b', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Info size={18} color="#c2410c" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '12.5px', color: '#7c2d12', lineHeight: '1.45' }}>
                      <strong>Algorithm Explanation:</strong> {simulationResult.summary_explanation}
                    </div>
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Settlement</th>
                        <th>Essential Facility</th>
                        <th>Baseline Time</th>
                        <th>Post-Failure Time</th>
                        <th>Impact Status</th>
                        <th>Path Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.access_comparisons?.map((comp, idx) => {
                        const isUnreachable = comp.status === 'unreachable';
                        const isDetour = comp.status === 'detour';
                        const isUnchanged = comp.status === 'unchanged';

                        return (
                          <tr key={`comp-${idx}`}>
                            <td>
                              <strong>{comp.settlement}</strong>
                            </td>
                            <td>
                              <strong>{comp.facility}</strong>
                              <small style={{ display: 'block', color: '#687c73' }}>
                                {comp.facility_type?.toUpperCase()}
                              </small>
                            </td>
                            <td>
                              {comp.before_minutes !== null ? `${comp.before_minutes} min` : 'Unmapped'}
                            </td>
                            <td>
                              {isUnreachable ? (
                                <strong style={{ color: '#c94b46' }}>No Path</strong>
                              ) : comp.after_minutes !== null ? (
                                <strong>{comp.after_minutes} min</strong>
                              ) : (
                                'None'
                              )}
                            </td>
                            <td>
                              <StatusBadge
                                tone={isUnreachable ? 'red' : isDetour ? 'orange' : 'green'}
                              >
                                {isUnreachable
                                  ? 'Unreachable'
                                  : isDetour
                                  ? `Detour (+${comp.travel_time_change} min)`
                                  : 'Unchanged'}
                              </StatusBadge>
                            </td>
                            <td style={{ fontSize: '11px', color: '#64748b', maxWidth: '280px' }}>
                              {isUnreachable ? (
                                <span style={{ color: '#c94b46' }}>Isolated from destination</span>
                              ) : isDetour ? (
                                <span>Alt: {Array.isArray(comp.alternative_path) ? comp.alternative_path.join(' → ') : (comp.alternative_path || 'Detour available')}</span>
                              ) : (
                                <span>Route: {Array.isArray(comp.baseline_path) ? comp.baseline_path.join(' → ') : (comp.baseline_path || 'Direct path')}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card style={{ textAlign: 'center', padding: '36px 20px', background: '#faf9f5' }}>
                <Network size={36} color="#248157" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', color: '#092d22' }}>Ready to Simulate Network Disruption</h3>
                <p style={{ color: '#687c73', maxWidth: '520px', margin: '0 auto 18px', fontSize: '13px' }}>
                  Select an infrastructure link on the left or click directly on any road or bridge in the map above, then click <strong>"Run Impact Simulation"</strong> to calculate before-and-after travel journeys.
                </p>
                <button className="button button--primary" type="button" onClick={handleRunSimulation} disabled={simulating}>
                  Run Simulation on {selectedEdge?.name || 'Selected Bridge'}
                </button>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: "WHAT IF WE FIX THIS FIRST?" REPAIR COMPARISON */
        <div style={{ display: 'grid', gap: '22px' }}>
          <Card>
            <CardHeader
              eyebrow="Municipal Decision Support"
              title="What If We Fix This First?"
              description="Compare two competing repair interventions side-by-side to determine which restores the greatest community lifeline access."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
              <div>
                <label htmlFor="repair-a" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#19392f', marginBottom: '6px' }}>
                  Option A (Intervention 1):
                </label>
                <select
                  id="repair-a"
                  value={repairOptionA}
                  onChange={(e) => setRepairOptionA(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df', background: '#fff' }}
                >
                  {villageData?.edges?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.infrastructure_type || e.type || 'road'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="repair-b" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#19392f', marginBottom: '6px' }}>
                  Option B (Intervention 2):
                </label>
                <select
                  id="repair-b"
                  value={repairOptionB}
                  onChange={(e) => setRepairOptionB(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df', background: '#fff' }}
                >
                  {villageData?.edges?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.infrastructure_type || e.type || 'road'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="button button--primary"
                type="button"
                onClick={handleRunComparison}
                disabled={comparing || !repairOptionA || !repairOptionB}
                style={{ height: '42px', padding: '0 24px' }}
              >
                {comparing ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />}
                Compare Repair Outcomes
              </button>
            </div>

            {comparisonError && (
              <div style={{ marginTop: '16px', padding: '10px', background: '#fde9e5', border: '1px solid #c94b46', borderRadius: '8px', color: '#c94b46', fontSize: '12px' }}>
                <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {comparisonError}
              </div>
            )}
          </Card>

          {/* Comparison Side-by-Side Results */}
          {comparisonResult && (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Summary Banner */}
              <div style={{ padding: '16px 20px', background: '#f1f8f2', border: '1.5px solid #248157', borderRadius: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={22} color="#176342" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ margin: '0 0 4px', color: '#092d22', fontSize: '15px' }}>
                      Comparative Decision Summary
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#19392f', lineHeight: '1.5' }}>
                      {comparisonResult.comparison_summary}
                    </p>
                    <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#475569', fontStyle: 'italic' }}>
                      ⚖️ <strong>Decision Protocol:</strong> {comparisonResult.recommendation_note}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
                {/* Scenario A Card */}
                <Card style={{ border: '2px solid #248157' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="eyebrow" style={{ color: '#176342' }}>Option A</span>
                    <StatusBadge tone="green">Intervention 1</StatusBadge>
                  </div>
                  <h3 style={{ margin: '0 0 16px', color: '#092d22', fontSize: '17px' }}>
                    {comparisonResult.scenario_a?.scenario_name}
                  </h3>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Households Regaining Access:</span>
                      <strong style={{ fontSize: '15px', color: '#176342' }}>
                        {comparisonResult.scenario_a?.households_regaining_access} HH
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Facilities Restored:</span>
                      <strong style={{ fontSize: '15px', color: '#092d22' }}>
                        {comparisonResult.scenario_a?.facilities_restored} facility(ies)
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Travel Time Saved:</span>
                      <strong style={{ fontSize: '15px', color: '#092d22' }}>
                        {comparisonResult.scenario_a?.travel_time_improvement_minutes} min saved
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Remaining Disconnected Routes:</span>
                      <strong style={{ fontSize: '15px', color: comparisonResult.scenario_a?.unreachable_routes_count > 0 ? '#c94b46' : '#248157' }}>
                        {comparisonResult.scenario_a?.unreachable_routes_count} routes
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Cost Status:</span>
                      <small style={{ color: '#687c73', fontStyle: 'italic' }}>
                        {comparisonResult.cost_status}
                      </small>
                    </div>
                  </div>
                </Card>

                {/* Scenario B Card */}
                <Card style={{ border: '2px solid #e98535' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="eyebrow" style={{ color: '#e98535' }}>Option B</span>
                    <StatusBadge tone="orange">Intervention 2</StatusBadge>
                  </div>
                  <h3 style={{ margin: '0 0 16px', color: '#092d22', fontSize: '17px' }}>
                    {comparisonResult.scenario_b?.scenario_name}
                  </h3>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Households Regaining Access:</span>
                      <strong style={{ fontSize: '15px', color: '#176342' }}>
                        {comparisonResult.scenario_b?.households_regaining_access} HH
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Facilities Restored:</span>
                      <strong style={{ fontSize: '15px', color: '#092d22' }}>
                        {comparisonResult.scenario_b?.facilities_restored} facility(ies)
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Travel Time Saved:</span>
                      <strong style={{ fontSize: '15px', color: '#092d22' }}>
                        {comparisonResult.scenario_b?.travel_time_improvement_minutes} min saved
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Remaining Disconnected Routes:</span>
                      <strong style={{ fontSize: '15px', color: comparisonResult.scenario_b?.unreachable_routes_count > 0 ? '#c94b46' : '#248157' }}>
                        {comparisonResult.scenario_b?.unreachable_routes_count} routes
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f5ed', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#687c73' }}>Cost Status:</span>
                      <small style={{ color: '#687c73', fontStyle: 'italic' }}>
                        {comparisonResult.cost_status}
                      </small>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
