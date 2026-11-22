import React from 'react';
import {
  FileText,
  Network,
  Map,
  Cpu,
  UserCheck,
} from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Data Source Transparency Panel detailing origins of map, graph, reports, and algorithms
 */
export function DataSources() {
  const sources = [
    {
      title: '1. Community Reports',
      tag: 'Simulated Intake',
      icon: FileText,
      description:
        'Fictional demonstration records submitted via simulated community liaisons, school administrators, and citizen web intake forms. Used to illustrate how localized hazards are registered.',
      attribution: 'GaunPulse Synthetic Civic Dataset',
    },
    {
      title: '2. Infrastructure Network Topology',
      tag: 'Synthetic Graph',
      icon: Network,
      description:
        'A custom topological network graph containing nodes, polylines, bridge spans, and public facilities representing typical rural mid-hill Nepalese terrain.',
      attribution: 'Hand-authored Sundar Gaun Topological Specification',
    },
    {
      title: '3. Geographic Base Map',
      tag: 'Open Cartography',
      icon: Map,
      description:
        'OpenStreetMap (OSM) tile layers provide standard terrain context, hillshading, and geographic reference. Important: OpenStreetMap provides cartographic base tiles only and does NOT provide damage reports or failure statuses.',
      attribution: '© OpenStreetMap contributors (ODbL)',
    },
    {
      title: '4. Simulation Calculations',
      tag: 'Deterministic Engine',
      icon: Cpu,
      description:
        'A zero-dependency client-side implementation of Dijkstra’s shortest path algorithm. Computes optimal pedestrian and vehicle routes based on illustrative travel-time edge weights.',
      attribution: 'src/utils/graphSimulation.js (Native JS)',
    },
    {
      title: '5. Human-Reviewed Verification',
      tag: 'Governance Pipeline',
      icon: UserCheck,
      description:
        'Illustrates how automated algorithmic insights must be validated by licensed sub-engineers and municipal technical staff before official work orders are approved.',
      attribution: 'Demonstration Decision-Support Workflow',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
          Data Source Transparency & Attribution
        </h3>
        <span className="text-[11px] text-[#1B2923]/60 font-medium">
          Open CivicTech Standards
        </span>
      </div>

      <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#173D32]">
            Where Does the Data Come From?
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed">
            GaunPulse is built on a commitment to clear data provenance. Below is a full accounting of how geographic, topological, and community data interact on this platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src, idx) => {
            const Icon = src.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 hover:border-[#42866A]/35 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#DDEBE2] flex items-center justify-center text-[#173D32]">
                      <Icon className="w-4 h-4 text-[#42866A]" />
                    </div>
                    <Badge variant="neutral" className="text-[10px]">
                      {src.tag}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-[#173D32] mb-1.5">
                    {src.title}
                  </h4>
                  <p className="text-xs text-[#1B2923]/80 leading-relaxed mb-3">
                    {src.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#42866A]/10 text-[11px] font-semibold text-[#42866A]">
                  Source: {src.attribution}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DataSources;
