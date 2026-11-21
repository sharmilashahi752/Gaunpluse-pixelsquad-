<?php

namespace Tests\Feature;

use App\Models\ActionPlan;
use App\Models\Issue;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIAgentFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_ai_chat_endpoint_validates_and_proxies_to_intelligence_service(): void
    {
        Http::fake([
            '*/ai/chat' => Http::response([
                'reply' => 'NetworkX simulation calculated that 20 households in Settlement B are isolated.',
                'language' => 'en',
                'tools_called' => [
                    [
                        'tool' => 'simulate_infrastructure_failure',
                        'args' => ['edge_id' => 2, 'village_id' => 1],
                        'result' => ['affected_households' => 20],
                    ],
                ],
                'suggested_questions' => ['Draft an action plan'],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'What happens if Bridge B is blocked?',
            'village_id' => 1,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('language', 'en')
            ->assertJsonPath('tools_called.0.tool', 'simulate_infrastructure_failure')
            ->assertJsonPath('tools_called.0.result.affected_households', 20);
    }

    public function test_ai_insights_endpoint_returns_proactive_database_insights(): void
    {
        Http::fake([
            '*/ai/insights' => Http::response([
                'village_id' => 1,
                'village_name' => 'Bhotenamlang (Demo Village)',
                'frequent_category' => 'Damaged Bridge (7 reports logged)',
                'critical_issues_summary' => '3 critical disruptions logged',
                'simulation_risk_alert' => 'Single Point of Failure: Suspension Bridge B closure severs access for 20 households.',
                'recommended_action' => 'Dispatch municipal bridge inspector.',
                'database_backed' => true,
                'metrics' => [
                    'total_issues' => 7,
                    'critical_disruptions' => 3,
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/ai/insights?village_id=1');

        $response->assertStatus(200)
            ->assertJsonPath('database_backed', true)
            ->assertJsonPath('metrics.critical_disruptions', 3);
    }

    public function test_draft_action_plan_can_be_imported_into_database(): void
    {
        $issue = Issue::first();

        $response = $this->postJson('/api/action-plans', [
            'village_id' => $issue->village_id,
            'issue_id' => $issue->id,
            'title' => 'Draft: Rapid Intervention for Bridge B',
            'priority' => 'Critical',
            'responsible_team' => 'Rapid Response Bridge Engineering Unit',
            'ward' => 'Ward 4',
            'status' => 'pending',
            'progress_percentage' => 0,
            'target_completion_date' => now()->addDays(7)->toDateString(),
            'description' => 'Disruption on Bridge B suspension corridor.',
            'notes' => 'Imported from GaunPulse AI Agent draft.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Draft: Rapid Intervention for Bridge B')
            ->assertJsonPath('status', 'pending');

        $this->assertDatabaseHas('action_plans', [
            'title' => 'Draft: Rapid Intervention for Bridge B',
            'status' => 'pending',
        ]);
    }
}
