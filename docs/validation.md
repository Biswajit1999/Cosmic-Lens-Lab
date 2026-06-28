# Validation strategy

CosmicLens Lab uses layered validation. A visual layer is never treated as scientific evidence by itself.

## Tier 1: analytic and numerical contracts

- Point-mass image positions.
- Point-mass signed magnifications.
- SIS 1-image / 2-image transition.
- External-shear matrix consistency.
- Fermat stationary-point consistency.
- Circular NFW finite centre and scale-radius continuity.
- Circular NFW potential-gradient contract: numerical `grad(psi)` must recover the implemented reduced deflection `alpha` below, near, and above the scale radius.

The NFW checks exist in both TypeScript and Python. They are language-separated implementations of the same analytic circular thin-lens formula; they are not a substitute for validation against a third-party production lensing package.

## Tier 2: browser/Python parity

Browser exports scene JSON and sampled arrays. Python reads the same scene and recomputes reference quantities.

| Quantity | Target tolerance |
|---|---:|
| Point-mass image position | `1e-10` Python analytic |
| Browser ray mapping | `1e-4` relative for smooth regions |
| NFW potential gradient | `2e-5` relative at tested radii |
| Critical curve contour | sign-consistency on determinant grid |
| Fermat ranking | correct minimum/saddle ordering |

## Tier 3: visual regression

Canonical demo scenes should eventually be rendered in Playwright and compared against approved screenshots. This guards presentation regressions, but does not replace the analytic checks above.

## Known failure modes

- Singular model at the origin.
- Magnification divergence near critical curves.
- Aliasing in undersampled source images.
- Mistaking the approximate SIE-like visual model for a strict research SIE implementation.
- Treating circular NFW as an elliptical or multi-plane NFW model.
- False confidence in toy time-delay cosmography.
