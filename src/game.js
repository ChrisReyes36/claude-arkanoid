const CONFIG = {
  width: 800,
  height: 600,
};

const state = {
  paddle: { x: 340, y: 560, w: 120, h: 14 },
};

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
ctx.imageSmoothingEnabled = false;

function render() {
  ctx.clearRect( 0, 0, CONFIG.width, CONFIG.height );
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
}

function loop() {
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => requestAnimationFrame( loop ) );
