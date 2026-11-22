import React from 'react';
import { FileText, Shield } from 'lucide-react';
import { generateSimulationExplanation } from '../../utils/graphSimulation';

export function SimulationExplanation({ simulationResult }) {
  const explanation = generateSimulationExplanation(simulationResult);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-xs text-left">
      {/* 1. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] flex items-center justify-center text-[#173D32] shrink-0">
            <FileText className="w-4 h-4 text-[#173D32]" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#173D32]">
              Decision-Support Summary
            </h3>
            <p className="text-xs text-[#64748B]">
              Deterministic shortest-path impact assessment and recommended civic action
            </p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-[#475569] bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Rule-Based Network Model
        </span>
      </div>

      {/* 2. Main Narrative & Title */}
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-sm sm:text-base text-[#173D32]">
            {explanation.title}
          </h4>
          <p className="mt-1.5 text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            {explanation.summary}
          </p>
        </div>

        {/* 3. Settlement Impact Breakdown */}
        {explanation.settlementBreakdown && explanation.settlementBreakdown.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {explanation.settlementBreakdown.map((item, i) => {
              const isDisconnected = item.status.includes('Disconnected');
              const isDelayed = item.status.includes('Delayed');

              return (
                <div
                  key={i}
                  className="p-3.5 rounded-lg bg-stone-50/80 border border-[#E5E7EB]"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-[#173D32]">{item.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isDisconnected
                          ? 'bg-red-50 text-[#DC2626] border-red-200'
                          : isDelayed
                          ? 'bg-amber-50 text-[#D97706] border-amber-200'
                          : 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Recommended Municipal Action */}
        <div className="p-4 rounded-lg bg-[#E8F0EC]/60 border border-[#42866A]/25 text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#173D32] block mb-1">
            Recommended Municipal Action
          </span>
          <p className="text-[#173D32] leading-relaxed font-medium">
            {explanation.recommendation}
          </p>
        </div>

        {/* 5. Transparency Notice */}
        <div className="pt-2 text-[11px] text-[#64748B] flex items-center gap-1.5 border-t border-[#E5E7EB]">
          <Shield className="w-3.5 h-3.5 text-[#42866A] shrink-0" />
          <span>
            Calculated deterministically from graph shortest-path algorithms. Demonstration topology for Sundar Gaun (not live AI output).
          </span>
        </div>
      </div>
    </div>
  );
}

export default SimulationExplanation;
