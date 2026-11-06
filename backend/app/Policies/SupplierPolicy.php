<?php

namespace App\Policies;

use App\Models\User;

class SupplierPolicy
{
    /**
     * Determine whether the user can view suppliers.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('suppliers.view');
    }

    /**
     * Determine whether the user can view supplier details.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('suppliers.view');
    }

    /**
     * Determine whether the user can create suppliers.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('suppliers.manage');
    }

    /**
     * Determine whether the user can update suppliers.
     */
    public function update(User $user): bool
    {
        return $user->hasPermission('suppliers.manage');
    }

    /**
     * Determine whether the user can delete/archive suppliers.
     */
    public function delete(User $user): bool
    {
        return $user->hasPermission('suppliers.manage');
    }
}

