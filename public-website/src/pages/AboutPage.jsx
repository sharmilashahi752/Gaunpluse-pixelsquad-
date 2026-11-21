import React from 'react';
import {
  ArrowRight,
} from 'lucide-react';
import Container from '../components/ui/Container';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AboutPage() {
  useDocumentTitle('About GaunPulse — The Village That Speaks');

  // 1. Core Principles (Section Four)
  const corePrinciples = [
    {
      title: 'Community Participation',
      desc: 'Giving residents accessible ways to report local infrastructure concerns.',
    },
    {
      title: 'Accessible Information',
      desc: 'Presenting complex infrastructure information through understandable maps and insights.',
    },
    {
      title: 'Evidence-Informed Planning',
      desc: 'Using transparent simulations to understand connectivity risks.',
    },
    {
      title: 'Local Government Transparency',
      desc: 'Supporting accountability through visible progress and public information.',
    },
    {
      title: 'Human-Reviewed Decisions',
      desc: 'Keeping final public decisions in the hands of responsible people and institutions.',
    },
  ];

  // 2. Implemented Technologies (Section Five)
  const implementedTech = [
    {
      name: 'React 19 & Tailwind CSS',
      desc: 'A responsive, accessible frontend built with custom Nature + Modern design tokens tailored for rural civic technology.',
    },
    {
      name: 'Leaflet & OpenStreetMap',
      desc: 'Interactive geographic maps displaying roads, bridges, hamlets, schools, and health posts with OpenStreetMap cartography.',
    },
    {
      name: 'Client-Side Graph Engine',
      desc: 'Native JavaScript implementation of Dijkstra’s shortest-path algorithm for instantaneous failure scenario calculations.',
    },
    {
      name: 'Recharts Analytics',
      desc: 'Approachable, responsive visualizations illustrating issue categories, verification statuses, and severity breakdowns.',
    },
  ];

  // 3. Proposed Technologies (Section Five)
  const proposedTech = [
    {
      name: 'Laravel & MySQL Backend',
      desc: 'Planned relational database, role-based ward authentication, audit logs, and formal work order management.',
    },
    {
      name: 'Python & NetworkX Service',
      desc: 'Planned geospatial analysis server for multi-ward elevation models, monsoon slope stability, and complex detour calculations.',
    },
    {
      name: 'AI Explanation Service',
      desc: 'Future grounded LLM integration designed to generate plain-language vernacular community summaries from verified field telemetry.',
    },
  ];

  return (
    <div className="bg-white min-h-screen text-[#1B2923]">
      {/* =========================================================================
          SECTION ONE — About GaunPulse (Centered Introductory Layout + Large Photo)
          ========================================================================= */}
      <section className="pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 lg:pb-24 border-b border-[#E5E7EB]/80">
        <Container>
          <div className="max-w-[800px] mx-auto text-center">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#42866A] block mb-2 sm:mb-3">
              ABOUT GAUNPULSE
            </span>

            <h1 className="text-[28px] sm:text-[34px] lg:text-[38px] font-extrabold text-[#173D32] tracking-tight leading-[1.2] mb-4 sm:mb-5">
              Building Smarter, More Connected Communities
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#1B2923]/80 leading-relaxed font-normal">
              GaunPulse is a civic technology initiative exploring how community reporting,
              infrastructure mapping, simulation, and accessible insights can help rural Nepal
              understand infrastructure challenges and make better-informed decisions.
            </p>
          </div>

          {/* Large Landscape Photograph (village8) */}
          <div className="mt-8 sm:mt-12 lg:mt-14 max-w-[1100px] mx-auto">
            <div className="rounded-[12px] overflow-hidden bg-stone-100 shadow-xs border border-stone-200/60 aspect-[16/9] sm:aspect-[21/10] max-h-[500px]">
              <img
                src="/images/about/village8.png"
                alt="Panoramic landscape of a remote mountainous Nepalese village and connecting ridges"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION TWO — Why GaunPulse Exists (Two-Column Story Layout)
          ========================================================================= */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-[#E5E7EB]/80">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center max-w-[1100px] mx-auto">
            {/* Left Column: Narrative (~55% width) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#42866A] block">
                OUR BACKGROUND
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#173D32] tracking-tight leading-[1.2]">
                Why GaunPulse Exists
              </h2>

              <div className="space-y-3.5 text-sm sm:text-[15px] text-[#1B2923]/80 leading-relaxed font-normal">
                <p>
                  In the hilly and mountainous terrains of rural Nepal, a single suspended footbridge
                  or mountain trail is often the sole artery connecting an entire settlement to the
                  outside world. When seasonal monsoon floods scour a bridge footing or trigger a
                  slope failure, life across the valley halts immediately.
                </p>
                <p>
                  These disruptions sever access to basic civic necessities: pregnant mothers and
                  elderly residents are cut off from health posts, children face perilous hours-long
                  detours across mountain contours, and smallholder farmers are unable to bring fresh
                  harvests to market before they spoil.
                </p>
                <p>
                  GaunPulse exists to bridge the communication gap between citizens living with these
                  infrastructure vulnerabilities and ward planners who must decide how to deploy
                  limited maintenance budgets. By modeling village routes as connected networks, the
                  platform provides shared visibility into repair urgency and community impact.
                </p>
              </div>
            </div>

            {/* Right Column: Vertical Photograph (village1) (~45% width) */}
            <div className="lg:col-span-5">
              <div className="w-full h-[380px] sm:h-[440px] lg:h-[480px] rounded-[12px] overflow-hidden bg-stone-100 shadow-xs border border-stone-200/60">
                <img
                  src="/images/about/village1.jpg"
                  alt="Steep mountainous village settlement along a valley ridge in rural Nepal"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION THREE — Our Mission & Vision (Two Stacked Blocks on Left, Photo on Right)
          ========================================================================= */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-[#E5E7EB]/80">
        <Container>
          <div className="max-w-[1100px] mx-auto">
            {/* Centered Heading */}
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#42866A] block mb-2">
                GUIDING PURPOSE
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#173D32] tracking-tight">
                Our Mission & Vision
              </h2>
            </div>

            {/* Two-Column Layout (50% / 50% with ~36px gap, vertically centered) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[36px] items-center">
              {/* Left Column: Stacked Compact Mission & Vision Cards */}
              <div className="flex flex-col gap-4 sm:gap-[18px]">
                {/* Mission Card */}
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] px-7 sm:px-8 py-6 sm:py-[26px] text-left">
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#E3AD58] block mb-1.5">
                    OUR PURPOSE
                  </span>
                  <h3 className="text-xl sm:text-[24px] font-bold text-[#173D32] mb-2.5 leading-snug">
                    Mission
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#1B2923]/80 leading-[1.6] font-normal">
                    Help communities identify infrastructure problems, understand their wider impact,
                    and support transparent, evidence-informed local decisions.
                  </p>
                </div>

                {/* Vision Card */}
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] px-7 sm:px-8 py-6 sm:py-[26px] text-left">
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#E3AD58] block mb-1.5">
                    LOOKING AHEAD
                  </span>
                  <h3 className="text-xl sm:text-[24px] font-bold text-[#173D32] mb-2.5 leading-snug">
                    Vision
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#1B2923]/80 leading-[1.6] font-normal">
                    A future where rural communities can access reliable infrastructure information
                    and participate in decisions that improve connectivity, safety, and everyday life.
                  </p>
                </div>
              </div>

              {/* Right Column: Village Photograph (Compact Height ~420-440px desktop, ~280-320px mobile) */}
              <div>
                <div className="w-full h-[280px] sm:h-[320px] lg:h-[430px] rounded-[12px] overflow-hidden bg-stone-100 border border-[#E5E7EB] shadow-xs">
                  <img
                    src="/images/about/village.jpg"
                    alt="Rural village pathway connecting community houses and terraces"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION FOUR — Our Core Principles (5-Card Key Strengths Layout on #F5F6F8)
          ========================================================================= */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F6F8] border-b border-[#E5E7EB]/80">
        <Container>
          <div className="max-w-[1220px] mx-auto">
            {/* Centered Heading */}
            <h2 className="text-[26px] sm:text-[30px] lg:text-[32px] font-bold text-[#173D32] tracking-tight text-center mb-[50px] sm:mb-[52px]">
              Our Core Principles
            </h2>

            {/* 5-Column Grid on Desktop with Natural Card Heights */}
            <div className="core-principles-grid">
              {corePrinciples.map((principle, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 sm:p-[22px] text-left transition-colors duration-150"
                >
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-[#173D32] leading-[1.3]">
                    {principle.title}
                  </h3>
                  <p className="text-[14px] text-[#64748B] leading-[1.6] mt-3.5 sm:mt-[15px] font-normal">
                    {principle.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION FIVE — Technology Architecture (Directory-Style Information Rows)
          ========================================================================= */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-[#E5E7EB]/80">
        <Container>
          <div className="max-w-[1100px] mx-auto">
            {/* Section Heading */}
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#42866A] block mb-2">
                SYSTEM DESIGN
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#173D32] tracking-tight">
                Technology Architecture
              </h2>
              <p className="mt-3 text-sm sm:text-[15px] text-[#1B2923]/75 leading-relaxed">
                Clear distinction between the client-side prototype demonstrated today and the proposed
                production services planned for municipal deployment.
              </p>
            </div>

            {/* Two-Column Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Column 1: Implemented Prototype */}
              <div className="text-left">
                <div className="pb-3 border-b border-[#E5E7EB]">
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#173D32]">
                    Implemented Prototype
                  </h3>
                </div>

                <div className="divide-y divide-[#E5E7EB] border-b border-[#E5E7EB]">
                  {implementedTech.map((tech, idx) => (
                    <div
                      key={idx}
                      className={`py-4 px-3 sm:px-4 ${idx % 2 === 1 ? 'bg-[#F7F8FA]' : 'bg-white'}`}
                    >
                      <h4 className="text-[16px] sm:text-[17px] font-bold text-[#173D32] leading-snug">
                        {tech.name}
                      </h4>
                      <p className="text-[14px] sm:text-[15px] text-[#4A5568] leading-[1.6] mt-1.5 font-normal">
                        {tech.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Proposed Backend & AI Architecture */}
              <div className="text-left">
                <div className="pb-3 border-b border-[#E5E7EB]">
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#173D32]">
                    Proposed Backend & AI Architecture
                  </h3>
                </div>

                <div className="divide-y divide-[#E5E7EB] border-b border-[#E5E7EB]">
                  {proposedTech.map((tech, idx) => (
                    <div
                      key={idx}
                      className={`py-4 px-3 sm:px-4 ${idx % 2 === 1 ? 'bg-[#F7F8FA]' : 'bg-white'}`}
                    >
                      <h4 className="text-[16px] sm:text-[17px] font-bold text-[#173D32] leading-snug">
                        {tech.name}
                      </h4>
                      <p className="text-[14px] sm:text-[15px] text-[#4A5568] leading-[1.6] mt-1.5 font-normal">
                        {tech.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION SIX — Our Team (Clean Editorial PixelSquad Section)
          ========================================================================= */}
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="max-w-[760px] mx-auto text-center space-y-4">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#42866A] block">
              THE TEAM
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#173D32] tracking-tight">
              Meet PixelSquad
            </h2>

            <p className="text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              GaunPulse is developed by PixelSquad, a team exploring how technology, spatial
              intelligence, and community-centered design can help address infrastructure challenges
              in Nepal.
            </p>

            <div className="pt-2">
              <a
                href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold tracking-wider uppercase text-[#173D32] hover:text-[#42866A] transition-colors focus-visible:outline-2 focus-visible:outline-[#173D32] focus-visible:outline-offset-2 py-1 border-b border-transparent hover:border-[#42866A]"
              >
                <span>Explore Our GitHub Repository</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default AboutPage;
