const CONFIG = {
  width: 800,
  height: 600,
  paddleSpeed: 8,
};

const state = {
  paddle: { x: 340, y: 560, w: 120, h: 14 },
};

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
ctx.imageSmoothingEnabled = false;

const keys = { left: false, right: false };

function setKey( e, down ) {
  if ( e.code === 'ArrowLeft' || e.code === 'KeyA' ) keys.left = down;
  else if ( e.code === 'ArrowRight' || e.code === 'KeyD' ) keys.right = down;
}

window.addEventListener( 'keydown', e => setKey( e, true ) );
window.addEventListener( 'keyup', e => setKey( e, false ) );

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
}

function render() {
  ctx.clearRect( 0, 0, CONFIG.width, CONFIG.height );
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => requestAnimationFrame( loop ) );
