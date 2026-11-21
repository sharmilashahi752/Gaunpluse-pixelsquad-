# GaunPulse Village Data Manager — Premium Human-Centered UI/UX Redesign

## 1. Executive Summary & Design Rationale

**GaunPulse — The Village That Speaks** is an AI-assisted rural infrastructure intelligence platform for Nepal. Previously, the **Village Data Manager** operated as an administrative control panel filled with raw database tables, complex GIS coordinate forms, manual node code generators, and technical topology diagnostics. For non-technical ward employees, local municipal planners, and community volunteers across rural Nepal, this created significant cognitive barriers.

### The Redesign: Friendly, Guided Village Stewardship
The Village Data Manager has been reimagined into an intuitive, guided village management experience:
- **Clean Village Manager Home:** A welcoming landing page featuring clear metrics, quick actions, and searchable village cards displaying real database counts and data completeness statuses.
- **Guided 4-Step Add Village Wizard:** Replaces overwhelming multi-step technical forms with a friendly step-by-step assistant that handles administrative directory lookups, interactive map pinning, automatic OpenStreetMap discovery, and draft saving.
- **Dedicated Village Detail View:** An organized workspace with an interactive Leaflet map, category-filtered views (Roads & Bridges, Schools & Health Facilities, Settlements & Water), and context-sensitive `+ Add Infrastructure` forms.
- **Friendly Data Quality Panel:** Replaces raw graph algorithms and error dumps with plain-language status tiers (*"Verified Network"*, *"Ready for Experimental Simulation"*, *"Needs Review"*, *"Getting Started"*) and actionable checklists.
- **Simplified Map Data Import:** A 7-step guided flow to preview and selectively import OpenStreetMap records or custom GeoJSON files into MySQL.

---

## 2. Information Architecture & Navigation

```
                       [ Village Data Manager Home ]
             "Manage your villages and infrastructure in one place."
                                     │
    ┌──────────────────┬─────────────┴───────────────┬──────────────────┐
    ▼                  ▼                             ▼                  ▼
[ 1. Explore ]    [ 2. Manage ]               [ 3. Import ]      [ 4. Quality ]
Search & Filter   Roads, Bridges,             OSM Discovery      Readiness &
Villages Grid     Schools & Health            & GeoJSON Upload   Checklists
    │                  │                             │                  │
    └──────────────────┴─────────────┬───────────────┴──────────────────┘
                                     ▼
                ┌──────────────────────────────────────────┐
                │        [ 4-Step Add Village Wizard ]      │
                │  Step 1: Administrative Details          │
                │  Step 2: Interactive Location Map        │
                │  Step 3: Automatic Infrastructure Search │
                │  Step 4: Review, Selection & Save        │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
                  [ Dedicated Village Workspace View ]
         Breadcrumb: Village Data Manager / <Village Name>
         Navigation: [ ← Back to Village Directory ]
         Tabs: Overview & Map | Roads & Bridges | Schools & Health
               Settlements & Water | Data Quality | Raw Records
```

---

## 3. Four-Step Add Village Wizard

| Step | User Objective | Technical Implementation |
| :--- | :--- | :--- |
| **Step 1: Village Details** | Select Province, District, Municipality, and Ward; enter English and Devanagari names. | Dynamic dependent dropdowns fed by `/api/locations/provinces`, `/districts`, `/municipalities`, and `/wards`. Validates administrative relationships in Nepal. |
| **Step 2: Select Location** | Search a location in Nepal, pan/zoom, click the map to place a pin, and adjust the study radius. | Leaflet `MapContainer`, Nominatim search, click listener for WGS84 coordinate capture, and study radius selector (1 km to 5 km). Clear explanation of administrative borders vs. study areas. |
| **Step 3: Find Infrastructure** | Click *"Find Infrastructure"* to scan OpenStreetMap for available roads, bridges, and facilities. | Calls `/api/villages/{id}/discover-osm` with real-time Overpass fallback. Categorizes discovered features into Roads, Bridges, Schools, Health, Water, and Settlements. Offers manual addition if no records exist. |
| **Step 4: Review & Finish** | Review location summary, select categories to import via checkboxes, review simulation readiness, and save. | Persists selected OSM features via `confirmOsmImport`, activates the village in MySQL, and immediately renders it in the directory and map. |

### Draft Progress Preservation
- Incomplete onboarding can be saved at any step via `POST /api/villages/wizard-draft`.
- Incomplete drafts appear in the village directory with an orange `Draft (Step X/4)` badge and a `Resume Draft` action button.
- Users can move back and forth without losing form entries or coordinates.

---

## 4. Dedicated Village Overview & Infrastructure Management

When opening a village, users are presented with a clean, high-hierarchy workspace:
1. **Interactive Village Map:** Renders actual stored nodes, paved/gravel roads, suspension footbridges, schools, health clinics, and settlement hamlets using GaunPulse's custom DivIcons.
2. **Category Tabs:**
   - 🛣️ **Roads & Bridges:** List of lifelines with surface types, lengths in meters, critical flags, and 1-click status toggles (`🟢 Passable` ↔ `🔴 Blocked`).
   - 🏥 **Schools & Health Facilities:** Operational statuses, capacities, and access node connections.
   - 🏘️ **Settlements & Water:** Residential clusters with household and population statistics, plus gravity water intake taps.
   - 🛡️ **Data Quality & Readiness:** Embedded `DataQualityPanel`.
   - 📋 **Raw Records:** Tabular view of all spatial graph nodes and edges for engineering inspection.
3. **Context-Sensitive `+ Add Infrastructure` Modal:**
   - Point Features (School, Health, Water, Settlement, Junction): Name, coordinates (click map or enter lat/lng), capacity, and notes.
   - Line Features (Road, Path, Bridge): Start node, destination node, surface type (gravel, paved, earthen, suspension), length in meters, and critical lifeline toggle.
   - Advanced options (geometry JSON, admin tags) tucked under `<details>` toggles.

---

## 5. Friendly Data Quality Panel

Instead of confusing non-technical users with raw graph exceptions (e.g. `NetworkXNotConnected`, `DisconnectedComponentsError`), the panel presents understandable statuses:

### Quality Status Tiers:
- **Verified Network:** Municipal field verified; high-confidence topology ready for budget allocation and tender release.
- **Ready for Experimental Simulation:** Valid graph topology; can test road closures, landslides, and bridge disruptions in the simulator.
- **Needs Review:** Some lifelines or facilities require connection before simulation can run with high confidence.
- **Getting Started:** Baseline registered; awaiting road or facility links.

### Human-Centered Checklists:
- *"Your village map is ready for basic analysis."*
- *"Some roads are not connected (X disconnected sections)."*
- *"Essential facilities (health post, school) need access connections."*
- *"Household estimates are missing."*
- *"Imported records are experimental until verified on-site by a municipal engineer."*

---

## 6. Component Architecture & Code Locations

| File | Type | Purpose |
| :--- | :--- | :--- |
| `frontend/src/pages/VillageDataPage.jsx` | Page | Main orchestrator managing directory view vs. detail view, URL hash params, alerts, and village selection sync. |
| `frontend/src/components/village-manager/VillageManagerHome.jsx` | Component | Landing screen with lush forest hero, 4 clear action cards, and searchable village cards grid. |
| `frontend/src/components/village-manager/AddVillageWizardModal.jsx` | Component | 4-step wizard with Leaflet coordinate picker, administrative hierarchy dropdowns, OSM discovery, and draft saving. |
| `frontend/src/components/village-manager/VillageDetailView.jsx` | Component | Dedicated village overview with interactive Leaflet map, category tabs, and context-sensitive `+ Add Infrastructure` modal. |
| `frontend/src/components/village-manager/DataQualityPanel.jsx` | Component | Human-centered readiness statuses, plain-language checklist, and expandable NetworkX technical metrics. |
| `frontend/src/components/village-manager/MapDataImportModal.jsx` | Component | 7-step guided flow for OpenStreetMap discovery and custom GeoJSON polygon uploads. |
| `frontend/src/styles/index.css` | Stylesheet | Responsive styling for `.vm-home`, `.vm-hero`, `.vm-actions-grid`, `.vm-village-card`, `.vm-stepper`, and `.vm-infra-grid`. |

---

## 7. Verification & End-to-End Testing

### Test 1: Frontend Production Build
- **Command:** `npm run build` inside `frontend/`
- **Result:** Successfully compiled 1,664 modules in 10.34s with zero syntax or compilation errors (`dist/index.html`, `dist/assets/index-Ca1iAHXh.css`, `dist/assets/index-Cl-tLXEW.js`).

### Test 2: Draft Creation & Wizard Persistence
- **Action:** Sent draft village payload (`Ghandruk Model Ward`, Pokhara Metropolitan City, Ward 1, Kaski) via `POST /api/villages/wizard-draft`.
- **Result:** Returned HTTP 200 with `draft_id: 21` and persisted draft record with `onboarding_step: 1` in MySQL.

### Test 3: OpenStreetMap Live Discovery & Activation
- **Action:** Activated village via `POST /api/villages/21/activate`.
- **Result:** Automated discovery retrieved live spatial features; network readiness calculated `status: "imported_unverified"` with `can_simulate: true`.

### Test 4: Manual Infrastructure Addition & Deletion
- **Action:** Created point node via `POST /api/villages/1/nodes`, attached facility via `POST /api/villages/1/facilities`, and cleaned up records.
- **Result:** Returned HTTP 201 Created for both entities; verified full relational integrity.

### Test 5: Cross-Module Integration Sync
- **Action:** Tested `useVillageSelection` context across `VillageDataPage`, `VillageMapPage`, and `SimulationsPage`.
- **Result:** Switching villages in Village Data Manager automatically synchronizes the active village ID, Leaflet viewport, and simulation constraints throughout the entire application.

---

## 8. Known Limitations & Recommendations
- **Overpass Rate Limiting:** While multiple fallback endpoints are configured, high-volume automated queries should use local caching (currently cached for 1 hour for successful responses).
- **Field Ground-Truthing:** OpenStreetMap features provide high topological utility for pathfinding, but local household numbers and structural bridge scour depth require manual municipal field confirmation.
