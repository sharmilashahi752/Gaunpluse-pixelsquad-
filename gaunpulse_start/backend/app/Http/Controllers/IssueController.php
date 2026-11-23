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
        $perPage = min(max($request->integer('per_page', 20), 5), 100);

        $query = Issue::with([
            'village:id,name,municipality_id,ward_no,municipality',
            'edge:id,name,infrastructure_type',
            'complaint:id,complaint_number,ward_number,settlement_name,status,speech_transcript',
            'complaint.media:id,complaint_id,media_type',
        ])->latest();

        // Multi-municipality & ward scoping
        $user = $request->user('sanctum') ?? $request->user();
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

        if ($request->boolean('pending_only') || $request->input('queue') === 'pending') {
            $query->whereIn('status', ['submitted', 'pending_verification']);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                  ->orWhere('tracking_code', 'like', $term)
                  ->orWhere('settlement_name', 'like', $term);
            });
        }

        foreach (['category', 'severity', 'status', 'village_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        return IssueResource::collection($query->paginate($perPage));
    }

    public function show(Request $request, Issue $issue)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $issueMuniId = $issue->municipality_id ?? $issue->village?->municipality_id ?? $issue->complaint?->municipality_id;
        $issueWardNo = $issue->ward_no ?? $issue->village?->ward_no ?? $issue->complaint?->ward_number;

        if ($user && $user->isStaff() && !$user->isSystemAdmin()) {
            if ($user->isMunicipalityAdmin()) {
                if ($issueMuniId !== null) {
                    abort_unless((string) $issueMuniId === (string) $user->municipality_id, 403, 'Cross-municipality access denied.');
                }
            } elseif ($user->isWardOfficer()) {
                if ($issueMuniId !== null && $issueWardNo !== null) {
                    abort_unless(
                        (string) $issueMuniId === (string) $user->municipality_id &&
                        (string) $issueWardNo === (string) $user->ward_number,
                        403,
                        'Cross-ward access denied.'
                    );
                }
            }
        }

        return new IssueResource($issue->load([
            'village',
            'edge',
            'updates.user',
            'complaint.media',
            'priorityScore',
            'reporter',
            'verifier',
        ]));
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
        if (!$user || !$user->isStaff()) {
            abort(403, 'Unauthorized. Official municipal staff credentials are required.');
        }

        $issueMuniId = $issue->municipality_id ?? $issue->village?->municipality_id ?? $issue->complaint?->municipality_id;
        $issueWardNo = $issue->ward_no ?? $issue->village?->ward_no ?? $issue->complaint?->ward_number;

        if ($user->isStaff() && !$user->isSystemAdmin()) {
            if ($user->isMunicipalityAdmin()) {
                if ($issueMuniId !== null) {
                    abort_unless((string) $issueMuniId === (string) $user->municipality_id, 403, 'Cross-municipality issue modification denied.');
                }
            } elseif ($user->isWardOfficer()) {
                if ($issueMuniId !== null && $issueWardNo !== null) {
                    abort_unless(
                        (string) $issueMuniId === (string) $user->municipality_id &&
                        (string) $issueWardNo === (string) $user->ward_number,
                        403,
                        'Cross-ward issue modification denied.'
                    );
                }
            }
        }

        $validated = $request->validate([
            'status' => 'required|in:submitted,pending_verification,under_review,verified,in_progress,resolved,rejected,more_information_needed',
            'comment' => 'nullable|string|max:2000',
            'verification_notes' => 'nullable|string|max:2000',
            'rejection_reason' => 'nullable|string|max:2000',
            'village_id' => 'nullable|integer|exists:villages,id',
        ]);

        $currentStatus = $issue->status;
        $newStatus = $validated['status'];

        // 1. Prevent invalid verification attempts
        if ($newStatus === 'verified') {
            if (!in_array($currentStatus, ['submitted', 'pending_verification', 'under_review', 'more_information_needed'], true)) {
                if ($currentStatus === 'verified') {
                    abort(422, 'This report has already been verified on-site.');
                }
                if ($currentStatus === 'rejected') {
                    abort(422, 'A rejected report cannot be verified directly.');
                }
                if ($currentStatus === 'resolved') {
                    abort(422, 'This issue has already been resolved.');
                }
                abort(422, "Cannot verify issue with status: {$currentStatus}");
            }
        }

        // 2. Prevent skipping straight to repair lifecycle without verification
        if (in_array($newStatus, ['in_progress', 'resolved'], true)) {
            if (in_array($currentStatus, ['submitted', 'pending_verification', 'more_information_needed'], true)) {
                abort(422, 'Initial complaint verification is required before initiating repairs or marking the issue resolved.');
            }
        }

        // 3. Prevent reopening terminal rejected state without under_review
        if ($currentStatus === 'rejected' && !in_array($newStatus, ['rejected', 'under_review'], true)) {
            abort(422, 'A closed/rejected report must be moved to under review before transitioning to other statuses.');
        }

        // 4. Validate rejection reason
        $rejectionReason = trim($request->input('rejection_reason', $request->input('comment', '')));
        if ($newStatus === 'rejected' && empty($rejectionReason)) {
            abort(422, 'Please provide a reason for rejecting this report.');
        }

        // 5. Validate more information needed explanation
        $infoNotes = trim($request->input('comment', $request->input('verification_notes', '')));
        if ($newStatus === 'more_information_needed' && empty($infoNotes)) {
            abort(422, 'Please provide notes explaining what additional information is required from the resident.');
        }

        DB::transaction(function () use ($issue, $validated, $request, $user, $currentStatus, $newStatus, $rejectionReason, $infoNotes, $issueMuniId) {
            $updatePayload = ['status' => $newStatus];
            if (in_array($newStatus, ['verified', 'in_progress', 'resolved'], true) && ($newStatus === 'verified' || !$issue->verified_at)) {
                $updatePayload['verified_by'] = $user?->id;
                $updatePayload['verified_at'] = now();
                $updatePayload['verification_notes'] = $request->input('verification_notes', $validated['comment'] ?? 'Verified on-site by municipal technical staff.');
            } elseif ($newStatus === 'rejected') {
                $updatePayload['rejection_reason'] = $rejectionReason;
            }

            if (array_key_exists('village_id', $validated)) {
                $targetVillageId = $validated['village_id'] ? (int) $validated['village_id'] : null;
                $updatePayload['village_id'] = $targetVillageId;
                if ($targetVillageId) {
                    $targetVillage = \App\Models\Village::find($targetVillageId);
                    if ($targetVillage) {
                        $updatePayload['municipality_id'] = $targetVillage->municipality_id;
                        $updatePayload['ward_no'] = $targetVillage->ward_no;
                    }
                }
            }
            if (empty($issue->municipality_id) && !isset($updatePayload['municipality_id']) && $user?->municipality_id) {
                $updatePayload['municipality_id'] = $user->municipality_id;
            }

            $issue->update($updatePayload);

            if (array_key_exists('village_id', $validated) && $issue->complaint) {
                $issue->complaint->village_id = $updatePayload['village_id'];
                if (isset($updatePayload['municipality_id'])) {
                    $issue->complaint->municipality_id = $updatePayload['municipality_id'];
                }
                if (isset($updatePayload['ward_no'])) {
                    $issue->complaint->ward_number = $updatePayload['ward_no'];
                }
                $issue->complaint->save();
            }

            $commentOrNotes = match ($newStatus) {
                'verified' => $request->input('verification_notes', $validated['comment'] ?? 'Verified on-site by municipal technical staff.'),
                'rejected' => $rejectionReason,
                'more_information_needed' => $infoNotes,
                default => $validated['comment'] ?? "Status updated from {$currentStatus} to {$newStatus}",
            };

            $updateData = ['issue_id' => $issue->id];
            if (Schema::hasColumn('issue_updates', 'status')) {
                $updateData['status'] = $newStatus;
            }
            if (Schema::hasColumn('issue_updates', 'comment')) {
                $updateData['comment'] = $commentOrNotes;
            }
            if (Schema::hasColumn('issue_updates', 'updated_by')) {
                $updateData['updated_by'] = $user?->name ?? 'Municipal Officer';
            }
            if (Schema::hasColumn('issue_updates', 'old_status')) {
                $updateData['old_status'] = $currentStatus;
            }
            if (Schema::hasColumn('issue_updates', 'new_status')) {
                $updateData['new_status'] = $newStatus;
            }
            if (Schema::hasColumn('issue_updates', 'user_id')) {
                $updateData['user_id'] = $user?->id ?? 1;
            }

            IssueUpdate::create($updateData);

            $actionType = match ($newStatus) {
                'verified' => 'issue_verified',
                'rejected' => 'issue_rejected',
                'more_information_needed' => 'issue_info_requested',
                default => 'issue_status_updated',
            };

            AuditLog::record(
                actionType: $actionType,
                entityType: 'issue',
                entityId: $issue->id,
                summary: "Staff {$user?->name} marked issue '{$issue->title}' as {$newStatus}.",
                details: [
                    'old_status' => $currentStatus,
                    'new_status' => $newStatus,
                    'comment' => $commentOrNotes,
                    'village_id' => $issue->village_id,
                ],
                villageId: $issue->village_id,
                municipalityId: $issueMuniId ? (int) $issueMuniId : null,
                actor: $user
            );

            CitizenPortalController::syncIssueStatusToComplaint(
                $issue,
                $newStatus,
                $commentOrNotes,
                $user?->id
            );
        });

        return new IssueResource($issue->fresh()->load(['village', 'edge', 'verifier', 'updates.user', 'complaint.media']));
    }
}
