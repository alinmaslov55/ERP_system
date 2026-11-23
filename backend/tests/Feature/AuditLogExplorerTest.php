<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditLogExplorerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $manager;
    protected User $warehouseOp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@stockpilot.io',
        ]);
        $this->admin->assignRole('admin');

        $this->manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@stockpilot.io',
        ]);
        $this->manager->assignRole('manager');

        $this->warehouseOp = User::factory()->create([
            'name' => 'Warehouse Operator',
            'email' => 'operator@stockpilot.io',
        ]);
        $this->warehouseOp->assignRole('warehouse_operator');

        // Clear audit logs created by setup user creations
        DB::table('audit_logs')->delete();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/audit-logs');

        $response->assertUnauthorized();
    }

    public function test_user_without_audit_view_permission_is_forbidden(): void
    {
        Sanctum::actingAs($this->warehouseOp);

        $response = $this->getJson('/api/v1/audit-logs');

        $response->assertForbidden();
    }

    public function test_admin_and_manager_can_query_audit_logs(): void
    {
        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.created',
            'auditable_type' => Product::class,
            'auditable_id' => 10,
            'old_values' => null,
            'new_values' => ['name' => 'Test Widget', 'selling_price' => 50.00],
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);

        // Admin access
        Sanctum::actingAs($this->admin);
        $resAdmin = $this->getJson('/api/v1/audit-logs');
        $resAdmin->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'product.created');

        // Manager access
        Sanctum::actingAs($this->manager);
        $resManager = $this->getJson('/api/v1/audit-logs');
        $resManager->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_filtering_by_auditable_type_and_id(): void
    {
        Sanctum::actingAs($this->admin);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.created',
            'auditable_type' => Product::class,
            'auditable_id' => 1,
            'created_at' => now()->subMinutes(10),
        ]);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'category.created',
            'auditable_type' => Category::class,
            'auditable_id' => 1,
            'created_at' => now()->subMinutes(5),
        ]);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.updated',
            'auditable_type' => Product::class,
            'auditable_id' => 2,
            'created_at' => now(),
        ]);

        // Filter by short name alias "Product"
        $resType = $this->getJson('/api/v1/audit-logs?auditable_type=Product');
        $resType->assertOk()
            ->assertJsonCount(2, 'data');

        // Filter by type and specific ID
        $resTypeAndId = $this->getJson('/api/v1/audit-logs?auditable_type=Product&auditable_id=1');
        $resTypeAndId->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.auditable_id', 1);
    }

    public function test_filtering_by_action_and_wildcard(): void
    {
        Sanctum::actingAs($this->admin);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.created',
            'auditable_type' => Product::class,
            'auditable_id' => 1,
            'created_at' => now()->subMinutes(2),
        ]);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.updated',
            'auditable_type' => Product::class,
            'auditable_id' => 1,
            'created_at' => now()->subMinute(),
        ]);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'po.submitted',
            'auditable_type' => 'App\Models\PurchaseOrder',
            'auditable_id' => 100,
            'created_at' => now(),
        ]);

        // Exact match
        $resExact = $this->getJson('/api/v1/audit-logs?action=po.submitted');
        $resExact->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'po.submitted');

        // Wildcard match
        $resWildcard = $this->getJson('/api/v1/audit-logs?action=product.*');
        $resWildcard->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_filtering_by_date_range(): void
    {
        Sanctum::actingAs($this->admin);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.created',
            'auditable_type' => Product::class,
            'auditable_id' => 1,
            'created_at' => Carbon::parse('2026-11-01 10:00:00'),
        ]);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.updated',
            'auditable_type' => Product::class,
            'auditable_id' => 1,
            'created_at' => Carbon::parse('2026-11-15 12:00:00'),
        ]);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.updated',
            'auditable_type' => Product::class,
            'auditable_id' => 1,
            'created_at' => Carbon::parse('2026-11-20 18:00:00'),
        ]);

        $resRange = $this->getJson('/api/v1/audit-logs?date_from=2026-11-10&date_to=2026-11-16');
        $resRange->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.created_at', fn ($val) => str_starts_with($val, '2026-11-15'));
    }

    public function test_actor_eager_loading_and_resource_format(): void
    {
        Sanctum::actingAs($this->admin);

        AuditLog::create([
            'actor_id' => $this->admin->id,
            'action' => 'product.updated',
            'auditable_type' => Product::class,
            'auditable_id' => 12,
            'old_values' => ['selling_price' => '120.00'],
            'new_values' => ['selling_price' => '135.00'],
            'ip_address' => '192.168.1.50',
            'user_agent' => 'Mozilla/5.0 Test Suite',
            'created_at' => now(),
        ]);

        $res = $this->getJson('/api/v1/audit-logs');
        $res->assertOk()
            ->assertJsonPath('data.0.actor.id', $this->admin->id)
            ->assertJsonPath('data.0.actor.name', $this->admin->name)
            ->assertJsonPath('data.0.target_label', 'Product #12')
            ->assertJsonPath('data.0.old_values.selling_price', '120.00')
            ->assertJsonPath('data.0.new_values.selling_price', '135.00')
            ->assertJsonPath('data.0.ip_address', '192.168.1.50');
    }
}
