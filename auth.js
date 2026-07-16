// ============================================================
//  KING TRAP — auth.js
//  Local account system. All data stored in localStorage.
//  Progress persists across browser sessions on the same device.
// ============================================================

const BANNED_WORDS = [
  'admin','moderator','mod','staff','owner','dev',
  'nigger','nigga','faggot','fag','retard','cunt','whore','slut',
  'fuck','shit','bitch','bastard','asshole','dick','cock',
  'pussy','piss','hitler','nazi','rape','kys','kms',
  'n1gger','f4ggot','b1tch','sh1t','a55','fuk','fck',
];

const ACCOUNTS_KEY = 'kt_accounts';
const SESSION_KEY  = 'kt_session';
const PENDING_KEY  = 'kt_pending';

// Change this password to your own secret before shipping
const ADMIN_PASSWORD = 'joeazar?';

// ── Storage helpers ───────────────────────────────────────────
function _db()       { try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; } catch { return {}; } }
function _saveDb(d)  { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(d)); }
function _pdb()      { try { return JSON.parse(localStorage.getItem(PENDING_KEY))  || {}; } catch { return {}; } }
function _savePdb(d) { localStorage.setItem(PENDING_KEY,  JSON.stringify(d)); }

function _hash(pw) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) ^ pw.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function _hasBanned(str) {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return BANNED_WORDS.some(w => clean.includes(w.replace(/[^a-z0-9]/g, '')));
}

// ── Validation ────────────────────────────────────────────────
function _checkUsername(u) {
  if (!u || u.length < 3)           return 'Username must be at least 3 characters.';
  if (u.length > 20)                return 'Username cannot exceed 20 characters.';
  if (!/^[a-zA-Z0-9_]+$/.test(u))  return 'Only letters, numbers and underscores (_) are allowed.';
  if (_hasBanned(u))                return 'That username contains a forbidden word.';
  return null;
}
function _checkPassword(p) {
  if (!p || p.length < 6) return 'Password must be at least 6 characters.';
  if (p.length > 50)      return 'Password cannot exceed 50 characters.';
  return null;
}

// ── Auth API ──────────────────────────────────────────────────
function authRegister(username, password) {
  const uErr = _checkUsername(username); if (uErr) return { ok:false, error:uErr };
  const pErr = _checkPassword(password); if (pErr) return { ok:false, error:pErr };
  const db = _db(), key = username.toLowerCase();
  if (db[key]) return { ok:false, error:'That username is already taken. Choose another.' };

  db[key] = {
    username, hash: _hash(password), created: Date.now(),
    coins: 120, unlockedLevels: [0,1,2],
    completedLevels: [], purchasedIds: [],
    inbox: [], submissions: [],
  };
  _saveDb(db);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, key }));
  return { ok: true };
}

function authLogin(username, password) {
  const db = _db(), key = username.toLowerCase(), acc = db[key];
  if (!acc)                         return { ok:false, error:'No account found with that username.' };
  if (acc.hash !== _hash(password)) return { ok:false, error:'Incorrect password.' };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: acc.username, key }));
  return { ok: true };
}

function authLogout() {
  saveProgress();
  localStorage.removeItem(SESSION_KEY);
  STATE.coins = 0; STATE.username = '';
  STATE.unlockedLevels = new Set(); STATE.purchasedIds = new Set(); STATE.completedLevels = new Set();
}

function authSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function authLoadProgress() {
  const s = authSession(); if (!s) return false;
  const acc = _db()[s.key];
  if (!acc) { localStorage.removeItem(SESSION_KEY); return false; }
  STATE.username = acc.username; STATE.coins = acc.coins;
  STATE.unlockedLevels  = new Set(acc.unlockedLevels);
  STATE.purchasedIds    = new Set(acc.purchasedIds);
  STATE.completedLevels = new Set(acc.completedLevels);
  return true;
}

function saveProgress() {
  const s = authSession(); if (!s) return;
  const db = _db(), acc = db[s.key]; if (!acc) return;
  acc.coins = STATE.coins;
  acc.unlockedLevels  = [...STATE.unlockedLevels];
  acc.purchasedIds    = [...STATE.purchasedIds];
  acc.completedLevels = [...STATE.completedLevels];
  _saveDb(db);
}

// ── Inbox ─────────────────────────────────────────────────────
function authInbox() {
  const s = authSession(); if (!s) return [];
  return (_db()[s.key] || {}).inbox || [];
}
function authClearInbox() {
  const s = authSession(); if (!s) return;
  const db = _db(); if (db[s.key]) { db[s.key].inbox = []; _saveDb(db); }
  _refreshInboxBadge();
}
function _pushInbox(key, msg) {
  const db = _db(); if (!db[key]) return;
  db[key].inbox.unshift(msg); _saveDb(db);
  const s = authSession();
  if (s && s.key === key) _refreshInboxBadge();
}
function _refreshInboxBadge() {
  const count = authInbox().length;
  const b = document.getElementById('inboxBadge');
  if (b) { b.textContent = count; b.style.display = count > 0 ? 'inline-block' : 'none'; }
}

// ── Level submission ──────────────────────────────────────────
function submitLevelForReview(data) {
  const s = authSession();
  if (!s) return { ok:false, error:'You must be logged in to submit levels.' };
  const pdb = _pdb();
  const id  = 'sub_' + Date.now();
  pdb[id]   = { id, author:s.username, authorKey:s.key, submittedAt:Date.now(), status:'pending', ...data };
  _savePdb(pdb);
  const db = _db(); if (db[s.key]) { db[s.key].submissions.push(id); _saveDb(db); }
  return { ok: true };
}

// ── Admin ─────────────────────────────────────────────────────
function adminGetPending() {
  return Object.values(_pdb()).filter(s => s.status === 'pending');
}

const APPROVED_KEY = 'kt_approved'; // persists approved levels across sessions

function _loadApproved() {
  try { return JSON.parse(localStorage.getItem(APPROVED_KEY)) || []; } catch { return []; }
}
function _saveApproved(list) {
  localStorage.setItem(APPROVED_KEY, JSON.stringify(list));
}

/** Call once at boot to restore all previously approved levels into STORE_ITEMS */
function loadApprovedIntoStore() {
  _loadApproved().forEach(item => {
    // Only add if not already present (avoids duplicates on re-boot)
    if (!STORE_ITEMS.find(s => s.id === item.id)) {
      STORE_ITEMS.push(item);
    }
  });
}

function adminApprove(id) {
  const pdb = _pdb(), sub = pdb[id]; if (!sub) return;
  sub.status = 'approved'; _savePdb(pdb);

  const storeItem = {
    id:sub.id, name:sub.name, author:sub.author, diff:sub.diff,
    reward:sub.reward, price:sub.price, rating:0, plays:0,
    desc:sub.desc, tab:'community', cells:sub.cells,
  };

  // Add to runtime array
  if (!STORE_ITEMS.find(s => s.id === storeItem.id)) {
    STORE_ITEMS.push(storeItem);
  }

  // Persist to localStorage so it survives logout and page reload
  const approved = _loadApproved();
  if (!approved.find(s => s.id === storeItem.id)) {
    approved.push(storeItem);
    _saveApproved(approved);
  }

  const payout = Math.floor(sub.reward * 0.9);
  const db = _db();
  if (db[sub.authorKey]) { db[sub.authorKey].coins += payout; _saveDb(db); }

  _pushInbox(sub.authorKey, {
    type:'approved', date:Date.now(),
    text:`✅ Your level "${sub.name}" was APPROVED and is now live in the store! You earned ${payout} coins (90% of the ${sub.reward}-coin reward).`,
  });

  const s = authSession();
  if (s && s.key === sub.authorKey) { STATE.coins += payout; updateCoinDisplay(); }
}

function adminReject(id, reason) {
  const pdb = _pdb(), sub = pdb[id]; if (!sub) return;
  sub.status = 'rejected'; _savePdb(pdb);
  _pushInbox(sub.authorKey, {
    type:'rejected', date:Date.now(),
    text:`❌ Your level "${sub.name}" was not approved.\n\nAdmin's message:\n${reason}`,
  });
}
