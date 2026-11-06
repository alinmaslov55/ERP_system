<?php

namespace App\Policies;

use App\Models\User;

class SalesOrderPolicy
{
    /**
     * Determine whether the user can view sales orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('so.view');
    }

    /**
     * Determine whether the user can view sales order details.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('so.view');
    }

    /**
     * Determine whether the user can create sales orders.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('so.manage');
    }

    /**
     * Determine whether the user can update sales orders.
     */
    public function update(User $user): bool
    {
        return $user->hasPermission('so.manage');
    }

    /**
     * Determine whether the user can cancel sales orders.
     */
    public function delete(User $user): bool
    {
        return $user->hasPermission('so.manage');
    }

    /**
     * Determine whether the user can fulfill and ship sales orders.
     */
    public function fulfill(User $user): bool
    {
        return $user->hasPermission('so.fulfill');
    }

    /**
     * Determine whether the user can record payments against sales orders.
     */
    public function managePayments(User $user): bool
    {
        return $user->hasPermission('payments.manage');
    }
}

