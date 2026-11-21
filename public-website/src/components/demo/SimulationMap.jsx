import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  EDGES,
  BRIDGES,
  FACILITIES,
  SETTLEMENTS,
  NETWORK_METADATA,
} from '../../data/demoVillage';

// Auto-Bounds controller
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    }
  }, [map, bounds]);
  return null;
}

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

const openBridgeIcon = createCustomIcon(
  `<div class="w-8 h-8 rounded-full bg-[#173D32] border-2 border-white shadow-md flex items-center justify-center text-[#E3AD58] hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  </div>`,
  'bridge-open-pin'
);

const closedBridgeIcon = createCustomIcon(
  `<div class="relative flex items-center justify-center w-11 h-11 hover:scale-110 transition-transform">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D45F53] opacity-75"></span>
    <div class="relative w-9 h-9 rounded-full bg-[#D45F53] border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold text-xs">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
  </div>`,
  'bridge-closed-pin',
  [44, 44]
);

export function SimulationMap({
  disabledEdgeIds = [],
  activeAlternativeEdgeIds = [],
  simulationResult,
}) {
  const [tileError, setTileError] = useState(false);
  const disabledSet = new Set(disabledEdgeIds);
  const altSet = new Set(activeAlternativeEdgeIds);

  return (
    <div className="relative w-full h-[450px] sm:h-[520px] lg:h-[580px] rounded-2xl overflow-hidden border border-[#42866A]/25 shadow-md bg-[#EDE9DE]">
      {tileError && (
        <div className="absolute top-3 inset-x-3 z-30 bg-[#E3AD58]/95 text-[#173D32] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center justify-between">
          <span>Map tiles loading delayed. Topological simulation network remains fully interactive.</span>
          <button type="button" onClick={() => setTileError(false)} className="underline ml-2 text-xs">
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

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
          eventHandlers={{
            tileerror: () => setTileError(true),
          }}
        />

        {/* 1. Network Edge Polylines */}
        {EDGES.map((edge) => {
          const isDisabled = disabledSet.has(edge.id);
          const isAlternativeRoute = altSet.has(edge.id);
          const isTrail = edge.subtype === 'walking_trail' || edge.subtype === 'seasonal_trail';

          let color = '#173D32';
          let weight = 5;
          let dashArray = isTrail ? '5, 6' : undefined;

          if (isDisabled) {
            color = '#D45F53';
            weight = 8;
            dashArray = '6, 6';
          } else if (isAlternativeRoute) {
            color = '#E3AD58';
            weight = 7;
          } else if (edge.type === 'bridge') {
            color = '#42866A';
            weight = 7;
          } else if (isTrail) {
            color = '#8A7356';
            weight = 4;
          }

          return (
            <React.Fragment key={edge.id}>
              {/* Glowing halo for active alternative detour edges */}
              {isAlternativeRoute && (
                <Polyline
                  positions={edge.coordinates}
                  pathOptions={{
                    color: '#E3AD58',
                    weight: 12,
                    opacity: 0.35,
                  }}
                />
              )}

              {/* Disabled red outline */}
              {isDisabled && (
                <Polyline
                  positions={edge.coordinates}
                  pathOptions={{
                    color: '#000000',
                    weight: 12,
                    opacity: 0.4,
                  }}
                />
              )}

              <Polyline
                positions={edge.coordinates}
                pathOptions={{
                  color: color,
                  weight: weight,
                  opacity: isDisabled ? 0.95 : 0.9,
                  dashArray: dashArray,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-sans">
                    <p className="font-bold text-[#173D32]">{edge.name}</p>
                    <p className="text-[10px] text-[#42866A]">
                      {isDisabled
                        ? 'CLOSED IN SIMULATION'
                        : isAlternativeRoute
                        ? 'ACTIVE ALTERNATIVE ROUTE'
                        : `${edge.travelTimeMinutes} min baseline transit`}
                    </p>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* 2. Bridge Markers (Showing Open vs Disabled) */}
        {BRIDGES.map((bridge) => {
          const isClosed = disabledSet.has(bridge.edgeId);

          return (
            <Marker
              key={bridge.id}
              position={bridge.coordinates}
              icon={isClosed ? closedBridgeIcon : openBridgeIcon}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <div className="text-xs font-sans text-center">
                  <p className="font-bold text-[#173D32]">{bridge.name}</p>
                  <p
                    className={`text-[10px] font-bold ${
                      isClosed ? 'text-[#D45F53]' : 'text-[#42866A]'
                    }`}
                  >
                    {isClosed ? 'SIMULATION STATUS: CLOSED' : 'SIMULATION STATUS: OPERATIONAL'}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 3. Essential Service Facility Markers */}
        {FACILITIES.map((facility) => {
          return (
            <Marker
              key={facility.id}
              position={facility.coordinates}
              icon={facility.type === 'school' ? schoolIcon : healthIcon}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{facility.name}</p>
                  <p className="text-[10px] text-[#42866A]">
                    {facility.type === 'school' ? 'Essential School' : 'Primary Health Post'}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 4. Settlement Markers */}
        {SETTLEMENTS.map((settlement) => {
          // Look up if this settlement is disconnected or delayed in the simulation
          const routes = simulationResult?.routeResults?.filter(
            (r) => r.settlementId === settlement.id
          ) || [];
          const isDisconnected = routes.some((r) => r.status === 'Disconnected');
          const isDelayed = routes.some((r) => r.status === 'Delayed');

          return (
            <Marker
              key={settlement.id}
              position={settlement.coordinates}
              icon={settlementIcon}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{settlement.name}</p>
                  <p
                    className={`text-[10px] font-bold ${
                      isDisconnected
                        ? 'text-[#D45F53]'
                        : isDelayed
                        ? 'text-[#E3AD58]'
                        : 'text-[#42866A]'
                    }`}
                  >
                    {isDisconnected
                      ? 'CUT OFF / DISCONNECTED'
                      : isDelayed
                      ? 'DELAYED VIA DETOUR'
                      : 'NORMAL ACCESS'}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Overlay Key Badge */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-[#42866A]/20 rounded-xl px-3 py-2 text-[11px] shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-[#173D32]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#173D32] inline-block" />
          <span>Normal Road</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-[#E3AD58]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#E3AD58] inline-block" />
          <span>Active Detour</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-[#D45F53]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#D45F53] inline-block border-b-2 border-dashed border-white" />
          <span>Closed Bridge</span>
        </div>
      </div>
    </div>
  );
}

export default SimulationMap;
