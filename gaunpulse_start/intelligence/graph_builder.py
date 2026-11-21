from typing import Any, Union
import networkx as nx


class GraphValidationError(ValueError):
    """Raised when infrastructure data fails graph integrity checks."""
    pass


def build_network_graph(
    nodes: list[Union[dict, Any]],
    edges: list[Union[dict, Any]],
    facilities: list[Union[dict, Any]] = None,
    settlements: list[Union[dict, Any]] = None,
) -> tuple[nx.Graph, dict[str, Any]]:
    """
    Constructs a validated NetworkX undirected graph from infrastructure records.
    Returns (nx.Graph, metadata_dict).
    """
    if not nodes:
        raise GraphValidationError("Infrastructure network contains no nodes.")

    graph = nx.MultiGraph()
    node_id_set = set()
    nodes_by_key = {}  # Map int/str ID and code to canonical node_id

    # 1. Process and validate nodes
    for raw_node in nodes:
        node = raw_node if isinstance(raw_node, dict) else raw_node.model_dump()
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

        # Determine node type & households
        node_type = (node.get("type") or node.get("node_type") or "junction").lower()
        households = node.get("households") or 0
        population = node.get("population") or 0

        graph.add_node(
            canonical_id,
            raw_id=raw_id,
            name=node.get("name") or f"Node {canonical_id}",
            node_code=node.get("node_code"),
            type=node_type,
            latitude=node.get("latitude"),
            longitude=node.get("longitude"),
            households=households,
            population=population,
            settlement_group_id=node.get("settlement_group_id"),
            description=node.get("description"),
            is_settlement=(node_type == "settlement" or households > 0),
            is_facility=(node_type in ("school", "health_post", "facility", "water_point")),
            facility_type=node_type if node_type in ("school", "health_post", "water_point") else None,
        )

    # 2. Attach external settlement groups if provided
    if settlements:
        for raw_s in settlements:
            s = raw_s if isinstance(raw_s, dict) else raw_s.model_dump()
            s_id = s.get("id")
            s_node_id = s.get("node_id")
            matched_node_id = None

            if s_node_id is not None and str(s_node_id) in node_id_set:
                matched_node_id = str(s_node_id)
            else:
                # Find by settlement_group_id on node
                for n_id, n_data in graph.nodes(data=True):
                    if n_data.get("settlement_group_id") == s_id:
                        matched_node_id = n_id
                        break
                if not matched_node_id:
                    # Match by name / substring
                    for n_id, n_data in graph.nodes(data=True):
                        if s.get("name") and s["name"].lower() in n_data.get("name", "").lower():
                            matched_node_id = n_id
                            break

            if matched_node_id:
                graph.nodes[matched_node_id]["is_settlement"] = True
                graph.nodes[matched_node_id]["settlement_name"] = s.get("name")
                graph.nodes[matched_node_id]["local_name"] = s.get("local_name")
                if s.get("households"):
                    graph.nodes[matched_node_id]["households"] = s["households"]
                if s.get("population"):
                    graph.nodes[matched_node_id]["population"] = s["population"]

    # 3. Attach external facilities if provided
    if facilities:
        for raw_f in facilities:
            f = raw_f if isinstance(raw_f, dict) else raw_f.model_dump()
            f_node_id = f.get("node_id")
            matched_node_id = None

            if f_node_id is not None and str(f_node_id) in node_id_set:
                matched_node_id = str(f_node_id)
            else:
                # Find matching facility node by type/name
                for n_id, n_data in graph.nodes(data=True):
                    if n_data.get("node_code") == f.get("facility_type") or n_data.get("type") == "facility":
                        matched_node_id = n_id
                        break

            if matched_node_id:
                graph.nodes[matched_node_id]["is_facility"] = True
                graph.nodes[matched_node_id]["facility_name"] = f.get("name")
                f_type = (f.get("facility_type") or f.get("type") or "facility").lower()
                graph.nodes[matched_node_id]["facility_type"] = f_type

    # 4. Process and validate edges
    edge_by_id = {}
    edges_info_list = []

    for raw_edge in edges:
        edge = raw_edge if isinstance(raw_edge, dict) else raw_edge.model_dump()
        raw_edge_id = edge.get("id")
        if raw_edge_id is None:
            raise GraphValidationError("Encountered edge without an 'id' attribute.")

        canonical_edge_id = str(raw_edge_id)
        source_raw = edge.get("source") if edge.get("source") is not None else edge.get("from")
        if isinstance(source_raw, dict):
            source_raw = source_raw.get("id")
        if source_raw is None:
            source_raw = edge.get("source_node_id")

        target_raw = edge.get("target") if edge.get("target") is not None else edge.get("to")
        if isinstance(target_raw, dict):
            target_raw = target_raw.get("id")
        if target_raw is None:
            target_raw = edge.get("target_node_id")

        if source_raw is None or target_raw is None:
            raise GraphValidationError(f"Edge {canonical_edge_id} missing source or target endpoint.")

        # Resolve to canonical node ID
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
            # Self-loops in infrastructure
            continue

        # Calculate travel time in minutes
        minutes = edge.get("minutes") if edge.get("minutes") is not None else edge.get("travel_minutes")
        if minutes is not None:
            try:
                minutes = float(minutes)
            except (ValueError, TypeError):
                minutes = None

        if minutes is not None and minutes < 0:
            raise GraphValidationError(f"Edge {canonical_edge_id} has negative travel time: {minutes}")

        if minutes is None or minutes <= 0:
            # Estimate from length or distance
            length_m = edge.get("length_meters")
            distance = edge.get("distance")
            if length_m is not None and float(length_m) > 0:
                meters = float(length_m)
            elif distance is not None and float(distance) > 0:
                # distance in km
                dist_val = float(distance)
                meters = dist_val * 1000.0 if dist_val < 50 else dist_val
            else:
                meters = 500.0  # reasonable default rural link length

            # Rural mountain walking speed ~ 60 meters / minute (~3.6 km/h)
            infra_type = str(edge.get("type") or edge.get("infrastructure_type") or "road").lower()
            speed_mpm = 50.0 if "trail" in infra_type or "footpath" in infra_type else 65.0
            minutes = round(max(1.0, meters / speed_mpm), 1)

        edge_data = {
            "id": canonical_edge_id,
            "raw_id": raw_edge_id,
            "edge_code": edge.get("edge_code") or canonical_edge_id,
            "name": edge.get("name") or f"Edge {canonical_edge_id}",
            "type": edge.get("type") or edge.get("infrastructure_type") or "road",
            "surface_type": edge.get("surface_type") or "gravel",
            "status": edge.get("status") or "operational",
            "source_id": source_id,
            "target_id": target_id,
            "minutes": float(minutes),
            "length_meters": edge.get("length_meters"),
            "is_critical": bool(edge.get("is_critical", False)),
            "notes": edge.get("notes"),
        }

        # Store in mapping
        edge_by_id[canonical_edge_id] = edge_data
        if edge.get("edge_code"):
            edge_by_id[str(edge["edge_code"])] = edge_data

        edges_info_list.append(edge_data)

        # Add to NetworkX MultiGraph with unique edge_id key
        graph.add_edge(
            source_id,
            target_id,
            key=canonical_edge_id,
            edge_id=canonical_edge_id,
            edge_code=edge.get("edge_code") or canonical_edge_id,
            name=edge_data["name"],
            minutes=float(minutes),
            type=edge_data["type"],
            status=edge_data["status"],
            is_critical=edge_data["is_critical"],
        )

    # Compile settlements and facilities metadata
    settlement_nodes = [
        {"id": n_id, **data}
        for n_id, data in graph.nodes(data=True)
        if data.get("is_settlement") or data.get("type") == "settlement"
    ]

    facility_nodes = [
        {"id": n_id, **data}
        for n_id, data in graph.nodes(data=True)
        if data.get("is_facility") or data.get("type") in ("school", "health_post", "water_point", "facility")
    ]

    metadata = {
        "nodes_by_key": nodes_by_key,
        "edge_by_id": edge_by_id,
        "edges_info_list": edges_info_list,
        "settlement_nodes": settlement_nodes,
        "facility_nodes": facility_nodes,
    }

    return graph, metadata
