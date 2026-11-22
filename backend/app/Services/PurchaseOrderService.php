<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

class PurchaseOrderService
{
    /**
     * Transition a draft Purchase Order to submitted status.
     * Guaranteed to execute and log within the same database transaction.
     *
     * @throws LogicException
     */
    public function submit(PurchaseOrder $purchaseOrder, ?User $actor = null): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $actor) {
            $actorId = ActorResolver::resolveId($actor);

            if ($purchaseOrder->status !== 'draft') {
                throw new LogicException("Cannot submit purchase order with status '{$purchaseOrder->status}'. Only draft POs can be submitted.");
            }

            $oldStatus = $purchaseOrder->status;

            $purchaseOrder->status = 'submitted';
            $purchaseOrder->submitted_by = $actorId;
            $purchaseOrder->submitted_at = now();
            $purchaseOrder->save();

            AuditLogger::record(
                action: 'po.submitted',
                auditable: $purchaseOrder,
                oldValues: [
                    'status' => $oldStatus,
                ],
                newValues: [
                    'status' => 'submitted',
                    'submitted_by' => $actorId,
                    'submitted_at' => $purchaseOrder->submitted_at->toISOString(),
                ],
                actor: $actor
            );

            return $purchaseOrder;
        });
    }
}
