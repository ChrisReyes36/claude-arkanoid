const CONFIG = {
  width: 800,
  height: 600,
  paddleSpeed: 8,
  ballSpeed: 6,
  maxBounceAngle: 60,
  brick: { w: 60, h: 30, cols: 13, rows: 7, offsetX: 10, offsetY: 60 },
  pointsPerBrick: 10,
  rowColors: ['red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink', 'gray'],
};

const state = {
  phase: 'ready',
  score: 0,
  lives: 3,
  paddle: { x: 340, y: 560, w: 120, h: 14 },
  ball: { x: 0, y: 0, r: 8, vx: 0, vy: 0 },
  bricks: [],
};

function createBricks() {
  const { w, h, cols, rows, offsetX, offsetY } = CONFIG.brick;
  const bricks = [];
  for ( let row = 0; row < rows; row++ ) {
    for ( let col = 0; col < cols; col++ ) {
      bricks.push( {
        x: offsetX + col * w,
        y: offsetY + row * h,
        w,
        h,
        color: CONFIG.rowColors[ row ],
        alive: true,
      } );
    }
  }
  return bricks;
}

state.bricks = createBricks();

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
ctx.imageSmoothingEnabled = false;

const keys = { left: false, right: false };

function setKey( e, down ) {
  if ( e.code === 'ArrowLeft' || e.code === 'KeyA' ) keys.left = down;
  else if ( e.code === 'ArrowRight' || e.code === 'KeyD' ) keys.right = down;
}

function launchBall() {
  if ( state.phase !== 'ready' ) return;
  state.ball.vx = 0;
  state.ball.vy = -CONFIG.ballSpeed;
  state.phase = 'playing';
}

window.addEventListener( 'keydown', e => {
  if ( e.code === 'Space' ) {
    e.preventDefault();
    launchBall();
  }
  setKey( e, true );
} );
window.addEventListener( 'keyup', e => setKey( e, false ) );

canvas.addEventListener( 'mousedown', launchBall );

canvas.addEventListener( 'mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = ( e.clientX - rect.left ) * ( CONFIG.width / rect.width );
  state.paddle.x = mouseX - state.paddle.w / 2;
  clampPaddle();
} );

function clampPaddle() {
  const p = state.paddle;
  p.x = Math.max( 0, Math.min( CONFIG.width - p.w, p.x ) );
}

function bounceOnPaddle() {
  const b = state.ball;
  const p = state.paddle;
  const touching = b.vy > 0
    && b.x + b.r > p.x && b.x - b.r < p.x + p.w
    && b.y + b.r >= p.y && b.y - b.r <= p.y + p.h;
  if ( !touching ) return;

  const offset = ( b.x - ( p.x + p.w / 2 ) ) / ( p.w / 2 );
  const angle = Math.max( -1, Math.min( 1, offset ) ) * CONFIG.maxBounceAngle * Math.PI / 180;
  b.vx = CONFIG.ballSpeed * Math.sin( angle );
  b.vy = -CONFIG.ballSpeed * Math.cos( angle );
  b.y = p.y - b.r;
}

function bounceOnBricks() {
  const b = state.ball;
  for ( const br of state.bricks ) {
    if ( !br.alive ) continue;
    if ( b.x + b.r <= br.x || b.x - b.r >= br.x + br.w ) continue;
    if ( b.y + b.r <= br.y || b.y - b.r >= br.y + br.h ) continue;

    br.alive = false;
    state.score += CONFIG.pointsPerBrick;

    // Penetración por cada lado; el menor indica por dónde entró la bola.
    const fromLeft = b.x + b.r - br.x;
    const fromRight = br.x + br.w - ( b.x - b.r );
    const fromTop = b.y + b.r - br.y;
    const fromBottom = br.y + br.h - ( b.y - b.r );
    if ( Math.min( fromLeft, fromRight ) < Math.min( fromTop, fromBottom ) ) {
      b.vx = fromLeft < fromRight ? -Math.abs( b.vx ) : Math.abs( b.vx );
    } else {
      b.vy = fromTop < fromBottom ? -Math.abs( b.vy ) : Math.abs( b.vy );
    }
    return; // solo la primera colisión por frame
  }
}

function loseLife() {
  state.lives--;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.phase = 'ready';
}

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntaje: ' + state.score, 10, 30 );
  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas: ' + state.lives, CONFIG.width - 10, 30 );
}

function update() {
  if ( keys.left ) state.paddle.x -= CONFIG.paddleSpeed;
  if ( keys.right ) state.paddle.x += CONFIG.paddleSpeed;
  clampPaddle();

  const b = state.ball;
  if ( state.phase === 'ready' ) {
    b.x = state.paddle.x + state.paddle.w / 2;
    b.y = state.paddle.y - b.r;
  } else if ( state.phase === 'playing' ) {
    b.x += b.vx;
    b.y += b.vy;

    if ( b.x - b.r < 0 ) {
      b.x = b.r;
      b.vx = Math.abs( b.vx );
    } else if ( b.x + b.r > CONFIG.width ) {
      b.x = CONFIG.width - b.r;
      b.vx = -Math.abs( b.vx );
    }
    if ( b.y - b.r < 0 ) {
      b.y = b.r;
      b.vy = Math.abs( b.vy );
    }

    bounceOnPaddle();
    bounceOnBricks();

    if ( b.y - b.r > CONFIG.height ) loseLife();
  }
}

function render() {
  ctx.clearRect( 0, 0, CONFIG.width, CONFIG.height );
  for ( const br of state.bricks ) {
    if ( br.alive ) drawSprite( ctx, 'block_' + br.color, br.x, br.y, br.w, br.h );
  }
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
  const b = state.ball;
  drawSprite( ctx, 'ball', b.x - b.r, b.y - b.r, b.r * 2, b.r * 2 );
  drawHud();
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => requestAnimationFrame( loop ) );
