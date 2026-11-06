<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * Determine whether the user can view any products.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('products.view');
    }

    /**
     * Determine whether the user can view the specific product.
     */
    public function view(User $user, Product $product): bool
    {
        return $user->hasPermission('products.view');
    }

    /**
     * Determine whether the user can create products.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('products.manage');
    }

    /**
     * Determine whether the user can update the product.
     */
    public function update(User $user, Product $product): bool
    {
        return $user->hasPermission('products.manage');
    }

    /**
     * Determine whether the user can delete/archive the product.
     */
    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermission('products.manage');
    }
}

