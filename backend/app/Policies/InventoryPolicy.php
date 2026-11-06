<?php

namespace App\Policies;

use App\Models\User;

class InventoryPolicy
{
    /**
     * Determine whether the user can view inventory balances and movement logs.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('inventory.view');
    }

    /**
     * Determine whether the user can record stock adjustments.
     */
    public function adjust(User $user): bool
    {
        return $user->hasPermission('inventory.adjust');
    }

    /**
     * Determine whether the user can initiate or complete stock transfers.
     */
    public function transfer(User $user): bool
    {
        return $user->hasPermission('inventory.transfer');
    }
}

