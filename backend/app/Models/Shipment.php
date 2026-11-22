<?php

namespace App\Models;

use App\Traits\HasActorAttribution;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    use HasFactory, HasActorAttribution;

    protected $fillable = [
        'shipment_number',
        'sales_order_id',
        'warehouse_id',
        'idempotency_key',
        'carrier',
        'tracking_number',
        'fulfilled_by',
        'shipped_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'shipped_at' => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
