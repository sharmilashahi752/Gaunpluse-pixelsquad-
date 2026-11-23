/**
 * GaunPulse — Demonstration Infrastructure Prioritization Engine
 * 
 * Implements a transparent, deterministic multi-factor priority scoring algorithm
 * for rural infrastructure hazard assessment.
 * 
 * Demonstration Scoring Model:
 * Factor                         Weight
 * -------------------------------------
 * 1. Infrastructure Severity     30%
 * 2. Affected Population         25%
 * 3. Essential Service Impact    20%
 * 4. Emergency Access Impact     15%
 * 5. Repair Cost Efficiency      10%
 * Total                         100%
 * 
 * Normalization Constants:
 * - Reference Population (P_ref): 600 (baseline settlement catchment population)
 * - Maximum Benchmark Cost (C_max): NPR 2,500,000 (standard capital repair threshold)
 */

export const SCORING_MODEL = {
  name: 'Demonstration Prioritization Model',
  disclaimer: 'Demonstration data — fictional infrastructure scenarios, not actual reported incidents.',
  weights: {
    severity: 0.30,
    population: 0.25,
    essentialServices: 0.20,
    emergencyAccess: 0.15,
    costEfficiency: 0.10,
  },
  referencePopulation: 600,
  maxBenchmarkCost: 2500000,
};

/**
 * Normalization Rules:
 */
export function normalizeSeverity(severity) {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 90;
  if (s === 'high') return 75;
  if (s === 'moderate' || s === 'medium') return 50;
  if (s === 'low') return 25;
  return 40;
}

export function normalizePopulation(population, refPop = SCORING_MODEL.referencePopulation) {
  const pop = Number(population) || 0;
  const ratio = pop / refPop;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

export function normalizeEssentialServices(disruption) {
  const d = String(disruption || '').toLowerCase();
  if (d === 'high') return 90;
  if (d === 'moderate' || d === 'medium') return 50;
  if (d === 'low') return 25;
  return 0;
}

export function normalizeEmergencyAccess(disruption) {
  const d = String(disruption || '').toLowerCase();
  if (d === 'high') return 100;
  if (d === 'moderate' || d === 'medium') return 50;
  if (d === 'low') return 25;
  return 0;
}

export function normalizeCostEfficiency(cost, maxCost = SCORING_MODEL.maxBenchmarkCost) {
  const c = Number(cost) || 0;
  const ratio = Math.max(0, Math.min(1, c / maxCost));
  return Math.round((1 - ratio) * 100);
}

/**
 * Calculates priority score and factor breakdown deterministically.
 */
export function calculatePriorityScore(issue) {
  const sevScore = normalizeSeverity(issue.severity);
  const popScore = normalizePopulation(issue.affected_population);
  const esScore = normalizeEssentialServices(issue.essential_service_disruption);
  const eaScore = normalizeEmergencyAccess(issue.emergency_access_disruption);
  const costScore = normalizeCostEfficiency(issue.estimated_repair_cost);

  const sevWeighted = +(sevScore * SCORING_MODEL.weights.severity).toFixed(2);
  const popWeighted = +(popScore * SCORING_MODEL.weights.population).toFixed(2);
  const esWeighted = +(esScore * SCORING_MODEL.weights.essentialServices).toFixed(2);
  const eaWeighted = +(eaScore * SCORING_MODEL.weights.emergencyAccess).toFixed(2);
  const costWeighted = +(costScore * SCORING_MODEL.weights.costEfficiency).toFixed(2);

  const rawTotal = sevWeighted + popWeighted + esWeighted + eaWeighted + costWeighted;
  const finalScore = Math.round(rawTotal * 10) / 10;

  let classification = 'Low Priority';
  let badgeTone = 'blue';
  if (finalScore >= 80) {
    classification = 'Critical Priority';
    badgeTone = 'red';
  } else if (finalScore >= 60) {
    classification = 'High Priority';
    badgeTone = 'orange';
  } else if (finalScore >= 40) {
    classification = 'Moderate Priority';
    badgeTone = 'amber';
  }

  return {
    finalScore,
    classification,
    badgeTone,
    breakdown: {
      severity: { score: sevScore, weight: SCORING_MODEL.weights.severity, weighted: sevWeighted },
      population: { score: popScore, weight: SCORING_MODEL.weights.population, weighted: popWeighted },
      essentialServices: { score: esScore, weight: SCORING_MODEL.weights.essentialServices, weighted: esWeighted },
      emergencyAccess: { score: eaScore, weight: SCORING_MODEL.weights.emergencyAccess, weighted: eaWeighted },
      costEfficiency: { score: costScore, weight: SCORING_MODEL.weights.costEfficiency, weighted: costWeighted },
    },
    formattedBreakdown: [
      { factor: 'Infrastructure Severity', raw: sevScore, weight: 0.30, weighted: sevWeighted.toFixed(1) },
      { factor: 'Population Impact', raw: popScore, weight: 0.25, weighted: popWeighted.toFixed(1) },
      { factor: 'Essential Services', raw: esScore, weight: 0.20, weighted: esWeighted.toFixed(1) },
      { factor: 'Emergency Access', raw: eaScore, weight: 0.15, weighted: eaWeighted.toFixed(1) },
      { factor: 'Cost Efficiency', raw: costScore, weight: 0.10, weighted: costWeighted.toFixed(1) },
    ],
  };
}

/**
 * Exactly Two Fictional Demonstration Infrastructure Issues
 */
export const DEMO_PRIORITIZATION_ISSUES = [
  {
    id: 'demo-bridge-01',
    is_demo: true,
    title: 'Rural Bridge Structural Damage',
    category: 'damaged_bridge',
    category_label: 'Bridge Infrastructure',
    location: 'Marpha — Demo Scenario',
    village_name: 'Marpha',
    ward: '1',
    severity: 'Critical',
    affected_households: 120,
    affected_population: 480,
    essential_service_disruption: 'High',
    emergency_access_disruption: 'High',
    infrastructure_condition: 'Severe structural damage',
    estimated_repair_cost: 1500000,
    estimated_repair_cost_formatted: 'NPR 1,500,000',
    verification_status: 'Demonstration Only',
    description:
      'A fictional bridge used for emergency transportation and access to healthcare has suffered structural damage. The simulated disruption affects 120 households and restricts emergency vehicle movement.',
    reason:
      'High structural severity, emergency accessibility disruption, and significant population impact.',
  },
  {
    id: 'demo-road-02',
    is_demo: true,
    title: 'Rural Road Blocked by Landslide',
    category: 'damaged_road',
    category_label: 'Roads & Trails',
    location: 'Marpha — Demo Scenario',
    village_name: 'Marpha',
    ward: '1',
    severity: 'Moderate',
    affected_households: 45,
    affected_population: 180,
    essential_service_disruption: 'Moderate',
    emergency_access_disruption: 'Low',
    infrastructure_condition: 'Partial road blockage',
    estimated_repair_cost: 400000,
    estimated_repair_cost_formatted: 'NPR 400,000',
    verification_status: 'Demonstration Only',
    description:
      'A fictional landslide has partially blocked a rural access road, increasing travel difficulty and delaying access to local markets and public services.',
    reason:
      'Moderate infrastructure damage with lower emergency impact.',
  },
];

/**
 * Filter demo issues according to current UI selections
 */
export function filterDemoIssues(demoIssues, { category = 'all', ward = 'all', villageName = '' } = {}) {
  return demoIssues.filter((issue) => {
    // Category Filter:
    // 'all' -> all lifelines
    // 'damaged_bridge' -> bridge infrastructure
    // 'damaged_road' -> roads & trails
    if (category !== 'all') {
      if (category === 'damaged_bridge' && issue.category !== 'damaged_bridge') return false;
      if (category === 'damaged_road' && issue.category !== 'damaged_road') return false;
      if (category !== 'damaged_bridge' && category !== 'damaged_road' && issue.category !== category) return false;
    }

    // Ward Filter:
    if (ward !== 'all') {
      if (String(issue.ward) !== String(ward)) return false;
    }

    return true;
  });
}
