<?php

namespace Tests\Feature;

use App\Models\Municipality;
use App\Models\User;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VillageScopingAndVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected Municipality $muni1;
    protected Municipality $muni2;
    protected Village $villageMuni1Ward1Active;
    protected Village $villageMuni1Ward2Active;
    protected Village $villageMuni1Ward1Draft;
    protected Village $villageMuni2Ward1Active;
    protected Village $villageMuni2Ward2Archived;
    protected User $sysAdmin;
    protected User $muniAdmin1;
    protected User $wardOfficer1;
    protected User $citizen;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        // Clean existing villages to have explicit test control
        Village::query()->delete();

        $this->muni1 = Municipality::firstOrCreate(
            ['id' => 1],
            ['name' => 'Mahabu Rural Municipality', 'code' => 'mahabu', 'district' => 'Dailekh', 'province' => 'Karnali', 'ward_count' => 5]
        );

        $this->muni2 = Municipality::firstOrCreate(
            ['id' => 2],
            ['name' => 'Helambu Rural Municipality', 'code' => 'helambu', 'district' => 'Sindhupalchok', 'province' => 'Bagmati', 'ward_count' => 7]
        );

        $this->villageMuni1Ward1Active = Village::create([
            'name' => 'Mahabu Bazar Active',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 1,
            'latitude' => 28.8950,
            'longitude' => 81.7120,
            'status' => 'active',
        ]);

        $this->villageMuni1Ward2Active = Village::create([
            'name' => 'Mahabu Ward 2 Active',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 2,
            'latitude' => 28.8960,
            'longitude' => 81.7130,
            'status' => 'active',
        ]);

        $this->villageMuni1Ward1Draft = Village::create([
            'name' => 'Mahabu Ward 1 Draft',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 1,
            'latitude' => 28.8970,
            'longitude' => 81.7140,
            'status' => 'draft',
        ]);

        $this->villageMuni2Ward1Active = Village::create([
            'name' => 'Helambu Village Active',
            'municipality_id' => $this->muni2->id,
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati',
            'ward_no' => 1,
            'latitude' => 28.0200,
            'longitude' => 85.5500,
            'status' => 'active',
        ]);

        $this->villageMuni2Ward2Archived = Village::create([
            'name' => 'Helambu Village Archived',
            'municipality_id' => $this->muni2->id,
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati',
            'ward_no' => 2,
            'latitude' => 28.0210,
            'longitude' => 85.5510,
            'status' => 'archived',
        ]);

        $this->sysAdmin = User::create([
            'name' => 'System Super Admin',
            'email' => 'superadmin_scoping@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_SYSTEM_ADMIN,
            'is_active' => true,
        ]);

        $this->muniAdmin1 = User::create([
            'name' => 'Dailekh Admin',
            'email' => 'dailekh_admin_scoping@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_MUNICIPALITY_ADMIN,
            'municipality_id' => $this->muni1->id,
            'is_active' => true,
        ]);

        $this->wardOfficer1 = User::create([
            'name' => 'Ward 1 Officer',
            'email' => 'ward1_scoping@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_WARD_OFFICER,
            'municipality_id' => $this->muni1->id,
            'ward_number' => 1,
            'is_active' => true,
        ]);

        $this->citizen = User::create([
            'name' => 'Citizen Ram',
            'email' => 'citizen_scoping@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_CITIZEN,
            'is_active' => true,
        ]);
    }

    public function test_system_admin_sees_all_villages_nationwide(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson('/api/villages');
        $response->assertOk();

        $data = $response->json();
        $this->assertCount(5, $data);
    }

    public function test_system_admin_can_filter_villages_by_municipality_id_query_param(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson('/api/villages?municipality_id=' . $this->muni2->id);
        $response->assertOk();

        $data = $response->json();
        $this->assertCount(2, $data);
        foreach ($data as $v) {
            $this->assertEquals((string) $this->muni2->id, (string) $v['municipality_id']);
        }

        // Test explicit 'all' parameter returns all nationwide
        $responseAll = $this->getJson('/api/villages?municipality_id=all');
        $responseAll->assertOk();
        $this->assertCount(5, $responseAll->json());
    }

    public function test_system_admin_can_filter_villages_by_x_municipality_id_header(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->withHeader('X-Municipality-Id', (string) $this->muni1->id)
            ->getJson('/api/villages');
        $response->assertOk();

        $data = $response->json();
        $this->assertCount(3, $data);
        foreach ($data as $v) {
            $this->assertEquals((string) $this->muni1->id, (string) $v['municipality_id']);
        }
    }

    public function test_system_admin_workspace_current_handles_all(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson('/api/workspace/current?municipality_id=all');
        $response->assertOk();

        $this->assertEquals('all', $response->json('municipality.id'));
        $this->assertEquals('All Municipalities (Nationwide)', $response->json('municipality.name'));
        $this->assertCount(5, $response->json('villages'));
    }

    public function test_municipality_admin_only_sees_their_municipality_villages(): void
    {
        Sanctum::actingAs($this->muniAdmin1);

        $response = $this->getJson('/api/villages');
        $response->assertOk();

        $data = $response->json();
        $this->assertCount(3, $data);
        foreach ($data as $v) {
            $this->assertEquals((string) $this->muni1->id, (string) $v['municipality_id']);
        }
    }

    public function test_ward_officer_only_sees_their_ward_villages(): void
    {
        Sanctum::actingAs($this->wardOfficer1);

        $response = $this->getJson('/api/villages');
        $response->assertOk();

        $data = $response->json();
        // muni 1 has ward 1 active and ward 1 draft -> both belong to ward 1
        $this->assertCount(2, $data);
        foreach ($data as $v) {
            $this->assertEquals((string) $this->muni1->id, (string) $v['municipality_id']);
            $this->assertEquals('1', (string) $v['ward_no']);
        }
    }

    public function test_citizen_only_sees_active_villages_and_cannot_see_draft_or_archived(): void
    {
        Sanctum::actingAs($this->citizen);

        $response = $this->getJson('/api/villages');
        $response->assertOk();

        $data = $response->json();
        // 3 active villages (muni1 ward 1, muni1 ward 2, muni2 ward 1)
        $this->assertCount(3, $data);
        foreach ($data as $v) {
            $this->assertEquals('active', $v['status']);
        }
    }

    public function test_unauthenticated_user_only_sees_active_villages(): void
    {
        $response = $this->getJson('/api/villages');
        $response->assertOk();

        $data = $response->json();
        $this->assertCount(3, $data);
        foreach ($data as $v) {
            $this->assertEquals('active', $v['status']);
        }
    }
}
