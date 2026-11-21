<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Http\Requests\RunSimulationRequest;
use App\Models\Issue;
use App\Models\Simulation;
use App\Models\Village;
use App\Services\PriorityScoringService;
use Illuminate\Support\Facades\Http;
class SimulationController extends Controller
{
    public function store(RunSimulationRequest $request, PriorityScoringService $scoring)
    {
        $village=Village::with(['nodes','edges','facilities','settlements'])->findOrFail($request->integer('village_id'));
        $payload=['nodes'=>$village->nodes->toArray(),'edges'=>$village->edges->toArray(),'facilities'=>$village->facilities->toArray(),'settlements'=>$village->settlements->toArray(),'blocked_edge_ids'=>$request->input('blocked_edge_ids')];
        try { $response=Http::timeout(10)->acceptJson()->post(config('services.simulator.url').'/simulate',$payload); }
        catch(\Throwable $e) { return response()->json(['message'=>'The impact simulator is unavailable. Start the FastAPI service and try again.'],503); }
        if(!$response->successful()) return response()->json(['message'=>'The impact simulator rejected the network data.','details'=>$response->json()],502);
        $simulation=Simulation::create(['village_id'=>$village->id,'user_id'=>$request->user()->id,'blocked_edge_ids'=>$request->input('blocked_edge_ids'),'result'=>$response->json()]);
        Issue::whereIn('edge_id',$request->input('blocked_edge_ids'))->get()->each(fn($issue)=>$scoring->score($issue,$simulation));
        return response()->json(['id'=>$simulation->id,'result'=>$simulation->result],201);
    }
}
