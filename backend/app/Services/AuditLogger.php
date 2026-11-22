<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Sensitive attribute keys that must be redacted before persistence.
     */
    public const SENSITIVE_ATTRIBUTES = [
        'password',
        'remember_token',
        'secret',
        'token',
        'api_token',
    ];

    /**
     * Record an audit log entry.
     */
    public static function record(
        string $action,
        Model $auditable,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?User $actor = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): AuditLog {
        $actorId = $actor ? $actor->id : Auth::id();
        $ip = $ipAddress ?? Request::ip();
        $ua = $userAgent ?? Request::userAgent();

        return AuditLog::create([
            'actor_id' => $actorId,
            'action' => $action,
            'auditable_type' => $auditable->getMorphClass(),
            'auditable_id' => $auditable->getKey(),
            'old_values' => $oldValues !== null ? self::redactSensitive($oldValues) : null,
            'new_values' => $newValues !== null ? self::redactSensitive($newValues) : null,
            'ip_address' => $ip,
            'user_agent' => $ua ? substr($ua, 0, 500) : null,
            'created_at' => now(),
        ]);
    }

    /**
     * Redact sensitive attributes from values array.
     */
    public static function redactSensitive(array $values): array
    {
        foreach (self::SENSITIVE_ATTRIBUTES as $key) {
            if (array_key_exists($key, $values)) {
                $values[$key] = '[REDACTED]';
            }
        }

        return $values;
    }
}
