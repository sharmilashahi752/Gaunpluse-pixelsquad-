<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Edge;
use App\Models\Facility;
use App\Models\Node;
use App\Models\SettlementGroup;
use App\Models\Village;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class VillageController extends Controller
{
    /**
     * List all villages with network entity counts and municipality scoping.
     */
    public function index(Request $request)
    {
        $query = Village::query()
            ->withCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']);

        // Multi-municipality scoping
        if ($request->filled('municipality')) {
            $muni = $request->query('municipality');
            $query->where(function ($q) use ($muni) {
                $q->where('municipality', $muni)
                  ->orWhere('municipality_id', $muni)
                  ->orWhere('district', $muni);
            });
        }

        // Status filter (e.g. 'active', 'draft', 'all')
        if ($request->filled('status') && $request->query('status') !== 'all') {
            if (Schema::hasColumn('villages', 'status')) {
                $query->where('status', $request->query('status'));
            }
        }

        return $query->latest('id')->get();
    }

    /**
     * Retrieve single village record.
     */
    public function show(Village $village)
    {
        return response()->json($village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']));
    }

    /**
     * Create a new village record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'local_name' => 'nullable|string|max:255',
            'ward_no' => 'nullable|string|max:50',
            'municipality' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'center_lat' => 'nullable|numeric|between:-90,90',
            'center_lng' => 'nullable|numeric|between:-180,180',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'admin_code' => 'nullable|string|max:100',
            'data_source' => 'nullable|string|max:255',
            'reference_year' => 'nullable|integer',
            'status' => 'nullable|string|in:draft,active,archived',
        ]);

        // Validate administrative hierarchy integrity (prevent e.g. Marpha Mustang in Helambu Sindhupalchok)
        $hierarchy = \App\Services\NepalLocationService::validateHierarchy(
            $validated['province'],
            $validated['district'],
            $validated['municipality'],
            $validated['ward_no'] ?? null
        );

        if (!$hierarchy['valid']) {
            return response()->json([
                'message' => 'Invalid administrative hierarchy: ' . $hierarchy['error'],
                'suggestion' => $hierarchy['suggestion'] ?? null,
            ], 422);
        }

        $lat = $validated['center_lat'] ?? $validated['latitude'] ?? 27.8635;
        $lng = $validated['center_lng'] ?? $validated['longitude'] ?? 85.5815;

        $attrs = [
            'name' => $validated['name'],
            'municipality' => $validated['municipality'],
            'district' => $validated['district'],
            'province' => $validated['province'],
        ];

        if (Schema::hasColumn('villages', 'local_name')) $attrs['local_name'] = $validated['local_name'] ?? null;
        if (Schema::hasColumn('villages', 'ward_no')) $attrs['ward_no'] = $validated['ward_no'] ?? '1';
        if (Schema::hasColumn('villages', 'description')) $attrs['description'] = $validated['description'] ?? null;
        if (Schema::hasColumn('villages', 'center_lat')) {
            $attrs['center_lat'] = $lat;
            $attrs['center_lng'] = $lng;
        }
        if (Schema::hasColumn('villages', 'latitude')) {
            $attrs['latitude'] = $lat;
            $attrs['longitude'] = $lng;
        }
        if (Schema::hasColumn('villages', 'is_demo')) $attrs['is_demo'] = false;
        if (Schema::hasColumn('villages', 'status')) $attrs['status'] = $validated['status'] ?? 'active';
        if (Schema::hasColumn('villages', 'admin_code')) {
            $attrs['admin_code'] = $validated['admin_code'] ?? ('NP-' . Str::slug($validated['district'] . '-' . $validated['municipality'], '-') . '-W' . ($validated['ward_no'] ?? '1'));
        }
        if (Schema::hasColumn('villages', 'data_source')) $attrs['data_source'] = $validated['data_source'] ?? 'Municipal Field Survey';
        if (Schema::hasColumn('villages', 'reference_year')) $attrs['reference_year'] = $validated['reference_year'] ?? (int) date('Y');

        $village = Village::create($attrs);

        // Audit log
        AuditLog::create([
            'village_id' => $village->id,
            'action_type' => 'onboarded',
            'entity_type' => 'village',
            'entity_id' => $village->id,
            'performed_by' => 'Municipal Planner',
            'summary' => "Village {$village->name} registered in {$village->municipality}.",
            'details' => ['status' => $village->status, 'ward' => $village->ward_no],
        ]);

        return response()->json($village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']), 201);
    }

    /**
     * Save or update an Onboarding Wizard draft (Phase 3).
     */
    public function storeWizardDraft(Request $request)
    {
        $validated = $request->validate([
            'draft_id' => 'nullable|exists:villages,id',
            'onboarding_step' => 'required|integer|between:1,5',
            'name' => 'required|string|max:255',
            'local_name' => 'nullable|string|max:255',
            'ward_no' => 'nullable|string|max:50',
            'municipality' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'center_lat' => 'nullable|numeric|between:-90,90',
            'center_lng' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'boundary_geojson' => 'nullable|string',
            'data_source' => 'nullable|string|max:255',
            'reference_year' => 'nullable|integer',
            'status' => 'nullable|string|in:draft,active',
            'nodes' => 'nullable|array',
            'edges' => 'nullable|array',
            'facilities' => 'nullable|array',
            'settlements' => 'nullable|array',
        ]);

        $lat = $validated['center_lat'] ?? 27.8635;
        $lng = $validated['center_lng'] ?? 85.5815;

        $attrs = [
            'name' => $validated['name'],
            'municipality' => $validated['municipality'],
            'district' => $validated['district'],
            'province' => $validated['province'],
        ];

        if (Schema::hasColumn('villages', 'local_name')) $attrs['local_name'] = $validated['local_name'] ?? null;
        if (Schema::hasColumn('villages', 'ward_no')) $attrs['ward_no'] = $validated['ward_no'] ?? '1';
        if (Schema::hasColumn('villages', 'description')) $attrs['description'] = $validated['description'] ?? null;
        if (Schema::hasColumn('villages', 'center_lat')) {
            $attrs['center_lat'] = $lat;
            $attrs['center_lng'] = $lng;
        }
        if (Schema::hasColumn('villages', 'latitude')) {
            $attrs['latitude'] = $lat;
            $attrs['longitude'] = $lng;
        }
        if (Schema::hasColumn('villages', 'status')) $attrs['status'] = $validated['status'] ?? 'draft';
        if (Schema::hasColumn('villages', 'onboarding_step')) $attrs['onboarding_step'] = $validated['onboarding_step'];
        if (Schema::hasColumn('villages', 'boundary_geojson')) $attrs['boundary_geojson'] = $validated['boundary_geojson'] ?? null;
        if (Schema::hasColumn('villages', 'data_source')) $attrs['data_source'] = $validated['data_source'] ?? 'Municipal Field Survey';
        if (Schema::hasColumn('villages', 'reference_year')) $attrs['reference_year'] = $validated['reference_year'] ?? (int) date('Y');

        if (!empty($validated['draft_id'])) {
            $village = Village::findOrFail($validated['draft_id']);
            $village->update($attrs);
        } else {
            $village = Village::create($attrs);
        }

        // Audit log
        AuditLog::create([
            'village_id' => $village->id,
            'action_type' => 'draft_saved',
            'entity_type' => 'village',
            'entity_id' => $village->id,
            'performed_by' => 'Municipal Planner',
            'summary' => "Onboarding wizard draft saved at Step {$validated['onboarding_step']} for {$village->name}.",
            'details' => ['step' => $validated['onboarding_step'], 'status' => $village->status],
        ]);

        return response()->json([
            'village' => $village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']),
            'draft_id' => $village->id,
            'onboarding_step' => $village->onboarding_step,
            'message' => "Draft saved at Step {$validated['onboarding_step']}.",
        ], 200);
    }

    /**
     * Activate an onboarded village (Phase 3 & Phase 9).
     */
    public function activate(Request $request, Village $village)
    {
        $updates = [];
        if (Schema::hasColumn('villages', 'status')) $updates['status'] = 'active';
        if (Schema::hasColumn('villages', 'onboarding_step')) $updates['onboarding_step'] = 5;

        $village->update($updates);

        AuditLog::create([
            'village_id' => $village->id,
            'action_type' => 'activated',
            'entity_type' => 'village',
            'entity_id' => $village->id,
            'performed_by' => 'Municipal Administrator',
            'summary' => "Village {$village->name} activated for civic intelligence, simulator, and AI workspace.",
            'details' => ['active_at' => now()->toIso8601String()],
        ]);

        return response()->json([
            'success' => true,
            'village' => $village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']),
            'message' => "Village '{$village->name}' has been successfully activated and is now operational across all GaunPulse modules.",
        ]);
    }

    /**
     * Update village details.
     */
    public function update(Request $request, Village $village)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'local_name' => 'nullable|string|max:255',
            'ward_no' => 'nullable|string|max:50',
            'municipality' => 'sometimes|required|string|max:255',
            'district' => 'sometimes|required|string|max:255',
            'province' => 'sometimes|required|string|max:255',
            'center_lat' => 'nullable|numeric|between:-90,90',
            'center_lng' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:draft,active,archived',
            'data_source' => 'nullable|string|max:255',
            'reference_year' => 'nullable|integer',
        ]);

        $updates = [];
        foreach (['name', 'municipality', 'district', 'province', 'description', 'status', 'data_source', 'reference_year'] as $field) {
            if (isset($validated[$field])) {
                $updates[$field] = $validated[$field];
            }
        }

        if (isset($validated['local_name']) && Schema::hasColumn('villages', 'local_name')) {
            $updates['local_name'] = $validated['local_name'];
        }
        if (isset($validated['ward_no']) && Schema::hasColumn('villages', 'ward_no')) {
            $updates['ward_no'] = $validated['ward_no'];
        }

        $lat = $validated['center_lat'] ?? $request->input('latitude');
        $lng = $validated['center_lng'] ?? $request->input('longitude');

        if ($lat !== null && Schema::hasColumn('villages', 'center_lat')) $updates['center_lat'] = $lat;
        if ($lng !== null && Schema::hasColumn('villages', 'center_lng')) $updates['center_lng'] = $lng;
        if ($lat !== null && Schema::hasColumn('villages', 'latitude')) $updates['latitude'] = $lat;
        if ($lng !== null && Schema::hasColumn('villages', 'longitude')) $updates['longitude'] = $lng;

        $village->update($updates);

        return response()->json($village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']));
    }

    /**
     * Delete village.
     */
    public function destroy(Village $village)
    {
        if ($village->id === 1) {
            return response()->json(['message' => 'The default baseline demo village cannot be removed.'], 403);
        }

        $name = $village->name;
        $village->delete();

        return response()->json(['message' => "Village record '{$name}' deleted successfully."]);
    }

    /**
     * Full infrastructure network graph for simulator, GIS & data manager.
     */
    public function network(Village $village)
    {
        return response()->json([
            'village' => $village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']),
            'nodes' => $village->nodes()->get(),
            'edges' => $village->edges()->with(['source', 'target'])->get(),
            'facilities' => $village->facilities()->with('node')->get(),
            'settlements' => $village->settlements()->with('node')->get(),
            'issues' => $village->issues()->latest()->get(),
            'disclaimer' => 'Rural infrastructure graph records verified by municipal GIS directory.',
        ]);
    }

    /**
     * Create an infrastructure node for the village.
     */
    public function storeNode(Request $request, Village $village)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'node_code' => 'nullable|string|max:100',
            'node_type' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'description' => 'nullable|string',
            'settlement_group_id' => 'nullable|exists:settlement_groups,id',
            'source' => 'nullable|string|max:100',
            'verification_status' => 'nullable|string|in:imported,unverified,pending_review,verified,rejected',
        ]);

        $type = $validated['node_type'] ?? $validated['type'] ?? 'junction';
        $code = !empty($validated['node_code'])
            ? Str::slug($validated['node_code'], '_')
            : 'node_' . Str::random(6);

        $attrs = [
            'village_id' => $village->id,
            'name' => $validated['name'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ];

        if (Schema::hasColumn('nodes', 'node_code')) $attrs['node_code'] = $code;
        if (Schema::hasColumn('nodes', 'node_type')) $attrs['node_type'] = $type;
        if (Schema::hasColumn('nodes', 'type')) $attrs['type'] = $type;
        if (Schema::hasColumn('nodes', 'description')) $attrs['description'] = $validated['description'] ?? null;
        if (Schema::hasColumn('nodes', 'settlement_group_id')) $attrs['settlement_group_id'] = $validated['settlement_group_id'] ?? null;
        if (Schema::hasColumn('nodes', 'source')) $attrs['source'] = $validated['source'] ?? 'manual';
        if (Schema::hasColumn('nodes', 'verification_status')) $attrs['verification_status'] = $validated['verification_status'] ?? 'verified';

        $node = Node::create($attrs);

        return response()->json($node, 201);
    }

    /**
     * Update an infrastructure node.
     */
    public function updateNode(Request $request, Village $village, Node $node)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'node_code' => 'nullable|string|max:100',
            'node_type' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'latitude' => 'sometimes|required|numeric|between:-90,90',
            'longitude' => 'sometimes|required|numeric|between:-180,180',
            'description' => 'nullable|string',
            'verification_status' => 'nullable|string|in:imported,unverified,pending_review,verified,rejected',
        ]);

        $updates = [];
        if (isset($validated['name'])) $updates['name'] = $validated['name'];
        if (isset($validated['latitude'])) $updates['latitude'] = $validated['latitude'];
        if (isset($validated['longitude'])) $updates['longitude'] = $validated['longitude'];
        if (isset($validated['description']) && Schema::hasColumn('nodes', 'description')) $updates['description'] = $validated['description'];
        if (!empty($validated['node_code']) && Schema::hasColumn('nodes', 'node_code')) $updates['node_code'] = Str::slug($validated['node_code'], '_');
        if (isset($validated['verification_status']) && Schema::hasColumn('nodes', 'verification_status')) $updates['verification_status'] = $validated['verification_status'];

        $type = $validated['node_type'] ?? $validated['type'] ?? null;
        if ($type) {
            if (Schema::hasColumn('nodes', 'node_type')) $updates['node_type'] = $type;
            if (Schema::hasColumn('nodes', 'type')) $updates['type'] = $type;
        }

        $node->update($updates);

        return response()->json($node);
    }

    /**
     * Delete an infrastructure node.
     */
    public function destroyNode(Village $village, Node $node)
    {
        $edgeCount = Edge::where('source_node_id', $node->id)
            ->orWhere('target_node_id', $node->id)
            ->count();

        if ($edgeCount > 0) {
            return response()->json([
                'message' => "Cannot remove node '{$node->name}': it is connected to {$edgeCount} active lifeline edge(s). Remove or reassign those edges first.",
            ], 422);
        }

        $node->delete();
        return response()->json(['message' => 'Node deleted successfully.']);
    }

    /**
     * Create an infrastructure lifeline edge.
     */
    public function storeEdge(Request $request, Village $village)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'edge_code' => 'nullable|string|max:100',
            'source_node_id' => 'required|exists:nodes,id',
            'target_node_id' => 'required|different:source_node_id|exists:nodes,id',
            'infrastructure_type' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'surface_type' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:operational,passable,blocked,partially_blocked,under_repair',
            'length_meters' => 'nullable|numeric|min:1',
            'distance' => 'nullable|numeric|min:0.001',
            'is_critical' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'travel_minutes' => 'nullable|numeric|min:0.1',
            'source' => 'nullable|string|max:100',
            'verification_status' => 'nullable|string|in:imported,unverified,pending_review,verified,rejected',
        ]);

        $infraType = $validated['infrastructure_type'] ?? $validated['type'] ?? 'road';
        $status = $validated['status'] ?? 'passable';
        $code = !empty($validated['edge_code'])
            ? Str::slug($validated['edge_code'], '_')
            : 'edge_' . Str::random(6);

        $lenMeters = $validated['length_meters'] ?? (isset($validated['distance']) ? $validated['distance'] * 1000 : 250);

        // Estimate travel minutes if not supplied
        $travelMins = $validated['travel_minutes'] ?? null;
        if ($travelMins === null) {
            $speedMPerMin = match ($infraType) {
                'road' => ($validated['surface_type'] ?? 'gravel') === 'paved' ? 500 : 250,
                'bridge', 'suspension_bridge' => 66,
                default => 66,
            };
            $travelMins = round($lenMeters / $speedMPerMin, 1);
        }

        $attrs = [
            'village_id' => $village->id,
            'source_node_id' => $validated['source_node_id'],
            'target_node_id' => $validated['target_node_id'],
            'name' => $validated['name'],
            'status' => $status,
        ];

        if (Schema::hasColumn('edges', 'edge_code')) $attrs['edge_code'] = $code;
        if (Schema::hasColumn('edges', 'infrastructure_type')) $attrs['infrastructure_type'] = $infraType;
        if (Schema::hasColumn('edges', 'type')) $attrs['type'] = $infraType;
        if (Schema::hasColumn('edges', 'surface_type')) $attrs['surface_type'] = $validated['surface_type'] ?? 'gravel';
        if (Schema::hasColumn('edges', 'length_meters')) $attrs['length_meters'] = $lenMeters;
        if (Schema::hasColumn('edges', 'distance')) $attrs['distance'] = round($lenMeters / 1000, 3);
        if (Schema::hasColumn('edges', 'is_critical')) $attrs['is_critical'] = !empty($validated['is_critical']);
        if (Schema::hasColumn('edges', 'notes')) $attrs['notes'] = $validated['notes'] ?? null;
        if (Schema::hasColumn('edges', 'travel_minutes')) $attrs['travel_minutes'] = $travelMins;
        if (Schema::hasColumn('edges', 'source')) $attrs['source'] = $validated['source'] ?? 'manual';
        if (Schema::hasColumn('edges', 'verification_status')) $attrs['verification_status'] = $validated['verification_status'] ?? 'verified';

        $edge = Edge::create($attrs);

        return response()->json($edge->load(['source', 'target']), 201);
    }

    /**
     * Update an infrastructure edge (e.g. toggle status, surface type, or criticality).
     */
    public function updateEdge(Request $request, Village $village, Edge $edge)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'edge_code' => 'nullable|string|max:100',
            'source_node_id' => 'sometimes|required|exists:nodes,id',
            'target_node_id' => 'sometimes|required|different:source_node_id|exists:nodes,id',
            'infrastructure_type' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'surface_type' => 'nullable|string|max:50',
            'status' => 'sometimes|required|string|in:operational,passable,blocked,partially_blocked,under_repair',
            'length_meters' => 'nullable|numeric|min:1',
            'distance' => 'nullable|numeric|min:0.001',
            'is_critical' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'travel_minutes' => 'nullable|numeric|min:0.1',
            'verification_status' => 'nullable|string|in:imported,unverified,pending_review,verified,rejected',
        ]);

        $updates = [];
        if (isset($validated['name'])) $updates['name'] = $validated['name'];
        if (isset($validated['source_node_id'])) $updates['source_node_id'] = $validated['source_node_id'];
        if (isset($validated['target_node_id'])) $updates['target_node_id'] = $validated['target_node_id'];
        if (isset($validated['status'])) $updates['status'] = $validated['status'];

        $infraType = $validated['infrastructure_type'] ?? $validated['type'] ?? null;
        if ($infraType) {
            if (Schema::hasColumn('edges', 'infrastructure_type')) $updates['infrastructure_type'] = $infraType;
            if (Schema::hasColumn('edges', 'type')) $updates['type'] = $infraType;
        }
        if (isset($validated['surface_type']) && Schema::hasColumn('edges', 'surface_type')) $updates['surface_type'] = $validated['surface_type'];
        if (isset($validated['length_meters']) && Schema::hasColumn('edges', 'length_meters')) {
            $updates['length_meters'] = $validated['length_meters'];
            if (Schema::hasColumn('edges', 'distance')) $updates['distance'] = round($validated['length_meters'] / 1000, 3);
        }
        if (isset($validated['is_critical']) && Schema::hasColumn('edges', 'is_critical')) $updates['is_critical'] = (bool) $validated['is_critical'];
        if (isset($validated['notes']) && Schema::hasColumn('edges', 'notes')) $updates['notes'] = $validated['notes'];
        if (isset($validated['travel_minutes']) && Schema::hasColumn('edges', 'travel_minutes')) $updates['travel_minutes'] = $validated['travel_minutes'];
        if (isset($validated['verification_status']) && Schema::hasColumn('edges', 'verification_status')) $updates['verification_status'] = $validated['verification_status'];

        $edge->update($updates);

        return response()->json($edge->load(['source', 'target']));
    }

    /**
     * Delete an edge.
     */
    public function destroyEdge(Village $village, Edge $edge)
    {
        $edge->delete();
        return response()->json(['message' => 'Lifeline edge deleted successfully.']);
    }

    /**
     * Verify or update verification status of a node (Phase 7).
     */
    public function verifyNode(Request $request, Village $village, Node $node)
    {
        $validated = $request->validate([
            'verification_status' => 'required|string|in:imported,unverified,pending_review,verified,rejected',
            'verified_by' => 'nullable|string|max:150',
            'confidence_score' => 'nullable|integer|between:0,100',
            'verification_notes' => 'nullable|string',
        ]);

        $updates = [];
        if (Schema::hasColumn('nodes', 'verification_status')) $updates['verification_status'] = $validated['verification_status'];
        if (Schema::hasColumn('nodes', 'verified_by')) $updates['verified_by'] = $validated['verified_by'] ?? 'Municipal Inspector';
        if (Schema::hasColumn('nodes', 'verified_at')) $updates['verified_at'] = now();
        if (isset($validated['confidence_score']) && Schema::hasColumn('nodes', 'confidence_score')) $updates['confidence_score'] = $validated['confidence_score'];
        if (isset($validated['verification_notes']) && Schema::hasColumn('nodes', 'verification_notes')) $updates['verification_notes'] = $validated['verification_notes'];

        $node->update($updates);

        AuditLog::create([
            'village_id' => $village->id,
            'action_type' => 'verified',
            'entity_type' => 'node',
            'entity_id' => $node->id,
            'performed_by' => $updates['verified_by'] ?? 'Municipal Inspector',
            'summary' => "Node '{$node->name}' marked as {$validated['verification_status']}.",
            'details' => $validated,
        ]);

        return response()->json($node);
    }

    /**
     * Verify or update verification status of an edge (Phase 7).
     */
    public function verifyEdge(Request $request, Village $village, Edge $edge)
    {
        $validated = $request->validate([
            'verification_status' => 'required|string|in:imported,unverified,pending_review,verified,rejected',
            'verified_by' => 'nullable|string|max:150',
            'confidence_score' => 'nullable|integer|between:0,100',
            'verification_notes' => 'nullable|string',
        ]);

        $updates = [];
        if (Schema::hasColumn('edges', 'verification_status')) $updates['verification_status'] = $validated['verification_status'];
        if (Schema::hasColumn('edges', 'verified_by')) $updates['verified_by'] = $validated['verified_by'] ?? 'Municipal Road Engineer';
        if (Schema::hasColumn('edges', 'verified_at')) $updates['verified_at'] = now();
        if (isset($validated['confidence_score']) && Schema::hasColumn('edges', 'confidence_score')) $updates['confidence_score'] = $validated['confidence_score'];
        if (isset($validated['verification_notes']) && Schema::hasColumn('edges', 'verification_notes')) $updates['verification_notes'] = $validated['verification_notes'];

        $edge->update($updates);

        AuditLog::create([
            'village_id' => $village->id,
            'action_type' => 'verified',
            'entity_type' => 'edge',
            'entity_id' => $edge->id,
            'performed_by' => $updates['verified_by'] ?? 'Municipal Road Engineer',
            'summary' => "Lifeline edge '{$edge->name}' marked as {$validated['verification_status']}.",
            'details' => $validated,
        ]);

        return response()->json($edge->load(['source', 'target']));
    }

    /**
     * Retrieve audit logs for village (Phase 7).
     */
    public function auditLogs(Village $village)
    {
        $logs = AuditLog::where('village_id', $village->id)
            ->latest('id')
            ->take(50)
            ->get();

        return response()->json($logs);
    }

    /**
     * Create a public facility linked to an existing node.
     */
    public function storeFacility(Request $request, Village $village)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'facility_type' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'node_id' => 'required|exists:nodes,id',
            'capacity' => 'nullable|string|max:255',
            'operational_status' => 'nullable|string|in:operational,limited,non_operational',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $facType = $validated['facility_type'] ?? $validated['type'] ?? 'facility';

        $attrs = [
            'village_id' => $village->id,
            'node_id' => $validated['node_id'],
            'name' => $validated['name'],
        ];

        if (Schema::hasColumn('facilities', 'facility_type')) $attrs['facility_type'] = $facType;
        if (Schema::hasColumn('facilities', 'type')) $attrs['type'] = $facType;
        if (Schema::hasColumn('facilities', 'capacity')) $attrs['capacity'] = $validated['capacity'] ?? null;
        if (Schema::hasColumn('facilities', 'operational_status')) $attrs['operational_status'] = $validated['operational_status'] ?? 'operational';
        if (Schema::hasColumn('facilities', 'contact_person')) $attrs['contact_person'] = $validated['contact_person'] ?? null;
        if (Schema::hasColumn('facilities', 'contact_phone')) $attrs['contact_phone'] = $validated['contact_phone'] ?? null;
        if (Schema::hasColumn('facilities', 'notes')) $attrs['notes'] = $validated['notes'] ?? null;

        $facility = Facility::create($attrs);

        return response()->json($facility->load('node'), 201);
    }

    /**
     * Delete a facility.
     */
    public function destroyFacility(Village $village, Facility $facility)
    {
        $facility->delete();
        return response()->json(['message' => 'Facility deleted successfully.']);
    }

    /**
     * Import GIS GeoJSON FeatureCollection directly into MySQL (Phase 4).
     */
    public function importGeoJson(Request $request, Village $village)
    {
        $data = $request->all();
        $features = $data['features'] ?? ($data['geojson']['features'] ?? null);

        if (!is_array($features) || empty($features)) {
            return response()->json([
                'error' => 'Invalid GeoJSON: Payload must contain a valid FeatureCollection with a non-empty features array.',
            ], 422);
        }

        $importedNodes = 0;
        $importedEdges = 0;
        $nodeMap = [];

        DB::beginTransaction();
        try {
            // First pass: Point features (Nodes)
            foreach ($features as $feature) {
                $geomType = $feature['geometry']['type'] ?? null;
                if ($geomType === 'Point') {
                    $coords = $feature['geometry']['coordinates'] ?? [];
                    if (count($coords) >= 2) {
                        $lng = (float) $coords[0];
                        $lat = (float) $coords[1];

                        // WGS84 bounding validation
                        if ($lat < 26.0 || $lat > 31.0 || $lng < 80.0 || $lng > 89.0) {
                            continue; // skip out of bounds
                        }

                        $props = $feature['properties'] ?? [];
                        $name = $props['name'] ?? ('Imported Node ' . ($importedNodes + 1));
                        $code = !empty($props['node_code'])
                            ? Str::slug($props['node_code'], '_')
                            : 'node_' . Str::random(6);
                        $type = $props['node_type'] ?? $props['type'] ?? 'junction';

                        $attrs = [
                            'village_id' => $village->id,
                            'name' => $name,
                            'latitude' => $lat,
                            'longitude' => $lng,
                        ];

                        if (Schema::hasColumn('nodes', 'node_code')) $attrs['node_code'] = $code;
                        if (Schema::hasColumn('nodes', 'node_type')) $attrs['node_type'] = $type;
                        if (Schema::hasColumn('nodes', 'type')) $attrs['type'] = $type;
                        if (Schema::hasColumn('nodes', 'description')) $attrs['description'] = $props['description'] ?? 'Imported via GeoJSON';
                        if (Schema::hasColumn('nodes', 'source')) $attrs['source'] = 'geojson_import';
                        if (Schema::hasColumn('nodes', 'verification_status')) $attrs['verification_status'] = 'imported';
                        if (Schema::hasColumn('nodes', 'confidence_score')) $attrs['confidence_score'] = 75;

                        // Check for duplicate code in village
                        $node = Node::where('village_id', $village->id)
                            ->where('name', $name)
                            ->first();

                        if (!$node) {
                            $node = Node::create($attrs);
                            $importedNodes++;
                        }

                        $nodeMap[$code] = $node;
                        $nodeMap[$name] = $node;
                        if (!empty($props['id'])) $nodeMap['id_' . $props['id']] = $node;
                    }
                }
            }

            // Second pass: LineString features (Lifelines)
            $existingNodes = $village->nodes()->get();
            foreach ($existingNodes as $n) {
                if (!empty($n->node_code)) $nodeMap[$n->node_code] = $n;
                $nodeMap[$n->name] = $n;
            }

            foreach ($features as $feature) {
                $geomType = $feature['geometry']['type'] ?? null;
                if ($geomType === 'LineString') {
                    $props = $feature['properties'] ?? [];
                    $coords = $feature['geometry']['coordinates'] ?? [];
                    $sourceNode = null;
                    $targetNode = null;

                    if (!empty($props['source_node_code']) && isset($nodeMap[$props['source_node_code']])) {
                        $sourceNode = $nodeMap[$props['source_node_code']];
                    }
                    if (!empty($props['target_node_code']) && isset($nodeMap[$props['target_node_code']])) {
                        $targetNode = $nodeMap[$props['target_node_code']];
                    }

                    if ((!$sourceNode || !$targetNode) && count($coords) >= 2) {
                        $startLng = (float) $coords[0][0];
                        $startLat = (float) $coords[0][1];
                        $endLng = (float) $coords[count($coords) - 1][0];
                        $endLat = (float) $coords[count($coords) - 1][1];

                        $sourceNode = $sourceNode ?: $this->findNearestNode($existingNodes, $startLat, $startLng);
                        $targetNode = $targetNode ?: $this->findNearestNode($existingNodes, $endLat, $endLng);
                    }

                    if ($sourceNode && $targetNode && $sourceNode->id !== $targetNode->id) {
                        $edgeName = $props['name'] ?? ("{$sourceNode->name} - {$targetNode->name}");
                        $edgeCode = !empty($props['edge_code']) ? Str::slug($props['edge_code'], '_') : 'edge_' . Str::random(6);
                        $infraType = $props['infrastructure_type'] ?? $props['type'] ?? 'road';
                        $surfaceType = $props['surface_type'] ?? 'gravel';
                        $status = $props['status'] ?? 'passable';
                        $lenMeters = isset($props['length_meters']) ? (float) $props['length_meters'] : 300;

                        $edgeAttrs = [
                            'village_id' => $village->id,
                            'source_node_id' => $sourceNode->id,
                            'target_node_id' => $targetNode->id,
                            'name' => $edgeName,
                            'status' => $status,
                        ];

                        if (Schema::hasColumn('edges', 'edge_code')) $edgeAttrs['edge_code'] = $edgeCode;
                        if (Schema::hasColumn('edges', 'infrastructure_type')) $edgeAttrs['infrastructure_type'] = $infraType;
                        if (Schema::hasColumn('edges', 'type')) $edgeAttrs['type'] = $infraType;
                        if (Schema::hasColumn('edges', 'surface_type')) $edgeAttrs['surface_type'] = $surfaceType;
                        if (Schema::hasColumn('edges', 'length_meters')) $edgeAttrs['length_meters'] = $lenMeters;
                        if (Schema::hasColumn('edges', 'distance')) $edgeAttrs['distance'] = round($lenMeters / 1000, 3);
                        if (Schema::hasColumn('edges', 'is_critical')) $edgeAttrs['is_critical'] = !empty($props['is_critical']);
                        if (Schema::hasColumn('edges', 'source')) $edgeAttrs['source'] = 'geojson_import';
                        if (Schema::hasColumn('edges', 'verification_status')) $edgeAttrs['verification_status'] = 'imported';
                        if (Schema::hasColumn('edges', 'confidence_score')) $edgeAttrs['confidence_score'] = 75;

                        Edge::create($edgeAttrs);
                        $importedEdges++;
                    }
                }
            }

            AuditLog::create([
                'village_id' => $village->id,
                'action_type' => 'imported',
                'entity_type' => 'geojson',
                'performed_by' => 'GIS Ingestion Pipeline',
                'summary' => "Imported {$importedNodes} nodes and {$importedEdges} edges via GeoJSON.",
                'details' => ['nodes' => $importedNodes, 'edges' => $importedEdges],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "GIS import completed: {$importedNodes} nodes and {$importedEdges} lifeline edges successfully saved to MySQL.",
                'imported_nodes' => $importedNodes,
                'imported_edges' => $importedEdges,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'GIS Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import infrastructure from well-defined CSV format (Phase 4).
     */
    public function importCsv(Request $request, Village $village)
    {
        $csvText = $request->input('csv_text');
        if ($request->hasFile('file')) {
            $csvText = file_get_contents($request->file('file')->getRealPath());
        }

        if (empty($csvText)) {
            return response()->json(['error' => 'Empty CSV payload received.'], 422);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($csvText));
        if (count($lines) < 2) {
            return response()->json(['error' => 'CSV file must have at least a header row and one data row.'], 422);
        }

        $header = str_getcsv(array_shift($lines));
        $header = array_map(fn($h) => strtolower(trim($h)), $header);

        $isNodeCsv = in_array('latitude', $header) && in_array('longitude', $header);
        $isEdgeCsv = in_array('source_node_code', $header) || in_array('source_node_id', $header);

        $importedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            if ($isNodeCsv) {
                foreach ($lines as $idx => $line) {
                    if (empty(trim($line))) continue;
                    $row = array_combine($header, str_getcsv($line));
                    $lat = (float) ($row['latitude'] ?? 0);
                    $lng = (float) ($row['longitude'] ?? 0);

                    if ($lat < 26.0 || $lat > 31.0 || $lng < 80.0 || $lng > 89.0) {
                        $errors[] = "Row " . ($idx + 2) . ": Coordinates ({$lat}, {$lng}) outside Nepal bounds.";
                        continue;
                    }

                    $code = !empty($row['node_code']) ? Str::slug($row['node_code'], '_') : 'node_' . Str::random(6);
                    $name = $row['name'] ?? "CSV Node {$code}";
                    $type = $row['node_type'] ?? $row['type'] ?? 'junction';

                    $attrs = [
                        'village_id' => $village->id,
                        'name' => $name,
                        'latitude' => $lat,
                        'longitude' => $lng,
                    ];
                    if (Schema::hasColumn('nodes', 'node_code')) $attrs['node_code'] = $code;
                    if (Schema::hasColumn('nodes', 'node_type')) $attrs['node_type'] = $type;
                    if (Schema::hasColumn('nodes', 'type')) $attrs['type'] = $type;
                    if (Schema::hasColumn('nodes', 'description')) $attrs['description'] = $row['description'] ?? 'Imported from CSV';
                    if (Schema::hasColumn('nodes', 'source')) $attrs['source'] = 'csv_import';
                    if (Schema::hasColumn('nodes', 'verification_status')) $attrs['verification_status'] = 'imported';
                    if (Schema::hasColumn('nodes', 'confidence_score')) $attrs['confidence_score'] = 70;

                    Node::updateOrCreate(
                        ['village_id' => $village->id, 'name' => $name],
                        $attrs
                    );
                    $importedCount++;
                }
            } elseif ($isEdgeCsv) {
                $nodeCache = [];
                foreach ($village->nodes()->get() as $n) {
                    if (!empty($n->node_code)) $nodeCache[$n->node_code] = $n;
                    $nodeCache[$n->name] = $n;
                    $nodeCache[(string)$n->id] = $n;
                    $nodeCache[Str::slug($n->name, '_')] = $n;
                }

                foreach ($lines as $idx => $line) {
                    if (empty(trim($line))) continue;
                    $row = array_combine($header, str_getcsv($line));
                    $srcKey = trim($row['source_node_code'] ?? ($row['source_node_id'] ?? ''));
                    $tgtKey = trim($row['target_node_code'] ?? ($row['target_node_id'] ?? ''));

                    $src = $nodeCache[$srcKey] ?? ($village->nodes()->where('node_code', $srcKey)->orWhere('name', $srcKey)->first());
                    $tgt = $nodeCache[$tgtKey] ?? ($village->nodes()->where('node_code', $tgtKey)->orWhere('name', $tgtKey)->first());

                    if (!$src || !$tgt) {
                        $errors[] = "Row " . ($idx + 2) . ": Endpoints '{$srcKey}' -> '{$tgtKey}' could not be resolved.";
                        continue;
                    }

                    $edgeName = $row['name'] ?? "{$src->name} to {$tgt->name}";
                    $edgeCode = !empty($row['edge_code']) ? Str::slug($row['edge_code'], '_') : 'edge_' . Str::random(6);
                    $len = isset($row['length_meters']) ? (float)$row['length_meters'] : 350;

                    $attrs = [
                        'village_id' => $village->id,
                        'source_node_id' => $src->id,
                        'target_node_id' => $tgt->id,
                        'name' => $edgeName,
                        'status' => $row['status'] ?? 'passable',
                    ];
                    if (Schema::hasColumn('edges', 'edge_code')) $attrs['edge_code'] = $edgeCode;
                    if (Schema::hasColumn('edges', 'infrastructure_type')) $attrs['infrastructure_type'] = $row['infrastructure_type'] ?? 'road';
                    if (Schema::hasColumn('edges', 'type')) $attrs['type'] = $row['infrastructure_type'] ?? 'road';
                    if (Schema::hasColumn('edges', 'surface_type')) $attrs['surface_type'] = $row['surface_type'] ?? 'gravel';
                    if (Schema::hasColumn('edges', 'length_meters')) $attrs['length_meters'] = $len;
                    if (Schema::hasColumn('edges', 'distance')) $attrs['distance'] = round($len / 1000, 3);
                    if (Schema::hasColumn('edges', 'source')) $attrs['source'] = 'csv_import';
                    if (Schema::hasColumn('edges', 'verification_status')) $attrs['verification_status'] = 'imported';
                    if (Schema::hasColumn('edges', 'confidence_score')) $attrs['confidence_score'] = 70;

                    Edge::updateOrCreate(
                        ['village_id' => $village->id, 'name' => $edgeName],
                        $attrs
                    );
                    $importedCount++;
                }
            } else {
                return response()->json(['error' => 'Unrecognized CSV format. Include latitude/longitude for nodes or source_node_code/target_node_code for edges.'], 422);
            }

            AuditLog::create([
                'village_id' => $village->id,
                'action_type' => 'imported',
                'entity_type' => 'csv',
                'performed_by' => 'CSV Importer',
                'summary' => "Imported {$importedCount} records via CSV.",
                'details' => ['count' => $importedCount, 'errors_count' => count($errors)],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "CSV Import complete: {$importedCount} records processed successfully.",
                'imported_count' => $importedCount,
                'errors' => $errors,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'CSV parsing error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Audit all villages in MySQL for administrative hierarchy consistency (Phase 1).
     */
    public function auditHierarchy()
    {
        $villages = Village::all();
        $report = [];
        foreach ($villages as $v) {
            $report[] = \App\Services\NepalLocationService::auditVillageHierarchy($v);
        }

        return response()->json([
            'total_audited' => count($report),
            'inconsistent_count' => count(array_filter($report, fn($r) => !$r['is_consistent'])),
            'records' => $report,
        ]);
    }

    /**
     * Reviewable correction of inconsistent administrative hierarchy (Phase 1).
     */
    public function correctHierarchy(Request $request, Village $village)
    {
        $validated = $request->validate([
            'province' => 'sometimes|required|string',
            'district' => 'sometimes|required|string',
            'municipality' => 'sometimes|required|string',
            'ward_no' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);

        $updated = \App\Services\NepalLocationService::correctVillageHierarchy($village, $validated);

        return response()->json([
            'success' => true,
            'message' => "Administrative hierarchy corrected for village '{$village->name}'.",
            'village' => $updated,
        ]);
    }

    /**
     * Discover available OpenStreetMap infrastructure for a Village within bounded area (Phase 2 & 3).
     */
    public function discoverOsm(Request $request, Village $village)
    {
        $radius = $request->integer('radius', 2000);
        $customBounds = $request->input('bounds', null);

        $discovery = \App\Services\OsmInfrastructureService::discover($village, $radius, $customBounds);
        return response()->json($discovery);
    }

    /**
     * Confirm and persist approved discovery features into MySQL (Phase 4, 5, 7, 8).
     */
    public function confirmOsmImport(Request $request, Village $village)
    {
        $validated = $request->validate([
            'features' => 'required|array',
            'batch_id' => 'nullable|string',
        ]);

        $result = \App\Services\OsmInfrastructureService::persistDiscovered(
            $village,
            $validated['features'],
            $validated['batch_id'] ?? null
        );

        // Build/update travel-time estimates and graph topology
        $this->buildNetwork($request, $village);

        return response()->json($result);
    }

    /**
     * Fetch village import history and audit logs (Phase 4).
     */
    public function importHistory(Village $village)
    {
        $logs = $village->auditLogs()
            ->whereIn('action', ['osm_infrastructure_import', 'hierarchy_correction', 'import_geojson', 'import_csv'])
            ->latest()
            ->get();

        return response()->json([
            'village_id' => $village->id,
            'last_imported_at' => $village->last_imported_at,
            'import_batch_id' => $village->import_batch_id,
            'logs' => $logs,
        ]);
    }

    /**
     * Import mapped infrastructure from OpenStreetMap via Overpass (Phase 4 & 5).
     */
    public function importOsm(Request $request, Village $village)
    {
        $previewOnly = $request->boolean('preview_only', false);
        $radius = $request->integer('radius', 2000);
        $customBounds = $request->input('bounds', null);

        $discovery = \App\Services\OsmInfrastructureService::discover($village, $radius, $customBounds);

        if ($previewOnly) {
            return response()->json([
                'preview_only' => true,
                'source' => $discovery['summary']['source'],
                'attribution' => $discovery['summary']['attribution'],
                'summary' => [
                    'candidate_nodes' => count($discovery['categories']['schools']) + count($discovery['categories']['health']) + count($discovery['categories']['water']) + count($discovery['categories']['settlements']),
                    'candidate_edges' => count($discovery['categories']['roads']) + count($discovery['categories']['bridges']),
                    'candidate_facilities' => count($discovery['categories']['schools']) + count($discovery['categories']['health']),
                ],
                'categories' => $discovery['categories'],
                'duplicate_warnings' => $discovery['duplicate_warnings'],
                'features' => $discovery['features'],
            ]);
        }

        // Persist all selected features
        $selectedFeatures = array_filter($discovery['features'], fn($f) => ($f['selected'] ?? true) && !($f['is_duplicate'] ?? false));
        $result = \App\Services\OsmInfrastructureService::persistDiscovered($village, array_values($selectedFeatures));

        // Build travel-times
        $this->buildNetwork($request, $village);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'source' => $discovery['summary']['source'],
            'attribution' => $discovery['summary']['attribution'],
            'imported_nodes' => $result['imported_nodes'],
            'imported_edges' => $result['imported_edges'],
            'imported_facilities' => $result['imported_facilities'],
        ]);
    }

    /**
     * Build and validate infrastructure network topology (Phase 6).
     */
    public function buildNetwork(Request $request, Village $village)
    {
        $nodes = $village->nodes()->get();
        $edges = $village->edges()->with(['source', 'target'])->get();

        $updatedEdges = 0;
        $missingTravelTimes = 0;

        foreach ($edges as $edge) {
            $infraType = $edge->infrastructure_type ?? $edge->type ?? 'road';
            $surfaceType = $edge->surface_type ?? 'gravel';
            $lengthMeters = $edge->length_meters ?? 300;

            // Compute speed in meters per minute
            $speedMPerMin = match ($infraType) {
                'road' => $surfaceType === 'paved' ? 500 : ($surfaceType === 'gravel' ? 300 : 166),
                'bridge', 'suspension_bridge' => 66,
                default => 66, // walking on footpath
            };

            $estimatedMinutes = round($lengthMeters / $speedMPerMin, 1);

            if (Schema::hasColumn('edges', 'travel_minutes')) {
                if (empty($edge->travel_minutes) || $edge->travel_minutes <= 0) {
                    $edge->update(['travel_minutes' => $estimatedMinutes]);
                    $missingTravelTimes++;
                    $updatedEdges++;
                }
            }
        }

        // Run integrity diagnostics
        $diagnostics = $this->integrity($village)->getData(true);

        return response()->json([
            'success' => true,
            'message' => "Network topology built and verified for {$village->name}.",
            'total_nodes' => $nodes->count(),
            'total_edges' => $edges->count(),
            'calculated_travel_times' => $missingTravelTimes,
            'diagnostics' => $diagnostics,
        ]);
    }

    /**
     * Export complete village infrastructure network in standard RFC 7946 GeoJSON.
     */
    public function exportGeoJson(Village $village)
    {
        $nodes = $village->nodes()->get();
        $edges = $village->edges()->with(['source', 'target'])->get();
        $facilities = $village->facilities()->get();

        $features = [];

        foreach ($nodes as $node) {
            $features[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [(float) $node->longitude, (float) $node->latitude],
                ],
                'properties' => [
                    'id' => $node->id,
                    'node_code' => $node->node_code ?? "node_{$node->id}",
                    'name' => $node->name,
                    'node_type' => $node->node_type ?? $node->type ?? 'junction',
                    'description' => $node->description ?? '',
                    'source' => $node->source ?? 'manual',
                    'verification_status' => $node->verification_status ?? 'verified',
                    'village_id' => $village->id,
                    'village_name' => $village->name,
                ],
            ];
        }

        foreach ($edges as $edge) {
            if ($edge->source && $edge->target) {
                $features[] = [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'LineString',
                        'coordinates' => [
                            [(float) $edge->source->longitude, (float) $edge->source->latitude],
                            [(float) $edge->target->longitude, (float) $edge->target->latitude],
                        ],
                    ],
                    'properties' => [
                        'id' => $edge->id,
                        'edge_code' => $edge->edge_code ?? "edge_{$edge->id}",
                        'name' => $edge->name,
                        'source_node_id' => $edge->source_node_id,
                        'source_node_name' => $edge->source->name,
                        'target_node_id' => $edge->target_node_id,
                        'target_node_name' => $edge->target->name,
                        'infrastructure_type' => $edge->infrastructure_type ?? $edge->type ?? 'road',
                        'surface_type' => $edge->surface_type ?? 'gravel',
                        'status' => $edge->status ?? 'passable',
                        'length_meters' => $edge->length_meters ?? 100,
                        'travel_minutes' => $edge->travel_minutes ?? 5.0,
                        'is_critical' => (bool) ($edge->is_critical ?? false),
                        'source' => $edge->source ?? 'manual',
                        'verification_status' => $edge->verification_status ?? 'verified',
                    ],
                ];
            }
        }

        $geoJson = [
            'type' => 'FeatureCollection',
            'crs' => [
                'type' => 'name',
                'properties' => ['name' => 'urn:ogc:def:crs:OGC:1.3:CRS84'],
            ],
            'metadata' => [
                'platform' => 'GaunPulse — The Village That Speaks',
                'village' => $village->name,
                'ward_no' => $village->ward_no ?? '4',
                'municipality' => $village->municipality,
                'district' => $village->district,
                'province' => $village->province,
                'exported_at' => now()->toIso8601String(),
                'nodes_count' => count($nodes),
                'edges_count' => count($edges),
                'facilities_count' => count($facilities),
            ],
            'features' => $features,
        ];

        return response()->json($geoJson, 200, [
            'Content-Disposition' => 'attachment; filename="gaunpulse_village_' . $village->id . '_network.geojson"',
        ]);
    }

    /**
     * Compute live topological graph integrity diagnostics for the village network.
     */
    public function integrity(Village $village)
    {
        $nodes = $village->nodes()->get();
        $edges = $village->edges()->get();
        $facilities = $village->facilities()->get();

        $nodeCount = $nodes->count();
        $edgeCount = $edges->count();

        $degreeMap = [];
        $adj = [];
        foreach ($nodes as $n) {
            $degreeMap[$n->id] = 0;
            $adj[$n->id] = [];
        }

        $danglingEdges = [];
        foreach ($edges as $e) {
            $hasSrc = isset($degreeMap[$e->source_node_id]);
            $hasTgt = isset($degreeMap[$e->target_node_id]);

            if (!$hasSrc || !$hasTgt) {
                $danglingEdges[] = [
                    'id' => $e->id,
                    'name' => $e->name,
                    'missing_source' => !$hasSrc,
                    'missing_target' => !$hasTgt,
                ];
            } else {
                $degreeMap[$e->source_node_id]++;
                $degreeMap[$e->target_node_id]++;
                $adj[$e->source_node_id][] = $e->target_node_id;
                $adj[$e->target_node_id][] = $e->source_node_id;
            }
        }

        $orphanNodes = [];
        $leafNodes = [];
        foreach ($nodes as $n) {
            $deg = $degreeMap[$n->id] ?? 0;
            if ($deg === 0) {
                $orphanNodes[] = [
                    'id' => $n->id,
                    'name' => $n->name,
                    'node_type' => $n->node_type ?? $n->type ?? 'junction',
                ];
            } elseif ($deg === 1) {
                $leafNodes[] = [
                    'id' => $n->id,
                    'name' => $n->name,
                ];
            }
        }

        $visited = [];
        $components = [];

        foreach ($nodes as $n) {
            if (!isset($visited[$n->id])) {
                $component = [];
                $queue = [$n->id];
                $visited[$n->id] = true;

                while (!empty($queue)) {
                    $curr = array_shift($queue);
                    $component[] = $curr;

                    foreach ($adj[$curr] ?? [] as $neighbor) {
                        if (!isset($visited[$neighbor])) {
                            $visited[$neighbor] = true;
                            $queue[] = $neighbor;
                        }
                    }
                }

                $components[] = $component;
            }
        }

        $invalidCoords = [];
        foreach ($nodes as $n) {
            $lat = (float) $n->latitude;
            $lng = (float) $n->longitude;
            if ($lat < 26.0 || $lat > 31.0 || $lng < 80.0 || $lng > 89.0) {
                $invalidCoords[] = [
                    'id' => $n->id,
                    'name' => $n->name,
                    'latitude' => $lat,
                    'longitude' => $lng,
                ];
            }
        }

        $componentCount = count($components);
        $isConnected = ($nodeCount > 0 && $componentCount === 1);
        $healthScore = 100;

        if (!$isConnected && $nodeCount > 1) {
            $healthScore -= min(40, ($componentCount - 1) * 15);
        }
        if (count($orphanNodes) > 0) {
            $healthScore -= count($orphanNodes) * 10;
        }
        if (count($danglingEdges) > 0) {
            $healthScore -= count($danglingEdges) * 20;
        }
        if (count($invalidCoords) > 0) {
            $healthScore -= count($invalidCoords) * 5;
        }
        $healthScore = max(10, min(100, $healthScore));

        return response()->json([
            'status' => $healthScore >= 80 ? 'healthy' : ($healthScore >= 50 ? 'warning' : 'critical'),
            'health_score' => $healthScore,
            'is_fully_connected' => $isConnected,
            'connected_components_count' => $componentCount,
            'total_nodes' => $nodeCount,
            'total_edges' => $edgeCount,
            'total_facilities' => $facilities->count(),
            'orphan_nodes' => $orphanNodes,
            'orphan_nodes_count' => count($orphanNodes),
            'dangling_edges' => $danglingEdges,
            'dangling_edges_count' => count($danglingEdges),
            'leaf_nodes_count' => count($leafNodes),
            'invalid_coordinates_count' => count($invalidCoords),
            'invalid_coordinates' => $invalidCoords,
            'diagnostics' => [
                'network_topology' => $isConnected ? 'Single coherent graph network' : "Partitioned into {$componentCount} disconnected network components",
                'lifeline_connectivity' => count($orphanNodes) === 0 ? 'All settlements and facilities have road/trail links' : count($orphanNodes) . ' nodes have zero road connections',
                'spatial_bounding' => count($invalidCoords) === 0 ? 'All coordinates within Nepal geographic envelope' : count($invalidCoords) . ' nodes outside Nepal envelope',
            ],
        ]);
    }

    private function findNearestNode($nodes, float $lat, float $lng, float $threshold = 0.05)
    {
        $nearest = null;
        $minDist = PHP_FLOAT_MAX;

        foreach ($nodes as $n) {
            $d = sqrt(pow($n->latitude - $lat, 2) + pow($n->longitude - $lng, 2));
            if ($d < $minDist) {
                $minDist = $d;
                $nearest = $n;
            }
        }

        return ($minDist <= $threshold) ? $nearest : null;
    }
}
