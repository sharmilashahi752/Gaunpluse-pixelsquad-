from datetime import datetime, timezone
from typing import Any, Union
import networkx as nx

from graph_builder import build_network_graph, GraphValidationError
from schemas import (
    AccessComparison,
    SimulationRequest,
    SimulationResult,
    RepairComparisonRequest,
    RepairComparisonResult,
    RepairScenarioOutcome,
)


def run_simulation(
    nodes: list[Union[dict, Any]],
    edges: list[Union[dict, Any]],
    blocked_edge_ids: list[Union[int, str]],
    facilities: list[Union[dict, Any]] = None,
    settlements: list[Union[dict, Any]] = None,
    failed_edge_id: Union[int, str] = None,
    data_quality: str = "fictional_demo",
) -> SimulationResult:
    """
    Simulates the infrastructure impact of blocking one or more edges.
    Calculates baseline shortest paths, isolates failed connections on a graph copy,
    and analyzes accessibility changes, isolated settlements, and affected households.
    """
    # 1. Build original graph & metadata
    graph, meta = build_network_graph(nodes, edges, facilities, settlements)
    edge_by_id = meta["edge_by_id"]
    settlement_nodes = meta["settlement_nodes"]
    facility_nodes = meta["facility_nodes"]

    # Normalize blocked edge identifiers
    canonical_blocked_ids = set()
    blocked_edges_info = []

    for bid in blocked_edge_ids:
        b_str = str(bid)
        if b_str in edge_by_id:
            e_info = edge_by_id[b_str]
            canonical_blocked_ids.add(e_info["id"])
            if e_info not in blocked_edges_info:
                blocked_edges_info.append(e_info)
        else:
            # Check edge_code matching
            matched = False
            for edge_key, e_info in edge_by_id.items():
                if str(e_info.get("edge_code")) == b_str or str(e_info.get("raw_id")) == b_str:
                    canonical_blocked_ids.add(e_info["id"])
                    if e_info not in blocked_edges_info:
                        blocked_edges_info.append(e_info)
                    matched = True
                    break
            if not matched:
                raise GraphValidationError(f"Unknown infrastructure edge identifier: '{bid}'")

    if failed_edge_id and not canonical_blocked_ids:
        b_str = str(failed_edge_id)
        if b_str in edge_by_id:
            e_info = edge_by_id[b_str]
            canonical_blocked_ids.add(e_info["id"])
            blocked_edges_info.append(e_info)

    # 2. Compute Baseline Paths
    # Maps (settlement_id, facility_id) -> (distance, path)
    baseline_routes = {}
    already_disconnected_pairs = set()

    for s_node in settlement_nodes:
        s_id = s_node["id"]
        for f_node in facility_nodes:
            f_id = f_node["id"]
            if s_id == f_id:
                continue

            try:
                dist = nx.shortest_path_length(graph, s_id, f_id, weight="minutes")
                path = nx.shortest_path(graph, s_id, f_id, weight="minutes")
                baseline_routes[(s_id, f_id)] = (round(dist, 1), path)
            except nx.NetworkXNoPath:
                baseline_routes[(s_id, f_id)] = (None, None)
                already_disconnected_pairs.add((s_id, f_id))

    # 3. Create Disrupted Graph Copy
    disrupted_graph = graph.copy()
    for e_info in blocked_edges_info:
        u, v = e_info["source_id"], e_info["target_id"]
        e_key = e_info["id"]
        if disrupted_graph.has_edge(u, v, key=e_key):
            disrupted_graph.remove_edge(u, v, key=e_key)
        elif disrupted_graph.has_edge(u, v):
            # Fallback for non-keyed or alternate lookup
            disrupted_graph.remove_edge(u, v)

    # 4. Compute Post-Disruption Routes & Evaluate Impact
    access_comparisons = []
    settlement_status_tracker = {}
    facility_impact_tracker = set()

    for s_node in settlement_nodes:
        s_id = s_node["id"]
        s_name = s_node.get("settlement_name") or s_node.get("name")
        s_hh = s_node.get("households") or 0

        settlement_status_tracker[s_id] = {
            "name": s_name,
            "households": s_hh,
            "has_unreachable": False,
            "has_detour": False,
            "all_unreachable": True,
            "total_facilities": 0,
            "lost_facilities": [],
            "detour_facilities": [],
        }

        for f_node in facility_nodes:
            f_id = f_node["id"]
            if s_id == f_id:
                continue

            settlement_status_tracker[s_id]["total_facilities"] += 1
            f_name = f_node.get("facility_name") or f_node.get("name")
            f_type = f_node.get("facility_type") or f_node.get("type") or "facility"

            base_dist, base_path = baseline_routes.get((s_id, f_id), (None, None))

            # Recalculate on disrupted graph
            try:
                post_dist = nx.shortest_path_length(disrupted_graph, s_id, f_id, weight="minutes")
                post_path = nx.shortest_path(disrupted_graph, s_id, f_id, weight="minutes")
                post_dist = round(post_dist, 1)
            except nx.NetworkXNoPath:
                post_dist, post_path = None, None

            # Determine route status
            if base_dist is None:
                status = "already_disconnected"
                change = 0.0
            elif post_dist is None:
                status = "unreachable"
                change = None
                settlement_status_tracker[s_id]["has_unreachable"] = True
                settlement_status_tracker[s_id]["lost_facilities"].append(f_name)
                facility_impact_tracker.add(f_name)
            elif post_dist > base_dist:
                status = "detour"
                change = round(post_dist - base_dist, 1)
                settlement_status_tracker[s_id]["has_detour"] = True
                settlement_status_tracker[s_id]["all_unreachable"] = False
                settlement_status_tracker[s_id]["detour_facilities"].append(
                    {"facility": f_name, "extra_minutes": change}
                )
                facility_impact_tracker.add(f_name)
            else:
                status = "unchanged"
                change = 0.0
                settlement_status_tracker[s_id]["all_unreachable"] = False

            # Convert path nodes to readable labels
            readable_base_path = [graph.nodes[nid].get("name", nid) for nid in base_path] if base_path else []
            readable_post_path = [graph.nodes[nid].get("name", nid) for nid in post_path] if post_path else None

            access_comparisons.append(
                AccessComparison(
                    settlement=s_name,
                    settlement_id=s_id,
                    facility=f_name,
                    facility_id=f_id,
                    facility_type=f_type,
                    before_minutes=base_dist,
                    after_minutes=post_dist,
                    travel_time_change=change,
                    status=status,
                    baseline_path=readable_base_path,
                    alternative_path=readable_post_path,
                )
            )

    # 5. Aggregate Household Impacts Without Double-Counting
    total_affected_hh = 0
    newly_disconnected_hh = 0
    already_disconnected_hh = 0
    isolated_settlements = []
    detour_settlements = []

    for s_id, s_info in settlement_status_tracker.items():
        hh = s_info["households"]
        # If all facilities were already unreachable before simulation
        if s_info["total_facilities"] > 0 and all(
            (s_id, f["id"]) in already_disconnected_pairs for f in facility_nodes if f["id"] != s_id
        ):
            already_disconnected_hh += hh
            continue

        if s_info["all_unreachable"] and s_info["has_unreachable"]:
            # Completely isolated settlement
            newly_disconnected_hh += hh
            total_affected_hh += hh
            isolated_settlements.append({
                "settlement": s_info["name"],
                "settlement_id": s_id,
                "households": hh,
                "reason": "Complete isolation: no accessible path remaining to any essential facility.",
            })
        elif s_info["has_unreachable"]:
            # Lost access to one or more essential facilities
            newly_disconnected_hh += hh
            total_affected_hh += hh
            isolated_settlements.append({
                "settlement": s_info["name"],
                "settlement_id": s_id,
                "households": hh,
                "reason": f"Cut off from {len(s_info['lost_facilities'])} facility(ies): {', '.join(s_info['lost_facilities'])}.",
            })
        elif s_info["has_detour"]:
            # Retains access via longer route
            total_affected_hh += hh
            detour_settlements.append({
                "settlement": s_info["name"],
                "settlement_id": s_id,
                "households": hh,
                "detours": s_info["detour_facilities"],
            })

    # 6. Compose Transparent Summary Explanation
    blocked_names = [e["name"] for e in blocked_edges_info] or [str(x) for x in canonical_blocked_ids]
    blocked_str = ", ".join(blocked_names) if blocked_names else "none"

    if total_affected_hh == 0 and not isolated_settlements and not detour_settlements:
        summary = (
            f"Closure of {blocked_str} does not degrade baseline access to essential facilities. "
            f"Alternative redundant infrastructure routes remain fully operational for all settlements."
        )
    else:
        parts = []
        if isolated_settlements:
            iso_names = [f"{s['settlement']} ({s['households']} HH)" for s in isolated_settlements]
            parts.append(f"{len(isolated_settlements)} settlement(s) facing isolation: {', '.join(iso_names)}")
        if detour_settlements:
            det_names = [f"{s['settlement']} ({s['households']} HH)" for s in detour_settlements]
            parts.append(f"{len(detour_settlements)} settlement(s) requiring detours: {', '.join(det_names)}")
        parts.append(f"A total of {total_affected_hh} unique households are impacted across the village network.")
        summary = f"Simulated failure of {blocked_str}: " + "; ".join(parts) + "."

    return SimulationResult(
        failed_edge_id=failed_edge_id or (list(canonical_blocked_ids)[0] if canonical_blocked_ids else None),
        blocked_edge_ids=list(canonical_blocked_ids),
        blocked_edges_info=blocked_edges_info,
        affected_households=total_affected_hh,
        newly_disconnected_households=newly_disconnected_hh,
        already_disconnected_households=already_disconnected_hh,
        isolated_settlements=isolated_settlements,
        detour_settlements=detour_settlements,
        essential_facilities_affected=[{"facility": f} for f in sorted(facility_impact_tracker)],
        access_comparisons=access_comparisons,
        summary_explanation=summary,
        data_quality=data_quality,
        calculation_timestamp=datetime.now(timezone.utc).isoformat(),
    )


def compare_repairs(
    nodes: list[Union[dict, Any]],
    edges: list[Union[dict, Any]],
    currently_blocked_edge_ids: list[Union[int, str]],
    scenario_a_name: str,
    scenario_a_repair_ids: list[Union[int, str]],
    scenario_b_name: str,
    scenario_b_repair_ids: list[Union[int, str]],
    facilities: list[Union[dict, Any]] = None,
    settlements: list[Union[dict, Any]] = None,
) -> RepairComparisonResult:
    """
    Implements 'What If We Fix This First?':
    Compares two competing repair interventions against the current disrupted baseline.
    """
    # Baseline disrupted state
    sim_baseline = run_simulation(
        nodes=nodes,
        edges=edges,
        blocked_edge_ids=currently_blocked_edge_ids,
        facilities=facilities,
        settlements=settlements,
    )

    # Calculate remaining blocked for Scenario A
    repair_a_set = {str(x) for x in scenario_a_repair_ids}
    remaining_blocked_a = [
        bid for bid in currently_blocked_edge_ids
        if str(bid) not in repair_a_set
    ]
    sim_a = run_simulation(
        nodes=nodes,
        edges=edges,
        blocked_edge_ids=remaining_blocked_a,
        facilities=facilities,
        settlements=settlements,
    )

    # Calculate remaining blocked for Scenario B
    repair_b_set = {str(x) for x in scenario_b_repair_ids}
    remaining_blocked_b = [
        bid for bid in currently_blocked_edge_ids
        if str(bid) not in repair_b_set
    ]
    sim_b = run_simulation(
        nodes=nodes,
        edges=edges,
        blocked_edge_ids=remaining_blocked_b,
        facilities=facilities,
        settlements=settlements,
    )

    # Calculate improvements
    # Households regaining access = reduction in affected households
    hh_regained_a = max(0, sim_baseline.affected_households - sim_a.affected_households)
    hh_regained_b = max(0, sim_baseline.affected_households - sim_b.affected_households)

    # Facilities restored = reduction in affected facilities
    fac_restored_a = max(0, len(sim_baseline.essential_facilities_affected) - len(sim_a.essential_facilities_affected))
    fac_restored_b = max(0, len(sim_baseline.essential_facilities_affected) - len(sim_b.essential_facilities_affected))

    # Travel time improvement (sum of minutes saved across all detour routes)
    def calc_travel_savings(base_sim, repair_sim):
        savings = 0.0
        base_map = {(c.settlement, c.facility): c for c in base_sim.access_comparisons}
        for c in repair_sim.access_comparisons:
            key = (c.settlement, c.facility)
            if key in base_map:
                prev = base_map[key]
                if prev.status == "detour" and c.status == "unchanged":
                    if prev.after_minutes and c.after_minutes:
                        savings += max(0.0, prev.after_minutes - c.after_minutes)
                elif prev.status == "unreachable" and c.status in ("unchanged", "detour"):
                    # Restored from unreachable to mapped journey
                    savings += 30.0  # nominal baseline recovery metric
        return round(savings, 1)

    time_saved_a = calc_travel_savings(sim_baseline, sim_a)
    time_saved_b = calc_travel_savings(sim_baseline, sim_b)

    unreachable_a = sum(1 for c in sim_a.access_comparisons if c.status == "unreachable")
    unreachable_b = sum(1 for c in sim_b.access_comparisons if c.status == "unreachable")

    outcome_a = RepairScenarioOutcome(
        scenario_name=scenario_a_name,
        repaired_edge_ids=scenario_a_repair_ids,
        households_regaining_access=hh_regained_a,
        facilities_restored=fac_restored_a,
        travel_time_improvement_minutes=time_saved_a,
        remaining_blocked_edges=remaining_blocked_a,
        remaining_affected_households=sim_a.affected_households,
        unreachable_routes_count=unreachable_a,
    )

    outcome_b = RepairScenarioOutcome(
        scenario_name=scenario_b_name,
        repaired_edge_ids=scenario_b_repair_ids,
        households_regaining_access=hh_regained_b,
        facilities_restored=fac_restored_b,
        travel_time_improvement_minutes=time_saved_b,
        remaining_blocked_edges=remaining_blocked_b,
        remaining_affected_households=sim_b.affected_households,
        unreachable_routes_count=unreachable_b,
    )

    # Narrative summary of differences
    diff_parts = []
    if hh_regained_a != hh_regained_b:
        if hh_regained_a > hh_regained_b:
            diff_parts.append(
                f"'{scenario_a_name}' restores access for {hh_regained_a - hh_regained_b} more households than '{scenario_b_name}'"
            )
        else:
            diff_parts.append(
                f"'{scenario_b_name}' restores access for {hh_regained_b - hh_regained_a} more households than '{scenario_a_name}'"
            )

    if fac_restored_a != fac_restored_b:
        diff_parts.append(
            f"Facility restoration: '{scenario_a_name}' restores {fac_restored_a} facility link(s) vs {fac_restored_b} under '{scenario_b_name}'"
        )

    if unreachable_a != unreachable_b:
        diff_parts.append(
            f"Unreachable route reduction: {unreachable_a} disconnected routes remain under Option A vs {unreachable_b} under Option B"
        )

    if not diff_parts:
        summary = (
            f"Both interventions deliver equivalent access improvements ({hh_regained_a} households reconnected). "
            f"Evaluation should proceed based on structural urgency, monsoon stability, and ground inspection."
        )
    else:
        summary = "; ".join(diff_parts) + "."

    return RepairComparisonResult(
        baseline_blocked_edges=currently_blocked_edge_ids,
        scenario_a=outcome_a,
        scenario_b=outcome_b,
        comparison_summary=summary,
        calculation_timestamp=datetime.now(timezone.utc).isoformat(),
    )


def simulate(network: dict[str, Any], failed_edge_id: str):
    """
    Backward-compatible wrapper for previous simulate(network, failed_edge_id) signature.
    """
    res = run_simulation(
        nodes=network.get("nodes", []),
        edges=network.get("edges", []),
        blocked_edge_ids=[failed_edge_id],
        failed_edge_id=failed_edge_id,
        facilities=network.get("facilities", []),
        settlements=network.get("settlements", []),
    )
    return res.model_dump()
