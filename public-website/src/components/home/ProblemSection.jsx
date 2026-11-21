import React, { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { GraduationCap, HeartPulse, Truck, RotateCw, RotateCcw } from 'lucide-react';
import Container from '../ui/Container';

/**
 * Handcrafted SVG Doodle Accents
 * Adds warm, playful, human-centered personality without cluttering readability.
 */
function DoodleSparkle({ className = 'w-4 h-4 text-[#E3AD58]' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.5-6.5l-2.8 2.8m-7.4 7.4l-2.8 2.8m0-13l2.8 2.8m7.4 7.4l2.8 2.8" />
    </svg>
  );
}

function DoodleWavyLine({ className = 'w-14 h-1.5 text-[#42866A]' }) {
  return (
    <svg
      viewBox="0 0 80 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 4c5-3 10 3 15 0s10-3 15 0 10 3 15 0 10-3 15 0 10 3 15 0" />
    </svg>
  );
}

function DoodleHandArrow({ className = 'w-3.5 h-3.5 text-[#42866A]' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 8h10.5m-4-4l4 4-4 4" />
    </svg>
  );
}

export function ProblemSection() {
  const shouldReduceMotion = useReducedMotion();
  const [flippedCards, setFlippedCards] = useState(() => new Set());
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const toggleFlip = (id) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const problemCards = [
    {
      id: 'education',
      title: 'EDUCATION ACCESS',
      heading: 'Disrupted Journeys to School',
      description: "Damaged bridges and trails can disrupt children's access to education.",
      icon: GraduationCap,
      theme: {
        bg: 'bg-white',
        border: 'border-[#42866A]/20 hover:border-[#42866A]/50',
        badgeBg: 'bg-[#EAF5EE] text-[#173D32] border-[#42866A]/25',
        iconBg: 'bg-[#173D32]',
        iconColor: 'text-[#E3AD58]',
        accentColor: 'text-[#42866A]',
        doodleColor: 'text-[#E3AD58]',
        bulletIconColor: 'text-[#42866A]',
        cornerBlob: 'bg-[#DDEBE2]/35',
        buttonBorder: 'border-[#42866A]/30 hover:bg-[#EAF5EE] text-[#173D32]',
      },
      backHeading: 'Community Impact',
      impactPoints: [
        'Longer journeys to school.',
        'Potentially unsafe crossings.',
        'Interrupted learning during closures.',
      ],
      // Preserved comprehensive research narrative
      fullDescription:
        'When mountain paths wash out or suspension bridges deteriorate, school routes become hazardous. Children face dangerous river crossings or weeks of missed school during monsoon seasons, deepening educational disparities between rural wards and urban centers.',
      impactScenario:
        'A single damaged footbridge can isolate an entire hamlet from the nearest primary and secondary schools.',
      keyMetrics: [
        'Extended walk times across steep ridges',
        'Seasonal attendance drops during rainfall',
        'Hazardous unmonitored river crossings',
      ],
    },
    {
      id: 'healthcare',
      title: 'HEALTHCARE ACCESS',
      heading: 'Delayed Emergency Medical Care',
      description: 'Damaged roads and bridges can delay access to essential healthcare.',
      icon: HeartPulse,
      theme: {
        bg: 'bg-white',
        border: 'border-[#D45F53]/20 hover:border-[#D45F53]/50',
        badgeBg: 'bg-[#FDF2F0] text-[#B83E32] border-[#D45F53]/25',
        iconBg: 'bg-[#D45F53]',
        iconColor: 'text-white',
        accentColor: 'text-[#D45F53]',
        doodleColor: 'text-[#D45F53]',
        bulletIconColor: 'text-[#D45F53]',
        cornerBlob: 'bg-[#F9DDD8]/30',
        buttonBorder: 'border-[#D45F53]/30 hover:bg-[#FDF2F0] text-[#B83E32]',
      },
      backHeading: 'Community Impact',
      impactPoints: [
        'Delayed medical transportation.',
        'Reduced access to health facilities.',
        'Longer emergency detours.',
      ],
      // Preserved comprehensive research narrative
      fullDescription:
        'Rural health posts and birthing clinics depend on intact physical access. If a motorable track is blocked by a debris slide or a bridge abutment weakens, emergency transfers that should take thirty minutes can stretch into hours of difficult stretcher transit.',
      impactScenario:
        'Emergency maternal and trauma care transfers cannot tolerate long detour hours through alternate mountain trails.',
      keyMetrics: [
        'Critical ambulance route blockages',
        'Delayed transport of vital pharmaceutical supplies',
        'Reliance on arduous manual stretcher carries',
      ],
    },
    {
      id: 'connectivity',
      title: 'COMMUNITY CONNECTIVITY',
      heading: 'Severed Economic & Social Lifelines',
      description: 'Broken connections can disrupt transport, markets, and daily village life.',
      icon: Truck,
      theme: {
        bg: 'bg-white',
        border: 'border-[#2B6653]/20 hover:border-[#2B6653]/50',
        badgeBg: 'bg-[#E8F2ED] text-[#173D32] border-[#2B6653]/25',
        iconBg: 'bg-[#2B6653]',
        iconColor: 'text-[#E3AD58]',
        accentColor: 'text-[#2B6653]',
        doodleColor: 'text-[#2B6653]',
        bulletIconColor: 'text-[#2B6653]',
        cornerBlob: 'bg-[#D6E6DF]/35',
        buttonBorder: 'border-[#2B6653]/30 hover:bg-[#E8F2ED] text-[#173D32]',
      },
      backHeading: 'Community Impact',
      impactPoints: [
        'Difficult transport of farm produce.',
        'Reduced market accessibility.',
        'Disrupted daily community movement.',
      ],
      // Preserved comprehensive research narrative
      fullDescription:
        'Rural livelihoods rely on timely transit for agricultural produce, daily labor, and market commerce. When physical links collapse, local farmers cannot transport perishable goods to haat bazaars, household goods grow scarce, and local economies stall.',
      impactScenario:
        'Smallholder farmers lose essential seasonal revenue when perishable produce cannot reach regional distribution hubs.',
      keyMetrics: [
        'Post-harvest spoilage due to freight delays',
        'Spike in local prices for basic household essentials',
        'Severed daily communication between separated wards',
      ],
    },
  ];

  return (
    <>
      {/* =========================================================================
          PART 1: COMPACT EDITORIAL BLACK TRANSITION SECTION (Frame Studio Inspired)
          Target: ~140-180px total height on desktop with 28-36px padding
         ========================================================================= */}
      <section
        aria-label="Community Impact Introduction"
        className="w-full bg-[#111111] py-7 sm:py-8 md:py-[32px] text-white relative overflow-hidden border-b border-stone-800/80"
      >
        <Container>
          <div className="max-w-2xl mx-auto text-center px-4 space-y-1.5 sm:space-y-2">
            {/* Main Editorial Statement (~24-28px desktop, ~20-24px mobile) */}
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] lg:text-[26px] font-normal sm:font-medium text-white tracking-tight leading-snug">
              A closer look at how broken infrastructure affects everyday life.
            </h2>

            {/* Supporting Context (~14-15px) */}
            <p className="text-[13px] sm:text-[14px] md:text-[15px] text-stone-300/80 font-normal leading-relaxed max-w-xl mx-auto">
              From school access to healthcare and local livelihoods, one damaged connection can affect an entire community.
            </p>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          PART 2: PROBLEM SECTION WITH REFINED HEADING & 3D FLIP CARDS
         ========================================================================= */}
      <section
        aria-labelledby="problem-heading"
        className="py-12 sm:py-16 lg:py-20 bg-white relative overflow-hidden"
      >
        {/* Soft atmospheric background accents */}
        <div
          className="absolute top-1/4 -left-20 w-80 h-80 bg-[#DDEBE2]/40 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 right-0 w-96 h-96 bg-[#E3AD58]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <Container>
          {/* Section Heading Area: Refined, Editorial & Balanced */}
          <div className="max-w-xl sm:max-w-2xl mx-auto text-center mb-10 sm:mb-12 md:mb-14 px-4">
            <h2
              id="problem-heading"
              className="text-[26px] sm:text-[28px] md:text-[32px] lg:text-[38px] font-medium sm:font-semibold tracking-tight text-[#173D32] leading-[1.18]"
            >
              When Infrastructure Breaks,
              <br className="hidden sm:inline" />
              {' '}Communities Feel the Impact
            </h2>

            <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm md:text-[15px] text-[#1B2923]/75 font-normal leading-relaxed max-w-lg sm:max-w-xl mx-auto">
              A damaged bridge is more than a broken connection. It can affect a child’s journey to school, a patient’s access to healthcare, and a family’s ability to reach essential services.
            </p>
          </div>

          {/* 3D Flip Cards Grid (Fixed Height, Equal Proportions, No Growth) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch">
            {problemCards.map((card) => {
              const Icon = card.icon;
              const { theme } = card;
              const isFlipped = flippedCards.has(card.id) || hoveredCardId === card.id;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="perspective-1000 w-full h-[280px] sm:h-[285px] lg:h-[280px]"
                >
                  {/* Inner Card 3D Flip Wrapper */}
                  <div
                    className={`relative w-full h-full transform-style-3d ${
                      shouldReduceMotion
                        ? 'transition-none'
                        : 'transition-transform duration-600 ease-in-out'
                    } ${isFlipped ? 'rotate-y-180' : ''}`}
                  >
                    {/* ================= FRONT FACE ================= */}
                    <div
                      className={`absolute inset-0 w-full h-full backface-hidden ${theme.bg} rounded-[24px] sm:rounded-[28px] border ${
                        isFlipped ? theme.border : 'border-stone-200/80'
                      } p-5 sm:p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(23,61,50,0.04)] hover:shadow-[0_12px_28px_rgba(23,61,50,0.08)] overflow-hidden select-none`}
                      aria-hidden={isFlipped}
                    >
                      {/* Organic Corner Accent Blob */}
                      <div
                        className={`absolute -top-10 -right-10 w-28 h-28 ${theme.cornerBlob} rounded-full blur-xl pointer-events-none`}
                        aria-hidden="true"
                      />

                      {/* Subtle playful doodle sparkle */}
                      <div className="absolute top-4 right-4 pointer-events-none opacity-60">
                        <DoodleSparkle className={`w-3.5 h-3.5 ${theme.doodleColor}`} />
                      </div>

                      {/* Front Content */}
                      <div className="relative z-10 space-y-2.5">
                        {/* Top Row: Icon + Category Badge */}
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center ${theme.iconColor} shadow-2xs border border-white/20`}
                          >
                            <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] border ${theme.badgeBg} shadow-2xs`}
                          >
                            {card.title}
                          </span>
                        </div>

                        {/* Heading + Wavy Underline */}
                        <div className="space-y-1">
                          <h3 className="text-base sm:text-[17px] font-bold text-[#173D32] leading-snug tracking-tight">
                            {card.heading}
                          </h3>
                          <DoodleWavyLine className={`w-12 h-1.5 ${theme.doodleColor} opacity-70`} />
                        </div>

                        {/* Brief Description */}
                        <p className="text-xs sm:text-[13px] text-[#1B2923]/80 leading-relaxed font-normal">
                          {card.description}
                        </p>
                      </div>

                      {/* Front Footer: "Flip to explore" Action */}
                      <div className="relative z-10 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <button
                          type="button"
                          tabIndex={isFlipped ? -1 : 0}
                          aria-label={`Flip card to explore ${card.title} community impact`}
                          aria-pressed={isFlipped}
                          onClick={() => toggleFlip(card.id)}
                          className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.05em] py-1 px-2.5 rounded-lg border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#173D32] focus-visible:outline-offset-2 cursor-pointer ${theme.buttonBorder}`}
                        >
                          <span>Flip to explore</span>
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
                          Hover or tap
                        </span>
                      </div>
                    </div>

                    {/* ================= BACK FACE ================= */}
                    <div
                      className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 ${theme.bg} rounded-[24px] sm:rounded-[28px] border ${
                        theme.border
                      } p-5 sm:p-6 flex flex-col justify-between shadow-[0_6px_24px_rgba(23,61,50,0.06)] overflow-hidden select-none`}
                      aria-hidden={!isFlipped}
                    >
                      {/* Organic Corner Accent Blob */}
                      <div
                        className={`absolute -bottom-10 -left-10 w-28 h-28 ${theme.cornerBlob} rounded-full blur-xl pointer-events-none`}
                        aria-hidden="true"
                      />

                      {/* Back Content */}
                      <div className="relative z-10 space-y-2.5">
                        {/* Top Row: Category + "Community Impact" Heading */}
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            {card.title}
                          </span>
                          <span className="text-xs font-bold text-[#173D32] tracking-tight">
                            {card.backHeading}
                          </span>
                        </div>

                        {/* Three Concise Impact Points */}
                        <ul className="space-y-2 text-xs text-[#1B2923]/85 pt-0.5">
                          {card.impactPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="shrink-0 mt-0.5">
                                <DoodleHandArrow className={`w-3.5 h-3.5 ${theme.bulletIconColor}`} />
                              </span>
                              <span className="leading-snug">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Back Footer: "Flip back" Action */}
                      <div className="relative z-10 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <button
                          type="button"
                          tabIndex={isFlipped ? 0 : -1}
                          aria-label={`Flip back to ${card.title} overview`}
                          aria-pressed={isFlipped}
                          onClick={() => toggleFlip(card.id)}
                          className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.05em] py-1 px-2.5 rounded-lg border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#173D32] focus-visible:outline-offset-2 cursor-pointer ${theme.buttonBorder}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Flip back</span>
                        </button>

                        <span className="text-[10px] text-stone-400 font-medium">
                          Hypothetical scenario
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}

export default ProblemSection;
