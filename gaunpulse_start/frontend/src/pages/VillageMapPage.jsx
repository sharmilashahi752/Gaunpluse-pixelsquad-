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
import { useVillageSelection } from '../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { cachedFetchJson, invalidateApiCache } from '../utils/apiCache';

export default function VillageMapPage() {
  // Saved Villages & Active Selection
  const { selectedVillageId, setSelectedVillageId, villages: contextVillages, refreshVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [villageData, setVillageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNationwideView, setIsNationwideView] = useState(false);

  // Sync villages from context
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
      if (!selectedVillageId) {
        setSelectedVillageId(contextVillages[0].id);
      }
    }
  }, [contextVillages, selectedVillageId, setSelectedVillageId]);

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
  const [discoveryStatus, setDiscoveryStatus] = useState('idle'); // 'idle' | 'searching' | 'processing' | 'ready' | 'empty' | 'provider_unavailable' | 'saving' | 'completed'
  const [discoveryError, setDiscoveryError] = useState(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(2000); // meters (Phase 3)
  const [discoveryData, setDiscoveryData] = useState(null);
  const [selectedFeatureMap, setSelectedFeatureMap] = useState({}); // featureId -> bool
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('new'); // 'new' | 'possible_duplicates' | 'already_imported'
  const [importingLoading, setImportingLoading] = useState(false);
  const [confirmingLocation, setConfirmingLocation] = useState(false);
  const [showCoordInput, setShowCoordInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

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
  const [isSubmittingVillage, setIsSubmittingVillage] = useState(false);

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
    cachedFetchJson('http://127.0.0.1:8000/api/locations/provinces', {}, { ttlMs: 600000 })
      .then((data) => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch((err) => console.error('Failed to load provinces:', err));

    // Audit administrative hierarchy integrity
    cachedFetchJson('http://127.0.0.1:8000/api/villages/audit-hierarchy', {}, { ttlMs: 120000 })
      .then((data) => {
        if (data?.inconsistent_count > 0) {
          setHierarchyAudit(data);
        }
      })
      .catch((err) => console.error('Hierarchy audit failed:', err));
  }, []);

  const loadVillages = async (force = false) => {
    if (contextVillages && contextVillages.length > 0 && !force) {
      setVillages(contextVillages);
      if (!selectedVillageId) {
        setSelectedVillageId(contextVillages[0].id);
      }
      return;
    }

    try {
      const data = await cachedFetchJson('http://127.0.0.1:8000/api/villages', {}, {
        force,
        ttlMs: 120000,
        onBackgroundUpdate: (fresh) => {
          if (Array.isArray(fresh)) setVillages(fresh);
        },
      });
      if (Array.isArray(data) && data.length > 0) {
        setVillages(data);
        if (!selectedVillageId) {
          setSelectedVillageId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load villages:', err);
    }
  };

  // 2. Cascade Districts when Province changes
  useEffect(() => {
    if (!villageForm.province) return;
    cachedFetchJson(`http://127.0.0.1:8000/api/locations/districts?province=${encodeURIComponent(villageForm.province)}`, {}, { ttlMs: 600000 })
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
    cachedFetchJson(`http://127.0.0.1:8000/api/locations/municipalities?district=${encodeURIComponent(villageForm.district)}`, {}, { ttlMs: 600000 })
      .then((data) => {
        if (Array.isArray(data)) {
          setMunicipalities(data);
          const currentMuniValid = data.some((m) => m.name === villageForm.municipality);
          if (!currentMuniValid && data.length > 0) {
            setVillageForm((prev) => ({
              ...prev,
              municipality: data[0].name,
              center_lat: data[0].center_lat || prev.center_lat,
              center_lng: data[0].center_lng || prev.center_lng,
            }));
          }
        }
      })
      .catch((err) => console.error('Failed to load municipalities:', err));
  }, [villageForm.district]);

  // 4. Load Active Village Network with SWR
  useEffect(() => {
    if (!selectedVillageId) return;
    if (!villageData || villageData.village?.id !== Number(selectedVillageId)) {
      setLoading(true);
    }

    cachedFetchJson(
      `http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`,
      {},
      {
        ttlMs: 60000,
        onBackgroundUpdate: (fresh) => {
          if (fresh && fresh.village?.id === Number(selectedVillageId)) {
            setVillageData(fresh);
          }
        },
      }
    )
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

  // Submit New Village -> Automatically ingests real Nepal OSM data (Phase 5)
  const handleCreateVillage = async (e) => {
    e.preventDefault();
    if (isSubmittingVillage) return;
    setIsSubmittingVillage(true);
    try {
      const payload = {
        name: villageForm.name,
        local_name: villageForm.local_name || null,
        province: villageForm.province,
        district: villageForm.district,
        municipality: villageForm.municipality,
        ward_no: villageForm.ward_no || '1',
        center_lat: parseFloat(villageForm.center_lat) || undefined,
        center_lng: parseFloat(villageForm.center_lng) || undefined,
        description: villageForm.description,
        data_source: villageForm.data_source,
        verification_status: villageForm.verification_status,
        auto_import: true,
      };

      const res = await fetch('http://127.0.0.1:8000/api/villages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409 && errData.is_duplicate && errData.existing_village_id) {
          const shouldSwitch = confirm(
            `This village ("${errData.duplicate_village?.name || villageForm.name}") is already registered in ${errData.duplicate_village?.district || villageForm.district} (${errData.duplicate_village?.municipality || villageForm.municipality}).\n\nWould you like to open and inspect the existing village record?`
          );
          if (shouldSwitch) {
            setIsAddVillageModalOpen(false);
            await loadVillages();
            setSelectedVillageId(errData.existing_village_id);
            setIsNationwideView(false);
            setSelectedLocationMarker(null);
          }
          return;
        }
        throw new Error(errData.message || 'Failed to create village');
      }

      const newVillage = await res.json();
      setIsAddVillageModalOpen(false);

      const nodeCount = newVillage.imported_nodes || newVillage.nodes_count || 0;
      const edgeCount = newVillage.imported_edges || newVillage.edges_count || 0;
      showNotification(
        `🎉 Village "${newVillage.name}" successfully added! Automatically imported ${nodeCount} infrastructure nodes and ${edgeCount} lifeline roads from OpenStreetMap.`
      );

      // Refresh village list and switch to new village
      await loadVillages();
      setSelectedVillageId(newVillage.id);
      setIsNationwideView(false);
      setSelectedLocationMarker(null);

      // Instantly load the new village's network into map
      const netRes = await fetch(`http://127.0.0.1:8000/api/villages/${newVillage.id}/network`);
      if (netRes.ok) {
        const netData = await netRes.json();
        setVillageData(netData);
      }
    } catch (err) {
      alert('Error creating village: ' + err.message);
    } finally {
      setIsSubmittingVillage(false);
    }
  };

  // Trigger Infrastructure Discovery (Task 1, 2, 3 & 5)
  const triggerDiscovery = async (villageId, radius = 2000, force = false) => {
    const vId = villageId || selectedVillageId;
    if (!vId) return;

    setDiscoveryStatus('searching');
    setDiscoveryLoading(true);
    setIsDiscoveryModalOpen(true);
    setDiscoveryRadius(radius);
    setDiscoveryData(null);
    setDiscoveryError(null);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${vId}/discover-osm?radius=${radius}${force ? '&force=true' : ''}`);
      if (!res.ok) {
        throw new Error(`Server returned error code ${res.status}`);
      }
      setDiscoveryStatus('processing');
      const data = await res.json();
      setDiscoveryData(data);

      if (data.provider_status === 'unavailable' || data.error) {
        setDiscoveryStatus('provider_unavailable');
        setDiscoveryError(data.error || 'OpenStreetMap provider is currently unavailable or timed out.');
        return;
      }

      const features = data.features || [];
      if (features.length === 0) {
        setDiscoveryStatus('empty');
      } else {
        setDiscoveryStatus('ready');
      }

      // Initialize selected checkboxes (select all valid new features, uncheck possible duplicates & already imported)
      const initialMap = {};
      features.forEach((feat) => {
        initialMap[feat.id] = feat.duplicate_status === 'new' || (feat.is_new ?? false);
      });
      setSelectedFeatureMap(initialMap);
    } catch (err) {
      setDiscoveryStatus('failed');
      setDiscoveryError(err.message || 'Automatic discovery failed.');
    } finally {
      setDiscoveryLoading(false);
    }
  };

  // Confirm Official Location from Suggestion
  const handleConfirmOfficialLocation = async () => {
    if (!selectedVillageId || !discoveryData?.suggested_coordinates) return;
    setConfirmingLocation(true);
    try {
      const coords = discoveryData.suggested_coordinates;
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/coordinates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          center_lat: coords.lat,
          center_lng: coords.lng,
          confirmed: true,
          radius: discoveryRadius,
        }),
      });
      if (!res.ok) throw new Error('Failed to confirm official coordinates');
      showNotification(`Village coordinates confirmed to ${coords.lat}°N, ${coords.lng}°E! Re-scanning...`);
      loadVillages();
      await triggerDiscovery(selectedVillageId, discoveryRadius, true);
    } catch (err) {
      alert('Error confirming coordinates: ' + err.message);
    } finally {
      setConfirmingLocation(false);
    }
  };

  // Save Custom Coordinates Manually
  const handleSaveManualCoordinates = async () => {
    if (!selectedVillageId || !manualLat || !manualLng) return;
    setConfirmingLocation(true);
    try {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      const res = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/coordinates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          center_lat: lat,
          center_lng: lng,
          confirmed: true,
          radius: discoveryRadius,
        }),
      });
      if (!res.ok) throw new Error('Failed to save coordinates');
      showNotification(`Coordinates saved to ${lat}°N, ${lng}°E! Re-scanning...`);
      setShowCoordInput(false);
      loadVillages();
      await triggerDiscovery(selectedVillageId, discoveryRadius, true);
    } catch (err) {
      alert('Error saving coordinates: ' + err.message);
    } finally {
      setConfirmingLocation(false);
    }
  };

  // Confirm and Save Selected Discovery Features (Task 6 & 7)
  const handleConfirmImport = async () => {
    if (!selectedVillageId || !discoveryData) return;

    const allFeatures = discoveryData.features || [];
    // Only persist features checked by the user that are NOT already in MySQL
    const approvedFeatures = allFeatures.filter((f) => selectedFeatureMap[f.id] && f.duplicate_status !== 'already_imported');

    if (approvedFeatures.length === 0) {
      alert('Please select at least one new or verified feature to import.');
      return;
    }

    setImportingLoading(true);
    setDiscoveryStatus('saving');
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
      setDiscoveryStatus('completed');
      setIsDiscoveryModalOpen(false);
      showNotification(`Import complete! ${result.imported_nodes || result.nodes_created || 0} nodes and ${result.imported_edges || result.edges_created || 0} lifeline edges saved to MySQL.`);

      // Refresh village network immediately from MySQL (Task 7)
      const refreshRes = await fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`);
      setVillageData(await refreshRes.json());
      loadVillages();
    } catch (err) {
      alert('Error saving imported features: ' + err.message);
      setDiscoveryStatus('ready');
    } finally {
      setImportingLoading(false);
    }
  };

  // Main Tab Filter
  const getFeaturesByMainTab = (tab) => {
    if (!discoveryData?.features) return [];
    if (tab === 'new') {
      return discoveryData.features.filter((f) => f.duplicate_status === 'new' || (!f.is_duplicate && !f.is_possible_duplicate));
    }
    if (tab === 'possible_duplicates') {
      return discoveryData.features.filter((f) => f.duplicate_status === 'possible_duplicate' || f.is_possible_duplicate);
    }
    if (tab === 'already_imported') {
      return discoveryData.features.filter((f) => f.duplicate_status === 'already_imported' || (f.is_duplicate && !f.is_possible_duplicate));
    }
    return discoveryData.features;
  };

  // Toggle selection for visible features
  const toggleSelectAll = (selectVal) => {
    const updated = { ...selectedFeatureMap };
    const currentFeatures = getFilteredDiscoveryFeatures();
    currentFeatures.forEach((f) => {
      if (f.duplicate_status !== 'already_imported' && !f.is_duplicate) {
        updated[f.id] = selectVal;
      }
    });
    setSelectedFeatureMap(updated);
  };

  // Filter discovery features by active category
  const getFilteredDiscoveryFeatures = () => {
    let list = getFeaturesByMainTab(activeMainTab);
    if (activeCategoryTab !== 'all') {
      list = list.filter((f) => f.category === activeCategoryTab);
    }
    return list;
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
    ? [...(discoveryData.categories.roads || []), ...(discoveryData.categories.bridges || [])].filter((f) => selectedFeatureMap[f.id])
    : [];

  const candidateNodesForMap = discoveryData?.features
    ? (discoveryData.features || []).filter((f) => (f.osm_type === 'node' || !f.source_osm_id) && selectedFeatureMap[f.id])
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
              className={`button ${isNationwideView ? 'button--primary' : 'button--secondary'}`}
              onClick={() => {
                setIsNationwideView(true);
                setSelectedLocationMarker(null);
                showNotification('Showing all registered villages across Nepal.');
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
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: '12.5px',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}
            >
              <option value="" disabled>-- Select Saved Village --</option>
              {deduplicateVillages(villages).map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVillageLabel(v)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="button button--primary"
              onClick={() => setIsAddVillageModalOpen(true)}
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
          background: 'var(--surface)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search any village, municipality or district in Nepal (e.g. Marpha, Mustang, Pokhara, Helambu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                background: 'var(--surface-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {isSearching && (
              <RefreshCw size={14} className="animate-spin" style={{ position: 'absolute', right: '12px', color: 'var(--primary-green)' }} />
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
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
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
                    borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                >
                  <MapPin
                    size={17}
                    style={{
                      color: item.type === 'saved_village' ? 'var(--primary-green)' : (item.type === 'municipality' ? '#2563eb' : '#b7792c'),
                      marginTop: '2px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.title}</strong>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: item.type === 'saved_village' ? 'var(--success-bg)' : 'var(--surface-subtle)',
                          color: item.type === 'saved_village' ? 'var(--success)' : 'var(--text-secondary)',
                        }}
                      >
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {clickedCoords ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-subtle)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <Compass size={15} color="var(--primary-green)" />
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                <strong>Lat:</strong> {clickedCoords.lat}°N, <strong>Lng:</strong> {clickedCoords.lng}°E
              </span>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  setVillageForm((prev) => ({
                    ...prev,
                    center_lat: clickedCoords.lat,
                    center_lng: clickedCoords.lng,
                  }));
                  setIsAddVillageModalOpen(true);
                }}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                }}
              >
                + Add Village Here
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '11.5px' }}>
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
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {isNationwideView ? 'Nepal Nationwide Exploration Mode' : `Active: ${village.name || 'Demonstration Village'}`}
          </span>
          {!isNationwideView && village.district && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              (Ward {village.ward_no || '1'}, {village.municipality}, {village.district})
            </span>
          )}
        </div>

        {!isNationwideView && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {/* Automatic Discovery Action Button (Phase 2 & 5) */}
            <button
              type="button"
              className="button button--primary"
              onClick={() => triggerDiscovery(selectedVillageId, 2000)}
            >
              <Sparkles size={14} /> Auto-Discover Infrastructure
            </button>

            {/* + Add Infrastructure Button */}
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setIsAddAssetModalOpen(true)}
            >
              <Plus size={14} /> Add Manual Asset
            </button>

            {/* Validate Network Button */}
            <button
              type="button"
              className="button button--secondary"
              onClick={handleRunDiagnostic}
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
            isDiscoveryModalOpen && (candidateEdgesForMap.length > 0 || candidateNodesForMap.length > 0)
              ? { edges: candidateEdgesForMap, nodes: candidateNodesForMap }
              : null
          }
        />
      </Card>

      {/* Selected Infrastructure Asset Inspector Box */}
      {selectedEdge && (
        <Card style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow">Selected Lifeline Road / Bridge Asset</span>
              <h3 style={{ margin: '2px 0 6px', color: 'var(--text-primary)' }}>{selectedEdge.name}</h3>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <strong>Type:</strong> {selectedEdge.infrastructure_type || selectedEdge.type} · <strong>Surface:</strong> {selectedEdge.surface_type || 'Gravel'} · <strong>Length:</strong> <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedEdge.length_meters || 0}m</span> · <strong>Condition:</strong> <span style={{ fontWeight: '600' }}>{selectedEdge.status || 'operational'}</span> · <strong>Verification:</strong> <span style={{ color: 'var(--success)', fontWeight: '600' }}>{selectedEdge.verification_status || 'unverified'}</span>
              </p>
              {selectedEdge.notes && <p style={{ margin: '0 0 6px', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '12px' }}>{selectedEdge.notes}</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button--danger"
                onClick={() => handleDeleteEdge(selectedEdge.id)}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                <Trash2 size={13} /> Remove Edge
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setSelectedEdge(null)}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                Close
              </button>
            </div>
          </div>
        </Card>
      )}

      {selectedNode && (
        <Card style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow">Selected Node Facility / Settlement</span>
              <h3 style={{ margin: '2px 0 6px', color: 'var(--text-primary)' }}>{selectedNode.name}</h3>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <strong>Type:</strong> {(selectedNode.node_type || selectedNode.type || 'junction').toUpperCase()} · <strong>Coordinates:</strong> <span style={{ fontVariantNumeric: 'tabular-nums' }}>{parseFloat(selectedNode.latitude).toFixed(5)}, {parseFloat(selectedNode.longitude).toFixed(5)}</span> · <strong>Verification:</strong> <span style={{ color: 'var(--primary-green)', fontWeight: '600' }}>{selectedNode.verification_status || 'unverified'}</span>
              </p>
              {selectedNode.description && <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '12px' }}>{selectedNode.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button--danger"
                onClick={() => handleDeleteNode(selectedNode.id)}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                <Trash2 size={13} /> Remove Node
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{ fontSize: '12px', padding: '5px 10px' }}
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
          <Card style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Home size={20} color="var(--primary-green)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.4px' }}>Settlements</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {nodes.filter((n) => (n.node_type || n.type) === 'settlement' || n.settlement_group_id).length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HeartPulse size={20} color="#0f766e" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.4px' }}>Health Facilities</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {nodes.filter((n) => (n.node_type || n.type || '').includes('health')).length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap size={20} color="#2563eb" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.4px' }}>Schools & Colleges</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {nodes.filter((n) => (n.node_type || n.type || '').includes('school')).length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Waypoints size={20} color="var(--warning)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.4px' }}>Suspension Bridges</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {edges.filter((e) => (e.infrastructure_type || e.type) === 'bridge').length}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={20} color="var(--primary-green)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.4px' }}>Lifeline Road Segments</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {edges.filter((e) => (e.infrastructure_type || e.type) !== 'bridge').length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD NEW VILLAGE */}
      {isAddVillageModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>+ Add New Nepal Village</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddVillageModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
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
                    onChange={(e) => {
                      const chosen = municipalities.find((m) => m.name === e.target.value);
                      setVillageForm({
                        ...villageForm,
                        municipality: e.target.value,
                        center_lat: chosen?.center_lat || villageForm.center_lat,
                        center_lng: chosen?.center_lng || villageForm.center_lng,
                      });
                    }}
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
                  disabled={isSubmittingVillage}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isSubmittingVillage ? '#4b695a' : '#176342',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: isSubmittingVillage ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isSubmittingVillage ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Registering & Ingesting OSM Data...
                    </>
                  ) : (
                    'Save Village & Discover Lifelines →'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AUTOMATIC INFRASTRUCTURE DISCOVERY PREVIEW DASHBOARD (Phase 2, 3, 5, 6) */}
      {isDiscoveryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card--lg">
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary-green)" />
                  <h3>Automatic Infrastructure Discovery & Import</h3>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Scanning OpenStreetMap geospatial entities for <strong>{village.name || 'Selected Village'}</strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDiscoveryModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
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
                  Scan center: {parseFloat(discoveryData?.scan_center?.lat || village.center_lat || village.latitude || 27.8635).toFixed(4)}°N, {parseFloat(discoveryData?.scan_center?.lng || village.center_lng || village.longitude || 85.5815).toFixed(4)}°E
                  {village.is_coordinates_confirmed ? (
                    <span style={{ marginLeft: '6px', color: '#047857', fontWeight: 600 }}>✓ Confirmed</span>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={discoveryRadius}
                  onChange={(e) => {
                    const newRad = Number(e.target.value);
                    setDiscoveryRadius(newRad);
                    triggerDiscovery(selectedVillageId, newRad, true);
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
                  onClick={() => triggerDiscovery(selectedVillageId, discoveryRadius, true)}
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

            {/* Village Location Confirmation Banner */}
            {(discoveryData?.needs_location_confirmation || village.needs_location_confirmation || (!village.is_coordinates_confirmed && village.center_lat == 28.0 && village.center_lng == 84.0)) && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e', marginBottom: '2px' }}>
                      Village Location Needs Confirmation
                    </div>
                    <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.4 }}>
                      Current scan coordinates ({parseFloat(village.center_lat || 28.0).toFixed(4)}°N, {parseFloat(village.center_lng || 84.0).toFixed(4)}°E) appear to be a broad administrative fallback.
                      {discoveryData?.suggested_coordinates && (
                        <span> Official catalog centroid for <strong>{village.name}</strong> ({village.municipality || village.district}) is <strong>{discoveryData.suggested_coordinates.lat.toFixed(4)}°N, {discoveryData.suggested_coordinates.lng.toFixed(4)}°E</strong>.</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      {discoveryData?.suggested_coordinates && (
                        <button
                          type="button"
                          onClick={handleConfirmOfficialLocation}
                          disabled={confirmingLocation}
                          style={{
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {confirmingLocation ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Confirm Official Coordinates ({discoveryData.suggested_coordinates.lat.toFixed(4)}°N, {discoveryData.suggested_coordinates.lng.toFixed(4)}°E)
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowCoordInput(!showCoordInput);
                          if (!manualLat) setManualLat(village.center_lat || '28.9242');
                          if (!manualLng) setManualLng(village.center_lng || '81.7125');
                        }}
                        style={{
                          background: '#fff',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {showCoordInput ? 'Cancel Manual Input' : 'Edit Coordinates Manually'}
                      </button>
                    </div>

                    {showCoordInput && (
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', width: '110px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', width: '110px' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveManualCoordinates}
                          disabled={confirmingLocation}
                          style={{
                            marginTop: '16px',
                            background: '#176342',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          Save & Re-Scan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Discovery State: Loading / Provider Unavailable / Empty / Loaded */}
            {discoveryLoading || discoveryStatus === 'searching' || discoveryStatus === 'processing' || discoveryStatus === 'saving' ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <RefreshCw size={32} className="animate-spin" color="#047857" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#092d22' }}>
                  {discoveryStatus === 'saving'
                    ? 'Saving infrastructure to village database...'
                    : discoveryStatus === 'processing'
                    ? 'Processing geographic features and checking topology...'
                    : 'Searching OpenStreetMap...'}
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  {discoveryStatus === 'saving'
                    ? 'Persisting road lines, bridge lifelines, and community facilities in MySQL.'
                    : `Querying roads, bridges, health posts, schools, and water infrastructure within ${discoveryRadius}m radius.`}
                </p>
              </div>
            ) : discoveryStatus === 'provider_unavailable' ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #f87171',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={30} color="#dc2626" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#991b1b', fontSize: '15px' }}>
                  OpenStreetMap Provider Unavailable
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#7f1d1d', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                  The external OpenStreetMap / Overpass service timed out or was temporarily at capacity.
                  {discoveryError && (
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '11.5px', color: '#b91c1c', fontFamily: 'monospace' }}>
                      Diagnostic detail: {discoveryError}
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => triggerDiscovery(selectedVillageId, discoveryRadius, true)}
                    style={{
                      background: '#b91c1c',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCw size={13} />
                    Retry Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiscoveryModalOpen(false);
                      setIsAddAssetModalOpen(true);
                    }}
                    style={{
                      background: '#fff',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Manual Asset
                  </button>
                </div>
              </div>
            ) : discoveryData && discoveryData.features && discoveryData.features.length === 0 ? (
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
                <Info size={26} color="#64748b" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '14.5px' }}>
                  No mapped records found in the selected study area. Local verification is needed.
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                  OpenStreetMap does not currently have mapped infrastructure tags within this {discoveryRadius}m radius. You can expand the study area radius, add assets manually, or import a municipal GeoJSON/CSV file.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {discoveryRadius < 5000 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextRad = discoveryRadius === 1000 ? 2000 : (discoveryRadius === 2000 ? 3500 : 5000);
                        setDiscoveryRadius(nextRad);
                        triggerDiscovery(selectedVillageId, nextRad, true);
                      }}
                      style={{
                        background: '#047857',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Expand Radius to {discoveryRadius === 1000 ? '2,000m' : (discoveryRadius === 2000 ? '3,500m' : '5,000m')}
                    </button>
                  )}
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
            ) : discoveryData ? (
              <div>
                {/* 4 Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                      {discoveryData.features?.length || discoveryData.summary?.total_features || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Total Discovered</div>
                  </div>

                  <div
                    onClick={() => setActiveMainTab('new')}
                    style={{
                      background: activeMainTab === 'new' ? '#ecfdf5' : '#fff',
                      border: `1.5px solid ${activeMainTab === 'new' ? '#059669' : '#a7f3d0'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#047857' }}>
                      {discoveryData.summary?.new_features_count ?? (discoveryData.features?.filter((f) => f.duplicate_status === 'new' || (!f.is_duplicate && !f.is_possible_duplicate)).length || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#065f46', fontWeight: '700' }}>✨ New Features</div>
                  </div>

                  <div
                    onClick={() => setActiveMainTab('possible_duplicates')}
                    style={{
                      background: activeMainTab === 'possible_duplicates' ? '#fffbeb' : '#fff',
                      border: `1.5px solid ${activeMainTab === 'possible_duplicates' ? '#d97706' : '#fde68a'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#b45309' }}>
                      {discoveryData.summary?.possible_duplicates_count ?? (discoveryData.features?.filter((f) => f.duplicate_status === 'possible_duplicate' || f.is_possible_duplicate).length || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '700' }}>🔍 Possible Duplicates</div>
                  </div>

                  <div
                    onClick={() => setActiveMainTab('already_imported')}
                    style={{
                      background: activeMainTab === 'already_imported' ? '#f1f5f9' : '#fff',
                      border: `1.5px solid ${activeMainTab === 'already_imported' ? '#64748b' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#475569' }}>
                      {discoveryData.summary?.already_imported_count ?? (discoveryData.features?.filter((f) => f.duplicate_status === 'already_imported' || (f.is_duplicate && !f.is_possible_duplicate)).length || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>⏭️ Already in Database</div>
                  </div>
                </div>

                {/* 3 Main Categorized Tabs */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '14px', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveMainTab('new')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: activeMainTab === 'new' ? '3px solid #059669' : '3px solid transparent',
                      background: 'none',
                      fontSize: '13px',
                      fontWeight: activeMainTab === 'new' ? '800' : '600',
                      color: activeMainTab === 'new' ? '#065f46' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    ✨ New Features ({getFeaturesByMainTab('new').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMainTab('possible_duplicates')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: activeMainTab === 'possible_duplicates' ? '3px solid #d97706' : '3px solid transparent',
                      background: 'none',
                      fontSize: '13px',
                      fontWeight: activeMainTab === 'possible_duplicates' ? '800' : '600',
                      color: activeMainTab === 'possible_duplicates' ? '#92400e' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    🔍 Possible Duplicates ({getFeaturesByMainTab('possible_duplicates').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMainTab('already_imported')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: activeMainTab === 'already_imported' ? '3px solid #64748b' : '3px solid transparent',
                      background: 'none',
                      fontSize: '13px',
                      fontWeight: activeMainTab === 'already_imported' ? '800' : '600',
                      color: activeMainTab === 'already_imported' ? '#1e293b' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    ⏭️ Already in Database ({getFeaturesByMainTab('already_imported').length})
                  </button>
                </div>

                {/* Tab Context Explanation */}
                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    {activeMainTab === 'new' && (
                      <span>✨ Discovered features ready to import. Pre-selected by default.</span>
                    )}
                    {activeMainTab === 'possible_duplicates' && (
                      <span>🔍 Features near existing infrastructure (&lt;25m or similar name). Check box only if you want to import as separate asset.</span>
                    )}
                    {activeMainTab === 'already_imported' && (
                      <span>⏭️ Features with identical OSM element ID already in MySQL. Automatically excluded.</span>
                    )}
                  </div>

                  {activeMainTab !== 'already_imported' && (
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
                        Select All
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
                  )}
                </div>

                {/* Category Pills Filter */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {['all', 'roads', 'bridges', 'schools', 'health', 'water', 'settlements'].map((cat) => {
                    const count = getFeaturesByMainTab(activeMainTab).filter((f) => cat === 'all' || f.category === cat).length;
                    return (
                      <button
                        key={`cat-pill-${cat}`}
                        type="button"
                        onClick={() => setActiveCategoryTab(cat)}
                        style={{
                          padding: '3px 9px',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          background: activeCategoryTab === cat ? '#176342' : '#f1f5f9',
                          color: activeCategoryTab === cat ? '#fff' : '#475569',
                          textTransform: 'capitalize',
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Features List */}
                <div
                  style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    padding: '6px',
                    marginBottom: '16px',
                  }}
                >
                  {getFilteredDiscoveryFeatures().length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
                      No features found in this category for {activeMainTab.replace('_', ' ')}.
                    </div>
                  ) : (
                    getFilteredDiscoveryFeatures().map((item, idx) => {
                      const isChecked = Boolean(selectedFeatureMap[item.id]);
                      const isAlready = item.duplicate_status === 'already_imported' || (item.is_duplicate && !item.is_possible_duplicate);
                      const isPossible = item.duplicate_status === 'possible_duplicate' || item.is_possible_duplicate;

                      return (
                        <div
                          key={`feat-${item.id}-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: '#fff',
                            border: `1px solid ${isPossible ? '#fde68a' : isAlready ? '#e2e8f0' : '#e2e8f0'}`,
                            borderRadius: '6px',
                            marginBottom: '4px',
                            opacity: isAlready ? 0.6 : 1,
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isAlready ? 'default' : 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isAlready}
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
                              {isPossible && (
                                <div style={{ fontSize: '10.5px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
                                  ⚠️ Matches: "{item.existing_name || 'Existing Record'}" ({item.match_reason || 'spatial proximity'}{item.distance_meters ? ` · ~${Math.round(item.distance_meters)}m away` : ''})
                                </div>
                              )}
                              {isAlready && (
                                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                                  Already in MySQL (OSM {item.osm_type || 'way'}/{item.osm_id || item.id})
                                </div>
                              )}
                            </div>
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: isAlready ? '#f1f5f9' : isPossible ? '#fef3c7' : '#ecfdf5',
                                color: isAlready ? '#475569' : isPossible ? '#92400e' : '#047857',
                              }}
                            >
                              {isAlready ? '⏭️ In Database' : isPossible ? '🔍 Review Candidate' : '✨ New'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>+ Add Infrastructure Asset</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>For {village.name || 'Active Village'}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddAssetModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
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
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>NetworkX Graph Topology Health</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Diagnostic Report for {village.name}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDiagnosticModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
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
