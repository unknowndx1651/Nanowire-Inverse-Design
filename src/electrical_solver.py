import numpy as np
import networkx as nx
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve


def assign_edge_resistances(G, wires, wire_resistivity=1.0, junction_resistance=100.0):
    """
    Assign a resistance value to every edge in the graph.

    - 'junction' edges (wire-wire crossings): fixed junction_resistance.
    - 'electrode' edges (wire touching an electrode busbar): treated as
      near-zero contact resistance (good ohmic contact assumption).

    Wire body resistance itself is folded into junction edges by giving
    each wire-node an effective self-resistance proportional to its length
    and inversely proportional to cross-sectional area (diameter^2). Since
    our nodes are wires (not points), we approximate this by inflating the
    junction resistance for junctions involving long/thin wires.
    Simpler first-pass model: use a uniform per-wire resistance contribution
    folded additively into each junction edge touching that wire.
    """
    R_wire = {}
    for idx in range(len(wires)):
        length = wires[idx, 3]
        diameter = wires[idx, 4]
        # resistance ~ resistivity * length / cross_sectional_area
        R_wire[idx] = wire_resistivity * length / (diameter ** 2)

    for u, v, data in G.edges(data=True):
        if data.get("kind") == "junction":
            r_u = R_wire.get(u, 0.0) if isinstance(u, (int, np.integer)) else 0.0
            r_v = R_wire.get(v, 0.0) if isinstance(v, (int, np.integer)) else 0.0
            # half of each wire's body resistance + the junction contact resistance
            data["resistance"] = junction_resistance + 0.5 * r_u + 0.5 * r_v
        elif data.get("kind") == "electrode":
            data["resistance"] = 1e-6  # near-zero contact resistance
        else:
            data["resistance"] = 1.0  # fallback

    return G


def solve_network_resistance(G, source="ELECTRODE_LEFT", sink="ELECTRODE_RIGHT", V_applied=1.0):
    """
    Solve Kirchhoff's current law for the resistor network and compute
    the total network resistance between source and sink electrodes.

    Returns
    -------
    dict with keys: 'percolates', 'R_network', 'I_total', 'voltages' (or None if disconnected)
    """
    if source not in G or sink not in G or not nx.has_path(G, source, sink):
        return {"percolates": False, "R_network": np.inf, "I_total": 0.0, "voltages": None}

    # Restrict to the connected component containing both electrodes
    component_nodes = nx.node_connected_component(G, source)
    subG = G.subgraph(component_nodes).copy()

    nodes = list(subG.nodes())
    node_idx = {n: i for i, n in enumerate(nodes)}
    n = len(nodes)

    src_i = node_idx[source]
    sink_i = node_idx[sink]

    # Build conductance (Laplacian-style) matrix: G_matrix @ V = I_injected
    G_matrix = lil_matrix((n, n))
    for u, v, data in subG.edges(data=True):
        r = data.get("resistance", 1.0)
        if r <= 0:
            r = 1e-9
        g = 1.0 / r
        ui, vi = node_idx[u], node_idx[v]
        G_matrix[ui, ui] += g
        G_matrix[vi, vi] += g
        G_matrix[ui, vi] -= g
        G_matrix[vi, ui] -= g

    # Boundary conditions: fix V at source and sink by modifying rows
    b = np.zeros(n)
    G_matrix = G_matrix.tolil()

    for fixed_i, fixed_V in [(src_i, V_applied), (sink_i, 0.0)]:
        G_matrix.rows[fixed_i] = [fixed_i]
        G_matrix.data[fixed_i] = [1.0]
        b[fixed_i] = fixed_V

    G_csr = G_matrix.tocsr()
    voltages = spsolve(G_csr, b)

    # Compute total current flowing out of the source node
    I_total = 0.0
    for neighbor in subG.neighbors(source):
        r = subG[source][neighbor].get("resistance", 1.0)
        v_src = voltages[src_i]
        v_nb = voltages[node_idx[neighbor]]
        I_total += (v_src - v_nb) / r

    R_network = V_applied / I_total if I_total > 1e-15 else np.inf

    voltage_map = {node: voltages[node_idx[node]] for node in nodes}

    return {
        "percolates": True,
        "R_network": R_network,
        "I_total": I_total,
        "voltages": voltage_map,
    }


def compute_sheet_resistance(R_network, domain_size, electrode_separation=None):
    """
    Convert network resistance to sheet resistance.
    For a square film (L = W between electrodes), R_sheet = R_network.
    For a rectangular film, R_sheet = R_network * (W / L).
    """
    if electrode_separation is None:
        electrode_separation = domain_size
    W = domain_size  # width perpendicular to current flow
    L = electrode_separation  # distance between electrodes
    return R_network * (W / L)