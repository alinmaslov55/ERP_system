<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAdministrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Role $adminRole;
    protected Role $warehouseRole;
    protected Role $salesRole;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->adminRole = Role::where('slug', 'admin')->firstOrFail();
        $this->warehouseRole = Role::where('slug', 'warehouse_operator')->firstOrFail();
        $this->salesRole = Role::where('slug', 'sales_operator')->firstOrFail();

        $this->admin = User::factory()->create([
            'name' => 'Root Admin',
            'email' => 'admin@stockpilot.io',
            'is_active' => true,
        ]);
        $this->admin->roles()->sync([$this->adminRole->id]);
    }

    public function test_admin_can_list_users_with_pagination_and_search(): void
    {
        Sanctum::actingAs($this->admin);

        User::factory()->create([
            'name' => 'Alice Wonderland',
            'email' => 'alice@stockpilot.io',
        ]);
        User::factory()->create([
            'name' => 'Bob Builder',
            'email' => 'bob@stockpilot.io',
        ]);

        // General list
        $response = $this->getJson('/api/v1/users');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'is_active', 'roles', 'role_ids', 'role_details', 'permissions'],
                ],
                'links',
                'meta',
            ]);

        // Search by name
        $searchRes = $this->getJson('/api/v1/users?search=Alice');
        $searchRes->assertStatus(200);
        $this->assertCount(1, $searchRes->json('data'));
        $this->assertEquals('Alice Wonderland', $searchRes->json('data.0.name'));
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        Sanctum::actingAs($this->admin);

        $whUser = User::factory()->create([
            'name' => 'Warehouse Jack',
            'email' => 'jack@stockpilot.io',
        ]);
        $whUser->roles()->sync([$this->warehouseRole->id]);

        $filterRes = $this->getJson('/api/v1/users?role=warehouse_operator');
        $filterRes->assertStatus(200);
        $this->assertCount(1, $filterRes->json('data'));
        $this->assertEquals('Warehouse Jack', $filterRes->json('data.0.name'));
    }

    public function test_admin_can_create_warehouse_operator_user(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'name' => 'Sam Warehouse',
            'email' => 'sam.wh@stockpilot.io',
            'password' => 'secret1234',
            'is_active' => true,
            'role_ids' => [$this->warehouseRole->id],
        ];

        $response = $this->postJson('/api/v1/users', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Sam Warehouse')
            ->assertJsonPath('data.email', 'sam.wh@stockpilot.io')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('users', [
            'email' => 'sam.wh@stockpilot.io',
            'is_active' => true,
        ]);

        $created = User::where('email', 'sam.wh@stockpilot.io')->first();
        $this->assertTrue($created->hasRole('warehouse_operator'));
        $this->assertFalse($created->hasRole('admin'));
    }

    public function test_admin_can_update_user_profile_and_roles(): void
    {
        Sanctum::actingAs($this->admin);

        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@stockpilot.io',
            'is_active' => true,
        ]);
        $user->roles()->sync([$this->salesRole->id]);

        $updatePayload = [
            'name' => 'Updated Name',
            'role_ids' => [$this->warehouseRole->id],
        ];

        $response = $this->patchJson("/api/v1/users/{$user->id}", $updatePayload);
        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');

        $user->refresh();
        $this->assertEquals('Updated Name', $user->name);
        $this->assertTrue($user->hasRole('warehouse_operator'));
        $this->assertFalse($user->hasRole('sales_operator'));
    }

    public function test_self_deactivation_is_blocked_with_422(): void
    {
        Sanctum::actingAs($this->admin);

        // Attempting to deactivate own account
        $response = $this->patchJson("/api/v1/users/{$this->admin->id}", [
            'is_active' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_active']);
    }

    public function test_revoking_admin_role_from_sole_active_admin_is_blocked_with_422(): void
    {
        Sanctum::actingAs($this->admin);

        // There is only 1 active admin in the system ($this->admin)
        $response = $this->patchJson("/api/v1/users/{$this->admin->id}", [
            'role_ids' => [$this->salesRole->id], // Demoting to sales operator
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role_ids']);
    }

    public function test_deactivating_sole_active_admin_from_another_account_is_blocked_with_422(): void
    {
        // Create a second admin account
        $adminTwo = User::factory()->create(['is_active' => true]);
        $adminTwo->roles()->sync([$this->adminRole->id]);

        // Deactivate adminTwo so that $this->admin is again the SOLE active admin
        $adminTwo->update(['is_active' => false]);

        // Reactivate adminTwo temporarily to act as caller
        $adminTwo->update(['is_active' => true]);
        Sanctum::actingAs($adminTwo);

        // Deactivate adminTwo so $this->admin is sole active
        $adminTwo->update(['is_active' => false]);

        // Attempting to deactivate $this->admin when it is the sole active admin
        $response = $this->patchJson("/api/v1/users/{$this->admin->id}", [
            'is_active' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_active']);
    }

    public function test_non_admin_cannot_access_user_management_or_roles_endpoints(): void
    {
        $salesUser = User::factory()->create(['is_active' => true]);
        $salesUser->roles()->sync([$this->salesRole->id]);

        Sanctum::actingAs($salesUser);

        $this->getJson('/api/v1/users')->assertStatus(403);
        $this->postJson('/api/v1/users', [
            'name' => 'Hacker',
            'email' => 'hacker@stockpilot.io',
            'password' => 'password123',
            'role_ids' => [$this->adminRole->id],
        ])->assertStatus(403);

        $this->patchJson("/api/v1/users/{$this->admin->id}", [
            'name' => 'Hacked Name',
        ])->assertStatus(403);

        $this->getJson('/api/v1/roles')->assertStatus(403);
    }

    public function test_admin_can_fetch_roles_and_permissions(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/roles');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'permissions'],
                ],
            ]);

        $this->assertCount(4, $response->json('data'));
    }
}
