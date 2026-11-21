<?php

namespace App\Http\Controllers;

use App\Models\CommunityFeedback;
use Illuminate\Http\Request;

class CommunityFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = CommunityFeedback::with(['village', 'issue'])->latest();

        if ($request->filled('village_id')) {
            $query->where('village_id', $request->input('village_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->limit(50)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'resident_name' => 'nullable|string|max:100',
            'ward' => 'required|string|max:100',
            'message' => 'required|string|min:5|max:2000',
            'tag' => 'nullable|string|max:50',
            'village_id' => 'nullable|exists:villages,id',
            'issue_id' => 'nullable|exists:issues,id',
        ]);

        if (empty($validated['resident_name'])) {
            $validated['resident_name'] = 'Community Resident';
        }
        if (empty($validated['tag'])) {
            $validated['tag'] = 'General';
        }
        $validated['status'] = 'submitted';

        $feedback = CommunityFeedback::create($validated);

        return response()->json($feedback->load(['village', 'issue']), 201);
    }

    public function acknowledge(CommunityFeedback $feedback)
    {
        $feedback->update(['status' => 'acknowledged']);
        return response()->json($feedback->fresh());
    }
}
