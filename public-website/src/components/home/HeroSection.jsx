import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react';
import Container from '../ui/Container';
import VillagePreview from './VillagePreview';

export function HeroSection() {
  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    const target = document.getElementById('how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus();
    }
  };

  return (
    <section
      aria-label="GaunPulse Hero Introduction"
      className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20 overflow-hidden"
    >
      {/* Subtle organic background decoration */}
      <div
        className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-[#DDEBE2]/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-10 -z-10 w-72 h-72 bg-[#E3AD58]/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & Typography */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDEBE2] border border-[#42866A]/20 text-xs sm:text-sm font-semibold text-[#173D32] shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#42866A]" />
              <span>Smart Infrastructure. Stronger Communities.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-[#173D32] leading-[1.14]">
              Every Village Has a Voice.{' '}
              <span className="block text-[#42866A] mt-1 sm:mt-1.5">
                Every Problem Deserves a Solution.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-[#1B2923]/80 leading-relaxed max-w-xl font-normal">
              GaunPulse helps Nepal's communities and local governments understand infrastructure problems,
              explore their impact, and make better-informed decisions through interactive maps, simulations,
              and AI-assisted insights.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-[#173D32] hover:bg-[#122F26] text-white shadow-sm hover:shadow-md transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#173D32] focus-visible:ring-offset-2 focus:outline-hidden group"
              >
                <span>Explore Interactive Demo</span>
                <ArrowRight className="w-4 h-4 text-[#E3AD58] transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#how-it-works"
                onClick={handleScrollToHowItWorks}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-base font-semibold border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2]/60 hover:border-[#42866A]/50 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#42866A] focus-visible:ring-offset-2 focus:outline-hidden"
              >
                <span>Discover GaunPulse</span>
                <ChevronDown className="w-4 h-4 text-[#42866A]" />
              </a>
            </div>

            {/* Small Brand & Trust Label */}
            <div className="pt-2 flex items-center gap-3 text-xs sm:text-sm text-[#42866A] font-medium border-t border-[#42866A]/15">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#173D32]" />
                <span className="font-semibold text-[#173D32]">
                  GaunPulse — The Village That Speaks
                </span>
              </div>
              <span className="text-[#42866A]/50 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-xs text-[#1B2923]/70">
                CivicTech Prototype for Nepal
              </span>
            </div>
          </div>

          {/* Right Column: Visual Preview of Infrastructure Mapping Concept */}
          <div className="lg:col-span-6 w-full">
            <VillagePreview />
          </div>
        </div>
      </Container>
    </section>
  );
}

export default HeroSection;
