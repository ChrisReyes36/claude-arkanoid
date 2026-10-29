const CONFIG = {
  width: 800,
  height: 600,
};

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
ctx.imageSmoothingEnabled = false;

function render() {
  ctx.clearRect( 0, 0, CONFIG.width, CONFIG.height );
}

function loop() {
  render();
  requestAnimationFrame( loop );
}

requestAnimationFrame( loop );
