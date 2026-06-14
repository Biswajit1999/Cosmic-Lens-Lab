from __future__ import annotations

import json
from pathlib import Path

from .point_mass import point_mass_images
from .sis import sis_images


def describe_scene(path: str | Path) -> dict[str, object]:
    scene = json.loads(Path(path).read_text())
    components = scene["planes"][0]["components"]
    source_x = scene["source"]["profile"]["center"][0]
    out: dict[str, object] = {"name": scene["name"], "components": [c["type"] for c in components]}
    first = components[0]
    if first["type"] == "PointMass":
        out["analytic_images_1d"] = point_mass_images(source_x, first["thetaE"])
    if first["type"] == "SIS":
        out["analytic_images_1d"] = sis_images(source_x, first["thetaE"])
    return out


if __name__ == "__main__":
    import sys
    print(describe_scene(sys.argv[1]))
