import React, { useState } from 'react';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { compareRepairPriorities } from '../../utils/graphSimulation';

export function RepairComparison({ onApplyScenario }) {
  const [selectedOption, setSelectedOption] = useState('option2'); // default to BR-02

  const comparisonData = compareRepairPriorities();
  const { option1, option2 } = comparisonData;

  const currentOption = selectedOption === 'option1' ? option1 : option2;

  return (
    <Card className="bg-white/95 border-[#42866A]/20 rounded-2xl p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#42866A]/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#173D32] flex items-center justify-center text-[#E3AD58]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#173D32]">
              Multi-Hazard Repair Prioritization Analysis
            </h3>
            <p className="text-xs text-[#42866A]">
              Comparative scenario: Both bridges closed after extreme monsoon surge
            </p>
          </div>
        </div>
        <Badge variant="amber">Scenario Planning Model</Badge>
      </div>

      <p className="text-xs sm:text-sm text-[#1B2923]/75 mb-5 leading-relaxed">
        If severe floods damage both crossings (BR-01 and BR-02), municipal resources may only allow
        restoring one bridge immediately. Compare how prioritizing each structure restores community connectivity:
      </p>

      {/* Option Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Option 1: Restore BR-01 First */}
        <div
          onClick={() => setSelectedOption('option1')}
          className={`cursor-pointer p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
            selectedOption === 'option1'
              ? 'bg-[#DDEBE2]/40 border-[#173D32] shadow-sm ring-1 ring-[#173D32]/20'
              : 'bg-[#F8F7F2] border-[#42866A]/20 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold bg-[#173D32] text-white px-2 py-0.5 rounded">
              OPTION A
            </span>
            <Badge variant="neutral">Pedestrian Focus</Badge>
          </div>

          <h4 className="font-bold text-base text-[#173D32]">
            Restore BR-01 (Upper Suspension Bridge) First
          </h4>

          <p className="mt-1 text-xs text-[#1B2923]/70 leading-relaxed">
            Immediately reconnects Upallo Basti (120 households) to school in 16 min. Tallo Basti
            reaches services via the arduous 28-min West Ridge Trail.
          </p>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Direct Beneficiary
              </span>
              <span className="font-bold text-[#173D32]">120 Families (Upallo)</span>
            </div>
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Disconnected Left
              </span>
              <span className="font-bold text-[#42866A]">0 Settlements</span>
            </div>
          </div>
        </div>

        {/* Option 2: Restore BR-02 First */}
        <div
          onClick={() => setSelectedOption('option2')}
          className={`cursor-pointer p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
            selectedOption === 'option2'
              ? 'bg-[#DDEBE2]/40 border-[#173D32] shadow-sm ring-1 ring-[#173D32]/20'
              : 'bg-[#F8F7F2] border-[#42866A]/20 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold bg-[#173D32] text-white px-2 py-0.5 rounded">
              OPTION B
            </span>
            <Badge variant="amber">Vehicular / Medical</Badge>
          </div>

          <h4 className="font-bold text-base text-[#173D32]">
            Restore BR-02 (Khola River Motor Bridge) First
          </h4>

          <p className="mt-1 text-xs text-[#1B2923]/70 leading-relaxed">
            Immediately restores primary motor road, freight, and emergency ambulance access for
            Tallo Basti (95 households). Upallo Basti connects via West Ridge Trail.
          </p>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Direct Beneficiary
              </span>
              <span className="font-bold text-[#173D32]">95 Families + Motor Access</span>
            </div>
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Disconnected Left
              </span>
              <span className="font-bold text-[#42866A]">0 Settlements</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Evaluation Narrative */}
      <div className="p-4 rounded-xl bg-[#F8F7F2] border border-[#42866A]/20 text-xs text-[#1B2923]/80 space-y-2">
        <h5 className="font-bold text-[#173D32] text-xs uppercase tracking-wide">
          Algorithmic Trade-off Analysis
        </h5>
        <p className="leading-relaxed">
          {selectedOption === 'option1' ? (
            <>
              <strong>Prioritizing BR-01:</strong> Restores direct baseline walking transit to a higher
              number of residents (<strong>120 households</strong> in Upallo Basti vs 95 in Tallo Basti)
              and guarantees school access for children within 16 minutes. However, motor vehicles and
              ambulances cannot cross the suspension deck.
            </>
          ) : (
            <>
              <strong>Prioritizing BR-02:</strong> Restores heavy vehicular transport, market distribution,
              and ambulance connectivity to the Health Post for Tallo Basti. Upallo Basti retains access
              to the school and clinic via the West Ridge Mountain Trail (+31 min detour).
            </>
          )}
        </p>
        <p className="text-[10px] text-[#42866A] italic">
          * Policy Note: The model assesses network reachability. Final municipal scheduling must consider
          engineering safety, repair costs, and flood risk, not connectivity metrics alone.
        </p>
      </div>

      {/* Button to load scenario into main simulation view */}
      {onApplyScenario && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onApplyScenario([currentOption.edgeId === 'edge-bridge-a' ? 'edge-bridge-b' : 'edge-bridge-a'])}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173D32] hover:text-[#42866A] underline"
          >
            <span>Load {currentOption.bridgeCode} Single-Failure Scenario on Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </Card>
  );
}

export default RepairComparison;
