// ============================================================
//  KING TRAP — engine.js
//  Physics engine, renderer, spike collision, win/lose logic
// ============================================================

let canvas, ctx;
let raf = null, lastTime = 0;
let gameActive = false;
let currentLevelIdx = 0;
let levelDef = null;

let player      = null;
let movingPlats = [];
let dispPlats   = [];   // disappearing platforms
let goal        = null;
let gameTime    = 0;
let deaths      = 0;

const keys = {};

// ── Input ───────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
    e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ── Mobile d-pad ────────────────────────────────────────────
(function setupTouch() {
  if (!('ontouchstart' in window)) return;
  document.getElementById('dpad').style.display    = 'block';
  document.getElementById('jumpBtn').style.display = 'flex';
  function bindBtn(id, key) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true;  }, { passive: false });
    el.addEventListener('touchend',   e => { e.preventDefault(); keys[key] = false; }, { passive: false });
  }
  bindBtn('dpLeft',  'ArrowLeft');
  bindBtn('dpRight', 'ArrowRight');
  bindBtn('dpUp',    ' ');
  const jb = document.getElementById('jumpBtn');
  jb.addEventListener('touchstart', e => { e.preventDefault(); keys[' '] = true;  }, { passive: false });
  jb.addEventListener('touchend',   e => { e.preventDefault(); keys[' '] = false; }, { passive: false });
})();

window.addEventListener('resize', () => {
  if (gameActive && canvas) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// ── Public API ───────────────────────────────────────────────
let _isOwnLevel = false;   // true when playing your own created level — no coins awarded

function startLevel(idx, def, ownLevel) {
  currentLevelIdx = idx;
  levelDef        = def || LEVELS[idx];
  _isOwnLevel     = !!ownLevel;
  canvas  = document.getElementById('gameCanvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext('2d');

  deaths = 0; gameTime = 0; gameActive = true;
  document.getElementById('hudLevel').textContent = levelDef.name;
  document.getElementById('hudTime').textContent  = '0.0';
  document.getElementById('deathBar').textContent = 'DEATHS: 0';
  updateCoinDisplay();

  _resetEntities();
  lastTime = performance.now();
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(_tick);
}

function stopGame() {
  gameActive = false;
  if (raf) { cancelAnimationFrame(raf); raf = null; }
}

// ── Internal helpers ─────────────────────────────────────────
function _resetEntities() {
  _spawnPlayer();
  movingPlats = (levelDef.moving || []).map(m => ({
    x: m.x, y: m.y, w: m.w,
    origX: m.x, dir: m.dir, speed: m.speed,
  }));
  dispPlats = (levelDef.disappear || []).map(d => ({
    col: d.col, row: d.row, state: 'solid', timer: 0,
  }));
  goal = {
    x: levelDef.goalCol * TILE,
    y: levelDef.goalRow * TILE,
    w: TILE, h: TILE * 2,
  };
}

function _spawnPlayer() {
  player = {
    x: levelDef.spawnCol * TILE + 6,
    y: levelDef.spawnRow * TILE - 30,
    w: 24, h: 30,
    vx: 0, vy: 0,
    onGround: false, alive: true,
    coyote: 0, jumpBuf: 0,
    trail: [],
  };
}

// ── Main loop ────────────────────────────────────────────────
function _tick(now) {
  if (!gameActive) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  gameTime += dt;
  document.getElementById('hudTime').textContent = gameTime.toFixed(1);

  _updateMoving(dt);
  _updateDisappear(dt);
  _updatePlayer(dt);
  _render();
  raf = requestAnimationFrame(_tick);
}

function _updateMoving(dt) {
  movingPlats.forEach(m => {
    m.x += m.dir * m.speed;
    if (m.x > m.origX + 160) m.dir = -1;
    if (m.x < m.origX - 160) m.dir =  1;
    m.x = Math.max(0, Math.min(COLS * TILE - m.w, m.x));
  });
}

function _updateDisappear(dt) {
  dispPlats.forEach(d => {
    d.timer += dt;
    if (d.state === 'crumbling' && d.timer > 0.4) { d.state = 'gone';  d.timer = 0; }
    if (d.state === 'gone'      && d.timer > 2.5) { d.state = 'solid'; d.timer = 0; }
  });
}

// ── Player physics ───────────────────────────────────────────
function _updatePlayer(dt) {
  if (!player.alive) return;

  // Horizontal
  if      (keys['ArrowLeft']  || keys['a'] || keys['A']) player.vx = -MOVE_SPEED;
  else if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx =  MOVE_SPEED;
  else player.vx *= 0.72;

  // Jump buffering + coyote time
  if (keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) player.jumpBuf = 0.13;
  if (player.jumpBuf > 0) player.jumpBuf -= dt;
  if (player.coyote  > 0) player.coyote  -= dt;
  if (player.jumpBuf > 0 && player.coyote > 0) {
    player.vy      = JUMP_FORCE;
    player.jumpBuf = 0;
    player.coyote  = 0;
  }

  // Gravity
  player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);

  // Trail
  player.trail.push({ x: player.x + player.w / 2, y: player.y + player.h / 2 });
  if (player.trail.length > 10) player.trail.shift();

  // Move & resolve
  player.x += player.vx * dt;
  _resolveX();
  player.onGround = false;
  player.y += player.vy * dt;
  _resolveY();
  if (player.onGround) player.coyote = 0.12;

  // World bounds
  if (player.x < 0)                       { player.x = 0; player.vx = 0; }
  if (player.x + player.w > COLS * TILE)  { player.x = COLS * TILE - player.w; player.vx = 0; }

  // Fell into void — pixel comparison against world height in pixels
  if (player.y > ROWS * TILE + 80) {
    _killPlayer();
    return;
  }

  // ── SPIKE COLLISION ──────────────────────────────────────
  // Each spike is in an EMPTY cell.
  // dir:'up'   → lethal zone is the TOP    SPIKE_DANGER pixels of the cell.
  // dir:'down' → lethal zone is the BOTTOM SPIKE_DANGER pixels of the cell.
  // Hitbox is inset 6px on each side so grazing the edge doesn't kill.
  const spikes = levelDef.spikes || [];
  for (let i = 0; i < spikes.length; i++) {
    const s  = spikes[i];
    const hx = s.col * TILE + 6;           // inset 6px left and right
    const hw = TILE - 12;
    let hy, hh;
    if (s.dir === 'up') {
      hy = s.row * TILE;                   // top of cell
      hh = SPIKE_DANGER;
    } else {
      hy = (s.row + 1) * TILE - SPIKE_DANGER; // bottom of cell
      hh = SPIKE_DANGER;
    }
    if (_overlap(player.x, player.y, player.w, player.h, hx, hy, hw, hh)) {
      _killPlayer();
      return;
    }
  }

  // Goal
  if (_overlap(player.x, player.y, player.w, player.h,
               goal.x, goal.y, goal.w, goal.h)) {
    _winLevel();
  }
}

function _tileAt(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 1;
  return (levelDef.map[row] || [])[col] || 0;
}

// Like _tileAt but treats 'gone' disappearing tiles as empty (player phases through)
function _solidAt(col, row) {
  if (!_tileAt(col, row)) return 0;
  // If this tile is a disappearing platform currently gone, treat as air
  const dp = dispPlats.find(d => d.col === col && d.row === row);
  if (dp && dp.state === 'gone') return 0;
  return 1;
}

function _dispAt(col, row) {
  return dispPlats.find(d => d.col === col && d.row === row && d.state !== 'gone');
}

function _resolveX() {
  const L = Math.floor(player.x / TILE);
  const R = Math.floor((player.x + player.w - 1) / TILE);
  const T = Math.floor(player.y / TILE);
  const B = Math.floor((player.y + player.h - 1) / TILE);
  for (let r = T; r <= B; r++) {
    if (_solidAt(L, r) && player.vx < 0) { player.x = (L + 1) * TILE; player.vx = 0; }
    if (_solidAt(R, r) && player.vx > 0) { player.x = R * TILE - player.w; player.vx = 0; }
  }
}

function _resolveY() {
  const L = Math.floor(player.x / TILE);
  const R = Math.floor((player.x + player.w - 1) / TILE);
  const T = Math.floor(player.y / TILE);
  const B = Math.floor((player.y + player.h - 1) / TILE);

  // Ceiling
  for (let c = L; c <= R; c++) {
    if (_solidAt(c, T) && player.vy < 0) { player.y = (T + 1) * TILE; player.vy = 0; }
  }
  // Floor tiles
  for (let c = L; c <= R; c++) {
    if (_solidAt(c, B) && player.vy >= 0) {
      const dp = _dispAt(c, B);
      if (dp && dp.state === 'solid') { dp.state = 'crumbling'; dp.timer = 0; }
      player.y = B * TILE - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }
  // Moving platforms
  movingPlats.forEach(m => {
    if (player.x + player.w > m.x && player.x < m.x + m.w) {
      if (player.vy >= 0 && player.y + player.h > m.y && player.y + player.h < m.y + 28) {
        player.y = m.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.x += m.dir * m.speed * 0.016;
      }
    }
  });
}

function _overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ── Kill / Win ───────────────────────────────────────────────
function _killPlayer() {
  if (!player.alive) return;
  player.alive = false;
  deaths++;
  document.getElementById('deathBar').textContent = 'DEATHS: ' + deaths;
  _flashMsg();
  setTimeout(() => {
    if (!gameActive) return;
    _spawnPlayer();
    movingPlats = (levelDef.moving || []).map(m => ({
      x: m.x, y: m.y, w: m.w, origX: m.x, dir: m.dir, speed: m.speed,
    }));
    dispPlats = (levelDef.disappear || []).map(d => ({
      col: d.col, row: d.row, state: 'solid', timer: 0,
    }));
  }, 420);
}

const FLASH_MSGS = [
  'NICE TRY', 'HAHA!', 'AGAIN?', 'NOT TODAY', 'L + RATIO',
  'SKILL ISSUE', 'OOPS!', 'YIKES', 'PREDICTABLE', 'CLOSE... NOT',
  'GET GOOD', 'LMAOOO', 'SERIOUSLY?', 'TOUCHING GRASS HELPS',
];

function _flashMsg() {
  const el  = document.getElementById('trapFlash');
  el.textContent = FLASH_MSGS[Math.floor(Math.random() * FLASH_MSGS.length)];
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 750);
}

function _winLevel() {
  stopGame();

  // Block coin farm: creator earns 0 when playing their own level
  if (_isOwnLevel) {
    document.getElementById('winMsg').textContent =
      `You completed your own level in ${gameTime.toFixed(1)}s. No coins awarded — creators earn only when others play.`;
    document.getElementById('winReward').textContent = `+0 COINS`;
    document.getElementById('winModal').classList.remove('hidden');
    return;
  }

  const penalty = Math.min(
    Math.floor(levelDef.reward * 0.05 * deaths),
    levelDef.reward - 10
  );
  const earned = Math.max(10, levelDef.reward - penalty);
  addCoins(earned);
  STATE.completedLevels.add(currentLevelIdx);

  document.getElementById('winMsg').textContent =
    `Cleared in ${gameTime.toFixed(1)}s with ${deaths} death(s). Penalty: −${penalty} coins.`;
  document.getElementById('winReward').textContent = `+${earned} COINS`;
  document.getElementById('winModal').classList.remove('hidden');
}

// ── Renderer ─────────────────────────────────────────────────
function _render() {
  const scX = canvas.width  / (COLS * TILE);
  const scY = canvas.height / (ROWS * TILE);
  ctx.save();
  ctx.scale(scX, scY);

  const W = COLS * TILE, H = ROWS * TILE;

  // Background
  ctx.fillStyle = '#08080d';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#0e0e16';
  ctx.lineWidth   = 0.5;
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);

  // Static tiles
  levelDef.map.forEach((row, ri) => row.forEach((v, ci) => {
    if (!v) return;
    ctx.fillStyle = '#181f32';
    ctx.fillRect(ci * TILE, ri * TILE, TILE, TILE);
    ctx.fillStyle = '#223060';                             // top highlight
    ctx.fillRect(ci * TILE, ri * TILE, TILE, 3);
    ctx.strokeStyle = '#1e2a50'; ctx.lineWidth = 0.8;
    ctx.strokeRect(ci * TILE + 0.5, ri * TILE + 0.5, TILE - 1, TILE - 1);
  }));

  // Disappearing platforms — same color as normal blocks so they look identical
  // until the player lands on them, then they crack and vanish
  dispPlats.forEach(d => {
    const x = d.col * TILE, y = d.row * TILE;

    if (d.state === 'gone') return; // completely invisible — player phases through

    // Draw identical to a normal platform tile
    ctx.fillStyle = '#181f32';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#223060';
    ctx.fillRect(x, y, TILE, 3);
    ctx.strokeStyle = '#1e2a50'; ctx.lineWidth = 0.8;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);

    // When crumbling: draw cracks and fade out
    if (d.state === 'crumbling') {
      const progress = d.timer / 0.4; // 0 → 1 over 0.4s
      ctx.globalAlpha = 1 - progress;

      // Crack lines radiating from center
      ctx.strokeStyle = '#ff335588';
      ctx.lineWidth = 1.5;
      const cx = x + TILE / 2, cy = y + TILE / 2;
      const cracks = [
        [cx, cy, cx - TILE * 0.4 * progress, cy - TILE * 0.3 * progress],
        [cx, cy, cx + TILE * 0.35 * progress, cy - TILE * 0.4 * progress],
        [cx, cy, cx + TILE * 0.4 * progress, cy + TILE * 0.3 * progress],
        [cx, cy, cx - TILE * 0.3 * progress, cy + TILE * 0.4 * progress],
      ];
      cracks.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });

      ctx.globalAlpha = 1;
    }
  });

  // Moving platforms
  movingPlats.forEach(m => {
    ctx.fillStyle   = '#0e2a1a';
    ctx.fillRect(m.x, m.y, m.w, 16);
    ctx.strokeStyle = '#33ff88'; ctx.lineWidth = 1.2;
    ctx.strokeRect(m.x + 0.5, m.y + 0.5, m.w - 1, 14);
    ctx.fillStyle = '#33ff88'; ctx.font = '10px monospace';
    ctx.fillText(m.dir > 0 ? '→' : '←', m.x + m.w / 2 - 5, m.y + 12);
  });

  // ── SPIKES ────────────────────────────────────────────────
  // Every spike is drawn in an EMPTY cell (no platform under it).
  // The triangle fills the cell so it's clearly visible,
  // but it is NEVER drawn inside a solid tile (the safety check below skips those).
  (levelDef.spikes || []).forEach(s => {
    // Safety: if this cell ended up solid (shouldn't happen), skip
    if (_tileAt(s.col, s.row)) return;

    const sx = s.col * TILE;
    const sy = s.row * TILE;

    ctx.fillStyle   = '#ff1a33';
    ctx.shadowColor = '#ff1a33';
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    if (s.dir === 'up') {
      // Base at BOTTOM of cell, tip at TOP
      ctx.moveTo(sx + 4,        sy + TILE);   // bottom-left
      ctx.lineTo(sx + TILE / 2, sy + 2);      // tip (top-center)
      ctx.lineTo(sx + TILE - 4, sy + TILE);   // bottom-right
    } else {
      // Base at TOP of cell, tip at BOTTOM
      ctx.moveTo(sx + 4,        sy);           // top-left
      ctx.lineTo(sx + TILE / 2, sy + TILE - 2); // tip (bottom-center)
      ctx.lineTo(sx + TILE - 4, sy);           // top-right
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Goal flag
  const gx = goal.x, gy = goal.y;
  ctx.fillStyle = '#33ff88';
  ctx.fillRect(gx, gy, 3, goal.h);
  ctx.beginPath();
  ctx.moveTo(gx + 3,  gy);
  ctx.lineTo(gx + 26, gy + 12);
  ctx.lineTo(gx + 3,  gy + 24);
  ctx.closePath(); ctx.fill();
  ctx.font      = '9px Courier New';
  ctx.fillStyle = '#33ff88';
  ctx.fillText('GOAL', gx - 4, gy + goal.h + 13);

  // Player trail
  if (player.alive) {
    player.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / player.trail.length) * 0.2;
      const s = (i / player.trail.length) * player.w * 0.9;
      ctx.fillStyle = '#ff3355';
      ctx.fillRect(t.x - s / 2, t.y - s / 2 * (player.h / player.w), s, s * (player.h / player.w));
    });
    ctx.globalAlpha = 1;
  }

  // Player body
  if (player.alive) {
    ctx.fillStyle = '#ff3355';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(player.x, player.y, player.w, 4);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 4,  player.y + 7,  6, 6);
    ctx.fillRect(player.x + 14, player.y + 7,  6, 6);
    // Mouth (worried)
    ctx.fillRect(player.x + 5,  player.y + 19, 14, 3);
  } else {
    // Dead X
    ctx.fillStyle = 'rgba(255,51,85,0.35)';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.strokeStyle = '#ff3355'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(player.x + 4,  player.y + 4);
    ctx.lineTo(player.x + 20, player.y + 20);
    ctx.moveTo(player.x + 20, player.y + 4);
    ctx.lineTo(player.x + 4,  player.y + 20);
    ctx.stroke();
  }

  ctx.restore();
}
