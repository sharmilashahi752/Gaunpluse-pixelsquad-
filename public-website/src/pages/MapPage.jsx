import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import InfrastructureMap from '../components/map/InfrastructureMap';
import MapFilters from '../components/map/MapFilters';
import InfrastructureDetails from '../components/map/InfrastructureDetails';
import MapLegend from '../components/map/MapLegend';
import DataTransparencyNote from '../components/map/DataTransparencyNote';
import {
  BRIDGES,
  FACILITIES,
  EDGES,
  SETTLEMENTS,
  ISSUES,
  NETWORK_METADATA,
} from '../data/demoVillage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function MapPage() {
  useDocumentTitle('Interactive Village Map — Sundar Gaun');

  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all');

  // Derive feature from URL parameters if present
  const assetParam =
    searchParams.get('asset') ||
    searchParams.get('edge') ||
    searchParams.get('issue');

  const urlFeature = useMemo(() => {
    if (!assetParam) return null;

    // 1. Check BRIDGES
    const matchedBridge = BRIDGES.find(
      (b) => b.id === assetParam || b.edgeId === assetParam
    );
    if (matchedBridge) return matchedBridge;

    // 2. Check EDGES
    const matchedEdge = EDGES.find((e) => e.id === assetParam);
    if (matchedEdge) return matchedEdge;

    // 3. Check FACILITIES
    const matchedFacility = FACILITIES.find((f) => f.id === assetParam);
    if (matchedFacility) return matchedFacility;

    // 4. Check SETTLEMENTS
    const matchedSettlement = SETTLEMENTS.find((s) => s.id === assetParam);
    if (matchedSettlement) return matchedSettlement;

    // 5. Check ISSUES (and resolve to its target asset)
    const matchedIssue = ISSUES.find((i) => i.id === assetParam);
    if (matchedIssue) {
      const bridge = BRIDGES.find(
        (b) => b.id === matchedIssue.infrastructureId || b.edgeId === matchedIssue.edgeId
      );
      if (bridge) return bridge;
      const edge = EDGES.find((e) => e.id === matchedIssue.edgeId);
      if (edge) return edge;
      const facility = FACILITIES.find((f) => f.id === matchedIssue.targetId);
      if (facility) return facility;
    }
    return null;
  }, [assetParam]);

  // Track user interactive selection alongside URL selection
  const [userSelectedFeature, setUserSelectedFeature] = useState(null);
  const [prevAssetParam, setPrevAssetParam] = useState(assetParam);

  if (prevAssetParam !== assetParam) {
    setPrevAssetParam(assetParam);
    setUserSelectedFeature(null);
  }

  const selectedFeature = userSelectedFeature !== null ? userSelectedFeature : urlFeature;

  const handleReset = () => {
    setActiveFilter('all');
    setUserSelectedFeature(null);
  };

  const handleSelectPreset = (presetId) => {
    if (presetId === 'bridge-b') {
      const bridge = BRIDGES.find((b) => b.id === 'bridge-b');
      setUserSelectedFeature(bridge);
    } else if (presetId === 'facility-health') {
      const facility = FACILITIES.find((f) => f.id === 'facility-health');
      setUserSelectedFeature(facility);
    } else if (presetId === 'facility-school') {
      const facility = FACILITIES.find((f) => f.id === 'facility-school');
      setUserSelectedFeature(facility);
    }
  };

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-6">
        {/* 1. Public Educational Map Introduction */}
        <div className="bg-white/80 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">
              Interactive Demonstration — Fictional Village Data
            </Badge>
            <Badge variant="neutral">
              Topology: {NETWORK_METADATA.villageName} ({NETWORK_METADATA.villageNameNepali})
            </Badge>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
              Explore the Village, Understand the Impact.
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              Discover how roads, bridges, settlements, schools, and healthcare facilities connect—and
              explore how infrastructure issues can affect these essential links.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 flex flex-wrap items-center justify-between gap-3 text-xs text-[#42866A]">
            <div className="flex items-center gap-1.5 font-medium">
              <Compass className="w-4 h-4 text-[#173D32]" />
              <span>
                Click any road or marker to inspect details • Filter visible layers using the toolbar below
              </span>
            </div>
            <span className="font-semibold text-[#173D32]">
              Base Map: OpenStreetMap
            </span>
          </div>
        </div>

        {/* 2. Interactive Map Filters Toolbar */}
        <MapFilters
          activeFilter={activeFilter}
          onFilterChange={(filter) => setActiveFilter(filter)}
          onReset={handleReset}
          selectedFeature={selectedFeature}
        />

        {/* 3. Main Map & Contextual Details Section (2 Columns on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Primary Column: Interactive Leaflet Map + Symbology Legend */}
          <div className="lg:col-span-8 space-y-3">
            <InfrastructureMap
              activeFilter={activeFilter}
              selectedFeature={selectedFeature}
              onSelectFeature={(feature) => setSelectedFeature(feature)}
            />
            <MapLegend />
          </div>

          {/* Right Column: Infrastructure Details Inspector */}
          <div className="lg:col-span-4 sticky top-24">
            <InfrastructureDetails
              selectedFeature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onSelectPreset={handleSelectPreset}
            />
          </div>
        </div>

        {/* 4. Civic Data Transparency & Attribution Panel */}
        <DataTransparencyNote />
      </div>
    </Container>
  );
}

export default MapPage;
