<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Municipality extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'ward_count' => 'integer',
            'center_lat' => 'float',
            'center_lng' => 'float',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function villages(): HasMany
    {
        return $this->hasMany(Village::class, 'municipality_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'municipality_id');
    }

    /**
     * Get array of all numerical wards available in this municipality.
     */
    public function getWardsListAttribute(): array
    {
        $count = max(1, $this->ward_count ?? 1);
        return range(1, $count);
    }
}
