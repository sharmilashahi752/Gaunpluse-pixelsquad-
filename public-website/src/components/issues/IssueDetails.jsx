import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  Activity,
  FileText,
  Camera,
  Ruler,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import IssueStatusBadge from './IssueStatusBadge';
import IssueTimeline from './IssueTimeline';
import Badge from '../ui/Badge';

/**
 * Detailed Inspector Modal for an individual infrastructure issue
 */
export function IssueDetails({ issue, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!issue) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#42866A]/20 overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#F8F7F2] p-5 sm:p-6 border-b border-[#42866A]/20 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="neutral">Report ID: {issue.id}</Badge>
              <IssueStatusBadge
                type="severity"
                value={issue.severity}
                label={issue.severityLabel}
                size="xs"
              />
              <IssueStatusBadge
                type="verification"
                value={issue.verificationStatus}
                label={issue.verificationLabel}
                size="xs"
              />
            </div>
            <h2
              id="issue-modal-title"
              className="text-lg sm:text-xl font-bold text-[#173D32] leading-tight"
            >
              {issue.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#42866A] mt-1">
              Target Asset: {issue.infrastructureName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#1B2923]/60 hover:text-[#173D32] hover:bg-[#DDEBE2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#42866A] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#1B2923]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#173D32] shrink-0" />
              <span>
                <strong className="text-[#173D32]">Location:</strong>{' '}
                {issue.locationLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#42866A] shrink-0" />
              <span>
                <strong className="text-[#173D32]">Reported:</strong>{' '}
                {issue.reportedAt} (Updated {issue.updatedAt})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#42866A] shrink-0" />
              <span>
                <strong className="text-[#173D32]">Source:</strong>{' '}
                {issue.reportedBy} ({issue.sourceType})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#173D32] shrink-0" />
              <span>
                <strong className="text-[#173D32]">Demonstration Status:</strong>{' '}
                {issue.progressLabel}
              </span>
            </div>
          </div>

          {/* Problem Narrative */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#42866A] mb-2">
              Problem Description & Assessment
            </h4>
            <p className="text-sm text-[#1B2923]/85 leading-relaxed">
              {issue.description}
            </p>
          </div>

          {/* Evidence Dossier Block */}
          {issue.evidence && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
                Field Observation & Evidence
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#42866A]/20 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#173D32] mb-1">
                    <Camera className="w-3.5 h-3.5 text-[#42866A]" />
                    <span>Visual Records</span>
                  </div>
                  <p className="text-xs text-[#1B2923]/75 leading-normal">
                    {issue.evidence.photos}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#42866A]/20 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#173D32] mb-1">
                    <Ruler className="w-3.5 h-3.5 text-[#42866A]" />
                    <span>Physical Metrics</span>
                  </div>
                  <p className="text-xs text-[#1B2923]/75 leading-normal">
                    {issue.evidence.measurement}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#42866A]/20 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#173D32] mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#42866A]" />
                    <span>Community Notes</span>
                  </div>
                  <p className="text-xs text-[#1B2923]/75 leading-normal">
                    {issue.evidence.citizenNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Community Consequences */}
          {issue.consequences && issue.consequences.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D45F53] mb-2">
                Potential Community Impacts
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#1B2923]/80">
                {issue.consequences.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D45F53] mt-2 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6-Stage Lifecycle Timeline */}
          <div className="pt-2">
            <IssueTimeline progressHistory={issue.progressHistory} />
          </div>

          {/* Proposed Actions */}
          {issue.proposedActions && issue.proposedActions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#173D32] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#42866A]" />
                <span>Demonstrated Next Steps & Interventions</span>
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#1B2923]/80 bg-[#DDEBE2]/40 p-3.5 rounded-xl border border-[#42866A]/20">
                {issue.proposedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] mt-2 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Civic Demonstration Disclaimer */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/20 flex items-start gap-2.5 text-xs text-[#1B2923]/70">
            <Info className="w-4 h-4 text-[#42866A] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#173D32]">Demonstration Disclaimer:</strong> This issue profile is fictional sample data designed to illustrate GaunPulse's public-facing verification pipeline. It does not represent active municipal work orders or actual government liability.
            </p>
          </div>
        </div>

        {/* Modal Footer with Cross-Links */}
        <div className="bg-[#F8F7F2] p-4 sm:p-5 border-t border-[#42866A]/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Dossier
          </button>

          <div className="flex items-center gap-2">
            <Link
              to={`/map?asset=${issue.infrastructureId || issue.edgeId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Inspect on Map</span>
            </Link>

            {issue.canSimulate && (
              <Link
                to={`/demo?edge=${issue.edgeId || issue.targetId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E3AD58] hover:bg-[#D19942] text-[#173D32] text-xs font-bold transition-colors shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulate Impact</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueDetails;
