<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplaintMedia extends Model
{
    protected $table = 'complaint_media';

    protected $fillable = [
        'complaint_id',
        'media_type',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
    ];

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }
}
