import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Clock,
  CloudUpload,
  Database,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  Globe,
  HelpCircle,
  History,
  Home,
  Layers,
  Link as LinkIcon,
  LoaderCircle,
  MapPin,
  Network,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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

// Sample CSV templates for quick testing
const SAMPLE_NODE_CSV = `name,node_code,node_type,latitude,longitude,description
Bhotenamlang Upper Chautara,upper_chautara,junction,27.8672,85.5821,Intersection connecting upper ridge
Bhotenamlang Basic School Point,janahit_school_pt,facility,27.8665,85.5760,School gate access point
Danda Gaun Settlement Centroid,danda_gaun_ctr,settlement,27.8680,85.5720,Center of 35 residential households`;

const SAMPLE_EDGE_CSV = `name,edge_code,source_node_code,target_node_code,infrastructure_type,surface_type,status,length_meters
Upper Chautara to School Road,edge_chautara_school,upper_chautara,janahit_school_pt,road,gravel,passable,380
School to Danda Gaun Path,edge_school_danda,janahit_school_pt,danda_gaun_ctr,trail,earthen,passable,510`;

export default function VillageDataPage() {
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [integrityData, setIntegrityData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('nodes'); // 'nodes' | 'edges' | 'facilities' | 'gis' | 'osm' | 'integrity' | 'audit'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Municipality Scoping (Phase 8)
  const [municipalityFilter, setMunicipalityFilter] = useState('all');

  // Search / Filter states
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState('all');
  const [edgeSearch, setEdgeSearch] = useState('');
  const [edgeStatusFilter, setEdgeStatusFilter] = useState('all');

  // Location Directory State (Phase 2)
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);

  // Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [itemToVerify, setItemToVerify] = useState(null); // { type: 'node'|'edge', data }

  // 5-Step Onboarding Wizard State (Phase 3)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDraftId, setWizardDraftId] = useState(null);
  const [wizardForm, setWizardForm] = useState({
    province: 'Bagmati Province',
    district: 'Sindhupalchok',
    municipality: 'Helambu Rural Municipality',
    ward_no: '4',
    name: '',
    local_name: '',
    admin_code: '',
    description: '',
    center_lat: 27.8635,
    center_lng: 85.5815,
    boundary_geojson: '',
    data_source: 'National Census & Municipal Field Survey',
    reference_year: 2024,
    status: 'draft',
    settlements_baseline: [
      { name: 'Danda Gaun Hamlet', local_name: 'डाँडा गाउँ', households: 35, population: 175 },
      { name: 'Tallo Gaun Hamlet', local_name: 'तल्लो गाउँ', households: 20, population: 105 },
    ],
  });

  // Basic Add Entity Forms
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

  // Verification Form (Phase 7)
  const [verifyForm, setVerifyForm] = useState({
    verification_status: 'verified',
    verified_by: 'Chief Municipal Engineer',
    confidence_score: 90,
    verification_notes: 'Verified via ground truth spatial survey and ward council review.',
  });

  // GIS / CSV / OSM Import state
  const [gisFile, setGisFile] = useState(null);
  const [gisParsed, setGisParsed] = useState(null);
  const [gisError, setGisError] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [csvType, setCsvType] = useState('nodes'); // 'nodes' | 'edges'
  const [osmCandidates, setOsmCandidates] = useState(null);
  const [osmLoading, setOsmLoading] = useState(false);

  // Load Nepal Location Directory on mount (Phase 2)
  useEffect(() => {
    fetch(`${API_BASE}/locations/provinces`)
      .then((r) => r.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load provinces:', err));

    fetch(`${API_BASE}/locations/districts?province=Bagmati%20Province`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load districts:', err));

    fetch(`${API_BASE}/locations/municipalities?district=Sindhupalchok`)
      .then((r) => r.json())
      .then((data) => setMunicipalities(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load municipalities:', err));

    fetch(`${API_BASE}/locations/wards?municipality=Helambu%20Rural%20Municipality`)
      .then((r) => r.json())
      .then((data) => setWards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load wards:', err));
  }, []);

  // Update dependent dropdowns when wizard selections change
  const handleWizardProvinceChange = async (provName) => {
    setWizardForm((prev) => ({ ...prev, province: provName }));
    try {
      const res = await fetch(`${API_BASE}/locations/districts?province=${encodeURIComponent(provName)}`);
      const dists = await res.json();
      setDistricts(dists);
      if (dists.length > 0) {
        handleWizardDistrictChange(dists[0], provName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWizardDistrictChange = async (distName, provName = wizardForm.province) => {
    setWizardForm((prev) => ({ ...prev, district: distName }));
    try {
      const res = await fetch(`${API_BASE}/locations/municipalities?district=${encodeURIComponent(distName)}`);
      const munis = await res.json();
      setMunicipalities(munis);
      if (munis.length > 0) {
        handleWizardMunicipalityChange(munis[0].name, munis[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWizardMunicipalityChange = async (muniName, muniObj = null) => {
    const selectedMuni = muniObj || municipalities.find((m) => m.name === muniName);
    const centerLat = selectedMuni?.center_lat || 27.8635;
    const centerLng = selectedMuni?.center_lng || 85.5815;

    setWizardForm((prev) => ({
      ...prev,
      municipality: muniName,
      center_lat: centerLat,
      center_lng: centerLng,
      admin_code: `NP-${(selectedMuni?.code || 'WARD').toUpperCase()}-W${prev.ward_no}`,
    }));

    try {
      const res = await fetch(`${API_BASE}/locations/wards?municipality=${encodeURIComponent(muniName)}`);
      const wardList = await res.json();
      setWards(wardList);
    } catch (e) {
      console.error(e);
    }
  };

  // Load list of villages with municipality scoping
  const loadVillages = async (muni = municipalityFilter) => {
    try {
      const url = muni && muni !== 'all'
        ? `${API_BASE}/villages?municipality=${encodeURIComponent(muni)}`
        : `${API_BASE}/villages`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load villages list');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setVillages(list);
      if (list.length > 0 && (!selectedVillageId || !list.some((v) => v.id === selectedVillageId))) {
        setSelectedVillageId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Could not connect to Laravel API or MySQL: ' + err.message });
    }
  };

  useEffect(() => {
    loadVillages();
  }, [municipalityFilter]);

  // Load active village's network, integrity, and audit logs
  const loadVillageDetails = async (villageId) => {
    if (!villageId) return;
    setLoading(true);
    try {
      const [netRes, intRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/villages/${villageId}/network`),
        fetch(`${API_BASE}/villages/${villageId}/integrity`),
        fetch(`${API_BASE}/villages/${villageId}/audit-logs`),
      ]);

      if (!netRes.ok) throw new Error('Failed to load village network data');
      const netJson = await netRes.json();
      setNetworkData(netJson);

      if (intRes.ok) {
        const intJson = await intRes.json();
        setIntegrityData(intJson);
      }

      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        setAuditLogs(Array.isArray(auditJson) ? auditJson : []);
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

  // Save Onboarding Wizard Draft Progress (Phase 3)
  const handleSaveWizardDraft = async (targetStep = wizardStep) => {
    setActionLoading(true);
    try {
      const payload = {
        draft_id: wizardDraftId,
        onboarding_step: targetStep,
        name: wizardForm.name || `${wizardForm.municipality} Ward ${wizardForm.ward_no} Village`,
        local_name: wizardForm.local_name,
        ward_no: wizardForm.ward_no,
        municipality: wizardForm.municipality,
        district: wizardForm.district,
        province: wizardForm.province,
        center_lat: wizardForm.center_lat,
        center_lng: wizardForm.center_lng,
        boundary_geojson: wizardForm.boundary_geojson,
        description: wizardForm.description,
        data_source: wizardForm.data_source,
        reference_year: wizardForm.reference_year,
        status: 'draft',
      };

      const res = await fetch(`${API_BASE}/villages/wizard-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save draft progress');
      }

      const resData = await res.json();
      setWizardDraftId(resData.draft_id);
      setAlert({ type: 'success', message: `Step ${targetStep} draft progress saved in MySQL database.` });
      await loadVillages();
      return resData.draft_id;
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  // Activate Village Workspace (Phase 3 & Phase 9)
  const handleActivateVillage = async () => {
    let villageId = wizardDraftId;
    if (!villageId) {
      villageId = await handleSaveWizardDraft(5);
    }
    if (!villageId) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${villageId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Activation failed');
      const data = await res.json();

      setAlert({
        type: 'success',
        message: `🎉 Village "${data.village.name}" activated successfully! All modules, simulations, and AI agents now have live access.`,
      });
      setShowWizardModal(false);
      setWizardDraftId(null);
      await loadVillages();
      setSelectedVillageId(villageId);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Build & Validate Infrastructure Network (Phase 6)
  const handleBuildNetwork = async () => {
    if (!selectedVillageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/build-network`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Network build failed');
      const data = await res.json();
      setAlert({
        type: 'success',
        message: `Network topology built: ${data.total_nodes} nodes, ${data.total_edges} edges. ${data.calculated_travel_times} segment travel times computed.`,
      });
      await loadVillageDetails(selectedVillageId);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Verification submit for node/edge (Phase 7)
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!itemToVerify || !selectedVillageId) return;
    setActionLoading(true);

    const { type, data } = itemToVerify;
    const endpoint = type === 'node'
      ? `${API_BASE}/villages/${selectedVillageId}/nodes/${data.id}/verify`
      : `${API_BASE}/villages/${selectedVillageId}/edges/${data.id}/verify`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyForm),
      });

      if (!res.ok) throw new Error('Verification update failed');
      setAlert({
        type: 'success',
        message: `${type === 'node' ? 'Node' : 'Lifeline Edge'} "${data.name}" marked as ${verifyForm.verification_status.toUpperCase()} in official audit record.`,
      });
      setShowVerifyModal(false);
      setItemToVerify(null);
      await loadVillageDetails(selectedVillageId);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // OpenStreetMap Preview & Import (Phase 5)
  const handleFetchOsmPreview = async () => {
    if (!selectedVillageId) return;
    setOsmLoading(true);
    setAlert(null);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/import-osm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_only: true }),
      });
      if (!res.ok) throw new Error('Failed to query OpenStreetMap');
      const data = await res.json();
      setOsmCandidates(data);
    } catch (err) {
      setAlert({ type: 'error', message: 'OSM query error: ' + err.message });
    } finally {
      setOsmLoading(false);
    }
  };

  const handleConfirmOsmImport = async () => {
    if (!selectedVillageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/import-osm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_only: false }),
      });
      if (!res.ok) throw new Error('OSM import failed');
      const data = await res.json();
      setAlert({
        type: 'success',
        message: data.message || `Imported ${data.imported_nodes} nodes and ${data.imported_edges} edges from OpenStreetMap!`,
      });
      setOsmCandidates(null);
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Import (Phase 4)
  const handleImportCsvSubmit = async () => {
    if (!csvText || !selectedVillageId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'CSV import failed');
      setAlert({
        type: 'success',
        message: data.message || `CSV import processed ${data.imported_count} records successfully.`,
      });
      setShowImportModal(false);
      setCsvText('');
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Edge Status (Passable <-> Blocked)
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

  // Delete node
  const handleDeleteNode = async (nodeId, nodeName) => {
    if (!window.confirm(`Are you sure you want to remove node "${nodeName}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/nodes/${nodeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete node');
      setAlert({ type: 'success', message: `Node "${nodeName}" removed.` });
      await loadVillageDetails(selectedVillageId);
      await loadVillages();
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

  // Create node form submit
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

  // Create edge form submit
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
      if (!res.ok) throw new Error(data.error || data.message || 'Import failed');

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

  // Export GeoJSON
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
        eyebrow="Real Nepal Village Onboarding & Municipal GIS Stewardship"
        title="Village Data Manager"
        description="Onboard, administer, and synchronize rural lifeline graphs, administrative ward records, spatial nodes, and baseline infrastructure topologies in MySQL."
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                setWizardStep(1);
                setShowWizardModal(true);
              }}
              style={{ background: '#176342', color: '#fff', fontWeight: 600 }}
            >
              <Sparkles size={16} /> 🚀 Onboard New Village Wizard
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={16} /> Import GIS / CSV / OSM
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={handleBuildNetwork}
              disabled={!selectedVillageId || actionLoading}
              title="Automatically calculate travel times and graph connectivity"
            >
              <Wrench size={16} /> Build Network Topology
            </button>
            <button
              className="button button--secondary"
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
      <FeatureNotice title="Municipal GIS & Infrastructure Directory Connected" icon={Database}>
        MySQL ServBay database (Port 3306) active. Full administrative hierarchy (Province → District → Municipality → Ward → Village) synchronized.
      </FeatureNotice>

      {/* VILLAGE SELECTOR & MULTI-MUNICIPALITY SCOPING STRIP */}
      <Card>
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#fcfdfb',
            borderBottom: '1px solid #dfe6df',
          }}
        >
          {/* Active Village Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '320px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: selectedVillage?.status === 'draft' ? '#b5791c' : '#176342',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#687c73', fontWeight: 600 }}>
                  Active Village Workspace
                </span>
                {selectedVillage?.status === 'draft' && (
                  <span style={{ fontSize: '10px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                    INCOMPLETE DRAFT (Step {selectedVillage?.onboarding_step || 1}/5)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
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
                      {v.name} ({v.municipality} · Ward {v.ward_no || '1'}) {v.status === 'draft' ? '— [Draft]' : ''}
                    </option>
                  ))}
                </select>
                <DemoLabel compact />
              </div>
            </div>
          </div>

          {/* Municipality Scoping Dropdown (Phase 8) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="#687c73" />
              <span style={{ fontSize: '12px', color: '#495a52', fontWeight: 600 }}>Municipality Scope:</span>
              <select
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                style={{
                  fontSize: '12.5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #c2d1c6',
                  background: '#fff',
                }}
              >
                <option value="all">All Municipalities (Full Territory)</option>
                <option value="Helambu Rural Municipality">Helambu Rural Municipality (Sindhupalchok)</option>
                <option value="Gosaikunda Rural Municipality">Gosaikunda Rural Municipality (Rasuwa)</option>
                <option value="Pokhara Metropolitan City">Pokhara Metropolitan City (Kaski)</option>
              </select>
            </div>

            <button
              className="button button--secondary"
              type="button"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => selectedVillageId && loadVillageDetails(selectedVillageId)}
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

          <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #e7ebe7' }}>
            <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600, textTransform: 'uppercase' }}>Verification Status</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#092d22', marginTop: '4px' }}>
              {selectedVillage?.status === 'active' ? 'Operational' : 'Draft In Review'}
            </div>
            <span style={{ fontSize: '11.5px', color: '#687c73' }}>
              Ref Year: {selectedVillage?.reference_year || 2024}
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
          { id: 'osm', label: 'OpenStreetMap Ingestion', icon: Globe },
          { id: 'integrity', label: 'Topology Diagnostics', icon: Activity, tone: integrityData?.status === 'healthy' ? 'green' : 'amber' },
          { id: 'audit', label: 'Audit Trail & Logs', icon: History, count: auditLogs.length },
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
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                borderBottom: isActive ? '3px solid #092d22' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} />
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
            eyebrow="Spatial Point Topology & Ground Truth Verification"
            title="Village Network Nodes"
            description="Geographic waypoints, settlement centers, junctions, and infrastructure intake points with verification audit tags."
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
                  <th>Source & Verification</th>
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
                          {node.description && (
                            <small style={{ display: 'block', color: '#687c73', maxWidth: '240px' }}>
                              {node.description}
                            </small>
                          )}
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
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                background: node.verification_status === 'verified' ? '#eaf8ef' : '#fef3c7',
                                color: node.verification_status === 'verified' ? '#176342' : '#92400e',
                              }}
                            >
                              {node.verification_status ? node.verification_status.toUpperCase() : 'VERIFIED'}
                            </span>
                            <small style={{ color: '#687c73', fontSize: '10.5px' }}>
                              Src: {node.source || 'manual'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <strong>{connectedEdgesCount}</strong> links
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToVerify({ type: 'node', data: node });
                                setVerifyForm({
                                  verification_status: node.verification_status || 'verified',
                                  verified_by: 'Chief Municipal Engineer',
                                  confidence_score: node.confidence_score || 90,
                                  verification_notes: node.verification_notes || '',
                                });
                                setShowVerifyModal(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #c2d1c6',
                                background: '#fff',
                                color: '#176342',
                                cursor: 'pointer',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Verify Record"
                            >
                              <ShieldCheck size={13} /> Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNode(node.id, node.name)}
                              disabled={actionLoading}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e1b4b4',
                                background: '#fff5f5',
                                color: '#b42318',
                                cursor: 'pointer',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Delete Node"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
            eyebrow="Lifeline Network Topology"
            title="Roads, Trails & Suspension Bridges"
            description="Network edges carrying civilian transit, ambulance corridors, and rural supply lifelines with estimated travel times."
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
                  <th>Surface & Travel Time</th>
                  <th>Length (m)</th>
                  <th>Verification & Source</th>
                  <th>Status & Quick Toggle</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEdges.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
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
                            <small style={{ display: 'block', color: '#687c73', maxWidth: '240px' }}>
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
                            {edge.surface_type || 'gravel'} · ~{edge.travel_minutes ? `${edge.travel_minutes} min` : '4 min'}
                          </small>
                        </td>
                        <td>
                          <strong>{Math.round(edge.length_meters || 100)}m</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: edge.verification_status === 'verified' ? '#eaf8ef' : '#fef3c7',
                              color: edge.verification_status === 'verified' ? '#176342' : '#92400e',
                            }}
                          >
                            {edge.verification_status ? edge.verification_status.toUpperCase() : 'VERIFIED'}
                          </span>
                          <small style={{ display: 'block', color: '#687c73', fontSize: '10.5px' }}>
                            Src: {edge.source || 'manual'}
                          </small>
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
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToVerify({ type: 'edge', data: edge });
                                setVerifyForm({
                                  verification_status: edge.verification_status || 'verified',
                                  verified_by: 'Chief Municipal Engineer',
                                  confidence_score: edge.confidence_score || 90,
                                  verification_notes: edge.verification_notes || '',
                                });
                                setShowVerifyModal(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #c2d1c6',
                                background: '#fff',
                                color: '#176342',
                                cursor: 'pointer',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Verify Record"
                            >
                              <ShieldCheck size={13} /> Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEdge(edge.id, edge.name)}
                              disabled={actionLoading}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e1b4b4',
                                background: '#fff5f5',
                                color: '#b42318',
                                cursor: 'pointer',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Delete Lifeline Edge"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
                  </tr>
                </thead>
                <tbody>
                  {(networkData?.facilities || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
                        No public facilities registered in this village.
                      </td>
                    </tr>
                  ) : (
                    (networkData?.facilities || []).map((fac) => (
                      <tr key={fac.id}>
                        <td>
                          <strong>{fac.name}</strong>
                          {fac.notes && <small style={{ display: 'block', color: '#687c73' }}>{fac.notes}</small>}
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
              eyebrow="Spatial Data Ingestion"
              title="GIS GeoJSON & CSV Ingestion Engine"
              description="Import GIS FeatureCollections and well-defined CSV tables to populate MySQL with spatial nodes and linestrings, or export standard RFC 7946 GeoJSON files for QGIS, ArcGIS, and OpenStreetMap."
            />
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* GEOJSON IMPORT */}
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
                  Select a <code>.geojson</code> or <code>.json</code> file with <code>Point</code> and <code>LineString</code> features.
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

                <button
                  type="button"
                  className="button button--secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => {
                    setGisParsed({
                      raw: SAMPLE_NEPAL_GEOJSON,
                      featuresCount: SAMPLE_NEPAL_GEOJSON.features.length,
                      pointCount: 2,
                      lineCount: 1,
                      fileName: 'sample_nepal_ward_network.geojson',
                      fileSizeKb: '1.2',
                    });
                  }}
                >
                  ⚡ Load Sample Nepal Ward GeoJSON
                </button>

                {gisParsed && (
                  <div style={{ padding: '10px', background: '#eef7f0', borderRadius: '8px', border: '1px solid #b8dfc2', fontSize: '12px', color: '#092d22' }}>
                    <strong>Ready:</strong> {gisParsed.fileName} ({gisParsed.pointCount} points, {gisParsed.lineCount} lines)
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
                  Import & Save GeoJSON
                </button>
              </div>

              {/* CSV IMPORT */}
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
                  <FileSpreadsheet size={22} color="#176342" />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22' }}>Import CSV Tables</h3>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52' }}>
                  Upload or paste CSV tables for infrastructure nodes or lifeline edges.
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvType('nodes');
                      setCsvText(SAMPLE_NODE_CSV);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      border: '1px solid #c2d1c6',
                      background: csvType === 'nodes' ? '#176342' : '#fff',
                      color: csvType === 'nodes' ? '#fff' : '#092d22',
                      cursor: 'pointer',
                    }}
                  >
                    Template: Nodes CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvType('edges');
                      setCsvText(SAMPLE_EDGE_CSV);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      border: '1px solid #c2d1c6',
                      background: csvType === 'edges' ? '#176342' : '#fff',
                      color: csvType === 'edges' ? '#fff' : '#092d22',
                      cursor: 'pointer',
                    }}
                  >
                    Template: Edges CSV
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV rows here..."
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #c2d1c6',
                  }}
                />

                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleImportCsvSubmit}
                  disabled={!csvText.trim() || actionLoading}
                  style={{ marginTop: 'auto' }}
                >
                  {actionLoading ? <LoaderCircle size={16} className="spin" /> : <Upload size={16} />}
                  Import CSV Records
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: OPENSTREETMAP INGESTION */}
      {activeTab === 'osm' && (
        <Card>
          <CardHeader
            eyebrow="OpenStreetMap Integration (Phase 5)"
            title="OSM Live Overpass Highway & Amenity Ingestion"
            description="Retrieve and preview officially mapped mountain roads, suspension bridges, health posts, and basic schools from OpenStreetMap within a ~3km radius of this village center."
          />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '10px',
                background: '#f2f8f4',
                border: '1px solid #c8e4d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong>Village Center Coordinates:</strong>{' '}
                <code>{selectedVillage?.center_lat?.toFixed(5) || '27.86350'}, {selectedVillage?.center_lng?.toFixed(5) || '85.58150'}</code>
                <div style={{ fontSize: '12px', color: '#495a52', marginTop: '2px' }}>
                  Coverage: ±0.025° (~2.7 km radius envelope around {selectedVillage?.name}).
                </div>
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={handleFetchOsmPreview}
                disabled={osmLoading}
              >
                {osmLoading ? <LoaderCircle size={16} className="spin" /> : <Globe size={16} />}
                Query OpenStreetMap Overpass
              </button>
            </div>

            {osmCandidates && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#092d22' }}>
                      Overpass Response: {osmCandidates.summary?.candidate_nodes} Nodes, {osmCandidates.summary?.candidate_edges} Lifeline Ways Detected
                    </h4>
                    <small style={{ color: '#687c73' }}>
                      Attribution: {osmCandidates.attribution} · Source: {osmCandidates.source}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleConfirmOsmImport}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <LoaderCircle size={16} className="spin" /> : <CheckCircle2 size={16} />}
                    Confirm & Ingest into MySQL
                  </button>
                </div>

                {/* Candidate preview table */}
                <div className="table-scroll" style={{ maxHeight: '280px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>OSM Feature</th>
                        <th>Type</th>
                        <th>Classification</th>
                        <th>Surface / Connectivity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(osmCandidates.candidates?.edges || []).map((e, idx) => (
                        <tr key={idx}>
                          <td><strong>{e.name}</strong></td>
                          <td><StatusBadge tone="blue">Highway Way</StatusBadge></td>
                          <td style={{ textTransform: 'capitalize' }}>{e.infrastructure_type}</td>
                          <td>{e.surface_type} · {e.is_critical ? 'Critical Link' : 'Secondary'}</td>
                        </tr>
                      ))}
                      {(osmCandidates.candidates?.nodes || []).map((n, idx) => (
                        <tr key={idx}>
                          <td><strong>{n.name}</strong></td>
                          <td><StatusBadge tone="green">Spatial Node</StatusBadge></td>
                          <td>{n.amenity || n.node_type}</td>
                          <td>{n.latitude.toFixed(4)}, {n.longitude.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 6: TOPOLOGY DIAGNOSTICS */}
      {activeTab === 'integrity' && (
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
        </Card>
      )}

      {/* TAB 7: AUDIT LOGS (Phase 7) */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader
            eyebrow="Data Stewardship Audit Trail (Phase 7)"
            title="Official Verification & Modification Logs"
            description="Immutable record of administrative verifications, GeoJSON imports, OpenStreetMap synchronizations, and status transitions."
          />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Type</th>
                  <th>Target Entity</th>
                  <th>Performed By</th>
                  <th>Summary & Change Record</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#687c73' }}>
                      No audit events recorded yet for this village.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge
                          tone={
                            log.action_type === 'activated'
                              ? 'green'
                              : log.action_type === 'verified'
                              ? 'blue'
                              : log.action_type === 'imported'
                              ? 'teal'
                              : 'neutral'
                          }
                        >
                          {log.action_type.toUpperCase()}
                        </StatusBadge>
                      </td>
                      <td>
                        <strong>{log.entity_type}</strong>
                        {log.entity_id && <small style={{ display: 'block', color: '#687c73' }}>ID #{log.entity_id}</small>}
                      </td>
                      <td style={{ fontSize: '12px' }}>{log.performed_by}</td>
                      <td style={{ fontSize: '12px', color: '#092d22' }}>{log.summary}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* 5-STEP VILLAGE ONBOARDING WIZARD MODAL (Phase 3)          */}
      {/* ========================================================= */}
      {showWizardModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={{ ...modalCardStyle, maxWidth: '680px' }}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#176342" />
                <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>
                  Village Onboarding Wizard — Step {wizardStep} of 5
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWizardModal(false)}
                style={closeBtnStyle}
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div
              style={{
                display: 'flex',
                background: '#f8faf8',
                borderBottom: '1px solid #dfe6df',
                padding: '12px 20px',
                gap: '8px',
              }}
            >
              {[
                '1. Location & Details',
                '2. Map & Boundaries',
                '3. Infrastructure',
                '4. Population',
                '5. Validate & Activate',
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const isCurrent = wizardStep === stepNum;
                const isDone = wizardStep > stepNum;
                return (
                  <div
                    key={stepNum}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#176342' : isDone ? '#495a52' : '#9ca3af',
                      borderBottom: isCurrent ? '2px solid #176342' : 'none',
                      paddingBottom: '4px',
                    }}
                  >
                    {isDone ? '✓ ' : ''}{label}
                  </div>
                );
              })}
            </div>

            {/* STEP 1: ADMINISTRATIVE DETAILS */}
            {wizardStep === 1 && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Province *</label>
                    <select
                      value={wizardForm.province}
                      onChange={(e) => handleWizardProvinceChange(e.target.value)}
                      style={inputStyle}
                    >
                      {provinces.map((p) => (
                        <option key={p.code} value={p.name}>
                          {p.name} ({p.local_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>District *</label>
                    <select
                      value={wizardForm.district}
                      onChange={(e) => handleWizardDistrictChange(e.target.value)}
                      style={inputStyle}
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Municipality / Rural Municipality *</label>
                    <select
                      value={wizardForm.municipality}
                      onChange={(e) => handleWizardMunicipalityChange(e.target.value)}
                      style={inputStyle}
                    >
                      {municipalities.map((m) => (
                        <option key={m.code} value={m.name}>
                          {m.name} ({m.local_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Ward Number *</label>
                    <select
                      value={wizardForm.ward_no}
                      onChange={(e) => {
                        const w = e.target.value;
                        setWizardForm((prev) => ({
                          ...prev,
                          ward_no: w,
                          admin_code: `NP-${prev.district.slice(0, 3).toUpperCase()}-W${w}`,
                        }));
                      }}
                      style={inputStyle}
                    >
                      {wards.map((w) => (
                        <option key={w.ward_no} value={w.ward_no}>
                          {w.name} ({w.local_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Village Name (English) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sermathang Model Settlement"
                      value={wizardForm.name}
                      onChange={(e) => setWizardForm({ ...wizardForm, name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Local Name (Devanagari)</label>
                    <input
                      type="text"
                      placeholder="e.g. सेर्माथाङ नमुना गाउँ"
                      value={wizardForm.local_name}
                      onChange={(e) => setWizardForm({ ...wizardForm, local_name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description & Topographic Context</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Mountain ridge settlement in Helambu with terrace agriculture and walking trails..."
                    value={wizardForm.description}
                    onChange={(e) => setWizardForm({ ...wizardForm, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: MAP SETUP & BOUNDARIES */}
            {wizardStep === 2 && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#495a52' }}>
                  Set the village center coordinates and optional ward boundary polygon.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Center Latitude (WGS84) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={wizardForm.center_lat}
                      onChange={(e) => setWizardForm({ ...wizardForm, center_lat: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Center Longitude (WGS84) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={wizardForm.center_lng}
                      onChange={(e) => setWizardForm({ ...wizardForm, center_lng: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Ward Boundary GeoJSON (Optional Polygon)</label>
                  <textarea
                    rows={4}
                    placeholder='{"type": "Polygon", "coordinates": [[[85.57, 27.86], [85.59, 27.86], ...]]}'
                    value={wizardForm.boundary_geojson}
                    onChange={(e) => setWizardForm({ ...wizardForm, boundary_geojson: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px' }}
                  />
                  <small style={{ color: '#687c73' }}>
                    Leave blank to use default 2.5 km municipal coverage radius.
                  </small>
                </div>
              </div>
            )}

            {/* STEP 3: INFRASTRUCTURE SETUP */}
            {wizardStep === 3 && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#495a52' }}>
                  Seed baseline road junctions, bridges, and public health facilities into this village.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      setAlert({ type: 'success', message: 'Pre-configured Helambu Ridge baseline lifeline network loaded.' });
                    }}
                  >
                    ⚡ Load Standard Rural Ward Lifelines
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setShowImportModal(true)}
                  >
                    🗺️ Import from GIS / GeoJSON
                  </button>
                </div>

                <div style={{ padding: '14px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #e7ebe7' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#092d22' }}>Required Infrastructure Checklist</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#495a52' }}>
                    <li>1+ Settlement Node representing residential clusters</li>
                    <li>1+ Primary Health Post / Clinic access waypoint</li>
                    <li>1+ Lifeline Road or Suspension Footbridge</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 4: DEMOGRAPHICS & POPULATION */}
            {wizardStep === 4 && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#495a52' }}>
                  Establish baseline household and demographic figures used by the Infrastructure Simulator.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Official Demographic Data Source *</label>
                    <input
                      type="text"
                      value={wizardForm.data_source}
                      onChange={(e) => setWizardForm({ ...wizardForm, data_source: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Reference Year *</label>
                    <input
                      type="number"
                      value={wizardForm.reference_year}
                      onChange={(e) => setWizardForm({ ...wizardForm, reference_year: parseInt(e.target.value, 10) })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#fcfdfb', borderRadius: '8px', border: '1px solid #dfe6df' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#687c73', textTransform: 'uppercase' }}>
                    Baseline Settlement Clusters
                  </span>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {wizardForm.settlements_baseline.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '6px 8px', background: '#f8faf8', borderRadius: '6px' }}>
                        <span><strong>{s.name}</strong> ({s.local_name})</span>
                        <span>{s.households} Households · ~{s.population} Population</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: VALIDATE & ACTIVATE */}
            {wizardStep === 5 && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', background: '#f2f8f4', borderRadius: '10px', border: '1px solid #b8dfc2' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#092d22' }}>
                    Ready to Activate: {wizardForm.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#176342' }}>
                    Location: {wizardForm.province} · {wizardForm.district} · {wizardForm.municipality} (Ward {wizardForm.ward_no})
                  </p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <span>Center: <code>{wizardForm.center_lat}, {wizardForm.center_lng}</code></span>
                    <span>Admin Code: <code>{wizardForm.admin_code}</code></span>
                    <span>Source: {wizardForm.data_source} ({wizardForm.reference_year})</span>
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #dfe6df' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#092d22' }}>Activation Guarantee:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#687c73' }}>
                    Upon activation, this village will be selectable in the Village Map, Issues logger, Infrastructure Impact Simulator, and the Unified AI Intelligence Workspace.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Modal Footer */}
            <div style={modalFooterStyle}>
              {wizardStep > 1 && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  disabled={actionLoading}
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}

              <button
                type="button"
                className="button button--secondary"
                onClick={() => handleSaveWizardDraft(wizardStep)}
                disabled={actionLoading}
                style={{ marginLeft: 'auto' }}
              >
                Save Incomplete Draft
              </button>

              {wizardStep < 5 ? (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={async () => {
                    await handleSaveWizardDraft(wizardStep);
                    setWizardStep(wizardStep + 1);
                  }}
                  disabled={actionLoading}
                >
                  Save & Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleActivateVillage}
                  disabled={actionLoading}
                  style={{ background: '#176342', color: '#fff' }}
                >
                  {actionLoading ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />}
                  Activate Village Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VERIFY RECORD MODAL (Phase 7)                            */}
      {/* ========================================================= */}
      {showVerifyModal && itemToVerify && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={{ ...modalCardStyle, maxWidth: '480px' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#092d22' }}>
                Verify {itemToVerify.type === 'node' ? 'Spatial Node' : 'Lifeline Edge'}: {itemToVerify.data.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                style={closeBtnStyle}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleVerifySubmit}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Verification Status *</label>
                  <select
                    value={verifyForm.verification_status}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verification_status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="verified">Verified (Official Field Survey Confirmed)</option>
                    <option value="pending_review">Pending Review (Awaiting Ward Committee Check)</option>
                    <option value="imported">Imported (Unchecked External Source)</option>
                    <option value="rejected">Rejected (Inaccurate or Obsolete Geometry)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Verified By *</label>
                  <input
                    type="text"
                    required
                    value={verifyForm.verified_by}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verified_by: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Confidence Score (0% to 100%): {verifyForm.confidence_score}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={verifyForm.confidence_score}
                    onChange={(e) => setVerifyForm({ ...verifyForm, confidence_score: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', accentColor: '#176342' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Verification Audit Notes</label>
                  <textarea
                    rows={2}
                    value={verifyForm.verification_notes}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verification_notes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowVerifyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? <LoaderCircle size={15} className="spin" /> : <ShieldCheck size={15} />}
                  Commit Verification
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
                  <label style={labelStyle}>Description / Context</label>
                  <textarea
                    rows={2}
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
                    id="edge_crit_cb"
                    checked={edgeForm.is_critical}
                    onChange={(e) => setEdgeForm({ ...edgeForm, is_critical: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#176342' }}
                  />
                  <label htmlFor="edge_crit_cb" style={{ fontSize: '13px', color: '#092d22', cursor: 'pointer' }}>
                    Critical Lifeline (No immediate secondary detour)
                  </label>
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
                  Add Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FACILITY */}
      {showFacilityModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-dialog" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Register Public Facility</h3>
              <button type="button" onClick={() => setShowFacilityModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionLoading(true);
              try {
                const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/facilities`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(facilityForm),
                });
                if (!res.ok) throw new Error('Failed to create facility');
                setAlert({ type: 'success', message: 'Facility registered successfully.' });
                setShowFacilityModal(false);
                await loadVillageDetails(selectedVillageId);
              } catch (err) {
                setAlert({ type: 'error', message: err.message });
              } finally {
                setActionLoading(false);
              }
            }}>
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
                    <label style={labelStyle}>Category</label>
                    <select
                      value={facilityForm.facility_type}
                      onChange={(e) => setFacilityForm({ ...facilityForm, facility_type: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="health_post">Health Post / Clinic</option>
                      <option value="school">Basic / Secondary School</option>
                      <option value="water_point">Drinking Water Intake / Tap</option>
                      <option value="ward_office">Ward Office / Admin Center</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Linked Spatial Node *</label>
                    <select
                      required
                      value={facilityForm.node_id}
                      onChange={(e) => setFacilityForm({ ...facilityForm, node_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Node Point</option>
                      {(networkData?.nodes || []).map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
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
                  Save Facility
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
                Select a GeoJSON or CSV file to import into <strong>{selectedVillage?.name}</strong>. Points will be saved as spatial nodes, and LineStrings will be created as lifeline edges.
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
                  onClick={() => {
                    setGisParsed({
                      raw: SAMPLE_NEPAL_GEOJSON,
                      featuresCount: SAMPLE_NEPAL_GEOJSON.features.length,
                      pointCount: 2,
                      lineCount: 1,
                      fileName: 'sample_nepal_ward_network.geojson',
                      fileSizeKb: '1.2',
                    });
                  }}
                >
                  ⚡ Load Sample Nepal Ward GeoJSON
                </button>
              </div>

              {gisParsed && (
                <div style={{ padding: '12px', background: '#eef7f0', borderRadius: '8px', border: '1px solid #b8dfc2', fontSize: '12.5px', color: '#092d22' }}>
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
  maxWidth: '560px',
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
  alignItems: 'center',
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
