<?php

namespace Tests\Feature;

use App\Models\Edge;
use App\Models\Issue;
use App\Models\User;
use App\Models\Village;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GaunPulseApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_public_network_returns_demo_graph(): void
    {
        $village=Village::first();
        $this->getJson("/api/villages/{$village->id}/network")
            ->assertOk()->assertJsonCount(10,'nodes')->assertJsonCount(11,'edges')->assertJsonCount(3,'facilities');
    }

    public function test_citizen_can_submit_issue_and_validation_is_enforced(): void
    {
        $village=Village::first();
        $payload=['village_id'=>$village->id,'title'=>'Washed out roadside shoulder','category'=>'damaged_road','description'=>'The roadside shoulder has washed away along a busy walking route.','severity'=>'high','latitude'=>28.238,'longitude'=>83.994];
        $this->postJson('/api/issues',$payload)->assertCreated()->assertJsonPath('data.status','submitted');
        $this->postJson('/api/issues',[])->assertUnprocessable()->assertJsonValidationErrors(['village_id','title','category','description','severity','latitude','longitude']);
    }

    public function test_non_admin_cannot_update_status_but_admin_can(): void
    {
        $issue=Issue::first();
        Sanctum::actingAs(User::factory()->create(['role'=>'citizen']));
        $this->patchJson("/api/admin/issues/{$issue->id}/status",['status'=>'verified'])->assertForbidden();
        Sanctum::actingAs(User::where('role','admin')->first());
        $this->patchJson("/api/admin/issues/{$issue->id}/status",['status'=>'in_progress','comment'=>'Crew assigned'])->assertOk()->assertJsonPath('data.status','in_progress');
        $this->assertDatabaseHas('issue_updates',['issue_id'=>$issue->id,'new_status'=>'in_progress']);
    }

    public function test_admin_simulation_persists_actual_service_response(): void
    {
        $edge=Edge::where('type','bridge')->first();
        Http::fake(['*/simulate'=>Http::response(['blocked_edges'=>[$edge->toArray()],'affected_settlements'=>[['name'=>'Besi Tole']],'affected_settlement_count'=>1,'newly_unreachable_by_service'=>['health_post'=>1],'affected_population'=>265,'population_evidence_complete'=>true,'explanation'=>'Bridge loss isolates Besi Tole.'],200)]);
        Sanctum::actingAs(User::where('role','admin')->first());
        $this->postJson('/api/admin/simulations',['village_id'=>$edge->village_id,'blocked_edge_ids'=>[$edge->id]])
            ->assertCreated()->assertJsonPath('result.affected_population',265);
        $this->assertDatabaseCount('simulations',1);
        $this->assertDatabaseHas('priority_scores',['issue_id'=>Issue::where('edge_id',$edge->id)->first()->id]);
    }

    public function test_priorities_disclose_incomplete_evidence_without_simulation(): void
    {
        Sanctum::actingAs(User::where('role','admin')->first());
        $this->getJson('/api/admin/priorities')->assertOk()->assertJsonPath('data.0.label','Incomplete evidence')->assertJsonPath('weights.severity',0.3);
    }
}
