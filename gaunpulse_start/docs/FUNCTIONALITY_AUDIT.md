# GaunPulse — Functionality Audit Report

**Date:** 2026-11-21  
**Auditor:** Senior Full-Stack & QA Engineering Team  
**System:** GaunPulse — Rural Infrastructure Intelligence Platform (Nepal)  
**Stack:** React 19 + Vite + Tailwind CSS | Laravel 11 + MySQL (ServBay) | Python 3.12 + FastAPI + NetworkX | React Leaflet + OpenStreetMap  

---

## 1. Executive Summary

GaunPulse has an elegant UI design system adhering to the forest-and-cream aesthetic (`#176342`, `#092d22`, `#fdfcf7`). However, several key user workflows were previously disconnected from backend APIs or reliant on static demonstration stubs in `demoData.js`. 

This audit details the exact status, root causes, involved files/endpoints, and required fixes across every visible page, form, and button.

---

## 2. Component & Workflow Functionality Audit Matrix

| Page / Component | Interactive Control / Form | Expected Behavior | Current Actual Behavior | Status | Root Cause | Files & Endpoints Involved | Required Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Simulations** (`/simulations`) | "Run Impact Simulation" | Disables selected edge, runs NetworkX calculation via Laravel/FastAPI, renders before-and-after KPI cards & journey table. | Fails on render when simulation completes. | **Broken** | `SimulationsPage.jsx` uses `<Info size={18} ...>` on line 410, but `Info` is not imported from `lucide-react`. Crashes React runtime with `ReferenceError: Info is not defined`. | `SimulationsPage.jsx`<br>`POST /api/simulations` | Add `Info` to `lucide-react` import list in `SimulationsPage.jsx`. |
| **Simulations** (`/simulations`) | "What If We Fix This First?" | Compares two repair options (Option A vs Option B) with NetworkX. | Functional in backend, but edge selectors must sync cleanly with loaded network data. | **Partially Functional** | Needs robust edge code / id resolution when switching villages. | `SimulationsPage.jsx`<br>`POST /api/simulations/compare` | Ensure edge dropdown correctly resets and maps to loaded village edge IDs. |
| **Issues & Alerts** (`/issues-alerts`) | "New report" button & Issue Form | Opens modal/form, accepts village, title, description, category, severity, lat/lng, photo; submits to MySQL via Laravel API; adds to list; survives refresh. | Form is a static preview form with `submitDemo` setting `submitted=true`. No API call made; data vanishes on reload. | **Placeholder Only** | Form in `ModulePages.jsx` (`IssuesAlertsPage`) is hardcoded mockup from Part 2. Does not call `POST /api/issues`. Table renders static `demoData.js`. | `frontend/src/pages/ModulePages.jsx`<br>`backend/routes/api.php`<br>`POST /api/issues` | Create full-featured `IssuesPage.jsx` with modal, village select, category, coordinates, photo upload, API integration with `POST /api/issues`, real pagination, and status badge filter. |
| **Issues & Alerts** (`/issues-alerts`) | Issue Detail & Status Update | Shows issue history/timeline; authorized user updates status (`submitted` → `verified` → `in_progress` → `resolved`). | No issue detail view or status update control exists in frontend. | **Missing** | Frontend does not invoke `PATCH /api/admin/issues/{id}/status`. | `AdminIssueController.php`<br>`frontend/src/pages/IssuesPage.jsx` | Add issue detail modal with status update action and comments history. Expose or authenticate status update endpoint. |
| **Action Plans** (`/action-plans`) | "Draft action plan" button & Form | Opens form to create action plan with title, issue link, village, ward, priority, owner/team, dates, status, progress %, notes. Persists to MySQL. | Button is inert (`onClick` missing or does nothing). Cards show static array from `demoData.js`. | **Placeholder Only** | No `action_plans` table, model, controller, or API route in Laravel backend. Frontend has no form. | `backend/database/migrations`<br>`backend/app/Models/ActionPlan.php`<br>`ActionPlanController.php`<br>`frontend/src/pages/ModulePages.jsx` | Create migration for `action_plans`, build `ActionPlan` model & controller, register routes, and build interactive `ActionPlansPage.jsx` with full CRUD and progress slider. |
| **Village Map** (`/village-map`) | Map Layers & Reported Issues | Renders OSM tiles, settlements, facilities, roads, bridges, AND reported infrastructure issue pins. | Shows nodes and roads, but does NOT display reported issue hazard pins. | **Partially Functional** | `InteractiveVillageMap.jsx` only iterates over `nodes` and `edges`; it ignores `villageData.issues`. | `InteractiveVillageMap.jsx`<br>`VillageMapPage.jsx` | Add an "Issues / Hazards" layer to `InteractiveVillageMap.jsx` with alert pins, popup details, and layer toggle. |
| **Village Map** (`/village-map`) | Condition Update / Asset Management | Allows updating an asset condition (e.g., mark road blocked/operational). | Selected asset box only displays metadata with no update action. | **Read-Only** | No PUT/PATCH endpoint for edges exposed to user without admin token. | `VillageMapPage.jsx`<br>`routes/api.php` | Add interactive condition toggle button for selected infrastructure asset. |
| **Dashboard** (`/`) | Summary Stat Cards | Shows live counts: Monitored Villages, Active Issues, Critical Issues, Affected Households. | Displays hardcoded numbers (12, 24, 3, 186) from `demoData.js`. | **Placeholder Only** | `DashboardPage.jsx` imports `summaryStats` from `demoData.js` instead of calling backend dashboard API. | `frontend/src/pages/DashboardPage.jsx`<br>`backend/app/Http/Controllers/DashboardController.php` | Create public `GET /api/dashboard/stats` endpoint returning actual counts from MySQL (`Village::count()`, `Issue::count()`, etc.) and connect frontend. |
| **Dashboard** (`/`) | Priority Action Queue | Displays top prioritized actions ranked by impact score. | Displays hardcoded items from `demoData.js`. Action button does nothing. | **Placeholder Only** | `PriorityActionQueue.jsx` does not fetch from `/api/priorities`. | `PriorityActionQueue.jsx`<br>`GET /api/priorities` | Connect component to `GET /api/priorities` and `/api/action-plans`. |
| **Dashboard** (`/`) | Community Voices preview | Shows latest resident messages with "Acknowledge" button. | Shows static records from `demoData.js`. "Acknowledge report" button does nothing. | **Placeholder Only** | No backend model, migration, or controller for community feedback. | `CommunityVoices.jsx`<br>`backend/app/Models/CommunityFeedback.php` | Create `community_feedbacks` table and API, connect dashboard to real feedback records. |
| **Community Voices** (`/community-voices`) | "Record a voice" button & Feed | Allows resident/volunteer to submit observation linked to village/ward. | Button is inert; page shows static dummy list. | **Placeholder Only** | No backend storage or interactive form. | `frontend/src/pages/ModulePages.jsx`<br>`backend/app/Http/Controllers/CommunityFeedbackController.php` | Implement feedback submission modal and live feed with acknowledgment. |
| **Reports & Insights** (`/reports-insights`) | "Export preview" button | Exports summary report data as CSV / JSON. | Button does nothing. | **Placeholder Only** | No export handler attached. | `ModulePages.jsx` | Implement JSON / CSV download or disable with "Coming Soon" badge. |
| **Village Data** (`/village-data`) | "Import preview" button | Opens village data importer. | Button does nothing. | **Placeholder Only** | No upload handler attached. | `ModulePages.jsx` | Label "Coming Soon (Part 5)" to prevent confusion. |
| **Header** | Search, Notifications, Profile | Global search, notification drawer, profile menu. | Inputs and buttons are visual placeholders. | **Placeholder** | Static UI elements without state handlers. | `frontend/src/components/Header.jsx` | Add functional feedback (search filter navigation, notification count preview, profile popover). |

---

## 3. Database Integrity & Environment Audit

- **MySQL Database**: `gaunpulse` running on ServBay (`127.0.0.1:3306`, user: `root`).
- **Existing Tables**:
  - `villages` (1 demo village seeded)
  - `nodes` (8 nodes seeded: settlements, facilities, junction, bridgehead)
  - `edges` (8 edges seeded: roads and suspension bridges)
  - `facilities` (3 facilities: health post, school, water reservoir)
  - `settlement_groups` (3 settlement groups)
  - `issues` (5 issues seeded)
  - `issue_updates`
  - `simulations`
  - `priority_scores`
- **Missing Tables Required for Full Functionality**:
  - `action_plans` (Required for Phase 4)
  - `community_feedbacks` (Required for Phase 9)

---

## 4. Remediation Plan (Phase-by-Phase)

1. **Phase 2 (Database & Backend Health)**:
   - Create non-destructive migrations for `action_plans` and `community_feedbacks`.
   - Implement `ActionPlan` and `CommunityFeedback` Eloquent models.
   - Create public dashboard stats endpoint `GET /api/dashboard/stats`.
   - Expose public read/create endpoints for issues, action plans, feedback, priorities, and simulations.
2. **Phase 3 (Issue Reporting End-to-End)**:
   - Build a standalone `IssuesPage.jsx` with full create modal (village dropdown, categories, lat/lng, photo upload).
   - Wire `POST /api/issues` with input validation, success banners, duplicate prevention.
   - Wire issue detail view and status update (`PATCH /api/issues/{id}/status`).
3. **Phase 4 (Action Plans End-to-End)**:
   - Build `ActionPlanController.php` with full CRUD.
   - Build standalone `ActionPlansPage.jsx` with "Add New Action Plan" modal, progress updater, and status management.
4. **Phase 5 (Infrastructure Simulation)**:
   - Fix missing `Info` icon in `SimulationsPage.jsx`.
   - Verify full cycle: React → Laravel (`POST /api/simulations`) → FastAPI (`POST /simulate`) → NetworkX → React.
5. **Phase 6 & 8 (Priorities & Dashboard Analytics)**:
   - Expose `GET /api/priorities` and connect `PriorityActionQueue`.
   - Connect `DashboardPage.jsx` stat cards to `GET /api/dashboard/stats`.
6. **Phase 7 (Village Map Integration)**:
   - Add reported issues to `InteractiveVillageMap.jsx`.
   - Make all markers clickable with rich popups.
7. **Phase 9 (Community Voices)**:
   - Build feedback creation modal and acknowledgment workflow.
8. **Phase 10 & 11 (Button Audit & E2E Verification)**:
   - Ensure every button works or is clearly disabled as "Coming Soon".
   - Run automated tests (`pytest`, `phpunit`, `npm run build`).
