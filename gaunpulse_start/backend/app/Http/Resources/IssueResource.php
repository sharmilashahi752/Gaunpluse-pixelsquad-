<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class IssueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'=>$this->id,'title'=>$this->title,'category'=>$this->category,'description'=>$this->description,
            'severity'=>$this->severity,'status'=>$this->status,'latitude'=>(float)$this->latitude,'longitude'=>(float)$this->longitude,
            'photo_url'=>$this->photo_path ? url('storage/'.$this->photo_path) : null,'created_at'=>$this->created_at,
            'village'=>$this->whenLoaded('village', fn()=>['id'=>$this->village->id,'name'=>$this->village->name]),
            'edge'=>$this->whenLoaded('edge', fn()=>['id'=>$this->edge?->id,'name'=>$this->edge?->name,'type'=>$this->edge?->type]),
            'reporter'=>$this->when($request->user()?->isAdmin() && $this->relationLoaded('reporter'), fn()=>['name'=>$this->reporter?->name,'email'=>$this->reporter?->email]),
            'updates'=>$this->whenLoaded('updates'),
            'priority_score'=>$this->whenLoaded('priorityScore'),
        ];
    }
}
