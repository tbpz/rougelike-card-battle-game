'use strict';

/* ══════════════════════════════════════════
   ENGINE — Combat Engine (Core)
   Orchestrates win/lose conditions, enemy AI,
   Blood Surge, and game-over state transitions.
   
   Turn flow  → turnManager.js
   Card play  → cardPlayManager.js
   HP routing → effectBus.js

   NO DOM ACCESS. All UI calls go through renderer.js.
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
  return { name: '—', icon: '⚙️', type: 'safe', damage: 0 };
}

/**
 * Executes the cached enemy intent, advances cooldowns,
 * and pre-resolves the NEXT intent so the UI can display it
 * immediately after the enemy acts.
 * @param {object} state
 */
function enemyAct(state) {
  const levelConfig = LEVELS[RunState.levelIndex];
  executeCurrentIntent(state, levelConfig);

  // After acting, update the enraged flag so the UI can react.
  // The 'enraged' css class is applied by renderer via updateEnemyUI().
  if (state.enemy.intentState.enrageOverrideTriggered && !state.enemy.enraged) {
    state.enemy.enraged = true;
    log(`<span class="log-blood">☠️ The Golem ENRAGES! Fatal Strike every turn!</span>`);
    triggerShake();
  }

  applyLastRitesIfNeeded(state);
}

// ─── Blood Surge ───────────────────────────────────────

/**
 * Triggers Blood Surge: +1 VP, +1 Blood Debt
 */
function triggerBloodSurge() {
  if (state.phase !== 'player') return;
  if (state.player.bloodSurgeUsedThisTurn) return;

  state.player.bloodSurgeUsedThisTurn = true;
  state.vpRemaining += 1;
  state.vpMax       += 1;
  state.player.bloodDebt += 1;
  log(`<span class="log-blood">💉 Blood Surge! +1 VP, +1 Blood Debt. Total Debt: ${state.player.bloodDebt}</span>`);

  if (typeof updatePlayerUI === 'function') updatePlayerUI(state);
  if (typeof updatePlayCounter === 'function') updatePlayCounter(state);
  if (typeof updatePlaySelectedBtn === 'function') updatePlaySelectedBtn();
  if (typeof updateEndTurnBtn === 'function') updateEndTurnBtn();
  if (typeof renderHand === 'function') renderHand(state);
  if (typeof updateBloodSurgeBtn === 'function') updateBloodSurgeBtn(state);
}

// ─── Game Over ─────────────────────────────────────────

/**
 * Resets all run-scoped globals and returns to the intro screen.
 * Shared by both defeat and true-victory reset flows.
 */
function _resetRun() {
  RunState.reset();
  if (typeof updateActiveBoonsUI === 'function') updateActiveBoonsUI();
}

/**
 * Transitions to the end-game screen (win or lose).
 * State mutation only — DOM is managed by showResultOverlay() in renderer.js.
 * @param {object} state
 * @param {boolean} playerWon
 */
function endGame(state, playerWon) {
  state.phase = 'over';
  showResultOverlay(state, playerWon);
}
