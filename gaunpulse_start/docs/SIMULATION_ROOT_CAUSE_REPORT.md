# Simulation Root-Cause Report

Date: 2026-11-22  
Scope: React simulator, Laravel gateway and MySQL records, OSM import, FastAPI/NetworkX engine, AI workspace, and current test coverage.

## Executive finding

The village selector and the rendered simulation context can refer to different villages because `SimulationsPage` starts with village ID `1`, immediately fetches that network, then fetches the village list and changes the selector to the first (latest) village. The resulting network requests are neither cancelled nor guarded. A late response for village `1` can therefore overwrite the network response for the newly selected village. The selector still displays the new ID while the context, assets, and map display Bhotenamlang data.

This race is compounded by hardcoded Bhotenamlang-era fallback labels, page-local selection state, incomplete reset behavior, and demo defaults in the Python and AI layers.

## Repository and data state before repair

- Git branch: `main`.
- Working tree was clean at audit start.
- The MySQL database contained 18 village records. Village `1` is `Bhotenamlang (Demo Village)`; other saved villages include Marpha, Kohalpur, Namche Bazaar, and repeated Mahabu imports.
- Saved villages have distinct graph sizes and coordinates. For example, Bhotenamlang had 19 nodes/10 edges/3 settlement records, Marpha had 597 nodes/483 edges, and Mahabu had 165 nodes/150 edges.
- The `simulations` table existed but contained no saved simulations at audit time.
- `.env` is not tracked. No tracked secret file was found.

## Selected-village data flow before repair

1. `SimulationsPage` initializes `selectedVillageId` to `1`.
2. Its network effect immediately requests `GET /api/villages/1/network`.
3. A separate mount effect requests `GET /api/villages`.
4. The village list is sorted latest-first by Laravel; React assigns `data[0].id` to the selector and triggers a second network request.
5. Both requests can complete in either order. Each unconditionally calls `setVillageData(data)`.
6. Edge, repair, and result state are not comprehensively reset at the start of a village transition.
7. `POST /api/simulations` sends the currently selected ID and selected edge ID to Laravel.
8. Laravel loads nodes, edges, facilities, and settlements through the requested `Village` relationships, validates failure-edge membership, and forwards only that graph to FastAPI.
9. FastAPI builds an in-memory NetworkX graph, copies it, removes selected edges from the copy, and calculates route changes.
10. Laravel stores the returned result in `simulations` with the selected village ID.

The public failure-simulation gateway is therefore mostly village-scoped, but the frontend race can present a graph and edge selected from one village while posting another village ID. Laravel correctly rejects that combination as a cross-village edge.

## Confirmed root causes

### React selection and request lifecycle

- `selectedVillageId` is hardcoded to `1` on first render.
- Village selection is page-local; there is no shared provider or stable-ID persistence across relevant pages.
- The village-list effect overwrites selection with the first latest-sorted record on every mount.
- Network fetches have no `AbortController`, request generation token, or response village-ID guard.
- A village change does not immediately clear the previous network from the map.
- A village change does not clear simulation results, errors, comparison results, or active comparison tab state before loading.
- When a graph contains no edges, old edge and repair selections are not cleared.
- The context banner uses `Helambu Rural Municipality`, ward `4`, and `Sindhupalchok` as fallback content.
- `DemoLabel` is rendered for every selected village instead of only a record explicitly marked as demo.
- The map is recentered from village metadata, but the existing component has no simulation-specific fit-to-network/affected-area workflow.

### Laravel API and persistence

- `GET /api/villages/{village}/network` is correctly scoped by the route-bound village and returns its nodes, edges, facilities, settlements, and issues.
- `POST /api/simulations` validates that each requested edge belongs to the village, but accepts an empty failure list and does not enforce graph readiness.
- `POST /api/simulations/compare` did not validate that current-blocked and repair edges belong to the selected village.
- Simulation history listing accepts a village filter, but a specific history record was not checked against requested village context and returned only the legacy fields.
- The simulation schema lacked scenario type, failed infrastructure ID, graph version/snapshot reference, and verification level.
- The existing integrity endpoint checks basic endpoints, components, coordinates, and orphan nodes, but does not establish simulation readiness: settlement/facility access links, usable weights, geometry quality, provenance, verification class, or transport mode.
- `Village` coordinate accessors silently substitute Bhotenamlang coordinates when fields are missing. `Edge` silently substitutes a 100 m length. These defaults can make incomplete records look mapped.
- Administrative fields are stored as strings with optional `municipality_id`; there is no validated municipality foreign-key table. Creation does call `NepalLocationService::validateHierarchy`, but legacy/imported rows can still contain inconsistent metadata.

### OSM import and topology

- OSM roads are segmented at shared OSM nodes and stored with their real geometry, endpoints, length, provenance, and imported verification state.
- Facilities and settlement points are persisted as nodes, but OSM settlement points are not persisted into `settlement_groups`; consequently verified household estimates are usually unavailable.
- Facility/settlement points are not snapped to road access nodes. They can therefore exist visually near roads while remaining topologically disconnected.
- One-way direction and transport-mode access tags are not represented in the saved edge model or NetworkX graph.
- The discovery summary reports one component whenever junction nodes exist instead of calculating actual components.
- Crossings that do not share an OSM node correctly remain unconnected, but the readiness response did not explain this or other disconnected-component causes.

### Python/NetworkX engine

- The engine is graph-based and uses a copied `MultiGraph`, so it does not mutate MySQL data and supports parallel links.
- It always builds an undirected `MultiGraph`; one-way roads and transport modes are unsupported.
- Missing weights are silently invented from length, and missing length is silently replaced with 500 m. This can present fabricated minutes as calculated results.
- Result `data_quality` defaults to `fictional_demo` for every village because Laravel does not send a data-quality value and FastAPI does not derive one.
- Missing household data is coerced to zero, which is indistinguishable from a verified zero-household settlement.
- Facility attachment falls back to the first facility-like graph node when a supplied facility has no valid `node_id`; this can attach unrelated facilities to the wrong node.
- Settlement attachment falls back to name substring matching; this is not an authoritative relationship.
- Already blocked database edges are included in the baseline graph unless explicitly requested as blocked. A simulated failure can therefore calculate from an unrealistic operational baseline.
- Repair comparison subtracts a hardcoded 30 minutes when a route changes from unreachable to reachable. That is an invented travel-time improvement.
- Results do not return geographic baseline/alternative route geometries, so the frontend cannot draw evidence-backed before/after routes.

### AI workspace

- The AI simulation tool calls the same Python `run_simulation` function, which is the correct engine reuse direction.
- The agent nevertheless defaults every simulation intent to edge ID `2` and describes it as Suspension Bridge B.
- AI insight and response text hardcodes Bhotenamlang, Suspension Bridge B, Settlement B, 20 households, and specific recommended actions.
- Those hardcoded narratives can disagree with the selected village even when the numerical tool result came from a different graph.

### Tests and user experience gaps

- Existing Python tests cover isolation, detours, parallel routes, already disconnected settlements, household de-duplication, and repair comparison.
- Existing Laravel tests cover parts of simulation and village workflows, but not the frontend request race, complete readiness states, history metadata, or all cross-village repair restrictions.
- No React test runner or browser end-to-end suite is configured in `frontend/package.json`.
- The existing UI has no network readiness gate, no stale-request handling, no empty-network action panel, no history reopen workflow, no report generation, and no true before/after route visualization.

## Repair direction

1. Introduce a shared selected-village provider keyed only by numeric village ID, persisted intentionally in local storage and optionally synchronized to the hash query.
2. Abort prior network/history/readiness requests and ignore responses whose village ID is no longer current.
3. Clear all village-derived state before requesting a new graph.
4. Make Laravel return a structured readiness report with exact errors/warnings and an explicit verification tier; block invalid graphs and allow clearly labeled experimental runs for technically valid imported graphs.
5. Remove silent routing defaults. Use stored time only when reliable; otherwise route by stored distance and label the metric accordingly.
6. Pass graph metadata and pre-existing blocked links through Laravel to the single NetworkX service, return route edge IDs/geometries, and persist the graph version and verification level.
7. Validate every simulation and comparison edge against the selected village.
8. Render real stored geometries in baseline/after modes, distinguish affected and alternative routes, and expose empty/incomplete states without demo substitution.
9. Replace AI asset defaults with selected-village data and engine output.
10. Prove behavior with deterministic two-village fixtures plus Python, Laravel, production-build, and browser acceptance checks.

## Known data limitations discovered

- Several imported villages have settlement nodes but no `settlement_groups` or household estimates. Simulations can report connectivity changes, but household totals must be shown as unknown rather than zero.
- Existing imported facility points may not be connected to the road graph.
- Some saved administrative centers appear inconsistent with the real-world named location (for example, the current Marpha record and graph coordinates are outside Mustang). The simulator must use saved records and mark readiness/data warnings; correcting source data requires a validated re-import rather than silent relocation.
- Duplicate Mahabu village records exist. They were preserved as requested; this repair will not delete user data.
