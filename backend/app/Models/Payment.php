<?php

namespace App\Models;

use App\Traits\HasActorAttribution;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory, HasActorAttribution;

    protected $fillable = [
        'payment_number',
        'sales_order_id',
        'customer_id',
        'idempotency_key',
        'amount',
        'method',
        'reference',
        'paid_at',
        'recorded_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }
}
