<?php

namespace App\Models;

use App\Traits\HasActorAttribution;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOrder extends Model
{
    use HasFactory, HasActorAttribution;

    protected $fillable = [
        'so_number',
        'customer_id',
        'warehouse_id',
        'status',
        'payment_status',
        'order_date',
        'total_amount',
        'paid_amount',
        'notes',
        'created_by',
        'confirmed_by',
        'confirmed_at',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
