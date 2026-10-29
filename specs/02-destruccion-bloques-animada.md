# SPEC 02 — Destrucción de bloques con animación

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-29
> **Objetivo:** Al ser golpeado, cada bloque reproduce su animación de explosión de 4 frames (`EXPLOSION_FRAMES`) en su posición antes de desaparecer del todo.

---

## Alcance

**Dentro:**

- Animación de explosión con los sprites de explosión que ya existen en `assets/spritesheet-breakout.png`, indexados por `EXPLOSION_FRAMES[color]` en `assets/spritesheet.js` (4 frames de 32x16 por color, columnas `sx` 256, 288, 320 y 352).
- Ninguna imagen nueva ni dibujo procedural: solo el spritesheet existente.
- Cada frame dura `EXPLOSION_DURATION` (150 ms); la animación completa dura 600 ms.
- La explosión se dibuja en la posición y tamaño del bloque (60x30).
- El tiempo se mide con el timestamp de `requestAnimationFrame` (ms).
- El bloque deja de ser sólido en el instante del golpe; la explosión es solo visual.
- Varias explosiones simultáneas e independientes.
- Los bloques `gray` usan los frames rojos, tal como vienen en `EXPLOSION_FRAMES.gray`.
- Nueva fase `clearing`: al romper el último bloque la bola se congela y el overlay de victoria aparece cuando terminan todas las explosiones.
- `resetGame()` vacía las explosiones en curso.

**Fuera de alcance (para specs futuras):**

- Sonidos (`break-sound.mp3`, `ball-bounce.mp3`).
- Partículas, sacudida de pantalla u otros efectos.
- Animación de pérdida de vida, de la bola o del paddle.
- Sprites de explosión propios para `gray`.
- Bloques con varios golpes, niveles, pausa, persistencia.

---

## Modelo de datos

```js
// src/game.js — se añade a state
const state = {
  phase: 'ready',        // 'ready' | 'playing' | 'clearing' | 'won' | 'lost'
  // ...resto igual que en SPEC 01
  explosions: [/* { x, y, w, h, color, start } */],
};
```

Convenciones:

- `start` es el timestamp de `requestAnimationFrame` (ms) del frame en que se golpeó el bloque.
- Índice de frame: `Math.floor((now - start) / EXPLOSION_DURATION)`; cuando llega a 4 la explosión se elimina del array.
- Los frames se dibujan con `drawFrame(ctx, EXPLOSION_FRAMES[color][i], x, y, w, h)` de `assets/spritesheet.js`, que recorta del spritesheet ya cargado por `loadSpritesheet`.
- `CONFIG` no cambia: se usan las constantes globales `EXPLOSION_FRAMES` y `EXPLOSION_DURATION`.
- Fase `clearing`: la bola no se mueve, no hay colisiones y el input de acción se ignora.

---

## Plan de implementación

1. Pasar el timestamp de `requestAnimationFrame` de `loop(now)` a `update(now)` y `render(now)`, y añadir `state.explosions = []` (también en `resetGame()`). Prueba manual: el juego se comporta igual que antes y no hay errores en consola.
2. En `bounceOnBricks()`, al destruir un bloque, añadir `{ x, y, w, h, color, start: now }` a `state.explosions`. Prueba manual: en consola, `state.explosions.length` crece al romper bloques.
3. Dibujar las explosiones en `render()` después de los bloques y antes del paddle, con `drawFrame` y el frame según el tiempo transcurrido; eliminar las terminadas. Prueba manual: cada bloque golpeado muestra 4 frames y desaparece en ~600 ms.
4. Añadir la fase `clearing`: al romper el último bloque se pasa a `clearing` en vez de `won`; la bola se congela; cuando `state.explosions` queda vacío se pasa a `won`. `handleAction()` ignora `clearing`. Prueba manual: tras el último bloque se ve su explosión completa y luego aparece el overlay de victoria.

---

## Criterios de aceptación

- [ ] Al golpear un bloque se reproducen en su posición sus 4 sprites de explosión del spritesheet (`EXPLOSION_FRAMES[color]`), y después no queda nada dibujado.
- [ ] No se añade ningún archivo de imagen nuevo a `assets/`.
- [ ] Cada frame se muestra ~150 ms y la animación completa dura ~600 ms.
- [ ] La duración es la misma con monitores de 60 Hz y de 120/144 Hz.
- [ ] La bola atraviesa la zona de un bloque que está explotando sin rebotar.
- [ ] Puntaje y rebote ocurren en el instante del golpe, no al terminar la animación.
- [ ] Dos o más bloques golpeados seguidos explotan a la vez, cada uno con su propio ritmo.
- [ ] Un bloque `gray` explota con los frames rojos.
- [ ] Al romper el último bloque la bola se detiene, se ve su explosión completa y después aparece el overlay de victoria.
- [ ] Durante `clearing` no se puede perder una vida y Espacio o clic no hacen nada.
- [ ] Perder una vida no interrumpe las explosiones en curso.
- [ ] Reiniciar la partida no deja explosiones a medias en pantalla.
- [ ] No se reproduce ningún sonido.
- [ ] El juego sigue abriéndose con doble clic (`file://`) sin errores en consola.

---

## Decisiones tomadas y descartadas

- **Sí:** reutilizar los sprites de explosión de `assets/spritesheet-breakout.png` vía `EXPLOSION_FRAMES` y `drawFrame`. El asset ya existe y mantiene el estilo visual.
- **No:** imágenes nuevas, partículas o explosiones dibujadas con primitivas de canvas.
- **Sí:** `EXPLOSION_DURATION` (150 ms) por frame, 600 ms en total. 150 ms totales son ~9 frames a 60 fps y apenas se perciben.
- **No:** 150 ms como duración total de la animación.
- **Sí:** el bloque deja de ser sólido al instante (`alive = false`). La física de SPEC 01 no cambia.
- **No:** bloque sólido mientras explota. Cambia la jugabilidad y complica la colisión.
- **Sí:** array `state.explosions` separado de `state.bricks`. Separa física y animación.
- **No:** campo de animación dentro de cada bloque.
- **Sí:** timestamp de `requestAnimationFrame` en ms. Coincide con la unidad de `EXPLOSION_DURATION` y no depende de la frecuencia del monitor.
- **No:** contador de frames. Variaría la duración con monitores de 120/144 Hz.
- **Sí:** fase `clearing` con la bola congelada antes de `won`. Evita perder una vida tras haber ganado y deja ver la última explosión.
- **No:** mostrar la victoria al instante. El overlay taparía la última explosión.
- **Sí:** `gray` usa los frames rojos de `EXPLOSION_FRAMES.gray`, sin tocar assets.
- **No:** desvanecer el sprite gris como alternativa.
- **No:** sonido de rotura en esta spec. Va junto con `ball-bounce.mp3` en una spec de sonido.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Al volver de una pestaña en segundo plano el salto de tiempo hace que las explosiones terminen sin verse | Aceptable: solo se pierde el efecto visual, el estado del juego es correcto. |
| Explosiones de la partida anterior siguen tras reiniciar | `resetGame()` vacía `state.explosions`. |
| Quedarse en `clearing` para siempre si una explosión no se elimina | Eliminar explosiones por tiempo (`now - start >= 4 * EXPLOSION_DURATION`), no por frame dibujado. |
| Los frames de 32x16 se ven borrosos al escalar a 60x30 | Mantener `imageSmoothingEnabled = false`, como en SPEC 01. |

---

## Lo que **no** está en esta spec

- Sonidos y música.
- Partículas, sacudida de pantalla u otros efectos.
- Animaciones de la bola, el paddle o la pérdida de vida.
- Sprites de explosión propios para `gray`.
- Niveles, pausa, persistencia y power-ups.
