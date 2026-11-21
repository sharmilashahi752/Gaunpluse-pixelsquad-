<?php

namespace App\Services;

use App\Models\ActionPlan;
use App\Models\AuditLog;
use App\Models\CommunityFeedback;
use App\Models\Edge;
use App\Models\Facility;
use App\Models\Issue;
use App\Models\Node;
use App\Models\SettlementGroup;
use App\Models\Simulation;
use App\Models\Village;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DuplicateVillageService
{
    /**
     * Audit all villages in MySQL for duplicate registration groups (Read-Only).
     */
    public static function auditDuplicates(): array
    {
        $allVillages = Village::withCount(['nodes', 'edges', 'facilities', 'issues', 'settlements'])
            ->get();

        $groups = [];

        foreach ($allVillages as $village) {
            $normName = mb_strtolower(trim($village->name));
            $normMuni = mb_strtolower(trim($village->municipality));
            $ward = trim((string)($village->ward_no ?? '1'));

            // Grouping key: normalized name + municipality + ward
            $key = "{$normName}|{$normMuni}|{$ward}";

            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'group_key' => $key,
                    'name' => $village->name,
                    'municipality' => $village->municipality,
                    'ward_no' => $village->ward_no,
                    'district' => $village->district,
                    'province' => $village->province,
                    'members' => [],
                ];
            }

            // Also count simulations and action plans
            $simsCount = Simulation::where('village_id', $village->id)->count();
            $plansCount = ActionPlan::where('village_id', $village->id)->count();
            $feedbackCount = CommunityFeedback::where('village_id', $village->id)->count();

            // Calculate reliability / completeness score
            $score = 0;
            $score += $village->issues_count * 20;
            $score += $simsCount * 15;
            $score += $plansCount * 15;
            $score += $feedbackCount * 10;
            $score += ($village->nodes_count > 0 ? 10 : 0);
            $score += ($village->edges_count > 0 ? 10 : 0);
            $score += ($village->facilities_count > 0 ? 10 : 0);
            if ($village->status === 'active') $score += 25;
            if ($village->is_demo) $score += 50;

            $groups[$key]['members'][] = [
                'id' => $village->id,
                'name' => $village->name,
                'local_name' => $village->local_name,
                'municipality' => $village->municipality,
                'ward_no' => $village->ward_no,
                'district' => $village->district,
                'province' => $village->province,
                'latitude' => $village->center_lat,
                'longitude' => $village->center_lng,
                'status' => $village->status,
                'nodes_count' => $village->nodes_count,
                'edges_count' => $village->edges_count,
                'facilities_count' => $village->facilities_count,
                'issues_count' => $village->issues_count,
                'simulations_count' => $simsCount,
                'action_plans_count' => $plansCount,
                'feedback_count' => $feedbackCount,
                'reliability_score' => $score,
                'created_at' => $village->created_at?->toIso8601String(),
                'updated_at' => $village->updated_at?->toIso8601String(),
            ];
        }

        $duplicateGroups = [];
        $totalDuplicateRecords = 0;

        foreach ($groups as $group) {
            if (count($group['members']) > 1) {
                // Sort members by reliability score descending, then by updated_at descending
                usort($group['members'], function ($a, $b) {
                    if ($b['reliability_score'] !== $a['reliability_score']) {
                        return $b['reliability_score'] <=> $a['reliability_score'];
                    }
                    if ($b['simulations_count'] !== $a['simulations_count']) {
                        return $b['simulations_count'] <=> $a['simulations_count'];
                    }
                    return $b['id'] <=> $a['id'];
                });

                $canonical = $group['members'][0];
                $duplicates = array_slice($group['members'], 1);

                $duplicateGroups[] = [
                    'group_key' => $group['group_key'],
                    'display_name' => "{$group['name']} ({$group['municipality']}, Ward {$group['ward_no']})",
                    'total_copies' => count($group['members']),
                    'canonical_id' => $canonical['id'],
                    'canonical_summary' => "Village ID {$canonical['id']} (Score: {$canonical['reliability_score']}, Issues: {$canonical['issues_count']}, Sims: {$canonical['simulations_count']})",
                    'canonical' => $canonical,
                    'duplicates' => $duplicates,
                    'duplicate_ids' => array_column($duplicates, 'id'),
                ];

                $totalDuplicateRecords += count($duplicates);
            }
        }

        return [
            'total_villages' => $allVillages->count(),
            'distinct_villages_count' => $allVillages->count() - $totalDuplicateRecords,
            'duplicate_groups_count' => count($duplicateGroups),
            'duplicate_records_count' => $totalDuplicateRecords,
            'duplicate_groups' => $duplicateGroups,
        ];
    }

    /**
     * Check if a village matches an existing registration before creation.
     */
    public static function findExistingDuplicate(
        string $name,
        string $municipality,
        ?string $wardNo = null,
        ?float $lat = null,
        ?float $lng = null,
        ?int $excludeId = null
    ): ?Village {
        $normName = mb_strtolower(trim($name));
        $normMuni = mb_strtolower(trim($municipality));
        $ward = trim((string)($wardNo ?? '1'));

        $query = Village::query();
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        // 1. Direct name + municipality + ward match
        $match = (clone $query)->whereRaw('LOWER(TRIM(name)) = ?', [$normName])
            ->where(function ($q) use ($normMuni) {
                $q->whereRaw('LOWER(TRIM(municipality)) = ?', [$normMuni])
                  ->orWhereRaw('LOWER(TRIM(district)) = ?', [$normMuni]);
            })
            ->where(function ($q) use ($ward) {
                $q->where('ward_no', $ward)
                  ->orWhereNull('ward_no');
            })
            ->first();

        if ($match) {
            return $match;
        }

        // 2. Spatial proximity match: if within 500m in the same municipality/district
        if ($lat !== null && $lng !== null && $lat > 20 && $lng > 70) {
            $spatialMatch = (clone $query)->where(function ($q) use ($normMuni) {
                $q->whereRaw('LOWER(TRIM(municipality)) = ?', [$normMuni])
                  ->orWhereRaw('LOWER(TRIM(district)) = ?', [$normMuni]);
            })->get()->first(function ($v) use ($lat, $lng) {
                $vLat = (float)($v->center_lat ?? $v->latitude ?? 0);
                $vLng = (float)($v->center_lng ?? $v->longitude ?? 0);
                if ($vLat === 0.0 || $vLng === 0.0) return false;
                
                // Haversine distance in meters
                $dLat = deg2rad($vLat - $lat);
                $dLng = deg2rad($vLng - $lng);
                $a = sin($dLat / 2) * sin($dLat / 2) +
                     cos(deg2rad($lat)) * cos(deg2rad($vLat)) *
                     sin($dLng / 2) * sin($dLng / 2);
                $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
                $distMeters = 6371000 * $c;

                return $distMeters <= 500; // Within 500m radius
            });

            if ($spatialMatch) {
                return $spatialMatch;
            }
        }

        return null;
    }

    /**
     * Preview proposed consolidation for a duplicate group (Read-Only).
     */
    public static function previewConsolidation(int $canonicalId, array $duplicateIds): array
    {
        $canonical = Village::findOrFail($canonicalId);
        $duplicates = Village::whereIn('id', $duplicateIds)->get();

        $issuesToReassign = Issue::whereIn('village_id', $duplicateIds)->count();
        $simsToReassign = Simulation::whereIn('village_id', $duplicateIds)->count();
        $plansToReassign = ActionPlan::whereIn('village_id', $duplicateIds)->count();
        $feedbackToReassign = CommunityFeedback::whereIn('village_id', $duplicateIds)->count();

        $nodesToDelete = Node::whereIn('village_id', $duplicateIds)->count();
        $edgesToDelete = Edge::whereIn('village_id', $duplicateIds)->count();
        $facilitiesToDelete = Facility::whereIn('village_id', $duplicateIds)->count();
        $settlementsToDelete = SettlementGroup::whereIn('village_id', $duplicateIds)->count();

        return [
            'status' => 'preview',
            'canonical_village' => [
                'id' => $canonical->id,
                'name' => $canonical->name,
                'municipality' => $canonical->municipality,
                'ward_no' => $canonical->ward_no,
                'current_nodes' => $canonical->nodes()->count(),
                'current_edges' => $canonical->edges()->count(),
                'current_facilities' => $canonical->facilities()->count(),
                'current_issues' => $canonical->issues()->count(),
                'current_simulations' => Simulation::where('village_id', $canonical->id)->count(),
            ],
            'duplicate_villages_count' => $duplicates->count(),
            'duplicate_village_ids' => $duplicateIds,
            'reassignments' => [
                'issues' => $issuesToReassign,
                'simulations' => $simsToReassign,
                'action_plans' => $plansToReassign,
                'community_feedback' => $feedbackToReassign,
            ],
            'redundant_records_to_prune' => [
                'duplicate_nodes' => $nodesToDelete,
                'duplicate_edges' => $edgesToDelete,
                'duplicate_facilities' => $facilitiesToDelete,
                'duplicate_settlements' => $settlementsToDelete,
                'duplicate_villages' => $duplicates->count(),
            ],
            'safety_guarantees' => [
                'Database backup recommended before confirmation.',
                'Canonical village infrastructure graph is fully preserved.',
                'All user issues and simulations are reassigned to canonical village ID.',
                'All operations wrapped in atomic database transaction with automatic rollback on error.',
            ],
        ];
    }

    /**
     * Perform safe transactional consolidation of confirmed duplicate villages.
     */
    public static function consolidate(int $canonicalId, array $duplicateIds, bool $confirmed = false): array
    {
        if (!$confirmed) {
            throw new \InvalidArgumentException('Explicit confirmation (confirmed: true) is required to execute consolidation.');
        }

        return DB::transaction(function () use ($canonicalId, $duplicateIds) {
            $canonical = Village::findOrFail($canonicalId);
            $duplicates = Village::whereIn('id', $duplicateIds)->get();

            if ($duplicates->isEmpty()) {
                return ['success' => true, 'message' => 'No duplicate records to consolidate.'];
            }

            // 1. Reassign user-created civic records to canonical village
            $issuesMoved = Issue::whereIn('village_id', $duplicateIds)->update(['village_id' => $canonicalId]);
            $simsMoved = Simulation::whereIn('village_id', $duplicateIds)->update(['village_id' => $canonicalId]);
            $plansMoved = ActionPlan::whereIn('village_id', $duplicateIds)->update(['village_id' => $canonicalId]);
            $feedbackMoved = CommunityFeedback::whereIn('village_id', $duplicateIds)->update(['village_id' => $canonicalId]);

            // 2. Remove redundant cloned infrastructure from duplicate villages
            $nodesDeleted = Node::whereIn('village_id', $duplicateIds)->delete();
            $edgesDeleted = Edge::whereIn('village_id', $duplicateIds)->delete();
            $facilitiesDeleted = Facility::whereIn('village_id', $duplicateIds)->delete();
            $settlementsDeleted = SettlementGroup::whereIn('village_id', $duplicateIds)->delete();

            // 3. Remove duplicate village rows
            $villagesDeleted = Village::whereIn('id', $duplicateIds)->delete();

            // 4. Log consolidation audit record on canonical village
            AuditLog::create([
                'village_id' => $canonicalId,
                'action_type' => 'duplicate_consolidation',
                'entity_type' => 'village',
                'entity_id' => $canonicalId,
                'performed_by' => 'System Administrator',
                'summary' => "Consolidated " . count($duplicateIds) . " duplicate records into canonical village {$canonical->name}.",
                'details' => [
                    'canonical_id' => $canonicalId,
                    'pruned_ids' => $duplicateIds,
                    'reassigned' => [
                        'issues' => $issuesMoved,
                        'simulations' => $simsMoved,
                        'action_plans' => $plansMoved,
                        'feedback' => $feedbackMoved,
                    ],
                    'pruned_infrastructure' => [
                        'nodes' => $nodesDeleted,
                        'edges' => $edgesDeleted,
                        'facilities' => $facilitiesDeleted,
                    ],
                ],
            ]);

            Log::info("GaunPulse duplicate consolidation complete for Canonical Village {$canonicalId}", [
                'canonical_id' => $canonicalId,
                'duplicate_ids' => $duplicateIds,
                'issues_moved' => $issuesMoved,
                'sims_moved' => $simsMoved,
            ]);

            return [
                'success' => true,
                'canonical_village_id' => $canonicalId,
                'canonical_village_name' => $canonical->name,
                'consolidated_count' => count($duplicateIds),
                'reassigned_issues' => $issuesMoved,
                'reassigned_simulations' => $simsMoved,
                'pruned_duplicate_nodes' => $nodesDeleted,
                'pruned_duplicate_edges' => $edgesDeleted,
                'message' => "Successfully consolidated " . count($duplicateIds) . " duplicate records into canonical village '{$canonical->name}'.",
            ];
        });
    }
}
