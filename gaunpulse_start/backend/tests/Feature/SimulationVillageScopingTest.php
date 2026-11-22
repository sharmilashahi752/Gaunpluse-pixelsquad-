<?php

namespace Tests\Feature;

use App\Models\Municipality;
use App\Models\Node;
use App\Models\Edge;
use App\Models\Facility;
use App\Models\User;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SimulationVillageScopingTest extends TestCase
{
    use RefreshDatabase;

    protected Municipality $muni1;
    protected Municipality $muni2;
    protected Village $villageMuni1Ward1;
    protected Village $villageMuni1Ward2;
    protected Village $villageMuni2Ward1;
    protected Village $villageEmpty;
    protected User $sysAdmin;
    protected User $muniAdmin1;
    protected User $wardOfficer1;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        // Delete default villages for complete test isolation
        Village::query()->delete();

        $this->muni1 = Municipality::firstOrCreate(
            ['id' => 1],
            ['name' => 'Mahabu Rural Municipality', 'code' => 'mahabu', 'district' => 'Dailekh', 'province' => 'Karnali', 'ward_count' => 5]
        );

        $this->muni2 = Municipality::firstOrCreate(
            ['id' => 2],
            ['name' => 'Helambu Rural Municipality', 'code' => 'helambu', 'district' => 'Sindhupalchok', 'province' => 'Bagmati', 'ward_count' => 7]
        );

        // Muni 1 - Ward 1 with active network
        $this->villageMuni1Ward1 = Village::create([
            'name' => 'Mahabu Bazar',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 1,
            'latitude' => 28.8950,
            'longitude' => 81.7120,
            'status' => 'active',
        ]);

        $node1 = Node::create([
            'village_id' => $this->villageMuni1Ward1->id,
            'node_code' => 'n1',
            'type' => 'settlement',
            'node_type' => 'settlement',
            'name' => 'Main Settlement',
            'latitude' => 28.8950,
            'longitude' => 81.7120,
        ]);
        $node2 = Node::create([
            'village_id' => $this->villageMuni1Ward1->id,
            'node_code' => 'n2',
            'type' => 'facility',
            'node_type' => 'facility',
            'name' => 'Health Post',
            'latitude' => 28.8960,
            'longitude' => 81.7130,
        ]);
        Edge::create([
            'village_id' => $this->villageMuni1Ward1->id,
            'edge_code' => 'e1',
            'name' => 'Main Road',
            'type' => 'road',
            'source_node_id' => $node1->id,
            'target_node_id' => $node2->id,
            'infrastructure_type' => 'road',
            'status' => 'operational',
            'travel_minutes' => 10,
        ]);

        // Muni 1 - Ward 2
        $this->villageMuni1Ward2 = Village::create([
            'name' => 'Mahabu Upper Ward',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 2,
            'latitude' => 28.9100,
            'longitude' => 81.7200,
            'status' => 'active',
        ]);

        // Muni 2 - Ward 1
        $this->villageMuni2Ward1 = Village::create([
            'name' => 'Helambu Center',
            'municipality_id' => $this->muni2->id,
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati',
            'ward_no' => 1,
            'latitude' => 28.0200,
            'longitude' => 85.5500,
            'status' => 'active',
        ]);

        // Empty village without graph entities
        $this->villageEmpty = Village::create([
            'name' => 'Empty Trail Village',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 1,
            'latitude' => 28.8900,
            'longitude' => 81.7100,
            'status' => 'active',
        ]);

        // Users
        $this->sysAdmin = User::create([
            'name' => 'System Admin',
            'email' => 'admin_sim@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_SYSTEM_ADMIN,
            'is_active' => true,
        ]);

        $this->muniAdmin1 = User::create([
            'name' => 'Dailekh Admin',
            'email' => 'dailekh_sim@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_MUNICIPALITY_ADMIN,
            'municipality_id' => $this->muni1->id,
            'is_active' => true,
        ]);

        $this->wardOfficer1 = User::create([
            'name' => 'Ward 1 Officer',
            'email' => 'ward1_sim@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_WARD_OFFICER,
            'municipality_id' => $this->muni1->id,
            'ward_number' => 1,
            'is_active' => true,
        ]);
    }

    public function test_system_admin_defaults_to_nationwide_workspace_with_all_villages(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson('/api/workspace/current');
        $response->assertOk();

        $this->assertEquals('all', $response->json('municipality.id'));
        $this->assertEquals('All Municipalities (Nationwide)', $response->json('municipality.name'));
        $this->assertCount(4, $response->json('villages'));
    }

    public function test_system_admin_can_load_network_graph_for_any_village(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        // Load village in Muni 1
        $res1 = $this->getJson("/api/villages/{$this->villageMuni1Ward1->id}/network");
        $res1->assertOk();
        $this->assertEquals($this->villageMuni1Ward1->id, $res1->json('village.id'));
        $this->assertCount(2, $res1->json('nodes'));
        $this->assertCount(1, $res1->json('edges'));

        // Load village in Muni 2
        $res2 = $this->getJson("/api/villages/{$this->villageMuni2Ward1->id}/network");
        $res2->assertOk();
        $this->assertEquals($this->villageMuni2Ward1->id, $res2->json('village.id'));
    }

    public function test_municipality_admin_can_load_their_village_network(): void
    {
        Sanctum::actingAs($this->muniAdmin1);

        $response = $this->getJson("/api/villages/{$this->villageMuni1Ward1->id}/network");
        $response->assertOk();
        $this->assertEquals($this->villageMuni1Ward1->id, $response->json('village.id'));
    }

    public function test_municipality_admin_cannot_load_network_of_another_municipality(): void
    {
        Sanctum::actingAs($this->muniAdmin1);

        $response = $this->getJson("/api/villages/{$this->villageMuni2Ward1->id}/network");
        $response->assertForbidden();
    }

    public function test_ward_officer_cannot_load_network_of_another_ward(): void
    {
        Sanctum::actingAs($this->wardOfficer1);

        // Allowed: Ward 1
        $resWard1 = $this->getJson("/api/villages/{$this->villageMuni1Ward1->id}/network");
        $resWard1->assertOk();

        // Forbidden: Ward 2
        $resWard2 = $this->getJson("/api/villages/{$this->villageMuni1Ward2->id}/network");
        $resWard2->assertForbidden();
    }

    public function test_empty_village_network_returns_cannot_simulate_readiness(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson("/api/villages/{$this->villageEmpty->id}/network");
        $response->assertOk();

        $this->assertFalse($response->json('readiness.can_simulate'));
        $this->assertEquals('no_data', $response->json('readiness.status'));
        $this->assertNotEmpty($response->json('readiness.errors'));
    }
}
