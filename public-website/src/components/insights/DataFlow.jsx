import React from 'react';
import {
  FileText,
  UserCheck,
  MapPin,
  Activity,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';

/**
 * Visual Data Processing Flow Diagram
 * Steps:
 * 1. Community Report
 * 2. Field Verification
 * 3. Infrastructure Mapping
 * 4. Network Simulation
 * 5. Explainable Insights
 * 6. Human-Reviewed Action
 */
export function DataFlow() {
  const steps = [
    {
      num: 1,
      title: 'Community Report',
      desc: 'Citizen observations or liaison alerts registered with photos, coordinates, and hazard notes.',
      icon: FileText,
    },
    {
      num: 2,
      title: 'Field Verification',
      desc: 'Local ward technical staff perform physical inspection to validate condition and severity.',
      icon: UserCheck,
    },
    {
      num: 3,
      title: 'Infrastructure Mapping',
      desc: 'Verified reports are linked to corresponding network nodes, edges, or bridge asset IDs.',
      icon: MapPin,
    },
    {
      num: 4,
      title: 'Network Simulation',
      desc: 'Dijkstra graph calculations identify cutoff routes, detour travel times, and affected households.',
      icon: Activity,
    },
    {
      num: 5,
      title: 'Explainable Insights',
      desc: 'Deterministic rules generate clear community advisories and delay metrics without black-box AI.',
      icon: Sparkles,
    },
    {
      num: 6,
      title: 'Human-Reviewed Action',
      desc: 'Ward and municipal leaders review priority rankings to allocate seasonal budgets and work orders.',
      icon: ClipboardCheck,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
          Civic Intelligence Architecture
        </h3>
        <span className="text-[11px] text-[#1B2923]/60 font-medium">
          From Community Observation to Municipal Prioritization
        </span>
      </div>

      <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#173D32]">
            Data Processing & Decision Flow
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed">
            How raw community reports move through verification, topological modeling, and human-in-the-loop decision-support.
          </p>
        </div>

        {/* Desktop / Tablet Grid with Arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 rounded-xl bg-[#F8F7F2] border border-[#42866A]/20 hover:border-[#42866A]/40 transition-colors flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-lg bg-[#173D32] text-white text-xs font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#DDEBE2] flex items-center justify-center text-[#173D32]">
                      <Icon className="w-4 h-4 text-[#42866A]" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[#173D32] mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-[#1B2923]/80 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Subtext marker */}
                <div className="mt-3 pt-2 border-t border-[#42866A]/10 text-[10px] font-semibold text-[#42866A] flex items-center justify-between">
                  <span>Pipeline Stage {step.num}</span>
                  {idx < steps.length - 1 && (
                    <span className="hidden lg:inline text-xs text-[#42866A]">→ Next</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DataFlow;
