<?php

namespace Tests\Feature;

use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    public function test_reports_overview_returns_valid_kpis(): void
    {
        $response = $this->getJson('/api/reports/overview');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'generated_at',
                'timezone',
                'kpis' => [
                    'resolution_rate' => ['value', 'formatted'],
                    'median_verification' => ['formatted'],
                    'community_reports' => ['total'],
                    'active_issues' => ['count', 'critical_count'],
                ],
                'infrastructure' => [
                    'total_nodes',
                    'total_edges',
                    'roads',
                    'bridges',
                    'schools',
                    'health_facilities',
                ],
                'action_plans' => [
                    'total',
                    'in_progress',
                ],
                'simulations' => [
                    'is_simulated',
                    'disclaimer',
                ],
            ]);
    }

    public function test_reports_categories_returns_breakdown(): void
    {
        $response = $this->getJson('/api/reports/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_issues',
                'categories',
            ]);
    }

    public function test_reports_trends_returns_timeline(): void
    {
        $response = $this->getJson('/api/reports/trends?range=6m');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'months_count',
                'timeline' => [
                    '*' => ['month_key', 'label', 'submitted', 'resolved'],
                ],
            ]);
    }

    public function test_reports_csv_export_returns_file(): void
    {
        $response = $this->get('/api/reports/export?format=csv&type=issues');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_reports_ai_insights_returns_synthesis(): void
    {
        $response = $this->postJson('/api/reports/ai-insights', []);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'executive_summary',
                'critical_bottlenecks',
                'action_priorities',
                'metrics_reviewed',
            ]);
    }
}
