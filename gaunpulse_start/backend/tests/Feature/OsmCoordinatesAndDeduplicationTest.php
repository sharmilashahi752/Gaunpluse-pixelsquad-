<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Edge;
use App\Models\Facility;
use App\Models\Node;
use App\Models\Village;
use App\Services\NepalLocationService;
use App\Services\OsmInfrastructureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OsmCoordinatesAndDeduplicationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1: NepalLocationService correctly resolves Mahabu, Dailekh coordinates.
     */
    public function test_nepal_location_service_resolves_mahabu_dailekh_coordinates(): void
    {
        $service = new NepalLocationService();

        // 1. Resolve Mahabu Rural Municipality
        $coords = $service->resolveCoordinates('mahabu', 'Mahabu Rural Municipality', 'Dailekh');
        $this->assertNotNull($coords);
        $this->assertEqualsWithDelta(28.9242, $coords['lat'], 0.05);
        $this->assertEqualsWithDelta(81.7125, $coords['lng'], 0.05);

        // 2. District center for Dailekh
        $districtCenter = $service->getDistrictCenter('Dailekh');
        $this->assertNotNull($districtCenter);
        $this->assertEqualsWithDelta(28.8400, $districtCenter['lat'], 0.05);
        $this->assertEqualsWithDelta(81.7100, $districtCenter['lng'], 0.05);
        // Ensure it is NOT the generic fallback 28.0, 84.0
        $this->assertNotEquals(28.0, $districtCenter['lat']);
        $this->assertNotEquals(84.0, $districtCenter['lng']);
    }

    /**
     * Test 2: Village model detects when coordinates need confirmation.
     */
    public function test_village_detects_unconfirmed_fallback_coordinates(): void
    {
        // Village created with unconfirmed fallback coordinates 28.0, 84.0
        $village = Village::create([
            'name' => 'mahabu',
            'province' => 'Karnali Province',
            'district' => 'Dailekh',
            'municipality' => 'Mahabu Rural Municipality',
            'ward_no' => '1',
            'center_lat' => 28.0,
            'center_lng' => 84.0,
            'is_coordinates_confirmed' => false,
        ]);

        $this->assertTrue($village->needs_location_confirmation);

        // Once confirmed, needs_location_confirmation becomes false
        $village->update([
            'center_lat' => 28.9242,
            'center_lng' => 81.7125,
            'is_coordinates_confirmed' => true,
            'coordinates_confirmed_at' => now(),
        ]);

        $village->refresh();
        $this->assertFalse($village->needs_location_confirmation);
    }

    /**
     * Test 3: Dedicated PATCH /api/villages/{village}/coordinates endpoint confirms location.
     */
    public function test_can_update_and_confirm_village_coordinates_via_api(): void
    {
        $village = Village::create([
            'name' => 'mahabu',
            'province' => 'Karnali Province',
            'district' => 'Dailekh',
            'municipality' => 'Mahabu Rural Municipality',
            'ward_no' => '1',
            'center_lat' => 28.0,
            'center_lng' => 84.0,
            'is_coordinates_confirmed' => false,
        ]);

        $response = $this->patchJson("/api/villages/{$village->id}/coordinates", [
            'center_lat' => 28.9242,
            'center_lng' => 81.7125,
            'confirmed' => true,
            'radius' => 2000,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'village' => [
                    'id' => $village->id,
                    'center_lat' => 28.9242,
                    'center_lng' => 81.7125,
                    'is_coordinates_confirmed' => true,
                    'needs_location_confirmation' => false,
                ],
            ]);

        $this->assertDatabaseHas('villages', [
            'id' => $village->id,
            'center_lat' => 28.9242,
            'center_lng' => 81.7125,
            'is_coordinates_confirmed' => 1,
        ]);

        // Audit log created
        $this->assertDatabaseHas('audit_logs', [
            'village_id' => $village->id,
            'action_type' => 'coordinates_confirmed',
        ]);
    }

    /**
     * Test 4: Deduplication engine classifies features into new, possible_duplicate, and already_imported.
     */
    public function test_deduplication_engine_categorizes_features_cleanly(): void
    {
        $village = Village::create([
            'name' => 'mahabu',
            'province' => 'Karnali Province',
            'district' => 'Dailekh',
            'municipality' => 'Mahabu Rural Municipality',
            'ward_no' => '1',
            'center_lat' => 28.9242,
            'center_lng' => 81.7125,
            'is_coordinates_confirmed' => true,
        ]);

        $nodeA = Node::create([
            'village_id' => $village->id,
            'name' => 'Node A',
            'latitude' => 28.9242,
            'longitude' => 81.7125,
            'node_code' => 'node_a',
            'type' => 'settlement',
            'node_type' => 'settlement',
        ]);
        $nodeB = Node::create([
            'village_id' => $village->id,
            'name' => 'Node B',
            'latitude' => 28.9250,
            'longitude' => 81.7130,
            'node_code' => 'node_b',
            'type' => 'settlement',
            'node_type' => 'settlement',
        ]);

        // 1. Existing edge in DB with OSM ID 99999
        Edge::create([
            'village_id' => $village->id,
            'source_node_id' => $nodeA->id,
            'target_node_id' => $nodeB->id,
            'edge_code' => 'osm_way_99999',
            'name' => 'Existing Mahabu Road',
            'type' => 'road',
            'infrastructure_type' => 'road',
            'surface_type' => 'gravel',
            'status' => 'operational',
            'source' => 'osm',
            'osm_id' => 99999,
            'osm_type' => 'way',
        ]);

        // 2. Existing facility with OSM ID 88888
        $healthNode = Node::create([
            'village_id' => $village->id,
            'name' => 'Existing Mahabu Health Post',
            'type' => 'facility',
            'node_type' => 'facility',
            'latitude' => 28.9240,
            'longitude' => 81.7120,
            'source' => 'osm',
            'osm_id' => 88888,
            'osm_type' => 'node',
            'node_code' => 'osm_88888',
        ]);

        Facility::create([
            'village_id' => $village->id,
            'node_id' => $healthNode->id,
            'name' => 'Existing Mahabu Health Post',
            'type' => 'health_post',
        ]);

        // Mock Overpass response containing:
        // - One exact duplicate (way 99999)
        // - One new road (way 11111)
        // - One new school (node 22222)
        Http::fake([
            'https://overpass-api.de/api/interpreter*' => Http::response([
                'elements' => [
                    [
                        'type' => 'way',
                        'id' => 99999,
                        'nodes' => [999991, 999992],
                        'tags' => ['highway' => 'unclassified', 'name' => 'Existing Mahabu Road'],
                        'geometry' => [
                            ['lat' => 28.9242, 'lon' => 81.7125],
                            ['lat' => 28.9250, 'lon' => 81.7130],
                        ],
                    ],
                    [
                        'type' => 'way',
                        'id' => 11111,
                        'nodes' => [111111, 111112],
                        'tags' => ['highway' => 'track', 'name' => 'Brand New Trail to Forest'],
                        'geometry' => [
                            ['lat' => 28.9300, 'lon' => 81.7200],
                            ['lat' => 28.9310, 'lon' => 81.7210],
                        ],
                    ],
                    [
                        'type' => 'node',
                        'id' => 22222,
                        'lat' => 28.9260,
                        'lon' => 81.7140,
                        'tags' => ['amenity' => 'school', 'name' => 'Shree Mahabu Primary School'],
                    ],
                ],
            ], 200),
        ]);

        $service = app(OsmInfrastructureService::class);
        $result = $service->discover($village, 2000, null, true);

        $features = $result['features'];
        $this->assertCount(3, $features);

        // Find each feature
        $exactDup = collect($features)->firstWhere('osm_id', 99999);
        $newRoad = collect($features)->firstWhere('osm_id', 11111);
        $newSchool = collect($features)->firstWhere('osm_id', 22222);

        // Check exact duplicate: categorized as already_imported, selected = false
        $this->assertNotNull($exactDup);
        $this->assertEquals('already_imported', $exactDup['duplicate_status']);
        $this->assertTrue($exactDup['is_duplicate']);
        $this->assertFalse($exactDup['selected']);

        // Check new road: categorized as new, selected = true
        $this->assertNotNull($newRoad);
        $this->assertEquals('new', $newRoad['duplicate_status']);
        $this->assertFalse($newRoad['is_duplicate']);
        $this->assertTrue($newRoad['selected']);

        // Check new school: categorized as new, selected = true
        $this->assertNotNull($newSchool);
        $this->assertEquals('new', $newSchool['duplicate_status']);
        $this->assertFalse($newSchool['is_duplicate']);
        $this->assertTrue($newSchool['selected']);

        // Check summary counts
        $this->assertEquals(2, $result['summary']['new_features_count']);
        $this->assertEquals(1, $result['summary']['already_imported_count']);
    }

    /**
     * Test 5: Confirm import idempotently skips already_imported elements and marks new items unverified.
     */
    public function test_confirm_import_skips_duplicates_and_marks_new_unverified(): void
    {
        $village = Village::create([
            'name' => 'mahabu',
            'province' => 'Karnali Province',
            'district' => 'Dailekh',
            'municipality' => 'Mahabu Rural Municipality',
            'ward_no' => '1',
            'center_lat' => 28.9242,
            'center_lng' => 81.7125,
            'is_coordinates_confirmed' => true,
        ]);

        // Submit import containing 1 already_imported item and 1 new item
        $response = $this->postJson("/api/villages/{$village->id}/confirm-osm-import", [
            'features' => [
                [
                    'id' => 'osm_way_dup1',
                    'category' => 'roads',
                    'name' => 'Duplicate Road',
                    'infrastructure_type' => 'road',
                    'surface_type' => 'gravel',
                    'duplicate_status' => 'already_imported',
                    'osm_id' => 99999,
                    'osm_type' => 'way',
                    'source_osm_id' => 'dup_src',
                    'target_osm_id' => 'dup_tgt',
                    'source_coords' => ['lat' => 28.9242, 'lon' => 81.7125],
                    'target_coords' => ['lat' => 28.9250, 'lon' => 81.7130],
                    'coordinates' => [
                        ['lat' => 28.9242, 'lng' => 81.7125],
                        ['lat' => 28.9250, 'lng' => 81.7130],
                    ],
                ],
                [
                    'id' => 'osm_way_new1',
                    'category' => 'roads',
                    'name' => 'Genuine New Mahabu Road',
                    'infrastructure_type' => 'road',
                    'surface_type' => 'gravel',
                    'duplicate_status' => 'new',
                    'osm_id' => 77777,
                    'osm_type' => 'way',
                    'source_osm_id' => 'new_src',
                    'target_osm_id' => 'new_tgt',
                    'source_coords' => ['lat' => 28.9242, 'lon' => 81.7125],
                    'target_coords' => ['lat' => 28.9255, 'lon' => 81.7135],
                    'coordinates' => [
                        ['lat' => 28.9242, 'lng' => 81.7125],
                        ['lat' => 28.9255, 'lng' => 81.7135],
                    ],
                ],
            ],
            'batch_id' => 'test_batch_123',
        ]);

        $response->assertStatus(200);

        // The new road should be created in edges with verification_status = 'imported' and source = 'osm'
        $this->assertDatabaseHas('edges', [
            'village_id' => $village->id,
            'name' => 'Genuine New Mahabu Road',
            'source' => 'osm',
            'osm_id' => '77777',
            'verification_status' => 'imported',
        ]);

        // The already_imported item should NOT be created
        $this->assertDatabaseMissing('edges', [
            'village_id' => $village->id,
            'name' => 'Duplicate Road',
        ]);
    }
}
