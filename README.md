# Qianhua Ge — A World of Work

A first-person, browser-based portfolio journey built on the original Three.js site. No character model is rendered. The UI is strictly monochrome and the opening view goes straight into the scene: a small QG mark and one menu button; location and control hints fade away.

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
- Arrow keys: forward/back and turn. Free look enables optional pointer lock; Escape releases it or opens the menu. All navigation, sound, guidance and instructions are in the menu. There is no intro card, minimap, persistent quest panel, or persistent chapter text.
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
- `src/rendering.js`: HDR environment lighting, reflection/refraction water, analytic waves, Fresnel reflection, sunlight highlights, contact occlusion and restrained bloom.
- `src/bund.js`: reference-based heritage buildings, instanced arches/columns/cornices, terracotta brick and carved stone materials, granite promenade and garden.
- `src/atmosphere.js`: selective planar puddle reflections and slow soft cloud layers.
- `src/architecture.js`: continuous curved tower surfaces, Oriental Pearl glazing and ribs, Shanghai Tower twist, World Financial Center opening, and the opposite riverbank.
- `script.js`: input, progress, navigation and accessible portfolio dialogs.

## Art and provenance

Project artwork was copied from the exact URLs in the original repository into `images/projects/`. Original local Divly and Metaval images are retained. Project descriptions intentionally do not invent roles or achievements.

Original generated materials are preserved below. The paving now uses a photographed CC0 material set (diffuse, OpenGL normal, roughness and AO); the sky uses an actual HDR panorama. Exact source URLs and authors are in `images/pbr/sources.json`: [Cobblestone Floor 08 by Rob Tuytel](https://polyhaven.com/a/cobblestone_floor_08) and [Qwantani Morning by Jarod Guest](https://polyhaven.com/a/qwantani_morning_puresky). These files are local runtime assets. Shanghai now uses large rectangular stone flags rather than cobblestones, with view-dependent puddle reflections. Its red brick, ashlar and granite sets are also photographed CC0 Poly Haven assets, recorded in `images/pbr/bund-sources.json`.

Three original textures were generated using the built-in image generation tool and visually inspected:

- `images/materials/foliage.png`: transparent painterly plane-tree leaf cluster with fine branches, varied green leaves and transparent gaps, for intersecting foliage cards.
- `images/materials/limestone.png`: seamlessly tileable worn warm-gray limestone paving, top-down diffuse material, rectangular blocks with subtle moss and weathering.
- `images/materials/plaster.png`: seamlessly tileable warm ivory sandstone/plaster, diffuse granular weathering with no windows or lighting gradients.

Shanghai’s heritage frontage uses independently modeled, compressed interpretations of the [Swatch Art Peace Hotel](https://www.swatch-art-peace-hotel.com/en/building), [Customs House](https://www.citynewsservice.cn/articles/shanghaidaily/news/iconic-customs-house-opens-to-public-for-urban-art-season-7kr59own), [former HSBC Building](https://dreamofacity.com/2014/08/11/a-tour-of-the-shanghai-bund-%E4%B8%8A%E6%B5%B7%E5%A4%96%E7%81%98/10-bund-12-hsbc-1923/), [Peace Hotel](https://commons.wikimedia.org/wiki/File:Peace_Hotel_Shanghai.JPG), and a consulate garden. Reference photographs informed silhouettes and façade details; they are not runtime assets. Google Street View/Earth imagery is not imported. Distances and the order of adjacent buildings are compressed for the journey, not a geographic reconstruction.

The procedural scene is an independent interpretation of the requested art direction. It is not a reproduction of the reference videos, and the automated checks do not establish visual parity with those examples. Commercial game-level environment fidelity would need further art direction, bespoke modeled assets and device/browser performance review.

Vendored Three.js source and its MIT license are under `vendor/`. `scripts/vendor.mjs` copies the exact required official modules and adds a disposal hook to Water2 for its internal reflection/refraction targets.

## Review and deployment

The redesign is on `feat/first-person-journey`; the original repository's `main` is untouched. The Sites review destination is private; publishing to qianhuage.com is a separate step.
