<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Citizen\CitizenPortalController;
use App\Http\Requests\UpdateIssueStatusRequest;
use App\Http\Resources\IssueResource;
use App\Models\AuditLog;
use App\Models\Issue;
use App\Models\IssueUpdate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminIssueController extends Controller
{
    public function index(Request $request)
    {
        $query = Issue::with(['village', 'edge', 'reporter', 'priorityScore', 'complaint'])->latest();
        $user = $request->user();

        // Multi-municipality & ward scoping
        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            if ($user->isWardOfficer()) {
                $query->whereHas('village', function ($q) use ($user) {
                    $q->where('municipality_id', (string) $user->municipality_id)
                      ->where('ward_no', (string) $user->ward_number);
                });
            } elseif ($user->isMunicipalityAdmin()) {
                $query->whereHas('village', function ($q) use ($user) {
                    $q->where('municipality_id', (string) $user->municipality_id);
                });
            }
        } elseif ($request->filled('municipality_id')) {
            $query->whereHas('village', function ($q) use ($request) {
                $q->where('municipality_id', (string) $request->input('municipality_id'));
            });
        }

        foreach (['category', 'severity', 'status', 'village_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        return IssueResource::collection($query->paginate(50));
    }

    public function show(Request $request, Issue $issue)
    {
        $user = $request->user();
        if ($user && $user->isStaff() && !$user->isSystemAdmin() && $issue->village) {
            if ($user->isMunicipalityAdmin()) {
                abort_unless((string) $issue->village->municipality_id === (string) $user->municipality_id, 403, 'Cross-municipality access denied.');
            } elseif ($user->isWardOfficer()) {
                abort_unless(
                    (string) $issue->village->municipality_id === (string) $user->municipality_id &&
                    (string) $issue->village->ward_no === (string) $user->ward_number,
                    403,
                    'Cross-ward access denied.'
                );
            }
        }

        return new IssueResource($issue->load(['village', 'edge', 'reporter', 'updates.user', 'priorityScore', 'complaint']));
    }

    public function updateStatus(UpdateIssueStatusRequest $request, Issue $issue)
    {
        $user = $request->user();
        if ($user && $user->isStaff() && !$user->isSystemAdmin() && $issue->village) {
            if ($user->isMunicipalityAdmin()) {
                abort_unless((string) $issue->village->municipality_id === (string) $user->municipality_id, 403, 'Cross-municipality issue modification denied.');
            } elseif ($user->isWardOfficer()) {
                abort_unless(
                    (string) $issue->village->municipality_id === (string) $user->municipality_id &&
                    (string) $issue->village->ward_no === (string) $user->ward_number,
                    403,
                    'Cross-ward issue modification denied.'
                );
            }
        }

        DB::transaction(function () use ($request, $issue, $user) {
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
                $updateData['updated_by'] = $user?->name ?? 'Municipal Officer';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'old_status')) {
                $updateData['old_status'] = $old;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'new_status')) {
                $updateData['new_status'] = $request->status;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'user_id')) {
                $updateData['user_id'] = $user?->id ?? 1;
            }
            IssueUpdate::create($updateData);

            AuditLog::record(
                actionType: 'issue_status_updated',
                entityType: 'issue',
                entityId: $issue->id,
                summary: "Admin updated issue '{$issue->title}' to {$request->status}.",
                details: ['old_status' => $old, 'new_status' => $request->status, 'comment' => $request->comment],
                villageId: $issue->village_id,
                municipalityId: $issue->village?->municipality_id ? (int) $issue->village->municipality_id : null,
                actor: $user
            );

            CitizenPortalController::syncIssueStatusToComplaint(
                $issue,
                $request->status,
                $request->comment,
                $user?->id
            );
        });

        return new IssueResource($issue->fresh()->load(['village', 'edge', 'updates.user', 'complaint']));
    }
}
