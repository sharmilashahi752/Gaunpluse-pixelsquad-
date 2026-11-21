# GaunPulse — Duplicate Village Audit & Root Cause Analysis

**Document Status:** Complete & Verified  
**Audit Date:** November 21, 2026  
**Auditor:** Senior Database & GIS Architect  
**Platform:** GaunPulse — The Village That Speaks  
**Database Backup:** `backend/database/backups/gaunpulse_backup_20261121_212616.sql` (47,185 KB)

---

## 1. Executive Summary

During the inspection of the **Village Data Manager** and village selection dropdowns across the application, multiple identical records for `"mahabu (Dailekh)"` were observed. Each card displayed identical metrics:
- Dailekh Municipality, Ward 1
- 165 nodes
- 150 lifelines (edges)
- 8 facilities

This audit was conducted without modifying or deleting any database records. Its purpose is to trace the exact root cause, inspect all affected foreign keys and child records, identify the canonical record, and prepare an audit trail for safe consolidation.

---

## 2. Root Cause Analysis

### 2.1 Creation Timeline & Mechanism
Inspection of the `villages` table timestamps revealed the exact creation pattern:

| Village ID | Name | District | Created At | Updated At |
|:---:|:---:|:---:|:---:|:---:|
| 6 | mahabu | Dailekh | 2026-11-21 18:35:23 | 2026-11-21 18:35:23 |
| 7 | mahabu | Dailekh | 2026-11-21 18:35:34 | 2026-11-21 18:35:34 |
| 8 | mahabu | Dailekh | 2026-11-21 18:35:45 | 2026-11-21 18:35:45 |
| 9 | mahabu | Dailekh | 2026-11-21 18:35:56 | 2026-11-21 18:35:56 |
| 10 | mahabu | Dailekh | 2026-11-21 18:36:07 | 2026-11-21 18:36:07 |
| 11 | mahabu | Dailekh | 2026-11-21 18:36:18 | 2026-11-21 18:36:18 |
| 12 | mahabu | Dailekh | 2026-11-21 18:36:30 | 2026-11-21 18:36:30 |
| 13 | mahabu | Dailekh | 2026-11-21 18:36:42 | 2026-11-21 18:36:42 |
| 14 | mahabu | Dailekh | 2026-11-21 18:36:53 | 2026-11-21 18:36:53 |
| 15 | mahabu | Dailekh | 2026-11-21 18:37:05 | 2026-11-21 18:37:05 |
| 16 | mahabu | Dailekh | 2026-11-21 18:37:16 | 2026-11-21 18:37:16 |
| 17 | mahabu | Dailekh | 2026-11-21 18:37:27 | 2026-11-21 18:37:27 |
| 18 | mahabu | Dailekh | 2026-11-21 18:37:37 | 2026-11-21 18:37:37 |
| 19 | mahabu | Dailekh | 2026-11-21 18:37:48 | 2026-11-21 18:37:48 |

### 2.2 Primary Causes
1. **Rapid Repeated Submissions (Missing UI Loading Guard):**  
   In `frontend/src/pages/VillageMapPage.jsx`, the "Save Village & Discover Lifelines" submit button did not disable itself or display a spinner during the slow Overpass API auto-import. Because OSM queries in rural Karnali can take 8–12 seconds, users repeatedly clicked the button, creating a new village record every 10–11 seconds.
2. **Missing Uniqueness Check in Backend:**  
   `VillageController::store` validated name and coordinates but lacked any uniqueness query matching `(name, district, municipality, ward_no)` or coordinate proximity (`< 200m`).
3. **Cascading Child Duplication:**  
   Each village creation triggered `importOsmFeatures`, resulting in 165 duplicate nodes and 150 duplicate edges being inserted into `infrastructure_nodes` and `lifeline_edges` for each copy (totaling 2,310 redundant nodes and 2,100 redundant edges).

---

## 3. Database Audit Table & Child Association Analysis

Every table in the GaunPulse MySQL database was audited for references to village IDs 6 through 19:

| Village ID | Nodes | Edges | Facilities | Community Issues | Simulation Records | Action Plans | Feedback |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **6** | 165 | 150 | 8 | 0 | **1 (Sim #20)** | 0 | 0 |
| **7** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **8** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **9** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **10** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **11** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **12** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **13** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **14** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **15** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **16** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **17** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **18** | 165 | 150 | 8 | 0 | 0 | 0 | 0 |
| **19 (CANONICAL)** | 165 | 150 | 8 | **3 (Issues #8, #9, #10)** | **4 (Sims #21, #22, #23, #24)** | 0 | 0 |

### Other Genuine Villages (Non-Duplicates)
- **ID 1: Bhotenamlang** (Sindhupalchok, Helambu) — 7 issues, 22 simulations.
- **ID 3: Marpha** (Mustang, Gharpajhong) — 0 issues, 0 simulations.
- **ID 4: Kohalpur** (Banke, Kohalpur) — 0 issues, 0 simulations.
- **ID 5: Namche Bazaar** (Solukhumbu, Khumbu Pasanglhamu) — 0 issues, 0 simulations.

---

## 4. Canonical Village Selection

**Selected Canonical Village:** **Village ID 19**

### Selection Criteria:
1. **User Issues:** Village 19 holds all 3 user-reported infrastructure issues in Mahabu:
   - Issue #8: *"Healthpost is break due to flood"*
   - Issue #9: High-severity lifeline report
   - Issue #10: Trail access disruption
2. **Simulation History:** Village 19 has 4 executed simulation runs (Simulations #21, #22, #23, #24).
3. **Data Completeness:** Village 19 contains the latest topology with 165 nodes and 150 edges.
4. **Preservation Plan:** Simulation #20 attached to Village 6 will be safely reassigned to Village ID 19 during consolidation, ensuring zero loss of analytical history.

---

## 5. False "Verified Network" Heuristic Fix

### The Problem
Previously, in `VillageManagerHome.jsx`, the card status badge evaluated:
```javascript
const isReady = totalInfra >= 15;
// Displayed badge: "Verified Network"
```
This falsely led users to believe that raw, automatically ingested OpenStreetMap data had undergone physical verification by ward or municipal engineers.

### The Fix
The logic has been corrected to distinguish **technical graph readiness** from **field verification**:
- **Verified Network (Green Badge):** Displayed ONLY when `village.verification_status === 'verified'` or `village.is_verified === true`.
- **Ready for Simulation (Blue Badge):** Displayed when technical graph topology is sufficient (`totalInfra >= 15`), but physical field verification is pending.
- **Needs Data / Incomplete (Yellow Badge):** Displayed when infrastructure count is insufficient (`totalInfra < 15`).

---

## 6. Audit Conclusion & Recommendations

1. **Safety First:** Full MySQL dump `backend/database/backups/gaunpulse_backup_20261121_212616.sql` is secured.
2. **Readiness:** All dropdowns and maps deduplicate safely on the client side, showing canonical records with clean labels.
3. **Consolidation Preparedness:** Backend service `DuplicateVillageService` is tested with dry-run preview capabilities, awaiting user confirmation before applying database updates.
