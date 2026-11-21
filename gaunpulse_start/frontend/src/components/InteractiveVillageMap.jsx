import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Building2,
  Droplets,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Waypoints,
} from 'lucide-react';

// Helper component to center map when village data changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Custom DivIcons styled to match GaunPulse forest/cream design system
function createCustomIcon(type, status = 'operational', count = null) {
  let bg = '#176342'; // forest green
  let border = '#ffffff';
  let svgPath = '';

  if (type === 'settlement') {
    bg = '#124b35';
    // House icon svg
    svgPath = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  } else if (type === 'school') {
    bg = '#1d4ed8'; // blue
    svgPath = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
  } else if (type === 'health_post' || type === 'health') {
    bg = '#0f766e'; // teal
    svgPath = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5v6"/><path d="M9 8h6"/></svg>`;
  } else if (type === 'water_point' || type === 'water') {
    bg = '#0284c7'; // cyan/water
    svgPath = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
  } else if (type === 'issue' || type === 'hazard') {
    bg = status === 'critical' ? '#b91c1c' : '#c2410c'; // intense red / amber
    svgPath = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  } else {
    // Junction / transit
    bg = '#64748b';
    svgPath = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>`;
  }

  if (status === 'blocked' || status === 'unreachable') {
    bg = '#c94b46'; // red
  } else if (status === 'limited' || status === 'detour') {
    bg = '#e98535'; // orange
  }

  const badgeHtml = count !== null && count > 0
    ? `<span style="position:absolute; top:-6px; right:-8px; background:#e98535; color:#fff; font-size:10px; font-weight:800; border-radius:99px; padding:1px 5px; box-shadow:0 2px 5px rgba(0,0,0,0.25);">${count}</span>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; width:34px; height:34px; background:${bg}; border:2.5px solid ${border}; border-radius:50%; display:grid; place-items:center; box-shadow:0 4px 12px rgba(18,62,44,0.35); transform:translate(-50%, -50%); cursor:pointer;">
        ${svgPath}
        ${badgeHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export default function InteractiveVillageMap({
  villageData,
  highlightedEdgeIds = [],
  highlightedStatus = 'blocked',
  height = '520px',
  onSelectEdge,
  selectedEdgeId,
}) {
  const [activeLayers, setActiveLayers] = useState({
    settlements: true,
    facilities: true,
    roads: true,
    bridges: true,
    issues: true,
  });

  const nodes = villageData?.nodes || [];
  const edges = villageData?.edges || [];
  const issues = villageData?.issues || [];
  const village = villageData?.village || {};

  const centerLat = parseFloat(village.center_lat || village.latitude || 27.8635);
  const centerLng = parseFloat(village.center_lng || village.longitude || 85.5815);

  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(String(n.id), n));

  const toggleLayer = (layer) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="village-map-container" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #dfe6df', boxShadow: '0 8px 24px rgba(18,62,44,0.06)' }}>
      {/* Layer Filter Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid #dfe6df',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '11px',
          fontWeight: '600',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#176342', marginRight: '4px' }}>
          <Layers size={14} /> Layers:
        </span>
        <button
          type="button"
          onClick={() => toggleLayer('settlements')}
          style={{
            border: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: activeLayers.settlements ? '#e4f4e9' : '#f1f5f9',
            color: activeLayers.settlements ? '#124b35' : '#64748b',
          }}
        >
          Settlements
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('facilities')}
          style={{
            border: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: activeLayers.facilities ? '#e0f2fe' : '#f1f5f9',
            color: activeLayers.facilities ? '#0369a1' : '#64748b',
          }}
        >
          Facilities
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('bridges')}
          style={{
            border: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: activeLayers.bridges ? '#ffedd5' : '#f1f5f9',
            color: activeLayers.bridges ? '#c2410c' : '#64748b',
          }}
        >
          Bridges
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('issues')}
          style={{
            border: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: activeLayers.issues ? '#fee2e2' : '#f1f5f9',
            color: activeLayers.issues ? '#b91c1c' : '#64748b',
          }}
        >
          ⚠️ Issues ({issues.length})
        </button>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height, width: '100%', background: '#eef2ee' }}
      >
        <ChangeView center={[centerLat, centerLng]} zoom={14} />

        {/* OpenStreetMap Base Layer with Required Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | GaunPulse Rural GIS'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* 1. Infrastructure Edges (Roads, Bridges, Trails) */}
        {edges.map((edge) => {
          const sNode = nodeMap.get(String(edge.source_node_id || edge.source_id));
          const tNode = nodeMap.get(String(edge.target_node_id || edge.target_id));
          if (!sNode || !tNode || !sNode.latitude || !sNode.longitude || !tNode.latitude || !tNode.longitude) {
            return null;
          }

          const isBridge = (edge.infrastructure_type || edge.type) === 'bridge';
          if (isBridge && !activeLayers.bridges) return null;
          if (!isBridge && !activeLayers.roads) return null;

          const edgeIdStr = String(edge.id);
          const edgeCodeStr = String(edge.edge_code || '');
          const isHighlighted =
            highlightedEdgeIds.map(String).includes(edgeIdStr) ||
            highlightedEdgeIds.map(String).includes(edgeCodeStr);
          const isSelected = selectedEdgeId && (String(selectedEdgeId) === edgeIdStr || String(selectedEdgeId) === edgeCodeStr);

          // Color calculation
          let color = '#248157'; // Green: Operational
          let weight = isBridge ? 6 : 4;
          let dashArray = null;

          if (isHighlighted) {
            color = highlightedStatus === 'blocked' ? '#c94b46' : '#e98535'; // Red or Orange
            weight = 8;
            dashArray = '6, 6';
          } else if (edge.status === 'blocked') {
            color = '#c94b46';
            dashArray = '8, 8';
          } else if (edge.status === 'limited' || edge.status === 'under_review') {
            color = '#e98535';
          } else if (isBridge) {
            color = '#b45309'; // Bridge distinct amber/brown
          }

          if (isSelected) {
            weight = 9;
            color = '#f97316';
          }

          return (
            <Polyline
              key={`edge-${edge.id}`}
              positions={[
                [parseFloat(sNode.latitude), parseFloat(sNode.longitude)],
                [parseFloat(tNode.latitude), parseFloat(tNode.longitude)],
              ]}
              pathOptions={{
                color,
                weight,
                dashArray,
                opacity: isHighlighted ? 0.95 : 0.8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectEdge && onSelectEdge(edge),
              }}
            >
              <Tooltip sticky>
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  {edge.name || `Edge ${edge.id}`}
                  <div style={{ fontSize: '10px', color: isHighlighted ? '#c94b46' : '#64748b' }}>
                    {isHighlighted ? '⚠️ SIMULATED BLOCKED' : `Status: ${edge.status || 'operational'}`}
                    {edge.length_meters && ` · ${edge.length_meters}m`}
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: '190px', padding: '4px' }}>
                  <h4 style={{ margin: '0 0 4px', color: '#092d22', fontSize: '13px' }}>
                    {edge.name || `Edge ${edge.id}`}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                    <p style={{ margin: '2px 0' }}><strong>Code:</strong> {edge.edge_code || edge.id}</p>
                    <p style={{ margin: '2px 0' }}><strong>Type:</strong> {edge.infrastructure_type || edge.type || 'Road'}</p>
                    <p style={{ margin: '2px 0' }}><strong>Surface:</strong> {edge.surface_type || 'Gravel'}</p>
                    <p style={{ margin: '2px 0' }}><strong>Length:</strong> {edge.length_meters ? `${edge.length_meters} meters` : 'Estimated'}</p>
                    <p style={{ margin: '2px 0' }}><strong>Condition:</strong> <span style={{ color, fontWeight: 'bold' }}>{edge.status || 'Operational'}</span></p>
                    {edge.notes && <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#687c73' }}>{edge.notes}</p>}
                    {onSelectEdge && (
                      <button
                        type="button"
                        onClick={() => onSelectEdge(edge)}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          background: '#176342',
                          color: '#fff',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '11px',
                        }}
                      >
                        Select for Simulation
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* 2. Infrastructure Nodes (Settlements & Facilities) */}
        {nodes.map((node) => {
          if (!node.latitude || !node.longitude) return null;
          const lat = parseFloat(node.latitude);
          const lng = parseFloat(node.longitude);
          const nodeType = (node.node_type || node.type || 'junction').toLowerCase();

          const isSettlement = nodeType === 'settlement' || (node.households && node.households > 0) || node.settlement_group_id;
          const isFacility = ['school', 'health_post', 'health', 'water_point', 'facility'].includes(nodeType);

          if (isSettlement && !activeLayers.settlements) return null;
          if (isFacility && !activeLayers.facilities) return null;

          const markerType = isSettlement ? 'settlement' : nodeType;
          const icon = createCustomIcon(markerType, 'operational', node.households);

          return (
            <Marker key={`node-${node.id}`} position={[lat, lng]} icon={icon}>
              <Popup>
                <div style={{ minWidth: '180px', padding: '4px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#176342', fontWeight: 'bold' }}>
                    {isSettlement ? 'Village Settlement' : 'Essential Facility'}
                  </span>
                  <h4 style={{ margin: '2px 0 6px', color: '#092d22', fontSize: '13px' }}>
                    {node.name || `Node ${node.id}`}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                    {isSettlement && (
                      <>
                        <p style={{ margin: '2px 0' }}><strong>Households:</strong> {node.households || 'Documented'}</p>
                        {node.population && <p style={{ margin: '2px 0' }}><strong>Population:</strong> {node.population}</p>}
                      </>
                    )}
                    {isFacility && (
                      <p style={{ margin: '2px 0' }}><strong>Facility Type:</strong> {nodeType.replace('_', ' ').toUpperCase()}</p>
                    )}
                    {node.description && <p style={{ margin: '4px 0 0', color: '#687c73' }}>{node.description}</p>}
                    <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>
                      Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Reported Infrastructure Issues Layer */}
        {activeLayers.issues &&
          issues.map((issue) => {
            if (!issue.latitude || !issue.longitude) return null;
            const lat = parseFloat(issue.latitude);
            const lng = parseFloat(issue.longitude);
            const isCritical = (issue.severity || '').toLowerCase() === 'critical';
            const icon = createCustomIcon('issue', isCritical ? 'critical' : 'limited');

            return (
              <Marker key={`issue-marker-${issue.id}`} position={[lat, lng]} icon={icon}>
                <Popup>
                  <div style={{ minWidth: '220px', padding: '4px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                      <span
                        style={{
                          background: isCritical ? '#fee2e2' : '#ffedd5',
                          color: isCritical ? '#991b1b' : '#c2410c',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {issue.severity || 'Hazard'}
                      </span>
                      <span
                        style={{
                          background: '#e2e8f0',
                          color: '#475569',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {issue.status || 'Reported'}
                      </span>
                    </div>
                    <h4 style={{ margin: '4px 0', color: '#092d22', fontSize: '13px' }}>
                      {issue.title}
                    </h4>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#687c73' }}>
                      <strong>Code:</strong> {issue.tracking_code || `GP-${issue.id}`} · <strong>Category:</strong> {(issue.category || '').replace('_', ' ')}
                    </p>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#19392f', lineHeight: '1.4' }}>
                      {issue.description}
                    </p>
                    {issue.reporter_name && (
                      <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b', fontStyle: 'italic' }}>
                        Reported by: {issue.reporter_name}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Map Legend Footer */}
      <div
        style={{
          background: '#ffffff',
          padding: '10px 16px',
          borderTop: '1px solid #dfe6df',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '11.5px',
          color: '#19392f',
          alignItems: 'center',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#124b35' }}></span>
          Settlement
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0f766e' }}></span>
          Health Post
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1d4ed8' }}></span>
          School
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span>
          Water Reservoir
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#b91c1c' }}></span>
          Reported Issue / Hazard
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '16px', height: '3px', background: '#248157' }}></span>
          Operational Road
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '16px', height: '4px', background: '#b45309' }}></span>
          Suspension Bridge
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '16px', height: '4px', background: '#c94b46', borderTop: '2px dashed #c94b46' }}></span>
          Simulated Failure
        </span>
      </div>
    </div>
  );
}
