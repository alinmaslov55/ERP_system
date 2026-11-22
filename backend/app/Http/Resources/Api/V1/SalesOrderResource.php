<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'so_number' => $this->so_number,
            'customer_id' => $this->customer_id,
            'warehouse_id' => $this->warehouse_id,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'order_date' => $this->order_date?->format('Y-m-d'),
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) $this->paid_amount,
            'notes' => $this->notes,
            'created_by' => new ActorResource($this->createdBy),
            'confirmed_by' => new ActorResource($this->confirmedBy),
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'cancelled_by' => new ActorResource($this->cancelledBy),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'cancellation_reason' => $this->cancellation_reason,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
