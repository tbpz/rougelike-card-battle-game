'use strict';

/* ══════════════════════════════════════════
   ENGINE — Combat Engine
   Orchestrates the game loop: turns, enemy AI,
   card play logic, and win/loss evaluation.
   Reads state, calls effectBus for mutations,
   calls renderer for UI updates. No direct DOM access.
══════════════════════════════════════════ */

// ─── Win / Lose Conditions ─────────────────────────────
function checkWin(state)  { return state.enemy.hp <= 0; }
function checkLose(state) { return state.player.hp <= 0; }

// ─── Enemy AI ──────────────────────────────────────────

/**
 * Returns the currently resolved intent for UI display.
 * The intent was pre-computed by resolveNextIntent() at the
 * start of the player's turn.
 * @param {object} state
 * @returns {object} Intent definition object
 */
function getIntentForDisplay(state) {
  const intent = state.enemy.intentState && state.enemy.intentState.currentIntent;
  if (intent) return intent;
  // Fallback to a neutral display if nothing is resolved yet
  return { name: '—', icon: '⚙️', type: 'safe', damage: 0 };
}

/**
 * Executes the cached enemy intent, advances cooldowns,
 * and pre-resolves the NEXT intent so the UI can display it
 * immediately after the enemy acts.
 * @param {object} state
 */
function enemyAct(state) {
  const levelConfig = LEVELS[globalLevelIndex];
  executeCurrentIntent(state, levelConfig);

  // After acting, update the enraged flag so the UI can react
  if (state.enemy.intentState.enrageOverrideTriggered && !state.enemy.enraged) {
    state.enemy.enraged = true;
    log(`<span class="log-blood">☠️ The Golem ENRAGES! Fatal Strike every turn!</span>`);
    document.getElementById('enemy-panel').classList.add('enraged');
    triggerShake();
  }

  applyLastRitesIfNeeded(state);
}

// ─── Turn Flow ─────────────────────────────────────────

/**
 * Triggers Blood Surge: +1 Action, +1 Blood Debt
 */
function triggerBloodSurge() {
  if (state.phase !== 'player') return;
  if (state.player.bloodSurgeUsedThisTurn) return;

  state.player.bloodSurgeUsedThisTurn = true;
  state.maxPlaysThisTurn += 1;
  state.player.bloodDebt += 1;
  log(`<span class="log-blood">💉 Blood Surge! +1 Action, +1 Blood Debt. Total Debt: ${state.player.bloodDebt}</span>`);
  
  // Try to cleanly re-evaluate UI buttons (these assume renderer.js functions are available)
  if (typeof updatePlayerUI === 'function') updatePlayerUI(state);
  if (typeof updatePlayCounter === 'function') updatePlayCounter(state);
  if (typeof updatePlaySelectedBtn === 'function') updatePlaySelectedBtn();
  if (typeof updateEndTurnBtn === 'function') updateEndTurnBtn();
  if (typeof renderHand === 'function') renderHand(state);
  if (typeof updateBloodSurgeBtn === 'function') updateBloodSurgeBtn(state);
}

/**
 * Starts a new player turn: reset turn state, apply start-of-turn boons,
 * draw cards, log intent header, update UI.
 * @param {object} state
 */
function startTurn(state) {
  state.phase              = 'player';
  state.maxPlaysThisTurn   = 3; // Reset max plays at the start of each turn
  state.cardsPlayedThisTurn = 0;
  state.selectedCards      = [];
  state.player.bloodSurgeUsedThisTurn = false;

  // Reset armor each turn
  state.player.armor = 0;

  // Grit: free armor at turn start
  if (globalPlayerBoons.includes('grit')) {
    state.player.armor += 3;
    log(`💪 <span class="log-defend">Grit → +3 Armor at start of turn.</span>`);
  }

  // Reset Blood Trade tracker each turn
  state.player.bloodTradePlayedThisTurn = false;

  // Blood Debt tick — apply cumulative damage before the turn begins
  if (state.player.bloodDebt > 0) {
    applyPlayerSelfDamage(state, state.player.bloodDebt);
    log(`<span class="log-blood">🩸 Blood Debt strikes! -${state.player.bloodDebt} HP (${state.player.bloodDebt} markers)</span>`);
    applyLastRitesIfNeeded(state);
    if (checkLose(state)) {
      endGame(state, false);
      return;
    }
  }

  // Tick down Insight duration
  if (state.player.insightActiveDuration > 0) {
    state.player.insightActiveDuration--;
  }
  if (state.player.insightActiveDuration <= 0) {
    state.player.insightActive     = false;
    state.player.insightMultiplier = 1;
  }

  // Pre-resolve the enemy's next intent BEFORE drawing cards,
  // so the UI can show what the enemy will do this turn.
  const levelConfig = LEVELS[globalLevelIndex];
  resolveNextIntent(state, levelConfig);

  // Draw 5 cards
  drawCards(state, 5);

  // Log turn header with current intent
  const intent = getIntentForDisplay(state);
  logTurnHeader(state.turn, intent);

  // Keep End Turn locked until 3 cards have been played
  document.getElementById('end-turn-btn').disabled = true;
  updatePlaySelectedBtn();

  updateAllUI(state);
}

/**
 * Ends the player turn: discard hand, check win, run enemy phase, start next turn.
 * @param {object} state
 */
function endTurn(state) {
  if (state.phase !== 'player') return;
  state.phase = 'enemy';

  discardHand(state);
  state.selectedCards = [];

  // Check win before enemy acts (player may have killed Golem this turn)
  if (checkWin(state)) {
    endGame(state, true);
    return;
  }

  // Enemy acts after a short delay for readability
  setTimeout(() => {
    enemyAct(state);
    updateAllUI(state);

    if (checkLose(state)) {
      endGame(state, false);
      return;
    }

    state.turn++;
    setTimeout(() => startTurn(state), 600);
  }, 500);
}

/**
 * Transitions to the end-game screen (win or lose).
 * @param {object} state
 * @param {boolean} playerWon
 */
function endGame(state, playerWon) {
  state.phase = 'over';
  const overlay = document.getElementById('result-overlay');
  const icon    = document.getElementById('result-icon');
  const title   = document.getElementById('result-title');
  const msg     = document.getElementById('result-message');
  const btn     = document.getElementById('restart-btn');

  overlay.classList.remove('hidden');

  if (playerWon) {
    icon.textContent = '🏆';
    if (globalLevelIndex < LEVELS.length - 1) {
      title.textContent = 'Victory!';
      title.className   = 'win';
      msg.textContent   = `The Golem's form shatters, but it begins to reassemble into something stronger... You survived ${state.turn} turns.`;
      btn.textContent   = 'Next Level ›';
      btn.onclick = () => {
        globalPlayerHp = Math.min(globalPlayerMaxHp, state.player.hp + Math.floor(globalPlayerMaxHp * 0.2));
        globalLevelIndex++;
        // Go to Spoils of War draft phase instead of directly to Boons
        if (typeof showDraftSelection === 'function') {
          showDraftSelection();
        } else {
          showBoonSelection();
        }
        overlay.classList.add('hidden');
      };
    } else {
      title.textContent = 'True Victory!';
      title.className   = 'win true-win';
      msg.textContent   = `You have broken the Final Vow. The Ancient Golem is no more. You are absolute.`;
      btn.textContent   = 'Play Again (Reset level 1)';
      btn.onclick = () => {
        globalLevelIndex    = 0;
        globalPlayerBoons   = [];
        globalConsumedBoons = [];
        globalPlayerHp      = 0;
        globalPlayerMaxHp   = 0;
        updateActiveBoonsUI();
        showIntroOverlay();
        overlay.classList.add('hidden');
      };
    }
  } else {
    icon.textContent  = '💀';
    title.textContent = 'Defeated.';
    title.className   = 'lose';
    msg.textContent   = `The Golem's power overwhelms you. The Vow remains unbroken.`;
    btn.textContent   = 'Play Again (Reset level 1)';
    btn.onclick = () => {
      globalLevelIndex    = 0;
      globalPlayerBoons   = [];
      globalConsumedBoons = [];
      globalPlayerHp      = 0;
      globalPlayerMaxHp   = 0;
      updateActiveBoonsUI();
      showIntroOverlay();
      overlay.classList.add('hidden');
    };
  }
}

// ─── Card Play Logic ───────────────────────────────────

/**
 * Toggles a card's selection state. Enforces FIFO eviction
 * when the 4th card is selected beyond the 3-card limit.
 * @param {number} handIndex - Index of the card in state.deck.hand
 */
function toggleCardSelection(handIndex) {
  if (state.phase !== 'player') return;
  if (state.cardsPlayedThisTurn >= state.maxPlaysThisTurn) return;

  const idx = state.selectedCards.indexOf(handIndex);
  if (idx !== -1) {
    // Deselect
    state.selectedCards.splice(idx, 1);
  } else {
    const maxAllowed = state.maxPlaysThisTurn - state.cardsPlayedThisTurn;
    if (state.selectedCards.length >= maxAllowed) {
      // FIFO: drop oldest selection to make room
      state.selectedCards.shift();
    }
    state.selectedCards.push(handIndex);
  }

  renderHand(state);
  updatePlaySelectedBtn();
}

/**
 * Plays all currently staged (selected) cards in selection order.
 * Evaluates win/loss after each card. Handles Vampiric Strike end-of-batch.
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

  let strikeCount = 0;

  for (const card of ordered) {
    state.cardsPlayedThisTurn += 1;
    if (card.id === 'strike') strikeCount++;

    card.play(state);
    updateAllUI(state);

    if (checkWin(state)) {
      setTimeout(() => endGame(state, true), 400);
      return;
    }
    if (checkLose(state)) {
      setTimeout(() => endGame(state, false), 400);
      return;
    }
  }

  // Vampiric Strike: heal if all 3 played were Strikes
  if (globalPlayerBoons.includes('vampiricStrike') && ordered.length === 3 && strikeCount === 3) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
    log(`💖 <span class="log-buff">Vampiric Strike → Restored 3 HP!</span>`);
    updatePlayerUI(state);
  }

  renderHand(state);
  updateDeckUI(state);
  updatePlayCounter(state);
  updatePlaySelectedBtn();
  updateEndTurnBtn();
}
