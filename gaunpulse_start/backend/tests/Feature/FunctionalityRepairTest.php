<?php

namespace Tests\Feature;

use App\Models\ActionPlan;
use App\Models\CommunityFeedback;
use App\Models\Issue;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FunctionalityRepairTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_can_retrieve_real_dashboard_stats(): void
    {
        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'monitored_villages',
                'active_issues',
                'critical_disruptions',
                'affected_households',
                'resolved_issues',
                'total_action_plans',
                'action_plans_in_progress',
                'community_voices_count',
            ]);
    }

    public function test_can_create_and_update_issue_status(): void
    {
        $village = Village::first();

        $createResponse = $this->postJson('/api/issues', [
            'village_id' => $village->id,
            'title' => 'Landslide blocking trail to Khola Tol',
            'category' => 'damaged_road',
            'description' => 'Heavy monsoon rain caused a 15-meter landslide across the pedestrian trail.',
            'severity' => 'critical',
            'latitude' => 27.8635,
            'longitude' => 85.5815,
        ]);

        $createResponse->assertStatus(201);
        $issueId = $createResponse->json('data.id') ?? $createResponse->json('id');
        $this->assertNotNull($issueId);

        // Update status
        $updateResponse = $this->patchJson("/api/issues/{$issueId}/status", [
            'status' => 'verified',
            'comment' => 'Verified on site by ward engineer.',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('issues', [
            'id' => $issueId,
            'status' => 'verified',
        ]);
    }

    public function test_action_plan_lifecycle(): void
    {
        $village = Village::first();

        // 1. Create Action Plan
        $createResponse = $this->postJson('/api/action-plans', [
            'village_id' => $village->id,
            'title' => 'Emergency landslide clearing team',
            'description' => 'Deploy municipal excavator and 8 laborers to clear rockfall.',
            'ward' => 'Ward 4',
            'priority' => 'Critical',
            'responsible_team' => 'Rapid Response Unit',
            'start_date' => '2026-11-22',
            'target_completion_date' => '2026-11-26',
            'status' => 'in_progress',
            'progress_percentage' => 15,
            'notes' => 'Mobilized fuel and safety barriers.',
        ]);

        $createResponse->assertStatus(201);
        $planId = $createResponse->json('id');

        // 2. Update Progress
        $progressResponse = $this->patchJson("/api/action-plans/{$planId}/progress", [
            'progress_percentage' => 100,
            'notes' => 'Clearing completed and trail reopened.',
        ]);

        $progressResponse->assertStatus(200);
        $this->assertEquals('completed', $progressResponse->json('status'));
        $this->assertEquals(100, $progressResponse->json('progress_percentage'));

        // 3. Delete Plan
        $deleteResponse = $this->deleteJson("/api/action-plans/{$planId}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('action_plans', ['id' => $planId]);
    }

    public function test_community_feedback_lifecycle(): void
    {
        $village = Village::first();

        $createResponse = $this->postJson('/api/feedback', [
            'village_id' => $village->id,
            'resident_name' => 'Sita Gurung',
            'ward' => 'Ward 4 resident',
            'message' => 'The trail after the river crossing is muddy and slippery.',
            'tag' => 'Safety',
        ]);

        $createResponse->assertStatus(201);
        $feedbackId = $createResponse->json('id');

        $ackResponse = $this->patchJson("/api/feedback/{$feedbackId}/acknowledge");
        $ackResponse->assertStatus(200);
        $this->assertEquals('acknowledged', $ackResponse->json('status'));
    }
}
