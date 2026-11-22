<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use LogicException;

class ActorResolver
{
    /**
     * Forbidden client request keys that must never be accepted from client payloads.
     */
    public const FORBIDDEN_ACTOR_KEYS = [
        'performed_by',
        'created_by',
        'submitted_by',
        'cancelled_by',
        'confirmed_by',
        'received_by',
        'fulfilled_by',
        'recorded_by',
        'actor_id',
    ];

    /**
     * Resolve the authoritative actor user ID.
     * Prioritizes explicit User model passed in service calls, falling back to authenticated user.
     *
     * @throws LogicException
     */
    public static function resolveId(?User $actor = null): int
    {
        if ($actor) {
            return $actor->id;
        }

        $userId = Auth::id();

        if (!$userId) {
            throw new LogicException('Cannot attribute transaction: no authenticated user session or explicit actor provided.');
        }

        return $userId;
    }

    /**
     * Resolve the authoritative actor User instance.
     *
     * @throws LogicException
     */
    public static function resolve(?User $actor = null): User
    {
        if ($actor) {
            return $actor;
        }

        $user = Auth::user();

        if (!$user) {
            throw new LogicException('Cannot attribute transaction: no authenticated user session or explicit actor provided.');
        }

        return $user;
    }

    /**
     * Strip any client-injected actor attribution keys from input payload arrays.
     */
    public static function sanitizePayload(array $payload): array
    {
        return array_diff_key($payload, array_flip(self::FORBIDDEN_ACTOR_KEYS));
    }
}
