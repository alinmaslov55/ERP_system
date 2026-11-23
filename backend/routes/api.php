<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\WarehouseController;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public authentication routes
    Route::post('/login', [AuthController::class, 'login']);

    // Protected API routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('warehouses', WarehouseController::class);
        Route::apiResource('products', ProductController::class);
        Route::apiResource('users', \App\Http\Controllers\Api\V1\UserController::class);
        Route::get('/roles', [\App\Http\Controllers\Api\V1\RoleController::class, 'index']);
        Route::get('/audit-logs', [\App\Http\Controllers\Api\V1\AuditLogController::class, 'index']);

        // Domain operation routes guarded by RBAC permissions (expanded in INV-003, SAL-002)
        Route::post('/stock-adjustments', function () {
            Gate::authorize('inventory.adjust');
            return response()->json(['message' => 'Stock adjustment authorized']);
        });

        Route::post('/sales-orders', function () {
            Gate::authorize('so.manage');
            return response()->json(['message' => 'Sales order authorized']);
        });
    });
});
