<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Village;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    /**
     * Dispatch user query to the Python AI Agent service with authorized village network context.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1500'],
            'village_id' => ['nullable', 'integer', 'exists:villages,id'],
            'language' => ['nullable', 'string', 'in:en,ne'],
            'history' => ['nullable', 'array'],
        ]);

        $villageId = $validated['village_id'] ?? 1;

        // Enforce user village authorization if restricted
        $user = $request->user();
        if ($user && isset($user->village_id) && $user->village_id && $user->village_id != $villageId) {
            return response()->json([
                'message' => 'Unauthorized access to the requested village data.',
            ], 403);
        }

        // Fetch village infrastructure network records from MySQL
        $village = Village::with(['nodes', 'edges.source', 'edges.target', 'facilities', 'settlements'])->find($villageId);

        // Fetch registered issues, stripping sensitive personal citizen info for security
        $issues = Issue::with('edge')->where('village_id', $villageId)->get()->map(function ($issue) {
            return [
                'id' => $issue->id,
                'tracking_code' => $issue->tracking_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'severity' => $issue->severity,
                'status' => $issue->status,
                'description' => $issue->description,
                'edge_id' => $issue->edge_id,
                'edge_name' => $issue->edge?->name,
                'created_at' => $issue->created_at?->toIso8601String(),
            ];
        });

        $payload = [
            'message' => $validated['message'],
            'village_id' => $villageId,
            'language' => $validated['language'] ?? null,
            'conversation_history' => $validated['history'] ?? [],
            'network_data' => $village ? [
                'village' => $village->only(['id', 'name', 'ward_number', 'district', 'province']),
                'nodes' => $village->nodes->toArray(),
                'edges' => $village->edges->toArray(),
                'facilities' => $village->facilities->toArray(),
                'settlements' => $village->settlements->toArray(),
            ] : null,
            'issues_data' => $issues->toArray(),
        ];

        $simulatorUrl = rtrim(config('services.simulator.url', 'http://127.0.0.1:8001'), '/');

        try {
            $response = Http::timeout(15)->acceptJson()->post("{$simulatorUrl}/ai/chat", $payload);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'The GaunPulse AI Intelligence service is currently unreachable.',
                'error' => $e->getMessage(),
            ], 503);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'AI agent failed to synthesize a response.',
                'details' => $response->json(),
            ], 502);
        }

        return response()->json($response->json());
    }

    /**
     * Get live database-backed AI insights for the municipal dashboard.
     */
    public function insights(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'village_id' => ['nullable', 'integer', 'exists:villages,id'],
        ]);

        $villageId = $validated['village_id'] ?? 1;

        // Fetch registered issues from MySQL
        $issues = Issue::where('village_id', $villageId)->get()->map(function ($issue) {
            return [
                'id' => $issue->id,
                'tracking_code' => $issue->tracking_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'severity' => $issue->severity,
                'status' => $issue->status,
                'description' => $issue->description,
            ];
        });

        $simulatorUrl = rtrim(config('services.simulator.url', 'http://127.0.0.1:8001'), '/');

        try {
            $response = Http::timeout(10)->acceptJson()->post("{$simulatorUrl}/ai/insights", [
                'village_id' => $villageId,
                'issues_data' => $issues->toArray(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'AI insights service is unavailable.',
                'error' => $e->getMessage(),
            ], 503);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Could not retrieve live insights.',
                'details' => $response->json(),
            ], 502);
        }

        return response()->json($response->json());
    }
}
