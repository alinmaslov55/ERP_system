<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use LogicException;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'actor_id',
        'action',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Booted hooks enforcing append-only immutability.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('AuditLog records are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new LogicException('AuditLog records are immutable and cannot be deleted.');
        });
    }

    /**
     * Explicitly block update calls.
     */
    public function update(array $attributes = [], array $options = []): bool
    {
        throw new LogicException('AuditLog records are immutable and cannot be updated.');
    }

    /**
     * Explicitly block delete calls.
     */
    public function delete(): ?bool
    {
        throw new LogicException('AuditLog records are immutable and cannot be deleted.');
    }

    /**
     * The authenticated user who performed the action.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * The entity that underwent the state mutation.
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
