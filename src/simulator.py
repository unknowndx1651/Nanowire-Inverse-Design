"""
Full physics simulator pipeline: geometry -> percolation -> electrical
-> optical -> strain. This is the single central simulator interface
(spec Section 17) that everything else (surrogate, optimizer, API) calls.
"""
import numpy as np
import pandas as pd

from nanowire_generator import generate_nanowires, wire_endpoints
from graph_model import build_network_graph, network_stats
from electrical_solver import assign_edge_resistances, solve_network_resistance, compute_sheet_resistance
from optical_model import compute_transparency
from strain_model import compute_strain_tolerance


# Design-space bounds, shared across dataset generation, the surrogate,
# and the Bayesian optimizer's candidate sampler.
PARAM_RANGES = {
    "density": (0.02, 0.30),
    "length_mean": (4.0, 15.0),
    "diameter": (0.1, 0.5),
    "orientation_S": (0.0, 1.0),
    "junction_resistance": (10.0, 500.0),
}
FEATURE_COLUMNS = list(PARAM_RANGES.keys())


def simulate_design(density, length_mean, diameter, orientation_S, junction_resistance,
                     domain_size=50.0, length_std=1.0, orientation_mean=0.0,
                     wire_resistivity=1.0, alpha=1.0,
                     compute_strain=True, strain_max=0.40, strain_resistance_multiplier=1.5,
                     strain_probe_steps=6, strain_bisection_iters=6,
                     seed=None):
    """
    Full physics pipeline for one design: geometry -> percolation ->
    electrical resistance -> optical transparency -> (optional) strain.

    Returns a dict of design parameters + computed properties, matching
    the spec's simulate_design() contract:
        sheet_resistance, transparency, strain_tolerance, percolates,
        largest_component_fraction, num_junctions
    plus the raw wires array under "network" for visualization.
    """
    wires = generate_nanowires(
        density=density, domain_size=domain_size, length_mean=length_mean,
        length_std=length_std, diameter=diameter, orientation_S=orientation_S,
        orientation_mean=orientation_mean, seed=seed
    )

    result_row = {
        "density": density,
        "length_mean": length_mean,
        "diameter": diameter,
        "aspect_ratio": length_mean / diameter,
        "orientation_S": orientation_S,
        "junction_resistance": junction_resistance,
        "n_wires": len(wires),
        "seed": seed,
        "network": wires,
    }

    if len(wires) == 0:
        result_row.update({
            "percolates": False, "sheet_resistance": np.inf,
            "transparency": 1.0, "n_edges": 0, "largest_component_size": 0,
            "largest_component_fraction": 0.0, "num_junctions": 0,
            "strain_tolerance": 0.0,
        })
        return result_row

    eps = wire_endpoints(wires)
    G = build_network_graph(wires, eps, domain_size)

    stats = network_stats(G)
    result_row["n_edges"] = stats["n_edges"]
    result_row["largest_component_size"] = stats["largest_component_size"]
    # largest_component_size includes the two virtual electrode nodes when
    # they're part of the spanning component, so cap the fraction at 1.0
    # and normalize against wire count only.
    result_row["largest_component_fraction"] = min(
        stats["largest_component_size"] / max(len(wires), 1), 1.0
    )
    result_row["num_junctions"] = stats["n_edges"]

    G = assign_edge_resistances(G, wires, wire_resistivity=wire_resistivity,
                                 junction_resistance=junction_resistance)
    elec_result = solve_network_resistance(G)

    sheet_R = compute_sheet_resistance(elec_result["R_network"], domain_size) \
        if elec_result["percolates"] else np.inf

    T = compute_transparency(wires, domain_size, alpha=alpha)

    result_row.update({
        "percolates": elec_result["percolates"],
        "sheet_resistance": sheet_R,
        "transparency": T,
    })

    if compute_strain and elec_result["percolates"]:
        strain_result = compute_strain_tolerance(
            wires, domain_size, baseline_sheet_resistance=sheet_R,
            junction_resistance=junction_resistance, wire_resistivity=wire_resistivity,
            max_strain=strain_max, resistance_multiplier=strain_resistance_multiplier,
            n_probe_steps=strain_probe_steps, n_bisection_iters=strain_bisection_iters,
        )
        result_row["strain_tolerance"] = strain_result["strain_tolerance"]
    else:
        result_row["strain_tolerance"] = 0.0

    return result_row


def sample_random_designs(n_samples, param_ranges=PARAM_RANGES, seed=None):
    """Uniform random sampling of the design space. Returns a list of dicts."""
    rng = np.random.default_rng(seed)
    samples = []
    for i in range(n_samples):
        design = {name: rng.uniform(low, high) for name, (low, high) in param_ranges.items()}
        samples.append(design)
    return samples


def run_designs(designs, domain_size=50.0, seed_base=0, compute_strain=True):
    """
    Batch-run a list of design dicts through simulate_design.
    Used by the random-search baseline and to evaluate BO candidates.

    Returns a DataFrame with the "network" column (raw wire arrays)
    dropped, since it doesn't belong in a flat CSV -- callers that need
    the network for a specific design should call simulate_design directly.
    """
    rows = []
    for i, d in enumerate(designs):
        row = simulate_design(
            density=d["density"], length_mean=d["length_mean"], diameter=d["diameter"],
            orientation_S=d["orientation_S"], junction_resistance=d["junction_resistance"],
            domain_size=domain_size, seed=seed_base * 10000 + i,
            compute_strain=compute_strain,
        )
        row.pop("network", None)
        rows.append(row)
    return pd.DataFrame(rows)


def generate_initial_dataset(n_samples=150, domain_size=50.0, seed=0, compute_strain=True):
    """
    Run the physics simulator on n_samples random designs and return a
    DataFrame -- the "expensive" initial dataset the Bayesian optimizer
    bootstraps from.
    """
    designs = sample_random_designs(n_samples, PARAM_RANGES, seed=seed)
    return run_designs(designs, domain_size=domain_size, seed_base=seed, compute_strain=compute_strain)