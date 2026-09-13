# Circular NFW Fermat model

The circular NFW component now has an analytic lens potential consistent with its existing reduced deflection. With `x = r / theta_s`, the implementation uses:

```text
alpha(x) = 4 kappa_s theta_s g(x) / x
psi(x) = 2 kappa_s theta_s^2 h(x)
```

where the code evaluates the standard piecewise NFW functions and uses stable small-radius series branches. The implementation contract is numerical: the gradient of `psi` must reproduce the component deflection. The TypeScript unit test checks this by central finite differences at radii below, around, and above `theta_s`.

This is a circular thin-lens model. It does not yet provide an elliptical NFW mass distribution, multi-plane coupling, or inference-grade time-delay cosmography.
