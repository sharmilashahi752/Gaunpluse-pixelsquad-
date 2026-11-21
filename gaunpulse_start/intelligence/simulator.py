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


def _resolve_edge_infos(edge_ids, edge_by_id, label="infrastructure edge"):
    canonical_ids = set()
    edge_infos = []
    for edge_id in edge_ids:
        edge_key = str(edge_id)
        edge_info = edge_by_id.get(edge_key)
        if edge_info is None:
            edge_info = next(
                (
                    info
                    for info in edge_by_id.values()
                    if str(info.get("edge_code")) == edge_key or str(info.get("raw_id")) == edge_key
                ),
                None,
            )
        if edge_info is None:
            raise GraphValidationError(f"Unknown {label} identifier: '{edge_id}'")
        canonical_ids.add(edge_info["id"])
        if edge_info not in edge_infos:
            edge_infos.append(edge_info)
    return canonical_ids, edge_infos


def _remove_edges(graph, edge_infos):
    target_ids = {str(info["id"]) for info in edge_infos}
    matches = [
        (source, target, key)
        for source, target, key, data in graph.edges(keys=True, data=True)
        if str(data.get("edge_id")) in target_ids
    ]
    for source, target, key in matches:
        if graph.has_edge(source, target, key=key):
            graph.remove_edge(source, target, key=key)


def _path_edge_ids(graph, path):
    if not path or len(path) < 2:
        return []
    edge_ids = []
    for source, target in zip(path, path[1:]):
        candidates = graph.get_edge_data(source, target) or {}
        if not candidates:
            continue
        selected = min(candidates.values(), key=lambda data: float(data.get("weight", float("inf"))))
        edge_ids.append(selected.get("edge_id"))
    return edge_ids


def run_simulation(
    nodes: list[Union[dict, Any]],
    edges: list[Union[dict, Any]],
    blocked_edge_ids: list[Union[int, str]],
    facilities: list[Union[dict, Any]] = None,
    settlements: list[Union[dict, Any]] = None,
    failed_edge_id: Union[int, str] = None,
    baseline_blocked_edge_ids: list[Union[int, str]] = None,
    routing_metric: str = None,
    data_quality: str = "unverified",
    graph_version: str = None,
) -> SimulationResult:
    """
    Simulates the infrastructure impact of blocking one or more edges.
    Calculates baseline shortest paths, isolates failed connections on a graph copy,
    and analyzes accessibility changes, isolated settlements, and affected households.
    """
    # 1. Build original graph & metadata
    graph, meta = build_network_graph(nodes, edges, facilities, settlements, routing_metric)
    edge_by_id = meta["edge_by_id"]
    settlement_nodes = meta["settlement_nodes"]
    facility_nodes = meta["facility_nodes"]

    canonical_blocked_ids, blocked_edges_info = _resolve_edge_infos(blocked_edge_ids, edge_by_id)
    canonical_baseline_ids, baseline_edges_info = _resolve_edge_infos(
        baseline_blocked_edge_ids or [], edge_by_id, "baseline blocked edge"
    )
    already_blocked_ids = canonical_blocked_ids.intersection(canonical_baseline_ids)

    baseline_graph = graph.copy()
    _remove_edges(baseline_graph, baseline_edges_info)

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
                dist = nx.shortest_path_length(baseline_graph, s_id, f_id, weight="weight")
                path = nx.shortest_path(baseline_graph, s_id, f_id, weight="weight")
                baseline_routes[(s_id, f_id)] = (round(dist, 1), path)
            except nx.NetworkXNoPath:
                baseline_routes[(s_id, f_id)] = (None, None)
                already_disconnected_pairs.add((s_id, f_id))

    # 3. Create Disrupted Graph Copy
    disrupted_graph = baseline_graph.copy()
    _remove_edges(disrupted_graph, blocked_edges_info)

    # 4. Compute Post-Disruption Routes & Evaluate Impact
    access_comparisons = []
    settlement_status_tracker = {}
    facility_impact_tracker = set()

    for s_node in settlement_nodes:
        s_id = s_node["id"]
        s_name = s_node.get("settlement_name") or s_node.get("name")
        s_hh = s_node.get("households")

        settlement_status_tracker[s_id] = {
            "name": s_name,
            "households": s_hh,
            "households_known": s_hh is not None,
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
                post_dist = nx.shortest_path_length(disrupted_graph, s_id, f_id, weight="weight")
                post_path = nx.shortest_path(disrupted_graph, s_id, f_id, weight="weight")
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
            readable_base_path = [baseline_graph.nodes[nid].get("name", nid) for nid in base_path] if base_path else []
            readable_post_path = [disrupted_graph.nodes[nid].get("name", nid) for nid in post_path] if post_path else None
            baseline_edge_ids = _path_edge_ids(baseline_graph, base_path)
            alternative_edge_ids = _path_edge_ids(disrupted_graph, post_path)
            is_time_metric = meta["routing_metric"] == "travel_time_minutes"

            access_comparisons.append(
                AccessComparison(
                    settlement=s_name,
                    settlement_id=s_id,
                    facility=f_name,
                    facility_id=f_id,
                    facility_type=f_type,
                    before_minutes=base_dist if is_time_metric else None,
                    after_minutes=post_dist if is_time_metric else None,
                    before_distance_meters=base_dist if not is_time_metric else None,
                    after_distance_meters=post_dist if not is_time_metric else None,
                    before_value=base_dist,
                    after_value=post_dist,
                    routing_metric=meta["routing_metric"],
                    unit=meta["weight_unit"],
                    travel_time_change=change if is_time_metric else None,
                    status=status,
                    baseline_path=readable_base_path,
                    alternative_path=readable_post_path,
                    baseline_edge_ids=baseline_edge_ids,
                    alternative_edge_ids=alternative_edge_ids,
                )
            )

    # 5. Aggregate Household Impacts Without Double-Counting
    total_affected_hh = 0
    newly_disconnected_hh = 0
    already_disconnected_hh = 0
    isolated_settlements = []
    detour_settlements = []
    affected_unknown_households = 0

    for s_id, s_info in settlement_status_tracker.items():
        hh = s_info["households"]
        household_value = int(hh) if hh is not None else 0
        # If all facilities were already unreachable before simulation
        if s_info["total_facilities"] > 0 and all(
            (s_id, f["id"]) in already_disconnected_pairs for f in facility_nodes if f["id"] != s_id
        ):
            already_disconnected_hh += household_value
            continue

        if s_info["all_unreachable"] and s_info["has_unreachable"]:
            # Completely isolated settlement
            newly_disconnected_hh += household_value
            total_affected_hh += household_value
            affected_unknown_households += int(hh is None)
            isolated_settlements.append({
                "settlement": s_info["name"],
                "settlement_id": s_id,
                "households": hh,
                "reason": "Complete isolation: no accessible path remaining to any essential facility.",
            })
        elif s_info["has_unreachable"]:
            # Lost access to one or more essential facilities
            newly_disconnected_hh += household_value
            total_affected_hh += household_value
            affected_unknown_households += int(hh is None)
            isolated_settlements.append({
                "settlement": s_info["name"],
                "settlement_id": s_id,
                "households": hh,
                "reason": f"Cut off from {len(s_info['lost_facilities'])} facility(ies): {', '.join(s_info['lost_facilities'])}.",
            })
        elif s_info["has_detour"]:
            # Retains access via longer route
            total_affected_hh += household_value
            affected_unknown_households += int(hh is None)
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
        if affected_unknown_households:
            parts.append(
                f"Household totals are incomplete because {affected_unknown_households} affected settlement(s) have no verified household estimate"
            )
        else:
            parts.append(f"A total of {total_affected_hh} unique households are impacted across the village network.")
        summary = f"Simulated failure of {blocked_str}: " + "; ".join(parts) + "."

    return SimulationResult(
        failed_edge_id=failed_edge_id or (list(canonical_blocked_ids)[0] if canonical_blocked_ids else None),
        blocked_edge_ids=list(canonical_blocked_ids),
        baseline_blocked_edge_ids=list(canonical_baseline_ids),
        already_blocked_edge_ids=list(already_blocked_ids),
        blocked_edges_info=blocked_edges_info,
        affected_households=total_affected_hh,
        household_estimate_complete=affected_unknown_households == 0,
        affected_settlements_with_unknown_households=affected_unknown_households,
        newly_disconnected_households=newly_disconnected_hh,
        already_disconnected_households=already_disconnected_hh,
        isolated_settlements=isolated_settlements,
        detour_settlements=detour_settlements,
        essential_facilities_affected=[{"facility": f} for f in sorted(facility_impact_tracker)],
        access_comparisons=access_comparisons,
        summary_explanation=summary,
        data_quality=data_quality,
        graph_version=graph_version,
        routing_metric=meta["routing_metric"],
        unit=meta["weight_unit"],
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
    routing_metric: str = None,
    data_quality: str = "unverified",
    graph_version: str = None,
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
        routing_metric=routing_metric,
        data_quality=data_quality,
        graph_version=graph_version,
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
        routing_metric=routing_metric,
        data_quality=data_quality,
        graph_version=graph_version,
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
        routing_metric=routing_metric,
        data_quality=data_quality,
        graph_version=graph_version,
    )

    # Calculate improvements
    # Households regaining access = reduction in affected households
    hh_regained_a = max(0, sim_baseline.affected_households - sim_a.affected_households)
    hh_regained_b = max(0, sim_baseline.affected_households - sim_b.affected_households)

    # Facilities restored = reduction in affected facilities
    fac_restored_a = max(0, len(sim_baseline.essential_facilities_affected) - len(sim_a.essential_facilities_affected))
    fac_restored_b = max(0, len(sim_baseline.essential_facilities_affected) - len(sim_b.essential_facilities_affected))

    # Travel time improvement (sum of minutes saved across all detour routes)
    def calc_route_improvement(base_sim, repair_sim):
        savings = 0.0
        restored_routes = 0
        base_map = {(c.settlement, c.facility): c for c in base_sim.access_comparisons}
        for c in repair_sim.access_comparisons:
            key = (c.settlement, c.facility)
            if key in base_map:
                prev = base_map[key]
                if prev.after_value is not None and c.after_value is not None:
                    savings += max(0.0, prev.after_value - c.after_value)
                elif prev.status == "unreachable" and c.status in ("unchanged", "detour"):
                    restored_routes += 1
        return round(savings, 1), restored_routes

    improvement_a, restored_routes_a = calc_route_improvement(sim_baseline, sim_a)
    improvement_b, restored_routes_b = calc_route_improvement(sim_baseline, sim_b)
    is_time_metric = sim_baseline.routing_metric == "travel_time_minutes"

    unreachable_a = sum(1 for c in sim_a.access_comparisons if c.status == "unreachable")
    unreachable_b = sum(1 for c in sim_b.access_comparisons if c.status == "unreachable")

    outcome_a = RepairScenarioOutcome(
        scenario_name=scenario_a_name,
        repaired_edge_ids=scenario_a_repair_ids,
        households_regaining_access=hh_regained_a,
        facilities_restored=fac_restored_a,
        travel_time_improvement_minutes=improvement_a if is_time_metric else 0.0,
        route_improvement_value=improvement_a,
        route_improvement_unit=sim_baseline.unit,
        restored_routes_count=restored_routes_a,
        remaining_blocked_edges=remaining_blocked_a,
        remaining_affected_households=sim_a.affected_households,
        unreachable_routes_count=unreachable_a,
    )

    outcome_b = RepairScenarioOutcome(
        scenario_name=scenario_b_name,
        repaired_edge_ids=scenario_b_repair_ids,
        households_regaining_access=hh_regained_b,
        facilities_restored=fac_restored_b,
        travel_time_improvement_minutes=improvement_b if is_time_metric else 0.0,
        route_improvement_value=improvement_b,
        route_improvement_unit=sim_baseline.unit,
        restored_routes_count=restored_routes_b,
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
