<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
class DashboardController extends Controller
{
    public function __invoke()
    {
        $counts=fn($column)=>Issue::selectRaw("{$column} as label, count(*) as total")->groupBy($column)->pluck('total','label');
        return response()->json(['summary'=>['total'=>Issue::count(),'open'=>Issue::whereNotIn('status',['resolved','rejected'])->count(),'resolved'=>Issue::where('status','resolved')->count(),'critical'=>Issue::where('severity','critical')->count(),'verified'=>Issue::whereIn('status',['verified','in_progress','resolved'])->count()],'by_category'=>$counts('category'),'by_status'=>$counts('status'),'by_severity'=>$counts('severity'),'recent'=>IssueResource::collection(Issue::with(['village','edge'])->latest()->limit(6)->get())]);
    }
}
