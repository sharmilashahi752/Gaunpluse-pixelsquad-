<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Edge extends Model
{
    protected $guarded = [];
    protected function casts(): array { return ['distance' => 'float']; }
    public function village() { return $this->belongsTo(Village::class); }
    public function source() { return $this->belongsTo(Node::class, 'source_node_id'); }
    public function target() { return $this->belongsTo(Node::class, 'target_node_id'); }
}
