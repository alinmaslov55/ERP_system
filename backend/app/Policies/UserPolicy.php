<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any user accounts.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('users.manage');
    }

    /**
     * Determine whether the user can view the specific user account.
     */
    public function view(User $user, User $model): bool
    {
        return $user->hasPermission('users.manage');
    }

    /**
     * Determine whether the user can create new user accounts.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('users.manage');
    }

    /**
     * Determine whether the user can update the user account.
     */
    public function update(User $user, User $model): bool
    {
        return $user->hasPermission('users.manage');
    }

    /**
     * Determine whether the user can delete/deactivate the user account.
     * Prevents self-deletion.
     */
    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return false;
        }

        return $user->hasPermission('users.manage');
    }
}

