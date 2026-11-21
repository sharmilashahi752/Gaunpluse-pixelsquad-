import { useEffect, useState } from 'react';
import { Building2, GraduationCap, HeartPulse, House, Layers3, Maximize2, TriangleAlert, Waypoints } from 'lucide-react';
import { Card, CardHeader, LiveLabel, TextButton } from './ui';

const markerIcons = {
  settlement: House,
  village: House,
  bridge: TriangleAlert,
  health_post: HeartPulse,
  health: HeartPulse,
  school: GraduationCap,
  facility: Building2,
  water_point: Waypoints,
};

export default function VillageMapPreview({ onOpenMap, expanded = false }) {
  const [network, setNetwork] = useState(null);
  const [villageName, setVillageName] = useState('Bhotenamlang');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/villages')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) {
          const v = list[0];
          setVillageName(`${v.name} (${v.municipality || 'Helambu'})`);
          return fetch(`http://127.0.0.1:8000/api/villages/${v.id}/network`);
        }
        return fetch('http://127.0.0.1:8000/api/villages/1/network');
      })
      .then((res) => res?.json())
      .then((net) => {
        if (net && Array.isArray(net.nodes)) {
          setNetwork(net);
        }
      })
      .catch((err) => console.warn('Could not load map preview network:', err));
  }, []);

  const nodes = network?.nodes || [];
  const edges = network?.edges || [];

  // Compute normalized bounding box for GIS nodes
  let normalizedNodes = [];
  if (nodes.length > 0) {
    const lats = nodes.map((n) => parseFloat(n.latitude || n.lat)).filter((n) => !isNaN(n));
    const lngs = nodes.map((n) => parseFloat(n.longitude || n.lng)).filter((n) => !isNaN(n));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    normalizedNodes = nodes.slice(0, 12).map((n, idx) => {
      const lat = parseFloat(n.latitude || n.lat);
      const lng = parseFloat(n.longitude || n.lng);
      const x = isNaN(lng) ? 15 + (idx * 23) % 70 : 12 + ((lng - minLng) / lngSpan) * 76;
      const y = isNaN(lat) ? 20 + (idx * 19) % 60 : 15 + (1 - (lat - minLat) / latSpan) * 70;
      return {
        id: n.id || idx,
        label: n.name || n.node_code || `Node ${idx + 1}`,
        type: n.node_type || 'facility',
        x: Math.max(8, Math.min(88, x)),
        y: Math.max(12, Math.min(84, y)),
        status: (n.node_type === 'bridge' || idx % 4 === 1) ? 'operational' : 'connected',
      };
    });
  }

  return (
    <Card className={`map-card ${expanded ? 'map-card--expanded' : ''}`}>
      <CardHeader
        eyebrow="Infrastructure overview"
        title="Village GIS Network"
        description={`${villageName} · ${nodes.length || 19} Lifeline Nodes · ${edges.length || 10} Connected Ways`}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LiveLabel text="Live GIS Layer" compact />
            <TextButton onClick={onOpenMap}>View full map</TextButton>
          </div>
        }
      />
      <div
        className="map-preview"
        aria-label="Interactive map preview of village infrastructure"
        onClick={onOpenMap}
        style={{ cursor: 'pointer' }}
      >
        <div className="map-preview__controls" aria-hidden="true">
          <span><Layers3 size={16} /></span>
          <span><Maximize2 size={16} /></span>
        </div>
        <span className="map-preview__river" aria-hidden="true" />
        <span className="map-preview__road map-preview__road--one" aria-hidden="true" />
        <span className="map-preview__road map-preview__road--two" aria-hidden="true" />

        {normalizedNodes.map((location) => {
          const MarkerIcon = markerIcons[location.type] || Building2;
          return (
            <button
              key={location.id}
              className={`map-marker map-marker--${location.status}`}
              style={{ left: `${location.x}%`, top: `${location.y}%` }}
              type="button"
              aria-label={`${location.label}, ${location.status}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenMap();
              }}
            >
              <span><MarkerIcon size={14} /></span>
              <strong>{location.label}</strong>
            </button>
          );
        })}
      </div>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="legend-dot legend-dot--green"><House size={11} /></i>Settlements</span>
        <span><i className="legend-dot legend-dot--blue"><HeartPulse size={11} /></i>Health Posts</span>
        <span><i className="legend-dot legend-dot--purple"><GraduationCap size={11} /></i>Schools</span>
        <span><i className="legend-dot legend-dot--orange"><TriangleAlert size={11} /></i>Bridges & Lifelines</span>
      </div>
    </Card>
  );
}
