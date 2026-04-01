'use strict';

/* ══════════════════════════════════════════
   ENGINE — Utility Functions
   Shared helpers used across engine modules.
   No DOM access. No direct state mutation.
══════════════════════════════════════════ */

/**
 * Returns the VP cost of a card, defaulting to 1 if vpCost is not defined.
 * @param {object} card - A card object from the hand or catalog
 * @returns {number}
 */
function getCardVPCost(card) {
  return card.vpCost !== undefined ? card.vpCost : 1;
}

/**
 * Calculates the total VP already committed by cards currently staged
 * (selected but not yet played).
 * @param {object} state
 * @returns {number}
 */
function getStagedVPCost(state) {
  return state.selectedCards.reduce((sum, i) => {
    const c = state.deck.hand[i];
    return sum + (c ? getCardVPCost(c) : 0);
  }, 0);
}

/**
 * Safe accessor for the player's current state. Returns null when called
 * outside of an active battle (e.g., from getEffectText() in a draft modal).
 * Eliminates the verbose `typeof state !== 'undefined' && state.player` pattern.
 * @returns {object|null}
 */
function safePlayerState() {
  return (typeof state !== 'undefined' && state && state.player) ? state.player : null;
}
