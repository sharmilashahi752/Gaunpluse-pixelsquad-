<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (isset($user->is_active) && !$user->is_active) {
            abort(403, 'Your account has been deactivated.');
        }

        abort_unless(
            $user->isAdmin(),
            403,
            'Municipal administrator access is required.'
        );

        return $next($request);
    }
}
