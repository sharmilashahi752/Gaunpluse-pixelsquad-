# GaunPulse — Reports & Insights System Audit

**Audit Date:** November 22, 2026  
**Auditor:** Senior Full-Stack & GIS Systems Engineer  
**Document Path:** `docs/REPORTS_AUDIT.md`  
**Target Module:** `Reports & Insights` (`frontend/src/pages/ModulePages.jsx` -> dedicated `ReportsInsightsPage.jsx`)

---

## 1. Executive Summary

GaunPulse ("The Village That Speaks") has established core infrastructure models, dynamic OpenStreetMap ingestion, NetworkX graph simulation, and administrative location scoping across Nepal. However, the existing **Reports & Insights** user interface (`frontend/src/pages/ModulePages.jsx`, lines 141–228) currently serves static placeholder values derived from `frontend/src/data/demoData.js`. 

This audit documents every hardcoded metric, evaluates existing database schemas and relationships, reviews the current API and authorization state, and defines the technical roadmap for migrating Reports & Insights into a real-time, MySQL-backed decision support system.

---

## 2. Inventory of Hardcoded Placeholders in Reports & Insights

In `frontend/src/pages/ModulePages.jsx` (component `ReportsInsightsPage`) and `frontend/src/data/demoData.js`:

### 2.1 Top Metric Cards (`reportMetrics`)
| Metric Label | Static Value | Static Note | Real MySQL Source Required |
|---|---|---|---|
| **Issues resolved** | `68%` | `+9% from last month` | `(Resolved Issues / Total Eligible Issues) * 100` |
| **Median verification** | `1.8 d` | `0.4 d faster` | Median difference between issue `created_at` and `issue_updates` verification timestamp |
| **Community reports** | `47` | `This month` | Count of registered `issues` + `community_feedbacks` in reporting period |

### 2.2 Category Breakdown (Static HTML & Inline CSS Bars)
In `ModulePages.jsx` (lines 203–224):
- **Roads & trails:** `38` (inline CSS `width: 82%`)
- **Water access:** `29` (inline CSS `width: 64%`)
- **Bridges:** `21` (inline CSS `width: 47%`)
- **Public facilities:** `14` (inline CSS `width: 31%`)

*Defect:* These counts are hardcoded HTML tags with static percentage widths. They do not dynamically count or group real `issues` by `category` or `edges` by `infrastructure_type`.

### 2.3 Existing Export Functionality
Lines 144–170 in `ModulePages.jsx`:
- Fetches all records from `GET /api/issues`, `GET /api/action-plans`, and `GET /api/villages`.
- Dumps un-scoped, unfiltered JSON into a client-generated blob.
- *Defect:* Does not respect municipality/ward scopes, does not support CSV or branded PDF generation, and performs zero backend aggregations.

### 2.4 Missing Elements
- No filter toolbar (no Municipality, Ward, Village, Date Range, Category, Status, or Verification Status dropdowns).
- No Chart.js canvas visualizations (trends over time, status distributions, priority comparisons, ward benchmarking, infrastructure condition).
- No paginated, searchable tabular audit views.
- No direct tie-in to the AI Visualization Agent.

---

## 3. Database Schema & Eloquent Relationship Review

The MySQL database contains structured tables ready for real-time reporting aggregations:

### 3.1 Core Entity Tables & Relevant Columns
1. **`villages`**
   - Columns: `id`, `name`, `province`, `district`, `municipality`, `ward_no`, `center_lat`, `center_lng`, `status`
   - Active count: 4 villages (Bhotenamlang, Marpha, Kohalpur, Namche Bazaar).
2. **`issues`**
   - Columns: `id`, `village_id`, `edge_id`, `node_id`, `tracking_code`, `title`, `category`, `severity`, `status`, `description`, `citizens_affected`, `created_at`, `updated_at`.
   - Relationships: `belongsTo(Village)`, `belongsTo(Edge)`, `hasMany(IssueUpdate)`, `hasOne(PriorityScore)`.
3. **`issue_updates`**
   - Columns: `id`, `issue_id`, `status`, `comment`, `updated_by`, `created_at`.
   - Enables exact timestamp calculation for verification latency: `verification_time = issue_updates.created_at - issues.created_at` where `status = 'verified'`.
4. **`nodes`**
   - Columns: `id`, `village_id`, `node_code`, `osm_id`, `name`, `node_type`, `latitude`, `longitude`, `verification_status`, `confidence_score`.
   - Categories: `school`, `health_post`, `water_point`, `settlement`, `junction`.
5. **`edges`**
   - Columns: `id`, `village_id`, `edge_code`, `source_node_id`, `target_node_id`, `name`, `infrastructure_type`, `surface_type`, `status`, `length_meters`, `is_critical`, `travel_minutes`, `verification_status`.
   - Statuses: `operational`, `passable`, `blocked`, `partially_blocked`, `under_repair`.
6. **`facilities`**
   - Columns: `id`, `village_id`, `node_id`, `name`, `facility_type`, `operational_status`, `verification_status`.
7. **`action_plans`**
   - Columns: `id`, `village_id`, `issue_id`, `title`, `ward`, `priority`, `responsible_team`, `status`, `progress_percentage`, `start_date`, `target_completion_date`.
   - Statuses: `draft`, `in_progress`, `completed`, `cancelled`.
8. **`simulations`**
   - Columns: `id`, `village_id`, `scenario_type`, `blocked_edge_ids`, `result` (JSON containing isolated settlements, affected populations, travel delays), `created_at`.
9. **`community_feedbacks`**
   - Columns: `id`, `village_id`, `issue_id`, `resident_name`, `ward`, `message`, `tag`, `status`, `created_at`.
10. **`audit_logs`**
    - Columns: `id`, `village_id`, `action_type`, `entity_type`, `entity_id`, `performed_by`, `summary`, `details`, `created_at`.

---

## 4. API & Authorization Architecture

### 4.1 Existing Routes
Currently, `routes/api.php` exposes:
- Public: `/dashboard/stats`, `/villages`, `/issues`, `/action-plans`, `/feedback`, `/ai/chat`, `/ai/insights`.
- Admin (Sanctum + `admin` middleware): `/admin/dashboard`, `/admin/issues`, `/admin/simulations`, `/admin/priorities`.

### 4.2 Proposed Reporting API Endpoints
A dedicated, high-performance `ReportController` will provide unified municipal evidence endpoints:
- `GET /api/reports/overview`: Executive KPIs, verification metrics, coverage, and action-plan metrics.
- `GET /api/reports/categories`: Issue counts and percentages grouped by category.
- `GET /api/reports/trends`: Monthly or weekly timeline of submitted vs. resolved issues.
- `GET /api/reports/status-distribution`: Breakdown across `submitted`, `under_review`, `verified`, `in_progress`, `resolved`, `rejected`.
- `GET /api/reports/priorities`: Breakdown by severity and calculated priority.
- `GET /api/reports/ward-comparison`: Benchmarking reports and resolution performance across municipal wards.
- `GET /api/reports/infrastructure-condition`: Breakdown of mapped roads, bridges, and facilities by condition and verification status.
- `GET /api/reports/simulations`: Aggregated summary of recorded disruption scenarios and affected settlements.
- `GET /api/reports/table-records`: Paginated, searchable records for tabular inspection.
- `GET /api/reports/export`: Filtered CSV, JSON, and PDF document generation.
- `POST /api/reports/ai-insights`: Deterministic interpretation of report aggregates by the AI Agent.

### 4.3 Scoping & Authorization Rules
- Every query must accept optional parameters: `municipality`, `district`, `ward`, `village_id`, `date_from`, `date_to`, `category`, `status`, `severity`, `verification_status`.
- Authenticated municipal officers restricted to a specific municipality or village are strictly scoped at the database query level.
- All date filtering adheres to Nepal Standard Time (`Asia/Kathmandu`, UTC+05:45).

---

## 5. AI Visualization Agent Integration

- GaunPulse includes `AIVisualizationSection.jsx` and the FastAPI service (`http://127.0.0.1:8001/ai/insights`).
- In the new Reports & Insights dashboard, a prominent **"Generate AI Insights"** button will invoke the reporting analytics pipeline.
- The pipeline will feed real, calculated MySQL aggregates into the AI explanation engine, generating factual decision-support narratives with zero fabricated numbers.

---

## 6. Implementation Plan

1. **Phase 2:** Build `ReportController.php` and register API routes with efficient SQL aggregation queries.
2. **Phase 3:** Replace fake summary statistics with exact SQL formulas (Issue resolution rate, Median verification time, Community reports, Infrastructure counts).
3. **Phase 4:** Build the global filter toolbar with state synced to URL query parameters.
4. **Phase 5:** Implement 8 Chart.js visualizations with responsive canvas layouts and tooltips.
5. **Phase 6:** Implement searchable, paginated data tables for issues, infrastructure, action plans, and feedback.
6. **Phase 7:** Implement auto-refresh and cache invalidation.
7. **Phase 8:** Add filtered CSV, JSON, and PDF export handlers.
8. **Phase 9:** Connect the AI Insights button with deterministic summaries.
9. **Phase 10:** Enhance UI/UX maintaining the GaunPulse forest-green design system.
10. **Phase 11–15:** Performance tuning, automated testing, documentation, and clean Git commits.
