<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CitizenNotification extends Model
{
    protected $table = 'citizen_notifications';

    protected $fillable = [
        'user_id',
        'complaint_id',
        'title',
        'message',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }
}
