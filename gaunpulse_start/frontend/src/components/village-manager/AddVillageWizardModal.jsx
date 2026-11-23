import { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  MapPin,
  Network,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Waypoints,
  Wrench,
  X,
} from 'lucide-react';

const API_BASE = '/api';

// Smooth map fly-to controller
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, zoom || 14, { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map click listener to pick geographic coordinates
function LocationPickerHandler({ onPick }) {
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

// Custom location marker icon
const pinIcon = L.divIcon({
  className: 'custom-pin-marker',
  html: `<div style="width:36px; height:36px; border-radius:50%; background:#176342; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#ffffff;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

export default function AddVillageWizardModal({
  isOpen,
  onClose,
  onVillageCreated,
  initialDraft = null,
}) {
  const [step, setStep] = useState(initialDraft?.onboarding_step || 1);
  const [draftId, setDraftId] = useState(initialDraft?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Administrative Directory state
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);

  // Step 1: Village Details Form
  const [form, setForm] = useState({
    province: initialDraft?.province || 'Bagmati Province',
    district: initialDraft?.district || 'Sindhupalchok',
    municipality: initialDraft?.municipality || 'Helambu Rural Municipality',
    ward_no: initialDraft?.ward_no || '4',
    name: initialDraft?.name || '',
    local_name: initialDraft?.local_name || '',
    description: initialDraft?.description || '',
    center_lat: initialDraft?.center_lat || 27.8635,
    center_lng: initialDraft?.center_lng || 85.5815,
    radius: 2000, // 2 km default
  });

  // Step 2: Location search query
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Step 3: Discovery state
  const [discoverySummary, setDiscoverySummary] = useState(null);
  const [discoveryCategories, setDiscoveryCategories] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState(null);

  // Step 4: Review Category Inclusions
  const [selectedCategories, setSelectedCategories] = useState({
    roads: true,
    bridges: true,
    schools: true,
    health: true,
    water: true,
    settlements: true,
  });

  // Load Nepal Location Directory on mount
  useEffect(() => {
    if (!isOpen) return;

    fetch(`${API_BASE}/locations/provinces`)
      .then((r) => r.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load provinces:', err));

    fetch(`${API_BASE}/locations/districts?province=${encodeURIComponent(form.province)}`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load districts:', err));

    fetch(`${API_BASE}/locations/municipalities?district=${encodeURIComponent(form.district)}`)
      .then((r) => r.json())
      .then((data) => setMunicipalities(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load municipalities:', err));

    fetch(`${API_BASE}/locations/wards?municipality=${encodeURIComponent(form.municipality)}`)
      .then((r) => r.json())
      .then((data) => setWards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load wards:', err));
  }, [isOpen]);

  // Handle Province Change
  const handleProvinceChange = async (provName) => {
    setForm((prev) => ({ ...prev, province: provName }));
    try {
      const res = await fetch(`${API_BASE}/locations/districts?province=${encodeURIComponent(provName)}`);
      const dists = await res.json();
      setDistricts(dists);
      if (dists.length > 0) {
        handleDistrictChange(dists[0], provName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle District Change
  const handleDistrictChange = async (distName, provName = form.province) => {
    setForm((prev) => ({ ...prev, district: distName }));
    try {
      const res = await fetch(`${API_BASE}/locations/municipalities?district=${encodeURIComponent(distName)}`);
      const munis = await res.json();
      setMunicipalities(munis);
      if (munis.length > 0) {
        handleMunicipalityChange(munis[0].name, munis[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Municipality Change
  const handleMunicipalityChange = async (muniName, muniObj = null) => {
    const selectedMuni = muniObj || municipalities.find((m) => m.name === muniName);
    const centerLat = selectedMuni?.center_lat || form.center_lat;
    const centerLng = selectedMuni?.center_lng || form.center_lng;

    setForm((prev) => ({
      ...prev,
      municipality: muniName,
      center_lat: centerLat,
      center_lng: centerLng,
    }));

    try {
      const res = await fetch(`${API_BASE}/locations/wards?municipality=${encodeURIComponent(muniName)}`);
      const wardList = await res.json();
      setWards(wardList);
    } catch (e) {
      console.error(e);
    }
  };

  // Map Location Search
  const handleMapLocationSearch = async (e) => {
    e?.preventDefault();
    if (!mapSearchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      const q = `${mapSearchQuery.trim()}, Nepal`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=np&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setForm((prev) => ({ ...prev, center_lat: lat, center_lng: lon }));
      } else {
        alert('Location not found in Nepal. Please click on the map to place pin.');
      }
    } catch (err) {
      console.error('Nominatim search error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Save Incomplete Draft
  const handleSaveDraft = async (targetStep = step) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        draft_id: draftId,
        onboarding_step: targetStep,
        name: form.name.trim() || `${form.municipality} Ward ${form.ward_no} Village`,
        local_name: form.local_name.trim(),
        ward_no: form.ward_no,
        municipality: form.municipality,
        district: form.district,
        province: form.province,
        center_lat: form.center_lat,
        center_lng: form.center_lng,
        description: form.description,
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
      setDraftId(resData.draft_id);
      return resData.draft_id;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Run OSM Discovery in Step 3
  const handleFindInfrastructure = async () => {
    setIsDiscovering(true);
    setDiscoveryError(null);
    try {
      // 1. Ensure draft is saved in database first
      let activeDraftId = draftId;
      if (!activeDraftId) {
        activeDraftId = await handleSaveDraft(3);
      }
      if (!activeDraftId) {
        throw new Error('Please enter village details before finding infrastructure.');
      }

      // 2. Call OSM Discovery API
      const res = await fetch(`${API_BASE}/villages/${activeDraftId}/discover-osm?radius=${form.radius}&force=true`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Provider responded with status ${res.status}`);
      }

      const data = await res.json();
      setDiscoverySummary(data.summary);
      setDiscoveryCategories(data.categories);

      if (data.summary?.provider_status === 'unavailable') {
        setDiscoveryError('External OpenStreetMap service temporarily busy. You can retry or proceed with manual entry.');
      }
    } catch (err) {
      setDiscoveryError(err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Step 4: Final Save & Activation
  const handleFinalSave = async (asDraft = false) => {
    setLoading(true);
    setError(null);
    try {
      let activeDraftId = draftId;
      if (!activeDraftId) {
        activeDraftId = await handleSaveDraft(4);
      }
      if (!activeDraftId) throw new Error('Could not persist village details.');

      // 1. If features discovered and selected, persist them
      if (discoveryCategories && !asDraft) {
        const featuresToPersist = [];
        if (selectedCategories.roads && discoveryCategories.roads) {
          featuresToPersist.push(...discoveryCategories.roads);
        }
        if (selectedCategories.bridges && discoveryCategories.bridges) {
          featuresToPersist.push(...discoveryCategories.bridges);
        }
        if (selectedCategories.schools && discoveryCategories.schools) {
          featuresToPersist.push(...discoveryCategories.schools);
        }
        if (selectedCategories.health && discoveryCategories.health) {
          featuresToPersist.push(...discoveryCategories.health);
        }
        if (selectedCategories.water && discoveryCategories.water) {
          featuresToPersist.push(...discoveryCategories.water);
        }
        if (selectedCategories.settlements && discoveryCategories.settlements) {
          featuresToPersist.push(...discoveryCategories.settlements);
        }

        if (featuresToPersist.length > 0) {
          await fetch(`${API_BASE}/villages/${activeDraftId}/confirm-osm-import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features: featuresToPersist }),
          });
        }
      }

      // 2. Activate village if not draft
      if (!asDraft) {
        const activateRes = await fetch(`${API_BASE}/villages/${activeDraftId}/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!activateRes.ok) throw new Error('Activation failed');
        const actData = await activateRes.json();
        if (onVillageCreated) {
          onVillageCreated(actData.village || { id: activeDraftId, ...form });
        }
      } else {
        if (onVillageCreated) {
          onVillageCreated({ id: activeDraftId, ...form, status: 'draft' });
        }
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(18, 61, 48, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(18, 61, 48, 0.16)',
          overflow: 'hidden',
        }}
      >
        {/* Wizard Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #dfe6df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eaf5ee',
                color: '#176342',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#092d22', fontWeight: 800 }}>
                Add New Village
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#687c73' }}>
                Follow the 4 guided steps to register and map your village
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#687c73',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="vm-stepper">
          {[
            { num: 1, label: '1. Village Details' },
            { num: 2, label: '2. Select Location' },
            { num: 3, label: '3. Find Infrastructure' },
            { num: 4, label: '4. Review & Finish' },
          ].map((st) => (
            <div
              key={st.num}
              className={`vm-step-pill ${
                step === st.num
                  ? 'vm-step-pill--active'
                  : step > st.num
                  ? 'vm-step-pill--done'
                  : ''
              }`}
            >
              {step > st.num ? '✓ ' : ''}
              {st.label}
            </div>
          ))}
        </div>

        {/* Wizard Body (Scrollable) */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: VILLAGE DETAILS ================= */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px 16px', background: '#f8faf8', border: '1px solid #e7ebe7', borderRadius: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#495a52', lineHeight: 1.5 }}>
                  Select the official administrative jurisdiction in Nepal. GaunPulse automatically validates Province, District, and Municipality relationships.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                    Province *
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="vm-filter-select"
                    style={{ width: '100%' }}
                  >
                    {provinces.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name} ({p.local_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                    District *
                  </label>
                  <select
                    value={form.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="vm-filter-select"
                    style={{ width: '100%' }}
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                    Municipality / Rural Municipality *
                  </label>
                  <select
                    value={form.municipality}
                    onChange={(e) => handleMunicipalityChange(e.target.value)}
                    className="vm-filter-select"
                    style={{ width: '100%' }}
                  >
                    {municipalities.map((m) => (
                      <option key={m.code} value={m.name}>
                        {m.name} ({m.local_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                    Ward Number *
                  </label>
                  <select
                    value={form.ward_no}
                    onChange={(e) => setForm((prev) => ({ ...prev, ward_no: e.target.value }))}
                    className="vm-filter-select"
                    style={{ width: '100%' }}
                  >
                    {wards.map((w) => (
                      <option key={w.ward_no} value={w.ward_no}>
                        {w.name} ({w.local_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                    Village / Settlement Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhotenamlang Model Village"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #c8d8cc',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                    Local Name (Devanagari)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. भोटेनाम्लाङ नमुना गाउँ"
                    value={form.local_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, local_name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #c8d8cc',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hilltop farming community along the ridge with pedestrian foot trails..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #c8d8cc',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 2: SELECT LOCATION ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <form onSubmit={handleMapLocationSearch} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search town, hill, or bazaar in Nepal..."
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #c8d8cc',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSearchingMap}
                      className="button button--secondary"
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
                      <Search size={14} /> Search
                    </button>
                  </form>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#495a52', fontWeight: 600 }}>Study Radius:</span>
                  <select
                    value={form.radius}
                    onChange={(e) => setForm((prev) => ({ ...prev, radius: Number(e.target.value) }))}
                    className="vm-filter-select"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    <option value={1000}>1.0 km (Compact Hamlet)</option>
                    <option value={2000}>2.0 km (Standard Village)</option>
                    <option value={3000}>3.0 km (Ridge & Valley)</option>
                    <option value={5000}>5.0 km (Broad Ward Study)</option>
                  </select>
                </div>
              </div>

              {/* Interactive Leaflet Map */}
              <div
                style={{
                  height: '320px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #c8d8cc',
                  position: 'relative',
                }}
              >
                <MapContainer
                  center={[form.center_lat, form.center_lng]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <ChangeMapView center={[form.center_lat, form.center_lng]} zoom={14} />
                  <LocationPickerHandler
                    onPick={(lat, lng) => setForm((prev) => ({ ...prev, center_lat: lat, center_lng: lng }))}
                  />
                  <Marker position={[form.center_lat, form.center_lng]} icon={pinIcon} />
                  <Circle
                    center={[form.center_lat, form.center_lng]}
                    radius={form.radius}
                    pathOptions={{ color: '#176342', fillColor: '#176342', fillOpacity: 0.12, weight: 2 }}
                  />
                </MapContainer>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 1000,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(4px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    color: '#092d22',
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  📍 Center: {form.center_lat.toFixed(4)}, {form.center_lng.toFixed(4)} (Click map to reposition)
                </div>
              </div>

              {/* Plain-Language Explanation */}
              <div style={{ padding: '12px 16px', background: '#f8faf8', border: '1px solid #e7ebe7', borderRadius: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={16} color="#176342" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#495a52', lineHeight: 1.45 }}>
                    <strong>Administrative Boundary vs. Study Area:</strong> Your administrative boundary defines official ward jurisdiction. The green circle is your <em>study area</em>—the radius where roads, suspension bridges, schools, and health posts are analyzed for everyday walking and tractor journeys.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: FIND INFRASTRUCTURE ================= */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center', padding: '14px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '17px', color: '#092d22', fontWeight: 800 }}>
                  Let's find available roads, bridges and public facilities
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.45 }}>
                  GaunPulse can automatically query OpenStreetMap within your {form.radius / 1000} km study radius around {form.name || 'your village'}.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleFindInfrastructure}
                    disabled={isDiscovering}
                    className="button button--primary"
                    style={{
                      background: '#176342',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '10px 22px',
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isDiscovering ? (
                      <>
                        <Loader2 size={16} className="spin" /> Searching OpenStreetMap...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Find Infrastructure Automatically
                      </>
                    )}
                  </button>
                </div>
              </div>

              {discoveryError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>{discoveryError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFindInfrastructure}
                    style={{ background: 'none', border: 'none', color: '#991b1b', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Categorized Discovery Results Grid */}
              <div className="vm-infra-grid">
                <div className="vm-infra-card">
                  <div className="vm-infra-card__icon">
                    <Waypoints size={20} />
                  </div>
                  <div>
                    <div className="vm-infra-card__count">
                      {discoverySummary?.roads_count ?? (isDiscovering ? '...' : 0)}
                    </div>
                    <div className="vm-infra-card__label">Roads & Footpaths</div>
                  </div>
                </div>

                <div className="vm-infra-card">
                  <div className="vm-infra-card__icon">
                    <Network size={20} />
                  </div>
                  <div>
                    <div className="vm-infra-card__count">
                      {discoverySummary?.bridges_count ?? (isDiscovering ? '...' : 0)}
                    </div>
                    <div className="vm-infra-card__label">Bridges Found</div>
                  </div>
                </div>

                <div className="vm-infra-card">
                  <div className="vm-infra-card__icon">
                    <Building size={20} />
                  </div>
                  <div>
                    <div className="vm-infra-card__count">
                      {discoverySummary?.schools_count ?? (isDiscovering ? '...' : 0)}
                    </div>
                    <div className="vm-infra-card__label">Schools Found</div>
                  </div>
                </div>

                <div className="vm-infra-card">
                  <div className="vm-infra-card__icon">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <div className="vm-infra-card__count">
                      {discoverySummary?.health_count ?? (isDiscovering ? '...' : 0)}
                    </div>
                    <div className="vm-infra-card__label">Health Facilities</div>
                  </div>
                </div>

                <div className="vm-infra-card">
                  <div className="vm-infra-card__icon">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="vm-infra-card__count">
                      {discoverySummary?.settlements_count ?? (isDiscovering ? '...' : 0)}
                    </div>
                    <div className="vm-infra-card__label">Settlements</div>
                  </div>
                </div>

                <div className="vm-infra-card">
                  <div className="vm-infra-card__icon">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div className="vm-infra-card__count">
                      {discoverySummary?.water_count ?? (isDiscovering ? '...' : 0)}
                    </div>
                    <div className="vm-infra-card__label">Water Facilities</div>
                  </div>
                </div>
              </div>

              {/* No Records Found Offer */}
              {discoverySummary && discoverySummary.total_features === 0 && (
                <div style={{ padding: '14px', background: '#f8faf8', border: '1px solid #e7ebe7', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#495a52' }}>
                    No mapped OpenStreetMap features were detected in this immediate radius. You can click <strong>Save Village</strong> now and easily add roads and facilities manually in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: REVIEW & FINISH ================= */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#092d22', fontWeight: 800 }}>
                  Ready to Register: {form.name || 'Unnamed Village'}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px', color: '#166534', marginTop: '6px' }}>
                  <span>📍 {form.province} · {form.district}</span>
                  <span>🏛️ {form.municipality} (Ward {form.ward_no})</span>
                  <span>🌐 Lat: {form.center_lat.toFixed(4)}, Lng: {form.center_lng.toFixed(4)}</span>
                </div>
              </div>

              {/* Review Discovered Records & Selection */}
              <div style={{ background: '#ffffff', border: '1px solid #dfe6df', borderRadius: '12px', padding: '16px' }}>
                <h5 style={{ margin: '0 0 12px', fontSize: '14px', color: '#092d22', fontWeight: 700 }}>
                  Records Selected for Automatic Import:
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {Object.entries({
                    roads: `Roads (${discoverySummary?.roads_count || 0})`,
                    bridges: `Bridges (${discoverySummary?.bridges_count || 0})`,
                    schools: `Schools (${discoverySummary?.schools_count || 0})`,
                    health: `Health Posts (${discoverySummary?.health_count || 0})`,
                    water: `Water Points (${discoverySummary?.water_count || 0})`,
                    settlements: `Settlements (${discoverySummary?.settlements_count || 0})`,
                  }).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#092d22', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedCategories[key]}
                        onChange={(e) => setSelectedCategories((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verification & Quality Preview */}
              <div style={{ padding: '14px', background: '#f8faf8', border: '1px solid #e7ebe7', borderRadius: '10px', fontSize: '12.5px', color: '#495a52' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#092d22', marginBottom: '4px' }}>
                  <ShieldCheck size={16} color="#16a34a" /> Verification & Simulation Readiness
                </div>
                Upon saving, this village will immediately appear in the <strong>Village Directory</strong>, <strong>Village Map</strong>, and <strong>Impact Simulator</strong>. Imported OpenStreetMap lifelines can be edited, augmented, or field-verified anytime.
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #dfe6df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            gap: '12px',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="button button--secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSaveDraft(step)}
              disabled={loading}
              className="button button--secondary"
              style={{ fontSize: '13px' }}
            >
              Save as Draft
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={async () => {
                  if (step === 1 && !form.name.trim()) {
                    setError('Please enter a village name.');
                    return;
                  }
                  await handleSaveDraft(step);
                  setStep(step + 1);
                }}
                disabled={loading}
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
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSave(false)}
                disabled={loading}
                className="button button--primary"
                style={{
                  background: '#22c55e',
                  color: '#092d22',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  padding: '10px 22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                Save Village
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
