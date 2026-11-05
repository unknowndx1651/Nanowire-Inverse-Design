import numpy as np

def generate_nanowires(density, domain_size=100.0, length_mean=10.0, length_std=1.0,
                        diameter=0.2, orientation_S=0.0, orientation_mean=0.0, seed=None):
    """
    Generate a random 2D nanowire network.

    Parameters
    ----------
    density : float
        Number of wires per unit area (wires / domain_size^2 determines count).
    domain_size : float
        Side length of the square simulation domain.
    length_mean, length_std : float
        Mean and std dev of wire length (drawn from a normal dist, clipped >0).
    diameter : float
        Wire diameter (constant across all wires for now).
    orientation_S : float
        Alignment order parameter, 0 = fully random orientation, 1 = fully aligned.
    orientation_mean : float
        Mean orientation angle (radians) that wires align toward when S > 0.
    seed : int or None
        RNG seed for reproducibility.

    Returns
    -------
    wires : np.ndarray of shape (n_wires, 6)
        Each row: [x_center, y_center, angle, length, diameter, wire_id]
    """
    rng = np.random.default_rng(seed)

    n_wires = int(round(density * domain_size**2))
    if n_wires <= 0:
        return np.empty((0, 6))

    # Random center positions, uniform over the domain
    x_c = rng.uniform(0, domain_size, n_wires)
    y_c = rng.uniform(0, domain_size, n_wires)

    # Orientation: blend between uniform random and a fixed mean angle
    # S=0 -> fully random in [0, pi); S=1 -> all wires exactly at orientation_mean
    random_angles = rng.uniform(0, np.pi, n_wires)
    angles = (1 - orientation_S) * random_angles + orientation_S * orientation_mean

    # Wire lengths, clipped to stay positive
    lengths = rng.normal(length_mean, length_std, n_wires)
    lengths = np.clip(lengths, 0.1 * length_mean, None)

    diameters = np.full(n_wires, diameter)
    wire_ids = np.arange(n_wires)

    wires = np.column_stack([x_c, y_c, angles, lengths, diameters, wire_ids])
    return wires


def wire_endpoints(wires):
    """
    Convert center/angle/length representation into (x1,y1,x2,y2) endpoints.
    Returns array of shape (n_wires, 4).
    """
    x_c, y_c, angle, length = wires[:, 0], wires[:, 1], wires[:, 2], wires[:, 3]
    dx = (length / 2) * np.cos(angle)
    dy = (length / 2) * np.sin(angle)
    x1, y1 = x_c - dx, y_c - dy
    x2, y2 = x_c + dx, y_c + dy
    return np.column_stack([x1, y1, x2, y2])