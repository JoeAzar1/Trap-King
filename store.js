// ============================================================
//  KING TRAP — store.js
//  Level store: browse, buy, play community levels.
//  Creator ONLY earns coins when another player pays to buy.
// ============================================================

function renderStore(tab) {
  const list  = document.getElementById('storeList');
  const items = tab === 'my'
    ? STORE_ITEMS.filter(s => s.author === STATE.username)
    : STORE_ITEMS.filter(s => s.tab   === tab);

  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = `<p style="color:#333;font-size:0.78rem;text-align:center;
      padding:2.5rem;letter-spacing:2px;">
      ${tab === 'my' ? 'YOU HAVE NO PUBLISHED LEVELS YET.<br>USE THE LEVEL BUILDER!' : 'NO LEVELS HERE YET.'}
    </p>`;
    return;
  }

  items.forEach(item => {
    const dc      = { EASY:'diff-easy', MEDIUM:'diff-med', HARD:'diff-hard', INSANE:'diff-insane' }[item.diff];
    const owned   = STATE.purchasedIds.has(item.id) || item.price === 0;
    const stars   = '★'.repeat(Math.floor(item.rating)) + '☆'.repeat(5 - Math.floor(item.rating));
    const priceLabel = item.price === 0 ? 'FREE' : item.price + ' COINS';
    const btnLabel   = owned ? 'PLAY' : 'BUY &amp; PLAY';

    const div = document.createElement('div');
    div.className = 'store-item';
    div.innerHTML = `
      <div class="store-item-info">
        <div class="store-item-name">
          ${item.name}
          <span class="${dc}" style="font-size:0.62rem;margin-left:4px;">[${item.diff}]</span>
        </div>
        <div class="store-item-desc">${item.desc} — by ${item.author}</div>
        <div class="store-item-rating">
          ${stars} ${item.rating || '—'} &nbsp;·&nbsp;
          ${item.plays} plays &nbsp;·&nbsp;
          ${item.reward} coin reward
        </div>
      </div>
      <div style="text-align:center;min-width:110px;">
        <div style="font-size:0.68rem;color:#ffaa00;margin-bottom:6px;">${priceLabel}</div>
        <button class="store-btn" onclick="openStorePlay('${item.id}')">${btnLabel}</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function switchStoreTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderStore(tab);
}

// ── Play modal ───────────────────────────────────────────────
function openStorePlay(id) {
  const item  = STORE_ITEMS.find(s => s.id === id);
  if (!item) return;
  const isOwn  = item.author === STATE.username;
  const owned  = STATE.purchasedIds.has(id) || item.price === 0 || isOwn;

  document.getElementById('spmTitle').textContent   = item.name;
  document.getElementById('spmDesc').textContent    = item.desc + ' — by ' + item.author;
  document.getElementById('spmDetails').textContent =
    isOwn
      ? `Your level · Difficulty: ${item.diff} · No coins awarded for playing your own level.`
      : `Difficulty: ${item.diff}  |  Reward on completion: ${item.reward} coins`;

  const btn = document.getElementById('spmPlayBtn');
  if (isOwn) {
    // Creator can always play their own level free, but earns no coins
    btn.textContent = 'PLAY (YOUR LEVEL)';
    btn.onclick     = () => { closeStorePlay(); _launchStoreLevel(item, true); };
  } else if (owned) {
    btn.textContent = 'PLAY NOW';
    btn.onclick     = () => { closeStorePlay(); _launchStoreLevel(item, false); };
  } else {
    btn.textContent = `BUY  (${item.price} COINS)`;
    btn.onclick     = () => _buyAndPlay(item);
  }

  document.getElementById('storePlayModal').classList.remove('hidden');
}

function closeStorePlay() {
  document.getElementById('storePlayModal').classList.add('hidden');
}

// ── Buy logic — creator earns 90% of sale price ──────────────
function _buyAndPlay(item) {
  if (STATE.coins < item.price) {
    alert(`You need ${item.price} coins but only have ${STATE.coins}.\nComplete more levels to earn coins!`);
    return;
  }

  STATE.coins -= item.price;

  // Creator earns 90% of the purchase price (stored in their localStorage account)
  if (item.author !== STATE.username && item.price > 0) {
    const payout    = Math.floor(item.price * 0.9);
    const creatorKey = item.author.toLowerCase();
    try {
      const db = JSON.parse(localStorage.getItem('kt_accounts') || '{}');
      if (db[creatorKey]) {
        db[creatorKey].coins += payout;
        localStorage.setItem('kt_accounts', JSON.stringify(db));
      }
    } catch(e) {}
    // Update leaderboard seed entry if it exists
    const lb = LEADERBOARD.find(p => p.name === item.author);
    if (lb) lb.coins += payout;
  }

  STATE.purchasedIds.add(item.id);
  item.plays++;
  updateCoinDisplay();
  saveProgress();
  closeStorePlay();
  _launchStoreLevel(item, false);
}

// ── Convert a store item's cell snapshot into a playable level ─
function _launchStoreLevel(item, isOwnLevel) {
  let def;
  if (item.cells && Object.keys(item.cells).length > 4) {
    def = cellsToLevelDef(item.cells, item);
  } else {
    def = { ...LEVELS[1], name: item.name, reward: item.reward, diff: item.diff };
  }
  showGameScreen();
  startLevel(99, def, isOwnLevel);
}
