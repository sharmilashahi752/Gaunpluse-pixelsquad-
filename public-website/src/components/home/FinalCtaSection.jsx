import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';

/**
 * Final Call-to-Action Section on Homepage
 */
export function FinalCtaSection() {
  return (
    <section aria-labelledby="final-cta-heading" className="py-20 sm:py-28 bg-[#123D30] text-white relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute inset-0 bg-radial from-[#236A50]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute right-[-60px] top-[-60px] opacity-5 pointer-events-none">
        <Activity className="w-96 h-96 text-white" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2">
            <Badge variant="amber" className="bg-[#E3AD58]/20 text-[#E3AD58] border-[#E3AD58]/40">
              CivicTech Showcase Prototype
            </Badge>
          </div>

          <h2
            id="final-cta-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight"
          >
            Experience Rural Infrastructure Intelligence in Action.
          </h2>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed font-normal max-w-2xl mx-auto">
            Test the live bridge-failure simulation, navigate the spatial village map, or explore verified community reports from our fictional demonstration village.
          </p>

          {/* Action Button Row */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/issues"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#E3AD58] hover:bg-[#D19942] text-[#123D30] text-sm font-bold shadow-md hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#123D30]" />
              <span>Explore Community Issues</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#E7F3ED] border border-white text-[#123D30] text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-white shadow-xs"
            >
              <Compass className="w-4 h-4 text-[#E3AD58]" />
              <span>Explore Village Map</span>
            </Link>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-white/80 hover:text-white text-sm font-medium hover:underline transition-colors"
            >
              <span>Learn About PixelSquad</span>
            </Link>
          </div>

          {/* Fictional Data Disclosure */}
          <div className="pt-6 border-t border-white/10 text-xs text-white/60 flex items-center justify-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#E3AD58]" />
            <span>
              Demonstration Prototype: Fictional Sundar Gaun topology designed for hackathon evaluation.
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default FinalCtaSection;
