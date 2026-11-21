<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'village_id',
        'issue_id',
        'title',
        'description',
        'ward',
        'priority',
        'responsible_team',
        'start_date',
        'target_completion_date',
        'status',
        'progress_percentage',
        'notes',
    ];

    protected $casts = [
        'progress_percentage' => 'integer',
        'start_date' => 'date',
        'target_completion_date' => 'date',
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
