<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'is_active', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * The roles assigned to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    /**
     * Determine if the user possesses one or more roles by slug.
     */
    public function hasRole(string|array $slugs): bool
    {
        $slugArray = (array) $slugs;

        if ($this->relationLoaded('roles')) {
            return $this->roles->pluck('slug')->intersect($slugArray)->isNotEmpty();
        }

        return $this->roles()->whereIn('slug', $slugArray)->exists();
    }

    /**
     * Get all unique permission slugs possessed by the user via their assigned roles.
     * N+1 safe: checks eager-loaded relations in-memory.
     *
     * @return Collection<int, string>
     */
    public function allPermissions(): Collection
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles
                ->flatMap(function ($role) {
                    return $role->relationLoaded('permissions')
                        ? $role->permissions
                        : $role->permissions()->get();
                })
                ->pluck('slug')
                ->unique()
                ->values();
        }

        return Permission::whereHas('roles.users', function ($query) {
            $query->where('users.id', $this->id);
        })->pluck('slug')->unique()->values();
    }

    /**
     * Determine if the user has a specific permission slug.
     * Administrators automatically have all permissions.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->hasRole('admin')) {
            return true;
        }

        return $this->allPermissions()->contains($permissionSlug);
    }

    /**
     * Assign a role to the user by model instance or slug.
     */
    public function assignRole(Role|string $role): void
    {
        $roleModel = is_string($role) ? Role::where('slug', $role)->firstOrFail() : $role;
        $this->roles()->syncWithoutDetaching([$roleModel->id]);
    }

    /**
     * Remove a role from the user by model instance or slug.
     */
    public function removeRole(Role|string $role): void
    {
        $roleModel = is_string($role) ? Role::where('slug', $role)->first() : $role;
        if ($roleModel) {
            $this->roles()->detach($roleModel->id);
        }
    }
}
