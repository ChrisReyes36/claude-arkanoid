# Juego de Arkanoid

Arkanoid jugable hecho con **HTML, CSS y JavaScript, cero dependencias**. No necesita instalación ni build: abre `index.html` en el navegador y juega.

## Cómo jugar

Rompe todos los bloques con la bola sin dejarla caer. Tienes 3 vidas; la partida termina con `GAME OVER`.

| Acción                         | Control                                      |
| ------------------------------ | -------------------------------------------- |
| Mover el paddle                | Ratón, o flechas izquierda/derecha, o `A`/`D` |
| Lanzar la bola / reiniciar     | `Espacio` o clic                             |
| Pausa y menú de niveles        | `Esc` o `P`                                  |
| Silenciar / activar sonido     | `M`                                          |

En el menú de pausa eliges un nivel (1–10) con el ratón, o con flechas/`WASD` y `Enter`/`Espacio`, y la partida empieza desde ahí.

## Características

- Canvas de 800x600 con sprites (`assets/spritesheet-breakout.png`).
- Los bloques explotan con una animación corta al romperse.
- Sonidos de rebote y de rotura de bloque.
- Puntaje: 10 puntos por bloque.
- **10 niveles por puntaje:** el nivel sube cada 150 puntos. Con cada nivel la bola va más rápida (de 2.2 a 4.2) y el ángulo de rebote del paddle es más abierto (de 60° a 75°).
- Cada nivel tiene su propio color, un banner `¡NIVEL N!` al subir y el nivel visible en el HUD.
- Al vaciar el tablero se regenera, conservando nivel y puntaje. El tablero tiene una forma distinta según el nivel.

## Estructura

```
index.html            Canvas y carga de scripts
style.css             Estilo de la página y del canvas
src/game.js           Todo el código del juego
assets/               Spritesheet, sonidos y mapa de sprites (spritesheet.js)
specs/                Especificaciones del proyecto (spec-driven)
.agents/skills/       Skills /spec y /spec-impl
```

## Desarrollo spec-driven

El proyecto se construye con especificaciones en `specs/`, escritas en español, una por funcionalidad. Cada una define alcance, modelo de datos, plan de implementación y criterios de aceptación antes de escribir código.

| Spec | Tema                                  | Estado      |
| ---- | ------------------------------------- | ----------- |
| 01   | MVP jugable                           | Implementado |
| 02   | Destrucción de bloques animada        | Implementado |
| 03   | Sonidos de rebote y rotura            | Implementado |
| 04   | Niveles por puntaje                   | Implementado |

Flujo de trabajo (con Claude Code):

1. `/spec <descripción>`: diseña la spec haciendo preguntas y la guarda como `Borrador`.
2. Revisas la spec y la marcas como `Aprobado`.
3. `/spec-impl <NN-nombre>`: crea la rama `spec-NN-slug` e implementa el plan paso a paso, sin hacer commits automáticos.
4. Verificas los criterios de aceptación y marcas la spec como `Implementado`.

Más detalle para el agente en `CLAUDE.md`.
