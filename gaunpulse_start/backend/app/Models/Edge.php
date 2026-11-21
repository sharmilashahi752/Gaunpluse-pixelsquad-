<?php

namespace App\Models;

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
            'geometry' => 'array',
            'change_history' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public function village() { return $this->belongsTo(Village::class); }
    public function source() { return $this->belongsTo(Node::class, 'source_node_id'); }
    public function target() { return $this->belongsTo(Node::class, 'target_node_id'); }

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

    public function getLengthMetersAttribute()
    {
        if (isset($this->attributes['length_meters'])) {
            return (float) $this->attributes['length_meters'];
        }
        if (isset($this->attributes['distance'])) {
            return (float) ($this->attributes['distance'] * 1000);
        }
        return 100.0;
    }
}
