# GaunPulse — OSM Infrastructure Discovery Location Correction & Deduplication Engine

## Executive Summary

This document details the architectural analysis, root cause resolution, and implementation for the **Automatic Infrastructure Discovery & Import** feature in **GaunPulse — The Village That Speaks**.

### Problems Addressed
1. **Wrong Village Coordinates:** The village **Mahabu** (Dailekh, Ward 1, Karnali Province) was scanned at fallback coordinates `28.0000°N, 84.0000°E` (located near Pokhara / Tanahun in Gandaki Province) instead of its genuine geographic center in Dailekh (`28.9242°N, 81.7125°E`).
2. **153 False Duplicates & Blunt Exclusion:** During discovery, 153 features were marked as duplicate, auto-unchecked, and had their checkboxes disabled without providing users any option to inspect, differentiate exact matches from spatial neighbours, or verify their genuine data.

---

## 1. Root Cause Analysis

### Coordinate Root Cause
- When village records were initially registered, districts not pre-populated in `$municipalities` in `NepalLocationService.php` were dynamically synthesized with generic fallback coordinates `['center_lat' => 28.0, 'center_lng' => 84.0]`.
- Nominatim geocoding requests were either rate-limited or failed in offline/firewalled test environments, causing GaunPulse to fall back onto `28.0, 84.0`.

### 153 Duplicates Root Cause
- In a previous demo session, an OSM import was executed for Mahabu while its coordinates were `28.0, 84.0`, importing 150 road segments and 3 facilities from Tanahun into MySQL for village ID 6 (`mahabu`).
- When Mahabu was scanned again at `28.0, 84.0`, the old deduplication algorithm matched all 150 edges and 3 facilities against those records in MySQL.
- The previous discovery engine used a single boolean flag `is_duplicate = true` which:
  - Lumped exact OSM element matches together with nearby spatial neighbours (<25m).
  - Disabled the checkbox (`disabled={item.is_duplicate}`), preventing any human review or overriding.

---

## 2. Implemented Architecture & Solutions

### A. Comprehensive Nepal Administrative Centroids (`NepalLocationService.php`)
- Added genuine geographic centroids for **all 77 districts of Nepal** (from Achham to Udayapur).
- Added detailed catalog entries for all local bodies of **Dailekh District**, specifically:
  - `Mahabu Rural Municipality` (`महाबु गाउँपालिका`): Centroid `28.9242°N, 81.7125°E`
  - Narayan, Dullu, Chamunda Bindrasaini, Aathbis, Dungeshwar, Gurans, Bhairabi, Bhagawatimai, Naumule, and Thantikandh.
- Updated `resolveCoordinates()` and `getDistrictCenter()` so that any Dailekh municipality falls back to its genuine district centroid (`28.8400°N, 81.7100°E`), completely eliminating the generic `28.0, 84.0` fallback.

### B. Database Schema & Village Coordinate Confirmation (`Village.php`)
- Created migration `2026_11_22_000002_add_coordinates_confirmation_to_villages_table.php`:
  - `is_coordinates_confirmed` (`BOOLEAN`, default `false`)
  - `coordinates_confirmed_at` (`DATETIME`, nullable)
  - `search_radius_meters` (`INTEGER`, default `2000`)
- Added accessor `needs_location_confirmation` on `Village` model:
  - Automatically flags any village where `is_coordinates_confirmed === false` or coordinates sit at the `28.0, 84.0` fallback.
- Added dedicated API endpoint:
  - `PATCH /api/villages/{village}/coordinates`
  - Validates latitude/longitude within Nepal bounding box (`26.0–31.0°N`, `80.0–89.0°E`).
  - Sets `is_coordinates_confirmed = true`.
  - Records an immutable audit log entry in `audit_logs` (`action_type = 'coordinates_confirmed'`).

### C. 3-Tier Deduplication Engine (`OsmInfrastructureService.php`)
Replaced the old binary boolean flag with three distinct classification states:

| Duplicate Status | Criteria | UI Display | User Action | Idempotency |
| :--- | :--- | :--- | :--- | :--- |
| `new` | No matching OSM ID and no existing asset within 25m. | Emerald badge `✨ New` | Pre-selected by default | Saved to MySQL with `verification_status = 'imported'` |
| `possible_duplicate` | Distinct/missing OSM ID, but spatial proximity < 25m or high name similarity. | Amber badge `🔍 Possible Duplicate` + note showing existing asset name & distance | Unchecked by default; **Checkbox is enabled** for human review | User can choose to import as a separate legitimate asset |
| `already_imported` | Exact OSM element type and ID match (`osm_id` + `osm_type`), or matching node/edge code. | Grey badge `⏭️ Already in Database` | Checkbox disabled; informational only | Strictly skipped during persistence to prevent duplicate rows |

### D. Redesigned Discovery & Import UI (`VillageMapPage.jsx` & `MapDataImportModal.jsx`)
1. **Location Confirmation Banner:**
   - Prominently warns when a village's coordinates need confirmation.
   - Shows the official catalog centroid (e.g. `28.9242°N, 81.7125°E` for Mahabu).
   - "Confirm Official Coordinates" button updates the village in MySQL and triggers a re-scan.
   - "Edit Coordinates Manually" toggle enables custom precision entry.
2. **4 Metric Summary Cards:**
   - Total Discovered
   - ✨ New Features
   - 🔍 Possible Duplicates
   - ⏭️ Already in Database
3. **3 Main Categorized Tabs:**
   - `NEW FEATURES`: Pre-selected with bulk Select All / Deselect All actions.
   - `POSSIBLE DUPLICATES`: Explains proximity and matching existing asset name with distance.
   - `ALREADY IN DATABASE`: Shows assets already imported that are skipped.
4. **Category Pills Filter:**
   - Real-time sub-filtering by `all`, `roads`, `bridges`, `schools`, `health`, `water`, and `settlements` with dynamic count badges.

---

## 3. Verification & Automated Tests

### Automated PHPUnit Feature Tests
Created `backend/tests/Feature/OsmCoordinatesAndDeduplicationTest.php`:
- `test_nepal_location_service_resolves_mahabu_dailekh_coordinates`: Verifies coordinate resolution for Dailekh and Mahabu.
- `test_village_detects_unconfirmed_fallback_coordinates`: Verifies `needs_location_confirmation` logic.
- `test_can_update_and_confirm_village_coordinates_via_api`: Verifies `PATCH /api/villages/{village}/coordinates` and audit logging.
- `test_deduplication_engine_categorizes_features_cleanly`: Verifies 3-tier classification on mocked Overpass responses.
- `test_confirm_import_skips_duplicates_and_marks_new_unverified`: Verifies idempotency and `verification_status = 'imported'`.

**Test Result:**
```
PASS Tests\Feature\OsmCoordinatesAndDeduplicationTest
✓ nepal location service resolves mahabu dailekh coordinates
✓ village detects unconfirmed fallback coordinates
✓ can update and confirm village coordinates via api
✓ deduplication engine categorizes features cleanly
✓ confirm import skips duplicates and marks new unverified

Tests:    5 passed (32 assertions)
Duration: 1.18s
```

Existing suite `OsmInfrastructureDiscoveryTest`:
```
PASS Tests\Feature\OsmInfrastructureDiscoveryTest
Tests:    7 passed (48 assertions)
Duration: 2.99s
```

### Frontend Build Verification
`npm run build` in `frontend`:
```
✓ 1667 modules transformed.
dist/assets/index-DXJhqXdh.js   1,044.68 kB │ gzip: 293.71 kB
✓ built in 11.92s
```
Zero JSX syntax, lint, or bundling errors.

---

## 4. Live Database Verification
- Village ID 6 (`mahabu`) in MySQL has been updated to:
  - `center_lat: 28.9242`, `center_lng: 81.7125`
  - `is_coordinates_confirmed: true`
  - `search_radius_meters: 2000`
- Querying `/api/villages/6/discover-osm?radius=2000` in Mahabu now discovers 163 genuine features (161 roads, 2 settlements) in Dailekh with 0 false duplicate warnings.
