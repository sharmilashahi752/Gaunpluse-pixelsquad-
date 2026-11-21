import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Layers,
  Info,
  Route,
  AlertTriangle,
  Compass,
  Check,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  Home,
  Droplets,
  Landmark,
} from 'lucide-react';
import InfrastructureMap from '../components/map/InfrastructureMap';
import InfrastructureDetails from '../components/map/InfrastructureDetails';
import {
  BRIDGES,
  FACILITIES,
  EDGES,
  SETTLEMENTS,
  ISSUES,
} from '../data/demoVillage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Build global searchable catalog of all demonstration infrastructure entities
const SEARCHABLE_ITEMS = [
  ...BRIDGES.map((b) => ({
    id: b.id,
    name: b.name,
    nameNepali: b.nameNepali,
    category: 'Bridge',
    type: 'bridge',
    ward: 'Ward 3 / 4',
    coords: b.coordinates,
    item: b,
  })),
  ...FACILITIES.map((f) => ({
    id: f.id,
    name: f.name,
    nameNepali: f.nameNepali,
    category: f.type === 'school' ? 'School' : 'Health Post',
    type: f.type,
    ward: 'Ward 4',
    coords: f.coordinates,
    item: f,
  })),
  ...SETTLEMENTS.map((s) => ({
    id: s.id,
    name: s.name,
    nameNepali: s.nameNepali,
    category: 'Settlement',
    type: 'settlement',
    ward: s.ward,
    coords: s.coordinates,
    item: s,
  })),
  ...EDGES.map((e) => ({
    id: e.id,
    name: e.name,
    nameNepali: e.nameNepali,
    category: e.type === 'bridge' ? 'Bridge' : e.subtype === 'walking_trail' ? 'Trail' : 'Road',
    type: e.type,
    ward: 'Sundar Gaun',
    coords: e.coordinates[0],
    item: e,
  })),
  ...ISSUES.map((i) => ({
    id: i.id,
    name: i.title,
    category: 'Reported Issue',
    type: 'issue',
    ward: i.locationLabel,
    coords: i.coordinates,
    item: i,
  })),
  {
    id: 'ward-office',
    name: 'Ward 4 Civic Administration Office',
    nameNepali: 'वडा नं ४ कार्यालय',
    category: 'Ward Office',
    type: 'ward_office',
    ward: 'Ward 4',
    coords: [27.8852, 85.3468],
    item: {
      id: 'ward-office',
      name: 'Ward 4 Civic Administration Office',
      nameNepali: 'वडा नं ४ कार्यालय',
      type: 'ward_office',
      ward: 'Ward 4',
      coordinates: [27.8852, 85.3468],
      description: 'Civic administrative center and disaster management triage point for Sundar Gaun.',
      status: 'Operational',
    },
  },
  {
    id: 'water-source',
    name: 'Khola River Community Spring & Intake',
    nameNepali: 'खोला मुहान पानी स्रोत',
    category: 'Water Source',
    type: 'water_source',
    ward: 'Ward 3',
    coords: [27.8820, 85.3455],
    item: {
      id: 'water-source',
      name: 'Khola River Community Spring & Intake',
      nameNepali: 'खोला मुहान पानी स्रोत',
      type: 'water_source',
      ward: 'Ward 3',
      coordinates: [27.8820, 85.3455],
      description: 'Gravity-fed potable community water intake point serving Tallo Basti.',
      status: 'Operational',
    },
  },
];

export function MapPage() {
  useDocumentTitle('Interactive Geographic Map — GaunPulse');

  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeBaseMap, setActiveBaseMap] = useState('osm'); // 'osm' | 'opentopo' | 'carto'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Floating toolbar modal / drawer states
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const searchContainerRef = useRef(null);

  // Derive feature from URL parameters if present on load
  const assetParam =
    searchParams.get('asset') ||
    searchParams.get('edge') ||
    searchParams.get('issue');

  const urlFeature = useMemo(() => {
    if (!assetParam) return null;

    const matchedBridge = BRIDGES.find(
      (b) => b.id === assetParam || b.edgeId === assetParam
    );
    if (matchedBridge) return matchedBridge;

    const matchedEdge = EDGES.find((e) => e.id === assetParam);
    if (matchedEdge) return matchedEdge;

    const matchedFacility = FACILITIES.find((f) => f.id === assetParam);
    if (matchedFacility) return matchedFacility;

    const matchedSettlement = SETTLEMENTS.find((s) => s.id === assetParam);
    if (matchedSettlement) return matchedSettlement;

    const matchedIssue = ISSUES.find((i) => i.id === assetParam);
    if (matchedIssue) return matchedIssue;

    return null;
  }, [assetParam]);

  const [flyToTarget, setFlyToTarget] = useState(() => {
    if (!urlFeature) return null;
    const coords = urlFeature.coordinates || (urlFeature.coords && urlFeature.coords[0]);
    if (coords && Array.isArray(coords)) {
      return { coords: Array.isArray(coords[0]) ? coords[0] : coords, zoom: 16 };
    }
    return null;
  });

  const [userSelectedFeature, setUserSelectedFeature] = useState(null);
  const selectedFeature = userSelectedFeature !== null ? userSelectedFeature : urlFeature;

  // Fly to URL feature coordinates if asset parameter changes after mount
  const prevAssetRef = useRef(assetParam);
  useEffect(() => {
    if (prevAssetRef.current !== assetParam) {
      prevAssetRef.current = assetParam;
      if (urlFeature) {
        const coords = urlFeature.coordinates || (urlFeature.coords && urlFeature.coords[0]);
        if (coords && Array.isArray(coords)) {
          const timer = setTimeout(() => {
            setFlyToTarget({ coords: Array.isArray(coords[0]) ? coords[0] : coords, zoom: 16 });
          }, 0);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [assetParam, urlFeature]);

  // Click outside listener for search dropdown and layers popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results
  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCHABLE_ITEMS.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        (item.nameNepali && item.nameNepali.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.ward.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }).slice(0, 6);
  }, [searchQuery]);

  const handleSelectSearchResult = (searchItem) => {
    setUserSelectedFeature(searchItem.item);
    setSearchQuery(searchItem.name);
    setIsSearchOpen(false);
    setInspectorOpen(true);

    const coords = searchItem.coords;
    if (coords) {
      setFlyToTarget({ coords: Array.isArray(coords[0]) ? coords[0] : coords, zoom: 16 });
    }
  };

  const handleSelectFeature = (feature) => {
    setUserSelectedFeature(feature);
    setInspectorOpen(true);
    const coords = feature.coordinates || (feature.coords && feature.coords[0]);
    if (coords && Array.isArray(coords)) {
      setFlyToTarget({ coords: Array.isArray(coords[0]) ? coords[0] : coords, zoom: 16 });
    }
  };

  const handleSelectPreset = (presetId) => {
    let target = null;
    if (presetId === 'bridge-b') target = BRIDGES.find((b) => b.id === 'bridge-b');
    else if (presetId === 'facility-health') target = FACILITIES.find((f) => f.id === 'facility-health');
    else if (presetId === 'facility-school') target = FACILITIES.find((f) => f.id === 'facility-school');
    else if (presetId === 'settlement-tallo') target = SETTLEMENTS.find((s) => s.id === 'settlement-tallo');

    if (target) {
      setUserSelectedFeature(target);
      setInspectorOpen(true);
      const coords = target.coordinates;
      if (coords) setFlyToTarget({ coords, zoom: 16 });
    }
  };

  const handleToolbarRoutes = () => {
    setActiveFilter((prev) => (prev === 'roads' ? 'all' : 'roads'));
  };

  const handleToolbarIssues = () => {
    setActiveFilter((prev) => (prev === 'issues' ? 'all' : 'issues'));
  };

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'roads', label: 'Roads & Trails' },
    { id: 'bridges', label: 'Bridges' },
    { id: 'settlements', label: 'Settlements' },
    { id: 'services', label: 'Services' },
    { id: 'issues', label: 'Reported Issues', badge: ISSUES.length },
  ];

  const legendSymbols = [
    { label: 'Settlement / Village', symbol: Home, color: 'bg-[#173D32]', text: 'Residential Basti' },
    { label: 'Bridge (Operational)', symbol: ShieldCheck, color: 'bg-[#2563EB]', text: 'Stable crossing' },
    { label: 'Bridge (Critical Alert)', symbol: AlertTriangle, color: 'bg-[#DC2626]', text: 'Pier scour / damage' },
    { label: 'Health Post', symbol: HeartPulse, color: 'bg-[#DC2626]', text: 'Clinic / Emergency' },
    { label: 'Basic School', symbol: GraduationCap, color: 'bg-[#7C3AED]', text: 'Educational facility' },
    { label: 'Ward Office', symbol: Landmark, color: 'bg-[#173D32]', text: 'Civic administration' },
    { label: 'Reported Issue', symbol: AlertTriangle, color: 'bg-[#EA580C]', text: 'Field incident logged' },
    { label: 'Water Source', symbol: Droplets, color: 'bg-[#0284C7]', text: 'Community water intake' },
    { label: 'Road / Trail Point', symbol: Route, color: 'bg-[#16A34A]', text: 'Route junction' },
  ];

  return (
    <div
      className="relative w-full h-[calc(100vh-80px)] min-h-[calc(100vh-80px)] overflow-hidden bg-[#EDE9DE]"
      style={{ width: '100%', height: 'calc(100vh - 80px)', minHeight: 'calc(100vh - 80px)' }}
    >
      {/* 1. Full-Screen Interactive Leaflet Map Layer */}
      <InfrastructureMap
        activeFilter={activeFilter}
        selectedFeature={selectedFeature}
        onSelectFeature={handleSelectFeature}
        activeBaseMap={activeBaseMap}
        flyToTarget={flyToTarget}
      />

      {/* 2. Top-Center Floating Search Bar & Filter Controls */}
      <div
        ref={searchContainerRef}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[92%] sm:w-[500px] max-w-xl flex flex-col items-center"
      >
        {/* Search Input Box */}
        <div className="w-full relative shadow-lg rounded-xl">
          <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-[#E5E7EB] transition-shadow focus-within:ring-2 focus-within:ring-[#173D32] focus-within:border-[#173D32]">
            <Search className="w-4 h-4 ml-3.5 text-[#64748B] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search roads, bridges, schools, health posts, or settlements..."
              className="w-full py-2.5 pl-2.5 pr-8 text-xs sm:text-sm bg-transparent text-[#173D32] placeholder-[#64748B]/70 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 p-1 text-[#64748B] hover:text-[#173D32] rounded-md"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/98 backdrop-blur-md border border-[#E5E7EB] rounded-xl shadow-xl max-h-64 overflow-y-auto z-[1001] py-1.5 divide-y divide-[#E5E7EB]/60">
              {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#F7F8FA] flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-[#E8F0EC] flex items-center justify-center text-[#173D32] shrink-0">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#173D32] truncate group-hover:text-[#438A70]">
                          {result.name}
                        </p>
                        <p className="text-[10px] text-[#64748B] truncate">
                          {result.ward} {result.nameNepali ? `• ${result.nameNepali}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#64748B] px-1.5 py-0.5 rounded bg-stone-100 shrink-0 ml-2">
                      {result.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#64748B]">
                  No infrastructure found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Floating Pill Layer Filters directly below search bar */}
        <div className="mt-2 flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none py-1 px-1">
          {filterOptions.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-[#173D32] text-white shadow-md'
                    : 'bg-white/95 text-[#1B2923] hover:bg-stone-50 border border-[#E5E7EB]'
                }`}
              >
                <span>{f.label}</span>
                {f.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-[#D45F53] text-white' : 'bg-red-100 text-[#DC2626]'
                    }`}
                  >
                    {f.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Floating Infrastructure Inspector Panel (Right side on desktop, bottom sheet on mobile) */}
      {inspectorOpen && (
        <div className="absolute top-auto bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4 z-[1000] w-full sm:w-[360px] md:w-[380px] max-h-[65vh] sm:max-h-[calc(100vh-100px)] overflow-y-auto">
          <InfrastructureDetails
            selectedFeature={selectedFeature}
            onClose={() => {
              setUserSelectedFeature(null);
              setInspectorOpen(false);
            }}
            onSelectPreset={handleSelectPreset}
          />
        </div>
      )}

      {/* Re-open inspector pill if closed on desktop */}
      {!inspectorOpen && (
        <button
          type="button"
          onClick={() => setInspectorOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 absolute top-4 right-4 z-[1000] px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E5E7EB] text-xs font-semibold text-[#173D32] shadow-md hover:bg-stone-50 transition-colors"
        >
          <Compass className="w-3.5 h-3.5 text-[#173D32]" />
          <span>Open Inspector</span>
        </button>
      )}

      {/* 5. Floating Bottom Toolbar Centered Near Bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center select-none">
        {/* Floating Layers Popover */}
        {showLayersMenu && (
          <div className="mb-2 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl shadow-xl p-3 w-64 text-left animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold text-[#173D32] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#173D32]" />
                <span>Base Map Style</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLayersMenu(false)}
                className="text-[#64748B] hover:text-[#173D32]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {[
                { id: 'osm', label: 'OpenStreetMap (Standard)', desc: 'Standard road and civic cartography' },
                { id: 'opentopo', label: 'OpenTopoMap (Topographic)', desc: 'Elevation contours & hill shading' },
                { id: 'carto', label: 'CartoDB Light (Minimalist)', desc: 'Clean high-contrast vector focus' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setActiveBaseMap(style.id);
                    setShowLayersMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    activeBaseMap === style.id
                      ? 'bg-[#E8F0EC] text-[#173D32] font-semibold'
                      : 'hover:bg-stone-50 text-[#2D3748]'
                  }`}
                >
                  <div>
                    <p>{style.label}</p>
                    <p className="text-[10px] text-[#64748B]">{style.desc}</p>
                  </div>
                  {activeBaseMap === style.id && <Check className="w-3.5 h-3.5 text-[#173D32]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Legend Modal Popover */}
        {showLegendModal && (
          <div className="mb-2 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl shadow-2xl p-4 w-[90vw] sm:w-[480px] text-left animate-in fade-in duration-150 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold text-[#173D32] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#173D32]" />
                <span>Map Symbology & Route Legend</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="text-[#64748B] hover:text-[#173D32] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Symbols Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
              {legendSymbols.map((item, i) => {
                const Icon = item.symbol;
                return (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB]/60">
                    <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center text-white shrink-0 shadow-2xs`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#173D32] truncate text-[11px]">{item.label}</p>
                      <p className="text-[10px] text-[#64748B] truncate">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Network Line Styles */}
            <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5 text-[11px] text-[#2D3748]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-1 rounded-full bg-[#173D32] inline-block shrink-0" />
                <span>Main Motorable Road (Solid Dark Green)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-1 border-b-2 border-dashed border-[#8A7356] inline-block shrink-0" />
                <span>Footpath & Walking Trail (Dashed Gold / Brown)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-1.5 rounded-full bg-[#2563EB] inline-block shrink-0" />
                <span>River Bridge Crossing (Blue / Red Alert)</span>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar Pill Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-[#E5E7EB] px-2 py-1.5 flex items-center gap-1 sm:gap-2 text-xs font-semibold text-[#173D32]">
          <button
            type="button"
            onClick={() => {
              setShowLayersMenu(!showLayersMenu);
              setShowLegendModal(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              showLayersMenu ? 'bg-[#E8F0EC] text-[#173D32]' : 'hover:bg-stone-100 text-[#173D32]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#173D32]" />
            <span>Layers</span>
          </button>

          <span className="w-px h-4 bg-[#E5E7EB]" />

          <button
            type="button"
            onClick={() => {
              setShowLegendModal(!showLegendModal);
              setShowLayersMenu(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              showLegendModal ? 'bg-[#E8F0EC] text-[#173D32]' : 'hover:bg-stone-100 text-[#173D32]'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-[#173D32]" />
            <span>Legend</span>
          </button>

          <span className="w-px h-4 bg-[#E5E7EB]" />

          <button
            type="button"
            onClick={handleToolbarRoutes}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeFilter === 'roads'
                ? 'bg-[#173D32] text-white'
                : 'hover:bg-stone-100 text-[#173D32]'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Routes</span>
          </button>

          <span className="w-px h-4 bg-[#E5E7EB]" />

          <button
            type="button"
            onClick={handleToolbarIssues}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeFilter === 'issues'
                ? 'bg-[#DC2626] text-white'
                : 'hover:bg-stone-100 text-[#173D32]'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeFilter === 'issues' ? 'text-white' : 'text-[#EA580C]'}`} />
            <span>Issues</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'issues' ? 'bg-white text-[#DC2626]' : 'bg-red-100 text-[#DC2626]'
              }`}
            >
              {ISSUES.length}
            </span>
          </button>
        </div>
      </div>

      {/* 6. Subtle Demonstration Data Watermark */}
      <div className="hidden md:flex items-center gap-1.5 absolute bottom-2 left-3 z-[999] px-2 py-1 rounded-[4px] bg-white/90 backdrop-blur-xs border border-[#E5E7EB] text-[10px] text-[#64748B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#173D32]" />
        <span>Sundar Gaun Demonstration Topology (Simulated Infrastructure)</span>
      </div>
    </div>
  );
}

export default MapPage;
