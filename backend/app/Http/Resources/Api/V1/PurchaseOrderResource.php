<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
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
            'po_number' => $this->po_number,
            'supplier_id' => $this->supplier_id,
            'warehouse_id' => $this->warehouse_id,
            'status' => $this->status,
            'order_date' => $this->order_date?->format('Y-m-d'),
            'expected_date' => $this->expected_date?->format('Y-m-d'),
            'total_amount' => (float) $this->total_amount,
            'notes' => $this->notes,
            'created_by' => new ActorResource($this->createdBy),
            'submitted_by' => new ActorResource($this->submittedBy),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'cancelled_by' => new ActorResource($this->cancelledBy),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
