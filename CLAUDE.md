# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Goal (per `README.md`, written in Spanish): build a playable Arkanoid game ("Juego de Arkanoid") with plain **HTML, CSS and JavaScript and zero dependencies**, so people can play it. The README states it is **not implemented yet**.

Currently there is no game code, no `package.json`, no build/lint/test tooling, and the directory is not a git repository. Only assets and spec-driven-workflow skills exist. Don't invent build or test commands, and don't introduce npm packages, frameworks or bundlers; the game should run by opening an HTML file in the browser.

## Assets

- `assets/spritesheet-breakout.png` is the single spritesheet. `assets/spritesheet.js` is a plain script (no modules/exports) declaring globals that index into it by pixel rect (`sx, sy, sw, sh`): `SPRITES` (paddle, ball, and `blocks` by color) and `EXPLOSION_FRAMES` (4 frames per color) with `EXPLOSION_DURATION` (150). It must be loaded via a `<script>` tag before game code, or converted if modules are adopted.
- Block colors: red, cyan, green, magenta, yellow, hotpink, gray. Note `EXPLOSION_FRAMES.gray` reuses the red frames.
- `assets/sounds/`: `ball-bounce.mp3`, `break-sound.mp3`.

## Spec-driven workflow

Project skills live in `.agents/skills/` (installed from `Klerith/fernando-skills`, pinned in `skills-lock.json`):

- `/spec <description>`: interactive spec designer; writes specs to `specs/` (numbered `NN-name`), no code. Replies in the language of the prompt. Uses `.agents/skills/spec/template.md`.
- `/spec-impl <NN-spec-name>`: implements an *approved* spec; creates a git branch named after the spec (configurable via `specs/.spec-config.yml`) and works step by step. Requires a git repo, which doesn't exist yet.

Both are `disable-model-invocation`, so they only run when the user invokes them explicitly. Specs should match the language and headings of existing specs in `specs/`.
