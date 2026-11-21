# GaunPulse AI Agent — Phase 6 contract

**Not yet implemented.** Do not use an LLM to invent counts or repair approvals.

Future read-only tools:
- `get_village_issues(village_id)` returns only authorized, tagged reports.
- `simulate_infrastructure_failure(village_id, edge_id)` returns the Python NetworkX result.
- `get_repair_priorities(village_id)` returns transparent, versioned scoring.

AI responses should include verified record IDs, graph data source/version, assumptions, and a caution when information is incomplete.
Never allow the AI to mark a bridge safe, approve expenditure, publish an emergency warning, or change official records without role-based human authorization.
Store API credentials only on the server, not in the React frontend.
