Decoherence Runner (karmicprotocol-site)
A minimal, fast lane‑runner about observation, collapse, and flow — built with Phaser 3, plain JS modules, and no build step. Runs as a static site.

Title: Decoherence Runner
Engine: Phaser 3.70 (CDN)
Stack: Vanilla JS modules, Web Audio API, Arcade physics
Entry: index.html
Features
Four-lane runner with jump, lane‑switching, near‑miss scoring, and “phase mode”
Difficulty tiers that scale speed, density, and audio layers
Responsive scaling and HUD overlays for loading, start, and game‑over
Procedural visuals (no external art assets) and lightweight audio synth
Zero build tooling; ships as a static site
Controls
Change row: Swipe up/down, W/S, or ↑/↓ (A/D and ←/→ also work)
Hop (lateral): Tap/click or Space (hold for longer)
Start/Restart: Tap/click button or Enter/Space on overlays
See index.html (line 1) for HUD and overlay elements and js/playScene.js (line 1) for input wiring and gesture handling.

Quick Start
Because ES modules and the Phaser CDN are used, run via a local web server (not file://):

Python 3: python -m http.server 5173
Node.js (http-server): npx http-server . -p 5173
Node.js (serve): npx serve -l 5173
Bun: bunx serve -p 5173
Then open http://localhost:5173 in a modern desktop or mobile browser.

Notes:

Audio requires a user gesture; click “Start” before expecting sound.
The game fetches Phaser from a CDN; ensure you’re online or vendor it locally (see “Offline/No‑CDN”).
Project Structure
index.html (line 1) — Bootstraps Phaser, loads JS modules, and defines HUD/overlays.
css/style.css (line 1) — Styles for HUD, overlays, and visuals.
js/main.js (line 1) — Game bootstrap, scene setup, resize handling, global error handlers.
js/bootScene.js (line 1) — Lightweight loader scene that transitions to play.
js/playScene.js (line 1) — Core game loop: lanes, spawning, scoring, flow/phase mode, collisions, HUD updates.
js/playerController.js (line 1) — Player movement state machine (lane switching, jump, hitstun).
js/audioManager.js (line 1) — Procedural synth layers (pad, arp, noise) via Web Audio.
js/gameState.js (line 1) — UI overlays, state transitions (loading, ready, playing, gameover).
js/constants.js (line 1) — Tunables (lanes, base speed, spacing, target FPS, player Y ratio).
Gameplay and Systems
Lanes and movement
4 lanes, fixed spacing scaled to viewport (js/constants.js (line 1)).
Lane switches tween quickly; jump is physics‑lite with gravity/impulse (js/playerController.js (line 1)).
Scoring and flow
Score accumulates with distance; near‑misses increase a flow multiplier.
Max flow triggers “phase mode” with visual/auditory feedback and temporary safety window.
Difficulty tiers
Tiers rise over time and add audio layers and spawn complexity.
Obstacles and “hard air”
Patterns draw from a tier‑gated bank; positions adapt to viewport and player lane.
Audio
Minimal synth built with Web Audio nodes; layers adjusted by tier (js/audioManager.js (line 1)).
Development
No build tools are required. Edit files and refresh.

Start a server (examples in Quick Start).
Edit JS/CSS and refresh; modules load directly from index.html (line 1).
Errors surface via the top overlay and the dev console (js/gameState.js (line 1), js/main.js (line 1)).
Hot tips:

Constants for quick tuning live in js/constants.js (line 1).
Procedural textures are generated at runtime (js/playScene.js (line 1)).
Browser Support
Modern Chromium, Firefox, and Safari with ES module support.
Web Audio is required for sound; falls back to webkitAudioContext where necessary.
Mobile supported; uses responsive scaling and touch gestures.
Troubleshooting:

“Audio not playing”: ensure you clicked “Start” (user gesture), and the tab isn’t muted.
“Module/CORS errors”: serve over HTTP (see Quick Start) and avoid file://.
“Blank screen”: check console for errors; CDN may be blocked offline.
Deployment
Any static host works (GitHub Pages, Netlify, Vercel, S3, Cloudflare Pages).

Root should serve index.html and the js/ and css/ folders.
No server‑side routes are required.
GitHub Pages quick steps:

Push to main (or docs/) and enable Pages for the branch.
Ensure the project root (or docs/) is selected as the Pages source.
Offline/No‑CDN
Phaser currently loads from a CDN in index.html (line 1). To run fully offline:

Download phaser.min.js for version 3.70.x.
Place it in vendor/phaser.min.js.
Replace the <script> tag in index.html (line 1):
From: <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js" defer></script>
To: <script src="vendor/phaser.min.js" defer></script>
Contributing
Keep it build‑less and dependency‑free unless there’s strong justification.
Favor small, readable changes; keep the game loop tight and responsive.
Test on both desktop and touch devices when changing input or scaling.
Roadmap Ideas
Leaderboard (local and/or remote)
Visual polish: particles, lane effects, hit flashes
Additional patterns and enemy types
Settings: motion reduction, audio levels, color themes
PWA manifest for offline play (if Phaser is vendored)
