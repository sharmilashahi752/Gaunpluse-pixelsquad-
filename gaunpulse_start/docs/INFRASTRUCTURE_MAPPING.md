# GaunPulse — Infrastructure Mapping & Asset Management

## Overview

GaunPulse models rural infrastructure as a mathematical network graph $G = (V, E)$:
- **Vertices ($V$):** Settlements, health clinics, schools, water supply points, and road junctions.
- **Edges ($E$):** Roads (paved, gravel, earthen tracks), suspension footbridges, and trails.

This enables NetworkX to perform shortest-path routing, isolation analysis, and vulnerability simulations when disruptions occur.

---

## 1. Point Assets (Nodes)

Point assets represent locations where community members live or access critical services.

### Asset Categories
- **Settlement / Tole (`settlement`):** Cluster of households. Stores estimated household count and population.
- **Health Post (`health_post`):** Basic health center, sub-health post, or rural hospital.
- **School (`school`):** Primary school, secondary school, or educational institution.
- **Water Point (`water_point`):** Gravity-fed water tap, spring source, or storage reservoir.
- **Road Junction (`junction`):** Critical transit crossroads connecting multiple trails or roads.

### Adding a Node via API
`POST /api/villages/{villageId}/nodes`
```json
{
  "name": "Chhimti Primary School",
  "node_type": "school",
  "latitude": 27.8682,
  "longitude": 85.5861,
  "description": "Primary school serving 140 students from Upper and Lower Tole."
}
```

---

## 2. Linear Assets (Edges)

Linear assets represent physical paths connecting two nodes.

### Edge Attributes
- **Infrastructure Type:** `road`, `bridge`, `trail`.
- **Surface Type:** `paved`, `gravel`, `dirt`, `suspension`.
- **Condition Status:**
  - `operational`: Full access under normal conditions.
  - `limited`: Rough or seasonal access (e.g. monsoon difficulty).
  - `blocked`: Physical obstruction (landslide, washed-out bridge).
  - `under_repair`: Maintenance in progress.
- **Is Critical Lifeline:** Flag denoting a single point of failure (if severed, cuts off settlements with no alternate detour).

### Adding an Edge via API
`POST /api/villages/{villageId}/edges`
```json
{
  "name": "Bhotenamlang Suspension Bridge #2",
  "infrastructure_type": "bridge",
  "surface_type": "suspension",
  "source_node_id": 1,
  "target_node_id": 3,
  "length_meters": 140,
  "status": "operational",
  "is_critical": true,
  "notes": "Steel cable footbridge across Melamchi tributary."
}
```

---

## 3. OpenStreetMap Ingestion

Planners can auto-populate a village's lifeline network by querying OpenStreetMap's Overpass API:
1. Click **"Import Map Data (OSM)"** on the Village Map page.
2. Specify the search radius around the village center (e.g., 2,500m).
3. The server scans for OSM highways, footways, tracks, bridges, schools, and clinics.
4. Preview detected features, then click **"Save Scanned Features to MySQL"**.

---

## 4. NetworkX Simulation Integration

Once assets are mapped, they seamlessly feed into:
- **Disruption Simulator (`#/simulations`):** Mark any edge as severed; NetworkX calculates isolated households, access loss to health clinics and schools, and detour travel time penalties.
- **Action Plans (`#/action-plans`):** Auto-generate engineering response plans with budget estimates for repair.
- **AI Agent (`#/ai-agent`):** Query the multi-agent workspace (e.g. `@route-planner`, `@disaster-analyst`) about infrastructure resilience for any mapped village in Nepal.
