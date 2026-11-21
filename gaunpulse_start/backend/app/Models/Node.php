<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Node extends Model
{
    protected $guarded = [];
    protected function casts(): array { return ['latitude' => 'float', 'longitude' => 'float']; }
    public function village() { return $this->belongsTo(Village::class); }
}
