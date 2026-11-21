import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  FileEdit,
  CheckCircle2,
  GitBranch,
  SlidersHorizontal,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      stepNumber: '01',
      title: 'Report a Problem',
      shortActor: 'Citizen / Community',
      badge: 'Step 1: Intake',
      badgeVariant: 'neutral',
      icon: FileEdit,
      iconBg: 'bg-[#173D32]',
      iconColor: 'text-[#E3AD58]',
      description:
        'A local resident, ward volunteer, or teacher discovers damaged infrastructure — such as a cracked abutment, loose suspension cable, or road blockage — and submits an observation with photos and approximate location.',
      technicalPreview: 'Incident Report #IR-042 • Photo & Geolocation Logged',
      keyArtifact: 'Mobile-friendly community submission portal with offline-first support',
    },
    {
      stepNumber: '02',
      title: 'Verify and Map',
      shortActor: 'Ward Official / Engineer',
      badge: 'Step 2: Validation',
      badgeVariant: 'neutral',
      icon: CheckCircle2,
      iconBg: 'bg-[#42866A]',
      iconColor: 'text-white',
      description:
        'Authorized ward representatives or technical staff review the submitted report, confirm the physical hazard, and associate it with the official digital infrastructure network and asset registry.',
      technicalPreview: 'Associated with Trishuli Corridor Bridge #BR-02 (Ward 4)',
      keyArtifact: 'Administrative triage interface linking reports to GIS topological nodes',
    },
    {
      stepNumber: '03',
      title: 'Simulate the Impact',
      shortActor: 'Graph Intelligence Engine',
      badge: 'Step 3: Graph Simulation',
      badgeVariant: 'amber',
      icon: GitBranch,
      iconBg: 'bg-[#E3AD58]',
      iconColor: 'text-[#173D32]',
      description:
        'The system executes network graph algorithms to evaluate how the damaged facility affects the wider community. It simulates road closures, computes detour hours, and determines which health posts, schools, and settlements become isolated.',
      technicalPreview: 'Downstream Impact: 140 Households Isolated • +2.5h detour to Health Post',
      keyArtifact: 'Topological network simulation engine computing reachability indices',
    },
    {
      stepNumber: '04',
      title: 'Compare Possible Solutions',
      shortActor: 'Municipal Decision-Makers',
      badge: 'Step 4: Scenario Analysis',
      badgeVariant: 'neutral',
      icon: SlidersHorizontal,
      iconBg: 'bg-[#173D32]',
      iconColor: 'text-white',
      description:
        'Local government officials explore countermeasure options: emergency temporary pedestrian diversion, immediate pier reinforcement, or prioritized capital repair, comparing how each restores community connectivity.',
      technicalPreview: 'Scenario Evaluation: Temporary Timber Shoring restores 85% foot traffic within 48h',
      keyArtifact: 'Interactive comparative decision-support matrix for municipal budget allocation',
    },
    {
      stepNumber: '05',
      title: 'Plan and Track Action',
      shortActor: 'Local Government & Public',
      badge: 'Step 5: Execution & Transparency',
      badgeVariant: 'alert',
      icon: ClipboardList,
      iconBg: 'bg-[#42866A]',
      iconColor: 'text-white',
      description:
        'Elected leaders formulate evidence-backed action plans, dispatch repair teams, and publish public notices to keep the community informed. Citizens can track progress from initial inspection to final repair.',
      technicalPreview: 'Public Notice Broadcast • Work Order #WO-89 Dispatched to Municipal Engineers',
      keyArtifact: 'Public transparency bulletin and transparent municipal resolution pipeline',
    },
  ];

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  return (
    <section
      id="how-it-works"
      tabIndex="-1"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-[#F8F7F2] via-[#F3EFE6] to-[#F8F7F2] relative overflow-hidden outline-hidden"
    >
      {/* Decorative background glows */}
      <div
        className="absolute top-1/3 right-10 w-96 h-96 bg-[#DDEBE2]/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-10 w-80 h-80 bg-[#E3AD58]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDEBE2] border border-[#42866A]/20 text-xs sm:text-sm font-semibold text-[#173D32] mb-4 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#42866A]" />
            <span>End-to-End Decision Lifecycle</span>
          </div>

          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#173D32] leading-tight"
          >
            How GaunPulse Works
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#1B2923]/80 leading-relaxed font-normal">
            From identifying an infrastructure problem to understanding its impact and planning a response.
          </p>
        </div>

        {/* 5-Step Process Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Connecting Center Line (Visible on md+ screens) */}
          <div
            className="hidden md:block absolute left-8 top-12 bottom-12 w-0.5 bg-[#42866A]/20 -ml-px pointer-events-none"
            aria-hidden="true"
          />

          <div className="space-y-8 sm:space-y-10">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.stepNumber}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={itemVariants}
                  className="relative flex flex-col md:flex-row items-start gap-5 sm:gap-6 group"
                >
                  {/* Step Number & Icon Anchor */}
                  <div className="flex md:flex-col items-center gap-3 shrink-0 z-10">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${step.iconBg} flex items-center justify-center ${step.iconColor} shadow-md border-2 border-white ring-4 ring-[#DDEBE2] group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <span className="md:hidden font-mono text-sm font-extrabold text-[#42866A]">
                      Step {step.stepNumber}
                    </span>
                  </div>

                  {/* Card Content Body */}
                  <div className="flex-1 w-full">
                    <Card
                      hover
                      className="bg-white/90 border-[#42866A]/20 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="hidden md:inline-block font-mono text-xs font-extrabold text-[#42866A] bg-[#DDEBE2] px-2 py-0.5 rounded-md">
                            STEP {step.stepNumber}
                          </span>
                          <span className="text-xs font-semibold text-[#42866A]">
                            {step.shortActor}
                          </span>
                        </div>
                        <Badge variant={step.badgeVariant}>{step.badge}</Badge>
                      </div>

                      {/* Step Title */}
                      <h3 className="text-xl font-bold text-[#173D32] group-hover:text-[#42866A] transition-colors">
                        {step.title}
                      </h3>

                      {/* Step Narrative */}
                      <p className="mt-2 text-sm text-[#1B2923]/80 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Technical Preview Banner */}
                      <div className="mt-4 p-3 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-[#173D32] font-mono truncate">
                          <span className="w-2 h-2 rounded-full bg-[#42866A] shrink-0" />
                          <span className="truncate">{step.technicalPreview}</span>
                        </div>
                        <span className="text-[10px] text-[#42866A] font-semibold shrink-0 uppercase tracking-wider hidden sm:inline">
                          Simulated Event
                        </span>
                      </div>

                      {/* Artifact Footnote */}
                      <div className="mt-3 text-[11px] text-[#1B2923]/60 flex items-center gap-1.5">
                        <span className="font-semibold text-[#173D32]">Key Artifact:</span>
                        <span>{step.keyArtifact}</span>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Callout / Transparency Note */}
        <div className="mt-14 max-w-2xl mx-auto text-center p-5 rounded-2xl bg-white/70 border border-[#42866A]/20 shadow-2xs">
          <p className="text-xs sm:text-sm text-[#173D32] font-medium leading-relaxed">
            <strong className="font-bold">Human-Centered CivicTech:</strong> GaunPulse provides objective impact modeling to assist local leadership — leaving democratic priorities and final expenditure decisions in the hands of elected ward chairs and local communities.
          </p>
        </div>
      </Container>
    </section>
  );
}

export default HowItWorksSection;
