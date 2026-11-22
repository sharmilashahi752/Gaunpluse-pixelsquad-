/**
 * GaunPulse — Demonstration Community Notices & Public Bulletins
 * 
 * IMPORTANT CIVIC DISCLOSURE:
 * All announcements, dates, and advisory notes in this dataset are fictional demonstration records
 * for the synthetic village of Sundar Gaun. They do NOT represent real municipal government decisions,
 * actual road closures, official safety clearances, or certified engineering assessments.
 */

export const NOTICES_METADATA = {
  disclaimer: 'Fictional Demonstration Notices — Not Official Government Announcements',
  villageName: 'Sundar Gaun',
  sourceName: 'GaunPulse Demonstration Notice',
};

export const NOTICES = [
  {
    id: 'notice-bridge-scour-inspection',
    title: 'Precautionary Load Guidance & Pier Scour Advisory for Khola River Motor Bridge (BR-02)',
    summary:
      'Field inspection confirmed localized riverbed scour near Pier 2 following high monsoon flows. Heavy vehicles (>2.5 tonnes) are advised to divert via West Ridge while technical evaluations proceed.',
    content: `Following community observations registered on 2026-11-18, a technical walkthrough by the ward technical assistant identified localized riverbed scour measuring approximately 1.8 meters beneath the south-bank concrete pier of the Khola River Motor Bridge (BR-02).

In accordance with preventative community safety practices demonstrated by GaunPulse:
• Heavy vehicular transit exceeding 2.5 tonnes (including heavily laden gravel trucks and construction haulers) is advised to divert.
• Light passenger jeeps and two-wheelers are advised to reduce crossing speed to 10 km/h.
• Pedestrians, schoolchildren, and local farmers may continue crossing with caution along the designated downstream walkway.

A follow-up depth ultrasound assessment and gabion reinforcement proposal have been submitted to the Ward Development Desk for review. This advisory will remain active until formal load testing is completed.`,
    category: 'advisory',
    categoryLabel: 'Precautionary Advisory',
    categoryBadgeVariant: 'alert',
    date: '2026-11-20 (Demonstration)',
    updatedAt: '2026-11-21 (Demonstration)',
    relatedInfrastructureId: 'bridge-b',
    relatedInfrastructureName: 'Khola River Motor Bridge (BR-02)',
    relatedIssueId: 'issue-bridge-b-scour',
    edgeId: 'edge-bridge-b',
    canSimulate: true,
    isFeatured: true,
    isDemo: true,
    sourceLabel: 'GaunPulse Demonstration Notice',
    locationLabel: 'Khola River Crossing, Ward 4',
    actionItems: [
      'Avoid driving loaded freight vehicles (>2.5T) over Bridge BR-02.',
      'Allow extra commute time (+30 to 35 mins) if rerouting through the West Ridge Trail.',
      'Report any newly visible cracks or water vortex patterns to the local observation coordinator.',
    ],
  },
  {
    id: 'notice-ridge-trail-maintenance',
    title: 'Terrace Ridge Trail Shoulder Narrowing & Community Maintenance Advisory',
    summary:
      'A 20-meter slope slump along the Upallo Basti ridge contour has reduced usable path width to 0.8 meters. Single-file pedestrian transit remains open; pack animal passage is cautioned.',
    content: `Late monsoon soil saturation caused a shallow translational soil slide along bend #4 of the Upallo Basti Ridge Trail. The usable footpath width has narrowed from 1.8 meters down to approximately 0.8 meters along a 20-meter stretch.

Key Information for Residents:
• Single-file pedestrian transit remains accessible during daylight hours.
• Pack mules and agricultural hand-carts are advised to take the lower valley contour to prevent shoulder erosion.
• Voluntary community labor (Shramdaan) is proposed for Saturday morning to construct a temporary timber breastwork barrier before dry-stone retaining wall works begin.

Please exercise extra caution during evening dusk hours, as unpaved sections may be slick after afternoon showers.`,
    category: 'maintenance',
    categoryLabel: 'Trail Maintenance Advisory',
    categoryBadgeVariant: 'amber',
    date: '2026-11-19 (Demonstration)',
    updatedAt: '2026-11-20 (Demonstration)',
    relatedInfrastructureId: 'edge-upallo-ridge-trail',
    relatedInfrastructureName: 'Upallo Basti Ridge Trail',
    relatedIssueId: 'issue-upallo-trail-slump',
    edgeId: 'edge-upallo-ridge-trail',
    canSimulate: false,
    isFeatured: false,
    isDemo: true,
    sourceLabel: 'GaunPulse Demonstration Notice',
    locationLabel: 'North Terrace Ridge, Ward 4',
    actionItems: [
      'Maintain single-file walking on the mountain side of the trail.',
      'Carry a flashlight or headlamp if traversing after sunset.',
      'Local volunteers are invited to review the timber breastwork plan at the Ward 4 hall.',
    ],
  },
  {
    id: 'notice-school-drainage-clearance',
    title: 'Access Update: Cross-Drainage Culvert Debris Removal on School Incline Road',
    summary:
      'Sediment and branch debris accumulated at the school road culvert inlet will undergo manual clearance before midterm examinations to eliminate waterlogging and mud hazards.',
    content: `Following reports from the Shree Janakalyan Basic School teachers committee, monsoon gravel wash choked the 600mm concrete pipe culvert on the hillock approach road, causing rain runoff to overflow across the walking path.

Demonstration Response Plan:
• A localized debris clearance crew is scheduled to excavate the silt basin at the inlet mouth.
• Upstream timber and boulder trash racks will be installed to intercept future stormwater debris.
• Coarse river gravel will be spread over the incline turnaround to restore footwear traction for students and staff.

School operations continue normally on schedule. Students walking from Tallo Basti should continue using the paved central avenue.`,
    category: 'access',
    categoryLabel: 'School Access Update',
    categoryBadgeVariant: 'neutral',
    date: '2026-11-18 (Demonstration)',
    updatedAt: '2026-11-19 (Demonstration)',
    relatedInfrastructureId: 'edge-school-track',
    relatedInfrastructureName: 'School Hillock Access Road',
    relatedIssueId: 'issue-school-culvert',
    edgeId: 'edge-school-track',
    canSimulate: false,
    isFeatured: false,
    isDemo: true,
    sourceLabel: 'GaunPulse Demonstration Notice',
    locationLabel: 'School Approach Spur, Ward 3',
    actionItems: [
      'School buses and motorcycles should park at the lower junction turnaround during morning clearance.',
      'Students are encouraged to use the designated gravel pedestrian side-strip.',
    ],
  },
  {
    id: 'notice-health-retaining-wall-monitoring',
    title: 'Technical Bulletin: Preventative Plumb-Line Monitoring on Clinic Terrace Wall',
    summary:
      'Preventative displacement monitoring pins installed on the dry-stone terrace wall below the Primary Health Post ambulance turnaround to track sub-surface settlement.',
    content: `During routine facility walkthroughs on 2026-11-20, an 8 cm outward bulge was observed along a 4-meter section of the dry-stone terrace retaining wall situated 15 meters below the health post vehicle turnaround pad.

Preventative Observations & Actions:
• Tell-tale gypsum plaster crack pins and plumb-line markers have been placed to track any millimeter-scale movement.
• Weep-hole pipes are discharging clear water freely, indicating that active hydrostatic pressure is currently venting as designed.
• Ambulance transit and patient stretcher drop-offs are fully functional and unaffected.

This technical bulletin is issued to demonstrate open public transparency and early preventative monitoring before structural issues escalate.`,
    category: 'technical',
    categoryLabel: 'Facility Technical Bulletin',
    categoryBadgeVariant: 'neutral',
    date: '2026-11-21 (Demonstration)',
    updatedAt: '2026-11-21 (Demonstration)',
    relatedInfrastructureId: 'facility-health',
    relatedInfrastructureName: 'Sundar Gaun Primary Health Post',
    relatedIssueId: 'issue-health-retaining-wall',
    edgeId: 'edge-health-access',
    canSimulate: false,
    isFeatured: false,
    isDemo: true,
    sourceLabel: 'GaunPulse Demonstration Notice',
    locationLabel: 'Health Post Compound Spur, Ward 3',
    actionItems: [
      'Ambulance and medical emergency access remains open as normal.',
      'Engineers will re-survey plumb-line pins bi-weekly through post-monsoon dry season.',
    ],
  },
];
