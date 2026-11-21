<?php

namespace Tests\Feature;

use App\Models\Edge;
use App\Models\Simulation;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SimulationFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_can_run_simulation_and_persist_result(): void
    {
        $village = Village::first();
        $edge = Edge::first();

        Http::fake([
            '*/simulate' => Http::response([
                'failed_edge_id' => $edge->id,
                'blocked_edge_ids' => [(string)$edge->id],
                'affected_households' => 25,
                'newly_disconnected_households' => 25,
                'already_disconnected_households' => 0,
                'isolated_settlements' => [['settlement' => 'Besi Tole', 'households' => 25]],
                'detour_settlements' => [],
                'essential_facilities_affected' => [['facility' => 'Sundar Community Health Post']],
                'access_comparisons' => [],
                'summary_explanation' => 'Test simulation summary',
                'data_quality' => 'fictional_demo',
                'calculation_timestamp' => now()->toIso8601String(),
            ], 200),
        ]);

        $response = $this->postJson('/api/simulations', [
            'village_id' => $village->id,
            'blocked_edge_ids' => [$edge->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('village_id', $village->id)
            ->assertJsonPath('result.affected_households', 25);

        $this->assertDatabaseHas('simulations', [
            'village_id' => $village->id,
        ]);
    }

    public function test_simulation_handles_python_service_unavailability(): void
    {
        $village = Village::first();
        $edge = Edge::first();

        Http::fake([
            '*/simulate' => fn () => throw new \Exception('Connection refused to Python service'),
        ]);

        $response = $this->postJson('/api/simulations', [
            'village_id' => $village->id,
            'blocked_edge_ids' => [$edge->id],
        ]);

        $response->assertStatus(503)
            ->assertJsonStructure(['message', 'error']);
    }

    public function test_simulation_rejects_edge_from_different_village(): void
    {
        $village = Village::first();

        $response = $this->postJson('/api/simulations', [
            'village_id' => $village->id,
            'blocked_edge_ids' => [99999],
        ]);

        $response->assertStatus(422);
    }

    public function test_can_compare_repair_scenarios(): void
    {
        $village = Village::first();
        $edgeA = Edge::first();
        $edgeB = Edge::skip(1)->first();

        Http::fake([
            '*/compare-repairs' => Http::response([
                'baseline_blocked_edges' => [$edgeA->id, $edgeB->id],
                'scenario_a' => [
                    'scenario_name' => 'Repair Bridge',
                    'repaired_edge_ids' => [$edgeA->id],
                    'households_regaining_access' => 50,
                    'facilities_restored' => 1,
                    'travel_time_improvement_minutes' => 25.0,
                    'remaining_blocked_edges' => [$edgeB->id],
                    'remaining_affected_households' => 10,
                    'unreachable_routes_count' => 0,
                ],
                'scenario_b' => [
                    'scenario_name' => 'Repair Road',
                    'repaired_edge_ids' => [$edgeB->id],
                    'households_regaining_access' => 20,
                    'facilities_restored' => 0,
                    'travel_time_improvement_minutes' => 10.0,
                    'remaining_blocked_edges' => [$edgeA->id],
                    'remaining_affected_households' => 40,
                    'unreachable_routes_count' => 1,
                ],
                'comparison_summary' => "'Repair Bridge' restores access for 30 more households than 'Repair Road'.",
                'cost_status' => 'unknown - do not rank on cost without verified estimates',
                'recommendation_note' => 'Officer decision needed.',
                'calculation_timestamp' => now()->toIso8601String(),
            ], 200),
        ]);

        $response = $this->postJson('/api/simulations/compare', [
            'village_id' => $village->id,
            'currently_blocked_edge_ids' => [$edgeA->id, $edgeB->id],
            'scenario_a' => [
                'name' => 'Repair Bridge',
                'repair_edge_ids' => [$edgeA->id],
            ],
            'scenario_b' => [
                'name' => 'Repair Road',
                'repair_edge_ids' => [$edgeB->id],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('scenario_a.households_regaining_access', 50)
            ->assertJsonPath('scenario_b.households_regaining_access', 20)
            ->assertJsonStructure(['comparison_summary', 'cost_status', 'recommendation_note']);
    }

    public function test_can_get_simulation_by_id(): void
    {
        $village = Village::first();
        $simulation = Simulation::create([
            'village_id' => $village->id,
            'user_id' => null,
            'blocked_edge_ids' => [1],
            'result' => ['affected_households' => 10],
        ]);

        $response = $this->getJson("/api/simulations/{$simulation->id}");

        $response->assertOk()
            ->assertJsonPath('id', $simulation->id)
            ->assertJsonPath('result.affected_households', 10);
    }
}
