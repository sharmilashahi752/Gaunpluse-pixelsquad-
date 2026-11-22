import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  GitCommit,
} from 'lucide-react';

/**
 * Reusable badge for issue severity, verification status, and progress lifecycle
 */
export function IssueStatusBadge({ type = 'severity', value, label, size = 'sm', className = '' }) {
  const sizeClasses = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  // 1. Severity Badges
  if (type === 'severity') {
    const severityConfigs = {
      critical: {
        bg: 'bg-[#D45F53]/15 text-[#D45F53] border-[#D45F53]/30',
        icon: AlertTriangle,
        defaultLabel: 'Critical Alert',
      },
      warning: {
        bg: 'bg-[#E3AD58]/20 text-[#8F5E16] border-[#E3AD58]/40',
        icon: AlertCircle,
        defaultLabel: 'Monitored Warning',
      },
      low: {
        bg: 'bg-[#DDEBE2] text-[#173D32] border-[#42866A]/30',
        icon: CheckCircle2,
        defaultLabel: 'Low Priority / Monitored',
      },
    };

    const config = severityConfigs[value] || severityConfigs.low;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${sizeClasses} ${className}`}
      >
        <Icon className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
        <span>{label || config.defaultLabel}</span>
      </span>
    );
  }

  // 2. Verification Badges
  if (type === 'verification') {
    const verificationConfigs = {
      verified: {
        bg: 'bg-[#DDEBE2] text-[#173D32] border-[#42866A]/30',
        icon: CheckCircle2,
        defaultLabel: 'Field Verified',
      },
      under_review: {
        bg: 'bg-[#E3AD58]/15 text-[#8F5E16] border-[#E3AD58]/35',
        icon: Clock,
        defaultLabel: 'Under Review',
      },
      unverified: {
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        icon: AlertCircle,
        defaultLabel: 'Community Submitted',
      },
    };

    const config = verificationConfigs[value] || verificationConfigs.under_review;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${sizeClasses} ${className}`}
      >
        <Icon className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
        <span>{label || config.defaultLabel}</span>
      </span>
    );
  }

  // 3. Progress Lifecycle Badges
  if (type === 'progress') {
    const progressConfigs = {
      submitted: {
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        icon: Clock,
        defaultLabel: 'Report Submitted',
      },
      under_review: {
        bg: 'bg-[#E3AD58]/15 text-[#8F5E16] border-[#E3AD58]/35',
        icon: Clock,
        defaultLabel: 'Under Review',
      },
      field_verification: {
        bg: 'bg-[#173D32]/10 text-[#173D32] border-[#173D32]/25',
        icon: GitCommit,
        defaultLabel: 'Field Verification Active',
      },
      action_proposed: {
        bg: 'bg-[#42866A]/15 text-[#173D32] border-[#42866A]/30',
        icon: Sparkles,
        defaultLabel: 'Action Proposed',
      },
      work_in_progress: {
        bg: 'bg-[#E3AD58]/20 text-[#8F5E16] border-[#E3AD58]/40',
        icon: Wrench,
        defaultLabel: 'Work In Progress',
      },
      resolved: {
        bg: 'bg-[#DDEBE2] text-[#173D32] border-[#42866A]/30',
        icon: CheckCircle2,
        defaultLabel: 'Resolved',
      },
    };

    const config = progressConfigs[value] || progressConfigs.under_review;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${sizeClasses} ${className}`}
      >
        <Icon className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
        <span>{label || config.defaultLabel}</span>
      </span>
    );
  }

  // Fallback
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#DDEBE2] text-[#173D32] border border-[#42866A]/20 ${className}`}
    >
      {label || value}
    </span>
  );
}

export default IssueStatusBadge;
