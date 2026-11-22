import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Container from '../components/ui/Container';
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
  useDocumentTitle('Infrastructure Decision Support — GaunPulse');

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
    const targetBridge = BRIDGES.find((b) => b.id === activeBridgeId);
    if (targetBridge) {
      setSearchParams({ edge: targetBridge.id });
    }
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
        setSearchParams({ edge: bridge.id });
      }
    } else if (scenarioEdgeIds.length === 2) {
      setIsDualClosure(true);
      setIsSimulating(true);
    }
  };

  return (
    <div className="bg-white text-[#1B2923]">
      <Container className="py-8 sm:py-12 max-w-6xl">
        <div className="space-y-8">
          {/* 1. Compact Page Heading */}
          <div className="text-left border-b border-[#E5E7EB] pb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A]">
                Infrastructure Decision Support
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-[11px] font-medium text-[#64748B]">
                {NETWORK_METADATA.villageName} Topology (Simulated)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
              See How Infrastructure Failures Affect Communities
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#1B2923]/70 max-w-3xl leading-relaxed">
              Simulate structural failures on rural bridges to evaluate real-time changes to school and healthcare accessibility.
              GaunPulse executes Dijkstra shortest-path calculations to determine travel delays, route detours, and isolated settlements.
            </p>
          </div>

          {/* 2. Simple Simulation Controller */}
          <SimulationControls
            selectedBridgeId={activeBridgeId}
            onSelectBridge={handleSelectBridge}
            isSimulating={isSimulating}
            onSimulate={handleSimulate}
            onRestore={handleRestore}
            isDualClosure={isDualClosure}
            onToggleDualClosure={() => setIsDualClosure(!isDualClosure)}
          />

          {/* 3. Large Interactive Leaflet Map */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-[#173D32]">
                Infrastructure Network & Computed Detour Routes
              </h2>
              <span className="text-xs text-[#64748B] hidden sm:inline">
                {isSimulating ? 'Detour routing actively illuminated' : 'Baseline network state'}
              </span>
            </div>

            <SimulationMap
              disabledEdgeIds={activeDisabledEdgeIds}
              activeAlternativeEdgeIds={simulationResult.activeAlternativeEdgeIds}
              simulationResult={simulationResult}
            />
          </div>

          {/* 4 & 5. Concise Results & Travel Impact Table */}
          <ImpactResults simulationResult={simulationResult} />

          {/* 6. Short Decision-Support Summary */}
          <SimulationExplanation simulationResult={simulationResult} />

          {/* 7. Simplified BR-01 vs BR-02 Repair-Priority Comparison */}
          <RepairComparison onApplyScenario={handleApplyComparisonScenario} />
        </div>
      </Container>
    </div>
  );
}

export default DemoPage;
