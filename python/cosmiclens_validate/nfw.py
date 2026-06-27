"""Independent circular NFW reference equations."""
from __future__ import annotations

import math

EPS = 1e-12


def nfw_g(x_raw: float) -> float:
    x = max(x_raw, EPS)
    if x < 1e-4:
        return 0.5 * x * x * (math.log(2.0 / x) - 0.5)
    if abs(x - 1.0) < 1e-5:
        return math.log(0.5) + 1.0
    if x < 1.0:
        a = math.sqrt((1.0 - x) / (1.0 + x))
        return math.log(x / 2.0) + 2.0 * math.atanh(a) / math.sqrt(1.0 - x * x)
    a = math.sqrt((x - 1.0) / (1.0 + x))
    return math.log(x / 2.0) + 2.0 * math.atan(a) / math.sqrt(x * x - 1.0)


def nfw_potential_shape(x_raw: float) -> float:
    x = max(x_raw, EPS)
    if x < 1e-4:
        return 0.5 * x * x * math.log(2.0 / x)
    if abs(x - 1.0) < 1e-5:
        return math.log(0.5) ** 2
    if x < 1.0:
        return math.log(x / 2.0) ** 2 - math.atanh(math.sqrt(1.0 - x * x)) ** 2
    return math.log(x / 2.0) ** 2 + math.atan(math.sqrt(x * x - 1.0)) ** 2


def nfw_potential(radius: float, kappa_s: float, radius_scale: float) -> float:
    if radius < EPS:
        return 0.0
    scale = max(radius_scale, EPS)
    return 2.0 * kappa_s * scale * scale * nfw_potential_shape(radius / scale)


def nfw_deflection(radius: float, kappa_s: float, radius_scale: float) -> float:
    if radius < EPS:
        return 0.0
    scale = max(radius_scale, EPS)
    x = radius / scale
    return 4.0 * kappa_s * scale * nfw_g(x) / x
