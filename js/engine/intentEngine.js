'use strict';

/* ══════════════════════════════════════════
   ENGINE — Intent Engine
   Resolves the next enemy intent each turn using
   a 3-phase algorithm:
     Phase 1: Systemic overrides (highest priority)
     Phase 2: Cooldown / Rule-of-2 filtering
     Phase 3: Weighted probability roll
   
   This module is purely about SELECTION. Execution
   is delegated to the intent's own execute() function.
══════════════════════════════════════════ */

/**
 * Creates the initial intent-tracking sub-state for a new battle.
 * Call this from createInitialState() in state.js.
 * @returns {object}
 */
function createIntentState() {
  return {
    intentCooldowns: {},          // { intentId: turnsRemaining }
    overrideCooldowns: {},        // { overrideIndex: turnsRemaining }
    consecutiveIntentCount: 0,   // How many times lastIntentId has been used in a row
    lastIntentId: null,           // ID of the last executed intent
    currentIntent: null,          // The full resolved intent object (for UI + execution)
    enrageOverrideTriggered: false, // Guard so enrage fires only once
  };
}

// ─── Phase 1: Override resolution ─────────────────────

/**
 * Checks overrides in order. Returns the first override whose
 * condition fires and whose cooldown is 0.
 * @param {object}  state
 * @param {object}  enemyDef     - Entry from ENEMY_CATALOG
 * @param {object}  levelConfig  - Current level entry from LEVELS
 * @returns {object|null} resolved intent object, or null
 */
function resolveOverride(state, enemyDef, levelConfig) {
  const oc = state.enemy.intentState.overrideCooldowns;

  for (let i = 0; i < enemyDef.overrides.length; i++) {
    const override = enemyDef.overrides[i];
    const cd = oc[i] || 0;
    if (cd > 0) continue;                          // Still cooling down
    if (!override.condition(state, levelConfig)) continue; // Condition not met

    // Found a firing override — start its cooldown
    oc[i] = override.maxCooldown;

    // Enrage guard: mark so UI/engine know we're enraged
    if (override.intentId === 'fatalStrike') {
      state.enemy.intentState.enrageOverrideTriggered = true;
    }

    return enemyDef.overrideIntents[override.intentId];
  }
  return null;
}

// ─── Phase 2 & 3: Weighted pool resolution ────────────

/**
 * Selects an intent from the normal probability pool.
 * Respects cooldowns and the Rule-of-2 anti-frustration rule.
 * Falls back to `struggle` if nothing is available.
 * @param {object}  state
 * @param {object}  enemyDef
 * @returns {object} resolved intent object
 */
function resolvePoolIntent(state, enemyDef) {
  const ic        = state.enemy.intentState.intentCooldowns;
  const lastId    = state.enemy.intentState.lastIntentId;
  const lastCount = state.enemy.intentState.consecutiveIntentCount;

  // Build the effective weight list, zeroing out locked intents
  let totalWeight = 0;
  const pool = enemyDef.intents.map(intent => {
    let w = intent.weight;

    // Cooldown check
    if ((ic[intent.id] || 0) > 0) w = 0;

    // Rule-of-2: if this intent was used 2+ times in a row, lock it out
    if (intent.id === lastId && lastCount >= 2) w = 0;

    totalWeight += w;
    return { intent, effectiveWeight: w };
  });

  // Nothing valid? Fall back to struggle
  if (totalWeight === 0) {
    return enemyDef.intents.find(i => i.id === 'struggle');
  }

  // Weighted roll
  let roll = Math.random() * totalWeight;
  for (const { intent, effectiveWeight } of pool) {
    if (effectiveWeight === 0) continue;
    roll -= effectiveWeight;
    if (roll <= 0) return intent;
  }

  // Shouldn't reach here, but just in case
  return enemyDef.intents.find(i => i.id === 'struggle');
}

// ─── Public API ───────────────────────────────────────

/**
 * Main entry point: resolves and CACHES the next intent into
 * state.enemy.intentState.currentIntent. Call this at the
 * START of the player's turn so the UI can display it.
 *
 * Does NOT execute the intent. Call executeCurrentIntent() on enemy turn.
 *
 * @param {object} state
 * @param {object} levelConfig
 */
function resolveNextIntent(state, levelConfig) {
  const enemyDef = ENEMY_CATALOG[levelConfig.enemyId];
  if (!enemyDef) {
    console.error(`[IntentEngine] Unknown enemyId: ${levelConfig.enemyId}`);
    return;
  }

  // If already enraged, always use fatalStrike (override already fired)
  if (state.enemy.enraged) {
    const fi = enemyDef.overrideIntents.fatalStrike;
    state.enemy.intentState.currentIntent = _stampDamage(fi, levelConfig);
    return;
  }

  // Phase 1: systemic overrides
  const overrideIntent = resolveOverride(state, enemyDef, levelConfig);
  if (overrideIntent) {
    state.enemy.intentState.currentIntent = _stampDamage(overrideIntent, levelConfig);
    return;
  }

  // Phase 2 + 3: probability pool
  const poolIntent = resolvePoolIntent(state, enemyDef);
  state.enemy.intentState.currentIntent = _stampDamage(poolIntent, levelConfig);
}

/**
 * Executes the currently cached intent and advances all internal
 * timers. Call this during the ENEMY phase.
 *
 * @param {object} state
 * @param {object} levelConfig
 */
function executeCurrentIntent(state, levelConfig) {
  const intent = state.enemy.intentState.currentIntent;
  if (!intent) return;

  intent.execute(state, levelConfig);
  _recordIntentUsage(state, intent);
  _tickCooldowns(state);
}

// ─── Internal helpers ─────────────────────────────────

/**
 * Returns a shallow copy of the intent with a resolved `displayDamage`
 * property so the renderer can show a numeric value without calling execute().
 * Each intent may optionally define `getDamage(levelConfig)` to expose its
 * damage formula; otherwise `damage` field or 0 is used.
 * @param {object} intent
 * @param {object} levelConfig
 * @returns {object}
 */
function _stampDamage(intent, levelConfig) {
  if (!intent) return intent;
  const displayDamage = typeof intent.getDamage === 'function'
    ? intent.getDamage(levelConfig)
    : (typeof intent.damage === 'number' ? intent.damage : 0);
  return { ...intent, displayDamage };
}

/**
 * Updates lastIntentId and consecutiveIntentCount, and sets
 * the cooldown for the just-used pool intent (if it has one).
 * @param {object} state
 * @param {object} intent
 */
function _recordIntentUsage(state, intent) {
  const is = state.enemy.intentState;

  // Update consecutive count
  if (intent.id === is.lastIntentId) {
    is.consecutiveIntentCount++;
  } else {
    is.consecutiveIntentCount = 1;
  }
  is.lastIntentId = intent.id;

  // Start cooldown for pool intents that have one
  if (typeof intent.maxCooldown === 'number' && intent.maxCooldown > 0) {
    is.intentCooldowns[intent.id] = intent.maxCooldown;
  }
}

/**
 * Decrements all active cooldowns by 1 each enemy turn.
 * @param {object} state
 */
function _tickCooldowns(state) {
  const is = state.enemy.intentState;

  for (const id in is.intentCooldowns) {
    if (is.intentCooldowns[id] > 0) {
      is.intentCooldowns[id]--;
    }
  }
  for (const idx in is.overrideCooldowns) {
    if (is.overrideCooldowns[idx] > 0) {
      is.overrideCooldowns[idx]--;
    }
  }
}
