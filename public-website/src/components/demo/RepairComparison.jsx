import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { compareRepairPriorities } from '../../utils/graphSimulation';

export function RepairComparison({ onApplyScenario }) {
  const [selectedOption, setSelectedOption] = useState('option2'); // default to BR-02

  const comparisonData = compareRepairPriorities();
  const { option1, option2 } = comparisonData;

  const handleApply = (optionKey) => {
    setSelectedOption(optionKey);
    if (onApplyScenario) {
      if (optionKey === 'option1') {
        // Option 1 restores BR-01, so BR-02 remains closed
        onApplyScenario([option1.edgeId]);
      } else {
        // Option 2 restores BR-02, so BR-01 remains closed
        onApplyScenario([option2.edgeId]);
      }
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-xs text-left">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] flex items-center justify-center text-[#173D32] shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#173D32]" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#173D32]">
              Repair-Priority Comparison (Multi-Hazard Scenario)
            </h3>
            <p className="text-xs text-[#64748B]">
              Comparative trade-off if monsoon flooding damages both crossings simultaneously
            </p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-[#475569] bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Dual-Closure Model
        </span>
      </div>

      <p className="text-xs sm:text-sm text-[#1B2923]/70 mb-5 leading-relaxed">
        If severe flooding compromises both crossings (BR-01 and BR-02), municipal resources may allow restoring only one bridge immediately. Compare how prioritizing each structure restores community connectivity:
      </p>

      {/* 2. Simplified Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Option 1: Restore BR-01 First */}
        <div
          onClick={() => handleApply('option1')}
          className={`cursor-pointer p-4 sm:p-5 rounded-xl border transition-all duration-150 ${
            selectedOption === 'option1'
              ? 'bg-[#E8F0EC]/50 border-[#173D32] ring-1 ring-[#173D32]'
              : 'bg-white border-[#E5E7EB] hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold bg-[#173D32] text-white px-2 py-0.5 rounded">
              OPTION A
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              Pedestrian Focus
            </span>
          </div>

          <h4 className="font-bold text-sm sm:text-base text-[#173D32]">
            Restore BR-01 (Upper Suspension Bridge) First
          </h4>

          <p className="mt-1.5 text-xs text-[#1B2923]/70 leading-relaxed">
            Immediately reconnects Upallo Basti (120 households) to school in 16 min. Tallo Basti accesses services via the 28-min West Ridge Trail detour.
          </p>

          <div className="mt-4 pt-3 border-t border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                Primary Beneficiaries
              </span>
              <span className="font-bold text-[#173D32]">120 Families</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                Vehicular Access
              </span>
              <span className="font-bold text-[#DC2626]">No Motor Access</span>
            </div>
          </div>
        </div>

        {/* Option 2: Restore BR-02 First */}
        <div
          onClick={() => handleApply('option2')}
          className={`cursor-pointer p-4 sm:p-5 rounded-xl border transition-all duration-150 ${
            selectedOption === 'option2'
              ? 'bg-[#E8F0EC]/50 border-[#173D32] ring-1 ring-[#173D32]'
              : 'bg-white border-[#E5E7EB] hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold bg-[#173D32] text-white px-2 py-0.5 rounded">
              OPTION B
            </span>
            <span className="text-xs font-semibold text-[#D97706]">
              Vehicular / Medical
            </span>
          </div>

          <h4 className="font-bold text-sm sm:text-base text-[#173D32]">
            Restore BR-02 (Khola River Motor Bridge) First
          </h4>

          <p className="mt-1.5 text-xs text-[#1B2923]/70 leading-relaxed">
            Immediately restores primary motor road, freight, and emergency ambulance access for Tallo Basti (95 households). Upallo Basti connects via West Ridge Trail.
          </p>

          <div className="mt-4 pt-3 border-t border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                Primary Beneficiaries
              </span>
              <span className="font-bold text-[#173D32]">95 Families + Vehicles</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                Vehicular Access
              </span>
              <span className="font-bold text-[#16A34A]">Ambulance Restored</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Trade-off Takeaway */}
      <div className="p-4 rounded-lg bg-stone-50 border border-[#E5E7EB] text-xs text-[#1B2923]/80 space-y-1.5">
        <h5 className="font-bold text-[#173D32] text-xs uppercase tracking-wide">
          Algorithmic Trade-off Analysis
        </h5>
        <p className="leading-relaxed">
          {selectedOption === 'option1' ? (
            <>
              <strong>Prioritizing BR-01 (Footbridge):</strong> Restores baseline walking transit to a higher absolute number of village residents (<strong>120 households</strong> in Upallo Basti vs 95 in Tallo Basti) and guarantees direct school access in 16 minutes. However, motor vehicles and ambulances cannot cross the suspension span.
            </>
          ) : (
            <>
              <strong>Prioritizing BR-02 (Motor Bridge):</strong> Restores heavy vehicular transport, market distribution, and ambulance transit to the Health Post for Tallo Basti in 18 minutes. Upallo Basti retains pedestrian access to services via the West Ridge Mountain Trail (+31 min detour).
            </>
          )}
        </p>
        <p className="text-[10px] text-[#64748B] pt-1">
          * Policy Note: Graph models evaluate topological network reachability. Final municipal scheduling must also incorporate geotechnical safety, river current risk, and available engineering equipment.
        </p>
      </div>
    </div>
  );
}

export default RepairComparison;
