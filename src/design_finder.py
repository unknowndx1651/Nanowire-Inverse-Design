"""
find_design_for_target — the single entry point tying together the
physics simulator, surrogate, Bayesian optimizer, and Pareto/feasibility
utilities into one "give me a design matching these targets" call.

This is the function the FastAPI /optimize endpoint will wrap.
"""
import numpy as np

from simulator import simulate_design
from bayesian_optimizer import bayesian_optimization_loop
from pareto import check_feasibility


def _build_constraints(max_sheet_resistance, min_transparency, min_strain_tolerance,
                        objective):
    """
    Turn the user's target thresholds into the (objective, constraints)
    shape build_acquisition/bayesian_optimization_loop expect. Whichever
    property is passed as `objective` is excluded from the constraint
    list (it's being actively optimized, not just satisfied).
    """
    constraints = []
    if objective != "sheet_resistance" and max_sheet_resistance is not None:
        constraints.append({"property": "sheet_resistance", "direction": "min",
                             "bound": max_sheet_resistance})
    if objective != "transparency" and min_transparency is not None:
        constraints.append({"property": "transparency", "direction": "max",
                             "bound": min_transparency})
    if objective != "strain_tolerance" and min_strain_tolerance is not None:
        constraints.append({"property": "strain_tolerance", "direction": "max",
                             "bound": min_strain_tolerance})
    return constraints


def find_design_for_target(initial_df, budget=50, objective="sheet_resistance",
                            max_sheet_resistance=None, min_transparency=None,
                            min_strain_tolerance=None, domain_size=50.0, seed=0,
                            progress_callback=None):
    """
    Search for a nanowire design matching the user's target properties.

    Parameters
    ----------
    initial_df : DataFrame
        Existing dataset to bootstrap the surrogate and check feasibility
        against before spending any of the budget.
    budget : int
        Number of NEW physics simulations the optimizer may run.
    objective : "sheet_resistance" | "transparency" | "strain_tolerance"
        The property to actively optimize (minimized if sheet_resistance,
        maximized otherwise). The other two, if a target is given for
        them, become constraints the winning design must satisfy.
    max_sheet_resistance, min_transparency, min_strain_tolerance : float or None
        User's target thresholds. Any left as None are simply not enforced.
    progress_callback : optional callable(iteration, budget, history_df)
        Forwarded to bayesian_optimization_loop for live progress reporting.

    Returns
    -------
    dict with:
        feasible : bool — whether any evaluated design (old or new)
            satisfies every given target
        design : dict of the 5 design parameters for the best design found
            (None if nothing percolated at all)
        properties : dict of its verified sheet_resistance, transparency,
            strain_tolerance, percolates
        network : the raw wires array for that design (for visualization)
        history_df : full evaluation history (initial_df + all new runs)
        n_new_simulations : how many of the budget were actually used
    """
    constraints = _build_constraints(max_sheet_resistance, min_transparency,
                                      min_strain_tolerance, objective)

    # Step 2: cheap check against what we already know, before spending budget.
    pre_check = check_feasibility(
        initial_df, max_sheet_resistance=max_sheet_resistance,
        min_transparency=min_transparency, min_strain_tolerance=min_strain_tolerance,
    )

    # Step 3/4: run the optimizer regardless, so we use the full budget to
    # refine further even if something already satisfies the targets.
    history_df = bayesian_optimization_loop(
        initial_df, budget=budget, objective=objective, constraints=constraints,
        domain_size=domain_size, seed=seed, progress_callback=progress_callback,
    )

    # Step 5: re-check feasibility against the FULL history (old + new),
    # and pick the best real (already-simulated) design.
    post_check = check_feasibility(
        history_df, max_sheet_resistance=max_sheet_resistance,
        min_transparency=min_transparency, min_strain_tolerance=min_strain_tolerance,objective=objective
    )

    best_row = post_check["best_design"]

    if best_row is None:
        return {
            "feasible": False,
            "design": None,
            "properties": None,
            "network": None,
            "history_df": history_df,
            "n_new_simulations": len(history_df) - len(initial_df),
        }

    design_params = {
        "density": float(best_row["density"]),
        "length_mean": float(best_row["length_mean"]),
        "diameter": float(best_row["diameter"]),
        "orientation_S": float(best_row["orientation_S"]),
        "junction_resistance": float(best_row["junction_resistance"]),
    }

    # Step 6: regenerate the network for this exact design so we have wire
    # geometry to visualize (dropped earlier when stored as a CSV row).
    # Re-simulating is cheap relative to the search itself and guarantees
    # the returned properties are freshly verified, not stale/surrogate.
    verified = simulate_design(
        density=design_params["density"], length_mean=design_params["length_mean"],
        diameter=design_params["diameter"], orientation_S=design_params["orientation_S"],
        junction_resistance=design_params["junction_resistance"],
        domain_size=domain_size, seed=int(best_row["seed"]),
    )

    return {
        "feasible": post_check["feasible_found"],
        "design": design_params,
        "properties": {
            "sheet_resistance": verified["sheet_resistance"],
            "transparency": verified["transparency"],
            "strain_tolerance": verified["strain_tolerance"],
            "percolates": verified["percolates"],
        },
        "network": verified["network"],
        "history_df": history_df,
        "n_new_simulations": len(history_df) - len(initial_df),
    }