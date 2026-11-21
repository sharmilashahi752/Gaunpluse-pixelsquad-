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
  RefreshCw,
  Search,
  Sliders,
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
  const [isOsmModalOpen, setIsOsmModalOpen] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  // Administrative Cascade Data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

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

  // OSM Ingestion State
  const [osmRadius, setOsmRadius] = useState(2500);
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmPreview, setOsmPreview] = useState(null);
  const [osmSuccessMsg, setOsmSuccessMsg] = useState('');

  // Diagnostic State
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Feedback Notification Banner
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 6000);
  };

  // 1. Initial Load: Villages & Provinces
  useEffect(() => {
    loadVillages();
    fetch('http://127.0.0.1:8000/api/locations/provinces')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch((err) => console.error('Failed to load provinces:', err));
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

  // 3. Cascade Municipalities when District changes
  useEffect(() => {
    if (!villageForm.district) return;
    fetch(`http://127.0.0.1:8000/api/locations/municipalities?district=${encodeURIComponent(villageForm.district)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMunicipalities(data);
          if (data.length > 0) {
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

    // If user is currently in picking mode
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

    // Otherwise drop a click target marker
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
      // Fly to location and drop marker
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
    setVillageForm((prev) => ({
      ...prev,
      name: marker.title.replace(' District', '').replace(' Rural Municipality', '').replace(' Municipality', ''),
      center_lat: marker.lat,
      center_lng: marker.lng,
      province: marker.itemData?.province || prev.province,
      district: marker.itemData?.district || prev.district,
      municipality: marker.itemData?.municipality || prev.municipality,
    }));
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

  // Submit New Village
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
      showNotification(`Village "${newVillage.name}" successfully registered in GaunPulse!`);

      // Refresh village list and switch to new village
      loadVillages();
      setSelectedVillageId(newVillage.id);
      setIsNationwideView(false);
      setSelectedLocationMarker(null);
    } catch (err) {
      alert('Error creating village: ' + err.message);
    }
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

      // Refresh village data
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      const updatedData = await refreshRes.json();
      setVillageData(updatedData);
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

      // Refresh village data
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      const updatedData = await refreshRes.json();
      setVillageData(updatedData);
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

  // OSM Preview & Ingest
  const handleOsmPreview = async () => {
    if (!selectedVillageId) return;
    setOsmLoading(true);
    setOsmSuccessMsg('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/import-osm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radius: osmRadius, preview_only: true }),
      });
      const data = await res.json();
      setOsmPreview(data);
    } catch (err) {
      alert('OSM Overpass preview failed: ' + err.message);
    } finally {
      setOsmLoading(false);
    }
  };

  const handleOsmIngest = async () => {
    if (!selectedVillageId) return;
    setOsmLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/import-osm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radius: osmRadius, preview_only: false }),
      });
      const data = await res.json();
      setOsmSuccessMsg(data.message || 'OSM data successfully ingested into MySQL!');
      showNotification('OSM infrastructure imported successfully.');

      // Refresh village network
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
    } catch (err) {
      alert('OSM Ingestion error: ' + err.message);
    } finally {
      setOsmLoading(false);
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

      {/* Header Intro & Nepal Search Bar */}
      <PageIntro
        eyebrow="Nepal-wide spatial lifelines"
        title="Village Infrastructure Map"
        description="Explore, georeference, and manage rural lifeline networks for any municipality, ward, or village in Nepal."
        actions={
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {/* View All Nepal Button */}
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

            {/* Saved Villages Dropdown */}
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

            {/* + Add New Village */}
            <button
              type="button"
              onClick={() => {
                setIsAddVillageModalOpen(true);
              }}
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
        {/* Search Bar Input */}
        <div style={{ position: 'relative', flex: '1 1 340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search
              size={17}
              style={{ position: 'absolute', left: '12px', color: '#64748b' }}
            />
            <input
              type="text"
              placeholder="Search any village, municipality or district in Nepal (e.g. Mustang, Pokhara, Helambu)..."
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
              <RefreshCw
                size={14}
                className="animate-spin"
                style={{ position: 'absolute', right: '12px', color: '#176342' }}
              />
            )}
          </div>

          {/* Autocomplete Dropdown */}
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

        {/* Clicked Coordinates & Quick Actions */}
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
              💡 Click anywhere on map to inspect coordinates or drop assets
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
            {/* + Add Infrastructure Button */}
            <button
              type="button"
              onClick={() => {
                setIsAddAssetModalOpen(true);
              }}
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
              <Plus size={14} /> Add Infrastructure
            </button>

            {/* Import Available Map Data (OSM) */}
            <button
              type="button"
              onClick={() => {
                setIsOsmModalOpen(true);
                handleOsmPreview();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: '1px solid #dfe6df',
                background: '#fff',
                color: '#0f766e',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> Import Map Data (OSM)
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
              <Zap size={14} /> Validate Network
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
                <strong>Type:</strong> {selectedEdge.infrastructure_type || selectedEdge.type} · <strong>Surface:</strong> {selectedEdge.surface_type || 'Gravel'} · <strong>Length:</strong> {selectedEdge.length_meters || 0}m · <strong>Condition:</strong> <span style={{ fontWeight: 'bold' }}>{selectedEdge.status || 'operational'}</span>
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
                <strong>Type:</strong> {(selectedNode.node_type || selectedNode.type || 'junction').toUpperCase()} · <strong>Coordinates:</strong> {parseFloat(selectedNode.latitude).toFixed(5)}, {parseFloat(selectedNode.longitude).toFixed(5)}
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
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Schools</span>
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
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Bridges</span>
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
                <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Road Segments</span>
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
                  <input
                    type="text"
                    value={villageForm.municipality}
                    onChange={(e) => setVillageForm({ ...villageForm, municipality: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
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
                    placeholder="e.g. Bhotenamlang, Marpha"
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
                    placeholder="e.g. भोटेनाम्लाङ"
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
                    placeholder="27.8635"
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
                    placeholder="85.5815"
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Description / Terrain Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Rural settlement with mountain terrain, suspension bridges, seasonal road access..."
                  value={villageForm.description}
                  onChange={(e) => setVillageForm({ ...villageForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddVillageModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#176342', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Village to MySQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD INFRASTRUCTURE ASSET */}
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

            {/* Asset Category Tabs */}
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

            {/* POINT ASSET FORM */}
            {assetCategory === 'point' ? (
              <form onSubmit={handleCreatePointAsset}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Upper Tole, Community Clinic, Primary School"
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
                      placeholder="27.8635"
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
                      placeholder="85.5815"
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
              /* LINEAR ASSET FORM */
              <form onSubmit={handleCreateLinearAsset}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Lifeline Connection Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ring Road Connector, Suspension Bridge 1"
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
                      <option value="blocked">Blocked / Critical</option>
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
                    Mark as Critical Village Lifeline (Single point of access)
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

      {/* MODAL 3: OPENSTREETMAP DATA INGESTION */}
      {isOsmModalOpen && (
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
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#092d22', fontSize: '18px' }}>Import Available OpenStreetMap Data</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Overpass Ingestion for {village.name} (lat: {village.center_lat || village.latitude}, lng: {village.center_lng || village.longitude})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOsmModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                Search Radius from Village Center (Meters)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={osmRadius}
                  onChange={(e) => setOsmRadius(Number(e.target.value))}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <button
                  type="button"
                  onClick={handleOsmPreview}
                  disabled={osmLoading}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {osmLoading ? 'Querying...' : 'Scan OSM'}
                </button>
              </div>
            </div>

            {osmPreview && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '13px' }}>Scanned Map Features</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#176342' }}>
                      {osmPreview.summary?.candidate_nodes || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Nodes Found</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>
                      {osmPreview.summary?.candidate_edges || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Ways / Roads</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309' }}>
                      {osmPreview.summary?.candidate_facilities || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Facilities</div>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '11.5px', color: '#475569' }}>
                  {osmPreview.attribution || '© OpenStreetMap contributors'}
                </p>
              </div>
            )}

            {osmSuccessMsg && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px', fontWeight: 'bold' }}>
                {osmSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsOsmModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOsmIngest}
                disabled={osmLoading || !osmPreview}
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
                {osmLoading ? 'Importing...' : 'Save Scanned Features to MySQL'}
              </button>
            </div>
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
