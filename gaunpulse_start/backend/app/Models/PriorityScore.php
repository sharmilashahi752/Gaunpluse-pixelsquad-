<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PriorityScore extends Model
{
    protected $guarded = [];
    protected function casts(): array { return ['severity_score'=>'float','population_score'=>'float','service_score'=>'float','verification_score'=>'float','total_score'=>'float']; }
}
