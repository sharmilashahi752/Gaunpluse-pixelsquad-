import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGraph,
  findShortestPath,
  runNetworkSimulation,
  compareRepairPriorities,
  resolveBridgeEdgeId,
  generateSimulationExplanation,
} from '../src/utils/graphSimulation.js';
import { NODES, EDGES } from '../src/data/demoVillage.js';

describe('GaunPulse Graph Engine Tests', () => {
  const graph = buildGraph(NODES, EDGES);

  it('1. Baseline connectivity: All nodes are connected and reachable in baseline state', () => {
    // Check Tallo Basti -> Health Post
    const talloHealth = findShortestPath(
      graph,
      'node-tallo-basti',
      'node-health-post',
      []
    );
    assert.equal(talloHealth.pathFound, true);
    assert.equal(talloHealth.totalTime, 18);
    assert.deepEqual(talloHealth.edgePath, [
      'edge-tallo-road',
      'edge-bridge-b-approach',
      'edge-bridge-b',
      'edge-corridor-central',
      'edge-health-access',
    ]);

    // Check Upallo Basti -> School
    const upalloSchool = findShortestPath(
      graph,
      'node-upallo-basti',
      'node-school',
      []
    );
    assert.equal(upalloSchool.pathFound, true);
    assert.equal(upalloSchool.totalTime, 16);
    assert.deepEqual(upalloSchool.edgePath, [
      'edge-upallo-ridge-trail',
      'edge-bridge-a',
      'edge-bridge-a-junction-link',
      'edge-north-ridge-road',
    ]);
  });

  it('2. Bridge failure & alternative route detection: Disabling Bridge BR-02 routes via Bridge BR-01', () => {
    const disabledBridgeB = ['edge-bridge-b'];

    const talloHealthDetour = findShortestPath(
      graph,
      'node-tallo-basti',
      'node-health-post',
      disabledBridgeB
    );

    assert.equal(talloHealthDetour.pathFound, true);
    // Baseline was 18m, detour via West Ridge Trail + BR-01 is 51m (+33m)
    assert.equal(talloHealthDetour.totalTime, 51);
    assert.ok(talloHealthDetour.edgePath.includes('edge-west-ridge-trail'));
    assert.ok(talloHealthDetour.edgePath.includes('edge-bridge-a'));
    assert.ok(!talloHealthDetour.edgePath.includes('edge-bridge-b'));

    // Simulation metrics check
    const sim = runNetworkSimulation({ disabledEdgeIds: disabledBridgeB });
    assert.equal(sim.isBaseline, false);
    assert.equal(sim.metrics.affectedSettlementsCount, 1);
    assert.equal(sim.metrics.totalAffectedHouseholds, 95);
    assert.equal(sim.metrics.disconnectedSettlementsCount, 0); // Not disconnected because alternative route exists
    assert.equal(sim.metrics.delayedSettlementsCount, 1);
  });

  it('3. Fully disconnected routes: Disabling BOTH bridges cuts off river crossing', () => {
    const dualClosure = ['edge-bridge-a', 'edge-bridge-b'];

    const talloHealth = findShortestPath(
      graph,
      'node-tallo-basti',
      'node-health-post',
      dualClosure
    );
    assert.equal(talloHealth.pathFound, false);
    assert.equal(talloHealth.totalTime, null);
    assert.equal(talloHealth.edgePath.length, 0);

    const upalloSchool = findShortestPath(
      graph,
      'node-upallo-basti',
      'node-school',
      dualClosure
    );
    assert.equal(upalloSchool.pathFound, false);
    assert.equal(upalloSchool.totalTime, null);

    const sim = runNetworkSimulation({ disabledEdgeIds: dualClosure });
    assert.equal(sim.metrics.disconnectedSettlementsCount, 2);
    assert.equal(sim.metrics.totalAffectedHouseholds, 215); // 95 + 120
  });

  it('4. Invalid edge IDs: Rejects unknown edge IDs gracefully without throwing', () => {
    const result = runNetworkSimulation({
      disabledEdgeIds: ['non-existent-edge-xyz', 12345, null],
    });
    // Should filter out invalid edge IDs and compute baseline
    assert.equal(result.isBaseline, true);
    assert.equal(result.metrics.affectedSettlementsCount, 0);

    const path = findShortestPath(
      graph,
      'node-tallo-basti',
      'node-health-post',
      ['invalid-edge-id']
    );
    assert.equal(path.pathFound, true);
    assert.equal(path.totalTime, 18);
  });

  it('5. Restoration to baseline: Empty disabled list restores normal network', () => {
    const simBaseline = runNetworkSimulation({ disabledEdgeIds: [] });
    assert.equal(simBaseline.isBaseline, true);
    assert.equal(simBaseline.metrics.affectedSettlementsCount, 0);
    assert.equal(simBaseline.metrics.disconnectedSettlementsCount, 0);
    assert.equal(simBaseline.metrics.totalAffectedHouseholds, 0);
  });

  it('6. Stable deterministic calculations: Repeated runs yield identical results', () => {
    const run1 = runNetworkSimulation({ disabledEdgeIds: ['edge-bridge-b'] });
    const run2 = runNetworkSimulation({ disabledEdgeIds: ['edge-bridge-b'] });
    assert.deepEqual(run1.metrics, run2.metrics);
    assert.equal(run1.routeResults[0].scenarioTime, run2.routeResults[0].scenarioTime);
  });

  it('7. Repair comparison: Accurately evaluates restoring BR-01 vs BR-02 under dual closure', () => {
    const comparison = compareRepairPriorities();

    // In dual closure, 2 settlements are disconnected
    assert.equal(comparison.dualFailure.metrics.disconnectedSettlementsCount, 2);

    // Option 1 (restore BR-01): reconnects both settlements (via BR-01 and ridge trail)
    assert.equal(comparison.option1.disconnectedCount, 0);
    // Option 2 (restore BR-02): reconnects both settlements (via BR-02 and ridge trail)
    assert.equal(comparison.option2.disconnectedCount, 0);

    // Verify option identities
    assert.equal(comparison.option1.bridgeCode, 'BR-01');
    assert.equal(comparison.option2.bridgeCode, 'BR-02');
  });

  it('8. Bridge parameter resolver: Correctly identifies bridges from URL query params', () => {
    assert.equal(resolveBridgeEdgeId('bridge-b'), 'edge-bridge-b');
    assert.equal(resolveBridgeEdgeId('BR-02'), 'edge-bridge-b');
    assert.equal(resolveBridgeEdgeId('edge-bridge-b'), 'edge-bridge-b');
    assert.equal(resolveBridgeEdgeId('bridge-a'), 'edge-bridge-a');
    assert.equal(resolveBridgeEdgeId('BR-01'), 'edge-bridge-a');
    assert.equal(resolveBridgeEdgeId('invalid-param'), null);
    assert.equal(resolveBridgeEdgeId(null), null);
  });

  it('9. Deterministic AI Insight Generator: Formats explanation with exact numbers', () => {
    const simBR02 = runNetworkSimulation({ disabledEdgeIds: ['edge-bridge-b'] });
    const explanation = generateSimulationExplanation(simBR02);

    assert.ok(explanation.title.includes('Bridge BR-02'));
    assert.ok(explanation.summary.includes('33 minutes')); // +33m calculated
    assert.ok(explanation.summary.includes('51m')); // 51m total calculated
    assert.ok(explanation.summary.includes('95 households'));
  });
});
