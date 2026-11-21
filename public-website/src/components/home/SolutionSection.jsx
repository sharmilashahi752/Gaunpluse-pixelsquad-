import React from 'react';
import {
  Users,
  Map,
  Network,
  Cpu,
  UserCheck,
} from 'lucide-react';
import Container from '../ui/Container';

// Local curated village photography
import village1Img from '../../assets/solution/village1.jpg';
import villageImg from '../../assets/solution/village.jpg';
import village8Img from '../../assets/solution/village8.png';

// Preserved decision-support architecture data structure for reuse and maintainability
const solutionPillars = [
  {
    id: 0,
    title: 'Community Reports',
    tagline: 'Grassroots Eyes on the Ground',
    icon: Users,
    badge: 'Input Layer',
    shortDesc: 'Citizens submit real-time hazard notices with photos, audio notes, and location markers.',
    deepDive:
      'Local residents identify cracked culverts, scouring riverbanks, and landslides immediately when they appear, bypassing bureaucratic reporting delays.',
    workflowNode: 'Community Report Intake',
    systemOutput: 'Raw observation geocoded & logged with timestamp',
  },
  {
    id: 1,
    title: 'Digital Infrastructure Maps',
    tagline: 'Spatial Network Foundation',
    icon: Map,
    badge: 'Spatial Topology',
    shortDesc: 'Ground observations are registered directly against mapped physical bridges, trails, and ward routes.',
    deepDive:
      'Instead of isolated text tickets, incidents are attached to digital topological networks representing roads, foot trails, and public river crossings.',
    workflowNode: 'Topology Asset Matching',
    systemOutput: 'Incident attached to Road Segment #RD-104 & Bridge #BR-02',
  },
  {
    id: 2,
    title: 'Graph-Based Impact Simulation',
    tagline: 'Topological Cascades & Cut-offs',
    icon: Network,
    badge: 'Analytical Core',
    shortDesc: 'Network graph algorithms calculate which hamlets, schools, or clinics lose connectivity if a structure fails.',
    deepDive:
      'The simulation evaluates reachability across alternative paths, calculating detour delays and identifying communities at critical isolation risk.',
    workflowNode: 'Graph Reachability Engine',
    systemOutput: 'Isolation Severity Index: Critical (140 households cut off)',
  },
  {
    id: 3,
    title: 'AI-Assisted Explanations',
    tagline: 'Plain-Language Intelligence',
    icon: Cpu,
    badge: 'Cognitive Synthesis',
    shortDesc: 'Complex network metrics are translated into clear, actionable summaries for elected ward representatives.',
    deepDive:
      'Natural language synthesis converts raw topological data into concise impact summaries that explain who is affected, why, and how urgently intervention is needed.',
    workflowNode: 'AI Decision Synthesis',
    systemOutput: 'Automated briefing: "South Bridge closure severs clinic access by 2.5h"',
  },
  {
    id: 4,
    title: 'Human-Reviewed Action Planning',
    tagline: 'Local Democratic Accountability',
    icon: UserCheck,
    badge: 'Governance Outcome',
    shortDesc: 'Ward chairs and municipal engineers review objective simulation evidence to schedule prioritized repairs.',
    deepDive:
      'AI advises, but humans decide. Elected local officials use transparent data to allocate scarce municipal budgets where they restore the greatest community access.',
    workflowNode: 'Municipal Action Plan',
    systemOutput: 'Work order approved & public advisory issued to ward bulletin',
  },
];

export function SolutionSection() {
  // Retain data reference for future re-extension
  void solutionPillars;

  return (
    <>
      {/* =========================================================================
          SECTION 1: EDITORIAL SPLIT COMPOSITION
          Left: Large Portrait Visual Showcase (village1.jpg)
          Right: Compact Centered Editorial Group (village.jpg)
         ========================================================================= */}
      <section
        aria-labelledby="solution-heading"
        className="py-16 sm:py-20 lg:py-24 bg-white border-t border-stone-200/80 relative"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
            {/* Left Column: One Large Portrait-Oriented Village Photograph (village1.jpg) */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full rounded-xl overflow-hidden aspect-[4/5] bg-stone-100">
                <img
                  src={village1Img}
                  alt="Rural Nepalese hillside community trail network"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Column: Compact Centered Content Composition */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-[540px] flex flex-col items-center text-center">
                {/* Small label */}
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.08em] text-[#666]">
                  INTEGRATED WORKFLOW
                </span>

                {/* One-line heading on desktop */}
                <h2
                  id="solution-heading"
                  className="mt-3 sm:mt-3.5 text-[18px] sm:text-[20px] lg:text-[21px] xl:text-[22px] font-medium tracking-tight text-[#171717] text-center lg:whitespace-nowrap"
                >
                  From Community Problems to Informed Decisions
                </h2>

                {/* Supporting landscape photograph (village.jpg) */}
                <div className="mt-4 sm:mt-5 w-[82%] sm:w-[80%] max-w-[400px]">
                  <div className="rounded-xl overflow-hidden aspect-[4/3] bg-stone-100">
                    <img
                      src={villageImg}
                      alt="Village access network example"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Image caption */}
                <p className="mt-2.5 sm:mt-3 text-[13px] sm:text-[13.5px] text-[#555] font-normal text-center">
                  Village access network example
                </p>

                {/* Short description */}
                <p className="mt-3 sm:mt-3.5 text-[12.5px] sm:text-[13px] text-[#666] font-normal max-w-[500px] text-center leading-relaxed">
                  Connecting community observations with maps, simulation and clearer decisions.
                </p>

                {/* Underlined CTA */}
                <div className="mt-3 sm:mt-3.5">
                  <a
                    href="#workflow-system"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('workflow-system')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-block text-[11.5px] sm:text-[12px] font-medium uppercase tracking-[0.06em] text-neutral-900 underline underline-offset-4 decoration-neutral-900 hover:text-black hover:decoration-black transition-colors select-none"
                  >
                    EXPLORE THE WORKFLOW
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION 2: INTERACTIVE INTELLIGENCE PIPELINE (PANORAMIC VILLAGE8 SHOWCASE)
          Single vertical flow: Label -> Headline -> Description -> Wide 16:7 Image
         ========================================================================= */}
      <section
        id="workflow-system"
        aria-labelledby="pipeline-heading"
        className="scroll-mt-20 sm:scroll-mt-24 pt-12 sm:pt-14 lg:pt-[52px] pb-12 sm:pb-14 lg:pb-14 bg-white border-t border-stone-200/80 relative"
      >
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Text Group */}
          <div className="flex flex-col items-center text-center max-w-[800px] mx-auto">
            {/* 1. Small uppercase label */}
            <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#42866A]">
              DECISION-SUPPORT ARCHITECTURE
            </span>

            {/* 2. Centered headline */}
            <h3
              id="pipeline-heading"
              className="mt-3 text-[23px] sm:text-[26px] md:text-[28px] lg:text-[30px] xl:text-[32px] font-semibold text-[#173D32] tracking-tight leading-[1.2] text-center"
            >
              Interactive Intelligence Pipeline
            </h3>

            {/* 3. Short centered description */}
            <p className="mt-[18px] text-[14px] sm:text-[15px] lg:text-[16.5px] text-[#1B2923]/70 font-normal leading-[1.6] max-w-[800px]">
              Discover how GaunPulse connects community reports, infrastructure mapping, and simulation to support informed local decisions.
            </p>
          </div>

          {/* 4. One Large, Wide Landscape Image (village8) */}
          <div className="mt-7 sm:mt-[28px] w-full max-w-[1100px] mx-auto">
            <div className="w-full rounded-[14px] overflow-hidden aspect-[16/8] sm:aspect-[16/7] bg-stone-100 border border-stone-200/60 shadow-xs">
              <img
                src={village8Img}
                alt="Panoramic view of rural Himalayan village settlement and terrain network"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default SolutionSection;
