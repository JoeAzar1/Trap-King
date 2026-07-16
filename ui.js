// ============================================================
//  KING TRAP — ui.js
//  Screen navigation, level select, leaderboard, modals
// ============================================================

function _hideAll() {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('game-wrap').classList.remove('active');
  document.getElementById('currencyBar').style.display = 'none';
  stopGame();
}
function _showCurrency() {
  document.getElementById('currencyBar').style.display = 'flex';
  updateCoinDisplay();
  _refreshInboxBadge();
}

// ── Screen routing ────────────────────────────────────────────
function showMenu() {
  _hideAll();
  document.getElementById('menuScreen').classList.remove('hidden');
  _showCurrency();
  // Update username display
  const unEl = document.getElementById('menuUsername');
  if (unEl) unEl.textContent = STATE.username ? `Logged in as: ${STATE.username}` : '';
}
function showLevelSelect() {
  _hideAll();
  document.getElementById('levelSelectScreen').classList.remove('hidden');
  _showCurrency(); renderLevelGrid();
}
function showStore() {
  _hideAll();
  document.getElementById('storeScreen').classList.remove('hidden');
  _showCurrency();
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  renderStore('community');
}
function showBuilder() {
  _hideAll();
  document.getElementById('builderScreen').classList.remove('hidden');
  _showCurrency(); initBuilder();
}
function showLeaderboard() {
  _hideAll();
  document.getElementById('leaderboardScreen').classList.remove('hidden');
  _showCurrency(); renderLeaderboard();
}
function showGameScreen() {
  _hideAll();
  document.getElementById('game-wrap').classList.add('active');
  _showCurrency();
}
function exitGame() { stopGame(); showMenu(); }

// ── Inbox screen ──────────────────────────────────────────────
function showInbox() {
  _hideAll();
  document.getElementById('inboxScreen').classList.remove('hidden');
  _showCurrency();
  const msgs  = authInbox();
  const list  = document.getElementById('inboxList');
  list.innerHTML = '';
  if (!msgs.length) {
    list.innerHTML = '<p style="color:#444;font-size:0.78rem;letter-spacing:2px;padding:1rem 0;">No messages yet.</p>';
  } else {
    msgs.forEach(m => {
      const div = document.createElement('div');
      div.style.cssText = 'border:1px solid #1e1e2a;padding:1rem;margin-bottom:0.8rem;';
      const date = new Date(m.date).toLocaleDateString();
      const color = m.type === 'approved' ? '#33ff88' : '#ff3355';
      div.innerHTML = `
        <div style="font-size:0.65rem;color:#444;letter-spacing:2px;margin-bottom:6px;">${date}</div>
        <div style="font-size:0.78rem;color:${color};white-space:pre-wrap;line-height:1.6;">${m.text}</div>`;
      list.appendChild(div);
    });
  }
  authClearInbox();
}

// ── Admin panel ───────────────────────────────────────────────
function showAdminLogin() {
  document.getElementById('adminLoginModal').classList.remove('hidden');
  document.getElementById('adminPassInput').value = '';
}
function closeAdminLogin() {
  document.getElementById('adminLoginModal').classList.add('hidden');
}
function adminLoginSubmit() {
  const pw = document.getElementById('adminPassInput').value;
  if (pw !== ADMIN_PASSWORD) { alert('Wrong admin password.'); return; }
  closeAdminLogin();
  showAdminPanel();
}
function showAdminPanel() {
  _hideAll();
  document.getElementById('adminScreen').classList.remove('hidden');
  renderAdminPanel();
}
function renderAdminPanel() {
  const list    = document.getElementById('adminList');
  const pending = adminGetPending();
  list.innerHTML = '';
  if (!pending.length) {
    list.innerHTML = '<p style="color:#444;font-size:0.78rem;letter-spacing:2px;padding:1rem 0;">No pending submissions.</p>';
    return;
  }
  pending.forEach(sub => {
    const date = new Date(sub.submittedAt).toLocaleDateString();
    const div  = document.createElement('div');
    div.style.cssText = 'border:1px solid #2a2a2a;padding:1.2rem;margin-bottom:1rem;';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
        <div style="flex:1;">
          <div style="font-size:0.85rem;color:#ccc;letter-spacing:2px;margin-bottom:4px;">${sub.name} <span style="color:#ffaa00;font-size:0.65rem;">[${sub.diff}]</span></div>
          <div style="font-size:0.7rem;color:#555;margin-bottom:4px;">${sub.desc} — by <strong style="color:#aaa;">${sub.author}</strong> · ${date}</div>
          <div style="font-size:0.68rem;color:#ffaa00;">Reward: ${sub.reward} coins · Price: ${sub.price === 0 ? 'FREE' : sub.price + ' coins'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;min-width:130px;">
          <button class="btn sm green" onclick="adminDoApprove('${sub.id}')">✓ APPROVE</button>
          <button class="btn sm" onclick="adminDoReject('${sub.id}')">✕ REJECT</button>
          <button class="btn sm blue" onclick="adminPreview('${sub.id}')">▶ PREVIEW</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
}

function adminDoApprove(id) {
  if (!confirm('Approve this level? Creator will earn 90% of the reward coins.')) return;
  adminApprove(id);
  renderAdminPanel();
}
function adminDoReject(id) {
  const reason = prompt('Enter your rejection message to the creator:');
  if (reason === null) return; // cancelled
  if (!reason.trim()) { alert('Please enter a reason.'); return; }
  adminReject(id, reason.trim());
  renderAdminPanel();
}
function adminPreview(id) {
  const pdb = Object.values(JSON.parse(localStorage.getItem('kt_pending') || '{}')).find(s => s.id === id);
  if (!pdb || !pdb.cells) { alert('No level data to preview.'); return; }
  const def = cellsToLevelDef(pdb.cells, { name: pdb.name, diff: pdb.diff, reward: pdb.reward });
  showGameScreen();
  startLevel(99, def, true); // isOwnLevel=true so no coins
}

// ── Level select grid ─────────────────────────────────────────
function renderLevelGrid() {
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  LEVELS.forEach((lvl, i) => {
    const unlocked = STATE.unlockedLevels.has(i);
    const dc = {EASY:'diff-easy',MEDIUM:'diff-med',HARD:'diff-hard',INSANE:'diff-insane'}[lvl.diff];
    const card = document.createElement('div');
    card.className = 'level-card' + (unlocked ? '' : ' locked');
    card.innerHTML = `
      ${!unlocked ? `<div class="lock-badge">🔒 ${lvl.cost}C</div>` : ''}
      <div class="lc-name">${lvl.name}</div>
      <div class="lc-diff ${dc}">${lvl.diff}</div>
      <div class="lc-reward">REWARD: ${lvl.reward} COINS</div>
      ${STATE.completedLevels.has(i) ? '<div style="font-size:0.62rem;color:#33ff88;margin-top:5px;">✓ COMPLETED</div>' : ''}`;
    card.onclick = unlocked ? () => _launchBuiltinLevel(i) : () => _tryUnlock(i, lvl);
    grid.appendChild(card);
  });
}
function _launchBuiltinLevel(i) { showGameScreen(); startLevel(i); }
function _tryUnlock(i, lvl) {
  if (STATE.coins >= lvl.cost) {
    if (confirm(`Spend ${lvl.cost} coins to unlock "${lvl.name}"?`)) {
      STATE.coins -= lvl.cost;
      STATE.unlockedLevels.add(i);
      updateCoinDisplay(); saveProgress(); renderLevelGrid();
    }
  } else {
    alert(`You need ${lvl.cost} coins to unlock this level.\nYou currently have ${STATE.coins} coins.`);
  }
}

// ── Leaderboard ───────────────────────────────────────────────
function renderLeaderboard() {
  const data = [
    ...LEADERBOARD,
    { name:STATE.username, coins:STATE.coins, badge:getBadge(STATE.coins), levels:STATE.completedLevels.size }
  ].sort((a,b) => b.coins - a.coins);

  const list = document.getElementById('lbList');
  list.innerHTML = '';
  data.forEach((p, i) => {
    const rc   = i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const isMe = p.name === STATE.username;
    const li   = document.createElement('li');
    li.innerHTML = `
      <span class="lb-rank ${rc}">${i+1}</span>
      <span class="lb-name" style="${isMe?'color:#ff3355':''}">${p.name}${isMe?' ◄ YOU':''}</span>
      <span class="lb-badge">${p.badge}</span>
      <span style="font-size:0.65rem;color:#444;">${p.levels} lvl${p.levels!==1?'s':''}</span>
      <span class="lb-coins">${p.coins.toLocaleString()} ◈</span>`;
    list.appendChild(li);
  });
}

// ── Win modal ─────────────────────────────────────────────────
function closeWin() {
  document.getElementById('winModal').classList.add('hidden');
  showMenu();
}
