import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  MapPin,
  Compass,
  FileText,
  Eye,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

/**
 * Public Notice Card component for GaunPulse
 */
export function NoticeCard({ notice, onSelect, isFeaturedView = false }) {
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
    <Card
      className={`flex flex-col justify-between h-full bg-white/90 border-[#42866A]/20 hover:border-[#42866A]/50 transition-all duration-200 shadow-xs hover:shadow-md ${
        isFeaturedView
          ? 'border-l-4 border-l-[#D45F53] bg-gradient-to-br from-white via-white to-[#F8F7F2]'
          : ''
      }`}
    >
      <div>
        {/* Header: Badges & Source */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getCategoryBadge()}
            {notice.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#173D32] text-white">
                <Bell className="w-2.5 h-2.5 text-[#E3AD58]" />
                Featured Advisory
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-[#42866A] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#42866A]" />
            {notice.sourceLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-[#173D32] leading-snug group-hover:text-[#42866A] transition-colors mb-2">
          {notice.title}
        </h3>

        {/* Metadata info */}
        <div className="space-y-1 mb-3 text-xs text-[#1B2923]/70">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#173D32] shrink-0" />
            <span className="truncate">{notice.locationLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#1B2923]/60">
            <Calendar className="w-3.5 h-3.5 text-[#42866A] shrink-0" />
            <span>Published {notice.date}</span>
          </div>
        </div>

        {/* Summary text */}
        <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed line-clamp-3 mb-4">
          {notice.summary}
        </p>

        {/* Related Asset Badge */}
        <div className="p-2.5 rounded-lg bg-[#F8F7F2] border border-[#42866A]/15 mb-4 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] block mb-0.5">
            Related Infrastructure Asset:
          </span>
          <span className="font-semibold text-[#173D32]">
            {notice.relatedInfrastructureName}
          </span>
        </div>
      </div>

      {/* Footer: Triggers and cross-links */}
      <div className="pt-3 border-t border-[#42866A]/15 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(notice)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#173D32] cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Read Full Notice</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Link
            to={`/map?asset=${notice.relatedInfrastructureId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-medium transition-colors"
            title="Inspect on Interactive Village Map"
          >
            <Compass className="w-3.5 h-3.5 text-[#42866A]" />
            <span>Map</span>
          </Link>

          {notice.relatedIssueId && (
            <Link
              to={`/issues?issue=${notice.relatedIssueId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-medium transition-colors"
              title="View Related Verified Issue Report"
            >
              <FileText className="w-3.5 h-3.5 text-[#42866A]" />
              <span>Issue</span>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export default NoticeCard;
