import React from 'react';

export default function StatusBadge({ status }) {
  const labels = {
    pending: 'Pending Review',
    verified: 'Verified',
    more_information_needed: 'Action Needed',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  return <span className={`status-badge ${status}`}>{labels[status] || status}</span>;
}
