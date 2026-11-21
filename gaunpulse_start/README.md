# GaunPulse — The Village That Speaks

**AI-ready rural infrastructure intelligence platform for Nepal.**

GaunPulse models rural lifeline networks (roads, bridges, footpaths, schools, health posts, and water reservoirs) as mathematical graphs. Using NetworkX graph algorithms, it simulates the real human impact of seasonal monsoons, landslides, and bridge failures on rural communities, and helps municipal officials compare repair interventions ("What If We Fix This First?").

---

## Architecture Overview

1. **Frontend (React 19 + Vite + Leaflet + OpenStreetMap)**
   - Port: `http://127.0.0.1:5173/`
   - Interactive GIS map with Leaflet tiles, condition markers, and failure visualization.
   - Live Failure Simulation and "What If We Fix This First?" Repair Comparison UI.

2. **Backend API (Laravel 11 / PHP 8.3 + MySQL ServBay)**
   - Port: `http://127.0.0.1:8000/api`
   - Manages villages, infrastructure nodes, edges, facilities, and citizen issue reports.
   - Internal authorized gateway proxying graph calculation requests to the private Python intelligence service.

3. **Intelligence Engine (Python 3.13 + FastAPI + NetworkX)**
   - Port: `http://127.0.0.1:8001/` (Interactive Docs: `http://127.0.0.1:8001/docs`)
   - Pure graph-theoretic shortest-path calculations using NetworkX.
   - Computes baseline vs post-disruption accessibility, newly disconnected households, detours, and repair trade-offs.

---

## How to Run All Services (Windows PowerShell)

### 1. Python Intelligence Service

```powershell
cd gaunpulse_start\intelligence
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Run automated pytest test suite:
```powershell
python -m pytest -v
```

### 2. Laravel Backend API

```powershell
cd gaunpulse_start\backend
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Run automated PHPUnit test suite:
```powershell
php vendor/bin/phpunit
```

### 3. React Frontend Dashboard

```powershell
cd gaunpulse_start\frontend
npm install
npm run dev
```

Build for production:
```powershell
npm run build
```

---

## Infrastructure Impact Simulation Algorithm

When a failure is simulated on a road or bridge:

1. **Graph Construction:** Builds an in-memory `networkx.MultiGraph` from validated village nodes and edges.
2. **Baseline Journey Routing:** Calculates shortest travel paths from each settlement to all essential facilities (schools, health posts, water intake points).
3. **Graph Copy Isolation:** Clones the graph in memory and removes the failed infrastructure connection. **The MySQL database records are never modified or deleted.**
4. **Disruption Assessment:**
   - **Newly Disconnected:** Settlements that lose all paths to one or more essential facilities (`status: unreachable`).
   - **Detour Routes:** Settlements that retain access via longer mountain routes (`status: detour`), reporting exact extra travel minutes.
   - **Already Disconnected:** Preserves settlements that were already cut off before the scenario, preventing false impact counts.
5. **Household Aggregation:** Tallies unique households without double-counting when multiple facilities fail.

---

## "What If We Fix This First?" Repair Comparison Engine

Allows municipal leadership to compare two competing repair options side-by-side:

- **Scenario A:** e.g., Repair Suspension Bridge B First.
- **Scenario B:** e.g., Clear Road 1 Debris Slide First.

Calculates:
- Unique households regaining mapped access.
- Essential facilities restored.
- Total travel time saved across journeys.
- Remaining disruptions and unreachable routes.
- **Cost Transparency:** Costs are marked as `unknown - do not rank on cost without verified estimates`. Final priority is decided by municipal officials based on community vulnerability and monsoon safety.

---

## API Request and Response Examples

### 1. GET `/api/dashboard/stats`
Returns live municipal counts calculated directly from MySQL:
```json
{
  "monitored_villages": 1,
  "active_issues": 5,
  "critical_disruptions": 2,
  "affected_households": "73",
  "resolved_issues": 1,
  "total_action_plans": 5,
  "action_plans_in_progress": 5,
  "community_voices_count": 2
}
```

### 2. POST `/api/issues`
Report a new infrastructure disruption:
```json
{
  "village_id": 1,
  "edge_id": 2,
  "title": "Bridge B suspension anchor crack detected",
  "category": "damaged_bridge",
  "severity": "critical",
  "description": "Tension anchor has developed a 5mm hairline fracture after river debris impact.",
  "latitude": 27.8615,
  "longitude": 85.5860
}
```

### 3. POST `/api/action-plans`
Create an intervention plan linked to an issue:
```json
{
  "village_id": 1,
  "issue_id": 6,
  "title": "Emergency epoxy grouting and anchor tensioning",
  "ward": "Ward 4",
  "priority": "Critical",
  "responsible_team": "Rapid Response Bridge Unit",
  "status": "in_progress",
  "progress_percentage": 25
}
```

### 4. POST `/api/simulations`

Request:
```json
{
  "village_id": 1,
  "blocked_edge_ids": [2]
}
```

Response:
```json
{
  "id": 1,
  "village_id": 1,
  "blocked_edge_ids": [2],
  "result": {
    "failed_edge_id": 2,
    "blocked_edge_ids": ["2"],
    "affected_households": 20,
    "newly_disconnected_households": 20,
    "already_disconnected_households": 0,
    "isolated_settlements": [
      {
        "settlement": "Settlement B (Tallo Gaun)",
        "settlement_id": "2",
        "households": 20,
        "reason": "Complete isolation: no accessible path remaining to any essential facility."
      }
    ],
    "access_comparisons": [
      {
        "settlement": "Settlement B (Tallo Gaun)",
        "facility": "Bhotenamlang Primary Health Post",
        "facility_type": "health_post",
        "before_minutes": 18.0,
        "after_minutes": null,
        "status": "unreachable"
      }
    ],
    "summary_explanation": "Simulated failure of Suspension Bridge B: 1 settlement(s) facing isolation: Settlement B (Tallo Gaun) (20 HH); A total of 20 unique households are impacted across the village network.",
    "data_quality": "fictional_demo"
  }
}
```

### POST `/api/simulations/compare`

Request:
```json
{
  "village_id": 1,
  "currently_blocked_edge_ids": [1, 2],
  "scenario_a": {
    "name": "Repair Suspension Bridge B First",
    "repair_edge_ids": [2]
  },
  "scenario_b": {
    "name": "Clear Road 1 Debris Slide First",
    "repair_edge_ids": [1]
  }
}
```

---

## Test Scenarios (sample-data/scenarios-demo.json)

- **Scenario A:** Suspension Bridge B failure completely disconnects Settlement B (20 households isolated).
- **Scenario B:** Bridge failure where a high mountain ridge detour remains (travel time +40 minutes).
- **Scenario C:** Parallel road failure with redundant connector intact (0 households impacted).
- **Scenario D:** Remote settlement already disconnected at baseline (properly categorized as already disconnected).

---

## Limitations and Data Quality

- All current topological coordinates and numbers represent **demonstration data for Bhotenamlang Demo Village** in Helambu, Sindhupalchok.
- Simulation travel times assume standard mountain pedestrian transit speeds (~50-65 meters/minute) adjusted for gradient and surface type.
- Results must serve as decision-support guidance for municipal engineers, never replacing physical on-site geotechnical inspection.
