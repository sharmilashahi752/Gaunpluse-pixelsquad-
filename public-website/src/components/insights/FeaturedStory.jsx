import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

/**
 * Featured Story Section
 * Visually prominent editorial centerpiece in a two-column layout:
 * - Left: Large landscape infrastructure photograph (Khola River Motor Bridge)
 * - Right: Impactful headline, narrative summary, metadata, and prominent CTA button.
 */
export function FeaturedStory({ onOpenArticle }) {
  return (
    <section aria-labelledby="featured-story-heading" className="text-left">
      <div className="rounded-[8px] border border-stone-200 bg-white p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Landscape Photograph */}
          <div className="lg:col-span-6 overflow-hidden rounded-[6px] border border-stone-200/80 bg-stone-100 shadow-2xs">
            <img
              src="/images/issues/bridge-scour.png"
              alt="Khola River Motor Bridge Pier Scour Inspection"
              className="w-full h-64 sm:h-80 lg:h-[380px] object-cover hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

          {/* Right Column: Editorial Story Details */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            <h2
              id="featured-story-heading"
              className="scroll-mt-24 text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#173D32] tracking-tight leading-snug"
            >
              The Impact of Road &amp; Bridge Failures on Rural Emergency Care
            </h2>

            <p className="text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal max-w-2xl">
              When single-point river crossings suffer monsoon scouring, transit times to emergency
              clinics multiply by nearly 3x. Our empirical network simulation models how foundation
              fissures on Khola River Motor Bridge isolate 95 households, forcing hand-carried
              stretcher detours over upper suspension footbridges and exposing critical bottlenecks
              in municipal capital allocation.
            </p>

            <div className="flex items-center gap-4 text-xs text-[#64748B] pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#42866A]" />
                October 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#42866A]" />
                5 min read
              </span>
            </div>

            <div className="pt-2">
              <Link
                to="/insights/healthcare-accessibility"
                onClick={() => onOpenArticle && onOpenArticle('healthcare-accessibility')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[6px] bg-[#173D32] text-white text-sm font-semibold hover:bg-[#438B70] transition-colors shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173D32]/40"
              >
                <span>Read Full Research Brief</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedStory;
