<?php
namespace App\Http\Controllers;
use App\Models\Village;
class VillageController extends Controller
{
    public function index() { return Village::query()->withCount(['settlements','issues'])->get(); }
    public function network(Village $village)
    {
        return response()->json(['village'=>$village,'nodes'=>$village->nodes()->get(),'edges'=>$village->edges()->with(['source','target'])->get(),'facilities'=>$village->facilities()->with('node')->get(),'settlements'=>$village->settlements()->with('node')->get(),'issues'=>$village->issues()->latest()->get(),'disclaimer'=>'Fictional demonstration network and population estimates; not municipal records.']);
    }
}
