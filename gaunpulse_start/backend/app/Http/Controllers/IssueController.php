<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIssueRequest;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use App\Models\IssueUpdate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class IssueController extends Controller
{
    public function index(Request $request)
    {
        $query = Issue::with(['village', 'edge', 'updates'])->latest();
        foreach (['category', 'severity', 'status', 'village_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        return IssueResource::collection($query->paginate(30));
    }

    public function show(Issue $issue)
    {
        return new IssueResource($issue->load(['village', 'edge', 'updates']));
    }

    public function store(StoreIssueRequest $request)
    {
        $data = $request->safe()->except('photo');
        $data['status'] = 'submitted';

        if (empty($data['tracking_code']) && Schema::hasColumn('issues', 'tracking_code')) {
            $data['tracking_code'] = 'GP-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));
        }
        if (empty($data['reporter_name']) && Schema::hasColumn('issues', 'reporter_name')) {
            $data['reporter_name'] = 'Community Resident';
        }
        if (Schema::hasColumn('issues', 'user_id')) {
            $data['user_id'] = $request->user()?->id;
        }
        if ($request->hasFile('photo') && Schema::hasColumn('issues', 'photo_path')) {
            $data['photo_path'] = $request->file('photo')->store('issues', 'public');
        }

        $issue = Issue::create($data);
        return (new IssueResource($issue->load(['village', 'edge'])))->response()->setStatusCode(201);
    }

    public function updateStatus(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'status' => 'required|in:submitted,under_review,verified,in_progress,resolved,rejected',
            'comment' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($issue, $validated, $request) {
            $oldStatus = $issue->status;
            $issue->update(['status' => $validated['status']]);

            $updateData = ['issue_id' => $issue->id];
            if (Schema::hasColumn('issue_updates', 'status')) {
                $updateData['status'] = $validated['status'];
            }
            if (Schema::hasColumn('issue_updates', 'comment')) {
                $updateData['comment'] = $validated['comment'] ?? "Status updated from {$oldStatus} to {$validated['status']}";
            }
            if (Schema::hasColumn('issue_updates', 'updated_by')) {
                $updateData['updated_by'] = $request->user()?->name ?? 'Municipal Officer';
            }
            if (Schema::hasColumn('issue_updates', 'old_status')) {
                $updateData['old_status'] = $oldStatus;
            }
            if (Schema::hasColumn('issue_updates', 'new_status')) {
                $updateData['new_status'] = $validated['status'];
            }
            if (Schema::hasColumn('issue_updates', 'user_id')) {
                $updateData['user_id'] = $request->user()?->id ?? 1;
            }

            IssueUpdate::create($updateData);
        });

        return new IssueResource($issue->fresh()->load(['village', 'edge', 'updates']));
    }
}
