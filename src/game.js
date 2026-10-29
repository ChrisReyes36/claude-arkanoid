const CONFIG = {
  width: 800,
  height: 600,
  paddleSpeed: 8,
  ballSpeed: 6,
};

const state = {
  phase: 'ready',
  paddle: { x: 340, y: 560, w: 120, h: 14 },
  ball: { x: 0, y: 0, r: 8, vx: 0, vy: 0 },
};

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
  }
}

function render() {
  ctx.clearRect( 0, 0, CONFIG.width, CONFIG.height );
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
  const b = state.ball;
  drawSprite( ctx, 'ball', b.x - b.r, b.y - b.r, b.r * 2, b.r * 2 );
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => requestAnimationFrame( loop ) );
