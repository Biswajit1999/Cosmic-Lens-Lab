from __future__ import annotations

import math

C_KM_S = 299_792.458


def e_z(z: float, h0: float = 70.0, om0: float = 0.3) -> float:
    del h0
    return math.sqrt(om0 * (1 + z) ** 3 + (1 - om0))


def comoving_distance_mpc(z: float, h0: float = 70.0, om0: float = 0.3, n: int = 4096) -> float:
    if n % 2:
        n += 1
    h = z / n
    total = 1 / e_z(0, h0, om0) + 1 / e_z(z, h0, om0)
    for i in range(1, n):
        total += (4 if i % 2 else 2) / e_z(i * h, h0, om0)
    return (C_KM_S / h0) * h * total / 3


def angular_diameter_distance_mpc(z: float, h0: float = 70.0, om0: float = 0.3) -> float:
    return comoving_distance_mpc(z, h0, om0) / (1 + z)
