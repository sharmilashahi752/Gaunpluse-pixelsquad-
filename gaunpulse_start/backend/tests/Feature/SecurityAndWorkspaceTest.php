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

class SecurityAndWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    protected Municipality $muni1;
    protected Municipality $muni2;
    protected Village $villageMuni1;
    protected Village $villageMuni2;
    protected User $sysAdmin;
    protected User $muniAdmin1;
    protected User $muniAdmin2;
    protected User $wardOfficer1;
    protected User $wardOfficer2;
    protected User $citizen;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        // Ensure distinct municipalities for scoping tests
        $this->muni1 = Municipality::firstOrCreate(
            ['id' => 1],
            ['name' => 'Mahabu Rural Municipality', 'code' => 'mahabu', 'district' => 'Dailekh', 'province' => 'Karnali', 'ward_count' => 5]
        );

        $this->muni2 = Municipality::firstOrCreate(
            ['id' => 2],
            ['name' => 'Helambu Rural Municipality', 'code' => 'helambu', 'district' => 'Sindhupalchok', 'province' => 'Bagmati', 'ward_count' => 7]
        );

        // Ensure villages belong to respective municipalities
        $this->villageMuni1 = Village::where('municipality_id', $this->muni1->id)->first() ?? Village::create([
            'name' => 'Mahabu Bazar',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 1,
            'latitude' => 28.8950,
            'longitude' => 81.7120,
        ]);

        $this->villageMuni2 = Village::where('municipality_id', $this->muni2->id)->first() ?? Village::create([
            'name' => 'Timbu',
            'municipality_id' => $this->muni2->id,
            'municipality' => 'Helambu Rural Municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati',
            'ward_no' => 2,
            'latitude' => 28.0200,
            'longitude' => 85.5500,
        ]);

        // Users
        $this->sysAdmin = User::create([
            'name' => 'System Super Admin',
            'email' => 'superadmin@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_SYSTEM_ADMIN,
            'is_active' => true,
        ]);

        $this->muniAdmin1 = User::create([
            'name' => 'Dailekh Admin',
            'email' => 'dailekh_admin@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_MUNICIPALITY_ADMIN,
            'municipality_id' => $this->muni1->id,
            'is_active' => true,
        ]);

        $this->muniAdmin2 = User::create([
            'name' => 'Helambu Admin',
            'email' => 'helambu_admin@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_MUNICIPALITY_ADMIN,
            'municipality_id' => $this->muni2->id,
            'is_active' => true,
        ]);

        $this->wardOfficer1 = User::create([
            'name' => 'Ward 1 Officer',
            'email' => 'ward1@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_WARD_OFFICER,
            'municipality_id' => $this->muni1->id,
            'ward_number' => 1,
            'is_active' => true,
        ]);

        $this->wardOfficer2 = User::create([
            'name' => 'Ward 2 Officer',
            'email' => 'ward2@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_WARD_OFFICER,
            'municipality_id' => $this->muni1->id,
            'ward_number' => 2,
            'is_active' => true,
        ]);

        $this->citizen = User::create([
            'name' => 'Ram Nepali',
            'email' => 'ram@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_CITIZEN,
            'is_active' => true,
        ]);
    }

    /**
     * Phase 1: Authentication & Deactivation
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'dailekh_admin@gaunpulse.test',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.email', 'dailekh_admin@gaunpulse.test')
            ->assertJsonPath('user.role', 'municipality_admin');
    }

    public function test_deactivated_user_cannot_login(): void
    {
        $this->muniAdmin1->update(['is_active' => false]);

        $response = $this->postJson('/api/login', [
            'email' => 'dailekh_admin@gaunpulse.test',
            'password' => 'Password123!',
        ]);

        $response->assertForbidden();
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $token = $this->muniAdmin1->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/user/change-password', [
                'current_password' => 'Password123!',
                'new_password' => 'NewSecurePass2026!',
                'new_password_confirmation' => 'NewSecurePass2026!',
            ]);

        $response->assertOk();

        // Verify login works with new password
        $loginRes = $this->postJson('/api/login', [
            'email' => 'dailekh_admin@gaunpulse.test',
            'password' => 'NewSecurePass2026!',
        ]);
        $loginRes->assertOk();
    }

    public function test_public_registration_cannot_create_privileged_roles(): void
    {
        $response = $this->postJson('/api/citizen/register', [
            'name' => 'Hacker Trying Admin',
            'email' => 'attacker@gaunpulse.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'system_admin', // Attempted privilege escalation
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'email' => 'attacker@gaunpulse.test',
            'role' => 'citizen', // Enforced as citizen
        ]);
    }

    /**
     * Phase 2 & 9: Multi-Municipality Isolation
     */
    public function test_municipality_admin_cannot_access_foreign_municipality_records(): void
    {
        // Create an issue in Municipality 2
        $foreignIssue = Issue::create([
            'village_id' => $this->villageMuni2->id,
            'title' => 'Helambu Landslide Warning',
            'description' => 'Active rockfall on village access path',
            'category' => 'landslide',
            'severity' => 'critical',
            'status' => 'submitted',
        ]);

        $tokenMuni1 = $this->muniAdmin1->createToken('test')->plainTextToken;

        // Muni 1 admin attempting to view foreign issue
        $response = $this->withHeader('Authorization', "Bearer {$tokenMuni1}")
            ->getJson("/api/issues/{$foreignIssue->id}");

        $response->assertForbidden();

        // Muni 1 admin attempting to modify foreign issue status
        $updateRes = $this->withHeader('Authorization', "Bearer {$tokenMuni1}")
            ->patchJson("/api/issues/{$foreignIssue->id}/status", [
                'status' => 'verified',
            ]);

        $updateRes->assertForbidden();
    }

    public function test_system_admin_can_access_all_municipalities(): void
    {
        $foreignIssue = Issue::create([
            'village_id' => $this->villageMuni2->id,
            'title' => 'Helambu Water Issue',
            'description' => 'Main pipeline leak near school',
            'category' => 'water_supply',
            'severity' => 'medium',
            'status' => 'submitted',
        ]);

        $sysToken = $this->sysAdmin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$sysToken}")
            ->getJson("/api/issues/{$foreignIssue->id}");

        $response->assertOk();
    }

    /**
     * Phase 4: Ward Level Scoping
     */
    public function test_ward_officer_cannot_modify_other_ward_issues(): void
    {
        // Village in Ward 2 of same municipality
        $villageWard2 = Village::create([
            'name' => 'Mahabu Ward 2 Village',
            'municipality_id' => $this->muni1->id,
            'municipality' => 'Mahabu Rural Municipality',
            'district' => 'Dailekh',
            'province' => 'Karnali',
            'ward_no' => 2,
            'latitude' => 28.9050,
            'longitude' => 81.7220,
        ]);

        // Issue in Ward 2 of same municipality
        $ward2Issue = Issue::create([
            'village_id' => $villageWard2->id,
            'title' => 'Ward 2 Broken Pipe',
            'description' => 'Sub-branch valve leakage',
            'category' => 'water_supply',
            'severity' => 'medium',
            'status' => 'submitted',
        ]);

        $ward1Token = $this->wardOfficer1->createToken('test')->plainTextToken;

        // Ward 1 officer attempting to update Ward 2 issue
        $response = $this->withHeader('Authorization', "Bearer {$ward1Token}")
            ->patchJson("/api/issues/{$ward2Issue->id}/status", [
                'status' => 'verified',
            ]);

        $response->assertForbidden();
    }

    /**
     * Phase 5: User Management & Privilege Escalation Prevention
     */
    public function test_municipality_admin_cannot_promote_user_to_system_admin(): void
    {
        $token = $this->muniAdmin1->createToken('test')->plainTextToken;

        $targetUser = User::create([
            'name' => 'Local Worker',
            'email' => 'worker@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => 'citizen',
            'municipality_id' => $this->muni1->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/users/{$targetUser->id}/role", [
                'role' => 'system_admin',
            ]);

        $response->assertForbidden();
        $this->assertEquals('citizen', $targetUser->fresh()->role);
    }

    public function test_municipality_admin_can_assign_ward_officer_in_own_municipality(): void
    {
        $token = $this->muniAdmin1->createToken('test')->plainTextToken;

        $targetUser = User::create([
            'name' => 'Candidate Officer',
            'email' => 'officer@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => 'citizen',
            'municipality_id' => $this->muni1->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/users/{$targetUser->id}/assign-ward", [
                'ward_number' => 3,
            ]);

        $response->assertOk();
        $this->assertEquals(User::ROLE_WARD_OFFICER, $targetUser->fresh()->role);
        $this->assertEquals(3, $targetUser->fresh()->ward_number);
    }

    /**
     * Phase 7: Audit Logging
     */
    public function test_audit_log_is_recorded_on_user_action(): void
    {
        $token = $this->muniAdmin1->createToken('test')->plainTextToken;

        $targetUser = User::create([
            'name' => 'Log Test User',
            'email' => 'logtest@gaunpulse.test',
            'password' => Hash::make('Password123!'),
            'role' => 'ward_officer',
            'municipality_id' => $this->muni1->id,
            'ward_number' => 1,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/users/{$targetUser->id}/toggle-active");

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'user',
            'entity_id' => $targetUser->id,
            'action_type' => 'user_status_changed',
        ]);
    }
}
