<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Edge extends Model
{
    protected $guarded = [];
    protected $appends = ['type', 'infrastructure_type', 'length_meters', 'provenance_source'];

    protected function casts(): array
    {
        return [
            'distance' => 'float',
            'is_critical' => 'boolean',
            'confidence_score' => 'integer',
            'travel_minutes' => 'float',
            'change_history' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public function village() { return $this->belongsTo(Village::class); }
    public function source() { return $this->belongsTo(Node::class, 'source_node_id'); }
    public function target() { return $this->belongsTo(Node::class, 'target_node_id'); }

    protected function geometry(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (is_array($value)) {
                    return $value;
                }
                if (is_string($value) && trim($value) !== '') {
                    $decoded = json_decode($value, true);
                    if (is_string($decoded)) {
                        // Unpack double-encoded JSON
                        $decoded = json_decode($decoded, true);
                    }
                    if (is_array($decoded) && !empty($decoded)) {
                        return $decoded;
                    }
                }

                // Fallback geometry from source and target endpoints if available
                if ($this->relationLoaded('source') && $this->relationLoaded('target')) {
                    $src = $this->getRelation('source');
                    $tgt = $this->getRelation('target');
                    if ($src && $tgt && isset($src->latitude, $tgt->latitude)) {
                        return [
                            [(float) $src->latitude, (float) $src->longitude],
                            [(float) $tgt->latitude, (float) $tgt->longitude],
                        ];
                    }
                }

                return [];
            },
            set: function ($value) {
                if (is_string($value)) {
                    $decoded = json_decode($value, true);
                    if (is_string($decoded)) {
                        $decoded = json_decode($decoded, true);
                    }
                    if (is_array($decoded)) {
                        return json_encode($decoded);
                    }
                    return $value;
                }
                return json_encode($value ?? []);
            }
        );
    }

    public function getSourceAttribute()
    {
        if ($this->relationLoaded('source')) {
            return $this->getRelation('source');
        }
        if (isset($this->attributes['source_node_id'])) {
            return $this->getRelationValue('source');
        }
        return $this->attributes['source'] ?? 'manual';
    }

    public function getProvenanceSourceAttribute()
    {
        return $this->attributes['source'] ?? 'manual';
    }

    public function getTypeAttribute()
    {
        return $this->attributes['infrastructure_type'] ?? $this->attributes['type'] ?? 'road';
    }

    public function getInfrastructureTypeAttribute()
    {
        return $this->attributes['infrastructure_type'] ?? $this->attributes['type'] ?? 'road';
    }

    public function getLengthMetersAttribute(): ?float
    {
        if (isset($this->attributes['length_meters'])) {
            return (float) $this->attributes['length_meters'];
        }
        if (isset($this->attributes['distance'])) {
            return (float) ($this->attributes['distance'] * 1000);
        }
        return null;
    }
}
