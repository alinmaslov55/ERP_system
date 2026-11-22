<?php

namespace App\Models;

use App\Traits\HasActorAttribution;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceipt extends Model
{
    use HasFactory, HasActorAttribution;

    protected $fillable = [
        'receipt_number',
        'purchase_order_id',
        'warehouse_id',
        'idempotency_key',
        'received_by',
        'received_at',
        'supplier_reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
