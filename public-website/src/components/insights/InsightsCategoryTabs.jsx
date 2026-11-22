import React from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Insights' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'community', label: 'Community Impact' },
  { id: 'data', label: 'Data Analysis' },
  { id: 'policy', label: 'Policy & Planning' },
];

/**
 * Category Navigation Tabs Component
 * Positioned below the Key Infrastructure Insights metrics:
 * Clean horizontal tab navigation with active underline indicator:
 * All Insights | Infrastructure | Community Impact | Data Analysis | Policy & Planning
 */
export function InsightsCategoryTabs({ activeCategory, onCategoryChange }) {
  return (
    <nav
      aria-label="Insights category filter navigation"
      className="border-b border-[#E2EBE5] text-left pt-2"
    >
      <div
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px touch-pan-x"
        role="tablist"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(cat.id)}
              className={`py-3 px-3.5 sm:px-5 text-sm sm:text-base font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#173D32] ${
                isActive
                  ? 'border-[#173D32] text-[#173D32]'
                  : 'border-transparent text-[#64748B] hover:text-[#173D32] hover:border-stone-300'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default InsightsCategoryTabs;
