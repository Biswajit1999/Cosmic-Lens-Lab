"""Create lightweight validation frame-grid data from exported CosmicLens scene JSON.

This intentionally avoids heavy rendering dependencies: it samples analytic diagnostics across a
phase timeline and writes a CSV that can be compared with the browser frame-grid JSON export.
"""
from __future__ import annotations

import csv
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from .point_mass import point_mass_images

@dataclass
class FrameDiagnostic:
    frame: int
    phase: float
    source_x: float
    source_y: float
    theta_e: float | None
    analytic_image_plus: float | None
    analytic_image_minus: float | None


def _phase(i: int, frames: int) -> float:
    return i / max(1, frames)


def _first_component(scene: dict) -> dict | None:
    return next((c for c in scene.get("planes", [{}])[0].get("components", []) if c.get("type") != "ExternalShear"), None)


def diagnostics_for_scene(scene: dict, frames: int = 18, mode: str = "source-orbit") -> Iterable[FrameDiagnostic]:
    source = scene["source"]["profile"]
    sx0, sy0 = source["center"]
    comp = _first_component(scene)
    theta_e = comp.get("thetaE") if comp else None
    for i in range(frames):
        p = _phase(i, frames)
        angle = 2 * math.pi * p
        sx, sy = sx0, sy0
        local_theta = theta_e
        if mode == "source-orbit":
            sx = sx0 + 0.18 * math.cos(angle)
            sy = sy0 + 0.18 * 0.62 * math.sin(angle)
        if mode == "einstein-radius-pulse" and theta_e is not None:
            local_theta = max(0.25, theta_e * (1 + 0.16 * math.sin(angle)))
        image_plus = image_minus = None
        if comp and comp.get("type") == "PointMass" and local_theta is not None:
            beta = math.hypot(sx, sy)
            image_plus, image_minus = point_mass_images(beta, local_theta)
        yield FrameDiagnostic(i + 1, p, sx, sy, local_theta, image_plus, image_minus)


def write_framegrid_csv(scene_path: str | Path, output_path: str | Path, frames: int = 18, mode: str = "source-orbit") -> Path:
    scene = json.loads(Path(scene_path).read_text())
    output = Path(output_path)
    with output.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(FrameDiagnostic.__annotations__.keys()))
        writer.writeheader()
        for row in diagnostics_for_scene(scene, frames=frames, mode=mode):
            writer.writerow(row.__dict__)
    return output


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Write CosmicLens frame-grid diagnostics CSV.")
    parser.add_argument("scene")
    parser.add_argument("output")
    parser.add_argument("--frames", type=int, default=18)
    parser.add_argument("--mode", default="source-orbit")
    args = parser.parse_args()
    print(write_framegrid_csv(args.scene, args.output, args.frames, args.mode))
