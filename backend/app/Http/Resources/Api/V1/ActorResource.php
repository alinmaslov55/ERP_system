<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{id: int, name: string}|null
     */
    public function toArray(Request $request): ?array
    {
        if (is_null($this->resource)) {
            return null;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
