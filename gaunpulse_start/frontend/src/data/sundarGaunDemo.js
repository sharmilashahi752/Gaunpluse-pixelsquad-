/**
 * GaunPulse Sundar Gaun Demonstration Dataset & Deterministic Graph Engine
 * 
 * Fictional civic-tech demonstration village used for municipal impact simulation training,
 * disaster preparedness exercises, and fallback demonstrations when live municipal networks
 * are unassigned or incomplete.
 * 
 * ALL DATA IS FICTIONAL AND ILLUSTRATIVE.
 */

export const SUNDAR_GAUN_METADATA = {
  id: 'demo-sundar-gaun',
  name: 'Sundar Gaun (सुन्दर गाउँ)',
  municipality: 'Mid-Hills Demonstration Valley',
  ward_no: '3 & 4',
  district: 'Bagmati Demonstration Area',
  province: 'Bagmati Province',
  center_lat: 27.8852,
  center_lng: 85.3448,
  latitude: 27.8852,
  longitude: 85.3448,
  is_demo: true,
  status: 'active',
  description: 'Fictional mid-hills demonstration valley with two settlements divided by the Khola River gorge, connected via a motor bridge and an upper suspension footbridge.',
};

export const DEMO_NODES = {
  'node-tallo-basti': {
    id: 'node-tallo-basti',
    name: 'Tallo Basti Center',
    latitude: 27.8798,
    longitude: 85.3395,
    node_type: 'settlement',
    households: 95,
    population: 460,
    ward: 'Ward 3',
    description: 'Southern valley terrace settlement (95 households, ~460 residents). Relies on Bridge B for motor vehicles reaching the clinic and market.',
  },
  'node-junc-south': {
    id: 'node-junc-south',
    name: 'South Valley Road Junction',
    latitude: 27.8816,
    longitude: 85.3422,
    node_type: 'junction',
    description: 'Key junction dividing traffic between the lower motor bridge and the arduous west ridge trail.',
  },
  'node-bridge-b-south': {
    id: 'node-bridge-b-south',
    name: 'South Gorge Bridge Approach',
    latitude: 27.8828,
    longitude: 85.3438,
    node_type: 'bridge_abutment',
    description: 'Southern concrete abutment of Khola River Motor Bridge.',
  },
  'node-bridge-b-north': {
    id: 'node-bridge-b-north',
    name: 'North Bank Crossing Point',
    latitude: 27.8838,
    longitude: 85.3452,
    node_type: 'bridge_abutment',
    description: 'Northern abutment connecting to the central bazaar corridor.',
  },
  'node-junc-central': {
    id: 'node-junc-central',
    name: 'Bazaar & Ward Center Junction',
    latitude: 27.8852,
    longitude: 85.3468,
    node_type: 'junction',
    description: 'Central commercial and administrative hub connecting the ward office, clinic road, and school track.',
  },
  'node-health-post': {
    id: 'node-health-post',
    name: 'Sundar Gaun Primary Health Post',
    latitude: 27.8859,
    longitude: 85.3498,
    node_type: 'health_post',
    description: 'Sole primary healthcare and maternity clinic in the valley. 24/7 on-call midwife and basic emergency stabilization.',
  },
  'node-school': {
    id: 'node-school',
    name: 'Shree Janakalyan Basic School',
    latitude: 27.8872,
    longitude: 85.3452,
    node_type: 'school',
    description: 'Central community school (Grades 1-8, 160 students). Daily commute for students from both Tallo and Upallo Basti.',
  },
  'node-junc-north': {
    id: 'node-junc-north',
    name: 'North Ridge Junction',
    latitude: 27.8886,
    longitude: 85.3438,
    node_type: 'junction',
    description: 'Trail junction linking the school campus to the upper suspension footbridge.',
  },
  'node-bridge-a-east': {
    id: 'node-bridge-a-east',
    name: 'Upper Suspension Bridge (East Tower)',
    latitude: 27.8893,
    longitude: 85.3431,
    node_type: 'bridge_abutment',
    description: 'Eastern tower anchor of the Upper Suspension Footbridge.',
  },
  'node-bridge-a-west': {
    id: 'node-bridge-a-west',
    name: 'Upper Suspension Bridge (West Tower)',
    latitude: 27.8892,
    longitude: 85.3415,
    node_type: 'bridge_abutment',
    description: 'Western tower anchor linking Upallo Basti to the gorge crossing.',
  },
  'node-upallo-basti': {
    id: 'node-upallo-basti',
    name: 'Upallo Basti Ridge Center',
    latitude: 27.8912,
    longitude: 85.3398,
    node_type: 'settlement',
    households: 120,
    population: 580,
    ward: 'Ward 4',
    description: 'High ridge community (120 households, ~580 residents). Dependent on Upper Suspension Footbridge for pedestrian access to school and clinic.',
  },
  'node-detour-south': {
    id: 'node-detour-south',
    name: 'Old Riverbed Ford Track',
    latitude: 27.8808,
    longitude: 85.3462,
    node_type: 'junction',
    description: 'Winter-only seasonal dry riverbed crossing. Impassable during monsoon flows.',
  },
};

export const DEMO_EDGES = [
  {
    id: 'edge-tallo-road',
    name: 'Tallo Basti Valley Road',
    source_node_id: 'node-tallo-basti',
    target_node_id: 'node-junc-south',
    infrastructure_type: 'road',
    subtype: 'gravel_road',
    travel_minutes: 5,
    length_meters: 380,
    condition: 'Operational / Fair',
    surface_type: 'Compacted gravel & stone pitching',
    status: 'operational',
    geometry: [
      [27.8798, 85.3395],
      [27.8807, 85.3408],
      [27.8816, 85.3422],
    ],
    notes: 'Main valley access road connecting lower village households to the bridge junction.',
  },
  {
    id: 'edge-bridge-b-approach',
    name: 'South Bridge Access Approach',
    source_node_id: 'node-junc-south',
    target_node_id: 'node-bridge-b-south',
    infrastructure_type: 'road',
    subtype: 'paved_road',
    travel_minutes: 3,
    length_meters: 220,
    condition: 'Operational',
    surface_type: 'Asphalt & concrete drainage',
    status: 'operational',
    geometry: [
      [27.8816, 85.3422],
      [27.8821, 85.3429],
      [27.8828, 85.3438],
    ],
    notes: 'Paved descent approach road leading to Khola River Motor Bridge.',
  },
  {
    id: 'edge-bridge-b',
    name: 'Khola River Motor Bridge (BR-02)',
    source_node_id: 'node-bridge-b-south',
    target_node_id: 'node-bridge-b-north',
    infrastructure_type: 'bridge',
    subtype: 'concrete_motorable_bridge',
    edge_code: 'BR-02',
    bridge_code: 'BR-02',
    travel_minutes: 2,
    length_meters: 38,
    condition: 'Critical Pier Scour Alert',
    surface_type: 'Reinforced concrete girder',
    status: 'blocked',
    is_critical: true,
    geometry: [
      [27.8828, 85.3438],
      [27.8833, 85.3445],
      [27.8838, 85.3452],
    ],
    notes: 'Sole heavy vehicular and ambulance bridge across the Khola River. Southern pier footing suffered 1.8m vertical scour after flood surge.',
  },
  {
    id: 'edge-corridor-central',
    name: 'North Bank Central Corridor',
    source_node_id: 'node-bridge-b-north',
    target_node_id: 'node-junc-central',
    infrastructure_type: 'road',
    subtype: 'paved_road',
    travel_minutes: 4,
    length_meters: 310,
    condition: 'Operational',
    surface_type: 'Asphalt paving',
    status: 'operational',
    geometry: [
      [27.8838, 85.3452],
      [27.8845, 85.3460],
      [27.8852, 85.3468],
    ],
    notes: 'Central commercial and civic avenue serving local bazaars and municipal services.',
  },
  {
    id: 'edge-health-access',
    name: 'Health Post Clinic Road',
    source_node_id: 'node-junc-central',
    target_node_id: 'node-health-post',
    infrastructure_type: 'road',
    subtype: 'paved_road',
    travel_minutes: 4,
    length_meters: 290,
    condition: 'Operational',
    surface_type: 'Concrete paving',
    status: 'operational',
    geometry: [
      [27.8852, 85.3468],
      [27.8856, 85.3482],
      [27.8859, 85.3498],
    ],
    notes: 'Paved spur road terminating at Sundar Gaun Primary Health Post and maternity unit.',
  },
  {
    id: 'edge-school-track',
    name: 'School Hillock Access Road',
    source_node_id: 'node-junc-central',
    target_node_id: 'node-school',
    infrastructure_type: 'road',
    subtype: 'gravel_road',
    travel_minutes: 4,
    length_meters: 280,
    condition: 'Operational',
    surface_type: 'Graded stone & gravel',
    status: 'operational',
    geometry: [
      [27.8852, 85.3468],
      [27.8861, 85.3460],
      [27.8872, 85.3452],
    ],
    notes: 'Daily pedestrian and vehicular access route leading up to Shree Janakalyan Basic School.',
  },
  {
    id: 'edge-north-ridge-road',
    name: 'North Ridge Connector Track',
    source_node_id: 'node-school',
    target_node_id: 'node-junc-north',
    infrastructure_type: 'road',
    subtype: 'dirt_track',
    travel_minutes: 5,
    length_meters: 320,
    condition: 'Operational',
    surface_type: 'Earthen trail',
    status: 'operational',
    geometry: [
      [27.8872, 85.3452],
      [27.8879, 85.3445],
      [27.8886, 85.3438],
    ],
    notes: 'Walking path connecting the school campus to the northern suspension bridge.',
  },
  {
    id: 'edge-bridge-a',
    name: 'Upper Suspension Footbridge (BR-01)',
    source_node_id: 'node-bridge-a-east',
    target_node_id: 'node-bridge-a-west',
    infrastructure_type: 'bridge',
    subtype: 'suspension_footbridge',
    edge_code: 'BR-01',
    bridge_code: 'BR-01',
    travel_minutes: 3,
    length_meters: 92,
    condition: 'Operational / Stable',
    surface_type: 'Steel deck with wire-rope stays',
    status: 'operational',
    is_critical: false,
    geometry: [
      [27.8893, 85.3431],
      [27.88925, 85.3423],
      [27.8892, 85.3415],
    ],
    notes: 'Pedestrian cable suspension footbridge spanning 92m across the upper gorge. Fully operational.',
  },
  {
    id: 'edge-bridge-a-junction-link',
    name: 'East Tower Link Trail',
    source_node_id: 'node-junc-north',
    target_node_id: 'node-bridge-a-east',
    infrastructure_type: 'road',
    subtype: 'walking_trail',
    travel_minutes: 2,
    length_meters: 140,
    condition: 'Operational',
    surface_type: 'Stone steps',
    status: 'operational',
    geometry: [
      [27.8886, 85.3438],
      [27.8893, 85.3431],
    ],
    notes: 'Paved steps linking North Ridge Junction to Bridge A eastern tower.',
  },
  {
    id: 'edge-upallo-ridge-trail',
    name: 'Upallo Basti Ridge Trail',
    source_node_id: 'node-bridge-a-west',
    target_node_id: 'node-upallo-basti',
    infrastructure_type: 'road',
    subtype: 'walking_trail',
    travel_minutes: 6,
    length_meters: 420,
    condition: 'Operational / Monitored',
    surface_type: 'Stone steps & dirt path',
    status: 'operational',
    geometry: [
      [27.8892, 85.3415],
      [27.8901, 85.3408],
      [27.8912, 85.3398],
    ],
    notes: 'High ridge footpath connecting Upallo Basti to the upper bridge.',
  },
  {
    id: 'edge-west-ridge-trail',
    name: 'West Ridge Mountain Trail',
    source_node_id: 'node-junc-south',
    target_node_id: 'node-bridge-a-west',
    infrastructure_type: 'road',
    subtype: 'mountain_trail',
    travel_minutes: 28,
    length_meters: 1450,
    condition: 'Arduous Pedestrian Detour',
    surface_type: 'High mountain contour trail with rock steps',
    status: 'operational',
    geometry: [
      [27.8816, 85.3422],
      [27.8842, 85.3402],
      [27.8868, 85.3408],
      [27.8892, 85.3415],
    ],
    notes: 'Steep contour footpath across the western canyon wall. Functions as an emergency pedestrian bypass when lower river crossings are blocked.',
  },
  {
    id: 'edge-detour-track',
    name: 'Seasonal Riverbed Detour Track',
    source_node_id: 'node-junc-south',
    target_node_id: 'node-detour-south',
    infrastructure_type: 'road',
    subtype: 'seasonal_trail',
    travel_minutes: 10,
    length_meters: 650,
    condition: 'Dry Season Only',
    surface_type: 'Bouldered river terrace',
    status: 'operational',
    geometry: [
      [27.8816, 85.3422],
      [27.8811, 85.3440],
      [27.8808, 85.3462],
    ],
    notes: 'Emergency winter path along the lower gravel bank; submerged during monsoon rains.',
  },
];

export const DEMO_ISSUES = [
  {
    id: 'issue-bridge-b-scour',
    title: 'Pier Scour & Abutment Fissure (BR-02)',
    description: 'High monsoon water velocity excavated a 1.8m scour hole beneath the southern pier footer of Khola River Motor Bridge. Longitudinal cracking observed on upstream abutment face.',
    category: 'bridge',
    severity: 'critical',
    status: 'field_verified',
    latitude: 27.8833,
    longitude: 85.3445,
    tracking_code: 'GP-DEMO-BR02',
    edge_id: 'edge-bridge-b',
  },
];

export const DEMO_SCENARIO_PRESETS = [
  {
    id: 'motor_bridge_failure',
    name: '1. Motor bridge failure (BR-02 closure)',
    description: 'Foundation pier scour shuts down the vehicular bridge. Motor vehicles/ambulances cut off; pedestrians must use arduous 28-min ridge detour.',
    blocked_edge_ids: ['edge-bridge-b'],
    primary_failed_edge_id: 'edge-bridge-b',
    scenario_type: 'complete_closure',
  },
  {
    id: 'suspension_bridge_failure',
    name: '2. Suspension footbridge failure (BR-01 closure)',
    description: 'Cable anchor failure disables the Upper Suspension Footbridge. High ridge residents (120 households) lose direct crossing to school and clinic.',
    blocked_edge_ids: ['edge-bridge-a'],
    primary_failed_edge_id: 'edge-bridge-a',
    scenario_type: 'structural_closure',
  },
  {
    id: 'landslide_road',
    name: '3. Landslide blocking North Bank Central Corridor',
    description: 'Monsoon slope failure covers North Bank Central Corridor with boulders, blocking the main avenue between river crossings, school, and health post.',
    blocked_edge_ids: ['edge-corridor-central'],
    primary_failed_edge_id: 'edge-corridor-central',
    scenario_type: 'landslide',
  },
  {
    id: 'flood_crossing',
    name: '4. Flood-related crossing closure (Bridge & Ford submerged)',
    description: 'Monsoon flash flood overtopping closes Khola River Motor Bridge (BR-02) and renders the lower riverbed ford impassable.',
    blocked_edge_ids: ['edge-bridge-b', 'edge-detour-track'],
    primary_failed_edge_id: 'edge-bridge-b',
    scenario_type: 'monsoon_flood',
  },
  {
    id: 'dual_bridge_closure',
    name: '5. Both bridges unavailable (Dual gorge closure)',
    description: 'Catastrophic dual failure: Both Upper Footbridge (BR-01) and Motor Bridge (BR-02) are closed. Settlements on the west bank are completely isolated from health post and school!',
    blocked_edge_ids: ['edge-bridge-a', 'edge-bridge-b'],
    primary_failed_edge_id: 'edge-bridge-b',
    scenario_type: 'complete_closure',
  },
];

/**
 * Returns complete village network data conforming to InteractiveVillageMap and SimulationsPage format.
 */
export function getSundarGaunNetworkData() {
  const nodes = Object.values(DEMO_NODES).map((node) => ({
    id: node.id,
    name: node.name,
    latitude: node.latitude,
    longitude: node.longitude,
    node_type: node.node_type,
    type: node.node_type,
    households: node.households || 0,
    population: node.population || 0,
    description: node.description,
    verification_status: 'demonstration_dataset',
    source: 'Sundar Gaun CivicTech Model',
  }));

  const edges = DEMO_EDGES.map((edge) => ({
    id: edge.id,
    name: edge.name,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    infrastructure_type: edge.infrastructure_type,
    type: edge.infrastructure_type,
    subtype: edge.subtype,
    edge_code: edge.edge_code || edge.id,
    travel_minutes: edge.travel_minutes,
    length_meters: edge.length_meters,
    status: edge.status,
    surface_type: edge.surface_type,
    geometry: edge.geometry,
    notes: edge.notes,
    provenance_source: 'Sundar Gaun Model',
    verification_status: 'demonstration_dataset',
  }));

  return {
    village: { ...SUNDAR_GAUN_METADATA },
    readiness: {
      status: 'simulation_ready_sample',
      can_simulate: true,
      routing_metric: 'travel_minutes',
      source: ['Sundar Gaun CivicTech Fictional Dataset'],
      last_updated_at: new Date().toISOString(),
      graph_version: 'v1.2.0-civic-sundar',
      errors: [],
      experimental: false,
    },
    nodes,
    edges,
    issues: DEMO_ISSUES,
  };
}

/**
 * Dijkstra shortest path implementation
 */
function dijkstraShortestPath(nodes, edges, startNodeId, targetNodeId, blockedEdgeIds = []) {
  if (startNodeId === targetNodeId) {
    return { pathFound: true, totalMinutes: 0, nodePath: [startNodeId], edgePath: [] };
  }

  const blockedSet = new Set((blockedEdgeIds || []).map(String));
  const graph = {};

  Object.keys(nodes).forEach((id) => {
    graph[id] = [];
  });

  edges.forEach((edge) => {
    if (blockedSet.has(String(edge.id))) return;
    if (!graph[edge.source_node_id] || !graph[edge.target_node_id]) return;

    const weight = Math.max(0.5, Number(edge.travel_minutes) || 1);
    graph[edge.source_node_id].push({ target: edge.target_node_id, edgeId: edge.id, weight });
    graph[edge.target_node_id].push({ target: edge.source_node_id, edgeId: edge.id, weight });
  });

  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph));

  Object.keys(graph).forEach((id) => {
    distances[id] = Infinity;
    previous[id] = null;
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let minDistance = Infinity;

    unvisited.forEach((id) => {
      if (distances[id] < minDistance) {
        minDistance = distances[id];
        current = id;
      }
    });

    if (!current || minDistance === Infinity) break;
    if (current === targetNodeId) break;

    unvisited.delete(current);

    (graph[current] || []).forEach((neighbor) => {
      if (!unvisited.has(neighbor.target)) return;
      const alt = distances[current] + neighbor.weight;
      if (alt < distances[neighbor.target]) {
        distances[neighbor.target] = alt;
        previous[neighbor.target] = { nodeId: current, edgeId: neighbor.edgeId };
      }
    });
  }

  if (distances[targetNodeId] === Infinity || !previous[targetNodeId]) {
    return { pathFound: false, totalMinutes: null, nodePath: [], edgePath: [] };
  }

  const nodePath = [];
  const edgePath = [];
  let curr = targetNodeId;

  while (curr !== startNodeId) {
    nodePath.unshift(curr);
    const prevInfo = previous[curr];
    if (!prevInfo) break;
    edgePath.unshift(prevInfo.edgeId);
    curr = prevInfo.nodeId;
  }
  nodePath.unshift(startNodeId);

  return {
    pathFound: true,
    totalMinutes: distances[targetNodeId],
    nodePath,
    edgePath,
  };
}

/**
 * Runs a full topological network simulation for Sundar Gaun
 */
export function runSundarGaunSimulation({
  blockedEdgeIds = [],
  scenarioType = 'complete_closure',
  scenarioName = '',
}) {
  const rawBlocked = Array.isArray(blockedEdgeIds) ? blockedEdgeIds : [blockedEdgeIds];
  const sanitizedBlocked = rawBlocked.filter(Boolean).map(String);

  const settlements = [
    {
      id: 'settlement-tallo',
      nodeId: 'node-tallo-basti',
      name: 'Tallo Basti',
      households: 95,
      population: 460,
    },
    {
      id: 'settlement-upallo',
      nodeId: 'node-upallo-basti',
      name: 'Upallo Basti',
      households: 120,
      population: 580,
    },
  ];

  const facilities = [
    {
      id: 'facility-health',
      nodeId: 'node-health-post',
      name: 'Sundar Gaun Primary Health Post',
      type: 'health_post',
    },
    {
      id: 'facility-school',
      nodeId: 'node-school',
      name: 'Shree Janakalyan Basic School',
      type: 'school',
    },
  ];

  const comparisons = [];
  const isolatedSettlementIds = new Set();
  const detourSettlementIds = new Set();
  const affectedFacilities = new Set();
  const alternativeEdgeIds = new Set();
  const baselineEdgeIds = new Set();
  let maxTimeIncrease = 0;

  settlements.forEach((settlement) => {
    facilities.forEach((facility) => {
      // 1. Calculate baseline path (0 blocked edges)
      const baseline = dijkstraShortestPath(DEMO_NODES, DEMO_EDGES, settlement.nodeId, facility.nodeId, []);
      // 2. Calculate scenario path (with blocked edges)
      const scenario = dijkstraShortestPath(DEMO_NODES, DEMO_EDGES, settlement.nodeId, facility.nodeId, sanitizedBlocked);

      baseline.edgePath.forEach((id) => baselineEdgeIds.add(id));

      let status = 'unchanged';
      let deltaMinutes = 0;

      if (!scenario.pathFound) {
        status = 'unreachable';
        isolatedSettlementIds.add(settlement.nodeId);
        affectedFacilities.add(facility.name);
      } else if (scenario.totalMinutes > baseline.totalMinutes) {
        status = 'detour';
        deltaMinutes = scenario.totalMinutes - baseline.totalMinutes;
        if (deltaMinutes > maxTimeIncrease) maxTimeIncrease = deltaMinutes;
        detourSettlementIds.add(settlement.nodeId);
        affectedFacilities.add(facility.name);
        scenario.edgePath.forEach((id) => alternativeEdgeIds.add(id));
      }

      const baselineNodeLabels = baseline.nodePath.map((nid) => DEMO_NODES[nid]?.name || nid);
      const scenarioNodeLabels = scenario.nodePath.map((nid) => DEMO_NODES[nid]?.name || nid);

      comparisons.push({
        settlement: settlement.name,
        settlement_id: settlement.nodeId,
        facility: facility.name,
        facility_id: facility.nodeId,
        facility_type: facility.type,
        before_value: baseline.totalMinutes,
        after_value: scenario.totalMinutes,
        delta_minutes: deltaMinutes,
        routing_metric: 'travel_minutes',
        unit: 'minutes',
        status,
        baseline_path: baselineNodeLabels,
        alternative_path: scenario.pathFound ? scenarioNodeLabels : null,
        baseline_edge_ids: baseline.edgePath,
        alternative_edge_ids: scenario.edgePath,
      });
    });
  });

  // Calculate affected households
  let totalAffectedHouseholds = 0;
  if (isolatedSettlementIds.has('node-tallo-basti') || detourSettlementIds.has('node-tallo-basti')) {
    totalAffectedHouseholds += 95;
  }
  if (isolatedSettlementIds.has('node-upallo-basti') || detourSettlementIds.has('node-upallo-basti')) {
    totalAffectedHouseholds += 120;
  }

  // Assess vehicular vs pedestrian access
  const isBR02Blocked = sanitizedBlocked.includes('edge-bridge-b');
  const isBR01Blocked = sanitizedBlocked.includes('edge-bridge-a');
  let motorAccessStatus = 'Intact';
  let pedestrianAccessStatus = 'Intact';

  if (isBR02Blocked && isBR01Blocked) {
    motorAccessStatus = 'Completely severed (All crossings down)';
    pedestrianAccessStatus = 'Completely severed across river gorge';
  } else if (isBR02Blocked) {
    motorAccessStatus = 'Severed — Ambulances and trucks cannot cross river to Tallo Basti';
    pedestrianAccessStatus = 'Preserved via arduous West Ridge Footpath (+28 min)';
  } else if (isBR01Blocked) {
    motorAccessStatus = 'Intact via Khola River Motor Bridge';
    pedestrianAccessStatus = 'Disrupted for high ridge school commute (+31 min detour)';
  }

  // Generate plain-language summary explanation
  let summary = '';
  if (sanitizedBlocked.length === 0) {
    summary = 'Baseline network operational. All settlements maintain direct access to health clinic and community school.';
  } else if (isBR02Blocked && isBR01Blocked) {
    summary = 'CRITICAL DISASTER: Simultaneous closure of Khola River Motor Bridge (BR-02) and Upper Suspension Footbridge (BR-01) creates complete topological division of Sundar Gaun. Both Tallo Basti (95 HH) and Upallo Basti (120 HH) are totally cut off from the Primary Health Post and Shree Janakalyan Basic School. 215 households have zero emergency or pedestrian access across the river gorge.';
  } else if (isBR02Blocked) {
    summary = 'Closure of Khola River Motor Bridge (BR-02) completely eliminates motorized vehicular access for Tallo Basti (95 households, ~460 residents). Emergency ambulances cannot reach the settlement. Pedestrians can only reach the Health Post via the steep 28-minute West Ridge Mountain Trail and Upper Footbridge, tripling travel time from 18 min to 51 min (+33 min detour).';
  } else if (isBR01Blocked) {
    summary = 'Closure of Upper Suspension Footbridge (BR-01) cuts off the primary pedestrian corridor for Upallo Basti (120 households, ~580 residents). Students commuting to Janakalyan Basic School must hike 28 minutes down the western ridge and cross the lower motor bridge, increasing school transit from 16 min to 47 min (+31 min detour).';
  } else {
    summary = `Simulated closure of ${sanitizedBlocked.length} link(s) disrupts access for ${totalAffectedHouseholds} households. Travel time increases up to +${maxTimeIncrease} minutes for affected routes.`;
  }

  const blockedEdgesInfo = DEMO_EDGES.filter((e) => sanitizedBlocked.includes(e.id)).map((e) => ({
    id: e.id,
    name: e.name,
    type: e.infrastructure_type,
    surface_type: e.surface_type,
    status: 'simulated_blocked',
    travel_minutes: e.travel_minutes,
    length_meters: e.length_meters,
    notes: e.notes,
  }));

  const envelope = {
    id: `demo-${Date.now()}`,
    village_id: 'demo-sundar-gaun',
    failed_edge_id: sanitizedBlocked[0] || null,
    scenario_type: scenarioType,
    scenario_name: scenarioName,
    blocked_edge_ids: sanitizedBlocked,
    is_demo: true,
    verification_level: 'fictional_demonstration_model',
    routing_metric: 'travel_minutes',
    result: {
      failed_edge_id: sanitizedBlocked[0] || null,
      blocked_edge_ids: sanitizedBlocked,
      blocked_edges_info: blockedEdgesInfo,
      affected_households: totalAffectedHouseholds,
      household_estimate_complete: true,
      isolated_settlements: Array.from(isolatedSettlementIds).map((id) => ({
        settlement_id: id,
        settlement_name: DEMO_NODES[id]?.name || id,
        households: DEMO_NODES[id]?.households || 0,
      })),
      detour_settlements: Array.from(detourSettlementIds).map((id) => ({
        settlement_id: id,
        settlement_name: DEMO_NODES[id]?.name || id,
        households: DEMO_NODES[id]?.households || 0,
        delay_minutes: maxTimeIncrease,
      })),
      essential_facilities_affected: Array.from(affectedFacilities),
      max_travel_time_increase_minutes: maxTimeIncrease,
      motor_vehicle_access: motorAccessStatus,
      pedestrian_access: pedestrianAccessStatus,
      access_comparisons: comparisons,
      summary_explanation: summary,
      data_quality: 'simulation_ready_sample',
      graph_version: 'v1.2.0-civic-sundar',
      routing_metric: 'travel_minutes',
      unit: 'minutes',
      calculation_timestamp: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };

  return envelope;
}

/**
 * Compares repairing BR-01 (Upper Suspension Footbridge) vs BR-02 (Khola River Motor Bridge)
 * under a dual bridge disruption baseline.
 */
export function compareSundarGaunRepairs({
  optionAEdgeId = 'edge-bridge-a',
  optionBEdgeId = 'edge-bridge-b',
} = {}) {
  // Dual-failure baseline: both bridges blocked
  const dualBlocked = ['edge-bridge-a', 'edge-bridge-b'];

  // Scenario A: Repair BR-01 (BR-02 remains closed)
  const simA = runSundarGaunSimulation({
    blockedEdgeIds: ['edge-bridge-b'],
    scenarioName: 'Repair Upper Suspension Footbridge (BR-01) First',
  });

  // Scenario B: Repair BR-02 (BR-01 remains closed)
  const simB = runSundarGaunSimulation({
    blockedEdgeIds: ['edge-bridge-a'],
    scenarioName: 'Repair Khola River Motor Bridge (BR-02) First',
  });

  return {
    village_id: 'demo-sundar-gaun',
    baseline_disruption: 'Simultaneous Failure of BR-01 (Footbridge) & BR-02 (Motor Bridge)',
    baseline_blocked_edges: dualBlocked,
    scenario_a: {
      scenario_name: 'Option A: Restore Upper Suspension Footbridge (BR-01)',
      target_asset: 'Upper Suspension Footbridge (BR-01)',
      edge_id: 'edge-bridge-a',
      asset_type: 'Pedestrian Suspension Bridge',
      households_regaining_access: 120, // Upallo Basti
      facilities_restored: 2, // School & Health Post
      restored_routes_count: 2,
      route_improvement_value: 31,
      route_improvement_unit: 'minutes saved for school students',
      remaining_affected_households: 95, // Tallo Basti still lacks motor bridge
      emergency_vehicle_access: false,
      motor_ambulance_connectivity: 'NO — Footbridge only; ambulances cannot cross',
      key_beneficiary: '160 School children & 120 ridge farming households',
      trade_off_analysis: 'Restores rapid, safe pedestrian passage for students commuting to Janakalyan Basic School (saving +31 min per trip) and reconnects Upallo Basti directly. However, motor vehicles and ambulances cannot cross, leaving Tallo Basti dependent on stretcher carries.',
    },
    scenario_b: {
      scenario_name: 'Option B: Restore Khola River Motor Bridge (BR-02)',
      target_asset: 'Khola River Motor Bridge (BR-02)',
      edge_id: 'edge-bridge-b',
      asset_type: 'Reinforced Concrete Motor Bridge',
      households_regaining_access: 95, // Tallo Basti
      facilities_restored: 2, // Health Post & Market
      restored_routes_count: 2,
      route_improvement_value: 33,
      route_improvement_unit: 'minutes saved for medical transport',
      remaining_affected_households: 120, // Upallo Basti has to detour via valley
      emergency_vehicle_access: true,
      motor_ambulance_connectivity: 'YES — Full 4-wheel ambulance and freight access restored',
      key_beneficiary: 'Maternity emergencies, commercial goods transit, 95 lower households',
      trade_off_analysis: 'Immediately restores 4-wheel vehicular lifeline to Sundar Gaun Health Post for maternal delivery emergencies and pharmacy resupply, saving +33 minutes of arduous mountain transit. Lower valley commerce and agricultural freight resume immediately.',
    },
    comparison_summary: 'Trade-off Decision: Option A prioritizes daily pedestrian safety and education commute for 160 school children, whereas Option B restores critical life-safety ambulance connectivity and heavy motorized supply chains.',
    recommendation_note: 'Municipal Decision Guidance: If river crossing flood waters remain high or maternal emergencies occur, prioritize BR-02 (Motor Bridge) with emergency gabion scour shoring. If children are missing classes due to impassable gorge currents, deploy rapid wire-rope bridge rigging on BR-01 first.',
  };
}
