const CONFIG = {
  width: 800,
  height: 600,
  paddleSpeed: 5,
  ballSpeed: 2.2,
  maxBounceAngle: 60,
  brick: { w: 60, h: 30, cols: 13, rows: 7, offsetX: 10, offsetY: 60 },
  pointsPerBrick: 10,
  rowColors: ['red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink', 'gray'],
  sound: { volume: 0.5 },
  levels: {
    pointsPerLevel: 150,
    max: 10,
    maxBallSpeed: 4.2,
    maxBounceAngle: 75,
    bannerDuration: 1500,
    colors: [
      '#4dd0e1', '#4caf50', '#cddc39', '#ffeb3b', '#ff9800',
      '#ff5722', '#f44336', '#e91e63', '#9c27b0', '#7c4dff',
    ],
  },
};

const state = {
  phase: 'ready',
  score: 0,
  level: 1,
  levelUpAt: null,
  lives: 3,
  paddle: { x: 340, y: 560, w: 120, h: 14 },
  ball: { x: 0, y: 0, r: 8, vx: 0, vy: 0 },
  bricks: [],
  explosions: [],
  muted: false,
};

const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break: new Audio( 'assets/sounds/break-sound.mp3' ),
};

function playSound( name ) {
  if ( state.muted ) return;
  const sound = SOUNDS[ name ].cloneNode();
  sound.volume = CONFIG.sound.volume;
  sound.play().catch( () => {} );
}

// Un solo sonido por frame; 'break' tiene prioridad sobre 'bounce'.
let frameSound = null;

function queueSound( name ) {
  if ( frameSound !== 'break' ) frameSound = name;
}

function flushSound() {
  if ( frameSound ) playSound( frameSound );
  frameSound = null;
}

function levelForScore( score ) {
  const { pointsPerLevel, max } = CONFIG.levels;
  return Math.min( max, 1 + Math.floor( score / pointsPerLevel ) );
}

function levelProgress() {
  return ( state.level - 1 ) / ( CONFIG.levels.max - 1 );
}

function levelBallSpeed() {
  return CONFIG.ballSpeed + ( CONFIG.levels.maxBallSpeed - CONFIG.ballSpeed ) * levelProgress();
}

function levelBounceAngle() {
  return CONFIG.maxBounceAngle + ( CONFIG.levels.maxBounceAngle - CONFIG.maxBounceAngle ) * levelProgress();
}

function levelColor() {
  return CONFIG.levels.colors[ state.level - 1 ];
}

function applyLevelColor() {
  canvas.style.setProperty( '--level-color', levelColor() );
}

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

function resetGame() {
  state.phase = 'ready';
  state.score = 0;
  state.level = 1;
  state.levelUpAt = null;
  applyLevelColor();
  state.lives = 3;
  state.paddle.x = 340;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.bricks = createBricks();
  state.explosions = [];
}

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
const spriteSheet = new Image();
spriteSheet.src = 'assets/spritesheet-breakout.png';
const LIFE_ICON = { size: 20 };
ctx.imageSmoothingEnabled = false;
applyLevelColor();

const keys = { left: false, right: false };

function setKey( e, down ) {
  if ( e.code === 'ArrowLeft' || e.code === 'KeyA' ) keys.left = down;
  else if ( e.code === 'ArrowRight' || e.code === 'KeyD' ) keys.right = down;
}

function launchBall() {
  state.ball.vx = 0;
  state.ball.vy = -levelBallSpeed();
  state.phase = 'playing';
}

function handleAction() {
  if ( state.phase === 'ready' ) launchBall();
  else if ( state.phase === 'lost' ) resetGame();
}

window.addEventListener( 'keydown', e => {
  if ( e.code === 'Space' ) {
    e.preventDefault();
    if ( !e.repeat ) handleAction();
  }
  if ( e.code === 'KeyM' && !e.repeat ) state.muted = !state.muted;
  setKey( e, true );
} );
window.addEventListener( 'keyup', e => setKey( e, false ) );

canvas.addEventListener( 'mousedown', handleAction );

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
  const angle = Math.max( -1, Math.min( 1, offset ) ) * levelBounceAngle() * Math.PI / 180;
  const speed = levelBallSpeed();
  b.vx = speed * Math.sin( angle );
  b.vy = -speed * Math.cos( angle );
  b.y = p.y - b.r;
  queueSound( 'bounce' );
}

function levelUp( now ) {
  const newLevel = levelForScore( state.score );
  if ( newLevel <= state.level ) return;

  const oldSpeed = levelBallSpeed();
  state.level = newLevel;
  state.levelUpAt = now;
  applyLevelColor();
  const ratio = levelBallSpeed() / oldSpeed;
  state.ball.vx *= ratio;
  state.ball.vy *= ratio;
}

function bounceOnBricks( now ) {
  const b = state.ball;
  for ( const br of state.bricks ) {
    if ( !br.alive ) continue;
    if ( b.x + b.r <= br.x || b.x - b.r >= br.x + br.w ) continue;
    if ( b.y + b.r <= br.y || b.y - b.r >= br.y + br.h ) continue;

    br.alive = false;
    state.explosions.push( { x: br.x, y: br.y, w: br.w, h: br.h, color: br.color, start: now } );
    state.score += CONFIG.pointsPerBrick;
    queueSound( 'break' );
    levelUp( now );

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
  state.phase = state.lives > 0 ? 'ready' : 'lost';
}

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntaje: ' + state.score, 10, 30 );
  ctx.textAlign = 'center';
  ctx.fillStyle = levelColor();
  ctx.fillText( 'NIVEL ' + state.level, CONFIG.width / 2, 30 );
  ctx.fillStyle = '#fff';
  if ( state.muted ) {
    ctx.font = '14px monospace';
    ctx.fillText( 'SILENCIO', CONFIG.width / 2, CONFIG.height - 12 );
    ctx.font = '20px monospace';
  }
  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas:', CONFIG.width - 10 - state.lives * LIFE_ICON.size - 4, 30 );
  const { sx, sy, sw, sh } = SPRITES.ball;
  for ( let i = 0; i < state.lives; i++ ) {
    const x = CONFIG.width - 10 - ( state.lives - i ) * LIFE_ICON.size;
    ctx.drawImage( spriteSheet, sx, sy, sw, sh, x, 30 - LIFE_ICON.size / 2, LIFE_ICON.size, LIFE_ICON.size );
  }
}

function drawBanner( now ) {
  if ( state.levelUpAt === null ) return;
  const t = ( now - state.levelUpAt ) / CONFIG.levels.bannerDuration;
  if ( t >= 1 ) return;

  const alpha = t < 0.2 ? t / 0.2 : t > 0.6 ? ( 1 - t ) / 0.4 : 1;
  const scale = 0.8 + 0.2 * Math.min( 1, t / 0.2 );
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate( CONFIG.width / 2, CONFIG.height / 2 );
  ctx.scale( scale, scale );
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000';
  ctx.strokeText( '¡NIVEL ' + state.level + '!', 0, 0 );
  ctx.fillStyle = levelColor();
  ctx.fillText( '¡NIVEL ' + state.level + '!', 0, 0 );
  ctx.restore();
}

function drawOverlay() {
  if ( state.phase !== 'lost' ) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, CONFIG.width, CONFIG.height );
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px monospace';
  ctx.fillText( 'GAME OVER', CONFIG.width / 2, CONFIG.height / 2 - 40 );
  ctx.font = '24px monospace';
  ctx.fillText( 'Puntaje final: ' + state.score, CONFIG.width / 2, CONFIG.height / 2 + 10 );
  ctx.fillText( 'Nivel alcanzado: ' + state.level, CONFIG.width / 2, CONFIG.height / 2 + 45 );
  ctx.fillText( 'Espacio o clic para reiniciar', CONFIG.width / 2, CONFIG.height / 2 + 90 );
}

function update( now ) {
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
      queueSound( 'bounce' );
    } else if ( b.x + b.r > CONFIG.width ) {
      b.x = CONFIG.width - b.r;
      b.vx = -Math.abs( b.vx );
      queueSound( 'bounce' );
    }
    if ( b.y - b.r < 0 ) {
      b.y = b.r;
      b.vy = Math.abs( b.vy );
      queueSound( 'bounce' );
    }

    bounceOnPaddle();
    bounceOnBricks( now );
    flushSound();
    if ( state.bricks.every( br => !br.alive ) ) state.phase = 'clearing';

    if ( state.phase === 'playing' && b.y - b.r > CONFIG.height ) loseLife();
  } else if ( state.phase === 'clearing' && state.explosions.length === 0 ) {
    state.bricks = createBricks();
    b.vx = 0;
    b.vy = 0;
    state.phase = 'ready';
  }
}

function render( now ) {
  ctx.clearRect( 0, 0, CONFIG.width, CONFIG.height );
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = levelColor();
  ctx.fillRect( 0, 0, CONFIG.width, CONFIG.height );
  ctx.globalAlpha = 1;
  for ( const br of state.bricks ) {
    if ( br.alive ) drawSprite( ctx, 'block_' + br.color, br.x, br.y, br.w, br.h );
  }
  const frames = EXPLOSION_FRAMES.red.length;
  state.explosions = state.explosions.filter( ex => now - ex.start < frames * EXPLOSION_DURATION );
  for ( const ex of state.explosions ) {
    const i = Math.floor( ( now - ex.start ) / EXPLOSION_DURATION );
    drawFrame( ctx, EXPLOSION_FRAMES[ ex.color ][ i ], ex.x, ex.y, ex.w, ex.h );
  }
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
  const b = state.ball;
  drawSprite( ctx, 'ball', b.x - b.r, b.y - b.r, b.r * 2, b.r * 2 );
  drawHud();
  drawBanner( now );
  drawOverlay();
}

function loop( now ) {
  update( now );
  render( now );
  requestAnimationFrame( loop );
}

loadSpritesheet( () => requestAnimationFrame( loop ) );
