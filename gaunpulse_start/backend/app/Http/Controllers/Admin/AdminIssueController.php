<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Citizen\CitizenPortalController;
use App\Http\Requests\UpdateIssueStatusRequest;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use App\Models\IssueUpdate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminIssueController extends Controller
{
    public function index(Request $request)
    {
        $query = Issue::with(['village', 'edge', 'reporter', 'priorityScore', 'complaint'])->latest();
        foreach (['category', 'severity', 'status', 'village_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        return IssueResource::collection($query->paginate(50));
    }

    public function show(Issue $issue)
    {
        return new IssueResource($issue->load(['village', 'edge', 'reporter', 'updates.user', 'priorityScore', 'complaint']));
    }

    public function updateStatus(UpdateIssueStatusRequest $request, Issue $issue)
    {
        DB::transaction(function () use ($request, $issue) {
            $old = $issue->status;
            $issue->update(['status' => $request->status]);

            $updateData = ['issue_id' => $issue->id];
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'status')) {
                $updateData['status'] = $request->status;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'comment')) {
                $updateData['comment'] = $request->comment;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'updated_by')) {
                $updateData['updated_by'] = $request->user()?->name ?? 'Municipal Officer';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'old_status')) {
                $updateData['old_status'] = $old;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'new_status')) {
                $updateData['new_status'] = $request->status;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'user_id')) {
                $updateData['user_id'] = $request->user()?->id ?? 1;
            }
            IssueUpdate::create($updateData);

            CitizenPortalController::syncIssueStatusToComplaint(
                $issue,
                $request->status,
                $request->comment,
                $request->user()?->id
            );
        });

        return new IssueResource($issue->fresh()->load(['village', 'edge', 'updates.user', 'complaint']));
    }
}
