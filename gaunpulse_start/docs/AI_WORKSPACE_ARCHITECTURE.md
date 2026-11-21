# GaunPulse AI Intelligence Workspace — Architectural Specification

**GaunPulse: The Village That Speaks**  
AI-ready rural infrastructure decision-support platform for Nepal.

---

## 1. Executive Overview

GaunPulse unifies all municipal artificial intelligence capabilities into **ONE integrated AI Intelligence Workspace**. Rather than fragmenting the user interface with separate, disjointed chatbots across the main navigation, the main sidebar maintains its standardized 9-module layout with a single **AI Agent** entry point.

Inside **AI Agent**, officials access a tabbed secondary workspace hosting 7 specialized agents:

1. **AI Overview**: High-level municipal triage metrics, single-point-of-failure warnings, and quick-action triggers.
2. **Problem Prioritization Agent**: Deterministic multi-criteria scoring algorithm (Population 30%, Disruption 25%, Severity 30%, Ground Verification 15%) to rank repairs without LLM hallucination.
3. **Infrastructure Impact Agent**: Graph-theoretic simulation powered by NetworkX to isolate failed roads/bridges and compute newly disconnected households and cut-off schools/clinics.
4. **Reports & Visualization Agent**: Interactive Chart.js analytics (ward distribution, monthly monsoon trends, severity ratios) and CSV/print data exports.
5. **Repair Planning Agent**: Structured engineering action plan generator with inspection checklists, assigned teams, and direct persistence to MySQL with human signoff requirements.
6. **Citizen Assistance Agent**: Bilingual Devanagari (`ne`) and English (`en`) inquiry assistant with live tracking code status lookup (`GP-BRG-01`) and citizen privacy redaction.
7. **AI Coordinator**: Central multi-agent orchestrator capable of multi-step cross-disciplinary workflows with transparent tool attribution.

---

## 2. Multi-Tier System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite Frontend (Port 5173)               │
│                                                                        │
│   Main Sidebar (Standardized 9 Items)                                  │
│   └── "AI Agent" (Highlighted via activePage === 'ai-agent')           │
│         └── Unified AI Intelligence Workspace                          │
│               ├── [1. AI Overview]                                    │
│               ├── [2. Problem Prioritization Agent]                   │
│               ├── [3. Infrastructure Impact Agent]                     │
│               ├── [4. Reports & Visualization Agent]                   │
│               ├── [5. Repair Planning Agent]                           │
│               ├── [6. Citizen Assistance Agent]                        │
│               └── [7. AI Coordinator]                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  REST JSON (Authenticated)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Laravel 11 REST Gateway (Port 8000)               │
│                                                                        │
│   Controllers:                                                         │
│   • AIController (/api/ai/chat, /api/ai/insights)                     │
│   • PriorityController (/api/priorities)                               │
│   • SimulationController (/api/simulations)                            │
│   • ActionPlanController (/api/action-plans)                           │
│   • IssueController (/api/issues)                                      │
│                                                                        │
│   Safeguards & Security:                                               │
│   • Citizen PII Redaction (strips phone numbers, names, GPS jitter)    │
│   • Village Role-Based Access Control                                  │
│   • Human-in-the-Loop Signoff (status: 'pending' for draft plans)      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────────┐
       │ ServBay MySQL DB (3306)│      │ Python FastAPI Service (8001) │
       │                        │      │                               │
       │ • villages             │      │ • NetworkX MultiGraph Engine  │
       │ • nodes, edges         │      │ • Deterministic Sim Engine    │
       │ • facilities           │      │ • Bilingual NLP Synthesizer   │
       │ • issues, action_plans │      │ • Adversarial Refusal Guard   │
       └────────────────────────┘      └───────────────────────────────┘
```

---

## 3. Navigation & State Synchronization

- **Main Navigation Invariant**: The main sidebar item `AI Agent` remains active regardless of which internal agent is selected.
- **Deep Linking**: The URL format `#/ai-agent?tab=<tab_id>` allows direct linking to specific agents:
  - `#/ai-agent?tab=overview`
  - `#/ai-agent?tab=prioritization`
  - `#/ai-agent?tab=impact`
  - `#/ai-agent?tab=visualization`
  - `#/ai-agent?tab=planning`
  - `#/ai-agent?tab=citizen`
  - `#/ai-agent?tab=coordinator`
- **State Persistence**: Browser refresh retains the active tab via `hashchange` listeners without reloading the application shell.

---

## 4. Agent Responsibilities & Data Sources

| Agent | Purpose | Data Sources | Calculation Engine | Output Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** | Triage & awareness | `/api/dashboard/stats`, `/api/ai/insights` | MySQL Aggregation | High-level metrics, risk alerts |
| **Prioritization** | Ranking & triage | `/api/priorities`, `/api/issues` | Deterministic 4-Factor Weighted Model | Ranked table, audit breakdowns, override notes |
| **Impact** | Isolation analysis | `/api/simulations`, `/api/villages/{id}/network` | NetworkX MultiGraph Dijkstra paths | Before/after routes, HH cut-off count, detour times |
| **Visualization** | Spatial & trend reporting | `/api/issues` | Chart.js Bar/Line/Doughnut | Ward bars, seasonal curves, CSV export, print PDF |
| **Repair Planning** | Action plan drafting | `/api/issues/{id}` | Engineering task rules + AI draft | Editable action plan, direct `/api/action-plans` save |
| **Citizen Assistance**| Public communication | `/api/issues` | Tracking Code DB Lookup | Bilingual Devanagari/English status & reporting guide |
| **Coordinator** | Cross-agent synthesis | All tools | Multi-Agent Orchestrator | Multi-step response with agent contribution badges |

---

## 5. Security & Governance

1. **No Automated Expenditure**: Action plans are strictly drafted in `pending` status. Human municipal approval is mandatory before financial disbursement or tender release.
2. **Citizen Privacy**: PII is redacted at the Laravel gateway level. The external LLM receives only infrastructure codes (`GP-BRG-01`), disruption categories, and physical attributes.
3. **Adversarial Resistance**: Refuses prompt-injection instructions attempting to declare uninspected infrastructure safe, drop tables, or approve unverified expenses.
