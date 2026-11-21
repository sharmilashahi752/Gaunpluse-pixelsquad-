<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Village extends Model
{
    protected $guarded = [];
    protected $appends = ['center_lat', 'center_lng', 'latitude', 'longitude'];
    protected function casts(): array { return ['is_demo' => 'boolean', 'latitude' => 'float', 'longitude' => 'float']; }

    public function nodes() { return $this->hasMany(Node::class); }
    public function edges() { return $this->hasMany(Edge::class); }
    public function facilities() { return $this->hasMany(Facility::class); }
    public function settlements() { return $this->hasMany(SettlementGroup::class); }
    public function issues() { return $this->hasMany(Issue::class); }

    public function getCenterLatAttribute() {
        return (float) ($this->attributes['center_lat'] ?? $this->attributes['latitude'] ?? 27.8635);
    }

    public function getCenterLngAttribute() {
        return (float) ($this->attributes['center_lng'] ?? $this->attributes['longitude'] ?? 85.5815);
    }

    public function getLatitudeAttribute() {
        return (float) ($this->attributes['latitude'] ?? $this->attributes['center_lat'] ?? 27.8635);
    }

    public function getLongitudeAttribute() {
        return (float) ($this->attributes['longitude'] ?? $this->attributes['center_lng'] ?? 85.5815);
    }
}
