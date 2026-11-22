import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

/**
 * Homepage Showcase Preview: Graph-based Infrastructure Failure Simulator
 */
export function SimulatorPreviewSection() {
  return (
    <section aria-labelledby="simulator-preview-heading" className="py-16 sm:py-24 bg-white border-t border-[#42866A]/20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Interactive Simulation Card (7 cols) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Card className="p-6 sm:p-8 bg-gradient-to-br from-white via-white to-[#F8F7F2] border-[#42866A]/25 shadow-md space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#42866A]/15">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#D45F53]/15 flex items-center justify-center text-[#D45F53]">
                    <Activity className="w-4 h-4 text-[#D45F53]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#173D32]">
                      Deterministic Graph Simulator Engine
                    </h3>
                    <p className="text-[11px] text-[#42866A]">
                      Powered by native Dijkstra shortest-path calculations
                    </p>
                  </div>
                </div>
                <Badge variant="alert">Scenario: Bridge BR-02 Scour</Badge>
              </div>

              {/* Impact Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Baseline Card */}
                <div className="p-4 rounded-xl bg-white border border-[#42866A]/25 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#173D32]">Baseline Condition</span>
                    <Badge variant="neutral" className="text-[10px]">Normal Access</Badge>
                  </div>
                  <div className="text-2xl font-black text-[#173D32]">
                    18 <span className="text-xs font-normal text-[#1B2923]/70">minutes</span>
                  </div>
                  <p className="text-[11px] text-[#1B2923]/70 leading-relaxed">
                    Direct motor transit from Tallo Basti across Bridge BR-02 to the Primary Health Post.
                  </p>
                </div>

                {/* Disrupted Card */}
                <div className="p-4 rounded-xl bg-[#D45F53]/5 border border-[#D45F53]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D45F53]">Bridge BR-02 Cutoff</span>
                    <Badge variant="alert" className="text-[10px]">+183% Delay</Badge>
                  </div>
                  <div className="text-2xl font-black text-[#D45F53]">
                    51 <span className="text-xs font-normal text-[#D45F53]/70">minutes</span>
                  </div>
                  <p className="text-[11px] text-[#1B2923]/70 leading-relaxed">
                    Forces 95 households to hike the grueling West Ridge mountain contour trail.
                  </p>
                </div>
              </div>

              {/* Affected Metrics Summary */}
              <div className="p-4 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-[#1B2923]/60">Delay Incurred</p>
                  <p className="text-base font-extrabold text-[#D45F53]">+33 mins</p>
                </div>
                <div>
                  <p className="text-xs text-[#1B2923]/60">Households Cut Off</p>
                  <p className="text-base font-extrabold text-[#173D32]">95 Homes</p>
                </div>
                <div>
                  <p className="text-xs text-[#1B2923]/60">Ambulance Transit</p>
                  <p className="text-base font-extrabold text-[#D45F53]">Blocked</p>
                </div>
              </div>

              {/* Real calculation disclaimer */}
              <p className="text-[11px] text-[#1B2923]/60 italic leading-relaxed">
                * All values are computed dynamically from modeled network topology and edge weights. No predefined output numbers.
              </p>
            </Card>
          </div>

          {/* Right Column: Storytelling & Trigger (5 cols) */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="alert">Live Decision Support</Badge>
              <Badge variant="neutral">Graph Algorithms</Badge>
            </div>

            <h2
              id="simulator-preview-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight leading-tight"
            >
              Experience the Impact Simulator.
            </h2>

            <p className="text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              What happens if a monsoon surge undermines a pier? Which households lose ambulance access? Which alternative routes remain open?
            </p>

            <p className="text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed">
              Instead of relying on guesswork, GaunPulse runs deterministic shortest-path algorithms to reveal isolation bottlenecks and prioritize repair budgets where they protect the most vulnerable families.
            </p>

            <div className="pt-2">
              <Link
                to="/map"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#173D32]"
              >
                <Activity className="w-4 h-4 text-[#E3AD58]" />
                <span>Explore Village Map</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default SimulatorPreviewSection;
