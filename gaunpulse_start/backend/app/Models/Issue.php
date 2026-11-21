<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Issue extends Model
{
    protected $guarded = [];
    protected function casts(): array { return ['latitude' => 'float', 'longitude' => 'float']; }
    public function village() { return $this->belongsTo(Village::class); }
    public function edge() { return $this->belongsTo(Edge::class); }
    public function reporter() { return $this->belongsTo(User::class, 'user_id'); }
    public function updates() { return $this->hasMany(IssueUpdate::class); }
    public function priorityScore() { return $this->hasOne(PriorityScore::class)->latestOfMany(); }
}
