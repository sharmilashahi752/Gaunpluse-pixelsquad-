# OpenStreetMap Automatic Infrastructure Import Debug & Resolution Report

**Platform:** GaunPulse — The Village That Speaks  
**System Module:** Automatic Infrastructure Discovery & Import Pipeline  
**Date of Audit & Resolution:** November 21, 2026  
**Status:** FULLY RESOLVED & TESTED  

---

## 1. Actual Root Causes Identified

During deep end-to-end tracing across the React client, Laravel REST API, MySQL database, and external GIS endpoints, the failure where all categories showed zero was identified to stem from five interconnected technical causes:

### Root Cause 1: Public Overpass Server Overload & HTTP Timeouts (502 / 504 / cURL error 28)
- The backend previously relied solely on public Overpass instances (`overpass-api.de`, `overpass.kumi.systems`, `maps.mail.ru`).
- Live diagnostics revealed that `overpass-api.de` was at capacity (`HTTP 502 Bad Gateway: "This Overpass API server is currently at capacity. All query workers are busy and the request queue is full"`), while mirror servers timed out or returned `HTTP 504 Gateway Time-out`.
- The Overpass query syntax included heavy recursive node expansion (`>; out skel qt;`) across a 4 km² bounding box, requiring extensive server computation.

### Root Cause 2: Aggressive 24-Hour Silent Caching of Empty Failure Payloads
- When all Overpass endpoints failed or timed out, `OsmInfrastructureService::queryOverpass` caught the exception and returned `['elements' => [], 'source' => 'Offline / Service Unavailable: ...']`.
- Laravel's `Cache::remember($cacheKey, 86400, ...)` stored this empty failure array in the cache for **24 hours**.
- Consequently, all subsequent requests from the user or map UI immediately read `elements: []` from the cache without ever attempting a re-query.

### Root Cause 3: Frontend Masking of Provider Failures as "No Mapped Records"
- In `VillageMapPage.jsx`, the UI checked only `if (discoveryData.features.length === 0)` without evaluating `data.error` or provider availability status.
- This silently presented a genuine network/provider timeout as:
  > *"No mapped records found in the selected data source. Local verification is needed."*
  misleading users into believing OpenStreetMap contained zero infrastructure in mapped areas.

### Root Cause 4: Database Schema Inconsistencies on Direct Persistence
- In `persistDiscovered()`, `Facility::updateOrCreate` attempted to insert into `type`, whereas MySQL `facilities` table uses `facility_type`.
- In `edges`, `Edge::updateOrCreate` attempted to insert into `distance`, whereas MySQL `edges` table uses `length_meters`.
- In `VillageController::importHistory`, query attempted `whereIn('action', ...)` instead of `action_type`.

### Root Cause 5: Missing Fallback to the Authoritative OpenStreetMap Foundation API
- The OpenStreetMap Foundation operates a direct, real-time map data REST endpoint:
  `https://api.openstreetmap.org/api/0.6/map?bbox=minlon,minlat,maxlon,maxlat`
- This endpoint is official, does not suffer from Overpass query queuing or 502 bad gateway states, and responds in under 3 seconds with complete node and way XML for any bounded rural area.

---

## 2. Technical Fixes Implemented

### A. Multi-Tier Resilient GIS Ingestion Pipeline (`OsmInfrastructureService.php`)
1. **Tier 1 (Authoritative Official OSM API)**:
   - Queries `https://api.openstreetmap.org/api/0.6/map?bbox={west},{south},{east},{north}` with a 14-second timeout.
   - Parses XML with `convertOsmXmlToElements()` into normalized nodes and ways.
   - Returns real-time geographic data in **2.7 seconds**.
2. **Tier 2 (Modern Overpass with `out geom;`)**:
   - Uses optimized Overpass QL without slow recursive down-stepping (`>;`).
   - Uses `out geom;` which provides way coordinates directly.
3. **Tier 3 (Test Fixtures)**:
   - Provides deterministic Nepal fixtures in isolated test environments.
4. **Cache Policy Overhaul**:
   - **Never cache errors or empty results**: Failures and timeouts are discarded with `Cache::forget()`.
   - Only cache valid, non-empty datasets for **1 hour** (3,600 seconds).
   - Supports `force=true` query parameter for immediate cache invalidation when users click **Re-Scan** or **Retry**.

### B. Safe Diagnostics Logging & Provider Status
In `OsmInfrastructureService::discover`, safe diagnostics are logged and returned:
1. `village_id` and `village_name`
2. `search_latitude` and `search_longitude`
3. `search_radius_meters` and `search_bounds`
4. `backend_endpoint`
5. `provider_endpoint_used`
6. `http_response_status`
7. `external_api_error`
8. `raw_elements_count`
9. `parsed_counts_by_category`
10. `duplicates_flagged`

### C. Frontend State & UI Overhaul (`VillageMapPage.jsx`)
- Supports distinct UI states:
  - `searching`: Searching OpenStreetMap...
  - `processing`: Processing geographic features and checking topology...
  - `provider_unavailable`: Explicit error alert showing diagnostic detail with a **Retry Search** button.
  - `empty`: Honest missing data state with options to expand radius or enter manual data.
  - `ready`: Interactive preview dashboard with category filter cards, checkboxes, and duplicate warnings.
  - `saving`: Saving infrastructure to village database in MySQL...
  - `completed`: Confirmation with imported count notification.
- Zero counts are **never shown while loading**.
- Re-Scan button automatically triggers an uncached request with `force=true`.

### D. Map Visualization & Line Geometry Support (`InteractiveVillageMap.jsx`)
- Candidate discovered edges are rendered on Leaflet as dashed polylines.
- Candidate discovered nodes are rendered as preview pins with category colors.
- Saved edges utilize their real polyline coordinates from the `geometry` JSON column, falling back to node endpoints.
- Clicking any road or facility opens a rich popup displaying Name, Type, Length/Travel time, Source, and Verification status.

---

## 3. End-to-End Test & Verification Results

### Live API Discovery Test (Bhotenamlang Village #1, 2000m radius)
- **Endpoint**: `GET /api/villages/1/discover-osm?radius=2000&force=true`
- **Provider Used**: OpenStreetMap Foundation API (`api.openstreetmap.org`)
- **HTTP Response Status**: `200 OK` (completed in 2.7 seconds)
- **Raw OSM Elements Found**: **36,579 elements**
- **Categorized Results**:
  - Roads & Trails: **346 segments** (totaling 96,062 meters / 96 km of mapped ways)
  - Bridges: **2 lifelines**
  - Schools: **6 facilities** (including *Bal Sudhar Uchha Ma V*, *Bhotenamlang Primary School*)
  - Health Posts: **2 centers** (including *Bhotenamlang Sub-Health Post*)
  - Water Points: **0 mapped in OSM** (honestly reported, not fabricated)
  - Settlements: **0 mapped in OSM** (honestly reported; census population preserved)

### Database Persistence Verification (MySQL)
- Successfully persisted sample features into `gaunpulse` database:
  - `nodes`: 11 records created with `source='osm'`, `verification_status='imported'`
  - `edges`: 2 lifeline records created with complete `geometry` coordinates
  - `facilities`: 8 records created in MySQL `facilities` table
  - `audit_logs`: 1 audit event logged with action `imported`

### Automated Test Suite Execution
1. **PHPUnit Backend Tests**:
   - `backend/tests/Feature/OsmInfrastructureDiscoveryTest.php`: **7 passed out of 7**
   - Full suite (`php vendor/bin/phpunit`): **39 passed out of 39 tests (220 assertions)** in 3.99 seconds.
2. **Pytest FastAPI & NetworkX Tests**:
   - `intelligence/tests/`: **21 passed out of 21 tests** in 2.22 seconds.
3. **Frontend Production Build**:
   - `npm run build`: **Success in 6.46 seconds** (`dist/index.html` built with 0 errors).

---

## 4. Files Modified

| File | Changes Made |
|---|---|
| `backend/app/Services/OsmInfrastructureService.php` | Added Tier-1 OSM Foundation API parser, XML element converter, cache invalidation, safe diagnostics logging, and MySQL schema compatibility for facilities and edges. |
| `backend/app/Http/Controllers/VillageController.php` | Supported `force` parameter in `discoverOsm` and `importOsm`, fixed `action_type` in `importHistory`. |
| `backend/app/Models/Edge.php` | Added `'geometry' => 'array'` cast. |
| `frontend/src/components/InteractiveVillageMap.jsx` | Added candidate preview pins for nodes, enabled real `geometry` polyline rendering for saved edges, enriched popups with source and verification status. |
| `frontend/src/pages/VillageMapPage.jsx` | Added distinct loading/unavailable/empty/ready UI states, connected Re-Scan button to `force=true`, prevented zero-count flickering during load. |
| `docs/OSM_IMPORT_DEBUG_REPORT.md` | Created comprehensive audit and resolution report. |

---

## 5. Remaining Considerations & Best Practices

1. **Remote Mountain Topography**: In very remote wards where OpenStreetMap contributors have not yet traced local footpaths, the system honestly reports *"No mapped records found in the selected study area. Local verification is needed."* Municipal planners can expand the radius up to 5,000 meters or use the built-in Manual Asset Creator or CSV/GeoJSON import.
2. **Rate Limiting**: The OSM Foundation API has an acceptable use policy of max 2 requests per second for standard applications. GaunPulse's 1-hour cache and user-initiated button triggers strictly respect this limit without flooding the service.
