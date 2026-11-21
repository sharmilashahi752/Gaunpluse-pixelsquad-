<?php

use App\Http\Controllers\Admin\AdminIssueController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PriorityController;
use App\Http\Controllers\Admin\SimulationController as AdminSimulationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\VillageController;
use Illuminate\Support\Facades\Route;

Route::get('/villages',[VillageController::class,'index']);
Route::get('/villages/{village}/network',[VillageController::class,'network']);
Route::get('/issues',[IssueController::class,'index']);
Route::get('/issues/{issue}',[IssueController::class,'show']);
Route::post('/issues',[IssueController::class,'store'])->middleware('throttle:20,1');
Route::post('/login',[AuthController::class,'login'])->middleware('throttle:10,1');

// Public / Demo Simulation Routes (backed by Python NetworkX engine)
Route::get('/simulations', [SimulationController::class, 'index']);
Route::get('/simulations/{simulation}', [SimulationController::class, 'show']);
Route::post('/simulations', [SimulationController::class, 'store']);
Route::post('/simulations/compare', [SimulationController::class, 'compare']);

Route::middleware(['auth:sanctum','admin'])->group(function(){
    Route::post('/logout',[AuthController::class,'logout']);
    Route::get('/user',[AuthController::class,'user']);
    Route::prefix('admin')->group(function(){
        Route::get('/dashboard',DashboardController::class);
        Route::get('/issues',[AdminIssueController::class,'index']);
        Route::get('/issues/{issue}',[AdminIssueController::class,'show']);
        Route::patch('/issues/{issue}/status',[AdminIssueController::class,'updateStatus']);
        Route::post('/simulations',[SimulationController::class,'store']);
        Route::post('/simulations/compare',[SimulationController::class,'compare']);
        Route::get('/priorities',PriorityController::class);
    });
});
