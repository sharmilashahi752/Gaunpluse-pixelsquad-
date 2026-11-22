# GaunPulse AI Agent Integration Audit

**Audit Date:** 2026-11-22  
**System:** GaunPulse — The Village That Speaks  
**Scope:** AI Intelligence Workspace, Specialized Agents, Shared Location State, Laravel AI APIs, Python FastAPI Intelligence Service, and NetworkX Engine  

---

## Executive Summary

An in-depth architectural and code-level audit was conducted across all six GaunPulse AI Agents and the AI Workspace. While the application possesses sophisticated analytical models (deterministic scoring, NetworkX graph simulation, and decision-support LLM wrappers), the components were tightly coupled to the original demonstration village (Village ID: `1`, Bhotenamlang, Helambu Ward 4).

When an authorized user selected a different village—such as **Mahabu (Dailekh, Ward 1)**—the following critical failure occurred:
1. The **Infrastructure Impact Agent** kept the previously selected edge ID (`2`, Suspension Bridge B) in React state.
2. The simulation API call sent `village_id: 2` (Mahabu) with `blocked_edge_ids: [2]` (belonging to Bhotenamlang).
3. Laravel correctly rejected the request with `HTTP 422: "Infrastructure edge '2' does not belong to village mahabu."`
4. The React component caught the error and displayed it, but **failed to clear the previous simulation result**, leaving the old successful analysis visible beneath the error.

This audit details the root causes across all components and defines the data contracts and remediation plan.

---

## Detailed Component Audit

### 1. Infrastructure Impact Agent (`AIImpactSection.jsx`)
- **Problem 1 (Critical Bug):** Infrastructure edge dropdown did not synchronize when the village changed.
  - *Root Cause:* `useEffect` on `selectedVillageId` checked `if (edgeList.length > 0 && !selectedEdgeId)` before selecting the first edge. Because `selectedEdgeId` was already `'2'`, it was never cleared or updated to an edge belonging to the new village.
- **Problem 2 (Stale Result Leakage):** Previous simulation outcome remained rendered beneath new simulation errors.
  - *Root Cause:* `setError(err.message)` did not call `setSimResult(null)`. Both `{error && ...}` and `{simResult && ...}` rendered simultaneously.
- **Problem 3 (Stale Async Race Condition):** If the user rapidly toggled villages, an in-flight fetch from village A could resolve after village B was selected, overwriting `edges` with the wrong village's data.
  - *Root Cause:* Missing `AbortController` or request cancellation token.
- **Problem 4 (Unchecked Simulation Readiness):** Did not verify whether the selected village has a valid, connected graph (`can_simulate: true`) before attempting NetworkX execution.

### 2. Problem Prioritization Agent (`AIPrioritizationSection.jsx`)
- **Problem 1:** Hardcoded village ID and municipality state:
  - `const [municipality, setMunicipality] = useState('Helambu Rural Municipality');`
  - `const [villageId, setVillageId] = useState('1');`
- **Problem 2:** Hardcoded facility and service disruption names in scoring formula:
  - Lines 92–94: `cutoffServices = ['Bhotenamlang Primary Health Post', 'Janahit Secondary School'];`
- **Problem 3:** Hardcoded household estimates (20 HH, 35 HH, 28 HH) rather than reading actual settlement node data from the selected village.
- **Problem 4:** Did not use global `useVillageSelection()`.

### 3. Repair Planning Agent (`AIRepairPlanningSection.jsx`)
- **Problem 1:** Hardcoded API fetch URL:
  - Line 42: `fetch('http://127.0.0.1:8000/api/issues?village_id=1')`
- **Problem 2:** Hardcoded location defaults: `ward = 'Ward 4'`, responsible team defaulted to Helambu Bridge unit.
- **Problem 3:** Ignored the currently selected village in GaunPulse.

### 4. Reports & Visualization Agent (`AIVisualizationSection.jsx`)
- **Problem 1:** Hardcoded defaults:
  - `const [municipality, setMunicipality] = useState('Helambu Rural Municipality');`
  - `const [villageId, setVillageId] = useState('1');`
- **Problem 2:** Hardcoded demonstration ward distribution dictionary:
  - Line 79: `const wardCounts = { 'Ward 1': 0, 'Ward 2': 1, 'Ward 3': 2, 'Ward 4': 0, 'Ward 5': 1 };`
- **Problem 3:** Did not leverage the dynamic MySQL report bundling API (`/api/reports/bundle`), displaying inaccurate metrics when switching villages.

### 5. Citizen Assistance Agent (`AICitizenAssistanceSection.jsx`)
- **Problem 1:** Hardcoded tracking lookup URL:
  - Line 55: `fetch('http://127.0.0.1:8000/api/issues?village_id=1')`
- **Problem 2:** Residents inquiring about issues in other villages received false "Not Found" errors because only village 1 was searched.

### 6. AI Coordinator (`AICoordinatorSection.jsx`) & AI Home Screen (`AIHomeScreen.jsx`)
- **Problem 1:** Chat requests dispatched to backend hardcoded `village_id: 1`:
  - `body: JSON.stringify({ message: query, village_id: 1, ... })`
- **Problem 2:** Prompt suggestions hardcoded Bhotenamlang entities: "What happens if Bridge B is blocked?", "Ward 4".

### 7. Python Intelligence Service (`intelligence/agent.py` & `intelligence/tools.py`)
- **Problem 1:** Hardcoded simulation edge in agent:
  - `edge_id = 2` hardcoded in `agent.py` (line 146) when simulation intent was detected.
- **Problem 2:** Hardcoded issue ID in repair planning:
  - `issue_id = 1` hardcoded in `agent.py` (line 163).
- **Problem 3:** Fallback village name in tools:
  - Line 77 & 93 in `tools.py`: defaults village name to `"Bhotenamlang"`.

---

## Remediation Roadmap

1. **Centralize Location Context (`VillageSelectionContext.jsx`):**
   - Provide full administrative context: `{ selectedVillage, selectedVillageId, setSelectedVillageId, villages, loadingVillages, refreshVillages }`.
   - Maintain stable database integer IDs across all agent components.
2. **Fix `AIImpactSection.jsx`:**
   - Synchronize with `selectedVillageId`.
   - Clear `selectedEdgeId`, `simResult`, and `error` immediately when village changes.
   - Use `AbortController` to prevent stale asynchronous response races.
   - Verify graph readiness (`can_simulate`). If false, display clear missing-data guidance linking to Village Data Manager.
   - Clear previous simulation results if a new simulation attempt fails.
3. **Upgrade All Remaining AI Agents:**
   - Connect Prioritization, Repair Planning, Reports, Citizen Assistance, AI Coordinator, and Overview to dynamic location context.
   - Replace all hardcoded `village_id: 1` occurrences.
   - Derive settlement counts, facility names, and ward numbers dynamically from MySQL.
4. **Update Python AI Agent Orchestrator (`intelligence/agent.py` & `intelligence/tools.py`):**
   - Dynamically resolve valid edges and issues from the incoming `network_data` and `issues_data` for the requested village.
   - Return clean failure messages if a village has no eligible edges or issues.
5. **Add Automated Multi-Village Verification Tests:**
   - Verify village switching, edge ownership validation, stale result clearance, and dynamic newly added village availability.
