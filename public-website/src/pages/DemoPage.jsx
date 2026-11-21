import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import SimulationMap from '../components/demo/SimulationMap';
import SimulationControls from '../components/demo/SimulationControls';
import ImpactResults from '../components/demo/ImpactResults';
import SimulationExplanation from '../components/demo/SimulationExplanation';
import RepairComparison from '../components/demo/RepairComparison';
import {
  runNetworkSimulation,
  resolveBridgeEdgeId,
} from '../utils/graphSimulation';
import { BRIDGES, NETWORK_METADATA } from '../data/demoVillage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function DemoPage() {
  useDocumentTitle('Infrastructure Impact Simulator');

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize bridge selection and simulation state from query string or defaults
  const edgeParam = searchParams.get('edge') || searchParams.get('asset');
  const resolvedEdgeId = resolveBridgeEdgeId(edgeParam);
  const matchedBridge = resolvedEdgeId ? BRIDGES.find((b) => b.edgeId === resolvedEdgeId) : null;

  const [selectedBridgeId, setSelectedBridgeId] = useState(matchedBridge ? matchedBridge.id : 'bridge-b');
  const [isSimulating, setIsSimulating] = useState(Boolean(matchedBridge));
  const [isDualClosure, setIsDualClosure] = useState(false);

  // Sync if query parameter changes externally
  const activeBridgeId = matchedBridge ? matchedBridge.id : selectedBridgeId;

  // Determine active disabled edge IDs based on simulation state
  const activeDisabledEdgeIds = useMemo(() => {
    if (!isSimulating && !isDualClosure) {
      return [];
    }

    if (isDualClosure) {
      return ['edge-bridge-a', 'edge-bridge-b'];
    }

    const bridge = BRIDGES.find((b) => b.id === activeBridgeId);
    return bridge ? [bridge.edgeId] : ['edge-bridge-b'];
  }, [isSimulating, isDualClosure, activeBridgeId]);

  // Run graph simulation deterministically
  const simulationResult = useMemo(() => {
    return runNetworkSimulation({
      disabledEdgeIds: activeDisabledEdgeIds,
    });
  }, [activeDisabledEdgeIds]);

  const handleSimulate = () => {
    setIsDualClosure(false);
    setIsSimulating(true);
  };

  const handleRestore = () => {
    setIsDualClosure(false);
    setIsSimulating(false);
    setSearchParams({});
  };

  const handleSelectBridge = (bridgeId) => {
    setSelectedBridgeId(bridgeId);
    setIsDualClosure(false);
    if (isSimulating) {
      const targetBridge = BRIDGES.find((b) => b.id === bridgeId);
      if (targetBridge) {
        setSearchParams({ edge: targetBridge.id });
      }
    }
  };

  const handleApplyComparisonScenario = (scenarioEdgeIds) => {
    if (scenarioEdgeIds.length === 1) {
      const bridge = BRIDGES.find((b) => b.edgeId === scenarioEdgeIds[0]);
      if (bridge) {
        setSelectedBridgeId(bridge.id);
        setIsDualClosure(false);
        setIsSimulating(true);
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }
  };

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-8">
        {/* 1. Page Header & Public Civic Education Introduction */}
        <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">
              Interactive Simulation — Fictional Village Data
            </Badge>
            <Badge variant="neutral">
              Graph Topology: {NETWORK_METADATA.villageName} ({NETWORK_METADATA.version})
            </Badge>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
              What Happens When a Bridge Breaks?
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              Explore how damaged infrastructure can change access to schools, healthcare, and essential
              village connections. This simulation executes live Dijkstra graph calculations to compute
              topological delays, alternative detour routes, and isolated settlements.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 flex flex-wrap items-center justify-between gap-3 text-xs text-[#42866A]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#173D32]" />
              <span>
                Real-time shortest-path network calculations • Select bridge scenario below to run model
              </span>
            </div>
            <span className="font-semibold text-[#173D32]">
              Status: {isSimulating ? 'Active Disruption Mode' : 'Baseline Normal'}
            </span>
          </div>
        </div>

        {/* 2. Simulation Controls Toolbar */}
        <SimulationControls
          selectedBridgeId={activeBridgeId}
          onSelectBridge={handleSelectBridge}
          isSimulating={isSimulating}
          onSimulate={handleSimulate}
          onRestore={handleRestore}
          isDualClosure={isDualClosure}
          onToggleDualClosure={() => setIsDualClosure(!isDualClosure)}
        />

        {/* 3. Live Topological Simulation Map */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-[#173D32]">
              Topological Network Simulation Canvas
            </h2>
            <span className="text-xs text-[#42866A] font-medium hidden sm:inline">
              Alternative detour paths automatically computed and illuminated
            </span>
          </div>

          <SimulationMap
            disabledEdgeIds={activeDisabledEdgeIds}
            activeAlternativeEdgeIds={simulationResult.activeAlternativeEdgeIds}
            simulationResult={simulationResult}
          />
        </div>

        {/* 4. Quantitative Before-and-After Impact Results */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-[#173D32]">
            Calculated Accessibility Impact Analysis
          </h2>
          <ImpactResults
            simulationResult={simulationResult}
            selectedBridgeId={activeBridgeId}
          />
        </div>

        {/* 5. Deterministic AI Insight Executive Synthesis */}
        <SimulationExplanation simulationResult={simulationResult} />

        {/* 6. Multi-Hazard Repair Prioritization Analysis */}
        <RepairComparison onApplyScenario={handleApplyComparisonScenario} />
      </div>
    </Container>
  );
}

export default DemoPage;
