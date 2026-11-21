<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityFeedback extends Model
{
    use HasFactory;

    protected $table = 'community_feedbacks';

    protected $fillable = [
        'village_id',
        'issue_id',
        'resident_name',
        'ward',
        'message',
        'tag',
        'status',
    ];

    public function village()
    {
        return $this->belongsTo(Village::class);
    }

    public function issue()
    {
        return $this->belongsTo(Issue::class);
    }
}
