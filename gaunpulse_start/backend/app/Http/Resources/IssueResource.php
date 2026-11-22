<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tracking_code' => $this->tracking_code ?? "GP-{$this->id}",
            'title' => $this->title,
            'category' => $this->category,
            'description' => $this->description,
            'speech_transcript' => $this->speech_transcript,
            'transcript_language' => $this->transcript_language,
            'settlement_name' => $this->settlement_name,
            'severity' => $this->severity,
            'status' => $this->status,
            'verified_at' => $this->verified_at,
            'verified_by' => $this->verified_by,
            'verifier_name' => $this->relationLoaded('verifier') ? $this->verifier?->name : ($this->verifier?->name ?? null),
            'verification_notes' => $this->verification_notes,
            'rejection_reason' => $this->rejection_reason,
            'ward_no' => $this->ward_no ?? $this->village?->ward_no,
            'municipality_id' => $this->municipality_id ?? $this->village?->municipality_id,
            'latitude' => (float)$this->latitude,
            'longitude' => (float)$this->longitude,
            'reporter_name' => $this->reporter_name ?? 'Community Resident',
            'reporter_phone' => $this->reporter_phone,
            'photo_url' => !empty($this->photo_path) ? url('storage/' . $this->photo_path) : null,
            'created_at' => $this->created_at,
            'village' => $this->whenLoaded('village', fn() => [
                'id' => $this->village->id,
                'name' => $this->village->name,
                'municipality' => $this->village->municipality,
                'ward_no' => $this->village->ward_no,
            ]),
            'edge' => $this->whenLoaded('edge', fn() => [
                'id' => $this->edge?->id,
                'name' => $this->edge?->name,
                'type' => $this->edge?->infrastructure_type ?? $this->edge?->type,
            ]),
            'reporter' => $this->when($request->user()?->isAdmin() && $this->relationLoaded('reporter'), fn() => [
                'name' => $this->reporter?->name,
                'email' => $this->reporter?->email,
            ]),
            'complaint' => $this->whenLoaded('complaint', function () {
                return [
                    'id' => $this->complaint->id,
                    'complaint_number' => $this->complaint->complaint_number,
                    'ward_number' => $this->complaint->ward_number,
                    'settlement_name' => $this->complaint->settlement_name,
                    'speech_transcript' => $this->complaint->speech_transcript,
                    'transcript_language' => $this->complaint->transcript_language,
                    'official_response' => $this->complaint->official_response,
                    'submitted_at' => $this->complaint->submitted_at,
                    'status' => $this->complaint->status,
                    'media' => $this->complaint->relationLoaded('media') ? $this->complaint->media->map(fn($m) => [
                        'id' => $m->id,
                        'media_type' => $m->media_type,
                        'url' => url('storage/' . $m->file_path),
                        'original_name' => $m->original_name,
                        'mime_type' => $m->mime_type,
                        'file_size' => $m->file_size,
                    ]) : [],
                ];
            }),
            'updates' => $this->whenLoaded('updates', function () {
                return $this->updates->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'old_status' => $u->old_status,
                        'new_status' => $u->new_status,
                        'status' => $u->status ?? $u->new_status,
                        'comment' => $u->comment,
                        'user_id' => $u->user_id,
                        'user_name' => $u->relationLoaded('user') && $u->user ? $u->user->name : ($u->updated_by ?? 'Municipal Officer'),
                        'created_at' => $u->created_at,
                    ];
                });
            }),
            'priority_score' => $this->whenLoaded('priorityScore'),
        ];
    }
}
