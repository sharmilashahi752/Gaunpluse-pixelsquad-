<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class RunSimulationRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->isAdmin() === true; }
    public function rules(): array
    {
        return ['village_id'=>['required','exists:villages,id'], 'blocked_edge_ids'=>['required','array','min:1'], 'blocked_edge_ids.*'=>['integer','distinct',Rule::exists('edges','id')->where(fn($q)=>$q->where('village_id',$this->integer('village_id')))]];
    }
}
