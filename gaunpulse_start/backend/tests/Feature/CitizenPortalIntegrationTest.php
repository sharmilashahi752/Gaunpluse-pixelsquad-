<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\Issue;
use App\Models\User;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CitizenPortalIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');
    }

    public function test_citizen_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/citizen/register', [
            'name' => 'Ram Bahadur Shrestha',
            'email' => 'ram@example.com',
            'password' => 'Nepal@1234',
            'password_confirmation' => 'Nepal@1234',
            'contact_number' => '+977-9841000000',
            'ward_number' => 2,
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.role', 'citizen');

        $this->assertDatabaseHas('users', [
            'email' => 'ram@example.com',
            'role' => 'citizen',
            'ward_number' => 2,
        ]);
    }

    public function test_citizen_can_login_and_fetch_profile(): void
    {
        $user = User::create([
            'name' => 'Sita Maya',
            'email' => 'sita@example.com',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
            'contact_number' => '+977-9851000000',
        ]);

        $loginRes = $this->postJson('/api/citizen/login', [
            'email' => 'sita@example.com',
            'password' => 'Nepal@1234',
        ]);

        $loginRes->assertOk()->assertJsonStructure(['token', 'user']);
        $token = $loginRes->json('token');

        $meRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/citizen/me');

        $meRes->assertOk()
            ->assertJsonPath('user.email', 'sita@example.com');
    }

    public function test_citizen_can_fetch_locations_and_categories(): void
    {
        $response = $this->getJson('/api/citizen/locations');

        $response->assertOk()
            ->assertJsonStructure(['municipality', 'villages', 'categories']);

        $this->assertNotEmpty($response->json('categories'));
        $this->assertContains('Road Damage', $response->json('categories'));
    }

    public function test_citizen_can_submit_complaint_and_syncs_with_core_issues_table(): void
    {
        $citizen = User::create([
            'name' => 'Bikram Thapa',
            'email' => 'bikram@example.com',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);
        $token = $citizen->createToken('test-token')->plainTextToken;

        $village = Village::first();

        $image = UploadedFile::fake()->image('damage.jpg', 640, 480);

        $payload = [
            'title' => 'Landslide blocked main village lifeline',
            'category' => 'Landslide',
            'description' => 'Heavy rainfall triggered rockfall blocking path to health post.',
            'village_id' => $village->id,
            'ward_number' => 1,
            'contact_number' => '+977-9800000001',
            'latitude' => 28.9242,
            'longitude' => 81.7125,
            'images' => [$image],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/citizen/complaints', $payload);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'complaint' => ['id', 'complaint_number', 'issue_id']]);

        $complaintId = $response->json('complaint.id');
        $issueId = $response->json('complaint.issue_id');

        $this->assertNotNull($issueId);

        // Verify Complaint record
        $this->assertDatabaseHas('complaints', [
            'id' => $complaintId,
            'user_id' => $citizen->id,
            'category' => 'Landslide',
            'status' => 'pending',
            'issue_id' => $issueId,
        ]);

        // Verify media record
        $this->assertDatabaseHas('complaint_media', [
            'complaint_id' => $complaintId,
            'media_type' => 'image',
        ]);

        // Verify Core Issue dual-sync
        $this->assertDatabaseHas('issues', [
            'id' => $issueId,
            'village_id' => $village->id,
            'category' => 'damaged_road', // Mapped category
            'severity' => 'critical',     // Inferred severity for Landslide
            'status' => 'submitted',
        ]);
    }

    public function test_admin_status_update_synchronizes_to_complaint_and_creates_notification(): void
    {
        $admin = User::create([
            'name' => 'Municipal Engineer',
            'email' => 'admin@gaunpulse.gov.np',
            'password' => Hash::make('Admin@1234'),
            'role' => 'admin',
        ]);

        $citizen = User::create([
            'name' => 'Sunita Rai',
            'email' => 'sunita@example.com',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);

        $village = Village::first();

        // Create issue and matching complaint
        $issueData = [
            'village_id' => $village->id,
            'user_id' => $citizen->id,
            'title' => 'Broken drinking water tap line',
            'category' => 'water_supply',
            'severity' => 'high',
            'status' => 'submitted',
            'description' => 'Pipe broke near main ward junction',
            'latitude' => 28.9242,
            'longitude' => 81.7125,
        ];
        if (\Illuminate\Support\Facades\Schema::hasColumn('issues', 'tracking_code')) {
            $issueData['tracking_code'] = 'GP-2026-TEST1';
        }
        $issue = Issue::create($issueData);

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-TEST1',
            'user_id' => $citizen->id,
            'issue_id' => $issue->id,
            'village_id' => $village->id,
            'ward_number' => 1,
            'title' => 'Broken drinking water tap line',
            'category' => 'Drinking Water',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        // Admin updates status via standard IssueController endpoint
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $updateRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->patchJson("/api/issues/{$issue->id}/status", [
                'status' => 'in_progress',
                'comment' => 'Maintenance crew dispatched with replacement PVC pipes.',
            ]);

        $updateRes->assertOk();

        // Verify complaint status synchronized
        $complaint->refresh();
        $this->assertEquals('in_progress', $complaint->status);
        $this->assertEquals('Maintenance crew dispatched with replacement PVC pipes.', $complaint->official_response);

        // Verify citizen notification generated
        $this->assertDatabaseHas('citizen_notifications', [
            'user_id' => $citizen->id,
            'complaint_id' => $complaint->id,
        ]);

        // Verify complaint updates timeline record
        $this->assertDatabaseHas('complaint_updates', [
            'complaint_id' => $complaint->id,
            'new_status' => 'in_progress',
        ]);
    }

    public function test_citizen_can_withdraw_complaint(): void
    {
        $citizen = User::create([
            'name' => 'Kiran Gurung',
            'email' => 'kiran@example.com',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);
        $token = $citizen->createToken('token')->plainTextToken;

        $village = Village::first();
        $issue = Issue::create([
            'village_id' => $village->id,
            'title' => 'Minor pothole',
            'category' => 'damaged_road',
            'severity' => 'low',
            'status' => 'submitted',
            'description' => 'Temporary pothole',
            'latitude' => 28.0,
            'longitude' => 84.0,
        ]);

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-TEST2',
            'user_id' => $citizen->id,
            'issue_id' => $issue->id,
            'village_id' => $village->id,
            'title' => 'Minor pothole',
            'category' => 'Road Damage',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/citizen/complaints/{$complaint->id}/withdraw");

        $res->assertOk();

        $complaint->refresh();
        $this->assertEquals('withdrawn', $complaint->status);

        $issue->refresh();
        $this->assertEquals('rejected', $issue->status);
    }
}
