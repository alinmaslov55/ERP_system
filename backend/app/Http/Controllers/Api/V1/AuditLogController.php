<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AuditLogResource;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class AuditLogController extends Controller
{
    /**
     * Display a paginated listing of audit logs.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('audit.view');

        $query = AuditLog::query()->with('actor:id,name');

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->integer('actor_id'));
        }

        if ($request->filled('action')) {
            $action = $request->string('action')->trim();
            if (str_contains($action, '*')) {
                $query->where('action', 'like', str_replace('*', '%', $action));
            } else {
                $query->where('action', $action);
            }
        }

        if ($request->filled('auditable_type')) {
            $type = $request->string('auditable_type')->trim();
            if (!str_contains($type, '\\')) {
                // Short name search e.g. "Product" -> "App\Models\Product"
                $query->where(function ($q) use ($type) {
                    $q->where('auditable_type', $type)
                      ->orWhere('auditable_type', "App\\Models\\{$type}");
                });
            } else {
                $query->where('auditable_type', $type);
            }
        }

        if ($request->filled('auditable_id')) {
            $query->where('auditable_id', $request->integer('auditable_id'));
        }

        if ($request->filled('date_from')) {
            $dateFrom = Carbon::parse($request->string('date_from'))->startOfDay();
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($request->filled('date_to')) {
            $dateTo = Carbon::parse($request->string('date_to'))->endOfDay();
            $query->where('created_at', '<=', $dateTo);
        }

        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        $logs = $query->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return AuditLogResource::collection($logs);
    }
}
