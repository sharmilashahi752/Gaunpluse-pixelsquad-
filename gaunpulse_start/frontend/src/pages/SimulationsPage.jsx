import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  Footprints,
  GitCompare,
  Globe,
  HeartPulse,
  History,
  Info,
  Loader2,
  MapPin,
  Network,
  RefreshCw,
  Route,
  School,
  ShieldAlert,
  TriangleAlert,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import InteractiveVillageMap from '../components/InteractiveVillageMap';
import { Card, CardHeader, FeatureNotice, LiveLabel, PageIntro, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { cachedFetchJson } from '../utils/apiCache';
import {
  DEMO_SCENARIO_PRESETS,
  getSundarGaunNetworkData,
  runSundarGaunSimulation,
  compareSundarGaunRepairs,
  SUNDAR_GAUN_METADATA,
} from '../data/sundarGaunDemo';

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const BLOCKED_STATUSES = new Set(['blocked', 'closed', 'impassable', 'failed', 'out_of_service', 'critical']);

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined).map(String))];
}

function displayMetric(value, unit) {
  if (value === null || value === undefined) return 'No path (Isolated)';
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
    fictional_demonstration_model: 'Demonstration model',
  }[status] || 'Not validated';
}

function readinessTone(status) {
  if (status === 'field_verified' || status === 'simulation_ready_sample') return 'green';
  if (status === 'imported_unverified' || status === 'fictional_demonstration_model') return 'orange';
  return 'red';
}

export default function SimulationsPage({ onNavigate }) {
  const auth = useAuth();
  const isSystemAdmin = auth?.isSystemAdmin ?? false;
  const activeMunicipalityId = auth?.activeMunicipalityId ?? null;
  const switchMunicipality = auth?.switchMunicipality;

  const { selectedVillageId, setSelectedVillageId, villages: contextVillages, refreshVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [villageData, setVillageData] = useState(null);
  const [loadingVillage, setLoadingVillage] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  // Simulation Controller States
  const [scenarioPreset, setScenarioPreset] = useState('motor_bridge_failure');
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [selectedBlockedEdgeIds, setSelectedBlockedEdgeIds] = useState([]);
  const [scenarioType, setScenarioType] = useState('complete_closure');
  
  // Results & Display States
  const [simulationEnvelope, setSimulationEnvelope] = useState(null);
  const [simulationError, setSimulationError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [mapMode, setMapMode] = useState('before'); // 'before' | 'after'
  const [activeTab, setActiveTab] = useState('simulate'); // 'simulate' | 'compare'
  
  // Repair Comparison States
  const [repairOptionA, setRepairOptionA] = useState('');
  const [repairOptionB, setRepairOptionB] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonError, setComparisonError] = useState('');
  const [comparing, setComparing] = useState(false);
  
  // History & Validation
  const [history, setHistory] = useState([]);
  const [validating, setValidating] = useState(false);

  const isDemoVillage = selectedVillageId === 'demo-sundar-gaun';

  // 1. Reactively synchronize villages with VillageSelectionContext
  useEffect(() => {
    if (Array.isArray(contextVillages)) {
      setVillages(contextVillages);
    }
  }, [contextVillages]);

  // Ensure an authorized village is selected when list loads or changes
  useEffect(() => {
    if (!selectedVillageId && villages.length > 0) {
      setSelectedVillageId(villages[0].id);
    }
  }, [villages, selectedVillageId, setSelectedVillageId]);

  // 2. Load Network Graph when Selected Village Changes
  useEffect(() => {
    if (!selectedVillageId) return undefined;

    setLoadError('');
    setSimulationEnvelope(null);
    setSimulationError('');
    setComparisonResult(null);
    setComparisonError('');
    setMapMode('before');

    // Case A: Fictional Demonstration Village (Sundar Gaun)
    if (selectedVillageId === 'demo-sundar-gaun') {
      setLoadingVillage(true);
      try {
        const demoData = getSundarGaunNetworkData();
        setVillageData(demoData);
        setSelectedEdgeId('edge-bridge-b');
        setSelectedBlockedEdgeIds(['edge-bridge-b']);
        setScenarioPreset('motor_bridge_failure');
        setRepairOptionA('edge-bridge-a');
        setRepairOptionB('edge-bridge-b');
        setHistory([
          {
            id: 'demo-initial',
            scenario_type: 'complete_closure',
            scenario_name: 'Khola River Motor Bridge (BR-02) Pier Scour',
            failed_edge_id: 'edge-bridge-b',
            blocked_edge_ids: ['edge-bridge-b'],
            created_at: new Date().toISOString(),
            verification_level: 'demonstration_dataset',
            is_graph_outdated: false,
          },
        ]);
      } catch (err) {
        setLoadError('Failed to load demonstration village dataset: ' + err.message);
      } finally {
        setLoadingVillage(false);
      }
      return;
    }

    // Case B: Live Municipal Village from Backend / Database
    const requestedVillageId = Number(selectedVillageId);
    if (!Number.isInteger(requestedVillageId) || requestedVillageId <= 0) return;

    setLoadingVillage(true);
    setVillageData(null);

    Promise.all([
      cachedFetchJson(`${API_BASE}/villages/${requestedVillageId}/network`, {}, {
        ttlMs: 60000,
        onBackgroundUpdate: (fresh) => {
          if (fresh?.village?.id === requestedVillageId) setVillageData(fresh);
        },
      }),
      cachedFetchJson(`${API_BASE}/simulations?village_id=${requestedVillageId}`, {}, {
        ttlMs: 45000,
        onBackgroundUpdate: (fresh) => {
          if (Array.isArray(fresh)) setHistory(fresh);
        },
      }),
    ])
      .then(([networkData, historyData]) => {
        if (Number(networkData?.village?.id) !== requestedVillageId) {
          throw new Error('The server returned a different village network. Please retry.');
        }
        setVillageData(networkData);
        setHistory(Array.isArray(historyData) ? historyData : []);

        const firstOperational = networkData.edges?.find(
          (edge) => !BLOCKED_STATUSES.has(String(edge.status || '').toLowerCase()),
        );
        if (firstOperational) {
          setSelectedEdgeId(String(firstOperational.id));
          setSelectedBlockedEdgeIds([String(firstOperational.id)]);
        }

        const damaged = (networkData.edges || []).filter((edge) =>
          BLOCKED_STATUSES.has(String(edge.status || '').toLowerCase()),
        );
        if (damaged[0]) setRepairOptionA(String(damaged[0].id));
        if (damaged[1]) setRepairOptionB(String(damaged[1].id));
      })
      .catch((error) => {
        setLoadError(error.message || 'Village network could not be loaded.');
      })
      .finally(() => {
        setLoadingVillage(false);
      });
  }, [selectedVillageId]);

  // Derived Properties
  const readiness = villageData?.readiness;
  const isDemo = isDemoVillage || villageData?.village?.is_demo;
  const edges = villageData?.edges || [];
  const nodes = villageData?.nodes || [];
  const selectedEdge = edges.find((edge) => String(edge.id) === String(selectedEdgeId));
  const damagedEdges = useMemo(
    () => edges.filter((edge) => BLOCKED_STATUSES.has(String(edge.status || '').toLowerCase())),
    [edges],
  );

  const result = simulationEnvelope?.result || null;

  // Topological Edge Sets for Map Highlighting
  const baselineRouteEdgeIds = useMemo(
    () => unique((result?.access_comparisons || []).flatMap((c) => c.baseline_edge_ids || [])),
    [result],
  );
  const alternativeRouteEdgeIds = useMemo(
    () => unique((result?.access_comparisons || []).flatMap((c) => c.alternative_edge_ids || [])),
    [result],
  );
  const isolatedSettlementIds = useMemo(
    () => (result?.isolated_settlements || []).map((s) => String(s.settlement_id)),
    [result],
  );
  const affectedSettlementIds = useMemo(
    () => unique([
      ...isolatedSettlementIds,
      ...(result?.detour_settlements || []).map((s) => String(s.settlement_id)),
    ]),
    [result, isolatedSettlementIds],
  );

  // Scenario Preset Change Handler
  const handlePresetChange = (presetId) => {
    setScenarioPreset(presetId);
    setSimulationEnvelope(null);
    setSimulationError('');
    setMapMode('before');

    if (presetId === 'custom') {
      return;
    }

    const preset = DEMO_SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedBlockedEdgeIds(preset.blocked_edge_ids);
      setSelectedEdgeId(preset.primary_failed_edge_id);
      setScenarioType(preset.scenario_type);
    }
  };

  // Asset Dropdown Change Handler
  const handleAssetSelect = (edgeId) => {
    setSelectedEdgeId(edgeId);
    setSelectedBlockedEdgeIds([edgeId]);
    setScenarioPreset('custom');
    setSimulationEnvelope(null);
    setSimulationError('');
    setMapMode('before');
  };

  // Run Simulation Action
  const runSimulation = async () => {
    const blocked = selectedBlockedEdgeIds.length > 0 ? selectedBlockedEdgeIds : (selectedEdgeId ? [selectedEdgeId] : []);
    if (!selectedVillageId || blocked.length === 0) return;

    setSimulating(true);
    setSimulationError('');

    try {
      if (isDemo) {
        // Fast, accurate client-side Dijkstra simulation for demonstration valley
        const currentPreset = DEMO_SCENARIO_PRESETS.find((p) => p.id === scenarioPreset);
        const envelope = runSundarGaunSimulation({
          blockedEdgeIds: blocked,
          scenarioType,
          scenarioName: currentPreset?.name || `Custom Disruption (${blocked.length} link${blocked.length > 1 ? 's' : ''})`,
        });
        setSimulationEnvelope(envelope);
        setHistory((current) => [envelope, ...current.filter((item) => item.id !== envelope.id)]);
        setMapMode('after');
      } else {
        // Live backend NetworkX / Dijkstra service execution
        const token = localStorage.getItem('gaunpulse_auth_token') || localStorage.getItem('gaunpulse_citizen_token');
        const response = await fetch(`${API_BASE}/simulations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            village_id: Number(selectedVillageId),
            blocked_edge_ids: blocked.map((id) => (isNaN(id) ? id : Number(id))),
            scenario_type: scenarioType,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'The simulation could not be completed.');
        if (Number(data.village_id) !== Number(selectedVillageId)) {
          throw new Error('The simulation result belongs to a different village.');
        }

        setSimulationEnvelope(data);
        setHistory((current) => [data, ...current.filter((item) => item.id !== data.id)]);
        setMapMode('after');
      }
    } catch (error) {
      setSimulationError(error.message || 'Simulation calculation failed.');
    } finally {
      setSimulating(false);
    }
  };

  // Reset to Baseline Action
  const resetScenario = () => {
    setSimulationEnvelope(null);
    setSimulationError('');
    setComparisonResult(null);
    setComparisonError('');
    setMapMode('before');
    if (isDemo) {
      setScenarioPreset('motor_bridge_failure');
      setSelectedBlockedEdgeIds(['edge-bridge-b']);
      setSelectedEdgeId('edge-bridge-b');
    }
  };

  // Network Validation Action
  const validateNetwork = async () => {
    if (!selectedVillageId || isDemo) return;
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

  // Run Repair Comparison Action (What If We Fix This First?)
  const runComparison = async () => {
    if (!repairOptionA || !repairOptionB || repairOptionA === repairOptionB) return;

    setComparing(true);
    setComparisonError('');

    try {
      if (isDemo) {
        // Deterministic comparison between BR-01 (Footbridge) and BR-02 (Motor Bridge)
        const demoComparison = compareSundarGaunRepairs({
          optionAEdgeId: repairOptionA,
          optionBEdgeId: repairOptionB,
        });
        setComparisonResult(demoComparison);
      } else {
        const edgeA = damagedEdges.find((edge) => String(edge.id) === repairOptionA);
        const edgeB = damagedEdges.find((edge) => String(edge.id) === repairOptionB);
        const token = localStorage.getItem('gaunpulse_auth_token') || localStorage.getItem('gaunpulse_citizen_token');

        const response = await fetch(`${API_BASE}/simulations/compare`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
      }
    } catch (error) {
      setComparisonError(error.message);
    } finally {
      setComparing(false);
    }
  };

  // Download JSON Report
  const downloadReport = () => {
    if (!simulationEnvelope || !villageData) return;
    const report = {
      platform: 'GaunPulse — The Village That Speaks',
      village: villageData.village,
      readiness,
      is_demonstration_model: Boolean(isDemo),
      simulation: simulationEnvelope,
      generated_at: new Date().toISOString(),
      disclaimer: isDemo
        ? 'Fictional illustrative simulation model. Created for civic technology resilience testing.'
        : 'Decision-support output only. Field inspection and authorized municipal review remain required.',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gaunpulse-simulation-${simulationEnvelope.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // Reopen History Record
  const reopenHistory = (sim) => {
    setSimulationEnvelope(sim);
    setSelectedEdgeId(String(sim.failed_edge_id || sim.blocked_edge_ids?.[0] || ''));
    if (sim.blocked_edge_ids) setSelectedBlockedEdgeIds(sim.blocked_edge_ids);
    setMapMode('after');
    setActiveTab('simulate');
  };

  // Navigate to Related Issue
  const openRelatedIssue = () => {
    const related = villageData?.issues?.find((issue) => String(issue.edge_id) === String(selectedEdgeId));
    onNavigate?.(related ? `issues-alerts?issue=${related.id}` : 'issues-alerts');
  };

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Graph Intelligence Engine"
        title="Infrastructure Impact Simulator"
        description="Simulate the direct network effects of road and bridge disruptions on rural community access to schools, clinics, and municipal centers using graph-based shortest-path calculations."
        actions={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              <GitCompare size={16} /> Compare Repairs
            </button>
          </div>
        )}
      />

      {/* Demonstration Banner when Demo Village is Active */}
      {isDemo && (
        <div
          style={{
            background: 'linear-gradient(135deg, #093728 0%, #124b35 100%)',
            color: '#ffffff',
            padding: '14px 18px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(18,62,44,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={20} color="#86efac" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', letterSpacing: '0.2px' }}>
                Fictional Demonstration Model Active — Sundar Gaun (सुन्दर गाउँ)
              </div>
              <div style={{ fontSize: '11.5px', color: '#c3decb', marginTop: '2px' }}>
                Topological model includes Khola River Motor Bridge (BR-02), Upper Suspension Footbridge (BR-01), Tallo Basti (95 HH), Upallo Basti (120 HH), Basic School, and Health Post.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                background: '#e98535',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '4px 9px',
                borderRadius: '99px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Illustrative Training Dataset
            </span>
          </div>
        </div>
      )}

      {/* Selected Administrative Context Card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#e4f4e9',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={22} color="#176342" />
            </div>
            <div>
              <span className="eyebrow">Selected administrative context</span>
              <h3 style={{ margin: '2px 0', color: '#092d22', fontSize: '18px' }}>
                {villageData?.village?.name || (loadingVillage ? 'Loading village network…' : 'Select a village')}
              </h3>
              <small style={{ color: '#687c73' }}>
                {villageData?.village
                  ? `${villageData.village.municipality} · Ward ${villageData.village.ward_no || 'Not recorded'} · ${villageData.village.district}`
                  : 'No administrative record loaded'}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {isSystemAdmin && activeMunicipalityId && activeMunicipalityId !== 'all' && (
              <button
                type="button"
                className="button button--secondary"
                style={{ padding: '7px 11px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={() => switchMunicipality?.('all')}
                title="View all registered villages across Nepal"
              >
                <Globe size={13} /> View All Nepal
              </button>
            )}

            <select
              id="village-select"
              aria-label="Select village"
              value={selectedVillageId || ''}
              onChange={(event) => setSelectedVillageId(event.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {(() => {
                const deduped = deduplicateVillages(villages);
                const liveVillages = deduped.filter((v) => !v.is_demo);
                const demoVillages = deduped.filter((v) => v.is_demo);

                return (
                  <>
                    <optgroup label="Live Municipal Databases">
                      {liveVillages.length > 0 ? (
                        liveVillages.map((village) => (
                          <option key={village.id} value={village.id}>
                            {formatVillageLabel(village)}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No registered municipal records</option>
                      )}
                    </optgroup>
                    <optgroup label="Illustrative Simulation Models">
                      <option value="demo-sundar-gaun">
                        🌿 Sundar Gaun (Fictional Demonstration Model · Ward 3 & 4)
                      </option>
                      {demoVillages.map((village) => (
                        <option key={village.id} value={village.id}>
                          🧪 {formatVillageLabel(village)}
                        </option>
                      ))}
                    </optgroup>
                  </>
                );
              })()}
            </select>

            {readiness && (
              <StatusBadge tone={readinessTone(readiness.status)}>
                {readinessLabel(readiness.status)}
              </StatusBadge>
            )}
          </div>
        </div>

        {readiness && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8e3', display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 11.5, color: '#587066' }}>
            <span><strong>Source:</strong> {readiness.source?.join(', ') || 'Not recorded'}</span>
            <span><strong>Updated:</strong> {readiness.last_updated_at ? new Date(readiness.last_updated_at).toLocaleString() : 'Live'}</span>
            <span><strong>Graph Version:</strong> {readiness.graph_version}</span>
            <span><strong>Routing Metric:</strong> {readiness.routing_metric === 'travel_minutes' ? 'Travel duration (minutes)' : 'Mapped distance (meters)'}</span>
          </div>
        )}
      </Card>

      {/* Network Loading Error with Immediate Demo Fallback Button */}
      {loadError && (
        <FeatureNotice title="Live village network could not be loaded" icon={AlertCircle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 6px' }}>{loadError}</p>
              <small style={{ color: '#687c73' }}>
                You can switch to the pre-loaded Sundar Gaun demonstration dataset to inspect topological simulations immediately.
              </small>
            </div>
            <button
              className="button button--primary"
              type="button"
              onClick={() => setSelectedVillageId('demo-sundar-gaun')}
            >
              <Zap size={15} /> Launch Sundar Gaun Demo Model
            </button>
          </div>
        </FeatureNotice>
      )}

      {/* Loading Spinner State */}
      {loadingVillage && (
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: '#176342' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: 0 }}>Loading village infrastructure network…</h4>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#687c73' }}>
              Building topological adjacency graph from saved nodes, bridges, and road links.
            </p>
          </div>
        </Card>
      )}

      {/* Missing Graph or Unvalidated Network Notice for Incomplete Live Villages */}
      {!loadingVillage && !isDemo && (!readiness?.can_simulate || edges.length === 0) && (
        <Card>
          <CardHeader
            eyebrow="Network readiness"
            title={edges.length === 0 ? 'No Mapped Infrastructure Graph' : readinessLabel(readiness?.status)}
            description={
              edges.length === 0
                ? "This village currently does not have any mapped roads, footpaths, or bridges in its infrastructure network. Real-time topological impact simulations require at least one mapped infrastructure asset."
                : "This village's graph does not yet meet simulation criteria. You can validate the network, add missing infrastructure, or explore the Sundar Gaun demonstration dataset."
            }
          />
          <div style={{ padding: 16, background: '#fff5f2', border: '1px solid #f0b4a8', borderRadius: 10 }}>
            {edges.length === 0 ? (
              <p style={{ margin: '5px 0', color: '#9f2f2f' }}>
                <TriangleAlert size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                No road or bridge segments recorded. Without physical lifeline edges, disconnection impacts and detours cannot be simulated.
              </p>
            ) : (
              (readiness?.errors || []).map((error) => (
                <p key={error} style={{ margin: '5px 0', color: '#9f2f2f' }}>
                  <TriangleAlert size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {error}
                </p>
              ))
            )}
            {readiness?.warnings && readiness.warnings.map((warning) => (
              <p key={warning} style={{ margin: '5px 0', color: '#b45309' }}>
                <Info size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {warning}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="button button--primary" type="button" onClick={() => setSelectedVillageId('demo-sundar-gaun')}>
              <Zap size={15} /> Launch Sundar Gaun Demo Model
            </button>
            <button className="button button--secondary" type="button" onClick={() => onNavigate?.('village-data')}>
              <Wrench size={15} /> Add infrastructure
            </button>
            <button className="button button--secondary" type="button" onClick={validateNetwork} disabled={validating}>
              {validating ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Validate Network
            </button>
          </div>
        </Card>
      )}

      {/* TAB 1: IMPACT SIMULATION */}
      {!loadingVillage && (isDemo || (readiness?.can_simulate && edges.length > 0)) && activeTab === 'simulate' && (
        <div className="simulator-grid">
          {/* Left Column: Controls & Result Summary */}
          <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <Card>
              <CardHeader
                eyebrow="Resilience controls"
                title="Simulation Controller"
                description={isDemo ? 'Test resilience against 5 pre-calibrated scenario disruptions or pick any individual asset.' : 'Simulate live disruptions on this village’s mapped infrastructure.'}
              />
              <div className="form-stack">
                {/* 1. Scenario Selector */}
                {isDemo && (
                  <div>
                    <label htmlFor="preset-select" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#092d22' }}>
                      <strong>1. Scenario preset</strong>
                    </label>
                    <select
                      id="preset-select"
                      value={scenarioPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '600' }}
                    >
                      {DEMO_SCENARIO_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                      <option value="custom">Custom asset selection…</option>
                    </select>
                    {scenarioPreset !== 'custom' && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#587066', lineHeight: '1.4' }}>
                        {DEMO_SCENARIO_PRESETS.find((p) => p.id === scenarioPreset)?.description}
                      </p>
                    )}
                  </div>
                )}

                {/* 2. Infrastructure Asset Selector */}
                <div>
                  <label htmlFor="edge-select" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#092d22' }}>
                    <strong>2. Disrupted infrastructure asset</strong>
                  </label>
                  <select
                    id="edge-select"
                    value={selectedEdgeId}
                    onChange={(event) => handleAssetSelect(event.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '600' }}
                  >
                    {edges.map((edge) => (
                      <option key={edge.id} value={edge.id}>
                        {edge.name} · {edge.infrastructure_type || edge.type} {edge.edge_code ? `(${edge.edge_code})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedEdge && (
                    <div style={{ marginTop: '8px', padding: 11, background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 11.5 }}>
                      <div><strong>Asset Code:</strong> {selectedEdge.edge_code || selectedEdge.id}</div>
                      <div><strong>Type:</strong> {selectedEdge.infrastructure_type || selectedEdge.type} ({selectedEdge.surface_type || 'Gravel'})</div>
                      <div><strong>Baseline Transit:</strong> {displayMetric(selectedEdge.travel_minutes ?? selectedEdge.length_meters, readiness?.routing_metric === 'distance_meters' ? 'meters' : 'minutes')}</div>
                      {selectedEdge.notes && <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#687c73' }}>{selectedEdge.notes}</div>}
                    </div>
                  )}
                </div>

                {/* 3. Failure Mode */}
                <div>
                  <label htmlFor="scenario-type-select" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#092d22' }}>
                    <strong>3. Failure condition</strong>
                  </label>
                  <select
                    id="scenario-type-select"
                    value={scenarioType}
                    onChange={(event) => setScenarioType(event.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                  >
                    <option value="complete_closure">Complete infrastructure closure</option>
                    <option value="monsoon_flood">Monsoon flood · overtopped crossing</option>
                    <option value="landslide">Landslide · debris blockage</option>
                    <option value="structural_closure">Structural safety closure</option>
                  </select>
                </div>

                {/* 4. Action Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={runSimulation}
                    disabled={simulating || !selectedEdgeId}
                    style={{ flex: 1, minWidth: '130px' }}
                  >
                    {simulating ? <Loader2 className="animate-spin" size={15} /> : <Network size={16} />}
                    {simulating ? 'Computing…' : 'Run Simulation'}
                  </button>
                  <button className="button button--secondary" type="button" onClick={resetScenario}>
                    <RefreshCw size={15} /> Reset
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => setActiveTab('compare')}>
                    <GitCompare size={15} /> Compare Repairs
                  </button>
                </div>

                {simulating && (
                  <div className="sim-computing-status">
                    <Loader2 className="animate-spin" size={13} />
                    <span>Evaluating graph connectivity across {nodes.length} nodes &amp; {edges.length} edges…</span>
                  </div>
                )}

                {simulationError && (
                  <div className="inline-error">
                    <AlertCircle size={15} /> {simulationError}
                  </div>
                )}
              </div>
            </Card>

            {/* Calculated Results Summary KPI Card OR Baseline Telemetry */}
            {result ? (
              <div className="sim-result-reveal">
                <Card>
                  <CardHeader
                    eyebrow="Calculated impact"
                    title="Simulation Results"
                    description={result.calculation_timestamp ? `Calculated via deterministic Dijkstra algorithm at ${new Date(result.calculation_timestamp).toLocaleTimeString()}` : ''}
                    action={
                      <button
                        className="button button--secondary"
                        type="button"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => setSimulationEnvelope(null)}
                        title="Return to baseline telemetry view"
                      >
                        <Activity size={12} /> Baseline View
                      </button>
                    }
                  />
                  
                  {/* 4 Core Summary KPI Boxes */}
                  <div className="simulation-kpis">
                    <div>
                      <span>Affected households</span>
                      <strong>{result.affected_households}</strong>
                      <small>of total village</small>
                    </div>
                    <div>
                      <span>Disconnected communities</span>
                      <strong style={{ color: result.isolated_settlements?.length > 0 ? '#b91c1c' : '#166534' }}>
                        {result.isolated_settlements?.length || 0}
                      </strong>
                      <small>{result.isolated_settlements?.length > 0 ? 'Zero access to services' : 'Detours available'}</small>
                    </div>
                    <div>
                      <span>Max travel delay</span>
                      <strong style={{ color: '#d97706' }}>
                        {result.max_travel_time_increase_minutes ? `+${result.max_travel_time_increase_minutes} min` : (result.detour_settlements?.length > 0 ? 'Detour' : '0 min')}
                      </strong>
                      <small>Pedestrian detour</small>
                    </div>
                    <div>
                      <span>Alternative routes</span>
                      <strong style={{ fontSize: '14px', color: result.isolated_settlements?.length > 0 ? '#b91c1c' : '#166534' }}>
                        {result.isolated_settlements?.length > 0 ? 'Severed' : 'Operational'}
                      </strong>
                      <small>{alternativeRouteEdgeIds.length} detour link(s)</small>
                    </div>
                  </div>

                  {/* Modal Access Preservation Overview */}
                  <div style={{ background: '#f8faf9', border: '1px solid #dfe6df', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '11.5px', display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={16} color={result.motor_vehicle_access?.includes('Severed') ? '#b91c1c' : '#166534'} />
                      <div>
                        <strong>Motor Vehicle / Ambulance Access:</strong>{' '}
                        <span style={{ color: result.motor_vehicle_access?.includes('Severed') ? '#b91c1c' : '#166534', fontWeight: '600' }}>
                          {result.motor_vehicle_access || 'Assessed on network graph'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Footprints size={16} color={result.pedestrian_access?.includes('Severed') ? '#b91c1c' : '#0369a1'} />
                      <div>
                        <strong>Pedestrian Trail Access:</strong>{' '}
                        <span style={{ color: result.pedestrian_access?.includes('Severed') ? '#b91c1c' : '#0369a1', fontWeight: '600' }}>
                          {result.pedestrian_access || 'Preserved via footpath'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plain-Language Intelligence Explanation */}
                  <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#334b42', margin: '0 0 14px' }}>
                    {result.summary_explanation}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="button button--secondary" type="button" onClick={downloadReport}>
                      <Download size={15} /> Generate Report (JSON)
                    </button>
                    <button className="button button--secondary" type="button" onClick={openRelatedIssue}>
                      <AlertCircle size={15} /> Open Related Issue
                    </button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader
                  eyebrow="Network Baseline Telemetry"
                  title="Asset Inventory & Inspection"
                  description="Physical asset distribution and topology prior to simulated disruption."
                />
                <div className="sim-baseline-telemetry-grid">
                  <div className="sim-baseline-telemetry-item">
                    <span>Road Segments</span>
                    <strong>{edges.filter((e) => (e.infrastructure_type || e.type) !== 'bridge').length}</strong>
                  </div>
                  <div className="sim-baseline-telemetry-item">
                    <span>Bridges & Crossings</span>
                    <strong style={{ color: '#b45309' }}>
                      {edges.filter((e) => (e.infrastructure_type || e.type) === 'bridge').length}
                    </strong>
                  </div>
                  <div className="sim-baseline-telemetry-item">
                    <span>Public Facilities</span>
                    <strong style={{ color: '#0369a1' }}>
                      {nodes.filter((n) => ['school', 'health_post', 'health', 'clinic', 'water_point', 'water', 'facility', 'office'].includes((n.node_type || n.type || '').toLowerCase())).length}
                    </strong>
                  </div>
                  <div className="sim-baseline-telemetry-item">
                    <span>Settlements</span>
                    <strong style={{ color: '#166534' }}>
                      {nodes.filter((n) => (n.node_type || n.type) === 'settlement' || n.households > 0 || n.settlement_group_id).length}
                    </strong>
                  </div>
                </div>

                {selectedEdge ? (
                  <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#092d22', fontSize: '12px' }}>{selectedEdge.name}</strong>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>
                        OPERATIONAL
                      </span>
                    </div>
                    <div style={{ color: '#587066', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                      <div><strong>Code:</strong> {selectedEdge.edge_code || selectedEdge.id}</div>
                      <div><strong>Type:</strong> {selectedEdge.infrastructure_type || selectedEdge.type}</div>
                      <div><strong>Surface:</strong> {selectedEdge.surface_type || 'Gravel'}</div>
                      <div><strong>Baseline Transit:</strong> {displayMetric(selectedEdge.travel_minutes ?? selectedEdge.length_meters, readiness?.routing_metric === 'distance_meters' ? 'meters' : 'minutes')}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#687c73', padding: '8px 0', textAlign: 'center' }}>
                    Select a road or bridge segment to view baseline connectivity.
                  </div>
                )}

                <div style={{ padding: '8px 10px', background: '#f8faf9', border: '1px solid #dfe6df', borderRadius: '6px', fontSize: '11px', color: '#4b6357', lineHeight: '1.45' }}>
                  <strong>Simulation Guide:</strong> Select a failure condition and click <strong>Run Simulation</strong> to compute shortest paths. The engine tests alternative detours and highlights any isolated communities.
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Map & Comparative Journey Chart */}
          <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
            {/* Interactive Geographical Leaflet Map */}
            <Card>
              <CardHeader
                eyebrow="Interactive geographical map"
                title={`${mapMode === 'before' ? 'Baseline Network' : 'Disrupted Scenario'} (${mapMode === 'before' ? 'Before' : 'After'})`}
                description={
                  mapMode === 'before'
                    ? 'Green lines show operational roads and bridges. Click markers or links to inspect.'
                    : 'Failed infrastructure is RED dashed; calculated alternative detour links are AMBER dashed.'
                }
                action={
                  result && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`button ${mapMode === 'before' ? 'button--primary' : 'button--secondary'}`}
                        type="button"
                        onClick={() => setMapMode('before')}
                      >
                        Before Disruption
                      </button>
                      <button
                        className={`button ${mapMode === 'after' ? 'button--primary' : 'button--secondary'}`}
                        type="button"
                        onClick={() => setMapMode('after')}
                      >
                        After Disruption
                      </button>
                    </div>
                  )
                }
              />

              <InteractiveVillageMap
                villageData={villageData}
                highlightedEdgeIds={mapMode === 'after' && result ? (result.blocked_edge_ids || [result.failed_edge_id]) : []}
                baselineRouteEdgeIds={mapMode === 'before' && result ? baselineRouteEdgeIds : []}
                alternativeRouteEdgeIds={mapMode === 'after' && result ? alternativeRouteEdgeIds : []}
                affectedSettlementIds={mapMode === 'after' && result ? affectedSettlementIds : []}
                isolatedSettlementIds={mapMode === 'after' && result ? isolatedSettlementIds : []}
                highlightedStatus="blocked"
                selectedEdgeId={selectedEdgeId}
                onSelectEdge={(edge) => handleAssetSelect(String(edge.id))}
                height="490px"
              />
            </Card>

            {/* Comparative Journey Chart (Before vs After Disruption) */}
            {result && result.access_comparisons && result.access_comparisons.length > 0 && (
              <Card>
                <CardHeader
                  eyebrow="Comparative travel metrics"
                  title="Travel Time Comparison: Baseline vs Disrupted"
                  description={`Comparing travel duration before and after failure across all settlements and essential public facilities (${result.unit}).`}
                />

                {/* SVG/CSS Comparative Horizontal Bar Chart */}
                <div style={{ padding: '8px 0', display: 'grid', gap: '14px' }}>
                  {result.access_comparisons.map((comp) => {
                    const isIsolated = comp.status === 'unreachable';
                    const baselineVal = comp.before_value || 0;
                    const afterVal = isIsolated ? 60 : (comp.after_value || baselineVal);
                    const maxScale = Math.max(60, afterVal + 10);

                    const baselinePct = Math.min(100, (baselineVal / maxScale) * 100);
                    const afterPct = Math.min(100, (afterVal / maxScale) * 100);

                    return (
                      <div
                        key={`${comp.settlement_id}-${comp.facility_id}`}
                        style={{
                          background: 'var(--surface-subtle)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#092d22' }}>
                            {comp.settlement} → {comp.facility}
                          </span>
                          <StatusBadge
                            tone={isIsolated ? 'red' : comp.status === 'detour' ? 'orange' : 'green'}
                          >
                            {isIsolated ? 'ISOLATED' : comp.status === 'detour' ? `+${comp.delta_minutes || (comp.after_value - comp.before_value)} min detour` : 'Unchanged'}
                          </StatusBadge>
                        </div>

                        {/* Baseline Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', fontSize: '11px' }}>
                          <span style={{ width: '65px', color: '#587066', fontWeight: '600' }}>Baseline:</span>
                          <div style={{ flex: 1, background: '#e2e8e3', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${baselinePct}%`,
                                height: '100%',
                                background: '#16a34a',
                                borderRadius: '4px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <span style={{ width: '60px', textAlign: 'right', fontWeight: '700', color: '#166534' }}>
                            {displayMetric(comp.before_value, comp.unit)}
                          </span>
                        </div>

                        {/* Disrupted Scenario Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                          <span style={{ width: '65px', color: '#587066', fontWeight: '600' }}>Disrupted:</span>
                          <div style={{ flex: 1, background: '#e2e8e3', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${afterPct}%`,
                                height: '100%',
                                background: isIsolated ? '#dc2626' : '#ea580c',
                                borderRadius: '4px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              width: '60px',
                              textAlign: 'right',
                              fontWeight: '700',
                              color: isIsolated ? '#b91c1c' : '#c2410c',
                            }}
                          >
                            {isIsolated ? 'No Route' : displayMetric(comp.after_value, comp.unit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Evidence Path Table */}
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#092d22' }}>
                    Topological Routing Evidence
                  </h4>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Origin Settlement</th>
                          <th>Destination Facility</th>
                          <th>Baseline Path</th>
                          <th>Alternative Path (Detour)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.access_comparisons.map((c) => (
                          <tr key={`table-${c.settlement_id}-${c.facility_id}`}>
                            <td><strong>{c.settlement}</strong></td>
                            <td>
                              {c.facility}
                              <br />
                              <small style={{ color: '#687c73' }}>{c.facility_type?.replace('_', ' ')}</small>
                            </td>
                            <td>
                              <small>{(c.baseline_path || []).join(' → ') || 'Direct'}</small>
                            </td>
                            <td>
                              <small style={{ color: c.status === 'unreachable' ? '#b91c1c' : '#c2410c' }}>
                                {c.status === 'unreachable'
                                  ? 'No viable path (Disconnected)'
                                  : (c.alternative_path || []).join(' → ') || 'Baseline path'}
                              </small>
                            </td>
                            <td>
                              <StatusBadge tone={c.status === 'unreachable' ? 'red' : c.status === 'detour' ? 'orange' : 'green'}>
                                {c.status.replace('_', ' ')}
                              </StatusBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REPAIR PRIORITIZATION (WHAT IF WE FIX THIS FIRST?) */}
      {!loadingVillage && (isDemo || (readiness?.can_simulate && edges.length > 0)) && activeTab === 'compare' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <Card>
            <CardHeader
              eyebrow="What If We Fix This First?"
              title="Repair Prioritization & Trade-off Analysis"
              description={
                isDemo
                  ? 'Compare restoring the Upper Suspension Footbridge (BR-01) vs the Khola River Motor Bridge (BR-02) under a dual-bridge outage scenario.'
                  : 'Compare two links currently recorded as damaged or blocked to evaluate which restoration delivers greater civic connectivity.'
              }
            />

            {isDemo ? (
              <div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div style={{ flex: 1, minWidth: '240px', background: 'var(--surface-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '11px', color: '#587066', fontWeight: '700', textTransform: 'uppercase' }}>Option A</span>
                    <h4 style={{ margin: '3px 0 2px', fontSize: '13px', color: '#092d22' }}>Upper Suspension Footbridge (BR-01)</h4>
                    <small style={{ color: '#687c73' }}>High ridge pedestrian link · serves 120 households & school</small>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#176342' }}>VS</div>
                  <div style={{ flex: 1, minWidth: '240px', background: 'var(--surface-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '11px', color: '#587066', fontWeight: '700', textTransform: 'uppercase' }}>Option B</span>
                    <h4 style={{ margin: '3px 0 2px', fontSize: '13px', color: '#092d22' }}>Khola River Motor Bridge (BR-02)</h4>
                    <small style={{ color: '#687c73' }}>Vehicular concrete girder · ambulance & logistics access to clinic</small>
                  </div>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={runComparison}
                    disabled={comparing}
                    style={{ minWidth: '150px' }}
                  >
                    {comparing ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />}
                    {comparing ? 'Analyzing…' : 'Run Comparison'}
                  </button>
                </div>
              </div>
            ) : damagedEdges.length < 2 ? (
              <FeatureNotice title="Two damaged links required for live comparison" icon={TriangleAlert}>
                This village currently has {damagedEdges.length} blocked link(s). To run comparative prioritization on live records, record at least two damaged roads or bridges in Village Data Manager, or switch to the Sundar Gaun demonstration dataset.
              </FeatureNotice>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                <label style={{ flex: 1, minWidth: 230 }}>
                  <strong>Repair option A</strong>
                  <select
                    value={repairOptionA}
                    onChange={(event) => setRepairOptionA(event.target.value)}
                    style={{ width: '100%', marginTop: 6 }}
                  >
                    {damagedEdges.map((edge) => (
                      <option key={edge.id} value={edge.id}>{edge.name}</option>
                    ))}
                  </select>
                </label>
                <label style={{ flex: 1, minWidth: 230 }}>
                  <strong>Repair option B</strong>
                  <select
                    value={repairOptionB}
                    onChange={(event) => setRepairOptionB(event.target.value)}
                    style={{ width: '100%', marginTop: 6 }}
                  >
                    {damagedEdges.map((edge) => (
                      <option key={edge.id} value={edge.id}>{edge.name}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={runComparison}
                  disabled={comparing || repairOptionA === repairOptionB}
                >
                  {comparing ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />} Compare
                </button>
              </div>
            )}

            {comparisonError && (
              <div className="inline-error">
                <AlertCircle size={15} /> {comparisonError}
              </div>
            )}
          </Card>

          {/* Comparison Result Cards */}
          {comparisonResult && (
            <Card>
              <CardHeader
                eyebrow="Comparative outcomes"
                title="Repair Priority Trade-off Evaluation"
                description={comparisonResult.comparison_summary}
              />

              <div className="repair-grid">
                {[comparisonResult.scenario_a, comparisonResult.scenario_b].map((scenario, idx) => (
                  <div key={scenario.scenario_name || idx} className="repair-option-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: idx === 0 ? '#1d4ed8' : '#047857' }}>
                        {idx === 0 ? 'Option A' : 'Option B'}
                      </span>
                      <StatusBadge tone={scenario.emergency_vehicle_access ? 'green' : 'orange'}>
                        {scenario.emergency_vehicle_access ? 'Motor / Ambulance Rated' : 'Pedestrian Footpath Only'}
                      </StatusBadge>
                    </div>

                    <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>{scenario.scenario_name}</h3>
                    
                    <p>
                      <span>Households regaining direct access</span>
                      <strong>{scenario.households_regaining_access} HH</strong>
                    </p>
                    <p>
                      <span>Health Post Access</span>
                      <strong>{scenario.health_access_restored || (idx === 0 ? 'Pedestrian (Stretcher Carry)' : 'Fully Motorized / Ambulance')}</strong>
                    </p>
                    <p>
                      <span>School Access</span>
                      <strong>{scenario.school_access_restored || (idx === 0 ? 'Direct high ridge trail (16 min)' : 'Valley detour')}</strong>
                    </p>
                    <p>
                      <span>Emergency Ambulance Transit</span>
                      <strong style={{ color: scenario.emergency_vehicle_access ? '#166534' : '#b91c1c' }}>
                        {scenario.emergency_vehicle_access ? 'RESTORED (4-Wheel)' : 'BLOCKED (Footbridge Only)'}
                      </strong>
                    </p>
                    <p>
                      <span>Travel time saved</span>
                      <strong style={{ color: '#166534' }}>
                        {scenario.route_improvement_value ? `-${scenario.route_improvement_value} min` : 'Restored'}
                      </strong>
                    </p>
                    <p>
                      <span>Residual unserved households</span>
                      <strong>{scenario.remaining_affected_households} HH</strong>
                    </p>

                    <div style={{ marginTop: '12px', background: '#f8faf9', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#334b42', lineHeight: '1.45' }}>
                      <strong>Trade-off:</strong> {scenario.trade_off_analysis || scenario.description}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation Note */}
              {comparisonResult.recommendation_note && (
                <div style={{ marginTop: '16px', padding: '12px 14px', background: '#e4f4e9', border: '1px solid #b7dfca', borderRadius: '8px', fontSize: '12.5px', color: '#092d22' }}>
                  <strong>💡 Municipal Decision Synthesis:</strong> {comparisonResult.recommendation_note}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* SIMULATION HISTORY CARD */}
      {villageData && (
        <Card>
          <CardHeader
            eyebrow="Saved calculations"
            title="Simulation History"
            description="Reopen prior simulation results for this village. An older graph badge indicates the mapped network has been edited since calculation."
            action={<History size={18} />}
          />
          {history.length === 0 ? (
            <p style={{ color: '#687c73' }}>No prior simulations saved for this village yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Scenario</th>
                    <th>Calculated Date</th>
                    <th>Model Level</th>
                    <th>Graph Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((sim) => (
                    <tr key={sim.id}>
                      <td>#{sim.id}</td>
                      <td>{sim.scenario_name || sim.scenario_type?.replaceAll('_', ' ') || 'Complete closure'}</td>
                      <td>{sim.created_at ? new Date(sim.created_at).toLocaleString() : 'Recent'}</td>
                      <td>{sim.verification_level?.replace('_', ' ') || 'standard'}</td>
                      <td>
                        {sim.is_graph_outdated ? (
                          <StatusBadge tone="orange">Older graph</StatusBadge>
                        ) : (
                          <StatusBadge tone="green">Current</StatusBadge>
                        )}
                      </td>
                      <td>
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => reopenHistory(sim)}
                        >
                          <Eye size={14} /> Reopen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
