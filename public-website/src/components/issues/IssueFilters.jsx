import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Filter and Search Controls for Community Issues
 */
export function IssueFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  severityFilter,
  onSeverityChange,
  verificationFilter,
  onVerificationChange,
  onResetFilters,
  totalCount,
  filteredCount,
}) {
  const isFiltered =
    Boolean(searchQuery) ||
    categoryFilter !== 'all' ||
    severityFilter !== 'all' ||
    verificationFilter !== 'all';

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'bridge', label: 'Bridges' },
    { id: 'road', label: 'Roads & Trails' },
    { id: 'school', label: 'School Access' },
    { id: 'health_post', label: 'Health Clinics' },
  ];

  const severities = [
    { id: 'all', label: 'All Severities' },
    { id: 'critical', label: 'Critical Alert' },
    { id: 'warning', label: 'Monitored Warning' },
    { id: 'low', label: 'Low Priority' },
  ];

  const verifications = [
    { id: 'all', label: 'All Statuses' },
    { id: 'verified', label: 'Field Verified' },
    { id: 'under_review', label: 'Under Review' },
  ];

  return (
    <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: Search Input + Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#42866A]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by keyword, asset, road, or location..."
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
            <strong className="text-[#173D32]">{totalCount}</strong> reports
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

      {/* Bottom Row: Filter Dropdowns / Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#42866A]/15">
        {/* Category Filter */}
        <div>
          <label
            htmlFor="category-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#42866A] mb-1"
          >
            Infrastructure Category
          </label>
          <select
            id="category-select"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs font-medium bg-[#F8F7F2] border border-[#42866A]/25 rounded-lg px-3 py-1.5 text-[#173D32] focus:outline-none focus:ring-2 focus:ring-[#42866A]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label
            htmlFor="severity-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#42866A] mb-1"
          >
            Issue Severity
          </label>
          <select
            id="severity-select"
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full text-xs font-medium bg-[#F8F7F2] border border-[#42866A]/25 rounded-lg px-3 py-1.5 text-[#173D32] focus:outline-none focus:ring-2 focus:ring-[#42866A]"
          >
            {severities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Status Filter */}
        <div>
          <label
            htmlFor="verification-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#42866A] mb-1"
          >
            Verification State
          </label>
          <select
            id="verification-select"
            value={verificationFilter}
            onChange={(e) => onVerificationChange(e.target.value)}
            className="w-full text-xs font-medium bg-[#F8F7F2] border border-[#42866A]/25 rounded-lg px-3 py-1.5 text-[#173D32] focus:outline-none focus:ring-2 focus:ring-[#42866A]"
          >
            {verifications.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default IssueFilters;
