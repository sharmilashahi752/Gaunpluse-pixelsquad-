import React from 'react';
import Container from '../ui/Container';
import ScrollReveal from '../ui/ScrollReveal';

// Local curated village photography
import village1Img from '../../assets/solution/village1.jpg';
import villageImg from '../../assets/solution/village.jpg';
import village8Img from '../../assets/solution/village8.png';

export function SolutionSection() {
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
            <ScrollReveal className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full rounded-xl overflow-hidden aspect-[4/5] bg-stone-100 shadow-xs border border-stone-200/50">
                <img
                  src={village1Img}
                  alt="Rural Nepalese hillside community trail network"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            {/* Right Column: Compact Centered Content Composition */}
            <ScrollReveal delay={0.15} className="lg:col-span-6 flex flex-col items-center justify-center text-center">
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
                  <div className="rounded-xl overflow-hidden aspect-[4/3] bg-stone-100 shadow-xs border border-stone-200/50">
                    <img
                      src={villageImg}
                      alt="Village access network example"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
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
            </ScrollReveal>
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
          <ScrollReveal className="flex flex-col items-center text-center max-w-[800px] mx-auto">
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
          </ScrollReveal>

          {/* 4. One Large, Wide Landscape Image (village8) */}
          <ScrollReveal delay={0.15} className="mt-7 sm:mt-[28px] w-full max-w-[1100px] mx-auto">
            <div className="w-full rounded-[14px] overflow-hidden aspect-[16/8] sm:aspect-[16/7] bg-stone-100 border border-stone-200/60 shadow-xs">
              <img
                src={village8Img}
                alt="Panoramic view of rural Himalayan village settlement and terrain network"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

export default SolutionSection;
