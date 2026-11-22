<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use Auditable;

    protected $fillable = ['name', 'location', 'is_active'];
}
