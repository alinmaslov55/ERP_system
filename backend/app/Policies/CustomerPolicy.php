<?php

namespace App\Policies;

use App\Models\User;

class CustomerPolicy
{
    /**
     * Determine whether the user can view customers.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('customers.view');
    }

    /**
     * Determine whether the user can view customer details.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('customers.view');
    }

    /**
     * Determine whether the user can create customers.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('customers.manage');
    }

    /**
     * Determine whether the user can update customers.
     */
    public function update(User $user): bool
    {
        return $user->hasPermission('customers.manage');
    }

    /**
     * Determine whether the user can delete customers.
     */
    public function delete(User $user): bool
    {
        return $user->hasPermission('customers.manage');
    }
}

