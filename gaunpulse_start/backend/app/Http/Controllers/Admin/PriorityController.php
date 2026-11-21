<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Services\PriorityScoringService;
class PriorityController extends Controller
{
    public function __invoke(PriorityScoringService $scoring)
    {
        $items=Issue::with(['village','edge','priorityScore'])->get()->map(function($issue) use($scoring){ $score=$issue->priorityScore ?: $scoring->score($issue); return ['issue'=>['id'=>$issue->id,'title'=>$issue->title,'severity'=>$issue->severity,'status'=>$issue->status,'category'=>$issue->category,'village'=>$issue->village->name,'edge'=>$issue->edge?->name],'score'=>$score,'label'=>$scoring->label($score->total_score)]; })->sortByDesc(fn($item)=>$item['score']->total_score ?? -1)->values();
        return response()->json(['weights'=>PriorityScoringService::WEIGHTS,'policy_notice'=>'Illustrative evidence aid only; not an automatic or approved municipal decision.','data'=>$items]);
    }
}
