import { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  Filter,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  TriangleAlert,
  Waypoints,
  X,
  Zap,
} from 'lucide-react';
import InteractiveVillageMap from '../components/InteractiveVillageMap';
import { Card, CardHeader, DemoLabel, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';

export default function VillageMapPage() {
  // Saved Villages & Active Selection
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [villageData, setVillageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNationwideView, setIsNationwideView] = useState(false);

  // Search State across Nepal
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocationMarker, setSelectedLocationMarker] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickTargetField, setPickTargetField] = useState(null); // 'village' | 'node'

  // Selected Assets
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Modals
  const [isAddVillageModalOpen, setIsAddVillageModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  // Phase 2, 5 & 6: Automatic Infrastructure Discovery & Import Dashboard State
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryRadius, setDiscoveryRadius] = useState(2000); // meters (Phase 3)
  const [discoveryData, setDiscoveryData] = useState(null);
  const [selectedFeatureMap, setSelectedFeatureMap] = useState({}); // featureId -> bool
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [importingLoading, setImportingLoading] = useState(false);

  // Administrative Cascade Data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [hierarchyAudit, setHierarchyAudit] = useState(null);

  // Form States: New Village
  const [villageForm, setVillageForm] = useState({
    name: '',
    local_name: '',
    province: 'Bagmati Province',
    district: 'Sindhupalchok',
    municipality: 'Helambu Rural Municipality',
    ward_no: '1',
    center_lat: '',
    center_lng: '',
    description: '',
    data_source: 'Municipal Field Survey',
    verification_status: 'verified',
  });

  // Form States: New Asset
  const [assetCategory, setAssetCategory] = useState('point'); // 'point' | 'linear'
  const [pointForm, setPointForm] = useState({
    name: '',
    node_type: 'settlement',
    latitude: '',
    longitude: '',
    households: '',
    population: '',
    description: '',
  });

  const [linearForm, setLinearForm] = useState({
    name: '',
    infrastructure_type: 'road',
    source_node_id: '',
    target_node_id: '',
    surface_type: 'gravel',
    status: 'operational',
    length_meters: '350',
    is_critical: false,
    notes: '',
  });

  // Diagnostic State
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Feedback Notification Banner
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 6000);
  };

  // 1. Initial Load: Villages, Provinces, and Administrative Hierarchy Audit
  useEffect(() => {
    loadVillages();
    fetch('http://127.0.0.1:8000/api/locations/provinces')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch((err) => console.error('Failed to load provinces:', err));

    // Audit administrative hierarchy integrity
    fetch('http://127.0.0.1:8000/api/villages/audit-hierarchy')
      .then((res) => res.json())
      .then((data) => {
        if (data.inconsistent_count > 0) {
          setHierarchyAudit(data);
        }
      })
      .catch((err) => console.error('Hierarchy audit failed:', err));
  }, []);

  const loadVillages = () => {
    fetch('http://127.0.0.1:8000/api/villages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVillages(data);
          if (!selectedVillageId) {
            setSelectedVillageId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load villages:', err));
  };

  // 2. Cascade Districts when Province changes
  useEffect(() => {
    if (!villageForm.province) return;
    fetch(`http://127.0.0.1:8000/api/locations/districts?province=${encodeURIComponent(villageForm.province)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDistricts(data);
          if (data.length > 0 && !data.includes(villageForm.district)) {
            setVillageForm((prev) => ({ ...prev, district: data[0] }));
          }
        }
      })
      .catch((err) => console.error('Failed to load districts:', err));
  }, [villageForm.province]);

  // 3. Cascade Municipalities when District changes (Phase 1 Fix: auto-reset to avoid cross-district mismatch)
  useEffect(() => {
    if (!villageForm.district) return;
    fetch(`http://127.0.0.1:8000/api/locations/municipalities?district=${encodeURIComponent(villageForm.district)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMunicipalities(data);
          const currentMuniValid = data.some((m) => m.name === villageForm.municipality);
          if (!currentMuniValid && data.length > 0) {
            setVillageForm((prev) => ({ ...prev, municipality: data[0].name }));
          }
        }
      })
      .catch((err) => console.error('Failed to load municipalities:', err));
  }, [villageForm.district]);

  // 4. Load Active Village Network
  useEffect(() => {
    if (!selectedVillageId) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`)
      .then((res) => res.json())
      .then((data) => {
        setVillageData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load village network:', err);
        setLoading(false);
      });
  }, [selectedVillageId]);

  // 5. Debounced Nepal Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`http://127.0.0.1:8000/api/locations/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(Array.isArray(data) ? data : []);
          setIsSearching(false);
          setShowSearchResults(true);
        })
        .catch((err) => {
          console.error('Search failed:', err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map Click Handler
  const handleMapClick = (latlng) => {
    setClickedCoords(latlng);

    if (isPickingLocation) {
      if (pickTargetField === 'village') {
        setVillageForm((prev) => ({
          ...prev,
          center_lat: latlng.lat,
          center_lng: latlng.lng,
        }));
        setIsPickingLocation(false);
        setPickTargetField(null);
        setIsAddVillageModalOpen(true);
        showNotification(`Selected coordinates: ${latlng.lat}, ${latlng.lng}`);
      } else if (pickTargetField === 'node') {
        setPointForm((prev) => ({
          ...prev,
          latitude: latlng.lat,
          longitude: latlng.lng,
        }));
        setIsPickingLocation(false);
        setPickTargetField(null);
        setIsAddAssetModalOpen(true);
        showNotification(`Asset coordinates set: ${latlng.lat}, ${latlng.lng}`);
      }
      return;
    }

    setSelectedLocationMarker({
      lat: latlng.lat,
      lng: latlng.lng,
      title: 'Clicked Geographic Point',
      subtitle: `Coordinates: ${latlng.lat.toFixed(5)}°N, ${latlng.lng.toFixed(5)}°E`,
      type: 'clicked_target',
      zoom: 14,
    });
  };

  // Select Search Item
  const handleSelectSearchResult = (item) => {
    setShowSearchResults(false);
    setSearchQuery(item.title);

    if (item.type === 'saved_village' && item.id) {
      setIsNationwideView(false);
      setSelectedVillageId(item.id);
      setSelectedLocationMarker(null);
      showNotification(`Switched to registered village: ${item.title}`);
    } else {
      setIsNationwideView(false);
      setSelectedLocationMarker({
        lat: item.lat,
        lng: item.lng,
        title: item.title,
        subtitle: item.subtitle,
        type: 'search_target',
        zoom: item.zoom || 13,
        itemData: item,
      });
      showNotification(`Navigated to ${item.title} (${item.subtitle})`);
    }
  };

  // Quick Add Village from Marker
  const handleQuickAddVillage = (marker) => {
    const rawTitle = (marker.title || '').replace(' District', '').replace(' Rural Municipality', '').replace(' Municipality', '');
    setVillageForm({
      name: rawTitle,
      local_name: '',
      center_lat: marker.lat,
      center_lng: marker.lng,
      province: marker.itemData?.province || 'Gandaki Province',
      district: marker.itemData?.district || 'Mustang',
      municipality: marker.itemData?.municipality || 'Gharapjhong Rural Municipality',
      ward_no: '1',
      description: '',
      data_source: 'Field Survey / OSM',
      verification_status: 'verified',
    });
    setIsAddVillageModalOpen(true);
  };

  // Quick Add Node from Marker
  const handleQuickAddNode = (marker) => {
    setPointForm((prev) => ({
      ...prev,
      latitude: marker.lat,
      longitude: marker.lng,
    }));
    setAssetCategory('point');
    setIsAddAssetModalOpen(true);
  };

  // Submit New Village -> Automatically triggers Discovery (Phase 5)
  const handleCreateVillage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: villageForm.name,
        local_name: villageForm.local_name || null,
        province: villageForm.province,
        district: villageForm.district,
        municipality: villageForm.municipality,
        ward_no: villageForm.ward_no || '1',
        center_lat: parseFloat(villageForm.center_lat),
        center_lng: parseFloat(villageForm.center_lng),
        description: villageForm.description,
        data_source: villageForm.data_source,
        verification_status: villageForm.verification_status,
      };

      const res = await fetch('http://127.0.0.1:8000/api/villages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create village');
      }

      const newVillage = await res.json();
      setIsAddVillageModalOpen(false);
      showNotification(`Village "${newVillage.name}" registered! Starting automatic infrastructure discovery...`);

      // Refresh village list and switch to new village
      loadVillages();
      setSelectedVillageId(newVillage.id);
      setIsNationwideView(false);
      setSelectedLocationMarker(null);

      // Phase 5: Automatically launch discovery workflow for newly created village
      triggerDiscovery(newVillage.id, 2000);
    } catch (err) {
      alert('Error creating village: ' + err.message);
    }
  };

  // Trigger Infrastructure Discovery (Phase 2, 3 & 4)
  const triggerDiscovery = async (villageId, radius = 2000) => {
    const vId = villageId || selectedVillageId;
    if (!vId) return;

    setDiscoveryLoading(true);
    setIsDiscoveryModalOpen(true);
    setDiscoveryRadius(radius);
    setDiscoveryData(null);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${vId}/discover-osm?radius=${radius}`);
      if (!res.ok) {
        throw new Error(`Server returned error code ${res.status}`);
      }
      const data = await res.json();
      setDiscoveryData(data);

      // Initialize selected checkboxes (select all valid non-duplicates)
      const initialMap = {};
      (data.features || []).forEach((feat) => {
        initialMap[feat.id] = (feat.selected ?? true) && !feat.is_duplicate;
      });
      setSelectedFeatureMap(initialMap);
    } catch (err) {
      alert('Automatic discovery failed: ' + err.message);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  // Confirm and Save Selected Discovery Features (Phase 4, 7, 8)
  const handleConfirmImport = async () => {
    if (!selectedVillageId || !discoveryData) return;

    const allFeatures = discoveryData.features || [];
    const approvedFeatures = allFeatures.filter((f) => selectedFeatureMap[f.id]);

    if (approvedFeatures.length === 0) {
      alert('Please select at least one feature to import.');
      return;
    }

    setImportingLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/confirm-osm-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          features: approvedFeatures,
          batch_id: `osm_batch_${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Import confirmation failed');
      }

      const result = await res.json();
      setIsDiscoveryModalOpen(false);
      showNotification(`Import complete! ${result.imported_nodes} nodes and ${result.imported_edges} lifeline edges saved to MySQL.`);

      // Refresh village network immediately
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
      loadVillages();
    } catch (err) {
      alert('Error saving imported features: ' + err.message);
    } finally {
      setImportingLoading(false);
    }
  };

  // Toggle selection for all or category
  const toggleSelectAll = (selectVal) => {
    const updated = { ...selectedFeatureMap };
    const currentFeatures = getFilteredDiscoveryFeatures();
    currentFeatures.forEach((f) => {
      if (!f.is_duplicate) {
        updated[f.id] = selectVal;
      }
    });
    setSelectedFeatureMap(updated);
  };

  // Filter discovery features by active category
  const getFilteredDiscoveryFeatures = () => {
    if (!discoveryData?.features) return [];
    if (activeCategoryTab === 'all') return discoveryData.features;
    if (activeCategoryTab === 'roads') return discoveryData.categories?.roads || [];
    if (activeCategoryTab === 'bridges') return discoveryData.categories?.bridges || [];
    if (activeCategoryTab === 'schools') return discoveryData.categories?.schools || [];
    if (activeCategoryTab === 'health') return discoveryData.categories?.health || [];
    if (activeCategoryTab === 'water') return discoveryData.categories?.water || [];
    if (activeCategoryTab === 'settlements') return discoveryData.categories?.settlements || [];
    if (activeCategoryTab === 'warnings') return discoveryData.features.filter((f) => f.is_duplicate);
    return discoveryData.features;
  };

  // Submit Point Asset (Node)
  const handleCreatePointAsset = async (e) => {
    e.preventDefault();
    if (!selectedVillageId) {
      alert('Please select or create an active village first.');
      return;
    }
    try {
      const payload = {
        name: pointForm.name,
        node_type: pointForm.node_type,
        type: pointForm.node_type,
        latitude: parseFloat(pointForm.latitude),
        longitude: parseFloat(pointForm.longitude),
        description: pointForm.description,
      };

      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to add node asset');
      }

      setIsAddAssetModalOpen(false);
      showNotification(`Infrastructure node "${pointForm.name}" added to village.`);
      setPointForm({ name: '', node_type: 'settlement', latitude: '', longitude: '', households: '', population: '', description: '' });

      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
    } catch (err) {
      alert('Error saving asset: ' + err.message);
    }
  };

  // Submit Linear Asset (Edge)
  const handleCreateLinearAsset = async (e) => {
    e.preventDefault();
    if (!selectedVillageId) {
      alert('Please select or create an active village first.');
      return;
    }
    if (!linearForm.source_node_id || !linearForm.target_node_id) {
      alert('Please select both a source and target connection node.');
      return;
    }
    try {
      const payload = {
        name: linearForm.name,
        infrastructure_type: linearForm.infrastructure_type,
        type: linearForm.infrastructure_type,
        source_node_id: parseInt(linearForm.source_node_id),
        target_node_id: parseInt(linearForm.target_node_id),
        surface_type: linearForm.surface_type,
        status: linearForm.status,
        length_meters: parseFloat(linearForm.length_meters) || 300,
        is_critical: Boolean(linearForm.is_critical),
        notes: linearForm.notes,
      };

      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to add lifeline edge');
      }

      setIsAddAssetModalOpen(false);
      showNotification(`Lifeline edge "${linearForm.name}" connected.`);
      setLinearForm({
        name: '',
        infrastructure_type: 'road',
        source_node_id: '',
        target_node_id: '',
        surface_type: 'gravel',
        status: 'operational',
        length_meters: '350',
        is_critical: false,
        notes: '',
      });

      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
    } catch (err) {
      alert('Error saving road/bridge: ' + err.message);
    }
  };

  // Delete Node Asset
  const handleDeleteNode = async (nodeId) => {
    if (!confirm('Are you sure you want to remove this infrastructure node?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/nodes/${nodeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to delete node.');
        return;
      }
      setSelectedNode(null);
      showNotification('Node deleted successfully.');
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Delete Edge Asset
  const handleDeleteEdge = async (edgeId) => {
    if (!confirm('Are you sure you want to remove this lifeline edge?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/edges/${edgeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to delete edge.');
        return;
      }
      setSelectedEdge(null);
      showNotification('Lifeline edge deleted successfully.');
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Run NetworkX Diagnostic
  const handleRunDiagnostic = async () => {
    if (!selectedVillageId) return;
    setDiagLoading(true);
    setIsDiagnosticModalOpen(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/integrity`);
      const data = await res.json();
      setDiagnostics(data);
    } catch (err) {
      alert('Network diagnostic failed: ' + err.message);
    } finally {
      setDiagLoading(false);
    }
  };

  const village = villageData?.village || {};
  const nodes = villageData?.nodes || [];
  const edges = villageData?.edges || [];

  const studyAreaCenter = [
    parseFloat(village.center_lat || village.latitude || 27.8635),
    parseFloat(village.center_lng || village.longitude || 85.5815),
  ];

  const candidateEdgesForMap = discoveryData?.categories?.roads
    ? [...(discoveryData.categories.roads || []), ...(discoveryData.categories.bridges || [])]
    : [];

  return (
    <div className="page-stack">
      {/* Dynamic Feedback Banner */}
      {notification && (
        <div
          style={{
            background: notification.type === 'error' ? '#fee2e2' : '#dcfce7',
            border: `1px solid ${notification.type === 'error' ? '#f87171' : '#86efac'}`,
            color: notification.type === 'error' ? '#991b1b' : '#14532d',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{notification.msg}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Administrative Hierarchy Audit Warning (Phase 1) */}
      {hierarchyAudit && hierarchyAudit.inconsistent_count > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #f59e0b',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
            color: '#78350f',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#d97706" />
            <div>
              <strong>Administrative Hierarchy Notice:</strong> {hierarchyAudit.inconsistent_count} village record(s) have administrative mismatches that can be corrected reviewably.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const inc = hierarchyAudit.records.find((r) => !r.is_consistent);
              if (inc && inc.proposed_corrections) {
                fetch(`http://127.0.0.1:8000/api/villages/${inc.village_id}/correct-hierarchy`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(inc.proposed_corrections),
                }).then(() => {
                  showNotification(`Corrected hierarchy for ${inc.village_name}.`);
                  setHierarchyAudit(null);
                  loadVillages();
                });
              }
            }}
            style={{
              background: '#b45309',
              color: '#fff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '11.5px',
            }}
          >
            Apply Official Alignment
          </button>
        </div>
      )}

      {/* Header Intro & Nepal Search Bar */}
      <PageIntro
        eyebrow="Automatic spatial intelligence"
        title="Village Infrastructure Map"
        description="Discover, verify, and monitor roads, suspension bridges, water supplies, and public lifelines for any village across Nepal."
        actions={
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setIsNationwideView(true);
                setSelectedLocationMarker(null);
                showNotification('Showing all registered villages across Nepal.');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: isNationwideView ? '2px solid #176342' : '1px solid #dfe6df',
                background: isNationwideView ? '#e4f4e9' : '#fff',
                color: isNationwideView ? '#124b35' : '#19392f',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Globe size={15} /> View All Nepal
            </button>

            <select
              value={isNationwideView ? '' : selectedVillageId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setIsNationwideView(false);
                  setSelectedVillageId(Number(e.target.value));
                  setSelectedLocationMarker(null);
                }
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #dfe6df',
                background: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                color: '#092d22',
              }}
            >
              <option value="" disabled>-- Select Saved Village --</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsAddVillageModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#176342',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add New Village
            </button>
          </div>
        }
      />

      {/* Nepal Search & Coordinates Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid #dfe6df',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search any village, municipality or district in Nepal (e.g. Marpha, Mustang, Pokhara, Helambu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#f8fafc',
                outline: 'none',
              }}
            />
            {isSearching && (
              <RefreshCw size={14} className="animate-spin" style={{ position: 'absolute', right: '12px', color: '#176342' }} />
            )}
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                zIndex: 2000,
                maxHeight: '320px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((item, idx) => (
                <div
                  key={`search-res-${idx}`}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: idx < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                >
                  <MapPin
                    size={18}
                    style={{
                      color: item.type === 'saved_village' ? '#166534' : (item.type === 'municipality' ? '#0369a1' : '#ea580c'),
                      marginTop: '2px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.title}</strong>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: item.type === 'saved_village' ? '#dcfce7' : '#f1f5f9',
                          color: item.type === 'saved_village' ? '#166534' : '#475569',
                        }}
                      >
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#334155' }}>
          {clickedCoords ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f8f2', padding: '5px 10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <Compass size={15} color="#166534" />
              <span>
                <strong>Lat:</strong> {clickedCoords.lat}°N, <strong>Lng:</strong> {clickedCoords.lng}°E
              </span>
              <button
                type="button"
                onClick={() => {
                  setVillageForm((prev) => ({
                    ...prev,
                    center_lat: clickedCoords.lat,
                    center_lng: clickedCoords.lng,
                  }));
                  setIsAddVillageModalOpen(true);
                }}
                style={{
                  background: '#176342',
                  color: '#fff',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '11px',
                }}
              >
                + Add Village Here
              </button>
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              💡 Click anywhere on map to inspect coordinates or set asset positions
            </span>
          )}
        </div>
      </div>

      {/* Active Village Toolbar Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#092d22' }}>
            {isNationwideView ? 'Nepal Nationwide Exploration Mode' : `Active: ${village.name || 'Demonstration Village'}`}
          </span>
          {!isNationwideView && village.district && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              (Ward {village.ward_no || '1'}, {village.municipality}, {village.district})
            </span>
          )}
        </div>

        {!isNationwideView && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {/* Automatic Discovery Action Button (Phase 2 & 5) */}
            <button
              type="button"
              onClick={() => triggerDiscovery(selectedVillageId, 2000)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                background: '#047857',
                color: '#fff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(4,120,87,0.25)',
              }}
            >
              <Sparkles size={14} /> Auto-Discover Infrastructure
            </button>

            {/* + Add Infrastructure Button */}
            <button
              type="button"
              onClick={() => setIsAddAssetModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: '1px solid #176342',
                background: '#fff',
                color: '#176342',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Manual Asset
            </button>

            {/* Validate Network Button */}
            <button
              type="button"
              onClick={handleRunDiagnostic}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: '1px solid #dfe6df',
                background: '#fff',
                color: '#b45309',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Zap size={14} /> Validate Topology
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Map Card */}
      <Card>
        <InteractiveVillageMap
          villageData={villageData}
          allVillages={villages}
          isNationwideView={isNationwideView}
          height="620px"
          onSelectEdge={(edge) => {
            setSelectedEdge(edge);
            setSelectedNode(null);
          }}
          onSelectNode={(node) => {
            setSelectedNode(node);
            setSelectedEdge(null);
          }}
          onSelectSavedVillage={(id) => {
            setIsNationwideView(false);
            setSelectedVillageId(id);
            setSelectedLocationMarker(null);
          }}
          selectedEdgeId={selectedEdge?.id}
          selectedLocationMarker={selectedLocationMarker}
          onMapClick={handleMapClick}
          isPickingLocation={isPickingLocation}
          onQuickAddVillage={handleQuickAddVillage}
          onQuickAddNode={handleQuickAddNode}
          studyAreaCircle={
            isDiscoveryModalOpen && studyAreaCenter[0]
              ? { center: studyAreaCenter, radius: discoveryRadius }
              : null
          }
          candidatePreviewFeatures={
            isDiscoveryModalOpen && candidateEdgesForMap.length > 0
              ? { edges: candidateEdgesForMap }
              : null
          }
        />
      </Card>

      {/* Selected Infrastructure Asset Inspector Box */}
      {selectedEdge && (
        <Card style={{ background: '#f1f8f2', border: '1.5px solid #248157' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ color: '#176342' }}>Selected Lifeline Road / Bridge Asset</span>
              <h3 style={{ margin: '2px 0 6px', color: '#092d22' }}>{selectedEdge.name}</h3>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#19392f' }}>
                <strong>Type:</strong> {selectedEdge.infrastructure_type || selectedEdge.type} · <strong>Surface:</strong> {selectedEdge.surface_type || 'Gravel'} · <strong>Length:</strong> {selectedEdge.length_meters || 0}m · <strong>Condition:</strong> <span style={{ fontWeight: 'bold' }}>{selectedEdge.status || 'operational'}</span> · <strong>Verification:</strong> <span style={{ color: '#166534', fontWeight: 'bold' }}>{selectedEdge.verification_status || 'unverified'}</span>
              </p>
              {selectedEdge.notes && <p style={{ margin: '0 0 6px', fontStyle: 'italic', color: '#475569', fontSize: '12.5px' }}>{selectedEdge.notes}</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDeleteEdge(selectedEdge.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                }}
              >
                <Trash2 size={13} /> Remove Edge
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setSelectedEdge(null)}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Close
              </button>
            </div>
          </div>
        </Card>
      )}

      {selectedNode && (
        <Card style={{ background: '#eff6ff', border: '1.5px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ color: '#1d4ed8' }}>Selected Node Facility / Settlement</span>
              <h3 style={{ margin: '2px 0 6px', color: '#1e3a8a' }}>{selectedNode.name}</h3>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#1e293b' }}>
                <strong>Type:</strong> {(selectedNode.node_type || selectedNode.type || 'junction').toUpperCase()} · <strong>Coordinates:</strong> {parseFloat(selectedNode.latitude).toFixed(5)}, {parseFloat(selectedNode.longitude).toFixed(5)} · <strong>Verification:</strong> <span style={{ color: '#1e40af', fontWeight: 'bold' }}>{selectedNode.verification_status || 'unverified'}</span>
              </p>
              {selectedNode.description && <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '12.5px' }}>{selectedNode.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDeleteNode(selectedNode.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                }}
              >
                <Trash2 size={13} /> Remove Node
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Close
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Village Summary Counters */}
      {!isNationwideView && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <Card style={{ padding: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Home size={22} color="#176342" />
              <div>
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Settlements</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                  {nodes.filter((n) => (n.node_type || n.type) === 'settlement' || n.settlement_group_id).length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HeartPulse size={22} color="#0f766e" />
              <div>
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Health Facilities</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                  {nodes.filter((n) => (n.node_type || n.type || '').includes('health')).length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap size={22} color="#1d4ed8" />
              <div>
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Schools & Colleges</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                  {nodes.filter((n) => (n.node_type || n.type || '').includes('school')).length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Waypoints size={22} color="#b45309" />
              <div>
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Suspension Bridges</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                  {edges.filter((e) => (e.infrastructure_type || e.type) === 'bridge').length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={22} color="#248157" />
              <div>
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Lifeline Road Segments</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                  {edges.filter((e) => (e.infrastructure_type || e.type) !== 'bridge').length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD NEW VILLAGE */}
      {isAddVillageModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#092d22', fontSize: '18px' }}>+ Add New Nepal Village</h3>
              <button
                type="button"
                onClick={() => setIsAddVillageModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVillage}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Province *
                  </label>
                  <select
                    value={villageForm.province}
                    onChange={(e) => setVillageForm({ ...villageForm, province: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  >
                    {provinces.map((p) => (
                      <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    District *
                  </label>
                  <select
                    value={villageForm.district}
                    onChange={(e) => setVillageForm({ ...villageForm, district: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Municipality / Gaunpalika *
                  </label>
                  <select
                    value={villageForm.municipality}
                    onChange={(e) => setVillageForm({ ...villageForm, municipality: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  >
                    {municipalities.map((m, idx) => (
                      <option key={`m-${idx}`} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Ward No. *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={villageForm.ward_no}
                    onChange={(e) => setVillageForm({ ...villageForm, ward_no: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Village Name (English) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marpha, Bhotenamlang"
                    value={villageForm.name}
                    onChange={(e) => setVillageForm({ ...villageForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Local Name (Nepali)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. मार्फा"
                    value={villageForm.local_name}
                    onChange={(e) => setVillageForm({ ...villageForm, local_name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Center Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="28.7516"
                    value={villageForm.center_lat}
                    onChange={(e) => setVillageForm({ ...villageForm, center_lat: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Center Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="83.6844"
                    value={villageForm.center_lng}
                    onChange={(e) => setVillageForm({ ...villageForm, center_lng: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddVillageModalOpen(false);
                    setIsPickingLocation(true);
                    setPickTargetField('village');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  <MapPin size={14} color="#ea580c" /> Pick Coordinates Directly From Map
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Description / Terrain Characteristics
                </label>
                <textarea
                  rows="2"
                  placeholder="Historic settlement on Kali Gandaki corridor, mountain trails, suspension bridges..."
                  value={villageForm.description}
                  onChange={(e) => setVillageForm({ ...villageForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddVillageModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#176342',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Save Village & Discover Lifelines →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AUTOMATIC INFRASTRUCTURE DISCOVERY PREVIEW DASHBOARD (Phase 2, 3, 5, 6) */}
      {isDiscoveryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              padding: '24px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#047857" />
                  <h3 style={{ margin: 0, color: '#092d22', fontSize: '19px' }}>
                    Automatic Infrastructure Discovery & Import
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Scanning OpenStreetMap geospatial entities for <strong>{village.name || 'Selected Village'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscoveryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Study Area Boundary Selector (Phase 3) */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                  Study Area Radius (Meters):
                </span>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Radius centered at {parseFloat(village.center_lat || village.latitude || 27.8635).toFixed(4)}°N, {parseFloat(village.center_lng || village.longitude || 85.5815).toFixed(4)}°E
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={discoveryRadius}
                  onChange={(e) => {
                    const newRad = Number(e.target.value);
                    setDiscoveryRadius(newRad);
                    triggerDiscovery(selectedVillageId, newRad);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    background: '#fff',
                  }}
                >
                  <option value={1000}>1,000 meters (1 km compact)</option>
                  <option value={2000}>2,000 meters (2 km standard)</option>
                  <option value={3500}>3,500 meters (3.5 km mountain valley)</option>
                  <option value={5000}>5,000 meters (5 km maximum bounding)</option>
                </select>

                <button
                  type="button"
                  onClick={() => triggerDiscovery(selectedVillageId, discoveryRadius)}
                  disabled={discoveryLoading}
                  style={{
                    background: '#047857',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {discoveryLoading ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Re-Scan
                </button>
              </div>
            </div>

            {/* Discovery State: Loading / Empty / Loaded */}
            {discoveryLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <RefreshCw size={32} className="animate-spin" color="#047857" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#092d22' }}>Querying OpenStreetMap Overpass API...</h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  Parsing roads, suspension bridges, health posts, schools, and water tanks within {discoveryRadius}m radius.
                </p>
              </div>
            ) : discoveryData ? (
              <div>
                {/* Discovery Stat Cards (Phase 6) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                  <div
                    onClick={() => setActiveCategoryTab('roads')}
                    style={{
                      background: activeCategoryTab === 'roads' ? '#e4f4e9' : '#fff',
                      border: `1.5px solid ${activeCategoryTab === 'roads' ? '#176342' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#176342' }}>
                      {discoveryData.summary?.roads_count || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>Roads</div>
                  </div>

                  <div
                    onClick={() => setActiveCategoryTab('bridges')}
                    style={{
                      background: activeCategoryTab === 'bridges' ? '#ffedd5' : '#fff',
                      border: `1.5px solid ${activeCategoryTab === 'bridges' ? '#c2410c' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#c2410c' }}>
                      {discoveryData.summary?.bridges_count || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>Bridges</div>
                  </div>

                  <div
                    onClick={() => setActiveCategoryTab('schools')}
                    style={{
                      background: activeCategoryTab === 'schools' ? '#dbeafe' : '#fff',
                      border: `1.5px solid ${activeCategoryTab === 'schools' ? '#1d4ed8' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8' }}>
                      {discoveryData.summary?.schools_count || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>Schools</div>
                  </div>

                  <div
                    onClick={() => setActiveCategoryTab('health')}
                    style={{
                      background: activeCategoryTab === 'health' ? '#ccfbf1' : '#fff',
                      border: `1.5px solid ${activeCategoryTab === 'health' ? '#0f766e' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f766e' }}>
                      {discoveryData.summary?.health_count || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>Health Posts</div>
                  </div>

                  <div
                    onClick={() => setActiveCategoryTab('water')}
                    style={{
                      background: activeCategoryTab === 'water' ? '#e0f2fe' : '#fff',
                      border: `1.5px solid ${activeCategoryTab === 'water' ? '#0284c7' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7' }}>
                      {discoveryData.summary?.water_count || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>Water Tanks</div>
                  </div>

                  <div
                    onClick={() => setActiveCategoryTab('settlements')}
                    style={{
                      background: activeCategoryTab === 'settlements' ? '#f0fdf4' : '#fff',
                      border: `1.5px solid ${activeCategoryTab === 'settlements' ? '#15803d' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d' }}>
                      {discoveryData.summary?.settlements_count || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>Settlements</div>
                  </div>

                  {discoveryData.summary?.duplicates_count > 0 && (
                    <div
                      onClick={() => setActiveCategoryTab('warnings')}
                      style={{
                        background: activeCategoryTab === 'warnings' ? '#fef3c7' : '#fff',
                        border: `1.5px solid ${activeCategoryTab === 'warnings' ? '#d97706' : '#fde68a'}`,
                        borderRadius: '8px',
                        padding: '10px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>
                        {discoveryData.summary?.duplicates_count}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#78350f', fontWeight: '600' }}>Duplicates</div>
                    </div>
                  )}
                </div>

                {/* Duplicate Notice Banner */}
                {discoveryData.summary?.duplicates_count > 0 && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11.5px',
                      color: '#92400e',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={15} color="#d97706" />
                    <span>
                      {discoveryData.summary?.duplicates_count} candidate feature(s) overlap with existing village records in MySQL and have been automatically unchecked to prevent duplication.
                    </span>
                  </div>
                )}

                {/* Empty State when 0 features found (Phase 10: honest missing data messaging) */}
                {discoveryData.features.length === 0 ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Info size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '14px' }}>
                      No mapped records found in the selected data source. Local verification is needed.
                    </h4>
                    <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                      OpenStreetMap does not currently have mapped infrastructure tags within this {discoveryRadius}m radius. You can expand the search radius, add assets manually, or import a municipal GeoJSON/CSV file.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDiscoveryModalOpen(false);
                          setIsAddAssetModalOpen(true);
                        }}
                        style={{
                          background: '#176342',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        + Add Manual Infrastructure
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Category Tabs & Bulk Selection */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {['all', 'roads', 'bridges', 'schools', 'health', 'water', 'settlements'].map((cat) => (
                          <button
                            key={`tab-${cat}`}
                            type="button"
                            onClick={() => setActiveCategoryTab(cat)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: activeCategoryTab === cat ? '#176342' : '#f1f5f9',
                              color: activeCategoryTab === cat ? '#fff' : '#475569',
                              textTransform: 'capitalize',
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => toggleSelectAll(true)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Select Valid
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSelectAll(false)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Discovered Features List */}
                    <div
                      style={{
                        maxHeight: '260px',
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        padding: '6px',
                        marginBottom: '16px',
                      }}
                    >
                      {getFilteredDiscoveryFeatures().map((item, idx) => {
                        const isChecked = Boolean(selectedFeatureMap[item.id]);
                        return (
                          <div
                            key={`feat-${item.id}-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              opacity: item.is_duplicate ? 0.65 : 1,
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: item.is_duplicate ? 'default' : 'pointer', flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={item.is_duplicate}
                                onChange={(e) => {
                                  setSelectedFeatureMap((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.checked,
                                  }));
                                }}
                              />
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                  Category: {item.category} · {item.infrastructure_type || item.node_type || 'asset'}
                                  {item.length_meters && ` · ${item.length_meters}m`}
                                  {item.surface_type && ` · ${item.surface_type}`}
                                </div>
                              </div>
                            </label>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: item.is_duplicate ? '#fee2e2' : '#dbeafe',
                                  color: item.is_duplicate ? '#991b1b' : '#1e40af',
                                }}
                              >
                                {item.is_duplicate ? 'Duplicate' : 'Needs Verification'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Attribution: © OpenStreetMap contributors (ODbL 1.0)
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsDiscoveryModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  Close
                </button>

                {discoveryData && discoveryData.features.length > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importingLoading}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#176342',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {importingLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    Confirm & Save Selected Features (
                    {Object.values(selectedFeatureMap).filter(Boolean).length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL ADD INFRASTRUCTURE ASSET */}
      {isAddAssetModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#092d22', fontSize: '18px' }}>+ Add Infrastructure Asset</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>For {village.name || 'Active Village'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAssetModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setAssetCategory('point')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: assetCategory === 'point' ? '#176342' : '#f1f5f9',
                  color: assetCategory === 'point' ? '#fff' : '#475569',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Point Asset (Settlement, Health, School, Water)
              </button>
              <button
                type="button"
                onClick={() => setAssetCategory('linear')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: assetCategory === 'linear' ? '#176342' : '#f1f5f9',
                  color: assetCategory === 'linear' ? '#fff' : '#475569',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Linear Asset (Road, Suspension Bridge, Trail)
              </button>
            </div>

            {assetCategory === 'point' ? (
              <form onSubmit={handleCreatePointAsset}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Upper Tole, Basic Health Post, Secondary School"
                    value={pointForm.name}
                    onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Node Type *
                    </label>
                    <select
                      value={pointForm.node_type}
                      onChange={(e) => setPointForm({ ...pointForm, node_type: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    >
                      <option value="settlement">Village Settlement / Tole</option>
                      <option value="health_post">Health Post / Clinic</option>
                      <option value="school">Primary / Secondary School</option>
                      <option value="water_point">Water Tap / Reservoir</option>
                      <option value="junction">Road Junction / Crossway</option>
                      <option value="facility">Municipal / Other Facility</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Households (if settlement)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 28"
                      value={pointForm.households}
                      onChange={(e) => setPointForm({ ...pointForm, households: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="28.7516"
                      value={pointForm.latitude}
                      onChange={(e) => setPointForm({ ...pointForm, latitude: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="83.6844"
                      value={pointForm.longitude}
                      onChange={(e) => setPointForm({ ...pointForm, longitude: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddAssetModalOpen(false);
                      setIsPickingLocation(true);
                      setPickTargetField('node');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    <MapPin size={14} color="#ea580c" /> Click Map to Set Asset Position
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Description / Operational Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Details about capacity, road accessibility, condition..."
                    value={pointForm.description}
                    onChange={(e) => setPointForm({ ...pointForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddAssetModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#176342', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Save Node to Network
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateLinearAsset}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Lifeline Connection Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ring Road Connector, Suspension Bridge #1"
                    value={linearForm.name}
                    onChange={(e) => setLinearForm({ ...linearForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Infrastructure Type *
                    </label>
                    <select
                      value={linearForm.infrastructure_type}
                      onChange={(e) => setLinearForm({ ...linearForm, infrastructure_type: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    >
                      <option value="road">Vehicle Road</option>
                      <option value="bridge">Suspension / Motorable Bridge</option>
                      <option value="trail">Walking Trail / Footpath</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Surface Type
                    </label>
                    <select
                      value={linearForm.surface_type}
                      onChange={(e) => setLinearForm({ ...linearForm, surface_type: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="gravel">Gravel (Standard Village)</option>
                      <option value="paved">Paved / Asphalt</option>
                      <option value="dirt">Dirt / Earthen Track</option>
                      <option value="suspension">Steel Cable Suspension</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Source Node *
                    </label>
                    <select
                      value={linearForm.source_node_id}
                      onChange={(e) => setLinearForm({ ...linearForm, source_node_id: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    >
                      <option value="">-- Choose Origin Node --</option>
                      {nodes.map((n) => (
                        <option key={`src-${n.id}`} value={n.id}>
                          {n.name} ({(n.node_type || n.type || 'node')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Target Node *
                    </label>
                    <select
                      value={linearForm.target_node_id}
                      onChange={(e) => setLinearForm({ ...linearForm, target_node_id: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    >
                      <option value="">-- Choose Destination Node --</option>
                      {nodes.filter((n) => String(n.id) !== String(linearForm.source_node_id)).map((n) => (
                        <option key={`tgt-${n.id}`} value={n.id}>
                          {n.name} ({(n.node_type || n.type || 'node')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Length (meters)
                    </label>
                    <input
                      type="number"
                      value={linearForm.length_meters}
                      onChange={(e) => setLinearForm({ ...linearForm, length_meters: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Condition Status
                    </label>
                    <select
                      value={linearForm.status}
                      onChange={(e) => setLinearForm({ ...linearForm, status: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="operational">Operational (Passable)</option>
                      <option value="limited">Limited (Monsoon / Rough)</option>
                      <option value="blocked">Blocked / Hazard</option>
                      <option value="under_repair">Under Repair</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={linearForm.is_critical}
                      onChange={(e) => setLinearForm({ ...linearForm, is_critical: e.target.checked })}
                    />
                    Mark as Critical Lifeline (Single point of failure)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddAssetModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#176342', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Connect Lifeline Edge
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: NETWORKX GRAPH DIAGNOSTICS */}
      {isDiagnosticModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#092d22', fontSize: '18px' }}>NetworkX Graph Topology Health</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Diagnostic Report for {village.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDiagnosticModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {diagLoading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <RefreshCw size={24} className="animate-spin" color="#176342" />
                <p style={{ marginTop: '10px', fontSize: '13px', color: '#475569' }}>Running NetworkX mathematical graph verification...</p>
              </div>
            ) : diagnostics ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px',
                    borderRadius: '10px',
                    background: diagnostics.health_score >= 80 ? '#dcfce7' : '#fef3c7',
                    border: `1px solid ${diagnostics.health_score >= 80 ? '#86efac' : '#fcd34d'}`,
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#166534' }}>Topology Health Score</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                      {diagnostics.health_score} / 100
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: diagnostics.health_score >= 80 ? '#166534' : '#b45309',
                      color: '#fff',
                      textTransform: 'uppercase',
                    }}
                  >
                    {diagnostics.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#092d22' }}>{diagnostics.total_nodes}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Total Nodes</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#092d22' }}>{diagnostics.total_edges}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Lifeline Edges</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: diagnostics.connected_components_count === 1 ? '#166534' : '#ea580c' }}>
                      {diagnostics.connected_components_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Components</div>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Network Coherence:</strong> {diagnostics.diagnostics?.network_topology}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Lifeline Connectivity:</strong> {diagnostics.diagnostics?.lifeline_connectivity}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Spatial Validation:</strong> {diagnostics.diagnostics?.spatial_bounding}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiagnosticModalOpen(false);
                      window.location.hash = '#/simulations';
                    }}
                    style={{
                      background: '#176342',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Run Simulation with this Graph →
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDiagnosticModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
