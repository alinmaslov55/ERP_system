<?php

namespace Tests\Feature;

use App\Http\Resources\Api\V1\ActorResource;
use App\Http\Resources\Api\V1\GoodsReceiptResource;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Http\Resources\Api\V1\PurchaseOrderResource;
use App\Http\Resources\Api\V1\SalesOrderResource;
use App\Http\Resources\Api\V1\ShipmentResource;
use App\Http\Resources\Api\V1\StockMovementResource;
use App\Models\GoodsReceipt;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\Shipment;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\ActorResolver;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Laravel\Sanctum\Sanctum;
use LogicException;
use Tests\TestCase;

class ActorAttributionTest extends TestCase
{
    use RefreshDatabase;

    protected User $actor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->actor = User::factory()->create([
            'id' => 42,
            'name' => 'Alex Operator',
            'email' => 'alex@stockpilot.io',
        ]);
    }

    public function test_actor_resource_formats_actor_summary_correctly(): void
    {
        $resource = new ActorResource($this->actor);
        $array = $resource->resolve();

        $this->assertSame([
            'id' => 42,
            'name' => 'Alex Operator',
        ], $array);

        $nullResource = new ActorResource(null);
        $this->assertNull($nullResource->resolve());
    }

    public function test_all_six_domain_resources_format_actor_summaries_correctly(): void
    {
        $secondActor = User::factory()->create([
            'id' => 99,
            'name' => 'Sam Manager',
        ]);

        $request = Request::create('/');

        // 1. StockMovementResource
        $movement = new StockMovement([
            'product_id' => 1,
            'warehouse_id' => 1,
            'type' => 'receipt',
            'quantity_delta' => 50,
            'balance_after' => 150,
            'performed_by' => $this->actor->id,
        ]);
        $movement->setRelation('performedBy', $this->actor);

        $movementArray = (new StockMovementResource($movement))->toArray($request);
        $this->assertArrayHasKey('performed_by', $movementArray);
        $this->assertSame(['id' => 42, 'name' => 'Alex Operator'], $movementArray['performed_by']->resolve());

        // 2. PurchaseOrderResource
        $po = new PurchaseOrder([
            'po_number' => 'PO-2026-0001',
            'total_amount' => 1250.00,
            'status' => 'submitted',
            'created_by' => $this->actor->id,
            'submitted_by' => $secondActor->id,
        ]);
        $po->setRelation('createdBy', $this->actor);
        $po->setRelation('submittedBy', $secondActor);
        $po->setRelation('cancelledBy', null);

        $poArray = (new PurchaseOrderResource($po))->toArray($request);
        $this->assertSame(['id' => 42, 'name' => 'Alex Operator'], $poArray['created_by']->resolve());
        $this->assertSame(['id' => 99, 'name' => 'Sam Manager'], $poArray['submitted_by']->resolve());
        $this->assertNull($poArray['cancelled_by']->resolve());

        // 3. GoodsReceiptResource
        $receipt = new GoodsReceipt([
            'receipt_number' => 'GRN-2026-0001',
            'received_by' => $this->actor->id,
        ]);
        $receipt->setRelation('receivedBy', $this->actor);

        $receiptArray = (new GoodsReceiptResource($receipt))->toArray($request);
        $this->assertSame(['id' => 42, 'name' => 'Alex Operator'], $receiptArray['received_by']->resolve());

        // 4. SalesOrderResource
        $so = new SalesOrder([
            'so_number' => 'SO-2026-0001',
            'status' => 'confirmed',
            'created_by' => $this->actor->id,
            'confirmed_by' => $secondActor->id,
        ]);
        $so->setRelation('createdBy', $this->actor);
        $so->setRelation('confirmedBy', $secondActor);
        $so->setRelation('cancelledBy', null);

        $soArray = (new SalesOrderResource($so))->toArray($request);
        $this->assertSame(['id' => 42, 'name' => 'Alex Operator'], $soArray['created_by']->resolve());
        $this->assertSame(['id' => 99, 'name' => 'Sam Manager'], $soArray['confirmed_by']->resolve());
        $this->assertNull($soArray['cancelled_by']->resolve());

        // 5. ShipmentResource
        $shipment = new Shipment([
            'shipment_number' => 'SHP-2026-0001',
            'fulfilled_by' => $this->actor->id,
        ]);
        $shipment->setRelation('fulfilledBy', $this->actor);

        $shipmentArray = (new ShipmentResource($shipment))->toArray($request);
        $this->assertSame(['id' => 42, 'name' => 'Alex Operator'], $shipmentArray['fulfilled_by']->resolve());

        // 6. PaymentResource
        $payment = new Payment([
            'payment_number' => 'PAY-2026-0001',
            'amount' => 500.00,
            'recorded_by' => $this->actor->id,
        ]);
        $payment->setRelation('recordedBy', $this->actor);

        $paymentArray = (new PaymentResource($payment))->toArray($request);
        $this->assertSame(['id' => 42, 'name' => 'Alex Operator'], $paymentArray['recorded_by']->resolve());
    }

    public function test_actor_resolver_resolves_authenticated_user_id(): void
    {
        Sanctum::actingAs($this->actor);

        $this->assertSame(42, ActorResolver::resolveId());
        $this->assertSame($this->actor->id, ActorResolver::resolve()->id);

        $explicitActor = User::factory()->create(['id' => 88, 'name' => 'Explicit Actor']);
        $this->assertSame(88, ActorResolver::resolveId($explicitActor));
        $this->assertSame(88, ActorResolver::resolve($explicitActor)->id);
    }

    public function test_actor_resolver_throws_when_unauthenticated(): void
    {
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('Cannot attribute transaction: no authenticated user session');

        ActorResolver::resolveId();
    }

    public function test_actor_resolver_sanitizes_spoofed_client_actor_keys(): void
    {
        $spoofedPayload = [
            'product_id' => 10,
            'quantity' => 5,
            'performed_by' => 999,
            'created_by' => 999,
            'submitted_by' => 999,
            'cancelled_by' => 999,
            'confirmed_by' => 999,
            'received_by' => 999,
            'fulfilled_by' => 999,
            'recorded_by' => 999,
            'actor_id' => 999,
            'notes' => 'Legitimate operational memo',
        ];

        $sanitized = ActorResolver::sanitizePayload($spoofedPayload);

        $this->assertSame([
            'product_id' => 10,
            'quantity' => 5,
            'notes' => 'Legitimate operational memo',
        ], $sanitized);

        $this->assertArrayNotHasKey('performed_by', $sanitized);
        $this->assertArrayNotHasKey('created_by', $sanitized);
        $this->assertArrayNotHasKey('actor_id', $sanitized);
    }

    public function test_blueprint_macros_are_registered(): void
    {
        $this->assertTrue(Blueprint::hasMacro('actor'));
        $this->assertTrue(Blueprint::hasMacro('nullableActor'));
    }

    public function test_model_actor_relations_and_inverse_user_relations(): void
    {
        $movement = new StockMovement();
        $this->assertInstanceOf(BelongsTo::class, $movement->performedBy());

        $po = new PurchaseOrder();
        $this->assertInstanceOf(BelongsTo::class, $po->createdBy());
        $this->assertInstanceOf(BelongsTo::class, $po->submittedBy());
        $this->assertInstanceOf(BelongsTo::class, $po->cancelledBy());

        $receipt = new GoodsReceipt();
        $this->assertInstanceOf(BelongsTo::class, $receipt->receivedBy());

        $so = new SalesOrder();
        $this->assertInstanceOf(BelongsTo::class, $so->createdBy());
        $this->assertInstanceOf(BelongsTo::class, $so->confirmedBy());
        $this->assertInstanceOf(BelongsTo::class, $so->cancelledBy());

        $shipment = new Shipment();
        $this->assertInstanceOf(BelongsTo::class, $shipment->fulfilledBy());

        $payment = new Payment();
        $this->assertInstanceOf(BelongsTo::class, $payment->recordedBy());

        // Inverse User relations
        $user = new User();
        $this->assertInstanceOf(HasMany::class, $user->stockMovements());
        $this->assertInstanceOf(HasMany::class, $user->createdPurchaseOrders());
        $this->assertInstanceOf(HasMany::class, $user->submittedPurchaseOrders());
        $this->assertInstanceOf(HasMany::class, $user->cancelledPurchaseOrders());
        $this->assertInstanceOf(HasMany::class, $user->receivedGoodsReceipts());
        $this->assertInstanceOf(HasMany::class, $user->createdSalesOrders());
        $this->assertInstanceOf(HasMany::class, $user->confirmedSalesOrders());
        $this->assertInstanceOf(HasMany::class, $user->cancelledSalesOrders());
        $this->assertInstanceOf(HasMany::class, $user->fulfilledShipments());
        $this->assertInstanceOf(HasMany::class, $user->recordedPayments());
    }
}
