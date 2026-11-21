import React from 'react';
import {
  FilePenLine,
  MapPinned,
  Route,
  GitCompare,
  ClipboardCheck,
} from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      id: 'report',
      title: 'Report',
      icon: FilePenLine,
      description: 'Identify and report infrastructure problems.',
    },
    {
      id: 'verify',
      title: 'Verify',
      icon: MapPinned,
      description: 'Review reports and map affected locations.',
    },
    {
      id: 'simulate',
      title: 'Simulate',
      icon: Route,
      description: 'Understand disruptions to essential routes.',
    },
    {
      id: 'compare',
      title: 'Compare',
      icon: GitCompare,
      description: 'Evaluate possible repairs and responses.',
    },
    {
      id: 'act',
      title: 'Act',
      icon: ClipboardCheck,
      description: 'Plan actions and track community progress.',
    },
  ];

  return (
    <section
      id="how-it-works"
      tabIndex="-1"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 sm:scroll-mt-24 pt-[70px] pb-[72px] bg-white border-t border-stone-200/80 relative outline-hidden"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-11 sm:mb-12">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-[#173D32] mb-2.5">
            HOW IT WORKS
          </p>

          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-[28px] lg:text-[32px] font-semibold tracking-tight text-[#173D32] leading-tight"
          >
            From a problem to a solution
          </h2>

          <p className="mt-3 text-sm sm:text-[15px] text-[#1B2923]/70 font-normal leading-relaxed max-w-xl mx-auto">
            From identifying an infrastructure problem to understanding its impact and planning a response.
          </p>
        </div>

        {/* 5-Step Balanced Editorial Flow */}
        <div className="how-it-works-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.id} className="how-it-works-step">
                {/* 1. Horizontally centered outline icon (22px, no bg, dark forest green) */}
                <div className="flex items-center justify-center">
                  <Icon
                    className="w-[22px] h-[22px] text-[#173D32]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>

                {/* 2. Step title without number (14px from icon, strictly on one line) */}
                <h3 className="mt-[14px] text-sm sm:text-[15px] font-semibold text-[#173D32] tracking-tight whitespace-nowrap text-center">
                  {step.title}
                </h3>

                {/* 3. Concise description (10px from title, balanced 2-line wrap) */}
                <p className="mt-[10px] text-[12.5px] leading-[1.5] text-stone-600 font-normal max-w-[200px] sm:max-w-[210px] mx-auto text-center">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
