import networkx as nx
import numpy as np
from geometry import find_all_intersections

def build_network_graph(wires, wire_endpoints_arr, domain_size,
                         left_margin=0.0, right_margin=0.0):
    """
    Build a graph where nodes = wires (each wire is one node, per our
    Phase 1 decision: wire-as-single-resistor). Two wire-nodes are
    connected by an edge if they physically cross.

    Also adds two virtual electrode nodes: 'ELECTRODE_LEFT' and
    'ELECTRODE_RIGHT'. Any wire touching the left/right boundary strip
    connects to the corresponding electrode.

    Returns: networkx.Graph
    """
    G = nx.Graph()
    n = len(wires)
    G.add_nodes_from(range(n))

    intersections = find_all_intersections(wire_endpoints_arr)
    for i, j, x, y in intersections:
        G.add_edge(i, j, kind="junction", x=x, y=y)

    G.add_node("ELECTRODE_LEFT")
    G.add_node("ELECTRODE_RIGHT")

    left_bound = left_margin
    right_bound = domain_size - right_margin

    for idx in range(n):
        x1, y1, x2, y2 = wire_endpoints_arr[idx]
        wire_min_x = min(x1, x2)
        wire_max_x = max(x1, x2)
        if wire_min_x <= left_bound:
            G.add_edge("ELECTRODE_LEFT", idx, kind="electrode")
        if wire_max_x >= right_bound:
            G.add_edge("ELECTRODE_RIGHT", idx, kind="electrode")

    return G


def has_spanning_cluster(G):
    """
    Check whether ELECTRODE_LEFT and ELECTRODE_RIGHT are connected —
    i.e. a percolating path exists across the film.
    """
    if "ELECTRODE_LEFT" not in G or "ELECTRODE_RIGHT" not in G:
        return False
    return nx.has_path(G, "ELECTRODE_LEFT", "ELECTRODE_RIGHT")


def network_stats(G):
    """Basic graph-level features, useful later as surrogate model inputs."""
    n_nodes = G.number_of_nodes()
    n_edges = G.number_of_edges()
    components = list(nx.connected_components(G))
    largest_cc_size = max(len(c) for c in components) if components else 0
    degrees = [d for _, d in G.degree()]
    avg_degree = np.mean(degrees) if degrees else 0.0

    return {
        "n_nodes": n_nodes,
        "n_edges": n_edges,
        "n_components": len(components),
        "largest_component_size": largest_cc_size,
        "avg_degree": avg_degree,
        "percolates": has_spanning_cluster(G),
    }