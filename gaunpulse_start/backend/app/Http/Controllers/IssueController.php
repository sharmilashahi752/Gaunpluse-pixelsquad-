<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Citizen\CitizenPortalController;
use App\Http\Requests\StoreIssueRequest;
use App\Http\Resources\IssueResource;
use App\Models\AuditLog;
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

        // Multi-municipality & ward scoping
        $user = $request->user('sanctum') ?? $request->user();
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
        return IssueResource::collection($query->paginate(30));
    }

    public function show(Request $request, Issue $issue)
    {
        $user = $request->user('sanctum') ?? $request->user();
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
        $user = $request->user('sanctum') ?? $request->user();
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

        $validated = $request->validate([
            'status' => 'required|in:submitted,under_review,verified,in_progress,resolved,rejected',
            'comment' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($issue, $validated, $request, $user) {
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
                $updateData['updated_by'] = $user?->name ?? 'Municipal Officer';
            }
            if (Schema::hasColumn('issue_updates', 'old_status')) {
                $updateData['old_status'] = $oldStatus;
            }
            if (Schema::hasColumn('issue_updates', 'new_status')) {
                $updateData['new_status'] = $validated['status'];
            }
            if (Schema::hasColumn('issue_updates', 'user_id')) {
                $updateData['user_id'] = $user?->id ?? 1;
            }

            IssueUpdate::create($updateData);

            AuditLog::record(
                actionType: 'issue_status_updated',
                entityType: 'issue',
                entityId: $issue->id,
                summary: "Issue '{$issue->title}' status changed from {$oldStatus} to {$validated['status']}.",
                details: ['old_status' => $oldStatus, 'new_status' => $validated['status'], 'comment' => $validated['comment'] ?? null],
                villageId: $issue->village_id,
                municipalityId: $issue->village?->municipality_id ? (int) $issue->village->municipality_id : null,
                actor: $user
            );

            CitizenPortalController::syncIssueStatusToComplaint(
                $issue,
                $validated['status'],
                $validated['comment'] ?? null,
                $user?->id
            );
        });

        return new IssueResource($issue->fresh()->load(['village', 'edge', 'updates']));
    }
}
