# Contributing to CosmicLens Lab

Thank you for considering a contribution.

## Contribution principles

Scientific changes should include:

1. a short derivation or reference note,
2. a unit or regression test,
3. a validation case when possible,
4. a clear tolerance policy,
5. a note on performance impact if relevant.

## Local setup

```bash
npm install
npm run dev
npm run test
```

For Python validation:

```bash
pip install -e ./python
pytest python/tests
```

## Pull request checklist

- [ ] The change is scientifically documented.
- [ ] Tests pass locally.
- [ ] Browser demo still loads.
- [ ] Scene schema changes include migration notes.
- [ ] New formulas include references in `docs/references.md`.

## Good first issues

Good first issues usually involve documentation, analytic tests, scene presets, UI labels, or example notebooks.

## Scientific caution

CosmicLens Lab is a learning and prototyping platform. It should not claim precision cosmological inference without rigorous validation against real observational pipelines.
