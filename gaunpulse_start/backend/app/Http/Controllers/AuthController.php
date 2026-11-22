<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Municipality;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Unified Secure Login for Municipal Staff, Admins, and Citizens.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Account Active Check
        if (isset($user->is_active) && !$user->is_active) {
            abort(403, 'Your account has been deactivated. Please contact your municipal administrator.');
        }

        $tokenName = match ($user->role) {
            User::ROLE_SYSTEM_ADMIN => 'gaunpulse-sysadmin',
            User::ROLE_MUNICIPALITY_ADMIN => 'gaunpulse-muniadmin',
            User::ROLE_WARD_OFFICER => 'gaunpulse-wardofficer',
            default => 'gaunpulse-citizen',
        };

        $token = $user->createToken($tokenName)->plainTextToken;

        AuditLog::record(
            actionType: 'login',
            entityType: 'user',
            entityId: $user->id,
            summary: "User {$user->name} logged in successfully.",
            actor: $user
        );

        return response()->json([
            'token' => $token,
            'user' => $user->load('municipality'),
            'role' => $user->role,
            'redirect_route' => match ($user->role) {
                User::ROLE_CITIZEN => 'citizen',
                User::ROLE_WARD_OFFICER => 'dashboard',
                User::ROLE_MUNICIPALITY_ADMIN => 'dashboard',
                User::ROLE_SYSTEM_ADMIN => 'dashboard',
                'admin' => 'dashboard',
                default => $user->isStaff() ? 'dashboard' : 'citizen',
            },
            'message' => 'Logged in successfully.',
        ]);
    }

    /**
     * Terminate Current Token Session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            AuditLog::record(
                actionType: 'logout',
                entityType: 'user',
                entityId: $user->id,
                summary: "User {$user->name} logged out.",
                actor: $user
            );
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get Current Authenticated User with Scope.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user()->load('municipality');

        return response()->json([
            'user' => $user,
            'permissions' => [
                'can_manage_users' => $user->isSystemAdmin() || $user->isMunicipalityAdmin(),
                'can_manage_infrastructure' => $user->isAdmin(),
                'can_review_issues' => $user->isStaff(),
                'can_switch_workspace' => $user->isSystemAdmin(),
                'assigned_municipality_id' => $user->municipality_id,
                'assigned_ward' => $user->ward_number,
            ],
        ]);
    }

    /**
     * Update Current User Profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'preferred_language' => ['sometimes', 'string', Rule::in(['en', 'ne'])],
            'photo' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }
            $validated['profile_photo_path'] = $request->file('photo')->store('profile-photos', 'public');
        }

        $user->update($validated);

        AuditLog::record(
            actionType: 'profile_updated',
            entityType: 'user',
            entityId: $user->id,
            summary: "User {$user->name} updated profile settings.",
            actor: $user
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh('municipality'),
        ]);
    }

    /**
     * Secure Password Change.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        AuditLog::record(
            actionType: 'password_changed',
            entityType: 'user',
            entityId: $user->id,
            summary: "User {$user->name} changed their password.",
            actor: $user
        );

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Request Password Reset Instructions.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            AuditLog::record(
                actionType: 'password_reset_requested',
                entityType: 'user',
                entityId: $user->id,
                summary: "Password reset requested for {$user->email}.",
                actor: $user
            );
        }

        // Always return clean message to prevent account enumeration
        return response()->json([
            'message' => 'If this email is registered, you will receive password reset instructions.',
        ]);
    }
}
