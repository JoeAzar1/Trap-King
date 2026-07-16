// ============================================================
//  KING TRAP — state.js
//  Global mutable game state. Populated by auth.js on login.
// ============================================================

const STATE = {
  coins:           0,
  username:        '',
  unlockedLevels:  new Set(),
  purchasedIds:    new Set(),
  completedLevels: new Set(),
};

// Seed leaderboard (simulated other players)
const LEADERBOARD = [
  { name:'VOID_REAPER',  coins:9420, badge:'LEGEND',  levels:47 },
  { name:'DEATHTRAP99',  coins:7810, badge:'CREATOR', levels:22 },
  { name:'TRICKSTER',    coins:5500, badge:'ELITE',   levels:35 },
  { name:'DARKMASTER',   coins:4300, badge:'CREATOR', levels:18 },
  { name:'PIXEL_GHOST',  coins:3200, badge:'VETERAN', levels:61 },
  { name:'SERENITY',     coins:2100, badge:'BUILDER', levels:8  },
  { name:'SPEEDRUN_X',   coins:1800, badge:'VETERAN', levels:29 },
];

function getBadge(coins) {
  if (coins >= 5000) return 'LEGEND';
  if (coins >= 2000) return 'ELITE';
  if (coins >= 800)  return 'VETERAN';
  if (coins >= 300)  return 'PLAYER';
  return 'ROOKIE';
}

function addCoins(amount) {
  STATE.coins += amount;
  updateCoinDisplay();
  saveProgress(); // persist immediately
}

function updateCoinDisplay() {
  const el  = document.getElementById('coinDisplay');
  if (el)  el.textContent  = STATE.coins.toLocaleString();
  const hud = document.getElementById('hudCoins');
  if (hud) hud.textContent = STATE.coins.toLocaleString();
}
