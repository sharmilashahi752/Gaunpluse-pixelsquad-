import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Badge from '../ui/Badge';
import { BRIDGES } from '../../data/demoVillage';

export function SimulationControls({
  selectedBridgeId,
  onSelectBridge,
  isSimulating,
  onSimulate,
  onRestore,
  isDualClosure,
}) {
  return (
    <div className="bg-white/95 backdrop-blur-xs border border-[#42866A]/20 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#42866A]/15">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] block">
            Simulation Controller
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#173D32]">
            Select Infrastructure Disruption Scenario
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isSimulating ? (
            <Badge variant="alert" className="animate-pulse">
              Scenario: Active Failure
            </Badge>
          ) : (
            <Badge variant="neutral">Scenario: Baseline Network</Badge>
          )}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-[#1B2923]/75 mb-4 leading-relaxed">
        Choose a key bridge to simulate structural failure. The graph engine will compute real-time
        network reachability, alternative route detours, and household access impacts.
      </p>

      {/* Bridge Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {BRIDGES.map((bridge) => {
          const isSelected = selectedBridgeId === bridge.id && !isDualClosure;

          return (
            <button
              key={bridge.id}
              type="button"
              onClick={() => onSelectBridge(bridge.id)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
                isSelected
                  ? 'bg-[#173D32] text-white border-[#173D32] shadow-sm'
                  : 'bg-[#F8F7F2] text-[#1B2923] border-[#42866A]/20 hover:bg-[#DDEBE2]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    isSelected
                      ? 'bg-white/20 text-[#E3AD58]'
                      : 'bg-[#DDEBE2] text-[#173D32]'
                  }`}
                >
                  {bridge.bridgeCode}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isSelected ? 'text-[#DDEBE2]' : bridge.isDamaged ? 'text-[#D45F53]' : 'text-[#42866A]'
                  }`}
                >
                  {bridge.subtype}
                </span>
              </div>

              <h3 className="font-bold text-sm leading-snug">{bridge.name}</h3>

              <p
                className={`text-[11px] mt-1.5 line-clamp-2 ${
                  isSelected ? 'text-white/80' : 'text-[#1B2923]/60'
                }`}
              >
                {bridge.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action Buttons: Simulate vs Restore */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onSimulate}
          className={`flex-1 w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-xs focus-visible:ring-2 focus-visible:ring-[#D45F53] focus:outline-hidden ${
            isSimulating
              ? 'bg-[#D45F53] hover:bg-[#B44335] text-white ring-2 ring-[#D45F53]/30'
              : 'bg-[#173D32] hover:bg-[#122F26] text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#E3AD58]" />
          <span>{isSimulating ? 'Recalculate Failure Simulation' : 'Simulate Bridge Failure'}</span>
        </button>

        <button
          type="button"
          onClick={onRestore}
          disabled={!isSimulating && !isDualClosure}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden"
        >
          <RotateCcw className="w-4 h-4 text-[#42866A]" />
          <span>Restore to Baseline</span>
        </button>
      </div>

      {/* Instructions & Help footnote */}
      <div className="mt-4 pt-3 border-t border-[#42866A]/15 flex items-center justify-between text-xs text-[#42866A]">
        <span>Current Target: {selectedBridgeId === 'bridge-b' ? 'BR-02 (Khola River Motor Bridge)' : 'BR-01 (Upper Suspension Bridge)'}</span>
        <span className="font-semibold text-[#173D32]">Deterministic Graph Engine</span>
      </div>
    </div>
  );
}

export default SimulationControls;
