# Viewport visualisation policy

The central viewport separates scientific layers from interface ambience.

Scientific layers use the shared physics core:

- lensed surface brightness;
- magnification, parity, source-coordinate and Fermat maps;
- critical curves and mapped caustics;
- optional ray-shooting arrows from each sampled image coordinate `theta` toward `beta(theta)`.

The former procedural warp grid was removed because its animated sinusoidal deformation was not derived from the active lens model. Motion is restricted to interface transitions and preset-card feedback, while the lens canvas is driven by the physical renderer.

The star field, dust, scan lines and central glow are interface context only. They must never be interpreted as observed source morphology, a simulated mass map, or an additional data layer.
