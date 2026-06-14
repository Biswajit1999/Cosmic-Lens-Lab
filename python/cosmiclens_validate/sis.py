from __future__ import annotations


def sis_images(beta: float, theta_e: float) -> list[float]:
    if abs(beta) >= theta_e:
        sign = 1.0 if beta >= 0 else -1.0
        return [beta + sign * theta_e]
    return [beta + theta_e, beta - theta_e]


if __name__ == "__main__":
    print({"inside": sis_images(0.3, 1.0), "outside": sis_images(1.3, 1.0)})
