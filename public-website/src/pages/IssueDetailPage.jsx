import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Share2,
  Check,
  Compass,
} from 'lucide-react';
import CommunityFeedback from '../components/issues/CommunityFeedback';
import { ISSUES } from '../data/demoVillage';
import { getIssueImage, CATEGORY_LABELS } from '../utils/issueImages';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function IssueDetailPage() {
  const { id, slug } = useParams();
  const [copied, setCopied] = useState(false);

  const targetId = id || slug;
  const issue = ISSUES.find((i) => i.id === targetId || i.slug === targetId);

  useDocumentTitle(
    issue
      ? `${issue.title} — GaunPulse Community Report`
      : 'Report Not Found — GaunPulse'
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: issue?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!issue) {
    return (
      <article className="bg-white min-h-[60vh] text-[#1B2923] flex items-center">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 text-center w-full">
          <h1 className="text-2xl font-bold text-[#173D32] mb-2">
            Report Not Found
          </h1>
          <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
            The infrastructure report you requested ({targetId}) does not exist or has been archived.
          </p>
          <Link
            to="/issues"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-[#173D32] text-white text-xs font-medium hover:bg-[#122F26] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Community Issues</span>
          </Link>
        </div>
      </article>
    );
  }

  const categoryName = CATEGORY_LABELS[issue.category] || issue.category?.toUpperCase() || 'INFRASTRUCTURE';

  return (
    <article className="bg-white min-h-screen text-[#1B2923]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Navigation & Share Row */}
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E5E7EB]">
          <Link
            to="/issues"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#173D32] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Community Issues</span>
          </Link>

          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <span className="font-mono text-[11px] text-[#64748B]/70">
              Ref: {issue.id}
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-[#64748B] hover:text-[#173D32] transition-colors cursor-pointer"
              title="Share this report"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#173D32]" />
                  <span className="text-[#173D32] font-medium">Link copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-6">
          <div className="mb-2">
            <span className="text-xs font-semibold text-[#438A70] tracking-wide uppercase">
              {categoryName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-[30px] font-bold text-[#173D32] leading-snug tracking-tight mb-3">
            {issue.title}
          </h1>

          <p className="text-base sm:text-lg text-[#485650] leading-relaxed font-normal mb-5">
            {issue.summary || issue.description}
          </p>

          {/* Clean Editorial Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B] pb-4 border-b border-[#E5E7EB]">
            <span className="font-medium text-[#173D32]">{issue.locationLabel}</span>
            <span>•</span>
            <span>Reported: {issue.reportedAt}</span>
            <span>•</span>
            <span className="font-medium text-[#173D32]">{issue.verificationLabel}</span>
            {issue.progressLabel && (
              <>
                <span>•</span>
                <span>{issue.progressLabel}</span>
              </>
            )}
          </div>
        </header>

        {/* Main Image & Caption */}
        <figure className="mb-8">
          <div className="w-full aspect-[16/9] sm:aspect-[21/10] max-h-[460px] overflow-hidden rounded-[4px] border border-[#E5E7EB] bg-stone-50">
            <img
              src={getIssueImage(issue)}
              alt={issue.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <figcaption className="text-xs text-[#64748B] mt-2.5 leading-normal italic">
            Field reference photograph: Illustrative representation of {issue.infrastructureName} topology at {issue.locationLabel} (demonstration data).
          </figcaption>
        </figure>

        {/* Field Observations */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-3">
            Field Observation
          </h2>
          <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed mb-4">
            {issue.description}
          </p>
          {issue.simulatedImpact && (
            <div className="border-l-2 border-[#173D32] pl-4 py-1 my-4">
              <p className="text-xs uppercase font-semibold tracking-wider text-[#64748B] mb-0.5">
                Community Mobility Impact
              </p>
              <p className="text-sm text-[#2D3748] leading-relaxed">
                {issue.simulatedImpact}
              </p>
            </div>
          )}
        </section>

        {/* Infrastructure Details (Alternating white and #F7F8FA rows) */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-4">
            Infrastructure Details
          </h2>
          <div className="border-t border-b border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 px-3 bg-white">
              <span className="font-semibold text-[#173D32]">Target Asset</span>
              <span className="sm:col-span-2 text-[#2D3748]">{issue.infrastructureName}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 px-3 bg-[#F7F8FA]">
              <span className="font-semibold text-[#173D32]">Classification</span>
              <span className="sm:col-span-2 text-[#2D3748]">
                {issue.targetType ? issue.targetType.toUpperCase() : 'INFRASTRUCTURE'} ({issue.infrastructureId || issue.edgeId || issue.targetId})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 px-3 bg-white">
              <span className="font-semibold text-[#173D32]">Coordinates</span>
              <span className="sm:col-span-2 text-[#2D3748] font-mono text-xs">
                {issue.coordinates ? `${issue.coordinates[0]}° N, ${issue.coordinates[1]}° E` : 'Registered in spatial directory'}
              </span>
            </div>
            {issue.evidence?.measurement && (
              <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 px-3 bg-[#F7F8FA]">
                <span className="font-semibold text-[#173D32]">Measurement / Condition</span>
                <span className="sm:col-span-2 text-[#2D3748]">{issue.evidence.measurement}</span>
              </div>
            )}
            {issue.evidence?.citizenNotes && (
              <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 px-3 bg-white">
                <span className="font-semibold text-[#173D32]">Field Notes</span>
                <span className="sm:col-span-2 text-[#2D3748]">{issue.evidence.citizenNotes}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 px-3 bg-[#F7F8FA]">
              <span className="font-semibold text-[#173D32]">Reporting Source</span>
              <span className="sm:col-span-2 text-[#2D3748]">
                {issue.reportedBy} ({issue.sourceType})
              </span>
            </div>
          </div>
        </section>

        {/* Community Impacts & Proposed Actions (2-column layout on desktop) */}
        {(issue.consequences?.length > 0 || issue.proposedActions?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {issue.consequences && issue.consequences.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-3">
                  Community Impacts
                </h3>
                <ul className="space-y-2 text-sm text-[#2D3748]">
                  {issue.consequences.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#64748B] mt-0.5">•</span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {issue.proposedActions && issue.proposedActions.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-3">
                  Proposed Actions
                </h3>
                <ul className="space-y-2 text-sm text-[#2D3748]">
                  {issue.proposedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#64748B] mt-0.5">•</span>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Progress Timeline (Clean vertical timeline with dot on line) */}
        {issue.progressHistory && issue.progressHistory.length > 0 && (
          <section className="mb-8 pt-4 border-t border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-6">
              Progress Timeline
            </h3>
            <div className="relative pl-6 space-y-6 border-l border-[#E5E7EB] ml-3">
              {issue.progressHistory.map((step, idx) => {
                const isCurrent = step.status === 'current';
                const isCompleted = step.status === 'completed';

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
                    className="relative"
                  >
                    {/* Vertical line dot */}
                    <span
                      className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-[#173D32] border-[#173D32] ring-4 ring-[#173D32]/10'
                          : isCompleted
                          ? 'bg-[#485650] border-[#485650]'
                          : 'bg-white border-[#CBD5E1]'
                      }`}
                    />

                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 mb-1">
                      <h4
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-[#173D32]' : 'text-[#2D3748]'
                        }`}
                      >
                        {step.stage}
                        {isCurrent && (
                          <span className="ml-2 text-[11px] font-medium text-[#173D32] bg-[#E8F0EC] px-1.5 py-0.5 rounded-[3px]">
                            Current Stage
                          </span>
                        )}
                      </h4>
                      <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                        <span>{step.date}</span>
                        <span>•</span>
                        <span>{step.actor}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#485650] leading-relaxed">
                      {step.note}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Interactive Spatial Exploration & Simulation Bar */}
        <section className="my-8 py-3.5 px-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div>
            <h4 className="text-xs font-semibold text-[#173D32]">
              Interactive Spatial Exploration
            </h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Inspect this asset on the network map or simulate alternate route delays.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/map?asset=${issue.infrastructureId || issue.edgeId || issue.targetId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-medium transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>View on Map</span>
            </Link>
          </div>
        </section>

        {/* Community Discussion Section */}
        <CommunityFeedback issueTitle={issue.title} />
      </div>
    </article>
  );
}

export default IssueDetailPage;
