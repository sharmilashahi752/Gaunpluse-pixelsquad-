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
        $query = Issue::with(['village', 'edge', 'reporter', 'priorityScore', 'complaint.media', 'updates.user'])->latest();
        $user = $request->user();

        // Multi-municipality & ward scoping
        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            if ($user->isWardOfficer()) {
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) use ($user) {
                        $sub->where('issues.municipality_id', (string) $user->municipality_id)
                            ->where('issues.ward_no', (string) $user->ward_number);
                    })->orWhereHas('village', function ($v) use ($user) {
                        $v->where('municipality_id', (string) $user->municipality_id)
                          ->where('ward_no', (string) $user->ward_number);
                    });
                });
            } elseif ($user->isMunicipalityAdmin()) {
                $query->where(function ($q) use ($user) {
                    $q->where('issues.municipality_id', (string) $user->municipality_id)
                      ->orWhereHas('village', function ($v) use ($user) {
                          $v->where('municipality_id', (string) $user->municipality_id);
                      });
                });
            }
        } elseif ($request->filled('municipality_id')) {
            $mId = $request->input('municipality_id');
            $query->where(function ($q) use ($mId) {
                $q->where('issues.municipality_id', (string) $mId)
                  ->orWhereHas('village', function ($v) use ($mId) {
                      $v->where('municipality_id', (string) $mId);
                  });
            });
        }

        // Pending Verification Queue Filter
        if ($request->boolean('pending_only') || $request->input('queue') === 'pending') {
            $query->whereIn('status', ['submitted', 'pending_verification']);
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
        $issueMuniId = $issue->municipality_id ?? $issue->village?->municipality_id;
        $issueWardNo = $issue->ward_no ?? $issue->village?->ward_no;

        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            if ($user->isMunicipalityAdmin()) {
                abort_unless((string) $issueMuniId === (string) $user->municipality_id, 403, 'Cross-municipality access denied.');
            } elseif ($user->isWardOfficer()) {
                abort_unless(
                    (string) $issueMuniId === (string) $user->municipality_id &&
                    (string) $issueWardNo === (string) $user->ward_number,
                    403,
                    'Cross-ward access denied.'
                );
            }
        }

        return new IssueResource($issue->load(['village', 'edge', 'reporter', 'updates.user', 'priorityScore', 'complaint.media']));
    }

    public function updateStatus(UpdateIssueStatusRequest $request, Issue $issue)
    {
        $user = $request->user();
        $issueMuniId = $issue->municipality_id ?? $issue->village?->municipality_id;
        $issueWardNo = $issue->ward_no ?? $issue->village?->ward_no;

        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            if ($user->isMunicipalityAdmin()) {
                abort_unless((string) $issueMuniId === (string) $user->municipality_id, 403, 'Cross-municipality issue modification denied.');
            } elseif ($user->isWardOfficer()) {
                abort_unless(
                    (string) $issueMuniId === (string) $user->municipality_id &&
                    (string) $issueWardNo === (string) $user->ward_number,
                    403,
                    'Cross-ward issue modification denied.'
                );
            }
        }

        DB::transaction(function () use ($request, $issue, $user, $issueMuniId) {
            $old = $issue->status;
            $newStatus = $request->status;

            $updatePayload = ['status' => $newStatus];
            if ($newStatus === 'verified') {
                $updatePayload['verified_by'] = $user?->id;
                $updatePayload['verified_at'] = now();
                $updatePayload['verification_notes'] = $request->input('verification_notes', $request->comment);
            } elseif ($newStatus === 'rejected') {
                $updatePayload['rejection_reason'] = $request->input('rejection_reason', $request->comment);
            }
            $issue->update($updatePayload);

            $updateData = ['issue_id' => $issue->id];
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'status')) {
                $updateData['status'] = $newStatus;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'comment')) {
                $updateData['comment'] = $request->comment ?? $request->verification_notes ?? $request->rejection_reason;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'updated_by')) {
                $updateData['updated_by'] = $user?->name ?? 'Municipal Officer';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'old_status')) {
                $updateData['old_status'] = $old;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'new_status')) {
                $updateData['new_status'] = $newStatus;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'user_id')) {
                $updateData['user_id'] = $user?->id ?? 1;
            }
            IssueUpdate::create($updateData);

            $actionType = match ($newStatus) {
                'verified' => 'issue_verified',
                'rejected' => 'issue_rejected',
                default => 'issue_status_updated',
            };

            AuditLog::record(
                actionType: $actionType,
                entityType: 'issue',
                entityId: $issue->id,
                summary: "Staff {$user?->name} marked issue #{$issue->id} as {$newStatus}.",
                details: [
                    'old_status' => $old,
                    'new_status' => $newStatus,
                    'comment' => $request->comment,
                    'verification_notes' => $request->verification_notes,
                    'rejection_reason' => $request->rejection_reason,
                ],
                villageId: $issue->village_id,
                municipalityId: $issueMuniId ? (int) $issueMuniId : null,
                actor: $user
            );

            CitizenPortalController::syncIssueStatusToComplaint(
                $issue,
                $newStatus,
                $request->comment ?? $request->verification_notes ?? $request->rejection_reason,
                $user?->id
            );
        });

        return new IssueResource($issue->fresh()->load(['village', 'edge', 'updates.user', 'complaint.media']));
    }
}
