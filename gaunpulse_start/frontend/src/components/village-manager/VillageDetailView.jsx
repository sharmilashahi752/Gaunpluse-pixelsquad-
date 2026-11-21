import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Layers,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Maximize2,
  Network,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Waypoints,
  Wrench,
  X,
} from 'lucide-react';
import DataQualityPanel from './DataQualityPanel';

const API_BASE = 'http://127.0.0.1:8000/api';

// Controller to fly map to village coordinates
function MapCenterController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, 15, { duration: 0.6 });
    }
  }, [center, map]);
  return null;
}

// Map click listener for adding infrastructure coordinates
function AddInfrastructureMapClick({ onPick }) {
  useMapEvents({
    click(e) {
      if (onPick) {
        onPick(
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6))
        );
      }
    },
  });
  return null;
}

// Custom DivIcons
function createNodeIcon(type) {
  let bg = '#176342';
  let svg = `<circle cx="12" cy="12" r="4" fill="white"/>`;

  if (type === 'settlement') {
    bg = '#124b35';
    svg = `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white"/>`;
  } else if (type === 'school') {
    bg = '#1d4ed8';
    svg = `<path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="white" stroke-width="2" fill="none"/>`;
  } else if (type === 'health_post' || type === 'health') {
    bg = '#0f766e';
    svg = `<path d="M12 5v14M5 12h14" stroke="white" stroke-width="2.5"/>`;
  } else if (type === 'water_source' || type === 'water') {
    bg = '#0284c7';
    svg = `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" fill="white"/>`;
  }

  return L.divIcon({
    className: 'custom-node-marker',
    html: `<div style="width:28px; height:28px; border-radius:50%; background:${bg}; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24">${svg}</svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function VillageDetailView({
  village,
  onBack,
  onOpenImportModal,
  onVillageUpdated,
}) {
  const [networkData, setNetworkData] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [integrityData, setIntegrityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'roads' | 'facilities' | 'settlements' | 'quality' | 'records'
  const [alert, setAlert] = useState(null);

  // Add Infrastructure Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState('road'); // 'road' | 'bridge' | 'school' | 'health_post' | 'water' | 'settlement'
  const [infraForm, setInfraForm] = useState({
    name: '',
    node_type: 'junction',
    latitude: village?.center_lat || 27.8635,
    longitude: village?.center_lng || 85.5815,
    source_node_id: '',
    target_node_id: '',
    infrastructure_type: 'road',
    surface_type: 'gravel',
    status: 'passable',
    length_meters: 350,
    is_critical: false,
    capacity: 'Standard Rural Facility',
    households: 25,
    population: 120,
    notes: '',
  });

  // Load Village Data on mount
  const loadVillageData = async () => {
    if (!village?.id) return;
    setLoading(true);
    try {
      const [netRes, readRes, intRes] = await Promise.all([
        fetch(`${API_BASE}/villages/${village.id}/network`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/villages/${village.id}/network-readiness`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/villages/${village.id}/integrity`).then((r) => r.json()).catch(() => null),
      ]);

      setNetworkData(netRes);
      setReadinessData(readRes);
      setIntegrityData(intRes);
    } catch (e) {
      console.error('Error loading village details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVillageData();
  }, [village?.id]);

  // Toggle Road Status (passable <-> blocked)
  const handleToggleEdgeStatus = async (edge) => {
    const nextStatus = edge.status === 'blocked' ? 'passable' : 'blocked';
    try {
      const res = await fetch(`${API_BASE}/villages/${village.id}/edges/${edge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...edge, status: nextStatus }),
      });
      if (res.ok) {
        setAlert({ type: 'success', message: `Status updated for "${edge.name}".` });
        loadVillageData();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Delete Node
  const handleDeleteNode = async (nodeId, nodeName) => {
    if (!window.confirm(`Are you sure you want to remove node "${nodeName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/villages/${village.id}/nodes/${nodeId}`, { method: 'DELETE' });
      if (res.ok) {
        setAlert({ type: 'success', message: `Node "${nodeName}" deleted.` });
        loadVillageData();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Delete Edge
  const handleDeleteEdge = async (edgeId, edgeName) => {
    if (!window.confirm(`Are you sure you want to remove road/bridge "${edgeName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/villages/${village.id}/edges/${edgeId}`, { method: 'DELETE' });
      if (res.ok) {
        setAlert({ type: 'success', message: `Lifeline "${edgeName}" deleted.` });
        loadVillageData();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Delete Facility
  const handleDeleteFacility = async (facId, facName) => {
    if (!window.confirm(`Are you sure you want to remove facility "${facName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/villages/${village.id}/facilities/${facId}`, { method: 'DELETE' });
      if (res.ok) {
        setAlert({ type: 'success', message: `Facility "${facName}" deleted.` });
        loadVillageData();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Add Infrastructure Submission
  const handleAddInfrastructure = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (addCategory === 'road' || addCategory === 'bridge') {
        // Create Edge
        const payload = {
          name: infraForm.name,
          edge_code: `edge_${Date.now()}`,
          source_node_id: Number(infraForm.source_node_id),
          target_node_id: Number(infraForm.target_node_id),
          infrastructure_type: addCategory === 'bridge' ? 'bridge' : infraForm.infrastructure_type,
          surface_type: addCategory === 'bridge' ? 'suspension' : infraForm.surface_type,
          status: infraForm.status,
          length_meters: Number(infraForm.length_meters) || 300,
          is_critical: addCategory === 'bridge' ? true : infraForm.is_critical,
          notes: infraForm.notes,
        };

        const res = await fetch(`${API_BASE}/villages/${village.id}/edges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create road/bridge link.');
      } else {
        // Create Point Node (School, Health, Water, Settlement)
        const nodeType =
          addCategory === 'school'
            ? 'school'
            : addCategory === 'health_post'
            ? 'health_post'
            : addCategory === 'water'
            ? 'water_source'
            : addCategory === 'settlement'
            ? 'settlement'
            : 'junction';

        const nodePayload = {
          name: infraForm.name,
          node_code: `node_${Date.now()}`,
          node_type: nodeType,
          latitude: Number(infraForm.latitude),
          longitude: Number(infraForm.longitude),
          description: infraForm.notes,
        };

        const nodeRes = await fetch(`${API_BASE}/villages/${village.id}/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nodePayload),
        });
        if (!nodeRes.ok) throw new Error('Failed to register node point.');
        const nodeData = await nodeRes.json();

        // If facility, also register facility link
        if (addCategory === 'school' || addCategory === 'health_post') {
          await fetch(`${API_BASE}/villages/${village.id}/facilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: infraForm.name,
              facility_type: addCategory === 'school' ? 'school' : 'health_post',
              node_id: nodeData.node?.id || nodeData.id,
              capacity: infraForm.capacity,
              notes: infraForm.notes,
            }),
          });
        }
      }

      setAlert({ type: 'success', message: `Added "${infraForm.name}" successfully.` });
      setShowAddModal(false);
      setInfraForm({
        name: '',
        node_type: 'junction',
        latitude: village?.center_lat || 27.8635,
        longitude: village?.center_lng || 85.5815,
        source_node_id: '',
        target_node_id: '',
        infrastructure_type: 'road',
        surface_type: 'gravel',
        status: 'passable',
        length_meters: 350,
        is_critical: false,
        capacity: 'Standard Rural Facility',
        households: 25,
        population: 120,
        notes: '',
      });
      loadVillageData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const centerCoords = [village?.center_lat || 27.8635, village?.center_lng || 85.5815];
  const nodes = networkData?.nodes || [];
  const edges = networkData?.edges || [];
  const facilities = networkData?.facilities || [];
  const settlements = networkData?.settlements || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Detail Topbar with Breadcrumb & Quick Actions */}
      <div className="vm-detail-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBack}
            className="ai-back-btn"
            title="Return to Village Directory"
          >
            <ArrowLeft size={14} /> Back to Directory
          </button>
          <div className="vm-breadcrumb">
            <span>Village Data Manager</span>
            <ChevronRight size={14} />
            <strong>{village.name}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="button button--primary"
            style={{
              background: '#176342',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={15} /> Add Infrastructure
          </button>

          <button
            type="button"
            onClick={() => onOpenImportModal && onOpenImportModal(village)}
            className="button button--secondary"
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={14} /> Import Map Data
          </button>

          <a
            href={`#/village-map?villageId=${village.id}`}
            className="button button--secondary"
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <MapPin size={14} /> View on Map
          </a>

          <a
            href={`#/simulations?villageId=${village.id}`}
            className="button button--secondary"
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <Activity size={14} /> Run Simulation
          </a>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: alert.type === 'success' ? '#eaf8ef' : '#fdf2f2',
            border: `1px solid ${alert.type === 'success' ? '#176342' : '#b42318'}`,
            color: alert.type === 'success' ? '#092d22' : '#912018',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alert.type === 'success' ? <CheckCircle2 size={16} color="#176342" /> : <AlertTriangle size={16} color="#b42318" />}
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

      {/* 2. Village Summary Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dfe6df',
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#176342',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#092d22' }}>
                {village.name}
              </h2>
              {village.local_name && (
                <span style={{ fontSize: '14px', color: '#687c73', fontWeight: 600 }}>
                  ({village.local_name})
                </span>
              )}
              <span className={`vm-quality-badge ${village.status === 'draft' ? 'vm-quality-badge--draft' : 'vm-quality-badge--verified'}`}>
                {village.status === 'draft' ? 'Draft Onboarding' : 'Operational'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#495a52', marginTop: '4px', flexWrap: 'wrap' }}>
              <span>📍 {village.province} · {village.district}</span>
              <span>🏛️ {village.municipality} (Ward {village.ward_no || '1'})</span>
              <span>🌐 {centerCoords[0]?.toFixed(4)}, {centerCoords[1]?.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '8px 14px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>NODES</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#092d22' }}>{nodes.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 14px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>LIFELINES</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#092d22' }}>{edges.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 14px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>FACILITIES</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#092d22' }}>{facilities.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 14px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>SETTLEMENTS</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#092d22' }}>{settlements.length}</div>
          </div>
        </div>
      </div>

      {/* 3. Category Navigation Tabs */}
      <div className="vm-tabs">
        {[
          { id: 'overview', label: 'Overview & Map', icon: MapPin },
          { id: 'roads', label: 'Roads & Bridges', icon: Waypoints, count: edges.length },
          { id: 'facilities', label: 'Schools & Health', icon: HeartPulse, count: facilities.length },
          { id: 'settlements', label: 'Settlements & Water', icon: Home, count: settlements.length },
          { id: 'quality', label: 'Data Quality & Readiness', icon: ShieldCheck },
          { id: 'records', label: 'Raw Records', icon: Database, count: nodes.length + edges.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`vm-tab-btn ${isActive ? 'vm-tab-btn--active' : ''}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#e7ebe7',
                    color: isActive ? '#ffffff' : '#495a52',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW & MAP ================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              height: '420px',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid #dfe6df',
              boxShadow: '0 4px 14px rgba(9, 45, 34, 0.05)',
            }}
          >
            <MapContainer center={centerCoords} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapCenterController center={centerCoords} />

              {/* Render Nodes */}
              {nodes.map((node) => {
                const lat = Number(node.latitude);
                const lng = Number(node.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                const icon = createNodeIcon(node.node_type || node.type);
                return (
                  <Marker key={`node-${node.id}`} position={[lat, lng]} icon={icon}>
                    <Popup>
                      <div style={{ fontSize: '13px' }}>
                        <strong>{node.name}</strong>
                        <div style={{ fontSize: '11px', color: '#687c73', textTransform: 'capitalize' }}>
                          Type: {node.node_type || 'junction'}
                        </div>
                        {node.description && <div style={{ marginTop: '4px' }}>{node.description}</div>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Render Edges */}
              {edges.map((edge) => {
                if (edge.geometry && Array.isArray(edge.geometry.coordinates)) {
                  const positions = edge.geometry.coordinates.map((c) => [c[1], c[0]]);
                  const isBlocked = edge.status === 'blocked';
                  const isBridge = edge.infrastructure_type === 'bridge' || edge.type === 'bridge';
                  return (
                    <Polyline
                      key={`edge-${edge.id}`}
                      positions={positions}
                      pathOptions={{
                        color: isBlocked ? '#dc2626' : isBridge ? '#0284c7' : '#176342',
                        weight: isBridge ? 5 : 4,
                        dashArray: isBlocked ? '6, 6' : undefined,
                      }}
                    >
                      <Tooltip sticky>
                        {edge.name} ({edge.surface_type || 'trail'}) · {edge.status}
                      </Tooltip>
                    </Polyline>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>

          {/* Infrastructure Highlights */}
          <div className="vm-infra-grid">
            <div className="vm-infra-card">
              <div className="vm-infra-card__icon">
                <Waypoints size={20} />
              </div>
              <div>
                <div className="vm-infra-card__count">{edges.length}</div>
                <div className="vm-infra-card__label">Active Lifelines</div>
              </div>
            </div>
            <div className="vm-infra-card">
              <div className="vm-infra-card__icon">
                <Building size={20} />
              </div>
              <div>
                <div className="vm-infra-card__count">{facilities.length}</div>
                <div className="vm-infra-card__label">Facilities Mapped</div>
              </div>
            </div>
            <div className="vm-infra-card">
              <div className="vm-infra-card__icon">
                <Home size={20} />
              </div>
              <div>
                <div className="vm-infra-card__count">{settlements.length}</div>
                <div className="vm-infra-card__label">Settlement Hamlets</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ROADS & BRIDGES ================= */}
      {activeTab === 'roads' && (
        <div style={{ background: '#ffffff', border: '1px solid #dfe6df', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22', fontWeight: 750 }}>
              Roads, Trails & Bridges ({edges.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setAddCategory('road');
                setShowAddModal(true);
              }}
              className="button button--secondary"
              style={{ fontSize: '12.5px' }}
            >
              <Plus size={14} /> Add Road
            </button>
          </div>

          {edges.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#687c73' }}>
              No roads or bridges registered yet. Click <strong>Add Road</strong> or <strong>Import Map Data</strong> to populate.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {edges.map((edge) => (
                <div
                  key={edge.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#f8faf8',
                    border: '1px solid #e7ebe7',
                    borderRadius: '10px',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#092d22' }}>{edge.name}</strong>
                      {edge.is_critical && (
                        <span style={{ fontSize: '10.5px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          CRITICAL LIFELINE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#687c73', marginTop: '2px' }}>
                      Type: <strong>{edge.infrastructure_type || edge.type || 'road'}</strong> · Surface: <strong>{edge.surface_type || 'gravel'}</strong> · Length: <strong>{edge.length_meters || 300}m</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleEdgeStatus(edge)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: edge.status === 'blocked' ? '#fee2e2' : '#dcfce7',
                        color: edge.status === 'blocked' ? '#991b1b' : '#166534',
                      }}
                      title="Click to toggle status"
                    >
                      {edge.status === 'blocked' ? '🔴 Blocked' : '🟢 Passable'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEdge(edge.id, edge.name)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                      title="Remove lifeline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SCHOOLS & HEALTH ================= */}
      {activeTab === 'facilities' && (
        <div style={{ background: '#ffffff', border: '1px solid #dfe6df', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22', fontWeight: 750 }}>
              Essential Facilities ({facilities.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setAddCategory('school');
                setShowAddModal(true);
              }}
              className="button button--secondary"
              style={{ fontSize: '12.5px' }}
            >
              <Plus size={14} /> Add Facility
            </button>
          </div>

          {facilities.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#687c73' }}>
              No health posts or schools registered yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  style={{
                    padding: '14px',
                    background: '#f8faf8',
                    border: '1px solid #e7ebe7',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#176342', fontWeight: 700 }}>
                        {fac.facility_type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFacility(fac.id, fac.name)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h4 style={{ margin: '6px 0 2px', fontSize: '15px', color: '#092d22', fontWeight: 700 }}>
                      {fac.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#687c73' }}>
                      {fac.capacity || 'Standard rural service facility'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: SETTLEMENTS & WATER ================= */}
      {activeTab === 'settlements' && (
        <div style={{ background: '#ffffff', border: '1px solid #dfe6df', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#092d22', fontWeight: 750 }}>
            Residential Settlement Clusters & Water Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settlements.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8faf8',
                  border: '1px solid #e7ebe7',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px', color: '#092d22' }}>{s.name}</strong>
                  {s.local_name && <span style={{ fontSize: '12px', color: '#687c73', marginLeft: '6px' }}>({s.local_name})</span>}
                </div>
                <div style={{ fontSize: '13px', color: '#176342', fontWeight: 700 }}>
                  {s.households || 0} Households · ~{s.population || (s.households ? s.households * 5 : 0)} People
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: DATA QUALITY & READINESS ================= */}
      {activeTab === 'quality' && (
        <DataQualityPanel
          village={village}
          readinessData={readinessData}
          integrityData={integrityData}
          onRefresh={loadVillageData}
          loading={loading}
        />
      )}

      {/* ================= TAB 6: RAW RECORDS ================= */}
      {activeTab === 'records' && (
        <div style={{ background: '#ffffff', border: '1px solid #dfe6df', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#092d22', fontWeight: 750 }}>
            All Spatial Graph Nodes ({nodes.length})
          </h3>
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8faf8', borderBottom: '1px solid #e7ebe7' }}>
                  <th style={{ padding: '8px 10px' }}>ID</th>
                  <th style={{ padding: '8px 10px' }}>Name</th>
                  <th style={{ padding: '8px 10px' }}>Type</th>
                  <th style={{ padding: '8px 10px' }}>Latitude</th>
                  <th style={{ padding: '8px 10px' }}>Longitude</th>
                  <th style={{ padding: '8px 10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid #f0f2f0' }}>
                    <td style={{ padding: '8px 10px', color: '#687c73' }}>#{n.id}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{n.name}</td>
                    <td style={{ padding: '8px 10px' }}>{n.node_type || n.type}</td>
                    <td style={{ padding: '8px 10px' }}>{n.latitude}</td>
                    <td style={{ padding: '8px 10px' }}>{n.longitude}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteNode(n.id, n.name)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ADD INFRASTRUCTURE MODAL ================= */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 45, 34, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(9, 45, 34, 0.25)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#092d22', fontWeight: 800 }}>
                + Add Infrastructure
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#687c73' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Selector Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'road', label: 'Road / Path' },
                { id: 'bridge', label: 'Bridge' },
                { id: 'school', label: 'School' },
                { id: 'health_post', label: 'Health Post' },
                { id: 'water', label: 'Water Point' },
                { id: 'settlement', label: 'Settlement' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAddCategory(c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: addCategory === c.id ? 700 : 500,
                    background: addCategory === c.id ? '#176342' : '#f0f4f1',
                    color: addCategory === c.id ? '#ffffff' : '#092d22',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddInfrastructure} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                  Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${addCategory === 'bridge' ? 'Simkhola Suspension Bridge' : addCategory === 'road' ? 'Ridge Village Link Road' : 'Janahit Primary School'}`}
                  value={infraForm.name}
                  onChange={(e) => setInfraForm({ ...infraForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                />
              </div>

              {/* Edge Fields: Road or Bridge */}
              {(addCategory === 'road' || addCategory === 'bridge') ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                        Start Node *
                      </label>
                      <select
                        required
                        value={infraForm.source_node_id}
                        onChange={(e) => setInfraForm({ ...infraForm, source_node_id: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                      >
                        <option value="">Select Start Point</option>
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} (#{n.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                        End Node *
                      </label>
                      <select
                        required
                        value={infraForm.target_node_id}
                        onChange={(e) => setInfraForm({ ...infraForm, target_node_id: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                      >
                        <option value="">Select Destination</option>
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} (#{n.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                        Surface / Type
                      </label>
                      <select
                        value={infraForm.surface_type}
                        onChange={(e) => setInfraForm({ ...infraForm, surface_type: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                      >
                        <option value="gravel">Gravel Road</option>
                        <option value="paved">Paved (Asphalt / Concrete)</option>
                        <option value="earthen">Earthen Trail</option>
                        <option value="suspension">Suspension Footbridge</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                        Length (Meters)
                      </label>
                      <input
                        type="number"
                        value={infraForm.length_meters}
                        onChange={(e) => setInfraForm({ ...infraForm, length_meters: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Point Node Fields */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                      Latitude (WGS84) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={infraForm.latitude}
                      onChange={(e) => setInfraForm({ ...infraForm, latitude: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                      Longitude (WGS84) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={infraForm.longitude}
                      onChange={(e) => setInfraForm({ ...infraForm, longitude: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '4px' }}>
                  Notes / Operational Detail
                </label>
                <textarea
                  rows={2}
                  value={infraForm.notes}
                  onChange={(e) => setInfraForm({ ...infraForm, notes: e.target.value })}
                  placeholder="e.g. Critical access lifeline during monsoon flash floods..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c8d8cc', fontSize: '13px' }}
                />
              </div>

              {/* Advanced Options Accordion */}
              <details className="vm-advanced-toggle">
                <summary>Advanced Options</summary>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#687c73' }}>
                  Administrative tags and technical geometry will be automatically generated upon creation.
                </div>
              </details>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="button button--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="button button--primary"
                  style={{ background: '#176342', color: '#ffffff', fontWeight: 700 }}
                >
                  {actionLoading ? <Loader2 size={16} className="spin" /> : 'Save Infrastructure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
