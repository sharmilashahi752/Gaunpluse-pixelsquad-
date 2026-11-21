import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  EDGES,
  BRIDGES,
  FACILITIES,
  SETTLEMENTS,
  ISSUES,
  NETWORK_METADATA,
} from '../../data/demoVillage';

// Custom Map Auto-Bounds Controller
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    }
  }, [map, bounds]);
  return null;
}

// Custom Marker DivIcons with GaunPulse Design Tokens & High-Contrast Symbology
const createCustomIcon = (htmlContent, className = '', size = [36, 36]) => {
  return L.divIcon({
    html: htmlContent,
    className: `custom-div-icon ${className}`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
  });
};

const settlementIcon = createCustomIcon(
  `<div class="w-9 h-9 rounded-full bg-[#F8F7F2] border-2 border-[#173D32] shadow-md flex items-center justify-center text-[#173D32] hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  'settlement-pin'
);

const schoolIcon = createCustomIcon(
  `<div class="w-9 h-9 rounded-xl bg-[#173D32] border-2 border-white shadow-md flex items-center justify-center text-[#E3AD58] hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  </div>`,
  'school-pin'
);

const healthIcon = createCustomIcon(
  `<div class="w-9 h-9 rounded-xl bg-[#42866A] border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 6v12M6 12h12"/>
    </svg>
  </div>`,
  'health-pin'
);

const operationalBridgeIcon = createCustomIcon(
  `<div class="w-8 h-8 rounded-full bg-[#173D32] border-2 border-white shadow-md flex items-center justify-center text-[#E3AD58] hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  </div>`,
  'bridge-op-pin'
);

const damagedBridgeIcon = createCustomIcon(
  `<div class="relative flex items-center justify-center w-10 h-10 hover:scale-110 transition-transform">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D45F53] opacity-75"></span>
    <div class="relative w-8 h-8 rounded-full bg-[#D45F53] border-2 border-white shadow-lg flex items-center justify-center text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
  </div>`,
  'damaged-bridge-pin',
  [40, 40]
);

const trailSlumpIcon = createCustomIcon(
  `<div class="w-7 h-7 rounded-lg bg-[#E3AD58] border-2 border-white shadow-md flex items-center justify-center text-[#173D32] hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </div>`,
  'slump-pin',
  [28, 28]
);

export function InfrastructureMap({
  activeFilter,
  selectedFeature,
  onSelectFeature,
}) {
  const [tileError, setTileError] = useState(false);

  // Filter application predicates
  const showAll = activeFilter === 'all';
  const showIssuesOnly = activeFilter === 'issues';
  const showBridges = showAll || activeFilter === 'bridges' || showIssuesOnly;
  const showServices = showAll || activeFilter === 'services';
  const showSettlements = showAll || activeFilter === 'settlements';

  // Filtered lists
  const visibleEdges = EDGES.filter((edge) => {
    if (showAll) return true;
    if (showIssuesOnly) return edge.isDamaged;
    if (activeFilter === 'bridges') return edge.type === 'bridge';
    if (activeFilter === 'roads') return edge.type === 'road';
    return false;
  });

  const visibleFacilities = showServices ? FACILITIES : [];
  const visibleSettlements = showSettlements ? SETTLEMENTS : [];
  const visibleBridges = showBridges
    ? BRIDGES.filter((b) => (showIssuesOnly ? b.isDamaged : true))
    : [];

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] lg:h-[620px] rounded-2xl overflow-hidden border border-[#42866A]/25 shadow-md bg-[#EDE9DE]">
      {/* Offline / Tile Fallback Warning Banner */}
      {tileError && (
        <div className="absolute top-3 inset-x-3 z-30 bg-[#E3AD58]/95 text-[#173D32] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center justify-between">
          <span>
            Basemap tiles are temporarily taking longer to load. Infrastructure vector network
            remains fully interactive.
          </span>
          <button
            type="button"
            onClick={() => setTileError(false)}
            className="underline ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <MapContainer
        center={NETWORK_METADATA.center}
        zoom={NETWORK_METADATA.defaultZoom}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <MapBoundsController bounds={NETWORK_METADATA.bounds} />

        {/* OpenStreetMap Cartography Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
          eventHandlers={{
            tileerror: () => setTileError(true),
          }}
        />

        {/* 1. Road and Trail Network Polylines */}
        {visibleEdges.map((edge) => {
          const isSelected = selectedFeature && selectedFeature.id === edge.id;
          const isDamaged = edge.isDamaged;
          const isTrail = edge.subtype === 'walking_trail' || edge.subtype === 'seasonal_trail';

          // Base style
          let color = '#173D32';
          let weight = 5;
          let dashArray = undefined;

          if (edge.type === 'bridge') {
            color = isDamaged ? '#D45F53' : '#42866A';
            weight = isDamaged ? 8 : 7;
          } else if (isDamaged) {
            color = '#D45F53';
            weight = 6;
            dashArray = '6, 6';
          } else if (isTrail) {
            color = '#8A7356';
            weight = 4;
            dashArray = '5, 6';
          }

          if (isSelected) {
            color = '#E3AD58';
            weight = weight + 4;
          }

          return (
            <React.Fragment key={edge.id}>
              {/* Optional selected outline glow */}
              {isSelected && (
                <Polyline
                  positions={edge.coordinates}
                  pathOptions={{
                    color: '#173D32',
                    weight: weight + 4,
                    opacity: 0.5,
                  }}
                />
              )}

              <Polyline
                positions={edge.coordinates}
                pathOptions={{
                  color: color,
                  weight: weight,
                  opacity: isSelected ? 1.0 : 0.88,
                  dashArray: dashArray,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => onSelectFeature(edge),
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-sans">
                    <p className="font-bold text-[#173D32]">{edge.name}</p>
                    <p className="text-[10px] text-[#42866A]">{edge.condition}</p>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* 2. Bridge Landmark Markers */}
        {visibleBridges.map((bridge) => {
          return (
            <Marker
              key={bridge.id}
              position={bridge.coordinates}
              icon={bridge.isDamaged ? damagedBridgeIcon : operationalBridgeIcon}
              eventHandlers={{
                click: () => onSelectFeature(bridge),
              }}
            >
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs font-sans text-center">
                  <p className="font-bold text-[#173D32]">{bridge.name}</p>
                  <p
                    className={`text-[10px] font-semibold ${
                      bridge.isDamaged ? 'text-[#D45F53]' : 'text-[#42866A]'
                    }`}
                  >
                    {bridge.status}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 3. Essential Service Facility Markers (School & Health Post) */}
        {visibleFacilities.map((facility) => {
          return (
            <Marker
              key={facility.id}
              position={facility.coordinates}
              icon={facility.type === 'school' ? schoolIcon : healthIcon}
              eventHandlers={{
                click: () => onSelectFeature(facility),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{facility.name}</p>
                  <p className="text-[10px] text-[#42866A]">
                    {facility.type === 'school' ? 'Basic School' : 'Primary Health Post'}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 4. Settlement Markers */}
        {visibleSettlements.map((settlement) => {
          return (
            <Marker
              key={settlement.id}
              position={settlement.coordinates}
              icon={settlementIcon}
              eventHandlers={{
                click: () => onSelectFeature(settlement),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{settlement.name}</p>
                  <p className="text-[10px] text-[#42866A]">
                    {settlement.households} Households • {settlement.ward}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 5. Additional Issue Markers (e.g. Trail Slump) */}
        {(showAll || showIssuesOnly) && (
          <Marker
            position={ISSUES[1].coordinates}
            icon={trailSlumpIcon}
            eventHandlers={{
              click: () =>
                onSelectFeature({
                  ...EDGES.find((e) => e.id === ISSUES[1].edgeId),
                  name: ISSUES[1].title,
                  description: ISSUES[1].summary,
                  status: 'warning',
                }),
            }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <div className="text-xs font-sans">
                <p className="font-bold text-[#8F5E16]">{ISSUES[1].title}</p>
                <p className="text-[10px] text-[#1B2923]/70">{ISSUES[1].severity}</p>
              </div>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default InfrastructureMap;
