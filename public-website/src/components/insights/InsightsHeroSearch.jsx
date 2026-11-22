import React from 'react';
import { Search, X } from 'lucide-react';

const TOPIC_TABS = [
  { id: 'all', label: 'Overview' },
  { id: 'bridges', label: 'Bridges' },
  { id: 'roads', label: 'Roads & Trails' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'access', label: 'Community Access' },
];

/**
 * Insights Hero and Topic Navigation Section
 * Focuses visual hierarchy on the main title, concise description,
 * direct search input, and clean underlined category navigation.
 */
export function InsightsHeroSearch({
  searchQuery,
  onSearchChange,
  activeTopic,
  onTopicChange,
  totalResultsCount,
}) {
  return (
    <section aria-labelledby="insights-hero-heading" className="space-y-5 text-left">
      {/* 1. Main Title & Short Description */}
      <div className="space-y-2.5">
        <h1
          id="insights-hero-heading"
          className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#173D32] tracking-tight leading-[1.15]"
        >
          Explore Village Infrastructure Data
        </h1>
        <p className="text-base text-[#1B2923]/75 max-w-2xl leading-relaxed font-normal">
          Empirical research, network simulations, and community hazard tracking across rural
          Nepalese settlements.
        </p>
      </div>

      {/* 2. Prominent Search Bar Directly Below Description */}
      <div className="space-y-2">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search infrastructure data, charts, or research..."
            aria-label="Search infrastructure data, charts, or research"
            className="w-full pl-10 pr-10 py-2.5 text-sm text-[#1B2923] bg-white border border-stone-300 rounded-[4px] shadow-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#173D32] focus:border-[#173D32] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery.trim() !== '' && (
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span>
              Showing results matching &ldquo;<strong>{searchQuery}</strong>&rdquo;
              {totalResultsCount !== undefined ? ` (${totalResultsCount} found)` : ''}
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-[#173D32] font-semibold underline hover:text-[#42866A]"
            >
              Reset search
            </button>
          </div>
        )}
      </div>

      {/* 3. Category Navigation with Clean Underline for Active Tab */}
      <div className="border-b border-stone-200">
        <nav
          className="flex items-center gap-6 overflow-x-auto no-scrollbar -mb-px"
          aria-label="Infrastructure Topics"
        >
          {TOPIC_TABS.map((tab) => {
            const isActive = activeTopic === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTopicChange(tab.id)}
                className={`pb-2.5 text-sm whitespace-nowrap transition-colors border-b-2 font-medium ${
                  isActive
                    ? 'border-[#173D32] text-[#173D32] font-semibold'
                    : 'border-transparent text-[#64748B] hover:text-[#173D32]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}

export default InsightsHeroSearch;
