'use strict';

/* ══════════════════════════════════════════
   ENGINE — Effect Bus
   The single gateway for all HP mutations and reactive effects.
   ALL damage to player or enemy must route through here.
   This ensures triggered boons (War Tax, Thorns, Last Rites)
   always fire reliably regardless of damage source.

   NO DOM ACCESS: Visual effects are signaled via state._pendingEffects[].
   The UI layer (renderer.js) consumes and executes them via
   processPendingEffects(state).
══════════════════════════════════════════ */

/**
 * Deals damage to the enemy, respecting their armor.
 * Signals a flash animation via _pendingEffects (no direct DOM access).
 * ALWAYS use this instead of mutating state.enemy.hp directly.
 * @param {object} state
 * @param {number} dmg - Raw damage amount (before armor)
 */
function dealDamageToEnemy(state, dmg) {
  const blocked = Math.min(state.enemy.armor, dmg);
  state.enemy.armor = Math.max(0, state.enemy.armor - dmg);
  const realDmg = dmg - blocked;

  if (blocked > 0) {
    log(`<span class="log-system">🛡️ Golem's Shield absorbed ${blocked} damage.</span>`);
  }
  if (realDmg <= 0) {
    updateEnemyUI(state);
    return;
  }

  state.enemy.hp = Math.max(0, state.enemy.hp - realDmg);
  // Signal UI layer to apply flash animation
  state._pendingEffects = state._pendingEffects || [];
  state._pendingEffects.push({ type: 'flash-enemy' });
  updateEnemyUI(state);
}

/**
 * Deals armor-piercing damage to the enemy — bypasses all enemy armor.
 * Used by cards like Overflow. Still routes through the bus so other
 * reactions (e.g., future boons) can hook in.
 * @param {object} state
 * @param {number} dmg - True damage (ignores enemy armor)
 */
function dealArmorPiercingDamage(state, dmg) {
  if (dmg <= 0) return;
  state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
  state._pendingEffects = state._pendingEffects || [];
  state._pendingEffects.push({ type: 'flash-enemy' });
  updateEnemyUI(state);
}

/**
 * Applies self-inflicted damage to the player (true damage, ignores armor).
 * Routes through the effect bus so War Tax fires correctly.
 * @param {object} state
 * @param {number} amount - HP to remove
 */
function applyPlayerSelfDamage(state, amount) {
  if (amount <= 0) return;

  const blocked = Math.min(state.player.armor, amount);
  const realDamage = amount - blocked;

  state.player.armor = Math.max(0, state.player.armor - blocked);
  state.player.hp = Math.max(0, state.player.hp - realDamage);

  if (blocked > 0) {
    log(`<span class="log-system">🛡️ Shield absorbed ${blocked} self-damage.</span>`);
  }

  // War Tax: self-damage also triggers it
  if (realDamage > 0 && RunState.playerBoons.includes('warTax')) {
    dealDamageToEnemy(state, 2);
    log(`⚖️ <span class="log-damage">War Tax → 2 damage returned to Golem!</span>`);
  }
}

/**
 * Applies enemy-attack damage to the player, respecting armor.
 * Triggers Thorns and War Tax reactions if applicable.
 * @param {object} state
 * @param {object} intent - The enemy intent that caused the damage
 */
function applyEnemyAttackDamage(state, intent) {
  const blocked    = Math.min(state.player.armor, intent.damage);
  const realDamage = intent.damage - blocked;
  state.player.armor = Math.max(0, state.player.armor - intent.damage);
  state.player.hp    = Math.max(0, state.player.hp - realDamage);

  if (blocked > 0) {
    log(`<span class="log-enemy">💥 Golem uses ${intent.name} for ${intent.damage}. ${blocked} blocked → ${realDamage} damage.</span>`);
  } else {
    log(`<span class="log-enemy">💥 Golem uses ${intent.name} for ${intent.damage} damage!</span>`);
  }

  // Reactive boons — only trigger on real (unblocked) damage
  if (realDamage > 0 && RunState.playerBoons.includes('thorns')) {
    dealDamageToEnemy(state, 3);
    log(`🌵 <span class="log-damage">Thorns → 3 damage returned to Golem!</span>`);
  }
  if (realDamage > 0 && RunState.playerBoons.includes('warTax')) {
    dealDamageToEnemy(state, 2);
    log(`⚖️ <span class="log-damage">War Tax → 2 damage returned to Golem!</span>`);
  }
}

/**
 * Checks and applies the Last Rites survival boon.
 * Must be called AFTER any HP change that could bring player to 0,
 * and BEFORE checkLose() is evaluated.
 * @param {object} state
 */
function applyLastRitesIfNeeded(state) {
  if (
    state.player.hp <= 0 &&
    RunState.playerBoons.includes('lastRites') &&
    !RunState.consumedBoons.includes('lastRites')
  ) {
    state.player.hp = 1;
    RunState.consumedBoons.push('lastRites');
    log(`⚰️ <span class="log-buff">Last Rites activates! You survive at 1 HP!</span>`);
    updateActiveBoonsUI();
  }
}
