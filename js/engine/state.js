'use strict';

/* ══════════════════════════════════════════
   ENGINE — Global Run State
   The single source of truth for all mutable game data.
   
   RunState:  Persistent globals for a full game run.
              Replaces 6 bare module-level let variables.
   state:     Battle-scoped state object, reset each level.
══════════════════════════════════════════ */

// ── Run-scoped globals (persist across levels) ──────────
// Encapsulated in a single object to prevent implicit global coupling.
const RunState = {
  levelIndex:    0,  // Current level index (0–7)
  playerBoons:   [],  // Acquired boon IDs for this run
  consumedBoons: [], // Single-use boons spent this run
  playerHp:      0,  // Persistent current HP
  playerMaxHp:   0,  // Persistent max HP
  runDeck:       [],  // Persistent deck of card IDs

  /** Resets all run-scoped state back to defaults. Call on new run or defeat. */
  reset() {
    this.levelIndex    = 0;
    this.playerBoons   = [];
    this.consumedBoons = [];
    this.playerHp      = 0;
    this.playerMaxHp   = 0;
    this.runDeck       = [];
  },
};

// ── Battle-scoped state (reset each level) ──────────────
let state = {};

/**
 * Creates a fresh initial state for a new battle.
 * @param {object} levelConfig - A level entry from LEVELS
 * @returns {object} Initial game state object
 */
function createInitialState(levelConfig) {
  // Setup persistent HP if starting a new run
  if (RunState.levelIndex === 0 || RunState.playerMaxHp === 0) {
    RunState.playerMaxHp = 40;
    RunState.playerHp    = 40;
  }
  // Otherwise, HP simply carries over from the previous level.

  const baseVP = levelConfig.baseVP || 3;

  return {
    turn:  1,
    phase: 'player',  // 'player' | 'enemy' | 'over'
    player: {
      maxHp:                RunState.playerMaxHp,
      hp:                   RunState.playerHp,
      armor:                0,
      insightActive:        false,
      insightActiveDuration: 0,
      insightMultiplier:    1,
      bloodDebt:            0,
      bloodTradePlayedThisTurn: false,
      bloodSurgeUsedThisTurn: false,
      // Echo & Smolder state
      echoActive:           false,  // Next card played this turn fires twice
      smolderDamage:        0,      // Pending damage to deal at start of next turn
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
    // VP (Vow Points) — replaces maxPlaysThisTurn hard cap
    vpMax:               baseVP,   // Total VP available this turn
    vpRemaining:         baseVP,   // VP left to spend this turn
    cardsPlayedThisTurn: 0,        // Kept for Momentum boon (3rd card trigger)
    selectedCards:       [],
    // Pending visual effects to be processed by the UI layer
    _pendingEffects: [],
  };
}
