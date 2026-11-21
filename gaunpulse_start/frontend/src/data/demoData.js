import {
  Bot,
  Building2,
  ChartNoAxesColumn,
  ClipboardList,
  House,
  LayoutDashboard,
  MapPinned,
  MessageSquareText,
  Network,
  Radio,
  TriangleAlert,
  Users,
} from 'lucide-react';

export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'village-map', label: 'Village Map', icon: MapPinned },
  { id: 'issues-alerts', label: 'Issues & Alerts', icon: TriangleAlert, badge: 3 },
  { id: 'simulations', label: 'Simulations', icon: Network },
  { id: 'action-plans', label: 'Action Plans', icon: ClipboardList },
  { id: 'community-voices', label: 'Community Voices', icon: MessageSquareText },
  { id: 'reports-insights', label: 'Reports & Insights', icon: ChartNoAxesColumn },
  { id: 'ai-agent', label: 'AI Agent', icon: Bot },
  { id: 'village-data', label: 'Village Data Manager', icon: Building2 },
];

export const pageMeta = Object.fromEntries(
  navigationItems.map(({ id, label }) => [id, { title: label }]),
);

export const summaryStats = [
  {
    label: 'Monitored Villages',
    value: '12',
    change: '+2 this quarter',
    tone: 'green',
    icon: MapPinned,
  },
  {
    label: 'Active Issues',
    value: '24',
    change: '8 awaiting review',
    tone: 'orange',
    icon: Radio,
  },
  {
    label: 'Critical Disruptions',
    value: '3',
    change: 'Needs attention today',
    tone: 'red',
    icon: TriangleAlert,
  },
  {
    label: 'Affected Households',
    value: '186',
    change: 'Across 4 wards',
    tone: 'mint',
    icon: Users,
  },
];

export const mapLocations = [
  { id: 1, label: 'Thulogaun', type: 'village', status: 'stable', x: 18, y: 28 },
  { id: 2, label: 'Seti Bridge', type: 'bridge', status: 'critical', x: 48, y: 49 },
  { id: 3, label: 'Ward Health Post', type: 'health', status: 'stable', x: 76, y: 23 },
  { id: 4, label: 'Simalchaur', type: 'village', status: 'watch', x: 70, y: 72 },
  { id: 5, label: 'Shree Janajyoti School', type: 'school', status: 'stable', x: 32, y: 75 },
];

export const priorityActions = [
  {
    id: 'GP-024',
    title: 'Inspect Seti footbridge damage',
    location: 'Ward 4 · Thulogaun',
    priority: 'Critical',
    due: 'Today',
  },
  {
    id: 'GP-019',
    title: 'Clear monsoon drainage blockage',
    location: 'Ward 2 · Simalchaur',
    priority: 'High',
    due: 'Tomorrow',
  },
  {
    id: 'GP-016',
    title: 'Verify health-post water report',
    location: 'Ward 6 · Raniban',
    priority: 'Medium',
    due: '24 Nov',
  },
];

export const connectivityTrend = [
  { month: 'Jun', value: 66 },
  { month: 'Jul', value: 71 },
  { month: 'Aug', value: 62 },
  { month: 'Sep', value: 75 },
  { month: 'Oct', value: 78 },
  { month: 'Nov', value: 84 },
];

export const voices = [
  {
    id: 1,
    initials: 'MK',
    name: 'Maya Karki',
    ward: 'Ward 4 resident',
    time: '28 min ago',
    message: 'The bridge handrail is loose after last night’s rain. Children use this route to school.',
    tag: 'Safety',
  },
  {
    id: 2,
    initials: 'DR',
    name: 'Deepak Rai',
    ward: 'Ward 2 volunteer',
    time: '2 hr ago',
    message: 'The upper spring is flowing again, but the footpath remains muddy near the tap stand.',
    tag: 'Water access',
  },
];

export const issues = [
  { id: 'GP-024', issue: 'Footbridge deck damage', village: 'Thulogaun', category: 'Transport', severity: 'Critical', status: 'Verified' },
  { id: 'GP-019', issue: 'Blocked roadside drain', village: 'Simalchaur', category: 'Drainage', severity: 'High', status: 'Under review' },
  { id: 'GP-016', issue: 'Irregular tap flow', village: 'Raniban', category: 'Water', severity: 'Medium', status: 'Reported' },
  { id: 'GP-011', issue: 'School trail erosion', village: 'Khalte', category: 'Access', severity: 'Medium', status: 'Action planned' },
];

export const actionPlans = [
  { title: 'Seti bridge rapid inspection', owner: 'Infrastructure Unit', progress: 72, due: '22 Nov', tasks: '5 of 7 tasks' },
  { title: 'Ward 2 drainage clearing', owner: 'Ward Committee', progress: 45, due: '25 Nov', tasks: '4 of 9 tasks' },
  { title: 'Raniban water-point verification', owner: 'WASH Focal Person', progress: 20, due: '27 Nov', tasks: '1 of 5 tasks' },
];

export const villageRecords = [
  { name: 'Thulogaun', ward: '4', households: 218, facilities: 7, completeness: 94 },
  { name: 'Simalchaur', ward: '2', households: 164, facilities: 5, completeness: 81 },
  { name: 'Raniban', ward: '6', households: 132, facilities: 4, completeness: 76 },
];

export const reportMetrics = [
  { label: 'Issues resolved', value: '68%', note: '+9% from last month' },
  { label: 'Median verification', value: '1.8 d', note: '0.4 d faster' },
  { label: 'Community reports', value: '47', note: 'This month' },
];

export const impactComparison = [
  { label: 'School journey', before: 18, after: 58 },
  { label: 'Health-post journey', before: 19, after: 59 },
];

export const mapLegend = [
  { label: 'Village', color: 'green', icon: House },
  { label: 'Service point', color: 'mint', icon: Building2 },
  { label: 'Needs attention', color: 'orange', icon: TriangleAlert },
  { label: 'Critical', color: 'red', icon: Radio },
];

export const demoDisclaimer = 'Fictional demonstration data — not for operational decisions';
