import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import IssueCard from '../components/issues/IssueCard';
import IssueFilters from '../components/issues/IssueFilters';
import IssueDetails from '../components/issues/IssueDetails';
import { ISSUES } from '../data/demoVillage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function IssuesPage() {
  useDocumentTitle('Community Issues & Progress — GaunPulse');

  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Selected issue for inspector modal derived directly from URL search params
  const activeIssueId = searchParams.get('issue') || searchParams.get('id');
  const selectedIssue = useMemo(() => {
    if (!activeIssueId) return null;
    return ISSUES.find((i) => i.id === activeIssueId) || null;
  }, [activeIssueId]);

  // Handle modal close
  const handleCloseDetails = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('issue');
    newParams.delete('id');
    setSearchParams(newParams, { replace: true });
  };

  // Handle modal open
  const handleSelectIssue = (issue) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('issue', issue.id);
    setSearchParams(newParams);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setVerificationFilter('all');
  };

  // Filtered issues calculation
  const filteredIssues = useMemo(() => {
    return ISSUES.filter((issue) => {
      // Category filter
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }

      // Verification filter
      if (
        verificationFilter !== 'all' &&
        issue.verificationStatus !== verificationFilter
      ) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = issue.title.toLowerCase().includes(query);
        const matchSummary = (issue.summary || '').toLowerCase().includes(query);
        const matchDesc = issue.description.toLowerCase().includes(query);
        const matchLocation = issue.locationLabel.toLowerCase().includes(query);
        const matchAsset = issue.infrastructureName.toLowerCase().includes(query);
        const matchReporter = (issue.reportedBy || '').toLowerCase().includes(query);

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
  }, [searchQuery, categoryFilter, severityFilter, verificationFilter]);

  // Aggregate metrics for summary counters
  const metrics = useMemo(() => {
    const total = ISSUES.length;
    const verified = ISSUES.filter((i) => i.verificationStatus === 'verified').length;
    const underReview = ISSUES.filter((i) => i.verificationStatus === 'under_review').length;
    const critical = ISSUES.filter((i) => i.severity === 'critical').length;
    return { total, verified, underReview, critical };
  }, []);

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-8">
        {/* 1. Public Educational Introduction */}
        <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">Demonstration Data — Fictional Reports</Badge>
            <Badge variant="neutral">Civic Accountability Showcase</Badge>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
              Community Issues & Progress
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              Explore infrastructure concerns, understand their status, and see how communities
              and local decision-makers could track progress toward solutions.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 text-xs text-[#42866A] flex flex-wrap items-center gap-4">
            <span>
              💡 <strong>Civic Context:</strong> In rural municipalities, timely reporting and field verification ensure that small scouring or shoulder erosion is addressed before it isolates an entire valley.
            </span>
          </div>
        </div>

        {/* 2. Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 border-[#42866A]/20">
            <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32] shrink-0">
              <FileText className="w-5 h-5 text-[#173D32]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#173D32]">
                {metrics.total}
              </p>
              <p className="text-xs font-semibold text-[#42866A]">
                Sample Reports
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 border-[#42866A]/20">
            <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#42866A]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#173D32]">
                {metrics.verified}
              </p>
              <p className="text-xs font-semibold text-[#42866A]">
                Field Verified
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 border-[#42866A]/20">
            <div className="w-10 h-10 rounded-xl bg-[#E3AD58]/15 flex items-center justify-center text-[#8F5E16] shrink-0">
              <Clock className="w-5 h-5 text-[#8F5E16]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#8F5E16]">
                {metrics.underReview}
              </p>
              <p className="text-xs font-semibold text-[#8F5E16]">
                Under Review
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 border-[#D45F53]/30">
            <div className="w-10 h-10 rounded-xl bg-[#D45F53]/15 flex items-center justify-center text-[#D45F53] shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#D45F53]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#D45F53]">
                {metrics.critical}
              </p>
              <p className="text-xs font-semibold text-[#D45F53]">
                Critical Alert
              </p>
            </div>
          </Card>
        </div>

        {/* 3. Search & Filter Bar */}
        <IssueFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          verificationFilter={verificationFilter}
          onVerificationChange={setVerificationFilter}
          onResetFilters={handleResetFilters}
          totalCount={ISSUES.length}
          filteredCount={filteredIssues.length}
        />

        {/* 4. Issue Card Grid or Empty State */}
        {filteredIssues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onSelect={handleSelectIssue}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 px-4 border-dashed border-[#42866A]/30">
            <div className="w-12 h-12 rounded-full bg-[#DDEBE2] mx-auto flex items-center justify-center text-[#42866A] mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#173D32]">
              No demonstration reports match your criteria
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#1B2923]/70 max-w-sm mx-auto">
              Try adjusting your search keywords or clearing your active filters to see all available demonstration issues.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold bg-[#173D32] text-white rounded-lg hover:bg-[#122F26] transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </Card>
        )}

        {/* 5. Issue Detail Inspector Modal */}
        {selectedIssue && (
          <IssueDetails
            issue={selectedIssue}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </Container>
  );
}

export default IssuesPage;
