import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ISSUES,
  BRIDGES,
  EDGES,
  FACILITIES,
  SETTLEMENTS,
} from '../src/data/demoVillage.js';
import { resolveBridgeEdgeId } from '../src/utils/graphSimulation.js';

describe('GaunPulse Community Issues & Progress Test Suite', () => {
  it('1. ISSUES dataset integrity: Every issue has valid IDs, categories, and required fields', () => {
    assert.ok(Array.isArray(ISSUES), 'ISSUES must be an array');
    assert.ok(ISSUES.length >= 4, 'Must have at least 4 demonstration issues');

    const validCategories = ['bridge', 'road', 'school', 'health_post'];
    const validSeverities = ['critical', 'warning', 'low'];
    const validVerificationStatuses = ['verified', 'under_review', 'unverified'];
    const validProgressStatuses = [
      'submitted',
      'under_review',
      'field_verification',
      'action_proposed',
      'work_in_progress',
      'resolved',
    ];

    ISSUES.forEach((issue) => {
      assert.ok(issue.id, `Issue missing id: ${JSON.stringify(issue)}`);
      assert.ok(issue.title, `Issue ${issue.id} missing title`);
      assert.ok(issue.description, `Issue ${issue.id} missing description`);
      assert.ok(issue.locationLabel, `Issue ${issue.id} missing locationLabel`);
      assert.ok(issue.infrastructureName, `Issue ${issue.id} missing infrastructureName`);
      assert.ok(issue.reportedAt, `Issue ${issue.id} missing reportedAt`);
      assert.ok(issue.updatedAt, `Issue ${issue.id} missing updatedAt`);

      // Category, severity, verification checks
      assert.ok(
        validCategories.includes(issue.category),
        `Issue ${issue.id} has invalid category: ${issue.category}`
      );
      assert.ok(
        validSeverities.includes(issue.severity),
        `Issue ${issue.id} has invalid severity: ${issue.severity}`
      );
      assert.ok(
        validVerificationStatuses.includes(issue.verificationStatus),
        `Issue ${issue.id} has invalid verificationStatus: ${issue.verificationStatus}`
      );
      assert.ok(
        validProgressStatuses.includes(issue.progressStatus),
        `Issue ${issue.id} has invalid progressStatus: ${issue.progressStatus}`
      );

      // Coordinates
      assert.ok(Array.isArray(issue.coordinates) && issue.coordinates.length === 2);

      // Evidence & consequence arrays
      assert.ok(issue.evidence, `Issue ${issue.id} missing evidence block`);
      assert.ok(Array.isArray(issue.consequences) && issue.consequences.length > 0);
      assert.ok(Array.isArray(issue.proposedActions) && issue.proposedActions.length > 0);
    });
  });

  it('2. 6-Stage Progress Lifecycle integrity: Each issue contains complete 6-stage history', () => {
    const EXPECTED_STAGES = [
      'Report Submitted',
      'Under Review',
      'Field Verification',
      'Action Proposed',
      'Work In Progress',
      'Resolved',
    ];

    ISSUES.forEach((issue) => {
      assert.ok(
        Array.isArray(issue.progressHistory),
        `Issue ${issue.id} progressHistory must be an array`
      );
      assert.equal(
        issue.progressHistory.length,
        6,
        `Issue ${issue.id} must have exactly 6 progress stages`
      );

      const stageNames = issue.progressHistory.map((s) => s.stage);
      assert.deepEqual(stageNames, EXPECTED_STAGES);

      let currentCount = 0;
      issue.progressHistory.forEach((stage) => {
        assert.ok(
          ['completed', 'current', 'pending'].includes(stage.status),
          `Invalid stage status ${stage.status} in ${issue.id}`
        );
        assert.ok(stage.actor, `Missing actor for stage ${stage.stage} in ${issue.id}`);
        assert.ok(stage.note, `Missing note for stage ${stage.stage} in ${issue.id}`);
        if (stage.status === 'current') currentCount++;
      });

      assert.equal(
        currentCount,
        1,
        `Issue ${issue.id} must have exactly one active 'current' stage`
      );
    });
  });

  it('3. Filtering Logic: Category, Severity, and Verification filters work accurately', () => {
    // Category filter test
    const bridgeIssues = ISSUES.filter((i) => i.category === 'bridge');
    assert.equal(bridgeIssues.length, 1);
    assert.equal(bridgeIssues[0].id, 'issue-bridge-b-scour');

    const roadIssues = ISSUES.filter((i) => i.category === 'road');
    assert.equal(roadIssues.length, 1);
    assert.equal(roadIssues[0].id, 'issue-upallo-trail-slump');

    // Severity filter test
    const criticalIssues = ISSUES.filter((i) => i.severity === 'critical');
    assert.equal(criticalIssues.length, 1);
    assert.equal(criticalIssues[0].id, 'issue-bridge-b-scour');

    const warningIssues = ISSUES.filter((i) => i.severity === 'warning');
    assert.equal(warningIssues.length, 2);

    // Verification filter test
    const verifiedIssues = ISSUES.filter((i) => i.verificationStatus === 'verified');
    assert.equal(verifiedIssues.length, 3);

    const underReviewIssues = ISSUES.filter((i) => i.verificationStatus === 'under_review');
    assert.equal(underReviewIssues.length, 1);
  });

  it('4. Keyword Search Logic: Searches across title, description, location, and asset', () => {
    const searchFilter = (query) => {
      const q = query.toLowerCase().trim();
      return ISSUES.filter(
        (issue) =>
          issue.title.toLowerCase().includes(q) ||
          (issue.summary || '').toLowerCase().includes(q) ||
          issue.description.toLowerCase().includes(q) ||
          issue.locationLabel.toLowerCase().includes(q) ||
          issue.infrastructureName.toLowerCase().includes(q)
      );
    };

    // Keyword: 'scour'
    const scourResults = searchFilter('scour');
    assert.equal(scourResults.length, 1);
    assert.equal(scourResults[0].id, 'issue-bridge-b-scour');

    // Keyword: 'culvert'
    const culvertResults = searchFilter('culvert');
    assert.equal(culvertResults.length, 1);
    assert.equal(culvertResults[0].id, 'issue-school-culvert');

    // Keyword: 'Ward 4'
    const ward4Results = searchFilter('Ward 4');
    assert.equal(ward4Results.length, 2);

    // Keyword: non-existent term
    const noResults = searchFilter('nonexistent-term-xyz');
    assert.equal(noResults.length, 0);
  });

  it('5. Deep Link Reference Integrity: Every issue references a valid map asset and demo edge', () => {
    const allKnownAssetIds = new Set([
      ...BRIDGES.map((b) => b.id),
      ...BRIDGES.map((b) => b.edgeId),
      ...EDGES.map((e) => e.id),
      ...FACILITIES.map((f) => f.id),
      ...SETTLEMENTS.map((s) => s.id),
    ]);

    ISSUES.forEach((issue) => {
      const refId = issue.infrastructureId || issue.edgeId || issue.targetId;
      assert.ok(
        allKnownAssetIds.has(refId),
        `Issue ${issue.id} references unknown asset ID: ${refId}`
      );

      // If canSimulate is true, resolveBridgeEdgeId must successfully identify a bridge edge
      if (issue.canSimulate) {
        const resolved = resolveBridgeEdgeId(issue.edgeId || issue.targetId);
        assert.ok(resolved, `Simulatable issue ${issue.id} must resolve to a bridge edge`);
      }
    });
  });
});
