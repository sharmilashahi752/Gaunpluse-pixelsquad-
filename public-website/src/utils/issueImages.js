/**
 * Image and metadata mapping for GaunPulse Community Issues
 * Uses local high-resolution Nepal village photographs
 */
export const ISSUE_IMAGE_MAP = {
  'issue-bridge-b-scour': '/images/issues/bridge-scour.png',
  'issue-upallo-trail-slump': '/images/issues/ridge-trail.jpg',
  'issue-school-culvert': '/images/issues/school-culvert.jpg',
  'issue-health-retaining-wall': '/images/issues/clinic-retaining-wall.jpg',
};

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Issues' },
  { id: 'bridge', label: 'Bridges' },
  { id: 'road', label: 'Roads & Trails' },
  { id: 'school', label: 'Education' },
  { id: 'health_post', label: 'Healthcare' },
];

export const CATEGORY_LABELS = {
  bridge: 'Bridge Infrastructure',
  road: 'Roads & Trail Network',
  school: 'Educational Facility',
  health_post: 'Healthcare Access',
};

/**
 * Returns the photograph for an issue, or an appropriate local placeholder
 */
export function getIssueImage(issue) {
  if (issue?.image) return issue.image;
  if (issue?.id && ISSUE_IMAGE_MAP[issue.id]) {
    return ISSUE_IMAGE_MAP[issue.id];
  }
  return '/images/issues/bridge-scour.png';
}

export default getIssueImage;
