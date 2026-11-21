# GaunPulse — Nepal Map Explorer Documentation

## Overview

The **Village Map** in **GaunPulse — The Village That Speaks** provides nationwide spatial intelligence across all 7 provinces, 77 districts, and 753 local levels (municipalities and rural municipalities) of Nepal.

Rather than being confined to a single demonstration village, GaunPulse allows municipal planners, emergency responders, engineers, and community ward members to:
- Explore the entirety of Nepal at nationwide zoom (`28.3949° N, 84.1240° E`).
- Search any village, municipality, or district across the country.
- Select from registered GaunPulse villages or onboard new ones anywhere in Nepal.
- Inspect georeferenced road networks, suspension bridges, walking trails, settlements, schools, and health posts on OpenStreetMap.
- Verify graph topology health before running network disruption simulations.

---

## 1. Nationwide Geographic Navigation

### Initial Nationwide Overview
- **Coordinates:** `[28.3949, 84.1240]`, Zoom Level `7`.
- **"View All Nepal" Button:** Instantly centers the viewport to provide a nationwide perspective of all registered GaunPulse villages.
- **Village Markers:** Monitored villages are represented with green beacon pins displaying total infrastructure node and edge counts in hover tooltips and interactive popups.

### Coordinate Inspection Readout
- Clicking anywhere on the Leaflet map captures exact WGS84 geographic coordinates (latitude and longitude to 6 decimal places).
- The coordinate inspector bar provides instant one-click actions:
  - `+ Add Village Here`: Launches the village registration modal pre-populated with clicked coordinates.
  - `+ Add Infrastructure Node Here`: Drops a new settlement, health post, school, or water point directly at the clicked coordinates.

---

## 2. Location Search Bar

The search bar (`"Search any village, municipality or district in Nepal..."`) executes multi-tier fuzzy geocoding:
1. **Registered GaunPulse Villages:** Matches villages already stored in MySQL. Selecting a saved village immediately flies the camera to the village network.
2. **Nepal Administrative Directory:** Searches the built-in catalog of 7 provinces, 77 districts, and official municipalities with administrative codes and bounding coordinates.
3. **OpenStreetMap Nominatim Geocoding:** Automatically falls back to high-resolution OpenStreetMap Nominatim geocoding constrained to Nepal (`countrycodes=np`), cached server-side for sub-second responses.

Selecting an unmapped location drops an animated pulse marker and enables the `+ Add as New Village` action.

---

## 3. Layer Visibility Controls

Users can toggle layers on the map in real-time:
- **Villages:** Nationwide pins for all registered GaunPulse villages.
- **Settlements:** Toles, bhattis, and hamlets with household counts.
- **Facilities:** Health posts, clinics, primary/secondary schools, and water reservoirs.
- **Bridges:** Suspension bridges and river crossings rendered in distinct amber/brown.
- **Roads:** Motor roads and foot trails with surface and condition indicators.
- **Issues & Hazards:** Community-reported landslides, river erosion, and road washouts.

---

## 4. Graph Topology Diagnostics

The "Validate Network" button triggers a mathematical graph audit:
- Evaluates connected components count.
- Flags orphan nodes (facilities without road/trail links).
- Checks spatial bounding coordinates against Nepal's geographic envelope (`26°N–31°N`, `80°E–89°E`).
- Provides a Topology Health Score (`0–100%`) before feeding into the NetworkX disruption simulator.
