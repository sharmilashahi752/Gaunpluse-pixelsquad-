import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Layers,
  Activity,
  Compass,
  Eye,
} from 'lucide-react';
import Card from '../ui/Card';
import IssueStatusBadge from './IssueStatusBadge';

/**
 * Public-facing Issue Card presenting a single demonstration infrastructure report
 */
export function IssueCard({ issue, onSelect }) {
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'bridge':
        return 'Bridge Infrastructure';
      case 'road':
        return 'Road & Trail Corridor';
      case 'school':
        return 'Educational Facility Access';
      case 'health_post':
        return 'Healthcare Access Route';
      default:
        return 'Civic Asset';
    }
  };

  return (
    <Card className="flex flex-col justify-between h-full bg-white/90 border-[#42866A]/20 hover:border-[#42866A]/50 transition-all duration-200 shadow-xs hover:shadow-md">
      <div>
        {/* Card Header: Category & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            {getCategoryLabel(issue.category)}
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
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
        </div>

        {/* Title & Infrastructure Asset */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-bold text-[#173D32] leading-snug group-hover:text-[#42866A] transition-colors">
            {issue.title}
          </h3>
          <p className="text-xs font-semibold text-[#42866A] mt-0.5">
            Asset: {issue.infrastructureName}
          </p>
        </div>

        {/* Location & Reported Info */}
        <div className="space-y-1 mb-3 text-xs text-[#1B2923]/70">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#173D32] shrink-0" />
            <span className="truncate">{issue.locationLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#1B2923]/60">
            <Calendar className="w-3.5 h-3.5 text-[#42866A] shrink-0" />
            <span>Reported {issue.reportedAt}</span>
          </div>
        </div>

        {/* Summary Description */}
        <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed line-clamp-3 mb-4">
          {issue.summary || issue.description}
        </p>

        {/* Quick Lifecycle Progress Pill */}
        <div className="p-2.5 rounded-lg bg-[#F8F7F2] border border-[#42866A]/15 mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[11px] font-semibold text-[#1B2923]/70">
              Current Stage:
            </span>
            <IssueStatusBadge
              type="progress"
              value={issue.progressStatus}
              label={issue.progressLabel}
              size="xs"
            />
          </div>
          <p className="text-[11px] text-[#1B2923]/60 italic truncate">
            {issue.progressHistory?.find((h) => h.status === 'current')?.note ||
              'Awaiting scheduled review'}
          </p>
        </div>
      </div>

      {/* Card Footer: Action Links */}
      <div className="pt-3 border-t border-[#42866A]/15 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(issue)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#173D32] cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details & Timeline</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Link
            to={`/map?asset=${issue.infrastructureId || issue.edgeId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-medium transition-colors"
            title="Inspect on Interactive Village Map"
          >
            <Compass className="w-3.5 h-3.5 text-[#42866A]" />
            <span>Map</span>
          </Link>

          {issue.canSimulate && (
            <Link
              to={`/demo?edge=${issue.edgeId || issue.targetId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E3AD58]/20 hover:bg-[#E3AD58]/30 border border-[#E3AD58]/40 text-[#8F5E16] text-xs font-semibold transition-colors"
              title="Run Graph Simulation Demo"
            >
              <Activity className="w-3.5 h-3.5 text-[#8F5E16]" />
              <span>Simulate</span>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export default IssueCard;
