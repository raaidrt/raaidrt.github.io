---
title: "Platonic Solids"
description: An interactive WebGPU visualization of the five Platonic solids with depth-based edge coloring.
featured: true
expandable: true
order: 1
---

The five Platonic solids are the only convex regular polyhedra: tetrahedron, cube, octahedron, dodecahedron, and icosahedron. Each solid is rendered with spheres at vertices and cylinders for edges, colored based on depth—cyan for near parts, purple for far parts.

<div id="platonic-container" style="width: 100%; height: 400px; margin: 2rem 0; border-radius: 8px; overflow: hidden;"></div>

<script type="module">
import { initPlatonicSolids } from '../animations/platonic-solids.js';
initPlatonicSolids('platonic-container');
</script>
