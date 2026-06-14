# Physics model

CosmicLens Lab begins with single-plane geometric-optics gravitational lensing in the thin-lens approximation.

## Coordinates

Image-plane angular coordinates are written as

```math
\boldsymbol{\theta}=(\theta_x,\theta_y)
```

and source-plane angular coordinates as

```math
\boldsymbol{\beta}=(\beta_x,\beta_y).
```

The lens equation is

```math
\boldsymbol{\beta}=\boldsymbol{\theta}-\boldsymbol{\alpha}(\boldsymbol{\theta}).
```

## Deflection from projected mass

The projected surface density is

```math
\Sigma(\boldsymbol{\xi})=\int \rho(\boldsymbol{\xi},z)\,dz.
```

The physical deflection angle is

```math
\hat{\boldsymbol{\alpha}}(\boldsymbol{\xi})=
\frac{4G}{c^2}\int \Sigma(\boldsymbol{\xi}')
\frac{\boldsymbol{\xi}-\boldsymbol{\xi}'}{|\boldsymbol{\xi}-\boldsymbol{\xi}'|^2}\,d^2\xi'.
```

The reduced deflection is

```math
\boldsymbol{\alpha}(\boldsymbol{\theta})=
\frac{D_{ds}}{D_s}\hat{\boldsymbol{\alpha}}(D_d\boldsymbol{\theta}).
```

## Critical density and convergence

```math
\Sigma_{crit}=\frac{c^2}{4\pi G}\frac{D_s}{D_dD_{ds}},
\qquad
\kappa=\frac{\Sigma}{\Sigma_{crit}}.
```

## Potential, shear, and magnification

The lensing potential satisfies

```math
\boldsymbol{\alpha}=\nabla\psi,\qquad \nabla^2\psi=2\kappa.
```

The Jacobian is

```math
\mathbf{A}=\mathbf{I}-\nabla\nabla\psi.
```

Using convergence and shear,

```math
\mathbf{A}=\begin{pmatrix}
1-\kappa-\gamma_1 & -\gamma_2\\
-\gamma_2 & 1-\kappa+\gamma_1
\end{pmatrix}.
```

The magnification is

```math
\mu=\frac{1}{(1-\kappa)^2-|\gamma|^2}.
```

Critical curves satisfy

```math
\det\mathbf{A}=0.
```

Their mapped positions in the source plane are caustics.

## Fermat potential and time delay

The dimensionless Fermat potential is

```math
\phi(\boldsymbol{\theta},\boldsymbol{\beta})=
\frac{1}{2}|\boldsymbol{\theta}-\boldsymbol{\beta}|^2-\psi(\boldsymbol{\theta}).
```

The physical arrival time is

```math
 t(\boldsymbol{\theta},\boldsymbol{\beta})=
 \frac{1+z_d}{c}\frac{D_dD_s}{D_{ds}}\phi(\boldsymbol{\theta},\boldsymbol{\beta}).
```

## Implemented models

### Point mass

```math
\theta_E=\sqrt{\frac{4GM}{c^2}\frac{D_{ds}}{D_dD_s}},\qquad
\alpha(\theta)=\frac{\theta_E^2}{\theta}.
```

### SIS

```math
\theta_E=4\pi\left(\frac{\sigma_v}{c}\right)^2\frac{D_{ds}}{D_s},
\qquad
\boldsymbol{\alpha}=\theta_E\frac{\boldsymbol{\theta}}{|\boldsymbol{\theta}|}.
```

### External shear

```math
\boldsymbol{\alpha}_{ext}=\Gamma\boldsymbol{\theta},
```

where

```math
\Gamma=\gamma\begin{pmatrix}
\cos 2\phi & \sin 2\phi\\
\sin 2\phi & -\cos 2\phi
\end{pmatrix}.
```

### SIE-like approximation

The MVP uses a softened elliptical isothermal approximation for interactive visualisation. This is documented as `SoftenedIsothermalEllipse`, not as a precision SIE replacement. A future release should add a strict Kormann-Schneider-Bartelmann convention with parity tests.

### NFW helpers

The NFW profile is represented through its radial helper function

```math
 g(x)=\ln\frac{x}{2}+f(x)
```

with the usual piecewise arctanh/arctan branch behaviour. The MVP exposes stable radial helpers and reserves full cluster-grade inference for later validation.

## Numerical policy

- Avoid evaluating singular expressions at exactly zero radius.
- Compare inverse magnification or determinant near critical curves instead of raw magnification.
- Treat WebGPU/WebGL results as interactive approximations.
- Treat Python validators as high-precision references.
- Every new model must specify its convention, parameter units, and test cases.
