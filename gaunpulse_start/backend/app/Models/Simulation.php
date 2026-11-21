<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Simulation extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'blocked_edge_ids' => 'array',
            'result' => 'array',
        ];
    }

    public function village(): BelongsTo
    {
        return $this->belongsTo(Village::class);
    }

    public function failedEdge(): BelongsTo
    {
        return $this->belongsTo(Edge::class, 'failed_edge_id');
    }
}
