# GaunPulse — Municipal Report Metrics & Calculation Rules

This document outlines the exact mathematical formulas, eligibility criteria, edge-case handlings, and boundary definitions implemented in the GaunPulse reporting system.

---

## 1. Issue Resolution Rate

### Formula
$$\text{Resolution Rate} = \left(\frac{N_{\text{resolved}}}{N_{\text{eligible}}}\right) \times 100$$

### Definitions
- **Eligible Issues ($N_{\text{eligible}}$)**: All recorded issues within the active filter scope **excluding** issues with status `rejected`.
- **Resolved Issues ($N_{\text{resolved}}$)**: Issues with status `resolved`.
- **Edge Cases**:
  - If $N_{\text{eligible}} = 0$, Resolution Rate evaluates to `null` and displays as **"No data"** rather than `0%` or dividing by zero.
  - Rejected issues are explicitly logged as non-eligible and tracked separately in KPI metadata.

---

## 2. Median Verification Latency

### Definition
The median time elapsed between an issue's initial creation (`created_at`) and its earliest verified status change in the `issue_updates` audit trail (`new_status IN ('verified', 'in_progress', 'resolved')`).

### Calculation Method
1. Query distinct issues within scope that reached a verified status.
2. Calculate latency in seconds: $t_{\text{verified}} - t_{\text{created}}$.
3. Sort all non-negative latencies in ascending order.
4. Calculate median:
   - For odd $N$: value at index $\frac{N - 1}{2}$.
   - For even $N$: average of values at indices $\frac{N}{2} - 1$ and $\frac{N}{2}$.
5. Format into human-readable hours / days.
6. **Edge Case**: If 0 issues have reached verified status within the filter window, the latency returns `null` and displays as **"Not available"**.

---

## 3. Community Reports Count

### Formula
$$\text{Community Reports} = N_{\text{issues (citizen submitted)}} + N_{\text{feedback (community voices)}}$$

### Definitions
- Includes citizen-reported issues (`reported_by` contains citizen/resident identifiers or general public submissions).
- Includes all resident feedback submissions from `community_feedback` within the active geographic and temporal filter scope.

---

## 4. Lifeline Infrastructure Categorization

Count of physical network entities stored in `nodes` and `edges`:
- **Roads & Trails**: Edges with `edge_type IN ('road', 'trail', 'path', 'track')`.
- **Bridges**: Edges with `edge_type IN ('bridge', 'suspension_bridge', 'wooden_bridge')` OR nodes with `node_type = 'bridge'`.
- **Public Facilities**: Nodes with `node_type IN ('facility', 'government', 'community_center')`.
- **Health Posts**: Nodes with `node_type IN ('health_post', 'hospital', 'clinic')`.
- **Schools**: Nodes with `node_type IN ('school', 'college', 'kindergarten')`.
- **Water Access**: Nodes with `node_type IN ('water_point', 'reservoir', 'tap')`.

---

## 5. Simulation Aggregations & Disclaimers

### Simulation Rules
- Scenarios are calculated based on shortest-path graph impact models in NetworkX.
- **Rule on Household Counts**: Affected household numbers across scenarios **MUST NOT** be summed together, as different failure scenarios often affect overlapping residential clusters.
- **Mandatory Disclaimer**: Every simulation metric must display:
  > *"Scenario outcomes are simulated estimates based on network topology, not confirmed damage."*
