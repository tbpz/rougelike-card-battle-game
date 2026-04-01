'use strict';

/* ══════════════════════════════════════════
   ENGINE — Turn Manager
   Manages player and enemy turn flow:
   start-of-turn setup, boon ticks, enemy phase.
   Extracted from combatEngine.js for single responsibility.

   Depends on: state.js, effectBus.js, deckManager.js,
               intentEngine.js, utils.js, ui/renderer.js
══════════════════════════════════════════ */

/**
 * Starts a new player turn: reset turn state, apply start-of-turn effects,
 * draw cards, log intent header, update UI.
 * @param {object} state
 */
function startTurn(state) {
  state.phase              = 'player';
  const baseVP             = (LEVELS[RunState.levelIndex] && LEVELS[RunState.levelIndex].baseVP) || 3;
  state.vpMax              = baseVP;
  state.vpRemaining        = baseVP;
  state.cardsPlayedThisTurn = 0;
  state.selectedCards      = [];
  state.player.bloodSurgeUsedThisTurn = false;
  state.player.echoActive  = false; // Clear any leftover echo from last turn

  // Reset armor each turn (or retain 50% with Plated Armor)
  if (RunState.playerBoons.includes('platedArmor')) {
    const retained = Math.floor(state.player.armor * 0.5);
    state.player.armor = retained;
    if (retained > 0) {
      log(`🦾 <span class="log-defend">Plated Armor → Retained ${retained} Armor.</span>`);
    }
  } else {
    state.player.armor = 0;
  }

  // Grit: free armor at turn start
  if (RunState.playerBoons.includes('grit')) {
    state.player.armor += 3;
    log(`💪 <span class="log-defend">Grit → +3 Armor at start of turn.</span>`);
  }

  // Reset Blood Trade tracker each turn
  state.player.bloodTradePlayedThisTurn = false;

  // Smolder tick — deal queued delayed damage before draw
  if ((state.player.smolderDamage || 0) > 0) {
    const smolderDmg = state.player.smolderDamage;
    state.player.smolderDamage = 0;
    dealDamageToEnemy(state, smolderDmg);
    log(`<span class="log-damage">🔥 Smolder → ${smolderDmg} delayed damage hits the Golem!</span>`);
    if (checkWin(state)) {
      endGame(state, true);
      return;
    }
  }

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
  const levelConfig = LEVELS[RunState.levelIndex];
  resolveNextIntent(state, levelConfig);

  // Draw 5 cards
  drawCards(state, 5);

  // Log turn header with current intent
  const intent = getIntentForDisplay(state);
  logTurnHeader(state.turn, intent);

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
