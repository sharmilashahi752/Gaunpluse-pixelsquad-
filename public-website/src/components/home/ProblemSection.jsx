import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { GraduationCap, HeartPulse, Truck, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export function ProblemSection() {
  const shouldReduceMotion = useReducedMotion();

  const problemCards = [
    {
      id: 'education',
      title: 'Education Access',
      subtitle: 'Disrupted Journeys to School',
      icon: GraduationCap,
      iconBg: 'bg-[#173D32]',
      iconColor: 'text-[#E3AD58]',
      badge: 'Student Vulnerability',
      badgeVariant: 'amber',
      description:
        'When mountain paths wash out or suspension bridges deteriorate, school routes become hazardous. Children face dangerous river crossings or weeks of missed school during monsoon seasons, deepening educational disparities between rural wards and urban centers.',
      impactScenario: 'A single damaged footbridge can isolate an entire hamlet from the nearest primary and secondary schools.',
      keyMetrics: ['Extended walk times across steep ridges', 'Seasonal attendance drops during rainfall', 'Hazardous unmonitored river crossings'],
    },
    {
      id: 'healthcare',
      title: 'Healthcare Access',
      subtitle: 'Delayed Emergency Medical Care',
      icon: HeartPulse,
      iconBg: 'bg-[#D45F53]',
      iconColor: 'text-white',
      badge: 'Critical Transit Risk',
      badgeVariant: 'alert',
      description:
        'Rural health posts and birthing clinics depend on intact physical access. If a motorable track is blocked by a debris slide or a bridge abutment weakens, emergency transfers that should take thirty minutes can stretch into hours of difficult stretcher transit.',
      impactScenario: 'Emergency maternal and trauma care transfers cannot tolerate long detour hours through alternate mountain trails.',
      keyMetrics: ['Critical ambulance route blockages', 'Delayed transport of vital pharmaceutical supplies', 'Reliance on arduous manual stretcher carries'],
    },
    {
      id: 'connectivity',
      title: 'Community Connectivity',
      subtitle: 'Severed Economic & Social Lifelines',
      icon: Truck,
      iconBg: 'bg-[#42866A]',
      iconColor: 'text-white',
      badge: 'Market Isolation',
      badgeVariant: 'neutral',
      description:
        'Rural livelihoods rely on timely transit for agricultural produce, daily labor, and market commerce. When physical links collapse, local farmers cannot transport perishable goods to haat bazaars, household goods grow scarce, and local economies stall.',
      impactScenario: 'Smallholder farmers lose essential seasonal revenue when perishable produce cannot reach regional distribution hubs.',
      keyMetrics: ['Post-harvest spoilage due to freight delays', 'Spike in local prices for basic household essentials', 'Severed daily communication between separated wards'],
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : i * 0.12,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  return (
    <section
      aria-labelledby="problem-heading"
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-[#F8F7F2] via-[#F4F1EA] to-[#F8F7F2] relative overflow-hidden"
    >
      {/* Background contour accents */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-[#DDEBE2]/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-10 w-80 h-80 bg-[#E3AD58]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDEBE2] border border-[#42866A]/20 text-xs sm:text-sm font-semibold text-[#173D32] mb-4 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-[#D45F53]" />
            <span>The Rural Reality in Nepal</span>
          </div>

          <h2
            id="problem-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#173D32] leading-tight"
          >
            When Infrastructure Breaks, <br className="hidden sm:inline" />
            <span className="text-[#42866A]">Communities Feel the Impact.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#1B2923]/80 leading-relaxed font-normal">
            A damaged bridge is more than a broken connection. It can affect a child's journey to school,
            a patient's access to healthcare, and a family's ability to reach essential services.
          </p>
        </div>

        {/* 3 Storytelling Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {problemCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={cardVariants}
                className="flex flex-col h-full"
              >
                <Card
                  hover
                  className="h-full flex flex-col justify-between bg-white/90 border-[#42866A]/20 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-6 sm:p-7 relative overflow-hidden group"
                >
                  {/* Decorative subtle top edge accent */}
                  <div
                    className={`absolute top-0 inset-x-0 h-1.5 ${
                      card.id === 'education'
                        ? 'bg-[#173D32]'
                        : card.id === 'healthcare'
                        ? 'bg-[#D45F53]'
                        : 'bg-[#42866A]'
                    }`}
                  />

                  <div>
                    {/* Header: Icon + Badge */}
                    <div className="flex items-center justify-between mb-5 pt-1">
                      <div
                        className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} shadow-xs group-hover:scale-105 transition-transform duration-200`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant={card.badgeVariant}>{card.badge}</Badge>
                    </div>

                    {/* Card Title & Subtitle */}
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#42866A]">
                      {card.title}
                    </span>
                    <h3 className="text-xl font-bold text-[#173D32] mt-1 group-hover:text-[#42866A] transition-colors leading-snug">
                      {card.subtitle}
                    </h3>

                    {/* Narrative Description */}
                    <p className="mt-3 text-sm text-[#1B2923]/80 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Impact Highlight Callout */}
                    <div className="mt-5 p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 text-xs text-[#173D32] flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-[#D45F53] shrink-0 mt-0.5" />
                      <p className="leading-snug font-medium italic">
                        "{card.impactScenario}"
                      </p>
                    </div>
                  </div>

                  {/* Bulleted Points / Key Realities */}
                  <div className="mt-6 pt-5 border-t border-[#42866A]/15">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] mb-2.5">
                      Observed Bottlenecks
                    </p>
                    <ul className="space-y-2 text-xs text-[#1B2923]/75">
                      {card.keyMetrics.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Closing Context Banner */}
        <div className="mt-12 p-4 sm:p-5 rounded-xl bg-[#DDEBE2]/40 border border-[#42866A]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E3AD58] shrink-0 animate-pulse" />
            <p className="text-xs sm:text-sm text-[#173D32] font-medium">
              Infrastructure failures don't happen in isolation. Understanding their network ripple effect is key to effective rural decision-making.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#42866A] shrink-0 flex items-center gap-1">
            Why GaunPulse Exists <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Container>
    </section>
  );
}

export default ProblemSection;
