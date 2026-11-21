import networkx as nx


def simulate(network, failed_edge_id):
    graph = nx.Graph()
    for node in network['nodes']:
        graph.add_node(node['id'])
    edge_by_id = {}
    for edge in network['edges']:
        edge_by_id[edge['id']] = edge
        graph.add_edge(edge['from'], edge['to'], minutes=edge['minutes'])
    if failed_edge_id not in edge_by_id:
        raise ValueError('Unknown infrastructure edge')
    edge = edge_by_id[failed_edge_id]
    after = graph.copy()
    after.remove_edge(edge['from'], edge['to'])
    facilities = [n for n in network['nodes'] if n['type'] in ('school', 'health_post')]
    settlements = [n for n in network['nodes'] if n['type'] == 'settlement']
    results = []
    affected_households = 0
    for home in settlements:
        changed = False
        for facility in facilities:
            def travel(g):
                try:
                    return nx.shortest_path_length(g, home['id'], facility['id'], weight='minutes')
                except nx.NetworkXNoPath:
                    return None
            baseline, disruption = travel(graph), travel(after)
            if baseline is None:
                continue
            if disruption is None or disruption > baseline:
                changed = True
            results.append({'settlement': home['name'], 'facility': facility['name'],
                            'before_minutes': baseline, 'after_minutes': disruption,
                            'status': ('unreachable' if disruption is None else 'detour' if disruption > baseline else 'unchanged')})
        if changed:
            affected_households += home.get('households', 0)
    return {'failed_edge_id': failed_edge_id, 'affected_households': affected_households,
            'access_comparisons': results, 'data_quality': 'fictional_demo'}
