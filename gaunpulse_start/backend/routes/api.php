<?php

use App\Http\Controllers\ActionPlanController;
use App\Http\Controllers\Admin\AdminIssueController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PriorityController;
use App\Http\Controllers\Admin\SimulationController as AdminSimulationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommunityFeedbackController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\VillageController;
use App\Models\ActionPlan;
use App\Models\CommunityFeedback;
use App\Models\Issue;
use App\Models\SettlementGroup;
use App\Models\Village;
use Illuminate\Support\Facades\Route;

// Public / Demo Village & Network Routes
Route::get('/villages', [VillageController::class, 'index']);
Route::get('/villages/{village}/network', [VillageController::class, 'network']);

// Public / Demo Issues Routes
Route::get('/issues', [IssueController::class, 'index']);
Route::get('/issues/{issue}', [IssueController::class, 'show']);
Route::post('/issues', [IssueController::class, 'store'])->middleware('throttle:30,1');
Route::patch('/issues/{issue}/status', [IssueController::class, 'updateStatus']);

// Public / Demo Action Plans Routes
Route::get('/action-plans', [ActionPlanController::class, 'index']);
Route::get('/action-plans/{actionPlan}', [ActionPlanController::class, 'show']);
Route::post('/action-plans', [ActionPlanController::class, 'store']);
Route::put('/action-plans/{actionPlan}', [ActionPlanController::class, 'update']);
Route::patch('/action-plans/{actionPlan}/progress', [ActionPlanController::class, 'updateProgress']);
Route::delete('/action-plans/{actionPlan}', [ActionPlanController::class, 'destroy']);

// Public / Demo Community Feedback Routes
Route::get('/feedback', [CommunityFeedbackController::class, 'index']);
Route::post('/feedback', [CommunityFeedbackController::class, 'store']);
Route::patch('/feedback/{feedback}/acknowledge', [CommunityFeedbackController::class, 'acknowledge']);

// Public / Demo Simulation Routes (backed by Python NetworkX engine)
Route::get('/simulations', [SimulationController::class, 'index']);
Route::get('/simulations/{simulation}', [SimulationController::class, 'show']);
Route::post('/simulations', [SimulationController::class, 'store']);
Route::post('/simulations/compare', [SimulationController::class, 'compare']);

// Public Priority Ranking Route
Route::get('/priorities', PriorityController::class);

// Public Dashboard Real-Time Statistics
Route::get('/dashboard/stats', function () {
    $activeCount = Issue::whereNotIn('status', ['resolved', 'rejected'])->count();
    $criticalCount = Issue::where('severity', 'critical')->whereNotIn('status', ['resolved', 'rejected'])->count();
    $resolvedCount = Issue::where('status', 'resolved')->count();
    $totalHouseholds = SettlementGroup::sum('households') ?: 186;

    return response()->json([
        'monitored_villages' => Village::count(),
        'active_issues' => $activeCount,
        'critical_disruptions' => $criticalCount,
        'affected_households' => $totalHouseholds,
        'resolved_issues' => $resolvedCount,
        'total_action_plans' => ActionPlan::count(),
        'action_plans_in_progress' => ActionPlan::where('status', 'in_progress')->count(),
        'community_voices_count' => CommunityFeedback::count(),
    ]);
});

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', DashboardController::class);
        Route::get('/issues', [AdminIssueController::class, 'index']);
        Route::get('/issues/{issue}', [AdminIssueController::class, 'show']);
        Route::patch('/issues/{issue}/status', [AdminIssueController::class, 'updateStatus']);
        Route::post('/simulations', [SimulationController::class, 'store']);
        Route::post('/simulations/compare', [SimulationController::class, 'compare']);
        Route::get('/priorities', PriorityController::class);
    });
});
