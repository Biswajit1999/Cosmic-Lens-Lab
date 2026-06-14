# Animation rendering and FrameGrid system

CosmicLens Lab now includes a cinematic animation layer rather than a static canvas demo.

## Runtime animation

The web app uses `requestAnimationFrame` for a browser-synchronised animation loop. Scene evolution is deterministic: a base `LensScene` plus `(mode, phase, amplitude)` produces a new scene without mutating the original scene. This makes the same animation usable for live playback, PNG snapshots, frame-grid export, and Python validation.

## Animation modes

- `source-orbit` — moves the source through caustic space.
- `caustic-breathing` — modulates ellipticity and shear to animate caustic topology.
- `shear-rotation` — rotates external shear to expose environmental degeneracy.
- `subhalo-flyby` — moves a compact perturbing mass through the image plane.
- `einstein-radius-pulse` — changes mass scale to show ring growth.
- `time-delay-sweep` — animates Fermat-potential and time-delay structure.

## Scientific render modes

- `lensed` — observable lensed surface brightness.
- `magnification` — absolute magnification map.
- `time-delay` — Fermat-potential / relative delay surface.
- `parity` — positive vs negative image parity regions.
- `source-plane` — colour-coded image-plane to source-plane mapping.
- `residual` — anomaly-style diagnostic map for perturber experiments.

## FrameGrid

A FrameGrid is a filmstrip renderer. It samples a full animation into a tiled image so one PNG can show the dynamical evolution of a lens system. This is useful for:

- README hero images
- GitHub social previews
- LinkedIn project posts
- visual regression testing
- documentation figures
- comparing lens-model perturbations

The FrameGrid is not a video exporter yet. It is deliberately designed as a static, shareable, citation-friendly scientific visualisation.

## Implementation entry points

- `packages/physics-core/src/animation.ts`
- `packages/physics-core/src/frame.ts`
- `apps/web/src/main.tsx`
- `python/cosmiclens_validate/framegrid.py`
