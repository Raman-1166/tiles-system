# ADR 0002: Procedural Canvas Textures & GLB 3D Rendering Architecture

## Status

Accepted

## Context

High-resolution ceramic tiles require intricate visual variation: glaze specular highlights, grout line thickness, roughness, and pattern repetition. Storing thousands of individual high-res image files incurs heavy network latency and CDN bandwidth costs.

## Decision

1. Use client-side procedural HTML5 Canvas texture generation (`proceduralTiles.ts` and `tileArt.ts`) for real-time rendering of tile surfaces in Three.js and catalog cards.
2. Pair procedural tile materials with real binary glTF (`.glb`) furniture models (`armchair.glb`, `coffee-table.glb`, `bookshelf.glb`, `floor-lamp.glb`) for realistic room scaling and soft shadow casting.
3. Integrate Google Model Viewer for zero-install Augmented Reality (AR) on supported iOS (Quick Look) and Android (Scene Viewer) mobile devices.

## Consequences

- **Positive:** Zero image network payload for tile patterns; instant color and finish variations in real-time.
- **Positive:** True 3D depth and realistic shadow caster interaction in the Room Visualizer.
- **Trade-off:** Client GPU is utilized for initial canvas and WebGL shader compilation; mitigated via hardware tier checks and fallback images on low-power devices.
