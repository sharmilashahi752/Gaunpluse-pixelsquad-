<?php

namespace Tests\Feature;

use App\Models\Edge;
use App\Models\Facility;
use App\Models\Node;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VillageDataFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_village_index_includes_infrastructure_counts(): void
    {
        $response = $this->getJson('/api/villages');
        $response->assertOk();
        $data = $response->json();
        $this->assertNotEmpty($data);
        $first = $data[0];
        $this->assertArrayHasKey('nodes_count', $first);
        $this->assertArrayHasKey('edges_count', $first);
        $this->assertArrayHasKey('facilities_count', $first);
    }

    public function test_can_create_and_update_village(): void
    {
        $createRes = $this->postJson('/api/villages', [
            'name' => 'Langtang Foothills Demo',
            'municipality' => 'Gosaikunda Rural Municipality',
            'district' => 'Rasuwa',
            'province' => 'Bagmati Province',
            'latitude' => 28.2105,
            'longitude' => 85.3502,
            'description' => 'Mountain settlement network',
        ]);

        $createRes->assertCreated();
        $villageId = $createRes->json('id');
        $this->assertDatabaseHas('villages', ['id' => $villageId, 'name' => 'Langtang Foothills Demo']);

        $updateRes = $this->putJson("/api/villages/{$villageId}", [
            'name' => 'Langtang Foothills Central',
            'municipality' => 'Gosaikunda Rural Municipality',
            'district' => 'Rasuwa',
            'province' => 'Bagmati Province',
        ]);
        $updateRes->assertOk();
        $this->assertDatabaseHas('villages', ['id' => $villageId, 'name' => 'Langtang Foothills Central']);
    }

    public function test_can_create_update_and_delete_node(): void
    {
        $village = Village::first();

        // Create node
        $createNodeRes = $this->postJson("/api/villages/{$village->id}/nodes", [
            'name' => 'Patan Chautara Junction',
            'node_code' => 'patan_chautara',
            'node_type' => 'junction',
            'latitude' => 28.2415,
            'longitude' => 83.9925,
            'description' => 'Test junction waypoint',
        ]);

        $createNodeRes->assertCreated();
        $nodeId = $createNodeRes->json('id');
        $this->assertDatabaseHas('nodes', ['id' => $nodeId, 'name' => 'Patan Chautara Junction']);

        // Update node
        $updateNodeRes = $this->putJson("/api/villages/{$village->id}/nodes/{$nodeId}", [
            'name' => 'Patan Chautara Upper Junction',
        ]);
        $updateNodeRes->assertOk();
        $this->assertDatabaseHas('nodes', ['id' => $nodeId, 'name' => 'Patan Chautara Upper Junction']);

        // Delete node (no edges connected)
        $deleteNodeRes = $this->deleteJson("/api/villages/{$village->id}/nodes/{$nodeId}");
        $deleteNodeRes->assertOk();
        $this->assertDatabaseMissing('nodes', ['id' => $nodeId]);
    }

    public function test_can_create_update_and_delete_edge(): void
    {
        $village = Village::first();
        $nodes = $village->nodes()->take(2)->get();
        $this->assertCount(2, $nodes);

        // Create edge
        $createEdgeRes = $this->postJson("/api/villages/{$village->id}/edges", [
            'name' => 'Emergency Foothills Trail',
            'edge_code' => 'trail_test_99',
            'source_node_id' => $nodes[0]->id,
            'target_node_id' => $nodes[1]->id,
            'infrastructure_type' => 'trail',
            'surface_type' => 'dirt',
            'status' => 'passable',
            'length_meters' => 450,
            'is_critical' => true,
        ]);

        $createEdgeRes->assertCreated();
        $edgeId = $createEdgeRes->json('id');
        $this->assertDatabaseHas('edges', ['id' => $edgeId, 'name' => 'Emergency Foothills Trail']);

        // Update status to blocked
        $updateEdgeRes = $this->putJson("/api/villages/{$village->id}/edges/{$edgeId}", [
            'status' => 'blocked',
        ]);
        $updateEdgeRes->assertOk();
        $this->assertDatabaseHas('edges', ['id' => $edgeId, 'status' => 'blocked']);

        // Delete edge
        $deleteRes = $this->deleteJson("/api/villages/{$village->id}/edges/{$edgeId}");
        $deleteRes->assertOk();
        $this->assertDatabaseMissing('edges', ['id' => $edgeId]);
    }

    public function test_export_geojson_returns_valid_feature_collection(): void
    {
        $village = Village::first();
        $response = $this->getJson("/api/villages/{$village->id}/export-geojson");

        $response->assertOk();
        $data = $response->json();
        $this->assertEquals('FeatureCollection', $data['type']);
        $this->assertArrayHasKey('features', $data);
        $this->assertNotEmpty($data['features']);

        // Verify Point and LineString features exist
        $types = array_column(array_column($data['features'], 'geometry'), 'type');
        $this->assertContains('Point', $types);
        $this->assertContains('LineString', $types);
    }

    public function test_import_geojson_persists_nodes_and_edges(): void
    {
        $village = Village::first();

        $geoJsonPayload = [
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [83.9981, 28.2435],
                    ],
                    'properties' => [
                        'name' => 'Upper Terrace Settlement Point',
                        'node_code' => 'upper_terrace_pt',
                        'node_type' => 'settlement',
                        'description' => 'Imported highland node',
                    ],
                ],
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [83.9995, 28.2440],
                    ],
                    'properties' => [
                        'name' => 'Spring Reservoir Point',
                        'node_code' => 'spring_reservoir_pt',
                        'node_type' => 'water_source',
                        'description' => 'Imported water source',
                    ],
                ],
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'LineString',
                        'coordinates' => [
                            [83.9981, 28.2435],
                            [83.9995, 28.2440],
                        ],
                    ],
                    'properties' => [
                        'name' => 'Terrace-to-Spring Footpath',
                        'edge_code' => 'terrace_spring_path',
                        'source_node_code' => 'upper_terrace_pt',
                        'target_node_code' => 'spring_reservoir_pt',
                        'infrastructure_type' => 'trail',
                        'surface_type' => 'dirt',
                        'length_meters' => 380,
                        'status' => 'passable',
                    ],
                ],
            ],
        ];

        $importRes = $this->postJson("/api/villages/{$village->id}/import-geojson", $geoJsonPayload);
        $importRes->assertOk();
        $this->assertEquals(2, $importRes->json('imported_nodes'));
        $this->assertEquals(1, $importRes->json('imported_edges'));

        $this->assertDatabaseHas('nodes', ['name' => 'Upper Terrace Settlement Point']);
        $this->assertDatabaseHas('nodes', ['name' => 'Spring Reservoir Point']);
        $this->assertDatabaseHas('edges', ['name' => 'Terrace-to-Spring Footpath']);
    }

    public function test_integrity_check_returns_graph_diagnostics(): void
    {
        $village = Village::first();
        $response = $this->getJson("/api/villages/{$village->id}/integrity");

        $response->assertOk();
        $data = $response->json();
        $this->assertArrayHasKey('health_score', $data);
        $this->assertArrayHasKey('is_fully_connected', $data);
        $this->assertArrayHasKey('total_nodes', $data);
        $this->assertArrayHasKey('total_edges', $data);
        $this->assertArrayHasKey('connected_components_count', $data);
    }
}
