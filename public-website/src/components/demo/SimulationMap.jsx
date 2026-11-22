import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  EDGES,
  BRIDGES,
  FACILITIES,
  SETTLEMENTS,
  NETWORK_METADATA,
} from '../../data/demoVillage';

// Fix missing Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// MapResizer controller to ensure container dimensions are always synchronized
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

// Auto-Bounds controller with safety check
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.invalidateSize();
      try {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
      } catch (err) {
        console.warn('MapBoundsController error:', err);
      }
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
  `<div class="w-8 h-8 rounded-full bg-[#173D32] border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  'settlement-pin',
  [32, 32]
);

const schoolIcon = createCustomIcon(
  `<div class="w-8 h-8 rounded-full bg-[#7C3AED] border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  </div>`,
  'school-pin',
  [32, 32]
);

const healthIcon = createCustomIcon(
  `<div class="w-8 h-8 rounded-full bg-[#DC2626] border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 6v12M6 12h12"/>
    </svg>
  </div>`,
  'health-pin',
  [32, 32]
);

const openBridgeIcon = createCustomIcon(
  `<div class="w-8 h-8 rounded-full bg-[#2563EB] border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 18V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9"/>
      <path d="M4 14h16"/>
      <path d="M8 14v4"/>
      <path d="M16 14v4"/>
    </svg>
  </div>`,
  'bridge-open-pin',
  [32, 32]
);

const closedBridgeIcon = createCustomIcon(
  `<div class="relative flex items-center justify-center w-10 h-10 hover:scale-110 transition-transform cursor-pointer">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-60"></span>
    <div class="relative w-8 h-8 rounded-full bg-[#DC2626] border-2 border-white shadow-lg flex items-center justify-center text-white font-extrabold text-xs">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
  </div>`,
  'bridge-closed-pin',
  [40, 40]
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
    <div
      className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] rounded-xl overflow-hidden border border-[#E5E7EB] shadow-xs bg-[#EDE9DE]"
      style={{ width: '100%' }}
    >
      {tileError && (
        <div className="absolute top-3 inset-x-3 z-30 bg-amber-50 text-[#8F5E16] border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-between">
          <span>Map tiles taking longer to load. Topological graph overlays remain fully active.</span>
          <button type="button" onClick={() => setTileError(false)} className="underline ml-2 text-xs">
            Dismiss
          </button>
        </div>
      )}

      <MapContainer
        center={NETWORK_METADATA.center}
        zoom={NETWORK_METADATA.defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
      >
        <MapResizer />
        <MapBoundsController bounds={NETWORK_METADATA.bounds} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
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
            color = '#DC2626';
            weight = 7;
            dashArray = '6, 6';
          } else if (isAlternativeRoute) {
            color = '#D97706';
            weight = 6;
          } else if (edge.type === 'bridge') {
            color = '#2563EB';
            weight = 6;
          } else if (isTrail) {
            color = '#8A7356';
            weight = 3.5;
          }

          return (
            <React.Fragment key={edge.id}>
              {/* Highlight halo for active alternative detour edges */}
              {isAlternativeRoute && (
                <Polyline
                  positions={edge.coordinates}
                  pathOptions={{
                    color: '#D97706',
                    weight: 12,
                    opacity: 0.3,
                  }}
                />
              )}

              {/* Disabled red outline */}
              {isDisabled && (
                <Polyline
                  positions={edge.coordinates}
                  pathOptions={{
                    color: '#DC2626',
                    weight: 11,
                    opacity: 0.25,
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
                    <p className="text-[10px] text-[#64748B]">
                      {isDisabled
                        ? 'CLOSED IN SIMULATION'
                        : isAlternativeRoute
                        ? 'COMPUTED DETOUR ROUTE'
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
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs font-sans text-center">
                  <p className="font-bold text-[#173D32]">{bridge.name}</p>
                  <p
                    className={`text-[10px] font-bold ${
                      isClosed ? 'text-[#DC2626]' : 'text-[#2563EB]'
                    }`}
                  >
                    {isClosed ? 'SIMULATED: CLOSED' : 'SIMULATED: OPERATIONAL'}
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
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{facility.name}</p>
                  <p className="text-[10px] text-[#64748B]">
                    {facility.type === 'school' ? 'Basic School' : 'Primary Health Post'}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 4. Settlement Markers */}
        {SETTLEMENTS.map((settlement) => {
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
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{settlement.name}</p>
                  <p
                    className={`text-[10px] font-bold ${
                      isDisconnected
                        ? 'text-[#DC2626]'
                        : isDelayed
                        ? 'text-[#D97706]'
                        : 'text-[#16A34A]'
                    }`}
                  >
                    {isDisconnected
                      ? 'ISOLATED / DISCONNECTED'
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

      {/* Map Overlay Legend Bar */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-lg px-3 py-2 text-[11px] shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium text-[#173D32]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#173D32] inline-block" />
          <span>Road</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-[#8A7356]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#8A7356] inline-block" />
          <span>Walking Trail</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-[#D97706]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#D97706] inline-block" />
          <span>Computed Detour</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-[#DC2626]">
          <span className="w-3.5 h-1.5 rounded-full bg-[#DC2626] inline-block" />
          <span>Closed Bridge</span>
        </div>
      </div>
    </div>
  );
}

export default SimulationMap;
