"""
Generalized acquisition functions for multi-property inverse design.

Supports optimizing any one of {sheet_resistance, transparency,
strain_tolerance} while treating the others as user-specified
constraints, each satisfied only probabilistically (since the
surrogate is uncertain).
"""
import numpy as np
from scipy.stats import norm

# direction of "better" for the built-in acquisition target
_MINIMIZE = {"sheet_resistance"}
_MAXIMIZE = {"transparency", "strain_tolerance"}


def expected_improvement(mu, sigma, best_so_far, maximize=False, xi=0.01):
    """
    Expected improvement over best_so_far.
    maximize=False -> minimizing mu (e.g. log resistance)
    maximize=True  -> maximizing mu (e.g. transparency, strain)
    """
    sigma = np.maximum(sigma, 1e-9)
    if maximize:
        improvement = mu - best_so_far - xi
    else:
        improvement = best_so_far - mu - xi
    z = improvement / sigma
    ei = improvement * norm.cdf(z) + sigma * norm.pdf(z)
    ei[sigma < 1e-9] = 0.0
    return np.maximum(ei, 0.0)


def probability_of_satisfying(mean, std, bound, direction):
    """
    P(value satisfies the bound), assuming a Gaussian belief N(mean, std).
    direction="max" -> constraint is value >= bound (e.g. min_transparency)
    direction="min" -> constraint is value <= bound (e.g. max_sheet_resistance)
    """
    std_safe = np.maximum(std, 1e-9)
    if direction == "max":
        return 1 - norm.cdf((bound - mean) / std_safe)
    elif direction == "min":
        return norm.cdf((bound - mean) / std_safe)
    raise ValueError(f"direction must be 'max' or 'min', got {direction!r}")


def build_acquisition(surrogate, candidates_df, best_value, objective="sheet_resistance",
                       constraints=None, require_percolation=True):
    """
    General constrained acquisition score for a candidate pool.

    Parameters
    ----------
    objective : one of "sheet_resistance", "transparency", "strain_tolerance"
        The property being optimized (minimized if sheet_resistance,
        maximized otherwise).
    constraints : list of dicts, e.g.
        [{"property": "transparency", "direction": "max", "bound": 0.85},
         {"property": "strain_tolerance", "direction": "max", "bound": 0.05}]
        "direction" follows probability_of_satisfying's convention:
        "max" means value must be >= bound, "min" means value must be <= bound.
        Pass None or [] for an unconstrained search.
    require_percolation : multiply by P(percolates) so infeasible (non-
        conducting) candidates are naturally down-weighted.

    Returns
    -------
    np.ndarray of acquisition scores, one per candidate row.
    """
    preds = surrogate.predict_all(candidates_df)

    property_to_pred = {
        "sheet_resistance": preds["log_resistance"],
        "transparency": preds["transparency"],
        "strain_tolerance": preds["strain_tolerance"],
    }

    obj_mean, obj_std = property_to_pred[objective]
    obj_best = np.log10(best_value) if objective == "sheet_resistance" else best_value
    maximize = objective in _MAXIMIZE

    ei = expected_improvement(obj_mean, obj_std, obj_best, maximize=maximize)

    score = ei
    for c in (constraints or []):
        mean, std = property_to_pred[c["property"]]
        p_ok = probability_of_satisfying(mean, std, c["bound"], c["direction"])
        score = score * p_ok

    if require_percolation:
        score = score * preds["p_percolates"]

    return score