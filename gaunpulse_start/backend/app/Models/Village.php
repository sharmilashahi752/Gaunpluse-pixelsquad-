<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Village extends Model
{
    protected $guarded = [];
    protected function casts(): array { return ['is_demo' => 'boolean', 'latitude' => 'float', 'longitude' => 'float']; }
    public function nodes() { return $this->hasMany(Node::class); }
    public function edges() { return $this->hasMany(Edge::class); }
    public function facilities() { return $this->hasMany(Facility::class); }
    public function settlements() { return $this->hasMany(SettlementGroup::class); }
    public function issues() { return $this->hasMany(Issue::class); }
}
