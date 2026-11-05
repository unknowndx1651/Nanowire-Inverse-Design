"""
Closed-loop Bayesian optimization with a user-defined objective,
constraints, and simulation budget.

surrogate -> acquisition -> physics simulator -> update surrogate -> repeat.
"""
import numpy as np
import pandas as pd

from simulator import PARAM_RANGES, simulate_design, sample_random_designs
from surrogate import NanowireSurrogate
from objectives import build_acquisition


def _current_best(history_df, objective, constraints):
    """
    Best value of `objective` among designs that currently satisfy every
    constraint (percolating + each constraint's threshold). Falls back to
    the best objective value among percolating designs if none satisfy
    every constraint yet, so the optimizer still has a reference point
    to improve on early in the search.
    """
    perc = history_df[history_df["percolates"]]
    if len(perc) == 0:
        return None  # nothing percolates yet; caller should handle this

    pool = perc
    for c in (constraints or []):
        col = c["property"]
        if c["direction"] == "max":
            pool = pool[pool[col] >= c["bound"]]
        else:
            pool = pool[pool[col] <= c["bound"]]

    search_pool = pool if len(pool) > 0 else perc
    if objective == "sheet_resistance":
        return search_pool["sheet_resistance"].min()
    return search_pool[objective].max()


def bayesian_optimization_loop(initial_df, budget, objective="sheet_resistance",
                                constraints=None, domain_size=50.0,
                                candidate_pool_size=500, seed=0, progress_callback=None):
    """
    Run `budget` guided iterations on top of an existing dataset.

    Parameters
    ----------
    objective, constraints : see objectives.build_acquisition
    budget : number of NEW physics simulations to run (the user-facing
        "Optimization Budget" from the UI).
    progress_callback : optional callable(iteration, budget, history_df)
        called after each new simulation, for progress reporting
        (e.g. "Simulation 34/100") in an API/UI context.

    Returns the full history DataFrame (initial_df + all BO-selected evaluations).
    """
    history_df = initial_df.copy()
    rng = np.random.default_rng(seed + 999)

    for it in range(budget):
        surrogate = NanowireSurrogate()
        surrogate.fit(history_df)

        best_value = _current_best(history_df, objective, constraints)
        if best_value is None:
            # Nothing percolates yet: fall back to a plain random probe
            # so we get at least one conducting design before scoring
            # candidates by improvement over a (nonexistent) baseline.
            next_design = sample_random_designs(1, PARAM_RANGES, seed=rng.integers(1e9))[0]
        else:
            candidates = sample_random_designs(candidate_pool_size, PARAM_RANGES, seed=rng.integers(1e9))
            cand_df = pd.DataFrame(candidates)
            acq_values = build_acquisition(surrogate, cand_df, best_value,
                                            objective=objective, constraints=constraints)
            next_design = candidates[int(np.argmax(acq_values))]

        new_row = simulate_design(
            density=next_design["density"], length_mean=next_design["length_mean"],
            diameter=next_design["diameter"], orientation_S=next_design["orientation_S"],
            junction_resistance=next_design["junction_resistance"],
            domain_size=domain_size, seed=seed * 100000 + 50000 + it,
        )
        new_row.pop("network", None)
        history_df = pd.concat([history_df, pd.DataFrame([new_row])], ignore_index=True)

        if progress_callback is not None:
            progress_callback(it + 1, budget, history_df)

    return history_df