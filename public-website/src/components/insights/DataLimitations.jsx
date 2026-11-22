import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Data Limitations and Methodology Disclosure Component
 */
export function DataLimitations() {
  const limitations = [
    {
      title: 'Fictional Village Dataset',
      desc: 'All coordinates, settlement demographics, infrastructure names, and road networks for Sundar Gaun are synthetic demonstration data created for this civic prototype.',
    },
    {
      title: 'Illustrative Travel Times',
      desc: 'Walking times and driving durations are calculated from modeled edge speeds (e.g. 15 km/h mountain driving, 3–4 km/h trail hiking). They do not reflect dynamic weather or individual pedestrian pace.',
    },
    {
      title: 'No Live Government Connection',
      desc: 'GaunPulse is an independent hackathon prototype. It does not integrate with active municipal databases, national highway authority systems, or live ward registries.',
    },
    {
      title: 'No Real-World Infrastructure Assessment',
      desc: 'Statuses like "critical alert" or "foundation scour" are simulated demonstration scenarios. They do not describe physical conditions of any real bridge or road in Nepal.',
    },
    {
      title: 'Not an Engineering Safety Clearance',
      desc: 'Graph calculations and risk scores provide topological decision-support; they cannot replace certified geotechnical investigations, core sampling, or formal civil structural certifications.',
    },
    {
      title: 'Graph Dependency & Model Assumptions',
      desc: 'Shortest path outputs depend directly on graph completeness. Unmapped footpaths, goat tracks, or temporary landslide dams could alter actual real-world travel options.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#D45F53]">
          Methodology & Responsible Use Disclosures
        </h3>
        <span className="text-[11px] text-[#1B2923]/60 font-medium">
          Civic Integrity Guidelines
        </span>
      </div>

      <div className="bg-[#D45F53]/5 border border-[#D45F53]/30 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D45F53]/15 flex items-center justify-center text-[#D45F53] shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-[#D45F53]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="alert">CivicTech Transparency Notice</Badge>
              <span className="text-xs font-semibold text-[#8F5E16]">
                Responsible Demonstration
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#173D32]">
              Data Limitations & Technical Constraints
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
              To prevent misinterpretation and promote transparent public-service innovation, visitors should be aware of the following fundamental boundaries:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {limitations.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white/90 border border-[#D45F53]/20 space-y-1.5 shadow-2xs"
            >
              <h4 className="text-xs font-bold text-[#173D32] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D45F53]" />
                {item.title}
              </h4>
              <p className="text-xs text-[#1B2923]/75 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DataLimitations;
