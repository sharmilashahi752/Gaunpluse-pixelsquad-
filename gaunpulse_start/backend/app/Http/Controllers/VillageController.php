<?php

namespace App\Http\Controllers;

use App\Models\Edge;
use App\Models\Facility;
use App\Models\Node;
use App\Models\SettlementGroup;
use App\Models\Village;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class VillageController extends Controller
{
    /**
     * List all villages with network entity counts.
     */
    public function index()
    {
        return Village::query()
            ->withCount(['settlements', 'issues', 'nodes', 'edges', 'facilities'])
            ->latest('id')
            ->get();
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
        ]);

        $lat = $validated['center_lat'] ?? $validated['latitude'] ?? 27.8635;
        $lng = $validated['center_lng'] ?? $validated['longitude'] ?? 85.5815;

        $attrs = [
            'name' => $validated['name'],
            'municipality' => $validated['municipality'],
            'district' => $validated['district'],
            'province' => $validated['province'],
        ];

        if (Schema::hasColumn('villages', 'local_name')) {
            $attrs['local_name'] = $validated['local_name'] ?? null;
        }
        if (Schema::hasColumn('villages', 'ward_no')) {
            $attrs['ward_no'] = $validated['ward_no'] ?? '1';
        }
        if (Schema::hasColumn('villages', 'description')) {
            $attrs['description'] = $validated['description'] ?? null;
        }
        if (Schema::hasColumn('villages', 'center_lat')) {
            $attrs['center_lat'] = $lat;
            $attrs['center_lng'] = $lng;
        }
        if (Schema::hasColumn('villages', 'latitude')) {
            $attrs['latitude'] = $lat;
            $attrs['longitude'] = $lng;
        }
        if (Schema::hasColumn('villages', 'is_demo')) {
            $attrs['is_demo'] = false;
        }

        $village = Village::create($attrs);

        return response()->json($village->loadCount(['settlements', 'issues', 'nodes', 'edges', 'facilities']), 201);
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
        ]);

        $updates = [];
        foreach (['name', 'municipality', 'district', 'province', 'description'] as $field) {
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

        if ($lat !== null && Schema::hasColumn('villages', 'center_lat')) {
            $updates['center_lat'] = $lat;
        }
        if ($lng !== null && Schema::hasColumn('villages', 'center_lng')) {
            $updates['center_lng'] = $lng;
        }
        if ($lat !== null && Schema::hasColumn('villages', 'latitude')) {
            $updates['latitude'] = $lat;
        }
        if ($lng !== null && Schema::hasColumn('villages', 'longitude')) {
            $updates['longitude'] = $lng;
        }

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

        $village->delete();
        return response()->json(['message' => 'Village record deleted successfully.']);
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
            'disclaimer' => 'Fictional demonstration network and population estimates; not municipal records.',
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

        if (Schema::hasColumn('nodes', 'node_code')) {
            $attrs['node_code'] = $code;
        }
        if (Schema::hasColumn('nodes', 'node_type')) {
            $attrs['node_type'] = $type;
        }
        if (Schema::hasColumn('nodes', 'type')) {
            $attrs['type'] = $type;
        }
        if (Schema::hasColumn('nodes', 'description')) {
            $attrs['description'] = $validated['description'] ?? null;
        }
        if (Schema::hasColumn('nodes', 'settlement_group_id')) {
            $attrs['settlement_group_id'] = $validated['settlement_group_id'] ?? null;
        }

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
        ]);

        $updates = [];
        if (isset($validated['name'])) $updates['name'] = $validated['name'];
        if (isset($validated['latitude'])) $updates['latitude'] = $validated['latitude'];
        if (isset($validated['longitude'])) $updates['longitude'] = $validated['longitude'];
        if (isset($validated['description']) && Schema::hasColumn('nodes', 'description')) {
            $updates['description'] = $validated['description'];
        }
        if (!empty($validated['node_code']) && Schema::hasColumn('nodes', 'node_code')) {
            $updates['node_code'] = Str::slug($validated['node_code'], '_');
        }

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
        ]);

        $infraType = $validated['infrastructure_type'] ?? $validated['type'] ?? 'road';
        $status = $validated['status'] ?? 'passable';
        $code = !empty($validated['edge_code'])
            ? Str::slug($validated['edge_code'], '_')
            : 'edge_' . Str::random(6);

        $lenMeters = $validated['length_meters'] ?? (isset($validated['distance']) ? $validated['distance'] * 1000 : 250);

        $attrs = [
            'village_id' => $village->id,
            'source_node_id' => $validated['source_node_id'],
            'target_node_id' => $validated['target_node_id'],
            'name' => $validated['name'],
            'status' => $status,
        ];

        if (Schema::hasColumn('edges', 'edge_code')) {
            $attrs['edge_code'] = $code;
        }
        if (Schema::hasColumn('edges', 'infrastructure_type')) {
            $attrs['infrastructure_type'] = $infraType;
        }
        if (Schema::hasColumn('edges', 'type')) {
            $attrs['type'] = $infraType;
        }
        if (Schema::hasColumn('edges', 'surface_type')) {
            $attrs['surface_type'] = $validated['surface_type'] ?? 'gravel';
        }
        if (Schema::hasColumn('edges', 'length_meters')) {
            $attrs['length_meters'] = $lenMeters;
        }
        if (Schema::hasColumn('edges', 'distance')) {
            $attrs['distance'] = round($lenMeters / 1000, 3);
        }
        if (Schema::hasColumn('edges', 'is_critical')) {
            $attrs['is_critical'] = !empty($validated['is_critical']);
        }
        if (Schema::hasColumn('edges', 'notes')) {
            $attrs['notes'] = $validated['notes'] ?? null;
        }

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
        if (isset($validated['surface_type']) && Schema::hasColumn('edges', 'surface_type')) {
            $updates['surface_type'] = $validated['surface_type'];
        }
        if (isset($validated['length_meters']) && Schema::hasColumn('edges', 'length_meters')) {
            $updates['length_meters'] = $validated['length_meters'];
            if (Schema::hasColumn('edges', 'distance')) {
                $updates['distance'] = round($validated['length_meters'] / 1000, 3);
            }
        }
        if (isset($validated['distance']) && Schema::hasColumn('edges', 'distance')) {
            $updates['distance'] = $validated['distance'];
        }
        if (isset($validated['is_critical']) && Schema::hasColumn('edges', 'is_critical')) {
            $updates['is_critical'] = (bool) $validated['is_critical'];
        }
        if (isset($validated['notes']) && Schema::hasColumn('edges', 'notes')) {
            $updates['notes'] = $validated['notes'];
        }

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
     * Import GIS GeoJSON FeatureCollection directly into MySQL.
     */
    public function importGeoJson(Request $request, Village $village)
    {
        $data = $request->all();

        // Support both direct GeoJSON or wrapped { geojson: {...} } or { features: [...] }
        $features = $data['features'] ?? ($data['geojson']['features'] ?? null);

        if (!is_array($features) || empty($features)) {
            return response()->json([
                'error' => 'Invalid GeoJSON: Payload must contain a valid FeatureCollection with a non-empty features array.',
            ], 422);
        }

        $importedNodes = 0;
        $importedEdges = 0;
        $nodeMap = []; // code/name -> node model

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

                        $node = Node::create($attrs);
                        $importedNodes++;
                        $nodeMap[$code] = $node;
                        $nodeMap[$name] = $node;
                        if (!empty($props['id'])) $nodeMap['id_' . $props['id']] = $node;
                    }
                }
            }

            // Second pass: LineString features (Lifeline Edges)
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

                    // Match by source/target properties if available
                    if (!empty($props['source_node_code']) && isset($nodeMap[$props['source_node_code']])) {
                        $sourceNode = $nodeMap[$props['source_node_code']];
                    }
                    if (!empty($props['target_node_code']) && isset($nodeMap[$props['target_node_code']])) {
                        $targetNode = $nodeMap[$props['target_node_code']];
                    }

                    // Otherwise, match by nearest coordinates of start and end points of LineString
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
                        if (Schema::hasColumn('edges', 'notes')) $edgeAttrs['notes'] = $props['notes'] ?? 'Imported via GeoJSON';

                        Edge::create($edgeAttrs);
                        $importedEdges++;
                    }
                }
            }

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
     * Export complete village infrastructure network in standard RFC 7946 GeoJSON.
     */
    public function exportGeoJson(Village $village)
    {
        $nodes = $village->nodes()->get();
        $edges = $village->edges()->with(['source', 'target'])->get();
        $facilities = $village->facilities()->get();

        $features = [];

        // Add Point features for nodes
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
                    'village_id' => $village->id,
                    'village_name' => $village->name,
                ],
            ];
        }

        // Add LineString features for edges
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
                        'is_critical' => (bool) ($edge->is_critical ?? false),
                        'notes' => $edge->notes ?? '',
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

        // Calculate node degrees and build adjacency list
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

        // Identify orphan/isolated nodes (degree == 0)
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

        // Connected components analysis via BFS
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

        // Check coordinates bounds (Nepal geographical bounding box approx: lat 26.0 - 30.5, lng 80.0 - 88.5)
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

    /**
     * Helper to find nearest node by Euclidean distance.
     */
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
