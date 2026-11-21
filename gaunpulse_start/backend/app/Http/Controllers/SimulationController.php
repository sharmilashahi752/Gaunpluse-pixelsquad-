<?php

namespace App\Http\Controllers;

use App\Models\Edge;
use App\Models\Issue;
use App\Models\Simulation;
use App\Models\User;
use App\Models\Village;
use App\Services\PriorityScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class SimulationController extends Controller
{
    /**
     * List recent simulations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Simulation::query()->latest();
        if ($request->filled('village_id')) {
            $query->where('village_id', $request->integer('village_id'));
        }
        $simulations = $query->limit(15)->get();
        return response()->json($simulations);
    }

    /**
     * Get a specific simulation by ID.
     */
    public function show(Simulation $simulation): JsonResponse
    {
        return response()->json([
            'id' => $simulation->id,
            'village_id' => $simulation->village_id,
            'blocked_edge_ids' => $simulation->blocked_edge_ids,
            'result' => $simulation->result,
            'created_at' => $simulation->created_at,
        ]);
    }

    /**
     * Run an impact simulation by querying the private Python FastAPI NetworkX service.
     */
    public function store(Request $request, PriorityScoringService $scoring): JsonResponse
    {
        $validated = $request->validate([
            'village_id' => ['required', 'exists:villages,id'],
            'blocked_edge_ids' => ['nullable', 'array'],
            'blocked_edge_id' => ['nullable'],
            'failed_edge_id' => ['nullable'],
        ]);

        $village = Village::with(['nodes', 'edges', 'facilities', 'settlements'])->findOrFail($validated['village_id']);

        // Collect blocked edge IDs from array or single inputs
        $blockedIds = $validated['blocked_edge_ids'] ?? [];
        if (!empty($validated['blocked_edge_id']) && !in_array($validated['blocked_edge_id'], $blockedIds)) {
            $blockedIds[] = $validated['blocked_edge_id'];
        }
        if (!empty($validated['failed_edge_id']) && !in_array($validated['failed_edge_id'], $blockedIds)) {
            $blockedIds[] = $validated['failed_edge_id'];
        }

        // Validate that requested edges belong to this village or match code/id
        $validVillageEdgeKeys = $village->edges->pluck('id')->map(fn($id) => (string)$id)->toArray();
        $validVillageEdgeCodes = $village->edges->pluck('edge_code')->filter()->map(fn($code) => (string)$code)->toArray();
        $allowedKeys = array_merge($validVillageEdgeKeys, $validVillageEdgeCodes);

        foreach ($blockedIds as $bid) {
            if (!in_array((string)$bid, $allowedKeys)) {
                return response()->json([
                    'message' => "Edge '{$bid}' does not exist or does not belong to village {$village->name}."
                ], 422);
            }
        }

        $payload = [
            'nodes' => $village->nodes->toArray(),
            'edges' => $village->edges->toArray(),
            'facilities' => $village->facilities->toArray(),
            'settlements' => $village->settlements->toArray(),
            'blocked_edge_ids' => $blockedIds,
            'failed_edge_id' => $blockedIds[0] ?? null,
        ];

        $simulatorUrl = rtrim(config('services.simulator.url', 'http://127.0.0.1:8001'), '/');

        try {
            $response = Http::timeout(12)->acceptJson()->post("{$simulatorUrl}/simulate", $payload);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'The impact simulator service is unavailable. Please verify the Python service is running on ' . $simulatorUrl,
                'error' => $e->getMessage(),
            ], 503);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'The impact simulator rejected the network data.',
                'details' => $response->json(),
            ], 502);
        }

        $simulationResult = $response->json();

        // Attribute simulation to authenticated user, or first user/null
        $userId = $request->user()?->id ?? User::first()?->id;

        $simulation = Simulation::create([
            'village_id' => $village->id,
            'user_id' => $userId,
            'blocked_edge_ids' => $blockedIds,
            'result' => $simulationResult,
        ]);

        // Score affected issues if priority service is active
        Issue::whereIn('edge_id', $blockedIds)->get()->each(function ($issue) use ($scoring, $simulation) {
            $scoring->score($issue, $simulation);
        });

        return response()->json([
            'id' => $simulation->id,
            'village_id' => $village->id,
            'blocked_edge_ids' => $blockedIds,
            'result' => $simulation->result,
            'created_at' => $simulation->created_at,
        ], 201);
    }

    /**
     * Compare two repair interventions ("What If We Fix This First?").
     */
    public function compare(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'village_id' => ['required', 'exists:villages,id'],
            'currently_blocked_edge_ids' => ['required', 'array'],
            'scenario_a' => ['required', 'array'],
            'scenario_a.name' => ['required', 'string'],
            'scenario_a.repair_edge_ids' => ['required', 'array'],
            'scenario_b' => ['required', 'array'],
            'scenario_b.name' => ['required', 'string'],
            'scenario_b.repair_edge_ids' => ['required', 'array'],
        ]);

        $village = Village::with(['nodes', 'edges', 'facilities', 'settlements'])->findOrFail($validated['village_id']);

        $payload = [
            'nodes' => $village->nodes->toArray(),
            'edges' => $village->edges->toArray(),
            'facilities' => $village->facilities->toArray(),
            'settlements' => $village->settlements->toArray(),
            'currently_blocked_edge_ids' => $validated['currently_blocked_edge_ids'],
            'scenario_a' => $validated['scenario_a'],
            'scenario_b' => $validated['scenario_b'],
        ];

        $simulatorUrl = rtrim(config('services.simulator.url', 'http://127.0.0.1:8001'), '/');

        try {
            $response = Http::timeout(12)->acceptJson()->post("{$simulatorUrl}/compare-repairs", $payload);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'The impact simulator service is unavailable for repair comparison.',
                'error' => $e->getMessage(),
            ], 503);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'The impact simulator rejected the repair comparison data.',
                'details' => $response->json(),
            ], 502);
        }

        return response()->json($response->json(), 200);
    }
}
