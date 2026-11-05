"""
Pareto front and target-feasibility utilities.

Objectives (all computed on percolating designs only):
  - minimize sheet_resistance   (compared in log10 space)
  - maximize transparency
  - maximize strain_tolerance
"""
import numpy as np
import pandas as pd


def _valid_rows(df):
    """Percolating designs with a finite sheet resistance."""
    mask = df["percolates"].astype(bool) & np.isfinite(df["sheet_resistance"])
    return df[mask]


def _cost_matrix(df, use_strain=True):
    """Every column is oriented so that LOWER is better."""
    cols = [
        np.log10(df["sheet_resistance"].values),
        -df["transparency"].values,
    ]
    if use_strain:
        cols.append(-df["strain_tolerance"].values)
    return np.column_stack(cols)


def pareto_mask(costs):
    """
    Boolean mask of non-dominated rows for a cost matrix (lower is better).
    A row is dominated if another row is <= on every objective and
    strictly < on at least one.
    """
    n = costs.shape[0]
    efficient = np.ones(n, dtype=bool)
    for i in range(n):
        if not efficient[i]:
            continue
        dominated_by_i = np.all(costs[i] <= costs, axis=1) & np.any(costs[i] < costs, axis=1)
        efficient[dominated_by_i] = False
    return efficient


def pareto_front(df, use_strain=True):
    """
    Return the non-dominated designs from a results DataFrame,
    sorted by sheet resistance. Non-percolating designs are excluded.
    Set use_strain=False for the 2-objective (resistance vs transparency) front.
    """
    valid = _valid_rows(df)
    if len(valid) == 0:
        return valid
    mask = pareto_mask(_cost_matrix(valid, use_strain=use_strain))
    return valid[mask].sort_values("sheet_resistance").reset_index(drop=True)


def _violation(df, max_sheet_resistance, min_transparency, min_strain_tolerance):
    """
    Total normalized constraint violation per row (0 = all constraints met).
      resistance : log10 ratio above the limit
      transparency / strain : relative shortfall below the minimum
    """
    v = np.zeros(len(df))
    if max_sheet_resistance is not None:
        v += np.clip(np.log10(df["sheet_resistance"].values / max_sheet_resistance), 0, None)
    if min_transparency is not None:
        v += np.clip((min_transparency - df["transparency"].values) / max(min_transparency, 1e-9), 0, None)
    if min_strain_tolerance is not None:
        v += np.clip((min_strain_tolerance - df["strain_tolerance"].values) / max(min_strain_tolerance, 1e-9), 0, None)
    return v


def check_feasibility(df, max_sheet_resistance=None, min_transparency=None,
                      min_strain_tolerance=None, objective="sheet_resistance"):
    """
    Check a user's targets against the designs evaluated so far.

    Returns a dict:
      feasible_found : True if at least one evaluated design meets every constraint
      n_satisfying   : how many evaluated designs meet them
      best_design    : if feasible, the satisfying design that is best for
                       `objective` (lowest sheet resistance, or highest
                       transparency / strain tolerance); otherwise the closest
                       miss (smallest total normalized violation)
      violation      : total normalized violation of best_design (0 if feasible)

    Caveat: this only reflects designs already evaluated. "No design found"
    means the targets were not met by anything tried so far, not that they
    are physically impossible. Treat it as a warning, not a proof.
    """
    if objective not in ("sheet_resistance", "transparency", "strain_tolerance"):
        raise ValueError(f"Unknown objective: {objective!r}")

    valid = _valid_rows(df).reset_index(drop=True)
    if len(valid) == 0:
        return {"feasible_found": False, "n_satisfying": 0, "best_design": None, "violation": None}

    viol = _violation(valid, max_sheet_resistance, min_transparency, min_strain_tolerance)
    satisfying = viol == 0

    if satisfying.any():
        pool = valid[satisfying]
        if objective == "sheet_resistance":
            best = pool.loc[pool["sheet_resistance"].idxmin()]
        else:
            best = pool.loc[pool[objective].idxmax()]
        return {"feasible_found": True, "n_satisfying": int(satisfying.sum()),
                "best_design": best, "violation": 0.0}

    idx = int(np.argmin(viol))
    return {"feasible_found": False, "n_satisfying": 0,
            "best_design": valid.iloc[idx], "violation": float(viol[idx])}