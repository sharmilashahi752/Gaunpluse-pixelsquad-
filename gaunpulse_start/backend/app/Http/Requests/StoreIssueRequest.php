<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'village_id' => ['required', 'exists:villages,id'],
            'edge_id' => [
                'nullable',
                Rule::exists('edges', 'id')->where(fn ($q) => $q->where('village_id', $this->integer('village_id'))),
            ],
            'title' => ['required', 'string', 'min:5', 'max:150'],
            'category' => [
                'required',
                Rule::in([
                    'damaged_road',
                    'damaged_bridge',
                    'water_supply',
                    'school_access',
                    'health_post_access',
                    'other_infrastructure',
                ]),
            ],
            'description' => ['required', 'string', 'min:15', 'max:3000'],
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'photo' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'village_id.required' => 'Please select a village.',
            'village_id.exists' => 'The selected village is invalid or not registered.',
            'edge_id.exists' => 'The selected infrastructure asset does not belong to the chosen village.',
            'title.required' => 'Please enter an issue title.',
            'title.min' => 'The issue title must be at least 5 characters.',
            'title.max' => 'The issue title must not exceed 150 characters.',
            'category.required' => 'Please select an infrastructure category.',
            'category.in' => 'The selected category is invalid.',
            'description.required' => 'Please describe the observed damage and community impact.',
            'description.min' => 'Please provide more details in the description (at least 15 characters).',
            'severity.required' => 'Please select a severity tier.',
            'severity.in' => 'The selected severity level is invalid.',
            'latitude.required' => 'Valid latitude coordinates are required.',
            'latitude.between' => 'Latitude must be between -90 and 90 degrees.',
            'longitude.required' => 'Valid longitude coordinates are required.',
            'longitude.between' => 'Longitude must be between -180 and 180 degrees.',
            'photo.image' => 'The attached file must be an image.',
            'photo.mimes' => 'The photo must be a file of type: jpeg, jpg, png, or webp.',
            'photo.max' => 'The photo size may not be greater than 5MB.',
        ];
    }
}
