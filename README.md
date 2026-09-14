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
- Touch devices have an analogue joystick: push a little to walk, fully to run. Use Jump with the other thumb. Drag the scene to turn and pinch to zoom the planet. Page zoom is disabled during the game.

Start on Mars. Press **Ground** to meet Pip and collect Aqua crystals. Use the rocket and the solar-system map to choose another world. Autopilot completes the entire journey: it leaves the rover, returns to the rocket, launches, avoids the Sun and planets, and lands or docks automatically. Move manually or use **Stop autopilot** to take over. Deliver crystals to the mothership for supply credits, a larger bag and a collection magnet.

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

The rocky worlds are continuous spherical play spaces, so there is no rectangular world edge. Giant planets have no solid surface: walking and driving happen on visibly manufactured floating stations. Each giant has nine islands with lit jump lanes. Rovers brake at platform edges; walk and jump to explore the other islands. Pip follows the safe island paths, and a safety pack returns a fallen explorer to the last safe point without losing crystals. Earth uses buoyant movement over water. Vehicles have emergency movement when fuel runs out and the pause menu can return you safely to your rocket.

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

## Version 2.1

- Analogue tablet joystick, simultaneous jump/camera controls, stable pinch gestures and safe-area layouts.
- Complete, cancellable autopilot with automatic arrival and obstacle-clear flight paths.
- Nine cloud islands per gas/ice giant, reachable jump gaps, rover edge brakes and safe fall recovery.
- Earth close-up material detail, smooth water, and preserved whole-globe geography.
- Instanced rocks and crystals, lower tablet shadow cost and instance-buffer cleanup on planet changes.
- Game-only pinch/wheel zoom; page zoom and accidental post-pinch movement prevented.

The automated suite covers 1,000 navigation/physics regressions plus scenes, input and asset checks. A cloud browser could not create a WebGL context, so no claim of real-iPad or full 3D visual playtesting is made.

## Version 2.2

- Pip follows at a proportional speed with eased movement animation and orientation. Character self-shadows are disabled to reduce moving surface shimmer; ground shadows remain.
- Cloud-station floors have separated depth layers and trim no longer produces tiny unstable shadows.
- Optional **Crystal Sprint**: five minutes of active play, 10 points per delivered crystal and a one-time 20-point bonus for each delivered colour. Bronze, Silver and Gold targets are 150, 400 and 800 points.
- **Quiz ⚡**: 16 space and Scratch questions. Each correct answer adds 25 percentage points to suit, rover and rocket supplies (capped at 100), plus 5 supply credits. Five newly collected crystals unlock the next question; sprint rounds allow four attempts.
- Questions and menus pause gameplay and the sprint clock. Closing an unanswered card preserves it. Repeated taps cannot award twice.
- Sprint rounds begin with equal default gear on Mars and preserve the player's exploration session. The best score is stored only in this browser on this device, without names or accounts. It is a turn-taking classroom challenge, not an online leaderboard.

The 2.2 checks include navigation, joystick/pinch input, actual Three.js scene construction, follower movement, question rewards, score boundaries, and UI callbacks with a simulated DOM and renderer. These tests do not establish live-browser rendering or real-iPad visual quality. The development browser environment was unavailable during this update; visual playtesting remains outstanding.
