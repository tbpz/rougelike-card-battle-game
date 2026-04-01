'use strict';

/* ══════════════════════════════════════════
   ENGINE — Deck Manager
   Pure functions that operate on state.deck.
   No DOM access. No side effects outside state mutation.
══════════════════════════════════════════ */

const EXHAUST_ON_DISCARD = new Set(['bloodTrade', 'insight', 'scavenge', 'absolution']);

const STARTER_DECK = { strike: 4, defend: 4, bloodTrade: 1, insight: 1 };

/**
 * Builds an unshuffled deck array from the persistent run deck.
 * Initializes the run deck from the STARTER_DECK if it's the first level.
 * @param {object} levelConfig
 * @returns {object[]} Array of card copies
 */
function buildDeck(levelConfig) {
  const deck = [];

  if (RunState.levelIndex === 0 || RunState.runDeck.length === 0) {
    RunState.runDeck = [];
    const reqs = STARTER_DECK;
    for (const [id, count] of Object.entries(reqs)) {
      for (let i = 0; i < count; i++) {
        RunState.runDeck.push(id);
      }
    }
  }

  for (const id of RunState.runDeck) {
    const cardProto = CARD_CATALOG[id];
    if (cardProto) {
      deck.push({ ...cardProto });
    } else {
      console.error(`Card ID ${id} not found in catalog.`);
    }
  }
  return deck;
}

/**
 * Adds a new card to the persistent run deck.
 * @param {string} cardId
 */
function addCardToRunDeck(cardId) {
  RunState.runDeck.push(cardId);
}

/**
 * Retrieves a specified number of distinct random cards from the tiered draft pool.
 * Only cards from tiers 1 through the current level are available.
 * Cards already in the run deck are excluded (no duplicates).
 * @param {number} count
 * @returns {string[]} Array of card IDs
 */
function getDraftChoices(count = 3) {
  // Unlock a new tier every 2 levels
  // L1/L2 → Tier 1, L3/L4 → Tier 2, L5/L6 → Tier 3, L7 → Tier 4
  const maxTier = Math.min(4, Math.ceil((RunState.levelIndex + 1) / 2));

  let pool = [];
  for (let tier = 1; tier <= maxTier; tier++) {
    const tierCards = DRAFT_TIERS[tier] || [];
    for (const id of tierCards) {
      if (!RunState.runDeck.includes(id)) {
        pool.push(id);
      }
    }
  }

  const choices = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }
  return choices;
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
 * Moves all cards in hand to the discard pile (or exhaust pile for marked cards). Clears selection.
 * @param {object} state
 */
function discardHand(state) {
  for (const card of state.deck.hand) {
    if (EXHAUST_ON_DISCARD.has(card.id)) {
      state.deck.exhaustPile.push(card);
      log(`<span class="log-system">💨 [${card.name}] is Exhausted — lost for this level.</span>`);
    } else {
      state.deck.discardPile.push(card);
    }
  }
  state.deck.hand = [];
  state.selectedCards = [];
}
