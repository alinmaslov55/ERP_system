<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentResource extends JsonResource
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
            'shipment_number' => $this->shipment_number,
            'sales_order_id' => $this->sales_order_id,
            'warehouse_id' => $this->warehouse_id,
            'idempotency_key' => $this->idempotency_key,
            'carrier' => $this->carrier,
            'tracking_number' => $this->tracking_number,
            'notes' => $this->notes,
            'fulfilled_by' => new ActorResource($this->fulfilledBy),
            'shipped_at' => $this->shipped_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
