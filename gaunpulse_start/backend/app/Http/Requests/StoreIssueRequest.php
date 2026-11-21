<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class StoreIssueRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'village_id' => ['required', 'exists:villages,id'],
            'edge_id' => ['nullable', Rule::exists('edges', 'id')->where(fn ($q) => $q->where('village_id', $this->integer('village_id')))],
            'title' => ['required', 'string', 'min:5', 'max:150'],
            'category' => ['required', Rule::in(['damaged_road','damaged_bridge','water_supply','school_access','health_post_access','other_infrastructure'])],
            'description' => ['required', 'string', 'min:15', 'max:3000'],
            'severity' => ['required', Rule::in(['low','medium','high','critical'])],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ];
    }
}
