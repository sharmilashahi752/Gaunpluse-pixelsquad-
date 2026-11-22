import React, { useState } from 'react';
import {
  FileText,
  Map,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

const METHODOLOGY_SECTIONS = [
  {
    id: 'demo-dataset',
    title: 'Demonstration Dataset',
    summary: 'Synthetic village network modeling calibrated for rural Nepalese civic tech decision support.',
    icon: FileText,
    details: [
      'All settlements (Tallo Basti, Upallo Basti), public facilities (Shree Janakalyan Basic School, Sundar Gaun Primary Health Post), and bridge structural assets modeled in GaunPulse are synthetic demonstration fixtures.',
      'Demographic figures (1,040 total residents, 215 households) reflect typical mid-hill rural Nepalese village council (Gaunpalika) densities for algorithm evaluation and UI validation.',
      'Citizen incident reports and technical inspection notes represent realistic infrastructure failure typologies created specifically to demonstrate data-driven municipal prioritization.',
    ],
    metadata: 'Scope: 2 settlements • 16 topological assets • 4 active hazard observations.',
  },
  {
    id: 'network-simulation',
    title: 'Network Simulation Method',
    summary: 'Deterministic Dijkstra shortest-path calculations modeling pedestrian and vehicle travel times.',
    icon: Cpu,
    details: [
      'All baseline and disrupted route calculations run client-side using a zero-dependency implementation of Dijkstra’s algorithm (src/utils/graphSimulation.js). The network is modeled as an undirected, weighted graph where edge weights represent travel time in minutes.',
      'Traversal speeds are deterministically calibrated based on rural Nepalese terrain conditions:',
      '• Unpaved gravel roads: 15 km/h (vehicular ambulance, pickup, tractor).',
      '• Pedestrian walking trails: 3.2 km/h (unpaved dirt paths, gentle slopes).',
      '• Suspended footbridges and stretcher transit: 2.5 km/h (hand-carried medical stretcher).',
      '• Steep hillside footpaths: 2.0 km/h with elevation penalties up to 22% grade.',
    ],
    metadata: 'Engine: Deterministic Dijkstra Graph Traversal • Zero black-box AI approximations.',
  },
  {
    id: 'geographic-data',
    title: 'Geographic Data Provenance',
    summary: 'OpenStreetMap base cartography paired with GaunPulse open spatial hazard registry.',
    icon: Map,
    details: [
      'Cartographic tiles and geographic reference contours are rendered using OpenStreetMap under the Open Database License (ODbL).',
      'Distinction of layers: OpenStreetMap provides the underlying geographic road basemap and terrain tiles. OpenStreetMap does NOT host or maintain the damage reports, bridge failure states, or Dijkstra network graphs.',
      'All topological routing edges, elevation vertices, and facility points of interest are maintained within the GaunPulse open demonstration registry.',
    ],
    metadata: 'Basemap: © OpenStreetMap contributors (ODbL) • Overlay: GaunPulse Demonstration Registry.',
  },
  {
    id: 'verification-protocol',
    title: 'Verification Protocol',
    summary: 'Structured 6-stage lifecycle from initial citizen submission to municipal repair notice.',
    icon: CheckCircle2,
    details: [
      'Every community observation follows a strict 6-stage audit lifecycle designed to prevent unverified rumor escalation while ensuring technical oversight:',
      '1. Community Intake: Citizen report submitted with geotagged photo, category, and observed hazard.',
      '2. Field Verification: Technical liaison or ward sub-engineer visits site to inspect physical severity.',
      '3. Criticality Scoring: Hazard matrix evaluates impact on pedestrian vs vehicular corridors.',
      '4. Ward Prioritization: Model evaluates marginal accessibility recovery under budget constraints.',
      '5. Budget & Action: Municipal council allocates maintenance contract or volunteer mobilization.',
      '6. Notice & Resolution: Public advisory published with status log and restored corridor clearance.',
    ],
    metadata: 'Current Status: 75% field-verified rate across Sundar Gaun demonstration reports.',
  },
  {
    id: 'research-limitations',
    title: 'Research Limitations',
    summary: 'Academic decision-support prototype; does not replace official NDRRMA disaster directives.',
    icon: ShieldAlert,
    details: [
      'GaunPulse is an independent academic and civic technology demonstration prototype developed for hackathon evaluation.',
      'It does not provide certified civil engineering structural clearance, nor does it supersede official emergency directives from Nepal’s National Disaster Risk Reduction and Management Authority (NDRRMA) or municipal authorities.',
      'In active monsoon landslide or river flood emergencies, communities must always adhere to official government warnings and ward emergency evacuation directives.',
    ],
    metadata: 'Boundary: Civic decision-support tool • Not a certified structural safety certificate.',
  },
];

/**
 * Data Sources & Methodology Section
 * Clean expandable accordions with short, understandable headings,
 * simplified summary previews, and full details upon expansion.
 */
export function MethodologyAccordions() {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleSection = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(METHODOLOGY_SECTIONS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <section aria-labelledby="methodology-accordions-heading" className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-2.5 gap-2">
        <div>
          <h2
            id="methodology-accordions-heading"
            className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight"
          >
            Data Sources & Methodology
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Transparent disclosure of algorithmic parameters, network traversal calibrations, and research boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#173D32]">
          <button
            type="button"
            onClick={expandAll}
            className="hover:text-[#42866A] transition-colors"
          >
            Expand All
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-[#42866A] transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {METHODOLOGY_SECTIONS.map((sec) => {
          const isExpanded = expandedIds.has(sec.id);
          const Icon = sec.icon;

          return (
            <div
              key={sec.id}
              className="border border-stone-200 rounded-[4px] bg-white transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors focus:outline-none focus:ring-1 focus:ring-[#173D32] rounded-[4px]"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3 pr-4">
                  <div className="w-7 h-7 rounded-[3px] bg-stone-100 flex items-center justify-center text-[#173D32] shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#42866A]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#173D32]">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                      {sec.summary}
                    </p>
                  </div>
                </div>

                <div className="text-stone-400 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#173D32]" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-stone-100 p-5 bg-[#FBFBFA] space-y-3.5 text-xs sm:text-sm text-[#1B2923] leading-relaxed">
                  <div className="space-y-2 max-w-3xl">
                    {sec.details.map((p, idx) => (
                      <p key={idx} className="font-normal">
                        {p}
                      </p>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-stone-200/80 flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="font-semibold text-[#173D32]">Registry Note:</span>
                    <span>{sec.metadata}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default MethodologyAccordions;
