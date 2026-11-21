/**
 * Village Utility functions for consistent labelling and safe deduplication across GaunPulse.
 */

/**
 * Format readable, unambiguous label for village selectors:
 * Format: "Village Name (District · Ward X)"
 */
export function formatVillageLabel(village) {
  if (!village) return '';
  const name = village.name || 'Unnamed Village';
  const district = village.district || village.municipality || 'Nepal';
  const ward = village.ward_no ? ` · Ward ${village.ward_no}` : '';
  const draftSuffix = village.status === 'draft' ? ' [Draft]' : '';
  return `${name} (${district}${ward})${draftSuffix}`;
}

/**
 * Filter a list of villages so that each genuine geographic village appears only once.
 * Prefers the canonical record with the highest reliability (issues, simulations, infrastructure).
 */
export function deduplicateVillages(villages = []) {
  if (!Array.isArray(villages) || villages.length === 0) return [];

  const groups = new Map();

  for (const v of villages) {
    const normName = (v.name || '').toLowerCase().trim();
    const normMuni = (v.municipality || '').toLowerCase().trim();
    const ward = String(v.ward_no || '1').trim();
    const key = `${normName}|${normMuni}|${ward}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(v);
  }

  const distinct = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      distinct.push(group[0]);
    } else {
      // Pick canonical village with highest issues, simulations, and node counts
      const sorted = [...group].sort((a, b) => {
        const scoreA =
          (a.issues_count || 0) * 20 +
          (a.simulations_count || 0) * 15 +
          (a.nodes_count || 0) +
          (a.id === 19 ? 100 : 0); // Prioritize proven canonical ID
        const scoreB =
          (b.issues_count || 0) * 20 +
          (b.simulations_count || 0) * 15 +
          (b.nodes_count || 0) +
          (b.id === 19 ? 100 : 0);

        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.id - a.id;
      });

      distinct.push(sorted[0]);
    }
  }

  return distinct;
}
