import numpy as np


def compute_coverage_fraction(wires, domain_size):
    """
    Fraction of the domain's area covered by nanowires (opaque strips).
    Overlap between wires is ignored in this first-pass model (wires are
    thin relative to their length, so double-counting at junctions is a
    small correction — noted as an assumption).
    """
    lengths = wires[:, 3]
    diameters = wires[:, 4]
    wire_areas = lengths * diameters
    total_wire_area = wire_areas.sum()
    domain_area = domain_size ** 2
    coverage = total_wire_area / domain_area
    return coverage 

def compute_transparency(wires, domain_size, alpha=1.0):
    """
    Estimate optical transmittance using a Beer-Lambert-style exponential
    attenuation model:

        T = exp(-alpha * coverage_fraction)

    where:
    - coverage_fraction: fraction of the film area blocked by nanowires
    - alpha: an effective extinction coefficient (tunable; alpha=1 means
      transmittance drops to ~37% at 100% nominal coverage). This is a
      simplification, not real Mie/EM scattering — documented explicitly
      as an assumption per the theory notes.

    Returns
    -------
    T : float in [0, 1], transmittance fraction (1.0 = fully transparent)
    """
    coverage = compute_coverage_fraction(wires, domain_size)
    T = np.exp(-alpha * coverage)
    return T


def compute_transparency_percent(wires, domain_size, alpha=1.0):
    """Convenience wrapper returning transparency as a percentage."""
    return compute_transparency(wires, domain_size, alpha) * 100.0