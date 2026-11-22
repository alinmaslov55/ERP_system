<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait HasActorAttribution
{
    /**
     * The user who performed the inventory stock change.
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * The user who drafted/created the document.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The user who submitted the purchase order.
     */
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * The user who cancelled the order.
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * The user who confirmed the sales order.
     */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * The user who received incoming goods.
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * The user who fulfilled/shipped the order.
     */
    public function fulfilledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }

    /**
     * The user who recorded the customer payment.
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Helper to retrieve a standard actor summary { id, name } for any relation.
     *
     * @return array{id: int, name: string}|null
     */
    public function formatActor(string $relation): ?array
    {
        $actor = $this->$relation;

        if (!$actor) {
            return null;
        }

        return [
            'id' => $actor->id,
            'name' => $actor->name,
        ];
    }
}
