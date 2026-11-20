<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_active' => (bool) $this->is_active,
            'last_login_at' => $this->last_login_at?->toISOString(),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('slug'), []),
            'role_ids' => $this->whenLoaded('roles', fn () => $this->roles->pluck('id'), []),
            'role_details' => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'slug' => $r->slug,
                'description' => $r->description,
            ]), []),
            'permissions' => method_exists($this->resource, 'allPermissions') ? $this->allPermissions() : [],
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
