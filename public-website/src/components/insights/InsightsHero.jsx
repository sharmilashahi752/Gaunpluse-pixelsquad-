import React from 'react';
import { ArrowDown, BookOpen } from 'lucide-react';

/**
 * Clean & Minimal Insights Hero Section
 * - Plain white background without borders or rounded cards
 * - Centered title (36–40px desktop, 28–30px tablet, 25–28px mobile)
 * - Subtitle (~16px)
 * - Compact action buttons (14px font, 12px vertical padding, 20px horizontal padding, 16px icons, 6–8px corners)
 */
export function InsightsHero() {
  const handleScrollTo = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      aria-labelledby="insights-hero-heading"
      className="bg-white text-center py-6 sm:py-8 lg:py-10 max-w-3xl mx-auto"
    >
      {/* Main Title: 36–40px desktop, 28–30px tablet, 25–28px mobile */}
      <h1
        id="insights-hero-heading"
        className="text-[26px] sm:text-[30px] lg:text-[38px] font-bold text-[#173D32] tracking-tight leading-[1.25]"
      >
        Infrastructure Insights &amp; Data
      </h1>

      {/* Subtitle: ~16px */}
      <p className="mt-3 sm:mt-4 text-[15px] sm:text-[16px] text-[#1B2923]/75 max-w-2xl mx-auto leading-relaxed font-normal">
        Empirical research, network simulations, and community hazard tracking across
        rural Nepali settlements.
      </p>

      {/* Action Buttons: 14px font, 12px vertical, 20px horizontal, 16px icon, 6-8px corners */}
      <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => handleScrollTo('glance-heading')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-[6px] bg-[#173D32] text-white text-sm font-semibold hover:bg-[#438B70] transition-colors shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173D32]/40"
        >
          <span>Explore Data</span>
          <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleScrollTo('featured-story-heading')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-[6px] border border-[#173D32] bg-white text-[#173D32] text-sm font-semibold hover:bg-[#F7FAF8] transition-colors shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173D32]/40"
        >
          <BookOpen className="w-4 h-4 text-[#438B70]" />
          <span>Read Research</span>
        </button>
      </div>
    </section>
  );
}

export default InsightsHero;
