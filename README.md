# Pip and the Solar System

A colourful 3D exploration game for children. Explore with Pip the alien, drive your rover, fly between all eight planets and collect eight crystal colours.

## Publish the public game

The complete game is ready in `docs/` for GitHub Pages. In this repository open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/docs**, then **Save**. GitHub will build the public site automatically.

Expected address after Pages is enabled:
https://moonbadger13.github.io/Pip-and-the-solar-system/

No ChatGPT account or game sign-in is required. The game makes no external API requests and all runtime artwork and scripts are stored in this repository.

## Play

- **WASD / arrows:** walk or drive. **Shift:** run or rover turbo.
- **Space:** jump on foot or boost in space. **E:** enter, exit, launch, land or dock.
- **R / F:** rise or descend in space. **M:** solar-system map.
- **Mouse wheel / + / −:** smoothly zoom from ground level to a whole planet.
- **Right-drag:** rotate the view. **Ground / Globe:** jump between camera views. **Spin:** turn whole-planet rotation on/off.
- **Left-click:** move to a surface point, or select a destination in space.
- Touch devices have movement buttons, camera drag and pinch zoom.

Start on Mars. Press **Ground** to meet Pip and collect Aqua crystals. Use the rocket and the solar-system map to choose another world. A course reaches the planet's arrival zone; press **E** to land. Deliver crystals to the mothership for supply credits, a larger bag and a collection magnet.

Progress lasts for the current page session. Refreshing starts a new expedition.

## Eight destinations

| Planet | Crystal colour | Exploration |
|---|---|---|
| Mercury | Amber | Cratered rocky globe, almost airless |
| Venus | Rose | Rocky terrain under dense cloud cover |
| Earth | Emerald | Textured Earth with oceans, clouds and a blue rim |
| Mars | Aqua | Rusty terrain and a thin dusty atmosphere |
| Jupiter | Sunstone | Fictional floating research station above the cloud bands |
| Saturn | Amethyst | Fictional cloud station with a view of the rings |
| Uranus | Mint | Fictional cloud station above pale blue-green haze |
| Neptune | Sapphire | Fictional cloud station above blue-green clouds |

The rocky worlds are continuous spherical play spaces, so there is no rectangular world edge. Giant planets have no solid surface: walking and driving happen on visibly manufactured floating stations. Earth uses buoyant movement over water. Vehicles have emergency movement when fuel runs out and the pause menu can return you safely to your rocket.

## Science and artistic licence

Planet order and orbital-size labels in AU follow NASA/JPL. Distances and sizes are compressed, positions are illustrative rather than live, and the display spin is for exploration rather than real-time physical rotation. Visible atmospheric thickness is exaggerated. Earth shows its five main layers; the other worlds show their own simplified atmosphere regions. Mercury has only a sparse exosphere and no visible cloud shell.

Crystal types, safe spacesuits, rover capabilities and floating cloud stations are game inventions. The mothership near Mars is fictional; the real ISS orbits Earth. Jump acceleration is adjusted for play, not a gravity simulation. Neptune's texture is colour-corrected towards a paler blue-green appearance.

NASA sources:
- https://science.nasa.gov/solar-system/planets/
- https://ssd.jpl.nasa.gov/planets/approx_pos.html
- https://science.nasa.gov/mercury/facts/
- https://science.nasa.gov/venus/venus-facts/
- https://science.nasa.gov/earth/facts/
- https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/
- https://science.nasa.gov/mars/facts/
- https://science.nasa.gov/jupiter/jupiter-facts/
- https://science.nasa.gov/saturn/facts/
- https://science.nasa.gov/uranus/facts/
- https://science.nasa.gov/neptune/neptune-facts/
- https://www.nasa.gov/international-space-station/space-station-facts-and-figures/

## Development

Static HTML/CSS/ES modules; no dependency installation or build is required. Serve `dist/` with any static HTTP server. The game requires a modern browser with WebGL enabled.

Run `npm test` to verify mechanics, scene construction and asset references. These are code-level tests; they do not replace visual browser testing.

`dist/` contains the game source and assets. `docs/` is the matching GitHub Pages publication copy. After making changes, copy the contents of `dist/` into `docs/` before committing. GitHub stores identical files as the same blobs, so the two paths do not duplicate asset storage internally.

## Credits

Planet textures by **Solar System Scope**, licensed under **CC BY 4.0**:
https://www.solarsystemscope.com/textures/
https://creativecommons.org/licenses/by/4.0/

Original texture files are unchanged. The game applies lighting, Neptune colour correction, and a rotated Earth longitude to place its landing zone on land. Source/mirror links and checksums are in `texture-sources.json`. Title illustration is AI-generated. Live characters, vehicles and stations are articulated Three.js game models.

Three.js 0.180.0 is vendored under the MIT license in `dist/vendor/THREE-LICENSE.txt`.
