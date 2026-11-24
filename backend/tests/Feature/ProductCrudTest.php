<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;
    protected User $operator;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->manager = User::factory()->create(['name' => 'Manager']);
        $this->manager->assignRole('manager');

        $this->operator = User::factory()->create(['name' => 'Operator']);
        $this->operator->assignRole('warehouse_operator');

        $this->category = Category::create([
            'name' => 'Electronics',
            'description' => 'Electronic devices',
        ]);
    }

    public function test_unauthenticated_and_unauthorized_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/products')->assertUnauthorized();

        Sanctum::actingAs($this->operator);
        $this->getJson('/api/v1/products')->assertOk();
        $this->postJson('/api/v1/products', [
            'category_id' => $this->category->id,
            'sku' => 'NO-PERM-001',
            'name' => 'Blocked Product',
        ])->assertForbidden();
    }

    public function test_create_product_with_all_attributes(): void
    {
        Sanctum::actingAs($this->manager);

        $payload = [
            'category_id' => $this->category->id,
            'sku' => 'ELEC-1001',
            'name' => 'Ergonomic Keyboard',
            'description' => 'Mechanical wireless keyboard',
            'unit' => 'box',
            'cost_price' => 45.50,
            'selling_price' => 89.99,
            'reorder_level' => 15,
            'is_active' => true,
        ];

        $res = $this->postJson('/api/v1/products', $payload);

        $res->assertCreated()
            ->assertJsonPath('data.sku', 'ELEC-1001')
            ->assertJsonPath('data.unit', 'box')
            ->assertJsonPath('data.cost_price', '45.50')
            ->assertJsonPath('data.selling_price', '89.99')
            ->assertJsonPath('data.reorder_level', 15)
            ->assertJsonPath('data.category.id', $this->category->id);

        $this->assertDatabaseHas('products', ['sku' => 'ELEC-1001', 'unit' => 'box']);
    }

    public function test_duplicate_sku_returns_422_validation_error(): void
    {
        Sanctum::actingAs($this->manager);

        Product::create([
            'category_id' => $this->category->id,
            'sku' => 'DUP-SKU-01',
            'name' => 'Original Item',
            'cost_price' => 10,
            'selling_price' => 20,
        ]);

        $res = $this->postJson('/api/v1/products', [
            'category_id' => $this->category->id,
            'sku' => 'DUP-SKU-01',
            'name' => 'Duplicate Item',
            'cost_price' => 12,
            'selling_price' => 25,
        ]);

        $res->assertUnprocessable()
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_show_product_detail_includes_category(): void
    {
        Sanctum::actingAs($this->operator);

        $product = Product::create([
            'category_id' => $this->category->id,
            'sku' => 'SHOW-001',
            'name' => 'Monitor Stand',
            'unit' => 'piece',
            'cost_price' => 20,
            'selling_price' => 40,
            'reorder_level' => 5,
            'is_active' => true,
        ]);

        $res = $this->getJson("/api/v1/products/{$product->id}");

        $res->assertOk()
            ->assertJsonPath('data.sku', 'SHOW-001')
            ->assertJsonPath('data.category.name', 'Electronics');
    }

    public function test_update_product_via_patch_with_same_sku_succeeds(): void
    {
        Sanctum::actingAs($this->manager);

        $product = Product::create([
            'category_id' => $this->category->id,
            'sku' => 'UPD-001',
            'name' => 'Old Name',
            'unit' => 'piece',
            'cost_price' => 10,
            'selling_price' => 20,
            'reorder_level' => 5,
            'is_active' => true,
        ]);

        $res = $this->patchJson("/api/v1/products/{$product->id}", [
            'sku' => 'UPD-001',
            'name' => 'Updated Name',
            'unit' => 'kg',
            'cost_price' => 15.25,
            'selling_price' => 30.50,
            'reorder_level' => 12,
            'is_active' => false,
        ]);

        $res->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.unit', 'kg')
            ->assertJsonPath('data.cost_price', '15.25')
            ->assertJsonPath('data.selling_price', '30.50')
            ->assertJsonPath('data.reorder_level', 12)
            ->assertJsonPath('data.is_active', false);
    }

    public function test_archive_product_soft_deletes_and_preserves_record(): void
    {
        Sanctum::actingAs($this->manager);

        $product = Product::create([
            'category_id' => $this->category->id,
            'sku' => 'ARC-001',
            'name' => 'Archived Item',
            'cost_price' => 5,
            'selling_price' => 10,
        ]);

        $res = $this->deleteJson("/api/v1/products/{$product->id}");
        $res->assertOk();

        // Excluded from normal queries
        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Still exists in DB with deleted_at set
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
