<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
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
            'product_id' => $this->product_id,
            'warehouse_id' => $this->warehouse_id,
            'type' => $this->type,
            'quantity_delta' => $this->quantity_delta,
            'balance_after' => $this->balance_after,
            'unit_cost' => $this->unit_cost !== null ? (float) $this->unit_cost : null,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'reason' => $this->reason,
            'performed_by' => new ActorResource($this->performedBy),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
