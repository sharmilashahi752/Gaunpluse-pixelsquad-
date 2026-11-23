import pytest
from fastapi.testclient import TestClient

from graph_builder import build_network_graph, GraphValidationError
from simulator import run_simulation, compare_repairs
from main import app

client = TestClient(app)


# -------------------------------------------------------------
# Demonstration Fixtures Representing Rural Nepal Topologies
# -------------------------------------------------------------

@pytest.fixture
def base_village_network():
    """
    Standard test network:
    Settlement A (35 HH) --[road_1, 5 min]--> Junction
    Junction --[bridge_b, 8 min]--> Settlement B (20 HH)
    Junction --[school_road, 6 min]--> School
    Junction --[health_road, 7 min]--> Health Post
    Settlement A --[detour_ab, 47 min]--> Settlement B
    """
    nodes = [
        {"id": "a", "name": "Settlement A", "type": "settlement", "households": 35},
        {"id": "b", "name": "Settlement B", "type": "settlement", "households": 20},
        {"id": "j", "name": "Central Junction", "type": "junction"},
        {"id": "school", "name": "Janahit School", "type": "school"},
        {"id": "health", "name": "Health Post", "type": "health_post"},
    ]
    edges = [
        {"id": "road_1", "name": "Road A", "source": "a", "target": "j", "minutes": 5.0},
        {"id": "bridge_b", "name": "Bridge B", "source": "j", "target": "b", "minutes": 8.0},
        {"id": "road_school", "name": "School Link", "source": "j", "target": "school", "minutes": 6.0},
        {"id": "road_health", "name": "Health Link", "source": "j", "target": "health", "minutes": 7.0},
        {"id": "detour_ab", "name": "Mountain Detour Trail", "source": "a", "target": "b", "minutes": 47.0},
    ]
    return {"nodes": nodes, "edges": edges}


# -------------------------------------------------------------
# Graph Creation & Validation Tests
# -------------------------------------------------------------

def test_graph_creation_valid(base_village_network):
    graph, meta = build_network_graph(base_village_network["nodes"], base_village_network["edges"])
    assert len(graph.nodes) == 5
    assert len(graph.edges) == 5
    assert len(meta["settlement_nodes"]) == 2
    assert len(meta["facility_nodes"]) == 2


def test_validation_duplicate_node_id():
    nodes = [
        {"id": "node_1", "name": "First"},
        {"id": "node_1", "name": "Second"},
    ]
    edges = []
    with pytest.raises(GraphValidationError, match="Duplicate node identifier"):
        build_network_graph(nodes, edges)


def test_validation_missing_edge_endpoints():
    nodes = [{"id": "node_1", "name": "First"}]
    edges = [{"id": "edge_1", "source": "node_1", "target": "nonexistent"}]
    with pytest.raises(GraphValidationError, match="nonexistent target node"):
        build_network_graph(nodes, edges)


def test_validation_negative_travel_time():
    nodes = [{"id": "1"}, {"id": "2"}]
    edges = [{"id": "e1", "source": "1", "target": "2", "minutes": -10}]
    with pytest.raises(GraphValidationError, match="negative travel time"):
        build_network_graph(nodes, edges)


def test_invalid_edge_identifier(base_village_network):
    with pytest.raises(GraphValidationError, match="Unknown infrastructure edge identifier"):
        run_simulation(
            nodes=base_village_network["nodes"],
            edges=base_village_network["edges"],
            blocked_edge_ids=["nonexistent_edge"],
        )


# -------------------------------------------------------------
# Scenario Tests
# -------------------------------------------------------------

def test_scenario_a_complete_isolation():
    """
    Scenario A: Bridge failure completely isolates a settlement (no alternative route).
    """
    nodes = [
        {"id": "isolated_settlement", "name": "Isolated Tol", "type": "settlement", "households": 25},
        {"id": "main_village", "name": "Main Village", "type": "junction"},
        {"id": "health", "name": "Health Post", "type": "health_post"},
    ]
    # Single bridge connects isolated_settlement to the rest of the world
    edges = [
        {"id": "only_bridge", "name": "Sole Suspension Bridge", "source": "isolated_settlement", "target": "main_village", "minutes": 10},
        {"id": "clinic_path", "name": "Clinic Road", "source": "main_village", "target": "health", "minutes": 5},
    ]

    res = run_simulation(nodes=nodes, edges=edges, blocked_edge_ids=["only_bridge"])

    assert res.affected_households == 25
    assert res.newly_disconnected_households == 25
    assert len(res.isolated_settlements) == 1
    assert res.isolated_settlements[0]["settlement"] == "Isolated Tol"
    assert res.access_comparisons[0].status == "unreachable"
    assert res.access_comparisons[0].after_minutes is None


def test_scenario_b_detour_remaining(base_village_network):
    """
    Scenario B: Bridge failure where a longer alternative detour remains.
    Settlement B baseline to school: b -> j -> school = 8 + 6 = 14 min.
    After bridge_b fails: b -> a (47 min) -> j (5 min) -> school (6 min) = 58 min.
    Status must be 'detour', NOT disconnected!
    """
    res = run_simulation(
        nodes=base_village_network["nodes"],
        edges=base_village_network["edges"],
        blocked_edge_ids=["bridge_b"],
    )

    # Settlement B is affected (20 HH) because journeys lengthened
    # Settlement A (35 HH) is unchanged (a -> j -> school = 11 min)
    assert res.affected_households == 20
    assert res.newly_disconnected_households == 0  # not totally disconnected!
    assert len(res.detour_settlements) == 1
    assert res.detour_settlements[0]["settlement"] == "Settlement B"

    # Find comparison for Settlement B to School
    school_comp = next(
        c for c in res.access_comparisons
        if c.settlement == "Settlement B" and c.facility == "Janahit School"
    )
    assert school_comp.status == "detour"
    assert school_comp.before_minutes == 14.0
    assert school_comp.after_minutes == 58.0
    assert school_comp.travel_time_change == 44.0
    assert school_comp.alternative_path is not None


def test_scenario_c_redundant_route_no_impact():
    """
    Scenario C: Road failure does not degrade access because parallel route exists with equal or negligible time.
    """
    nodes = [
        {"id": "s1", "name": "Settlement 1", "type": "settlement", "households": 40},
        {"id": "j1", "name": "Junction", "type": "junction"},
        {"id": "health", "name": "Health Post", "type": "health_post"},
    ]
    edges = [
        {"id": "road_primary", "source": "s1", "target": "j1", "minutes": 10},
        {"id": "road_parallel", "source": "s1", "target": "j1", "minutes": 10},
        {"id": "road_health", "source": "j1", "target": "health", "minutes": 5},
    ]

    res = run_simulation(nodes=nodes, edges=edges, blocked_edge_ids=["road_primary"])

    # Path s1 -> j1 -> health is still 15 min via road_parallel
    assert res.affected_households == 0
    assert len(res.isolated_settlements) == 0
    assert len(res.detour_settlements) == 0
    assert res.access_comparisons[0].status == "unchanged"


def test_scenario_d_already_disconnected_settlement():
    """
    Scenario D: Settlement was already disconnected before the simulation.
    Must distinguish already disconnected from newly disconnected!
    """
    nodes = [
        {"id": "remote_settlement", "name": "Remote Tol", "type": "settlement", "households": 15},
        {"id": "connected_settlement", "name": "Connected Tol", "type": "settlement", "households": 30},
        {"id": "junction", "name": "Junction", "type": "junction"},
        {"id": "health", "name": "Health Post", "type": "health_post"},
    ]
    # remote_settlement has NO edges to the rest of the network at baseline
    edges = [
        {"id": "conn_road", "source": "connected_settlement", "target": "junction", "minutes": 10},
        {"id": "health_road", "source": "junction", "target": "health", "minutes": 5},
    ]

    res = run_simulation(nodes=nodes, edges=edges, blocked_edge_ids=["conn_road"])

    # Remote Tol was already disconnected
    assert res.already_disconnected_households == 15
    # Connected Tol is newly disconnected
    assert res.newly_disconnected_households == 30
    assert res.affected_households == 30

    remote_comp = next(c for c in res.access_comparisons if c.settlement == "Remote Tol")
    assert remote_comp.status == "already_disconnected"


def test_no_double_counting_households():
    """
    A settlement has 2 facilities (school and health post). Both paths fail.
    The settlement's 50 households must only be counted ONCE.
    """
    nodes = [
        {"id": "home", "name": "Home Hamlet", "type": "settlement", "households": 50},
        {"id": "j", "name": "Junction", "type": "junction"},
        {"id": "school", "name": "School", "type": "school"},
        {"id": "health", "name": "Health", "type": "health_post"},
    ]
    edges = [
        {"id": "main_bridge", "source": "home", "target": "j", "minutes": 5},
        {"id": "s_road", "source": "j", "target": "school", "minutes": 5},
        {"id": "h_road", "source": "j", "target": "health", "minutes": 5},
    ]

    res = run_simulation(nodes=nodes, edges=edges, blocked_edge_ids=["main_bridge"])
    assert res.affected_households == 50  # NOT 100!
    assert res.newly_disconnected_households == 50


# -------------------------------------------------------------
# Repair Comparison Tests ("What If We Fix This First?")
# -------------------------------------------------------------

def test_compare_repairs():
    nodes = [
        {"id": "s_a", "name": "Settlement A", "type": "settlement", "households": 50},
        {"id": "s_b", "name": "Settlement B", "type": "settlement", "households": 20},
        {"id": "j", "name": "Junction", "type": "junction"},
        {"id": "health", "name": "Health Post", "type": "health_post"},
    ]
    edges = [
        {"id": "road_a", "source": "s_a", "target": "j", "minutes": 10},
        {"id": "bridge_b", "source": "s_b", "target": "j", "minutes": 5},
        {"id": "h_road", "source": "j", "target": "health", "minutes": 5},
    ]

    # Both road_a and bridge_b are currently blocked
    comparison = compare_repairs(
        nodes=nodes,
        edges=edges,
        currently_blocked_edge_ids=["road_a", "bridge_b"],
        scenario_a_name="Fix Road A First",
        scenario_a_repair_ids=["road_a"],
        scenario_b_name="Fix Bridge B First",
        scenario_b_repair_ids=["bridge_b"],
    )

    # Fixing Road A reconnects Settlement A (50 HH)
    assert comparison.scenario_a.households_regaining_access == 50
    # Fixing Bridge B reconnects Settlement B (20 HH)
    assert comparison.scenario_b.households_regaining_access == 20
    assert "restores access for 30 more households" in comparison.comparison_summary
    assert "unknown" in comparison.cost_status


# -------------------------------------------------------------
# FastAPI Endpoint Integration Tests
# -------------------------------------------------------------

def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["engine"] == "networkx"


def test_api_simulate_endpoint(base_village_network):
    payload = {
        "nodes": base_village_network["nodes"],
        "edges": base_village_network["edges"],
        "blocked_edge_ids": ["bridge_b"],
    }
    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["affected_households"] == 20
    assert data["blocked_edge_ids"] == ["bridge_b"]
    assert len(data["access_comparisons"]) > 0


def test_api_compare_repairs_endpoint(base_village_network):
    payload = {
        "nodes": base_village_network["nodes"],
        "edges": base_village_network["edges"],
        "currently_blocked_edge_ids": ["bridge_b", "road_1"],
        "scenario_a": {"name": "Option A - Bridge", "repair_edge_ids": ["bridge_b"]},
        "scenario_b": {"name": "Option B - Road", "repair_edge_ids": ["road_1"]},
    }
    response = client.post("/compare-repairs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "scenario_a" in data
    assert "scenario_b" in data
    assert "comparison_summary" in data


def test_graph_caching_with_graph_version(base_village_network):
    from simulator import _GRAPH_CACHE, clear_graph_cache
    clear_graph_cache()
    version = "test-version-v1"

    res1 = run_simulation(
        nodes=base_village_network["nodes"],
        edges=base_village_network["edges"],
        blocked_edge_ids=["bridge_b"],
        graph_version=version,
    )
    cache_key = f"{version}:travel_time_minutes"
    assert cache_key in _GRAPH_CACHE

    res2 = run_simulation(
        nodes=base_village_network["nodes"],
        edges=base_village_network["edges"],
        blocked_edge_ids=["bridge_b"],
        graph_version=version,
    )
    assert res1.affected_households == res2.affected_households == 20
    assert len(res1.access_comparisons) == len(res2.access_comparisons)
