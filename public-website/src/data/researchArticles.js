/**
 * GaunPulse Interactive Research Publications Dataset
 * Grounded in the Sundar Gaun spatial network, field inspections, and Dijkstra simulation data.
 *
 * Four primary research themes:
 * 1. Rural Bridge Connectivity and Community Access (Khola River Motor Bridge BR-02)
 * 2. Landslide and Trail Safety in Mountain Settlements (Upallo Basti Ridge Trail)
 * 3. Healthcare Accessibility During Infrastructure Disruptions (Sundar Gaun Health Post)
 * 4. Community-Based Infrastructure Monitoring (Janakalyan Basic School Culvert)
 */

export const RESEARCH_ARTICLES = [
  {
    id: 'rural-bridge-connectivity',
    aliases: ['infrastructure-priorities', 'bridge-connectivity'],
    category: 'Infrastructure & Connectivity',
    categoryFilter: 'infrastructure',
    categoryFilters: ['infrastructure', 'data'],
    title: 'Rural Bridge Connectivity and Community Access',
    subtitle:
      'Empirical network simulation modeling how structural scour on Khola River Motor Bridge isolates 95 southern households, forcing emergency stretcher detours.',
    date: 'October 2026',
    readTime: '6 min read',
    author: 'GaunPulse Spatial Engineering Group',
    authorAffiliation: 'In collaboration with Ward 3 & 4 Technical Liaison',
    image: '/images/issues/bridge-scour.png',
    imageCaption:
      'Monsoon flood scour hole measuring 1.8 meters beneath the southern concrete pier footer of Khola River Motor Bridge (BR-02).',
    location: 'Khola River Gorge Crossing (BR-02), Ward 3/4 Boundary',
    summary:
      'In rural mountain valleys, motorable bridges are fragile single-point connectors whose failure ripples across domestic access, agricultural freight, and emergency services. This research evaluates the structural vulnerability of the Khola River Motor Bridge (BR-02), where monsoon riverbed velocity caused a 1.8-meter pier scour hole. Using topological graph simulation calibrated on Sundar Gaun\'s 16 infrastructure assets, we quantify the precise travel penalties, household isolations, and detour capacities when vehicular river transit is severed.',
    metrics: [
      {
        label: 'Normal Commute',
        value: '18 min',
        description: 'Direct vehicular transit via BR-02',
      },
      {
        label: 'Disrupted Detour',
        value: '51 min',
        description: '+33 min (+183%) via upper footbridge',
      },
      {
        label: 'Severed Population',
        value: '460 Residents',
        description: '95 households in Tallo Basti isolated',
      },
      {
        label: 'Scour Undercut',
        value: '1.8 Meters',
        description: 'Vertical foundation void below pier',
      },
    ],
    explanation: [
      'Topological isolation in mid-hill river valleys is rarely an abstract risk; it is governed by binary single-point failure nodes. In Sundar Gaun, the Khola River divides the southern farming settlement of Tallo Basti (460 residents, 95 households) from the civic and healthcare center in Ward 4. The Khola River Motor Bridge (BR-02), constructed in 2018 as a concrete beam structure, serves as the sole crossing capable of accommodating motorized vehicles, including four-wheel-drive emergency ambulances, tractor trailers, and agricultural freight jeeps.',
      'During the peak monsoon surge of late 2026, accelerated riverbed flow excavated an estimated 1.8-meter vertical scour hole beneath the downstream western pier footing, accompanied by longitudinal hairline fractures along the upstream abutment. Under municipal engineering standards aligned with Nepal NDRRMA guidelines, an undercut exceeding 1.2 meters beneath an unpiled pier pad mandates immediate vehicle weight restrictions or outright closure to prevent catastrophic deck displacement.',
      'Our deterministic Dijkstra shortest-path network simulation demonstrates the dramatic asymmetry between vehicular capacity and pedestrian redundancy. When BR-02 is removed from the active routing graph, Tallo Basti residents have only one secondary alternative: detouring eastward across unpaved hillside trails to the Upper Suspension Footbridge (BR-01). While BR-01 maintains sound structural cables and anchors, its 85-meter suspended steel deck is strictly pedestrian (1.5-tonne capacity), requiring all vehicle transit to halt entirely at the riverbank.',
    ],
    keyFindings: [
      '100% loss of direct vehicular access between Tallo Basti and the valley primary healthcare post upon BR-02 closure.',
      'One-way transit duration expands from 18 minutes to 51 minutes—a 33-minute penalty (+183% delay) over steep unpaved footpaths.',
      'Pedestrian detour across Upper Footbridge BR-01 forces travelers to climb an additional 45 meters of elevation over 22% grade slopes.',
      'Algorithmic repair sequencing proves that restoring BR-02 first re-establishes network connectivity 4.2x more efficiently than repairing secondary ridge footpaths.',
    ],
    communityImpact:
      'For the 95 agrarian families in Tallo Basti, bridge severance disrupts critical cash-crop supply chains. Cardamom, seasonal potatoes, and dairy produce cannot be evacuated to the main highway depot by pickup truck, resulting in post-harvest spoilage and localized price collapses. Furthermore, routine deliveries of cooking gas cylinders, subsidized fertilizer, and roofing tin must transition to arduous manual porterage, increasing freight costs by an estimated 45%. Schoolchildren commuting from Tallo Basti to Janakalyan Basic School must leave home 40 minutes earlier to negotiate the rocky detour before morning roll call.',
    methodology:
      'Topological graph simulation executed using Dijkstra shortest-path algorithms across the 14-node, 12-edge network of Sundar Gaun. Travel times calibrated at 15 km/h for motor vehicles on gravel roads, 3.2 km/h for pedestrians on standard paths, and 2.5 km/h for stretcher teams on steep inclines. Scour measurements and fissure telemetry extracted from Ward Sub-Engineer inspection logs dated Nov 20, 2026. Data points represent illustrative demonstration models for civic decision-support.',
    relatedIssueId: 'issue-bridge-b-scour',
    relatedIssueTitle: 'Pier Scour & Abutment Fissure at Khola Motor Bridge (BR-02)',
    relatedInfrastructureId: 'bridge-b',
    relatedInfrastructureName: 'Khola River Motor Bridge (BR-02)',
  },
  {
    id: 'landslide-trail-safety',
    aliases: ['trail-safety', 'ridge-trail-safety'],
    category: 'Disaster Risk & Geology',
    categoryFilter: 'community',
    categoryFilters: ['community', 'infrastructure', 'data'],
    title: 'Landslide and Trail Safety in Mountain Settlements',
    subtitle:
      'Evaluating slope stability, soil slumping, and pedestrian detour safety along the 18% gradient ridge trail connecting 120 households in Upallo Basti.',
    date: 'October 2026',
    readTime: '5 min read',
    author: 'Himalayan Slope Stability & Geotechnical Research Unit',
    authorAffiliation: 'GaunPulse Field Observation Collaboration',
    image: '/images/issues/ridge-trail.jpg',
    imageCaption:
      'Translational slope slump along the 18% gradient outer terrace shoulder of the Upallo Basti Ridge Trail.',
    location: 'North Terrace Ridge Trail (Edge-05), Ward 4',
    summary:
      'Mountain footpaths on steep weathered phyllite and schist slopes are highly vulnerable to shallow translational landslides during prolonged monsoon rainfall. This field brief documents the structural mechanics of a 20-meter shoulder slump along the Upallo Basti Ridge Trail. By combining citizen hazard telemetry with geotechnical cross-section surveys, we examine how early detection prevents catastrophic path failure and protects safe daily transit for 120 ridge households.',
    metrics: [
      {
        label: 'Path Width Loss',
        value: '55% Narrowed',
        description: 'Reduced from 1.8m to ~0.8m width',
      },
      {
        label: 'Slump Section',
        value: '20 Meters',
        description: 'Length of unstable terrace contour',
      },
      {
        label: 'Affected Ridge',
        value: '120 Families',
        description: '580 residents dependent on trail',
      },
      {
        label: 'Slope Gradient',
        value: '18% Incline',
        description: 'High-risk terrace drop-off zone',
      },
    ],
    explanation: [
      'High-altitude hamlet clusters in rural Nepal frequently depend on narrow hillside terraces carved along steep ridge contours. Upallo Basti, positioned at 1,480 meters elevation with 580 residents across 120 households, connects to the valley market and school via the North Terrace Ridge Trail. This unpaved pathway traverses weathered colluvial soil and fractured shale formations that lose shear strength when fully saturated.',
      'Following five consecutive days of late-monsoon precipitation, ground saturation triggered a shallow translational soil slump along terrace bend #4. The outer downhill shoulder slipped approximately 1.5 meters down-slope, narrowing the usable walking path from an original width of 1.8 meters down to a precarious 0.8 meters over a contiguous 20-meter stretch.',
      'While agile individual adults can continue to traverse the narrowed path in single file during daylight hours, the slump represents a prohibitive barrier for agricultural transport. Pack mules, hand carts, and heavily burdened porters cannot pass without severe slip-and-fall hazards along the exposed 18% incline shoulder. Without preventative intervention, surface runoff from uphill farming plots threatens to saturate the exposed slip plane, leading to full failure of the terrace bench.',
    ],
    keyFindings: [
      'Uncontrolled stormwater sheet-flow and lack of an uphill catch-water drain triggered 55% loss of usable trail corridor width.',
      'Pack animal and cart transit halted completely, blocking agricultural supply movements for 120 households.',
      'Citizen observation form filed within 24 hours of crack emergence enabled ward officials to post warning advisories before path collapse.',
      'Geotechnical audit recommends a 20-meter dry-stone retaining breast wall and interceptor drainage trench to prevent slope retreat.',
    ],
    communityImpact:
      'Upallo Basti residents face daily apprehension when sending children down the ridge trail to attend Shree Janakalyan Basic School. During foggy or rainy mornings, parents must accompany elementary students in single file across the 20-meter narrowed ledge. Additionally, cardamom and ginger farmers are forced to stockpile harvests in village barns or pay premium wages for manual backpack porters, reducing net farm household income during the critical autumn harvest window.',
    methodology:
      'Topographic slope profiling and slip plane geometry measured on-site by Ward Technical Assistant on Nov 20, 2026. Soil moisture saturation and shear resistance modeled using infinite slope equilibrium methods under saturated hill conditions. Resident population metrics verified against Ward 4 census registry. Illustrative demonstration brief for rural disaster mitigation.',
    relatedIssueId: 'issue-upallo-trail-slump',
    relatedIssueTitle: 'Upallo Basti Ridge Trail Soil Slump',
    relatedInfrastructureId: 'edge-upallo-ridge-trail',
    relatedInfrastructureName: 'Upallo Basti Ridge Trail (Edge-05)',
  },
  {
    id: 'healthcare-accessibility',
    aliases: ['healthcare-impact'],
    category: 'Public Health Logistics',
    categoryFilter: 'community',
    categoryFilters: ['community', 'policy', 'data'],
    title: 'Healthcare Accessibility During Infrastructure Disruptions',
    subtitle:
      'Quantifying ambulance delays, stretcher transfers, and emergency medical supply bottlenecks between southern settlements and the Ward 4 Health Post.',
    date: 'October 2026',
    readTime: '5 min read',
    author: 'Rural Health Logistics & Disaster Medicine Initiative',
    authorAffiliation: 'GaunPulse Health Logistics Research Desk',
    image: '/images/issues/clinic-retaining-wall.jpg',
    imageCaption:
      'Outward displacement (8cm) on the dry-stone terrace retaining wall supporting the Primary Health Post ambulance parking turnaround pad.',
    location: 'Sundar Gaun Primary Health Post, Ward 4',
    summary:
      'Access to emergency clinical care in rural Nepal hinges on fragile transport lifelines. The Sundar Gaun Primary Health Post provides the only birthing center and 24/7 on-call midwifery service for 1,040 valley residents. This study evaluates the compound health risks created when the southern river crossing suffers structural scour while the health post\'s own access ramp faces terrace wall bulging. We quantify the golden-hour delay impact and propose dual-tier emergency transfer protocols.',
    metrics: [
      {
        label: 'Baseline Transit',
        value: '18 min',
        description: 'Normal 4WD ambulance transit',
      },
      {
        label: 'Disrupted Transit',
        value: '51 min',
        description: '+33 min emergency stretcher delay',
      },
      {
        label: 'Transit Penalty',
        value: '+183%',
        description: 'Tripled travel time to clinic',
      },
      {
        label: 'Wall Bulge',
        value: '8 cm Deflection',
        description: 'Monitored retaining wall movement',
      },
    ],
    explanation: [
      'In global public health, the "Three Delays" framework identifies Phase 2—the physical travel time required to reach a qualified medical facility—as the most critical determinant of rural maternal, trauma, and pediatric mortality. In Sundar Gaun, the Primary Health Post in Ward 4 serves as the valley\'s lone medical station, staffed by four health workers providing 24/7 emergency labor delivery, infant immunization, and first-line trauma stabilization.',
      'Under baseline conditions, four-wheel-drive ambulances can reach Tallo Basti in approximately 18 minutes over gravel road corridors. However, when the Khola River Motor Bridge (BR-02) is closed due to foundation scour, motorized emergency transit ceases at the southern riverbank. Emergency patients must be transferred to manual stretchers (doko or canvas cots) and carried on foot across the Upper Suspension Bridge (BR-01) and up rocky hill tracks.',
      'Network traversal calculations show this transfer increases travel duration to 51 minutes—a 33-minute delay (+183%). For postpartum hemorrhages or acute respiratory distress, exceeding the 60-minute "golden hour" substantially heightens mortality risk. Simultaneously, an 8-centimeter outward bulge on the dry-stone retaining wall supporting the health post\'s ambulance pad poses a secondary compounding risk if heavy rain destabilizes the clinic parking spur.',
    ],
    keyFindings: [
      'Bridge closure nearly triples emergency clinic transit time from 18 to 51 minutes, violating clinical golden-hour protocols for maternal delivery.',
      'Manual stretcher transport over suspension footbridges requires 4 to 6 able-bodied carriers, placing severe strain on local community response during working hours.',
      'Secondary infrastructure degradation (8cm retaining wall bulge) requires preventative drainage weep-hole clearing to protect the ambulance turnaround pad.',
      'Pre-positioning emergency obstetric kits and trained community health workers in Tallo Basti reduces reliance on single-bridge crossings.',
    ],
    communityImpact:
      'The 460 residents of Tallo Basti bear the brunt of emergency healthcare severance. Expectant mothers in their third trimester often choose to relocate to relatives\' homes across the river weeks before anticipated delivery dates out of fear of getting trapped behind swollen monsoon torrents. Routine vaccine distribution and cold-chain maintenance for infants also experience delays whenever medical supply jeeps cannot cross the river corridor.',
    methodology:
      'Emergency transit durations modeled using Dijkstra shortest-path calculations calibrated with local health post logs. Ambulance speeds estimated at 15 km/h on unpaved roads; stretcher teams estimated at 2.5 km/h on uneven trails. Retaining wall displacement measured via plumb-line alignment surveys by clinic personnel on Nov 21, 2026. Demonstration research brief for health infrastructure resilience.',
    relatedIssueId: 'issue-health-retaining-wall',
    relatedIssueTitle: 'Health Post Terrace Retaining Wall Bulge',
    relatedInfrastructureId: 'facility-health',
    relatedInfrastructureName: 'Sundar Gaun Primary Health Post',
  },
  {
    id: 'community-infrastructure-monitoring',
    aliases: ['school-accessibility', 'community-reporting'],
    category: 'Civic Governance & Audit',
    categoryFilter: 'policy',
    categoryFilters: ['policy', 'community', 'data'],
    title: 'Community-Based Infrastructure Monitoring',
    subtitle:
      'Assessing how grassroots reporting and structured 6-stage municipal verification accelerate maintenance response for critical culverts and school routes.',
    date: 'October 2026',
    readTime: '4 min read',
    author: 'CivicTech Field Lab & Municipal Governance Initiative',
    authorAffiliation: 'GaunPulse Public Oversight Group',
    image: '/images/issues/school-culvert.jpg',
    imageCaption:
      'Monsoon gravel wash and tree branch debris clogging the 600mm cross-drainage culvert on the Janakalyan School incline.',
    location: 'Janakalyan School Trail (Edge-02), Ward 3',
    summary:
      'Small drainage failures and minor culvert obstructions frequently escalate into catastrophic trail washouts if left unaddressed across consecutive monsoon rains. This paper examines the operational impact of GaunPulse\'s 6-stage lifecycle tracking through the case study of a silted 600mm masonry culvert on the access path to Shree Janakalyan Basic School. We evaluate how citizen-initiated reporting shortens municipal verification turnaround and builds transparent public audit trails.',
    metrics: [
      {
        label: 'Verification Speed',
        value: '< 48 Hours',
        description: 'From citizen submission to on-site audit',
      },
      {
        label: 'Audit Lifecycle',
        value: '6 Stages',
        description: 'End-to-end transparent governance',
      },
      {
        label: 'Protected School',
        value: '160 Students',
        description: 'Daily elementary school commuters',
      },
      {
        label: 'Verification Rate',
        value: '75% Validated',
        description: '3 of 4 active community submissions',
      },
    ],
    explanation: [
      'In conventional rural municipal operations, minor infrastructure hazards—such as clogged drainage culverts, loose bridge decking, or shoulder erosion—often escape municipal engineering attention until catastrophic failure occurs. In Sundar Gaun, Shree Janakalyan Basic School educates 160 students from grades 1 through 8. Daily pedestrian access relies on a 240-meter gravel incline path equipped with a 600mm concrete pipe cross-drainage culvert.',
      'During severe monsoon rainfall on November 17, upstream erosion carried tree branches and gravel into the culvert mouth, filling 80% of the pipe capacity. Blocked stormwater overflowed across the road surface, eroding deep drainage ruts and turning the approach into a slick mud hazard for young students. Rather than waiting for annual budget cycles, the school head teacher logged an incident report with geotagged photos through GaunPulse.',
      'The platform\'s structured 6-stage audit lifecycle (Intake $\\to$ Review $\\to$ Verification $\\to$ Proposal $\\to$ Execution $\\to$ Resolution) created an immutable, public paper trail. Within 48 hours, the Ward Road Overseer conducted an on-site inspection, confirming the culvert pipe was structurally intact and requiring only sediment excavation. A work order of Rs. 45,000 was submitted for immediate ward allocation.',
    ],
    keyFindings: [
      'Grassroots photo telemetry compressed municipal engineering triage from several months to under 48 hours.',
      'Early culvert desiltation and trash-rack installation averted road shoulder reconstruction costs estimated at 12x the preventative expense.',
      '75% of active community incident reports in Sundar Gaun advanced through formal field verification by sub-engineers within two days.',
      'Public verification status visibility prevents community misinformation and reinforces trust between citizens and ward authorities.',
    ],
    communityImpact:
      'Swift resolution of the drainage culvert obstruction directly protects the daily education of 160 students. Elementary children, many walking without waterproof footwear, avoid waterlogged conditions and slick mud slips on the 14% school approach slope. In addition, transparent audit logging encouraged the school parents\' committee to organize a half-day volunteer Shramdaan to clear upstream brush debris, exemplifying proactive community stewardship.',
    methodology:
      'Audit log telemetry, timestamped inspector verification notes, and lifecycle stage transitions extracted from the GaunPulse Issue Registry (`src/data/demoVillage.js`). Student enrollment and attendance records provided by Shree Janakalyan Basic School administration. Field data points represent illustrative demonstration models for civic technology research.',
    relatedIssueId: 'issue-school-culvert',
    relatedIssueTitle: 'School Incline Drainage Pipe Obstruction',
    relatedInfrastructureId: 'facility-school',
    relatedInfrastructureName: 'Shree Janakalyan Basic School',
  },
];

/**
 * Helper to fetch article by primary ID or any legacy alias.
 */
export function getArticleById(id) {
  if (!id) return null;
  const normalized = id.toLowerCase().trim();
  return (
    RESEARCH_ARTICLES.find(
      (art) => art.id === normalized || (art.aliases && art.aliases.includes(normalized))
    ) || null
  );
}

/**
 * Returns all research articles.
 */
export function getAllArticles() {
  return RESEARCH_ARTICLES;
}

/**
 * Returns related articles excluding the specified article ID.
 */
export function getRelatedArticles(currentId, count = 3) {
  const current = getArticleById(currentId);
  return RESEARCH_ARTICLES.filter((art) => art.id !== (current ? current.id : currentId)).slice(
    0,
    count
  );
}
