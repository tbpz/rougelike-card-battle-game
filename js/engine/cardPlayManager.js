'use strict';

/* ══════════════════════════════════════════
   ENGINE — Card Play Manager
   Handles all card selection and batch-play logic.
   Extracted from combatEngine.js for single responsibility.

   Depends on: state.js, effectBus.js, utils.js,
               deckManager.js, ui/renderer.js
══════════════════════════════════════════ */

/**
 * Toggles a card's selection state.
 * Enforces VP budget — a card can only be staged if its vpCost
 * fits within the remaining unspent VP (minus VP already committed
 * by other staged cards).
 * @param {number} handIndex - Index of the card in state.deck.hand
 */
function toggleCardSelection(handIndex) {
  if (state.phase !== 'player') return;

  const card = state.deck.hand[handIndex];
  if (!card) return;

  const idx = state.selectedCards.indexOf(handIndex);
  if (idx !== -1) {
    // Deselect — always allowed
    state.selectedCards.splice(idx, 1);
  } else {
    // Calculate VP already committed by staged cards
    const stagedVP    = getStagedVPCost(state);
    const availableVP = state.vpRemaining - stagedVP;

    // Can't stage if this card costs more VP than what's available
    if (getCardVPCost(card) > availableVP) return;

    state.selectedCards.push(handIndex);
  }

  renderHand(state);
  updatePlaySelectedBtn();
}

/**
 * Plays all currently staged (selected) cards in selection order.
 * Deducts VP per card. Handles Echo doubling, All In forced end-turn,
 * Vampiric Strike end-of-batch, and win/loss after each card.
 */
function playSelectedCards() {
  if (state.selectedCards.length === 0) return;

  // Reverse-sort indices for safe splicing from hand
  const toPlay  = [...state.selectedCards].sort((a, b) => b - a);
  // Preserve original selection order for effect resolution
  const ordered = state.selectedCards.map(i => state.deck.hand[i]);

  // Move cards from hand to discard or exhaust
  const EXHAUST_ON_PLAY = new Set(['scavenge', 'absolution']);
  for (const i of toPlay) {
    const card = state.deck.hand[i];
    if (EXHAUST_ON_PLAY.has(card.id)) {
      state.deck.exhaustPile.push(card);
      log(`<span class="log-system">💨 [${card.name}] is Exhausted on play.</span>`);
    } else {
      state.deck.discardPile.push(card);
    }
    state.deck.hand.splice(i, 1);
  }

  state.selectedCards = [];

  let strikeCount  = 0;
  let forceEndTurn = false;

  for (const card of ordered) {
    state.cardsPlayedThisTurn += 1;
    state.vpRemaining -= getCardVPCost(card);
    if (card.id === 'strike') strikeCount++;

    card.play(state);
    updateAllUI(state);

    // Echo: if active and this card is NOT echo itself, play it again
    if (state.player.echoActive && card.id !== 'echo') {
      log(`<span class="log-buff">📣 Echo → [${card.name}] activates again!</span>`);
      state.player.echoActive = false;
      card.play(state);
      updateAllUI(state);
    }

    if (checkWin(state)) {
      setTimeout(() => endGame(state, true), 400);
      return;
    }
    if (checkLose(state)) {
      setTimeout(() => endGame(state, false), 400);
      return;
    }

    // All In: forces end of turn after this card resolves
    if (card.id === 'allIn') {
      forceEndTurn = true;
      break;
    }
  }

  // Vampiric Strike: heal if all 3 played this turn were Strikes
  if (RunState.playerBoons.includes('vampiricStrike') && strikeCount >= 3 && state.cardsPlayedThisTurn >= 3) {
    if (ordered.length === 3 && strikeCount === 3) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
      log(`💖 <span class="log-buff">Vampiric Strike → Restored 3 HP!</span>`);
    }
  }

  renderHand(state);
  updateDeckUI(state);
  updatePlayCounter(state);
  updatePlaySelectedBtn();
  updateEndTurnBtn();

  // All In forced end-turn (runs after UI update so player sees the damage)
  if (forceEndTurn) {
    setTimeout(() => endTurn(state), 600);
  }
}
