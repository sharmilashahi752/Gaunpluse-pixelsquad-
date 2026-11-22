import React, { useState } from 'react';
import {
  ChevronDown,
  Database,
  GitBranch,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScrollReveal from '../ui/ScrollReveal';

const ACCORDION_ITEMS = [
  {
    id: 'method-spatial',
    title: 'Spatial Network Graph Modeling',
    icon: GitBranch,
    summary: 'Dijkstra shortest path algorithm across topology nodes and elevation-weighted edges.',
    details: [
      'The Sundar Gaun topology is modeled as a connected planar graph G = (V, E), where vertices represent settlements, trail junctions, suspension bridges, and public facilities.',
      'Edges are weighted by empirical walking transit times under baseline dry conditions, factoring in gradient slope and terrain difficulty.',
      'When an asset failure is simulated (e.g., bridge structural failure), the network algorithm recalculates alternative routes, dynamically measuring detour time penalties and isolation risk.',
    ],
    note: 'Deterministic Dijkstra implementation with zero floating-point drift.',
  },
  {
    id: 'method-validation',
    title: 'Citizen Reporting & Field Verification Pipeline',
    icon: Database,
    summary: '6-stage lifecycle ensuring community ground reports receive technical validation.',
    details: [
      'Community members submit observations with GPS-stamped photo evidence through the GaunPulse mobile and web registry.',
      'Municipal ward sub-engineers review submissions against structural safety checklists, transitioning status from Submitted to Technical Review, Procurement, and Completed Work.',
      'Only field-verified reports with confirmed inspection logs are elevated to high-priority alert status across public dashboards.',
    ],
    note: 'Full audit history tracked per issue with timestamped status progressions.',
  },
  {
    id: 'method-cartography',
    title: 'Open Data & Base Cartography',
    icon: Layers,
    summary: 'OpenStreetMap cartographic layers combined with localized administrative boundary overlays.',
    details: [
      'Base map tiles are rendered via OpenStreetMap and CartoDB Positron standards with sub-kilometer local precision.',
      'Geographical coordinates are calibrated to the Bagmati / Gandaki mountain corridors, respecting river valley boundaries and ward division lines.',
      'All asset geometries (bridges, foot trails, and public structures) are exportable as standard GeoJSON objects for municipal GIS planning.',
    ],
    note: 'Compliant with Nepal Open Data standards and OGC web feature specifications.',
  },
];

/**
 * Data Sources and Methodology Two-Column Component
 * - Left column: Clean heading, brief explanation, and prominent demonstration data disclaimer
 * - Right column: 3 interactive accordion items with smooth animated expansion
 */
export function MethodologyTwoColumn() {
  const [openIds, setOpenIds] = useState(new Set(['method-spatial']));

  const toggleItem = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section aria-labelledby="methodology-heading" className="text-left">
      <ScrollReveal className="rounded-[8px] border border-stone-200 bg-[#F7F9F7] p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Title & Narrative */}
          <div className="lg:col-span-5 space-y-4">
            <h2
              id="methodology-heading"
              className="scroll-mt-24 text-2xl sm:text-3xl font-bold text-[#173D32] tracking-tight"
            >
              Data Sources &amp; Methodology
            </h2>

            <p className="text-sm text-[#1B2923]/80 leading-relaxed font-normal">
              GaunPulse is an open civic technology platform developed to empower rural Nepalese
              municipalities with objective infrastructure intelligence. We combine OpenStreetMap base
              cartography with deterministic Dijkstra path calculations and on-the-ground citizen hazard verification.
            </p>

            <div className="rounded-[4px] bg-white border border-stone-200/80 p-4 space-y-1.5 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5 font-semibold text-[#173D32]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#42866A]" />
                <span>Demonstration Prototype Notice</span>
              </div>
              <p className="leading-relaxed font-normal">
                All demographic figures (1,040 residents, 215 households), facility locations, and
                incident reports represent synthetic demonstration prototype fixtures for Sundar Gaun
                to showcase algorithmic graph modeling without exposing private citizen records.
              </p>
            </div>
          </div>

          {/* Right Column: 3 Collapsible Accordion Items */}
          <div className="lg:col-span-7 space-y-3">
            {ACCORDION_ITEMS.map((item) => {
              const isOpen = openIds.has(item.id);
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className="rounded-[6px] border border-stone-200 bg-white overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors focus:outline-none focus:ring-1 focus:ring-[#173D32] cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <div className="w-8 h-8 rounded-[4px] bg-stone-100 flex items-center justify-center text-[#173D32] shrink-0">
                        <Icon className="w-4 h-4 text-[#42866A]" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#173D32]">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1 font-normal">
                          {item.summary}
                        </p>
                      </div>
                    </div>

                    <div className="text-stone-400 shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 text-[#173D32] transition-transform duration-250 ease-out ${
                          isOpen ? 'rotate-180 text-[#173D32]' : 'text-stone-400'
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-stone-100 bg-[#FBFBFA]"
                      >
                        <div className="p-5 space-y-3.5 text-xs sm:text-sm text-[#1B2923] leading-relaxed">
                          <div className="space-y-2">
                            {item.details.map((p, idx) => (
                              <p key={idx} className="font-normal text-[#1B2923]/85">
                                {p}
                              </p>
                            ))}
                          </div>

                          <div className="pt-2.5 border-t border-stone-200/80 flex items-center gap-2 text-xs text-[#64748B]">
                            <span className="font-semibold text-[#173D32]">Metadata:</span>
                            <span>{item.note}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

export default MethodologyTwoColumn;
