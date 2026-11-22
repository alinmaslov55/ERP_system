<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PurchaseOrderService;
use Database\Seeders\RolePermissionSeeder;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use LogicException;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Category $category;
    protected Warehouse $warehouse;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create([
            'name' => 'Auditing Admin',
            'email' => 'admin.audit@stockpilot.io',
        ]);
        $this->admin->assignRole('admin');

        $this->category = Category::create([
            'name' => 'Hardware',
            'description' => 'Computer Hardware',
        ]);

        $this->warehouse = Warehouse::create([
            'name' => 'Main Distribution Hub',
            'location' => 'Building 1',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'sku' => 'AUD-TEST-001',
            'name' => 'Audited Widget',
            'cost_price' => 50.00,
            'selling_price' => 100.00,
            'reorder_level' => 10,
            'is_active' => true,
        ]);
    }

    public function test_product_selling_price_update_writes_audit_log_within_transaction(): void
    {
        Sanctum::actingAs($this->admin);

        // Update selling_price via API endpoint
        $response = $this->patchJson("/api/v1/products/{$this->product->id}", [
            'selling_price' => 149.99,
        ]);

        $response->assertStatus(200);

        // Verify audit log row was written
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'product.updated',
            'auditable_type' => Product::class,
            'auditable_id' => $this->product->id,
            'actor_id' => $this->admin->id,
        ]);

        $auditLog = AuditLog::where('auditable_type', Product::class)
            ->where('auditable_id', $this->product->id)
            ->where('action', 'product.updated')
            ->latest('id')
            ->firstOrFail();

        $this->assertEquals($this->admin->id, $auditLog->actor_id);
        $this->assertArrayHasKey('selling_price', $auditLog->old_values);
        $this->assertArrayHasKey('selling_price', $auditLog->new_values);
        $this->assertEquals(100.00, (float) $auditLog->old_values['selling_price']);
        $this->assertEquals(149.99, (float) $auditLog->new_values['selling_price']);
    }

    public function test_product_update_rollback_rolls_back_audit_log(): void
    {
        Sanctum::actingAs($this->admin);

        try {
            DB::transaction(function () {
                $this->product->update(['selling_price' => 999.99]);

                // Verify audit log exists inside transaction
                $this->assertDatabaseHas('audit_logs', [
                    'action' => 'product.updated',
                    'auditable_id' => $this->product->id,
                ]);

                // Force transaction failure
                throw new Exception('Simulated operational failure during transaction.');
            });
        } catch (Exception $e) {
            // Caught simulated failure
        }

        // Verify audit log row was rolled back and does not persist
        $this->product->refresh();
        $this->assertEquals(100.00, (float) $this->product->selling_price);

        $rolledBackLog = AuditLog::where('auditable_type', Product::class)
            ->where('auditable_id', $this->product->id)
            ->where('action', 'product.updated')
            ->whereJsonContains('new_values->selling_price', 999.99)
            ->first();

        $this->assertNull($rolledBackLog);
    }

    public function test_purchase_order_submission_writes_audit_log_within_transaction(): void
    {
        Sanctum::actingAs($this->admin);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-2026-9001',
            'warehouse_id' => $this->warehouse->id,
            'status' => 'draft',
            'order_date' => now(),
            'total_amount' => 5000.00,
            'created_by' => $this->admin->id,
        ]);

        $service = new PurchaseOrderService();
        $submittedPo = $service->submit($po, $this->admin);

        $this->assertEquals('submitted', $submittedPo->status);
        $this->assertEquals($this->admin->id, $submittedPo->submitted_by);

        // Verify audit log entry exists
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'po.submitted',
            'auditable_type' => PurchaseOrder::class,
            'auditable_id' => $po->id,
            'actor_id' => $this->admin->id,
        ]);

        $auditLog = AuditLog::where('auditable_type', PurchaseOrder::class)
            ->where('auditable_id', $po->id)
            ->where('action', 'po.submitted')
            ->firstOrFail();

        $this->assertEquals('draft', $auditLog->old_values['status']);
        $this->assertEquals('submitted', $auditLog->new_values['status']);
    }

    public function test_audit_log_model_blocks_update(): void
    {
        Sanctum::actingAs($this->admin);

        $this->product->update(['name' => 'Renamed Product']);
        $auditLog = AuditLog::latest('id')->firstOrFail();

        // 1. Direct update() method call must throw LogicException
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('AuditLog records are immutable and cannot be updated.');
        $auditLog->update(['action' => 'tampered.action']);
    }

    public function test_audit_log_model_blocks_save_when_dirty(): void
    {
        Sanctum::actingAs($this->admin);

        $this->product->update(['name' => 'Renamed Product Again']);
        $auditLog = AuditLog::latest('id')->firstOrFail();

        // 2. Setting dirty attributes and calling save() must throw LogicException
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('AuditLog records are immutable and cannot be updated.');
        $auditLog->action = 'tampered.action';
        $auditLog->save();
    }

    public function test_audit_log_model_blocks_delete(): void
    {
        Sanctum::actingAs($this->admin);

        $this->product->update(['name' => 'Yet Another Name']);
        $auditLog = AuditLog::latest('id')->firstOrFail();

        // Calling delete() must throw LogicException
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('AuditLog records are immutable and cannot be deleted.');
        $auditLog->delete();
    }

    public function test_sensitive_attributes_are_redacted_from_audit_logs(): void
    {
        Sanctum::actingAs($this->admin);

        $user = User::factory()->create([
            'name' => 'Secret User',
            'email' => 'secret@stockpilot.io',
            'password' => Hash::make('original-password'),
        ]);

        $user->update([
            'password' => Hash::make('super-secret-new-password'),
        ]);

        $auditLog = AuditLog::where('auditable_type', User::class)
            ->where('auditable_id', $user->id)
            ->where('action', 'user.updated')
            ->firstOrFail();

        // Verify password was redacted
        $this->assertArrayHasKey('password', $auditLog->new_values);
        $this->assertSame('[REDACTED]', $auditLog->new_values['password']);
        $this->assertSame('[REDACTED]', $auditLog->old_values['password']);
    }

    public function test_polymorphic_relations_and_indexes(): void
    {
        Sanctum::actingAs($this->admin);

        $this->product->update(['cost_price' => 75.00]);

        $auditLog = AuditLog::where('auditable_type', Product::class)
            ->where('auditable_id', $this->product->id)
            ->where('action', 'product.updated')
            ->firstOrFail();

        // Actor relation
        $this->assertInstanceOf(User::class, $auditLog->actor);
        $this->assertEquals($this->admin->id, $auditLog->actor->id);

        // Auditable morph relation
        $this->assertInstanceOf(Product::class, $auditLog->auditable);
        $this->assertEquals($this->product->id, $auditLog->auditable->id);

        // Model audits morph relation
        $this->assertTrue($this->product->audits->contains($auditLog));

        // User authored auditLogs relation
        $this->assertTrue($this->admin->auditLogs->contains($auditLog));
    }
}
