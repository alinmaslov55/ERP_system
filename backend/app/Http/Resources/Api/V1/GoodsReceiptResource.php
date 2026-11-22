<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceiptResource extends JsonResource
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
            'receipt_number' => $this->receipt_number,
            'purchase_order_id' => $this->purchase_order_id,
            'warehouse_id' => $this->warehouse_id,
            'idempotency_key' => $this->idempotency_key,
            'supplier_reference' => $this->supplier_reference,
            'notes' => $this->notes,
            'received_by' => new ActorResource($this->receivedBy),
            'received_at' => $this->received_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
