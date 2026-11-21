<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Village extends Model
{
    protected $guarded = [];
    protected $appends = ['center_lat', 'center_lng', 'latitude', 'longitude'];
    protected function casts(): array
    {
        return [
            'is_demo' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
            'metadata' => 'array',
            'reference_year' => 'integer',
            'onboarding_step' => 'integer',
            'last_imported_at' => 'datetime',
        ];
    }

    public function nodes() { return $this->hasMany(Node::class); }
    public function edges() { return $this->hasMany(Edge::class); }
    public function facilities() { return $this->hasMany(Facility::class); }
    public function settlements() { return $this->hasMany(SettlementGroup::class); }
    public function issues() { return $this->hasMany(Issue::class); }
    public function auditLogs() { return $this->hasMany(AuditLog::class); }

    public function getCenterLatAttribute(): ?float
    {
        $value = $this->attributes['center_lat'] ?? $this->attributes['latitude'] ?? null;

        return $value !== null ? (float) $value : null;
    }

    public function getCenterLngAttribute(): ?float
    {
        $value = $this->attributes['center_lng'] ?? $this->attributes['longitude'] ?? null;

        return $value !== null ? (float) $value : null;
    }

    public function getLatitudeAttribute(): ?float
    {
        $value = $this->attributes['latitude'] ?? $this->attributes['center_lat'] ?? null;

        return $value !== null ? (float) $value : null;
    }

    public function getLongitudeAttribute(): ?float
    {
        $value = $this->attributes['longitude'] ?? $this->attributes['center_lng'] ?? null;

        return $value !== null ? (float) $value : null;
    }
}
