import json
from typing import Any, Union

import networkx as nx


class GraphValidationError(ValueError):
    """Raised when infrastructure data fails graph integrity checks."""


FACILITY_NODE_TYPES = {
    "school",
    "college",
    "health_post",
    "health",
    "hospital",
    "clinic",
    "water_point",
    "water",
    "facility",
}


def _as_dict(record: Union[dict, Any]) -> dict[str, Any]:
    return record if isinstance(record, dict) else record.model_dump()


def _positive_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _edge_length_meters(edge: dict[str, Any]) -> float | None:
    length = _positive_number(edge.get("length_meters"))
    if length is not None:
        return length
    distance = _positive_number(edge.get("distance"))
    return distance * 1000.0 if distance is not None else None


def _resolve_routing_metric(edges: list[dict[str, Any]], requested: str | None) -> tuple[str, str]:
    if not edges:
        raise GraphValidationError("Infrastructure network contains no edges.")

    for edge in edges:
        raw_minutes = edge.get("minutes") if edge.get("minutes") is not None else edge.get("travel_minutes")
        if raw_minutes is not None:
            try:
                numeric_minutes = float(raw_minutes)
            except (TypeError, ValueError):
                numeric_minutes = None
            if numeric_minutes is not None and numeric_minutes < 0:
                raise GraphValidationError(
                    f"Edge {edge.get('id')} has negative travel time: {raw_minutes}"
                )

    has_all_times = all(
        _positive_number(edge.get("minutes") if edge.get("minutes") is not None else edge.get("travel_minutes"))
        is not None
        for edge in edges
    )
    has_all_lengths = all(_edge_length_meters(edge) is not None for edge in edges)

    if requested == "travel_time_minutes" and not has_all_times:
        raise GraphValidationError("Travel-time routing was requested, but one or more edges have no positive travel time.")
    if requested == "distance_meters" and not has_all_lengths:
        raise GraphValidationError("Distance routing was requested, but one or more edges have no positive mapped length.")
    if requested not in (None, "travel_time_minutes", "distance_meters"):
        raise GraphValidationError(f"Unsupported routing metric: '{requested}'")

    if requested == "travel_time_minutes" or (requested is None and has_all_times):
        return "travel_time_minutes", "minutes"
    if requested == "distance_meters" or (requested is None and has_all_lengths):
        return "distance_meters", "meters"

    raise GraphValidationError(
        "Every edge must have a positive travel-time weight or every edge must have a positive mapped length."
    )


def _parse_geometry(value: Any) -> list[list[float]] | None:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError:
            return None
    if not isinstance(value, list) or len(value) < 2:
        return None
    if not all(isinstance(point, list) and len(point) >= 2 for point in value):
        return None
    try:
        return [[float(point[0]), float(point[1])] for point in value]
    except (TypeError, ValueError):
        return None


def build_network_graph(
    nodes: list[Union[dict, Any]],
    edges: list[Union[dict, Any]],
    facilities: list[Union[dict, Any]] | None = None,
    settlements: list[Union[dict, Any]] | None = None,
    routing_metric: str | None = None,
) -> tuple[nx.MultiGraph | nx.MultiDiGraph, dict[str, Any]]:
    """Build a validated graph without inventing missing distances or travel times."""
    if not nodes:
        raise GraphValidationError("Infrastructure network contains no nodes.")

    raw_edges = [_as_dict(edge) for edge in edges]
    uses_direction = any(bool(edge.get("is_one_way") or edge.get("oneway")) for edge in raw_edges)
    graph: nx.MultiGraph | nx.MultiDiGraph = nx.MultiDiGraph() if uses_direction else nx.MultiGraph()
    node_id_set: set[str] = set()
    nodes_by_key: dict[str, str] = {}

    for raw_node in nodes:
        node = _as_dict(raw_node)
        raw_id = node.get("id")
        if raw_id is None:
            raise GraphValidationError("Encountered node without an 'id' attribute.")

        canonical_id = str(raw_id)
        if canonical_id in node_id_set:
            raise GraphValidationError(f"Duplicate node identifier: {canonical_id}")

        node_id_set.add(canonical_id)
        nodes_by_key[canonical_id] = canonical_id
        if node.get("node_code"):
            nodes_by_key[str(node["node_code"])] = canonical_id

        node_type = str(node.get("node_type") or node.get("type") or "junction").lower()
        households = node.get("households")
        graph.add_node(
            canonical_id,
            raw_id=raw_id,
            name=node.get("name") or f"Node {canonical_id}",
            node_code=node.get("node_code"),
            type=node_type,
            latitude=node.get("latitude"),
            longitude=node.get("longitude"),
            households=int(households) if households is not None else None,
            population=node.get("population"),
            settlement_group_id=node.get("settlement_group_id"),
            description=node.get("description"),
            is_settlement=node_type == "settlement" or node.get("settlement_group_id") is not None,
            is_facility=node_type in FACILITY_NODE_TYPES,
            facility_type=node_type if node_type in FACILITY_NODE_TYPES else None,
        )

    for edge in raw_edges:
        edge_id = edge.get("id")
        source = edge.get("source") if edge.get("source") is not None else edge.get("from")
        target = edge.get("target") if edge.get("target") is not None else edge.get("to")
        if isinstance(source, dict):
            source = source.get("id")
        if isinstance(target, dict):
            target = target.get("id")
        source = source if source is not None else edge.get("source_node_id")
        target = target if target is not None else edge.get("target_node_id")
        if source is None or target is None:
            raise GraphValidationError(f"Edge {edge_id} missing source or target endpoint.")
        if nodes_by_key.get(str(source)) is None:
            raise GraphValidationError(f"Edge {edge_id} references nonexistent source node '{source}'")
        if nodes_by_key.get(str(target)) is None:
            raise GraphValidationError(f"Edge {edge_id} references nonexistent target node '{target}'")

    resolved_metric, weight_unit = _resolve_routing_metric(raw_edges, routing_metric)

    if settlements:
        for raw_settlement in settlements:
            settlement = _as_dict(raw_settlement)
            settlement_id = settlement.get("id")
            node_id = settlement.get("node_id")
            matched_node_id = str(node_id) if node_id is not None and str(node_id) in node_id_set else None
            if matched_node_id is None and settlement_id is not None:
                matched_node_id = next(
                    (
                        candidate_id
                        for candidate_id, data in graph.nodes(data=True)
                        if str(data.get("settlement_group_id")) == str(settlement_id)
                    ),
                    None,
                )

            if matched_node_id is not None:
                graph.nodes[matched_node_id]["is_settlement"] = True
                graph.nodes[matched_node_id]["settlement_name"] = settlement.get("name")
                graph.nodes[matched_node_id]["local_name"] = settlement.get("local_name")
                graph.nodes[matched_node_id]["households"] = settlement.get("households")
                graph.nodes[matched_node_id]["population"] = settlement.get("population")

    if facilities:
        for raw_facility in facilities:
            facility = _as_dict(raw_facility)
            node_id = facility.get("node_id")
            if node_id is None or str(node_id) not in node_id_set:
                continue
            matched_node_id = str(node_id)
            graph.nodes[matched_node_id]["is_facility"] = True
            graph.nodes[matched_node_id]["facility_name"] = facility.get("name")
            graph.nodes[matched_node_id]["facility_type"] = str(
                facility.get("facility_type") or facility.get("type") or "facility"
            ).lower()

    edge_by_id: dict[str, dict[str, Any]] = {}
    edges_info_list: list[dict[str, Any]] = []
    canonical_edge_ids: set[str] = set()

    for edge in raw_edges:
        raw_edge_id = edge.get("id")
        if raw_edge_id is None:
            raise GraphValidationError("Encountered edge without an 'id' attribute.")
        canonical_edge_id = str(raw_edge_id)
        if canonical_edge_id in canonical_edge_ids:
            raise GraphValidationError(f"Duplicate edge identifier: {canonical_edge_id}")
        canonical_edge_ids.add(canonical_edge_id)

        source_raw = edge.get("source") if edge.get("source") is not None else edge.get("from")
        target_raw = edge.get("target") if edge.get("target") is not None else edge.get("to")
        if isinstance(source_raw, dict):
            source_raw = source_raw.get("id")
        if isinstance(target_raw, dict):
            target_raw = target_raw.get("id")
        source_raw = source_raw if source_raw is not None else edge.get("source_node_id")
        target_raw = target_raw if target_raw is not None else edge.get("target_node_id")
        if source_raw is None or target_raw is None:
            raise GraphValidationError(f"Edge {canonical_edge_id} missing source or target endpoint.")

        source_id = nodes_by_key.get(str(source_raw))
        target_id = nodes_by_key.get(str(target_raw))
        if source_id is None:
            raise GraphValidationError(
                f"Edge {canonical_edge_id} references nonexistent source node '{source_raw}'"
            )
        if target_id is None:
            raise GraphValidationError(
                f"Edge {canonical_edge_id} references nonexistent target node '{target_raw}'"
            )
        if source_id == target_id:
            raise GraphValidationError(f"Edge {canonical_edge_id} is a self-loop and is not routable.")

        minutes = _positive_number(
            edge.get("minutes") if edge.get("minutes") is not None else edge.get("travel_minutes")
        )
        length_meters = _edge_length_meters(edge)
        weight = minutes if resolved_metric == "travel_time_minutes" else length_meters
        if weight is None:
            raise GraphValidationError(f"Edge {canonical_edge_id} has no usable {resolved_metric} weight.")

        edge_data = {
            "id": canonical_edge_id,
            "raw_id": raw_edge_id,
            "edge_code": edge.get("edge_code") or canonical_edge_id,
            "name": edge.get("name") or f"Edge {canonical_edge_id}",
            "type": edge.get("infrastructure_type") or edge.get("type") or "road",
            "surface_type": edge.get("surface_type"),
            "status": edge.get("status") or "operational",
            "source_id": source_id,
            "target_id": target_id,
            "minutes": minutes,
            "length_meters": length_meters,
            "weight": float(weight),
            "geometry": _parse_geometry(edge.get("geometry")),
            "is_critical": bool(edge.get("is_critical", False)),
            "is_one_way": bool(edge.get("is_one_way") or edge.get("oneway")),
            "notes": edge.get("notes"),
        }
        edge_by_id[canonical_edge_id] = edge_data
        if edge.get("edge_code"):
            edge_by_id[str(edge["edge_code"])] = edge_data
        edges_info_list.append(edge_data)

        attributes = {
            "edge_id": canonical_edge_id,
            "edge_code": edge_data["edge_code"],
            "name": edge_data["name"],
            "weight": float(weight),
            "minutes": minutes,
            "length_meters": length_meters,
            "type": edge_data["type"],
            "status": edge_data["status"],
            "geometry": edge_data["geometry"],
            "is_critical": edge_data["is_critical"],
        }
        graph.add_edge(source_id, target_id, key=canonical_edge_id, **attributes)
        if uses_direction and not edge_data["is_one_way"]:
            graph.add_edge(target_id, source_id, key=f"{canonical_edge_id}:reverse", **attributes)

    settlement_nodes = [
        {"id": node_id, **data}
        for node_id, data in graph.nodes(data=True)
        if data.get("is_settlement")
    ]
    facility_nodes = [
        {"id": node_id, **data}
        for node_id, data in graph.nodes(data=True)
        if data.get("is_facility")
    ]
    if not settlement_nodes:
        raise GraphValidationError("Infrastructure graph has no connected settlement access nodes.")
    if not facility_nodes:
        raise GraphValidationError("Infrastructure graph has no connected essential facility access nodes.")

    return graph, {
        "nodes_by_key": nodes_by_key,
        "edge_by_id": edge_by_id,
        "edges_info_list": edges_info_list,
        "settlement_nodes": settlement_nodes,
        "facility_nodes": facility_nodes,
        "routing_metric": resolved_metric,
        "weight_unit": weight_unit,
        "is_directed": uses_direction,
    }
