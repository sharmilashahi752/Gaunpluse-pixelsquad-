<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Issue;
use App\Models\Municipality;
use App\Models\User;
use App\Models\Village;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkspaceController extends Controller
{
    /**
     * Resolve the active municipality workspace for the current authenticated session.
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $allMunicipalities = Municipality::query()->orderBy('name')->get();

        // 1. System administrators can access any municipality or switch
        if ($user->isSystemAdmin()) {
            $requestedId = $request->input('municipality_id') ?? $request->header('X-Municipality-Id') ?? $user->municipality_id;

            if (!$requestedId || $requestedId === 'all') {
                $allVillages = Village::query()->orderBy('name')->get();
                $allVillageIds = $allVillages->pluck('id')->toArray();
                $activeIssuesCount = Issue::query()
                    ->whereIn('village_id', $allVillageIds)
                    ->whereNotIn('status', ['resolved', 'rejected'])
                    ->count();

                return response()->json([
                    'municipality' => [
                        'id' => 'all',
                        'name' => 'All Municipalities (Nationwide)',
                        'district' => 'All Districts',
                        'province' => 'All Provinces',
                        'ward_count' => 33,
                    ],
                    'status' => 'active',
                    'wards' => range(1, 9),
                    'villages' => $allVillages,
                    'active_issues_count' => $activeIssuesCount,
                    'ward_officers' => [],
                    'ward_officers_count' => 0,
                    'user_role' => $user->role,
                    'user_ward' => null,
                    'can_switch_workspace' => true,
                    'all_municipalities' => $allMunicipalities,
                ]);
            }

            $municipality = $requestedId ? Municipality::find($requestedId) : $allMunicipalities->first();

            if (!$municipality) {
                $municipality = $allMunicipalities->first();
            }
        } else {
            // 2. Municipality Admins and Ward Officers are strictly bound to their assigned municipality
            if (!$user->municipality_id) {
                return response()->json([
                    'municipality' => null,
                    'status' => 'unassigned',
                    'message' => 'No municipality assigned. Please contact a system administrator for assignment.',
                    'all_municipalities' => [],
                    'user' => $user,
                ]);
            }

            // Prevent cross-municipality access attempts
            if ($request->filled('municipality_id') && (int) $request->input('municipality_id') !== (int) $user->municipality_id) {
                abort(403, 'Cross-municipality access denied. You are only authorized to access your assigned municipality.');
            }

            $municipality = Municipality::find($user->municipality_id);

            if (!$municipality) {
                return response()->json([
                    'municipality' => null,
                    'status' => 'unassigned',
                    'message' => 'Your assigned municipality record could not be found.',
                    'all_municipalities' => [],
                    'user' => $user,
                ], 404);
            }
        }

        // Fetch villages within this municipality
        $villagesQuery = Village::query()->where('municipality_id', (string) $municipality->id);

        // If ward officer, further scope villages to assigned ward
        if ($user->isWardOfficer() && $user->ward_number) {
            $villagesQuery->where('ward_no', (string) $user->ward_number);
        }

        $villages = $villagesQuery->orderBy('name')->get();
        $villageIds = $villages->pluck('id')->toArray();

        // Count active issues within this municipality workspace
        $activeIssuesCount = Issue::query()
            ->whereIn('village_id', $villageIds)
            ->whereNotIn('status', ['resolved', 'rejected'])
            ->count();

        // Count assigned ward officers in this municipality
        $wardOfficers = User::query()
            ->where('municipality_id', $municipality->id)
            ->where('role', User::ROLE_WARD_OFFICER)
            ->where('is_active', true)
            ->get(['id', 'name', 'email', 'ward_number', 'contact_number']);

        $wardsCount = max(1, (int) ($municipality->ward_count ?? 1));
        $wards = range(1, $wardsCount);

        return response()->json([
            'municipality' => $municipality,
            'status' => 'active',
            'wards' => $wards,
            'villages' => $villages,
            'active_issues_count' => $activeIssuesCount,
            'ward_officers' => $wardOfficers,
            'ward_officers_count' => $wardOfficers->count(),
            'user_role' => $user->role,
            'user_ward' => $user->ward_number,
            'can_switch_workspace' => $user->isSystemAdmin(),
            'all_municipalities' => $user->isSystemAdmin() ? $allMunicipalities : [],
        ]);
    }

    /**
     * List all municipalities (for administrative selection & assignment).
     */
    public function index(Request $request): JsonResponse
    {
        $municipalities = Municipality::query()
            ->withCount(['villages', 'users'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'municipalities' => $municipalities,
        ]);
    }

    /**
     * Create a new Municipality (System Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSystemAdmin(), 403, 'Only system administrators can register new municipalities.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:municipalities,name'],
            'code' => ['required', 'string', 'max:50', 'unique:municipalities,code'],
            'district' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'type' => ['required', 'string', Rule::in(['municipality', 'rural_municipality', 'metropolitan', 'sub_metropolitan'])],
            'ward_count' => ['required', 'integer', 'between:1,40'],
            'center_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'center_lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $municipality = Municipality::create($validated);

        AuditLog::record(
            actionType: 'municipality_created',
            entityType: 'municipality',
            entityId: $municipality->id,
            summary: "Municipality {$municipality->name} registered.",
            details: $validated,
            municipalityId: $municipality->id,
            actor: $request->user()
        );

        return response()->json([
            'message' => 'Municipality registered successfully.',
            'municipality' => $municipality,
        ], 201);
    }

    /**
     * Update Municipality Details (System Admin or assigned Municipality Admin).
     */
    public function update(Request $request, Municipality $municipality): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user->isSystemAdmin() || ($user->isMunicipalityAdmin() && (int) $user->municipality_id === (int) $municipality->id),
            403,
            'You do not have permission to modify this municipality workspace.'
        );

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('municipalities')->ignore($municipality->id)],
            'district' => ['sometimes', 'required', 'string', 'max:100'],
            'province' => ['sometimes', 'required', 'string', 'max:100'],
            'ward_count' => ['sometimes', 'required', 'integer', 'between:1,40'],
            'center_lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'center_lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
        ]);

        $municipality->update($validated);

        AuditLog::record(
            actionType: 'municipality_updated',
            entityType: 'municipality',
            entityId: $municipality->id,
            summary: "Municipality {$municipality->name} configuration updated.",
            details: $validated,
            municipalityId: $municipality->id,
            actor: $user
        );

        return response()->json([
            'message' => 'Municipality updated successfully.',
            'municipality' => $municipality,
        ]);
    }
}
