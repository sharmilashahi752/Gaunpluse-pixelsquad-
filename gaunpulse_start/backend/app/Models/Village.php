<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Village extends Model
{
    protected $guarded = [];
    protected $appends = ['center_lat', 'center_lng', 'latitude', 'longitude', 'needs_location_confirmation'];
    protected function casts(): array
    {
        return [
            'is_demo' => 'boolean',
            'is_coordinates_confirmed' => 'boolean',
            'coordinates_confirmed_at' => 'datetime',
            'search_radius_meters' => 'integer',
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
    public function settlementGroups() { return $this->hasMany(SettlementGroup::class); }
    public function issues() { return $this->hasMany(Issue::class); }
    public function auditLogs() { return $this->hasMany(AuditLog::class); }
    public function municipalityRel() { return $this->belongsTo(Municipality::class, 'municipality_id'); }

    public function scopeForMunicipality($query, $municipalityId)
    {
        if ($municipalityId) {
            return $query->where('municipality_id', (string) $municipalityId);
        }
        return $query;
    }

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

    /**
     * Determine whether village coordinates are unconfirmed or at a generic fallback.
     */
    public function getNeedsLocationConfirmationAttribute(): bool
    {
        if (!empty($this->is_coordinates_confirmed)) {
            return false;
        }

        $lat = $this->center_lat;
        $lng = $this->center_lng;

        if ($lat === null || $lng === null) {
            return true;
        }

        // Generic fallback check (28.0, 84.0)
        if (abs($lat - 28.0) < 0.0001 && abs($lng - 84.0) < 0.0001) {
            return true;
        }

        // Out of Nepal bounds
        if ($lat < 26.0 || $lat > 31.0 || $lng < 80.0 || $lng > 89.0) {
            return true;
        }

        return false;
    }
}
