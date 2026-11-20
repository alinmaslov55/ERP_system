<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Display a paginated listing of user accounts.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $query = User::with(['roles.permissions']);

        // Search by name or email
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role slug
        if ($request->filled('role')) {
            $roleSlug = $request->input('role');
            $query->whereHas('roles', fn ($q) => $q->where('slug', $roleSlug));
        }

        // Filter by active status
        if ($request->has('is_active') && $request->input('is_active') !== '' && $request->input('is_active') !== null) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->integer('per_page', 15);
        $users = $query->orderBy('name', 'asc')->paginate($perPage);

        return UserResource::collection($users);
    }

    /**
     * Store a newly created user account.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'message' => 'Staff user created successfully.',
            'data' => new UserResource($user->load('roles.permissions')),
        ], 201);
    }

    /**
     * Display the specified user account.
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    /**
     * Update the specified user account in storage.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
            'role_ids' => ['sometimes', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        // Guardrail 1: Self-deactivation protection
        if ($request->has('is_active') && !$request->boolean('is_active') && $request->user()->id === $user->id) {
            throw ValidationException::withMessages([
                'is_active' => ['You cannot deactivate your own account.'],
            ]);
        }

        // Guardrail 2: Sole active administrator protection
        if ($user->hasRole('admin') && $user->is_active) {
            $activeAdminCount = User::where('is_active', true)
                ->whereHas('roles', fn ($q) => $q->where('slug', 'admin'))
                ->count();

            if ($activeAdminCount <= 1) {
                // Cannot deactivate sole active admin
                if ($request->has('is_active') && !$request->boolean('is_active')) {
                    throw ValidationException::withMessages([
                        'is_active' => ['Cannot deactivate the sole active administrator account.'],
                    ]);
                }

                // Cannot revoke admin role from sole active admin
                if ($request->has('role_ids')) {
                    $adminRole = Role::where('slug', 'admin')->first();
                    if ($adminRole && !in_array($adminRole->id, $request->input('role_ids', []))) {
                        throw ValidationException::withMessages([
                            'role_ids' => ['Cannot revoke the administrator role from the last active administrator.'],
                        ]);
                    }
                }
            }
        }

        // Apply attribute updates
        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if ($request->has('is_active')) {
            $user->is_active = $request->boolean('is_active');
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if ($request->has('role_ids')) {
            $user->roles()->sync($validated['role_ids']);
        }

        return response()->json([
            'message' => 'Staff user updated successfully.',
            'data' => new UserResource($user->fresh(['roles.permissions'])),
        ]);
    }

    /**
     * Remove the specified user account from storage.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        // Guardrail 1: Self-deletion protection
        if ($request->user()->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot delete your own account.'],
            ]);
        }

        // Guardrail 2: Sole active administrator protection
        if ($user->hasRole('admin') && $user->is_active) {
            $activeAdminCount = User::where('is_active', true)
                ->whereHas('roles', fn ($q) => $q->where('slug', 'admin'))
                ->count();

            if ($activeAdminCount <= 1) {
                throw ValidationException::withMessages([
                    'user' => ['Cannot delete the sole active administrator account.'],
                ]);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'Staff user deleted successfully.',
        ]);
    }
}
