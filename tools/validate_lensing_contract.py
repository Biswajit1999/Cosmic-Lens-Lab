#!/usr/bin/env python3
"""Analytic validation contract for CosmicLens Lab.

This script checks dimensionless thin-lens invariants that should hold before
interface or rendering upgrades are trusted. It avoids project imports so it can
run as an independent reference calculation.
"""

from __future__ import annotations

import math

TOL = 1.0e-10


def assert_close(name: str, value: float, expected: float, tol: float = TOL) -> None:
    if abs(value - expected) > tol:
        raise AssertionError(f"{name}: value={value:.16g}, expected={expected:.16g}")
    print(f"PASS {name}: {value:.12g}")


def assert_true(name: str, condition: bool) -> None:
    if not condition:
        raise AssertionError(name)
    print(f"PASS {name}")


def point_mass_images(source_offset: float, einstein_radius: float = 1.0) -> tuple[float, float]:
    """Return the two scalar image radii for a point-mass lens.

    For a source on the x-axis, the scalar lens equation is
    beta = theta - theta_E^2 / theta.
    """
    disc = math.sqrt(source_offset * source_offset + 4.0 * einstein_radius * einstein_radius)
    return 0.5 * (source_offset + disc), 0.5 * (source_offset - disc)


def point_mass_magnification(theta: float, einstein_radius: float = 1.0) -> float:
    y = theta / einstein_radius
    det_a = 1.0 - 1.0 / (y**4)
    return 1.0 / det_a


def sis_images(source_offset: float, einstein_radius: float = 1.0) -> tuple[float, ...]:
    """Return scalar SIS image positions for a positive on-axis source offset."""
    if source_offset < einstein_radius:
        return (source_offset + einstein_radius, source_offset - einstein_radius)
    return (source_offset + einstein_radius,)


def shear_matrix(gamma: float, phi_rad: float) -> tuple[tuple[float, float], tuple[float, float]]:
    c = math.cos(2.0 * phi_rad)
    s = math.sin(2.0 * phi_rad)
    return ((gamma * c, gamma * s), (gamma * s, -gamma * c))


def fermat_point_mass(theta: float, beta: float, einstein_radius: float = 1.0) -> float:
    psi = einstein_radius * einstein_radius * math.log(abs(theta))
    return 0.5 * (theta - beta) ** 2 - psi


def main() -> None:
    beta = 0.35
    theta_plus, theta_minus = point_mass_images(beta)
    assert_close("point-mass plus image solves lens equation", theta_plus - 1.0 / theta_plus, beta)
    assert_close("point-mass minus image solves lens equation", theta_minus - 1.0 / theta_minus, beta)
    assert_close("point-mass image product", theta_plus * theta_minus, -1.0)

    mu_plus = point_mass_magnification(theta_plus)
    mu_minus = point_mass_magnification(theta_minus)
    assert_true("point-mass parity signs", mu_plus > 0.0 and mu_minus < 0.0)
    assert_close("point-mass signed magnification invariant", mu_plus + mu_minus, 1.0)

    assert_close("SIS outer image lens equation", sis_images(0.4)[0] - 1.0, 0.4)
    assert_close("SIS inner image lens equation", sis_images(0.4)[1] + 1.0, 0.4)
    assert_true("SIS has two images inside Einstein radius", len(sis_images(0.4)) == 2)
    assert_true("SIS has one image outside Einstein radius", len(sis_images(1.4)) == 1)

    gamma = 0.12
    gamma_matrix = shear_matrix(gamma, math.radians(31.0))
    trace = gamma_matrix[0][0] + gamma_matrix[1][1]
    determinant = gamma_matrix[0][0] * gamma_matrix[1][1] - gamma_matrix[0][1] * gamma_matrix[1][0]
    assert_close("external shear matrix trace", trace, 0.0)
    assert_close("external shear matrix determinant", determinant, -gamma * gamma)

    eps = 1.0e-6
    for theta in (theta_plus, theta_minus):
        dphi = (fermat_point_mass(theta + eps, beta) - fermat_point_mass(theta - eps, beta)) / (2.0 * eps)
        assert_close(f"Fermat stationary condition at theta={theta:.6f}", dphi, 0.0, 5.0e-6)


if __name__ == "__main__":
    main()
