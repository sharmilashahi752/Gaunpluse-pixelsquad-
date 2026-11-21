import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Compass,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Share2,
} from 'lucide-react';
import Container from '../components/ui/Container';
import CommunityFeedback from '../components/issues/CommunityFeedback';
import { ISSUES } from '../data/demoVillage';
import { getIssueImage, CATEGORY_LABELS } from '../utils/issueImages';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function IssueDetailPage() {
  const { id } = useParams();

  const issue = ISSUES.find((i) => i.id === id);

  useDocumentTitle(
    issue
      ? `${issue.title} — GaunPulse Community Report`
      : 'Issue Not Found — GaunPulse'
  );

  if (!issue) {
    return (
      <Container className="py-16 sm:py-24 text-center">
        <div className="max-w-md mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#438A70] block mb-2">
            REPORT NOT FOUND
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173D32] mb-3">
            Infrastructure Issue Not Found
          </h1>
          <p className="text-sm text-[#485650] mb-6 leading-relaxed">
            The infrastructure report you requested ({id}) does not exist or has been archived.
          </p>
          <Link
            to="/issues"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#173D32] text-white text-xs font-semibold hover:bg-[#122F26] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Community Issues</span>
          </Link>
        </div>
      </Container>
    );
  }

  const categoryName = CATEGORY_LABELS[issue.category] || issue.category.toUpperCase();

  return (
    <article className="bg-white min-h-screen text-[#1B2923]">
      <Container className="py-6 sm:py-10">
        <div className="max-w-3xl lg:max-w-4xl mx-auto">
          {/* Breadcrumb / Back Link */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E7EB]">
            <Link
              to="/issues"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#438A70] hover:text-[#173D32] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Community Issues</span>
            </Link>

            <div className="flex items-center gap-3 text-xs text-[#485650]">
              <span className="font-mono text-[11px] text-[#485650]">
                ID: {issue.id}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: issue.title, url: window.location.href });
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Report link copied to clipboard!');
                  }
                }}
                className="inline-flex items-center gap-1 text-[#485650] hover:text-[#173D32] transition-colors cursor-pointer"
                title="Share this report"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Article Header */}
          <header className="mb-6">
            <span className="text-xs font-bold tracking-[0.14em] uppercase text-[#438A70] block mb-2.5">
              {categoryName}
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-[#173D32] tracking-tight leading-[1.2] mb-4">
              {issue.title}
            </h1>

            <p className="text-base sm:text-lg text-[#485650] leading-relaxed font-normal mb-5">
              {issue.summary || issue.description}
            </p>

            {/* Metadata Byline Strip */}
            <div className="py-3 border-y border-[#E5E7EB] flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-[#485650]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 font-medium text-[#173D32]">
                  <MapPin className="w-3.5 h-3.5 text-[#438A70]" />
                  <span>{issue.locationLabel}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#485650]" />
                  <span>Reported: {issue.reportedAt}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {/* Severity */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${
                    issue.severity === 'critical'
                      ? 'bg-red-50 text-[#D45F53] border border-red-200'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50 text-[#8F5E16] border border-amber-200'
                      : 'bg-stone-50 text-[#485650] border border-stone-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{issue.severityLabel}</span>
                </span>

                {/* Verification */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${
                    issue.verificationStatus === 'verified'
                      ? 'bg-emerald-50 text-[#438A70] border border-emerald-200'
                      : 'bg-amber-50 text-[#8F5E16] border border-amber-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{issue.verificationLabel}</span>
                </span>
              </div>
            </div>
          </header>

          {/* Large Landscape Photograph */}
          <div className="mb-8">
            <div className="w-full aspect-[16/9] sm:aspect-[21/10] max-h-[480px] rounded-[6px] overflow-hidden bg-stone-100 border border-[#E5E7EB]">
              <img
                src={getIssueImage(issue)}
                alt={issue.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <p className="text-xs text-[#485650]/80 italic mt-2">
              Field photograph documenting {issue.infrastructureName} at {issue.locationLabel}.
            </p>
          </div>

          {/* Detailed Narrative Section */}
          <section className="mb-10 text-base text-[#485650] leading-relaxed space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB]">
              Detailed Field Observation & Context
            </h2>
            <p>{issue.description}</p>
            {issue.simulatedImpact && (
              <div className="p-4 rounded-[6px] bg-[#F7F8FA] border-l-4 border-[#438A70] my-4 text-sm text-[#1B2923]">
                <strong className="block text-[#173D32] font-bold mb-1">
                  Community Mobility Impact:
                </strong>
                <span>{issue.simulatedImpact}</span>
              </div>
            )}
          </section>

          {/* Infrastructure Specifications Directory Table */}
          <section className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-4">
              Infrastructure Details
            </h2>

            <div className="border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-sm text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-white">
                <span className="font-semibold text-[#173D32]">Target Asset Name</span>
                <span className="sm:col-span-2 text-[#485650]">{issue.infrastructureName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-[#F7F8FA]">
                <span className="font-semibold text-[#173D32]">Asset Type & ID</span>
                <span className="sm:col-span-2 text-[#485650]">
                  {issue.targetType?.toUpperCase()} ({issue.infrastructureId || issue.edgeId})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-white">
                <span className="font-semibold text-[#173D32]">Location Coordinates</span>
                <span className="sm:col-span-2 text-[#485650] font-mono text-xs">
                  {issue.coordinates ? `${issue.coordinates[0]}° N, ${issue.coordinates[1]}° E` : 'Registered'}
                </span>
              </div>
              {issue.evidence?.measurement && (
                <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-[#F7F8FA]">
                  <span className="font-semibold text-[#173D32]">Current Condition</span>
                  <span className="sm:col-span-2 text-[#485650]">{issue.evidence.measurement}</span>
                </div>
              )}
              {issue.evidence?.citizenNotes && (
                <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-white">
                  <span className="font-semibold text-[#173D32]">Citizen Field Notes</span>
                  <span className="sm:col-span-2 text-[#485650]">{issue.evidence.citizenNotes}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-[#F7F8FA]">
                <span className="font-semibold text-[#173D32]">Reporting Source</span>
                <span className="sm:col-span-2 text-[#485650]">
                  {issue.reportedBy} ({issue.sourceType})
                </span>
              </div>
            </div>
          </section>

          {/* Potential Consequences & Proposed Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {issue.consequences && issue.consequences.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-3">
                  Potential Community Impacts
                </h3>
                <ul className="space-y-2 text-sm text-[#485650]">
                  {issue.consequences.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D45F53] mt-2 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {issue.proposedActions && issue.proposedActions.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-[#173D32] pb-2 border-b border-[#E5E7EB] mb-3">
                  Proposed Interventions & Actions
                </h3>
                <ul className="space-y-2 text-sm text-[#485650]">
                  {issue.proposedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#438A70] mt-2 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Chronological Progress Lifecycle Timeline */}
          {issue.progressHistory && (
            <section className="mb-10 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#E5E7EB]">
                <div>
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#438A70] block">
                    CIVIC ACCOUNTABILITY
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#173D32]">
                    Chronological Progress Timeline
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-[4px] bg-[#DDEBE2] text-[#173D32]">
                  {issue.progressLabel}
                </span>
              </div>

              <div className="space-y-4">
                {issue.progressHistory.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-[6px] border ${
                      step.status === 'current'
                        ? 'bg-[#F7F8FA] border-[#173D32] shadow-2xs'
                        : step.status === 'completed'
                        ? 'bg-white border-[#E5E7EB]'
                        : 'bg-white/60 border-[#E5E7EB]/70 opacity-70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step.status === 'completed'
                              ? 'bg-[#438A70] text-white'
                              : step.status === 'current'
                              ? 'bg-[#173D32] text-white ring-2 ring-[#438A70]/30'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-[#173D32]">{step.stage}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#485650]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{step.date}</span>
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-white border border-[#E5E7EB]">
                          {step.actor}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#485650] leading-relaxed pl-7 font-normal">
                      {step.note}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Spatial Actions & Interactive Cross-Links */}
          <section className="p-5 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#173D32]">
                Explore Spatial Telemetry & Scenario Simulation
              </h3>
              <p className="text-xs text-[#485650] mt-0.5">
                Inspect this asset on the topographic map or test connectivity failure detours.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to={`/map?asset=${issue.infrastructureId || issue.edgeId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#173D32] text-white hover:bg-[#122F26] text-xs font-semibold transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Inspect on Map</span>
              </Link>

              {issue.canSimulate && (
                <Link
                  to={`/demo?edge=${issue.edgeId || issue.targetId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#E3AD58] text-[#173D32] hover:bg-[#D19942] text-xs font-bold transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Simulate Delay</span>
                </Link>
              )}
            </div>
          </section>

          {/* Community Feedback Section */}
          <CommunityFeedback issueTitle={issue.title} />
        </div>
      </Container>
    </article>
  );
}

export default IssueDetailPage;
