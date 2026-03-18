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

// ── Battle-scoped state (reset each level) ──────────────
let state = {};

/**
 * Creates a fresh initial state for a new battle.
 * @param {object} levelConfig - A level entry from LEVELS
 * @returns {object} Initial game state object
 */
function createInitialState(levelConfig) {
  return {
    turn:  1,
    phase: 'player',  // 'player' | 'enemy' | 'over'
    player: {
      maxHp:                levelConfig.playerHp,
      hp:                   levelConfig.playerHp,
      armor:                0,
      insightActive:        false,
      insightActiveDuration: 0,
      insightMultiplier:    1,
      bloodDebt:            0,
      bloodTradePlayedThisTurn: false,
    },
    enemy: {
      maxHp:     levelConfig.enemyHp,
      hp:        levelConfig.enemyHp,
      armor:     0,
      turnIndex: 0,
      enraged:   false,
    },
    deck: {
      drawPile:    [],
      discardPile: [],
      hand:        [],
      exhaustPile: [],
    },
    cardsPlayedThisTurn: 0,
    selectedCards:       [],
  };
}
