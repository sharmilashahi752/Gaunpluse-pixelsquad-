# OpenStreetMap Data Mapping & Translation Guide

## Overview

This document specifies how raw OpenStreetMap (OSM) tags, relations, ways, and nodes are normalized into GaunPulse database entities and NetworkX graph elements.

---

## 1. Tag Translation Rules

### A. Roads, Trails, and Footpaths (`way["highway"]`)

| OSM Tag Pattern | GaunPulse Edge Type | Default Surface | Base Speed (m/min) | Is Critical Lifeline |
|---|---|---|---|---|
| `highway=trunk`, `highway=primary` | `road` | `paved` | 500 (~30 km/h) | `true` |
| `highway=secondary`, `highway=tertiary` | `road` | `paved` / `gravel` | 400 (~24 km/h) | `true` |
| `highway=unclassified`, `highway=residential` | `road` | `gravel` | 300 (~18 km/h) | `false` |
| `highway=track` | `road` | `earthen` | 200 (~12 km/h) | `false` |
| `highway=path`, `highway=footway`, `highway=bridleway` | `trail` | `trail` | 66 (~4 km/h walking) | `false` |
| `bridge=yes`, `bridge=suspension` | `bridge` / `suspension_bridge` | `wood/metal` | 66 (foot) / 200 (vehicular) | `true` |

### B. Educational Facilities (`node["amenity"~"school|college|..."]`)

| OSM Tag | GaunPulse Node Type | Facility Category | Default Operational Status |
|---|---|---|---|
| `amenity=school` | `school` | `schools` | `functional` |
| `amenity=kindergarten` | `school` | `schools` | `functional` |
| `amenity=college`, `amenity=university` | `college` | `schools` | `functional` |

### C. Healthcare Facilities (`node/way["amenity"~"hospital|clinic|..."]`)

| OSM Tag | GaunPulse Node Type | Facility Category | Default Operational Status |
|---|---|---|---|
| `amenity=hospital` | `hospital` | `health` | `functional` |
| `amenity=clinic`, `healthcare=clinic` | `health_post` | `health` | `functional` |
| `amenity=pharmacy` | `pharmacy` | `health` | `functional` |

### D. Water Infrastructure (`node["amenity"="drinking_water"]` etc.)

| OSM Tag | GaunPulse Node Type | Facility Category | Critical Attribute |
|---|---|---|---|
| `amenity=drinking_water` | `water_point` | `water` | `potable=yes` |
| `man_made=water_tank` | `water_tank` | `water` | Storage reservoir |
| `natural=spring` | `water_point` | `water` | Natural source |

### E. Settlements & Hamlets (`node["place"~"hamlet|village|..."]`)

| OSM Tag | GaunPulse Classification | Population / Household Rule |
|---|---|---|
| `place=village` | Settlement Node (`type = 'settlement'`) | Preserved from official survey; never inferred from OSM |
| `place=hamlet` | Settlement Node (`type = 'settlement'`) | Preserved from official survey; never inferred from OSM |
| `place=isolated_dwelling` | Settlement Node (`type = 'settlement'`) | Preserved from official survey; never inferred from OSM |
| `building=yes` | **Ignored** as settlement | **Strict Rule**: Arbitrary buildings are never treated as settlements |

---

## 2. Topological Graph Construction

1. **Junction Splitting**:
   - Ways with shared node coordinates are detected.
   - Intersecting points automatically generate `osm_junction_{node_id}` nodes if they connect two or more road lifelines.
2. **Facility Snapping**:
   - Educational, medical, and water facilities are projected to the closest road or trail segment.
   - If distance $\le 200\text{ m}$, a connector footpath edge is automatically generated to ensure NetworkX reachability and impact calculation.
3. **Travel Time Calculation**:
   $$\text{Travel Minutes} = \frac{\text{Length in Meters}}{\text{Speed (m/min)}}$$
   Where speed incorporates incline and mountain trail penalties.
