<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettlementGroup extends Model
{
    protected $guarded = [];
    protected $appends = ['households'];

    protected function casts(): array
    {
        return [
            'households' => 'integer',
            'population' => 'integer',
            'elevation_meters' => 'float',
        ];
    }

    public function village()
    {
        return $this->belongsTo(Village::class);
    }

    public function nodes()
    {
        return $this->hasMany(Node::class, 'settlement_group_id');
    }

    public function node()
    {
        return $this->hasOne(Node::class, 'settlement_group_id');
    }

    public function getHouseholdsAttribute(): int
    {
        if (isset($this->attributes['households']) && (int) $this->attributes['households'] > 0) {
            return (int) $this->attributes['households'];
        }

        $pop = (int) ($this->attributes['population'] ?? 0);
        if ($pop > 0) {
            return (int) max(1, ceil($pop / 4.7));
        }

        return 45;
    }
}


