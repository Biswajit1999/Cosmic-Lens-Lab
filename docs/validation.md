# Validation strategy

CosmicLens Lab uses layered validation.

## Tier 0: independent analytic contract

Before interface, animation, WebGL, or WebGPU upgrades are treated as scientifically trustworthy, the independent contract in [`docs/validation_contract.md`](validation_contract.md) should pass:

```bash
python tools/validate_lensing_contract.py
```

This script avoids project imports and checks convention-sensitive invariants for point-mass lensing, SIS image multiplicity, external shear, and Fermat stationary points.

## Tier 1: analytic tests

- Point-mass image positions
- Point-mass signed magnifications
- SIS 1-image / 2-image transition
- External shear matrix consistency
- Fermat stationary point consistency

## Tier 2: browser/Python parity

Browser exports scene JSON and sampled arrays. Python reads the same scene and recomputes reference quantities.

Target MVP tolerance:

| Quantity | Target tolerance |
|---|---:|
| Point-mass image position | `1e-10` Python analytic |
| Browser ray mapping | `1e-4` relative for smooth regions |
| Critical curve contour | sign-consistency on determinant grid |
| Fermat ranking | correct minimum/saddle ordering |

## Tier 3: visual regression

Canonical demo scenes should be rendered in Playwright and compared against approved screenshots.

## Known failure modes

- Singular model at the origin
- Magnification divergence near critical curves
- Aliasing in undersampled source images
- Mistaking approximate SIE-like visual model for a strict research SIE implementation
- False confidence in toy time-delay cosmography
