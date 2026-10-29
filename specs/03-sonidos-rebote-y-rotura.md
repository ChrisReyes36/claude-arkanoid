# SPEC 03 — Sonidos de rebote y rotura

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-29
> **Objetivo:** La bola reproduce `ball-bounce.mp3` al rebotar en paddle, paredes o techo y `break-sound.mp3` al romper un bloque, con volumen fijo y la tecla M para silenciar.

---

## Alcance

**Dentro:**

- `assets/sounds/ball-bounce.mp3` al rebotar en el paddle, en la pared izquierda, en la pared derecha y en el techo.
- `assets/sounds/break-sound.mp3` al romper un bloque. Ese rebote no reproduce además `ball-bounce.mp3`.
- Reproducción con `HTMLAudioElement`: un `Audio` precargado por sonido y `cloneNode()` en cada reproducción, para que golpes seguidos se solapen sin cortarse.
- Volumen fijo `CONFIG.sound.volume` (0.5) aplicado a ambos sonidos.
- Tecla M alterna sonido activado/silenciado en cualquier fase.
- Indicador `SILENCIO` en el HUD (centrado arriba) mientras está silenciado.
- El silencio no se guarda: al recargar la página el sonido vuelve a estar activado.
- Los errores de `play()` (autoplay bloqueado, archivo ausente) se ignoran sin romper el juego.

**Fuera de alcance (para specs futuras):**

- Música de fondo.
- Sonidos de perder vida, victoria, derrota o lanzamiento (no hay assets).
- Control de volumen en pantalla o deslizador.
- Persistencia de la preferencia de silencio (`localStorage`).
- Web Audio API, audio posicional o variación de tono.
- Botón de silencio clicable o soporte táctil.

---

## Modelo de datos

```js
// src/game.js
const CONFIG = {
  // ...resto igual que en SPEC 02
  sound: { volume: 0.5 },
};

const state = {
  // ...resto igual que en SPEC 02
  muted: false,
};

const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break: new Audio( 'assets/sounds/break-sound.mp3' ),
};
```

Convenciones:

- `playSound( name )` no hace nada si `state.muted`; si no, clona `SOUNDS[name]`, le aplica `CONFIG.sound.volume` y llama a `play()` capturando el rechazo de la promesa.
- `resetGame()` no toca `state.muted`: el silencio se mantiene entre partidas de la misma sesión.
- Como mucho un sonido por frame: si en el mismo frame la bola rompe un bloque y toca una pared, gana `break`.

---

## Plan de implementación

1. Añadir `CONFIG.sound`, `state.muted`, `SOUNDS` y `playSound( name )` en `src/game.js`, sin llamarla aún. Prueba manual: el juego se comporta igual y no hay errores en consola; `playSound('bounce')` en consola suena.
2. Llamar a `playSound('bounce')` en los rebotes de paredes y techo de `update()` y en `bounceOnPaddle()` cuando hay contacto. Prueba manual: cada rebote en paredes, techo y paddle suena.
3. Llamar a `playSound('break')` en `bounceOnBricks()` al destruir un bloque, y evitar que ese mismo frame suene también `bounce`. Prueba manual: romper un bloque solo produce el sonido de rotura; varios bloques seguidos se solapan sin cortarse.
4. Tecla M en el `keydown` (ignorando `e.repeat`) alterna `state.muted`; `drawHud()` dibuja `SILENCIO` centrado arriba cuando está activo. Prueba manual: M silencia y reactiva, y el indicador aparece y desaparece.

---

## Criterios de aceptación

- [ ] Rebotar en el paddle, la pared izquierda, la pared derecha o el techo reproduce `ball-bounce.mp3`.
- [ ] Romper un bloque reproduce `break-sound.mp3` y no reproduce `ball-bounce.mp3` en ese golpe.
- [ ] Dos bloques rotos en menos de medio segundo suenan ambos, sin que el segundo corte al primero.
- [ ] En fase `ready` (bola sobre el paddle) no suena nada.
- [ ] Ambos sonidos se oyen con el volumen de `CONFIG.sound.volume`; cambiar ese valor cambia el volumen.
- [ ] Pulsar M silencia todos los sonidos y muestra `SILENCIO` en el HUD; pulsarla otra vez los reactiva y oculta el indicador.
- [ ] M funciona en cualquier fase, incluidos los overlays de victoria y derrota.
- [ ] Reiniciar la partida no cambia el estado de silencio; recargar la página lo vuelve a activar.
- [ ] Mantener M pulsada no alterna el silencio repetidamente.
- [ ] Si se renombra un mp3, el juego sigue funcionando sin sonido y sin excepciones no capturadas.
- [ ] El juego sigue abriéndose con doble clic (`file://`) sin errores en consola.
- [ ] No se añade ningún archivo nuevo a `assets/`.

---

## Decisiones tomadas y descartadas

- **Sí:** `ball-bounce.mp3` en paddle, paredes y techo. Da feedback en todo rebote.
- **No:** sonido solo en el paddle. Paredes y techo quedarían sin feedback.
- **Sí:** al romper un bloque suena solo `break-sound.mp3`. Dos sonidos a la vez ensucian el golpe.
- **No:** reproducir ambos sonidos al romper un bloque.
- **Sí:** `HTMLAudioElement` con `cloneNode()`. Funciona en `file://` y permite solapar sonidos.
- **No:** reiniciar `currentTime` de un único `Audio`. Corta el sonido en golpes rápidos.
- **No:** Web Audio API. Cargar los mp3 con `fetch` falla en `file://` por CORS.
- **Sí:** tecla M para silenciar, con indicador en el HUD. Barato y útil para jugar en silencio.
- **No:** guardar el silencio en `localStorage`. Añade persistencia; va en otra spec si hace falta.
- **Sí:** volumen fijo en `CONFIG.sound.volume`. Un solo punto para ajustarlo.
- **No:** controles de volumen en pantalla.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El navegador bloquea el audio antes de una interacción del usuario (autoplay) | El primer sonido llega tras lanzar la bola con Espacio o clic; además `play()` captura el rechazo. |
| Muchos clones de `Audio` acumulados en golpes muy seguidos | Los clones no se guardan; el recolector los libera al terminar. Como mucho un sonido por frame. |
| Latencia perceptible de `HTMLAudioElement` en algunos navegadores | Aceptable para este juego; precargar los `Audio` al inicio reduce el retraso del primer sonido. |
| Rotura y rebote en pared en el mismo frame suenan dos veces | Regla de un sonido por frame con prioridad para `break`. |

---

## Lo que **no** está en esta spec

- Música de fondo.
- Sonidos de vida perdida, victoria, derrota o lanzamiento.
- Control de volumen en pantalla.
- Persistencia del silencio.
- Web Audio API y efectos de audio.
