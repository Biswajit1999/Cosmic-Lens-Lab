from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class PointMassResult:
    theta_plus: float
    theta_minus: float
    mu_plus: float
    mu_minus: float


def point_mass_images(beta: float, theta_e: float) -> tuple[float, float]:
    disc = math.sqrt(beta * beta + 4.0 * theta_e * theta_e)
    return 0.5 * (beta + disc), 0.5 * (beta - disc)


def point_mass_magnifications(beta: float, theta_e: float) -> tuple[float, float]:
    eps = 1e-15
    u = max(abs(beta / theta_e), eps)
    term = (u * u + 2.0) / (2.0 * u * math.sqrt(u * u + 4.0))
    return 0.5 + term, 0.5 - term


def validate(beta: float = 0.3, theta_e: float = 1.0) -> PointMassResult:
    theta_plus, theta_minus = point_mass_images(beta, theta_e)
    mu_plus, mu_minus = point_mass_magnifications(beta, theta_e)
    return PointMassResult(theta_plus, theta_minus, mu_plus, mu_minus)


if __name__ == "__main__":
    print(validate())
