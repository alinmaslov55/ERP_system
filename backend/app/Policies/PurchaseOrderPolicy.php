<?php

namespace App\Policies;

use App\Models\User;

class PurchaseOrderPolicy
{
    /**
     * Determine whether the user can view purchase orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('po.view');
    }

    /**
     * Determine whether the user can view purchase order details.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('po.view');
    }

    /**
     * Determine whether the user can create purchase orders.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('po.manage');
    }

    /**
     * Determine whether the user can update purchase orders.
     */
    public function update(User $user): bool
    {
        return $user->hasPermission('po.manage');
    }

    /**
     * Determine whether the user can delete or cancel purchase orders.
     */
    public function delete(User $user): bool
    {
        return $user->hasPermission('po.manage');
    }

    /**
     * Determine whether the user can receive goods against purchase orders.
     */
    public function receive(User $user): bool
    {
        return $user->hasPermission('po.receive');
    }
}

