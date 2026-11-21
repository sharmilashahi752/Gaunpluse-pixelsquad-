import React from 'react';
import { Sparkles, Shield } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { generateSimulationExplanation } from '../../utils/graphSimulation';

export function SimulationExplanation({ simulationResult }) {
  const explanation = generateSimulationExplanation(simulationResult);

  return (
    <Card className="bg-gradient-to-br from-white via-[#F8F7F2] to-[#DDEBE2]/30 border-[#42866A]/25 rounded-2xl p-5 sm:p-7 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#42866A]/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#173D32] flex items-center justify-center text-[#E3AD58] shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#173D32]">
              GaunPulse AI Insight
            </h3>
            <p className="text-xs text-[#42866A]">
              Automated Decision-Support Executive Briefing
            </p>
          </div>
        </div>

        <Badge variant="amber" className="text-[10px]">
          Deterministic Rule Engine
        </Badge>
      </div>

      {/* Main Synthesized Narrative */}
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-sm sm:text-base text-[#173D32]">
            {explanation.title}
          </h4>
          <p className="mt-2 text-xs sm:text-sm text-[#1B2923]/85 leading-relaxed">
            {explanation.summary}
          </p>
        </div>

        {/* Settlement Impact Breakdown Chips */}
        {explanation.settlementBreakdown && explanation.settlementBreakdown.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {explanation.settlementBreakdown.map((item, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white border border-[#42866A]/20 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-[#173D32]">{item.name}</span>
                  <Badge
                    variant={
                      item.status.includes('Disconnected')
                        ? 'alert'
                        : item.status.includes('Delayed')
                        ? 'amber'
                        : 'neutral'
                    }
                    className="text-[10px]"
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#1B2923]/70 leading-snug">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Civic Recommendation */}
        <div className="p-3.5 rounded-xl bg-[#173D32] text-white border border-[#42866A]/30 text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#E3AD58] block mb-1">
            Recommended Municipal Action
          </span>
          <p className="text-[#DDEBE2] leading-relaxed">
            {explanation.recommendation}
          </p>
        </div>

        {/* Mandatory Transparency Disclaimer */}
        <div className="pt-2 text-[10px] text-[#1B2923]/60 flex items-center gap-1.5 border-t border-[#42866A]/15">
          <Shield className="w-3.5 h-3.5 text-[#42866A] shrink-0" />
          <span>
            Generated from simulation calculations. This is a demonstration explanation, not a live AI response.
          </span>
        </div>
      </div>
    </Card>
  );
}

export default SimulationExplanation;
