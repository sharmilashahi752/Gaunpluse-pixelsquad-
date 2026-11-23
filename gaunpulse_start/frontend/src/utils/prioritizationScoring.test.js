import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePriorityScore,
  filterDemoIssues,
  DEMO_PRIORITIZATION_ISSUES,
  normalizeSeverity,
  normalizePopulation,
  normalizeEssentialServices,
  normalizeEmergencyAccess,
  normalizeCostEfficiency,
  SCORING_MODEL,
} from './prioritizationScoring.js';

test('1. Normalization rules match specifications', () => {
  assert.equal(normalizeSeverity('Critical'), 90);
  assert.equal(normalizeSeverity('Moderate'), 50);

  // Reference population = 600
  assert.equal(normalizePopulation(480), 80); // 480 / 600 * 100 = 80
  assert.equal(normalizePopulation(180), 30); // 180 / 600 * 100 = 30

  assert.equal(normalizeEssentialServices('High'), 90);
  assert.equal(normalizeEssentialServices('Moderate'), 50);

  assert.equal(normalizeEmergencyAccess('High'), 100);
  assert.equal(normalizeEmergencyAccess('Low'), 25);

  // Max cost = 2,500,000
  assert.equal(normalizeCostEfficiency(1500000), 40); // (1 - 1.5M/2.5M) * 100 = 40
  assert.equal(normalizeCostEfficiency(400000), 84);  // (1 - 0.4M/2.5M) * 100 = 84
});

test('2. Demo Issue 1 (Bridge) calculation matches exact weighted breakdown', () => {
  const bridge = DEMO_PRIORITIZATION_ISSUES[0];
  assert.equal(bridge.title, 'Rural Bridge Structural Damage');
  assert.equal(bridge.affected_households, 120);
  assert.equal(bridge.affected_population, 480);
  assert.equal(bridge.estimated_repair_cost, 1500000);

  const scoreResult = calculatePriorityScore(bridge);
  assert.equal(scoreResult.finalScore, 84.0);
  assert.equal(scoreResult.classification, 'Critical Priority');

  // Verify exact factor math
  const bd = scoreResult.breakdown;
  assert.equal(bd.severity.weighted, 27.0);       // 90 * 0.30 = 27.0
  assert.equal(bd.population.weighted, 20.0);     // 80 * 0.25 = 20.0
  assert.equal(bd.essentialServices.weighted, 18.0); // 90 * 0.20 = 18.0
  assert.equal(bd.emergencyAccess.weighted, 15.0); // 100 * 0.15 = 15.0
  assert.equal(bd.costEfficiency.weighted, 4.0);   // 40 * 0.10 = 4.0
});

test('3. Demo Issue 2 (Road) calculation matches exact weighted breakdown', () => {
  const road = DEMO_PRIORITIZATION_ISSUES[1];
  assert.equal(road.title, 'Rural Road Blocked by Landslide');
  assert.equal(road.affected_households, 45);
  assert.equal(road.affected_population, 180);
  assert.equal(road.estimated_repair_cost, 400000);

  const scoreResult = calculatePriorityScore(road);
  assert.equal(scoreResult.finalScore, 44.7);
  assert.equal(scoreResult.classification, 'Moderate Priority');

  // Verify factor math
  const bd = scoreResult.breakdown;
  assert.equal(bd.severity.weighted, 15.0);       // 50 * 0.30 = 15.0
  assert.equal(bd.population.weighted, 7.5);      // 30 * 0.25 = 7.5
  assert.equal(bd.essentialServices.weighted, 10.0); // 50 * 0.20 = 10.0
  assert.equal(bd.emergencyAccess.weighted, 3.75); // 25 * 0.15 = 3.75
  assert.equal(bd.costEfficiency.weighted, 8.4);   // 84 * 0.10 = 8.4
});

test('4. Priority ranking puts Bridge (#1) above Road (#2)', () => {
  const scored = DEMO_PRIORITIZATION_ISSUES.map((issue) => ({
    ...issue,
    scoreResult: calculatePriorityScore(issue),
  })).sort((a, b) => b.scoreResult.finalScore - a.scoreResult.finalScore);

  assert.equal(scored.length, 2);
  assert.equal(scored[0].title, 'Rural Bridge Structural Damage');
  assert.equal(scored[0].scoreResult.finalScore, 84.0);
  assert.equal(scored[1].title, 'Rural Road Blocked by Landslide');
  assert.equal(scored[1].scoreResult.finalScore, 44.7);
});

test('5. Category filtering works for Bridges, Roads, and All Lifelines', () => {
  const allLifelines = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { category: 'all' });
  assert.equal(allLifelines.length, 2);

  const bridgesOnly = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { category: 'damaged_bridge' });
  assert.equal(bridgesOnly.length, 1);
  assert.equal(bridgesOnly[0].title, 'Rural Bridge Structural Damage');

  const roadsOnly = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { category: 'damaged_road' });
  assert.equal(roadsOnly.length, 1);
  assert.equal(roadsOnly[0].title, 'Rural Road Blocked by Landslide');

  const unmatched = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { category: 'water_supply' });
  assert.equal(unmatched.length, 0);
});

test('6. Ward filtering works as expected', () => {
  const allWards = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { ward: 'all' });
  assert.equal(allWards.length, 2);

  const ward1 = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { ward: '1' });
  assert.equal(ward1.length, 2);

  const ward2 = filterDemoIssues(DEMO_PRIORITIZATION_ISSUES, { ward: '2' });
  assert.equal(ward2.length, 0);
});

test('7. Demo records are completely isolated and flagged as demonstration records', () => {
  assert.equal(DEMO_PRIORITIZATION_ISSUES.length, 2);
  DEMO_PRIORITIZATION_ISSUES.forEach((issue) => {
    assert.equal(issue.is_demo, true);
    assert.equal(issue.verification_status, 'Demonstration Only');
    assert.match(issue.location, /Marpha/);
  });
});
