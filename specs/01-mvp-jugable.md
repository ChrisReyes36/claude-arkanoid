# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-10-27
> **Objetivo:** Un Arkanoid de un solo nivel, jugable abriendo `index.html` en el navegador, con paddle, bola, bloques, tres vidas, puntaje y overlay de victoria o derrota.

---

## Alcance

**Dentro:**

- Canvas fijo de 800x600 centrado en la página.
- Paddle controlado a la vez con ratón y teclado (flechas o A/D).
- Bola pegada al paddle al inicio y tras perder una vida; se lanza con Espacio o clic.
- Rebote en paddle con ángulo según el punto de impacto.
- Rebote en paredes izquierda, derecha y techo.
- Un único nivel: 7 filas x 13 columnas de bloques, una fila por color de `SPRITES.blocks`.
- Cada bloque se destruye de un golpe y suma 10 puntos.
- Tres vidas; se pierde una cuando la bola cae por debajo del paddle.
- HUD con puntaje y vidas dibujado en el canvas.
- Overlay de victoria (sin bloques) y de derrota (sin vidas); Espacio o clic reinicia la partida.
- Uso de `assets/spritesheet.js` y `assets/spritesheet-breakout.png` para paddle, bola y bloques.

**Fuera de alcance (para specs futuras):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`).
- Animación de explosión (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`).
- Varios niveles o layouts distintos.
- Pausa.
- Persistencia de puntajes (high score, `localStorage`).
- Power-ups, bloques con varios golpes, aceleración progresiva de la bola.
- Soporte táctil y escalado responsive.
- Pantallas de menú o título (solo overlay de texto).

---

## Modelo de datos

```js
// Estado del juego (src/game.js)
const state = {
  phase: 'ready',        // 'ready' | 'playing' | 'won' | 'lost'
  score: 0,
  lives: 3,
  paddle: { x: 340, y: 560, w: 120, h: 14 },
  ball: { x: 0, y: 0, r: 8, vx: 0, vy: 0 },
  bricks: [/* { x, y, w, h, color, alive } */],
};

const CONFIG = {
  width: 800,
  height: 600,
  paddleSpeed: 8,        // px/frame con teclado
  ballSpeed: 6,          // px/frame, módulo constante
  maxBounceAngle: 60,    // grados respecto a la vertical
  brick: { w: 60, h: 30, cols: 13, rows: 7, offsetX: 10, offsetY: 60 },
  rowColors: ['red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink', 'gray'],
  pointsPerBrick: 10,
};
```

Convenciones:

- Origen en la esquina superior izquierda del canvas.
- Velocidades en píxeles por frame (`requestAnimationFrame`).
- Los sprites se dibujan con `drawSprite` de `assets/spritesheet.js`, escalados al tamaño de `CONFIG` con `imageSmoothingEnabled = false`.
- Fase `ready`: la bola sigue al paddle. Fase `playing`: la bola se mueve libre.

---

## Plan de implementación

1. Crear `index.html` (canvas 800x600 y `<script>` de `assets/spritesheet.js` y luego `src/game.js`), `style.css` (fondo oscuro, canvas centrado) y `src/game.js` con un bucle que limpia el canvas. Prueba manual: abrir `index.html` y ver el canvas sin errores en consola.
2. Cargar el spritesheet con `loadSpritesheet` y dibujar el paddle en su posición inicial. Prueba manual: se ve el paddle abajo.
3. Mover el paddle con flechas/A-D y con el ratón, limitado a los bordes del canvas. Prueba manual: ambos controles funcionan y se pueden alternar.
4. Dibujar la bola pegada al paddle en fase `ready`; Espacio o clic la lanza hacia arriba y pasa a `playing`. Prueba manual: la bola sigue al paddle y sale al lanzar.
5. Movimiento de la bola y rebote en paredes y techo. Prueba manual: rebota en tres bordes y cae por abajo.
6. Rebote en el paddle con ángulo según el punto de impacto. Prueba manual: centro devuelve recto, bordes en diagonal.
7. Generar y dibujar la rejilla de 7x13 bloques desde `CONFIG.brick` y `rowColors`. Prueba manual: se ven 7 filas de colores centradas.
8. Colisión bola-bloque: el bloque se marca `alive = false`, la bola rebota y suma 10 puntos. Prueba manual: los bloques desaparecen de uno en uno.
9. Vidas y HUD: al caer la bola se resta una vida y se vuelve a `ready`; mostrar puntaje y vidas. Prueba manual: el HUD se actualiza.
10. Overlays y reinicio: `lost` con 0 vidas, `won` sin bloques vivos; Espacio o clic llama a una función `resetGame()` que restaura el estado inicial. Prueba manual: se puede ganar, perder y reiniciar.

---

## Criterios de aceptación

- [ ] Abrir `index.html` con doble clic (`file://`) carga el juego sin errores en la consola.
- [ ] No hay `package.json`, dependencias externas ni paso de build.
- [ ] El canvas mide 800x600 y está centrado en la página.
- [ ] Se ven 91 bloques (7 filas x 13 columnas), una fila por cada color de `rowColors`.
- [ ] El paddle se mueve con ratón y con flechas/A-D, y nunca sale del canvas.
- [ ] En fase `ready` la bola está sobre el paddle y lo sigue al moverlo.
- [ ] Espacio o clic lanzan la bola; el mismo input durante `playing` no hace nada.
- [ ] La bola rebota en paredes izquierda y derecha y en el techo.
- [ ] Un impacto en el centro del paddle devuelve la bola casi vertical; en un borde sale con ángulo cercano a `maxBounceAngle`.
- [ ] La velocidad de la bola (módulo del vector) es constante en toda la partida.
- [ ] Al tocar un bloque, este desaparece, la bola rebota y el puntaje sube exactamente 10.
- [ ] Al caer la bola por debajo del paddle se resta una vida y la bola vuelve a `ready`.
- [ ] El HUD muestra el puntaje y las vidas, y se actualiza en cada cambio.
- [ ] Al llegar a 0 vidas aparece un overlay de derrota con el puntaje final.
- [ ] Al destruir los 91 bloques aparece un overlay de victoria con el puntaje final (910 si no hay otro puntaje).
- [ ] Desde cualquier overlay, Espacio o clic reinicia con 3 vidas, 0 puntos y los 91 bloques.
- [ ] No se reproduce ningún sonido ni animación de explosión.

---

## Decisiones tomadas y descartadas

- **Sí:** un solo `src/game.js`. El MVP es pequeño y evita gestionar el orden de varios `<script>`.
- **No:** módulos ES. Requieren servidor local por CORS en `file://` y contradicen "abrir el HTML en el navegador".
- **Sí:** scripts clásicos, coherentes con `assets/spritesheet.js`, que declara globales sin exports.
- **Sí:** ángulo de rebote según el punto de impacto. Es lo que da control al jugador.
- **No:** rebote especular simple en el paddle. La trayectoria sería incontrolable.
- **Sí:** bola pegada al paddle hasta lanzarla. Da tiempo de reacción tras perder una vida.
- **No:** lanzamiento automático por temporizador.
- **Sí:** bloques de 60x30 en vez de 64x32. Con 13 columnas, 64 px sumarían 832 px y no caben en 800 px; con 60 px la rejilla mide 780 px y deja 10 px de margen por lado.
- **Sí:** 7 filas con los 7 colores de `SPRITES.blocks`, incluido `gray`.
- **Sí:** overlay de texto sobre el canvas, sin pantallas separadas. Basta para el MVP.
- **No:** pausa, sonido, explosiones, niveles y persistencia. Cada uno puede ir en su propia spec.
- **Sí:** ratón y teclado activos a la vez. La última entrada recibida determina la posición del paddle.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La bola atraviesa bloques o el paddle a velocidad alta (tunneling) | `ballSpeed` de 6 px/frame es menor que el alto del bloque (30 px) y del paddle (14 px); no subirlo sin subdividir el movimiento. |
| Dos rebotes en el mismo frame al tocar dos bloques adyacentes | Resolver solo la primera colisión por frame. |
| La bola queda atrapada dentro del paddle tras un impacto lateral | Reposicionar la bola justo encima del paddle y forzar `vy` negativa al rebotar. |
| El spritesheet no ha cargado cuando empieza el juego | Iniciar el bucle dentro del callback de `loadSpritesheet`. |
| Ángulo del rebote casi horizontal que alarga la partida | Limitar el ángulo con `maxBounceAngle` (60°) respecto a la vertical. |

---

## Lo que **no** está en esta spec

- Sonidos y música.
- Animación de explosión de bloques.
- Más de un nivel.
- Pausa y menú.
- Persistencia de puntajes.
- Power-ups y bloques resistentes.
- Soporte táctil y móvil.
