'use strict';

/* ══════════════════════════════════════════
   ENGINE — Deck Manager
   Pure functions that operate on state.deck.
   No DOM access. No side effects outside state mutation.
══════════════════════════════════════════ */

/**
 * Builds an unshuffled deck array from a level's deck config.
 * @param {object} levelConfig
 * @returns {object[]} Array of card copies
 */
function buildDeck(levelConfig) {
  const deck = [];
  const reqs = levelConfig.deck;
  for (const [id, count] of Object.entries(reqs)) {
    const cardProto = CARD_CATALOG[id];
    for (let i = 0; i < count; i++) {
      deck.push({ ...cardProto });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle. Returns a new shuffled array.
 * @param {any[]} arr
 * @returns {any[]}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draws n cards from the draw pile into hand.
 * Auto-reshuffles discard into draw pile when empty.
 * @param {object} state
 * @param {number} n
 */
function drawCards(state, n) {
  for (let i = 0; i < n; i++) {
    if (state.deck.drawPile.length === 0) {
      if (state.deck.discardPile.length === 0) break;
      state.deck.drawPile = shuffle(state.deck.discardPile);
      state.deck.discardPile = [];
      log(`<span class="log-system">↻ Draw pile empty — discard reshuffled.</span>`);
    }
    state.deck.hand.push(state.deck.drawPile.pop());
  }
}

/**
 * Moves all cards in hand to the discard pile. Clears selection.
 * @param {object} state
 */
function discardHand(state) {
  state.deck.discardPile.push(...state.deck.hand);
  state.deck.hand = [];
  state.selectedCards = [];
}
