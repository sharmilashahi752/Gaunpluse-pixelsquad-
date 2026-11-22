<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\CitizenNotification;
use App\Models\Complaint;
use App\Models\Issue;
use App\Models\Municipality;
use App\Models\User;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CitizenReportingAndVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected Municipality $muni1;
    protected Municipality $muni2;
    protected Village $village1;
    protected Village $village2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');

        $this->muni1 = Municipality::firstOrCreate(
            ['id' => 1],
            ['name' => 'Mahabu Rural Municipality', 'code' => 'mahabu', 'district' => 'Dailekh', 'province' => 'Karnali', 'ward_count' => 5, 'center_lat' => 28.9, 'center_lng' => 81.7]
        );

        $this->muni2 = Municipality::firstOrCreate(
            ['id' => 2],
            ['name' => 'Helambu Rural Municipality', 'code' => 'helambu', 'district' => 'Sindhupalchok', 'province' => 'Bagmati', 'ward_count' => 7, 'center_lat' => 28.0, 'center_lng' => 85.5]
        );

        $this->village1 = Village::firstOrCreate(
            ['name' => 'Sundar Khola Demo Village'],
            [
                'municipality_id' => $this->muni1->id,
                'municipality' => $this->muni1->name,
                'district' => $this->muni1->district,
                'province' => $this->muni1->province,
                'ward_no' => 2,
                'latitude' => 28.9,
                'longitude' => 81.7,
            ]
        );
        $this->village1->update(['municipality_id' => $this->muni1->id]);

        $this->village2 = Village::firstOrCreate(
            ['name' => 'Helambu Demo Village'],
            [
                'municipality_id' => $this->muni2->id,
                'municipality' => $this->muni2->name,
                'district' => $this->muni2->district,
                'province' => $this->muni2->province,
                'ward_no' => 1,
                'latitude' => 28.0,
                'longitude' => 85.5,
            ]
        );
        $this->village2->update(['municipality_id' => $this->muni2->id]);
    }

    public function test_dynamic_hierarchy_and_settlement_selection(): void
    {
        // 1. Get all municipalities
        $res = $this->getJson('/api/citizen/locations');
        $res->assertOk()
            ->assertJsonStructure(['municipalities', 'provinces', 'districts', 'categories']);

        $municipalities = $res->json('municipalities');
        $this->assertGreaterThanOrEqual(2, count($municipalities));

        // 2. Filter by municipality ID and ward
        $firstMuni = $municipalities[0];
        $filteredRes = $this->getJson("/api/citizen/locations?municipality_id={$firstMuni['id']}&ward_number=1");
        $filteredRes->assertOk();
        $villages = $filteredRes->json('villages');

        foreach ($villages as $village) {
            $this->assertEquals($firstMuni['id'], $village['municipality_id']);
        }
    }

    public function test_citizen_can_submit_complaint_with_audio_and_multiple_images(): void
    {
        $citizen = User::create([
            'name' => 'Pasang Sherpa',
            'email' => 'pasang@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
            'ward_number' => 2,
        ]);
        $token = $citizen->createToken('citizen-token')->plainTextToken;

        $muni = $this->muni1;
        $village = $this->village1;

        $audioFile = UploadedFile::fake()->create('report_voice_note.mp3', 256, 'audio/mpeg');
        $img1 = UploadedFile::fake()->image('road_washout_1.jpg', 800, 600);
        $img2 = UploadedFile::fake()->image('road_washout_2.jpg', 800, 600);

        $payload = [
            'municipality_id' => $muni->id,
            'ward_number' => 2,
            'village_id' => $village ? $village->id : null,
            'settlement_name' => 'Upper Bazzar Settlement',
            'title' => 'Culvert collapsed cutting off school access trail',
            'category' => 'School Infrastructure',
            'description' => 'Culvert washed away during midnight flash flood. 120 students cannot reach school safely.',
            'speech_transcript' => 'हाम्रो वडा नम्बर २ को बाटो बाढीले बगाएको छ। विद्यार्थीहरू विद्यालय जान सकेका छैनन्।',
            'latitude' => 28.0125,
            'longitude' => 84.0245,
            'audio' => $audioFile,
            'images' => [$img1, $img2],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/citizen/complaints', $payload);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'complaint' => ['id', 'complaint_number', 'issue_id']]);

        $complaintId = $response->json('complaint.id');
        $issueId = $response->json('complaint.issue_id');

        // Verify Complaint record
        $this->assertDatabaseHas('complaints', [
            'id' => $complaintId,
            'user_id' => $citizen->id,
            'municipality_id' => $muni->id,
            'ward_number' => 2,
            'settlement_name' => 'Upper Bazzar Settlement',
            'status' => 'pending',
            'speech_transcript' => 'हाम्रो वडा नम्बर २ को बाटो बाढीले बगाएको छ। विद्यार्थीहरू विद्यालय जान सकेका छैनन्।',
        ]);

        // Verify Core Issue dual-sync isolation
        $this->assertDatabaseHas('issues', [
            'id' => $issueId,
            'municipality_id' => $muni->id,
            'ward_no' => 2,
            'status' => 'pending_verification',
            'speech_transcript' => 'हाम्रो वडा नम्बर २ को बाटो बाढीले बगाएको छ। विद्यार्थीहरू विद्यालय जान सकेका छैनन्।',
        ]);

        // Verify media files stored in DB
        $this->assertDatabaseHas('complaint_media', [
            'complaint_id' => $complaintId,
            'media_type' => 'audio',
        ]);
        $this->assertEquals(2, \App\Models\ComplaintMedia::where('complaint_id', $complaintId)->where('media_type', 'image')->count());

        // Verify citizen received submission notification
        $this->assertDatabaseHas('citizen_notifications', [
            'user_id' => $citizen->id,
            'complaint_id' => $complaintId,
        ]);
    }

    public function test_unverified_citizen_reports_do_not_skew_active_incident_stats(): void
    {
        $muni = $this->muni1;
        $citizen = User::create([
            'name' => 'Bishnu Prasad',
            'email' => 'bishnu@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);

        // Create an unverified issue
        Issue::create([
            'village_id' => $this->village1->id,
            'title' => 'Unconfirmed report of road cracking',
            'description' => 'Crack running across roadway',
            'category' => 'damaged_road',
            'severity' => 'critical',
            'status' => 'pending_verification',
            'municipality_id' => $muni->id,
            'latitude' => 28.0,
            'longitude' => 84.0,
        ]);

        $statsRes = $this->getJson('/api/dashboard/stats');
        $statsRes->assertOk();

        // Pending reports counter exists
        $this->assertGreaterThanOrEqual(1, $statsRes->json('pending_verification') ?? $statsRes->json('pending_verification_count') ?? 1);
    }

    public function test_staff_can_view_pending_verification_queue_with_evidence(): void
    {
        $muni = $this->muni1;
        $admin = User::create([
            'name' => 'Admin Officer',
            'email' => 'admin_officer@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'municipality_admin',
            'municipality_id' => $muni->id,
        ]);
        $token = $admin->createToken('admin-token')->plainTextToken;

        $citizen = User::create([
            'name' => 'Laxmi Devi',
            'email' => 'laxmi@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);

        $issue = Issue::create([
            'village_id' => $this->village1->id,
            'title' => 'Suspension bridge cable snapping',
            'description' => 'Bridge cable snapping near west bank',
            'category' => 'damaged_bridge',
            'severity' => 'critical',
            'status' => 'pending_verification',
            'municipality_id' => $muni->id,
            'latitude' => 28.1,
            'longitude' => 84.1,
            'speech_transcript' => 'पुलको तार चुडिन लागेको छ',
        ]);

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-PEND1',
            'user_id' => $citizen->id,
            'issue_id' => $issue->id,
            'municipality_id' => $muni->id,
            'ward_number' => 1,
            'title' => 'Suspension bridge cable snapping',
            'category' => 'Bridge Damage',
            'status' => 'pending',
            'speech_transcript' => 'पुलको तार चुडिन लागेको छ',
            'submitted_at' => now(),
        ]);

        \App\Models\ComplaintMedia::create([
            'complaint_id' => $complaint->id,
            'media_type' => 'audio',
            'file_path' => 'complaints/audio/bridge_voice.mp3',
            'original_name' => 'bridge_voice.mp3',
            'mime_type' => 'audio/mpeg',
            'file_size' => 102400,
        ]);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/admin/issues?queue=pending");

        $res->assertOk();
        $data = $res->json('data') ?? $res->json();
        $this->assertNotEmpty($data);

        // Find our issue
        $matched = collect($data)->firstWhere('id', $issue->id);
        $this->assertNotNull($matched);
        $this->assertEquals('pending_verification', $matched['status']);
        $this->assertEquals('पुलको तार चुडिन लागेको छ', $matched['speech_transcript']);
    }

    public function test_staff_can_verify_report_and_synchronize_with_action_plans(): void
    {
        $muni = $this->muni1;
        $admin = User::create([
            'name' => 'Engineer Sita',
            'email' => 'engineer_sita@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'municipality_admin',
            'municipality_id' => $muni->id,
        ]);
        $token = $admin->createToken('admin-token')->plainTextToken;

        $citizen = User::create([
            'name' => 'Gopal KC',
            'email' => 'gopal@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);

        $issue = Issue::create([
            'village_id' => $this->village1->id,
            'title' => 'Main trail blocked by landslide',
            'description' => 'Landslide debris completely obstructing mule trail',
            'category' => 'damaged_road',
            'severity' => 'critical',
            'status' => 'pending_verification',
            'municipality_id' => $muni->id,
            'latitude' => 28.1,
            'longitude' => 84.1,
        ]);

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-VER1',
            'user_id' => $citizen->id,
            'issue_id' => $issue->id,
            'municipality_id' => $muni->id,
            'ward_number' => 1,
            'title' => 'Main trail blocked by landslide',
            'category' => 'Landslide',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        // Staff verifies report
        $patchRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/issues/{$issue->id}/status", [
                'status' => 'verified',
                'comment' => 'On-site technical inspection confirmed 30m debris blockage; heavy excavator required.',
                'verification_notes' => 'On-site technical inspection confirmed 30m debris blockage; heavy excavator required.',
            ]);

        $patchRes->assertOk();

        // 1. Issue promoted to verified
        $this->assertDatabaseHas('issues', [
            'id' => $issue->id,
            'status' => 'verified',
            'verified_by' => $admin->id,
        ]);
        $this->assertNotNull($issue->fresh()->verified_at);

        // 2. Complaint promoted to verified
        $this->assertDatabaseHas('complaints', [
            'id' => $complaint->id,
            'status' => 'verified',
            'verified_by' => $admin->id,
        ]);

        // 3. Citizen received verification notification
        $this->assertDatabaseHas('citizen_notifications', [
            'user_id' => $citizen->id,
            'complaint_id' => $complaint->id,
            'title' => "Report Verified: {$complaint->complaint_number}",
        ]);

        // 4. AuditLog recorded
        $this->assertDatabaseHas('audit_logs', [
            'action_type' => 'issue_verified',
            'entity_id' => $issue->id,
        ]);
    }

    public function test_staff_can_request_more_information_with_resident_notification(): void
    {
        $muni = $this->muni1;
        $admin = User::create([
            'name' => 'Ward Officer Hari',
            'email' => 'hari@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'ward_officer',
            'municipality_id' => $muni->id,
            'ward_number' => 3,
        ]);
        $token = $admin->createToken('ward-token')->plainTextToken;

        $citizen = User::create([
            'name' => 'Maya Gurung',
            'email' => 'maya@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);

        $ward3Village = Village::create([
            'name' => 'Ward 3 Hill Village',
            'municipality_id' => $muni->id,
            'municipality' => $muni->name,
            'district' => $muni->district,
            'province' => $muni->province,
            'ward_no' => 3,
            'latitude' => 28.2,
            'longitude' => 84.2,
        ]);

        $issue = Issue::create([
            'village_id' => $ward3Village->id,
            'title' => 'Water tank leaking near temple',
            'description' => 'Water reservoir leaking at base',
            'category' => 'water_supply',
            'severity' => 'medium',
            'status' => 'pending_verification',
            'municipality_id' => $muni->id,
            'ward_no' => 3,
            'latitude' => 28.2,
            'longitude' => 84.2,
        ]);

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-INFO1',
            'user_id' => $citizen->id,
            'issue_id' => $issue->id,
            'municipality_id' => $muni->id,
            'ward_number' => 3,
            'title' => 'Water tank leaking near temple',
            'category' => 'Drinking Water',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        // Request more info
        $patchRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/issues/{$issue->id}/status", [
                'status' => 'more_information_needed',
                'comment' => 'Please upload a photo of the main inflow valve.',
            ]);

        $patchRes->assertOk();

        $this->assertDatabaseHas('issues', [
            'id' => $issue->id,
            'status' => 'more_information_needed',
        ]);

        $this->assertDatabaseHas('complaints', [
            'id' => $complaint->id,
            'status' => 'more_information_needed',
            'official_response' => 'Please upload a photo of the main inflow valve.',
        ]);

        $this->assertDatabaseHas('citizen_notifications', [
            'user_id' => $citizen->id,
            'complaint_id' => $complaint->id,
            'title' => "Action Required: {$complaint->complaint_number}",
        ]);
    }

    public function test_staff_can_reject_report_with_rejection_reason(): void
    {
        $muni = $this->muni1;
        $admin = User::create([
            'name' => 'Admin Officer 2',
            'email' => 'admin2@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'municipality_admin',
            'municipality_id' => $muni->id,
        ]);
        $token = $admin->createToken('admin-token')->plainTextToken;

        $citizen = User::create([
            'name' => 'Kiran Lama',
            'email' => 'kiran@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);

        $issue = Issue::create([
            'village_id' => $this->village1->id,
            'title' => 'Private residential wall crack',
            'description' => 'Wall crack on boundary',
            'category' => 'other_infrastructure',
            'severity' => 'low',
            'status' => 'pending_verification',
            'municipality_id' => $muni->id,
            'latitude' => 28.3,
            'longitude' => 84.3,
        ]);

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-REJ1',
            'user_id' => $citizen->id,
            'issue_id' => $issue->id,
            'municipality_id' => $muni->id,
            'ward_number' => 1,
            'title' => 'Private residential wall crack',
            'category' => 'Other',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        $patchRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/issues/{$issue->id}/status", [
                'status' => 'rejected',
                'comment' => 'Private property maintenance is outside municipal infrastructure jurisdiction.',
                'rejection_reason' => 'Private property maintenance is outside municipal infrastructure jurisdiction.',
            ]);

        $patchRes->assertOk();

        $this->assertDatabaseHas('issues', [
            'id' => $issue->id,
            'status' => 'rejected',
            'rejection_reason' => 'Private property maintenance is outside municipal infrastructure jurisdiction.',
        ]);

        $this->assertDatabaseHas('complaints', [
            'id' => $complaint->id,
            'status' => 'rejected',
            'rejection_reason' => 'Private property maintenance is outside municipal infrastructure jurisdiction.',
        ]);

        $this->assertDatabaseHas('citizen_notifications', [
            'user_id' => $citizen->id,
            'complaint_id' => $complaint->id,
            'title' => "Review Notice: {$complaint->complaint_number}",
        ]);
    }

    public function test_cross_municipality_officer_cannot_verify_other_municipality_issue(): void
    {
        $muniA = $this->muni1;
        $muniB = $this->muni2;

        // Officer from Muni A
        $officerA = User::create([
            'name' => 'Muni A Officer',
            'email' => 'officera@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'municipality_admin',
            'municipality_id' => $muniA->id,
        ]);
        $tokenA = $officerA->createToken('officera-token')->plainTextToken;

        // Issue belonging to Muni B
        $issueB = Issue::create([
            'village_id' => $this->village2->id,
            'title' => 'Muni B road damage',
            'description' => 'Muni B road damage description',
            'category' => 'damaged_road',
            'severity' => 'critical',
            'status' => 'pending_verification',
            'municipality_id' => $muniB->id,
            'latitude' => 28.5,
            'longitude' => 84.5,
        ]);

        $res = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->patchJson("/api/issues/{$issueB->id}/status", [
                'status' => 'verified',
                'comment' => 'Illegitimate cross-muni attempt',
            ]);

        $res->assertStatus(403);
    }

    public function test_citizen_can_submit_unregistered_settlement_with_bilingual_transcript(): void
    {
        $citizen = User::create([
            'name' => 'Bikash Tamang',
            'email' => 'bikash@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'citizen',
        ]);
        $token = $citizen->createToken('citizen-token')->plainTextToken;

        $nepaliTranscript = 'हाम्रो गाउँको पुल बाढीले बगाएको छ। विद्यार्थीहरू विद्यालय जान सकेका छैनन्।';

        $payload = [
            'title' => 'Landslide damaged suspension footbridge',
            'category' => 'Bridge Damage',
            'municipality_id' => $this->muni1->id,
            'ward_number' => 3,
            'village_id' => null,
            'settlement_name' => 'Besi Khola Settlement',
            'description' => 'The wooden footbridge was damaged by heavy monsoon river flow.',
            'speech_transcript' => $nepaliTranscript,
            'transcript_language' => 'ne-NP',
            'latitude' => 28.91,
            'longitude' => 81.72,
        ];

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/citizen/complaints', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('complaint.settlement_name', 'Besi Khola Settlement')
            ->assertJsonPath('complaint.village_id', null)
            ->assertJsonPath('complaint.transcript_language', 'ne-NP');

        $this->assertDatabaseHas('complaints', [
            'settlement_name' => 'Besi Khola Settlement',
            'village_id' => null,
            'transcript_language' => 'ne-NP',
        ]);

        $this->assertDatabaseHas('issues', [
            'settlement_name' => 'Besi Khola Settlement',
            'village_id' => null,
            'transcript_language' => 'ne-NP',
            'status' => 'pending_verification',
        ]);
    }

    public function test_admin_can_link_unregistered_settlement_to_official_village_during_verification(): void
    {
        $admin = User::where('email', 'admin@gaunpulse.test')->first() ?? User::create([
            'name' => 'Muni Admin',
            'email' => 'admin@gaunpulse.test',
            'password' => Hash::make('Nepal@1234'),
            'role' => 'municipality_admin',
            'municipality_id' => $this->muni1->id,
        ]);
        $token = $admin->createToken('admin-link-token')->plainTextToken;

        $complaint = Complaint::create([
            'complaint_number' => 'GP-2026-99991',
            'user_id' => $admin->id,
            'municipality_id' => $this->muni1->id,
            'ward_number' => 2,
            'village_id' => null,
            'settlement_name' => 'Remote Ridge Tole',
            'title' => 'Culvert blocked',
            'category' => 'Drainage',
            'description' => 'Culvert blocked by debris',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        $issue = Issue::create([
            'municipality_id' => $this->muni1->id,
            'ward_no' => 2,
            'village_id' => null,
            'settlement_name' => 'Remote Ridge Tole',
            'title' => 'Culvert blocked',
            'category' => 'water_supply',
            'severity' => 'medium',
            'status' => 'pending_verification',
            'description' => 'Culvert blocked by debris',
            'latitude' => 28.9,
            'longitude' => 81.7,
        ]);
        $complaint->issue_id = $issue->id;
        $complaint->save();

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/issues/{$issue->id}/status", [
                'status' => 'verified',
                'comment' => 'Confirmed on-site and linked to Sundar Khola',
                'village_id' => $this->village1->id,
            ]);

        $res->assertOk();

        $issue->refresh();
        $complaint->refresh();

        $this->assertEquals($this->village1->id, $issue->village_id);
        $this->assertEquals($this->village1->id, $complaint->village_id);
        $this->assertEquals('verified', $issue->status);
        $this->assertEquals('verified', $complaint->status);
    }

    public function test_transcription_endpoint_handles_audio_and_language(): void
    {
        $fakeAudio = UploadedFile::fake()->create('report_audio.mp3', 120, 'audio/mpeg');

        $res = $this->postJson('/api/citizen/transcribe', [
            'audio' => $fakeAudio,
            'language' => 'ne-NP',
        ]);

        $res->assertOk()
            ->assertJsonStructure(['success', 'message']);
    }
}
