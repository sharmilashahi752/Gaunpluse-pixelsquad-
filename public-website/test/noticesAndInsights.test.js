import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NOTICES, NOTICES_METADATA } from '../src/data/demoNotices.js';
import {
  ISSUES,
  BRIDGES,
  EDGES,
  FACILITIES,
} from '../src/data/demoVillage.js';
import { runNetworkSimulation } from '../src/utils/graphSimulation.js';
import {
  RESEARCH_ARTICLES,
  getArticleById,
  getAllArticles,
  getRelatedArticles,
} from '../src/data/researchArticles.js';

describe('GaunPulse Notices & Insights Test Suite', () => {
  it('1. NOTICES dataset integrity: Has required fields and valid demonstration labels', () => {
    assert.ok(Array.isArray(NOTICES), 'NOTICES must be an array');
    assert.ok(NOTICES.length >= 3, 'Must have at least 3 notices');

    const validCategories = ['advisory', 'maintenance', 'access', 'technical'];

    NOTICES.forEach((notice) => {
      assert.ok(notice.id, `Notice missing id: ${JSON.stringify(notice)}`);
      assert.ok(notice.title, `Notice ${notice.id} missing title`);
      assert.ok(notice.summary, `Notice ${notice.id} missing summary`);
      assert.ok(notice.content, `Notice ${notice.id} missing content`);
      assert.ok(
        validCategories.includes(notice.category),
        `Notice ${notice.id} has invalid category: ${notice.category}`
      );
      assert.ok(notice.date, `Notice ${notice.id} missing date`);
      assert.ok(notice.sourceLabel, `Notice ${notice.id} missing sourceLabel`);
      assert.equal(notice.sourceLabel, 'GaunPulse Demonstration Notice');
      assert.equal(notice.isDemo, true);
      assert.ok(
        Array.isArray(notice.actionItems) && notice.actionItems.length > 0,
        `Notice ${notice.id} must have actionItems`
      );
    });

    assert.equal(
      NOTICES_METADATA.disclaimer,
      'Fictional Demonstration Notices — Not Official Government Announcements'
    );
  });

  it('2. NOTICES cross-references: Every notice references a valid infrastructure asset and issue', () => {
    const knownAssetIds = new Set([
      ...BRIDGES.map((b) => b.id),
      ...BRIDGES.map((b) => b.edgeId),
      ...EDGES.map((e) => e.id),
      ...FACILITIES.map((f) => f.id),
    ]);
    const knownIssueIds = new Set(ISSUES.map((i) => i.id));

    NOTICES.forEach((notice) => {
      assert.ok(
        knownAssetIds.has(notice.relatedInfrastructureId),
        `Notice ${notice.id} references invalid asset: ${notice.relatedInfrastructureId}`
      );

      if (notice.relatedIssueId) {
        assert.ok(
          knownIssueIds.has(notice.relatedIssueId),
          `Notice ${notice.id} references invalid issue: ${notice.relatedIssueId}`
        );
      }
    });
  });

  it('3. Notice search and filter logic: Searches across titles, assets, and categories accurately', () => {
    // Filter by advisory category
    const advisories = NOTICES.filter((n) => n.category === 'advisory');
    assert.equal(advisories.length, 1);
    assert.equal(advisories[0].id, 'notice-bridge-scour-inspection');

    // Filter by maintenance category
    const maintenance = NOTICES.filter((n) => n.category === 'maintenance');
    assert.equal(maintenance.length, 1);
    assert.equal(maintenance[0].id, 'notice-ridge-trail-maintenance');

    // Search keyword 'culvert'
    const culvertResults = NOTICES.filter(
      (n) =>
        n.title.toLowerCase().includes('culvert') ||
        n.summary.toLowerCase().includes('culvert')
    );
    assert.equal(culvertResults.length, 1);
    assert.equal(culvertResults[0].id, 'notice-school-drainage-clearance');
  });

  it('4. Insights data calculations: Summary metrics match underlying datasets dynamically', () => {
    // Totals must match exactly
    const totalIssues = ISSUES.length;
    const verifiedIssues = ISSUES.filter((i) => i.verificationStatus === 'verified').length;
    const underReviewIssues = ISSUES.filter((i) => i.verificationStatus === 'under_review').length;
    const criticalIssues = ISSUES.filter((i) => i.severity === 'critical').length;

    assert.equal(totalIssues, 4);
    assert.equal(verifiedIssues, 3);
    assert.equal(underReviewIssues, 1);
    assert.equal(criticalIssues, 1);

    // Sum of category counts must equal total issues
    const categoryCounts = ['bridge', 'road', 'school', 'health_post'].map(
      (cat) => ISSUES.filter((i) => i.category === cat).length
    );
    const sumCategories = categoryCounts.reduce((a, b) => a + b, 0);
    assert.equal(sumCategories, totalIssues);

    // Sum of severity counts must equal total issues
    const severityCounts = ['critical', 'warning', 'low'].map(
      (sev) => ISSUES.filter((i) => i.severity === sev).length
    );
    const sumSeverities = severityCounts.reduce((a, b) => a + b, 0);
    assert.equal(sumSeverities, totalIssues);
  });

  it('5. Accessibility simulation calculation: Dynamic closure scenario calculates non-zero delay', () => {
    const scenario = runNetworkSimulation({ disabledEdgeIds: ['edge-bridge-b'] });

    const talloHealthRoute = scenario.routeResults.find(
      (r) => r.settlementId === 'settlement-tallo' && r.facilityId === 'facility-health'
    );

    assert.ok(talloHealthRoute, 'Tallo Basti to Health Post route result must exist');
    assert.equal(talloHealthRoute.baselineTime, 18, 'Baseline health transit is 18 mins');
    assert.equal(talloHealthRoute.scenarioTime, 51, 'Disrupted detour transit is 51 mins');
    assert.equal(talloHealthRoute.deltaMinutes, 33, 'Added delay must be 33 minutes');
    assert.ok(talloHealthRoute.alternativeRouteAvailable, 'Alternative route must be available');
    assert.equal(scenario.metrics.delayedSettlementsCount, 1, 'Exactly 1 settlement delayed');
    assert.equal(scenario.metrics.totalAffectedHouseholds, 95, '95 households affected');
  });

  it('6. RESEARCH_ARTICLES dataset integrity: Has 4 articles, required fields, and valid demonstration labels', () => {
    assert.ok(Array.isArray(RESEARCH_ARTICLES), 'RESEARCH_ARTICLES must be an array');
    assert.equal(RESEARCH_ARTICLES.length, 4, 'Must contain exactly 4 research articles');

    const expectedTitles = [
      'Rural Bridge Connectivity and Community Access',
      'Landslide and Trail Safety in Mountain Settlements',
      'Healthcare Accessibility During Infrastructure Disruptions',
      'Community-Based Infrastructure Monitoring',
    ];

    RESEARCH_ARTICLES.forEach((article, idx) => {
      assert.ok(article.id, `Article #${idx} missing id`);
      assert.equal(
        article.title,
        expectedTitles[idx],
        `Article #${idx} has title mismatch: ${article.title}`
      );
      assert.ok(article.category, `Article ${article.id} missing category`);
      assert.ok(article.date, `Article ${article.id} missing date`);
      assert.ok(article.summary, `Article ${article.id} missing summary`);
      assert.ok(article.image, `Article ${article.id} missing image`);
      assert.ok(article.imageCaption, `Article ${article.id} missing imageCaption`);
      assert.ok(article.location, `Article ${article.id} missing location`);
      assert.ok(article.author, `Article ${article.id} missing author`);
      assert.ok(Array.isArray(article.metrics) && article.metrics.length === 4, `Article ${article.id} must have 4 metrics`);
      assert.ok(Array.isArray(article.explanation) && article.explanation.length >= 2, `Article ${article.id} must have explanation paragraphs`);
      assert.ok(Array.isArray(article.keyFindings) && article.keyFindings.length >= 3, `Article ${article.id} must have key findings`);
      assert.ok(article.communityImpact, `Article ${article.id} missing community impact`);
      assert.ok(article.methodology, `Article ${article.id} missing methodology`);
    });
  });

  it('7. RESEARCH_ARTICLES cross-references: Every article references valid issue and infrastructure IDs', () => {
    const knownAssetIds = new Set([
      ...BRIDGES.map((b) => b.id),
      ...BRIDGES.map((b) => b.edgeId),
      ...EDGES.map((e) => e.id),
      ...FACILITIES.map((f) => f.id),
    ]);
    const knownIssueIds = new Set(ISSUES.map((i) => i.id));

    RESEARCH_ARTICLES.forEach((article) => {
      assert.ok(
        knownAssetIds.has(article.relatedInfrastructureId),
        `Article ${article.id} references invalid infrastructure: ${article.relatedInfrastructureId}`
      );
      assert.ok(
        knownIssueIds.has(article.relatedIssueId),
        `Article ${article.id} references invalid issue: ${article.relatedIssueId}`
      );
    });
  });

  it('8. Article lookup and alias resolution: Correctly resolves primary IDs and legacy aliases', () => {
    assert.equal(getAllArticles().length, 4);

    // Primary ID lookups
    const bridgeArt = getArticleById('rural-bridge-connectivity');
    assert.ok(bridgeArt, 'Primary ID rural-bridge-connectivity must resolve');
    assert.equal(bridgeArt.title, 'Rural Bridge Connectivity and Community Access');

    // Legacy aliases
    const alias1 = getArticleById('healthcare-impact');
    assert.ok(alias1, 'Alias healthcare-impact must resolve to healthcare-accessibility');
    assert.equal(alias1.id, 'healthcare-accessibility');

    const alias2 = getArticleById('school-accessibility');
    assert.ok(alias2, 'Alias school-accessibility must resolve to community-infrastructure-monitoring');
    assert.equal(alias2.id, 'community-infrastructure-monitoring');

    // Related articles helper
    const related = getRelatedArticles('rural-bridge-connectivity', 3);
    assert.equal(related.length, 3);
    assert.ok(!related.some((r) => r.id === 'rural-bridge-connectivity'), 'Related must exclude current article');

    // Unknown ID returns null
    assert.equal(getArticleById('unknown-article-slug'), null);
  });
});
