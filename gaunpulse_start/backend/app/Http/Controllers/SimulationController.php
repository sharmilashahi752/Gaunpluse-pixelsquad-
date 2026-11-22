<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Simulation;
use App\Models\User;
use App\Models\Village;
use App\Services\PriorityScoringService;
use App\Services\SimulationNetworkService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class SimulationController extends Controller
{
    public function __construct(private SimulationNetworkService $networks) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'village_id' => ['nullable', 'integer', 'exists:villages,id'],
        ]);

        $query = Simulation::query()->latest('id');

        $user = $request->user('sanctum') ?? $request->user();
        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            $query->whereHas('village', fn($q) => $q->where('municipality_id', (string) $user->municipality_id));
        }

        if (isset($validated['village_id'])) {
            $query->where('village_id', $validated['village_id']);
        }

        $simulations = $query->limit(25)->get();
        $currentVersions = Village::query()
            ->whereIn('id', $simulations->pluck('village_id')->unique())
            ->with(['nodes', 'edges'])
            ->get()
            ->mapWithKeys(fn (Village $village): array => [
                $village->id => $this->networks->graphVersion($village),
            ]);

        return response()->json($simulations->map(function (Simulation $simulation) use ($currentVersions): array {
            return $this->historyResponse(
                $simulation,
                $currentVersions->get($simulation->village_id),
            );
        }));
    }

    public function show(Simulation $simulation): JsonResponse
    {
        $village = Village::with(['nodes', 'edges'])->findOrFail($simulation->village_id);

        $user = request()->user('sanctum') ?? request()->user();
        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            abort_unless((string) $village->municipality_id === (string) $user->municipality_id, 403, 'Cross-municipality simulation access denied.');
        }

        return response()->json($this->historyResponse(
            $simulation,
            $this->networks->graphVersion($village),
        ));
    }

    public function store(Request $request, PriorityScoringService $scoring): JsonResponse
    {
        $validated = $request->validate([
            'village_id' => ['required', 'integer', 'exists:villages,id'],
            'blocked_edge_ids' => ['required', 'array', 'min:1'],
            'blocked_edge_ids.*' => ['required', 'integer', 'distinct'],
            'scenario_type' => [
                'nullable',
                'string',
                Rule::in(['complete_closure', 'road_closure', 'bridge_closure', 'monsoon_flood', 'landslide', 'structural_closure']),
            ],
        ]);

        $village = $this->loadVillage((int) $validated['village_id']);

        $user = $request->user('sanctum') ?? $request->user();
        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            abort_unless((string) $village->municipality_id === (string) $user->municipality_id, 403, 'Cross-municipality simulation denied.');
        }

        $readiness = $this->networks->readiness($village);
        if (! $readiness['can_simulate']) {
            return response()->json([
                'message' => 'This village network is not ready for simulation.',
                'readiness' => $readiness,
            ], 422);
        }

        $blockedIds = collect($validated['blocked_edge_ids'])->map(fn ($id): int => (int) $id)->values()->all();
        foreach ($blockedIds as $blockedId) {
            if (! $this->networks->edgeBelongsToVillage($village, $blockedId)) {
                return response()->json([
                    'message' => "Infrastructure edge '{$blockedId}' does not belong to village {$village->name}.",
                ], 422);
            }
        }

        $scenarioType = $validated['scenario_type'] ?? 'complete_closure';
        $payload = $this->networks->simulationPayload($village, [
            'blocked_edge_ids' => $blockedIds,
            'failed_edge_id' => $blockedIds[0],
            'scenario_type' => $scenarioType,
        ]);

        $response = $this->postToSimulator('/simulate', $payload);
        if ($response instanceof JsonResponse) {
            return $response;
        }

        $simulationResult = $response->json();
        if (! is_array($simulationResult)
            || ! array_key_exists('affected_households', $simulationResult)
            || ! isset($simulationResult['access_comparisons'])) {
            return response()->json([
                'message' => 'The impact simulator returned an invalid response.',
            ], 502);
        }

        $simulation = Simulation::create([
            'village_id' => $village->id,
            'user_id' => $request->user()?->id ?? User::query()->value('id'),
            'failed_edge_id' => $blockedIds[0],
            'scenario_type' => $scenarioType,
            'blocked_edge_ids' => $blockedIds,
            'graph_version' => $readiness['graph_version'],
            'verification_level' => $readiness['verification_level'],
            'routing_metric' => $readiness['routing_metric'],
            'result' => $simulationResult,
        ]);

        Issue::query()
            ->where('village_id', $village->id)
            ->whereIn('edge_id', $blockedIds)
            ->get()
            ->each(fn (Issue $issue) => $scoring->score($issue, $simulation));

        return response()->json($this->historyResponse(
            $simulation,
            $readiness['graph_version'],
        ), 201);
    }

    public function compare(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'village_id' => ['required', 'integer', 'exists:villages,id'],
            'currently_blocked_edge_ids' => ['required', 'array', 'min:2'],
            'currently_blocked_edge_ids.*' => ['required', 'integer', 'distinct'],
            'scenario_a' => ['required', 'array'],
            'scenario_a.name' => ['required', 'string', 'max:255'],
            'scenario_a.repair_edge_ids' => ['required', 'array', 'min:1'],
            'scenario_a.repair_edge_ids.*' => ['required', 'integer', 'distinct'],
            'scenario_b' => ['required', 'array'],
            'scenario_b.name' => ['required', 'string', 'max:255'],
            'scenario_b.repair_edge_ids' => ['required', 'array', 'min:1'],
            'scenario_b.repair_edge_ids.*' => ['required', 'integer', 'distinct'],
        ]);

        $village = $this->loadVillage((int) $validated['village_id']);

        $user = $request->user('sanctum') ?? $request->user();
        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            abort_unless((string) $village->municipality_id === (string) $user->municipality_id, 403, 'Cross-municipality simulation denied.');
        }

        $readiness = $this->networks->readiness($village);
        if (! $readiness['can_simulate']) {
            return response()->json([
                'message' => 'This village network is not ready for repair comparison.',
                'readiness' => $readiness,
            ], 422);
        }

        $allEdgeIds = collect($validated['currently_blocked_edge_ids'])
            ->merge($validated['scenario_a']['repair_edge_ids'])
            ->merge($validated['scenario_b']['repair_edge_ids'])
            ->unique();
        foreach ($allEdgeIds as $edgeId) {
            if (! $this->networks->edgeBelongsToVillage($village, $edgeId)) {
                return response()->json([
                    'message' => "Infrastructure edge '{$edgeId}' does not belong to village {$village->name}.",
                ], 422);
            }
        }

        $currentBlocked = collect($validated['currently_blocked_edge_ids'])->map(fn ($id): int => (int) $id);
        foreach (['scenario_a', 'scenario_b'] as $scenarioKey) {
            $invalidRepair = collect($validated[$scenarioKey]['repair_edge_ids'])
                ->first(fn ($edgeId): bool => ! $currentBlocked->contains((int) $edgeId));
            if ($invalidRepair !== null) {
                return response()->json([
                    'message' => "Repair edge '{$invalidRepair}' is not included in the current damaged baseline.",
                ], 422);
            }
        }

        $payload = $this->networks->simulationPayload($village, [
            'currently_blocked_edge_ids' => $currentBlocked->values()->all(),
            'scenario_a' => $validated['scenario_a'],
            'scenario_b' => $validated['scenario_b'],
        ]);
        $response = $this->postToSimulator('/compare-repairs', $payload);
        if ($response instanceof JsonResponse) {
            return $response;
        }

        return response()->json(array_merge($response->json(), [
            'village_id' => $village->id,
            'graph_version' => $readiness['graph_version'],
            'verification_level' => $readiness['verification_level'],
            'routing_metric' => $readiness['routing_metric'],
        ]));
    }

    private function loadVillage(int $villageId): Village
    {
        return Village::with([
            'nodes',
            'edges.source',
            'edges.target',
            'facilities.node',
            'settlements',
        ])->findOrFail($villageId);
    }

    private function postToSimulator(string $path, array $payload): JsonResponse|Response
    {
        $simulatorUrl = rtrim((string) config('services.simulator.url', 'http://127.0.0.1:8001'), '/');

        try {
            $response = Http::connectTimeout(3)
                ->timeout(20)
                ->acceptJson()
                ->post($simulatorUrl.$path, $payload);
        } catch (ConnectionException $exception) {
            return response()->json([
                'message' => 'The GaunPulse impact simulator service is unavailable.',
                'error' => $exception->getMessage(),
            ], 503);
        }

        if (! $response->successful()) {
            return response()->json([
                'message' => 'The impact simulator rejected the selected village graph.',
                'details' => $response->json(),
            ], $response->unprocessableEntity() ? 422 : 502);
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    private function historyResponse(Simulation $simulation, ?string $currentGraphVersion): array
    {
        return [
            'id' => $simulation->id,
            'village_id' => $simulation->village_id,
            'failed_edge_id' => $simulation->failed_edge_id,
            'scenario_type' => $simulation->scenario_type,
            'blocked_edge_ids' => $simulation->blocked_edge_ids,
            'graph_version' => $simulation->graph_version,
            'current_graph_version' => $currentGraphVersion,
            'is_graph_outdated' => $simulation->graph_version !== null
                && $currentGraphVersion !== null
                && $simulation->graph_version !== $currentGraphVersion,
            'verification_level' => $simulation->verification_level,
            'routing_metric' => $simulation->routing_metric,
            'result' => $simulation->result,
            'created_at' => $simulation->created_at,
        ];
    }
}
