import React from 'react';
import { Check, Clock, Info, Sparkles, Wrench, ShieldCheck, UserCheck } from 'lucide-react';

/**
 * 6-Stage Civic Issue Lifecycle Timeline
 * Stages:
 * 1. Report Submitted
 * 2. Under Review
 * 3. Field Verification
 * 4. Action Proposed
 * 5. Work In Progress
 * 6. Resolved
 */
export function IssueTimeline({ progressHistory = [], className = '' }) {
  // Standard 6 stages with default fallback definitions
  const STAGE_ORDER = [
    'Report Submitted',
    'Under Review',
    'Field Verification',
    'Action Proposed',
    'Work In Progress',
    'Resolved',
  ];

  // Map history by stage name for easy lookup
  const historyMap = (progressHistory || []).reduce((acc, item) => {
    acc[item.stage] = item;
    return acc;
  }, {});

  const getStageIcon = (status, stageName) => {
    if (status === 'completed') {
      return <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />;
    }
    if (status === 'current') {
      return <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />;
    }
    // Pending
    switch (stageName) {
      case 'Work In Progress':
        return <Wrench className="w-3 h-3 text-[#1B2923]/40" />;
      case 'Resolved':
        return <ShieldCheck className="w-3 h-3 text-[#1B2923]/40" />;
      case 'Action Proposed':
        return <Sparkles className="w-3 h-3 text-[#1B2923]/40" />;
      default:
        return <Clock className="w-3 h-3 text-[#1B2923]/40" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
          Progress Lifecycle (6-Stage Pipeline)
        </h4>
        <span className="text-[11px] text-[#1B2923]/60 font-medium">
          Simulated Demonstration Tracking
        </span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#42866A]/20">
        {STAGE_ORDER.map((stageName, index) => {
          const item = historyMap[stageName] || {
            stage: stageName,
            status: 'pending',
            date: 'Pending',
            actor: 'Responsible Authority',
            note: 'Demonstration placeholder for this stage.',
          };

          const isCompleted = item.status === 'completed';
          const isCurrent = item.status === 'current';
          const isPending = item.status === 'pending';

          return (
            <div key={stageName} className="relative group">
              {/* Timeline Node Marker */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border transition-all ${
                  isCompleted
                    ? 'bg-[#42866A] border-[#42866A] shadow-xs'
                    : isCurrent
                    ? 'bg-[#173D32] border-[#42866A] ring-4 ring-[#42866A]/20 shadow-sm'
                    : 'bg-[#F8F7F2] border-[#42866A]/30'
                }`}
              >
                {getStageIcon(item.status, stageName)}
              </div>

              {/* Stage Content Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#DDEBE2]/60 border-[#42866A]/40 shadow-xs'
                    : isCompleted
                    ? 'bg-white/80 border-[#42866A]/20'
                    : 'bg-stone-50/60 border-stone-200/80 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-[#173D32]'
                          : isCompleted
                          ? 'text-[#173D32]'
                          : 'text-[#1B2923]/60'
                      }`}
                    >
                      {index + 1}. {stageName}
                    </span>

                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#173D32] text-white">
                        Active Stage
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-medium text-[#42866A]">
                        Completed
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[10px] font-medium text-stone-600">
                        Demonstration Step
                      </span>
                    )}
                  </div>

                  {item.date && (
                    <span className="text-[11px] font-medium text-[#1B2923]/60">
                      {item.date}
                    </span>
                  )}
                </div>

                {/* Actor attribution */}
                {item.actor && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#42866A] mb-1">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.actor}</span>
                  </div>
                )}

                {/* Stage descriptive note */}
                <p className="text-xs text-[#1B2923]/80 leading-relaxed font-normal">
                  {item.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demonstration transparency note */}
      <div className="mt-4 p-3 rounded-lg bg-[#F8F7F2] border border-[#42866A]/20 flex items-start gap-2.5 text-xs text-[#1B2923]/70">
        <Info className="w-4 h-4 text-[#42866A] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#173D32] font-semibold">CivicTech Process Note:</strong> This pipeline shows how citizen observations can be formally triaged, verified on-site, and escalated to public works committees. The above data reflects simulated demonstration workflows.
        </p>
      </div>
    </div>
  );
}

export default IssueTimeline;
