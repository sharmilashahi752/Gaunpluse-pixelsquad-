<?php
namespace App\Http\Controllers;
use App\Http\Requests\StoreIssueRequest;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use Illuminate\Http\Request;
class IssueController extends Controller
{
    public function index(Request $request)
    {
        $query=Issue::with(['village','edge'])->latest();
        foreach(['category','severity','status','village_id'] as $filter) if($request->filled($filter)) $query->where($filter,$request->input($filter));
        return IssueResource::collection($query->paginate(20));
    }
    public function show(Issue $issue) { return new IssueResource($issue->load(['village','edge','updates.user'])); }
    public function store(StoreIssueRequest $request)
    {
        $data=$request->safe()->except('photo');
        $data['user_id']=$request->user()?->id;
        $data['status']='submitted';
        if($request->hasFile('photo')) $data['photo_path']=$request->file('photo')->store('issues','public');
        $issue=Issue::create($data);
        return (new IssueResource($issue->load(['village','edge'])))->response()->setStatusCode(201);
    }
}
