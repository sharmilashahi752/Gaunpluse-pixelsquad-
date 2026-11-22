<?php

namespace Tests\Feature;

use App\Models\Edge;
use App\Models\Issue;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class IssueSubmissionFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');
    }

    public function test_can_submit_issue_without_photo(): void
    {
        $village = Village::first();
        $payload = [
            'village_id' => $village->id,
            'title' => 'Damaged road surface after storm',
            'category' => 'damaged_road',
            'description' => 'Heavy rainfall caused major asphalt crater and embankment washout',
            'severity' => 'high',
            'latitude' => 27.8635,
            'longitude' => 85.5815,
        ];

        $res = $this->postJson('/api/issues', $payload);

        $res->assertCreated()
            ->assertJsonPath('data.title', 'Damaged road surface after storm')
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.village.id', $village->id);

        $this->assertDatabaseHas('issues', [
            'title' => 'Damaged road surface after storm',
            'village_id' => $village->id,
            'status' => 'submitted',
        ]);
    }

    public function test_can_submit_issue_with_photo_upload(): void
    {
        $village = Village::first();
        $file = UploadedFile::fake()->image('bridge_damage.jpg', 800, 600)->size(1200);

        $payload = [
            'village_id' => $village->id,
            'title' => 'Suspension bridge anchor scour',
            'category' => 'damaged_bridge',
            'description' => 'Deadman anchor block undermined by flood river torrents isolating ward',
            'severity' => 'critical',
            'latitude' => 27.8640,
            'longitude' => 85.5820,
            'photo' => $file,
        ];

        $res = $this->post('/api/issues', $payload, ['Accept' => 'application/json']);

        $res->assertCreated();
        $issueData = $res->json('data');
        $this->assertNotEmpty($issueData['photo_url']);
        $this->assertStringContainsString('storage/issues/', $issueData['photo_url']);

        $issue = Issue::find($issueData['id']);
        $this->assertNotNull($issue->photo_path);
        Storage::disk('public')->assertExists($issue->photo_path);
    }

    public function test_validation_fails_on_short_title_and_description(): void
    {
        $village = Village::first();
        $payload = [
            'village_id' => $village->id,
            'title' => 'Bad', // < 5 chars
            'category' => 'damaged_road',
            'description' => 'Short', // < 15 chars
            'severity' => 'high',
            'latitude' => 27.8635,
            'longitude' => 85.5815,
        ];

        $res = $this->postJson('/api/issues', $payload);

        $res->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description']);
    }

    public function test_validation_fails_when_edge_belongs_to_different_village(): void
    {
        $village1 = Village::first();
        $village2 = Village::create([
            'name' => 'Second Test Village',
            'province' => 'Karnali Province',
            'district' => 'Dailekh',
            'municipality' => 'Mahabu',
            'ward_no' => '1',
            'center_lat' => 28.1234,
            'center_lng' => 84.5678,
            'status' => 'active',
        ]);

        $edgeInVillage1 = Edge::where('village_id', $village1->id)->first();

        // Attempt to associate edge from Village 1 with Village 2
        $payload = [
            'village_id' => $village2->id,
            'edge_id' => $edgeInVillage1->id,
            'title' => 'Cross village asset mismatch test',
            'category' => 'damaged_bridge',
            'description' => 'Valid description detailing infrastructure disruption on corridor',
            'severity' => 'critical',
            'latitude' => 28.1234,
            'longitude' => 84.5678,
        ];

        $res = $this->postJson('/api/issues', $payload);

        $res->assertUnprocessable()
            ->assertJsonValidationErrors(['edge_id']);
    }

    public function test_validation_fails_on_oversized_photo(): void
    {
        $village = Village::first();
        // 6MB photo (exceeds 5MB / 5120KB limit)
        $file = UploadedFile::fake()->create('oversized_photo.jpg', 6000, 'image/jpeg');

        $payload = [
            'village_id' => $village->id,
            'title' => 'Oversized photo upload test',
            'category' => 'damaged_road',
            'description' => 'Valid description detailing infrastructure disruption on corridor',
            'severity' => 'high',
            'latitude' => 27.8635,
            'longitude' => 85.5815,
            'photo' => $file,
        ];

        $res = $this->post('/api/issues', $payload, ['Accept' => 'application/json']);

        $res->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }
}
