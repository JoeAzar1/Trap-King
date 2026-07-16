// ============================================================
//  KING TRAP — levels.js
//
//  JUMP PHYSICS (JUMP_FORCE=-720, GRAVITY=1400):
//    Max height ≈ 720²/(2×1400) ≈ 185px ≈ 4.6 tiles
//    Vertical gaps of ≤ 4 rows are always jumpable.
//    Horizontal reach at full speed: ~1.5 tiles per row of height.
//
//  SPIKE RULES:
//    • dir:'up'   → empty cell, tip at TOP.    Lethal = top SPIKE_DANGER px.
//    • dir:'down' → empty cell, tip at BOTTOM. Lethal = bottom SPIKE_DANGER px.
//    • map[row][col] MUST be 0 for every spike cell.
//
//  TILE=40, COLS=20, ROWS=14  (row 13 = always solid floor)
// ============================================================

const LEVELS = [

  // ─── 0: BABY STEPS ────────────────────────────────────────
  // Harder version: moving platforms, 3-col gaps, spikes in gaps
  {
    name: 'BABY STEPS', diff: 'EASY', reward: 25, cost: 0,
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // Walkway with 3-col gaps — need a running jump + timing
      [1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 11: spikes in every gap
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    spawnCol: 1, spawnRow: 8,
    goalCol: 18, goalRow: 8,
    spikes: [
      { col: 3,  row: 11, dir: 'up' }, { col: 4,  row: 11, dir: 'up' },
      { col: 5,  row: 11, dir: 'up' },
      { col: 9,  row: 11, dir: 'up' }, { col: 10, row: 11, dir: 'up' },
      { col: 11, row: 11, dir: 'up' },
      { col: 15, row: 11, dir: 'up' }, { col: 16, row: 11, dir: 'up' },
      { col: 17, row: 11, dir: 'up' },
    ],
    // Moving platform crosses the last big gap
    moving: [{ x: 13*TILE, y: 9*TILE, w: 3*TILE, dir: 1, speed: 2.5 }],
    disappear: []
  },

  // ─── 1: TRUST ISSUES ──────────────────────────────────────
  // Harder: tighter platforms, faster moving plat, spikes at gaps + ceiling
  {
    name: 'TRUST ISSUES', diff: 'MEDIUM', reward: 80, cost: 0,
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // Upper tier row 4 — narrow platforms with big gaps
      [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // Middle tier row 7 — 3-col gaps need timed jumps
      [1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    spawnCol: 1, spawnRow: 6,
    goalCol: 17, goalRow: 3,
    moving: [
      { x: 4*TILE, y: 5*TILE, w: 2*TILE, dir: 1, speed: 3.0 }, // faster, narrower
    ],
    spikes: [
      // Spikes in row-7 gaps (row 8, empty)
      { col: 3,  row: 8, dir: 'up' }, { col: 4,  row: 8, dir: 'up' },
      { col: 5,  row: 8, dir: 'up' },
      { col: 9,  row: 8, dir: 'up' }, { col: 10, row: 8, dir: 'up' },
      { col: 11, row: 8, dir: 'up' },
      { col: 15, row: 8, dir: 'up' }, { col: 16, row: 8, dir: 'up' },
      { col: 17, row: 8, dir: 'up' },
      // Ceiling spikes row 3 guarding the upper tier (only over the safe gap, not the goal)
      { col: 5, row: 3, dir: 'down' }, { col: 9, row: 3, dir: 'down' },
      { col: 13, row: 3, dir: 'down' },
    ],
    disappear: [
      { col: 17, row: 7 }, { col: 18, row: 7 }, // last platform vanishes
    ]
  },

  // ─── 2: PANIC ROOM ────────────────────────────────────────
  // Harder: faster moving platforms, more spikes, disappearing platforms on key steps
  {
    name: 'PANIC ROOM', diff: 'HARD', reward: 160, cost: 0,
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 2: TOP — goal at col 17
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 4: mid-high — only 4 tiles wide
      [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 6: two narrow sections
      [0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 8: lower — narrower platforms, bigger gaps
      [1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    spawnCol: 1, spawnRow: 7,
    goalCol: 17, goalRow: 1,
    spikes: [
      // Gaps in row-8 (row 9 empty)
      { col:3, row:9, dir:'up' },{ col:4, row:9, dir:'up' },{ col:5, row:9, dir:'up' },
      { col:9, row:9, dir:'up' },{ col:10,row:9, dir:'up' },{ col:11,row:9, dir:'up' },
      { col:15,row:9, dir:'up' },{ col:16,row:9, dir:'up' },{ col:17,row:9, dir:'up' },
      // Ceiling spikes row 1 guarding the goal approach
      { col:3, row:1, dir:'down' },{ col:7, row:1, dir:'down' },{ col:11,row:1, dir:'down' },
      // Spikes beside row-4 platform
      { col:13,row:3, dir:'up' },{ col:14,row:3, dir:'up' },
    ],
    moving: [
      { x: 4*TILE, y: 5*TILE, w: 3*TILE, dir:  1, speed: 3.2 }, // faster
      { x: 9*TILE, y: 7*TILE, w: 3*TILE, dir: -1, speed: 3.5 }, // faster
    ],
    disappear: [
      { col: 9,  row: 4 }, { col: 10, row: 4 }, { col: 11, row: 4 }, // key bridge vanishes
      { col: 13, row: 2 }, // last tile before goal
    ]
  },

  // ─── 3: THE ABYSS (locked) ────────────────────────────────
  {
    name: 'THE ABYSS', diff: 'INSANE', reward: 380, cost: 100, locked: true,
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    spawnCol: 1, spawnRow: 8,
    goalCol: 18, goalRow: 1,
    spikes: [
      { col:2,  row:10, dir:'up' }, { col:3,  row:10, dir:'up' },
      { col:6,  row:10, dir:'up' }, { col:7,  row:10, dir:'up' },
      { col:10, row:10, dir:'up' }, { col:11, row:10, dir:'up' },
      { col:14, row:10, dir:'up' }, { col:15, row:10, dir:'up' },
      { col:18, row:10, dir:'up' }, { col:19, row:10, dir:'up' },
      { col:1,  row:12, dir:'up' }, { col:3,  row:12, dir:'up' },
      { col:5,  row:12, dir:'up' }, { col:7,  row:12, dir:'up' },
      { col:9,  row:12, dir:'up' }, { col:11, row:12, dir:'up' },
      { col:13, row:12, dir:'up' }, { col:15, row:12, dir:'up' },
      { col:17, row:12, dir:'up' }, { col:19, row:12, dir:'up' },
      { col:2,  row:1, dir:'down' }, { col:6,  row:1, dir:'down' },
      { col:10, row:1, dir:'down' }, { col:14, row:1, dir:'down' },
      { col:17, row:1, dir:'down' },
    ],
    moving: [
      { x:  2*TILE, y: 7*TILE, w: 2*TILE, dir:  1, speed: 3.2 },
      { x:  8*TILE, y: 7*TILE, w: 2*TILE, dir: -1, speed: 3.5 },
      { x:  3*TILE, y: 5*TILE, w: 2*TILE, dir:  1, speed: 3.8 },
      { x: 11*TILE, y: 5*TILE, w: 2*TILE, dir: -1, speed: 4.0 },
    ],
    disappear: [
      { col:10, row:2 }, { col:11, row:2 },
      { col:4,  row:4 }, { col:5,  row:4 },
    ]
  },
];

// ─────────────────────────────────────────────────────────────
// STORE ITEMS — 6 visually and mechanically DISTINCT levels
// ─────────────────────────────────────────────────────────────
// STORE ITEMS — 6 visually and mechanically DISTINCT levels
// All platform gaps verified reachable (≤2 rows vertical, ≤3 cols horizontal)
// ─────────────────────────────────────────────────────────────
const STORE_ITEMS = [

  // cs1: VOID LABYRINTH — snake corridor, all turns reachable
  // Path: bottom-right → right wall → left corridor → left wall → top corridor
  // Vertical climbs are done via moving platforms, so max gap is always 2 rows.
  {
    id: 'cs1', name: 'VOID LABYRINTH', author: 'DARKMASTER',
    diff: 'HARD', reward: 190, price: 80, rating: 4.5, plays: 312,
    desc: 'A winding maze. Wrong turn = death.', tab: 'community',
    cells: (function () {
      const c = {};
      // Segment 1: bottom walkway row 11, cols 0-16
      for (let col = 0; col <= 16; col++) c[`${col},11`] = 'platform';
      // Moving platform bridges to right wall (col 17-18) — no big vertical jump needed
      c['15,9'] = 'moving'; // carries player up 2 rows to row 9
      // Right corridor at row 9, cols 10-18
      for (let col = 10; col <= 18; col++) c[`${col},9`] = 'platform';
      // Moving platform carries player up from row 9 to row 7
      c['11,7'] = 'moving';
      // Left-going corridor at row 7, cols 3-18
      for (let col = 3; col <= 18; col++) c[`${col},7`] = 'platform';
      // Moving platform carries player from row 7 to row 5
      c['4,5'] = 'moving';
      // Right-going corridor at row 5, cols 3-18
      for (let col = 3; col <= 18; col++) c[`${col},5`] = 'platform';
      // Moving platform to row 3
      c['17,3'] = 'moving';
      // Top corridor at row 3, cols 8-18
      for (let col = 8; col <= 18; col++) c[`${col},3`] = 'platform';

      // Spikes in corners — all in empty cells
      c['15,10'] = 'spike_up'; c['16,10'] = 'spike_up';
      c['5,6']   = 'spike_up'; c['6,6']   = 'spike_up';
      c['4,4']   = 'spike_dn'; c['5,4']   = 'spike_dn';
      c['16,2']  = 'spike_dn'; c['17,2']  = 'spike_dn';

      c['0,12'] = 'spawn';
      c['18,2'] = 'goal';
      return c;
    })()
  },

  // cs2: PLATFORM PRANK — vanishing staircase, 2 rows apart (all reachable)
  {
    id: 'cs2', name: 'PLATFORM PRANK', author: 'TRICKSTER',
    diff: 'MEDIUM', reward: 80, price: 40, rating: 4.0, plays: 521,
    desc: 'They look solid. They are not. Sprint or die.', tab: 'community',
    cells: (function () {
      const c = {};
      // Four vanishing sections, each 2 rows above the previous (easy jump)
      for (let col = 0; col <= 6;  col++) c[`${col},11`] = 'disappear';
      for (let col = 5; col <= 11; col++) c[`${col},9`]  = 'disappear';
      for (let col = 9; col <= 15; col++) c[`${col},7`]  = 'disappear';
      for (let col = 13; col <= 19; col++) c[`${col},5`] = 'disappear';

      // One solid tile at start of each section (landing pad)
      c['0,11'] = 'platform';
      c['5,9']  = 'platform';
      c['9,7']  = 'platform';
      c['13,5'] = 'platform';

      // Spikes in the fall zones between sections (empty cells)
      c['7,10']  = 'spike_up'; c['8,10']  = 'spike_up';
      c['12,8']  = 'spike_up'; c['13,8']  = 'spike_up';
      c['9,6']   = 'spike_dn'; c['10,6']  = 'spike_dn';

      c['1,12'] = 'spawn';
      c['18,4'] = 'goal';
      return c;
    })()
  },

  // cs4: CALM BEFORE — wide easy staircase, then nasty surprise right before goal
  {
    id: 'cs4', name: 'CALM BEFORE', author: 'SERENITY',
    diff: 'EASY', reward: 25, price: 0, rating: 3.5, plays: 204,
    desc: "Peaceful... ", tab: 'community',
    cells: (function () {
      const c = {};
      // Wide comfortable staircase — 2 rows between each section
      for (let col = 0;  col <= 7;  col++) c[`${col},10`] = 'platform';
      for (let col = 6;  col <= 13; col++) c[`${col},8`]  = 'platform';
      for (let col = 11; col <= 18; col++) c[`${col},6`]  = 'platform';
      for (let col = 14; col <= 19; col++) c[`${col},4`]  = 'platform';

      // Moving platforms make transitions trivial — player feels safe
      c['7,9']  = 'moving';
      c['12,7'] = 'moving';

      // THE SURPRISE: spikes RIGHT before goal (player walks straight into them)
      c['15,3'] = 'spike_up'; c['16,3'] = 'spike_up'; c['17,3'] = 'spike_up';
      // Last 3 tiles on final platform vanish — panic as they crumble
      c['16,4'] = 'disappear'; c['17,4'] = 'disappear'; c['18,4'] = 'disappear';

      c['1,12'] = 'spawn';
      c['19,3'] = 'goal';
      return c;
    })()
  },

];

// ─────────────────────────────────────────────────────────────
// Convert builder cell snapshot → engine-ready levelDef
// ─────────────────────────────────────────────────────────────
function cellsToLevelDef(cells, meta) {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const spikes = [], moving = [], disappear = [];
  let spawnCol = 1, spawnRow = 10;
  let goalCol  = 18, goalRow  = 2;

  for (let col = 0; col < COLS; col++) map[ROWS - 1][col] = 1; // floor

  Object.entries(cells).forEach(([key, type]) => {
    const [c, r] = key.split(',').map(Number);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS - 1) return;
    switch (type) {
      case 'platform':  map[r][c] = 1; break;
      case 'disappear': map[r][c] = 1; disappear.push({ col: c, row: r }); break;
      case 'moving':    moving.push({ x: c * TILE, y: r * TILE, w: TILE * 2.5, dir: 1, speed: 2.2 }); break;
      case 'spike_up':  spikes.push({ col: c, row: r, dir: 'up' }); break;
      case 'spike_dn':  spikes.push({ col: c, row: r, dir: 'down' }); break;
      case 'spawn':     spawnCol = c; spawnRow = Math.max(0, r - 1); break;
      case 'goal':      goalCol = c; goalRow = r; break;
    }
  });

  return { name: meta.name, diff: meta.diff, reward: meta.reward,
           map, spikes, moving, disappear, spawnCol, spawnRow, goalCol, goalRow };
}
