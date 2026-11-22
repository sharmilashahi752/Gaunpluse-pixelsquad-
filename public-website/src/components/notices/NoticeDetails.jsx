import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  FileText,
  Info,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Notice Details Modal Dialog
 */
export function NoticeDetails({ notice, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!notice) return null;

  const getCategoryBadge = () => {
    switch (notice.category) {
      case 'advisory':
        return <Badge variant="alert">{notice.categoryLabel}</Badge>;
      case 'maintenance':
        return <Badge variant="amber">{notice.categoryLabel}</Badge>;
      default:
        return <Badge variant="neutral">{notice.categoryLabel}</Badge>;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#42866A]/20 overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#F8F7F2] p-5 sm:p-6 border-b border-[#42866A]/20 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {getCategoryBadge()}
              <Badge variant="neutral">ID: {notice.id}</Badge>
              {notice.isFeatured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#173D32] text-white">
                  Featured Notice
                </span>
              )}
            </div>
            <h2
              id="notice-modal-title"
              className="text-lg sm:text-xl font-bold text-[#173D32] leading-tight"
            >
              {notice.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#42866A] mt-1">
              Source: {notice.sourceLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#1B2923]/60 hover:text-[#173D32] hover:bg-[#DDEBE2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#42866A] cursor-pointer"
            aria-label="Close notice dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#1B2923]">
          {/* Metadata Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#173D32] shrink-0" />
              <span>
                <strong className="text-[#173D32]">Location:</strong>{' '}
                {notice.locationLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#42866A] shrink-0" />
              <span>
                <strong className="text-[#173D32]">Date:</strong> {notice.date}
              </span>
            </div>
          </div>

          {/* Full Announcement Text */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
              Full Announcement Content
            </h4>
            <div className="text-sm text-[#1B2923]/85 leading-relaxed whitespace-pre-line space-y-2">
              {notice.content}
            </div>
          </div>

          {/* Action Items / Community Guidance */}
          {notice.actionItems && notice.actionItems.length > 0 && (
            <div className="p-4 rounded-xl bg-[#DDEBE2]/40 border border-[#42866A]/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#173D32] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#42866A]" />
                <span>Demonstrated Community Action Guidance</span>
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#1B2923]/85">
                {notice.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Connected Infrastructure Context Card */}
          <div className="p-4 rounded-xl bg-white border border-[#42866A]/25 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
              Connected Infrastructure Context
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-[#173D32]">
                  {notice.relatedInfrastructureName}
                </p>
                <p className="text-xs text-[#1B2923]/60">
                  Network Asset ID: {notice.relatedInfrastructureId}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/map?asset=${notice.relatedInfrastructureId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-semibold transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-[#42866A]" />
                  <span>Inspect on Map</span>
                </Link>

                {notice.relatedIssueId && (
                  <Link
                    to={`/issues?issue=${notice.relatedIssueId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#173D32] text-white hover:bg-[#122F26] text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Issue Dossier</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Fictional Demonstration Notice Disclosure */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#42866A]/20 flex items-start gap-2.5 text-xs text-[#1B2923]/70">
            <Info className="w-4 h-4 text-[#42866A] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#173D32]">Demonstration Disclosure:</strong> This notice is a synthetic sample created to illustrate how GaunPulse broadcasts verified field assessments and localized travel guidance to rural communities. It is NOT an official government proclamation or legal road closure.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8F7F2] p-4 sm:p-5 border-t border-[#42866A]/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Notice
          </button>

          <div className="flex items-center gap-2">
            <Link
              to={`/map?asset=${notice.relatedInfrastructureId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>View Location on Map</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoticeDetails;
