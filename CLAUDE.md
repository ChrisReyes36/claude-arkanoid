# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Playable Arkanoid ("Juego de Arkanoid") built with plain **HTML, CSS and JavaScript and zero dependencies**. Run it by opening `index.html` in a browser. There is no `package.json`, build, lint or test tooling: don't invent commands, and don't introduce npm packages, frameworks or bundlers. (`README.md`, in Spanish, still says "not implemented yet"; it is outdated.)

Specs 01–04 are all `Implementado`: MVP (paddle, ball, bricks, 3 lives, score, win/lose overlay), animated brick destruction, bounce/break sounds, and levels by score (level up every 150 points, max 10, with HUD level, banner, per-level color, pause menu to start from a level).

## Code layout

- `index.html`: a single `<canvas id="game" width="800" height="600">`; loads `assets/spritesheet.js` then `src/game.js` via plain `<script>` tags (no modules). Keep that order.
- `style.css`: page/canvas styling only.
- `src/game.js`: all game code (one file, ~470 lines). Top-down: `CONFIG` (all tunables, incl. `levels`), `state` (single mutable game state), sounds, `LEVEL_SHAPES`, brick creation/reset, input and pause menu, collisions, HUD/banner/overlay drawing, `update(now)` / `render(now)` / `loop(now)`. New tunables go in `CONFIG`, new runtime data in `state`.
- Style of existing code: 2-space indent, single quotes, spaces inside call parentheses (`playSound( name )`), identifiers in English, user-facing text and comments in Spanish.

## Assets

- `assets/spritesheet-breakout.png` is the single spritesheet. `assets/spritesheet.js` is a plain script (no modules/exports) declaring globals that index into it by pixel rect (`sx, sy, sw, sh`): `SPRITES` (paddle, ball, and `blocks` by color) and `EXPLOSION_FRAMES` (4 frames per color) with `EXPLOSION_DURATION` (150).
- Block colors: red, cyan, green, magenta, yellow, hotpink, gray. Note `EXPLOSION_FRAMES.gray` reuses the red frames.
- `assets/sounds/`: `ball-bounce.mp3`, `break-sound.mp3`.

## Spec-driven workflow

All feature work follows spec-driven development. Specs live in `specs/` as `NN-slug.md` (currently `01-mvp-jugable`, `02-destruccion-bloques-animada`, `03-sonidos-rebote-y-rotura`, `04-niveles-por-puntaje`). The spec is the contract: **write or update the spec first, then implement what it says**; don't improvise features that aren't in a spec.

Skills (installed from `Klerith/fernando-skills`, pinned in `skills-lock.json`; copies in `.agents/skills/` and `.claude/skills/`). Both are `disable-model-invocation`, so they only run when the user invokes them explicitly:

- `/spec <description>`: interactive spec designer. Reads this file, `README.md` and the latest specs, asks clarifying questions in blocks of 3–5 (scope, data, integration, UX, risks), then writes `specs/NN-slug.md` as `Borrador`. **Writes no code**, and never marks a spec as Approved. Replies in the language of the prompt.
- `/spec-impl <NN-spec-name>`: implements a spec only if its state means "Approved". Creates/switches to branch `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`, currently `true`), shows the spec summary, then implements one plan step at a time, pausing for diff review. **Never commits on its own.** Out-of-scope requests are deferred to a new spec.

Lifecycle: `Borrador` → `En revisión` → `Aprobado` → `Implementado` (or `Obsoleto`). The human changes Draft → Approved; after verifying the acceptance criteria, the state becomes `Implementado`.

### Spec format (match existing specs; written in Spanish)

Header as a blockquote, then sections in this order (template: `.agents/skills/spec/template.md`):

```
# SPEC NN — Título corto
> **Estado:** ...
> **Depende de:** SPEC 01, ...
> **Fecha:** YYYY-MM-DD
> **Objetivo:** una sola oración.
```

`## Alcance` (**Dentro:** / **Fuera de alcance:**) · `## Modelo de datos` · `## Plan de implementación` (numbered steps, each leaves the game runnable) · `## Criterios de aceptación` (boolean checklist `- [ ]`) · `## Decisiones tomadas y descartadas` (Sí/No with reasons) · `## Riesgos identificados` (optional) · `## Lo que **no** está en esta spec`.

Rules: new spec number = highest existing + 1, zero-padded; kebab-case slug; date from `date +%F`, never guessed; concrete file/identifier names; no TODOs; no long code in specs; if a feature doesn't fit in one objective sentence, split it into several specs.
