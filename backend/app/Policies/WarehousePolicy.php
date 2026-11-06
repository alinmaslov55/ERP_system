<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Warehouse;

class WarehousePolicy
{
    /**
     * Determine whether the user can view any warehouses.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('warehouses.view');
    }

    /**
     * Determine whether the user can view the specific warehouse.
     */
    public function view(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermission('warehouses.view');
    }

    /**
     * Determine whether the user can create warehouses.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('warehouses.manage');
    }

    /**
     * Determine whether the user can update the warehouse.
     */
    public function update(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermission('warehouses.manage');
    }

    /**
     * Determine whether the user can delete the warehouse.
     */
    public function delete(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermission('warehouses.manage');
    }
}

