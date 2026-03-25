'use strict';

/* ══════════════════════════════════════════
   ENGINE — Global Run State
   The single source of truth for all mutable game data.
   UI and engine modules read from this; mutations should
   go through dedicated engine functions, not direct access.
══════════════════════════════════════════ */

// ── Run-scoped globals (persist across levels) ──────────
let globalLevelIndex  = 0;  // Current level index (0–4)
let globalPlayerBoons = [];  // Acquired boon IDs for this run
let globalConsumedBoons = []; // Single-use boons spent this run
let globalPlayerHp = 0;       // Persistent current HP
let globalPlayerMaxHp = 0;    // Persistent max HP
let globalRunDeck = [];       // Persistent deck of card IDs
const draftPool = [
  'adrenaline', 'transfusion', 'scavenge', 'bloodShield',
  'absolution', 'martyr', 'leechStrike', 'shieldBash'
];

// ── Battle-scoped state (reset each level) ──────────────
let state = {};

/**
 * Creates a fresh initial state for a new battle.
 * @param {object} levelConfig - A level entry from LEVELS
 * @returns {object} Initial game state object
 */
function createInitialState(levelConfig) {
  // Setup persistent HP if starting a new run
  if (globalLevelIndex === 0 || globalPlayerMaxHp === 0) {
    globalPlayerMaxHp = levelConfig.playerHp;
    globalPlayerHp    = levelConfig.playerHp;
  } else {
    // Level override restricts maximum HP (e.g. "Start at 25 Max HP")
    globalPlayerMaxHp = levelConfig.playerHp;
    globalPlayerHp    = Math.min(globalPlayerHp, globalPlayerMaxHp);
  }

  return {
    turn:  1,
    phase: 'player',  // 'player' | 'enemy' | 'over'
    player: {
      maxHp:                globalPlayerMaxHp,
      hp:                   globalPlayerHp,
      armor:                0,
      insightActive:        false,
      insightActiveDuration: 0,
      insightMultiplier:    1,
      bloodDebt:            0,
      bloodTradePlayedThisTurn: false,
      bloodSurgeUsedThisTurn: false,
    },
    enemy: {
      maxHp:      levelConfig.enemyHp,
      hp:         levelConfig.enemyHp,
      armor:      0,
      enraged:    false,               // True once the enrage override fires
      intentState: createIntentState(), // Managed by intentEngine.js
    },
    deck: {
      drawPile:    [],
      discardPile: [],
      hand:        [],
      exhaustPile: [],
    },
    maxPlaysThisTurn:    3,
    cardsPlayedThisTurn: 0,
    selectedCards:       [],
  };
}
