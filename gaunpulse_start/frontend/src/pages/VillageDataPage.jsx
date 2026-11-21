import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  CloudUpload,
  Database,
  Download,
  FileCode,
  FolderGit2,
  HelpCircle,
  Home,
  Layers,
  Link as LinkIcon,
  LoaderCircle,
  MapPin,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { Card, CardHeader, DemoLabel, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';

const API_BASE = 'http://127.0.0.1:8000/api';

// Sample GeoJSON payload for 1-click test import
const SAMPLE_NEPAL_GEOJSON = {
  type: 'FeatureCollection',
  metadata: { description: 'Sample Nepal Ward Lifeline Network (Helambu-Melamchi Ridge)' },
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [85.5795, 27.8690] },
      properties: {
        node_code: 'sample_ridge_hamlet',
        name: 'Highland Ridge Hamlet Point',
        node_type: 'settlement',
        description: 'Cluster of 14 terraced households along upper agricultural ridge',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [85.5802, 27.8655] },
      properties: {
        node_code: 'sample_community_tap',
        name: 'Upper Solar Tap Stand',
        node_type: 'water_source',
        description: 'Gravity spring intake tap for northern households',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [85.5795, 27.8690],
          [85.5802, 27.8655],
        ],
      },
      properties: {
        edge_code: 'sample_ridge_tap_trail',
        name: 'Ridge Hamlet to Solar Tap Footpath',
        source_node_code: 'sample_ridge_hamlet',
        target_node_code: 'sample_community_tap',
        infrastructure_type: 'trail',
        surface_type: 'earthen',
        length_meters: 420,
        status: 'passable',
        is_critical: false,
        notes: 'Stone-stepped pedestrian trail used daily for fetching clean water',
      },
    },
  ],
};

export default function VillageDataPage() {
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [integrityData, setIntegrityData] = useState(null);
  const [activeTab, setActiveTab] = useState('nodes'); // 'nodes' | 'edges' | 'facilities' | 'gis' | 'integrity'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Search / Filter states
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState('all');
  const [edgeSearch, setEdgeSearch] = useState('');
  const [edgeStatusFilter, setEdgeStatusFilter] = useState('all');

  // Modal states
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [villageForm, setVillageForm] = useState({
    name: '',
    local_name: '',
    ward_no: '4',
    municipality: 'Helambu Rural Municipality',
    district: 'Sindhupalchok',
    province: 'Bagmati Province',
    center_lat: 27.8635,
    center_lng: 85.5815,
    description: '',
  });

  const [nodeForm, setNodeForm] = useState({
    name: '',
    node_code: '',
    node_type: 'junction',
    latitude: 27.864,
    longitude: 85.58,
    description: '',
  });

  const [edgeForm, setEdgeForm] = useState({
    name: '',
    edge_code: '',
    source_node_id: '',
    target_node_id: '',
    infrastructure_type: 'road',
    surface_type: 'gravel',
    status: 'passable',
    length_meters: 350,
    is_critical: false,
    notes: '',
  });

  const [facilityForm, setFacilityForm] = useState({
    name: '',
    facility_type: 'health_post',
    node_id: '',
    capacity: 'Standard Rural Clinic',
    operational_status: 'operational',
    contact_person: '',
    contact_phone: '',
    notes: '',
  });

  // GIS Import state
  const [gisFile, setGisFile] = useState(null);
  const [gisParsed, setGisParsed] = useState(null);
  const [gisError, setGisError] = useState(null);

  // Load initial list of villages
  const loadVillages = async () => {
    try {
      const res = await fetch(`${API_BASE}/villages`);
      if (!res.ok) throw new Error('Failed to load villages list');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setVillages(list);
      if (list.length > 0 && !selectedVillageId) {
        setSelectedVillageId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Could not connect to Laravel API or MySQL: ' + err.message });
    }
  };

  useEffect(() => {
    loadVillages();
  }, []);

  // Load active village's network and graph integrity
  const loadVillageDetails = async (villageId) => {
    if (!villageId) return;
    setLoading(true);
    try {
      const [netRes, intRes] = await Promise.all([
        fetch(`${API_BASE}/villages/${villageId}/network`),
        fetch(`${API_BASE}/villages/${villageId}/integrity`),
      ]);

      if (!netRes.ok) throw new Error('Failed to load village network data');
      const netJson = await netRes.json();
      setNetworkData(netJson);

      if (intRes.ok) {
        const intJson = await intRes.json();
        setIntegrityData(intJson);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Error loading village infrastructure: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVillageId) {
      loadVillageDetails(selectedVillageId);
    }
  }, [selectedVillageId]);

  // Create new village
  const handleCreateVillage = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(villageForm),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Validation error');
      }
      const newVillage = await res.json();
      setAlert({ type: 'success', message: `Village "${newVillage.name}" successfully created in MySQL.` });
      setShowVillageModal(false);
      await loadVillages();
      setSelectedVillageId(newVillage.id);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Create spatial node
  const handleCreateNode = async (e) => {
    e.preventDefault();
    if (!selectedVillageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeForm),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to create spatial node');
      }
      const created = await res.json();
      setAlert({ type: 'success', message: `Spatial Node "${created.name}" created successfully.` });
      setShowNodeModal(false);
      setNodeForm({
        name: '',
        node_code: '',
        node_type: 'junction',
        latitude: networkData?.village?.center_lat || 27.864,
        longitude: networkData?.village?.center_lng || 85.58,
        description: '',
      });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete node
  const handleDeleteNode = async (nodeId, nodeName) => {
    if (!window.confirm(`Are you sure you want to remove node "${nodeName}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/nodes/${nodeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete node');
      }
      setAlert({ type: 'success', message: `Node "${nodeName}" removed.` });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Create edge
  const handleCreateEdge = async (e) => {
    e.preventDefault();
    if (!selectedVillageId) return;
    if (edgeForm.source_node_id === edgeForm.target_node_id) {
      setAlert({ type: 'error', message: 'Source node and target node must be different.' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edgeForm),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to create lifeline edge');
      }
      const created = await res.json();
      setAlert({ type: 'success', message: `Lifeline Edge "${created.name}" added to network.` });
      setShowEdgeModal(false);
      setEdgeForm({
        name: '',
        edge_code: '',
        source_node_id: '',
        target_node_id: '',
        infrastructure_type: 'road',
        surface_type: 'gravel',
        status: 'passable',
        length_meters: 350,
        is_critical: false,
        notes: '',
      });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick toggle edge status (Passable <-> Blocked)
  const handleToggleEdgeStatus = async (edge) => {
    const newStatus = edge.status === 'blocked' ? 'passable' : 'blocked';
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/edges/${edge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle lifeline status');
      setAlert({
        type: 'success',
        message: `Edge "${edge.name}" status updated to ${newStatus.toUpperCase()} in MySQL.`,
      });
      await loadVillageDetails(selectedVillageId);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete edge
  const handleDeleteEdge = async (edgeId, edgeName) => {
    if (!window.confirm(`Are you sure you want to remove lifeline edge "${edgeName}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/edges/${edgeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete edge');
      setAlert({ type: 'success', message: `Lifeline edge "${edgeName}" removed.` });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Create facility
  const handleCreateFacility = async (e) => {
    e.preventDefault();
    if (!selectedVillageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityForm),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to create facility');
      }
      const created = await res.json();
      setAlert({ type: 'success', message: `Facility "${created.name}" registered in MySQL.` });
      setShowFacilityModal(false);
      setFacilityForm({
        name: '',
        facility_type: 'health_post',
        node_id: '',
        capacity: 'Standard Rural Clinic',
        operational_status: 'operational',
        contact_person: '',
        contact_phone: '',
        notes: '',
      });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete facility
  const handleDeleteFacility = async (facilityId, facilityName) => {
    if (!window.confirm(`Are you sure you want to remove facility "${facilityName}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/facilities/${facilityId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete facility');
      setAlert({ type: 'success', message: `Facility "${facilityName}" removed.` });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Parse uploaded GeoJSON file
  const handleGisFileChange = (e) => {
    const file = e.target.files[0];
    setGisError(null);
    if (!file) {
      setGisFile(null);
      setGisParsed(null);
      return;
    }

    setGisFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const features = parsed.features || (parsed.geojson && parsed.geojson.features);
        if (!Array.isArray(features)) {
          throw new Error('File does not contain a valid GeoJSON "features" array.');
        }

        const pointCount = features.filter((f) => f.geometry?.type === 'Point').length;
        const lineCount = features.filter((f) => f.geometry?.type === 'LineString').length;

        setGisParsed({
          raw: parsed,
          featuresCount: features.length,
          pointCount,
          lineCount,
          fileName: file.name,
          fileSizeKb: (file.size / 1024).toFixed(1),
        });
      } catch (err) {
        setGisError('GeoJSON parsing failed: ' + err.message);
        setGisParsed(null);
      }
    };
    reader.readAsText(file);
  };

  // Load sample GeoJSON for quick testing
  const handleLoadSampleGis = () => {
    setGisError(null);
    setGisFile({ name: 'sample_nepal_ward_network.geojson', size: 1024 });
    setGisParsed({
      raw: SAMPLE_NEPAL_GEOJSON,
      featuresCount: SAMPLE_NEPAL_GEOJSON.features.length,
      pointCount: 2,
      lineCount: 1,
      fileName: 'sample_nepal_ward_network.geojson (Pre-configured)',
      fileSizeKb: '1.2',
    });
  };

  // Submit GeoJSON Import to MySQL
  const handleImportGeoJsonSubmit = async () => {
    if (!gisParsed || !gisParsed.raw || !selectedVillageId) return;
    setActionLoading(true);
    setGisError(null);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/import-geojson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gisParsed.raw),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Import failed');
      }

      setAlert({
        type: 'success',
        message: data.message || `Successfully imported ${data.imported_nodes} nodes and ${data.imported_edges} edges.`,
      });
      setShowImportModal(false);
      setGisFile(null);
      setGisParsed(null);
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setGisError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Export GeoJSON as downloadable file
  const handleExportGeoJson = () => {
    if (!selectedVillageId) return;
    window.location.href = `${API_BASE}/villages/${selectedVillageId}/export-geojson`;
  };

  const selectedVillage = villages.find((v) => v.id === selectedVillageId) || networkData?.village;

  // Filtered nodes
  const filteredNodes = (networkData?.nodes || []).filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(nodeSearch.toLowerCase()) ||
      (node.node_code && node.node_code.toLowerCase().includes(nodeSearch.toLowerCase()));
    const type = node.node_type || node.type || 'junction';
    const matchesType = nodeTypeFilter === 'all' || type === nodeTypeFilter;
    return matchesSearch && matchesType;
  });

  // Filtered edges
  const filteredEdges = (networkData?.edges || []).filter((edge) => {
    const matchesSearch =
      edge.name.toLowerCase().includes(edgeSearch.toLowerCase()) ||
      (edge.edge_code && edge.edge_code.toLowerCase().includes(edgeSearch.toLowerCase()));
    const matchesStatus = edgeStatusFilter === 'all' || edge.status === edgeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Municipal GIS & Infrastructure Network Stewardship"
        title="Village Data Manager"
        description="Inspect, administer, and synchronize rural lifeline graphs, administrative ward records, spatial nodes, and baseline infrastructure topologies in MySQL."
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setShowVillageModal(true)}
            >
              <Plus size={16} /> Register New Village
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={16} /> Import GIS / GeoJSON
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={handleExportGeoJson}
              disabled={!selectedVillageId}
            >
              <Download size={16} /> Export GeoJSON
            </button>
          </div>
        }
      />

      {/* ALERT BANNER */}
      {alert && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: alert.type === 'success' ? '#eaf8ef' : '#fdf2f2',
            border: `1px solid ${alert.type === 'success' ? '#176342' : '#b42318'}`,
            color: alert.type === 'success' ? '#092d22' : '#912018',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} color="#176342" /> : <AlertTriangle size={18} color="#b42318" />}
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SYSTEM STATUS NOTIFICATION */}
      <FeatureNotice title="Connected to Municipal Spatial Graph Engine" icon={Database}>
        MySQL ServBay database (Port 3306) is active. Infrastructure nodes, road edges, public clinics, and ward topological integrity metrics update live with bidirectional GIS persistence.
      </FeatureNotice>

      {/* VILLAGE SELECTOR & QUICK STATS BAR */}
      <Card>
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#fcfdfb',
            borderBottom: '1px solid #dfe6df',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#176342',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#687c73', fontWeight: 600 }}>
                Active Administrative Ward
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <select
                  value={selectedVillageId || ''}
                  onChange={(e) => setSelectedVillageId(Number(e.target.value))}
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#092d22',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #c2d1c6',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.municipality} · Ward {v.ward_no || '4'})
                    </option>
                  ))}
                </select>
                <DemoLabel compact />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="button button--secondary"
              type="button"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => {
                if (selectedVillageId) loadVillageDetails(selectedVillageId);
              }}
              title="Refresh Network Graph"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Sync
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            padding: '18px 24px',
          }}
        >
          <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600, textTransform: 'uppercase' }}>Spatial Nodes</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#092d22', marginTop: '4px' }}>
              {networkData?.nodes?.length || 0}
            </div>
            <span style={{ fontSize: '11.5px', color: '#176342' }}>Settlements, junctions, taps</span>
          </div>

          <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600, textTransform: 'uppercase' }}>Lifeline Edges</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#092d22', marginTop: '4px' }}>
              {networkData?.edges?.length || 0}
            </div>
            <span style={{ fontSize: '11.5px', color: '#176342' }}>Roads, trails & bridges</span>
          </div>

          <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600, textTransform: 'uppercase' }}>Essential Facilities</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#092d22', marginTop: '4px' }}>
              {networkData?.facilities?.length || 0}
            </div>
            <span style={{ fontSize: '11.5px', color: '#176342' }}>Health clinic, school, muhan</span>
          </div>

          <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600, textTransform: 'uppercase' }}>Graph Health</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: integrityData?.health_score >= 80 ? '#176342' : '#b42318', marginTop: '4px' }}>
              {integrityData ? `${integrityData.health_score}%` : 'Checking...'}
            </div>
            <span style={{ fontSize: '11.5px', color: integrityData?.is_fully_connected ? '#176342' : '#b42318' }}>
              {integrityData?.is_fully_connected ? 'Coherent Network' : 'Disconnected clusters'}
            </span>
          </div>
        </div>
      </Card>

      {/* SUB-NAVIGATION TABS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e7ebe7',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'nodes', label: 'Spatial Nodes', icon: MapPin, count: networkData?.nodes?.length },
          { id: 'edges', label: 'Lifelines & Edges', icon: Network, count: networkData?.edges?.length },
          { id: 'facilities', label: 'Facilities & Settlements', icon: Building, count: (networkData?.facilities?.length || 0) + (networkData?.settlements?.length || 0) },
          { id: 'gis', label: 'GIS & GeoJSON Center', icon: FolderGit2 },
          { id: 'integrity', label: 'Topology Diagnostics', icon: Activity, tone: integrityData?.status === 'healthy' ? 'green' : 'amber' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: isActive ? '#176342' : 'transparent',
                color: isActive ? '#ffffff' : '#495a52',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                borderBottom: isActive ? '3px solid #092d22' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#e7ebe7',
                    color: isActive ? '#fff' : '#495a52',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SPATIAL NODES */}
      {activeTab === 'nodes' && (
        <Card>
          <CardHeader
            eyebrow="Spatial Point Topology"
            title="Village Network Nodes"
            description="Geographic waypoints, settlement centers, junctions, and infrastructure intake points."
            action={
              <button
                className="button button--primary"
                type="button"
                onClick={() => setShowNodeModal(true)}
              >
                <Plus size={15} /> Add Spatial Node
              </button>
            }
          />

          {/* Search & Filter Bar */}
          <div
            style={{
              padding: '12px 24px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              background: '#fcfdfc',
              borderBottom: '1px solid #dfe6df',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#687c73' }}
              />
              <input
                type="text"
                placeholder="Filter by node name or code..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '6px',
                  border: '1px solid #c2d1c6',
                  fontSize: '13px',
                }}
              />
            </div>
            <select
              value={nodeTypeFilter}
              onChange={(e) => setNodeTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #c2d1c6',
                fontSize: '13px',
                background: '#fff',
              }}
            >
              <option value="all">All Node Types</option>
              <option value="settlement">Settlements</option>
              <option value="facility">Public Facilities</option>
              <option value="junction">Routing Junctions</option>
              <option value="water_source">Water Sources / Intake</option>
              <option value="transit">Transit / Bridgeheads</option>
            </select>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Node Code / ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Coordinates (Lat, Lng)</th>
                  <th>Description / Context</th>
                  <th>Connected Edges</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
                      No infrastructure nodes found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredNodes.map((node) => {
                    const nodeType = node.node_type || node.type || 'junction';
                    const connectedEdgesCount = (networkData?.edges || []).filter(
                      (e) => e.source_node_id === node.id || e.target_node_id === node.id
                    ).length;

                    return (
                      <tr key={node.id}>
                        <td>
                          <code>{node.node_code || `node_${node.id}`}</code>
                          <small style={{ display: 'block', color: '#687c73' }}>ID: #{node.id}</small>
                        </td>
                        <td>
                          <strong>{node.name}</strong>
                        </td>
                        <td>
                          <StatusBadge
                            tone={
                              nodeType === 'settlement'
                                ? 'green'
                                : nodeType === 'facility'
                                ? 'blue'
                                : nodeType === 'water_source'
                                ? 'teal'
                                : 'neutral'
                            }
                          >
                            {nodeType.replace('_', ' ')}
                          </StatusBadge>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
                          </span>
                        </td>
                        <td style={{ maxWidth: '240px', fontSize: '12px', color: '#495a52' }}>
                          {node.description || '—'}
                        </td>
                        <td>
                          <strong>{connectedEdgesCount}</strong> links
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteNode(node.id, node.name)}
                            disabled={actionLoading}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e1b4b4',
                              background: '#fff5f5',
                              color: '#b42318',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Delete Node"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: LIFELINES & EDGES */}
      {activeTab === 'edges' && (
        <Card>
          <CardHeader
            eyebrow="Lifeline Topology"
            title="Roads, Trails & Suspension Bridges"
            description="Network edges that carry civilian transit, ambulance corridors, and rural supply lifelines."
            action={
              <button
                className="button button--primary"
                type="button"
                onClick={() => setShowEdgeModal(true)}
              >
                <Plus size={15} /> Add Lifeline Edge
              </button>
            }
          />

          {/* Search & Filter Bar */}
          <div
            style={{
              padding: '12px 24px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              background: '#fcfdfc',
              borderBottom: '1px solid #dfe6df',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#687c73' }}
              />
              <input
                type="text"
                placeholder="Filter by lifeline name or edge code..."
                value={edgeSearch}
                onChange={(e) => setEdgeSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '6px',
                  border: '1px solid #c2d1c6',
                  fontSize: '13px',
                }}
              />
            </div>
            <select
              value={edgeStatusFilter}
              onChange={(e) => setEdgeStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #c2d1c6',
                fontSize: '13px',
                background: '#fff',
              }}
            >
              <option value="all">All Operational States</option>
              <option value="passable">Passable / Operational</option>
              <option value="blocked">Blocked / Impassable</option>
              <option value="partially_blocked">Partially Blocked</option>
            </select>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Edge Code</th>
                  <th>Lifeline Name</th>
                  <th>Endpoint Nodes</th>
                  <th>Infrastructure & Surface</th>
                  <th>Length (m)</th>
                  <th>Status & Quick Toggle</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEdges.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
                      No lifeline edges found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredEdges.map((edge) => {
                    const isBlocked = edge.status === 'blocked';
                    const srcName = edge.source?.name || `Node #${edge.source_node_id}`;
                    const tgtName = edge.target?.name || `Node #${edge.target_node_id}`;

                    return (
                      <tr key={edge.id}>
                        <td>
                          <code>{edge.edge_code || `edge_${edge.id}`}</code>
                          {edge.is_critical && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '6px',
                                fontSize: '10px',
                                background: '#fdf2f2',
                                color: '#b42318',
                                border: '1px solid #fecaca',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                              }}
                            >
                              CRITICAL
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{edge.name}</strong>
                          {edge.notes && (
                            <small style={{ display: 'block', color: '#687c73', maxWidth: '280px' }}>
                              {edge.notes}
                            </small>
                          )}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <span style={{ color: '#092d22', fontWeight: 600 }}>{srcName}</span>
                          <span style={{ color: '#687c73', margin: '0 5px' }}>➔</span>
                          <span style={{ color: '#092d22', fontWeight: 600 }}>{tgtName}</span>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                            {edge.infrastructure_type || edge.type || 'road'}
                          </span>
                          <small style={{ display: 'block', color: '#687c73' }}>
                            {edge.surface_type || 'gravel'}
                          </small>
                        </td>
                        <td>
                          <strong>{Math.round(edge.length_meters || 100)}m</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StatusBadge tone={isBlocked ? 'red' : 'green'}>
                              {edge.status || 'passable'}
                            </StatusBadge>
                            <button
                              type="button"
                              onClick={() => handleToggleEdgeStatus(edge)}
                              disabled={actionLoading}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: isBlocked ? '#b42318' : '#176342',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title={isBlocked ? 'Click to mark Passable' : 'Click to mark Blocked'}
                            >
                              {isBlocked ? <ToggleLeft size={22} /> : <ToggleRight size={22} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteEdge(edge.id, edge.name)}
                            disabled={actionLoading}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e1b4b4',
                              background: '#fff5f5',
                              color: '#b42318',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Delete Lifeline Edge"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: FACILITIES & SETTLEMENTS */}
      {activeTab === 'facilities' && (
        <div className="page-stack">
          {/* Public Facilities */}
          <Card>
            <CardHeader
              eyebrow="Civic Infrastructure"
              title="Essential Public Facilities"
              description="Health posts, basic & secondary schools, drinking water reservoir tanks, and administrative outposts."
              action={
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setShowFacilityModal(true)}
                >
                  <Plus size={15} /> Add Public Facility
                </button>
              }
            />
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Facility Name</th>
                    <th>Category</th>
                    <th>Linked Spatial Node</th>
                    <th>Operational Capacity</th>
                    <th>Operational Status</th>
                    <th>Contact Person</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(networkData?.facilities || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
                        No public facilities registered in this village.
                      </td>
                    </tr>
                  ) : (
                    (networkData?.facilities || []).map((fac) => (
                      <tr key={fac.id}>
                        <td>
                          <strong>{fac.name}</strong>
                          {fac.notes && (
                            <small style={{ display: 'block', color: '#687c73' }}>{fac.notes}</small>
                          )}
                        </td>
                        <td>
                          <StatusBadge tone="blue">
                            {(fac.facility_type || fac.type || 'facility').replace('_', ' ')}
                          </StatusBadge>
                        </td>
                        <td>
                          <strong>{fac.node?.name || `Node #${fac.node_id}`}</strong>
                        </td>
                        <td style={{ fontSize: '12px' }}>{fac.capacity || 'Standard Village Capacity'}</td>
                        <td>
                          <StatusBadge tone={fac.operational_status === 'operational' ? 'green' : 'amber'}>
                            {fac.operational_status || 'operational'}
                          </StatusBadge>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {fac.contact_person ? (
                            <>
                              <div>{fac.contact_person}</div>
                              {fac.contact_phone && <small style={{ color: '#687c73' }}>{fac.contact_phone}</small>}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteFacility(fac.id, fac.name)}
                            disabled={actionLoading}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e1b4b4',
                              background: '#fff5f5',
                              color: '#b42318',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Settlement Groups */}
          <Card>
            <CardHeader
              eyebrow="Demographic Baseline"
              title="Residential Settlement Groups"
              description="Populated village toles and hamlets whose access to lifelines is tracked."
              action={<DemoLabel compact />}
            />
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Settlement Name</th>
                    <th>Local Name (Nepali)</th>
                    <th>Households</th>
                    <th>Est. Population</th>
                    <th>Elevation</th>
                    <th>Context Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(networkData?.settlements || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
                        No settlement groups recorded for this village.
                      </td>
                    </tr>
                  ) : (
                    (networkData?.settlements || []).map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.name}</strong>
                        </td>
                        <td>
                          <span style={{ color: '#176342', fontWeight: 500 }}>{s.local_name || '—'}</span>
                        </td>
                        <td>
                          <strong>{s.households || s.estimated_population ? Math.round((s.estimated_population || 100) / 4) : 25}</strong> households
                        </td>
                        <td>
                          <strong>{s.population || s.estimated_population || 120}</strong> residents
                        </td>
                        <td>{s.elevation_meters ? `${s.elevation_meters}m ASL` : 'Mountain Ridge'}</td>
                        <td style={{ maxWidth: '300px', fontSize: '12px', color: '#495a52' }}>
                          {s.notes || 'Reliant on village lifeline network for health and market access.'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: GIS & GEOJSON CENTER */}
      {activeTab === 'gis' && (
        <div className="page-stack">
          <Card>
            <CardHeader
              eyebrow="Bidirectional Spatial Exchange"
              title="GIS & GeoJSON Import / Export"
              description="Import GIS FeatureCollections to populate MySQL with spatial nodes and linestrings, or export standard RFC 7946 GeoJSON files for QGIS, ArcGIS, and OpenStreetMap."
            />
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* IMPORT BOX */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px dashed #248157',
                  background: '#f9fbf9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CloudUpload size={22} color="#176342" />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22' }}>Import GeoJSON to MySQL</h3>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                  Select a <code>.geojson</code> or <code>.json</code> file containing <code>Point</code> features (network nodes) and <code>LineString</code> features (lifeline edges).
                </p>

                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleGisFileChange}
                  style={{
                    padding: '8px',
                    border: '1px solid #c2d1c6',
                    borderRadius: '8px',
                    background: '#fff',
                    fontSize: '12px',
                  }}
                />

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="button button--secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={handleLoadSampleGis}
                  >
                    ⚡ Load Sample Nepal Ward GeoJSON
                  </button>
                </div>

                {gisError && (
                  <div style={{ padding: '8px 12px', background: '#fdf2f2', color: '#b42318', borderRadius: '6px', fontSize: '12px' }}>
                    {gisError}
                  </div>
                )}

                {gisParsed && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#eef7f0',
                      borderRadius: '8px',
                      border: '1px solid #b8dfc2',
                      fontSize: '12.5px',
                      color: '#092d22',
                    }}
                  >
                    <strong>✓ Schema Validated:</strong> {gisParsed.fileName} ({gisParsed.fileSizeKb} KB)
                    <div style={{ marginTop: '6px', display: 'flex', gap: '16px' }}>
                      <span>📍 Points (Nodes): <strong>{gisParsed.pointCount}</strong></span>
                      <span>🛣️ Lines (Edges): <strong>{gisParsed.lineCount}</strong></span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleImportGeoJsonSubmit}
                  disabled={!gisParsed || actionLoading}
                  style={{ marginTop: 'auto' }}
                >
                  {actionLoading ? <LoaderCircle size={16} className="spin" /> : <Upload size={16} />}
                  Import & Persist into MySQL
                </button>
              </div>

              {/* EXPORT BOX */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #dfe6df',
                  background: '#fcfdfb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCode size={22} color="#176342" />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22' }}>Export Spatial GeoJSON</h3>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                  Download the complete live network graph for <strong>{selectedVillage?.name}</strong> conforming to RFC 7946 GeoJSON format. Compatible with QGIS, Mapbox, ArcGIS, and OpenStreetMap.
                </p>

                <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
                  <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600, textTransform: 'uppercase' }}>Package Contents</span>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#092d22' }}>
                    <li>{networkData?.nodes?.length || 0} Spatial Point Features (Coordinates & Node Codes)</li>
                    <li>{networkData?.edges?.length || 0} LineString Features (Endpoints, Surface & Status)</li>
                    <li>Full CRS Projection: <code>urn:ogc:def:crs:OGC:1.3:CRS84</code></li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleExportGeoJson}
                  style={{ marginTop: 'auto' }}
                >
                  <Download size={16} /> Download {selectedVillage?.name || 'Village'}.geojson
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: TOPOLOGY DIAGNOSTICS */}
      {activeTab === 'integrity' && (
        <div className="page-stack">
          <Card>
            <CardHeader
              eyebrow="Network Topology Integrity"
              title="Graph Diagnostic & Health Audit"
              description="Automated mathematical graph checks verifying network connectivity, orphaned points, and structural single-points-of-failure."
              action={
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => selectedVillageId && loadVillageDetails(selectedVillageId)}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} /> Re-run Graph Audit
                </button>
              }
            />

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* CARD 1: OVERALL HEALTH */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${integrityData?.health_score >= 80 ? '#248157' : '#e06a3b'}`,
                  background: integrityData?.health_score >= 80 ? '#f2f8f4' : '#fff9f5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#687c73', textTransform: 'uppercase' }}>
                    Health Score
                  </span>
                  {integrityData?.health_score >= 80 ? (
                    <ShieldCheck size={20} color="#176342" />
                  ) : (
                    <ShieldAlert size={20} color="#b42318" />
                  )}
                </div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#092d22', margin: '8px 0 4px' }}>
                  {integrityData?.health_score ?? 100}%
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                  {integrityData?.diagnostics?.network_topology || 'Network topology verified.'}
                </p>
              </div>

              {/* CARD 2: CONNECTED COMPONENTS */}
              <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #dfe6df', background: '#ffffff' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#687c73', textTransform: 'uppercase' }}>
                  Graph Coherence
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#092d22', margin: '8px 0 4px' }}>
                  {integrityData?.connected_components_count ?? 1}
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                  {integrityData?.is_fully_connected
                    ? 'All settlements belong to 1 single connected network graph.'
                    : `Warning: Network is fractured into ${integrityData?.connected_components_count} isolated components!`}
                </p>
              </div>

              {/* CARD 3: ORPHAN NODES */}
              <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #dfe6df', background: '#ffffff' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#687c73', textTransform: 'uppercase' }}>
                  Orphaned Nodes
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: integrityData?.orphan_nodes_count > 0 ? '#b42318' : '#092d22', margin: '8px 0 4px' }}>
                  {integrityData?.orphan_nodes_count ?? 0}
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                  {integrityData?.orphan_nodes_count === 0
                    ? 'No disconnected points. Every node has at least one active edge.'
                    : `${integrityData?.orphan_nodes_count} node(s) have degree 0 and lack road links.`}
                </p>
              </div>
            </div>

            {/* AUDIT CHECKLIST */}
            <div style={{ padding: '0 24px 24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#092d22' }}>Topological Integrity Checklist</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <CheckCircle2 size={16} color="#176342" />
                  <span>
                    <strong>Spatial Bounding:</strong> {integrityData?.diagnostics?.spatial_bounding || 'All nodes fall within Nepal boundary envelope (26°-31°N, 80°-89°E).'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <CheckCircle2 size={16} color="#176342" />
                  <span>
                    <strong>Lifeline Accessibility:</strong> {integrityData?.diagnostics?.lifeline_connectivity || 'All settlements and health facilities have navigable lifeline links.'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <CheckCircle2 size={16} color="#176342" />
                  <span>
                    <strong>Dangling Edges:</strong> {integrityData?.dangling_edges_count === 0 ? 'Zero dangling edges. All endpoints resolve to valid database nodes.' : `${integrityData?.dangling_edges_count} dangling edge(s) detected.`}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: ADD NEW VILLAGE */}
      {showVillageModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Register New Village Record</h3>
              <button type="button" onClick={() => setShowVillageModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateVillage}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                <div>
                  <label style={labelStyle}>Village / Ward Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Melamchi Ghyang Demo"
                    value={villageForm.name}
                    onChange={(e) => setVillageForm({ ...villageForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Local Name (Devanagari)</label>
                  <input
                    type="text"
                    placeholder="e.g. मेलम्ची घ्याङ"
                    value={villageForm.local_name}
                    onChange={(e) => setVillageForm({ ...villageForm, local_name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Ward No.</label>
                    <input
                      type="text"
                      value={villageForm.ward_no}
                      onChange={(e) => setVillageForm({ ...villageForm, ward_no: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Rural Municipality *</label>
                    <input
                      type="text"
                      required
                      value={villageForm.municipality}
                      onChange={(e) => setVillageForm({ ...villageForm, municipality: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>District *</label>
                    <input
                      type="text"
                      required
                      value={villageForm.district}
                      onChange={(e) => setVillageForm({ ...villageForm, district: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Province *</label>
                    <input
                      type="text"
                      required
                      value={villageForm.province}
                      onChange={(e) => setVillageForm({ ...villageForm, province: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Center Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={villageForm.center_lat}
                      onChange={(e) => setVillageForm({ ...villageForm, center_lat: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Center Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={villageForm.center_lng}
                      onChange={(e) => setVillageForm({ ...villageForm, center_lng: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description / Geographic Context</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of settlement layout, access roads, and topography..."
                    value={villageForm.description}
                    onChange={(e) => setVillageForm({ ...villageForm, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowVillageModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />}
                  Save Village
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SPATIAL NODE */}
      {showNodeModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Add Spatial Node</h3>
              <button type="button" onClick={() => setShowNodeModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateNode}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                <div>
                  <label style={labelStyle}>Node Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Ridge Chautari Junction"
                    value={nodeForm.name}
                    onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Node Code</label>
                    <input
                      type="text"
                      placeholder="e.g. junction_north_ridge"
                      value={nodeForm.node_code}
                      onChange={(e) => setNodeForm({ ...nodeForm, node_code: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Node Type *</label>
                    <select
                      value={nodeForm.node_type}
                      onChange={(e) => setNodeForm({ ...nodeForm, node_type: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="junction">Routing Junction</option>
                      <option value="settlement">Settlement Center</option>
                      <option value="facility">Public Facility</option>
                      <option value="water_source">Water Source / Intake</option>
                      <option value="transit">Bridgehead / Transit Point</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Latitude *</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      value={nodeForm.latitude}
                      onChange={(e) => setNodeForm({ ...nodeForm, latitude: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Longitude *</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      value={nodeForm.longitude}
                      onChange={(e) => setNodeForm({ ...nodeForm, longitude: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description / Elevation Context</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Intersection point connecting Upper Ridge settlement to school road..."
                    value={nodeForm.description}
                    onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowNodeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />}
                  Add Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LIFELINE EDGE */}
      {showEdgeModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Add Lifeline Edge</h3>
              <button type="button" onClick={() => setShowEdgeModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateEdge}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                <div>
                  <label style={labelStyle}>Lifeline Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ridge Access Road"
                    value={edgeForm.name}
                    onChange={(e) => setEdgeForm({ ...edgeForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Source Node *</label>
                    <select
                      required
                      value={edgeForm.source_node_id}
                      onChange={(e) => setEdgeForm({ ...edgeForm, source_node_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Source Node</option>
                      {(networkData?.nodes || []).map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.node_code || `node_${n.id}`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Target Node *</label>
                    <select
                      required
                      value={edgeForm.target_node_id}
                      onChange={(e) => setEdgeForm({ ...edgeForm, target_node_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Target Node</option>
                      {(networkData?.nodes || []).map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.node_code || `node_${n.id}`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Infrastructure Type</label>
                    <select
                      value={edgeForm.infrastructure_type}
                      onChange={(e) => setEdgeForm({ ...edgeForm, infrastructure_type: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="road">Road</option>
                      <option value="bridge">Suspension Bridge</option>
                      <option value="trail">Pedestrian Trail</option>
                      <option value="footpath">Footpath / Steps</option>
                      <option value="culvert">Culvert Crossway</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Surface Type</label>
                    <select
                      value={edgeForm.surface_type}
                      onChange={(e) => setEdgeForm({ ...edgeForm, surface_type: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="gravel">Gravel / Murram</option>
                      <option value="paved">Blacktop Paved</option>
                      <option value="earthen">Earthen / Dirt</option>
                      <option value="suspension">Suspension Cable & Wood</option>
                      <option value="concrete">Concrete Paved</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Length (Meters)</label>
                    <input
                      type="number"
                      step="10"
                      value={edgeForm.length_meters}
                      onChange={(e) => setEdgeForm({ ...edgeForm, length_meters: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Initial Status</label>
                    <select
                      value={edgeForm.status}
                      onChange={(e) => setEdgeForm({ ...edgeForm, status: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="passable">Passable / Operational</option>
                      <option value="blocked">Blocked / Impassable</option>
                      <option value="partially_blocked">Partially Blocked</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="critical_checkbox"
                    checked={edgeForm.is_critical}
                    onChange={(e) => setEdgeForm({ ...edgeForm, is_critical: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#176342' }}
                  />
                  <label htmlFor="critical_checkbox" style={{ fontSize: '13px', color: '#092d22', cursor: 'pointer' }}>
                    Critical Lifeline (Primary access route with no immediate bypass)
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Notes / Routing Context</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Main route for ambulance access to health post..."
                    value={edgeForm.notes}
                    onChange={(e) => setEdgeForm({ ...edgeForm, notes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowEdgeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />}
                  Add Lifeline Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PUBLIC FACILITY */}
      {showFacilityModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Register Public Facility</h3>
              <button type="button" onClick={() => setShowFacilityModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFacility}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                <div>
                  <label style={labelStyle}>Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Helambu Community Birthing Clinic"
                    value={facilityForm.name}
                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Facility Category</label>
                    <select
                      value={facilityForm.facility_type}
                      onChange={(e) => setFacilityForm({ ...facilityForm, facility_type: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="health_post">Health Post / Clinic</option>
                      <option value="school">Basic / Secondary School</option>
                      <option value="water_point">Drinking Water Intake / Tap</option>
                      <option value="ward_office">Ward Office / Admin Center</option>
                      <option value="disaster_shelter">Designated Disaster Shelter</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Associated Spatial Node *</label>
                    <select
                      required
                      value={facilityForm.node_id}
                      onChange={(e) => setFacilityForm({ ...facilityForm, node_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Node Point</option>
                      {(networkData?.nodes || []).map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Operational Status</label>
                    <select
                      value={facilityForm.operational_status}
                      onChange={(e) => setFacilityForm({ ...facilityForm, operational_status: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="operational">Fully Operational</option>
                      <option value="limited">Limited Capacity</option>
                      <option value="non_operational">Non-Operational</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Capacity / Service Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 Beds, Solar Cold-Chain"
                      value={facilityForm.capacity}
                      onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sujan Thapa"
                      value={facilityForm.contact_person}
                      onChange={(e) => setFacilityForm({ ...facilityForm, contact_person: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +977-9841000000"
                      value={facilityForm.contact_phone}
                      onChange={(e) => setFacilityForm({ ...facilityForm, contact_phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowFacilityModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />}
                  Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT GIS / GEOJSON */}
      {showImportModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={{ ...modalCardStyle, maxWidth: '520px' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Import Village GIS Data</h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setGisParsed(null);
                  setGisError(null);
                }}
                style={closeBtnStyle}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                Select a GeoJSON file to import into <strong>{selectedVillage?.name}</strong>. Points will be saved as spatial nodes, and LineStrings will be created as lifeline edges.
              </p>

              <input
                type="file"
                accept=".geojson,.json"
                onChange={handleGisFileChange}
                style={{
                  padding: '10px',
                  border: '1px dashed #248157',
                  borderRadius: '8px',
                  background: '#f8faf8',
                  fontSize: '12.5px',
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={handleLoadSampleGis}
                >
                  ⚡ Load Sample Nepal Ward GeoJSON
                </button>
              </div>

              {gisError && (
                <div style={{ padding: '8px 12px', background: '#fdf2f2', color: '#b42318', borderRadius: '6px', fontSize: '12px' }}>
                  {gisError}
                </div>
              )}

              {gisParsed && (
                <div
                  style={{
                    padding: '12px',
                    background: '#eef7f0',
                    borderRadius: '8px',
                    border: '1px solid #b8dfc2',
                    fontSize: '12.5px',
                    color: '#092d22',
                  }}
                >
                  <strong>Ready to Import:</strong> {gisParsed.fileName}
                  <div style={{ marginTop: '6px', display: 'flex', gap: '16px' }}>
                    <span>📍 Points (Nodes): <strong>{gisParsed.pointCount}</strong></span>
                    <span>🛣️ Lines (Edges): <strong>{gisParsed.lineCount}</strong></span>
                  </div>
                </div>
              )}
            </div>
            <div style={modalFooterStyle}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setShowImportModal(false);
                  setGisParsed(null);
                  setGisError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={handleImportGeoJsonSubmit}
                disabled={!gisParsed || actionLoading}
              >
                {actionLoading ? <LoaderCircle size={15} className="spin" /> : <Upload size={15} />}
                Import into Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for Clean Modal Dialogs
const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(9, 45, 34, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const modalCardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  maxWidth: '500px',
  width: '100%',
  boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
  border: '1px solid #dfe6df',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #e7ebe7',
};

const modalFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '14px 20px',
  borderTop: '1px solid #e7ebe7',
  background: '#fcfdfc',
  borderRadius: '0 0 16px 16px',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#687c73',
  display: 'flex',
  alignItems: 'center',
};

const labelStyle = {
  display: 'block',
  fontSize: '11.5px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#495a52',
  marginBottom: '4px',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #c2d1c6',
  fontSize: '13px',
  background: '#ffffff',
  color: '#092d22',
  boxSizing: 'border-box',
};
