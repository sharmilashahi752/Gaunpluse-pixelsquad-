<?php

namespace App\Http\Controllers;

use App\Models\ActionPlan;
use Illuminate\Http\Request;

class ActionPlanController extends Controller
{
    public function index(Request $request)
    {
        $query = ActionPlan::with(['village', 'issue'])->latest();

        if ($request->filled('village_id')) {
            $query->where('village_id', $request->input('village_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        return response()->json($query->get());
    }

    public function show(ActionPlan $actionPlan)
    {
        return response()->json($actionPlan->load(['village', 'issue']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'village_id' => 'required|exists:villages,id',
            'issue_id' => 'nullable|exists:issues,id',
            'title' => 'required|string|min:3|max:200',
            'description' => 'nullable|string|max:3000',
            'ward' => 'nullable|string|max:50',
            'priority' => 'required|in:Critical,High,Medium,Low',
            'responsible_team' => 'required|string|max:150',
            'start_date' => 'nullable|date',
            'target_completion_date' => 'nullable|date',
            'status' => 'required|in:pending,in_progress,completed,delayed,on_hold',
            'progress_percentage' => 'required|integer|min:0|max:100',
            'notes' => 'nullable|string|max:2000',
        ]);

        $actionPlan = ActionPlan::create($validated);

        return response()->json($actionPlan->load(['village', 'issue']), 201);
    }

    public function update(Request $request, ActionPlan $actionPlan)
    {
        $validated = $request->validate([
            'village_id' => 'sometimes|required|exists:villages,id',
            'issue_id' => 'nullable|exists:issues,id',
            'title' => 'sometimes|required|string|min:3|max:200',
            'description' => 'nullable|string|max:3000',
            'ward' => 'nullable|string|max:50',
            'priority' => 'sometimes|required|in:Critical,High,Medium,Low',
            'responsible_team' => 'sometimes|required|string|max:150',
            'start_date' => 'nullable|date',
            'target_completion_date' => 'nullable|date',
            'status' => 'sometimes|required|in:pending,in_progress,completed,delayed,on_hold',
            'progress_percentage' => 'sometimes|required|integer|min:0|max:100',
            'notes' => 'nullable|string|max:2000',
        ]);

        $actionPlan->update($validated);

        return response()->json($actionPlan->fresh()->load(['village', 'issue']));
    }

    public function updateProgress(Request $request, ActionPlan $actionPlan)
    {
        $validated = $request->validate([
            'progress_percentage' => 'required|integer|min:0|max:100',
            'status' => 'nullable|in:pending,in_progress,completed,delayed,on_hold',
            'notes' => 'nullable|string|max:1000',
        ]);

        $updateData = ['progress_percentage' => $validated['progress_percentage']];

        if (!empty($validated['status'])) {
            $updateData['status'] = $validated['status'];
        } elseif ($validated['progress_percentage'] >= 100) {
            $updateData['status'] = 'completed';
        } elseif ($actionPlan->status === 'completed' && $validated['progress_percentage'] < 100) {
            $updateData['status'] = 'in_progress';
        }

        if (isset($validated['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }

        $actionPlan->update($updateData);

        return response()->json($actionPlan->fresh()->load(['village', 'issue']));
    }

    public function destroy(ActionPlan $actionPlan)
    {
        $actionPlan->delete();
        return response()->json(['message' => 'Action plan deleted successfully'], 200);
    }
}
