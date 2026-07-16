// ============================================================
//  KING TRAP — constants.js
//  All shared constants for the game
// ============================================================

const TILE        = 40;   // px per grid cell
const COLS        = 20;   // grid columns
const ROWS        = 14;   // grid rows  (row 13 = solid floor)
const GRAVITY     = 1400; // px / s²
const MOVE_SPEED  = 250;  // px / s  horizontal
const JUMP_FORCE  = -720; // px / s — reaches ~3.7 tiles high (≈ 148px)
const MAX_FALL    = 980;  // terminal velocity

// Spike hitbox: how many px from the TIP inward the danger zone extends
const SPIKE_DANGER = 22;  // px

// Difficulty → base coin reward
const DIFF_REWARD = { EASY: 25, MEDIUM: 80, HARD: 160, INSANE: 380 };
