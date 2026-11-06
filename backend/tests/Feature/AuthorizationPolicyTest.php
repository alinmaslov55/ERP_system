<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Policies\CategoryPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\InventoryPolicy;
use App\Policies\ProductPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\ReportPolicy;
use App\Policies\SalesOrderPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\UserPolicy;
use App\Policies\WarehousePolicy;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;
    protected Product $product;
    protected Warehouse $warehouse;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Desc',
        ]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'sku' => 'TEST-001',
            'name' => 'Test Product',
            'cost_price' => 50.00,
            'selling_price' => 100.00,
            'reorder_level' => 5,
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'name' => 'Central Hub',
            'location' => 'Zone A',
            'is_active' => true,
        ]);
    }

    public function test_admin_passes_all_authorization_checks(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        // Can list and delete products
        $this->getJson('/api/v1/products')->assertStatus(200);
        $this->deleteJson('/api/v1/products/' . $this->product->id)->assertStatus(200);

        // Can access operational endpoints
        $this->postJson('/api/v1/stock-adjustments')->assertStatus(200);
        $this->postJson('/api/v1/sales-orders')->assertStatus(200);
        $this->postJson('/api/v1/users')->assertStatus(200);
    }

    public function test_sales_operator_acceptance_criteria(): void
    {
        $salesUser = User::factory()->create();
        $salesUser->assignRole('sales_operator');
        Sanctum::actingAs($salesUser);

        // 1. Sales operator CAN view products
        $this->getJson('/api/v1/products')->assertStatus(200);

        // 2. Sales operator attempting DELETE /api/v1/products/{id} receives 403
        $deleteRes = $this->deleteJson('/api/v1/products/' . $this->product->id);
        $deleteRes->assertStatus(403)
            ->assertJson([
                'message' => 'You do not have permission to perform this action.',
            ]);

        // 3. Sales operator attempting POST /api/v1/stock-adjustments receives 403
        $adjRes = $this->postJson('/api/v1/stock-adjustments');
        $adjRes->assertStatus(403)
            ->assertJson([
                'message' => 'You do not have permission to perform this action.',
            ]);

        // 4. Sales operator CAN create sales orders
        $this->postJson('/api/v1/sales-orders')->assertStatus(200);
    }

    public function test_warehouse_operator_acceptance_criteria(): void
    {
        $warehouseUser = User::factory()->create();
        $warehouseUser->assignRole('warehouse_operator');
        Sanctum::actingAs($warehouseUser);

        // 1. Warehouse operator CAN view products and warehouses
        $this->getJson('/api/v1/products')->assertStatus(200);
        $this->getJson('/api/v1/warehouses')->assertStatus(200);

        // 2. Warehouse operator CAN post stock adjustments
        $this->postJson('/api/v1/stock-adjustments')->assertStatus(200);

        // 3. Warehouse operator attempting POST /api/v1/sales-orders receives 403
        $soRes = $this->postJson('/api/v1/sales-orders');
        $soRes->assertStatus(403)
            ->assertJson([
                'message' => 'You do not have permission to perform this action.',
            ]);

        // 4. Warehouse operator attempting POST /api/v1/users receives 403
        $userRes = $this->postJson('/api/v1/users');
        $userRes->assertStatus(403)
            ->assertJson([
                'message' => 'You do not have permission to perform this action.',
            ]);
    }

    public function test_operations_manager_can_manage_products_and_warehouses_but_not_users(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('manager');
        Sanctum::actingAs($manager);

        // Manager can create products
        $this->postJson('/api/v1/products', [
            'category_id' => $this->category->id,
            'sku' => 'MGR-SKU',
            'name' => 'Manager Product',
            'cost_price' => 20,
            'selling_price' => 40,
        ])->assertStatus(201);

        // Manager can update warehouses
        $this->putJson('/api/v1/warehouses/' . $this->warehouse->id, [
            'name' => 'Updated Central Hub',
        ])->assertStatus(200);

        // Manager CANNOT manage users
        $this->postJson('/api/v1/users')->assertStatus(403)
            ->assertJson([
                'message' => 'You do not have permission to perform this action.',
            ]);
    }

    public function test_all_ten_policies_evaluate_permissions_accurately(): void
    {
        $salesUser = User::factory()->create();
        $salesUser->assignRole('sales_operator');

        $whUser = User::factory()->create();
        $whUser->assignRole('warehouse_operator');

        // ProductPolicy
        $productPolicy = new ProductPolicy();
        $this->assertTrue($salesUser->hasRole('sales_operator'));
        $this->assertTrue($productPolicy->viewAny($salesUser));
        $this->assertFalse($productPolicy->create($salesUser));
        $this->assertFalse($productPolicy->delete($salesUser, $this->product));

        // CategoryPolicy
        $categoryPolicy = new CategoryPolicy();
        $this->assertTrue($categoryPolicy->viewAny($salesUser));
        $this->assertFalse($categoryPolicy->create($salesUser));

        // WarehousePolicy
        $warehousePolicy = new WarehousePolicy();
        $this->assertTrue($warehousePolicy->viewAny($whUser));
        $this->assertFalse($warehousePolicy->create($whUser));

        // InventoryPolicy
        $inventoryPolicy = new InventoryPolicy();
        $this->assertTrue($inventoryPolicy->adjust($whUser));
        $this->assertFalse($inventoryPolicy->adjust($salesUser));

        // SupplierPolicy
        $supplierPolicy = new SupplierPolicy();
        $this->assertFalse($supplierPolicy->create($salesUser));

        // PurchaseOrderPolicy
        $poPolicy = new PurchaseOrderPolicy();
        $this->assertTrue($poPolicy->receive($whUser));
        $this->assertFalse($poPolicy->receive($salesUser));

        // CustomerPolicy
        $customerPolicy = new CustomerPolicy();
        $this->assertTrue($customerPolicy->create($salesUser));
        $this->assertFalse($customerPolicy->create($whUser));

        // SalesOrderPolicy
        $soPolicy = new SalesOrderPolicy();
        $this->assertTrue($soPolicy->create($salesUser));
        $this->assertTrue($soPolicy->fulfill($whUser));
        $this->assertFalse($soPolicy->fulfill($salesUser));

        // UserPolicy
        $userPolicy = new UserPolicy();
        $this->assertFalse($userPolicy->viewAny($whUser));
        $this->assertFalse($userPolicy->viewAny($salesUser));

        // ReportPolicy
        $reportPolicy = new ReportPolicy();
        $this->assertTrue($reportPolicy->view($whUser));
        $this->assertTrue($reportPolicy->view($salesUser));
        $this->assertFalse($reportPolicy->export($whUser));
        $this->assertFalse($reportPolicy->export($salesUser));
    }
}

