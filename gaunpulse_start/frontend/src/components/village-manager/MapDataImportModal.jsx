import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCode,
  FileSpreadsheet,
  Globe,
  HeartPulse,
  Info,
  Loader2,
  MapPin,
  Network,
  RefreshCw,
  Sparkles,
  Upload,
  Waypoints,
  Wrench,
  X,
} from 'lucide-react';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function MapDataImportModal({
  isOpen,
  onClose,
  villages = [],
  activeVillage = null,
  onImportComplete,
}) {
  const [selectedVillageId, setSelectedVillageId] = useState(activeVillage?.id || villages[0]?.id || 1);
  const [radius, setRadius] = useState(2000);
  const [importSource, setImportSource] = useState('osm'); // 'osm' | 'geojson' | 'csv'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Discovery state
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [confirmingLocation, setConfirmingLocation] = useState(false);

  // Category selections
  const [selection, setSelection] = useState({
    roads: true,
    bridges: true,
    schools: true,
    health: true,
    water: true,
    settlements: true,
  });

  // GeoJSON file state
  const [geoJsonFile, setGeoJsonFile] = useState(null);
  const [geoJsonParsed, setGeoJsonParsed] = useState(null);

  if (!isOpen) return null;

  const currentVillage = villages.find((v) => v.id === Number(selectedVillageId)) || activeVillage;

  // Step 3: Find Map Data (OSM)
  const handleFindMapData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/discover-osm?radius=${radius}&force=true`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Provider returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setScanData(data);
      setSummary(data.summary);
      setCategories(data.categories);

      if (data.summary?.provider_status === 'unavailable') {
        setError(data.summary.error || 'OpenStreetMap provider is currently unreachable. Please try again in a few moments.');
      } else if (data.summary?.total_features === 0) {
        setError('No mapped infrastructure records found in this immediate radius.');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve spatial map data.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Official Location
  const handleConfirmCoordinates = async () => {
    if (!scanData?.suggested_coordinates) return;
    setConfirmingLocation(true);
    setError(null);
    try {
      const coords = scanData.suggested_coordinates;
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/coordinates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center_lat: coords.lat,
          center_lng: coords.lng,
          confirmed: true,
          radius,
        }),
      });
      if (!res.ok) throw new Error('Failed to confirm official coordinates');
      setSuccess(`Coordinates confirmed to ${coords.lat}°N, ${coords.lng}°E! Re-scanning...`);
      await handleFindMapData();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmingLocation(false);
    }
  };

  // Step 6: Import Selected Records
  const handleImportSelected = async () => {
    if (!categories) return;
    setLoading(true);
    setError(null);
    try {
      const features = [];
      if (selection.roads && categories.roads) features.push(...categories.roads);
      if (selection.bridges && categories.bridges) features.push(...categories.bridges);
      if (selection.schools && categories.schools) features.push(...categories.schools);
      if (selection.health && categories.health) features.push(...categories.health);
      if (selection.water && categories.water) features.push(...categories.water);
      if (selection.settlements && categories.settlements) features.push(...categories.settlements);

      if (features.length === 0) {
        throw new Error('Please select at least one infrastructure category to import.');
      }

      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/confirm-osm-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features,
          batch_id: `osm_import_${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Import failed.');
      }

      const result = await res.json();
      setSuccess(`🎉 Successfully imported ${result.nodes_created || 0} nodes and ${result.edges_created || 0} lifelines into MySQL.`);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle GeoJSON file input
  const handleGeoJsonChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGeoJsonFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setGeoJsonParsed(parsed);
      } catch (err) {
        setError('Invalid GeoJSON JSON syntax.');
      }
    };
    reader.readAsText(file);
  };

  // Import GeoJSON Submit
  const handleImportGeoJsonSubmit = async () => {
    if (!geoJsonParsed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/villages/${selectedVillageId}/import-geojson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson: geoJsonParsed }),
      });
      if (!res.ok) throw new Error('Failed to import GeoJSON file.');
      const data = await res.json();
      setSuccess(`Imported GeoJSON: ${data.nodes_created || 0} nodes and ${data.edges_created || 0} edges added.`);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(18, 61, 48, 0.16)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #dfe6df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              <Upload size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#092d22', fontWeight: 800 }}>
                Import Map Data
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#687c73' }}>
                Easily discover OpenStreetMap records or upload custom GeoJSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#687c73' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Source Switcher */}
        <div style={{ display: 'flex', padding: '12px 24px', background: '#f8faf8', borderBottom: '1px solid #dfe6df', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setImportSource('osm')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: importSource === 'osm' ? '#176342' : '#ffffff',
              color: importSource === 'osm' ? '#ffffff' : '#495a52',
              boxShadow: importSource === 'osm' ? '0 2px 6px rgba(23,99,66,0.2)' : 'none',
            }}
          >
            🌐 OpenStreetMap Discovery
          </button>
          <button
            type="button"
            onClick={() => setImportSource('geojson')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: importSource === 'geojson' ? '#176342' : '#ffffff',
              color: importSource === 'geojson' ? '#ffffff' : '#495a52',
            }}
          >
            🗺️ Upload GeoJSON
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#eaf8ef', border: '1px solid #b8dfc2', color: '#176342', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* 1. Target Village Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, color: '#092d22', marginBottom: '6px' }}>
              1. Target Village *
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(Number(e.target.value))}
              className="vm-filter-select"
              style={{ width: '100%' }}
            >
              {deduplicateVillages(villages).map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVillageLabel(v)}
                </option>
              ))}
            </select>
          </div>

          {importSource === 'osm' ? (
            <>
              {/* 2. Geographic Area & Radius */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', background: '#f8faf8', border: '1px solid #e7ebe7', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#092d22' }}>
                    2. Geographic Study Area
                  </span>
                  <div style={{ fontSize: '12px', color: '#687c73', marginTop: '2px' }}>
                    Center: {scanData?.scan_center ? `${scanData.scan_center.lat.toFixed(4)}, ${scanData.scan_center.lng.toFixed(4)}` : `${currentVillage?.center_lat?.toFixed(4) || '28.0000'}, ${currentVillage?.center_lng?.toFixed(4) || '84.0000'}`}
                    {currentVillage?.is_coordinates_confirmed ? (
                      <span style={{ marginLeft: '6px', color: '#166534', fontWeight: 650 }}>✓ Confirmed</span>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#495a52' }}>Radius:</span>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="vm-filter-select"
                  >
                    <option value={1000}>1.0 km</option>
                    <option value={2000}>2.0 km</option>
                    <option value={3000}>3.0 km</option>
                    <option value={5000}>5.0 km</option>
                  </select>
                </div>
              </div>

              {/* Location Confirmation Banner if needed */}
              {(scanData?.needs_location_confirmation || currentVillage?.needs_location_confirmation || (!currentVillage?.is_coordinates_confirmed && currentVillage?.center_lat == 28.0 && currentVillage?.center_lng == 84.0)) && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <AlertTriangle size={16} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400e' }}>
                        Village Location Needs Confirmation
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#78350f', marginTop: '2px' }}>
                        Current scan center ({currentVillage?.center_lat?.toFixed(4)}, {currentVillage?.center_lng?.toFixed(4)}) is a broad district centroid.
                        {scanData?.suggested_coordinates && (
                          <span> Official catalog location for {currentVillage?.name}: <strong>{scanData.suggested_coordinates.lat.toFixed(4)}°N, {scanData.suggested_coordinates.lng.toFixed(4)}°E</strong>.</span>
                        )}
                      </div>
                      {scanData?.suggested_coordinates && (
                        <button
                          type="button"
                          onClick={handleConfirmCoordinates}
                          disabled={confirmingLocation}
                          style={{
                            marginTop: '8px',
                            background: '#166534',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '5px 12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {confirmingLocation ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
                          Confirm Official Coordinates ({scanData.suggested_coordinates.lat.toFixed(4)}°N, {scanData.suggested_coordinates.lng.toFixed(4)}°E)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Find Map Data Action */}
              <div>
                <button
                  type="button"
                  onClick={handleFindMapData}
                  disabled={loading}
                  className="button button--secondary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#166534',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Querying OpenStreetMap...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> 3. Find Map Data
                    </>
                  )}
                </button>
              </div>

              {/* 4. Preview Available Records */}
              {summary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#092d22', fontWeight: 750 }}>
                      4. Preview & Select Records to Add
                    </h4>
                    <span style={{ fontSize: '11px', color: '#687c73' }}>
                      {summary.attribution}
                    </span>
                  </div>

                  {/* Summary Metric Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{summary.total_features || 0}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>Discovered</div>
                    </div>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#047857' }}>{summary.new_features_count ?? summary.total_features}</div>
                      <div style={{ fontSize: '10.5px', color: '#065f46', fontWeight: 600 }}>✨ New</div>
                    </div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#b45309' }}>{summary.possible_duplicates_count ?? 0}</div>
                      <div style={{ fontSize: '10.5px', color: '#92400e', fontWeight: 600 }}>🔍 Possible Dups</div>
                    </div>
                    <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#475569' }}>{summary.already_imported_count ?? 0}</div>
                      <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>⏭️ In DB</div>
                    </div>
                  </div>

                  <div className="vm-infra-grid">
                    {[
                      { key: 'roads', label: 'Roads & Trails', count: summary.roads_count },
                      { key: 'bridges', label: 'Bridges', count: summary.bridges_count },
                      { key: 'schools', label: 'Schools', count: summary.schools_count },
                      { key: 'health', label: 'Health Posts', count: summary.health_count },
                      { key: 'water', label: 'Water Sources', count: summary.water_count },
                      { key: 'settlements', label: 'Settlements', count: summary.settlements_count },
                    ].map((item) => (
                      <label
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: '#f8faf8',
                          border: '1px solid #e7ebe7',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selection[item.key]}
                          onChange={(e) => setSelection({ ...selection, [item.key]: e.target.checked })}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 750, color: '#092d22' }}>
                            {item.count}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#526359' }}>{item.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* 5. Import Selected Button */}
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleImportSelected}
                      disabled={loading || summary.total_features === 0}
                      className="button button--primary"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#176342',
                        color: '#ffffff',
                        fontWeight: 750,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                      Import Selected Records to MySQL
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* GeoJSON File Upload */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '20px', border: '2px dashed #c8d8cc', borderRadius: '10px', textAlign: 'center' }}>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleGeoJsonChange}
                  style={{ display: 'none' }}
                  id="geojson-file-picker"
                />
                <label htmlFor="geojson-file-picker" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileCode size={32} color="#176342" />
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#092d22' }}>
                    {geoJsonFile ? geoJsonFile.name : 'Choose a .geojson or .json file'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#687c73' }}>
                    Accepts FeatureCollection with Point, LineString, and MultiLineString
                  </span>
                </label>
              </div>

              {geoJsonParsed && (
                <div>
                  <div style={{ fontSize: '12.5px', color: '#176342', fontWeight: 600, marginBottom: '10px' }}>
                    Detected {geoJsonParsed.features?.length || 0} features in file.
                  </div>
                  <button
                    type="button"
                    onClick={handleImportGeoJsonSubmit}
                    disabled={loading}
                    className="button button--primary"
                    style={{ width: '100%', padding: '10px', background: '#176342', color: '#fff', fontWeight: 700 }}
                  >
                    Import GeoJSON Features
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #dfe6df', display: 'flex', justifyContent: 'flex-end', background: '#ffffff' }}>
          <button type="button" onClick={onClose} className="button button--secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
