<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $manager;
    protected User $operator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create(['name' => 'Admin User']);
        $this->admin->assignRole('admin');

        $this->manager = User::factory()->create(['name' => 'Manager User']);
        $this->manager->assignRole('manager');

        $this->operator = User::factory()->create(['name' => 'Warehouse Operator']);
        $this->operator->assignRole('warehouse_operator');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $res = $this->getJson('/api/v1/categories');
        $res->assertUnauthorized();
    }

    public function test_user_with_products_view_can_read_categories(): void
    {
        Sanctum::actingAs($this->operator);

        Category::create(['name' => 'Hardware', 'description' => 'Tech gear']);

        $res = $this->getJson('/api/v1/categories');
        $res->assertOk()
            ->assertJsonPath('data.0.name', 'Hardware')
            ->assertJsonPath('data.0.products_count', 0);
    }

    public function test_unauthorized_user_cannot_create_category(): void
    {
        Sanctum::actingAs($this->operator);

        $res = $this->postJson('/api/v1/categories', [
            'name' => 'Restricted Category',
        ]);

        $res->assertForbidden();
    }

    public function test_manager_can_create_category_with_validation(): void
    {
        Sanctum::actingAs($this->manager);

        // Success creation
        $res = $this->postJson('/api/v1/categories', [
            'name' => 'Office Supplies',
            'description' => 'Stationery and pens',
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.name', 'Office Supplies')
            ->assertJsonPath('data.products_count', 0);

        $this->assertDatabaseHas('categories', ['name' => 'Office Supplies']);

        // Duplicate name rejected
        $dupRes = $this->postJson('/api/v1/categories', [
            'name' => 'Office Supplies',
        ]);
        $dupRes->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_manager_can_update_category(): void
    {
        Sanctum::actingAs($this->manager);

        $category = Category::create(['name' => 'Legacy Name', 'description' => 'Old desc']);

        $res = $this->putJson("/api/v1/categories/{$category->id}", [
            'name' => 'Updated Name',
            'description' => 'New desc',
        ]);

        $res->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.description', 'New desc');

        $this->assertDatabaseHas('categories', ['name' => 'Updated Name']);
    }

    public function test_delete_empty_category_succeeds(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::create(['name' => 'Obsolete Category']);

        $res = $this->deleteJson("/api/v1/categories/{$category->id}");
        $res->assertOk();

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_delete_category_with_products_is_blocked(): void
    {
        Sanctum::actingAs($this->admin);

        $category = Category::create(['name' => 'Active Category']);

        Product::create([
            'category_id' => $category->id,
            'sku' => 'SKU-CAT-001',
            'name' => 'Bound Product',
            'cost_price' => 10.00,
            'selling_price' => 20.00,
            'reorder_level' => 5,
            'is_active' => true,
        ]);

        $res = $this->deleteJson("/api/v1/categories/{$category->id}");
        $res->assertStatus(422)
            ->assertJsonPath('message', fn ($msg) => str_contains($msg, 'Cannot delete category'));

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
