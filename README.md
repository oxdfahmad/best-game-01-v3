# ORRERY — Light the Nine Dials

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

You are the keeper of a clockwork orrery on a deep-indigo star chart. Starlight
pours in from the four corners — bend it with drag-able mirror satellites,
burn the void moths in it, and light all nine sundials before the final dawn.
Seven nights. Six relics. One boss: THE ECLIPSE, who eats your beams.

## How to play

- **Aim a mirror:** drag it with the mouse — the beam bends where it points
- **Build:** press **1** prism (splits a beam in two) · **2** lens (beam ×2.5) ·
  **3** pillar (blocks moths), then click the chart to place it
- **Flare:** **SPACE** — a nova burst around the heart that burns nearby moths
- **P** pause · **M** mute · **R** restart on the end screens

Beams charge dials (2.6s of light lights one) and burn moths on contact.
Moths crawl in from the edges, latch onto lit dials and drain them, or bite
the heart — three hits and the chart goes dark. Kills earn gears and build
your combo (up to ×8). Clear a night to pick one of six relics, then face the
next night. **WIN:** all nine dials lit by the end of night 7. **LOSE:** the
heart takes 3 hits, or dawn finds dials dark.

## Run it

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to the
output directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`.

## Files

- `game/index.html` — the page; loads the game as ES modules
- `game/src/orrery-config.js` — tuning: nights, moths, costs, relics, grades
- `game/src/orrery-state.js` — the state object and its pure helpers
- `game/src/orrery-beams.js` — beam ray tracing: reflect, split, boost, absorb
- `game/src/orrery-moths.js` — moth AI, latching, feeding, and the boss
- `game/src/orrery-input.js` — mouse + keyboard: drag, build, flare, pause
- `game/src/orrery-render.js` — all canvas drawing: field, HUD, screens
- `game/src/orrery-audio.js` — WebAudio synth effects (no audio files)
- `game/src/orrery-rng.js` — seeded RNG (mulberry32) for deterministic runs
- `game/src/orrery-main.js` — the loop, win/lose, relics, and `?shot=` states
- `screenshots/` — 1-play (cover), 2-title, 3-win, 4-lose, real renders of
  this game's own code in a browser, taken with `?shot=<name>&seed=1`
