<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List audit activity logs with municipality scoping.
     */
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless(
            $actor->isSystemAdmin() || $actor->isMunicipalityAdmin(),
            403,
            'Only administrators can review system audit logs.'
        );

        $query = AuditLog::with(['village:id,name', 'municipality:id,name'])->latest('id');

        // Scoping: Municipality admin only sees logs for their municipality
        if (!$actor->isSystemAdmin()) {
            $query->where('municipality_id', $actor->municipality_id);
        } elseif ($request->filled('municipality_id')) {
            $query->where('municipality_id', $request->input('municipality_id'));
        }

        // Action Type Filter
        if ($action = $request->string('action_type')->toString()) {
            if ($action !== 'all') {
                $query->where('action_type', $action);
            }
        }

        // Entity Type Filter
        if ($entity = $request->string('entity_type')->toString()) {
            if ($entity !== 'all') {
                $query->where('entity_type', $entity);
            }
        }

        // Keyword Search
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('summary', 'like', "%{$search}%")
                    ->orWhere('performed_by', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 25))
        );
    }
}
