# CosmicLens Lab UI/UX Redesign Blueprint

## Design objective

The application should feel like a premium scientific instrument rather than a conventional web page. The target mood is **JWST-era cosmology visualisation + mission-control dashboard + interactive gravitational-lensing lab**.

## Core interface principle

The homepage itself should look like the product. A visitor should immediately understand that this is a real, interactive, data-rich astrophysics console.

## Layout hierarchy

1. Sticky dark navigation with compact scientific identity.
2. Cinematic hero statement with active experiment status.
3. Capability telemetry band.
4. Three-column research console:
   - left: mission controls and model parameters,
   - centre: immersive lensing viewport and frame timeline,
   - right: live diagnostics and scientific insets.
5. Preset experiment deck.
6. FrameGrid renderer.
7. Scene JSON console.

## Visual language

- Deep-space background, not plain dark grey.
- Glass panels with thin cyan/amber borders.
- Monospaced telemetry for numbers and model states.
- Central canvas with layered stars, distortion grid, lens glow, caustics, critical curves, timeline strip, and HUD corner brackets.
- Compact scientific controls rather than generic web form cards.

## Colour tokens

- background: #04070d
- panel: rgba(8, 15, 28, 0.72)
- cyan: #47d7ff
- amber: #ffb547
- violet: #8b5cf6
- rose: #ff4d6d
- green: #58f2b7
- text: #e8f2ff
- muted: #91a4bc

## Motion language

- Slow and precise.
- No playful bouncing.
- `requestAnimationFrame` drives the scientific viewport.
- Lens phase updates should feel like instrument sampling, not game animation.
- FrameGrid thumbnails show deterministic scene evolution.

## Cleanup policy

Keep files that are true to the project:

- TypeScript source that powers the actual app.
- Physics-core functions used by the renderer or tests.
- Scene JSON examples that load in the app.
- Python validators that test real equations.
- Documentation that explains current or near-term features honestly.

Remove or rewrite files that claim features not yet implemented, especially if they sound like production-grade WebGPU, full inverse modelling, precision cosmography, or complete survey pipelines before those modules exist.
