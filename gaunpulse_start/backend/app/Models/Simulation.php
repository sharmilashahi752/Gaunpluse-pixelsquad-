<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Simulation extends Model
{
    protected $guarded = [];
    protected function casts(): array { return ['blocked_edge_ids' => 'array', 'result' => 'array']; }
}
