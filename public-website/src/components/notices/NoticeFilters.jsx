import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Filter and Search Controls for Community Notices
 */
export function NoticeFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onResetFilters,
  totalCount,
  filteredCount,
}) {
  const isFiltered = Boolean(searchQuery) || categoryFilter !== 'all';

  const categories = [
    { id: 'all', label: 'All Notices' },
    { id: 'advisory', label: 'Precautionary Advisories' },
    { id: 'maintenance', label: 'Trail Maintenance' },
    { id: 'access', label: 'School Access' },
    { id: 'technical', label: 'Technical Bulletins' },
  ];

  return (
    <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#42866A]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notices by keyword, asset, or location..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-[#F8F7F2] border border-[#42866A]/25 rounded-xl text-[#173D32] placeholder-[#1B2923]/40 focus:outline-none focus:ring-2 focus:ring-[#42866A] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#1B2923]/40 hover:text-[#173D32]"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-semibold text-[#1B2923]/70">
            Showing <strong className="text-[#173D32]">{filteredCount}</strong> of{' '}
            <strong className="text-[#173D32]">{totalCount}</strong> notices
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#D45F53] hover:bg-[#D45F53]/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#42866A]/15 text-xs">
        {categories.map((c) => {
          const isActive = categoryFilter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoryChange(c.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#173D32] text-white shadow-xs'
                  : 'bg-[#F8F7F2] text-[#1B2923]/70 hover:bg-[#DDEBE2] hover:text-[#173D32]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NoticeFilters;
