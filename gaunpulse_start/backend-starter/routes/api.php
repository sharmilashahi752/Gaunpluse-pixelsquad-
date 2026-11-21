<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Copy this file into a newly generated Laravel backend after running:
// php artisan install:api
// This intentionally contains no public administrative write endpoints.

Route::get('/health', fn () => response()->json(['status' => 'ok', 'service' => 'gaunpulse-laravel']));

Route::get('/dashboard', function () {
    return response()->json([
        'demo' => true,
        'monitored_villages' => 1,
        'active_issues' => 3,
        'critical_disruptions' => 1,
        'affected_households' => 20,
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    // Implement policies / authorization for each role before adding write routes.
    Route::get('/me', fn (Request $request) => $request->user());
});
