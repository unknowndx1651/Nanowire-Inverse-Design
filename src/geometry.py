import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
import numpy as np
from nanowire_generator import wire_endpoints, generate_nanowires

def plot_nanowire_network(wires, domain_size=100.0, title="Nanowire Network", ax=None):
    """
    Visualize a nanowire network as line segments.

    Parameters
    ----------
    wires : np.ndarray (n_wires, 6)
        Output of generate_nanowires().
    domain_size : float
        Side length of the square domain, for setting plot bounds.
    title : str
    ax : matplotlib axis, optional
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(6, 6))

    eps = wire_endpoints(wires)
    segments = eps.reshape(-1, 2, 2)  # (n_wires, 2 points, xy)

    lc = LineCollection(segments, linewidths=wires[:, 4] * 5, colors="steelblue", alpha=0.7)
    ax.add_collection(lc)

    ax.set_xlim(0, domain_size)
    ax.set_ylim(0, domain_size)
    ax.set_aspect("equal")
    ax.set_title(f"{title} (n={len(wires)})")
    ax.set_xlabel("x")
    ax.set_ylabel("y")

    return ax

def segments_intersect(p1, p2, p3, p4):
    """
    Check if segment (p1,p2) intersects segment (p3,p4).
    Returns (intersects: bool, point: (x,y) or None).
    Uses parametric line intersection.
    """
    x1, y1 = p1; x2, y2 = p2
    x3, y3 = p3; x4, y4 = p4

    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(denom) < 1e-10:
        return False, None  # parallel or collinear

    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denom

    if 0 <= t <= 1 and 0 <= u <= 1:
        ix = x1 + t * (x2 - x1)
        iy = y1 + t * (y2 - y1)
        return True, (ix, iy)
    return False, None

def find_all_intersections(wire_endpoints_arr):
    """
    Brute-force O(n^2) pairwise intersection check.
    wire_endpoints_arr: (n_wires, 4) array of [x1,y1,x2,y2]

    Returns list of (wire_i, wire_j, x, y) for every crossing found.
    """
    n = len(wire_endpoints_arr)
    intersections = []
    for i in range(n):
        p1 = wire_endpoints_arr[i, 0:2]
        p2 = wire_endpoints_arr[i, 2:4]
        for j in range(i + 1, n):
            p3 = wire_endpoints_arr[j, 0:2]
            p4 = wire_endpoints_arr[j, 2:4]
            hit, pt = segments_intersect(p1, p2, p3, p4)
            if hit:
                intersections.append((i, j, pt[0], pt[1]))
    return intersections