<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Municipality;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    /**
     * List users with role filtering, search, and strict municipality scoping.
     */
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless(
            $actor->isSystemAdmin() || $actor->isMunicipalityAdmin(),
            403,
            'Only administrators can view user management records.'
        );

        $query = User::with('municipality:id,name,code,district,ward_count')->latest('id');

        // Scoping: Municipality Admins ONLY see users belonging to their assigned municipality
        if (!$actor->isSystemAdmin()) {
            $query->where('municipality_id', $actor->municipality_id);
        } elseif ($request->filled('municipality_id')) {
            $query->where('municipality_id', $request->input('municipality_id'));
        }

        // Search filter (name or email)
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($role = $request->string('role')->toString()) {
            if ($role !== 'all') {
                $query->where('role', $role);
            }
        }

        // Status filter (active/inactive)
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        // Ward filter
        if ($request->filled('ward_number') && $request->input('ward_number') !== 'all') {
            $query->where('ward_number', $request->input('ward_number'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 20))
        );
    }

    /**
     * Show single user details.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeAccess($request->user(), $user);

        return response()->json([
            'user' => $user->load('municipality'),
            'audit_logs' => AuditLog::where('user_id', $user->id)->latest()->limit(10)->get(),
        ]);
    }

    /**
     * Assign Authorized Role to a User.
     */
    public function assignRole(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeAccess($actor, $user);

        // Prevent users from changing their own role
        if ((int) $actor->id === (int) $user->id) {
            throw ValidationException::withMessages([
                'role' => ['You cannot change your own administrative role.'],
            ]);
        }

        $validated = $request->validate([
            'role' => [
                'required',
                'string',
                Rule::in([
                    User::ROLE_CITIZEN,
                    User::ROLE_WARD_OFFICER,
                    User::ROLE_MUNICIPALITY_ADMIN,
                    User::ROLE_SYSTEM_ADMIN,
                ]),
            ],
        ]);

        $newRole = $validated['role'];

        // Privilege Escalation Prevention:
        // Municipality Admins CANNOT promote someone to System Admin or Municipality Admin
        if (!$actor->isSystemAdmin()) {
            if (in_array($newRole, [User::ROLE_SYSTEM_ADMIN, User::ROLE_MUNICIPALITY_ADMIN], true)) {
                abort(403, 'Privilege escalation blocked. Only system administrators can appoint administrators.');
            }
            if ($user->isSystemAdmin()) {
                abort(403, 'You do not have permission to modify a system administrator.');
            }
        }

        $oldRole = $user->role;
        $user->update(['role' => $newRole]);

        AuditLog::record(
            actionType: 'role_changed',
            entityType: 'user',
            entityId: $user->id,
            summary: "Role for {$user->name} changed from '{$oldRole}' to '{$newRole}'.",
            details: ['old_role' => $oldRole, 'new_role' => $newRole],
            municipalityId: $user->municipality_id,
            actor: $actor
        );

        return response()->json([
            'message' => "Role updated to {$newRole} successfully.",
            'user' => $user->fresh('municipality'),
        ]);
    }

    /**
     * Assign Ward Officer to a specific Ward Number.
     */
    public function assignWard(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeAccess($actor, $user);

        // Ensure user is assigned to a municipality
        $municipality = $user->municipality_id ? Municipality::find($user->municipality_id) : null;
        $maxWard = $municipality ? (int) $municipality->ward_count : 33;

        $validated = $request->validate([
            'ward_number' => ['required', 'integer', "between:1,{$maxWard}"],
        ]);

        $oldWard = $user->ward_number;
        $newWard = (int) $validated['ward_number'];

        // If user was citizen, optionally set role to ward_officer if requested
        $updates = ['ward_number' => $newWard];
        if ($user->role === User::ROLE_CITIZEN) {
            $updates['role'] = User::ROLE_WARD_OFFICER;
        }

        $user->update($updates);

        AuditLog::record(
            actionType: 'ward_assigned',
            entityType: 'user',
            entityId: $user->id,
            summary: "Assigned officer {$user->name} to Ward {$newWard}" . ($oldWard ? " (previously Ward {$oldWard})" : '') . '.',
            details: ['old_ward' => $oldWard, 'new_ward' => $newWard],
            municipalityId: $user->municipality_id,
            actor: $actor
        );

        return response()->json([
            'message' => "Officer successfully assigned to Ward {$newWard}.",
            'user' => $user->fresh('municipality'),
        ]);
    }

    /**
     * Remove Ward Officer's Ward Assignment.
     */
    public function removeWard(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeAccess($actor, $user);

        $oldWard = $user->ward_number;
        $user->update(['ward_number' => null]);

        AuditLog::record(
            actionType: 'ward_unassigned',
            entityType: 'user',
            entityId: $user->id,
            summary: "Removed Ward {$oldWard} assignment from {$user->name}.",
            details: ['old_ward' => $oldWard],
            municipalityId: $user->municipality_id,
            actor: $actor
        );

        return response()->json([
            'message' => 'Ward assignment removed.',
            'user' => $user->fresh('municipality'),
        ]);
    }

    /**
     * Assign User to a Municipality Workspace (System Admin or Muni Admin for staff).
     */
    public function assignMunicipality(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->isSystemAdmin(), 403, 'Only system administrators can allocate users to municipalities.');

        $validated = $request->validate([
            'municipality_id' => ['nullable', 'exists:municipalities,id'],
        ]);

        $oldMuniId = $user->municipality_id;
        $newMuniId = $validated['municipality_id'];

        $user->update(['municipality_id' => $newMuniId]);

        AuditLog::record(
            actionType: 'municipality_assigned',
            entityType: 'user',
            entityId: $user->id,
            summary: "Municipality workspace for {$user->name} changed.",
            details: ['old_municipality_id' => $oldMuniId, 'new_municipality_id' => $newMuniId],
            municipalityId: $newMuniId,
            actor: $actor
        );

        return response()->json([
            'message' => 'Municipality assignment updated.',
            'user' => $user->fresh('municipality'),
        ]);
    }

    /**
     * Toggle Account Active / Inactive Status (Deactivate / Reactivate).
     */
    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeAccess($actor, $user);

        // Cannot deactivate self
        if ((int) $actor->id === (int) $user->id) {
            abort(422, 'You cannot deactivate your own account.');
        }

        // Municipality admin cannot deactivate system admins
        if (!$actor->isSystemAdmin() && $user->isSystemAdmin()) {
            abort(403, 'You do not have permission to modify a system administrator.');
        }

        $newStatus = !(bool) $user->is_active;
        $user->update(['is_active' => $newStatus]);

        // If deactivated, revoke all live Sanctum tokens immediately
        if (!$newStatus) {
            $user->tokens()->delete();
        }

        $actionWord = $newStatus ? 'activated' : 'deactivated';

        AuditLog::record(
            actionType: 'user_status_changed',
            entityType: 'user',
            entityId: $user->id,
            summary: "Account for {$user->name} was {$actionWord}.",
            details: ['is_active' => $newStatus],
            municipalityId: $user->municipality_id,
            actor: $actor
        );

        return response()->json([
            'message' => "Account {$actionWord} successfully.",
            'user' => $user->fresh('municipality'),
        ]);
    }

    /**
     * List all Ward Officers in the active Municipality.
     */
    public function wardOfficers(Request $request): JsonResponse
    {
        $actor = $request->user();
        $muniId = $actor->isSystemAdmin()
            ? ($request->input('municipality_id') ?? $actor->municipality_id ?? 1)
            : $actor->municipality_id;

        $officers = User::query()
            ->where('municipality_id', $muniId)
            ->where('role', User::ROLE_WARD_OFFICER)
            ->orderBy('ward_number')
            ->get(['id', 'name', 'email', 'ward_number', 'contact_number', 'is_active', 'created_at']);

        return response()->json([
            'officers' => $officers,
        ]);
    }

    /**
     * Security check ensuring non-system-admins can only manage users in their own municipality.
     */
    private function authorizeAccess(User $actor, User $target): void
    {
        if ($actor->isSystemAdmin()) {
            return;
        }

        if (!$actor->isMunicipalityAdmin()) {
            abort(403, 'Unauthorized access to user management.');
        }

        if ((int) $actor->municipality_id !== (int) $target->municipality_id) {
            abort(403, 'You can only manage users within your assigned municipality.');
        }
    }
}
