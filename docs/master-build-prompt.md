# Master build prompt

Use this prompt in a coding agent when extending the repository.

```text
You are building CosmicLens Lab, a browser-native gravitational lensing laboratory.

Priorities:
1. scientific correctness,
2. deterministic validation,
3. clean TypeScript architecture,
4. beautiful but honest scientific visualisation,
5. frictionless GitHub Pages deployment.

Do not remove existing tests or docs. Add features incrementally with tests.

Implement the next feature using this repository structure:
- apps/web for UI
- packages/physics-core for equations
- packages/schema for scene JSON
- python/cosmiclens_validate for reference checks
- docs for derivations and references

Any new lens model must include:
- formula convention
- source citation in docs/references.md
- TypeScript implementation
- Python or analytic validation where possible
- unit tests
- example scene if visual

Maintain the distinction between interactive approximations and research-grade validators.
```
