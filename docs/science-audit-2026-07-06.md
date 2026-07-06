# Science audit: lensing conventions and visual truth

Date: 2026-07-06

This audit records the scientific checks addressed before any new interface animation work.

## Scope checked

CosmicLens Lab is currently valid as a single-plane, geometric-optics, thin-lens teaching and visualisation lab. It should not claim multi-plane lensing, wave optics, precision lens inversion, microlensing, or cosmological parameter inference until those modules are implemented and independently validated.

## Coordinate policy

- The browser physics layer uses image-plane coordinates `theta` and source-plane coordinates `beta`.
- The central equation is `beta = theta - alpha(theta)`, where `alpha` is the reduced deflection angle.
- Browser pixel coordinates are rendering coordinates only. They are not physical sky angles unless a scene declares an angular scale.
- Dimensionless scenes should be read as coordinates in Einstein-radius-like units unless a scene states otherwise.

## Point-mass validation contract

For the scalar point-mass lens, the image locations are roots of:

```text
theta^2 - beta theta - theta_E^2 = 0
```

Therefore a correct implementation must satisfy:

```text
theta_plus + theta_minus = beta
theta_plus * theta_minus = -theta_E^2
beta = theta - theta_E^2 / theta
```

The new Python invariant tests check all three relationships.

The signed magnifications must preserve parity: the outer image is positive and the inner image is negative. The absolute total magnification must match the analytic point-mass total magnification.

## SIS validation contract

For the scalar singular isothermal sphere reference model:

- `|beta| < theta_E` gives two scalar image locations.
- `|beta| >= theta_E` gives one scalar image location.
- The implementation should be antisymmetric under `beta -> -beta` away from the singular origin.

The new Python invariant tests check the boundary, image signs, separation, and antisymmetry.

## Visual truth policy

- Critical curves must be produced from the zero contour of the lensing Jacobian determinant, not hand-drawn decoration.
- Caustics must be the source-plane mapping of critical curves.
- Magnification plots should label whether they show signed magnification, absolute magnification, inverse magnification, or clipped values.
- Negative magnification is a parity sign, not negative observed flux.
- Animation must move a declared source, lens, shear term, substructure term, or model parameter. It must not imply live survey data unless such data are loaded and cited.
- Smooth arcs, glow, bloom, or particle effects must never be used as evidence for unimplemented physics.

## Follow-up scientific gap

The next highest-value gap is a browser/Python parity fixture: export one point-mass scene from the web app, recompute the same ray mapping in Python, and assert agreement away from the singular origin and critical curve.
