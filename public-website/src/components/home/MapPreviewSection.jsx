import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Compass,
  ArrowRight,
  Layers,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

/**
 * Homepage Showcase Preview: Interactive Infrastructure Map
 */
export function MapPreviewSection() {
  const mapHighlights = [
    {
      title: 'Khola River Motor Bridge (BR-02)',
      type: 'Concrete Motor Bridge',
      status: 'Critical Alert — Scour',
      statusVariant: 'alert',
      desc: '38m essential span connecting southern settlements to the clinic and central bazaar.',
    },
    {
      title: 'Sundar Gaun Primary Health Post',
      type: 'Healthcare Facility',
      status: 'Essential Facility',
      statusVariant: 'amber',
      desc: '24/7 maternal clinic and emergency first-aid post vulnerable to transit cutoffs.',
    },
    {
      title: 'Shree Janakalyan Basic School',
      type: 'Educational Facility',
      status: 'Active / 160 Students',
      statusVariant: 'neutral',
      desc: 'Central school serving children commuting daily across the valley river.',
    },
  ];

  return (
    <section aria-labelledby="map-preview-heading" className="py-16 sm:py-24 bg-[#F8F7F2] border-t border-[#42866A]/20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Storytelling & Action (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="forest">Spatial Intelligence</Badge>
              <Badge variant="amber">Fictional Village Map</Badge>
            </div>

            <h2
              id="map-preview-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight leading-tight"
            >
              Explore the Village. Understand Every Essential Link.
            </h2>

            <p className="text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              In remote municipalities, paper records and isolated spreadsheets cannot show how a broken bridge isolates a clinic. GaunPulse renders the entire village network on an interactive spatial canvas powered by OpenStreetMap.
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#1B2923]/80">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] shrink-0" />
                <span>Filter layers for bridges, trails, paved roads, and public clinics.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] shrink-0" />
                <span>Inspect condition reports, physical measurements, and photos per asset.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] shrink-0" />
                <span>Understand geographic isolation risks across multiple wards.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                to="/map"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#173D32]"
              >
                <Compass className="w-4 h-4 text-[#E3AD58]" />
                <span>Open Interactive Village Map</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Feature Teaser Card (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 bg-white border-[#42866A]/25 shadow-sm space-y-6">
              {/* Teaser Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#42866A]/15">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DDEBE2] flex items-center justify-center text-[#173D32]">
                    <Layers className="w-4 h-4 text-[#42866A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#173D32]">Sundar Gaun Network Topology</h3>
                    <p className="text-[11px] text-[#42866A]">Ward 3 & 4 Schematic GIS Layer</p>
                  </div>
                </div>
                <Badge variant="neutral">OpenStreetMap Base</Badge>
              </div>

              {/* Sample Interactive Highlights */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] block">
                  Demonstration Assets on Map:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mapHighlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 hover:border-[#42866A]/40 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-semibold text-[#42866A] truncate">
                            {item.type}
                          </span>
                          <Badge variant={item.statusVariant} className="text-[9px] px-1.5 py-0.2">
                            {item.status.split('—')[0]}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-[#173D32] leading-snug mb-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#1B2923]/70 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual preview strip */}
              <div className="p-3 rounded-xl bg-[#DDEBE2]/40 border border-[#42866A]/20 flex items-center justify-between text-xs text-[#173D32]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D45F53]" />
                  <span className="font-medium">
                    2 River Bridges • 6 Road & Trail Corridors • 2 Public Facilities
                  </span>
                </div>
                <Link
                  to="/map"
                  className="font-bold text-[#42866A] hover:text-[#173D32] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Launch Canvas</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default MapPreviewSection;
