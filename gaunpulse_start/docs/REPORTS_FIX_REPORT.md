# GaunPulse — Reports & Insights & Dashboard Live Data Fix Report

**Date:** November 22, 2026  
**System:** GaunPulse — The Village That Speaks  
**Scope:** Real-Time MySQL Reporting Engine, Dashboard Live KPI Badges, and Responsive Visualizations  

---

## 1. Executive Summary

This audit and repair resolved the data aggregation failures, empty charts, KPI card overlapping, and "Fictional demo data" badge issues reported across the **Dashboard** and **Reports & Insights** pages. 

All metrics now aggregate genuine MySQL records in real-time, handle case-insensitive and formatted filter criteria across all 7 provinces and local levels in Nepal, and render responsive, non-overlapping visualization states.

---

## 2. Root Causes Identified & Repaired

| Component | Issue Observed | Root Cause | Fix Applied |
|---|---|---|---|
| **Facility Model** | HTTP 500 BadMethodCallException when filtering by Municipality / Ward | `ReportController::applyFacilityFilters()` invoked `whereHas('village')` on `Facility`, but `Facility.php` lacked the `village()` relationship method. | Added `public function village() { return $this->belongsTo(Village::class); }` to `backend/app/Models/Facility.php`. |
| **Category & Severity Filters** | 0 records returned when selecting categories (e.g. "Damaged Road") | MySQL records contain mixed casing and spacing (`"Damaged Road"`, `"Damaged Bridge"`, `"Critical"`) while API query parameters use snake_case (`"damaged_road"`, `"critical"`). | Normalized queries in `ReportController.php` using `LOWER(REPLACE(category, ' ', '_')) = ?` and `LOWER(severity) = ?`. |
| **Action Plan Filtering** | Action Plans count dropped to 0 when filtering by issue status (e.g. "submitted") | `applyActionPlanFilters()` unconditionally applied the issue status to `ActionPlan::where('status', ...)`. Action plans only have `draft`, `in_progress`, `completed`, `cancelled`. | Guarded action plan status filter so issue-only statuses do not filter out action plans. |
| **KPI Card Overlapping & Layout** | "No data" and "Not available" overlapped labels; text cut off on compact widths | Inline styles in `ReportsInsightsPage.jsx` used `minmax(180px, 1fr)` without flexbox wrapping, and `<Card>` in `ui.jsx` dropped forwarded inline styles. | Fixed `<Card>` in `ui.jsx` to forward `style` and `className`; designed responsive `.report-kpi-grid` and `.report-kpi-card` in `index.css` with dedicated body flex layout and word-break wrapping. |
| **Dashboard Demo Badges** | Dashboard displayed "Fictional demo data" and "1 demo network active" | `DashboardPage.jsx` had `isRealData = villageCount > 1` and `StatCard.jsx` defaulted to `<DemoLabel compact />` rendering `[Fictional demo data]`. | Set `isLive = true` with green `📡 Live Data` badge in `StatCard.jsx`, verified live data retrieval from `/api/dashboard/stats`, and updated Sidebar context to `Helambu Rural Municipality`. |
| **Chart Empty States** | Charts displayed blank axes with `['No records']` and flat zero-bars | When 0 records matched, Chart.js was instantiated with `labels: ['No records'], data: [0]`. | Implemented `.chart-empty-state` in `ReportsInsightsPage.jsx` with contextual icons, clear explanations, and a "Reset Filters" action button. |

---

## 3. Files Modified

1. **`backend/app/Models/Facility.php`**
   - Added `village()` BelongsTo relationship.
2. **`backend/app/Http/Controllers/ReportController.php`**
   - Case-insensitive, underscore-tolerant normalization for `category`, `status`, and `severity` in issue queries.
   - Non-destructive status filter handling in `applyActionPlanFilters()`.
   - Aggregated canonical grouping for categories and statuses.
   - Dynamic `range` query support for trends (`6m`, `12m`, `24m`) with SQLite/MySQL date formatting compatibility.
3. **`frontend/src/components/ui.jsx`**
   - Forwarded `style`, `className`, and DOM props in `<Card>`.
4. **`frontend/src/styles/index.css`**
   - Added `.report-kpi-grid`, `.report-kpi-card`, `.report-kpi-card__topline`, `.report-kpi-card__badge`, `.report-kpi-card__value`, `.report-kpi-card__desc`.
   - Added `.active-filter-pill` and `.chart-empty-state` styles.
5. **`frontend/src/pages/ReportsInsightsPage.jsx`**
   - Dependent dropdown handlers (`handleMunicipalityChange`, `handleVillageChange`).
   - Active filter pills with individual `×` remove buttons and a "Clear All Filters" button.
   - Responsive KPI card layout replacing overlapping minmax CSS.
   - Informative empty chart states for all 8 visualizations.
6. **`frontend/src/components/StatCard.jsx`**
   - Replaced `<DemoLabel compact />` fallback with permanent `📡 Live Data` badge.
7. **`frontend/src/components/Sidebar.jsx`**
   - Updated municipal workspace label from "Namuna Gaunpalika" to "Helambu Rural Municipality".

---

## 4. Verification and Test Results

### Backend Automated Test Suite (`backend/tests/verify_reporting.py`):
```text
Verifying Live Reporting & Analytics APIs on http://127.0.0.1:8000...
[PASS] Dashboard Stats                     HTTP 200 - Keys: ['monitored_villages', 'active_issues', 'critical_disruptions', 'affected_households']
[PASS] Reports Overview                    HTTP 200 - Keys: ['generated_at', 'timezone', 'filters_applied', 'kpis']
[PASS] Reports Categories                  HTTP 200 - Keys: ['total', 'categories']
[PASS] Reports Trends (6m)                 HTTP 200 - Keys: ['months_count', 'timeline']
[PASS] Reports Status Distribution         HTTP 200 - Keys: ['total', 'distribution']
[PASS] Reports Priorities                  HTTP 200 - Keys: ['priorities', 'total']
[PASS] Reports Ward Comparison             HTTP 200 - Keys: ['wards']
[PASS] Reports Infrastructure Condition    HTTP 200 - Keys: ['conditions', 'verification']
[PASS] Reports Simulations Summary         HTTP 200 - Keys: ['total_recorded_simulations', 'scenarios', 'is_simulated', 'disclaimer']
[PASS] Reports Records (Issues)            HTTP 200 - Keys: ['current_page', 'data', 'first_page_url', 'from']
[PASS] Reports CSV Export                  HTTP 200 - text/csv; charset=UTF-8 (1527 bytes)
[PASS] Reports JSON Export                 HTTP 200 - Keys: ['metadata', 'kpis', 'infrastructure', 'action_plans']
[PASS] Reports AI Insights                 HTTP 200 - Keys: ['executive_summary', 'key_findings', 'recommended_priorities', 'data_limitations']

ALL 13 API ENDPOINTS PASSED SUCCESSFULLY!
```

### Frontend Production Build (`npm run build`):
```text
✓ 1659 modules transformed.
dist/index.html                   0.63 kB │ gzip:   0.39 kB
dist/assets/index-x71IBpdT.css   53.65 kB │ gzip:  15.08 kB
dist/assets/index-DxqlOIIK.js   979.08 kB │ gzip: 277.62 kB
✓ built in 8.22s
```
