<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'municipality_id' => 'integer',
            'village_id' => 'integer',
            'user_id' => 'integer',
            'entity_id' => 'integer',
        ];
    }

    public function village(): BelongsTo
    {
        return $this->belongsTo(Village::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(Municipality::class, 'municipality_id');
    }

    /**
     * Helper to write an immutable audit log record.
     */
    public static function record(
        string $actionType,
        string $entityType,
        ?int $entityId,
        string $summary,
        ?array $details = null,
        ?int $villageId = null,
        ?int $municipalityId = null,
        ?User $actor = null
    ): self {
        $actorUser = $actor ?? auth()->user();

        return self::create([
            'municipality_id' => $municipalityId ?? $actorUser?->municipality_id,
            'village_id' => $villageId,
            'user_id' => $actorUser?->id,
            'action_type' => $actionType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'performed_by' => $actorUser ? "{$actorUser->name} ({$actorUser->role})" : 'System Administrator',
            'summary' => $summary,
            'details' => $details ?? [],
        ]);
    }
}
