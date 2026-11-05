"""
Surrogate models for the nanowire simulator.

Trains one model per target property:
  - transparency          : GP on all rows
  - log10(sheet_resistance): GP on percolating rows only
  - strain_tolerance      : GP on percolating rows only
  - percolation           : classifier giving P(network percolates)

Resistance and strain are only meaningful for percolating designs
(non-percolating rows store inf / 0 as placeholders), so those GPs are
trained on percolating rows only. The classifier tells the optimizer
how likely a candidate is to fall in that valid region.
"""
import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor, GaussianProcessClassifier
from sklearn.gaussian_process.kernels import Matern, WhiteKernel, ConstantKernel
from sklearn.preprocessing import StandardScaler

from simulator import FEATURE_COLUMNS

MIN_PERCOLATING_ROWS = 5


def _make_gp(n_features, noise):
    # Wider length-scale bounds than sklearn's default avoid the
    # "close to upper bound" ConvergenceWarning on weak features
    # (orientation_S, junction_resistance).
    kernel = ConstantKernel(1.0) * Matern(
        length_scale=np.ones(n_features), length_scale_bounds=(1e-2, 1e3), nu=2.5
    ) + WhiteKernel(noise_level=noise, noise_level_bounds=(1e-8, 1e2))
    return GaussianProcessRegressor(
        kernel=kernel, normalize_y=True, n_restarts_optimizer=2, random_state=0
    )


class NanowireSurrogate:
    def __init__(self):
        self.x_scaler = StandardScaler()
        self.gp_transparency = None
        self.gp_resistance = None
        self.gp_strain = None
        self.clf_percolation = None
        self._constant_p_perc = None  # used if the data has only one class

    def fit(self, df):
        n_features = len(FEATURE_COLUMNS)
        Xs = self.x_scaler.fit_transform(df[FEATURE_COLUMNS].values)
        perc = df["percolates"].values.astype(bool)

        if perc.sum() < MIN_PERCOLATING_ROWS:
            raise ValueError(
                f"Need at least {MIN_PERCOLATING_ROWS} percolating designs to fit "
                f"the surrogate, got {int(perc.sum())}."
            )

        # Transparency: defined for every design
        self.gp_transparency = _make_gp(n_features, 1e-3)
        self.gp_transparency.fit(Xs, df["transparency"].values)

        # Resistance (log space) and strain: percolating designs only
        self.gp_resistance = _make_gp(n_features, 1e-2)
        self.gp_resistance.fit(Xs[perc], np.log10(df.loc[perc, "sheet_resistance"].values))

        self.gp_strain = _make_gp(n_features, 1e-2)
        self.gp_strain.fit(Xs[perc], df.loc[perc, "strain_tolerance"].values)

        # Percolation probability
        if perc.all() or (~perc).all():
            self._constant_p_perc = float(perc.mean())
            self.clf_percolation = None
        else:
            self._constant_p_perc = None
            kernel = ConstantKernel(1.0) * Matern(
                length_scale=np.ones(n_features), length_scale_bounds=(1e-2, 1e3), nu=2.5
            )
            self.clf_percolation = GaussianProcessClassifier(
                kernel=kernel, n_restarts_optimizer=1, random_state=0
            )
            self.clf_percolation.fit(Xs, perc.astype(int))

        return self

    def _scale(self, df):
        return self.x_scaler.transform(df[FEATURE_COLUMNS].values)

    def predict_all(self, df):
        """
        Returns a dict of (mean, std) per property, plus P(percolates):
          {
            "transparency":      (mean, std),
            "log_resistance":    (mean, std),   # log10 of sheet resistance
            "strain_tolerance":  (mean, std),
            "p_percolates":      array
          }
        """
        Xs = self._scale(df)

        t_mean, t_std = self.gp_transparency.predict(Xs, return_std=True)
        r_mean, r_std = self.gp_resistance.predict(Xs, return_std=True)
        s_mean, s_std = self.gp_strain.predict(Xs, return_std=True)

        if self.clf_percolation is None:
            p_perc = np.full(len(df), self._constant_p_perc)
        else:
            p_perc = self.clf_percolation.predict_proba(Xs)[:, 1]

        return {
            "transparency": (t_mean, t_std),
            "log_resistance": (r_mean, r_std),
            "strain_tolerance": (s_mean, s_std),
            "p_percolates": p_perc,
        }

    def predict_df(self, df):
        """
        Backward-compatible 4-tuple used by the current objectives.py:
        (transparency_mean, transparency_std, log_resistance_mean, log_resistance_std)
        """
        out = self.predict_all(df)
        t_mean, t_std = out["transparency"]
        r_mean, r_std = out["log_resistance"]
        return t_mean, t_std, r_mean, r_std