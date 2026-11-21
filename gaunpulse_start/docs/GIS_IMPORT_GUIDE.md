# GaunPulse — GIS & Spatial Data Ingestion Guide

This technical guide documents supported formats, coordinate specifications, and ingestion pipelines for **GeoJSON**, **CSV**, and **OpenStreetMap (Overpass)** in GaunPulse.

---

## 1. Supported Spatial Coordinate Reference System

All geographic data imported into GaunPulse must conform to **WGS 84 (EPSG:4326)**:
- Longitude range for Nepal: `80.0° E` to `89.0° E`
- Latitude range for Nepal: `26.0° N` to `31.0° N`
- Coordinates outside this bounding box are automatically rejected or flagged during schema validation.

---

## 2. GeoJSON FeatureCollection Specification

### A. Point Features (Infrastructure Nodes)
Point features represent spatial waypoints, junctions, settlements, or facilities:
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [85.5780, 27.8645]
  },
  "properties": {
    "node_code": "helambu_health_post",
    "name": "Bhotenamlang Primary Health Post Node",
    "node_type": "facility",
    "description": "Rural birthing center and emergency first-aid station"
  }
}
```

### B. LineString Features (Lifeline Edges)
LineString features represent vehicular roads, pedestrian trails, or bridges:
```json
{
  "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [85.5860, 27.8615],
      [85.5920, 27.8600]
    ]
  },
  "properties": {
    "edge_code": "suspension_bridge_b",
    "name": "Suspension Bridge B (River Crossing to Settlement B)",
    "source_node_code": "bridge_point",
    "target_node_code": "settlement_b",
    "infrastructure_type": "bridge",
    "surface_type": "suspension",
    "status": "passable",
    "length_meters": 95,
    "is_critical": true,
    "notes": "Critical suspension footbridge connecting Settlement B."
  }
}
```

---

## 3. CSV Tabular Ingestion Specification

### A. Nodes CSV Schema (`nodes.csv`)
| Column Header | Type | Description | Example |
|---|---|---|---|
| `name` | String (Required) | Readable name of waypoint | `Upper Chautara Junction` |
| `node_code` | String (Required) | Unique slug identifier | `upper_chautara` |
| `node_type` | String (Required) | `settlement`, `facility`, `junction`, `water_source` | `junction` |
| `latitude` | Float (Required) | Latitude in WGS84 | `27.8672` |
| `longitude` | Float (Required) | Longitude in WGS84 | `85.5821` |
| `description` | String (Optional) | Contextual notes | `Ridge intersection` |

### B. Edges CSV Schema (`edges.csv`)
| Column Header | Type | Description | Example |
|---|---|---|---|
| `name` | String (Required) | Lifeline name | `Chautara to School Road` |
| `edge_code` | String (Required) | Unique edge slug | `chautara_school_rd` |
| `source_node_code` | String (Required) | Code of origin node | `upper_chautara` |
| `target_node_code` | String (Required) | Code of destination node | `janahit_school` |
| `infrastructure_type` | String (Optional) | `road`, `bridge`, `trail`, `footpath` | `road` |
| `surface_type` | String (Optional) | `paved`, `gravel`, `earthen`, `suspension` | `gravel` |
| `length_meters` | Float (Optional) | Segment length in meters | `420` |
| `status` | String (Optional) | `passable`, `blocked`, `partially_blocked` | `passable` |

---

## 4. OpenStreetMap (Overpass API) Ingestion

GaunPulse connects directly to the OpenStreetMap Overpass API:
- Endpoint: `https://overpass-api.de/api/interpreter`
- Filter: Queries highways (`highway=*`) and amenities (`amenity=hospital|clinic|school|water_point`) within a geographic envelope around the village center.
- **Resilience Fallback**: If the Overpass API is throttled or offline, GaunPulse automatically activates a local high-fidelity dataset for the Helambu/Melamchi region to guarantee uninterrupted workflow execution.
- **Attribution Tagging**: All imported features are tagged with `source: 'osm'` and attributed to `© OpenStreetMap contributors (ODbL 1.0)`.

---

## 5. Duplicate Detection & Provenance

When importing spatial entities:
1. Existing nodes matching identical names or `node_code` values are updated rather than duplicated.
2. Newly created entities are stamped with:
   - `source`: `'geojson_import'`, `'csv_import'`, or `'osm'`
   - `verification_status`: `'imported'` (requires municipal review before marking as `'verified'`)
   - `confidence_score`: Initial baseline score (70% - 80%).
