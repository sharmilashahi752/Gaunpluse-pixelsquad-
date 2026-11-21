<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SettlementGroup extends Model { protected $guarded = []; public function node() { return $this->belongsTo(Node::class); } }
