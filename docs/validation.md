# Validation strategy

CosmicLens Lab uses layered validation. The project policy is to validate scientific claims and equations before adding interface animation or decorative rendering.

## Tier 1: analytic tests

These are deterministic reference checks that should run without browser rendering, screenshots, network access, or external survey data.

- Point-mass image positions.
- Point-mass signed magnifications and parity.
- Point-mass root invariants: `theta_plus + theta_minus = beta` and `theta_plus * theta_minus = -theta_E^2`.
- Point-mass lens-equation residual: `beta = theta - theta_E^2 / theta` for both scalar images.
- SIS 1-image / 2-image transition at `|beta| = theta_E`.
- SIS antisymmetry under `beta -> -beta`.
- External shear matrix consistency.
- Fermat stationary point consistency.

Run the Python layer with:

```bash
PYTHONPATH=python pytest python/tests -q
```

or through the project script:

```bash
npm run validate:python
```

## Tier 2: browser/Python parity

Browser exports scene JSON and sampled arrays. Python reads the same scene and recomputes reference quantities.

Target MVP tolerance:

| Quantity | Target tolerance |
|---|---:|
| Point-mass image position | `1e-10` Python analytic |
| Point-mass invariant residuals | `1e-14` Python scalar checks |
| SIS scalar image multiplicity | exact branch agreement away from singular origin |
| Browser ray mapping | `1e-4` relative for smooth regions |
| Critical curve contour | sign-consistency on determinant grid |
| Fermat ranking | correct minimum/saddle ordering |

## Tier 3: visual regression

Canonical demo scenes should be rendered in Playwright and compared against approved screenshots. Visual regression is a guard against accidental UI or rendering changes; it is not a substitute for the analytic physics checks above.

## Physical-truth policy for visuals

- Critical curves must come from the zero contour of `det A`, not hand-drawn decoration.
- Caustics must be the source-plane mapping of critical curves.
- Magnification maps should preferably show inverse magnification or clipped signed magnification near singular curves to avoid false numeric confidence.
- Animation must move a declared source, lens, shear, or model parameter; it must not imply live survey data unless such data are explicitly loaded and cited.
- Approximate models such as the current softened elliptical visual model must remain labelled as approximations, not precision SIE replacements.

## Known failure modes

- Singular model at the origin.
- Magnification divergence near critical curves.
- Aliasing in undersampled source images.
- Mistaking approximate SIE-like visual model for a strict research SIE implementation.
- False confidence in toy time-delay cosmography.
- Confusing aesthetically smooth arcs with physically validated caustic/critical-curve structure.
