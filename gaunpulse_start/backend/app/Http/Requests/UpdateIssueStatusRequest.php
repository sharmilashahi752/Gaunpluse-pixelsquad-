<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class UpdateIssueStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() === true || $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'submitted',
                    'pending_verification',
                    'under_review',
                    'verified',
                    'in_progress',
                    'resolved',
                    'rejected',
                    'more_information_needed',
                ]),
            ],
            'comment' => ['nullable', 'string', 'max:2000'],
            'verification_notes' => ['nullable', 'string', 'max:2000'],
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
            'assigned_officer_id' => ['nullable', 'integer', 'exists:users,id'],
            'village_id' => ['nullable', 'integer', 'exists:villages,id'],
        ];
    }
}
