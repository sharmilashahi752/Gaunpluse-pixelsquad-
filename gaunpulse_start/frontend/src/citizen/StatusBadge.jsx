import React from 'react';
import { translations } from './citizenI18n';

export default function StatusBadge({ status, lang = 'ne' }) {
  const t = translations[lang] || translations.ne;

  const labels = {
    pending: t.status_pending || 'Pending Verification',
    submitted: t.status_submitted || 'Submitted',
    under_review: t.status_under_review || 'Under Review',
    more_information_needed: t.status_more_information_needed || 'More Info Needed',
    verified: t.status_verified || 'Verified On-Site',
    in_progress: t.status_in_progress || 'In Progress',
    resolved: t.status_resolved || 'Resolved',
    rejected: t.status_rejected || 'Closed / Rejected',
    withdrawn: lang === 'ne' ? 'फिर्ता लिइएको' : 'Withdrawn',
  };

  return <span className={`status-badge ${status}`}>{labels[status] || status}</span>;
}
