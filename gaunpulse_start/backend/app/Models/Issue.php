<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Issue extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function village(): BelongsTo
    {
        return $this->belongsTo(Village::class);
    }

    public function edge(): BelongsTo
    {
        return $this->belongsTo(Edge::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(IssueUpdate::class);
    }

    public function priorityScore(): HasOne
    {
        return $this->hasOne(PriorityScore::class)->latestOfMany();
    }

    public function complaint(): HasOne
    {
        return $this->hasOne(Complaint::class);
    }
}
