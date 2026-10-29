# SPEC 04 — Niveles por puntaje

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03
> **Fecha:** 2026-10-29
> **Objetivo:** El nivel sube cada 150 puntos (hasta el 10), aumentando la velocidad de la bola y el ángulo de rebote del paddle, con el nivel visible en el HUD, un banner al subir y un color propio por nivel.

---

## Alcance

**Dentro:**

- Nivel calculado a partir del puntaje: `1 + floor(puntaje / 150)`, con tope en 10.
- La velocidad de la bola crece linealmente de 2.2 (nivel 1) a 4.2 (nivel 10).
- El ángulo máximo de rebote en el paddle crece linealmente de 60° (nivel 1) a 75° (nivel 10).
- Al subir de nivel la bola no se detiene: su velocidad se reescala en ese instante manteniendo la dirección.
- Al vaciar el tablero, tras terminar las explosiones (fase `clearing`), se regenera el tablero y la bola vuelve a `ready` sobre el paddle. Nivel y puntaje se conservan.
- Se elimina la fase `won` y el overlay `¡VICTORIA!`: la partida solo termina con `GAME OVER`.
- Texto `NIVEL N` centrado arriba en el HUD, con el color del nivel.
- `SILENCIO` (SPEC 03) se mueve abajo al centro, con fuente pequeña, para dejar el centro superior al nivel.
- Banner `¡NIVEL N!` centrado en pantalla durante 1500 ms al subir de nivel, con aparición y desvanecimiento de opacidad y un ligero escalado.
- Cada nivel tiene un color de acento propio (`CONFIG.levels.colors`), usado en:
  - el texto `NIVEL N` y el banner,
  - un tinte translúcido sobre el fondo negro del canvas,
  - el borde y el brillo CSS del canvas (variable CSS `--level-color`), con transición suave.
- El overlay de `GAME OVER` añade la línea `Nivel alcanzado: N`.
- `resetGame()` vuelve al nivel 1 y a su color.

**Fuera de alcance (para specs futuras):**

- Diseños de tablero distintos por nivel o bloques de varios golpes.
- Paddle más pequeño o desviación aleatoria en rebotes de bloques.
- Barra de progreso hacia el siguiente nivel.
- Sonido de subida de nivel (no hay asset).
- Persistencia de récords o del mejor nivel (`localStorage`).
- Pantalla de victoria final o fin de juego al llegar al nivel 10.
- Física independiente de la frecuencia del monitor (las velocidades siguen en px/frame).

---

## Modelo de datos

```js
// src/game.js
const CONFIG = {
  // ...resto igual que en SPEC 03
  ballSpeed: 2.2,        // velocidad en nivel 1
  maxBounceAngle: 60,    // ángulo en nivel 1
  levels: {
    pointsPerLevel: 150,
    max: 10,
    maxBallSpeed: 4.2,     // velocidad en nivel max
    maxBounceAngle: 75,    // ángulo en nivel max
    bannerDuration: 1500,  // ms
    colors: [ /* 10 colores hex, uno por nivel, del 1 al 10 */ ],
  },
};

const state = {
  phase: 'ready',        // 'ready' | 'playing' | 'clearing' | 'lost'
  // ...resto igual que en SPEC 03
  level: 1,
  levelUpAt: null,       // timestamp rAF (ms) de la última subida, o null
};
```

Convenciones:

- `levelForScore( score )` devuelve `Math.min( max, 1 + Math.floor( score / pointsPerLevel ) )`.
- Interpolación lineal con `t = ( level - 1 ) / ( max - 1 )`: `levelBallSpeed()` va de `CONFIG.ballSpeed` a `levels.maxBallSpeed`; `levelBounceAngle()` va de `CONFIG.maxBounceAngle` a `levels.maxBounceAngle`.
- `launchBall()` y `bounceOnPaddle()` usan `levelBallSpeed()` y `levelBounceAngle()` en lugar de las constantes de `CONFIG`.
- Al subir de nivel, `vx` y `vy` se multiplican por `nuevaVelocidad / velocidadAnterior`.
- `applyLevelColor()` fija `--level-color` en `canvas.style` con `CONFIG.levels.colors[ state.level - 1 ]`. Se llama al subir de nivel y en `resetGame()`.
- El banner se dibuja solo mientras `now - state.levelUpAt < bannerDuration`; su opacidad y escala dependen de ese tiempo transcurrido.
- El tinte de fondo es un `fillRect` del color del nivel con opacidad baja (~0.12) sobre negro, para no restar contraste a bloques y bola.

---

## Plan de implementación

1. Añadir `CONFIG.levels`, `state.level` y las funciones `levelForScore`, `levelBallSpeed` y `levelBounceAngle`; usar las dos últimas en `launchBall()` y `bounceOnPaddle()`; `resetGame()` pone `level = 1`. Prueba manual: en nivel 1 el juego se comporta igual que antes; con `state.level = 10` en consola la bola sale más rápida y más angulada.
2. En `bounceOnBricks()`, tras sumar puntos, recalcular el nivel; si sube, reescalar `vx`/`vy`, actualizar `state.level` y fijar `state.levelUpAt = now`. Prueba manual: con `state.score = 140` en consola, al romper un bloque `state.level` pasa a 2 y la bola acelera sin detenerse.
3. Regenerar el tablero: al terminar `clearing`, `createBricks()` y fase `ready`; eliminar la fase `won`, su overlay y su caso en `handleAction()`; el overlay de `GAME OVER` muestra `Nivel alcanzado: N`. Prueba manual: con todos los bloques salvo uno marcados `alive = false` en consola, romper el último regenera el tablero y deja la bola sobre el paddle.
4. HUD y fondo: `NIVEL N` centrado arriba con el color del nivel, `SILENCIO` abajo al centro, y tinte del color del nivel sobre fondo negro en `render()`. Prueba manual: cambiar `state.level` en consola cambia texto, color y tinte.
5. Borde del canvas: en `style.css` borde y `box-shadow` con `var(--level-color)` y `transition`; `applyLevelColor()` se llama al subir de nivel y en `resetGame()`. Prueba manual: al subir de nivel el borde cambia de color con transición.
6. Banner `¡NIVEL N!` en `render()`, encima del juego y debajo del overlay, con aparición, desvanecimiento y ligero escalado durante `bannerDuration`. Prueba manual: al subir de nivel aparece el banner ~1.5 s y desaparece solo.

---

## Criterios de aceptación

- [ ] Al empezar la partida se ve `NIVEL 1` en el HUD y la bola tiene la misma velocidad y ángulo que antes de esta spec.
- [ ] Al alcanzar 150 puntos el nivel pasa a 2; a 300, a 3; y así cada 150 puntos.
- [ ] El nivel nunca supera 10, aunque el puntaje siga subiendo.
- [ ] En nivel 10 la velocidad de la bola es 4.2 y el ángulo máximo de rebote en el paddle es 75°.
- [ ] Al subir de nivel la bola no se detiene, conserva su dirección y su velocidad cambia en ese mismo frame.
- [ ] Al subir de nivel aparece el banner `¡NIVEL N!` durante ~1.5 s y luego desaparece.
- [ ] Cada nivel del 1 al 10 muestra un color distinto en el texto del HUD, el tinte del fondo y el borde del canvas.
- [ ] El borde del canvas cambia de color con transición, no de golpe.
- [ ] `SILENCIO` aparece abajo al centro cuando el sonido está silenciado y no se superpone a `NIVEL N`.
- [ ] Al vaciar el tablero, tras las explosiones, aparece un tablero nuevo completo y la bola vuelve al paddle; nivel y puntaje se conservan.
- [ ] Nunca aparece el overlay `¡VICTORIA!`.
- [ ] El overlay de `GAME OVER` muestra `Nivel alcanzado: N` con el nivel en que terminó la partida.
- [ ] Reiniciar tras `GAME OVER` vuelve a nivel 1, a su color y a la velocidad inicial.
- [ ] Bloques, bola y paddle siguen siendo claramente visibles sobre el fondo tintado en todos los niveles.
- [ ] El juego sigue abriéndose con doble clic (`file://`) sin errores en consola.
- [ ] No se añade ningún archivo nuevo a `assets/` ni ninguna dependencia.

---

## Decisiones tomadas y descartadas

- **Sí:** nivel derivado del puntaje (cada 150 pts). Es lo que pidió el usuario y no requiere estado extra para calcularlo.
- **No:** nivel = tablero completado. Ignora los rangos de puntos pedidos.
- **No:** rangos crecientes en una tabla `LEVELS`. Más datos para ajustar sin beneficio claro ahora.
- **Sí:** tope en nivel 10. Con 4.2 px/frame la bola sigue siendo jugable y no atraviesa bloques de 30 px.
- **No:** niveles sin tope. La velocidad acabaría siendo injugable o provocaría túneles en la colisión.
- **Sí:** al vaciar el tablero se regenera y la partida sigue. Un solo tablero da 910 pts, insuficiente para llegar al nivel 10.
- **No:** mantener `¡VICTORIA!`. Con partida infinita la única forma de terminar es `GAME OVER`.
- **Sí:** la bola vuelve a `ready` con el tablero nuevo. Da un respiro y marca el cambio de tablero.
- **Sí:** dificultad por velocidad y ángulo máximo del paddle. Cubre "velocidad y rebotes" sin cambiar la física de bloques.
- **No:** paddle más pequeño ni rebote aleatorio en bloques. Descartados por el usuario.
- **Sí:** reescalar la velocidad al instante sin pausa. Mantiene el ritmo de juego.
- **No:** pausa durante el banner o devolver la bola al paddle al subir de nivel.
- **Sí:** HUD + banner + color por nivel (tinte de fondo y borde CSS). Hace evidente el nivel actual y su cambio.
- **No:** degradado de fondo. Más ruido visual que un tinte plano.
- **Sí:** mover `SILENCIO` abajo al centro. El centro superior pasa a ser del nivel; cambia lo definido en SPEC 03.
- **Sí:** `Nivel alcanzado` en `GAME OVER` sin persistencia. Los récords van en otra spec.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| A velocidades altas la bola atraviesa un bloque o el paddle sin colisionar | Tope de 4.2 px/frame, menor que el radio (8) y la altura del paddle (14) y del bloque (30). |
| Velocidades en px/frame hacen el juego más rápido en monitores de 120/144 Hz | Comportamiento heredado de SPEC 01; fuera de alcance. |
| El tinte de fondo resta contraste a bloques del mismo color | Opacidad baja (~0.12) sobre negro. |
| El banner tapa la bola en un momento crítico | Banner translúcido y breve (1.5 s), sin bloquear el input. |
| Quitar la fase `won` deja referencias rotas en `handleAction()` o `drawOverlay()` | El paso 3 elimina todas las referencias a `won` en `src/game.js`. |
| El reescalado al subir de nivel acumula error y la velocidad deriva | El rebote en el paddle recalcula la velocidad desde `levelBallSpeed()` en cada golpe. |

---

## Lo que **no** está en esta spec

- Tableros distintos por nivel y bloques de varios golpes.
- Paddle que encoge o rebotes aleatorios.
- Barra de progreso de nivel.
- Sonido de subida de nivel.
- Récords y persistencia.
- Victoria final al llegar al nivel 10.
