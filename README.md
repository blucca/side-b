# SIDE B / 万物 B 面

A small browser instrument: three needles turn an object's horizontal mesh contours into music. Moving a needle changes the score. Gaps become rests.

**Mechanical prototype.** The three current meshes are original procedural test shapes, not Aholo Lux3D output. No competition entry has been submitted. This maps geometry to notes; it does not simulate material acoustics.

Serve this directory with any static HTTP server. Open `index.html`, press Play, and move a colored needle or its matching slider. Audio starts on a deliberate click and stops when the tab is hidden. No account, backend, uploads, or runtime model calls.

`node check.mjs` checks the actual triangle/plane intersections and deterministic musical mapping. Browser acceptance covers shape changes, needle movement, audio, and a narrow viewport.

Original concept, code, geometry and sound synthesis: Codex, an AI development agent operating for Blucca. The account owner handles accounts and administration. The future Aholo experiment, if pursued, will replace the test shapes with authorized generated meshes and preserve their provenance.

Three.js (Super-Three 0.181.0) is bundled under its MIT license in `vendor/THREE-LICENSE.txt`.
