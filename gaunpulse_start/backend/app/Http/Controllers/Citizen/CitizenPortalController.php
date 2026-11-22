<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\CitizenNotification;
use App\Models\Complaint;
use App\Models\ComplaintMedia;
use App\Models\ComplaintUpdate;
use App\Models\Issue;
use App\Models\IssueUpdate;
use App\Models\User;
use App\Models\Village;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class CitizenPortalController extends Controller
{
    public const CATEGORIES = [
        'Road Damage',
        'Bridge Damage',
        'Drinking Water',
        'Water Pipeline',
        'Drainage',
        'Street Light',
        'School Infrastructure',
        'Health Facility',
        'Flood Damage',
        'Landslide',
        'Public Building',
        'Other',
    ];

    /**
     * Map citizen-friendly category to GaunPulse core issue categories.
     */
    public static function mapToIssueCategory(string $category): string
    {
        return match ($category) {
            'Road Damage', 'Flood Damage', 'Landslide' => 'damaged_road',
            'Bridge Damage' => 'damaged_bridge',
            'Drinking Water', 'Water Pipeline', 'Drainage' => 'water_supply',
            'School Infrastructure' => 'school_access',
            'Health Facility' => 'health_post_access',
            default => 'other_infrastructure',
        };
    }

    /**
     * Infer severity from citizen complaint category.
     */
    public static function inferSeverity(string $category): string
    {
        return match ($category) {
            'Landslide', 'Flood Damage' => 'critical',
            'Road Damage', 'Bridge Damage', 'Drinking Water' => 'high',
            'School Infrastructure', 'Health Facility', 'Water Pipeline', 'Drainage' => 'medium',
            default => 'low',
        };
    }

    /**
     * Synchronize Admin Issue status update into citizen complaint and trigger notification.
     */
    public static function syncIssueStatusToComplaint(Issue $issue, string $adminStatus, ?string $comment = null, ?int $userId = null): void
    {
        $complaint = Complaint::where('issue_id', $issue->id)->first();
        if (!$complaint) {
            return;
        }

        $complaintStatus = match ($adminStatus) {
            'submitted', 'pending_verification' => 'pending',
            'verified' => 'verified',
            'more_information_needed' => 'more_information_needed',
            'under_review' => 'under_review',
            'in_progress' => 'in_progress',
            'resolved' => 'resolved',
            'rejected' => 'rejected',
            default => 'pending',
        };

        $oldStatus = $complaint->status;
        $complaint->status = $complaintStatus;
        if ($comment) {
            $complaint->official_response = $comment;
        }
        if ($adminStatus === 'verified') {
            $complaint->verified_by = $userId;
            $complaint->verified_at = now();
        } elseif ($adminStatus === 'rejected') {
            $complaint->rejection_reason = $comment;
        }
        $complaint->save();

        ComplaintUpdate::create([
            'complaint_id' => $complaint->id,
            'user_id' => $userId,
            'old_status' => $oldStatus,
            'new_status' => $complaintStatus,
            'message' => $comment ?: ("Municipal status updated to " . str_replace('_', ' ', $complaintStatus) . " by Municipal Operations."),
        ]);

        $notificationTitle = match ($complaintStatus) {
            'verified' => "Report Verified: {$complaint->complaint_number}",
            'more_information_needed' => "Action Required: {$complaint->complaint_number}",
            'rejected' => "Review Notice: {$complaint->complaint_number}",
            'in_progress' => "Repairs Underway: {$complaint->complaint_number}",
            'resolved' => "Resolved: {$complaint->complaint_number}",
            default => "Update on Report {$complaint->complaint_number}",
        };

        $notificationMsg = match ($complaintStatus) {
            'verified' => "Your report '{$complaint->title}' has been verified on-site by municipal technical staff and queued for repair planning." . ($comment ? " Notes: {$comment}" : ""),
            'more_information_needed' => "Municipal staff requested additional details on '{$complaint->title}': {$comment}",
            'rejected' => "Your report '{$complaint->title}' was reviewed and closed: {$comment}",
            'in_progress' => "Repair work has commenced on '{$complaint->title}'." . ($comment ? " Notes: {$comment}" : ""),
            'resolved' => "Infrastructure repairs on '{$complaint->title}' have been completed." . ($comment ? " Notes: {$comment}" : ""),
            default => "Your complaint '{$complaint->title}' status is now " . ucfirst(str_replace('_', ' ', $complaintStatus)) . ($comment ? ": {$comment}" : "."),
        };

        CitizenNotification::create([
            'user_id' => $complaint->user_id,
            'complaint_id' => $complaint->id,
            'title' => $notificationTitle,
            'message' => $notificationMsg,
        ]);
    }

    /**
     * Citizen Registration
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'ward_number' => ['nullable', 'integer', 'between:1,33'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'citizen',
            'contact_number' => $validated['contact_number'] ?? null,
            'ward_number' => $validated['ward_number'] ?? null,
        ]);

        $token = $user->createToken('gaunpulse-citizen')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => 'Citizen account registered successfully.',
        ], 201);
    }

    /**
     * Citizen Login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $token = $user->createToken('gaunpulse-citizen')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Citizen Logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get Authenticated Citizen
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Locations and Categories for Complaint Submission across All of Nepal
     */
    public function locations(Request $request): JsonResponse
    {
        // 1. Direct search if q parameter is provided
        if ($request->filled('q')) {
            $locationController = app(\App\Http\Controllers\LocationController::class);
            return $locationController->search($request);
        }

        // 2. Official Provinces Directory (All 7 Provinces)
        $officialProvinces = \App\Services\NepalLocationService::getProvinces();
        $selectedProvince = $request->input('province');
        $selectedDistrict = $request->input('district');

        // 3. Official Districts (Filtered by province if supplied, otherwise all 77 districts)
        $officialDistricts = \App\Services\NepalLocationService::getDistricts($selectedProvince);

        // 4. Official Municipalities (Filtered by district if supplied)
        $catalogMunis = \App\Services\NepalLocationService::getMunicipalities($selectedDistrict);

        // Fetch any existing registered municipalities from MySQL
        $dbMuniQuery = \App\Models\Municipality::query()->orderBy('name');
        if ($selectedProvince) {
            $dbMuniQuery->where('province', 'LIKE', "%{$selectedProvince}%");
        }
        if ($selectedDistrict) {
            $dbMuniQuery->where('district', $selectedDistrict);
        }
        $dbMunis = $dbMuniQuery->get(['id', 'name', 'code', 'district', 'province', 'ward_count', 'center_lat', 'center_lng', 'type']);

        // Merge catalog and DB municipalities with consistent keys
        $municipalities = collect($catalogMunis)->map(function ($m) use ($dbMunis) {
            $dbMatch = $dbMunis->first(function ($dm) use ($m) {
                return (isset($m['code']) && $dm->code === $m['code']) || strcasecmp($dm->name, $m['name']) === 0;
            });
            $wardCount = max(1, $dbMatch?->ward_count ?? $m['total_wards'] ?? 9);
            return [
                'id' => $dbMatch?->id ?? $m['code'] ?? ('np-' . \Illuminate\Support\Str::slug($m['name'])),
                'db_id' => $dbMatch?->id,
                'code' => $m['code'] ?? $dbMatch?->code ?? ('np-' . \Illuminate\Support\Str::slug($m['name'])),
                'name' => $m['name'],
                'local_name' => $m['local_name'] ?? $m['name'],
                'district' => $m['district'] ?? $dbMatch?->district,
                'province' => $m['province'] ?? $dbMatch?->province,
                'type' => $m['type'] ?? $dbMatch?->type ?? 'rural_municipality',
                'ward_count' => $wardCount,
                'wards' => range(1, $wardCount),
                'center_lat' => (float) ($dbMatch?->center_lat ?? $m['center_lat'] ?? 28.0),
                'center_lng' => (float) ($dbMatch?->center_lng ?? $m['center_lng'] ?? 84.0),
            ];
        });

        // Also add any DB municipalities not present in catalog
        foreach ($dbMunis as $dm) {
            if (!$municipalities->contains('name', $dm->name)) {
                $wardCount = max(1, $dm->ward_count ?? 5);
                $municipalities->push([
                    'id' => $dm->id,
                    'db_id' => $dm->id,
                    'code' => $dm->code,
                    'name' => $dm->name,
                    'local_name' => $dm->name,
                    'district' => $dm->district,
                    'province' => $dm->province,
                    'type' => $dm->type ?? 'municipality',
                    'ward_count' => $wardCount,
                    'wards' => range(1, $wardCount),
                    'center_lat' => (float) ($dm->center_lat ?? 28.0),
                    'center_lng' => (float) ($dm->center_lng ?? 84.0),
                ]);
            }
        }

        // 5. Query registered villages from MySQL
        $muniId = $request->input('municipality_id');
        $muniName = $request->input('municipality_name');
        $wardNo = $request->input('ward_number');

        $villageQuery = Village::query()->orderBy('name');
        if ($muniId && is_numeric($muniId)) {
            $villageQuery->where('municipality_id', (int) $muniId);
        } elseif ($muniName) {
            $villageQuery->where('municipality', 'LIKE', "%{$muniName}%");
        }
        if ($wardNo) {
            $villageQuery->where('ward_no', (string) $wardNo);
        }

        $villages = $villageQuery->get()->map(function ($v) {
            return [
                'id' => $v->id,
                'name' => $v->name,
                'municipality_id' => $v->municipality_id,
                'municipality' => $v->municipality,
                'district' => $v->district,
                'province' => $v->province,
                'ward_number' => (int) ($v->ward_no ?? $v->ward_number ?? 1),
                'latitude' => (float) ($v->latitude ?? $v->center_lat ?? 28.0),
                'longitude' => (float) ($v->longitude ?? $v->center_lng ?? 84.0),
            ];
        });

        return response()->json([
            'municipality' => $municipalities->first(),
            'municipalities' => $municipalities->values(),
            'provinces' => $officialProvinces,
            'districts' => $officialDistricts,
            'villages' => $villages,
            'categories' => self::CATEGORIES,
            'national_directory' => [
                'total_provinces' => 7,
                'total_districts' => 77,
                'coverage' => 'All 7 Provinces & 77 Districts of Nepal',
            ],
        ]);
    }

    /**
     * Citizen Dashboard Statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $query = Complaint::query()->where('user_id', $userId);

        return response()->json([
            'total_complaints' => (clone $query)->count(),
            'pending_complaints' => (clone $query)->where('status', 'pending')->count(),
            'in_progress_complaints' => (clone $query)->whereIn('status', ['verified', 'in_progress'])->count(),
            'resolved_complaints' => (clone $query)->where('status', 'resolved')->count(),
            'recent_complaints' => (clone $query)->latest('submitted_at')->with('village:id,name')->limit(5)->get(),
            'unread_notifications' => CitizenNotification::where('user_id', $userId)->whereNull('read_at')->count(),
            'recent_notifications' => CitizenNotification::where('user_id', $userId)->latest()->limit(5)->get(),
        ]);
    }

    /**
     * Store Citizen Complaint & Dual-Sync with Admin Issues
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
            'custom_category' => ['nullable', 'required_if:category,Other', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'speech_transcript' => ['nullable', 'string', 'max:10000'],
            'transcript_language' => ['nullable', 'string', Rule::in(['ne-NP', 'en-US', 'ne', 'en'])],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'municipality_id' => ['nullable'],
            'municipality_name' => ['nullable', 'string', 'max:255'],
            'municipality_code' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'citizen_urgency' => ['nullable', 'string', Rule::in(['critical', 'high', 'medium', 'low'])],
            'estimated_households' => ['nullable', 'integer', 'min:0'],
            'lifeline_cutoff' => ['nullable'],
            'ward_number' => ['nullable', 'integer', 'between:1,33'],
            'village_id' => ['nullable', 'exists:villages,id'],
            'settlement_name' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'voice_recording' => ['nullable', 'file', 'mimes:webm,ogg,mp3,m4a,mpeg,mp4,wav,x-wav', 'max:10240'],
            'audio' => ['nullable', 'file', 'mimes:webm,ogg,mp3,m4a,mpeg,mp4,wav,x-wav', 'max:10240'],
        ]);

        $description = trim((string) ($validated['description'] ?? ''));
        $transcript = trim((string) ($validated['speech_transcript'] ?? ''));
        $hasAudio = $request->hasFile('voice_recording') || $request->hasFile('audio');

        if ($description === '' && $transcript === '' && !$hasAudio) {
            return response()->json([
                'message' => 'Please provide a written description, speech transcription, or attach a voice recording.',
            ], 422);
        }

        $finalDescription = $description !== ''
            ? $description
            : ($transcript !== '' ? $transcript : 'Voice message recorded by citizen.');

        $storedPaths = [];

        try {
            $complaint = DB::transaction(function () use ($request, $validated, $finalDescription, $transcript, &$storedPaths) {
                // Determine user
                $user = $request->user();
                $userId = $user?->id;
                if (!$userId) {
                    $defaultCitizen = User::where('role', 'citizen')->first();
                    $userId = $defaultCitizen?->id ?? 1;
                }

                // Determine municipality, ward, and village
                $villageId = $validated['village_id'] ?? null;
                $village = $villageId ? Village::find($villageId) : null;

                $muniId = $validated['municipality_id'] ?? ($village?->municipality_id ?? null);
                if ($muniId && !is_numeric($muniId)) {
                    $muniCode = $muniId;
                    $muniId = null;
                } else {
                    $muniCode = $request->input('municipality_code');
                }

                // Resolve from code if ID not directly provided
                if (!$muniId && $muniCode) {
                    $dbMuni = \App\Models\Municipality::where('code', $muniCode)->first();
                    if ($dbMuni) {
                        $muniId = $dbMuni->id;
                    } else {
                        $catMuni = \App\Services\NepalLocationService::getMunicipalityByCode($muniCode);
                        if ($catMuni) {
                            $createdMuni = \App\Models\Municipality::create([
                                'name' => $catMuni['name'],
                                'code' => $catMuni['code'],
                                'district' => $catMuni['district'],
                                'province' => $catMuni['province'],
                                'type' => $catMuni['type'] ?? 'rural_municipality',
                                'ward_count' => $catMuni['total_wards'] ?? 9,
                                'center_lat' => $catMuni['center_lat'] ?? 28.0,
                                'center_lng' => $catMuni['center_lng'] ?? 84.0,
                            ]);
                            $muniId = $createdMuni->id;
                        }
                    }
                }

                // Resolve from name if still not found
                if (!$muniId && $request->filled('municipality_name')) {
                    $mName = $request->input('municipality_name');
                    $dbMuni = \App\Models\Municipality::where('name', $mName)->first();
                    if ($dbMuni) {
                        $muniId = $dbMuni->id;
                    } else {
                        $dist = $request->input('district');
                        $munis = \App\Services\NepalLocationService::getMunicipalities($dist);
                        $found = null;
                        foreach ($munis as $m) {
                            if (strcasecmp($m['name'], $mName) === 0 || (!empty($m['local_name']) && strcasecmp($m['local_name'], $mName) === 0)) {
                                $found = $m;
                                break;
                            }
                        }
                        if ($found) {
                            $createdMuni = \App\Models\Municipality::create([
                                'name' => $found['name'],
                                'code' => $found['code'] ?? ('np-' . \Illuminate\Support\Str::slug($found['name']) . '-' . rand(100, 999)),
                                'district' => $found['district'] ?? ($dist ?? 'Nepal'),
                                'province' => $found['province'] ?? ($request->input('province') ?? 'Nepal'),
                                'type' => $found['type'] ?? 'rural_municipality',
                                'ward_count' => $found['total_wards'] ?? 9,
                                'center_lat' => $found['center_lat'] ?? 28.0,
                                'center_lng' => $found['center_lng'] ?? 84.0,
                            ]);
                            $muniId = $createdMuni->id;
                        }
                    }
                }

                if (!$muniId) {
                    $firstMuni = \App\Models\Municipality::first();
                    $muniId = $firstMuni?->id ?? 1;
                }

                $ward = $validated['ward_number'] ?? ($village?->ward_no ?? 1);
                $lat = $validated['latitude'] ?? ($village?->latitude ?? 28.0);
                $lng = $validated['longitude'] ?? ($village?->longitude ?? 84.0);

                $citizenPriority = $validated['citizen_urgency'] ?? self::inferSeverity($validated['category']);

                // 1. Create Complaint Record (status: pending)
                $complaint = Complaint::create([
                    'complaint_number' => $this->nextComplaintNumber(),
                    'user_id' => $userId,
                    'municipality_id' => $muniId,
                    'village_id' => $villageId,
                    'settlement_name' => $validated['settlement_name'] ?? null,
                    'ward_number' => $ward,
                    'title' => $validated['title'],
                    'category' => $validated['category'],
                    'custom_category' => $validated['custom_category'] ?? null,
                    'description' => $finalDescription,
                    'speech_transcript' => $transcript ?: null,
                    'transcript_language' => $validated['transcript_language'] ?? null,
                    'contact_number' => $validated['contact_number'] ?? $user?->contact_number,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'status' => 'pending',
                    'priority' => $citizenPriority,
                    'submitted_at' => now(),
                ]);

                // 2. Initial ComplaintUpdate
                ComplaintUpdate::create([
                    'complaint_id' => $complaint->id,
                    'user_id' => $userId,
                    'old_status' => null,
                    'new_status' => 'pending',
                    'message' => 'Complaint filed by citizen.',
                ]);

                // 3. Save uploaded images
                $firstImagePath = null;
                foreach ($request->file('images', []) as $image) {
                    $path = $image->store('complaints/images', 'public');
                    $storedPaths[] = $path;
                    if (!$firstImagePath) {
                        $firstImagePath = $path;
                    }

                    ComplaintMedia::create([
                        'complaint_id' => $complaint->id,
                        'media_type' => 'image',
                        'file_path' => $path,
                        'original_name' => $image->getClientOriginalName(),
                        'mime_type' => $image->getMimeType() ?: $image->getClientMimeType(),
                        'file_size' => $image->getSize(),
                    ]);
                }

                // 4. Save uploaded voice recording
                $voice = $request->file('voice_recording') ?? $request->file('audio');
                if ($voice) {
                    $path = $voice->store('complaints/audio', 'public');
                    $storedPaths[] = $path;

                    ComplaintMedia::create([
                        'complaint_id' => $complaint->id,
                        'media_type' => 'audio',
                        'file_path' => $path,
                        'original_name' => $voice->getClientOriginalName(),
                        'mime_type' => $voice->getMimeType() ?: $voice->getClientMimeType(),
                        'file_size' => $voice->getSize(),
                    ]);
                }

                // 5. Dual-Sync: Create matching record in core 'issues' table
                // Marked as pending_verification - does not count as verified until approved
                $mappedCategory = self::mapToIssueCategory($complaint->category);
                $severity = $citizenPriority ?? self::inferSeverity($complaint->category);

                $issueData = [
                    'village_id' => $villageId,
                    'settlement_name' => $validated['settlement_name'] ?? null,
                    'municipality_id' => $muniId,
                    'ward_no' => $ward,
                    'user_id' => $userId,
                    'title' => $complaint->title,
                    'category' => $mappedCategory,
                    'severity' => $severity,
                    'status' => 'pending_verification',
                    'description' => $complaint->description,
                    'speech_transcript' => $transcript ?: null,
                    'transcript_language' => $validated['transcript_language'] ?? null,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'photo_path' => $firstImagePath,
                ];

                if (\Illuminate\Support\Facades\Schema::hasColumn('issues', 'tracking_code')) {
                    $issueData['tracking_code'] = $complaint->complaint_number;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issues', 'reporter_name')) {
                    $issueData['reporter_name'] = $user?->name ?? 'Citizen Resident';
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issues', 'reporter_phone')) {
                    $issueData['reporter_phone'] = $complaint->contact_number;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issues', 'citizens_affected')) {
                    $issueData['citizens_affected'] = $validated['estimated_households'] ?? 25;
                }

                $issue = Issue::create($issueData);

                // 6. Link complaint to issue
                $complaint->issue_id = $issue->id;
                $complaint->save();

                // 7. Initial IssueUpdate
                $issueUpdateData = ['issue_id' => $issue->id];
                if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'status')) {
                    $issueUpdateData['status'] = 'pending_verification';
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'comment')) {
                    $issueUpdateData['comment'] = "Citizen complaint submitted under tracking code {$complaint->complaint_number}. Awaiting municipal verification.";
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'updated_by')) {
                    $issueUpdateData['updated_by'] = $user?->name ?? 'Citizen Resident';
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'old_status')) {
                    $issueUpdateData['old_status'] = 'pending_verification';
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'new_status')) {
                    $issueUpdateData['new_status'] = 'pending_verification';
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'user_id')) {
                    $issueUpdateData['user_id'] = $userId;
                }
                IssueUpdate::create($issueUpdateData);

                // 8. Confirmation notification for citizen
                CitizenNotification::create([
                    'user_id' => $userId,
                    'complaint_id' => $complaint->id,
                    'title' => "Complaint Lodged: {$complaint->complaint_number}",
                    'message' => "Your infrastructure report '{$complaint->title}' has been submitted and assigned to Ward {$ward} review queue.",
                ]);

                return $complaint;
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }

            report($exception);
            return response()->json([
                'message' => 'The complaint could not be saved: ' . $exception->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Complaint submitted successfully.',
            'complaint' => $complaint->load(['media', 'village', 'updates']),
        ], 201);
    }

    /**
     * List Authenticated Citizen's Complaints
     */
    public function index(Request $request): JsonResponse
    {
        $query = Complaint::query()
            ->where('user_id', $request->user()->id)
            ->with(['village:id,name']);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('complaint_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($category = $request->string('category')->toString()) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        return response()->json(
            $query->latest('submitted_at')->paginate((int) $request->integer('per_page', 15))
        );
    }

    /**
     * Show Complaint Details
     */
    public function show(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorizeComplaint($request, $complaint);

        return response()->json([
            'complaint' => $complaint->load(['media', 'village', 'updates.user:id,name', 'issue']),
        ]);
    }

    /**
     * Update Complaint Details (When Pending)
     */
    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorizeComplaint($request, $complaint);

        if (!in_array($complaint->status, ['pending'], true)) {
            return response()->json(['message' => 'This complaint is no longer editable.'], 422);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'ward_number' => ['sometimes', 'nullable', 'integer', 'between:1,33'],
            'village_id' => ['sometimes', 'nullable', 'exists:villages,id'],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $complaint->update($validated);

        if ($complaint->issue_id && ($issue = $complaint->issue)) {
            $issue->update([
                'title' => $complaint->title,
                'description' => $complaint->description,
                'latitude' => $complaint->latitude,
                'longitude' => $complaint->longitude,
            ]);
        }

        return response()->json(['complaint' => $complaint->fresh(['media', 'village', 'updates'])]);
    }

    /**
     * Withdraw Complaint
     */
    public function withdraw(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorizeComplaint($request, $complaint);

        if (!in_array($complaint->status, ['pending', 'verified'], true)) {
            return response()->json(['message' => 'This complaint cannot be withdrawn now.'], 422);
        }

        $oldStatus = $complaint->status;
        $complaint->update(['status' => 'withdrawn']);

        ComplaintUpdate::create([
            'complaint_id' => $complaint->id,
            'user_id' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => 'withdrawn',
            'message' => 'Complaint withdrawn by citizen.',
        ]);

        if ($complaint->issue_id && ($issue = $complaint->issue)) {
            $issue->update(['status' => 'rejected']);
            $issueUpdateData = ['issue_id' => $issue->id];
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'status')) {
                $issueUpdateData['status'] = 'rejected';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'comment')) {
                $issueUpdateData['comment'] = 'Complaint withdrawn by reporter.';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'updated_by')) {
                $issueUpdateData['updated_by'] = $request->user()->name;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'old_status')) {
                $issueUpdateData['old_status'] = $oldStatus;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'new_status')) {
                $issueUpdateData['new_status'] = 'rejected';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('issue_updates', 'user_id')) {
                $issueUpdateData['user_id'] = $request->user()->id;
            }
            IssueUpdate::create($issueUpdateData);
        }

        return response()->json(['complaint' => $complaint->fresh(['media', 'updates'])]);
    }

    /**
     * Live Tracking Summary
     */
    public function tracking(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorizeComplaint($request, $complaint);

        return response()->json([
            'complaint' => $complaint->only(['id', 'complaint_number', 'title', 'status', 'official_response', 'submitted_at']),
            'updates' => $complaint->updates()->with('user:id,name')->get(),
        ]);
    }

    /**
     * Citizen Notifications
     */
    public function notifications(Request $request): JsonResponse
    {
        return response()->json([
            'notifications' => CitizenNotification::where('user_id', $request->user()->id)->latest()->paginate(20),
        ]);
    }

    /**
     * Mark Notification as Read
     */
    public function markNotificationRead(Request $request, CitizenNotification $notification): JsonResponse
    {
        abort_unless((int) $notification->user_id === (int) $request->user()->id, 403);
        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Download Complaint Media File
     */
    public function media(Request $request, ComplaintMedia $media): StreamedResponse|JsonResponse
    {
        $complaint = $media->complaint()->with('village')->first();
        if (!$complaint) {
            return response()->json(['message' => 'Attachment not found.'], 404);
        }
        $this->authorizeComplaint($request, $complaint);

        if (!Storage::disk('public')->exists($media->file_path)) {
            return response()->json(['message' => 'Attachment not found.'], 404);
        }

        return Storage::disk('public')->download(
            $media->file_path,
            $media->original_name,
            ['Content-Type' => $media->mime_type]
        );
    }

    /**
     * Preview Complaint Media File Inline
     */
    public function mediaPreview(Request $request, ComplaintMedia $media): StreamedResponse|JsonResponse
    {
        $complaint = $media->complaint()->with('village')->first();
        if (!$complaint) {
            return response()->json(['message' => 'Attachment not found.'], 404);
        }
        $this->authorizeComplaint($request, $complaint);

        if (!Storage::disk('public')->exists($media->file_path)) {
            return response()->json(['message' => 'Attachment not found.'], 404);
        }

        return Storage::disk('public')->response(
            $media->file_path,
            $media->original_name,
            ['Content-Type' => $media->mime_type, 'Content-Disposition' => 'inline']
        );
    }

    private function authorizeComplaint(Request $request, Complaint $complaint): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $isOwner = (int) $complaint->user_id === (int) $user->id;
        $isSystemAdmin = $user->isSystemAdmin();
        $complaintMuniId = $complaint->municipality_id ?? $complaint->village?->municipality_id;
        $isMuniAdmin = $user->isMunicipalityAdmin() && (string) $user->municipality_id === (string) $complaintMuniId;
        $isWardOfficer = $user->isWardOfficer() &&
            (string) $user->municipality_id === (string) $complaintMuniId &&
            (string) $user->ward_number === (string) $complaint->ward_number;

        abort_unless(
            $isOwner || $isSystemAdmin || $isMuniAdmin || $isWardOfficer,
            403,
            'You are not authorized to access this complaint.'
        );
    }

    /**
     * Speech-to-Text Audio Transcription Endpoint
     * Supports Nepali (ne-NP) and English (en-US)
     */
    public function transcribe(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => ['nullable', 'file', 'mimes:webm,ogg,mp3,m4a,mpeg,mp4,wav,x-wav', 'max:10240'],
            'voice_recording' => ['nullable', 'file', 'mimes:webm,ogg,mp3,m4a,mpeg,mp4,wav,x-wav', 'max:10240'],
            'language' => ['nullable', 'string', 'in:ne-NP,en-US,ne,en'],
        ]);

        $file = $request->file('audio') ?? $request->file('voice_recording');
        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'No audio file was uploaded for transcription.',
            ], 422);
        }

        $language = $request->input('language', 'ne-NP');
        $isNepali = str_starts_with($language, 'ne');

        $geminiKey = env('GEMINI_API_KEY');
        $openaiKey = env('OPENAI_API_KEY');

        // 1. If OpenAI Whisper API key configured
        if ($openaiKey) {
            try {
                $response = Http::withToken($openaiKey)
                    ->timeout(30)
                    ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                    ->post('https://api.openai.com/v1/audio/transcriptions', [
                        'model' => 'whisper-1',
                        'language' => $isNepali ? 'ne' : 'en',
                    ]);

                if ($response->successful()) {
                    $transcript = trim($response->json('text') ?? '');
                    if ($transcript !== '') {
                        return response()->json([
                            'success' => true,
                            'transcript' => $transcript,
                            'language' => $language,
                            'source' => 'whisper',
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        // 2. If Google Gemini API key configured
        if ($geminiKey) {
            try {
                $mimeType = $file->getMimeType() ?: 'audio/webm';
                $base64Data = base64_encode(file_get_contents($file->getRealPath()));
                $prompt = $isNepali
                    ? 'Transcribe this voice report accurately in Nepali (Devanagari script). Return only the spoken text without any explanations, introductory text, or markdown formatting.'
                    : 'Transcribe this voice report accurately in English. Return only the spoken text without any explanations, introductory text, or markdown formatting.';

                $response = Http::timeout(30)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$geminiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                                [
                                    'inlineData' => [
                                        'mimeType' => $mimeType,
                                        'data' => $base64Data,
                                    ],
                                ],
                            ],
                        ],
                    ],
                ]);

                if ($response->successful()) {
                    $text = trim($response->json('candidates.0.content.parts.0.text') ?? '');
                    if ($text !== '') {
                        return response()->json([
                            'success' => true,
                            'transcript' => $text,
                            'language' => $language,
                            'source' => 'gemini',
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        // Honest fallback: never fake transcripts
        return response()->json([
            'success' => false,
            'message' => 'Backend speech-to-text service is not configured or currently unavailable. Please use the live "Speak to Transcribe (बोलेर लेख्नुहोस्)" feature in your browser or type your description manually.',
            'configured' => false,
        ], 200);
    }

    private function nextComplaintNumber(): string
    {
        $next = (Complaint::query()->max('id') ?? 0) + 1;
        return 'GP-' . now()->format('Y') . '-' . str_pad((string) $next, 5, '0', STR_PAD_LEFT);
    }
}
