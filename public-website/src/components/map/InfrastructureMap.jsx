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
  ISSUES,
  NETWORK_METADATA,
} from '../../data/demoVillage';

// Fix missing Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Controller to ensure Leaflet recalculates size and renders tiles immediately and upon resize
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
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

// Fly-to controller reacting to search selections and clicks
function MapFlyController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.coords) {
      map.flyTo(target.coords, target.zoom || 16, { duration: 1.2 });
    }
  }, [map, target]);
  return null;
}

// Initial bounds fitting
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.invalidateSize();
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (err) {
        console.warn('Map fitBounds issue:', err);
      }
    }
  }, [map, bounds]);
  return null;
}

// Custom Marker DivIcon Generator with clean circular SVG badges
function createMarkerIcon(iconSvg, bgClass, label = '', isPulsing = false) {
  return L.divIcon({
    html: `
      <div class="relative flex items-center group cursor-pointer select-none">
        ${
          isPulsing
            ? '<span class="animate-ping absolute -inset-1 rounded-full bg-red-500 opacity-60"></span>'
            : ''
        }
        <div class="w-8 h-8 rounded-full ${bgClass} border-2 border-white shadow-md flex items-center justify-center text-white shrink-0 hover:scale-110 transition-transform">
          ${iconSvg}
        </div>
        ${
          label
            ? `<span class="hidden md:inline-block ml-1.5 px-2 py-0.5 rounded-[4px] bg-white/95 text-[#173D32] border border-[#E5E7EB] text-[11px] font-bold shadow-sm whitespace-nowrap pointer-events-none">${label}</span>`
            : ''
        }
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

// SVGs for the 9 infrastructure categories in the user's table
const HOUSE_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const BRIDGE_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9"/><path d="M4 14h16"/><path d="M8 14v4"/><path d="M16 14v4"/></svg>`;
const HEALTH_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const SCHOOL_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
const WARD_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="22" x2="22" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/><path d="M4 18v-7l8-4 8 4v7"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/></svg>`;
const WARNING_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const ROUTE_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`;
const WATER_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

// Distinct category marker DivIcons
const settlementTalloIcon = createMarkerIcon(HOUSE_SVG, 'bg-[#173D32]', 'Tallo Basti');
const settlementUpalloIcon = createMarkerIcon(HOUSE_SVG, 'bg-[#173D32]', 'Upallo Basti');
const bridgeOperationalIcon = createMarkerIcon(BRIDGE_SVG, 'bg-[#2563EB]', 'BR-01 Footbridge');
const bridgeDamagedIcon = createMarkerIcon(WARNING_SVG, 'bg-[#DC2626]', 'BR-02 Motor Bridge', true);
const healthIcon = createMarkerIcon(HEALTH_SVG, 'bg-[#DC2626]', 'Health Post');
const schoolIcon = createMarkerIcon(SCHOOL_SVG, 'bg-[#7C3AED]', 'Basic School');
const wardOfficeIcon = createMarkerIcon(WARD_SVG, 'bg-[#173D32]', 'Ward 4 Office');
const waterSourceIcon = createMarkerIcon(WATER_SVG, 'bg-[#0284C7]', 'Water Intake');
const issueWarningIcon = createMarkerIcon(WARNING_SVG, 'bg-[#EA580C]');
const junctionIcon = createMarkerIcon(ROUTE_SVG, 'bg-[#16A34A]');

// Civic landmarks matching the user's category table
const CIVIC_LANDMARKS = [
  {
    id: 'ward-office',
    name: 'Ward 4 Civic Administration Office',
    nameNepali: 'वडा नं ४ कार्यालय',
    type: 'ward_office',
    category: 'Ward Office',
    coordinates: [27.8852, 85.3468],
    description: 'Civic administrative center and disaster management triage point for Sundar Gaun.',
    status: 'Operational',
    ward: 'Ward 4',
  },
  {
    id: 'water-source',
    name: 'Khola River Community Spring & Intake',
    nameNepali: 'खोला मुहान पानी स्रोत',
    type: 'water_source',
    category: 'Water Source',
    coordinates: [27.8820, 85.3455],
    description: 'Gravity-fed potable community water intake point serving Tallo Basti.',
    status: 'Operational',
    ward: 'Ward 3',
  },
  {
    id: 'node-junc-south',
    name: 'South Valley Road Junction',
    type: 'junction',
    category: 'Road Junction',
    coordinates: [27.8816, 85.3422],
    description: 'Key roadway fork connecting Tallo Basti center with the bridge approach.',
    status: 'Operational',
    ward: 'Ward 3',
  },
];

export function InfrastructureMap({
  activeFilter = 'all',
  selectedFeature,
  onSelectFeature,
  activeBaseMap = 'osm',
  flyToTarget,
}) {
  const [tileError, setTileError] = useState(false);

  // Filter application predicates
  const showAll = activeFilter === 'all';
  const showIssuesOnly = activeFilter === 'issues';
  const showBridges = showAll || activeFilter === 'bridges' || showIssuesOnly;
  const showServices = showAll || activeFilter === 'services';
  const showSettlements = showAll || activeFilter === 'settlements';

  // Visible items based on active filter
  const visibleEdges = EDGES.filter((edge) => {
    if (showAll) return true;
    if (showIssuesOnly) return edge.isDamaged;
    if (activeFilter === 'roads') return edge.type === 'road';
    if (activeFilter === 'bridges') return edge.type === 'bridge';
    return false;
  });

  const visibleFacilities = showServices ? FACILITIES : [];
  const visibleSettlements = showSettlements ? SETTLEMENTS : [];
  const visibleBridges = showBridges
    ? BRIDGES.filter((b) => (showIssuesOnly ? b.isDamaged : true))
    : [];

  const visibleIssues = showAll || showIssuesOnly ? ISSUES : [];
  const visibleLandmarks = showServices || showAll ? CIVIC_LANDMARKS : [];

  // Tile layer configuration
  const tileConfig = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    opentopo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
    },
    carto: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    },
  }[activeBaseMap] || {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  };

  return (
    <div
      className="absolute inset-0 w-full h-full bg-[#EDE9DE]"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Tile loading error fallback notification */}
      {tileError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-amber-50 text-[#8F5E16] border border-amber-200 px-4 py-2 rounded-xl text-xs font-medium shadow-md flex items-center gap-2">
          <span>Map tiles are taking longer to load. Infrastructure vector overlays remain fully active.</span>
          <button
            type="button"
            onClick={() => setTileError(false)}
            className="underline ml-2 text-xs text-[#173D32] font-semibold"
          >
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
        <MapFlyController target={flyToTarget} />

        {/* Real Geocartography Tile Layer */}
        <TileLayer
          key={activeBaseMap}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
          eventHandlers={{
            tileerror: () => setTileError(true),
          }}
        />

        {/* 1. Road, Trail, and Bridge Connectivity Polylines */}
        {visibleEdges.map((edge) => {
          const isSelected = selectedFeature && selectedFeature.id === edge.id;
          const isDamaged = edge.isDamaged;
          const isTrail =
            edge.subtype === 'walking_trail' || edge.subtype === 'seasonal_trail';

          // Base visual styling
          let color = '#173D32'; // Main solid dark green
          let weight = 5;
          let dashArray = undefined;

          if (edge.type === 'bridge') {
            color = isDamaged ? '#DC2626' : '#2563EB'; // Blue bridge, Red if damaged
            weight = isDamaged ? 8 : 7;
          } else if (isDamaged) {
            color = '#D45F53'; // Affected route highlight
            weight = 6;
            dashArray = '6, 6';
          } else if (isTrail) {
            color = '#8A7356'; // Dashed brown / gold foot trail
            weight = 3.5;
            dashArray = '5, 6';
          }

          if (isSelected) {
            color = '#E3AD58'; // Gold highlight when selected
            weight = weight + 3;
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
                    opacity: 0.4,
                  }}
                />
              )}

              <Polyline
                positions={edge.coordinates}
                pathOptions={{
                  color: color,
                  weight: weight,
                  opacity: isSelected ? 1.0 : 0.9,
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
                    <p className="text-[10px] text-[#485650]">{edge.surface || edge.type}</p>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* 2. Bridge Landmark Markers (Blue for operational, Red for damaged) */}
        {visibleBridges.map((bridge) => (
          <Marker
            key={bridge.id}
            position={bridge.coordinates}
            icon={bridge.isDamaged ? bridgeDamagedIcon : bridgeOperationalIcon}
            eventHandlers={{
              click: () => onSelectFeature(bridge),
            }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <div className="text-xs font-sans text-center">
                <p className="font-bold text-[#173D32]">{bridge.name}</p>
                <p
                  className={`text-[10px] font-semibold ${
                    bridge.isDamaged ? 'text-[#DC2626]' : 'text-[#2563EB]'
                  }`}
                >
                  {bridge.status}
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* 3. Essential Service Facilities (Health Post & School) */}
        {visibleFacilities.map((facility) => (
          <Marker
            key={facility.id}
            position={facility.coordinates}
            icon={facility.type === 'school' ? schoolIcon : healthIcon}
            eventHandlers={{
              click: () => onSelectFeature(facility),
            }}
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
        ))}

        {/* 4. Settlements / Village Markers */}
        {visibleSettlements.map((settlement) => (
          <Marker
            key={settlement.id}
            position={settlement.coordinates}
            icon={settlement.id === 'settlement-tallo' ? settlementTalloIcon : settlementUpalloIcon}
            eventHandlers={{
              click: () => onSelectFeature(settlement),
            }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <div className="text-xs font-sans">
                <p className="font-bold text-[#173D32]">{settlement.name}</p>
                <p className="text-[10px] text-[#64748B]">
                  {settlement.households} Households • {settlement.ward}
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* 5. Civic Landmarks (Ward Office, Water Source, Junctions) */}
        {visibleLandmarks.map((landmark) => {
          let icon = junctionIcon;
          if (landmark.type === 'ward_office') icon = wardOfficeIcon;
          else if (landmark.type === 'water_source') icon = waterSourceIcon;

          return (
            <Marker
              key={landmark.id}
              position={landmark.coordinates}
              icon={icon}
              eventHandlers={{
                click: () => onSelectFeature(landmark),
              }}
            >
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#173D32]">{landmark.name}</p>
                  <p className="text-[10px] text-[#64748B]">{landmark.category}</p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 6. Reported Issues Overlay Pins */}
        {visibleIssues.map((issue) => (
          <Marker
            key={issue.id}
            position={issue.coordinates}
            icon={issue.severity === 'critical' ? bridgeDamagedIcon : issueWarningIcon}
            eventHandlers={{
              click: () => onSelectFeature(issue),
            }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <div className="text-xs font-sans">
                <p className="font-bold text-[#EA580C]">{issue.title}</p>
                <p className="text-[10px] text-[#64748B]">{issue.locationLabel}</p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default InfrastructureMap;
