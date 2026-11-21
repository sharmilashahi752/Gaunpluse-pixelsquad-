<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Edge;
use App\Models\Node;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RealNepalVillageIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_nepal_location_directory_hierarchy_and_endpoints(): void
    {
        // 1. Hierarchy
        $hierRes = $this->getJson('/api/locations/hierarchy');
        $hierRes->assertOk();
        $hierarchy = $hierRes->json();
        $this->assertCount(7, $hierarchy); // All 7 provinces of Nepal

        // 2. Provinces
        $provRes = $this->getJson('/api/locations/provinces');
        $provRes->assertOk();
        $provinces = $provRes->json();
        $this->assertCount(7, $provinces);
        $this->assertEquals('Koshi Province', $provinces[0]['name']);

        // 3. Districts for Bagmati Province
        $distRes = $this->getJson('/api/locations/districts?province=Bagmati%20Province');
        $distRes->assertOk();
        $districts = $distRes->json();
        $this->assertContains('Sindhupalchok', $districts);
        $this->assertContains('Rasuwa', $districts);

        // 4. Municipalities for Sindhupalchok
        $muniRes = $this->getJson('/api/locations/municipalities?district=Sindhupalchok');
        $muniRes->assertOk();
        $munis = $muniRes->json();
        $names = array_column($munis, 'name');
        $this->assertContains('Helambu Rural Municipality', $names);
        $this->assertContains('Melamchi Municipality', $names);

        // 5. Wards for Helambu
        $wardRes = $this->getJson('/api/locations/wards?municipality=Helambu%20Rural%20Municipality');
        $wardRes->assertOk();
        $wards = $wardRes->json();
        $this->assertCount(7, $wards);
        $this->assertEquals('Ward 1', $wards[0]['name']);
    }

    public function test_village_onboarding_wizard_draft_and_activation(): void
    {
        // Step 1 & 2 draft save
        $draftRes = $this->postJson('/api/villages/wizard-draft', [
            'onboarding_step' => 2,
            'name' => 'Sermathang Village Onboarding',
            'local_name' => 'सेर्माथाङ गाउँ',
            'ward_no' => '2',
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'center_lat' => 27.9125,
            'center_lng' => 85.5920,
            'description' => 'Highland cultural settlement along Helambu circuit trail',
            'status' => 'draft',
            'data_source' => 'Helambu Municipal Field Survey',
            'reference_year' => 2026,
        ]);

        $draftRes->assertOk();
        $draftId = $draftRes->json('draft_id');
        $this->assertEquals(2, $draftRes->json('onboarding_step'));
        $this->assertDatabaseHas('villages', [
            'id' => $draftId,
            'status' => 'draft',
            'onboarding_step' => 2,
            'name' => 'Sermathang Village Onboarding',
        ]);

        // Resume and update draft to step 4
        $updateDraftRes = $this->postJson('/api/villages/wizard-draft', [
            'draft_id' => $draftId,
            'onboarding_step' => 4,
            'name' => 'Sermathang Village Model',
            'ward_no' => '2',
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'status' => 'draft',
        ]);
        $updateDraftRes->assertOk();
        $this->assertEquals(4, $updateDraftRes->json('onboarding_step'));

        // Activate the village
        $activateRes = $this->postJson("/api/villages/{$draftId}/activate");
        $activateRes->assertOk();
        $this->assertEquals('active', $activateRes->json('village.status'));
        $this->assertEquals(5, $activateRes->json('village.onboarding_step'));

        $this->assertDatabaseHas('villages', ['id' => $draftId, 'status' => 'active', 'onboarding_step' => 5]);
        $this->assertDatabaseHas('audit_logs', ['village_id' => $draftId, 'action_type' => 'activated']);
    }

    public function test_csv_import_for_nodes_and_edges(): void
    {
        $village = Village::first();

        // 1. Node CSV
        $nodeCsv = "name,node_code,node_type,latitude,longitude,description\n" .
            "Thimbu River Pier,thimbu_pier,junction,28.0125,85.5210,River junction near trout fishery\n" .
            "Kyangjin Ghyang Point,kyangjin_ghyang,settlement,28.0190,85.5280,Residential ridge cluster\n";

        $importNodesRes = $this->postJson("/api/villages/{$village->id}/import-csv", [
            'csv_text' => $nodeCsv,
        ]);
        $importNodesRes->assertOk();
        $this->assertEquals(2, $importNodesRes->json('imported_count'));
        $this->assertDatabaseHas('nodes', ['name' => 'Thimbu River Pier', 'source' => 'csv_import']);

        // 2. Edge CSV linking those two nodes
        $edgeCsv = "name,edge_code,source_node_code,target_node_code,infrastructure_type,surface_type,status,length_meters\n" .
            "Thimbu-Kyangjin Ridge Path,thimbu_kyangjin_path,thimbu_pier,kyangjin_ghyang,trail,earthen,passable,650\n";

        $importEdgesRes = $this->postJson("/api/villages/{$village->id}/import-csv", [
            'csv_text' => $edgeCsv,
        ]);
        $importEdgesRes->assertOk();
        $this->assertEquals(1, $importEdgesRes->json('imported_count'));
        $this->assertDatabaseHas('edges', ['name' => 'Thimbu-Kyangjin Ridge Path', 'source' => 'csv_import']);
    }

    public function test_osm_import_preview_and_persistence(): void
    {
        $village = Village::first();

        // 1. Preview
        $previewRes = $this->postJson("/api/villages/{$village->id}/import-osm", [
            'preview_only' => true,
        ]);
        $previewRes->assertOk();
        $this->assertTrue($previewRes->json('preview_only'));
        $this->assertGreaterThan(0, $previewRes->json('summary.candidate_nodes'));

        // 2. Real import
        $importRes = $this->postJson("/api/villages/{$village->id}/import-osm", [
            'preview_only' => false,
        ]);
        $importRes->assertOk();
        $this->assertTrue($importRes->json('success'));
        $this->assertGreaterThan(0, $importRes->json('imported_nodes'));
        $this->assertDatabaseHas('nodes', ['source' => 'osm']);
        $this->assertDatabaseHas('audit_logs', ['village_id' => $village->id, 'action_type' => 'imported']);
    }

    public function test_build_network_topology_and_verification_system(): void
    {
        $village = Village::first();

        // 1. Build network
        $buildRes = $this->postJson("/api/villages/{$village->id}/build-network");
        $buildRes->assertOk();
        $this->assertTrue($buildRes->json('success'));
        $this->assertArrayHasKey('diagnostics', $buildRes->json());

        // 2. Verify node
        $node = $village->nodes()->first();
        $verifyNodeRes = $this->patchJson("/api/villages/{$village->id}/nodes/{$node->id}/verify", [
            'verification_status' => 'verified',
            'verified_by' => 'Chief Municipal Engineer',
            'confidence_score' => 95,
            'verification_notes' => 'Inspected and confirmed via RTK GNSS field survey.',
        ]);
        $verifyNodeRes->assertOk();
        $this->assertEquals('verified', $verifyNodeRes->json('verification_status'));
        $this->assertEquals(95, $verifyNodeRes->json('confidence_score'));

        // 3. Verify edge
        $edge = $village->edges()->first();
        $verifyEdgeRes = $this->patchJson("/api/villages/{$village->id}/edges/{$edge->id}/verify", [
            'verification_status' => 'verified',
            'verified_by' => 'Chief Municipal Engineer',
            'confidence_score' => 90,
            'verification_notes' => 'Culvert and deck verified safe.',
        ]);
        $verifyEdgeRes->assertOk();
        $this->assertEquals('verified', $verifyEdgeRes->json('verification_status'));

        // 4. Check audit logs
        $logsRes = $this->getJson("/api/villages/{$village->id}/audit-logs");
        $logsRes->assertOk();
        $this->assertNotEmpty($logsRes->json());
    }

    public function test_multi_municipality_isolation(): void
    {
        // Create a village in Helambu and another in Pokhara
        $helambuVillage = Village::create([
            'name' => 'Tarkeghyang Helambu',
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'status' => 'active',
        ]);

        $pokharaVillage = Village::create([
            'name' => 'Sarangkot Ward 18',
            'municipality' => 'Pokhara Metropolitan City',
            'district' => 'Kaski',
            'province' => 'Gandaki Province',
            'status' => 'active',
        ]);

        // Scoped query for Helambu
        $scopedHelambu = $this->getJson('/api/villages?municipality=Helambu%20Rural%20Municipality');
        $scopedHelambu->assertOk();
        $helambuNames = array_column($scopedHelambu->json(), 'name');
        $this->assertContains('Tarkeghyang Helambu', $helambuNames);
        $this->assertNotContains('Sarangkot Ward 18', $helambuNames);

        // Scoped query for Pokhara
        $scopedPokhara = $this->getJson('/api/villages?municipality=Pokhara%20Metropolitan%20City');
        $scopedPokhara->assertOk();
        $pokharaNames = array_column($scopedPokhara->json(), 'name');
        $this->assertContains('Sarangkot Ward 18', $pokharaNames);
        $this->assertNotContains('Tarkeghyang Helambu', $pokharaNames);
    }
}
