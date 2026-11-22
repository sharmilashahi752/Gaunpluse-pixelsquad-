<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Complaint extends Model
{
    protected $table = 'complaints';

    protected $fillable = [
        'complaint_number',
        'user_id',
        'issue_id',
        'village_id',
        'ward_number',
        'title',
        'category',
        'custom_category',
        'description',
        'contact_number',
        'latitude',
        'longitude',
        'status',
        'priority',
        'official_response',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'submitted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    public function village(): BelongsTo
    {
        return $this->belongsTo(Village::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ComplaintMedia::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(ComplaintUpdate::class)->oldest();
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(CitizenNotification::class);
    }
}
