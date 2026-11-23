<?php

namespace App\Services;

use App\Models\Edge;
use App\Models\Facility;
use App\Models\Node;
use App\Models\SettlementGroup;
use App\Models\Village;
use Illuminate\Support\Facades\Schema;

class NetworkTopologyService
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

    /**
     * Great Circle Distance between two points in meters (Haversine formula).
     */
    public static function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Ensure complete topological integrity and connectivity for a village network.
     *
     * @return array<string, mixed>
     */
    public static function ensureVillageTopology(Village $village): array
    {
        $village->loadMissing(['nodes', 'edges', 'facilities', 'settlements']);

        $settlementsEnsured = self::ensureSettlements($village);
        $facilitiesEnsured = self::ensureFacilities($village);
        $connectorsCreated = self::snapPointsToRoadNetwork($village);
        $bridgesConnected = self::connectFloatingBridges($village);
        $travelTimesCalculated = self::calculateTravelTimes($village);

        $village->touch();

        return [
            'village_id' => $village->id,
            'village_name' => $village->name,
            'settlements_ensured' => $settlementsEnsured,
            'facilities_ensured' => $facilitiesEnsured,
            'connector_edges_created' => $connectorsCreated,
            'bridges_connected' => $bridgesConnected,
            'travel_times_calculated' => $travelTimesCalculated,
        ];
    }

    /**
     * Ensure all settlement nodes have corresponding SettlementGroup records and vice versa.
     */
    public static function ensureSettlements(Village $village): int
    {
        $createdOrLinked = 0;
        $settlementNodes = $village->nodes->filter(function ($n) {
            return mb_strtolower((string) ($n->node_type ?? $n->type)) === 'settlement';
        });

        foreach ($settlementNodes as $sn) {
            $existingGroup = null;
            if ($sn->settlement_group_id) {
                $existingGroup = SettlementGroup::find($sn->settlement_group_id);
            }
            if (!$existingGroup) {
                $existingGroup = SettlementGroup::where('village_id', $village->id)
                    ->where('name', $sn->name)
                    ->first();
            }

            if (!$existingGroup) {
                $existingGroup = self::createSettlementGroup([
                    'village_id' => $village->id,
                    'name' => $sn->name ?: "{$village->name} Settlement",
                    'households' => 45,
                    'population' => 210,
                ]);
                $createdOrLinked++;
            }

            if (Schema::hasColumn('nodes', 'settlement_group_id') && $sn->settlement_group_id !== $existingGroup->id) {
                $sn->update(['settlement_group_id' => $existingGroup->id]);
            }
        }

        // If village has 0 settlements, establish the primary administrative settlement at village center
        if ($village->settlements()->count() === 0) {
            $centerLat = (float) ($village->center_lat ?? $village->latitude ?? 27.7172);
            $centerLng = (float) ($village->center_lng ?? $village->longitude ?? 85.3240);

            $nodeAttrs = [
                'latitude' => $centerLat,
                'longitude' => $centerLng,
            ];
            if (Schema::hasColumn('nodes', 'node_code')) $nodeAttrs['node_code'] = "center_{$village->id}";
            if (Schema::hasColumn('nodes', 'source')) $nodeAttrs['source'] = 'system_baseline';
            if (Schema::hasColumn('nodes', 'verification_status')) $nodeAttrs['verification_status'] = 'imported';
            if (Schema::hasColumn('nodes', 'confidence_score')) $nodeAttrs['confidence_score'] = 85;
            if (Schema::hasColumn('nodes', 'node_type')) $nodeAttrs['node_type'] = 'settlement';
            if (Schema::hasColumn('nodes', 'type')) $nodeAttrs['type'] = 'settlement';

            $centerNode = Node::firstOrCreate(
                [
                    'village_id' => $village->id,
                    'name' => "{$village->name} Center",
                ],
                $nodeAttrs
            );

            $centerGroup = self::createSettlementGroup([
                'village_id' => $village->id,
                'name' => "{$village->name} Center",
                'households' => 65,
                'population' => 300,
            ]);

            $centerUpdate = [];
            if (Schema::hasColumn('nodes', 'node_type')) $centerUpdate['node_type'] = 'settlement';
            if (Schema::hasColumn('nodes', 'type')) $centerUpdate['type'] = 'settlement';
            if (Schema::hasColumn('nodes', 'settlement_group_id')) $centerUpdate['settlement_group_id'] = $centerGroup->id;
            $centerNode->update($centerUpdate);

            $createdOrLinked++;
        }

        return $createdOrLinked;
    }

    /**
     * Ensure facilities have corresponding nodes and essential community lifelines exist.
     */
    public static function ensureFacilities(Village $village): int
    {
        $createdOrLinked = 0;
        $villageNodes = $village->nodes;

        // Ensure all existing facility records link to a valid node
        foreach ($village->facilities as $fac) {
            if (!$fac->node_id || !$villageNodes->contains('id', $fac->node_id)) {
                $fNode = self::createNode([
                    'village_id' => $village->id,
                    'name' => $fac->name ?: "{$village->name} Facility",
                    'latitude' => (float) ($village->center_lat ?? 27.7172),
                    'longitude' => (float) ($village->center_lng ?? 85.3240),
                    'node_code' => "fac_{$fac->id}",
                    'node_type' => $fac->facility_type ?? $fac->type ?? 'facility',
                    'source' => 'system_baseline',
                    'verification_status' => 'imported',
                    'confidence_score' => 80,
                ]);
                $fac->update(['node_id' => $fNode->id]);
                $villageNodes->push($fNode);
                $createdOrLinked++;
            }
        }

        // If village has 0 facilities, create standard rural lifelines (Ward Health Post & Basic School)
        if ($village->facilities()->count() === 0) {
            $baseLat = (float) ($village->center_lat ?? $village->latitude ?? 27.7172);
            $baseLng = (float) ($village->center_lng ?? $village->longitude ?? 85.3240);

            // 1. Health Post
            $healthNode = self::createNode([
                'village_id' => $village->id,
                'name' => "{$village->name} Basic Health Post",
                'latitude' => $baseLat + 0.0006,
                'longitude' => $baseLng + 0.0006,
                'node_code' => "health_{$village->id}",
                'node_type' => 'health_post',
                'source' => 'system_baseline',
                'verification_status' => 'imported',
                'confidence_score' => 80,
            ]);

            self::createFacility([
                'village_id' => $village->id,
                'node_id' => $healthNode->id,
                'name' => "{$village->name} Basic Health Post",
                'facility_type' => 'health_post',
                'operational_status' => 'functional',
                'source' => 'system_baseline',
                'verification_status' => 'imported',
            ]);

            // 2. School
            $schoolNode = self::createNode([
                'village_id' => $village->id,
                'name' => "{$village->name} Basic School",
                'latitude' => $baseLat - 0.0006,
                'longitude' => $baseLng - 0.0006,
                'node_code' => "school_{$village->id}",
                'node_type' => 'school',
                'source' => 'system_baseline',
                'verification_status' => 'imported',
                'confidence_score' => 80,
            ]);

            self::createFacility([
                'village_id' => $village->id,
                'node_id' => $schoolNode->id,
                'name' => "{$village->name} Basic School",
                'facility_type' => 'school',
                'operational_status' => 'functional',
                'source' => 'system_baseline',
                'verification_status' => 'imported',
            ]);

            $createdOrLinked += 2;
        }

        return $createdOrLinked;
    }

    /**
     * Snaps isolated settlements and facility nodes to the nearest graph node on the road network.
     */
    public static function snapPointsToRoadNetwork(Village $village): int
    {
        $nodes = $village->nodes()->get();
        $edges = $village->edges()->get();

        $connectedNodeIds = [];
        foreach ($edges as $e) {
            $connectedNodeIds[$e->source_node_id] = true;
            $connectedNodeIds[$e->target_node_id] = true;
        }

        // Road nodes that are part of the network
        $roadNodes = $nodes->filter(fn ($n) => isset($connectedNodeIds[$n->id]));
        if ($roadNodes->isEmpty()) {
            return 0;
        }

        $facilityNodeIds = $village->facilities()->pluck('node_id')->filter()->flip()->all();

        $isolatedTargets = $nodes->filter(function ($n) use ($connectedNodeIds, $facilityNodeIds) {
            $isSettlement = ($n->node_type === 'settlement' || $n->type === 'settlement' || $n->settlement_group_id !== null);
            $isFacility = in_array(mb_strtolower((string) ($n->node_type ?? $n->type)), self::FACILITY_NODE_TYPES, true)
                || isset($facilityNodeIds[$n->id]);

            return ($isSettlement || $isFacility) && !isset($connectedNodeIds[$n->id]);
        });

        $createdConnectors = 0;

        foreach ($isolatedTargets as $node) {
            $nearest = null;
            $minDist = PHP_FLOAT_MAX;

            foreach ($roadNodes as $rn) {
                if ($rn->id === $node->id) continue;
                $dist = self::haversineDistance(
                    (float) $node->latitude,
                    (float) $node->longitude,
                    (float) $rn->latitude,
                    (float) $rn->longitude
                );
                if ($dist < $minDist) {
                    $minDist = $dist;
                    $nearest = $rn;
                }
            }

            if ($nearest && $minDist <= 5000.0) {
                $distKm = round($minDist / 1000.0, 4);
                $travelMins = max(0.5, round($minDist / 66.0, 1));

                self::createEdge([
                    'village_id' => $village->id,
                    'source_node_id' => $node->id,
                    'target_node_id' => $nearest->id,
                    'edge_code' => "connector_{$node->id}_{$nearest->id}",
                    'name' => "Access Trail to {$node->name}",
                    'infrastructure_type' => 'trail',
                    'highway_type' => 'path',
                    'surface_type' => 'dirt',
                    'status' => 'operational',
                    'length_meters' => round($minDist, 1),
                    'travel_minutes' => $travelMins,
                    'geometry' => [
                        [(float) $node->latitude, (float) $node->longitude],
                        [(float) $nearest->latitude, (float) $nearest->longitude],
                    ],
                    'source' => 'osm_access_connector',
                    'verification_status' => 'imported',
                    'confidence_score' => 85,
                ]);

                $connectedNodeIds[$node->id] = true;
                $roadNodes->push($node);
                $createdConnectors++;
            }
        }

        return $createdConnectors;
    }

    /**
     * Connects bridge endpoints that have degree 1 to nearby trails/roads within 300 meters.
     */
    public static function connectFloatingBridges(Village $village): int
    {
        $bridgeEdges = $village->edges->filter(function (Edge $edge): bool {
            return in_array($edge->infrastructure_type, ['bridge', 'suspension_bridge'], true);
        });

        if ($bridgeEdges->isEmpty()) {
            return 0;
        }

        $allEdges = $village->edges;
        $allNodes = $village->nodes->keyBy('id');

        $degreeCount = [];
        foreach ($allEdges as $e) {
            $degreeCount[$e->source_node_id] = ($degreeCount[$e->source_node_id] ?? 0) + 1;
            $degreeCount[$e->target_node_id] = ($degreeCount[$e->target_node_id] ?? 0) + 1;
        }

        $connected = 0;

        foreach ($bridgeEdges as $bridge) {
            foreach ([$bridge->source_node_id, $bridge->target_node_id] as $endpointId) {
                if (($degreeCount[$endpointId] ?? 0) <= 1) {
                    $endNode = $allNodes->get($endpointId);
                    if (!$endNode) continue;

                    // Find nearest non-bridge road node within 300 meters
                    $nearest = null;
                    $minDist = PHP_FLOAT_MAX;

                    foreach ($allNodes as $otherNode) {
                        if ($otherNode->id === $endpointId || $otherNode->id === $bridge->source_node_id || $otherNode->id === $bridge->target_node_id) {
                            continue;
                        }
                        if (($degreeCount[$otherNode->id] ?? 0) > 0) {
                            $dist = self::haversineDistance(
                                (float) $endNode->latitude,
                                (float) $endNode->longitude,
                                (float) $otherNode->latitude,
                                (float) $otherNode->longitude
                            );
                            if ($dist < $minDist) {
                                $minDist = $dist;
                                $nearest = $otherNode;
                            }
                        }
                    }

                    if ($nearest && $minDist <= 300.0) {
                        $travelMins = max(0.3, round($minDist / 66.0, 1));
                        self::createEdge([
                            'village_id' => $village->id,
                            'source_node_id' => $endNode->id,
                            'target_node_id' => $nearest->id,
                            'edge_code' => "bridge_approach_{$endNode->id}_{$nearest->id}",
                            'name' => "Bridge Approach Path ({$endNode->name})",
                            'infrastructure_type' => 'trail',
                            'highway_type' => 'footway',
                            'surface_type' => 'dirt',
                            'status' => 'operational',
                            'length_meters' => round($minDist, 1),
                            'travel_minutes' => $travelMins,
                            'geometry' => [
                                [(float) $endNode->latitude, (float) $endNode->longitude],
                                [(float) $nearest->latitude, (float) $nearest->longitude],
                            ],
                            'source' => 'osm_access_connector',
                            'verification_status' => 'imported',
                            'confidence_score' => 85,
                        ]);
                        $degreeCount[$endpointId] = ($degreeCount[$endpointId] ?? 0) + 1;
                        $degreeCount[$nearest->id] = ($degreeCount[$nearest->id] ?? 0) + 1;
                        $connected++;
                    }
                }
            }
        }

        return $connected;
    }

    /**
     * Compute and save travel times for any edge that lacks positive travel_minutes.
     */
    public static function calculateTravelTimes(Village $village): int
    {
        $edges = $village->edges()->where(function ($q) {
            $q->whereNull('travel_minutes')->orWhere('travel_minutes', '<=', 0);
        })->get();

        $updated = 0;

        foreach ($edges as $edge) {
            $infraType = $edge->infrastructure_type ?? 'road';
            $surfaceType = $edge->surface_type ?? 'gravel';
            $lengthMeters = (float) ($edge->length_meters ?? 300);

            $speedMPerMin = match ($infraType) {
                'road' => $surfaceType === 'paved' ? 500 : ($surfaceType === 'gravel' ? 300 : 166),
                'bridge', 'suspension_bridge' => 66,
                default => 66,
            };

            $estimatedMinutes = max(0.5, round($lengthMeters / $speedMPerMin, 1));
            $edge->update(['travel_minutes' => $estimatedMinutes]);
            $updated++;
        }

        return $updated;
    }

    public static function createNode(array $data): Node
    {
        $attrs = [
            'village_id' => $data['village_id'],
            'name' => $data['name'],
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
        ];
        if (isset($data['node_code']) && Schema::hasColumn('nodes', 'node_code')) $attrs['node_code'] = $data['node_code'];
        if (isset($data['source']) && Schema::hasColumn('nodes', 'source')) $attrs['source'] = $data['source'];
        if (isset($data['verification_status']) && Schema::hasColumn('nodes', 'verification_status')) $attrs['verification_status'] = $data['verification_status'];
        if (isset($data['confidence_score']) && Schema::hasColumn('nodes', 'confidence_score')) $attrs['confidence_score'] = $data['confidence_score'];
        $type = $data['node_type'] ?? $data['type'] ?? 'junction';
        if (Schema::hasColumn('nodes', 'node_type')) $attrs['node_type'] = $type;
        if (Schema::hasColumn('nodes', 'type')) $attrs['type'] = $type;
        if (isset($data['settlement_group_id']) && Schema::hasColumn('nodes', 'settlement_group_id')) {
            $attrs['settlement_group_id'] = $data['settlement_group_id'];
        }
        return Node::create($attrs);
    }

    public static function createSettlementGroup(array $data): SettlementGroup
    {
        $attrs = [
            'village_id' => $data['village_id'],
            'name' => $data['name'],
        ];
        if (Schema::hasColumn('settlement_groups', 'households')) $attrs['households'] = $data['households'] ?? 45;
        if (Schema::hasColumn('settlement_groups', 'population')) $attrs['population'] = $data['population'] ?? 210;
        if (Schema::hasColumn('settlement_groups', 'estimated_population')) $attrs['estimated_population'] = $data['population'] ?? 210;
        if (isset($data['node_id']) && Schema::hasColumn('settlement_groups', 'node_id')) $attrs['node_id'] = $data['node_id'];
        return SettlementGroup::create($attrs);
    }

    public static function createFacility(array $data): Facility
    {
        $attrs = [
            'village_id' => $data['village_id'],
            'name' => $data['name'],
            'node_id' => $data['node_id'] ?? null,
        ];
        if (isset($data['operational_status']) && Schema::hasColumn('facilities', 'operational_status')) {
            $attrs['operational_status'] = $data['operational_status'];
        }
        if (isset($data['source']) && Schema::hasColumn('facilities', 'source')) {
            $attrs['source'] = $data['source'];
        }
        if (isset($data['verification_status']) && Schema::hasColumn('facilities', 'verification_status')) {
            $attrs['verification_status'] = $data['verification_status'];
        }
        $type = $data['facility_type'] ?? $data['type'] ?? 'facility';
        if (Schema::hasColumn('facilities', 'facility_type')) $attrs['facility_type'] = $type;
        if (Schema::hasColumn('facilities', 'type')) $attrs['type'] = $type;
        return Facility::create($attrs);
    }

    public static function createEdge(array $data): Edge
    {
        $attrs = [
            'village_id' => $data['village_id'],
            'source_node_id' => $data['source_node_id'],
            'target_node_id' => $data['target_node_id'],
            'name' => $data['name'],
            'status' => $data['status'] ?? 'operational',
        ];
        if (Schema::hasColumn('edges', 'geometry')) $attrs['geometry'] = $data['geometry'] ?? [];
        if (isset($data['source']) && Schema::hasColumn('edges', 'source')) $attrs['source'] = $data['source'];
        if (isset($data['verification_status']) && Schema::hasColumn('edges', 'verification_status')) $attrs['verification_status'] = $data['verification_status'];
        if (isset($data['confidence_score']) && Schema::hasColumn('edges', 'confidence_score')) $attrs['confidence_score'] = $data['confidence_score'];
        $infraType = $data['infrastructure_type'] ?? $data['type'] ?? 'trail';
        if (Schema::hasColumn('edges', 'infrastructure_type')) $attrs['infrastructure_type'] = $infraType;
        if (Schema::hasColumn('edges', 'type')) $attrs['type'] = $infraType;
        if (Schema::hasColumn('edges', 'edge_code')) $attrs['edge_code'] = $data['edge_code'] ?? null;
        if (Schema::hasColumn('edges', 'highway_type')) $attrs['highway_type'] = $data['highway_type'] ?? 'path';
        if (Schema::hasColumn('edges', 'surface_type')) $attrs['surface_type'] = $data['surface_type'] ?? 'dirt';
        if (Schema::hasColumn('edges', 'length_meters')) $attrs['length_meters'] = $data['length_meters'] ?? null;
        if (Schema::hasColumn('edges', 'distance')) $attrs['distance'] = round(($data['length_meters'] ?? 0) / 1000.0, 4);
        if (Schema::hasColumn('edges', 'travel_minutes')) $attrs['travel_minutes'] = $data['travel_minutes'] ?? null;
        return Edge::create($attrs);
    }
}
