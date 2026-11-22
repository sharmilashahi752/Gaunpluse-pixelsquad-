<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && isset($user->is_active) && !$user->is_active) {
            $user->currentAccessToken()?->delete();
            abort(403, 'Your account has been deactivated. Please contact your municipal administrator.');
        }

        return $next($request);
    }
}
