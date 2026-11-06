<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_roles_and_permissions_are_seeded_with_expected_counts(): void
    {
        // 4 Canonical Roles
        $this->assertDatabaseCount('roles', 4);
        $this->assertDatabaseHas('roles', ['slug' => 'admin']);
        $this->assertDatabaseHas('roles', ['slug' => 'manager']);
        $this->assertDatabaseHas('roles', ['slug' => 'warehouse_operator']);
        $this->assertDatabaseHas('roles', ['slug' => 'sales_operator']);

        // 24 Canonical Permissions
        $this->assertDatabaseCount('permissions', 24);

        // Check Role Permission Counts
        $admin = Role::where('slug', 'admin')->with('permissions')->firstOrFail();
        $this->assertCount(24, $admin->permissions);

        $manager = Role::where('slug', 'manager')->with('permissions')->firstOrFail();
        $this->assertCount(23, $manager->permissions);
        $this->assertFalse($manager->permissions->pluck('slug')->contains('users.manage'));

        $warehouseOperator = Role::where('slug', 'warehouse_operator')->with('permissions')->firstOrFail();
        $this->assertCount(11, $warehouseOperator->permissions);
        $this->assertTrue($warehouseOperator->permissions->pluck('slug')->contains('inventory.adjust'));
        $this->assertFalse($warehouseOperator->permissions->pluck('slug')->contains('users.manage'));

        $salesOperator = Role::where('slug', 'sales_operator')->with('permissions')->firstOrFail();
        $this->assertCount(9, $salesOperator->permissions);
        $this->assertTrue($salesOperator->permissions->pluck('slug')->contains('so.manage'));
        $this->assertFalse($salesOperator->permissions->pluck('slug')->contains('inventory.adjust'));
    }

    public function test_seeder_is_idempotent(): void
    {
        // Running the seeder a second time must execute without errors or duplicate records
        $this->seed(RolePermissionSeeder::class);

        $this->assertDatabaseCount('roles', 4);
        $this->assertDatabaseCount('permissions', 24);
    }

    public function test_user_has_role_helper_methods(): void
    {
        $user = User::factory()->create();
        $user->assignRole('warehouse_operator');

        $this->assertTrue($user->hasRole('warehouse_operator'));
        $this->assertTrue($user->hasRole(['manager', 'warehouse_operator']));
        $this->assertFalse($user->hasRole('admin'));
        $this->assertFalse($user->hasRole(['admin', 'sales_operator']));

        // Test with eager-loaded relation
        $userWithRoles = User::with('roles')->find($user->id);
        $this->assertTrue($userWithRoles->hasRole('warehouse_operator'));
        $this->assertFalse($userWithRoles->hasRole('admin'));
    }

    public function test_admin_user_has_all_permissions_via_superuser_override(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->assertTrue($admin->hasPermission('users.manage'));
        $this->assertTrue($admin->hasPermission('inventory.adjust'));
        $this->assertTrue($admin->hasPermission('dashboard.view'));
        // Superuser override returns true even for non-standard slugs
        $this->assertTrue($admin->hasPermission('any.custom.action'));
    }

    public function test_non_admin_permissions_are_properly_evaluated(): void
    {
        $warehouseUser = User::factory()->create();
        $warehouseUser->assignRole('warehouse_operator');

        $this->assertTrue($warehouseUser->hasPermission('inventory.adjust'));
        $this->assertTrue($warehouseUser->hasPermission('po.receive'));
        $this->assertFalse($warehouseUser->hasPermission('users.manage'));
        $this->assertFalse($warehouseUser->hasPermission('customers.manage'));

        $salesUser = User::factory()->create();
        $salesUser->assignRole('sales_operator');

        $this->assertTrue($salesUser->hasPermission('customers.manage'));
        $this->assertTrue($salesUser->hasPermission('so.manage'));
        $this->assertFalse($salesUser->hasPermission('inventory.adjust'));
        $this->assertFalse($salesUser->hasPermission('users.manage'));
    }

    public function test_n_plus_one_prevention_when_roles_and_permissions_are_eager_loaded(): void
    {
        $user = User::factory()->create();
        $user->assignRole('manager');

        // Eager-load roles and their permissions
        $eagerUser = User::with(['roles.permissions'])->find($user->id);

        DB::flushQueryLog();
        DB::enableQueryLog();

        // Perform multiple permission checks and collections
        $hasCat = $eagerUser->hasPermission('categories.manage');
        $hasUsers = $eagerUser->hasPermission('users.manage');
        $hasInv = $eagerUser->hasPermission('inventory.view');
        $all = $eagerUser->allPermissions();

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertTrue($hasCat);
        $this->assertFalse($hasUsers);
        $this->assertTrue($hasInv);
        $this->assertCount(23, $all);

        // Must execute ZERO database queries because relations were loaded in-memory
        $this->assertCount(0, $queries, 'Permission resolution executed unexpected SQL queries instead of using eager-loaded relations.');
    }

    public function test_api_me_endpoint_returns_eager_loaded_roles_and_permissions(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin_test@stockpilot.io',
        ]);
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'admin_test@stockpilot.io')
            ->assertJsonFragment(['roles' => ['admin']]);

        $responseData = $response->json('data');
        $this->assertContains('admin', $responseData['roles']);
        $this->assertContains('users.manage', $responseData['permissions']);
        $this->assertContains('inventory.adjust', $responseData['permissions']);
        $this->assertCount(24, $responseData['permissions']);
    }
}

