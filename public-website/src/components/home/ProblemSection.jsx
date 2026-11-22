import React, { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { GraduationCap, HeartPulse, Truck, RotateCw, RotateCcw } from 'lucide-react';
import Container from '../ui/Container';
import ScrollReveal from '../ui/ScrollReveal';

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
      heading: 'Students Face Long detours',
      impactText:
        'When a footbridge is damaged, students face steep detours or missed school days, especially during the monsoon season.',
      stat: '+45 min',
      statLabel: 'average extra commute',
      icon: GraduationCap,
      scenario: 'Monsoon flash-flood cuts lower suspension bridge',
      affected: '68 primary & secondary students in Tallo Basti',
      delayText: 'Normal walk: 15 min • Detour via ridge trail: 60 min',
      theme: {
        bg: 'bg-emerald-50/60',
        backBg: 'bg-[#F2F8F5]',
        border: 'border-[#42866A]/30',
        cornerBlob: 'bg-[#42866A]/10',
        iconBg: 'bg-[#173D32]',
        iconColor: 'text-white',
        badgeBg: 'bg-white text-[#173D32] border-[#42866A]/20',
        statColor: 'text-[#173D32]',
        statBadge: 'bg-[#173D32]/10 text-[#173D32]',
        doodleColor: 'text-[#42866A]',
        buttonBorder: 'border-[#42866A]/40 text-[#173D32] hover:bg-[#DDEBE2]/60',
      },
    },
    {
      id: 'healthcare',
      title: 'HEALTHCARE MOBILITY',
      heading: 'Critical Delays for Clinics',
      impactText:
        'Emergencies require immediate transport. Broken trails can cut off safe passage to the health post when every minute matters.',
      stat: '3.2x',
      statLabel: 'longer to reach clinic',
      icon: HeartPulse,
      scenario: 'Slope failure blocks ambulance jeep track',
      affected: '410 residents dependent on Ward 4 Health Post',
      delayText: 'Stretcher carry: 2.5 hours over unpaved boulders',
      theme: {
        bg: 'bg-amber-50/70',
        backBg: 'bg-[#FAF5EC]',
        border: 'border-[#E3AD58]/40',
        cornerBlob: 'bg-[#E3AD58]/15',
        iconBg: 'bg-[#E3AD58]',
        iconColor: 'text-[#173D32]',
        badgeBg: 'bg-white text-[#946A24] border-[#E3AD58]/30',
        statColor: 'text-[#946A24]',
        statBadge: 'bg-[#E3AD58]/20 text-[#946A24]',
        doodleColor: 'text-[#E3AD58]',
        buttonBorder: 'border-[#E3AD58]/50 text-[#946A24] hover:bg-[#FCEFD8]/60',
      },
    },
    {
      id: 'economy',
      title: 'LOCAL ECONOMY',
      heading: 'Harvests Spoil Without Route Access',
      impactText:
        'Farmers cannot bring vegetables and milk to the market when roads are blocked, directly threatening family livelihoods.',
      stat: '60%',
      statLabel: 'income risk during blockages',
      icon: Truck,
      scenario: 'Culvert washout blocks small pickup transport',
      affected: '35 smallholder farming households',
      delayText: 'Perishable cabbage & dairy must be head-carried',
      theme: {
        bg: 'bg-sky-50/60',
        backBg: 'bg-[#F0F6FA]',
        border: 'border-sky-300/40',
        cornerBlob: 'bg-sky-400/10',
        iconBg: 'bg-[#1B2923]',
        iconColor: 'text-sky-200',
        badgeBg: 'bg-white text-[#1B2923] border-sky-200',
        statColor: 'text-[#1B2923]',
        statBadge: 'bg-sky-100 text-[#1B2923]',
        doodleColor: 'text-sky-500',
        buttonBorder: 'border-sky-300 text-[#1B2923] hover:bg-sky-100/60',
      },
    },
  ];

  return (
    <>
      <section
        id="challenges"
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
          <ScrollReveal className="max-w-xl sm:max-w-2xl mx-auto text-center mb-10 sm:mb-12 md:mb-14 px-4">
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
          </ScrollReveal>

          {/* 3D Flip Cards Grid (Fixed Height, Equal Proportions, No Growth) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch">
            {problemCards.map((card, idx) => {
              const Icon = card.icon;
              const { theme } = card;
              const isFlipped = flippedCards.has(card.id) || hoveredCardId === card.id;

              return (
                <ScrollReveal
                  key={card.id}
                  delay={idx * 0.08}
                  className="perspective-1000 w-full h-[280px] sm:h-[285px] lg:h-[280px]"
                >
                  <div
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className="w-full h-full"
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

                          {/* Card Heading */}
                          <h3 className="text-base sm:text-lg font-bold text-[#173D32] leading-snug pt-1">
                            {card.heading}
                          </h3>

                          {/* Problem Narrative */}
                          <p className="text-xs sm:text-[13px] text-[#1B2923]/75 leading-relaxed font-normal line-clamp-3">
                            {card.impactText}
                          </p>
                        </div>

                        {/* Bottom Metric + Flip Prompt */}
                        <div className="relative z-10 pt-2 border-t border-black/5 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-xl sm:text-2xl font-black ${theme.statColor} tracking-tight`}>
                              {card.stat}
                            </span>
                            <span className="text-[11px] text-[#1B2923]/60 font-medium leading-tight">
                              {card.statLabel}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleFlip(card.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#173D32] hover:text-[#42866A] transition-colors focus-visible:outline-2 focus-visible:outline-[#173D32] focus-visible:outline-offset-2 cursor-pointer"
                            aria-label={`View simulation details for ${card.title}`}
                          >
                            <span>Details</span>
                            <RotateCw className="w-3 h-3 transition-transform group-hover:rotate-45" />
                          </button>
                        </div>
                      </div>

                      {/* ================= BACK FACE ================= */}
                      <div
                        className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 ${theme.backBg} rounded-[24px] sm:rounded-[28px] border ${theme.border} p-5 sm:p-6 flex flex-col justify-between shadow-[0_8px_24px_rgba(23,61,50,0.06)] overflow-hidden select-none`}
                        aria-hidden={!isFlipped}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#173D32]">
                              Simulated Impact
                            </span>
                            <DoodleWavyLine className={`w-12 h-1.5 ${theme.doodleColor}`} />
                          </div>

                          <div className="space-y-2 text-left">
                            <div className="rounded-lg bg-white/80 p-2.5 border border-black/5">
                              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                                Scenario
                              </p>
                              <p className="text-xs font-semibold text-[#173D32] mt-0.5">
                                {card.scenario}
                              </p>
                            </div>

                            <div className="rounded-lg bg-white/80 p-2.5 border border-black/5">
                              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                                At Risk
                              </p>
                              <p className="text-xs text-[#1B2923]/80 mt-0.5">
                                {card.affected}
                              </p>
                            </div>

                            <p className="text-[11px] text-[#1B2923]/70 italic leading-snug">
                              {card.delayText}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                          <button
                            type="button"
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
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}

export default ProblemSection;
