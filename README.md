# Qianhua Ge — A World of Work

A first-person, browser-based portfolio journey built on the original Three.js site. No character model is rendered.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. `npm run build` produces a static `dist/` directory; `npm test` validates the journey graph, all original project records and artwork, chapter geometry, collision boundaries, route finding, transit construction and local module resolution.

The checkout also runs directly on a static host: the required Three.js modules are committed under `vendor/`. No runtime CDN dependency or API key is required. The Three.js version remains 0.170.0, as in the original portfolio.

## Journey

Shanghai → Metro Line 2 → Pudong Airport → flight to SFO and Berkeley transfer → UC Berkeley → BART through Oakland → San Francisco → Caltrain → Redwood City → SFO/Stockholm flight → Croatia yacht.

Nine side trips preserve the remaining portfolio locations: Shenzhen, Taipei, Washington (the original Seattle coordinates), Palo Alto, Sacramento, Dubai, New York City, Dublin and Rome. These are stylized environments, not navigational reconstructions or claims about real airline schedules.

- WASD: walk; Shift: run; drag: look; E: interact; J: journey.
- Arrow keys: forward/back and turn. Free look enables optional pointer lock; Escape releases it.
- Touch: directional pad and drag to look.
- Guide me there: find a walkable route to the departure point.
- The journey journal permits direct travel; Works provides immediate access to every project.
- Visited places and discoveries are stored on this device only. Corrupt/blocked storage falls back safely.
- Ambient sound is opt-in. Reduced motion disables camera bob, foliage motion and moving water and shortens transit.
- Work and journey dialogs remain available if WebGL initialization is unavailable.

## Files

- `src/projects.js`: the original 18 records, links and coordinates, now using verified local artwork.
- `src/journey.js`: chapter content, itinerary, collision logic and A* path finding.
- `src/world.js`: instanced geometry, physical exhibits, city landmarks, foliage, transport and yacht scenes.
- `src/rendering.js`: reflection/refraction water, wave normals and restrained bloom.
- `script.js`: input, progress, navigation and accessible portfolio dialogs.

## Art and provenance

Project artwork was copied from the exact URLs in the original repository into `images/projects/`. Original local Divly and Metaval images are retained. Project descriptions intentionally do not invent roles or achievements.

Three original textures were generated using the built-in image generation tool and visually inspected:

- `images/materials/foliage.png`: transparent painterly plane-tree leaf cluster with fine branches, varied green leaves and transparent gaps, for intersecting foliage cards.
- `images/materials/limestone.png`: seamlessly tileable worn warm-gray limestone paving, top-down diffuse material, rectangular blocks with subtle moss and weathering.
- `images/materials/plaster.png`: seamlessly tileable warm ivory sandstone/plaster, diffuse granular weathering with no windows or lighting gradients.

The procedural scene is an independent interpretation of the requested art direction. It is not a reproduction of the reference videos, and the automated checks do not establish visual parity with those examples. Commercial game-level environment fidelity would need further art direction, bespoke modeled assets and device/browser performance review.

Vendored Three.js source and its MIT license are under `vendor/`. `scripts/vendor.mjs` copies the exact required official modules and adds a disposal hook to Water2 for its internal reflection/refraction targets.

## Review and deployment

The redesign is on `feat/first-person-journey`; the original repository's `main` is untouched. The Sites review destination is private; publishing to qianhuage.com is a separate step.
