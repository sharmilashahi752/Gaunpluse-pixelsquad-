<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateIssueStatusRequest;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use App\Models\IssueUpdate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class AdminIssueController extends Controller
{
    public function index(Request $request)
    {
        $query=Issue::with(['village','edge','reporter','priorityScore'])->latest();
        foreach(['category','severity','status','village_id'] as $filter) if($request->filled($filter)) $query->where($filter,$request->input($filter));
        return IssueResource::collection($query->paginate(50));
    }
    public function show(Issue $issue) { return new IssueResource($issue->load(['village','edge','reporter','updates.user','priorityScore'])); }
    public function updateStatus(UpdateIssueStatusRequest $request, Issue $issue)
    {
        DB::transaction(function() use($request,$issue){ $old=$issue->status; $issue->update(['status'=>$request->status]); IssueUpdate::create(['issue_id'=>$issue->id,'user_id'=>$request->user()->id,'old_status'=>$old,'new_status'=>$request->status,'comment'=>$request->comment]); });
        return new IssueResource($issue->fresh()->load(['village','edge','updates.user']));
    }
}
