import React from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * Key Research Findings Component
 * Concise, evidence-based empirical takeaways derived directly from the simulation graph.
 */
export function KeyResearchFindings() {
  const findings = [
    {
      numeral: '01',
      title: 'Single-Bridge Disruption Causes 2.8x Clinic Transit Penalty',
      badge: '+33 min emergency delay',
      detail:
        'Structural closure of Khola River Motor Bridge (BR-02) inflates ambulance and stretcher transit from Tallo Basti to the Primary Health Post from 18 minutes to 51 minutes via Upper Footbridge BR-01. This single-point bottleneck leaves 460 residents across 95 households without direct vehicular medical transit.',
    },
    {
      numeral: '02',
      title: 'Vehicular Bridge Restoration Yields Highest Community Dividend',
      badge: 'Priority 1 Intervention',
      detail:
        'Under a dual-failure simulation of both bridges, restoring Motor Bridge BR-02 first re-establishes ambulance connectivity and eliminates 33 minutes of travel delay for 95 households. Restoring Footbridge BR-01 first only reopens pedestrian walking routes while leaving vehicular logistics 100% blocked.',
    },
    {
      numeral: '03',
      title: 'Trail Culvert Obstruction Triples Daily School Commute',
      badge: '+24 min student walking detour',
      detail:
        'Silt obstruction in the 600mm masonry culvert beneath the Janakalyan trail diverts student pedestrians onto steep 22% hillside slopes. Combined with bridge load restrictions, students from Tallo Basti experience an increase in one-way walking time from 12 minutes to 36 minutes each way.',
    },
    {
      numeral: '04',
      title: 'Early Citizen Intake Enables 75% Field Verification Efficiency',
      badge: '75% Municipal Verification',
      detail:
        'Three out of four demonstration infrastructure hazards submitted by residents, teachers, and health post liaisons have completed technical inspection by sub-engineers. Early reporting captures slope slumps and foundation scour before complete monsoon collapse occurs.',
    },
  ];

  return (
    <section aria-labelledby="findings-heading" className="space-y-4 text-left">
      <div className="border-b border-stone-200 pb-3">
        <h2
          id="findings-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#173D32]"
        >
          Key Research Findings
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Empirical conclusions derived from topological network analysis and deterministic shortest-path failure simulations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {findings.map((item) => (
          <div
            key={item.numeral}
            className="border border-stone-200 rounded-[4px] p-5 sm:p-6 bg-white space-y-3 flex flex-col justify-between hover:border-[#173D32] transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#42866A]">
                  FINDING {item.numeral}
                </span>
                <span className="text-[11px] font-semibold text-[#173D32] bg-stone-100 px-2 py-0.5 rounded-[2px] border border-stone-200">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#173D32] leading-snug">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed font-normal">
                {item.detail}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
              <span className="italic">Derived from Dijkstra Topology Model</span>
              <span className="inline-flex items-center gap-0.5 text-[#173D32] font-medium">
                <span>Verified Scenario</span>
                <ArrowUpRight className="w-3 h-3 text-[#42866A]" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default KeyResearchFindings;
