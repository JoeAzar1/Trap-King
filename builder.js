// ============================================================
//  KING TRAP — builder.js
//  Level builder: paint cells → validate → submit to store
//  Creator earns coins ONLY when another player pays to play.
//  Publishing gives 0 coins.
// ============================================================

const BCOLS = COLS;   // same grid as engine (20 cols × 14 rows)
const BROWS = ROWS;

let bTool     = 'platform';
let bCells    = {};           // key: "col,row" → tool type string
let bPainting = false;
let bCanvas   = null;
let bCtx      = null;
let bInited   = false;

// Colours shown in the builder canvas per tool
const TOOL_STYLE = {
  platform:  { fill: '#1a2f4a', stroke: '#3399ff', label: 'P' },
  spike_up:  { fill: '#4a0a14', stroke: '#ff3355', label: '▲' },
  spike_dn:  { fill: '#3a0808', stroke: '#cc1133', label: '▼' },
  moving:    { fill: '#0e2a1a', stroke: '#33ff88', label: 'M' },
  disappear: { fill: '#2e1e50', stroke: '#8844cc', label: 'V' },
  goal:      { fill: '#0e3a1a', stroke: '#33ff88', label: 'G' },
  spawn:     { fill: '#3a2e00', stroke: '#ffaa00', label: 'S' },
};

// ── Public ────────────────────────────────────────────────────
function initBuilder() {
  bCanvas = document.getElementById('builderCanvas');
  bCtx    = bCanvas.getContext('2d');

  if (!bInited) {
    bInited = true;

    bCanvas.addEventListener('mousedown', e => { bPainting = true;  _handleCell(e); });
    bCanvas.addEventListener('mousemove', e => { if (bPainting) _handleCell(e); });
    bCanvas.addEventListener('mouseup',   () => { bPainting = false; });
    bCanvas.addEventListener('mouseleave',() => { bPainting = false; });

    bCanvas.addEventListener('touchstart', e => { e.preventDefault(); bPainting = true;  _handleCell(e.touches[0]); }, { passive: false });
    bCanvas.addEventListener('touchmove',  e => { e.preventDefault(); if (bPainting) _handleCell(e.touches[0]); },    { passive: false });
    bCanvas.addEventListener('touchend',   () => { bPainting = false; });
  }

  _drawBuilder();
}

function selectTool(type, btn) {
  bTool = type;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function clearBuilder() {
  bCells = {};
  _drawBuilder();
}

// Called when player presses "Submit to Store"
function showSubmitModal() {
  if (!authSession()) { alert('Please log in first to submit levels.'); return; }
  const types = Object.values(bCells);
  if (!types.includes('spawn'))    { alert('❌ Place a SPAWN point (S) first.'); return; }
  if (!types.includes('goal'))     { alert('❌ Place a GOAL flag (G) first.'); return; }
  if (!types.some(t => t === 'platform' || t === 'disappear')) {
    alert('❌ Add at least some platforms.'); return;
  }
  document.getElementById('submitModal').classList.remove('hidden');
}
function closeSubmit() { document.getElementById('submitModal').classList.add('hidden'); }

function submitLevel() {
  if (!authSession()) { alert('Please log in first.'); return; }
  const nameRaw = document.getElementById('lvlNameInput').value.trim();
  const desc    = document.getElementById('lvlDescInput').value.trim() || 'No description.';
  const diff    = document.getElementById('builderDiff').value;
  const price   = Math.max(0, Math.min(500, parseInt(document.getElementById('lvlPriceInput').value) || 0));
  if (!nameRaw) { alert('Please enter a level name.'); return; }

  const result = submitLevelForReview({
    name:   nameRaw.toUpperCase().slice(0, 30),
    desc, diff, price,
    reward: DIFF_REWARD[diff] || 80,
    cells:  { ...bCells },
  });
  if (!result.ok) { alert('Submission failed: ' + result.error); return; }

  document.getElementById('lvlNameInput').value  = '';
  document.getElementById('lvlDescInput').value  = '';
  document.getElementById('lvlPriceInput').value = '0';
  bCells = {}; _drawBuilder(); closeSubmit();

  const payout = Math.floor((DIFF_REWARD[diff] || 80) * 0.9);
  alert(
    `✅ Submitted for admin review!\n\n` +
    `You will get an inbox message once approved or rejected.\n` +
    `If approved → you earn ${payout} coins (90% of the reward).`
  );
}

// ── Internal ──────────────────────────────────────────────────
function _handleCell(e) {
  const rect = bCanvas.getBoundingClientRect();
  const mx   = (e.clientX || e.pageX) - rect.left;
  const my   = (e.clientY || e.pageY) - rect.top;
  const tw   = bCanvas.width  / BCOLS;
  const th   = bCanvas.height / BROWS;
  const col  = Math.floor(mx / tw);
  const row  = Math.floor(my / th);

  if (col < 0 || col >= BCOLS || row < 0 || row >= BROWS) return;
  if (row === BROWS - 1) return;   // floor row is locked — always solid

  // Enforce single spawn and single goal
  if (bTool === 'spawn') Object.keys(bCells).forEach(k => { if (bCells[k] === 'spawn') delete bCells[k]; });
  if (bTool === 'goal')  Object.keys(bCells).forEach(k => { if (bCells[k] === 'goal')  delete bCells[k]; });

  const key = `${col},${row}`;
  if (bTool === 'erase') delete bCells[key];
  else bCells[key] = bTool;

  _drawBuilder();
}

function _drawBuilder() {
  if (!bCtx) return;
  const tw = bCanvas.width  / BCOLS;
  const th = bCanvas.height / BROWS;

  // Background
  bCtx.fillStyle = '#08080d';
  bCtx.fillRect(0, 0, bCanvas.width, bCanvas.height);

  // Draw locked floor row
  const floorY = (BROWS - 1) * th;
  for (let c = 0; c < BCOLS; c++) {
    bCtx.fillStyle   = '#181f32';
    bCtx.fillRect(c * tw + 1, floorY + 1, tw - 2, th - 2);
    bCtx.strokeStyle = '#1e2a50'; bCtx.lineWidth = 0.8;
    bCtx.strokeRect(c * tw + 0.5, floorY + 0.5, tw - 1, th - 1);
  }
  bCtx.fillStyle = '#334'; bCtx.font = '7px Courier New';
  bCtx.fillText('FLOOR (always solid — cannot be edited)', 4, floorY + th / 2 + 3);

  // Grid lines for editable area
  bCtx.strokeStyle = '#111118'; bCtx.lineWidth = 0.5;
  for (let c = 0; c < BCOLS; c++)
    for (let r = 0; r < BROWS - 1; r++)
      bCtx.strokeRect(c * tw, r * th, tw, th);

  // Painted cells
  Object.entries(bCells).forEach(([key, type]) => {
    const [c, r] = key.split(',').map(Number);
    const x = c * tw, y = r * th;
    const cfg = TOOL_STYLE[type] || { fill: '#222', stroke: '#555', label: '?' };

    bCtx.fillStyle   = cfg.fill;
    bCtx.fillRect(x + 1, y + 1, tw - 2, th - 2);
    bCtx.strokeStyle = cfg.stroke; bCtx.lineWidth = 1.5;
    bCtx.strokeRect(x + 1, y + 1, tw - 2, th - 2);

    // Draw spike triangles so creator sees exactly how they'll look in-game
    if (type === 'spike_up' || type === 'spike_dn') {
      bCtx.fillStyle = cfg.stroke;
      bCtx.beginPath();
      if (type === 'spike_up') {
        bCtx.moveTo(x + 4,      y + th);    // bottom-left
        bCtx.lineTo(x + tw / 2, y + 2);     // tip at top
        bCtx.lineTo(x + tw - 4, y + th);    // bottom-right
      } else {
        bCtx.moveTo(x + 4,      y);          // top-left
        bCtx.lineTo(x + tw / 2, y + th - 2); // tip at bottom
        bCtx.lineTo(x + tw - 4, y);          // top-right
      }
      bCtx.closePath(); bCtx.fill();
    } else {
      bCtx.fillStyle = cfg.stroke;
      bCtx.font      = `bold ${Math.max(9, tw * 0.38)}px Courier New`;
      bCtx.fillText(cfg.label, x + tw / 2 - 5, y + th / 2 + 4);
    }
  });

  // Current tool label at top
  bCtx.fillStyle = 'rgba(255,51,85,0.07)';
  bCtx.fillRect(0, 0, bCanvas.width, 16);
  bCtx.fillStyle = '#555'; bCtx.font = '8px Courier New';
  bCtx.fillText('TOOL: ' + bTool.toUpperCase() + '   |   Click/drag to paint   |   Right-side: ERASE tool removes cells', 5, 11);
}
