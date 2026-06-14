# Implementation notes

## Units

The browser app works in angular coordinates measured in arcseconds. Dimensionless model parameters such as Einstein radius are also expressed in arcseconds for interaction.

Python validation should convert physical quantities explicitly and avoid silent unit assumptions.

## Singularities

Any expression involving radius uses a small epsilon guard.

```ts
const r = Math.max(norm(theta), EPS);
```

This is acceptable for interactive rendering but must be disclosed in validators.

## Critical curves

The MVP estimates critical curves by sampling the Jacobian determinant on a grid and drawing sign-change cells. This is not a publication-grade contouring algorithm. It is deliberately simple and stable for interactive teaching.

## SIE naming

The current `softenedIsothermalEllipse` model is not a strict SIE implementation. It is a visual approximation. The strict SIE should be added later with a documented convention and comparison tests.
