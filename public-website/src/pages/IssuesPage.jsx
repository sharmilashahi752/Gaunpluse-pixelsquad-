import React, { useState, useMemo } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import Container from '../components/ui/Container';
import ScrollReveal from '../components/ui/ScrollReveal';
import { ISSUES } from '../data/demoVillage';
import { getIssueImage, CATEGORY_TABS, CATEGORY_LABELS } from '../utils/issueImages';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function IssuesPage() {
  useDocumentTitle('Community Issues & Progress — GaunPulse');

  const [searchParams, setSearchParams] = useSearchParams();

  // Filter & Search State
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Redirect legacy ?issue= or ?id= to dedicated /issues/:id article page
  const activeIssueId = searchParams.get('issue') || searchParams.get('id');

  // Category switch handler
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryId);
    }
    setSearchParams(newParams);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSeverityFilter('all');
    setVerificationFilter('all');
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
  };

  // Filter issues based on category, severity, verification, and search query
  const filteredIssues = useMemo(() => {
    return ISSUES.filter((issue) => {
      // Category tab filter
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) {
        return false;
      }

      // Severity dropdown filter
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }

      // Verification dropdown filter
      if (
        verificationFilter !== 'all' &&
        issue.verificationStatus !== verificationFilter
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchSummary = (issue.summary || '').toLowerCase().includes(q);
        const matchDesc = issue.description.toLowerCase().includes(q);
        const matchLocation = issue.locationLabel.toLowerCase().includes(q);
        const matchAsset = issue.infrastructureName.toLowerCase().includes(q);
        const matchReporter = (issue.reportedBy || '').toLowerCase().includes(q);

        if (
          !matchTitle &&
          !matchSummary &&
          !matchDesc &&
          !matchLocation &&
          !matchAsset &&
          !matchReporter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, severityFilter, verificationFilter, searchQuery]);

  // Handle redirect after all hooks have been declared
  if (activeIssueId) {
    return <Navigate to={`/issues/${activeIssueId}`} replace />;
  }

  // Featured Lead Issue and Secondary Issues
  const featuredIssue = filteredIssues[0] || null;
  const sideIssues = filteredIssues.slice(1, 4);
  const additionalIssues = filteredIssues.slice(4);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    severityFilter !== 'all' ||
    verificationFilter !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="bg-white min-h-screen text-[#1B2923]">
      <Container className="py-6 sm:py-10">
        <div className="max-w-[1240px] mx-auto space-y-8">
          {/* =========================================================================
              1. NEWSPAPER EDITORIAL MASTHEAD & HEADING
              ========================================================================= */}
          <header className="border-b border-[#E5E7EB] pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold tracking-wider text-[#485650] uppercase pb-2.5 mb-3 border-b border-[#E5E7EB]/70">
              <span>Civic Infrastructure Dispatch • Nepal Community Edition</span>
              <span>Updated Real-Time Telemetry & Progress</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight leading-tight">
                  Community Issues & Progress
                </h1>
                <p className="text-xs sm:text-sm text-[#485650] mt-1.5 max-w-2xl leading-relaxed">
                  Grassroots rural infrastructure reporting, field verifications, and municipal response tracking modeled for civic accountability.
                </p>
              </div>

              {/* Minimal Search Input */}
              <div className="w-full md:w-80 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#485650] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search issues, assets, or locations..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] text-[#173D32] placeholder-[#485650]/70 focus:bg-white focus:border-[#438A70] focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#485650] hover:text-[#173D32]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* =========================================================================
              2. HORIZONTAL CATEGORY NAVIGATION BAR (The Public Today Style)
              ========================================================================= */}
          <div className="border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
            <nav
              aria-label="Issue categories"
              className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {CATEGORY_TABS.map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleCategorySelect(tab.id)}
                    className={`relative pb-3 text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#173D32]'
                        : 'text-[#485650] hover:text-[#173D32]'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#173D32]"
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Filter Toggle and Dropdowns */}
            <div className="flex items-center gap-2 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border text-xs font-semibold transition-colors cursor-pointer ${
                  isFilterOpen || severityFilter !== 'all' || verificationFilter !== 'all'
                    ? 'bg-[#173D32] text-white border-[#173D32]'
                    : 'bg-white text-[#485650] border-[#E5E7EB] hover:border-[#438A70]'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Filters</span>
                {(severityFilter !== 'all' || verificationFilter !== 'all') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3AD58]" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#438A70] hover:text-[#173D32] font-semibold underline px-1 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Minimal Expandable Secondary Filters */}
          {isFilterOpen && (
            <div className="p-4 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB] flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#173D32]">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-[4px] text-[#173D32] focus:outline-none focus:border-[#438A70]"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Alert</option>
                  <option value="warning">Warning / Elevated Risk</option>
                  <option value="low">Low Priority / Monitoring</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#173D32]">Verification:</span>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-[4px] text-[#173D32] focus:outline-none focus:border-[#438A70]"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Field Verified</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>

              <span className="ml-auto text-xs text-[#485650]">
                Showing <strong>{filteredIssues.length}</strong> reports
              </span>
            </div>
          )}

          {/* =========================================================================
              3. NEWSPAPER LEAD SECTION (Featured on Left, Vertical List on Right)
              ========================================================================= */}
          {featuredIssue ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Featured Main Issue (7 cols ~58%) */}
              <ScrollReveal className="lg:col-span-7 space-y-3.5 text-left">
                <Link
                  to={`/issues/${featuredIssue.id}`}
                  className="group block overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-stone-100 aspect-[16/10]"
                >
                  <img
                    src={getIssueImage(featuredIssue)}
                    alt={featuredIssue.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </Link>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#438A70]">
                      {CATEGORY_LABELS[featuredIssue.category] || featuredIssue.category}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        featuredIssue.severity === 'critical'
                          ? 'text-[#D45F53]'
                          : 'text-[#E3AD58]'
                      }`}
                    >
                      {featuredIssue.severityLabel}
                    </span>
                  </div>

                  <Link to={`/issues/${featuredIssue.id}`} className="group">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#173D32] group-hover:text-[#438A70] transition-colors leading-snug">
                      {featuredIssue.title}
                    </h2>
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#485650] mt-2">
                    <span className="flex items-center gap-1 text-[#173D32] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#438A70]" />
                      <span>{featuredIssue.locationLabel}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{featuredIssue.reportedAt}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#438A70] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{featuredIssue.verificationLabel}</span>
                    </span>
                  </div>

                  <p className="text-sm text-[#485650] leading-relaxed mt-2.5 font-normal line-clamp-3">
                    {featuredIssue.description}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={`/issues/${featuredIssue.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#173D32] hover:text-[#438A70] transition-colors"
                    >
                      <span>Read Full Report & Telemetry</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right Column: Vertical List of Secondary Issues (5 cols ~42%) */}
              <ScrollReveal delay={0.15} className="lg:col-span-5 text-left border-t lg:border-t-0 lg:border-l lg:border-[#E5E7EB] pt-6 lg:pt-0 lg:pl-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#173D32] pb-2 mb-4 border-b border-[#E5E7EB]">
                  Related Ward Incidents
                </h3>

                <div className="divide-y divide-[#E5E7EB]">
                  {sideIssues.length > 0 ? (
                    sideIssues.map((issue) => (
                      <article key={issue.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3.5">
                          {/* Text Info */}
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#438A70] block">
                              {CATEGORY_LABELS[issue.category] || issue.category}
                            </span>

                            <Link to={`/issues/${issue.id}`} className="group">
                              <h4 className="text-sm sm:text-[15px] font-bold text-[#173D32] group-hover:text-[#438A70] transition-colors leading-snug line-clamp-2">
                                {issue.title}
                              </h4>
                            </Link>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#485650] pt-0.5">
                              <span>{issue.locationLabel.split(',')[0]}</span>
                              <span className="text-stone-300">•</span>
                              <span
                                className={`font-semibold ${
                                  issue.severity === 'critical'
                                    ? 'text-[#D45F53]'
                                    : 'text-[#E3AD58]'
                                }`}
                              >
                                {issue.severityLabel}
                              </span>
                            </div>
                          </div>

                          {/* Right-aligned Thumbnail */}
                          <Link
                            to={`/issues/${issue.id}`}
                            className="group w-24 h-20 sm:w-28 sm:h-20 rounded-[4px] overflow-hidden bg-stone-100 border border-[#E5E7EB] shrink-0"
                          >
                            <img
                              src={getIssueImage(issue)}
                              alt={issue.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </Link>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="py-6 text-xs text-[#485650] italic">
                      No additional issues match current filter selection.
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          ) : (
            /* Empty State */
            <div className="py-16 text-center border border-dashed border-[#E5E7EB] rounded-[6px]">
              <h3 className="text-base font-bold text-[#173D32] mb-1">
                No Community Reports Match Your Filters
              </h3>
              <p className="text-xs text-[#485650] max-w-sm mx-auto mb-4 leading-relaxed">
                Try searching for another keyword or reset the category and status filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold bg-[#173D32] text-white rounded-[4px] hover:bg-[#122F26] transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* =========================================================================
              4. ADDITIONAL ISSUES EDITORIAL GRID (Below Featured)
              ========================================================================= */}
          {additionalIssues.length > 0 && (
            <section className="pt-8 mt-10 border-t border-[#E5E7EB] text-left">
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E5E7EB]">
                <h3 className="text-base sm:text-lg font-bold text-[#173D32] tracking-tight">
                  Additional Ward Observations
                </h3>
                <span className="text-xs text-[#485650]">
                  {additionalIssues.length} more reports
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {additionalIssues.map((issue) => (
                  <article key={issue.id} className="space-y-2.5">
                    <Link
                      to={`/issues/${issue.id}`}
                      className="group block aspect-[16/10] rounded-[6px] overflow-hidden bg-stone-100 border border-[#E5E7EB]"
                    >
                      <img
                        src={getIssueImage(issue)}
                        alt={issue.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </Link>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#438A70] block mb-1">
                        {CATEGORY_LABELS[issue.category] || issue.category}
                      </span>

                      <Link to={`/issues/${issue.id}`} className="group">
                        <h4 className="text-[15px] font-bold text-[#173D32] group-hover:text-[#438A70] transition-colors leading-snug line-clamp-2">
                          {issue.title}
                        </h4>
                      </Link>

                      <div className="flex items-center gap-2 text-[11px] text-[#485650] mt-1.5">
                        <span>{issue.reportedAt}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-[#438A70] font-semibold">
                          {issue.verificationLabel}
                        </span>
                      </div>

                      <p className="text-xs text-[#485650] leading-relaxed mt-1.5 line-clamp-2">
                        {issue.summary || issue.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </div>
  );
}

export default IssuesPage;
