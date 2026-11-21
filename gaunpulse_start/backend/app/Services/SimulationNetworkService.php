<?php

namespace App\Services;

use App\Models\Edge;
use App\Models\Village;
use Illuminate\Support\Collection;

class SimulationNetworkService
{
    private const FACILITY_NODE_TYPES = [
        'school',
        'college',
        'health_post',
        'health',
        'hospital',
        'clinic',
        'water_point',
        'water',
        'facility',
    ];

    private const BLOCKED_STATUSES = [
        'blocked',
        'closed',
        'impassable',
        'failed',
        'out_of_service',
    ];

    /**
     * @return array<string, mixed>
     */
    public function readiness(Village $village): array
    {
        $village->loadMissing(['nodes', 'edges.source', 'edges.target', 'facilities.node', 'settlements']);

        $nodes = $village->nodes;
        $edges = $village->edges;
        $facilities = $village->facilities;
        $settlements = $village->settlements;
        $nodeIds = $nodes->pluck('id')->mapWithKeys(fn (int $id): array => [$id => true]);

        $errors = [];
        $warnings = [];

        if ($nodes->isEmpty() && $edges->isEmpty()) {
            $errors[] = 'No mapped infrastructure is available for this village yet.';
        } elseif ($nodes->isEmpty()) {
            $errors[] = 'The network has edges but no graph nodes.';
        } elseif ($edges->isEmpty()) {
            $errors[] = 'The network has nodes but no road, trail, or bridge links.';
        }

        $invalidEdges = $edges->filter(function (Edge $edge) use ($nodeIds, $village): bool {
            return ! isset($nodeIds[$edge->source_node_id])
                || ! isset($nodeIds[$edge->target_node_id])
                || $edge->source_node_id === $edge->target_node_id
                || $edge->source?->village_id !== $village->id
                || $edge->target?->village_id !== $village->id;
        })->values();

        if ($invalidEdges->isNotEmpty()) {
            $errors[] = $invalidEdges->count().' edge(s) have invalid, self-referencing, or cross-village endpoints.';
        }

        $settlementNodes = $nodes->filter(function ($node): bool {
            return mb_strtolower((string) ($node->node_type ?? $node->type)) === 'settlement'
                || $node->settlement_group_id !== null;
        })->values();

        if ($settlementNodes->isEmpty()) {
            $errors[] = 'No settlement is connected to a graph access node.';
        }

        $facilityNodeIds = $facilities->pluck('node_id')->filter()->map(fn ($id): int => (int) $id);
        $facilityNodes = $nodes->filter(function ($node) use ($facilityNodeIds): bool {
            return in_array(mb_strtolower((string) ($node->node_type ?? $node->type)), self::FACILITY_NODE_TYPES, true)
                || $facilityNodeIds->contains($node->id);
        })->values();

        $invalidFacilities = $facilities->filter(function ($facility) use ($nodeIds): bool {
            return $facility->node_id === null || ! isset($nodeIds[$facility->node_id]);
        })->values();

        if ($facilityNodes->isEmpty()) {
            $errors[] = 'No school, health post, water point, or other essential facility is connected to the graph.';
        }

        if ($invalidFacilities->isNotEmpty()) {
            $errors[] = $invalidFacilities->count().' facility record(s) have no valid access node in this village.';
        }

        $routingMetric = $this->routingMetric($edges);
        if ($edges->isNotEmpty() && $routingMetric === null) {
            $errors[] = 'Every edge must have either a positive travel-time weight or a positive mapped length.';
        }

        $missingGeometryCount = $edges->filter(fn (Edge $edge): bool => ! $this->hasValidGeometry($edge))->count();
        if ($missingGeometryCount > 0) {
            $warnings[] = $missingGeometryCount.' edge(s) have no valid stored geometry; they can be analyzed topologically but will not be drawn as mapped roads.';
        }

        $settlementsWithHouseholds = $settlements->whereNotNull('households')->filter(
            fn ($settlement): bool => (int) $settlement->households > 0
        );
        if ($settlementNodes->isNotEmpty() && $settlementsWithHouseholds->isEmpty()) {
            $warnings[] = 'Household estimates are missing. Connectivity impacts can be calculated, but affected-household totals will be reported as unknown.';
        }

        $verificationStatuses = $nodes->pluck('verification_status')
            ->merge($edges->pluck('verification_status'))
            ->merge($facilities->pluck('verification_status'))
            ->filter()
            ->map(fn ($status): string => mb_strtolower((string) $status));
        $hasUnverifiedRecords = $verificationStatuses->contains(
            fn (string $status): bool => ! in_array($status, ['verified', 'community_endorsed', 'field_verified'], true)
        );

        $verificationLevel = $this->verificationLevel($village, $hasUnverifiedRecords);
        if ($hasUnverifiedRecords) {
            $warnings[] = 'This graph contains imported or unverified records. Any technically valid run is experimental, not a field-confirmed outcome.';
        }

        $componentCount = $this->componentCount($nodes->pluck('id'), $edges, $invalidEdges->pluck('id'));
        if ($componentCount > 1) {
            $warnings[] = "The graph contains {$componentCount} disconnected components. Baseline inaccessibility will be separated from newly caused impacts.";
        }

        $canSimulate = $errors === [];
        $status = $this->readinessStatus($village, $canSimulate, $nodes, $edges, $hasUnverifiedRecords);

        return [
            'status' => $status,
            'can_simulate' => $canSimulate,
            'experimental' => $canSimulate && $hasUnverifiedRecords,
            'verification_level' => $verificationLevel,
            'routing_metric' => $routingMetric,
            'graph_version' => $this->graphVersion($village),
            'source' => $this->sources($village),
            'last_updated_at' => $this->lastUpdatedAt($village),
            'counts' => [
                'nodes' => $nodes->count(),
                'edges' => $edges->count(),
                'settlements' => $settlementNodes->count(),
                'settlements_with_households' => $settlementsWithHouseholds->count(),
                'facilities' => $facilityNodes->count(),
                'bridges' => $edges->filter(fn (Edge $edge): bool => in_array($edge->infrastructure_type, ['bridge', 'suspension_bridge'], true))->count(),
                'components' => $componentCount,
                'missing_geometry' => $missingGeometryCount,
            ],
            'errors' => $errors,
            'warnings' => $warnings,
            'actions' => $this->recommendedActions($errors, $warnings),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function simulationPayload(Village $village, array $additional = []): array
    {
        $village->loadMissing(['nodes', 'edges.source', 'edges.target', 'facilities.node', 'settlements']);
        $readiness = $this->readiness($village);
        $settlements = $village->settlements->map(function ($settlement) use ($village): array {
            $node = $village->nodes->firstWhere('settlement_group_id', $settlement->id);

            return array_merge($settlement->toArray(), ['node_id' => $node?->id]);
        })->values()->all();

        return array_merge([
            'village_id' => $village->id,
            'nodes' => $village->nodes->toArray(),
            'edges' => $village->edges->toArray(),
            'facilities' => $village->facilities->toArray(),
            'settlements' => $settlements,
            'baseline_blocked_edge_ids' => $village->edges
                ->filter(fn (Edge $edge): bool => in_array(mb_strtolower((string) $edge->status), self::BLOCKED_STATUSES, true))
                ->pluck('id')
                ->values()
                ->all(),
            'routing_metric' => $readiness['routing_metric'],
            'data_quality' => $readiness['verification_level'],
            'graph_version' => $readiness['graph_version'],
        ], $additional);
    }

    public function graphVersion(Village $village): string
    {
        $village->loadMissing(['nodes:id,village_id,updated_at', 'edges:id,village_id,updated_at']);
        $fingerprint = [
            'village_id' => $village->id,
            'import_batch_id' => $village->import_batch_id,
            'updated_at' => $village->updated_at?->toJSON(),
            'nodes' => $village->nodes->map(fn ($node): array => [$node->id, $node->updated_at?->toJSON()])->all(),
            'edges' => $village->edges->map(fn ($edge): array => [$edge->id, $edge->updated_at?->toJSON()])->all(),
        ];

        return 'gp-'.substr(hash('sha256', json_encode($fingerprint, JSON_THROW_ON_ERROR)), 0, 16);
    }

    public function edgeBelongsToVillage(Village $village, int|string $edgeIdentifier): bool
    {
        return $village->edges->contains(function (Edge $edge) use ($edgeIdentifier): bool {
            return (string) $edge->id === (string) $edgeIdentifier
                || ($edge->edge_code !== null && (string) $edge->edge_code === (string) $edgeIdentifier);
        });
    }

    private function routingMetric(Collection $edges): ?string
    {
        if ($edges->isEmpty()) {
            return null;
        }

        if ($edges->every(fn (Edge $edge): bool => (float) $edge->travel_minutes > 0)) {
            return 'travel_time_minutes';
        }

        if ($edges->every(fn (Edge $edge): bool => (float) $edge->length_meters > 0)) {
            return 'distance_meters';
        }

        return null;
    }

    private function hasValidGeometry(Edge $edge): bool
    {
        return is_array($edge->geometry)
            && count($edge->geometry) >= 2
            && collect($edge->geometry)->every(function ($coordinate): bool {
                return is_array($coordinate)
                    && count($coordinate) >= 2
                    && is_numeric($coordinate[0])
                    && is_numeric($coordinate[1]);
            });
    }

    private function verificationLevel(Village $village, bool $hasUnverifiedRecords): string
    {
        if ((bool) $village->is_demo) {
            return 'simulation_ready_sample';
        }

        return $hasUnverifiedRecords ? 'imported_unverified' : 'field_verified';
    }

    private function readinessStatus(
        Village $village,
        bool $canSimulate,
        Collection $nodes,
        Collection $edges,
        bool $hasUnverifiedRecords,
    ): string {
        if ($nodes->isEmpty() && $edges->isEmpty()) {
            return 'no_data';
        }

        if (! $canSimulate) {
            return 'incomplete_network';
        }

        if ((bool) $village->is_demo) {
            return 'simulation_ready_sample';
        }

        return $hasUnverifiedRecords ? 'imported_unverified' : 'field_verified';
    }

    private function componentCount(Collection $nodeIds, Collection $edges, Collection $ignoredEdgeIds): int
    {
        if ($nodeIds->isEmpty()) {
            return 0;
        }

        $adjacency = $nodeIds->mapWithKeys(fn ($id): array => [$id => []])->all();
        foreach ($edges as $edge) {
            if ($ignoredEdgeIds->contains($edge->id)) {
                continue;
            }
            $adjacency[$edge->source_node_id][] = $edge->target_node_id;
            $adjacency[$edge->target_node_id][] = $edge->source_node_id;
        }

        $visited = [];
        $components = 0;
        foreach ($nodeIds as $nodeId) {
            if (isset($visited[$nodeId])) {
                continue;
            }
            $components++;
            $queue = [$nodeId];
            $visited[$nodeId] = true;
            while ($queue !== []) {
                $current = array_shift($queue);
                foreach ($adjacency[$current] ?? [] as $neighbor) {
                    if (! isset($visited[$neighbor])) {
                        $visited[$neighbor] = true;
                        $queue[] = $neighbor;
                    }
                }
            }
        }

        return $components;
    }

    /**
     * @return list<string>
     */
    private function sources(Village $village): array
    {
        return collect([$village->data_source])
            ->merge($village->nodes->pluck('source'))
            ->merge($village->edges->pluck('provenance_source'))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function lastUpdatedAt(Village $village): ?string
    {
        return collect([
            $village->updated_at,
            $village->last_imported_at,
            $village->nodes->max('updated_at'),
            $village->edges->max('updated_at'),
        ])->filter()->max()?->toJSON();
    }

    /**
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     * @return list<array{label: string, target: string}>
     */
    private function recommendedActions(array $errors, array $warnings): array
    {
        $actions = [];
        if ($errors !== []) {
            $actions[] = ['label' => 'Add infrastructure', 'target' => '#/village-data'];
            $actions[] = ['label' => 'Import geographic data', 'target' => '#/village-map'];
        }
        if ($warnings !== []) {
            $actions[] = ['label' => 'Review and verify records', 'target' => '#/village-data'];
        }

        return $actions;
    }
}
