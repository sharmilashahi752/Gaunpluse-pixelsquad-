<?php

use App\Http\Controllers\ActionPlanController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\Admin\AdminIssueController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PriorityController;
use App\Http\Controllers\Admin\SimulationController as AdminSimulationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Citizen\CitizenPortalController;
use App\Http\Controllers\CommunityFeedbackController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\VillageController;
use App\Models\ActionPlan;
use App\Models\CommunityFeedback;
use App\Models\Issue;
use App\Models\SettlementGroup;
use App\Models\Village;
use Illuminate\Support\Facades\Route;

// Nepal Administrative Location Directory (Phase 2)
Route::get('/locations/hierarchy', [LocationController::class, 'hierarchy']);
Route::get('/locations/provinces', [LocationController::class, 'provinces']);
Route::get('/locations/districts', [LocationController::class, 'districts']);
Route::get('/locations/municipalities', [LocationController::class, 'municipalities']);
Route::get('/locations/wards', [LocationController::class, 'wards']);
Route::get('/locations/search', [LocationController::class, 'search']);

// Public / Demo Village & Network Routes
Route::get('/villages/audit-hierarchy', [VillageController::class, 'auditHierarchy']);
Route::get('/villages/duplicate-audit', [VillageController::class, 'duplicateAudit']);
Route::post('/villages/preview-consolidation', [VillageController::class, 'previewConsolidation']);
Route::post('/villages/consolidate', [VillageController::class, 'consolidateDuplicates']);
Route::get('/villages', [VillageController::class, 'index']);
Route::post('/villages', [VillageController::class, 'store']);
Route::post('/villages/wizard-draft', [VillageController::class, 'storeWizardDraft']);
Route::post('/villages/{village}/activate', [VillageController::class, 'activate']);
Route::post('/villages/{village}/correct-hierarchy', [VillageController::class, 'correctHierarchy']);
Route::match(['patch', 'post'], '/villages/{village}/coordinates', [VillageController::class, 'updateCoordinates']);
Route::get('/villages/{village}', [VillageController::class, 'show']);
Route::put('/villages/{village}', [VillageController::class, 'update']);
Route::delete('/villages/{village}', [VillageController::class, 'destroy']);
Route::get('/villages/{village}/network', [VillageController::class, 'network']);
Route::get('/villages/{village}/network-readiness', [VillageController::class, 'networkReadiness']);
Route::get('/villages/{village}/export-geojson', [VillageController::class, 'exportGeoJson']);
Route::post('/villages/{village}/import-geojson', [VillageController::class, 'importGeoJson']);
Route::post('/villages/{village}/import-csv', [VillageController::class, 'importCsv']);
Route::post('/villages/{village}/import-osm', [VillageController::class, 'importOsm']);
Route::post('/villages/{village}/auto-populate', [VillageController::class, 'autoPopulate']);
Route::get('/villages/{village}/discover-osm', [VillageController::class, 'discoverOsm']);
Route::post('/villages/{village}/confirm-osm-import', [VillageController::class, 'confirmOsmImport']);
Route::get('/villages/{village}/import-history', [VillageController::class, 'importHistory']);
Route::post('/villages/{village}/build-network', [VillageController::class, 'buildNetwork']);
Route::get('/villages/{village}/integrity', [VillageController::class, 'integrity']);
Route::get('/villages/{village}/audit-logs', [VillageController::class, 'auditLogs']);

// Village Infrastructure Elements CRUD & Verification (Phase 7)
Route::post('/villages/{village}/nodes', [VillageController::class, 'storeNode']);
Route::put('/villages/{village}/nodes/{node}', [VillageController::class, 'updateNode']);
Route::patch('/villages/{village}/nodes/{node}/verify', [VillageController::class, 'verifyNode']);
Route::delete('/villages/{village}/nodes/{node}', [VillageController::class, 'destroyNode']);

Route::post('/villages/{village}/edges', [VillageController::class, 'storeEdge']);
Route::put('/villages/{village}/edges/{edge}', [VillageController::class, 'updateEdge']);
Route::patch('/villages/{village}/edges/{edge}/verify', [VillageController::class, 'verifyEdge']);
Route::delete('/villages/{village}/edges/{edge}', [VillageController::class, 'destroyEdge']);

Route::post('/villages/{village}/facilities', [VillageController::class, 'storeFacility']);
Route::delete('/villages/{village}/facilities/{facility}', [VillageController::class, 'destroyFacility']);

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

// AI Agent Endpoints (proxied to Python Intelligence service)
Route::post('/ai/chat', [AIController::class, 'chat']);
Route::get('/ai/insights', [AIController::class, 'insights']);

// Real-Time Municipal Reports & Insights API (Phase 2 & 3)
Route::prefix('reports')->group(function () {
    Route::get('/bundle', [ReportController::class, 'bundle']);
    Route::get('/overview', [ReportController::class, 'overview']);
    Route::get('/categories', [ReportController::class, 'categories']);
    Route::get('/trends', [ReportController::class, 'trends']);
    Route::get('/status-distribution', [ReportController::class, 'statusDistribution']);
    Route::get('/priorities', [ReportController::class, 'priorities']);
    Route::get('/ward-comparison', [ReportController::class, 'wardComparison']);
    Route::get('/infrastructure-condition', [ReportController::class, 'infrastructureCondition']);
    Route::get('/simulations', [ReportController::class, 'simulations']);
    Route::get('/records', [ReportController::class, 'records']);
    Route::get('/export', [ReportController::class, 'export']);
    Route::post('/ai-insights', [ReportController::class, 'aiInsights']);
});

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

// Citizen Portal Endpoints (Phase 4 & Citizen Integration)
Route::prefix('citizen')->group(function () {
    Route::post('/register', [CitizenPortalController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [CitizenPortalController::class, 'login'])->middleware('throttle:15,1');
    Route::get('/locations', [CitizenPortalController::class, 'locations']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [CitizenPortalController::class, 'logout']);
        Route::get('/me', [CitizenPortalController::class, 'me']);
        Route::get('/dashboard', [CitizenPortalController::class, 'dashboard']);

        Route::get('/complaints', [CitizenPortalController::class, 'index']);
        Route::post('/complaints', [CitizenPortalController::class, 'store'])->middleware('throttle:30,1');
        Route::get('/complaints/{complaint}', [CitizenPortalController::class, 'show']);
        Route::put('/complaints/{complaint}', [CitizenPortalController::class, 'update']);
        Route::post('/complaints/{complaint}/withdraw', [CitizenPortalController::class, 'withdraw']);
        Route::get('/complaints/{complaint}/tracking', [CitizenPortalController::class, 'tracking']);

        Route::get('/notifications', [CitizenPortalController::class, 'notifications']);
        Route::patch('/notifications/{notification}/read', [CitizenPortalController::class, 'markNotificationRead']);

        Route::get('/media/{media}', [CitizenPortalController::class, 'media']);
        Route::get('/media/{media}/preview', [CitizenPortalController::class, 'mediaPreview']);
    });
});

// Citizen Portal Direct Aliases (for source component compatibility)
Route::post('/auth/register', [CitizenPortalController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [CitizenPortalController::class, 'login'])->middleware('throttle:15,1');
Route::get('/complaint-locations', [CitizenPortalController::class, 'locations']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [CitizenPortalController::class, 'logout']);
    Route::get('/auth/me', [CitizenPortalController::class, 'me']);
    Route::get('/user/dashboard', [CitizenPortalController::class, 'dashboard']);
    Route::get('/my-complaints', [CitizenPortalController::class, 'index']);
    Route::post('/complaints', [CitizenPortalController::class, 'store'])->middleware('throttle:30,1');
    Route::get('/complaints/{complaint}', [CitizenPortalController::class, 'show']);
    Route::post('/complaints/{complaint}/withdraw', [CitizenPortalController::class, 'withdraw']);
    Route::get('/notifications', [CitizenPortalController::class, 'notifications']);
});
