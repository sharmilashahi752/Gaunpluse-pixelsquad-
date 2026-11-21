import httpx
from typing import Any, Dict, List, Optional
from config import LARAVEL_API_URL, REQUEST_TIMEOUT
from simulator import run_simulation


async def get_village_issues(village_id: int = 1, issues_list: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Retrieve authorized village issue reports from Laravel, sanitizing private citizen data."""
    if issues_list is None:
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(f"{LARAVEL_API_URL}/issues", params={"village_id": village_id})
                if resp.status_code == 200:
                    raw_data = resp.json()
                    issues_list = raw_data.get("data", raw_data) if isinstance(raw_data, dict) else raw_data
                else:
                    return {"error": f"Failed to retrieve issues from Laravel (HTTP {resp.status_code})"}
        except Exception as exc:
            return {"error": f"Connection error contacting Laravel: {str(exc)}"}

    sanitized = []
    for item in issues_list:
        sanitized.append({
            "id": item.get("id"),
            "tracking_code": item.get("tracking_code"),
            "title": item.get("title"),
            "category": item.get("category"),
            "severity": item.get("severity"),
            "status": item.get("status"),
            "description": item.get("description"),
            "edge_id": item.get("edge", {}).get("id") if isinstance(item.get("edge"), dict) else item.get("edge_id"),
            "edge_name": item.get("edge", {}).get("name") if isinstance(item.get("edge"), dict) else None,
            "created_at": item.get("created_at"),
        })
    return {
        "village_id": village_id,
        "total_issues": len(sanitized),
        "issues": sanitized,
    }


async def get_infrastructure_details(
    infrastructure_id: int,
    village_id: int = 1,
    network_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Retrieve actual mapped infrastructure asset (road, bridge, or facility) from Laravel network."""
    if not network_data:
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(f"{LARAVEL_API_URL}/villages/{village_id}/network")
                if resp.status_code == 200:
                    network_data = resp.json()
                else:
                    return {"error": f"Failed to retrieve network from Laravel (HTTP {resp.status_code})"}
        except Exception as exc:
            return {"error": f"Connection error: {str(exc)}"}

    edges = network_data.get("edges", [])
    nodes = network_data.get("nodes", [])

    # Search in edges
    for edge in edges:
        if str(edge.get("id")) == str(infrastructure_id) or str(edge.get("edge_code")) == str(infrastructure_id):
            return {
                "asset_type": "edge",
                "id": edge.get("id"),
                "edge_code": edge.get("edge_code"),
                "name": edge.get("name"),
                "type": edge.get("infrastructure_type") or edge.get("type"),
                "surface_type": edge.get("surface_type"),
                "status": edge.get("status"),
                "length_meters": edge.get("length_meters"),
                "source_node": edge.get("source", {}).get("name") if isinstance(edge.get("source"), dict) else edge.get("source_node_id"),
                "target_node": edge.get("target", {}).get("name") if isinstance(edge.get("target"), dict) else edge.get("target_node_id"),
                "notes": edge.get("notes"),
                "village": network_data.get("village", {}).get("name") if isinstance(network_data.get("village"), dict) else "Bhotenamlang",
            }

    # Search in nodes
    for node in nodes:
        if str(node.get("id")) == str(infrastructure_id) or str(node.get("node_code")) == str(infrastructure_id):
            return {
                "asset_type": "node",
                "id": node.get("id"),
                "node_code": node.get("node_code"),
                "name": node.get("name"),
                "type": node.get("node_type") or node.get("type"),
                "households": node.get("households"),
                "population": node.get("population"),
                "description": node.get("description"),
                "coordinates": [node.get("latitude"), node.get("longitude")],
                "village": network_data.get("village", {}).get("name") if isinstance(network_data.get("village"), dict) else "Bhotenamlang",
            }

    return {"error": f"Infrastructure asset ID {infrastructure_id} not found in Village {village_id}."}


async def simulate_infrastructure_failure(
    edge_id: int,
    village_id: int = 1,
    network_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Invoke the NetworkX graph algorithm to calculate real access disruption when a road or bridge fails."""
    if not network_data:
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(f"{LARAVEL_API_URL}/villages/{village_id}/network")
                if resp.status_code != 200:
                    return {"error": f"Could not retrieve village network records (HTTP {resp.status_code})"}
                network_data = resp.json()
        except Exception as exc:
            return {"error": f"Simulation failure: {str(exc)}"}

    try:
        sim_result = run_simulation(
            nodes=network_data.get("nodes", []),
            edges=network_data.get("edges", []),
            blocked_edge_ids=[edge_id],
            failed_edge_id=edge_id,
            facilities=network_data.get("facilities", []),
            settlements=network_data.get("settlements", []),
        )

        return {
            "calculation_engine": "NetworkX MultiGraph",
            "failed_edge_id": edge_id,
            "blocked_edges_info": sim_result.blocked_edges_info,
            "affected_households": sim_result.affected_households,
            "newly_disconnected_households": sim_result.newly_disconnected_households,
            "already_disconnected_households": sim_result.already_disconnected_households,
            "isolated_settlements": sim_result.isolated_settlements,
            "detour_settlements": sim_result.detour_settlements,
            "essential_facilities_affected": sim_result.essential_facilities_affected,
            "summary_explanation": sim_result.summary_explanation,
            "journeys_count": len(sim_result.access_comparisons),
            "sample_journeys": [c.model_dump() for c in sim_result.access_comparisons[:4]],
        }
    except Exception as exc:
        return {"error": f"Simulation failure: {str(exc)}"}


async def get_repair_priorities(village_id: int = 1, issues_list: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Retrieve explainable priority rankings based on affected households, severity, and service disruption."""
    if issues_list:
        # Build priority rankings from provided issues list
        ranked = []
        for iss in issues_list:
            sev = (iss.get("severity") or "").lower()
            score = 85 if sev == "critical" else (60 if sev == "high" else 40)
            ranked.append({
                "score": score,
                "issue": iss,
                "urgency": "Immediate intervention required" if score >= 80 else "Scheduled maintenance",
            })
        ranked.sort(key=lambda x: x["score"], reverse=True)
        return {
            "weights": {"affected_households": 0.30, "service_disruption": 0.25, "severity": 0.30, "field_verified": 0.15},
            "policy_notice": "Priority rankings require municipal engineer validation before tender release.",
            "ranked_issues": ranked[:5],
        }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(f"{LARAVEL_API_URL}/priorities")
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "weights": data.get("weights"),
                    "policy_notice": data.get("policy_notice"),
                    "ranked_issues": data.get("data", [])[:5],
                }
            return {"error": f"Failed to retrieve priorities (HTTP {resp.status_code})"}
    except Exception as exc:
        return {"error": f"Connection error: {str(exc)}"}


async def generate_action_plan_draft(
    issue_id: int,
    village_id: int = 1,
    issue_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Prepare a suggested draft action plan based on verified records and engineering considerations."""
    if not issue_data:
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(f"{LARAVEL_API_URL}/issues/{issue_id}")
                if resp.status_code != 200:
                    return {"error": f"Issue ID {issue_id} not found."}
                issue_data = resp.json().get("data", resp.json())
        except Exception as exc:
            return {"error": f"Failed to retrieve issue data: {str(exc)}"}

    title = issue_data.get("title", f"Infrastructure Intervention {issue_id}")
    category = issue_data.get("category", "infrastructure")
    severity = (issue_data.get("severity") or "High").capitalize()
    desc = issue_data.get("description", "Disruption observed on lifeline corridor.")

    # Determine technical inspection steps based on category
    steps = [
        "1. On-site technical inspection by municipal engineer to assess structural stability.",
        "2. Erect high-visibility warning signs and temporary barrier tape to safeguard pedestrians.",
    ]
    if "bridge" in category.lower():
        steps.extend([
            "3. Inspect main suspension cables, deck timber planks, and deadman anchor blocks.",
            "4. Assess riverbed abutment scour depth following high-velocity monsoon runoff.",
        ])
        responsible = "Rapid Response Bridge Engineering Unit"
        accessibility = "Pedestrian crossing strictly halted until suspension tension tests pass."
    elif "water" in category.lower():
        steps.extend([
            "3. Pressure-test gravity intake pipeline between source and distribution chamber.",
            "4. Replace damaged HDPE couplers and flush sediment traps.",
        ])
        responsible = "Municipal WASH Division"
        accessibility = "Activate emergency communal water tanker or secondary spring source."
    else:
        steps.extend([
            "3. Clear slide debris and stabilize uphill slope with dry-masonry retaining wall.",
            "4. Grade drainage ditch to prevent future stormwater runoff scour.",
        ])
        responsible = "Ward Disaster Management Committee & Heavy Equipment Operator"
        accessibility = "Provide temporary single-lane or pedestrian footway bypass."

    follow_ups = [
        "Submit post-inspection photographic report to ward office.",
        "Record completion milestone in GaunPulse database for public transparency.",
    ]

    return {
        "title": f"Draft: Rapid Intervention for {title[:60]}",
        "issue_id": issue_id,
        "village_id": village_id,
        "ward": "Ward 4",
        "priority": severity,
        "responsible_team": responsible,
        "problem_summary": f"Reported {category.replace('_', ' ')} disruption: {desc[:140]}...",
        "evidence": f"Documented in MySQL (Tracking Code: {issue_data.get('tracking_code', f'GP-{issue_id}')}, Severity: {severity}).",
        "suggested_inspection_steps": steps,
        "accessibility_considerations": accessibility,
        "proposed_responsibilities": f"Supervised by {responsible} with community volunteer oversight.",
        "follow_up_tasks": follow_ups,
        "uncertainties": "Geotechnical subsurface rock stability and upcoming weather forecast during next 48 hours.",
        "target_days": 5 if severity == "Critical" else 10,
    }
