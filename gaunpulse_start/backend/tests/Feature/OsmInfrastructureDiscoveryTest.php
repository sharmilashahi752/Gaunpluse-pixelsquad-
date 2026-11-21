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

class OsmInfrastructureDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Test 1: Reject invalid administrative relationships (e.g. Mustang in Bagmati Province, or Helambu in Mustang).
     */
    public function test_rejects_invalid_administrative_hierarchy_relationships(): void
    {
        // Mustang district is in Gandaki Province, not Bagmati Province
        $response = $this->postJson('/api/villages', [
            'name' => 'Invalid Marpha Test',
            'province' => 'Bagmati Province',
            'district' => 'Mustang',
            'municipality' => 'Helambu Rural Municipality',
            'ward_no' => '1',
            'center_lat' => 28.7516,
            'center_lng' => 83.6844,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'suggestion']);
    }

    /**
     * Test 2: Creates village with valid verified administrative hierarchy.
     */
    public function test_creates_village_with_valid_hierarchy(): void
    {
        $response = $this->postJson('/api/villages', [
            'name' => 'Marpha Village',
            'local_name' => 'मार्फा गाउँ',
            'province' => 'Gandaki Province',
            'district' => 'Mustang',
            'municipality' => 'Gharapjhong Rural Municipality',
            'ward_no' => '2',
            'center_lat' => 28.7516,
            'center_lng' => 83.6844,
            'description' => 'Historic mountain settlement along Kali Gandaki river.',
            'data_source' => 'Municipal Field Survey',
            'verification_status' => 'verified',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'name' => 'Marpha Village',
                'province' => 'Gandaki Province',
                'district' => 'Mustang',
                'municipality' => 'Gharapjhong Rural Municipality',
            ]);

        $this->assertDatabaseHas('villages', [
            'name' => 'Marpha Village',
            'district' => 'Mustang',
            'municipality' => 'Gharapjhong Rural Municipality',
        ]);
    }

    /**
     * Test 3: Hierarchy audit detects inconsistent legacy records and allows reviewable correction.
     */
    public function test_hierarchy_audit_and_correction_flow(): void
    {
        // Directly insert an inconsistent legacy record into MySQL
        $inconsistentVillage = Village::create([
            'name' => 'Inconsistent Mountain Village',
            'province' => 'Gandaki Province',
            'district' => 'Mustang',
            'municipality' => 'Helambu Rural Municipality', // Mismatched municipality!
            'ward_no' => '1',
            'center_lat' => 28.7516,
            'center_lng' => 83.6844,
            'status' => 'active',
        ]);

        // Audit hierarchy
        $auditRes = $this->getJson('/api/villages/audit-hierarchy');
        $auditRes->assertStatus(200);
        $this->assertTrue($auditRes->json('inconsistent_count') >= 1);

        // Correct hierarchy
        $correctRes = $this->postJson("/api/villages/{$inconsistentVillage->id}/correct-hierarchy", [
            'municipality' => 'Gharapjhong Rural Municipality',
            'ward_no' => '2',
            'reason' => 'Audit alignment to Mustang Gharapjhong boundary',
        ]);

        $correctRes->assertStatus(200);
        $this->assertDatabaseHas('villages', [
            'id' => $inconsistentVillage->id,
            'municipality' => 'Gharapjhong Rural Municipality',
            'ward_no' => '2',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'village_id' => $inconsistentVillage->id,
            'action_type' => 'hierarchy_correction',
        ]);
    }

    /**
     * Test 4: Automatic infrastructure discovery parses sample Overpass OSM elements.
     */
    public function test_automatic_infrastructure_discovery_with_mocked_osm_data(): void
    {
        $village = Village::create([
            'name' => 'Kagbeni Village',
            'province' => 'Gandaki Province',
            'district' => 'Mustang',
            'municipality' => 'Baragung Muktichhetra Rural Municipality',
            'ward_no' => '4',
            'center_lat' => 28.8350,
            'center_lng' => 83.7850,
            'status' => 'active',
        ]);

        // Mock Overpass API response with realistic mountain lifelines
        Http::fake([
            'https://overpass-api.de/api/interpreter*' => Http::response([
                'elements' => [
                    ['type' => 'node', 'id' => 101, 'lat' => 28.8355, 'lon' => 83.7845, 'tags' => ['amenity' => 'clinic', 'name' => 'Kagbeni Community Health Post']],
                    ['type' => 'node', 'id' => 102, 'lat' => 28.8360, 'lon' => 83.7860, 'tags' => ['amenity' => 'school', 'name' => 'Kagbeni Basic School']],
                    ['type' => 'node', 'id' => 103, 'lat' => 28.8340, 'lon' => 83.7830, 'tags' => ['amenity' => 'drinking_water', 'name' => 'Stone Water Spout']],
                    ['type' => 'node', 'id' => 104, 'lat' => 28.8370, 'lon' => 83.7870, 'tags' => ['place' => 'hamlet', 'name' => 'Upper Kagbeni Tole']],
                    ['type' => 'node', 'id' => 201, 'lat' => 28.8345, 'lon' => 83.7840],
                    ['type' => 'node', 'id' => 202, 'lat' => 28.8350, 'lon' => 83.7850],
                    ['type' => 'node', 'id' => 203, 'lat' => 28.8365, 'lon' => 83.7865],
                    [
                        'type' => 'way',
                        'id' => 5001,
                        'nodes' => [201, 202, 203],
                        'tags' => ['highway' => 'unclassified', 'surface' => 'gravel', 'name' => 'Kagbeni Main Valley Road'],
                    ],
                    [
                        'type' => 'way',
                        'id' => 5002,
                        'nodes' => [202, 101],
                        'tags' => ['highway' => 'footway', 'bridge' => 'suspension', 'surface' => 'wood', 'name' => 'Kali Gandaki Suspension Bridge'],
                    ],
                ],
            ], 200),
            '*' => Http::response(['elements' => []], 200),
        ]);

        $res = $this->getJson("/api/villages/{$village->id}/discover-osm?radius=2000");

        $res->assertStatus(200)
            ->assertJsonStructure([
                'village_id',
                'summary' => [
                    'total_features',
                    'roads_count',
                    'bridges_count',
                    'schools_count',
                    'health_count',
                    'water_count',
                    'settlements_count',
                    'bounds',
                ],
                'categories',
                'features',
                'network_topology',
            ]);

        $this->assertEquals(1, $res->json('summary.schools_count'));
        $this->assertEquals(1, $res->json('summary.health_count'));
        $this->assertEquals(1, $res->json('summary.water_count'));
        $this->assertEquals(1, $res->json('summary.bridges_count'));
        $this->assertEquals(1, $res->json('summary.settlements_count'));
    }

    /**
     * Test 5: Confirm import persists approved features to MySQL with verification status 'imported'.
     */
    public function test_confirm_import_persists_features_to_mysql(): void
    {
        $village = Village::create([
            'name' => 'Muktinath Village',
            'province' => 'Gandaki Province',
            'district' => 'Mustang',
            'municipality' => 'Baragung Muktichhetra Rural Municipality',
            'ward_no' => '1',
            'center_lat' => 28.8170,
            'center_lng' => 83.8710,
            'status' => 'active',
        ]);

        $candidateFeatures = [
            [
                'id' => 'osm_node_301',
                'osm_id' => 301,
                'osm_type' => 'node',
                'category' => 'health',
                'node_type' => 'health_post',
                'name' => 'Muktinath Sub-Health Post',
                'latitude' => 28.8175,
                'longitude' => 83.8715,
                'verification_status' => 'imported',
                'confidence_score' => 75,
            ],
            [
                'id' => 'osm_node_302',
                'osm_id' => 302,
                'osm_type' => 'node',
                'category' => 'schools',
                'node_type' => 'school',
                'name' => 'Muktinath Primary School',
                'latitude' => 28.8180,
                'longitude' => 83.8720,
                'verification_status' => 'imported',
                'confidence_score' => 75,
            ],
            [
                'id' => 'osm_way_6001_0_1',
                'osm_id' => 6001,
                'osm_type' => 'way',
                'category' => 'roads',
                'name' => 'Muktinath Pilgrim Trail',
                'infrastructure_type' => 'trail',
                'surface_type' => 'gravel',
                'status' => 'operational',
                'is_critical' => true,
                'length_meters' => 450,
                'travel_minutes' => 6.8,
                'source_osm_id' => 301,
                'target_osm_id' => 302,
                'source_coords' => ['lat' => 28.8175, 'lon' => 83.8715],
                'target_coords' => ['lat' => 28.8180, 'lon' => 83.8720],
                'geometry' => [[28.8175, 83.8715], [28.8180, 83.8720]],
            ],
        ];

        $confirmRes = $this->postJson("/api/villages/{$village->id}/confirm-osm-import", [
            'features' => $candidateFeatures,
            'batch_id' => 'test_batch_001',
        ]);

        $confirmRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'imported_nodes' => 2,
                'imported_edges' => 1,
            ]);

        // Verify stored records in MySQL
        $this->assertDatabaseHas('nodes', [
            'village_id' => $village->id,
            'name' => 'Muktinath Sub-Health Post',
            'node_type' => 'health_post',
            'source' => 'osm',
            'verification_status' => 'imported',
        ]);

        $this->assertDatabaseHas('nodes', [
            'village_id' => $village->id,
            'name' => 'Muktinath Primary School',
            'node_type' => 'school',
            'source' => 'osm',
            'verification_status' => 'imported',
        ]);

        $facCheck = [
            'village_id' => $village->id,
            'name' => 'Muktinath Sub-Health Post',
        ];
        if (\Illuminate\Support\Facades\Schema::hasColumn('facilities', 'facility_type')) {
            $facCheck['facility_type'] = 'health_post';
        } else {
            $facCheck['type'] = 'health_post';
        }
        $this->assertDatabaseHas('facilities', $facCheck);

        $this->assertDatabaseHas('edges', [
            'village_id' => $village->id,
            'name' => 'Muktinath Pilgrim Trail',
            'infrastructure_type' => 'trail',
            'source' => 'osm',
            'verification_status' => 'imported',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'village_id' => $village->id,
            'action_type' => 'imported',
        ]);
    }

    /**
     * Test 6: Preserves existing verified local infrastructure edits during re-import.
     */
    public function test_preserves_verified_local_edits_during_reimport(): void
    {
        $village = Village::create([
            'name' => 'Jomsom Central',
            'province' => 'Gandaki Province',
            'district' => 'Mustang',
            'municipality' => 'Gharapjhong Rural Municipality',
            'ward_no' => '3',
            'center_lat' => 28.7830,
            'center_lng' => 83.7250,
            'status' => 'active',
        ]);

        $nodeData = [
            'village_id' => $village->id,
            'name' => 'Jomsom District Hospital (Locally Verified)',
            'node_code' => 'osm_node_999',
            'osm_id' => '999',
            'latitude' => 28.7835,
            'longitude' => 83.7255,
            'description' => 'Field survey verified with solar backup and 15 beds.',
            'source' => 'field_survey',
            'verification_status' => 'verified',
            'confidence_score' => 100,
        ];
        if (\Illuminate\Support\Facades\Schema::hasColumn('nodes', 'node_type')) $nodeData['node_type'] = 'health_post';
        if (\Illuminate\Support\Facades\Schema::hasColumn('nodes', 'type')) $nodeData['type'] = 'health_post';
        $verifiedNode = Node::create($nodeData);

        // Candidate feature from OSM with the same OSM ID but raw text
        $candidateFeatures = [
            [
                'id' => 'osm_node_999',
                'osm_id' => 999,
                'osm_type' => 'node',
                'category' => 'health',
                'node_type' => 'health_post',
                'name' => 'Raw OSM Hospital #999',
                'latitude' => 28.7835,
                'longitude' => 83.7255,
            ],
        ];

        $res = $this->postJson("/api/villages/{$village->id}/confirm-osm-import", [
            'features' => $candidateFeatures,
        ]);

        $res->assertStatus(200);
        $this->assertEquals(1, $res->json('skipped_verified'));

        // Node in MySQL must retain locally verified attributes
        $verifiedNode->refresh();
        $this->assertEquals('Jomsom District Hospital (Locally Verified)', $verifiedNode->name);
        $this->assertEquals('verified', $verifiedNode->verification_status);
        $this->assertEquals('field_survey', $verifiedNode->source);
        $this->assertEquals('Field survey verified with solar backup and 15 beds.', $verifiedNode->description);
    }

    /**
     * Test 7: Handles area with no available map features honestly (empty state).
     */
    public function test_handles_empty_map_area_honestly(): void
    {
        $village = Village::create([
            'name' => 'Remote Mountain Plateau',
            'province' => 'Gandaki Province',
            'district' => 'Mustang',
            'municipality' => 'Lomanthang Rural Municipality',
            'ward_no' => '5',
            'center_lat' => 29.2500,
            'center_lng' => 83.9800,
            'status' => 'active',
        ]);

        // Mock empty Overpass response
        Http::fake([
            'https://overpass-api.de/api/interpreter*' => Http::response(['elements' => []], 200),
            '*' => Http::response(['elements' => []], 200),
        ]);

        $res = $this->getJson("/api/villages/{$village->id}/discover-osm?radius=1500");

        $res->assertStatus(200);
        $this->assertEquals(0, $res->json('summary.total_features'));
        $this->assertEmpty($res->json('features'));
        $this->assertEmpty($res->json('categories.schools'));
        $this->assertEmpty($res->json('categories.health'));
    }
}
