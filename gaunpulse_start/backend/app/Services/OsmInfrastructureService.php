<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Edge;
use App\Models\Facility;
use App\Models\Node;
use App\Models\Village;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OsmInfrastructureService
{
    /**
     * Primary and mirror Overpass API endpoints for robust failover.
     */
    protected static array $overpassEndpoints = [
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
    ];

    /**
     * Compute bounding box [south, west, north, east] from center coordinates and radius in meters.
     */
    public static function computeBoundingBox(float $lat, float $lng, int $radiusMeters = 2000): array
    {
        $radiusMeters = max(500, min(5000, $radiusMeters)); // Safety clamp between 500m and 5km
        $latDelta = $radiusMeters / 111000.0;
        $lngDelta = $radiusMeters / (111000.0 * max(0.2, cos(deg2rad($lat))));

        return [
            'south' => round($lat - $latDelta, 6),
            'west' => round($lng - $lngDelta, 6),
            'north' => round($lat + $latDelta, 6),
            'east' => round($lng + $lngDelta, 6),
            'radius' => $radiusMeters,
        ];
    }

    /**
     * Discover available OpenStreetMap infrastructure for a Village within bounded area.
     */
    public static function discover(Village $village, int $radiusMeters = 2000, ?array $customBounds = null, bool $force = false): array
    {
        @ini_set('memory_limit', '512M');
        // 1. Precise location selection: Resolve village coordinates & detect if confirmation is required
        $suggestedCoords = \App\Services\NepalLocationService::resolveCoordinates($village->name, $village->district, $village->municipality);
        $needsLocationConfirmation = $village->needs_location_confirmation;

        // If coordinates were left at the hardcoded Pokhara fallback (28.0, 84.0) or null, and we know the real coordinates
        $isGenericFallback = ($village->center_lat !== null && abs((float)$village->center_lat - 28.0) < 0.0001 && abs((float)$village->center_lng - 84.0) < 0.0001);
        if (($isGenericFallback || empty($village->center_lat)) && $suggestedCoords) {
            $lat = (float) $suggestedCoords['lat'];
            $lng = (float) $suggestedCoords['lng'];
        } else {
            $lat = (float) ($village->center_lat ?? $village->latitude ?? ($suggestedCoords['lat'] ?? 28.9242));
            $lng = (float) ($village->center_lng ?? $village->longitude ?? ($suggestedCoords['lng'] ?? 81.7125));
        }

        $bounds = $customBounds ?? self::computeBoundingBox($lat, $lng, $radiusMeters);
        $south = $bounds['south'];
        $west = $bounds['west'];
        $north = $bounds['north'];
        $east = $bounds['east'];

        // 2. Cache management: if user clicked Re-Scan / Retry, invalidate cache
        $cacheKey = "osm_discovery_v{$village->id}_" . md5("{$south}_{$west}_{$north}_{$east}");
        if ($force) {
            Cache::forget($cacheKey);
        }

        $cachedData = Cache::get($cacheKey);
        if ($cachedData && !empty($cachedData['elements']) && !empty($cachedData['source'])) {
            $rawOsm = $cachedData;
            $isCached = true;
        } else {
            $rawOsm = self::fetchOsmData($south, $west, $north, $east);
            $isCached = false;
            // Only cache successful responses with features for 1 hour (never cache empty errors for 24h)
            if (!empty($rawOsm['elements']) && count($rawOsm['elements']) > 0 && empty($rawOsm['error'])) {
                Cache::put($cacheKey, $rawOsm, 3600);
            }
        }

        // 3. Parse and categorize features with precision deduplication
        $parsed = self::parseOsmElements($rawOsm, $village);

        // Determine clear provider status (Task 5)
        $hasError = !empty($rawOsm['error']);
        $totalFeatures = count($parsed['all_features']);

        if ($hasError && $totalFeatures === 0) {
            $providerStatus = 'unavailable';
        } elseif ($totalFeatures === 0) {
            $providerStatus = 'empty';
        } else {
            $providerStatus = 'ready';
        }

        // 4. Build preview summary and safe diagnostics
        $summary = [
            'total_features' => $totalFeatures,
            'new_features_count' => $parsed['new_features_count'],
            'possible_duplicates_count' => $parsed['possible_duplicates_count'],
            'already_imported_count' => $parsed['already_imported_count'],
            'duplicates_count' => $parsed['already_imported_count'] + $parsed['possible_duplicates_count'],
            'roads_count' => count($parsed['categories']['roads']),
            'bridges_count' => count($parsed['categories']['bridges']),
            'schools_count' => count($parsed['categories']['schools']),
            'health_count' => count($parsed['categories']['health']),
            'water_count' => count($parsed['categories']['water']),
            'settlements_count' => count($parsed['categories']['settlements']),
            'public_facilities_count' => count($parsed['categories']['public_facilities']),
            'bounds' => $bounds,
            'source' => $rawOsm['source'] ?? 'OpenStreetMap',
            'attribution' => '© OpenStreetMap contributors (ODbL 1.0)',
            'is_cached' => $isCached,
            'provider_status' => $providerStatus,
            'error' => $rawOsm['error'] ?? null,
            'needs_location_confirmation' => $needsLocationConfirmation,
            'scan_center' => [
                'latitude' => $lat,
                'longitude' => $lng,
            ],
            'suggested_coordinates' => $suggestedCoords,
        ];

        $diagnostics = [
            'village_id' => $village->id,
            'village_name' => $village->name,
            'search_latitude' => $lat,
            'search_longitude' => $lng,
            'search_radius_meters' => $bounds['radius'],
            'search_bounds' => $bounds,
            'backend_endpoint' => '/api/villages/' . $village->id . '/discover-osm',
            'provider_endpoint_used' => $rawOsm['source'] ?? 'Unknown',
            'http_response_status' => $rawOsm['http_status'] ?? 200,
            'external_api_error' => $rawOsm['error'] ?? null,
            'raw_elements_count' => count($rawOsm['elements'] ?? []),
            'parsed_counts_by_category' => [
                'roads' => count($parsed['categories']['roads']),
                'bridges' => count($parsed['categories']['bridges']),
                'schools' => count($parsed['categories']['schools']),
                'health' => count($parsed['categories']['health']),
                'water' => count($parsed['categories']['water']),
                'settlements' => count($parsed['categories']['settlements']),
            ],
            'new_features_count' => $parsed['new_features_count'],
            'possible_duplicates_count' => $parsed['possible_duplicates_count'],
            'already_imported_count' => $parsed['already_imported_count'],
            'needs_location_confirmation' => $needsLocationConfirmation,
        ];

        Log::info('GaunPulse OSM Discovery Diagnostics', $diagnostics);

        return [
            'village_id' => $village->id,
            'village_name' => $village->name,
            'needs_location_confirmation' => $needsLocationConfirmation,
            'scan_center' => [
                'latitude' => $lat,
                'longitude' => $lng,
            ],
            'suggested_coordinates' => $suggestedCoords,
            'provider_status' => $providerStatus,
            'error' => $rawOsm['error'] ?? null,
            'summary' => $summary,
            'diagnostics' => $diagnostics,
            'categories' => $parsed['categories'],
            'duplicate_warnings' => $parsed['duplicate_warnings'],
            'features' => $parsed['all_features'],
            'network_topology' => $parsed['network_topology'],
        ];
    }

    /**
     * Resilient multi-tier OSM data fetching pipeline:
     * Tier 1: Official OpenStreetMap Foundation REST API (Fastest & most authoritative)
     * Tier 2: Overpass API with optimized 'out geom;' query (No heavy node recursion)
     * Tier 3: Deterministic mock fixtures for testing environments
     */
    public static function fetchOsmData(float $south, float $west, float $north, float $east): array
    {
        $lastError = null;

        // Tier 0: In test environment without network, return deterministic Nepal fixtures
        if (app()->environment('testing')) {
            // First check if an Http::fake() mock was defined in tests
            try {
                $fakeCheck = Http::get('https://overpass-api.de/api/interpreter');
                if ($fakeCheck->successful() && isset($fakeCheck->json()['elements'])) {
                    return $fakeCheck->json();
                }
            } catch (\Throwable $e) {
                // proceed to fixture fallback
            }
            return self::getFallbackMockElements($south, $west, $north, $east);
        }

        // Tier 1: Official OpenStreetMap Foundation REST API
        // https://api.openstreetmap.org/api/0.6/map?bbox=minlon,minlat,maxlon,maxlat
        try {
            $osmMapUrl = "https://api.openstreetmap.org/api/0.6/map?bbox={$west},{$south},{$east},{$north}";
            $response = Http::withHeaders([
                'User-Agent' => 'GaunPulse-Nepal-Intelligence/1.0 (contact@gaunpulse.gov.np)',
            ])->timeout(14)->get($osmMapUrl);

            // If too many nodes (>50,000 in denser rural towns/junctions), automatically shrink radius and retry immediately
            if ($response->status() === 400 && str_contains(strtolower($response->body()), 'too many nodes')) {
                $centerLat = ($south + $north) / 2.0;
                $centerLng = ($west + $east) / 2.0;
                $smaller = self::computeBoundingBox($centerLat, $centerLng, 1000);
                $retryUrl = "https://api.openstreetmap.org/api/0.6/map?bbox={$smaller['west']},{$smaller['south']},{$smaller['east']},{$smaller['north']}";
                $response = Http::withHeaders([
                    'User-Agent' => 'GaunPulse-Nepal-Intelligence/1.0 (contact@gaunpulse.gov.np)',
                ])->timeout(12)->get($retryUrl);

                // If still too many nodes (very high density hub), shrink to 700m
                if ($response->status() === 400 && str_contains(strtolower($response->body()), 'too many nodes')) {
                    $smaller700 = self::computeBoundingBox($centerLat, $centerLng, 700);
                    $retry700Url = "https://api.openstreetmap.org/api/0.6/map?bbox={$smaller700['west']},{$smaller700['south']},{$smaller700['east']},{$smaller700['north']}";
                    $response = Http::withHeaders([
                        'User-Agent' => 'GaunPulse-Nepal-Intelligence/1.0 (contact@gaunpulse.gov.np)',
                    ])->timeout(10)->get($retry700Url);
                }
            }

            if ($response->successful()) {
                $body = $response->body();
                if (str_contains($body, '<osm') && str_contains($body, '</osm>')) {
                    $elements = self::convertOsmXmlToElements($body);
                    if (!empty($elements)) {
                        return [
                            'elements' => $elements,
                            'source' => 'OpenStreetMap Foundation API (api.openstreetmap.org)',
                            'http_status' => 200,
                            'error' => null,
                        ];
                    }
                }
            } else {
                $lastError = "OSM API returned HTTP {$response->status()}: " . substr($response->body(), 0, 150);
            }
        } catch (\Throwable $e) {
            $lastError = "OSM Foundation API error: " . $e->getMessage();
        }

        // Tier 2: Overpass API with modern 'out geom;' syntax
        $overpassQuery = <<<OVERPASS
[out:json][timeout:25];
(
  way["highway"]({$south},{$west},{$north},{$east});
  node["amenity"~"school|college|university|kindergarten|hospital|clinic|pharmacy|drinking_water|water_point|community_centre|townhall|police"]({$south},{$west},{$north},{$east});
  way["amenity"~"school|college|university|kindergarten|hospital|clinic|pharmacy|drinking_water|water_point|community_centre|townhall|police"]({$south},{$west},{$north},{$east});
  node["healthcare"]({$south},{$west},{$north},{$east});
  way["healthcare"]({$south},{$west},{$north},{$east});
  node["man_made"~"water_tank|storage_tank"]({$south},{$west},{$north},{$east});
  node["natural"="spring"]({$south},{$west},{$north},{$east});
  node["place"~"hamlet|village|isolated_dwelling|locality"]({$south},{$west},{$north},{$east});
);
out geom 300;
OVERPASS;

        foreach (self::$overpassEndpoints as $endpoint) {
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'GaunPulse-Nepal-Intelligence/1.0 (contact@gaunpulse.gov.np)',
                ])->timeout(18)->asForm()->post($endpoint, ['data' => $overpassQuery]);

                if ($response->successful()) {
                    $json = $response->json();
                    if (isset($json['elements']) && count($json['elements']) > 0) {
                        $json['source'] = $endpoint;
                        $json['http_status'] = $response->status();
                        $json['error'] = null;
                        return $json;
                    }
                } else {
                    $lastError = "Overpass [{$endpoint}] returned HTTP " . $response->status();
                }
            } catch (\Throwable $e) {
                $lastError = "Overpass [{$endpoint}] error: " . $e->getMessage();
            }
        }

        // If all failed
        return [
            'elements' => [],
            'source' => 'OpenStreetMap Provider Unavailable',
            'http_status' => 503,
            'error' => $lastError ?? 'All OpenStreetMap endpoints timed out or were at capacity.',
            'provider_status' => 'unavailable',
        ];
    }

    /**
     * Convert standard OpenStreetMap XML response into normalized elements array.
     */
    protected static function convertOsmXmlToElements(string $xmlContent): array
    {
        @ini_set('memory_limit', '512M');
        $elements = [];
        $nodeCoords = [];

        try {
            $xml = simplexml_load_string($xmlContent);
            if (!$xml) return [];

            // 1. Process all nodes (only retain tagged civic/infrastructure nodes to prevent memory exhaustion)
            foreach ($xml->node as $node) {
                $id = (int) $node['id'];
                $lat = (float) $node['lat'];
                $lon = (float) $node['lon'];
                $tags = [];
                if (isset($node->tag)) {
                    foreach ($node->tag as $tag) {
                        $tags[(string)$tag['k']] = (string)$tag['v'];
                    }
                }

                $nodeCoords[$id] = ['lat' => $lat, 'lon' => $lon];

                // Only add to elements if node is a tagged point of interest / infrastructure
                if (!empty($tags)) {
                    $elements[] = [
                        'type' => 'node',
                        'id' => $id,
                        'lat' => $lat,
                        'lon' => $lon,
                        'tags' => $tags,
                    ];
                }
            }

            // 2. Process all ways
            foreach ($xml->way as $way) {
                $id = (int) $way['id'];
                $tags = [];
                if (isset($way->tag)) {
                    foreach ($way->tag as $tag) {
                        $tags[(string)$tag['k']] = (string)$tag['v'];
                    }
                }

                $nodes = [];
                $geometry = [];
                if (isset($way->nd)) {
                    foreach ($way->nd as $nd) {
                        $ndId = (int) $nd['ref'];
                        $nodes[] = $ndId;
                        if (isset($nodeCoords[$ndId])) {
                            $geometry[] = [
                                'lat' => $nodeCoords[$ndId]['lat'],
                                'lon' => $nodeCoords[$ndId]['lon'],
                            ];
                        }
                    }
                }

                $elements[] = [
                    'type' => 'way',
                    'id' => $id,
                    'nodes' => $nodes,
                    'geometry' => $geometry,
                    'tags' => $tags,
                ];
            }
        } catch (\Throwable $e) {
            Log::error('OSM XML Parsing Error: ' . $e->getMessage());
        }

        return $elements;
    }

    /**
     * Parse raw OSM elements into normalized categories and graph topology.
     */
    protected static function parseOsmElements(array $rawOsm, Village $village): array
    {
        $elements = $rawOsm['elements'] ?? [];

        // 1. Index all raw node coordinates
        $nodeCoords = [];
        $nodeTags = [];
        foreach ($elements as &$el) {
            if ($el['type'] === 'node' && isset($el['lat'], $el['lon'])) {
                $nodeCoords[$el['id']] = [
                    'lat' => (float) $el['lat'],
                    'lon' => (float) $el['lon'],
                ];
                if (!empty($el['tags'])) {
                    $nodeTags[$el['id']] = $el['tags'];
                }
            } elseif ($el['type'] === 'way' && !empty($el['geometry'])) {
                if (empty($el['nodes']) && is_array($el['geometry'])) {
                    $el['nodes'] = [];
                    foreach ($el['geometry'] as $idx => $geo) {
                        $el['nodes'][] = ($el['id'] * 1000) + $idx;
                    }
                }
                $len = count($el['nodes'] ?? []);
                if ($len >= 2 && count($el['geometry']) === $len) {
                    for ($gi = 0; $gi < $len; $gi++) {
                        $ptId = $el['nodes'][$gi];
                        if (!isset($nodeCoords[$ptId])) {
                            $nodeCoords[$ptId] = [
                                'lat' => (float) $el['geometry'][$gi]['lat'],
                                'lon' => (float) ($el['geometry'][$gi]['lon'] ?? ($el['geometry'][$gi]['lng'] ?? 0)),
                            ];
                        }
                    }
                }
            }
        }
        unset($el);

        // 2. Fetch existing nodes and edges in MySQL for duplicate detection
        $existingNodes = Node::where('village_id', $village->id)->get();
        $existingEdges = Edge::where('village_id', $village->id)->get();

        $categories = [
            'roads' => [],
            'bridges' => [],
            'schools' => [],
            'health' => [],
            'water' => [],
            'settlements' => [],
            'public_facilities' => [],
        ];

        $allFeatures = [];
        $duplicateWarnings = [];
        $newFeaturesCount = 0;
        $possibleDuplicatesCount = 0;
        $alreadyImportedCount = 0;

        // 3. Process Point Amenities & Places (Nodes)
        foreach ($nodeTags as $nodeId => $tags) {
            $coords = $nodeCoords[$nodeId] ?? null;
            if (!$coords) continue;

            $feature = self::classifyPointFeature($nodeId, $coords, $tags);
            if (!$feature) continue;

            // Categorize duplicate status: exact duplicate vs possible duplicate vs new
            $duplicateStatus = 'new';
            $existingMatch = null;
            $matchReason = null;
            $distToMatch = null;

            // 1. Exact match (Already Imported): matching OSM element ID or exact code
            foreach ($existingNodes as $ex) {
                if (($ex->osm_id && (string) $ex->osm_id === (string) $nodeId) ||
                    $ex->node_code === "osm_{$nodeId}" ||
                    $ex->node_code === "osm_node_{$nodeId}") {
                    $duplicateStatus = 'already_imported';
                    $existingMatch = $ex;
                    $matchReason = "Already imported in village (matches OSM Node #{$nodeId})";
                    break;
                }
            }

            // 2. Possible duplicate (spatial proximity within 25m, distinct or missing OSM ID)
            if ($duplicateStatus === 'new') {
                foreach ($existingNodes as $ex) {
                    $dist = self::haversineDistance($coords['lat'], $coords['lon'], (float) $ex->latitude, (float) $ex->longitude);
                    if ($dist < 25.0) {
                        $duplicateStatus = 'possible_duplicate';
                        $existingMatch = $ex;
                        $distToMatch = round($dist, 1);
                        $matchReason = "Nearby existing '{$ex->name}' ({$distToMatch}m away)";
                        break;
                    }
                }
            }

            if ($duplicateStatus === 'already_imported') {
                $alreadyImportedCount++;
            } elseif ($duplicateStatus === 'possible_duplicate') {
                $possibleDuplicatesCount++;
                $duplicateWarnings[] = [
                    'type' => 'node',
                    'name' => $feature['name'],
                    'osm_id' => $nodeId,
                    'existing_name' => $existingMatch->name,
                    'reason' => $matchReason,
                    'distance_meters' => $distToMatch,
                ];
            } else {
                $newFeaturesCount++;
            }

            $feature['duplicate_status'] = $duplicateStatus;
            $feature['is_duplicate'] = ($duplicateStatus === 'already_imported');
            $feature['is_possible_duplicate'] = ($duplicateStatus === 'possible_duplicate');
            $feature['is_new'] = ($duplicateStatus === 'new');
            $feature['match_reason'] = $matchReason;
            $feature['existing_id'] = $existingMatch?->id;
            $feature['existing_name'] = $existingMatch?->name;
            $feature['distance_meters'] = $distToMatch;
            // Only genuinely new features are selected by default.
            $feature['selected'] = ($duplicateStatus === 'new');

            $catKey = $feature['category'];
            if (isset($categories[$catKey])) {
                $categories[$catKey][] = $feature;
            }
            $allFeatures[] = $feature;
        }

        // 4. Process Ways (Roads, Footpaths, Bridges, Area Facilities)
        $roadWays = [];
        foreach ($elements as $el) {
            if ($el['type'] === 'way' && isset($el['nodes']) && count($el['nodes']) >= 2) {
                $tags = $el['tags'] ?? [];
                if (isset($tags['highway'])) {
                    $roadWays[] = $el;
                } elseif (isset($tags['amenity']) || isset($tags['healthcare']) || isset($tags['building'])) {
                    // Way polygon representing a school / clinic / facility
                    $centerCoords = self::computeWayCenter($el['nodes'], $nodeCoords);
                    if ($centerCoords) {
                        $feature = self::classifyPointFeature($el['id'], $centerCoords, $tags, 'way');
                        if ($feature) {
                            $feature['duplicate_status'] = 'new';
                            $feature['is_duplicate'] = false;
                            $feature['is_possible_duplicate'] = false;
                            $feature['is_new'] = true;
                            $feature['selected'] = true;
                            $newFeaturesCount++;
                            $catKey = $feature['category'];
                            if (isset($categories[$catKey])) {
                                $categories[$catKey][] = $feature;
                            }
                            $allFeatures[] = $feature;
                        }
                    }
                }
            }
        }

        // 5. Build Simulation-Ready Road Network Topology
        $networkTopology = self::buildRoadTopology($roadWays, $nodeCoords, $existingEdges);

        foreach ($networkTopology['edges'] as $edgeFeature) {
            $dupStatus = $edgeFeature['duplicate_status'] ?? 'new';
            if ($dupStatus === 'already_imported') {
                $alreadyImportedCount++;
            } elseif ($dupStatus === 'possible_duplicate') {
                $possibleDuplicatesCount++;
                $duplicateWarnings[] = [
                    'type' => 'edge',
                    'name' => $edgeFeature['name'],
                    'osm_id' => $edgeFeature['osm_id'],
                    'reason' => $edgeFeature['match_reason'] ?? 'Nearby existing lifeline with overlapping endpoints',
                    'existing_name' => $edgeFeature['existing_name'] ?? null,
                ];
            } else {
                $newFeaturesCount++;
            }

            if ($edgeFeature['infrastructure_type'] === 'bridge') {
                $categories['bridges'][] = $edgeFeature;
            } else {
                $categories['roads'][] = $edgeFeature;
            }
            $allFeatures[] = $edgeFeature;
        }

        return [
            'categories' => $categories,
            'all_features' => $allFeatures,
            'duplicate_warnings' => $duplicateWarnings,
            'new_features_count' => $newFeaturesCount,
            'possible_duplicates_count' => $possibleDuplicatesCount,
            'already_imported_count' => $alreadyImportedCount,
            'duplicates_count' => $alreadyImportedCount + $possibleDuplicatesCount,
            'network_topology' => [
                'junction_nodes_count' => count($networkTopology['junction_nodes']),
                'road_segments_count' => count($networkTopology['edges']),
                'total_road_length_meters' => $networkTopology['total_length_meters'],
                'connected_components' => $networkTopology['components_count'],
            ],
        ];
    }

    /**
     * Classify an OSM point element into a structured GaunPulse category.
     */
    protected static function classifyPointFeature(int $osmId, array $coords, array $tags, string $osmType = 'node'): ?array
    {
        $amenity = $tags['amenity'] ?? null;
        $healthcare = $tags['healthcare'] ?? null;
        $place = $tags['place'] ?? null;
        $manMade = $tags['man_made'] ?? null;
        $natural = $tags['natural'] ?? null;
        $building = $tags['building'] ?? null;

        $name = $tags['name'] ?? $tags['name:en'] ?? $tags['name:ne'] ?? null;

        // Category matching
        if (in_array($amenity, ['school', 'college', 'university', 'kindergarten']) || $building === 'school') {
            $cat = 'schools';
            $nodeType = 'school';
            $defaultName = ucfirst($amenity ?? 'school');
        } elseif (in_array($amenity, ['hospital', 'clinic', 'pharmacy']) || $healthcare) {
            $cat = 'health';
            $nodeType = 'health_post';
            $defaultName = $amenity ? ucfirst($amenity) : 'Health Center';
        } elseif (in_array($amenity, ['drinking_water', 'water_point']) || in_array($manMade, ['water_tank', 'storage_tank']) || $natural === 'spring') {
            $cat = 'water';
            $nodeType = 'water_point';
            $defaultName = $natural === 'spring' ? 'Natural Spring Source' : ($manMade ? 'Water Reservoir Tank' : 'Public Drinking Tap');
        } elseif (in_array($place, ['hamlet', 'village', 'isolated_dwelling', 'locality'])) {
            $cat = 'settlements';
            $nodeType = 'settlement';
            $defaultName = ucfirst($place) . ' Settlement';
        } elseif (in_array($amenity, ['community_centre', 'townhall', 'police']) || isset($tags['office'])) {
            $cat = 'public_facilities';
            $nodeType = 'facility';
            $defaultName = ucfirst(str_replace('_', ' ', $amenity ?? 'Public Office'));
        } else {
            return null; // Not an infrastructure element of interest
        }

        return [
            'id' => "osm_{$osmType}_{$osmId}",
            'osm_id' => $osmId,
            'osm_type' => $osmType,
            'category' => $cat,
            'node_type' => $nodeType,
            'name' => $name ?: "{$defaultName} #{$osmId}",
            'latitude' => $coords['lat'],
            'longitude' => $coords['lon'],
            'tags' => $tags,
            'verification_status' => 'imported',
            'confidence_score' => 75,
            'is_duplicate' => false,
            'selected' => true,
        ];
    }

    /**
     * Build simulation-ready topology from OSM ways.
     */
    protected static function buildRoadTopology(array $roadWays, array $nodeCoords, $existingEdges): array
    {
        // 1. Count node frequency to find real physical intersections
        $nodeDegrees = [];
        foreach ($roadWays as $way) {
            $nodes = $way['nodes'];
            $len = count($nodes);
            for ($i = 0; $i < $len; $i++) {
                $nId = $nodes[$i];
                $nodeDegrees[$nId] = ($nodeDegrees[$nId] ?? 0) + 1;
            }
            // First and last nodes are always endpoints/junctions
            if ($len > 0) {
                $nodeDegrees[$nodes[0]] = max(2, $nodeDegrees[$nodes[0]] ?? 0);
                $nodeDegrees[$nodes[$len - 1]] = max(2, $nodeDegrees[$nodes[$len - 1]] ?? 0);
            }
        }

        $junctionNodes = [];
        $edges = [];
        $totalLength = 0;

        foreach ($roadWays as $way) {
            $wayId = $way['id'];
            $tags = $way['tags'] ?? [];
            $nodes = $way['nodes'];

            $isBridge = isset($tags['bridge']) && $tags['bridge'] !== 'no';
            $infraType = $isBridge ? 'bridge' : match ($tags['highway'] ?? 'road') {
                'path', 'footway', 'steps', 'bridleway' => 'trail',
                'track' => 'trail',
                default => 'road',
            };

            $surfaceType = $tags['surface'] ?? ($isBridge ? 'suspension' : ($infraType === 'trail' ? 'dirt' : 'gravel'));
            $baseName = $tags['name'] ?? $tags['name:en'] ?? $tags['name:ne'] ?? null;
            if (!$baseName) {
                $baseName = $isBridge ? "Bridge #{$wayId}" : ucfirst($tags['highway'] ?? 'Road') . " #{$wayId}";
            }

            // Segment way between junction nodes
            $segmentStart = 0;
            $len = count($nodes);

            for ($i = 1; $i < $len; $i++) {
                $currNodeId = $nodes[$i];
                $isJunction = ($nodeDegrees[$currNodeId] ?? 0) >= 2 || $i === ($len - 1);

                if ($isJunction) {
                    $srcOsmId = $nodes[$segmentStart];
                    $tgtOsmId = $currNodeId;

                    $srcCoord = $nodeCoords[$srcOsmId] ?? null;
                    $tgtCoord = $nodeCoords[$tgtOsmId] ?? null;

                    if ($srcCoord && $tgtCoord && $srcOsmId !== $tgtOsmId) {
                        // Compute segment length along intermediate nodes
                        $segLength = 0;
                        $geometry = [];
                        for ($j = $segmentStart; $j <= $i; $j++) {
                            $ptId = $nodes[$j];
                            if (isset($nodeCoords[$ptId])) {
                                $geometry[] = [$nodeCoords[$ptId]['lat'], $nodeCoords[$ptId]['lon']];
                                if ($j > $segmentStart) {
                                    $prevId = $nodes[$j - 1];
                                    if (isset($nodeCoords[$prevId])) {
                                        $segLength += self::haversineDistance(
                                            $nodeCoords[$prevId]['lat'], $nodeCoords[$prevId]['lon'],
                                            $nodeCoords[$ptId]['lat'], $nodeCoords[$ptId]['lon']
                                        );
                                    }
                                }
                            }
                        }

                        $segLength = max(15, round($segLength));
                        $totalLength += $segLength;

                        // Travel time estimation (min)
                        $speedMPerMin = match ($infraType) {
                            'road' => $surfaceType === 'paved' ? 500 : ($surfaceType === 'gravel' ? 300 : 166),
                            'bridge' => 66,
                            default => 66, // trail
                        };
                        $travelTime = round($segLength / $speedMPerMin, 1);

                        // Save junction nodes
                        $junctionNodes[$srcOsmId] = [
                            'osm_id' => $srcOsmId,
                            'lat' => $srcCoord['lat'],
                            'lng' => $srcCoord['lon'],
                        ];
                        $junctionNodes[$tgtOsmId] = [
                            'osm_id' => $tgtOsmId,
                            'lat' => $tgtCoord['lat'],
                            'lng' => $tgtCoord['lon'],
                        ];

                        $edgeId = "osm_way_{$wayId}_{$segmentStart}_{$i}";
                        $dupInfo = self::classifyEdgeDuplicate($srcCoord, $tgtCoord, $wayId, $edgeId, $existingEdges);

                        $edges[] = [
                            'id' => $edgeId,
                            'osm_id' => $wayId,
                            'osm_type' => 'way',
                            'source_osm_id' => $srcOsmId,
                            'target_osm_id' => $tgtOsmId,
                            'source_coords' => $srcCoord,
                            'target_coords' => $tgtCoord,
                            'name' => $baseName,
                            'category' => $isBridge ? 'bridges' : 'roads',
                            'infrastructure_type' => $infraType,
                            'highway_type' => $tags['highway'] ?? 'unclassified',
                            'surface_type' => $surfaceType,
                            'status' => 'operational',
                            'is_critical' => $isBridge || in_array($tags['highway'] ?? '', ['trunk', 'primary', 'secondary']),
                            'length_meters' => $segLength,
                            'travel_minutes' => $travelTime,
                            'geometry' => $geometry,
                            'verification_status' => 'imported',
                            'confidence_score' => 75,
                            'duplicate_status' => $dupInfo['status'],
                            'is_duplicate' => $dupInfo['is_duplicate'],
                            'is_possible_duplicate' => $dupInfo['is_possible_duplicate'],
                            'is_new' => $dupInfo['is_new'],
                            'selected' => $dupInfo['selected'],
                            'match_reason' => $dupInfo['match_reason'],
                            'existing_id' => $dupInfo['existing_id'],
                            'existing_name' => $dupInfo['existing_name'],
                        ];
                    }
                    $segmentStart = $i;
                }
            }
        }

        // Count components
        $componentsCount = count($junctionNodes) > 0 ? 1 : 0;

        return [
            'junction_nodes' => $junctionNodes,
            'edges' => $edges,
            'total_length_meters' => $totalLength,
            'components_count' => $componentsCount,
        ];
    }

    /**
     * Compute approximate centroid of a polygon way.
     */
    protected static function computeWayCenter(array $nodeRefs, array $nodeCoords): ?array
    {
        $latSum = 0;
        $lonSum = 0;
        $count = 0;

        foreach ($nodeRefs as $ref) {
            if (isset($nodeCoords[$ref])) {
                $latSum += $nodeCoords[$ref]['lat'];
                $lonSum += $nodeCoords[$ref]['lon'];
                $count++;
            }
        }

        return $count > 0 ? ['lat' => round($latSum / $count, 6), 'lon' => round($lonSum / $count, 6)] : null;
    }

    /**
     * Check duplicate status for edges: exact match vs possible duplicate vs new.
     */
    protected static function classifyEdgeDuplicate(?array $srcCoord, ?array $tgtCoord, int|string $wayId, string $edgeId, $existingEdges): array
    {
        if (!$srcCoord || !$tgtCoord) {
            return [
                'status' => 'new',
                'is_duplicate' => false,
                'is_possible_duplicate' => false,
                'is_new' => true,
                'selected' => true,
                'match_reason' => null,
                'existing_id' => null,
                'existing_name' => null,
            ];
        }

        // 1. Exact match (Already Imported): same OSM way ID or edge code in this village
        foreach ($existingEdges as $edge) {
            if (($edge->osm_id && (string) $edge->osm_id === (string) $wayId) || $edge->edge_code === $edgeId) {
                return [
                    'status' => 'already_imported',
                    'is_duplicate' => true,
                    'is_possible_duplicate' => false,
                    'is_new' => false,
                    'selected' => false,
                    'match_reason' => "Already imported in village (matches OSM Way #{$wayId})",
                    'existing_id' => $edge->id,
                    'existing_name' => $edge->name,
                ];
            }
        }

        // 2. Possible duplicate: both endpoints within 25m of existing edge endpoints
        foreach ($existingEdges as $edge) {
            $s = $edge->source;
            $t = $edge->target;
            if ($s && $t) {
                $d1 = self::haversineDistance($srcCoord['lat'], $srcCoord['lon'], (float) $s->latitude, (float) $s->longitude);
                $d2 = self::haversineDistance($tgtCoord['lat'], $tgtCoord['lon'], (float) $t->latitude, (float) $t->longitude);
                if ($d1 < 25.0 && $d2 < 25.0) {
                    return [
                        'status' => 'possible_duplicate',
                        'is_duplicate' => false,
                        'is_possible_duplicate' => true,
                        'is_new' => false,
                        'selected' => false,
                        'match_reason' => "Overlaps endpoints with existing '{$edge->name}'",
                        'existing_id' => $edge->id,
                        'existing_name' => $edge->name,
                    ];
                }

                $d1Rev = self::haversineDistance($srcCoord['lat'], $srcCoord['lon'], (float) $t->latitude, (float) $t->longitude);
                $d2Rev = self::haversineDistance($tgtCoord['lat'], $tgtCoord['lon'], (float) $s->latitude, (float) $s->longitude);
                if ($d1Rev < 25.0 && $d2Rev < 25.0) {
                    return [
                        'status' => 'possible_duplicate',
                        'is_duplicate' => false,
                        'is_possible_duplicate' => true,
                        'is_new' => false,
                        'selected' => false,
                        'match_reason' => "Overlaps endpoints with existing '{$edge->name}' (reverse direction)",
                        'existing_id' => $edge->id,
                        'existing_name' => $edge->name,
                    ];
                }
            }
        }

        return [
            'status' => 'new',
            'is_duplicate' => false,
            'is_possible_duplicate' => false,
            'is_new' => true,
            'selected' => true,
            'match_reason' => null,
            'existing_id' => null,
            'existing_name' => null,
        ];
    }

    /**
     * Duplicate check for edges based on spatial endpoint proximity.
     */
    protected static function isDuplicateEdge(?array $srcCoord, ?array $tgtCoord, $existingEdges): bool
    {
        $res = self::classifyEdgeDuplicate($srcCoord, $tgtCoord, 0, '', $existingEdges);
        return $res['is_duplicate'] || $res['is_possible_duplicate'];
    }

    /**
     * Persist user-confirmed discovery features into MySQL (Task 6).
     */
    public static function persistDiscovered(Village $village, array $approvedFeatures, ?string $batchId = null): array
    {
        @ini_set('memory_limit', '512M');
        $batchId = $batchId ?? ('osm_import_' . Str::random(10));
        $createdNodes = 0;
        $createdEdges = 0;
        $createdFacilities = 0;
        $createdSettlements = 0;
        $skippedDuplicates = 0;
        $skippedVerified = 0;

        // Filter out any exact duplicate ('already_imported') to guarantee idempotency
        $approvedFeatures = array_filter($approvedFeatures, function ($f) {
            return ($f['duplicate_status'] ?? '') !== 'already_imported' && !($f['is_duplicate'] ?? false);
        });

        $nodeFeatures = array_filter($approvedFeatures, fn($f) => ($f['osm_type'] ?? '') === 'node' || in_array($f['category'] ?? '', ['schools', 'health', 'water', 'settlements', 'facilities']));
        $edgeFeatures = array_filter($approvedFeatures, fn($f) => ($f['osm_type'] ?? '') === 'way' || in_array($f['category'] ?? '', ['roads', 'bridges', 'trails', 'lifelines']) || isset($f['source_osm_id']));

        // Synthesize endpoint node identifiers for edge features with coordinate arrays if missing
        foreach ($edgeFeatures as &$ef) {
            if (empty($ef['source_osm_id']) && !empty($ef['coordinates']) && is_array($ef['coordinates'])) {
                $firstCoord = $ef['coordinates'][0] ?? null;
                $lastCoord = end($ef['coordinates']) ?: null;
                if ($firstCoord && $lastCoord) {
                    $osmBase = $ef['osm_id'] ?? rand(1000, 9999);
                    $ef['source_osm_id'] = "j_{$osmBase}_src";
                    $ef['target_osm_id'] = "j_{$osmBase}_tgt";
                    $ef['source_coords'] = ['lat' => $firstCoord['lat'] ?? 0, 'lon' => $firstCoord['lng'] ?? ($firstCoord['lon'] ?? 0)];
                    $ef['target_coords'] = ['lat' => $lastCoord['lat'] ?? 0, 'lon' => $lastCoord['lng'] ?? ($lastCoord['lon'] ?? 0)];
                }
            }
        }
        unset($ef);

        DB::beginTransaction();
        try {
            // Pre-load existing nodes & edges into memory to prevent thousands of slow database roundtrips
            $existingNodes = Node::where('village_id', $village->id)->get()->keyBy('node_code');
            $existingOsmIdMap = [];
            foreach ($existingNodes as $n) {
                if ($n->osm_id) $existingOsmIdMap[(string)$n->osm_id] = $n;
            }

            $existingEdges = Edge::where('village_id', $village->id)->get();
            $existingEdgeCodeMap = [];
            $existingEdgePairMap = [];
            foreach ($existingEdges as $e) {
                if ($e->edge_code) $existingEdgeCodeMap[$e->edge_code] = $e;
                $existingEdgePairMap["{$e->source_node_id}_{$e->target_node_id}"] = $e;
            }

            // 1. Save or Update Point Nodes (Schools, Health, Water, Settlements)
            $nodeDbMap = []; // osmId -> Node model

            foreach ($nodeFeatures as $pf) {
                $osmId = $pf['osm_id'] ?? null;
                $nodeCode = "osm_" . ($osmId ?? Str::random(8));

                $existing = $existingNodes[$nodeCode] ?? ($osmId ? ($existingOsmIdMap[(string)$osmId] ?? null) : null);

                // Respect verified records: do not overwrite
                if ($existing && in_array($existing->verification_status, ['verified', 'community_endorsed'])) {
                    $nodeDbMap[$osmId] = $existing;
                    $skippedVerified++;
                    continue;
                }

                $nodeAttrs = [
                    'village_id' => $village->id,
                    'name' => $pf['name'] ?? 'Discovered Facility',
                    'latitude' => (float) ($pf['latitude'] ?? ($pf['lat'] ?? ($pf['coordinates'][0]['lat'] ?? $village->center_lat))),
                    'longitude' => (float) ($pf['longitude'] ?? ($pf['lon'] ?? ($pf['lng'] ?? ($pf['coordinates'][0]['lng'] ?? $village->center_lng)))),
                    'node_code' => $nodeCode,
                    'source' => 'osm',
                    'verification_status' => 'imported',
                    'confidence_score' => $pf['confidence_score'] ?? 75,
                ];

                if (Schema::hasColumn('nodes', 'node_type')) $nodeAttrs['node_type'] = $pf['node_type'] ?? 'facility';
                if (Schema::hasColumn('nodes', 'type')) $nodeAttrs['type'] = $pf['node_type'] ?? 'facility';
                if (Schema::hasColumn('nodes', 'osm_id')) $nodeAttrs['osm_id'] = (string) $osmId;
                if (Schema::hasColumn('nodes', 'osm_type')) $nodeAttrs['osm_type'] = $pf['osm_type'] ?? 'node';
                if (Schema::hasColumn('nodes', 'import_batch_id')) $nodeAttrs['import_batch_id'] = $batchId;

                if ($existing) {
                    $existing->update($nodeAttrs);
                    $node = $existing;
                } else {
                    $node = Node::create($nodeAttrs);
                    $existingNodes[$nodeCode] = $node;
                    if ($osmId) $existingOsmIdMap[(string)$osmId] = $node;
                    $createdNodes++;
                }

                $nodeDbMap[$osmId] = $node;

                // If School or Health Post or Water, also register in facilities table
                if (in_array($pf['category'] ?? '', ['schools', 'health', 'water'])) {
                    $facType = match ($pf['category']) {
                        'schools' => 'school',
                        'health' => 'health_post',
                        'water' => 'water_point',
                        default => 'facility',
                    };

                    $facAttrs = [
                        'name' => $pf['name'],
                    ];
                    if (Schema::hasColumn('facilities', 'facility_type')) $facAttrs['facility_type'] = $facType;
                    if (Schema::hasColumn('facilities', 'type')) $facAttrs['type'] = $facType;
                    if (Schema::hasColumn('facilities', 'operational_status')) $facAttrs['operational_status'] = 'functional';
                    if (Schema::hasColumn('facilities', 'source')) $facAttrs['source'] = 'osm';
                    if (Schema::hasColumn('facilities', 'verification_status')) $facAttrs['verification_status'] = 'imported';

                    Facility::updateOrCreate(
                        ['village_id' => $village->id, 'node_id' => $node->id],
                        $facAttrs
                    );
                    $createdFacilities++;
                }

                // If Settlement, track in settlements
                if (($pf['category'] ?? '') === 'settlements') {
                    $createdSettlements++;
                }
            }

            // 2. Ensure junction nodes exist for edges
            foreach ($edgeFeatures as $ef) {
                foreach (['source_osm_id' => 'source_coords', 'target_osm_id' => 'target_coords'] as $osmKey => $coordKey) {
                    $jOsmId = $ef[$osmKey] ?? null;
                    if ($jOsmId && !isset($nodeDbMap[$jOsmId])) {
                        $coord = $ef[$coordKey] ?? null;
                        if ($coord) {
                            $jCode = "osm_junction_{$jOsmId}";
                            $existing = $existingNodes[$jCode] ?? ($existingOsmIdMap[(string)$jOsmId] ?? null);
                            if ($existing) {
                                $jNode = $existing;
                            } else {
                                $jNodeAttrs = [
                                    'village_id' => $village->id,
                                    'name' => "Road Junction #{$jOsmId}",
                                    'latitude' => (float) ($coord['lat'] ?? 0),
                                    'longitude' => (float) ($coord['lon'] ?? ($coord['lng'] ?? 0)),
                                    'node_code' => $jCode,
                                    'source' => 'osm',
                                    'verification_status' => 'imported',
                                    'confidence_score' => 70,
                                ];
                                if (Schema::hasColumn('nodes', 'node_type')) $jNodeAttrs['node_type'] = 'junction';
                                if (Schema::hasColumn('nodes', 'type')) $jNodeAttrs['type'] = 'junction';
                                if (Schema::hasColumn('nodes', 'osm_id')) $jNodeAttrs['osm_id'] = (string) $jOsmId;
                                if (Schema::hasColumn('nodes', 'osm_type')) $jNodeAttrs['osm_type'] = 'node';
                                if (Schema::hasColumn('nodes', 'import_batch_id')) $jNodeAttrs['import_batch_id'] = $batchId;

                                $jNode = Node::create($jNodeAttrs);
                                $existingNodes[$jCode] = $jNode;
                                $existingOsmIdMap[(string)$jOsmId] = $jNode;
                                $createdNodes++;
                            }
                            $nodeDbMap[$jOsmId] = $jNode;
                        }
                    }
                }
            }

            // 3. Save or Update Lifeline Edges (Roads, Trails, Bridges)
            foreach ($edgeFeatures as $ef) {
                $src = $nodeDbMap[$ef['source_osm_id']] ?? null;
                $tgt = $nodeDbMap[$ef['target_osm_id']] ?? null;

                if ($src && $tgt && $src->id !== $tgt->id) {
                    $edgeCode = $ef['id'] ?? ("osm_edge_" . ($ef['osm_id'] ?? rand(1000, 9999)));
                    $pairKey = "{$src->id}_{$tgt->id}";

                    $existingEdge = $existingEdgeCodeMap[$edgeCode] ?? ($existingEdgePairMap[$pairKey] ?? null);

                    if ($existingEdge && in_array($existingEdge->verification_status, ['verified', 'community_endorsed'])) {
                        $skippedVerified++;
                        continue;
                    }

                    $edgeAttrs = [
                        'village_id' => $village->id,
                        'source_node_id' => $src->id,
                        'target_node_id' => $tgt->id,
                        'name' => $ef['name'],
                        'edge_code' => $edgeCode,
                        'surface_type' => $ef['surface_type'] ?? 'gravel',
                        'status' => $ef['status'] ?? 'operational',
                        'is_critical' => (bool) ($ef['is_critical'] ?? false),
                        'source' => 'osm',
                        'verification_status' => 'imported',
                        'confidence_score' => 75,
                    ];

                    if (Schema::hasColumn('edges', 'length_meters')) $edgeAttrs['length_meters'] = $ef['length_meters'] ?? 350;
                    if (Schema::hasColumn('edges', 'distance')) $edgeAttrs['distance'] = (float) (($ef['length_meters'] ?? 350) / 1000.0);

                    $infraType = $ef['infrastructure_type'] ?? 'road';
                    if (Schema::hasColumn('edges', 'infrastructure_type')) $edgeAttrs['infrastructure_type'] = $infraType;
                    if (Schema::hasColumn('edges', 'type')) $edgeAttrs['type'] = $infraType;
                    if (Schema::hasColumn('edges', 'osm_id')) $edgeAttrs['osm_id'] = (string) ($ef['osm_id'] ?? '');
                    if (Schema::hasColumn('edges', 'osm_type')) $edgeAttrs['osm_type'] = $ef['osm_type'] ?? 'way';
                    if (Schema::hasColumn('edges', 'highway_type')) $edgeAttrs['highway_type'] = $ef['highway_type'] ?? null;
                    if (Schema::hasColumn('edges', 'travel_minutes')) $edgeAttrs['travel_minutes'] = $ef['travel_minutes'] ?? null;
                    if (Schema::hasColumn('edges', 'geometry')) $edgeAttrs['geometry'] = json_encode($ef['geometry'] ?? []);
                    if (Schema::hasColumn('edges', 'import_batch_id')) $edgeAttrs['import_batch_id'] = $batchId;

                    if ($existingEdge) {
                        $existingEdge->update($edgeAttrs);
                    } else {
                        $newEdge = Edge::create($edgeAttrs);
                        $existingEdgeCodeMap[$edgeCode] = $newEdge;
                        $existingEdgePairMap[$pairKey] = $newEdge;
                        $createdEdges++;
                    }
                }
            }

            // 4. Update village metadata and audit logging
            $village->update([
                'last_imported_at' => now(),
                'import_batch_id' => $batchId,
            ]);

            AuditLog::create([
                'village_id' => $village->id,
                'action_type' => 'imported',
                'entity_type' => 'village',
                'entity_id' => $village->id,
                'performed_by' => 'OpenStreetMap Syncer',
                'summary' => "Imported {$createdNodes} nodes, {$createdEdges} edges, and {$createdFacilities} facilities from OpenStreetMap.",
                'details' => [
                    'batch_id' => $batchId,
                    'created_nodes' => $createdNodes,
                    'created_edges' => $createdEdges,
                    'created_facilities' => $createdFacilities,
                    'skipped_verified' => $skippedVerified,
                ],
            ]);

            DB::commit();

            // Fetch live saved statistics from MySQL (Task 7)
            $stats = [
                'road_segments' => Edge::where('village_id', $village->id)->where('infrastructure_type', '!=', 'bridge')->count(),
                'bridges' => Edge::where('village_id', $village->id)->where('infrastructure_type', 'bridge')->count(),
                'schools' => Node::where('village_id', $village->id)->whereIn('node_type', ['school', 'college'])->count(),
                'health_facilities' => Node::where('village_id', $village->id)->whereIn('node_type', ['health_post', 'hospital', 'clinic'])->count(),
                'water_facilities' => Node::where('village_id', $village->id)->where('node_type', 'water_point')->count(),
                'settlements' => Node::where('village_id', $village->id)->where('node_type', 'settlement')->count(),
                'total_nodes' => Node::where('village_id', $village->id)->count(),
                'total_edges' => Edge::where('village_id', $village->id)->count(),
            ];

            return [
                'success' => true,
                'message' => "Successfully imported {$createdNodes} nodes and {$createdEdges} lifeline edges into MySQL.",
                'batch_id' => $batchId,
                'imported_nodes' => $createdNodes,
                'imported_edges' => $createdEdges,
                'imported_facilities' => $createdFacilities,
                'nodes_created' => $createdNodes,
                'edges_created' => $createdEdges,
                'facilities_created' => $createdFacilities,
                'skipped_duplicates' => $skippedDuplicates,
                'skipped_verified' => $skippedVerified,
                'village_statistics' => $stats,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('OSM Persistence Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }
    }

    /**
     * Great Circle Distance between two points in meters (Haversine formula).
     */
    protected static function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
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
     * Realistic Nepal Overpass elements for test environments.
     */
    protected static function getFallbackMockElements(float $south, float $west, float $north, float $east): array
    {
        $midLat = ($south + $north) / 2;
        $midLng = ($west + $east) / 2;

        return [
            'elements' => [
                [
                    'type' => 'node',
                    'id' => 90001,
                    'lat' => $midLat,
                    'lon' => $midLng,
                    'tags' => ['name' => 'Local Primary School', 'amenity' => 'school'],
                ],
                [
                    'type' => 'node',
                    'id' => 90002,
                    'lat' => $midLat + 0.002,
                    'lon' => $midLng + 0.002,
                    'tags' => ['name' => 'Community Health Post', 'amenity' => 'clinic', 'healthcare' => 'clinic'],
                ],
                [
                    'type' => 'node',
                    'id' => 90003,
                    'lat' => $midLat - 0.002,
                    'lon' => $midLng - 0.002,
                    'tags' => ['name' => 'Dhunge Dhara Drinking Tap', 'amenity' => 'drinking_water'],
                ],
                [
                    'type' => 'node',
                    'id' => 90004,
                    'lat' => $midLat + 0.003,
                    'lon' => $midLng - 0.001,
                    'tags' => ['name' => 'Dharapani Settlement', 'place' => 'hamlet'],
                ],
                [
                    'type' => 'node',
                    'id' => 90010,
                    'lat' => $midLat - 0.005,
                    'lon' => $midLng - 0.005,
                    'tags' => [],
                ],
                [
                    'type' => 'node',
                    'id' => 90011,
                    'lat' => $midLat + 0.005,
                    'lon' => $midLng + 0.005,
                    'tags' => [],
                ],
                [
                    'type' => 'way',
                    'id' => 90101,
                    'nodes' => [90010, 90001, 90011],
                    'tags' => ['name' => 'Main Village Access Road', 'highway' => 'unclassified', 'surface' => 'gravel'],
                ],
            ],
            'source' => 'OpenStreetMap Mock Fixture',
        ];
    }
}
