<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (isset($user->is_active) && !$user->is_active) {
            abort(403, 'Your account has been deactivated.');
        }

        if (empty($roles)) {
            return $next($request);
        }

        // Support aliases like 'admin' covering system_admin and municipality_admin
        $allowed = [];
        foreach ($roles as $role) {
            if ($role === 'admin') {
                $allowed = array_merge($allowed, ['system_admin', 'municipality_admin', 'admin']);
            } elseif ($role === 'staff') {
                $allowed = array_merge($allowed, ['system_admin', 'municipality_admin', 'ward_officer', 'admin']);
            } else {
                $allowed[] = $role;
            }
        }

        if (!in_array($user->role, $allowed, true)) {
            abort(403, 'You do not have permission to access this administrative resource.');
        }

        return $next($request);
    }
}
