<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\HasActorAttribution;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrder extends Model
{
    use HasFactory, HasActorAttribution, Auditable;

    protected $fillable = [
        'po_number',
        'supplier_id',
        'warehouse_id',
        'status',
        'order_date',
        'expected_date',
        'total_amount',
        'notes',
        'created_by',
        'submitted_by',
        'submitted_at',
        'cancelled_by',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_date' => 'date',
            'total_amount' => 'decimal:2',
            'submitted_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
