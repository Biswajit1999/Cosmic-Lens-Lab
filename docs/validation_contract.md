# Analytic validation contract

This document defines the minimum science checks that must pass before interface, animation, WebGL, or WebGPU upgrades are treated as scientifically trustworthy.

CosmicLens Lab is an educational single-plane, thin-lens, geometric-optics laboratory. The validator in `tools/validate_lensing_contract.py` is deliberately independent of the browser and package implementation so it can catch convention drift.

## Coordinate convention

The current contract uses dimensionless angular units with Einstein radius set to one unless stated otherwise.

```text
beta = theta - alpha(theta)
```

For a point-mass lens:

```text
alpha(theta) = theta_E^2 / theta
```

For a singular isothermal sphere along the source axis:

```text
alpha(theta) = theta_E sign(theta)
```

External shear uses the matrix convention documented in `docs/physics.md`.

## Required invariants

### Point mass

For an on-axis scalar source offset `beta`, the two point-mass image positions are:

```text
theta_plus  = 0.5 [beta + sqrt(beta^2 + 4 theta_E^2)]
theta_minus = 0.5 [beta - sqrt(beta^2 + 4 theta_E^2)]
```

The validator checks:

1. Both images satisfy `beta = theta - theta_E^2/theta`.
2. The product invariant is `theta_plus theta_minus = -theta_E^2`.
3. The outer image has positive parity and the inner image has negative parity.
4. The signed magnification invariant is `mu_plus + mu_minus = 1`.

### SIS image multiplicity

For a positive scalar source offset in an SIS lens:

- `|beta| < theta_E` gives two images.
- `|beta| > theta_E` gives one image.

The validator checks both the image count and the scalar lens equation for the inner and outer branches.

### External shear

For shear amplitude `gamma`, the shear matrix must be traceless and have determinant `-gamma^2`. This prevents accidental sign or angle-convention drift when rendering shear-driven quads.

### Fermat stationary points

Point-mass image positions must be stationary points of the Fermat potential:

```text
phi(theta, beta) = 0.5 (theta - beta)^2 - ln|theta|
```

The validator checks the numerical derivative at each analytic point-mass image.

## What this does not validate yet

This contract does not yet validate:

- strict Kormann-Schneider-Bartelmann SIE conventions,
- critical-curve extraction accuracy,
- caustic topology,
- numerical `kappa -> psi -> alpha` solvers,
- pixel-level visual regression,
- cosmological distance scaling for physical time delays.

Those are the next scientific gaps and should be added before claiming production-grade lens modelling.

## Local command

```bash
python tools/validate_lensing_contract.py
```
