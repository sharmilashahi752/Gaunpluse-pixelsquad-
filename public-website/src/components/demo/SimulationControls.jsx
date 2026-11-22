import React from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck, Layers } from 'lucide-react';
import { BRIDGES } from '../../data/demoVillage';

export function SimulationControls({
  selectedBridgeId,
  onSelectBridge,
  isSimulating,
  onSimulate,
  onRestore,
  isDualClosure,
  onToggleDualClosure,
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-xs text-left">
      {/* 1. Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] block">
            Simulation Controller
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#173D32]">
            Select Infrastructure Failure Scenario
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isSimulating ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#DC2626] border border-red-200">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              {isDualClosure ? 'Both Bridges Closed' : selectedBridgeId === 'bridge-b' ? 'BR-02 Closed' : 'BR-01 Closed'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              Baseline Network Active
            </span>
          )}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-[#1B2923]/70 mb-4 leading-relaxed">
        Choose a bridge below to simulate structural failure. GaunPulse executes Dijkstra shortest-path calculations to determine travel delays, route detours, and isolated settlements.
      </p>

      {/* 2. Two Bridge Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {BRIDGES.map((bridge) => {
          const isSelected = selectedBridgeId === bridge.id && !isDualClosure;

          return (
            <button
              key={bridge.id}
              type="button"
              onClick={() => onSelectBridge(bridge.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden cursor-pointer ${
                isSelected
                  ? 'bg-[#173D32] text-white border-[#173D32] shadow-sm'
                  : 'bg-white text-[#1B2923] border-[#E5E7EB] hover:border-[#173D32]/40 hover:bg-stone-50/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    isSelected
                      ? 'bg-white/20 text-[#E3AD58]'
                      : 'bg-[#E8F0EC] text-[#173D32]'
                  }`}
                >
                  {bridge.bridgeCode}
                </span>
                <span
                  className={`text-[11px] font-medium capitalize ${
                    isSelected ? 'text-[#DDEBE2]' : 'text-[#64748B]'
                  }`}
                >
                  {bridge.subtype || 'Crossing'}
                </span>
              </div>

              <h3 className="font-bold text-sm leading-snug">{bridge.name}</h3>

              <p
                className={`text-xs mt-1.5 line-clamp-2 ${
                  isSelected ? 'text-white/80' : 'text-[#64748B]'
                }`}
              >
                {bridge.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. Action Buttons: Run Simulation & Reset */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onSimulate}
          className={`w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
            isSimulating
              ? 'bg-[#173D32] hover:bg-[#122F26] text-white'
              : 'bg-[#173D32] hover:bg-[#122F26] text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#E3AD58]" />
          <span>{isSimulating ? 'Recalculate Simulation' : 'Run Simulation'}</span>
        </button>

        <button
          type="button"
          onClick={onRestore}
          disabled={!isSimulating && !isDualClosure}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold border border-[#E5E7EB] bg-white text-[#173D32] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden"
        >
          <RotateCcw className="w-4 h-4 text-[#64748B]" />
          <span>Reset</span>
        </button>

        {onToggleDualClosure && (
          <button
            type="button"
            onClick={onToggleDualClosure}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDualClosure
                ? 'bg-red-50 text-[#DC2626] border-red-300'
                : 'bg-stone-50 text-[#64748B] border-[#E5E7EB] hover:text-[#173D32]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isDualClosure ? 'Dual Failure Active' : 'Test Both Bridges Closed'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default SimulationControls;
