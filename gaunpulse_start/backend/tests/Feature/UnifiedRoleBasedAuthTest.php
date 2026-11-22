<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Issue;
use App\Models\Municipality;
use App\Models\User;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UnifiedRoleBasedAuthTest extends TestCase
{
    use RefreshDatabase;

    protected Municipality $municipality;
    protected Village $village;
    protected User $sysAdmin;
    protected User $muniAdmin;
    protected User $wardOfficer;
    protected User $citizen;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->municipality = Municipality::firstOrCreate(
            ['id' => 1],
            ['name' => 'Mahabu Rural Municipality', 'code' => 'mahabu', 'district' => 'Dailekh', 'province' => 'Karnali', 'ward_count' => 5]
        );

        $this->village = Village::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Mahabu Bazar',
                'municipality_id' => $this->municipality->id,
                'municipality' => 'Mahabu Rural Municipality',
                'district' => 'Dailekh',
                'province' => 'Karnali',
                'ward_no' => 1,
                'latitude' => 28.8950,
                'longitude' => 81.7120,
            ]
        );

        $this->sysAdmin = User::firstOrCreate(
            ['email' => 'sysadmin_test@gaunpulse.gov.np'],
            [
                'name' => 'Test System Admin',
                'password' => Hash::make('Secret123!'),
                'role' => User::ROLE_SYSTEM_ADMIN,
                'is_active' => true,
            ]
        );

        $this->muniAdmin = User::firstOrCreate(
            ['email' => 'muniadmin_test@gaunpulse.gov.np'],
            [
                'name' => 'Test Muni Admin',
                'password' => Hash::make('Secret123!'),
                'role' => User::ROLE_MUNICIPALITY_ADMIN,
                'municipality_id' => $this->municipality->id,
                'is_active' => true,
            ]
        );

        $this->wardOfficer = User::firstOrCreate(
            ['email' => 'ward1_test@gaunpulse.gov.np'],
            [
                'name' => 'Test Ward Officer',
                'password' => Hash::make('Secret123!'),
                'role' => User::ROLE_WARD_OFFICER,
                'municipality_id' => $this->municipality->id,
                'ward_number' => 1,
                'is_active' => true,
            ]
        );

        $this->citizen = User::firstOrCreate(
            ['email' => 'citizen_test@gaunpulse.gov.np'],
            [
                'name' => 'Test Citizen',
                'phone' => '9841000000',
                'password' => Hash::make('Secret123!'),
                'role' => User::ROLE_CITIZEN,
                'municipality_id' => $this->municipality->id,
                'ward_number' => 1,
                'is_active' => true,
            ]
        );
    }

    public function test_system_admin_login_returns_role_and_dashboard_redirect(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'sysadmin_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user', 'role', 'redirect_route'])
            ->assertJson([
                'role' => User::ROLE_SYSTEM_ADMIN,
                'redirect_route' => 'dashboard',
            ]);
    }

    public function test_municipality_admin_login_returns_dashboard_redirect(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'muniadmin_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'role' => User::ROLE_MUNICIPALITY_ADMIN,
                'redirect_route' => 'dashboard',
            ]);
    }

    public function test_ward_officer_login_returns_dashboard_redirect(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'ward1_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'role' => User::ROLE_WARD_OFFICER,
                'redirect_route' => 'dashboard',
            ]);
    }

    public function test_citizen_login_returns_role_citizen_and_citizen_redirect(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'citizen_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'role' => User::ROLE_CITIZEN,
                'redirect_route' => 'citizen',
            ]);
    }

    public function test_invalid_credentials_rejected_with_422(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'citizen_test@gaunpulse.gov.np',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_deactivated_account_rejected_with_403(): void
    {
        $this->citizen->update(['is_active' => false]);

        $response = $this->postJson('/api/login', [
            'email' => 'citizen_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(403);
    }

    public function test_citizen_portal_login_endpoint_rejects_staff_users_with_403(): void
    {
        $response = $this->postJson('/api/citizen/login', [
            'email' => 'sysadmin_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(403);
    }

    public function test_citizen_portal_login_authenticates_citizen(): void
    {
        $response = $this->postJson('/api/citizen/login', [
            'email' => 'citizen_test@gaunpulse.gov.np',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_citizen_token_cannot_access_admin_user_management(): void
    {
        $token = $this->citizen->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    public function test_citizen_token_cannot_access_admin_audit_logs(): void
    {
        $token = $this->citizen->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/admin/audit-logs');

        $response->assertStatus(403);
    }

    public function test_citizen_token_cannot_modify_issue_status(): void
    {
        $issue = Issue::create([
            'village_id' => $this->village->id,
            'title' => 'Bridge Crack',
            'description' => 'Bridge deck cracked after flood',
            'category' => 'Transport',
            'severity' => 'Critical',
            'status' => 'submitted',
        ]);

        $token = $this->citizen->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->patchJson("/api/issues/{$issue->id}/status", [
                'status' => 'resolved',
            ]);

        $response->assertStatus(403);
    }

    public function test_staff_token_can_access_staff_endpoints(): void
    {
        $token = $this->muniAdmin->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_logout_revokes_token(): void
    {
        $newAccessToken = $this->citizen->createToken('test-token');
        $token = $newAccessToken->plainTextToken;
        $tokenId = $newAccessToken->accessToken->id;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->postJson('/api/logout');

        $response->assertStatus(200);

        // Token record must be deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);
    }
}
