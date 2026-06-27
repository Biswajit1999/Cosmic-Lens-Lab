"""Independent circular NFW reference equations."""
from __future__ import annotations

import math

EPS = 1e-12
SMALL_X = 0.1


def _small_g(x: float) -> float:
    log_term = math.log(2.0 / x)
    x2 = x * x
    x4 = x2 * x2
    x6 = x4 * x2
    return (
        x2 * (0.5 * log_term - 0.25)
        + x4 * (3.0 * log_term / 8.0 - 7.0 / 32.0)
        + x6 * (5.0 * log_term / 16.0 - 37.0 / 192.0)
    )


def _small_potential_shape(x: float) -> float:
    log_term = math.log(2.0 / x)
    x2 = x * x
    x4 = x2 * x2
    x6 = x4 * x2
    return (
        x2 * (0.5 * log_term)
        + x4 * (3.0 * log_term / 16.0 - 1.0 / 16.0)
        + x6 * (5.0 * log_term / 48.0 - 3.0 / 64.0)
    )


def nfw_g(x_raw: float) -> float:
    x = max(x_raw, EPS)
    if x < SMALL_X:
        return _small_g(x)
    if abs(x - 1.0) < 1e-5:
        return math.log(0.5) + 1.0
    if x < 1.0:
        a = math.sqrt((1.0 - x) / (1.0 + x))
        return math.log(x / 2.0) + 2.0 * math.atanh(a) / math.sqrt(1.0 - x * x)
    a = math.sqrt((x - 1.0) / (1.0 + x))
    return math.log(x / 2.0) + 2.0 * math.atan(a) / math.sqrt(x * x - 1.0)


def nfw_potential_shape(x_raw: float) -> float:
    x = max(x_raw, EPS)
    if x < SMALL_X:
        return _small_potential_shape(x)
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
