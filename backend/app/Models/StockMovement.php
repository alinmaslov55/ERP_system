<?php

namespace App\Models;

use App\Traits\HasActorAttribution;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory, HasActorAttribution;

    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'type',
        'quantity_delta',
        'balance_after',
        'unit_cost',
        'reference_type',
        'reference_id',
        'reason',
        'performed_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_delta' => 'integer',
            'balance_after' => 'integer',
            'unit_cost' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
