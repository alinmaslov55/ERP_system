<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $typeBasename = class_basename($this->auditable_type);

        return [
            'id' => $this->id,
            'action' => $this->action,
            'auditable_type' => $this->auditable_type,
            'auditable_type_label' => $typeBasename,
            'auditable_id' => $this->auditable_id,
            'target_label' => "{$typeBasename} #{$this->auditable_id}",
            'actor' => new ActorResource($this->whenLoaded('actor')),
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
