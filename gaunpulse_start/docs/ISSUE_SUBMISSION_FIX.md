# GaunPulse — Infrastructure Issue Submission & Photo Upload Fix

## 1. Executive Summary & Exact Root Cause

When submitting a new infrastructure issue from **Issues & Alerts → Report New Infrastructure Issue**, the modal previously surfaced a generic `"Failed to fetch"` error. A thorough end-to-end investigation revealed four interrelated root causes:

1. **Uninformative Frontend Error Handling:**
   - In `frontend/src/pages/IssuesPage.jsx`, `handleSubmit` caught errors with `catch (err) { setSubmitError(err.message); }`.
   - When the backend was restarting, or when a network error occurred, the browser threw a raw `TypeError: Failed to fetch`.
   - In addition, if Laravel returned a non-JSON or HTML error page (such as during a 413 Payload Too Large or 500 error), `await res.json()` threw a `SyntaxError`, which was directly dumped into the modal without explaining the underlying problem.
   - When 422 Unprocessable Content validation errors occurred, field-level errors (`json.errors`) were not parsed or mapped to form fields, leaving the user without actionable guidance.

2. **Missing Database Columns (`photo_path` and `user_id`):**
   - The MySQL `issues` table was missing the `photo_path` and `user_id` columns due to conditional creation guards in the legacy migrations.
   - While `IssueController.php` checked `Schema::hasColumn('issues', 'photo_path')`, this evaluated to `false`. Uploaded photos were never recorded in MySQL or linked to the issue.
   - The `public/storage` symbolic link had never been initialized, preventing uploaded files from being served over HTTP.

3. **Cross-Village Edge State Leakage:**
   - When users switched villages in the modal dropdown, `formData.edge_id` was retained from the previous village.
   - Laravel's `StoreIssueRequest` strictly enforces `Rule::exists('edges', 'id')->where(fn ($q) => $q->where('village_id', $this->integer('village_id')))`.
   - Submitting an edge ID from Village 1 under Village 2 triggered a 422 error: *"The selected infrastructure asset does not belong to the chosen village"*.

4. **CORS and Origin Configuration:**
   - `backend/config/cors.php` contained a wildcard `'*'` alongside `'supports_credentials' => true`, which triggers preflight rejections in modern browsers when credentials are used.
   - Vite lacked proxying rules for `/api` and `/storage`, causing potential localhost vs 127.0.0.1 hostname mismatches.

---

## 2. Failed Request Details

- **Failing Request:** `POST http://127.0.0.1:8000/api/issues`
- **Payload Type:** `multipart/form-data`
- **Observed Error in UI:** `"Failed to fetch"`
- **Actual Network & Server Causes:**
  - Network connection refused when background server is offline or restarting.
  - 422 Unprocessable Content when `edge_id` from a prior village was sent with a new `village_id`.
  - Unhandled 413 or 500 HTML responses failing JSON parsing.

---

## 3. Files Changed

1. **`backend/database/migrations/2026_11_22_000001_add_photo_path_and_user_id_to_issues_table.php`**
   - Added `user_id` (nullable foreign key to `users`, null on delete) after `village_id`.
   - Added `photo_path` (nullable string, max 500 chars) after `longitude`.
   - Executed `php artisan migrate` and `php artisan storage:link`.

2. **`backend/app/Http/Requests/StoreIssueRequest.php`**
   - Added custom validation messages for each field (`title.min`, `description.min`, `edge_id.exists`, `photo.max`, `photo.mimes`).
   - Validated that `photo` is an image (`jpeg, jpg, png, webp`) with a 5MB (`5120 KB`) size ceiling.

3. **`backend/config/cors.php`**
   - Replaced wildcard `'*'` with explicit allowed origins: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:8000`, `http://127.0.0.1:8000`.
   - Added `storage/*` to CORS paths to permit cross-origin image rendering.

4. **`backend/database/migrations/2026_11_21_185313_add_dynamic_simulation_metadata.php`**
   - Added `if (!Schema::hasColumn('villages', 'is_demo'))` checks to prevent duplicate column errors during in-memory SQLite feature testing.

5. **`frontend/vite.config.js`**
   - Added `server.proxy` for `/api` and `/storage` pointing to `http://127.0.0.1:8000`.

6. **`frontend/src/pages/IssuesPage.jsx`**
   - **Form Data Preservation:** If submission fails, the form stays open, all inputs (`title`, `description`, `village_id`, `category`, `severity`, `coordinates`, `photo`) are preserved, and user can retry immediately.
   - **Edge Reset on Village Change:** When the user changes villages, `edge_id` is immediately reset to `''` and field errors are cleared.
   - **Double-Submit Protection:** Disabled submit button with spinning indicator while request is in flight.
   - **Human-Friendly Error Classification:**
     - Network failure / server offline → *"Unable to connect to the GaunPulse server. Please check your connection and try again."*
     - Session expired → *"Your session has expired. Please sign in again."*
     - Permission denied → *"You don't have permission to submit a report for this village."*
     - File size limit exceeded → *"The photo could not be uploaded because it exceeds the 5MB size limit. Please choose a smaller photo and try again."*
     - Validation failure → *"Please check the highlighted fields."* + field-level inline error messages.
     - Server error → *"Your report could not be saved. Please try again."*
   - **Photo Upload & Preview:** Supported image previews with file size indicator and one-click removal before submission.
   - **Photo Evidence in Issue Detail:** Rendered photographic evidence directly in the issue detail modal when viewing verified or submitted reports.

7. **`backend/tests/Feature/IssueSubmissionFeatureTest.php`**
   - Automated feature tests verifying non-photo submission, photo upload, short field rejections, cross-village edge constraints, and oversized file limits.

---

## 4. Backend Validation Rules

| Field | Rules | Human Message on Error |
|---|---|---|
| `village_id` | `required, exists:villages,id` | "Please select a village." |
| `edge_id` | `nullable, exists:edges,id` (scoped to `village_id`) | "The selected infrastructure asset does not belong to the chosen village." |
| `title` | `required, string, min:5, max:150` | "The issue title must be at least 5 characters." |
| `category` | `required, in:damaged_road,damaged_bridge,water_supply,school_access,health_post_access,other_infrastructure` | "The selected category is invalid." |
| `description` | `required, string, min:15, max:3000` | "Please provide more details in the description (at least 15 characters)." |
| `severity` | `required, in:low,medium,high,critical` | "The selected severity level is invalid." |
| `latitude` | `required, numeric, between:-90,90` | "Latitude must be between -90 and 90 degrees." |
| `longitude` | `required, numeric, between:-180,180` | "Longitude must be between -180 and 180 degrees." |
| `photo` | `nullable, file, image, mimes:jpeg,jpg,png,webp, max:5120` | "The photo size may not be greater than 5MB." |

---

## 5. Verification & Test Results

### 1. PHPUnit Feature Tests
```
Tests: 5 passed
Assertions: 20
Duration: 1.28s
Status: OK
```
- `test_can_submit_issue_without_photo`: **PASS**
- `test_can_submit_issue_with_photo_upload`: **PASS**
- `test_validation_fails_on_short_title_and_description`: **PASS**
- `test_validation_fails_when_edge_belongs_to_different_village`: **PASS**
- `test_validation_fails_on_oversized_photo`: **PASS**

### 2. Live MySQL & API E2E Verification (`test_issue_reporting_e2e.py`)
```
============================================================
GAUNPULSE INFRASTRUCTURE ISSUE REPORTING E2E VERIFICATION
============================================================
[PASS] Test 1: Create issue without photo: Created ID #18, Tracking: GP-2026-8779A7
[PASS] Test 2: Verify persistence in MySQL: Retrieved issue #18 successfully
[PASS] Test 3: Create issue with photo upload: Saved ID #19 with photo_url: http://127.0.0.1:8000/storage/issues/vOgFc0Rt1y9HJzNNZC7nchtexFljPjHY1jqPnHOU.jpg
[PASS] Test 4: Photo HTTP Accessibility: Fetched image (149 bytes) with HTTP 200
[PASS] Test 5: Validation title < 5 chars: Rejected with 422: The issue title must be at least 5 characters.
[PASS] Test 6: Cross-village edge ownership validation: Rejected with 422: The selected infrastructure asset does not belong to the chosen village.
[PASS] Test 7: Reports bundle updates: Reports bundle loads live with 200 OK
============================================================
```

### 3. Frontend Production Build
```
vite v7.3.8 building client environment for production...
✓ 1667 modules transformed.
dist/index.html                     0.96 kB
dist/assets/index-BWBUMbRe.css     68.95 kB
dist/assets/index-DKumlj-J.js   1,034.84 kB
✓ built in 7.73s (0 syntax or lint errors)
```

---

## 6. Remaining Limitations & Operating Notes

- **Serving Uploaded Photos:** Uploaded photos are stored on Laravel's `public` disk under `storage/app/public/issues`. The `php artisan storage:link` command must remain in place for the web server to serve images directly via `/storage/...`.
- **Offline Mode:** If both network and Laravel backend are completely unreachable, the client will display the clear message *"Unable to connect to the GaunPulse server. Please check your connection and try again."* and preserve the user's entered form data.
