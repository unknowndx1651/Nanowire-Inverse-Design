"""
Strain model — mechanical robustness of the nanowire network.

Under strain, wire endpoints move. Junctions that depended on the
original geometry can lose contact (the two wires no longer intersect),
breaking conductive pathways and increasing resistance.

We do not model wire elasticity/breaking directly. Instead we apply an
affine strain transform to wire endpoints, then rebuild the intersection
graph and re-solve the resistor network from scratch at each strain
level. This is a geometric approximation, not a finite-element
mechanical simulation -- documented explicitly, per the project's
"physics model vs experimental reality" principle.
"""
import numpy as np

from nanowire_generator import wire_endpoints
from graph_model import build_network_graph
from electrical_solver import assign_edge_resistances, solve_network_resistance, compute_sheet_resistance


def apply_strain(wires, strain, poisson_ratio=0.3, axis="x"):
    """
    Apply uniaxial affine strain to a wire network.

    Stretches wire centers and endpoints along `axis` by (1 + strain),
    and contracts the perpendicular axis by (1 - poisson_ratio * strain)
    to approximate Poisson contraction. Wire length/diameter fields are
    left as-is; only spatial position is transformed, since it is the
    endpoint displacement -- not the wire's own elongation -- that
    determines whether two wires still cross.

    Returns a new wires array (does not mutate the input).
    """
    strained = wires.copy()

    if axis == "x":
        stretch_idx, contract_idx = 0, 1
    else:
        stretch_idx, contract_idx = 1, 0

    strained[:, stretch_idx] *= (1 + strain)
    strained[:, contract_idx] *= (1 - poisson_ratio * strain)

    # Endpoints are derived from center/angle/length at simulation time via
    # wire_endpoints(), so transforming the center position (columns 0,1)
    # is sufficient -- the angle (column 2) is left unchanged, meaning we
    # approximate wires as rigid rods that translate but do not reorient
    # or elongate under strain. This is the simplifying assumption.
    return strained


def simulate_at_strain(wires, strain, domain_size, junction_resistance=100.0,
                        wire_resistivity=1.0, poisson_ratio=0.3, axis="x"):
    """
    Apply a given strain level and compute the resulting sheet resistance.

    Returns dict: {"strain": strain, "percolates": bool, "sheet_resistance": float}
    """
    strained_wires = apply_strain(wires, strain, poisson_ratio=poisson_ratio, axis=axis)
    eps = wire_endpoints(strained_wires)

    G = build_network_graph(strained_wires, eps, domain_size)
    G = assign_edge_resistances(G, strained_wires, wire_resistivity=wire_resistivity,
                                 junction_resistance=junction_resistance)
    elec_result = solve_network_resistance(G)

    sheet_R = compute_sheet_resistance(elec_result["R_network"], domain_size) \
        if elec_result["percolates"] else np.inf

    return {"strain": strain, "percolates": elec_result["percolates"], "sheet_resistance": sheet_R}


def compute_strain_tolerance(wires, domain_size, baseline_sheet_resistance,
                              junction_resistance=100.0, wire_resistivity=1.0,
                              poisson_ratio=0.3, axis="x",
                              max_strain=0.40, resistance_multiplier=1.5,
                              n_probe_steps=6, n_bisection_iters=6):
    """
    Find the maximum strain the network can withstand before its sheet
    resistance exceeds `resistance_multiplier * baseline_sheet_resistance`
    (or before it stops percolating entirely).

    Performance note: a full linear sweep over strain requires re-solving
    the resistor network at every step, which dominates simulation cost
    (physics simulation is the bottleneck per the project's performance
    principles). Instead we do a coarse probe (n_probe_steps evaluations)
    to bracket the failure point, then bisect (n_bisection_iters
    evaluations) to refine it -- typically ~10-12 solves total instead of
    30+, assuming degradation is roughly monotonic with strain (the same
    assumption the original linear sweep made).

    Returns
    -------
    dict with:
        strain_tolerance : float in [0, max_strain]
        allowed_resistance : float (the threshold used)
        curve : list of per-step {"strain","percolates","sheet_resistance"} dicts,
                in the order they were evaluated (probe phase then bisection phase)
    """
    allowed_resistance = baseline_sheet_resistance * resistance_multiplier
    curve = []

    def evaluate(strain):
        result = simulate_at_strain(
            wires, strain, domain_size,
            junction_resistance=junction_resistance,
            wire_resistivity=wire_resistivity,
            poisson_ratio=poisson_ratio, axis=axis,
        )
        curve.append(result)
        return result["percolates"] and result["sheet_resistance"] <= allowed_resistance

    # --- Coarse probe phase: find the first failing strain level ---
    probe_levels = np.linspace(0.0, max_strain, n_probe_steps)
    last_ok = 0.0
    first_fail = None

    for strain in probe_levels:
        ok = evaluate(strain)
        if ok:
            last_ok = strain
        else:
            first_fail = strain
            break

    if first_fail is None:
        # Never failed within max_strain -- tolerance is at the ceiling.
        return {
            "strain_tolerance": max_strain,
            "allowed_resistance": allowed_resistance,
            "curve": curve,
        }

    # --- Bisection phase: narrow the [last_ok, first_fail] bracket ---
    lo, hi = last_ok, first_fail
    for _ in range(n_bisection_iters):
        mid = (lo + hi) / 2.0
        if evaluate(mid):
            lo = mid
        else:
            hi = mid

    return {
        "strain_tolerance": lo,
        "allowed_resistance": allowed_resistance,
        "curve": curve,
    }