import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Users,
  Map,
  Network,
  Cpu,
  UserCheck,
  Check,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export function SolutionSection() {
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(2); // default to Graph-based simulation

  const solutionPillars = [
    {
      id: 0,
      title: 'Community Reports',
      tagline: 'Grassroots Eyes on the Ground',
      icon: Users,
      color: '#173D32',
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
      color: '#42866A',
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
      color: '#E3AD58',
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
      color: '#D45F53',
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
      color: '#173D32',
      badge: 'Governance Outcome',
      shortDesc: 'Ward chairs and municipal engineers review objective simulation evidence to schedule prioritized repairs.',
      deepDive:
        'AI advises, but humans decide. Elected local officials use transparent data to allocate scarce municipal budgets where they restore the greatest community access.',
      workflowNode: 'Municipal Action Plan',
      systemOutput: 'Work order approved & public advisory issued to ward bulletin',
    },
  ];

  const activePillar = solutionPillars[activeStep];

  return (
    <section
      aria-labelledby="solution-heading"
      className="py-16 sm:py-20 lg:py-24 bg-[#F8F7F2] border-t border-[#42866A]/15 relative overflow-hidden"
    >
      {/* Decorative background glows */}
      <div
        className="absolute -top-24 right-0 w-96 h-96 bg-[#DDEBE2]/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-10 w-80 h-80 bg-[#173D32]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDEBE2] border border-[#42866A]/20 text-xs sm:text-sm font-semibold text-[#173D32] mb-4 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#42866A]" />
            <span>The GaunPulse Approach</span>
          </div>

          <h2
            id="solution-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#173D32] leading-tight"
          >
            From Community Problems <br className="hidden sm:inline" />
            <span className="text-[#42866A]">to Informed Decisions.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#1B2923]/80 leading-relaxed font-normal">
            GaunPulse integrates grassroots observations with digital spatial graphs, simulated impact modeling, 
            and plain-language AI synthesis — giving local municipal leaders the clarity they need to act effectively.
          </p>
        </div>

        {/* 2-Column Storytelling Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Interactive 5-Pillar Walkthrough */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
                Core Pillars of the Platform
              </span>
              <span className="text-xs text-[#1B2923]/60 hidden sm:inline">
                Click a pillar to inspect workflow
              </span>
            </div>

            {solutionPillars.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activeStep === pillar.id;

              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActiveStep(pillar.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 flex items-start gap-4 focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
                    isActive
                      ? 'bg-white border-[#173D32] shadow-sm ring-1 ring-[#173D32]/10'
                      : 'bg-white/60 border-[#42866A]/15 hover:bg-white hover:border-[#42866A]/35'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#173D32] text-white shadow-xs'
                        : 'bg-[#DDEBE2] text-[#173D32]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-base font-bold truncate ${
                          isActive ? 'text-[#173D32]' : 'text-[#1B2923]'
                        }`}
                      >
                        {pillar.title}
                      </h3>
                      <Badge
                        variant={isActive ? 'neutral' : 'neutral'}
                        className="shrink-0 text-[10px]"
                      >
                        {pillar.badge}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed">
                      {pillar.shortDesc}
                    </p>

                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                        className="mt-3 pt-3 border-t border-[#42866A]/15 text-xs text-[#42866A] font-medium"
                      >
                        <p>{pillar.deepDive}</p>
                      </motion.div>
                    )}
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-3 transition-transform ${
                      isActive ? 'text-[#173D32] rotate-90' : 'text-[#42866A]/40'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Connected Workflow Visual Card */}
          <div className="lg:col-span-6 sticky top-24">
            <Card className="bg-white/95 border-[#42866A]/25 rounded-2xl p-6 sm:p-7 shadow-md overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#42866A]/15 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#173D32] flex items-center justify-center text-[#E3AD58]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#173D32]">
                      Integrated Intelligence Pipeline
                    </h4>
                    <p className="text-[11px] text-[#42866A]">
                      Connected Workflow Demonstration
                    </p>
                  </div>
                </div>
                <Badge variant="amber">Simulated Workflow</Badge>
              </div>

              {/* Connected Visual Pipeline Steps */}
              <div className="py-6 space-y-4">
                {solutionPillars.map((step, idx) => {
                  const isCurrent = activeStep === step.id;
                  const isPast = activeStep > step.id;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="relative">
                      {/* Vertical connecting line */}
                      {idx < solutionPillars.length - 1 && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-7 -ml-[1px] transition-colors duration-300 ${
                            isPast ? 'bg-[#173D32]' : 'bg-[#DDEBE2]'
                          }`}
                        />
                      )}

                      <div
                        onClick={() => setActiveStep(step.id)}
                        className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                          isCurrent
                            ? 'bg-[#DDEBE2]/60 ring-1 ring-[#173D32]/20'
                            : 'hover:bg-[#F8F7F2]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isCurrent
                              ? 'bg-[#173D32] text-white shadow-xs scale-105'
                              : isPast
                              ? 'bg-[#42866A] text-white'
                              : 'bg-[#DDEBE2] text-[#42866A]'
                          }`}
                        >
                          {isPast ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent ? 'text-[#173D32]' : 'text-[#1B2923]/80'
                              }`}
                            >
                              0{idx + 1}. {step.workflowNode}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-[#E3AD58] uppercase bg-[#173D32] px-2 py-0.5 rounded-full">
                                Active Focus
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#1B2923]/60 truncate mt-0.5">
                            {step.tagline}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Telemetry / Pipeline Output Preview */}
              <div className="mt-2 p-4 rounded-xl bg-[#173D32] text-white border border-[#42866A]/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3AD58]">
                    Pipeline Stage Output Preview
                  </span>
                  <span className="text-[10px] text-[#DDEBE2]/70 font-mono">
                    Step {activeStep + 1} of 5
                  </span>
                </div>
                <p className="text-xs font-mono text-[#DDEBE2] leading-relaxed">
                  &gt; {activePillar.systemOutput}
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#DDEBE2]/80">
                  <span>Role: {activePillar.badge}</span>
                  <span className="text-[#E3AD58] font-medium flex items-center gap-1">
                    Verified State <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default SolutionSection;
