import React from 'react';
import {
  FileText,
  Network,
  Map,
  Cpu,
  ShieldAlert,
  GitBranch,
  ExternalLink,
} from 'lucide-react';

/**
 * Data Sources & Methodology Component
 * Comprehensive disclosure of dataset origins, speed calibrations, algorithmic assumptions, and ethical boundaries.
 */
export function DataSourcesAndMethodology() {
  const sections = [
    {
      icon: FileText,
      title: '1. Fictional Demonstration Dataset',
      tag: 'Synthetic Modeling',
      desc: 'All coordinates, settlement demographics, facility names, and damage assessments for Sundar Gaun (Wards 3 & 4) represent synthetic prototype fixtures created for CivicTech decision-support evaluation.',
      detail: 'Model scale: 2 settlements, 1,040 residents, 4 active hazard reports.',
    },
    {
      icon: Network,
      title: '2. Topological Graph Calibration',
      tag: 'Mathematical Model',
      desc: 'Edge traversal speeds are deterministically calibrated based on rural Nepalese terrain norms: 15 km/h for unpaved gravel roads, 3.2 km/h for pedestrian footpaths, and 2.5 km/h for stretcher/footbridge crossing.',
      detail: 'Node-edge topology: 2 bridges, 9 corridor segments, 2 public facilities.',
    },
    {
      icon: Cpu,
      title: '3. Dijkstra Shortest-Path Engine',
      tag: 'Deterministic Routing',
      desc: 'All baseline and disrupted route calculations run client-side using a zero-dependency implementation of Dijkstra’s algorithm (src/utils/graphSimulation.js). This guarantees reproducible, transparent calculations without black-box estimations.',
      detail: 'Output: Deterministic minute transit comparisons and household impact tallies.',
    },
    {
      icon: Map,
      title: '4. OpenStreetMap Cartographic Role',
      tag: 'Base Cartography',
      desc: 'Cartographic tiles and geographic reference contours are provided by OpenStreetMap under the Open Database License (ODbL). OpenStreetMap supplies map visualization only and does not contain damage reports.',
      detail: 'Attribution: © OpenStreetMap contributors (ODbL).',
    },
    {
      icon: ShieldAlert,
      title: '5. Limitations & Ethical Boundaries',
      tag: 'Civic Governance',
      desc: 'GaunPulse is an independent software prototype. It does not provide certified civil engineering structural clearance, nor does it replace real-time government disaster directives from Nepal’s NDRRMA or municipal authorities.',
      detail: 'Boundary: Research decision-support tool, not live emergency dispatch.',
    },
    {
      icon: GitBranch,
      title: '6. Project Attribution & Open Code',
      tag: 'PixelSquad CivicTech',
      desc: 'Developed by PixelSquad (Sharmila Shahi, Sandesh Sharma, Sarkar4000) for the Nepalese CivicTech Hackathon to explore how open spatial intelligence empowers rural infrastructure prioritization.',
      detail: 'Repository: https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-',
      isRepo: true,
    },
  ];

  return (
    <section aria-labelledby="methodology-heading" className="space-y-4 text-left">
      <div className="border-b border-stone-200 pb-3">
        <h2
          id="methodology-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#173D32]"
        >
          Data Sources & Methodology
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Detailed documentation of mathematical assumptions, network speed parameters, and open data provenance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="border border-stone-200 rounded-[4px] bg-white p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#42866A]">
                    {item.tag}
                  </span>
                  <Icon className="w-4 h-4 text-[#173D32]" />
                </div>

                <h3 className="text-sm font-bold text-[#173D32] leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-[#1B2923]/75 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 text-[11px] text-[#64748B]">
                {item.isRepo ? (
                  <a
                    href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#173D32] hover:text-[#42866A] font-semibold underline"
                  >
                    <span>View GitHub Source Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="italic">{item.detail}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Government Distinction Banner */}
      <div className="p-4 rounded-[4px] bg-stone-50 border border-stone-200 text-xs text-[#1B2923]/80 space-y-1">
        <p className="font-semibold text-[#173D32]">
          Independence from Official Government Bulletins:
        </p>
        <p className="text-[#64748B] leading-relaxed">
          GaunPulse is an educational hackathon demonstration platform created by PixelSquad. It does not represent, duplicate, or issue official regulatory announcements on behalf of the National Disaster Risk Reduction and Management Authority (NDRRMA), the Department of Local Infrastructure (DoLI), or the Government of Nepal.
        </p>
      </div>
    </section>
  );
}

export default DataSourcesAndMethodology;
