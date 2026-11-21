<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Node extends Model
{
    protected $guarded = [];
    protected $appends = ['type', 'node_type'];
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'confidence_score' => 'integer',
            'change_history' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public function village() { return $this->belongsTo(Village::class); }
    public function settlementGroup() { return $this->belongsTo(SettlementGroup::class); }
    public function facilities() { return $this->hasMany(Facility::class); }

    public function getTypeAttribute() {
        return $this->attributes['node_type'] ?? $this->attributes['type'] ?? 'junction';
    }

    public function getNodeTypeAttribute() {
        return $this->attributes['node_type'] ?? $this->attributes['type'] ?? 'junction';
    }
}
