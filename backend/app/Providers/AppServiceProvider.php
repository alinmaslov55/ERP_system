<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Global administrator superuser bypass
        Gate::before(function (User $user, string $ability) {
            if ($user->hasRole('admin')) {
                return true;
            }
            return null;
        });

        // Register discrete gates for all canonical permission slugs
        $permissions = [
            'dashboard.view',
            'products.view',
            'products.manage',
            'categories.manage',
            'warehouses.view',
            'warehouses.manage',
            'inventory.view',
            'inventory.adjust',
            'inventory.transfer',
            'suppliers.view',
            'suppliers.manage',
            'po.view',
            'po.manage',
            'po.receive',
            'customers.view',
            'customers.manage',
            'so.view',
            'so.manage',
            'so.fulfill',
            'payments.manage',
            'reports.view',
            'reports.export',
            'users.manage',
            'audit.view',
        ];

        foreach ($permissions as $permission) {
            Gate::define($permission, fn (User $user) => $user->hasPermission($permission));
        }
    }
}
