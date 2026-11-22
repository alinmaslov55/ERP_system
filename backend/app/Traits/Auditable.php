<?php

namespace App\Traits;

use App\Models\AuditLog;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

trait Auditable
{
    /**
     * Boot the Auditable trait for the model.
     */
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            if ($model->isAuditingEnabled()) {
                $morph = $model->getAuditActionPrefix();
                AuditLogger::record(
                    action: "{$morph}.created",
                    auditable: $model,
                    oldValues: null,
                    newValues: $model->getAttributes()
                );
            }
        });

        static::updated(function ($model) {
            if ($model->isAuditingEnabled()) {
                $changes = $model->getChanges();
                $excluded = $model->auditExcludedAttributes();

                $relevantChanges = array_diff_key($changes, array_flip($excluded));

                if (!empty($relevantChanges)) {
                    $oldValues = [];
                    $newValues = [];

                    foreach ($relevantChanges as $key => $val) {
                        $oldValues[$key] = $model->getOriginal($key);
                        $newValues[$key] = $val;
                    }

                    $morph = $model->getAuditActionPrefix();
                    AuditLogger::record(
                        action: "{$morph}.updated",
                        auditable: $model,
                        oldValues: $oldValues,
                        newValues: $newValues
                    );
                }
            }
        });

        static::deleted(function ($model) {
            if ($model->isAuditingEnabled()) {
                $morph = $model->getAuditActionPrefix();
                AuditLogger::record(
                    action: "{$morph}.deleted",
                    auditable: $model,
                    oldValues: $model->getAttributes(),
                    newValues: null
                );
            }
        });
    }

    /**
     * Relationship to historical audit logs for this entity.
     */
    public function audits(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    /**
     * Prefix used for audit actions, e.g. "product" for product.updated.
     */
    public function getAuditActionPrefix(): string
    {
        return Str::snake(class_basename($this));
    }

    /**
     * Attributes excluded from diff-based auditing.
     */
    public function auditExcludedAttributes(): array
    {
        return [
            'updated_at',
            'created_at',
            'remember_token',
        ];
    }

    /**
     * Determine whether auditing is currently enabled for this model.
     */
    public function isAuditingEnabled(): bool
    {
        return property_exists($this, 'auditingDisabled') ? !$this->auditingDisabled : true;
    }
}
